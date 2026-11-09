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
test('validation Windows réelle outillée : suite .NET et workflow', () => {
  const suite = lire('outils/windows-labo3-tests/Program.cs');
  for (const attendu of ['Authorization.Check', 'PackageInstaller.ExtractAsync', 'LocalRuntime.StartAsync', '206', 'refus.json'])
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
  assert.match(workflow, /verifier-cle-publique\.mjs/);
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
