/* v609 — « Intègre le bouton Sauvegarde complète dans cette famille, sans
   l'afficher à part »
   ---------------------------------------------------------------------------
   En v606/v608 la pastille « 💾 Sauvegarde complète » a été rendue visible et
   son affichage branché sur « Plus ▾ », mais elle restait un objet à part :
   créée par sauvegarde.js avec position:fixed, en bas à gauche, hors de la
   grille des boutons. Au clic sur « Plus » elle s'affichait au milieu de
   l'écran, plus grosse que les autres.

   v609 supprime la pastille et fait du bouton un membre de la famille :
   .btn-util.mob-extra.sys-extra-item, placé juste après « Alertes » et avant
   « Sortir », donc masqué replié / affiché ouvert comme ses voisins.
*/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const lire = (chemin) => readFileSync(new URL(`../${chemin}`, import.meta.url), 'utf8');
const sauvegarde = lire('assets/js/sauvegarde.js');
const admin = lire('admin.html');
const sw = lire('sw.js');

test('v609 — plus aucune pastille flottante n’est créée', () => {
  assert.ok(
    !/b\.setAttribute\("style",[^\n]*position:fixed/.test(sauvegarde),
    'sauvegarde.js ne doit plus poser de bouton en position fixe'
  );
  assert.ok(
    !/bottom:114px/.test(sauvegarde),
    'l’ancienne position de la pastille doit disparaître'
  );
  assert.match(sauvegarde, /getElementById\("sti-sauv-btn-flottant"\)[\s\S]{0,120}removeChild/,
    'une pastille encore présente dans un ancien cache doit être retirée');
});

test('v609 — le bouton porte les classes de la famille', () => {
  assert.match(sauvegarde, /b\.id = "sti-sauv-btn-barre";/);
  assert.match(sauvegarde, /b\.className = "btn-util mob-extra sys-extra-item";/);
  /* Le glyphe et les deux libellés, comme tous les boutons de la barre. */
  assert.match(sauvegarde, /class="btn-util-glyph" aria-hidden="true">💾</);
  assert.match(sauvegarde, /class="lbl-pc">Sauvegarde complète</);
  assert.match(sauvegarde, /class="lbl-mob">Sauvegarde</);
});

test('v609 — il se range après « Alertes » et avant « Sortir »', () => {
  assert.match(sauvegarde, /var barre = \(typeof document\.querySelector === "function"\) \? document\.querySelector\("\.barre-util"\) : null;/);
  assert.match(sauvegarde, /var sortie = document\.getElementById\("btn-logout"\);/);
  assert.match(sauvegarde, /if \(sortie && sortie\.parentNode === barre\) barre\.insertBefore\(b, sortie\);/);
  assert.match(sauvegarde, /else barre\.appendChild\(b\);/);
  /* Il passe donc exactement par la règle commune du repli « Plus ». */
  assert.ok(!/sti-sauv-btn-barre[\s\S]{0,200}position:fixed/.test(sauvegarde));
});

test('v609 — il ouvre le panneau avec l’encadré Export vers Drive', () => {
  assert.match(sauvegarde, /\["sti-btn-sauvegarde", "btn-export-drive-admin", "sti-sauv-btn-barre"\]/);
  assert.match(sauvegarde, /panneau\(\{ focusExport: true \}\);/);
  assert.match(sauvegarde, /data-sti-sauvegarde-lie/);
});

test('v609 — les minuteries de synchronisation ne se posent qu’une fois', () => {
  assert.match(sauvegarde, /if \(bouton\.minuteriesPosees\) return;/);
  assert.match(sauvegarde, /bouton\.minuteriesPosees = true;/);
});

test('v609 — la feuille de repli mentionne le bouton sans exception flottante', () => {
  const debut = admin.indexOf('<style id="style-plus-v609">');
  assert.ok(debut > -1, 'bloc de style v609 absent');
  const css = admin.slice(debut, admin.indexOf('</style>', debut));
  assert.match(css, /body:not\(\.sys-bar-ouverte\) \.barre-util #sti-sauv-btn-barre[\s\S]*?display:\s*none !important/);
  assert.match(css, /body\.sys-bar-ouverte \.barre-util #sti-sauv-btn-barre[\s\S]*?display:\s*inline-flex !important/);
  assert.ok(!/#sti-sauv-btn-flottant/.test(admin), 'aucune règle ne doit plus viser une pastille flottante');
});

test('v609 — publication : cache-buster du module et version', () => {
  assert.match(admin, /assets\/js\/sauvegarde\.js\?v=609/);
  assert.match(sw, /var VERSION_PUBLIEE = "v609";/);
  assert.match(sw, /v609-sauvegarde-barre-20261101/);
  assert.ok(sw.includes('{ url: "./assets/js/sauvegarde.js", revision: "sauvegarde-barre-v609" }'));
});
