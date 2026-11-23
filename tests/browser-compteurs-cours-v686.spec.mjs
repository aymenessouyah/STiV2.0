import {test,expect} from '@playwright/test';
async function preparer(page,classe){
 await page.route('https://**/*',r=>r.abort());await page.route('**/sw.js*',r=>r.abort());
 await page.addInitScript(cl=>{const s={nativeAuthenticated:true,statut:'actif',id:'test-compteurs',email:'test@example.invalid',role:'eleve',classe:cl};window.__STI_NATIVE_AUTHENTICATED_V316=true;sessionStorage.setItem('sti-native-session-v316','1');sessionStorage.setItem('sti-session-cache',JSON.stringify(s));localStorage.setItem('sti-session-cache',JSON.stringify(s));},classe);
 await page.setViewportSize({width:390,height:844});
}
test('PHP : 10 exercices, sujets bac et TP pratique compris',async({page})=>{
 await preparer(page,'4SI 1');await page.goto('/cours/php.html#exercices',{waitUntil:'domcontentloaded'});
 await expect(page.locator('#exercices')).toBeVisible();
 await expect(page.locator('#exoProgressText')).toHaveText('0 / 10 exercices faits');
 await page.locator('[data-exercise="suivi-livreur"]').check();
 await expect(page.locator('#exoProgressText')).toHaveText('1 / 10 exercices faits');
});
test('JavaScript : 43 exercices en 4SI',async({page})=>{
 await preparer(page,'4SI 1');await page.goto('/cours/javascript.html#exercices',{waitUntil:'domcontentloaded'});
 await expect(page.locator('#exoProgressText')).toHaveText('0 / 43 exercices faits');
 await expect(page.locator('#tabExoCount')).toHaveText('0/43');
 await page.locator('[data-exo-check="exo-js-suivi-livreur"]').check();
 await expect(page.locator('#exoProgressText')).toHaveText('1 / 43 exercices faits');
});
test('JavaScript : les sujets bac ne comptent pas en 3SI',async({page})=>{
 await preparer(page,'3SI 1');await page.goto('/cours/javascript.html#exercices',{waitUntil:'domcontentloaded'});
 await expect(page.locator('#exoProgressText')).toHaveText('0 / 39 exercices faits');
 await expect(page.locator('[data-exo-check="exo-js-suivi-livreur"]')).toBeHidden();
});
test('HTML5 : 19 exercices ; CSS3 : 14 exercices',async({page})=>{
 await preparer(page,'3SI 1');await page.goto('/cours/html5.html#exercices',{waitUntil:'domcontentloaded'});
 await expect(page.locator('#exoGlobalCounter')).toHaveText('0 / 19 exercices faits');
 await expect(page.locator('#tabExoCount')).toHaveText('0/19');
 await page.locator('[data-exo-check="exo-tp-evenements"]').check();
 await expect(page.locator('#exoGlobalCounter')).toHaveText('1 / 19 exercices faits');
 await page.locator('[data-exo-check="exo-club-web"]').check();
 await expect(page.locator('#exoGlobalCounter')).toHaveText('2 / 19 exercices faits');
 await page.goto('/cours/css3.html#exercices',{waitUntil:'domcontentloaded'});
 await expect(page.locator('#exoProgressText')).toHaveText('0 / 14 exercices faits');
 await page.locator('[data-exo-check="exo-tp-transitions"]').check();
 await expect(page.locator('#exoProgressText')).toHaveText('1 / 14 exercices faits');
});
