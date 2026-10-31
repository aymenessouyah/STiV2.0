/* v550 — la vidéothèque : un effet de survol par carte, et les boucles en
   JavaScript ET en PHP.
   Contrôle que chaque carte de la grille porte son propre effet (indice tiré de
   l'identifiant, couleur de la matière), que les quatre effets sont bien écrits
   dans index.html (avec prefers-reduced-motion), que les trois capsules sont
   marquées, et que la capsule des boucles appartient aux deux matières. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (chemin) => readFileSync(join(root, chemin), 'utf8');

function catalogue() {
  const js = lire('assets/js/app.js');
  const texte = js.split('var CATALOGUE_VIDEOS = ')[1].split('\n  ];')[0] + '\n  ]';
  return vm.runInNewContext('(' + texte + ')');
}

/** La même fonction que dans app.js : l'effet suit l'identifiant. */
function effetAttendu(id) {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) % 9973;
  return h % 4;
}

test('chaque carte de la vidéothèque reçoit son effet et sa couleur', () => {
  const app = lire('assets/js/app.js');
  assert.match(app, /function effetVideo\(v\)/, "l'indice d'effet est calculé");
  assert.match(app, /function estCapsuleVideo\(v\)/, 'les capsules sont reconnues');
  assert.ok(app.includes('" data-effet="\' + effetVideo(v)'), "l'attribut data-effet est écrit");
  assert.ok(app.includes('style="--accent:\' + echapperHtml(v.couleur || "#38bdf8")'),
    'la couleur de la matière devient --accent');
  assert.ok(app.includes('(estCapsuleVideo(v) ? " video-card--capsule" : "")'),
    'les capsules portent leur classe');

  const liste = catalogue();
  assert.equal(liste.length, 27, 'vingt-sept cartes');
  assert.ok(liste.every((v) => v.couleur && /^#[0-9a-f]{6}$/i.test(v.couleur)), 'chaque carte a sa couleur');
  const effets = liste.map((v) => effetAttendu(v.id));
  assert.ok(effets.every((e) => e >= 0 && e <= 3), 'quatre effets possibles');
  assert.equal(new Set(effets).size, 4, 'les quatre effets servent vraiment');
  /* Deux cartes voisines ne doivent pas se ressembler : la grille entrelace. */
  assert.ok(effets.slice(0, 8).some((e, i) => i > 0 && e !== effets[i - 1]), 'les effets alternent');
});

test('les trois capsules sont marquées comme telles', () => {
  const liste = catalogue();
  const capsules = liste.filter((v) => /^capsule/i.test(v.codeApercu || '') || /^capsule/i.test(v.titre || ''));
  assert.equal(capsules.length, 0, 'aucune capsule ne se cache dans le titre');
  for (const id of ['boucle-pour', 'console-variables', 'php-variables']) {
    assert.ok(liste.some((v) => v.id === id), `capsule ${id} au catalogue`);
  }
  const app = lire('assets/js/app.js');
  const bloc = app.slice(app.indexOf('var CAPSULES_VIDEO'), app.indexOf('function effetVideo'));
  for (const id of ['boucle-pour', 'console-variables', 'php-variables']) {
    assert.ok(bloc.includes(`"${id}"`), `"${id}" listée comme capsule`);
  }
});

test('les quatre effets sont écrits dans index.html, sans mouvement imposé', () => {
  const html = lire('index.html');
  for (const n of [0, 1, 2, 3]) {
    assert.ok(html.includes(`#videosGrid .video-card[data-effet="${n}"]`), `effet ${n}`);
  }
  assert.ok(html.includes('radial-gradient'), 'le halo');
  assert.ok(html.includes('linear-gradient(112deg'), 'le balayage');
  assert.ok(html.includes('@keyframes sti-lisere-V550'), 'le liseré qui tourne');
  assert.ok(html.includes('scale(1.06)'), 'le zoom de la vignette');
  assert.ok(html.includes('#videosGrid .video-card--capsule'), 'le liseré des capsules');
  const reduit = html.slice(html.indexOf('@media (prefers-reduced-motion: reduce)'));
  assert.ok(reduit.includes('#videosGrid .video-card'), 'le mouvement est coupé si l’élève le demande');
  assert.ok(reduit.includes('animation: none !important'), 'aucune animation forcée');
});

test('la capsule des boucles appartient à JavaScript et à PHP', () => {
  const liste = catalogue();
  const boucles = liste.find((v) => v.id === 'boucle-pour');
  assert.ok(boucles, 'la capsule est au catalogue');
  assert.deepEqual([...boucles.matieres], ['javascript', 'php'], 'les deux matières');
  assert.equal(boucles.nomMatiere, 'JavaScript & PHP', 'le badge le dit');
  assert.equal(boucles.matiere, 'javascript', 'la matière principale reste JavaScript');

  /* les pastilles de l'accueil suivent le même compte */
  const index = lire('index.html');
  const compte = (cle) => liste.filter((v) => ((v.matieres || [v.matiere]).indexOf(cle) !== -1)).length;
  assert.equal(compte('javascript'), 8);
  assert.equal(compte('php'), 6);
  assert.ok(index.includes(`data-video-filter="javascript">JS (${compte('javascript')})</button>`), 'pastille JS');
  assert.ok(index.includes(`data-video-filter="php">PHP (${compte('php')})</button>`), 'pastille PHP');
  assert.ok(index.includes(`data-video-filter="all">Toutes (${liste.length})</button>`), 'pastille « Toutes »');

  /* et la page du cours PHP propose la capsule */
  const page = lire('cours/php.html');
  assert.ok(page.includes('data-video-open="boucle-pour"'), 'la carte est sur la page PHP');
  assert.ok(page.includes('../assets/videos/BouclePour-v547.mp4'), 'le fichier est le même');
  assert.ok(page.includes('JavaScript &amp; PHP'), 'la carte annonce les deux matières');
  assert.ok(lire('cours/javascript.html').includes('data-video-id="boucle-pour"'), 'et reste sur la page JavaScript');
});

test('le lot v550 est publié et versionné', () => {
  const sw = lire('sw.js');
  assert.match(sw, /var CACHE = "sti-atelier-v386"/);
  assert.match(sw, /var UPDATE_ID = "v582-journal-connexions"/);
  assert.match(sw, /url: "\.\/assets\/js\/app\.js", revision: "vitrine-sti-v579"/);
  assert.match(sw, /url: "\.\/index\.html", revision: "quiz-systemes-v580"/);
  assert.match(sw, /url: "\.\/cours\/php\.html", revision: "etiquette-relief-v572"/);
  /* la capsule des boucles reste hors du delta automatique (média lourd) */
  assert.ok(!sw.split('var UPDATE_FILES = [')[1].split('];')[0].includes('BouclePour-v547.mp4'));
});
