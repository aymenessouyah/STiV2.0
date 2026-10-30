/* v555 — plafond de 20 % de bonnes réponses en position A.
   ─────────────────────────────────────────────────────────────────────────
   La consigne est plus stricte qu'un simple mélange : sur une partie, la
   bonne réponse ne doit jamais être en A plus de 20 % du temps (un tirage
   uniforme en donne 25 %).

   Ce test éprouve le code réellement livré, pas une réimplémentation :
   les fonctions de assets/js/quiz-alea.js sont exécutées dans une machine
   virtuelle, puis rejouées avec les mélanges de chaque module.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (chemin) => readFileSync(join(root, chemin), 'utf8');

/** Charge assets/js/quiz-alea.js dans un faux navigateur et rend son API. */
function chargerAlea() {
  const stockage = new Map();
  const global = {
    crypto: webcrypto,
    Math,
    console,
    CustomEvent: class {
      constructor(type, init) {
        this.type = type;
        Object.assign(this, init || {});
      }
    },
    document: { addEventListener() {}, dispatchEvent() {}, readyState: 'complete' },
    sessionStorage: {
      getItem: (k) => (stockage.has(k) ? stockage.get(k) : null),
      setItem: (k, v) => stockage.set(k, String(v)),
      removeItem: (k) => stockage.delete(k)
    },
    addEventListener() {},
    setTimeout,
    clearTimeout
  };
  global.window = global;
  const contexte = vm.createContext(global);
  vm.runInContext(lire('assets/js/quiz-alea.js'), contexte);
  return contexte.STIQuizAlea;
}

const alea = chargerAlea();

/* Prélève les noms cités dans le source, pour vérifier le branchement. */
function contient(fichier, motif, message) {
  assert.match(lire(fichier), motif, message);
}

test('v555 : la primitive est exposée et reste sans effet hors navigateur', () => {
  assert.equal(typeof alea.planReponses, 'function');
  assert.equal(typeof alea.placerReponse, 'function');
  const plan = alea.planReponses([4, 4, 4, 4], { maxA: 0.2 });
  assert.equal(plan.length, 4);
  assert.ok(plan.every((p) => Number.isInteger(p) && p >= 0 && p < 4));
});

test('v555 : le plafond de 20 % en A n’est jamais dépassé, quelle que soit la longueur', () => {
  for (const n of [5, 6, 7, 10, 12, 15, 20, 40]) {
    const tailles = Array(n).fill(4);
    const budget = Math.floor(n * 0.2 + 1e-9);
    for (let essai = 0; essai < 400; essai += 1) {
      const plan = alea.planReponses(tailles, { maxA: 0.2 });
      const enA = plan.filter((p) => p === 0).length;
      assert.ok(enA <= budget, `n=${n} : ${enA} bonnes réponses en A pour un budget de ${budget}`);
    }
  }
});

test('v555 : A est plafonné à 20 % et B/C/D se partagent le reste à parts égales', () => {
  const tailles = Array(10).fill(4);
  const positions = [0, 0, 0, 0];
  for (let essai = 0; essai < 2000; essai += 1) {
    alea.planReponses(tailles, { maxA: 0.2 }).forEach((p) => { positions[p] += 1; });
  }
  const total = positions.reduce((a, b) => a + b, 0);
  const parts = positions.map((p) => (100 * p) / total);
  assert.ok(parts[0] <= 20.5, `A mesuré à ${parts[0].toFixed(1)} %`);
  assert.ok(Math.abs(parts[1] - parts[2]) < 1.5, `B ${parts[1].toFixed(1)} % vs C ${parts[2].toFixed(1)} %`);
  assert.ok(Math.abs(parts[2] - parts[3]) < 1.5, `C ${parts[2].toFixed(1)} % vs D ${parts[3].toFixed(1)} %`);
});

test('v555 : aucune suite de trois positions identiques, A compris', () => {
  for (let essai = 0; essai < 1000; essai += 1) {
    const plan = alea.planReponses(Array(20).fill(4), { maxA: 0.2 });
    for (let i = 2; i < plan.length; i += 1) {
      assert.ok(!(plan[i] === plan[i - 1] && plan[i] === plan[i - 2]),
        `triple position ${plan[i]} aux indices ${i - 2}-${i}`);
    }
  }
});

test('v555 : placerReponse déplace la bonne réponse sans perdre de proposition', () => {
  for (let essai = 0; essai < 500; essai += 1) {
    const options = ['a', 'b', 'c', 'd'];
    const correct = essai % 4;
    const cible = (essai * 3) % 4;
    const r = alea.placerReponse(options, correct, cible);
    assert.equal(r.index, cible);
    assert.equal(r.options[cible], options[correct], 'la bonne réponse est bien à la cible');
    assert.equal(new Set(r.options).size, 4, 'aucune proposition perdue ni dupliquée');
    assert.equal(options[correct], ['a', 'b', 'c', 'd'][correct], 'le tableau source n’est pas modifié');
  }
  /* Forme { text, ok } utilisée par html-css */
  const objets = [{ text: 'x', ok: false }, { text: 'y', ok: true }, { text: 'z', ok: false }, { text: 'w', ok: false }];
  const r = alea.placerReponse(objets, 1, 2);
  assert.equal(r.options[2].text, 'y');
  assert.equal(r.options.filter((o) => o.ok).length, 1);
});

test('v555 : les cinq modules appliquent le plan (branchement livré)', () => {
  contient('quiz/html-css.html', /appliquerPlanReponsesHc\(preparerSessionDepuisListeHc\(tirees\)\)/,
    'html-css applique le plan sur la partie neuve');
  contient('quiz/javascript.html', /this\.appliquerPlanReponsesJs\(tirage\)/,
    'javascript applique le plan');
  contient('quiz/sql.html', /appliquerPlanReponsesSql\(tirage\)/, 'sql applique le plan');
  contient('quiz/php.html', /appliquerPlanReponsesPhp\(copies\)/, 'php applique le plan');
  contient('assets/js/quiz-tableaux.js', /appliquerPlanReponsesTab\(tirees\)/, 'tableaux applique le plan');
  for (const page of ['quiz/html-css.html', 'quiz/javascript.html', 'quiz/sql.html', 'quiz/php.html', 'quiz/tableaux.html']) {
    contient(page, /quiz-alea\.js\?v=555/, `${page} charge la version 555 du module`);
  }
  assert.match(lire('sw.js'), /url: "\.\/assets\/js\/quiz-alea\.js", revision: "plafond-a-v555"/);
});

/* ── Mesure de bout en bout sur les moteurs purs (SQL et Tableaux) ──────── */

function extraire(src, nom) {
  const re = new RegExp(`function\\s+${nom}\\s*\\(|const\\s+${nom}\\s*=\\s*\\(`);
  const m = re.exec(src);
  if (!m) return null;
  let depth = 0;
  let ouvert = false;
  for (let j = m.index; j < src.length; j += 1) {
    const c = src[j];
    if (c === '{') { depth += 1; ouvert = true; }
    else if (c === '}') { depth -= 1; if (ouvert && depth === 0) return src.slice(m.index, j + 1); }
  }
  return null;
}

function extraireTableau(src, declaration) {
  const i = src.indexOf(declaration);
  if (i < 0) return null;
  let depth = 0;
  for (let j = i + declaration.length; j < src.length; j += 1) {
    const c = src[j];
    if (c === '{' || c === '[') depth += 1;
    else if (c === '}' || c === ']') { depth -= 1; if (depth === 0) return src.slice(i + declaration.length, j + 1); }
    else if (c === '"' || c === "'" || c === '`') { const q = c; j += 1; while (j < src.length && src[j] !== q) { if (src[j] === '\\') j += 1; j += 1; } }
  }
  return null;
}

function fauxNavigateur() {
  const global = { crypto: webcrypto, Math, console, JSON, Number, String, Boolean, isFinite, parseInt,
    document: { addEventListener() {}, dispatchEvent() {}, readyState: 'complete' },
    sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    CustomEvent: class { constructor(t, o) { this.type = t; Object.assign(this, o || {}); } },
    addEventListener() {}, setTimeout, clearTimeout };
  global.window = global;
  return vm.createContext(global);
}

test('v555 : SQL — le plan réel réduit A à 20 % sur des parties complètes', () => {
  const ctx = fauxNavigateur();
  vm.runInContext(lire('assets/js/quiz-alea.js'), ctx);
  const src = lire('quiz/sql.html');
  vm.runInContext([
    extraire(src, 'entierAleatoireSql'),
    extraire(src, 'preparerQuestionsSql'),
    extraire(src, 'appliquerPlanReponsesSql')
  ].join('\n'), ctx);
  const banque = vm.runInContext('(' + extraireTableau(src, 'const QUESTIONS = ') + ')', ctx);
  const positions = [0, 0, 0, 0];
  let total = 0;
  for (let partie = 0; partie < 200; partie += 1) {
    const tirage = [];
    for (let i = 0; i < 10; i += 1) tirage.push(banque[(partie * 10 + i) % banque.length]);
    const questions = ctx.preparerQuestionsSql(tirage);
    const enA = questions.filter((q) => q.correct === 0).length;
    assert.ok(enA <= 2, `partie ${partie} : ${enA} bonnes réponses en A`);
    questions.forEach((q) => { positions[q.correct] += 1; total += 1; });
  }
  const partA = (100 * positions[0]) / total;
  assert.ok(partA <= 20.5, `A mesuré à ${partA.toFixed(1)} % sur le moteur SQL`);
});

test('v555 : Tableaux — le plan réel réduit A à 20 % sur des parties complètes', () => {
  const ctx = fauxNavigateur();
  vm.runInContext(lire('assets/js/quiz-alea.js'), ctx);
  const src = lire('assets/js/quiz-tableaux.js');
  vm.runInContext([
    extraire(src, 'entierAleatoireTab'),
    extraire(src, 'melanger'),
    extraire(src, 'preparerQuestionsMelangees'),
    extraire(src, 'appliquerPlanReponsesTab')
  ].join('\n'), ctx);
  const banque = JSON.parse(lire('assets/data/quiz-banque.json')).questions;
  let enA = 0;
  let total = 0;
  for (let partie = 0; partie < 200; partie += 1) {
    const tirage = [];
    for (let i = 0; i < 10; i += 1) tirage.push(banque[(partie * 10 + i) % banque.length]);
    const questions = ctx.preparerQuestionsMelangees(tirage);
    let compteA = 0;
    for (const it of questions) {
      const position = it.choix.indexOf(it.ref.bonne);
      if (position === 0) compteA += 1;
      total += 1;
    }
    assert.ok(compteA <= 2, `partie ${partie} : ${compteA} bonnes réponses en A`);
    enA += compteA;
  }
  const partA = (100 * enA) / total;
  assert.ok(partA <= 20.5, `A mesuré à ${partA.toFixed(1)} % sur le moteur Tableaux`);
});

test('v555 : sans STIQuizAlea (cache ancien), le moteur SQL reste utilisable', () => {
  const ctx = fauxNavigateur();
  const src = lire('quiz/sql.html');
  vm.runInContext([
    extraire(src, 'entierAleatoireSql'),
    extraire(src, 'preparerQuestionsSql'),
    extraire(src, 'appliquerPlanReponsesSql')
  ].join('\n'), ctx);
  const banque = vm.runInContext('(' + extraireTableau(src, 'const QUESTIONS = ') + ')', ctx);
  const questions = ctx.preparerQuestionsSql(banque.slice(0, 10));
  assert.equal(questions.length, 10);
  questions.forEach((q) => {
    assert.ok(Number.isInteger(q.correct) && q.correct >= 0 && q.correct < 4);
    assert.equal(q.answers.length, 4);
  });
});
