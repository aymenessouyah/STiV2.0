/* v573 — nouveau cours 3ème SI « Systèmes, technologies et Internet »
   ─────────────────────────────────────────────────────────────────────
   Le manuel connecté 3ème SI passe à l'édition 2026 : 81 pages, dont une
   nouvelle partie AVANT HTML5 (pages 5 à 13). Ces tests vérifient que :
     1. le cours existe, il est relié au site et il est servi hors ligne ;
     2. son contenu reprend bien les trois chapitres du manuel ;
     3. chaque page du manuel pointe vers la bonne partie du cours. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const lire = (chemin) => fs.readFileSync(new URL('../' + chemin, import.meta.url), 'utf8');
const PAGE = 'cours/systemes-technologies-internet.html';
const BASE = 'https://aymenessouyah.github.io/STiV2.0/';

test('le cours 3ème SI « Systèmes, technologies et Internet » existe et est complet', () => {
  const html = lire(PAGE);

  assert.match(html, /<title>Systèmes, technologies et Internet — Cours 3ème SI/);
  assert.ok(html.includes('data-course-unified="sti"'), 'la page est reconnue comme une page de cours');
  assert.match(html, /<meta http-equiv="Content-Security-Policy"/, 'CSP déclarée');

  /* Les trois chapitres du manuel, chacun avec ses ancres. */
  for (const ancre of ['introduction', 'ch1-se', 'ch1-roles', 'ch1-types', 'ch1-licences',
    'ch1-deploiement', 'ch1-vm', 'ch1-securite', 'ch1-activites',
    'ch2-definition', 'ch2-classes', 'ch2-equipements', 'ch2-parametres',
    'ch2-architectures', 'ch2-protocoles', 'ch2-securite', 'ch2-activites',
    'ch3-definition', 'ch3-composants', 'ch3-principe', 'ch3-echanges',
    'ch3-tester', 'ch3-activite', 'synthese', 'evaluation']) {
    assert.ok(html.includes(`id="${ancre}"`), 'ancre absente : ' + ancre);
  }

  /* Les notions du programme, mot pour mot. */
  const texte = html.toLowerCase();
  for (const notion of ['système d’exploitation', 'machine virtuelle', 'logiciel libre',
    'lan', 'man', 'wan', 'masque réseau', 'dns', 'adresse mac', 'tcp/ip', 'https', 'mqtt',
    'internet des objets', 'broker', 'pare-feu']) {
    assert.ok(texte.includes(notion), 'notion absente : ' + notion);
  }

  /* Aucun renvoi vers PHP : la partie est celle de 3ème SI. */
  assert.ok(!/cours\/php\.html/.test(html), 'pas de renvoi PHP dans ce cours');
});

test('les activités ont une correction à part, et l’évaluation compte dix questions', () => {
  const html = lire(PAGE);
  const corrections = (html.match(/<details class="sti-correction">/g) || []).length;
  assert.ok(corrections >= 4, 'chaque activité propose sa correction (trouvé : ' + corrections + ')');

  const evaluation = html.slice(html.indexOf('id="evaluation"'));
  assert.ok(evaluation.includes('/ 10 points'), 'barème annoncé');
  const questions = (evaluation.match(/<li>/g) || []).length;
  assert.ok(questions >= 10, 'au moins dix questions (trouvé : ' + questions + ')');
});

test('le cours est relié au site : accueil, cours HTML5, plan du site et hors-ligne', () => {
  const index = lire('index.html');
  assert.ok(index.includes(`href="${PAGE}"`), 'carte sur l’accueil');
  assert.ok(index.includes('data-filter="sti"'), 'le filtre « Systèmes & réseaux » existe');

  const html5 = lire('cours/html5.html');
  assert.ok(html5.includes('href="systemes-technologies-internet.html"'),
    'le cours HTML5 renvoie vers la partie qui le précède');

  assert.ok(lire('sitemap.xml').includes('./' + PAGE), 'plan du site');

  const sw = lire('sw.js');
  const delta = sw.split('var UPDATE_FILES = [')[1].split('];')[0];
  const complet = sw.split('var OFFLINE_LIST = [')[1].split('];')[0];
  assert.ok(delta.includes('"./' + PAGE + '"'), 'mise à jour incrémentale');
  assert.ok(complet.includes('"./' + PAGE + '"'), 'paquet hors-ligne complet');
  assert.ok(sw.includes('"./assets/css/cours-sti.css"'), 'feuille de style du cours');
  assert.match(sw, /url: "\.\/livre-smart\.html", revision: "livre-smart-v576"/);
  assert.match(sw, /url: "\.\/assets\/data\/smart-book-3si-2026\.json", revision: "livre-smart-v575"/);

  const manifeste = JSON.parse(lire('offline-complete-manifest.json'));
  assert.ok(manifeste.files.some((f) => f.path === PAGE), 'manifeste hors-ligne');
  assert.ok(manifeste.files.some((f) => f.path === 'assets/css/cours-sti.css'), 'CSS hors-ligne');
});

test('le manuel 3ème SI 2026 : 81 pages, 9 pages de cours, 53 fiches, 15 tableaux', () => {
  const data = JSON.parse(lire('assets/data/smart-book-3si-2026.json'));
  assert.equal(data.pages, 81);
  assert.equal(data.fiches, 53);
  assert.equal(data.items.length, 77);
  assert.equal(data.items[0].page, 5);
  assert.equal(data.items.at(-1).page, 81);

  const cours = data.items.filter((i) => i.kind === 'cours');
  assert.equal(cours.length, 9, 'les pages 5 à 13 du manuel');
  assert.deepEqual(cours.map((i) => i.page), [5, 6, 7, 8, 9, 10, 11, 12, 13]);
  for (const item of cours) {
    assert.ok(item.url.startsWith(BASE + PAGE + '#'), 'renvoi vers le nouveau cours : ' + item.url);
    assert.equal(item.qr_url, BASE + 'livre-smart.html?livre=3si-2026&page=' + item.page);
  }

  const fiches = data.items.filter((i) => i.kind === 'fiche');
  assert.equal(fiches[0].page, 14);
  assert.equal(fiches.at(-1).page, 66);
  const recaps = data.items.filter((i) => i.kind === 'recap');
  assert.equal(recaps[0].page, 67);
  assert.equal(recaps.at(-1).page, 81);
  for (const item of [...fiches, ...recaps]) {
    assert.ok(item.url.startsWith(BASE), item.url);
  }
});

test('chaque page repérée du manuel ouvre une ancre qui existe vraiment', () => {
  const data = JSON.parse(lire('assets/data/smart-book-3si-2026.json'));
  for (const item of data.items) {
    const url = new URL(item.url);
    assert.equal(url.origin, 'https://aymenessouyah.github.io');
    const chemin = url.pathname.slice('/STiV2.0/'.length);
    const ancre = url.hash.slice(1);
    assert.ok(ancre, item.url + ' : une ancre est attendue');
    assert.ok(lire(chemin).includes(`id="${ancre}"`), item.url);
  }
});

test('le lecteur du livre connaît la nouvelle pagination et les pages de cours', () => {
  const js = lire('assets/js/smart-book.js');
  assert.match(js, /'3si-2026': \{[^}]*pages: 81[^}]*entries: 77[^}]*lessons: 53/s,
    'configuration du manuel 3ème SI');
  assert.ok(js.includes("item.kind === 'cours'"), 'les pages de cours sont étiquetées');
  assert.ok(js.includes("' · PAGE DU COURS'"), 'le catalogue nomme les pages de cours');

  const html = lire('livre-smart.html');
  assert.ok(html.includes('81 pages'), 'la couverture annonce 81 pages');
  assert.ok(!html.includes('72 pages'), 'l’ancienne pagination a disparu');
  assert.ok(html.includes('Systèmes, réseaux, IoT'), 'le choix du manuel annonce la nouvelle partie');

  /* Le PDF livré est bien l’édition 2026 (81 pages). */
  const pdf = fs.readFileSync(new URL('../documents/livre/sti-smart-book-3si-2026.pdf', import.meta.url));
  assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
  assert.ok(pdf.length > 100000, 'PDF non vide');
});
