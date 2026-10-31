/* v558 — le quota Supabase couvre la base ET les fichiers du Storage.
   ─────────────────────────────────────────────────────────────────────────
   La v557 mesurait la base Postgres (admin_taille_base) mais laissait les
   fichiers du Storage hors de toute mesure : le badge comparait donc au
   forfait de 500 Mo un total qui n'en contenait qu'une partie.

   Ce test verrouille les quatre points qui font la justesse de la mesure :
     1. la migration somme les tailles déclarées par Storage, pas les lignes ;
     2. elle résiste à une taille illisible et à un projet sans schéma storage ;
     3. elle est gardée comme les autres mesures admin et n'est pas anonyme ;
     4. l'administration additionne réellement les deux mesures et le dit.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (chemin) => readFileSync(join(root, chemin), 'utf8');

const MIGRATION = 'supabase/migrations/20261031_admin_taille_stockage_v558.sql';

test('la fonction admin_taille_stockage somme la taille réelle des fichiers du Storage', () => {
  const sql = lire(MIGRATION);

  assert.match(sql, /create or replace function public\.admin_taille_stockage\(\)/i);
  assert.match(sql, /returns bigint/i);
  /* La taille vient des métadonnées de Storage : c'est la taille du fichier,
     pas celle de la ligne de métadonnées (déjà comptée par la base). */
  assert.match(sql, /from storage\.objects/i);
  assert.match(sql, /metadata->>'size'/i);
  /* Un objet dont la taille n'est pas un entier ne doit pas casser la somme. */
  assert.match(sql, /~\s*'\^\[0-9\]\{1,18\}\$'/, 'cast défensif sur la taille');
  /* Projet sans Storage : 0, pas une erreur. */
  assert.match(sql, /to_regclass\('storage\.objects'\) is null/i);
  assert.match(sql, /return 0;/i);
});

test('la mesure du Storage reste réservée à l’administrateur', () => {
  const sql = lire(MIGRATION);

  assert.match(sql, /security definer/i);
  assert.match(sql, /set search_path = pg_catalog, public/i);
  assert.match(sql, /if not public\.est_admin\(\) then/i);
  assert.match(sql, /errcode = '42501'/i);
  /* Aucun accès anonyme, aucun accès direct au rôle public. */
  assert.match(sql, /revoke all on function public\.admin_taille_stockage\(\) from public/i);
  assert.match(sql, /revoke all on function public\.admin_taille_stockage\(\) from anon/i);
  assert.match(sql, /grant execute on function public\.admin_taille_stockage\(\) to authenticated/i);
  assert.doesNotMatch(sql, /grant execute[^;]*to anon/i);
});

test('l’administration additionne la base et le Storage, et le dit dans l’infobulle', () => {
  const js = lire('assets/js/admin.js');

  assert.match(js, /function mesurerQuotaReel\(/, 'mesure réelle isolée dans une fonction');
  assert.match(js, /sb\.rpc\("admin_taille_base"\)/);
  assert.match(js, /sb\.rpc\("admin_taille_stockage"\)/);

  /* La somme des deux mesures alimente l'affichage. */
  assert.match(js, /var total = base \+ stockage;/);
  assert.match(js, /majAffichageQuotaSupabase\(total, nbP, nbA, true,/);

  /* La répartition est conservée puis affichée. */
  assert.match(js, /base: detail && typeof detail\.base === "number"/);
  assert.match(js, /stockage: detail && typeof detail\.stockage === "number"/);
  assert.match(js, /"mesuré : base "/);
  assert.match(js, /" \+ fichiers "/);

  /* Si la seconde mesure échoue (migration absente), on retombe sur la base
     et l'interface l'annonce au lieu de faire croire à une mesure complète. */
  assert.match(js, /appliquer\(base, 0, false\)/);
  assert.match(js, /" \(Storage non mesuré\)"/);

  /* Une seule mesure toutes les 10 minutes : pas d'appel à chaque rendu. */
  assert.match(js, /Date\.now\(\) - dernierRpcQuotaTs > 600000/);
});

test('la nouvelle mesure est servie avec un cache-buster et une révision à jour', () => {
  const admin = lire('admin.html');
  const sw = lire('sw.js');

  /* v560 : admin.js change encore (bascule automatique des photos base64),
     le cache-buster et les deux révisions suivent. */
  assert.match(admin, /assets\/js\/admin\.js\?v=575-perf/);
  assert.match(sw, /url: "\.\/admin\.html", revision: "photo-secours-v562"/);
  assert.match(sw, /url: "\.\/assets\/js\/admin\.js", revision: "photo-secours-v562"/);
  /* Rappel : le cache et le lot général ne bougent pas. */
  assert.match(sw, /var UPDATE_ID = "v579-vitrine-sti-portail"/);
  assert.match(sw, /var CACHE = "sti-atelier-v386"/);
});
