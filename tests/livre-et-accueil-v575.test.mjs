/* v575 — Corrections du livre connecté et de l’accueil :
   1) les couvertures et le PDF ne restent plus sur l’ancienne édition (versions + cache réseau) ;
   2) le manuel 4e SI se charge à nouveau (ses fiches n’ont pas de champ `kind`) ;
   3) le tableau de bord affiche la version courante, plus v560 ;
   4) les vidéos s’affichent dans l’ordre du programme : HTML5, CSS3, JS, SQL, PHP ;
   5) le compteur de cours de l’accueil suit l’ajout du cours 3e SI. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (chemin) => readFileSync(join(root, chemin), 'utf8');

const lecteur = lire('assets/js/smart-book.js');
const sw = lire('sw.js');
const livre = lire('livre-smart.html');
const index = lire('index.html');
const app = lire('assets/js/app.js');

/* Les deux configurations de manuel, évaluées telles quelles. */
function configurationManuels() {
  const bloc = lecteur.slice(lecteur.indexOf('let books = {'), lecteur.indexOf('let bookId'));
  const contexte = vm.createContext({});
  vm.runInContext('this.books = ' + bloc.replace('let books = ', '').replace(/;\s*$/, '') + ';', contexte);
  return contexte.books;
}
const BOOKS = configurationManuels();

/* Même validation que getIndex() dans le lecteur, appliquée au JSON livré. */
function valider(cle) {
  const book = BOOKS[cle];
  const data = JSON.parse(lire(book.data));
  assert.equal(data.pages, book.pages, cle + ' : nombre de pages');
  assert.equal(data.items.length, book.entries, cle + ' : nombre de pages repérées');
  const premiere = book.pages - book.entries + 1;
  let numeros = 0;
  data.items.forEach((item, position) => {
    assert.equal(item.page, premiere + position, cle + ' : pagination continue');
    if (item.kind === 'fiche' || !item.kind) {
      numeros += 1;
      assert.equal(item.fiche, numeros, cle + ' : numérotation des fiches');
    }
    assert.match(item.url, /^https:\/\/aymenessouyah\.github\.io\/STiV2\.0\/(cours\/)?[a-z0-9-]+\.html#[a-z0-9-]+$/);
  });
  assert.equal(numeros, book.lessons, cle + ' : nombre de fiches');
  return { book, data };
}

test('v575 : le manuel 4e SI se charge de nouveau (fiches sans `kind`)', () => {
  const { book, data } = valider('4si-2026');
  assert.equal(book.entries, 95);
  assert.equal(book.lessons, 77);
  assert.equal(book.recapPages, 18);
  assert.equal(data.items.filter((item) => item.kind === 'recap').length, 18);
  assert.equal(data.items.filter((item) => !item.kind).length, 77);

  /* Le lecteur compte une fiche aussi quand `kind` est absent. */
  assert.match(lecteur, /if \(item\.kind === 'fiche' \|\| !item\.kind\)/);
  assert.match(lecteur, /if \(numeros !== book\.lessons\)/);
});

test('v575 : le manuel 3e SI garde sa pagination 2026', () => {
  const { book, data } = valider('3si-2026');
  assert.equal(book.pages, 81);
  assert.equal(book.entries, 77);
  assert.equal(book.lessons, 53);
  assert.equal(book.coursPages, 9);
  assert.equal(data.items.filter((item) => item.kind === 'cours').length, 9);
});

test('v575 : couvertures, PDF et index ne restent plus sur l’ancienne édition', () => {
  /* Les images portent une version : sans elle, le navigateur ressort l’ancienne couverture. */
  assert.match(livre, /couverture-3si\.jpg\?v=\d+/);
  assert.match(livre, /couverture-4si\.jpg\?v=\d+/);
  assert.match(lecteur, /book\.pdf \+ '\?v=' \+ REVUE_LIVRE/);
  assert.match(lire('cours/sql-bases-ldd-lmd-lcd.html'), /couverture-3si\.jpg\?v=\d+/);

  /* Les révisions du service worker suivent, sinon le cache hors ligne garde les anciennes. */
  /* v576 : le nom du PDF téléchargé change → les deux fichiers du lecteur repartent en v576. */
  const revisions = {
    'livre-smart.html': 'livre-3si-v593',
    'assets/js/smart-book.js': 'livre-3si-v593',
    'assets/images/smart-books/couverture-3si.jpg': 'livre-3si-v593',
    'assets/images/smart-books/couverture-4si.jpg': 'livre-3si-v593',
    'assets/data/smart-book-3si-2026.json': 'livre-3si-v593',
    'assets/data/smart-book-2026.json': 'livre-3si-v593'
  };
  for (const [fichier, revision] of Object.entries(revisions)) {
    assert.match(sw, new RegExp('url: "\\./' + fichier.replace(/[.]/g, '\\.') + '", revision: "' + revision + '"'), fichier);
  }

  /* L’index d’un manuel change à chaque édition : il se lit d’abord sur le réseau. */
  assert.match(sw, /assets\\\/data\\\/smart-book\[\^\/\]\*\\\.json/);

  /* Les anciens liens « ?niveau=3si » désignent toujours le bon manuel. */
  assert.match(lecteur, /niveau === '3si' \? '3si-2026'/);
  assert.match(index, /livre-smart\.html\?livre=3si-2026/);
  assert.match(index, /<strong>81 pages<\/strong>/);
  assert.doesNotMatch(index, /72 pages/);
});

test('v575 : le tableau de bord n’affiche plus v560', () => {
  const admin = lire('admin.html');
  assert.match(admin, /assets\/js\/admin\.js\?v=615-perf/);
  const script = Number((admin.match(/admin\.js\?v=(\d+)/) || [])[1]);
  const config = Number((lire('assets/js/config.js').match(/VERSION_AFFICHEE:\s*(\d+)/) || [])[1]);
  /* Le badge affiche max(?v= du script, VERSION_AFFICHEE). */
  assert.ok(Math.max(script, config) >= 575, 'version affichée : ' + Math.max(script, config));
  assert.ok(Math.max(script, config) > 560);
});

test('v575 : les vidéos se lisent dans l’ordre HTML5 → CSS3 → JS → SQL → PHP', () => {
  const ordre = (app.match(/var ORDRE_MATIERES_VIDEOS = (\[[^\]]*\])/) || [])[1];
  assert.ok(ordre, 'ordre des matières déclaré');
  assert.deepEqual(JSON.parse(ordre.replace(/'/g, '"')), ['html5', 'css3', 'javascript', 'sql', 'php']);
  assert.match(app, /trierVideosParMatiere\(CATALOGUE_VIDEOS\.filter/);

  /* Tri stable : l’ordre du catalogue est conservé à l’intérieur d’une matière. */
  const contexte = vm.createContext({});
  const fonctions = app.slice(app.indexOf('var ORDRE_MATIERES_VIDEOS'), app.indexOf('function effetVideo(v)'));
  vm.runInContext(fonctions + '\nthis.trier = trierVideosParMatiere;', contexte);
  const essai = [
    { id: 'php1', matiere: 'php' }, { id: 'sql1', matiere: 'sql' }, { id: 'js1', matiere: 'javascript' },
    { id: 'css1', matiere: 'css3' }, { id: 'html1', matiere: 'html5' }, { id: 'html2', matiere: 'html5' },
    { id: 'css2', matiere: 'css3' }
  ];
  assert.deepEqual(contexte.trier(essai).map((v) => v.id), ['html1', 'html2', 'css1', 'css2', 'js1', 'sql1', 'php1']);
});

test('v575 : le compteur de cours de l’accueil suit le nouveau cours', () => {
  const bloc = index.slice(index.indexOf('stats-strip'), index.indexOf('</section>', index.indexOf('stats-strip')));
  assert.match(bloc, /data-count="14">14<\/span>\s*<span class="stat-card__label">📖 Cours complets/);
  assert.doesNotMatch(bloc, /data-count="13"/);
  assert.match(index, /cours\/systemes-technologies-internet\.html/);
});

/* Charge le vrai lecteur dans un DOM simulé : c’est ce contrôle qui reproduit
   l’écran « Impossible de charger ce manuel » du manuel 4e SI. */
async function chargerLecteur(recherche) {
  const elements = {};
  const element = (id) => elements[id] || (elements[id] = {
    id, textContent: '', value: '', href: '', max: '', disabled: false, hidden: false, style: {}, dataset: {}, children: [], attributs: {},
    setAttribute(cle, valeur) { this.attributs[cle] = String(valeur); }, getAttribute(cle) { return this.attributs[cle] || null; },
    addEventListener() {}, classList: { toggle() {}, add() {}, remove() {} },
    append(...n) { this.children.push(...n); }, replaceChildren() { this.children = []; }
  });
  const documentSimule = {
    getElementById: element,
    querySelector: () => ({ setAttribute() {} }),
    addEventListener() {},
    createElement: () => ({
      className: '', style: {}, dataset: {}, children: [], width: 0, height: 0,
      setAttribute() {}, getAttribute() {}, addEventListener() {},
      append(...n) { this.children.push(...n); },
      getContext: () => ({ drawImage() {}, getImageData: () => ({ data: [] }) })
    }),
    createDocumentFragment: () => ({ children: [], append(...n) { this.children.push(...n); } })
  };
  const memoire = {};
  const contexte = vm.createContext({
    window: { addEventListener() {} },
    document: documentSimule,
    location: { href: 'https://exemple/livre-smart.html' + recherche, search: recherche, origin: 'https://exemple' },
    history: { replaceState() {} },
    URL, URLSearchParams,
    localStorage: { getItem: (k) => memoire[k] || null, setItem: (k, v) => { memoire[k] = v; }, removeItem: (k) => { delete memoire[k]; } },
    sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    setTimeout, clearTimeout, console, navigator: {},
    Image: function () { this.decode = async () => {}; },
    fetch: async (url) => ({ ok: true, json: async () => JSON.parse(lire(String(url).split('?')[0])) }),
    Response: { error() {} },
    Math, Number, String, Object, Array, JSON, Promise, Date
  });
  vm.runInContext(lecteur, contexte);
  await new Promise((r) => setTimeout(r, 120));
  return elements;
}

test('v575 : le lecteur charge réellement les deux manuels (écran de la capture)', async () => {
  const trois = await chargerLecteur('?livre=3si-2026');
  assert.match(trois['global-status'].textContent, /3ème SI — 2026 prêt/);
  assert.equal(trois['book-size'].textContent, '81 pages · 53 fiches + 9 pages de cours + 15 pages de tableaux');
  assert.equal(trois['download-book'].href, 'documents/livre/sti-smart-book-3si-2026.pdf?v=593');
  assert.equal(trois['count'].textContent, '77 repère(s) sur 77 · 3ème SI');

  const quatre = await chargerLecteur('?livre=4si-2026');
  assert.doesNotMatch(quatre['global-status'].textContent, /Impossible de charger/);
  assert.match(quatre['global-status'].textContent, /4ème SI — 2026 prêt/);
  assert.equal(quatre['count'].textContent, '95 repère(s) sur 95 · 4ème SI');

  /* Lien historique « ?niveau=3si » conservé sur les pages du site. */
  const ancien = await chargerLecteur('?niveau=3si');
  assert.match(ancien['global-status'].textContent, /3ème SI — 2026 prêt/);
});

test('v576 : le PDF téléchargé porte un nom de fichier propre', async () => {
  /* Le lien statique annonce déjà le manuel 4e SI (sélection par défaut). */
  assert.match(livre, /id="download-book"[^>]*download="STI-Smart-Book-4SI-2026\.pdf"/);
  /* Le lecteur renomme à chaque changement de manuel, sans perdre le cache-buster. */
  assert.match(lecteur, /setAttribute\('download', nomPdf\)/);
  assert.match(lecteur, /'STI-Smart-Book-' \+ \(id === '3si-2026' \? '3SI' : '4SI'\) \+ '-2026\.pdf'/);

  const trois = await chargerLecteur('?livre=3si-2026');
  assert.equal(trois['download-book'].attributs.download, 'STI-Smart-Book-3SI-2026.pdf');
  assert.equal(trois['download-book'].href, 'documents/livre/sti-smart-book-3si-2026.pdf?v=593');

  const quatre = await chargerLecteur('?livre=4si-2026');
  assert.equal(quatre['download-book'].attributs.download, 'STI-Smart-Book-4SI-2026.pdf');
  assert.equal(quatre['download-book'].href, 'documents/livre/sti-smart-book-2026.pdf?v=593');

  /* Aucun nom de fichier ne contient le paramètre de version. */
  for (const nom of [trois['download-book'].attributs.download, quatre['download-book'].attributs.download]) {
    assert.doesNotMatch(nom, /[?=]|_v\d/);
  }
});
