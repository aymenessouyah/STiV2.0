# Audit ciblé de la plateforme — v649

Contrôle réalisé le 12 novembre 2026 sur la branche de travail et, en lecture seule, sur le projet Supabase configuré par l'application. Les données individuelles ne sont pas reproduites ici. Il ne s'agit pas d'une certification de sécurité ni d'une vérification exhaustive de tous les appareils et comptes.

## Résumé

- **Corrigé :** la vidéo CSS Display retirée figurait encore dans le dénominateur des vidéos à suivre. Elle reste dans l'historique administratif, mais ne compte plus dans le bilan. L'inventaire du bilan correspond désormais aux 28 vidéos de la vitrine : 19 communes et 9 réservées 4e SI. Les vidéos hors catalogue restent identifiées comme telles.
- **Priorité sécurité :** les fonctions serveur d'attribution des XP utilisent des valeurs et des gains fournis par le client. Elles vérifient l'identité, des bornes et l'idempotence, mais ne prouvent pas que les réponses ont réellement été données. Un utilisateur authentifié capable de modifier ses requêtes peut gonfler ses propres XP. Ne pas considérer ces XP comme une évaluation infalsifiable. Une correction durable exige une validation des réponses et une attribution des points côté serveur, avec une stratégie compatible hors ligne et une migration progressive ; elle n'a pas été déployée par cet audit.
- **Interprétation des vidéos :** le suivi actuel est fondé sur la position de lecture maximale ; à partir de 88 %, le média est marqué terminé à 100 %, même si l'utilisateur a avancé directement. Ce n'est donc pas un pourcentage de temps réellement regardé. À changer uniquement après choix de la règle de suivi et prise en compte des progressions existantes.

## Vérifications effectuées

### Quiz et réponses

Les tests ciblés couvrent les moteurs, le mélange des questions et des propositions, le maintien de la bonne réponse, les reprises et les jeux de quiz. Les réponses ne sont pas uniformément indépendantes : le moteur applique notamment une limite pédagogique à la position A et évite certaines répétitions. Aléatoire ne signifie pas qu'un même ordre est impossible.

### XP et comptes

Dans la base de production, vérification agrégée en lecture seule : 78 profils, dont 77 actifs et 46 avec une ligne de progression. L'absence d'une ligne ne démontre pas à elle seule un défaut de synchronisation : un compte peut ne pas encore avoir utilisé le suivi.

Les 19 compteurs XP présents dans le registre de quatre quiz concordent avec les valeurs correspondantes dans les progressions et avec la somme des opérations enregistrées. Cela ne démontre pas que tous les gains mérités ont été envoyés, ni que les files locales sur chaque appareil sont vides. Les tests de concurrence et de reprise ciblés utilisent essentiellement des simulations ; le test PostgreSQL externe a été ignoré faute de base locale jetable configurée.

### Cours et vidéos

Dans le lecteur des cours concerné, le pourcentage affiché est le nombre de chapitres accessibles consultés ou révisés divisé par le nombre de chapitres accessibles. Ce n'est pas une mesure du temps de lecture. Le suivi des vidéos et des cours repose sur les données synchronisées ; toutes les situations réelles de déconnexion et tous les médias n'ont pas été vérifiés individuellement.

### Sécurité et disponibilité

Les services Supabase DB, Auth et REST ont répondu sains au moment de la consultation. La protection RLS est activée sur les 18 tables publiques relevées. Cela ne prouve pas à lui seul que toutes les politiques, fonctions, droits de stockage et opérations sont sûrs. Aucun test offensif ni modification des données de production n'a été effectué.

### Rapidité et fluidité

Aucune mesure réaliste de navigation n'a pu être exécutée : Chromium ne démarrait pas dans cet environnement à cause de bibliothèques système NSS/NSPR manquantes. Les tests navigateur ont échoué au lancement, avant de tester l'application ; ils ne démontrent donc ni une panne ni une bonne fluidité. Mesurer ensuite sur téléphone réel et réseau tunisien, à froid et à chaud, en contrôlant également les lectures vidéo et le hors-ligne.

## Tests

- Suite Node complète : **816 tests, 760 réussis, 55 échoués, 1 ignoré**. Plusieurs échecs portent sur des versions, nombres ou révisions historiques figés devenus obsolètes ; ils n'ont pas tous été analysés et ne doivent pas être simplement considérés comme inoffensifs.
- Lot ciblé quiz, XP, suivi vidéo et correction du bilan : **103 tests, 102 réussis, 1 ignoré**, aucun échec.
- Les tests navigateur (quiz, XP, cours, fidélité) n'ont pas pu s'exécuter : dépendances système manquantes.

## Suite recommandée

1. Exécuter les parcours navigateur sur une machine équipée, avec comptes fictifs, puis vérifier l'expérience sur mobile et avec une connexion instable.
2. Concevoir une attribution XP vérifiée côté serveur et tester les transitions hors ligne sans perdre les gains légitimes ; ne pas modifier les scores de production sans plan de migration.
3. Décider si la progression vidéo doit représenter la position maximale ou le temps réellement visionné ; adapter alors les calculs et la migration.
4. Trier les 55 échecs de la suite complète et distinguer les attentes historiques des véritables régressions.
