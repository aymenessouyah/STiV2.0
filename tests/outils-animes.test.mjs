import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const lire = (p) => readFileSync(resolve(root, p), 'utf8');

const html = lire('index.html');
const css = lire('assets/css/theme.css');
const js = lire('assets/js/app.js');

const IDS_OUTILS = [
  'btnHomeFlashcards',
  'btnHomeSandbox',
  'btnHomeConsoleJs',
  'btnHomeDebug',
  'btnHomeExamenBlanc',
  'btnHomeConstructeur',
  'btnHomeLaboSql',
  'btnHomeLaboAscii',
  'btnHomeSimPhpSql',
  'btnHomeCoffreTp'
];

test('v516 : chaque pastille des dix outils isole son logo', () => {
  const section = html.split('id="ateliers-rapides"')[1].split('</section>')[0];
  const logos = section.match(/class="lab-chip__ico"/g) || [];
  assert.equal(logos.length, 10, 'les dix logos sont dans une balise dédiée');
  for (const id of IDS_OUTILS) {
    assert.match(
      section,
      new RegExp(`id="${id}"><span class="lab-chip__ico" aria-hidden="true">[^<]+</span>`),
      id + ' porte son logo'
    );
  }
  /* Le logo est décoratif : le texte du bouton reste lisible par un lecteur d'écran. */
  assert.doesNotMatch(section, /class="lab-chip__ico"[^>]*>[^<]*<\/span>\s*<\/button>/);
});

test('v516 : cinq petites animations existent et respectent les préférences', () => {
  for (let i = 1; i <= 5; i += 1) {
    assert.match(css, new RegExp(`\\.lab-chip__ico\\.sti-outil-anim-${i} \\{ animation: sti-outil-`), `classe ${i}`);
  }
  for (const nom of ['salut', 'rebond', 'pulse', 'tangage', 'eclat']) {
    assert.match(css, new RegExp(`@keyframes sti-outil-${nom} \\{`), nom);
  }
  assert.match(css, /\.lab-chip__ico \{[^}]*display: inline-block;/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{\s*\.lab-chip__ico \{ animation: none !important; \}/);
});

test('v516 : app.js tire au sort un logo et une animation, sans jamais bloquer', () => {
  assert.match(js, /function animerUnOutilAuHasard\(\) \{/);
  assert.match(js, /document\.querySelectorAll\("#ateliers-rapides \.lab-chip__ico"\)/);
  assert.match(js, /Math\.floor\(Math\.random\(\) \* cibles\.length\)/, 'logo tiré au hasard');
  assert.match(js, /Math\.floor\(Math\.random\(\) \* CLASSES_OUTIL_ANIM\.length\)/, 'animation tirée au hasard');
  assert.match(js, /var attente = 1500 \+ Math\.round\(Math\.random\(\) \* 2300\);/, 'cadence irrégulière');
  /* Rien ne bouge si le système demande moins de mouvement ou pendant un changement d'onglet. */
  assert.match(js, /\(prefers-reduced-motion: reduce\)/);
  assert.match(js, /if \(!document\.hidden\) animerUnOutilAuHasard\(\);/);
  assert.match(js, /initialiserAnimationsOutils\(\);/, 'branchement dans demarrerApplication');
  assert.match(js, new RegExp('CLASSES_OUTIL_ANIM = \\["sti-outil-anim-1", "sti-outil-anim-2", "sti-outil-anim-3", "sti-outil-anim-4", "sti-outil-anim-5"\\]'));
});
