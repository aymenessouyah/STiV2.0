#!/usr/bin/env node
/* ============================================================================
 * paquet-fixture.mjs — un VRAI .stipack pour tester l'installateur Windows
 * ----------------------------------------------------------------------------
 * La suite Windows doit valider l'installateur contre le format réellement
 * produit par le générateur du tableau de bord, pas contre une archive inventée
 * à la main : si `assets/js/stipack.js` change de schéma, le test doit casser.
 *
 * Ce script charge donc ce générateur dans le contexte Node courant (`runInThisContext`,
 * qui fournit Blob, CompressionStream et Web Crypto) et lui fait fabriquer un paquet à
 * partir de quelques fichiers réels du dépôt — assez petit pour rester rapide,
 * assez réel pour couvrir texte, JSON, JS et image déjà compressée.
 *
 *   node outils/windows-labo3-tests/paquet-fixture.mjs /tmp/fixture.stipack [plateforme|racine]
 * ========================================================================== */
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const sortie = process.argv[2];
const disposition = process.argv[3] === 'racine' ? 'racine' : 'plateforme';
if (!sortie) {
  console.error('usage : paquet-fixture.mjs <sortie.stipack> [plateforme|racine]');
  process.exit(2);
}

/* index.html est obligatoire : l'installateur refuse un paquet sans accueil. */
const FICHIERS = [
  'index.html',
  '404.html',
  'robots.txt',
  'manifest.webmanifest',
  'assets/js/config.js',
  'assets/icons/sti-icon-192.png'
];

/* Même realm que Node : un contexte VM séparé casserait les `instanceof
   Uint8Array` du générateur, qui retomberait sur String() et écrirait des listes
   d'octets au lieu du contenu. */
const code = readFileSync(path.join(RACINE, 'assets', 'js', 'stipack.js'), 'utf8');
vm.runInThisContext(code, { filename: 'assets/js/stipack.js' });
const generateur = globalThis.STIStipack;
if (!generateur || typeof generateur.construirePaquet !== 'function') {
  console.error('générateur stipack.js introuvable dans le contexte VM');
  process.exit(1);
}

function empreinteGit(chemin) {
  const contenu = readFileSync(path.join(RACINE, chemin));
  return createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${contenu.length}\0`, 'utf8'), contenu])).digest('hex');
}

const liste = FICHIERS.map((chemin) => ({
  chemin,
  octets: readFileSync(path.join(RACINE, chemin)).length,
  empreinte: empreinteGit(chemin)
}));

const memoire = generateur.ecrivainMemoire();
const resultat = await generateur.construirePaquet({
  liste,
  recuperer: async (chemin) => {
    if (!FICHIERS.includes(chemin)) throw new Error('fichier hors fixture : ' + chemin);
    return new Uint8Array(readFileSync(path.join(RACINE, chemin)));
  },
  ecrire: memoire.ecrire,
  volume: 'complet',
  disposition,
  nom: path.basename(sortie),
  fabriqueLe: new Date('2026-11-09T12:00:00.000Z').toISOString(),
  updateId: 'fixture-windows-labo3',
  onProgres: () => {}
});

const bloc = memoire.bloc();
const octets = Buffer.from(await bloc.arrayBuffer());
writeFileSync(sortie, octets);
console.log(
  `✅ ${path.basename(sortie)} — ${octets.length} octets, ${resultat.fichiers} fichiers, disposition ${disposition}, ` +
  `empreinte ${createHash('sha256').update(octets).digest('hex')}`
);
