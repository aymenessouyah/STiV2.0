/*
  v603 — « Export vers Drive » : la sauvegarde de secours de toute la plateforme.

  Jusqu'ici, le Drive ne recevait que les 18 tables Supabase. Si le dépôt GitHub
  disparaissait, les données seraient sauvées mais ni le site, ni le schéma de la
  base, ni les requêtes à rejouer ne seraient récupérables.

  Ce test verrouille le nouveau bouton du tableau de bord et la charge qu'il
  dépose : données + schéma complet + code du site + manifeste + mode d'emploi,
  dans un fichier que le Web App Apps Script déjà déployé sait écrire.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (chemin) => readFileSync(join(root, chemin), 'utf8');

const MODULE = lire('assets/js/export-drive.js');
const SAUVEGARDE = lire('assets/js/sauvegarde.js');
const ADMIN = lire('admin.html');
const SW = lire('sw.js');
const GS = lire('documents/sql/sauvegarde-auto-drive.gs');
const MANIFESTE = JSON.parse(lire('offline-complete-manifest.json'));

/* Exécute le module dans un navigateur de laboratoire : aucun réseau. */
function chargerModule(fetchSimule) {
  const fenetre = {};
  const document = { getElementById: () => null };
  const fetch = fetchSimule || (() => Promise.reject(new Error('réseau interdit dans ce test')));
  new Function('window', 'document', 'fetch', MODULE)(fenetre, document, fetch);
  return fenetre.STIExportDrive;
}

const api = chargerModule();

test('v603 : le bouton « Export vers Drive » est dans le tableau de bord', () => {
  assert.match(ADMIN, /<script src="assets\/js\/export-drive\.js\?v=603" defer><\/script>/,
    'le module est chargé par la page d’administration');
  assert.ok(ADMIN.indexOf('export-drive.js?v=603') < ADMIN.indexOf('sauvegarde.js?v=606'),
    'le module est chargé avant le panneau de sauvegarde');

  assert.match(SAUVEGARDE, /id="sti-sauv-drive-export"/, 'le bouton existe');
  assert.match(SAUVEGARDE, /📦 Export vers Drive/, 'son libellé est celui demandé');
  assert.match(SAUVEGARDE, /id="sti-sauv-export-code"/, 'la case « inclure le code » existe');
  assert.match(SAUVEGARDE, /id="sti-sauv-export-etat"/, 'la progression s’affiche');
  assert.match(SAUVEGARDE, /window\.STIExportDrive\.exporter\(/, 'le clic appelle bien le module');
});

test('v603 : la charge réunit données, schéma, code, manifeste et consignes', () => {
  const charge = api.assembler({
    donnees: {
      nb_tables: 18,
      total_lignes: 4210,
      tables: { profiles: [{ id: 'a' }] },
      cloud: { profiles: [{ id: 'a' }] },
      local: { 'sti-theme': 'sombre' },
      erreurs: {}
    },
    manifeste: {
      files: [
        { path: 'supabase/migrations/20261027_xp_quiz_monotone_v478.sql', bytes: 900 },
        { path: 'tools/supabase-schema.sql', bytes: 30362 },
        { path: 'index.html', bytes: 120000 },
        { path: 'assets/css/theme.css', bytes: 90000 },
        { path: 'assets/videos/html5-cours.mp4', bytes: 40000000 }
      ]
    },
    textes: [
      { chemin: 'supabase/migrations/20261027_xp_quiz_monotone_v478.sql', texte: 'create or replace function f() …', sha256: 'aa' },
      { chemin: 'tools/supabase-schema.sql', texte: 'create table profiles …', sha256: 'bb' },
      { chemin: 'index.html', texte: '<!DOCTYPE html>', sha256: 'cc' },
      { chemin: 'assets/css/theme.css', texte: ':root{}', sha256: 'dd' }
    ],
    omis: [{ chemin: 'assets/videos/html5-cours.mp4', octets: 40000000, raison: 'binaire' }],
    version: 'v603',
    date: '2026-10-31T18:00:00.000Z'
  });

  /* Compatibilité : le Web App Apps Script lit `tables` et `total_lignes`, et
     le bouton « Restaurer » lit `cloud`/`local`. */
  assert.equal(charge.tables.profiles.length, 1);
  assert.equal(charge.cloud.profiles.length, 1);
  assert.equal(charge.local['sti-theme'], 'sombre');
  assert.equal(charge.total_lignes, 4210);
  assert.equal(charge.nb_tables, 18);

  const bloc = charge.export_plateforme;
  assert.equal(bloc.format, 'sti-export-plateforme/1');
  assert.equal(bloc.version_publiee, 'v603');

  /* Le schéma (base + migrations) est séparé du code du site. */
  assert.deepEqual(Object.keys(bloc.schema.fichiers).sort(), [
    'supabase/migrations/20261027_xp_quiz_monotone_v478.sql',
    'tools/supabase-schema.sql'
  ]);
  assert.deepEqual(Object.keys(bloc.site.fichiers).sort(), ['assets/css/theme.css', 'index.html']);

  /* Le manifeste garde l'inventaire complet, y compris ce qui n'est pas inclus. */
  assert.equal(bloc.manifeste.total_fichiers, 5);
  assert.equal(bloc.manifeste.fichiers.find(f => f.chemin === 'assets/videos/html5-cours.mp4').octets, 40000000);
  assert.equal(bloc.manifeste.inclus.length, 4);
  assert.equal(bloc.omis.length, 1, 'ce qui n’est pas inclus est expliqué');

  /* Le mode d'emploi est dans l'archive. */
  assert.match(bloc.instructions, /remise en service/);
  assert.match(bloc.instructions, /tools\/supabase-schema\.sql/);
  assert.match(bloc.instructions, /profiles, acces/);
  assert.match(bloc.instructions, /service_role/);
});

test('v603 : seuls les fichiers texte sont lus, la base passe avant les pages', () => {
  for (const ok of ['index.html', 'assets/js/app.js', 'assets/css/theme.css', 'manifest.webmanifest',
    'supabase/migrations/x.sql', 'assets/icons/logo.svg', 'documents/sql/sauvegarde-auto-drive.gs']) {
    assert.equal(api.estTextuel(ok), true, ok);
  }
  for (const non of ['assets/videos/html5.mp4', 'assets/images/photo.jpg', 'documents/livre.pdf',
    'documents/guide.docx', 'assets/audio/voix.mp3', 'assets/fonts/x.woff2']) {
    assert.equal(api.estTextuel(non), false, non);
  }

  assert.ok(api.rang('supabase/migrations/x.sql') < api.rang('index.html'));
  assert.ok(api.rang('tools/supabase-schema.sql') < api.rang('assets/js/app.js'));
  assert.ok(api.rang('assets/css/theme.css') < api.rang('assets/js/app.js'));
});

test('v603 : un fichier trop lourd ou le plafond atteint est signalé, pas oublié', async () => {
  const fichiers = [
    { path: 'supabase/migrations/a.sql', bytes: 10 },
    { path: 'index.html', bytes: 20 },
    { path: 'gros.html', bytes: 900 * 1024 },
    { path: 'assets/js/theme.js', bytes: 30 }
  ];
  /* Le faux serveur renvoie exactement autant de caractères que le manifeste
     l'annonce : le plafond se comporte comme dans le navigateur. */
  const tailles = Object.fromEntries(fichiers.map(f => [f.path, f.bytes]));
  const lireFichier = (chemin) => Promise.resolve({ ok: true, text: () => Promise.resolve('x'.repeat(tailles[chemin] || 0)) });
  const apis = chargerModule(lireFichier);
  const lot = await apis.collecterFichiers({ files: fichiers }, 40, null);

  assert.deepEqual(lot.textes.map(t => t.chemin), ['supabase/migrations/a.sql', 'index.html']);
  assert.equal(lot.omis.length, 2);
  assert.match(lot.omis[0].raison, /plus de 400 Ko/);
  assert.match(lot.omis[1].raison, /plafond de/);
});

test('v603 : l’envoi respecte le contrat du Web App et ne transporte aucun secret', async () => {
  let requete = null;
  const apis = chargerModule((url, options) => {
    requete = { url, options };
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true, fichier: 'sti-sauvegarde-2026-10-31.json.gz' }) });
  });

  const charge = { tables: {}, total_lignes: 0, export_plateforme: { format: 'sti-export-plateforme/1' } };
  await apis.televerser('https://script.google.com/macros/s/AZERTY/exec', 'jeton-admin', charge);

  assert.equal(requete.url, 'https://script.google.com/macros/s/AZERTY/exec');
  assert.equal(requete.options.method, 'POST');
  const corps = JSON.parse(requete.options.body);
  assert.equal(corps.action, 'televerser', 'action déjà gérée par le script Apps Script');
  assert.equal(corps.access_token, 'jeton-admin');
  assert.deepEqual(JSON.parse(corps.archive_json), charge);

  /* Aucune clé de service dans ce que l'on envoie : ni JWT, ni secret Supabase. */
  assert.doesNotMatch(requete.options.body, /sb_secret_|eyJhbGciOi|service_role["']?\s*[:=]/i);
  assert.doesNotMatch(MODULE, /sb_secret_|eyJhbGciOi|service_role["']?\s*[:=]/i);
});

test('v603 : le script Apps Script accepte une archive enrichie', () => {
  /* enregistrerArchiveDirecteDrive_ écrit `archive_json` tel quel : les clés
     ajoutées (schéma, site, consignes) ne sont donc jamais perdues. */
  assert.match(GS, /function enregistrerArchiveDirecteDrive_\(corps\)/);
  assert.match(GS, /var jsonTxt = String\(corps\.archive_json \|\| ""\)/);
  assert.match(GS, /Utilities\.newBlob\(jsonTxt, "application\/json", nomJson\)/);
  assert.match(GS, /if \(action === "televerser"\)/);
  assert.doesNotMatch(GS, /delete parsed\./, 'le script ne retire aucune clé de l’archive');
});

test('v603 : la livraison hors ligne embarque le module', () => {
  assert.match(SW, /var VERSION_PUBLIEE = "v607";/);
  assert.match(SW, /url: "\.\/assets\/js\/export-drive\.js", revision: "export-drive-v603"/);
  assert.match(SW, /url: "\.\/assets\/js\/sauvegarde\.js", revision: "export-trouvable-v606"/);
  assert.match(SW, /url: "\.\/admin\.html", revision: "journal-acces-v607"/);
  assert.ok(MANIFESTE.files.some(f => f.path === 'assets/js/export-drive.js'),
    'le module est décrit dans le manifeste hors-ligne');
});
