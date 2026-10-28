import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

/* v495 — « dans les pages quiz : éliminer les vidéos des cours ».
   Double verrou : aucune page de quiz ne porte ni ne charge de surface vidéo,
   et le lecteur pas à pas de protection.js refuse de s'installer sur /quiz/. */

const racine = resolve(new URL('..', import.meta.url).pathname);
const lire = chemin => readFileSync(resolve(racine, chemin), 'utf8');
const pagesQuiz = readdirSync(resolve(racine, 'quiz')).filter(f => f.endsWith('.html')).sort();

test('v495 : les six pages de quiz ne portent aucune vidéo de cours', () => {
  assert.deepEqual(pagesQuiz, ['html-css.html', 'javascript.html', 'php.html', 'pp.html', 'sql.html', 'tableaux.html']);
  for (const page of pagesQuiz) {
    const html = lire('quiz/' + page);
    const nom = 'quiz/' + page;
    // Aucun élément <video> réel : les seules occurrences éventuelles sont dans
    // des questions échappées (« controls sur <audio>/<video> »).
    assert.deepEqual(html.match(/<video\s+[^>]*>/gi) || [], [], `${nom} ne doit monter aucune balise <video>`);
    assert.deepEqual(html.match(/<source\s+[^>]*type=["']video\//gi) || [], [], `${nom} ne doit charger aucune piste vidéo`);
    // Aucun média de cours (mp4/webm/sous-titres) — le manifeste PWA est un lien, pas un média.
    const medias = [...html.matchAll(/["'(]([^"'()\s]+\.(?:mp4|webm|vtt|m3u8))(?![\w.])/gi)]
      .filter(m => !html.slice(Math.max(0, m.index - 60), m.index).includes('&lt;'))
      .map(m => m[1]);
    assert.deepEqual(medias, [], `${nom} ne doit référencer aucun fichier vidéo`);
    // Aucun script capable d'ouvrir le lecteur de cours.
    assert.doesNotMatch(html, /assets\/js\/(?:app|lecteur-commun)\.js/i, `${nom} ne charge pas le lecteur de vidéos de cours`);
    assert.doesNotMatch(html, /ouvrirVideoPasAPasSTI|featured-video|video-card|data-play-video|heroFeaturedVideo/i, `${nom} n'expose aucune entrée vers le lecteur de cours`);
  }
});

test('v495 : protection.js n’installe le lecteur de vidéos que hors des pages de quiz', () => {
  const src = lire('assets/js/protection.js');
  const debut = src.indexOf('  function installerVideosPasAPasSTI() {');
  assert.ok(debut >= 0, 'installerVideosPasAPasSTI doit exister');
  // Extraction de la fonction complète par équilibrage des accolades.
  let i = src.indexOf('{', debut), profondeur = 0, fin = -1;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') profondeur++;
    else if (src[j] === '}') { profondeur--; if (profondeur === 0) { fin = j + 1; break; } }
  }
  assert.ok(fin > i, 'la fonction installerVideosPasAPasSTI doit être complète');
  const corps = src.slice(debut, fin);
  assert.match(corps, /pathLower\.indexOf\("\/quiz\/"\) !== -1/, 'la garde /quiz/ doit couper avant tout montage');
  const garde = corps.indexOf('pathLower.indexOf("/quiz/")');
  const premierMontage = corps.indexOf('MP4_TEMP', garde + 1);
  assert.ok(garde > 0 && (premierMontage === -1 || premierMontage > garde), 'la garde /quiz/ précède le montage des vidéos');

  // Comportement : sur /quiz/sql.html la fonction sort avant toute création de média.
  const fonctions = corps.slice(corps.indexOf('{') + 1, corps.lastIndexOf('}'));
  const ctx = {
    location: { pathname: '/quiz/sql.html' },
    cree: [],
    window: {},
    document: {
      getElementById: () => null,
      querySelectorAll: () => [],
      body: { classList: { contains: () => false } },
      createElement: tag => { ctx.cree.push(String(tag).toLowerCase()); return { style: {}, setAttribute() {}, appendChild() {}, addEventListener() {} }; },
      addEventListener() {},
      querySelector: () => null
    },
    navigator: {}
  };
  ctx.window.document = ctx.document;
  ctx.window.speechSynthesis = { cancel() {}, speak() {} };
  ctx.speechSynthesis = ctx.window.speechSynthesis;
  ctx.self = ctx.window;
  const fabrique = new vm.Script(`(function installerVideosPasAPasSTI() {${fonctions}})`, { filename: 'protection-quiz.js' });
  ctx.installerVideosPasAPasSTI = fabrique.runInNewContext(ctx);
  ctx.installerVideosPasAPasSTI();
  assert.equal(ctx.cree.filter(t => t === 'video').length, 0, 'aucun <video> créé sur une page de quiz');
  assert.equal(typeof ctx.window.ouvrirVideoPasAPasSTI, 'undefined', 'le lecteur de cours n’est pas exposé sur une page de quiz');
});

test('v495 : sw.js invalide protection.js et le manifeste reste cohérent', () => {
  const sw = lire('sw.js');
  assert.match(sw, /var CACHE = "sti-atelier-v356"/);
  assert.match(sw, /url: "\.\/assets\/js\/protection\.js", revision: "quiz-sans-video-v495"/);
  const bloc = sw.split('var UPDATE_FILES = [')[1].split('];')[0];
  const urls = [...bloc.matchAll(/url:\s*"([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(urls).size, urls.length, 'aucune URL de mise à jour en double');
  const manifeste = JSON.parse(lire('offline-complete-manifest.json'));
  const entree = manifeste.files.find(f => f.path === 'assets/js/protection.js');
  assert.ok(entree, 'protection.js doit rester dans le cache complet');
  assert.equal(entree.bytes, Buffer.byteLength(lire('assets/js/protection.js')), 'taille du manifeste à jour');
});
