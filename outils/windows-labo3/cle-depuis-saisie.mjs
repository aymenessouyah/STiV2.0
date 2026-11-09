#!/usr/bin/env node
/* ============================================================================
 * cle-depuis-saisie.mjs — reconstruit et valide une clé publique saisie
 * ----------------------------------------------------------------------------
 * Le champ de saisie d'un workflow GitHub Actions est une seule ligne : les
 * retours à la ligne d'un PEM y arrivent comme les deux caractères `\n`. Ce
 * script reconstruit le PEM, refuse une clé privée ou un algorithme autre
 * qu'Ed25519, puis écrit le fichier qui sera embarqué dans l'exécutable.
 *
 *   LABO3_CLE_PUBLIQUE='-----BEGIN PUBLIC KEY-----\nMCow…\n-----END PUBLIC KEY-----' \
 *     node outils/windows-labo3/cle-depuis-saisie.mjs sortie.pem
 *
 * Sortie : empreinte SHA-256 du fichier écrit, sur stdout. Code 0 si valide.
 * La clé PUBLIQUE n'est pas un secret ; la clé privée ne doit jamais être saisie.
 * ========================================================================== */
import { writeFileSync } from 'node:fs';
import { createHash, createPublicKey } from 'node:crypto';

const sortie = process.argv[2];
const saisie = process.env.LABO3_CLE_PUBLIQUE ?? process.argv[3] ?? '';

function echouer(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

if (!sortie) echouer('usage : cle-depuis-saisie.mjs <sortie.pem> (clé dans LABO3_CLE_PUBLIQUE)');
if (!saisie.trim()) echouer('aucune clé publique fournie.');

/* Reconstruire les retours à la ligne : séquences littérales `\r\n`, `\n`, `\r`,
   puis normaliser les fins de ligne déjà réelles. Un PEM déjà multiligne passe
   donc tel quel. */
const pem = saisie
  .replace(/\\r\\n/g, '\n')
  .replace(/\\n/g, '\n')
  .replace(/\\r/g, '\n')
  .replace(/\r\n?/g, '\n')
  .replace(/[ \t]+\n/g, '\n')
  .trim() + '\n';

if (/PRIVATE KEY/i.test(pem)) echouer('clé PRIVÉE détectée. Ne jamais saisir ni distribuer la clé privée.');
if (!/^-----BEGIN PUBLIC KEY-----\n[\s\S]*\n-----END PUBLIC KEY-----\n$/.test(pem))
  echouer('format attendu : un seul PEM « PUBLIC KEY » (SPKI).');
/* Plusieurs blocs collés : Node ne lirait que le premier, et l'exécutable
   embarquerait une clé différente de celle que l'administrateur croit donner. */
const debuts = pem.match(/-----BEGIN PUBLIC KEY-----/g)?.length ?? 0;
const fins = pem.match(/-----END PUBLIC KEY-----/g)?.length ?? 0;
if (debuts !== 1 || fins !== 1) echouer(`un seul bloc PUBLIC KEY attendu (reçu ${debuts} début(s), ${fins} fin(s)).`);

let cle;
try {
  cle = createPublicKey({ key: pem, format: 'pem', type: 'spki' });
} catch (erreur) {
  echouer(`PEM invalide : ${erreur.message}`);
}
if (cle.asymmetricKeyType !== 'ed25519') echouer(`algorithme « ${cle.asymmetricKeyType} » : Ed25519 requis.`);

const der = cle.export({ format: 'der', type: 'spki' });
if (der.length !== 44) echouer(`encodage SPKI inattendu (${der.length} octets au lieu de 44).`);

writeFileSync(sortie, pem, 'ascii');
console.log(createHash('sha256').update(pem, 'utf8').digest('hex'));
