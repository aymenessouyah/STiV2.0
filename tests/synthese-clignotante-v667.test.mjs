import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = p => readFileSync(p, 'utf8');
test('les titres des synthèses clignotent dans le catalogue et leurs cours', () => {
  for (const [path, titles] of [
    ['exercices/series-exercices.html', ['Série de Synthèse JavaScript', 'Série 6 de Synthèse PHP']],
    ['cours/javascript.html', ['Série de Synthèse JavaScript']],
    ['cours/php.html', ['Série 6 de Synthèse PHP']]
  ]) {
    const html = read(path);
    for (const title of titles) assert.ok(html.includes(`<h3 class="titre-synthese">${title}</h3>`));
    assert.match(html, /\.titre-synthese\s*\{\s*animation:\s*synthese-clignote\s+2s/);
    assert.match(html, /@keyframes\s+synthese-clignote/);
    assert.match(html, /@media\s*\(prefers-reduced-motion:\s*reduce\),\s*print\s*\{\s*\.titre-synthese\s*\{\s*animation:\s*none/);
    assert.ok(read('sw.js').includes(`url: "./${path}", revision: "synthese-clignotante-v667"`));
  }
});
