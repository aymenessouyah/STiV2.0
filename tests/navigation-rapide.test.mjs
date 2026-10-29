import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const racine = resolve(new URL('..', import.meta.url).pathname);
const lire = (p) => readFileSync(resolve(racine, p), 'utf8');
const sync = lire('assets/js/sync-progressions.js');
const config = lire('assets/js/config.js');

test('v519 : les XP se rafraîchissent depuis n’importe quel terminal', () => {
  /* Une seule fonction de rafraîchissement, utilisée partout. */
  assert.match(sync, /function rafraichirDepuisCloud\(forcer\) \{/);
  assert.match(sync, /window\.STIProgressionCloud\.rafraichir = rafraichirDepuisCloud;/);

  /* Reconnexion internet : relecture immédiate du cloud (force le pull). */
  assert.match(sync, /window\.addEventListener\("online", function \(\) \{ rafraichirDepuisCloud\(true\); \}\);/);

  /* Retour sur l'onglet : les gains faits sur le téléphone arrivent sans recharger. */
  assert.match(sync, /document\.addEventListener\("visibilitychange", function \(\) \{\s*if \(document\.hidden\) \{ pousserFermetureDeduplique\(\); return; \}/);
  assert.match(sync, /rafraichirDepuisCloud\(false\);/);

  /* Appareil resté ouvert : relance discrète toutes les 45 s. */
  assert.match(sync, /\}, 45000\);/);

  /* Garde-fous : jamais deux GET en vol, rien hors-ligne, rien onglet masqué. */
  assert.match(sync, /if \(!session \|\| enVolTirer\) return;/);
  assert.match(sync, /navigator\.onLine === false\) return;/);
  assert.match(sync, /document\.hidden\) return;/);
  assert.match(sync, /maintenant - dernierPullCloud < 15000/);

  /* La fusion monotone des compteurs XP existe toujours : un appareil ne peut
     pas écraser un total plus élevé venu d'un autre terminal. */
  assert.match(sync, /function fusionnerCleQuizMonotone/);
  const bloc = sync.slice(sync.indexOf('if (k === "quizzora_xp_v1" || k === "sti-quiz-xp-js-v1")'), sync.indexOf('if (k === "sti-mes-scores")'));
  for (const champ of ['xp', 'best', 'parties', 'bonnes', 'total']) {
    assert.match(bloc, new RegExp(champ + ': Math\\.max\\(Number\\(qLoc\\.' + champ + '\\) \\|\\| 0, Number\\(qDist\\.' + champ + '\\) \\|\\| 0\\)'), champ + ' fusionné au maximum');
  }
});

test('v519 : la navigation est accélérée par le préchargement spéculatif', () => {
  /* Règles de pré-rendu au survol, réservées aux pages de contenu. */
  assert.match(config, /__STI_PRERENDER_NAV_V519/);
  assert.match(config, /HTMLScriptElement\.supports\("speculationrules"\)/);
  assert.match(config, /eagerness: "moderate"/);
  for (const exclu of ['/admin*', '/portail*', '/tests/*', '/assets/*', '/*.pdf', '/*.mp4']) {
    assert.ok(config.includes(`not: { href_matches: "${exclu}" }`), 'exclusion ' + exclu);
  }
  assert.ok(config.includes('not: { selector_matches: "[target=_blank]" }'), 'liens nouvel onglet exclus');
  assert.ok(config.includes('not: { selector_matches: "[download]" }'), 'téléchargements exclus');

  /* Réseau lent ou économisé : aucune pré-rendue. */
  assert.match(config, /if \(conn && conn\.saveData\) return;/);
  assert.match(config, /\(\^\|-\)2g\$/);

  /* La connexion TLS vers Supabase s'ouvre avant le premier appel. */
  assert.match(config, /\["preconnect", "dns-prefetch"\]\.forEach/);

  /* Le hint de préchargement au survol ne porte plus l'attribut invalide « as ». */
  const blocPrefetch = config.slice(config.indexOf('function declencherPrefetchSTI'), config.indexOf('window.__STI_PREFETCH_NAV_V475 = {'));
  assert.match(blocPrefetch, /lnk\.rel = "prefetch";/);
  assert.doesNotMatch(blocPrefetch, /lnk\.as = /, 'as n’est pas valide sur rel=prefetch');
  assert.match(blocPrefetch, /lnk\.fetchPriority = "low";/);
});
