import { test, expect } from '@playwright/test';

/* Toutes les identités ci-dessous sont fictives ; aucune connexion réelle n'est validée. */
async function session(page, classe = '4SI 1') {
  // Les migrations du service worker sont testées séparément, sans rechargement concurrent.
  await page.route('**/sw.js*', route => route.abort());
  await page.addInitScript(cl => {
    try {
      const s = { nativeAuthenticated:true, statut:'actif', email:'eleve-test@example.invalid', role:'eleve', classe:cl, lycee:'Lycée Raféha' };
      window.__STI_NATIVE_AUTHENTICATED_V316 = true;
      sessionStorage.setItem('sti-native-session-v316','1');
      sessionStorage.setItem('sti-session-cache', JSON.stringify(s));
      localStorage.setItem('sti-session-cache', JSON.stringify(s));
      localStorage.setItem('sti-demo-vu', '1'); // La démonstration automatique est distincte de ces clics de test.
    } catch (e) { /* Les iframes sandbox d'exécution n'ont pas de stockage. */ }
  }, classe);
}

test('la vraie roue reste unique, interactive et suit les changements GOLD et de thème', async ({ page }) => {
  await session(page);
  await page.goto('/index.html', { waitUntil:'domcontentloaded' });
  const btn = page.locator('#sti-roue-btn');
  await expect(btn).toHaveCount(1); await expect(btn).toBeVisible();
  await expect(page.locator('[data-subscriber-slot] #sti-roue-btn')).toHaveCount(1);
  await page.evaluate(() => { window.__boutonOrigine = document.getElementById('sti-roue-btn'); });
  await btn.click();
  const panneau = page.locator('#sti-roue-wrap .sti-pan');
  await expect(panneau).toHaveClass(/ouvert/);
  for (const id of ['sti-pan-login','sti-pan-lycee','sti-pan-prog-track','sti-roue-btn-ecrire-prof','sti-pan-theme','sti-pan-close-x']) {
    await expect(page.locator('#' + id)).toHaveCount(1);
  }
  await expect(panneau).toContainText('Progression');
  await expect(page.locator('#sti-plan-date')).toHaveAttribute('aria-label', 'Date de l’épreuve du bac');
  await page.evaluate(() => window.dispatchEvent(new StorageEvent('storage', {key:'sti-gold',newValue:'1'})));
  await expect(btn).toHaveAttribute('title', /Mon compte GOLD/);
  await expect.poll(() => btn.evaluate(el => el.style.background)).toMatch(/255, 179, 0|ffb300/i);
  expect(await page.evaluate(() => window.__boutonOrigine === document.getElementById('sti-roue-btn'))).toBe(true);
  await page.locator('#sti-pan-close-x').click(); await expect(panneau).not.toHaveClass(/ouvert/);
  await expect(panneau).toHaveCSS('pointer-events','none');
  await page.locator('[data-set-theme="intermediaire"]').first().click();
  await expect(page.locator('#sti-roue-wrap')).toHaveClass(/sti-theme-sombre/);
  await btn.click(); await page.locator('#sti-pan-theme').click();
  await expect.poll(() => page.evaluate(() => window.STIProfil.chargerProfil().theme)).toBe('clair');
  await expect(page.locator('html')).toHaveAttribute('data-theme','clair');
  await page.locator('#sti-pan-close-x').click();
  await page.goto('/dashboard.html', { waitUntil:'domcontentloaded' });
  await expect(page.locator('#sti-roue-btn')).toBeVisible();
  await page.locator('#dashOuvrirCompte').click();
  await expect(page.locator('#sti-roue-wrap .sti-pan')).toHaveClass(/ouvert/);
  expect(await page.locator('#stiSubDrawer').count()).toBe(0);
});

test('la Cote historique affiche les news de régie, les cotations et se rafraîchit', async ({ page }) => {
  await session(page);
  await page.addInitScript(() => {
    try { sessionStorage.setItem('sti-cote-news-v1', JSON.stringify({ts:Date.now(),etat:{actif:true,liste:[{t:'Message régie test',c:'#ff8800'}]}})); } catch(e) {}
  });
  await page.goto('/index.html', { waitUntil:'domcontentloaded' });
  const piste = page.locator('#cote-piste');
  await expect(piste).toContainText('Message régie test');
  for (const mot of ['HTML5','CSS3','JavaScript','SQL','PHP']) await expect(piste).toContainText(mot);
  await page.evaluate(() => {
    sessionStorage.setItem('sti-cote-news-v1', JSON.stringify({ts:Date.now(),etat:{actif:true,liste:[{t:'Nouveau message régie',c:'#abcdef'}]}}));
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(piste).toContainText('Nouveau message régie');
  await expect(page.locator('#cote-sti')).toBeVisible();
});

test('les trois thèmes survivent aux anciennes pages, et leur bouton met à jour le profil', async ({ page }) => {
  await session(page);
  await page.goto('/index.html', { waitUntil:'domcontentloaded' });
  for (const theme of ['clair','sombre','intermediaire']) {
    await page.locator(`[data-set-theme="${theme}"]`).first().click();
    await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
    expect(await page.evaluate(() => localStorage.getItem('sti-roue-theme'))).toBe(theme);
    expect(await page.evaluate(() => localStorage.getItem('sti-theme'))).toBe(theme === 'clair' ? 'light' : 'dark');
    await page.goto('/cours/courscss3.html', { waitUntil:'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-theme',theme === 'clair' ? 'light' : 'dark');
    await page.goto('/index.html', { waitUntil:'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
    expect(await page.evaluate(() => localStorage.getItem('sti-roue-theme'))).toBe(theme);
    expect(await page.evaluate(() => window.STIProfil.chargerProfil().theme)).toBe(theme);
  }
  await page.goto('/cours/courshtml5.html', { waitUntil:'domcontentloaded' });
  await page.locator('#sti-roue-btn').click(); await page.locator('#sti-pan-theme').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','light');
  await page.goto('/index.html', { waitUntil:'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('data-theme','clair');
  expect(await page.evaluate(() => window.STIProfil.chargerProfil().theme)).toBe('clair');
});

test('HTML5, CSS3 et SQL : la bulle rend exactement le focus, le fragment et le défilement', async ({ page, context }) => {
  await session(page);
  let pages = 0; context.on('page', () => pages++);
  for (const matiere of ['html5','css3','sql']) {
    await page.goto(`/cours/${matiere}.html#exercices`, { waitUntil:'domcontentloaded' });
    const lien = matiere === 'sql' ? page.locator('[data-course-panel="exercices"] a[href$="Tp1-bd.html"]') : page.locator('.exo-card-full a[data-external-doc]').first();
    await lien.scrollIntoViewIfNeeded();
    const avant = await page.evaluate(() => ({hash:location.hash, y:scrollY}));
    await lien.click({modifiers:['Control']});
    const modal = page.locator('.sti-exo-fond'); await expect(modal).toBeVisible();
    await expect(modal.locator('[role="dialog"]')).toHaveAttribute('aria-modal','true');
    await modal.locator('[data-exo-plein]').click(); await expect(modal).toHaveClass(/est-plein/);
    await modal.locator('[data-exo-plein]').click();
    const largeur = await modal.locator('.sti-exo-fenetre').evaluate(e => e.getBoundingClientRect().width);
    await modal.locator('.sti-exo-poignee').focus(); await page.keyboard.press('ArrowLeft');
    expect(await modal.locator('.sti-exo-fenetre').evaluate(e => e.getBoundingClientRect().width)).toBeLessThan(largeur);
    await modal.locator('[data-exo-retour]').click(); await expect(modal).toBeHidden(); await expect(lien).toBeFocused();
    expect(await page.evaluate(() => location.hash)).toBe(avant.hash);
    expect(Math.abs(await page.evaluate(() => scrollY) - avant.y)).toBeLessThan(4);
  }
  expect(pages).toBe(0);
});

test('un retour historique à target top ferme la bulle au lieu de quitter son appelant', async ({ page }) => {
  await session(page); await page.goto('/cours/css3.html#exercices', { waitUntil:'domcontentloaded' });
  const detail = page.locator('[data-course-panel="exercices"] a[href="../projets/site-tunisie/correction-details/carte-timbre-droite-haut.html"]').first();
  await detail.locator('xpath=ancestor::details').evaluate(e => { e.open = true; });
  await detail.click(); const fond = page.locator('.sti-exo-fond'); await expect(fond).toBeVisible();
  const retour = page.frameLocator('.sti-exo-cadre').locator('#retour-cours-top');
  await expect(retour).toBeVisible(); await retour.click();
  await expect(fond).toBeHidden(); await expect(detail).toBeFocused(); await expect(page).toHaveURL(/\/cours\/css3\.html#exercices$/);
});

test('les anciennes séries gardent leur visionneuse et reviennent à leur bouton', async ({ page, context }) => {
  await session(page); await page.goto('/exercices/series-exercices.html', { waitUntil:'domcontentloaded' });
  let pages = 0; context.on('page', () => pages++);
  const bouton = page.locator('button[onclick*="TP1-css.pdf.html"]').first();
  await bouton.click(); const modal = page.locator('#pdfModal'); await expect(modal).toHaveClass(/open/);
  await expect(modal.locator('.modal-close')).toBeFocused();
  expect(await bouton.evaluate(e => e.closest('body > *').inert)).toBe(true);
  await modal.locator('button:visible').first().focus(); await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#pdfFrame')).toBeFocused();
  await page.keyboard.press('Escape'); await expect(modal).not.toHaveClass(/open/); await expect(bouton).toBeFocused();
  await bouton.click(); await page.locator('#modalExpandBtn').click();
  await page.locator('#modalOpenTabBtn').click();
  await expect(modal).not.toHaveClass(/open/); await expect(bouton).toBeFocused();
  await bouton.click();
  await page.evaluate(() => { window.ouvrirEcranPartageEnonceCodeSTI = url => { window.__urlPartageTest = url; }; });
  await page.locator('#modalSplitCodeBtn').click();
  await expect.poll(() => page.evaluate(() => window.__urlPartageTest)).toBe('html-css/TP1-css.pdf.html');
  await expect(modal).not.toHaveClass(/open/); await expect(bouton).toBeFocused();
  expect(pages).toBe(0);
});

test('les anciens liens de matière redirigent vers leur onglet Exercices', async ({ page }) => {
  await session(page); test.setTimeout(90_000);
  for (const [alias, matiere] of [['html','html5'],['css','css3'],['js','javascript'],['bd','sql'],['php','php']]) {
    await page.goto('/exercices/series-exercices.html#' + alias, { waitUntil:'domcontentloaded' });
    await expect(page).toHaveURL(new RegExp('/cours/' + matiere + '\\.html#exercices$'));
    await expect(page.locator('[data-course-tab="exercices"]')).toHaveAttribute('aria-selected','true');
  }
});

test('la signature vidéo historique conserve identifiants, titres et position optionnelle', async ({ page }) => {
  await session(page); test.setTimeout(90_000);
  await page.goto('/cours/sql.html#videos', { waitUntil:'domcontentloaded' });
  for (const [slug, fichier] of [['sql-cours','sql-cours-v7.mp4'],['sql-initiation','sql-construire-requete-guide-texte.mp4'],['sql-serie4','sql-serie4.mp4'],['sql-serie5','sql-serie5.mp4']]) {
    await page.evaluate(slug => window.ouvrirVideoPasAPasSTI(slug, 'Titre personnalisé', 24), slug);
    await expect(page.locator('#sti-video-modal-overlay')).toBeVisible(); await expect(page.locator('#sti-video-modal-title')).toHaveText('Titre personnalisé');
    await expect.poll(() => page.locator('#sti-video-modal-player').getAttribute('src')).toContain(fichier);
    await expect.poll(() => page.locator('#sti-video-modal-player').evaluate(v => v.currentTime), {timeout:15000}).toBeGreaterThanOrEqual(23.5);
    await page.keyboard.press('Escape'); await expect(page.locator('#sti-video-modal-overlay')).toBeHidden();
  }
  // Les anciennes séries non redéfinies passent au lecteur original.
  await page.evaluate(() => window.ouvrirVideoPasAPasSTI('sql-serie2', 'Série historique', 10));
  await expect(page.locator('#sti-video-modal-overlay')).toBeVisible();
  await expect(page.locator('#sti-video-modal-title')).toContainText('Série historique');
  await page.locator('#sti-video-modal-close').click();
  await page.goto('/cours/javascript.html', { waitUntil:'domcontentloaded' });
  await page.evaluate(() => window.ouvrirVideoPasAPasSTI('javascript-cours','Titre JS',17));
  await expect(page.locator('#sti-video-modal-overlay')).toBeVisible(); await expect(page.locator('#sti-video-modal-title')).toHaveText('Titre JS');
  await expect.poll(() => page.locator('#sti-video-modal-player').evaluate(v => v.currentTime), {timeout:15000}).toBeGreaterThanOrEqual(16.5);
});

test('3SI : les liens et URL vidéo Bac restent verrouillés sans toucher à acces.js', async ({ page }) => {
  await session(page, '3SI 1'); await page.goto('/cours/sql.html#videos', { waitUntil:'domcontentloaded' });
  await expect(page.locator('html')).not.toHaveClass(/sti-4si-autorise/);
  for (const slug of ['sql-serie4','sql-serie5','../assets/videos/sql-serie4.mp4','../assets/videos/sql-serie5.mp4']) {
    expect(await page.evaluate(s => window.ouvrirVideoPasAPasSTI(s), slug)).toBe(false);
  }
  await expect(page.locator('#sti-video-modal-overlay')).toBeHidden();
  await page.goto('/cours/php.html', { waitUntil:'domcontentloaded' }); await expect(page.locator('#sti-lock-4si')).toBeVisible();
  await page.goto('/index.html', { waitUntil:'domcontentloaded' });
  await expect(page.locator('#videosGrid .video-card')).toHaveCount(8);
  await expect(page.locator('#videosGrid [data-matiere="php"]')).toHaveCount(0);
  await expect(page.locator('[data-play-video="sql-serie4"]')).toHaveCount(0);
});

test('les changements de thème se propagent entre nouveaux et anciens onglets', async ({ page, context }) => {
  await session(page);
  const second = await context.newPage(); await session(second);
  await page.goto('/index.html', { waitUntil:'domcontentloaded' });
  await second.goto('/dashboard.html', { waitUntil:'domcontentloaded' });
  for (const theme of ['clair','sombre','intermediaire','clair','intermediaire']) {
    await page.locator(`[data-set-theme="${theme}"]`).first().click();
    await expect(second.locator('html')).toHaveAttribute('data-theme',theme);
    await expect.poll(() => second.evaluate(() => window.STIProfil.chargerProfil().theme)).toBe(theme);
    // Vérifier aussi la stabilité après les notifications de stockage en cascade.
    await page.waitForTimeout(300);
    await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
    await expect(second.locator('html')).toHaveAttribute('data-theme',theme);
    expect(await page.evaluate(() => localStorage.getItem('sti-roue-theme'))).toBe(theme);
  }
  const historique = await context.newPage(); await session(historique);
  await historique.goto('/cours/courshtml5.html', { waitUntil:'domcontentloaded' });
  await expect(historique.locator('html')).toHaveAttribute('data-theme','dark');
  await page.waitForTimeout(300);
  await expect(page.locator('html')).toHaveAttribute('data-theme','intermediaire');
  expect(await page.evaluate(() => localStorage.getItem('sti-roue-theme'))).toBe('intermediaire');
  await historique.locator('#sti-roue-btn').click();
  for (const theme of ['clair','sombre']) {
    await historique.locator('#sti-pan-theme').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
    await expect(second.locator('html')).toHaveAttribute('data-theme',theme);
    await expect.poll(() => page.evaluate(() => window.STIProfil.chargerProfil().theme)).toBe(theme);
    await page.waitForTimeout(300);
    await expect(second.locator('html')).toHaveAttribute('data-theme',theme);
    expect(await page.evaluate(() => localStorage.getItem('sti-roue-theme'))).toBe(theme);
  }
  await historique.locator('#sti-roue-btn').click();
  await expect(historique.locator('#sti-plan-date')).toHaveAttribute('aria-label','Date de l’épreuve du bac');
  await historique.close(); await second.close();
});

test('la roue originale reste utilisable sur écran mobile', async ({ page }) => {
  await page.setViewportSize({ width:390, height:844 }); await session(page);
  await page.goto('/index.html', { waitUntil:'domcontentloaded' });
  const btn = page.locator('#sti-roue-btn'); await expect(btn).toBeVisible();
  await page.evaluate(() => { const ev = new Event('beforeinstallprompt', {cancelable:true}); ev.prompt = () => {}; ev.userChoice = Promise.resolve({outcome:'dismissed'}); window.dispatchEvent(ev); });
  await expect(page.locator('#installBtn')).toBeVisible(); await expect(page.locator('#pwaInvitation')).toBeVisible();
  for (const width of [320,360,390,400,401,414,450,480,540,541]) {
    await page.setViewportSize({width,height:844});
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    const logo = await page.locator('.site-header .brand-logo').boundingBox();
    const actions = await page.locator('.header-actions').boundingBox();
    expect(logo.x + logo.width).toBeLessThanOrEqual(actions.x);
  }
  await page.setViewportSize({ width:390, height:844 }); await btn.click();
  const panneau = page.locator('#sti-roue-wrap .sti-pan'); await expect(panneau).toHaveClass(/ouvert/);
  const cadre = await panneau.boundingBox();
  expect(cadre.x).toBeGreaterThanOrEqual(0); expect(cadre.x + cadre.width).toBeLessThanOrEqual(390);
  expect(cadre.y).toBeGreaterThanOrEqual(0); expect(cadre.y + cadre.height).toBeLessThanOrEqual(844);
  const version = page.locator('#sti-pan-version-foot'); await version.scrollIntoViewIfNeeded();
  expect(await version.evaluate(e => { const r=e.getBoundingClientRect(), cible=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2); return !!cible?.closest('.sti-pan'); })).toBe(true);
  await page.locator('#sti-pan-close-x').click(); await expect(panneau).not.toHaveClass(/ouvert/);
});

test('les PDF imbriqués restent en bulle et reviennent au document qui les a ouverts', async ({ page, context }) => {
  await session(page); let pages = 0; context.on('page', () => pages++);
  await page.goto('/cours/html5.html#exercices', { waitUntil:'domcontentloaded' });
  const appelant = page.locator('[data-course-panel="exercices"] a[href="../exercices/html-css/TP1-css.pdf.html"]').first();
  await appelant.click();
  const source = page.frameLocator('.sti-exo-fond:not(.sti-exo-enfant) iframe').locator('a[href="TP1-css.pdf"]');
  await source.click();
  const enfant = page.locator('.sti-exo-enfant'); await expect(enfant).toBeVisible();
  await expect(enfant.locator('iframe')).toHaveAttribute('src', /TP1-css\.pdf$/);
  await enfant.locator('[data-enfant-plein]').click(); await expect(enfant).toHaveClass(/est-plein/);
  await enfant.locator('[data-enfant-retour]').click(); await expect(enfant).toHaveCount(0);
  await expect(source).toBeFocused();
  await page.locator('.sti-exo-fond:not(.sti-exo-enfant) [data-exo-retour]').click(); await expect(appelant).toBeFocused();

  await page.goto('/cours/javascript.html#exercices', { waitUntil:'domcontentloaded' });
  const projet = page.locator('[data-open-js-resource][href*="projet-fleurs-4sti-eleve.pdf.html"]');
  await projet.click();
  const pdfJs = page.frameLocator('#jsResourceFrame').locator('a[href="projet-fleurs-4sti-eleve.pdf"]');
  await pdfJs.click(); await expect(page.locator('.sti-exo-enfant')).toBeVisible();
  await page.locator('[data-enfant-retour]').click(); await expect(pdfJs).toBeFocused();
  await page.locator('#jsResourceExternal').click({button:'middle'}); await expect(page.locator('#jsResourceModal')).toBeHidden(); await expect(projet).toBeFocused();

  await page.goto('/exercices/series-exercices.html', { waitUntil:'domcontentloaded' });
  const bouton = page.locator('button[onclick*="TP1-css.pdf.html"]').first(); await bouton.click();
  const pdfSeries = page.frameLocator('#pdfFrame').locator('a[href="TP1-css.pdf"]');
  await pdfSeries.click(); await expect(page.locator('.sti-exo-enfant')).toBeVisible();
  await page.locator('[data-enfant-fermer]').click(); await expect(pdfSeries).toBeFocused();
  await page.locator('#modalOpenTabBtn').click(); await expect(bouton).toBeFocused();
  expect(pages).toBe(0);
});

test('le grand aperçu historique du corrigé TP2 revient à son étape sans nouvel onglet', async ({ page, context }) => {
  await session(page); let pages = 0; context.on('page', () => pages++);
  await page.goto('/cours/css3.html#exercices', { waitUntil:'domcontentloaded' });
  const lien = page.locator('[data-course-panel="exercices"] a[href="../exercices/html-css/TP2/tp2corrposition.html"]').first();
  await lien.locator('xpath=ancestor::details').evaluate(e => { e.open = true; }); await lien.click();
  const bouton = page.frameLocator('.sti-exo-fond:not(.sti-exo-enfant) iframe').locator('#bOuvrir');
  await bouton.click(); const enfant = page.locator('.sti-exo-enfant'); await expect(enfant).toBeVisible();
  await expect(enfant.locator('iframe')).toHaveAttribute('src', /^blob:/);
  await enfant.locator('[data-enfant-retour]').click(); await expect(bouton).toBeFocused();
  await page.locator('.sti-exo-fond:not(.sti-exo-enfant) [data-exo-retour]').click(); await expect(lien).toBeFocused();
  expect(pages).toBe(0);
});

test('sans lecteur PDF intégré, les séries proposent le téléchargement sans nouvel onglet', async ({ page, context }) => {
  await session(page); await page.addInitScript(() => Object.defineProperty(navigator, 'pdfViewerEnabled', {get:()=>false}));
  let pages = 0; context.on('page', () => pages++);
  await page.goto('/exercices/series-exercices.html', { waitUntil:'domcontentloaded' });
  const bouton = page.locator('button[onclick*="TP1-css.pdf.html"]').first(); await bouton.focus();
  await page.evaluate(() => window.openPdfModal('html-css/TP1-css.pdf', 'TP 1 original'));
  const fond = page.locator('.sti-exo-fond:not(.sti-exo-enfant)'); await expect(fond).toBeVisible();
  await expect(fond.locator('.sti-exo-avertissement')).toBeVisible();
  await expect(fond.locator('.sti-exo-avertissement a')).toHaveAttribute('href', /TP1-css\.pdf$/);
  await fond.locator('[data-exo-retour]').click(); await expect(bouton).toBeFocused();
  expect(pages).toBe(0);
});
