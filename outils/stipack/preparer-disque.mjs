#!/usr/bin/env node
/* ============================================================================
 * preparer-disque.mjs — prépare le média d'installation pour 20 postes
 * ----------------------------------------------------------------------------
 * On prépare le disque dur (ou la clé USB) UNE SEULE FOIS, puis les 20 machines
 * s'installent à partir du même dossier, sans réseau :
 *
 *   STI-Labo3-20-postes/
 *   ├── STI-Labo3-Installation.exe            l’installateur « version spéciale Labo 3 »
 *   ├── STI-Labo3-Plateforme.stipack          le paquet du dernier commit (complet)
 *   ├── LISEZ-MOI-20-POSTES.txt               la procédure, poste par poste
 *   ├── empreintes.txt                        SHA-256 de chaque fichier du média
 *   ├── verifier-media.cmd                    contrôle avant d’installer (double-clic)
 *   └── autorisation-labo3.json               OPTIONNEL : restreint à 20 postes
 *
 * L’installateur détecte le paquet placé à côté de lui : sur chaque poste, il
 * suffit d’ouvrir ce dossier, de lancer l’EXE et de confirmer. Aucun mot de passe
 * n’est demandé, aucune clé, aucun relevé d’empreinte de poste. Le contrôle des
 * empreintes évite d’installer depuis un média abîmé. WebView2 n’est plus requis :
 * la plateforme s’ouvre dans le navigateur du poste, servi par un serveur
 * strictement local.
 *
 * Deux modes, au choix :
 *   simple (défaut)   aucun fichier d’autorisation : toute machine qui reçoit ce
 *                     dossier peut installer. C’est le parcours « copier,
 *                     double-cliquer, installer ».
 *   restreint         --autorisation <fichier signé> : seuls les postes de la
 *                     liste (20 maximum) sont acceptés, et l’exécutable doit
 *                     avoir été compilé avec la clé publique correspondante.
 *
 * L’exécutable simple est publié automatiquement par la CI dans la release
 * `labo3-windows` (lien de téléchargement dans le tableau de bord). Passer son
 * SHA-256 via --empreinte-attendue pour garantir que le binaire copié est bien
 * celui qui a été produit.
 *
 * Le paquet est fabriqué par outils/stipack/construire-stipack.mjs, donc il
 * décrit le dernier commit du dépôt (git ls-files sur HEAD).
 *
 * Exemples :
 *   # mode simple (recommandé)
 *   node outils/stipack/preparer-disque.mjs --sortie /media/USB/STI-Labo3-20-postes \
 *        --installeur ~/Téléchargements/STI-Labo3-Installation.exe --empreinte-attendue 9f2c…
 *   # mode restreint à 20 postes signés
 *   node outils/stipack/preparer-disque.mjs --sortie /media/USB/STI-Labo3-20-postes \
 *        --installeur ~/Téléchargements/STI-Labo3-Installation.exe \
 *        --empreinte-attendue 9f2c… --autorisation ~/prive/autorisation-labo3.json
 *   node outils/stipack/preparer-disque.mjs --volume leger --seuil-mo 0.5 \
 *        --accepter-volume-leger   (média réduit, refusé par l'installateur Labo 3)
 *   node outils/stipack/preparer-disque.mjs --verifier /media/USB/STI-Labo3-20-postes
 * ========================================================================== */

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { inspecterAutorisation } from './autorisation-labo3.mjs';

const RACINE = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const FABRIQUE = path.join(RACINE, 'outils', 'stipack', 'construire-stipack.mjs');
const NOM_PAQUET = 'STI-Labo3-Plateforme.stipack';
const NOM_EXE = 'STI-Labo3-Installation.exe';
const NOM_AUTORISATION = 'autorisation-labo3.json';
const NOM_PROCEDURE = 'LISEZ-MOI-20-POSTES.txt';
const NOM_EMPREINTES = 'empreintes.txt';
const NOM_VERIFIEUR = 'verifier-media.ps1';
const NOM_LANCEUR = 'verifier-media.cmd';
/* L’exécutable est compilé par l’administrateur avec sa propre clé publique :
   aucune empreinte ne peut être publiée d’avance ici. --empreinte-attendue la
   remplace ; à défaut, un consentement explicite est exigé. */

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
    `Mode        : ${infos.restreint
      ? `restreint — ${infos.postes} poste(s) autorisé(s) par signature`
      : 'simple — aucune restriction, tout poste recevant ce dossier peut installer'}`,
    '',
    '──────────────────────────────────────────────────────────────',
    'CE QUE CONTIENT CE DOSSIER',
    '──────────────────────────────────────────────────────────────',
    '',
    `  ${NOM_EXE}`,
    '      l’installateur « STI v2.0 version spéciale Labo 3 ». Il détecte le',
    '      paquet placé à côté de lui.',
    `  ${NOM_PAQUET}`,
    '      la plateforme complète, telle qu’au dernier commit.',
    ...(infos.restreint
      ? [`  ${NOM_AUTORISATION}`,
         '      la liste signée des postes autorisés (20 maximum). Sans elle,',
         '      l’installateur refuse de continuer.']
      : [`  ${NOM_AUTORISATION}  (absent : mode simple)`,
         '      ce dossier n’impose aucune liste de postes. Pour restreindre à 20',
         '      machines, régénérer le média avec --autorisation et un exécutable',
         '      compilé avec la clé publique correspondante.']),
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
    '',
    '  4. Confirmer l’installation : le paquet du dossier est repris',
    '     automatiquement. AUCUN mot de passe n’est demandé, aucune connexion au',
    '     portail n’est nécessaire.',
    ...(infos.restreint
      ? ['     → « Ce poste n’est pas autorisé pour le Labo 3 » signifie que son',
         '       empreinte ne figure pas dans la liste signée : refaire un relevé',
         '       et régénérer l’autorisation, pas réinstaller.']
      : []),
    '',
    '  5. Vérifier : la plateforme s’ouvre dans le navigateur, sans Internet.',
    '     La boîte d’installation se ferme seule : le serveur tourne sans',
    '     fenêtre, avec une icône dans la barre des tâches (double-clic =',
    '     rouvrir, clic droit = quitter). Le raccourci créé sur le Bureau',
    '     rouvre la plateforme directement, sans réafficher l’installation.',
    '',
    '  6. Débrancher le disque et passer au poste suivant.',
    '',
    '──────────────────────────────────────────────────────────────',
    'RÉINSTALLATION / MISE À JOUR D’UN POSTE',
    '──────────────────────────────────────────────────────────────',
    '',
    '  Le même dossier sert à remettre un poste d’aplomb : relancer l’EXE installe',
    '  une version supplémentaire sans supprimer la précédente, puis remplace le',
    '  raccourci. En cas d’échec, l’ancienne version reste utilisable.',
    '',
    '  Pour régénérer ce média avec la toute dernière version du site :',
    '    node outils/stipack/preparer-disque.mjs --sortie <dossier du disque> \\',
    '      --installeur <STI-Labo3-Installation.exe> --empreinte-attendue <sha256>',
    ...(infos.restreint
      ? ['      --autorisation <autorisation-labo3.json>']
      : []),
    '',
    '──────────────────────────────────────────────────────────────',
    'CE QUE CE MEDIA NE FAIT PAS',
    '──────────────────────────────────────────────────────────────',
    '',
    '  Hors ligne, les services en ligne restent indisponibles : comptes du portail,',
    '  progressions synchronisées, quiz enregistrés côté serveur. Les fichiers sont',
    '  locaux ; ces services, non. Ne pas promettre ces fonctions aux élèves.',
    '',
    '  La clé privée de signature ne doit JAMAIS être copiée sur ce support.',
    '',
    '──────────────────────────────────────────────────────────────',
    'SUIVI DES 20 POSTES',
    '──────────────────────────────────────────────────────────────',
    '',
    '  Noter au fur et à mesure (ou imprimer cette page) :',
    '',
    '   poste | date | vérif. média | autorisé | installé | accueil hors ligne OK',
    '   ------+------+--------------+----------+----------+----------------------',
    ...Array.from({ length: 20 }, (_, i) => `   ${String(i + 1).padEnd(5)} |      |              |          |          |`),
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
  const autorisation = argValeur('--autorisation', null);
  const empreinteAttendue = (argValeur('--empreinte-attendue', null) || '').trim().toLowerCase();
  const disposition = (argValeur('--disposition', 'plateforme') || 'plateforme').toLowerCase();

  /* L'installateur Windows n'installe que des paquets complets : préparer un support
     allégé produirait une clé que les 20 postes refuseraient. Le refus tombe avant
     toute écriture sur le support ; l'échappatoire est explicite. */
  if (volume !== 'complet' && !process.argv.includes('--accepter-volume-leger')) {
    throw new Error(
      `--volume ${volume} refusé : l'installateur « STI v2.0 version spéciale Labo 3 » n'installe que des paquets complets.\n` +
      '  Refaites le support avec --volume complet (défaut), ou assumez l\'incompatibilité avec --accepter-volume-leger.'
    );
  }

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

  /* 2. L’installateur : copié, extrait d’un ZIP au besoin, et vérifié.
        Aucune empreinte n’est publiée d’avance : le binaire est compilé avec la
        clé publique de l’administrateur. --empreinte-attendue est le SHA-256
        affiché par compiler.ps1 (ou SHA256SUMS.txt de l’artefact). */
  let nomInstalleur = null;
  if (installeur) {
    const source = path.resolve(installeur);
    if (!fs.existsSync(source)) throw new Error(`installateur introuvable : ${source}`);
    process.stdout.write('② Installateur…\n');
    let empreinteSource;
    let sourceExe;
    let dossierExtraction = null;
    if (/\.zip$/i.test(source)) {
      dossierExtraction = path.join(sortie, '.extraction');
      fs.mkdirSync(dossierExtraction, { recursive: true });
      const extraits = extraireZip(source, dossierExtraction);
      const exe = extraits.find((n) => /\.exe$/i.test(n));
      if (!exe) throw new Error('aucun .exe dans l’archive fournie');
      nomInstalleur = NOM_EXE;
      sourceExe = path.join(dossierExtraction, exe);
      process.stdout.write(`   ZIP → ${nomInstalleur}\n`);
    } else {
      nomInstalleur = path.basename(source);
      sourceExe = source;
      process.stdout.write(`   ${nomInstalleur}\n`);
    }
    empreinteSource = sha256Fichier(sourceExe);
    process.stdout.write(`   sha256 : ${empreinteSource}\n`);

    /* Contrôle avant copie : un binaire refusé ne doit rien laisser sur le média. */
    if (empreinteAttendue) {
      if (empreinteSource !== empreinteAttendue) {
        if (dossierExtraction) fs.rmSync(dossierExtraction, { recursive: true, force: true });
        throw new Error(
          `l’installateur ne correspond pas à l’empreinte attendue.\n` +
          `   attendu : ${empreinteAttendue}\n   obtenu  : ${empreinteSource}`
        );
      }
      process.stdout.write('   empreinte attendue : conforme\n');
    } else if (!drapeau('--accepter-installeur-inconnu')) {
      if (dossierExtraction) fs.rmSync(dossierExtraction, { recursive: true, force: true });
      throw new Error(
        'empreinte de l’installateur non vérifiée.\n' +
        '   Passez --empreinte-attendue <sha256> (affiché par compiler.ps1 ou\n' +
        '   SHA256SUMS.txt de l’artefact), ou --accepter-installeur-inconnu\n' +
        '   si vous assumez ce binaire sans contrôle.'
      );
    } else {
      process.stdout.write('   ⚠ empreinte non vérifiée (--accepter-installeur-inconnu)\n');
    }

    /* En-tête MZ lu sur 2 octets : évite de charger un binaire de 150 Mo. */
    const descripteur = fs.openSync(sourceExe, 'r');
    const entete = Buffer.alloc(2);
    try { fs.readSync(descripteur, entete, 0, 2, 0); } finally { fs.closeSync(descripteur); }
    if (entete.toString('latin1') !== 'MZ') {
      if (dossierExtraction) fs.rmSync(dossierExtraction, { recursive: true, force: true });
      throw new Error('le fichier fourni n’est pas un exécutable Windows (en-tête MZ absent)');
    }

    fs.copyFileSync(sourceExe, path.join(sortie, nomInstalleur));
    if (dossierExtraction) fs.rmSync(dossierExtraction, { recursive: true, force: true });
    if (sha256Fichier(path.join(sortie, nomInstalleur)) !== empreinteSource) {
      throw new Error('la copie de l’installateur diffère de la source');
    }
  } else {
    process.stdout.write(`② Installateur : non fourni — déposez ${NOM_EXE} dans ce dossier\n`);
  }

  /* 3. L’autorisation signée : OPTIONNELLE. Absente, le média est en mode
        simple et tout poste peut installer. Présente, elle restreint aux postes
        listés — la signature est vérifiée par l’exécutable avec la clé publique
        embarquée à la compilation. Contrôle de structure seulement ici. */
  let postesAutorises = null;
  if (autorisation) {
    const source = path.resolve(autorisation);
    if (!fs.existsSync(source)) throw new Error(`autorisation introuvable : ${source}`);
    let enveloppe;
    try { enveloppe = JSON.parse(fs.readFileSync(source, 'utf8')); }
    catch (erreur) { throw new Error(`autorisation illisible : ${erreur.message}`); }
    const infos = inspecterAutorisation(enveloppe);
    postesAutorises = infos.postes;
    fs.copyFileSync(source, path.join(sortie, NOM_AUTORISATION));
    process.stdout.write(`③ Autorisation copiée : ${infos.postes} poste(s) — ${infos.laboratoire}\n`);
    if (sha256Fichier(path.join(sortie, NOM_AUTORISATION)) !== sha256Fichier(source)) {
      throw new Error('la copie de l’autorisation diffère de la source');
    }
    process.stdout.write('   ⚠ La signature n’est pas vérifiée ici : seul l’exécutable compilé\n' +
      '     avec votre clé publique peut le faire. Ne jamais copier la clé privée.\n');
  } else {
    process.stdout.write('③ Autorisation : aucune — mode simple, tous les postes acceptés\n' +
      '   (pour restreindre à 20 machines : --autorisation <fichier signé>)\n');
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
    prepareLe,
    restreint: Boolean(postesAutorises),
    postes: postesAutorises
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
  const sansAutorisation = !postesAutorises;
  process.stdout.write('\n' + '─'.repeat(62) + '\n');
  for (const nom of fichiers) {
    process.stdout.write(`  ${nom.padEnd(38)} ${tailleLisible(fs.statSync(path.join(sortie, nom)).size).padStart(9)}\n`);
  }
  process.stdout.write('─'.repeat(62) + '\n');
  if (sansInstalleur) {
    process.stdout.write('\n⚠ Média incomplet :\n' +
      `   • ${NOM_EXE} — publié par la CI dans la release labo3-windows (lien de\n` +
      '     téléchargement dans le tableau de bord), ou outils/windows-labo3/compiler.ps1.\n' +
      '   Sans lui, l’installation est impossible sur les postes.\n\n');
  } else {
    process.stdout.write(
      `\n✅ Média prêt (${sansAutorisation ? 'mode simple, sans restriction de postes' : `mode restreint, ${postesAutorises} poste(s) autorisé(s)`}) :\n` +
      '   copier ce dossier sur le disque dur / la clé, une seule fois.\n' +
      `   Sur chaque poste : double-clic sur ${NOM_LANCEUR}, puis lancer ${nomInstalleur}\n` +
      '   et confirmer. Aucun mot de passe, aucune clé, aucun réseau.\n\n'
    );
  }
  return { sortie, fichiers, totalOctets, manifeste, sansInstalleur, sansAutorisation, postesAutorises };
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
