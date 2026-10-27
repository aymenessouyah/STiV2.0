import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

/* Deux navigateurs et un cloud fictifs ; aucune donnée de candidat réel. */
const quiz = {
  'html-css': 'quizzora_xp_v1', javascript: 'sti-quiz-xp-js-v1', sql: 'sqlQuestV3', php: 'quizphp_v1_user'
};
const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS' };

function creerCloud() {
  const donnees = new Map();
  const etat = { rpcEnPanne: false, postsEnPanne: false, bloquerReponse: null, rpc: [], posts: 0 };
  const mergeXp = (avant, apres) => {
    const resultat = { ...avant, ...apres };
    for (const k of ['xp','best','parties','bonnes','total','level','streak','totalAnswered','totalCorrect','bestCombo','playgroundCount']) {
      if (typeof avant[k] === 'number' || typeof apres[k] === 'number') resultat[k] = Math.max(Number(avant[k]) || 0, Number(apres[k]) || 0);
    }
    if (typeof avant.best === 'object' || typeof apres.best === 'object') {
      resultat.best = { ...(avant.best || {}), ...(apres.best || {}) };
      for (const k of Object.keys(resultat.best)) resultat.best[k] = Math.max(Number(avant.best?.[k]) || 0, Number(apres.best?.[k]) || 0);
    }
    return resultat;
  };
  async function route(route) {
    const req = route.request(), u = new URL(req.url()), methode = req.method();
    if (methode === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    const utilisateur = (req.headers().authorization || '').replace(/^Bearer jeton-/, '');
    const repondre = (data, status = 200) => route.fulfill({ status, headers: cors, contentType: 'application/json', body: JSON.stringify(data) });
    if (u.pathname.endsWith('/rpc/sti_synchroniser_xp_quiz')) {
      const { p_cle, p_valeur } = req.postDataJSON();
      etat.rpc.push({ utilisateur, cle: p_cle, xp: p_valeur.xp });
      if (etat.rpcEnPanne) return repondre({ error: 'panne simulée' }, 503);
      const utilisateurCloud = donnees.get(utilisateur) || {};
      let avant = {};
      try { avant = JSON.parse(utilisateurCloud[p_cle] || '{}'); } catch {}
      const resultat = mergeXp(avant, p_valeur);
      utilisateurCloud[p_cle] = JSON.stringify(resultat);
      donnees.set(utilisateur, utilisateurCloud);
      if (etat.bloquerReponse) await etat.bloquerReponse;
      return repondre(resultat);
    }
    if (u.pathname.endsWith('/sti_progressions') && methode === 'GET') {
      const id = (u.searchParams.get('user_id') || '').replace(/^eq\./, '');
      const valeur = donnees.get(id);
      return repondre(valeur ? [{ donnees: valeur, maj: new Date().toISOString() }] : []);
    }
    if (u.pathname.endsWith('/sti_progressions') && methode === 'POST') {
      etat.posts++;
      if (etat.postsEnPanne) return repondre({ error: 'panne simulée' }, 503);
      const ligne = req.postDataJSON(), avant = donnees.get(ligne.user_id) || {}, nouveau = { ...avant, ...ligne.donnees };
      for (const cle of Object.values(quiz)) {
        try {
          const old = JSON.parse(avant[cle] || '{}'), next = JSON.parse(nouveau[cle] || '{}');
          if (avant[cle] || nouveau[cle]) nouveau[cle] = JSON.stringify(mergeXp(old, next));
        } catch {}
      }
      donnees.set(ligne.user_id, nouveau);
      return repondre([]);
    }
    return repondre([]);
  }
  return { donnees, etat, route };
}

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
    return {
      auth: {
        getUser: function () { var s = session(); return Promise.resolve({ data: { user: s && s.user } }); },
        getSession: function () { return Promise.resolve({ data: { session: session() } }); },
        onAuthStateChange: function () { return { data: { subscription: { unsubscribe: function () {} } } }; }
      },
      from: function () { return requete(); },
      rpc: function () { return Promise.resolve({ data: null, error: null }); }
    };
  } };
`;

async function preparer(context, cloud, { id = 'alice', email = '', acquis = null, ancien = null, sansProfil = false, limiterPull = false } = {}) {
  await context.route('**/sw.js*', route => route.abort());
  await context.route('https://*.supabase.co/**', cloud.route);
  await context.route('**/assets/js/supabase-umd.js*', route => route.fulfill({ contentType: 'text/javascript', body: sdkFictif }));
  if (sansProfil) await context.route('**/assets/js/profil.js*', route => route.fulfill({ contentType: 'text/javascript', body: '' }));
  // Exposer uniquement l'aperçu dans le harnais pour cliquer la bonne réponse.
  const source = await readFile(new URL('../quiz/html-css.html', import.meta.url), 'utf8');
  expect(source).toContain('var apercu = {');
  const instrumente = source.replace('var apercu = {', 'var apercu = window.__apercuTest = {');
  await context.route('**/quiz/html-css.html*', route => route.fulfill({ contentType: 'text/html; charset=utf-8', body: instrumente }));
  await context.addInitScript(({ id, email, acquis, ancien, limiterPull }) => {
    try {
      const session = { nativeAuthenticated: true, statut: 'actif', id, email: email || `${id}@example.invalid`, prenom: id, role: 'eleve', classe: '4SI 1' };
      window.__STI_NATIVE_AUTHENTICATED_V316 = true;
      sessionStorage.setItem('sti-native-session-v316', '1');
      sessionStorage.setItem('sti-session-cache', JSON.stringify(session));
      localStorage.setItem('sti-session-cache', JSON.stringify(session));
      localStorage.setItem('sti-demo-vu', '1');
      if (!sessionStorage.getItem('test-xp-initialise')) {
        sessionStorage.setItem('test-xp-initialise', '1');
        localStorage.setItem('sb-test-auth-token', JSON.stringify({ access_token: `jeton-${id}`, user: { id, email: session.email } }));
        if (ancien || acquis) localStorage.setItem('sti-sync-uid', ancien || id);
        if (acquis) for (const [cle, valeur] of Object.entries(acquis)) localStorage.setItem(cle, JSON.stringify(valeur));
        localStorage.setItem('sti-profil-abonne', JSON.stringify({ theme: 'clair', langue: 'ar', taille: 'grande' }));
        if (limiterPull) {
          sessionStorage.setItem('sti-sync-pull-uid', id);
          sessionStorage.setItem('sti-sync-pull-ts', String(Date.now()));
        }
      }
    } catch (e) { /* iframes sandbox */ }
  }, { id, email, acquis, ancien, limiterPull });
}

async function repondreCorrectement(page) {
  const reponse = await page.evaluate(() => {
    const a = window.__apercuTest, q = a.liste[a.i];
    return q.options[q.correct];
  });
  await page.locator('#heroOpts .opt-btn').filter({ has: page.locator('.opt-text', { hasText: reponse }) }).first().click();
}

test('aperçu HTML-CSS : panne des deux POST, reconnexion puis restauration sur un autre appareil', async ({ browser }) => {
  const cloud = creerCloud(); cloud.etat.rpcEnPanne = true; cloud.etat.postsEnPanne = true;
  const appareilA = await browser.newContext(), appareilB = await browser.newContext();
  try {
    await preparer(appareilA, cloud); await preparer(appareilB, cloud);
    const a = await appareilA.newPage(), b = await appareilB.newPage();
    await a.goto('/quiz/html-css.html', { waitUntil: 'domcontentloaded' });
    await expect(a.locator('#heroOpts button').first()).toBeVisible();
    await repondreCorrectement(a);
    await expect(a.locator('#heroScore')).toContainText('250 XP');
    await expect.poll(() => cloud.etat.rpc.some(r => r.xp === 250)).toBe(true);
    expect(cloud.donnees.get('alice')?.quizzora_xp_v1).toBeUndefined();
    // Départ avant le retour du réseau : la valeur reste locale, puis sera retentée.
    await a.goto('/index.html', { waitUntil: 'domcontentloaded' });
    cloud.etat.rpcEnPanne = false;
    await a.goto('/quiz/html-css.html', { waitUntil: 'domcontentloaded' });
    await expect.poll(() => JSON.parse(cloud.donnees.get('alice')?.quizzora_xp_v1 || '{}').xp).toBe(250);
    await b.goto('/quiz/html-css.html', { waitUntil: 'domcontentloaded' });
    await expect(b.locator('#heroScore')).toContainText('250 XP');
    expect(JSON.parse(await b.evaluate(() => localStorage.getItem('quizzora_xp_v1'))).xp).toBe(250);
    expect(cloud.etat.posts).toBeGreaterThan(0);
  } finally { await appareilA.close(); await appareilB.close(); }
});

test('un départ immédiat après une bonne réponse conserve les XP quand le réseau répond', async ({ browser }) => {
  const cloud = creerCloud(); cloud.etat.postsEnPanne = true;
  const ctx = await browser.newContext();
  try {
    await preparer(ctx, cloud);
    const page = await ctx.newPage(); await page.goto('/quiz/html-css.html', { waitUntil: 'domcontentloaded' });
    await expect.poll(() => cloud.etat.rpc.length).toBeGreaterThan(0);
    await page.evaluate(() => {
      const a = window.__apercuTest, q = a.liste[a.i], texte = q.options[q.correct];
      [...document.querySelectorAll('#heroOpts .opt-btn')].find(b => b.querySelector('.opt-text').textContent === texte).click();
      location.href = '../index.html#quiz';
    });
    await expect(page).toHaveURL(/\/index\.html#quiz$/);
    await expect.poll(() => JSON.parse(cloud.donnees.get('alice')?.quizzora_xp_v1 || '{}').xp).toBe(250);
  } finally { await ctx.close(); }
});

test('lecture XP malgré le pull général temporairement différé, pour les quatre quiz', async ({ browser }) => {
  const cloud = creerCloud();
  const valeurs = {
    quizzora_xp_v1: { xp: 1250, best: 3 }, 'sti-quiz-xp-js-v1': { xp: 820, best: 4 },
    sqlQuestV3: { xp: 620, level: 2, best: { select: 5 } }, quizphp_v1_user: { xp: 450, best: 3, streak: 1 }
  };
  cloud.donnees.set('alice', Object.fromEntries(Object.entries(valeurs).map(([k, v]) => [k, JSON.stringify(v)])));
  for (const [pageQuiz, cle] of Object.entries(quiz)) {
    const ctx = await browser.newContext();
    try {
      await preparer(ctx, cloud, { acquis: { [cle]: { xp: 10 } }, limiterPull: true });
      const page = await ctx.newPage(); await page.goto(`/quiz/${pageQuiz}.html`, { waitUntil: 'domcontentloaded' });
      await expect.poll(async () => JSON.parse(await page.evaluate(k => localStorage.getItem(k), cle) || '{}').xp, { message: pageQuiz }).toBe(valeurs[cle].xp);
      expect(cloud.etat.rpc.some(r => r.utilisateur === 'alice' && r.cle === cle)).toBe(true);
    } finally { await ctx.close(); }
  }
});

test('appareil partagé : les XP du premier compte ne sont jamais envoyés au second', async ({ browser }) => {
  const cloud = creerCloud(); cloud.etat.postsEnPanne = true;
  const ctx = await browser.newContext();
  try {
    await preparer(ctx, cloud, { id: 'bob', ancien: 'alice', acquis: { quizzora_xp_v1: { xp: 2750 } } });
    const page = await ctx.newPage(); await page.goto('/quiz/html-css.html', { waitUntil: 'domcontentloaded' });
    await expect.poll(() => cloud.etat.rpc.some(r => r.utilisateur === 'bob')).toBe(true);
    expect(cloud.etat.rpc.filter(r => r.utilisateur === 'bob').every(r => Number(r.xp) === 0)).toBe(true);
    expect(JSON.parse(cloud.donnees.get('bob').quizzora_xp_v1).xp).toBe(0);
    expect(await page.evaluate(() => localStorage.getItem('sti-sync-uid'))).toBe('bob');
  } finally { await ctx.close(); }
});

test('le compte partagé de laboratoire ne transmet pas les XP par la nouvelle RPC', async ({ browser }) => {
  const cloud = creerCloud(); cloud.etat.postsEnPanne = true;
  const ctx = await browser.newContext();
  try {
    await preparer(ctx, cloud, { id: 'labo', email: 'elevelabo3@exemple.tn', acquis: { quizzora_xp_v1: { xp: 250 } } });
    const page = await ctx.newPage(); await page.goto('/quiz/html-css.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#heroScore')).toContainText('250 XP');
    await page.evaluate(() => STIQuizSync.notifierXP('quizzora_xp_v1'));
    await page.waitForTimeout(250);
    expect(cloud.etat.rpc).toEqual([]);
  } finally { await ctx.close(); }
});

test('une réponse retardée du compte précédent ne se fusionne pas dans le nouveau', async ({ browser }) => {
  const cloud = creerCloud(); cloud.etat.postsEnPanne = true;
  let liberer;
  cloud.etat.bloquerReponse = new Promise(resolve => { liberer = resolve; });
  cloud.donnees.set('alice', { quizzora_xp_v1: JSON.stringify({ xp: 2000 }) });
  const ctx = await browser.newContext();
  try {
    await preparer(ctx, cloud, { id: 'alice', acquis: { quizzora_xp_v1: { xp: 1000 } } });
    const page = await ctx.newPage(); await page.goto('/quiz/html-css.html', { waitUntil: 'domcontentloaded' });
    await expect.poll(() => cloud.etat.rpc.length).toBeGreaterThan(0);
    await page.evaluate(() => {
      const user = { id: 'bob', email: 'bob@example.invalid' };
      localStorage.setItem('sb-test-auth-token', JSON.stringify({ access_token: 'jeton-bob', user }));
      localStorage.setItem('sti-sync-uid', 'bob');
      localStorage.setItem('quizzora_xp_v1', JSON.stringify({ xp: 123 }));
    });
    cloud.etat.bloquerReponse = null; liberer();
    await page.waitForTimeout(300);
    expect(JSON.parse(await page.evaluate(() => localStorage.getItem('quizzora_xp_v1'))).xp).toBe(123);
    expect(cloud.donnees.get('bob')).toBeUndefined();
  } finally { if (liberer) liberer(); await ctx.close(); }
});

test('les gains SQL, JavaScript et PHP déclenchent une sauvegarde dès la partie', async ({ browser }) => {
  const cloud = creerCloud(); cloud.etat.postsEnPanne = true;
  for (const nom of ['sql', 'javascript', 'php']) {
    const ctx = await browser.newContext();
    try {
      await preparer(ctx, cloud, { id: nom });
      const page = await ctx.newPage(); await page.goto(`/quiz/${nom}.html`, { waitUntil: 'domcontentloaded' });
      if (nom === 'sql') {
        await page.locator('#pseudoInput').fill('Test SQL');
        await page.locator('#onboardingModal button[onclick="saveProfile()"]').click();
      } else if (nom === 'javascript') {
        await page.locator('[onclick="game.start(\'arcade\')"]').click();
        const bonne = await page.evaluate(() => game.questions[game.currentQuestionIdx].answer);
        await page.locator('.option-btn').nth(bonne).click();
        await page.locator('button[onclick="game.endEarly()"]').click();
      } else {
        await page.locator('button[onclick="startQuiz()"]').first().click();
        const bonne = await page.evaluate(() => quiz.list[quiz.idx]._ans);
        await page.locator('#qOptions .opt-btn').nth(bonne).click();
        page.once('dialog', d => d.accept());
        await page.locator('#quizOverlay button[onclick="quitQuiz()"]').click();
      }
      await expect.poll(() => {
        const brut = cloud.donnees.get(nom)?.[quiz[nom]];
        return brut ? JSON.parse(brut).xp : 0;
      }, { message: nom }).toBeGreaterThan(0);
    } finally { await ctx.close(); }
  }
});

test('la passerelle de profil ne modifie pas le style historique des quiz', async ({ browser }) => {
  const cloud = creerCloud();
  for (const nom of Object.keys(quiz)) {
    const valeurs = [];
    for (const sansProfil of [true, false]) {
      const ctx = await browser.newContext();
      try {
        await preparer(ctx, cloud, { sansProfil });
        const page = await ctx.newPage(); await page.goto(`/quiz/${nom}.html`, { waitUntil: 'domcontentloaded' });
        valeurs.push(await page.evaluate(() => {
          const cs = getComputedStyle(document.body);
          return { theme: document.documentElement.getAttribute('data-theme'), lang: document.documentElement.lang, classes: document.body.className, fond: cs.backgroundColor, police: cs.fontFamily };
        }));
      } finally { await ctx.close(); }
    }
    expect(valeurs[1], nom).toEqual(valeurs[0]);
  }
});
