/** Captures d'écran des 5 arènes de quiz (outil de démonstration).
 *
 * Pré-requis : python3 tools/serveur-apercu.py 8000 (autre terminal), puis
 *   LD_LIBRARY_PATH=/tmp/al2023/lib FONTCONFIG_PATH=/tmp/fonts node tools/captures-quiz.mjs
 *   python3 tools/composer-quiz.py
 *
 * Les captures sont écrites dans /apercu/quiz. Aucune ressource externe.
 */
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const OUT = 'apercu/quiz';
const BASE = 'http://127.0.0.1:8000';
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  args: [...chromium.args, '--no-sandbox', '--disable-dev-shm-usage'],
  executablePath: await chromium.executablePath(), headless: true,
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 }
});
const attendre = ms => new Promise(r => setTimeout(r, ms));
const STYLE = '.reveal{opacity:1!important;transform:none!important}' +
  '#sti-sync-pastille,#stiToast,#qzToast{display:none!important}' +
  '.qz-confettis{display:none!important}';

async function ouvrir(id, hash = '') {
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => { try { localStorage.clear(); } catch (e) {} });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.goto(`${BASE}/quiz/${id}.html${hash}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await attendre(2000);
  await page.addStyleTag({ content: STYLE });
  return page;
}
async function partieRapide(page) {
  await page.evaluate(() => {
    const c = document.getElementById('qzCount');
    if (c) { c.value = 5; c.dispatchEvent(new Event('input')); }
  });
  await page.click('#qzCommencer');
  await attendre(350);
  for (let i = 0; i < 2; i++) {
    await page.evaluate(() => {
      const b = document.querySelector('#qzOptions .qz-choix-btn:not(:disabled)');
      if (b) b.click();
    });
    await attendre(650);
  }
  await page.evaluate(() => { const b = document.getElementById('qzTerminer'); if (b) b.click(); });
  await attendre(500);
}

/* 1. Quizzora : départ, jeu, bilan */
{
  const p = await ouvrir('html-css');
  await p.screenshot({ path: `${OUT}/html-css-depart.png` });
  await p.click('#qzCommencer'); await attendre(350);
  await p.screenshot({ path: `${OUT}/html-css-jeu.png` });
  await p.evaluate(() => { const b = document.getElementById('qzTerminer'); if (b) b.click(); });
  await attendre(500);
  await p.screenshot({ path: `${OUT}/html-css-bilan.png` });
  await p.close(); console.log('captures Quizzora');
}
/* 2. Arène JavaScript en jeu */
{
  const p = await ouvrir('javascript');
  await p.click('#qzCommencer'); await attendre(350);
  await p.screenshot({ path: `${OUT}/javascript-jeu.png` });
  await p.close(); console.log('capture JavaScript');
}
/* 3. SQL Quest : départ (badges, classement) et jeu (duel, jokers, terrain) */
{
  const p = await ouvrir('sql');
  await p.screenshot({ path: `${OUT}/sql-depart.png` });
  await p.evaluate(() => { const b = document.querySelector('[data-mode="duel"]'); if (b) b.click(); });
  await p.click('#qzCommencer'); await attendre(350);
  await p.evaluate(() => { const b = document.querySelector('[data-joker="fifty"]'); if (b) b.click(); });
  await attendre(200);
  await p.screenshot({ path: `${OUT}/sql-jeu.png` });
  await p.close(); console.log('captures SQL');
}
/* 4. QuizPHP : jeu et certificat */
{
  const p = await ouvrir('php');
  await p.click('#qzCommencer'); await attendre(350);
  await p.screenshot({ path: `${OUT}/php-jeu.png` });
  await p.evaluate(() => { const b = document.getElementById('qzTerminer'); if (b) b.click(); });
  await attendre(500);
  await p.screenshot({ path: `${OUT}/php-bilan.png` });
  await p.close(); console.log('captures PHP');
}
/* 5. Quiz des tableaux : écran verrouillé (mode clair) */
{
  const p = await browser.newPage();
  await p.evaluateOnNewDocument(() => {
    try { localStorage.setItem('sti-profil-abonne', JSON.stringify({ theme: 'clair' })); } catch (e) {}
  });
  await p.goto(`${BASE}/quiz/tableaux.html`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await attendre(2000);
  await p.addStyleTag({ content: STYLE });
  await p.screenshot({ path: `${OUT}/tableaux-verrou.png` });
  await p.close(); console.log('capture tableaux');
}
/* 6. Mobile 390 × 844 */
{
  const p = await browser.newPage();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await p.evaluateOnNewDocument(() => { try { localStorage.clear(); } catch (e) {} });
  await p.goto(`${BASE}/quiz/sql.html`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await attendreSafe(2000);
  await p.addStyleTag({ content: STYLE });
  await p.screenshot({ path: `${OUT}/quiz-mobile.png` });
  await p.close(); console.log('capture mobile');
}
function attendreSafe(ms) { return attendre(ms); }

await browser.close();
