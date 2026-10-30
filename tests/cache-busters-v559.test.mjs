/* v559 — garde-fou des cache-busters (point 2 de l'audit de fin octobre).
   ─────────────────────────────────────────────────────────────────────────
   Historique du problème : les tests d'intégration exigeaient des numéros
   exacts (`?v=479-perf`), donc chaque nouvelle version cassait une assertion
   et il fallait la retoucher à la main. On les avait assouplis en `v=\d{3}`,
   ce qui ne vérifiait plus grand-chose.

   Ce fichier remplace les deux approches par une source de vérité unique :
   `tests/fixtures/cache-busters.json`. Toute page du dépôt doit utiliser
   exactement les versions qui y figurent.

   Conséquences pratiques :
     • changer un cache-buster sans mettre à jour la fixture → échec ;
     • oublier une page lors d'une montée de version → échec ;
     • la dette existante (5 actifs à plusieurs versions) est figée et
       visible, elle ne peut plus grossir silencieusement.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fixture = JSON.parse(readFileSync(join(root, 'tests/fixtures/cache-busters.json'), 'utf8'));

/* Même expression que celle qui a produit la fixture : ne pas la modifier
   d'un seul côté. */
const MOTIF = /(?:^|["'(\s])((?:\.\.\/)*)((?:assets\/)?[a-z0-9][a-z0-9/_.-]*\.(?:js|css))\?v=([0-9]{3}[a-z0-9-]*)/gi;

function pagesHtml(dir = root, acc = []) {
  for (const nom of readdirSync(dir)) {
    if (nom === '.git' || nom === 'node_modules') continue;
    const chemin = join(dir, nom);
    if (statSync(chemin).isDirectory()) pagesHtml(chemin, acc);
    else if (nom.endsWith('.html')) acc.push(chemin);
  }
  return acc;
}

function relever() {
  const refs = new Map();
  for (const page of pagesHtml()) {
    const texte = readFileSync(page, 'utf8');
    for (const m of texte.matchAll(MOTIF)) {
      const [cle, version] = [m[2], m[3]];
      if (!refs.has(cle)) refs.set(cle, { versions: new Set(), pages: new Set(), dossiers: new Set() });
      refs.get(cle).versions.add(version);
      refs.get(cle).pages.add(relative(root, page));
      refs.get(cle).dossiers.add(dirname(page));
    }
  }
  return refs;
}

const nombre = (v) => {
  const m = /^(\d+)/.exec(v);
  return m ? parseInt(m[1], 10) : 0;
};

const refs = relever();
const attendu = fixture.actifs;

test('chaque cache-buster correspond exactement à la source de vérité', () => {
  const problemes = [];

  for (const [cle, info] of refs) {
    const attendues = attendu[cle];
    if (!attendues) {
      problemes.push(`${cle} : actif absent de tests/fixtures/cache-busters.json ` +
        `(versions trouvées : ${[...info.versions].join(', ')})`);
      continue;
    }
    const trouvees = [...info.versions].sort();
    const prevues = [...attendues].sort();
    if (trouvees.join('|') !== prevues.join('|')) {
      const nouvelles = trouvees.filter(v => !prevues.includes(v));
      const disparues = prevues.filter(v => !trouvees.includes(v));
      problemes.push(`${cle} : attendu [${prevues.join(', ')}], trouvé [${trouvees.join(', ')}]` +
        (nouvelles.length ? ` — version(s) inattendue(s) : ${nouvelles.join(', ')}` : '') +
        (disparues.length ? ` — version(s) disparue(s) : ${disparues.join(', ')}` : ''));
    }
  }

  for (const cle of Object.keys(attendu)) {
    if (!refs.has(cle)) problemes.push(`${cle} : déclaré dans la fixture mais plus référencé par aucune page`);
  }

  assert.deepEqual(problemes, [],
    'cache-busters désynchronisés — mettre à jour la page concernée ET tests/fixtures/cache-busters.json');
});

test('un actif ne peut pas être référencé avec une version que personne ne sert', () => {
  /* Le vrai bug que cette garde attrape : une page oubliée lors d'une montée
     de version, qui continue de charger l'ancien fichier. On vérifie que les
     actifs marqués uniformes n'ont qu'une seule version. */
  const uniformes = [
    'assets/js/admin.js',
    'assets/js/mobile-nav.js',
    'assets/js/news-perso.js',
    'assets/css/capsules-vedettes.css'
  ];
  for (const cle of uniformes) {
    const info = refs.get(cle);
    assert.ok(info, `${cle} référencé par au moins une page`);
    assert.equal(info.versions.size, 1,
      `${cle} doit être chargé avec une seule version (trouvé : ${[...info.versions].join(', ')})`);
  }
});

test('chaque fichier référencé existe réellement sur le disque', () => {
  /* Le chemin est relatif à la page qui le référence (certaines pages de
     sous-dossiers écrivent simplement `cours.js`), ou absolu depuis la racine. */
  const manquants = [];
  for (const [cle, info] of refs) {
    const candidats = [join(root, cle)];
    for (const dossier of info.dossiers) candidats.push(join(dossier, cle));
    if (!candidats.some((chemin) => existsSync(chemin))) {
      manquants.push(`${cle} (depuis ${[...info.pages][0]})`);
    }
  }
  assert.deepEqual(manquants, [], 'actifs référencés mais introuvables');
});

test('aucun cache-buster ne recule sous le plancher enregistré', () => {
  /* Le plancher n'est pas une constante arbitraire : c'est la plus ancienne
     version déjà observée pour chaque actif. Une page ne peut donc pas
     réintroduire un numéro plus vieux que l'existant. */
  const reculs = [];
  for (const cle of Object.keys(attendu)) {
    const plancher = Math.min(...attendu[cle].map(nombre));
    for (const v of refs.get(cle) ? refs.get(cle).versions : []) {
      if (nombre(v) < plancher) reculs.push(`${cle}?v=${v} (plancher v${plancher})`);
    }
  }
  assert.deepEqual(reculs, [], 'cache-busters plus anciens que le plancher connu');
});

test('le plancher enregistré reste cohérent avec les versions du dépôt', () => {
  const mini = Math.min(...[...refs.values()].flatMap((i) => [...i.versions].map(nombre)));
  assert.equal(mini, fixture.plancherGlobal,
    'mettre à jour plancherGlobal dans tests/fixtures/cache-busters.json');
  assert.ok(fixture.plancherGlobal > 0);
});

test('la dette de versions multiples est connue et n’augmente pas', () => {
  /* Ces actifs sont chargés avec plusieurs versions selon les pages. C'est
     une dette ancienne, figée ici le temps de la résorber : la liste ne doit
     pas s'allonger. */
  const detteConnue = [
    'assets/css/protection.css',
    'assets/js/acces.js',
    'assets/js/config.js',
    'assets/js/protection.js',
    'assets/js/sync-progressions.js'
  ];
  const multiples = [...refs.entries()]
    .filter(([, info]) => info.versions.size > 1)
    .map(([cle]) => cle)
    .sort();

  assert.deepEqual(multiples, [...detteConnue].sort(),
    'un actif supplémentaire est chargé avec plusieurs versions : harmoniser les pages ' +
    'plutôt que d’ajouter la dette');
});
