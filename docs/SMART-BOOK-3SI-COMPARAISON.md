# Smart Book — 3ème SI : bilan de comparaison

**Lycée Rafèha · Aymen Essouyah · STI V2.0 BY A'e**  
Édition préparée le 21 octobre 2026.

## Résultat

Le document source de 74 pages est réorganisé en **54 pages et 50 fiches** : couverture page 1, sommaire pages 2 à 4, fiches pages 5 à 54. C’est une adaptation pédagogique condensée, et non une reproduction page à page. Les annexes illustrées du document initial sont remplacées par des synthèses textuelles.

| Domaine | Comparaison et adaptation | Fiches |
|---|---|---:|
| HTML5 | Structure, texte, médias, tableaux, formulaires et validation ; une fiche explicite sur `map` et `area` complète le rapprochement avec le cours multimédia de la plateforme. | 9 |
| CSS3 | Sélecteurs, boîte, disposition et positionnement ; transitions et animations détaillées en plusieurs fiches. | 13 |
| JavaScript | Bases, fonctions, tableaux, chaînes, dates, DOM, événements et formulaires ; déclarations modernisées avec `let`. | 13 |
| Bases de données et SQL | Modèle relationnel, contraintes, types, création/modification/suppression de structures et de lignes, puis SELECT simple. Un jeu d’essai « école » accompagne les sélections. | 9 |
| Travaux pratiques | HTML/CSS, JavaScript et SQL sur une seule table. | 3 |
| Annexes | Synthèses et repères d’utilisation du manuel connecté. | 3 |

## Limite SQL validée

Conserver les notions relationnelles et `CREATE`, `ALTER`, `DROP`, `INSERT`, `UPDATE`, `DELETE`. Pour l’interrogation : une seule table, projection de colonnes, `DISTINCT`, `WHERE`, comparaisons, `AND`, `OR`, `NOT`, `IS NULL`, `BETWEEN`, `IN`, `LIKE` et `ORDER BY`.

Exclure les jointures, sous-requêtes, fonctions d’agrégation, `GROUP BY` et `HAVING`. Les exercices avancés des pages 63–64 et 68–70 du document source sont écartés ou remplacés. **Aucun chapitre PHP ni exercice PHP n’est inclus.** Une base peut comporter plusieurs tables liées par des clés étrangères : c’est l’interrogation SELECT qui demeure limitée à une seule table.

## Correspondance avec la plateforme

Chaque fiche possède un lien cliquable vers une section existante des cours et un QR qui indique le manuel et sa page. Les destinations distinctes sont consignées dans `verification_liens_3si.json`, joint au dossier de contrôle de la livraison.

La plateforme reste commune aux deux niveaux : certaines pages SQL contiennent aussi des notions avancées. Le manuel et le sélecteur rappellent la limite de 3ème SI ; cette mise à jour **ne masque pas** les paragraphes avancés des cours partagés et ne modifie pas les règles de connexion ou d’accès.

Les correspondances sont parfois thématiques, et non une copie exacte fiche pour fiche : notamment `map`/`area` vers la section multimédia et les exercices vers leur cours de référence. Les contenus du PDF restent utilisables indépendamment du site.

## Fonctionnement connecté

- Le scanner propose **3ème SI** et **4ème SI**.
- Les QR du nouveau livre encodent l’édition et la page ; le scanner change automatiquement de manuel.
- Les anciens QR directs du livre de 4ème SI restent reconnus.
- La saisie du numéro de page sert de solution de secours.
- Les photos sont décodées localement ; pas d’envoi de l’image à un serveur, ni de reconnaissance OCR du texte.
- Le nom exact de l’application est imprimé, mais pas son adresse. Les destinations restent naturellement inspectables dans les QR et les liens.
- Le filigrane pâle est décoratif : utiliser le QR contrasté en bas de page pour scanner.

## Vérifications réalisées

- PDF : 54 pages ; 50 QR de fiches décodés et comparés à leur destination attendue ; absence du nom de domaine imprimé.
- Extraits JavaScript contrôlés avec `node --check` ; filtrage des exemples SQL pour repérer les constructions exclues. Pas d’exécution sous MySQL.
- Navigateur Chromium local : recherche par page sur les 54 pages de 3ème SI et les 74 pages de 4ème SI, quatre imports d’images couvrant les deux éditions et la couverture, recherche de sujets et absence de résultats, rejet d’un QR étranger.
- Affichage mobile de 390 px sans débordement horizontal ; aucune erreur de console durant ce scénario.
- Six tests autonomes de structure, indices, syntaxe, empreintes et mise à jour hors ligne réussis.
- PDF de 4ème SI conservé à l’identique du commit source ; son empreinte dans le manifeste hors ligne a été remise en cohérence.

**Limites :** caméra physique d’un téléphone et parcours authentifié non testés ; le décodage sur photo ne garantit pas la lecture d’une impression dégradée. Les contrôles navigateur portent sur une prévisualisation locale, pas sur une publication de cette mise à jour.

## État de publication

Paquet préparé depuis le commit public `1c29d5240b8c829e55c7f6ffb1981035d2ddc35f`. **Aucun push ni déploiement n’a été effectué par l’assistant.** Les liens directs du PDF pointent sur les cours existants ; la reconnaissance de l’édition 3ème SI par les nouveaux QR nécessite de publier le scanner et son index mis à jour.
