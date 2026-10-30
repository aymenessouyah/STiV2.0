/* v526 — vidéo de correction du TP Train (Série 6 JavaScript).
   Contrôle la capsule livrée, ses sous-titres, son intégration dans le site
   (carte vidéo, catalogue d'accueil, lecteur partagé) et le cache hors-ligne. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (chemin) => readFileSync(join(root, chemin), 'utf8');
const existe = (chemin) => existsSync(join(root, chemin));

const VIDEO = 'assets/videos/tp-train-serie6.mp4';
const VTT = 'assets/subtitles/tp-train-serie6-fr.vtt';
const SLUG = 'tp-train-serie6';

/** Durée réelle de la vidéo, lue dans l'en-tête MP4 (aucune dépendance externe). */
function dureeMp4(chemin) {
  const tampon = readFileSync(join(root, chemin));
  // boîte moov → mvhd : timescale et durée
  const i = tampon.indexOf(Buffer.from('mvhd'));
  if (i === -1) return 0;
  const version = tampon[i + 4];
  const timescale = tampon.readUInt32BE(i + 4 + (version === 1 ? 20 : 12));
  const duree = version === 1
    ? Number(tampon.readBigUInt64BE(i + 4 + 24))
    : tampon.readUInt32BE(i + 4 + 16);
  return duree / timescale;
}

function horodatage(texte) {
  const [m, s] = texte.split(':');
  return Number(m) * 60 + Number(s);
}

function entreesVtt(contenu) {
  const sorties = [];
  const motif = /(\d+):(\d{2})\.(\d{3}) --> (\d+):(\d{2})\.(\d{3})/g;
  let m;
  while ((m = motif.exec(contenu))) {
    sorties.push({
      debut: Number(m[1]) * 60 + Number(m[2]) + Number(m[3]) / 1000,
      fin: Number(m[4]) * 60 + Number(m[5]) + Number(m[6]) / 1000,
    });
  }
  return sorties;
}

test('la capsule est livrée à côté des autres vidéos du site', () => {
  assert.ok(existe(VIDEO), 'MP4 présent');
  assert.ok(existe(VTT), 'sous-titres présents');
  const octets = statSync(join(root, VIDEO)).size;
  assert.ok(octets > 5_000_000, `MP4 trop léger : ${octets}`);
  assert.ok(octets < 120_000_000, `MP4 trop lourd : ${octets}`);
  const entete = readFileSync(join(root, VIDEO)).subarray(0, 32).toString('latin1');
  assert.match(entete, /ftyp/, 'en-tête MP4');
  assert.match(entete, /isom|mp42|avc1/, 'marque MP4');
});

test('la vidéo dure environ sept minutes et ses sous-titres la couvrent', () => {
  const duree = dureeMp4(VIDEO);
  assert.ok(duree > 400 && duree < 460, `durée inattendue : ${duree.toFixed(1)} s`);
  const vtt = lire(VTT);
  assert.ok(vtt.startsWith('WEBVTT'), 'en-tête WEBVTT');
  const entrees = entreesVtt(vtt);
  assert.ok(entrees.length >= 40, `seulement ${entrees.length} sous-titres`);
  let precedent = -1;
  for (const e of entrees) {
    assert.ok(e.debut >= precedent - 0.05, 'sous-titres ordonnés');
    assert.ok(e.fin > e.debut, 'fin après début');
    precedent = e.debut;
  }
  assert.equal(horodatage('7:07'), 427);
  assert.ok(entrees[entrees.length - 1].fin <= duree + 1, 'dernier sous-titre dans la vidéo');
});

test('l’onglet Vidéos du cours propose la capsule avec ses sous-titres', () => {
  const html = lire('cours/javascript.html');
  assert.match(html, new RegExp(`<video id="tabJsTrainVideo"[^>]*data-video-id="${SLUG}"`));
  assert.ok(html.includes(`<source src="../${VIDEO}"`), 'source MP4');
  assert.ok(html.includes(`<track kind="subtitles" src="../${VTT}"`), 'piste de sous-titres');
  assert.match(html, /SÉRIE 6 · TP TRAIN \(\d:\d{2}\)/);
  const debutSection = html.indexOf(`src="../${VIDEO}"`);
  const sectionVideos = html.lastIndexOf('<section', debutSection);
  assert.ok(html.slice(sectionVideos, sectionVideos + 200).includes('data-course-panel="videos"'),
    'la carte est dans l’onglet Vidéos');
  /* le corrigé du TP n’est pas dupliqué : une seule carte pour cette capsule */
  assert.equal(html.split(`src="../${VIDEO}"`).length - 1, 1);
});

test('la page d’accueil du TP propose la vidéo en quatrième carte', () => {
  const html = lire('exercices/javascript/TP Train/index.html');
  const article = html.slice(html.indexOf('article class="carte video"'));
  assert.ok(article.startsWith('article class="carte video"'), 'carte « vidéo »');
  assert.ok(article.slice(0, 1500).includes(`src="../../../${VIDEO}"`), 'source MP4');
  assert.ok(article.slice(0, 1500).includes(`src="../../../${VTT}"`), 'sous-titres');
  assert.match(article.slice(0, 1500), /<span class="etape">Partie 4<\/span>/);
  assert.match(html, /vidéo de correction<\/strong> : le diagramme/);
});

test('la Série 6 ouvre la vidéo depuis sa carte d’exercice', () => {
  const html = lire('cours/javascript.html');
  const carte = html.slice(html.indexOf('Série 6 — TP Train'));
  assert.match(carte.slice(0, 2000), /ouvrirVideoPasAPasSTI\('tp-train-serie6'/);
  assert.ok(carte.slice(0, 2000).includes('🎥 Vidéo de correction'));
});

test('le lecteur partagé connaît la capsule, ses chapitres et ses sous-titres', () => {
  const js = lire('assets/js/protection.js');
  assert.match(js, /var estTpTrain = \(sSlug === "tp-train-serie6"/);
  assert.match(js, /estTpTrain \? "tp-train-serie6"/, 'slug cible');
  assert.match(js, /estTpTrain \? prefixeAssetsSTI\(\) \+ "videos\/tp-train-serie6\.mp4"/);
  assert.match(js, /subtitles\/tp-train-serie6-fr\.vtt/);
  assert.match(js, /TP Train — correction détaillée \(Série 6 JavaScript\)/);

  const bloc = js.split('STI_CHAPITRES_MEDIA["tp-train-serie6"] = [')[1].split('];')[0];
  const temps = [...bloc.matchAll(/\{ t: ([\d.]+), short:/g)].map((m) => Number(m[1]));
  assert.equal(temps.length, 8, 'huit repères');
  assert.equal(temps[0], 0);
  for (let i = 1; i < temps.length; i += 1) assert.ok(temps[i] > temps[i - 1], 'repères croissants');
  const duree = dureeMp4(VIDEO);
  assert.ok(temps[temps.length - 1] < duree, 'dernier repère avant la fin');
  for (const titre of ['Les outils communs', 'Identité', 'Voyage et dates', 'Prix du billet', 'Captcha', 'Validation et envoi', 'Récapitulatif']) {
    assert.ok(bloc.includes(titre), titre);
  }
  assert.match(lire('assets/js/lecteur-commun.js'), /'tp-train-serie6': \['javascript'/);
});

test('l’accueil compte la nouvelle capsule dans son catalogue', () => {
  const js = lire('assets/js/app.js');
  const bloc = js.split('id: "tp-train-serie6"')[1].slice(0, 700);
  assert.ok(bloc.includes(`srcPrincipal: "${VIDEO}"`), 'source du catalogue');
  assert.match(bloc, /dureeTexte: "\d:\d{2}"/);
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
});

test('le cache hors-ligne embarque la vidéo sans téléchargement automatique', () => {
  const sw = lire('sw.js');
  assert.match(sw, /var UPDATE_ID = "v547-boucles-php-20261030"/);
  const delta = sw.split('var UPDATE_FILES = [')[1].split('];')[0];
  const offline = sw.split('var OFFLINE_LIST = [')[1].split('];')[0];
  for (const chemin of [VIDEO, VTT]) assert.ok(offline.includes(`"./${chemin}"`), chemin);
  assert.ok(!delta.includes(`"./${VIDEO}"`), 'la vidéo n’entre jamais dans le delta mobile');
  assert.ok(!delta.includes(`"./${VTT}"`), 'ni ses sous-titres');
  assert.match(delta, /url: "\.\/cours\/javascript\.html", revision: "boucles-v547"/);
  assert.match(delta, /url: "\.\/assets\/js\/protection\.js", revision: "boucles-v547"/);
  assert.match(delta, /url: "\.\/assets\/js\/app\.js", revision: "boucles-v547"/);
  assert.ok(sw.includes('var UPDATE_FILES = [') && sw.split('var UPDATE_FILES = [')[1].split('];')[0].split('{ url:').length - 1 <= 262);
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
  assert.doesNotMatch(manifeste.version, /^v525/);
});

test('le moteur de rendu reproduit la chronologie annoncée', () => {
  const script = join(root, 'outils', 'tpvid6', 'render.py');
  assert.ok(existsSync(script), 'moteur présent');
  for (const fichier of ['theme.py', 'contenu.py', 'dessin.py', 'narration.py', 'montage.py', 'integrer.py', 'README.md']) {
    assert.ok(existsSync(join(root, 'outils', 'tpvid6', fichier)), fichier);
  }
  const contenu = lire('outils/tpvid6/contenu.py');
  for (const fonction of ['demanderNom', 'emailValide', 'identite', 'typeVoyage', 'voyage', 'prix', 'nouveauCode', 'verifierCaptcha', 'aide', 'verif', 'reserver']) {
    assert.ok(contenu.includes(`function ${fonction}`), `code du corrigé : ${fonction}()`);
  }
  /* les six chapitres et les deux temps d’affichage */
  assert.equal((contenu.match(/"onglet":/g) || []).length, 6, 'six parties');
  const render = lire('outils/tpvid6/render.py');
  assert.match(render, /ZONE1|box_diag|COMPACT_X1/, 'les deux lignes de l’écran');
  assert.ok(render.includes('compact'), 'repli du diagramme');
  const calage = JSON.parse(lire('outils/tpvid6/calage.json'));
  const duree = dureeMp4(VIDEO);
  assert.ok(Math.abs(calage.total - duree) < 3, 'chronologie calée sur la voix off');
});
