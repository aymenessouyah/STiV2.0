import {test,expect} from '@playwright/test';
async function preparer(page,classe){
 await page.route('https://**/*',r=>r.abort());await page.route('**/sw.js*',r=>r.abort());
 await page.addInitScript(classe=>{const s={nativeAuthenticated:true,statut:'actif',email:'test@example.invalid',role:'eleve',classe};window.__STI_NATIVE_AUTHENTICATED_V316=true;sessionStorage.setItem('sti-native-session-v316','1');sessionStorage.setItem('sti-session-cache',JSON.stringify(s));localStorage.setItem('sti-session-cache',JSON.stringify(s));},classe);
 await page.setViewportSize({width:390,height:844});await page.goto('/index.html#outils-bac',{waitUntil:'domcontentloaded'});
}
test('4SI : la bulle et les liens synthèse restent utilisables sur mobile',async({page,request})=>{
 await preparer(page,'4SI 1');const card=page.locator('#series-synthese');await expect(card).toBeVisible();
 await expect(page.locator('html')).toHaveClass(/sti-4si-autorise/);
 for(const prefix of ['HTML & CSS','JavaScript','SQL / BD','PHP']){const detail=card.locator('details').filter({has:page.getByText(prefix,{exact:false})});await expect(detail.first()).toBeVisible();await detail.first().locator('summary').click();}
 await expect(card.getByText('Club sportif')).toBeVisible();
 for(const href of await card.locator('a[href$=".pdf"]').evaluateAll(a=>a.map(x=>x.getAttribute('href')))) {const res=await request.get('/'+href);expect(res.status(),href).toBe(200);expect((await res.body()).subarray(0,5).toString()).toBe('%PDF-');}
 await card.getByRole('link',{name:'Projet Fleurs 1'}).click();await expect(page).toHaveURL(/cours\/html5\.html#exo-fleurs$/);await expect(page.locator('#exo-fleurs')).toBeVisible();
});
test('3SI : HTML et JavaScript visibles, synthèses SQL 4SI et PHP masquées',async({page})=>{
 await preparer(page,'3SI 1');const card=page.locator('#series-synthese');await expect(card).toBeVisible();
 await expect(card.locator('summary').filter({hasText:'HTML & CSS'})).toBeVisible();await expect(card.locator('summary').filter({hasText:'JavaScript'})).toBeVisible();
 await expect(card.locator('details').filter({hasText:'SQL / BD'})).toBeHidden();await expect(card.locator('details').filter({hasText:'PHP · Séries'})).toBeHidden();
});
