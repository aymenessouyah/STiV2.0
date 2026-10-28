/*
 * Capture les différents états de la page animée « id · class · name : le graphe »
 * pour la vidéo pédagogique STI V2.0.
 *
 * Usage (depuis la racine du dépôt) :
 *   LD_LIBRARY_PATH=/tmp/al2023/lib/lib FONTCONFIG_PATH=/tmp/fonts \
 *     node tools/capturer-graphe-video.mjs
 *
 * La page source est un fichier autonome (aucune ressource externe). On force le
 * thème clair et « prefers-reduced-motion » pour figer les animations (anneaux,
 * particules, clignotements) afin d'obtenir des images nettes et reproductibles.
 * Chaque état est capturé deux fois : le SVG du graphe (#g) et le panneau
 * d'explication (#panel). Les images sont écrites dans .video-work/etats/.
 */
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const SRC = 'file:///tmp/arena-coding-uploads/id%20%C2%B7%20class%20%C2%B7%20name%20_%20le%20graphe.html';
const OUT = path.resolve('.video-work/etats');
fs.mkdirSync(OUT, { recursive: true });

// Clé de nœud (fonction pick de la page) pour chaque état du scénario.
const ETATS = {
  accueil: null,
  id: 'id', class: 'class', name: 'name', css: 'css',
  'id-js': 'l0', 'id-css': 'l1', 'id-html': 'l2', 'id-trap': 'l3',
  'class-js': 'l4', 'class-css': 'l5', 'class-multi': 'l6', 'class-trap': 'l7',
  'name-js': 'l8', 'name-css': 'l9', 'name-php': 'l10', 'name-trap': 'l11',
  'css-prio': 'l12', 'css-pc': 'l13', 'css-pe': 'l14',
  'css-tree': 'l16', 'css-pb': 'l18',
  tour: 'id',      // première étape de la visite guidée
  panel: 'class'   // panneau agrandi sur la fiche « plusieurs classes »
};

const executablePath = await chromium.executablePath();
const browser = await puppeteer.launch({
  args: [...chromium.args, '--no-sandbox', '--disable-dev-shm-usage'],
  executablePath,
  headless: true,
  defaultViewport: { width: 760, height: 1350, deviceScaleFactor: 2 }
});

const page = await browser.newPage();
await page.emulateMediaFeatures([
  { name: 'prefers-reduced-motion', value: 'reduce' },
  { name: 'prefers-color-scheme', value: 'light' }
]);
await page.goto(SRC, { waitUntil: 'domcontentloaded', timeout: 60000 });

// Figer le rendu : thème clair, aucune animation, pièges lisibles (fond blanc
// au lieu du noir produit par l'animation blink), anneaux décoratifs masqués.
await page.addStyleTag({ content: `
  :root { --bg:#f7f8fc; --fg:#1b2033; --card:#ffffff; --muted:#5b637a;
          --border:#d9dcea; --id:#6d4aff; --cls:#0e9f8e; --nm:#d98200;
          --trap:#d63a3a; --css:#2f7de1; }
  *, *::before, *::after { animation:none !important; transition:none !important; }
  .ring { display:none !important; }
  .warn { display:block !important; opacity:1 !important; }
  .leaf.trap rect { fill:#ffffff !important; stroke:#d63a3a !important; }
  .leaf.trap .tg, .leaf.trap .tx { fill:#1b2033 !important; }
  .node, .edge { opacity:1 !important; }
  body { background:#f7f8fc !important; }
` });
await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
await new Promise(r => setTimeout(r, 400));

const resultats = {};
for (const [etat, cle] of Object.entries(ETATS)) {
  await page.evaluate((k) => {
    // pick() est un bascule : on repart toujours de l'état d'accueil.
    window.cur = null;
    window.pick(k);
    // Neutralise le défilement automatique déclenché par reveal().
    window.scrollTo(0, 0);
  }, cle);
  await new Promise(r => setTimeout(r, 120));

  const svg = await page.$('#g');
  const graphePath = path.join(OUT, `graphe-${etat}.png`);
  await svg.screenshot({ path: graphePath, omitBackground: false });

  // Panneau d'explication : on agrandit pour les états « panel » / « tour ».
  const grand = (etat === 'panel' || etat === 'tour');
  await page.evaluate((big) => {
    const p = document.getElementById('panel');
    p.classList.toggle('big', big);
    const xp = document.getElementById('xp');
    if (xp) xp.textContent = big ? '⤡ Réduire' : '⤢ Agrandir';
  }, grand);
  await new Promise(r => setTimeout(r, 120));
  const panel = await page.$('#panel');
  const panelPath = path.join(OUT, `panel-${etat}.png`);
  await panel.screenshot({ path: panelPath, omitBackground: false });

  resultats[etat] = { cle, graphe: `graphe-${etat}.png`, panel: `panel-${etat}.png` };
  console.log(`✓ ${etat.padEnd(12)} → ${cle ?? 'accueil'}`);
}

// Capture « planche » complète de la page (pour le générique / vues d'ensemble).
await page.evaluate(() => {
  window.cur = null; window.pick(null); window.scrollTo(0, 0);
  document.getElementById('panel').classList.remove('big');
});
await new Promise(r => setTimeout(r, 150));
await page.screenshot({ path: path.join(OUT, 'page-complete.png'), fullPage: false });

fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(resultats, null, 2));
await browser.close();
console.log(`\n${Object.keys(resultats).length} états capturés dans ${OUT}`);
