import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const worker = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
const cacheVersion = worker.match(/var CACHE = "sti-atelier-v(\d+)"/)[1];
const versionAffichee = worker.match(/var UPDATE_ID = "v(\d+)-/)[1];

/* Identités et réponses réseau fictives ; les scripts d'accès restent intacts. */
async function preparer(page, { classe = '4SI 1', profil = null } = {}) {
  await page.route('https://*.supabase.co/**', route => route.abort());
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(({ classe, profil, cacheVersion, versionAffichee }) => {
    try {
      const session = { nativeAuthenticated: true, statut: 'actif', id: 'eleve-test', email: 'eleve-test@example.invalid', role: 'eleve', classe, prenom: 'Nour' };
      window.__STI_NATIVE_AUTHENTICATED_V316 = true;
      sessionStorage.setItem('sti-native-session-v316', '1');
      sessionStorage.setItem('sti-session-cache', JSON.stringify(session));
      localStorage.setItem('sti-session-cache', JSON.stringify(session));
      localStorage.setItem('sti-version-installee', cacheVersion);
      localStorage.setItem('sti-version-affichee', versionAffichee);
      localStorage.setItem('sti-demo-vu', '1');
      if (profil && !sessionStorage.getItem('profil-test-initialise')) {
        sessionStorage.setItem('profil-test-initialise', '1');
        localStorage.setItem('sti-profil-abonne', JSON.stringify(profil));
      }
    } catch (e) { /* Les aperçus sandbox ont une origine opaque. */ }
  }, { classe, profil, cacheVersion, versionAffichee });
}

/* Sur téléphone, les onglets masqués se rouvrent par une remontée avant le clic. */
async function montrerNavigation(page) {
  await expect(page.locator('#sti-bnav')).toBeVisible();
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollBy(0, -120);
  });
  await expect(page.locator('html')).not.toHaveClass(/sti-barres-cachees/);
}

const cours = [
  { nom: 'html5', premier: 'entete', suivant: 'structuration', total: 10, texte: '#courseRingCount', pct: '#courseRingPct' },
  { nom: 'css3', premier: 'selecteurs', suivant: 'typographie', total: 10, texte: '#courseRingCount', pct: '#courseRingPct' },
  { nom: 'javascript', premier: 'sec1', suivant: 'sec2', total: 15, texte: '#courseRingCount', pct: '#courseRingPct' },
  { nom: 'sql', premier: 'intro', suivant: 'ldd', total: 4, texte: '#courseProgressText', pct: '#courseProgressPct' },
  { nom: 'php', premier: 's1', suivant: 's2', total: 10, texte: '#courseProgressText', pct: '#courseProgressPct' }
];

for (const c of cours) {
  test(`${c.nom} : les visites, le marqueur volontaire et la reprise restent distincts`, async ({ page }) => {
    await preparer(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/cours/${c.nom}.html#${c.premier}`, { waitUntil: 'domcontentloaded' });
    await expect.poll(() => page.evaluate(([nom, chapitre]) => STIProfil.chargerProfil().chapitres[nom][chapitre], [c.nom, c.premier])).toBe('en_cours');
    await expect(page.locator(c.texte)).toHaveText(`1 / ${c.total} chapitres consultés`);
    await expect(page.locator(c.pct)).toHaveText(`${Math.round(100 / c.total)}%`);
    await expect(page.locator('#courseRevisedCount')).toHaveText(`0 / ${c.total} chapitres révisés`);
    await expect(page.locator('#tocMobileCount')).toHaveText(`1/${c.total}`);
    expect(await page.evaluate(nom => STIProfil.chargerProfil().progression[nom], c.nom)).toBe(false);

    const bouton = page.locator(`[data-toggle-revise="${c.premier}"]`);
    await bouton.click();
    await expect(bouton).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#courseRevisedCount')).toHaveText(`1 / ${c.total} chapitres révisés`);
    await expect(page.locator(c.texte)).toHaveText(`1 / ${c.total} chapitres consultés`);
    await bouton.click();
    await expect(bouton).toHaveAttribute('aria-pressed', 'false');
    expect(await page.evaluate(([nom, chapitre]) => STIProfil.chargerProfil().chapitres[nom][chapitre], [c.nom, c.premier])).toBe('en_cours');
    await expect(page.locator('#courseRevisedCount')).toHaveText(`0 / ${c.total} chapitres révisés`);
    await expect(page.locator(c.texte)).toHaveText(`1 / ${c.total} chapitres consultés`);

    await montrerNavigation(page);
    await page.locator('#tocMobileOpenBtn').click();
    await page.locator(`#courseSidebar a[href="#${c.suivant}"]`).click();
    await expect.poll(() => page.evaluate(([nom, chapitre]) => STIProfil.chargerProfil().chapitres[nom][chapitre], [c.nom, c.suivant])).toBe('en_cours');
    await expect(page.locator(c.texte)).toHaveText(`2 / ${c.total} chapitres consultés`);
    await expect(page.locator('#tocMobileCount')).toHaveText(`2/${c.total}`);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator(c.texte)).toHaveText(`2 / ${c.total} chapitres consultés`);
    await expect(page.locator('#courseRevisedCount')).toHaveText(`0 / ${c.total} chapitres révisés`);
    await expect.poll(() => page.evaluate(() => STIProfil.chargerProfil().derniereLecture.chapitreId)).toBe(c.suivant);
    await page.waitForTimeout(1200);
    expect(await page.evaluate(() => STIProfil.chargerProfil().derniereLecture.chapitreId)).toBe(c.suivant);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
  });
}

for (const c of cours) {
  test(`${c.nom} : exercices et en-tête ne créent pas de fausse visite ; lecture visible enregistrée`, async ({ page }) => {
    await preparer(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/cours/${c.nom}.html#exercices`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#exercices')).toBeVisible();
    await page.waitForTimeout(900);
    expect(await page.evaluate(nom => STIProfil.chargerProfil().chapitres[nom], c.nom)).toEqual({});
    await montrerNavigation(page);
    await page.locator('[data-course-tab="cours"]').click();
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(700);
    expect(await page.evaluate(nom => STIProfil.chargerProfil().chapitres[nom], c.nom)).toEqual({});
    /* Le haut du chapitre à 205 px reproduit l'ancre sous l'en-tête mobile. */
    await page.locator(`#${c.premier}`).evaluate(section => window.scrollTo({ top: window.scrollY + section.getBoundingClientRect().top - 205, behavior: 'instant' }));
    await expect.poll(() => page.evaluate(([nom, chapitre]) => STIProfil.chargerProfil().chapitres[nom][chapitre], [c.nom, c.premier])).toBe('en_cours');
    await expect(page.locator(c.texte)).toHaveText(`1 / ${c.total} chapitres consultés`);
  });
}

test('anciens états, restauration cloud dans le même onglet et synchronisation entre onglets', async ({ page, context }) => {
  await preparer(page, { profil: { chapitres: { html5: { entete: 'en_cours', structuration: 'revise', conteneurs: 'a_reviser', ancien: 'revise' } } } });
  await page.goto('/cours/html5.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#courseRingCount')).toHaveText('2 / 10 chapitres consultés');
  await expect(page.locator('#courseRevisedCount')).toHaveText('1 / 10 chapitres révisés');
  await expect(page.locator('#courseRingPct')).toHaveText('20%');
  await page.evaluate(() => {
    const p = STIProfil.chargerProfil();
    p.chapitres.html5.listes = 'en_cours';
    localStorage.setItem('sti-profil-abonne', JSON.stringify(p));
    window.dispatchEvent(new CustomEvent('sti-cloud-restored'));
  });
  await expect(page.locator('#courseRingCount')).toHaveText('3 / 10 chapitres consultés');
  await expect(page.locator('#courseRevisedCount')).toHaveText('1 / 10 chapitres révisés');

  const autre = await context.newPage();
  await preparer(autre);
  await autre.goto('/cours/html5.html#tableaux', { waitUntil: 'domcontentloaded' });
  await expect(autre.locator('#courseRingCount')).toHaveText('4 / 10 chapitres consultés');
  await expect.poll(() => autre.evaluate(() => STIProfil.chargerProfil().chapitres.html5.tableaux)).toBe('en_cours');
  await expect(page.locator('#courseRingCount')).toHaveText('4 / 10 chapitres consultés');
  await autre.close();
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-welcome-course="html5"]')).toContainText('4 / 10 chapitres consultés');
  await expect(page.locator('[data-welcome-course="html5"]')).toContainText('1 / 10 révisés');
});

test('les restrictions 3SI restent actives et ne comptent pas les chapitres interdits', async ({ page }) => {
  await preparer(page, { classe: '3SI 1', profil: { chapitres: { sql: { bac: 'revise' } } } });
  await page.goto('/cours/sql.html#bac', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).not.toHaveClass(/sti-4si-autorise/);
  await expect(page.locator('#bac')).toBeHidden();
  await expect(page.locator('#courseProgressText')).toHaveText('0 / 3 chapitres consultés');
  await expect(page.locator('#courseRevisedCount')).toHaveText('0 / 3 chapitres révisés');
  await expect(page.locator('#tocMobileCount')).toHaveText('0/3');
  await page.goto('/cours/php.html#s1', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#sti-lock-4si')).toBeVisible();
  await page.waitForTimeout(900);
  expect(await page.evaluate(() => STIProfil.chargerProfil().chapitres.php)).toEqual({});
});

for (const c of cours) {
  test(`${c.nom} : restauration cloud immédiate des visites et révisions sans rechargement`, async ({ page }) => {
    await preparer(page);
    await page.goto(`/cours/${c.nom}.html#exercices`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#exercices')).toBeVisible();
    await page.evaluate(({ nom, premier, suivant }) => {
      const p = STIProfil.chargerProfil();
      p.chapitres[nom][premier] = 'revise';
      p.chapitres[nom][suivant] = 'en_cours';
      localStorage.setItem('sti-profil-abonne', JSON.stringify(p));
      window.dispatchEvent(new CustomEvent('sti-cloud-restored'));
    }, c);
    await expect(page.locator(c.texte)).toHaveText(`2 / ${c.total} chapitres consultés`);
    await expect(page.locator('#courseRevisedCount')).toHaveText(`1 / ${c.total} chapitres révisés`);
    await expect(page.locator('#tocMobileCount')).toHaveText(`2/${c.total}`);
    await expect(page.locator(`[data-toggle-revise="${c.premier}"]`)).toHaveAttribute('aria-pressed', 'true');
  });
}

for (const c of cours) {
  test(`${c.nom} : un défilement rapide ne compte pas un chapitre simplement traversé`, async ({ page }) => {
    await preparer(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/cours/${c.nom}.html#exercices`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#exercices')).toBeVisible();
    await montrerNavigation(page);
    await page.locator('[data-course-tab="cours"]').click();
    const placer = async id => page.locator(`#${id}`).evaluate(section => window.scrollTo({ top: window.scrollY + section.getBoundingClientRect().top - 205, behavior: 'instant' }));
    await placer(c.premier);
    await page.waitForTimeout(120);
    await placer(c.suivant);
    await expect.poll(() => page.evaluate(([nom, id]) => STIProfil.chargerProfil().chapitres[nom][id], [c.nom, c.suivant])).toBe('en_cours');
    expect(await page.evaluate(([nom, id]) => STIProfil.chargerProfil().chapitres[nom][id], [c.nom, c.premier])).toBeUndefined();
    await expect(page.locator(c.texte)).toHaveText(`1 / ${c.total} chapitres consultés`);
  });
}

test('PHP : une ancre attend la résolution de l’autorisation 4SI', async ({ page }) => {
  await preparer(page, { classe: '3SI 1' });
  await page.goto('/cours/php.html#s1', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#sti-lock-4si')).toBeVisible();
  expect(await page.evaluate(() => STIProfil.chargerProfil().chapitres.php)).toEqual({});
  // Simuler uniquement la résolution tardive du verrou existant dans le navigateur de test.
  await page.evaluate(() => document.documentElement.classList.add('sti-4si-autorise'));
  await expect.poll(() => page.evaluate(() => STIProfil.chargerProfil().chapitres.php.s1)).toBe('en_cours');
  await expect(page.locator('#courseProgressText')).toHaveText('1 / 10 chapitres consultés');
});

for (const c of cours) {
  test(`${c.nom} : une lecture défilant lentement en continu est comptabilisée`, async ({ page }) => {
    await preparer(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/cours/${c.nom}.html#exercices`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#exercices')).toBeVisible();
    await montrerNavigation(page);
    await page.locator('[data-course-tab="cours"]').click();
    await page.locator(`#${c.premier}`).evaluate(section => window.scrollTo({ top: scrollY + section.getBoundingClientRect().top - 205, behavior: 'instant' }));
    await page.evaluate(() => {
      window.__testDefilement = setInterval(() => window.scrollBy({ top: 2, behavior: 'instant' }), 50);
      setTimeout(() => clearInterval(window.__testDefilement), 3000);
    });
    await expect.poll(() => page.evaluate(([nom, id]) => STIProfil.chargerProfil().chapitres[nom][id], [c.nom, c.premier]), { timeout: 1800 }).toBe('en_cours');
    await page.evaluate(() => clearInterval(window.__testDefilement));
    await expect(page.locator(c.texte)).toHaveText(`1 / ${c.total} chapitres consultés`);
  });
}

test('SQL 3SI : une ancienne révision Bac masquée ne valide pas prématurément le cours', async ({ page }) => {
  await preparer(page, { classe: '3SI 1', profil: { chapitres: { sql: { bac: 'revise' } } } });
  await page.goto('/cours/sql.html', { waitUntil: 'domcontentloaded' });
  for (const nom of ['intro', 'ldd']) await page.locator(`[data-toggle-revise="${nom}"]`).click();
  await expect(page.locator('#courseRevisedCount')).toHaveText('2 / 3 chapitres révisés');
  expect(await page.evaluate(() => STIProfil.chargerProfil().progression.sql)).toBe(false);
  await page.locator('[data-toggle-revise="lmd"]').click();
  await expect(page.locator('#courseRevisedCount')).toHaveText('3 / 3 chapitres révisés');
  expect(await page.evaluate(() => STIProfil.chargerProfil().progression.sql)).toBe(true);
  await page.locator('[data-toggle-revise="ldd"]').click();
  expect(await page.evaluate(() => STIProfil.chargerProfil().progression.sql)).toBe(false);
  await expect(page.locator('#courseProgressText')).toHaveText('3 / 3 chapitres consultés');
});

for (const c of cours) {
  test(`${c.nom} : la fin du cours ne dépend que des chapitres existants et révisés volontairement`, async ({ page }) => {
    await preparer(page);
    await page.goto(`/cours/${c.nom}.html`, { waitUntil: 'domcontentloaded' });
    const ids = await page.evaluate(nom => {
      const ids = Array.from(document.querySelectorAll('[data-chapter-id]'), e => e.dataset.chapterId);
      const p = STIProfil.chargerProfil();
      p.chapitres[nom] = { ancien: 'revise' };
      ids.slice(2).forEach(id => p.chapitres[nom][id] = 'revise');
      p.progression[nom] = false;
      STIProfil.sauvegarderProfil(p, false);
      return ids;
    }, c.nom);
    expect(ids).toHaveLength(c.total);
    await page.locator(`[data-toggle-revise="${ids[0]}"]`).click();
    await expect(page.locator('#courseRevisedCount')).toHaveText(`${c.total - 1} / ${c.total} chapitres révisés`);
    expect(await page.evaluate(nom => STIProfil.chargerProfil().progression[nom], c.nom)).toBe(false);
    await page.locator(`[data-toggle-revise="${ids[1]}"]`).click();
    await expect(page.locator('#courseRevisedCount')).toHaveText(`${c.total} / ${c.total} chapitres révisés`);
    expect(await page.evaluate(nom => STIProfil.chargerProfil().progression[nom], c.nom)).toBe(true);
    await page.locator(`[data-toggle-revise="${ids[0]}"]`).click();
    expect(await page.evaluate(nom => STIProfil.chargerProfil().progression[nom], c.nom)).toBe(false);
    await expect(page.locator(c.texte)).toHaveText(`${c.total} / ${c.total} chapitres consultés`);
  });
}
