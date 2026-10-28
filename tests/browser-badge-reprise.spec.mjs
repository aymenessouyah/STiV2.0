import { test, expect } from '@playwright/test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const axePath = require.resolve('axe-core/axe.min.js');

/* Comptes, photos et réponses réseau fictifs ; aucune authentification réelle. */
async function preparer(page, options = {}) {
  await page.route('**/sw.js*', route => route.abort());
  await page.route('https://*.supabase.co/**', route => route.abort());
  await page.addInitScript(({ session, profil, uid }) => {
    try {
      window.__STI_NATIVE_AUTHENTICATED_V316 = true;
      sessionStorage.setItem('sti-native-session-v316', '1');
      sessionStorage.setItem('sti-session-cache', JSON.stringify(session));
      localStorage.setItem('sti-session-cache', JSON.stringify(session));
      localStorage.setItem('sti-demo-vu', '1');
      if (profil) localStorage.setItem('sti-profil-abonne', JSON.stringify(profil));
      if (uid) localStorage.setItem('sti-sync-uid', uid);
    } catch (e) { /* Origine opaque des éditeurs sandbox. */ }
  }, {
    session: { nativeAuthenticated: true, statut: 'actif', id: 'abonne', email: 'nour.benali@example.invalid', prenom: 'Nour', nom: 'Ben Ali', role: 'eleve', classe: '3SI 1', lycee: 'Lycée Raféha', ...options.session },
    profil: options.profil || null, uid: options.uid || ''
  });
}

async function ouvrirAccueil(page) {
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#sti-roue-btn.sti-badge-identite')).toBeVisible();
  await expect(page.locator('#welcomeReturn')).toBeVisible();
}

async function changerSession(page, changement) {
  await page.evaluate(c => {
    const session = JSON.parse(localStorage.getItem('sti-session-cache'));
    Object.assign(session, c);
    localStorage.setItem('sti-session-cache', JSON.stringify(session));
    window.__stiRafraichirRoueAvatar();
  }, changement);
}

test('le vrai bouton affiche identité, logo, QR, anneau et notification ; ruban selon le compte', async ({ page }) => {
  await preparer(page);
  await ouvrirAccueil(page);
  const btn = page.locator('#sti-roue-btn');
  const anneau = page.locator('#sti-roue-anneau');
  await expect(btn.locator('.sti-badge-identite__avatar')).toHaveText('B.N');
  await expect(btn.locator('.sti-badge-identite__nom')).toHaveText('Nour Ben Ali');
  await expect(btn.locator('.sti-badge-identite__classe')).toHaveText('3SI 1');
  await expect(btn).toHaveAttribute('aria-label', /Nour Ben Ali.*3SI 1/);
  const fond = btn.locator('.sti-badge-identite__fond');
  await expect(fond).toHaveCSS('background-image', /badge-compte-vierge\.png/);
  await expect(fond).toHaveCSS('background-size', '100% 100%');
  await expect(btn.locator('img')).toHaveCount(0); // Logo et QR sont intégrés au fond CSS.
  await btn.hover();
  const agrandissement = await btn.locator('.sti-badge-identite__copie').evaluate(el => {
    const style = getComputedStyle(el, '::after');
    return { image: style.backgroundImage, width: style.width, height: style.height };
  });
  expect(agrandissement.image).toContain('badge-compte-vierge.png');
  expect(agrandissement).toMatchObject({ width: '336px', height: '336px' });
  await expect(anneau.locator('#sti-roue-badge')).toBeAttached();
  await expect.poll(() => anneau.evaluate(el => getComputedStyle(el).backgroundImage)).toContain('conic-gradient');
  await page.evaluate(() => { window.__boutonAvant = document.getElementById('sti-roue-btn'); window.__panneauAvant = document.querySelector('.sti-pan'); });

  const cas = [
    [{ classe: '3ème SI 2', role: 'eleve', isGold: false }, 'bleu', 'rgb(37, 99, 235)'],
    [{ classe: '4SI 1' }, 'vert', 'rgb(22, 163, 74)'],
    [{ classe: '4ème SI' }, 'vert', 'rgb(22, 163, 74)'],
    [{ classe: 'Professeur' }, 'gold', 'rgb(211, 166, 44)'],
    [{ classe: '3SI1', role: 'enseignante' }, 'gold', 'rgb(211, 166, 44)'],
    [{ classe: '4SI1', role: 'eleve', isGold: true }, 'gold', 'rgb(211, 166, 44)'],
    [{ classe: 'elevelabo3', role: 'prof', isGold: true }, 'orange', 'rgb(249, 115, 22)'],
    [{ classe: 'elevelao3', role: 'prof', isGold: true }, 'orange', 'rgb(249, 115, 22)'],
    [{ classe: '4SI1', email: 'elevelabo3@example.invalid', isGold: true }, 'orange', 'rgb(249, 115, 22)'],
    [{ classe: 'autre', email: 'nour.benali@example.invalid', role: 'eleve', isGold: false }, 'noir', 'rgb(17, 17, 17)']
  ];
  for (const [donnees, ruban, couleur] of cas) {
    await changerSession(page, donnees);
    await expect(anneau).toHaveAttribute('data-sti-ruban', ruban);
    expect(await btn.evaluate(el => getComputedStyle(el, '::after').backgroundColor), ruban).toBe(couleur);
  }
  expect(await page.evaluate(() => window.__boutonAvant === document.getElementById('sti-roue-btn') && window.__panneauAvant === document.querySelector('.sti-pan'))).toBe(true);
  await btn.click();
  await expect(page.locator('.sti-pan')).toHaveClass(/ouvert/);
  expect(await btn.locator('.sti-badge-identite__copie').evaluate(el => getComputedStyle(el, '::after').content)).toBe('none');
  await expect(page.locator('#sti-pan-login')).toBeAttached();
  await expect(page.locator('#sti-pan-theme')).toBeAttached();
  await page.keyboard.press('Escape');
  await expect(page.locator('.sti-pan')).not.toHaveClass(/ouvert/);
});

test('le fond unique masque le QR sans masquer le logo sur mobile, y compris au focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await preparer(page);
  await ouvrirAccueil(page);
  const btn = page.locator('#sti-roue-btn');
  const fond = btn.locator('.sti-badge-identite__fond');
  await expect(fond).toHaveCSS('background-image', /badge-compte-vierge\.png/);
  await expect(fond).toHaveCSS('background-size', '119.75% 100%');
  await expect(btn.locator('.sti-badge-identite__nom')).toHaveText('Nour Ben Ali');
  await btn.focus();
  expect(await btn.locator('.sti-badge-identite__copie').evaluate(el => getComputedStyle(el, '::after').content)).toBe('none');
  // Le fond est cadré à gauche : le logo tient dans le cadre, le QR en sort.
  const facteur = await fond.evaluate(el => parseFloat(getComputedStyle(el).backgroundSize) / 100);
  expect(2046 / 2520 * facteur).toBeLessThan(1);
  expect(2124 / 2520 * facteur).toBeGreaterThan(1);
  await btn.click();
  await expect(page.locator('.sti-pan')).toHaveClass(/ouvert/);
  await page.keyboard.press('Escape');
  await expect(page.locator('.sti-pan')).not.toHaveClass(/ouvert/);
});

test('un nom long reste lisible sans déborder et demeure accessible en entier', async ({ page }) => {
  await preparer(page, { session: { prenom: 'Amel', nom: 'Ben Ali Ben Salah Très Long', classe: '4SI 1' } });
  await ouvrirAccueil(page);
  const nom = page.locator('.sti-badge-identite__nom');
  await expect(nom).toHaveText('Amel Ben Ali Ben Salah Très Long');
  await expect(nom).toHaveAttribute('title', 'Amel Ben Ali Ben Salah Très Long');
  await expect(page.locator('#sti-roue-btn')).toHaveAttribute('aria-label', /Amel Ben Ali Ben Salah Très Long/);
  await expect(nom).toHaveCSS('text-overflow', 'ellipsis');
  expect(await nom.evaluate(el => el.scrollWidth)).toBeGreaterThan(await nom.evaluate(el => el.clientWidth));
});

test('photo validée, loupe, photo en attente, initiales et changement de compte', async ({ page }) => {
  await preparer(page);
  await ouvrirAccueil(page);
  const avatar = page.locator('.sti-badge-identite__avatar');
  const photo = await page.evaluate(() => {
    const c = document.createElement('canvas'); c.width = 2; c.height = 2;
    const ctx = c.getContext('2d'); ctx.fillStyle = 'red'; ctx.fillRect(0, 0, 2, 2);
    return c.toDataURL('image/png');
  });
  await changerSession(page, { photo_url: photo, photo_attente: '' });
  await expect(avatar.locator('img.sti-roue-photo-img')).toHaveAttribute('src', photo);
  await expect.poll(() => avatar.locator('img').evaluate(el => el.naturalWidth)).toBe(2);
  await avatar.hover();
  expect(await page.locator('.sti-badge-identite__copie').evaluate(el => getComputedStyle(el, '::after').content)).toBe('none');
  await expect(page.locator('#sti-site-zoom-photo-pop')).toHaveCSS('visibility', 'visible');
  await expect(page.locator('#sti-site-zoom-photo-pop img')).toHaveAttribute('src', photo);
  await changerSession(page, { photo_url: '', photo_attente: photo, nom: 'Élève', prenom: 'Amel' });
  await expect(avatar).toHaveText('E.A');
  await expect(avatar.locator('img')).toHaveCount(0);
  await expect(page.locator('#sti-site-zoom-photo-pop')).toHaveCSS('visibility', 'hidden');
  await expect(page.locator('#sti-site-zoom-photo-pop img')).not.toHaveAttribute('src');
  await changerSession(page, { photo_url: 'data:image/png;base64,aGVsbG8=' });
  await expect(avatar).toHaveText('E.A');
  await page.evaluate(() => {
    const lire = STIProfil.lireEtatSession;
    STIProfil.lireEtatSession = () => ({ ...lire(), id: 'nouveau', email: 'nouveau@example.invalid', prenomCompte: 'Nour', nom: 'Sassi', classe: '4SI 1' });
    window.__stiRafraichirRoueAvatar();
  });
  await expect(avatar).toHaveText('S.N');
  await expect(page.locator('.sti-badge-identite__nom')).toHaveText('Nour Sassi');
  await expect(page.locator('.sti-badge-identite__classe')).toHaveText('4SI 1');
  await expect(avatar.locator('img')).toHaveCount(0);
  await expect(page.locator('#sti-roue-btn')).toHaveAttribute('aria-label', /Nour Sassi/);
  await expect(page.locator('#sti-roue-anneau')).toHaveAttribute('data-sti-ruban', 'vert');
});

test('le badge suit une session actualisée et retrouve le panneau déplacé sans le remplacer', async ({ page }) => {
  await preparer(page);
  await ouvrirAccueil(page);
  await page.evaluate(() => {
    const c = JSON.parse(localStorage.getItem('sti-session-cache'));
    Object.assign(c, { classe: '4SI 1', nom: 'Sassi', prenom: 'Amel' });
    localStorage.setItem('sti-session-cache', JSON.stringify(c));
    window.dispatchEvent(new StorageEvent('storage', { key: 'sti-session-cache', newValue: JSON.stringify(c) }));
  });
  await expect(page.locator('.sti-badge-identite__avatar')).toHaveText('S.A');
  await expect(page.locator('#sti-roue-anneau')).toHaveAttribute('data-sti-ruban', 'vert');
  await page.waitForTimeout(1500); // Les deux rappels d'amorçage sont terminés.
  await page.evaluate(() => {
    const wrap = document.getElementById('sti-roue-wrap');
    const btn = document.getElementById('sti-roue-btn');
    window.__boutonDeplace = btn;
    window.__panneauDeplace = document.querySelector('.sti-pan');
    btn.textContent = '⚙️';
    btn.classList.remove('sti-badge-identite');
    document.getElementById('sti-roue-anneau').classList.remove('sti-badge-identite__anneau');
    wrap.classList.remove('sti-badge-identite__wrap');
    wrap.remove();
    document.body.appendChild(wrap);
  });
  await expect(page.locator('#sti-roue-btn.sti-badge-identite')).toBeVisible({ timeout: 1000 });
  await expect(page.locator('.sti-badge-identite__avatar')).toHaveText('S.A');
  expect(await page.evaluate(() => window.__boutonDeplace === document.getElementById('sti-roue-btn') && window.__panneauDeplace === document.querySelector('.sti-pan'))).toBe(true);
  await page.locator('#sti-roue-btn').click();
  await expect(page.locator('.sti-pan')).toHaveClass(/ouvert/);
  await page.keyboard.press('Escape');
  await expect(page.locator('.sti-pan')).not.toHaveClass(/ouvert/);
});

test('reprise dans Continuer à apprendre : lien, fermeture durable dans l’onglet et nouvelle lecture', async ({ page }) => {
  await preparer(page, { profil: { coursVisites: ['html5'], derniereLecture: { matiere: 'html5', chapitre: 'Formulaires', chapitreId: 'formulaires', pourcent: 45, url: 'cours/html5.html#formulaires' } } });
  await ouvrirAccueil(page);
  const bandeau = page.locator('#welcomeReturn #resumeBanner');
  await expect(bandeau).toBeVisible();
  await expect(page.locator('.hero #resumeBanner')).toHaveCount(0);
  await expect(page.locator('#resumeKicker')).toContainText('Reprendre ma dernière lecture · 45 %');
  await expect(page.locator('#resumeTitle')).toHaveText('HTML5 — Formulaires');
  await expect(page.locator('#resumeGoBtn')).toHaveAttribute('href', /cours\/html5\.html#formulaires$/);
  await page.locator('#resumeCloseBtn').click();
  await expect(bandeau).toBeHidden();
  await page.evaluate(() => STIProfil.mettreAJour('progression.css3', true));
  await expect(bandeau).toBeHidden();
  await page.evaluate(() => STIProfil.enregistrerLecture('css3', 'selecteurs', 'Sélecteurs', 25, 'cours/css3.html#selecteurs'));
  await expect(bandeau).toBeVisible();
  await expect(page.locator('#resumeTitle')).toHaveText('CSS3 — Sélecteurs');
  await page.locator('#resumeGoBtn').click();
  await expect(page).toHaveURL(/\/cours\/css3\.html#selecteurs$/);
});

test('reprise vidéo : lecteur historique et position transmises depuis le bandeau', async ({ page }) => {
  await preparer(page, { profil: { videos: { derniere: { id: 'css3-cours', matiere: 'css3', titre: 'Vidéo CSS3', temps: 74, duree: 300 } } } });
  await ouvrirAccueil(page);
  await expect(page.locator('#welcomeReturn #resumeBanner')).toBeVisible();
  await expect(page.locator('#resumeKicker')).toContainText('Reprendre ma vidéo');
  await expect(page.locator('#resumeGoBtn')).toHaveAttribute('data-play-video', 'css3-cours');
  await expect(page.locator('#resumeGoBtn')).toHaveAttribute('data-start-time', '74');
  await page.evaluate(() => { window.ouvrirVideoPasAPasSTI = (...args) => { window.__testVideo = args; }; });
  await page.locator('#resumeGoBtn').click();
  await expect.poll(() => page.evaluate(() => window.__testVideo?.[0])).toBe('css3-cours');
  expect(await page.evaluate(() => window.__testVideo[2])).toBe(74);
});

test('la lecture de l’ancien compte est masquée pendant l’isolation et PHP/Bac restent verrouillés', async ({ page }) => {
  await preparer(page, { uid: 'abonne', session: { classe: '3SI 1' }, profil: { derniereLecture: { matiere: 'html5', chapitre: 'Ancienne lecture privée', chapitreId: 'intro', pourcent: 60, url: 'cours/html5.html#intro' } } });
  await ouvrirAccueil(page);
  await expect(page.locator('#resumeBanner')).toBeVisible();
  await page.evaluate(() => {
    const nouveau = { nativeAuthenticated: true, statut: 'actif', id: 'nouveau', email: 'nouveau@example.invalid', prenom: 'Amel', classe: '3SI 1' };
    localStorage.setItem('sti-session-cache', JSON.stringify(nouveau));
    window.dispatchEvent(new StorageEvent('storage', { key: 'sti-session-cache' }));
  });
  await expect(page.locator('#welcomeCount')).toHaveText('Synchronisation des cours…');
  await expect(page.locator('#resumeBanner')).toBeHidden();
  await expect(page.locator('#resumeTitle')).not.toContainText('Ancienne lecture privée');
  await page.evaluate(() => {
    localStorage.removeItem('sti-profil-abonne');
    localStorage.setItem('sti-sync-uid', 'nouveau');
    window.dispatchEvent(new CustomEvent('sti-cloud-restored'));
    STIProfil.enregistrerLecture('php', 'intro', 'PHP privé', 30, 'cours/php.html#intro');
  });
  await expect(page.locator('#resumeBanner')).toBeHidden();
  await page.evaluate(() => STIProfil.enregistrerLecture('sql', 'bac', 'Bac privé', 40, 'cours/sql.html#bac'));
  await expect(page.locator('#resumeBanner')).toBeHidden();
  await page.evaluate(() => STIProfil.enregistrerPositionVideo({ id: 'sql-serie4', matiere: 'sql', titre: 'Vidéo Bac', temps: 80, duree: 300 }));
  await expect(page.locator('#resumeBanner')).toBeHidden();
  await page.evaluate(() => STIProfil.enregistrerLecture('sql', 'intro', 'Introduction', 20, 'cours/sql.html#intro'));
  await expect(page.locator('#resumeBanner')).toBeVisible();
  await expect(page.locator('#resumeTitle')).toHaveText('SQL — Introduction');
});

test('panneau et vrai badge disponibles sur le tableau de bord, les cours et une page historique', async ({ page }) => {
  test.setTimeout(120_000);
  await preparer(page, { session: { classe: '4SI 1' } });
  for (const url of ['/dashboard.html', '/cours/html5.html', '/cours/css3.html', '/cours/javascript.html', '/cours/sql.html', '/cours/php.html', '/cours/courshtml5.html']) {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    const btn = page.locator('#sti-roue-btn.sti-badge-identite');
    await expect(btn, url).toBeVisible();
    await expect(page.locator('#sti-roue-anneau'), url).toHaveAttribute('data-sti-ruban', 'vert');
    await btn.click();
    await expect(page.locator('.sti-pan'), url).toHaveClass(/ouvert/);
    await expect(page.locator('#sti-pan-close-x'), url).toBeAttached();
    await page.keyboard.press('Escape');
    await expect(page.locator('.sti-pan'), url).not.toHaveClass(/ouvert/);
  }
});

test('arrivée tardive du badge : le retour de la bulle garde le défilement exact', async ({ page }) => {
  await preparer(page, { session: { classe: '4SI 1' } });
  await page.route('**/assets/js/roue-initiales.js*', async route => {
    await new Promise(resolve => setTimeout(resolve, 2500));
    await route.continue();
  });
  for (const largeur of [1365, 320]) {
    await page.setViewportSize({ width: largeur, height: 900 });
    await page.goto('/cours/html5.html#exercices', { waitUntil: 'domcontentloaded' });
    const lien = page.locator('.exo-card-full a[data-external-doc]').first();
    await lien.scrollIntoViewIfNeeded();
    const avant = await page.evaluate(() => ({ y: scrollY, hash: location.hash }));
    await lien.click();
    const bulle = page.locator('.sti-exo-fond');
    await expect(bulle).toBeVisible();
    await bulle.locator('[data-exo-retour]').click();
    await expect(bulle).toBeHidden();
    await expect(page.locator('#sti-roue-btn.sti-badge-identite')).toBeVisible();
    await expect(lien).toBeFocused();
    expect(await page.evaluate(() => location.hash), String(largeur)).toBe(avant.hash);
    expect(Math.abs(await page.evaluate(() => scrollY) - avant.y), String(largeur)).toBeLessThan(4);
  }
});

test('trois thèmes et largeurs : panneau accessible, en-tête sans chevauchement ni débordement', async ({ page }) => {
  test.setTimeout(120_000);
  await preparer(page, { profil: { derniereLecture: { matiere: 'html5', chapitre: 'Formulaires', chapitreId: 'formulaires', pourcent: 45, url: 'cours/html5.html#formulaires' } } });
  await ouvrirAccueil(page);
  await page.addScriptTag({ path: axePath });
  for (const theme of ['clair', 'intermediaire', 'sombre']) {
    await page.evaluate(t => STIProfil.mettreAJour('theme', t), theme);
    for (const largeur of [320, 390, 461, 540, 900, 1060, 1200, 1365]) {
      await page.setViewportSize({ width: largeur, height: 900 });
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth), { message: `${theme} ${largeur}` }).toBeLessThanOrEqual(largeur);
      const elements = await page.evaluate(() => {
        const rect = sel => { const r = document.querySelector(sel).getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom }; };
        // v496 : la Cote a quitté l'accueil, le repère devient le contenu principal.
        return { badge: rect('#sti-roue-btn'), marque: rect('.site-header .brand-logo'), contenu: rect('#contenu-principal') };
      });
      expect(elements.badge.left, `${theme} ${largeur}`).toBeGreaterThanOrEqual(0);
      expect(elements.badge.right, `${theme} ${largeur}`).toBeLessThanOrEqual(largeur);
      expect(elements.badge.bottom, `${theme} ${largeur}`).toBeLessThan(elements.contenu.top);
      expect(elements.badge.left, `${theme} ${largeur}`).toBeGreaterThanOrEqual(elements.marque.right - 1);
      if ([320, 390, 1365].includes(largeur)) {
        const violations = await page.evaluate(async () => (await axe.run('#sti-roue-btn', { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } })).violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })));
        expect(violations, `${theme} ${largeur}`).toEqual([]);
      }
    }
  }
  await page.setViewportSize({ width: 320, height: 844 });
  await page.locator('#sti-roue-btn').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.sti-pan')).toHaveClass(/ouvert/);
  const panneau = await page.locator('.sti-pan').boundingBox();
  expect(panneau.y).toBeGreaterThanOrEqual(0);
  expect(panneau.y + panneau.height).toBeLessThanOrEqual(844);
  await page.keyboard.press('Escape');
  await expect(page.locator('.sti-pan')).not.toHaveClass(/ouvert/);
});
