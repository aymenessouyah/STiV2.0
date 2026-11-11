import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const text = (p) => readFileSync(p, 'utf8');
const course = text('cours/sql.html');
const sw = text('sw.js');
const files = ['enonce.html', 'corrige.html', 'style.css', 'boutique.sql', 'Fiche_SQL_Boutique_Jointure_SousRequetes.pdf', 'Corrigé_SQL_Boutique_Jointure_SousRequetes.pdf'];

test('la série 7 est accessible dans les deux catalogues SQL', () => {
  const panel = course.match(/<section id="exercices"[\s\S]*?<section id="annexes"/)?.[0];
  assert.ok(panel);
  const card = panel.match(/<article class="matiere-panel sti-4si-only"><h3>Série 7[\s\S]*?<\/article>/)?.[0];
  assert.ok(card);
  for (const name of files.filter(f => f !== 'style.css')) assert.ok(card.includes(`../exercices/sql/serie-7/${name}`), name);
  assert.match(card, /data-exercise="serie7"/);
  assert.match(text('exercices/series-exercices.html'), /Série 7 — Le gérant de la boutique/);
});

test('la v627 actualise les pages appelantes sans précharger les PDF', () => {
  assert.match(sw, /VERSION_PUBLIEE = "v638"/);
  const delta = sw.split('var UPDATE_FILES = [')[1].split('];')[0];
  for (const path of ['cours/sql.html', 'exercices/series-exercices.html']) {
    assert.ok(delta.includes(`{ url: "./${path}", revision: "${path === 'cours/sql.html' ? 'capsule-sql7-v638' : 'retrait-mission-cinema-v633'}", refreshIfCached: true }`));
  }
  const offline = sw.split('var OFFLINE_LIST = [')[1].split('];')[0];
  const manifest = JSON.parse(text('offline-complete-manifest.json'));
  for (const name of files) {
    const path = `exercices/sql/serie-7/${name}`;
    assert.ok(offline.includes(`"./${path}"`));
    assert.ok(!delta.includes(path));
    const bytes = readFileSync(path);
    const sha = createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
    const entry = manifest.files.find(x => x.path === path);
    assert.equal(entry?.gitSha, sha);
    assert.equal(entry?.bytes, bytes.length);
  }
  assert.equal(manifest.totalFiles, manifest.files.length);
  assert.equal(manifest.totalBytes, manifest.files.reduce((n, f) => n + f.bytes, 0));
});
