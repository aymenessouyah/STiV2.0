import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { empreintePoste, creerAutorisation, verifierAutorisation } from '../outils/stipack/autorisation-labo3.mjs';
const paire = () => {
  const p = generateKeyPairSync('ed25519');
  return { privee: p.privateKey.export({ type: 'pkcs8', format: 'pem' }), publique: p.publicKey.export({ type: 'spki', format: 'pem' }) };
};
const poste = empreintePoste('12345678-abcd-abcd-abcd-123456789012');
test('autorisation hors ligne : poste admis, autre poste refusé', () => {
  const c = paire(); const a = creerAutorisation([poste], c.privee);
  assert.equal(verifierAutorisation(a, poste, c.publique), true);
  assert.equal(verifierAutorisation(a, '0'.repeat(64), c.publique), false);
});
test('signature modifiée, données remplacées, autre clé : refus', () => {
  const c = paire(); const a = creerAutorisation([poste], c.privee);
  assert.equal(verifierAutorisation({ ...a, signature: 'AAAA' }, poste, c.publique), false);
  assert.equal(verifierAutorisation({ ...a, donnees: Buffer.from('{}').toString('base64') }, poste, c.publique), false);
  assert.equal(verifierAutorisation(a, poste, paire().publique), false);
  assert.equal(verifierAutorisation(null, poste, c.publique), false);
});
test('maximum 20 postes uniques, aucun poste vide', () => {
  const c = paire();
  const postes = Array.from({ length: 20 }, (_, i) => i.toString(16).padStart(64, '0'));
  assert.doesNotThrow(() => creerAutorisation(postes, c.privee));
  assert.throws(() => creerAutorisation([...postes, 'f'.repeat(64)], c.privee));
  assert.throws(() => creerAutorisation([poste, poste], c.privee));
  assert.throws(() => creerAutorisation([], c.privee));
  assert.throws(() => creerAutorisation(['nom-PC'], c.privee));
});
test('empreinte Windows normalisée et identifiant manquant refusé', () => {
  assert.equal(empreintePoste('12345678-ABCD-ABCD-ABCD-123456789012'), poste);
  assert.throws(() => empreintePoste(''));
});
