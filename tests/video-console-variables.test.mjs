/* v548 — capsule « La console, les variables et les types » (JavaScript).
   Contrôle la vidéo livrée, ses sous-titres français, les dix sections du récit
   (cours et analogies à gauche · code à droite), les deux apartés « hors
   programme » barrés, les exercices en deux colonnes (énoncé | correction
   détaillée), l'intégration dans le site (carte vidéo, catalogue, lecteur
   partagé, chapitres) et le cache hors-ligne complet. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (chemin) => readFileSync(join(root, chemin), 'utf8');
const existe = (chemin) => existsSync(join(root, chemin));

/* Le nom des médias porte la version : c'est elle qui force le nouveau
   téléchargement, le service worker servant les vidéos depuis son cache. */
const VERSION_MEDIA = 'v548';
const VIDEO = `assets/videos/ConsoleVariables-${VERSION_MEDIA}.mp4`;
const VTT = `assets/subtitles/ConsoleVariables-fr-${VERSION_MEDIA}.vtt`;
const ID = 'console-variables';
const TITRE = 'La console, les variables et les types';

/** Les dix sections de la capsule, dans l'ordre de la voix off. */
const ORDRE = [
  'ouverture', 'console', 'declarer', 'portee', 'let_const',
  'hoisting', 'types', 'hors_programme', 'exercice_1', 'exercice_moyenne',
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
  assert.ok(octets > 8_000_000, `MP4 trop léger : ${octets}`);
  assert.ok(octets < 90_000_000, `MP4 trop lourd : ${octets}`);
  const entete = readFileSync(join(root, VIDEO)).subarray(0, 32).toString('latin1');
  assert.match(entete, /ftyp/, 'en-tête MP4');
  assert.match(entete, /isom|mp42|avc1/, 'marque MP4');
});

test('la vidéo dure environ onze minutes et demie et ses sous-titres la couvrent', () => {
  const duree = dureeMp4(VIDEO);
  assert.ok(duree > 660 && duree < 720, `durée inattendue : ${duree.toFixed(1)} s`);
  const vtt = lire(VTT);
  assert.ok(vtt.startsWith('WEBVTT'), 'entête WEBVTT');
  const entrees = entreesVtt(vtt);
  assert.ok(entrees.length >= 150, `trop peu de répliques : ${entrees.length}`);
  assert.ok(entrees[0].debut < 4, 'les sous-titres démarrent avec la voix');
  assert.ok(Math.abs(entrees[entrees.length - 1].fin - duree) < 20,
    'les sous-titres couvrent la fin de la vidéo');
  for (let i = 1; i < entrees.length; i += 1) {
    assert.ok(entrees[i].debut >= entrees[i - 1].debut - 0.01, 'répliques ordonnées');
  }
  assert.ok(entrees.every((e) => e.fin > e.debut), 'chaque réplique a une durée');
});

test("l'ouverture annonce l'écran en deux colonnes et les exercices", () => {
  const vtt = textePlat();
  assert.ok(vtt.includes('bienvenue dans sti version 2.0'), 'la salutation');
  assert.ok(vtt.trimStart().startsWith('bienvenue'), "l'ouverture arrive en premier");
  assert.ok(vtt.includes('la console, les variables, et les types'), 'le programme de la capsule');
  assert.ok(vtt.includes('à gauche, le cours et ses analogies'), 'la colonne du cours');
  assert.ok(vtt.includes('à droite, le code, et rien que le code'), 'la colonne du code');
  assert.ok(vtt.includes("l'énoncé à gauche, la correction détaillée à droite"), 'les exercices');

  /* l'écran le montre aussi : deux colonnes, une bande, une console */
  const dessin = lire('outils/variables/dessin.py');
  assert.match(dessin, /GAUCHE = \(64, 186, 916, 884\)/, 'la colonne de gauche');
  assert.match(dessin, /DROITE = \(940, 186, 1856, 884\)/, 'la colonne de droite');
  assert.match(dessin, /def console\(/, 'le cadre de la console');
  assert.match(dessin, /def barrer\(/, 'le trait « hors programme »');
});

test("la console est expliquée : ce qu'elle est et à quoi elle sert", () => {
  const vtt = textePlat();
  const debut = vtt.indexOf("la console, c'est le carnet de bord du programme");
  assert.ok(debut > 0, 'la définition de la console');
  assert.ok(debut < vtt.indexOf('maintenant, les variables'), 'la console arrive avant les variables');
  assert.ok(vtt.includes('un endroit où j\'écris des valeurs'), 'ce qu\'on y fait');
  for (const usage of ['voir ce que contient une variable', 'tester une petite idée en trois secondes',
    "lire l'erreur quand quelque chose casse"]) {
    assert.ok(vtt.includes(usage), usage);
  }
  assert.ok(vtt.includes('f12'), "le raccourci clavier");
  assert.ok(vtt.includes('console point log'), 'console.log');
  assert.ok(vtt.includes('console point error') && vtt.includes('console point table'),
    'console.error et console.table');
  assert.ok(vtt.includes('vous ne devinez plus : vous voyez'), 'la formule de la capsule');

  /* et la voix ne dit pas seulement : l'écran montre la sortie */
  const scenes = lire('outils/variables/scenes.py');
  const sc = scenes.slice(scenes.indexOf('def scene_console('), scenes.indexOf('def scene_declarer('));
  assert.match(sc, /_sortie\(/, 'le panneau « ce que la console affiche »');
  assert.ok(sc.includes('console.error'), 'la ligne en rouge');
});

test('var, let, const, la portée et la zone morte sont racontés', () => {
  const vtt = textePlat();
  assert.ok(vtt.includes("une variable, c'est un espace mémoire nommé"), 'la définition');
  assert.ok(vtt.includes('une case dans la mémoire'), "l'analogie de la case");
  assert.ok(vtt.includes('const par défaut, let si la valeur doit changer'), 'la règle de choix');
  assert.ok(vtt.includes("et var, on l'évite"), 'var écarté');
  assert.ok(vtt.includes("l'annonce au haut-parleur"), 'la variable globale');
  assert.ok(vtt.includes('salle douze'), 'la variable locale');
  assert.ok(vtt.includes('variable de bloc'), 'la variable de bloc');
  assert.ok(vtt.includes("avec var, il n'y a pas de groupes"), 'la différence de var');
  assert.ok(vtt.includes('zone morte temporelle'), 'la TDZ');
  assert.ok(vtt.includes('la liaison est constante, pas le contenu'), 'le piège du programme');
  assert.ok(vtt.includes('le hoisting, en français la remontée'), 'le hoisting');
  assert.ok(vtt.includes('le surveillant lit la liste'), "l'analogie de l'appel");
  assert.ok(vtt.includes('seule la déclaration remonte'), 'ce qui remonte');

  const scenes = lire('outils/variables/scenes.py');
  for (const cle of ['def scene_declarer(', 'def scene_portee(', 'def scene_let_const(',
    'def scene_hoisting(']) {
    assert.ok(scenes.includes(cle), cle);
  }
});

test('les sept types primitifs sont donnés, avec leurs trois pièges', () => {
  const vtt = textePlat();
  assert.ok(vtt.includes('typage dynamique'), 'le type suit la valeur');
  assert.ok(vtt.includes('sept types primitifs'), 'le compte');
  assert.ok(vtt.includes("l'analogie de la cuisine"), "l'analogie de l'ingrédient");
  for (const type of ['string', 'number', 'boolean', 'undefined', 'null', 'bigint', 'symbol']) {
    assert.ok(vtt.includes(type), `le type ${type}`);
  }
  assert.ok(vtt.includes("typeof de null donne object"), 'piège 1');
  assert.ok(vtt.includes("typeof d'un tableau donne object"), 'piège 2');
  assert.ok(vtt.includes('array point isarray'), 'la parade du tableau');
  assert.ok(vtt.includes('typeof de nan donne number'), 'piège 3');
  assert.ok(vtt.includes('deux sacs de farine'), 'la copie par valeur');
  assert.ok(vtt.includes('deux noms, un seul et même tableau'), 'la copie par référence');
});

test('les deux apartés hors programme sont barrés et annoncés comme tels', () => {
  const vtt = textePlat();
  const annonce = vtt.indexOf("ils sont hors programme, mais c'est bien de les connaître");
  assert.ok(annonce > 0, "la voix dit que c'est hors programme");
  assert.ok(vtt.includes('falsy'), 'le premier aparté');
  assert.ok(vtt.includes('truthy'), 'le vocabulaire');
  assert.ok(vtt.includes('cinq égal égal cinq entre guillemets donne true'), 'le == qui convertit');
  assert.ok(vtt.includes('utilisez trois égales'), 'la règle');
  assert.ok(vtt.lastIndexOf('hors programme') > annonce, "la conclusion le redit");

  /* à l'écran, le titre de chaque aparté est barré d'un trait rouge */
  const scenes = lire('outils/variables/scenes.py');
  const hp = scenes.slice(scenes.indexOf('def scene_hors_programme('), scenes.indexOf('def _enonce('));
  assert.ok((hp.match(/barrer\(d, /g) || []).length >= 1, 'le trait qui barre');
  assert.ok(hp.includes('"1 · falsy et truthy"') && hp.includes('"2 · comparer : == ou ==="'),
    'les deux titres barrés');
  assert.ok(hp.includes('HORS PROGRAMME'), "l'étiquette");
  const dessin = lire('outils/variables/dessin.py');
  assert.match(dessin, /def barrer\(d, x0, x1, y, couleur=ROUGE_STYLO/, 'le trait rouge');
});

test("l'exercice est coupé en deux : l'énoncé à gauche, la correction à droite", () => {
  const vtt = textePlat();
  assert.ok(vtt.includes('exercice un : que s\'affiche-t-il'), "l'énoncé de l'exercice 1");
  for (const extrait of ['extrait a', 'extrait b', 'extrait c', 'extrait d', 'extrait e', 'extrait f']) {
    assert.ok(vtt.includes(extrait), extrait);
  }
  /* les six corrigés, dits un par un */
  assert.ok(vtt.includes('var ignore le bloc'), 'a : 2, var ignore le bloc');
  assert.ok(vtt.includes('elle meurt à la fin du bloc'), 'b : 1, le let du bloc');
  assert.ok(vtt.includes('la déclaration remonte, mais pas la valeur'), 'c : undefined');
  assert.ok(vtt.includes("d est dans la zone morte temporelle"), 'd : ReferenceError');
  assert.ok(vtt.includes('on réaffecte une constante : typeerror'), 'e : TypeError');
  assert.ok(vtt.includes('on modifie une case, pas la liaison'), 'f : [5, 2]');

  const scenes = lire('outils/variables/scenes.py');
  assert.match(scenes, /def _enonce\(/, "le papier de l'énoncé");
  assert.match(scenes, /def _correction\(/, 'la correction détaillée');
  const ex = scenes.slice(scenes.indexOf('def scene_exercice_1('), scenes.indexOf('def scene_exercice_moyenne('));
  assert.match(ex, /_enonce\(d, \[/, "l'énoncé à gauche");
  assert.match(ex, /_correction\(d, \[/, 'la correction à droite');
  const corr = scenes.slice(scenes.indexOf('def _correction('), scenes.indexOf('def scene_exercice_1('));
  assert.ok(corr.includes('"abcdef"[i]'), 'les lettres a à f en face des résultats');
});

test('le deuxième exercice corrige la fonction moyenne ligne par ligne', () => {
  const vtt = textePlat();
  assert.ok(vtt.includes('une fonction moyenne qui reçoit un tableau de notes'), "l'énoncé");
  assert.ok(vtt.includes('lisons la correction, ligne par ligne'), 'la méthode');
  assert.ok(vtt.includes("let somme égal zéro"), 'ligne 2');
  assert.ok(vtt.includes('i plus petit que notes point length'), 'ligne 3');
  assert.ok(vtt.includes('return somme divisé par notes point length'), 'ligne 6');
  assert.ok(vtt.includes('douze plus quinze plus neuf fait trente-six'), 'le calcul');
  assert.ok(vtt.includes('divisé par trois, douze'), 'le résultat');
  assert.ok(vtt.includes('à vous de jouer, dans sti version 2.0'), 'la formule de fin');

  const scenes = lire('outils/variables/scenes.py');
  assert.ok(scenes.includes('"function moyenne(notes) {"'), 'le code affiché');
  assert.ok(scenes.includes('"  return somme / notes.length;"'), 'le retour');
});

test('la fabrication compte dix sections, de la voix aux scènes', () => {
  const narration = lire('outils/variables/narration.py');
  const trouve = [...narration.matchAll(/"([a-z0-9_]+)": \{/g)].map((m) => m[1]);
  assert.deepEqual(trouve, ORDRE, "l'ordre des dix sections");

  const scenes = lire('outils/variables/scenes.py');
  assert.match(scenes, /assert list\(SCENES\) == N\.ORDRE/, 'une scène par section, dans l\'ordre');
  const dispatch = [...scenes.matchAll(/^    "([a-z0-9_]+)": scene_/gm)].map((m) => m[1]);
  assert.deepEqual(dispatch, ORDRE, 'une scène par section');

  for (const cle of ORDRE) {
    assert.ok(existe(`outils/variables/voix/${cle}.mp3`), `clip ${cle}`);
  }
  const calage = JSON.parse(lire('outils/variables/calage.json'));
  assert.deepEqual(Object.keys(calage.debuts), ORDRE, 'calage de la voix');
  assert.deepEqual(Object.keys(calage.durees), ORDRE, 'durées de la voix');
  assert.ok(calage.total > 660 && calage.total < 720, `total inattendu : ${calage.total}`);
  for (let i = 1; i < ORDRE.length; i += 1) {
    const precedente = calage.debuts[ORDRE[i - 1]] + calage.durees[ORDRE[i - 1]];
    assert.ok(calage.debuts[ORDRE[i]] > precedente, `section ${ORDRE[i]} après la précédente`);
  }
});

test('les chapitres suivent la voix off et la carte vidéo est en place', () => {
  const protection = lire('assets/js/protection.js');
  const page = lire('cours/javascript.html');

  assert.ok(page.includes(`src="../${VIDEO}"`), 'la carte vidéo');
  assert.ok(page.includes(`src="../${VTT}"`), 'les sous-titres de la carte');
  assert.ok(page.includes(`data-video-id="${ID}"`), "l'identifiant du lecteur");
  assert.match(page, /CAPSULE · LA CONSOLE ET LES VARIABLES \(11:31\)/, 'le badge de durée');
  assert.ok(page.includes(TITRE), 'le titre de la carte');

  const debut = protection.indexOf('STI_CHAPITRES_MEDIA["console-variables"]');
  assert.ok(debut > 0, 'les chapitres existent');
  const bloc = protection.slice(debut, protection.indexOf('];', debut));
  assert.equal((bloc.match(/\{ t:/g) || []).length, 10, 'dix repères');
  assert.ok(bloc.includes('1 · Bienvenue — la console et les variables'), 'premier repère');
  assert.ok(bloc.includes('8 · Hors programme'), "le repère de l'aparté");
  assert.ok(bloc.includes('10 · Exercice — la fonction moyenne'), 'dernier repère');

  /* les dix repères tombent sur les débuts de section du calage */
  const calage = JSON.parse(lire('outils/variables/calage.json'));
  const temps = [...bloc.matchAll(/\{ t: ([\d.]+),/g)].map((m) => Number(m[1]));
  ORDRE.forEach((cle, i) => {
    assert.ok(Math.abs(temps[i] - calage.debuts[cle]) < 0.01, `repère ${i + 1} calé`);
  });
});

test("l'URL des médias porte la version : sinon le téléphone garde l'ancienne vidéo", () => {
  assert.ok(existe(VIDEO), 'le MP4 versionné est dans le dépôt');
  assert.ok(existe(VTT), 'le VTT versionné est dans le dépôt');
  assert.ok(!existe('assets/videos/ConsoleVariables.mp4'), "l'ancienne URL ne doit pas rester");
  assert.ok(!existe('assets/subtitles/ConsoleVariables-fr.vtt'), "l'ancien VTT non plus");

  /* la page, le catalogue et le lecteur pointent tous vers la même URL */
  assert.ok(lire('cours/javascript.html').includes(`src="../${VIDEO}"`), 'la carte vidéo');
  assert.ok(lire('assets/js/app.js').includes(`srcPrincipal: "${VIDEO}"`), 'le catalogue');
  assert.ok(lire('assets/js/protection.js').includes(`videos/ConsoleVariables-${VERSION_MEDIA}.mp4`),
    'le lecteur pas à pas');

  /* et la liste hors ligne du service worker suit */
  const sw = lire('sw.js');
  assert.ok(sw.includes(`"./${VIDEO}"`), 'MP4 dans OFFLINE_LIST');
  assert.ok(sw.includes(`"./${VTT}"`), 'VTT dans OFFLINE_LIST');

  /* la convention est écrite dans l'outil qui installe la capsule */
  const integrer = lire('outils/variables/integrer.py');
  assert.match(integrer, /VERSION_MEDIA = "v\d+"/, 'la version des médias est déclarée');
  assert.match(integrer, /NOM_MP4 = f"\{SLUG\}-\{VERSION_MEDIA\}\.mp4"/, 'le nom en dérive');
});

test("le lecteur commun reconnaît la capsule et son fichier compile", () => {
  const lecteur = lire('assets/js/lecteur-commun.js');
  const protection = lire('assets/js/protection.js');

  /* le catalogue de la reprise de lecture */
  assert.ok(lecteur.includes(`'${ID}': ['javascript','${TITRE}']`), 'la capsule est connue');
  /* le fichier doit rester du JavaScript valide : une apostrophe droite dans une
     chaîne simple avait cassé tout le lecteur partagé en v547. */
  assert.doesNotThrow(() => new Function(lecteur), 'lecteur-commun.js compile');

  assert.match(protection, /var estConsoleVariables = \(sSlug === "console-variables"/);
  assert.ok(protection.includes('!estBouclePour && !estConsoleVariables && !estPhpVariables) {'),
    'le garde-fou du lecteur laisse passer la capsule');
  assert.ok(protection.includes('var slugCible = estBouclePour ? "boucle-pour" : estConsoleVariables ? "console-variables"'),
    'le slug de la capsule est transmis');
  assert.ok(protection.includes(`subtitles/ConsoleVariables-fr-${VERSION_MEDIA}.vtt`),
    'les sous-titres sont attachés au lecteur de la grille');
  assert.ok(protection.includes('🎥 La console, les variables et les types'),
    'le titre affiché dans la modale');
});

test('le catalogue du site compte la nouvelle capsule', () => {
  const app = lire('assets/js/app.js');
  const index = lire('index.html');
  const bloc = app.split(`id: "${ID}"`)[1].slice(0, 700);
  assert.ok(bloc.includes(`srcPrincipal: "${VIDEO}"`), 'source du catalogue');
  assert.ok(bloc.includes(`sousTitres: "${VTT}"`), 'sous-titres du catalogue');
  assert.match(bloc, /dureeTexte: "11:31"/, 'la durée annoncée');
  const reelle = Math.round(dureeMp4(VIDEO));
  assert.ok(Math.abs(11 * 60 + 31 - reelle) <= 2, `durée annoncée 11:31 vs réelle ${reelle}`);

  assert.ok(index.includes('data-video-filter="all">Toutes (23)</button>'), 'pastille « Toutes »');
  assert.ok(index.includes('data-video-filter="javascript">JS (6)</button>'), 'pastille JavaScript');

  const admin = lire('assets/js/admin-vues-videos.js');
  assert.ok(admin.includes(`{ id: "${ID}"`), 'le catalogue du tableau de bord suit');
});

test('le manifeste hors ligne contient la vidéo, ses sous-titres et ses empreintes', () => {
  const manifeste = JSON.parse(lire('offline-complete-manifest.json'));
  assert.equal(manifeste.totalFiles, manifeste.files.length);
  assert.equal(manifeste.totalBytes, manifeste.files.reduce((t, f) => t + f.bytes, 0));
  for (const chemin of [VIDEO, VTT]) {
    const entree = manifeste.files.find((f) => f.path === chemin);
    assert.ok(entree, `${chemin} listé`);
    assert.equal(entree.bytes, statSync(join(root, chemin)).size);
    const blob = readFileSync(join(root, chemin));
    const sha = createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${blob.length}\0`), blob])).digest('hex');
    assert.equal(entree.gitSha, sha, `sha1 de ${chemin}`);
  }
  assert.match(manifeste.version, /^v550/);
});
