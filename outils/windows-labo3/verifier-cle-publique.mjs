#!/usr/bin/env node
/* ============================================================================
 * verifier-cle-publique.mjs — contrôle de la clé fournie à la compilation
 * ----------------------------------------------------------------------------
 * L'exécutable « STI v2.0 version spéciale Labo 3 » embarque une clé PUBLIQUE
 * Ed25519 (SPKI, 44 octets). Ce script refuse une clé privée, un autre
 * algorithme ou un PEM illisible AVANT toute compilation, pour ne jamais
 * produire un installateur qui refuse toutes les autorisations.
 *
 *   node outils/windows-labo3/verifier-cle-publique.mjs publique.pem
 * ========================================================================== */
import { readFileSync } from 'node:fs';
import { createPublicKey } from 'node:crypto';

const chemin = process.argv[2];
if (!chemin) {
  console.error('usage : verifier-cle-publique.mjs <cle-publique.pem>');
  process.exit(2);
}

let pem;
try {
  pem = readFileSync(chemin, 'utf8');
} catch (erreur) {
  console.error(`❌ fichier illisible : ${erreur.message}`);
  process.exit(1);
}

if (/PRIVATE KEY/i.test(pem)) {
  console.error('❌ clé PRIVÉE détectée. Ne jamais fournir ni distribuer la clé privée.');
  process.exit(1);
}

let cle;
try {
  cle = createPublicKey({ key: pem, format: 'pem', type: 'spki' });
} catch (erreur) {
  console.error(`❌ PEM invalide : ${erreur.message}`);
  process.exit(1);
}

if (cle.asymmetricKeyType !== 'ed25519') {
  console.error(`❌ algorithme « ${cle.asymmetricKeyType} » : Ed25519 requis.`);
  process.exit(1);
}

const der = cle.export({ format: 'der', type: 'spki' });
if (der.length !== 44) {
  console.error(`❌ encodage SPKI inattendu (${der.length} octets au lieu de 44).`);
  process.exit(1);
}

console.log('✅ clé publique Ed25519 valide (SPKI, 44 octets) — utilisable pour la compilation');
