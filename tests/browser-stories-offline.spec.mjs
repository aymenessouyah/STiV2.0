import { test, expect } from '@playwright/test';

/* Service worker réel ; identité fictive et trafic distant neutralisé. */
test('une story vue en ligne reste lisible hors ligne, les autres ne sont pas préchargées', async ({ page, context }) => {
  await page.route('https://*.supabase.co/**', route => route.abort());
  await page.addInitScript(() => {
    try {
      const s = {nativeAuthenticated:true,statut:'actif',id:'hors-ligne-test',email:'stories@example.invalid',prenom:'Amel',role:'eleve',classe:'4SI 1'};
      window.__STI_NATIVE_AUTHENTICATED_V316 = true;
      sessionStorage.setItem('sti-native-session-v316','1'); sessionStorage.setItem('sti-session-cache',JSON.stringify(s));
      localStorage.setItem('sti-session-cache',JSON.stringify(s)); localStorage.setItem('sti-demo-vu','1');
    } catch (e) {}
  });
  await page.goto('/index.html', {waitUntil:'domcontentloaded'});
  await page.evaluate(async () => { await navigator.serviceWorker.register('/sw.js'); await navigator.serviceWorker.ready; });
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)), {timeout:20000}).toBe(true);
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.locator('.story-card')).toHaveCount(5);
  const carte = page.locator('.story-card').first(), id = await carte.getAttribute('data-story');
  const autreId = await page.locator('.story-card').nth(1).getAttribute('data-story');
  await carte.click();
  await expect.poll(() => page.locator('.story-viewer video').evaluate(v => v.currentTime), {timeout:15000}).toBeGreaterThan(.25);
  await expect.poll(() => page.evaluate(async id => Boolean(await (await caches.open('sti-videos-labo-v1')).match('/assets/videos/stories/' + id + '.mp4')), id), {timeout:15000}).toBe(true);
  expect(await page.evaluate(async id => Boolean(await (await caches.open('sti-videos-labo-v1')).match('/assets/videos/stories/' + id + '.mp4')), autreId)).toBe(false);
  await page.keyboard.press('Escape');
  await context.setOffline(true);
  await carte.click();
  await expect.poll(() => page.locator('.story-viewer video').evaluate(v => v.currentTime), {timeout:15000}).toBeGreaterThan(.25);
  await page.getByRole('button', {name:'Story suivante'}).click();
  await expect(page.locator('.story-viewer__status')).toContainText('indisponible');
  await expect(page.getByRole('button', {name:'Réessayer'})).toBeVisible();
  await page.keyboard.press('Escape');
  await context.setOffline(false);
});
