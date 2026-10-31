/* v560 — les photos historiques quittent la base sans qu'on ait à cliquer.
   ─────────────────────────────────────────────────────────────────────────
   La v559 avait préparé le bucket et un outil de migration manuel. Il restait
   des photos en base64 : personne n'ouvrait l'outil. La v560 branche donc une
   bascule automatique dans le tableau de bord.

   Ce que ces tests protègent, dans l'ordre d'importance :
     1. la bascule ne tourne que pour l'administrateur connecté et en ligne ;
     2. elle est bornée (5 photos par ouverture, une à la fois) ;
     3. une photo n'est remplacée qu'après dépôt réussi ET URL signée relue,
        la RPC d'administration vérifiant en base que le fichier existe ;
     4. un échec laisse la photo intacte ;
     5. rien ne touche aux photos en attente de validation ;
     6. le cache-buster, la révision du service worker et le test v558 suivent.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (chemin) => readFileSync(join(root, chemin), 'utf8');

const JS = 'assets/js/admin.js';

test('la bascule automatique est réservée à l’administrateur connecté et en ligne', () => {
  const js = lire(JS);

  assert.match(js, /function migrerPhotosBase64Admin\(\)/);
  assert.match(js, /if \(passePhotosV560 \|\| !sb \|\| !sb\.storage \|\| !navigator\.onLine\) return;/);

  /* L'appel n'a lieu que dans le bloc déjà gardé par la session administrateur. */
  const bloc = js.slice(js.indexOf('if (s && s.user && estAdminEmail(s.user.email) && navigator.onLine) {'));
  const appel = bloc.indexOf('migrerPhotosBase64Admin();');
  assert.ok(appel >= 0, 'la bascule est appelée au démarrage du tableau de bord');
  assert.ok(appel < bloc.indexOf('chargerDepuisCacheAdmin'), 'l’appel précède le chargement du tableau');

  /* Une seule passe par ouverture de page, même si l'onglet redevient visible. */
  assert.match(js, /var passePhotosV560 = false;/);
  assert.match(js, /passePhotosV560 = true;/);
});

test('la bascule est bornée et ne traite qu’une photo à la fois', () => {
  const js = lire(JS);

  assert.match(js, /var MAX_PHOTOS_PAR_PASSE_V560 = 5;/);
  assert.match(js, /\.limit\(MAX_PHOTOS_PAR_PASSE_V560\)/);
  /* Seules les anciennes data URLs sont candidates. */
  assert.match(js, /\.like\("photo_url", "data:image\/%"\)/);
  /* Boucle séquentielle : la photo suivante attend la fin de la précédente. */
  assert.match(js, /return migrerUnePhotoBase64Admin\(p\)\.then\(function \(\) \{/);
  assert.match(js, /\}\)\.then\(suivante\);/);
});

test('une photo n’est remplacée qu’après dépôt réussi et URL signée relue', () => {
  const js = lire(JS);
  const debut = js.indexOf('function migrerUnePhotoBase64Admin(profil)');
  const fin = js.indexOf('function migrerPhotosBase64Admin()', debut);
  assert.ok(debut >= 0 && fin > debut);
  const corps = js.slice(debut, fin);

  const ordreDeps = corps.indexOf('.upload(chemin');
  const ordreSigne = corps.indexOf('createSignedUrl(chemin');
  const ordreRpc = corps.indexOf('admin_gerer_photo_eleve');
  assert.ok(ordreDeps >= 0 && ordreDeps < ordreSigne && ordreSigne < ordreRpc,
    'dépôt, puis signature, puis mise à jour en base');
  assert.match(corps, /p_action: "definir"/);
  assert.match(corps, /if \(!url\) throw new Error\("URL signée absente"\);/);
  /* Le chemin déposé est bien dans le dossier de l'élève. */
  assert.match(corps, /var chemin = profil\.id \+ "\/" \+ jetonFichierAdmin\(\)/);
  /* Taille et formats alignés sur le bucket (2 Mo, JPEG/PNG/WebP). */
  const debutOctets = js.indexOf('function octetsDepuisDataUrlAdmin(dataUrl)');
  const finOctets = js.indexOf('function jetonFichierAdmin()', debutOctets);
  assert.ok(debutOctets >= 0 && finOctets > debutOctets);
  const decode = js.slice(debutOctets, finOctets);
  assert.match(decode, /octets\.length > 2097152/);
  assert.match(decode, /image\\\/\(\?:jpeg\|jpg\|png\|webp\)/);
});

test('un échec laisse la photo intacte et n’interrompt pas la passe', () => {
  const js = lire(JS);
  const debut = js.indexOf('function migrerPhotosBase64Admin()');
  const corps = js.slice(debut, js.indexOf('/* v447', debut));

  assert.match(corps, /\.catch\(function \(\) \{\s*echecs\+\+;/);
  assert.match(corps, /\.catch\(function \(\) \{ \/\* réseau ou droits/);
  /* Aucune écriture directe dans profiles : tout passe par la RPC contrôlée. */
  assert.ok(!/from\("profiles"\)\.update/.test(corps), 'pas d’écriture directe dans profiles');
});

test('les photos en attente de validation restent hors de la bascule', () => {
  const js = lire(JS);
  const debut = js.indexOf('/* v560 : bascule automatique');
  const fin = js.indexOf('/* v447', debut);
  assert.ok(debut >= 0 && fin > debut);
  const zone = js.slice(debut, fin);

  /* Le commentaire d'introduction cite photo_attente pour dire qu'on n'y touche
     pas ; on ne vérifie donc que le code : aucune affectation, aucune colonne
     demandée, aucune écriture directe. */
  const code = zone.slice(zone.indexOf('*/')).replace(/\/\*[^]*?\*\//g, '');
  assert.ok(!/photo_attente\s*(=|:)/.test(code), 'aucune écriture ni colonne photo_attente');
  assert.ok(!/\.update\(/.test(code), 'aucune écriture directe dans profiles');
});

test('cache-buster, révision du service worker et outil manuel restent cohérents', () => {
  const admin = lire('admin.html');
  const sw = lire('sw.js');
  const outil = lire('migration-photos-bucket.html');

  assert.match(admin, /assets\/js\/admin\.js\?v=575-perf/);
  assert.match(sw, /url: "\.\/admin\.html", revision: "publication-v587"/);
  assert.match(sw, /url: "\.\/assets\/js\/admin\.js", revision: "videos-admin-v587"/);
  /* Le cache et le lot général ne bougent pas. */
  assert.match(sw, /var UPDATE_ID = "v582-journal-connexions"/);
  assert.match(sw, /var CACHE = "sti-atelier-v386"/);

  /* L'outil manuel existe toujours : il sert à vérifier et à révoquer. */
  assert.match(outil, /function migrerUne\(photo\)/);
  assert.match(outil, /admin_gerer_photo_eleve/);
});

/* Essai de bout en bout du code réel : les fonctions sont extraites du fichier
   livré et exécutées contre un faux client Supabase, sans réseau. On vérifie
   le comportement, pas seulement le texte. */
async function executerBascule(profils, options = {}) {
  const js = lire(JS);
  const debut = js.indexOf('var TTL_PHOTO_BUCKET_ADMIN');
  const fin = js.indexOf('/* v447', debut);
  assert.ok(debut >= 0 && fin > debut, 'zone de bascule introuvable');
  const zone = js.slice(debut, fin);

  const journal = { uploads: [], signes: [], rpc: [], echecs: 0 };
  const fauxSb = {
    storage: {
      from(bucket) {
        return {
          upload(chemin, octets, opts) {
            if (options.echouerSur && chemin.indexOf(options.echouerSur) === 0) {
              journal.echecs++;
              return Promise.resolve({ error: { message: 'quota dépassé' } });
            }
            journal.uploads.push({ bucket, chemin, octets, opts });
            return Promise.resolve({ data: { path: chemin }, error: null });
          },
          createSignedUrl(chemin, ttl) {
            const url = 'https://vywujxmepvcbgedgmger.supabase.co/storage/v1/object/sign/' +
              bucket + '/' + chemin + '?token=jeton.signature.test';
            journal.signes.push({ chemin, ttl, url });
            return Promise.resolve({ data: { signedUrl: url }, error: null });
          }
        };
      }
    },
    from(table) {
      assert.equal(table, 'profiles');
      const requete = {
        colonnes: null, filtre: null, limite: null,
        select(c) { this.colonnes = c; return this; },
        like(colonne, motif) { this.filtre = [colonne, motif]; return this; },
        limit(n) { this.limite = n; return this; },
        then(resoudre, rejeter) {
          try {
            assert.deepEqual(this.filtre, ['photo_url', 'data:image/%']);
            assert.equal(this.limite, 5, 'la bascule ne demande jamais plus de 5 photos');
          } catch (e) { return Promise.reject(e).then(resoudre, rejeter); }
          return Promise.resolve({ data: profils.slice(0, this.limite), error: null }).then(resoudre, rejeter);
        },
        catch(rejeter) { return this.then(undefined, rejeter); },
        update() { throw new Error('écriture directe interdite'); }
      };
      return requete;
    },
    rpc(nom, args) {
      journal.rpc.push({ nom, args });
      return Promise.resolve({ data: { ok: true }, error: null });
    }
  };

  const fauxWindow = {
    crypto: { getRandomValues(tab) { for (let i = 0; i < tab.length; i++) tab[i] = 16 + i; return tab; } }
  };
  const fabrique = new Function('sb', 'navigator', 'window', 'atob', 'console',
    zone + '\nreturn { migrerPhotosBase64Admin: migrerPhotosBase64Admin };');
  const api = fabrique(fauxSb, { onLine: options.horsLigne !== true }, fauxWindow, atob, { info() {} });
  api.migrerPhotosBase64Admin();
  for (let i = 0; i < 60 && journal.rpc.length + journal.echecs < profils.length; i++) {
    await new Promise((r) => setTimeout(r, 10));
  }
  return journal;
}

const PHOTO_WEBP = 'data:image/webp;base64,' + Buffer.from('RIFFxxxxWEBP').toString('base64');
const PHOTO_JPEG = 'data:image/jpeg;base64,' + Buffer.from('JFIF-exemple').toString('base64');

test('bout en bout : chaque photo base64 est déposée puis remplacée par son URL signée', async () => {
  const journal = await executerBascule([
    { id: 'c9ea42a3-b050-4835-839d-f6756a7a9c03', photo_url: PHOTO_JPEG },
    { id: 'bd4b1aec-dca6-49d9-9807-e15a8d2125d1', photo_url: PHOTO_WEBP }
  ]);

  assert.equal(journal.uploads.length, 2, 'deux dépôts');
  assert.equal(journal.rpc.length, 2, 'deux mises à jour en base');

  /* Chaque fichier est dans le dossier de son élève, avec la bonne extension. */
  assert.ok(journal.uploads[0].chemin.startsWith('c9ea42a3-b050-4835-839d-f6756a7a9c03/'));
  assert.ok(journal.uploads[0].chemin.endsWith('.jpg'));
  assert.ok(journal.uploads[1].chemin.startsWith('bd4b1aec-dca6-49d9-9807-e15a8d2125d1/'));
  assert.ok(journal.uploads[1].chemin.endsWith('.webp'));
  assert.equal(journal.uploads[0].opts.contentType, 'image/jpeg');
  assert.equal(journal.uploads[1].opts.contentType, 'image/webp');
  assert.equal(journal.uploads[0].opts.upsert, false);

  /* Les octets déposés sont bien l'image décodée, pas le base64. */
  assert.equal(Buffer.from(journal.uploads[0].octets).toString(), 'JFIF-exemple');
  assert.equal(Buffer.from(journal.uploads[1].octets).toString(), 'RIFFxxxxWEBP');

  /* L'URL signée relue est exactement ce que la base accepte. */
  const attendu = /^https:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/sign\/photos-profils\/[^?]+[?]token=[A-Za-z0-9._%-]+$/;
  for (const mise of journal.rpc) {
    assert.equal(mise.nom, 'admin_gerer_photo_eleve');
    assert.equal(mise.args.p_action, 'definir');
    assert.match(mise.args.p_data_url, attendu);
    assert.ok(journal.signes.some((s) => s.url === mise.args.p_data_url), 'URL relue avant écriture');
    assert.equal(journal.signes.find((s) => s.url === mise.args.p_data_url).ttl, 315360000);
  }
});

test('bout en bout : un dépôt refusé laisse la photo intacte et n’arrête pas les suivantes', async () => {
  const journal = await executerBascule([
    { id: 'c9ea42a3-b050-4835-839d-f6756a7a9c03', photo_url: PHOTO_JPEG },
    { id: 'ebef1d05-68cc-4171-a5bb-ff8a7926af4a', photo_url: PHOTO_WEBP }
  ], { echouerSur: 'c9ea42a3-b050-4835-839d-f6756a7a9c03' });

  assert.equal(journal.echecs, 1, 'un seul refus');
  assert.equal(journal.rpc.length, 1, 'seule la photo saine est mise à jour');
  assert.equal(journal.rpc[0].args.p_uid, 'ebef1d05-68cc-4171-a5bb-ff8a7926af4a');
});

test('bout en bout : hors ligne, la bascule ne fait strictement rien', async () => {
  const journal = await executerBascule([{ id: 'x', photo_url: PHOTO_JPEG }], { horsLigne: true });
  assert.equal(journal.uploads.length, 0);
  assert.equal(journal.rpc.length, 0);
});
