/* v577 — la vidéo du cours « Systèmes, technologies et Internet » (3ᵉ SI).
   ─────────────────────────────────────────────────────────────────────────
   Ce n'est pas une capsule : c'est le cours de la partie 1 du manuel
   (pages 5 à 13), expliqué de bout en bout. Ce fichier vérifie trois choses :

   1. la vidéo est livrée, avec ses sous-titres, sa durée réelle et ses
      dix chapitres ;
   2. elle dit exactement ce que dit le livre — les mêmes exemples, une seule
      fois chacun — et reste dans le thème des capsules ;
   3. elle est branchée dans le site : la carte du cours, le lecteur, les
      chapitres, le hors-ligne, et l'administration.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync, openSync, readSync, closeSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (chemin) => readFileSync(join(root, chemin), 'utf8');

const MP4 = 'assets/videos/CoursSystemesInternet-v577.mp4';
const VTT = 'assets/subtitles/CoursSystemesInternet-fr-v577.vtt';
const ID = 'cours-sti';
const PAGE = 'cours/systemes-technologies-internet.html';
const OUTILS = join(root, 'outils', 'courssti');
const REV = 'cours-sti-v577';

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

const mmss = (secondes) => `${Math.floor(Math.round(secondes) / 60)}:${String(Math.round(secondes) % 60).padStart(2, '0')}`;

function sections() {
  const narration = lire('outils/courssti/narration.py');
  return narration.split('ORDRE = [')[1].split(']')[0].match(/"([a-z_]+)"/g).map((s) => s.slice(1, -1));
}

/* ═════════════════════════════════════════════════════════════════════════
   1 · La vidéo livrée
   ═════════════════════════════════════════════════════════════════════════ */
test('la vidéo du cours est livrée : MP4, sous-titres français et durée réelle', () => {
  assert.ok(existsSync(join(root, MP4)), MP4);
  assert.ok(existsSync(join(root, VTT)), VTT);
  assert.ok(statSync(join(root, MP4)).size > 1_000_000, 'une vraie vidéo, pas un fichier vide');

  const seconde = dureeMp4(MP4);
  assert.ok(seconde > 12 * 60 && seconde < 24 * 60, 'durée de cours : ' + mmss(seconde));

  /* Le badge de la carte est la durée réelle, à la seconde près. */
  const page = lire(PAGE);
  const badge = page.match(/data-video-duree="cours-sti">(\d+:\d{2})</);
  assert.ok(badge, 'le badge de durée de la carte');
  assert.ok(Math.abs(Number(badge[1].split(':')[0]) * 60 + Number(badge[1].split(':')[1]) - seconde) <= 1,
    'la carte affiche la durée réelle : ' + badge[1]);

  const vtt = lire(VTT);
  assert.ok(vtt.startsWith('WEBVTT'));
  const cues = vtt.split(/\n\n+/).filter((b) => b.includes('-->'));
  assert.ok(cues.length > 150, 'un sous-titre toutes les quelques secondes : ' + cues.length);
});

test('les dix chapitres sont dans le lecteur, dans l’ordre de la voix', () => {
  const protection = lire('assets/js/protection.js');
  const entete = `STI_CHAPITRES_MEDIA["${ID}"] = [`;
  assert.ok(protection.includes(entete), 'les chapitres du cours');
  const bloc = protection.slice(protection.indexOf(entete));
  const fins = bloc.slice(0, bloc.indexOf('];'));
  const reperes = [...fins.matchAll(/\{ t: ([\d.]+),/g)].map((m) => Number(m[1]));
  assert.equal(reperes.length, 10, 'dix repères, un par section');
  for (let i = 1; i < reperes.length; i += 1) {
    assert.ok(reperes[i] > reperes[i - 1], 'les chapitres avancent : ' + reperes.join(', '));
  }
  assert.ok(reperes[0] < 2, 'le premier chapitre est au début');
});

/* ═════════════════════════════════════════════════════════════════════════
   2 · Le contenu est celui du livre
   ═════════════════════════════════════════════════════════════════════════ */
test('le cours suit le manuel : trois chapitres, dix sections, une fiche de synthèse', () => {
  assert.deepEqual(sections(), ['ouverture', 'systeme', 'systeme_types', 'systeme_deployer',
    'reseau_definition', 'reseau_parametres', 'reseau_architectures',
    'iot_principe', 'iot_echange', 'synthese']);

  const narration = lire('outils/courssti/narration.py');
  for (const notion of ['système d\'exploitation', 'logiciel libre', 'machine virtuelle',
    'LAN', 'MAN', 'WAN', 'masque', 'DNS', 'adresse MAC', 'TCP/IP', 'HTTP', 'HTTPS',
    'MQTT', 'broker', 'Internet des objets', 'serre intelligente']) {
    assert.ok(narration.includes(notion), 'notion absente de la voix off : ' + notion);
  }
  assert.ok(narration.includes('192.168.1.20'), 'l’adresse du manuel');
  assert.ok(narration.includes('255.255.255.0'), 'le masque du manuel');
  assert.ok(narration.includes('192.168.1.0'), 'le réseau calculé par le manuel');
  assert.ok(narration.includes('A4-B1-C1-2D-3E-4F'), 'l’adresse MAC du manuel');
  assert.ok(narration.includes('maison/salon/temperature'), 'le sujet MQTT du manuel');
});

test('ce n’est pas une capsule : pas d’énoncé, pas de correction, une fiche de synthèse', () => {
  const narration = lire('outils/courssti/narration.py');
  const scenes = lire('outils/courssti/scenes.py');
  assert.ok(!/exercice|corrig[eé] de l|Énoncé/i.test(scenes), 'aucune scène d’exercice');
  assert.match(scenes, /la fiche de synthèse/, 'la dernière scène est la fiche du manuel');
  assert.match(narration, /évaluation générale du manuel, page treize/, 'la vidéo renvoie à l’évaluation');
  assert.match(scenes, /COURS · 3ᵉ SI/, 'l’en-tête dit « COURS », pas « CAPSULE »');
});

test('chaque section tient dans un clip de la synthèse vocale', () => {
  /* La limite d'un clip est de 1500 caractères ; on garde une marge. */
  const narration = lire('outils/courssti/narration.py');
  const blocs = narration.split(/\n    "[a-z_]+": \{\n/).slice(1);
  assert.equal(blocs.length, 10, 'dix sections');
  for (const bloc of blocs) {
    const textes = [...bloc.matchAll(/^\s+"([^"]{20,})",?$/gm)].map((m) => m[1]);
    const longueur = textes.join(' ').length;
    assert.ok(longueur < 1500, 'section trop longue pour un clip : ' + longueur + ' caractères');
  }
});

test('la voix dit les adresses et les sigles en toutes lettres', () => {
  const narration = lire('outils/courssti/narration.py');
  assert.match(narration, /def dit\(texte: str\) -> str:/);
  assert.ok(narration.includes('_MAC_DITE'), 'l’adresse MAC épelée');
  assert.ok(narration.includes('"MQTT": "M Q T T"'), 'le sigle MQTT épelé');
  /* L'écran et les sous-titres, eux, gardent la forme du manuel. */
  const scenes = lire('outils/courssti/scenes.py');
  assert.ok(scenes.includes('192.168.1.20') || scenes.includes('192'), 'l’adresse reste lisible à l’écran');
  assert.match(scenes, /A4-B1-C1-2D-3E-4F/, 'la MAC reste lisible à l’écran');
});

test('les scènes suivent l’ordre de la voix et le thème des capsules', () => {
  for (const fichier of ['narration.py', 'scenes.py', 'dessin.py', 'theme.py',
    'montage.py', 'render.py', 'integrer.py', 'README.md']) {
    assert.ok(existsSync(join(OUTILS, fichier)), 'outil manquant : ' + fichier);
  }
  const scenes = lire('outils/courssti/scenes.py');
  const cles = [...scenes.matchAll(/^    "([a-z_]+)": scene_/gm)].map((m) => m[1]);
  assert.deepEqual(cles, sections(), 'une scène par section, dans l’ordre');
  /* Le thème vient de la capsule historique : même palette que les autres. */
  assert.match(lire('outils/courssti/theme.py'), /tpvid6/);
  /* L'image apparaît quand la voix y arrive : aucune synchronisation à la main. */
  assert.match(scenes, /N\.avance\("systeme", "roles"\)/);
  for (const primitive of ['def carte(', 'def table(', 'def chaine(', 'def pile(']) {
    assert.ok(lire('outils/courssti/dessin.py').includes(primitive), 'primitive manquante : ' + primitive);
  }
});

/* ═════════════════════════════════════════════════════════════════════════
   3 · Le branchement dans le site
   ═════════════════════════════════════════════════════════════════════════ */
test('le lecteur du site sait ouvrir la vidéo du cours', () => {
  const protection = lire('assets/js/protection.js');
  assert.ok(protection.includes('var estCoursSti = '), 'le garde-fou reconnaît le slug');
  assert.ok(/if \(estCoursSti\) url = prefixeAssetsSTI\(\) \+ "videos\/CoursSystemesInternet-v577\.mp4"/.test(protection),
    'le fichier joué');
  assert.ok(/if \(estCoursSti\) slugCible = "cours-sti"/.test(protection), 'le slug des chapitres');
  assert.match(protection, /🎥 Cours — Systèmes, technologies et Internet \(3ᵉ SI\)/, 'le titre du lecteur');

  const lecteur = lire('assets/js/lecteur-commun.js');
  assert.match(lecteur, /'cours-sti': \['sti',/);
  /* la carte du cours n'a que le lecteur commun : il doit ouvrir le lien direct */
  assert.match(lecteur, /closest\('\[data-video-open\]'\)/, 'ouverture depuis data-video-open');
  assert.ok(lire('assets/js/admin-vues-videos.js').includes('{ id: "cours-sti"'), 'la vue admin');
});

test('la carte du cours porte le bouton, la durée et les sous-titres', () => {
  const page = lire(PAGE);
  assert.ok(page.includes(`data-video-open="${ID}"`), 'le bouton « Regarder »');
  assert.ok(page.includes(`../assets/videos/CoursSystemesInternet-v577.mp4`), 'le MP4 téléchargeable');
  assert.ok(page.includes(`../assets/subtitles/CoursSystemesInternet-fr-v577.vtt`), 'les sous-titres');
  assert.ok(page.includes('id="video-cours"'), 'la section de la vidéo');
  assert.ok(page.includes('data-video-open="cours-sti"'), 'le bouton du haut de page');
  assert.ok(page.includes('Les dix sections de la vidéo'), 'la liste des sections');
  assert.ok(!/STI_CHAPITRES_MEDIA\[\]\s*=/.test(page), 'pas de code collé dans la page');
});

test('la vidéo est dans le paquet hors-ligne et versionnée', () => {
  const sw = lire('sw.js');
  assert.ok(sw.includes(`"./assets/videos/CoursSystemesInternet-v577.mp4"`), 'MP4 hors-ligne');
  assert.ok(sw.includes(`"./assets/subtitles/CoursSystemesInternet-fr-v577.vtt"`), 'VTT hors-ligne');
  assert.ok(sw.includes(`{ url: "./assets/js/protection.js", revision: "${REV}" }`), 'révision du lecteur');
  assert.ok(sw.includes(`{ url: "./assets/js/lecteur-commun.js", revision: "${REV}" }`), 'révision du lecteur commun');
  assert.ok(sw.includes(`{ url: "./assets/js/admin-vues-videos.js", revision: "${REV}" }`), 'révision de la vue admin');
  assert.ok(sw.includes(`{ url: "./${PAGE}", revision: "sti-3si-v577", refreshIfCached: true }`), 'révision du cours');
});

test('les outils savent refaire la vidéo', () => {
  const integrer = lire('outils/courssti/integrer.py');
  assert.ok(integrer.includes('VERSION_MEDIA = "v577"'), 'la version est dans le nom des fichiers');
  assert.ok(integrer.includes('CLE_CHAPITRES = "cours-sti"'), 'les chapitres sont réécrits par l’outil');
  assert.ok(integrer.includes('--verifier'), 'l’outil sait contrôler sans écrire');
  assert.ok(existsSync(join(OUTILS, 'calage.json')), 'calage.json (montage)');
  assert.ok(existsSync(join(OUTILS, 'sous-titres.vtt')), 'sous-titres.vtt (montage)');
});
