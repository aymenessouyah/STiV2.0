# Publication — livres avec schémas et tableaux récapitulatifs

## Paquet actuel

**STI-Livres-Recapitulatifs-Integration.zip** remplace les paquets précédents. Il contient le scanner commun, les deux index, les deux nouveaux PDF, le manifeste et la mise à jour hors ligne, les tests et la documentation.

- 3SI : 72 pages ; 53 fiches + 15 pages de tableaux ; 68 pages indexées.
- 4SI : 100 pages ; 77 fiches + 18 pages de tableaux ; 95 pages indexées.

Les pages du cours antérieur restent au même numéro ; les récapitulatifs sont ajoutés après les pages 54 et 76. Les titres PHP, certains liens de référence et les index ont également été corrigés dans les versions récentes.

Base Git de préparation : `1c29d5240b8c829e55c7f6ffb1981035d2ddc35f`. Ce ZIP est un complément au dépôt, pas une sauvegarde complète. Vérifier les changements ultérieurs du scanner, du service worker et du manifeste avant d’écraser ces fichiers.

## Dans Codespaces, sur ordinateur

À la racine du dépôt :

```bash
git status --short
```

Si des modifications personnelles apparaissent, les sauvegarder avant de continuer. Puis `git pull --ff-only`. Téléverser le ZIP à la racine et, après comparaison des fichiers modifiés depuis la base indiquée, exécuter :

```bash
python -m zipfile -e STI-Livres-Recapitulatifs-Integration.zip .
python tests/test_smart_books_3si.py
git diff --stat
```

Les six tests doivent réussir. En cas d’échec, ne pas pousser avant d’avoir identifié la cause. Le test du PDF 4SI vérifie cette livraison précise : un remplacement volontaire nécessite une nouvelle empreinte cohérente dans le test et le manifeste.

Publier uniquement les fichiers concernés :

```bash
git add livre-smart.html assets/css/smart-book.css assets/js/smart-book.js assets/data/smart-book-3si-2026.json assets/data/smart-book-2026.json documents/livre/sti-smart-book-3si-2026.pdf documents/livre/sti-smart-book-2026.pdf sw.js offline-complete-manifest.json tests/test_smart_books_3si.py docs/SMART-BOOK-3SI-INTEGRATION.md docs/SMART-BOOK-3SI-COMPARAISON.md docs/SMART-BOOK-VERIFICATION.md docs/verification_liens_3si.json docs/verification-corrections-livres.json

git commit -m "Simplifier JavaScript et PHP et ajouter les signets par familles"
git push
```

Attendre la réussite de GitHub Pages. Le ZIP ne doit pas être ajouté au commit.

## Contrôles après publication

- Scanner : choisir 3SI, vérifier 72 pages, puis chercher les pages 52, 53, 54, 58 et 72.
- Choisir 4SI, vérifier 100 pages, puis chercher les pages 67, 68, 77, 78, 79, 83, 97 et 100.
- Télécharger les deux PDF, ouvrir le sommaire et cliquer les nouvelles rubriques de tableaux.
- Scanner le QR d’une nouvelle page 3SI lorsque 4SI est sélectionné : le manuel doit changer automatiquement.
- Vérifier sur le vrai téléphone l’autorisation caméra et l’accès à un cours avec le compte habituel.

Publier les PDF et les index ensemble. Le nom du cache existant est conservé ; les PDF ne sont pas ajoutés au téléchargement automatique. Le manifeste d’installation complète volontaire contient leurs nouvelles empreintes.

Cette mise à jour ne modifie ni les protections d’accès, ni les pages de cours partagées, ni les fonctions d’administration. Pour annuler une publication, faire un `git revert` du commit puis `git push`, sans écraser les modifications personnelles.

**L’assistant n’a effectué aucun push ni déploiement.**

## Cette révision
- Méthodes JavaScript demandées retirées des cours, TP et tableaux.
- Number.isFinite et Option : contre-exemples rouges et barrés uniquement.
- PHP : sans sprintf ni preg_match ; nouvelle fiche sur les types d’erreurs.
- Signets PDF hiérarchisés par familles ; aucune modification du menu de la plateforme.

## Tableau des erreurs PHP
Le tableau enrichi est ajouté page 67, avant les explications détaillées page 68. L’exemple Deprecated emploie strlen(null), car le paramètre hostname de mysqli_connect est nullable. Les messages sont indicatifs et les exemples volontairement fautifs. Cache : v337-erreurs-php-tableau.

## Fiches méthode — révision actuelle
Trois fiches adaptées dans chaque livre : méthode de résolution et traçage ; erreurs fréquentes ; tests et checklist. Pages 52 à 54 en 3SI et 77 à 79 en 4SI. Nouvelle famille de signets PDF. Pas de nouvelle série d’exercices. Cache : v338-fiches-methode. Les QR des fiches méthode ouvrent l’accueil des cours ; aucune nouvelle page de cours n’a été publiée sur la plateforme.
