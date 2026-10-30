/* v566 — capsule PHP « Chaînes, transtypage et date/heure ».
   ─────────────────────────────────────────────────────────────────────────
   Une capsule de plus dans la série PHP, sur le même modèle que « Les
   variables, la portée et les types » : douze sections, une voix masculine,
   deux colonnes (fiche / code), des exercices, des sous-titres, des chapitres,
   et l'entrée au catalogue.

   La fiche est longue — trois parties et vingt rubriques — et son fil rouge est
   l'octet : `strlen("Lycée Rafèha")` vaut 14, `strpos($ch, "R")` vaut 7. Ce
   fichier vérifie que la capsule suit bien ce fil, et qu'elle est branchée
   comme ses devancières.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync, openSync, readSync, closeSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (chemin) => readFileSync(join(root, chemin), 'utf8');

const MP4 = 'assets/videos/PhpChaines-v566.mp4';
const VTT = 'assets/subtitles/PhpChaines-fr-v566.vtt';
const ID = 'php-chaines';
const OUTILS = join(root, 'outils', 'phpchaines');

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
test('la capsule PHP est livrée : MP4, sous-titres français et durée réelle', () => {
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
  assert.equal(entree.matiere, 'php');
  assert.ok(seconde > 10 * 60 && seconde < 22 * 60, 'durée de capsule : ' + attendu);

  const vtt = lire(VTT);
  assert.ok(vtt.startsWith('WEBVTT'));
  const cues = vtt.split(/\n\n+/).filter((b) => b.includes('-->'));
  assert.ok(cues.length > 100, 'un sous-titre toutes les quelques secondes');
});

test('la fiche est suivie : les trois parties et leurs vingt rubriques', () => {
  const narration = lire('outils/phpchaines/narration.py');

  /* Partie A — les dix fonctions des chaînes. */
  for (const fonction of ['ord', 'chr', 'strlen', 'strpos', 'substr', 'str_replace',
    'strtolower', 'strtoupper', 'trim']) {
    assert.ok(narration.includes(fonction), 'fonction absente de la voix off : ' + fonction);
  }
  /* Partie B — les cinq transtypages. */
  for (const cast of ['int', 'float', 'string', 'bool', 'array']) {
    assert.ok(narration.includes(cast), 'transtypage absent : ' + cast);
  }
  /* Partie C — les cinq fonctions de date. */
  for (const nom of ['date', 'time', 'checkdate', 'strtotime', 'timestamp']) {
    assert.ok(narration.includes(nom), 'fonction absente : ' + nom);
  }
  /* Une seule chaîne et une seule date pour toute la capsule. */
  assert.match(narration, /^CH = "Lycée Rafèha"$/m);
  assert.match(narration, /^SOURCE = f?"?\{?ANNEE/m);

  /* Douze sections, dans l'ordre de la fiche. */
  const ordre = narration.split('ORDRE = [')[1].split(']')[0].match(/"([a-z_]+)"/g).map((s) => s.slice(1, -1));
  assert.deepEqual(ordre, ['ouverture', 'octets', 'longueur', 'recherche', 'extraction',
    'remplacer', 'separer', 'transtypage_nombres', 'transtypage_autres', 'dates',
    'verifier_date', 'exercices']);
});

test('les pièges de la fiche sont dits et montrés', () => {
  const narration = lire('outils/phpchaines/narration.py');
  const scenes = lire('outils/phpchaines/scenes.py');

  /* Le fil rouge : l'octet, et non le caractère. */
  assert.ok(narration.includes('octets'), 'la voix doit dire l’octet');
  assert.match(scenes, /12 caractères/, 'l’écran doit opposer 12 caractères et 14 octets');
  assert.match(scenes, /=== false/, 'la règle du test strict');
  assert.match(scenes, /\(float\)\\"12,5\\"|12,5/, 'la virgule refusée par (float)');
  assert.match(scenes, /checkdate\(9, 15, 2026\)/, 'l’ordre mois / jour / année');

  /* Les six règles du « À retenir », à l'écran comme à la voix. */
  const bloc = scenes.slice(scenes.indexOf('def _regles'));
  for (let n = 1; n <= 6; n += 1) {
    assert.ok(bloc.includes(`"${n} · `), 'règle ' + n + ' à l’écran');
  }
});

test('le ruban d’octets est calculé, jamais recopié', () => {
  const dessin = lire('outils/phpchaines/dessin.py');
  const scenes = lire('outils/phpchaines/scenes.py');

  for (const primitive of ['def ruban_octets(', 'def frise_timestamp(', 'def table_lettres(']) {
    assert.ok(dessin.includes(primitive), 'primitive manquante : ' + primitive);
  }
  /* Quatorze octets, deux accents de deux octets : les cases viennent du
     dictionnaire LETTRES, pas d'une suite de nombres écrite à la main. */
  assert.match(dessin, /^OCTETS = 14$/m);
  assert.match(dessin, /^ACCENTS = \{3: \(3, 4, "é", \("C3", "A9"\)\), 10:/m);
  assert.ok(scenes.includes('ruban_octets(') || scenes.includes('_ruban('),
    'le ruban est montré');
  /* Le tableau des lettres de date() vient de la fiche, avec ses exemples. */
  assert.match(dessin, /\("l", "jour entier \(anglais\)", "Tuesday"\)/);
});

test('le montage suit le modèle des autres capsules', () => {
  for (const fichier of ['narration.py', 'scenes.py', 'dessin.py', 'theme.py',
    'montage.py', 'render.py', 'integrer.py', 'README.md']) {
    assert.ok(existsSync(join(OUTILS, fichier)), 'outil manquant : ' + fichier);
  }
  const scenes = lire('outils/phpchaines/scenes.py');
  const cles = [...scenes.matchAll(/^    "([a-z_]+)": scene_/gm)].map((m) => m[1]);
  assert.equal(cles.length, 12, 'douze scènes');
  const narration = lire('outils/phpchaines/narration.py');
  const ordre = narration.split('ORDRE = [')[1].split(']')[0].match(/"([a-z_]+)"/g).map((s) => s.slice(1, -1));
  assert.deepEqual(cles, ordre, 'les scènes suivent l’ordre de la voix off');
  /* Le thème vient de la capsule historique : même palette que les autres. */
  assert.match(lire('outils/phpchaines/theme.py'), /tpvid6/);
});

/* ═════════════════════════════════════════════════════════════════════════
   2 · Le branchement dans le site
   ═════════════════════════════════════════════════════════════════════════ */
test('le lecteur du site sait ouvrir la capsule depuis la grille', () => {
  const protection = lire('assets/js/protection.js');
  assert.ok(protection.includes('var estPhpChaines = '), 'le garde-fou doit reconnaître le slug');
  assert.ok(/url = estPhpChaines \? prefixeAssetsSTI\(\) \+ "videos\/PhpChaines-v566\.mp4"/.test(protection),
    'le fichier joué');
  assert.ok(protection.includes('STI_CHAPITRES_MEDIA["php-chaines"] = ['), 'les chapitres');
  assert.ok(/slugCible = estPhpChaines \? "php-chaines"/.test(protection), 'le slug des chapitres');

  const lecteur = lire('assets/js/lecteur-commun.js');
  assert.match(lecteur, /'php-chaines': \['php',/);

  const app = lire('assets/js/app.js');
  const capsules = app.split('var CAPSULES_VIDEO = ')[1].split('};')[0] + '}';
  const reconnues = vm.runInNewContext('(' + capsules + ')');
  assert.equal(reconnues['php-chaines'], true, 'la grille pose l’étiquette « Capsule »');

  /* Un repère de chapitre par section. */
  const bloc = protection.slice(protection.indexOf('STI_CHAPITRES_MEDIA["php-chaines"] = ['));
  assert.equal(bloc.slice(0, bloc.indexOf('];')).split('{ t:').length - 1, 12,
    'douze repères, un par section');
});

test('la carte du cours PHP suit le modèle des capsules', () => {
  const page = lire('cours/php.html');
  assert.ok(page.includes(`data-video-open="${ID}"`), 'le bouton « Regarder »');
  assert.ok(page.includes('../assets/videos/PhpChaines-v566.mp4'));
  assert.ok(page.includes('id="phpChaines"') || page.includes('data-video-state="php-chaines"'));
  assert.ok(page.includes('class="matiere-video-card sti-capsule-vedette "'),
    'la carte porte l’étiquette « Capsule » des pages de cours');

  const categorie = catalogue().find((v) => v.id === ID);
  assert.ok(page.includes(categorie.dureeTexte), 'le badge de la carte suit la durée réelle');
});

test('la capsule est dans le paquet hors-ligne et versionnée', () => {
  const sw = lire('sw.js');
  assert.ok(sw.includes(`"./assets/videos/PhpChaines-v566.mp4"`), 'MP4 hors-ligne');
  assert.ok(sw.includes(`"./assets/subtitles/PhpChaines-fr-v566.vtt"`), 'VTT hors-ligne');
  const REV_PAGES = new Set(['./index.html', './cours/javascript.html', './cours/php.html', './assets/js/app.js']);
  const attendu = (page) => (REV_PAGES.has(page) ? 'etiquette-relief-v572' : 'php-chaines-v566');
  for (const page of ['./index.html', './cours/php.html', './assets/js/app.js',
    './assets/js/protection.js', './assets/js/lecteur-commun.js',
    './assets/js/admin-vues-videos.js']) {
    assert.ok(sw.includes(`{ url: "${page}", revision: "${attendu(page)}"`), 'révision de ' + page);
  }
});

test('les totaux de l’accueil et du catalogue suivent', () => {
  const liste = catalogue();
  const index = lire('index.html');
  const php = liste.filter((v) => (v.matieres || [v.matiere]).includes('php')).length;
  assert.equal(liste.length, 26, 'vingt-six capsules');
  assert.equal(php, 6, 'six capsules PHP');
  assert.ok(index.includes(`data-video-filter="all">Toutes (${liste.length})</button>`));
  assert.ok(index.includes(`<span id="videosTotalNombre">${liste.length}</span>`));
  assert.ok(index.includes(`data-video-filter="php">PHP (${php})</button>`));
  assert.ok(index.includes(`🎥 ${php} vidéos &amp; 🔊 audio`));
  assert.equal(new Set(liste.map((v) => v.id)).size, liste.length, 'aucun identifiant en double');
});
