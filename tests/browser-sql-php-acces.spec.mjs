import { test, expect } from '@playwright/test';

/* Session native fictive dans le navigateur de test ; acces.js est le vrai fichier. */
async function sessionNative(page, classe) {
  await page.addInitScript(classe=>{
    const cache={nativeAuthenticated:true,statut:'actif',email:'eleve-test@example.invalid',role:'eleve',classe,lycee:'Lycée Raféha'};
    try { window.__STI_NATIVE_AUTHENTICATED_V316=true;sessionStorage.setItem('sti-native-session-v316','1');sessionStorage.setItem('sti-session-cache',JSON.stringify(cache));localStorage.setItem('sti-session-cache',JSON.stringify(cache)); } catch(e){}
  },classe);
}
test('verrou existant : 3SI ne voit ni Bac SQL ni PHP réservé',async({page})=>{
  await sessionNative(page,'3SI 1');await page.goto('/cours/sql.html',{waitUntil:'domcontentloaded'});
  await expect(page.locator('html')).not.toHaveClass(/sti-4si-autorise/);
  await expect(page.locator('#bac')).toBeHidden();await expect(page.locator('a.toc-link[href="#bac"]')).toBeHidden();
  await page.locator('#pack-offline').evaluate(b=>b.click());await expect(page.locator('#pack-offline-txt')).toHaveText('Ressource réservée à la 4ème SI.');
  await expect(page.locator('#courseProgressText')).toContainText('0 / 3');
  for (const id of ['intro','ldd','lmd']) await page.locator(`[data-toggle-revise="${id}"]`).click();
  await expect(page.locator('#courseProgressText')).toContainText('3 / 3');
  expect(await page.evaluate(()=>STIProfil.chargerProfil().progression.sql)).toBe(true);
  await page.locator('[data-course-tab="exercices"]').click();await expect(page.locator('[data-exercise="serie4"]')).toBeHidden();await expect(page.locator('[data-exercise="serie5"]')).toBeHidden();
  await page.locator('[data-course-tab="videos"]').click();await expect(page.locator('.matiere-video-card.sti-4si-only')).toHaveCount(2);
  await expect(page.locator('.matiere-video-card.sti-4si-only').first()).toBeHidden();
  expect(await page.evaluate(()=>window.ouvrirVideoPasAPasSTI('sql-serie4'))).toBe(false);await expect(page.locator('#sti-video-modal-overlay')).toBeHidden();
  await page.goto('/cours/php.html',{waitUntil:'domcontentloaded'});await expect(page.locator('#sti-lock-4si')).toBeVisible();
  await page.goto('/index.html',{waitUntil:'domcontentloaded'});
  await expect(page.getByText('Quatre quiz & révision ciblée (886 questions)')).toBeVisible();
  await expect(page.getByText('Cinq quiz & révision ciblée (1 244 questions)')).toBeHidden();
});
test('verrou existant : une session 4SI accède à PHP et aux ressources SQL Bac',async({page})=>{
  await sessionNative(page,'4SI 1');await page.goto('/cours/php.html',{waitUntil:'domcontentloaded'});
  await expect(page.locator('html')).toHaveClass(/sti-4si-autorise/);await expect(page.locator('#sti-lock-4si')).toHaveCount(0);
  await page.goto('/cours/sql.html',{waitUntil:'domcontentloaded'});await expect(page.locator('#bac')).toBeVisible();
  await page.locator('[data-course-tab="videos"]').click();await expect(page.locator('[data-video-open="sql-serie4"]').last()).toBeVisible();
  await page.goto('/index.html',{waitUntil:'domcontentloaded'});
  await expect(page.getByText('Cinq quiz & révision ciblée (1 244 questions)')).toBeVisible();
  await expect(page.getByText('Quatre quiz & révision ciblée (886 questions)')).toBeHidden();
});
