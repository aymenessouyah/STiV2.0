import {test,expect} from '@playwright/test';
for(const classe of ['3SI 1','4SI 1'])test(`livraison synthèse disponible (${classe})`,async({page,request})=>{
 await page.route('https://**/*',r=>r.abort());await page.route('**/sw.js*',r=>r.abort());
 await page.addInitScript(cl=>{const s={nativeAuthenticated:true,statut:'actif',email:'test@example.invalid',role:'eleve',classe:cl};window.__STI_NATIVE_AUTHENTICATED_V316=true;sessionStorage.setItem('sti-native-session-v316','1');sessionStorage.setItem('sti-session-cache',JSON.stringify(s));localStorage.setItem('sti-session-cache',JSON.stringify(s));},classe);
 await page.setViewportSize({width:390,height:844});
 for(const url of ['/cours/javascript.html#exercices','/exercices/series-exercices.html#javascript']){
  await page.goto(url,{waitUntil:'domcontentloaded'});const card=page.locator('#synthese-livraison');await expect(card).toBeVisible();await expect(card.locator('.badge-synthese-gold')).toBeVisible();
  for(const link of await card.locator('a').all()) {const href=await link.getAttribute('href');const response=await request.get(new URL(href,page.url()).toString());expect(response.status()).toBe(200);}
 }
 await page.goto('/index.html#series-synthese',{waitUntil:'domcontentloaded'});const detail=page.locator('#series-synthese details').filter({hasText:'JavaScript'});await detail.locator('summary').click();await expect(detail.getByText('Livraison fast-food')).toBeVisible();
});
test('le corrigé fourni initialise et fait avancer la livraison',async({page})=>{
 await page.goto('/exercices/javascript/livraison/livraison_fastfood_corrig%C3%A9.html',{waitUntil:'load'});
 await expect(page.locator('input[name="livreur"]')).toHaveCount(3);
 await page.locator('input[name="livreur"]').first().check();
 await page.locator('#go').click();await expect(page.locator('#avancer')).toBeEnabled();
 await page.locator('#avancer').click();await expect(page.locator('#prog')).not.toHaveCSS('width','0px');
});
