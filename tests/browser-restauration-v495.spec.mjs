import { test, expect } from '@playwright/test';
import axe from 'axe-core';

/* Sessions et requêtes cloud fictives : aucun compte réel n'est sollicité. */
async function preparer(page, { classe = '4SI 1', profil = null } = {}) {
  await page.route('**/sw.js*', route => route.abort());
  await page.route('https://*.supabase.co/**', route => route.abort());
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(({ classe, profil }) => {
    try {
      const session = { nativeAuthenticated: true, statut: 'actif', id: 'v495-test', email: 'v495@example.invalid', prenom: 'Nour', nom: 'Test', role: 'eleve', classe };
      window.__STI_NATIVE_AUTHENTICATED_V316 = true;
      sessionStorage.setItem('sti-native-session-v316', '1');
      sessionStorage.setItem('sti-session-cache', JSON.stringify(session));
      localStorage.setItem('sti-session-cache', JSON.stringify(session));
      localStorage.setItem('sti-demo-vu', '1');
      if (profil && !sessionStorage.getItem('v495-initialise')) {
        sessionStorage.setItem('v495-initialise', '1');
        localStorage.setItem('sti-profil-abonne', JSON.stringify(profil));
      }
    } catch { /* Les aperçus sandbox ont une origine opaque. */ }
  }, { classe, profil });
}

test('les onglets des cinq cours se masquent à la descente et reviennent à la remontée', async ({ page }) => {
  test.setTimeout(120_000);
  await preparer(page);
  await page.setViewportSize({ width: 390, height: 844 });
  for (const matiere of ['html5', 'css3', 'javascript', 'sql', 'php']) {
    await page.goto(`/cours/${matiere}.html`, { waitUntil: 'domcontentloaded' });
    const tabs = page.locator('#stiCourseTabs');
    await expect(tabs).toBeAttached();
    await expect(page.locator('#sti-bnav')).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, document.querySelector('#stiCourseTabs').offsetTop + 700));
    await expect(page.locator('html')).toHaveClass(/sti-barres-cachees/);
    await expect.poll(async () => { const r = await tabs.boundingBox(); return Math.round(r.y + r.height); }).toBeLessThanOrEqual(1);
    await page.evaluate(() => window.scrollBy(0, -160));
    await expect(page.locator('html')).not.toHaveClass(/sti-barres-cachees/);
    await expect(tabs).toBeInViewport({ ratio: 1 });
    const plan = page.locator('#stiPlan');
    await expect(plan).toBeInViewport();
    await plan.click();
    await expect(plan).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#stiSommaire')).toHaveClass(/is-ouvert/);
    await page.locator('#stiSommaireFermer').click();
    await expect(plan).toHaveAttribute('aria-expanded', 'false');
  }
});

test('la reprise affiche le prénom et conserve les états des anciens chapitres', async ({ page }) => {
  await preparer(page, { profil: {
    coursVisites: ['html5', 'sql'],
    chapitres: { html5: { entete: 'en_cours', tableaux: 'revise' }, sql: { intro: 'en_cours', bac: 'revise' } },
    derniereLecture: { matiere: 'html5', chapitreId: 'tableaux', chapitre: 'Tableaux', url: 'cours/html5.html#tableaux' }
  }, classe: '3SI 1' });
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#welcomeReturn')).toBeVisible();
  await expect(page.locator('#welcomeTitle')).toHaveText('Bonjour Nour');
  await expect(page.locator('#welcomeCount')).toHaveText('2 en cours');
  await expect(page.locator('#welcomeReturn')).toContainText('Continuez à apprendre, ou découvrez quelque chose de nouveau.');
  await expect(page.locator('[data-welcome-course="html5"]')).toContainText('2 / 10 chapitres consultés');
  await expect(page.locator('[data-welcome-course="html5"]')).toContainText('1 / 10 révisés');
  await expect(page.locator('[data-welcome-course="sql"]')).toContainText('1 / 3 chapitres consultés');
  await page.locator('[data-welcome-course="html5"]').click();
  await expect(page).toHaveURL(/cours\/html5\.html#cours&ch=h5$/);
  await page.waitForFunction(() => Boolean(window.STIProfil));
  await expect.poll(() => page.evaluate(() => STIProfil.chargerProfil().derniereLecture.chapitreId)).toBe('h5');
  await expect(page.locator('[data-sti-reviser="h5"]')).toHaveAttribute('aria-pressed', 'true');
});

test('le catalogue historique respecte les autorisations et ouvre le lecteur complet', async ({ page }) => {
  await preparer(page, { classe: '3SI 1' });
  await page.goto('/index.html#videos', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#videosGrid .video-card')).toHaveCount(9);
  await expect(page.locator('#videosGrid [data-play-video="sql-serie4"]')).toHaveCount(0);
  await page.locator('#videosGrid [data-play-video="validation-nom-prenom-js"]').click();
  await expect(page.locator('#sti-video-modal-overlay')).toBeVisible();
  await expect(page.locator('#sti-video-modal-overlay')).toHaveAttribute('data-slug', 'validation-nom-prenom-js');
  await page.locator('#sti-video-modal-close').click();
  await page.evaluate(() => window.ouvrirVideoPasAPasSTI('php-cours'));
  await expect(page.locator('#sti-video-modal-overlay')).toBeHidden();
});

test('les cartes reviennent après déconnexion, synchronisation et changement de compte', async ({ page }) => {
  await preparer(page, { classe: '4SI 1', profil: { coursVisites: ['html5'], chapitres: { html5: { tableaux: 'en_cours' } } } });
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-welcome-course="html5"]')).toBeVisible();
  await page.evaluate(() => {
    localStorage.setItem('sti-sync-uid', 'v495-test');
    window.__sessionTestV495 = localStorage.getItem('sti-session-cache');
    localStorage.removeItem('sti-session-cache');
    sessionStorage.removeItem('sti-session-cache');
    window.dispatchEvent(new StorageEvent('storage', { key: 'sti-session-cache' }));
  });
  await expect(page.locator('#welcomeReturn')).toBeHidden();
  await page.evaluate(() => {
    localStorage.setItem('sti-session-cache', window.__sessionTestV495);
    sessionStorage.setItem('sti-session-cache', window.__sessionTestV495);
    window.dispatchEvent(new StorageEvent('storage', { key: 'sti-session-cache' }));
  });
  await expect(page.locator('[data-welcome-course="html5"]')).toBeVisible();
  await page.evaluate(() => {
    localStorage.setItem('sti-sync-uid', 'ancien-autre');
    window.dispatchEvent(new CustomEvent('sti:session-maj'));
  });
  await expect(page.locator('#welcomeCount')).toHaveText('Synchronisation des cours…');
  await expect(page.locator('#welcomeCourses a')).toHaveCount(0);
  await page.evaluate(() => {
    localStorage.setItem('sti-sync-uid', 'v495-test');
    window.dispatchEvent(new CustomEvent('sti-cloud-restored'));
  });
  await expect(page.locator('[data-welcome-course="html5"]')).toBeVisible();
  await page.evaluate(() => {
    const session = { ...JSON.parse(window.__sessionTestV495), id: 'autre', prenom: 'Salma', email: 'autre@example.invalid' };
    localStorage.setItem('sti-session-cache', JSON.stringify(session));
    window.dispatchEvent(new StorageEvent('storage', { key: 'sti-session-cache' }));
  });
  await expect(page.locator('#welcomeCount')).toHaveText('Synchronisation des cours…');
  await expect(page.locator('#welcomeCourses a')).toHaveCount(0);
  await page.evaluate(() => {
    /* Le synchroniseur efface les anciens historiques avant de changer d'UID. */
    localStorage.removeItem('sti-pages-vues-v432');
    localStorage.setItem('sti-sync-uid', 'autre');
    localStorage.setItem('sti-profil-abonne', JSON.stringify({ coursVisites: ['css3'] }));
    window.dispatchEvent(new StorageEvent('storage', { key: 'sti-profil-abonne' }));
  });
  await expect(page.locator('#welcomeTitle')).toHaveText('Bonjour Salma');
  await expect(page.locator('[data-welcome-course="css3"]')).toBeVisible();
  await expect(page.locator('[data-welcome-course="html5"]')).toHaveCount(0);
});

test('le catalogue 4SI montre tous les cours et les quatorze vidéos autorisées', async ({ page }) => {
  await preparer(page, { classe: '4SI 1', profil: { coursVisites: ['php', 'sql'] } });
  await page.goto('/index.html#videos', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('sti-4si-autorise'))).toBe(true);
  await expect(page.locator('#videosGrid .video-card')).toHaveCount(14);
  await expect(page.locator('[data-welcome-course="php"]')).toBeVisible();
  await expect(page.locator('[data-welcome-course="sql"]')).toContainText('/ 4 chapitres');
  await page.locator('#videosGrid [data-play-video="php-cours"]').click();
  await expect(page.locator('#sti-video-modal-overlay')).toBeVisible();
  await expect(page.locator('#sti-video-modal-overlay')).toHaveAttribute('data-slug', 'php-cours');
});

test('à 320 px les cinq cours restent dans le viewport et accessibles au clavier', async ({ page }) => {
  test.setTimeout(150_000);
  await preparer(page);
  await page.setViewportSize({ width: 320, height: 844 });
  for (const matiere of ['html5', 'css3', 'javascript', 'sql', 'php']) {
    await page.goto(`/cours/${matiere}.html`, { waitUntil: 'domcontentloaded' });
    const tabs = page.locator('#stiCourseTabs');
    await expect(tabs).toBeAttached();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth), { message: `largeur ${matiere}` }).toBeLessThanOrEqual(320);
    await page.evaluate(() => window.scrollTo(0, document.querySelector('#stiCourseTabs').offsetTop + 700));
    await expect(page.locator('html')).toHaveClass(/sti-barres-cachees/);
    await page.evaluate(() => window.scrollBy(0, -160));
    await expect(page.locator('html')).not.toHaveClass(/sti-barres-cachees/);
    const cours = page.locator('#stiTabCours'), exercices = page.locator('#stiTabExercices'), plan = page.locator('#stiPlan');
    await expect(cours).toBeInViewport({ ratio: 1 });
    await expect(exercices).toBeInViewport({ ratio: 1 });
    await expect(plan).toBeInViewport({ ratio: 1 });
    await page.addScriptTag({ content: axe.source });
    const violations = await page.evaluate(async () => (await axe.run('#stiCourseTabs')).violations.map(v => v.id));
    expect(violations, `accessibilité des onglets ${matiere}`).toEqual([]);
    await cours.focus();
    await page.keyboard.press('ArrowRight');
    await expect(exercices).toBeFocused();
    await expect(exercices).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowLeft');
    await expect(cours).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(plan).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(plan).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#stiSommaireFermer')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(plan).toHaveAttribute('aria-expanded', 'false');
    await expect(plan).toBeFocused();
    await plan.blur();
    await page.evaluate(() => window.scrollTo(0, document.querySelector('#stiCourseTabs').offsetTop + 700));
    await expect(page.locator('html')).toHaveClass(/sti-barres-cachees/);
    await page.evaluate(() => document.querySelector('#stiTabCours').focus({ preventScroll: true }));
    await expect(tabs).toBeInViewport({ ratio: 1 });
  }
});
