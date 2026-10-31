/* ═══════════════════════════════════════════════════════════════════════════
   STI V2.0 — Sauvegarde de secours de TOUTE la plateforme (v598)

   Les sauvegardes existantes ne couvrent que la BASE :
     • `assets/js/sauvegarde.js`  → les 18 tables Supabase, en .json / .json.gz ;
     • `documents/sql/sauvegarde-auto-drive.gs` → le même export, chaque nuit,
       vers le dossier Drive « STI — Sauvegardes base ».
   Ni l'un ni l'autre ne contient le CODE du site, et aucun ne contient les
   instructions permettant de reconstruire le schéma Supabase. Si le dépôt
   GitHub disparaissait, la base serait sauvegardée mais le site perdu.

   Ce script comble ce trou. Il produit une archive autonome qui contient :
     • les fichiers de la plateforme (HTML, CSS, JS, JSON, images, PDF…) ;
     • `_secours/` : le schéma Supabase reconstitué dans l'ordre, les requêtes
       de vérification, les instructions de restauration, et un manifeste avec
       l'empreinte SHA-256 de chaque fichier — inclus ou écarté.

   Trois volumes, pour tenir dans la limite d'envoi de Google Drive (100 Mo) :

     node outils/secours/construire-secours.mjs                  → CODE      (~35 Mo)
     node outils/secours/construire-secours.mjs --volume documents → DOCUMENTS (~70 Mo)
     node outils/secours/construire-secours.mjs --volume tout    → TOUT      (plusieurs Go)

   CODE contient le site utilisable tel quel. DOCUMENTS contient le livre et
   les fichiers lourds (plus de 2 Mo). TOUT contient les vidéos et les sons —
   à réserver à un disque externe, jamais à un envoi Drive.

   Aucune dépendance : le TAR est écrit à la main (format ustar + noms longs
   GNU) puis compressé par le module natif `node:zlib`.
   ═══════════════════════════════════════════════════════════════════════════ */
import { createHash } from 'node:crypto';
import { createWriteStream, existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { createGzip } from 'node:zlib';
import { execFileSync } from 'node:child_process';

const RACINE = resolve(dirname(new URL(import.meta.url).pathname), '..', '..');

/* ── 1. Ce qui entre dans la sauvegarde ───────────────────────────────────── */

/* Dossiers et fichiers qui ne font pas partie de la plateforme livrée. */
const JAMAIS = [
  /(^|\/)\.git(\/|$)/,
  /(^|\/)node_modules(\/|$)/,
  /(^|\/)dist-secours(\/|$)/,
  /(^|\/)\.arena(\/|$)/,
  /(^|\/)\.cache(\/|$)/,
  /(^|\/)\.vite(\/|$)/,
  /(^|\/)__pycache__(\/|$)/,
];

/* Médias lourds : présents dans le dépôt, mais ils pèsent près d'un gigaoctet.
   Ils ne sont dans aucune archive envoyée à Drive ; ils restent listés, avec
   leur empreinte, dans le manifeste du volume `tout`. */
const MEDIAS = [/^assets\/videos\//, /^assets\/audio\//, /^assets\/streams\//];
const EXT_MEDIAS = /\.(mp4|m4a|mp3|wav|ogg|webm|mov|zip|rar|7z)$/i;

const SEUIL_DOCUMENTS = 2 * 1024 * 1024; // au-delà de 2 Mo : volume « documents »
const SEUIL_MEDIAS = 8 * 1024 * 1024;    // au-delà de 8 Mo : média, jamais dans Drive

/* À quel volume appartient un fichier ?
     'code'      → le site utilisable, léger ;
     'documents' → le livre, les images lourdes, les PDF ;
     'medias'    → les vidéos et les sons (volume « tout » seulement). */
function volumeDe(chemin, octets) {
  if (MEDIAS.some((r) => r.test(chemin)) || EXT_MEDIAS.test(chemin)) return 'medias';
  if (octets > SEUIL_MEDIAS) return 'medias';
  if (chemin.startsWith('documents/') || octets > SEUIL_DOCUMENTS) return 'documents';
  return 'code';
}

/* ── 2. Inventaire ────────────────────────────────────────────────────────── */

function git(args) {
  return execFileSync('git', args, { cwd: RACINE, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

function versionPubliee() {
  try {
    const sw = readFileSync(join(RACINE, 'sw.js'), 'utf8');
    const m = sw.match(/var VERSION_PUBLIEE = "(v\d+)"/);
    return m ? m[1] : 'inconnue';
  } catch {
    return 'inconnue';
  }
}

function commitCourant() {
  try {
    return git(['rev-parse', 'HEAD']).trim();
  } catch {
    return 'inconnu';
  }
}

/* Tous les fichiers de la plateforme : ceux suivis par git, plus ceux créés
   depuis et non encore ajoutés (sinon une page écrite ce matin serait absente
   de la sauvegarde du soir). Les fichiers ignorés par .gitignore sont exclus
   d'office : `.gitignore` décrit déjà ce qui n'appartient pas au dépôt. */
function listerFichiers() {
  const sortie = git(['ls-files', '--cached', '--others', '--exclude-standard', '-z']);
  const vus = new Set();
  for (const brut of sortie.split('\0')) {
    if (!brut) continue;
    const chemin = brut.split(sep).join('/');
    if (JAMAIS.some((r) => r.test(chemin))) continue;
    vus.add(chemin);
  }
  return [...vus].sort((a, b) => a.localeCompare(b, 'fr'));
}

/* ── 3. Écriture TAR (ustar + noms longs GNU) ─────────────────────────────── */

function entete(chemin, taille, mtime, type = '0') {
  const bloc = Buffer.alloc(512, 0);
  const nom = Buffer.from(chemin, 'utf8');
  let prefixe = '';
  let court = chemin;
  if (nom.length > 100) {
    /* Un nom de plus de 100 octets tient parfois en « prefixe + nom » (255). */
    const coupe = chemin.lastIndexOf('/', Math.min(chemin.length - 1, 155));
    if (coupe > 0 && Buffer.byteLength(chemin.slice(coupe + 1)) <= 100) {
      prefixe = chemin.slice(0, coupe);
      court = chemin.slice(coupe + 1);
    }
  }
  const ecrire = (valeur, decalage, longueur) => {
    const b = Buffer.from(valeur, 'utf8');
    b.copy(bloc, decalage, 0, Math.min(b.length, longueur));
  };
  ecrire(court, 0, 100);
  ecrire('0000644', 100, 8);           // droits
  ecrire('0000000', 108, 8);           // uid
  ecrire('0000000', 116, 8);           // gid
  ecrire(taille.toString(8).padStart(11, '0'), 124, 12);
  ecrire(Math.floor(mtime / 1000).toString(8).padStart(11, '0'), 136, 12);
  ecrire('        ', 148, 8);          // somme de contrôle : espaces le temps du calcul
  ecrire(type, 156, 1);
  ecrire('ustar\0', 257, 6);
  ecrire('00', 263, 2);
  if (prefixe) ecrire(prefixe, 345, 155);

  let somme = 0;
  for (const octet of bloc) somme += octet;
  ecrire(somme.toString(8).padStart(6, '0') + '\0 ', 148, 8);
  return bloc;
}

function pad(taille) {
  const reste = taille % 512;
  return reste === 0 ? Buffer.alloc(0) : Buffer.alloc(512 - reste, 0);
}

function ecrireEntree(sortie, cheminArchive, contenu, mtime, type = '0') {
  const donnees = Buffer.isBuffer(contenu) ? contenu : Buffer.from(contenu, 'utf8');
  /* Nom trop long pour « prefixe + nom » : on ajoute une entrée GNU « L ». */
  if (Buffer.byteLength(cheminArchive) > 100 && cheminArchive.length > 255) {
    const nom = Buffer.concat([Buffer.from(cheminArchive, 'utf8'), Buffer.alloc(1, 0)]);
    sortie.write(entete('././@LongLink', nom.length, mtime, 'L'));
    sortie.write(nom);
    sortie.write(pad(nom.length));
  }
  sortie.write(entete(cheminArchive, donnees.length, mtime, type));
  if (donnees.length) sortie.write(donnees);
  sortie.write(pad(donnees.length));
}

/* ── 4. Les documents de secours ──────────────────────────────────────────── */

function hacher(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

/* Le schéma Supabase reconstitué : la base initiale, puis les migrations dans
   l'ordre de leur nom (elles sont horodatées AAAAAMMJJ). */
function schemaComplet() {
  const morceaux = [];
  const entete = [
    '-- ═══════════════════════════════════════════════════════════════════════',
    '-- STI V2.0 — SCHÉMA COMPLET RECONSTITUÉ (sauvegarde de secours)',
    '--',
    '-- Ce fichier est fabriqué automatiquement par',
    '-- outils/secours/construire-secours.mjs : ne pas le modifier à la main.',
    '--',
    '-- Il contient, dans l\'ordre d\'exécution :',
    '--   1. la base initiale (tools/supabase-schema.sql) ;',
    '--   2. les migrations de supabase/migrations, triées par nom.',
    '--',
    '-- Sur un projet Supabase NEUF et VIDE, exécuter ce fichier d\'un seul bloc',
    '-- dans l\'éditeur SQL recrée les tables, les types, les fonctions, les',
    '-- déclencheurs, les politiques RLS et les droits. Les DONNÉES ne sont pas',
    '-- ici : elles vivent dans l\'archive .json.gz produite par l\'application',
    '-- (voir RESTAURATION.md, étape 2.3).',
    '-- ═══════════════════════════════════════════════════════════════════════',
    '',
  ].join('\n');
  morceaux.push(entete);

  const base = join(RACINE, 'tools', 'supabase-schema.sql');
  if (existsSync(base)) {
    morceaux.push(
      '-- ─────────────────────────────────────────────────────────────────────',
      '-- 1. BASE INITIALE — tools/supabase-schema.sql',
      '-- ─────────────────────────────────────────────────────────────────────',
      '',
      readFileSync(base, 'utf8'),
      ''
    );
  }

  const dossier = join(RACINE, 'supabase', 'migrations');
  const fichiers = existsSync(dossier)
    ? readdirSync(dossier).filter((f) => f.endsWith('.sql')).sort()
    : [];
  fichiers.forEach((f, i) => {
    morceaux.push(
      '-- ─────────────────────────────────────────────────────────────────────',
      `-- 2.${i + 1} MIGRATION — supabase/migrations/${f}`,
      '-- ─────────────────────────────────────────────────────────────────────',
      '',
      readFileSync(join(dossier, f), 'utf8'),
      ''
    );
  });

  return { texte: morceaux.join('\n'), migrations: fichiers };
}

/* Les requêtes de contrôle : elles répondent à « la base restaurée est-elle
   complète et protégée ? » sans avoir à se souvenir de rien. */
function verificationSql() {
  return `-- ═══════════════════════════════════════════════════════════════════════
-- STI V2.0 — VÉRIFICATION DE LA BASE APRÈS RESTAURATION
-- Copier ce fichier dans l'éditeur SQL Supabase et lire les résultats.
-- Chaque bloc dit ce qu'on attend ; si un résultat diffère, la restauration
-- n'est pas terminée.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Les tables du site sont-elles là ? (attendu : les 18 tables, triées)
select table_name
from information_schema.tables
where table_schema = 'public' and table_type = 'BASE TABLE'
order by table_name;

-- 2. La protection par ligne (RLS) est-elle active partout ? (security = true)
select tablename, rowsecurity as security_active
from pg_tables
where schemaname = 'public'
order by rowsecurity, tablename;

-- 3. Combien de politiques protègent chaque table ? (aucune table à 0)
select tablename, count(*) as nb_politiques
from pg_policies
where schemaname = 'public'
group by tablename
order by nb_politiques, tablename;

-- 4. Les fonctions ont-elles un search_path figé ? (aucune ligne attendue)
select p.proname
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and (p.proconfig is null or not exists (
        select 1 from unnest(p.proconfig) c where c like 'search_path=%'))
order by p.proname;

-- 5. Les données sont-elles revenues ? (comparer aux compteurs du manifeste)
select 'profiles' as table_sauvegardee, count(*) from public.profiles
union all select 'acces', count(*) from public.acces
union all select 'sti_progressions', count(*) from public.sti_progressions
union all select 'sti_quiz_parties', count(*) from public.sti_quiz_parties
union all select 'sti_quiz_reponses', count(*) from public.sti_quiz_reponses
union all select 'sti_quiz_sessions', count(*) from public.sti_quiz_sessions
union all select 'sti_quiz_vus', count(*) from public.sti_quiz_vus
union all select 'sti_diagnostics', count(*) from public.sti_diagnostics
union all select 'sti_observations', count(*) from public.sti_observations
union all select 'labo_devices', count(*) from public.labo_devices
union all select 'labo_device_sessions', count(*) from public.labo_device_sessions
union all select 'labo_device_messages', count(*) from public.labo_device_messages
union all select 'badges_labo', count(*) from public.badges_labo
union all select 'app_config_public', count(*) from public.app_config_public
union all select 'push_subscriptions', count(*) from public.push_subscriptions
union all select 'sti_quiz_xp_compteurs', count(*) from public.sti_quiz_xp_compteurs
union all select 'sti_quiz_xp_operations', count(*) from public.sti_quiz_xp_operations
union all select 'acces_sauvegardes', count(*) from public.acces_sauvegardes
order by table_sauvegardee;

-- 6. Le stockage des photos est-il rétabli ? (attendu : le bucket « photos »)
select id, name, public from storage.buckets order by id;

-- 7. Aucun secret ne doit sortir par les RPC publiques : la colonne
--    colonne secret_hash de badges_labo est exclue par admin_sauvegarde_tables_annexes().
select count(*) as lignes_badges from public.badges_labo;
`;
}

function restaurationMd({ version, commit, date, migrations }) {
  return `# Remettre la plateforme STI V2.0 en service

Sauvegarde du **${date}**, version **${version}**, commit \`${commit}\`.
L'archive est un simple \`.tar.gz\` : 7-Zip, WinRAR ou la commande \`tar\`
l'ouvrent sans rien installer d'autre.

Deux choses sont à remettre en service, dans cet ordre : **le site**, puis
**la base**.

---

## 1. Le site (les fichiers)

1. Décompresser l'archive dans un dossier vide, par exemple \`STI-V2.0\`.
   Le sous-dossier \`plateforme/\` contient le dépôt tel qu'il était à la
   version \`${version}\`.
2. Ouvrir \`plateforme/index.html\`. Le site doit s'afficher, même sans
   connexion. La racine du site est \`index.html\` : c'est une PWA statique,
   aucun serveur particulier n'est nécessaire — sauf pour les projets en PHP
   du dossier \`projets/\`, qui demandent PHP et MySQL.
3. Pour republier : créer un dépôt Git et y pousser le contenu, ou déposer le
   dossier chez l'hébergeur.

**Vérifier que la copie est intacte.** L'archive contient
\`_secours/empreintes.txt\`, la liste des empreintes SHA-256 :

\`\`\`bash
# depuis le dossier qui contient « plateforme/ » et « _secours/ »
sha256sum -c _secours/empreintes.txt      # Linux
shasum -a 256 -c _secours/empreintes.txt  # macOS
\`\`\`

Sous Windows : \`certutil -hashfile <fichier> SHA256\`, fichier par fichier, ou
7-Zip qui contrôle l'archive à l'ouverture.

---

## 2. La base Supabase

### 2.1 Créer le projet

1. Sur [supabase.com](https://supabase.com), créer un projet **vide**
   (nom suggéré : \`sti-v2\`, région la plus proche de Tunis).
2. Relever dans **Project Settings → API** :
   - \`Project URL\` (ex. \`https://xxxx.supabase.co\`) ;
   - la clé **publishable / anon** (elle va dans le navigateur) ;
   - la clé **service_role** (elle ne quitte jamais le serveur).

### 2.2 Recréer les tables et les protections

3. Ouvrir **SQL Editor**, coller **tout** le fichier
   \`_secours/supabase/01-schema-complet.sql\`, puis exécuter.
   Il enchaîne la base initiale et les ${migrations.length} migrations dans
   l'ordre chronologique. Cela prend une à deux minutes : c'est normal.

### 2.3 Remettre les données

4. Récupérer la dernière archive de données
   \`sti-sauvegarde-AAAA-MM-JJ.json.gz\` dans le Drive du professeur,
   dossier « STI — Sauvegardes base ». C'est le fichier produit chaque nuit
   par \`documents/sql/sauvegarde-auto-drive.gs\`.
5. Le décompresser (\`gunzip\`) : on obtient un \`.json\` de la forme
   \`{ version, date, tables: { profiles: [...], acces: [...], … } }\`.
6. Réinjecter les lignes — le plus simple est la page d'administration du
   site (\`admin.html\`, section **💾 Sauvegarde complète**), qui sait relire
   ce fichier. Sinon, table par table avec \`psql\` :

   \`\`\`bash
   jq -c '.tables.profiles[]' sti-sauvegarde-AAAA-MM-JJ.json > profiles.ndjson
   psql "$SUPABASE_DB_URL" -c "\\copy public.profiles from 'profiles.ndjson' with (format csv)"
   \`\`\`

   **Ordre à respecter** : \`profiles\` d'abord (elle référence
   \`auth.users\`), puis \`acces\`, \`sti_progressions\`, les tables
   \`sti_quiz_*\`, les tables \`labo_*\`, et enfin \`app_config_public\`.

### 2.4 Vérifier

7. Exécuter \`_secours/supabase/02-verification.sql\`. On attend :
   18 tables dans \`public\`, la RLS active partout, aucune table sans
   politique, aucune fonction sans \`search_path\`, et des compteurs de lignes
   cohérents avec le manifeste.

### 2.5 Rebrancher le site

8. Dans \`plateforme/assets/js/config.js\`, remplacer l'URL et la clé
   publishable par celles du nouveau projet.
9. Recréer le bucket de photos : ouvrir \`migration-photos-bucket.html\`
   (à la racine du site) dans un navigateur connecté en administrateur, ou
   exécuter à la main :
   \`insert into storage.buckets (id, name, public) values ('photos','photos',true);\`
   puis les politiques de \`20261102_photos_contraintes_v561.sql\`.
10. Se connecter avec \`aymenessouyah@gmail.com\` : la fonction \`est_admin()\`,
    recréée par le schéma, rend l'administration accessible.

---

## 3. La sauvegarde automatique de la base (Google Drive)

Elle vit dans Google Apps Script, pas dans ce dépôt. Son code source est
conservé ici : \`plateforme/documents/sql/sauvegarde-auto-drive.gs\`.

1. Ouvrir <https://script.google.com> et créer un projet.
2. Coller le contenu de \`sauvegarde-auto-drive.gs\`.
3. **Paramètres du projet → Propriétés du script** :
   - \`SUPABASE_URL\` — l'adresse du projet Supabase ;
   - \`SUPABASE_SERVICE_KEY\` — la clé service_role (jamais dans Git) ;
   - \`DRIVE_FOLDER_ID\` — l'identifiant du dossier Drive de destination.
4. Exécuter \`installer()\` une fois : le déclencheur quotidien de 02 h,
   heure de Tunis, est posé.

---

## 4. Les fichiers qui ne sont pas dans cette archive

Trois volumes complémentaires sont produits par
\`outils/secours/construire-secours.mjs\` :

| Volume | Contenu | Poids | Pour Drive |
|---|---|---|---|
| **CODE** | tout le site utilisable | ~35 Mo | oui |
| **DOCUMENTS** | le livre, les PDF, les fichiers de plus de 2 Mo | ~70 Mo | oui |
| **TOUT** | les vidéos et les sons en plus | plusieurs Go | non |

Si vous n'avez que le volume CODE : le site fonctionne, mais le livre et les
gros documents manquent. Ils sont listés **avec leur empreinte** dans
\`manifeste.json\` (section \`dans_les_autres_volumes\`) et se récupèrent :

1. depuis le dépôt GitHub, à la version \`${version}\` ;
2. ou en relançant \`node outils/secours/construire-secours.mjs --volume documents\`
   puis \`--volume tout\` sur une machine qui a le dépôt.

Les vidéos et les sons ne sont dans aucun envoi Drive : ils restent sur le
dépôt GitHub, qui les contient intégralement.

---

## 5. En cas de doute

- L'archive est **lisible sans le site** : tout est dedans, y compris ce mode
  d'emploi.
- \`_secours/manifeste.json\` dit exactement ce qui a été sauvegardé, quand, et
  depuis quel commit.
- Les requêtes de contrôle sont dans \`_secours/supabase/02-verification.sql\`.
- Cette archive ne contient **aucune donnée d'élève** : les données vivent
  dans les \`.json.gz\` du Drive. Les deux sauvegardes sont complémentaires.
`;
}

function lireMoi({ version, commit, date, volume, nbInclus, autres, migrations }) {
  const resume = {
    code: 'le site utilisable tel quel (pages, styles, scripts, images, cours, exercices, tests, outils)',
    documents: 'le livre, les PDF et les fichiers lourds (plus de 2 Mo)',
    tout: 'absolument tout, vidéos et sons compris',
  }[volume];
  return `STI V2.0 — SAUVEGARDE DE SECOURS DE LA PLATEFORME
================================================

Version sauvegardée : ${version}
Commit               : ${commit}
Fabriquée le         : ${date}
Volume               : ${volume.toUpperCase()} — ${resume}

CE QUE CONTIENT CETTE ARCHIVE
-----------------------------
plateforme/                    ${nbInclus} fichiers de la plateforme
_secours/LISEZ-MOI.txt         ce texte
_secours/manifeste.json        la liste complète avec les empreintes SHA-256
_secours/empreintes.txt        les mêmes empreintes, pour « sha256sum -c »
_secours/RESTAURATION.md       comment tout remettre en service, pas à pas
_secours/supabase/             le schéma de la base reconstitué (${migrations.length} migrations)
                               et les requêtes de vérification

CE QUI N'EST PAS DANS CETTE ARCHIVE
-----------------------------------
${autres.length ? `${autres.length} fichier(s), listés dans manifeste.json avec leur empreinte :`
    + '\n' + autres.slice(0, 12).map((f) => `  - ${f.chemin} (${(f.octets / 1048576).toFixed(1)} Mo, volume ${f.volume})`).join('\n')
    + (autres.length > 12 ? `\n  … et ${autres.length - 12} autres.` : '')
    : 'Rien : ce volume contient tous les fichiers de la plateforme.'}

Les volumes se complètent : CODE (le site), DOCUMENTS (le livre et les gros
fichiers), TOUT (les vidéos et les sons). Voir la section 4 de
RESTAURATION.md.

PAR OÙ COMMENCER
----------------
1. Décompresser l'archive dans un dossier vide.
2. Ouvrir _secours/RESTAURATION.md et suivre les étapes dans l'ordre.
3. Si seul le site vous intéresse : le dossier plateforme/ s'ouvre directement
   (index.html), rien d'autre n'est nécessaire.

RAPPEL
------
Cette archive ne contient AUCUNE donnée d'élève : les données de la base sont
sauvegardées séparément chaque nuit dans le Drive du professeur (dossier
« STI — Sauvegardes base », fichiers sti-sauvegarde-AAAA-MM-JJ.json.gz).
Le code ici, les données là-bas : les deux sont nécessaires.
`;
}

/* ── 5. Le programme ──────────────────────────────────────────────────────── */

function argument(nom) {
  const i = process.argv.indexOf(nom);
  return i > 0 && i + 1 < process.argv.length ? process.argv[i + 1] : null;
}

const VOLUMES = ['code', 'documents', 'tout'];

async function main(options = {}) {
  const volume = options.volume || argument('--volume') || 'code';
  if (!VOLUMES.includes(volume)) {
    throw new Error(`Volume inconnu : ${volume} (attendu : ${VOLUMES.join(', ')})`);
  }
  const version = versionPubliee();
  const commit = commitCourant();
  const maintenant = new Date();
  const date = maintenant.toISOString().slice(0, 10);
  const dossierSortie = resolve(options.sortie || argument('--sortie') || join(RACINE, 'dist-secours'));
  mkdirSync(dossierSortie, { recursive: true });

  const { texte: schema, migrations } = schemaComplet();
  const nomArchive = `sti-plateforme-${volume.toUpperCase()}-${version}-${date}.tar.gz`;
  const cheminArchive = join(dossierSortie, nomArchive);

  console.log(`STI V2.0 — sauvegarde de secours ${version} (${commit.slice(0, 8)}) — volume ${volume.toUpperCase()}`);

  const fichiers = listerFichiers();

  /* Premier passage : classer sans lire le contenu (seules les tailles sont
     nécessaires), pour savoir exactement ce qui sera écrit et ce qui manque. */
  const plan = [];
  const autres = [];
  for (const chemin of fichiers) {
    let infos;
    try {
      infos = await stat(join(RACINE, chemin));
    } catch {
      continue; // fichier supprimé entre l'inventaire et la lecture
    }
    if (!infos.isFile()) continue;
    const classe = volumeDe(chemin, infos.size);
    const dedans = volume === 'tout' ? true : classe === volume;
    if (dedans) plan.push({ chemin, octets: infos.size, mtime: infos.mtimeMs, classe });
    else autres.push({ chemin, octets: infos.size, volume: classe });
  }

  /* Les données passent par le compresseur ; `pipeline` les envoie dans le
     fichier. Rien n'est gardé en mémoire au-delà d'un fichier à la fois. */
  const compression = createGzip({ level: 9 });
  const flux = pipeline(compression, createWriteStream(cheminArchive));

  const inclus = [];
  let octetsInclus = 0;
  for (const entree of plan) {
    const contenu = await readFile(join(RACINE, entree.chemin));
    ecrireEntree(compression, 'plateforme/' + entree.chemin, contenu, entree.mtime);
    inclus.push({
      chemin: entree.chemin,
      octets: entree.octets,
      sha256: hacher(contenu),
      volume: entree.classe,
    });
    octetsInclus += entree.octets;
    if (inclus.length % 200 === 0) process.stdout.write(`\r  ${inclus.length} fichiers…`);
  }

  /* Les documents de secours, les mêmes dans chaque volume. */
  const manifeste = {
    plateforme: 'STI V2.0',
    volume,
    version,
    commit,
    fabriquee_le: maintenant.toISOString(),
    fichiers_inclus: inclus.length,
    octets_inclus: octetsInclus,
    migrations_base: migrations,
    fichiers: inclus,
    dans_les_autres_volumes: autres,
  };
  const empreintes = inclus
    .map((f) => `${f.sha256}  plateforme/${f.chemin}`)
    .join('\n') + '\n';

  const documents = [
    ['_secours/LISEZ-MOI.txt', lireMoi({ version, commit, date, volume, nbInclus: inclus.length, autres, migrations })],
    ['_secours/manifeste.json', JSON.stringify(manifeste, null, 2) + '\n'],
    ['_secours/empreintes.txt', empreintes],
    ['_secours/RESTAURATION.md', restaurationMd({ version, commit, date, migrations })],
    ['_secours/supabase/01-schema-complet.sql', schema],
    ['_secours/supabase/02-verification.sql', verificationSql()],
    ['_secours/supabase/RESTAURATION.md', restaurationMd({ version, commit, date, migrations })],
  ];
  for (const [chemin, contenu] of documents) {
    ecrireEntree(compression, chemin, contenu, maintenant.getTime());
  }

  /* Fin du TAR : deux blocs nuls. */
  compression.write(Buffer.alloc(1024, 0));
  compression.end();
  await flux;

  const taille = statSync(cheminArchive).size;
  console.log(`\n  ${inclus.length} fichiers inclus (${(octetsInclus / 1048576).toFixed(1)} Mo bruts)`);
  console.log(`  ${autres.length} fichiers dans les autres volumes (empreintes conservées)`);
  console.log(`  ${migrations.length} migrations réunies dans le schéma`);
  console.log(`\nArchive : ${cheminArchive}`);
  console.log(`Taille  : ${(taille / 1048576).toFixed(1)} Mo`);

  return { cheminArchive, nomArchive, taille, inclus: inclus.length, autres: autres.length, volume };
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  main().catch((err) => {
    console.error('Échec de la sauvegarde :', err);
    process.exit(1);
  });
}

export { listerFichiers, schemaComplet, verificationSql, restaurationMd, main, volumeDe };
