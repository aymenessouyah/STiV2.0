import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

const racine = resolve(new URL('..', import.meta.url).pathname);
const lire = (p) => readFileSync(resolve(racine, p), 'utf8');
const PAGES_QUIZ = ['quiz/html-css.html', 'quiz/javascript.html', 'quiz/sql.html', 'quiz/php.html', 'quiz/tableaux.html'];

/* ---------- faux navigateur minimal ---------- */
function fauxNavigateur(options = {}) {
  const ecouteurs = {};
  const liens = [];
  const evenements = [];
  class CustomEvent {
    constructor(type, init) {
      this.type = type;
      this.detail = (init && init.detail) || null;
    }
  }
  class Noeud {
    constructor(nom) { this.nom = nom; this.textContent = ""; this.href = ""; this.rel = ""; this.type = ""; this.crossOrigin = ""; }
  }
  const stockage = {};
  const doc = {
    hidden: false,
    readyState: 'complete',
    head: { appendChild: (n) => liens.push(n) },
    documentElement: { appendChild: (n) => liens.push(n) },
    addEventListener: (type, fn) => { (ecouteurs['doc:' + type] = ecouteurs['doc:' + type] || []).push(fn); },
    dispatchEvent: (ev) => {
      evenements.push(ev.type);
      ((ecouteurs['doc:' + ev.type]) || []).forEach((fn) => fn(ev));
      return true;
    },
    createElement: (tag) => new Noeud(tag)
  };
  const w = {
    document: doc,
    CustomEvent,
    addEventListener: (type, fn) => { (ecouteurs['win:' + type] = ecouteurs['win:' + type] || []).push(fn); },
    dispatchEvent: (ev) => {
      evenements.push(ev.type);
      ((ecouteurs['win:' + ev.type]) || []).forEach((fn) => fn(ev));
      return true;
    },
    sessionStorage: {
      getItem: (k) => (k in stockage ? stockage[k] : null),
      setItem: (k, v) => { stockage[k] = String(v); }
    },
    crypto: options.sansCrypto ? null : {
      getRandomValues: (buf) => {
        for (let i = 0; i < buf.length; i += 1) buf[i] = options.fixe !== undefined ? options.fixe : Math.floor(Math.random() * 4294967296);
        return buf;
      }
    }
  };
  w.window = w;
  return { w, doc, liens, evenements, ecouteurs, stockage };
}

function chargerModule(options) {
  const env = fauxNavigateur(options);
  vm.createContext(env.w);
  new vm.Script(lire('assets/js/quiz-alea.js'), { filename: 'quiz-alea.js' }).runInContext(env.w);
  return { ...env, api: env.w.STIQuizAlea };
}

test('v519 : chaque page de quiz charge le tirage aléatoire et le demande à chaque partie', () => {
  for (const page of PAGES_QUIZ) {
    const html = lire(page);
    assert.match(html, /assets\/js\/quiz-alea\.js\?v=519/, page + ' charge le module');
    /* Le quiz « tableaux » appelle le tirage depuis quiz-tableaux.js, vérifié plus bas. */
    if (page !== 'quiz/tableaux.html') {
      assert.match(html, /STIQuizAlea\.nouveauTirage\("partie"\)/, page + ' demande un tirage neuf par partie');
      assert.ok(
        html.indexOf('quiz-alea.js') < html.indexOf('STIQuizAlea.nouveauTirage("partie")'),
        page + ' : le module précède son usage'
      );
    }
  }
  assert.match(lire('assets/js/quiz-tableaux.js'), /STIQuizAlea\.nouveauTirage\("partie"\)/);
});

test('v519 : au chargement, il y a déjà un tirage neuf (ouverture du quiz)', () => {
  const { api } = chargerModule();
  assert.equal(api.compteur(), 1, 'un tirage à l’ouverture');
  assert.equal(api.motif(), 'ouverture');
  assert.ok(api.sel() > 0, 'un sel aléatoire est tiré');
  assert.equal(api.nouveauTirage('partie'), 2);
  assert.equal(api.compteur(), 2);
  assert.notEqual(api.melanger([1, 2, 3]).length, 0);
});

test('v519 : reconnexion internet et retour depuis le cache relancent un tirage', () => {
  const { w, api } = chargerModule();
  const avant = api.compteur();
  w.dispatchEvent(new w.CustomEvent('online'));
  assert.equal(api.compteur(), avant + 1, 'reconnexion → tirage neuf');
  assert.equal(api.motif(), 'reconnexion');
  w.dispatchEvent(Object.assign(new w.CustomEvent('pageshow'), { persisted: true }));
  assert.equal(api.compteur(), avant + 2, 'retour bfcache → tirage neuf');
  assert.equal(api.motif(), 'retour-cache');
});

test('v519 : le mélange est une permutation, sans biais de modulo, et la bonne réponse suit', () => {
  const { api } = chargerModule();
  const base = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  for (let i = 0; i < 40; i += 1) {
    const melange = api.melanger(base);
    assert.deepEqual([...melange].sort((a, b) => a - b), base, 'toutes les valeurs restent présentes');
    assert.equal(melange.length, base.length);
  }
  /* Aucune permutation identique 40 fois de suite : le tirage bouge vraiment. */
  const signatures = new Set();
  for (let i = 0; i < 40; i += 1) signatures.add(api.melanger(base).join(','));
  assert.ok(signatures.size > 5, 'le mélange varie : ' + signatures.size + ' ordres distincts');

  /* Textes + index de la bonne réponse. */
  for (const bonne of [0, 1, 2, 3]) {
    const r = api.melangerReponses(['a', 'b', 'c', 'd'], bonne);
    const attendu = ['a', 'b', 'c', 'd'][bonne];
    assert.equal(r.options[r.index], attendu, 'la bonne réponse reste identifiable');
    assert.deepEqual([...r.options].sort(), ['a', 'b', 'c', 'd']);
  }
  /* Objets { text, ok }. */
  const objets = api.melangerReponses([{ text: 'x', ok: false }, { text: 'y', ok: true }, { text: 'z', ok: false }]);
  assert.equal(objets.options[objets.index].text, 'y');
  assert.ok(objets.options[objets.index].ok);
});

test('v519 : les abonnés sont prévenus et le repli sans crypto fonctionne', () => {
  const { api, evenements } = chargerModule();
  const vus = [];
  const retirer = api.surNouveauTirage((evt) => vus.push(evt.motif));
  api.nouveauTirage('partie');
  assert.deepEqual(vus, ['partie']);
  assert.ok(evenements.includes('sti:nouveau-tirage'), 'un événement public est émis');
  retirer();
  api.nouveauTirage('partie');
  assert.deepEqual(vus, ['partie'], 'le désabonnement fonctionne');

  const repli = chargerModule({ sansCrypto: true });
  const melange = repli.api.melanger([1, 2, 3, 4, 5]);
  assert.equal(melange.length, 5, 'sans crypto, Math.random prend le relais');
  assert.deepEqual([...melange].sort((a, b) => a - b), [1, 2, 3, 4, 5]);
});

test('v519 : le compteur de tirages survit à un rechargement du même onglet', () => {
  const env = fauxNavigateur();
  vm.createContext(env.w);
  new vm.Script(lire('assets/js/quiz-alea.js')).runInContext(env.w);
  const premier = env.w.STIQuizAlea.compteur();
  env.w.STIQuizAlea.nouveauTirage('partie');
  const jeton = env.stockage['sti-quiz-tirage-v519'];
  assert.ok(jeton, 'le tirage courant est mémorisé pour l’onglet');

  /* Nouveau chargement de la même page : le compteur repart de la mémoire d'onglet. */
  const env2 = fauxNavigateur();
  env2.stockage['sti-quiz-tirage-v519'] = jeton;
  vm.createContext(env2.w);
  new vm.Script(lire('assets/js/quiz-alea.js')).runInContext(env2.w);
  assert.equal(env2.w.STIQuizAlea.compteur(), premier + 2, 'un tirage de plus après réouverture');
});
