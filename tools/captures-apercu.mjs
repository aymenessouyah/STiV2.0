/** Captures d'écran de l'aperçu STI V2.0 (outil de démonstration, non livré au site).
 *
 * Pré-requis (sandbox Arena / Linux sans navigateur système) :
 *   npm install --no-save puppeteer-core @sparticuz/chromium
 *   python3 tools/serveur-apercu.py 8000      # dans un autre terminal
 *   installer les polices emoji/arabe (voir /apercu/LISEZ-MOI.md)
 *   LD_LIBRARY_PATH=/tmp/al2023/lib FONTCONFIG_PATH=/tmp/fonts node tools/captures-apercu.mjs
 *
 * Sur une machine disposant déjà de Chromium, remplacer executablePath par le
 * chemin local et lancer simplement : node tools/captures-apercu.mjs
 * Les images sont écrites dans /apercu ; la planche se génère ensuite avec
 * python3 tools/composer-apercu.py
 */
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const OUT = 'apercu';
mkdirSync(OUT, { recursive: true });
const BASE = 'http://127.0.0.1:8000';
const executablePath = await chromium.executablePath();

const browser = await puppeteer.launch({
  args: [...chromium.args, '--no-sandbox', '--disable-dev-shm-usage'],
  executablePath,
  headless: true,
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 }
});

const attendre = ms => new Promise(r => setTimeout(r, ms));

async function nouvellePage(largeur = 1440, hauteur = 900, mobile = false) {
  const page = await browser.newPage();
  await page.setViewport({ width: largeur, height: hauteur, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  const erreurs = [];
  page.on('pageerror', e => erreurs.push(e.message));
  return { page, erreurs };
}

async function charger(page, chemin) {
  await page.goto(BASE + chemin, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await attendre(2200);
  // Force l'affichage de tous les éléments à révélation progressive pour la capture.
  await page.addStyleTag({ content: '.reveal{opacity:1!important;transform:none!important;animation:none!important;transition:none!important}#sti-sync-pastille,#stiToast{display:none!important}' });
  await attendre(400);
}

async function appliquerTheme(page, t) {
  await page.evaluate(theme => {
    if (window.STIProfil) {
      window.STIProfil.mettreAJour('theme', theme);
      window.STIProfil.appliquerPreferences();
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, t);
  await attendre(250);
}

const resume = [];

/* 1. Accueil — hero sombre */
{
  const { page, erreurs } = await nouvellePage();
  await charger(page, '/');
  await appliquerTheme(page, 'sombre');
  await page.screenshot({ path: `${OUT}/01-accueil-sombre.png` });
  resume.push(['01-accueil-sombre', await page.title(), erreurs]);
  await page.close();
}

/* 2. Accueil — vidéos */
{
  const { page, erreurs } = await nouvellePage();
  await charger(page, '/');
  await appliquerTheme(page, 'sombre');
  await page.evaluate(() => { const e = document.querySelector('#videos'); window.scrollTo(0, e.offsetTop - 80); });
  await attendre(900);
  await page.screenshot({ path: `${OUT}/02-videos.png` });
  resume.push(['02-videos', await page.evaluate(() => document.querySelectorAll('#videosSlot .video-card').length + ' cartes vidéo'), erreurs]);
  await page.close();
}

/* 3. Accueil — mode clair (clic réel sur le sélecteur de thème) */
{
  const { page, erreurs } = await nouvellePage();
  await charger(page, '/');
  await page.click('[data-theme-choice="clair"]');
  await attendre(700);
  await page.screenshot({ path: `${OUT}/03-accueil-clair.png` });
  resume.push(['03-accueil-clair', await page.evaluate(() => document.documentElement.getAttribute('data-theme')), erreurs]);
  await page.close();
}

/* 4. Tableau de bord (avec quelques données de démonstration locales) */
{
  const { page, erreurs } = await nouvellePage();
  await charger(page, '/');
  await page.evaluate(() => {
    if (window.STIProfil && window.STIProfil.sauvegarderProfil) {
      const p = window.STIProfil.chargerProfil();
      p.prenom = 'Aymen';
      p.quiz = [{ matiere: 'sql', score: 8, total: 10, date: '2026-10-20' }];
      p.videosVues = ['v-html-1', 'v-css-1'];
      p.notes = [{ atelier: 'Atelier Bac — Sujet 2', note: 17, date: '2026-10-18' }];
      window.STIProfil.sauvegarderProfil(p);
    }
  });
  await charger(page, '/dashboard.html');
  await appliquerTheme(page, 'sombre');
  await page.screenshot({ path: `${OUT}/04-tableau-de-bord.png` });
  resume.push(['04-tableau-de-bord', await page.evaluate(() => document.querySelectorAll('#dashboardRoot .dash-card').length + ' cartes'), erreurs]);
  await page.close();
}

/* 5. Cours HTML5 — coquille à 4 onglets par-dessus le cours historique */
{
  const { page, erreurs } = await nouvellePage();
  await charger(page, '/cours/html5.html');
  await appliquerTheme(page, 'sombre');
  await page.screenshot({ path: `${OUT}/05-cours-html5.png` });
  resume.push(['05-cours-html5', await page.evaluate(() => document.querySelectorAll('[data-sti-tab],.sti-tab,.tab').length + ' onglets'), erreurs]);
  await page.close();
}

/* 6. Glossaire trilingue */
{
  const { page, erreurs } = await nouvellePage();
  await charger(page, '/glossaire.html');
  await appliquerTheme(page, 'intermediaire');
  await page.screenshot({ path: `${OUT}/06-glossaire.png` });
  resume.push(['06-glossaire', await page.evaluate(() => document.querySelectorAll('.term-card,.glossaire-item,[data-terme]').length + ' termes'), erreurs]);
  await page.close();
}

/* 7. Mobile — accueil */
{
  const { page, erreurs } = await nouvellePage(390, 844, true);
  await charger(page, '/');
  await appliquerTheme(page, 'sombre');
  await page.screenshot({ path: `${OUT}/07-mobile.png` });
  resume.push(['07-mobile', await page.evaluate(() => document.documentElement.clientWidth + 'px'), erreurs]);
  await page.close();
}

console.log(JSON.stringify(resume, null, 2));
await browser.close();
