/* v608 — « Le bouton Plus doit afficher ou cacher TOUS les boutons qui existent
   après lui, ainsi le bouton Sauvegarde »
   ---------------------------------------------------------------------------
   Constat (capture du 01/11/2026) : la barre annonce « Plus ▾ » (donc replié),
   et pourtant Flash, Appel, Aide, Top 3, Maj, News, Carte, Maj Élèves, PIN,
   README, Alertes et Sortir restent affichés — en plus de la pastille
   « Sauvegarde complète » qui flotte au milieu de l'écran.

   Cause : sur mobile, admin-saas.css impose
     .barre-util .btn-util { display:inline-flex !important }
   (spécificité 0,2,0). Le repli prévu dans admin.html
     .sys-extra-item { display:none !important }
   (spécificité 0,1,0) perdait donc l'arbitrage, et le bouton « Plus » ne
   commandait plus rien.

   Ces tests figent la règle qui tranche — et sa place dans la cascade.
*/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const lire = (chemin) => readFileSync(new URL(`../${chemin}`, import.meta.url), 'utf8');
const admin = lire('admin.html');
const sauvegarde = lire('assets/js/sauvegarde.js');
const sw = lire('sw.js');
const saas = lire('assets/css/admin-saas.css');

const blocStyle = () => {
  const debut = admin.indexOf('<style id="style-plus-v609">');
  assert.ok(debut > -1, 'bloc de style v608 absent');
  const fin = admin.indexOf('</style>', debut);
  return admin.slice(debut, fin);
};

test('v608 — le repli masque TOUS les boutons placés après « Plus »', () => {
  const css = blocStyle();
  for (const cible of ['.sys-extra-item', '#btn-logout', '#sti-sauv-btn-barre']) {
    assert.ok(
      new RegExp(`body:not\\(\\.sys-bar-ouverte\\)[^{]*\\${cible}[^{]*\\{[^}]*display:\\s*none !important`).test(css) ||
      (css.includes(cible) && /body:not\(\.sys-bar-ouverte\)[\s\S]*?display:\s*none !important/.test(css)),
      'cible attendue dans le repli : ' + cible
    );
  }
});

test('v608 — l’ouverture les rétablit', () => {
  const css = blocStyle();
  assert.match(css, /body\.sys-bar-ouverte \.barre-util \.sys-extra-item[\s\S]*?display:\s*inline-flex !important/);
  assert.match(css, /body\.sys-bar-ouverte \.barre-util #btn-logout[\s\S]*?display:\s*inline-flex !important/);
  assert.match(css, /body\.sys-bar-ouverte \.barre-util #sti-sauv-btn-barre[\s\S]*?display:\s*inline-flex !important/);
});

test('v608 — la règle de repli gagne l’arbitrage qui la neutralisait', () => {
  /* La règle fautive est toujours là (elle sert au reste) : c'est la nouvelle
     règle qui doit être plus spécifique et plus tardive. */
  assert.match(saas, /\.barre-util \.btn-util,\s*\n\.btn-util \{\s*\n  display: inline-flex !important;/);
  const debut = admin.indexOf('<style id="style-plus-v609">');
  assert.ok(debut > admin.indexOf('assets/css/admin-saas.css'), 'le bloc doit venir après la feuille externe');
  assert.ok(debut > admin.indexOf('id="style-tiroir-v383"'), 'et après les styles de tiroir');
  assert.match(blocStyle(), /body:not\(\.sys-bar-ouverte\) \.barre-util \.sys-extra-item/);
});

test('v608 — le bouton de sauvegarde est bien celui qui est visé', () => {
  /* v609 : il est désormais intégré à la barre (voir tests/sauvegarde-barre-v609). */
  assert.match(sauvegarde, /b\.id = "sti-sauv-btn-barre";/);
  assert.ok(!/position:fixed;left:14px;bottom:114px/.test(sauvegarde), 'plus de pastille flottante');
});

test('v608 — le bouton annonce ce qu’il commande', () => {
  const balise = admin.match(/<button[^>]*id="btn-toggle-sys-bar"[^>]*>/);
  assert.ok(balise, 'bouton Plus absent');
  assert.match(balise[0], /aria-expanded/, 'état annoncé');
  assert.match(balise[0], /TOUS les boutons placés après celui-ci/, 'l’infobulle décrit le nouveau rôle');
  assert.match(balise[0], /Sauvegarde complète/, 'et cite la pastille de sauvegarde');
});

test('v608 — le clic entretient bien les deux classes et l’état', () => {
  assert.match(admin, /barreSysAdmin\.classList\.toggle\("systeme-ouvert", ouvSys\)/);
  assert.match(admin, /document\.body\.classList\.toggle\("sys-bar-ouverte", ouvSys\)/);
  assert.match(admin, /btnSysBar\.setAttribute\("aria-expanded", ouvSys \? "true" : "false"\)/);
});

test('v608 — publication', () => {
  assert.match(sw, /var VERSION_PUBLIEE = "v(?:6(?:1[1-9]|[2-9]\d)|[7-9]\d\d)";/);
  assert.match(sw, /var PUBLIEE_LE = "\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z";/);
  assert.match(sw, /v608-plus-tout-20261101/);
  assert.match(sw, /\{ url: "\.\/admin\.html", revision: "compteurs-zero-v612" \}/);
});
