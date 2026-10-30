import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, webcrypto } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

const racine = resolve(new URL('..', import.meta.url).pathname);
const lire = chemin => readFileSync(resolve(racine, chemin), 'utf8');
const sw = lire('sw.js');
const manifeste = JSON.parse(lire('offline-complete-manifest.json'));
const blocUpdates = sw.split('var UPDATE_FILES = [')[1].split('];')[0];
const entrees = [...blocUpdates.matchAll(/\{\s*url:\s*"([^"]+)",\s*revision:\s*"([^"]+)"(?:\s*,[^}]*)?\s*\}/g)];
const revisions = new Map(entrees.map(m => [m[1], m[2]]));

/* Le résolveur conserve à la fois les correctifs de main et les ressources de la refonte. */
test('fusion du service worker : cache inédit, révisions XP/médias et refonte conservées', () => {
  assert.match(sw, /var CACHE = "sti-atelier-v386"/);
  assert.match(sw, /var UPDATE_ID = "v553-defilement-passif-20261030"/);
  assert.equal(entrees.length, revisions.size, 'aucune URL de mise à jour en double');
  /* v520 : profil.js porte le plancher anti-recul des XP. */
  assert.equal(revisions.get('./assets/js/profil.js'), 'xp-jamais-en-recul-v520');
  for (const chemin of [
    'assets/icons/matieres.svg',
    'assets/js/suivi-profil.js'
  ]) {
    assert.equal(revisions.get('./' + chemin), 'suivi-contextes-v491', chemin);
  }
  /* v529 : reconnexion-profil.js fusionne les compteurs de vues par appareil. */
  assert.equal(revisions.get('./assets/js/reconnexion-profil.js'), 'vues-videos-v531');
  /* v523 : la page des séries gagne les liens du TP Train (Série 5). */
  assert.equal(revisions.get('./exercices/series-exercices.html'), 'serie6-exercices-v524');
  assert.equal(revisions.get('./assets/js/cours-html5.js'), 'tp-display-v510');
  assert.equal(revisions.get('./assets/js/cours-css3.js'), 'tp-transitions-v512');
  for (const chemin of ['assets/js/cours-javascript.js', 'assets/js/cours-matieres.js']) {
    assert.equal(revisions.get('./' + chemin), 'progression-chapitres-v492', chemin);
  }
  for (const chemin of ['assets/js/retour-quiz.js', 'assets/js/appel-quiz.js']) {
    assert.equal(revisions.get('./' + chemin), 'retour-quiz-intelligent-v494', chemin);
  }
  /* v521 : les pages HTML gagnent leur meta description ; seules les pages
     réellement modifiées changent de révision, les modules restent sur leur lot. */
  assert.equal(revisions.get('./revision-erreurs.html'), 'meta-seo-v521');
  /* v519 : le tirage aléatoire des quiz. */
  for (const chemin of ['assets/js/quiz-tableaux.js', 'assets/js/quiz-alea.js']) {
    assert.equal(revisions.get('./' + chemin), 'plafond-a-v555', chemin);
  }
  /* v520 : les cinq pages de quiz, le synchroniseur et le moteur XP invalident
     leur ancienne copie pour que le compteur ne recule plus. */
  for (const chemin of ['assets/js/quiz-sync.js', 'assets/js/xp-plancher.js']) {
    assert.equal(revisions.get('./' + chemin), 'xp-jamais-en-recul-v520', chemin);
  }
  /* v529 : le synchroniseur fusionne aussi les compteurs de vues vidéo. */
  assert.equal(revisions.get('./assets/js/sync-progressions.js'), 'pastille-sync-v534');
  /* v521 : les cinq pages de quiz gardent le garde-fou XP et gagnent leur meta description.
     v552 : quiz/php.html reçoit deux aria-label sur ses boutons icône (audit d’accessibilité). */
  for (const chemin of ['quiz/html-css.html', 'quiz/javascript.html', 'quiz/sql.html', 'quiz/tableaux.html']) {
    assert.equal(revisions.get('./' + chemin), 'plafond-a-v555', chemin);
  }
  assert.equal(revisions.get('./quiz/php.html'), 'plafond-a-v555');
  /* v498 : accueil (drapeau, fond vidéo, ruban) — app.js, index, dashboard, thème. */
  assert.equal(revisions.get('./assets/js/app.js'), 'etiquette-capsule-v571');
  assert.equal(revisions.get('./index.html'), 'etiquette-capsule-v571');
  assert.equal(revisions.get('./offline-complete-manifest.json'), 'classe-nav-v536');
  assert.equal(revisions.get('./README.md'), 'xp-jamais-en-recul-v520');
  for (const chemin of ['dashboard.html', 'assets/images/drapeau-tunisie.svg']) {
    assert.equal(revisions.get('./' + chemin), 'accueil-lycee-v503', chemin);
  }
  /* v517 : le ruban lit mieux la classe — la 4e SI passe au vert. */
  assert.equal(revisions.get('./assets/js/news-perso.js'), 'ruban-vert-v517');
  /* v507 : ruban sans logo et compteurs de vidéos. */
  assert.equal(revisions.get('./assets/css/theme.css'), 'classe-nav-v536');
  assert.equal(revisions.get('./admin.html'), 'photo-secours-v562');
  assert.equal(revisions.get('./assets/js/sante.js'), 'tp-transitions-v512');
  /* v509 : drapeau STI animé par le vent en fond de « Bonjour ». */
  assert.equal(revisions.get('./index.html'), 'etiquette-capsule-v571');
  assert.equal(revisions.get('./assets/js/admin.js'), 'photo-secours-v562');
  assert.equal(revisions.get('./assets/css/cours.css'), 'retrait-fond-cours-v508');
  /* v563 : le cours SQL accueille la convention d'écriture d'un schéma. */
  assert.equal(revisions.get('./cours/sql.html'), 'schema-notation-v563');
  /* v549 : la page PHP reçoit la capsule des variables. */
  assert.equal(revisions.get('./cours/php.html'), 'etiquette-capsule-v571');
  /* v523 : le cours JavaScript reçoit les liens du TP Train. */
  assert.equal(revisions.get('./cours/javascript.html'), 'etiquette-capsule-v571');
  assert.equal(revisions.get('./cours/html5.html'), 'tp-display-v510');
  assert.equal(revisions.get('./cours/css3.html'), 'tp-transitions-v512');
  assert.equal(revisions.get('./assets/js/cours-onglets-mobile.js'), 'onglets-mobile-v493');
  /* v526 : le lecteur commun suit la nouvelle capsule ; les sous-titres restent sur leur lot. */
  assert.equal(revisions.get('./assets/js/lecteur-commun.js'), 'php-chaines-v566');
  assert.equal(revisions.get('./assets/subtitles/validation-nom-prenom-js-fr.vtt'), 'video-js-validation-v485');
  assert.equal(revisions.get('./assets/js/protection.js'), 'php-chaines-v566');
  for (const chemin of ['package.json', 'package-lock.json']) {
    assert.equal(revisions.get('./' + chemin), 'xp-operations-v487', chemin);
  }
  assert.equal(revisions.get('./assets/js/mobile-nav.js'), 'defilement-passif-v553');
  for (const chemin of ['assets/css/badge-compte.css', 'assets/images/badge-compte-vierge.png']) {
    assert.equal(revisions.get('./' + chemin), 'badge-image-v488', chemin);
  }
  /* v553 : la roue écoute le défilement en mode passif (audit de fluidité). */
  assert.equal(revisions.get('./assets/js/roue-initiales.js'), 'photo-secours-v562');
  for (const chemin of ['assets/css/theme-patrimoine.css']) {
    assert.equal(revisions.get('./' + chemin), 'fidelite-origine-v481', chemin);
  }
  assert.equal(revisions.get('./assets/js/acces.js'), 'photo-secours-v562');
  /* v529 : masquer la reprise ne doit pas effacer le compteur de vues vidéo. */
  assert.equal(revisions.get('./assets/js/reprendre.js'), 'vues-videos-v531');
  assert.equal(revisions.get('./assets/js/config.js'), 'barre-mobile-v532');
  assert.equal(revisions.get('./assets/js/sync-progressions.js'), 'pastille-sync-v534');
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
  assert.equal(manifeste.version, 'v553-sti-atelier-v386');
  assert.equal(manifeste.totalFiles, manifeste.files.length);
  assert.ok(manifeste.files.some(f => f.path === 'assets/js/xp-plancher.js'), 'le garde-fou XP est livré hors ligne');
  assert.equal(manifeste.totalBytes, manifeste.files.reduce((total, f) => total + f.bytes, 0));
  assert.equal(new Set(manifeste.files.map(f => f.path.toLowerCase())).size, manifeste.files.length, 'pas de doublons de casse');
  for (const migration of ['supabase/migrations/20261027_xp_quiz_monotone_v478.sql', 'supabase/migrations/20261027_media_prog_monotone_v479.sql', 'supabase/migrations/20261027_xp_quiz_sync_v485.sql', 'supabase/migrations/20261027_xp_quiz_operations_v487.sql', 'supabase/migrations/20261028_xp_parties_idempotentes_v490.sql']) {
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
async function simulerMigration(nomAncien, marqueurs, ressourcesExistantes = [], options = {}) {
  const origine = 'https://sti.example/';
  const magasins = new Map();
  const requetes = [];
  let appelsListeCaches = 0, annoncerClaim, poursuivreClaim;
  const claimCommence = new Promise(resolve => { annoncerClaim = resolve; });
  const claimAutorise = new Promise(resolve => { poursuivreClaim = resolve; });
  const normaliser = req => new URL(typeof req === 'string' ? req : req.url, origine).href;
  const sansRecherche = url => { const u = new URL(url); u.search = ''; return u.href; };
  const api = {
    async keys() { appelsListeCaches++; return [...magasins.keys()]; },
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
    ['/assets/js/app.js', 'ancienne application'], ['/assets/js/profil.js', 'ancien profil'], ['/assets/css/theme.css', 'ancien thème'],
    ['/assets/js/sqljs/sql-wasm.wasm', 'sqlite existant'], ['/assets/videos/exemple.mp4', 'vidéo locale']
  ]) await ancien.put(origine + chemin.replace(/^\//, ''), new Response(texte));
  for (const [chemin, taille, contenu] of ressourcesExistantes) {
    await ancien.put(origine + chemin.replace(/^\//, ''), new Response(contenu ?? 'fichier conservé', { headers: { 'content-length': String(taille) } }));
  }
  const cacheRevisions = await api.open('sti-update-revisions-v1');
  for (const [chemin, revision] of marqueurs) {
    const url = new URL('./__sti_revision__/' + encodeURIComponent(chemin) + '?rev=' + encodeURIComponent(revision), origine);
    await cacheRevisions.put(url.href, new Response('révision enregistrée'));
  }
  const evenements = {};
  const contexte = {
    URL, Request, Response, Promise, Date, Math, Number, String, Boolean, Object, Array, RegExp,
    encodeURIComponent, decodeURIComponent, encodeURI, parseInt, isFinite, setTimeout, clearTimeout,
    crypto: webcrypto, caches: api,
    fetch: async url => { requetes.push(String(url)); return new Response('nouveau : ' + url); },
    self: {
      location: new URL('sw.js', origine),
      addEventListener(nom, fn) { evenements[nom] = fn; },
      skipWaiting() {},
      clients: { async claim() { if (options.messagePendantActivation) { annoncerClaim(); await claimAutorise; } }, async matchAll() { return []; } }
    }
  };
  vm.runInNewContext(sw, contexte, { filename: 'sw.js' });
  let travailInstallation;
  evenements.install({ waitUntil(p) { travailInstallation = p; } });
  await travailInstallation;
  let travailActivation;
  evenements.activate({ waitUntil(p) { travailActivation = p; } });
  let listesPendantClaim = 0;
  if (options.messagePendantActivation) {
    await claimCommence;
    const avantMessage = appelsListeCaches;
    let travailMessage;
    evenements.message({ data: { type: 'SYNC_UPDATE' }, waitUntil(p) { travailMessage = p; } });
    await new Promise(resolve => setImmediate(resolve));
    listesPendantClaim = appelsListeCaches - avantMessage;
    poursuivreClaim();
    await Promise.all([travailActivation, travailMessage]);
  } else {
    await travailActivation;
  }
  return { api, magasins, requetes, listesPendantClaim };
}

test('migration du cache main v340 : pas de retour à l’ancien accueil ni de perte des fichiers inchangés', async () => {
  const result = await simulerMigration('sti-atelier-v340', [
    ['./assets/js/sync-progressions.js', 'pastille-sync-v534'], ['./quiz/sql.html', 'xp-quiz-monotone-v478']
  ]);
  assert.equal(result.magasins.has('sti-atelier-v340'), false);
  const cache = await result.api.open('sti-atelier-v386');
  assert.match(await (await cache.match('https://sti.example/')).text(), /^nouveau :/);
  assert.match(await (await cache.match('https://sti.example/index.html')).text(), /^nouveau :/);
  assert.match(await (await cache.match('https://sti.example/cours/sql.html')).text(), /^nouveau :/);
  assert.match(await (await cache.match('https://sti.example/exercices/series-exercices.html')).text(), /^nouveau :/);
  assert.equal(await (await cache.match('https://sti.example/assets/js/sync-progressions.js', { ignoreSearch: true })).text(), 'sync existante');
  assert.equal(await cache.match('https://sti.example/quiz/sql.html'), undefined, 'le quiz est rechargé à la demande');
  for (const chemin of ['assets/js/lecteur-commun.js','assets/js/retour-quiz.js','assets/css/theme-patrimoine.css','assets/js/visionneuse-exercices.js']) {
    assert.match(await (await cache.match('https://sti.example/' + chemin)).text(), /^nouveau :/, chemin);
  }
  assert.equal(await (await cache.match('https://sti.example/assets/js/sqljs/sql-wasm.wasm')).text(), 'sqlite existant');
  const videos = await result.api.open('sti-videos-labo-v1');
  assert.equal(await (await videos.match('https://sti.example/assets/videos/exemple.mp4')).text(), 'vidéo locale');
  assert.ok(result.requetes.every(url => !/\.(mp4|mp3|pdf|wasm)(?:$|\?)/i.test(url)), 'aucun téléchargement de média lourd');
});

test('migration du cache v341 : les ressources modifiées sont invalidées et les données restent en cache', async () => {
  const result = await simulerMigration('sti-atelier-v341', [
    ['./assets/js/sync-progressions.js', 'pastille-sync-v534'], ['./quiz/sql.html', 'xp-quiz-monotone-v478']
  ]);
  assert.equal(result.magasins.has('sti-atelier-v341'), false);
  const cache = await result.api.open('sti-atelier-v386');
  assert.match(await (await cache.match('https://sti.example/index.html')).text(), /^nouveau :/);
  assert.match(await (await cache.match('https://sti.example/cours/sql.html')).text(), /^nouveau :/);
  assert.match(await (await cache.match('https://sti.example/exercices/series-exercices.html')).text(), /^nouveau :/);
  assert.equal(await (await cache.match('https://sti.example/assets/js/sync-progressions.js', { ignoreSearch: true })).text(), 'sync existante');
  assert.equal(await (await cache.match('https://sti.example/assets/js/sqljs/sql-wasm.wasm')).text(), 'sqlite existant');
  assert.ok(result.requetes.every(url => !/\.(mp4|mp3|pdf|wasm)(?:$|\?)/i.test(url)));
});

test('migration du cache v342 : accueil, cours et séries actualisés, médias conservés', async () => {
  const result = await simulerMigration('sti-atelier-v342', [
    ['./index.html', 'fidelite-origine-v481'], ['./assets/js/app.js', 'fidelite-origine-v481'],
    ['./assets/js/profil.js', 'fidelite-origine-v481'], ['./assets/css/theme.css', 'fidelite-origine-v481'],
    ['./cours/sql.html', 'fidelite-origine-v481'], ['./exercices/series-exercices.html', 'fidelite-origine-v481'],
    ['./assets/js/sync-progressions.js', 'pastille-sync-v534']
  ]);
  assert.equal(result.magasins.has('sti-atelier-v342'), false);
  const cache = await result.api.open('sti-atelier-v386');
  for (const chemin of ['index.html', 'assets/js/app.js', 'assets/js/profil.js', 'assets/css/theme.css']) {
    assert.match(await (await cache.match('https://sti.example/' + chemin)).text(), /^nouveau :/, chemin);
  }
  assert.match(await (await cache.match('https://sti.example/cours/sql.html')).text(), /^nouveau :/);
  assert.match(await (await cache.match('https://sti.example/exercices/series-exercices.html')).text(), /^nouveau :/);
  assert.equal(await (await cache.match('https://sti.example/assets/js/sqljs/sql-wasm.wasm')).text(), 'sqlite existant');
  assert.ok(result.requetes.every(url => !/\.(mp4|mp3|pdf|wasm)(?:$|\?)/i.test(url)));
});

test('migration v343 : reprise, badge et profil mis à jour, médias conservés', async () => {
  const result = await simulerMigration('sti-atelier-v343', [
    ['./index.html', 'accueil-personnalise-v482'], ['./assets/js/app.js', 'accueil-personnalise-v482'],
    ['./assets/css/theme.css', 'accueil-personnalise-v482'], ['./assets/js/profil.js', 'accueil-personnalise-v482'],
    ['./assets/js/roue-initiales.js', 'perf-quiz-php-v474'], ['./assets/js/sync-progressions.js', 'pastille-sync-v534']
  ]);
  assert.equal(result.magasins.has('sti-atelier-v343'), false);
  const cache = await result.api.open('sti-atelier-v386');
  for (const chemin of ['index.html', 'assets/js/app.js', 'assets/css/theme.css', 'assets/js/roue-initiales.js', 'assets/css/badge-compte.css', 'assets/images/badge-compte-vierge.png', 'assets/images/qr-code-site.png', 'assets/icons/sti-icon-192.png']) {
    assert.match(await (await cache.match('https://sti.example/' + chemin)).text(), /^nouveau :/, chemin);
  }
  assert.match(await (await cache.match('https://sti.example/assets/js/profil.js')).text(), /^nouveau :/);
  assert.equal(await (await cache.match('https://sti.example/assets/js/sqljs/sql-wasm.wasm')).text(), 'sqlite existant');
  assert.ok(result.requetes.every(url => !/\.(mp4|mp3|pdf|wasm)(?:$|\?)/i.test(url)));
});

test('migration v343 : les images et modules déjà présents ne sont pas retéléchargés', async () => {
  const dependances = [
    '/assets/icons/sti-icon-192.png', '/assets/images/qr-code-site.png',
    '/assets/js/roue-habillage.js', '/assets/js/roue-couverture.js'
  ].map(chemin => {
    const contenu = readFileSync(resolve(racine, chemin.slice(1)));
    return [chemin, contenu.length, contenu];
  });
  const result = await simulerMigration('sti-atelier-v343', [], dependances);
  const cache = await result.api.open('sti-atelier-v386');
  for (const [chemin, , contenu] of dependances) {
    assert.deepEqual(Buffer.from(await (await cache.match('https://sti.example' + chemin)).arrayBuffer()), contenu, chemin);
    assert.equal(result.requetes.some(url => url.endsWith(chemin)), false, chemin + ' ne doit pas être retéléchargé');
  }
});

test('migration v344 : la barre mobile est actualisée même si son ancienne taille est connue', async () => {
  const chemin = '/assets/js/mobile-nav.js';
  const result = await simulerMigration('sti-atelier-v344', [
    ['./assets/js/mobile-nav.js', 'badge-dependances-v483']
  ], [[chemin, 28292]]);
  assert.equal(result.magasins.has('sti-atelier-v344'), false);
  const cache = await result.api.open('sti-atelier-v386');
  assert.match(await (await cache.match('https://sti.example' + chemin)).text(), /^nouveau :/);
  assert.equal(result.requetes.filter(url => url.endsWith(chemin)).length, 1);
  assert.equal(await (await cache.match('https://sti.example/assets/js/sqljs/sql-wasm.wasm')).text(), 'sqlite existant');
  assert.ok(result.requetes.every(url => !/\.(mp4|mp3|pdf|wasm)(?:$|\?)/i.test(url)));
});

test('migration v345 : les ressources de cours et quiz changées ne restent pas périmées', async () => {
  const result = await simulerMigration('sti-atelier-v345', [
    ['./assets/js/profil.js', 'accueil-personnalise-v482'], ['./quiz/sql.html', 'fidelite-origine-v481'],
    ['./cours/sql.html', 'fidelite-origine-v481'], ['./assets/js/sync-progressions.js', 'pastille-sync-v534']
  ]);
  assert.equal(result.magasins.has('sti-atelier-v345'), false);
  const cache = await result.api.open('sti-atelier-v386');
  assert.match(await (await cache.match('https://sti.example/assets/js/profil.js')).text(), /^nouveau :/);
  assert.match(await (await cache.match('https://sti.example/cours/sql.html')).text(), /^nouveau :/);
  assert.equal(await cache.match('https://sti.example/quiz/sql.html'), undefined);
  assert.equal(await (await cache.match('https://sti.example/assets/js/sync-progressions.js', { ignoreSearch: true })).text(), 'sync existante');
  assert.equal(await (await cache.match('https://sti.example/assets/js/sqljs/sql-wasm.wasm')).text(), 'sqlite existant');
});

test('migration v346 : les corrections XP remplacent les anciennes ressources sans invalider la vidéo JS', async () => {
  const sousTitres = '/assets/subtitles/validation-nom-prenom-js-fr.vtt';
  const result = await simulerMigration('sti-atelier-v346', [
    ['./index.html', 'video-js-validation-v485'], ['./assets/js/app.js', 'video-js-validation-v485'],
    ['./exercices/series-exercices.html', 'video-js-validation-v485'],
    ['./assets/subtitles/validation-nom-prenom-js-fr.vtt', 'video-js-validation-v485'],
    ['./assets/js/profil.js', 'accueil-personnalise-v482'], ['./quiz/sql.html', 'fidelite-origine-v481'],
    ['./cours/sql.html', 'fidelite-origine-v481'], ['./assets/js/sync-progressions.js', 'pastille-sync-v534']
  ], [[sousTitres, 1024]]);
  assert.equal(result.magasins.has('sti-atelier-v346'), false);
  const cache = await result.api.open('sti-atelier-v386');
  assert.match(await (await cache.match('https://sti.example/assets/js/profil.js')).text(), /^nouveau :/);
  assert.match(await (await cache.match('https://sti.example/cours/sql.html')).text(), /^nouveau :/);
  assert.equal(await cache.match('https://sti.example/quiz/sql.html'), undefined);
  assert.match(await (await cache.match('https://sti.example/exercices/series-exercices.html')).text(), /^nouveau :/);
  assert.equal(await (await cache.match('https://sti.example' + sousTitres)).text(), 'fichier conservé');
  assert.equal(result.requetes.some(url => url.endsWith(sousTitres)), false);
  assert.equal(await (await cache.match('https://sti.example/assets/js/sync-progressions.js', { ignoreSearch: true })).text(), 'sync existante');
  assert.equal(await (await cache.match('https://sti.example/assets/js/sqljs/sql-wasm.wasm')).text(), 'sqlite existant');
  assert.ok(result.requetes.every(url => !/\.(mp4|mp3|pdf|wasm)(?:$|\?)/i.test(url)));
});

test('migration v347 : le journal XP remplace les anciens scripts et quiz sans télécharger les médias', async () => {
  const result = await simulerMigration('sti-atelier-v347', [
    ['./assets/js/profil.js', 'cours-retour-xp-v486'], ['./assets/js/quiz-sync.js', 'cours-retour-xp-v486'],
    ['./quiz/sql.html', 'cours-retour-xp-v486'], ['./assets/js/sync-progressions.js', 'retour-quiz-v476']
  ], [['/assets/js/quiz-sync.js', 1000]]);
  assert.equal(result.magasins.has('sti-atelier-v347'), false);
  const cache = await result.api.open('sti-atelier-v386');
  assert.match(await (await cache.match('https://sti.example/assets/js/profil.js')).text(), /^nouveau :/);
  assert.equal(await cache.match('https://sti.example/assets/js/quiz-sync.js'), undefined, 'le module sera rechargé à la demande');
  assert.equal(await cache.match('https://sti.example/quiz/sql.html'), undefined);
  assert.equal(await (await cache.match('https://sti.example/assets/js/sqljs/sql-wasm.wasm')).text(), 'sqlite existant');
  assert.ok(result.requetes.every(url => !/\.(mp4|mp3|pdf|wasm)(?:$|\?)/i.test(url)));
});

test('migration v348 : fond unique et badge actualisés, protocole XP et médias conservés', async () => {
  const result = await simulerMigration('sti-atelier-v348', [
    ['./assets/js/roue-initiales.js', 'badge-reprise-v483'],
    ['./assets/css/badge-compte.css', 'cours-retour-xp-v486'],
    ['./assets/js/profil.js', 'xp-operations-v487'],
    ['./assets/js/quiz-sync.js', 'xp-operations-v487']
  ], [['/assets/js/roue-initiales.js', 1000], ['/assets/css/badge-compte.css', 1000], ['/assets/js/quiz-sync.js', 1000]]);
  assert.equal(result.magasins.has('sti-atelier-v348'), false);
  const cache = await result.api.open('sti-atelier-v386');
  for (const chemin of ['assets/js/roue-initiales.js', 'assets/css/badge-compte.css', 'assets/images/badge-compte-vierge.png']) {
    assert.match(await (await cache.match('https://sti.example/' + chemin)).text(), /^nouveau :/, chemin);
  }
  assert.equal(await cache.match('https://sti.example/assets/js/quiz-sync.js'), undefined, 'le module XP modifié sera rechargé à la demande');
  assert.equal(await (await cache.match('https://sti.example/assets/js/sqljs/sql-wasm.wasm')).text(), 'sqlite existant');
  assert.ok(result.requetes.every(url => !/\.(mp4|mp3|pdf|wasm)(?:$|\?)/i.test(url)));
});

test('une mise à jour reçue pendant l’activation attend la migration des caches', async () => {
  const result = await simulerMigration('sti-atelier-v343', [], [], { messagePendantActivation: true });
  assert.equal(result.listesPendantClaim, 0, 'le delta ne rouvre pas les anciens caches pendant la copie');
  assert.equal(result.magasins.has('sti-atelier-v343'), false);
  const cache = await result.api.open('sti-atelier-v386');
  assert.equal(await (await cache.match('https://sti.example/assets/js/sqljs/sql-wasm.wasm')).text(), 'sqlite existant');
});

test('migration du cache de la branche v339 : anciennes versions XP et médias invalidées', async () => {
  const result = await simulerMigration('sti-atelier-v339', [
    ['./assets/js/sync-progressions.js', 'retour-quiz-v476'], ['./quiz/sql.html', 'retour-quiz-v476']
  ]);
  const cache = await result.api.open('sti-atelier-v386');
  assert.equal(await cache.match('https://sti.example/assets/js/sync-progressions.js', { ignoreSearch: true }), undefined);
  assert.equal(await cache.match('https://sti.example/quiz/sql.html'), undefined);
  assert.equal(await (await cache.match('https://sti.example/assets/js/sqljs/sql-wasm.wasm')).text(), 'sqlite existant');
});

test('migration v350 : seuls les modules XP et PWA modifiés sont révisés, médias conservés', async () => {
  const result = await simulerMigration('sti-atelier-v350', [
    ['./index.html', 'video-js-validation-v485'], ['./assets/js/app.js', 'video-js-validation-v485'],
    ['./assets/js/profil.js', 'xp-operations-v487'], ['./assets/js/quiz-sync.js', 'xp-operations-v487'],
    ['./assets/js/mobile-nav.js', 'reconnexion-delta-v489'], ['./quiz/sql.html', 'xp-operations-v487']
  ], [['/assets/js/quiz-sync.js', 1000], ['/assets/js/mobile-nav.js', 1000]]);
  assert.equal(result.magasins.has('sti-atelier-v350'), false);
  const cache = await result.api.open('sti-atelier-v386');
  assert.match(await (await cache.match('https://sti.example/assets/js/profil.js')).text(), /^nouveau :/);
  assert.match(await (await cache.match('https://sti.example/assets/js/mobile-nav.js')).text(), /^nouveau :/);
  assert.equal(await cache.match('https://sti.example/assets/js/quiz-sync.js'), undefined);
  assert.equal(await cache.match('https://sti.example/quiz/sql.html'), undefined);
  assert.equal(await (await cache.match('https://sti.example/assets/js/sqljs/sql-wasm.wasm')).text(), 'sqlite existant');
  assert.ok(result.requetes.every(url => !/\.(mp4|mp3|pdf|wasm)(?:$|\?)/i.test(url)));
});

test('migration v351 → v354 : pages appelantes actualisées, ressources inchangées et médias conservés', async () => {
  const result = await simulerMigration('sti-atelier-v351', [
    ['./index.html', 'xp-pwa-v490'], ['./assets/js/app.js', 'video-js-validation-v485'],
    ['./assets/js/profil.js', 'xp-pwa-v490'], ['./assets/js/quiz-sync.js', 'xp-jamais-en-recul-v520'],
    ['./cours/html5.html', 'cours-retour-xp-v486'], ['./exercices/series-exercices.html', 'video-js-validation-v485']
  ], [
    ['/cours/html5.html', 20, 'ancien cours html5'],
    ['/assets/js/quiz-sync.js', 22, 'sync xp v490 conservée']
  ]);
  const cache = await result.api.open('sti-atelier-v386');
  for (const chemin of ['/index.html', '/cours/html5.html', '/exercices/series-exercices.html', '/assets/js/app.js', '/assets/js/profil.js']) {
    assert.match(await (await cache.match('https://sti.example' + chemin)).text(), /^nouveau :/, chemin);
    assert.ok(result.requetes.some(url => new URL(url, 'https://sti.example/').pathname === chemin), chemin + ' téléchargé');
  }
  assert.equal(await (await cache.match('https://sti.example/assets/js/quiz-sync.js')).text(), 'sync xp v490 conservée');
  const videos = await result.api.open('sti-videos-labo-v1');
  assert.equal(await (await videos.match('https://sti.example/assets/videos/exemple.mp4')).text(), 'vidéo locale');
  assert.ok(!result.requetes.some(url => new URL(url, 'https://sti.example/').pathname === '/assets/js/quiz-sync.js'));
  assert.ok(result.requetes.every(url => !/\.(mp4|mp3|pdf|wasm)(?:$|\?)/i.test(url)));
});

test('reconnexion : les clés exclues et les clés quiz restent identiques au synchroniseur protégé', () => {
  const historique = lire('assets/js/sync-progressions.js'), pont = lire('assets/js/reconnexion-profil.js');
  const extraire = (texte, expression) => {
    const bloc = texte.match(expression);
    assert.ok(bloc, 'liste de synchronisation présente');
    return [...bloc[1].matchAll(/"([^"]+)"/g)].map(m => m[1]);
  };
  const exclues = extraire(historique, /var EXCLUES = \[([\s\S]*?)\];/).concat(['sti-sync-maj', 'sti-sync-uid']);
  const clesQuiz = extraire(historique, /var CLES_QUIZ_CLOUD = \[([\s\S]*?)\];/);
  const lirePont = nom => {
    const m = pont.match(new RegExp('var ' + nom + " = '([^']+)'\\.split\\(' '\\)"));
    assert.ok(m, nom + ' déclaré dans le pont');
    return m[1].split(' ');
  };
  assert.deepEqual(new Set(lirePont('exclues')), new Set(exclues));
  assert.deepEqual(new Set(lirePont('quiz')), new Set(clesQuiz));
  for (const chemin of ['assets/js/appel-quiz.js', 'assets/js/suivi-profil.js', 'assets/js/reconnexion-profil.js']) {
    assert.doesNotMatch(lire(chemin), /\b(?:localStorage|sessionStorage)\b/, chemin + ' utilise STIProfil');
  }
});

test('navigation mobile : le module commun est chargé une fois par cours et reste disponible hors ligne', () => {
  const chemin = 'assets/js/cours-onglets-mobile.js';
  for (const matiere of ['html5', 'css3', 'javascript', 'sql', 'php']) {
    const html = lire(`cours/${matiere}.html`);
    assert.equal((html.match(/cours-onglets-mobile\.js/g) || []).length, 1, matiere);
  }
  assert.doesNotMatch(lire(chemin), /\b(?:localStorage|sessionStorage)\b/);
  for (const bloc of ['SHELL', 'OFFLINE_LIST']) {
    assert.ok(sw.split('var ' + bloc + ' = [')[1].split('];')[0].includes('"./' + chemin + '"'), bloc);
  }
  assert.ok(manifeste.files.some(f => f.path === chemin));
});

test('migration v353 : onglets et feuille de cours disponibles sans retélécharger le contrôleur inchangé', async () => {
  const pages = ['html5', 'css3', 'javascript', 'sql', 'php'].map(c => '/cours/' + c + '.html');
  const css = '/assets/css/cours.css', controleur = '/assets/js/cours-javascript.js', module = '/assets/js/cours-onglets-mobile.js';
  const anciens = [...pages, css, controleur].map(chemin => [chemin, 20, 'ancienne version']);
  const marqueurs = pages.map(chemin => ['.' + chemin, 'progression-chapitres-v492']);
  marqueurs.push(['.' + css, 'cours-retour-xp-v486'], ['.' + controleur, 'progression-chapitres-v492']);
  /* v500 : le contrôleur HTML5 a changé ; on vérifie l'absence de retéléchargement sur un
     contrôleur réellement inchangé (JavaScript). */
  const result = await simulerMigration('sti-atelier-v353', marqueurs, anciens);
  assert.equal(result.magasins.has('sti-atelier-v353'), false);
  const cache = await result.api.open('sti-atelier-v386');
  for (const chemin of [...pages, css, module]) {
    assert.match(await (await cache.match('https://sti.example' + chemin)).text(), /^nouveau :/, chemin);
    assert.ok(result.requetes.some(url => new URL(url, 'https://sti.example/').pathname === chemin), chemin);
  }
  assert.equal(await (await cache.match('https://sti.example' + controleur)).text(), 'ancienne version');
  assert.ok(!result.requetes.some(url => new URL(url, 'https://sti.example/').pathname === controleur));
  assert.ok(result.requetes.every(url => !/\.(mp4|mp3|pdf|wasm)(?:$|\?)/i.test(url)));
});

test('migration v352 : pages et scripts des cinq cours actualisés sans perdre les médias', async () => {
  const pages = ['html5', 'css3', 'javascript', 'sql', 'php'].map(c => '/cours/' + c + '.html');
  const scripts = ['html5', 'css3', 'javascript', 'matieres'].map(c => '/assets/js/cours-' + c + '.js');
  const anciens = pages.concat(scripts).map(chemin => [chemin, 20, 'ancienne version']);
  const marqueurs = pages.concat(scripts).map(chemin => ['.' + chemin, 'suivi-contextes-v491']);
  const result = await simulerMigration('sti-atelier-v352', marqueurs, anciens);
  assert.equal(result.magasins.has('sti-atelier-v352'), false);
  const cache = await result.api.open('sti-atelier-v386');
  for (const chemin of pages.concat(scripts)) {
    assert.match(await (await cache.match('https://sti.example' + chemin)).text(), /^nouveau :/, chemin);
    assert.ok(result.requetes.some(url => new URL(url, 'https://sti.example/').pathname === chemin), chemin);
  }
  const videos = await result.api.open('sti-videos-labo-v1');
  assert.equal(await (await videos.match('https://sti.example/assets/videos/exemple.mp4')).text(), 'vidéo locale');
  assert.ok(result.requetes.every(url => !/\.(mp4|mp3|pdf|wasm)(?:$|\?)/i.test(url)));
});
