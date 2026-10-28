import { test, expect } from '@playwright/test';

// Identité fictive : ces parcours ne valident pas une authentification réelle.
test.beforeEach(async ({page}) => {
  await page.route('**/sw.js*', r => r.abort());
  await page.addInitScript(() => {
    try {
      const s = { nativeAuthenticated:true, statut:'actif', email:'eleve-test@example.invalid', role:'eleve', classe:'4SI 1', lycee:'Lycée Raféha' };
      window.__STI_NATIVE_AUTHENTICATED_V316 = true;
      sessionStorage.setItem('sti-native-session-v316','1');
      sessionStorage.setItem('sti-session-cache', JSON.stringify(s));
      localStorage.setItem('sti-session-cache', JSON.stringify(s));
      localStorage.setItem('sti-demo-vu','1');
    } catch (e) { /* Une iframe d'exemple peut avoir une origine opaque. */ }
  });
});

async function aller(page, url) { await page.goto(url, { waitUntil:'domcontentloaded' }); await page.waitForFunction(() => !!window.STIProfil); }

test('accueil : identité et QR originaux, news de la classe et dix outils avant les vidéos', async ({page}) => {
  await aller(page, '/index.html');
  await expect(page.locator('.site-header .brand-logo__mark img')).toHaveAttribute('src','assets/icons/sti-icon-192.png');
  await expect(page.locator('#modalContactQr .qr-box img')).toHaveAttribute('src','assets/images/qr-code-site.png');
  const qr=page.locator('.site-qr-shortcut'); await qr.click(); await expect(page.locator('#modalContactQr')).toHaveClass(/is-open/);
  await expect(page.locator('#btnCloseContactModal')).toBeFocused();
  await page.keyboard.press('Escape'); await expect(qr).toBeFocused();
  await qr.click(); await page.locator('#btnCloseContactModal').click(); await expect(qr).toBeFocused();
  const ordre = await page.evaluate(() => {
    const ids=['btnHomeFlashcards','btnHomeSandbox','btnHomeConsoleJs','btnHomeDebug','btnHomeExamenBlanc','btnHomeConstructeur','btnHomeLaboSql','btnHomeLaboAscii','btnHomeSimPhpSql','btnHomeCoffreTp'];
    const videos=document.getElementById('videos');
    return ids.map(id => {const n=document.getElementById(id);return !!n && !!(n.compareDocumentPosition(videos)&Node.DOCUMENT_POSITION_FOLLOWING)});
  });
  expect(ordre).toEqual(Array(10).fill(true));
  // v496 : plus de « Cote » ; le bandeau de news de la classe reprend son fond et son défilement.
  await expect(page.locator('#cote-sti')).toHaveCount(0);
  await page.evaluate(() => {
    sessionStorage.setItem('sti-news-perso-v1', JSON.stringify({ ts: Date.now(), etat: { actif: true, classes: { '3si': ['Texte 3e SI'], '4si': ['Texte 4e SI'] }, communs: [] } }));
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  const piste = page.locator('#newsPersoPiste');
  await expect(piste).toContainText('Texte 4e SI');
  expect(await page.locator('#bandeauNewsPerso').evaluate(e => getComputedStyle(e).backgroundImage)).toContain('rgb(11, 16, 29)');
  expect(await piste.evaluate(e => getComputedStyle(e).animationName)).toBe('cote-defile');
  const position = await piste.evaluate(e => { e.getAnimations()[0].currentTime = 0; const x0=new DOMMatrix(getComputedStyle(e).transform).m41;e.getAnimations()[0].currentTime = 1000; return [x0,new DOMMatrix(getComputedStyle(e).transform).m41]; });
  expect(position[1]).toBeLessThan(position[0]);
});

test('chaque entrée du catalogue ouvre la vidéo et toutes les commandes du lecteur historique', async ({page}) => {
  test.setTimeout(120_000);
  const erreurs=[]; page.on('pageerror',e=>erreurs.push(e.message));
  await aller(page, '/index.html'); await expect(page.locator('html')).toHaveClass(/sti-4si-autorise/);
  const videos=[['html5-cours','html5-cours.mp4'],['css3-cours','css3-cours-v9-sync'],['css3-display','displayanim.mp4'],
    ['css-positionnement','css-positionnement.mp4'],['css-animee','css-animee.mp4'],['javascript-cours','javascript-cours.mp4'],['validation-nom-prenom-js','validation-nom-prenom-js.mp4'],
    ['sql-cours','sql-cours-v7.mp4'],['sql-initiation','sql-construire-requete-guide-texte.mp4'],['sql-serie4','sql-serie4.mp4'],['sql-serie5','sql-serie5.mp4'],
    ['php-cours','php-cours.mp4'],['php-synthese','php-synthese.mp4'],['php-guichet','php-guichet-v10.mp4']];
  await expect(page.locator('#videosGrid .video-card')).toHaveCount(14);
  for (const [slug,fichier] of videos) {
    const btn=page.locator(`#videosGrid [data-play-video="${slug}"]`).last(); await btn.click();
    const m=page.locator('#sti-video-modal-overlay'); await expect(m).toBeVisible(); await expect(m).toHaveAttribute('data-slug',slug);
    await expect(page.locator('#sti-video-modal-player')).toHaveAttribute('src',new RegExp(fichier.replace('.', '\\.')));
    for (const selector of ['#sti-video-modal-title','#sti-video-modal-chap-prev','#sti-video-modal-chap-sel','#sti-video-modal-chap-next','#sti-video-modal-chap-pills button','[data-mrate="0.75"]','[data-mrate="0.85"]','[data-mrate="1"]','[data-mrate="1.25"]','#sti-video-modal-fs','#sti-video-modal-dl','#sti-video-modal-close']) await expect(page.locator(selector).first(),`${slug} ${selector}`).toBeVisible();
    await expect(page.locator('#sti-video-modal-dl')).toHaveAttribute('href',new RegExp(fichier.replace('.', '\\.')));
    await page.locator('#sti-video-modal-close').click(); await expect(m).toBeHidden(); await expect(btn).toBeFocused();
  }
  expect(erreurs).toEqual([]);
});

test('les aperçus des cours et la reprise passent par ce lecteur et gardent le bon fichier', async ({page}) => {
  const pages=[['html5','heroCourseVideo','html5-cours'],['css3','stepPositionVideo','css-positionnement'],['javascript','heroJsVideo','javascript-cours'],['sql','featuredVideo','sql-cours'],['php','featuredVideo','php-cours']];
  for (const [cours,id,slug] of pages) {
    await aller(page,`/cours/${cours}.html`); await expect(page.locator('html')).toHaveClass(/sti-4si-autorise/);
    const bouton=page.locator(`#${id}`).locator('..').locator('..').locator('.sti-lecteur-complet').first();
    await bouton.click(); await expect(page.locator('#sti-video-modal-overlay')).toHaveAttribute('data-slug',slug);
    await expect(page.locator('#sti-video-modal-card')).toHaveAttribute('aria-labelledby','sti-video-modal-title');
    await page.locator('[data-mrate="1.25"]').click(); await expect.poll(() => page.locator('#sti-video-modal-player').evaluate(v=>v.playbackRate)).toBe(1.25);
    await page.keyboard.press('Escape'); await expect(page.locator('#sti-video-modal-overlay')).toBeHidden(); await expect(bouton).toBeFocused();
  }
  await aller(page, '/cours/php.html#s9');
  await page.locator('#s9c-video .chapitre-btn').nth(2).click();
  await expect(page.locator('#sti-video-modal-overlay')).toHaveAttribute('data-slug','php-synthese');
  await expect(page.locator('#sti-video-modal-chap-pills button')).toHaveCount(17);
  await expect.poll(() => page.locator('#sti-video-modal-player').evaluate(v=>v.currentTime),{timeout:15_000}).toBeGreaterThanOrEqual(30);
});

test('PHP : synthèses dans le cours, cinq séries et dix liens originaux en bulles', async ({page}) => {
  for (const id of ['s9','s10']) {
    await aller(page, '/cours/php.html#'+id);
    await expect(page.locator('[data-course-tab="cours"]')).toHaveAttribute('aria-selected','true');
    await expect(page.locator('#'+id)).toBeVisible();
  }
  await aller(page, '/cours/php.html#exercices'); await expect(page.locator('html')).toHaveClass(/sti-4si-autorise/);
  for (const id of ['s9','s10']) expect(await page.locator('#'+id).evaluate(e=>e.closest('[data-course-panel]').dataset.coursePanel)).toBe('cours');
  await expect(page.locator('#exercices [data-exercise]')).toHaveCount(5);
  for (let n=1;n<=5;n++) {
    const carte=page.locator('#exercices article.matiere-panel').filter({hasText:`Série ${n} ·`});
    const sujet=carte.locator(`a[href="../exercices/php/Tp${n}-php.html"]`);
    const correction=n===3?'Tp3-correction-php.html':`Tp${n}-Correction-php.html`;
    const corr=carte.locator(`a[href="../exercices/php/${correction}"]`);
    await expect(sujet).toHaveCount(1); await expect(corr).toHaveCount(1);
    await sujet.click();
    await expect(page.locator('.sti-exo-fond:not([hidden]) iframe')).toHaveAttribute('src',new RegExp(`Tp${n}-php\\.html`));
    await expect(page.frameLocator('.sti-exo-fond:not([hidden]) iframe').locator('body')).toBeVisible();
    await page.locator('[data-exo-retour]').click(); await expect(sujet).toBeFocused();
    await carte.locator('summary').click(); await corr.click();
    await expect(page.locator('.sti-exo-fond:not([hidden]) iframe')).toHaveAttribute('src',new RegExp(correction.replace('.', '\\.')));
    await expect(page.frameLocator('.sti-exo-fond:not([hidden]) iframe').locator('body')).toBeVisible();
    await page.keyboard.press('Escape'); await expect(corr).toBeFocused();
  }
  const carte=page.locator('#exercices article.matiere-panel').filter({hasText:'Série 3 ·'});
  await carte.locator('[data-exercise]').check(); await expect(page.locator('#exoProgressText')).toHaveText('1 / 5 exercices faits');
  await page.reload({waitUntil:'domcontentloaded'}); await expect(page.locator('[data-exercise="serie3"]')).toBeChecked();
});

test('chaque quiz revient au cours appelant, même après rechargement ; depuis l’accueil il revient aux quiz', async ({page}) => {
  const items=[['html5','html-css'],['css3','html-css'],['javascript','javascript'],['sql','sql'],['php','php']];
  for (const [cours,quiz] of items) {
    await aller(page,`/cours/${cours}.html#exercices`); await page.locator('.course-tab--quiz').click();
    await expect(page).toHaveURL(new RegExp(`/quiz/${quiz}\\.html\\?retour=`));
    const retour=page.locator('a[aria-label="Retour au cours"]').first(); await expect(retour).toBeVisible();
    await page.reload({waitUntil:'domcontentloaded'}); await expect(retour).toBeVisible(); await retour.click();
    await expect(page).toHaveURL(new RegExp(`/cours/${cours}\\.html#exercices$`));
  }
  await aller(page,'/cours/html5.html#exercices'); await page.locator('.course-tab--quiz').click();
  await page.evaluate(() => {const lien=document.createElement('a'); lien.id='retour-bilan-test'; lien.href='../index.html#modules'; lien.textContent='Retour aux quiz'; document.body.appendChild(lien);});
  const bilan=page.locator('#retour-bilan-test'); await expect(bilan).toHaveAttribute('href',/cours\/html5\.html#exercices$/); await bilan.click();
  await expect(page).toHaveURL(/\/cours\/html5\.html#exercices$/);
  await aller(page,'/index.html#quiz'); await page.locator('#quiz a[href="quiz/tableaux.html"]').click();
  const retour=page.locator('a[aria-label="Retour aux quiz"]').first(); await expect(retour).toBeVisible(); await retour.click();
  await expect(page).toHaveURL(/\/index\.html#quiz$/);
});

test('habillage commun sans modifier les couleurs des exemples ni le style des quiz', async ({page}) => {
  await aller(page,'/glossaire.html');
  for (const [theme,couleur] of [['clair','rgb(247, 247, 242)'],['intermediaire','rgb(35, 48, 68)'],['sombre','rgb(13, 21, 38)']]) {
    await page.evaluate(t=>window.STIProfil.mettreAJour('theme',t),theme);
    await expect(page.locator('html')).toHaveAttribute('data-sti-theme',theme);
    await expect(page.locator('body')).toHaveCSS('background-color',couleur);
  }
  await page.goto('/exercices/php/Tp1-php.html',{waitUntil:'domcontentloaded'});
  await expect(page.locator('html')).toHaveAttribute('data-sti-heritage','exemple');
  const avant=await page.locator('h2').first().evaluate(e=>[getComputedStyle(e).color,getComputedStyle(e).backgroundColor]);
  await page.locator('link[href*="theme-patrimoine.css"]').evaluate(e=>e.remove());
  expect(await page.locator('h2').first().evaluate(e=>[getComputedStyle(e).color,getComputedStyle(e).backgroundColor])).toEqual(avant);
  await page.goto('/quiz/tableaux.html',{waitUntil:'domcontentloaded'});
  await expect(page.locator('link[href*="theme-patrimoine.css"]')).toHaveCount(0);
});

test('atelier Bac historique : sujets, éditeur et simulateur restent fonctionnels', async ({page}) => {
  const erreurs=[]; page.on('pageerror', e => erreurs.push(e.message));
  await aller(page, '/bac-pratique.html');
  await expect(page.locator('#ed-html')).toHaveValue(/Projet STI 0 - Sondage/);
  await expect(page.locator('#zone-enonce')).toContainText('Projet STI 0');
  await page.locator('#sel-sujet').selectOption('s1');
  await expect(page.locator('#zone-enonce')).toContainText('Club Robotique');
  await expect(page.locator('#ed-html')).toHaveValue(/Inscription Club Robotique/);
  await page.locator('#btn-exec-sim-php').click();
  await expect(page.locator('#sim-mysqli-trace')).toContainText('mysqli_query');
  await page.locator('#btn-run').click();
  await expect(page.locator('#console-js')).toContainText('aperçu mis à jour');
  expect(erreurs).toEqual([]);
});

test('guide vocal HTML5 : lecture, vitesse et repères restent fonctionnels', async ({page}) => {
  const erreurs=[]; page.on('pageerror', e => erreurs.push(e.message));
  await aller(page, '/cours/html5.html');
  await page.locator('#heroListenBtn').click();
  const audio=page.locator('#voiceGuideAudio');
  await expect.poll(()=>audio.evaluate(a=>a.paused)).toBe(false);
  await page.locator('[data-voice-rate="1.15"]').click();
  await expect.poll(()=>audio.evaluate(a=>a.playbackRate)).toBe(1.15);
  await page.waitForFunction(()=>document.getElementById('voiceGuideAudio').readyState>=1);
  await audio.evaluate(a=>{a.currentTime=46;a.dispatchEvent(new Event('timeupdate'));});
  await expect(page.locator('#voiceActiveLabel')).toContainText('Structuration');
  await audio.evaluate(a=>a.pause());
  expect(erreurs).toEqual([]);
});
