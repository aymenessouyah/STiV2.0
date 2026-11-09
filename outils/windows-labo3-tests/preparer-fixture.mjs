import { generateKeyPairSync, createHash } from 'node:crypto';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { creerAutorisation, empreintePoste } from '../stipack/autorisation-labo3.mjs';
const [destination, guid] = process.argv.slice(2);
mkdirSync(destination, { recursive: true });
const { privateKey, publicKey } = generateKeyPairSync('ed25519');
const privee = privateKey.export({ type: 'pkcs8', format: 'pem' });
writeFileSync(path.join(destination, 'publique.pem'), publicKey.export({ type: 'spki', format: 'pem' }));
writeFileSync(path.join(destination, 'autorisation-labo3.json'), JSON.stringify(creerAutorisation([empreintePoste(guid)], privee)));
writeFileSync(path.join(destination, 'refus.json'), JSON.stringify(creerAutorisation([createHash('sha256').update('autre-poste').digest('hex')], privee)));
// Clé de test jetable, jamais livrée ni utilisable pour une release de production.
