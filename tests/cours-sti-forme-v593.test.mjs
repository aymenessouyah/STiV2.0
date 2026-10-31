/*
  v593 — le cours « Systèmes, technologies et Internet » prend la forme des autres cours.

  Ce que signalait le professeur (31/10/2026) :
    1. le PDF du manuel 3ᵉ SI se téléchargeait encore dans l'ancienne version ;
    2. la page du cours STI n'avait pas l'allure du cours HTML5 : ni anneau de
       progression, ni « Écouter le cours » dans la rangée de boutons, ni suivi ;
    3. le cours STI n'apparaissait pas dans le tableau de bord (« X en cours »,
       progression par matière).

  Ce que ces tests garantissent désormais :
    - la page STI porte le même équipement que les cinq autres cours et chaque
      chapitre se marque « révisé » ;
    - « sti » est une matière du profil (visites, chapitres, dernière lecture),
      donc le tableau de bord la compte ;
    - le téléchargement du manuel 3ᵉ SI change d'adresse et annonce ses 81 pages.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (chemin) => readFileSync(join(root, chemin), 'utf8');
const binaire = (chemin) => readFileSync(join(root, chemin));

const page = lire('cours/systemes-technologies-internet.html');
const script = lire('assets/js/cours-sti.js');
const profil = lire('assets/js/profil.js');
const app = lire('assets/js/app.js');
const sw = lire('sw.js');

test('v593 : la page du cours STI a l’équipement des autres cours', () => {
  /* Anneau de progression : mêmes identifiants que cours/html5.html. */
  for (const identifiant of ['courseRingFill', 'courseRingPct', 'courseRingCount', 'courseRevisedCount']) {
    assert.ok(page.includes('id="' + identifiant + '"'), 'anneau : ' + identifiant);
  }
  assert.match(page, /<div class="course-progress-card">/);
  /* Lecture estimée calculée par app.js, comme ailleurs. */
  assert.match(page, /<strong data-estimation-lecture>/, 'lecture estimée recalculée');
  /* Les trois chapitres sont identifiables et marquables. */
  for (const chapitre of ['ch1', 'ch2', 'ch3']) {
    assert.match(page, new RegExp('data-chapter-id="' + chapitre + '"'), 'chapitre ' + chapitre);
    assert.match(page, new RegExp('data-toggle-revise="' + chapitre + '"'), 'bouton ' + chapitre);
  }
  /* Le bouton d'écoute est dans la rangée d'actions, comme dans le cours HTML5. */
  assert.match(page, /<div class="hero-actions">[\s\S]*?id="heroListenBtn"/);
  /* Le script de progression accompagne la page, après profil.js. */
  assert.ok(page.indexOf('assets/js/profil.js') < page.indexOf('assets/js/cours-sti.js'),
    'profil.js se charge avant cours-sti.js');
});

test('v593 : le script du cours suit la progression comme les cinq autres', () => {
  assert.doesNotThrow(() => new vm.Script(script), 'cours-sti.js se compile');
  assert.match(script, /var MATIERE = "sti";/);
  assert.match(script, /enregistrerVisiteCours\(MATIERE\)/, 'la visite est enregistrée');
  assert.match(script, /global\.STIProfil\.enregistrerLecture\(/, 'la dernière lecture est mémorisée');
  assert.match(script, /definirEtatChapitre\(MATIERE/, 'les chapitres se marquent révisés');
  /* Les identifiants manipulés existent bien dans la page. */
  for (const identifiant of ['courseRingFill', 'courseRingPct', 'courseRingCount', 'courseRevisedCount', 'heroListenBtn', 'audio-cours']) {
    assert.ok(script.includes(identifiant), 'le script vise ' + identifiant);
    assert.ok(page.includes(identifiant), 'la page fournit ' + identifiant);
  }
  assert.match(script, /\["ch1", "ch2", "ch3"\]|"ch1"[\s\S]*"ch2"[\s\S]*"ch3"/, 'les trois chapitres');
});

test('v593 : « sti » est une matière du profil et du tableau de bord', () => {
  assert.match(profil, /var MATIERES_CLES = \[[^\]]*"sti"\]/, 'matières suivies');
  assert.match(profil, /sti: \["cours\/systemes-technologies-internet\.html"\]/, 'page historique');
  assert.match(profil, /progression: \{[\s\S]*?sti: false/, 'progression par défaut');
  assert.match(profil, /chapitres: \{[\s\S]*?sti: \{\}/, 'chapitres par défaut');

  assert.match(app, /sti: \{[\s\S]*?urlCours: "cours\/systemes-technologies-internet\.html"/, 'matière STI');
  assert.match(app, /sti: \["ch1", "ch2", "ch3"\]/, 'chapitres suivis à l’accueil');
  assert.match(app, /var clesMat = ok4 \? \["sti", "html5"/, 'le cours STI ouvre la progression');
  /* Les liens Exercices / Annexes / Vidéos du tableau de bord pointent vers les
     vraies ancres de ce cours (il n'a pas d'onglets). */
  assert.match(app, /ancres: \{ exercices: "#evaluation", annexes: "#manuel", videos: "#video-cours" \}/);
  assert.match(app, /m\.ancres \? m\.ancres\.exercices : '#exercices'/);
});

test('v593 : le manuel 3ᵉ SI se télécharge dans la bonne édition', () => {
  const smartBook = lire('assets/js/smart-book.js');
  const livre = lire('livre-smart.html');
  assert.match(smartBook, /let REVUE_LIVRE = '593'/, 'adresse du PDF renouvelée');
  assert.match(livre, /id="download-book-pages"/, 'le bouton annonce le nombre de pages');
  assert.match(smartBook, /pagesBouton\.textContent = '· ' \+ book\.pages \+ ' pages'/, 'pages affichées');

  /* Le fichier servi est bien la nouvelle édition (81 pages, sans PHP). */
  const pdf = binaire('documents/livre/sti-smart-book-3si-2026.pdf');
  const pages = [...pdf.toString('latin1').matchAll(/\/Count\s+(\d+)/g)].map((m) => Number(m[1]));
  assert.equal(Math.max(...pages), 81, 'le PDF 3ᵉ SI compte 81 pages');
  const texte = pdf.toString('latin1');
  assert.ok(!/\/Count\s+72\b/.test(texte), 'aucun reste de l’édition de 72 pages');
});

test('v593 : le cache hors ligne connaît la page, la feuille et le script du cours', () => {
  const delta = sw.split('var UPDATE_FILES = [')[1].split('];')[0];
  const complet = sw.split('var OFFLINE_LIST = [')[1].split('];')[0];
  for (const url of ['./cours/systemes-technologies-internet.html', './assets/css/cours-sti.css', './assets/js/cours-sti.js']) {
    assert.ok(delta.includes('url: "' + url + '"'), 'delta : ' + url);
    assert.ok(complet.includes('"' + url + '"'), 'cache complet : ' + url);
  }
  assert.match(sw, /var VERSION_PUBLIEE = "v59\d";/);
  assert.match(sw, /{ url: "\.\/assets\/js\/profil\.js", revision: "matieres-sti-v593" }/);
  assert.match(sw, /{ url: "\.\/assets\/js\/app\.js", revision: "cours-sti-v596" }/);
});
