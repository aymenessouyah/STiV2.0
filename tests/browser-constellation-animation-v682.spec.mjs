import {test,expect} from '@playwright/test';
async function prepare(page,classe='4SI 1'){
 await page.setViewportSize({width:390,height:844});await page.route('https://**/*',r=>r.abort());await page.route('**/sw.js*',r=>r.abort());
 await page.addInitScript(cl=>{const s={nativeAuthenticated:true,statut:'actif',id:'test-anim',email:'test@example.invalid',role:'eleve',classe:cl};window.__STI_NATIVE_AUTHENTICATED_V316=true;sessionStorage.setItem('sti-native-session-v316','1');sessionStorage.setItem('sti-session-cache',JSON.stringify(s));localStorage.setItem('sti-session-cache',JSON.stringify(s));},classe);
}
test('tracé animé, pause, reprise et rejeu',async({page})=>{
 await prepare(page);await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/constellation.html',{waitUntil:'load'});
 const map=page.locator('.star-map').first(),controls=page.locator('#animation-controls');await expect(controls).toBeVisible();await map.scrollIntoViewIfNeeded();await expect(map).toHaveClass(/is-playing/);
 await expect(map.locator('.traceur-matiere')).toHaveCount(5);const point=map.locator('.traceur-matiere').first();
 const p1=await point.evaluate(e=>{let m=e.getCTM();return [m.e,m.f]});await page.waitForTimeout(450);const p2=await point.evaluate(e=>{let m=e.getCTM();return [m.e,m.f]});expect(p1).not.toEqual(p2);
 await page.locator('#animation-pause').click();await expect(page.locator('#animation-pause')).toHaveAttribute('aria-pressed','true');const paused=await point.evaluate(e=>{let m=e.getCTM();return [m.e,m.f]});await page.waitForTimeout(250);expect(await point.evaluate(e=>{let m=e.getCTM();return [m.e,m.f]})).toEqual(paused);
 await page.locator('#animation-pause').click();await expect(page.locator('#animation-pause')).toHaveAttribute('aria-pressed','false');await page.locator('#animation-rejouer').click();await expect(map).toHaveClass(/is-playing/);await expect(page.locator('#livraison')).toHaveCount(1);
});
test('mouvement réduit : carte statique et liens toujours accessibles',async({page})=>{
 await prepare(page,'3SI 1');await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/constellation.html',{waitUntil:'load'});
 await expect(page.locator('#animation-controls')).toBeHidden();const map=page.locator('.star-map').first();await map.scrollIntoViewIfNeeded();await expect(map).not.toHaveClass(/is-playing/);await expect(map.locator('.traceur-matiere').first()).toBeHidden();await map.locator('a[href="#livraison"]').click();await expect(page).toHaveURL(/#livraison$/);await expect(page.locator('#livraison')).toBeVisible();
});
