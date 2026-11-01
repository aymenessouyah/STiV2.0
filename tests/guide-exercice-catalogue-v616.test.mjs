/* v616 — LA LISTE DU « GUIDE EXERCICE » NE RESTE PLUS VIDE
   ───────────────────────────────────────────────────────────────────────────
   Constat en usage réel : après une coupure de session, la section « Guide
   exercice » s'ouvrait VIDE — pas de liste, pas de message. Cause du silence :

     • le montage attendait `Promise.all([catalogue, réglage])` : si l'un des
       deux ne répondait pas, rien ne s'affichait du tout ;
     • la page appelait le montage dans un `try { … } catch (e) {}` : toute
       erreur était avalée sans le moindre mot ;
     • le catalogue n'existait que dans assets/guide-exercice-catalogue.json :
       fichier injoignable = liste vide.

   Désormais : la liste s'affiche immédiatement depuis une copie embarquée des
   72 exercices, puis s'affine avec le fichier du dépôt et le réglage de la
   base. Une panne laisse une LISTE UTILE et un état qui dit d'où elle vient.
*/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import vm from 'node:vm';

const racine = resolve(new URL('..', import.meta.url).pathname);
const lire = (p) => readFileSync(join(racine, p), 'utf8');

const admin = lire('assets/js/admin.js');
const adminHtml = lire('admin.html');
const sw = lire('sw.js');
const fichierCatalogue = JSON.parse(lire('assets/guide-exercice-catalogue.json'));

/* ── 1. la copie embarquée est le miroir exact du fichier du dépôt ──────── */

const debut = admin.indexOf('var GUIDE_CATALOGUE_REPLI = [');
const fin = admin.indexOf('\n  ];', debut);
assert.ok(debut > 0 && fin > debut, 'copie de secours présente dans admin.js');

const repli = vm.runInNewContext('(' + admin.slice(debut + 'var GUIDE_CATALOGUE_REPLI = '.length, fin + 4) + ')');

test('v616 — les 72 exercices sont embarqués dans admin.js, identiques au fichier', () => {
  assert.equal(repli.length, 72, '72 entrées embarquées');
  assert.equal(repli.length, fichierCatalogue.pages.length, 'même nombre que le fichier');
  for (let i = 0; i < repli.length; i += 1) {
    const a = repli[i];
    const b = fichierCatalogue.pages[i];
    assert.equal(a.chemin, b.chemin, 'chemin n°' + i);
    assert.equal(a.titre, b.titre, 'titre n°' + i);
    assert.equal(a.matiere, b.matiere || '', 'matière n°' + i);
    assert.equal(Boolean(a.correction), Boolean(b.correction), 'correction n°' + i);
    assert.equal(Boolean(a.video), Boolean(b.video), 'vidéo n°' + i);
  }
});

test('v616 — la copie de secours est lisible seule (aucune dépendance)', () => {
  /* Exécutée hors navigateur, sans document ni fetch : elle ne doit rien lever. */
  assert.ok(Array.isArray(repli));
  assert.ok(repli.every((p) => p.chemin.startsWith('exercices/') && p.titre));
  assert.equal(new Set(repli.map((p) => p.chemin)).size, 72, 'aucun doublon');
});

/* ── 2. le montage ne peut plus rester muet ────────────────────────────── */

const montage = admin.slice(admin.indexOf('function monterGuideExercice'), admin.indexOf('window.__stiMonterGuideExercice'));
const chargement = admin.slice(admin.indexOf('function chargerCatalogueGuide'), admin.indexOf('function reglageGuidePropre'));

test('v616 — la liste est peinte AVANT toute lecture réseau', () => {
  const peinture = montage.indexOf('peindreListe("⏳ Lecture du fichier et du réglage…"');
  const reseau = montage.indexOf('tentative(chargerCatalogueGuide)');
  assert.ok(peinture > 0 && reseau > peinture, 'peinture immédiate, puis réseau');
  assert.match(montage, /guideCatalogue = GUIDE_CATALOGUE_REPLI\.slice\(\)/);
  /* Plus d'attente couplée : un seul appel en panne ne bloque plus l'autre. */
  assert.doesNotMatch(montage, /Promise\.all\(\[chargerCatalogueGuide/);
});

test('v616 — un appel qui échoue ne peut plus interrompre le montage', () => {
  assert.match(montage, /function tentative\(fn\) \{\s*try \{ return Promise\.resolve\(fn\(\)\); \}\s*catch \(e\) \{ return Promise\.reject\(e\); \}/);
  assert.match(montage, /tentative\(chargerCatalogueGuide\)/);
  assert.match(montage, /tentative\(lireReglageGuide\)/);
  /* Chaque branche a son message d'échec. */
  assert.match(montage, /Catalogue du dépôt injoignable — liste de secours affichée\./);
  assert.match(montage, /Réglage illisible — tout est affiché par défaut\./);
});

test('v616 — le catalogue retombe sur la copie embarquée au lieu de rendre []', () => {
  assert.match(chargement, /if \(guideCatalogueFichier\) return Promise\.resolve\(guideCatalogue\)/);
  assert.match(chargement, /if \(!pages\.length\) throw new Error\("catalogue vide"\)/);
  assert.match(chargement, /guideCatalogue = GUIDE_CATALOGUE_REPLI\.slice\(\);\s*\n\s*guideCatalogueRepli = true;/);
  /* Ouverture depuis un disque : on ne tente même pas le fetch. */
  assert.match(chargement, /location\.protocol === "file:"/);
  assert.doesNotMatch(chargement, /guideCatalogue = \[\];/, 'plus de liste vide en dur');
});

test('v616 — l’état annonce l’origine de la liste', () => {
  const resume = admin.slice(admin.indexOf('function majGuideResume'), admin.indexOf('function enregistrerReglageGuide'));
  assert.match(resume, /guideCatalogueRepli \? " · liste de secours" : ""/);
  assert.match(resume, /guideCatalogueRepli \? "var\(--adm-amber\)" : "var\(--adm-green\)"/);
});

test('v616 — la page ne cache plus une erreur de montage', () => {
  const zone = adminHtml.slice(adminHtml.indexOf('window.__stiMonterGuideExercice'),
                               adminHtml.indexOf('window.dispatchEvent(new CustomEvent("sti:section-admin-ouverte"'));
  assert.match(zone, /catch \(eMonte\) \{/);
  assert.match(zone, /La liste des exercices n’a pas pu s’afficher\. Rechargez la page \(Ctrl \+ F5\)\./);
  assert.doesNotMatch(zone, /catch \(eMonte\) \{\}/, 'plus de catch vide');
});

test('v616 — le filtre par matière ne duplique pas ses options', () => {
  assert.match(montage, /function remplirMatieres\(\)/);
  assert.match(montage, /Array\.prototype\.forEach\.call\(selMatiere\.options, function \(o\) \{ dejaLa\[o\.value\] = true; \}\)/);
  assert.match(montage, /if \(dejaLa\[m\]\) return;/);
});

/* ── 3. publication ─────────────────────────────────────────────────────── */

test('v616 — publication : version, lot, cache-buster et révisions', () => {
  assert.match(sw, /var VERSION_PUBLIEE = "v616";/);
  assert.match(sw, /var PUBLIEE_LE = "2026-11-01T17:15:00Z";/);
  assert.match(sw, /Historique lots : v616-guide-secours-20261101,/);
  assert.match(adminHtml, /assets\/js\/admin\.js\?v=616-perf/);
  for (const chemin of ['assets/js/admin.js', 'admin.html', 'offline-complete-manifest.json']) {
    assert.ok(sw.includes('{ url: "./' + chemin + '", revision: "guide-secours-v616" }'), chemin);
  }
  assert.ok(sw.includes('{ url: "./assets/js/guide-exercice.js", revision: "guide-exercice-v614" }'),
    'le module élève, inchangé, garde son lot');
  assert.match(sw, /var CACHE = "sti-atelier-v386"/);
});
