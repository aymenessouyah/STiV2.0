import { test, expect } from '@playwright/test';

for (const ancienne of ['340','341','342','343','344','345','346','347','348','349','350','351','352']) {
  test(`migration réelle du service worker v${ancienne} vers v353 sans boucle de rechargement`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
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
      if (v === '343' || v === '344' || v === '345' || v === '346' || v === '347' || (v === '348' || v === '349' || v === '350')) {
        /* Le profil de la version précédente porte le marqueur v482. */
        await cache.put('/assets/js/profil.js', await fetch('/assets/js/profil.js'));
      } else {
        await cache.put('/assets/js/profil.js',new Response('/* ancien profil */',{headers:{'content-type':'text/javascript'}}));
      }
      if (v === '344' || v === '345' || v === '346' || v === '347' || (v === '348' || v === '349' || v === '350')) {
        /* Le thème et la roue n'ont pas changé depuis v483. */
        for (const chemin of ['/assets/css/theme.css','/assets/js/roue-initiales.js']) {
          await cache.put(chemin, await fetch(chemin));
        }
      } else {
        await cache.put('/assets/js/roue-initiales.js',new Response('/* ancienne roue */',{headers:{'content-type':'text/javascript'}}));
      }
      if (v === '346' || v === '347' || (v === '348' || v === '349' || v === '350')) {
        /* L'accueil et son application ont reçu la vidéo en v485. */
        for (const chemin of ['/index.html','/assets/js/app.js']) await cache.put(chemin, await fetch(chemin));
      }
      if (v === '345' || v === '346' || v === '347' || (v === '348' || v === '349' || v === '350')) {
        await cache.put('/assets/js/mobile-nav.js', await fetch('/assets/js/mobile-nav.js'));
      } else {
        await cache.put('/assets/js/mobile-nav.js',new Response('/* ancienne barre Exercices */',{headers:{'content-type':'text/javascript','content-length':'28292'}}));
      }
      const revisions=await caches.open('sti-update-revisions-v1');
      await revisions.put('/__sti_revision__/'+encodeURIComponent('./assets/css/cours.css')+'?rev=refonte-ui-html5-20261027',new Response('ancienne révision'));
      for (const chemin of ['./index.html','./assets/css/theme.css','./assets/js/app.js','./assets/js/profil.js']) {
        const revision = (v === '348' || v === '349' || v === '350') && chemin === './assets/js/profil.js' ? 'xp-operations-v487' :
          v === '347' && chemin === './assets/js/profil.js' ? 'cours-retour-xp-v486' :
          (v === '346' || v === '347' || (v === '348' || v === '349' || v === '350')) && (chemin === './index.html' || chemin === './assets/js/app.js') ? 'video-js-validation-v485' :
          (v === '344' || v === '345' || v === '346' || v === '347' || (v === '348' || v === '349' || v === '350')) && chemin !== './assets/js/profil.js' ? 'badge-reprise-v483' :
          (v === '343' || v === '344' || v === '345' || v === '346' || v === '347' ? 'accueil-personnalise-v482' : 'fidelite-origine-v481');
        await revisions.put('/__sti_revision__/'+encodeURIComponent(chemin)+'?rev='+revision,new Response('ancienne révision'));
      }
      const revisionRoue = (v === '344' || v === '345' || v === '346' || v === '347' || (v === '348' || v === '349' || v === '350')) ? 'badge-reprise-v483' : 'perf-quiz-php-v474';
      await revisions.put('/__sti_revision__/'+encodeURIComponent('./assets/js/roue-initiales.js')+'?rev='+revisionRoue,new Response('ancienne révision'));
      await revisions.put('/__sti_revision__/'+encodeURIComponent('./assets/js/mobile-nav.js')+'?rev='+(v === '350' ? 'reconnexion-delta-v489' : ((v === '347' || (v === '348' || v === '349' || v === '350')) ? 'cours-retour-xp-v486' : (v === '345' || v === '346') ? 'navigation-videos-mobile-v484' : 'badge-dependances-v483')),new Response('ancienne révision'));
      if (v === '347') {
        // Les anciens scripts sont remplacés, même si leur révision précédente a déjà été appliquée.
        await cache.put('/assets/js/profil.js',new Response('/* profil antérieur */',{headers:{'content-type':'text/javascript'}}));
        await cache.put('/assets/js/quiz-sync.js',new Response('/* synchronisation antérieure */',{headers:{'content-type':'text/javascript'}}));
        await revisions.put('/__sti_revision__/'+encodeURIComponent('./assets/js/quiz-sync.js')+'?rev=cours-retour-xp-v486',new Response('ancienne révision'));
      }
      if (v === '348') {
        // La précédente publication possède l'ancien badge, mais déjà le nouveau protocole XP.
        await cache.put('/assets/js/roue-initiales.js', new Response('/* ancienne roue v348 */'));
        await cache.put('/assets/css/badge-compte.css', new Response('/* ancien badge v348 */'));
        await cache.put('/assets/js/quiz-sync.js', await fetch('/assets/js/quiz-sync.js'));
        await revisions.put('/__sti_revision__/'+encodeURIComponent('./assets/css/badge-compte.css')+'?rev=cours-retour-xp-v486',new Response('ancienne révision'));
        await revisions.put('/__sti_revision__/'+encodeURIComponent('./assets/js/quiz-sync.js')+'?rev=xp-operations-v487',new Response('révision conservée'));
      }
      if (v === '349' || v === '350') {
        // La publication précédente a déjà les ressources du badge v488.
        for (const chemin of ['/assets/js/roue-initiales.js', '/assets/css/badge-compte.css', '/assets/js/quiz-sync.js']) {
          await cache.put(chemin, await fetch(chemin));
        }
        for (const chemin of ['./assets/js/roue-initiales.js', './assets/css/badge-compte.css', './assets/images/badge-compte-vierge.png']) {
          await revisions.put('/__sti_revision__/' + encodeURIComponent(chemin) + '?rev=badge-image-v488', new Response('révision conservée'));
        }
        await revisions.put('/__sti_revision__/' + encodeURIComponent('./assets/js/quiz-sync.js') + '?rev=xp-operations-v487', new Response('révision conservée'));
      }
      if (v === '352') {
        // Simuler la page et son contrôleur précédents déjà installés sur le téléphone.
        await cache.put('/cours/html5.html', new Response('<!doctype html><p>Ancien compteur</p>', {headers:{'content-type':'text/html'}}));
        await cache.put('/assets/js/cours-html5.js', new Response('/* ancien contrôleur de cours */', {headers:{'content-type':'text/javascript'}}));
        for (const [chemin, revision] of [['./cours/html5.html','suivi-contextes-v491'], ['./assets/js/cours-html5.js','refonte-ui-html5-20261027']]) {
          await revisions.put('/__sti_revision__/'+encodeURIComponent(chemin)+'?rev='+revision, new Response('ancienne révision'));
        }
      }
      await cache.put('/assets/js/sqljs/sql-wasm.wasm',new Response('fixture à conserver'));
    }, ancienne);
    let chargements = 0;
    page.on('domcontentloaded', () => { chargements++; });
    await page.goto('/index.html#videos', { waitUntil:'domcontentloaded' }).catch(() => {});
    await expect.poll(async () => { try { return await page.evaluate(() => localStorage.getItem('sti-version-installee')); } catch (e) { return ''; } }, {timeout:20_000}).toBe('353');
    await expect.poll(async () => { try { return await page.evaluate(() => Boolean(navigator.serviceWorker.controller)); } catch (e) { return false; } }, {timeout:20_000}).toBe(true);
    await expect(page.locator('#videosGrid')).toBeVisible();
    // La première activation peut recharger la page, mais ne doit pas tourner en boucle.
    await page.waitForTimeout(1500);
    const chargesApresMigration = chargements;
    await page.waitForTimeout(1500);
    expect(chargements).toBe(chargesApresMigration);
    expect(chargements).toBeLessThanOrEqual(4);
    await expect(page).toHaveURL(/\/index\.html#videos$/);
    await expect(page.locator('#videosGrid .video-card')).toHaveCount(14);
    await expect(page.locator('#sti-bnav [data-cle="videos"]')).toHaveText('Vidéos');
    await expect(page.locator('#sti-bnav [data-cle="exercices"]')).toHaveCount(0);
    /* clients.claim() précède volontairement la copie locale des anciens caches. */
    await expect.poll(() => page.evaluate(async () => (await caches.keys()).filter(n => /^sti-atelier-v(?:34[0123456789]|350|351|352)$/.test(n))), { timeout: 20_000 }).toEqual([]);
    expect(await page.evaluate(async () => {
      const noms = await caches.keys();
      const cache = await caches.open('sti-atelier-v353');
      return { ancien: noms.some(n => /^sti-atelier-v(?:34[0123456789]|350|351|352)$/.test(n)),
        donnee: await (await cache.match('/assets/js/sqljs/sql-wasm.wasm'))?.text(),
        titre: document.title, version: localStorage.getItem('sti-version-affichee') };
    })).toMatchObject({ ancien:false, donnee:'fixture à conserver', version:'492' });
    expect(await page.evaluate(async () => (await (await (await caches.open('sti-atelier-v353')).match('/assets/js/mobile-nav.js', {ignoreSearch:true})).text()))).toContain('lib: "Vidéos"');
    // Les nouveaux modules indispensables sont présents même avant la première visite.
    for (const chemin of ['/assets/js/lecteur-commun.js','/assets/js/retour-quiz.js','/assets/js/appel-quiz.js','/assets/js/suivi-profil.js','/assets/js/reconnexion-profil.js','/assets/css/theme-patrimoine.css','/assets/js/visionneuse-exercices.js','/assets/js/roue-initiales.js','/assets/css/badge-compte.css','/assets/images/badge-compte-vierge.png','/assets/icons/sti-icon-192.png','/assets/images/qr-code-site.png']) {
      await expect.poll(() => page.evaluate(async u => Boolean(await (await caches.open('sti-atelier-v353')).match(u, {ignoreSearch:true})),chemin)).toBe(true);
    }
    if (ancienne === '352') {
      const contenu = await page.evaluate(async () => {
        const cache = await caches.open('sti-atelier-v353');
        return [await (await cache.match('/cours/html5.html')).text(), await (await cache.match('/assets/js/cours-html5.js')).text()];
      });
      expect(contenu[0]).toContain('chapitres consultés');
      expect(contenu[1]).toContain('candidatLecture');
    }
    await page.goto('/cours/css3.html#exercices', {waitUntil:'domcontentloaded'});
    await expect(page.locator('[data-course-tab="exercices"]')).toHaveAttribute('aria-selected','true');
    await expect(page.locator('[data-course-panel="exercices"] a[href="../exercices/html-css/TP1-css.pdf.html"]').first()).toBeVisible();
    // Les anciennes ressources du badge sont remplacées, sans attente d'une première visite.
    await expect.poll(() => page.evaluate(async () => (await (await fetch('/assets/js/roue-initiales.js')).text()).includes('sti-badge-identite__fond'))).toBe(true);
    await expect.poll(() => page.evaluate(async () => (await (await fetch('/assets/css/badge-compte.css')).text()).includes('badge-compte-vierge.png'))).toBe(true);
    // Une ancienne révision marquée ne doit pas figer la feuille de route ni les animations.
    await expect.poll(() => page.evaluate(async () => (await (await fetch('/assets/css/cours.css')).text()).includes('sti-recap-attention'))).toBe(true);
    // Les trois ressources légères de l’accueil sont actualisées même en partant de v342.
    await expect.poll(() => page.evaluate(async () => (await (await fetch('/assets/css/theme.css')).text()).includes('.welcome-return'))).toBe(true);
    await expect.poll(() => page.evaluate(async () => (await (await fetch('/assets/js/app.js')).text()).includes('rendreAccueilPersonnalise'))).toBe(true);
    await expect.poll(() => page.evaluate(async () => (await (await fetch('/assets/js/profil.js')).text()).includes('listerCoursVisites'))).toBe(true);
    await expect.poll(() => page.evaluate(async () => (await (await fetch('/assets/js/quiz-sync.js')).text()).includes('sti_appliquer_gains_xp_quiz'))).toBe(true);
  });
}

test('quiz HTML-CSS déjà visité : retour et compteur restent disponibles hors connexion', async ({ page, context }) => {
  await page.route('https://*.supabase.co/**', route => route.abort());
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    try {
      const s = { nativeAuthenticated:true, statut:'actif', id:'test', email:'test@example.invalid', role:'eleve', classe:'4SI 1' };
      window.__STI_NATIVE_AUTHENTICATED_V316 = true;
      sessionStorage.setItem('sti-native-session-v316','1');
      sessionStorage.setItem('sti-session-cache', JSON.stringify(s));
      localStorage.setItem('sti-session-cache', JSON.stringify(s));
      localStorage.setItem('sti-demo-vu', '1');
    } catch (e) {}
  });
  await page.goto('/index.html', { waitUntil:'domcontentloaded' }).catch(() => {});
  await expect.poll(async () => { try { return await page.evaluate(() => Boolean(navigator.serviceWorker.controller)); } catch { return false; } }, { timeout:20_000 }).toBe(true);
  await page.goto('/quiz/html-css.html', { waitUntil:'domcontentloaded' });
  await expect(page.locator('#sti-quiz-retour-mobile')).toBeVisible();
  await page.evaluate(() => localStorage.setItem('quizzora_xp_v1', JSON.stringify({ xp:250 })));
  for (const chemin of ['/quiz/html-css.html', '/assets/js/quiz-sync.js', '/assets/js/profil.js', '/assets/js/retour-quiz.js']) {
    await expect.poll(() => page.evaluate(async u => Boolean(await caches.match(u, { ignoreSearch:true })), chemin)).toBe(true);
  }
  await context.setOffline(true);
  await page.reload({ waitUntil:'domcontentloaded' });
  await expect(page.locator('#heroScore')).toContainText('250 XP');
  await expect(page.locator('#sti-quiz-retour-mobile')).toBeVisible();
  expect(await page.evaluate(() => Boolean(window.STIProfil && window.STIQuizSync))).toBe(true);
  await context.setOffline(false);
});

test('accueil personnalisé et reprise déjà visités restent disponibles hors connexion', async ({ page, context }) => {
  await page.route('https://*.supabase.co/**', route => route.abort());
  await page.addInitScript(() => {
    try {
      const session = { nativeAuthenticated: true, statut: 'actif', id: 'test', email: 'test@example.invalid', prenom: 'Nour', nom: 'Ben Ali', role: 'eleve', classe: '4SI 1' };
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
  await page.evaluate(() => STIProfil.enregistrerLecture('html5', 'formulaires', 'Formulaires', 42, 'cours/html5.html#formulaires'));
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#welcomeCount')).toHaveText('1 en cours');
  await expect(page.locator('#sti-roue-btn.sti-badge-identite')).toBeVisible();
  await expect(page.locator('#welcomeReturn #resumeBanner')).toBeVisible();
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#welcomeTitle')).toHaveText('Bonjour, Nour');
  await expect(page.locator('#welcomeCount')).toHaveText('1 en cours');
  await expect(page.locator('#welcomeReturn #resumeTitle')).toContainText('Formulaires');
  await expect(page.locator('#sti-roue-btn .sti-badge-identite__avatar')).toHaveText('B.N');
  await expect(page.locator('#sti-roue-anneau')).toHaveAttribute('data-sti-ruban', 'vert');
  await expect(page.locator('.sti-badge-identite__nom')).toHaveText('Nour Ben Ali');
  await expect(page.locator('.sti-badge-identite__fond')).toHaveCSS('background-image', /badge-compte-vierge\.png/);
  expect(await page.evaluate(async () => {
    const image = new Image(); image.src = '/assets/images/badge-compte-vierge.png';
    await image.decode(); return image.naturalWidth;
  })).toBe(2520);
  await page.locator('#resumeGoBtn').click();
  await expect(page).toHaveURL(/\/cours\/html5\.html#formulaires/);
  await expect(page.locator('body')).toBeVisible();
  await expect(page.locator('#courseRingCount')).toHaveText('1 / 10 chapitres consultés');
  await expect(page.locator('#courseRevisedCount')).toHaveText('0 / 10 chapitres révisés');
  await page.goto('/cours/html5.html#entete', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#courseRingCount')).toHaveText('2 / 10 chapitres consultés');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#courseRingCount')).toHaveText('2 / 10 chapitres consultés');
  await context.setOffline(false);
});
