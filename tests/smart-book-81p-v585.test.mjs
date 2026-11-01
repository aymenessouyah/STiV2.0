/*
  v585 — partout « Smart Book 3ᵉ SI : 81 pages » (édition 2026), plus jamais 72.

  Le manuel 3ᵉ SI a été remplacé par l'édition 2026 de 81 pages (les fiches, puis les
  tableaux), avec la partie « Systèmes, technologies et Internet » en tête (p. 5 à 13).
  `livre-smart.html`, `assets/js/smart-book.js` et `assets/data/smart-book-3si-2026.json`
  étaient déjà à jour ; deux textes de présentation annonçaient encore l'ancienne
  édition de 72 pages : la tuile du tableau de bord et le guide du tableau de bord.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const read = (p) => readFileSync(resolve(root, p), 'utf8');
const json = (p) => JSON.parse(read(p));

test('v585 : les données du manuel 3ᵉ SI disent bien 81 pages (édition 2026)', () => {
  const livre = json('assets/data/smart-book-3si-2026.json');
  assert.equal(livre.bookId, '3si-2026');
  assert.equal(livre.pages, 81, 'l’édition 2026 du manuel 3ᵉ SI compte 81 pages');
  assert.equal(livre.fiches, 53);
  assert.match(String(livre.partie), /Systèmes, technologies et Internet \(pages 5 à 13\)/);

  /* Le 4ᵉ SI n'a pas changé : 100 pages. */
  assert.equal(json('assets/data/smart-book-2026.json').pages, 100);
});

test('v585 : la tuile du tableau de bord annonce 81 pages', () => {
  const html = read('dashboard.html');
  assert.match(html, /Smart Book 3e SI \(81 p\.\) &amp; 4e SI \(100 p\.\)/);
  assert.doesNotMatch(html, /3e SI \(72 p\.\)/, 'l’ancienne édition de 72 pages ne doit plus apparaître');
  assert.equal((html.match(/Smart Book 3e SI \(72 p\.\)/g) || []).length, 0);
});

test('v585 : le guide du tableau de bord annonce 81 pages', () => {
  const html = read('admin.html');
  assert.match(html, /2 Smart Books QR<\/b> \(3SI 81 p\. &amp; 4SI 100 p\.\)/);
  assert.doesNotMatch(html, /3SI 72 p\./);
});

test('v585 : le lecteur de livre et le README concordent', () => {
  assert.match(read('livre-smart.html'), /3ème SI <span>81 pages<\/span>/);
  /* Le moteur du lecteur déclare lui-même la pagination du manuel. */
  assert.match(read('assets/js/smart-book.js'), /'3si-2026': \{[^}]*pages: 81/);

  const readme = read('README.md');
  assert.match(readme, /\*3ᵉ SI\* \(\*\*81 pages\*\*, édition 2026/);
});

test('v585 : le Service Worker sert les deux pages corrigées', () => {
  const sw = read('sw.js');
  /* v587 : admin.html repart au lot « publication-v590 » (version + date de mise à
     jour dans le badge) ; le tableau de bord élève reste au lot v585. */
  for (const [url, revision] of [['./dashboard.html', 'flamme-regularite-v611'], ['./admin.html', 'guide-secours-v616']]) {
    const ligne = sw.split('\n').find((l) => l.includes('url: "' + url + '"'));
    assert.ok(ligne, 'entrée sw.js absente : ' + url);
    assert.ok(ligne.includes('revision: "' + revision + '"'), 'révision à jour attendue pour ' + url + ' (' + revision + ')');
  }
  /* Toujours pas de re-téléchargement massif : cache et identifiant de publication figés. */
  assert.match(sw, /var CACHE = "sti-atelier-v386";/);
  assert.match(sw, /var UPDATE_ID = "v582-journal-connexions";/);
});
