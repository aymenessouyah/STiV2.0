/*
  v587 — trois corrections signalées par le professeur :

  1. le tableau de bord affichait « v582 » alors que la plateforme était en v586 :
     le numéro venait du jeton de cache UPDATE_ID, qui ne bouge plus (il sert au
     delta hors ligne). Il vient désormais de VERSION_PUBLIEE, déclaré dans sw.js.
  2. à côté de ce numéro, la DATE ET L'HEURE de la dernière mise à jour, et
     seulement dans le tableau de bord d'administration.
  3. l'étiquette dorée « Capsule » s'échappait de sa carte : elle est en position
     absolue et les cartes de la vidéothèque (`.video-card`) n'étaient pas des
     repères de positionnement.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const lire = (p) => readFileSync(resolve(root, p), 'utf8');

/* Extrait une fonction déclarée dans un fichier source et la rend exécutable,
   pour la tester sans navigateur (comptage d'accolades, commentaires ignorés). */
function extraireFonction(source, nom) {
  const debut = source.indexOf('function ' + nom + '(');
  assert.ok(debut > 0, `fonction ${nom} introuvable`);
  let i = source.indexOf('{', debut), profondeur = 0;
  for (let j = i; j < source.length; j++) {
    const c = source[j];
    if (c === '{') profondeur++;
    else if (c === '}') { profondeur--; if (profondeur === 0) return source.slice(debut, j + 1); }
  }
  throw new Error('accolades non équilibrées pour ' + nom);
}

test('v587 : la publication affichée est déclarée dans sw.js, pas déduite du jeton de cache', () => {
  const sw = lire('sw.js');
  const mVersion = sw.match(/var VERSION_PUBLIEE = "v(\d+)";/);
  assert.ok(mVersion, 'VERSION_PUBLIEE doit être déclaré');
  assert.equal(Number(mVersion[1]), 591, 'la plateforme est en v591');

  const mDate = sw.match(/var PUBLIEE_LE = "([^"]+)";/);
  assert.ok(mDate, 'PUBLIEE_LE doit être déclaré');
  assert.match(mDate[1], /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/,
    'date ISO 8601 UTC (celle du commit de fusion)');
  assert.ok(!Number.isNaN(Date.parse(mDate[1])), 'date analysable par Date');

  /* Garde-fou : le jeton de cache et le nom du cache ne bougent pas, sinon les
     778 entrées de chaîne du delta seraient re-téléchargées en entier. */
  assert.match(sw, /var UPDATE_ID = "v582-journal-connexions";/);
  assert.match(sw, /var CACHE = "sti-atelier-v386";/);
});

test('v587 : le tableau de bord lit la publication AVANT le jeton de cache', () => {
  const js = lire('assets/js/admin.js');
  const iPub = js.indexOf('VERSION_PUBLIEE');
  const iUpd = js.indexOf('UPDATE_ID');
  assert.ok(iPub > 0 && iUpd > 0, 'les deux lectures doivent exister');
  assert.ok(iPub < iUpd, 'la publication est lue en premier');

  /* Le jeton ne doit plus repeindre le texte quand la publication est connue. */
  assert.match(js, /if \(!PUBLICATION_ADM\.num\) majTexteVersion\("v" \+ nUpdAdm\);/);
  assert.match(js, /if \(!PUBLICATION_ADM\.num && !estReloadAdm/);
  assert.match(js, /if \(versionAfficheePrioritaire \|\| PUBLICATION_ADM\.num\) return;/);
  /* Et la publication est mémorisée pour ne pas clignoter au rechargement. */
  assert.match(js, /localStorage\.setItem\("sti-version-publiee", String\(num\)\)/);
});

test('v587 : la date de mise à jour est formatée en jj/mm/aaaa hh:mm', () => {
  const js = lire('assets/js/admin.js');
  const fn = extraireFonction(js, 'formaterMajPublicationAdm');
  const formater = new Function('return ' + fn)();

  /* Heures locales : on construit la date attendue avec le même fuseau. */
  const iso = '2026-10-31T10:15:29Z';
  const d = new Date(iso);
  const deux = (n) => (n < 10 ? '0' : '') + n;
  const attendu = deux(d.getDate()) + '/' + deux(d.getMonth() + 1) + '/' + d.getFullYear() +
    ' ' + deux(d.getHours()) + ':' + deux(d.getMinutes());
  assert.equal(formater(iso), attendu);
  assert.match(formater(iso), /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);

  /* Jamais de date inventée : entrée vide ou illisible → chaîne vide. */
  assert.equal(formater(''), '');
  assert.equal(formater('pas une date'), '');
  assert.equal(formater(null), '');
});

test('v587 : la date apparaît à côté du numéro, et seulement dans le tableau de bord admin', () => {
  const admin = lire('admin.html');
  assert.match(admin,
    /<span class="badge-version"[^>]*id="badge-version-admin"[^>]*><span id="badge-version-texte-admin">Version V2\.0<\/span><span class="badge-version-date" id="badge-version-date-admin"><\/span><\/span>/,
    'la date est un emplacement dans la pastille, à côté du numéro');

  /* Régression attrapée avant livraison : écrire dans la pastille elle-même
     (textContent) effaçait l'emplacement de la date. */
  const js = lire('assets/js/admin.js');
  assert.match(js, /var elTexteVer = document\.getElementById\("badge-version-texte-admin"\);/);
  assert.ok(js.indexOf('if (elTexteVer) elTexteVer.textContent') < js.indexOf('else elBadgeVer.textContent'),
    'le numéro s’écrit dans son propre élément, pas dans la pastille');
  const css = admin.slice(admin.indexOf('.badge-version {'), admin.indexOf('.badge-version {') + 900);
  assert.match(css, /white-space: nowrap/, 'la pastille ne se coupe pas en deux lignes');
  assert.match(admin, /\.badge-version-date:empty \{ display: none; \}/,
    'aucune date = aucun espace vide');

  /* Le tableau de bord ÉLÈVE ne reçoit pas cette date : demande explicite. */
  const dash = lire('dashboard.html');
  assert.equal(dash.includes('badge-version-date'), false);
});

test('v587 : l’étiquette de la capsule ne peut plus échapper à sa carte', () => {
  const theme = lire('assets/css/theme.css');
  const blocVideoCard = theme.slice(theme.indexOf('.video-card {'), theme.indexOf('.video-card {') + 700);
  assert.match(blocVideoCard, /position: relative/,
    'la carte de la vidéothèque est le repère de son étiquette');

  /* Filet de base dans theme.css (chargée partout) : même si la feuille des
     capsules n'arrive pas — cache hors ligne ancien, page qui ne la charge pas —
     l'étiquette reste une pastille posée et ne tombe pas dans le flux. */
  assert.match(theme, /\.sti-etiquette-capsule \{[^}]*position: absolute;[^}]*inset-block-start: 8px;[^}]*inset-inline-start: 10px;[^}]*z-index: 5;[^}]*pointer-events: none;/s,
    'repli de positionnement dans theme.css');

  const capsules = lire('assets/css/capsules-vedettes.css');
  assert.match(capsules, /\.featured-video-card,\s*\n\.matiere-video-card,\s*\n\.video-card \{ position: relative; \}/,
    'les trois familles de cartes sont des repères, sans dépendre d’une classe');
  assert.match(capsules, /\.sti-etiquette-capsule \{[^}]*max-inline-size: calc\(100% - 12px\)/s,
    'l’étiquette est bornée à la largeur de sa carte');
  /* Filet de sécurité pour les cartes futures. */
  assert.match(capsules, /@supports selector\(:has\(\*\)\) \{[^}]*\.video-card:has\(\.sti-etiquette-capsule\) \{ position: relative; \}/s);

  /* Le balisage reste celui prévu par la v571 : l'étiquette précède la vignette. */
  const app = lire('assets/js/app.js');
  const modele = app.slice(app.indexOf('var signature = liste.map'));
  assert.ok(modele.indexOf('video-card__capsule') > 0);
  assert.ok(modele.indexOf('video-card__capsule') < modele.indexOf('video-card__thumb'),
    'l’étiquette précède la vignette');
});

test('v587 : la feuille des capsules est enfin rafraîchie chez les appareils installés', () => {
  const sw = lire('sw.js');
  const ligne = sw.split('\n').find((l) => l.includes('url: "./assets/css/capsules-vedettes.css"'));
  assert.ok(ligne, 'une révision propre est nécessaire, sinon rien ne se met à jour');
  assert.match(ligne, /revision: "quiz-sauvegarde-v590"/);

  /* Les trois pages qui chargent cette feuille portent le même cache-buster. */
  for (const page of ['index.html', 'cours/javascript.html', 'cours/php.html']) {
    assert.match(lire(page), /capsules-vedettes\.css\?v=587/, page);
  }
  const fixture = JSON.parse(lire('tests/fixtures/cache-busters.json'));
  assert.deepEqual(fixture.actifs['assets/css/capsules-vedettes.css'], ['587']);
});
