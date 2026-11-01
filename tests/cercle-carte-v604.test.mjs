/*
  v604 — décision de mise en forme du badge de compte :
      • sur téléphone  : un CERCLE de 40 px (photo, sinon initiales, sinon cadenas) ;
      • sur ordinateur : la CARTE d'identité complète (210 × 64, nom + classe + QR).

  Le cercle libère la place nécessaire pour que le drapeau, le logo, « STI V2.0 »,
  la loupe, les trois modes d'affichage, le compte et le menu tiennent sur UNE
  seule ligne. Le nom et la classe ne sont pas perdus : ils restent dans le
  panneau qui s'ouvre au clic, et dans l'annonce vocale du bouton.

  Le test vérifie aussi que les modules arrivent bien à jour sur les appareils :
  `config.js` → `mobile-nav.js?v=604` → `roue-initiales.js?v=604`, et les
  révisions du service worker.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (chemin) => readFileSync(join(root, chemin), 'utf8');

const BADGE = lire('assets/css/badge-compte.css');
const THEME = lire('assets/css/theme.css');
const APP = lire('assets/js/app.js');
const CONFIG = lire('assets/js/config.js');
const NAV = lire('assets/js/mobile-nav.js');
const ROUE = lire('assets/js/roue-initiales.js');
const SW = lire('sw.js');

/* Isole un bloc média complet (de son ouverture à l'accolade fermante). */
function bloc(css, entete) {
  const debut = css.indexOf(entete);
  assert.ok(debut > -1, 'bloc introuvable : ' + entete);
  let i = css.indexOf('{', debut), profondeur = 0;
  for (let j = i; j < css.length; j++) {
    if (css[j] === '{') profondeur++;
    else if (css[j] === '}') { profondeur--; if (profondeur === 0) return css.slice(debut, j + 1); }
  }
  throw new Error('accolades non équilibrées : ' + entete);
}

test('v604 : cercle sur téléphone — la carte se replie au bon palier', () => {
  const mobile = bloc(BADGE, '@media (max-width: 700px) {\n  #sti-roue-anneau');
  assert.match(mobile, /width: 40px !important/, 'le cercle fait 40 px');
  assert.match(mobile, /height: 40px !important/, 'et il est aussi haut que large');
  assert.match(mobile, /border-radius: 50% !important/, 'il est parfaitement rond');
  assert.match(mobile, /\.sti-badge-identite__fond,[\s\S]{0,120}display: none !important/,
    'le QR de fond disparaît');
  assert.match(mobile, /\.sti-badge-identite__copie \{ display: none !important; \}/,
    'le nom et la classe passent dans le panneau');
  assert.match(mobile, /\.sti-badge-identite__avatar \{[\s\S]{0,160}width: 32px/,
    'la photo ou les initiales remplissent le cercle');

  /* Deux paliers de plus pour les écrans très étroits. */
  assert.match(bloc(BADGE, '@media (max-width: 460px) {\n  #sti-roue-anneau'), /width: 32px !important/);
  assert.match(bloc(BADGE, '@media (max-width: 370px) {\n  #sti-roue-anneau'), /width: 28px !important/);
});

test('v604 : carte complète sur ordinateur, avec son QR au survol', () => {
  /* La carte d'origine reste la référence au-dessus de 700 px. */
  assert.match(BADGE, /width: 210px !important;[\s\S]{0,80}height: 64px !important/,
    'la carte mesure 210 × 64 px');
  assert.match(BADGE, /#sti-roue-anneau\.sti-badge-identite__anneau,[\s\S]{0,260}border-radius: 14px !important/,
    'elle garde ses angles de carte, pas un cercle');

  const ordinateur = bloc(BADGE, '@media (min-width: 701px) {');
  assert.match(ordinateur, /\.sti-badge-identite__copie::after/, 'le QR s’agrandit au survol');

  /* Aucun repli ne doit masquer le nom sur ordinateur : les règles qui le font
     sont toutes enfermées dans un média « max-width: 700px ». */
  for (const morceau of BADGE.split('@media (min-width: 701px) {')) {
    assert.doesNotMatch(morceau.slice(0, morceau.indexOf('}')), /__copie \{ display: none/);
  }
  assert.match(BADGE, /\.sti-badge-identite__copie \{ position: relative; display: grid/,
    'sur ordinateur, le nom et la classe sont affichés');
});

test('v604 : les modules du badge arrivent à jour sur les appareils', () => {
  assert.match(CONFIG, /mobile-nav\.js\?v=604/, 'config.js charge la barre mobile en v604');
  assert.match(NAV, /roue-initiales\.js\?v=604/, 'la barre mobile charge la roue en v604');
  assert.match(SW, /url: "\.\/assets\/js\/mobile-nav\.js", revision: "cercle-carte-v604"/);
  assert.match(SW, /url: "\.\/assets\/js\/config\.js", revision: "cercle-carte-v604"/);
  assert.match(SW, /url: "\.\/assets\/js\/roue-initiales\.js", revision: "cercle-carte-v604"/);
  assert.match(SW, /url: "\.\/assets\/css\/badge-compte\.css", revision: "cercle-carte-v604"/);
});

test('v604 : le nom reste annoncé même quand la carte est un cercle', () => {
  const appliquer = ROUE.slice(ROUE.indexOf('function appliquer'), ROUE.indexOf('function ', ROUE.indexOf('function appliquer') + 10));
  assert.match(appliquer, /aria-label/, 'le bouton porte une annonce complète');
  assert.match(appliquer, /nomComplet \+ " " \+ classe/, 'elle contient le nom et la classe');
  assert.match(appliquer, /ouvrir mon compte/, 'et l’action');
});

test('v604 : sans compte connecté, le cercle montre les initiales du profil local', () => {
  const blocInit = APP.slice(APP.indexOf('function initialesBadgeCompte'), APP.indexOf('function rendreBadgeAbonne'));
  assert.match(blocInit, /chargerProfil/, 'le prénom du profil local est utilisé');
  assert.match(blocInit, /prenom\.charAt\(0\) \+ nom\.charAt\(0\)/, 'prénom + nom quand le nom est connu');

  /* Le repli (élève non connecté) est un cercle, pas une pilule de texte. */
  assert.match(THEME, /\.sub-login-btn \{[\s\S]{0,300}border-radius: var\(--radius-full\)/);
  assert.match(THEME, /\.sub-login-btn__photo,[\s\S]{0,160}border-radius: var\(--radius-full\)/,
    'la photo est ronde');
  assert.match(THEME, /\.sub-login-btn__initiales \{[\s\S]{0,120}font-weight: 800/,
    'les initiales sont lisibles');
});

test('v604 : la version publiée et le cache avancent', () => {
  assert.match(SW, /var VERSION_PUBLIEE = "v(?:6(?:1[1-9]|[2-9]\d)|[7-9]\d\d)";/);
  assert.match(SW, /url: "\.\/offline-complete-manifest\.json", revision: "compteurs-zero-v612"/);
});
