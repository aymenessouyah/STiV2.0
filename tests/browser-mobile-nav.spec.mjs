import { test, expect } from '@playwright/test';

/* Identités fictives : les parcours réels restent soumis aux verrous d'accès. */
async function preparer(page, classe = '4SI 1') {
  await page.route('**/sw.js*', route => route.abort());
  await page.route('https://*.supabase.co/**', route => route.abort());
  await page.addInitScript(cl => {
    try {
      const session = { nativeAuthenticated: true, statut: 'actif', id: 'mobile-test', email: 'mobile@example.invalid', prenom: 'Amel', nom: 'Ben Ali', role: 'eleve', classe: cl };
      window.__STI_NATIVE_AUTHENTICATED_V316 = true;
      sessionStorage.setItem('sti-native-session-v316', '1');
      sessionStorage.setItem('sti-session-cache', JSON.stringify(session));
      localStorage.setItem('sti-session-cache', JSON.stringify(session));
      localStorage.setItem('sti-demo-vu', '1');
    } catch (e) { /* Les iframes sandbox n'ont pas accès au stockage. */ }
  }, classe);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
}

test('sur mobile, Vidéos remplace Exercices et rejoint le catalogue sans recharger l’accueil', async ({ page }) => {
  await preparer(page);
  await page.goto('/index.html#cours', { waitUntil: 'domcontentloaded' });
  const nav = page.locator('#sti-bnav');
  const lien = nav.getByRole('link', { name: 'Vidéos', exact: true });
  await expect(nav).toBeVisible();
  await expect(nav.locator('.sti-bnav-i span')).toHaveText(['Accueil', 'Cours', 'Vidéos', 'Quiz', 'Autres']);
  await expect(nav.locator('[data-cle="exercices"]')).toHaveCount(0);
  await expect(lien).toHaveAttribute('href', /\/index\.html#videos$/);
  await expect(lien.locator('svg')).toHaveAttribute('aria-hidden', 'true');
  await expect(nav.locator('[data-cle="cours"]')).toHaveClass(/\bon\b/);

  for (const largeur of [320, 390, 700]) {
    await page.setViewportSize({ width: largeur, height: 844 });
    await expect(nav).toBeVisible();
    const boites = await nav.locator('.sti-bnav-i').evaluateAll(els => els.map(e => {
      const r = e.getBoundingClientRect(); return { left: r.left, right: r.right, width: r.width };
    }));
    expect(boites).toHaveLength(5);
    expect(boites.every(b => b.left >= 0 && b.right <= largeur && b.width > 0)).toBe(true);
  }
  await page.setViewportSize({ width: 701, height: 844 });
  await expect(nav).toBeHidden();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(nav).toBeVisible();

  await page.evaluate(() => { window.__documentMobile = true; });
  await lien.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/index\.html#videos$/);
  await expect(lien).toHaveClass(/\bon\b/);
  await expect(page.locator('#videos')).toBeInViewport({ ratio: 0.01 });
  expect(await page.evaluate(() => window.__documentMobile)).toBe(true);
  await nav.getByRole('link', { name: 'Cours', exact: true }).click();
  await expect(page).toHaveURL(/\/index\.html#cours$/);
  await expect(nav.locator('[data-cle="cours"]')).toHaveClass(/\bon\b/);
  expect(await page.evaluate(() => window.__documentMobile)).toBe(true);
});

test('depuis un cours et les exercices, Vidéos ouvre le catalogue ; les séries restent dans Autres', async ({ page }) => {
  await preparer(page, '3SI 1');
  await page.goto('/cours/html5.html', { waitUntil: 'domcontentloaded' });
  let nav = page.locator('#sti-bnav');
  await expect(nav).toBeVisible();
  await expect(nav.locator('[data-cle="cours"]')).toHaveClass(/\bon\b/);
  await nav.getByRole('link', { name: 'Vidéos', exact: true }).click();
  await expect(page).toHaveURL(/\/index\.html#videos$/);
  await expect(page.locator('#videos')).toBeInViewport({ ratio: 0.01 });
  await expect(page.locator('#videosGrid .video-card')).toHaveCount(8);
  nav = page.locator('#sti-bnav');
  await expect(nav.locator('[data-cle="videos"]')).toHaveClass(/\bon\b/);
  const autres = nav.getByRole('button', { name: 'Autres', exact: true });
  await autres.click();
  await expect(autres).toHaveAttribute('aria-expanded', 'true');
  const series = page.locator('#sti-bnav-sheet').getByRole('link', { name: /Exercices/ });
  await expect(series).toHaveAttribute('href', /\/exercices\/series-exercices\.html$/);
  await series.click();
  await expect(page).toHaveURL(/\/exercices\/series-exercices\.html$/);
  nav = page.locator('#sti-bnav');
  await expect(nav).toBeVisible();
  await expect(nav.locator('[data-cle="autres"]')).toHaveClass(/\bon\b/);
  await nav.getByRole('link', { name: 'Vidéos', exact: true }).click();
  await expect(page).toHaveURL(/\/index\.html#videos$/);
  await expect(page.locator('#sti-bnav [data-cle="videos"]')).toHaveClass(/\bon\b/);
});

test('le lien Vidéos conserve le préfixe de déploiement depuis un cours', async ({ page }) => {
  await preparer(page);
  await page.route('**/STiV2.0/**', async route => {
    const url = new URL(route.request().url());
    url.pathname = url.pathname.replace(/^\/STiV2\.0/, '');
    const reponse = await route.fetch({ url: url.href });
    await route.fulfill({ response: reponse });
  });
  await page.goto('/STiV2.0/cours/html5.html', { waitUntil: 'domcontentloaded' });
  const lien = page.locator('#sti-bnav').getByRole('link', { name: 'Vidéos', exact: true });
  await expect(lien).toBeVisible();
  await expect(lien).toHaveAttribute('href', /\/STiV2\.0\/index\.html#videos$/);
  await lien.click();
  await expect(page).toHaveURL(/\/STiV2\.0\/index\.html#videos$/);
  await expect(page.locator('#videos')).toBeInViewport({ ratio: 0.01 });
  await expect(page.locator('#sti-bnav [data-cle="videos"]')).toHaveClass(/\bon\b/);
  await expect(page.locator('#videosGrid .video-card')).toHaveCount(14);
});
