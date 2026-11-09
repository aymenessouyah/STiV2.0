/*
  Média d'installation pour 20 postes — outils/stipack/preparer-disque.mjs

  Le professeur prépare le support UNE fois (disque dur ou clé USB), puis installe
  les 20 machines à partir du même dossier, sans réseau. Ces tests verrouillent :

    1. la composition du média (installateur + paquet + autorisation signée +
       procédure + vérificateur) ;
    2. la fraîcheur : le paquet du média est celui du commit courant ;
    3. le contrôle d'intégrité : média conforme = code 0, média abîmé = code 1,
       ce que le script PowerShell reproduit sur chaque poste ;
    4. le refus d'un installateur dont l'empreinte n'est pas celle attendue,
       d'un fichier qui n'est pas un EXE, et d'une autorisation malformée.

  Les fabrications se font dans un dossier temporaire, avec un seuil minuscule,
  pour rester rapides : ce sont la composition et les contrôles qui sont testés,
  pas le poids du média.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateKeyPairSync } from 'node:crypto';
import { creerAutorisation, empreintePoste } from '../outils/stipack/autorisation-labo3.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUTIL = join(root, 'outils', 'stipack', 'preparer-disque.mjs');

function sha256(chemin) {
  return createHash('sha256').update(readFileSync(chemin)).digest('hex');
}

function dossierTemporaire() {
  return mkdtempSync(join(tmpdir(), 'media-sti-'));
}

/* Lance l'outil et rend { code, sortie } sans lever d'exception. */
function lancer(args) {
  try {
    const sortie = execFileSync('node', [OUTIL, ...args], { cwd: root, encoding: 'utf8', stdio: 'pipe' });
    return { code: 0, sortie };
  } catch (erreur) {
    return { code: erreur.status, sortie: String(erreur.stdout || '') + String(erreur.stderr || '') };
  }
}

/* Un faux installateur, avec son archive ZIP, pour les chemins de copie et
   d'extraction. L'en-tête MZ est présent : c'est ce que l'outil vérifie. Son
   empreinte n'est connue d'aucune release, d'où le consentement explicite. */
function fauxInstallateur(dossier) {
  const exe = join(dossier, 'STI-Labo3-Installation.exe');
  writeFileSync(exe, 'MZ faux installateur pour les tests\n');
  const zip = join(dossier, 'STI-Labo3-Installation.zip');
  execFileSync('python3', ['-c', `
import zipfile
z = zipfile.ZipFile(${JSON.stringify(zip)}, 'w', zipfile.ZIP_DEFLATED)
z.write(${JSON.stringify(exe)}, 'STI-Labo3-Installation.exe')
z.close()
`]);
  return { exe, zip };
}

/* Autorisation signée valide pour deux postes fictifs. */
function autorisationValide(dossier, postes = 2) {
  const { privateKey } = generateKeyPairSync('ed25519');
  const guid = (n) => `00000000-0000-0000-0000-00000000000${n}`;
  const contenu = creerAutorisation(
    Array.from({ length: postes }, (_, i) => empreintePoste(guid(i + 1))),
    privateKey.export({ type: 'pkcs8', format: 'pem' })
  );
  const chemin = join(dossier, 'autorisation-labo3.json');
  writeFileSync(chemin, JSON.stringify(contenu, null, 2));
  return chemin;
}

test('média : dossier complet, procédure et vérificateur, paquet du commit courant', () => {
  const dossier = dossierTemporaire();
  try {
    const media = join(dossier, 'media');
    const faux = fauxInstallateur(dossier);
    const { code, sortie } = lancer([
      '--volume', 'leger', '--seuil-mo', '0.2',
      '--sortie', media,
      '--installeur', faux.exe,
      '--empreinte-attendue', sha256(faux.exe),
      '--autorisation', autorisationValide(dossier)
    ]);
    assert.equal(code, 0, sortie);

    const noms = readdirSync(media).sort();
    assert.deepEqual(noms, [
      'LISEZ-MOI-20-POSTES.txt',
      'STI-Labo3-Installation.exe',
      'STI-Labo3-Plateforme.stipack',
      'autorisation-labo3.json',
      'empreintes.txt',
      'verifier-media.cmd',
      'verifier-media.ps1'
    ]);

    /* L'installateur est bien celui fourni, à l'octet près. */
    assert.equal(sha256(join(media, 'STI-Labo3-Installation.exe')), sha256(faux.exe));
    assert.match(sortie, /empreinte attendue : conforme/);
    assert.match(sortie, /Autorisation copiée : 2 poste\(s\)/);
    assert.match(sortie, /Média prêt/);

    /* Le paquet décrit le commit courant : c'est la garantie « dernière mise à jour ». */
    const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
    const sortiePaquet = readFileSync(join(media, 'LISEZ-MOI-20-POSTES.txt'), 'utf8');
    assert.match(sortiePaquet, new RegExp('Commit      : ' + commit.slice(0, 8)));
    assert.match(sortiePaquet, /MÉDIA D’INSTALLATION POUR 20 POSTES/);
    assert.match(sortiePaquet, /Volume      : leger|Volume      : léger/);

    /* La procédure est utilisable telle quelle : un pas par poste, et le suivi des 20. */
    for (const attendu of [
      'SUR CHAQUE POSTE',
      'Brancher le disque dur',
      'verifier-media.cmd',
      'STI-Labo3-Installation.exe',
      'Informations complémentaires',
      'autorisation-labo3.json',
      'AUCUN mot de passe',
      'Ce poste n’est pas autorisé pour le Labo 3',
      'CE QUE CE MEDIA NE FAIT PAS',
      'La clé privée de signature ne doit JAMAIS être copiée',
      'SUIVI DES 20 POSTES'
    ]) {
      assert.ok(sortiePaquet.includes(attendu), 'procédure : ' + attendu);
    }
    /* Tableau de suivi des 20 postes : des lignes numérotées, de 1 à 20. */
    const cases = [...sortiePaquet.matchAll(/^\s+(\d{1,2})\s+\|/gm)].map((m) => Number(m[1]));
    assert.deepEqual(cases, Array.from({ length: 20 }, (_, i) => i + 1), 'une ligne de suivi par poste, de 1 à 20');
    /* Le nouveau parcours n'annonce ni mot de passe à remettre ni WebView2. */
    assert.doesNotMatch(sortiePaquet, /WebView2|mot de passe remis|v316/);

    /* Le lanceur double-clic appelle bien le script de contrôle, sans bloquer les scripts. */
    const lanceur = readFileSync(join(media, 'verifier-media.cmd'), 'utf8');
    assert.match(lanceur, /powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0verifier-media\.ps1"/);
    assert.match(lanceur, /\r\n/, 'fins de ligne Windows');

    /* Le script PowerShell compare les SHA-256 et sort en erreur si le média est abîmé. */
    const ps = readFileSync(join(media, 'verifier-media.ps1'), 'utf8');
    assert.match(ps, /Get-FileHash -LiteralPath \$fichier -Algorithm SHA256/);
    assert.match(ps, /empreintes\.txt/);
    assert.match(ps, /exit 1/, 'un média abîmé doit arrêter l’installation');
    assert.match(ps, /Ne pas installer depuis ce média/);
  } finally {
    rmSync(dossier, { recursive: true, force: true });
  }
});

test('média : empreintes.txt couvre tous les fichiers et le contrôle passe', () => {
  const dossier = dossierTemporaire();
  try {
    const media = join(dossier, 'media');
    const faux = fauxInstallateur(dossier);
    const { code } = lancer([
      '--volume', 'leger', '--seuil-mo', '0.2',
      '--sortie', media,
      '--installeur', faux.exe,
      '--accepter-installeur-inconnu',
      '--autorisation', autorisationValide(dossier)
    ]);
    assert.equal(code, 0);

    const lignes = readFileSync(join(media, 'empreintes.txt'), 'utf8').trim().split('\n');
    const declares = new Set(lignes.map((l) => l.split(/\s{2}/)[1]));
    const presents = new Set(readdirSync(media).filter((n) => n !== 'empreintes.txt'));
    assert.deepEqual([...declares].sort(), [...presents].sort(), 'chaque fichier est déclaré, sans oubli');
    for (const ligne of lignes) {
      const [empreinte, nom] = ligne.split(/\s{2}/);
      assert.equal(empreinte.length, 64, 'empreinte SHA-256 complète : ' + nom);
      assert.equal(sha256(join(media, nom)), empreinte, 'empreinte exacte : ' + nom);
    }

    const controle = lancer(['--verifier', media]);
    assert.equal(controle.code, 0, controle.sortie);
    assert.match(controle.sortie, /0 anomalie/);
  } finally {
    rmSync(dossier, { recursive: true, force: true });
  }
});

test('média : un fichier abîmé est signalé et le contrôle échoue', () => {
  const dossier = dossierTemporaire();
  try {
    const media = join(dossier, 'media');
    const faux = fauxInstallateur(dossier);
    lancer([
      '--volume', 'leger', '--seuil-mo', '0.2',
      '--sortie', media,
      '--installeur', faux.exe,
      '--accepter-installeur-inconnu',
      '--autorisation', autorisationValide(dossier)
    ]);

    /* Un octet changé dans le paquet : c'est le scénario d'une clé qui s'abîme. */
    const paquet = join(media, 'STI-Labo3-Plateforme.stipack');
    const octets = readFileSync(paquet);
    octets[100] ^= 0xff;
    writeFileSync(paquet, octets);

    const controle = lancer(['--verifier', media]);
    assert.equal(controle.code, 1, 'le contrôle doit échouer');
    assert.match(controle.sortie, /abîmé\s+: STI-Labo3-Plateforme\.stipack/);

    /* Un fichier retiré est lui aussi signalé. */
    rmSync(join(media, 'verifier-media.cmd'));
    const controle2 = lancer(['--verifier', media]);
    assert.equal(controle2.code, 1);
    assert.match(controle2.sortie, /manquant : verifier-media\.cmd/);
  } finally {
    rmSync(dossier, { recursive: true, force: true });
  }
});

test('média : installateur non contrôlé refusé, empreinte fausse refusée, fichier non EXE refusé', () => {
  const dossier = dossierTemporaire();
  try {
    const faux = fauxInstallateur(dossier);
    const refus = lancer([
      '--volume', 'leger', '--seuil-mo', '0.2',
      '--sortie', join(dossier, 'refus'),
      '--installeur', faux.exe
    ]);
    assert.equal(refus.code, 1);
    assert.match(refus.sortie, /empreinte de l’installateur non vérifiée/);
    assert.match(refus.sortie, /--empreinte-attendue/);

    const mauvaise = lancer([
      '--volume', 'leger', '--seuil-mo', '0.2',
      '--sortie', join(dossier, 'fausse'),
      '--installeur', faux.exe,
      '--empreinte-attendue', 'a'.repeat(64)
    ]);
    assert.equal(mauvaise.code, 1);
    assert.match(mauvaise.sortie, /ne correspond pas à l’empreinte attendue/);

    /* Un texte quelconque renommé .exe n'est pas un installateur. */
    const pasExe = join(dossier, 'imposteur.exe');
    writeFileSync(pasExe, 'ceci n\'est pas un exécutable\n');
    const refusExe = lancer([
      '--volume', 'leger', '--seuil-mo', '0.2',
      '--sortie', join(dossier, 'pas-exe'),
      '--installeur', pasExe,
      '--accepter-installeur-inconnu'
    ]);
    assert.equal(refusExe.code, 1);
    assert.match(refusExe.sortie, /en-tête MZ absent/);

    /* Aucun binaire refusé ne reste sur le média. */
    for (const nom of ['refus', 'fausse', 'pas-exe']) {
      const reste = readdirSync(join(dossier, nom)).filter((n) => n.endsWith('.exe'));
      assert.deepEqual(reste, [], nom + ' : binaire refusé laissé sur le média');
    }
  } finally {
    rmSync(dossier, { recursive: true, force: true });
  }
});

test('média : autorisation malformée refusée, clé privée jamais copiée', () => {
  const dossier = dossierTemporaire();
  try {
    const media = join(dossier, 'media');
    const mauvaise = join(dossier, 'autorisation-labo3.json');
    writeFileSync(mauvaise, JSON.stringify({ algorithme: 'Ed25519', donnees: 'e30=', signature: 'eA==' }));
    const refus = lancer([
      '--volume', 'leger', '--seuil-mo', '0.2',
      '--sortie', media,
      '--autorisation', mauvaise
    ]);
    assert.equal(refus.code, 1);
    assert.match(refus.sortie, /Liste de postes invalide/);
    assert.ok(!readdirSync(media).includes('autorisation-labo3.json'), 'rien copié avant validation');

    /* 21 postes : au-delà de la limite du laboratoire. */
    const { privateKey } = generateKeyPairSync('ed25519');
    const trop = join(dossier, 'trop.json');
    assert.throws(() => creerAutorisation(
      Array.from({ length: 21 }, (_, i) => 'ab'.repeat(31) + String(i).padStart(2, '0')),
      privateKey.export({ type: 'pkcs8', format: 'pem' })
    ));
  } finally {
    rmSync(dossier, { recursive: true, force: true });
  }
});

test('média : une archive ZIP de release est décompressée et l’EXE déposé à la racine', () => {
  const dossier = dossierTemporaire();
  try {
    const media = join(dossier, 'media');
    const faux = fauxInstallateur(dossier);
    const { code, sortie } = lancer([
      '--volume', 'leger', '--seuil-mo', '0.2',
      '--sortie', media,
      '--installeur', faux.zip,
      '--accepter-installeur-inconnu'
    ]);
    assert.equal(code, 0, sortie);
    assert.ok(readdirSync(media).includes('STI-Labo3-Installation.exe'), 'EXE extrait à la racine du média');
    assert.ok(!readdirSync(media).includes('STI-Labo3-Installation.zip'), 'l’archive n’encombre pas le média');
    assert.ok(!readdirSync(media).some((n) => n.startsWith('.')), 'aucun dossier temporaire laissé');
    assert.equal(sha256(join(media, 'STI-Labo3-Installation.exe')), sha256(faux.exe));
  } finally {
    rmSync(dossier, { recursive: true, force: true });
  }
});

test('média : sans installateur, le dossier est préparé et le manque est annoncé', () => {
  const dossier = dossierTemporaire();
  try {
    const media = join(dossier, 'media');
    const { code, sortie } = lancer(['--volume', 'leger', '--seuil-mo', '0.2', '--sortie', media]);
    assert.equal(code, 0, sortie);
    assert.match(sortie, /Média incomplet/);
    assert.match(sortie, /STI-Labo3-Installation\.exe — compilé avec votre clé publique/);
    assert.match(sortie, /autorisation-labo3\.json — signée depuis le tableau de bord/);
    assert.ok(readdirSync(media).includes('STI-Labo3-Plateforme.stipack'), 'le paquet est tout de même fabriqué');
  } finally {
    rmSync(dossier, { recursive: true, force: true });
  }
});

test('média : le paquet du média est relu par le vérificateur du dépôt', () => {
  const dossier = dossierTemporaire();
  try {
    const media = join(dossier, 'media');
    lancer(['--volume', 'leger', '--seuil-mo', '0.2', '--sortie', media]);
    const sortie = execFileSync('node', ['outils/stipack/construire-stipack.mjs', '--verifier', join(media, 'STI-Labo3-Plateforme.stipack')], {
      cwd: root, encoding: 'utf8'
    });
    assert.match(sortie, /0 anomalie/);
    assert.match(sortie, new RegExp('commit ' + execFileSync('git', ['rev-parse', '--short=8', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()));
  } finally {
    rmSync(dossier, { recursive: true, force: true });
  }
});
