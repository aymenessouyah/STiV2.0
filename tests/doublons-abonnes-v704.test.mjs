/* v704 — « compteur à zéro, pourtant il s'est connecté » : le doublon.
   ---------------------------------------------------------------------------
   Relevé en base (2026-11-26) : plusieurs élèves ont DEUX comptes actifs.
   Le compte « réel » porte des centaines de lignes de journal, le second
   (autre e-mail, prénom à une lettre près) reste à zéro — et c'est lui que
   le professeur regarde. Cas réels relevés :
     · amara montassar (431 connexions) / amara motassar (0) ;
     · Bouakroucha Malek (1 082) / bouakroucha melek (0) ;
     · Dridi Ala (198, gmail) / Dridi Ala (0, tel.sti.tn).
   Le tableau de bord signale désormais la paire probable sur la carte de
   l'abonné à zéro et dans le diagnostic « 🔎 Compteurs », sans jamais
   fusionner ni supprimer un compte tout seul. Ces tests figent la
   détection (normalisation, distance bornée, inversion nom/prénom) et ses
   garde-fous : deux élèves différents d'une même famille (Themri Ayoub /
   Themri Eya) ne doivent PAS être signalés.
*/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const lire = (chemin) => readFileSync(new URL(`../${chemin}`, import.meta.url), 'utf8');
const admin = lire('assets/js/admin.js');
const sw = lire('sw.js');

/* Rejoue la normalisation et la distance telles qu'écrites dans admin.js. */
function normaliser(txt) {
  return String(txt || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim().replace(/\s+/g, ' ');
}
function distance(a, b) {
  a = String(a || ''); b = String(b || '');
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > 3) return 99;
  let prec = [];
  for (let j = 0; j <= b.length; j++) prec[j] = j;
  for (let i = 1; i <= a.length; i++) {
    const cour = [i];
    for (let j = 1; j <= b.length; j++) {
      cour[j] = Math.min(prec[j] + 1, cour[j - 1] + 1, prec[j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1));
    }
    prec = cour;
  }
  return prec[b.length];
}

test('v704 — la détection des doublons existe dans le tableau de bord', () => {
  assert.match(admin, /function normaliserIdentiteAdmin\(txt\)/);
  assert.match(admin, /function distanceIdentiteAdmin\(a, b\)/);
  assert.match(admin, /function trouverDoublonProbableAdmin\(p\)/);
  assert.match(admin, /compte presque homonyme existe/, 'le diagnostic nomme le doublon probable');
});

test('v704 — normalisation : casse, accents et espaces ne comptent pas', () => {
  assert.equal(normaliser('  Bouakroucha '), 'bouakroucha');
  assert.equal(normaliser('Melek'), normaliser('melek'));
  assert.equal(normaliser('Lycée  Rafèha'), 'lycee rafeha');
});

test('v704 — les paires réelles sont détectées, les homonymes de famille non', () => {
  /* Même nom, prénom à une lettre près → même élève probable. */
  assert.ok(distance('montassar', 'motassar') <= 2);
  assert.ok(distance(normaliser('Malek'), normaliser('melek')) <= 2, 'Malek / melek : une lettre d’écart');
  assert.equal(distance(normaliser('Ala'), normaliser('Ala')), 0);
  /* Même nom, prénoms franchement différents → deux élèves distincts. */
  assert.ok(distance('ayoub', 'Eya') > 2, 'Themri Ayoub ≠ Themri Eya');
  assert.ok(distance('Ala', 'Nourchene') > 2, 'Dridi Ala ≠ Dridi Nourchene');
});

test('v704 — le badge n’apparaît que sur un compteur à zéro avec jumeau actif', () => {
  assert.match(admin, /\(counts\[p\.id\] \|\| 0\) === 0/);
  assert.match(admin, /Doublon probable : /, 'libellé du badge sur la carte');
  assert.match(admin, /\(counts\[jumeauCarteNd\.id\] \|\| 0\) > 0/, 'le jumeau doit porter l’activité');
  assert.match(admin, /trouverDoublonProbableAdmin\(p\)/);
  /* L’inversion nom/prénom (Malek Bakouri / Bakouri Malek) est couverte. */
  assert.match(admin, /nomQ === prenomP && prenomQ === nomP/);
});

test('v704 — publication : admin.js repart avec sa propre révision', () => {
  assert.ok(sw.includes('{ url: "./assets/js/admin.js", revision: "doublons-abonnes-v704", refreshIfCached: true }'),
    'révision attendue pour ./assets/js/admin.js');
});
