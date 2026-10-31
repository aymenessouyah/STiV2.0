/* v520 — « le compteur XP ne recule jamais ».
   Scénario de référence : un élève atteint 5 000 XP sur son téléphone connecté,
   puis joue hors ligne sur son PC jusqu'à 6 000 XP. À la reconnexion, le PC ne
   doit pas retomber à 5 000 : le cloud passe à 6 000 et les deux appareils
   affichent 6 000. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const racine = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (p) => readFileSync(resolve(racine, p), 'utf8');
const sync = lire('assets/js/sync-progressions.js');
const plancher = lire('assets/js/xp-plancher.js');
const profil = lire('assets/js/profil.js');
const quizSync = lire('assets/js/quiz-sync.js');
const sw = lire('sw.js');
const migration = 'supabase/migrations/20261029_xp_jamais_en_recul_v520.sql';

/* Environnement minimal : localStorage réel (Map) + événements factices. */
function environnement(depart) {
  const donnees = new Map(Object.entries(depart || {}));
  const proto = {
    getItem(cle) { const c = String(cle); return donnees.has(c) ? donnees.get(c) : null; },
    setItem(cle, valeur) { donnees.set(String(cle), String(valeur)); },
    removeItem(cle) { donnees.delete(String(cle)); },
    clear() { donnees.clear(); },
    key(i) { return Array.from(donnees.keys())[i] ?? null; }
  };
  const ecoutes = [];
  const localStorage = Object.create(proto);
  Object.defineProperty(localStorage, 'length', { get: () => donnees.size });
  const contexte = {
    localStorage,
    sessionStorage: Object.create(proto),
    addEventListener(type, fn) { ecoutes.push([type, fn]); },
    dispatchEvent() { return true; },
    setInterval() { return 0; },
    clearInterval() {},
    setTimeout() { return 0; },
    console
  };
  contexte.CustomEvent = class { constructor(type, init) { this.type = type; this.detail = init && init.detail; } };
  contexte.document = { hidden: false, readyState: 'complete', addEventListener() {}, dispatchEvent() { return true; } };
  contexte.window = contexte;
  return { contexte, donnees, ecoutes, localStorage: contexte.localStorage };
}

const xpDe = (env, cle) => JSON.parse(env.donnees.get(cle) || '{}').xp;

test('v520 : une écriture plus faible ne fait jamais reculer le compteur XP', () => {
  const env = environnement({ quizzora_xp_v1: JSON.stringify({ xp: 6000, best: 5, parties: 4, bonnes: 12, total: 15 }) });
  vm.runInNewContext(plancher, env.contexte);
  assert.equal(typeof env.contexte.STIXPPlancher, 'object', 'le garde-fou est exposé');
  assert.equal(xpDe(env, 'quizzora_xp_v1'), 6000);
  /* Une réponse cloud retardataire, une ancienne version du site ou une
     correction de doublon ne peuvent plus faire descendre l'affichage. */
  env.localStorage.setItem('quizzora_xp_v1', JSON.stringify({ xp: 5000, best: 4, parties: 3, bonnes: 10, total: 12 }));
  assert.equal(xpDe(env, 'quizzora_xp_v1'), 6000);
  /* Un gain réel reste accepté, et les champs cumulés avancent ensemble. */
  env.localStorage.setItem('quizzora_xp_v1', JSON.stringify({ xp: 6250, best: 6, parties: 5, bonnes: 13, total: 16 }));
  assert.equal(xpDe(env, 'quizzora_xp_v1'), 6250);
  /* Une partie mal notée ne fait pas perdre les records déjà acquis. */
  env.localStorage.setItem('quizzora_xp_v1', JSON.stringify({ xp: 6250, best: 2, parties: 5, bonnes: 13, total: 16 }));
  assert.equal(JSON.parse(env.donnees.get('quizzora_xp_v1')).best, 6, 'le record ne recule pas');
});

test('v520 : le plancher reste propre à un appareil et s’efface avec le compte', () => {
  const env = environnement({ quizzora_xp_v1: JSON.stringify({ xp: 6000, best: 5, parties: 4, bonnes: 12, total: 15 }) });
  vm.runInNewContext(plancher, env.contexte);
  env.localStorage.setItem('quizzora_xp_v1', JSON.stringify({ xp: 5000 }));
  assert.equal(xpDe(env, 'quizzora_xp_v1'), 6000);
  /* Changement d'élève sur le même poste : le compteur est supprimé. */
  env.localStorage.removeItem('quizzora_xp_v1');
  env.localStorage.setItem('quizzora_xp_v1', JSON.stringify({ xp: 250, best: 1, parties: 1, bonnes: 1, total: 1 }));
  assert.equal(xpDe(env, 'quizzora_xp_v1'), 250, 'le plancher est oublié avec le compteur');
  assert.equal(env.donnees.has('sti-xp-plancher-v520'), true, 'le plancher ne fuit pas dans les autres compteurs');
});

test('v520 : une série en cours peut repartir de zéro, seuls les cumuls sont protégés', () => {
  const env = environnement({ sqlQuestV3: JSON.stringify({ xp: 900, level: 3, streak: 7, totalAnswered: 20, totalCorrect: 15, bestCombo: 4, playgroundCount: 2 }) });
  vm.runInNewContext(plancher, env.contexte);
  env.localStorage.setItem('sqlQuestV3', JSON.stringify({ xp: 900, level: 3, streak: 0, totalAnswered: 20, totalCorrect: 15, bestCombo: 4, playgroundCount: 2 }));
  const apres = JSON.parse(env.donnees.get('sqlQuestV3'));
  assert.equal(apres.streak, 0, 'la série du jour peut redescendre');
  assert.equal(apres.xp, 900);
  env.localStorage.setItem('sqlQuestV3', JSON.stringify({ xp: 100, level: 1, streak: 0, totalAnswered: 1, totalCorrect: 1, bestCombo: 1, playgroundCount: 0 }));
  assert.equal(JSON.parse(env.donnees.get('sqlQuestV3')).xp, 900, 'le total cumulé, lui, ne recule pas');
});

test('v520 : le synchroniseur compare son empreinte au contenu réel du cloud', () => {
  /* La référence après lecture est l'empreinte du cloud, jamais celle du local fusionné. */
  assert.match(sync, /var hashCloud = hash\(normaliserDonneesCloud\(lignes\[0\]\.donnees\)\);/);
  assert.doesNotMatch(sync, /dernierHash = hash\(collecter\(\)\);/, 'l’empreinte locale ne sert plus de référence après un pull');
  assert.match(sync, /if \(apresHash !== hashCloud/, 'un gain local plus élevé est renvoyé au cloud');
  /* L'empreinte n'est retenue qu'après un envoi réussi. */
  const bloc = sync.split('function pousser(')[1].split('var timerPushMedia')[0];
  assert.match(bloc, /if \(!force && h === dernierHash\) return;/);
  const avantPost = bloc.split('.then(function (r) {')[0];
  assert.doesNotMatch(avantPost, /dernierHash = h;/, 'un POST raté ne doit pas valider l’empreinte');
  assert.match(bloc, /if \(r\.ok\) \{[\s\S]*?dernierHash = h;/);
  /* Le plancher local est renvoyé au cloud dès qu'il relève un compteur. */
  assert.match(sync, /addEventListener\("sti-xp-plancher-releve"/);
  /* Les valeurs du cloud sont normalisées comme dans « collecter ». */
  assert.match(sync, /function normaliserDonneesCloud\(d\)/);
});

test('v520 : le garde-fou est livré, préchargé et hors ligne sur toutes les pages de quiz', () => {
  for (const page of ['quiz/html-css.html', 'quiz/javascript.html', 'quiz/sql.html', 'quiz/php.html', 'quiz/tableaux.html']) {
    const html = lire(page);
    assert.equal((html.match(/xp-plancher\.js\?v=520/g) || []).length, 1, page + ' : garde-fou chargé une fois');
    const iPlancher = html.indexOf('xp-plancher.js?v=520');
    const iAlea = html.indexOf('quiz-alea.js');
    assert.ok(iPlancher >= 0 && (iAlea < 0 || iPlancher < iAlea), page + ' : le garde-fou précède le tirage aléatoire');
  }
  /* Chargé aussi par le synchroniseur : profil, tableau de bord et accueil en profitent. */
  assert.match(sync, /xp-plancher\.js\?v=520/);
  assert.match(sync, /chargerPlancherXP\(\);/);
  /* Découverte hors ligne : delta, préchargement et installation complète. */
  const delta = sw.split('var UPDATE_FILES = [')[1].split('];')[0];
  assert.match(delta, /url: "\.\/assets\/js\/xp-plancher\.js", revision: "xp-jamais-en-recul-v520"/);
  for (const bloc of ['SHELL', 'OFFLINE_LIST']) {
    assert.ok(sw.split('var ' + bloc + ' = [')[1].split('];')[0].includes('"./assets/js/xp-plancher.js"'), bloc);
  }
  const manifeste = JSON.parse(lire('offline-complete-manifest.json'));
  assert.ok(manifeste.files.some(f => f.path === 'assets/js/xp-plancher.js'));
  assert.match(sw, /var UPDATE_ID = "v578-video-cours-sti-visuels-20261031"/); /* lot v521 : meta descriptions */
});

test('v520 : profil.js et quiz-sync.js refusent aussi une baisse avant écriture', () => {
  assert.match(profil, /function releverAcquisQuiz\(cle, valeur\)/);
  assert.match(profil, /valeur = releverAcquisQuiz\(cle, valeur\);/);
  assert.match(quizSync, /fusion\.xp = Math\.max\(Number\(fusion\.xp\) \|\| 0, Number\(etatLocal\.xp\) \|\| 0\);/);
  /* Le plancher n'est jamais envoyé au cloud ni mélangé entre appareils. */
  assert.match(sync, /"sti-xp-plancher-v520",/);
  assert.match(lire('assets/js/reconnexion-profil.js'), /sti-xp-plancher-v520/);
});

test('v520 : migration SQL monotone, idempotente et sans baisse possible', () => {
  assert.ok(existsSync(resolve(racine, migration)), 'la migration est livrée');
  const sql = lire(migration);
  assert.match(sql, /create or replace function public\.sti_quiz_xp_proteger_registre\(\)/);
  assert.match(sql, /create or replace function public\.sti_appliquer_gains_xp_quiz\(/);
  assert.match(sql, /create or replace function public\.sti_appliquer_gain_partie_quiz\(/);
  assert.equal((sql.match(/if v_observe > v_total then/g) || []).length, 1, 'le registre s’aligne sur un total plus élevé');
  assert.equal((sql.match(/if v_observe > v_base \+ v_cumul then/g) || []).length, 2, 'les deux gains relèvent la base avant d’ajouter');
  /* Rien n'abaisse un compteur : le trigger écrit toujours le maximum connu. */
  assert.match(sql, /v_xp := greatest\(v_xp_ancien, v_total\);/);
  assert.doesNotMatch(sql, /set base = v_observe - v_cumul\s*\n\s*where[^;]*- \s*\(/);
  /* Les empreintes du manifeste restent exactes. */
  const manifeste = JSON.parse(lire('offline-complete-manifest.json'));
  const entree = manifeste.files.find(f => f.path === migration);
  assert.ok(entree, 'migration incluse dans l’installation complète');
  assert.equal(entree.bytes, readFileSync(resolve(racine, migration)).length);
});
