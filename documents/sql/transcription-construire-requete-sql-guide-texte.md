# Construire une requête SQL — scénario et transcription complète

> Nouvelle version fondée sur la page interactive mise à jour. Cette version utilise un **Guide‑Texte synchronisé** sous forme de bandeau pédagogique affiché dans l’image.

## Référence de production

- Source : `exercices/sql/CommentConstruireunerequêteSQL.html`
- Empreinte SHA‑256 de la source utilisée : `2121e073148bc86a360eddb8e94f64fe6c068dc8ee4c1f562e8e850fa18a75a3`
- Format visé : Full HD 1920 × 1080, narration française, chapitres cliquables, sous-titres externes et Guide‑Texte incrusté.
- Contenu nouveau intégré : 7 étapes interactives, contrôles automatiques, sous‑requêtes et auto‑jointures.

## Scénario général

La vidéo suit la logique de la page mise à jour : elle part de l’énoncé, distingue les cinq questions de compréhension des sept étapes de construction, montre les clauses SQL dans l’ordre, puis traite les deux cas particuliers. Chaque chapitre combine une zone de raisonnement, une zone SQL et un bandeau **GUIDE‑TEXTE** synchronisé avec la narration.

## Chapitre 01 — Introduction

**Objectif narratif**

Page mise à jour : 7 étapes + contrôles automatiques.

**Guide‑Texte synchronisé**

- Page mise à jour : 7 étapes + contrôles automatiques
- Nouveautés : sous-requête et auto-jointure
- Partir de l’énoncé — jamais du code au hasard
- Guide-Texte : l’idée essentielle reste visible
- Objectif : construire, contrôler, puis tester

**Transcription complète**

Bienvenue dans S T I version deux point zéro. Dans cette vidéo, on va détailler la démarche à faire pour créer une requête SQL. Nous nous appuyons sur la page comment créer une requête SQL SELECT. Cette page interactive mise à jour intègre maintenant sept étapes, les contrôles automatiques, les sous-requêtes et l’auto-jointure. Le principe reste simple : nous ne commençons pas par écrire du code au hasard. Nous partons de l’énoncé, nous repérons les mots importants, puis nous répondons à chaque question dans l’ordre. À l’écran, le Guide-Texte affiche en permanence l’idée essentielle de l’explication en cours. À la fin, vous saurez transformer un énoncé en clauses SELECT, FROM, WHERE, GROUP BY, HAVING et ORDER BY, puis vérifier la cohérence de la requête avant de la tester.

## Chapitre 02 — Les questions et les sept étapes

**Objectif narratif**

5 questions pour comprendre l’énoncé.

**Guide‑Texte synchronisé**

- 5 questions pour comprendre l’énoncé
- 7 étapes pour construire la requête
- Tables et jointures sont traitées séparément
- Calcul avant comparaison → sous-requête
- Même table deux fois → auto-jointure

**Transcription complète**

Avant toute saisie, découpons l’énoncé. Les cinq questions principales sont : que veut-on afficher ? Dans quelles tables se trouvent les informations ? Faut-il filtrer des lignes ? Faut-il calculer par groupe ? Et faut-il filtrer le résultat du calcul ? La page transforme ce raisonnement en sept étapes opérationnelles. Elle sépare le choix des tables de leur liaison, puis ajoute le tri final. Nous obtenons donc : afficher, choisir les tables, relier les tables, filtrer les lignes, calculer par groupe, filtrer les groupes, et trier. Deux tests complètent cette méthode. Si un calcul doit être effectué avant une comparaison, pensez à une sous-requête. Si la même table intervient deux fois, pensez à une auto-jointure avec deux alias différents.

## Chapitre 03 — Étape 1 — SELECT

**Objectif narratif**

« afficher », « lister », « combien » → SELECT.

**Guide‑Texte synchronisé**

- « afficher », « lister », « combien » → SELECT
- Calculs : COUNT · SUM · AVG · MIN · MAX
- AS donne un nom clair au résultat calculé
- Sans doublons → DISTINCT
- SELECT décrit uniquement le résultat attendu

**Transcription complète**

Étape un : que veut-on afficher ? Repérez les verbes afficher, donner, lister, quel est ou combien. Une colonne demandée va dans SELECT. Un calcul demandé utilise une fonction d’agrégation : COUNT pour compter, SUM pour additionner, AVG pour une moyenne, MIN pour le minimum et MAX pour le maximum. Donnez un alias clair au calcul, par exemple moyenne. Si l’énoncé demande une liste sans doublons, activez DISTINCT. Dans notre exemple, afficher le libellé de chaque classe et la moyenne des notes donne SELECT classe point libelle, virgule AVG de note point valeur, AS moyenne. À ce stade, nous avons défini le résultat attendu, pas encore les tables ni les conditions.

## Chapitre 04 — Étape 2 — FROM et tables

**Objectif narratif**

FROM contient toutes les tables utiles.

**Guide‑Texte synchronisé**

- FROM contient toutes les tables utiles
- Ajouter une table pont si la liaison l’exige
- classe → eleve → note
- Même table plusieurs fois → alias distincts
- Un alias identifie chaque exemplaire sans ambiguïté

**Transcription complète**

Étape deux : dans quelles tables se trouvent ces informations ? Les colonnes sélectionnées permettent à la page de cocher automatiquement leurs tables. Ajoutez aussi une table pont lorsqu’elle est nécessaire pour relier les autres. Dans notre base lycée, le libellé se trouve dans classe et la valeur dans note. Mais classe et note ne sont pas directement reliées : la table eleve sert de pont. FROM contient donc classe, eleve et note. Lorsque la même table doit intervenir plusieurs fois, la page permet d’ajouter une copie et impose des alias distincts, par exemple eleve e1 et eleve e2. Un alias n’est pas décoratif : il identifie précisément chaque exemplaire et évite les colonnes ambiguës.

## Chapitre 05 — Étape 3 — Relier les tables

**Objectif narratif**

Jointure : clé primaire = clé étrangère.

**Guide‑Texte synchronisé**

- Jointure : clé primaire = clé étrangère
- Les conditions de liaison sont écrites dans WHERE
- 3 tables en chaîne → 2 jointures
- Règle de contrôle : T tables → T − 1 liens
- Lien manquant → produit cartésien

**Transcription complète**

Étape trois : comment relier les tables ? Dans cette méthode, les jointures sont écrites dans WHERE sous la forme table un point colonne égale table deux point colonne. Chaque lien associe une clé primaire à la clé étrangère correspondante. Avec trois tables reliées en chaîne, il faut normalement deux conditions d’égalité : classe point id égale eleve point id classe, puis eleve point id égale note point id eleve. La page peut suggérer les jointures à partir du schéma, mais vous devez toujours les relire. Retenez le contrôle essentiel : avec T tables, il faut en général T moins un liens d’égalité. Une liaison manquante produit un produit cartésien, donc beaucoup trop de lignes et un résultat faux.

## Chapitre 06 — Étape 4 — WHERE et sous-requête

**Objectif narratif**

WHERE filtre les lignes avant le regroupement.

**Guide‑Texte synchronisé**

- WHERE filtre les lignes avant le regroupement
- Pas de fonction AVG ou COUNT directement dans WHERE
- Calcul nécessaire avant comparaison → sous-requête
- =, >, < attendent une seule valeur
- IN et NOT IN acceptent une liste

**Transcription complète**

Étape quatre : faut-il filtrer des lignes ? Les expressions dont, supérieur à, de la classe, en deux mille vingt-cinq ou commence par indiquent souvent un filtre WHERE. WHERE agit avant les regroupements, sur les lignes individuelles. N’écrivez donc jamais AVG, COUNT ou une autre fonction d’agrégation directement sur la colonne du WHERE. Si la valeur de comparaison doit d’abord être calculée, utilisez une sous-requête. Par exemple, pour trouver les élèves dont une note dépasse la moyenne générale, on écrit note point valeur supérieur à, entre parenthèses, SELECT AVG de note point valeur FROM note. Avec égal, supérieur ou inférieur, la sous-requête doit renvoyer une seule valeur. Avec IN ou NOT IN, elle peut renvoyer une liste.

## Chapitre 07 — Étapes 5 et 6 — GROUP BY et HAVING

**Objectif narratif**

« pour chaque », « par classe » → GROUP BY.

**Guide‑Texte synchronisé**

- « pour chaque », « par classe » → GROUP BY
- Colonne affichée sans calcul → présente dans GROUP BY
- Regrouper par l’identifiant évite les homonymes
- WHERE filtre avant le calcul
- HAVING filtre les groupes après le calcul

**Transcription complète**

Étape cinq : faut-il calculer par groupe ? Les expressions pour chaque, par classe ou selon indiquent GROUP BY lorsqu’un calcul est demandé. Toute colonne affichée sans fonction d’agrégation doit figurer dans le GROUP BY. Pour éviter de fusionner deux classes homonymes, regroupez d’abord par l’identifiant, et ajoutez le libellé si le moteur SQL l’exige. Étape six : faut-il filtrer le résultat du calcul ? Une phrase comme dont la moyenne dépasse douze devient HAVING AVG de note point valeur supérieur à douze. La différence est fondamentale : WHERE filtre les lignes avant le calcul, tandis que HAVING filtre les groupes après le calcul. HAVING peut aussi comparer son agrégat à une sous-requête, par exemple à une moyenne générale calculée séparément.

## Chapitre 08 — Étape 7 — ORDER BY et contrôles

**Objectif narratif**

ORDER BY organise le résultat final.

**Guide‑Texte synchronisé**

- ORDER BY organise le résultat final
- ASC : croissant · DESC : décroissant
- Trier sur l’alias du calcul est plus lisible
- Lire toutes les remarques automatiques
- Structure cohérente ≠ résultat déjà prouvé

**Transcription complète**

Étape sept : faut-il trier ? Les expressions trié par, classé, du plus petit au plus grand ou du plus grand au plus petit indiquent ORDER BY. ASC correspond à l’ordre croissant et DESC à l’ordre décroissant. Pour notre moyenne, ORDER BY moyenne DESC place la meilleure classe en premier. Avant de copier la requête, lisez les remarques automatiques. La page signale une jointure manquante, une condition incomplète, une colonne du SELECT absente du GROUP BY, un HAVING sans GROUP BY ou une sous-requête incohérente. Le message aucun problème détecté ne remplace pas le test sur la base : il confirme seulement que la structure paraît cohérente. Relisez toujours l’énoncé, puis exécutez la requête sur des données connues.

## Chapitre 09 — Cas particulier — Auto-jointure

**Objectif narratif**

Auto-jointure : une table joue deux rôles.

**Guide‑Texte synchronisé**

- Auto-jointure : une table joue deux rôles
- Créer deux exemplaires : eleve e1 et eleve e2
- Même classe : e1.id_classe = e2.id_classe
- Éviter la ligne elle-même : e1.id <> e2.id
- Éviter les paires inversées : e1.id < e2.id

**Transcription complète**

Voyons le deuxième cas particulier : l’auto-jointure. Elle est nécessaire lorsque la même table joue deux rôles dans la question, par exemple trouver deux élèves appartenant à la même classe. Ajoutez une copie de la table eleve, puis nommez les deux exemplaires e1 et e2. Dans FROM, écrivez eleve e1, eleve e2. Reliez leurs classes avec e1 point id classe égale e2 point id classe. Ajoutez aussi e1 point id différent de e2 point id pour ne pas associer un élève avec lui-même. Selon le résultat attendu, une condition comme e1 point id inférieur à e2 point id évite d’afficher deux fois la même paire dans l’ordre inverse. Le rôle des alias est ici indispensable : sans eux, SQL ne saurait pas quel exemplaire de la table vous désignez.

## Chapitre 10 — Assemblage complet et synthèse

**Objectif narratif**

SELECT → résultat demandé.

**Guide‑Texte synchronisé**

- SELECT → résultat demandé
- FROM + WHERE → tables et liaisons
- GROUP BY + HAVING → calculs par groupe
- ORDER BY → ordre final
- Comprendre → construire → contrôler → tester

**Transcription complète**

Assemblons maintenant la requête complète. Nous voulons, pour chaque classe, afficher son libellé et la moyenne des notes, seulement si cette moyenne dépasse douze, de la plus grande à la plus petite. SELECT contient classe point libelle et AVG de note point valeur AS moyenne. FROM contient classe, eleve et note. WHERE relie classe à eleve, puis eleve à note. GROUP BY utilise classe point id et classe point libelle. HAVING conserve les groupes dont AVG de note point valeur dépasse douze. ORDER BY moyenne DESC termine la requête. La méthode se résume ainsi : comprendre l’énoncé, construire chaque clause dans l’ordre logique, contrôler les jointures et les agrégats, puis tester. Si un calcul précède la comparaison, utilisez une sous-requête. Si une table joue deux rôles, utilisez une auto-jointure. Votre requête devient alors la traduction fidèle d’un raisonnement clair.

## Requêtes de référence montrées dans la vidéo

### Agrégation par classe

```sql
SELECT classe.libelle, AVG(note.valeur) AS moyenne
FROM classe, eleve, note
WHERE classe.id = eleve.id_classe
  AND eleve.id = note.id_eleve
GROUP BY classe.id, classe.libelle
HAVING AVG(note.valeur) > 12
ORDER BY moyenne DESC;
```

### Sous-requête : note supérieure à la moyenne générale

```sql
SELECT DISTINCT eleve.nom
FROM eleve, note
WHERE eleve.id = note.id_eleve
  AND note.valeur > (
    SELECT AVG(note.valeur)
    FROM note
  );
```

### Auto-jointure : deux élèves de la même classe

```sql
SELECT e1.nom, e2.nom
FROM eleve e1, eleve e2
WHERE e1.id_classe = e2.id_classe
  AND e1.id < e2.id;
```
