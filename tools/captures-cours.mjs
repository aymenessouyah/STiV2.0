/** Captures d'écran des 5 pages matière (outil de démonstration, non livré au site).
 *
 * Pré-requis (sandbox Arena / Linux sans navigateur système) :
 *   npm install --no-save puppeteer-core @sparticuz/chromium
 *   python3 tools/serveur-apercu.py 8000      # dans un autre terminal
 *   LD_LIBRARY_PATH=/tmp/al2023/lib FONTCONFIG_PATH=/tmp/fonts node tools/captures-cours.mjs
 *   python3 tools/composer-cours.py            # planche récapitulative
 *
 * Les captures sont écrites dans /apercu/cours. Aucune ressource externe.
 */
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const OUT = 'apercu/cours';
const BASE = 'http://127.0.0.1:8000';
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  args: [...chromium.args, '--no-sandbox', '--disable-dev-shm-usage'],
  executablePath: await chromium.executablePath(),
  headless: true,
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 }
});
const attendre = ms => new Promise(r => setTimeout(r, ms));

/* Style commun de capture : animations neutralisées, pastille de synchro masquée. */
const STYLE = '.reveal{opacity:1!important;transform:none!important}' +
  '#sti-sync-pastille,#stiToast{display:none!important}';

const VUES = [
  ['html5', 'cours', '#cours'],
  ['html5', 'exercices', '#exercices'],
  ['html5', 'fenetre', '#cours'],
  ['css3', 'cours', '#cours'],
  ['css3', 'videos', '#videos'],
  ['javascript', 'cours', '#cours'],
  ['sql', 'cours', '#cours'],
  ['php', 'videos', '#videos']
];

for (const [matiere, onglet, hash] of VUES) {
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => { try { localStorage.clear(); } catch (e) {} });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.goto(`${BASE}/cours/${matiere}.html${hash}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await attendre(2400);
  await page.addStyleTag({ content: STYLE });
  if (onglet === 'fenetre' && matiere === 'html5') {
    await page.evaluate(() => window.openModal('tpl-target'));
    await attendre(350);
  }
  await attendre(250);
  await page.screenshot({ path: `${OUT}/${matiere}-${onglet}.png` });
  console.log('capture', matiere, onglet);
  await page.close();
}

/* Mode intermédiaire + RTL arabe. */
{
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => {
    try { localStorage.setItem('sti-profil-abonne', JSON.stringify({ theme: 'intermediaire', langue: 'ar' })); } catch (e) {}
  });
  await page.goto(`${BASE}/cours/html5.html#cours`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await attendre(2400);
  await page.addStyleTag({ content: STYLE });
  await page.screenshot({ path: `${OUT}/html5-intermediaire-rtl.png` });
  await page.close();
}

/* Mobile 390 × 844. */
{
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.evaluateOnNewDocument(() => { try { localStorage.clear(); } catch (e) {} });
  await page.goto(`${BASE}/cours/html5.html#cours`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await attendre(2400);
  await page.addStyleTag({ content: STYLE });
  await page.screenshot({ path: `${OUT}/html5-mobile.png` });
  await page.close();
}

await browser.close();
