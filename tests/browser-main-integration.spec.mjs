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
  // La vidéo à la une est tirée au hasard : le suivi suit la capsule affichée.
  const idVideo = await page.evaluate(() => document.getElementById('heroFeaturedVideo').dataset.stiVideoId);
  expect(idVideo).toBeTruthy();
  await page.evaluate(() => {
    const video = document.getElementById('heroFeaturedVideo');
    Object.defineProperty(video, 'currentTime', { configurable: true, get: () => 42 });
    Object.defineProperty(video, 'duration', { configurable: true, get: () => 100 });
    Object.defineProperty(video, 'paused', { configurable: true, get: () => false });
    video.dispatchEvent(new Event('play'));
    video.dispatchEvent(new Event('timeupdate'));
  });
  await expect.poll(() => page.evaluate(id => window.lireProgressionMediaSTI()['video:' + id]?.maxPct, idVideo)).toBe(42);
  expect(await page.evaluate(() => window.STIProfil.chargerProfil().videos.derniere.id)).toBe(idVideo);
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

test('accueil : la vidéo à la une change à chaque ouverture et respecte les accès', async ({ page }) => {
  test.setTimeout(120_000);
  const tirages = [];
  for (let i = 0; i < 8; i++) {
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
    const carte = page.locator('.featured-video-card[data-video-a-la-une]');
    await expect(carte).toHaveClass(/is-pret/);
    const etat = await page.evaluate(() => {
      const video = document.getElementById('heroFeaturedVideo');
      return {
        id: video.dataset.stiVideoId,
        source: video.querySelector('source') && video.querySelector('source').getAttribute('src'),
        badge: document.getElementById('heroVideoBadge').textContent.trim(),
        titre: document.getElementById('heroVideoTitre').textContent.trim(),
        overlay: document.getElementById('heroVideoOverlay').getAttribute('aria-label')
      };
    });
    expect(etat.id).toBeTruthy();
    expect(etat.source).toContain('assets/videos/');
    expect(etat.badge).toMatch(/^\S+ · \d\d:\d\d$/);
    expect(etat.titre.length).toBeGreaterThan(5);
    expect(etat.overlay).toContain(etat.titre);
    // Les séries réservées aux 4e SI ne occupent jamais la vitrine.
    expect(['sql-serie4', 'sql-serie5', 'php-cours', 'php-synthese', 'php-guichet']).not.toContain(etat.id);
    tirages.push(etat.id);
  }
  // Huit ouvertures ne doivent pas donner la même capsule : le tirage est aléatoire.
  expect(new Set(tirages).size).toBeGreaterThan(1);
  // Le clic sur l'affiche ouvre bien la capsule annoncée par la carte.
  const dernier = tirages[tirages.length - 1];
  await page.evaluate(() => {
    window.__videoOuverte = null;
    const historique = window.ouvrirVideoPasAPasSTI;
    window.ouvrirVideoPasAPasSTI = function (slug, titre, temps) {
      window.__videoOuverte = slug;
      return historique.apply(this, arguments);
    };
  });
  await page.locator('#heroVideoOverlay').click();
  await expect.poll(() => page.evaluate(() => window.__videoOuverte)).toBe(dernier);
});

test('accueil : la file des gains XP est vidée dès la reconnexion, sans repasser par un quiz', async ({ page }) => {
  const rpc = [];
  page.on('request', r => { if (r.url().includes('/rest/v1/rpc/')) rpc.push(r.url()); });
  await page.route(/vywujxmepvcbgedgmger\.supabase\.co/, route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ confirmes: ['0f8fad5b-d9cb-469f-a165-70867728950e'], valeur: { xp: 250, parties: 1 }, applique: 250, gain_confirme: 250 })
  }));
  const uid = 'eleve-xp';
  const idOperation = '0f8fad5b-d9cb-469f-a165-70867728950e';
  await page.addInitScript(({ uid, idOperation }) => {
    const session = { nativeAuthenticated: true, statut: 'actif', id: uid, email: 'xp@example.invalid', role: 'eleve', classe: '4SI 1' };
    window.__STI_NATIVE_AUTHENTICATED_V316 = true;
    sessionStorage.setItem('sti-native-session-v316', '1');
    sessionStorage.setItem('sti-session-cache', JSON.stringify(session));
    localStorage.setItem('sti-session-cache', JSON.stringify(session));
    // Isolation du compte : la file XP n'est lue que pour cet élève.
    localStorage.setItem('sti-sync-uid', uid);
    localStorage.setItem('quizzora_xp_v1', JSON.stringify({ xp: 250, parties: 1 }));
    // Gain mis en file hors ligne : il doit partir dès le premier accès à l'accueil.
    localStorage.setItem('quiz-xp-operation-v1:' + uid + ':' + idOperation, JSON.stringify({
      id: idOperation, cle: 'quizzora_xp_v1', gain: 250, base: 0, attente: 250, cumulatif: true
    }));
    // Client Supabase fictif minimal : aucune requête réelle, session déjà ouverte.
    const chaine = { select: () => chaine, eq: () => chaine, order: () => chaine, limit: () => chaine,
      single: async () => ({ data: null, error: null }), then: r => Promise.resolve({ data: [], error: null }).then(r) };
    window.__STI_SB_CLIENT = {
      auth: {
        getSession: async () => ({ data: { session: { access_token: 'jeton-fictif', user: { id: uid, email: 'xp@example.invalid' } } } }),
        getUser: async () => ({ data: { user: { id: uid, email: 'xp@example.invalid' } }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } })
      },
      from: () => chaine,
      rpc: async () => ({ data: null, error: null }),
      channel: () => ({ on() { return this; }, subscribe() { return this; } }),
      removeChannel() {}
    };
  }, { uid, idOperation });
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => rpc.length, { timeout: 20_000 }).toBeGreaterThan(0);
  expect(rpc[0]).toMatch(/sti_appliquer_gain_partie_quiz/);
  // La confirmation serveur vide la file locale : aucun renvoi au rechargement.
  await expect.poll(() => page.evaluate(id => localStorage.getItem('quiz-xp-operation-v1:eleve-xp:' + id), idOperation)).toBeNull();
});
