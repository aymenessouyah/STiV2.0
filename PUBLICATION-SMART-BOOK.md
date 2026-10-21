# Mise à jour STI — Scanner mon livre

## Statut
Changements réalisés et testés sur une copie locale du dépôt public `aymenessouyah/STiV2.0`.
**Aucun push GitHub ni déploiement en production n’a été effectué. Aucun jeton n’a été utilisé.**

Base de préparation : commit `19e8e55184dc7d4bde9461ce46b2be625d4a950e`.
Si le site a évolué depuis, préférez l’application du patch et une revue des différences au remplacement aveugle des fichiers.

## Fonctions ajoutées
- `livre-smart.html` : espace responsive « Scanner mon livre ».
- Caméra déclenchée seulement à la demande et arrêtée à la sortie / masquage / résultat.
- Import d’image : QR décodé localement, aucun téléversement. Taille maximale : 18 Mo.
- Recherche par page (1–74) ou par sujet (69 fiches).
- Catalogue complet relié aux cours et à leurs ancres.
- Téléchargement du PDF de 74 pages fourni avec ce lot.
- Entrées dans la navigation de l’accueil et accès au livre depuis sept pages de cours.
- jsQR 1.4.0 inclus localement avec sa licence ; repli pour les navigateurs sans BarcodeDetector.
- Mise à jour incrémentale du service worker et du manifeste hors ligne ; le PDF ne figure pas dans les téléchargements automatiques incrémentaux.
- Liste blanche : aucun QR étranger ne provoque de navigation.

## Ce qui n’a pas été modifié
Les comptes, rôles, abonnements, systèmes de protection, contrôles d’accès et bases de données.
Les textes pédagogiques existants ne sont pas réécrits dans cette mise à jour ; seuls des liens vers le livre sont ajoutés dans les pages de cours.
Le PDF mis à disposition est téléchargeable depuis la nouvelle page publique. Si vous souhaitez réserver aussi son téléchargement aux abonnés, un hébergement privé avec contrôle serveur est nécessaire : GitHub Pages ne sécurise pas un fichier statique public.

## Publication — méthode simple avec GitHub Desktop
1. Sauvegarder le dépôt ou créer une branche `smart-book-2026`.
2. Extraire le ZIP fourni dans un dossier temporaire.
3. Copier **le contenu de `fichiers-a-integrer/`** à la racine du dépôt local, en conservant les sous-dossiers. Ne pas remplacer le dépôt entier ; le ZIP est un lot différentiel.
4. Examiner les différences dans GitHub Desktop ; ne valider que les fichiers de ce lot.
5. Faire un commit « Ajouter Scanner mon livre STI » puis publier la branche.
6. Ouvrir une Pull Request vers la branche utilisée par GitHub Pages, vérifier puis fusionner.
7. Attendre le déploiement dans Actions / Pages selon la configuration existante.
8. Ouvrir `https://aymenessouyah.github.io/STiV2.0/livre-smart.html`.

**Le glisser-déposer du ZIP lui-même dans GitHub ne déploie pas son contenu.** Il faut extraire et intégrer les fichiers.

## Alternative Git avec patch
Dans une copie du dépôt, après sauvegarde et sur une branche dédiée :

```sh
git switch -c smart-book-2026
git apply --check /chemin/STI-Smart-Book.patch
git apply /chemin/STI-Smart-Book.patch
node --test tests/smart-book-static.test.mjs
git status --short
```

Si `git apply --check` échoue, ne pas forcer : le dépôt a probablement changé. Revoir les conflits avant de continuer.
Le patch inclut les ajouts binaires (PDF). Examiner le diff et choisir les fichiers avant de créer un commit, puis publier normalement avec votre propre session GitHub. Aucun secret n’est requis dans les fichiers livrés.

## Vérification après publication
- L’accueil propose « Scanner mon livre » dans les menus bureau et mobile.
- Page 18 → CSS3, ancre `point-5`.
- Page 66 → projet Gestion des élèves, ancre `s9` du cours PHP.
- Page 1 → accueil des cours ; page 74 → sources du manuel / accueil des cours.
- Tester la caméra sur un téléphone en HTTPS et donner l’autorisation.
- Tester une photo avec le QR contrasté de la fiche, puis une image sans QR.
- Vérifier le PDF et les accès PHP avec un compte autorisé.
- Actualiser le site si une ancienne version reste affichée ; la mise à jour du service worker conserve les caches existants.

## Limites explicites
- Ce système décode les QR : **pas de reconnaissance OCR automatique d’une page sans QR lisible**.
- Les QR du PDF pointent vers des sections, parfois partagées par plusieurs fiches. Dans ce cas, le scanner annonce une section commune ; le numéro de page reste précis.
- Le filigrane pâle n’est pas le code de scan garanti : utiliser le QR contrasté en bas de page.
- Caméra réelle : test sur téléphone à effectuer après publication. Le test du navigateur automatisé a seulement validé le repli quand aucune caméra n’est disponible.
- HEIC/HEIF : dépend du navigateur, JPG/PNG recommandé.
- Les ressources lourdes non mises en cache restent dépendantes d’Internet.
- Ne pas réutiliser le jeton partagé dans la conversation : le révoquer dans GitHub.

## Résultats des tests
- 7 tests statiques Smart Book : réussis.
- Vérification des 69 destinations et de leurs ancres dans la copie du dépôt : réussie.
- Recherche par page : les 74 numéros vérifiés dans Chromium.
- Recherche de sujet et résultat vide : vérifiés.
- Photos de trois pages (couverture, fiche HTML, projet PHP) : QR reconnus par le navigateur.
- QR `javascript:` et image blanche : rejetés, sans navigation.
- Caméra indisponible / refusée : message de repli vérifié.
- Affichage 390 px : débordement détecté puis corrigé ; contrôle final réussi.
- Console du scanner : aucune erreur relevée au contrôle final.
- Les anciennes suites v302/v303 donnent **16 succès et 4 échecs sur 20**, avec les mêmes quatre échecs sur le commit source non modifié. Ces échecs préexistants concernent des attentes anciennes sur HLS, les comptes labo, l’identifiant de mise à jour et les notifications ; ils ne sont pas corrigés dans ce lot.
