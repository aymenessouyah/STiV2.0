/*
  v590 — la sauvegarde quotidienne ignorait trois tables.

  La fonction SQL d'export (`admin_sauvegarde_tables_annexes`, v467) ne rendait
  que les 4 tables annexes d'origine. Depuis, la base s'est enrichie de :
    • `sti_quiz_xp_compteurs` et `sti_quiz_xp_operations` (v487) — fermées au
      navigateur (`revoke all … from anon, authenticated`), donc invisibles pour
      l'export côté client ;
    • `acces_sauvegardes` (v582) — les copies du journal de connexions.

  Ce fichier vérifie que la liste du script (`TABLES_CLOUD`), la fonction SQL et
  les textes affichés disent tous la même chose : 18 tables.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const lire = (p) => readFileSync(resolve(root, p), 'utf8');
const sauvegarde = lire('assets/js/sauvegarde.js');

function tablesCloud() {
  const debut = sauvegarde.indexOf('var TABLES_CLOUD = [');
  const fin = sauvegarde.indexOf('];', debut) + 2;
  const bloc = sauvegarde.slice(debut, fin);
  return [...bloc.matchAll(/nom:\s*"([^"]+)"/g)].map((m) => m[1]);
}

test('v590 : le script sauvegarde 18 tables, XP et copies du journal comprises', () => {
  const tables = tablesCloud();
  assert.equal(tables.length, 18, 'TABLES_CLOUD doit lister 18 tables');
  for (const attendue of ['sti_quiz_xp_compteurs', 'sti_quiz_xp_operations', 'acces_sauvegardes']) {
    assert.ok(tables.includes(attendue), attendue + ' doit être sauvegardée');
    /* Ces tables ne sont pas lisibles par le navigateur : export par RPC. */
    const ligne = sauvegarde.split('\n').find((l) => l.includes('nom: "' + attendue + '"'));
    assert.match(ligne, /viaRpcAnnexe: true/, attendue + ' passe par la RPC admin');
  }
  assert.equal(new Set(tables).size, tables.length, 'aucune table en double');
});

test('v590 : la fonction RPC rend les mêmes tables, sans contenu sensible', () => {
  const sql = lire('supabase/migrations/20261104_sauvegarde_18_tables_v590.sql');
  for (const t of ['labo_devices', 'labo_device_sessions', 'badges_labo', 'push_subscriptions',
    'sti_quiz_xp_compteurs', 'sti_quiz_xp_operations', 'acces_sauvegardes']) {
    assert.ok(sql.includes("'" + t + "',"), 'la RPC doit rendre ' + t);
  }
  /* Les copies du journal ne partent qu'en métadonnées : jamais la colonne `lignes`. */
  assert.doesNotMatch(sql, /to_jsonb\(a\)/, 'acces_sauvegardes ne doit pas être exportée en entier');
  assert.match(sql, /'nb_lignes', a\.nb_lignes/);
  /* Le contrôle d'accès reste l'administrateur. */
  assert.match(sql, /IF NOT public\.est_admin\(\) THEN/);
  assert.doesNotMatch(sql, /secret_hash'?\)\s*\n\s*FROM public\.labo_devices/i);
});

test('v590 : aucune table connue du tableau de bord ne reste hors sauvegarde', () => {
  /* Le module DBSupbase énumère les tables de contenu (TABLES_META) : la
     sauvegarde doit les couvrir toutes, plus les tables techniques d'XP et les
     copies du journal de connexions. */
  const dbs = lire('assets/js/admin-dbsupbase.js');
  const bloc = dbs.slice(dbs.indexOf('var TABLES_META = {'),
    dbs.indexOf('};', dbs.indexOf('var TABLES_META = {')));
  const contenu = [...bloc.matchAll(/^\s{4}([a-z0-9_]+):\s*\{/gm)].map((m) => m[1]);
  assert.equal(contenu.length, 15, 'quinze tables de contenu recensées par DBSupbase');

  const couvertes = new Set(tablesCloud());
  const oubliees = contenu.filter((t) => !couvertes.has(t));
  assert.deepEqual(oubliees, [], 'tables de contenu jamais sauvegardées');

  const techniques = ['sti_quiz_xp_compteurs', 'sti_quiz_xp_operations', 'acces_sauvegardes'];
  const attendues = new Set([...contenu, ...techniques]);
  assert.equal(attendues.size, 18);
  assert.deepEqual([...couvertes].sort(), [...attendues].sort(),
    'la sauvegarde couvre exactement les 15 tables de contenu et les 3 tables techniques');
});

test('v590 : les textes annoncent 18 tables, pas 15', () => {
  assert.match(lire('admin.html'), /des <b>18 tables Supabase vers Google Drive<\/b>/);
  assert.match(lire('admin.html'), /<b>18 tables sauvegardées sans troncature/);
  assert.match(lire('README.md'), /Base Supabase \(18 tables\)/);
  assert.match(lire('README.md'), /sauvegarde automatique quotidienne des \*\*18 tables Supabase\*\*/);
  /* Le compteur du module DBSupbase, lui, mesure toujours les 15 tables de contenu. */
  assert.match(lire('README.md'), /DBSupbase.*15 tables/s);
});
