import { test, expect } from '@playwright/test';

test.use({serviceWorkers:'block'});

test('la pause QR reste active pour le lecteur historique complet', async ({page}) => {
  await page.route('https://*.supabase.co/**', r => r.abort());
  await page.route('**/assets/js/config.js*', async r => {
    const rep = await r.fetch(), source = await rep.text(), fin = source.indexOf('};') + 2;
    await r.fulfill({response:rep, body:source.slice(0,fin)+"\nwindow.STI_AUTH.URL=''; window.__STI_GOLD=true;\n"+source.slice(fin)});
  });
  await page.addInitScript(() => {
    try {
      const s = {nativeAuthenticated:true,statut:'actif',id:'qr-test',email:'qr@example.invalid',prenom:'Amel',role:'eleve',classe:'4SI 1'};
      window.__STI_NATIVE_AUTHENTICATED_V316=true;
      sessionStorage.setItem('sti-native-session-v316','1');sessionStorage.setItem('sti-session-cache',JSON.stringify(s));
      localStorage.setItem('sti-session-cache',JSON.stringify(s));localStorage.setItem('sti-demo-vu','1');
    } catch(e) {}
  });
  await page.goto('/index.html',{waitUntil:'domcontentloaded'});
  await page.locator('.story-card[data-story="intro"]').click();
  await page.getByRole('button',{name:'Voir la vidéo complète'}).click();
  await expect(page.locator('#sti-video-modal-overlay')).toBeVisible();
  const lecteur = page.locator('#sti-video-modal-player');
  await lecteur.evaluate(async video => {
    video.muted=true;
    if (video.readyState < 1) await new Promise((resolve,reject)=>{
      video.addEventListener('loadedmetadata',resolve,{once:true});video.addEventListener('error',reject,{once:true});
    });
    video.currentTime=video.duration*.55;
    await video.play();
  });
  await expect(page.locator('#sti-video-course-pause-overlay')).toBeVisible({timeout:15000});
  expect(await lecteur.evaluate(v=>v.paused)).toBe(true);
  await page.locator('#sti-video-course-pause-resume').click();
  await expect(page.locator('#sti-video-course-pause-overlay')).toBeHidden();
  await page.keyboard.press('Escape');
});
