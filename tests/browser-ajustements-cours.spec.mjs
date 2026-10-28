import { test, expect } from '@playwright/test';

/* Les identités et les réponses cloud sont fictives, sans connexion réelle. */
test.beforeEach(async ({ page }) => {
  await page.route('**/sw.js*', route => route.abort());
  await page.route('https://*.supabase.co/**', route => route.abort());
  await page.addInitScript(() => {
    try {
      const session = { nativeAuthenticated: true, statut: 'actif', id: 'cours-test', email: 'cours@example.invalid', prenom: 'Amel', nom: 'Ben Ali', role: 'eleve', classe: '4SI 1' };
      window.__STI_NATIVE_AUTHENTICATED_V316 = true;
      sessionStorage.setItem('sti-native-session-v316', '1');
      sessionStorage.setItem('sti-session-cache', JSON.stringify(session));
      localStorage.setItem('sti-session-cache', JSON.stringify(session));
      localStorage.setItem('sti-demo-vu', '1');
    } catch (e) { /* Iframes à origine opaque. */ }
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

const cours = ['html5', 'css3', 'javascript', 'sql', 'php'];

test('les objectifs et la feuille de route sont à gauche du lecteur dans les cinq cours', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1365, height: 900 });
  for (const matiere of cours) {
    await page.goto(`/cours/${matiere}.html`, { waitUntil: 'domcontentloaded' });
    const resume = page.locator('.course-hero__grid > [data-sti-feuille-de-route]');
    const video = page.locator('.course-hero__grid > .featured-video-card');
    await expect(resume.getByRole('heading', { name: 'Dans cette leçon' })).toBeVisible();
    await expect(resume.getByRole('heading', { name: 'Feuille de route du cours' })).toBeVisible();
    await expect(video.locator('video').first()).toBeVisible();
    const boites = await Promise.all([resume.boundingBox(), video.boundingBox()]);
    expect(boites[0].x + boites[0].width, matiere).toBeLessThanOrEqual(boites[1].x + 1);
    expect(Math.abs(boites[0].y - boites[1].y), matiere).toBeLessThan(2);
    await page.locator('[data-course-tab="exercices"]').click();
    const etape = resume.locator('[data-feuille-etape]').first();
    const href = await etape.getAttribute('href');
    await etape.click();
    await expect(page.locator('[data-course-tab="cours"]')).toHaveAttribute('aria-selected', 'true');
    await expect(page).toHaveURL(new RegExp(href + '$'));
    await expect(page.locator(href)).toBeVisible();
  }
});

test('la présentation se replie sans débordement sur téléphone', async ({ page }) => {
  test.setTimeout(120_000);
  for (const largeur of [320, 390, 700]) {
    await page.setViewportSize({ width: largeur, height: 844 });
    for (const matiere of cours) {
      await page.goto(`/cours/${matiere}.html`, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('.course-hero__grid > [data-sti-feuille-de-route]')).toBeVisible();
      await expect(page.locator('.course-hero__grid > .featured-video-card video').first()).toBeVisible();
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(largeur);
    }
  }
});

test('les onglets du cours se masquent en descendant et reviennent en remontant sur mobile', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });
  for (const matiere of cours) {
    await page.goto(`/cours/${matiere}.html`, { waitUntil: 'domcontentloaded' });
    const barre = page.locator('.course-tabs-bar');
    await expect(barre).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, document.querySelector('.course-tabs-bar').offsetTop + 500));
    await expect(page.locator('html')).toHaveClass(/sti-barres-cachees/);
    await expect.poll(async () => { const r = await barre.boundingBox(); return r.y + r.height; }).toBeLessThanOrEqual(1);
    // La barre hors écran reste atteignable : le focus clavier la fait revenir.
    await page.keyboard.press('Tab');
    await page.evaluate(() => document.querySelector('[data-course-tab="cours"]').focus({ preventScroll: true }));
    await expect(page.locator('[data-course-tab="cours"]')).toBeFocused();
    await expect.poll(async () => (await barre.boundingBox()).y).toBeGreaterThanOrEqual(0);
    await page.evaluate(() => document.activeElement.blur());
    await page.evaluate(() => window.scrollBy(0, -120));
    await expect(page.locator('html')).not.toHaveClass(/sti-barres-cachees/);
    await expect(barre).toBeVisible();
    await page.locator('#tocMobileOpenBtn').click();
    await expect(page.locator('#courseSidebar')).toHaveClass(/is-open/);
    await page.evaluate(() => window.scrollBy(0, 180));
    await expect(page.locator('html')).not.toHaveClass(/sti-barres-cachees/);
    await expect(barre).toBeVisible();
    await page.locator('#tocMobileCloseBtn').click();
  }
  await page.setViewportSize({ width: 701, height: 844 });
  await page.goto('/cours/html5.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => window.scrollTo(0, document.querySelector('.course-tabs-bar').offsetTop + 500));
  await expect(page.locator('.course-tabs-bar')).toBeVisible();
});

test('le quiz HTML-CSS revient à la bonne origine sur téléphone et ordinateur', async ({ page }) => {
  test.setTimeout(120_000);
  for (const largeur of [390, 1365]) {
    await page.setViewportSize({ width: largeur, height: 900 });
    for (const matiere of ['html5', 'css3']) {
      await page.goto(`/cours/${matiere}.html#exercices`, { waitUntil: 'domcontentloaded' });
      await page.locator('.course-tab--quiz').click();
      await expect(page).toHaveURL(/\/quiz\/html-css\.html\?retour=/);
      const retour = largeur < 700 ? page.locator('#sti-quiz-retour-mobile') : page.locator('.nav-right a[aria-label="Retour au cours"]');
      await expect(retour).toBeVisible();
      await page.reload({ waitUntil: 'domcontentloaded' });
      await expect(retour).toHaveAttribute('href', new RegExp(`/cours/${matiere}\\.html#exercices$`));
      // Un lien intitulé « Page d'accueil » ne doit pas être détourné vers le cours.
      await expect(page.getByRole('link', { name: "Page d'accueil du site" })).toHaveAttribute('href', '../index.html#modules');
      await retour.click();
      await expect(page).toHaveURL(new RegExp(`/cours/${matiere}\\.html#exercices$`));
    }
    await page.goto('/index.html#quiz', { waitUntil: 'domcontentloaded' });
    await page.locator('#quiz a[href="quiz/html-css.html"]').click();
    const retour = largeur < 700 ? page.locator('#sti-quiz-retour-mobile') : page.locator('.nav-right a[aria-label="Retour aux quiz"]');
    await expect(retour).toBeVisible();
    await retour.click();
    await expect(page).toHaveURL(/\/index\.html#quiz$/);
    await expect(page.locator('#quiz')).toBeInViewport({ ratio: 0.01 });
  }
});

test('le retour mobile du quiz tient à 320 px et rejette les destinations non autorisées', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  for (const retour of ['https://exemple.invalid/vol', '//exemple.invalid/cours/html5.html', '/cours/../admin.html', 'javascript:alert(1)']) {
    await page.goto('/quiz/html-css.html?retour=' + encodeURIComponent(retour), { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#sti-quiz-retour-mobile')).toBeVisible();
    await expect(page.locator('#sti-quiz-retour-mobile')).toHaveAttribute('href', /\/index\.html#quiz$/);
    const boite = await page.locator('#sti-quiz-retour-mobile').boundingBox();
    expect(boite.x).toBeGreaterThanOrEqual(0);
    expect(boite.x + boite.width).toBeLessThanOrEqual(320);
  }
  await page.locator('#sti-quiz-retour-mobile').click();
  await expect(page).toHaveURL(/\/index\.html#quiz$/);
});

test('le QR disparaît seulement du badge mobile et le panneau de compte reste utilisable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  const badge = page.locator('#sti-roue-btn.sti-badge-identite');
  await expect(badge).toBeVisible();
  await expect(badge.locator('.sti-badge-identite__fond')).toBeVisible();
  await expect(badge.locator('.sti-badge-identite__fond')).toHaveCSS('background-size', '119.75% 100%');
  await badge.click();
  await expect(page.locator('.sti-pan')).toHaveClass(/ouvert/);
  await page.keyboard.press('Escape');
  await page.locator('.site-qr-shortcut').click();
  await expect(page.locator('#modalContactQr .qr-box img')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 701, height: 844 });
  await expect(badge.locator('.sti-badge-identite__fond')).toHaveCSS('background-size', '100% 100%');
});
