/* v564 — capsule « Les chaînes de caractères » et étiquette verte « Capsule ».
   ─────────────────────────────────────────────────────────────────────────
   Deux demandes distinctes, un seul lot :

   1. **la capsule** — une vidéo de plus dans la série JavaScript, sur le même
      modèle que « Les boucles », « La console et les variables » et « PHP — les
      variables » : dix sections, une voix, deux colonnes, des exercices, des
      sous-titres, des chapitres, et l'entrée au catalogue ;
   2. **l'étiquette** — chaque nœud d'une capsule dans « Vidéos explicatives »
      porte une pastille verte « Capsule », en haut à gauche de la carte.

   Ce fichier vérifie les deux, y compris ce qui se voit : le catalogue, la
   grille, le lecteur, le hors-ligne et les sous-titres.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync, openSync, readSync, closeSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (chemin) => readFileSync(join(root, chemin), 'utf8');

const MP4 = 'assets/videos/FonctionsChaine-v564.mp4';
const VTT = 'assets/subtitles/FonctionsChaine-fr-v564.vtt';
const ID = 'fonctions-chaine';
const OUTILS_VRAI = join(root, 'outils', 'fonctionschaine');

/* La durée réelle, lue dans la boîte mvhd du MP4 — sans ffmpeg. */
function dureeMp4(relatif) {
  const chemin = join(root, relatif);
  const fd = openSync(chemin, 'r');
  const taille = statSync(chemin).size;
  const lireOctets = (debut, longueur) => {
    const tampon = Buffer.alloc(longueur);
    readSync(fd, tampon, 0, longueur, debut);
    return tampon;
  };
  const boites = (debut, fin) => {
    const sortie = [];
    let curseur = debut;
    while (curseur + 8 <= fin) {
      const entete = lireOctets(curseur, 8);
      let longueur = entete.readUInt32BE(0);
      const type = entete.toString('latin1', 4, 8);
      let corps = 8;
      if (longueur === 1) { longueur = Number(lireOctets(curseur + 8, 8).readBigUInt64BE(0)); corps = 16; }
      else if (longueur === 0) longueur = fin - curseur;
      if (longueur < corps) break;
      sortie.push({ type, debut: curseur + corps, fin: curseur + longueur });
      curseur += longueur;
    }
    return sortie;
  };
  try {
    for (const boite of boites(0, taille)) if (boite.type === 'moov') {
      for (const enfant of boites(boite.debut, boite.fin)) if (enfant.type === 'mvhd') {
        const h = lireOctets(enfant.debut, 36), v = h[0];
        const echelle = h.readUInt32BE(v === 1 ? 20 : 12);
        const duree = v === 1 ? Number(h.readBigUInt64BE(24)) : h.readUInt32BE(16);
        return duree / echelle;
      }
    }
    throw new Error('mvhd absent : ' + relatif);
  } finally { closeSync(fd); }
}

function catalogue() {
  const js = lire('assets/js/app.js');
  const texte = js.split('var CATALOGUE_VIDEOS = ')[1].split('\n  ];')[0] + '\n  ]';
  return vm.runInNewContext('(' + texte + ')');
}

/* ═════════════════════════════════════════════════════════════════════════
   1 · Le nœud-capsule de « Vidéos explicatives »
   ═════════════════════════════════════════════════════════════════════════ */
test('chaque nœud-capsule de la grille reçoit son étiquette « Capsule »', () => {
  const app = lire('assets/js/app.js');

  /* v571 : l'étiquette est une vraie étiquette dorée, en CSS pur. */
  assert.ok(app.includes('class="video-card__capsule sti-etiquette-capsule"'),
    'le modèle de carte doit poser l’étiquette');
  assert.ok(/\(estCapsuleVideo\(v\) \? '<span class="video-card__capsule/.test(app),
    'l’étiquette ne doit apparaître que sur les capsules');

  /* Elle est posée avant la vignette, donc sous le pouce, en haut à gauche. */
  const modele = app.slice(app.indexOf('var signature = liste.map'));
  assert.ok(modele.indexOf('video-card__capsule') < modele.indexOf('video-card__thumb'),
    'l’étiquette précède la vignette');
});

test('l’étiquette est une étiquette dorée, en haut à gauche, et ne cache pas « Vue »', () => {
  const css = lire('assets/css/capsules-vedettes.css');

  const bloc = css.slice(css.indexOf('.sti-etiquette-capsule {'),
    css.indexOf('.sti-etiquette-capsule {') + 1400);
  assert.ok(bloc.length > 200, 'le bloc de l’étiquette doit exister');
  assert.match(bloc, /position:\s*absolute/);
  assert.match(bloc, /inset-block-start:\s*8px/);
  assert.match(bloc, /inset-inline-start:\s*10px/, 'en haut à GAUCHE, même en RTL');
  assert.match(bloc, /text-transform:\s*uppercase/);
  assert.match(bloc, /z-index:\s*5/, 'au-dessus de la vignette et des effets de survol');
  assert.match(bloc, /pointer-events:\s*none/, 'l’étiquette ne vole pas le clic');

  /* Le dessin : deux tons dorés, coins coupés, cordon et œillet. */
  assert.match(css, /\.sti-etiquette-capsule::before \{[^}]*clip-path:\s*polygon\(/s,
    'le corps est découpé en étiquette');
  assert.match(css, /linear-gradient\(90deg, #fbce4f 0 50%, #eeb02a 50% 100%\)/,
    'les deux tons de la fiche');
  assert.match(css, /\.sti-etiquette-capsule::after \{[^}]*data:image\/svg\+xml/s,
    'le cordon et l’œillet');

  /* Contraste : brun sombre sur doré (≈ 7:1). */
  assert.match(bloc, /color:\s*#4a3208/);

  /* v572 : le relief — épaisseur, lumière en haut, ombre en bas, reflet. */
  assert.match(bloc, /drop-shadow\(0 1px 0/, 'une épaisseur de carton sous l’étiquette');
  assert.match(css, /\.sti-etiquette-capsule::before \{[^}]*inset 0 2px 0 rgba\(255, 255, 255, \.62\)/s,
    'arête éclairée en haut');
  assert.match(css, /\.sti-etiquette-capsule::before \{[^}]*inset 0 -3px 5px rgba\(120, 78, 0, \.40\)/s,
    'ombre sous le bord bas');
  assert.match(css, /\.sti-etiquette-capsule::before \{[^}]*animation: sti-etiquette-brille-V572/s,
    'le reflet qui passe');
  assert.match(css, /@keyframes sti-etiquette-brille-V572/, 'la glissade du reflet');
  /* Calme : le reflet ne repart qu'une fois par cycle de 7 s. */
  const clefs = css.slice(css.indexOf('@keyframes sti-etiquette-brille-V572'));
  assert.match(clefs, /0%, 58%/, 'une longue pause avant le reflet');
  assert.match(css, /animation: sti-etiquette-brille-V572 7s ease-in-out infinite/,
    'une glissade de sept secondes, sans à-coup');

  /* Le cordon est un SVG en ligne : la CSP des pages doit autoriser data:. */
  const index = lire('index.html');
  assert.match(index, /img-src 'self' data:/, 'data: autorisé pour le cordon');

  /* Le repère « ✓ Vue » occupait le même coin : il doit changer de côté. */
  const vus = css.slice(css.indexOf('.video-card--capsule .video-card__seen'));
  assert.match(vus, /inset-inline-end:\s*10px/, '« Vue » passe à droite');
});

test('les cartes des pages de cours portent la même étiquette', () => {
  for (const page of ['cours/javascript.html', 'cours/php.html']) {
    const html = lire(page);
    const cartes = (html.match(/sti-capsule-vedette/g) || []).length;
    const etiquettes = (html.match(/class="sti-etiquette-capsule"/g) || []).length;
    assert.ok(etiquettes > 0, page + ' : au moins une étiquette');
    assert.equal(etiquettes, cartes, page + ' : une étiquette par carte-capsule');
    /* L'étiquette ouvre la carte : elle suit immédiatement la balise ouvrante. */
    const ouvertes = html.match(
      /class="(?:featured|matiere)-video-card sti-capsule-vedette ?"[^>]*><span class="sti-etiquette-capsule"/g) || [];
    assert.equal(ouvertes.length, cartes, page + ' : l’étiquette ouvre chaque carte');
  }
});

test('les capsules historiques sont reconnues', () => {
  const app = lire('assets/js/app.js');
  const ligne = app.split('var CAPSULES_VIDEO = ')[1].split('};')[0] + '}';
  const capsules = vm.runInNewContext('(' + ligne + ')');
  for (const slug of ['boucle-pour', 'console-variables', 'fonctions-chaine', 'php-variables']) {
    assert.equal(capsules[slug], true, 'capsule reconnue : ' + slug);
  }
  for (const valeur of Object.values(capsules)) assert.equal(valeur, true);
});

/* ═════════════════════════════════════════════════════════════════════════
   2 · La capsule elle-même
   ═════════════════════════════════════════════════════════════════════════ */
test('la capsule est livrée : MP4, sous-titres français et durée réelle', () => {
  assert.ok(existsSync(join(root, MP4)), MP4);
  assert.ok(existsSync(join(root, VTT)), VTT);
  assert.ok(statSync(join(root, MP4)).size > 1_000_000, 'une vraie vidéo, pas un fichier vide');

  const seconde = Math.round(dureeMp4(MP4));
  const attendu = `${Math.floor(seconde / 60)}:${String(seconde % 60).padStart(2, '0')}`;
  const entree = catalogue().find((v) => v.id === ID);
  assert.ok(entree, 'entrée de catalogue');
  assert.equal(entree.dureeTexte, attendu, 'la durée du catalogue est la durée réelle');
  assert.equal(entree.srcPrincipal, MP4);
  assert.equal(entree.sousTitres, VTT);
  assert.equal(entree.matiere, 'javascript');
  assert.ok(seconde > 8 * 60 && seconde < 20 * 60, 'durée de capsule : ' + attendu);

  const vtt = lire(VTT);
  assert.ok(vtt.startsWith('WEBVTT'));
  const cues = vtt.split(/\n\n+/).filter((b) => b.includes('-->'));
  assert.ok(cues.length > 100, 'un sous-titre toutes les quelques secondes');
});

test('la fiche est suivie : les douze méthodes et les cinq conversions sont montrées', () => {
  const narration = lire('outils/fonctionschaine/narration.py');

  /* Partie A */
  for (const methode of ['length', 'indexOf', 'lastIndexOf', 'substring', 'replace',
    'toLowerCase', 'toUpperCase', 'trim', 'charCodeAt', 'fromCharCode']) {
    assert.ok(narration.includes(methode), 'méthode absente de la voix off : ' + methode);
  }
  /* Partie B */
  for (const conversion of ['isNaN', 'Number', 'parseFloat', 'parseInt', 'String']) {
    assert.ok(narration.includes(conversion), 'conversion absente : ' + conversion);
  }
  /* Partie C */
  assert.ok(narration.includes('new Date') && narration.includes('toString'));

  /* La chaîne d'exemple de la fiche, avec ses deux régularités. */
  assert.match(narration, /^CH = "Lycée Rafèha"$/m, 'une seule chaîne pour toute la capsule');

  /* Les pièges que l'annexe souligne. */
  for (const piege of ['undefined', 'moins un', 'accents', 'première occurrence']) {
    assert.ok(narration.includes(piege), 'piège non expliqué : ' + piege);
  }
});

test('le ruban de caractères est calculé, jamais recopié', () => {
  const dessin = lire('outils/fonctionschaine/dessin.py');
  const scenes = lire('outils/fonctionschaine/scenes.py');

  assert.match(dessin, /def ruban\(/, 'la primitive du ruban');
  assert.match(dessin, /def marqueur\(/, 'le repère sous une case');
  /* Les positions viennent de la longueur de la chaîne, pas d'une liste écrite
     à la main : changer CH ne peut pas désynchroniser le dessin. */
  assert.match(scenes, /INDICES = list\(range\(len\(CH\)\)\)/);
  assert.ok(!/positions*=*\[\s*0,\s*1,\s*2,\s*3,\s*4,\s*5,\s*6/.test(scenes),
    'aucune liste de positions écrite en dur');
});

test('le montage suit le modèle des autres capsules', () => {
  for (const fichier of ['narration.py', 'scenes.py', 'dessin.py', 'theme.py',
    'montage.py', 'render.py', 'integrer.py', 'README.md']) {
    assert.ok(existsSync(join(OUTILS_VRAI, fichier)), 'outil manquant : ' + fichier);
  }
  const scenes = lire('outils/fonctionschaine/scenes.py');
  /* Une scène par section, dans l'ordre de la voix : le module le vérifie déjà
     à l'import, on vérifie ici que les dix clés sont bien les dix scènes. */
  const cles = [...scenes.matchAll(/^    "([a-z_]+)": scene_/gm)].map((m) => m[1]);
  assert.equal(cles.length, 10, 'dix scènes');
  const narration = lire('outils/fonctionschaine/narration.py');
  const ordre = narration.split('ORDRE = [')[1].split(']')[0].match(/"([a-z_]+)"/g).map((s) => s.slice(1, -1));
  assert.deepEqual(cles, ordre, 'les scènes suivent l’ordre de la voix off');
  /* Le thème vient de la capsule historique : même palette que les autres. */
  assert.match(lire('outils/fonctionschaine/theme.py'), /tpvid6/);
});

test('le lecteur du site sait ouvrir la capsule depuis la grille', () => {
  const protection = lire('assets/js/protection.js');
  assert.ok(protection.includes('var estFonctionsChaine = '), 'le garde-fou doit reconnaître le slug');
  assert.ok(/estFonctionsChaine \? prefixeAssetsSTI\(\) \+ "videos\/FonctionsChaine-v564\.mp4"/.test(protection),
    'le fichier joué');
  assert.ok(protection.includes('STI_CHAPITRES_MEDIA["fonctions-chaine"] = ['), 'les chapitres');

  const lecteur = lire('assets/js/lecteur-commun.js');
  assert.match(lecteur, /'fonctions-chaine': \['javascript',/);

  /* Les chapitres couvrent les dix sections. */
  const bloc = protection.slice(protection.indexOf('STI_CHAPITRES_MEDIA["fonctions-chaine"] = ['));
  const fin = bloc.indexOf('];');
  assert.equal(bloc.slice(0, fin).split('{ t:').length - 1, 10, 'un repère par section');
});

test('la carte du cours JavaScript suit le modèle des capsules', () => {
  const page = lire('cours/javascript.html');
  assert.ok(page.includes(`data-video-id="${ID}"`));
  assert.ok(page.includes(`../assets/videos/FonctionsChaine-v564.mp4`));
  assert.ok(page.includes(`../assets/subtitles/FonctionsChaine-fr-v564.vtt`));
  assert.match(page, /CAPSULE · LES FONCTIONS DE CHAÎNE \(\d+:\d{2}\)/);
  assert.ok(page.includes('class="featured-video-card sti-capsule-vedette"'),
    'la carte porte l’étiquette « Capsule » des pages de cours');

  const categorie = catalogue().find((v) => v.id === ID);
  assert.ok(page.includes(categorie.dureeTexte), 'le badge de la carte suit la durée réelle');
});

test('la capsule est dans le paquet hors-ligne et versionnée', () => {
  const sw = lire('sw.js');
  assert.ok(sw.includes(`"./assets/videos/FonctionsChaine-v564.mp4"`));
  assert.ok(sw.includes(`"./assets/subtitles/FonctionsChaine-fr-v564.vtt"`));
  assert.ok(sw.includes('revision: "etiquette-relief-v572"'), 'les pages touchées sont réinvalidées');
  /* v573 : l'accueil et le livre connecté repartent au lot « 3ème SI 2026 ». */
  const REV_PAGES = { './index.html': 'sti-3si-v573', './cours/javascript.html': 'etiquette-relief-v572',
    './cours/php.html': 'etiquette-relief-v572', './assets/js/app.js': 'etiquette-relief-v572' };
  const attendu = (page) => REV_PAGES[page] || 'php-chaines-v566';
  for (const page of ['./index.html', './cours/javascript.html', './assets/js/app.js',
    './assets/js/protection.js', './assets/js/lecteur-commun.js']) {
    assert.ok(sw.includes(`{ url: "${page}", revision: "${attendu(page)}"`) ||
      sw.includes(`{ url: "${page}", revision: "${attendu(page)}",`), 'révision de ' + page);
  }
});

test('les totaux de l’accueil suivent le catalogue', () => {
  const liste = catalogue();
  const index = lire('index.html');
  const js = liste.filter((v) => (v.matieres || [v.matiere]).includes('javascript')).length;
  assert.equal(liste.length, 26);
  assert.equal(js, 8);
  assert.ok(index.includes(`data-video-filter="all">Toutes (${liste.length})</button>`));
  assert.ok(index.includes(`<span id="videosTotalNombre">${liste.length}</span>`));
  assert.ok(index.includes(`data-video-filter="javascript">JS (${js})</button>`));
  assert.ok(index.includes(`🎥 ${js} vidéos &amp; 🔊 audio`));
  assert.ok(index.includes(`⚡ JavaScript (${js} vidéos)`));
  assert.equal(new Set(liste.map((v) => v.id)).size, liste.length, 'aucun identifiant en double');
});
