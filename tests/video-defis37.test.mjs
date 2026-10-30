/* v527 — vidéo « Les 37 Défis » : Tableau, Aléas & Captchas, Média (JavaScript).
   Contrôle la capsule livrée, ses sous-titres, le contenu pédagogique du moteur,
   l'intégration dans le site (carte vidéo, catalogue, lecteur, chapitres) et
   le cache hors-ligne. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (chemin) => readFileSync(join(root, chemin), 'utf8');
const existe = (chemin) => existsSync(join(root, chemin));

const VIDEO = 'assets/videos/defis37-tableau-aleas-media.mp4';
const VTT = 'assets/subtitles/defis37-tableau-aleas-media-fr.vtt';
const SLUG = 'defis37-tableau-aleas-media';

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

function entreesVtt(contenu) {
  const sorties = [];
  const motif = /(\d+):(\d{2})\.(\d{3}) --> (\d+):(\d{2})\.(\d{3})/g;
  let m;
  while ((m = motif.exec(contenu))) {
    sorties.push({
      debut: Number(m[1]) * 60 + Number(m[2]) + Number(m[3]) / 1000,
      fin: Number(m[4]) * 60 + Number(m[5]) + Number(m[6]) / 1000,
      index: m.index,
    });
  }
  return sorties;
}

test('la capsule est livrée à côté des autres vidéos du site', () => {
  assert.ok(existe(VIDEO), 'MP4 présent');
  assert.ok(existe(VTT), 'sous-titres présents');
  const octets = statSync(join(root, VIDEO)).size;
  assert.ok(octets > 10_000_000, `MP4 trop léger : ${octets}`);
  assert.ok(octets < 120_000_000, `MP4 trop lourd : ${octets}`);
  const entete = readFileSync(join(root, VIDEO)).subarray(0, 32).toString('latin1');
  assert.match(entete, /ftyp/, 'en-tête MP4');
  assert.match(entete, /isom|mp42|avc1/, 'marque MP4');
});

test('la vidéo dure environ onze minutes et ses sous-titres la couvrent', () => {
  const duree = dureeMp4(VIDEO);
  assert.ok(duree > 620 && duree < 700, `durée inattendue : ${duree.toFixed(1)} s`);
  const vtt = lire(VTT);
  assert.ok(vtt.startsWith('WEBVTT'), 'en-tête WEBVTT');
  const entrees = entreesVtt(vtt);
  assert.ok(entrees.length >= 80, `seulement ${entrees.length} sous-titres`);
  let precedent = -1;
  for (const e of entrees) {
    assert.ok(e.debut >= precedent - 0.05, 'sous-titres ordonnés');
    assert.ok(e.fin > e.debut, 'fin après début');
    precedent = e.debut;
  }
  assert.ok(entrees[entrees.length - 1].fin <= duree + 1, 'dernier sous-titre dans la vidéo');
  for (const mot of ['tableau', 'Math', 'substring', 'captcha', 'play']) {
    assert.ok(vtt.toLowerCase().includes(mot.toLowerCase()), `le texte parle de ${mot}`);
  }
});

test('l’onglet Vidéos du cours propose la capsule avec ses sous-titres', () => {
  const html = lire('cours/javascript.html');
  assert.match(html, new RegExp(`<video id="tabJsDefis37Video"[^>]*data-video-id="${SLUG}"`));
  assert.ok(html.includes(`<source src="../${VIDEO}"`), 'source MP4');
  assert.ok(html.includes(`<track kind="subtitles" src="../${VTT}"`), 'piste de sous-titres');
  assert.match(html, /LES 37 DÉFIS · TABLEAU, ALÉAS &amp; MÉDIA \(\d+:\d{2}\)/);
  const debutSection = html.indexOf(`src="../${VIDEO}"`);
  const sectionVideos = html.lastIndexOf('<section', debutSection);
  assert.ok(html.slice(sectionVideos, sectionVideos + 200).includes('data-course-panel="videos"'),
    'la carte est dans l’onglet Vidéos');
  assert.equal(html.split(`src="../${VIDEO}"`).length - 1, 1, 'une seule carte pour cette capsule');
});

test('le lecteur partagé connaît la capsule, ses douze repères et ses sous-titres', () => {
  const js = lire('assets/js/protection.js');
  assert.match(js, /var estDefis37 = \(sSlug === "defis37-tableau-aleas-media"/);
  assert.match(js, /estDefis37 \? "defis37-tableau-aleas-media"/, 'slug cible');
  assert.match(js, /estDefis37 \? prefixeAssetsSTI\(\) \+ "videos\/defis37-tableau-aleas-media\.mp4"/);
  assert.match(js, /subtitles\/defis37-tableau-aleas-media-fr\.vtt/);
  assert.match(js, /Les 37 Défis — Tableau, Aléas & Captchas, Média/);

  const bloc = js.split('STI_CHAPITRES_MEDIA["defis37-tableau-aleas-media"] = [')[1].split('];')[0];
  const temps = [...bloc.matchAll(/\{ t: ([\d.]+), short:/g)].map((m) => Number(m[1]));
  assert.equal(temps.length, 12, 'douze repères');
  assert.equal(temps[0], 0);
  for (let i = 1; i < temps.length; i += 1) assert.ok(temps[i] > temps[i - 1], 'repères croissants');
  const duree = dureeMp4(VIDEO);
  assert.ok(temps[temps.length - 1] < duree, 'dernier repère avant la fin');
  for (const titre of ['Tableau', 'Rappel — les tableaux', 'Rappel — l\'objet Math',
    'substring et substr', 'Captchas', 'Média', 'Récapitulatif']) {
    assert.ok(bloc.includes(titre), titre);
  }
  assert.match(lire('assets/js/lecteur-commun.js'), /'defis37-tableau-aleas-media': \['javascript'/);
});

test('l’accueil compte la nouvelle capsule dans son catalogue', () => {
  const js = lire('assets/js/app.js');
  const bloc = js.split('id: "defis37-tableau-aleas-media"')[1].slice(0, 700);
  assert.ok(bloc.includes(`srcPrincipal: "${VIDEO}"`), 'source du catalogue');
  assert.ok(bloc.includes(`sousTitres: "${VTT}"`), 'sous-titres du catalogue');
  assert.match(bloc, /dureeTexte: "\d+:\d{2}"/);
  const minutes = bloc.match(/dureeTexte: "(\d+):(\d{2})"/);
  const annoncee = Number(minutes[1]) * 60 + Number(minutes[2]);
  const reelle = Math.round(dureeMp4(VIDEO));
  assert.ok(Math.abs(annoncee - reelle) <= 2, `durée annoncée ${annoncee} vs réelle ${reelle}`);

  const debut = js.indexOf('var CATALOGUE_VIDEOS = [');
  const fin = js.indexOf('\n  ];', debut);
  const total = (js.slice(debut, fin).match(/^\s{4}\{$/gm) || []).length;
  const index = lire('index.html');
  assert.ok(index.includes(`id="videosStatNombre" data-count="${total}">${total}</span>`),
    `la tuile d’accueil doit annoncer ${total} vidéos`);
  const javascript = js.split('javascript: {')[1].slice(0, 400);
  assert.match(javascript, /nbVideos: 5/, 'cinq vidéos JavaScript');
});

test('le cache hors-ligne embarque la vidéo sans téléchargement automatique', () => {
  const sw = lire('sw.js');
  assert.match(sw, /var UPDATE_ID = "v575-livre-accueil-20261031"/);
  const delta = sw.split('var UPDATE_FILES = [')[1].split('];')[0];
  const offline = sw.split('var OFFLINE_LIST = [')[1].split('];')[0];
  for (const chemin of [VIDEO, VTT]) assert.ok(offline.includes(`"./${chemin}"`), chemin);
  assert.ok(!delta.includes(`"./${VIDEO}"`), 'la vidéo n’entre jamais dans le delta mobile');
  assert.ok(!delta.includes(`"./${VTT}"`), 'ni ses sous-titres');
  assert.match(delta, /url: "\.\/cours\/javascript\.html", revision: "etiquette-relief-v572"/);
  assert.match(delta, /url: "\.\/assets\/js\/protection\.js", revision: "php-chaines-v566"/);
  assert.match(delta, /url: "\.\/assets\/js\/app\.js", revision: "etiquette-relief-v572"/);
  const nbDelta = delta.split('{ url:').length - 1;
  assert.ok(nbDelta <= 264, `delta trop long : ${nbDelta}`);
});

test('le manifeste complet décrit la vidéo et ses sous-titres', () => {
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

test('le moteur de rendu couvre les onze défis et les trois rappels', () => {
  const dossier = join(root, 'outils', 'defis37');
  for (const fichier of ['style.py', 'contenu.py', 'rappels.py', 'dessin37.py',
    'narration37.py', 'render37.py', 'montage.py', 'integrer.py']) {
    assert.ok(existe(join('outils', 'defis37', fichier)), fichier);
  }
  const contenu = lire('outils/defis37/contenu.py');
  for (const defi of ['Créer un tableau', 'Accéder aux éléments', 'Ajouter / Retirer',
    'Caractère aléatoire', 'Entiers aléatoires', 'Lettres aléatoires', 'Couleur aléatoire',
    'Captcha multicolore', 'Captcha barré', 'Captcha vélo 3×3', 'play() / pause()']) {
    assert.ok(contenu.includes(defi), defi);
  }
  /* trois familles, onze défis, onze mémos */
  assert.equal((contenu.match(/"famille": "/g) || []).length, 11, 'onze défis');
  assert.equal((contenu.match(/^\s{4}\d{2}: "/gm) || []).length, 11, 'onze mémos');
  assert.doesNotMatch(contenu, /[\u{1F300}-\u{1FAFF}]/u, 'aucun emoji dans le contenu (police DejaVu)');

  const rappels = lire('outils/defis37/rappels.py');
  for (const cle of ['rappel_tableau', 'rappel_math', 'rappel_chaine']) {
    assert.ok(rappels.includes(`${cle}`), cle);
  }
  for (const notion of ['Math.random', 'Math.floor', 'Math.ceil', 'String.fromCharCode',
    'substring', 'substr', 'toString']) {
    assert.ok(rappels.includes(notion), notion);
  }

  const narration = lire('outils/defis37/narration37.py');
  assert.equal((narration.match(/^    "[a-z_0-9]+": \{$/gm) || []).length, 13, 'treize sections');

  const calage = JSON.parse(lire('outils/defis37/calage.json'));
  const duree = dureeMp4(VIDEO);
  assert.ok(Math.abs(calage.total - duree) < 3, 'chronologie calée sur la voix off');
  assert.equal(Object.keys(calage.debuts).length, 13, 'treize départs');
  let precedent = -1;
  for (const cle of Object.keys(calage.debuts)) {
    assert.ok(calage.debuts[cle] > precedent, `départ croissant : ${cle}`);
    precedent = calage.debuts[cle];
  }
});

test('le lecteur commun accepte réellement le slug et lance la capsule', () => {
  const js = lire('assets/js/protection.js');
  /* 1. la garde qui filtre les slugs inconnus doit connaître les 37 Défis,
        sinon `ouvrirVideoPasAPasSTI` sort sans rien afficher : le clic sur Play
        met la vidéo en pause et aucune modale n'apparaît (régression v528). */
  const debut = js.indexOf('        var estTpEvenements =');
  const fin = js.indexOf('        /* Couper immédiatement toute voix', debut);
  assert.ok(debut > 0 && fin > debut, 'bloc des slugs repérable');
  const bloc = js.slice(debut, fin);
  /* v564 : la garde s'allonge à chaque capsule ; on vérifie le drapeau attendu. */
  assert.match(bloc, /!estDefis37/, 'estDefis37 présent dans la garde');

  /* 2. exécution réelle du bloc : le slug de la capsule traverse la garde. */
  const fonction = new Function(
    'sSlug', 'estPageHtml5', 'estPageCss3', 'estPageJs', 'estPagePhpCours',
    'estPageSql', 'estPageCssDeco', 'estPageCssPos', 'estPageGuichet',
    bloc.replace('return;', 'return true;') + '\nreturn false;');
  const traverse = (slug) => fonction(slug, false, false, false, false, false, false, false, false);
  assert.equal(traverse('defis37-tableau-aleas-media'), false, 'la capsule ouvre le lecteur');
  assert.equal(traverse('tp-train-serie6'), false, 'le TP Train continue de fonctionner');
  assert.equal(traverse('slug-inconnu'), true, 'un slug inconnu reste refusé');

  /* 3. source, sous-titres et titre choisis pour ce slug. */
  assert.match(js, /estDefis37 \? prefixeAssetsSTI\(\) \+ "videos\/defis37-tableau-aleas-media\.mp4" :/);
  assert.match(js, /slugCible === "defis37-tableau-aleas-media"|defis37-tableau-aleas-media-fr\.vtt/);
});

test('un bouton vidéo mène aux 37 Défis depuis la série et depuis la page des défis', () => {
  const html = lire('cours/javascript.html');
  const carte = html.slice(html.indexOf('<h3>Les 37 Défis</h3>'));
  assert.ok(carte.slice(0, 1200).includes("ouvrirVideoPasAPasSTI('defis37-tableau-aleas-media'"),
    'bouton vidéo sur la carte de la série');
  assert.match(carte.slice(0, 1200), /🎥 Vidéo des 37 défis \(\d+:\d{2}\)/);

  const page = lire('exercices/javascript/js-37-defis-tt.html');
  const entete = page.slice(page.indexOf('<header class="header">'), page.indexOf('</header>'));
  assert.ok(entete.includes('cours/javascript.html#videos'), 'lien vers l’onglet Vidéos depuis les défis');
  assert.match(entete, /🎥/);
});
