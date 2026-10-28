import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

const source = readFileSync(resolve('assets/js/profil.js'), 'utf8');

function creerContexte(initial = {}) {
  const donnees = new Map(Object.entries(initial).map(([cle, valeur]) => [cle, typeof valeur === 'string' ? valeur : JSON.stringify(valeur)]));
  const ecritures = [];
  const ecouteurs = {};
  const classes = new Set();
  const racine = {
    classList: { add: c => classes.add(c), remove: c => classes.delete(c), contains: c => classes.has(c), toggle: (c, actif) => actif ? classes.add(c) : classes.delete(c) },
    setAttribute() {}, hasAttribute: () => false
  };
  const stockage = {
    getItem: cle => donnees.get(cle) ?? null,
    setItem: (cle, valeur) => { ecritures.push(cle); donnees.set(cle, String(valeur)); },
    removeItem: cle => { ecritures.push(cle); donnees.delete(cle); }
  };
  const document = { documentElement: racine, body: { classList: racine.classList }, getElementById: () => null, addEventListener() {} };
  const contexte = {
    document, localStorage: stockage,
    matchMedia: () => ({ matches: false }), setTimeout() {},
    addEventListener(type, fn) { (ecouteurs[type] ||= []).push(fn); },
    dispatchEvent(ev) { for (const fn of ecouteurs[ev.type] || []) fn(ev); },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options?.detail; } }
  };
  contexte.window = contexte;
  vm.createContext(contexte);
  vm.runInContext(source, contexte);
  return { api: contexte.STIProfil, contexte, donnees, ecritures, ecouteurs };
}

test('visites uniques, historiques de cours et une seule clé de profil écrite', () => {
  const { api, donnees, ecritures } = creerContexte({
    'sti-profil-abonne': { coursVisites: ['css3', 'css3', 'invalide'], progression: { php: true }, exercicesFaits: { sql: ['tp1'] } },
    'sti-pages-vues-v432': { 'cours/html5.html': 1, 'cours/courshtml5.html': 1, 'cours/javascript.html': 1, 'cours/sql.html': 0, 'cours/php.html': '0', 'quiz/php.html': 1 }
  });
  ecritures.length = 0; // Les anciennes clés de thème sont initialisées indépendamment.
  assert.deepEqual(Array.from(api.listerCoursVisites()), ['css3', 'html5', 'javascript']);
  api.enregistrerVisiteCours('html5');
  api.enregistrerVisiteCours('html5');
  api.enregistrerVisiteCours('invalide');
  assert.deepEqual(Array.from(api.chargerProfil().coursVisites), ['html5', 'css3']);
  assert.deepEqual(Array.from(api.listerCoursVisites()), ['html5', 'css3', 'javascript']);
  const avantFusion = ecritures.length;
  api.fusionnerCoursVisites(['css3', 'html5']);
  assert.equal(ecritures.length, avantFusion, 'pas de réécriture si seul l’ordre diffère');
  api.fusionnerCoursVisites(['javascript']);
  assert.deepEqual(Array.from(api.chargerProfil().coursVisites), ['html5', 'css3', 'javascript']);
  assert.deepEqual([...new Set(ecritures)], ['sti-profil-abonne']);
  assert.equal(JSON.parse(donnees.get('sti-pages-vues-v432'))['cours/courshtml5.html'], 1);
  donnees.set('sti-pages-vues-v432', '{malformé');
  assert.deepEqual(Array.from(api.listerCoursVisites()), ['html5', 'css3', 'javascript']);
});

test('ancienne lecture et chapitre visité récupérés sans confondre les révisions globales', () => {
  const { api } = creerContexte({ 'sti-profil-abonne': {
    derniereLecture: { matiere: 'sql', chapitreId: 'intro' },
    chapitres: { html5: { entete: 'en_cours' }, javascript: { sec1: 'revise' }, css3: { selecteurs: 'a_reviser' } },
    progression: { php: true }
  } });
  assert.deepEqual(Array.from(api.listerCoursVisites()), ['sql', 'html5', 'javascript']);
});

test('la purge par le synchroniseur efface aussi la copie mémoire du compte précédent', () => {
  const { api, donnees } = creerContexte({ 'sti-profil-abonne': { prenom: 'Ancien', coursVisites: ['php'] } });
  assert.equal(api.chargerProfil().prenom, 'Ancien');
  donnees.set('sti-profil-abonne', '{malformé');
  assert.equal(api.chargerProfil().prenom, '', 'un profil corrompu ne réutilise pas la copie précédente');
  donnees.delete('sti-profil-abonne');
  assert.equal(api.chargerProfil().prenom, '');
  assert.deepEqual(Array.from(api.listerCoursVisites()), []);
  api.enregistrerVisiteCours('sql');
  assert.deepEqual(Array.from(api.chargerProfil().coursVisites), ['sql']);
});

test('changement et déconnexion explicite suivent les métadonnées de la session courante', async () => {
  const { api, contexte, donnees, ecouteurs } = creerContexte({
    'sti-profil-abonne': { prenom: 'Ancien', coursVisites: ['php'] },
    'sti-session-cache': { id: 'ancien', email: 'ancien@example.invalid', prenom: 'Ancien', statut: 'actif' },
    'sti-sync-uid': 'ancien'
  });
  let callback;
  contexte.__STI_SB_CLIENT = { auth: {
    getSession: async () => ({ data: { session: null } }),
    onAuthStateChange(fn) { callback = fn; }
  } };
  ecouteurs.DOMContentLoaded[0]();
  await Promise.resolve();
  callback('SIGNED_IN', { user: { id: 'nouveau', email: 'nouveau@example.invalid', user_metadata: { prenom: 'Nour' } } });
  let etat = api.lireEtatSession();
  assert.equal(etat.prenomCompte, 'Nour');
  assert.equal(etat.prenom, 'Nour');
  assert.equal(etat.compteEnAttente, true);
  donnees.delete('sti-profil-abonne');
  donnees.set('sti-sync-uid', 'nouveau');
  etat = api.lireEtatSession();
  assert.equal(etat.compteEnAttente, false);
  assert.equal(etat.prenomCompte, 'Nour');
  assert.deepEqual(Array.from(api.listerCoursVisites()), []);
  callback('SIGNED_OUT', null);
  assert.equal(api.lireEtatSession().connecte, true, 'le cache actif conserve le fonctionnement hors ligne');
  donnees.delete('sti-session-cache');
  assert.equal(api.lireEtatSession().connecte, false);
});
