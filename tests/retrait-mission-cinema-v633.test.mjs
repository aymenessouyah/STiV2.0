import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import vm from 'node:vm';

const lire = path => readFileSync(path, 'utf8');
const modulePaths = ['index.html', 'exercices/series-exercices.html', 'assets/js/app.js',
  'assets/js/admin-vues-videos.js', 'assets/js/admin.js', 'assets/js/protection.js',
  'assets/js/visionneuse-exercices.js', 'assets/data/nouveautes.json', 'assets/guide-exercice-catalogue.json'];

test('la mission et toutes ses vidéos restent retirées, seul le TP écrit revient dans le cours SQL', () => {
  assert.equal(existsSync('mission-cinema'), false);
  assert.ok(existsSync('exercices/sql/TP6-Mission-cinema-enonce.html'));
  assert.ok(existsSync('exercices/sql/Corrige_TD_SQL_Cinema.pdf'));
  assert.match(lire('cours/sql.html').split('<section id="exercices"')[1].split('<section id="annexes"')[0], /TP6-Mission-cinema-enonce\.html/);
  for (const path of modulePaths) assert.doesNotMatch(lire(path), /mission-cinema|sql-tp6-mission-cinema|TD_SQL_Cinema/i, path);
  assert.match(lire('cours/sql.html'), /Série 7 · Le gérant de la boutique/);
  assert.ok(existsSync('exercices/sql/serie-7/enonce.html'));
  assert.ok(existsSync('assets/videos/sql-serie5.mp4'));
});

test('le manifeste et le précache ne proposent plus les fichiers supprimés', () => {
  const manifest = JSON.parse(lire('offline-complete-manifest.json'));
  assert.ok(!manifest.files.some(x => /^mission-cinema\//i.test(x.path)));
  assert.ok(manifest.files.some(x => x.path === 'exercices/sql/TP6-Mission-cinema-enonce.html'));
  assert.ok(manifest.files.some(x => x.path === 'exercices/sql/Corrige_TD_SQL_Cinema.pdf'));
  assert.equal(manifest.totalFiles, manifest.files.length);
  assert.equal(manifest.totalBytes, manifest.files.reduce((sum, x) => sum + x.bytes, 0));
  const sw = lire('sw.js');
  const listes = sw.slice(sw.indexOf('var UPDATE_FILES ='), sw.indexOf('/* Retrait de Mission cinéma'));
  assert.doesNotMatch(listes, /["']\.\/mission-cinema\//i);
  assert.match(listes, /TP6-Mission-cinema-enonce\.html/);
});

test('activation : suppression des anciennes copies dans les caches, sans effacer les autres fichiers', async () => {
  const origin = 'https://example.test/STiV2.0/';
  const magasins = new Map(), events = {};
  const url = r => new URL(typeof r === 'string' ? r : r.url, origin).href;
  const caches = {
    async keys() { return [...magasins.keys()]; },
    async delete(n) { return magasins.delete(n); },
    async open(n) {
      if (!magasins.has(n)) magasins.set(n, new Map());
      const map = magasins.get(n);
      return {
        async keys() { return [...map.keys()].map(x => new Request(x)); },
        async put(r, v) { map.set(url(r), v.clone()); },
        async match(r, opts = {}) { const u = url(r); for (const [k,v] of map) if (k === u || (opts.ignoreSearch && k.split('?')[0] === u.split('?')[0])) return v.clone(); },
        async delete(r) { return map.delete(url(r)); }
      };
    }
  };
  const ctx = { URL, Request, Response, caches, Promise, Date, Math, Number, String, Object, Array, RegExp, encodeURIComponent, decodeURIComponent, encodeURI, setTimeout, clearTimeout,
    self: { location: new URL('sw.js', origin), addEventListener(n, f) { events[n] = f; }, clients: { async claim() {} } } };
  vm.runInNewContext(lire('sw.js'), ctx);
  const active = await caches.open(ctx.CACHE), video = await caches.open(ctx.CACHE_VIDEOS_LABO), old = await caches.open('sti-atelier-v1');
  const deleted = ['mission-cinema/index.html?v=1', 'mission-cinema/assets/video/TD_SQL_Cinema_corrige_v3.mp4'];
  for (const cache of [active, video, old]) {
    for (const file of deleted) await cache.put(file, new Response('à supprimer'));
    await cache.put('assets/videos/sql-serie5.mp4', new Response('à conserver'));
  }
  let travail; events.activate({ waitUntil(p) { travail = p; } }); await travail;
  for (const cache of [active, video]) {
    for (const file of deleted) assert.equal(await cache.match(file), undefined, file);
    assert.equal(await (await cache.match('assets/videos/sql-serie5.mp4')).text(), 'à conserver');
  }
  assert.equal(ctx.ressourceMissionCinemaRetiree(new URL(origin + 'exercices/sql/TP6-Mission-cinema-enonce.html')), false);
  let reponse; events.fetch({ request: new Request(origin + deleted[0]), respondWith(p) { reponse = p; } });
  assert.equal((await reponse).status, 410);
  assert.equal(ctx.ressourceMissionCinemaRetiree(new URL('https://elsewhere.test/STiV2.0/mission-cinema/index.html')), false);
  assert.equal(ctx.ressourceMissionCinemaRetiree(new URL(origin + 'exercices/sql/serie-7/enonce.html')), false);
});
