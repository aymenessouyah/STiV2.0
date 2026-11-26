/* v703 — « suivreSessionId is not defined » : les compteurs à zéro et les
   durées figées venaient d'une fonction hors de portée.
   ---------------------------------------------------------------------------
   Relevé en base (2026-11-26) : 454 pannes « journal_acces » dans
   sti_diagnostics, 100 % avec le même message (« suivreSessionId is not
   defined » sous Chrome, « Can't find variable: suivreSessionId » sous
   Safari), émises par les appareils de 47 élèves — précisément ceux dont
   les lignes `acces` existent. La fonction de suivi de la durée était
   imbriquée dans insere() alors que ouvrirSessionJournal(), définie au
   même niveau que insere(), l'appelait : l'insertion de la ligne de
   session réussissait, puis le suivi plantait à chaque page (durée figée
   à 1 s, bascule à tort vers la file hors-ligne donc doublons
   « Hors-ligne », et panne signalée au professeur à chaque session).

   La fonction vit désormais au niveau du journal, comme ses sœurs
   retrouverIdSession() et ouvrirSessionJournal(). Ce test fige la portée :
   si quelqu'un la ré-imbrique dans insere(), il échouera ici avant que
   les compteurs des élèves ne retombent à zéro.
*/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const lire = (chemin) => readFileSync(new URL(`../${chemin}`, import.meta.url), 'utf8');
const acces = lire('assets/js/acces.js');
const sw = lire('sw.js');

test('v703 — suivreSessionId est définie une seule fois, au niveau du journal', () => {
  const defs = acces.match(/function suivreSessionId\(id\)/g) || [];
  assert.equal(defs.length, 1, 'une seule définition de suivreSessionId');
  const iRetrouver = acces.indexOf('function retrouverIdSession(tsInit, suite)');
  const iSuivre = acces.indexOf('function suivreSessionId(id)');
  const iOuvrir = acces.indexOf('function ouvrirSessionJournal(tsInit)');
  assert.ok(iRetrouver > -1 && iOuvrir > -1, 'les fonctions du journal sont présentes');
  assert.ok(iSuivre > iRetrouver && iSuivre < iOuvrir,
    'suivreSessionId vit entre retrouverIdSession et ouvrirSessionJournal (portée du journal)');
});

test('v703 — insere() ne définit plus suivreSessionId dans son corps', () => {
  const debut = acces.indexOf('function insere() {');
  assert.ok(debut > -1, 'insere() présente');
  const corps = acces.slice(debut, debut + 400);
  assert.match(corps, /ouvrirSessionJournal\(tsInit\)/, 'insere() ouvre toujours la session');
  assert.ok(!/function suivreSessionId/.test(corps),
    'suivreSessionId ne doit plus être imbriquée dans insere()');
});

test('v703 — ouvrirSessionJournal peut toujours appeler le suivi de durée', () => {
  const debut = acces.indexOf('function ouvrirSessionJournal(tsInit)');
  const corps = acces.slice(debut, debut + 2200);
  assert.match(corps, /suivreSessionId\(r\.data\.id\)/, 'appel après insertion réussie');
  assert.match(corps, /suivreSessionId\(id\)/, 'appel après identifiant retrouvé');
  assert.match(corps, /suivreSessionId\(id2\)/, 'appel après le second essai');
});

test('v703 — publication : acces.js repart avec sa propre révision', () => {
  assert.ok(sw.includes('{ url: "./assets/js/acces.js", revision: "journal-session-v703" }'),
    'révision attendue pour ./assets/js/acces.js');
});
