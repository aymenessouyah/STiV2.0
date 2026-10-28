import { test, expect } from '@playwright/test';
import axe from 'axe-core';

test.use({ serviceWorkers: 'block' });

/* Session et cloud fictifs : aucun compte réel ni fichier protégé n'est modifié. */
test.beforeEach(async ({ page }) => {
  await page.route('https://*.supabase.co/**', route => route.abort());
  await page.route('**/assets/js/config.js*', async route => {
    const reponse = await route.fetch(), source = await reponse.text();
    const fin = source.indexOf('};') + 2;
    await route.fulfill({ response: reponse, body: source.slice(0, fin) + "\nwindow.STI_AUTH.URL = ''; window.__STI_GOLD = true;\n" + source.slice(fin) });
  });
  await page.addInitScript(() => {
    try {
      const s = { nativeAuthenticated:true, statut:'actif', id:'stories-test', email:'stories@example.invalid', prenom:'Amel', nom:'Test', role:'eleve', classe:'4SI 1' };
      window.__STI_NATIVE_AUTHENTICATED_V316 = true;
      sessionStorage.setItem('sti-native-session-v316','1'); sessionStorage.setItem('sti-session-cache',JSON.stringify(s));
      localStorage.setItem('sti-session-cache',JSON.stringify(s)); localStorage.setItem('sti-demo-vu','1');
    } catch (e) {}
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

async function accueil(page) {
  await page.goto('/index.html', { waitUntil:'domcontentloaded' });
  await expect(page.locator('.story-card')).toHaveCount(5);
}
async function lecture(page) {
  const video = page.locator('.story-viewer__video');
  await expect.poll(() => video.evaluate(v => v.currentTime), {timeout:15000}).toBeGreaterThan(.25);
  await expect(page.locator('.story-viewer__status')).toContainText('lecture en cours');
}

test('ordre aléatoire à la visite, mélange manuel et aucun extrait demandé avant ouverture', async ({ page }) => {
  const requetes = [];
  page.on('request', r => { if (r.url().includes('/assets/videos/stories/')) requetes.push(r.url()); });
  await page.addInitScript(() => { Math.random = () => location.search.includes('tirage=a') ? 0 : .999; });
  await page.goto('/index.html?tirage=a', {waitUntil:'domcontentloaded'});
  await expect(page.locator('.story-card')).toHaveCount(5);
  const ordreA = await page.locator('.story-card').evaluateAll(cs => cs.map(c => c.dataset.story));
  expect(new Set(ordreA).size).toBe(5);
  await page.getByRole('button', {name:'Mélanger les stories'}).click();
  const ordreMelange = await page.locator('.story-card').evaluateAll(cs => cs.map(c => c.dataset.story));
  expect(ordreMelange).not.toEqual(ordreA);
  await page.goto('/index.html?tirage=b', {waitUntil:'domcontentloaded'});
  await expect(page.locator('.story-card')).toHaveCount(5);
  const ordreB = await page.locator('.story-card').evaluateAll(cs => cs.map(c => c.dataset.story));
  expect(ordreB).not.toEqual(ordreA);
  expect(requetes).toEqual([]);
  await expect.poll(() => page.locator('#videosGrid .video-card').count()).toBeGreaterThanOrEqual(9);
  await expect(page.locator('.hero')).toBeVisible();
});

test('les cinq extraits MP4 sont lus sans modifier le suivi des vidéos du cours', async ({ page }) => {
  await accueil(page);
  await page.waitForFunction(() => Boolean(window.STIProfil));
  const avant = await page.evaluate(() => ({ videos: window.STIProfil.chargerProfil().videos, historique: localStorage.getItem('sti-media-prog-v1') }));
  const erreurs = []; page.on('pageerror', e => erreurs.push(e.message));
  for (const id of ['intro','selecteurs','display','flexbox','transitions']) {
    const carte = page.locator(`.story-card[data-story="${id}"]`);
    await carte.click(); await lecture(page);
    const etat = await page.locator('.story-viewer video').evaluate(v => ({
      source:v.currentSrc, duree:v.duration, largeur:v.videoWidth, hauteur:v.videoHeight, muet:v.muted, paused:v.paused
    }));
    expect(etat.source).toMatch(/^blob:/);
    expect(etat.duree).toBeGreaterThan(7); expect(etat.duree).toBeLessThan(20);
    expect(etat.largeur).toBe(1280); expect(etat.hauteur).toBe(720);
    expect(etat.muet).toBe(true); expect(etat.paused).toBe(false);
    /* Comparer la vignette à la vraie image du clip, pas seulement sa durée. */
    const ecart = await page.locator('.story-viewer video').evaluate(async (v, id) => {
      v.pause();
      await new Promise(resolve => { v.addEventListener('seeked', resolve, {once:true}); v.currentTime = 1; });
      const image = document.querySelector(`.story-card[data-story="${id}"] .story-card__image`);
      await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = 160; canvas.height = 90;
      const ctx = canvas.getContext('2d', {willReadFrequently:true});
      ctx.drawImage(v, 0, 0, 160, 90); const frame = ctx.getImageData(0,0,160,90).data;
      ctx.drawImage(image, 0, 0, 160, 90); const affiche = ctx.getImageData(0,0,160,90).data;
      let difference = 0; for (let i = 0; i < frame.length; i += 4) {
        difference += Math.abs(frame[i]-affiche[i]) + Math.abs(frame[i+1]-affiche[i+1]) + Math.abs(frame[i+2]-affiche[i+2]);
      }
      return difference / (160 * 90 * 3);
    }, id);
    expect(ecart, `La vignette ${id} correspond à son extrait`).toBeLessThan(6);
    await page.keyboard.press('Escape');
    await expect(carte).toBeFocused();
  }
  const apres = await page.evaluate(() => ({ videos: window.STIProfil.chargerProfil().videos, historique: localStorage.getItem('sti-media-prog-v1') }));
  expect(apres).toEqual(avant);
  expect(erreurs).toEqual([]);
});

test('commandes, lecture réelle, progression et passage automatique à la story suivante', async ({ page }) => {
  await accueil(page);
  const cartes = page.locator('.story-card'), noms = await cartes.evaluateAll(cs => cs.map(c => c.dataset.story));
  await cartes.first().click(); await lecture(page);
  const video = page.locator('.story-viewer video');
  await page.getByRole('button', {name:'Activer le son'}).click();
  expect(await video.evaluate(v => v.muted)).toBe(false);
  await page.getByRole('button', {name:'Activer les sous-titres'}).click();
  await expect.poll(() => video.evaluate(v => v.textTracks[0]?.mode)).toBe('showing');
  await expect.poll(() => video.evaluate(v => v.textTracks[0]?.cues?.length || 0)).toBeGreaterThan(1);
  await expect(page.getByRole('button', {name:'Masquer les sous-titres'})).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', {name:'Mettre en pause'}).click();
  expect(await video.evaluate(v => v.paused)).toBe(true);
  await expect(page.getByRole('button', {name:'Reprendre', exact:true})).toBeVisible();
  await page.getByRole('button', {name:'Reprendre', exact:true}).click(); await lecture(page);
  await page.getByRole('button', {name:'Story suivante'}).click(); await lecture(page);
  await expect(page.locator('.story-viewer__counter')).toHaveText('Story 2 / 5');
  expect(await page.locator('.story-viewer__progress-fill').first().evaluate(e => e.style.width)).toBe('100%');
  await video.evaluate(v => { v.currentTime = v.duration * .6; });
  await expect.poll(() => video.evaluate(v => v.paused)).toBe(false);
  await video.evaluate(v => { v.currentTime = v.duration - .15; });
  await expect(page.locator('.story-viewer__counter')).toHaveText('Story 3 / 5', {timeout:15000});
  await expect(page.locator('.story-viewer__title')).toHaveText(await cartes.nth(2).locator('.story-card__name').innerText());
  await page.getByRole('button', {name:'Story précédente'}).click();
  await expect(page.locator('.story-viewer__counter')).toHaveText('Story 2 / 5');
  await page.getByRole('button', {name:'Fermer les stories'}).click();
  await expect(cartes.first()).toBeFocused();
  expect(noms.length).toBe(5);
});

test('clavier, focus piégé, fermeture, transcription et retour au lecteur historique', async ({ page }) => {
  await accueil(page);
  const carte = page.locator('.story-card[data-story="display"]'); await carte.focus(); await page.keyboard.press('Enter'); await lecture(page);
  const dialogue = page.locator('.story-viewer'); await expect(dialogue).toHaveAttribute('aria-labelledby','storyTitle');
  await dialogue.locator('summary').click();
  await expect(dialogue.locator('.story-viewer__transcript p')).toContainText('Inline-block');
  await dialogue.getByRole('button', {name:'Voir la vidéo complète'}).focus();
  await page.keyboard.press('Tab'); await expect(dialogue.getByRole('button', {name:'Activer le son'})).toBeFocused();
  await page.keyboard.press('Shift+Tab'); await expect(dialogue.getByRole('button', {name:'Voir la vidéo complète'})).toBeFocused();
  await page.keyboard.press('Escape'); await expect(dialogue).toBeHidden(); await expect(carte).toBeFocused();
  await carte.click(); await lecture(page);
  await dialogue.getByRole('button', {name:'Voir la vidéo complète'}).click();
  await expect(dialogue).toBeHidden();
  await expect(page.locator('#sti-video-modal-overlay')).toBeVisible();
  await expect(page.locator('#sti-video-modal-overlay')).toHaveAttribute('data-slug','css3-cours');
  await expect.poll(() => page.locator('#sti-video-modal-player').evaluate(v => v.currentTime), {timeout:15000}).toBeGreaterThanOrEqual(294);
  await page.keyboard.press('Escape');
});

test('téléphone, paysage et thèmes : aucune commande coupée ni débordement horizontal', async ({ page }) => {
  for (const taille of [{width:320,height:568},{width:390,height:844},{width:700,height:400},{width:1365,height:900}]) {
    await page.setViewportSize(taille); await accueil(page);
    for (const theme of ['clair','sombre','intermediaire']) {
      await page.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme);
      const carte = page.locator('.story-card').first(); await carte.click();
      const dialogue = page.locator('.story-viewer'); await expect(dialogue).toBeVisible();
      await expect(dialogue.getByRole('button', {name:'Fermer les stories'})).toBeInViewport({ratio:1});
      await expect(dialogue.getByRole('button', {name:'Voir la vidéo complète'})).toBeVisible();
      const couleurs = await dialogue.locator('.story-viewer__description').evaluate(el => ({ couleur:getComputedStyle(el).color, code:getComputedStyle(el).getPropertyValue('--code-text').trim() }));
      expect(couleurs.couleur).not.toBe('rgb(15, 23, 42)');
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(taille.width);
      await page.keyboard.press('Escape');
      await expect(carte).toBeFocused();
    }
  }
});

test('glissement tactile, fermeture par fond et arrêt de lecture', async ({ page }) => {
  await page.setViewportSize({width:390,height:844}); await accueil(page);
  await page.locator('.story-card').first().click(); await lecture(page);
  const scene = page.locator('.story-viewer__stage');
  await scene.evaluate(el => {
    const debut = new Touch({identifier:1,target:el,clientX:290,clientY:200});
    const fin = new Touch({identifier:1,target:el,clientX:100,clientY:202});
    el.dispatchEvent(new TouchEvent('touchstart',{touches:[debut],changedTouches:[debut],bubbles:true}));
    el.dispatchEvent(new TouchEvent('touchend',{touches:[],changedTouches:[fin],bubbles:true}));
  });
  await expect(page.locator('.story-viewer__counter')).toHaveText('Story 2 / 5');
  await page.keyboard.press('Escape');
  const etat = await page.locator('.story-viewer video').evaluate(v => ({paused:v.paused,src:v.getAttribute('src')}));
  expect(etat).toEqual({paused:true,src:null});
  await expect(page.locator('html')).not.toHaveClass(/sti-stories-open/);
});

test('échec réseau : message explicite puis nouvelle tentative possible', async ({ page }) => {
  await accueil(page);
  const carte = page.locator('.story-card').first(), id = await carte.getAttribute('data-story');
  const motif = `**/assets/videos/stories/${id}.mp4`;
  await page.route(motif, route => route.fulfill({status:503,body:'panne'}));
  await carte.click();
  await expect(page.locator('.story-viewer__status')).toContainText('indisponible');
  await expect(page.getByRole('button', {name:'Réessayer'})).toBeVisible();
  await page.unroute(motif);
  await page.getByRole('button', {name:'Réessayer'}).click(); await lecture(page);
});

test('si la feuille ne peut être chargée, le reste de l’accueil reste utilisable', async ({ page }) => {
  await page.route('**/assets/css/stories.css*', route => route.fulfill({status:503,body:''}));
  await page.goto('/index.html', {waitUntil:'domcontentloaded'});
  await expect(page.locator('#stories')).toHaveCount(0);
  await expect(page.locator('.hero')).toBeVisible();
  await expect.poll(() => page.locator('#videosGrid .video-card').count()).toBeGreaterThanOrEqual(9);
});


test('enchaînement réel des cinq extraits jusqu’à la fermeture, sans interlude QR', async ({ page }) => {
  await accueil(page);
  const avant = await page.evaluate(() => ({ videos: window.STIProfil.chargerProfil().videos, historique: localStorage.getItem('sti-media-prog-v1') }));
  const carte = page.locator('.story-card').first(); await carte.click(); await lecture(page);
  await page.locator('.story-viewer video').evaluate(v => {
    v.defaultPlaybackRate = 8; v.playbackRate = 8;
    v.addEventListener('loadedmetadata', () => { v.playbackRate = 8; });
  });
  await expect(page.locator('.story-viewer')).toBeHidden({timeout:35000});
  await expect(carte).toBeFocused();
  await expect(page.locator('#sti-video-course-pause-overlay')).toBeHidden();
  const apres = await page.evaluate(() => ({ videos: window.STIProfil.chargerProfil().videos, historique: localStorage.getItem('sti-media-prog-v1') }));
  expect(apres).toEqual(avant);
});

test('agrandissement avec commandes natives puis retour au lecteur de stories', async ({ page }) => {
  await accueil(page); await page.locator('.story-card').first().click(); await lecture(page);
  await page.getByRole('button', {name:'Agrandir la vidéo'}).click();
  await expect.poll(() => page.evaluate(() => document.fullscreenElement?.tagName)).toBe('VIDEO');
  expect(await page.locator('.story-viewer video').evaluate(v => v.controls)).toBe(true);
  await page.keyboard.press('Escape');
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(false);
  await expect(page.locator('.story-viewer')).toBeVisible();
  expect(await page.locator('.story-viewer video').evaluate(v => v.controls)).toBe(false);
  await page.keyboard.press('Escape'); await expect(page.locator('.story-viewer')).toBeHidden();
});

test('contrôles d’accessibilité automatisés sur la rangée et le dialogue', async ({ page }) => {
  await page.setViewportSize({width:390,height:844}); await accueil(page);
  await page.addScriptTag({content:axe.source});
  const ranger = await page.evaluate(async () => (await axe.run('#stories')).violations.map(v => ({id:v.id, n:v.nodes.length})));
  expect(ranger).toEqual([]);
  await page.locator('.story-card').first().click(); await lecture(page);
  const modale = await page.evaluate(async () => (await axe.run('.story-viewer')).violations.map(v => ({id:v.id, n:v.nodes.length})));
  expect(modale).toEqual([]);
});

test('lecture bloquée par le navigateur : un bouton permet de démarrer', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLMediaElement.prototype.play;
    window.__refuserStory = true;
    HTMLMediaElement.prototype.play = function () {
      if (this.classList.contains('story-viewer__video') && window.__refuserStory) return Promise.reject(new DOMException('Lecture bloquée', 'NotAllowedError'));
      return original.apply(this, arguments);
    };
  });
  await accueil(page); await page.locator('.story-card').first().click();
  await expect(page.locator('.story-viewer__status')).toContainText('Appuyez sur lecture');
  await expect(page.getByRole('button', {name:'Lire l’extrait'})).toBeVisible();
  await page.evaluate(() => { window.__refuserStory = false; });
  await page.getByRole('button', {name:'Lire l’extrait'}).click(); await lecture(page);
});

test('chaque extrait correspond à son passage précis dans la vidéo CSS3 originale', async ({ page }) => {
  await accueil(page);
  await page.evaluate(async () => {
    const source = document.createElement('video');
    source.preload = 'auto'; source.muted = true;
    source.src = 'assets/videos/css3-cours-v9-sync-mobile-720p.mp4';
    window.__videoSourceTest = source;
    if (source.readyState < 1) await new Promise((resolve, reject) => {
      source.addEventListener('loadedmetadata', resolve, {once:true});
      source.addEventListener('error', reject, {once:true});
    });
  });
  for (const [id, depart] of [['intro',24.2],['selecteurs',77.8],['display',294.9],['flexbox',431.2],['transitions',618.3]]) {
    await page.locator(`.story-card[data-story="${id}"]`).click(); await lecture(page);
    const ecart = await page.locator('.story-viewer video').evaluate(async (clip, t) => {
      const source = window.__videoSourceTest; clip.pause();
      async function chercher(video, temps) {
        await new Promise(resolve => { video.addEventListener('seeked', resolve, {once:true}); video.currentTime = temps; });
      }
      await Promise.all([chercher(source,t+1), chercher(clip,1)]);
      const canvas = document.createElement('canvas'); canvas.width = 160; canvas.height = 90;
      const ctx = canvas.getContext('2d', {willReadFrequently:true});
      ctx.drawImage(source,0,0,160,90); const original = ctx.getImageData(0,0,160,90).data;
      ctx.drawImage(clip,0,0,160,90); const extrait = ctx.getImageData(0,0,160,90).data;
      let diff = 0; for (let i=0; i<original.length; i+=4) {
        diff += Math.abs(original[i]-extrait[i])+Math.abs(original[i+1]-extrait[i+1])+Math.abs(original[i+2]-extrait[i+2]);
      }
      return diff / (160*90*3);
    }, depart);
    expect(ecart, id + ' correspond au passage source').toBeLessThan(4);
    await page.keyboard.press('Escape');
  }
  await page.evaluate(() => { window.__videoSourceTest.removeAttribute('src'); window.__videoSourceTest.load(); });
});
