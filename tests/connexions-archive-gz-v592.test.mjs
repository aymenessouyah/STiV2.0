/*
  v592 — retrouver les connexions perdues dans une ARCHIVE compressée.

  Contexte (31/10/2026) : la table `acces` ne remonte plus qu'au 25/10 à 19 h 35
  (identifiants 1 à 5 326 disparus, aucune copie serveur). La seule trace d'avant
  est une sauvegarde de la plateforme (18 tables) au format `.json.gz` :
  « sti-sauvegarde-2026-10-22.json.gz ». Or le bouton « 📂 Importer un fichier »
  de la v584 n'acceptait que du `.json` décompressé : l'archive était donc
  inutilisable par le professeur.

  Ce que doit garantir cette version :
    - lire un `.json.gz` dans le navigateur (DecompressionStream), sans l'envoyer ;
    - retrouver ensuite les lignes de connexion dans l'archive telle quelle,
      même imbriquées sous { tables: { acces: [...] } } ;
    - distinguer les lignes antérieures au 25/10 (celles qu'on veut récupérer) ;
    - continuer à lire les simples `.json` exactement comme avant.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';
import { gzipSync } from 'node:zlib';

const root = resolve(new URL('..', import.meta.url).pathname);
const read = (p) => readFileSync(resolve(root, p), 'utf8');
const adminJs = read('assets/js/admin.js');

/* Extrait une fonction déclarée dans le fichier (accolades équilibrées). */
function extraireFonction(nom) {
  const debut = adminJs.indexOf('  function ' + nom + '(');
  assert.ok(debut >= 0, 'fonction introuvable dans admin.js : ' + nom);
  let i = adminJs.indexOf('{', debut);
  let profondeur = 0;
  for (; i < adminJs.length; i++) {
    const c = adminJs[i];
    if (c === '{') profondeur++;
    else if (c === '}') {
      profondeur--;
      if (profondeur === 0) { i++; break; }
    }
  }
  return adminJs.slice(debut, i);
}

/* Node n'a pas FileReader : on en fournit un minimal, qui lit via File#text(). */
class LecteurFichier {
  readAsText(fichier) {
    fichier.text().then((texte) => {
      this.result = texte;
      if (typeof this.onload === 'function') this.onload();
    }, (erreur) => {
      this.error = erreur;
      if (typeof this.onerror === 'function') this.onerror(erreur);
    });
  }
}

/* Même montage que tests/recherche-connexions-v584.test.mjs, plus la lecture de
   fichier (File, DecompressionStream, Response) fournie par Node. */
function chargerOutils() {
  const script = [
    extraireFonction('lignesAccesDepuisListeAdmin'),
    extraireFonction('fmtDateCourteAdmin'),
    'var DATE_PERTE_ACCES_V584 = "2026-10-25";',
    extraireFonction('normaliserLigneAccesV584'),
    extraireFonction('extraireLignesAccesV584'),
    extraireFonction('statistiquesLignesAccesV584'),
    extraireFonction('analyserSourcesAccesV584'),
    extraireFonction('lignesDepuisTexteJsonV584'),
    extraireFonction('lireTexteFichierAdmin'),
    'this.__T = { lireTexteFichierAdmin: lireTexteFichierAdmin,' +
    ' analyserSourcesAccesV584: analyserSourcesAccesV584,' +
    ' lignesDepuisTexteJsonV584: lignesDepuisTexteJsonV584,' +
    ' extraireLignesAccesV584: extraireLignesAccesV584 };'
  ].join('\n');
  const contexte = vm.createContext({
    console, JSON, Date, Array, Object, String, Number, isFinite, Promise,
    DecompressionStream, Response, File, FileReader: LecteurFichier
  });
  vm.runInContext(script, contexte, { filename: 'admin.js#v592' });
  return contexte.__T;
}

const T = chargerOutils();

/* Archive au format de la plateforme : les lignes sont sous data/tables/acces. */
const ARCHIVE_22_10 = {
  format: 'sti-sauvegarde-v1',
  exporte_le: '2026-10-22T00:42:53.378Z',
  tables: {
    acces: [
      { id: 41, user_id: 'eleve-a', debut: '2026-10-09T08:12:00Z', page: 'index.html', duree_sec: 320 },
      { id: 42, user_id: 'eleve-a', debut: '2026-10-13T15:40:00Z', page: 'cours/html5.html', duree_sec: 510 },
      { id: 43, user_id: 'eleve-b', debut: '2026-10-27T09:05:00Z', page: 'quiz.html', duree_sec: 90 },
      { id: 43, user_id: 'eleve-b', debut: '2026-10-27T09:05:00Z', page: 'quiz.html', duree_sec: 90 }
    ],
    profiles: [{ id: 'eleve-a' }, { id: 'eleve-b' }]
  }
};

test('v592 : un fichier .json.gz est décompressé dans le navigateur', async () => {
  assert.match(adminJs, /DecompressionStream\("gzip"\)/, 'la décompression gzip est utilisée');
  assert.match(adminJs, /inp\.accept = "\.json,\.gz,application\/json,application\/gzip"/,
    'le sélecteur de fichier accepte désormais les archives .gz');

  const gz = gzipSync(Buffer.from(JSON.stringify(ARCHIVE_22_10), 'utf8'));
  const fichier = new File([gz], 'sti-sauvegarde-2026-10-22.json.gz', { type: 'application/x-gzip' });
  const texte = await T.lireTexteFichierAdmin(fichier);
  const relu = JSON.parse(texte);
  assert.equal(relu.exporte_le, '2026-10-22T00:42:53.378Z', 'le contenu décompressé est intact');
  assert.equal(relu.tables.acces.length, 4);
});

test('v592 : les connexions d’avant le 25/10 sont retrouvées dans l’archive', async () => {
  const gz = gzipSync(Buffer.from(JSON.stringify(ARCHIVE_22_10), 'utf8'));
  const fichier = new File([gz], 'archive.json.gz', { type: 'application/gzip' });
  const valeurs = JSON.parse(await T.lireTexteFichierAdmin(fichier));
  const analyse = T.analyserSourcesAccesV584([{ nom: 'fichier ' + fichier.name, valeurs }]);
  assert.equal(analyse.stats.nb, 3, 'le doublon « eleve-b / quiz.html » est compté une seule fois');
  assert.equal(analyse.stats.avant, 2, 'deux connexions datent d’avant le 25/10');
  assert.equal(analyse.stats.premiere, '2026-10-09T08:12:00Z');
  assert.equal(analyse.stats.derniere, '2026-10-27T09:05:00Z');
  assert.equal(analyse.lignes.filter((l) => l.debut.slice(0, 10) < '2026-10-25').length, 2,
    'les lignes réimportables d’avant le 25/10 sont bien isolées');
});

test('v592 : un simple fichier .json se lit comme avant', async () => {
  const fichier = new File([JSON.stringify({ lignes: ARCHIVE_22_10.tables.acces })], 'connexions.json',
    { type: 'application/json' });
  const texte = await T.lireTexteFichierAdmin(fichier);
  assert.equal(T.lignesDepuisTexteJsonV584(texte).length, 3);
});

test('v592 : une archive illisible ne fait pas planter l’import', async () => {
  const faux = new File([Buffer.from('ceci n’est pas du gzip')], 'casse.json.gz',
    { type: 'application/x-gzip' });
  await assert.rejects(() => T.lireTexteFichierAdmin(faux));
  await assert.rejects(() => T.lireTexteFichierAdmin(null));
});

test('v592 : la page d’administration et le cache suivent la nouvelle version', () => {
  const sw = read('sw.js');
  assert.match(sw, /var VERSION_PUBLIEE = "v594";/, 'le badge de publication suit la dernière version');
  assert.match(sw, /url: "\.\/assets\/js\/admin\.js", revision: "connexions-gz-v592"/,
    'admin.js est réinvalidé sous sa nouvelle révision');
  const page = read('admin.html');
  assert.match(page, /assets\/js\/admin\.js\?v=[0-9a-z-]+/, 'admin.html charge bien admin.js');
});
