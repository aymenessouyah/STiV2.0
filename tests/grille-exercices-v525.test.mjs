import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const racine = resolve(new URL('..', import.meta.url).pathname);
const lire = chemin => readFileSync(resolve(racine, chemin), 'utf8');

const html = lire('cours/javascript.html');
const css = lire('assets/css/cours-javascript.css');
const sw = lire('sw.js');

/* Consigne auteur (v525) : « mettre les exercices 01 jusqu'à 6 dans une grille ». */
test('v525 : les six groupes EXERCICE 01…06 sont réunis dans une grille', () => {
  assert.equal((html.match(/<div class="js-exercise-grid">/g) || []).length, 1,
    'un seul conteneur de grille');
  const bloc = html.slice(html.indexOf('<div class="js-exercise-grid">'), html.indexOf('<section class="js-series"'));
  assert.equal((bloc.match(/<section class="js-exercise-group"/g) || []).length, 6,
    'les six groupes doivent être dans la grille');
  assert.equal((bloc.match(/<\/section>/g) || []).length, 6,
    'la grille doit refermer exactement six sections');
  /* Les six groupes restent, dans l’ordre, avec leurs ancres et leurs libellés. */
  const ids = [...bloc.matchAll(/<section class="js-exercise-group" id="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(ids, ['exo-conditions', 'exo-boucles', 'exo-chaines', 'exo-tableaux', 'exo-math-date', 'exo-dom']);
  const libelles = [...bloc.matchAll(/<span class="source-accent">(EXERCICE 0[1-6])<\/span>/g)].map(m => m[1]);
  assert.deepEqual(libelles, ['EXERCICE 01', 'EXERCICE 02', 'EXERCICE 03', 'EXERCICE 04', 'EXERCICE 05', 'EXERCICE 06']);
  /* Les 27 exercices sont tous dans la grille, aucune perte au passage. */
  assert.equal((bloc.match(/class="js-exercise"/g) || []).length, 27);
  assert.equal((html.match(/class="js-exercise"/g) || []).length, 27);
  /* La section « Séries, défis et projets » et sa grille restent hors du conteneur. */
  assert.ok(html.indexOf('<section class="js-series"') > html.indexOf('</div>\n\n<section class="js-series"') - 1);
  assert.match(html, /<div class="js-series-grid">/);
});

test('v525 : la grille est responsive et les cartes restent lisibles', () => {
  assert.match(css, /\.js-exercise-grid \{[^}]*display: grid;/);
  assert.match(css, /\.js-exercise-grid \{[^}]*grid-template-columns: minmax\(0, 1fr\);/,
    'une seule colonne par défaut (téléphone)');
  const media = css.slice(css.indexOf('@media (min-width: 900px)'), css.indexOf('.js-exercise-grid .js-exercise-group'));
  assert.match(media, /\.js-exercise-grid \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\); \}/,
    'deux colonnes dès 900 px');
  /* Chaque groupe devient une carte, et l’exercice interne perd son ombre. */
  assert.match(css, /\.js-exercise-grid \.js-exercise-group \{[^}]*border: 1px solid var\(--border\);/);
  assert.match(css, /\.js-exercise-grid \.js-exercise-group \{[^}]*border-radius: var\(--radius-lg\);/);
  assert.match(css, /\.js-exercise-grid \.js-exercise-group \{[^}]*align-content: start;/,
    'le contenu reste en haut de la carte');
  assert.match(css, /\.js-exercise-grid \.js-exercise \{ background: var\(--bg-alt\); box-shadow: none; \}/);
  /* Le numéro du groupe devient une pastille. */
  assert.match(css, /\.js-exercise-grid \.js-exercise-group__head \.source-accent \{[^}]*border-radius: var\(--radius-full\);/);
  /* Aucune couleur en dur : uniquement les jetons du thème. */
  const bloc = css.slice(css.indexOf('/* ── v525'), css.indexOf('.js-series-grid'));
  assert.doesNotMatch(bloc, /#[0-9a-f]{3,8}\b/i, 'couleurs issues des variables du thème');
});

test('v525 : la grille est livrée hors ligne et son empreinte est exacte', () => {
  assert.match(sw, /var UPDATE_ID = "v553-defilement-passif-20261030"/);
  const delta = sw.split('var UPDATE_FILES = [')[1].split('];')[0];
  assert.match(delta, /url: "\.\/assets\/css\/cours-javascript\.css", revision: "barre-mobile-v532"/);
  assert.match(delta, /url: "\.\/cours\/javascript\.html", revision: "etiquette-relief-v572", refreshIfCached: true/);
  for (const bloc of ['SHELL', 'OFFLINE_LIST']) {
    const contenu = sw.split('var ' + bloc + ' = [')[1].split('];')[0];
    assert.ok(contenu.includes('"./assets/css/cours-javascript.css"'), bloc + ' : feuille de style');
    assert.ok(contenu.includes('"./cours/javascript.html"'), bloc + ' : page du cours');
  }
  const manifeste = JSON.parse(lire('offline-complete-manifest.json'));
  assert.equal(manifeste.version, 'v553-sti-atelier-v386');
  assert.equal(manifeste.totalFiles, manifeste.files.length);
  assert.equal(manifeste.totalBytes, manifeste.files.reduce((n, f) => n + f.bytes, 0));
  for (const chemin of ['cours/javascript.html', 'assets/css/cours-javascript.css', 'sw.js']) {
    const entree = manifeste.files.find(f => f.path === chemin);
    assert.ok(entree, chemin);
    const data = readFileSync(resolve(racine, chemin));
    assert.equal(entree.bytes, data.length, chemin);
    assert.equal(entree.gitSha,
      createHash('sha1').update(`blob ${data.length}`).update(Buffer.from([0])).update(data).digest('hex'), chemin);
  }
});
