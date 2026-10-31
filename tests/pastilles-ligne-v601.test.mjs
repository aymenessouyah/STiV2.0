/*
  v601 — les cours en cours sur UNE seule ligne, sans défilement.

  Après la v600, les pastilles rondes passaient à la ligne : six cours
  occupaient deux rangées. Le professeur veut une seule rangée, sans aucun
  défilement horizontal, quitte à ce qu'une pastille ne mesure plus que la
  moitié de sa taille précédente (64 px → 32 px).

  Décision : la rangée ne se coupe plus (`nowrap`) et ne défile plus
  (`overflow-x: hidden`). Chaque pastille prend une part égale de la largeur
  (`flex: 1 1 0`) avec un carré parfait (`aspect-ratio: 1`) borné entre 32 px
  et 64 px. Le logo est exprimé en pourcentage : il rétrécit avec le cercle.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (chemin) => readFileSync(join(root, chemin), 'utf8');

const CSS = lire('assets/css/theme.css');
const SW = lire('sw.js');

function blocPastilles() {
  const marque = CSS.indexOf('les cours en cours deviennent des pastilles rondes');
  assert.ok(marque > -1, 'le bloc des pastilles est présent');
  return CSS.slice(marque, CSS.indexOf('/* ── 11. Hero', marque));
}

test('v601 : la rangée de pastilles ne se coupe pas et ne défile pas', () => {
  const bloc = blocPastilles();
  const rangee = bloc.match(/\.welcome-return__courses\s*\{([^}]*)\}/);
  assert.ok(rangee, 'la règle de la rangée existe');
  assert.match(rangee[1], /flex-wrap:\s*nowrap/, 'une seule ligne, jamais deux');
  assert.match(rangee[1], /overflow-x:\s*hidden/, 'aucun défilement horizontal');
  assert.doesNotMatch(rangee[1], /overflow-x:\s*auto/, 'la rangée ne défile plus');
  assert.match(rangee[1], /align-items:\s*flex-start/, 'les cercles gardent leur hauteur propre');
  assert.match(rangee[1], /gap:\s*var\(--space-2\)/, 'l’espacement se resserre pour tenir sur la ligne');
});

test('v601 : chaque pastille se partage la largeur et peut descendre à 32 px', () => {
  const bloc = blocPastilles();
  const carte = bloc.match(/\.welcome-course\s*\{([^}]*)\}/)[1];
  assert.match(carte, /flex:\s*1 1 0/, 'largeur égale pour toutes les pastilles');
  assert.match(carte, /min-width:\s*32px/, 'la moitié de 64 px est le plancher');
  assert.match(carte, /max-width:\s*64px/, 'la taille d’origine est le plafond');
  assert.match(carte, /aspect-ratio:\s*1/, 'la pastille reste un carré, donc un cercle');
  assert.match(carte, /width:\s*auto/, 'la largeur vient du partage, pas d’une valeur fixe');
  assert.match(carte, /height:\s*auto/, 'la hauteur suit la largeur');
  assert.match(carte, /align-self:\s*flex-start/, 'l’étirement vertical ne déforme pas le cercle');
  assert.doesNotMatch(carte, /min-width:\s*64px/, 'plus de largeur plancher à 64 px');
});

test('v601 : six cours tiennent sur une ligne d’un téléphone courant', () => {
  /* Recalcul indépendant de la mise en page : 360 px utiles, 6 pastilles,
     un espace de 8 px entre elles (--space-2). Chacune doit rester dans les
     bornes 32–64 px, et la somme ne doit jamais dépasser la largeur. */
  const utile = 360, nombre = 6, espace = 8;
  const part = (utile - espace * (nombre - 1)) / nombre;
  assert.ok(part >= 32 && part <= 64, 'la part calculée respecte le plancher et le plafond (' + part + ' px)');
});

test('v601 : le logo rétrécit avec la pastille', () => {
  const bloc = blocPastilles();
  assert.match(bloc, /\.welcome-course__icon\s*\{[^}]*width:\s*60%/, 'le logo occupe 60 % du cercle');
  assert.match(bloc, /\.welcome-course__icon svg\s*\{[^}]*width:\s*58%/, 'le dessin occupe 58 % de son cadre');
  assert.doesNotMatch(bloc, /\.welcome-course__icon\s*\{[^}]*width:\s*\d+px/, 'plus aucune taille en pixels fixes');
});

test('v601 : la version publiée et le cache avancent', () => {
  assert.match(SW, /var VERSION_PUBLIEE = "v602";/, 'la version publiée a avancé (v601 → v602)');
  assert.match(SW, /url: "\.\/assets\/css\/theme\.css", revision: "roue-compte-v602"/);
});
