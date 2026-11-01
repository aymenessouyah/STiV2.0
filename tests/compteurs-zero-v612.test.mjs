/* v612 — « Je trouve encore des candidats avec les compteurs à zéro »
   ───────────────────────────────────────────────────────────────────────────
   Les trois instruments d'une carte (Connexions · Durée · Accès 24 h) sont
   calculés sur le journal `acces` chargé dans la page : au mieux 5 000 lignes
   pour TOUTE la plateforme. Un élève dont l'activité est plus ancienne tombe
   hors de la fenêtre et s'affiche à « 00 » alors que la base le connaît.

   La v612 demande directement à la base les lignes de cet élève. Ces tests
   exécutent réellement ce code (extrait de admin.js) avec une base simulée :
     • un élève à 00 en page mais connu en base retrouve ses connexions ;
     • un élève réellement sans activité reste à 00, et n'est pas réinterrogé ;
     • la base n'est pas martelée : plafond par passe, abandon après 3 échecs ;
     • une purge de mois reste respectée ;
     • le journal des médias (PROG_MEDIA) ne gonfle pas le compteur.
*/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const lire = (chemin) => readFileSync(new URL(`../${chemin}`, import.meta.url), 'utf8');
const admin = lire('assets/js/admin.js');
const adminHtml = lire('admin.html');
const sw = lire('sw.js');

/* Extrait exact du module de recomprage, tel qu'il est livré. */
function extraitRecompte() {
  const debut = admin.indexOf('  var MAX_ELEVES_RECOMPTES = 24;');
  const marque = '  window.__stiCompteursRecomptesAdmin = compteursRecomptesAdmin;';
  const fin = admin.indexOf(marque);
  assert.ok(debut > 0 && fin > debut, 'le module de recomprage doit être présent dans admin.js');
  return admin.slice(debut, fin + marque.length);
}

/* Base simulée : `lignes[uid]` = tableau de lignes ; `echoue` pour tester les pannes. */
function espace({ lignes = {}, echoue = false, profils = [] } = {}) {
  const journal = { appels: [], filtres: [] };
  const ctx = {
    COLONNES_ACCES_ADMIN: 'id,user_id,debut,fin,duree_sec,lieu,page',
    profils,
    profilsBrutsAdmin: profils,
    counts: {},
    dureesTotales: {},
    derniereVisiteCloudParUser: {},
    cfgEcoles: {},
    acces: [],
    signauxCompatBrutAdmin: '',
    msg() {},
    navigator: { onLine: true },
    setTimeout: (f) => setTimeout(f, 0),
    clearTimeout,
    window: {},
    dureeLigne: (a) => (a && Number(a.duree_sec)) || 0,
    fusionnerAccesAdmin: (nouveaux) => nouveaux.slice(),
    sauvegarderSnapshotAdmin: () => ({ ts: 1 }),
    appliquerDonneesAdmin(tous, tousAcces) {
      ctx.acces = tousAcces.slice();
      ctx.counts = {};
      ctx.dureesTotales = {};
      tousAcces.forEach((a) => {
        ctx.counts[a.user_id] = (ctx.counts[a.user_id] || 0) + 1;
        ctx.dureesTotales[a.user_id] = (ctx.dureesTotales[a.user_id] || 0) + ctx.dureeLigne(a);
      });
    },
    rendAbonnes() { journal.rendus = (journal.rendus || 0) + 1; }
  };

  /* Chaîne PostgREST simulée, avec la même surface que le vrai client. */
  function requete(table) {
    const filtres = { eq: [], neq: [], gt: [] };
    const objet = {
      select() { return objet; },
      eq(col, val) { filtres.eq.push([col, val]); return objet; },
      neq(col, val) { filtres.neq.push([col, val]); return objet; },
      gt(col, val) { filtres.gt.push([col, val]); return objet; },
      order() { return objet; },
      limit(n) { filtres.limite = n; return objet; },
      then(resolve, reject) {
        journal.filtres.push(filtres);
        if (echoue) return Promise.resolve({ data: null, error: { message: 'refusé' } }).then(resolve, reject);
        const uid = (filtres.eq.find(([c]) => c === 'user_id') || [])[1];
        /* Comme PostgREST : le compte porte sur les lignes APRÈS filtres,
           la limite ne réduit que les lignes renvoyées. */
        let filtrees = (lignes[uid] || []).slice();
        filtres.neq.forEach(([col, val]) => { filtrees = filtrees.filter((l) => l[col] !== val); });
        filtres.gt.forEach(([col, val]) => { filtrees = filtrees.filter((l) => String(l[col]) > String(val)); });
        journal.appels.push(uid);
        return Promise.resolve({ data: filtrees.slice(0, filtres.limite || 100), count: filtrees.length, error: null }).then(resolve, reject);
      }
    };
    journal.table = table;
    return objet;
  }

  ctx.sb = { from: requete };
  vm.createContext(ctx);
  vm.runInContext(extraitRecompte(), ctx);
  return { ctx, journal };
}

const eleve = (id, extra = {}) => ({ id, email: id + '@exemple.tn', statut: 'actif', ...extra });
const ligne = (id, uid, sec, quand = '2026-09-15T10:00:00Z') => ({ id, user_id: uid, debut: quand, fin: quand, duree_sec: sec, page: 'cours/css3.html' });

test('v612 — un élève affiché à 00 retrouve ses connexions et sa durée', async () => {
  const profils = [eleve('u1')];
  const { ctx } = espace({
    profils,
    lignes: { u1: [ligne(1, 'u1', 600), ligne(2, 'u1', 900), ligne(3, 'u1', 300)] }
  });
  assert.equal(ctx.counts.u1, undefined, 'au départ la page ne connaît aucune ligne');

  const corriges = await ctx.window.__stiRecompterCompteursAdmin();
  assert.equal(corriges, 1);
  assert.equal(ctx.counts.u1, 3, 'les trois sessions de la base sont comptées');
  assert.equal(ctx.dureesTotales.u1, 1800, 'la durée réelle est additionnée (30 min)');
});

test('v612 — un élève réellement sans activité reste à 00 et n’est pas réinterrogé', async () => {
  const profils = [eleve('vide')];
  const { ctx, journal } = espace({ profils, lignes: {} });

  await ctx.window.__stiRecompterCompteursAdmin();
  assert.equal(ctx.counts.vide || 0, 0, 'le zéro est exact');
  assert.equal(journal.appels.length, 1);

  /* Deuxième passe : le zéro est mémorisé, aucune requête de plus. */
  await ctx.window.__stiRecompterCompteursAdmin();
  assert.equal(journal.appels.length, 1, 'on ne réinterroge pas la base pour un zéro vérifié');
});

test('v612 — la base n’est pas martelée : plafond par passe et abandon après 3 échecs', async () => {
  const profils = [];
  for (let i = 0; i < 40; i++) profils.push(eleve('e' + i));
  const { ctx, journal } = espace({ profils, lignes: {} });
  await ctx.window.__stiRecompterCompteursAdmin();
  assert.equal(journal.appels.length, 24, 'au plus 24 élèves par passe');

  const enPanne = espace({ profils: [eleve('p1')], echoue: true });
  await enPanne.ctx.window.__stiRecompterCompteursAdmin();
  await enPanne.ctx.window.__stiRecompterCompteursAdmin();
  await enPanne.ctx.window.__stiRecompterCompteursAdmin();
  const avant = enPanne.journal.filtres.length;
  await enPanne.ctx.window.__stiRecompterCompteursAdmin();
  assert.equal(enPanne.journal.filtres.length, avant, 'après 3 échecs on n’insiste plus');
});

test('v612 — une purge de mois reste respectée et PROG_MEDIA ne gonfle pas le compteur', async () => {
  const profils = [eleve('u9')];
  const { ctx, journal } = espace({
    profils,
    lignes: { u9: [ligne(10, 'u9', 60), { id: 11, user_id: 'u9', page: 'PROG_MEDIA', duree_sec: 5 }] }
  });
  ctx.cfgEcoles = { purgesMois: { '*': Date.parse('2026-01-01T00:00:00Z') } };
  await ctx.window.__stiRecompterCompteursAdmin();

  const filtres = journal.filtres[journal.filtres.length - 1];
  assert.ok(filtres.gt.length === 1, 'la date de purge est envoyée à la base');
  assert.equal(filtres.gt[0][0], 'debut');
  assert.ok(filtres.neq.some(([c, v]) => c === 'page' && v === 'PROG_MEDIA'), 'PROG_MEDIA est exclu du comptage');
  assert.equal(ctx.counts.u9, 1, 'seule la vraie session est comptée');
});

test('v612 — hors-ligne, on ne demande rien à la base', async () => {
  const profils = [eleve('u2')];
  const { ctx, journal } = espace({ profils, lignes: { u2: [ligne(5, 'u2', 120)] } });
  ctx.navigator.onLine = false;
  const corriges = await ctx.window.__stiRecompterCompteursAdmin({ onDemande: true });
  assert.equal(corriges, 0);
  assert.equal(journal.filtres.length, 0, 'aucune requête hors-ligne');
});

test('v612 — les compteurs vérifiés survivent aux re-rendus', async () => {
  const profils = [eleve('u3')];
  const { ctx } = espace({ profils, lignes: { u3: [ligne(7, 'u3', 300), ligne(8, 'u3', 300)] } });
  await ctx.window.__stiRecompterCompteursAdmin();
  assert.equal(ctx.counts.u3, 2);

  /* Un nouveau chargement du journal repart de zéro : la valeur vérifiée est
     remise par appliquerCompteursRecomptesAdmin (appelée par rendAbonnes). */
  ctx.counts = {};
  ctx.dureesTotales = {};
  ctx.appliquerCompteursRecomptesAdmin();
  assert.equal(ctx.counts.u3, 2);
  assert.equal(ctx.dureesTotales.u3, 600);
});

test('v612 — le recomprage est branché dans la page et dans l’interface', () => {
  /* Déclenchement automatique, après affichage, sans marteler la base. */
  assert.match(admin, /if \(!estHorsLigne && typeof recompterElevesAZero === "function"\) \{\s*clearTimeout\(minuteurRecompteAdmin\);\s*minuteurRecompteAdmin = setTimeout\(function \(\) \{ recompterElevesAZero\(\); \}, 1500\);/);
  /* Les valeurs vérifiées sont réappliquées à chaque rendu de la liste. */
  assert.match(admin, /function rendAbonnes\(\) \{\s*\/\* v612 : les compteurs vérifiés/);
  assert.ok(/appliquerCompteursRecomptesAdmin\(\);\s*\n\s*\/\* v613/.test(admin), 'rendAbonnes réapplique les compteurs vérifiés');
  /* Bouton manuel. */
  assert.match(adminHtml, /id="btn-recompter-zero"/);
  assert.ok(adminHtml.includes('🔁 Recompter les 00'));
  assert.match(admin, /document\.getElementById\("btn-recompter-zero"\)/);
  assert.match(admin, /recompterElevesAZero\(\{ onDemande: true \}\)/);
  /* Le diagnostic renvoie vers le recomprage au lieu de demander un Ctrl+F5. */
  assert.ok(admin.includes('Si le zéro persiste, cliquez sur « 🔁 Recompter les 00 »'));
});

test('v612 — publication : version, cache-busters et révisions', () => {
  assert.match(sw, /var VERSION_PUBLIEE = "v6\d\d";/);
  assert.match(sw, /v612-compteurs-zero-20261101/);
  assert.match(adminHtml, /assets\/js\/admin\.js\?v=614-perf/);
  assert.ok(sw.includes('{ url: "./assets/js/admin.js", revision: "guide-exercice-v614" }'));
  assert.ok(sw.includes('{ url: "./admin.html", revision: "guide-exercice-v614" }'));
  /* Les invariants de cache ne bougent pas. */
  assert.match(sw, /var CACHE = "sti-atelier-v386"/);
  assert.match(sw, /var UPDATE_ID = "v582-journal-connexions"/);
});
