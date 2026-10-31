/* Journal des connexions (v582) — le tableau de bord ne doit plus pouvoir
   « remettre un élève à 0 » sans laisser de trace.

   Constat du 31/10/2026 sur la base réelle :
     • la table `acces` ne contient plus rien avant le 25/10/2026 19 h 35,
       alors que `profiles` (depuis le 07/10) et `sti_progressions` (12 lignes
       modifiées avant cette date) ont gardé leur historique ;
     • Postgres comptait 7 447 insertions et 4 582 suppressions pour 2 831
       lignes vivantes : environ 4 600 lignes ont été supprimées, et aucune
       migration ne supprime de ligne dans `acces` ;
     • 48 élèves sur 73 affichent donc 0 connexion, dont 13 qui ont pourtant
       une progression enregistrée.

   Ce fichier fige les quatre réponses :
     1. l'historique disponible est écrit partout où un chiffre peut être lu
        comme un total (tableau, fiche élève, bilan A4, exports CSV) ;
     2. la période par défaut est le cumul, avec la part de la semaine en cours,
        pour qu'un élève inactif cette semaine ne paraisse pas à zéro ;
     3. un instantané local peut être réimporté dans la base ;
     4. toute suppression du journal est précédée d'une copie (serveur +
        fichier JSON + navigateur) et d'une confirmation en deux temps. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const racine = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (chemin) => readFileSync(join(racine, chemin), 'utf8');
const admin = lire('assets/js/admin.js');
const migration = lire('supabase/migrations/20261103_sauvegarde_acces_v582.sql');

function extraire(source, debut, fin) {
  const i = source.indexOf(debut);
  assert.ok(i >= 0, 'marqueur de début introuvable : ' + debut.slice(0, 60));
  const j = source.indexOf(fin, i + debut.length);
  assert.ok(j > i, 'marqueur de fin introuvable : ' + fin.slice(0, 60));
  return source.slice(i, j + fin.length);
}

/* Évalue un fragment d'admin.js en lui passant les variables de module dont il
   dépend (les paramètres du wrapper servent de fermeture). */
function exposer(code, variables) {
  const contexte = { window: {} };
  const noms = Object.keys(variables || {});
  const valeurs = noms.map((n) => variables[n]);
  new Function('window', ...noms, code)(contexte.window, ...valeurs);
  return contexte.window;
}

function exposerHistorique(acces, accesBrutsAdmin, compteServeur) {
  const code = extraire(admin, 'function datePremiereActiviteAdmin', 'window.__stiDatePremiereActiviteAdmin = datePremiereActiviteAdmin;');
  const contexte = { window: { __stiCountAcces: compteServeur } };
  new Function('window', 'acces', 'accesBrutsAdmin', code)(contexte.window, acces, accesBrutsAdmin);
  return contexte.window;
}

/* ── 1. Jusqu'où remonte l'historique ───────────────────────────────────── */
test('l’historique des connexions annonce sa date de départ', () => {
  const w = exposerHistorique(
    [{ debut: '2026-10-31T07:00:00Z', page: 'index.html' }, { debut: '2026-10-25T19:35:07Z', page: 'CFG_ECOLES' }],
    [{}, {}],
    2
  );
  assert.equal(w.__stiTexteHistoriqueAccesAdmin(), 'historique depuis le 25/10/2026');
  assert.equal(w.__stiDatePremiereActiviteAdmin([]), null, 'aucune ligne = aucune date');
});

test('quand la base contient plus que ce qui est chargé, la portée est dite', () => {
  const w = exposerHistorique([{ debut: '2026-10-30T09:00:00Z', page: 'sql.html' }], [{}, {}], 5000);
  assert.match(w.__stiTexteHistoriqueAccesAdmin(), /historique depuis le 30\/10\/2026 \(2 dernières activités chargées sur 5000\)/);
});

test('sans aucune connexion, on l’écrit au lieu d’afficher une date fausse', () => {
  const w = exposerHistorique([], [], 0);
  assert.match(w.__stiTexteHistoriqueAccesAdmin(), /^aucune connexion enregistrée/);
});

test('la date de départ est écrite dans le tableau, la fiche, le bilan A4 et les deux exports', () => {
  const usages = admin.match(/texteHistoriqueAccesAdmin\(\)/g) || [];
  assert.ok(usages.length >= 5, 'attendu au moins 5 usages (note + fiche + A4 + 2 CSV), trouvé ' + usages.length);
  assert.match(admin, /id = "note-historique-acces"/, 'note visible sous le titre des Dernières connexions');
  assert.match(admin, /window\.__stiMajNoteHistoriqueAccesAdmin = majNoteHistoriqueAccesAdmin;/);
  assert.match(admin, /Connexions : " \+ echHtml\(texteHistoriqueAccesAdmin\(\)\)/, 'ligne dans la fiche élève');
  assert.match(admin, /"Historique connexions"/, 'colonne dans l’export des abonnés');
  assert.match(admin, /"Historique des connexions";/, 'ligne dans l’export de la fiche élève');
});

/* ── 2. La période par défaut est le cumul ───────────────────────────────── */
test('la période par défaut est « toutes les semaines », pas la semaine en cours', () => {
  assert.match(admin, /selSemaine\.value = "\*";/, 'le cumul est sélectionné par défaut');
  assert.match(admin, /function dureePourAbonne\(uid\) \{\s*var sk = selSemaine \? selSemaine\.value : "\*";/);
  assert.match(admin, /thDureeAbonnes\.textContent = enCumulAb \? "Durée \(cumul\)" : "Durée \/ semaine";/,
    'l’en-tête de colonne suit la période');
});

test('le cumul affiche aussi la part de la semaine en cours', () => {
  assert.match(admin, /dont cette semaine : " \+ fmtDureeCumul\(secCetteSemaine\)/,
    'tableau des abonnés : total et semaine, côte à côte');
  assert.match(admin, /dont cette semaine : " \+ echHtml\(fmtDureeCumul\(/,
    'fiche élève : même lecture');
});

/* ── 3. Réimport d'un instantané local ───────────────────────────────────── */
test('les lignes d’un instantané sont réduites aux colonnes réimportables, sans doublon', () => {
  const code = extraire(admin, 'function lignesAccesDepuisListeAdmin', 'return sortie;\n  }');
  const w = exposer(code + '\nwindow.__lignes = lignesAccesDepuisListeAdmin;', {});
  const lignes = w.__lignes([
    { id: 12, user_id: 'u1', debut: '2026-10-24T08:00:00Z', fin: '2026-10-24T08:10:00Z', duree_sec: 600, lieu: 'PC', page: 'sql.html' },
    { id: 12, user_id: 'u1', debut: '2026-10-24T08:00:00Z', fin: '2026-10-24T08:10:00Z', duree_sec: 600, lieu: 'PC', page: 'sql.html' },
    { id: 13, user_id: 'u2', debut: '2026-10-24T09:00:00Z', page: 'php.html' },
    { id: 14, user_id: 'u3', page: 'sans-date.html' },
    null
  ]);
  assert.equal(lignes.length, 2, 'doublon et ligne incomplète écartés');
  assert.deepEqual(Object.keys(lignes[0]).sort(), ['debut', 'duree_sec', 'fin', 'lieu', 'page', 'user_id']);
  assert.equal(lignes[0].id, undefined, 'l’identifiant d’origine n’est pas réimporté');
  assert.equal(lignes[1].fin, null);
});

test('l’instantané local et les copies de purge sont stockés dans le navigateur', () => {
  assert.match(admin, /indexedDB\.open\(DB_CACHE_ADMIN, 2\)/, 'base locale passée en version 2');
  assert.match(admin, /if \(!db\.objectStoreNames\.contains\("sauvegardes"\)\) db\.createObjectStore\("sauvegardes"\);/);
  assert.match(admin, /function lireSauvegardesAccesLocalesAdmin\(\)/);
  assert.match(admin, /function reimporterInstantaneLocalAccesAdmin\(\)/);
  assert.match(admin, /sb\.rpc\("admin_reimporter_acces", \{ p_lignes: paquet \}\)/);
  assert.match(admin, /for \(var i = 0; i < lignes\.length; i \+= 1000\)/, 'envoi par paquets de 1 000');
});

test('deux boutons sont ajoutés à la section Connexions sans toucher à admin.html', () => {
  assert.match(admin, /btnRe\.id = "btn-reimporter-acces";/);
  assert.match(admin, /btnSv\.id = "btn-sauvegardes-acces";/);
  assert.match(admin, /sb\.rpc\("admin_lister_sauvegardes_acces"\)/);
  assert.match(admin, /sb\.rpc\("admin_reimporter_sauvegarde_acces", \{ p_id: s\.id \}\)/);
  const html = lire('admin.html');
  assert.doesNotMatch(html, /btn-reimporter-acces|btn-sauvegardes-acces/,
    'les boutons sont créés par le script : admin.html garde son empreinte');
});

test('le nom du fichier de sauvegarde dit le mois et l’heure', () => {
  const code = extraire(admin, 'function nomFichierSauvegardeAccesAdmin', 'return "STI_V2_connexions_');
  const fin = code.length;
  const complet = code.slice(0, fin) + admin.slice(admin.indexOf(code) + fin, admin.indexOf(code) + fin + 80);
  const w = exposer(complet.slice(0, complet.indexOf('.json";\n  }') + '.json";\n  }'.length) +
    '\nwindow.__nom = nomFichierSauvegardeAccesAdmin;', {});
  assert.match(w.__nom('2026-10'), /^STI_V2_connexions_2026-10_\d{8}-\d{4}\.json$/);
  assert.match(w.__nom('*'), /^STI_V2_connexions_tous_mois_\d{8}-\d{4}\.json$/);
});

/* ── 4. La suppression ne part plus sans copie ───────────────────────────── */
test('la copie serveur est demandée avant toute suppression du journal', () => {
  const bloc = extraire(admin, 'if (btnConfirmerPurgeAcces) {', 'Aucune ligne n\'a été effacée.", "err");');
  const iCopie = bloc.indexOf('sb.rpc("admin_sauvegarder_acces"');
  const iDelete = bloc.indexOf('executerPurgeAccesAdmin(');
  assert.ok(iCopie > 0, 'la copie serveur est appelée');
  assert.ok(iDelete > iCopie, 'la suppression vient après la copie');
  assert.match(bloc, /if \(nbServeur === 0 && ciblesChargees\.length > 0\) \{\s*throw new Error\("la copie serveur est vide"\);/,
    'une copie vide annule la suppression');
  assert.match(bloc, /telechargerJsonAdmin\(nomFichierSauvegardeAccesAdmin\(ym\)/,
    'un fichier JSON est téléchargé avant la confirmation');
  assert.match(bloc, /ecrireSauvegardeAccesLocaleAdmin\(copie\)/,
    'une copie reste dans le navigateur');
  assert.match(bloc, /danger: true,[\s\S]*btnLabel: "🗑️ Supprimer définitivement"/,
    'la confirmation finale est explicite');
});

test('la suppression elle-même est isolée derrière une seule entrée', () => {
  const fn = extraire(admin, 'function executerPurgeAccesAdmin', '}).finally(function () {');
  assert.match(fn, /var suppression = sb\.from\("acces"\)\.delete\(\)/);
  /* Une seule suppression « large » (gt("id", 0)) dans tout le tableau de bord :
     les autres appels de delete() visent des identifiants ou des pages précis
     (messages, coffre TP, alertes) et ne vident pas le journal. */
  const larges = admin.match(/\.gt\("id", 0\)/g) || [];
  assert.equal(larges.length, 1, 'une seule purge large, celle qui est sauvegardée');
  assert.ok(fn.indexOf('.gt("id", 0)') > 0, 'la purge large est dans la fonction sauvegardée');
});

test('le résumé de la fenêtre de purge annonce la copie préalable', () => {
  assert.match(admin, /Une copie de ces lignes est d'abord enregistrée/);
  assert.match(admin, /Sans copie, la suppression est refusée\./);
});

/* ── 5. La migration qui rend tout cela possible ─────────────────────────── */
test('la migration v582 crée la table de copies et les quatre portes admin', () => {
  assert.match(migration, /create table if not exists public\.acces_sauvegardes/);
  assert.match(migration, /alter table public\.acces_sauvegardes enable row level security;/);
  [
    'admin_sauvegarder_acces',
    'admin_lister_sauvegardes_acces',
    'admin_reimporter_acces',
    'admin_reimporter_sauvegarde_acces'
  ].forEach((nom) => {
    assert.match(migration, new RegExp('create or replace function public\\.' + nom + '\\('), nom + ' créée');
    assert.match(migration, new RegExp('grant execute on function public\\.' + nom + '\\('), nom + ' accordée au rôle authenticated');
  });
  const gardes = migration.match(/if not public\.est_admin_mfa\(\) then/g) || [];
  assert.ok(gardes.length >= 4, 'chaque porte exige l’administrateur avec double authentification');
});

test('le réimport est idempotent et ne peut pas créer de doublon', () => {
  assert.match(migration, /on conflict \(user_id, client_event_id\) do nothing;/);
  assert.match(migration, /a\.debut = v_debut\s+and coalesce\(a\.page, ''\) = v_page/,
    'même horodatage + même page = ligne déjà connue');
  assert.match(migration, /if jsonb_array_length\(p_lignes\) > 20000 then/);
});

test('la migration ne supprime jamais le journal existant', () => {
  const suppressions = migration.match(/delete from public\.\w+/g) || [];
  assert.deepEqual(suppressions, ['delete from public.acces_sauvegardes'],
    'seul le nettoyage des copies anciennes est autorisé');
  assert.doesNotMatch(migration, /delete from public\.acces\b/);
  assert.doesNotMatch(migration, /truncate/i);
});
