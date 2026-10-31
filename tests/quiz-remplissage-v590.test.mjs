/*
  v590 — les deux banques de questions qui étaient les plus maigres.

  Constat fait sur la vraie base et dans les données du site : le quiz du cours
  « Systèmes, technologies et Internet » ne comptait que 18 questions (le cours
  le plus récent), et le module SQL de la banque partagée (`quiz-banque.json`,
  utilisée par `quiz/tableaux.html`) n'en avait que 61.

  Ce fichier vérifie la forme des questions ajoutées : identifiants uniques,
  quatre propositions, aucun doublon de texte, et surtout des renvois qui
  pointent vers des sections réellement présentes dans les pages de cours.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const lire = (p) => readFileSync(resolve(root, p), 'utf8');
const systemes = JSON.parse(lire('assets/data/quiz-systemes-internet.json'));
const banque = JSON.parse(lire('assets/data/quiz-banque.json'));

test('v590 : le quiz du cours STI couvre désormais les trois chapitres', () => {
  const qs = systemes.questions;
  assert.ok(qs.length >= 70, `au moins 70 questions (actuellement ${qs.length})`);

  const modules = new Set(qs.map((q) => q.module));
  for (const m of ['systemes', 'reseaux', 'iot']) {
    assert.ok(modules.has(m), 'module ' + m + ' présent');
    const n = qs.filter((q) => q.module === m).length;
    assert.ok(n >= 15, `le module ${m} doit être étoffé (${n} questions)`);
  }

  const ids = qs.map((q) => q.id);
  assert.equal(new Set(ids).size, ids.length, 'identifiants uniques');

  const textes = qs.map((q) => q.q.trim().toLowerCase());
  assert.equal(new Set(textes).size, textes.length, 'aucune question posée deux fois');
});

test('v590 : chaque question STI renvoie à une section réelle du cours', () => {
  const pages = new Map();
  for (const q of systemes.questions) {
    const [page, ancre] = String(q.ancre || '').split('#');
    assert.ok(page && ancre, q.id + ' : ancre manquante');
    assert.ok(String(q.ref || '').trim().length > 3, q.id + ' : référence manquante');
    if (!pages.has(page)) pages.set(page, lire(page));
    const html = pages.get(page);
    assert.ok(html.includes('id="' + ancre + '"'), q.id + ' : #' + ancre + ' introuvable dans ' + page);
  }
});

test('v590 : quatre propositions par question, jamais de bonne réponse vide', () => {
  for (const q of [...systemes.questions, ...banque.questions]) {
    assert.ok(String(q.q || '').trim().length > 10, q.id + ' : énoncé trop court');
    assert.ok(String(q.bonne || '').trim().length >= 1, q.id + ' : bonne réponse vide');
    assert.equal((q.choix_faux || []).length, 3, q.id + ' : trois leurres attendus');
  }
  /* Contrôle renforcé sur les questions écrites en v590 : aucune proposition
     ne doit se répéter (les anciennes de la banque gardent leur historique). */
  const recentes = [...systemes.questions, ...banque.questions.filter((q) => /^sql-/.test(q.id))];
  for (const q of recentes) {
    const choix = [q.bonne, ...(q.choix_faux || [])].map((c) => String(c).trim().toLowerCase());
    assert.equal(new Set(choix).size, 4, q.id + ' : deux propositions identiques');
  }
});

test('v590 : la banque partagée gagne un vrai module SQL', () => {
  const sql = banque.questions.filter((q) => q.module === 'sql');
  assert.ok(sql.length >= 85, `au moins 85 questions SQL (actuellement ${sql.length})`);

  /* Les notions qui manquaient : SELECT/WHERE, tri, jointures, regroupements,
     NULL et clés. On vérifie qu'elles sont désormais posées. */
  const refs = sql.map((q) => String(q.ref || ''));
  for (const attendu of ['SELECT, Clauses & Opérateurs', 'Jointure entre 2 tables',
    'La clause GROUP BY', 'La clause HAVING', 'Clé primaire & clé étrangère']) {
    assert.ok(refs.some((r) => r.includes(attendu)), 'notion couverte : ' + attendu);
  }
  const ids = banque.questions.map((q) => q.id);
  assert.equal(new Set(ids).size, ids.length, 'identifiants uniques dans la banque');
});

test('v590 : les chiffres affichés suivent les banques', () => {
  const total = 187 + 106 + 140 + 176 + banque.questions.length;
  const index = lire('index.html');
  assert.match(index, new RegExp('data-count="' + total + '">' + String(total).replace(/(\d)(\d{3})$/, '$1 $2') + '<'));
  assert.match(index, /son propre quiz : <strong>71 questions<\/strong> du manuel/);
  assert.match(lire('README.md'), new RegExp('1 ' + String(total).slice(1) + ' questions'));
  assert.match(lire('assets/js/app.js'), /1 269 questions auto-corrigées/);
});
