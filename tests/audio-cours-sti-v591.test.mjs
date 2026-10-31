/*
  v591 — le cours « Systèmes, technologies et Internet » se donne aussi à écouter.

  Constat : la plateforme comptait 33 vidéos pour 16 pistes audio, et le cours STI
  — le tout premier cours de 3ᵉ SI, celui qui précède HTML5 — n'avait aucune
  version audio. Trois chapitres sont désormais lus à voix haute (la même voix
  masculine que les capsules), accessibles depuis la page du cours.

  Ce fichier vérifie que les fichiers existent réellement, qu'ils sont annoncés
  dans la page, servis hors ligne et présents dans le manifeste du build.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const lire = (p) => readFileSync(resolve(root, p), 'utf8');
const taille = (p) => statSync(resolve(root, p)).size;

const PISTES = ['cours-sti-ch1', 'cours-sti-ch2', 'cours-sti-ch3'];
const page = lire('cours/systemes-technologies-internet.html');

test('v591 : les trois chapitres audio existent et ne sont pas vides', () => {
  for (const slug of PISTES) {
    const chemin = 'assets/audio/' + slug + '.mp3';
    const octets = taille(chemin);
    assert.ok(octets > 200000, chemin + ' doit peser plus de 200 Ko (' + octets + ')');
    const entete = readFileSync(resolve(root, chemin)).subarray(0, 3).toString('latin1');
    /* ID3 (avec étiquette) ou synchro de trame MPEG (0xFF 0xEx/0xFx). */
    const mp3 = entete.startsWith('ID3') || (entete.charCodeAt(0) === 0xff && (entete.charCodeAt(1) & 0xe0) === 0xe0);
    assert.ok(mp3, chemin + ' doit être un vrai MP3');
  }
});

test('v591 : la page du cours propose l’écoute des trois chapitres', () => {
  assert.match(page, /id="audio-cours"/, 'la section d’écoute est présente');
  assert.match(page, /<audio id="stiCoursAudio"[^>]+src="\.\.\/assets\/audio\/cours-sti-ch1\.mp3"/,
    'le lecteur démarre sur le chapitre 1');
  for (const slug of PISTES) {
    assert.ok(page.includes('"cours-sti-' + slug.slice(-3) + '.mp3"') || page.includes(slug + '.mp3'),
      'la page doit citer ' + slug);
  }
  const boutons = page.match(/data-sti-audio="ch[123]"/g) || [];
  assert.equal(boutons.length, 3, 'trois boutons de chapitre');
  /* v593 : l'accès direct est devenu un bouton (il ouvre la section et lance le
     chapitre 1), comme « Écouter le cours » du cours HTML5. */
  assert.match(page, /<button type="button" class="btn btn-secondary" id="heroListenBtn">[^<]*Écouter le cours/,
    'un accès direct depuis l’en-tête du cours');
  assert.match(page, /<p class="sti-audio-statut" id="stiAudioStatut" aria-live="polite">/,
    'le chapitre en cours est annoncé aux lecteurs d’écran');
});

test('v591 : les pistes sont servies hors ligne sans alourdir le delta', () => {
  const sw = lire('sw.js');
  /* Règle du service worker : les médias lourds vivent dans le cache complet
     (OFFLINE_LIST), jamais dans le delta ni dans la coquille de démarrage. */
  const iShell = sw.indexOf('var SHELL = [');
  const iOffline = sw.indexOf('var OFFLINE_LIST = [');
  assert.ok(iShell > 0 && iOffline > iShell, 'les deux listes existent');
  for (const slug of PISTES) {
    const chemin = './assets/audio/' + slug + '.mp3';
    assert.ok(sw.includes('"' + chemin + '"'), chemin + ' doit figurer dans le cache complet');
    const position = sw.indexOf('"' + chemin + '"');
    assert.ok(position > iOffline, chemin + ' appartient au cache complet, pas au delta ni à la coquille');
    assert.equal(sw.indexOf('url: "' + chemin + '"'), -1, chemin + ' reste hors du delta');
  }
  /* La page et sa feuille de style changent aussi : elles doivent être réinvalidées. */
  assert.match(sw, /url: "\.\/cours\/systemes-technologies-internet\.html", revision: "cours-sti-v596", refreshIfCached: true/);
  assert.match(sw, /url: "\.\/assets\/css\/cours-sti\.css", revision: "cours-sti-v595"/);
});

test('v591 : le manifeste hors ligne connaît les pistes et leur empreinte', () => {
  const manifeste = JSON.parse(lire('offline-complete-manifest.json'));
  const parChemin = new Map(manifeste.files.map((f) => [f.path, f]));
  for (const slug of PISTES) {
    const chemin = 'assets/audio/' + slug + '.mp3';
    const fiche = parChemin.get(chemin);
    assert.ok(fiche, chemin + ' doit être dans le manifeste');
    assert.equal(fiche.bytes, taille(chemin), 'taille exacte pour ' + chemin);
  }
});

test('v591 : la page reste valide (lecteur sans dépendance externe)', () => {
  assert.doesNotMatch(page, /<audio[^>]+src="https?:/, 'aucune piste distante');
  assert.match(page, /media-src 'self' blob:/, 'la CSP autorise bien les médias locaux');
  assert.ok(page.includes('cours-sti.css?v=595'), 'la feuille de style est réinvalidée');
});
