/* v552 — l’audit complet de la plateforme tourne avec les tests.
   Le script outils/audit/audit-plateforme.mjs vérifie les huit axes demandés
   (fluidité, rapidité, sécurité, accès aux cours/vidéos/exercices, tirage des
   quiz, synchronisation des XP, conformité aux annexes, mobile). --strict le
   fait échouer dès qu’un constat bloquant apparaît : ce test empêche donc la
   régression. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const script = join(root, 'outils', 'audit', 'audit-plateforme.mjs');
const rapport = join(root, 'RAPPORT-audit-plateforme-v552.md');

function lancer(...args) {
  try {
    const sortie = execFileSync(process.execPath, [script, ...args], { cwd: root, encoding: 'utf8' });
    return { code: 0, sortie };
  } catch (erreur) {
    return { code: erreur.status ?? 1, sortie: `${erreur.stdout || ''}${erreur.stderr || ''}` };
  }
}

test('l’audit ne relève aucun constat bloquant sur la plateforme livrée', () => {
  const { code, sortie } = lancer('--strict');
  assert.equal(code, 0, sortie);
  assert.match(sortie, /⛔ 0 ·/);
  for (const axe of ['Accès', 'Quiz', 'XP', 'Annexes', 'Mobile', 'Rapidité', 'Sécurité', 'Accessibilité']) {
    assert.ok(sortie.includes(axe), `axe ${axe} absent du résumé`);
  }
});

test('le rapport est écrit et couvre les huit axes', () => {
  lancer();
  assert.ok(existsSync(rapport), 'RAPPORT-audit-plateforme-v552.md doit être généré');
  const texte = readFileSync(rapport, 'utf8');
  for (const mot of ['Accès', 'Quiz', 'XP', 'Annexes', 'Mobile', 'Rapidité', 'Sécurité', 'Accessibilité', 'Comment relancer']) {
    assert.ok(texte.includes(mot), mot);
  }
  assert.match(texte, /Liens vérifiés/);
});

test('chaque lien local du site existe vraiment', () => {
  /* Le constat « Accès » est le seul bloquant possible côté contenu :
     s’il tombe, c’est qu’une page pointe vers un fichier disparu. */
  const { sortie } = lancer('--strict');
  assert.ok(!/lien\(s\) pointent vers un fichier absent/.test(sortie), sortie);
  assert.ok(!/ancre inexistante/.test(sortie), sortie);
});
