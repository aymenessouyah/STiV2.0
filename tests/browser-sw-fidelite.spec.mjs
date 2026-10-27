import { test, expect } from '@playwright/test';

for (const ancienne of ['340','341']) {
  test(`migration réelle du service worker v${ancienne} vers v342 sans boucle de rechargement`, async ({ page }) => {
    // Une identité fictive contourne seulement l'authentification pour ce scénario.
    await page.addInitScript(() => {
      try {
        const s = { nativeAuthenticated:true, statut:'actif', email:'eleve-test@example.invalid', role:'eleve', classe:'4SI 1' };
        window.__STI_NATIVE_AUTHENTICATED_V316 = true;
        sessionStorage.setItem('sti-native-session-v316','1');
        sessionStorage.setItem('sti-session-cache',JSON.stringify(s));
        localStorage.setItem('sti-session-cache',JSON.stringify(s));
      } catch (e) {}
    });
    // Page statique neutre, pour préparer un cache de la version précédente.
    await page.goto('/assets/icons/matieres.svg');
    await page.evaluate(async v => {
      localStorage.setItem('sti-version-installee',v);
      const cache = await caches.open('sti-atelier-v' + v);
      await cache.put('/index.html',new Response('<!doctype html><title>ancien accueil</title><p>ancien accueil</p>', {headers:{'content-type':'text/html'}}));
      await cache.put('/assets/css/cours.css',new Response('/* ancienne feuille de cours */',{headers:{'content-type':'text/css'}}));
      const revisions=await caches.open('sti-update-revisions-v1');
      await revisions.put('/__sti_revision__/'+encodeURIComponent('./assets/css/cours.css')+'?rev=refonte-ui-html5-20261027',new Response('ancienne révision'));
      await cache.put('/assets/js/sqljs/sql-wasm.wasm',new Response('fixture à conserver'));
    }, ancienne);
    let chargements = 0;
    page.on('domcontentloaded', () => { chargements++; });
    await page.goto('/index.html#videos', { waitUntil:'domcontentloaded' }).catch(() => {});
    await expect.poll(async () => { try { return await page.evaluate(() => localStorage.getItem('sti-version-installee')); } catch (e) { return ''; } }, {timeout:20_000}).toBe('342');
    await expect.poll(async () => { try { return await page.evaluate(() => Boolean(navigator.serviceWorker.controller)); } catch (e) { return false; } }, {timeout:20_000}).toBe(true);
    await expect(page.locator('#videosGrid')).toBeVisible();
    // La première activation peut recharger la page, mais ne doit pas tourner en boucle.
    await page.waitForTimeout(1500);
    const chargesApresMigration = chargements;
    await page.waitForTimeout(1500);
    expect(chargements).toBe(chargesApresMigration);
    expect(chargements).toBeLessThanOrEqual(4);
    await expect(page).toHaveURL(/\/index\.html#videos$/);
    await expect(page.locator('#videosGrid .video-card')).toHaveCount(13);
    expect(await page.evaluate(async () => {
      const noms = await caches.keys();
      const cache = await caches.open('sti-atelier-v342');
      return { ancien: noms.some(n => /^sti-atelier-v34[01]$/.test(n)),
        donnee: await (await cache.match('/assets/js/sqljs/sql-wasm.wasm'))?.text(),
        titre: document.title, version: localStorage.getItem('sti-version-affichee') };
    })).toMatchObject({ ancien:false, donnee:'fixture à conserver', version:'481' });
    // Les nouveaux modules indispensables sont présents même avant la première visite.
    for (const chemin of ['/assets/js/lecteur-commun.js','/assets/js/retour-quiz.js','/assets/css/theme-patrimoine.css','/assets/js/visionneuse-exercices.js']) {
      await expect.poll(() => page.evaluate(async u => Boolean(await (await caches.open('sti-atelier-v342')).match(u, {ignoreSearch:true})),chemin)).toBe(true);
    }
    await page.goto('/cours/css3.html#exercices', {waitUntil:'domcontentloaded'});
    await expect(page.locator('[data-course-tab="exercices"]')).toHaveAttribute('aria-selected','true');
    await expect(page.locator('[data-course-panel="exercices"] a[href="../exercices/html-css/TP1-css.pdf.html"]').first()).toBeVisible();
    // Une ancienne révision marquée ne doit pas figer la feuille de route ni les animations.
    await expect.poll(() => page.evaluate(async () => (await (await fetch('/assets/css/cours.css')).text()).includes('sti-recap-attention'))).toBe(true);
  });
}
