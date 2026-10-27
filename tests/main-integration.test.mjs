import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

const racine = resolve(new URL('..', import.meta.url).pathname);
const lire = chemin => readFileSync(resolve(racine, chemin), 'utf8');
const sw = lire('sw.js');
const manifeste = JSON.parse(lire('offline-complete-manifest.json'));
const blocUpdates = sw.split('var UPDATE_FILES = [')[1].split('];')[0];
const entrees = [...blocUpdates.matchAll(/\{\s*url:\s*"([^"]+)",\s*revision:\s*"([^"]+)"\s*\}/g)];
const revisions = new Map(entrees.map(m => [m[1], m[2]]));

/* Le résolveur conserve à la fois les correctifs de main et les ressources de la refonte. */
test('fusion du service worker : cache inédit, révisions XP/médias et refonte conservées', () => {
  assert.match(sw, /var CACHE = "sti-atelier-v341"/);
  assert.match(sw, /var UPDATE_ID = "v480-integration-refonte-20261027"/);
  assert.equal(entrees.length, revisions.size, 'aucune URL de mise à jour en double');
  for (const chemin of ['index.html', 'dashboard.html', 'exercices/series-exercices.html', 'cours/html5.html', 'cours/css3.html', 'cours/javascript.html', 'cours/sql.html', 'cours/php.html', 'assets/js/app.js', 'assets/js/profil.js', 'assets/css/theme.css', 'README.md', 'offline-complete-manifest.json']) {
    assert.equal(revisions.get('./' + chemin), 'integration-main-v480', chemin);
  }
  for (const chemin of ['assets/js/config.js', 'assets/js/acces.js', 'assets/js/protection.js', 'assets/js/sync-progressions.js', 'assets/js/reprendre.js']) {
    assert.equal(revisions.get('./' + chemin), 'compteur-media-v479', chemin);
  }
  for (const chemin of ['assets/js/quiz-sync.js', 'quiz/sql.html', 'quiz/php.html', 'quiz/html-css.html', 'quiz/javascript.html']) {
    assert.equal(revisions.get('./' + chemin), 'xp-quiz-monotone-v478', chemin);
  }
  for (const chemin of ['assets/css/cours-matieres.css', 'assets/js/cours-matieres.js', 'assets/js/cours-sql-worker.js', 'assets/js/profil.js', 'assets/js/app.js']) {
    assert.ok(revisions.has('./' + chemin), chemin);
  }
  assert.ok([...revisions.keys()].every(chemin => !/\.(?:mp4|mp3|pdf|zip|wasm)$/i.test(chemin)), 'pas de médias lourds dans la mise à jour automatique');
});

test('les scripts historiques sont chargés une seule fois et dans l’ordre requis', () => {
  for (const chemin of ['index.html', 'dashboard.html', 'cours/html5.html', 'cours/css3.html', 'cours/javascript.html', 'cours/sql.html', 'cours/php.html']) {
    const html = lire(chemin);
    const tags = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>/g)];
    const sources = tags.map(m => m[1].split('?')[0].split('/').pop());
    const positions = ['config.js', 'supabase-umd.js', 'acces.js', 'sync-progressions.js', 'profil.js', 'app.js'].map(n => sources.indexOf(n));
    assert.ok(positions.every((n, i) => n >= 0 && (!i || n > positions[i - 1])), chemin + ' : ordre des scripts');
    assert.ok(tags[positions[4]][0].includes('defer'), chemin + ' : profil chargé après la session');
    assert.equal(sources.filter(n => n === 'protection.js').length, 1, chemin);
    assert.match(html, /protection\.js\?v=227&amp;rev=479/, chemin + ' : détection par acces.js et cache-buster');
  }
  assert.match(lire('index.html'), /reprendre\.js\?v=479/, 'la reprise historique reste disponible');
  assert.match(lire('exercices/series-exercices.html'), /protection\.js\?v=227&amp;rev=479/);
});

test('manifeste hors ligne fusionné : toutes les empreintes et les deux migrations sont exactes', () => {
  assert.equal(manifeste.version, 'v480-sti-atelier-v341');
  assert.equal(manifeste.totalFiles, manifeste.files.length);
  assert.equal(manifeste.totalBytes, manifeste.files.reduce((total, f) => total + f.bytes, 0));
  assert.equal(new Set(manifeste.files.map(f => f.path.toLowerCase())).size, manifeste.files.length, 'pas de doublons de casse');
  for (const migration of ['supabase/migrations/20261027_xp_quiz_monotone_v478.sql', 'supabase/migrations/20261027_media_prog_monotone_v479.sql']) {
    assert.ok(manifeste.files.some(f => f.path === migration), migration);
  }
  for (const entree of manifeste.files) {
    const data = readFileSync(resolve(racine, entree.path));
    const sha = createHash('sha1').update(`blob ${data.length}\0`).update(data).digest('hex');
    assert.equal(entree.bytes, data.length, entree.path);
    assert.equal(entree.gitSha, sha, entree.path);
  }
});

/* Une installation factice exerce le vrai code SW, sans réseau ni stockage du navigateur. */
async function simulerMigration(nomAncien, marqueurs) {
  const origine = 'https://sti.example/';
  const magasins = new Map();
  const requetes = [];
  const normaliser = req => new URL(typeof req === 'string' ? req : req.url, origine).href;
  const sansRecherche = url => { const u = new URL(url); u.search = ''; return u.href; };
  const api = {
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
          if (options.ignoreSearch) {
            for (const [k, v] of donnees) if (sansRecherche(k) === sansRecherche(cle)) return v.clone();
          }
          return undefined;
        },
        async put(req, reponse) { donnees.set(normaliser(req), reponse.clone()); },
        async delete(req, options = {}) {
          const cle = normaliser(req);
          let supprime = donnees.delete(cle);
          if (options.ignoreSearch) {
            for (const k of [...donnees.keys()]) if (sansRecherche(k) === sansRecherche(cle)) supprime = donnees.delete(k) || supprime;
          }
          return supprime;
        }
      };
    },
    async match(req, options) {
      for (const nom of magasins.keys()) {
        const reponse = await (await this.open(nom)).match(req, options);
        if (reponse) return reponse;
      }
      return undefined;
    }
  };
  const ancien = await api.open(nomAncien);
  for (const [chemin, texte] of [
    ['/', 'ancien accueil'], ['/index.html', 'ancien accueil'],
    ['/cours/sql.html', 'ancien cours SQL'], ['/exercices/series-exercices.html', 'anciennes séries'],
    ['/assets/js/sync-progressions.js?v=479', 'sync existante'], ['/quiz/sql.html', 'quiz existant'],
    ['/assets/js/sqljs/sql-wasm.wasm', 'sqlite existant'], ['/assets/videos/exemple.mp4', 'vidéo locale']
  ]) await ancien.put(origine + chemin.replace(/^\//, ''), new Response(texte));
  const cacheRevisions = await api.open('sti-update-revisions-v1');
  for (const [chemin, revision] of marqueurs) {
    const url = new URL('./__sti_revision__/' + encodeURIComponent(chemin) + '?rev=' + encodeURIComponent(revision), origine);
    await cacheRevisions.put(url.href, new Response('révision enregistrée'));
  }
  const evenements = {};
  const contexte = {
    URL, Request, Response, Promise, Date, Math, Number, String, Boolean, Object, Array, RegExp,
    encodeURIComponent, decodeURIComponent, encodeURI, parseInt, isFinite, setTimeout, clearTimeout,
    caches: api,
    fetch: async url => { requetes.push(String(url)); return new Response('nouveau : ' + url); },
    self: {
      location: new URL('sw.js', origine),
      addEventListener(nom, fn) { evenements[nom] = fn; },
      skipWaiting() {},
      clients: { async claim() {}, async matchAll() { return []; } }
    }
  };
  vm.runInNewContext(sw, contexte, { filename: 'sw.js' });
  for (const nom of ['install', 'activate']) {
    let travail;
    evenements[nom]({ waitUntil(p) { travail = p; } });
    await travail;
  }
  return { api, magasins, requetes };
}

test('migration du cache main v340 : pas de retour à l’ancien accueil ni de perte des fichiers inchangés', async () => {
  const result = await simulerMigration('sti-atelier-v340', [
    ['./assets/js/sync-progressions.js', 'compteur-media-v479'], ['./quiz/sql.html', 'xp-quiz-monotone-v478']
  ]);
  assert.equal(result.magasins.has('sti-atelier-v340'), false);
  const cache = await result.api.open('sti-atelier-v341');
  assert.match(await (await cache.match('https://sti.example/')).text(), /^nouveau :/);
  assert.match(await (await cache.match('https://sti.example/index.html')).text(), /^nouveau :/);
  assert.equal(await cache.match('https://sti.example/cours/sql.html'), undefined, 'ancien cours invalidé');
  assert.equal(await cache.match('https://sti.example/exercices/series-exercices.html'), undefined, 'anciennes séries invalidées');
  assert.equal(await (await cache.match('https://sti.example/assets/js/sync-progressions.js', { ignoreSearch: true })).text(), 'sync existante');
  assert.equal(await (await cache.match('https://sti.example/quiz/sql.html')).text(), 'quiz existant');
  assert.equal(await (await cache.match('https://sti.example/assets/js/sqljs/sql-wasm.wasm')).text(), 'sqlite existant');
  const videos = await result.api.open('sti-videos-labo-v1');
  assert.equal(await (await videos.match('https://sti.example/assets/videos/exemple.mp4')).text(), 'vidéo locale');
  assert.ok(result.requetes.every(url => !/\.(mp4|mp3|pdf|wasm)(?:$|\?)/i.test(url)), 'aucun téléchargement de média lourd');
});

test('migration du cache de la branche v339 : anciennes versions XP et médias invalidées', async () => {
  const result = await simulerMigration('sti-atelier-v339', [
    ['./assets/js/sync-progressions.js', 'retour-quiz-v476'], ['./quiz/sql.html', 'retour-quiz-v476']
  ]);
  const cache = await result.api.open('sti-atelier-v341');
  assert.equal(await cache.match('https://sti.example/assets/js/sync-progressions.js', { ignoreSearch: true }), undefined);
  assert.equal(await cache.match('https://sti.example/quiz/sql.html'), undefined);
  assert.equal(await (await cache.match('https://sti.example/assets/js/sqljs/sql-wasm.wasm')).text(), 'sqlite existant');
});
