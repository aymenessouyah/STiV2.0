/*
  v600 — les cours en cours de l'accueil, en pastilles rondes sur téléphone.

  Sur la capture du 31/10, les six cours s'affichaient en grandes cartes
  empilées : les pastilles flottantes (roue, éclair, écran, boîte) passaient
  par-dessus les badges « Consulté », et le bloc occupait tout l'écran.

  Décision : sur téléphone (≤ 700 px), chaque cours n'est plus qu'un cercle de
  64 px de la couleur de sa matière, avec son seul logo au centre. Le nom du
  cours et la progression restent dans le document (lecteurs d'écran) et dans
  l'infobulle ; l'écran de bureau ne change pas.
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
const SW = lire('sw.js');

/* Isole le bloc `@media (max-width: 700px)` qui dessine les pastilles. */
function blocPastilles() {
  const marque = CSS.indexOf('les cours en cours deviennent des pastilles rondes');
  assert.ok(marque > -1, 'le commentaire v600 des pastilles est présent');
  const fin = CSS.indexOf('/* ── 11. Hero', marque);
  assert.ok(fin > marque, 'le bloc média des pastilles se termine avant la section Hero');
  return CSS.slice(marque, fin);
}

test('v600 : chaque cours devient un cercle', () => {
  const bloc = blocPastilles();
  assert.match(bloc, /\.welcome-return__courses\s*\{[^}]*gap:/, 'les pastilles sont espacées régulièrement');
  const carte = bloc.match(/\.welcome-course\s*\{([^}]*)\}/);
  assert.ok(carte, 'la règle .welcome-course existe dans le bloc mobile');
  assert.match(carte[1], /max-width:\s*64px/, 'la pastille ne dépasse pas sa taille d’origine');
  assert.match(carte[1], /aspect-ratio:\s*1/, 'la largeur impose la hauteur : le cercle reste rond');
  assert.match(carte[1], /padding:\s*0/, 'le cercle n’a pas de rembourrage interne');
  assert.match(carte[1], /border-radius:\s*var\(--radius-full\)/, 'la forme est un cercle');
});

test('v600 : le cercle ne contient que le logo du cours', () => {
  const bloc = blocPastilles();
  const couverture = bloc.match(/\.welcome-course__cover\s*\{([^}]*)\}/);
  assert.ok(couverture, 'la pastille colore son fond avec la couverture');
  assert.match(couverture[1], /border-radius:\s*var\(--radius-full\)/, 'la couverture est ronde elle aussi');
  assert.match(couverture[1], /width:\s*100%/, 'le fond occupe tout le cercle');
  assert.match(bloc, /\.welcome-course__icon\s*\{[^}]*width:\s*60%/, 'le logo suit la taille du cercle');
  assert.match(bloc, /\.welcome-course__icon svg\s*\{[^}]*width:\s*58%/, 'le dessin du logo suit son cadre');

  /* Le texte reste dans le document, simplement invisible à l'écran. */
  const texte = bloc.match(/\.welcome-course__body,\s*\n?\s*\.welcome-course__state\s*\{([^}]*)\}/);
  assert.ok(texte, 'les textes sont traités ensemble');
  assert.match(texte[1], /position:\s*absolute/, 'le texte quitte le flux visuel');
  assert.match(texte[1], /width:\s*1px/, 'il est réduit à un pixel');
  assert.match(texte[1], /clip-path:\s*inset\(50%\)/, 'il est découpé hors de la vue');
  assert.doesNotMatch(texte[1], /display:\s*none/, 'il n’est pas supprimé : les lecteurs d’écran le lisent');
});

test('v600 : chaque pastille annonce son cours et sa progression', () => {
  const debut = APP.indexOf('var lienActif = document.activeElement');
  const bloc = APP.slice(debut, debut + 2000);
  assert.match(bloc, /title="' \+ echapperHtml\(c\.titre\)/, 'l’infobulle donne le nom du cours');
  assert.match(bloc, /aria-label="' \+ echapperHtml\(c\.titre\)/, 'le lecteur d’écran reçoit un libellé complet');
  assert.match(bloc, /consultés"/, 'la progression figure dans l’infobulle');
  assert.match(bloc, /' chapitre' \+ \(c\.consultes > 1 \? 's' : ''\)/, 'l’accord au pluriel est respecté');
  assert.match(bloc, /class="welcome-course welcome-course--' \+ c\.id \+ '"/, 'la classe du cours reste posée');
});

test('v600 : l’ordinateur garde ses cartes complètes', () => {
  /* Les règles de pastille vivent dans un bloc média : hors de lui, la carte
     rectangulaire d’origine est intacte. */
  const avant = CSS.slice(0, CSS.indexOf('les cours en cours deviennent des pastilles rondes'));
  const cartePc = avant.match(/\.welcome-course\s*\{([^}]*)\}/)[1];
  assert.match(cartePc, /min-width:\s*210px/, 'la carte de bureau garde sa largeur minimale');
  assert.match(cartePc, /max-width:\s*340px/, 'la carte de bureau garde sa largeur maximale');
  assert.doesNotMatch(cartePc, /border-radius:\s*var\(--radius-full\)/, 'la carte de bureau reste rectangulaire');
});

test('v600 : la version publiée et le cache avancent', () => {
  assert.match(SW, /var VERSION_PUBLIEE = "v604";/, 'la version publiée passe à v600');
  assert.match(SW, /url: "\.\/assets\/css\/theme\.css", revision: "roue-compte-v602"/);
  assert.match(SW, /url: "\.\/assets\/js\/app\.js", revision: "roue-compte-v602"/);
});
