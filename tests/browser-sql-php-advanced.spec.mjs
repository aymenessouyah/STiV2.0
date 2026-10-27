import { test, expect } from '@playwright/test';

/* Autorisation 4SI fictive : les vérifications d'accès utilisent la suite dédiée. */
test.beforeEach(async ({ context }) => {
  await context.route('**/assets/js/config.js*', async route => {
    const response=await route.fetch(), texte=await response.text(), fin=texte.indexOf('};')+2;
    await route.fulfill({response,body:texte.slice(0,fin)+"\nwindow.STI_AUTH.URL=''; window.__STI_GOLD=true;\n"+texte.slice(fin)});
  });
  await context.addInitScript(() => document.addEventListener('DOMContentLoaded', () => document.documentElement.classList.add('sti-4si-autorise'), { once:true }));
});
async function ouvrir(page,nom,hash='') {
  await page.goto(`/cours/${nom}.html${hash}`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.STIProfil && document.querySelector('.code-box')));
}

test('SQL : Guide-Ligne audio, repères synchronisés, arrêt et retour en haut',async({page})=>{
  const erreurs=[];page.on('pageerror',e=>erreurs.push(e.message));
  await ouvrir(page,'sql');
  await page.waitForFunction(()=>document.getElementById('sqlGuideAudio').readyState>=1);
  await page.locator('#sqlGuideFollow').check();await page.locator('[data-guide-key="ldd"]').click();
  await expect.poll(()=>page.locator('#sqlGuideAudio').evaluate(a=>a.currentTime)).toBeGreaterThanOrEqual(203.38);
  await expect(page.locator('[data-guide-key="ldd"]')).toHaveAttribute('aria-current','true');
  await expect(page.locator('#sqlGuideStatus')).toContainText('LDD');await expect(page.locator('#ldd')).toHaveClass(/guide-current/);
  await page.locator('#sqlGuideAudio').evaluate(a=>{a.currentTime=230;a.dispatchEvent(new Event('timeupdate'));});
  await expect.poll(()=>page.locator('#sqlGuideAudio').evaluate(a=>a.paused)).toBe(true);
  await page.locator('#lmd-groupby').scrollIntoViewIfNeeded();await expect(page.locator('#back-to-top')).toHaveClass(/is-visible/);
  await page.locator('#back-to-top').click();await expect.poll(()=>page.evaluate(()=>window.scrollY),{timeout:8000}).toBeLessThan(5);
  expect(erreurs).toEqual([]);
});


test('SQL : les trois animations historiques gardent leurs onglets clavier et leurs étapes',async({page})=>{
  await ouvrir(page,'sql');
  for(const [app,attr,step] of [['#sql-jointure-anim-app','data-jex','#janim-btn-next'],['#sql-groupby-anim-app','data-gbex','#gbanim-btn-next'],['#sql-having-anim-app','data-hvex','#hvanim-btn-next']]){
    const tabs=page.locator(`${app} [role=tab]`);await tabs.first().focus();await page.keyboard.press('ArrowRight');
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected','true');await expect(tabs.nth(1)).toBeFocused();
    await expect(tabs.nth(1)).toHaveAttribute(attr,'1');await page.locator(step).click();
    await expect(page.locator(`${app} .sql-janim-step-badge`)).not.toContainText('0 /');
  }
});

test('SQL : un calcul infini est interrompu et le worker reste réutilisable',async({page})=>{
  await ouvrir(page,'sql','#exercices');
  await page.locator('#sqlEditor').fill('WITH RECURSIVE infini(x) AS (SELECT 1 UNION ALL SELECT x+1 FROM infini) SELECT count(*) FROM infini;');
  await page.locator('#runSql').click();await expect(page.locator('#sqlResult')).toContainText('délai de 5 secondes dépassé',{timeout:10000});
  await page.locator('#sqlEditor').fill("SELECT nom FROM eleves WHERE id = 2;");await page.locator('#runSql').click();
  await expect(page.locator('#sqlResult')).toContainText('Salma',{timeout:10000});
});

test('SQL : tableau enseignant et exercices se synchronisent entre deux onglets',async({page,context})=>{
  await ouvrir(page,'sql','#bac');const autre=await context.newPage();await ouvrir(autre,'sql','#bac');
  await page.locator('.bord-notion').first().check();await expect(autre.locator('.bord-notion').first()).toBeChecked();
  await expect(autre.locator('#bord-global-pct')).toHaveText('5 %');
  await autre.locator('#bord-tout').click();await expect(page.locator('#bord-global-pct')).toHaveText('100 %');
  await expect(page.locator('.bord-notion:checked')).toHaveCount(20);
  await page.locator('#bord-reset').click();await expect(autre.locator('#bord-global-pct')).toHaveText('0 %');
  await expect(autre.locator('.bord-notion:checked')).toHaveCount(0);
  await page.locator('[data-course-tab=exercices]').click();await autre.locator('[data-course-tab=exercices]').click();
  await page.locator('[data-exercise=tp1]').check();await expect(autre.locator('[data-exercise=tp1]')).toBeChecked();
  await autre.locator('[data-exercise=tp1]').uncheck();await expect(page.locator('[data-exercise=tp1]')).not.toBeChecked();
  await autre.close();
});

test('SQL et PHP : vidéos réelles, chapitres, vitesse et reprise enregistrée',async({page})=>{
  for(const [matiere,items] of [['sql',[['sql-cours',11],['sql-initiation',10],['sql-serie4',18],['sql-serie5',23]]],['php',[['php-synthese',17]]]]) {
    await ouvrir(page,matiere,'#videos');
    for(const [slug,nombre] of items) {
      await page.locator(`[data-video-open="${slug}"]`).last().click();
      const video=page.locator('#sti-video-modal-player');await page.waitForFunction(()=>document.getElementById('sti-video-modal-player').readyState>=1,null,{timeout:15000});
      await expect(page.locator('#sti-video-modal-chap-pills button')).toHaveCount(nombre);
      await page.locator('[data-mrate="1.25"]').click();expect(await video.evaluate(v=>v.playbackRate)).toBe(1.25);
      await page.locator('#sti-video-modal-chap-pills button').nth(1).click();
      await expect(page.locator('#sti-video-modal-chap-pills button').nth(1)).toHaveAttribute('aria-current','true');
      const position=await video.evaluate(v=>v.currentTime);expect(position).toBeGreaterThan(0);
      await video.evaluate(v=>v.pause());await page.keyboard.press('Escape');
      expect(await page.evaluate(s=>STIProfil.chargerProfil().videos.positions[s],slug)).toBeGreaterThan(0);
      await page.locator(`[data-video-open="${slug}"]`).last().click();
      await page.locator('#sti-video-modal-overlay [data-reprise-profil]').click();
      await page.waitForFunction(()=>document.getElementById('sti-video-modal-player').readyState>=1,null,{timeout:15000});
      await expect.poll(()=>video.evaluate(v=>v.currentTime)).toBeGreaterThanOrEqual(position-1);
      await page.keyboard.press('Escape');
    }
  }
});


test('PHP : audio original, chapitrage, arrêt à la vidéo et reprise',async({page})=>{
  const erreurs=[];page.on('pageerror',e=>erreurs.push(e.message));
  await ouvrir(page,'php');const audio=page.locator('#phpCourseAudio');
  await expect(audio).toHaveAttribute('src','../assets/audio/php-cours.mp3');
  await expect(page.locator('#phpAudioChapitres option')).toHaveCount(14);
  await page.waitForFunction(()=>document.getElementById('phpCourseAudio').readyState>=1);
  await page.locator('#phpAudioChapitres').selectOption('3');
  await expect.poll(()=>audio.evaluate(a=>a.currentTime)).toBeGreaterThanOrEqual(111.4);
  await expect.poll(()=>audio.evaluate(a=>a.paused)).toBe(false);
  await expect(page.locator('#phpAudioStatus')).toContainText('Opérateurs');
  await expect(page.locator('#sti-voice-top-ctrl')).toBeVisible();
  await expect(page.locator('#sti-voice-top-chap option')).toHaveCount(13);
  await page.locator('#sti-voice-top-next').click();
  await expect.poll(()=>audio.evaluate(a=>a.currentTime)).toBeGreaterThanOrEqual(227.01);
  await expect.poll(()=>audio.evaluate(a=>a.paused)).toBe(false);
  const avant=await audio.evaluate(a=>a.currentTime);
  await page.locator('#featuredVideo').locator('..').locator('..').locator('.sti-lecteur-complet').click();
  await expect.poll(()=>audio.evaluate(a=>a.paused)).toBe(true);
  await expect(page.locator('#sti-video-modal-overlay')).toBeVisible();
  await page.keyboard.press('Escape');
  await audio.evaluate(a=>a.play());
  await expect.poll(()=>audio.evaluate(a=>a.paused)).toBe(false);
  await expect.poll(()=>audio.evaluate(a=>a.currentTime)).toBeGreaterThanOrEqual(avant);
  await audio.evaluate(a=>a.pause());
  expect(erreurs).toEqual([]);
});

test('PHP : protocole du Guichet, arrêt et retours internes des iframes',async({page})=>{
  await ouvrir(page,'php');await page.locator('[data-modal-open=animModal]').first().click();
  const modal=page.locator('#animModal'),frame=page.frameLocator('#animFrame');
  await expect(frame.locator('#auto')).toBeVisible();
  await frame.locator('#auto').click();await expect(frame.locator('#auto')).toHaveText('Pause');
  await frame.locator('#fs').click();await expect(modal).toHaveClass(/full/);await expect(frame.locator('#fs')).toHaveText('Quitter le plein écran');
  await frame.locator('#fs').click();await expect(modal).not.toHaveClass(/full/);
  await page.evaluate(()=>window.postMessage({type:'STI_FERMER_MODALE_PHP'},location.origin));await expect(modal).toBeVisible();
  // La barre du Guichet est masquée en mode intégré : son ancien lien reste intercepté.
  await frame.locator('#btn-retour-cours-php').evaluate(e=>e.click());await expect(modal).toBeHidden();
  await expect(frame.locator('#auto')).toHaveText('Lecture auto');await expect(page.locator('#animFrame')).toHaveAttribute('src','php-mysqli.html?embed=1');
  await page.locator('[data-modal-open=animModal]').first().click();await frame.locator('#auto').click();await page.locator('#animRetourCours').click();
  await expect(modal).toBeHidden();await expect(frame.locator('#auto')).toHaveText('Lecture auto');
  await page.locator('[data-modal-open=recapModal]').first().click();const recap=page.frameLocator('#recapFrame');
  await expect(recap.locator('#btn-retour-cours-php')).toBeVisible();await recap.locator('#btn-retour-cours-php').click();
  await expect(page.locator('#recapModal')).toBeHidden();await expect(page.locator('#recapFrame')).toHaveAttribute('src','PHP-recap.html?embed=1');
});

test('PHP : les six fenêtres ont focus piégé, plein écran, redimensionnement et fermeture',async({page})=>{
  await ouvrir(page,'php');
  for(const [tab,bouton,id] of [
    ['cours','[data-modal-open=animModal]','anim'],['cours','[data-modal-open=recapModal]','recap'],
    ['cours','#btnExoS10','exo'],['cours','#s9 .sol-open[data-sol=html]','sol'],
    ['cours','#btnExoS11','exo2'],['cours','#s10 .sol2-open[data-sol2=html]','sol2']]) {
    await page.locator(`[data-course-tab=${tab}]`).click();const origine=page.locator(bouton).first();await origine.click();
    const modal=page.locator(`#${id}Modal`),box=page.locator(`#${id}Box`);await expect(modal).toBeVisible();
    await expect(modal).toHaveAttribute('role','dialog');await expect(modal).toHaveAttribute('aria-modal','true');await expect(modal).toHaveAttribute('aria-labelledby',/.+/);
    expect(await page.locator('main').evaluate(e=>e.inert)).toBe(true);await expect(page.locator(`#${id}Close`)).toBeFocused();
    const w=await box.evaluate(e=>e.getBoundingClientRect().width);await box.locator('.matiere-resize').focus();await page.keyboard.press('ArrowLeft');
    expect(await box.evaluate(e=>e.getBoundingClientRect().width)).toBeLessThan(w);
    await box.locator('.matiere-resize').focus();await page.keyboard.press('Tab');expect(await modal.evaluate(e=>e.contains(document.activeElement))).toBe(true);
    await page.locator(`#${id}Full`).click();await expect(modal).toHaveClass(/full/);await page.locator(`#${id}Full`).click();await expect(modal).not.toHaveClass(/full/);
    await page.keyboard.press('Escape');await expect(modal).toBeHidden();await expect(origine).toBeFocused();
    await origine.click();await modal.evaluate(e=>e.click());await expect(modal).toBeHidden();
  }
});

test.describe('cours SQL et PHP déjà préparés hors connexion',()=>{
  test.use({ serviceWorkers:'allow' });
  test('pack Bac : prépare les dépendances et ne confirme pas un téléchargement incomplet',async({page,context})=>{
    test.setTimeout(60_000);
    await context.addInitScript(()=>{const c={nativeAuthenticated:true,statut:'actif',email:'eleve-test@example.invalid',role:'eleve',classe:'4SI 1'};try{window.__STI_NATIVE_AUTHENTICATED_V316=true;sessionStorage.setItem('sti-native-session-v316','1');sessionStorage.setItem('sti-session-cache',JSON.stringify(c));localStorage.setItem('sti-session-cache',JSON.stringify(c));}catch(e){}});
    await ouvrir(page,'sql','#bac');
    await page.evaluate(()=>{const add=Cache.prototype.add;Cache.prototype.add=function(url){if(String(url).includes('enonce-serie4-a4.html'))return Promise.reject(new Error('Panne simulée'));return add.call(this,url);};});
    await page.locator('#pack-offline').click();await expect(page.locator('#pack-offline-txt')).toContainText('Préparation partielle',{timeout:20000});await expect(page.locator('#pack-offline')).toBeEnabled();
    await page.reload({waitUntil:'domcontentloaded'});await page.locator('#pack-offline').click();
    await expect(page.locator('#pack-offline-txt')).toContainText('Hors-ligne prêt',{timeout:20000});
    await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
    await context.setOffline(true);
    try {
      await page.goto('/cours/sql.html#exercices',{waitUntil:'domcontentloaded'});await page.locator('#runSql').click();
      await expect(page.locator('#sqlResult')).toContainText('Salma',{timeout:12000});
      const rep=await page.goto('/documents/enonces/enonce-serie4-a4.html',{waitUntil:'domcontentloaded'});expect(rep.status()).toBe(200);
    } finally {await context.setOffline(false);}
  });
  test('chapitres, exercice SQLite et récapitulatif restent disponibles',async({page,context})=>{
    test.setTimeout(60_000);
    // Session native simulée : ce test vérifie le cache, pas l'authentification distante.
    await context.addInitScript(()=>{
      const cache={nativeAuthenticated:true,statut:'actif',email:'eleve-test@example.invalid',role:'eleve',classe:'4SI 1'};
      try {window.__STI_NATIVE_AUTHENTICATED_V316=true;sessionStorage.setItem('sti-native-session-v316','1');sessionStorage.setItem('sti-session-cache',JSON.stringify(cache));localStorage.setItem('sti-session-cache',JSON.stringify(cache));}catch(e){}
    });
    await ouvrir(page,'sql');
    const fs=await import('node:fs/promises');
    const nomCache=(await fs.readFile(new URL('../sw.js',import.meta.url),'utf8')).match(/var CACHE\s*=\s*"([^"]+)"/)[1];
    await page.evaluate(async nomCache=>{
      await navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'});await navigator.serviceWorker.ready;
      const cache=await caches.open(nomCache);await cache.addAll([
        '/cours/sql.html','/cours/php.html','/cours/PHP-recap.html','/assets/css/theme.css','/assets/css/cours.css',
        '/assets/css/cours-matieres.css','/assets/css/cours-sql-heritage.css','/assets/css/cours-php-heritage.css','/assets/css/protection.css',
        '/assets/js/supabase-umd.js','/assets/js/acces.js','/assets/js/sync-progressions.js','/assets/js/profil.js','/assets/js/app.js',
        '/assets/js/protection.js','/assets/js/cours-matieres.js','/assets/js/cours-media-reperes.js','/assets/js/cours-sql-animations.js',
        '/assets/js/cours-sql-voix.js','/assets/js/cours-sql-worker.js','/assets/js/sqljs/sql-wasm.js','/assets/js/sqljs/sql-wasm.wasm'
      ]);
    },nomCache);
    await page.reload();await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
    const config=await fs.readFile(new URL('../assets/js/config.js',import.meta.url),'utf8');
    await page.evaluate(async ({source,nomCache})=>{
      const simulation="\nwindow.STI_AUTH = { URL: '', ANON_KEY: '', estPagePublique: () => false, getProfile: async () => ({id:'test-gold',email:'test@example.invalid',role:'eleve',classe:'4SI 1',statut_acces:'GOLD',enabled:true}), signOut: async () => {} };";
      const cache=await caches.open(nomCache);await cache.put('/assets/js/config.js',new Response(source+simulation,{headers:{'content-type':'text/javascript'}}));
    },{source:config,nomCache});
    await context.setOffline(true);
    try {
      await page.goto('/cours/sql.html#exercices',{waitUntil:'domcontentloaded'});await expect(page.locator('#sqlEditor')).toBeVisible();
      await page.locator('#runSql').click();await expect(page.locator('#sqlResult')).toContainText('Salma',{timeout:12000});
      await page.goto('/cours/php.html',{waitUntil:'domcontentloaded'});await expect(page.locator('#sti-lock-4si')).toHaveCount(0);
      await page.locator('[data-modal-open=recapModal]').first().click();await expect(page.frameLocator('#recapFrame').locator('#btn-retour-cours-php')).toBeVisible();
    } finally {await context.setOffline(false);}
  });
});
