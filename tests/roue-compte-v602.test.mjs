/*
  v602 — le badge de compte devient une roue, et l'en-tête tient sur une ligne.

  Sur la capture du 31/10, l'en-tête du téléphone occupait deux lignes : la
  première avec le drapeau, le logo, « STI … », la loupe, les trois boutons de
  thème et le menu ; la seconde avec une pilule violette « Compte » de la
  largeur de l'écran.

  Décision : le badge devient un cercle de la taille des autres boutons, qui
  contient la photo de l'élève, sinon la première lettre du prénom et la
  première lettre du nom. Tout l'en-tête tient alors sur une seule ligne, et la
  carte d'identité complète (nom, classe, QR) reste dans le panneau du compte.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (chemin) => readFileSync(join(root, chemin), 'utf8');

const CSS = lire('assets/css/theme.css');
const BADGE = lire('assets/css/badge-compte.css');
const APP = lire('assets/js/app.js');
const SW = lire('sw.js');
const PROFIL = lire('assets/js/profil.js');

test('v602 : le badge de compte est un cercle, photo ou initiales', () => {
  const regle = CSS.match(/\.sub-login-btn \{([^}]*)\}/)[1];
  assert.match(regle, /width:\s*36px/, 'largeur de cercle');
  assert.match(regle, /height:\s*36px/, 'hauteur identique : le badge est rond');
  assert.match(regle, /border-radius:\s*var\(--radius-full\)/, 'forme entièrement arrondie');
  assert.match(regle, /padding:\s*0/, 'aucun rembourrage : le contenu remplit le cercle');
  assert.match(regle, /overflow:\s*hidden/, 'la photo ne déborde pas du cercle');

  assert.match(CSS, /\.sub-login-btn__photo \{[^}]*object-fit:\s*cover/, 'la photo remplit le cercle sans se déformer');
  assert.match(CSS, /\.sub-login-btn__photo,[\s\S]{0,220}border-radius:\s*var\(--radius-full\)/, 'photo et initiales sont rondes');
  assert.match(CSS, /\.sub-login-btn__initiales \{[^}]*font-weight:\s*800/, 'les initiales sont bien lisibles');
});

test('v602 : photo si elle existe, sinon prénom + nom, sinon cadenas', () => {
  const debut = APP.indexOf('function photoBadgeCompte');
  assert.ok(debut > -1, 'la lecture de la photo existe');
  const bloc = APP.slice(debut, APP.indexOf('function rendreBadgeAbonne'));

  assert.match(bloc, /STIProfil\.photoCompte/, 'la photo est demandée au profil');
  assert.match(bloc, /__stiPhotoUrlSure/, 'elle passe par le contrôle des liens signés');
  assert.doesNotMatch(APP, /localStorage\s*\./, 'app.js ne touche jamais au stockage du navigateur');
  assert.match(PROFIL, /function photoCompte\(\)[\s\S]{0,320}sti-session-cache/,
    'le profil lit la photo dans le cache de session');
  assert.match(PROFIL, /photo_url \|\| cacheAcces\.photo_attente/, 'la photo en attente de validation est acceptée');
  assert.match(PROFIL, /photoCompte: photoCompte/, 'la photo est exposée par STIProfil');
  assert.match(bloc, /https:/, 'les liens https sont acceptés');
  assert.match(bloc, /data:image/, 'les images déjà encodées sont acceptées');

  assert.match(bloc, /\(prenom\.charAt\(0\) \+ nom\.charAt\(0\)\)\.toUpperCase\(\)/,
    'première lettre du prénom + première lettre du nom');
  assert.match(bloc, /morceaux\[0\]\.charAt\(0\) \+ morceaux\[1\]\.charAt\(0\)/,
    'un prénom composé donne aussi deux initiales');
  assert.match(bloc, /return "";/, 'sans prénom connu, aucune initiale inventée');

  const rendu = APP.slice(APP.indexOf('var photo = photoBadgeCompte(etat)'), APP.indexOf('function initialiserClicBadgeAbonne'));
  assert.match(rendu, /class="sub-login-btn__photo"/, 'la photo est posée dans le cercle');
  assert.match(rendu, /class="sub-login-btn__initiales"/, 'les initiales remplacent la photo');
  assert.match(rendu, /🔐/, 'le cadenas reste le dernier recours');
  assert.match(rendu, /aria-label="' \+ echapperHtml\(texte\)/, 'le cercle reste annoncé par les lecteurs d’écran');
});

test('v602 : tout l’en-tête tient sur une seule ligne', () => {
  const bloc460 = CSS.slice(CSS.indexOf('tient sur UNE seule ligne'));
  assert.ok(bloc460, 'le commentaire de la v602 est présent');
  const extrait = bloc460.slice(0, 2200);

  assert.match(extrait, /\.site-header__inner \{[\s\S]{0,160}flex-wrap:\s*nowrap/, 'l’en-tête ne passe plus à la ligne');
  assert.match(extrait, /\.header-actions \{[\s\S]{0,200}flex-wrap:\s*nowrap/, 'les actions restent sur la même ligne');
  assert.match(extrait, /\[data-subscriber-slot\] \{[\s\S]{0,160}flex:\s*0 0 auto/, 'le compte n’occupe plus une ligne entière');
  assert.doesNotMatch(extrait, /flex: 0 0 100%/, 'plus de seconde ligne réservée au compte');
  assert.match(extrait, /\.search-trigger__label,[\s\S]{0,80}display:\s*none/, 'la recherche passe en icône seule');
  assert.match(extrait, /--header-height: 74px/, 'la hauteur d’en-tête suit la ligne unique');
});

test('v602 : à 320 px, l’en-tête reste sur une ligne sans rien perdre', () => {
  const marque = CSS.indexOf('téléphones très étroits (320–370 px). À cette largeur');
  assert.ok(marque > -1, 'le palier 320 px est documenté');
  const bloc = CSS.slice(marque, marque + 1600);

  assert.match(bloc, /@media \(max-width:\s*370px\)/, 'il vise les écrans de 320 à 370 px');
  /* Le sous-titre du lycée coûtait plus de largeur que le titre : il passe en
     lecture d'écran (le lien garde son aria-label complet). */
  assert.match(bloc, /\.brand-logo__sub\s*\{[\s\S]{0,220}clip-path:\s*inset\(50%\)/,
    'le sous-titre libère la place sans disparaître pour les lecteurs d’écran');
  assert.match(bloc, /\.brand-logo__title\s*\{[^}]*font-size:\s*0\.68rem/, 'le titre reste lisible');
  assert.match(bloc, /\.theme-switcher__btn\s*\{[^}]*width:\s*20px/, 'les trois modes d’affichage se resserrent');
  assert.match(bloc, /\.burger-btn\s*\{[^}]*width:\s*26px/, 'le menu se resserre');
  assert.match(bloc, /\.sub-login-btn\s*\{[^}]*width:\s*28px/, 'la roue du compte se resserre');

  /* Le cercle de la roue complète suit la même réduction. */
  const badge370 = BADGE.slice(BADGE.lastIndexOf('@media (max-width: 370px)'));
  assert.match(badge370, /width: 28px !important/, 'la roue complète tombe à 28 px');
  assert.match(badge370, /flex-basis: 24px/, 'l’avatar garde de la place pour deux initiales');
});

test('v602 : les initiales de la roue sont prénom + nom', () => {
  const roue = lire('assets/js/roue-initiales.js');
  const bloc = roue.slice(roue.indexOf('function initiales(c)'), roue.indexOf('function normaliser'));
  assert.match(bloc, /\(p \+ n\)\.toUpperCase\(\)/, '« Aymen Essouyah » donne « AE »');
  assert.doesNotMatch(bloc, /n \+ "\." \+ p/, 'plus de « E.A » inversé');
  assert.match(SW, /url: "\.\/assets\/js\/roue-initiales\.js", revision: "cercle-carte-v604"/);
});

test('v602 : la roue complète devient un cercle de 40 px sur téléphone', () => {
  const marque = BADGE.indexOf('le badge de compte redevient une ROULE');
  assert.ok(marque > -1, 'le bloc mobile du badge est documenté');
  const bloc = BADGE.slice(marque);
  assert.match(bloc, /@media \(max-width: 700px\)/, 'la règle vise les téléphones');
  assert.match(bloc, /width: 40px !important/, 'la carte de 210 px devient un cercle de 40 px');
  assert.match(bloc, /border-radius: 50% !important/, 'le badge est rond');
  assert.match(bloc, /\.sti-badge-identite__fond,[\s\S]{0,80}display: none !important/, 'le QR de fond disparaît');
  assert.match(bloc, /\.sti-badge-identite__copie \{ display: none !important; \}/, 'le nom et la classe passent dans le panneau');
  assert.match(bloc, /\.sti-badge-identite__avatar \{[\s\S]{0,120}width: 32px/, 'l’avatar (photo ou initiales) reste lisible');
});

test('v602 : la version publiée et le cache avancent', () => {
  assert.match(SW, /var VERSION_PUBLIEE = "v608";/, 'la version publiée passe à v602');
  assert.match(SW, /url: "\.\/assets\/css\/theme\.css", revision: "roue-compte-v602"/);
  assert.match(SW, /url: "\.\/assets\/js\/app\.js", revision: "roue-compte-v602"/);
  assert.match(SW, /url: "\.\/assets\/css\/badge-compte\.css", revision: "cercle-carte-v604"/);
});
