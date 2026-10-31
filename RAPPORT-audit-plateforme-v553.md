# Rapport d’audit de la plateforme — v553

**Date** : 2026-10-31 · **Pages auditées** : 139 · **Liens vérifiés** : 1625 · **Questions de quiz** : 660

| Constats | Nombre |
|---|---|
| ⛔ Bloquants | 0 |
| ⚠️ Majeurs | 0 |
| ℹ️ Mineurs | 5 |
| ✅ Conformes | 21 |

## Réponse aux huit questions

| Question | Verdict | Ce qui a été mesuré |
|---|---|---|
| Fluidité | ✅ conforme | preload des vidéos, animations sur transform/opacity, écouteurs passifs, « réduire les animations » — Les 39 vidéos des pages attendent un clic (preload metadata/none) · Les 12 animations du thème restent sur transform/opacity · Les 19 écouteurs de défilement sont passifs · prefers-reduced-motion respecté dans le thème et dans la grille des capsules |
| Rapidité | ✅ conforme (réserves mineures) | poids des pages, scripts bloquants, cache hors-ligne, images différées — 51 page(s) dépassent 1,5 Mo de code · 8 script(s) bloquant(s) dans l’en-tête (petits fichiers, ordre imposé) |
| Sécurité | ✅ conforme | secrets, RLS, administration, liens _blank, CSP — RLS active sur les 10 tables créées par les migrations · Aucune clé de service (service_role) dans les pages ni les scripts · Aucun eval / new Function hors bac à sable · Tous les liens _blank sont isolés (rel=noopener) · Content-Security-Policy déclarée sur 88/139 pages · admin.js vérifie la session et l’adresse de l’administrateur avant d’afficher quoi que ce soit · Seule la clé publique (sb_publishable_) est exposée côté client |
| Accès aux cours, vidéos et exercices | ✅ conforme | liens, ancres, vidéos du catalogue, menu — Tous les liens et ancres locaux existent (1625 vérifiés) · Les 27 vidéos du catalogue sont livrées (957 Mo de médias) · 19 pages de cours et 72 pages d’exercices joignables |
| Quiz : tirage aléatoire à chaque entrée | ✅ conforme | mélange des questions et de la place de la bonne réponse — Les 6 quiz tirent questions et réponses à chaque partie |
| XP : synchronisation entre appareils | ✅ conforme | file locale, envoi idempotent, maximum conservé — Scores et réponses passent par une file locale puis un envoi idempotent |
| Quiz conformes aux annexes | ✅ conforme | vocabulaire des énoncés et des bonnes réponses — Quiz ↔ annexes : 91 % du vocabulaire vient directement de l’annexe, 98 % avec le cours |
| Souplesse en mode mobile | ✅ conforme | viewport, navigation, cibles tactiles, points de rupture — Les 139 pages déclarent un viewport adapté · Menu mobile accessible (aria-expanded) et 29 points de rupture dans le thème |

| Axe | Constat | Niveau | Détail |
|---|---|---|---|
| Accès | Tous les liens et ancres locaux existent (1625 vérifiés) | ✅ ok |  |
| Accès | Les 27 vidéos du catalogue sont livrées (957 Mo de médias) | ✅ ok |  |
| Accès | 19 pages de cours et 72 pages d’exercices joignables | ✅ ok |  |
| Quiz | Les 6 quiz tirent questions et réponses à chaque partie | ✅ ok | 6 s’appuient sur le module commun STIQuizAlea (crypto.getRandomValues). Redirection ignorée : pp.html. |
| XP | Scores et réponses passent par une file locale puis un envoi idempotent | ✅ ok |  |
| Annexes | Quiz ↔ annexes : 91 % du vocabulaire vient directement de l’annexe, 98 % avec le cours | ✅ ok | HTML5 : 126 questions · 92 % dans l’annexe, 92 % avec le cours<br>CSS3 : 137 questions · 87 % dans l’annexe, 98 % avec le cours<br>JAVASCRIPT : 63 questions · 96 % dans l’annexe, 100 % avec le cours<br>SQL : 86 questions · 88 % dans l’annexe, 99 % avec le cours<br>PHP : 82 questions · 94 % dans l’annexe, 98 % avec le cours<br>Seuls écarts (énoncé + bonne réponse) : html5 : alternatives, html5 : picture, html5 : alternatifs, css3 : alternance, css3 : diaires, sql : adddate, php : debut, php : gorienne |
| Mobile | Les 139 pages déclarent un viewport adapté | ✅ ok |  |
| Mobile | Menu mobile accessible (aria-expanded) et 29 points de rupture dans le thème | ✅ ok |  |
| Fluidité | Les 39 vidéos des pages attendent un clic (preload metadata/none) | ✅ ok |  |
| Fluidité | Les 12 animations du thème restent sur transform/opacity | ✅ ok |  |
| Fluidité | Les 19 écouteurs de défilement sont passifs | ✅ ok |  |
| Fluidité | prefers-reduced-motion respecté dans le thème et dans la grille des capsules | ✅ ok |  |
| Rapidité | 51 page(s) dépassent 1,5 Mo de code | ℹ️ mineur | Positionnement-animee/index.html — 1653 Ko<br>admin.html — 1968 Ko<br>bac-pratique.html — 1613 Ko<br>cours/PHP-recap.html — 1618 Ko<br>cours/Recap-JavaScript-STI.html — 1682 Ko<br>cours/annexe-fleuriste-html5.html — 1668 Ko<br>cours/courscss3.html — 1747 Ko<br>cours/courshtml5.html — 2097 Ko<br>cours/coursphp.html — 1652 Ko<br>cours/css3.html — 2154 Ko<br>cours/fiche-revision-html5.html — 1719 Ko<br>cours/html5.html — 2126 Ko |
| Rapidité | 8 script(s) bloquant(s) dans l’en-tête (petits fichiers, ordre imposé) | ℹ️ mineur | dashboard.html → assets/js/config.js?v=479<br>index.html → assets/js/config.js?v=479<br>quiz/pp.html → ../assets/js/retour-quiz.js<br>quiz/systemes-internet.html → ../assets/js/quiz-systemes-boot.js?v=580<br>quiz/tableaux.html → ../assets/js/quiz-tableaux-boot.js?v=456<br>revision-erreurs.html → assets/js/config.js?v=476<br>revision-erreurs.html → assets/js/supabase-umd.js<br>revision-erreurs.html → assets/js/quiz-sync.js?v=460 |
| Rapidité | Service worker prêt : 772 fichiers décrits hors-ligne (v582-sti-atelier-v386) | ✅ ok |  |
| Rapidité | Chargement différé des images : 125/209 (60 %) | ✅ ok |  |
| Sécurité | RLS active sur les 10 tables créées par les migrations | ✅ ok |  |
| Sécurité | Aucune clé de service (service_role) dans les pages ni les scripts | ✅ ok |  |
| Sécurité | Aucun eval / new Function hors bac à sable | ✅ ok |  |
| Sécurité | Tous les liens _blank sont isolés (rel=noopener) | ✅ ok |  |
| Sécurité | Content-Security-Policy déclarée sur 88/139 pages | ✅ ok |  |
| Sécurité | admin.js vérifie la session et l’adresse de l’administrateur avant d’afficher quoi que ce soit | ✅ ok |  |
| Sécurité | Seule la clé publique (sb_publishable_) est exposée côté client | ✅ ok |  |
| Accessibilité | Page(s) sans h1 (15) | ℹ️ mineur | Positionnement-animee/index.html, cssanimee/index.html, exercices/html-css/activite-html-css/Act1/page1.html, exercices/html-css/emploi-temps/emploidutemps.html, exercices/html-css/tp-transitions-animations/exercice2.html, exercices/php/debogage-php-bac.html, exercices/php/trace-fetch-php.html, exercices/sql/atelier_sql_3_fenetres.html, projets/carte-bancaire/cb.html, projets/fleurs/index.html, projets/fleurs/inscription.html, projets/sti0/Sondage.html, projets/sti0/Statistiques.html, projets/sti0/sondage.html, projets/sti0/statistiques.html |
| Accessibilité | Champ(s) sans étiquette (back-office et formulaires de démonstration) (29) | ℹ️ mineur | admin.html (74), cours/PHP-recap.html (25), cours/courscss3.html (38), cours/courshtml5.html (1), cours/css3.html (47), cours/datalist.html (4), cours/html5.html (14), cours/javascript.html (27), cours/php-recap.html (25), cours/php.html (37), cours/sql-contraintes.html (9), cours/sql.html (58), exercices/html-css/tp-formulaire-tableau-autre/index.html (2), exercices/javascript/TP Train/Enonce_TP_TrainTN_JavaScript.html (8), exercices/javascript/TP Train/Ressource_eleve_TrainTN.html (8) |
| Accessibilité | Page(s) sans lien d’évitement (118) | ℹ️ mineur | 404.html, admin.html, bac-pratique.html, carte-visite.html, cours/PHP-recap.html, cours/Recap-JavaScript-STI.html, cours/annexe-fleuriste-html5.html, cours/courscss3.html, cours/courshtml5.html, cours/coursphp.html, cours/datalist.html, cours/fiche-revision-html5.html, cours/php-recap.html, cours/sql-bases-ldd-lmd-lcd.html, cours/sql-contraintes.html |

## Chiffres relevés

- **liens** : 1625
- **videos** : 233
- **poidsVideos** : 1002976367
- **catalogue** : 27
- **exercices** : 72
- **cours** : 19
- **quiz** : 6
- **tables** : 10
- **banque** : 660
- **annexes** : jetons = 365 · tauxAnnexe = 91 · tauxSources = 98 · horsSources = 8
- **medias** : 29
- **videosHtml** : 39
- **keyframes** : 12
- **keyframesDisposition** : 0
- **ecouteursDefilement** : 19
- **pagesLourdes** : 51
- **offline** : 772
- **images** : imgTotal = 209 · lazyTotal = 125
- **csp** : 88

## Comment relancer

```bash
node outils/audit/audit-plateforme.mjs          # résumé et rapport
node outils/audit/audit-plateforme.mjs --strict # échoue si un constat bloquant subsiste
```
