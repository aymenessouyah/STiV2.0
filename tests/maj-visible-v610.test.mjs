/* v610 — deux signalements du professeur :
   « 1. V609 ne s'affiche pas — 2. l'heure de mise à jour est toujours fausse,
   il faut appliquer l'heure de GMT+1 ».
   ---------------------------------------------------------------------------
   1. La nouvelle version n'arrivait pas jusqu'à l'écran pour deux raisons :
      • le témoin anti-boucle de `controllerchange` était tiré du nom de cache
        « sti-atelier-v386 », qui ne change JAMAIS : après le premier
        rechargement de la session, tout rechargement ultérieur était bloqué ;
      • une page HTML servie du cache le restait indéfiniment, même après
        l'installation d'un nouveau service worker.
   2. L'heure de publication suivait le fuseau du poste. Un appareil réglé
      ailleurs affichait donc une heure fausse (parfois plusieurs heures dans
      le futur). Elle est désormais convertie en GMT+1 (Africa/Tunis).
*/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const lire = (chemin) => readFileSync(new URL(`../${chemin}`, import.meta.url), 'utf8');
const admin = lire('assets/js/admin.js');
const adminHtml = lire('admin.html');
const sw = lire('sw.js');

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

test('v610 — l’heure de mise à jour est convertie en GMT+1, quel que soit le poste', () => {
  const formater = new Function('return ' + extraireFonction(admin, 'formaterMajPublicationAdm'))();

  /* 09:45 UTC = 10:45 en Tunisie (GMT+1, sans heure d'été). */
  assert.equal(formater('2026-11-01T09:45:00Z'), '01/11/2026 10:45');
  /* Passage de minuit : 23:30 UTC = 00:30 le lendemain, à Tunis. */
  assert.equal(formater('2026-10-31T23:30:00Z'), '01/11/2026 00:30');
  /* Une heure d'hiver en Europe ne doit rien changer : GMT+1 toute l'année. */
  assert.equal(formater('2026-12-15T07:00:00Z'), '15/12/2026 08:00');
  assert.equal(formater('2026-07-15T07:00:00Z'), '15/07/2026 08:00');

  /* Jamais de date inventée. */
  assert.equal(formater(''), '');
  assert.equal(formater('pas une date'), '');
  assert.equal(formater(null), '');
});

test('v610 — le fuseau est nommé et affiché à côté de l’heure', () => {
  assert.match(admin, /var FUSEAU_MAJ_ADM = "Africa\/Tunis";/);
  assert.match(admin, /timeZone: FUSEAU_MAJ_ADM/);
  assert.match(admin, /quand \? "· " \+ quand \+ " \(GMT\+1\)" : ""/);
  assert.match(admin, /" · mise à jour du " \+ quand \+ " \(GMT\+1\)"/);
});

test('v610 — le rechargement n’est plus bloqué par le jeton de cache figé', () => {
  /* L'ancien verrou lisait « sti-version-installee » = sti-atelier-v386. */
  const bloc = admin.slice(admin.indexOf('if ("serviceWorker" in navigator)'));
  assert.ok(
    !/localStorage\.getItem\("sti-version-installee"\) \|\| String/.test(bloc.slice(0, 4000)),
    'le témoin ne doit plus venir du numéro de cache'
  );
  assert.match(admin, /function versionPublieeAdm\(\)/);
  assert.match(admin, /sessionStorage\.setItem\("sti-sw-reload-ver", v\)/);
  assert.match(admin, /window\.__STI_VERSION_PUBLIEE/);
});

test('v610 — une nouvelle version déclenche un rechargement, sans boucle', () => {
  assert.match(admin, /var rechargementDejaFait = false;/);
  assert.match(admin, /if \(rechargementDejaFait\) return;/);
  assert.match(admin, /reg\.addEventListener\("updatefound"/);
  assert.match(admin, /nw\.state === "installed"/);
  assert.match(admin, /navigator\.serviceWorker\.addEventListener\("controllerchange", function \(\) \{\s*rechargerPourNouvelleVersion\(\);/);
  /* Le numéro publié est exposé hors de l'IIFE de version. */
  assert.match(admin, /window\.__STI_VERSION_PUBLIEE = num;/);
});

test('v610 — pas de rechargement sous les yeux de quelqu’un qui travaille', () => {
  assert.match(admin, /function proposerRechargementAdm\(\)/);
  assert.match(admin, /sti-bandeau-maj-admin/);
  assert.match(admin, /Nouvelle version prête — toucher pour recharger/);
  assert.match(admin, /document\.querySelector\("\.modal-fond\.visible, #zone-detail\.visible"\)/);
});

test('v610 — une page HTML en cache se rafraîchit en arrière-plan', () => {
  assert.match(sw, /async function revaliderHtmlEnArrierePlan\(req, url\)/);
  assert.match(sw, /await fetch\(req, \{ cache: "no-cache" \}\)/, 'le réseau est interrogé sans bloquer la page');
  assert.match(sw, /evt\.waitUntil\(revaliderHtmlEnArrierePlan\(req, url\)\)/,
    'la revalidation profite de la visite sans retarder l’affichage');
  assert.match(sw, /req\.mode === "navigate" \|\| \/\\\.html\$\/i\.test\(url\.pathname\)/);
});

test('v610 — publication : version, cache-buster et révisions', () => {
  assert.match(sw, /var VERSION_PUBLIEE = "v(?:6(?:1[1-9]|[2-9]\d)|[7-9]\d\d)";/);
  assert.match(sw, /v610-maj-visible-20261101/);
  assert.match(adminHtml, /assets\/js\/admin\.js\?v=615-perf/);
  assert.ok(sw.includes('{ url: "./assets/js/admin.js", revision: "guide-lisibilite-v615" }'));
  assert.ok(sw.includes('{ url: "./admin.html", revision: "guide-lisibilite-v615" }'));
});
