#!/usr/bin/env node
/* ============================================================================
 * preparer-disque.mjs — prépare le média d'installation pour 20 postes
 * ----------------------------------------------------------------------------
 * On prépare le disque dur (ou la clé USB) UNE SEULE FOIS, puis les 20 machines
 * s'installent à partir du même dossier, sans réseau :
 *
 *   STI-Labo3-20-postes/
 *   ├── STI-Labo3-Windows-v316.exe            l’installateur officiel
 *   ├── STI-Labo3-Plateforme.stipack          le paquet du dernier commit (complet)
 *   ├── LISEZ-MOI-20-POSTES.txt               la procédure, poste par poste
 *   ├── empreintes.txt                        SHA-256 de chaque fichier du média
 *   ├── verifier-media.ps1                    contrôle avant d’installer (un clic)
 *   └── MicrosoftEdgeWebView2Runtime-x64.exe  facultatif, si un poste manque de WebView2
 *
 * L’installateur démarre l’installation tout seul quand un .stipack se trouve à
 * côté de lui : sur chaque poste, il suffit d’ouvrir ce dossier et de lancer
 * l’EXE. Le contrôle des empreintes évite d’installer depuis un média abîmé.
 *
 * Le paquet est fabriqué par outils/stipack/construire-stipack.mjs, donc il
 * décrit le dernier commit du dépôt (git ls-files sur HEAD).
 *
 * Exemples :
 *   node outils/stipack/preparer-disque.mjs --sortie /media/USB/STI-Labo3-20-postes \
 *        --installeur ~/Téléchargements/STI-Labo3-Windows-v316.zip
 *   node outils/stipack/preparer-disque.mjs --volume leger --seuil-mo 0.5   (média réduit)
 *   node outils/stipack/preparer-disque.mjs --verifier /media/USB/STI-Labo3-20-postes
 * ========================================================================== */

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const RACINE = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const FABRIQUE = path.join(RACINE, 'outils', 'stipack', 'construire-stipack.mjs');
const NOM_PAQUET = 'STI-Labo3-Plateforme.stipack';
const NOM_EXE = 'STI-Labo3-Windows-v316.exe';
const NOM_PROCEDURE = 'LISEZ-MOI-20-POSTES.txt';
const NOM_EMPREINTES = 'empreintes.txt';
const NOM_VERIFIEUR = 'verifier-media.ps1';
const NOM_LANCEUR = 'verifier-media.cmd';
const NOM_WEBVIEW2 = 'MicrosoftEdgeWebView2Runtime-x64.exe';

/* Empreintes publiées avec la release windows-v316 : elles permettent de dire si
   l’installateur déposé sur le disque est bien celui que le site distribue. */
const CONNUES = new Map([
  ['ee3ca9e2de56441dc4478e27e81ff5e9b5b13b813b95f2654bb349ba49399b4a', { quoi: 'STI-Labo3-Windows-v316.exe', version: 'v316' }],
  ['dfa180f54a2610456590a2b573a6701e7cabcb58ec4ed8bf89c07b7a7600f4e7', { quoi: 'STI-Labo3-Windows-v316.zip', version: 'v316' }]
]);

function argValeur(nom, defaut = null) {
  const i = process.argv.indexOf(nom);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : defaut;
}

function drapeau(nom) {
  return process.argv.includes(nom);
}

function sha256Fichier(chemin) {
  const h = createHash('sha256');
  const fd = fs.openSync(chemin, 'r');
  const tampon = Buffer.allocUnsafe(1 << 20);
  try {
    let lus;
    while ((lus = fs.readSync(fd, tampon, 0, tampon.length, null)) > 0) h.update(tampon.subarray(0, lus));
  } finally {
    fs.closeSync(fd);
  }
  return h.digest('hex');
}

function tailleLisible(octets) {
  const unites = ['o', 'Ko', 'Mo', 'Go'];
  let i = 0;
  let v = octets;
  while (v >= 1024 && i < unites.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v >= 100 || i === 0 ? 0 : 1).replace('.', ',')} ${unites[i]}`;
}

/* ------------------------------------------------------------- ZIP (lecture) */

/* Extraction minimale : un ZIP de release ne contient que des fichiers stockés
   ou dégonflés, sans chiffrement. */
function extraireZip(archive, destination) {
  const tout = fs.readFileSync(archive);
  let fin = tout.length - 22;
  while (fin >= 0 && tout.readUInt32LE(fin) !== 0x06054b50) fin--;
  if (fin < 0) throw new Error('archive ZIP illisible');

  const nombre = tout.readUInt16LE(fin + 10);
  let curseur = tout.readUInt32LE(fin + 16);
  const extraits = [];

  for (let i = 0; i < nombre; i++) {
    const methode = tout.readUInt16LE(curseur + 10);
    const compresse = tout.readUInt32LE(curseur + 20);
    const longueurNom = tout.readUInt16LE(curseur + 28);
    const longueurExtra = tout.readUInt16LE(curseur + 30);
    const longueurCommentaire = tout.readUInt16LE(curseur + 32);
    const decalage = tout.readUInt32LE(curseur + 42);
    const nom = tout.subarray(curseur + 46, curseur + 46 + longueurNom).toString('utf8');
    curseur += 46 + longueurNom + longueurExtra + longueurCommentaire;

    if (nom.endsWith('/') || /(^|\/)\.\.(\/|$)/.test(nom)) continue;
    const nomLocal = tout.readUInt16LE(decalage + 26);
    const extraLocal = tout.readUInt16LE(decalage + 28);
    const debut = decalage + 30 + nomLocal + extraLocal;
    const corps = tout.subarray(debut, debut + compresse);
    const donnees = methode === 8 ? zlib.inflateRawSync(corps) : corps;
    const cible = path.join(destination, nom);
    fs.mkdirSync(path.dirname(cible), { recursive: true });
    fs.writeFileSync(cible, donnees);
    extraits.push(nom);
  }
  return extraits;
}

/* ------------------------------------------------------------- procédure */

function texteProcedure(infos) {
  const lignes = [
    'STI by AE — L’Atelier du Web',
    'MÉDIA D’INSTALLATION POUR 20 POSTES',
    '',
    `Paquet      : ${NOM_PAQUET}`,
    `Version     : ${infos.version || 'inconnue'}`,
    `Commit      : ${infos.commitCourt || 'inconnu'} (${infos.commit || 'sans commit'})`,
    `Volume      : ${infos.volume}${infos.seuil ? ` (fichiers jusqu’à ${tailleLisible(infos.seuil)})` : ' (tout le site)'}`,
    `Disposition : ${infos.disposition === 'racine' ? 'fichiers à la racine de l’archive' : 'fichiers sous plateforme/'}`,
    `Fichiers    : ${infos.fichiers}`,
    `Contenu     : ${tailleLisible(infos.octetsDecompresses)} décompressés`,
    `Préparé le  : ${infos.prepareLe}`,
    '',
    '──────────────────────────────────────────────────────────────',
    'CE QUE CONTIENT CE DOSSIER',
    '──────────────────────────────────────────────────────────────',
    '',
    `  ${NOM_EXE}`,
    '      l’installateur. Il démarre l’installation tout seul quand un',
    '      paquet .stipack se trouve à côté de lui.',
    `  ${NOM_PAQUET}`,
    '      la plateforme complète, telle qu’au dernier commit.',
    '  empreintes.txt',
    '      l’empreinte SHA-256 de chaque fichier du dossier.',
    '  verifier-media.cmd',
    '      double-clic : contrôle du dossier avant d’installer (recommandé).',
    '  verifier-media.ps1',
    '      le même contrôle, appelé par le fichier ci-dessus.',
    '',
    '──────────────────────────────────────────────────────────────',
    'SUR CHAQUE POSTE (une seule fois par machine)',
    '──────────────────────────────────────────────────────────────',
    '',
    '  1. Brancher le disque dur (ou la clé) sur le poste.',
    '',
    '  2. Contrôler le média : double-clic sur verifier-media.cmd',
    '     Le script compare chaque fichier à empreintes.txt et affiche OK ou',
    '     ABÎMÉ. (Équivalent en ligne de commande :',
    '      powershell -ExecutionPolicy Bypass -File .\\verifier-media.ps1 )',
    '',
    `  3. Lancer ${NOM_EXE}.`,
    '     → « Informations complémentaires » puis « Exécuter quand même »',
    '       si SmartScreen s’affiche (l’installateur n’est pas signé).',
    '     → Si le dossier manque de WebView2, installer d’abord',
    `       ${NOM_WEBVIEW2} (fourni si présent), puis relancer.`,
    '',
    '  4. L’installation reprend le paquet trouvé à côté de l’installateur.',
    '     Si elle le demande : sélectionner',
    `       ${NOM_PAQUET}`,
    '     puis saisir le mot de passe initial.',
    '',
    '  5. Vérifier : ouvrir le raccourci « STI by AE — L’Atelier du Web »,',
    '     la page d’accueil doit s’afficher sans Internet.',
    '',
    '  6. Débrancher le disque et passer au poste suivant.',
    '',
    '──────────────────────────────────────────────────────────────',
    'RÉINSTALLATION / MISE À JOUR D’UN POSTE',
    '──────────────────────────────────────────────────────────────',
    '',
    '  Le même dossier sert à remettre un poste d’aplomb : relancer l’EXE,',
    '  la nouvelle version remplace l’ancienne et son raccourci.',
    '',
    '  Pour régénérer ce média avec la toute dernière version du site :',
    '    node outils/stipack/preparer-disque.mjs --sortie <dossier du disque>',
    '',
    '──────────────────────────────────────────────────────────────',
    'SUIVI DES 20 POSTES',
    '──────────────────────────────────────────────────────────────',
    '',
    '  Noter au fur et à mesure (ou imprimer cette page) :',
    '',
    '   poste | date | vérif. média | installé | accueil OK | mot de passe remis',
    '   ------+------+--------------+----------+------------+------------------',
    ...Array.from({ length: 20 }, (_, i) => `   ${String(i + 1).padEnd(5)} |      |              |          |            |`),
    ''
  ];
  return lignes.join('\n');
}

function texteVerifieur() {
  return `# verifier-media.ps1 — contrôle du média d'installation STI by AE
# Compare chaque fichier du dossier à empreintes.txt (SHA-256).
# Usage : clic droit > Exécuter avec PowerShell, ou
#         powershell -ExecutionPolicy Bypass -File .\\verifier-media.ps1

$ErrorActionPreference = 'Stop'
$dossier = Split-Path -Parent $MyInvocation.MyCommand.Path
$liste = Join-Path $dossier '${NOM_EMPREINTES}'

if (-not (Test-Path $liste)) {
  Write-Host 'empreintes.txt est absent : média incomplet.' -ForegroundColor Red
  exit 1
}

$ok = 0
$ko = 0
$manquants = 0
$lignes = Get-Content -LiteralPath $liste | Where-Object { $_ -match '^[0-9a-f]{64}  ' }

foreach ($ligne in $lignes) {
  $attendu = $ligne.Substring(0, 64)
  $relatif = $ligne.Substring(66)
  $fichier = Join-Path $dossier $relatif

  if (-not (Test-Path -LiteralPath $fichier)) {
    Write-Host ("MANQUANT  " + $relatif) -ForegroundColor Yellow
    $manquants++
    continue
  }

  $obtenu = (Get-FileHash -LiteralPath $fichier -Algorithm SHA256).Hash.ToLower()
  if ($obtenu -eq $attendu) {
    Write-Host ("OK        " + $relatif) -ForegroundColor Green
    $ok++
  } else {
    Write-Host ("ABIME     " + $relatif) -ForegroundColor Red
    Write-Host ("          attendu " + $attendu) -ForegroundColor DarkGray
    Write-Host ("          obtenu  " + $obtenu) -ForegroundColor DarkGray
    $ko++
  }
}

Write-Host ''
Write-Host ("Bilan : " + $ok + " fichier(s) conforme(s), " + $ko + " abime(s), " + $manquants + " manquant(s).")
if ($ko -or $manquants) {
  Write-Host 'Ne pas installer depuis ce média : recopier le dossier depuis l’original.' -ForegroundColor Red
  exit 1
}
Write-Host 'Média conforme : vous pouvez lancer l’installateur.' -ForegroundColor Green
exit 0
`;
}

function texteLanceur() {
  return [
    '@echo off',
    'rem Double-clic : contrôle du média d’installation STI by AE, puis pause.',
    'chcp 65001 >nul',
    'powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0' + NOM_VERIFIEUR + '"',
    'echo.',
    'pause',
    ''
  ].join('\r\n');
}

/* ------------------------------------------------------------- fabrication */

function construire() {
  const sortie = path.resolve(RACINE, argValeur('--sortie', path.join(RACINE, 'dist-stipack', 'STI-Labo3-20-postes')));
  const volume = (argValeur('--volume', 'complet') || 'complet').toLowerCase();
  const seuilMo = argValeur('--seuil-mo', null);
  const installeur = argValeur('--installeur', null);
  const webview2 = argValeur('--webview2', null);
  const disposition = (argValeur('--disposition', 'plateforme') || 'plateforme').toLowerCase();

  fs.mkdirSync(sortie, { recursive: true });
  process.stdout.write(`\n💾 Média d’installation — ${sortie}\n`);
  process.stdout.write(`   volume ${volume}${seuilMo ? ` · seuil ${seuilMo} Mo` : ''}\n\n`);

  /* 1. Le paquet, fabriqué au dernier commit. */
  const argsFabrique = [FABRIQUE, '--volume', volume, '--disposition', disposition, '--sortie', path.join(sortie, NOM_PAQUET)];
  if (seuilMo && volume === 'leger') argsFabrique.push('--seuil-mo', String(seuilMo));
  process.stdout.write('① Fabrication du paquet (dernier commit)…\n');
  const sortieFabrique = execFileSync('node', argsFabrique, { cwd: RACINE, encoding: 'utf8' });
  const paquet = path.join(sortie, NOM_PAQUET);
  const manifeste = JSON.parse(
    execFileSync('node', ['-e', `
      const {execFileSync} = require('node:child_process');
      // relit le manifeste du paquet fabriqué via l'outil du dépôt
      const fs = require('node:fs'); const zlib = require('node:zlib');
      const tout = fs.readFileSync(process.argv[1]);
      let fin = tout.length - 22;
      while (fin >= 0 && tout.readUInt32LE(fin) !== 0x06054b50) fin--;
      const nombre = tout.readUInt16LE(fin + 10);
      let c = tout.readUInt32LE(fin + 16);
      for (let i = 0; i < nombre; i++) {
        const methode = tout.readUInt16LE(c + 10);
        const compresse = tout.readUInt32LE(c + 20);
        const ln = tout.readUInt16LE(c + 28), le = tout.readUInt16LE(c + 30), lc = tout.readUInt16LE(c + 32);
        const decalage = tout.readUInt32LE(c + 42);
        const nom = tout.subarray(c + 46, c + 46 + ln).toString('utf8');
        c += 46 + ln + le + lc;
        if (nom !== 'stipack.json') continue;
        const nl = tout.readUInt16LE(decalage + 26), el = tout.readUInt16LE(decalage + 28);
        const debut = decalage + 30 + nl + el;
        const corps = tout.subarray(debut, debut + compresse);
        process.stdout.write((methode === 8 ? zlib.inflateRawSync(corps) : corps).toString('utf8'));
        break;
      }
    `, paquet], { encoding: 'utf8' })
  );
  process.stdout.write(`   ${tailleLisible(fs.statSync(paquet).size)} · ${manifeste.contenu.fichiers} fichiers · commit ${manifeste.version.commitCourt}\n`);

  /* 2. L’installateur : copié, extrait d’un ZIP au besoin, et vérifié. */
  let nomInstalleur = null;
  if (installeur) {
    const source = path.resolve(installeur);
    if (!fs.existsSync(source)) throw new Error(`installateur introuvable : ${source}`);
    const empreinteSource = sha256Fichier(source);
    const connue = CONNUES.get(empreinteSource);

    process.stdout.write('② Installateur…\n');
    if (/\.zip$/i.test(source)) {
      const dossierExtraction = path.join(sortie, '.extraction');
      fs.mkdirSync(dossierExtraction, { recursive: true });
      const extraits = extraireZip(source, dossierExtraction);
      const exe = extraits.find((n) => /\.exe$/i.test(n));
      if (!exe) throw new Error('aucun .exe dans l’archive fournie');
      nomInstalleur = NOM_EXE;
      fs.copyFileSync(path.join(dossierExtraction, exe), path.join(sortie, nomInstalleur));
      fs.rmSync(dossierExtraction, { recursive: true, force: true });
      process.stdout.write(`   ZIP ${connue ? `reconnu (${connue.version})` : 'INCONNU'} → ${nomInstalleur}\n`);
    } else {
      nomInstalleur = path.basename(source);
      fs.copyFileSync(source, path.join(sortie, nomInstalleur));
      process.stdout.write(`   ${nomInstalleur} ${connue ? `reconnu (${connue.version})` : '— empreinte INCONNUE'}\n`);
    }
    if (!connue && !drapeau('--accepter-installeur-inconnu')) {
      throw new Error(
        'l’installateur ne correspond à aucune empreinte publiée (v316).\n' +
        '   Vérifiez l’origine du fichier, ou relancez avec --accepter-installeur-inconnu.'
      );
    }
    const empreinteCopie = sha256Fichier(path.join(sortie, nomInstalleur));
    if (empreinteCopie !== sha256Fichier(source) && !/\.zip$/i.test(source)) {
      throw new Error('la copie de l’installateur diffère de la source');
    }
  } else {
    process.stdout.write(`② Installateur : non fourni — déposez ${NOM_EXE} dans ce dossier\n`);
  }

  /* 3. WebView2 facultatif. */
  if (webview2) {
    const source = path.resolve(webview2);
    if (!fs.existsSync(source)) throw new Error(`WebView2 introuvable : ${source}`);
    fs.copyFileSync(source, path.join(sortie, NOM_WEBVIEW2));
    process.stdout.write(`③ WebView2 copié (${tailleLisible(fs.statSync(source).size)})\n`);
  }

  /* 4. Procédure et vérificateur. */
  const prepareLe = new Date().toISOString();
  fs.writeFileSync(path.join(sortie, NOM_PROCEDURE), texteProcedure({
    version: manifeste.version.updateId,
    commit: manifeste.version.commit,
    commitCourt: manifeste.version.commitCourt,
    volume: manifeste.volume,
    disposition: manifeste.disposition,
    seuil: manifeste.seuilOctetsParFichier,
    fichiers: manifeste.contenu.fichiers,
    octetsDecompresses: manifeste.contenu.octetsDecompresses,
    prepareLe
  }), 'utf8');
  fs.writeFileSync(path.join(sortie, NOM_VERIFIEUR), texteVerifieur(), 'utf8');
  fs.writeFileSync(path.join(sortie, NOM_LANCEUR), texteLanceur(), 'utf8');
  process.stdout.write('④ Procédure et vérificateur écrits\n');

  /* 5. Empreintes de tous les fichiers du média. */
  const fichiers = fs.readdirSync(sortie, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name !== NOM_EMPREINTES)
    .map((e) => e.name)
    .sort();
  const lignes = fichiers.map((nom) => `${sha256Fichier(path.join(sortie, nom))}  ${nom}`);
  fs.writeFileSync(path.join(sortie, NOM_EMPREINTES), lignes.join('\n') + '\n', 'utf8');
  const totalOctets = fichiers.reduce((somme, nom) => somme + fs.statSync(path.join(sortie, nom)).size, 0);
  process.stdout.write(`⑤ ${NOM_EMPREINTES} : ${fichiers.length} fichier(s), ${tailleLisible(totalOctets)}\n`);

  const sansInstalleur = !nomInstalleur;
  process.stdout.write('\n' + '─'.repeat(62) + '\n');
  for (const nom of fichiers) {
    process.stdout.write(`  ${nom.padEnd(38)} ${tailleLisible(fs.statSync(path.join(sortie, nom)).size).padStart(9)}\n`);
  }
  process.stdout.write('─'.repeat(62) + '\n');
  process.stdout.write(
    sansInstalleur
      ? `\n⚠ Média incomplet : ${NOM_EXE} doit être déposé dans ce dossier.\n` +
        '  (téléchargement : release windows-v316 du dépôt STiV2.0)\n\n'
      : `\n✅ Média prêt : copier ce dossier sur le disque dur / la clé, une seule fois.\n` +
        `   Sur chaque poste : double-clic sur ${NOM_LANCEUR}, puis lancer ${nomInstalleur}.\n\n`
  );
  return { sortie, fichiers, totalOctets, manifeste, sansInstalleur };
}

/* -------------------------------------------------------------- vérifier */

function verifier(dossier) {
  const cible = path.resolve(RACINE, dossier);
  const liste = path.join(cible, NOM_EMPREINTES);
  if (!fs.existsSync(liste)) throw new Error(`empreintes.txt absent de ${cible}`);

  const attendus = fs.readFileSync(liste, 'utf8').trim().split('\n').filter(Boolean);
  let erreurs = 0;
  for (const ligne of attendus) {
    const [attendu, nom] = ligne.split(/\s{2}/);
    const fichier = path.join(cible, nom);
    if (!fs.existsSync(fichier)) {
      process.stdout.write(`❌ manquant : ${nom}\n`);
      erreurs++;
      continue;
    }
    const obtenu = sha256Fichier(fichier);
    if (obtenu !== attendu) {
      process.stdout.write(`❌ abîmé   : ${nom}\n`);
      erreurs++;
    }
  }
  const presents = fs.readdirSync(cible).filter((n) => n !== NOM_EMPREINTES);
  const declares = new Set(attendus.map((l) => l.split(/\s{2}/)[1]));
  for (const nom of presents) {
    if (!declares.has(nom)) process.stdout.write(`➖ non déclaré : ${nom}\n`);
  }

  process.stdout.write(
    `\n${erreurs === 0 ? '✅' : '❌'} ${cible}\n` +
    `   ${attendus.length} fichier(s) contrôlé(s), ${erreurs} anomalie(s)\n\n`
  );
  process.exitCode = erreurs === 0 ? 0 : 1;
}

try {
  const aVerifier = argValeur('--verifier', null);
  if (aVerifier) verifier(aVerifier);
  else construire();
} catch (erreur) {
  process.stderr.write(`\n❌ ${erreur.message}\n\n`);
  process.exitCode = 1;
}
