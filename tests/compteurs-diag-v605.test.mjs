/* v605 — « Mes candidats affichent 00 alors qu'ils se connectent »
   ---------------------------------------------------------------------------
   Les trois mini-instruments d'une carte du tableau de bord (Connexions,
   Durée, Accès 24 h) sont calculés sur le journal `acces` CHARGÉ DANS LA PAGE
   et non sur la base entière. Un élève peut donc apparaître à zéro tout en
   étant « 🟢 En ligne » (la présence passe par le direct, sans écrire en base).

   Ces tests vérifient que le compteur explique son chiffre : au clic il
   interroge la base pour cet élève, compare avec ce que la page a en mémoire,
   et désigne la première étape qui tombe à zéro.
*/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const lire = (chemin) => readFileSync(new URL(`../${chemin}`, import.meta.url), 'utf8');
const adminJs = lire('assets/js/admin.js');
const adminHtml = lire('admin.html');
const sw = lire('sw.js');
const accesJs = lire('assets/js/acces.js');

test('v605 — le diagnostic des compteurs existe et reste appelable', () => {
  assert.match(adminJs, /function diagCompteursAbonne\(p\) \{/, 'fonction absente');
  assert.match(adminJs, /window\.__stiDiagCompteurs = diagCompteursAbonne;/, 'pas exposée');
});

test('v605 — un compteur à zéro s’explique au clic, sans ouvrir la fiche', () => {
  assert.match(
    adminJs,
    /function ajouterMiniInstrumentNoeud\(libelle, valeur, classeCss, titre, auClic\)/,
    'les instruments doivent accepter une action'
  );
  assert.match(adminJs, /evMini\.stopPropagation\(\); auClic\(\);/, 'le clic doit remonter au clic de la carte');
  assert.match(adminJs, /mini\.setAttribute\("role", "button"\)/, 'instruments cliquables annoncés aux lecteurs d’écran');
  assert.match(adminJs, /mini\.tabIndex = 0;/, 'instruments atteignables au clavier');
  assert.match(
    adminJs,
    /ajouterMiniInstrumentNoeud\("Connexions"[\s\S]{0,200}verifierNd\);/,
    'le compteur Connexions doit être cliquable'
  );
});

test('v605 — le diagnostic interroge la base pour cet élève précis', () => {
  assert.match(adminJs, /select\("id", \{ count: "exact", head: true \}\)\.eq\("user_id", p\.id\)/);
  assert.match(adminJs, /hors « PROG_MEDIA »/);
  assert.match(adminJs, /depuis 24 h/);
  assert.match(adminJs, /order\("id", \{ ascending: false \}\)\.limit\(5\)/, 'les 5 dernières lignes doivent être montrées');
});

test('v605 — le rapport distingue les trois pannes possibles', () => {
  assert.match(adminJs, /L'élève n'a AUCUNE ligne dans le journal/, 'cas « journal jamais écrit »');
  assert.match(adminJs, /Les lignes existent en base, mais la page n'en a chargé aucune/, 'cas « fenêtre de chargement »');
  assert.match(adminJs, /Les lignes sont chargées : le compteur affiché devrait suivre/, 'cas « affichage »');
});

test('v605 — la file hors-ligne lue est bien celle du module de journal', () => {
  const cle = /var CLE_FILE_OFFLINE = "([^"]+)"/.exec(accesJs);
  assert.ok(cle, 'clé de file hors-ligne introuvable dans acces.js');
  assert.ok(
    adminJs.includes(`localStorage.getItem("${cle[1]}")`),
    `le diagnostic doit lire la file « ${cle[1]} »`
  );
});

test('v605 — le rapport est lisible, copiable et refermable', () => {
  assert.match(adminJs, /Copier le rapport/);
  assert.match(adminJs, /setAttribute\("role", "dialog"\)/);
  assert.match(adminJs, /setAttribute\("aria-modal", "true"\)/);
  assert.match(adminJs, /evK\.key === "Escape"/, 'la touche Échap doit fermer');
});

test('v605 — la page d’administration charge la nouvelle version du script', () => {
  assert.match(adminHtml, /assets\/js\/admin\.js\?v=610-perf/);
});

test('v605 — la publication avance et le service worker reverra admin.js', () => {
  assert.match(sw, /var VERSION_PUBLIEE = "v610";/);
  assert.match(sw, /var PUBLIEE_LE = "2026-11-01T12:20:00Z";/);
  assert.match(sw, /v605-compteurs-expliques-20261101/);
  /* v606 : la version publiée avance, mais la révision d’admin.js reste celle de v605. */
  assert.match(sw, /\{ url: "\.\/assets\/js\/admin\.js", revision: "maj-visible-v610" \}/);
  assert.match(sw, /\{ url: "\.\/admin\.html", revision: "maj-visible-v610" \}/);
});
