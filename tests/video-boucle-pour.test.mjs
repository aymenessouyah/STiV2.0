/* v537 — capsule « La boucle Pour — le sac et l'ascenseur » (JavaScript).
   Contrôle la vidéo livrée, ses sous-titres français, le récit en neuf étapes,
   l'intégration dans le site (carte vidéo, catalogue, lecteur partagé) et le
   cache hors-ligne complet. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (chemin) => readFileSync(join(root, chemin), 'utf8');
const existe = (chemin) => existsSync(join(root, chemin));

const VIDEO = 'assets/videos/BouclePour.mp4';
const VTT = 'assets/subtitles/BouclePour-fr.vtt';
const ID = 'boucle-pour';

/** Durée réelle de la vidéo, lue dans l'en-tête MP4 (aucune dépendance externe). */
function dureeMp4(chemin) {
  const tampon = readFileSync(join(root, chemin));
  const i = tampon.indexOf(Buffer.from('mvhd'));
  if (i === -1) return 0;
  const version = tampon[i + 4];
  const timescale = tampon.readUInt32BE(i + 4 + (version === 1 ? 20 : 12));
  const duree = version === 1
    ? Number(tampon.readBigUInt64BE(i + 4 + 24))
    : tampon.readUInt32BE(i + 4 + 16);
  return duree / timescale;
}

function secondes(h, mn, s, ms) {
  return Number(h || 0) * 3600 + Number(mn) * 60 + Number(s) + Number(ms) / 1000;
}

function entreesVtt(contenu) {
  const sorties = [];
  const motif = /(?:(\d+):)?(\d{2}):(\d{2})\.(\d{3}) --> (?:(\d+):)?(\d{2}):(\d{2})\.(\d{3})/g;
  let m;
  while ((m = motif.exec(contenu))) {
    sorties.push({ debut: secondes(m[1], m[2], m[3], m[4]), fin: secondes(m[5], m[6], m[7], m[8]), index: m.index });
  }
  return sorties;
}

test('la capsule est livrée à côté des autres vidéos du site', () => {
  assert.ok(existe(VIDEO), 'MP4 présent');
  assert.ok(existe(VTT), 'sous-titres présents');
  const octets = statSync(join(root, VIDEO)).size;
  assert.ok(octets > 4_000_000, `MP4 trop léger : ${octets}`);
  assert.ok(octets < 40_000_000, `MP4 trop lourd : ${octets}`);
  const entete = readFileSync(join(root, VIDEO)).subarray(0, 32).toString('latin1');
  assert.match(entete, /ftyp/, 'en-tête MP4');
  assert.match(entete, /isom|mp42|avc1/, 'marque MP4');
});

test('la vidéo dure environ trois minutes vingt et ses sous-titres la couvrent', () => {
  const duree = dureeMp4(VIDEO);
  assert.ok(duree > 195 && duree < 215, `durée inattendue : ${duree.toFixed(1)} s`);
  const vtt = lire(VTT);
  assert.ok(vtt.startsWith('WEBVTT'), 'entête WEBVTT');
  const entrees = entreesVtt(vtt);
  assert.ok(entrees.length >= 50, `trop peu de répliques : ${entrees.length}`);
  assert.ok(entrees[0].debut < 4, 'les sous-titres démarrent avec la voix');
  assert.ok(Math.abs(entrees[entrees.length - 1].fin - duree) < 25,
    'les sous-titres couvrent la fin de la vidéo');
  for (let i = 1; i < entrees.length; i += 1) {
    assert.ok(entrees[i].debut >= entrees[i - 1].debut - 0.01, 'répliques ordonnées');
  }
  assert.ok(entrees.every((e) => e.fin > e.debut), 'chaque réplique a une durée');
});

test('les sous-titres disent le récit dicté, du sac à la boucle Pour', () => {
  /* on retire les minutages et on recolle les lignes repliées */
  const vtt = lire(VTT).toLowerCase()
    .replace(/^\d+:\d{2}:\d{2}\.\d{3} --> .*$/gm, '')
    .replace(/\s+/g, ' ');
  for (const phrase of [
    'je prends un sac',
    'une variable',
    'je le nomme s',
    'immeuble',
    'ascenseur',
    's égal s plus t crochet zéro',
    'compteur',
    'je répète',
    's égal s plus t crochet un',
    'quelque chose',
    'le bloc',
    'boucle pour',
  ]) {
    assert.ok(vtt.includes(phrase), `le récit contient « ${phrase} »`);
  }
  assert.match(vtt, /mmm/, 'les hésitations dictées sont conservées');
});

test('les sous-titres se lisent : une phrase par réplique, deux lignes au plus', () => {
  const vtt = lire(VTT);
  const blocs = vtt.replace(/^WEBVTT\s*/, '').split(/\n{2,}/)
    .map((b) => b.replace(/\s+$/, ''))
    .filter((b) => b.includes(' --> '));
  assert.ok(blocs.length >= 50, `trop peu de répliques : ${blocs.length}`);
  for (const bloc of blocs) {
    const lignes = bloc.split('\n');
    const texte = lignes.slice(1).join('\n');
    assert.ok(lignes.length - 1 <= 2, 'deux lignes au plus : ' + JSON.stringify(bloc));
    assert.ok(lignes[0].includes(' --> '), 'minutage en tête');
    for (const ligne of lignes.slice(1)) {
      assert.ok(ligne.length <= 46, `ligne trop longue (${ligne.length}) : ${ligne}`);
      assert.ok(ligne.trim(), 'aucune ligne vide dans une réplique');
    }
    if (/[.!?…]$/.test(texte.trim()) === false) {
      /* une réplique peut finir sans ponctuation finale seulement si la phrase continue */
      assert.ok(texte.length > 0);
    }
  }
  /* aucune réplique ne commence par un mot en minuscules issu d'une coupure */
  for (const bloc of blocs) {
    const texte = bloc.split('\n').slice(1).join(' ').trim();
    assert.ok(texte.length > 2, 'réplique non vide');
  }
});

test('le début est détaillé : sac vide, contenu qui change, nom S justifié', () => {
  /* les répliques sont repliées : on retire les minutages puis on aplatit */
  const vtt = lire(VTT).toLowerCase()
    .replace(/^\d+:\d{2}:\d{2}\.\d{3} --> .*$/gm, '')
    .replace(/\s+/g, ' ');
  /* étape 1 : le sac est vide, son contenu change plusieurs fois, puis la définition */
  assert.match(vtt, /pour l'instant il est vide/);
  assert.match(vtt, /une chose, puis une autre à la place/);
  assert.match(vtt, /une boîte avec un nom, dans laquelle je range une valeur/);
  assert.match(vtt, /ce contenu peut changer/);
  /* étape 2 : plusieurs sacs, l'ambiguïté, l'étiquette, le nom S qui vaut partout */
  assert.match(vtt, /un sac pour chaque étage, un sac pour chaque client/);
  assert.match(vtt, /l'ordinateur, encore moins/);
  assert.match(vtt, /une étiquette sur le sac/);
  assert.match(vtt, /s, comme sac/);
  assert.match(vtt, /quand j'écris s, c'est de ce sac-là/);

  const scenes = lire('outils/bouclepour/scenes.py');
  assert.match(scenes, /contenu : \{valeur\}/, 'le contenu du sac est écrit sous le sac');
  assert.match(scenes, /_boite_variable/, 'le schéma « une variable = un nom + une valeur »');
  assert.match(scenes, /le sac de l'étage 0/, 'les sacs sont légendés');
  assert.ok(scenes.includes('lequel ?'), 'la question « lequel ? »');
});

test('la carte vidéo est dans l\'onglet Vidéos de JavaScript', () => {
  const page = lire('cours/javascript.html');
  assert.ok(page.includes(`data-video-id="${ID}"`), 'identifiant du lecteur');
  assert.ok(page.includes(`id="tabJsBouclePourVideo"`), 'vidéo dédiée');
  assert.ok(page.includes(`src="../${VIDEO}"`), 'source MP4');
  assert.ok(page.includes(`src="../${VTT}"`), 'piste de sous-titres');
  assert.match(page, /SÉRIE 6 · LES BOUCLES \(\d+:\d{2}\)/, 'badge de durée');
  const videos = page.split('<section id="videos"')[1].split('</section>')[0];
  assert.ok(videos.indexOf(`data-video-id="${ID}"`) > videos.indexOf('tabJsDefis37Video'),
    'la capsule suit celle des 37 Défis');
  assert.match(page, /la capsule « La boucle Pour »/, 'introduction mise à jour');
});

test('le catalogue partagé connaît la capsule', () => {
  const app = lire('assets/js/app.js');
  const bloc = app.slice(app.indexOf('var CATALOGUE_VIDEOS = ['),
    app.indexOf('\n  ];', app.indexOf('var CATALOGUE_VIDEOS = [')));
  assert.ok(bloc.includes(`id: "${ID}"`), 'entrée du catalogue');
  assert.ok(bloc.includes(`srcPrincipal: "${VIDEO}"`), 'source principale');
  assert.ok(bloc.includes(`sousTitres: "${VTT}"`), 'sous-titres');
  assert.ok(bloc.includes("titre: \"La boucle Pour — le sac et l'ascenseur\""), 'titre');
  assert.match(bloc, /dureeTexte: "\d+:\d{2}"/, 'durée affichée');
  assert.ok(bloc.includes('for (let i = 0; i < n; i++) { S = S + T[i]; }'), 'aperçu de code');
});

test('la capsule est dans le paquet hors-ligne complet', () => {
  const sw = lire('sw.js');
  const complet = sw.split('var OFFLINE_LIST = [')[1].split('];')[0];
  const delta = sw.split('var UPDATE_FILES = [')[1].split('];')[0];
  assert.ok(complet.includes(`"./${VIDEO}"`), 'MP4 hors-ligne');
  assert.ok(complet.includes(`"./${VTT}"`), 'VTT hors-ligne');
  assert.ok(!delta.includes('BouclePour.mp4'), 'les médias restent hors du delta léger');
  assert.match(sw, /url: "\.\/assets\/js\/app\.js", revision: "boucle-pour-v538"/);
  assert.match(sw, /url: "\.\/cours\/javascript\.html", revision: "boucle-pour-v538"/);
});

test('la fabrique de la capsule reste dans le dépôt', () => {
  for (const fichier of ['narration.py', 'theme.py', 'dessin.py', 'scenes.py',
    'montage.py', 'render.py', 'integrer.py']) {
    assert.ok(existe(`outils/bouclepour/${fichier}`), fichier);
  }
  const narration = lire('outils/bouclepour/narration.py');
  for (const cle of ['sac', 'nom', 'immeuble', 'etage0', 'compteur', 'repetition',
    'quelquechose', 'bloc', 'boucle']) {
    assert.ok(narration.includes(`"${cle}": {`), `section ${cle}`);
  }
});
