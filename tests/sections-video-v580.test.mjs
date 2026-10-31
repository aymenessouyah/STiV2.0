/* v580 — les dix sections de la vidéo du cours sont des boutons.
   ─────────────────────────────────────────────────────────────────────────
   Avant : une liste morte. L'élève lisait « 6:00 · IP, masque, DNS et
   adresse MAC » mais devait retrouver lui-même la minute dans le lecteur.

   Maintenant : chaque section est un bouton qui ouvre le lecteur à son
   instant. Ce fichier vérifie le contrat entre trois fichiers :
     • cours/systemes-technologies-internet.html  (les boutons)
     • assets/js/protection.js                    (les repères réels)
     • assets/js/lecteur-commun.js                (le clic qui démarre)
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (chemin) => readFileSync(join(root, chemin), 'utf8');

const PAGE = lire('cours/systemes-technologies-internet.html');
const PROTECTION = lire('assets/js/protection.js');
const LECTEUR = lire('assets/js/lecteur-commun.js');
const CSS = lire('assets/css/cours-sti.css');

const mmss = (s) => Math.floor(Math.round(s) / 60) + ':' + String(Math.round(s) % 60).padStart(2, '0');

/* Les repères officiels, lus dans le lecteur : une seule source de vérité. */
function reperes() {
  const entete = 'STI_CHAPITRES_MEDIA["cours-sti"] = [';
  const i = PROTECTION.indexOf(entete);
  assert.ok(i !== -1, 'les chapitres du cours sont dans le lecteur');
  const bloc = PROTECTION.slice(i, i + PROTECTION.slice(i).indexOf('];'));
  return [...bloc.matchAll(/\{ t: ([\d.]+),/g)].map((m) => Number(m[1]));
}

/* Les boutons de la page, dans l'ordre d'affichage. */
function boutons() {
  return [...PAGE.matchAll(/<button type="button" class="sti-section" data-video-open="cours-sti" data-video-start="([\d.]+)"[\s\S]*?aria-label="([^"]+)"/g)]
    .map((m) => ({ start: Number(m[1]), label: m[2] }));
}

test('v580 : les dix sections sont des boutons, dans l’ordre de la vidéo', () => {
  const liste = boutons();
  assert.equal(liste.length, 10, 'dix boutons, un par section de la vidéo');
  assert.deepEqual(liste.map((b) => b.start), reperes(),
    'chaque bouton démarre exactement au repère du lecteur');
  for (let i = 1; i < liste.length; i += 1) {
    assert.ok(liste[i].start > liste[i - 1].start, 'les sections avancent dans la vidéo');
  }
  /* Première section tout au début, dernière sur la fiche de synthèse. */
  assert.ok(liste[0].start < 2);
  assert.equal(mmss(liste[liste.length - 1].start), '11:45', 'la fiche de synthèse est à 11:45');
  /* Les anciens <li> de texte ne doivent pas rester en double. */
  assert.doesNotMatch(PAGE, /<li>Bienvenue — le cours qui précède le Web<\/li>/,
    'la liste morte a disparu');
});

test('v580 : chaque bouton annonce sa minute et son chapitre à la voix', () => {
  for (const bouton of boutons()) {
    assert.ok(bouton.label.startsWith('Lire la vidéo à ' + mmss(bouton.start)),
      'le libellé commence par la minute : ' + bouton.label);
    assert.match(bouton.label, /(Ouverture|Chapitre [123]|Fiche de synthèse)/,
      'le libellé nomme le chapitre : ' + bouton.label);
  }
  /* Le temps affiché à l'écran est aussi la minute réelle. */
  const affiches = [...PAGE.matchAll(/<span class="sti-section__temps">([\d:]+)<\/span>/g)].map((m) => m[1]);
  assert.deepEqual(affiches, reperes().map(mmss), 'la pastille de temps est juste');
});

test('v580 : le lecteur commun démarre bien à l’instant demandé', () => {
  assert.match(LECTEUR, /\[data-video-open\][\s\S]{0,120}data-video-start/,
    'le clic lit data-video-open puis data-video-start');
  assert.ok(LECTEUR.includes('function lancer(slug, temps, plein)'), 'un seul chemin de lancement');
  assert.ok(LECTEUR.includes("'cours-sti': ['sti',"), 'le slug du cours est connu du lecteur');
  /* Le lecteur historique accepte le troisième argument « seconde de départ ». */
  assert.ok(PROTECTION.includes('window.top.ouvrirVideoPasAPasSTI(slugCible, titreOpt, startSecOpt)'));
});

test('v580 : boutons utilisables au clavier, sur téléphone et à l’impression', () => {
  const details = PAGE.slice(PAGE.indexOf('<details class="sti-sections-video'));
  assert.ok(details.includes('<ol class="sti-sections-video__liste">'), 'une liste ordonnée de boutons');
  assert.ok(!/<a [^>]*data-video-open/.test(details), 'des boutons, pas des liens qui rechargent la page');
  assert.ok(!/onclick=/.test(details), 'aucun gestionnaire en ligne : tout passe par lecteur-commun.js');

  assert.match(CSS, /\.sti-section:focus-visible\s*\{[^}]*outline:/, 'un contour net au clavier');
  assert.match(CSS, /@media \(max-width: 480px\)/, 'une mise en page pour téléphone étroit');
  assert.match(CSS, /@media print[\s\S]{0,200}\.sti-section/, 'une version imprimable');
  assert.match(CSS, /prefers-reduced-motion[\s\S]{0,200}\.sti-section/, 'aucun mouvement imposé');
  /* Aucune couleur codée en dur dans la feuille du cours. */
  assert.doesNotMatch(CSS.split('.sti-sections-video')[1] || '', /#[0-9a-fA-F]{3,6}\b/,
    'les sections n’inventent pas de couleurs');
});

test('v580 : la feuille du cours est versionnée et suit les sections', () => {
  assert.ok(PAGE.includes('cours-sti.css?v=591'), 'la feuille est appelée avec sa nouvelle version (v591 : audio du cours)');
  const sw = lire('sw.js');
  assert.match(sw, /url: "\.\/assets\/css\/cours-sti\.css", revision: "sti-audio-v591"/);
});
