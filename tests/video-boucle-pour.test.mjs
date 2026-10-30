/* v543 — capsule « Les boucles — Pour, Répéter…jusqu'à, Tant que » (JavaScript).
   Contrôle la vidéo livrée, ses sous-titres français, les vingt-six étapes du
   récit (décor · brouillon · schéma de décision · tableau des trois boucles)
   avec l'algorithme et le JavaScript dans deux cadres séparés, l'intégration
   dans le site (carte vidéo, catalogue, lecteur partagé, chapitres) et le
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
const TITRE = "Les boucles — Pour, Répéter…jusqu'à, Tant que";

/** Les vingt-six sections de la capsule, dans l'ordre de la voix off. */
const ORDRE = [
  'bienvenue', 'probleme', 'repetition', 'q1', 'q2', 'q3',
  'pour_algo', 'pour_js', 'pour_trace', 'rappel1',
  'chercher_quoi', 'chercher_q', 'repet_algo', 'repet_js',
  'repet_trouve', 'repet_absent', 'rappel2',
  'tantque_quoi', 'tantque_algo', 'tantque_js', 'tantque_trace', 'rappel3',
  'tableau3', 'choisir', 'algo_js', 'fin',
];

/** Le texte des sous-titres, minutages retirés et lignes repliées. */
function textePlat() {
  return lire(VTT).toLowerCase()
    .replace(/^webvtt\s*/, '')
    .replace(/^\d+:\d{2}:\d{2}\.\d{3} --> .*$/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
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
  assert.ok(octets < 60_000_000, `MP4 trop lourd : ${octets}`);
  const entete = readFileSync(join(root, VIDEO)).subarray(0, 32).toString('latin1');
  assert.match(entete, /ftyp/, 'en-tête MP4');
  assert.match(entete, /isom|mp42|avc1/, 'marque MP4');
});

test('la vidéo dure environ neuf minutes et ses sous-titres la couvrent', () => {
  const duree = dureeMp4(VIDEO);
  assert.ok(duree > 470 && duree < 600, `durée inattendue : ${duree.toFixed(1)} s`);
  const vtt = lire(VTT);
  assert.ok(vtt.startsWith('WEBVTT'), 'entête WEBVTT');
  const entrees = entreesVtt(vtt);
  assert.ok(entrees.length >= 140, `trop peu de répliques : ${entrees.length}`);
  assert.ok(entrees[0].debut < 4, 'les sous-titres démarrent avec la voix');
  assert.ok(Math.abs(entrees[entrees.length - 1].fin - duree) < 30,
    'les sous-titres couvrent la fin de la vidéo');
  for (let i = 1; i < entrees.length; i += 1) {
    assert.ok(entrees[i].debut >= entrees[i - 1].debut - 0.01, 'répliques ordonnées');
  }
  assert.ok(entrees.every((e) => e.fin > e.debut), 'chaque réplique a une durée');
});

test("l'ouverture reprend la phrase imposée, mot pour mot", () => {
  const vtt = textePlat();
  assert.ok(vtt.includes('bienvenue dans sti version 2.0'),
    'la première phrase salue STI Version 2.0');
  assert.ok(vtt.includes("aujourd'hui, on va détailler encore une autre fois l'histoire des boucles"),
    "la deuxième phrase est celle de la demande");
  assert.ok(vtt.trimStart().startsWith('bienvenue'), "l'ouverture arrive en premier");
});

test('le schéma de décision pose les trois questions, dans l\'ordre', () => {
  const vtt = textePlat();
  const q1 = vtt.indexOf('est-ce que je connais le nombre de répétitions à l\'avance');
  const q2 = vtt.indexOf("est-ce qu'il y a une condition d'arrêt");
  const q3 = vtt.indexOf('combien de fois, au moins, je répète');
  assert.ok(q1 > 0, 'première question');
  assert.ok(q2 > q1, 'deuxième question, après la première');
  assert.ok(q3 > 0, 'troisième question');
  assert.ok(vtt.includes('le schéma complet'), 'le schéma est refermé explicitement');
  assert.ok(vtt.includes('poser les questions, dans l\'ordre'), 'la méthode est énoncée');

  const dessin = lire('outils/bouclepour/dessin.py');
  assert.match(dessin, /def schema_arbre\(/, 'le schéma de décision est une figure');
  assert.match(dessin, /def tableau_boucles\(/, 'le tableau des trois boucles aussi');
  assert.match(dessin, /ACCENTS_BOUCLES = \{"pour": AMBRE, "repeter": VIOLET, "tantque": VERT\}/);
  const scenes = lire('outils/bouclepour/scenes.py');
  assert.match(scenes, /ALGO_BOX/, 'le cadre de l\'algorithme');
  assert.match(scenes, /JS_BOX/, 'le cadre du JavaScript');
  assert.ok(scenes.indexOf('ALGO_BOX') !== scenes.indexOf('JS_BOX'), 'deux cadres distincts');
});

test('les trois boucles sont racontées, chacune avec son exemple', () => {
  const vtt = textePlat();

  /* POUR : la somme des étages, de la position initiale à la position finale */
  assert.match(vtt, /quatre étages, avec quatre nombres/);
  assert.match(vtt, /s égal s plus t crochet compteur/);
  assert.match(vtt, /le compteur démarre à la position initiale, zéro/);
  assert.match(vtt, /il s'arrête à la position finale, trois/);
  assert.match(vtt, /vingt-deux/);
  assert.match(vtt, /for, entre parenthèses, let i égal zéro/);

  /* RÉPÉTER…JUSQU'À : chercher X, présent puis absent */
  assert.match(vtt, /je cherche une valeur x dans le tableau/);
  assert.match(vtt, /répéter : prendre la valeur t crochet i/);
  assert.match(vtt, /trouvé au deuxième tour|la condition d'arrêt a fait son travail/);
  assert.match(vtt, /cherchons cinq/);
  assert.match(vtt, /le résultat, c'est : absent/);
  assert.match(vtt, /do, entre accolades, le corps/);
  assert.match(vtt, /while, entre parenthèses : trouvé est faux, et i inférieur à quatre/);

  /* TANT QUE : la boîte de jetons, trois tours ou zéro */
  assert.match(vtt, /une boîte de jetons/);
  assert.match(vtt, /la boîte vide/);
  assert.match(vtt, /si la boîte est vide au départ, je ne fais aucun tour/);
  assert.match(vtt, /zéro tour/);
  assert.match(vtt, /while, entre parenthèses, jetons supérieur à zéro/);
});

test('chaque étape rappelle le tableau des trois boucles et le schéma', () => {
  const vtt = textePlat();
  assert.ok(vtt.includes('rappel : trois boucles, un seul schéma'), 'rappel après la boucle POUR');
  assert.ok(vtt.includes('rappel. répéter jusqu\'à'), 'rappel après répéter…jusqu\'à');
  assert.ok(vtt.includes('rappel. tant que'), 'rappel après tant que');
  assert.ok(vtt.includes('le tableau des trois boucles'), 'le tableau est nommé');
  assert.ok(vtt.includes('trois boucles, trois situations'), 'la synthèse');
  const scenes = lire('outils/bouclepour/scenes.py');
  for (const cle of ['rappel1', 'rappel2', 'rappel3']) {
    assert.match(scenes, new RegExp(`def scene_${cle}\\(`), `la scène ${cle} existe`);
  }
  assert.match(scenes, /tableau_boucles\(/, 'le tableau est rappelé à l\'écran');
});

test("l'algorithme et le JavaScript ne sont jamais mélangés", () => {
  const vtt = textePlat();
  assert.ok(vtt.includes('ne mélangez pas les deux écritures'),
    'la consigne est dite explicitement');
  assert.ok(vtt.includes("à droite, en haut, l'algorithme"), "le cadre de l'algorithme");
  assert.ok(vtt.includes('en bas, le javascript : for, do while, while'),
    'le cadre du JavaScript');
  assert.ok(vtt.includes('on écrit l\'algorithme d\'abord, on le traduit ensuite'),
    'l\'ordre de travail');

  const scenes = lire('outils/bouclepour/scenes.py');
  assert.match(scenes, /def _cadre_ecriture\(/, 'un seul dessinateur de cadre');
  assert.match(scenes, /"l'ALGORITHME"/, 'cadre 1 : l\'algorithme');
  assert.match(scenes, /"le JAVASCRIPT"/, 'cadre 2 : le JavaScript');
  assert.match(scenes, /ALGO_POUR = \[/, 'l\'algorithme de POUR');
  assert.match(scenes, /JS_POUR = \[/, 'le JavaScript de POUR');
  assert.match(scenes, /ALGO_REP = \[/, 'l\'algorithme de RÉPÉTER');
  assert.match(scenes, /JS_REP = \[/, 'le JavaScript de RÉPÉTER');
  assert.match(scenes, /ALGO_TQ = \[/, 'l\'algorithme de TANT QUE');
  assert.match(scenes, /JS_TQ = \[/, 'le JavaScript de TANT QUE');
});

test('les trois blocs finissent côte à côte, chacun avec ses deux écritures', () => {
  const scenes = lire('outils/bouclepour/scenes.py');
  assert.match(scenes, /def _colonne_fin\(/, 'une colonne par boucle');
  const fin = scenes.slice(scenes.indexOf('def scene_fin('));
  for (const cle of ['"POUR"', '"RÉPÉTER…JUSQU\'À"', '"TANT QUE"']) {
    assert.ok(fin.includes(cle), `la colonne ${cle}`);
  }
  assert.equal((fin.match(/_colonne_fin\(d, /g) || []).length, 3, 'trois colonnes');
  const vtt = textePlat();
  assert.ok(vtt.includes('trois boucles, un schéma'), 'la conclusion');
});

test('la fabrication compte vingt-six sections, de la voix aux scènes', () => {
  const narration = lire('outils/bouclepour/narration.py');
  const trouve = [...narration.matchAll(/"([a-z0-9_]+)": \{/g)].map((m) => m[1]);
  assert.deepEqual(trouve, ORDRE, 'l\'ordre des vingt-six sections');

  const scenes = lire('outils/bouclepour/scenes.py');
  assert.match(scenes, /TOTAL = 26/, 'la capsule compte vingt-six étapes');
  const dispatch = [...scenes.matchAll(/^    "([a-z0-9_]+)": scene_/gm)].map((m) => m[1]);
  assert.deepEqual(dispatch, ORDRE, 'une scène par section, dans l\'ordre');

  for (const cle of ORDRE) {
    assert.ok(existe(`outils/bouclepour/voix/${cle}.mp3`), `clip ${cle}`);
  }
  const calage = JSON.parse(lire('outils/bouclepour/calage.json'));
  assert.deepEqual(Object.keys(calage.debuts), ORDRE, 'calage de la voix');
  assert.deepEqual(Object.keys(calage.durees), ORDRE, 'durées de la voix');
  assert.ok(calage.total > 470 && calage.total < 600, `total inattendu : ${calage.total}`);
  for (let i = 1; i < ORDRE.length; i += 1) {
    const precedente = calage.debuts[ORDRE[i - 1]] + calage.durees[ORDRE[i - 1]];
    assert.ok(calage.debuts[ORDRE[i]] > precedente, `section ${ORDRE[i]} après la précédente`);
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
  assert.ok(protection.includes('🎥 Les boucles — Pour, Répéter…jusqu\'à, Tant que'),
    'le titre affiché dans la modale');

  /* les sous-titres suivent la vidéo dans la modale */
  assert.ok(protection.includes('subtitles/BouclePour-fr.vtt'),
    'les sous-titres sont attachés au lecteur de la grille');

  /* un repère de chapitre par section, calé sur la voix off */
  const chapitres = protection.slice(protection.indexOf('STI_CHAPITRES_MEDIA["boucle-pour"]'),
    protection.indexOf('STI_CHAPITRES_MEDIA["validation-nom-prenom-js"]'));
  assert.equal((chapitres.match(/\{ t:/g) || []).length, 26, 'vingt-six chapitres');
  assert.ok(chapitres.includes('1 · Bienvenue'), 'premier repère');
  assert.ok(chapitres.includes('26 · À vous de jouer'), 'dernier repère');

  /* la reprise de lecture sait à quelle matière et quel titre rattacher la capsule */
  assert.ok(lecteur.includes("'boucle-pour': ['javascript','Les boucles — Pour, Répéter…jusqu'à, Tant que']"),
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
  assert.match(sw, /url: "\.\/assets\/js\/protection\.js", revision: "boucles-v543"/);
  assert.match(sw, /url: "\.\/assets\/js\/lecteur-commun\.js", revision: "boucles-v543"/);
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
  assert.match(page, /la capsule « Les boucles »/, 'introduction de la carte');
  assert.match(page, /RÉPÉTER…JUSQU'À/, 'la carte annonce les trois boucles');
});

test('le catalogue partagé connaît la capsule', () => {
  const app = lire('assets/js/app.js');
  const bloc = app.slice(app.indexOf('var CATALOGUE_VIDEOS = ['),
    app.indexOf('\n  ];', app.indexOf('var CATALOGUE_VIDEOS = [')));
  assert.ok(bloc.includes(`id: "${ID}"`), 'entrée du catalogue');
  assert.ok(bloc.includes(`srcPrincipal: "${VIDEO}"`), 'source principale');
  assert.ok(bloc.includes(`sousTitres: "${VTT}"`), 'sous-titres');
  assert.ok(bloc.includes(`titre: "${TITRE}"`), 'titre');
  assert.match(bloc, /dureeTexte: "\d+:\d{2}"/, 'durée affichée');
  assert.ok(bloc.includes('for (let i = 0; i <= 3; i++) { S = S + T[i]; }'), 'aperçu de code');
});

test('la capsule est dans le paquet hors-ligne complet', () => {
  const sw = lire('sw.js');
  const complet = sw.split('var OFFLINE_LIST = [')[1].split('];')[0];
  const delta = sw.split('var UPDATE_FILES = [')[1].split('];')[0];
  assert.ok(complet.includes(`"./${VIDEO}"`), 'MP4 hors-ligne');
  assert.ok(complet.includes(`"./${VTT}"`), 'VTT hors-ligne');
  assert.ok(!delta.includes('BouclePour.mp4'), 'les médias restent hors du delta léger');
  assert.match(sw, /var UPDATE_ID = "v543-boucles-trois-20261030";/);
  assert.match(sw, /url: "\.\/assets\/js\/app\.js", revision: "boucles-v543"/);
  assert.match(sw, /url: "\.\/cours\/javascript\.html", revision: "boucles-v543"/);
});

test('la fabrique de la capsule reste dans le dépôt', () => {
  for (const fichier of ['narration.py', 'theme.py', 'dessin.py', 'scenes.py',
    'montage.py', 'render.py', 'integrer.py', 'manifeste.py']) {
    assert.ok(existe(`outils/bouclepour/${fichier}`), fichier);
  }
  const integrer = lire('outils/bouclepour/integrer.py');
  assert.match(integrer, /def bloc_chapitres\(/, 'les chapitres sont recalculés');
  assert.match(integrer, /def ecrire_chapitres\(/, 'et réécrits dans protection.js');
  const manifeste = JSON.parse(lire('offline-complete-manifest.json'));
  assert.match(manifeste.version, /^v543/, 'manifeste du lot');
  assert.ok(manifeste.files.some((f) => f.path === VIDEO), 'MP4 dans le manifeste');
  assert.ok(manifeste.files.some((f) => f.path === VTT), 'VTT dans le manifeste');
});
