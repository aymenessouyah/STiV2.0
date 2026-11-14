import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = p => readFileSync(p, 'utf8');
const sw = read('sw.js');
const start = sw.indexOf('  /* Les contrôles Stipack ne doivent jamais');
const end = sw.indexOf('  /* Ressources CDN versionnées', start);
assert.ok(start >= 0 && end > start);
const block = sw.slice(start, end);
async function simuler(path, network, cached) {
  const url = new URL(path, 'https://example.test/STiV2.0/');
  let promise, cacheArgs;
  const evt = { respondWith(p) { promise = p; } };
  const req = new Request(url.href);
  const caches = { open: async () => ({ put: async () => {} }), match: async (...args) => { cacheArgs = args; return cached; } };
  new Function('url', 'self', 'evt', 'req', 'fetch', 'caches', 'CACHE', 'Response', block)(
    url, {location: {origin: url.origin}}, evt, req, network, caches, 'cache', Response);
  return { rep: await promise, cacheArgs };
}
test('les scripts Stipack revalidés au réseau ne reprennent pas une ancienne version', async () => {
  for (const path of ['assets/js/stipack.js?v=672', 'assets/js/admin-stipack.js?v=672']) {
    const frais = await simuler(path, async () => new Response('nouveau'), new Response('ancien'));
    assert.equal(await frais.rep.text(), 'nouveau');
    const absent = await simuler(path, async () => { throw new Error('offline'); }, undefined);
    assert.equal(absent.rep.type, 'error');
    assert.equal(absent.cacheArgs.length, 1, 'la recherche hors ligne est exacte, sans ignoreSearch');
    const exact = await simuler(path, async () => { throw new Error('offline'); }, new Response('version exacte'));
    assert.equal(await exact.rep.text(), 'version exacte');
  }
});
test('le manifeste de contrôle est lu sur le réseau et jamais repris dans le cache', async () => {
  const frais = await simuler('offline-complete-manifest.json?stipack=123', async () => new Response('nouveau'), new Response('ancien'));
  assert.equal(await frais.rep.text(), 'nouveau');
  const echec = await simuler('offline-complete-manifest.json?stipack=123', async () => { throw new Error('offline'); }, new Response('ancien'));
  assert.equal(echec.rep.type, 'error'); assert.equal(echec.cacheArgs, undefined);
});
test('la release GitHub est accessible séparément, sans prétendre que le téléchargement est vérifié', () => {
  const html = read('admin.html');
  assert.match(html, /https:\/\/github\.com\/aymenessouyah\/STiV2\.0\/releases\/tag\/labo3-windows/);
  assert.match(html, /vérification manuelle/);
  assert.match(html, /Get-FileHash/);
  for (const name of ['stipack.js', 'admin-stipack.js']) {
    assert.ok(sw.includes(`url: "./assets/js/${name}", revision: "stipack-fraicheur-v672", refreshIfCached: true`));
    assert.ok(html.includes(`assets/js/${name}?v=672`));
  }
});
