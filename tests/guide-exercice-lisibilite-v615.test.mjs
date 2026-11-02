/* v615 — LISIBILITÉ DU « GUIDE EXERCICE »
   ───────────────────────────────────────────────────────────────────────────
   Constat du professeur en usage réel : « c'est trouvé mais avec le mode clair
   seulement que c'est lisible ». Le module écrivait ses couleurs en dur (fond
   crème #fffdf7, petit texte #7a6f5d, bordure #d8d0bd) : en mode ardoise, le
   texte clair du thème se retrouvait posé sur ce fond crème, presque illisible.

   Ces tests garantissent que la section ne contient plus aucune teinte figée,
   qu'elle n'utilise que les jetons de la palette, que ces jetons existent dans
   LES DEUX palettes avec un contraste suffisant, et que le bandeau
   récapitulatif (masqué par défaut) s'affiche bien quand il a un texte.
*/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const racine = resolve(new URL('..', import.meta.url).pathname);
const lire = (p) => readFileSync(join(racine, p), 'utf8');

const admin = lire('assets/js/admin.js');
const css = lire('assets/css/admin-saas.css');
const adminHtml = lire('admin.html');
const sw = lire('sw.js');

/* La section « Guide exercice » d'admin.js : du repère du module jusqu'à
   l'exposition de son API publique. */
const debut = admin.indexOf('GUIDE_ID_CONFIG');
const fin = admin.indexOf('window.__stiGuideEffectifPour');
const module_ = admin.slice(debut, fin);

/* ── outils de contraste (WCAG) ─────────────────────────────────────────── */

function jetons(depuis, jusqu) {
  const bloc = css.split('\n').slice(depuis - 1, jusqu).join('\n');
  return Object.fromEntries(
    [...bloc.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()])
  );
}
const ligne = (sel) => css.split('\n').findIndex((l) => l.startsWith(sel)) + 1;
const finBloc = (depuis) => css.split('\n').findIndex((l, i) => i + 1 > depuis && l === '}') + 1;

const CLAIR = jetons(ligne(':root {'), finBloc(ligne(':root {')));
const ARDOISE = jetons(ligne('html.admin-ardoise {'), finBloc(ligne('html.admin-ardoise {')));

function luminance(hex) {
  const h = hex.trim().replace('#', '');
  const complet = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const [r, v, b] = [0, 2, 4].map((i) => parseInt(complet.slice(i, i + 2), 16) / 255);
  const canal = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * canal(r) + 0.7152 * canal(v) + 0.0722 * canal(b);
}
function contraste(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/* ── 1. plus aucune teinte figée dans le module ─────────────────────────── */

test('v615 — la section « Guide exercice » n’écrit plus de couleur en dur', () => {
  assert.ok(debut > 0 && fin > debut, 'module repéré');
  const teintes = [...module_.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((m) => m[0]);
  assert.deepEqual(teintes, [], 'aucune teinte hexadécimale : ' + teintes.join(', '));
  /* Ni rgb()/hsl() en dur. */
  assert.doesNotMatch(module_, /(?:rgba?|hsla?)\(\s*\d/, 'aucune couleur fonctionnelle figée');
});

test('v615 — les couleurs viennent des jetons du tableau de bord', () => {
  for (const jeton of [
    'var(--adm-surface-2)', // fond des lignes d'exercices
    'var(--adm-text)',      // texte des lignes
    'var(--adm-muted)',     // petits textes, message d'état
    'var(--adm-border)',    // bordure des lignes
    'var(--adm-green)',     // « enregistré », « réglage lu »
    'var(--adm-amber)',     // « pensez à enregistrer »
    'var(--adm-red)'        // « enregistrement refusé »
  ]) {
    assert.ok(module_.includes(jeton), jeton + ' utilisé par la section');
  }
});

test('v615 — les jetons existent dans la palette claire ET dans la palette ardoise', () => {
  for (const jeton of ['adm-surface-2', 'adm-text', 'adm-muted', 'adm-border',
                       'adm-green', 'adm-amber', 'adm-red', 'adm-sky', 'adm-sky-soft']) {
    assert.ok(CLAIR[jeton], 'palette claire : ' + jeton);
    assert.ok(ARDOISE[jeton], 'palette ardoise : ' + jeton);
    assert.notEqual(CLAIR[jeton], ARDOISE[jeton],
      jeton + ' change bien entre les deux modes (' + CLAIR[jeton] + ' → ' + ARDOISE[jeton] + ')');
  }
});

/* ── 2. contraste réel dans les deux modes ──────────────────────────────── */

test('v615 — texte et petits textes restent lisibles sur le fond des lignes', () => {
  for (const [nom, palette] of [['clair', CLAIR], ['ardoise', ARDOISE]]) {
    const fond = palette['adm-surface-2'];
    /* 4,5:1 = seuil WCAG AA pour du texte courant. */
    for (const [texte, marge] of [['adm-text', 4.5], ['adm-text-2', 4.5], ['adm-muted', 4.5]]) {
      const ratio = contraste(palette[texte], fond);
      assert.ok(ratio >= marge,
        nom + ' : ' + texte + ' sur surface-2 = ' + ratio.toFixed(2) + ' (< ' + marge + ')');
    }
  }
});

test('v615 — les messages d’état (vert, orange, rouge) restent lisibles dans les deux modes', () => {
  for (const [nom, palette] of [['clair', CLAIR], ['ardoise', ARDOISE]]) {
    for (const jeton of ['adm-green', 'adm-amber', 'adm-red']) {
      const ratio = contraste(palette[jeton], palette['adm-surface-2']);
      assert.ok(ratio >= 4.5,
        nom + ' : ' + jeton + ' sur surface-2 = ' + ratio.toFixed(2));
    }
  }
});

/* ── 3. le bandeau récapitulatif s'affiche et suit le mode ──────────────── */

test('v615 — le bandeau récapitulatif n’est plus masqué en silence', () => {
  /* .bandeau-classe est display:none ; sans la classe « visible », le résumé
     (« N exercices affichés… ») ne s'affichait jamais. */
  const resume = admin.slice(admin.indexOf('function guideResume'), admin.indexOf('function chargerCatalogueGuide'));
  assert.match(resume, /classList\.toggle\("visible", Boolean\(texte\)\)/);
  assert.match(adminHtml, /<div id="guide-resume" class="bandeau-classe" role="status" aria-live="polite"><\/div>/);
  assert.match(adminHtml, /\.bandeau-classe\.visible \{ display: flex; \}/);
});

test('v615 — le bandeau récapitulatif est peint avec la palette, pas en crème', () => {
  const regle = css.slice(css.indexOf('.bandeau-classe,'), css.indexOf('.bandeau-classe,') + 400);
  assert.match(regle, /background: var\(--adm-sky-soft\) !important/);
  assert.match(regle, /color: var\(--adm-sky\) !important/);
  /* La règle de la palette doit l'emporter sur le fond crème de admin.html. */
  const locale = adminHtml.slice(adminHtml.indexOf('.bandeau-classe {'), adminHtml.indexOf('.bandeau-classe.visible'));
  assert.match(locale, /#fff8eb|#f3ead9/, 'le fond crème local reste décrit (neutralisé par !important)');
});

/* ── 4. publication ─────────────────────────────────────────────────────── */

test('v615 — publication : version, lot, cache-buster et révisions', () => {
  assert.match(sw, /var VERSION_PUBLIEE = "v615";/);
  assert.match(sw, /var PUBLIEE_LE = "2026-11-01T16:45:00Z";/);
  assert.match(sw, /Historique lots : v615-guide-lisibilite-20261101,/);
  assert.match(adminHtml, /assets\/js\/admin\.js\?v=615-perf/);
  for (const chemin of ['assets/js/admin.js', 'admin.html', 'offline-complete-manifest.json']) {
    assert.ok(sw.includes('{ url: "./' + chemin + '", revision: "guide-lisibilite-v615" }'), chemin);
  }
  /* Le module élève ne change pas : il garde son lot. */
  assert.ok(sw.includes('{ url: "./assets/js/guide-exercice.js", revision: "guide-exercice-v614" }'));
  assert.match(sw, /var CACHE = "sti-atelier-v386"/);
  assert.match(sw, /var UPDATE_ID = "v582-journal-connexions"/);
});
