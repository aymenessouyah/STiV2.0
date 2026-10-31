/*
  v596 — le pictogramme de la matière « Systèmes, technologies et Internet ».

  v594 avait posé l'illustration fournie par le professeur en PNG : un carré
  blanc au milieu d'un thème sombre, à côté de cinq pictogrammes vectoriels.
  v596 la redessine dans `matieres.svg`, comme HTML5, CSS3, JavaScript, SQL et
  PHP : même grille de 48, même currentColor, même lecture à 20 px.

  Ces tests empêchent le retour d'une image bitmap isolée et vérifient que le
  symbole reste homogène avec les cinq autres.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (chemin) => readFileSync(join(root, chemin), 'utf8');

const SPRITE = 'assets/icons/matieres.svg';
const COURS = 'cours/systemes-technologies-internet.html';
const ATELIERS = [
  'exercices/systemes/index.html',
  'exercices/systemes/atelier-1-systemes-exploitation.html',
  'exercices/systemes/atelier-2-reseaux.html',
  'exercices/systemes/atelier-3-machine-virtuelle.html',
  'exercices/systemes/atelier-4-objets-connectes.html',
];

/* Le contenu d'un <symbol> donné, sans son en-tête. */
function symbole(id) {
  const sprite = lire(SPRITE);
  const debut = sprite.indexOf('<symbol id="' + id + '"');
  assert.notEqual(debut, -1, 'le symbole ' + id + ' existe');
  const fin = sprite.indexOf('</symbol>', debut);
  return sprite.slice(debut, fin);
}

test('v596 : la matière « Systèmes » a son pictogramme dans le sprite commun', () => {
  const sti = symbole('sti');
  /* Les six matières se dessinent de la même façon : viewBox 48, couleur héritée. */
  assert.match(sti, /viewBox="0 0 48 48"/);
  assert.match(sti, /fill="currentColor"/);
  /* Les creux utilisent la couleur de surface, comme les cinq autres symboles. */
  assert.match(sti, /var\(--surface-solid\)/);
  for (const autre of ['html5', 'css3', 'javascript', 'sql', 'php']) {
    assert.match(symbole(autre), /viewBox="0 0 48 48"/, autre + ' : même grille');
  }
  /* Aucune couleur figée dans le dessin : il suit le thème clair / sombre. */
  const dessin = sti.replace(/<symbol[^>]*>/, '');
  assert.doesNotMatch(dessin, /#[0-9a-fA-F]{3,8}\b/, 'aucune couleur codée en dur');
  assert.doesNotMatch(dessin, /\brgba?\(/i, 'aucune couleur codée en dur');
});

test('v596 : le pictogramme remplace partout l’ancienne image bitmap', () => {
  /* L'accueil : la carte du cours se dessine comme les cinq autres. */
  const accueil = lire('index.html');
  const carte = accueil.slice(accueil.indexOf('data-subject="sti"'));
  const corpsCarte = carte.slice(0, carte.indexOf('</article>'));
  assert.match(corpsCarte, /<svg class="matiere-logo"[^>]*><use href="assets\/icons\/matieres\.svg#sti">/);
  assert.ok(!corpsCarte.includes('systemes-technologies-internet-96.png'), 'plus aucun PNG dans la carte');

  /* Aucune page du site ne référence encore les fichiers retirés de l'interface. */
  for (const page of [COURS, ...ATELIERS]) {
    const html = lire(page);
    assert.ok(!html.includes('systemes-technologies-internet-96.png') && !html.includes('systemes-technologies-internet.png'),
      page + ' : plus aucun PNG');
    const profil = page.startsWith('cours/') ? '../' : '../../';
    assert.ok(html.includes('<use href="' + profil + 'assets/icons/matieres.svg#sti"></use>'),
      page + ' : le pictogramme est appelé');
  }

  /* Le cours et les ateliers portent, comme les autres cours, le logo flottant
     du titre puis la pastille du badge. */
  for (const page of [COURS, ...ATELIERS]) {
    const html = lire(page);
    assert.match(html, /class="matiere-logo matiere-logo--hero"/, page + ' : logo du titre');
    assert.match(html, /class="matiere-logo matiere-logo--pastille"/, page + ' : pastille du badge');
  }
});

test('v596 : chaque matière a sa couleur, y compris hors des cartes', () => {
  const css = lire('assets/css/theme.css');
  assert.match(css, /\.subject-card\[data-subject="sti"\]\s*\{\s*--matiere-accent:\s*var\(--accent-gold\)/,
    'la carte STI reçoit l’or, comme la page du cours');
  for (const id of ['html5', 'css3', 'javascript', 'sql', 'php', 'sti']) {
    assert.match(css, new RegExp('\\.matiere-logo--' + id + '\\s*\\{[^}]*color:'), id + ' : couleur propre');
  }
  assert.match(css, /\.matiere-logo--pastille\s*\{[^}]*width: 18px/, 'la pastille tient dans un badge');
  /* Le pictogramme du titre suit l'accent du cours : l'or de la matière. */
  assert.match(lire('assets/css/cours-sti.css'), /\.course-page--sti \.matiere-logo--hero\s*\{\s*color: var\(--accent-gold\)/);
});

test('v596 : le tableau de bord dessine les icônes avec le même sprite', () => {
  const app = lire('assets/js/app.js');
  assert.match(app, /var SYMBOLES_MATIERES = \{ html5: 1, css3: 1, javascript: 1, sql: 1, php: 1, sti: 1 \}/);
  assert.match(app, /function iconeMatiere\(id, icone, taille, prefixe\)/);
  /* Aucune matière ne porte plus d'image bitmap dans son catalogue. */
  assert.doesNotMatch(app, /image:\s*"assets\/images\//);
  /* Les deux endroits qui affichaient l'icône passent par la fonction commune. */
  assert.match(app, /iconeMatiere\(m\.id, m\.icone, 26, pref\)/, 'progression par matière');
  assert.match(app, /iconeMatiere\(c\.id, matiere\.icone, 20, pref\)/, 'cartes « reprendre »');
});

test('v596 : le nouveau pictogramme est servi et versionné', () => {
  const sw = lire('sw.js');
  assert.match(sw, /url: "\.\/assets\/icons\/matieres\.svg", revision: "matiere-sti-v596"/);
  assert.match(sw, /var VERSION_PUBLIEE = "v596";/);
  /* Les pages qui portaient l'ancienne pastille sont réinvalidées. */
  assert.match(sw, /url: "\.\/cours\/systemes-technologies-internet\.html", revision: "cours-sti-v596", refreshIfCached: true/);
  for (const page of ATELIERS) {
    assert.ok(sw.includes('url: "./' + page + '", revision: "exercices-sti-v596"'), page + ' : réinvalidée');
  }
  /* Les deux PNG ne sont plus téléchargés par l'application. */
  const delta = sw.split('var UPDATE_FILES = [')[1].split('];')[0];
  const complet = sw.split('var OFFLINE_LIST = [')[1].split('];')[0];
  assert.ok(!delta.includes('systemes-technologies-internet-96.png') && !delta.includes('systemes-technologies-internet.png'),
    'hors du delta');
  assert.ok(!complet.includes('systemes-technologies-internet-96.png') && !complet.includes('systemes-technologies-internet.png'),
    'hors du paquet complet');
});
