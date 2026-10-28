import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash, webcrypto } from 'node:crypto';
import vm from 'node:vm';

/* Exécuter le véritable SW avec un CacheStorage et un réseau contrôlés : aucun
   fichier ou compte de production n'est touché par ces pannes synthétiques. */
async function environnement({ cible = './assets/js/app.js', panne = '' } = {}) {
  const origine = 'https://sti.example/';
  const magasins = new Map(), requetes = [], evenements = {};
  let erreur = panne, stockageBloque = false;
  const normaliser = req => new URL(typeof req === 'string' ? req : (req.href || req.url), origine).href;
  const sansRecherche = url => { const u = new URL(url); u.search = ''; return u.href; };
  const caches = {
    async keys() { return [...magasins.keys()]; },
    async delete(nom) { return magasins.delete(nom); },
    async open(nom) {
      if (!magasins.has(nom)) magasins.set(nom, new Map());
      const donnees = magasins.get(nom);
      return {
        async keys() { return [...donnees.keys()].map(url => new Request(url)); },
        async match(req, options = {}) {
          const cle = normaliser(req);
          if (donnees.has(cle)) return donnees.get(cle).clone();
          if (options.ignoreSearch) for (const [k, v] of donnees) if (sansRecherche(k) === sansRecherche(cle)) return v.clone();
          return undefined;
        },
        async put(req, rep) {
          if (stockageBloque && normaliser(req) === normaliser(cible)) throw new Error('stockage plein');
          donnees.set(normaliser(req), rep.clone());
        },
        async delete(req, options = {}) {
          const cle = normaliser(req); let supprime = donnees.delete(cle);
          if (options.ignoreSearch) for (const k of [...donnees.keys()]) if (sansRecherche(k) === sansRecherche(cle)) supprime = donnees.delete(k) || supprime;
          return supprime;
        }
      };
    },
    async match(req, options) {
      for (const nom of magasins.keys()) {
        const rep = await (await this.open(nom)).match(req, options);
        if (rep) return rep;
      }
      return undefined;
    }
  };
  const contexte = {
    URL, Request, Response, Promise, Date, Math, Number, String, Boolean, Object, Array, RegExp,
    encodeURIComponent, decodeURIComponent, encodeURI, parseInt, isFinite, setTimeout, clearTimeout, caches, crypto: webcrypto,
    fetch: async req => {
      const chemin = typeof req === 'string' ? req : req.url;
      requetes.push(chemin);
      if (sansRecherche(normaliser(req)) === sansRecherche(normaliser(cible))) {
        if (erreur === 'coupure') throw new Error('réseau indisponible');
        if (erreur === '503') return new Response('serveur indisponible', { status: 503 });
      }
      return new Response('nouveau : ' + chemin);
    },
    self: { location: new URL('sw.js', origine), addEventListener(n, fn) { evenements[n] = fn; },
      skipWaiting() {}, clients: { async claim() {}, async matchAll() { return []; } } }
  };
  vm.runInNewContext(await readFile(new URL('../sw.js', import.meta.url), 'utf8'), contexte, { filename: 'sw.js' });
  const cache = await caches.open(contexte.CACHE);
  await cache.put(cible + '?v=ancien', new Response('ancienne version'));
  await cache.put('./assets/js/inchange.js', new Response('script inchangé'));
  const videos = await caches.open(contexte.CACHE_VIDEOS_LABO);
  await videos.put('./assets/videos/exemple.mp4', new Response('vidéo conservée'));
  const revisions = await caches.open(contexte.CACHE_REVISIONS);
  for (const it of contexte.UPDATE_FILES) {
    const url = typeof it === 'string' ? it : it.url;
    const rev = typeof it === 'string' ? contexte.UPDATE_ID : it.revision;
    if (url === cible) continue;
    await revisions.put(new URL('./__sti_revision__/' + encodeURIComponent(url) + '?rev=' + encodeURIComponent(rev), origine), new Response('déjà appliquée'));
  }
  const item = contexte.UPDATE_FILES.find(it => (typeof it === 'string' ? it : it.url) === cible);
  assert.ok(item, 'la cible figure au manifeste différentiel');
  const revision = typeof item === 'string' ? contexte.UPDATE_ID : item.revision;
  const marqueur = new URL('./__sti_revision__/' + encodeURIComponent(cible) + '?rev=' + encodeURIComponent(revision), origine);
  async function synchroniser() {
    let travail;
    evenements.message({ data: { type: 'SYNC_UPDATE' }, waitUntil(p) { travail = p; } });
    await travail;
  }
  return { caches, cache, videos, revisions, marqueur, requetes, synchroniser,
    setPanne(v) { erreur = v; }, setStockageBloque(v) { stockageBloque = v; } };
}

for (const panne of ['503', 'coupure']) {
  test(`échec ${panne} : conserver le noyau hors ligne et retenter le seul fichier modifié`, async () => {
    const e = await environnement({ panne });
    await e.synchroniser();
    assert.equal(await (await e.cache.match('./assets/js/app.js', { ignoreSearch: true }))?.text(), 'ancienne version');
    assert.equal(await e.revisions.match(e.marqueur), undefined, 'une révision échouée ne doit pas être marquée comme installée');
    assert.equal(await (await e.cache.match('./assets/js/inchange.js')).text(), 'script inchangé');
    assert.equal(await (await e.videos.match('./assets/videos/exemple.mp4')).text(), 'vidéo conservée');
    e.setPanne('');
    await e.synchroniser();
    assert.match(await (await e.cache.match('./assets/js/app.js', { ignoreSearch: true })).text(), /^nouveau :/);
    assert.ok(await e.revisions.match(e.marqueur));
    assert.deepEqual(e.requetes, ['./assets/js/app.js', './assets/js/app.js']);
    await e.synchroniser();
    assert.equal(e.requetes.length, 2, 'aucun téléchargement si rien ne change');
  });
}

test('stockage plein : conserver le noyau et ne confirmer la révision qu’après une écriture réussie', async () => {
  const e = await environnement();
  e.setStockageBloque(true);
  await e.synchroniser();
  assert.equal(await (await e.cache.match('./assets/js/app.js', { ignoreSearch: true }))?.text(), 'ancienne version');
  assert.equal(await e.revisions.match(e.marqueur), undefined);
  e.setStockageBloque(false);
  await e.synchroniser();
  assert.match(await (await e.cache.match('./assets/js/app.js', { ignoreSearch: true })).text(), /^nouveau :/);
  assert.ok(await e.revisions.match(e.marqueur));
  assert.deepEqual(e.requetes, ['./assets/js/app.js', './assets/js/app.js']);
});

test('révision réussie : une seule requête pour le fichier concerné, médias et autres fichiers conservés', async () => {
  const e = await environnement();
  await e.synchroniser();
  assert.deepEqual(e.requetes, ['./assets/js/app.js']);
  assert.match(await (await e.cache.match('./assets/js/app.js', { ignoreSearch: true })).text(), /^nouveau :/);
  assert.equal(await (await e.cache.match('./assets/js/inchange.js')).text(), 'script inchangé');
  assert.equal(await (await e.videos.match('./assets/videos/exemple.mp4')).text(), 'vidéo conservée');
  await e.synchroniser();
  assert.equal(e.requetes.length, 1);
});

test('deux fichiers de même taille mais de contenu différent ne sont pas confondus', async () => {
  const cible = './assets/icons/sti-icon-192.png', e = await environnement({ cible });
  await e.cache.put(cible + '?v=ancien', new Response('x'.repeat(46307), { headers: { 'content-length': '46307' } }));
  await e.synchroniser();
  assert.deepEqual(e.requetes, [cible]);
  assert.match(await (await e.cache.match(cible, { ignoreSearch: true })).text(), /^nouveau :/);
  assert.ok(await e.revisions.match(e.marqueur));
});

test('une copie identique peut être reconnue sans téléchargement grâce à son empreinte', async () => {
  const cible = './assets/icons/sti-icon-192.png', e = await environnement({ cible });
  const original = await readFile(new URL('../assets/icons/sti-icon-192.png', import.meta.url));
  await e.cache.put(cible + '?v=ancien', new Response(original, { headers: { 'content-length': String(original.length) } }));
  await e.synchroniser();
  assert.deepEqual(e.requetes, []);
  assert.ok(await e.revisions.match(e.marqueur));
});

test('les empreintes des dépendances préchargées correspondent aux fichiers livrés', async () => {
  const source = await readFile(new URL('../sw.js', import.meta.url), 'utf8');
  const bloc = source.match(/var UPDATE_FILES = (\[[\s\S]*?\n\]);/);
  assert.ok(bloc);
  const elements = Array.from(vm.runInNewContext(bloc[1])).filter(it => it.bootstrapBySize);
  assert.equal(elements.length, 5);
  for (const it of elements) {
    const contenu = await readFile(new URL('../' + it.url.replace(/^\.\//, ''), import.meta.url));
    assert.equal(it.bytes, contenu.length, it.url);
    assert.equal(it.sha256, createHash('sha256').update(contenu).digest('hex'), it.url);
  }
});

for (const panne of ['503', 'coupure']) {
  test(`page appelante déjà visitée : ${panne} conserve la copie hors ligne et retente uniquement sa mise à jour`, async () => {
    const cible = './cours/html5.html', e = await environnement({ cible, panne });
    await e.synchroniser();
    assert.equal(await (await e.cache.match(cible, { ignoreSearch: true }))?.text(), 'ancienne version');
    assert.equal(await e.revisions.match(e.marqueur), undefined);
    e.setPanne('');
    await e.synchroniser();
    assert.match(await (await e.cache.match(cible, { ignoreSearch: true })).text(), /^nouveau :/);
    assert.ok(await e.revisions.match(e.marqueur));
    assert.deepEqual(e.requetes, [cible, cible]);
    assert.equal(await (await e.videos.match('./assets/videos/exemple.mp4')).text(), 'vidéo conservée');
  });
}
