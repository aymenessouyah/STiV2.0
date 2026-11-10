import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import vm from 'node:vm';

const root = resolve(new URL('..', import.meta.url).pathname);
const lire = (p) => readFileSync(resolve(root, p), 'utf8');
const evalArray = (source, declaration) => {
  const start = source.indexOf(declaration);
  assert.ok(start >= 0, `${declaration} existe`);
  const open = source.indexOf('[', start);
  const end = source.indexOf('\n  ];', open);
  assert.ok(end > open, `${declaration} se termine`);
  return JSON.parse(JSON.stringify(vm.runInNewContext(source.slice(open, end + 4))));
};

test('TP6 devient une vraie capsule vidéo de la vitrine SQL', () => {
  const app = lire('assets/js/app.js');
  const catalogue = evalArray(app, 'var CATALOGUE_VIDEOS = [');
  const video = catalogue.find((v) => v.id === 'sql-tp6-mission-cinema');
  assert.ok(video, 'vidéo SQL TP6 présente dans le catalogue principal');
  assert.equal(video.matiere, 'sql');
  assert.equal(video.reserve4si, true);
  assert.equal(video.dureeTexte, '12:49');
  assert.equal(video.srcPrincipal, 'mission-cinema/assets/video/TD_SQL_Cinema_corrige_v3.mp4');
  assert.equal(video.urlCours, 'mission-cinema/correction-video.html');
  assert.ok(existsSync(resolve(root, video.srcPrincipal)));
  const capsules = vm.runInNewContext('(' + app.split('var CAPSULES_VIDEO = ')[1].split(';')[0] + ')');
  assert.equal(capsules[video.id], true, 'libellé et style de la carte TP6 activés');
  assert.equal(catalogue.length, 28);
});

test('l’accueil et le cours SQL pointent vers la capsule avec son habillage', () => {
  const index = lire('index.html');
  assert.match(index, /data-count="28">28<\/span>/);
  assert.match(index, /data-video-filter="all">Toutes \(28\)<\/button>/);
  assert.match(index, /data-video-filter="sql">SQL \(5\)<\/button>/);
  assert.match(index, /🎥 2 vidéos \+ 3 TP/);
  const sql = lire('cours/sql.html');
  assert.match(sql, /capsules-vedettes\.css\?v=587/);
  assert.match(sql, /matiere-video-card sti-capsule-vedette/);
  assert.match(sql, /<span class="sti-etiquette-capsule"[^>]*>Je fais tout le SQL<\/span>/);
  assert.match(sql, /<h3>Série 6 · Mission cinéma<\/h3>/);
  assert.match(sql, /TP6-Mission-cinema-enonce\.html[^>]*>Énoncé A4 ↗<\/a>/);
  assert.match(sql, /TP6-Mission-cinema-enonce\.html"[^>]*>Ouvrir le TP ↗<\/a>/);
  assert.match(sql, /data-video-open="sql-tp6-mission-cinema">▶ Vidéo<\/button>/);
  assert.match(sql, /<summary>Voir le corrigé<\/summary>/);
  assert.match(sql, /Corrige_TD_SQL_Cinema\.pdf[^>]*>Corrigé PDF ↗<\/a>/);
  assert.match(sql, /data-exercise="serie6"/);
  assert.match(sql, /Série 6 faite<\/label>/);
});

test('la capsule contient la correction vidéo, le PDF et sept rappels de cours', () => {
  const page = lire('mission-cinema/correction-video.html');
  const enonce = lire('exercices/sql/TP6-Mission-cinema-enonce.html');
  assert.match(page, /TD_SQL_Cinema_corrige_v3\.mp4/);
  const enoncePage = lire('exercices/sql/TP6-Mission-cinema-enonce.html');
  assert.match(enoncePage, /@media print/);
  assert.match(page, /70 questions du corrigé actualisé/);
  assert.match(page, /Je fais tout le SQL/);
  assert.match(page, /#1a365d/);
  assert.match(page, /Ouvrir directement la vidéo/);
  assert.match(lire('assets/js/protection.js'), /estMissionCinema/);
  assert.match(lire('mission-cinema/README.md'), /70 questions réparties en sept parties/);
  assert.match(lire('mission-cinema/README.md'), /pas la réutilisation de l’ancien MP4/);
  assert.match(page, /Corrige_TD_SQL_Cinema\.pdf/);
  assert.equal((page.match(/class="part-btn"/g) || []).length, 7);
  assert.equal((page.match(/\{title:'/g) || []).length, 7);
  assert.equal((enonce.match(/class="question"/g) || []).length, 70);
  assert.doesNotMatch(enonce, /Résultat attendu\s*:/i);
});

test('le suivi vidéo et le tableau de bord connaissent le nouvel identifiant', () => {
  const admin = lire('assets/js/admin.js');
  const adminCatalogue = evalArray(admin, 'var CATALOGUE_VIDEOS_ADMIN = [');
  assert.ok(adminCatalogue.some((v) => v.key === 'video:sql-tp6-mission-cinema' && v.niveau === '4si'));
  const vues = evalArray(lire('assets/js/admin-vues-videos.js'), 'var CATALOGUE = [');
  assert.ok(vues.some((v) => v.id === 'sql-tp6-mission-cinema'));
  assert.equal(adminCatalogue.length, 34);
  assert.equal(vues.length, 34);
});

test('publication v620 et paquet hors ligne incluent le guide visuel SQL', () => {
  const sw = lire('sw.js');
  const sql = lire('cours/sql.html');
  assert.match(sql, /class=\"source-btn\" href=\"\.\.\/mission-cinema\/Corrige_TD_SQL_Cinema_guide_visuel\.pdf\"[^>]*>👁 Voir le guide visuel/);
  assert.match(sw, /var VERSION_PUBLIEE = "v627"/);
  assert.match(sw, /url: "\.\/cours\/sql\.html", revision: "serie7-sql-v627"/);
  const delta = sw.split('var UPDATE_FILES = [')[1].split('];')[0];
  assert.ok(!delta.includes('./mission-cinema/Corrige_TD_SQL_Cinema_guide_visuel.pdf'), 'le PDF ne rejoint pas le delta automatique');
  for (const path of [
    'exercices/sql/TP6-Mission-cinema-enonce.html',
    'cours/sql.html',
    'mission-cinema/correction-video.html',
    'mission-cinema/Corrige_TD_SQL_Cinema.pdf',
    'mission-cinema/Corrige_TD_SQL_Cinema_guide_visuel.pdf',
    'mission-cinema/assets/images/je-fais-tout-sql-poster.jpg',
    'mission-cinema/assets/video/TD_SQL_Cinema_corrige_v3.mp4'
  ]) {
    assert.ok(sw.includes(`"./${path}"`), `${path} dans la liste hors ligne`);
  }
  const manifest = JSON.parse(lire('offline-complete-manifest.json'));
  for (const path of [
    'exercices/sql/TP6-Mission-cinema-enonce.html',
    'cours/sql.html',
    'mission-cinema/correction-video.html',
    'mission-cinema/Corrige_TD_SQL_Cinema.pdf',
    'mission-cinema/Corrige_TD_SQL_Cinema_guide_visuel.pdf',
    'mission-cinema/assets/images/je-fais-tout-sql-poster.jpg',
    'mission-cinema/assets/video/TD_SQL_Cinema_corrige_v3.mp4'
  ]) {
    const entry = manifest.files.find((f) => f.path === path);
    assert.ok(entry, `${path} dans le manifeste hors ligne`);
    const data = readFileSync(resolve(root, path));
    const sha = createHash('sha1').update(`blob ${data.length}\0`).update(data).digest('hex');
    assert.equal(entry.bytes, data.length);
    assert.equal(entry.gitSha, sha);
  }
  assert.equal(manifest.totalFiles, manifest.files.length);
});
