/*
  v584 — retrouver les connexions perdues : fouille du navigateur + import d'un fichier.

  Contexte (31/10/2026) : la table `acces` a été vidée vers le 25/10 (les identifiants 1 à
  5 326 ont disparu) et aucune copie serveur n'existait avant la v582. Les seules traces
  possibles sont locales : instantané IndexedDB du tableau de bord, copies déposées avant
  purge, ancien secours localStorage, ou un fichier JSON téléchargé par le professeur.

  Ce que doit garantir ce module :
    - la recherche est strictement en LECTURE (aucune écriture, aucune base créée) ;
    - il reconnaît les lignes même imbriquées ({lignes:[…]}, {tousAcces:[…]}, tableaux) ;
    - il dédoublonne sur user_id/debut/page et distingue les lignes antérieures au 25/10 ;
    - le réimport passe par la même RPC idempotente que le bouton ♻️ de la v582.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

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
    'this.__T = { normaliserLigneAccesV584: normaliserLigneAccesV584,' +
    ' extraireLignesAccesV584: extraireLignesAccesV584,' +
    ' statistiquesLignesAccesV584: statistiquesLignesAccesV584,' +
    ' analyserSourcesAccesV584: analyserSourcesAccesV584,' +
    ' lignesDepuisTexteJsonV584: lignesDepuisTexteJsonV584,' +
    ' DATE_PERTE: DATE_PERTE_ACCES_V584 };'
  ].join('\n');
  const contexte = vm.createContext({ console, JSON, Date, Array, Object, String, Number, isFinite });
  vm.runInContext(script, contexte, { filename: 'admin.js#v584' });
  return contexte.__T;
}

const T = chargerOutils();

const ligne = (uid, debut, page, extra) => Object.assign(
  { user_id: uid, debut, fin: debut, duree_sec: 120, lieu: '{"app":"pc"}', page }, extra || {}
);

test('v584 : une ligne de connexion est reconnue sous ses variantes de nommage', () => {
  const attendue = T.normaliserLigneAccesV584({
    userId: 'u1', start: '2026-10-20T08:00:00Z', url: 'cours/html5.html', dureeSec: 90, appareil: 'pc'
  });
  assert.equal(attendue.user_id, 'u1');
  assert.equal(attendue.debut, '2026-10-20T08:00:00Z');
  assert.equal(attendue.page, 'cours/html5.html');
  assert.equal(attendue.duree_sec, 90);
  assert.equal(attendue.lieu, 'pc');

  /* Forme exacte renvoyée par PostgREST. */
  const brute = JSON.parse(JSON.stringify(
    T.normaliserLigneAccesV584(ligne('u2', '2026-10-24T10:00:00Z', 'quiz/php.html'))
  ));
  assert.deepEqual(brute, {
    user_id: 'u2', debut: '2026-10-24T10:00:00Z', fin: '2026-10-24T10:00:00Z',
    duree_sec: 120, lieu: '{"app":"pc"}', page: 'quiz/php.html'
  });

  /* Pas de faux positif : il manque toujours un des trois champs vitaux. */
  assert.equal(T.normaliserLigneAccesV584({ page: 'index.html' }), null);
  assert.equal(T.normaliserLigneAccesV584({ user_id: 'u1', page: 'index.html' }), null);
  assert.equal(T.normaliserLigneAccesV584({ user_id: 'u1', debut: '2026-10-20' }), null);
  assert.equal(T.normaliserLigneAccesV584('texte'), null);
  assert.equal(T.normaliserLigneAccesV584([ligne('u1', '2026-10-20', 'a.html')]), null);
});

test('v584 : les lignes sont retrouvées dans toutes les formes de sauvegarde', () => {
  const a = ligne('u1', '2026-10-20T08:00:00Z', 'cours/html5.html');
  const b = ligne('u2', '2026-10-26T08:00:00Z', 'cours/sql.html');
  const c = ligne('u3', '2026-10-27T09:00:00Z', 'quiz/sql.html');
  const dechet = { titre: 'Rapport', valeurs: [1, 'x', { a: 1 }, null] };

  /* 1) tableau brut */
  assert.equal(T.extraireLignesAccesV584([a, b, dechet]).length, 2);
  /* 2) fichier exporté par la v582 : { application, lignes:[…] } */
  assert.equal(T.extraireLignesAccesV584({ application: 'STI V2.0', lignes: [a, c] }).length, 2);
  /* 3) instantané du tableau de bord : { tous, tousAcces:[…] } */
  assert.equal(T.extraireLignesAccesV584({ tous: [{ id: 'p1' }], tousAcces: [a, b, c] }).length, 3);
  /* 4) imbrication profonde */
  assert.equal(T.extraireLignesAccesV584({ x: { y: { z: [{ l: [a] }, b] } } }).length, 2);
  /* 5) doublons internes ramenés à une seule ligne */
  assert.equal(T.extraireLignesAccesV584([a, Object.assign({}, a), b]).length, 2);
  /* 6) rien à trouver */
  assert.equal(T.extraireLignesAccesV584(null).length, 0);
  assert.equal(T.extraireLignesAccesV584({ autre: 'chose' }).length, 0);
});

test('v584 : l’analyse par source compte et date les lignes, doublons compris', () => {
  const avant = ligne('u1', '2026-10-20T08:00:00Z', 'cours/html5.html');
  const apres = ligne('u1', '2026-10-27T08:00:00Z', 'cours/sql.html');
  const analyse = T.analyserSourcesAccesV584([
    { nom: 'IndexedDB « sti-admin-dashboard-v1 » / snapshots', valeurs: [{ tousAcces: [avant, apres] }] },
    { nom: 'Stockage navigateur « localStorage »', valeurs: { lignes: [avant, Object.assign({}, apres)] } },
    { nom: 'source vide', valeurs: { rien: true } }
  ]);

  assert.equal(analyse.sources.length, 2, 'les sources vides ne sont pas listées');
  assert.equal(analyse.sources[0].nb, 2);
  assert.equal(analyse.sources[0].avant, 1, 'une seule ligne précède le 25/10/2026');
  assert.equal(analyse.sources[0].premiere, '2026-10-20T08:00:00Z');
  assert.equal(analyse.sources[0].derniere, '2026-10-27T08:00:00Z');
  assert.equal(analyse.sources[1].nb, 2);
  assert.equal(analyse.lignes.length, 2, 'les doublons entre sources sont fusionnés');
  assert.equal(analyse.stats.avant, 1);
  assert.equal(T.DATE_PERTE, '2026-10-25');
  assert.equal(adminJs.includes('DATE_PERTE_ACCES_V584 = "2026-10-25"'), true);
});

test('v584 : un fichier JSON est lu sans planter sur du contenu invalide', () => {
  const exportV582 = JSON.stringify({
    application: 'STI V2.0',
    nature: 'sauvegarde du journal des connexions avant suppression',
    mois: '2026-10',
    cree_le: '2026-10-25T19:30:00Z',
    lignes: [ligne('u1', '2026-10-22T08:00:00Z', 'cours/php.html')]
  });
  assert.equal(T.lignesDepuisTexteJsonV584(exportV582).length, 1);
  assert.equal(T.lignesDepuisTexteJsonV584('[1,2,3]').length, 0);
  assert.equal(T.lignesDepuisTexteJsonV584('pas du json').length, 0);
  assert.equal(T.lignesDepuisTexteJsonV584('').length, 0);
});

test('v584 : la fouille est en lecture seule et le réimport reste idempotent', () => {
  const debut = adminJs.indexOf('/* ---------- v584 : retrouver d’anciennes connexions');
  const debutAlt = adminJs.indexOf('/* ---------- v584 : retrouver d\'anciennes connexions');
  const i = debut >= 0 ? debut : debutAlt;
  assert.ok(i > 0, 'bloc v584 présent');
  const fin = adminJs.indexOf('function afficherModalSauvegardesAccesAdmin(liste) {');
  assert.ok(fin > i);
  const bloc = adminJs.slice(i, fin);

  /* Aucune écriture : ni REST, ni RPC de purge, ni suppression. */
  assert.equal(/\.from\(/.test(bloc), false, 'la fouille ne touche pas aux tables');
  assert.equal(/\.delete\(/.test(bloc), false, 'la fouille ne supprime rien');
  assert.equal(/\.insert\(/.test(bloc), false, 'la fouille n’insère rien');
  assert.equal(/admin_purger|admin_supprimer/.test(bloc), false, 'aucune RPC de purge');

  /* Aucune base créée : open() sans numéro de version et annulation de la mise à niveau. */
  assert.match(bloc, /indexedDB\.open\(nom\)/);
  assert.equal(/indexedDB\.open\(nom,\s*\d/.test(bloc), false, 'jamais de version forcée');
  assert.match(bloc, /req\.onupgradeneeded[\s\S]{0,160}abort\(\)/);

  /* Le seul point d’écriture est le réimport, par la RPC déjà éprouvée. */
  assert.match(bloc, /reimporterLignesAccesAdmin\(analyse\.lignes, /);
  assert.match(adminJs, /sb\.rpc\("admin_reimporter_acces"/);

  /* Les deux nouveaux outils sont branchés et protégés contre un double montage. */
  assert.match(adminJs, /btn-fouiller-acces/);
  assert.match(adminJs, /btn-importer-fichier-acces/);
  assert.match(adminJs, /if \(document\.getElementById\("btn-fouiller-acces"\)\) return;/);
  /* v592 : les archives .json.gz sont acceptées en plus des .json simples. */
  assert.match(bloc, /accept = "\.json,\.gz,application\/json,application\/gzip"/);
  assert.match(bloc, /new FileReader\(\)/);

  /* Le bouton ♻️ de la v582 reste en place : la nouvelle fouille ne le remplace pas. */
  assert.match(adminJs, /function reimporterInstantaneLocalAccesAdmin\(\)/);
  assert.match(adminJs, /btn-reimporter-acces/);

  /* Les fonctions pures sont exposées pour être testables hors navigateur. */
  assert.match(adminJs, /window\.__stiRechercheConnexionsV584 = \{/);
});

test('v584 : le service worker sert la nouvelle version de admin.js', () => {
  const sw = read('sw.js');
  const entree = sw.split('\n').find((l) => l.includes('url: "./assets/js/admin.js"'));
  assert.ok(entree);
  assert.match(entree, /revision: "guide-secours-v616"/);
  /* Le nom de cache et l'identifiant de publication ne bougent pas : pas de
     re-téléchargement massif des 778 entrées du delta. */
  assert.match(sw, /var CACHE = "sti-atelier-v386";/);
  assert.match(sw, /var UPDATE_ID = "v582-journal-connexions";/);
});

test('v584 (comportemental) : la fouille remonte les anciennes lignes et propose le réimport', async () => {
  const blocDebut = adminJs.indexOf('/* ---------- v584 : retrouver');
  const blocFin = adminJs.indexOf('function afficherModalSauvegardesAccesAdmin(liste) {');
  assert.ok(blocDebut > 0 && blocFin > blocDebut);
  let bloc = adminJs.slice(blocDebut, blocFin);

  const ancienne = ligne('u1', '2026-10-20T08:00:00Z', 'cours/html5.html');
  const recente = ligne('u2', '2026-10-27T08:00:00Z', 'cours/sql.html');
  const valeursIdb = [{ tousAcces: [ancienne, recente], tous: [] }];

  /* IndexedDB factice : une base, un magasin « snapshots », un curseur. */
  function curseur(vals) {
    let i = 0;
    const c = {
      onsuccess: null,
      onerror: null,
      _pas() {
        const v = i < vals.length ? { value: vals[i++] } : null;
        setTimeout(() => { if (c.onsuccess) c.onsuccess({ target: { result: v } }); }, 0);
      },
      continue() { c._pas(); }
    };
    setTimeout(() => c._pas(), 0);
    return c;
  }
  const magasin = { openCursor: () => curseur(valeursIdb) };
  const db = {
    objectStoreNames: ['snapshots'],
    transaction: () => ({ objectStore: () => magasin }),
    close() {}
  };
  const indexedDbFactice = {
    databases: () => Promise.resolve([{ name: 'sti-admin-dashboard-v1' }]),
    open: () => {
      const req = {};
      setTimeout(() => { req.result = db; if (req.onsuccess) req.onsuccess(); }, 0);
      return req;
    }
  };

  const stockage = {
    length: 1,
    key: (i) => (i === 0 ? 'sti-admin-cache' : null),
    getItem: () => JSON.stringify({ ts: Date.parse('2026-10-25T19:00:00Z'), tousAcces: [ancienne] })
  };

  const boutons = [];
  const ancre = {
    firstChild: null,
    insertBefore(el) { boutons.push(el); }
  };
  const documentFactice = {
    body: { appendChild() {}, removeChild() {} },
    createElement: () => {
      const el = {
        style: { cssText: '' }, dataset: {}, files: null,
        addEventListener(t, f) { el['on' + t] = f; },
        click() { el.clique = true; }
      };
      return el;
    },
    getElementById: (id) => (id === 'btn-reimporter-acces' ? { id, parentNode: ancre } : null)
  };

  const confirmations = [];
  const reimports = [];
  const messages = [];
  const contexte = vm.createContext({
    console, JSON, Date, Array, Object, String, Number, isFinite, Promise, setTimeout,
    window: {},
    localStorage: stockage,
    sessionStorage: null,
    indexedDB: indexedDbFactice,
    navigator: { onLine: true },
    document: documentFactice,
    FileReader: function () {},
    btnOuvrirPurgeAcces: { id: 'btn-purge', parentNode: ancre },
    msg: (t, c) => messages.push([t, c]),
    echHtml: (x) => String(x == null ? '' : x),
    demanderConfirmationOperation: (opts) => confirmations.push(opts),
    reimporterLignesAccesAdmin: (lignes, origine) => { reimports.push([lignes, origine]); return Promise.resolve({ inseres: lignes.length }); }
  });
  contexte.window = contexte;
  const outilsReels = [
    extraireFonction('lignesAccesDepuisListeAdmin'),
    extraireFonction('fmtDateCourteAdmin')
  ].join('\n');
  vm.runInContext(outilsReels + '\n' + bloc, contexte, { filename: 'admin.js#v584-behaviour' });

  /* Les deux boutons sont montés dans la barre de la section Connexions. */
  assert.equal(boutons.length, 2);
  const parId = {};
  boutons.forEach((b) => { parId[b.id] = b; });
  assert.ok(parId['btn-fouiller-acces'] && parId['btn-importer-fichier-acces']);
  /* la fouille est insérée en dernier, donc affichée en premier */
  assert.equal(boutons[boutons.length - 1].id, 'btn-fouiller-acces');
  assert.match(parId['btn-fouiller-acces'].textContent, /Fouiller ce navigateur/);

  /* Clic sur « 🔎 Fouiller ce navigateur ». */
  parId['btn-fouiller-acces'].onclick();
  await new Promise((r) => setTimeout(r, 120));

  assert.equal(confirmations.length, 1, 'la fouille propose le réimport avant toute écriture');
  const conf = confirmations[0];
  assert.match(conf.titre, /Réimporter 2 connexion\(s\)/);
  assert.match(conf.htmlDesc, /IndexedDB « sti-admin-dashboard-v1 » \/ snapshots/);
  assert.match(conf.htmlDesc, /Stockage navigateur « localStorage »/);
  assert.match(conf.htmlDesc, /1 connexion\(s\) datent d'AVANT le 25\/10\/2026/);
  assert.equal(reimports.length, 0, 'rien n’est écrit tant que le professeur n’a pas confirmé');

  /* Confirmation : le réimport passe par la RPC idempotente, origine lisible. */
  conf.onConfirmer();
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(reimports.length, 1);
  assert.equal(reimports[0][0].length, 2);
  assert.equal(reimports[0][1], 'La fouille de ce navigateur');

  /* Clic sur « 📂 Importer un fichier » : un sélecteur est ouvert, sans écriture. */
  parId['btn-importer-fichier-acces'].onclick();
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(reimports.length, 1, 'le simple fait de choisir un fichier n’importe rien');
});
