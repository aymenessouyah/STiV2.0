# 🧪 Rapport de test — Plateforme STI V2.0

**Date** : 30 octobre 2026
**Branche testée** : `arena/7721f13c-stiv2-0` (issue de `main` @ `cca5929`)
**Périmètre** : dépôt complet — 149 pages HTML, 154 fichiers JavaScript, 740 fichiers du paquet hors-ligne
**Environnement** : Node.js 22.22.3, npm 10.9.8, Python 3, serveur statique local `python3 -m http.server` sur `0.0.0.0:4173`

---

## ✅ Synthèse

| Axe testé | Résultat |
|---|---|
| Tests unitaires Node (`node --test tests/*.test.mjs`) | **338 réussis**, 0 échec, 1 ignoré (PostgreSQL jetable requis) |
| Tests Python (`python3 -m unittest`) | **7 / 7 réussis** |
| Syntaxe de tous les fichiers JS (`node --check`) | **154 / 154 valides** |
| Syntaxe des scripts *inline* des pages | **258 blocs vérifiés**, 0 erreur réelle |
| Références locales (liens, `src`, `poster`) | **2 460 vérifiées**, 0 cassée |
| Exécution réelle du DOM (moteur jsdom, 149 pages) | **143 pages sans aucune erreur JS** ; 6 pages ne déclenchent que des limites du moteur de test (canvas, `showModal`) |
| Réponses HTTP des 31 pages et fichiers critiques | **31 / 31 en HTTP 200** |
| Paquet hors-ligne (`offline-complete-manifest.json`) | **740 / 740 fichiers présents**, tailles et empreintes SHA-1 exactes |
| Delta du Service Worker (`UPDATE_FILES`) | **262 / 262 fichiers présents** |
| Banques de quiz | **1 244 / 1 244 questions** conformes (187 + 106 + 140 + 176 + 635) |
| Intégrité binaire (vidéos, MP3, PDF, WASM) | **215 fichiers** — 0 signature invalide |
| Plan du site (`sitemap.xml`) | **65 / 65 URL pointent vers un fichier existant** |
| Sécurité (clés, RLS, `search_path`) | Aucun secret exposé ; RLS et `search_path` conformes |

**Tests navigateur Playwright : non exécutables dans cet environnement** — le binaire Chromium ne peut pas être téléchargé ici (hôte hors de la liste d'accès autorisée). Les 20 configurations Playwright du dépôt restent à rejouer sur un poste équipé de `npx playwright install chromium`.

---

## 🐞 Bug réel trouvé et corrigé

### `ReferenceError: brancherSuiviVideoSTI is not defined` (à chaque chargement de page)

**Symptôme** — Sur toutes les pages chargeant `assets/js/protection.js`, `init()` appelait `brancherSuiviVideoSTI()`, alors que cette fonction est déclarée **à l'intérieur** de `installerVideosPasAPasSTI()` (lignes 1019–3621). Elle était donc hors de portée : l'appel levait une `ReferenceError`, ce qui **interrompait `init()` avant `installerGuideVocalEnParlant()`**.

**Conséquences mesurées**

- le suivi de page piloté par la vidéo (défilement vers la section expliquée, bandeau de chapitres) **n'était jamais installé** : 0 vidéo suivie sur les 2 de l'accueil et les 6 de chaque cours ;
- l'installateur du **guide vocal** placé juste après n'était jamais atteint ;
- une erreur JavaScript visible en console sur chaque page.

**Correction** — Un relais `brancherSuiviVideoSTIExpose` est déclaré dans la portée de l'IIFE ; la fonction interne y est affectée juste après sa déclaration, et `init()` l'appelle via ce relais, sous garde `typeof` + `try/catch` (aucune modification de la logique interne).

**Vérification après correction** (moteur jsdom, code réellement livré) :

| Page | `<video>` | suivi installé | erreurs JS |
|---|---|---|---|
| `index.html` | 2 | **2** | 0 |
| `cours/html5.html` | 6 | **6** | 0 |
| `cours/css3.html` | 6 | **6** | 0 |
| `quiz/sql.html` | 0 (voulu) | 0 | 0 hors limites du moteur |

**Diffusion aux PWA déjà installées** — La révision de `protection.js` dans le delta du Service Worker passe de `suivi-video-v551` à `suivi-video-repare-v554` : la nouvelle copie de `sw.js` invalide le fichier en cache et le retélécharge sans provoquer de rechargement intégral. Le nom de cache (`sti-atelier-v386`) et `UPDATE_ID` restent inchangés — ces valeurs sont épinglées par 15 fichiers de tests et un changement de `UPDATE_ID` forcerait le retéléchargement des 262 entrées du delta.

---

## 🔧 Autres corrections (documentation & référencement)

1. **`README.md` — en-tête périmé.** L'architecture annonçait `sti-atelier-v357` et « Version du code v500 (`sti-atelier-v361`) » alors que `sw.js` est en `sti-atelier-v386` avec `UPDATE_ID = v553-defilement-passif-20261030`. Les deux lignes reflètent désormais la version réelle, au format attendu par les tests.
2. **`robots.txt` — directive `Sitemap` absente**, alors que `sitemap.xml` existe et référence 65 pages valides. Directive ajoutée (les moteurs classiques restent seuls autorisés, les robots d'IA demeurent exclus).
3. **`tests/test_smart_books_3si.py` — assertion obsolète.** Le test exigeait `var CACHE = "sti-atelier-v354"` et échouait donc sur toute version postérieure. Il vérifie maintenant le format (`sti-atelier-v<num>`), pas une version figée.
4. **Manifeste hors-ligne** resynchronisé après chaque modification (tailles + empreintes SHA-1 + `totalBytes`).

---

## 🔬 Vérifications fonctionnelles approfondies

### Tirage aléatoire des quiz (CSPRNG)

Exécution du module `assets/js/quiz-alea.js` hors navigateur :

- `entier(4)` sur 40 000 tirages : distribution 9 975 / 9 945 / 10 079 / 10 001 — **χ² = 0,99** (seuil 5 % = 13,28) : uniforme ;
- `melanger()` : 200/200 permutations sans perte d'élément ni mutation de la source ;
- `melangerReponses()` : la bonne réponse est retrouvée dans 100 % des 4 000 mélanges, positions équilibrées (1 029 / 975 / 977 / 1 019) ;
- 24 ordres distincts observés sur 500 tirages de 4 éléments (maximum théorique : 24).

### Anti-série « jamais 3 bonnes réponses consécutives à la même position »

Présente et correcte dans **les cinq moteurs** : `quiz/html-css.html`, `quiz/javascript.html`, `quiz/sql.html`, `quiz/php.html` et `assets/js/quiz-tableaux.js`.

### Laboratoire SQL (`cours/sql-playground.html`)

Moteur `assets/js/sqljs/sql-wasm.js` + `.wasm` (659 Ko) hébergé localement. Exécution réelle : création de table, insertions, `SELECT … WHERE moyenne >= 10 ORDER BY … DESC`, `COUNT(*)`, auto-jointure `WHERE e.id = a.id` — **résultats exacts**. Aucun appel réseau vers un CDN.

### Contenu pédagogique

- **1 244 questions** au total, conformes au README, sans doublon de texte, identifiants uniques dans la banque (635), 4 propositions par question, index de bonne réponse toujours valide ;
- répartition de la banque par module : html5 126, css3 137, javascript 63, sql 61, php 82, defis 66, recap-php 100 ;
- 23 vidéos référencées dans le code : **toutes présentes** dans `assets/videos/` ;
- 29 PDF et 30 vidéos : en-têtes de conteneur (`ftyp`, `%PDF`, `ID3`) tous valides.

### Sécurité

- Aucune clé `service_role`, aucun secret privé dans le dépôt : les seules occurrences de `SUPABASE_SERVICE` sont des **noms de variables d'environnement** dans les messages d'erreur ;
- une seule origine Supabase (`vywujxmepvcbgedgmger.supabase.co`), clé anonyme publique, conforme à un frontend statique ;
- migrations : RLS activée sur les tables techniques, politiques `auth.uid() = user_id`, fonctions `security definer` accompagnées de `set search_path = public` / `pg_catalog, public` ;
- `robots.txt` exclut explicitement les robots d'IA sans bloquer les moteurs classiques.

---

## 📋 Points d'attention (non bloquants)

| # | Observation | Impact |
|---|---|---|
| 1 | Les 20 suites Playwright n'ont pas pu être exécutées (pas de Chromium dans cet environnement). | Les parcours réels (PWA, service worker, mobile, retour quiz) restent à valider sur un poste équipé. |
| 2 | `assets/css/js.css` est un fichier **vide** et n'est référencé par aucune page. | Aucun effet ; candidat à la suppression ou à un contenu. |
| 3 | `quiz/html-css.html` concentre ses bonnes réponses en position A (87 sur 187, soit 46 %) contre 3 seulement en position D. | Neutralisé en pratique par le mélange CSPRNG de chaque partie, mais la banque mériterait un rééquilibrage. |
| 4 | `tests/password-recovery-harness.html` et les autres harnais de `tests/` ne fonctionnent qu'avec un runner dédié. | Attendu ; ne pas ouvrir ces pages comme des pages de la plateforme. |
| 5 | Le test de concurrence PostgreSQL est ignoré sans `STI_TEST_POSTGRES_URL`. | À exécuter sur une base jetable `sti_xp_tests` avant une publication majeure. |

---

## ▶️ Rejouer la campagne

```bash
npm ci
node --test tests/*.test.mjs                          # 338 réussis, 1 ignoré
python3 -m unittest discover -s tests -p 'test_*.py'   # 7 réussis
npx playwright install chromium                        # poste disposant d'un navigateur
for suite in accueil-personnalise ajustements-cours badge-reprise mobile-nav fidelite \
             css3 javascript sql-php demandes parcours main-integration sw-fidelite v303; do
  npx playwright test --config "tests/playwright-$suite.config.mjs"
done
python3 -m http.server 4173 --bind 0.0.0.0             # aperçu local de la plateforme
```

---

## 🧭 Fichiers modifiés

| Fichier | Nature |
|---|---|
| `assets/js/protection.js` | **Correctif** — relais `brancherSuiviVideoSTIExpose` (bug bloquant) |
| `sw.js` | Révision du delta `protection.js` → `suivi-video-repare-v554` |
| `README.md` | En-tête de version actualisé (v553 / `sti-atelier-v386`) |
| `robots.txt` | Directive `Sitemap` ajoutée |
| `tests/test_smart_books_3si.py` | Assertion de version du cache rendue non figée |
| `tests/suivi-video-v551.test.mjs` | Vérification du nouveau branchement |
| `tests/{main-integration,quiz-sans-videos,video-boucle-pour,video-defis37,video-tp6,vues-videos-admin}.test.mjs` | Révision attendue de `protection.js` |
| `offline-complete-manifest.json` | Empreintes et `totalBytes` resynchronisés |

**Suite de tests après modifications : 338 réussis, 0 échec, 1 ignoré — 7/7 en Python.**
