import { test, expect } from '@playwright/test';

/* Identité 4SI fictive pour les interactions ; le verrou réel est testé séparément. */
test.beforeEach(async ({page})=>{
  await page.route('**/assets/js/config.js*',async route=>{
    const response=await route.fetch(), texte=await response.text(), fin=texte.indexOf('};')+2;
    await route.fulfill({response,body:texte.slice(0,fin)+"\nwindow.STI_AUTH.URL=''; window.__STI_GOLD=true;\n"+texte.slice(fin)});
  });
  await page.addInitScript(()=>document.addEventListener('DOMContentLoaded',()=>document.documentElement.classList.add('sti-4si-autorise'),{once:true}));
});
async function ouvrir(page,type,hash=''){
  await page.goto(`/cours/${type}.html${hash}`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.STIProfil && window.ouvrirVideoPasAPasSTI && document.querySelector('.code-box')));
}

test('SQL : chapitres, code, lecture, onglets, copie et persistance',async({page})=>{
  const erreurs=[];page.on('pageerror',e=>erreurs.push(e.message));await ouvrir(page,'sql');
  await expect(page.locator('[data-chapter-id]')).toHaveCount(4);
  await expect(page.locator('.legacy-sql .code-box')).toHaveCount(28);
  await expect(page.locator('[data-course-tab]')).toHaveCount(4);
  await expect(page.locator('#sqlGuideAudio')).toHaveAttribute('src',/sql-cours\.mp3/);
  const raw=await page.locator('#intro-cles pre').first().textContent();
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText(t){window.__copie=t;return Promise.resolve();}},configurable:true}));
  await page.locator('#intro-cles .code-box__btn').first().click();
  expect(await page.evaluate(()=>window.__copie)).toBe(raw);
  await page.locator('[data-toggle-revise="ldd"]').click();await expect(page.locator('#courseProgressText')).toContainText('1 / 4');
  await page.locator('[data-course-tab="exercices"]').click();await page.locator('[data-exercise="tp1"]').check();
  await expect(page.locator('#exoProgressText')).toHaveText('1 / 6 exercices faits');
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.locator('[data-exercise="tp1"]')).toBeChecked();
  await expect(page.locator('[data-toggle-revise="ldd"]')).toHaveAttribute('aria-pressed','true');
  await page.goto('/cours/sql.html#lmd-groupby');await expect(page.locator('#cours')).toBeVisible();
  await expect(page.locator('#lmd-groupby')).toBeVisible();expect(erreurs).toEqual([]);
});

test('SQL : atelier SQLite, erreurs et corrections masquées',async({page})=>{
  await ouvrir(page,'sql','#exercices');
  const solution=page.locator('.matiere-panel').filter({hasText:'TP 1 · Premières requêtes'}).locator('details');
  await expect(solution.locator('a')).toBeHidden();await solution.locator('summary').click();await expect(solution.locator('a')).toBeVisible();
  await page.locator('#runSql').click();await expect(page.locator('#sqlResult')).toContainText('Salma',{timeout:15000});
  await expect(page.locator('#sqlResult tbody tr')).toHaveCount(3);
  await page.locator('#sqlEditor').fill('SELECT * FROM table_inexistante;');await page.locator('#runSql').click();
  await expect(page.locator('#sqlResult')).toContainText('SQLite :',{timeout:15000});
});

test('SQL : animations, modale des contraintes et quatre vidéos réelles',async({page})=>{
  await ouvrir(page,'sql');
  await page.locator('#janim-btn-next').click();
  await expect(page.locator('#sql-jointure-anim-app')).toContainText('Client');
  await page.locator('#btnSqlContraintes').click();await expect(page.locator('#sqlContraintesModal')).toBeVisible();
  await expect(page.locator('#sqlContraintesClose')).toBeFocused();
  expect(await page.locator('main').evaluate(e=>e.inert)).toBe(true);
  await expect(page.locator('#sqlContraintesFrame')).toHaveAttribute('loading','lazy');
  await expect(page.locator('#sqlContraintesFrame')).toHaveAttribute('src','sql-contraintes.html?embed=1');
  await page.locator('#sqlContraintesFull').click();await expect(page.locator('#sqlContraintesModal')).toHaveClass(/full/);
  await page.locator('#sqlContraintesFull').click();
  const w=await page.locator('#sqlContraintesBox').evaluate(e=>e.getBoundingClientRect().width);
  await page.locator('#sqlContraintesBox .matiere-resize').focus();await page.keyboard.press('ArrowLeft');
  expect(await page.locator('#sqlContraintesBox').evaluate(e=>e.getBoundingClientRect().width)).toBeLessThan(w);
  await page.keyboard.press('Escape');await expect(page.locator('#sqlContraintesModal')).toBeHidden();await expect(page.locator('#btnSqlContraintes')).toBeFocused();
  await page.locator('[data-course-tab="videos"]').click();
  for(const id of ['sql-cours','sql-initiation','sql-serie4','sql-serie5']){
    await page.locator(`[data-video-open="${id}"]`).last().click();await expect(page.locator('#matiereVideoModal')).toBeVisible();
    const src=await page.locator('#modalVideo').getAttribute('src');expect(src).toContain(id==='sql-initiation'?'exercices/sql/sql-construire-requete-guide-texte.mp4':id==='sql-cours'?'sql-cours-v7.mp4':id+'.mp4');
    await page.keyboard.press('Escape');await expect(page.locator('#matiereVideoModal')).toBeHidden();
  }
});

test('PHP : dix chapitres, énoncés et solutions originaux en fenêtres accessibles',async({page})=>{
  const erreurs=[];page.on('pageerror',e=>erreurs.push(e.message));await ouvrir(page,'php');
  await expect(page.locator('[data-chapter-id]')).toHaveCount(10);await expect(page.locator('.legacy-php .code-box')).toHaveCount(40);
  await page.locator('[data-modal-open="animModal"]').first().click();await expect(page.locator('#animModal')).toBeVisible();
  await expect(page.locator('#animFrame')).toHaveAttribute('src','php-mysqli.html?embed=1');
  await expect(page.locator('#animClose')).toBeFocused();await page.keyboard.press('Escape');await expect(page.locator('#animModal')).toBeHidden();
  await page.locator('[data-modal-open="recapModal"]').first().click();await expect(page.locator('#recapModal')).toBeVisible();
  await expect(page.locator('#recapFrame')).toHaveAttribute('src','PHP-recap.html?embed=1');
  await expect.poll(()=>page.evaluate(()=>window.STIProfil.chargerProfil().laboratoires.php)).toContain('recap-php');
  await page.keyboard.press('Escape');
  await page.locator('[data-course-tab="exercices"]').click();
  for(const [btn,modal] of [['#btnExoS10','#exoModal'],['#btnExoS11','#exo2Modal']]){
    await page.locator(btn).click();await expect(page.locator(modal)).toBeVisible();await page.keyboard.press('Escape');await expect(page.locator(modal)).toBeHidden();
  }
  await page.locator('#s9 .sol-open[data-sol="php"]').click();await expect(page.locator('#solPanel-php')).toBeVisible();
  await expect(page.locator('#solPanel-html')).toBeHidden();await expect(page.locator('#solPanel-php .line-details')).toHaveCount(4);
  await page.locator('#solPanel-php .line-details summary').first().click();await expect(page.locator('#solPanel-php .line-details table').first()).toBeVisible();
  await page.keyboard.press('Escape');
  await page.locator('#s10 .sol2-open[data-sol2="php"]').click();await expect(page.locator('#sol2Panel-php')).toBeVisible();await expect(page.locator('#sol2Panel-php .line-details')).toHaveCount(1);
  await page.keyboard.press('Escape');await expect(page.locator('#sol2Modal')).toBeHidden();expect(erreurs).toEqual([]);
});

test('PHP : quiz original, vidéo, chapitres synchronisés et reprise du profil',async({page})=>{
  await ouvrir(page,'php','#s9c');await expect(page.locator('#exercices')).toBeVisible();await expect(page.locator('.synth-question')).toHaveCount(10);
  const bonnes=[0,2,1,0,1,2,1,2,1,2];for(let i=0;i<bonnes.length;i++)await page.locator(`input[name="synthq${i+1}"][value="${bonnes[i]}"]`).check();
  await page.locator('#btnCorrigerQuiz').click();await expect(page.locator('#scoreQuiz')).toContainText('10 / 10');
  expect((await page.evaluate(()=>window.STIProfil.chargerProfil().quiz)).at(-1)).toMatchObject({score:10,total:10,matiere:'PHP — Quiz de synthèse'});
  await page.locator('[data-exercise="s9"]').check();await expect(page.locator('#exoProgressText')).toHaveText('1 / 2 exercices faits');
  await page.locator('[data-course-tab="cours"]').click();
  await page.locator('#featuredVideo').evaluate(v=>v.load());await page.waitForFunction(()=>document.querySelector('#featuredVideo').readyState>=1);
  await page.locator('#featuredVideo').evaluate(v=>{v.currentTime=25;v.dispatchEvent(new Event('pause'));});
  expect(await page.evaluate(()=>window.STIProfil.chargerProfil().videos.positions['php-synthese'])).toBe(25);
  await page.locator('[data-featured-time="79.37"]').click();await expect.poll(()=>page.locator('#featuredVideo').evaluate(v=>v.currentTime)).toBeGreaterThanOrEqual(79);
  await page.locator('[data-course-tab="videos"]').click();await expect(page.locator('.matiere-video-card')).toHaveCount(3);
  await page.locator('[data-video-open="php-synthese"]').last().click();await expect(page.locator('#matiereVideoModal')).toBeVisible();
  await page.locator('#modalVideo').evaluate(v=>v.dispatchEvent(new Event('ended')));expect(await page.evaluate(()=>window.STIProfil.chargerProfil().videos.vues)).toContain('php-synthese');
  await page.keyboard.press('Escape');
});

test('SQL et PHP : mobile, RTL, thèmes et absence de débordement',async({page})=>{
  for(const type of ['sql','php']){
    await page.setViewportSize({width:390,height:844});await ouvrir(page,type);
    await page.locator('#tocMobileOpenBtn').click();await expect(page.locator('#tocMobileOpenBtn')).toHaveAttribute('aria-expanded','true');
    await page.keyboard.press('Escape');await expect(page.locator('#tocMobileOpenBtn')).toHaveAttribute('aria-expanded','false');
    for(const theme of ['clair','intermediaire','sombre']){await page.evaluate(t=>window.STIProfil.mettreAJour('theme',t),theme);await expect(page.locator('html')).toHaveAttribute('data-theme',theme);}
    for(const langue of ['fr','ar']){await page.evaluate(l=>window.STIProfil.mettreAJour('langue',l),langue);for(const w of [320,390]){await page.setViewportSize({width:w,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth),`${type}/${langue}/${w}`).toBe(0);}}
    await page.locator('[data-course-tab="annexes"]').click();await expect(page.locator('#annexes')).toBeVisible();
  }
});
