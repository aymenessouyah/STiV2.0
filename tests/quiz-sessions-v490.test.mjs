import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../assets/js/quiz-sync.js', import.meta.url), 'utf8');
const utilisateur = { id: 'compte-test', email: 'eleve@example.invalid' };
const attente = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
const tour = () => new Promise(resolve => setImmediate(resolve));

/* Base et stockage fictifs ; les filtres sont exécutés après les blocages,
   comme pour une requête reçue en retard par PostgREST. */
function construire(initiale = null) {
  let ligne = initiale && structuredClone(initiale);
  const requetes = [], blocages = [];
  const data = new Map([['sb-test-auth-token', JSON.stringify({ user: utilisateur })]]);
  const localStorage = {
    get length() { return data.size; }, key(i) { return [...data.keys()][i] ?? null; },
    getItem(k) { return data.has(k) ? data.get(k) : null; },
    setItem(k, v) { data.set(k, String(v)); }, removeItem(k) { data.delete(k); }
  };
  function query(type, payload) {
    const filtres = [], journal = { type, filtres, payload };
    requetes.push(journal);
    const q = {
      eq(k, v) { filtres.push(['eq', k, v]); return q; },
      is(k, v) { filtres.push(['is', k, v]); return q; },
      limit() { return q; },
      then(oui, non) {
        return (async () => {
          const blocage = blocages.find(b => !b.utilise && b.type === type);
          if (blocage) { blocage.utilise = true; blocage.demarre.resolve(); await blocage.reprendre.promise; }
          const correspond = ligne && filtres.every(([, k, v]) => {
            const valeur = k === 'etat_meta->>partie_id' ? (ligne.etat_meta?.partie_id ?? null) : ligne[k];
            return valeur === v;
          });
          if (type === 'delete' && correspond) ligne = null;
          if (type === 'update' && correspond) ligne = { ...ligne, ...structuredClone(payload) };
          if (type === 'upsert') ligne = structuredClone(payload);
          return { data: type === 'select' && correspond ? [structuredClone(ligne)] : [], error: null };
        })().then(oui, non);
      }
    };
    return q;
  }
  const client = {
    auth: { getSession: async () => ({ data: { session: { user: utilisateur } } }), onAuthStateChange() {} },
    from: () => ({
      delete: () => query('delete'), update: p => query('update', p),
      upsert: p => query('upsert', p), select: () => query('select')
    })
  };
  const window = {
    localStorage, STI_AUTH: {}, supabase: {}, __STI_SB_CLIENT: client,
    location: { pathname: '/quiz/html-css.html' }, addEventListener() {}
  };
  window.window = window;
  const context = vm.createContext({ window, localStorage, document: { readyState: 'loading', addEventListener() {} },
    navigator: { onLine: true }, console, setTimeout, clearTimeout, URL, Math, Date, JSON, Promise, Object, Array, String, Number, RegExp, Set });
  vm.runInContext(source, context);
  return {
    sync: window.STIQuizSync, localStorage, requetes,
    get ligne() { return ligne && structuredClone(ligne); },
    set ligne(v) { ligne = v && structuredClone(v); },
    bloquer(type) { const b = { type, utilise: false, demarre: attente(), reprendre: attente() }; blocages.push(b); return b; }
  };
}

function session(id, maj = '2026-10-28T08:00:00.000Z') {
  return { user_id: utilisateur.id, quiz: 'html-css', statut: 'en_cours', mode: 'classic',
    maj, ordre_questions: [{ id: 'q1', options: ['a', 'b'] }], index_courant: 1,
    score: 1, total: 1, etat_meta: id ? { partie_id: id } : {} };
}

const a = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const b = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const c = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

test('conversion legacy et purge différées ne suppriment pas une nouvelle session cloud', async () => {
  const legacy = session(null), base = construire(legacy), blocage = base.bloquer('update');
  const identite = base.sync.identifierPartieReprise('html-css', structuredClone(legacy));
  await blocage.demarre.promise;
  const nouvelle = session(c, '2026-10-28T09:00:00.000Z');
  base.ligne = nouvelle;
  base.localStorage.setItem('sti-quiz-sessions-actives-v1', JSON.stringify({ 'html-css': nouvelle }));
  blocage.reprendre.resolve(); await tour();
  await base.sync.effacerSession('html-css', identite);
  assert.deepEqual(base.ligne, nouvelle);
  assert.equal(JSON.parse(base.localStorage.getItem('sti-quiz-sessions-actives-v1'))['html-css'].etat_meta.partie_id, c);
  const filtreLegacy = base.requetes.find(r => r.type === 'delete' && r.filtres.some(f => f[1] === 'maj'));
  assert.ok(filtreLegacy.filtres.some(f => f[1] === 'maj' && f[2] === legacy.maj));
  assert.ok(filtreLegacy.filtres.some(f => f[0] === 'is' && f[1] === 'etat_meta->>partie_id' && f[2] === null));
});

test('deux purges en vol ne s’effacent pas entre elles et ne suppriment pas une nouvelle partie', async () => {
  const base = construire(session(a));
  const premiere = base.bloquer('delete'), seconde = base.bloquer('delete');
  const effacerA = base.sync.effacerSession('html-css', a);
  await premiere.demarre.promise;
  const effacerB = base.sync.effacerSession('html-css', b);
  await seconde.demarre.promise;
  base.ligne = session(c, '2026-10-28T10:00:00.000Z');
  premiere.reprendre.resolve(); await effacerA;
  assert.deepEqual(JSON.parse(base.localStorage.getItem('sti-quiz-sessions-purge-v1')).map(x => x.partie_id), [b]);
  seconde.reprendre.resolve(); await effacerB;
  assert.deepEqual(JSON.parse(base.localStorage.getItem('sti-quiz-sessions-purge-v1')), []);
  assert.equal(base.ligne.etat_meta.partie_id, c);
});

test('une session legacy encore présente est supprimée uniquement à sa date et sans UUID', async () => {
  const legacy = session(null), base = construire(legacy), blocage = base.bloquer('update');
  const identite = base.sync.identifierPartieReprise('html-css', structuredClone(legacy));
  await blocage.demarre.promise;
  await base.sync.effacerSession('html-css', identite);
  assert.equal(base.ligne, null);
  assert.deepEqual(JSON.parse(base.localStorage.getItem('sti-quiz-sessions-purge-v1')), []);
  blocage.reprendre.resolve(); await tour();
  assert.equal(base.ligne, null);
});
