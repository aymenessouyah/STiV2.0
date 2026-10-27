import { test, expect } from '@playwright/test';
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const racine = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/* Sessions fictives : aucun compte ou accès Supabase réel n'est utilisé. */
async function session(page, classe = '4SI 1') {
  await page.route('**/sw.js*', route => route.abort());
  await page.addInitScript(cl => {
    try {
      const s = {nativeAuthenticated:true, statut:'actif', email:'eleve-test@example.invalid', role:'eleve', classe:cl, lycee:'Lycée Raféha'};
      window.__STI_NATIVE_AUTHENTICATED_V316 = true;
      sessionStorage.setItem('sti-native-session-v316', '1');
      sessionStorage.setItem('sti-session-cache', JSON.stringify(s));
      localStorage.setItem('sti-session-cache', JSON.stringify(s));
      localStorage.setItem('sti-demo-vu', '1');
    } catch (e) { /* Les iframes sandbox n'ont pas accès au stockage. */ }
  }, classe);
}

const cours = ['html5', 'css3', 'javascript', 'sql', 'php'];

test('les cinq cours ont des objectifs, une durée calculée et des étapes réellement navigables', async ({page}) => {
  test.setTimeout(180_000);
  await session(page); await page.emulateMedia({reducedMotion:'reduce'});
  const erreurs=[]; page.on('pageerror', e => erreurs.push(e.message));
  for (const matiere of cours) {
    await page.goto(`/cours/${matiere}.html`, {waitUntil:'domcontentloaded'});
    await page.waitForFunction(() => window.STIProfil && document.querySelector('[data-estimation-lecture]'));
    const presentation=page.locator('[data-sti-feuille-de-route]');
    await expect(presentation.getByRole('heading',{name:'Dans cette leçon'})).toBeVisible();
    await expect(presentation.getByText('À la fin, vous serez en mesure de :')).toBeVisible();
    await expect(presentation.locator('.course-lesson__objectifs li')).toHaveCount(3);
    await expect(presentation.getByRole('heading',{name:'Feuille de route du cours'})).toBeVisible();
    const duree=await page.locator('[data-estimation-lecture]').textContent();
    // Le calcul prend le texte pédagogique d'origine avant l'ajout des commandes dynamiques.
    const html=readFileSync(join(racine,`cours/${matiere}.html`),'utf8');
    const estimation=await page.evaluate(source => {
      const documentSource=new DOMParser().parseFromString(source,'text/html');
      const chapitres=documentSource.querySelectorAll('[data-course-panel="cours"] [data-chapter-id]');
      const texte=[...chapitres].map(chapitre => {
        const copie=chapitre.cloneNode(true);
        copie.querySelectorAll('script,style,button,nav,svg,audio,video,iframe,[aria-hidden="true"]').forEach(e=>e.remove());
        return copie.textContent || '';
      }).join(' ');
      const mots=texte.match(/[A-Za-zÀ-ÖØ-öø-ÿ0-9]+(?:['’_-][A-Za-zÀ-ÖØ-öø-ÿ0-9]+)*/g)||[];
      return Math.max(1,Math.ceil(mots.length/180));
    },html);
    expect(parseInt(duree,10),matiere).toBe(estimation);
    expect(estimation,matiere).toBeGreaterThan(1);
    await expect(page.locator('.course-reading-time')).toContainText('hors vidéos');
    const liens=presentation.locator('[data-feuille-etape]');
    expect(await liens.count(),matiere).toBeGreaterThanOrEqual(4);
    for (let i=0;i<await liens.count();i++) {
      const lien=liens.nth(i), href=await lien.getAttribute('href');
      await expect(page.locator(href),`${matiere} ${href}`).toHaveCount(1);
      await lien.click();
      await expect.poll(() => page.evaluate(() => location.hash),{message:`${matiere} ${href}`}).toBe(href);
      await expect(page.locator(href),`${matiere} ${href}`).toBeVisible();
    }
  }
  expect(erreurs).toEqual([]);
});

test('les feuilles de route restent lisibles dans les trois thèmes et sur mobile', async ({page}) => {
  test.setTimeout(150_000); await session(page);
  for (const matiere of cours) {
    await page.goto(`/cours/${matiere}.html`, {waitUntil:'domcontentloaded'});
    await page.waitForFunction(() => window.STIProfil);
    for (const theme of ['clair','sombre','intermediaire']) {
      await page.evaluate(t => STIProfil.mettreAJour('theme',t),theme);
      await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
      for (const largeur of [320,390,1365]) {
        await page.setViewportSize({width:largeur,height:844});
        await expect(page.locator('[data-sti-feuille-de-route]')).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth-innerWidth),`${matiere}/${theme}/${largeur}`).toBe(0);
      }
    }
  }
});

test('les récapitulatifs sont animés sans changer leurs actions, et respectent le mouvement réduit', async ({page}) => {
  await session(page);
  for (const [matiere,selecteur,modal] of [
    ['javascript','#btn-magique-js-recap, .js-side-recap','#jsRecapModal'],
    ['php','button[data-modal-open="recapModal"]','#recapModal']
  ]) {
    await page.goto(`/cours/${matiere}.html`, {waitUntil:'domcontentloaded'});
    const boutons=page.locator(selecteur); expect(await boutons.count()).toBeGreaterThan(0);
    for (let i=0;i<await boutons.count();i++) await expect(boutons.nth(i)).toHaveCSS('animation-name','sti-recap-attention');
    await page.emulateMedia({reducedMotion:'reduce'});
    for (let i=0;i<await boutons.count();i++) await expect(boutons.nth(i)).toHaveCSS('animation-name','none');
    await boutons.first().click(); await expect(page.locator(modal)).toBeVisible();
    await page.keyboard.press('Escape'); await expect(page.locator(modal)).toBeHidden();
    await page.emulateMedia({reducedMotion:'no-preference'});
  }
});

test('la vidéo principale PHP est le cours original avec toutes les commandes de la capture', async ({page}) => {
  await session(page); const erreurs=[]; page.on('pageerror',e=>erreurs.push(e.message));
  await page.goto('/cours/php.html',{waitUntil:'domcontentloaded'});
  const video=page.locator('#featuredVideo');
  await expect(video).toHaveAttribute('src','../assets/videos/php-cours.mp4');
  await expect(video).toHaveAttribute('poster','../assets/images/php-cours-poster.jpg');
  await expect(video).toHaveAttribute('data-video-id','php-cours');
  await expect(page.locator('[data-featured-time]')).toHaveCount(13);
  await video.locator('..').locator('..').locator('.sti-lecteur-complet').click();
  const lecteur=page.locator('#sti-video-modal-overlay');
  await expect(lecteur).toBeVisible(); await expect(lecteur).toHaveAttribute('data-slug','php-cours');
  await expect(page.locator('#sti-video-modal-title')).toContainText('Cours PHP & MySQLi complet animé');
  await expect(page.locator('#sti-video-modal-player')).toHaveAttribute('src',/php-cours\.mp4/);
  await expect(page.locator('#sti-video-modal-chap-pills button')).toHaveCount(13);
  for (const id of ['#sti-video-modal-chap-prev','#sti-video-modal-chap-sel','#sti-video-modal-chap-next','[data-mrate="0.75"]','[data-mrate="0.85"]','[data-mrate="1"]','[data-mrate="1.25"]','#sti-video-modal-fs','#sti-video-modal-dl','#sti-video-modal-close']) {
    await expect(page.locator(id).first(),id).toBeVisible();
  }
  await expect(page.locator('#sti-video-modal-dl')).toHaveAttribute('href',/php-cours\.mp4/);
  await page.locator('#sti-video-modal-chap-pills button').nth(2).click();
  await expect.poll(() => page.locator('#sti-video-modal-player').evaluate(v=>v.currentTime),{timeout:15_000}).toBeGreaterThanOrEqual(64);
  await page.keyboard.press('Escape'); await expect(lecteur).toBeHidden();
  expect(erreurs).toEqual([]);
});

test('les ressources complémentaires et les séries SQL historiques sont accessibles en bulles', async ({page,context}) => {
  test.setTimeout(120_000); await session(page); let nouvellesPages=0; context.on('page',()=>nouvellesPages++);
  const fond=page.locator('.sti-exo-fond:not(.sti-exo-enfant)');
  for (const [matiere,ressources] of [
    ['html5',['emploidutemps.html','formulaire-inscription.pdf.html']],
    ['sql',['atelier_sql_3_fenetres.html','CommentConstruireunerequ%C3%AAteSQL.html']]
  ]) {
    await page.goto(`/cours/${matiere}.html#exercices`,{waitUntil:'domcontentloaded'});
    for (const chemin of ressources) {
      const bouton=page.locator(`[data-course-panel="exercices"] a[href*="${chemin}"]`).first();
      await bouton.click(); await expect(fond).toBeVisible();
      await expect(fond.locator('iframe')).toHaveAttribute('src',new RegExp(chemin.replaceAll('.','\\.')));
      await fond.locator('[data-exo-plein]').click(); await expect(fond).toHaveClass(/est-plein/);
      await fond.locator('[data-exo-retour]').click(); await expect(fond).toBeHidden(); await expect(bouton).toBeFocused();
    }
  }
  const catalogue=page.locator('[data-course-panel="exercices"] a[href$="series-exercices.html#bdd"]');
  await catalogue.click(); await expect(fond).toBeVisible();
  const frame=page.frameLocator('.sti-exo-fond:not(.sti-exo-enfant) iframe');
  await expect(frame.locator('#bdd h2')).toContainText('Base de données');
  const serie3=frame.locator('button[onclick*="Tp-GroupBy-bd.html"]');
  await expect(serie3).toBeVisible(); await serie3.click();
  await expect(frame.locator('#pdfModal')).toHaveClass(/open/);
  // La visionneuse historique navigue par location.replace sans changer l'attribut src.
  await expect.poll(() => frame.locator('#pdfFrame').evaluate(el => el.contentWindow.location.href)).toMatch(/Tp-GroupBy-bd\.html/);
  await frame.locator('#modalOpenTabBtn').click(); await expect(serie3).toBeFocused();
  await fond.locator('[data-exo-retour]').click(); await expect(catalogue).toBeFocused();
  expect(nouvellesPages).toBe(0);
});

test('le parcours SQL ne dévoile pas l’étape Bac aux élèves de 3SI', async ({page}) => {
  await session(page,'3SI 1'); await page.goto('/cours/sql.html',{waitUntil:'domcontentloaded'});
  await expect(page.locator('html')).not.toHaveClass(/sti-4si-autorise/);
  await expect(page.locator('[data-feuille-etape][href="#bac"]')).toBeHidden();
  await expect(page.locator('[data-feuille-etape][href="#lmd"]')).toBeVisible();
  await page.locator('[data-course-tab="exercices"]').click();
  const catalogue=page.locator('[data-course-panel="exercices"] a[href$="series-exercices.html#bdd"]');
  await catalogue.click();
  const frame=page.frameLocator('.sti-exo-fond:not(.sti-exo-enfant) iframe');
  await expect(frame.locator('button[onclick*="Tp-GroupBy-bd.html"]')).toBeHidden();
  await page.locator('.sti-exo-fond:not(.sti-exo-enfant) [data-exo-retour]').click();
  await expect(catalogue).toBeFocused();
  await page.goto('/cours/php.html',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#sti-lock-4si')).toBeVisible();
});

function pagesHTML(dossier) {
  const exclus = new Set(['.git','node_modules','test-results','tests','coverage','dist','build']);
  return readdirSync(dossier,{withFileTypes:true}).flatMap(entree => {
    if (entree.name.startsWith('.') || exclus.has(entree.name)) return [];
    const nom=join(dossier,entree.name);
    if (entree.isDirectory()) return pagesHTML(nom);
    return entree.isFile() && entree.name.endsWith('.html') ? [relative(racine,nom).split(sep).join('/')] : [];
  });
}

test('les pages locales répondent et leurs liens et ressources statiques existent', async ({page,request}) => {
  test.setTimeout(180_000);
  const chemins=pagesHTML(racine).sort(); expect(chemins.length).toBeGreaterThanOrEqual(130);
  const erreurs=[];
  // Par lots pour ne pas saturer le serveur de test et respecter les chemins sensibles à la casse.
  for(let i=0;i<chemins.length;i+=12) {
    await Promise.all(chemins.slice(i,i+12).map(async chemin => {
      const url='/'+chemin.split('/').map(encodeURIComponent).join('/');
      try { const r=await request.get(url); if(r.status()!==200) erreurs.push(`${chemin} : HTTP ${r.status()}`); }
      catch(e) { erreurs.push(`${chemin} : ${e.message}`); }
    }));
  }
  const documents=chemins.map(nom=>({nom,html:readFileSync(join(racine,nom),'utf8')}));
  const ressources=await page.evaluate(docs => docs.flatMap(({nom,html}) => {
    const d=new DOMParser().parseFromString(html,'text/html');
    return [...d.querySelectorAll('a[href],iframe[src],script[src],link[href],video[src],audio[src],source[src],img[src]')].map(el => ({
      page:nom, url:el.getAttribute('href') || el.getAttribute('src') || ''
    }));
  }),documents);
  for(const {page:origine,url} of ressources) {
    if(!url || url.startsWith('#') || /^(?:https?:|data:|blob:|javascript:|mailto:|tel:)/i.test(url)) continue;
    let relatif;
    try {
      const adresse=new URL(url,`http://sti.local/${origine}`);
      if(adresse.origin!=='http://sti.local') continue;
      relatif=decodeURIComponent(adresse.pathname).replace(/^\//,'');
    } catch { continue; }
    if(!relatif || relatif.includes('\0')) continue;
    let cible=resolve(racine,relatif); if(!cible.startsWith(racine+sep)) continue;
    if(existsSync(cible) && statSync(cible).isDirectory()) cible=join(cible,'index.html');
    if(!existsSync(cible)) erreurs.push(`${origine} → ${url}`);
  }
  expect(erreurs).toEqual([]);
});
