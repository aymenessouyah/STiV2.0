import { test, expect } from '@playwright/test';

/* Session fictive limitée à l'interception du navigateur de test :
   les scripts d'accès et les fichiers servis en production restent intacts. */
test.beforeEach(async ({ page }) => {
  await page.route('**/assets/js/config.js*', async route => {
    const response = await route.fetch();
    const original = await response.text();
    const fin = original.indexOf('};') + 2;
    const simulacre = "\nwindow.STI_AUTH.URL = ''; window.__STI_GOLD = true;\n";
    await route.fulfill({ response, body: original.slice(0, fin) + simulacre + original.slice(fin) });
  });
  await page.goto('/cours/css3.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => Boolean(window.STIProfil));
});

async function positionner(page, selecteur, secondes) {
  await page.locator(selecteur).evaluate(async (video, temps) => {
    video.load();
    if (video.readyState < 1) await new Promise((resolve, reject) => {
      video.addEventListener('loadedmetadata', resolve, { once: true });
      video.addEventListener('error', reject, { once: true });
    });
    video.currentTime = temps;
    video.dispatchEvent(new Event('pause'));
  }, secondes);
}

test('les deux MP4 du pas-à-pas ont des positions indépendantes et une reprise dans la playlist', async ({ page }) => {
  const erreurs = [];
  page.on('pageerror', erreur => erreurs.push(erreur.message));
  await expect(page.locator('#pas-a-pas .pas-a-pas-card')).toHaveCount(3);
  for (const [lecteur, fichier] of [['#stepPositionVideo', 'css-positionnement.mp4'], ['#stepDecoVideo', 'css-animee.mp4']]) {
    await expect(page.locator(`${lecteur} source`)).toHaveAttribute('src', `../assets/videos/${fichier}`);
    await expect(page.locator(lecteur)).toHaveAttribute('controls', '');
    await expect(page.locator(lecteur)).toHaveAttribute('preload', 'none');
  }
  await positionner(page, '#stepPositionVideo', 11);
  await positionner(page, '#stepDecoVideo', 9);
  expect(await page.evaluate(() => window.STIProfil.chargerProfil().videos.positions)).toMatchObject({
    'css-positionnement': 11, 'css-animee': 9
  });

  await page.locator('[data-course-tab="videos"]').click();
  await page.locator('[data-playlist="positionnement"]').click();
  await expect(page.locator('#playlistLessonVideoCard')).toBeVisible();
  await expect(page.locator('#playlistLessonLink')).toHaveAttribute('href', '../Positionnement-animee/index.html');
  await expect(page.locator('#playlistLessonVideoCard [data-resume-video]')).toContainText('0:11');
  await page.locator('#playlistLessonVideo').evaluate(video => { video.muted = true; });
  await page.locator('#playlistLessonVideoCard [data-resume-video]').click();
  await expect.poll(() => page.locator('#playlistLessonVideo').evaluate(video => video.currentTime)).toBeGreaterThanOrEqual(11);
  expect(await page.locator('#playlistLessonVideo').evaluate(video => video.paused)).toBe(false);

  /* Même tâche JavaScript : l'événement pause ne peut pas masquer une perte
     des dernières secondes lors du changement de source. */
  const sauvegarde = await page.evaluate(() => {
    document.querySelector('#playlistLessonVideo').currentTime = 23;
    document.querySelector('[data-playlist="cssanimee"]').click();
    return window.STIProfil.chargerProfil().videos.positions;
  });
  expect(sauvegarde['css-positionnement']).toBe(23);
  expect(sauvegarde['css-animee']).toBe(9);
  await expect(page.locator('#playlistLessonVideo')).toHaveAttribute('src', '../assets/videos/css-animee.mp4');
  await expect(page.locator('#playlistLessonVideoCard [data-resume-video]')).toContainText('0:09');
  await expect(page.locator('#playlistLessonLink')).toHaveAttribute('href', '../cssanimee/index.html');
  await page.locator('[data-playlist="background"]').click();
  await expect(page.locator('#playlistLessonVideoCard')).toBeHidden();
  await expect(page.locator('#playlistLessonLink')).toHaveAttribute('href', '../projets/site-tunisie/correction-details/carte-timbre-droite-haut.html');
  expect(erreurs).toEqual([]);
});

test('une seule lecture à la fois et pause lorsque le volet ou l’onglet disparaît', async ({ page }) => {
  await page.locator('#stepPositionVideo').evaluate(async video => { video.muted = true; await video.play(); });
  await page.locator('#stepDecoVideo').evaluate(async video => { video.muted = true; await video.play(); });
  await expect.poll(() => page.locator('#stepPositionVideo').evaluate(video => video.paused)).toBe(true);
  await expect.poll(() => page.locator('#stepDecoVideo').evaluate(video => video.paused)).toBe(false);
  await page.locator('[data-course-tab="videos"]').click();
  expect(await page.locator('#stepDecoVideo').evaluate(video => video.paused)).toBe(true);
  await page.locator('[data-course-tab="cours"]').click();
  await page.locator('#stepPositionVideo').evaluate(async video => { await video.play(); });
  await page.locator('#pas-a-pas-toggle').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#pas-a-pas-toggle')).toHaveAttribute('aria-expanded', 'false');
  expect(await page.locator('#stepPositionVideo').evaluate(video => video.paused)).toBe(true);
});

test('les lecteurs et la playlist restent utilisables au clavier sur mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#pas-a-pas-toggle').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#pas-a-pas-toggle')).toHaveAttribute('aria-expanded', 'false');
  await page.keyboard.press('Enter');
  await expect(page.locator('#stepPositionVideo')).toBeVisible();
  await page.locator('#stepPositionVideo').focus();
  await expect(page.locator('#stepPositionVideo')).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
  await page.locator('[data-course-tab="videos"]').click();
  await page.locator('[data-playlist="cssanimee"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#playlistLessonVideoCard')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
});
