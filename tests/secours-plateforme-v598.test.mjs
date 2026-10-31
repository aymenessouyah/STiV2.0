/*
  v598 — la sauvegarde de secours de la plateforme.

  Jusqu'ici, la base était sauvegardée (les 18 tables, chaque nuit, vers Drive)
  mais pas le SITE : si le dépôt disparaissait, les données seraient sauvées et
  le code perdu. Et personne n'avait sous la main la suite de requêtes à rejouer
  pour recréer le schéma Supabase.

  `outils/secours/construire-secours.mjs` comble ce trou. Ce test vérifie qu'il
  produit vraiment une archive exploitable — pas seulement qu'il existe :
    1. l'archive est un tar.gz lisible, avec tous ses fichiers ;
    2. le schéma Supabase y est reconstitué, migrations dans l'ordre ;
    3. le manifeste et les empreintes permettent de contrôler une copie ;
    4. les instructions de restauration et les requêtes de vérification sont
       dedans ;
    5. la séparation des volumes tient dans la limite d'envoi de Drive.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, statSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (p) => readFileSync(join(root, p), 'utf8');
const SCRIPT = 'outils/secours/construire-secours.mjs';

/* Une seule fabrication d'archive pour tout le fichier : elle lit ~800 fichiers
   et compresse ~40 Mo, ce qui prend quelques secondes. */
const dossier = mkdtempSync(join(tmpdir(), 'sti-secours-'));
const sortie = execFileSync(process.execPath, [join(root, SCRIPT), '--sortie', dossier], {
  cwd: root,
  encoding: 'utf8',
  maxBuffer: 16 * 1024 * 1024,
});
const nomArchive = basename(sortie.match(/Archive : (.+\.tar\.gz)/)[1].trim());
const archive = join(dossier, nomArchive);

test.after(() => rmSync(dossier, { recursive: true, force: true }));

/* Décompresse l'archive une fois, dans un dossier temporaire. */
const extrait = join(dossier, 'extrait');
mkdirSync(extrait, { recursive: true });
execFileSync('tar', ['-xzf', archive, '-C', extrait], { stdio: 'pipe' });
const contenu = (p) => readFileSync(join(extrait, p), 'utf8');

test('v598 : la sauvegarde produit une archive tar.gz non vide, nommée avec la version et la date', () => {
  assert.match(nomArchive, /sti-plateforme-CODE-v\d+-\d{4}-\d{2}-\d{2}\.tar\.gz$/);
  assert.ok(statSync(archive).size > 5 * 1024 * 1024, 'l’archive contient vraiment le site');
  /* Une archive gzip commence par 1f 8b ; un tar par « ustar » en 257. */
  const premier = readFileSync(archive).subarray(0, 2);
  assert.deepEqual([...premier], [0x1f, 0x8b], 'en-tête gzip');
});

test('v598 : les fichiers de la plateforme sont dans l’archive, à leur place', () => {
  const liste = execFileSync('tar', ['-tzf', archive], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const chemins = liste.split('\n').filter(Boolean);

  for (const attendu of ['index.html', 'sw.js', 'admin.html', 'projets/index.html', 'assets/css/theme.css', 'supabase/migrations']) {
    assert.ok(chemins.some((c) => c.startsWith('plateforme/' + attendu)), attendu + ' est sauvegardé');
  }
  /* Le contenu est identique à l'original, octet pour octet. */
  const original = readFileSync(join(root, 'index.html'));
  const copie = readFileSync(join(extrait, 'plateforme/index.html'));
  assert.equal(
    createHash('sha256').update(copie).digest('hex'),
    createHash('sha256').update(original).digest('hex'),
    'index.html restitué à l’identique'
  );
});

test('v598 : le schéma Supabase est reconstitué, migrations dans l’ordre chronologique', () => {
  const sql = contenu('_secours/supabase/01-schema-complet.sql');

  /* La base initiale est en tête… */
  assert.ok(sql.includes('BASE INITIALE — tools/supabase-schema.sql'), 'la base initiale ouvre le fichier');
  /* … puis chaque migration, une seule fois, dans l'ordre de son nom. */
  const nommees = [...sql.matchAll(/MIGRATION — supabase\/migrations\/([0-9][^.\s]+\.sql)/g)].map((m) => m[1]);
  assert.ok(nommees.length >= 20, `les migrations sont réunies (observé : ${nommees.length})`);
  assert.deepEqual(nommees, [...nommees].sort(), 'elles suivent l’ordre des fichiers (donc des dates)');
  assert.equal(new Set(nommees).size, nommees.length, 'aucune migration en double');

  /* Les objets attendus d'une base STI sont bien dans le texte. */
  for (const objet of ['create table public.profiles', 'row level security', 'est_admin']) {
    assert.match(sql.toLowerCase(), new RegExp(objet.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), objet + ' présent dans le schéma');
  }
});

test('v598 : les instructions de restauration et les requêtes de contrôle sont dedans', () => {
  const mode = contenu('_secours/RESTAURATION.md');
  /* Les quatre étapes d'une remise en service complète. */
  for (const sujet of ['Le site (les fichiers)', 'La base Supabase', '01-schema-complet.sql', '02-verification.sql', 'service_role']) {
    assert.ok(mode.includes(sujet), 'RESTAURATION.md traite : ' + sujet);
  }
  /* Les données ne sont pas oubliées : c'est l'autre sauvegarde. */
  assert.match(mode, /sti-sauvegarde-AAAA-MM-JJ\.json\.gz/);

  const verif = contenu('_secours/supabase/02-verification.sql');
  assert.match(verif, /information_schema\.tables/);
  assert.match(verif, /pg_policies/);
  assert.match(verif, /rowsecurity/);
  /* Les 18 tables doivent être comptées une à une. */
  assert.equal((verif.match(/count\(\*\) from public\./g) || []).length, 18, 'les 18 tables sont comptées');

  /* Le mode d'emploi en clair, avec le rappel des deux sauvegardes. */
  const lireMoi = contenu('_secours/LISEZ-MOI.txt');
  assert.match(lireMoi, /SAUVEGARDE DE SECOURS/);
  assert.match(lireMoi, /AUCUNE donnée d'élève/i);
});

test('v598 : le manifeste permet de contrôler une copie, fichier par fichier', () => {
  const manifeste = JSON.parse(contenu('_secours/manifeste.json'));
  assert.equal(manifeste.plateforme, 'STI V2.0');
  assert.equal(manifeste.volume, 'code');
  assert.match(manifeste.version, /^v\d+$/);
  assert.match(manifeste.commit, /^[0-9a-f]{40}$/);
  assert.ok(manifeste.fichiers_inclus > 500, 'le site entier, pas un échantillon');

  /* Chaque entrée porte son empreinte, et les empreintes du fichier texte
     correspondent exactement à celles du manifeste. */
  assert.ok(manifeste.fichiers.every((f) => /^[0-9a-f]{64}$/.test(f.sha256)));
  const empreintes = contenu('_secours/empreintes.txt').trim().split('\n');
  assert.equal(empreintes.length, manifeste.fichiers_inclus);
  const premiere = manifeste.fichiers[0];
  assert.ok(empreintes.includes(`${premiere.sha256}  plateforme/${premiere.chemin}`));

  /* Ce qui n'est pas dans ce volume est listé, jamais oublié. */
  assert.ok(manifeste.dans_les_autres_volumes.length > 0);
  assert.ok(manifeste.dans_les_autres_volumes.every((f) => ['documents', 'medias'].includes(f.volume)));
});

test('v598 : les volumes se complètent et restent sous la limite d’envoi de Drive', () => {
  const script = lire(SCRIPT);

  /* Trois volumes, et le volume par défaut est le plus léger. */
  assert.match(script, /const VOLUMES = \['code', 'documents', 'tout'\]/);
  assert.match(script, /const volume = options\.volume \|\| argument\('--volume'\) \|\| 'code'/);
  assert.match(script, /SEUIL_DOCUMENTS = 2 \* 1024 \* 1024/);

  /* L'archive fabriquée ici (volume code) est bien sous les 100 Mo que Drive
     accepte en un seul envoi, avec de la marge. */
  assert.ok(statSync(archive).size < 90 * 1024 * 1024, 'l’archive CODE reste sous 90 Mo');

  /* Les archives ne doivent jamais entrer dans le dépôt. */
  assert.match(lire('.gitignore'), /^\/dist-secours\/$/m);
  /* Deux commandes simples pour le professeur. */
  const pkg = JSON.parse(lire('package.json'));
  assert.equal(pkg.scripts['secours'], 'node outils/secours/construire-secours.mjs');
  assert.ok(pkg.scripts['secours:documents'].includes('--volume documents'));

  /* Le mode d'emploi à la racine explique la démarche et le dépôt sur Drive. */
  const doc = lire('SECOURS-PLATEFORME.md');
  assert.match(doc, /STI — Sauvegardes base/);
  assert.match(doc, /complémentaires/);
  assert.match(doc, /sha256sum -c/);
});
