/* v541 — capsule « La boucle Pour — de la variable à la boucle » (JavaScript).
   Contrôle la vidéo livrée, ses sous-titres français, le récit en onze étapes
   sur trois colonnes (l'immeuble · le brouillon · l'algo/code) avec le stylo
   rouge, l'intégration dans le site (carte vidéo, catalogue, lecteur partagé)
   et le cache hors-ligne complet. */
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
const TITRE = "La boucle Pour — de la variable à la boucle";

/** Le texte des sous-titres, minutages retirés et lignes repliées. */
function textePlat() {
  return lire(VTT).toLowerCase()
    .replace(/^\d+:\d{2}:\d{2}\.\d{3} --> .*$/gm, '')
    .replace(/\s+/g, ' ');
}

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

test('la vidéo dure environ six minutes et ses sous-titres la couvrent', () => {
  const duree = dureeMp4(VIDEO);
  assert.ok(duree > 325 && duree < 365, `durée inattendue : ${duree.toFixed(1)} s`);
  const vtt = lire(VTT);
  assert.ok(vtt.startsWith('WEBVTT'), 'entête WEBVTT');
  const entrees = entreesVtt(vtt);
  assert.ok(entrees.length >= 90, `trop peu de répliques : ${entrees.length}`);
  assert.ok(entrees[0].debut < 4, 'les sous-titres démarrent avec la voix');
  assert.ok(Math.abs(entrees[entrees.length - 1].fin - duree) < 25,
    'les sous-titres couvrent la fin de la vidéo');
  for (let i = 1; i < entrees.length; i += 1) {
    assert.ok(entrees[i].debut >= entrees[i - 1].debut - 0.01, 'répliques ordonnées');
  }
  assert.ok(entrees.every((e) => e.fin > e.debut), 'chaque réplique a une durée');
});

test('les sous-titres suivent le cheminement brouillon → algo → stylo rouge', () => {
  const vtt = textePlat();
  for (const phrase of [
    'mon plan de travail',
    'au milieu, mon brouillon',
    "c'est un tableau",
    "je l'appelle t",
    'la somme de ces quatre nombres',
    'une case mémoire',
    'un sac, si vous voulez',
    'une boîte, avec un nom, et une valeur dedans',
    'le nom reste, la valeur bouge',
    'beaucoup de sacs',
    "il s'appelle s",
    's égal s plus quelque chose',
    "le s de droite, c'est l'ancienne valeur",
    'ascenseur',
    's égal s plus t crochet zéro',
    'quatre fois la même chose',
    'seul le chiffre entre les crochets a changé',
    "je n'écris plus de chiffre : j'écris quelque chose",
    'stylo rouge',
    "qui la fait monter ? le compteur de l'ascenseur",
    'il y a une boucle, et il y a un compteur',
    'est-ce que je connais, dès le départ, le nombre de répétitions',
    'pour compteur de zéro à n moins un',
    "pourquoi j'écris compteur dans les crochets",
    'vingt-deux',
    'une boucle pour le répéter',
  ]) {
    assert.ok(vtt.includes(phrase), `le récit contient « ${phrase} »`);
  }
});

test('les sous-titres se lisent : une phrase par réplique, deux lignes au plus', () => {
  const vtt = lire(VTT);
  const blocs = vtt.replace(/^WEBVTT\s*/, '').split(/\n{2,}/)
    .map((b) => b.replace(/\s+$/, ''))
    .filter((b) => b.includes(' --> '));
  assert.ok(blocs.length >= 85, `trop peu de répliques : ${blocs.length}`);
  for (const bloc of blocs) {
    const lignes = bloc.split('\n');
    assert.ok(lignes.length - 1 <= 2, 'deux lignes au plus : ' + JSON.stringify(bloc));
    assert.ok(lignes[0].includes(' --> '), 'minutage en tête');
    for (const ligne of lignes.slice(1)) {
      assert.ok(ligne.length <= 46, `ligne trop longue (${ligne.length}) : ${ligne}`);
      assert.ok(ligne.trim(), 'aucune ligne vide dans une réplique');
    }
  }
});

test('le récit va de la variable à la boucle, avec la question principale', () => {
  const vtt = textePlat();

  /* la variable : le sac vide, le contenu qui change, le nom fixe */
  assert.match(vtt, /au début, mon sac est vide/);
  assert.match(vtt, /maintenant, j'y mets quatre/);
  assert.match(vtt, /je retire quatre, je mets sept/);
  assert.match(vtt, /un contenu qu'on peut lire/);
  assert.match(vtt, /le nom reste, la valeur bouge/);

  /* l'affectation : lire, ajouter, réécrire */
  assert.match(vtt, /je lis s, qui vaut quatre/);
  assert.match(vtt, /le nouveau contenu, c'est l'ancien contenu/);
  assert.match(vtt, /le s de droite, c'est l'ancienne valeur/);

  /* le brouillon, puis le passage à l'algo */
  assert.match(vtt, /je prends mon brouillon, et je note le premier tour/);
  assert.match(vtt, /s égal s plus t crochet quelque chose/);
  assert.match(vtt, /cette même ligne s'écrit : s égal s plus t crochet i/);

  /* le stylo rouge, puis la question principale */
  assert.match(vtt, /cette fois, avec le stylo rouge/);
  assert.match(vtt, /alors j'écris en rouge : compteur/);
  assert.match(vtt, /exactement comme le pas du compteur/);
  assert.match(vtt, /je dois compléter la fin/);
  assert.match(vtt, /c'est exactement ça, la boucle pour/);

  /* la fabrique : les figures qui portent ces idées */
  const scenes = lire('outils/bouclepour/scenes.py');
  const dessin = lire('outils/bouclepour/dessin.py');
  assert.match(dessin, /VALEURS = \(4, 7, 2, 9\)/, 'les étages valent 4, 7, 2 et 9');
  assert.match(dessin, /SOMME_TOTALE = sum\(VALEURS\)/, 'la somme 22 est calculée');
  assert.match(dessin, /def bandeau_etat\(/, 'le bandeau du bas suit tableau + somme');
  assert.match(dessin, /PAPIER = \(/, 'le papier du brouillon');
  assert.match(dessin, /def papier_brouillon\(/, 'la feuille réglée du brouillon');
  assert.match(dessin, /def crayon\(/, 'l\'écriture au crayon');
  assert.match(dessin, /def stylo_cercle\(/, 'les cercles au stylo rouge');
  assert.match(dessin, /def stylo_note\(/, 'les annotations au stylo rouge');
  assert.match(dessin, /def boite_memoire\(/, 'la figure de la variable');
  assert.match(scenes, /def scene_probleme\(/, 'la scène d\'ouverture existe');
  assert.match(scenes, /def scene_variable\(/, 'la scène de la variable existe');
  assert.match(scenes, /def scene_quelquechose\(/, 'la scène du passage à l\'algo');
  assert.match(scenes, /def scene_compteur\(/, 'la scène du stylo rouge');
  assert.match(scenes, /def scene_pourquoi\(/, 'la question principale');
  assert.match(scenes, /TOTAL = 11/, 'la capsule compte onze étapes');
  assert.ok(scenes.includes('combien de répétitions ?'), 'la question principale est affichée');
  assert.ok(scenes.includes('compteur'), 'le mot « compteur » est écrit au brouillon');
});

test('le cheminement est inscrit dans la fabrication (11 sections)', () => {
  const narration = lire('outils/bouclepour/narration.py');
  const ordre = ['probleme', 'variable', 'nom', 'accumuler', 'immeuble', 'etage0',
    'repetition', 'quelquechose', 'compteur', 'pourquoi', 'boucle'];
  const trouve = [...narration.matchAll(/"([a-z0-9]+)": \{/g)].map((m) => m[1]);
  assert.deepEqual(trouve, ordre, 'l\'ordre des onze sections');
  /* les onze clips de voix sont livrés avec la fabrique */
  for (const cle of ordre) {
    assert.ok(existe(`outils/bouclepour/voix/${cle}.mp3`), `clip ${cle}`);
  }
  const calage = JSON.parse(lire('outils/bouclepour/calage.json'));
  assert.deepEqual(Object.keys(calage.debuts), ordre, 'calage de la voix');
  assert.ok(calage.total > 325 && calage.total < 365, `total inattendu : ${calage.total}`);
  for (let i = 1; i < ordre.length; i += 1) {
    const precedente = calage.debuts[ordre[i - 1]] + calage.durees[ordre[i - 1]];
    assert.ok(calage.debuts[ordre[i]] > precedente, `section ${ordre[i]} après la précédente`);
  }
});

test('la capsule se lance depuis la grille de l\'accueil', () => {
  const app = lire('assets/js/app.js');
  const protection = lire('assets/js/protection.js');
  const lecteur = lire('assets/js/lecteur-commun.js');

  /* la carte de la grille porte l'identifiant du catalogue */
  assert.match(app, /function ouvrirModaleVideo\(idVideo, tempsDepart\)/);
  assert.ok(app.includes('global.ouvrirVideoPasAPasSTI(meta.id, meta.titre'),
    'la grille passe l\'identifiant au lecteur commun');

  /* le lecteur de la modale doit reconnaître la capsule, sinon il sort sans rien ouvrir */
  assert.match(protection, /var estBouclePour = \(sSlug === "boucle-pour"/);
  assert.ok(protection.includes('!estDefis37 && !estBouclePour) {'),
    'le garde-fou du lecteur laisse passer la capsule');
  assert.ok(protection.includes('var slugCible = estBouclePour ? "boucle-pour"'),
    'le slug de la capsule est transmis');
  assert.ok(protection.includes('videos/BouclePour.mp4'),
    'le lecteur ouvre bien le fichier de la capsule');
  assert.ok(protection.includes('🎥 La boucle Pour — de la variable à la boucle'),
    'le titre affiché dans la modale');

  /* les sous-titres suivent la vidéo dans la modale */
  assert.ok(protection.includes('subtitles/BouclePour-fr.vtt'),
    'les sous-titres sont attachés au lecteur de la grille');

  /* les onze repères de chapitre, calés sur la voix off */
  const chapitres = protection.slice(protection.indexOf('STI_CHAPITRES_MEDIA["boucle-pour"]'),
    protection.indexOf('STI_CHAPITRES_MEDIA["validation-nom-prenom-js"]'));
  assert.equal((chapitres.match(/\{ t:/g) || []).length, 11, 'onze chapitres');
  assert.ok(chapitres.includes('4:58 · 11 · La boucle Pour : le bloc'), 'dernier repère');

  /* la reprise de lecture sait à quelle matière et quel titre rattacher la capsule */
  assert.ok(lecteur.includes("'boucle-pour': ['javascript','La boucle Pour — de la variable à la boucle']"),
    'la capsule est connue du lecteur commun');

  /* exécution réelle : le slug de la capsule traverse la garde du lecteur */
  const debut = protection.indexOf('        var estTpEvenements =');
  const fin = protection.indexOf('        /* Couper immédiatement toute voix', debut);
  assert.ok(debut > 0 && fin > debut, 'bloc des slugs repérable');
  const bloc = protection.slice(debut, fin);
  const fonction = new Function(
    'sSlug', 'estPageHtml5', 'estPageCss3', 'estPageJs', 'estPagePhpCours',
    'estPageSql', 'estPageCssDeco', 'estPageCssPos', 'estPageGuichet',
    bloc.replace('return;', 'return true;') + '\nreturn false;');
  const traverse = (slug) => fonction(slug, false, false, false, false, false, false, false, false);
  assert.equal(traverse('boucle-pour'), false, 'la capsule ouvre le lecteur');
  assert.equal(traverse('BouclePour.mp4'), false, 'le nom du fichier aussi');
  assert.equal(traverse('tp-train-serie6'), false, 'le TP Train continue de fonctionner');
  assert.equal(traverse('defis37-tableau-aleas-media'), false, 'les 37 Défis continuent');
  assert.equal(traverse('slug-inconnu'), true, 'un slug inconnu reste refusé');

  /* le service worker sert la nouvelle version du lecteur */
  const sw = lire('sw.js');
  assert.match(sw, /url: "\.\/assets\/js\/protection\.js", revision: "boucle-grille-v542"/);
  assert.match(sw, /url: "\.\/assets\/js\/lecteur-commun\.js", revision: "boucle-grille-v542"/);
});

test('la carte vidéo est dans l\'onglet Vidéos de JavaScript', () => {
  const page = lire('cours/javascript.html');
  assert.ok(page.includes(`data-video-id="${ID}"`), 'identifiant du lecteur');
  assert.ok(page.includes('id="tabJsBouclePourVideo"'), 'vidéo dédiée');
  assert.ok(page.includes(`src="../${VIDEO}"`), 'source MP4');
  assert.ok(page.includes(`src="../${VTT}"`), 'piste de sous-titres');
  assert.match(page, /SÉRIE 6 · LES BOUCLES \(\d+:\d{2}\)/, 'badge de durée');
  const videos = page.split('<section id="videos"')[1].split('</section>')[0];
  assert.ok(videos.indexOf(`data-video-id="${ID}"`) > videos.indexOf('tabJsDefis37Video'),
    'la capsule suit celle des 37 Défis');
  assert.ok(page.includes(TITRE), 'le titre');
  assert.match(page, /la capsule « La boucle Pour »/, 'introduction de la carte');
});

test('le catalogue partagé connaît la capsule', () => {
  const app = lire('assets/js/app.js');
  const bloc = app.slice(app.indexOf('var CATALOGUE_VIDEOS = ['),
    app.indexOf('\n  ];', app.indexOf('var CATALOGUE_VIDEOS = [')));
  assert.ok(bloc.includes(`id: "${ID}"`), 'entrée du catalogue');
  assert.ok(bloc.includes(`srcPrincipal: "${VIDEO}"`), 'source principale');
  assert.ok(bloc.includes(`sousTitres: "${VTT}"`), 'sous-titres');
  assert.ok(bloc.includes(`titre: "${TITRE}"`), 'titre');
  assert.match(bloc, /dureeTexte: "5:41"/, 'durée affichée');
  assert.ok(bloc.includes('for (let i = 0; i < n; i++) { S = S + T[i]; }'), 'aperçu de code');
});

test('la capsule est dans le paquet hors-ligne complet', () => {
  const sw = lire('sw.js');
  const complet = sw.split('var OFFLINE_LIST = [')[1].split('];')[0];
  const delta = sw.split('var UPDATE_FILES = [')[1].split('];')[0];
  assert.ok(complet.includes(`"./${VIDEO}"`), 'MP4 hors-ligne');
  assert.ok(complet.includes(`"./${VTT}"`), 'VTT hors-ligne');
  assert.ok(!delta.includes('BouclePour.mp4'), 'les médias restent hors du delta léger');
  assert.match(sw, /var UPDATE_ID = "v542-boucle-pour-grille-20261030";/);
  assert.match(sw, /url: "\.\/assets\/js\/app\.js", revision: "boucle-pour-v541"/);
  assert.match(sw, /url: "\.\/cours\/javascript\.html", revision: "boucle-pour-v541"/);
});

test('la fabrique de la capsule reste dans le dépôt', () => {
  for (const fichier of ['narration.py', 'theme.py', 'dessin.py', 'scenes.py',
    'montage.py', 'render.py', 'integrer.py']) {
    assert.ok(existe(`outils/bouclepour/${fichier}`), fichier);
  }
  const scenes = lire('outils/bouclepour/scenes.py');
  for (const cle of ['probleme', 'variable', 'nom', 'accumuler', 'immeuble', 'etage0',
    'repetition', 'quelquechose', 'compteur', 'pourquoi', 'boucle']) {
    assert.ok(scenes.includes(`"${cle}": scene_`), `scène ${cle}`);
  }
  const dessin = lire('outils/bouclepour/dessin.py');
  assert.match(dessin, /PANEL_M = \(670, 186, 1250, 884\)/, 'la colonne du brouillon');
  assert.match(dessin, /PANEL_D = \(1276, 186, 1856, 884\)/, 'la colonne algo · code');
  assert.match(dessin, /def immeuble\(/, 'l\'immeuble et son ascenseur');
  assert.match(dessin, /def sac\(/, 'le sac, la case mémoire');
});
