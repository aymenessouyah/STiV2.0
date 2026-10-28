import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

/* Deux navigateurs et un cloud fictifs ; aucune donnée de candidat réel. */
const quiz = {
  'html-css': 'quizzora_xp_v1', javascript: 'sti-quiz-xp-js-v1', sql: 'sqlQuestV3', php: 'quizphp_v1_user'
};
const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS' };

function creerCloud() {
  const donnees = new Map(), registres = new Map(), operations = new Map();
  const etat = { rpcEnPanne: false, postsEnPanne: false, bloquerReponse: null, perdreReponse: false, rpc: [], posts: 0 };
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
    if (u.pathname.endsWith('/rpc/sti_appliquer_gains_xp_quiz') || u.pathname.endsWith('/rpc/sti_appliquer_gain_partie_quiz')) {
      const { p_cle, p_valeur, p_partie_id, p_gain, p_operations } = req.postDataJSON();
      const cumulatif = Boolean(p_partie_id), lot = cumulatif ? [{ id: p_partie_id, gain: p_gain }] : p_operations;
      etat.rpc.push({ utilisateur, cle: p_cle, xp: p_valeur.xp, operations: lot, cumulatif });
      if (etat.rpcEnPanne) return repondre({ error: 'panne simulée' }, 503);
      const utilisateurCloud = donnees.get(utilisateur) || {};
      let avant = {};
      try { avant = JSON.parse(utilisateurCloud[p_cle] || '{}'); } catch {}
      const cleRegistre = utilisateur + ':' + p_cle;
      const registre = registres.get(cleRegistre) || { base: Math.max(Number(avant.xp) || 0, Number(p_valeur.xp) || 0), cumul: 0 };
      let applique = 0, gainConfirme = 0;
      for (const o of lot) {
        const id = utilisateur + ':' + o.id, precedent = operations.get(id);
        if (precedent && (precedent.cle !== p_cle || Boolean(precedent.cumulatif) !== cumulatif || (!cumulatif && precedent.gain !== o.gain))) {
          return repondre({ error: 'identifiant déjà utilisé' }, 400);
        }
        const ancien = precedent?.gain || 0, gain = cumulatif ? Math.max(ancien, o.gain) : o.gain;
        applique += gain - ancien; gainConfirme = gain;
        operations.set(id, { cle: p_cle, gain, cumulatif });
        registre.cumul += gain - ancien;
      }
      registres.set(cleRegistre, registre);
      const resultat = mergeXp(avant, { ...p_valeur, xp: registre.base + registre.cumul });
      delete resultat._sti_xp_attente;
      utilisateurCloud[p_cle] = JSON.stringify(resultat);
      donnees.set(utilisateur, utilisateurCloud);
      if (etat.bloquerReponse) await etat.bloquerReponse;
      if (etat.perdreReponse && lot.length) { etat.perdreReponse = false; return route.abort(); }
      return repondre({ valeur: resultat, confirmes: lot.map(o => o.id), ...(cumulatif ? { applique, gain_confirme: gainConfirme } : {}) });
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
      let protocole = {};
      try { protocole = JSON.parse(ligne.donnees['sti-xp-protocole-v487'] || '{}'); } catch {}
      const moderne = protocole.uid === ligne.user_id && protocole.version === 2;
      delete nouveau['sti-xp-protocole-v487'];
      for (const cle of Object.values(quiz)) {
        try {
          const old = JSON.parse(avant[cle] || '{}'), next = JSON.parse(nouveau[cle] || '{}');
          if (avant[cle] || nouveau[cle]) {
            const fusion = mergeXp(old, next), registre = registres.get(ligne.user_id + ':' + cle);
            const attente = Math.max(Number(next._sti_xp_attente) || 0, moderne ? Number(protocole.attentes?.[cle]) || 0 : 0);
            if (registre) {
              if (!moderne && !attente && (Number(fusion.xp) || 0) > Math.max(Number(old.xp) || 0, registre.base + registre.cumul)) {
                registre.base += fusion.xp - Math.max(Number(old.xp) || 0, registre.base + registre.cumul);
              }
              fusion.xp = Math.max(Number(old.xp) || 0, registre.base + registre.cumul);
            } else if (attente) fusion.xp = Math.max(Number(old.xp) || 0, (Number(fusion.xp) || 0) - attente);
            delete fusion._sti_xp_attente;
            nouveau[cle] = JSON.stringify(fusion);
          }
        } catch {}
      }
      donnees.set(ligne.user_id, nouveau);
      return repondre([]);
    }
    return repondre([]);
  }
  return { donnees, etat, route, operations };
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
  const instrumente = source.replace('var apercu = {', 'var apercu = window.__apercuTest = {')
    .replace('function nouvellePartie() {', 'window.__testHc = { lancer: lancerPartie, etat: state }; function nouvellePartie() {');
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
  await page.locator('#heroOpts .opt-btn').filter({ has: page.getByText(reponse, { exact: true }) }).first().click();
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
    await expect.poll(() => cloud.etat.rpc.some(r => r.operations.some(o => o.gain === 250))).toBe(true);
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

test('deux appareils cumulent leurs gains HTML-CSS réalisés hors ligne', async ({ browser }) => {
  const cloud = creerCloud(); cloud.etat.postsEnPanne = true;
  cloud.donnees.set('alice', { quizzora_xp_v1: JSON.stringify({ xp: 1000 }) });
  const ctxA = await browser.newContext(), ctxB = await browser.newContext();
  try {
    await preparer(ctxA, cloud); await preparer(ctxB, cloud);
    const a = await ctxA.newPage(), b = await ctxB.newPage();
    await Promise.all([a.goto('/quiz/html-css.html'), b.goto('/quiz/html-css.html')]);
    await expect(a.locator('#heroScore')).toContainText('1 000 XP');
    await expect(b.locator('#heroScore')).toContainText('1 000 XP');
    cloud.etat.rpcEnPanne = true;
    await Promise.all([repondreCorrectement(a), repondreCorrectement(b)]);
    await expect(a.locator('#heroScore')).toContainText('1 250 XP');
    await expect(b.locator('#heroScore')).toContainText('1 250 XP');
    cloud.etat.rpcEnPanne = false;
    await Promise.all([a.evaluate(() => dispatchEvent(new Event('online'))), b.evaluate(() => dispatchEvent(new Event('online')))]);
    await expect.poll(() => JSON.parse(cloud.donnees.get('alice').quizzora_xp_v1).xp, { timeout: 10_000 }).toBe(1500);
  } finally { await ctxA.close(); await ctxB.close(); }
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

test('une réponse réseau perdue est retentée sans créditer deux fois le même gain', async ({ browser }) => {
  const cloud = creerCloud(); cloud.etat.postsEnPanne = true;
  cloud.donnees.set('alice', { quizzora_xp_v1: JSON.stringify({ xp: 1000 }) });
  const ctx = await browser.newContext();
  try {
    await preparer(ctx, cloud);
    const page = await ctx.newPage(); await page.goto('/quiz/html-css.html');
    await expect(page.locator('#heroScore')).toContainText('1 000 XP');
    await expect.poll(() => cloud.etat.rpc.length).toBeGreaterThan(0);
    cloud.etat.perdreReponse = true;
    await repondreCorrectement(page);
    await expect.poll(() => JSON.parse(cloud.donnees.get('alice').quizzora_xp_v1).xp).toBe(1250);
    await expect.poll(() => cloud.etat.rpc.filter(r => r.operations.length).length, { timeout: 15_000 }).toBeGreaterThanOrEqual(2);
    await expect.poll(() => page.evaluate(() => STIProfil.listerOperationsQuiz('alice', 'quizzora_xp_v1').length)).toBe(0);
    expect(JSON.parse(cloud.donnees.get('alice').quizzora_xp_v1).xp).toBe(1250);
  } finally { await ctx.close(); }
});

test('un gain survit au départ du quiz et se synchronise à la reconnexion sur l’accueil', async ({ browser }) => {
  const cloud = creerCloud(); cloud.etat.rpcEnPanne = true; cloud.etat.postsEnPanne = true;
  const ctx = await browser.newContext();
  try {
    await preparer(ctx, cloud);
    const page = await ctx.newPage(); await page.goto('/quiz/html-css.html');
    await repondreCorrectement(page);
    await expect.poll(() => page.evaluate(() => STIProfil.listerOperationsQuiz('alice', 'quizzora_xp_v1').length)).toBe(1);
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
    await expect.poll(() => page.evaluate(() => !!window.STIQuizSync)).toBe(true);
    cloud.etat.rpcEnPanne = false;
    await page.evaluate(() => dispatchEvent(new Event('online')));
    await expect.poll(() => JSON.parse(cloud.donnees.get('alice')?.quizzora_xp_v1 || '{}').xp, { timeout: 15_000 }).toBe(250);
    await expect.poll(() => page.evaluate(() => STIProfil.listerOperationsQuiz('alice', 'quizzora_xp_v1').length)).toBe(0);
  } finally { await ctx.close(); }
});

test('les POST généraux envoyés avant la première RPC ne doublent pas les gains provisoires', async ({ browser }) => {
  const cloud = creerCloud(); cloud.etat.rpcEnPanne = true; cloud.etat.postsEnPanne = true;
  cloud.donnees.set('alice', { quizzora_xp_v1: JSON.stringify({ xp: 1000 }) });
  const ctxA = await browser.newContext(), ctxB = await browser.newContext();
  try {
    for (const ctx of [ctxA, ctxB]) await preparer(ctx, cloud, { acquis: { quizzora_xp_v1: { xp: 1000 } } });
    const a = await ctxA.newPage(), b = await ctxB.newPage();
    await Promise.all([a.goto('/quiz/html-css.html'), b.goto('/quiz/html-css.html')]);
    await Promise.all([repondreCorrectement(a), repondreCorrectement(b)]);
    for (const page of [a, b]) {
      const local = JSON.parse(await page.evaluate(() => localStorage.getItem('quizzora_xp_v1')));
      expect(local.xp).toBe(1250); expect(local._sti_xp_attente).toBe(250);
    }
    cloud.etat.postsEnPanne = false;
    await Promise.all([a.evaluate(() => dispatchEvent(new Event('pagehide'))), b.evaluate(() => dispatchEvent(new Event('pagehide')))]);
    await expect.poll(() => cloud.etat.posts).toBeGreaterThanOrEqual(2);
    expect(JSON.parse(cloud.donnees.get('alice').quizzora_xp_v1).xp).toBe(1000);
    cloud.etat.rpcEnPanne = false;
    await Promise.all([a.evaluate(() => dispatchEvent(new Event('online'))), b.evaluate(() => dispatchEvent(new Event('online')))]);
    await expect.poll(() => JSON.parse(cloud.donnees.get('alice').quizzora_xp_v1).xp, { timeout: 15_000 }).toBe(1500);
  } finally { await ctxA.close(); await ctxB.close(); }
});

test('deux onglets du même navigateur conservent deux opérations distinctes', async ({ browser }) => {
  const cloud = creerCloud(); cloud.etat.postsEnPanne = true;
  cloud.donnees.set('alice', { quizzora_xp_v1: JSON.stringify({ xp: 1000 }) });
  const ctx = await browser.newContext();
  try {
    await preparer(ctx, cloud);
    const a = await ctx.newPage(), b = await ctx.newPage();
    await Promise.all([a.goto('/quiz/html-css.html'), b.goto('/quiz/html-css.html')]);
    await expect(a.locator('#heroScore')).toContainText('1 000 XP');
    await expect(b.locator('#heroScore')).toContainText('1 000 XP');
    cloud.etat.rpcEnPanne = true;
    await Promise.all([repondreCorrectement(a), repondreCorrectement(b)]);
    await expect.poll(() => a.evaluate(() => STIProfil.listerOperationsQuiz('alice', 'quizzora_xp_v1').length)).toBe(2);
    cloud.etat.rpcEnPanne = false;
    await Promise.all([a.evaluate(() => dispatchEvent(new Event('online'))), b.evaluate(() => dispatchEvent(new Event('online')))]);
    await expect.poll(() => JSON.parse(cloud.donnees.get('alice').quizzora_xp_v1).xp, { timeout: 15_000 }).toBe(1500);
    await expect.poll(() => a.evaluate(() => STIProfil.listerOperationsQuiz('alice', 'quizzora_xp_v1').length)).toBe(0);
  } finally { await ctx.close(); }
});

test('JavaScript, SQL et PHP additionnent aussi les gains de deux appareils hors ligne', async ({ browser }) => {
  test.setTimeout(180_000);
  for (const nom of ['javascript', 'sql', 'php']) {
    const cloud = creerCloud(); cloud.etat.postsEnPanne = true;
    const cle = quiz[nom];
    const ancien = nom === 'sql' ? { xp: 1000, level: 2, pseudo: 'Apprenti SQL', profileSet: false, best: {} } : { xp: 1000 };
    cloud.donnees.set('alice', { [cle]: JSON.stringify(ancien) });
    const ctxA = await browser.newContext(), ctxB = await browser.newContext();
    try {
      await preparer(ctxA, cloud); await preparer(ctxB, cloud);
      const a = await ctxA.newPage(), b = await ctxB.newPage();
      await Promise.all([a.goto(`/quiz/${nom}.html`), b.goto(`/quiz/${nom}.html`)]);
      for (const page of [a, b]) await expect.poll(async () => JSON.parse(await page.evaluate(k => localStorage.getItem(k), cle) || '{}').xp, { message: nom }).toBe(1000);
      await expect.poll(() => cloud.etat.rpc.filter(r => r.cle === cle).length).toBeGreaterThanOrEqual(2);
      cloud.etat.rpcEnPanne = true;
      async function gagner(page) {
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
      }
      await Promise.all([gagner(a), gagner(b)]);
      let somme = 0;
      for (const page of [a, b]) {
        await expect.poll(() => page.evaluate(k => STIProfil.listerOperationsQuiz('alice', k).length, cle), { message: nom }).toBeGreaterThan(0);
        const gains = await page.evaluate(k => STIProfil.listerOperationsQuiz('alice', k).map(o => o.gain), cle);
        somme += gains.reduce((x, y) => x + y, 0);
      }
      expect(somme, nom).toBeGreaterThan(0);
      cloud.etat.rpcEnPanne = false;
      await Promise.all([a.evaluate(() => dispatchEvent(new Event('online'))), b.evaluate(() => dispatchEvent(new Event('online')))]);
      await expect.poll(() => JSON.parse(cloud.donnees.get('alice')[cle]).xp, { timeout: 20_000, message: nom }).toBe(1000 + somme);
      for (const page of [a, b]) await expect.poll(() => page.evaluate(k => STIProfil.listerOperationsQuiz('alice', k).length, cle), { message: nom }).toBe(0);
    } finally { await ctxA.close(); await ctxB.close(); }
  }
});

/* Coupure réseau Chromium réelle ; les réponses cloud restent simulées et isolées. */
for (const nom of Object.keys(quiz)) {
  test(`coupure puis reconnexion automatique : deux appareils et deux comptes (${nom})`, async ({ browser }) => {
    test.setTimeout(120_000);
    const cloud = creerCloud(); cloud.etat.postsEnPanne = true;
    const cle = quiz[nom];
    const valeur = xp => nom === 'sql' ? { xp, level: 2, pseudo: 'Apprenti SQL', profileSet: false, best: {} } : { xp };
    cloud.donnees.set('alice', { [cle]: JSON.stringify(valeur(1000)) });
    cloud.donnees.set('bob', { [cle]: JSON.stringify(valeur(400)) });
    const contextes = [await browser.newContext(), await browser.newContext(), await browser.newContext()];
    try {
      await preparer(contextes[0], cloud); await preparer(contextes[1], cloud);
      await preparer(contextes[2], cloud, { id: 'bob' });
      const pages = await Promise.all(contextes.map(c => c.newPage()));
      await Promise.all(pages.map(p => p.goto(`/quiz/${nom}.html`, { waitUntil: 'domcontentloaded' })));
      for (const [i, page] of pages.entries()) {
        await expect.poll(async () => JSON.parse(await page.evaluate(k => localStorage.getItem(k), cle) || '{}').xp).toBe(i === 2 ? 400 : 1000);
      }
      await expect.poll(() => cloud.etat.rpc.filter(r => r.cle === cle).length).toBeGreaterThanOrEqual(3);
      cloud.etat.rpcEnPanne = true;
      await Promise.all(contextes.map(c => c.setOffline(true)));
      for (const page of pages) expect(await page.evaluate(() => navigator.onLine)).toBe(false);

      async function gagner(page) {
        if (nom === 'html-css') return repondreCorrectement(page);
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
      }
      await Promise.all(pages.map(gagner));
      const files = [];
      for (const [i, page] of pages.entries()) {
        const uid = i === 2 ? 'bob' : 'alice';
        await expect.poll(() => page.evaluate(({ uid, cle }) => STIProfil.listerOperationsQuiz(uid, cle).length, { uid, cle })).toBeGreaterThan(0);
        files.push(await page.evaluate(({ uid, cle }) => STIProfil.listerOperationsQuiz(uid, cle), { uid, cle }));
      }
      const ids = files.flat().map(op => op.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(JSON.parse(cloud.donnees.get('alice')[cle]).xp).toBe(1000);
      expect(JSON.parse(cloud.donnees.get('bob')[cle]).xp).toBe(400);
      const somme = file => file.reduce((total, op) => total + op.gain, 0);
      cloud.etat.rpcEnPanne = false;
      cloud.etat.perdreReponse = true; // Le serveur applique un gain, mais l'accusé est perdu.
      // Aucun événement online artificiel : Chromium le déclenche à la reconnexion.
      await Promise.all([contextes[0].setOffline(false), contextes[1].setOffline(false)]);
      await expect.poll(() => JSON.parse(cloud.donnees.get('alice')[cle]).xp, { timeout: 20_000 }).toBe(1000 + somme(files[0]) + somme(files[1]));
      expect(JSON.parse(cloud.donnees.get('bob')[cle]).xp).toBe(400);
      await contextes[2].setOffline(false);
      await expect.poll(() => JSON.parse(cloud.donnees.get('bob')[cle]).xp, { timeout: 20_000 }).toBe(400 + somme(files[2]));
      for (const [i, page] of pages.entries()) {
        const uid = i === 2 ? 'bob' : 'alice';
        await expect.poll(() => page.evaluate(({ uid, cle }) => STIProfil.listerOperationsQuiz(uid, cle).length, { uid, cle }), { timeout: 20_000 }).toBe(0);
      }
      expect(cloud.operations.size).toBe(ids.length);
      await Promise.all(pages.map(p => p.evaluate(() => dispatchEvent(new Event('online')))));
      await expect.poll(() => JSON.parse(cloud.donnees.get('alice')[cle]).xp).toBe(1000 + somme(files[0]) + somme(files[1]));
      expect(JSON.parse(cloud.donnees.get('bob')[cle]).xp).toBe(400 + somme(files[2]));
      expect(cloud.operations.size).toBe(ids.length);
    } finally {
      await Promise.all(contextes.map(c => c.close()));
    }
  });
}

test('un gain hors ligne reste associé au bon compte après une connexion partagée', async ({ browser }) => {
  const cloud = creerCloud(); cloud.etat.rpcEnPanne = true; cloud.etat.postsEnPanne = true;
  const ctx = await browser.newContext();
  try {
    await preparer(ctx, cloud);
    const page = await ctx.newPage(); await page.goto('/quiz/html-css.html');
    await repondreCorrectement(page);
    await expect.poll(() => page.evaluate(() => STIProfil.listerOperationsQuiz('alice', 'quizzora_xp_v1').length)).toBe(1);
    await page.evaluate(() => localStorage.setItem('sb-test-auth-token', JSON.stringify({ access_token: 'jeton-bob', user: { id: 'bob', email: 'bob@example.invalid' } })));
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
    await expect.poll(() => page.evaluate(() => localStorage.getItem('sti-sync-uid'))).toBe('bob');
    cloud.etat.rpcEnPanne = false;
    await page.goto('/quiz/html-css.html');
    await expect.poll(() => cloud.etat.rpc.some(r => r.utilisateur === 'bob')).toBe(true);
    expect(cloud.etat.rpc.filter(r => r.utilisateur === 'bob').every(r => r.operations.length === 0)).toBe(true);
    await page.evaluate(() => localStorage.setItem('sb-test-auth-token', JSON.stringify({ access_token: 'jeton-alice', user: { id: 'alice', email: 'alice@example.invalid' } })));
    await page.goto('/quiz/html-css.html');
    await expect.poll(() => JSON.parse(cloud.donnees.get('alice')?.quizzora_xp_v1 || '{}').xp, { timeout: 15_000 }).toBe(250);
    expect(JSON.parse(cloud.donnees.get('bob').quizzora_xp_v1).xp).toBe(0);
  } finally { await ctx.close(); }
});

test('une connexion tardive retrouve automatiquement la file du bon compte sur l’accueil', async ({ browser }) => {
  const cloud = creerCloud(); cloud.etat.rpcEnPanne = true; cloud.etat.postsEnPanne = true;
  const ctx = await browser.newContext();
  try {
    await preparer(ctx, cloud);
    const page = await ctx.newPage(); await page.goto('/quiz/html-css.html');
    await repondreCorrectement(page);
    await expect.poll(() => page.evaluate(() => STIProfil.listerOperationsQuiz('alice', 'quizzora_xp_v1').length)).toBe(1);
    await page.evaluate(() => localStorage.setItem('sb-test-auth-token', JSON.stringify({ access_token: 'jeton-bob', user: { id: 'bob', email: 'bob@example.invalid' } })));
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
    await expect.poll(() => page.evaluate(() => localStorage.getItem('sti-sync-uid'))).toBe('bob');
    expect(await page.evaluate(() => Boolean(window.STIQuizSync))).toBe(false);
    cloud.etat.rpcEnPanne = false;
    await page.evaluate(() => localStorage.setItem('sb-test-auth-token', JSON.stringify({ access_token: 'jeton-alice', user: { id: 'alice', email: 'alice@example.invalid' } })));
    // Le synchroniseur historique détecte le compte après le chargement ; aucun
    // événement online ni nouvelle navigation ne doit être nécessaire.
    await expect.poll(() => JSON.parse(cloud.donnees.get('alice')?.quizzora_xp_v1 || '{}').xp, { timeout: 30_000 }).toBe(250);
    await expect.poll(() => page.evaluate(() => STIProfil.listerOperationsQuiz('alice', 'quizzora_xp_v1').length)).toBe(0);
    expect(cloud.etat.rpc.some(r => r.utilisateur === 'bob' && r.operations.length)).toBe(false);
  } finally { await ctx.close(); }
});

test('un nouveau gain ajouté pendant une réponse retardée est conservé', async ({ browser }) => {
  const cloud = creerCloud(); cloud.etat.postsEnPanne = true;
  const ctx = await browser.newContext(); let liberer;
  try {
    await preparer(ctx, cloud);
    const page = await ctx.newPage(); await page.goto('/quiz/html-css.html');
    await expect.poll(() => cloud.etat.rpc.length).toBeGreaterThan(0);
    cloud.etat.bloquerReponse = new Promise(resolve => { liberer = resolve; });
    await repondreCorrectement(page);
    await expect.poll(() => JSON.parse(cloud.donnees.get('alice')?.quizzora_xp_v1 || '{}').xp).toBe(250);
    await page.waitForTimeout(1700);
    await repondreCorrectement(page);
    await expect.poll(() => page.evaluate(() => STIProfil.listerOperationsQuiz('alice', 'quizzora_xp_v1').length)).toBe(2);
    cloud.etat.bloquerReponse = null; liberer();
    await expect.poll(() => JSON.parse(cloud.donnees.get('alice').quizzora_xp_v1).xp, { timeout: 15_000 }).toBe(500);
    await expect.poll(() => page.evaluate(() => STIProfil.listerOperationsQuiz('alice', 'quizzora_xp_v1').length)).toBe(0);
  } finally { if (liberer) liberer(); await ctx.close(); }
});

test('une file de plus de cent gains est vidée par lots sans pertes ni doublons', async ({ browser }) => {
  const cloud = creerCloud(); cloud.etat.postsEnPanne = true;
  const ctx = await browser.newContext();
  try {
    await preparer(ctx, cloud);
    const page = await ctx.newPage(); await page.goto('/quiz/html-css.html');
    await expect.poll(() => cloud.etat.rpc.length).toBeGreaterThan(0);
    cloud.etat.rpcEnPanne = true;
    const resultat = await page.evaluate(() => {
      for (let i = 0; i < 205; i++) {
        const x = STIProfil.lireAcquisQuiz('quizzora_xp_v1', 'alice');
        if (!STIQuizSync.sauverXP('quizzora_xp_v1', { ...x, xp: (x.xp || 0) + 1 }, 1)) return false;
      }
      STIQuizSync.notifierXP('quizzora_xp_v1');
      return STIProfil.listerOperationsQuiz('alice', 'quizzora_xp_v1').length;
    });
    expect(resultat).toBe(205);
    cloud.etat.rpcEnPanne = false;
    await page.evaluate(() => dispatchEvent(new Event('online')));
    await expect.poll(() => JSON.parse(cloud.donnees.get('alice')?.quizzora_xp_v1 || '{}').xp, { timeout: 20_000 }).toBe(205);
    await expect.poll(() => page.evaluate(() => STIProfil.listerOperationsQuiz('alice', 'quizzora_xp_v1').length)).toBe(0);
    expect(cloud.etat.rpc.filter(r => r.operations.length > 0).every(r => r.operations.length <= 100)).toBe(true);
  } finally { await ctx.close(); }
});

/* Une même identité traverse les appareils : ce sont des RPC et comptes
   fictifs, mais les mécanismes de stockage et de synchronisation sont réels. */
const idPartieTest = 'f415964f-9909-4326-8ea3-4331a8e3fd31';
async function gainDePartie(page, gain, bonnes, total, id = idPartieTest) {
  return page.evaluate(({ gain, bonnes, total, id }) => {
    const cle = 'quizzora_xp_v1', acquis = STIProfil.lireAcquisQuiz(cle, 'alice');
    const ok = STIQuizSync.sauverXP(cle, { ...acquis, xp: (Number(acquis.xp) || 0) + gain }, gain, { id, bonnes, total });
    STIQuizSync.notifierXP(cle);
    return ok;
  }, { gain, bonnes, total, id });
}
async function xpLocal(page) {
  return page.evaluate(() => Number(JSON.parse(localStorage.getItem('quizzora_xp_v1') || '{}').xp) || 0);
}

test('même partie sur deux appareils : une seule opération cumulée et correction du gain déjà synchronisé', async ({ browser }) => {
  const cloud = creerCloud(); cloud.etat.postsEnPanne = true;
  cloud.donnees.set('alice', { quizzora_xp_v1: JSON.stringify({ xp: 1000 }) });
  const ctxA = await browser.newContext(), ctxB = await browser.newContext();
  try {
    await preparer(ctxA, cloud); await preparer(ctxB, cloud);
    const a = await ctxA.newPage(), b = await ctxB.newPage();
    await Promise.all([a.goto('/quiz/html-css.html'), b.goto('/quiz/html-css.html')]);
    for (const page of [a, b]) await expect.poll(() => xpLocal(page)).toBe(1000);
    expect(await gainDePartie(a, 250, 1, 1)).toBe(true);
    await expect.poll(() => JSON.parse(cloud.donnees.get('alice').quizzora_xp_v1).xp).toBe(1250);
    await expect.poll(() => a.evaluate(() => STIProfil.listerOperationsQuiz('alice', 'quizzora_xp_v1').length)).toBe(0);
    // L'autre appareil a déjà récupéré 1250 XP, mais ne connaît pas le marqueur local de la partie.
    await b.evaluate(() => STIProfil.ecrireAcquisQuiz('quizzora_xp_v1', 'alice', { xp: 1250 }));
    cloud.etat.rpcEnPanne = true;
    expect(await gainDePartie(b, 250, 1, 1)).toBe(true);
    expect(await xpLocal(b)).toBe(1500);
    cloud.etat.rpcEnPanne = false;
    await b.evaluate(() => dispatchEvent(new Event('online')));
    await expect.poll(() => b.evaluate(() => STIProfil.listerOperationsQuiz('alice', 'quizzora_xp_v1').length)).toBe(0);
    expect(await xpLocal(b)).toBe(1250);
    expect(JSON.parse(cloud.donnees.get('alice').quizzora_xp_v1).xp).toBe(1250);
    expect(cloud.operations.get('alice:' + idPartieTest).gain).toBe(250);
  } finally { await ctxA.close(); await ctxB.close(); }
});

test('partie partielle, réponse perdue puis reprise plus avancée : le supplément est crédité une fois', async ({ browser }) => {
  const cloud = creerCloud(); cloud.etat.postsEnPanne = true;
  cloud.donnees.set('alice', { quizzora_xp_v1: JSON.stringify({ xp: 1000 }) });
  const ctx = await browser.newContext();
  try {
    await preparer(ctx, cloud);
    const page = await ctx.newPage(); await page.goto('/quiz/html-css.html');
    await expect.poll(() => xpLocal(page)).toBe(1000);
    await expect.poll(() => cloud.etat.rpc.length).toBeGreaterThan(0);
    cloud.etat.perdreReponse = true;
    expect(await gainDePartie(page, 250, 1, 1)).toBe(true);
    await expect.poll(() => JSON.parse(cloud.donnees.get('alice').quizzora_xp_v1).xp).toBe(1250);
    cloud.etat.rpcEnPanne = true;
    expect(await gainDePartie(page, 500, 2, 2)).toBe(true);
    expect(await xpLocal(page)).toBe(1500);
    const file = await page.evaluate(() => STIProfil.listerOperationsQuiz('alice', 'quizzora_xp_v1'));
    expect(file).toHaveLength(1); expect(file[0].gain).toBe(500); expect(file[0].attente).toBe(500);
    cloud.etat.rpcEnPanne = false;
    await page.evaluate(() => dispatchEvent(new Event('online')));
    await expect.poll(() => JSON.parse(cloud.donnees.get('alice').quizzora_xp_v1).xp, { timeout: 15000 }).toBe(1500);
    await expect.poll(() => page.evaluate(() => STIProfil.listerOperationsQuiz('alice', 'quizzora_xp_v1').length)).toBe(0);
    expect(await xpLocal(page)).toBe(1500);
    const acquis = await page.evaluate(() => STIProfil.lireAcquisQuiz('quizzora_xp_v1', 'alice'));
    expect({ parties: acquis.parties, bonnes: acquis.bonnes, total: acquis.total }).toEqual({ parties: 1, bonnes: 2, total: 2 });
  } finally { await ctx.close(); }
});

test('supplément ajouté en vol après un doublon : le gain en attente reste visible hors ligne', async ({ browser }) => {
  const cloud = creerCloud(); cloud.etat.postsEnPanne = true;
  cloud.donnees.set('alice', { quizzora_xp_v1: JSON.stringify({ xp: 1000 }) });
  const ctxA = await browser.newContext(), ctxB = await browser.newContext(); let liberer;
  try {
    await preparer(ctxA, cloud); await preparer(ctxB, cloud);
    const a = await ctxA.newPage(), b = await ctxB.newPage();
    await Promise.all([a.goto('/quiz/html-css.html'), b.goto('/quiz/html-css.html')]);
    for (const page of [a, b]) await expect.poll(() => xpLocal(page)).toBe(1000);
    expect(await gainDePartie(a, 250, 1, 1)).toBe(true);
    await expect.poll(() => JSON.parse(cloud.donnees.get('alice').quizzora_xp_v1).xp).toBe(1250);
    await expect.poll(() => a.evaluate(() => STIProfil.listerOperationsQuiz('alice', 'quizzora_xp_v1').length)).toBe(0);
    await b.evaluate(() => STIProfil.ecrireAcquisQuiz('quizzora_xp_v1', 'alice', { xp: 1250 }));
    cloud.etat.bloquerReponse = new Promise(resolve => { liberer = resolve; });
    expect(await gainDePartie(b, 250, 1, 1)).toBe(true);
    await expect.poll(() => cloud.etat.rpc.some(r => r.cumulatif && r.operations[0].id === idPartieTest && r.utilisateur === 'alice' && r.xp >= 1250)).toBe(true);
    expect(await gainDePartie(b, 500, 2, 2)).toBe(true);
    cloud.etat.rpcEnPanne = true;
    cloud.etat.bloquerReponse = null; liberer(); liberer = null;
    await expect.poll(() => b.evaluate(() => STIProfil.listerOperationsQuiz('alice', 'quizzora_xp_v1')[0]?.attente)).toBe(250);
    expect(await xpLocal(b)).toBe(1500);
    cloud.etat.rpcEnPanne = false;
    await b.evaluate(() => dispatchEvent(new Event('online')));
    await expect.poll(() => JSON.parse(cloud.donnees.get('alice').quizzora_xp_v1).xp, { timeout: 15000 }).toBe(1500);
    await expect.poll(() => b.evaluate(() => STIProfil.listerOperationsQuiz('alice', 'quizzora_xp_v1').length)).toBe(0);
    expect(await xpLocal(b)).toBe(1500);
  } finally { if (liberer) liberer(); await ctxA.close(); await ctxB.close(); }
});

for (const nom of Object.keys(quiz)) {
  test(`${nom} : reprise sur deux appareils, correction XP et affichage du compteur`, async ({ browser }) => {
    const cloud = creerCloud(); cloud.etat.postsEnPanne = true;
    const cle = quiz[nom], initial = nom === 'sql' ? { xp: 1000, level: 2, profileSet: true, pseudo: 'Alice', best: {} } : { xp: 1000 };
    cloud.donnees.set('alice', { [cle]: JSON.stringify(initial) });
    const ctxA = await browser.newContext(), ctxB = await browser.newContext();
    try {
      await preparer(ctxA, cloud, { acquis: { [cle]: initial } });
      await preparer(ctxB, cloud, { acquis: { [cle]: initial } });
      const a = await ctxA.newPage();
      await a.goto(`/quiz/${nom}.html`);
      await expect.poll(() => a.evaluate(c => JSON.parse(localStorage.getItem(c) || '{}').xp, cle)).toBe(1000);
      await a.evaluate(n => {
        if (n === 'html-css') window.__testHc.lancer();
        else if (n === 'javascript') game.start('arcade');
        else if (n === 'sql') startQuiz('classique');
        else startQuiz();
      }, nom);
      const bonne = await a.evaluate(n => n === 'html-css' ? window.__testHc.etat.session[0].options.findIndex(o => o.ok) :
        n === 'javascript' ? game.questions[0].answer : n === 'sql' ? Q.questions[0].correct : quiz.list[0]._ans, nom);
      const choix = { 'html-css': '#qOptions button', javascript: '#options-grid .option-btn', sql: '#answersGrid button', php: '#qOptions button' };
      await a.locator(choix[nom]).nth(bonne).click();
      await expect.poll(() => a.evaluate(n => JSON.parse(localStorage.getItem('sti-quiz-sessions-actives-v1') || '{}')[n]?.index_courant, nom)).toBe(1);
      const session = await a.evaluate(n => JSON.parse(localStorage.getItem('sti-quiz-sessions-actives-v1'))[n], nom);
      await ctxB.addInitScript(({ n, s }) => {
        localStorage.setItem('sti-quiz-sessions-actives-v1', JSON.stringify({ [n]: s }));
        localStorage.removeItem('sti-quiz-sessions-purge-v1');
      }, { n: nom, s: session });
      const b = await ctxB.newPage(); await b.goto(`/quiz/${nom}.html`);
      const boutons = { 'html-css': '#hcResumeBtn', javascript: '#js-resume-cloud-btn', sql: '#sqlResumeCloudBtn', php: '#phpResumeCloudBtn' };
      await expect(b.locator(boutons[nom])).toBeVisible();
      await b.locator(boutons[nom]).focus(); await b.locator(boutons[nom]).press('Enter');
      await a.evaluate(() => dispatchEvent(new Event('pagehide')));
      await expect.poll(() => cloud.operations.get('alice:' + session.etat_meta.partie_id)?.gain).toBeGreaterThan(0);
      const gain = cloud.operations.get('alice:' + session.etat_meta.partie_id).gain;
      await expect.poll(() => JSON.parse(cloud.donnees.get('alice')[cle]).xp).toBe(1000 + gain);
      // Le second appareil a déjà récupéré le total cloud, sans son marqueur de partie local.
      await b.evaluate(({ cle, gain }) => {
        const acquis = STIProfil.lireAcquisQuiz(cle, 'alice');
        STIProfil.ecrireAcquisQuiz(cle, 'alice', { ...acquis, xp: 1000 + gain });
      }, { cle, gain });
      await b.evaluate(() => dispatchEvent(new Event('pagehide')));
      await expect.poll(() => b.evaluate(c => STIProfil.listerOperationsQuiz('alice', c).length, cle), { timeout: 15000 }).toBe(0);
      expect(JSON.parse(cloud.donnees.get('alice')[cle]).xp).toBe(1000 + gain);
      expect(await b.evaluate(c => JSON.parse(localStorage.getItem(c) || '{}').xp, cle)).toBe(1000 + gain);
      const affiche = await b.evaluate(n => n === 'html-css' ? document.querySelector('#heroScore').textContent :
        n === 'javascript' ? game.stats.xp : n === 'sql' ? S.xp : user.xp, nom);
      if (nom === 'html-css') expect(affiche).toContain((1000 + gain).toLocaleString('fr-FR'));
      else expect(affiche).toBe(1000 + gain);
    } finally { await ctxA.close(); await ctxB.close(); }
  });
}
