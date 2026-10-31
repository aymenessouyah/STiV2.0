/*
  v587 — deux corrections demandées sur le décompte des vidéos du tableau de bord :

  1. les capsules (TP, démonstrations, correstions) comptaient seulement si
     l'élève les avait déjà lancées : deux élèves d'un même niveau n'avaient donc
     jamais le même total. Elles font désormais partie du catalogue de référence ;
  2. les vidéos de décor de l'accueil — « Vidéo drapeau sti vent » et
     « Vidéo drapeau rafeha » notamment — apparaissaient comme des vidéos vues
     alors qu'elles se lisent toutes seules en fond de page. Elles sont exclues,
     y compris quand elles arrivent par le temps réel.

  Et l'on vérifie que le manuel 3ᵉ SI servi par la plateforme est bien l'édition
  2026 de 81 pages (fichier, données, cache-busters).
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

const root = resolve(new URL('..', import.meta.url).pathname);
const lire = (p) => readFileSync(resolve(root, p), 'utf8');

/* Le catalogue des vidéos, côté vitrine (app.js) : source de vérité des ids. */
function catalogueVitrine() {
  const src = lire('assets/js/app.js');
  const debut = src.indexOf('var CATALOGUE_VIDEOS = [');
  assert.ok(debut > 0, 'CATALOGUE_VIDEOS introuvable dans app.js');
  const fin = src.indexOf('\n  ];', debut);
  /* Retour au royaume hôte : un tableau créé dans le contexte vm n'a pas le
     même prototype, et assert.deepEqual le refuserait. */
  return JSON.parse(JSON.stringify(vm.runInNewContext(src.slice(debut + 'var CATALOGUE_VIDEOS = '.length, fin + 4))));
}

/* Le catalogue du tableau de bord (admin.js), extrait et évalué. */
function catalogueAdmin() {
  const src = lire('assets/js/admin.js');
  const debut = src.indexOf('var CATALOGUE_VIDEOS_ADMIN = [');
  assert.ok(debut > 0, 'CATALOGUE_VIDEOS_ADMIN introuvable dans admin.js');
  const fin = src.indexOf('\n  ];', debut);
  return JSON.parse(JSON.stringify(vm.runInNewContext(src.slice(debut + 'var CATALOGUE_VIDEOS_ADMIN = '.length, fin + 4))));
}

/* L'inventaire complet utilisé par le panneau « Vues des vidéos » (v529) :
   27 capsules de la vitrine + 6 vidéos des pages de cours. */
function catalogueVuesVideos() {
  const src = lire('assets/js/admin-vues-videos.js');
  const debut = src.indexOf('var CATALOGUE = [');
  assert.ok(debut > 0, 'CATALOGUE introuvable dans admin-vues-videos.js');
  const fin = src.indexOf('\n  ];', debut);
  return JSON.parse(JSON.stringify(vm.runInNewContext(src.slice(debut + 'var CATALOGUE = '.length, fin + 4))));
}

/* Même harnais que les tests v461 : on isole la chaîne de calcul du bilan. */
function contexteBilan() {
  const adminJs = lire('assets/js/admin.js');
  const bloc = adminJs.match(/function estProfil4SIAdmin\(p\)[\s\S]*?window\.__stiBilanProgressionMediaUser = bilanProgressionMediaUser;/);
  assert.ok(bloc, 'les fonctions du bilan média doivent être présentes');
  const ctx = {
    window: {},
    progMediaParUser: {},
    progMediaLiveBuffer: {},
    /* estProfil4SIAdmin s'appuie sur estGold (drapeau « | GOLD » du profil). */
    estGold: (p) => /\|\s*GOLD$/i.test(String((p && p.lycee) || '')),
  };
  vm.runInNewContext(bloc[0], ctx);
  return ctx;
}

test('v589 : le catalogue du tableau de bord couvre toutes les vidéos suivies', () => {
  const vitrine = catalogueVitrine();
  const admin = catalogueAdmin();
  const vues = catalogueVuesVideos();

  assert.equal(vitrine.length, 27, '27 capsules sur la vitrine');
  assert.equal(vues.length, 33, 'panneau des vues : 27 capsules + 6 vidéos des pages de cours');
  assert.equal(admin.length, 33, 'l’inventaire du tableau de bord couvre les 33 vidéos suivies');
  assert.equal(admin.filter((v) => !v.horsBilan).length, 27,
    'seules les 27 capsules de la vitrine entrent dans le bilan de l’élève');

  /* Parité avec la vitrine : chaque capsule publique est suivie. */
  const idsVitrine = vitrine.map((v) => 'video:' + v.id);
  const idsAdmin = admin.map((v) => v.key);
  idsVitrine.forEach((id) => assert.ok(idsAdmin.includes(id), id + ' manque dans le bilan'));
  /* Parité avec le panneau « Vues des vidéos » : aucune des deux listes ne dérive. */
  assert.deepEqual(idsAdmin.slice().sort(), vues.map((v) => 'video:' + v.id).sort(),
    'bilan et panneau des vues doivent lister exactement les mêmes vidéos');

  /* Niveaux : les vidéos réservées à la 4ᵉ SI restent réservées. */
  const quatre = vitrine.filter((v) => v.reserve4si).map((v) => 'video:' + v.id).sort();
  const niveau4 = admin.filter((v) => v.niveau === '4si').map((v) => v.key).sort();
  assert.deepEqual(niveau4, quatre, 'mêmes vidéos réservées à la 4ᵉ SI des deux côtés');
  assert.equal(admin.filter((v) => v.niveau === 'tous').length, 26);
  assert.equal(admin.filter((v) => v.niveau === 'tous' && !v.horsBilan).length, 20);
});

test('v587 : aucune vidéo de décor dans le catalogue ni dans les libellés', () => {
  const admin = catalogueAdmin();
  const decoratives = admin.filter((v) => /^video:(drapeau|stivideoofficiel|flower|ambient)/i.test(v.key));
  assert.deepEqual(decoratives, [], 'drapeau animé, bandeau et présentation ne sont pas des cours');
  for (const v of admin) assert.ok(v.label && typeof v.label === 'string', v.key);
});

test('v587 : le total des vidéos ne dépend plus de ce que l’élève a ouvert', () => {
  const ctx = contexteBilan();
  const eleve4 = { id: 'u-4si', nom: 'ZOUAOUI', prenom: 'Ahmed', classe: '4eme SI1' };
  const eleve3 = { id: 'u-3si', nom: 'BEN ALI', prenom: 'Sami', classe: '3eme SI1' };

  /* Rien n'a été ouvert : le total est quand même complet. */
  const vide4 = ctx.window.__stiBilanProgressionMediaUser(eleve4);
  assert.equal(vide4.totVid, 27, '4ᵉ SI : 20 capsules communes + 7 réservées');
  const vide3 = ctx.window.__stiBilanProgressionMediaUser(eleve3);
  assert.equal(vide3.totVid, 20, '3ᵉ SI : les 20 capsules de la vitrine');
  assert.equal(vide3.nbVidDone, 0);

  /* Un élève qui a vu deux capsules garde le même dénominateur. */
  ctx.progMediaParUser['u-4si'] = { 'video:fonctions-chaine': 100, 'video:boucle-pour': 100 };
  const avec4 = ctx.window.__stiBilanProgressionMediaUser(eleve4);
  assert.equal(avec4.nbVidDone, 2);
  assert.equal(avec4.totVid, 27, 'le total ne bouge pas avec les visionnages');
  assert.match(avec4.resumeEnteteVid, /^2\/27/);
});

test('v587 : les vidéos de décor ne sont jamais comptées', () => {
  const ctx = contexteBilan();
  const eleve = { id: 'u-4si', nom: 'ZOUAOUI', prenom: 'Ahmed', classe: '4eme SI1' };
  ctx.progMediaParUser['u-4si'] = {
    'video:drapeau-sti-vent': 100,
    'video:drapeaurafeha': 100,
    'video:drapeau-rafeha': 100,
    'video:drapeau-lycee-bandeau': 100,
    'video:stivideoofficiel': 100,
    'video:html5-cours': 100,
  };
  const bil = ctx.window.__stiBilanProgressionMediaUser(eleve);
  const cles = bil.catVideos.map((v) => v.key);
  assert.equal(bil.nbVidDone, 1, 'seul le cours HTML5 compte');
  assert.equal(bil.totVid, 27);
  for (const k of cles) {
    assert.doesNotMatch(k, /^video:drapeau/i, 'aucune vidéo de drapeau dans la liste');
    assert.doesNotMatch(k, /^video:(stivideoofficiel|flower|ambient)$/i);
  }
  const libelles = bil.catVideos.map((v) => v.label).join(' | ');
  assert.doesNotMatch(libelles, /drapeau/i, 'aucun libellé « Vidéo drapeau … »');
});

test('v589 : les anciennes clés de capsule sont ramenées sur la clé officielle', () => {
  const ctx = contexteBilan();
  const eleve = { id: 'u-alias', nom: 'TRABELSI', prenom: 'Nour', classe: '4eme SI1' };
  ctx.progMediaParUser['u-alias'] = {
    'video:bouclepour': 100,
    'video:php-guichet-v10': 40,
    'video:drapeau-sti-vent': 100,
  };
  const bil = ctx.window.__stiBilanProgressionMediaUser(eleve);
  const cles = bil.catVideos.map((v) => v.key);
  assert.ok(!cles.includes('video:bouclepour'), 'l’ancienne clé ne crée pas une deuxième ligne');
  assert.ok(!cles.includes('video:php-guichet-v10'));
  assert.ok(bil.listV.includes('Les boucles (✅ 100%)'), 'la boucle Pour reste vue');
  assert.ok(bil.listV.includes('Guichet PHP/MySQLi (⏳ 40%)'), 'le Guichet garde son avancement');
  assert.equal(bil.totVid, 27, 'aucune vidéo en double : le total ne bouge pas');
  assert.equal(bil.nbVidDone, 1);
  assert.equal(bil.nbVidEnCours, 1);
});

test('v587 : le temps réel applique le même filtre que les données du cloud', () => {
  const adminJs = lire('assets/js/admin.js');
  /* Diffusion live : la clé est normalisée avant d'entrer dans le suivi. */
  assert.match(adminJs, /var cleP = normaliserCleMediaAdmin\(k\);\s*\n\s*if \(!cleP\) return;/);
  /* Fusion du tampon live : idem. */
  assert.match(adminJs, /var cleL = normaliserCleMediaAdmin\(k\);\s*\n\s*if \(!cleL\) return;/);
  /* Et le panneau de l'élève ignore lui aussi les vidéos de décor. */
  const accesJs = lire('assets/js/acces.js');
  assert.match(accesJs, /if \(\/\^drapeau\/i\.test\(slugPan\) \|\| \/\^\(stivideoofficiel\|flower\|ambient\)\$\/i\.test\(slugPan\)\) return;/);
});

test('v590 : les vidéos des pages de cours n’entrent pas dans le bilan', () => {
  const ctx = contexteBilan();
  const eleve = { id: 'u-cours', nom: 'BOUAZIZ', prenom: 'Ines', classe: '3eme SI1' };
  ctx.progMediaParUser['u-cours'] = {
    'video:html5-cours': 100,
    'video:sql-serie1': 100,
    'video:sql-serie6': 40,
    'video:explore-tunisie-flex': 100,
  };
  const bil = ctx.window.__stiBilanProgressionMediaUser(eleve);
  assert.equal(bil.totVid, 20, '20 capsules en 3ᵉ SI, quoi qu’il ait ouvert');
  assert.equal(bil.nbVidDone, 1, 'seul le cours HTML5 (capsule) compte');
  const cles = bil.catVideos.map((v) => v.key);
  for (const k of ['video:sql-serie1', 'video:sql-serie6', 'video:explore-tunisie-flex']) {
    assert.ok(!cles.includes(k), k + ' ne fait pas partie du travail attendu');
  }
  /* Le panneau « Vues des vidéos » continue bien de les suivre, lui. */
  const vues = lire('assets/js/admin-vues-videos.js');
  assert.match(vues, /id: "sql-serie1"/);
  assert.match(vues, /id: "explore-tunisie-flex"/);
});

test('v587 : le manuel 3ᵉ SI servi est bien l’édition 2026 de 81 pages', () => {
  const smartBook = lire('assets/js/smart-book.js');
  const livre = smartBook.slice(smartBook.indexOf("'3si-2026':"));
  assert.match(livre, /pages: 81/);
  assert.match(livre, /sti-smart-book-3si-2026\.pdf/);
  assert.match(smartBook, /let REVUE_LIVRE = '587'/, 'le cache-buster du livre suit la livraison');
  /* Les données du livre sont demandées avec la même révision : un appareil qui
     gardait l'index de l'ancienne édition ne peut plus l'afficher. */
  assert.match(smartBook, /fetch\(books\[id\]\.data \+ '\?v=' \+ REVUE_LIVRE\)/);

  const data = JSON.parse(lire('assets/data/smart-book-3si-2026.json'));
  assert.equal(data.edition, '3ème SI — 2026');
  assert.equal(data.pages, 81);
  assert.equal(data.items.length, 77);
  assert.equal(data.items[0].page, 5);
  assert.equal(data.items[data.items.length - 1].page, 81);
  assert.match(data.partie, /Systèmes, technologies et Internet \(pages 5 à 13\)/);

  const page = lire('livre-smart.html');
  assert.doesNotMatch(page, /\?v=575/, 'aucune ressource du livre ne reste sur la révision v575');
  assert.match(page, /couverture-3si\.jpg\?v=587/);
});
