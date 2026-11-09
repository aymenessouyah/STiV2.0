import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { generateKeyPairSync, createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT = fileURLToPath(new URL('../outils/windows-labo3/cle-depuis-saisie.mjs', import.meta.url));
const dossier = mkdtempSync(join(tmpdir(), 'sti-cle-'));
const { privateKey, publicKey } = generateKeyPairSync('ed25519');
const pem = publicKey.export({ type: 'spki', format: 'pem' }).trim();
const privee = privateKey.export({ type: 'pkcs8', format: 'pem' }).trim();
const attendre = pem + '\n';
const empreinteAttendue = createHash('sha256').update(attendre, 'utf8').digest('hex');

function lancer(saisie, nom) {
  const sortie = join(dossier, nom);
  try {
    const stdout = execFileSync(process.execPath, [SCRIPT, sortie], {
      env: { ...process.env, LABO3_CLE_PUBLIQUE: saisie }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']
    });
    return { code: 0, stdout: stdout.trim(), sortie };
  } catch (erreur) {
    return { code: erreur.status, stdout: '', stderr: String(erreur.stderr || erreur.message), sortie };
  }
}

test('saisie workflow : PEM échappé et PEM multiligne donnent la même clé valide', () => {
  for (const [cas, saisie] of [['escape.pem', pem.replace(/\n/g, '\\n')], ['reel.pem', pem + '\r\n']]) {
    const r = lancer(saisie, cas);
    assert.equal(r.code, 0, cas + ' refusée à tort : ' + (r.stderr || ''));
    assert.equal(r.stdout, empreinteAttendue);
    assert.equal(readFileSync(r.sortie, 'ascii'), attendre);
  }
});

test('saisie workflow : clé privée, texte libre, PEM vide et deux blocs refusés', () => {
  const refus = [
    ['privee.pem', privee.replace(/\n/g, '\\n'), /PRIVÉE/],
    ['ordure.pem', 'nimporte quoi', /format attendu/],
    ['vide.pem', '   ', /aucune clé publique/],
    ['double.pem', pem.replace(/\n/g, '\\n') + '\\n' + pem.replace(/\n/g, '\\n'), /un seul bloc PUBLIC KEY/]
  ];
  for (const [nom, saisie, motif] of refus) {
    const r = lancer(saisie, nom);
    assert.equal(r.code, 1, nom + ' : refus attendu');
    assert.match(r.stderr, motif);
  }
});

test('vérificateur de fichier : même contrat sur une clé déjà écrite', () => {
  const chemin = join(dossier, 'publique.pem');
  const verificateur = fileURLToPath(new URL('../outils/windows-labo3/verifier-cle-publique.mjs', import.meta.url));
  writeFileSync(chemin, attendre);
  assert.equal(execFileSync(process.execPath, [verificateur, chemin], { encoding: 'utf8' }).includes('✅'), true);
  const priveeChemin = join(dossier, 'privee.pem');
  writeFileSync(priveeChemin, privateKey.export({ type: 'pkcs8', format: 'pem' }));
  assert.throws(() => execFileSync(process.execPath, [verificateur, priveeChemin], { stdio: 'pipe' }));
});

test('après les tests : aucun fichier temporaire laissé dans le dépôt', () => {
  rmSync(dossier, { recursive: true, force: true });
  const workflow = readFileSync(fileURLToPath(new URL('../.github/workflows/windows-labo3.yml', import.meta.url)), 'utf8');
  assert.match(workflow, /cle-depuis-saisie\.mjs/);
  assert.match(workflow, /LABO3_CLE_PUBLIQUE: \$\{\{ github.event.inputs.cle_publique \}\}/);
  // La saisie doit passer par une variable d'environnement : interpolée dans un
  // bloc run:, elle permettrait d'exécuter du PowerShell arbitraire.
  const occurrences = workflow.split('\n').filter(l => l.includes('${{ github.event.inputs.cle_publique }}'));
  assert.equal(occurrences.length, 1);
  assert.match(occurrences[0], /^\s*LABO3_CLE_PUBLIQUE: /);
});
