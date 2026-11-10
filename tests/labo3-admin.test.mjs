import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { generateKeyPairSync, webcrypto } from 'node:crypto';
import { verifierAutorisation } from '../outils/stipack/autorisation-labo3.mjs';
const code = readFileSync(new URL('../assets/js/admin-labo3.js', import.meta.url), 'utf8');
const c = vm.createContext({ crypto: webcrypto, TextEncoder, btoa: s => Buffer.from(s, 'binary').toString('base64'), atob: s => Buffer.from(s, 'base64').toString('binary') });
vm.runInContext(code, c);
const api = c.STILabo3Admin;
const poste = 'a'.repeat(64);
const releve = p => JSON.stringify({ format: 'STI-LABO3-POSTE/1', empreinte: p });
test('panneau : signature navigateur compatible avec le vérificateur hors ligne', async () => {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const a = await api.signer([poste], privateKey.export({ type: 'pkcs8', format: 'pem' }));
  assert.equal(verifierAutorisation(a, poste, publicKey.export({ type: 'spki', format: 'pem' })), true);
});
test('panneau : relevés BOM acceptés, doublons, mauvais format et plus de 20 refusés', () => {
  assert.equal(api.lirePostes(['\uFEFF' + releve(poste)])[0], poste);
  assert.throws(() => api.lirePostes([]));
  assert.throws(() => api.lirePostes([releve(poste), releve(poste)]));
  assert.throws(() => api.lirePostes(['{}']));
  assert.throws(() => api.lirePostes(Array.from({length: 21}, (_, i) => releve(i.toString(16).padStart(64, '0')))));
});
test('panneau : clé refusée si invalide, rien de stocké, réseau limité à la release', async () => {
  await assert.rejects(api.signer([poste], 'mot de passe'));
  /* Aucune clé ni empreinte ne doit être conservée par le navigateur. */
  assert.doesNotMatch(code, /localStorage|sessionStorage|indexedDB|XMLHttpRequest/);
  /* Le seul appel réseau du module est la lecture de la release publique :
     il ne transporte ni clé privée ni relevé de poste. */
  assert.match(code, /https:\/\/api\.github\.com\/repos\//);
  assert.doesNotMatch(code, /method\s*:\s*['"]POST|body\s*:/);
  const html = readFileSync(new URL('../admin.html', import.meta.url), 'utf8');
  assert.match(html, /id="bloc-labo3-support"/);
  assert.match(html, /<a class="btn-outil btn-outil-desactive" id="labo3-installateur-lien" aria-disabled="true">Téléchargement indisponible<\/a>/);
  assert.match(html, /assets\/js\/admin-labo3.js/);
});
