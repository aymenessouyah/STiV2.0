import { test, expect } from '@playwright/test';

/* Session native fictive : aucun compte ni service d'authentification réel n'est utilisé. */
test.beforeEach(async ({ context }) => {
  // Les tests de migration SW sont séparés ; ici éviter un rechargement automatique de version.
  await context.route('**/sw.js*', route => route.abort());
  await context.addInitScript(() => {
    const session = { nativeAuthenticated: true, statut: 'actif', email: 'eleve-test@example.invalid', role: 'eleve', classe: '4SI 1', lycee: 'Lycée Raféha' };
    window.__STI_NATIVE_AUTHENTICATED_V316 = true;
    sessionStorage.setItem('sti-native-session-v316', '1');
    sessionStorage.setItem('sti-session-cache', JSON.stringify(session));
    localStorage.setItem('sti-session-cache', JSON.stringify(session));
  });
});

test('installation PWA : invitation mobile unique et aide iPhone sans prompt natif', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'userAgent', { value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1' });
  });
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#pwaInvitation')).toBeVisible();
  await expect(page.locator('#installBtn')).toHaveJSProperty('hidden', false);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.locator('#pwaInvitationInstaller').click();
  await expect(page.locator('#pwaInvitationAide')).toContainText('Partager');
  await expect.poll(() => page.evaluate(() => window.STIProfil.chargerProfil().invitationInstallationVue)).toBe(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#pwaInvitation')).toBeHidden();
  await expect(page.locator('#installBtn')).toBeHidden();
});

test('installation PWA : une acceptation masque immédiatement l’invitation et persiste', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#pwaInvitation')).toBeVisible();
  await page.evaluate(() => {
    const ev = new Event('beforeinstallprompt', { cancelable: true });
    ev.prompt = () => { window.__testPwaPrompted = true; };
    ev.userChoice = Promise.resolve({ outcome: 'accepted' });
    window.dispatchEvent(ev);
  });
  await page.locator('#pwaInvitationInstaller').click();
  await expect.poll(() => page.evaluate(() => window.__testPwaPrompted)).toBe(true);
  await expect(page.locator('#pwaInvitation')).toBeHidden();
  await expect.poll(() => page.evaluate(() => window.__stiPwaEstInstallee())).toBe(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#pwaInvitation')).toBeHidden();
});

test('installation PWA : une invitation déjà vue avant la refonte ne réapparaît pas', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem('sti-pwa-bulle-vue', '1'));
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#pwaInvitation')).toBeHidden();
  await expect.poll(() => page.evaluate(() => window.STIProfil.invitationInstallationDejaVue())).toBe(true);
});

test('accueil : suivi média v479 et profil fonctionnent ensemble sans double protection', async ({ page }) => {
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toContainText('Le web de');
  await expect.poll(() => page.evaluate(() => typeof window.enregistrerProgressionMediaSTI)).toBe('function');
  await expect(page.locator('script[src*="protection.js"]')).toHaveCount(1);
  await page.evaluate(() => {
    const video = document.getElementById('heroFeaturedVideo');
    Object.defineProperty(video, 'currentTime', { configurable: true, get: () => 42 });
    Object.defineProperty(video, 'duration', { configurable: true, get: () => 100 });
    Object.defineProperty(video, 'paused', { configurable: true, get: () => false });
    video.dispatchEvent(new Event('play'));
    video.dispatchEvent(new Event('timeupdate'));
  });
  await expect.poll(() => page.evaluate(() => window.lireProgressionMediaSTI()['video:css3-cours']?.maxPct)).toBe(42);
  expect(await page.evaluate(() => window.STIProfil.chargerProfil().videos.derniere.id)).toBe('css3-cours');
});

test('accueil : masquer la reprise historique ne détruit pas la progression média', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('sti-media-prog-v1', JSON.stringify({
      'video:sql-cours': { pct: 74, maxPct: 74, sec: 1210, dur: 1635, done: false, ts: Date.now() }
    }));
  });
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#sti-reprendre')).toBeVisible();
  await expect(page.locator('#sti-reprendre')).toContainText('SQL');
  await page.locator('#sti-reprendre-x').click();
  await expect(page.locator('#sti-reprendre')).toHaveCount(0);
  const etat = await page.evaluate(() => window.lireProgressionMediaSTI()['video:sql-cours']);
  expect(etat).toMatchObject({ pct: 74, maxPct: 74, sec: 0, done: false, repriseMasquee: true });
});

test('séries : la modale suit le média et conserve sa position à la fermeture', async ({ page }) => {
  await page.route('**/assets/videos/sql-serie4.mp4', route => route.fulfill({
    status: 200, contentType: 'text/html; charset=utf-8', body: '<!doctype html><title>Test média</title><video controls></video>'
  }));
  await page.goto('/exercices/series-exercices.html', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.evaluate(() => typeof window.enregistrerProgressionMediaSTI)).toBe('function');
  await expect(page.locator('script[src*="protection.js"]')).toHaveCount(1);
  await page.evaluate(() => window.openPdfModal('../assets/videos/sql-serie4.mp4', 'SQL série 4'));
  const video = page.frameLocator('#pdfFrame').locator('video');
  await expect(video).toBeVisible();
  await expect.poll(() => video.evaluate(el => Boolean(el.__stiModalMediaTracked))).toBe(true);
  await video.evaluate(el => {
    Object.defineProperty(el, 'currentTime', { configurable: true, get: () => 48 });
    Object.defineProperty(el, 'duration', { configurable: true, get: () => 200 });
    Object.defineProperty(el, 'paused', { configurable: true, get: () => false });
    el.dispatchEvent(new Event('timeupdate'));
  });
  await expect.poll(() => page.evaluate(() => window.lireProgressionMediaSTI()['video:sql-serie4']?.maxPct)).toBe(24);
  await page.evaluate(() => window.closePdfModal());
  await expect(page.locator('#pdfModal')).not.toHaveClass(/open/);
  expect(await page.evaluate(() => window.lireProgressionMediaSTI()['video:sql-serie4'].sec)).toBe(48);
});

test('retours contextuels des quiz et des exercices vers les bonnes sections de l’accueil', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/quiz/html-css.html', { waitUntil: 'domcontentloaded' });
  await page.getByRole('link', { name:'Retour aux quiz' }).first().click();
  await expect(page).toHaveURL(/\/index\.html#quiz$/);
  await expect(page.locator('#titre-quiz')).toBeInViewport();

  await page.goto('/exercices/series-exercices.html', { waitUntil: 'domcontentloaded' });
  await page.locator('a[href="../index.html#exercices"]').first().click();
  await expect(page).toHaveURL(/\/index\.html#exercices$/);
  await expect(page.locator('#titre-outils')).toBeInViewport();
});

test('les anciens liens par matière restent redirigés vers le bon onglet', async ({ page }) => {
  await page.goto('/exercices/series-exercices.html#javascript', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/cours\/javascript\.html#exercices$/);
  await expect(page.locator('[data-course-tab="exercices"]')).toHaveAttribute('aria-selected', 'true');
});

test('pages de cours et tableau de bord : pas de second chargement de protection', async ({ page }) => {
  for (const chemin of ['/dashboard.html', '/cours/html5.html', '/cours/css3.html', '/cours/javascript.html', '/cours/sql.html', '/cours/php.html']) {
    await page.goto(chemin, { waitUntil: 'domcontentloaded' });
    await expect.poll(() => page.evaluate(() => typeof window.enregistrerProgressionMediaSTI), { message: chemin }).toBe('function');
    await expect(page.locator('script[src*="protection.js"]'), chemin).toHaveCount(1);
  }
});
