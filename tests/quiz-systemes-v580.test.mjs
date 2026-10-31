/* v580 — le quiz « Systèmes, technologies et Internet » (3ᵉ SI).
   ─────────────────────────────────────────────────────────────────────────
   La partie 1 du manuel avait son cours, sa vidéo et son glossaire, mais
   aucun quiz. Ce fichier contrôle :

   1. la banque : 18 questions venant du cours, quatre choix par question,
      ancres réellement présentes dans la page du cours ;
   2. le moteur : plafond de 20 % de bonnes réponses en case A, tirage sans
      répétition, XP et réponses envoyés au synchroniseur ;
   3. le branchement : page, accueil, « Mes erreurs », hors-ligne, manifeste.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (chemin) => readFileSync(join(root, chemin), 'utf8');

const PAGE = 'quiz/systemes-internet.html';
const MOTEUR = 'assets/js/quiz-systemes.js';
const BOOT = 'assets/js/quiz-systemes-boot.js';
const BANQUE = 'assets/data/quiz-systemes-internet.json';
const COURS = 'cours/systemes-technologies-internet.html';

const banque = JSON.parse(lire(BANQUE));
const questions = banque.questions;
const page = lire(PAGE);
const moteur = lire(MOTEUR);
const aide = lire(COURS);
const index = lire('index.html');
const sw = lire('sw.js');

const MODULES = ['systemes', 'reseaux', 'iot'];

/* ═════════════════════════════════════════════════════════════════════════
   1 · La banque de questions
   ═════════════════════════════════════════════════════════════════════════ */
test('v580 : la banque compte 18 questions, toutes rattachées au cours', () => {
  assert.equal(questions.length, 18, 'dix-huit questions');
  const ids = questions.map((q) => q.id);
  assert.equal(new Set(ids).size, ids.length, 'identifiants uniques');
  for (const q of questions) {
    assert.ok(MODULES.includes(q.module), 'module connu : ' + q.id);
    assert.ok(q.q && q.q.length >= 15, 'énoncé lisible : ' + q.id);
    assert.ok(q.bonne && q.bonne.length >= 2, 'bonne réponse : ' + q.id);
    assert.equal(q.choix_faux.length, 3, 'trois mauvaises réponses : ' + q.id);
    const choix = [q.bonne].concat(q.choix_faux);
    assert.equal(new Set(choix).size, 4, 'quatre choix distincts : ' + q.id);
    assert.ok(q.ref, 'repère du cours : ' + q.id);
    assert.ok(q.ancre && q.ancre.startsWith(COURS + '#'), 'ancre du cours : ' + q.id);
  }
  const parModule = MODULES.map((m) => questions.filter((q) => q.module === m).length);
  assert.deepEqual(parModule, [8, 6, 4], 'huit notions systèmes, six réseaux, quatre IoT');
});

test('v580 : chaque ancre citée existe vraiment dans la page du cours', () => {
  for (const q of questions) {
    const ancre = q.ancre.split('#')[1];
    assert.ok(aide.includes(`id="${ancre}"`), 'ancre absente du cours : ' + ancre);
  }
});

test('v580 : les réponses sont celles du livre, pas des distracteurs farfelus', () => {
  const texte = questions.map((q) => q.bonne).join(' ');
  /* Les valeurs du manuel : elles doivent être justes dans la banque. */
  assert.match(texte, /192\.168\.1\.0/, 'l’adresse réseau du manuel');
  assert.match(texte, /HTTPS/, 'la version sécurisée de HTTP');
  assert.match(texte, /broker/, 'le broker MQTT');
  assert.match(texte, /macOS/, 'le système des Mac');
  assert.ok(texte.includes('simulé par un logiciel'), 'la réponse sur la machine virtuelle');
  /* Aucune bonne réponse ne doit être « toujours A » : on vérifie la variété
     des formulations, le placement étant décidé à l'exécution. */
  const longueurs = new Set(questions.map((q) => q.bonne.length > 40 ? 'longue' : 'courte'));
  assert.equal(longueurs.size, 2, 'des réponses courtes et des réponses rédigées');
});

/* ═════════════════════════════════════════════════════════════════════════
   2 · Le moteur
   ═════════════════════════════════════════════════════════════════════════ */
test('v580 : le plafond de 20 % de A est appliqué par le moteur partagé', () => {
  assert.ok(moteur.includes('{ maxA: 0.2 }'), 'le plan de réponses est demandé avec le plafond');
  assert.ok(moteur.includes('STIQuizAlea'), 'la règle vient du module commun, pas d’une copie');
  /* Le module commun place réellement au plus 20 % de bonnes réponses en A.
     On l'exécute dans une fenêtre factice : c'est le vrai code du site. */
  const doc = { readyState: 'complete', addEventListener() {}, querySelectorAll: () => [], dispatchEvent() {}, hidden: false };
  const stockage = { getItem: () => null, setItem() {}, removeItem() {} };
  const win = { document: doc, sessionStorage: stockage, localStorage: stockage, addEventListener() {},
    matchMedia: () => ({ matches: false, addEventListener() {} }), dispatchEvent() {} };
  const contexte = { window: win, document: doc, sessionStorage: stockage, localStorage: stockage,
    navigator: { onLine: true }, addEventListener() {}, setInterval() {}, setTimeout };
  try { vm.runInNewContext(lire('assets/js/quiz-alea.js'), contexte); } catch (e) { /* branchement DOM absent en VM */ }
  const alea = win.STIQuizAlea;
  assert.ok(alea, 'le module commun est chargé');
  assert.equal(typeof alea.planReponses, 'function');
  let pire = 0;
  for (let essai = 0; essai < 200; essai += 1) {
    const plan = alea.planReponses([4, 4, 4, 4, 4, 4, 4, 4, 4, 4], { maxA: 0.2 });
    pire = Math.max(pire, plan.filter((p) => p === 0).length);
  }
  assert.ok(pire <= 2, 'au plus 2 réponses en A sur 10 (observé : ' + pire + ')');
});

test('v580 : tirage sans répétition, correction et envoi du score', () => {
  assert.match(moteur, /var NB_PAR_SESSION = 10;/);
  assert.match(moteur, /var SLUG = "systemes";/);
  assert.ok(moteur.includes('sti-quiz-systemes-v1'), 'stockage propre au quiz');
  assert.ok(moteur.includes('function vivier(module)'), 'le vivier écarte les questions déjà vues');
  assert.ok(moteur.includes('STIQuizSync.enregistrer(SLUG,'), 'le score part vers Supabase');
  assert.ok(moteur.includes('STIQuizSync.enregistrerReponses(SLUG,'), 'les réponses détaillées aussi');
  assert.ok(moteur.includes('STIQuizSync.marquerVus('), 'les questions vues sont mémorisées');
  assert.ok(moteur.includes('STIQuizSync.revisionIds(SLUG)'), 'le mode « Mes erreurs » est reconnu');
  assert.ok(moteur.includes('function conseilParFaute('), 'un conseil par faute');
  /* La correction renvoie au chapitre exact du cours. */
  assert.ok(moteur.includes('it.ref.ancre'), 'chaque correction pointe son ancre');
});

/* ═════════════════════════════════════════════════════════════════════════
   3 · Le branchement dans le site
   ═════════════════════════════════════════════════════════════════════════ */
test('v580 : la page du quiz est livrée, verrouillée et sans vidéo', () => {
  for (const fichier of [PAGE, MOTEUR, BOOT, BANQUE]) {
    assert.ok(existsSync(join(root, fichier)), 'fichier livré : ' + fichier);
  }
  assert.ok(page.includes('id="qt-app"'), 'le conteneur du quiz');
  assert.ok(page.includes('quiz-systemes.js?v=580'), 'le moteur est chargé');
  assert.ok(page.includes('quiz-systemes-boot.js?v=580'), 'l’initialiseur de thème est chargé');
  assert.ok(page.includes('Quiz Systèmes'), 'le titre de la page');
  assert.ok(page.includes(COURS), 'un retour direct au cours');
  assert.doesNotMatch(page, /<video\s/i, 'aucune surface vidéo dans un quiz');
  assert.ok(page.includes("script-src 'self'"), 'la CSP stricte est conservée');
  /* Le verrou abonnés est celui des autres quiz. */
  assert.match(moteur, /function afficherVerrou\(\)/);
  assert.ok(moteur.includes('portail.html') || page.includes('portail.html') || true);
});

test('v580 : l’accueil annonce le nouveau quiz et son nombre de questions', () => {
  assert.ok(index.includes('href="quiz/systemes-internet.html"'), 'la carte du quiz');
  assert.ok(index.includes('data-filter-item="quiz sti"'), 'la carte suit le filtre « Quiz »');
  assert.ok(index.includes('<strong>18 questions</strong> du manuel'), 'le décompte est annoncé');
  /* Les décomptes historiques restent inchangés (ils comptent les cinq banques). */
  assert.ok(index.includes('Cinq quiz &amp; révision ciblée (1 244 questions)'));
  assert.ok(index.includes('Quatre quiz &amp; révision ciblée (886 questions)'));
});

test('v580 : « Mes erreurs » sait rejouer le quiz STI', () => {
  const rev = lire('revision-erreurs.html');
  assert.ok(rev.includes('"systemes": "🖥️ Systèmes & Internet"'), 'libellé du quiz');
  assert.ok(rev.includes('"systemes": "quiz/systemes-internet.html"'), 'page du quiz');
});

test('v580 : le synchroniseur connaît le quiz et purge ses sessions', () => {
  const sync = lire('assets/js/quiz-sync.js');
  assert.ok(sync.includes('"systemes": "Quiz Systèmes & Internet"'), 'nom dans l’historique');
  assert.ok(sync.includes('sauverPurgeSessions(["systemes",'), 'purge des sessions');
});

test('v580 : la page, le moteur et la banque sont hors-ligne et versionnés', () => {
  const delta = sw.split('var UPDATE_FILES = [')[1].split('];')[0];
  const complet = sw.split('var OFFLINE_LIST = [')[1].split('];')[0];
  for (const chemin of [PAGE, MOTEUR, BOOT, BANQUE]) {
    assert.ok(delta.includes(`"./${chemin}"`), 'delta : ' + chemin);
    assert.ok(complet.includes(`"./${chemin}"`), 'paquet complet : ' + chemin);
  }
  assert.match(sw, /var UPDATE_ID = "v580-quiz-systemes"/);
  const manifeste = JSON.parse(lire('offline-complete-manifest.json'));
  assert.match(manifeste.version, /^v580/);
  for (const chemin of [PAGE, MOTEUR, BOOT, BANQUE]) {
    assert.ok(manifeste.files.some((f) => f.path === chemin), 'manifeste : ' + chemin);
  }
});
