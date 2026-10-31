/* v544 — capsule « Les boucles — Pour, Répéter…jusqu'à, Tant que » (JavaScript).
   Contrôle la vidéo livrée, ses sous-titres français, les trente-six étapes du
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

/* Le nom des médias porte la version : c'est elle qui force le nouveau
   téléchargement, le service worker servant les vidéos depuis son cache. */
const VERSION_MEDIA = 'v547';
const VIDEO = `assets/videos/BouclePour-${VERSION_MEDIA}.mp4`;
const VTT = `assets/subtitles/BouclePour-fr-${VERSION_MEDIA}.vtt`;
const ID = 'boucle-pour';
const TITRE = "Les boucles — Pour, Répéter…jusqu'à, Tant que";

/** Les trente-six sections de la capsule, dans l'ordre de la voix off. */
const ORDRE = [
  'ouverture', 'introduction', 'probleme',
  'immeuble', 'ascenseur', 'scalaire',
  'repetition', 'q1', 'q2', 'q3',
  'engendrer',
  'pour_algo', 'pour_js', 'pour_php', 'pour_trace', 'rappel1',
  'chercher_quoi', 'chercher_q', 'repet_algo', 'repet_js', 'repet_php',
  'repet_trouve', 'repet_absent', 'rappel2',
  'tantque_quoi', 'tantque_algo', 'tantque_js', 'tantque_php',
  'tantque_trace', 'rappel3',
  'tableau3', 'choisir', 'algo_js',
  'bilan', 'conclusion', 'generique',
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

test('la vidéo dure environ seize minutes et ses sous-titres la couvrent', () => {
  const duree = dureeMp4(VIDEO);
  assert.ok(duree > 900 && duree < 1000, `durée inattendue : ${duree.toFixed(1)} s`);
  const vtt = lire(VTT);
  assert.ok(vtt.startsWith('WEBVTT'), 'entête WEBVTT');
  const entrees = entreesVtt(vtt);
  assert.ok(entrees.length >= 160, `trop peu de répliques : ${entrees.length}`);
  assert.ok(entrees[0].debut < 4, 'les sous-titres démarrent avec la voix');
  assert.ok(Math.abs(entrees[entrees.length - 1].fin - duree) < 20,
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

test("la capsule a une vraie introduction qui explique ce qu'est une boucle", () => {
  const vtt = textePlat();

  /* la définition, dite avant tout exemple */
  const def = vtt.indexOf("une boucle, c'est une instruction qui fait répéter un bloc");
  assert.ok(def > 0, 'la définition est énoncée');
  assert.ok(def < vtt.indexOf('quatre étages, avec quatre nombres'),
    'elle arrive avant le premier exemple');

  /* le pourquoi : sans boucle, on recopie */
  assert.ok(vtt.includes("imaginez que je doive additionner quatre nombres"), 'le constat');
  assert.ok(vtt.includes("j'écris le bloc une seule fois"), 'le geste de la boucle');
  assert.ok(vtt.includes("le bloc ne change pas"), 'ce qui ne change pas');
  assert.ok(vtt.includes("c'est donc trois choses : un bloc, des tours, une condition"),
    'les trois ingrédients');

  /* les trois boucles sont annoncées dès l'ouverture */
  const ouverture = vtt.slice(0, vtt.indexOf('quatre étages, avec quatre nombres'));
  for (const nom of ['boucle pour', 'répéter jusqu', 'boucle tant que']) {
    assert.ok(ouverture.includes(nom), `« ${nom} » annoncée dès l'ouverture`);
  }

  /* et l'écran le montre : la définition et les trois blocs, dès la scène 1 */
  const scenes = lire('outils/bouclepour/scenes.py');
  const ouverture_scene = scenes.slice(scenes.indexOf('def scene_ouverture('),
    scenes.indexOf('def scene_introduction('));
  assert.match(ouverture_scene, /une instruction qui/, 'la définition à l\'écran');
  assert.match(ouverture_scene, /_trois_blocs\(/, 'les trois boucles à l\'écran');
  const intro_scene = scenes.slice(scenes.indexOf('def scene_introduction('),
    scenes.indexOf('def scene_probleme('));
  for (const cle of ['un bloc', 'des tours', 'une condition']) {
    assert.ok(intro_scene.includes(`"${cle}"`), `« ${cle} » écrit à l'écran`);
  }
});

test("la capsule se referme : bilan, méthode, carte de fin et fondu", () => {
  const vtt = textePlat();

  /* le bilan : les trois blocs côte à côte, chacun résumé */
  const bilan = vtt.indexOf('voilà les trois blocs côte à côte');
  assert.ok(bilan > 0, 'le bilan est annoncé');
  assert.ok(vtt.includes('trois boucles, trois situations, et le même schéma'),
    'la conclusion intermédiaire');

  /* la méthode, puis le générique : la carte de fin */
  assert.ok(vtt.indexOf('la méthode tient en trois questions') > bilan, 'la méthode après le bilan');
  assert.ok(vtt.includes('à vous de jouer, dans sti version 2.0'), 'la formule de fin');
  assert.ok(vtt.trimEnd().endsWith('la capsule des boucles. à bientôt.'),
    'la capsule se termine par une vraie sortie');

  /* l'image s'éteint : le rendu applique un fondu de sortie */
  const render = lire('outils/bouclepour/render.py');
  assert.match(render, /FONDU_SORTIE = \d/, 'un fondu de sortie est défini');
  assert.match(render, /FONDU_ENTREE = \d/, 'et un fondu d\'entrée');
  assert.match(render, /def _fondu\(/, 'la fonction de fondu existe');

  /* et le dernier plan est un carton de fin, pas une liste qui s'arrête */
  const scenes = lire('outils/bouclepour/scenes.py');
  const generique = scenes.slice(scenes.indexOf('def scene_generique('),
    scenes.indexOf('#  Le répartiteur'));
  assert.ok(generique.includes('STI Version 2.0'), 'la marque');
  assert.ok(generique.includes('À VOUS DE JOUER'), 'l\'appel final');
  assert.ok(generique.includes('Les boucles'), 'le titre de la capsule');
});

test('les noms ne changent pas d\'une partie à l\'autre', () => {
  /* S reste la somme des étages ; le sac compte des jetons dans n */
  const scenes = lire('outils/bouclepour/scenes.py');
  const jetons = scenes.slice(scenes.indexOf('def _jetons('),
    scenes.indexOf('def scene_tantque_quoi('));
  assert.ok(!/f"S = \{n_sac\}/.test(jetons), 'le sac ne s\'appelle plus S');
  assert.ok(jetons.includes('f"n = {n_sac}'), 'le sac compte des jetons dans n');

  /* et le JavaScript de tant que incrémente n, pas sac */
  assert.ok(scenes.includes('"    n++;",'), 'le code incrémente n');
  assert.ok(!scenes.includes('sac++;'), 'plus de sac++ dans le code');

  /* la même écriture de TANT QUE partout où elle apparaît */
  const algo = [...scenes.matchAll(/"TANT QUE jetons > 0 FAIRE"/g)].length;
  assert.ok(algo >= 1, 'l\'algorithme de tant que est écrit une fois pour toutes');

  /* les chapitres affichés viennent de narration.py : pas de divergence possible */
  assert.match(scenes, /N\.SECTIONS\[cle\]\['titre'\]/, 'le sous-titre est lu dans narration');
  assert.match(scenes, /N\.numero\(cle\)/, 'le numéro d\'étape aussi');
  assert.match(scenes, /assert list\(SCENES\) == N\.ORDRE/,
    'les scènes et les sections sont dans le même ordre');
});

test('le tableau est expliqué : l\'immeuble T, l\'ascenseur, les crochets', () => {
  const vtt = textePlat();

  /* 1. l'immeuble a un contenu variable, donc un nom */
  assert.ok(vtt.includes("il contient plusieurs éléments"), 'des éléments');
  assert.ok(vtt.includes("son contenu peut changer"), 'un contenu variable');
  assert.ok(vtt.includes("je ne peux pas nommer l'immeuble par son contenu"),
    'pourquoi le contenu ne donne pas le nom');
  assert.ok(vtt.includes("alors je lui donne un nom, un seul : t"), 'le nom : T');
  assert.ok(vtt.includes("deux immeubles différents peuvent porter le même nom t"),
    'T est un nom de variable, pas un contenu');

  /* 2. l'ascenseur, c'est la cabine : les crochets */
  assert.ok(vtt.includes("l'ascenseur, c'est la cabine carrée : les crochets"),
    'les crochets sont la cabine');
  assert.ok(vtt.includes("le nombre écrit entre les crochets"),
    "l'indice est l'étage où elle s'arrête");
  assert.ok(vtt.includes("t crochet zéro"), 'T[0] raconté');
  assert.ok(vtt.includes("je suis dans l'immeuble t"), "l'immeuble d'abord");
  assert.ok(vtt.includes("j'ai pris l'ascenseur"), "puis l'ascenseur");
  assert.ok(vtt.includes("il s'arrête à l'étage zéro"), "puis l'étage");
  assert.ok(vtt.includes("que lorsque les portes s'ouvrent"),
    'on ne voit la valeur que portes ouvertes');

  /* 3. le compteur de l'ascenseur : un type scalaire */
  assert.ok(vtt.includes('scalaire'), 'le mot est dit');
  assert.ok(vtt.includes('successeur') && vtt.includes('prédécesseur'), 'la définition');
  assert.ok(vtt.includes("après un, on trouve deux"), 'le successeur automatique');

  /* l'écran le montre, pas seulement la voix */
  const scenes = lire('outils/bouclepour/scenes.py');
  for (const cle of ['def scene_immeuble(', 'def scene_ascenseur(', 'def scene_scalaire(']) {
    assert.ok(scenes.includes(cle), cle);
  }
  const asc = scenes.slice(scenes.indexOf('def scene_ascenseur('),
    scenes.indexOf('def scene_scalaire('));
  assert.ok(asc.includes('"les crochets = la cabine"'), 'le crochet annoté');
  assert.ok(asc.includes('"l\'indice = l\'étage"'), "l'indice annoté");
  assert.match(asc, /_cabine_crochets\(/, 'la cabine dessinée');
});

test('la boucle Pour est engendrée, puis traduite en JavaScript', () => {
  const vtt = textePlat();

  /* le brouillon : quatre lignes, une seule chose qui change */
  const eng = vtt.indexOf("j'ai quatre lignes");
  assert.ok(eng > 0, 'les quatre lignes du brouillon');
  assert.ok(vtt.includes('s égal s plus t crochet quelque chose'),
    'la ligne au trou, T[quelque chose]');
  assert.ok(vtt.includes('la boucle pour l\'engendre'), 'le mot engendrer');
  assert.ok(vtt.includes('elle le fabrique quatre fois'), 'ce que la boucle fabrique');
  assert.ok(eng < vtt.indexOf('la boucle pour, maintenant, en algorithme'),
    'on engendre avant d’écrire la boucle');

  /* l'algorithme vient après le brouillon, le JavaScript après l'algorithme */
  assert.ok(vtt.indexOf('la boucle pour, maintenant, en algorithme')
    < vtt.indexOf('je passe à la même boucle, en javascript'),
    'algorithme puis JavaScript, jamais mélangés');

  /* le for est expliqué morceau par morceau, avec i < T.length */
  assert.ok(vtt.includes('i plus petit que t point length'), 'la continuité');
  assert.ok(vtt.includes("c'est la condition de départ"), 'le départ');
  assert.ok(vtt.includes("c'est l'avancement du pas"), 'le pas');
  assert.ok(vtt.includes('i plus plus, c\'est exactement i égal i plus un'),
    'i++ = i = i + 1');
  assert.ok(vtt.includes("t point length, c'est la hauteur de l'immeuble"),
    'T.length = la hauteur');

  const scenes = lire('outils/bouclepour/scenes.py');
  assert.ok(scenes.includes('"for (let i = 0; i < T.length; i++) {"'),
    'le code écrit avec T.length');
  assert.ok(!scenes.includes('i <= 3; i++'), 'plus de borne 3 en dur dans le JavaScript');
  assert.match(scenes, /def scene_engendrer\(/, 'la scène du brouillon');
  const trace = scenes.slice(scenes.indexOf('def scene_pour_trace('),
    scenes.indexOf('def _scene_rappel('));
  assert.ok(trace.includes('4 < 4 est faux'), 'la sortie expliquée par T.length');
});

test('la capsule traite les trois langages : JavaScript et PHP', () => {
  const vtt = textePlat();

  /* le PHP est annoncé, puis montré après chaque boucle */
  for (const expression of ['trois langages, une seule logique',
    'while, $jetons supérieur à zéro', 'chaque variable porte un dollar',
    'count($t)', 'trois égales']) {
    assert.ok(vtt.toLowerCase().includes(expression), expression);
  }
  /* le PHP arrive après le JavaScript de chaque boucle */
  assert.ok(vtt.indexOf('je passe à la même boucle, en javascript')
    < vtt.indexOf('et en php, cette boucle pour'), 'Pour : JavaScript puis PHP');
  assert.ok(vtt.indexOf('do … while') < vtt.indexOf('la recherche, maintenant, en php'),
    'Répéter : JavaScript puis PHP');
  assert.ok(vtt.includes('trois langages, une seule logique'), 'la formule de synthèse');
  assert.ok(vtt.includes("n'existent pas en php"), 'la différence == / ===');

  const scenes = lire('outils/bouclepour/scenes.py');
  for (const bloc of ['PHP_POUR = [', 'PHP_REP = [', 'PHP_TQ = [']) {
    assert.ok(scenes.includes(bloc), bloc);
  }
  for (const scene of ['def scene_pour_php(', 'def scene_repet_php(', 'def scene_tantque_php(']) {
    assert.ok(scenes.includes(scene), scene);
  }
  /* le PHP suit le JavaScript de chaque boucle, jamais avant */
  const ordre = [...scenes.matchAll(/^    "([a-z0-9_]+)": scene_/gm)].map((m) => m[1]);
  for (const [js, php] of [['pour_js', 'pour_php'], ['repet_js', 'repet_php'],
    ['tantque_js', 'tantque_php']]) {
    assert.ok(ordre.indexOf(php) === ordre.indexOf(js) + 1, `${php} suit ${js}`);
  }
  /* et le bilan montre les trois écritures dans chaque colonne */
  const bilan = scenes.slice(scenes.indexOf('def scene_bilan('),
    scenes.indexOf('def scene_conclusion('));
  assert.equal((bilan.match(/_colonne_fin\(d, /g) || []).length, 3, 'trois colonnes');
  assert.ok(bilan.includes('PHP_POUR') && bilan.includes('PHP_REP') && bilan.includes('PHP_TQ'),
    'le PHP dans les trois colonnes');
});

test("le bandeau des chapitres suit la vidéo", () => {
  const protection = lire('assets/js/protection.js');

  /* une fonction dédiée, qui centre le repère actif sans défiler la page */
  assert.match(protection, /function faireDefilerChapitreActifSTI\(barre, bouton\)/,
    'la fonction de recentrage');
  assert.match(protection, /barre\.scrollTo\(\{ left: cible/,
    'le défilement se fait sur la barre, pas sur la page');
  assert.match(protection, /prefers-reduced-motion/,
    'le mouvement est doux, sauf si on le refuse');

  /* elle est appelée quand le chapitre change, et au clic sur un repère */
  const timeupdate = protection.slice(protection.indexOf('mVid.addEventListener("timeupdate"'),
    protection.indexOf('function fermerModaleVideo'));
  assert.match(timeupdate, /if \(idxAct !== mDernierChapitre\)/,
    'on ne recentre qu’au changement de chapitre');
  assert.match(timeupdate, /faireDefilerChapitreActifSTI\(mChapPills, pills\[idxAct\]\)/,
    'le repère actif est recentré');
  assert.match(protection, /faireDefilerChapitreActifSTI\(pillsChapEl, btnP\)/,
    'un clic recentre aussi');
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
  assert.ok(vtt.includes('ne mélangez pas les écritures'),
    'la consigne est dite explicitement');
  assert.ok(vtt.includes('à droite, de haut en bas : l\'algorithme'),
    "le cadre de l'algorithme");
  assert.ok(vtt.includes('le javascript, avec for, do while et while'),
    'le cadre du JavaScript');
  assert.ok(vtt.includes('et le php, avec for, do while et while'),
    'le cadre du PHP');
  assert.ok(vtt.includes('on écrit l\'algorithme d\'abord, puis on le traduit, deux fois'),
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
  const fin = scenes.slice(scenes.indexOf('def scene_bilan('),
    scenes.indexOf('def scene_conclusion('));
  for (const cle of ['"POUR"', '"RÉPÉTER…JUSQU\'À"', '"TANT QUE"']) {
    assert.ok(fin.includes(cle), `la colonne ${cle}`);
  }
  assert.equal((fin.match(/_colonne_fin\(d, /g) || []).length, 3, 'trois colonnes');
  const vtt = textePlat();
  assert.ok(vtt.includes('trois boucles, trois situations'), 'la conclusion du bilan');
});

test("l'URL des médias porte la version : sinon le téléphone garde l'ancienne vidéo", () => {
  /* Le service worker sert .mp4 et .vtt en « cache d'abord » et ne les
     revalide jamais : seule une URL neuve force le nouveau téléchargement. */
  assert.ok(existe(VIDEO), 'le MP4 versionné est dans le dépôt');
  assert.ok(existe(VTT), 'le VTT versionné est dans le dépôt');
  assert.ok(!existe('assets/videos/BouclePour.mp4'), "l'ancienne URL ne doit pas rester");
  assert.ok(!existe('assets/subtitles/BouclePour-fr.vtt'), "l'ancien VTT non plus");

  /* la page, le catalogue et le lecteur pointent tous vers la même URL */
  assert.ok(lire('cours/javascript.html').includes(`src="../${VIDEO}"`), 'la carte vidéo');
  assert.ok(lire('assets/js/app.js').includes(`srcPrincipal: "${VIDEO}"`), 'le catalogue');
  assert.ok(lire('assets/js/protection.js').includes(`videos/BouclePour-${VERSION_MEDIA}.mp4`),
    'le lecteur pas à pas');

  /* et la liste hors ligne du service worker suit */
  const sw = lire('sw.js');
  assert.ok(sw.includes(`"./${VIDEO}"`), 'MP4 dans OFFLINE_LIST');
  assert.ok(sw.includes(`"./${VTT}"`), 'VTT dans OFFLINE_LIST');

  /* la convention est écrite dans l'outil qui installe la capsule */
  const integrer = lire('outils/bouclepour/integrer.py');
  assert.match(integrer, /VERSION_MEDIA = "v\d+"/, 'la version des médias est déclarée');
  assert.match(integrer, /NOM_MP4 = f"\{SLUG\}-\{VERSION_MEDIA\}\.mp4"/, 'le nom en dérive');
});

test('la fabrication compte trente-six sections, de la voix aux scènes', () => {
  const narration = lire('outils/bouclepour/narration.py');
  const trouve = [...narration.matchAll(/"([a-z0-9_]+)": \{/g)].map((m) => m[1]);
  assert.deepEqual(trouve, ORDRE, 'l\'ordre des trente-six sections');

  const scenes = lire('outils/bouclepour/scenes.py');
  assert.match(scenes, /TOTAL = len\(N\.ORDRE\)/, 'la capsule compte autant d\'étapes que de sections');
  const dispatch = [...scenes.matchAll(/^    "([a-z0-9_]+)": scene_/gm)].map((m) => m[1]);
  assert.deepEqual(dispatch, ORDRE, 'une scène par section, dans l\'ordre');

  for (const cle of ORDRE) {
    assert.ok(existe(`outils/bouclepour/voix/${cle}.mp3`), `clip ${cle}`);
  }
  const calage = JSON.parse(lire('outils/bouclepour/calage.json'));
  assert.deepEqual(Object.keys(calage.debuts), ORDRE, 'calage de la voix');
  assert.deepEqual(Object.keys(calage.durees), ORDRE, 'durées de la voix');
  assert.ok(calage.total > 900 && calage.total < 1000, `total inattendu : ${calage.total}`);
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
  /* v564 : la garde s'allonge à chaque capsule — on vérifie l'intention (la
     boucle Pour y figure) plutôt qu'une fin de ligne figée. */
  const garde = protection.split('if (!estTpEvenements')[1].split(') {')[0];
  for (const drapeau of ['!estBouclePour', '!estConsoleVariables', '!estPhpVariables', '!estFonctionsChaine']) {
    assert.ok(garde.includes(drapeau), 'le garde-fou du lecteur laisse passer la capsule : ' + drapeau);
  }
  /* v564 : la chaîne des slugs commence par la capsule des chaînes ; on vérifie
     que la boucle Pour y a bien son entrée, pas sa place exacte. */
  assert.match(protection, /estBouclePour \? "boucle-pour"/,
    'le slug de la capsule est transmis');
  assert.ok(protection.includes(`videos/BouclePour-${VERSION_MEDIA}.mp4`),
    'le lecteur ouvre bien le fichier de la capsule');
  assert.ok(protection.includes('🎥 Les boucles — Pour, Répéter…jusqu\'à, Tant que'),
    'le titre affiché dans la modale');

  /* les sous-titres suivent la vidéo dans la modale */
  assert.ok(protection.includes(`subtitles/BouclePour-fr-${VERSION_MEDIA}.vtt`),
    'les sous-titres sont attachés au lecteur de la grille');

  /* un repère de chapitre par section, calé sur la voix off */
  const chapitres = protection.slice(protection.indexOf('STI_CHAPITRES_MEDIA["boucle-pour"]'),
    protection.indexOf('STI_CHAPITRES_MEDIA["console-variables"]'));
  assert.equal((chapitres.match(/\{ t:/g) || []).length, 36, 'trente-six chapitres');
  assert.ok(chapitres.includes('1 · Bienvenue — les boucles'), 'premier repère');
  assert.ok(chapitres.includes('2 · Ce qu\'est une boucle'), 'le repère de l\'introduction');
  assert.ok(chapitres.includes('36 · À vous de jouer'), 'dernier repère');
  assert.ok(chapitres.includes('34 · Les trois blocs côte à côte'), 'le bilan');

  /* la reprise de lecture sait à quelle matière et quel titre rattacher la capsule */
  assert.ok(lecteur.includes("'boucle-pour': ['javascript','Les boucles — Pour, Répéter…jusqu\u2019à, Tant que']"),
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
  assert.equal(traverse(`BouclePour-${VERSION_MEDIA}.mp4`), false, 'le nom du fichier aussi');
  assert.equal(traverse('tp-train-serie6'), false, 'le TP Train continue de fonctionner');
  assert.equal(traverse('defis37-tableau-aleas-media'), false, 'les 37 Défis continuent');
  assert.equal(traverse('slug-inconnu'), true, 'un slug inconnu reste refusé');

  /* le service worker sert la nouvelle version du lecteur */
  const sw = lire('sw.js');
  assert.match(sw, /url: "\.\/assets\/js\/protection\.js", revision: "cours-sti-v578"/);
  /* le lecteur commun n'a pas bougé depuis la v543 : il garde sa révision */
  assert.match(sw, /url: "\.\/assets\/js\/lecteur-commun\.js", revision: "cours-sti-v578"/);
});

test('la carte vidéo est dans l\'onglet Vidéos de JavaScript', () => {
  const page = lire('cours/javascript.html');
  assert.ok(page.includes(`data-video-id="${ID}"`), 'identifiant du lecteur');
  assert.ok(page.includes('id="tabJsBouclePourVideo"'), 'vidéo dédiée');
  assert.ok(page.includes(`src="../${VIDEO}"`), 'source MP4');
  assert.ok(page.includes(`src="../${VTT}"`), 'piste de sous-titres');
  assert.match(page, /CAPSULE · LES BOUCLES \(\d+:\d{2}\)/, 'badge de durée');
  assert.ok(!/SÉRIE 6 · LES BOUCLES/.test(page), "la capsule n'est pas une série");
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
  assert.ok(!delta.includes(`BouclePour-${VERSION_MEDIA}.mp4`), 'les médias restent hors du delta léger');
  assert.match(sw, /var UPDATE_ID = "v580-quiz-systemes";/);
  assert.match(sw, /url: "\.\/assets\/js\/app\.js", revision: "vitrine-sti-v579"/);
  assert.match(sw, /url: "\.\/cours\/javascript\.html", revision: "etiquette-relief-v572"/);
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
  assert.match(manifeste.version, /^v580/, 'manifeste du lot');
  assert.ok(manifeste.files.some((f) => f.path === VIDEO), 'MP4 dans le manifeste');
  assert.ok(manifeste.files.some((f) => f.path === VTT), 'VTT dans le manifeste');
});
