# Publier le manuel connecté de 3ème SI

## Ce que contient le ZIP

Un complément à la plateforme existante, **pas une sauvegarde complète du dépôt** : nouveau PDF et index 3ème SI, scanner commun aux deux éditions, styles, service worker, manifeste hors ligne, tests et documentation. Le PDF et l’index de 4ème SI ne sont pas remplacés. Aucun fichier de cours, de connexion ou d’administration n’est modifié.

Base de préparation : commit `1c29d5240b8c829e55c7f6ffb1981035d2ddc35f`.

## Sur téléphone, dans GitHub Codespaces

1. Ouvrir le Codespace du dépôt **STiV2.0**, puis son terminal à la racine du dépôt.
2. Exécuter `git status --short`. S’il y a des modifications personnelles, les sauvegarder/committer avant de continuer. Puis exécuter `git pull --ff-only`.
3. Si les fichiers du scanner, `sw.js` ou le manifeste ont changé depuis le commit indiqué ci-dessus, comparer les changements avant d’extraire le ZIP : l’extraction écrase les fichiers de même nom.
4. Télécharger `STI-Smart-Book-3SI-Integration.zip` depuis cette conversation et le téléverser dans le dossier racine du Codespace, avec l’explorateur de fichiers.
5. Exécuter :

```bash
python -m zipfile -e STI-Smart-Book-3SI-Integration.zip .
python tests/test_smart_books_3si.py
git diff --stat
```

Les six tests doivent réussir sur la base de préparation. Si seul le contrôle du PDF 4SI échoue parce que vous l’avez volontairement remplacé depuis, vérifier la modification et adapter son empreinte attendue ainsi que son entrée dans le manifeste ; ne pas restaurer automatiquement un ancien PDF.

6. Vérifier les fichiers, puis publier :

```bash
git add livre-smart.html assets/css/smart-book.css assets/js/smart-book.js assets/data/smart-book-3si-2026.json documents/livre/sti-smart-book-3si-2026.pdf sw.js offline-complete-manifest.json tests/test_smart_books_3si.py docs/SMART-BOOK-3SI-INTEGRATION.md docs/SMART-BOOK-3SI-COMPARAISON.md docs/verification_liens_3si.json
git commit -m "Ajouter le Smart Book 3SI et le scanner multi-manuels"
git push
```

Le ZIP téléversé n’est volontairement pas ajouté au commit. Attendre la réussite du déploiement GitHub Pages habituel du dépôt.

## Vérification après publication

- Ouvrir **Scanner mon livre** depuis la plateforme. Si une ancienne interface persiste, fermer les onglets de la plateforme et la rouvrir après la mise à jour du service worker.
- Choisir **3ème SI** : 54 pages, 50 fiches ; vérifier le téléchargement du nouveau PDF.
- Rechercher la page **46** : « SELECT simple : choisir les colonnes ».
- Photographier le QR de cette page alors que le scanner affiche 4ème SI : il doit passer automatiquement à 3ème SI et proposer la bonne leçon.
- Tester aussi un ancien QR du manuel 4ème SI et sa recherche par page : 74 pages, 69 fiches.
- Vérifier sur le vrai téléphone l’autorisation caméra, puis l’ouverture d’un cours avec le compte utilisateur habituel. Les protections existantes restent en place.

## Hors ligne et retour arrière

Le service worker conserve le nom du cache existant et les anciennes révisions cumulatives. Les petites ressources du scanner et le nouvel index sont mis à jour de manière incrémentale ; les PDF ne sont pas ajoutés au téléchargement automatique. Le PDF 3SI est inscrit au manifeste d’installation complète volontaire.

Pour annuler une publication, utiliser `git revert` sur le commit d’intégration, puis `git push`. Ne pas employer `reset --hard` sur des modifications personnelles.

## Alternative pour une personne à l’aise avec Git

Le fichier séparé `STI-Smart-Book-3SI.patch` contient le même différentiel, PDF binaire inclus. Sur une copie propre et compatible, `git apply --check STI-Smart-Book-3SI.patch` permet de contrôler la compatibilité avant `git apply STI-Smart-Book-3SI.patch`. Utiliser **soit** le ZIP, **soit** le patch, pas les deux.

**Cette livraison est prête à intégrer ; elle n’a pas encore été publiée par l’assistant.**
