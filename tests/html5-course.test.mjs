import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import vm from 'node:vm';

const root = new URL('..', import.meta.url).pathname;
const read = path => readFileSync(join(root, path), 'utf8');
const html = read('cours/html5.html');
const script = read('assets/js/cours-html5.js');
const css = read('assets/css/cours.css');
const chapterIds = ['entete', 'structuration', 'conteneurs', 'listes', 'tableaux', 'texte-media', 'attributs-evenements', 'target-explication', 'formulaires', 'iframe'];

test('cours HTML5 : chapitres de référence, onglets et scripts dans l’ordre demandé', () => {
  for (const id of chapterIds) assert.match(html, new RegExp(`<section\\s+id="${id}"`), id);
  for (const id of ['cours', 'exercices', 'annexes', 'videos']) {
    assert.match(html, new RegExp(`data-course-tab="${id}"`));
    assert.match(html, new RegExp(`data-course-panel="${id}"`));
  }
  assert.match(html, /href="\.\.\/quiz\/html-css\.html"/);
  const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(m => m[1].split('?')[0]);
  assert.deepEqual(scripts.slice(0, 6), [
    '../assets/js/config.js', '../assets/js/supabase-umd.js', '../assets/js/acces.js',
    '../assets/js/sync-progressions.js', '../assets/js/profil.js', '../assets/js/app.js'
  ]);
  assert.match(html, /<script[^>]*acces\.js[^>]*\bdefer\b/i);
  assert.match(html, /data-course-unified="html5"/);
  assert.match(read('assets/js/app.js'), /hasAttribute\("data-course-unified"\)/);
});

test('exemples, détails target et datalist, médias et exercices restent présents', () => {
  for (const fragment of [
    'Nos catégories de fleurs', 'Tarifs des fleurs du Rafèha', 'attributs associables',
    'evt-click-out', 'iframe-demo-cadre', 'tpl-target', 'tpl-datalist',
    'dl-i-range', 'dl-i-datetime-local', 'zone_resultats', 'formtarget',
    'assets/video/flower.webm', 'assets/audio/foret.mp3', 'assets/audio/html5-cours.mp3',
    'assets/videos/html5-cours.mp4', 'TP 1 — Structure', 'TP Explore Tunisie',
    'Projet 1: Récap', 'Site Tunisie', 'Corrigé 1 : Flexbox'
  ]) assert.ok(html.toLowerCase().includes(fragment.toLowerCase()), fragment);
  // Les 13 exercices suivis restent intacts ; deux cartes donnent accès aux ressources d’origine.
  assert.equal((html.match(/class="exo-card-full"/g) || []).length, 15);
  assert.equal((html.match(/data-exo-check="[^"]+"/g) || []).length, 13);
  assert.match(html, /exercices\/html-css\/emploi-temps\/emploidutemps\.html/);
  assert.match(html, /exercices\/html-css\/formulaire-inscription\.pdf\.html/);
  assert.match(html, /role="dialog" aria-modal="true" aria-labelledby="modal-title"/);
  assert.match(html, /sandbox="allow-scripts allow-forms"/);
  assert.doesNotMatch(html, /sandbox="[^"]*allow-same-origin/);
  assert.match(html, /<video[^>]*controls[^>]*preload="metadata"[^>]*poster=/);
  for (const path of [
    'assets/videos/html5-cours.mp4', 'assets/audio/html5-cours.mp3', 'assets/audio/foret.mp3',
    'assets/video/flower.webm', 'documents/annexes/annexe-html5.pdf',
    'documents/annexes/annexe-html5.pdf.html', 'quiz/html-css.html',
    'exercices/html-css/TP1-css.pdf.html', 'exercices/html-css/TP2/tp2corrposition.html'
  ]) assert.ok(existsSync(join(root, path)), path);
});

test('cours : stockage unique, pas de configuration Supabase intégrée, couleurs par jetons', () => {
  assert.doesNotMatch(html + script, /\blocalStorage\s*\./);
  assert.doesNotMatch(html + script, /supabase\.co|sb_publishable_|vywujxm/i);
  assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b/i);
  assert.match(css, /var\(--course-accent\)/);
  assert.match(script, /STIProfil\.enregistrerLecture/);
  assert.match(script, /STIProfil\.definirEtatChapitre/);
  assert.match(script, /STIProfil\.basculerExerciceFait/);
  assert.match(script, /STIProfil\.enregistrerPositionVideo/);
});

test('hors ligne : nouvelles ressources présentes et anciennes révisions invalidées', () => {
  const sw = read('sw.js');
  const delta = sw.split('var UPDATE_FILES = [')[1].split('];')[0];
  const offline = sw.split('var OFFLINE_LIST = [')[1].split('];')[0];
  for (const path of [
    'cours/html5.html', 'dashboard.html', 'assets/css/theme.css', 'assets/css/cours.css',
    'assets/js/app.js', 'assets/js/profil.js', 'assets/js/cours-html5.js'
  ]) {
    const revision = path === 'assets/js/app.js' ? 'boucle-pour-v537' :
      path === 'cours/html5.html' ? 'tp-display-v510' :
      path === 'assets/css/cours.css' ? 'retrait-fond-cours-v508' :
      path === 'dashboard.html' ? 'accueil-lycee-v503' :
      path === 'assets/js/cours-html5.js' ? 'tp-display-v510' :
      path === 'assets/css/theme.css' ? 'classe-nav-v536' :
      path === 'assets/js/profil.js' ? 'xp-jamais-en-recul-v520' : 'suivi-contextes-v491';
    assert.ok(delta.includes(`url: "./${path}", revision: "${revision}"`), path);
    assert.ok(offline.includes(`"./${path}"`), path);
  }
  assert.ok(offline.includes('"./assets/js/sync-progressions.js"'));
  const manifest = JSON.parse(read('offline-complete-manifest.json'));
  assert.equal(manifest.totalFiles, manifest.files.length);
  assert.equal(manifest.totalBytes, manifest.files.reduce((n, f) => n + f.bytes, 0));
  for (const path of ['sw.js', 'cours/html5.html', 'dashboard.html', 'assets/css/cours.css', 'assets/css/theme.css', 'assets/js/cours-html5.js', 'assets/js/profil.js', 'assets/js/app.js']) {
    const entree = manifest.files.find(f => f.path === path);
    assert.ok(entree, path);
    const contenu = readFileSync(join(root, path));
    const empreinte = createHash('sha1').update(`blob ${contenu.length}`).update(Buffer.from([0])).update(contenu).digest('hex');
    assert.equal(entree.bytes, contenu.length, path);
    assert.equal(entree.gitSha, empreinte, path);
  }
});

function creerProfilVM(initial) {
  const donnees = new Map(initial ? [['sti-profil-abonne', JSON.stringify(initial)]] : []);
  const ecritures = [];
  const classes = new Set(['sti-theme-wait']);
  const attributs = {};
  const racine = {
    classList: {
      add: c => classes.add(c),
      remove: c => classes.delete(c),
      contains: c => classes.has(c),
      toggle: (c, actif) => { if (actif) classes.add(c); else classes.delete(c); }
    },
    setAttribute: (cle, valeur) => { attributs[cle] = valeur; }
  };
  const storage = {
    getItem: cle => donnees.get(cle) ?? null,
    setItem: (cle, valeur) => { ecritures.push(cle); donnees.set(cle, String(valeur)); },
    removeItem: cle => { ecritures.push(cle); donnees.delete(cle); }
  };
  const contexte = {
    document: { documentElement: racine, body: { classList: racine.classList } },
    localStorage: storage,
    matchMedia: () => ({ matches: false }),
    addEventListener() {}, dispatchEvent() {}, setTimeout() {},
    CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init?.detail; } }
  };
  contexte.window = contexte;
  vm.createContext(contexte);
  vm.runInContext(read('assets/js/profil.js'), contexte);
  return { api: contexte.STIProfil, donnees, ecritures, classes, attributs };
}

test('profil : lecture, 10 révisions, exercices et positions vidéo sont conservés ensemble', () => {
  const { api, ecritures, classes, attributs } = creerProfilVM({
    prenom: 'Élève', theme: 'clair', langue: 'fr', tailleTexte: 'normale',
    progression: { html5: true }, quiz: [{ matiere: 'HTML', score: 4, total: 5, date: '2026-10-01', erreurs: ['q1'] }],
    videos: { vues: [], derniere: null }, notes: [{ atelier: 'TP', note: 15, date: '2026-10-01' }]
  });
  assert.equal(attributs['data-theme'], 'clair');
  assert.equal(classes.has('sti-theme-wait'), false);
  api.enregistrerLecture('html5', 'entete', 'HTML5 — En-tête', 5, 'cours/html5.html#entete');
  let p = api.chargerProfil();
  assert.equal(p.chapitres.html5.entete, 'en_cours');
  assert.equal(p.progression.html5, true, 'la lecture ne doit pas effacer un marquage global existant');
  assert.equal(p.derniereLecture.chapitreId, 'entete');
  assert.equal(p.quiz[0].erreurs[0], 'q1');
  assert.equal(p.notes[0].note, 15);
  for (const id of chapterIds) api.definirEtatChapitre('html5', id, 'revise', chapterIds.length);
  assert.equal(api.chargerProfil().progression.html5, true);
  api.definirEtatChapitre('html5', 'listes', 'en_cours', chapterIds.length);
  assert.equal(api.chargerProfil().progression.html5, false);
  api.basculerExerciceFait('html5', 'exo-tp1', true);
  api.basculerExerciceFait('html5', 'exo-tp1', true);
  assert.deepEqual(Array.from(api.chargerProfil().exercicesFaits.html5), ['exo-tp1']);
  api.enregistrerPositionVideo({ id: 'html5-cours', matiere: 'html5', titre: 'Cours', temps: 73, duree: 456 });
  api.enregistrerPositionVideo({ id: 'html5-demo', matiere: 'html5', temps: 9, secondaire: true });
  p = api.chargerProfil();
  assert.equal(p.videos.positions['html5-cours'], 73);
  assert.equal(p.videos.positions['html5-demo'], 9);
  assert.equal(p.videos.derniere.id, 'html5-cours');
  api.enregistrerPositionVideo({ id: 'html5-cours', matiere: 'html5', terminee: true });
  p = api.chargerProfil();
  assert.equal(p.videos.positions['html5-cours'], undefined);
  assert.equal(p.videos.vues.includes('html5-cours'), true);
  assert.ok(ecritures.length > 0 && ecritures.every(cle => cle === 'sti-profil-abonne'));
});
