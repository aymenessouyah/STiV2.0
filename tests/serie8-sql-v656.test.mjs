import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const lire = p => readFileSync(p, 'utf8');
const dossier = 'exercices/sql/serie-8/';
const fichiers = ['enonce-serie8-restaurant-v4.pdf', 'corrige-serie8-restaurant-v3.pdf', 'restaurant.sql'];

test('la série 8 est présente dans les deux catalogues sans vidéo', () => {
  const cours = lire('cours/sql.html');
  const article = cours.match(/<article class="matiere-panel sti-4si-only"><h3>Série 8[\s\S]*?<\/article>/)?.[0];
  const exos = lire('exercices/series-exercices.html');
  const carte = exos.match(/<div class="exo-card sti-4si-only">\s*<div class="exo-level">[^\n]*<\/div>\s*<h3>Série 8[\s\S]*?<\/div>\s*<\/div>/)?.[0];
  assert.ok(article); assert.ok(carte);
  for (const f of fichiers) for (const element of [article, carte]) assert.ok(element.includes('../' + dossier + f), f);
  assert.match(article, /data-exercise="serie8"/);
  for (const element of [article, carte]) assert.doesNotMatch(element, /data-video|ouvrirVideo|<video|\.mp4/i);
  assert.doesNotMatch(article, /dates.*ne sont pas fournies/);
});

test('fichiers hors ligne et empreintes cohérentes sans préchargement de PDF', () => {
  const sw = lire('sw.js'); const offline = sw.split('var OFFLINE_LIST = [')[1].split('];')[0];
  const delta = sw.split('var UPDATE_FILES = [')[1].split('];')[0];
  const manifest = JSON.parse(lire('offline-complete-manifest.json'));
  for (const f of fichiers) {
    const chemin = dossier + f; const bytes = readFileSync(chemin);
    assert.ok(offline.includes(`"./${chemin}"`));
    if (f.endsWith(".pdf")) assert.ok(!delta.includes(chemin));
    else assert.ok(delta.includes(chemin));
    const item = manifest.files.find(x => x.path === chemin);
    assert.equal(item?.bytes, bytes.length);
    assert.equal(item?.gitSha, createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex'));
    if (f.endsWith('.pdf')) assert.equal(bytes.subarray(0, 5).toString(), '%PDF-');
  }
});

test('le script crée les données de l’énoncé avec les dates fournies', () => {
  const python = `import sqlite3\nfrom pathlib import Path\nc=sqlite3.connect(':memory:')\nc.executescript(Path('exercices/sql/serie-8/restaurant.sql').read_text())\nassert c.execute('SELECT COUNT(*), COUNT(date_embauche) FROM SERVEUR').fetchone()==(4,4)\nassert c.execute('SELECT COUNT(*), COUNT(date_cmd), SUM(prix*qte) FROM COMMANDE').fetchone()==(12,12,375)\nassert c.execute(\"SELECT date_cmd FROM COMMANDE WHERE num=12\").fetchone()==('2027-04-14',)\nassert c.execute(\"SELECT date_embauche FROM SERVEUR WHERE num=3\").fetchone()==('2019-02-15',)\nassert c.execute(\"SELECT nom FROM SERVEUR WHERE num NOT IN (SELECT numserveur FROM COMMANDE)\").fetchone()==('Nour',)\nassert c.execute(\"SELECT categorie, SUM(prix*qte) FROM COMMANDE GROUP BY categorie ORDER BY categorie\").fetchall()==[('Boisson',64),('Dessert',51),('Entrée',48),('Plat',212)]`;
  const p = spawnSync('python3', ['-c', python], { encoding: 'utf8' });
  assert.equal(p.status, 0, p.stderr);
});
