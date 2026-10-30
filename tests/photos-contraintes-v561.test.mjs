/* v561 — les règles photo de la base acceptent le bucket, et restent alignées
   avec ce que le site sait afficher.
   ─────────────────────────────────────────────────────────────────────────
   Historique : la v559 rangeait les photos dans le bucket privé
   `photos-profils`, mais les contraintes v445 n'acceptaient que le base64.
   Toute écriture d'une URL signée était donc rejetée, en silence : les
   fichiers arrivaient dans le bucket, aucun profil ne pointait dessus, et
   le site retombait sur le base64. La v561 remplace les deux contraintes.

   Ce que ces tests protègent :
     1. le fichier de migration remplace bien les deux contraintes v445 ;
     2. le motif SQL accepte l'URL signée et refuse tout le reste
        (autre hôte, bucket public, espace, jeton absent) ;
     3. l'ancienne data URL reste acceptée, la borne de 64 Ko est conservée ;
     4. le motif de la base, celui de `sti_photo_url_valide()` et ceux des
        trois validateurs d'affichage (acces.js, admin.js, roue-initiales.js)
        acceptent et refusent exactement les mêmes valeurs — sinon on
        enregistre des photos que l'avatar refuse d'afficher ;
     5. la migration est documentée (LISEZ-MOI + README).
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (chemin) => readFileSync(join(root, chemin), 'utf8');

const SQL_V561 = 'supabase/migrations/20261102_photos_contraintes_v561.sql';
const SQL_V559 = 'supabase/migrations/20261101_photos_bucket_v559.sql';
const SQL_V445 = 'supabase/migrations/20261025_student_photos_v445.sql';

/* Échantillons communs : la base et le site doivent trancher pareil. */
const LIEN_BUCKET = 'https://vywujxmepvcbgedgmger.supabase.co/storage/v1/object/sign/' +
  'photos-profils/ebef1d05-68cc-4171-a5bb-ff8a7926af4a/35bf2d941fa1b478e6f096dbd08a2bd4.webp' +
  '?token=eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjIwMDAwMDAwMDB9.sig-ABC_123';
const BONNES = [
  LIEN_BUCKET,
  'https://abcdefghij.supabase.co/storage/v1/object/sign/photos-profils/00000000-0000-0000-0000-000000000000/a.webp?token=x.y-z_1'
];
const MAUVAISES = [
  'https://evil.example/storage/v1/object/sign/photos-profils/ebef/abc.webp?token=x',       // autre hôte
  'https://vywujxmepvcbgedgmger.supabase.co/storage/v1/object/public/photos-profils/e/a.webp?token=x', // bucket public
  'https://vywujxmepvcbgedgmger.supabase.co/storage/v1/object/sign/photos-profils/e/a b.webp?token=x', // espace
  'https://vywujxmepvcbgedgmger.supabase.co/storage/v1/object/sign/photos-profils/e/a.webp',           // sans jeton
  'https://vywujxmepvcbgedgmger.supabase.co/storage/v1/object/sign/autres-photos/e/a.webp?token=x',    // autre bucket
  'javascript:alert(1)',
  'data:text/html;base64,PHNjcmlwdD4='
];

/* Extrait le motif du bucket écrit dans le SQL de la v561. */
function motifBucketSql() {
  const sql = lire(SQL_V561);
  const m = sql.match(/'(\^https:\/\/[^']+)'/);
  assert.ok(m, 'motif de l’URL signée introuvable dans ' + SQL_V561);
  return m[1];
}

test('la v561 remplace les deux contraintes héritées de la v445', () => {
  assert.ok(existsSync(join(root, SQL_V561)), SQL_V561);

  const v561 = lire(SQL_V561);
  for (const nom of ['chk_profiles_photo_url_safe', 'chk_profiles_photo_attente_safe']) {
    assert.match(v561, new RegExp('drop constraint if exists ' + nom + ';'));
    assert.match(v561, new RegExp('add constraint ' + nom + ' check'));
  }
  /* La cause doit être écrite noir sur blanc : la v445 n'acceptait que base64. */
  const v445 = lire(SQL_V445);
  assert.match(v445, /photo_url ~ '\^data:image\/\(jpeg\|jpg\|png\|webp\);base64/);
  assert.ok(!/object\/sign/.test(v445), 'la v445 ne connaissait pas le bucket');

  /* Bornes conservées telles quelles. */
  assert.match(v561, /octet_length\(photo_url\) <= 65536/);
  assert.match(v561, /octet_length\(photo_attente\) <= 65536/);
  /* Ancien format toujours accepté : aucune photo existante ne casse. */
  assert.match(v561, /photo_url ~ '\^data:image\/\(jpeg\|jpg\|png\|webp\);base64,\[A-Za-z0-9\+\/=\]\+\$'/);
});

test('le motif SQL accepte l’URL signée et refuse tout le reste', () => {
  const motif = motifBucketSql();
  assert.ok(motif.includes('/storage/v1/object/sign/photos-profils/'), motif);
  assert.ok(!motif.includes('/object/public/'), 'le bucket doit rester privé');

  const re = new RegExp(motif, 'i'); /* même insensibilité à la casse que ~* */
  for (const bonne of BONNES) assert.ok(re.test(bonne), 'devrait accepter : ' + bonne);
  for (const mauvaise of MAUVAISES) assert.ok(!re.test(mauvaise), 'devrait refuser : ' + mauvaise);
});

test('la base, la RPC et les trois validateurs d’affichage tranchent pareil', () => {
  const reSql = new RegExp(motifBucketSql(), 'i');

  /* Le validateur de la RPC est réécrit par la v561 sur le même motif. */
  const v561 = lire(SQL_V561);
  assert.match(v561, /create or replace function public\.sti_photo_url_valide/);
  const motifsRpc = [...v561.matchAll(/!~\* '([^']+)'/g)].map((m) => m[1]);
  assert.equal(motifsRpc.length, 1, 'un seul motif de bucket dans la RPC');
  const reRpc = new RegExp(motifsRpc[0], 'i');

  /* La v559, elle, tolérait un espace : c'est ce que la v561 corrige. */
  assert.match(lire(SQL_V559), /photos-profils\/\[\^\?\]\+\[\?\]token/);

  /* Les trois validateurs d'affichage du site. */
  const validateurs = {
    'assets/js/acces.js': /RE_PHOTO_BUCKET_STI = (\/.+\/i);/,
    'assets/js/admin.js': /RE_PHOTO_BUCKET_ADMIN = (\/.+\/i);/,
    'assets/js/roue-initiales.js': /RE_PHOTO_BUCKET_ROUE = (\/.+\/i);/
  };

  const trancheurs = [['base (v561)', reSql], ['RPC (v559)', reRpc]];
  for (const [fichier, extraction] of Object.entries(validateurs)) {
    const source = lire(fichier);
    const m = source.match(extraction);
    assert.ok(m, 'validateur introuvable dans ' + fichier);
    /* Les expressions du site sont écrites en JS : on les évalue telles quelles. */
    trancheurs.push([fichier, eval(m[1])]); // eslint-disable-line no-eval
  }

  for (const [nom, re] of trancheurs) {
    for (const bonne of BONNES) assert.ok(re.test(bonne), nom + ' devrait accepter : ' + bonne);
    for (const mauvaise of MAUVAISES) assert.ok(!re.test(mauvaise), nom + ' devrait refuser : ' + mauvaise);
  }
});

test('la migration est documentée et le registre reste à jour', () => {
  const lisezMoi = lire('supabase/migrations/LISEZ-MOI.md');
  assert.match(lisezMoi, /20261102_photos_contraintes_v561\.sql/);

  const readme = lire('README.md');
  assert.match(readme, /v561/);
  assert.match(readme, /contrainte/i);
});
