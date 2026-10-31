/*
  v595 — les exercices « Systèmes, technologies et Internet » (3ᵉ SI).

  La matière n'avait aucun exercice alors que les quatre autres en ont 67
  pages. Quatre ateliers corrigés comblent ce trou, sur le même gabarit que
  les pages de cours. Ces tests empêchent les régressions les plus coûteuses :
  une page oubliée du cache hors-ligne, un lien mort, un exercice sans corrigé.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (chemin) => readFileSync(join(root, chemin), 'utf8');

const PAGES = [
  'exercices/systemes/index.html',
  'exercices/systemes/atelier-1-systemes-exploitation.html',
  'exercices/systemes/atelier-2-reseaux.html',
  'exercices/systemes/atelier-3-machine-virtuelle.html',
  'exercices/systemes/atelier-4-objets-connectes.html',
];

const ATELIERS = [
  ['exercices/systemes/atelier-1-systemes-exploitation.html', 6],
  ['exercices/systemes/atelier-2-reseaux.html', 6],
  ['exercices/systemes/atelier-3-machine-virtuelle.html', 5],
  ['exercices/systemes/atelier-4-objets-connectes.html', 6],
];

test('v595 : les cinq pages existent et sont des pages complètes', () => {
  for (const page of PAGES) {
    assert.ok(existsSync(join(root, page)), page + ' existe');
    const html = lire(page);
    assert.match(html, /^<!DOCTYPE html>/, page + ' : doctype');
    assert.match(html, /<html lang="fr"/, page + ' : langue');
    assert.equal((html.match(/<h1\b/g) || []).length, 1, page + ' : un seul h1');
    assert.match(html, /class="skip-link"/, page + ' : lien d’évitement');
    assert.match(html, /name="viewport"/, page + ' : viewport mobile');
    assert.match(html, /Content-Security-Policy/, page + ' : CSP déclarée');
    assert.match(html, /<main id="contenu-principal">/, page + ' : zone principale');
  }
});

test('v595 : chaque atelier a ses exercices et un corrigé pour chacun', () => {
  for (const [page, nombre] of ATELIERS) {
    const html = lire(page);
    const exercices = (html.match(/data-exo-item="/g) || []).length;
    assert.equal(exercices, nombre, page + ' : nombre d’exercices');
    /* Un corrigé dépliable par exercice, et rien de moins. */
    assert.equal((html.match(/class="exo-corrige"/g) || []).length, nombre,
      page + ' : un corrigé par exercice');
    /* Le suivi passe par STIProfil : identifiants stables, un par exercice. */
    const ids = [...html.matchAll(/data-exo-item="([^"]+)"/g)].map((m) => m[1]);
    assert.equal(new Set(ids).size, ids.length, page + ' : identifiants uniques');
    for (const id of ids) assert.match(id, /^atelier-[1-4]-e\d+$/, page + ' : identifiant ' + id);
    assert.match(html, /data-atelier-fait="atelier-[1-4]"/, page + ' : bouton de fin d’atelier');
    assert.match(html, /data-exo-barre/, page + ' : barre de progression');
  }
});

test('v595 : les pages chargent la bonne feuille et le bon script', () => {
  for (const page of PAGES) {
    const html = lire(page);
    assert.match(html, /assets\/css\/exercices-sti\.css\?v=595/, page + ' : feuille des exercices');
    assert.match(html, /assets\/js\/exercices-sti\.js\?v=595/, page + ' : module des exercices');
    assert.match(html, /assets\/css\/cours-sti\.css\?v=595/, page + ' : feuille du cours');
    /* Le module de suivi doit venir APRÈS profil.js, qui fournit STIProfil. */
    assert.ok(html.indexOf('profil.js') < html.indexOf('exercices-sti.js'), page + ' : ordre des scripts');
  }
});

test('v595 : aucun lien ni média local ne manque', () => {
  const motif = /(?:href|src)="((?:\.\.\/)*(?:assets|exercices|cours|quiz|documents|projets)\/[^"?#]+)(?:\?[^"#]*)?"/g;
  for (const page of PAGES) {
    const dossier = dirname(join(root, page));
    for (const m of lire(page).matchAll(motif)) {
      const cible = resolve(dossier, m[1]);
      assert.ok(existsSync(cible), page + ' → ' + m[1]);
    }
  }
});

test('v595 : les ateliers sont livrés hors ligne et versionnés', () => {
  const sw = lire('sw.js');
  const shell = sw.split('var SHELL = [')[1].split('];')[0];
  const offline = sw.split('var OFFLINE_LIST = [')[1].split('];')[0];
  for (const chemin of [...PAGES, 'assets/css/exercices-sti.css', 'assets/js/exercices-sti.js']) {
    assert.ok(shell.includes('"./' + chemin + '"'), 'coquille : ' + chemin);
    assert.ok(offline.includes('"./' + chemin + '"'), 'cache complet : ' + chemin);
  }
  assert.match(sw, /var VERSION_PUBLIEE = "v603";/);

  const manifeste = JSON.parse(lire('offline-complete-manifest.json'));
  for (const chemin of [...PAGES, 'assets/css/exercices-sti.css', 'assets/js/exercices-sti.js']) {
    assert.ok(manifeste.files.some((f) => f.path === chemin), 'manifeste : ' + chemin);
  }
});

test('v595 : le sommaire est relié au cours, à l’accueil et à la matière STI', () => {
  const accueil = lire('index.html');
  assert.ok(accueil.includes('exercices/systemes/index.html'), 'l’accueil renvoie vers les ateliers');
  const carte = accueil.slice(accueil.indexOf('data-subject="sti"'));
  assert.ok(carte.slice(0, carte.indexOf('</article>')).includes('exercices/systemes/index.html'),
    'la carte du cours propose ses exercices');

  const cours = lire('cours/systemes-technologies-internet.html');
  assert.ok(cours.includes('id="exercices"'), 'le cours a sa section « exercices »');
  for (const page of ATELIERS.map((a) => a[0])) {
    const nom = page.split('/').pop();
    assert.ok(cours.includes(nom), 'le cours renvoie vers ' + nom);
  }

  const app = lire('assets/js/app.js');
  assert.match(app, /urlExercices: "exercices\/systemes\/index\.html"/);
  const blocSti = app.slice(app.indexOf('sti: {'), app.indexOf('var CATALOGUE_VIDEOS'));
  for (const page of ATELIERS.map((a) => a[0])) {
    assert.ok(blocSti.includes(page), 'MATIERES.sti : ' + page);
  }
  assert.match(blocSti, /exercices: \[\s*\{/, 'MATIERES.sti a bien quatre exercices déclarés');
});
