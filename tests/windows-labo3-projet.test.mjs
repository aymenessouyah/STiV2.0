import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const lire = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const sources = ['Program.cs', 'Authorization.cs', 'PackageInstaller.cs', 'LocalRuntime.cs', 'Deployment.cs']
  .filter(f => existsSync(new URL('../outils/windows-labo3/' + f, import.meta.url)))
  .map(f => lire('outils/windows-labo3/' + f)).join('\n');

test('tableau de bord : plus aucun téléchargement ni consigne v316', () => {
  const html = lire('admin.html');
  assert.doesNotMatch(html, /releases\/download\/windows-v316|STI-Labo3-Windows-v316\.exe|Nouveautés de la v316/);
  assert.match(html, /STI v2\.0 version spéciale Labo 3/);
  assert.match(html, /assets\/icons\/sti-logo-complet\.png/);
});
test('projet Windows : nom officiel, logo embarqué, privilèges utilisateur', () => {
  const projet = lire('outils/windows-labo3/STILabo3.csproj');
  assert.match(projet, /<Product>STI v2\.0 version spéciale Labo 3<\/Product>/);
  assert.match(projet, /<ApplicationIcon>.*STI_by_AE.ico<\/ApplicationIcon>/);
  assert.match(projet, /LogicalName="STILabo3.Logo.png"/);
  assert.match(projet, /Microsoft.AspNetCore.App/);
  assert.match(lire('outils/windows-labo3/app.manifest'), /level="asInvoker"/);
  assert.ok(existsSync(new URL('../assets/icons/STI_by_AE.ico', import.meta.url)));
  assert.ok(existsSync(new URL('../assets/icons/sti-logo-complet.png', import.meta.url)));
});
test('autorisation : clé publique embarquée uniquement, 20 postes, empreinte du poste', () => {
  assert.match(sources, /GetManifestResourceStream\("STILabo3.PublicKey.pem"\)/);
  assert.match(sources, /SignatureAlgorithm.Ed25519.Verify/);
  assert.match(sources, /is < 1 or > 20/);
  assert.match(sources, /STI-LABO3-AUTORISATION\/1/);
  assert.match(sources, /RegistryView.Registry64/);
  assert.match(sources, /SOFTWARE\\Microsoft\\Cryptography/);
  // Aucune clé lue depuis le support distribué, aucun accès réseau sortant.
  assert.doesNotMatch(sources, /HttpClient|WebClient|WebRequest/);
});
test('installation : extraction vérifiée, sans écraser l’ancienne version', () => {
  const installeur = lire('outils/windows-labo3/PackageInstaller.cs');
  assert.match(installeur, /STI-STIPACK\/1/);
  assert.match(installeur, /"" or "plateforme\/"/);
  assert.match(installeur, /SHA256.HashDataAsync/);
  assert.match(installeur, /FileMode.CreateNew/);
  assert.match(installeur, /CON\|PRN\|AUX\|NUL/);
  assert.match(installeur, /Directory.Delete\(destination, true\)/);
  assert.match(lire('outils/windows-labo3/Deployment.cs'), /File.Move\(temporary, target, true\)/);
});
test('exécution locale : boucle locale seule, portail et admin bloqués, session injectée', () => {
  const runtime = lire('outils/windows-labo3/LocalRuntime.cs');
  assert.match(runtime, /IPAddress.Loopback/);
  assert.match(runtime, /no-store/);
  assert.match(runtime, /"admin.html" or "portail.html" or "sw.js"/);
  assert.match(runtime, /sti-native-session-v316/);
  assert.match(runtime, /__STI_NATIVE_AUTHENTICATED_V316=true/);
  assert.match(runtime, /unregister\(\)/);
  assert.match(runtime, /Authorization.Check/);
});
test('robustesse en salle : port de repli, purge des versions, marge disque', () => {
  const runtime = lire('outils/windows-labo3/LocalRuntime.cs');
  assert.match(runtime, /PortsEssayes = \[18763, 18764, 18765, 18766, 18767, 0\]/);
  assert.match(runtime, /AddressInUseException or IOException/);
  assert.match(runtime, /Aucun port local disponible/);
  const deploiement = lire('outils/windows-labo3/Deployment.cs');
  assert.match(deploiement, /VersionsConservees = 2/);
  assert.match(deploiement, /NettoyerVersions\(root, version\)/);
  assert.match(deploiement, /catch \(IOException\)/);
  assert.match(deploiement, /EspaceSuffisant/);
  assert.match(lire('outils/windows-labo3/PackageInstaller.cs'), /Espace insuffisant sur/);
  // Le dépôt réel contient des fichiers qui ne diffèrent que par la casse : ils ne
  // sont ni tus ni refusés en bloc, mais ignorés de façon déterministe et rapportés.
  const installeur = lire('outils/windows-labo3/PackageInstaller.cs');
  assert.match(installeur, /DoublonsIgnores/, 'les doublons de casse ignorés sont rapportés');
  assert.match(installeur, /Doublon de casse ignoré/);
  assert.match(lire('outils/windows-labo3/Deployment.cs'), /doublons-ignores\.txt/, 'trace écrite à côté de l’autorisation');
});
test('validation Windows réelle outillée : suite .NET et workflow', () => {
  const suite = lire('outils/windows-labo3-tests/Program.cs');
  for (const attendu of ['Authorization.Check', 'PackageInstaller.ExtractAsync', 'LocalRuntime.StartAsync', '206', 'refus.json', 'NettoyerVersions', 'EspaceSuffisant', 'PortsEssayes',
    'ArchiveMulti', 'Doublon ignoré rapporté', 'Le premier annoncé est conservé', 'même nom annoncé deux fois', '--volume complet'])
    assert.ok(suite.includes(attendu), 'contrôle manquant : ' + attendu);
  const workflow = lire('.github/workflows/windows-labo3.yml');
  assert.match(workflow, /runs-on: windows-latest/);
  assert.match(workflow, /compiler.ps1 -ClePublique/);
  assert.match(workflow, /clé de test jetable/);
  assert.match(lire('outils/windows-labo3/compiler.ps1'), /ne pas publier|publication refusée/i);
});
test('publication de production : clé publique only, artefact et empreintes', () => {
  const workflow = lire('.github/workflows/windows-labo3.yml');
  assert.match(workflow, /workflow_dispatch:\n\s+inputs:\n\s+cle_publique:/);
  assert.match(workflow, /if: github.event_name == 'workflow_dispatch'/);
  assert.match(workflow, /cle-depuis-saisie\.mjs/);
  assert.match(workflow, /SHA256SUMS\.txt/);
  assert.match(workflow, /actions\/upload-artifact@v4/);
  // La clé privée ne doit jamais être un paramètre de compilation ou de workflow.
  assert.doesNotMatch(workflow, /cle_privee|privateKey|privee\.pem/);
  const verificateur = lire('outils/windows-labo3/verifier-cle-publique.mjs');
  assert.match(verificateur, /PRIVATE KEY/i);
  assert.match(verificateur, /asymmetricKeyType !== 'ed25519'/);
  assert.match(verificateur, /der.length !== 44/);
  assert.match(lire('outils/windows-labo3/compiler.ps1'), /verifier-cle-publique\.mjs/);
});
test('scripts PowerShell : aucun guillemet typographique (casse l’analyse)', () => {
  // PowerShell traite U+2018/U+2019/U+201C/U+201D comme des délimiteurs de chaîne :
  // une apostrophe typographique dans un message ferme la chaîne et le script
  // échoue avec « Missing closing '}' » avant même de s’exécuter.
  const fichiers = ['outils/windows-labo3/compiler.ps1', 'outils/stipack/relever-poste-labo3.ps1'];
  for (const fichier of fichiers) {
    if (!existsSync(new URL('../' + fichier, import.meta.url))) continue;
    const texte = lire(fichier);
    assert.doesNotMatch(texte, /[\u2018\u2019\u201C\u201D]/, fichier + ' contient un guillemet typographique');
    const ouvrantes = (texte.match(/{/g) || []).length;
    const fermantes = (texte.match(/}/g) || []).length;
    assert.equal(ouvrantes, fermantes, fichier + ' : accolades déséquilibrées');
  }
});

/* Le laboratoire a retenu le parcours simple : copier, double-cliquer, installer.
   L'autorisation signée reste possible, mais ne doit jamais être exigée par
   défaut — et ne doit jamais être ignorée quand elle est présente. */
test('mode simple : aucune autorisation exigée, restriction conservée en option', () => {
  const programme = lire('outils/windows-labo3/Program.cs');
  const runtime = lire('outils/windows-labo3/LocalRuntime.cs');
  const deploiement = lire('outils/windows-labo3/Deployment.cs');
  assert.match(programme, /internal static bool CheckIfPresent\(string file\)/);
  assert.match(programme, /if \(!File\.Exists\(file\)\) return false;/);
  assert.match(programme, /Check\(file\);\n        return true;/, 'un fichier présent est vraiment vérifié');
  assert.equal((runtime.match(/Authorization\.CheckIfPresent/g) || []).length, 2,
    'démarrage et chaque document : contrôle conservé, mais conditionnel');
  assert.doesNotMatch(runtime, /Authorization\.Check\(/, 'plus aucun contrôle inconditionnel à l’exécution');
  assert.match(deploiement, /InstallAsync\(string package, string\? authorization/);
  assert.match(deploiement, /if \(authorization is not null\) Authorization\.Check\(authorization\)/);
  // Le parcours simple ne doit plus ouvrir de sélecteur pour une autorisation.
  assert.doesNotMatch(programme, /Filter = "Autorisation signée/);
  const suite = lire('outils/windows-labo3-tests/Program.cs');
  assert.match(suite, /Mode simple : plateforme servie sans autorisation/);
  assert.match(suite, /une autorisation posée est quand même vérifiée/);
});

test('compilation : clé publique facultative, mode simple par défaut', () => {
  const script = lire('outils/windows-labo3/compiler.ps1');
  assert.doesNotMatch(script, /Mandatory = \$true\)\]\[string\]\$ClePublique/, 'la clé n’est plus obligatoire');
  assert.match(script, /\$Restreint = -not \[string\]::IsNullOrWhiteSpace\(\$ClePublique\)/);
  assert.match(script, /if \(\$Restreint\) \{ \$Arguments \+= "-p:Labo3PublicKey=\$ClePublique" \}/);
  // Un binaire simple ne doit embarquer aucune clé : le contrôle final l’exige.
  assert.match(script, /ABSENTE/);
  assert.match(script, /Installateur simple attendu sans clé embarquée/);
  assert.match(script, /ce binaire accepte tous les postes/, 'le risque du mode simple est écrit noir sur blanc');
});

test('publication : automatique sur main, après validation, clé facultative', () => {
  const workflow = lire('.github/workflows/windows-labo3.yml');
  assert.match(workflow, /needs: windows/, 'on ne publie que du code validé par la suite Windows');
  assert.match(workflow, /github\.event_name == 'push' && github\.ref == 'refs\/heads\/main'/);
  assert.match(workflow, /if: \$\{\{ github\.event\.inputs\.cle_publique != '' \}\}/, 'clé vide = compilation simple');
  assert.match(workflow, /Mode simple : aucune cle embarquee/);
  assert.match(workflow, /STI-v2\.0-Labo3-simple/);
  assert.match(workflow, /gh release create labo3-windows/);
  assert.match(workflow, /--clobber/, 'une republication remplace l’exécutable');
});
