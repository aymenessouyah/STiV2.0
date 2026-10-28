import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../assets/js/profil.js', import.meta.url), 'utf8');

/* Stockage et comptes fictifs : ces tests n'utilisent aucun service distant. */
function contexte(initial = {}) {
  const donnees = new Map(Object.entries(initial).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)]));
  const ecouteurs = {};
  const storage = {
    get length() { return donnees.size; }, key(i) { return [...donnees.keys()][i] ?? null; },
    getItem(k) { return donnees.get(k) ?? null; }, setItem(k, v) { donnees.set(k, String(v)); },
    removeItem(k) { donnees.delete(k); }
  };
  const classes = new Set();
  const racine = { style: { setProperty() {} }, setAttribute() {}, hasAttribute() { return false; },
    classList: { add(c) { classes.add(c); }, remove(c) { classes.delete(c); }, contains(c) { return classes.has(c); } } };
  const document = { readyState: 'loading', documentElement: racine, body: { classList: racine.classList },
    getElementById() { return null; }, addEventListener() {} };
  const ctx = { document, localStorage: storage, sessionStorage: storage, setTimeout() {},
    matchMedia: () => ({ matches: false }),
    addEventListener(nom, fn) { (ecouteurs[nom] ||= []).push(fn); },
    dispatchEvent(e) { (ecouteurs[e.type] || []).forEach(fn => fn(e)); },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options?.detail; } }
  };
  ctx.window = ctx;
  vm.runInNewContext(source, ctx);
  return { api: ctx.STIProfil, donnees, ecouteurs, storage };
}

const clone = x => JSON.parse(JSON.stringify(x));

test('une écriture conserve ensemble les données historiques et celles de la refonte', () => {
  const ancien = {
    prenom: 'Nour', tailleTexte: 'grande', vitesseAudio: 1.15,
    coursVisites: ['html5', 'css3'], derniereLecture: { matiere: 'html5', chapitre: 'Les tableaux', chapitreId: 'tableaux', pourcent: 50, url: 'cours/html5.html#tableaux' },
    chapitres: { html5: { tableaux: 'en_cours', listes: 'revise' } },
    exercicesFaits: { sql: ['tp1'] }, laboratoires: { css3: ['demo'] },
    videos: { vues: ['css3-cours'], positions: { 'html5-cours': 120, 'css3-cours': { temps: 45, duree: 600 } } },
    cours: { chapitres: { 'html5:h1': true }, laboratoires: { 'css3:demo': { angle: 42 } }, miniQuiz: { 'sql:s1': { score: 4, total: 5 } } },
    quizStats: { parQuiz: { sql: { xp: 100, niveau: 1, parties: 2, badges: ['ok'] } } },
    notes: [{ atelier: 'TP', note: 15 }], nouveautesLues: ['v493']
  };
  const { api, donnees } = contexte({ 'sti-profil-abonne': ancien });
  api.mettreAJour('langue', 'en');
  const p = JSON.parse(donnees.get('sti-profil-abonne'));
  assert.equal(p.tailleTexte, 'grand');
  assert.equal(p.vitesseAudio, 1.15);
  assert.deepEqual(p.coursVisites, ['html5', 'css3']);
  assert.equal(p.derniereLecture.chapitreId, 'tableaux');
  assert.deepEqual(p.chapitres.html5, ancien.chapitres.html5);
  assert.deepEqual(p.exercicesFaits.sql, ['tp1']);
  assert.deepEqual(p.laboratoires.css3, ['demo']);
  assert.equal(p.videos.positions['html5-cours'], 120);
  assert.deepEqual(p.videos.positions['css3-cours'], { temps: 45, duree: 600 });
  assert.equal(p.cours.laboratoires['css3:demo'].angle, 42);
  assert.equal(p.quizStats.parQuiz.sql.xp, 100);
  assert.equal(p.notes[0].note, 15);
  assert.deepEqual(p.nouveautesLues, ['v493']);
});

test('une visite en cours ne devient pas une révision et ne remplace pas une révision existante', () => {
  const { api } = contexte();
  api.enregistrerLecture('html5', 'h1', 'Premier chapitre', 10, 'cours/html5.html#cours&ch=h1');
  assert.equal(api.chargerProfil().chapitres.html5.h1, 'en_cours');
  assert.equal(api.estChapitreFait('html5', 'h1'), false);
  assert.equal(api.chargerProfil().derniereLecture.chapitreId, 'h1');
  api.marquerChapitre('html5', 'h1', true, 10);
  api.enregistrerLecture('html5', 'h1', 'Premier chapitre', 10, 'cours/html5.html#cours&ch=h1');
  assert.equal(api.chargerProfil().chapitres.html5.h1, 'revise');
  api.marquerChapitre('html5', 'h1', false, 10);
  assert.equal(api.chargerProfil().chapitres.html5.h1, 'en_cours');
  assert.equal(api.estChapitreFait('html5', 'h1'), false);
});

test('la reprise vidéo accepte les deux signatures et garde les autres positions', () => {
  const { api } = contexte({ 'sti-profil-abonne': { videos: { positions: { 'css3-cours': 42 } } } });
  api.enregistrerPositionVideo({ id: 'html5-cours', matiere: 'html5', titre: 'HTML5', temps: 120, duree: 500 });
  assert.equal(api.chargerProfil().videos.positions['html5-cours'], 120);
  assert.equal(api.chargerProfil().videos.positions['css3-cours'], 42);
  assert.deepEqual(clone(api.positionVideo('html5-cours')), { temps: 120, duree: 0 });
  api.enregistrerPositionVideo('html5-cours', 150, 500);
  assert.equal(api.chargerProfil().videos.positions['html5-cours'], 150);
  api.enregistrerPositionVideo({ id: 'html5-cours', temps: 500, duree: 500, terminee: true });
  assert.equal(api.chargerProfil().videos.positions['html5-cours'], undefined);
  assert.ok(api.chargerProfil().videos.vues.includes('html5-cours'));
});

test('la reprise XP reste isolée par compte et conserve les gains cumulatifs', () => {
  const { api } = contexte({ 'sti-sync-uid': 'eleve-a' });
  const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const operation = { id, cle: 'quizzora_xp_v1', gain: 100, base: 0, attente: 100, cumulatif: true };
  assert.equal(api.ajouterOperationQuiz('eleve-b', operation), false);
  assert.equal(api.ajouterOperationQuiz('eleve-a', operation), true);
  assert.equal(api.ajouterOperationQuiz('eleve-a', { ...operation, gain: 200 }), true);
  assert.equal(api.listerOperationsQuiz('eleve-a')[0].gain, 200);
  assert.equal(api.listerOperationsQuiz('eleve-b').length, 0);
  api.confirmerOperationsQuiz('eleve-a', [id], [operation]);
  assert.equal(api.listerOperationsQuiz('eleve-a')[0].gain, 200, 'une finalisation plus récente doit survivre à un accusé tardif');
});

test('les identifiants historiques et ceux de la refonte représentent un seul chapitre', () => {
  const { api } = contexte({ 'sti-profil-abonne': { chapitres: { html5: { tableaux: 'revise', ancien: 'revise' }, javascript: { sec9: 'revise', sec11: 'revise' } } } });
  assert.equal(api.estChapitreFait('html5', 'h5'), true);
  assert.equal(api.estChapitreFait('javascript', 'j-chaines'), true);
  assert.equal(api.estChapitreFait('javascript', 'j-date'), true);
  assert.equal(api.identifiantChapitre('html5', 'tableaux'), 'h5');
  assert.equal(api.nbChapitresFaits('html5'), 1);
  api.marquerChapitre('html5', 'h5', false, ['h1', 'h5']);
  assert.equal(api.estChapitreFait('html5', 'tableaux'), false);
  assert.equal(api.chargerProfil().chapitres.html5.tableaux, 'en_cours');
  assert.equal(api.chargerProfil().progression.html5, 0);
  api.marquerChapitre('html5', 'h1', true, ['h1', 'h5']);
  assert.equal(api.chargerProfil().progression.html5, 3);
});

test('les chapitres réservés ou obsolètes ne faussent pas la progression accessible', () => {
  const { api } = contexte({ 'sti-profil-abonne': { chapitres: { sql: { bac: 'revise', obsolete: 'revise', intro: 'revise' } } } });
  api.marquerChapitre('sql', 's2', true, ['s1', 's2', 's3']);
  assert.equal(api.chargerProfil().progression.sql, 3);
  api.marquerChapitre('sql', 's3', true, ['s1', 's2', 's3']);
  assert.equal(api.chargerProfil().progression.sql, 5);
});
