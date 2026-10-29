import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const racine = resolve(new URL('..', import.meta.url).pathname);
const lire = chemin => readFileSync(resolve(racine, chemin), 'utf8');
const existe = chemin => existsSync(resolve(racine, chemin));
const sha = chemin => createHash('sha256').update(readFileSync(resolve(racine, chemin))).digest('hex');

const DOSSIER = 'exercices/javascript/TP Train';
const HUB = DOSSIER + '/index.html';
const RESSOURCES = DOSSIER + '/Ressource_eleve_TrainTN.html';
const ENONCE = DOSSIER + '/Enonce_TP_TrainTN_JavaScript.html';
const CORRIGE = DOSSIER + '/TP_Train_JavaScript_cORRECTION.html';
const PAGES = [HUB, RESSOURCES, ENONCE, CORRIGE];

const sw = lire('sw.js');
const delta = sw.split('var UPDATE_FILES = [')[1].split('];')[0];
const offline = sw.split('var OFFLINE_LIST = [')[1].split('];')[0];

/* Consigne auteur (v523) : « à partir de exercices/javascript/TP Train — ajouter
   les parties convenables ressources, énoncé, corrigé », rattaché à la Série 5. */
test('v523 : le TP Train a ses trois parties — ressources, énoncé, corrigé', () => {
  for (const page of [RESSOURCES, ENONCE, CORRIGE]) assert.ok(existe(page), page);
  const hub = lire(HUB);
  /* La page d’accueil du TP expose les trois parties, dans l’ordre de travail. */
  const iRessources = hub.indexOf('Ressource_eleve_TrainTN.html');
  const iEnonce = hub.indexOf('Enonce_TP_TrainTN_JavaScript.html');
  const iCorrige = hub.indexOf('TP_Train_JavaScript_cORRECTION.html');
  assert.ok(iRessources > 0 && iEnonce > iRessources && iCorrige > iEnonce,
    'ordre attendu : ressources → énoncé → corrigé');
  assert.match(hub, /<h2>🧰 Ressources<\/h2>/);
  assert.match(hub, /<h2>📘 Énoncé<\/h2>/);
  assert.match(hub, /<h2>✅ Corrigé<\/h2>/);
  /* Les cinq scènes du scénario sont rappelées. */
  for (const scene of ['Identité', 'Voyage et dates', 'Prix', 'Captcha', 'Validation finale']) {
    assert.ok(hub.includes(scene), 'scène manquante : ' + scene);
  }
});

test('v523 : la page d’accueil du TP respecte le socle commun du site', () => {
  const hub = lire(HUB);
  assert.match(hub, /<meta charset="utf-8" \/>/);
  assert.match(hub, /<meta name="viewport"/);
  assert.match(hub, /<meta name="description" content="[^"]{60,}"/);
  assert.match(hub, /<meta name="robots" content="noai, noimageai"/);
  assert.match(hub, /<title>[^<]*TP Train[^<]*<\/title>/);
  assert.match(hub, /assets\/css\/theme-patrimoine\.css/);
  for (const js of ['config.js?v=479', 'supabase-umd.js', 'acces.js?v=479', 'sync-progressions.js?v=479', 'profil.js']) {
    assert.ok(hub.includes(js), 'script attendu : ' + js);
  }
  /* Les chemins relatifs doivent mener à des fichiers réels. */
  for (const cible of ['../../../cours/javascript.html', '../../series-exercices.html', '../../../index.html', '../../../quiz/javascript.html']) {
    const propre = cible.split('#')[0];
    assert.ok(existe(resolve(racine, DOSSIER, propre)), 'lien mort : ' + cible);
  }
  assert.ok(!/href="https?:/.test(hub), 'aucune dépendance réseau dans la page du TP');
});

test('v523 : le TP Train est rattaché à la Série 5 partout dans le site', () => {
  /* 1) Cours JavaScript — la carte Série 5 existante gagne les trois parties. */
  const cours = lire('cours/javascript.html');
  const carteSerie5 = cours.slice(cours.indexOf('Série 5 — Objet String'));
  const finCarte = carteSerie5.indexOf('</article>');
  const bloc = carteSerie5.slice(0, finCarte);
  for (const doc of ['index.html', 'Ressource_eleve_TrainTN.html', 'Enonce_TP_TrainTN_JavaScript.html', 'TP_Train_JavaScript_cORRECTION.html']) {
    assert.ok(bloc.includes('TP%20Train/' + doc), 'cours : ' + doc);
  }
  assert.ok(bloc.includes("ouvrirVideoPasAPasSTI('validation-nom-prenom-js'"), 'la vidéo de la Série 5 reste en place');

  /* 2) Séries d’exercices — même carte Série 5. */
  const series = lire('exercices/series-exercices.html');
  const carteSeries = series.slice(series.indexOf('Série 5 — Objet String'));
  const finSeries = carteSeries.indexOf('</div>\n          </div>');
  const blocSeries = carteSeries.slice(0, finSeries === -1 ? 4000 : finSeries);
  for (const doc of ['index.html', 'Ressource_eleve_TrainTN.html', 'Enonce_TP_TrainTN_JavaScript.html', 'TP_Train_JavaScript_cORRECTION.html']) {
    assert.ok(blocSeries.includes('TP%20Train/' + doc), 'séries : ' + doc);
  }

  /* 3) Catalogue de l’accueil. */
  const app = lire('assets/js/app.js');
  assert.ok(app.includes('exercices/javascript/TP Train/Enonce_TP_TrainTN_JavaScript.html'));
  assert.ok(app.includes('exercices/javascript/TP Train/TP_Train_JavaScript_cORRECTION.html'));
  assert.ok(app.includes('exercices/javascript/TP Train/Ressource_eleve_TrainTN.html'));
  assert.match(app, /ex\.ressources \? '.*data-open-doc/);

  /* 4) Roue de révision — les quatre pages sont résolues. */
  const roue = lire('assets/js/roue-revision.js');
  for (const doc of ['index.html', 'Enonce_TP_TrainTN_JavaScript.html', 'Ressource_eleve_TrainTN.html', 'TP_Train_JavaScript_cORRECTION.html']) {
    assert.ok(roue.toLowerCase().includes(('exercices/javascript/tp train/' + doc).toLowerCase()), 'roue : ' + doc);
  }
});

test('v523 : le TP Train est livré hors ligne et son empreinte est exacte', () => {
  assert.match(sw, /var UPDATE_ID = "v523-tp-train-20261029"/);
  for (const page of PAGES) {
    /* Choix assumé : les trois documents pèsent 2,5 Mo. Ils entrent dans
       l'installation hors-ligne complète mais pas dans le delta automatique,
       dont le budget de compacité (v473) doit rester <= 262 entrées. */
    assert.ok(offline.includes(`"./${page}"`), 'hors-ligne complet : ' + page);
    assert.ok(!delta.includes(`"./${page}"`), 'pas de préchargement automatique : ' + page);
  }
  /* Les trois pages sont des documents autonomes : elles portent aussi leur description. */
  for (const page of [RESSOURCES, ENONCE, CORRIGE]) {
    assert.match(lire(page), /<meta name="description"/, page);
  }
  const manifeste = JSON.parse(lire('offline-complete-manifest.json'));
  assert.equal(manifeste.version, 'v523-sti-atelier-v380');
  assert.equal(manifeste.totalFiles, manifeste.files.length);
  assert.equal(manifeste.totalBytes, manifeste.files.reduce((n, f) => n + f.bytes, 0));
  for (const page of PAGES) {
    const entree = manifeste.files.find(f => f.path === page);
    assert.ok(entree, 'manifeste : ' + page);
    const data = readFileSync(resolve(racine, page));
    assert.equal(entree.bytes, data.length, page);
    assert.equal(entree.gitSha,
      createHash('sha1').update(`blob ${data.length}`).update(Buffer.from([0])).update(data).digest('hex'), page);
  }
});

test('v523 : les pages d’origine du TP Train ne sont pas altérées', () => {
  /* Le corrigé et l’énoncé sont des documents fournis : on vérifie qu’ils portent
     toujours leur contenu (titres, fonctions du corrigé) et qu’ils restent lisibles. */
  const corrige = lire(CORRIGE);
  for (const fn of ['ecrire(', 'demanderNom(', 'emailValide(', 'identite(', 'typeVoyage(', 'voyage(', 'prix(', 'nouveauCode(', 'genererCaptcha(', 'verifierCaptcha(', 'aide(']) {
    assert.ok(corrige.includes(fn), 'fonction du corrigé manquante : ' + fn);
  }
  const enonce = lire(ENONCE);
  for (const partie of ['Partie 1 — Identité', 'Partie 2 — Voyage et dates', 'Partie 3 — Prix', 'Partie 4 — Captcha', 'Partie 5 — Validation finale']) {
    assert.ok(enonce.includes(partie), 'partie de l’énoncé manquante : ' + partie);
  }
  assert.ok(statSync(resolve(racine, RESSOURCES)).size > 100000, 'la ressource élève reste complète');
});
