import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = p => readFileSync(p, 'utf8');
test('les titres des synthèses clignotent dans le catalogue et leurs cours', () => {
  for (const [path, titles] of [
    ['exercices/series-exercices.html', ['Série de Synthèse JavaScript', 'Série 6 de Synthèse PHP', 'Série 8 Synthèse · Le directeur du restaurant Dar Zitouna.']],
    ['cours/javascript.html', ['Série de Synthèse JavaScript']],
    ['cours/php.html', ['Série 6 de Synthèse PHP']],
    ['cours/sql.html', ['Série 8 Synthèse · Le directeur du restaurant Dar Zitouna.']]
  ]) {
    const html = read(path);
    for (const title of titles) {
      assert.ok(html.includes(`<h3 class="titre-synthese">${title}</h3>`));
      const card = html.slice(html.lastIndexOf('<article ', html.indexOf(title)), html.indexOf(title));
      if (path.startsWith('cours/')) assert.ok(card.includes('Ceci c’est la synthèse en théorique'));
    }
    assert.equal((html.match(/<span class="badge-synthese-gold">Ceci c’est la synthèse en théorique<\/span>/g) || []).length, titles.length);
    assert.match(html, /transform:\s*rotate\(-3deg\)/);
    assert.match(html, /\.titre-synthese\s*\{\s*animation:\s*synthese-clignote\s+2s/);
    assert.match(html, /@keyframes\s+synthese-clignote/);
    assert.match(html, /@media\s*\(prefers-reduced-motion:\s*reduce\),\s*print\s*\{\s*\.titre-synthese\s*\{\s*animation:\s*none/);
    assert.match(read('sw.js'), new RegExp(`url: "\./${path.replaceAll('.', '\\.')}", revision: "badge-synthese-v669"`));
  }
});
