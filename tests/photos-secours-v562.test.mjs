/* v562 — une photo manquante ne doit jamais s'afficher comme une image cassée.
   ─────────────────────────────────────────────────────────────────────────
   Ce qui s'est passé le 30 octobre 2026 : les cinq fichiers du bucket
   `photos-profils` ont été supprimés depuis la console Supabase, alors que
   quatre profils pointaient encore dessus. Le tableau de bord affichait donc
   des images cassées — le pire des affichages : on ne sait pas si la photo
   est absente, en cours de chargement ou si le site est en panne.

   La v559 prévoyait déjà le cas d'une URL signée expirée. Elle ne prévoyait
   pas le cas d'un fichier disparu : le format de l'URL reste valide, seule
   l'image est introuvable. Le navigateur émet alors un événement `error` sur
   l'élément <img>.

   Les trois fichiers qui affichent un avatar reçoivent donc une écoute
   déléguée unique : si l'image échoue et qu'elle vient du bucket, elle est
   remplacée par les initiales du nom, sans icône cassée ni alerte.

   Ce que ces tests protègent :
     1. la garde existe dans les trois fichiers, et seulement pour le bucket ;
     2. elle remplace l'image au lieu de la cacher ;
     3. les initiales sont justes (accents, nom unique, nom vide) ;
     4. le nom est cherché dans data-nom, puis alt, puis le conteneur.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (chemin) => readFileSync(join(root, chemin), 'utf8');

const CIBLES = [
  ['assets/js/admin.js', 'Admin'],
  ['assets/js/acces.js', 'STI'],
  ['assets/js/roue-initiales.js', 'Roue']
];

/* Exécute la seule fonction pure de la garde, extraite du fichier livré. */
function chargerInitiales(fichier, suffixe) {
  const source = lire(fichier);
  const debut = source.indexOf('function initialesPhotoSecours' + suffixe + '(nom)');
  const fin = source.indexOf('function nomDepuisImage' + suffixe + '(img)', debut);
  assert.ok(debut >= 0 && fin > debut, 'garde introuvable dans ' + fichier);
  const contexte = { String };
  vm.createContext(contexte);
  vm.runInContext(source.slice(debut, fin) + '\nthis.init = initialesPhotoSecours' + suffixe + ';', contexte);
  return contexte.init;
}

test('la garde existe dans les trois fichiers qui affichent un avatar', () => {
  for (const [fichier, suffixe] of CIBLES) {
    const source = lire(fichier);

    assert.match(source, new RegExp('function initialesPhotoSecours' + suffixe + '\\(nom\\)'), fichier);
    assert.match(source, new RegExp('function nomDepuisImage' + suffixe + '\\(img\\)'), fichier);

    /* Écoute déléguée en phase de capture : elle voit les images créées après
       le chargement de la page, ce qui est le cas de tous les avatars. */
    assert.match(source, /document\.addEventListener\("error", function \(ev\) \{/, fichier);
    assert.match(source, /\}, true\);/, fichier);

    /* Uniquement les photos du bucket : jamais un logo, une icône ou un favicon. */
    const brute = source.split('\n').find((l) => l.includes('storage') && l.includes('.test(src)) return;'));
    assert.ok(brute, fichier + ' : filtre d’origine absent');
    const debutRe = brute.indexOf('if (!') + 5;
    const finRe = brute.indexOf('/.test(src)');
    assert.ok(debutRe > 4 && finRe > debutRe, fichier + ' : filtre illisible');
    const re = eval(brute.slice(debutRe, finRe + 1)); // eslint-disable-line no-eval
    assert.ok(re.test('https://abc.supabase.co/storage/v1/object/sign/photos-profils/x/y.webp?token=t'));
    assert.ok(re.test('https://abc.supabase.co/storage/v1/object/public/photos-profils/x/y.webp'));
    assert.ok(!re.test('assets/icons/sti-icon-512.png'));
    assert.ok(!re.test('https://abc.supabase.co/storage/v1/object/sign/autres/e/a.webp?token=t'));

    /* Remplacement, pas masquage : l'élève garde sa place dans la grille. */
    assert.match(source, /img\.parentNode\.replaceChild\(secours, img\)/, fichier);
    assert.match(source, /secours\.textContent = initialesPhotoSecours/, fichier);
    /* Accessible : un lecteur d'écran annonce une photo indisponible. */
    assert.match(source, /secours\.setAttribute\("aria-label", "Photo indisponible"\)/, fichier);
  }
});

test('les initiales sont justes, accents compris', () => {
  for (const [fichier, suffixe] of CIBLES) {
    const initiales = chargerInitiales(fichier, suffixe);
    assert.equal(initiales('Ahmed Aich'), 'AA', fichier);
    assert.equal(initiales('Youssef'), 'Y', fichier);
    assert.equal(initiales('Élise Müller'), 'ÉM', fichier);
    assert.equal(initiales('  '), '?', fichier);
    assert.equal(initiales(null), '?', fichier);
    /* Un identifiant technique ne doit pas produire « 4E » ou « _ » : seules
       les lettres et les chiffres sont retenus. */
    assert.equal(initiales('4eme SI2'), '4S', fichier);
    assert.equal(initiales('prof-prof'), 'PP', fichier);
  }
});

test('le nom est cherché dans data-nom, puis alt, puis le conteneur', () => {
  for (const [fichier, suffixe] of CIBLES) {
    const source = lire(fichier);
    const debut = source.indexOf('function nomDepuisImage' + suffixe + '(img)');
    const fin = source.indexOf('/* Écoute unique et déléguée', debut);
    assert.ok(debut >= 0 && fin > debut, fichier);
    const corps = source.slice(debut, fin);

    const ordreData = corps.indexOf('"data-nom"');
    const ordreAlt = corps.indexOf('"alt"');
    const ordreConteneur = corps.indexOf('img.closest');
    assert.ok(ordreData >= 0 && ordreAlt > ordreData && ordreConteneur > ordreAlt,
      fichier + ' : ordre de recherche inattendu');
    /* Le texte du conteneur est borné pour ne pas aspirer toute la ligne. */
    assert.match(corps, /slice\(0, 40\)/, fichier);
  }
});
