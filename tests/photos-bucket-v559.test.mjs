/* v559 — les photos de profil quittent la base pour le bucket privé.
   ─────────────────────────────────────────────────────────────────────────
   Trois choses doivent tenir ensemble pour que la bascule soit sûre :

     1. la base accepte l'ancien format ET le nouveau, sinon les photos déjà
        enregistrées deviennent invisibles ;
     2. le navigateur sait déposer dans le bucket et retomber proprement sur
        l'ancien chemin si le dépôt échoue ;
     3. aucune page ne bloque l'affichage par une CSP trop stricte.

   Ce fichier vérifie les trois, et l'outil de migration réservé à
   l'administrateur.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (chemin) => readFileSync(join(root, chemin), 'utf8');

const SQL = 'supabase/migrations/20261101_photos_bucket_v559.sql';

test('le bucket photos-profils est privé, borné et protégé par quatre règles', () => {
  const sql = lire(SQL);

  assert.match(sql, /insert into storage\.buckets/i);
  assert.match(sql, /'photos-profils'/);
  /* Privé : aucun fichier lisible sans URL signée. */
  assert.match(sql, /values \('photos-profils', 'photos-profils', false,/);
  assert.match(sql, /on conflict \(id\) do update[\s\S]*?set public = false/);
  assert.match(sql, /file_size_limit/);
  assert.match(sql, /allowed_mime_types/);

  for (const politique of [
    'photos_profils_lecture',
    'photos_profils_depot',
    'photos_profils_maj',
    'photos_profils_suppression'
  ]) {
    assert.match(sql, new RegExp(`create policy ${politique} on storage\\.objects`), politique);
  }
  /* Chacun n'écrit que dans son dossier <uid>/, l'administrateur passe outre. */
  assert.match(sql, /\(storage\.foldername\(name\)\)\[1\] = auth\.uid\(\)::text/);
  assert.match(sql, /public\.est_admin\(\)/);
});

test('la base accepte les deux formats et refuse une URL inventée', () => {
  const sql = lire(SQL);

  /* Ancien format conservé : aucune photo existante ne doit disparaître. */
  assert.match(sql, /\^data:image\/\(jpeg\|jpg\|png\|webp\);base64,/);
  assert.match(sql, /octet_length\(v_clean\) <= 65536/);

  /* Nouveau format : URL signée du bucket uniquement. */
  assert.match(sql, /storage\/v1\/object\/sign\/photos-profils/);
  assert.match(sql, /\[\?\]token=/);

  /* Le dossier doit être celui de l'élève concerné… */
  assert.match(sql, /v_chemin !~ \('\^' \|\| p_uid::text/);

  /* …et le fichier doit exister pour de vrai. */
  assert.match(sql, /exists \(\s*select 1 from storage\.objects o/i);

  /* La fonction de validation n'est pas ouverte aux visiteurs anonymes. */
  assert.match(sql, /revoke all on function public\.sti_photo_url_valide\(text, uuid\) from anon/i);
});

test('les deux RPC photo gardent leur signature et passent par la validation commune', () => {
  const sql = lire(SQL);

  assert.match(sql, /create or replace function public\.eleve_proposer_photo\(p_data_url text default null\)/);
  assert.match(sql, /create or replace function public\.admin_gerer_photo_eleve\(/);
  assert.match(sql, /p_uid uuid,\s*\n\s*p_action text,\s*\n\s*p_data_url text default null/);

  /* Les deux appellent la même porte d'entrée. */
  const appels = sql.match(/public\.sti_photo_url_valide\(/g) || [];
  assert.ok(appels.length >= 3, 'validation commune appelée par les deux RPC et définie une fois');
});

test('le navigateur dépose dans le bucket et sait revenir à l’ancien chemin', () => {
  const js = lire('assets/js/acces.js');

  assert.match(js, /function deposerPhotoBucketSTI\(/, 'dépôt isolé dans une fonction');
  assert.match(js, /storage\.from\("photos-profils"\)\s*\n?\s*\.upload\(/);
  assert.match(js, /createSignedUrl\(chemin, TTL_PHOTO_BUCKET\)/);
  /* Repli explicite : si le bucket ne répond pas, on renvoie la data URL. */
  assert.match(js, /\.catch\(function \(\) \{\s*\n[\s\S]{0,220}?return deposer\(dataUrl\);/);
  /* Le chemin de dépôt suit la règle du bucket : <uid>/<aléatoire>.<ext>. */
  assert.match(js, /var chemin = uid \+ "\/" \+ jeton \+ "\." \+ ext;/);
});

test('les trois validateurs d’affichage acceptent les deux formats et coupent les liens expirés', () => {
  const fichiers = {
    'assets/js/acces.js': 'photoUrlSureSTI',
    'assets/js/admin.js': 'dataUrlSureAdmin',
    'assets/js/roue-initiales.js': 'photoValide'
  };
  for (const [fichier, fonction] of Object.entries(fichiers)) {
    const js = lire(fichier);

    assert.match(js, new RegExp(`function ${fonction}\\(`), fichier);
    /* Motif d'URL signée du bucket. */
    assert.match(js, /storage\\\/v1\\\/object\\\/sign\\\/photos-profils/, `${fichier} : motif d’URL signée`);
    /* Lecture de l'expiration du jeton, pour ne jamais afficher une image cassée. */
    assert.match(js, /typeof j\.exp === "number"/, `${fichier} : contrôle d’expiration`);
    assert.match(js, /j\.exp \* 1000 <= Date\.now\(\)/, `${fichier} : comparaison à l’instant présent`);
    /* L'ancien format base64 reste accepté. */
    assert.match(js, /data:image\\\/\(jpeg\|jpg\|png\|webp\);base64/, `${fichier} : ancien format conservé`);
  }
});

test('aucune page ne bloque les photos du bucket par sa CSP', () => {
  const fautives = [];
  (function parcourir(dir) {
    for (const nom of readdirSync(dir)) {
      if (nom === '.git' || nom === 'node_modules') continue;
      const chemin = join(dir, nom);
      if (statSync(chemin).isDirectory()) { parcourir(chemin); continue; }
      if (!nom.endsWith('.html')) continue;
      const texte = readFileSync(chemin, 'utf8');
      const m = /img-src ([^;]*);/.exec(texte);
      if (!m) continue;
      if (!m[1].includes('vywujxmepvcbgedgmger.supabase.co')) fautives.push(chemin.replace(root, '.'));
    }
  })(root);
  assert.deepEqual(fautives, [], 'pages dont la CSP interdirait l’affichage des photos du bucket');
});

test('l’outil de migration est réservé à l’administrateur et reste réversible', () => {
  const page = lire('migration-photos-bucket.html');

  /* Garde : sans session administrateur, la page se remplace par un refus. */
  assert.match(page, /function sessionAdmin\(\)/);
  assert.match(page, /if \(!sessionAdmin\(\)\)/);
  assert.match(page, /Accès refusé/);

  assert.match(page, /from\("profiles"\)\.select\("id,nom,prenom,photo_url"\)/);
  assert.match(page, /estDataUrl/);

  /* Sauvegarde avant modification : la migration doit être réversible. */
  assert.match(page, /JSON\.stringify\(lot, null, 2\)/);
  assert.match(page, /a\.download = "sauvegarde-photos-/);

  /* Migration une photo à la fois, sans arrêt sur échec. */
  assert.match(page, /function migrerUne\(photo\)/);
  assert.match(page, /admin_gerer_photo_eleve/);
  assert.match(page, /p_action: "definir"/);

  /* CSP de la page elle-même. */
  assert.match(page, /img-src[^;]*vywujxmepvcbgedgmger\.supabase\.co/);
  assert.match(page, /connect-src[^;]*vywujxmepvcbgedgmger\.supabase\.co/);
});
