/*
  v583 — décompte des pages du site : une seule source, plus de « 124 » écrit à la main.

  Contexte (31/10/2026) : le tableau de bord affichait « x / 124 pages » alors que le site
  en compte 145. Le fichier assets/pages-couverture.json datait de la v434 et souffrait de
  deux défauts :
    - le générateur passait tous les chemins en minuscules, donc 48 des 124 entrées ne
      désignaient plus aucun fichier réel (« exercices/javascript/tp1-js.html » au lieu de
      « Tp1-js.html ») ;
    - la liste était figée : 18 pages réelles n'y figuraient pas.

  Correctif : outils/couverture/generer-couverture.py relit `git ls-files '*.html'`, retire
  tests/ (pages de test non livrées) et écrit un `n` calculé. admin.js et analytique.js lisent
  ce manifeste ; leurs valeurs de repli hors-ligne sont tenues égales au manifeste par ce test.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

const root = resolve(new URL('..', import.meta.url).pathname);
const read = (p) => readFileSync(resolve(root, p), 'utf8');
const manifeste = JSON.parse(read('assets/pages-couverture.json'));
const pagesGit = execFileSync('git', ['ls-files', '-z', '*.html'], { cwd: root, encoding: 'utf8' })
  .split('\0')
  .filter(Boolean)
  .filter((p) => !p.startsWith('tests/'))
  .sort();

test('v583 : le manifeste de couverture décrit exactement les pages réelles du site', () => {
  assert.equal(manifeste.gen, 'v583');
  assert.equal(manifeste.n, manifeste.pages.length, 'n doit être calculé, pas recopié');
  assert.equal(manifeste.n, 145, '145 pages HTML hors tests/ au 31/10/2026');
  assert.deepEqual([...manifeste.pages].sort(), pagesGit, 'le manifeste doit être la liste exacte de git ls-files');
  assert.equal(new Set(manifeste.pages).size, manifeste.pages.length, 'aucun doublon de chemin exact');
});

test('v583 : chaque chemin du manifeste existe avec sa casse réelle', () => {
  const surDisque = new Set(
    execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean)
  );
  for (const p of manifeste.pages) {
    assert.ok(existsSync(resolve(root, p)), 'fichier absent du disque : ' + p);
    assert.ok(surDisque.has(p), 'chemin introuvable avec cette casse dans Git : ' + p);
    assert.ok(!p.startsWith('tests/'), 'les pages de test ne sont pas des pages du site : ' + p);
  }
  /* Les trois paires qui ne diffèrent que par la casse sont bien deux fichiers distincts :
     on les garde toutes les deux (le compteur élève, lui, les ramène à une seule visite). */
  assert.ok(manifeste.pages.includes('cours/PHP-recap.html'));
  assert.ok(manifeste.pages.includes('cours/php-recap.html'));
  assert.ok(manifeste.pages.includes('projets/sti0/Sondage.html'));
  assert.ok(manifeste.pages.includes('projets/sti0/sondage.html'));
});

test('v583 : le générateur détecte un manifeste périmé', () => {
  const sortie = execFileSync('python3', ['outils/couverture/generer-couverture.py', '--verifier'], {
    cwd: root,
    encoding: 'utf8'
  });
  assert.match(sortie, /à jour \(145 pages\)/);
  /* L'ancien générateur n'est plus qu'un relais : il ne doit plus produire de liste. */
  assert.match(read('tools/pages-couverture.py'), /DÉPRÉCIÉ/);
});

test('v583 : le tableau de bord et l’analytique lisent le manifeste, sans « 124 » figé', () => {
  const adminJs = read('assets/js/admin.js');
  const anaJs = read('assets/js/analytique.js');

  assert.match(adminJs, /var TOTAL_PAGES_SITE_ADMIN = 145;/);
  assert.match(adminJs, /chargerTotalPagesSiteAdmin\(\)/);
  assert.match(adminJs, /fetch\("assets\/pages-couverture\.json", \{ cache: "no-cache" \}\)/);
  assert.doesNotMatch(adminJs, /"\/124/, 'plus aucun libellé /124 dans le tableau de bord');
  assert.doesNotMatch(adminJs, /totalPagesSite: 124/);
  assert.match(adminJs, /totalPagesSite: TOTAL_PAGES_SITE_ADMIN/);

  assert.match(anaJs, /var TOTAL_PAGES_SITE = 145;/);
  assert.match(anaJs, /chargerTotalPagesSite\(\)/);
  assert.match(anaJs, /fetch\("assets\/pages-couverture\.json", \{ cache: "no-cache" \}\)/);
  assert.doesNotMatch(anaJs, /var TOTAL_PAGES_SITE = 124;/);

  /* Les deux replis doivent valoir le manifeste, sinon un élève lirait « 300 / 145 ». */
  const repliAdmin = Number((adminJs.match(/var TOTAL_PAGES_SITE_ADMIN = (\d+);/) || [])[1]);
  const repliAna = Number((anaJs.match(/var TOTAL_PAGES_SITE = (\d+);/) || [])[1]);
  assert.equal(repliAdmin, manifeste.n);
  assert.equal(repliAna, manifeste.n);
});

test('v583 : les libellés affichés suivent le même nombre', () => {
  const adminHtml = read('admin.html');
  assert.match(adminHtml, /couverture sur <b>145 pages<\/b>/);
  assert.match(adminHtml, /Couverture 145 pages/);
  assert.doesNotMatch(adminHtml, /couverture sur <b>124 pages<\/b>/);

  const readme = read('README.md');
  assert.match(readme, /couverture sur \*\*145 pages\*\*/);
  assert.match(readme, /Anneau de couverture sur \*\*145 pages\*\*/);
  assert.match(readme, /taux réel d'exploration des \*\*145 pages\*\*/);
});

test('v583 : le repli hors-ligne de la roue reflète le manifeste et le Service Worker suit', () => {
  const roueCouvJs = read('assets/js/roue-couverture.js');
  const m = roueCouvJs.match(/var PAGES = \[([\s\S]*?)\];/);
  assert.ok(m, 'PAGES présent dans roue-couverture.js');
  const repli = vm.runInNewContext('[' + m[1] + ']');
  assert.deepEqual(
    [...repli].sort(),
    [...manifeste.pages].map((p) => p.toLowerCase()).sort(),
    'le repli PAGES doit être identique, en minuscules, au manifeste'
  );

  const sw = read('sw.js');
  /* v584 : admin.js repart au lot « publication-v587 » (fouille du navigateur),
     les autres fichiers du décompte restent au lot v583. */
  const revisionsAttendues = {
    './assets/pages-couverture.json': 'couverture-v583',
    './assets/js/admin.js': 'publication-v587',
    './assets/js/analytique.js': 'couverture-v583',
    './assets/js/admin-couverture.js': 'couverture-v583',
    './assets/js/roue-couverture.js': 'couverture-v586',
    './admin.html': 'publication-v587'
  };
  for (const [url, revision] of Object.entries(revisionsAttendues)) {
    const ligne = sw.split('\n').find((l) => l.includes('url: "' + url + '"'));
    assert.ok(ligne, 'entrée sw.js absente : ' + url);
    assert.ok(ligne.includes('revision: "' + revision + '"'), 'révision à jour attendue pour ' + url);
  }
  /* Pas de changement d'UPDATE_ID : les 778 entrées de chaîne du delta ne sont pas
     retéléchargées, seules les six révisions ci-dessus changent. */
  assert.match(sw, /var UPDATE_ID = "v582-journal-connexions";/);
});
