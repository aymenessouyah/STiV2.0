/* v579 — trois retours d'écran de l'auteur, corrigés ensemble :
   ─────────────────────────────────────────────────────────────────────────
   1. « il ne faut jamais afficher la barre en bas » sur `portail.html` : la
      barre flottante recouvrait le captcha Cloudflare. Trois verrous, à trois
      moments du chargement, refusent désormais cette page : le <head> du
      portail (l'esquisse peinte d'avance), config.js (le chargeur et son
      gabarit) et mobile-nav.js (la barre elle-même).
   2. la vidéo du cours « Systèmes, technologies et Internet » est la première
      de « Vidéos explicatives ».
   3. le bouton « + » de la barre mobile montre le nouveau cours ET la nouvelle
      vidéo : son contenu est écrit en dur dans mobile-nav.js, il ne suffisait
      pas d'ajouter la carte dans index.html.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (chemin) => readFileSync(join(root, chemin), 'utf8');

const nav = lire('assets/js/mobile-nav.js');
const config = lire('assets/js/config.js');
const portail = lire('portail.html');
const index = lire('index.html');
const app = lire('assets/js/app.js');
const coursSti = 'cours/systemes-technologies-internet.html';

function catalogue() {
  const texte = app.split('var CATALOGUE_VIDEOS = ')[1].split('\n  ];')[0] + '\n  ]';
  return vm.runInNewContext('(' + texte + ')');
}

/* Le contenu du volet « + » est un tableau littéral : on l'évalue tel quel. */
function tableau(nom) {
  const debut = nav.indexOf('var ' + nom + ' = [');
  assert.ok(debut !== -1, 'tableau introuvable : ' + nom);
  const fin = nav.indexOf('\n  ];', debut);
  return vm.runInNewContext('(' + nav.slice(debut + ('var ' + nom + ' = ').length, fin) + ']' + ')');
}

const MATIERES = tableau('MATIERES');
const FAMILLES = tableau('FAMILLES_VIDEOS');

/* ═════════════════════════════════════════════════════════════════════════
   1 · Aucune barre sur le portail
   ═════════════════════════════════════════════════════════════════════════ */
test('v579 : le portail est exclu de la barre mobile, comme le tableau de bord', () => {
  const motif = /\(\^\|\\\/\)portail\(\\\.html\)\?\$\/i/g;
  /* a) la barre elle-même refuse de se construire ; */
  assert.match(nav, /if \(\/\(\^\|\\\/\)admin\(\\\.html\)\?\$\/i\.test\(pnNet\)\) return;/);
  assert.match(nav, /if \(\/\(\^\|\\\/\)portail\(\\\.html\)\?\$\/i\.test\(pnNet\)\) return;/,
    'mobile-nav.js refuse le portail');
  /* b) config.js ne charge même pas le module et ne peint pas son gabarit ; */
  assert.ok((config.match(motif) || []).length >= 3,
    'config.js : le chargeur ET le gabarit refusent le portail');
  /* Les deux ajouts v579 sont bien là, chacun dans son bloc. */
  assert.match(config, /v579 : le portail \(connexion, abonnement, captcha Cloudflare\) reste nu/);
  assert.match(config, /v579 : aucune esquisse de barre sur le portail non plus/);
  assert.match(config, /v579 : le portail \(connexion, abonnement, captcha Cloudflare\) reste nu/);
  /* c) le <head> du portail ne peint pas l’esquisse mémorisée. */
  const tete = portail.slice(0, portail.indexOf('</script>'));
  assert.match(tete, /if \(\/\(\^\|\\\/\)portail\(\\\.html\)\?\$\/i\.test\(pn\.replace\(\/\\\/\$\/, ""\)\)\) return;/,
    'portail.html : aucune esquisse peinte d’avance');
  /* La règle ne déborde pas : l’accueil charge toujours la barre. */
  assert.match(index, /assets\/js\/config\.js/, 'l’accueil garde son chargeur');
  /* Le refus ne vise que le portail : il est écrit à côté de celui d’admin. */
  const garde = nav.slice(0, nav.indexOf('function racine()'));
  assert.ok(garde.indexOf('portail') > garde.indexOf('admin'), 'même famille que la règle admin');
});

/* ═════════════════════════════════════════════════════════════════════════
   2 · La vidéo du cours ouvre « Vidéos explicatives »
   ═════════════════════════════════════════════════════════════════════════ */
test('v579 : le cours STI est la première entrée du catalogue', () => {
  const liste = catalogue();
  const premiere = liste[0];
  assert.equal(premiere.id, 'cours-sti', 'première carte de la vitrine');
  assert.equal(premiere.matiere, 'sti');
  assert.equal(premiere.dureeTexte, '13:03');
  assert.equal(premiere.srcPrincipal, 'assets/videos/CoursSystemesInternet-v578.mp4');
  assert.ok(existsSync(join(root, premiere.srcPrincipal)), 'le MP4 existe');
  assert.equal(premiere.sousTitres, 'assets/subtitles/CoursSystemesInternet-fr-v578.vtt');
  assert.ok(existsSync(join(root, premiere.sousTitres)), 'les sous-titres existent');
  assert.equal(premiere.urlCours, coursSti + '#video-cours');
  assert.ok(existsSync(join(root, coursSti)), 'la page du cours existe');
  assert.equal(new Set(liste.map((v) => v.id)).size, liste.length, 'identifiants uniques');
});

test('v579 : le tri place le cours avant les cinq matières, sans changer leur ordre', () => {
  const ordre = (app.match(/var ORDRE_MATIERES_VIDEOS = (\[[^\]]*\])/) || [])[1];
  assert.deepEqual(JSON.parse(ordre.replace(/'/g, '"')), ['html5', 'css3', 'javascript', 'sql', 'php'],
    'l’ordre du programme est intact');
  const contexte = vm.createContext({});
  const fonctions = app.slice(app.indexOf('var ORDRE_MATIERES_VIDEOS'), app.indexOf('function effetVideo(v)'));
  vm.runInContext(fonctions + '\nthis.trier = trierVideosParMatiere;', contexte);

  const melange = [
    { id: 'php1', matiere: 'php' }, { id: 'sti1', matiere: 'sti' },
    { id: 'html1', matiere: 'html5' }, { id: 'js1', matiere: 'javascript' },
    { id: 'sti2', matiere: 'sti' }, { id: 'css1', matiere: 'css3' },
    { id: 'sql1', matiere: 'sql' }, { id: 'html2', matiere: 'html5' }
  ];
  assert.deepEqual(contexte.trier(melange).map((v) => v.id),
    ['sti1', 'sti2', 'html1', 'html2', 'css1', 'js1', 'sql1', 'php1']);
});

test('v579 : le cours n’est pas une capsule et ne prend pas « la une »', () => {
  assert.ok(!/CAPSULES_VIDEO = \{[^}]*cours-sti/.test(app), 'pas une capsule');
  const choix = app.slice(app.indexOf('function choisirVideoALaUne'), app.indexOf('function initialiserVideoHero'));
  assert.ok(choix.includes('v.id === "cours-sti"'), 'la une tire encore parmi les capsules');
});

test('v579 : la pastille STI et les compteurs de l’accueil suivent le catalogue', () => {
  const liste = catalogue();
  const sti = liste.filter((v) => (v.matieres || [v.matiere]).includes('sti')).length;
  assert.equal(sti, 1);
  assert.ok(index.includes(`data-video-filter="sti">STI (${sti})</button>`), 'pastille STI');
  assert.ok(index.includes(`data-video-filter="all">Toutes (${liste.length})</button>`), 'pastille « Toutes »');
  assert.ok(index.includes(`<span id="videosTotalNombre">${liste.length}</span>`), 'compteur de la section');
  assert.ok(index.includes(`id="videosStatNombre" data-count="${liste.length}">${liste.length}</span>`), 'tuile de l’accueil');
  /* app.js sait relibeller la pastille STI comme les autres. */
  assert.match(app, /libellesFiltres = \{ sti: "STI", html5: "HTML5"/);
});

/* ═════════════════════════════════════════════════════════════════════════
   3 · Le bouton « + » montre le nouveau cours et la nouvelle vidéo
   ═════════════════════════════════════════════════════════════════════════ */
test('v579 : le nouveau cours est la première carte du volet « + »', () => {
  const premiere = MATIERES[0];
  assert.equal(premiere.cle, 'sti');
  assert.equal(premiere.lien, coursSti, 'le cours STI n’habite pas cours/sti.html');
  assert.ok(existsSync(join(root, premiere.lien)), 'la page du cours existe');
  /* Chaque carte mène à une page réelle : `lien` sinon `cours/<cle>.html`. */
  for (const m of MATIERES) {
    const cible = m.lien || 'cours/' + m.cle + '.html';
    assert.ok(existsSync(join(root, cible)), 'carte sans page : ' + cible);
  }
  assert.ok(nav.includes('var cible = m.lien || ("cours/" + m.cle + ".html");'),
    'le volet suit le lien propre à chaque cours');
});

test('v579 : la famille « STI » du volet filtre vraiment la galerie', () => {
  assert.equal(FAMILLES[0].cle, 'all', '« Toutes les vidéos » reste en tête');
  assert.equal(FAMILLES[1].cle, 'sti', 'la famille STI suit');
  for (const f of FAMILLES) {
    if (f.cle === 'all') continue;
    assert.ok(index.includes(`data-video-filter="${f.cle}"`), 'puce sans filtre : ' + f.cle);
  }
  /* Le clic sur une puce du volet ne recharge pas : il clique la pastille. */
  assert.match(nav, /doc\.querySelector\('\[data-video-filter="' \+ vf \+ '"\]'\)/);
});

test('v579 : le refus du portail reconnaît ses adresses et rien d’autre', () => {
  /* La règle testée est exactement celle du module (source comparée au fichier). */
  const garde = /(^|\/)portail(\.html)?$/i;
  assert.ok(nav.includes('/' + garde.source + '/i'), 'la règle de mobile-nav.js');
  assert.ok(config.includes('/' + garde.source + '/i'), 'la même dans config.js');
  for (const chemin of ['/STiV2.0/portail.html', '/STiV2.0/portail']) {
    assert.ok(garde.test(chemin), 'le portail est refusé : ' + chemin);
  }
  for (const chemin of ['/STiV2.0/index.html', '/STiV2.0/cours/php.html', '/STiV2.0/admin.html',
    '/STiV2.0/portailisme.html']) {
    assert.ok(!garde.test(chemin), 'la page garde sa barre : ' + chemin);
  }
  /* Un dossier final est toléré : « /portail/ » est la même page. */
  assert.ok(garde.test('/STiV2.0/portail/'.replace(/\/$/, '')), 'dossier final toléré');
});
