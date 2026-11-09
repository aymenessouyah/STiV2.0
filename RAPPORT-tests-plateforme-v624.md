# Rapport de validation — STI V2.0 (v624)

**Date :** 7 novembre 2026  
**Portée :** corrections de débordement mobile, cohérence de la Série 6 SQL et application des réglages Guide aux ressources TP6.  
**Branche :** `arena/639e2906-stiv2-0`.

## Résultats

| Batterie | Résultat | Détails |
|---|---:|---|
| Node (`node --test tests/*.test.mjs`) | **740 tests : 739 réussis, 0 échec, 1 ignoré** | Exécution finale après suppression des artefacts Playwright. |
| Python (`python3 -m unittest discover -s tests -p 'test_*.py' -v`) | **7/7 réussis** | Aucun échec. |
| Playwright | **258 résultats : 201 réussis, 57 en échec** | Les 18 configurations `tests/playwright-*.config.mjs` et le parcours v302 (configuration par défaut) ont été exécutés lors de la validation précédente. Après l’intégration du masquage TP6, le test navigateur ciblé a confirmé les deux modes de cases décrits plus bas; la batterie Playwright complète n’a pas été relancée. |
| Audit statique (`node outils/audit/audit-plateforme.mjs`) | **0 bloquant, 0 avertissement, 5 informations** | Les informations restantes sont les remarques habituelles sur le poids de pages, quelques scripts d’en-tête et des recommandations d’accessibilité. |
| Manifeste hors ligne | **781 fichiers** | Resynchronisé après les dernières modifications; 1 entrée mise à jour au dernier passage, aucune entrée manquante. |
| Git | `git diff --check` | Aucun problème d’espacement détecté. |

## Playwright — ventilation des lancements

| Suite | Réussis | Échecs |
|---|---:|---:|
| v302 (configuration par défaut) | 7 | 0 |
| accueil-personnalise | 10 | 1 |
| ajustements-cours | 10 | 6 |
| badge-reprise | 8 | 3 |
| mobile-nav | 1 | 2 |
| fidelite | 12 | 2 |
| css3 | 3 | 0 |
| javascript | 15 | 1 |
| sql-php | 15 | 3 |
| demandes | 5 | 3 |
| parcours | 6 | 1 |
| main-integration | 8 | 3 |
| sw-fidelite | 1 | 15 |
| v303 | 10 | 0 |
| xp-quiz | 20 | 9 |
| quiz-tirages | 18 | 0 |
| reconnexion-maj | 6 | 2 |
| nouvelle-verification | 14 | 4 |
| progression-lecture | 32 | 2 |
| **Total** | **201** | **57** |

Les tests en échec signalent surtout des attentes strictes qui ne correspondent plus aux données courantes : anciennes révisions du service worker, anciens libellés/initiales, nombres de cartes ou ressources attendus, ainsi que des chemins de retour ou du texte devenus obsolètes. D’autres vérifications dépendent de l’état de session, du stockage ou de synchronisations XP simulées; certaines attentes ont reçu des valeurs différentes de celles semées et quelques tests ont rencontré des délais de navigation. Ces échecs sont documentés tels qu’observés, pas comptés comme réussites. Aucun n’a pour objet le catalogue SQL corrigé dans cette modification.

**Limitation navigateur :** l’installation Playwright de Chromium a échoué sur `ECONNRESET`; les suites ont été exécutées avec le binaire Chromium de remplacement déjà disponible dans l’environnement (`/tmp/chromium`).

## Correction de cohérence SQL

La Série 6 SQL correspond à **Mission cinéma (TP6)**. Le récapitulatif de la base ÉTUDIANT est nommé distinctement, sans numéro de série, dans le catalogue Guide exercice, ses pages d’énoncé/corrigé et la carte de la page des séries. Le catalogue inclut l’énoncé TP6 sous son vrai titre. La page de correction vidéo partage la clé de l’énoncé : les cases « Corrections » et « Vidéos » de cette ligne commandent donc les ressources réelles, indépendamment l’une de l’autre. Le service worker v624 invalide les pages et le module concernés.

Vérifications ciblées après le correctif : **27/27 tests** des suites Guide exercice, lisibilité et capsule TP6 réussis. Chromium a confirmé que décocher les deux cases masque le lecteur vidéo, son lien direct et le lien du corrigé PDF; laisser le corrigé coché tout en décochant Vidéos conserve le PDF visible et masque les éléments vidéo. Le test couvre aussi le partage de réglage entre l’énoncé et la page compagnon de correction.

## Journaux détaillés

- Tests Node : `/tmp/tests-final-tp6-guide2.log`
- Journaux Playwright : `/tmp/pw-logs/*.log`
- Environnement Chromium de remplacement : `/tmp/chromium` et `/tmp/libs/lib`
