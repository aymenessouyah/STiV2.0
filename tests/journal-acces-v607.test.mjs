/* v607 — « 0 min · 0 sess. » alors que l'élève travaille
   ---------------------------------------------------------------------------
   Capture du professeur : la fiche de MESBEHI Asma affiche « Temps (cumul)
   0 min · 0 sess. » alors que la même fiche montre 6/151 pages, 2 cours,
   3 exercices, 4 modules, 3/20 vidéos et 2/20 de moyenne.

   Ce n'est pas une incohérence de calcul : les deux moitiés de la fiche ne
   viennent pas de la même source.
     • pages, cours, exercices, vidéos, modules  → table `sti_progressions`
       (écrite par un fetch direct, avec « resolution=merge-duplicates ») ;
     • temps, sessions, accès 24 h               → table `acces`.
   Or la session de journalisation était créée avec
   `.insert(...).select("id").single()` : si la base ne renvoie pas la ligne
   (lecture filtrée, réponse vide ou multiple), l'INSERT entier est perdu et
   la page basculait en silence vers la file hors-ligne. La table `acces`
   restait donc vide pour cet élève alors que ses progressions arrivaient.

   v607 écrit d'abord, retrouve ensuite l'identifiant, remonte l'erreur exacte
   et ne laisse plus un « 0 » muet dans la fiche.
*/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const lire = (chemin) => readFileSync(new URL(`../${chemin}`, import.meta.url), 'utf8');
const acces = lire('assets/js/acces.js');
const admin = lire('assets/js/admin.js');
const adminHtml = lire('admin.html');
const sw = lire('sw.js');

test('v607 — la session n’exige plus que la base renvoie la ligne', () => {
  const debut = acces.indexOf('function ouvrirSessionJournal(tsInit)');
  assert.ok(debut > -1, 'ouvrirSessionJournal absente');
  const corps = acces.slice(debut, debut + 2200);
  assert.match(corps, /function echec\(err\)/);
  assert.match(corps, /insererAccesSTI\(Object\.assign\(\{\}, ligne\)\)/, 'second essai sans « return=representation »');
  assert.match(corps, /retrouverIdSession\(tsInit/, 'l’identifiant est recherché après écriture');
  assert.match(corps, /suivreSessionId\(id\)/, 'la durée continue d’être suivie');
});

test('v607 — l’ancien enchaînement qui perdait la ligne a disparu', () => {
  assert.ok(
    !/insererAccesSTI\(\{[^}]*duree_sec: 1 \}\)\.select\("id"\)\.single\(\)/.test(acces.replace(/\n/g, ' ')),
    'l’écriture de session ne doit plus dépendre d’un .select("id").single() direct'
  );
  assert.match(acces, /fin: tsInit, duree_sec: 1 \};/, 'la ligne porte maintenant un debut explicite, retrouvable');
});

test('v607 — une panne d’écriture est signalée au professeur, une seule fois', () => {
  assert.match(acces, /function signalerPanneJournalAcces\(message, detail\)/);
  assert.match(acces, /genre: "journal_acces"/);
  assert.match(acces, /sessionStorage\.getItem\("sti-journal-acces-panne"\) === "1"/, 'garde-fou : une seule remontée par session');
  assert.match(acces, /sb\.from\("sti_diagnostics"\)\.insert\(/);
});

test('v607 — la fiche n’affiche plus un « 0 » muet', () => {
  assert.match(admin, /journal absent<\/b>/, 'le KPI Temps doit nommer la panne');
  assert.match(admin, /id='btn-fiche-diag-journal'/, 'bouton de vérification dans la fiche');
  assert.match(admin, /Aucune connexion enregistrée dans le journal\./);
  assert.match(admin, /ses progressions arrivent, son journal de sessions non/, 'la fiche explique la différence de source');
});

test('v607 — le diagnostic lit aussi les pannes remontées par l’appareil de l’élève', () => {
  assert.match(admin, /"2 bis\. Pannes signalées par SON appareil \(sti_diagnostics\)"/);
  assert.match(admin, /\.eq\("genre", "journal_acces"\)/);
  assert.match(admin, /c'est donc le journal de sessions qui échoue, pas sa connexion/);
});

test('v607 — publication : cache-buster, révisions et version', () => {
  assert.match(adminHtml, /assets\/js\/admin\.js\?v=613-perf/);
  assert.match(sw, /var VERSION_PUBLIEE = "v(?:6(?:1[1-9]|[2-9]\d)|[7-9]\d\d)";/);
  assert.match(sw, /var PUBLIEE_LE = "\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z";/);
  assert.match(sw, /v607-journal-acces-20261101/);
  /* v610 : admin.js porte désormais sa propre révision ; acces.js garde la sienne. */
  assert.ok(sw.includes('{ url: "./assets/js/acces.js", revision: "journal-acces-v607" }'),
    'révision attendue pour ./assets/js/acces.js');
  assert.ok(sw.includes('{ url: "./assets/js/admin.js", revision: "videos-supabase-v613" }'),
    'révision attendue pour ./assets/js/admin.js');
  assert.match(sw, /\{ url: "\.\/admin\.html", revision: "videos-supabase-v613" \}/);
});
