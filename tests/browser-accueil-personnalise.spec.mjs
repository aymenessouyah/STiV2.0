import { test, expect } from '@playwright/test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const axePath = require.resolve('axe-core/axe.min.js');

/* Identités et réponses cloud fictives : aucune authentification réelle. */
async function preparer(page, options = {}) {
  await page.route('**/sw.js*', route => route.abort());
  if (!options.cloud) await page.route('https://*.supabase.co/**', route => route.abort());
  await page.addInitScript(({ classe, prenom, id, profil, pages, uid, jeton }) => {
    try {
      const session = { nativeAuthenticated: true, statut: 'actif', id, email: `${id}@example.invalid`, prenom, role: 'eleve', classe, lycee: 'Lycée Raféha' };
      window.__STI_NATIVE_AUTHENTICATED_V316 = true;
      sessionStorage.setItem('sti-native-session-v316', '1');
      sessionStorage.setItem('sti-session-cache', JSON.stringify(session));
      localStorage.setItem('sti-session-cache', JSON.stringify(session));
      localStorage.setItem('sti-demo-vu', '1');
      if (!sessionStorage.getItem('sti-test-accueil-init')) {
        sessionStorage.setItem('sti-test-accueil-init', '1');
        if (profil) localStorage.setItem('sti-profil-abonne', JSON.stringify(profil));
        if (pages) localStorage.setItem('sti-pages-vues-v432', JSON.stringify(pages));
        if (uid) localStorage.setItem('sti-sync-uid', uid);
        if (jeton) localStorage.setItem('sb-fictif-auth-token', JSON.stringify({ access_token: 'fictif', user: { id, email: session.email } }));
      }
    } catch (e) { /* Les iframes sandbox possèdent une origine opaque. */ }
  }, {
    classe: options.classe || '4SI 1', prenom: options.prenom || 'Aymen', id: options.id || 'aymen',
    profil: options.profil || null, pages: options.pages || null, uid: options.uid || '', jeton: Boolean(options.jeton)
  });
}

async function aller(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => Boolean(window.STIProfil));
}

test('sans session locale, le message personnel est masqué sans supprimer l’accueil', async ({ page }) => {
  await preparer(page);
  await aller(page, '/index.html');
  await expect(page.locator('#welcomeReturn')).toBeVisible();
  await page.evaluate(() => {
    localStorage.removeItem('sti-session-cache');
    sessionStorage.removeItem('sti-session-cache');
    window.dispatchEvent(new StorageEvent('storage', { key: 'sti-session-cache' }));
  });
  await expect(page.locator('#welcomeReturn')).toBeHidden();
  await expect(page.locator('.hero h1')).toBeVisible();
  await expect(page.locator('#cours')).toBeAttached();
});

test('salut, état zéro, visites distinctes, retour et reprise', async ({ page }) => {
  test.setTimeout(120_000);
  await preparer(page); await page.emulateMedia({ reducedMotion: 'reduce' });
  const erreurs = []; page.on('pageerror', e => erreurs.push(e.message));
  await aller(page, '/index.html');
  await expect(page.locator('#welcomeTitle')).toHaveText('Bonjour, Aymen');
  await expect(page.locator('.welcome-return__subtitle')).toHaveText('Continuez à apprendre, ou découvrez quelque chose de nouveau.');
  await expect(page.locator('#welcomeCount')).toHaveText('0 en cours');
  await expect(page.locator('#welcomeEmpty')).toBeVisible();
  await expect(page.locator('#welcomeCourses a')).toHaveCount(0);
  await page.evaluate(() => STIProfil.mettreAJour('progression.css3', true));
  await expect(page.locator('#welcomeCount')).toHaveText('0 en cours');

  await page.locator('[data-subject="html5"] a[href="cours/html5.html"]').first().click();
  await expect(page).toHaveURL(/\/cours\/html5\.html/);
  await expect.poll(() => page.evaluate(() => STIProfil.chargerProfil().coursVisites)).toEqual(['html5']);
  await page.goBack({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#welcomeCount')).toHaveText('1 en cours');
  await expect(page.locator('#welcomeEmpty')).toBeHidden();
  await expect(page.locator('[data-welcome-course="html5"]')).toBeVisible();
  await page.locator('[data-welcome-course="html5"]').click();
  await expect(page).toHaveURL(/\/cours\/html5\.html/);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.evaluate(() => STIProfil.chargerProfil().coursVisites)).toEqual(['html5']);
  await page.evaluate(() => {
    STIProfil.definirEtatChapitre('html5', 'entete', 'revise', 10);
    STIProfil.enregistrerLecture('html5', 'formulaires', 'HTML5 — Formulaires', 90, 'cours/html5.html#formulaires');
  });
  await aller(page, '/index.html');
  await expect(page.locator('#welcomeCount')).toHaveText('1 en cours');
  await expect(page.locator('[data-welcome-course="html5"]')).toHaveAttribute('href', './cours/html5.html#formulaires');
  await expect(page.locator('[data-welcome-course="html5"]')).toContainText('1 / 10 révisés');
  await page.locator('[data-welcome-course="html5"]').click();
  await expect(page).toHaveURL(/cours\/html5\.html#formulaires$/);

  for (const matiere of ['css3', 'javascript', 'sql', 'php']) {
    await aller(page, `/cours/${matiere}.html`);
    await expect.poll(() => page.evaluate(() => STIProfil.chargerProfil().coursVisites[0])).toBe(matiere);
  }
  await aller(page, '/index.html');
  await expect(page.locator('#welcomeCount')).toHaveText('5 en cours');
  await expect(page.locator('#welcomeCourses a')).toHaveCount(5);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#welcomeTitle')).toHaveText('Bonjour, Aymen');
  await expect(page.locator('#welcomeCount')).toHaveText('5 en cours');
  await expect(page.locator('#welcomeCourses a')).toHaveCount(5);
  expect(erreurs).toEqual([]);
});

test('un prénom renseigné après la connexion est repris sans recharger la page', async ({ page }) => {
  await preparer(page);
  await aller(page, '/index.html');
  await expect(page.locator('#sti-pan-login')).toBeAttached();
  await page.evaluate(() => {
    const cache = JSON.parse(localStorage.getItem('sti-session-cache'));
    cache.prenom = 'Nour';
    localStorage.setItem('sti-session-cache', JSON.stringify(cache));
    document.getElementById('sti-pan-login').textContent = 'Nour · élève';
  });
  await expect(page.locator('#welcomeTitle')).toHaveText('Bonjour, Nour');
});

test('anciens historiques : cours uniques, ni exercices ni simple marquage global', async ({ page }) => {
  await preparer(page, {
    profil: { prenom: 'Autre nom', progression: { css3: true }, exercicesFaits: { php: ['tp1'] }, coursVisites: ['javascript', 'javascript', 'invalide'] },
    pages: { 'cours/html5.html': 1, 'cours/courshtml5.html': 1, 'cours/javascript.html': 1, 'cours/sql.html': 0, 'cours/php.html': '0', 'exercices/css3/serie.html': 1 }
  });
  await aller(page, '/index.html');
  await expect(page.locator('#welcomeTitle')).toHaveText('Bonjour, Aymen');
  await expect(page.locator('#welcomeCount')).toHaveText('2 en cours');
  await expect(page.locator('#welcomeCourses a')).toHaveCount(2);
  await expect(page.locator('[data-welcome-course="javascript"]')).toBeVisible();
  await expect(page.locator('[data-welcome-course="html5"]')).toBeVisible();
  await page.evaluate(() => {
    localStorage.setItem('sti-pages-vues-v432', '{malformé');
    window.dispatchEvent(new StorageEvent('storage', { key: 'sti-pages-vues-v432' }));
  });
  await expect(page.locator('#welcomeCount')).toHaveText('1 en cours');
  await page.evaluate(() => {
    localStorage.setItem('sti-pages-vues-v432', JSON.stringify({ 'cours/courscss3.html': 1, 'cours/sql-bases-ldd-lmd-lcd.html': 1 }));
    window.dispatchEvent(new CustomEvent('sti-cloud-restored'));
  });
  await expect(page.locator('#welcomeCount')).toHaveText('3 en cours');
});

test('les restrictions 3SI masquent PHP et empêchent son enregistrement lors du verrou', async ({ page }) => {
  await preparer(page, { classe: '3SI 1', pages: { 'cours/php.html': 1, 'cours/sql.html': 1 } });
  await aller(page, '/index.html');
  await expect(page.locator('#welcomeCount')).toHaveText('1 en cours');
  await expect(page.locator('[data-welcome-course="sql"]')).toContainText('3 chapitres');
  await expect(page.locator('[data-welcome-course="php"]')).toHaveCount(0);
  await aller(page, '/cours/php.html');
  await expect(page.locator('#sti-lock-4si')).toBeVisible();
  expect(await page.evaluate(() => STIProfil.chargerProfil().coursVisites)).not.toContain('php');
  await aller(page, '/index.html');
  await expect(page.locator('#welcomeCount')).toHaveText('1 en cours');
  await expect(page.locator('[data-welcome-course="php"]')).toHaveCount(0);
});

test('appareil partagé : isolation par le vrai synchroniseur et restauration cloud', async ({ page }) => {
  let pulls = 0;
  await page.route('https://*.supabase.co/**', async route => {
    const req = route.request();
    if (req.url().includes('/rest/v1/sti_progressions') && req.method() === 'GET') {
      pulls++;
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{
        maj: '2026-10-27T20:00:00Z', donnees: {
          'sti-profil-abonne': JSON.stringify({ prenom: 'Nour', coursVisites: ['sql'] }),
          'sti-pages-vues-v432': { 'cours/html5.html': 1, 'cours/courshtml5.html': 1, 'cours/javascript.html': 1 }
        }
      }]) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  await preparer(page, {
    cloud: true, id: 'nour', prenom: 'Nour', uid: 'ancien', jeton: true,
    profil: { prenom: 'Ancien élève', coursVisites: ['php', 'css3'] },
    pages: { 'cours/php.html': 1, 'cours/css3.html': 1 }
  });
  await aller(page, '/index.html');
  await expect.poll(() => pulls).toBeGreaterThan(0);
  await expect(page.locator('#welcomeTitle')).toHaveText('Bonjour, Nour');
  await expect(page.locator('#welcomeCount')).toHaveText('3 en cours');
  await expect(page.locator('[data-welcome-course="html5"]')).toBeVisible();
  await expect(page.locator('[data-welcome-course="javascript"]')).toBeVisible();
  await expect(page.locator('[data-welcome-course="sql"]')).toBeVisible();
  await expect(page.locator('[data-welcome-course="php"]')).toHaveCount(0);
  await expect(page.locator('[data-welcome-course="css3"]')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('sti-sync-uid'))).toBe('nour');
});

test('fusionne les visites locales et distantes du même compte après un pull cloud', async ({ page }) => {
  await page.route('https://*.supabase.co/**', async route => {
    const req = route.request();
    if (req.url().includes('/rest/v1/sti_progressions') && req.method() === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{
        maj: '2026-10-27T20:00:00Z', donnees: {
          'sti-profil-abonne': JSON.stringify({ prenom: 'Nour', coursVisites: ['html5'] }),
          'sti-pages-vues-v432': { 'cours/html5.html': 1 }
        }
      }]) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  await preparer(page, { cloud: true, id: 'nour', prenom: 'Nour', uid: 'nour', jeton: true, profil: { prenom: 'Nour', coursVisites: ['css3'] } });
  await aller(page, '/index.html');
  await expect(page.locator('#welcomeCount')).toHaveText('2 en cours');
  await expect(page.locator('[data-welcome-course="css3"]')).toBeVisible();
  await expect(page.locator('[data-welcome-course="html5"]')).toBeVisible();
  expect(await page.evaluate(() => STIProfil.chargerProfil().coursVisites.slice().sort())).toEqual(['css3', 'html5']);
});

test('deux onglets du même compte conservent leurs visites sans boucle de fusion', async ({ page, context }) => {
  await preparer(page, { profil: { coursVisites: ['html5'] } });
  await aller(page, '/index.html');
  const autre = await context.newPage();
  await preparer(autre);
  await aller(autre, '/index.html');
  await autre.evaluate(() => STIProfil.mettreAJour('coursVisites', ['css3']));
  await expect(page.locator('#welcomeCount')).toHaveText('2 en cours');
  await expect(autre.locator('#welcomeCount')).toHaveText('2 en cours');
  const visites = await page.evaluate(() => STIProfil.chargerProfil().coursVisites.slice().sort());
  expect(visites).toEqual(['css3', 'html5']);
  await autre.close();
});

test('changement de compte dans le même onglet : pas de fuite pendant la synchronisation', async ({ page }) => {
  await preparer(page, { id: 'ancien', prenom: 'Ancien', uid: 'ancien', profil: { prenom: 'Ancien', coursVisites: ['php'] } });
  await aller(page, '/index.html');
  await expect(page.locator('#welcomeCount')).toHaveText('1 en cours');
  await page.evaluate(() => {
    const nouveau = { id: 'nouveau', prenom: 'Nour', email: 'nouveau@example.invalid', statut: 'actif', classe: '4SI 1' };
    localStorage.setItem('sti-session-cache', JSON.stringify(nouveau));
    window.dispatchEvent(new StorageEvent('storage', { key: 'sti-session-cache' }));
  });
  await expect(page.locator('#welcomeTitle')).toHaveText('Bonjour, Nour');
  await expect(page.locator('#welcomeCount')).toHaveText('Synchronisation des cours…');
  await expect(page.locator('#welcomeCourses a')).toHaveCount(0);
  await page.evaluate(() => {
    localStorage.removeItem('sti-profil-abonne');
    localStorage.removeItem('sti-pages-vues-v432');
    localStorage.setItem('sti-sync-uid', 'nouveau');
    window.dispatchEvent(new CustomEvent('sti-cloud-restored'));
  });
  await expect(page.locator('#welcomeTitle')).toHaveText('Bonjour, Nour');
  await expect(page.locator('#welcomeCount')).toHaveText('0 en cours');
  await expect(page.locator('#welcomeEmpty')).toBeVisible();
  expect(await page.evaluate(() => STIProfil.chargerProfil().prenom)).toBe('');
  expect(await page.evaluate(() => STIProfil.listerCoursVisites())).toEqual([]);
});

test('changement de compte réel pour le synchroniseur dans le même onglet', async ({ page }) => {
  test.setTimeout(45_000);
  const comptesTires = [];
  await page.route('https://*.supabase.co/**', async route => {
    const req = route.request();
    if (req.url().includes('/rest/v1/sti_progressions') && req.method() === 'GET') {
      const estNouveau = req.url().includes('user_id=eq.nouveau');
      comptesTires.push(estNouveau ? 'nouveau' : 'ancien');
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{
        maj: '2026-10-27T20:00:00Z',
        donnees: { 'sti-profil-abonne': JSON.stringify(estNouveau ? { prenom: 'Nour', coursVisites: ['sql'] } : { prenom: 'Ancien', coursVisites: ['php'] }) }
      }]) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  await preparer(page, { cloud: true, id: 'ancien', prenom: 'Ancien', uid: 'ancien', jeton: true, profil: { prenom: 'Ancien', coursVisites: ['php'] } });
  await aller(page, '/index.html');
  await expect.poll(() => comptesTires).toContain('ancien');
  await expect(page.locator('[data-welcome-course="php"]')).toBeVisible();
  await page.evaluate(() => {
    const nouveau = { nativeAuthenticated: true, id: 'nouveau', prenom: 'Nour', email: 'nouveau@example.invalid', statut: 'actif', classe: '4SI 1' };
    const token = { access_token: 'fictif', user: { id: 'nouveau', email: nouveau.email } };
    localStorage.setItem('sti-session-cache', JSON.stringify(nouveau));
    sessionStorage.setItem('sti-session-cache', JSON.stringify(nouveau));
    localStorage.setItem('sb-fictif-auth-token', JSON.stringify(token));
    window.dispatchEvent(new StorageEvent('storage', { key: 'sti-session-cache' }));
  });
  await expect(page.locator('#welcomeTitle')).toHaveText('Bonjour, Nour');
  await expect(page.locator('#welcomeCount')).toHaveText('Synchronisation des cours…');
  await expect(page.locator('#welcomeCourses a')).toHaveCount(0);
  await expect.poll(() => comptesTires, { timeout: 20_000 }).toContain('nouveau');
  await expect(page.locator('#welcomeCount')).toHaveText('1 en cours');
  await expect(page.locator('[data-welcome-course="sql"]')).toBeVisible();
  await expect(page.locator('[data-welcome-course="php"]')).toHaveCount(0);
});

test('trois thèmes et petits écrans : focus, dimensions et règles WCAG du nouvel accueil', async ({ page }) => {
  test.setTimeout(120_000);
  await preparer(page, { prenom: 'Aïcha <élève>', profil: { coursVisites: ['html5', 'css3', 'javascript'] } });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await aller(page, '/index.html');
  await expect(page.locator('#welcomeTitle')).toHaveText('Bonjour, Aïcha <élève>');
  await expect(page.locator('#welcomePrenom').locator('*')).toHaveCount(0);
  // Attendre la création asynchrone du badge et l'application de sa feuille mobile.
  await expect(page.locator('#sti-roue-btn.sti-badge-identite')).toBeVisible();
  await expect.poll(() => page.evaluate(() => Boolean(document.getElementById('sti-badge-compte-css')?.sheet))).toBe(true);
  await page.addScriptTag({ path: axePath });
  for (const theme of ['clair', 'sombre', 'intermediaire']) {
    await page.evaluate(t => STIProfil.mettreAJour('theme', t), theme);
    for (const largeur of [320, 390, 1365]) {
      await page.setViewportSize({ width: largeur, height: 900 });
      await expect(page.locator('#welcomeReturn')).toBeVisible();
      await expect.poll(() => page.evaluate(() => ({ largeur: document.documentElement.clientWidth, contenu: document.documentElement.scrollWidth }))).toEqual({ largeur, contenu: largeur });
      /* v498 : les boîtes « en cours » tiennent sur une seule ligne défilante.
         Elles peuvent donc dépasser la fenêtre, jamais la piste de défilement. */
      const piste = page.locator('#welcomeCourses');
      const bornes = await piste.evaluate(el => ({ gauche: el.getBoundingClientRect().left, contenu: el.scrollWidth, visible: el.clientWidth }));
      expect(bornes.contenu).toBeGreaterThanOrEqual(bornes.visible);
      for (const lien of await piste.locator('a').all()) {
        const dimensions = await lien.boundingBox();
        expect(dimensions.width).toBeGreaterThan(200);
        expect(dimensions.x).toBeGreaterThanOrEqual(-1);
        expect(dimensions.x + dimensions.width).toBeLessThanOrEqual(bornes.gauche + bornes.contenu + 1);
      }
      const violations = await page.evaluate(async () => (await axe.run('#welcomeReturn', { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } })).violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => n.target) })));
      expect(violations, `${theme}, ${largeur}px`).toEqual([]);
    }
  }
  const lien = page.locator('[data-welcome-course="html5"]');
  await lien.focus();
  await page.evaluate(() => STIProfil.mettreAJour('progression.css3', true));
  await expect(lien).toBeFocused();
});
