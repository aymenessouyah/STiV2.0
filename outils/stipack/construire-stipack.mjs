#!/usr/bin/env node
/* ============================================================================
 * construire-stipack.mjs — fabrication du paquet d'installation
 * « STI-Labo3-Plateforme.stipack »
 * ----------------------------------------------------------------------------
 * Le paquet est l'archive que l'installateur Windows STI Labo 3 ouvre pour
 * installer la plateforme hors ligne. Il est reconstruit ici, à partir des
 * fichiers réellement suivis par Git, pour qu'il reflète toujours la dernière
 * mise à jour du dépôt.
 *
 * Format produit (documenté dans outils/stipack/LISEZ-MOI.md) :
 *
 *   STI-Labo3-Plateforme.stipack          (archive ZIP, sans compression des médias)
 *   ├── stipack.json                      manifeste : version, commit, date,
 *   │                                     liste des fichiers + SHA-256
 *   ├── empreintes.txt                    mêmes empreintes, prêtes pour `sha256sum -c`
 *   ├── LISEZ-MOI.txt                     notice lisible à l'ouverture du ZIP
 *   └── plateforme/…                      tous les fichiers du site
 *     (ou directement à la racine de l’archive avec --disposition racine)
 *
 * Aucune dépendance : Node.js 18+ suffit.
 *
 * Exemples :
 *   node outils/stipack/construire-stipack.mjs
 *       → paquet allégé (médias lourds exclus), écrit à la racine du dépôt
 *
 *   node outils/stipack/construire-stipack.mjs --volume complet --sortie /tmp/x.stipack
 *       → paquet complet (~1,2 Go), vidéos et PDF compris
 *
 *   node outils/stipack/construire-stipack.mjs --mot-de-passe "…"
 *       → inscrit un vérificateur PBKDF2 du mot de passe initial demandé
 *         à l'installation (le mot de passe lui-même n'est jamais stocké)
 *
 *   node outils/stipack/construire-stipack.mjs --verifier STI-Labo3-Plateforme.stipack
 *       → contrôle l'intégrité d'un paquet existant (CRC32 + SHA-256)
 * ========================================================================== */

import { createHash, pbkdf2Sync, randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const RACINE = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const FORMAT = 'STI-STIPACK/1';
const NOM_PAR_DEFAUT = 'STI-Labo3-Plateforme.stipack';

/* Seuil par défaut du volume allégé : 2 Mo par fichier, comme la sauvegarde
   de secours (`outils/secours/construire-secours.mjs`). */
const SEUIL_MO = 2;

/* Ce que le dépôt contient ne fait pas tous partie de l’installation : ni les tests,
   ni l’outillage de fabrication, ni les fichiers de service du dépôt. Les empaqueter
   alourdissait le paquet et faisait échouer la fabrication depuis le tableau de bord
   (l’hébergement répond 503 sur les .mjs de tests). La même règle vaut dans
   assets/js/admin-stipack.js — les deux fabriques doivent produire le même paquet.
   `--tout` rétablit l’ancien comportement. */
const HORS_INSTALLATION = ['tests/', 'outils/', '.github/', '.vscode/', 'node_modules/'];
const HORS_INSTALLATION_RACINE = new Set(['.gitignore', '.gitattributes']);

function estDuSite(chemin) {
  if (HORS_INSTALLATION_RACINE.has(chemin)) return false;
  if (HORS_INSTALLATION.some((prefixe) => chemin.startsWith(prefixe))) return false;
  return !/\.patch$/i.test(chemin);
}

/* Extensions déjà compressées : on les stocke telles quelles, le deflate
   n'y gagne rien et ralentirait nettement la fabrication. */
const DEJA_COMPRIME = new Set([
  '.mp4', '.m4s', '.webm', '.mov', '.mkv', '.avi',
  '.mp3', '.ogg', '.opus', '.m4a', '.aac', '.wav', '.flac',
  '.zip', '.gz', '.7z', '.rar',
  '.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif', '.ico',
  '.woff', '.woff2', '.ttf', '.otf', '.eot',
  '.wasm', '.pdf', '.psd', '.apk', '.exe', '.dll'
]);

/* ------------------------------------------------------------------ outils */

function tailleLisible(octets) {
  const u = ['o', 'Ko', 'Mo', 'Go'];
  let i = 0;
  let v = octets;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v >= 100 || i === 0 ? 0 : 1).replace('.', ',')} ${u[i]}`;
}

function git(...args) {
  return execFileSync('git', args, { cwd: RACINE, encoding: 'utf8' }).trim();
}

function argValeur(nom, defaut = null) {
  const i = process.argv.indexOf(nom);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : defaut;
}

function drapeaux(nom) {
  return process.argv.includes(nom);
}

/* Date DOS (heure locale, comme le veut le format ZIP) à partir d'un ISO. */
function dateDos(iso) {
  const d = iso ? new Date(iso) : new Date();
  const heure = ((d.getHours() & 31) << 11) | ((d.getMinutes() & 63) << 5) | ((d.getSeconds() / 2) & 31);
  const jour = (((d.getFullYear() - 1980) & 127) << 9) | (((d.getMonth() + 1) & 15) << 5) | (d.getDate() & 31);
  return { heure, jour };
}

/* ------------------------------------------------------------------- ZIP */

function sha256(tampon) {
  return createHash('sha256').update(tampon).digest('hex');
}

/**
 * Écrit une archive ZIP en flux, entrée par entrée.
 * `entrees` : [{ chemin, donnees (Buffer), deflate (bool) }]
 * Renvoie le nombre d'octets écrits.
 */
function ecrireZip(descripteur, entrees, date) {
  const { heure, jour } = dateDos(date);
  const central = [];
  let position = 0;

  for (const { chemin, donnees, deflate } of entrees) {
    const nom = Buffer.from(chemin, 'utf8');
    const crc = zlib.crc32(donnees);
    let corps = donnees;
    let methode = 0;
    if (deflate && donnees.length > 128) {
      const compresse = zlib.deflateRawSync(donnees, { level: 9 });
      if (compresse.length < donnees.length) {
        corps = compresse;
        methode = 8;
      }
    }

    const entete = Buffer.alloc(30);
    entete.writeUInt32LE(0x04034b50, 0);
    entete.writeUInt16LE(20, 4);          // version nécessaire
    entete.writeUInt16LE(0x0800, 6);      // noms en UTF-8
    entete.writeUInt16LE(methode, 8);
    entete.writeUInt16LE(heure, 10);
    entete.writeUInt16LE(jour, 12);
    entete.writeUInt32LE(crc, 14);
    entete.writeUInt32LE(corps.length, 18);
    entete.writeUInt32LE(donnees.length, 22);
    entete.writeUInt16LE(nom.length, 26);
    entete.writeUInt16LE(0, 28);

    if (corps.length > 0xffffffff || donnees.length > 0xffffffff) {
      throw new Error(`Fichier trop volumineux pour ce format ZIP : ${chemin}`);
    }

    fs.writeSync(descripteur, entete);
    fs.writeSync(descripteur, nom);
    if (corps.length) fs.writeSync(descripteur, corps);

    central.push({ nom, methode, crc, compresse: corps.length, brut: donnees.length, decalage: position, heure, jour });
    position += entete.length + nom.length + corps.length;
  }

  const debutCentral = position;
  for (const e of central) {
    const entete = Buffer.alloc(46);
    entete.writeUInt32LE(0x02014b50, 0);
    entete.writeUInt16LE(20, 4);          // version d'écriture
    entete.writeUInt16LE(20, 6);          // version nécessaire
    entete.writeUInt16LE(0x0800, 8);
    entete.writeUInt16LE(e.methode, 10);
    entete.writeUInt16LE(e.heure, 12);
    entete.writeUInt16LE(e.jour, 14);
    entete.writeUInt32LE(e.crc, 16);
    entete.writeUInt32LE(e.compresse, 20);
    entete.writeUInt32LE(e.brut, 24);
    entete.writeUInt16LE(e.nom.length, 28);
    entete.writeUInt16LE(0, 30);          // extra
    entete.writeUInt16LE(0, 32);          // commentaire
    entete.writeUInt16LE(0, 34);          // disque
    entete.writeUInt16LE(0, 36);          // attributs internes
    entete.writeUInt32LE(0, 38);          // attributs externes
    entete.writeUInt32LE(e.decalage, 42);
    fs.writeSync(descripteur, entete);
    fs.writeSync(descripteur, e.nom);
    position += entete.length + e.nom.length;
  }

  const tailleCentral = position - debutCentral;
  const fin = Buffer.alloc(22);
  fin.writeUInt32LE(0x06054b50, 0);
  fin.writeUInt16LE(0, 4);
  fin.writeUInt16LE(0, 6);
  fin.writeUInt16LE(central.length, 8);
  fin.writeUInt16LE(central.length, 10);
  fin.writeUInt32LE(tailleCentral, 12);
  fin.writeUInt32LE(debutCentral, 16);
  fin.writeUInt16LE(0, 20);
  fs.writeSync(descripteur, fin);
  position += fin.length;

  return position;
}

/* --------------------------------------------------- lecture (vérification) */

function lireZip(chemin) {
  const tout = fs.readFileSync(chemin);
  // Repérage de l'enregistrement de fin de répertoire central.
  let fin = tout.length - 22;
  while (fin >= 0 && tout.readUInt32LE(fin) !== 0x06054b50) fin--;
  if (fin < 0) throw new Error('Archive invalide : fin de répertoire central introuvable.');

  const nombre = tout.readUInt16LE(fin + 10);
  let curseur = tout.readUInt32LE(fin + 16);
  const entrees = [];

  for (let i = 0; i < nombre; i++) {
    if (tout.readUInt32LE(curseur) !== 0x02014b50) throw new Error('Répertoire central corrompu.');
    const methode = tout.readUInt16LE(curseur + 10);
    const crc = tout.readUInt32LE(curseur + 16);
    const compresse = tout.readUInt32LE(curseur + 20);
    const brut = tout.readUInt32LE(curseur + 24);
    const longueurNom = tout.readUInt16LE(curseur + 28);
    const longueurExtra = tout.readUInt16LE(curseur + 30);
    const longueurCommentaire = tout.readUInt16LE(curseur + 32);
    const decalage = tout.readUInt32LE(curseur + 42);
    const nom = tout.subarray(curseur + 46, curseur + 46 + longueurNom).toString('utf8');
    curseur += 46 + longueurNom + longueurExtra + longueurCommentaire;

    const longueurNomLocal = tout.readUInt16LE(decalage + 26);
    const longueurExtraLocal = tout.readUInt16LE(decalage + 28);
    const debut = decalage + 30 + longueurNomLocal + longueurExtraLocal;
    const brutData = tout.subarray(debut, debut + compresse);
    const donnees = methode === 8 ? zlib.inflateRawSync(brutData) : brutData;

    entrees.push({ nom, crc, donnees, brut, methode });
  }
  return entrees;
}

/* ------------------------------------------------------------ fabrication */

function fichiersSuivis() {
  const sortie = execFileSync('git', ['ls-files', '-z'], { cwd: RACINE, encoding: 'buffer' });
  return sortie.toString('utf8').split('\0').filter(Boolean);
}

function construire() {
  const volume = (argValeur('--volume', 'leger') || 'leger').toLowerCase();
  if (!['leger', 'complet'].includes(volume)) {
    throw new Error(`Volume inconnu « ${volume} » : attendu « leger » ou « complet ».`);
  }
  const seuil = Number(argValeur('--seuil-mo', String(SEUIL_MO))) * 1024 * 1024;
  const sortie = path.resolve(RACINE, argValeur('--sortie', path.join(RACINE, NOM_PAR_DEFAUT)));
  const motDePasse = argValeur('--mot-de-passe', null);
  /* Disposition des fichiers du site dans l’archive :
       plateforme/  (défaut) tout sous un sous-dossier ;
       racine       fichiers directement à la racine de l’archive — la convention
                    la plus courante pour un installeur, qui dépose le contenu de
                    l’archive dans le dossier d’installation et attend index.html
                    juste à côté de l’exécutable. */
  const disposition = (argValeur('--disposition', 'plateforme') || 'plateforme').toLowerCase();
  if (!['plateforme', 'racine'].includes(disposition)) {
    throw new Error(`Disposition inconnue « ${disposition} » : attendu « plateforme » ou « racine ».`);
  }
  const prefixe = disposition === 'racine' ? '' : 'plateforme/';
  const dossierAnnonce = disposition === 'racine' ? '' : 'plateforme/';
  /* Date inscrite dans le manifeste. La figer (`--fabrique-le <iso>`) rend la
     fabrication strictement reproductible : deux machines au même commit
     produisent alors le même SHA-256 de paquet. */
  const fabriqueLe = argValeur('--fabrique-le', new Date().toISOString());

  const commit = git('rev-parse', 'HEAD');
  const commitCourt = commit.slice(0, 8);
  const dateCommit = git('show', '-s', '--format=%cI', 'HEAD');
  const versionSw = (() => {
    try {
      const sw = fs.readFileSync(path.join(RACINE, 'sw.js'), 'utf8');
      return (sw.match(/var\s+UPDATE_ID\s*=\s*"([^"]+)"/) || [])[1] || 'inconnue';
    } catch { return 'inconnue'; }
  })();

  const toutGarder = drapeaux('--tout');
  const exclus = [];
  const choisis = [];
  for (const relatif of fichiersSuivis()) {
    const absolu = path.join(RACINE, relatif);
    let stat;
    try { stat = fs.statSync(absolu); } catch { exclus.push({ chemin: relatif, motif: 'absent du disque' }); continue; }
    if (!stat.isFile()) continue;
    if (!toutGarder && !estDuSite(relatif)) {
      exclus.push({ chemin: relatif, motif: 'hors installation (tests, outillage ou fichier de dépôt)' });
      continue;
    }
    if (volume === 'leger' && stat.size > seuil) {
      exclus.push({ chemin: relatif, motif: `plus de ${tailleLisible(seuil)}` });
      continue;
    }
    choisis.push({ chemin: relatif, absolu, taille: stat.size });
  }
  choisis.sort((a, b) => (a.chemin < b.chemin ? -1 : a.chemin > b.chemin ? 1 : 0));

  process.stdout.write(`\n📦 STI-Labo3-Plateforme — volume ${volume}\n`);
  process.stdout.write(`   commit ${commitCourt} · ${dateCommit}\n`);
  process.stdout.write(`   ${choisis.length} fichiers retenus, ${exclus.length} écartés\n\n`);

  const fichiers = [];
  const entrees = [];
  let totalBrut = 0;

  for (const f of choisis) {
    const donnees = fs.readFileSync(f.absolu);
    totalBrut += donnees.length;
    const empreinte = sha256(donnees);
    fichiers.push({ chemin: `${prefixe}${f.chemin}`, octets: donnees.length, sha256: empreinte });
    entrees.push({
      chemin: `${prefixe}${f.chemin}`,
      donnees,
      deflate: !DEJA_COMPRIME.has(path.extname(f.chemin).toLowerCase())
    });
  }

  const manifeste = {
    format: FORMAT,
    nom: path.basename(sortie),
    plateforme: 'STI by AE — L’Atelier du Web',
    version: {
      updateId: versionSw,
      commit,
      commitCourt,
      date: dateCommit
    },
    fabriqueLe,
    volume,
    disposition,
    seuilOctetsParFichier: volume === 'leger' ? seuil : null,
    contenu: {
      dossier: dossierAnnonce,
      fichiers: fichiers.length,
      octetsDecompresses: totalBrut
    },
    acces: motDePasse
      ? (() => {
          const sel = randomBytes(16).toString('hex');
          const iterations = 210000;
          return {
            motDePasseInitial: {
              algorithme: 'PBKDF2-HMAC-SHA256',
              iterations,
              sel,
              verificateur: pbkdf2Sync(motDePasse, sel, iterations, 32, 'sha256').toString('hex'),
              note: 'Le mot de passe lui-même n’est pas stocké : seul ce vérificateur permet de contrôler sa saisie.'
            }
          };
        })()
      : { motDePasseInitial: null, note: 'Mot de passe demandé à l’installation, non fixé par le paquet.' },
    exclus,
    fichiers
  };

  const texteManifeste = Buffer.from(JSON.stringify(manifeste, null, 2) + '\n', 'utf8');
  const empreintes = Buffer.from(
    fichiers.map((f) => `${f.sha256}  ${f.chemin}`).join('\n') +
      `\n${sha256(texteManifeste)}  stipack.json\n`,
    'utf8'
  );
  const notice = Buffer.from(
    [
      'STI by AE — L’Atelier du Web',
      `Paquet d’installation ${path.basename(sortie)}`,
      '',
      `Version   : ${versionSw}`,
      `Commit    : ${commitCourt} (${commit})`,
      `Date      : ${dateCommit}`,
      `Volume    : ${volume}`,
      `Fichiers  : ${fichiers.length}`,
      '',
      'Contenu de l’archive :',
      '  stipack.json     manifeste : version, commit et empreinte SHA-256 de chaque fichier',
      '  empreintes.txt   mêmes empreintes, contrôlables par « sha256sum -c empreintes.txt »',
      disposition === 'racine'
        ? '  (racine)         tous les fichiers du site, à déposer tels quels'
        : '  plateforme/      tous les fichiers du site, à déposer tels quels',
      '',
      'Installation : lancer STI-Labo3-Windows.exe, sélectionner ce fichier,',
      'puis saisir le mot de passe initial demandé.',
      '',
      exclus.length
        ? [
            '',
            `⚠ Paquet allégé : ${exclus.length} fichier(s) du dépôt ne sont pas inclus`,
            '  (médias lourds). La liste exacte figure dans stipack.json > « exclus ».',
            '  Pour un paquet complet :',
            '    node outils/stipack/construire-stipack.mjs --volume complet',
            ''
          ].join('\n')
        : '',
      `Manifeste SHA-256 : ${sha256(texteManifeste)}`,
      ''
    ].join('\n'),
    'utf8'
  );

  const paquet = [
    { chemin: 'stipack.json', donnees: texteManifeste, deflate: true },
    { chemin: 'empreintes.txt', donnees: empreintes, deflate: true },
    { chemin: 'LISEZ-MOI.txt', donnees: notice, deflate: true },
    ...entrees
  ];

  fs.mkdirSync(path.dirname(sortie), { recursive: true });
  const temporaire = `${sortie}.partiel`;
  const descripteur = fs.openSync(temporaire, 'w');
  let octets;
  try {
    octets = ecrireZip(descripteur, paquet, dateCommit);
  } finally {
    fs.closeSync(descripteur);
  }
  fs.renameSync(temporaire, sortie);

  // Contrôle immédiat : on relit l'archive écrite et on compare empreintes + CRC.
  const relu = lireZip(sortie);
  const attendus = new Map(paquet.map((e) => [e.chemin, sha256(e.donnees)]));
  if (relu.length !== attendus.size) {
    throw new Error(`Contrôle échoué : ${relu.length} entrées relues pour ${attendus.size} attendues.`);
  }
  for (const e of relu) {
    if (attendus.get(e.nom) !== sha256(e.donnees)) {
      throw new Error(`Contrôle échoué : empreinte différente pour ${e.nom}.`);
    }
    if (zlib.crc32(e.donnees) !== e.crc) {
      throw new Error(`Contrôle échoué : CRC32 différent pour ${e.nom}.`);
    }
  }

  const empreintePaquet = sha256(fs.readFileSync(sortie));
  process.stdout.write(`✅ ${path.relative(RACINE, sortie) || sortie}\n`);
  process.stdout.write(`   taille sur disque   : ${tailleLisible(octets)}\n`);
  process.stdout.write(`   contenu décompressé : ${tailleLisible(totalBrut)}\n`);
  process.stdout.write(`   entrées vérifiées   : ${relu.length} (CRC32 + SHA-256)\n`);
  process.stdout.write(`   SHA-256 du paquet   : ${empreintePaquet}\n\n`);
  return { sortie, octets, empreintePaquet, fichiers: fichiers.length, exclus };
}

/* -------------------------------------------------------------- vérifier */

function verifier(chemin) {
  const cible = path.resolve(RACINE, chemin);
  let entrees;
  try {
    entrees = lireZip(cible);
  } catch (erreur) {
    process.stdout.write(`\n❌ ${chemin}\n   archive illisible ou corrompue : ${erreur.message}\n\n`);
    process.exitCode = 1;
    return;
  }
  const manifeste = JSON.parse(entrees.find((e) => e.nom === 'stipack.json').donnees.toString('utf8'));
  const parNom = new Map(entrees.map((e) => [e.nom, e]));

  let erreurs = 0;
  for (const f of manifeste.fichiers) {
    const e = parNom.get(f.chemin);
    if (!e) { process.stdout.write(`❌ absent : ${f.chemin}\n`); erreurs++; continue; }
    if (sha256(e.donnees) !== f.sha256) { process.stdout.write(`❌ empreinte : ${f.chemin}\n`); erreurs++; }
    if (zlib.crc32(e.donnees) !== e.crc) { process.stdout.write(`❌ CRC32 : ${f.chemin}\n`); erreurs++; }
  }
  const annonces = new Set(manifeste.fichiers.map((f) => f.chemin));
  for (const e of entrees) {
    if (!['stipack.json', 'empreintes.txt', 'LISEZ-MOI.txt'].includes(e.nom) && !annonces.has(e.nom)) {
      process.stdout.write(`➖ non déclaré dans le manifeste : ${e.nom}\n`);
    }
  }

  process.stdout.write(
    `\n${erreurs === 0 ? '✅' : '❌'} ${chemin}\n` +
      `   format ${manifeste.format} · commit ${manifeste.version.commitCourt} · volume ${manifeste.volume}\n` +
      `   ${manifeste.fichiers.length} fichiers annoncés, ${entrees.length} entrées, ${erreurs} anomalie(s)\n\n`
  );
  process.exitCode = erreurs === 0 ? 0 : 1;
}

/* ------------------------------------------------------------------ main */

try {
  const aVerifier = argValeur('--verifier', null);
  if (aVerifier) verifier(aVerifier);
  else construire();
} catch (erreur) {
  process.stderr.write(`\n❌ ${erreur.message}\n\n`);
  process.exitCode = 1;
}
