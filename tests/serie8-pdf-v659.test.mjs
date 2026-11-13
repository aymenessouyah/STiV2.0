import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const lire = p => readFileSync(p, 'utf8');

test('les liens série 8 prévoient l’ouverture native sur mobile', () => {
  for (const file of ['cours/sql.html', 'exercices/series-exercices.html']) {
    const s = lire(file);
    for (const nom of ['enonce-serie8-restaurant-v4.pdf', 'corrige-serie8-restaurant-v3.pdf']) {
      assert.ok(s.includes(nom + '" data-pdf-natif-mobile target="_blank"'), file + ' ' + nom);
    }
  }
});

test('la visionneuse laisse le navigateur ouvrir ces PDF sur Android et si le lecteur est absent', () => {
  for (const [userAgent, pdfViewerEnabled] of [['Mozilla/5.0 (Linux; Android 14) Chrome/120', true], ['Mozilla/5.0 desktop', false]]) {
    const handlers = {};
    const document = { readyState: 'loading', addEventListener(n, f) { handlers[n] = f; },
      getElementById() { return null; }, querySelectorAll() { return []; }, body: {},
      documentElement: { classList: { contains() { return true; } } } };
    const window = { document, location: { origin: 'https://example.test' } };
    vm.runInNewContext(lire('assets/js/visionneuse-exercices.js'), { window, document, navigator: { userAgent, pdfViewerEnabled }, WeakSet, URL });
    handlers.DOMContentLoaded();
    let stopped = false;
    const a = { hasAttribute(n) { return n === 'data-pdf-natif-mobile'; } };
    handlers.click({ target: { closest() { return a; } }, button: 0, defaultPrevented: false,
      preventDefault() { stopped = true; }, stopImmediatePropagation() { stopped = true; } });
    assert.equal(stopped, false);
  }
});

test('les anciennes adresses PDF de série 8 sont redirigées vers les nouveaux fichiers', () => {
  const s = lire('sw.js');
  for (const nom of ['enonce-serie8-restaurant.pdf', 'enonce-serie8-restaurant-v2.pdf', 'enonce-serie8-restaurant-v3.pdf']) {
    assert.ok(s.includes(`serie-8/${nom}", racineCapsule).pathname] = "exercices/sql/serie-8/enonce-serie8-restaurant-v4.pdf"`));
  }
  for (const nom of ['corrige-serie8-restaurant.pdf', 'corrige-serie8-restaurant-v2.pdf']) {
    assert.ok(s.includes(`serie-8/${nom}", racineCapsule).pathname] = "exercices/sql/serie-8/corrige-serie8-restaurant-v3.pdf"`));
  }
});
