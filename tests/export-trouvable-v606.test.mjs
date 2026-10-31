/* v606 — « Je ne trouve pas le bouton Export vers Drive »
   ---------------------------------------------------------------------------
   Cause trouvée : la pastille flottante « 💾 Sauvegarde complète » portait
   l'identifiant #sti-btn-sauvegarde, c'est-à-dire EXACTEMENT celui que le ruban
   « Services » de l'administration va chercher pour l'installer dans son dock.
   Au deuxième passage du ruban (+250 ms, puis +900 ms), la pastille était
   déplacée dans le dock replié, où la feuille de style masque tout bouton
   autre que la bascule (display:none). Le seul accès au panneau disparaissait
   donc, alors que la page contenait bien l'export.

   Ces tests figent les trois corrections : identifiant propre, boutons de page
   reliés au panneau, et panneau qui amène la vue sur l'export Drive.
*/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const lire = (chemin) => readFileSync(new URL(`../${chemin}`, import.meta.url), 'utf8');
const sauvegarde = lire('assets/js/sauvegarde.js');
const admin = lire('admin.html');
const sw = lire('sw.js');
const css = lire('assets/css/admin-saas.css');

test('v606 — la pastille flottante ne porte plus l’identifiant du ruban Services', () => {
  assert.ok(
    !/b\.id = "sti-btn-sauvegarde";/.test(sauvegarde),
    'la pastille ne doit plus s’appeler #sti-btn-sauvegarde (le ruban la masquerait)'
  );
  assert.match(sauvegarde, /b\.id = "sti-sauv-btn-flottant";/);
});

test('v606 — la cause est vérifiable : le ruban masque les boutons du dock replié', () => {
  assert.match(
    css,
    /#sti-airbus-service-dock:not\(\.sti-dock-open\) > button:not\(#sti-airbus-dock-toggle\)\s*\{\s*display:\s*none !important;/,
    'la règle du dock replié est bien celle qui faisait disparaître le bouton'
  );
});

test('v606 — un bouton visible « 📦 Export vers Drive » existe dans la page', () => {
  assert.match(admin, /id="btn-export-drive-admin"/, 'bouton absent de la page');
  assert.match(admin, /📦 Export vers Drive<\/button>/, 'libellé attendu');
  assert.ok(
    admin.indexOf('id="btn-sec-backup-json"') < admin.indexOf('id="btn-export-drive-admin"'),
    'le bouton se place à côté de la sauvegarde JSON existante'
  );
});

test('v606 — le bouton du ruban « Services » existe et reste hors écran avant adoption', () => {
  assert.match(admin, /id="sti-btn-sauvegarde"/, 'emplacement du service absent');
  const balise = admin.match(/<button[^>]*id="sti-btn-sauvegarde"[^>]*>/);
  assert.ok(balise, 'balise introuvable');
  assert.match(balise[0], /left:-9999px/, 'il doit être hors écran tant que le ruban ne l’a pas pris');
});

test('v606 — les deux boutons ouvrent le panneau, export Drive en évidence', () => {
  assert.match(sauvegarde, /function lierOuvreursExport\(\)/);
  assert.match(sauvegarde, /\["sti-btn-sauvegarde", "btn-export-drive-admin"\]/);
  assert.match(sauvegarde, /panneau\(\{ focusExport: true \}\);/);
  /* Le ruban est construit après nous : on relie aussi plus tard. */
  assert.match(sauvegarde, /setTimeout\(lierOuvreursExport, 1000\);/);
  assert.match(sauvegarde, /setTimeout\(lierOuvreursExport, 2500\);/);
});

test('v606 — le panneau amène la vue sur l’encadré export sans se refermer', () => {
  assert.match(sauvegarde, /function panneau\(options\)/);
  assert.match(sauvegarde, /var opts = \(options && typeof options === "object" && !options\.type\) \? options : \{\};/,
    'le clic direct (objet Event) reste accepté sans plantage');
  assert.match(sauvegarde, /if \(exist\) \{\s*exist\.remove\(\);\s*if \(!opts\.focusExport\) return;/,
    'un second clic doit réouvrir le panneau au lieu de le fermer');
  assert.match(sauvegarde, /boite\.scrollIntoView\(\{ behavior: "smooth", block: "center" \}\)/);
});

test('v606 — la page charge bien la nouvelle version du module', () => {
  assert.match(admin, /assets\/js\/sauvegarde\.js\?v=606/);
  assert.ok(
    admin.indexOf('export-drive.js?v=603') < admin.indexOf('sauvegarde.js?v=606'),
    'export-drive.js doit rester chargé avant sauvegarde.js'
  );
});

test('v606 — publication : service worker et révisions à jour', () => {
  assert.match(sw, /var VERSION_PUBLIEE = "v607";/);
  assert.match(sw, /var PUBLIEE_LE = "2026-11-01T21:20:00Z";/);
  assert.match(sw, /v606-export-trouvable-20261101/);
  assert.match(sw, /\{ url: "\.\/assets\/js\/sauvegarde\.js", revision: "export-trouvable-v606" \}/);
  assert.match(sw, /\{ url: "\.\/admin\.html", revision: "journal-acces-v607" \}/);
});
