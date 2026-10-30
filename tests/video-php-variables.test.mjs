/* v549 — capsule « PHP — les variables, la portée et les types ».
   Contrôle la vidéo livrée, ses sous-titres français, les dix sections du récit
   (cours et analogies à gauche · code PHP à droite), les deux apartés « hors
   programme » barrés, les exercices en deux colonnes (énoncé | correction
   détaillée), l'intégration dans le site (carte vidéo PHP, catalogue, lecteur
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
const VERSION_MEDIA = 'v549';
const VIDEO = `assets/videos/PhpVariables-${VERSION_MEDIA}.mp4`;
const VTT = `assets/subtitles/PhpVariables-fr-${VERSION_MEDIA}.vtt`;
const ID = 'php-variables';
const TITRE = 'PHP — Les variables, la portée et les types';
const DUREE = '13:34';

/** Les dix sections de la capsule, dans l'ordre de la voix off. */
const ORDRE = [
  'ouverture', 'declarer', 'portee', 'bloc_static', 'hoisting',
  'types', 'tableaux', 'hors_programme', 'exercice_1', 'exercice_moyenne',
];

/** Le texte des sous-titres, minutages retirés et lignes repliées. */
function textePlat() {
  return lire(VTT).toLowerCase()
    .replace(/^webvtt\s*/, '')
    .replace(/^\d+:\d{2}:\d{2}\.\d{3} --> .*$/gm, '')
    .replace(/^\d+$/gm, '')
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
  assert.ok(octets < 95_000_000, `MP4 trop lourd : ${octets}`);
  const entete = readFileSync(join(root, VIDEO)).subarray(0, 32).toString('latin1');
  assert.match(entete, /ftyp/, 'en-tête MP4');
  assert.match(entete, /isom|mp42|avc1/, 'marque MP4');
});

test('la vidéo dure environ treize minutes et demie et ses sous-titres la couvrent', () => {
  const duree = dureeMp4(VIDEO);
  assert.ok(duree > 795 && duree < 835, `durée inattendue : ${duree.toFixed(1)} s`);
  const vtt = lire(VTT);
  assert.ok(vtt.startsWith('WEBVTT'), 'entête WEBVTT');
  const entrees = entreesVtt(vtt);
  assert.ok(entrees.length >= 180, `trop peu de répliques : ${entrees.length}`);
  assert.ok(entrees[0].debut < 4, 'les sous-titres démarrent avec la voix');
  assert.ok(Math.abs(entrees[entrees.length - 1].fin - duree) < 20,
    'les sous-titres couvrent la fin de la vidéo');
  for (let i = 1; i < entrees.length; i += 1) {
    assert.ok(entrees[i].debut >= entrees[i - 1].debut - 0.01, 'répliques ordonnées');
  }
  assert.ok(entrees.every((e) => e.fin > e.debut), 'chaque réplique a une durée');
});

test("l'ouverture annonce l'écran en deux colonnes, le dollar et les exercices", () => {
  const vtt = textePlat();
  assert.ok(vtt.includes('bienvenue dans sti version 2.0'), 'la salutation');
  assert.ok(vtt.trimStart().startsWith('bienvenue'), "l'ouverture arrive en premier");
  assert.ok(vtt.includes('une capsule de php'), 'le programme de la capsule');
  assert.ok(vtt.includes('à gauche, le cours et ses analogies'), 'la colonne du cours');
  assert.ok(vtt.includes('à droite, le code php, et rien que le code'), 'la colonne du code');
  assert.ok(vtt.includes("l'énoncé à gauche, la correction détaillée à droite"), 'les exercices');
  assert.ok(vtt.includes('une variable commence par le signe dollar'), 'la différence avec JavaScript');
  assert.ok(vtt.includes("il n'y a ni var, ni let, ni const"), 'les mots-clés qui disparaissent');

  /* l'écran le montre aussi : deux colonnes, une bande, une console noire */
  const dessin = lire('outils/phpvariables/dessin.py');
  assert.match(dessin, /GAUCHE = \(64, 186, 916, 884\)/, 'la colonne de gauche');
  assert.match(dessin, /DROITE = \(940, 186, 1856, 884\)/, 'la colonne de droite');
  assert.match(dessin, /def console\(/, 'le cadre de la console');
  assert.match(dessin, /def barrer\(/, 'le trait « hors programme »');
});

test('déclarer, les trois règles, echo, isset et les constantes sont racontés', () => {
  const vtt = textePlat();
  assert.ok(vtt.includes('la variable naît à sa première affectation'), 'pas de mot-clé');
  assert.ok(vtt.includes('trois règles'), 'les trois règles');
  assert.ok(vtt.includes('dollar note un est correct'), '$note1 correct');
  assert.ok(vtt.includes('dollar un note est une erreur'), '$1note refusé');
  assert.ok(vtt.includes('php distingue les majuscules et les minuscules'), '$age ≠ $Age');
  assert.ok(vtt.includes('le type est attaché à la valeur'), 'typage dynamique');
  assert.ok(vtt.includes('avec des guillemets doubles, la variable est remplacée'), 'les "…"');
  assert.ok(vtt.includes('avec des guillemets simples, le texte reste tel quel'), "les '…'");
  assert.ok(vtt.includes('et pour coller deux morceaux, le point'), 'la concaténation');
  assert.ok(vtt.includes('trois fonctions pour tester'), 'isset, unset, empty');
  assert.ok(vtt.includes('une constante ne change jamais de valeur'), 'les constantes');
  assert.ok(vtt.includes('define, tva') || vtt.includes('define, entre parenthèses'), 'define');
  assert.ok(vtt.includes('const, pi, égal, trois virgule quatorze'), 'const');
  assert.ok(vtt.includes('une constante est visible partout'), 'la portée des constantes');

  const scenes = lire('outils/phpvariables/scenes.py');
  assert.ok(scenes.includes('def scene_declarer('), 'la scène');
  assert.ok(scenes.includes('$note1') && scenes.includes('$1note'), 'les deux noms montrés');
});

test("la portée du lycée, l'absence de portée de bloc et static sont expliqués", () => {
  const vtt = textePlat();
  assert.ok(vtt.includes('la portée, en anglais scope'), 'la définition');
  assert.ok(vtt.includes('la distance que la voix peut atteindre'), "l'analogie du lycée");
  assert.ok(vtt.includes("une annonce au haut-parleur"), 'la variable globale');
  assert.ok(vtt.includes('une salle de classe porte fermée'), 'la variable locale');
  assert.ok(vtt.includes("dans une fonction php, une variable globale n'est pas accessible"), 'la différence');
  assert.ok(vtt.includes('pour ouvrir la porte, le mot global'), 'global');
  assert.ok(vtt.includes('passer la valeur en paramètre'), 'le paramètre');
  assert.ok(vtt.includes('variables superglobales'), 'les superglobales');
  assert.ok(vtt.includes('il n\'y a pas de portée de bloc'), 'pas de portée de bloc');
  assert.ok(vtt.includes('seule la fonction crée une portée locale'), 'la seule zone');
  assert.ok(vtt.includes('avec le mot static, elle garde sa valeur'), 'static');
  assert.ok(vtt.includes('premier appel : un'), 'le compteur');

  const scenes = lire('outils/phpvariables/scenes.py');
  assert.ok(scenes.includes('def scene_portee(') && scenes.includes('def scene_bloc_static('), 'les scènes');
  assert.ok(scenes.includes('static $n = 0;'), 'le compteur montré');
});

test('le hoisting est expliqué comme absent en PHP', () => {
  const vtt = textePlat();
  assert.ok(vtt.includes('le hoisting, en français la remontée'), 'le hoisting');
  assert.ok(vtt.includes('php ne le fait pas pour les variables'), 'pas de remontée');
  assert.ok(vtt.includes("le surveillant n'appelle que les élèves"), "l'analogie de la classe");
  assert.ok(vtt.includes('une exception, et une seule : les fonctions'), 'les fonctions');
  assert.ok(lire('outils/phpvariables/scenes.py').includes('def scene_hoisting('), 'la scène');
});

test('les trois familles de types, la copie par valeur et les tableaux sont donnés', () => {
  const vtt = textePlat();
  assert.ok(vtt.includes('php a trois familles'), 'le compte');
  for (const type of ['int', 'float', 'string', 'bool', 'array', 'null']) {
    assert.ok(vtt.includes(type), `le type ${type}`);
  }
  assert.ok(vtt.includes('scalaire vient du latin'), 'scalaire expliqué');
  assert.ok(vtt.includes("l'analogie de la cuisine"), "l'analogie de l'ingrédient");
  assert.ok(vtt.includes('pour connaître le type, deux outils'), 'gettype et var_dump');
  assert.ok(vtt.includes('tout est copié par valeur'), 'la copie');
  assert.ok(vtt.includes('avec le et commercial'), 'la référence');
  assert.ok(vtt.includes('le tableau indexé'), 'le tableau indexé');
  assert.ok(vtt.includes('le tableau associatif'), 'le tableau associatif');
  assert.ok(vtt.includes('clé, flèche, valeur'), 'la flèche du tableau associatif');
  assert.ok(vtt.includes('foreach'), 'la boucle foreach');
  assert.ok(vtt.includes('count de dollar notes'), 'count()');
});

test('les deux apartés hors programme sont barrés et annoncés comme tels', () => {
  const vtt = textePlat();
  const annonce = vtt.indexOf("ils sont hors programme, mais c'est bien de les connaître");
  assert.ok(annonce > 0, "la voix dit que c'est hors programme");
  assert.ok(vtt.includes('premier aparté'), 'le premier aparté');
  assert.ok(vtt.includes('deuxième aparté'), 'le second aparté');
  assert.ok(vtt.includes('la chaîne zéro est fausse en php'), 'le piège de "0"');
  assert.ok(vtt.includes('cinq égal égal cinq entre guillemets donne true'), 'le == qui convertit');
  assert.ok(vtt.includes('cinq égal égal égal cinq entre guillemets donne false'), 'le ===');
  assert.ok(vtt.includes('utilisez trois égales'), 'la règle');
  assert.ok(vtt.lastIndexOf('hors programme') > annonce, 'la conclusion le redit');

  /* à l'écran, le titre de chaque aparté est barré d'un trait rouge */
  const scenes = lire('outils/phpvariables/scenes.py');
  const hp = scenes.slice(scenes.indexOf('def scene_hors_programme('), scenes.indexOf('def _enonce('));
  assert.ok((hp.match(/barrer\(d, /g) || []).length >= 1, 'le trait qui barre');
  /* un seul appel, mais une boucle qui barre les deux titres, l'un après l'autre */
  assert.ok(hp.includes('"1 · vrai ou faux"') && hp.includes('"2 · comparer : == ou ==="'),
    'les deux titres barrés');
  assert.ok(hp.includes('HORS PROGRAMME'), "l'étiquette");
});

test("l'exercice est coupé en deux : l'énoncé à gauche, la correction à droite", () => {
  const vtt = textePlat();
  assert.ok(vtt.includes("exercice un : que s'affiche-t-il"), "l'énoncé de l'exercice 1");
  for (const extrait of ['extrait a', 'extrait b', 'extrait c', 'extrait d', 'extrait e', 'extrait f']) {
    assert.ok(vtt.includes(extrait), extrait);
  }
  assert.ok(vtt.includes('global ouvre la porte'), 'b : 2, global');
  assert.ok(vtt.includes("il n'y a pas de portée de bloc en php"), 'c : 3');
  assert.ok(vtt.includes('static garde la valeur entre les appels'), 'd : 1 2 3');
  assert.ok(vtt.includes("il n'y a pas de remontée des variables"), 'e : avertissement');
  assert.ok(vtt.includes('une constante est visible partout'), 'f : 10');

  const scenes = lire('outils/phpvariables/scenes.py');
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
  assert.ok(vtt.includes('une fonction moyenne de dollar notes'), "l'énoncé");
  assert.ok(vtt.includes('lisons la correction, ligne par ligne'), 'la méthode');
  assert.ok(vtt.includes('dollar somme égal zéro'), 'ligne 2');
  assert.ok(vtt.includes('i plus petit que count de dollar notes'), 'ligne 3');
  assert.ok(vtt.includes('return dollar somme divisé par count de dollar notes'), 'ligne 6');
  assert.ok(vtt.includes('douze plus quinze plus neuf, trente-six'), 'le calcul');
  assert.ok(vtt.includes('divisé par trois, douze'), 'le résultat');
  assert.ok(vtt.includes('à vous de jouer, dans sti version 2.0'), 'la formule de fin');

  const scenes = lire('outils/phpvariables/scenes.py');
  assert.ok(scenes.includes('"function moyenne($notes) {"'), 'le code affiché');
  assert.ok(scenes.includes('"  return $somme / count($notes);"'), 'le retour');
});

test('la fabrication compte dix sections, de la voix aux scènes', () => {
  const narration = lire('outils/phpvariables/narration.py');
  const trouve = [...narration.matchAll(/"([a-z0-9_]+)": \{/g)].map((m) => m[1]);
  assert.deepEqual(trouve, ORDRE, "l'ordre des dix sections");

  const scenes = lire('outils/phpvariables/scenes.py');
  assert.match(scenes, /assert list\(SCENES\) == N\.ORDRE/, "une scène par section, dans l'ordre");
  const dispatch = [...scenes.matchAll(/^    "([a-z0-9_]+)": scene_/gm)].map((m) => m[1]);
  assert.deepEqual(dispatch, ORDRE, 'une scène par section');

  for (const cle of ORDRE) {
    assert.ok(existe(`outils/phpvariables/voix/${cle}.mp3`), `clip ${cle}`);
  }
  const calage = JSON.parse(lire('outils/phpvariables/calage.json'));
  assert.deepEqual(Object.keys(calage.debuts), ORDRE, 'calage de la voix');
  assert.deepEqual(Object.keys(calage.durees), ORDRE, 'durées de la voix');
  assert.ok(calage.total > 795 && calage.total < 835, `total inattendu : ${calage.total}`);
  for (let i = 1; i < ORDRE.length; i += 1) {
    const precedente = calage.debuts[ORDRE[i - 1]] + calage.durees[ORDRE[i - 1]];
    assert.ok(calage.debuts[ORDRE[i]] > precedente, `section ${ORDRE[i]} après la précédente`);
  }
});

test('les chapitres suivent la voix off et la carte vidéo PHP est en place', () => {
  const protection = lire('assets/js/protection.js');
  const page = lire('cours/php.html');

  assert.ok(page.includes(`href="../${VIDEO}"`), 'la carte vidéo');
  assert.ok(page.includes(`data-video-open="${ID}"`), "l'identifiant du lecteur");
  assert.ok(page.includes(`data-video-duree="${ID}">${DUREE}<`), 'le badge de durée');
  assert.ok(page.includes('Les variables, la portée et les types'), 'le titre de la carte');
  assert.ok(page.includes('Capsule PHP'), 'la carte se présente comme du PHP');

  const debut = protection.indexOf('STI_CHAPITRES_MEDIA["php-variables"]');
  assert.ok(debut > 0, 'les chapitres existent');
  const bloc = protection.slice(debut, protection.indexOf('];', debut));
  assert.equal((bloc.match(/\{ t:/g) || []).length, 10, 'dix repères');
  assert.ok(bloc.includes('1 · Bienvenue — les variables PHP'), 'premier repère');
  assert.ok(bloc.includes('8 · Hors programme'), "le repère de l'aparté");
  assert.ok(bloc.includes('10 · Exercice — la fonction moyenne'), 'dernier repère');

  /* les dix repères tombent sur les débuts de section du calage */
  const calage = JSON.parse(lire('outils/phpvariables/calage.json'));
  const temps = [...bloc.matchAll(/\{ t: ([\d.]+),/g)].map((m) => Number(m[1]));
  ORDRE.forEach((cle, i) => {
    assert.ok(Math.abs(temps[i] - calage.debuts[cle]) < 0.01, `repère ${i + 1} calé`);
  });
});

test("l'URL des médias porte la version : sinon le téléphone garde l'ancienne vidéo", () => {
  assert.ok(existe(VIDEO), 'le MP4 versionné est dans le dépôt');
  assert.ok(existe(VTT), 'le VTT versionné est dans le dépôt');
  assert.ok(!existe('assets/videos/PhpVariables.mp4'), "l'ancienne URL ne doit pas rester");
  assert.ok(!existe('assets/subtitles/PhpVariables-fr.vtt'), "l'ancien VTT non plus");

  /* la page, le catalogue et le lecteur pointent tous vers la même URL */
  assert.ok(lire('cours/php.html').includes(`../${VIDEO}`), 'la carte vidéo');
  assert.ok(lire('assets/js/app.js').includes(`srcPrincipal: "${VIDEO}"`), 'le catalogue');
  assert.ok(lire('assets/js/protection.js').includes(`videos/PhpVariables-${VERSION_MEDIA}.mp4`),
    'le lecteur pas à pas');

  /* et la liste hors ligne du service worker suit */
  const sw = lire('sw.js');
  assert.ok(sw.includes(`"./${VIDEO}"`), 'MP4 dans OFFLINE_LIST');
  assert.ok(sw.includes(`"./${VTT}"`), 'VTT dans OFFLINE_LIST');

  /* la convention est écrite dans l'outil qui installe la capsule */
  const integrer = lire('outils/phpvariables/integrer.py');
  assert.match(integrer, /VERSION_MEDIA = "v\d+"/, 'la version des médias est déclarée');
  assert.match(integrer, /NOM_MP4 = f"\{SLUG\}-\{VERSION_MEDIA\}\.mp4"/, 'le nom en dérive');
});

test('le lecteur commun reconnaît la capsule et son fichier compile', () => {
  const lecteur = lire('assets/js/lecteur-commun.js');
  const protection = lire('assets/js/protection.js');

  assert.ok(lecteur.includes(`'${ID}': ['php','${TITRE}']`), 'la capsule est connue');
  assert.doesNotThrow(() => new Function(lecteur), 'lecteur-commun.js compile');

  assert.match(protection, /var estPhpVariables = \(sSlug === "php-variables"/);
  /* v564 : la garde et la chaîne des slugs s'allongent à chaque capsule. */
  assert.match(protection, /!estPhpVariables/, 'le garde-fou du lecteur laisse passer la capsule');
  assert.match(protection, /estPhpVariables \? "php-variables"/, 'le slug de la capsule est transmis');
  assert.ok(protection.includes(`subtitles/PhpVariables-fr-${VERSION_MEDIA}.vtt`),
    'les sous-titres sont attachés au lecteur de la grille');
  assert.ok(protection.includes('🎥 PHP — Les variables, la portée et les types'),
    'le titre affiché dans la modale');
  assert.doesNotThrow(() => new Function(protection), 'protection.js compile');
});

test('le catalogue du site compte la nouvelle capsule', () => {
  const app = lire('assets/js/app.js');
  const index = lire('index.html');
  const bloc = app.split(`id: "${ID}"`)[1].slice(0, 700);
  assert.ok(bloc.includes(`srcPrincipal: "${VIDEO}"`), 'source du catalogue');
  assert.ok(bloc.includes(`sousTitres: "${VTT}"`), 'sous-titres du catalogue');
  assert.match(bloc, /dureeTexte: "13:34"/, 'la durée annoncée');
  const reelle = Math.round(dureeMp4(VIDEO));
  assert.ok(Math.abs(13 * 60 + 34 - reelle) <= 2, `durée annoncée 13:34 vs réelle ${reelle}`);

  assert.ok(index.includes('data-video-filter="all">Toutes (26)</button>'), 'pastille « Toutes »');
  assert.ok(index.includes('data-video-filter="php">PHP (6)</button>'), 'pastille PHP');
  assert.ok(index.includes('id="videosTotalNombre">26<'), 'compteur des capsules');

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
  assert.match(manifeste.version, /^v575/);
});
