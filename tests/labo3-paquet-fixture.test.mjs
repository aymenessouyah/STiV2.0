/*
  Fixture de paquet pour la suite Windows — outils/windows-labo3-tests/paquet-fixture.mjs

  L'installateur Windows est testé contre des paquets fabriqués par le VRAI
  générateur du tableau de bord (assets/js/stipack.js), pas contre une archive
  écrite à la main : si le schéma du manifeste change, la suite Windows doit
  casser ici plutôt qu'en salle. Ces tests vérifient que la fixture est
  effectivement un paquet conforme, dans les deux dispositions, en la faisant
  relire par le vérificateur du dépôt.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURE = join(root, 'outils', 'windows-labo3-tests', 'paquet-fixture.mjs');
const VERIFICATEUR = join(root, 'outils', 'stipack', 'construire-stipack.mjs');

function lancer(args) {
  try {
    return { code: 0, sortie: execFileSync('node', args, { cwd: root, encoding: 'utf8', stdio: 'pipe' }) };
  } catch (erreur) {
    return { code: erreur.status ?? 1, sortie: String(erreur.stdout || '') + String(erreur.stderr || '') };
  }
}

for (const disposition of ['plateforme', 'racine']) {
  test(`fixture : paquet ${disposition} conforme au vérificateur du dépôt`, () => {
    const dossier = mkdtempSync(join(tmpdir(), 'sti-fixture-'));
    try {
      const paquet = join(dossier, `fixture-${disposition}.stipack`);
      const fabrique = lancer([FIXTURE, paquet, disposition]);
      assert.equal(fabrique.code, 0, fabrique.sortie);
      assert.ok(statSync(paquet).size > 10000, 'paquet non vide');

      const controle = lancer([VERIFICATEUR, '--verifier', paquet]);
      assert.equal(controle.code, 0, controle.sortie);
      assert.match(controle.sortie, /format STI-STIPACK\/1/);
      assert.match(controle.sortie, /volume complet/);
      assert.match(controle.sortie, /0 anomalie/);

      /* Le préfixe annoncé correspond à la disposition demandée. */
      const manifeste = JSON.parse(
        execFileSync('python3', ['-c', `
import zipfile, sys
print(zipfile.ZipFile(sys.argv[1]).read('stipack.json').decode('utf-8'))
`, paquet], { encoding: 'utf8' })
      );
      assert.equal(manifeste.format, 'STI-STIPACK/1');
      assert.equal(manifeste.volume, 'complet');
      assert.equal(manifeste.contenu.dossier, disposition === 'racine' ? '' : 'plateforme/');
      assert.ok(manifeste.fichiers.length >= 6);
      const chemins = manifeste.fichiers.map((f) => f.chemin);
      assert.ok(chemins.some((c) => c.endsWith('index.html')), 'accueil présent : exigé par l’installateur');
      for (const fichier of manifeste.fichiers) {
        assert.match(fichier.sha256, /^[0-9a-f]{64}$/, 'empreinte SHA-256 réelle, pas une liste d’octets');
        assert.equal(fichier.octets, readFileSync(join(root, fichier.chemin.replace(/^plateforme\//, ''))).length);
      }
    } finally {
      rmSync(dossier, { recursive: true, force: true });
    }
  });
}

test('fixture : sortie manquante refusée, sans fichier parasite', () => {
  const refus = lancer([FIXTURE]);
  assert.equal(refus.code, 2);
  assert.match(refus.sortie, /usage : paquet-fixture\.mjs/);
});
