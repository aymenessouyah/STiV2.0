#!/usr/bin/env node
/* ============================================================================
 * resynchroniser-manifeste.mjs — remise à jour de offline-complete-manifest.json
 * ----------------------------------------------------------------------------
 * Ce manifeste est la liste des fichiers que l’installation hors ligne dépose
 * sur le poste, et la source de la fabrication du paquet `.stipack` dans
 * l’admin. Chaque entrée porte la taille et l’empreinte SHA-1 du blob Git.
 *
 * Quand un fichier livré change, son entrée devient une promesse fausse : le
 * paquet contiendrait l’ancienne version. Cet outil réécrit uniquement ce qui
 * a bougé — il n’ajoute jamais un fichier tout seul, pour ne pas transformer
 * la liste voulue en simple reflet du dépôt.
 *
 *   node outils/stipack/resynchroniser-manifeste.mjs                    # contrôle seul
 *   node outils/stipack/resynchroniser-manifeste.mjs --ecrire           # corrige
 *   node outils/stipack/resynchroniser-manifeste.mjs --ecrire --ajouter assets/js/x.js
 * ========================================================================== */

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const RACINE = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const FICHIER = path.join(RACINE, 'offline-complete-manifest.json');

const ecrire = process.argv.includes('--ecrire');
const ajouts = [];
for (let i = 0; i < process.argv.length; i++) {
  if (process.argv[i] === '--ajouter' && process.argv[i + 1]) ajouts.push(process.argv[i + 1]);
}

function entreeDepuisDisque(chemin) {
  const octets = fs.readFileSync(path.join(RACINE, chemin));
  return {
    path: chemin,
    bytes: octets.length,
    gitSha: createHash('sha1').update(`blob ${octets.length}\0`).update(octets).digest('hex')
  };
}

const manifeste = JSON.parse(fs.readFileSync(FICHIER, 'utf8'));
const parChemin = new Map(manifeste.files.map((f) => [f.path, f]));

let corriges = 0;
let absents = 0;
let ajoutes = 0;

for (const [chemin, ancienne] of parChemin) {
  const absolu = path.join(RACINE, chemin);
  if (!fs.existsSync(absolu)) {
    process.stdout.write(`⚠ absent du disque, entrée conservée telle quelle : ${chemin}\n`);
    absents++;
    continue;
  }
  const fraiche = entreeDepuisDisque(chemin);
  if (fraiche.bytes !== ancienne.bytes || fraiche.gitSha !== ancienne.gitSha) {
    process.stdout.write(`✏ ${chemin} — ${ancienne.bytes} → ${fraiche.bytes} octets\n`);
    parChemin.set(chemin, fraiche);
    corriges++;
  }
}

for (const chemin of ajouts) {
  if (parChemin.has(chemin)) continue;
  if (!fs.existsSync(path.join(RACINE, chemin))) throw new Error(`fichier introuvable : ${chemin}`);
  parChemin.set(chemin, entreeDepuisDisque(chemin));
  process.stdout.write(`＋ ${chemin}\n`);
  ajoutes++;
}

const fichiers = [...parChemin.values()].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
const totalBytes = fichiers.reduce((total, f) => total + f.bytes, 0);

const nouveau = {
  ...manifeste,
  generatedAt: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
  totalFiles: fichiers.length,
  totalBytes,
  files: fichiers
};

process.stdout.write(
  `\n${fichiers.length} fichiers · ${(totalBytes / 1048576).toFixed(1)} Mo\n` +
    `   ${corriges} entrée(s) corrigée(s), ${ajoutes} ajout(s), ${absents} absente(s) du disque\n`
);

if (!ecrire) {
  process.stdout.write('   mode contrôle : rien n’a été écrit (relancer avec --ecrire)\n\n');
  process.exitCode = corriges || ajoutes ? 1 : 0;
} else if (corriges || ajoutes) {
  fs.writeFileSync(FICHIER, JSON.stringify(nouveau, null, 2) + '\n');
  process.stdout.write('   manifeste réécrit\n\n');
} else {
  process.stdout.write('   déjà à jour\n\n');
}
