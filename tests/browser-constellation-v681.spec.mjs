import {test,expect} from '@playwright/test';
for(const classe of ['3SI 1','4SI 1'])test(`constellation mobile et droits ${classe}`,async({page,request})=>{
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});
 await page.route('https://**/*',r=>r.abort());await page.route('**/sw.js*',r=>r.abort());
 await page.addInitScript(cl=>{let s={nativeAuthenticated:true,statut:'actif',id:'constellation-test',email:'test@example.invalid',role:'eleve',classe:cl};window.__STI_NATIVE_AUTHENTICATED_V316=true;sessionStorage.setItem('sti-native-session-v316','1');sessionStorage.setItem('sti-session-cache',JSON.stringify(s));localStorage.setItem('sti-session-cache',JSON.stringify(s));localStorage.setItem('sti-demo-vu','1');},classe);
 await page.goto('/index.html#outils-bac',{waitUntil:'domcontentloaded'});await expect(page.locator('#constellation-matieres')).toBeVisible();
 await page.locator('#sti-bnav-plus').click();const link=page.locator('#sti-bnav-sheet').getByRole('link',{name:'Constellation',exact:true});await expect(link).toBeVisible();await link.click();await expect(page).toHaveURL(/constellation\.html$/);
 await expect(page.locator('h1')).toContainText('se rencontrent');await expect(page.locator('#livraison')).toBeVisible();await expect(page.locator('#carte-bancaire')).toBeVisible();
 if(classe.startsWith('3')) {await expect(page.locator('#web-bd')).toBeHidden();await expect(page.locator('#style-bac')).toBeHidden();await expect(page.locator('.legend').getByText('PHP')).toBeHidden();}
 else {await expect(page.locator('#web-bd')).toBeVisible();await expect(page.locator('#style-bac')).toBeVisible();await expect(page.locator('.legend').getByText('PHP')).toBeVisible();}
 await page.locator('svg a[href="#livraison"]').click();await expect(page).toHaveURL(/#livraison$/);await expect(page.locator('#livraison')).toBeInViewport();
 for(const a of await page.locator('.project-card:visible .card-links a').all()){let href=await a.getAttribute('href');let r=await request.get(new URL(href,page.url()).toString());expect(r.status(),href).toBe(200);}
 expect(await page.evaluate(()=>document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
test('raccourci depuis un cours conserve le préfixe de déploiement',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.route('https://**/*',r=>r.abort());await page.route('**/sw.js*',r=>r.abort());
 await page.route('**/STiV2.0/**',async route=>{const u=new URL(route.request().url());u.pathname=u.pathname.replace(/^\/STiV2\.0/,'');const r=await route.fetch({url:u.href});await route.fulfill({response:r});});
 await page.addInitScript(()=>{let s={nativeAuthenticated:true,statut:'actif',id:'test',email:'test@example.invalid',role:'eleve',classe:'3SI 1'};window.__STI_NATIVE_AUTHENTICATED_V316=true;sessionStorage.setItem('sti-native-session-v316','1');sessionStorage.setItem('sti-session-cache',JSON.stringify(s));localStorage.setItem('sti-session-cache',JSON.stringify(s));});
 await page.goto('/STiV2.0/cours/javascript.html',{waitUntil:'load'});await page.locator('#sti-bnav-plus').click();await expect(page.locator('#sti-bnav-plus')).toHaveAttribute('aria-expanded','true');let link=page.locator('#sti-bnav-sheet').getByRole('link',{name:'Constellation',exact:true});await expect(link).toHaveAttribute('href',/\/STiV2\.0\/constellation\.html$/);await link.click();await expect(page).toHaveURL(/\/STiV2\.0\/constellation\.html$/);await expect(page.locator('#livraison')).toBeVisible();
});
