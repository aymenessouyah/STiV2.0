# STI By AE — Plateforme pédagogique STI V2.0

Plateforme francophone d'apprentissage pour les élèves de **3ᵉ et 4ᵉ Sciences de l'informatique** en Tunisie. Elle réunit cours, séries d'exercices, corrigés, quiz, vidéos, outils de révision et espaces de suivi dans une application web installable.

**[Ouvrir la plateforme](https://aymenessouyah.github.io/STiV2.0/)** · Auteur : **M. Aymen Essouyah**, Lycée Raféha

> L'identité de la version publiée et sa date UTC se trouvent dans [`sw.js`](sw.js), variables `VERSION_PUBLIEE` et `PUBLIEE_LE`. Les disponibilités et les droits dépendent de la classe, du compte, de la configuration et de la connexion.

## Sommaire

- [Premiers pas](#premiers-pas)
- [Cours et ressources pédagogiques](#cours-et-ressources-pédagogiques)
- [Exercices, projets et laboratoires](#exercices-projets-et-laboratoires)
- [Quiz et progression](#quiz-et-progression)
- [Vidéos et livres connectés](#vidéos-et-livres-connectés)
- [Enseignement et administration](#enseignement-et-administration)
- [Installation et utilisation hors ligne](#installation-et-utilisation-hors-ligne)
- [Architecture et organisation](#architecture-et-organisation)
- [Développement local](#développement-local)
- [Tests et vérifications](#tests-et-vérifications)
- [Publication et maintenance](#publication-et-maintenance)
- [Sauvegarde, sécurité et limites](#sauvegarde-sécurité-et-limites)
- [Documentation complémentaire](#documentation-complémentaire)

## Premiers pas

1. Ouvrir le [portail](portail.html) ou l'[accueil](index.html), puis utiliser les rubriques de navigation pour accéder aux cours, exercices, vidéos ou quiz.
2. Choisir sa classe et, si nécessaire, se connecter avec un compte autorisé. Certains contenus ou outils, notamment les ressources 4ᵉ SI et l'administration, ne sont pas destinés à tous les profils.
3. Choisir une matière, consulter le cours et ses annexes, puis travailler les énoncés avant d'ouvrir les corrigés.
4. Utiliser les cases de progression, quiz et outils de révision disponibles pour suivre son parcours. Pour synchroniser les données associées au compte, une connexion et un service configuré sont nécessaires.
5. Sur un appareil personnel, installer éventuellement l'application et télécharger les ressources nécessaires avant une utilisation sans réseau.

La navigation s'adapte au mobile ; plusieurs pages proposent des thèmes, des commandes de taille de texte, des liens d'accès rapide et une reprise de lecture. Les fonctions exactes peuvent varier selon la page et l'appareil.

## Cours et ressources pédagogiques

| Domaine | Point d'entrée | Exemples de contenus |
| --- | --- | --- |
| HTML5 | [Cours HTML5](cours/html5.html) | Structure d'une page, balises, formulaires et supports associés |
| CSS3 | [Cours CSS3](cours/css3.html) | Sélecteurs, présentation, positionnement, transitions et animations |
| JavaScript | [Cours JavaScript](cours/javascript.html) | Variables, fonctions, chaînes, tableaux, dates, DOM, exercices et éditeur |
| SQL | [Cours SQL](cours/sql.html) | Bases de données, requêtes, jointures, regroupements et sous-requêtes |
| PHP | [Cours PHP](cours/php.html) | PHP procédural, chaînes, tableaux, formulaires et accès aux données |
| Systèmes, technologies et Internet | [Cours STI](cours/systemes-technologies-internet.html) | Notions de systèmes, réseaux et Internet, ressources de révision |

Les cours combinent selon les chapitres texte, exemples, animations, vidéos, exercices et repères de progression. Des [annexes officielles](documents/annexes/) sont disponibles en PDF ou en version HTML pour HTML5, CSS3, JavaScript, SQL et PHP. Le [glossaire](glossaire.html) rassemble des termes utiles. Les fichiers PDF peuvent s'ouvrir dans le lecteur de la plateforme ou dans celui du navigateur selon l'appareil.

## Exercices, projets et laboratoires

Le [catalogue des séries](exercices/series-exercices.html) regroupe des travaux par matière et par niveau. Selon les ressources : énoncé, corrigé, script SQL, vidéo ou activité interactive. Le contenu et les accès varient d'une série à l'autre.

### Séries de synthèse

- **JavaScript** : série de synthèse avec [énoncé](exercices/javascript/serie-synthese/enonce-synthese-javascript.pdf) et [corrigé](exercices/javascript/serie-synthese/corrige-synthese-javascript.pdf), placée après la série 6.
- **PHP** : série 6 de synthèse, distincte du devoir 6, avec [énoncé](exercices/php/serie-6/enonce-serie6-php-v3.pdf) et [corrigé](exercices/php/serie-6/corrige-serie6-php-v4.pdf).
- **SQL** : série 8 « Le directeur du restaurant Dar Zitouna », avec [énoncé](exercices/sql/serie-8/enonce-serie8-restaurant-v4.pdf), [corrigé](exercices/sql/serie-8/corrige-serie8-restaurant-v3.pdf) et [jeu de données SQL](exercices/sql/serie-8/restaurant.sql). Elle ne comporte pas de vidéo dédiée.

Les bulles de synthèse comportent un badge doré et un titre animé ; l'animation est désactivée si le système demande une réduction des mouvements ou lors de l'impression.

### Pratique interactive

- Le [cours JavaScript](cours/javascript.html) comprend des exercices et un éditeur isolé permettant d'exécuter des exemples dans le navigateur. Les séries et les 37 défis complètent l'entraînement.
- Le [cours SQL](cours/sql.html) propose un atelier sur une petite base simulée ; [SQL de poche](cours/sql-playground.html) utilise `sql.js` et SQLite localement. **SQLite n'est pas MySQL** : certaines fonctions, certains types et certaines syntaxes diffèrent.
- Les [projets](projets/index.html) regroupent notamment des exemples autour des fleurs, d'un formulaire et d'une carte bancaire animée.
- La [préparation au bac pratique](bac-pratique.html), les [outils JavaScript](outils-js-bac.html), les [pièges du bac](pieges-bac.html), le [mémo de veille](memo-veille-bac.html) et la [fiche de révision](ma-fiche-revision.html) offrent d'autres entrées pour réviser.

## Quiz et progression

Les quiz portent notamment sur [HTML/CSS](quiz/html-css.html), [JavaScript](quiz/javascript.html), [SQL](quiz/sql.html), [PHP](quiz/php.html), les [tableaux](quiz/tableaux.html) et les [systèmes et Internet](quiz/systemes-internet.html). La plateforme propose aussi une [révision des erreurs](revision-erreurs.html) et des indications de score, de progression et d'XP selon les parcours.

Les questions et propositions peuvent être mélangées. Une partie reprise conserve sa série en cours ; une nouvelle partie effectue un nouveau tirage, sans garantir un résultat différent à chaque fois. Des données peuvent être conservées localement et synchronisées avec le compte lorsque le service est disponible. Les mécanismes de reprise ne garantissent pas une synchronisation immédiate sur tous les appareils.

**Attention** : le suivi et les XP sont des aides pédagogiques, pas une preuve infalsifiable d'apprentissage ou de présence. Certaines valeurs proviennent du client ; une évaluation officielle exige un contrôle approprié.

## Vidéos et livres connectés

### Vidéos

Les cours et séries donnent accès à des vidéos, capsules, repères et possibilités de reprise ou de téléchargement selon la ressource. Le suivi repose sur la **position maximale de lecture** : une vidéo est considérée terminée à 88 %, ce qui ne prouve pas qu'elle a été intégralement regardée.

La capsule SQL série 7 « Group by, Having,Sous requête,Group by vs Ss_req » est indiquée comme **provisoire** : certaines coupures audio restent à vérifier et les sous-titres complets ne sont pas disponibles.

### Smart Books

La page [Scanner mon livre](livre-smart.html) donne accès aux livres connectés et à leurs ressources, notamment aux PDF [3ᵉ SI](documents/livre/sti-smart-book-3si-2026.pdf) et [4ᵉ SI](documents/livre/sti-smart-book-2026.pdf). La recherche et le scan de QR orientent vers les ressources associées. La caméra requiert une autorisation et un contexte compatible ; en cas d'indisponibilité, utiliser les autres moyens proposés. Le scan lit des QR codes : il ne constitue pas une reconnaissance OCR générale de page.

## Enseignement et administration

Le [tableau de bord administrateur](admin.html), réservé aux comptes autorisés, rassemble des outils de suivi et de gestion : élèves, activités, quiz, cours, vidéos, connexions, sauvegarde et exports, selon les droits et la configuration. L'espace [tableau de bord](dashboard.html) fournit une autre entrée liée au suivi.

La plateforme comprend également une version Windows dédiée au **Labo 3** : un programme local et un paquet `.stipack` permettent une installation sur poste. Son fonctionnement diffère de celui du site web : notamment, le serveur local bloque l'administration, le portail et le service worker. Voir [la documentation Labo 3](outils/windows-labo3/README.md) pour les modes d'installation, les limites et les précautions relatives aux clés.

## Installation et utilisation hors ligne

La plateforme est une **application web progressive** (PWA) : son [manifeste](manifest.webmanifest) décrit l'application et son [service worker](sw.js) gère une partie des ressources et des mises à jour. L'installation peut être proposée par le navigateur ; sur certains appareils, notamment iOS, elle passe par les commandes du navigateur. L'apparence et la disponibilité de l'invitation dépendent du système et du navigateur.

Pour préparer une séance hors ligne :

1. Ouvrir la plateforme en ligne et installer l'application si souhaité.
2. Utiliser la fonction de téléchargement hors ligne proposée par la plateforme ; attendre sa fin et vérifier les ressources nécessaires.
3. Tester l'ouverture des pages, PDF et médias visés sans réseau **avant** la séance.
4. Revenir en ligne pour les fonctions connectées et la synchronisation des données.

Une installation seule ne garantit pas la présence de tous les fichiers. Les ressources lourdes ou non téléchargées, les services externes et les données cloud peuvent rester indisponibles. Le cache peut être limité ou supprimé par le navigateur. [`offline-complete-manifest.json`](offline-complete-manifest.json) inventorie le paquet complet ; les mises à jour incrémentales dans `sw.js` évitent de retélécharger automatiquement les gros médias à chaque publication.

## Architecture et organisation

Le site est principalement un **frontend statique** HTML, CSS et JavaScript, publié sur GitHub Pages. Il n'exige pas de compilation générale pour afficher les pages. Il utilise aussi des données et bibliothèques embarquées, des scripts de maintenance et des services externes.

| Composant | Rôle et chemins principaux |
| --- | --- |
| Entrées | [`portail.html`](portail.html), [`index.html`](index.html), [`admin.html`](admin.html), [`dashboard.html`](dashboard.html) |
| Pédagogie | [`cours/`](cours/), [`exercices/`](exercices/), [`quiz/`](quiz/), [`projets/`](projets/), [`documents/`](documents/) |
| Interface | [`assets/css/`](assets/css/), [`assets/js/`](assets/js/), images, icônes, PDF, sons et vidéos sous [`assets/`](assets/) |
| Comptes et données | [`assets/js/config.js`](assets/js/config.js), modules d'accès et de synchronisation, [`supabase/`](supabase/) et migrations SQL |
| Hors ligne | [`manifest.webmanifest`](manifest.webmanifest), [`sw.js`](sw.js), [`offline-complete-manifest.json`](offline-complete-manifest.json) |
| Qualité et outils | [`tests/`](tests/), [`outils/`](outils/), [`scripts/`](scripts/), [`tools/`](tools/), [workflows CI](.github/workflows/) |

**Données** : Supabase apporte notamment authentification et persistance lorsque configuré. Le navigateur conserve aussi des données et ressources locales. La clé publique du client n'est pas un secret et ne remplace pas des politiques RLS correctes ; les clés de service, mots de passe et données personnelles ne doivent jamais être placés dans le dépôt. Avant toute migration, examiner [le journal des migrations](supabase/migrations/LISEZ-MOI.md) : le registre Supabase et les fichiers du dépôt ne se correspondent pas toujours littéralement.

## Développement local

### Prérequis et démarrage

Prévoir un navigateur récent, **Node.js et npm**, ainsi que Python 3 pour les outils et tests Python. Depuis la racine du dépôt :

```bash
npm ci
node tests/server-v302.mjs
```

Ouvrir `http://localhost:4173/` sur la machine qui exécute le serveur. Le serveur est destiné aux essais locaux : il ne reproduit pas nécessairement l'hébergement, les comptes, les droits, les intégrations ni les données de production. Les fonctionnalités PWA et caméra nécessitent un contexte sécurisé approprié. Préférer des comptes et une base de test isolés ; ne pas expérimenter sur les données des élèves.

Pour arrêter le serveur lancé dans un terminal, utiliser `Ctrl+C`. L'ouverture directe d'un fichier `file://` ne reproduit pas le fonctionnement HTTP, notamment pour le service worker et certains chargements de ressources.

### Conseils de contribution

1. Identifier la page et les modules concernés ; conserver les ressources pédagogiques et les documents d'origine sauf demande explicite.
2. Vérifier les variantes bureau/mobile, les niveaux et droits concernés, les liens, l'accessibilité et le fonctionnement hors ligne lorsque pertinent.
3. Ajouter ou adapter les tests ciblés ; éviter d'inclure dans Git les fichiers temporaires, dépendances installées et archives générées.
4. Mettre à jour les révisions de cache concernées et l'identité de publication, puis examiner le diff avant livraison.

## Tests et vérifications

Les commandes suivantes sont lancées depuis la racine. `npm ci` installe les dépendances de développement ; certaines suites exigent en plus les navigateurs et dépendances système de Playwright.

```bash
# Tous les tests Node du dépôt
node --test tests/*.test.mjs

# Exemple : séries de synthèse et série 8 SQL
node --test tests/synthese-clignotante-v667.test.mjs \
  tests/serie-synthese-javascript-v666.test.mjs \
  tests/serie6-php-pdf-v661.test.mjs tests/serie8-sql-v656.test.mjs

# Tests Python
python3 -m unittest discover -s tests -p 'test_*.py' -v

# Exemples de parcours navigateur, après installation du navigateur Playwright
npx playwright install chromium
npx playwright test --config tests/playwright-javascript.config.mjs
npx playwright test --config tests/playwright-admin-mobile.config.mjs

# Contrôles techniques indépendants
node --check sw.js
python3 outils/bouclepour/manifeste.py --verifier
```

D'autres configurations se trouvent dans [`tests/`](tests/) et des raccourcis dans [`package.json`](package.json). Certains tests ont besoin de services, comptes fictifs, d'une base jetable ou d'outils supplémentaires ; consulter leurs fichiers et configurations avant exécution. Ne pas lancer les suites navigateur simultanément si elles partagent le même dossier de résultats.

Des suites historiques peuvent échouer sur des attentes de version ou de contenu devenues obsolètes ; d'autres échecs peuvent révéler des défauts réels. **Ne pas assimiler automatiquement un échec à l'un ou à l'autre** : comparer à la base et examiner chaque résultat. Un test automatisé ne remplace pas une recette sur appareils réels ni une vérification de production.

## Publication et maintenance

À chaque mise à jour destinée à être publiée :

1. Modifier les ressources et tester les parcours concernés.
2. Mettre à jour dans `sw.js` les révisions des ressources modifiées lorsqu'elles sont suivies par le mécanisme de mise à jour. Éviter d'ajouter les vidéos, PDF et autres fichiers lourds au téléchargement automatique incrémental.
3. Incrémenter la version publiée et actualiser la date et l'heure UTC ; l'outil régénère aussi le manifeste hors ligne :

```bash
python3 outils/publication/version.py --incrementer
# Remplacer <commit-base> par le commit de base de la pull request.
python3 outils/publication/version.py --verifier --base <commit-base>
python3 outils/bouclepour/manifeste.py --verifier
```

4. Relire le diff et ouvrir une pull request. La [CI de publication](.github/workflows/publication-version.yml) vérifie l'avancement du numéro et de la date par rapport à la base. Après déploiement, contrôler la version effectivement servie, les mises à jour de cache et les parcours modifiés.

Le manifeste d'installation et les caches ne remplacent pas les sauvegardes. Les archives, médias générés et jeux de données volumineux doivent respecter les conventions du dépôt et ne pas être ajoutés inutilement à Git.

## Sauvegarde, sécurité et limites

- **Deux sauvegardes complémentaires** : le code, les documents et médias du site d'une part ; les données et la configuration Supabase d'autre part. Prévoir également les sauvegardes nécessaires du stockage et des services externes. Tester régulièrement une restauration isolée.
- [SECOURS-PLATEFORME.md](SECOURS-PLATEFORME.md) décrit la fabrication des volumes de secours (`npm run secours`, `npm run secours:documents`, `npm run secours:tout`) et les étapes de restauration. Les archives produites ne contiennent pas automatiquement les données élèves ; leur périmètre doit être vérifié.
- La sauvegarde et l'export Drive exigent leur propre configuration et des autorisations adaptées. Les documents de secours peuvent contenir des détails historiques : contrôler les scripts et la configuration actuelle avant intervention.
- Les droits d'interface ne suffisent pas à protéger des fichiers statiques publics : ne pas utiliser GitHub Pages pour héberger des informations confidentielles en supposant qu'un bouton masqué les protège.
- Les politiques de base, fonctions et accès doivent être vérifiés côté serveur. Ne jamais publier de clé `service_role`, de clé privée, de mot de passe ou de données personnelles.
- Les modes hors ligne, synchronisations, métriques de lecture et XP ont les limites décrites ci-dessus. Les constats de [l'audit v649](docs/audit-plateforme-v649.md) sont historiques, non une garantie sur l'état actuel.

## Documentation complémentaire

- [Sauvegarde et restauration](SECOURS-PLATEFORME.md) · [Renforcement de sécurité](SECURITE-RENFORCEMENT.md)
- [Documentation Windows Labo 3](outils/windows-labo3/README.md) · [Migrations Supabase](supabase/migrations/LISEZ-MOI.md)
- [Intégration du Smart Book 3ᵉ SI](docs/SMART-BOOK-3SI-INTEGRATION.md) · [Vérification Smart Book](docs/SMART-BOOK-VERIFICATION.md)
- [Rapport d'audit v553](RAPPORT-audit-plateforme-v553.md) · [Rapport de tests v624](RAPPORT-tests-plateforme-v624.md)
- [README historique v653](docs/readme-historique-v653.md) : archive, chiffres et descriptions non nécessairement à jour.
