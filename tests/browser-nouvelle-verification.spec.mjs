import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

/* Toutes les identités, les jetons et les réponses réseau sont fictifs. */
async function preparer(page, { admin = false, gold = false, prenom = 'Nour', id = 'eleve', profil = null, cloud = false } = {}) {
  await page.route('**/sw.js*', route => route.abort());
  if (!cloud) await page.route('https://*.supabase.co/**', route => route.abort());
  const config = await readFile(new URL('../assets/js/config.js', import.meta.url), 'utf8');
  await page.route('**/assets/js/config.js*', route => route.fulfill({
    contentType: 'text/javascript', body: config.replace(/ADMIN:\s*"[^"]+"/, 'ADMIN: "admin@example.invalid"')
  }));
  await page.addInitScript(({ admin, gold, prenom, id, profil, cloud }) => {
    try {
      const email = admin ? 'admin@example.invalid' : `${id}@example.invalid`;
      const session = { nativeAuthenticated: true, statut: 'actif', id, email, prenom, role: 'eleve', classe: '4SI 1', gold, isAdmin: admin };
      window.__STI_NATIVE_AUTHENTICATED_V316 = true;
      sessionStorage.setItem('sti-native-session-v316', '1');
      if (!sessionStorage.getItem('sti-test-session-preparee')) {
        sessionStorage.setItem('sti-test-session-preparee', '1');
        localStorage.setItem('sti-session-cache', JSON.stringify(session));
        sessionStorage.setItem('sti-session-cache', JSON.stringify(session));
        localStorage.setItem('sti-demo-vu', '1');
        if (profil) localStorage.setItem('sti-profil-abonne', JSON.stringify(profil));
        if (cloud) localStorage.setItem('sb-test-auth-token', JSON.stringify({ access_token: 'jeton-fictif', user: { id, email } }));
      }
    } catch (e) { /* Les iframes sandbox ont une origine opaque. */ }
  }, { admin, gold, prenom, id, profil, cloud });
  await page.emulateMedia({ reducedMotion: 'reduce' });
}

test('accueil : seul le compte administrateur configuré est salué Aymen', async ({ browser }) => {
  for (const scenario of [
    { admin: true, prenom: 'Autre prénom', profil: { prenom: 'Ancien profil' }, attendu: 'Aymen' },
    { gold: true, prenom: 'Nour', profil: { prenom: 'Ancien profil' }, attendu: 'Nour' },
    { prenom: 'Amel', attendu: 'Amel' }
  ]) {
    const context = await browser.newContext(), page = await context.newPage();
    try {
      await preparer(page, scenario);
      await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('#welcomeTitle')).toHaveText('Bonjour, ' + scenario.attendu);
      if (scenario.profil) expect(await page.evaluate(() => STIProfil.chargerProfil().prenom)).toBe('Ancien profil');
    } finally { await context.close(); }
  }
});

test('les cinq quiz reviennent à l’accueil appelant avec ses paramètres et son ancre, même après rechargement', async ({ page }) => {
  test.setTimeout(120_000);
  await preparer(page);
  await page.setViewportSize({ width: 1365, height: 900 });
  for (const quiz of ['html-css', 'javascript', 'sql', 'php', 'tableaux']) {
    await page.goto('/index.html?origine=fiche#quiz', { waitUntil: 'domcontentloaded' });
    await page.locator(`#quiz a[href="quiz/${quiz}.html"]`).click();
    await expect(page).toHaveURL(new RegExp('/quiz/' + quiz + '\\.html\\?'));
    const retour = page.getByRole('link', { name: 'Retour aux quiz' }).first();
    await expect(retour).toHaveAttribute('href', /\/index\.html\?origine=fiche#quiz$/);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(retour).toHaveAttribute('href', /\/index\.html\?origine=fiche#quiz$/);
    await retour.click();
    await expect(page).toHaveURL(/\/index\.html\?origine=fiche#quiz$/);
  }
});

test('retour depuis un exercice profond et redirection de l’ancien quiz PHP', async ({ page }) => {
  await preparer(page);
  await page.goto('/exercices/javascript/Tp1-js.html?mode=compact#etape-2', { waitUntil: 'domcontentloaded' });
  await page.locator('#stix-nav a[href="../../quiz/javascript.html"]').focus();
  await page.keyboard.press('Enter');
  const retour = page.getByRole('link', { name: 'Retour à la page précédente' }).first();
  await expect(retour).toHaveAttribute('href', /\/exercices\/javascript\/Tp1-js\.html\?mode=compact#etape-2$/);
  await retour.click();
  await expect(page).toHaveURL(/\/exercices\/javascript\/Tp1-js\.html\?mode=compact#etape-2$/);
  const appelant = '/exercices/php/Tp2-php.html?vue=1#consigne';
  await page.goto('/quiz/pp.html?retour=' + encodeURIComponent(appelant), { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/quiz\/php\.html\?/);
  await expect(page.getByRole('link', { name: 'Retour à la page précédente' }).first()).toHaveAttribute('href', new RegExp(appelant.replace(/[.?]/g, '\\$&') + '$'));
});

test('retour : refus des origines étrangères, traversées et schémas actifs', async ({ page }) => {
  await preparer(page);
  for (const cible of ['https://exemple.invalid/cours/html5.html', '//exemple.invalid/page.html', '/cours/../admin.html', '/cours/%2e%2e/admin.html', 'javascript:alert(1)', '/cours/%2Fadmin.html']) {
    await page.goto('/quiz/html-css.html?retour=' + encodeURIComponent(cible), { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('link', { name: 'Retour aux quiz' }).first()).toHaveAttribute('href', /\/index\.html#quiz$/);
  }
});

test('logos de matières : ressources locales, couleurs héritées et taille modeste dans les cinq cours', async ({ page }) => {
  await preparer(page);
  for (const matiere of ['html5', 'css3', 'javascript', 'sql', 'php']) {
    await page.goto(`/cours/${matiere}.html`, { waitUntil: 'domcontentloaded' });
    const logo = page.locator('.matiere-logo--hero').first();
    await expect(logo).toBeVisible();
    await expect(logo.locator('use')).toHaveAttribute('href', `../assets/icons/matieres.svg#${matiere}`);
    const boite = await logo.boundingBox();
    expect(boite.width).toBeLessThanOrEqual(40);
    expect(boite.height).toBeLessThanOrEqual(40);
  }
});

const sdkFictif = `
window.supabase = { createClient: function () {
  function session() { try { return JSON.parse(localStorage.getItem('sb-test-auth-token') || 'null'); } catch (e) { return null; } }
  function requete() {
    var q = {};
    ['select','eq','neq','order','limit','update','delete','upsert','in','gte','lte'].forEach(function (m) { q[m] = function () { return q; }; });
    q.insert = function () { return Promise.resolve({ data: [], error: null }); };
    q.range = function () { return Promise.resolve({ data: [], error: null }); };
    q.maybeSingle = q.single = function () { return Promise.resolve({ data: null, error: null }); };
    q.then = function (oui, non) { return Promise.resolve({ data: [], error: null }).then(oui, non); };
    return q;
  }
  var canal = { on: function () { return this; }, subscribe: function () { return this; }, send: function () { return Promise.resolve('ok'); } };
  return { auth: { getUser: function () { var s = session(); return Promise.resolve({ data: { user: s && s.user } }); },
    getSession: function () { return Promise.resolve({ data: { session: session() } }); },
    onAuthStateChange: function () { return { data: { subscription: { unsubscribe: function () {} } } }; } },
    from: function () { return requete(); }, rpc: function () { return Promise.resolve({ data: null, error: null }); }, channel: function () { return canal; } };
} };`;

async function preparerAdmin(page) {
  await page.route('https://*.supabase.co/**', route => route.abort());
  await page.route('**/sw.js*', route => route.abort());
  await page.addInitScript(() => {
    localStorage.setItem('sti-admin-gold', '1');
    function requete() {
      const q = {};
      for (const nom of ['select', 'eq', 'neq', 'order', 'limit', 'update', 'delete', 'upsert', 'insert', 'in', 'gte', 'lte', 'range']) q[nom] = () => q;
      q.maybeSingle = q.single = () => Promise.resolve({ data: null, error: null });
      q.then = (oui, non) => Promise.resolve({ data: [], error: null, count: 0 }).then(oui, non);
      return q;
    }
    const canal = { on() { return this; }, subscribe() { return this; }, send() { return Promise.resolve('ok'); } };
    window.__STI_SB_CLIENT = {
      auth: { getSession: () => Promise.resolve({ data: { session: { user: { id: 'admin-fictif', email: window.STI_AUTH.ADMIN } } } }),
        getUser: () => Promise.resolve({ data: { user: { id: 'admin-fictif', email: window.STI_AUTH.ADMIN } } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }) },
      from: () => requete(), rpc: () => Promise.resolve({ data: null, error: null }), channel: () => canal,
      removeChannel: () => Promise.resolve()
    };
  });
}

test('suivi abonné vers admin : cours, exercices cochés, vidéos et décochage', async ({ browser }) => {
  test.setTimeout(120_000);
  const ctx = await browser.newContext(), page = await ctx.newPage();
  const lignes = [], pulls = [];
  try {
    await page.route('**/assets/js/supabase-umd.js*', route => route.fulfill({ contentType: 'text/javascript', body: sdkFictif }));
    await page.route('https://*.supabase.co/**', route => {
      const req = route.request(), headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS' };
      if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
      if (req.url().includes('/rest/v1/sti_progressions') && req.method() === 'GET') pulls.push(req.url());
      if (req.url().includes('/rest/v1/sti_progressions') && req.method() === 'POST') lignes.push(req.postDataJSON());
      return route.fulfill({ status: 200, headers, contentType: 'application/json', body: '[]' });
    });
    await preparer(page, { cloud: true });
    const matieres = ['html5', 'css3', 'javascript', 'sql', 'php'];
    for (const matiere of matieres) {
      await page.goto(`/cours/${matiere}.html#exercices`, { waitUntil: 'domcontentloaded' });
      await expect.poll(() => page.evaluate(() => Boolean(window.STIProfil && window.enregistrerProgressionMediaSTI))).toBe(true);
      const check = page.locator(matiere === 'sql' || matiere === 'php' ? '[data-course-panel="exercices"] input[data-exercise]' : 'input[data-exo-check]').first();
      await expect(check).toBeVisible();
      await check.check();
      await page.evaluate(m => window.enregistrerProgressionMediaSTI('video:' + m + '-cours', 42, 100, false), matiere);
      await expect.poll(() => page.evaluate(m => STIProfil.chargerProfil().exercicesFaits[m].length, matiere)).toBe(1);
    }
    expect(pulls.length).toBeGreaterThan(0);
    await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
    await expect.poll(() => lignes.length, { timeout: 15_000 }).toBeGreaterThan(0);
    const derniere = lignes.at(-1);
    expect(derniere.user_id).toBe('eleve');
    const profil = JSON.parse(derniere.donnees['sti-profil-abonne']);
    expect(profil.coursVisites).toHaveLength(5);
    expect(Object.values(JSON.parse(derniere.donnees['sti-exos-faits'])).filter(Boolean)).toHaveLength(5);
    expect(Object.keys(JSON.parse(derniere.donnees['sti-media-prog-v1']))).toHaveLength(5);

    const ctxAdmin = await browser.newContext(), admin = await ctxAdmin.newPage();
    try {
      await preparerAdmin(admin);
      await admin.goto('/admin.html', { waitUntil: 'domcontentloaded' });
      await expect.poll(() => admin.evaluate(() => typeof window.__stiBilanSuiviCompletEleve)).toBe('function');
      const bilan = await admin.evaluate(ligne => {
        const eleve = { id: 'eleve', email: 'eleve@example.invalid', classe: '4SI 1' };
        window.__stiInjecterProgressionsCloudTest([ligne], [eleve]);
        return { complet: window.__stiBilanSuiviCompletEleve(eleve), medias: window.__stiBilanProgressionMediaUser(eleve) };
      }, derniere);
      expect(bilan.complet.nbCours).toBe(5);
      expect(bilan.complet.nbExos).toBe(5);
      expect(bilan.complet.nbVidVues).toBe(5);
      for (const matiere of matieres) expect(bilan.medias.pm['video:' + matiere + '-cours']).toBe(42);

      // Le décochage doit traverser le POST cloud fictif jusqu'au calcul réel admin.
      await page.locator('[data-course-panel="exercices"] input[data-exercise]').first().uncheck();
      const suite = await page.evaluate(() => ({
        php: STIProfil.chargerProfil().exercicesFaits.php,
        historique: JSON.parse(localStorage.getItem('sti-exos-faits'))
      }));
      expect(suite.php).toEqual([]);
      expect(Object.values(suite.historique).filter(Boolean)).toHaveLength(4);
      await page.waitForTimeout(1600); // Le synchroniseur déduplique les départs rapprochés.
      await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
      await expect.poll(() => lignes.some(l => {
        try { return Object.values(JSON.parse(l.donnees['sti-exos-faits'])).filter(Boolean).length === 4; }
        catch (e) { return false; }
      }), { timeout: 15_000 }).toBe(true);
      const apres = [...lignes].reverse().find(l => Object.values(JSON.parse(l.donnees['sti-exos-faits'])).filter(Boolean).length === 4);
      const bilanApres = await admin.evaluate(ligne => {
        const eleve = { id: 'eleve', email: 'eleve@example.invalid', classe: '4SI 1' };
        window.__stiInjecterProgressionsCloudTest([ligne], [eleve]);
        return window.__stiBilanSuiviCompletEleve(eleve);
      }, apres);
      expect(bilanApres.nbExos).toBe(4);
      expect(bilanApres.nbCours).toBe(5);
      expect(bilanApres.nbVidVues).toBe(5);
    } finally { await ctxAdmin.close(); }
  } finally { await ctx.close(); }
});

test('reconnexion : les nouvelles données cloud sont relues sans attendre un changement de compte', async ({ page, context }) => {
  const pulls = [], nuage = { profil: { prenom: 'Nour', coursVisites: ['html5'] }, maj: new Date(Date.now() - 60_000).toISOString() };
  await page.route('**/assets/js/supabase-umd.js*', route => route.fulfill({ contentType: 'text/javascript', body: sdkFictif }));
  await page.route('https://*.supabase.co/**', route => {
    const req = route.request(), headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS' };
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (req.url().includes('/rest/v1/sti_progressions') && req.method() === 'GET') {
      pulls.push(req.url());
      return route.fulfill({ status: 200, headers, contentType: 'application/json', body: JSON.stringify([{ maj: nuage.maj, donnees: { 'sti-profil-abonne': JSON.stringify(nuage.profil) } }]) });
    }
    return route.fulfill({ status: 200, headers, contentType: 'application/json', body: '[]' });
  });
  await preparer(page, { cloud: true });
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => pulls.length).toBeGreaterThan(0);
  await expect(page.locator('#welcomeCount')).toHaveText('1 en cours');
  const avant = pulls.length;
  await context.setOffline(true);
  nuage.profil = { prenom: 'Nour', coursVisites: ['css3', 'html5'] };
  nuage.maj = new Date(Date.now() + 10_000).toISOString();
  await context.setOffline(false);
  await expect.poll(() => pulls.length, { timeout: 8_000 }).toBeGreaterThan(avant);
  await expect(page.locator('#welcomeCount')).toHaveText('2 en cours');
});

test('reconnexion : fusion des actions hors ligne, des changements distants et des médias', async ({ page, context }) => {
  const nuage = { profil: { prenom: 'Nour', coursVisites: ['html5'], exercicesFaits: { html5: ['exo-tp1'] } },
    media: { 'video:html5-cours': { pct: 20, maxPct: 20, sec: 20, dur: 100, done: false, ts: 10 } }, maj: new Date().toISOString() };
  const pulls = [];
  await page.route('**/assets/js/supabase-umd.js*', route => route.fulfill({ contentType: 'text/javascript', body: sdkFictif }));
  await page.route('https://*.supabase.co/**', route => {
    const req = route.request(), headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS' };
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (req.url().includes('/rest/v1/sti_progressions') && req.method() === 'GET') {
      pulls.push(req.url());
      return route.fulfill({ status: 200, headers, contentType: 'application/json', body: JSON.stringify([{ maj: nuage.maj, donnees: {
        'sti-profil-abonne': JSON.stringify(nuage.profil), 'sti-media-prog-v1': JSON.stringify(nuage.media)
      } }]) });
    }
    return route.fulfill({ status: 200, headers, contentType: 'application/json', body: '[]' });
  });
  await preparer(page, { cloud: true });
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => pulls.length).toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(() => STIProfil.chargerProfil().exercicesFaits.html5)).toEqual(['exo-tp1']);
  await context.setOffline(true);
  await page.evaluate(() => {
    STIProfil.enregistrerVisiteCours('sql');
    STIProfil.basculerExerciceFait('html5', 'exo-tp1', false);
    STIProfil.basculerExerciceFait('sql', 'tp1', true);
    window.enregistrerProgressionMediaSTI('video:html5-cours', 50, 100, false);
  });
  nuage.profil = { prenom: 'Nour', coursVisites: ['css3', 'html5'], exercicesFaits: { html5: ['exo-tp1', 'exo-tp2'] } };
  nuage.media['video:html5-cours'] = { pct: 70, maxPct: 70, sec: 70, dur: 100, done: false, ts: Date.now() + 1000 };
  nuage.maj = new Date(Date.now() + 1000).toISOString();
  await context.setOffline(false);
  await expect.poll(() => page.evaluate(() => STIProfil.chargerProfil().coursVisites.length)).toBe(3);
  const etat = await page.evaluate(() => ({ profil: STIProfil.chargerProfil(), medias: window.lireProgressionMediaSTI() }));
  expect(new Set(etat.profil.coursVisites)).toEqual(new Set(['html5', 'css3', 'sql']));
  expect(etat.profil.exercicesFaits.html5).toEqual(['exo-tp2']);
  expect(etat.profil.exercicesFaits.sql).toEqual(['tp1']);
  expect(etat.medias['video:html5-cours'].maxPct).toBe(70);
});

test('reconnexion lente ou en panne : aucun POST périmé avant le GET, puis reprise automatique', async ({ page, context }) => {
  const posts = [], pulls = [];
  let version = 0, echouer = false, liberer;
  let blocage = null;
  await page.route('**/assets/js/supabase-umd.js*', route => route.fulfill({ contentType: 'text/javascript', body: sdkFictif }));
  await page.route('https://*.supabase.co/**', async route => {
    const req = route.request(), headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS' };
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (req.url().includes('/rest/v1/sti_progressions') && req.method() === 'GET') {
      pulls.push(req.url());
      if (blocage) await blocage;
      if (echouer) return route.fulfill({ status: 503, headers, contentType: 'application/json', body: '{}' });
      const visites = version ? ['html5', 'css3'] : ['html5'];
      return route.fulfill({ status: 200, headers, contentType: 'application/json', body: JSON.stringify([{ maj: new Date(Date.now() + 1000).toISOString(), donnees: {
        'sti-profil-abonne': JSON.stringify({ prenom: 'Nour', coursVisites: visites })
      } }]) });
    }
    if (req.url().includes('/rest/v1/sti_progressions') && req.method() === 'POST') posts.push(req.postDataJSON());
    return route.fulfill({ status: 200, headers, contentType: 'application/json', body: '[]' });
  });
  await preparer(page, { cloud: true });
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => pulls.length).toBeGreaterThan(0);
  await expect(page.locator('#welcomeCount')).toHaveText('1 en cours');
  await page.waitForTimeout(900);
  posts.length = 0;
  await context.setOffline(true);
  await page.evaluate(() => STIProfil.enregistrerVisiteCours('sql'));
  version = 1; echouer = true;
  blocage = new Promise(resolve => { liberer = resolve; });
  await context.setOffline(false);
  await expect.poll(() => pulls.length).toBeGreaterThan(1);
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  await page.waitForTimeout(300);
  expect(posts).toHaveLength(0);
  liberer(); blocage = null;
  // Une panne de lecture ne doit pas être suivie d'un POST écrasant le cloud.
  await page.waitForTimeout(400);
  expect(posts).toHaveLength(0);
  echouer = false;
  await expect.poll(() => posts.length, { timeout: 10_000 }).toBeGreaterThan(0);
  const transmis = JSON.parse(posts.at(-1).donnees['sti-profil-abonne']);
  expect(new Set(transmis.coursVisites)).toEqual(new Set(['html5', 'css3', 'sql']));
});

test('compatibilité : un ancien journal d’exercices reste intact et les coches V2 ne sont pas dupliquées', async ({ page }) => {
  await preparer(page, { profil: { prenom: 'Nour', coursVisites: ['javascript'], exercicesFaits: { javascript: ['exo-js-1'] } } });
  await page.addInitScript(() => { if (!localStorage.getItem('sti-exos-faits')) localStorage.setItem('sti-exos-faits', JSON.stringify(['exercice-historique'])); });
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('sti-exos-faits') || '[]'))).toEqual(['exercice-historique', 'profil-v2:javascript:exo-js-1']);
  await page.reload({ waitUntil: 'domcontentloaded' });
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('sti-exos-faits')))).toEqual(['exercice-historique', 'profil-v2:javascript:exo-js-1']);
  await page.evaluate(() => STIProfil.basculerExerciceFait('javascript', 'exo-js-1', false));
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('sti-exos-faits')))).toEqual(['exercice-historique']);
});

test('reconnexion pendant un changement de compte : aucune donnée du précédent élève n’est envoyée au suivant', async ({ page, context }) => {
  const posts = [], pulls = [];
  let bloquer = false, liberer;
  let blocage;
  await page.route('**/assets/js/supabase-umd.js*', route => route.fulfill({ contentType: 'text/javascript', body: sdkFictif }));
  await page.route('https://*.supabase.co/**', async route => {
    const req = route.request(), headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS' };
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (req.url().includes('/rest/v1/sti_progressions') && req.method() === 'GET') {
      const uid = new URL(req.url()).searchParams.get('user_id'); pulls.push(uid);
      if (bloquer) await blocage;
      const profil = uid === 'eq.bob' ? { prenom: 'Bob', coursVisites: ['css3'], exercicesFaits: { css3: ['bob-seul'] } } :
        { prenom: 'Nour', coursVisites: ['html5'], exercicesFaits: { html5: ['alice-seule'] } };
      return route.fulfill({ status: 200, headers, contentType: 'application/json', body: JSON.stringify([{ maj: new Date(Date.now() + 1000).toISOString(), donnees: { 'sti-profil-abonne': JSON.stringify(profil) } }]) });
    }
    if (req.url().includes('/rest/v1/sti_progressions') && req.method() === 'POST') posts.push(req.postDataJSON());
    return route.fulfill({ status: 200, headers, contentType: 'application/json', body: '[]' });
  });
  await preparer(page, { cloud: true });
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.evaluate(() => STIProfil.chargerProfil().exercicesFaits.html5)).toEqual(['alice-seule']);
  await context.setOffline(true);
  await page.evaluate(() => STIProfil.basculerExerciceFait('html5', 'alice-en-attente', true));
  blocage = new Promise(resolve => { liberer = resolve; }); bloquer = true;
  const avant = pulls.length;
  await context.setOffline(false);
  await expect.poll(() => pulls.length).toBeGreaterThan(avant);
  await page.evaluate(() => {
    const s = { nativeAuthenticated: true, statut: 'actif', id: 'bob', email: 'bob@example.invalid', prenom: 'Bob', role: 'eleve', classe: '4SI 1' };
    localStorage.setItem('sti-session-cache', JSON.stringify(s));
    sessionStorage.setItem('sti-session-cache', JSON.stringify(s));
    localStorage.setItem('sb-test-auth-token', JSON.stringify({ access_token: 'jeton-bob', user: { id: 'bob', email: s.email } }));
    window.dispatchEvent(new Event('pagehide'));
  });
  bloquer = false; liberer();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.evaluate(() => STIProfil.chargerProfil().exercicesFaits.css3)).toEqual(['bob-seul']);
  const apres = await page.evaluate(() => ({ profil: STIProfil.chargerProfil(), uid: localStorage.getItem('sti-sync-uid'), historique: JSON.parse(localStorage.getItem('sti-exos-faits') || '{}') }));
  expect(apres.uid).toBe('bob');
  expect(apres.profil.exercicesFaits.html5).toEqual([]);
  expect(JSON.stringify(apres.historique)).not.toContain('alice');
  for (const post of posts.filter(p => p.user_id === 'bob')) expect(JSON.stringify(post.donnees)).not.toContain('alice');
});

test('nouvelle connexion explicite : la lecture cloud n’est pas bloquée par la temporisation des pages', async ({ page }) => {
  const appels = [];
  const sdkAvecSignal = sdkFictif.replace('onAuthStateChange: function () { return', 'onAuthStateChange: function (f) { (window.__testSignauxConnexion || (window.__testSignauxConnexion = [])).push(f); return');
  await page.route('**/assets/js/supabase-umd.js*', route => route.fulfill({ contentType: 'text/javascript', body: sdkAvecSignal }));
  await page.route('https://*.supabase.co/**', route => {
    const req = route.request(), headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS' };
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (req.url().includes('/rest/v1/sti_progressions') && req.method() === 'GET') appels.push(req.url());
    return route.fulfill({ status: 200, headers, contentType: 'application/json', body: '[]' });
  });
  await preparer(page, { cloud: true });
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => appels.length).toBeGreaterThan(0);
  const avant = appels.length;
  await page.evaluate(() => window.__testSignauxConnexion.forEach(f => f('SIGNED_IN', { user: { id: 'eleve' } })));
  await expect.poll(() => appels.length, { timeout: 5000 }).toBeGreaterThan(avant);
});

test('reconnexion : les autres clés cloud et les records XP ne sont pas écrasés par un ancien POST', async ({ page, context }) => {
  let distant = {}, relire = false, liberer, blocage;
  const posts = [], lectures = [];
  await page.route('**/assets/js/supabase-umd.js*', route => route.fulfill({ contentType: 'text/javascript', body: sdkFictif }));
  await page.route('https://*.supabase.co/**', async route => {
    const req = route.request(), headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS' };
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (req.url().includes('/rest/v1/sti_progressions') && req.method() === 'GET') {
      lectures.push(req.url()); if (relire) await blocage;
      return route.fulfill({ status: 200, headers, contentType: 'application/json', body: JSON.stringify([{ maj: new Date(Date.now() + 1000).toISOString(), donnees: distant }]) });
    }
    if (req.url().includes('/rest/v1/sti_progressions') && req.method() === 'POST') posts.push(req.postDataJSON());
    return route.fulfill({ status: 200, headers, contentType: 'application/json', body: '[]' });
  });
  const profil = JSON.stringify({ prenom: 'Nour', coursVisites: ['html5'] });
  distant = { 'sti-profil-abonne': profil, 'sti-notes': JSON.stringify({ html5: 'base' }),
    'sti-preference-exemple': 'base', sqlQuestV3: JSON.stringify({ xp: 100, level: 1, best: { bases: 1 } }),
    js_quiz_high_score: '5' };
  await preparer(page, { cloud: true });
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.evaluate(() => localStorage.getItem('sti-notes'))).toBe('{"html5":"base"}');
  await context.setOffline(true);
  await page.evaluate(() => {
    localStorage.setItem('sti-notes', JSON.stringify({ html5: 'base', javascript: 'locale' }));
    localStorage.setItem('sqlQuestV3', JSON.stringify({ xp: 150, level: 2, best: { bases: 2 } }));
    window.dispatchEvent(new Event('pagehide'));
  });
  distant = { ...distant, 'sti-notes': JSON.stringify({ html5: 'base', css3: 'distante' }),
    'sti-preference-exemple': 'distante', 'sti-nouveau-distant': 'conservé',
    sqlQuestV3: JSON.stringify({ xp: 600, level: 4, best: { bases: 3 } }), js_quiz_high_score: '9' };
  blocage = new Promise(resolve => { liberer = resolve; }); relire = true;
  const avant = lectures.length;
  await context.setOffline(false);
  await expect.poll(() => lectures.length).toBeGreaterThan(avant);
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  relire = false; liberer();
  await expect.poll(() => posts.length).toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('sti-notes') || '{}'))).toMatchObject({ html5: 'base', javascript: 'locale', css3: 'distante' });
  const resultat = posts.at(-1).donnees;
  expect(JSON.parse(resultat['sti-notes'])).toMatchObject({ html5: 'base', javascript: 'locale', css3: 'distante' });
  expect(resultat['sti-preference-exemple']).toBe('distante');
  expect(resultat['sti-nouveau-distant']).toBe('conservé');
  expect(JSON.parse(resultat.sqlQuestV3)).toMatchObject({ xp: 600, level: 4, best: { bases: 3 } });
  expect(resultat.js_quiz_high_score).toBe('9');
  expect(resultat['sti-session-cache']).toBeUndefined();
});

test('les cinq quiz relisent le cloud au retour en ligne sans changer leur présentation', async ({ page, context }) => {
  test.setTimeout(120_000);
  const lectures = [];
  await page.route('**/assets/js/supabase-umd.js*', route => route.fulfill({ contentType: 'text/javascript', body: sdkFictif }));
  await page.route('https://*.supabase.co/**', route => {
    const req = route.request(), headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS' };
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (req.url().includes('/rest/v1/sti_progressions') && req.method() === 'GET') lectures.push(req.url());
    return route.fulfill({ status: 200, headers, contentType: 'application/json', body: '[]' });
  });
  await preparer(page, { cloud: true });
  for (const nom of ['html-css', 'javascript', 'sql', 'php', 'tableaux']) {
    await page.goto('/quiz/' + nom + '.html', { waitUntil: 'domcontentloaded' });
    await expect.poll(() => page.evaluate(() => Boolean(window.STIProfil && window.__STI_SB_CLIENT && window.__STI_RECONNEXION_PROFIL))).toBe(true);
    expect(await page.locator('script[data-sti-quiz-seul]').count()).toBe(1);
    const avant = lectures.length;
    await context.setOffline(true);
    await context.setOffline(false);
    await expect.poll(() => lectures.length, { timeout: 6000 }).toBeGreaterThan(avant);
  }
});

test('une reconnexion survenant pendant le chargement différé du pont n’est pas perdue', async ({ page, context }) => {
  let liberer, requetePont = 0;
  const attente = new Promise(resolve => { liberer = resolve; }), lectures = [];
  await page.route('**/assets/js/reconnexion-profil.js*', async route => { requetePont++; await attente; await route.continue(); });
  await page.route('**/assets/js/supabase-umd.js*', route => route.fulfill({ contentType: 'text/javascript', body: sdkFictif }));
  await page.route('https://*.supabase.co/**', route => {
    const req = route.request(), headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS' };
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (req.url().includes('/rest/v1/sti_progressions') && req.method() === 'GET') lectures.push(req.url());
    return route.fulfill({ status: 200, headers, contentType: 'application/json', body: '[]' });
  });
  await preparer(page, { cloud: true });
  await page.goto('/quiz/html-css.html', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => requetePont).toBe(1);
  await expect.poll(() => lectures.length).toBeGreaterThan(0);
  const avant = lectures.length;
  await context.setOffline(true);
  await context.setOffline(false);
  liberer();
  await expect.poll(() => page.evaluate(() => Boolean(window.__STI_RECONNEXION_PROFIL))).toBe(true);
  await expect.poll(() => lectures.length).toBeGreaterThan(avant);
});

test('retour contextualisé sous un préfixe GitHub Pages : chemin, paramètres et ancre sont conservés', async ({ page }) => {
  await preparer(page);
  await page.route('**/STiV2.0/**', route => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/sw.js')) return route.abort();
    url.pathname = url.pathname.replace(/^\/STiV2\.0\//, '/');
    return route.continue({ url: url.href });
  });
  await page.goto('/STiV2.0/index.html?vue=profil#cours', { waitUntil: 'domcontentloaded' });
  const lien = page.locator('a[href="quiz/sql.html"]').first();
  await lien.scrollIntoViewIfNeeded();
  await lien.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/STiV2\.0\/quiz\/sql\.html\?/);
  const retour = page.locator('a[aria-label^="Retour"]').first();
  await expect(retour).toHaveAttribute('href', /\/STiV2\.0\/index\.html\?vue=profil#cours$/);
});

test('un lien de quiz créé dynamiquement conserve aussi le contexte de sa page', async ({ page }) => {
  await preparer(page);
  await page.goto('/exercices/php/debogage-php-bac.html?vue=details#exemple', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.evaluate(() => Boolean(window.__STI_APPEL_QUIZ))).toBe(true);
  await page.evaluate(() => {
    const a = document.createElement('a'); a.id = 'test-quiz-dynamique'; a.href = '../../quiz/php.html';
    a.textContent = 'Quiz'; document.body.prepend(a);
  });
  await page.locator('#test-quiz-dynamique').focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/quiz\/php\.html\?/);
  await expect(page.locator('a[aria-label^="Retour"]').first()).toHaveAttribute('href', /\/exercices\/php\/debogage-php-bac\.html\?vue=details#exemple$/);
});

test('un quiz ouvert depuis un autre quiz revient au quiz appelant, sans boucle', async ({ page }) => {
  await preparer(page);
  await page.goto('/quiz/javascript.html?mode=revision#question', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.evaluate(() => Boolean(window.__STI_APPEL_QUIZ))).toBe(true);
  await page.evaluate(() => {
    const a = document.createElement('a'); a.id = 'test-autre-quiz'; a.href = 'sql.html';
    a.textContent = 'Quiz SQL'; document.body.prepend(a);
  });
  await page.locator('#test-autre-quiz').focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/quiz\/sql\.html\?/);
  await expect(page.locator('a[aria-label^="Retour"]').first()).toHaveAttribute('href', /\/quiz\/javascript\.html\?mode=revision#question$/);
});
