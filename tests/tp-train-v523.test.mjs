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

test('v523/v524 : le TP Train est rattaché à sa propre Série 6 partout dans le site', () => {
  const DOCS = ['index.html', 'Ressource_eleve_TrainTN.html', 'Enonce_TP_TrainTN_JavaScript.html', 'TP_Train_JavaScript_cORRECTION.html'];

  /* 1) Cours JavaScript — la Série 6 porte les quatre liens. */
  const cours = lire('cours/javascript.html');
  const carte6 = cours.slice(cours.indexOf('Série 6 — TP Train'));
  const bloc6 = carte6.slice(0, carte6.indexOf('</article>'));
  for (const doc of DOCS) assert.ok(bloc6.includes('TP%20Train/' + doc), 'cours Série 6 : ' + doc);

  /* La Série 5 reste celle du programme (Objet String), sans lien TP Train. */
  const carte5 = cours.slice(cours.indexOf('Série 5 — Objet String'));
  const bloc5 = carte5.slice(0, carte5.indexOf('</article>'));
  assert.ok(!bloc5.includes('TP%20Train/'), 'la Série 5 ne doit plus porter le TP Train');
  assert.ok(bloc5.includes("ouvrirVideoPasAPasSTI('validation-nom-prenom-js'"), 'la vidéo de la Série 5 reste en place');

  /* 2) Séries d’exercices — même découpage. */
  const series = lire('exercices/series-exercices.html');
  const serie6 = series.slice(series.indexOf('Série 6 — TP Train'));
  const blocSerie6 = serie6.slice(0, serie6.indexOf('</div>\n          </div>'));
  for (const doc of DOCS) assert.ok(blocSerie6.includes('TP%20Train/' + doc), 'séries Série 6 : ' + doc);
  const serie5 = series.slice(series.indexOf('Série 5 — Objet String'));
  const blocSerie5 = serie5.slice(0, serie5.indexOf('</div>\n          </div>'));
  assert.ok(!blocSerie5.includes('TP%20Train/'), 'la carte Série 5 des séries ne doit plus porter le TP Train');

  /* 3) Catalogue de l’accueil. */
  const app = lire('assets/js/app.js');
  assert.match(app, /titre: "Série 6 — TP Train : réserver un billet"/);
  assert.ok(app.includes('exercices/javascript/TP Train/Enonce_TP_TrainTN_JavaScript.html'));
  assert.ok(app.includes('exercices/javascript/TP Train/TP_Train_JavaScript_cORRECTION.html'));
  assert.ok(app.includes('exercices/javascript/TP Train/Ressource_eleve_TrainTN.html'));
  assert.match(app, /ex\.ressources \? '.*data-open-doc/);

  /* 4) Roue de révision — les quatre pages sont résolues. */
  const roue = lire('assets/js/roue-revision.js');
  for (const doc of DOCS) {
    assert.ok(roue.toLowerCase().includes(('exercices/javascript/tp train/' + doc).toLowerCase()), 'roue : ' + doc);
  }

  /* 5) La page d’accueil du TP affiche « Série 6 · TP Train ». */
  const hub = lire(HUB);
  assert.match(hub, /<div class="nb">Série 6 · TP Train/);
  assert.match(hub, /<title>[^<]*Série 6 · TP Train/);
});

test('v524 : les six groupes d’exercices du cours s’appellent EXERCICE 01 à 06', () => {
  const cours = lire('cours/javascript.html');
  const etiquettes = [...cours.matchAll(/<span class="source-accent">EXERCICE (0[1-9])<\/span><h2[^>]*>([^<]+)<\/h2>/g)];
  assert.equal(etiquettes.length, 6, 'six groupes attendus');
  assert.deepEqual(etiquettes.map(m => m[1]), ['01', '02', '03', '04', '05', '06']);
  const titres = etiquettes.map(m => m[2]);
  for (const attendu of ['Opérateurs &amp; conditions', 'Boucles', 'Chaînes de caractères', 'Tableaux', 'Math &amp; Date', 'DOM']) {
    assert.ok(titres.includes(attendu), 'groupe attendu : ' + attendu);
  }
  /* Plus aucune étiquette « SÉRIE 0x » dans le cours. */
  assert.doesNotMatch(cours, /SÉRIE 0[1-6]/);
});

test('v523 : le TP Train est livré hors ligne et son empreinte est exacte', () => {
  assert.match(sw, /var UPDATE_ID = "v579-vitrine-sti-portail"/);
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
  assert.equal(manifeste.version, 'v579-sti-atelier-v386');
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
