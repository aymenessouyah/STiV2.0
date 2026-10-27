import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import vm from 'node:vm';

const root = new URL('..', import.meta.url).pathname;
const read = path => readFileSync(join(root, path), 'utf8');
const html = read('cours/css3.html');
const controller = read('assets/js/cours-css3.js');
const css = read('assets/css/cours-css3.css');
const chapters = ['selecteurs', 'typographie', 'arriere-plan', 'boite-display', 'marges-debordement', 'positionnement', 'tableaux-listes', 'filtres', 'animations', 'pas-a-pas'];
const windows = ['win-box-model', 'win-float', 'win-text-shadow', 'win-bg-color', 'win-bg-shorthand', 'win-radius', 'win-box-shadow', 'win-table-layout', 'win-collapse', 'win-filter', 'win-transition', 'win-animation', 'win-bg-image', 'win-bg-repeat', 'win-bg-size', 'win-bg-clip', 'win-overflow', 'win-opacity', 'win-rotate', 'win-skew', 'win-scale', 'win-translate', 'win-link-states'];

test('CSS3 : chapitres, ancres historiques, onglets et accès préservés', () => {
  for (const id of chapters) {
    assert.match(html, new RegExp(`<section id="${id}"[^>]*data-chapter-id="${id}"`), id);
    assert.ok(html.includes(`data-toggle-revise="${id}"`), id);
  }
  for (let n = 1; n <= 8; n++) assert.ok(html.includes(`id="point-${n}"`));
  for (const id of ['cours', 'exercices', 'annexes', 'videos']) {
    assert.ok(html.includes(`data-course-tab="${id}"`));
    assert.ok(html.includes(`data-course-panel="${id}"`));
  }
  assert.match(html, /href="\.\.\/quiz\/html-css\.html"/);
  assert.match(html, /data-course-unified="css3"/);
  const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(m => m[1].split('?')[0]);
  assert.deepEqual(scripts.slice(0, 6), [
    '../assets/js/config.js', '../assets/js/supabase-umd.js', '../assets/js/acces.js',
    '../assets/js/sync-progressions.js', '../assets/js/profil.js', '../assets/js/app.js'
  ]);
  assert.match(read('assets/js/app.js'), /css3:\s*"css3"/);
  assert.match(read('assets/js/app.js'), /\.html#exercices/);
});

test('CSS3 : fenêtres originales, laboratoires, exemples, diagramme et sandbox', () => {
  assert.equal((html.match(/<template\s+id="win-/g) || []).length, 23);
  for (const id of windows) {
    assert.ok(html.includes(`<template id="${id}"`), id);
    assert.ok(html.includes(`data-win="${id}"`), id);
  }
  for (const fragment of [
    'css-definition-typing', 'course-topics', 'box-explorer', 'data-box-layer="margin"',
    'data-box-layer="border"', 'data-box-layer="padding"', 'data-box-layer="content"',
    'background: url("a.jpg") center cover', 'background: url("a.jpg") center / cover',
    'class="slab', 'class="slab tslab', 'data-demo="float"', 'data-demo="bgrepeat"',
    'position-origin-marker', 'list-style-position', 'filter-detail-page',
    'data-banner-toggle', 'role="dialog" aria-modal="true" aria-labelledby="modal-title"',
    'id="modalResizeHandle"', 'id="cssEditorPreview"', 'id="cssEditorHtml"'
  ]) assert.ok(html.includes(fragment), fragment);
  assert.match(html, /<iframe id="cssEditorPreview"[^>]*\bsandbox(?:\s|>)/);
  assert.doesNotMatch(html, /sandbox="[^"]*allow-same-origin/);
  assert.match(controller, /Content-Security-Policy/);
  assert.match(controller, /frame\.setAttribute\('sandbox',''\)/);
  assert.match(controller, /ev\.key==='Escape'/);
  assert.match(controller, /enregistrerLaboratoire\(MATIERE,nom\)/);
  assert.doesNotMatch(html + controller, /\blocalStorage\s*\./);
  assert.doesNotMatch(html + controller, /supabase\.co|sb_publishable_|vywujxm/i);
  assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b|\brgba?\(/i);
  assert.match(css, /var\(--course-accent\)/);
});

test('CSS3 : huit exercices, corrections, documents et médias locaux', () => {
  assert.equal((html.match(/class="exo-card-full"/g) || []).length, 8);
  assert.equal((html.match(/data-exo-check="[^"]+"/g) || []).length, 8);
  assert.equal((html.match(/class="exo-solution"/g) || []).length, 6);
  assert.equal((html.match(/class="exo-no-solution"/g) || []).length, 2);
  const projet = html.split('<article class="exo-card-full" id="exo-tunisie"')[1].split('</article>')[0];
  assert.ok(projet.indexOf('<details class="exo-solution">') < projet.indexOf('Site Tunisie — Correction Animée'), 'les corrections restent masquées');
  for (const fragment of [
    'TP 1 — Structure', 'TP 2', 'TP 3', 'activité 1', 'Explore Tunisie', 'Site Tunisie',
    'Corrigé 1 : Flexbox', 'Corrigé 2 : Float', '../quiz/html-css.html',
    '../Positionnement-animee/index.html', '../cssanimee/index.html',
    '../projets/site-tunisie/correction-details/carte-timbre-droite-haut.html',
    '../assets/videos/displayanim.mp4', '../documents/annexes/annexe-css3.pdf'
  ]) assert.ok(html.toLowerCase().includes(fragment.toLowerCase()), fragment);
  assert.match(html, /<video[^>]*controls[^>]*playsinline[^>]*preload="metadata"[^>]*poster=/);
  assert.match(controller, /STIProfil\.enregistrerPositionVideo/);
  assert.match(controller, /global\.ouvrirVideoPasAPasSTI\(ancien\[0\]/);
  for (const match of html.matchAll(/(?:href|src|data-preview-doc)="(\.\.\/[^"#?]+)"/g)) {
    const path = decodeURI(match[1]);
    assert.ok(existsSync(join(root, 'cours', path)), path);
  }
});

test('CSS3 pas à pas : les deux vidéos originales sont lisibles dans le cours et la playlist', () => {
  const bloc = html.split('<section class="pas-a-pas-videos"')[1].split('</section>')[0];
  for (const [id, videoId, fichier] of [
    ['stepPositionVideo', 'css-positionnement', 'css-positionnement.mp4'],
    ['stepDecoVideo', 'css-animee', 'css-animee.mp4']
  ]) {
    assert.match(bloc, new RegExp(`<video id="${id}"[^>]*data-video-id="${videoId}"[^>]*controls[^>]*playsinline[^>]*preload="none"`));
    assert.ok(bloc.includes(`../assets/videos/${fichier}`));
    assert.ok(existsSync(join(root, 'assets/videos', fichier)));
    assert.ok(controller.includes(`videoId:'${videoId}',video:'../assets/videos/${fichier}'`));
  }
  assert.ok(html.includes('id="playlistLessonVideo"'));
  assert.ok(html.includes('id="playlistLessonVideoCard"'));
  assert.ok(html.includes('id="playlistLessonDownload"'));
  assert.match(controller, /positionVideo\(identifiantVideo\(video\)\)/);
  const preparation = controller.split('function preparerChangementVideo')[1].split('function selectionPlaylist')[0];
  assert.ok(preparation.indexOf('enregistrerVideo(lecteur,false)') >= 0);
  assert.ok(preparation.indexOf('enregistrerVideo(lecteur,false)') < preparation.indexOf('lecteur.pause()'));
  assert.match(controller, /preparerChangementVideo\(lecteur\);\s*lecteur\.dataset\.videoId=lecon\.videoId/);
  assert.match(controller, /if\(!ouvert\).*video\.pause\(\)/);
});

test('CSS3 : fichiers révisés disponibles pour le hors-ligne', () => {
  const sw = read('sw.js');
  const delta = sw.split('var UPDATE_FILES = [')[1].split('];')[0];
  const shell = sw.split('var SHELL = [')[1].split('];')[0];
  const offline = sw.split('var OFFLINE_LIST = [')[1].split('];')[0];
  for (const path of ['cours/css3.html', 'assets/css/cours-css3.css', 'assets/js/cours-css3.js', 'assets/js/profil.js', 'assets/js/app.js']) {
    const revision = path === "assets/css/cours-css3.css" ? "videos-pas-a-pas-css3-20261027" :
      path === 'assets/js/app.js' ? 'video-js-validation-v485' :
      path === 'assets/js/profil.js' ? 'xp-operations-v487' :
      ['assets/js/profil.js', 'cours/css3.html'].includes(path) ? 'cours-retour-xp-v486' : 'fidelite-origine-v481';
    assert.ok(delta.includes(`url: "./${path}", revision: "${revision}"`), path);
    assert.ok(offline.includes(`"./${path}"`), path);
  }
  for (const path of ['assets/css/cours-css3.css', 'assets/js/cours-css3.js']) assert.ok(shell.includes(`"./${path}"`), path);
  for (const video of ['displayanim.mp4', 'css-positionnement.mp4', 'css-animee.mp4']) {
    assert.ok(offline.includes(`"./assets/videos/${video}"`), video);
    assert.ok(!delta.includes(`"./assets/videos/${video}"`), 'pas de téléchargement vidéo automatique');
  }
  const manifest = JSON.parse(read('offline-complete-manifest.json'));
  assert.equal(manifest.totalFiles, manifest.files.length);
  assert.equal(manifest.totalBytes, manifest.files.reduce((n, f) => n + f.bytes, 0));
  for (const path of ['sw.js', 'cours/css3.html', 'assets/css/cours-css3.css', 'assets/js/cours-css3.js', 'assets/js/profil.js', 'assets/js/app.js']) {
    const entree = manifest.files.find(f => f.path === path);
    assert.ok(entree, path);
    const data = readFileSync(join(root, path));
    const sha = createHash('sha1').update(`blob ${data.length}`).update(Buffer.from([0])).update(data).digest('hex');
    assert.equal(entree.bytes, data.length, path);
    assert.equal(entree.gitSha, sha, path);
  }
});

function profilVM(initial) {
  const data = new Map([['sti-profil-abonne', JSON.stringify(initial)]]), writes = [];
  const rootElement = { classList: { add() {}, remove() {}, contains() { return false; }, toggle() {} }, setAttribute() {} };
  const contexte = {
    document: { documentElement: rootElement, body: { classList: rootElement.classList } },
    localStorage: { getItem: k => data.get(k) ?? null, setItem(k, v) { writes.push(k); data.set(k, String(v)); }, removeItem(k) { writes.push(k); data.delete(k); } },
    matchMedia: () => ({ matches: false }), addEventListener() {}, dispatchEvent() {}, setTimeout() {},
    CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init?.detail; } }
  };
  contexte.window = contexte;
  vm.createContext(contexte);
  vm.runInContext(read('assets/js/profil.js'), contexte);
  return { api: contexte.STIProfil, writes };
}

test('profil : une position distincte pour chaque vidéo CSS3', () => {
  const { api, writes } = profilVM({ prenom: 'Élève', videos: { vues: [], positions: {} } });
  for (const [id, temps] of [['css3-display', 4], ['css-positionnement', 83], ['css-animee', 132]]) {
    api.enregistrerPositionVideo({ id, matiere: 'css3', temps, duree: 400 });
  }
  let positions = api.chargerProfil().videos.positions;
  assert.equal(positions['css3-display'], 4);
  assert.equal(positions['css-positionnement'], 83);
  assert.equal(positions['css-animee'], 132);
  api.enregistrerPositionVideo({ id: 'css-positionnement', matiere: 'css3', terminee: true });
  const videos = api.chargerProfil().videos;
  positions = videos.positions;
  assert.equal(positions['css-positionnement'], undefined);
  assert.equal(positions['css-animee'], 132);
  assert.ok(videos.vues.includes('css-positionnement'));
  assert.ok(writes.every(k => k === 'sti-profil-abonne'));
});

test('profil : usage des laboratoires dédupliqué, sans perdre les données existantes', () => {
  const { api, writes } = profilVM({
    prenom: 'Élève', theme: 'clair', chapitres: { html5: { entete: 'revise' } },
    quiz: [{ matiere: 'HTML', score: 4, total: 5, date: '2026-10-01', erreurs: ['q1'] }],
    notes: [{ atelier: 'TP', note: 15, date: '2026-10-01' }],
    laboratoires: { css3: ['box-shadow', 'box-shadow', 'identifiant invalide'] }
  });
  api.enregistrerLaboratoire('css3', 'box-shadow');
  api.enregistrerLaboratoire('css3', 'text-shadow');
  api.enregistrerLaboratoire('css3', 'float');
  api.enregistrerLaboratoire('css3', 'nom invalide');
  api.enregistrerLaboratoire('matiere-inconnue', 'valide');
  api.enregistrerLecture('css3', 'selecteurs', 'CSS3 — Sélecteurs', 3, 'cours/css3.html#selecteurs');
  api.basculerExerciceFait('css3', 'exo-tp1', true);
  const p = api.chargerProfil();
  assert.deepEqual(Array.from(p.laboratoires.css3), ['box-shadow', 'text-shadow', 'float']);
  assert.equal(p.chapitres.html5.entete, 'revise');
  assert.equal(p.chapitres.css3.selecteurs, 'en_cours');
  assert.deepEqual(Array.from(p.exercicesFaits.css3), ['exo-tp1']);
  assert.equal(p.quiz[0].erreurs[0], 'q1');
  assert.equal(p.notes[0].note, 15);
  assert.ok(writes.length > 0 && writes.every(k => k === 'sti-profil-abonne'));
});
