import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

/* Les comptes et le cloud sont fictifs. Le moteur et les banques sont réels ;
   deux fermetures lexicales sont exposées uniquement dans les réponses du harnais. */
const sdkFictif = `
window.supabase = { createClient: function () {
  function session() { try { return JSON.parse(localStorage.getItem('sb-test-auth-token') || 'null'); } catch (e) { return null; } }
  function requete() {
    var q = {};
    ['select','eq','order','limit','update','delete','upsert','in','gte','lte'].forEach(function (m) { q[m] = function () { return q; }; });
    q.insert = function () { return Promise.resolve({ data: [], error: null }); };
    q.range = function () { return Promise.resolve({ data: [], error: null }); };
    q.maybeSingle = q.single = function () { return Promise.resolve({ data: null, error: null }); };
    q.then = function (resolve, reject) { return Promise.resolve({ data: [], error: null }).then(resolve, reject); };
    return q;
  }
  return { auth: { getUser: function () { var s = session(); return Promise.resolve({ data: { user: s && s.user } }); },
    getSession: function () { return Promise.resolve({ data: { session: session() } }); },
    onAuthStateChange: function () { return { data: { subscription: { unsubscribe: function () {} } } }; } },
    from: function () { return requete(); }, rpc: function () { return Promise.resolve({ data: null, error: null }); } };
} };
`;

async function preparer(context, id) {
  await context.route('**/sw.js*', route => route.abort());
  await context.route('https://*.supabase.co/**', route => route.fulfill({
    status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' },
    body: JSON.stringify({ valeur: { xp: 0 }, confirmes: [] })
  }));
  await context.route('**/assets/js/supabase-umd.js*', route => route.fulfill({ contentType: 'text/javascript', body: sdkFictif }));
  const html = await readFile(new URL('../quiz/html-css.html', import.meta.url), 'utf8');
  expect(html).toContain('function nouvellePartie() {');
  const instrumente = html.replace('function nouvellePartie() {',
    'window.__testHc = { nouvelle: nouvellePartie, lancer: lancerPartie, etat: state, banque: BANQUE }; function nouvellePartie() {');
  await context.route('**/quiz/html-css.html*', route => route.fulfill({ contentType: 'text/html; charset=utf-8', body: instrumente }));
  const tableaux = await readFile(new URL('../assets/js/quiz-tableaux.js', import.meta.url), 'utf8');
  expect(tableaux).toContain('var sessionQuiz = null;');
  const tableauxInstrumentes = tableaux.replace('var sessionQuiz = null;',
    'var sessionQuiz = null; window.__testTableaux = { demarrer: demarrer, session: function () { return sessionQuiz; }, banque: function () { return banque; } };');
  await context.route('**/assets/js/quiz-tableaux.js*', route => route.fulfill({ contentType: 'text/javascript; charset=utf-8', body: tableauxInstrumentes }));
  await context.addInitScript(id => {
    try {
      const session = { nativeAuthenticated: true, statut: 'actif', id, email: `${id}@example.invalid`, prenom: id, role: 'eleve', classe: '4SI 1' };
      window.__STI_NATIVE_AUTHENTICATED_V316 = true;
      sessionStorage.setItem('sti-native-session-v316', '1');
      sessionStorage.setItem('sti-session-cache', JSON.stringify(session));
      localStorage.setItem('sti-session-cache', JSON.stringify(session));
      localStorage.setItem('sb-test-auth-token', JSON.stringify({ access_token: `jeton-${id}`, user: { id, email: session.email } }));
      localStorage.setItem('sti-demo-vu', '1');
      // Le profil SQL fictif est déjà créé : son onboarding différé ne masque
      // pas le bouton de reprise pendant ce scénario consacré à la session.
      if (/\/quiz\/sql\.html$/.test(location.pathname) && !localStorage.getItem('sqlQuestV3')) {
        localStorage.setItem('sqlQuestV3', JSON.stringify({ profileSet: true, pseudo: id }));
      }
    } catch (e) { /* iframe sandbox */ }
  }, id);
}

async function ouvrir(page, nom) {
  await page.goto(`/quiz/${nom}.html`, { waitUntil: 'domcontentloaded' });
  if (nom === 'tableaux') await expect(page.locator('#qt-app [data-module="mix"]')).toBeVisible();
  else await expect.poll(() => page.evaluate(n => {
    if (n === 'html-css') return typeof window.__testHc === 'object';
    if (n === 'javascript') return typeof game === 'object';
    if (n === 'sql') return typeof pickQuestions === 'function';
    return typeof startQuiz === 'function';
  }, nom)).toBe(true);
}

/* Échantillonner le même chemin de tirage que celui d'une nouvelle partie ;
   retourner aussi la bonne réponse de la banque originale pour chaque question. */
async function tirage(page, nom) {
  return page.evaluate(n => {
    if (n === 'html-css') {
      const t = window.__testHc; t.nouvelle();
      return t.etat.session.map(q => {
        const original = t.banque.find(o => o.text === q.text && o.cat === q.cat);
        return { id: q.cat + ':' + q.text, options: q.options.map(o => o.text), bonne: q.options.find(o => o.ok)?.text,
          origine: original?.options[original.correct], nbBonnes: q.options.filter(o => o.ok).length };
      });
    }
    if (n === 'javascript') {
      return game.shuffleQuestions().slice(0, 10).map(q => {
        const original = QUESTIONS_DB.find(o => o.title === q.title);
        return { id: q.title, options: q.options, bonne: q.options[q.answer], origine: original?.options[original.answer], nbBonnes: 1 };
      });
    }
    if (n === 'sql') {
      return pickQuestions('classique').map(q => {
        const original = QUESTIONS.find(o => o.id === q.id);
        return { id: String(q.id), options: q.answers, bonne: q.answers[q.correct], origine: original?.answers[original.correct], nbBonnes: 1 };
      });
    }
    if (n === 'php') {
      startQuiz();
      return quiz.list.map(q => {
        const original = QUESTIONS.find(o => o.q === q.q && (o.code || '') === (q.code || ''));
        return { id: q.q + ':' + (q.code || ''), options: q._opts, bonne: q._opts[q._ans], origine: original?.options[original.answer], nbBonnes: 1 };
      });
    }
    const t = window.__testTableaux; t.demarrer('mix');
    return t.session().questions.map(q => ({ id: String(q.ref.id), options: q.choix, bonne: q.choix.find(x => x === q.ref.bonne), origine: q.ref.bonne, nbBonnes: q.choix.filter(x => x === q.ref.bonne).length }));
  }, nom);
}

for (const nom of ['html-css', 'javascript', 'sql', 'php', 'tableaux']) {
  test(`${nom} : tirages et propositions varient selon les sessions et les abonnés, sans perdre la bonne réponse`, async ({ browser }) => {
    const contextes = await Promise.all(['alice', 'bob'].map(async id => {
      const ctx = await browser.newContext(); await preparer(ctx, id); return ctx;
    }));
    try {
      const resultats = [];
      for (const contexte of contextes) {
        const page = await contexte.newPage();
        // Trois chargements par compte simulent de nouvelles sessions, et deux
        // tirages par chargement permettent d'observer des questions communes.
        for (let session = 0; session < 3; session++) {
          await ouvrir(page, nom);
          for (let partie = 0; partie < 2; partie++) resultats.push(await tirage(page, nom));
        }
      }
      expect(resultats).toHaveLength(12);
      for (const liste of resultats) {
        expect(liste.length).toBeGreaterThanOrEqual(8);
        expect(new Set(liste.map(q => q.id)).size).toBe(liste.length);
        for (const q of liste) {
          expect(q.bonne, q.id).toBe(q.origine);
          expect(q.nbBonnes, q.id).toBe(1);
        }
      }
      // Les probabilités de collision d'une série complète sont négligeables ;
      // un tirage aléatoire ne garantit cependant pas que chaque question diffère.
      expect(new Set(resultats.map(r => r.map(q => q.id).join('|'))).size).toBe(12);
      const propositions = new Map();
      for (const liste of resultats) for (const q of liste) {
        if (!propositions.has(q.id)) propositions.set(q.id, new Set());
        propositions.get(q.id).add(JSON.stringify(q.options));
      }
      expect([...propositions.values()].some(ordres => ordres.size > 1)).toBe(true);
    } finally { await Promise.all(contextes.map(ctx => ctx.close())); }
  });
}

async function demarrerEtRepondre(page, nom) {
  await page.evaluate(n => {
    if (n === 'html-css') window.__testHc.lancer();
    else if (n === 'javascript') game.start('arcade');
    else if (n === 'sql') startQuiz('classique');
    else if (n === 'php') startQuiz();
    else window.__testTableaux.demarrer('mix');
  }, nom);
  const choix = await page.evaluate(n => {
    if (n === 'html-css') return window.__testHc.etat.session[0].options.findIndex(o => o.ok);
    if (n === 'javascript') return game.questions[0].answer;
    if (n === 'sql') return Q.questions[0].correct;
    if (n === 'php') return quiz.list[0]._ans;
    const q = window.__testTableaux.session().questions[0];
    return q.choix.indexOf(q.ref.bonne);
  }, nom);
  const selecteurs = { 'html-css': '#qOptions button', javascript: '#options-grid .option-btn', sql: '#answersGrid button', php: '#qOptions button', tableaux: '#qt-app [data-choix]' };
  await page.locator(selecteurs[nom]).nth(choix).click();
  if (nom === 'tableaux') await page.locator('#qt-suivant').click();
  await expect.poll(() => page.evaluate(n => {
    const s = JSON.parse(localStorage.getItem('sti-quiz-sessions-actives-v1') || '{}')[n];
    return s && s.index_courant === 1 && s.score === 1;
  }, nom)).toBe(true);
  return page.evaluate(n => JSON.parse(localStorage.getItem('sti-quiz-sessions-actives-v1'))[n], nom);
}

for (const nom of ['html-css', 'javascript', 'sql', 'php', 'tableaux']) {
  test(`${nom} : une reprise volontaire dans un second onglet conserve la série et le score`, async ({ browser }) => {
    const ctx = await browser.newContext(); await preparer(ctx, 'alice');
    try {
      const a = await ctx.newPage(); await ouvrir(a, nom);
      const sauvegarde = await demarrerEtRepondre(a, nom);
      const b = await ctx.newPage(); await ouvrir(b, nom);
      const boutons = { 'html-css': '#hcResumeBtn', javascript: '#js-resume-cloud-btn', sql: '#sqlResumeCloudBtn', php: '#phpResumeCloudBtn', tableaux: '#qt-reprendre-cloud' };
      await expect(b.locator(boutons[nom])).toBeVisible();
      // Activer au clavier, sans dépendre de la position des éléments fixes de la page.
      await b.locator(boutons[nom]).focus();
      await b.locator(boutons[nom]).press('Enter');
      const reprise = await b.evaluate(n => {
        if (n === 'html-css') {
          const s = window.__testHc.etat;
          return { index: s.index, score: s.session.filter(q => q.answer !== null && q.options[q.answer]?.ok).length,
            ordre: s.session.map(q => ({ id: q.text, options: q.options.map(o => o.text), correcte: q.options.findIndex(o => o.ok) })) };
        }
        if (n === 'javascript') return { index: game.currentQuestionIdx, score: game.correctCount, ordre: game.questions.map(q => ({ id: q.title, options: q.options, correcte: q.answer })) };
        if (n === 'sql') return { index: Q.index, score: Q.correct, ordre: Q.questions.map(q => ({ id: String(q.id), options: q.answers, correcte: q.correct })) };
        if (n === 'php') return { index: quiz.idx, score: quiz.correct, ordre: quiz.list.map(q => ({ id: q.q, options: q._opts, correcte: q._ans })) };
        const s = window.__testTableaux.session();
        return { index: s.index, score: s.questions.filter(q => q.choixEleve >= 0 && q.choix[q.choixEleve] === q.ref.bonne).length,
          ordre: s.questions.map(q => ({ id: String(q.ref.id), options: q.choix, correcte: q.choix.indexOf(q.ref.bonne) })) };
      }, nom);
      const ordreInitial = sauvegarde.ordre_questions.map(q => {
        if (nom === 'html-css') return { id: q.text, options: q.options.map(o => o.text), correcte: q.options.findIndex(o => o.ok) };
        if (nom === 'javascript') return { id: q.title, options: q.options, correcte: q.answer };
        if (nom === 'sql') return { id: String(q.id), options: q.answers, correcte: q.correct };
        if (nom === 'php') return { id: q.q, options: q._opts, correcte: q._ans };
        const originale = reprise.ordre.find(o => o.id === String(q.qid));
        return { id: String(q.qid), options: q.choix, correcte: originale.correcte };
      });
      expect(reprise.index).toBe(sauvegarde.index_courant);
      expect(reprise.score).toBe(sauvegarde.score);
      expect(reprise.ordre).toEqual(ordreInitial);
      expect(sauvegarde.etat_meta.partie_id).toMatch(/^[0-9a-f-]{36}$/i);
      const identite = await b.evaluate(n => n === 'html-css' ? window.__testHc.etat.partieId :
        n === 'javascript' ? game.partieId : n === 'sql' ? Q.partieId : n === 'php' ? quiz.partieId : window.__testTableaux.session().partieId, nom);
      expect(identite).toBe(sauvegarde.etat_meta.partie_id);
    } finally { await ctx.close(); }
  });
}

test('quitter une partie la finalise : le prochain chargement ne propose pas de reprise locale', async ({ browser }) => {
  const ctx = await browser.newContext(); await preparer(ctx, 'alice');
  try {
    const page = await ctx.newPage();
    for (const nom of ['html-css', 'javascript', 'sql', 'php', 'tableaux']) {
      await ouvrir(page, nom);
      await demarrerEtRepondre(page, nom);
      // Une navigation réelle déclenche pagehide, la finalisation et la purge.
      await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
      expect(await page.evaluate(n => JSON.parse(localStorage.getItem('sti-quiz-sessions-actives-v1') || '{}')[n] || null, nom), nom).toBeNull();
    }
  } finally { await ctx.close(); }
});

test('les questions vues et la partie en cours restent isolées par compte', async ({ browser }) => {
  const ctx = await browser.newContext();
  await preparer(ctx, 'bob');
  try {
    const page = await ctx.newPage(); await ouvrir(page, 'sql');
    const resultat = await page.evaluate(async () => {
      // Un ordinateur partagé porte encore les traces d'Alice.
      localStorage.setItem('sti-quiz-vus-ordre-v1', JSON.stringify({ _uid: 'alice', q_sql: ['sql-1', 'sql-2'] }));
      localStorage.setItem('sti-quiz-sessions-actives-v1', JSON.stringify({ sql: {
        quiz: 'sql', user_id: 'alice', index_courant: 1, score: 1, ordre_questions: [{ id: 1 }, { id: 2 }], _dirty: true
      } }));
      localStorage.removeItem('sti-quiz-sessions-purge-v1');
      const ordre = STIQuizSync.ordonnerAvecQuestionsNonVues('q_sql', [{ id: 'sql-1' }, { id: 'sql-2' }, { id: 'sql-3' }], q => q.id);
      const session = await STIQuizSync.chargerSession('sql');
      return { ordre: ordre.map(q => q.id), session };
    });
    expect(resultat.ordre).toEqual(['sql-1', 'sql-2', 'sql-3']);
    expect(resultat.session).toBeNull();
  } finally { await ctx.close(); }
});

// Une identité commune empêche deux finalisations de créditer la même partie.
for (const [nom, cle, bouton] of [
  ['html-css', 'quizzora_xp_v1', '#hcResumeBtn'],
  ['javascript', 'sti-quiz-xp-js-v1', '#js-resume-cloud-btn'],
  ['sql', 'sqlQuestV3', '#sqlResumeCloudBtn'],
  ['php', 'quizphp_v1_user', '#phpResumeCloudBtn']
]) {
  test(`${nom} : deux onglets reprenant la même partie ne créditent qu'une fois`, async ({ browser }) => {
    const ctx = await browser.newContext(); await preparer(ctx, 'alice');
    try {
      const a = await ctx.newPage(); await ouvrir(a, nom);
      const sauvegarde = await demarrerEtRepondre(a, nom);
      const b = await ctx.newPage(); await ouvrir(b, nom);
      await expect(b.locator(bouton)).toBeVisible();
      await b.locator(bouton).focus(); await b.locator(bouton).press('Enter');
      await a.goto('/index.html', { waitUntil: 'domcontentloaded' });
      const premier = await a.evaluate(c => ({
        acquis: JSON.parse(localStorage.getItem(c) || '{}'),
        operations: STIProfil.listerOperationsQuiz('alice', c)
      }), cle);
      await b.goto('/index.html', { waitUntil: 'domcontentloaded' });
      const second = await b.evaluate(c => ({
        acquis: JSON.parse(localStorage.getItem(c) || '{}'),
        operations: STIProfil.listerOperationsQuiz('alice', c)
      }), cle);
      expect(premier.acquis.xp).toBeGreaterThan(0);
      expect(second.acquis.xp).toBe(premier.acquis.xp);
      expect(second.operations).toHaveLength(1);
      expect(second.operations[0].id).toBe(sauvegarde.etat_meta.partie_id);
      if (nom === 'html-css') {
        expect(second.acquis.xp).toBe(250);
        expect({ parties: second.acquis.parties, bonnes: second.acquis.bonnes, total: second.acquis.total })
          .toEqual({ parties: 1, bonnes: 1, total: 1 });
      }
    } finally { await ctx.close(); }
  });
}

test('ancienne session : identité stable entre appareils et aucune écriture sur une nouvelle partie', async ({ browser }) => {
  const contexts = await Promise.all(['alice', 'alice', 'bob'].map(async id => {
    const ctx = await browser.newContext(); await preparer(ctx, id); return ctx;
  }));
  try {
    const pages = await Promise.all(contexts.map(c => c.newPage()));
    for (const page of pages) await ouvrir(page, 'sql');
    const anciens = await Promise.all(pages.map((page, i) => page.evaluate(index => {
      const ancien = { quiz: 'sql', user_id: index === 2 ? 'bob' : 'alice', mode: 'classique',
        maj: index ? '2026-10-28T11:01:00.000Z' : '2026-10-28T11:00:00.000Z',
        ordre_questions: [{ id: 101, answers: ['a', 'b'] }, { id: 102, answers: ['b', 'a'] }], etat_meta: {} };
      const nouvelle = { quiz: 'sql', user_id: ancien.user_id, mode: 'classique',
        ordre_questions: [{ id: 999, answers: ['x', 'y'] }], etat_meta: { partie_id: STIQuizSync.creerIdentifiantPartie() } };
      localStorage.setItem('sti-quiz-sessions-actives-v1', JSON.stringify({ sql: nouvelle }));
      const id = STIQuizSync.identifierPartieReprise('sql', ancien);
      return { id, nouvelle: nouvelle.etat_meta.partie_id,
        locale: JSON.parse(localStorage.getItem('sti-quiz-sessions-actives-v1')).sql.etat_meta.partie_id };
    }, i)));
    expect(anciens[0].id).toBe(anciens[1].id);
    expect(anciens[2].id).not.toBe(anciens[0].id);
    for (const r of anciens) expect(r.locale).toBe(r.nouvelle);
  } finally { await Promise.all(contexts.map(c => c.close())); }
});

test('terminer une ancienne partie ne supprime pas localement la nouvelle partie du même quiz', async ({ browser }) => {
  const ctx = await browser.newContext(); await preparer(ctx, 'alice');
  try {
    const page = await ctx.newPage(); await ouvrir(page, 'html-css');
    const resultat = await page.evaluate(async () => {
      const ancien = STIQuizSync.creerIdentifiantPartie(), nouveau = STIQuizSync.creerIdentifiantPartie();
      localStorage.setItem('sti-quiz-sessions-actives-v1', JSON.stringify({ 'html-css': {
        quiz: 'html-css', user_id: 'alice', ordre_questions: [{ text: 'nouveau' }], etat_meta: { partie_id: nouveau }
      } }));
      await STIQuizSync.effacerSession('html-css', ancien);
      return { nouveau, stocke: JSON.parse(localStorage.getItem('sti-quiz-sessions-actives-v1'))['html-css'] };
    });
    expect(resultat.stocke.etat_meta.partie_id).toBe(resultat.nouveau);
  } finally { await ctx.close(); }
});
