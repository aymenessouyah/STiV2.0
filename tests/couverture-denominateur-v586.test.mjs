/*
  v586 — un seul dénominateur de couverture : le nombre de pages du site (145).

  Trois paires de fichiers ne diffèrent que par la casse (`cours/PHP-recap.html` /
  `cours/php-recap.html`, `Sondage.html` / `sondage.html`, `Statistiques.html` /
  `statistiques.html`). L'anneau ⚙️ dédoublonnait la liste en minuscules AVANT de
  fixer son total : il annonçait donc « /142 », alors que le tableau de bord, les
  fiches élèves, le bulletin et l'export CSV annoncent « /145 ».

  Correctif : le total reste la longueur du manifeste (145) ; seuls les chemins
  distincts servent au comptage des visites (une page à deux casses = une visite).
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

const root = resolve(new URL('..', import.meta.url).pathname);
const read = (p) => readFileSync(resolve(root, p), 'utf8');
const manifeste = JSON.parse(read('assets/pages-couverture.json'));

function chargerRoue(visites) {
  const titre = { valeur: '' };
  const anneau = {
    style: {
      _p: {},
      setProperty(k, v) { this._p[k] = v; },
      getPropertyValue(k) { return this._p[k] || ''; }
    },
    setAttribute(k, v) { if (k === 'title') titre.valeur = String(v); },
    getAttribute() { return null; }
  };
  const memoire = visites ? { 'sti-pages-vues-v432': JSON.stringify(visites) } : {};
  const stockage = {
    getItem: (k) => (k in memoire ? memoire[k] : null),
    setItem: (k, v) => { memoire[k] = String(v); },
    removeItem: (k) => { delete memoire[k]; }
  };
  const contexte = vm.createContext({
    console,
    JSON, Math, Object, String, Number, Array, Promise, Date,
    setTimeout, clearTimeout,
    setInterval: () => 0,
    location: { protocol: 'https:', origin: 'https://sti.example', pathname: '/index.html', host: 'sti.example' },
    document: {
      getElementById: (id) => (id === 'sti-roue-anneau' ? anneau : null),
      addEventListener() {},
      readyState: 'complete'
    },
    localStorage: stockage,
    sessionStorage: stockage,
    MutationObserver: function () { this.observe = function () {}; },
    fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve(manifeste) }),
    addEventListener() {}
  });
  contexte.window = contexte;
  vm.runInContext(read('assets/js/roue-couverture.js'), contexte, { filename: 'roue-couverture.js' });
  return { contexte, titre, stockage };
}

test('v586 : le manifeste contient 150 pages mais 147 chemins distincts en minuscules', () => {
  /* v596 : 145 + les cinq ateliers d'exercices « Systèmes » (v595). */
  assert.equal(manifeste.n, 150);
  assert.equal(manifeste.pages.length, 150);
  const distincts = new Set(manifeste.pages.map((p) => p.toLowerCase()));
  assert.equal(distincts.size, 147, 'trois paires ne diffèrent que par la casse');
  /* C'est bien ce qui créait l'écart 142 ↔ 145 : le test n'a de sens que si les deux
     nombres diffèrent. */
  assert.notEqual(distincts.size, manifeste.pages.length);
});

test('v586 : le repli embarqué annonce le total du site, pas celui des chemins distincts', () => {
  const { contexte, titre } = chargerRoue();
  assert.equal(contexte.__STI_COUV_TOTAL, 150, 'le total doit être la longueur de la liste');
  assert.match(titre.valeur, /sur 150 ·/, 'l’infobulle de l’anneau annonce le même total que le tableau de bord');
  assert.match(titre.valeur, /Couverture du site/);
});

test('v586 : une paire de fichiers en double casse ne compte qu’une page vue', () => {
  const { titre } = chargerRoue({
    'cours/php-recap.html': 1,
    'cours/PHP-recap.html': 1
  });
  /* Deux fichiers vus, un seul chemin distinct : 1 page vue sur 145 (et non 1 sur 142). */
  assert.match(titre.valeur, /1 page vue sur 150 ·/);
});

test('v586 : cinq pages vues restent cinq pages vues', () => {
  const { titre } = chargerRoue({
    'index.html': 1,
    'portail.html': 1,
    'cours/html5.html': 1,
    'exercices/html-css/box-shadow-text-shadow-css3.html': 1,
    'projets/sti0/sondage.html': 1
  });
  assert.match(titre.valeur, /5 pages vues sur 150 ·/);
});

test('v586 : le code source garde la bonne règle aux deux endroits', () => {
  const js = read('assets/js/roue-couverture.js');
  /* 1) repli embarqué : TOTAL figé AVANT le dédoublonnage */
  const iTotal = js.indexOf('var TOTAL = PAGES.length;');
  const iDedup = js.indexOf('for (var i0 = 0; i0 < PAGES.length; i0++)');
  assert.ok(iTotal > 0 && iDedup > 0 && iTotal < iDedup, 'le total doit être lu avant le dédoublonnage');
  /* 2) manifeste chargé : total = pages déclarées */
  assert.match(js, /PAGES = out; MAP = set; TOTAL = j\.pages\.length;/);
  /* 3) le comptage parcourt les chemins distincts, jamais TOTAL (plus grand) */
  assert.match(js, /for \(var i = 0; i < PAGES\.length; i\+\+\) if \(l\[PAGES\[i\]\]\) n\+\+;/);
  assert.equal(/for \(var i = 0; i < TOTAL; i\+\+\)/.test(js), false, 'boucler sur TOTAL sortirait du tableau PAGES');
  /* 4) le total est exposé pour les diagnostics */
  assert.match(js, /window\.__STI_COUV_TOTAL = TOTAL;/);
});

test('v586 : le tableau de bord et l’analytique utilisent le même nombre', () => {
  const adminJs = read('assets/js/admin.js');
  const anaJs = read('assets/js/analytique.js');
  const repliAdmin = Number((adminJs.match(/var TOTAL_PAGES_SITE_ADMIN = (\d+);/) || [])[1]);
  const repliAna = Number((anaJs.match(/var TOTAL_PAGES_SITE = (\d+);/) || [])[1]);
  assert.equal(repliAdmin, manifeste.n);
  assert.equal(repliAna, manifeste.n);

  /* La section 🗺️ Couverture calcule son total depuis le manifeste (aucun 124/142 figé). */
  const cov = read('assets/js/admin-couverture.js');
  assert.match(cov, /var total = \(pages \|\| \[\]\)\.length \|\| 1;/);
  assert.equal(/pages vues \/ 124|\/142/.test(cov), false);
});
