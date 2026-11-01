/* v613 — « les compteurs des vidéos, comme les nouveaux compteurs à partir de
   Supabase ? »
   ───────────────────────────────────────────────────────────────────────────
   Même défaut que les connexions (v612), autre journal. Les pourcentages vidéo
   d'un élève venaient de deux lectures bornées :
     • `sti_progressions` lu par pages de 5 000 lignes → les élèves au-delà ne
       sont jamais lus ;
     • le journal `acces` « PROG_MEDIA », dont la page ne garde que les 600
       dernières lignes de toute la plateforme.
   Un élève affichait donc « 0/27 » alors que la base connaissait ses vidéos.

   Ces tests exécutent réellement le code livré, avec une base simulée :
     • un élève à 0 vidéo retrouve ses pourcentages (progression + journal) ;
     • le pourcentage retenu est toujours le plus fort (jamais de recul) ;
     • les vidéos décoratives restent ignorées ;
     • un élève réellement sans vidéo est mémorisé « vérifié » ;
     • plafond par passe, abandon après 3 échecs, aucune requête hors-ligne ;
     • le coin « Vues des vidéos » complète les élèves absents de la pagination.
*/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const lire = (chemin) => readFileSync(new URL(`../${chemin}`, import.meta.url), 'utf8');
const admin = lire('assets/js/admin.js');
const vues = lire('assets/js/admin-vues-videos.js');
const adminHtml = lire('admin.html');
const sw = lire('sw.js');

function extraitMedias() {
  const debut = admin.indexOf('  var mediasRecomptesAdmin = {};');
  const marque = '  window.__stiMediasRecomptesAdmin = mediasRecomptesAdmin;';
  const fin = admin.indexOf(marque);
  assert.ok(debut > 0 && fin > debut, 'le module vidéo de la v613 doit être présent');
  return admin.slice(debut, fin + marque.length);
}

/* Base simulée : `progression[uid]` = colonne donnees (objet), `traces[uid]` = lignes acces. */
function espace({ progression = {}, traces = {}, profils = [], echoue = false } = {}) {
  const journal = { requetes: [] };
  const ctx = {
    COLONNES_ACCES_ADMIN: 'id,user_id,debut,fin,duree_sec,lieu,page',
    profils,
    progMediaParUser: {},
    msg() {},
    navigator: { onLine: true },
    setTimeout: (f) => setTimeout(f, 0),
    rendAbonnes() { journal.rendus = (journal.rendus || 0) + 1; },
    window: {},
    normaliserCleMediaAdmin(k) {
      const cle = String(k == null ? '' : k);
      if (cle.indexOf(':') <= 0) return '';
      if (/drapeau|ambient|flower|stivideo/i.test(cle)) return '';
      return cle;
    },
    parserObjetJsonSoupleAdmin(v) {
      if (v == null) return null;
      if (typeof v === 'object') return v;
      try { return JSON.parse(v); } catch (e) { return null; }
    },
    extrairePctMediaEntreeAdmin(it) {
      if (typeof it === 'number') return it;
      if (it && typeof it === 'object') return Number(it.pct) || (it.done ? 100 : 0);
      return 0;
    }
  };

  function requete(table) {
    const filtres = { eq: [] };
    const objet = {
      select() { return objet; },
      eq(col, val) { filtres.eq.push([col, val]); return objet; },
      order() { return objet; },
      limit() { return objet; },
      then(resolve, reject) {
        journal.requetes.push({ table, filtres });
        if (echoue) return Promise.resolve({ data: null, error: { message: 'refusé' } }).then(resolve, reject);
        const uid = (filtres.eq.find(([c]) => c === 'user_id') || [])[1];
        if (table === 'sti_progressions') {
          const d = progression[uid];
          return Promise.resolve({ data: d ? [{ user_id: uid, donnees: d }] : [], error: null }).then(resolve, reject);
        }
        return Promise.resolve({ data: traces[uid] || [], error: null }).then(resolve, reject);
      }
    };
    return objet;
  }
  ctx.sb = { from: requete };
  vm.createContext(ctx);
  vm.runInContext(extraitMedias(), ctx);
  return { ctx, journal };
}

const eleve = (id) => ({ id, email: id + '@exemple.tn', statut: 'actif' });
const trace = (id, uid, media) => ({ id, user_id: uid, page: 'PROG_MEDIA', lieu: JSON.stringify({ m: media }) });

test('v613 — un élève à 0 vidéo retrouve ses pourcentages dans la base', async () => {
  const { ctx } = espace({
    profils: [eleve('u1')],
    progression: { u1: { 'sti-media-prog-v1': { 'video:css3-cours': 100, 'video:boucle-pour': { pct: 40 } } } },
    traces: { u1: [trace(1, 'u1', { 'video:date-js': { pct: 0 } , 'audio:html5-cours': 92 })] }
  });
  assert.deepEqual(ctx.progMediaParUser, {}, 'au départ la page ne connaît aucune vidéo');

  const trouves = await ctx.window.__stiRecompterMediasAdmin();
  assert.equal(trouves, 1);
  assert.equal(ctx.progMediaParUser.u1['video:css3-cours'], 100);
  assert.equal(ctx.progMediaParUser.u1['video:boucle-pour'], 40);
  /* 92 sous forme numérique pour la trace d'audio : le format du journal est
     { m: { clé: nombre } }. */
  assert.equal(ctx.progMediaParUser.u1['audio:html5-cours'], 92);
});

test('v613 — le pourcentage retenu est toujours le plus fort (aucun recul)', async () => {
  const { ctx } = espace({
    profils: [eleve('u2')],
    progression: { u2: { 'sti-media-prog-v1': { 'video:php-variables': 30 } } },
    traces: { u2: [trace(2, 'u2', { 'video:php-variables': 95 })] }
  });
  await ctx.window.__stiRecompterMediasAdmin();
  assert.equal(ctx.progMediaParUser.u2['video:php-variables'], 95);

  /* Une lecture ultérieure plus faible ne doit jamais écraser la valeur haute. */
  ctx.progMediaParUser = { u2: { 'video:php-variables': 100 } };
  ctx.appliquerMediasRecomptesAdmin();
  assert.equal(ctx.progMediaParUser.u2['video:php-variables'], 100, 'le maximum est conservé');
});

test('v613 — les vidéos décoratives restent ignorées', async () => {
  const { ctx } = espace({
    profils: [eleve('u3')],
    progression: { u3: { 'sti-media-prog-v1': { 'video:drapeau-anime': 100, 'video:css3-display': 55 } } },
    traces: {}
  });
  await ctx.window.__stiRecompterMediasAdmin();
  assert.equal(ctx.progMediaParUser.u3['video:drapeau-anime'], undefined, 'le drapeau animé n’est pas une capsule');
  assert.equal(ctx.progMediaParUser.u3['video:css3-display'], 55);
});

test('v613 — un élève réellement sans vidéo est mémorisé et n’est plus interrogé', async () => {
  const { ctx, journal } = espace({ profils: [eleve('vide')], progression: {}, traces: {} });
  const trouves = await ctx.window.__stiRecompterMediasAdmin();
  assert.equal(trouves, 0);
  assert.equal(Object.keys(ctx.mediasRecomptesAdmin.vide).length, 0, 'vérifié : aucune vidéo');
  const avant = journal.requetes.length;
  await ctx.window.__stiRecompterMediasAdmin();
  assert.equal(journal.requetes.length, avant, 'aucune requête de plus pour un zéro vérifié');
});

test('v613 — plafond par passe, abandon après 3 échecs, rien hors-ligne', async () => {
  const profils = [];
  for (let i = 0; i < 40; i++) profils.push(eleve('e' + i));
  const { ctx, journal } = espace({ profils });
  await ctx.window.__stiRecompterMediasAdmin();
  assert.equal(journal.requetes.length, 48, 'au plus 24 élèves × 2 requêtes par passe');

  const panne = espace({ profils: [eleve('p1')], echoue: true });
  await panne.ctx.window.__stiRecompterMediasAdmin();
  await panne.ctx.window.__stiRecompterMediasAdmin();
  await panne.ctx.window.__stiRecompterMediasAdmin();
  const avant = panne.journal.requetes.length;
  await panne.ctx.window.__stiRecompterMediasAdmin();
  assert.equal(panne.journal.requetes.length, avant, 'après 3 échecs on n’insiste plus');

  const horsLigne = espace({ profils: [eleve('u9')], progression: { u9: { 'sti-media-prog-v1': {} } } });
  horsLigne.ctx.navigator.onLine = false;
  await horsLigne.ctx.window.__stiRecompterMediasAdmin({ onDemande: true });
  assert.equal(horsLigne.journal.requetes.length, 0, 'aucune requête hors-ligne');
});

test('v613 — les vidéos retrouvées survivent aux re-rendus du journal', () => {
  assert.ok(admin.includes('/* v613 : les pourcentages vidéo retrouvés dans la base survivent aux rendus. */'),
    'rendAbonnes réapplique les pourcentages vérifiés');
  /* rendAbonnes est appelé à la fin de chaque reconstruction du journal : les
     pourcentages vérifiés y sont donc remis avant tout affichage. */
  assert.ok(/appliquerCompteursRecomptesAdmin\(\);\s*\n\s*\/\* v613/.test(admin),
    'les pourcentages vidéo sont remis avant le rendu de la liste');
  /* Déclenchement automatique et bouton manuel enchaînent les deux comptages. */
  assert.match(admin, /minuteurRecompteMediaAdmin = setTimeout\(function \(\) \{ recompterMediasEleves\(\); \}, 2400\)/);
  assert.match(admin, /return recompterMediasEleves\(\{ onDemande: true \}\)/);
});

test('v613 — le coin « Vues des vidéos » complète les élèves absents de la pagination', () => {
  const debut = vues.indexOf('  var MAX_ELEVES_COMPLETES = 40;');
  const fin = vues.indexOf('  /* Suite commune : mémoriser, afficher, annoncer. */');
  assert.ok(debut > 0 && fin > debut);
  const code = vues.slice(debut, fin);
  const ctx = {
    setTimeout: (f) => setTimeout(f, 0),
    MAX_ELEVES_COMPLETES: 40
  };
  vm.createContext(ctx);
  vm.runInContext(code + '\nthis.completer = completerElevesManquants;', ctx);

  const demandes = [];
  const client = {
    from: () => ({
      select: () => ({ eq: (col, val) => { demandes.push(val); return { limit: () => Promise.resolve({ data: [{ user_id: val, donnees: {} }], error: null }) }; } })
    })
  };
  const lignes = [{ user_id: 'a', email: 'a@x.tn', donnees: {} }];
  const profils = [{ id: 'a', email: 'a@x.tn' }, { id: 'b', email: 'b@x.tn' }, { id: 'c', email: 'c@x.tn' }];
  return ctx.completer(client, lignes, profils).then((completees) => {
    assert.deepEqual(demandes.sort(), ['b', 'c'], 'seuls les élèves absents sont demandés');
    assert.equal(completees.length, 3, 'les lignes manquantes sont ajoutées');
  });
});

test('v613 — publication : version, cache-busters et révisions', () => {
  assert.match(sw, /var VERSION_PUBLIEE = "v613";/);
  assert.match(sw, /v613-videos-supabase-20261101/);
  assert.match(adminHtml, /assets\/js\/admin\.js\?v=613-perf/);
  assert.match(adminHtml, /assets\/js\/admin-vues-videos\.js\?v=613-perf/);
  assert.ok(sw.includes('{ url: "./assets/js/admin.js", revision: "videos-supabase-v613" }'));
  assert.ok(sw.includes('{ url: "./assets/js/admin-vues-videos.js", revision: "videos-supabase-v613" }'));
  assert.ok(sw.includes('{ url: "./admin.html", revision: "videos-supabase-v613" }'));
  assert.match(sw, /var CACHE = "sti-atelier-v386"/);
  assert.match(sw, /var UPDATE_ID = "v582-journal-connexions"/);
});
