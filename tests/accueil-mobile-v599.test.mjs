/*
  v599 — le bloc « Bonjour » sur téléphone.

  Constat sur une capture d'écran (720 × 1604) : le bloc « Bonjour, … » et tout
  le contenu de l'accueil s'arrêtaient au trois quarts de la largeur, le reste
  de l'écran n'affichant que le fond de page ; à l'intérieur, les cartes de
  reprise étaient tronquées en « Syst… », « Cours … », et le badge « Consulté »
  était rogné. La barre de navigation du bas, elle, occupait bien toute la
  largeur — signe que le rétrécissement touchait le document (largeur héritée
  des outils PC « Console JS » / « Deux vues ») et non la barre fixe.

  Ce test verrouille les deux corrections :
    1. les cours récents s'empilent sur toute la largeur du téléphone, sans
       défilement horizontal ni texte coupé ;
    2. la page reprend la largeur de l'écran dès qu'aucun panneau d'outil PC
       n'est ouvert (CSS `:has()` + garde-fou JS au chargement).
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (chemin) => readFileSync(join(root, chemin), 'utf8');

const CSS = lire('assets/css/theme.css');
const APP = lire('assets/js/app.js');
const ACCUEIL = lire('index.html');
const SW = lire('sw.js');

/* Isole le bloc `@media (max-width: 700px)` qui replie les cartes de cours. */
function blocMobileCartes() {
  const marque = CSS.indexOf('le bloc « Bonjour » tient dans la largeur du téléphone');
  assert.ok(marque > -1, 'le commentaire v599 du bloc « Bonjour » est présent');
  const fin = CSS.indexOf('\n}\n', CSS.indexOf('@media (max-width: 700px)', marque));
  assert.ok(fin > marque, 'le bloc média mobile se termine');
  return CSS.slice(marque, fin);
}

test('v599 : sur téléphone, les cours récents s’empilent au lieu de défiler', () => {
  const bloc = blocMobileCartes();
  assert.match(bloc, /\.welcome-return__courses\s*\{[^}]*flex-wrap:\s*wrap/,
    'la bande de cours passe à la ligne');
  assert.match(bloc, /\.welcome-return__courses\s*\{[^}]*overflow-x:\s*visible/,
    'plus de ruban horizontal à faire défiler');
  assert.match(bloc, /\.welcome-course\s*\{[^}]*min-width:\s*min\(210px,\s*100%\)/,
    'une carte ne dépasse jamais la largeur de l’écran');
  assert.match(bloc, /\.welcome-course\s*\{[^}]*max-width:\s*100%/,
    'aucune carte plus large que son conteneur');
});

test('v599 : les titres et l’état des cartes ne sont plus coupés', () => {
  const bloc = blocMobileCartes();
  assert.match(bloc, /\.welcome-course__title,\s*\.welcome-course__details\s*\{[^}]*white-space:\s*normal/,
    'les libellés reviennent à la ligne au lieu d’être tronqués');
  assert.match(bloc, /text-overflow:\s*clip/, 'plus de points de suspension en plein mot');
  assert.match(bloc, /overflow-wrap:\s*anywhere/, 'un mot long se coupe proprement');
});

test('v599 : la page reprend toute la largeur quand aucun panneau PC n’est ouvert', () => {
  const marque = CSS.indexOf('garde-fou de largeur du document');
  assert.ok(marque > -1, 'le garde-fou CSS est documenté');
  const bloc = CSS.slice(marque, marque + 1200);
  assert.match(bloc, /@media \(max-width:\s*900px\)/, 'le garde-fou vise les petits écrans');
  assert.match(bloc, /html:not\(:has\(#sti-split-view-panel\)\):not\(:has\(#sti-browser-console-panel\)\)/,
    'il s’efface dès qu’un panneau d’outil est affiché');
  assert.match(bloc, /width:\s*100%\s*!important/, 'la largeur de l’écran redevient la référence');
  assert.match(bloc, /max-width:\s*100%\s*!important/, 'aucune largeur maximale ne subsiste');
});

test('v599 : le garde-fou JS efface une largeur ou un zoom orphelins', () => {
  assert.match(APP, /function assainirLargeurDocument\(\)/, 'la fonction de nettoyage existe');
  const debut = APP.indexOf('function assainirLargeurDocument()');
  const bloc = APP.slice(debut, debut + 1600);
  assert.match(bloc, /document\.getElementById\("sti-split-view-panel"\)/, 'il reconnaît le panneau « Deux vues »');
  assert.match(bloc, /document\.getElementById\("sti-browser-console-panel"\)/, 'il reconnaît la console JS');
  assert.match(bloc, /racine\.style\.width = ""/, 'la largeur en ligne est effacée');
  assert.match(bloc, /racine\.style\.overflowX = ""/, 'le blocage du défilement horizontal est effacé');
  assert.match(bloc, /corps\.style\.zoom = ""/, 'un zoom hérité d’un outil PC est neutralisé sur téléphone');

  assert.match(APP, /surveillerLargeurDocument\(\);\s*\n\s*estimerLectureCours\(\)/,
    'le nettoyage tourne au démarrage de chaque page');
  const veille = APP.indexOf('function surveillerLargeurDocument()');
  const blocVeille = APP.slice(veille, veille + 600);
  for (const evt of ['pageshow', 'visibilitychange', 'resize']) {
    assert.ok(blocVeille.includes(evt), 'le nettoyage se répète sur « ' + evt + ' »');
  }
});

test('v599 : l’accueil garde ses repères et le service worker saute de version', () => {
  assert.match(ACCUEIL, /<section class="welcome-return" id="welcomeReturn"/);
  assert.match(ACCUEIL, /id="welcomeCourses"/);
  assert.match(ACCUEIL, /id="resumeBanner"/);
  assert.match(SW, /var VERSION_PUBLIEE = "v599";/, 'la version publiée passe à v599');
  assert.match(SW, /accueil-mobile-v599/, 'le lot de mise à jour est déclaré');
});
