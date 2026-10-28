import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

/* Tester la vraie fusion isolément, sans connexion ni modification du synchroniseur protégé. */
const source = readFileSync(new URL('../assets/js/sync-progressions.js', import.meta.url), 'utf8');
const debut = source.indexOf('  function fusionnerMediaProgMonotone(');
const fin = source.indexOf('  function isolerComptePartageSiBesoin(', debut);
assert.ok(debut >= 0 && fin > debut, 'fonction de fusion média introuvable');
const contexte = {};
vm.runInNewContext(source.slice(debut, fin), contexte, { filename: 'sync-progressions.js' });
const fusionner = (local, distant) => JSON.parse(contexte.fusionnerMediaProgMonotone(
  JSON.stringify(local), JSON.stringify(distant)
));

test('synchronisation : une ancienne position numérique locale est conservée', () => {
  const resultat = fusionner({ 'video:html5-cours': 120 }, {});
  assert.equal(resultat['video:html5-cours']?.sec, 120);
  assert.ok(resultat['video:html5-cours'].maxPct >= 1);
});

test('synchronisation : une ancienne position numérique distante est normalisée sans perte', () => {
  const resultat = fusionner({}, { 'audio:css3-cours': 75 });
  assert.equal(resultat['audio:css3-cours']?.sec, 75);
  assert.ok(resultat['audio:css3-cours'].maxPct >= 1);
});

test('synchronisation : une reprise volontairement masquée reste masquée', () => {
  const resultat = fusionner(
    { 'video:html5-cours': { sec: 0, maxPct: 20, ts: 2000, repriseMasquee: true } },
    { 'video:html5-cours': { sec: 42, maxPct: 20, ts: 1000 } }
  );
  assert.equal(resultat['video:html5-cours'].sec, 0);
  assert.equal(resultat['video:html5-cours'].repriseMasquee, true);
  assert.equal(resultat['video:html5-cours'].maxPct, 20);
});
