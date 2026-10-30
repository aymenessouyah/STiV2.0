/* v565 — capsule « L'objet Date ».
   ─────────────────────────────────────────────────────────────────────────
   Une treizième capsule dans la série JavaScript, sur le même modèle que
   « Les boucles », « La console et les variables », « PHP — les variables » et
   « Les chaînes de caractères » : neuf sections, une voix masculine, deux
   colonnes (fiche / code), des exercices, des sous-titres, des chapitres, et
   l'entrée au catalogue.

   Deux décisions du demandeur sont vérifiées ici, parce qu'elles se voient
   dans la vidéo :
     • `alert()` est remplacé par `console.log()` dans tous les exemples ;
     • la dernière règle du « À retenir » parle des dates (elle venait, dans la
       fiche des chaînes, de `Number()` / `parseInt()`).

   Ce fichier contrôle la capsule livrée, son branchement et l'accueil.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync, openSync, readSync, closeSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (chemin) => readFileSync(join(root, chemin), 'utf8');

const MP4 = 'assets/videos/DateJS-v565.mp4';
const VTT = 'assets/subtitles/DateJS-fr-v565.vtt';
const ID = 'date-js';
const OUTILS = join(root, 'outils', 'datejs');

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
   1 · La capsule livrée
   ═════════════════════════════════════════════════════════════════════════ */
test('la capsule Date est livrée : MP4, sous-titres français et durée réelle', () => {
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
  assert.ok(seconde > 7 * 60 && seconde < 20 * 60, 'durée de capsule : ' + attendu);

  const vtt = lire(VTT);
  assert.ok(vtt.startsWith('WEBVTT'));
  assert.ok(vtt.includes('15 septembre 2026') || vtt.includes('getMonth'), 'les mots de la fiche');
  const cues = vtt.split(/\n\n+/).filter((b) => b.includes('-->'));
  assert.ok(cues.length > 100, 'un sous-titre toutes les quelques secondes');
});

test('la fiche est suivie : les quatre méthodes et les deux façons de créer une date', () => {
  const narration = lire('outils/datejs/narration.py');

  /* Sections ① et ② de la fiche. */
  assert.ok(narration.includes('new Date()'), 'new Date() sans argument');
  assert.ok(narration.includes('new Date(ch)') || narration.includes('new Date de ch'),
    'new Date à partir d’une chaîne');
  /* Méthodes ③ à ⑥. */
  for (const methode of ['getDate', 'getMonth', 'getFullYear', 'toString']) {
    assert.ok(narration.includes(methode), 'méthode absente de la voix off : ' + methode);
  }
  /* Le format sûr et le piège du mois. */
  for (const notion of ['Invalid Date', 'tiret', 'zéro', 'onze']) {
    assert.ok(narration.includes(notion), 'notion non expliquée : ' + notion);
  }
  /* Une seule date pour toute la capsule. */
  assert.match(narration, /^SOURCE = "2026-09-15T08:00:00"$/m, 'la date de rentrée, une seule fois');
  assert.ok(narration.includes('Lycée Rafèha'));

  /* Neuf sections, dans l'ordre. */
  const ordre = narration.split('ORDRE = [')[1].split(']')[0].match(/"([a-z_]+)"/g).map((s) => s.slice(1, -1));
  assert.deepEqual(ordre, ['ouverture', 'date_courante', 'date_chaine', 'getdate', 'getmonth',
    'getfullyear', 'tostring', 'exemple_complet', 'exercices']);
});

test('les exemples passent par console.log, jamais par alert', () => {
  const narration = lire('outils/datejs/narration.py');
  const scenes = lire('outils/datejs/scenes.py');
  /* Le texte dit, seulement : la docstring du module a le droit de citer la
     correction (« console.log et non alert »). */
  const textes = narration.slice(narration.indexOf('SECTIONS = {'));
  /* C'est la correction demandée sur la fiche : la console du navigateur. */
  assert.ok(!/alert\s*\(/.test(textes), 'aucun alert() dans la voix off');
  assert.ok(!/alert\s*\(/.test(scenes), 'aucun alert() à l’écran');
  assert.ok(narration.includes('console.log') || narration.includes('console point log'));
  assert.ok(scenes.includes('console.log('), 'le code montré utilise console.log');
});

test('la dernière règle du « À retenir » parle des dates, pas de Number()/parseInt()', () => {
  const narration = lire('outils/datejs/narration.py');
  const bloc = narration.slice(narration.indexOf('"exercices": {'));
  /* Les quatre règles de la capsule des chaînes n'ont rien à faire ici. */
  assert.ok(!/Number\s*\(|parseInt|parseFloat|isNaN/.test(bloc),
    'aucune règle héritée de la fiche des chaînes');
  /* Quatre règles, dont le piège du mois et le format sûr. */
  assert.ok(bloc.includes('getMonth') && bloc.includes('getDate')
    && bloc.includes('getFullYear') && bloc.includes('toString'));
});

test('les dessins sont calculés, jamais recopiés', () => {
  const dessin = lire('outils/datejs/dessin.py');
  const scenes = lire('outils/datejs/scenes.py');

  for (const primitive of ['def calendrier(', 'def bande_mois(', 'def horloge(']) {
    assert.ok(dessin.includes(primitive), 'primitive manquante : ' + primitive);
  }
  /* Le calendrier part du 1er du mois et du jour de la semaine : rien n'est
     écrit à la main, changer la date de la capsule ne casse pas la grille. */
  assert.match(dessin, /DECALAGE_SEPTEMBRE_2026 = \d+/, 'le décalage du 1er est nommé');
  assert.match(dessin, /rang = jour - 1 \+ decalage/, 'la grille se place toute seule');
  assert.match(dessin, /for jour in range\(1, jours \+ 1\)/, 'une case par jour, sans liste écrite');
  /* La bande des mois affiche les DEUX numéros : JavaScript et l'humain. */
  assert.ok(scenes.includes('bande_mois('), 'la bande des douze mois est montrée');
});

test('le montage suit le modèle des autres capsules', () => {
  for (const fichier of ['narration.py', 'scenes.py', 'dessin.py', 'theme.py',
    'montage.py', 'render.py', 'integrer.py', 'README.md']) {
    assert.ok(existsSync(join(OUTILS, fichier)), 'outil manquant : ' + fichier);
  }
  const scenes = lire('outils/datejs/scenes.py');
  const cles = [...scenes.matchAll(/^    "([a-z_]+)": scene_/gm)].map((m) => m[1]);
  assert.equal(cles.length, 9, 'neuf scènes');
  const narration = lire('outils/datejs/narration.py');
  const ordre = narration.split('ORDRE = [')[1].split(']')[0].match(/"([a-z_]+)"/g).map((s) => s.slice(1, -1));
  assert.deepEqual(cles, ordre, 'les scènes suivent l’ordre de la voix off');
  /* Le thème vient de la capsule historique : même palette que les autres. */
  assert.match(lire('outils/datejs/theme.py'), /tpvid6/);
});

/* ═════════════════════════════════════════════════════════════════════════
   2 · Le branchement dans le site
   ═════════════════════════════════════════════════════════════════════════ */
test('le lecteur du site sait ouvrir la capsule depuis la grille', () => {
  const protection = lire('assets/js/protection.js');
  assert.ok(protection.includes('var estDateJs = '), 'le garde-fou doit reconnaître le slug');
  assert.ok(/estDateJs \? prefixeAssetsSTI\(\) \+ "videos\/DateJS-v565\.mp4"/.test(protection),
    'le fichier joué');
  assert.ok(protection.includes('STI_CHAPITRES_MEDIA["date-js"] = ['), 'les chapitres');
  assert.ok(/slugCible = estPhpChaines \? "php-chaines" : estDateJs \? "date-js"/.test(protection), 'le slug des chapitres');

  const lecteur = lire('assets/js/lecteur-commun.js');
  assert.match(lecteur, /'date-js': \['javascript',/);

  const app = lire('assets/js/app.js');
  const capsules = app.split('var CAPSULES_VIDEO = ')[1].split('};')[0] + '}';
  const reconnues = vm.runInNewContext('(' + capsules + ')');
  assert.equal(reconnues['date-js'], true, 'la grille pose l’étiquette « Capsule »');

  /* Un repère de chapitre par section. */
  const bloc = protection.slice(protection.indexOf('STI_CHAPITRES_MEDIA["date-js"] = ['));
  assert.equal(bloc.slice(0, bloc.indexOf('];')).split('{ t:').length - 1, 9,
    'neuf repères, un par section');
});

test('la carte du cours JavaScript suit le modèle des capsules', () => {
  const page = lire('cours/javascript.html');
  assert.ok(page.includes(`data-video-id="${ID}"`));
  assert.ok(page.includes('../assets/videos/DateJS-v565.mp4'));
  assert.ok(page.includes('../assets/subtitles/DateJS-fr-v565.vtt'));
  assert.match(page, /CAPSULE · L’OBJET DATE \(\d+:\d{2}\)/);
  assert.ok(page.includes('class="featured-video-card sti-capsule-vedette"'),
    'la carte porte l’étiquette « Capsule » des pages de cours');

  const categorie = catalogue().find((v) => v.id === ID);
  assert.ok(page.includes(categorie.dureeTexte), 'le badge de la carte suit la durée réelle');

  /* La phrase d'introduction cite la nouvelle capsule. */
  assert.ok(page.includes('L\'objet Date'), 'la capsule est annoncée dans le texte du cours');
});

test('la capsule est dans le paquet hors-ligne et versionnée', () => {
  const sw = lire('sw.js');
  assert.ok(sw.includes(`"./assets/videos/DateJS-v565.mp4"`), 'MP4 hors-ligne');
  assert.ok(sw.includes(`"./assets/subtitles/DateJS-fr-v565.vtt"`), 'VTT hors-ligne');
  const REV_PAGES = new Set(['./index.html', './cours/javascript.html', './cours/php.html', './assets/js/app.js']);
  const attendu = (page) => (REV_PAGES.has(page) ? 'etiquette-relief-v572' : 'php-chaines-v566');
  for (const page of ['./index.html', './cours/javascript.html', './assets/js/app.js',
    './assets/js/protection.js', './assets/js/lecteur-commun.js',
    './assets/js/admin-vues-videos.js']) {
    assert.ok(sw.includes(`{ url: "${page}", revision: "${attendu(page)}"`), 'révision de ' + page);
  }
});

test('les totaux de l’accueil et du catalogue suivent', () => {
  const liste = catalogue();
  const index = lire('index.html');
  const js = liste.filter((v) => (v.matieres || [v.matiere]).includes('javascript')).length;
  assert.equal(liste.length, 26, 'vingt-six capsules');
  assert.equal(js, 8, 'huit capsules JavaScript');
  assert.ok(index.includes(`data-video-filter="all">Toutes (${liste.length})</button>`));
  assert.ok(index.includes(`<span id="videosTotalNombre">${liste.length}</span>`));
  assert.ok(index.includes(`data-video-filter="javascript">JS (${js})</button>`));
  assert.ok(index.includes(`🎥 ${js} vidéos &amp; 🔊 audio`));
  assert.ok(index.includes(`⚡ JavaScript (${js} vidéos)`));
  assert.equal(new Set(liste.map((v) => v.id)).size, liste.length, 'aucun identifiant en double');
});
