import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const lire = (p) => readFileSync(resolve(root, p), 'utf8');

const html = lire('index.html');
const css = lire('assets/css/theme.css');
const js = lire('assets/js/app.js');

const IDS_OUTILS = [
  'btnHomeFlashcards',
  'btnHomeSandbox',
  'btnHomeConsoleJs',
  'btnHomeDebug',
  'btnHomeExamenBlanc',
  'btnHomeConstructeur',
  'btnHomeLaboSql',
  'btnHomeLaboAscii',
  'btnHomeSimPhpSql',
  'btnHomeCoffreTp'
];

test('v516 : chaque pastille des dix outils isole son logo', () => {
  const section = html.split('id="ateliers-rapides"')[1].split('</section>')[0];
  const logos = section.match(/class="lab-chip__ico"/g) || [];
  assert.equal(logos.length, 10, 'les dix logos sont dans une balise dédiée');
  for (const id of IDS_OUTILS) {
    assert.match(
      section,
      new RegExp(`id="${id}"><span class="lab-chip__ico" aria-hidden="true">[^<]+</span>`),
      id + ' porte son logo'
    );
  }
  /* Le logo est décoratif : le texte du bouton reste lisible par un lecteur d'écran. */
  assert.doesNotMatch(section, /class="lab-chip__ico"[^>]*>[^<]*<\/span>\s*<\/button>/);
});

test('v518 : sept animations franches et un halo de la couleur de la classe', () => {
  for (let i = 1; i <= 7; i += 1) {
    assert.match(css, new RegExp(`\\.lab-chip__ico\\.sti-outil-anim-${i} \\{ animation: sti-outil-`), `classe ${i}`);
  }
  for (const nom of ['salut', 'rebond', 'pulse', 'tangage', 'eclat', 'culbute', 'scintille']) {
    assert.match(css, new RegExp(`@keyframes sti-outil-${nom} \\{`), nom);
  }
  /* Amplitudes nettement plus marquées que la première version. */
  assert.match(css, /@keyframes sti-outil-salut \{\s*0%, 100% \{ transform: rotate\(0deg\); \}\s*18% \{ transform: rotate\(-20deg\) scale\(1\.14\); \}/);
  assert.match(css, /rotateY\(360deg\)/, 'tour complet sur lui-même');
  assert.match(css, /drop-shadow\(0 0 11px var\(--outil-halo\)\)/, 'scintillement coloré');

  /* Le halo est posé sur la pastille, pas sur l'emoji : il se voit de loin. */
  assert.match(css, /\.lab-chip\.sti-outil-halo \{ animation: sti-outil-halo /);
  assert.match(css, /@keyframes sti-outil-halo \{\s*0% \{ box-shadow: 0 0 0 0 var\(--outil-halo\)/);
  assert.match(css, /\.section--ateliers \{ --outil-halo: #38bdf8; \}/, 'bleu 3e SI');
  assert.match(css, /html\.sti-4si-autorise \.section--ateliers \{ --outil-halo: #34d399; \}/, 'vert 4e SI');

  assert.match(css, /\.lab-chip__ico \{[^}]*display: inline-block;/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{\s*\.lab-chip__ico \{ animation: none !important; filter: none !important; \}/);
  assert.match(css, /\.lab-chip\.sti-outil-halo \{ animation: none !important; box-shadow: none !important; \}/);
});

test('v518 : app.js déclenche un salut, des vagues et des halos, sans jamais bloquer', () => {
  assert.match(js, /function iconesOutilsVisibles\(\)/);
  assert.match(js, /function animerIconeOutil\(ico, classe, delai\)/);
  assert.match(js, /function animerVagueOutils\(\)/);
  assert.match(js, /function saluerLesOutils\(\)/);
  assert.match(js, /document\.querySelectorAll\("#ateliers-rapides \.lab-chip__ico"\)/);
  /* Sept animations, tirage au sort de l'animation comme du logo. */
  assert.match(js, new RegExp('CLASSES_OUTIL_ANIM = \\[[\\s\\S]*?"sti-outil-anim-7"[\\s\\S]*?\\];'));
  assert.match(js, /Math\.floor\(Math\.random\(\) \* CLASSES_OUTIL_ANIM\.length\)/);
  assert.match(js, /Math\.floor\(Math\.random\(\) \* cibles\.length\)/);
  /* Vague de 2 à 3 logos voisins, en cascade de 150 ms. */
  assert.match(js, /2 \+ Math\.floor\(Math\.random\(\) \* 2\)/);
  assert.match(js, /i \* 150/);
  /* Salut d'arrivée déclenché par l'entrée de la section à l'écran. */
  assert.match(js, /new global\.IntersectionObserver\(/);
  assert.match(js, /threshold: 0\.35/);
  assert.match(js, /global\.setTimeout\(demarrerSalut, 6000\)/, 'filet de sécurité');
  /* Anti-agitation : respiration de 6 s tous les dix passages. */
  assert.match(js, /passages % 10 === 0 \? 6000 : 0/);
  /* Un survol relance un clin d’œil, au plus une fois toutes les 2,5 s. */
  assert.match(js, /section\.addEventListener\("pointerenter"/);
  assert.match(js, /maintenant - dernierReveilOutils < 2500/);
  /* Rien ne bouge si le système demande moins de mouvement ou pendant un changement d'onglet. */
  assert.match(js, /\(prefers-reduced-motion: reduce\)/);
  assert.match(js, /if \(document\.hidden\) \{ planifier\(\); return; \}/);
  assert.match(js, /initialiserAnimationsOutils\(\);/, 'branchement dans demarrerApplication');
});

/* ---------- mini-DOM pour exécuter réellement le moteur d'animation ---------- */
function moteurOutils(options = {}) {
  const source = js.slice(js.indexOf('var CLASSES_OUTIL_ANIM'), js.indexOf('function rafraichirUIRevisionAccueil'));
  const log = { animations: [], halos: 0, timers: 0 };
  class El {
    constructor(nom) {
      this.nom = nom;
      this.classes = new Set();
      this.offsetWidth = 1;
      this.hidden = false;
      this.style = {};
      const s = this.classes;
      this.classList = {
        add: (c) => {
          s.add(c);
          if (c.startsWith('sti-outil-anim')) log.animations.push(c);
          if (c === 'sti-outil-halo') log.halos += 1;
        },
        remove: (...cs) => cs.forEach((c) => s.delete(c)),
        contains: (c) => s.has(c)
      };
    }
    closest(sel) { return sel === '.lab-chip' ? this.pastille : null; }
    addEventListener(type, fn) { this.ecouteurs = this.ecouteurs || {}; this.ecouteurs[type] = fn; }
    getBoundingClientRect() { return { top: 0 }; }
  }
  const section = new El('section');
  section.style.display = 'block';
  const icones = [];
  for (let i = 0; i < 10; i += 1) {
    const pastille = new El('pastille' + i);
    pastille.style.display = i === (options.masque ?? -1) ? 'none' : 'inline-flex';
    const ico = new El('ico' + i);
    ico.pastille = pastille;
    icones.push(ico);
  }
  const minuteurs = [];
  let observateur = null;
  const doc = {
    hidden: false,
    getElementById: (id) => (id === 'ateliers-rapides' ? section : null),
    querySelectorAll: (sel) => (sel.includes('lab-chip__ico') ? icones : [])
  };
  const g = {
    document: doc,
    getComputedStyle: (el) => ({ display: el.style.display || 'inline' }),
    matchMedia: () => ({ matches: !!options.reduce }),
    Date: { now: () => Date.now() },
    setTimeout: (fn, delai) => { log.timers += 1; minuteurs.push({ fn, delai }); return minuteurs.length; },
    IntersectionObserver: function (cb) {
      observateur = { cb, observe() {}, disconnect() {} };
      return observateur;
    }
  };
  const fabrique = new Function('document', 'global', source + '; return { initialiserAnimationsOutils, iconesOutilsVisibles };');
  const api = fabrique(doc, g);
  /* Exécute les minuteurs programmés, dans l'ordre, sans boucler à l'infini. */
  const drainer = (limite = 40) => {
    let n = 0;
    while (minuteurs.length && n < limite) { minuteurs.shift().fn(); n += 1; }
    return n;
  };
  return { api, icones, section, log, minuteurs, drainer, observateur: () => observateur };
}

test('v518 : le salut d’arrivée anime les dix logos et allume leurs halos', () => {
  const m = moteurOutils();
  m.api.initialiserAnimationsOutils();
  assert.equal(m.minuteurs.length, 1, 'filet de sécurité programmé');
  const obs = m.observateur();
  assert.ok(obs, 'la section est observée');
  obs.cb([{ isIntersecting: true }]);
  m.drainer(30);
  assert.ok(m.log.animations.length >= 8, 'au moins huit logos saluent : ' + m.log.animations.length);
  assert.ok(m.log.animations.every((c) => /^sti-outil-anim-[1-7]$/.test(c)), 'classes connues');
  assert.ok(m.log.halos >= 8, 'chaque logo salue avec le halo de sa pastille : ' + m.log.halos);
});

test('v518 : pastille masquée jamais animée, et rien du tout en mouvement réduit', () => {
  const m = moteurOutils({ masque: 3 });
  assert.equal(m.api.iconesOutilsVisibles().length, 9);
  assert.ok(!m.api.iconesOutilsVisibles().includes(m.icones[3]));

  const calme = moteurOutils({ reduce: true });
  calme.api.initialiserAnimationsOutils();
  assert.equal(calme.minuteurs.length, 0, 'aucun minuteur en mouvement réduit');
  assert.equal(calme.observateur(), null, 'aucune observation');
});
