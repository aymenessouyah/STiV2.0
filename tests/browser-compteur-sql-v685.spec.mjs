import {test,expect} from '@playwright/test';
async function preparer(page,classe){
 await page.route('https://**/*',r=>r.abort());await page.route('**/sw.js*',r=>r.abort());
 await page.addInitScript(cl=>{const s={nativeAuthenticated:true,statut:'actif',id:'test-compteur',email:'test@example.invalid',role:'eleve',classe:cl};window.__STI_NATIVE_AUTHENTICATED_V316=true;sessionStorage.setItem('sti-native-session-v316','1');sessionStorage.setItem('sti-session-cache',JSON.stringify(s));localStorage.setItem('sti-session-cache',JSON.stringify(s));},classe);
 await page.setViewportSize({width:390,height:844});
}
test('compteur SQL : 12 exercices en 4SI, progression par carte',async({page})=>{
 await preparer(page,'4SI 1');await page.goto('/cours/sql.html#exercices',{waitUntil:'domcontentloaded'});
 await expect(page.locator('#exercices')).toBeVisible();
 await expect(page.locator('#exoProgressText')).toHaveText('0 / 12 exercices faits');
 await expect(page.locator('#tabExoCount')).toHaveText('0/12');
 await page.locator('[data-exercise="tp1"]').check();
 await expect(page.locator('#exoProgressText')).toHaveText('1 / 12 exercices faits');
 await page.locator('[data-exercise="suivi-livreur"]').check();
 await expect(page.locator('#exoProgressText')).toHaveText('2 / 12 exercices faits');
 await page.locator('[data-exercise="serie4"]').check();
 await expect(page.locator('#exoProgressText')).toHaveText('2 / 12 exercices faits');
 await page.locator('[data-exercise="tp4"]').check();
 await expect(page.locator('#exoProgressText')).toHaveText('3 / 12 exercices faits');
 await page.reload({waitUntil:'domcontentloaded'});
 await expect(page.locator('#exercices')).toBeVisible();
 await expect(page.locator('#exoProgressText')).toHaveText('3 / 12 exercices faits');
});
test('compteur SQL : seuls les TP ouverts comptent en 3SI',async({page})=>{
 await preparer(page,'3SI 1');await page.goto('/cours/sql.html#exercices',{waitUntil:'domcontentloaded'});
 await expect(page.locator('#exercices')).toBeVisible();
 await expect(page.locator('#exoProgressText')).toHaveText('0 / 2 exercices faits');
 await expect(page.locator('[data-exercise="suivi-livreur"]')).toBeHidden();
});
test('compteur PHP inchangé',async({page})=>{
 await preparer(page,'4SI 1');await page.goto('/cours/php.html#exercices',{waitUntil:'domcontentloaded'});
 await expect(page.locator('#exercices')).toBeVisible();
 await expect(page.locator('#exoProgressText')).toHaveText('0 / 6 exercices faits');
});
