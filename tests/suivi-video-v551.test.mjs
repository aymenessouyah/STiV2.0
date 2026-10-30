/* v551 — le défilement suit la vidéo, pour chaque vidéo.
   Deux mécanismes sont contrôlés ici, sur le code réellement livré :
   1. une vidéo sans repères reçoit un découpage calculé sur sa durée réelle,
      pour que le bandeau du lecteur avance avec la lecture comme les autres ;
   2. sur une page de cours, la page défile vers la section expliquée pendant la
      lecture, sans jamais gêner un élève qui fait défiler lui-même. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (chemin) => readFileSync(join(root, chemin), 'utf8');
const protection = lire('assets/js/protection.js');

const DEBUT = '/* ── v551 · le défilement suit la vidéo, pour chaque vidéo ──';
const FIN = '/* ── Suivi de progression des vidéos (.mp4) et cours vocaux';
const BLOC = protection.slice(protection.indexOf(DEBUT), protection.indexOf(FIN));

const catalogue = () => {
  const t = lire('assets/js/app.js').split('var CATALOGUE_VIDEOS = ')[1].split('\n  ];')[0] + '\n  ]';
  return vm.runInNewContext('(' + t + ')');
};

/** Les clés déjà décrites à la main dans protection.js. */
function clesManuelles() {
  const zone = protection.slice(
    protection.indexOf('var STI_CHAPITRES_MEDIA = {'),
    protection.indexOf('window.STI_CHAPITRES_MEDIA = STI_CHAPITRES_MEDIA;'));
  const cles = new Set();
  for (const m of zone.matchAll(/(?:"([a-z0-9-]+)":\s*\[|STI_CHAPITRES_MEDIA\["([a-z0-9-]+)"\])/g)) cles.add(m[1] || m[2]);
  return cles;
}

/** Exécute le bloc v551 dans un faux navigateur, pour l'éprouver vraiment. */
function charger(options = {}) {
  const appels = { defilements: [], ecouteurs: {} };
  const reduit = !!options.reduit;
  const map = options.map || {};
  const fenetre = {
    addEventListener(type, fn) { (appels.ecouteurs[type] = appels.ecouteurs[type] || []).push(fn); },
    matchMedia: () => ({ matches: reduit })
  };
  const document = {
    fullscreenElement: options.pleinEcran ? {} : null,
    visibilityState: options.cache ? 'hidden' : 'visible',
    querySelector(sel) {
      if (!options.cible || sel !== options.cible.sel) return null;
      return { ...options.cible, scrollIntoView: (o) => appels.defilements.push({ sel, ...(o || {}) }) };
    },
    querySelectorAll: () => []
  };
  const contexte = vm.createContext({ window: fenetre, document, STI_CHAPITRES_MEDIA: map });
  vm.runInContext(BLOC, contexte);
  return { ...contexte, appels };
}

const fauxVideo = (attributs, src) => ({
  getAttribute: (nom) => (nom in attributs ? attributs[nom] : null),
  currentSrc: src || ''
});

test('le bloc v551 est bien celui du fichier livré', () => {
  assert.ok(BLOC.length > 1500, 'le bloc est présent');
  /* v554 : la fonction est déclarée dans installerVideosPasAPasSTI(), donc invisible depuis
     init(); elle est désormais exposée par brancherSuiviVideoSTIExpose, seul point d'appel. */
  assert.ok(protection.includes('brancherSuiviVideoSTIExpose = brancherSuiviVideoSTI;'),
    'la fonction interne est exposée à la portée de l’IIFE');
  assert.ok(protection.includes('if (typeof brancherSuiviVideoSTIExpose === "function")'),
    'branché au chargement');
  assert.ok(protection.includes('poserChapitresAutoSTI(slugBandeau, mVid.duration || 0)'),
    'le lecteur complète les vidéos sans repères');
  assert.ok(protection.includes('remplirBandeauChapitresModale(chapsBandeau)'),
    'le bandeau est reconstruit pour cette vidéo');
});

test('une vidéo sans repères reçoit un découpage calé sur sa durée', () => {
  const c = charger();
  const chaps = c.chapitresAutoSTI(600);
  assert.equal(chaps.length, 7, 'une partie par tranche de 90 s');
  assert.equal(chaps[0].t, 0);
  assert.equal(chaps[0].label, '00:00 · Partie 1 sur 7');
  assert.equal(chaps[0].short, 'Partie 1');
  assert.ok(chaps[6].t < 600, 'le dernier repère reste dans la vidéo');
  assert.ok(chaps[6].label.startsWith('08:34'), 'le libellé donne le minutage');
  assert.deepEqual([...c.chapitresAutoSTI(20)], [], 'trop court : aucun repère inventé');
  assert.deepEqual([...c.chapitresAutoSTI(0)], [], 'durée inconnue : aucun repère');
  assert.equal(c.chapitresAutoSTI(4 * 3600).length, 12, 'douze repères au maximum');
  assert.deepEqual([...c.chapitresAutoSTI(Infinity)], [], 'flux sans fin : aucun repère');
  assert.deepEqual([...c.chapitresAutoSTI(NaN)], [], 'durée illisible : aucun repère');
});

test('les repères déjà écrits ne sont jamais remplacés', () => {
  const manuels = [{ t: 0, short: 'Intro', label: '00:00 · Intro' }];
  const c = charger({ map: { 'boucle-pour': manuels } });
  assert.equal(c.poserChapitresAutoSTI('boucle-pour', 1000), manuels);
  assert.equal(c.STI_CHAPITRES_MEDIA['boucle-pour'].length, 1);
  const crees = c.poserChapitresAutoSTI('inconnue', 300);
  assert.ok(crees.length >= 2);
  assert.equal(c.STI_CHAPITRES_MEDIA['inconnue'], crees, 'les repères sont mémorisés');
  assert.deepEqual([...c.poserChapitresAutoSTI('muette', 0)], [], 'pas de durée, pas de repères');
});

test('chaque vidéo du catalogue est reconnue, d’où qu’elle vienne', () => {
  const c = charger({ map: Object.fromEntries([...clesManuelles()].map((k) => [k, [{ t: 0 }]])) });
  const viaAttribut = fauxVideo({ 'data-video-id': 'boucle-pour' });
  assert.equal(c.slugVideoSTI(viaAttribut), 'boucle-pour', 'attribut explicite');
  const cas = [
    ['/assets/videos/PhpVariables-v549.mp4', 'php-variables'],
    ['/assets/videos/ConsoleVariables-fr-v548.mp4', 'console-variables'],
    ['/assets/videos/BouclePour-v547.mp4', 'boucle-pour'],
    ['/assets/videos/css3-cours-v9-sync.mp4', 'css3-cours'],
    ['/assets/videos/css3-cours-v9-sync.mp4?x=1', 'css3-cours'],
    ['/assets/videos/sql-cours-v7.mp4', 'sql-cours'],
    ['/assets/videos/tp-display-float-position.mp4', 'tp-display-float-position'],
    ['/assets/videos/html5-cours.mp4', 'html5-cours'],
    ['/assets/video/flower.webm', '']
  ];
  for (const [chemin, attendu] of cas) {
    assert.equal(c.slugVideoSTI(fauxVideo({}, 'https://sti.test' + chemin)), attendu, chemin);
  }
  /* toutes les cartes du catalogue : repères écrits à la main, ou découpage automatique */
  const manuelles = clesManuelles();
  const secours = new Set(['tp-evenements-liens', 'tp-formulaire-tableau-autre', 'tp-display-float-position', 'tp-transitions-animations']);
  for (const video of catalogue()) {
    assert.ok(manuelles.has(video.id) || secours.has(video.id), `${video.id} doit suivre la lecture`);
  }
  for (const id of secours) {
    assert.ok(!manuelles.has(id), `${id} passe par le découpage automatique`);
    assert.ok(c.slugVideoSTI(fauxVideo({ 'data-video-id': id })), `${id} est reconnue`);
  }
});

test('la page défile vers la section expliquée, sans jamais gêner', () => {
  const cible = { sel: '#point-3', top: 900, getBoundingClientRect: () => ({ top: 900 }) };
  const video = { closest: () => null, paused: false };
  const c = charger({ cible });
  c.suivreSectionVideoSTI(video, { t: 10, sel: '#point-3' });
  assert.equal(c.appels.defilements.length, 1, 'la section est atteinte');
  assert.equal(c.appels.defilements[0].behavior, 'smooth');
  assert.equal(c.appels.defilements[0].block, 'start');

  /* un élève qui a demandé moins d'animation : saut direct, pas de glissement */
  const calme = charger({ cible, reduit: true });
  calme.suivreSectionVideoSTI(video, { t: 10, sel: '#point-3' });
  assert.equal(calme.appels.defilements[0].behavior, 'auto');

  /* ni dans la fenêtre du lecteur, ni en plein écran, ni dans un onglet caché */
  const dansModale = charger({ cible });
  dansModale.suivreSectionVideoSTI({ closest: () => ({}), paused: false }, { t: 10, sel: '#point-3' });
  assert.equal(dansModale.appels.defilements.length, 0, 'jamais derrière la modale');
  const pleinEcran = charger({ cible, pleinEcran: true });
  pleinEcran.suivreSectionVideoSTI(video, { t: 10, sel: '#point-3' });
  assert.equal(pleinEcran.appels.defilements.length, 0, 'jamais en plein écran');
  const cache = charger({ cible, cache: true });
  cache.suivreSectionVideoSTI(video, { t: 10, sel: '#point-3' });
  assert.equal(cache.appels.defilements.length, 0, 'jamais onglet caché');

  /* et le défilement manuel de l'élève suspend le suivi */
  const manuel = charger({ cible });
  manuel.appels.ecouteurs.wheel.forEach((fn) => fn());
  manuel.suivreSectionVideoSTI(video, { t: 10, sel: '#point-3' });
  assert.equal(manuel.appels.defilements.length, 0, 'un élève qui fait défiler garde la main');
});

test('chaque cours a réellement les sections que sa vidéo désigne', () => {
  const pages = {
    'html5-cours': 'cours/html5.html',
    'css3-cours': 'cours/css3.html',
    'javascript-cours': 'cours/javascript.html',
    'sql-cours': 'cours/sql.html',
    'sql-initiation': 'cours/sql.html',
    'php-cours': 'cours/php.html'
  };
  const zone = protection.slice(
    protection.indexOf('var STI_CHAPITRES_MEDIA = {'),
    protection.indexOf('window.STI_CHAPITRES_MEDIA = STI_CHAPITRES_MEDIA;'));
  const re = /(?:"([a-z0-9-]+)":\s*\[|STI_CHAPITRES_MEDIA\["([a-z0-9-]+)"\]\s*=\s*\[)/g;
  const bornes = [];
  let m;
  while ((m = re.exec(zone))) bornes.push([m[1] || m[2], m.index]);
  for (const [slug, page] of Object.entries(pages)) {
    const i = bornes.findIndex(([cle]) => cle === slug);
    assert.ok(i >= 0, `chapitres de ${slug}`);
    const fin = i + 1 < bornes.length ? bornes[i + 1][1] : zone.length;
    const sels = [...zone.slice(bornes[i][1], fin).matchAll(/sel: "([^"]+)"/g)].map((x) => x[1]);
    assert.ok(sels.length > 0, `${slug} doit pointer des sections`);
    const html = lire(page);
    for (const sel of new Set(sels)) {
      const identifiant = sel.replace(/^#/, '');
      assert.ok(html.includes(`id="${identifiant}"`), `${page} doit contenir ${sel} (vidéo ${slug})`);
    }
  }
});

test('le suivi écoute la vidéo, pas le hasard', () => {
  assert.ok(protection.includes('video.addEventListener("timeupdate", avancer)'), 'le repère suit la lecture');
  assert.ok(protection.includes('if (idx === dernier) return;'), 'un seul défilement par chapitre');
  assert.ok(protection.includes('Math.abs(position.top) < 140'), 'pas de micro-défilement');
  assert.ok(protection.includes('if (video.paused || video.seeking || !video.__stiSlug) return;'),
    'ni en pause, ni pendant un déplacement dans la barre');
});

test('le lot v551 est publié', () => {
  const sw = lire('sw.js');
  assert.match(sw, /var CACHE = "sti-atelier-v386"/);
  assert.match(sw, /var UPDATE_ID = "v553-defilement-passif-20261030"/);
  assert.match(sw, /url: "\.\/assets\/js\/protection\.js", revision: "date-js-v565"/);
  assert.ok(!sw.split('var UPDATE_FILES = [')[1].split('];')[0].includes('BouclePour-v547.mp4'),
    'les capsules restent hors du delta automatique');
});
