# STI By A'e — Plateforme pédagogique STI V2.0

Une plateforme d’apprentissage pour les élèves de **3ᵉ et 4ᵉ Sciences de l’informatique** en Tunisie : cours, exercices, vidéos, quiz et outils de suivi réunis dans une application web installable.

**[Accéder à la plateforme](https://aymenessouyah.github.io/STiV2.0/)** · Auteur : **M. Aymen Essouyah**, Lycée Raféha

> **Publication : v655** — l’identité et la date UTC de la version effectivement servie sont définies dans [`sw.js`](sw.js). Certaines fonctionnalités et ressources sont réservées aux 4ᵉ SI ou aux comptes autorisés.

## Pour les élèves

- **Cours interactifs** : HTML5, CSS3, JavaScript, SQL, PHP et systèmes, technologies et Internet, avec supports, animations et ressources associées.
- **Exercices et préparation au bac** : énoncés, corrigés, séries, défis et outils de révision. Le laboratoire SQL permet de s’exercer avec SQLite dans le navigateur.
- **Vidéos** : capsules et cours avec repères de navigation et suivi de lecture. La capsule SQL série 7 « Group by, Having,Sous requête,Group by vs Ss_req » reste provisoire : certaines coupures audio sont à vérifier et les sous-titres complets manquent.
- **Quiz et révisions** : questions et propositions mélangées, suivi des scores et XP, reprise d’une partie active et espace « Mes erreurs ». Une reprise conserve la série en cours ; une nouvelle partie déclenche un nouveau tirage. Un tirage aléatoire ne garantit pas une série différente à chaque fois.
- **Smart Books** : deux livres connectés pour les 3ᵉ et 4ᵉ SI ; les QR codes renvoient aux ressources correspondantes.
- **Hors ligne** : l’application peut fonctionner sans réseau pour les ressources préalablement mises en cache. Les vidéos, documents volumineux et autres contenus non téléchargés ne sont pas nécessairement disponibles hors ligne ; la synchronisation en ligne reste nécessaire pour les données cloud.

## Pour l’enseignant

Le [tableau de bord administrateur](admin.html), réservé aux comptes autorisés, regroupe notamment le suivi des élèves, des cours, des quiz, des vidéos et des connexions, ainsi que les outils de gestion et d’export. Les sauvegardes de la base et la procédure de secours de la plateforme sont documentées dans [SECOURS-PLATEFORME.md](SECOURS-PLATEFORME.md).

## Organisation du dépôt

| Chemin | Contenu |
| --- | --- |
| [`index.html`](index.html) | Accueil et accès aux ressources |
| [`cours/`](cours/) · [`exercices/`](exercices/) · [`quiz/`](quiz/) | Cours, travaux pratiques et quiz |
| [`livre-smart.html`](livre-smart.html) | Accès aux Smart Books |
| [`admin.html`](admin.html) | Tableau de bord enseignant |
| [`assets/`](assets/) | Scripts, styles, images, données et médias |
| [`sw.js`](sw.js) · [`offline-complete-manifest.json`](offline-complete-manifest.json) | Service Worker, publication et inventaire hors ligne |
| [`documents/sql/`](documents/sql/) | Scripts SQL et outils liés aux données |
| [`tests/`](tests/) · [`outils/`](outils/) | Tests automatisés, outils de fabrication et de maintenance |

## Architecture et données

Le site est principalement un **frontend statique** publié sur GitHub Pages. Supabase fournit l’authentification et la persistance des données ; le Service Worker et les stockages du navigateur contribuent au fonctionnement hors ligne et à la reprise. Les fonctionnalités connectées dépendent de leur configuration et de la disponibilité des services.

La sauvegarde des données Supabase et celle des fichiers du site sont complémentaires : conserver les deux et vérifier régulièrement leur restauration. Les scripts de sauvegarde Drive nécessitent leur propre configuration. Ne jamais placer de secrets, clés de service ou données personnelles dans le dépôt.

## Développement local

Prérequis : **Node.js et npm**, Python 3 pour certains outils, et un navigateur récent. Depuis la racine du dépôt :

```bash
npm ci
node tests/server-v302.mjs
```

Ouvrir ensuite `http://localhost:4173/` sur la machine qui exécute le serveur. Ce serveur est destiné aux tests locaux ; il ne remplace pas la configuration de production. Les accès protégés, les connexions réelles et les intégrations externes exigent une configuration et des comptes appropriés. Pour les essais de données, privilégier un environnement jetable plutôt que la production.

## Tests

```bash
# Suite Node complète
node --test tests/*.test.mjs

# Tests ciblés quiz, tirages et XP
node --test tests/quiz-alea.test.mjs tests/quiz-sessions-v490.test.mjs \
  tests/quiz-systemes-v580.test.mjs tests/xp-jamais-en-recul-v520.test.mjs \
  tests/xp-quiz-concurrence.test.mjs tests/xp-quiz-sql.test.mjs

# Vérifications Smart Books
python3 tests/test_smart_books_3si.py

# Parcours navigateur : installer les navigateurs et dépendances Playwright au préalable
npx playwright test --config tests/playwright-quiz-tirages.config.mjs
npx playwright test --config tests/playwright-xp-quiz.config.mjs
```

Les tests navigateur utilisent des comptes et services fictifs dans ces scénarios ; ils ne certifient pas les connexions de production. Le test PostgreSQL externe est ignoré sans base jetable configurée. Consulter les fichiers de tests et les configurations Playwright pour les autres parcours.

**Dernier état connu des tests**, sur la branche issue de v653 : la suite Node complète a donné 756 réussites, 59 échecs et 1 test ignoré sur 816. Plusieurs échecs concernent des attentes historiques figées, mais ils n’ont pas tous été analysés. Les tests navigateur n’ont pas pu démarrer dans l’environnement de contrôle, faute de bibliothèques système Chromium. Ces résultats ne constituent pas une certification de la plateforme ; une recette sur appareils réels reste nécessaire.

## Limites et vigilance

- Le suivi vidéo est fondé sur la **position maximale de lecture** ; à partir de 88 %, la vidéo est marquée terminée. Il ne mesure pas nécessairement le temps réellement regardé.
- Les gains XP sont synchronisés avec des mécanismes de reprise et de déduplication, mais les valeurs transmises par le client ne prouvent pas que les réponses ont réellement été données. Ne pas considérer les XP comme une évaluation infalsifiable.
- Le mode hors ligne et la synchronisation peuvent dépendre du cache, du navigateur, de la connexion et du compte. Vérifier les scénarios de reprise et de changement d’appareil avant une utilisation critique.
- L’audit [v649](docs/audit-plateforme-v649.md) détaille ces constats à sa date ; il ne remplace pas une vérification de sécurité ou de disponibilité actuelle.

## Publication et maintenance

Après une modification à publier, actualiser les révisions des ressources modifiées dans `sw.js`, puis avancer la version et régénérer le manifeste :

```bash
python3 outils/publication/version.py --incrementer
# Remplacer <commit-base> par le commit de base de la pull request.
python3 outils/publication/version.py --verifier --base <commit-base>
```

La CI vérifie que le numéro et la date de publication ont avancé par rapport à la base. Le téléchargement complet hors ligne reste une action volontaire : ne pas ajouter automatiquement les médias lourds au delta de mise à jour. Les fichiers volumineux et les rendus intermédiaires doivent suivre les conventions du dépôt et de ses outils.

L’ancienne documentation détaillée et l’historique antérieur sont conservés à titre d’archive dans [docs/readme-historique-v653.md](docs/readme-historique-v653.md) ; ses chiffres et descriptions ne reflètent pas nécessairement l’état actuel.
