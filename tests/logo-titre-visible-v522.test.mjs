import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const racine = resolve(new URL('..', import.meta.url).pathname);
const lire = chemin => readFileSync(resolve(racine, chemin), 'utf8');

const css = lire('assets/css/theme.css');
const sw = lire('sw.js');

/* Consigne auteur (v522) : « le texte STI V2.0 à côté du logo en haut doit être
   toujours visible ». Aucun point de rupture ne doit donc le masquer. */
test('v522 : le titre « STI V2.0 » de l’en-tête n’est jamais masqué', () => {
  /* Aucune règle, dans aucun média, ne cache le titre du bandeau supérieur. */
  const reglesTitre = [...css.matchAll(/([^{}]*\.site-header[^{}]*\.brand-logo__title[^{}]*)\{([^}]*)\}/g)];
  assert.ok(reglesTitre.length > 0, 'la mise en forme mobile du titre doit exister');
  for (const [, selecteur, corps] of reglesTitre) {
    assert.doesNotMatch(corps, /display\s*:\s*none/, 'règle fautive :' + selecteur.trim());
    assert.doesNotMatch(corps, /visibility\s*:\s*hidden/, 'règle fautive :' + selecteur.trim());
    assert.doesNotMatch(corps, /font-size\s*:\s*0(?![.\d])/, 'règle fautive :' + selecteur.trim());
  }
  /* L'ancienne règle v503 a bien disparu. */
  assert.doesNotMatch(css, /\.site-header \.brand-logo__title\s*\{\s*display:\s*none/);
});

test('v522 : sur mobile le titre reste affiché, compact, et l’en-tête peut se resserrer', () => {
  const debut = css.indexOf('@media (max-width: 540px)');
  const fin = css.indexOf('@media (max-width: 370px)');
  assert.ok(debut > 0 && fin > debut, 'les deux points de rupture mobile doivent exister');
  const mobile = css.slice(debut, fin);

  /* Titre visible, taille lisible, largeur plafonnée pour ne jamais pousser la barre. */
  assert.match(mobile, /\.brand-logo__title \{\s*display: block;/,
    'le titre doit être affiché sur mobile');
  const taille = mobile.match(/\.brand-logo__title \{[^}]*font-size: ([\d.]+)rem/);
  assert.ok(taille, 'une taille de police mobile pour le titre est attendue');
  assert.ok(Number(taille[1]) >= 0.72, 'le titre doit rester lisible (>= 0,72 rem)');
  assert.match(mobile, /\.brand-logo__title \{[^}]*max-width: \d+px;/, 'largeur plafonnée attendue');
  /* Le bloc identité accepte de se réduire : plus de débordement, ellipse en dernier recours. */
  assert.match(mobile, /\.site-header \.brand-logo \{ flex: 0 1 auto;/, 'le bloc logo doit pouvoir se resserrer');
  assert.match(mobile, /\.site-header \.brand-logo \{ flex: 0 1 auto;[^}]*min-width: 0;/, 'min-width: 0 attendu');
});

test('v522 : sur les téléphones très étroits, les vignettes se réduisent avant le texte', () => {
  const debut = css.indexOf('@media (max-width: 370px)');
  const fin = css.indexOf('@media (min-width: 1060px) and (max-width: 1200px)', debut);
  assert.ok(debut > 0 && fin > debut, 'le point de rupture 370 px doit exister');
  const etroit = css.slice(debut, fin);
  assert.match(etroit, /\.brand-logo__drapeau,\s*body\.sti-v2 \.site-header \.brand-logo__mark \{\s*width: 26px;\s*height: 26px;/,
    'le drapeau et le logo passent à 26 px');
  assert.match(etroit, /\.brand-logo__title \{ font-size: 0\.72rem;/, 'le titre reste affiché en 0,72 rem');
  assert.doesNotMatch(etroit, /\.brand-logo__title \{[^}]*display: none/, 'jamais de masquage, même très étroit');
});

test('v522 : les sept pages à bandeau portent bien le titre à côté du logo', () => {
  const pages = ['index.html', 'dashboard.html', 'cours/html5.html', 'cours/css3.html',
    'cours/javascript.html', 'cours/sql.html', 'cours/php.html'];
  for (const page of pages) {
    const html = lire(page);
    assert.match(html, /<span class="brand-logo__title">STI V2\.0<\/span>/, page + ' : titre attendu');
    assert.ok(html.indexOf('brand-logo__mark') < html.indexOf('brand-logo__title'),
      page + ' : le titre vient après le logo, à sa droite');
    assert.ok(html.indexOf('brand-logo__drapeau') < html.indexOf('brand-logo__title'),
      page + ' : le drapeau reste à gauche du bloc');
  }
});

test('v522 : le nouveau style de l’en-tête est livré hors ligne et son empreinte est exacte', () => {
  assert.match(sw, /var UPDATE_ID = "v545-boucles-media-20261030"/);
  const delta = sw.split('var UPDATE_FILES = [')[1].split('];')[0];
  assert.match(delta, /url: "\.\/assets\/css\/theme\.css", revision: "classe-nav-v536"/);
  for (const bloc of ['SHELL', 'OFFLINE_LIST']) {
    assert.ok(sw.split('var ' + bloc + ' = [')[1].split('];')[0].includes('"./assets/css/theme.css"'), bloc);
  }
  const manifeste = JSON.parse(lire('offline-complete-manifest.json'));
  assert.equal(manifeste.version, 'v545-sti-atelier-v380');
  const entree = manifeste.files.find(f => f.path === 'assets/css/theme.css');
  assert.ok(entree, 'theme.css doit figurer dans le manifeste complet');
  const data = readFileSync(resolve(racine, 'assets/css/theme.css'));
  assert.equal(entree.bytes, data.length);
  assert.equal(entree.gitSha,
    createHash('sha1').update(`blob ${data.length}`).update(Buffer.from([0])).update(data).digest('hex'));
  assert.equal(manifeste.totalFiles, manifeste.files.length);
  assert.equal(manifeste.totalBytes, manifeste.files.reduce((n, f) => n + f.bytes, 0));
});
