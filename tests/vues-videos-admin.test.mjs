/* v529 — « Vues des vidéos » : petit coin du tableau de bord admin.
   Couvre les trois étages de la fonctionnalité :
   1. le bloc HTML/CSS monté dans #vue-ensemble-admin et son script ;
   2. le module admin-vues-videos.js (catalogue, agrégation vues/élèves) ;
   3. le compteur de lectures (protection.js) et sa fusion sans perte
      (sync-progressions.js, reconnexion-profil.js), plus le cache hors-ligne. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const racine = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (chemin) => readFileSync(join(racine, chemin), 'utf8');

const MODULE = 'assets/js/admin-vues-videos.js';
const REV = 'vues-videos-v529';

/** Évalue un module navigateur dans un bac à sable minimal (aucun DOM réel). */
function chargerModule(source, options = {}) {
  const stockage = options.localStorage || { getItem() { return null; }, setItem() {}, removeItem() {}, length: 0, key() { return null; } };
  const window = options.window || {};
  const document = options.document || {
    readyState: 'loading',
    addEventListener() {},
    getElementById() { return null; }
  };
  new Function('window', 'document', 'localStorage', source)(window, document, stockage);
  return window;
}

/** Extrait un fragment de code source entre deux marqueurs (bornes excluses). */
function extraire(source, debut, fin) {
  const i = source.indexOf(debut);
  const j = source.indexOf(fin, i + debut.length);
  assert.ok(i >= 0, 'marqueur de début introuvable : ' + debut.slice(0, 48));
  assert.ok(j > i, 'marqueur de fin introuvable : ' + fin.slice(0, 48));
  return source.slice(i, j);
}

/* ───────────────────────── 1. le petit coin dans le tableau de bord ───────────────────────── */

test('le petit coin « Vues des vidéos » est monté dans la vue d’ensemble du tableau de bord', () => {
  const html = lire('admin.html');
  const debutSection = html.indexOf('id="vue-ensemble-admin"');
  const finSection = html.indexOf('</section>', html.indexOf('class="adm-diagnostics-tiroir"', debutSection));
  assert.ok(debutSection > 0 && finSection > debutSection, 'section #vue-ensemble-admin');
  const section = html.slice(debutSection, finSection);
  assert.match(section, /<div class="vues-videos" id="vues-videos-admin"/, 'bloc présent dans la vue d’ensemble');
  for (const id of ['vues-videos-liste', 'vues-videos-etat', 'vues-videos-resume', 'btn-vues-videos']) {
    assert.ok(section.includes(`id="${id}"`), 'élément ' + id);
  }
  /* Le bloc reste discret : après la grille afficheur + compteurs, avant le bandeau Labo 3. */
  assert.ok(section.indexOf('class="vue-ensemble-corps"') < section.indexOf('id="vues-videos-admin"'));
  assert.match(html, /<script src="assets\/js\/admin-vues-videos\.js\?v=529" defer><\/script>/);
  /* Styles dédiés (liste compacte et défilante). */
  assert.match(html, /\.vues-videos-liste\s*\{[^}]*max-height/);
  assert.match(html, /\.vues-video-jauge/);
  assert.match(html, /html\.admin-moderne body\.cockpit-airbus \.vues-videos/);
});

test('le module compile et s’exporte même hors du tableau de bord', () => {
  const source = lire(MODULE);
  assert.doesNotThrow(() => new Function(source));
  const fenetre = chargerModule(source);
  const api = fenetre.STI_VUES_VIDEOS;
  assert.ok(api, 'window.STI_VUES_VIDEOS disponible');
  for (const nom of ['catalogue', 'analyser', 'pourcentageMedia', 'vuesDeLEntree', 'charger', 'rendre']) {
    assert.equal(typeof api[nom], 'function', nom);
  }
  assert.equal(api.catalogue().length, 26, 'catalogue complet (20 capsules publiques + 6 médias de cours)');
});

/* ───────────────────────── 2. le catalogue suit la vitrine de l’accueil ───────────────────────── */

test('le catalogue du coin reprend les 20 capsules publiques de app.js, sans doublon', () => {
  const app = lire('assets/js/app.js');
  const bloc = app.slice(app.indexOf('var CATALOGUE_VIDEOS = ['), app.indexOf('\n  ];', app.indexOf('var CATALOGUE_VIDEOS = [')));
  const idsVitrine = [...bloc.matchAll(/id:\s*"([^"]+)"/g)].map((m) => m[1]);
  assert.equal(idsVitrine.length, 20, 'vingt capsules sur l’accueil');
  const fenetre = chargerModule(lire(MODULE));
  const catalogue = fenetre.STI_VUES_VIDEOS.catalogue();
  const ids = catalogue.map((v) => v.id);
  assert.equal(new Set(ids).size, ids.length, 'aucun identifiant en double');
  for (const id of idsVitrine) assert.ok(ids.includes(id), 'capsule ' + id);
  for (const v of catalogue) {
    assert.ok(v.titre && v.titre.length >= 6, 'titre lisible : ' + v.id);
    assert.ok(v.icone, 'icône : ' + v.id);
  }
});

/* ───────────────────────── 3. agrégation des vues ───────────────────────── */

test('les lectures se cumulent par appareil et les élèves restent comptés une fois', () => {
  const api = chargerModule(lire(MODULE)).STI_VUES_VIDEOS;
  const lignes = [
    /* Léa : deux lectures de HTML5 sur son PC. */
    { user_id: 'u1', email: 'lea@lycee.tn', donnees: JSON.stringify({ 'sti-media-prog-v1': { 'video:html5-cours': { maxPct: 45, sec: 190, vues: { appPc: 2 } } } }) },
    /* Sami : une lecture de HTML5 sur son téléphone, la vidéo est terminée. */
    { user_id: 'u2', email: 'sami@lycee.tn', donnees: { 'sti-media-prog-v1': { 'video:html5-cours': { maxPct: 100, done: true, vues: { appTel: 1 } } } } },
    /* Nora : entrée d’avant la v529 (aucun compteur) → une lecture au moins. */
    { user_id: 'u3', email: 'nora@lycee.tn', donnees: JSON.stringify({ 'sti-media-prog-v1': { 'video:css3-cours': { maxPct: 30, sec: 90 } } }) },
    /* Élève qui a seulement ouvert, sans regarder (1 s) : aucune vue. */
    { user_id: 'u4', email: 'toto@lycee.tn', donnees: JSON.stringify({ 'sti-media-prog-v1': { 'video:sql-cours': { maxPct: 0, sec: 1 } } }) },
    /* Compte pédagogique : jamais compté. */
    { user_id: 'u5', email: 'prof@lycee.tn', donnees: JSON.stringify({ 'sti-media-prog-v1': { 'video:html5-cours': { maxPct: 90, vues: { appProf: 9 } } } }) },
    /* Audio : hors sujet pour ce coin. */
    { user_id: 'u6', email: 'ines@lycee.tn', donnees: JSON.stringify({ 'sti-media-prog-v1': { 'audio:html5-cours': { maxPct: 80 } } }) }
  ];
  const profils = [{ id: 'u5', email: 'prof@lycee.tn', classe: 'prof' }];
  const res = api.analyser(lignes, profils);
  const parId = Object.fromEntries(res.lignes.map((l) => [l.id, l]));

  assert.deepEqual({ vues: parId['html5-cours'].vues, eleves: parId['html5-cours'].eleves }, { vues: 3, eleves: 2 });
  assert.deepEqual({ vues: parId['css3-cours'].vues, eleves: parId['css3-cours'].eleves }, { vues: 1, eleves: 1 }, 'entrée historique comptée une fois');
  assert.equal(parId['sql-cours'].vues, 0, 'moins de 2 s : pas une vue');
  assert.equal(parId['sql-cours'].eleves, 0);
  assert.equal(parId['html5-cours'].audio, undefined);
  assert.equal(res.vues, 4, 'total des lectures');
  assert.equal(res.eleves, 3, 'élèves-vidéo cumulés');
  assert.equal(res.elevesAnalyses, 5, 'progressions lues (prof et audio écartés)');
  assert.equal(res.elevesAyantVu, 3, 'élèves distincts devant au moins une vidéo');
});

test('un compteur par appareil additionne les lectures du même élève', () => {
  const api = chargerModule(lire(MODULE)).STI_VUES_VIDEOS;
  assert.equal(api.vuesDeLEntree({ vues: { a: 3, b: 2 } }), 5);
  assert.equal(api.vuesDeLEntree({ maxPct: 40 }), 1, 'entrée ancienne : une lecture au moins');
  assert.equal(api.vuesDeLEntree({ vues: { a: 0 } }), 0, 'compteur présent mais nul : zéro inventé');
  assert.equal(api.pourcentageMedia({ sec: 2 }), 1);
  assert.equal(api.pourcentageMedia({ done: true }), 100);
  assert.equal(api.pourcentageMedia({ maxPct: 55 }), 55);
});

test('un slug vidéo inconnu du catalogue apparaît quand même dans le coin', () => {
  const api = chargerModule(lire(MODULE)).STI_VUES_VIDEOS;
  const res = api.analyser([
    { user_id: 'u1', email: 'a@lycee.tn', donnees: JSON.stringify({ 'sti-media-prog-v1': { 'video:ancien-slug': { maxPct: 70, vues: { appX: 4 } } } }) }
  ], []);
  const ligne = res.lignes.find((l) => l.id === 'ancien-slug');
  assert.ok(ligne, 'le média vu reste visible');
  assert.equal(ligne.vues, 4);
  assert.equal(ligne.horsCatalogue, true);
});

/* ───────────────────────── 4. le compteur côté lecteur ───────────────────────── */

function lecteurIsole(source) {
  const code = extraire(source,
    'var CLE_APPAREIL_VUES = "stiMediaAppareilV1";',
    'window.enregistrerProgressionMediaSTI = enregistrerProgressionMediaSTI;');
  return (stockage) => {
    const fenetre = { dispatchEvent() { return true; } };
    fenetre.self = fenetre;
    fenetre.top = fenetre;
    fenetre.parent = fenetre;
    const fabrique = new Function(
      'localStorage', 'window', 'CLE_PROG_MEDIA', 'lireProgressionMediaSTI',
      'rafraichirBadgesProgressionSTI', 'synchroniserRevisionDepuisMedia', 'CustomEvent',
      code + '\nreturn { enregistrerProgressionMediaSTI: enregistrerProgressionMediaSTI, compterVueMedia: compterVueMedia };'
    );
    return fabrique(
      stockage, fenetre, 'sti-media-prog-v1',
      () => JSON.parse(stockage.getItem('sti-media-prog-v1') || '{}'),
      () => {}, () => {}, function CustomEvent() {}
    );
  };
}

function fauxStockage() {
  const donnees = new Map();
  return {
    donnees,
    getItem(cle) { return donnees.has(cle) ? donnees.get(cle) : null; },
    setItem(cle, valeur) { donnees.set(cle, String(valeur)); },
    removeItem(cle) { donnees.delete(cle); },
    get length() { return donnees.size; },
    key(i) { return [...donnees.keys()][i] ?? null; }
  };
}

test('une vidéo jouée compte une vue, une seule par chargement de page', () => {
  const source = lire('assets/js/protection.js');
  const stockage = fauxStockage();
  const lecteur = lecteurIsole(source)(stockage);

  lecteur.enregistrerProgressionMediaSTI('video:html5-cours', 5, 200, false);
  let carte = JSON.parse(stockage.getItem('sti-media-prog-v1'));
  const appareil = stockage.getItem('stiMediaAppareilV1');
  assert.ok(appareil, 'identifiant d’appareil créé');
  assert.deepEqual(carte['video:html5-cours'].vues, { [appareil]: 1 });

  /* Même page, même vidéo : le compteur ne bouge plus, la progression si. */
  lecteur.enregistrerProgressionMediaSTI('video:html5-cours', 40, 200, false);
  carte = JSON.parse(stockage.getItem('sti-media-prog-v1'));
  assert.deepEqual(carte['video:html5-cours'].vues, { [appareil]: 1 }, 'pas de double comptage');
  assert.ok(carte['video:html5-cours'].pct >= 20, 'la progression continue');

  /* Nouveau chargement de page (nouveau module) : deuxième lecture. */
  const seconde = lecteurIsole(source)(stockage);
  seconde.enregistrerProgressionMediaSTI('video:html5-cours', 12, 200, false);
  carte = JSON.parse(stockage.getItem('sti-media-prog-v1'));
  assert.deepEqual(carte['video:html5-cours'].vues, { [appareil]: 2 });
});

test('les audios, les lectures trop courtes et les iframes ne gonflent pas le compteur', () => {
  const source = lire('assets/js/protection.js');
  const stockage = fauxStockage();
  const lecteur = lecteurIsole(source)(stockage);

  lecteur.enregistrerProgressionMediaSTI('audio:html5-cours', 30, 200, false);
  lecteur.enregistrerProgressionMediaSTI('video:css3-cours', 1, 200, false);
  const carte = JSON.parse(stockage.getItem('sti-media-prog-v1') || '{}');
  assert.equal(carte['audio:html5-cours'].vues, undefined, 'un audio n’est pas une vue de vidéo');
  assert.equal(carte['video:css3-cours'], undefined, 'moins de 2 s : rien n’est écrit');

  /* Page encadrée (iframe) : c’est le parent qui compte la lecture. */
  const code = extraire(source,
    'var CLE_APPAREIL_VUES = "stiMediaAppareilV1";',
    'window.enregistrerProgressionMediaSTI = enregistrerProgressionMediaSTI;');
  const stockage2 = fauxStockage();
  const fenetre = { dispatchEvent() { return true; } };
  fenetre.self = {};
  fenetre.top = fenetre; /* self !== top → page encadrée */
  fenetre.parent = fenetre;
  const api = new Function(
    'localStorage', 'window', 'CLE_PROG_MEDIA', 'lireProgressionMediaSTI',
    'rafraichirBadgesProgressionSTI', 'synchroniserRevisionDepuisMedia', 'CustomEvent',
    code + '\nreturn { enregistrerProgressionMediaSTI: enregistrerProgressionMediaSTI };'
  )(stockage2, fenetre, 'sti-media-prog-v1',
    () => JSON.parse(stockage2.getItem('sti-media-prog-v1') || '{}'), () => {}, () => {}, function CustomEvent() {});
  api.enregistrerProgressionMediaSTI('video:sql-cours', 30, 300, false);
  const carteIframe = JSON.parse(stockage2.getItem('sti-media-prog-v1'));
  assert.equal(carteIframe['video:sql-cours'].vues, undefined, 'iframe : comptée par le parent');
});

/* ───────────────────────── 5. fusion sans perte entre appareils ───────────────────────── */

test('sync-progressions conserve et fusionne les compteurs de vues', () => {
  const source = lire('assets/js/sync-progressions.js');
  const code = extraire(source,
    'function fusionnerMediaProgMonotone(rawLoc, rawDist) {',
    '\n  function isolerComptePartageSiBesoin');
  const fusion = new Function('return (' + code + '\n)')();
  const loc = JSON.stringify({ 'video:html5-cours': { maxPct: 30, sec: 60, ts: 1000, vues: { appA: 2 } } });
  const dist = JSON.stringify({ 'video:html5-cours': { maxPct: 10, sec: 20, ts: 500, vues: { appA: 1, appB: 3 } } });
  const sortie = JSON.parse(fusion(loc, dist));
  assert.deepEqual(sortie['video:html5-cours'].vues, { appA: 2, appB: 3 }, 'union, maximum par appareil');
  assert.equal(sortie['video:html5-cours'].maxPct, 30);

  /* Côté sans compteur : rien d’inventé, rien de perdu. */
  const seulLocal = JSON.parse(fusion(loc, JSON.stringify({})));
  assert.deepEqual(seulLocal['video:html5-cours'].vues, { appA: 2 });
  const sansVues = JSON.parse(fusion(JSON.stringify({ 'video:sql-cours': { maxPct: 50, ts: 2 } }), JSON.stringify({})));
  assert.equal(sansVues['video:sql-cours'].vues, undefined, 'pas de champ vide ajouté');
});

test('reconnexion-profil fusionne aussi les compteurs de vues', () => {
  const source = lire('assets/js/reconnexion-profil.js');
  const code = extraire(source, 'function fusionMedias(loc, dist) {', '\n  function fusionnerDonnees');
  const fusion = new Function('return (' + code + '\n)')();
  const cote = fusion(
    { 'video:css3-cours': { maxPct: 20, sec: 30, ts: 10, vues: { appTel: 4 } } },
    { 'video:css3-cours': { maxPct: 60, sec: 90, ts: 20, vues: { appPc: 2 } } }
  );
  assert.deepEqual(cote['video:css3-cours'].vues, { appTel: 4, appPc: 2 }, 'les deux appareils sont conservés');
  assert.equal(cote['video:css3-cours'].maxPct, 60, 'la progression reste monotone');
});

/* ───────────────────────── 6. cache et manifeste hors ligne ───────────────────────── */

test('sw.js invalide les fichiers du compteur et du coin « Vues des vidéos »', () => {
  const sw = lire('sw.js');
  assert.match(sw, /var UPDATE_ID = "v529-vues-videos-20261029"/);
  assert.equal((sw.match(new RegExp('revision: "' + REV + '"', 'g')) || []).length, 6, 'six fichiers révisés');
  const delta = sw.split('var UPDATE_FILES = [')[1].split('];')[0];
  for (const chemin of ['assets/js/protection.js', 'assets/js/sync-progressions.js', 'assets/js/reconnexion-profil.js', 'assets/js/reprendre.js', 'admin.html', 'offline-complete-manifest.json']) {
    assert.ok(delta.includes(`url: "./${chemin}", revision: "${REV}"`), chemin);
  }
  /* Budget du delta préservé : le nouveau module arrive par le réseau puis reste en cache. */
  const urls = [...delta.matchAll(/url:\s*"([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(urls).size, urls.length, 'aucun doublon');
  assert.ok(urls.length <= 262, 'delta léger (≤ 262 entrées)');
  assert.ok(!delta.includes('admin-vues-videos.js'), 'pas de nouvelle entrée : le delta reste sous le plafond');
});

test('le manifeste hors ligne contient le nouveau module avec son empreinte', () => {
  const manifeste = JSON.parse(lire('offline-complete-manifest.json'));
  assert.equal(manifeste.version, 'v529-sti-atelier-v380');
  assert.equal(manifeste.totalFiles, manifeste.files.length);
  assert.equal(manifeste.totalBytes, manifeste.files.reduce((n, f) => n + f.bytes, 0));
  const entree = manifeste.files.find((f) => f.path === MODULE);
  assert.ok(entree, 'module listé');
  const data = readFileSync(join(racine, MODULE));
  assert.equal(entree.bytes, data.length);
  assert.equal(entree.gitSha, createHash('sha1').update(`blob ${data.length}\0`).update(data).digest('hex'));
});
