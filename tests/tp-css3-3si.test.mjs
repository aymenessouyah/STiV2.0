import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const folder = 'exercices/html-css/TP CSS3  Transform, Filtres, Transitions et Animations – 3ème SI';
const rel = (p) => join(root, p);
const text = (p) => readFileSync(rel(p), 'utf8');
const tpPath = `${folder}/index.html`;
const course = text('cours/css3.html');
const series = text('exercices/series-exercices.html');
const sw = text('sw.js');

test('TP CSS3 3ème SI — les ressources originales sont intégrées et liées depuis la page d’accueil du TP', () => {
  const sujet = readFileSync(rel(`${folder}/enonce-tp-css3-3si.pdf`));
  const corrige = readFileSync(rel(`${folder}/corrige-tp-css3-3si.pdf`));
  assert.equal(sujet.subarray(0, 5).toString(), '%PDF-');
  assert.equal(corrige.subarray(0, 5).toString(), '%PDF-');
  assert.ok(sujet.length > 100_000);
  assert.ok(corrige.length > 100_000);

  const page = text(tpPath);
  assert.match(page, /TP CSS3 — Transform, Filtres, Transitions et Animations/);
  assert.match(page, /href="enonce-tp-css3-3si\.pdf"/);
  assert.match(page, /data-sti-correction href="corrige-tp-css3-3si\.pdf"/);
  assert.match(page, /data-sti-correction href="resultat_TP_CSS3_3SI\.html"/);
  assert.match(page, /data-sti-guide-exercice="exercices\/html-css\/TP CSS3  Transform, Filtres, Transitions et Animations – 3ème SI\/index\.html"/);
  assert.match(page, /assets\/js\/guide-exercice\.js\?v=614/);

  const preview = text(`${folder}/resultat_TP_CSS3_3SI.html`);
  assert.match(preview, /<title>TP CSS3 – Résultat attendu<\/title>/);
  assert.match(preview, /data-sti-guide-exercice=/);
  assert.match(preview, /<main data-sti-correction>/, 'le professeur peut masquer aussi l’aperçu corrigé');
  assert.match(preview, /assets\/js\/guide-exercice\.js\?v=614/);
  for (const concept of ['transform', 'filter', '@keyframes', 'Transition']) assert.ok(preview.includes(concept), concept);
  assert.doesNotMatch(preview, /(?:src|href)="(?:\.\/)?s\.png"/i, 'l’aperçu ne dépend pas d’une image absente');
});

test('TP CSS3 3ème SI — intégré aux exercices du cours avec une progression cochable', () => {
  const card = course.match(/<article class="exo-card-full exo-card-tp" id="exo-tp-css3-transform"[\s\S]*?<\/article>/)?.[0];
  assert.ok(card, 'carte TP présente dans le panneau Exercices');
  assert.match(card, /data-exo-id="exo-tp-css3-transform"/);
  assert.match(card, /data-exo-check="exo-tp-css3-transform"/);
  assert.match(card, /TP CSS3 — Transform, Filtres, Transitions et Animations/);
  assert.match(card, new RegExp(`\\.\\./${folder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/index\\.html`));
  assert.match(course, /0 \/ 9 exercices faits/);
  const ids = [...course.matchAll(/<article\b[^>]*class="exo-card-full[^>]*data-exo-id="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(ids.length, 9, 'le TP s’ajoute aux huit exercices cochables existants');
  assert.equal(new Set(ids).size, ids.length, 'chaque exercice a un identifiant de progression unique');
});

test('TP CSS3 3ème SI — présent dans la page des séries et le Guide exercice', () => {
  assert.match(series, /TP CSS3 — Transform, Filtres, Transitions et Animations/);
  assert.ok(series.includes(`html-css/${folder.slice('exercices/html-css/'.length)}/index.html`));
  const catalogue = JSON.parse(text('assets/guide-exercice-catalogue.json'));
  const matches = catalogue.pages.filter((p) => p.chemin === tpPath);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].matiere, 'html-css');
  assert.equal(matches[0].correction, true);
  assert.equal(matches[0].video, false);
});

test('TP CSS3 3ème SI — les nouvelles pages et les révisions sont livrées hors-ligne', () => {
  const delta = sw.split('var UPDATE_FILES = [')[1].split('];')[0];
  assert.ok(delta.includes('{ url: "./cours/css3.html", revision: "retrait-display-v628", refreshIfCached: true }'));
  assert.match(delta, /\{ url: "\.\/exercices\/series-exercices\.html", revision: "[^"]+", refreshIfCached: true \}/);
  assert.ok(delta.includes('{ url: "./assets/guide-exercice-catalogue.json", revision: "tp-css3-3si-v625", refreshIfCached: true }'));
  assert.ok(delta.includes(`./${tpPath}`));
  assert.ok(delta.includes(`./${folder}/resultat_TP_CSS3_3SI.html`));
  for (const path of [`./${tpPath}`, `./${folder}/resultat_TP_CSS3_3SI.html`]) {
    assert.ok(sw.split('var SHELL = [')[1].split('];')[0].includes(`"${path}"`), `${path} est dans le shell hors-ligne`);
    assert.ok(sw.split('var NOUVEAUTES_NOYAU = {')[1].split('};')[0].includes(`"${path}": 1`), `${path} est livré aux installations existantes`);
  }
  assert.ok(delta.split('{ url:').length - 1 <= 280, 'le delta reste sous son plafond');

  const manifest = JSON.parse(text('offline-complete-manifest.json'));
  for (const file of [
    `${folder}/index.html`,
    `${folder}/resultat_TP_CSS3_3SI.html`,
    `${folder}/enonce-tp-css3-3si.pdf`,
    `${folder}/corrige-tp-css3-3si.pdf`,
  ]) {
    const entry = manifest.files.find((f) => f.path === file);
    assert.ok(entry, `${file} est inclus dans le paquet hors-ligne`);
    const bytes = readFileSync(rel(file));
    const gitSha = createHash('sha1').update(`blob ${bytes.length}`).update(Buffer.from([0])).update(bytes).digest('hex');
    assert.equal(entry.bytes, bytes.length);
    assert.equal(entry.gitSha, gitSha);
  }
  assert.equal(manifest.totalFiles, manifest.files.length);
  assert.equal(manifest.totalBytes, manifest.files.reduce((sum, f) => sum + f.bytes, 0));
});
