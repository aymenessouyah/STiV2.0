import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = path => readFileSync(join(root, path), 'utf8');
const html = read('cours/javascript.html');
const js = read('assets/js/cours-javascript.js');
const css = read('assets/css/cours-javascript.css');
const count = (text, pattern) => [...text.matchAll(pattern)].length;

test('JavaScript : quinze chapitres historiques, 27 énoncés et corrigés', () => {
  assert.equal(count(html, /data-chapter-id="sec\d+"/g), 15);
  for (let i = 1; i <= 15; i++) assert.match(html, new RegExp(`id="sec${i}"`));
  assert.match(html, /id="sec9"[\s\S]*?Chaînes de caractères/);
  assert.match(html, /id="sec11"[\s\S]*?Objet Date/);
  assert.equal(count(html, /data-exo-check="exo-js-\d+"/g), 27);
  assert.equal(count(html, /class="js-exercise__solution"/g), 27);
  assert.equal(count(html, /class="fnbtn"/g), 15);
  assert.equal(count(html, /class="fn-panel" id="(?:m|s)-[a-z0-9]+"/g), 15);
  for (const frag of ['sec1', 'sec15', 'cours', 'exercices', 'annexes', 'videos']) assert.ok(html.includes(`id="${frag}"`), frag);
  assert.ok(html.includes('../quiz/javascript.html'));
  assert.ok(js.includes("fragment === 'sec16'"));
});

test('les 68 blocs de code de référence restent complets et dans le même ordre', () => {
  /* Empreinte de la référence après décodage des entités et retrait des seuls espaces de fin de ligne. */
  const entites = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0' };
  const texte = s => s.replace(/<[^>]*>/g, '').replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (entite, nom) => {
    if (nom[0] === '#') return String.fromCodePoint(nom[1].toLowerCase() === 'x' ? parseInt(nom.slice(2), 16) : parseInt(nom.slice(1), 10));
    return entites[nom.toLowerCase()];
  }).replace(/[ \t]+$/gm, '').trim();
  const extraits = [...html.matchAll(/<pre\b(?![^>]*data-run-output)[^>]*>([\s\S]*?)<\/pre\s*>/gi)].map(m => texte(m[1]));
  assert.equal(extraits.length, 68);
  assert.equal(createHash('sha256').update(extraits.join('\0')).digest('hex'), 'd8e085b6e99d19857db2acae8c3402da4b76128e958be65218510caa59367d12');
});

test('récapitulatif original, documents et neuf ressources conservés', () => {
  assert.ok(/id="jsRecapFrame"[^>]*src="Recap-JavaScript-STI\.html\?embed=1"[^>]*loading="lazy"/.test(html));
  assert.ok(/id="jsRecapModal"[^>]*>\s*<div[^>]*role="dialog"[^>]*aria-modal="true"/.test(html));
  assert.ok(/<button[^>]*id="jsRecapResize"[^>]*aria-label="Redimensionner/.test(html));
  for (const path of ['cours/Recap-JavaScript-STI.html', 'documents/annexes/annexe-javascript.pdf.html', 'documents/annexes/annexe-javascript.pdf', 'livre-smart.html', 'assets/videos/javascript-cours.mp4', 'assets/audio/javascript-cours.mp3', 'quiz/javascript.html']) assert.ok(existsSync(join(root, path)), path);
  assert.equal(count(html, /class="js-series-card"/g), 9);
  for (let i = 1; i <= 5; i++) for (const name of [`Tp${i}-js.html`, `Tp${i}-Correction-js.html`]) {
    const path = `exercices/javascript/${name}`;
    assert.ok(html.includes(`../${path}`), path); assert.ok(existsSync(join(root, path)), path);
  }
  const catalogue = read('assets/js/app.js').split('    javascript: {')[1].split('    sql: {')[0];
  for (let i = 1; i <= 5; i++) for (const name of [`Tp${i}-js.html`, `Tp${i}-Correction-js.html`]) assert.ok(catalogue.includes(`exercices/javascript/${name}`), name);
  for (const path of ['exercices/javascript/js-37-defis-tt.html', 'projets/fleurs/media/projet-fleurs-4sti-eleve.pdf.html', 'projets/carte-bancaire/cb.html']) assert.ok(html.includes(`../${path}`), path);
});

test('les 17 liens intégrés gardent un repli natif et leurs documents', () => {
  const liens = [...html.matchAll(/<a\b([^>]*\bdata-open-js-resource\b[^>]*)>/g)];
  assert.equal(liens.length, 17);
  for (const [, attributs] of liens) {
    const href = /href="([^"]+)"/.exec(attributs)?.[1];
    assert.ok(href && href.startsWith('../'), attributs);
    assert.ok(existsSync(join(root, decodeURIComponent(href.slice(3)))), href);
    assert.ok(!/target="_blank"/.test(attributs), 'le clic simple ne dépend pas d’une fenêtre pop-up');
  }
  assert.match(html, /id="jsResourceModal"[^>]*>\s*<div[^>]*role="dialog"[^>]*aria-modal="true"/);
  assert.match(html, /id="jsResourceFrame"[^>]*src="about:blank"/);
  assert.ok(!/<iframe[^>]*id="jsResourceFrame"[^>]*sandbox=/.test(html), 'documents historiques de confiance ; les éditeurs restent isolés');
  assert.ok(js.includes('fermerRessource') && js.includes('gererNavigationRessource'));
  assert.ok(read('exercices/javascript/js-37-defis-tt.html').includes('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'));
  assert.ok(read('assets/js/dialogues-compat.js').includes('../../assets/audio/foret.mp3'), 'repli local en cas de réseau indisponible');
  for (const path of ['assets/js/dialogues-compat.js', 'assets/css/dialogues-compat.css']) assert.ok(existsSync(join(root, path)), path);
});

test('vidéo, onglets, éditeurs isolés et profil sans accès direct au stockage', () => {
  assert.match(html, /id="heroJsVideo"[^>]*controls[^>]*playsinline[^>]*preload="metadata"/);
  assert.match(html, /src="\.\.\/assets\/videos\/javascript-cours\.mp4"/);
  assert.ok(/id="jsVideoModal"[^>]*>\s*<div[^>]*role="dialog"/.test(html));
  for (const name of ['cours', 'exercices', 'annexes', 'videos']) assert.ok(html.includes(`data-course-tab="${name}"`));
  assert.equal(count(html, /data-playground/g), 4);
  assert.equal(count(html, /sandbox="allow-scripts"/g), 4);
  assert.ok(!html.includes('allow-same-origin'));
  assert.ok(js.includes("connect-src \\'none\\'"));
  assert.ok(js.includes("f.contentWindow === ev.source"));
  assert.ok(!/\beval\s*\(/.test(js));
  assert.ok(!/localStorage|sessionStorage/.test(js));
  for (const methode of ['definirEtatChapitre', 'enregistrerLecture', 'basculerExerciceFait', 'enregistrerPositionVideo', 'enregistrerLaboratoire']) assert.ok(js.includes(methode), methode);
  assert.ok(js.includes('ouvrirVideoPasAPasSTI'));
  assert.ok(!/#[a-f0-9]{3,8}\b/i.test(css), 'les couleurs ajoutées viennent des variables du thème');
  const scripts = ['config.js', 'supabase-umd.js', 'acces.js', 'sync-progressions.js', 'profil.js', 'app.js', 'cours-javascript.js'].map(s => html.lastIndexOf('/' + s));
  assert.ok(scripts.every(i => i > 0) && scripts.every((i, n) => !n || i > scripts[n - 1]), 'ordre des scripts');
});

test('hors ligne : révisions, médias et empreintes des ressources JavaScript', () => {
  const sw = read('sw.js');
  const delta = sw.split('var UPDATE_FILES = [')[1].split('];')[0];
  const shell = sw.split('var SHELL = [')[1].split('];')[0];
  const offline = sw.split('var OFFLINE_LIST = [')[1].split('];')[0];
  const paths = ['cours/javascript.html', 'assets/css/cours-javascript.css', 'assets/js/cours-javascript.js', 'assets/js/app.js', 'assets/js/profil.js'];
  const ressources = ['exercices/javascript/js-37-defis-tt.html', 'assets/css/dialogues-compat.css', 'assets/js/dialogues-compat.js', 'projets/fleurs/index.html', 'projets/fleurs/inscription.html', 'projets/fleurs/controle.js', 'projets/fleurs/styles.css', 'projets/formulaire-inscription/cvFleurs.html', 'projets/carte-bancaire/cb.html', 'projets/carte-bancaire/controle.js', 'projets/carte-bancaire/style.css'];
  for (const path of [...paths, ...ressources]) {
    const actualises = ['assets/js/cours-javascript.js', 'assets/js/dialogues-compat.js', 'projets/fleurs/controle.js', 'projets/carte-bancaire/controle.js'];
    /* v521 : ces pages ont reçu leur meta description après le lot de fidélité v481. */
    const pagesMetaV521 = ['exercices/javascript/js-37-defis-tt.html', 'projets/fleurs/index.html', 'projets/fleurs/inscription.html', 'projets/formulaire-inscription/cvFleurs.html', 'projets/carte-bancaire/cb.html'];
    const revision = path === 'assets/js/app.js' ? 'outils-attirants-v518' :
      path === 'cours/javascript.html' ? 'retrait-fond-cours-v508' :
      path === 'assets/js/cours-javascript.js' ? 'progression-chapitres-v492' :
      path === 'assets/js/profil.js' ? 'xp-jamais-en-recul-v520' :
      pagesMetaV521.includes(path) ? 'meta-seo-v521' :
      actualises.includes(path) ? 'fidelite-origine-v481' : 'correctif-ressources-js-20261027';
    assert.ok(delta.includes(`url: "./${path}", revision: "${revision}"`), path);
    assert.ok(offline.includes(`"./${path}"`), path);
  }
  for (const path of ['assets/css/cours-javascript.css', 'assets/js/cours-javascript.js', 'assets/css/dialogues-compat.css', 'assets/js/dialogues-compat.js', 'exercices/javascript/js-37-defis-tt.html']) assert.ok(shell.includes(`"./${path}"`), path);
  for (const path of ['cours/Recap-JavaScript-STI.html', 'assets/videos/javascript-cours.mp4', 'assets/videos/validation-nom-prenom-js.mp4', 'assets/subtitles/validation-nom-prenom-js-fr.vtt', 'assets/audio/javascript-cours.mp3', 'assets/audio/foret.mp3']) assert.ok(offline.includes(`"./${path}"`), path);
  assert.ok(!delta.includes('"./assets/videos/javascript-cours.mp4"'), 'pas de téléchargement automatique du média lourd');
  assert.ok(!delta.includes('"./assets/videos/validation-nom-prenom-js.mp4"'), 'pas de téléchargement automatique de la vidéo Nom & Prénom');
  const manifest = JSON.parse(read('offline-complete-manifest.json'));
  assert.equal(manifest.totalFiles, manifest.files.length);
  assert.equal(manifest.totalBytes, manifest.files.reduce((n, f) => n + f.bytes, 0));
  for (const path of ['sw.js', ...paths, ...ressources]) {
    const entree = manifest.files.find(f => f.path === path); assert.ok(entree, path);
    const data = readFileSync(join(root, path));
    assert.equal(entree.bytes, data.length, path);
    assert.equal(entree.gitSha, createHash('sha1').update(`blob ${data.length}`).update(Buffer.from([0])).update(data).digest('hex'), path);
  }
});

test('profil partagé : chapitres, exercices, vidéo et récapitulatif restent regroupés', () => {
  const storage = new Map(), writes = [];
  const window = { localStorage: { getItem: k => storage.get(k) || null, setItem: (k, v) => { writes.push(k); storage.set(k, v); } }, dispatchEvent() {} };
  window.window = window; window.CustomEvent = function CustomEvent() {};
  vm.runInNewContext(read('assets/js/profil.js'), window);
  const api = window.STIProfil;
  api.definirEtatChapitre('javascript', 'sec3', 'revise'); api.enregistrerLecture('javascript', 'sec3');
  api.basculerExerciceFait('javascript', 'exo-js-1'); api.enregistrerPositionVideo({ id: 'javascript-cours', temps: 42 }); api.enregistrerLaboratoire('javascript', 'recap-javascript');
  const p = api.chargerProfil();
  assert.equal(p.chapitres.javascript.sec3, 'revise'); assert.equal(p.derniereLecture.chapitreId, 'sec3');
  assert.ok(p.exercicesFaits.javascript.includes('exo-js-1')); assert.equal(p.videos.positions['javascript-cours'], 42);
  assert.ok(p.laboratoires.javascript.includes('recap-javascript'));
  api.enregistrerPositionVideo({ id: 'javascript-cours', terminee: true });
  assert.ok(api.chargerProfil().videos.vues.includes('javascript-cours'));
  assert.deepEqual([...new Set(writes)], ['sti-profil-abonne']);
});

test('vidéo Validation Nom & Prénom : déplacée dans assets/videos et intégrée dans Série JavaScript et Vidéos explicatives', () => {
  assert.equal(existsSync(join(root, 'assets/videos/validation-nom-prenom-js.mp4')), true);
  assert.equal(existsSync(join(root, 'exercices/javascript/validation-nom-prenom-js.mp4')), false);
  assert.equal(existsSync(join(root, 'assets/subtitles/validation-nom-prenom-js-fr.vtt')), true);

  const seriesHtml = read('exercices/series-exercices.html');
  const blocSeriesJs = seriesHtml.split('<section class="subject" id="javascript">')[1].split('</section>')[0];
  assert.match(blocSeriesJs, /id="js"/);
  assert.equal((blocSeriesJs.match(/ouvrirVideoPasAPasSTI\('validation-nom-prenom-js'/g) || []).length, 2);
  assert.match(blocSeriesJs, /Série 5 — Objet String[\s\S]*?ouvrirVideoPasAPasSTI\('validation-nom-prenom-js'/);

  const coursJsHtml = read('cours/javascript.html');
  assert.match(coursJsHtml, /Série 5 — Objet String[\s\S]*?ouvrirVideoPasAPasSTI\('validation-nom-prenom-js'/);
  assert.match(coursJsHtml, /id="tabJsValidationVideo"[^>]*data-video-id="validation-nom-prenom-js"/);
  assert.match(coursJsHtml, /\.\.\/assets\/videos\/validation-nom-prenom-js\.mp4/);

  const indexHtml = read('index.html');
  assert.match(indexHtml, /data-video-filter="javascript">JS \(2\)</);
  assert.match(indexHtml, /🎥 2 vidéos &amp; 🔊 audio/);
  assert.match(indexHtml, /href="cours\/javascript\.html#videos">🎥 2 Vidéos</);

  const appJs = read('assets/js/app.js');
  assert.match(appJs, /id:\s*"validation-nom-prenom-js"[\s\S]*?dureeTexte:\s*"12:11"[\s\S]*?srcPrincipal:\s*"assets\/videos\/validation-nom-prenom-js\.mp4"/);
  assert.match(appJs, /javascript:\s*\{[\s\S]*?nbVideos:\s*2,/);

  const lecteurJs = read('assets/js/lecteur-commun.js');
  assert.match(lecteurJs, /'validation-nom-prenom-js':\s*\['javascript',\s*'Validation du champ Nom & Prénom'\]/);

  const protJs = read('assets/js/protection.js');
  assert.match(protJs, /STI_CHAPITRES_MEDIA\["validation-nom-prenom-js"\]\s*=\s*\[/);
  assert.match(protJs, /videos\/validation-nom-prenom-js\.mp4/);
  assert.match(protJs, /subtitles\/validation-nom-prenom-js-fr\.vtt/);
});
