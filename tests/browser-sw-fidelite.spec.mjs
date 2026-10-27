import { test, expect } from '@playwright/test';

for (const ancienne of ['340','341','342']) {
  test(`migration réelle du service worker v${ancienne} vers v343 sans boucle de rechargement`, async ({ page }) => {
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
      await cache.put('/assets/css/theme.css',new Response('/* ancien thème */',{headers:{'content-type':'text/css'}}));
      await cache.put('/assets/js/app.js',new Response('/* ancienne application */',{headers:{'content-type':'text/javascript'}}));
      await cache.put('/assets/js/profil.js',new Response('/* ancien profil */',{headers:{'content-type':'text/javascript'}}));
      const revisions=await caches.open('sti-update-revisions-v1');
      await revisions.put('/__sti_revision__/'+encodeURIComponent('./assets/css/cours.css')+'?rev=refonte-ui-html5-20261027',new Response('ancienne révision'));
      for (const chemin of ['./index.html','./assets/css/theme.css','./assets/js/app.js','./assets/js/profil.js']) {
        await revisions.put('/__sti_revision__/'+encodeURIComponent(chemin)+'?rev=fidelite-origine-v481',new Response('ancienne révision'));
      }
      await cache.put('/assets/js/sqljs/sql-wasm.wasm',new Response('fixture à conserver'));
    }, ancienne);
    let chargements = 0;
    page.on('domcontentloaded', () => { chargements++; });
    await page.goto('/index.html#videos', { waitUntil:'domcontentloaded' }).catch(() => {});
    await expect.poll(async () => { try { return await page.evaluate(() => localStorage.getItem('sti-version-installee')); } catch (e) { return ''; } }, {timeout:20_000}).toBe('343');
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
      const cache = await caches.open('sti-atelier-v343');
      return { ancien: noms.some(n => /^sti-atelier-v34[012]$/.test(n)),
        donnee: await (await cache.match('/assets/js/sqljs/sql-wasm.wasm'))?.text(),
        titre: document.title, version: localStorage.getItem('sti-version-affichee') };
    })).toMatchObject({ ancien:false, donnee:'fixture à conserver', version:'482' });
    // Les nouveaux modules indispensables sont présents même avant la première visite.
    for (const chemin of ['/assets/js/lecteur-commun.js','/assets/js/retour-quiz.js','/assets/css/theme-patrimoine.css','/assets/js/visionneuse-exercices.js']) {
      await expect.poll(() => page.evaluate(async u => Boolean(await (await caches.open('sti-atelier-v343')).match(u, {ignoreSearch:true})),chemin)).toBe(true);
    }
    await page.goto('/cours/css3.html#exercices', {waitUntil:'domcontentloaded'});
    await expect(page.locator('[data-course-tab="exercices"]')).toHaveAttribute('aria-selected','true');
    await expect(page.locator('[data-course-panel="exercices"] a[href="../exercices/html-css/TP1-css.pdf.html"]').first()).toBeVisible();
    // Une ancienne révision marquée ne doit pas figer la feuille de route ni les animations.
    await expect.poll(() => page.evaluate(async () => (await (await fetch('/assets/css/cours.css')).text()).includes('sti-recap-attention'))).toBe(true);
    // Les trois ressources légères de l’accueil sont actualisées même en partant de v342.
    await expect.poll(() => page.evaluate(async () => (await (await fetch('/assets/css/theme.css')).text()).includes('.welcome-return'))).toBe(true);
    await expect.poll(() => page.evaluate(async () => (await (await fetch('/assets/js/app.js')).text()).includes('rendreAccueilPersonnalise'))).toBe(true);
    await expect.poll(() => page.evaluate(async () => (await (await fetch('/assets/js/profil.js')).text()).includes('listerCoursVisites'))).toBe(true);
  });
}

test('accueil personnalisé et reprise déjà visités restent disponibles hors connexion', async ({ page, context }) => {
  await page.route('https://*.supabase.co/**', route => route.abort());
  await page.addInitScript(() => {
    try {
      const session = { nativeAuthenticated: true, statut: 'actif', id: 'test', email: 'test@example.invalid', prenom: 'Nour', role: 'eleve', classe: '4SI 1' };
      window.__STI_NATIVE_AUTHENTICATED_V316 = true;
      sessionStorage.setItem('sti-native-session-v316', '1');
      sessionStorage.setItem('sti-session-cache', JSON.stringify(session));
      localStorage.setItem('sti-session-cache', JSON.stringify(session));
      localStorage.setItem('sti-demo-vu', '1');
    } catch (e) {}
  });
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' }).catch(() => {});
  await expect.poll(async () => { try { return await page.evaluate(() => Boolean(navigator.serviceWorker.controller)); } catch (e) { return false; } }, { timeout: 20_000 }).toBe(true);
  await page.goto('/cours/html5.html', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.evaluate(() => STIProfil.chargerProfil().coursVisites)).toContain('html5');
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#welcomeCount')).toHaveText('1 en cours');
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#welcomeTitle')).toHaveText('Bonjour, Nour');
  await expect(page.locator('#welcomeCount')).toHaveText('1 en cours');
  await page.locator('[data-welcome-course="html5"]').click();
  await expect(page).toHaveURL(/\/cours\/html5\.html/);
  await expect(page.locator('body')).toBeVisible();
  await context.setOffline(false);
});
