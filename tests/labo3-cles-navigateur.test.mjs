/*
  Clés créées dans le tableau de bord — assets/js/admin-labo3.js

  L'administrateur fabrique sa paire Ed25519 dans le navigateur, puis colle la clé
  publique dans le workflow « Windows Labo3 ». Une clé mal encodée produirait un
  installateur qui refuse toutes les autorisations, sans erreur visible. Ces tests
  font donc parcourir à la clé le chemin réel, sans simulation :

    1. génération dans le module du panneau (Web Crypto, comme le navigateur) ;
    2. encodage attendu par l'installateur : SPKI Ed25519, 44 octets, préfixe fixé ;
    3. la ligne collée dans `cle_publique` est reconstruite par
       outils/windows-labo3/cle-depuis-saisie.mjs, et l'empreinte qu'il imprime est
       exactement celle que le panneau annonce (donc le nom d'artefact
       STI-v2.0-Labo3-cle-… est reconnaissable sans deviner) ;
    4. le PEM écrit est accepté par verifier-cle-publique.mjs, le contrôle que
       compiler.ps1 exécute avant de compiler ;
    5. une autorisation signée avec la clé privée générée est vérifiée par le
       vérificateur hors ligne avec la clé publique générée.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webcrypto } from 'node:crypto';
import { verifierAutorisation } from '../outils/stipack/autorisation-labo3.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const code = readFileSync(join(root, 'assets', 'js', 'admin-labo3.js'), 'utf8');
const contexte = vm.createContext({
  crypto: webcrypto,
  TextEncoder,
  btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
  atob: (s) => Buffer.from(s, 'base64').toString('binary')
});
vm.runInContext(code, contexte);
const api = contexte.STILabo3Admin;

function lancer(script, args, env) {
  try {
    const sortie = execFileSync('node', [join(root, script), ...args], {
      cwd: root, encoding: 'utf8', stdio: 'pipe', env: { ...process.env, ...(env || {}) }
    });
    return { code: 0, sortie };
  } catch (erreur) {
    return { code: erreur.status ?? 1, sortie: String(erreur.stdout || '') + String(erreur.stderr || '') };
  }
}

test('panneau : la paire générée a l’encodage exigé par l’installateur', async () => {
  const cles = await api.genererCles({});
  assert.match(cles.publiquePem, /^-----BEGIN PUBLIC KEY-----\n(?:[A-Za-z0-9+/]{64}\n)*[A-Za-z0-9+/=]+\n-----END PUBLIC KEY-----\n$/);
  assert.match(cles.priveePem, /^-----BEGIN PRIVATE KEY-----\n[\s\S]+\n-----END PRIVATE KEY-----\n$/);
  /* DER SPKI : 44 octets et le préfixe qu'analyse le code C#. */
  const der = Buffer.from(cles.publiquePem.replace(/-----[^-]+-----|\s/g, ''), 'base64');
  assert.equal(der.length, 44);
  assert.equal(der.subarray(0, 12).toString('hex'), api.PREFIXE_SPKI_ED25519);
  assert.match(cles.empreinte, /^[0-9a-f]{64}$/);
  assert.equal(cles.artefact, 'STI-v2.0-Labo3-cle-' + cles.empreinte.slice(0, 12));
  /* La ligne à coller ne contient aucun retour à la ligne réel. */
  assert.ok(!cles.saisieWorkflow.includes('\n'));
  assert.ok(cles.saisieWorkflow.includes('\\n'));
  assert.equal(cles.saisieWorkflow.replaceAll('\\n', '\n') + '\n', cles.publiquePem);
});

test('panneau : la clé collée dans le workflow donne l’empreinte annoncée', async () => {
  const cles = await api.genererCles({});
  const dossier = mkdtempSync(join(tmpdir(), 'sti-cles-'));
  try {
    const pem = join(dossier, 'publique.pem');
    const saisie = lancer('outils/windows-labo3/cle-depuis-saisie.mjs', [pem], { LABO3_CLE_PUBLIQUE: cles.saisieWorkflow });
    assert.equal(saisie.code, 0, saisie.sortie);
    assert.equal(saisie.sortie.trim(), cles.empreinte, 'l’empreinte du workflow est celle que le panneau affiche');
    assert.equal(readFileSync(pem, 'utf8'), cles.publiquePem, 'le PEM reconstruit est identique au PEM affiché');

    /* Contrôle exécuté par compiler.ps1 avant de compiler. */
    const controle = lancer('outils/windows-labo3/verifier-cle-publique.mjs', [pem]);
    assert.equal(controle.code, 0, controle.sortie);
  } finally {
    rmSync(dossier, { recursive: true, force: true });
  }
});

test('panneau : une clé privée est refusée, et l’empreinte annoncée suit la clé', async () => {
  const cles = await api.genererCles({});
  const dossier = mkdtempSync(join(tmpdir(), 'sti-cles-'));
  try {
    const refus = lancer('outils/windows-labo3/cle-depuis-saisie.mjs', [join(dossier, 'x.pem')], {
      LABO3_CLE_PUBLIQUE: cles.priveePem.replaceAll('\n', '\\n')
    });
    assert.notEqual(refus.code, 0);
    assert.match(refus.sortie, /clé PRIVÉE/i, 'la saisie d’une clé privée est bloquée avant compilation');

    /* Deux paires différentes : deux empreintes différentes, donc deux noms
       d'artefact différents — l'administrateur ne peut pas se tromper de clé. */
    const autre = await api.genererCles({});
    assert.notEqual(autre.empreinte, cles.empreinte);
    assert.notEqual(autre.artefact, cles.artefact);
  } finally {
    rmSync(dossier, { recursive: true, force: true });
  }
});

test('panneau : l’autorisation signée avec la clé générée est vérifiée hors ligne', async () => {
  const cles = await api.genererCles({});
  const poste = 'b'.repeat(64);
  const autorisation = await api.signer([poste], cles.priveePem);
  assert.equal(verifierAutorisation(autorisation, poste, cles.publiquePem), true);
  assert.equal(verifierAutorisation(autorisation, 'c'.repeat(64), cles.publiquePem), false, 'un autre poste est refusé');

  const autre = await api.genererCles({});
  assert.equal(verifierAutorisation(autorisation, poste, autre.publiquePem), false, 'une autre clé publique ne valide pas');
});

test('panneau : aucune clé stockée ni envoyée, lien du workflow déduit du dépôt', async () => {
  /* Rien ne persiste dans le navigateur : les clés vivent dans une variable du
     module et dans le téléchargement immédiat de la clé privée. */
  assert.doesNotMatch(code, /localStorage|sessionStorage|indexedDB|XMLHttpRequest|document\.cookie/);
  /* Aucune écriture réseau : le module ne fait que lire la release publique. */
  assert.doesNotMatch(code, /method\s*:\s*['"]POST|body\s*:|jeton|token|Authorization/i);
  assert.match(code, /generateKey\(\{ name: 'Ed25519' \}, true, \['sign', 'verify'\]\)/);

  const url = api.urlWorkflow({ proprietaire: 'proprio', nom: 'depot' });
  assert.equal(url, 'https://github.com/proprio/depot/actions/workflows/windows-labo3.yml');

  const html = readFileSync(join(root, 'admin.html'), 'utf8');
  for (const id of ['labo3-cles-generer', 'labo3-cle-copier', 'labo3-cle-publique', 'labo3-cle-saisie',
    'labo3-cle-empreinte', 'labo3-cles-etat', 'labo3-workflow-lien']) {
    assert.ok(html.includes(`id="${id}"`), 'identifiant absent du panneau : ' + id);
  }
  assert.match(html, /cocher <code>publier<\/code>/, 'la case publier est expliquée');
  assert.match(html, /ne demande ni ne manipule aucun jeton/, 'l’absence de jeton est dite explicitement');
  assert.match(html, /openssl genpkey -algorithm ed25519/, 'une voie sans navigateur est proposée');
  assert.match(html, /admin-labo3\.js\?v=3/);
});
