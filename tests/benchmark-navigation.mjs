/* Serveur local déjà lancé, comptes fictifs et aucune ressource externe.
   CHROMIUM_EXECUTABLE_PATH=/chemin/chromium STI_BENCH_ROUNDS=3 node tests/benchmark-navigation.mjs
   Ajouter STI_BENCH_CACHE=warm pour mesurer après visite et mise en cache PWA.
   Ces résultats ne prédisent pas les performances d'un téléphone ou réseau réel. */
import { chromium } from 'playwright';
import { performance } from 'node:perf_hooks';

const chaud = process.env.STI_BENCH_CACHE === 'warm';
// 127.0.0.2 exerce la stratégie cache-first du SW sans la revalidation spéciale localhost.
const base = process.env.STI_BENCH_URL || (chaud ? 'http://127.0.0.2:4173' : 'http://127.0.0.1:4173');
const tours = Number(process.env.STI_BENCH_ROUNDS || 3);
if (!Number.isInteger(tours) || tours < 1 || tours > 20) throw new Error('STI_BENCH_ROUNDS doit être compris entre 1 et 20');
const cours = ['html5', 'css3', 'javascript', 'sql', 'php'];
const profils = [
  { nom: 'ordinateur', viewport: { width: 1365, height: 900 }, cpu: 1, reseau: null },
  { nom: 'mobile simulé', viewport: { width: 390, height: 844 }, cpu: 4,
    reseau: { offline: false, latency: 40, downloadThroughput: 1_600_000 / 8, uploadThroughput: 750_000 / 8 } }
];
const navigateur = await chromium.launch({
  ...(process.env.CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH } : {}),
  args: ['--no-sandbox']
});
const mediane = valeurs => {
  const triees = [...valeurs].sort((a, b) => a - b), i = Math.floor(triees.length / 2);
  return Math.round(triees.length % 2 ? triees[i] : (triees[i - 1] + triees[i]) / 2);
};

async function preparer(profil) {
  const contexte = await navigateur.newContext({ viewport: profil.viewport, serviceWorkers: chaud ? 'allow' : 'block', reducedMotion: 'reduce' });
  try {
    await contexte.route('**/*', route => new URL(route.request().url()).origin === new URL(base).origin ? route.continue() : route.abort());
    await contexte.addInitScript(() => {
      try {
        const s = { nativeAuthenticated: true, statut: 'actif', id: 'performance-fictive', email: 'performance@example.invalid', prenom: 'Test', nom: 'Navigation', role: 'eleve', classe: '4SI 1' };
        window.__STI_NATIVE_AUTHENTICATED_V316 = true;
        sessionStorage.setItem('sti-native-session-v316', '1');
        sessionStorage.setItem('sti-session-cache', JSON.stringify(s));
        localStorage.setItem('sti-session-cache', JSON.stringify(s));
        localStorage.setItem('sti-demo-vu', '1');
      } catch (e) { /* Les éditeurs sandbox ont une origine opaque. */ }
    });
    const page = await contexte.newPage();
    page.setDefaultNavigationTimeout(60_000);
    const cdp = await contexte.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: profil.cpu });
    if (profil.reseau) {
      await cdp.send('Network.enable');
      await cdp.send('Network.emulateNetworkConditions', profil.reseau);
    }
    if (chaud) {
      await page.goto(`${base}/index.html`, { waitUntil: 'domcontentloaded' }).catch(() => {});
      await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), null, { timeout: 60_000 });
      for (const nom of cours) {
        await page.goto(`${base}/cours/${nom}.html`, { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(n => caches.match(`/cours/${n}.html`).then(Boolean), nom, { timeout: 30_000 });
      }
    }
    return { contexte, page };
  } catch (erreur) {
    await contexte.close();
    throw erreur;
  }
}

async function mesurer(page, mesures) {
  for (const nom of cours) {
    await page.goto(`${base}/index.html#modules`, { waitUntil: 'domcontentloaded' });
    const lien = page.locator(`a.subject-pill-link[href="cours/${nom}.html"]`).first();
    await lien.scrollIntoViewIfNeeded();
    const debut = performance.now();
    await Promise.all([page.waitForURL(`**/cours/${nom}.html`, { waitUntil: 'domcontentloaded' }), lien.click({ noWaitAfter: true })]);
    await page.locator('.course-hero__grid').waitFor({ state: 'visible' });
    const pret = Math.round(performance.now() - debut);
    const dcl = await page.evaluate(() => Math.round(performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd));
    // Retour réel du navigateur : il peut bénéficier du bfcache lorsque le navigateur le permet.
    const debutRetour = performance.now();
    await page.goBack({ waitUntil: 'domcontentloaded' });
    await page.locator('#cours .subject-card').first().waitFor({ state: 'visible' });
    const retour = Math.round(performance.now() - debutRetour);
    mesures[nom].push({ pret, dcl, retour });
  }
}

try {
  for (const profil of profils) {
    const mesures = Object.fromEntries(cours.map(nom => [nom, []]));
    if (chaud) {
      const { contexte, page } = await preparer(profil);
      try { for (let tour = 0; tour < tours; tour++) await mesurer(page, mesures); }
      finally { await contexte.close(); }
    } else {
      for (let tour = 0; tour < tours; tour++) {
        const { contexte, page } = await preparer(profil);
        try { await mesurer(page, mesures); }
        finally { await contexte.close(); }
      }
    }
    console.log(JSON.stringify({ profil: profil.nom, cache: chaud ? 'PWA préchauffée' : 'PWA désactivée, serveur sans cache', tours,
      conditions: profil.reseau ? 'CPU x4, latence 40 ms, descendant 1,6 Mbit/s' : 'CPU x1, réseau local',
      cours: Object.fromEntries(cours.map(nom => [nom, {
        pret_median_ms: mediane(mesures[nom].map(m => m.pret)), pret_max_ms: Math.max(...mesures[nom].map(m => m.pret)),
        dom_median_ms: mediane(mesures[nom].map(m => m.dcl)),
        retour_median_ms: mediane(mesures[nom].map(m => m.retour)), retour_max_ms: Math.max(...mesures[nom].map(m => m.retour))
      }])) }));
  }
} finally { await navigateur.close(); }
