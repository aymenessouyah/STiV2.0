import { test, expect } from '@playwright/test';

test('la page portail purge les anciens jetons applicatifs', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('sti-session-token', 'ancien-jeton-interdit');
    localStorage.setItem('sti-reauth', 'ancien-secret-interdit');
  });
  await page.goto('/portail.html', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.evaluate(() => localStorage.getItem('sti-session-token'))).toBeNull();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('sti-reauth'))).toBeNull();
});

test('la file hors ligne IndexedDB conserve un UUID et déduplique une reprise', async ({ page, context }) => {
  await page.goto('/tests/outbox-harness.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => Boolean(window.__STI_V302_OUTBOX_TESTS));
  await context.setOffline(true);
  const resultat = await page.evaluate(async () => {
    const api = window.__STI_V302_OUTBOX_TESTS;
    const ligne = api.enqueue({ user_id: 'offline-user', page: 'TEST_OFFLINE', lieu: '{}', duree_sec: 1 });
    api.enqueue(ligne);
    await new Promise(r => setTimeout(r, 120));
    const all = await api.readAll();
    const memes = all.filter(x => x._event_id === ligne._event_id);
    await api.remove([ligne._event_id]);
    localStorage.removeItem('sti-offline-queue');
    return { id: ligne._event_id, count: memes.length, client: ligne.client_event_id };
  });
  expect(resultat.id).toBeTruthy();
  expect(resultat.client).toBe(resultat.id);
  expect(resultat.count).toBe(1);
});

test('le delta administrateur utilise updated_at, Realtime et une page serveur bornée', async ({ request }) => {
  const js = await (await request.get('/assets/js/admin.js')).text();
  expect(js).toContain('.gt("updated_at", dernierProfilUpdatedAtAdmin)');
  expect(js).toContain('TAILLE_PAGE_ACCES_ADMIN = 100');
  expect(js).toContain('chargerPageAccesPrecedente');
  expect(js).toContain('.channel("admin-demandes")');
  expect(js).toContain('postgres_changes');
});

test('le flux CSS3 offre trois qualités et accepte Range sans téléchargement intégral', async ({ request }) => {
  const master = await (await request.get('/assets/streams/css3-v302/master.m3u8')).text();
  expect(master).toContain('RESOLUTION=854x480');
  expect(master).toContain('RESOLUTION=1280x720');
  expect(master).toContain('RESOLUTION=1920x1080');
  const playlist = await (await request.get('/assets/streams/css3-v302/css3-480p.m3u8')).text();
  expect(playlist).toContain('#EXT-X-BYTERANGE');
  const rep = await request.get('/assets/streams/css3-v302/css3-480p.m4s', { headers: { Range: 'bytes=0-1023' } });
  expect(rep.status()).toBe(206);
  expect((await rep.body()).byteLength).toBe(1024);
});

test('le Service Worker relaie Range sans mettre en cache le média complet', async ({ page }) => {
  await page.goto('/portail.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => navigator.serviceWorker.ready);
  if (!(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)))) {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  }
  const resultat = await page.evaluate(async () => {
    const url = new URL('assets/streams/css3-v302/css3-480p.m4s', location.origin + '/').href;
    const rep = await fetch(url, { headers: { Range: 'bytes=0-511' } });
    const buf = await rep.arrayBuffer();
    const cache = await caches.open('sti-videos-labo-v1');
    const complet = await cache.match(new Request(url), { ignoreSearch: true });
    return { status: rep.status, longueur: buf.byteLength, complet: Boolean(complet), range: rep.headers.get('content-range') };
  });
  expect(resultat.status).toBe(206);
  expect(resultat.longueur).toBe(512);
  expect(resultat.range).toContain('bytes 0-511/');
  expect(resultat.complet).toBe(false);

  const eviction = await page.evaluate(async () => {
    const asset = new URL('assets/images/sql-serie5-poster.avif?v=302', location.origin + '/').href;
    await fetch(asset);
    const cacheNames = (await caches.keys()).filter(n => /^sti-atelier-v\d+$/.test(n)).sort().reverse();
    const cache = await caches.open(cacheNames[0] || 'sti-atelier-v303');
    // Une installation fraîche ne précharge pas tout le code différentiel.
    // Charger explicitement cette ressource avant de vérifier sa conservation.
    const code = new URL('assets/js/protection.js', location.origin + '/').href;
    await fetch(code);
    for (let i = 0; i < 40 && (!(await cache.match(asset, { ignoreSearch: true })) || !(await cache.match(code, { ignoreSearch: true }))); i++) await new Promise(r => setTimeout(r, 50));
    const avant = Boolean(await cache.match(asset, { ignoreSearch: true }));
    const codeAvant = Boolean(await cache.match(code, { ignoreSearch: true }));
    navigator.serviceWorker.controller.postMessage({ type: 'STI_EVICT_RUNTIME' });
    for (let i = 0; i < 40 && (await cache.match(asset, { ignoreSearch: true })); i++) await new Promise(r => setTimeout(r, 50));
    return { avant, codeAvant, apres: Boolean(await cache.match(asset, { ignoreSearch: true })), codeDiff: Boolean(await cache.match(code, { ignoreSearch: true })) };
  });
  expect(eviction.avant).toBe(true);
  expect(eviction.codeAvant).toBe(true);
  expect(eviction.apres).toBe(false);
  expect(eviction.codeDiff).toBe(true);
});

test('le mode économie est détecté et le diagnostic visible', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'connection', { configurable: true, value: { saveData: true, effectiveType: '3g', addEventListener() {} } });
  });
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.evaluate(() => window.__STI_MODE_ECO_DONNEES())).toBe(true);
  await expect(page.locator('#sti-diagnostic-compact')).toContainText('Économie');
  await context.close();
});

test('le manifeste différentiel exclut les vidéos lourdes du téléchargement automatique', async ({ request }) => {
  const sw = await (await request.get('/sw.js')).text();
  const bloc = sw.slice(sw.indexOf('var UPDATE_FILES'), sw.indexOf('var CACHE_REVISIONS'));
  expect(bloc).toContain('./assets/js/acces.js');
  expect(bloc).toContain('./assets/js/admin.js');
  expect(bloc).not.toMatch(/\.(mp4|m4s|mp3)/i);
  expect(sw).toContain('PRECACHE_ALL_USER');
  expect(sw).toContain('evincerRuntimeLRUSTI');
});
