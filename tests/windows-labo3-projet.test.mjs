import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const lire = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
test('nouveau parcours Windows : pas de téléchargement ni consignes v316', () => {
  const html = lire('admin.html');
  assert.doesNotMatch(html, /releases\/download\/windows-v316|STI-Labo3-Windows-v316\.exe|Nouveautés de la v316/);
  assert.match(html, /STI v2\.0 version spéciale Labo 3/);
  assert.match(html, /assets\/icons\/sti-logo-complet\.png/);
  assert.match(html, /disabled>Indisponible — développement nécessaire/);
});
test('nouveau projet : ressources officielles embarquées et privilèges utilisateur', () => {
  const projet = lire('outils/windows-labo3/STILabo3.csproj');
  assert.match(projet, /<Product>STI v2\.0 version spéciale Labo 3<\/Product>/);
  assert.match(projet, /<ApplicationIcon>.*STI_by_AE.ico<\/ApplicationIcon>/);
  assert.match(projet, /LogicalName="STILabo3.Logo.png"/);
  assert.match(lire('outils/windows-labo3/app.manifest'), /level="asInvoker"/);
  assert.ok(existsSync(new URL('../assets/icons/STI_by_AE.ico', import.meta.url)));
  assert.ok(existsSync(new URL('../assets/icons/sti-logo-complet.png', import.meta.url)));
});
test('préversion ne propose pas une installation non implémentée et ne charge pas de clé USB', () => {
  const code = lire('outils/windows-labo3/Program.cs');
  assert.match(code, /Installer — indisponible dans cette préversion.*Enabled = false/);
  assert.match(code, /GetManifestResourceStream\("STILabo3.PublicKey.pem"\)/);
  assert.match(code, /SignatureAlgorithm.Ed25519.Verify/);
  assert.match(code, /RegistryView.Registry64/);
  assert.doesNotMatch(code, /HttpClient|WebClient|Directory.Delete|Process.Start/);
});
