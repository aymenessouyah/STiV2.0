#!/usr/bin/env node
/** Autorisations hors ligne Labo3. La clé privée ne doit jamais être livrée aux postes. */
import { generateKeyPairSync, sign, verify, createHash, createPublicKey } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const MAX_POSTES = 20;
export function empreintePoste(machineGuid) {
  if (typeof machineGuid !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(machineGuid.trim())) {
    throw new Error('MachineGuid Windows invalide.');
  }
  return createHash('sha256').update('STI-LABO3/1\n' + machineGuid.trim().toLowerCase()).digest('hex');
}
function valider(contenu) {
  if (!contenu || contenu.format !== 'STI-LABO3-AUTORISATION/1' || contenu.laboratoire !== 'Labo3' ||
      !Array.isArray(contenu.postes) || contenu.postes.length < 1 || contenu.postes.length > MAX_POSTES ||
      contenu.postes.some(p => typeof p !== 'string' || !/^[0-9a-f]{64}$/.test(p)) ||
      new Set(contenu.postes).size !== contenu.postes.length) throw new Error('Liste de postes invalide (1 à 20 empreintes uniques).');
}
export function creerAutorisation(postes, clePrivee) {
  const contenu = { format: 'STI-LABO3-AUTORISATION/1', laboratoire: 'Labo3', postes: [...postes].sort() };
  valider(contenu);
  // Signer les octets exacts : le lecteur ne dépend pas de la sérialisation JSON locale.
  const donnees = Buffer.from(JSON.stringify(contenu));
  return { algorithme: 'Ed25519', donnees: donnees.toString('base64'), signature: sign(null, donnees, clePrivee).toString('base64') };
}
export function verifierAutorisation(enveloppe, empreinte, clePublique) {
  try {
    if (enveloppe.algorithme !== 'Ed25519') return false;
    const cle = createPublicKey(clePublique);
    if (cle.asymmetricKeyType !== 'ed25519') return false;
    const donnees = Buffer.from(enveloppe.donnees, 'base64');
    if (!verify(null, donnees, cle, Buffer.from(enveloppe.signature, 'base64'))) return false;
    const contenu = JSON.parse(donnees.toString('utf8'));
    valider(contenu);
    return contenu.postes.includes(empreinte);
  } catch { return false; }
}
/** Contrôle de structure sans clé publique : utile avant de copier sur un support.
 *  Ne prouve pas la signature — seule la clé publique embarquée dans l’exécutable le peut. */
export function inspecterAutorisation(enveloppe) {
  if (!enveloppe || enveloppe.algorithme !== 'Ed25519' || typeof enveloppe.donnees !== 'string' || typeof enveloppe.signature !== 'string') {
    throw new Error('Enveloppe invalide : algorithme Ed25519, donnees et signature attendus.');
  }
  let contenu;
  try { contenu = JSON.parse(Buffer.from(enveloppe.donnees, 'base64').toString('utf8')); }
  catch { throw new Error('Données de l’autorisation illisibles (base64/JSON).'); }
  valider(contenu);
  return { format: contenu.format, laboratoire: contenu.laboratoire, postes: contenu.postes.length };
}
function cli(args) {
  const [commande, ...fichiers] = args;
  if (commande === 'cles' && fichiers.length === 2) {
    const { privateKey, publicKey } = generateKeyPairSync('ed25519');
    writeFileSync(fichiers[0], privateKey.export({ type: 'pkcs8', format: 'pem' }), { flag: 'wx', mode: 0o600 });
    writeFileSync(fichiers[1], publicKey.export({ type: 'spki', format: 'pem' }), { flag: 'wx' });
  } else if (commande === 'signer' && fichiers.length === 3) {
    const postes = JSON.parse(readFileSync(fichiers[0], 'utf8'));
    writeFileSync(fichiers[2], JSON.stringify(creerAutorisation(postes, readFileSync(fichiers[1])), null, 2), { flag: 'wx' });
  } else {
    throw new Error('Usage : cles privee.pem publique.pem | signer postes.json privee.pem autorisation.json');
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { cli(process.argv.slice(2)); } catch (e) { console.error(e.message); process.exitCode = 1; }
}
