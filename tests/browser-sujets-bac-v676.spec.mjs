import {test,expect} from '@playwright/test';
async function preparer(page,classe){
 await page.route('https://**/*',r=>r.abort());await page.route('**/sw.js*',r=>r.abort());
 await page.addInitScript(classe=>{const s={nativeAuthenticated:true,statut:'actif',email:'test@example.invalid',role:'eleve',classe};window.__STI_NATIVE_AUTHENTICATED_V316=true;sessionStorage.setItem('sti-native-session-v316','1');sessionStorage.setItem('sti-session-cache',JSON.stringify(s));localStorage.setItem('sti-session-cache',JSON.stringify(s));},classe);
 await page.setViewportSize({width:390,height:844});
}
for (const classe of ['3SI 1','4SI 1']) test(`sujets bac et exercices sur mobile (${classe})`,async({page,request})=>{
 await preparer(page,classe);await page.goto('/index.html#outils-bac',{waitUntil:'domcontentloaded'});
 const card=page.locator('#sujets-bac-similaires');
 if(classe.startsWith('3')) {await expect(card).toBeHidden();} else {
  await expect(card).toBeVisible();await expect(card.locator('summary')).toHaveCount(3);
  for(const summary of await card.locator('summary').all()) await summary.click();
  await expect(card.locator('a')).toHaveCount(6);
  for(const href of await card.locator('a').evaluateAll(els=>els.map(x=>x.getAttribute('href')))) {const res=await request.get('/'+href);expect(res.status()).toBe(200);const corps=await res.body();if(href.endsWith('.rar')) expect(corps.subarray(0,4).toString()).toBe('Rar!');else expect(corps.subarray(0,5).toString()).toBe('%PDF-');}
 }
 const boite=page.locator('#similaire-bac-pratique');
 if(classe.startsWith('3')) {await expect(boite).toBeHidden();} else {
  await expect(boite).toBeVisible();await expect(boite.locator('summary')).toHaveCount(1);await boite.locator('summary').click();
  await expect(boite.locator('a')).toHaveCount(3);
  for(const href of await boite.locator('a').evaluateAll(els=>els.map(x=>x.getAttribute('href')))) {const res=await request.get('/'+href);expect(res.status()).toBe(200);const corps=await res.body();if(href.endsWith('.rar')) expect(corps.subarray(0,4).toString()).toBe('Rar!');else expect(corps.subarray(0,5).toString()).toBe('%PDF-');}
 }
 await page.goto('/exercices/series-exercices.html',{waitUntil:'domcontentloaded'});
 for(const id of ['javascript','bdd','php']) {const cards=page.locator(`#${id} .exo-card`).filter({hasText:'Style Bac STI 2024'});if(classe.startsWith('3')) await expect(cards).toBeHidden();else await expect(cards).toBeVisible();}
 for(const sujet of ['javascript','sql','php']) {
  await page.goto(`/cours/${sujet}.html#exercices`,{waitUntil:'domcontentloaded'});
  const cards=page.locator('[data-sujet-bac]');
  await expect(cards).toHaveCount(3);
  for(const card of await cards.all()) { if(classe.startsWith('3')) await expect(card).toBeHidden(); else {await expect(card).toBeVisible();await expect(card.locator('a')).toHaveCount(2);} }
 }
});
