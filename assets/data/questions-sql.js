/* assets/data/questions-sql.js — SQL Quest (140 défis)
   Questions extraites à l’identique de la page de référence.
   NE PAS MODIFIER : toute correction doit être faite dans la banque d’origine.
   Fichier de données pur, JavaScript natif, aucune ressource externe. */
(function () {
  'use strict';
  window.STI_QUIZ_SQL_QUESTIONS = [
    {
      "cat": "bdd",
      "diff": "Facile",
      "q": "Quel élément reçoit la requête SQL et pilote l'accès aux données ?",
      "code": "-- L'utilisateur envoie sa demande\nSELECT nom_Cli FROM Client WHERE ville = 'Tunis';",
      "answers": [
        "La base de données elle-même",
        "Le SGBD",
        "Le navigateur web",
        "Le tableur"
      ],
      "correct": 1,
      "explain": "Dans le schéma du cours, le SGBD est la « façade » de l'usine : l'utilisateur lui adresse la requête, et c'est lui qui pilote l'accès à la citerne (la base de données). Le SGBD est un logiciel comme MySQL ou PostgreSQL.",
      "hint": "Relis la notion : Dans le schéma du cours, le SGBD est la « façade » de l'usine : l'utilisateur lui adresse la requête, et c'est lui qui pilote l'accès à la citerne (la base de d",
      "id": 1
    },
    {
      "cat": "bdd",
      "diff": "Facile",
      "q": "À quoi sert le langage SQL ?",
      "code": "SELECT marque, modele FROM Vehicule;",
      "answers": [
        "À dessiner graphiquement les formulaires et les pages web d'une application",
        "À installer le SGBD sur un serveur",
        "À mettre en forme les pages web",
        "À communiquer avec une base de données relationnelle"
      ],
      "correct": 3,
      "explain": "Le SQL (Structured Query Language) est le langage standard qui permet de communiquer avec une base de données relationnelle : on écrit des requêtes que le SGBD comprend et exécute.",
      "hint": "Relis la notion : Le SQL (Structured Query Language) est le langage standard qui permet de communiquer avec une base de données relationnelle : on écrit des requêtes que le SGBD ",
      "id": 2
    },
    {
      "cat": "bdd",
      "diff": "Facile",
      "q": "Quel est l'intérêt d'une base de données gérée par un SGBD ?",
      "code": "-- Les données sont organisées en tables\nClient( NCIN_Cli, nom_Cli, ville )\nVehicule( immat_Vehicule, marque, modele )",
      "answers": [
        "Éviter les redondances et garantir la cohérence des données",
        "Remplacer complètement les programmes en JavaScript",
        "Compresser automatiquement toutes les tables sur le disque pour économiser la mémoire",
        "Empêcher l'utilisateur d'écrire des requêtes"
      ],
      "correct": 0,
      "explain": "Une base de données est un ensemble structuré et organisé de données stockées durablement, géré par un SGBD pour éviter les redondances et garantir la cohérence.",
      "hint": "Relis la notion : Une base de données est un ensemble structuré et organisé de données stockées durablement, géré par un SGBD pour éviter les redondances et garantir la cohérence",
      "id": 3
    },
    {
      "cat": "bdd",
      "diff": "Moyen",
      "q": "À quel sous-langage appartient la commande CREATE TABLE ?",
      "code": "CREATE TABLE Client (\n  NCIN_Cli VARCHAR(8) PRIMARY KEY,\n  nom_Cli VARCHAR(30) NOT NULL\n);",
      "answers": [
        "Au LMD (Langage de Manipulation des Données)",
        "Au langage de présentation des pages web",
        "Au LDD (Langage de Définition des Données)",
        "À aucun sous-langage du SQL"
      ],
      "correct": 2,
      "explain": "Le LDD définit et modifie la structure : CREATE, ALTER et DROP. Le LMD interroge et modifie le contenu.",
      "hint": "Relis la notion : Le LDD définit et modifie la structure : CREATE, ALTER et DROP.",
      "id": 4
    },
    {
      "cat": "bdd",
      "diff": "Moyen",
      "q": "À quel sous-langage appartiennent SELECT, INSERT, UPDATE et DELETE ?",
      "code": "-- Interroger et modifier le contenu\nSELECT * FROM Client;\nINSERT INTO Client VALUES ('12345678', 'Ali', 'Tunis');",
      "answers": [
        "Au langage de programmation JavaScript",
        "Au LCC (Langage de Création des Colonnes)",
        "Au LDD (Langage de Définition des Données)",
        "Au LMD (Langage de Manipulation des Données)"
      ],
      "correct": 3,
      "explain": "Les quatre commandes du contenu forment le LMD. On y place aussi les clauses et les fonctions utilisées dans les requêtes (WHERE, GROUP BY, COUNT…).",
      "hint": "Relis la notion : Les quatre commandes du contenu forment le LMD.",
      "id": 5
    },
    {
      "cat": "bdd",
      "diff": "Moyen",
      "q": "Quelle commande appartient au LDD ?",
      "code": "-- Une seule de ces commandes définit la structure\nALTER TABLE Client ADD COLUMN Tel_Cli VARCHAR(10);",
      "answers": [
        "UPDATE",
        "ALTER TABLE",
        "SELECT",
        "INSERT"
      ],
      "correct": 1,
      "explain": "ALTER TABLE modifie la structure d'une table : c'est une commande du LDD, au même titre que CREATE et DROP. SELECT, INSERT et UPDATE agissent sur les données (LMD).",
      "hint": "Relis la notion : ALTER TABLE modifie la structure d'une table : c'est une commande du LDD, au même titre que CREATE et DROP.",
      "id": 7
    },
    {
      "cat": "bdd",
      "diff": "Difficile",
      "q": "Que renvoie le SGBD après une requête SELECT ?",
      "code": "SELECT nom_Cli FROM Client WHERE ville = 'Tunis';",
      "answers": [
        "Un simple code numérique confirmant que la table a bien été verrouillée en lecture",
        "Le nombre total de clients de la base",
        "Le résultat de la recherche (les lignes demandées)",
        "Rien du tout : il faut réécrire la table"
      ],
      "correct": 2,
      "explain": "Pour une recherche (SELECT), le SGBD lit les données de la base et renvoie le résultat à l'utilisateur. Pour INSERT, UPDATE ou DELETE, il applique l'action dans la base.",
      "hint": "Relis la notion : Pour une recherche (SELECT), le SGBD lit les données de la base et renvoie le résultat à l'utilisateur.",
      "id": 8
    },
    {
      "cat": "ddl",
      "diff": "Facile",
      "q": "Quelle commande crée une nouvelle base de données ?",
      "code": "-- Créer une nouvelle base de données\n______ Gestion_Location;",
      "answers": [
        "CREATE DATABASE",
        "NEW DATABASE",
        "ALTER DATABASE",
        "CREATE TABLE"
      ],
      "correct": 0,
      "explain": "CREATE DATABASE prépare le grand espace de stockage, comme délimiter le terrain avant de construire. On crée ensuite les tables à l'intérieur avec CREATE TABLE.",
      "hint": "Relis la notion : CREATE DATABASE prépare le grand espace de stockage, comme délimiter le terrain avant de construire.",
      "id": 9
    },
    {
      "cat": "ddl",
      "diff": "Facile",
      "q": "À quoi sert la commande USE Gestion_Location; ?",
      "code": "-- Sélectionner et activer la base de données\nUSE Gestion_Location;",
      "answers": [
        "À afficher immédiatement le contenu détaillé de toutes les tables de Gestion_Location",
        "À sélectionner la base sur laquelle on va travailler",
        "À créer une copie de la base",
        "À supprimer la base si elle existe déjà"
      ],
      "correct": 1,
      "explain": "USE active la base de données : toutes les commandes suivantes s'appliqueront à elle. C'est l'étape qui suit CREATE DATABASE.",
      "hint": "Relis la notion : USE active la base de données : toutes les commandes suivantes s'appliqueront à elle.",
      "id": 10
    },
    {
      "cat": "ddl",
      "diff": "Moyen",
      "q": "Que fait DROP DATABASE Gestion_Location; ?",
      "code": "-- Supprimer une base de données entière du SGBD\nDROP DATABASE Gestion_Location;",
      "answers": [
        "Il vide toutes les lignes des tables tout en conservant intacte leur structure",
        "Il met la base en lecture seule",
        "Il renomme la base en Gestion_Location_old",
        "Il supprime définitivement la base et toutes ses tables"
      ],
      "correct": 3,
      "explain": "DROP DATABASE supprime toute la base du SGBD : c'est une démolition. Vérifiez avant de lancer la commande, car aucune confirmation n'est demandée.",
      "hint": "Relis la notion : DROP DATABASE supprime toute la base du SGBD : c'est une démolition.",
      "id": 11
    },
    {
      "cat": "ddl",
      "diff": "Moyen",
      "q": "Que fait DROP TABLE Client; ?",
      "code": "-- Supprimer définitivement une table et ses données\nDROP TABLE Client;",
      "answers": [
        "Il supprime la table et toutes ses données",
        "Il supprime seulement la clé primaire",
        "Il archive la table pour la restaurer plus tard",
        "Il supprime seulement les lignes, la table reste vide"
      ],
      "correct": 0,
      "explain": "DROP TABLE enlève le compartiment entier de la citerne : la structure et le contenu disparaissent. Pour ne vider que le contenu, on utilise DELETE FROM Client.",
      "hint": "Relis la notion : DROP TABLE enlève le compartiment entier de la citerne : la structure et le contenu disparaissent.",
      "id": 12
    },
    {
      "cat": "ddl",
      "diff": "Difficile",
      "q": "Quelle est la différence entre DROP TABLE et DELETE FROM ?",
      "code": "-- Deux commandes, deux effets différents\nDROP TABLE Client;\nDELETE FROM Client;",
      "answers": [
        "DROP agit sur les colonnes, DELETE sur les tables",
        "DROP vide uniquement les enregistrements, tandis que DELETE détruit toute la structure",
        "DROP supprime la structure et les données, DELETE ne supprime que des lignes",
        "Les deux commandes suppriment la table entière"
      ],
      "correct": 2,
      "explain": "DELETE FROM fait partie du LMD : après la commande, la table existe toujours (vide si aucune condition). DROP TABLE est une commande du LDD : la table n'existe plus du tout.",
      "hint": "Relis la notion : DELETE FROM fait partie du LMD : après la commande, la table existe toujours (vide si aucune condition).",
      "id": 13
    },
    {
      "cat": "ddl",
      "diff": "Moyen",
      "q": "Quel nom de champ respecte les normes du cours ?",
      "code": "-- Exemples de nommage donnés dans le cours :\n-- nom_Cli, date_acq",
      "answers": [
        "date d'acquisition",
        "date-acq",
        "Date!Acquisition",
        "date_acq"
      ],
      "correct": 3,
      "explain": "Les noms doivent être explicites, sans espaces ni accents, avec le trait de soulignement comme séparateur (nom_Cli, date_acq) et sans mots réservés du SQL.",
      "hint": "Relis la notion : Les noms doivent être explicites, sans espaces ni accents, avec le trait de soulignement comme séparateur (nom_Cli, date_acq) et sans mots réservés du SQL.",
      "id": 14
    },
    {
      "cat": "ddl",
      "diff": "Facile",
      "q": "Quel type pour un nombre entier comme une durée en jours ?",
      "code": "CREATE TABLE Location (\n  duree_loc ______ ,\n  ...\n);",
      "answers": [
        "VARCHAR(3)",
        "INT",
        "YEAR",
        "DECIMAL(8,3)"
      ],
      "correct": 1,
      "explain": "INT stocke des nombres entiers : duree_loc INT(3) accepte par exemple 5, 12 ou 45.",
      "hint": "Relis la notion : INT stocke des nombres entiers : duree_loc INT(3) accepte par exemple 5, 12 ou 45.",
      "id": 15
    },
    {
      "cat": "ddl",
      "diff": "Moyen",
      "q": "Que signifient les deux nombres de DECIMAL(8,3) ?",
      "code": "cout_loc DECIMAL(8,3)   -- accepte 150.750",
      "answers": [
        "Une valeur maximale de 8 et minimale de 3",
        "8 chiffres avant la virgule et 3 après",
        "8 chiffres au total, dont 3 après la virgule",
        "8 lignes maximum et 3 colonnes"
      ],
      "correct": 2,
      "explain": "Dans DECIMAL(p,s), p est le nombre total de chiffres et s le nombre de chiffres après la virgule : DECIMAL(8,3) accepte 150.750.",
      "hint": "Relis la notion : Dans DECIMAL(p,s), p est le nombre total de chiffres et s le nombre de chiffres après la virgule : DECIMAL(8,3) accepte 150.750.",
      "id": 16
    },
    {
      "cat": "ddl",
      "diff": "Moyen",
      "q": "Quel type choisir pour un coût précis comme 150.750 ?",
      "code": "CREATE TABLE Location (\n  cout_loc ______ ,\n  ...\n);",
      "answers": [
        "DECIMAL(8,3)",
        "INT(3)",
        "VARCHAR(8)",
        "CHAR(3)"
      ],
      "correct": 0,
      "explain": "INT ne garde que la partie entière : pour un montant précis il faut DECIMAL(p,s), qui conserve les chiffres après la virgule.",
      "hint": "Relis la notion : INT ne garde que la partie entière : pour un montant précis il faut DECIMAL(p,s), qui conserve les chiffres après la virgule.",
      "id": 17
    },
    {
      "cat": "ddl",
      "diff": "Difficile",
      "q": "Quelle est la différence entre VARCHAR(30) et CHAR(30) ?",
      "code": "nom_Cli VARCHAR(30)      -- 'Ali'\ncode_postal CHAR(5)      -- '1002 '",
      "answers": [
        "VARCHAR est réservé aux chaînes numériques, tandis que CHAR n'accepte que des lettres",
        "VARCHAR a une longueur variable, CHAR a une longueur fixe complétée par des espaces",
        "Les deux sont strictement identiques",
        "VARCHAR accepte 30 caractères, CHAR seulement 5"
      ],
      "correct": 1,
      "explain": "Avec VARCHAR(30), la valeur « Ali » ne prend que l'espace nécessaire. Avec CHAR(5), le code postal est toujours complété par des espaces pour atteindre 5 caractères.",
      "hint": "Relis la notion : Avec VARCHAR(30), la valeur « Ali » ne prend que l'espace nécessaire.",
      "id": 18
    },
    {
      "cat": "ddl",
      "diff": "Moyen",
      "q": "Pourquoi choisir VARCHAR(30) pour le nom d'un client ?",
      "code": ": 'Ali' occupe 3 octets seulement\nnom_Cli VARCHAR(30)",
      "answers": [
        "Parce qu'il convertit automatiquement en minuscules",
        "Parce qu'il interdit les majuscules",
        "Parce qu'il complète systématiquement les noms courts par des espaces jusqu'à 30 caractères",
        "Parce que l'espace pris s'adapte à la longueur réelle du texte"
      ],
      "correct": 3,
      "explain": "VARCHAR signifie « longueur variable » : le SGBD ne réserve que la place nécessaire. C'est le type adapté aux textes de taille imprévisible (noms, adresses).",
      "hint": "Relis la notion : VARCHAR signifie « longueur variable » : le SGBD ne réserve que la place nécessaire.",
      "id": 19
    },
    {
      "cat": "ddl",
      "diff": "Facile",
      "q": "Quel type pour un code postal de 5 caractères toujours de la même longueur ?",
      "code": "code_postal ______",
      "answers": [
        "CHAR(5)",
        "VARCHAR(5)",
        "INT(5)",
        "DECIMAL(5,0)"
      ],
      "correct": 0,
      "explain": "CHAR(n) est une chaîne de longueur fixe : le SGBD complète systématiquement avec des espaces. C'est le bon choix quand toutes les valeurs ont la même taille.",
      "hint": "Relis la notion : CHAR(n) est une chaîne de longueur fixe : le SGBD complète systématiquement avec des espaces.",
      "id": 20
    },
    {
      "cat": "ddl",
      "diff": "Facile",
      "q": "Quel type stocke une année sur 4 chiffres ?",
      "code": "annee_acq ______    -- 2024",
      "answers": [
        "TIMESTAMP",
        "DECIMAL(4,2)",
        "YEAR",
        "DATE"
      ],
      "correct": 2,
      "explain": "Le type YEAR stocke une année sur quatre chiffres, comme 2024. Il est plus précis que INT pour indiquer l'intention du champ.",
      "hint": "Relis la notion : Le type YEAR stocke une année sur quatre chiffres, comme 2024.",
      "id": 21
    },
    {
      "cat": "ddl",
      "diff": "Moyen",
      "q": "Quel type pour une date ET une heure avec valeur automatique ?",
      "code": "date_loc ______ DEFAULT CURRENT_TIMESTAMP",
      "answers": [
        "CHAR(19)",
        "DATE",
        "YEAR",
        "TIMESTAMP"
      ],
      "correct": 3,
      "explain": "Pour attribuer la date du jour et l'heure courante par défaut, il faut le type TIMESTAMP avec DEFAULT CURRENT_TIMESTAMP : cela ne fonctionne pas directement avec le type DATE.",
      "hint": "Relis la notion : Pour attribuer la date du jour et l'heure courante par défaut, il faut le type TIMESTAMP avec DEFAULT CURRENT_TIMESTAMP : cela ne fonctionne pas directement ave",
      "id": 22
    },
    {
      "cat": "ddl",
      "diff": "Difficile",
      "q": "Pourquoi DEFAULT CURRENT_TIMESTAMP ne convient-il pas avec le type DATE ?",
      "code": "-- À éviter avec le type DATE\n-- date_loc DATE DEFAULT CURRENT_TIMESTAMP",
      "answers": [
        "Parce que CURRENT_TIMESTAMP n'existe pas en SQL",
        "Parce que DATE ne stocke pas l'heure, il faut TIMESTAMP",
        "Parce que DEFAULT s'utilise seulement avec INT",
        "Parce qu'il faudrait écrire DEFAULT NOW_DATE"
      ],
      "correct": 1,
      "explain": "CURRENT_TIMESTAMP renvoie une date et une heure : la colonne doit donc être de type TIMESTAMP (ou DATETIME) pour les accueillir, pas DATE.",
      "hint": "Relis la notion : CURRENT_TIMESTAMP renvoie une date et une heure : la colonne doit donc être de type TIMESTAMP (ou DATETIME) pour les accueillir, pas DATE.",
      "id": 23
    },
    {
      "cat": "lien",
      "diff": "Facile",
      "q": "Quelle contrainte identifie chaque ligne de façon unique ?",
      "code": "CREATE TABLE Client (\n  NCIN_Cli VARCHAR(8) ______ ,\n  nom_Cli VARCHAR(30) NOT NULL\n);",
      "answers": [
        "DEFAULT",
        "FOREIGN KEY",
        "PRIMARY KEY",
        "NOT NULL"
      ],
      "correct": 2,
      "explain": "PRIMARY KEY désigne la clé primaire : chaque valeur est unique et non nulle, ce qui permet d'identifier une ligne sans ambiguïté.",
      "hint": "Relis la notion : PRIMARY KEY désigne la clé primaire : chaque valeur est unique et non nulle, ce qui permet d'identifier une ligne sans ambiguïté.",
      "id": 24
    },
    {
      "cat": "lien",
      "diff": "Facile",
      "q": "Que signifie la contrainte NOT NULL sur une colonne ?",
      "code": "nom_Cli VARCHAR(30) NOT NULL",
      "answers": [
        "La valeur est obligatoire pour chaque ligne",
        "La colonne référence automatiquement la clé primaire d'une autre table de la base",
        "La valeur doit être un nombre",
        "La valeur par défaut est vide"
      ],
      "correct": 0,
      "explain": "NOT NULL interdit les valeurs manquantes : le SGBD refuse toute insertion qui ne fournit pas cette colonne.",
      "hint": "Relis la notion : NOT NULL interdit les valeurs manquantes : le SGBD refuse toute insertion qui ne fournit pas cette colonne.",
      "id": 25
    },
    {
      "cat": "lien",
      "diff": "Moyen",
      "q": "Que se passe-t-il si la ville est omise à l'insertion ?",
      "code": "ville VARCHAR(20) DEFAULT 'Tunis'",
      "answers": [
        "Le SGBD refuse l'insertion",
        "La ville prend automatiquement la valeur 'Tunis'",
        "La ville prend la valeur NULL",
        "La colonne ville est supprimée de la table"
      ],
      "correct": 1,
      "explain": "DEFAULT définit une valeur proposée automatiquement quand aucune valeur n'est fournie. C'est indispensable pour les insertions partielles.",
      "hint": "Relis la notion : DEFAULT définit une valeur proposée automatiquement quand aucune valeur n'est fournie.",
      "id": 26
    },
    {
      "cat": "lien",
      "diff": "Moyen",
      "q": "Quelle clause relie une colonne à la clé primaire d'une autre table ?",
      "code": "FOREIGN KEY (NCIN_Cli)\nREFERENCES Client(NCIN_Cli)",
      "answers": [
        "DEFAULT",
        "ORDER BY",
        "PRIMARY KEY (...) REFERENCES TableParente",
        "FOREIGN KEY ... REFERENCES"
      ],
      "correct": 3,
      "explain": "Une clé étrangère (FOREIGN KEY) pointe vers la clé primaire d'une table parente grâce au mot REFERENCES : c'est ce lien qui garantit l'intégrité référentielle.",
      "hint": "Relis la notion : Une clé étrangère (FOREIGN KEY) pointe vers la clé primaire d'une table parente grâce au mot REFERENCES : c'est ce lien qui garantit l'intégrité référentielle.",
      "id": 27
    },
    {
      "cat": "lien",
      "diff": "Difficile",
      "q": "Que se passe-t-il avec ON DELETE CASCADE ?",
      "code": "CONSTRAINT fk_loc_vehicule\n  FOREIGN KEY (immat_Vehicule)\n  REFERENCES Vehicule(immat_Vehicule)\n  ON DELETE CASCADE",
      "answers": [
        "Le SGBD supprime automatiquement les lignes enfants associées",
        "Le SGBD met la clé étrangère à NULL",
        "Le SGBD bloque la suppression du véhicule",
        "Les locations deviennent orphelines sans être supprimées"
      ],
      "correct": 0,
      "explain": "Avec ON DELETE CASCADE, si la ligne parente (le véhicule) est effacée, le SGBD supprime aussi les lignes qui la référencent (les locations).",
      "hint": "Relis la notion : Avec ON DELETE CASCADE, si la ligne parente (le véhicule) est effacée, le SGBD supprime aussi les lignes qui la référencent (les locations).",
      "id": 28
    },
    {
      "cat": "lien",
      "diff": "Difficile",
      "q": "Que se passe-t-il avec ON DELETE RESTRICT ?",
      "code": "CONSTRAINT fk_loc_client\n  FOREIGN KEY (NCIN_Cli)\n  REFERENCES Client(NCIN_Cli)\n  ON DELETE RESTRICT",
      "answers": [
        "Le SGBD supprime automatiquement en cascade toutes les locations associées à ce client",
        "Le SGBD remplace la clé du client par NULL",
        "Le SGBD bloque la suppression du client tant qu'il a des locations",
        "Le SGBD supprime toute la base"
      ],
      "correct": 2,
      "explain": "Avec ON DELETE RESTRICT, la suppression de la ligne parente est strictement interdite tant qu'elle est référencée : il faut d'abord supprimer les locations concernées.",
      "hint": "Relis la notion : Avec ON DELETE RESTRICT, la suppression de la ligne parente est strictement interdite tant qu'elle est référencée : il faut d'abord supprimer les locations conc",
      "id": 29
    },
    {
      "cat": "lien",
      "diff": "Difficile",
      "q": "À quoi sert l'intégrité référentielle ?",
      "code": "-- Une location ne peut pas viser un client inconnu\nINSERT INTO Location VALUES (7, NOW(), '99999999', 'AB123CD');",
      "answers": [
        "À chiffrer les données de la base",
        "À renommer automatiquement les colonnes",
        "À trier automatiquement les clés primaires par ordre croissant lors de chaque insertion",
        "À empêcher qu'une ligne enfant référence une ligne parente inexistante"
      ],
      "correct": 3,
      "explain": "La clé étrangère oblige la valeur insérée à exister dans la table parente : l'insertion ci-dessus est refusée si le client '99999999' n'existe pas.",
      "hint": "Relis la notion : La clé étrangère oblige la valeur insérée à exister dans la table parente : l'insertion ci-dessus est refusée si le client '99999999' n'existe pas.",
      "id": 30
    },
    {
      "cat": "lien",
      "diff": "Moyen",
      "q": "À quoi sert CONSTRAINT fk_loc_client ?",
      "code": "CONSTRAINT fk_loc_client\n  FOREIGN KEY (NCIN_Cli) REFERENCES Client(NCIN_Cli)",
      "answers": [
        "À supprimer la contrainte précédente",
        "À donner un nom explicite à la contrainte",
        "À créer une nouvelle colonne",
        "À déclarer la clé primaire de la table"
      ],
      "correct": 1,
      "explain": "Nommer une contrainte permet de la reconnaître ensuite, par exemple pour la modifier ou la supprimer : ici le nom indique la liaison entre Location et Client.",
      "hint": "Relis la notion : Nommer une contrainte permet de la reconnaître ensuite, par exemple pour la modifier ou la supprimer : ici le nom indique la liaison entre Location et Client.",
      "id": 31
    },
    {
      "cat": "lien",
      "diff": "Difficile",
      "q": "Quelle instruction impose une année entre 2000 et 2022 ?",
      "code": "ALTER TABLE Vehicule\n  ______ CHECK (Annee_Acq BETWEEN 2000 AND 2022);",
      "answers": [
        "ADD COLUMN",
        "DROP COLUMN",
        "ADD CONSTRAINT",
        "SET DEFAULT"
      ],
      "correct": 2,
      "explain": "ADD CONSTRAINT ajoute une règle de validation à une table existante. Ici le SGBD refuse toute année en dehors de l'intervalle 2000-2022.",
      "hint": "Relis la notion : ADD CONSTRAINT ajoute une règle de validation à une table existante.",
      "id": 32
    },
    {
      "cat": "lien",
      "diff": "Moyen",
      "q": "Dans CREATE TABLE Client, quelle colonne est la clé primaire ?",
      "code": "CREATE TABLE Client (\n  NCIN_Cli VARCHAR(8) PRIMARY KEY,\n  nom_Cli VARCHAR(30) NOT NULL,\n  ville VARCHAR(20) DEFAULT 'Tunis'\n);",
      "answers": [
        "NCIN_Cli",
        "ville",
        "Les trois colonnes ensemble",
        "nom_Cli"
      ],
      "correct": 0,
      "explain": "Le mot PRIMARY KEY suit directement la colonne NCIN_Cli : c'est elle qui identifie chaque client de la table.",
      "hint": "Relis la notion : Le mot PRIMARY KEY suit directement la colonne NCIN_Cli : c'est elle qui identifie chaque client de la table.",
      "id": 33
    },
    {
      "cat": "ddl",
      "diff": "Facile",
      "q": "Quelle commande ajoute une colonne téléphone ?",
      "code": "ALTER TABLE Client ______ Tel_Cli VARCHAR(10);",
      "answers": [
        "CREATE COLUMN",
        "ADD COLUMN",
        "MODIFY COLUMN",
        "DROP COLUMN"
      ],
      "correct": 1,
      "explain": "ALTER TABLE ... ADD COLUMN ajoute une colonne à une table existante, sans toucher aux lignes déjà présentes.",
      "hint": "Relis la notion : ALTER TABLE ...",
      "id": 34
    },
    {
      "cat": "ddl",
      "diff": "Moyen",
      "q": "Quelle commande change le type d'une colonne existante ?",
      "code": "ALTER TABLE Client ______ Tel_Cli INT(8);",
      "answers": [
        "ADD COLUMN",
        "DROP COLUMN",
        "RENAME TO",
        "MODIFY COLUMN"
      ],
      "correct": 3,
      "explain": "MODIFY COLUMN remplace la définition d'une colonne (type, valeur par défaut…). Ici le téléphone passe de VARCHAR(10) à INT(8).",
      "hint": "Relis la notion : MODIFY COLUMN remplace la définition d'une colonne (type, valeur par défaut…).",
      "id": 35
    },
    {
      "cat": "ddl",
      "diff": "Moyen",
      "q": "Quelle commande supprime une colonne existante ?",
      "code": "ALTER TABLE Client ______ Adresse_Cli;",
      "answers": [
        "DROP COLUMN",
        "REMOVE COLUMN",
        "ADD COLUMN",
        "DELETE COLUMN"
      ],
      "correct": 0,
      "explain": "ALTER TABLE ... DROP COLUMN supprime la colonne et les données qu'elle contient : c'est une modification de structure, pas une suppression de lignes.",
      "hint": "Relis la notion : ALTER TABLE ...",
      "id": 36
    },
    {
      "cat": "ddl",
      "diff": "Moyen",
      "q": "Quelle commande renomme la table Vehicule en Voiture ?",
      "code": "-- Renommer une table\n______ Vehicule ______ Voiture;",
      "answers": [
        "ALTER COLUMN ... RENAME",
        "RENAME TABLE ... TO",
        "ALTER TABLE ... RENAME TO",
        "UPDATE TABLE ... SET"
      ],
      "correct": 2,
      "explain": "On écrit ALTER TABLE Vehicule RENAME TO Voiture; : la table garde ses données et ses contraintes, seul son nom change.",
      "hint": "Relis la notion : On écrit ALTER TABLE Vehicule RENAME TO Voiture; : la table garde ses données et ses contraintes, seul son nom change.",
      "id": 37
    },
    {
      "cat": "ddl",
      "diff": "Difficile",
      "q": "Que crée cette instruction ?",
      "code": "ALTER TABLE Location\n  ADD PRIMARY KEY (immat_Vehicule, NCIN_Cli, date_loc);",
      "answers": [
        "Trois clés primaires indépendantes appliquées séparément sur chacune des colonnes",
        "Trois nouvelles colonnes",
        "Une clé étrangère vers trois tables",
        "Une clé primaire composée des trois colonnes"
      ],
      "correct": 3,
      "explain": "Une clé primaire peut regrouper plusieurs colonnes : l'ensemble doit être unique. Ici, un même véhicule peut être loué plusieurs fois, mais jamais deux fois à la même date pour le même client.",
      "hint": "Relis la notion : Une clé primaire peut regrouper plusieurs colonnes : l'ensemble doit être unique.",
      "id": 38
    },
    {
      "cat": "ddl",
      "diff": "Moyen",
      "q": "Quelle commande retire la clé primaire de la table Location ?",
      "code": "ALTER TABLE Location ______ ;",
      "answers": [
        "REMOVE KEY",
        "DROP PRIMARY KEY",
        "DROP CONSTRAINT PRIMARY",
        "DELETE PRIMARY KEY"
      ],
      "correct": 1,
      "explain": "DROP PRIMARY KEY supprime la clé primaire existante. On peut ensuite en déclarer une autre avec ADD PRIMARY KEY, par exemple composée de plusieurs colonnes.",
      "hint": "Relis la notion : DROP PRIMARY KEY supprime la clé primaire existante.",
      "id": 39
    },
    {
      "cat": "ddl",
      "diff": "Difficile",
      "q": "À quoi servent DISABLE KEYS et ENABLE KEYS ?",
      "code": "-- Activer / désactiver des contraintes\nALTER TABLE Client DISABLE KEYS;\n-- ... opérations en masse ...\nALTER TABLE Client ENABLE KEYS;",
      "answers": [
        "À vider la table temporairement",
        "À supprimer puis recréer la table",
        "À désactiver puis réactiver les contraintes pendant une opération lourde",
        "À chiffrer puis déchiffrer les clés primaires de la table pour protéger les accès"
      ],
      "correct": 2,
      "explain": "On désactive temporairement les vérifications pour accélérer une série d'insertions ou de mises à jour, puis on les réactive pour retrouver la garantie d'intégrité.",
      "hint": "Relis la notion : On désactive temporairement les vérifications pour accélérer une série d'insertions ou de mises à jour, puis on les réactive pour retrouver la garantie d'intégr",
      "id": 40
    },
    {
      "cat": "ddl",
      "diff": "Difficile",
      "q": "À quoi sert ALTER TABLE ... ADD CONSTRAINT CHECK (...) ?",
      "code": "ALTER TABLE Vehicule\n  ADD CONSTRAINT CHECK (Annee_Acq BETWEEN 2000 AND 2022);",
      "answers": [
        "À ajouter une règle de validation à une table qui existe déjà",
        "À afficher les valeurs interdites",
        "À supprimer automatiquement toutes les lignes existantes qui ne respectent pas la condition",
        "À créer un index sur la colonne"
      ],
      "correct": 0,
      "explain": "Le CHECK ajouté a posteriori vérifie les insertions et modifications futures : le SGBD refuse désormais les années hors de l'intervalle.",
      "hint": "Relis la notion : Le CHECK ajouté a posteriori vérifie les insertions et modifications futures : le SGBD refuse désormais les années hors de l'intervalle.",
      "id": 41
    },
    {
      "cat": "write",
      "diff": "Facile",
      "q": "Quelle commande ajoute des lignes dans une table ?",
      "code": "______ Client (NCIN_Cli, nom_Cli, ville)\nVALUES ('12345678', 'Ali Ben Salah', 'Tunis');",
      "answers": [
        "PUT",
        "INSERT INTO",
        "UPDATE INTO",
        "ADD INTO"
      ],
      "correct": 1,
      "explain": "INSERT INTO suivi des colonnes puis du mot VALUES introduit une nouvelle ligne. C'est la commande d'insertion du LMD.",
      "hint": "Relis la notion : INSERT INTO suivi des colonnes puis du mot VALUES introduit une nouvelle ligne.",
      "id": 42
    },
    {
      "cat": "write",
      "diff": "Moyen",
      "q": "Que faut-il respecter dans cette insertion implicite ?",
      "code": "-- Cas 2 : insertion sans lister les colonnes\nINSERT INTO Client\nVALUES ('87654321', 'Mouna Riahi', 'Sfax');",
      "answers": [
        "Aucun ordre particulier : le SGBD associe chaque valeur selon son type de données",
        "L'ordre alphabétique des colonnes",
        "L'ordre des lignes déjà présentes dans la table",
        "L'ordre exact des colonnes tel qu'il a été défini à la création"
      ],
      "correct": 3,
      "explain": "Quand les colonnes ne sont pas listées, le SGBD applique l'ordre de création de la table. Une inversion place la ville dans la colonne du nom.",
      "hint": "Relis la notion : Quand les colonnes ne sont pas listées, le SGBD applique l'ordre de création de la table.",
      "id": 43
    },
    {
      "cat": "write",
      "diff": "Moyen",
      "q": "Que devient la ville dans cette insertion partielle ?",
      "code": "-- Cas 3 : insertion partielle\nINSERT INTO Client (NCIN_Cli, nom_Cli)\nVALUES ('11223344', 'Karim Trabelsi');",
      "answers": [
        "Elle prend la valeur par défaut 'Tunis'",
        "Elle vaut NULL",
        "L'insertion est refusée",
        "Elle prend la valeur du client précédent"
      ],
      "correct": 0,
      "explain": "La colonne ville n'est pas fournie : le SGBD applique donc la valeur DEFAULT 'Tunis' définie dans la structure de la table.",
      "hint": "Relis la notion : La colonne ville n'est pas fournie : le SGBD applique donc la valeur DEFAULT 'Tunis' définie dans la structure de la table.",
      "id": 44
    },
    {
      "cat": "write",
      "diff": "Moyen",
      "q": "Comment insérer deux clients en une seule requête ?",
      "code": "-- Cas 4 : insertion de lignes multiples\nINSERT INTO Client (NCIN_Cli, nom_Cli, ville) VALUES\n('55667788', 'Sami Mejri', 'Sousse'),\n('99887766', 'Leila Dridi', 'Bizerte');",
      "answers": [
        "En séparant les groupes par le mot AND",
        "C'est impossible : une requête = une ligne",
        "En séparant les groupes de valeurs par des virgules",
        "En répétant obligatoirement le mot-clé INSERT INTO devant chaque nouveau tuple ajouté"
      ],
      "correct": 2,
      "explain": "Après VALUES, chaque tuple entre parenthèses représente une ligne : il suffit de les séparer par des virgules. C'est plus rapide qu'une série d'INSERT séparés.",
      "hint": "Relis la notion : Après VALUES, chaque tuple entre parenthèses représente une ligne : il suffit de les séparer par des virgules.",
      "id": 45
    },
    {
      "cat": "write",
      "diff": "Difficile",
      "q": "Que fait cette insertion par sous-requête ?",
      "code": "-- Cas 5 : insertion par sous-requête\nINSERT INTO ClientArchive (NCIN_Cli, nom_Cli)\nSELECT NCIN_Cli, nom_Cli\nFROM Client\nWHERE ville = 'Bizerte';",
      "answers": [
        "Il fusionne physiquement Client et ClientArchive en une seule table permanente",
        "Il crée la table ClientArchive puis la vide",
        "Il affiche les clients de Bizerte sans rien insérer",
        "Il copie dans ClientArchive les lignes renvoyées par le SELECT"
      ],
      "correct": 3,
      "explain": "La sous-requête fournit les lignes à insérer : ici, seuls les clients de Bizerte sont archivés, avec les deux colonnes demandées.",
      "hint": "Relis la notion : La sous-requête fournit les lignes à insérer : ici, seuls les clients de Bizerte sont archivés, avec les deux colonnes demandées.",
      "id": 46
    },
    {
      "cat": "write",
      "diff": "Moyen",
      "q": "Que se passe-t-il si l'on insère une location pour un client inexistant ?",
      "code": "INSERT INTO Location (id_location, NCIN_Cli, immat_Vehicule)\nVALUES (7, '99999999', 'AB123CD');",
      "answers": [
        "La location est tout de même enregistrée en remplaçant automatiquement le client par NULL",
        "Le SGBD refuse l'insertion : la clé étrangère n'existe pas",
        "Le client est créé automatiquement",
        "La table Client est vidée"
      ],
      "correct": 1,
      "explain": "L'intégrité référentielle impose que la valeur de la clé étrangère existe dans la table parente : sans ce client, l'insertion est rejetée.",
      "hint": "Relis la notion : L'intégrité référentielle impose que la valeur de la clé étrangère existe dans la table parente : sans ce client, l'insertion est rejetée.",
      "id": 47
    },
    {
      "cat": "write",
      "diff": "Difficile",
      "q": "Combien de lignes contient la table après ces insertions ?",
      "code": "INSERT INTO Client (NCIN_Cli, nom_Cli, ville) VALUES\n('12345678', 'Ali Ben Salah', 'Tunis'),\n('87654321', 'Mouna Riahi', 'Sfax');\nINSERT INTO Client (NCIN_Cli, nom_Cli)\nVALUES ('11223344', 'Karim Trabelsi');",
      "answers": [
        "4 lignes",
        "1 ligne",
        "3 lignes",
        "2 lignes"
      ],
      "correct": 2,
      "explain": "La première requête ajoute deux lignes d'un coup, la seconde en ajoute une troisième : la table contient 3 clients au total.",
      "hint": "Relis la notion : La première requête ajoute deux lignes d'un coup, la seconde en ajoute une troisième : la table contient 3 clients au total.",
      "id": 48
    },
    {
      "cat": "write",
      "diff": "Moyen",
      "q": "Quelle requête insère correctement Ali Ben Salah à Tunis ?",
      "code": "-- La table : Client (NCIN_Cli, nom_Cli, ville)",
      "answers": [
        "INSERT INTO Client (NCIN_Cli, nom_Cli, ville) VALUES ('12345678', 'Ali Ben Salah', 'Tunis');",
        "INSERT INTO Client SET NCIN_Cli = '12345678';",
        "INSERT INTO Client (NCIN_Cli, nom_Cli, ville) VALUES (12345678, Ali Ben Salah, Tunis);",
        "INSERT Client VALUES '12345678', 'Ali Ben Salah', 'Tunis';"
      ],
      "correct": 0,
      "explain": "Les colonnes sont listées entre parenthèses, le mot VALUES introduit les données et chaque texte est placé entre apostrophes.",
      "hint": "Relis la notion : Les colonnes sont listées entre parenthèses, le mot VALUES introduit les données et chaque texte est placé entre apostrophes.",
      "id": 49
    },
    {
      "cat": "write",
      "diff": "Facile",
      "q": "Quelle commande modifie des valeurs déjà présentes ?",
      "code": "______ Employé\nSET Salaire = Salaire * 1.15\nWHERE anciennete > 10;",
      "answers": [
        "INSERT",
        "UPDATE",
        "ALTER",
        "SELECT"
      ],
      "correct": 1,
      "explain": "UPDATE modifie le contenu des lignes avec SET (nouvelles valeurs) et WHERE (lignes concernées). ALTER, lui, modifie la structure.",
      "hint": "Relis la notion : UPDATE modifie le contenu des lignes avec SET (nouvelles valeurs) et WHERE (lignes concernées).",
      "id": 50
    },
    {
      "cat": "write",
      "diff": "Moyen",
      "q": "Que fait cette mise à jour ?",
      "code": "-- Augmentation de salaires selon ancienneté\nUPDATE Employé\nSET Salaire = Salaire * 1.15\nWHERE anciennete > 10;",
      "answers": [
        "Elle remplace le salaire de tous les employés de l'entreprise par la valeur fixe 1,15",
        "Elle supprime les employés anciens",
        "Elle ajoute 10 à tous les salaires",
        "Elle augmente de 15 % le salaire des employés ayant plus de 10 ans d'ancienneté"
      ],
      "correct": 3,
      "explain": "SET Salaire = Salaire * 1.15 recalcule chaque salaire concerné : la clause WHERE limite l'opération aux employés dont l'ancienneté dépasse 10 ans.",
      "hint": "Relis la notion : SET Salaire = Salaire * 1.15 recalcule chaque salaire concerné : la clause WHERE limite l'opération aux employés dont l'ancienneté dépasse 10 ans.",
      "id": 51
    },
    {
      "cat": "write",
      "diff": "Difficile",
      "q": "Que se passe-t-il si l'on oublie la clause WHERE ?",
      "code": "-- Requête sans condition\nUPDATE Employé\nSET Salaire = Salaire * 1.15;",
      "answers": [
        "Toutes les lignes de la table sont modifiées",
        "Seule la première ligne est modifiée",
        "Aucune ligne n'est modifiée",
        "Le SGBD affiche une erreur de syntaxe"
      ],
      "correct": 0,
      "explain": "Sans WHERE, l'instruction s'applique à toute la table : tous les employés, et non seulement les plus anciens, reçoivent l'augmentation.",
      "hint": "Relis la notion : Sans WHERE, l'instruction s'applique à toute la table : tous les employés, et non seulement les plus anciens, reçoivent l'augmentation.",
      "id": 52
    },
    {
      "cat": "write",
      "diff": "Moyen",
      "q": "Quel est le rôle de SUBSTR dans cette mise à jour ?",
      "code": "-- Supprimer le premier caractère d'une colonne\nUPDATE table\nSET nom_colonne = SUBSTR(nom_colonne, 2)\nWHERE condition;",
      "answers": [
        "Il supprime la première ligne de la table",
        "Il concatène un caractère supplémentaire tout au début de chaque valeur de la colonne",
        "Il réécrit la colonne en laissant de côté le premier caractère",
        "Il supprime la colonne entière"
      ],
      "correct": 2,
      "explain": "SUBSTR(x, 2) extrait la chaîne à partir du 2e caractère : le premier est donc supprimé. La longueur de chaque valeur diminue de 1.",
      "hint": "Relis la notion : SUBSTR(x, 2) extrait la chaîne à partir du 2e caractère : le premier est donc supprimé.",
      "id": 53
    },
    {
      "cat": "write",
      "diff": "Difficile",
      "q": "Que fait cette expression dans un UPDATE ?",
      "code": "-- Supprimer le dernier caractère d'une colonne\nSET nom_colonne = SUBSTR(nom_colonne, 1, LENGTH(nom_colonne) - 1)",
      "answers": [
        "Elle double la longueur de la colonne",
        "Elle remplace chaque caractère par un espace",
        "Elle garde seulement le dernier caractère",
        "Elle garde tous les caractères sauf le dernier"
      ],
      "correct": 3,
      "explain": "LENGTH donne la longueur de la chaîne ; en retirant 1, SUBSTR extrait du début jusqu'à l'avant-dernier caractère. C'est le nettoyage inverse du cas précédent.",
      "hint": "Relis la notion : LENGTH donne la longueur de la chaîne ; en retirant 1, SUBSTR extrait du début jusqu'à l'avant-dernier caractère.",
      "id": 54
    },
    {
      "cat": "write",
      "diff": "Difficile",
      "q": "Quelle précaution prendre avant un UPDATE avec jointure (a.x = b.x) ?",
      "code": "-- Mise à jour croisée entre deux tables (forme a.x = b.x)\nUPDATE Client c, Location l\nSET c.ville = 'Tunis'\nWHERE c.NCIN_Cli = l.NCIN_Cli\n  AND l.id_location = 1;",
      "answers": [
        "Convertir préalablement les deux colonnes de jointure NCIN_Cli au format texte VARCHAR",
        "Vérifier que la jointure c.NCIN_Cli = l.NCIN_Cli ne duplique pas les lignes cibles",
        "Supprimer la clé étrangère de la table cible",
        "Désactiver la base de données"
      ],
      "correct": 1,
      "explain": "Dans un UPDATE avec jointure (écrit UPDATE Client c, Location l ... WHERE c.NCIN_Cli = l.NCIN_Cli), il faut toujours vérifier la condition d'égalité a.x = b.x pour ne cibler que les lignes voulues.",
      "hint": "Relis la notion : Dans un UPDATE avec jointure (WHERE a.x = b.x), on vérifie toujours que la condition cible exactement les bonnes lignes.",
      "id": 55
    },
    {
      "cat": "write",
      "diff": "Difficile",
      "q": "Quelle syntaxe met correctement à jour la ville d'un client via une jointure (forme a.x = b.x) ?",
      "code": "-- Mettre à jour la ville du client ayant effectué la location n° 1\n-- Tables : Client c (NCIN_Cli, nom_Cli, ville) et Location l (id_location, NCIN_Cli, date_loc)",
      "answers": [
        "UPDATE Client c JOIN Location l SET c.ville = 'Tunis' ON c.NCIN_Cli = l.NCIN_Cli WHERE id = 1;",
        "UPDATE Client SET ville = Location.ville;",
        "UPDATE Client c, Location l SET c.ville = 'Tunis' WHERE c.NCIN_Cli = l.NCIN_Cli AND l.id_location = 1;",
        "UPDATE Client c WHERE l.id_location = 1;"
      ],
      "correct": 2,
      "explain": "En SQL STI, la mise à jour croisée entre deux tables liste les deux tables après UPDATE (UPDATE Client c, Location l) et les relie dans le WHERE par la condition d'égalité sur l'attribut commun : WHERE c.NCIN_Cli = l.NCIN_Cli (forme a.x = b.x).",
      "hint": "Relis la notion : On liste les deux tables après UPDATE et on écrit la condition de jointure a.x = b.x dans le WHERE.",
      "id": 56
    },
    {
      "cat": "write",
      "diff": "Moyen",
      "q": "Que fait la condition c.NCIN_Cli = l.NCIN_Cli (forme a.x = b.x) dans cette requête ?",
      "code": "-- Mise à jour croisée entre Client c et Location l\nUPDATE Client c, Location l\nSET c.ville = 'Tunis'\nWHERE c.NCIN_Cli = l.NCIN_Cli\n  AND l.id_location = 1;",
      "answers": [
        "Elle relie chaque location au client possédant le même NCIN_Cli",
        "Elle supprime définitivement de la table Client tous les clients n'ayant aucune location",
        "Elle trie les clients par numéro de CIN",
        "Elle crée une nouvelle table Location"
      ],
      "correct": 0,
      "explain": "La condition WHERE c.NCIN_Cli = l.NCIN_Cli (de la forme a.x = b.x) établit la jointure entre les deux tables sur leur attribut commun NCIN_Cli (clé primaire dans Client, clé étrangère dans Location).",
      "hint": "Relis la notion : La condition WHERE c.NCIN_Cli = l.NCIN_Cli (a.x = b.x) établit la correspondance entre les deux tables.",
      "id": 57
    },
    {
      "cat": "write",
      "diff": "Facile",
      "q": "Quelle commande supprime des lignes dans une table ?",
      "code": "______ Location\nWHERE duree_loc = 0;",
      "answers": [
        "DELETE TABLE",
        "DELETE FROM",
        "DROP FROM",
        "REMOVE FROM"
      ],
      "correct": 1,
      "explain": "DELETE FROM s'utilise avec une clause WHERE pour cibler les lignes à supprimer. La structure de la table, elle, reste intacte.",
      "hint": "Relis la notion : DELETE FROM s'utilise avec une clause WHERE pour cibler les lignes à supprimer.",
      "id": 58
    },
    {
      "cat": "write",
      "diff": "Moyen",
      "q": "Que fait cette suppression ?",
      "code": "DELETE FROM Location\nWHERE duree_loc = 0;",
      "answers": [
        "Elle remplace par NULL la durée de toutes les locations enregistrées dans la table",
        "Elle supprime la colonne duree_loc",
        "Elle supprime toutes les locations",
        "Elle supprime les locations dont la durée vaut 0"
      ],
      "correct": 3,
      "explain": "La condition WHERE duree_loc = 0 limite la suppression aux lignes devenues inutiles : ce sont des enregistrements erronés ou annulés.",
      "hint": "Relis la notion : La condition WHERE duree_loc = 0 limite la suppression aux lignes devenues inutiles : ce sont des enregistrements erronés ou annulés.",
      "id": 59
    },
    {
      "cat": "write",
      "diff": "Difficile",
      "q": "Que se passe-t-il si l'on oublie la clause WHERE dans un DELETE ?",
      "code": "DELETE FROM Location;",
      "answers": [
        "Toutes les lignes de la table sont supprimées, la table reste vide",
        "Seule la première ligne est supprimée",
        "La structure complète de la table est définitivement supprimée de la base de données",
        "Le SGBD refuse la commande"
      ],
      "correct": 0,
      "explain": "Sans condition, DELETE vide la table entière : la structure subsiste, mais plus aucune ligne ne reste.",
      "hint": "Relis la notion : Sans condition, DELETE vide la table entière : la structure subsiste, mais plus aucune ligne ne reste.",
      "id": 60
    },
    {
      "cat": "write",
      "diff": "Moyen",
      "q": "Après cette commande, la table Location existe-t-elle encore ?",
      "code": "DELETE FROM Location\nWHERE duree_loc = 0;",
      "answers": [
        "Non : il faut la recréer avec CREATE TABLE",
        "Non : elle est supprimée du SGBD",
        "Oui : seules les lignes concernées ont disparu",
        "Oui, mais toutes ses colonnes sont vides"
      ],
      "correct": 2,
      "explain": "DELETE FROM agit sur le contenu (LMD) : la table et ses colonnes restent en place. Pour supprimer la table elle-même, il faudrait DROP TABLE.",
      "hint": "Relis la notion : DELETE FROM agit sur le contenu (LMD) : la table et ses colonnes restent en place.",
      "id": 61
    },
    {
      "cat": "write",
      "diff": "Difficile",
      "q": "Peut-on annuler un DROP TABLE par erreur ?",
      "code": "-- Supprimer définitivement une table\nDROP TABLE Client;",
      "answers": [
        "Oui, avec la commande UNDO DROP",
        "Oui, en relançant la même commande",
        "Oui, car le SGBD conserve automatiquement la table supprimée dans un journal d'annulation",
        "Non : la suppression est définitive, d'où l'importance de vérifier avant"
      ],
      "correct": 3,
      "explain": "Le cours insiste sur ce point : DROP TABLE (et DROP DATABASE) détruisent l'objet et son contenu. Il faut donc vérifier avant de lancer la commande.",
      "hint": "Relis la notion : Le cours insiste sur ce point : DROP TABLE (et DROP DATABASE) détruisent l'objet et son contenu.",
      "id": 62
    },
    {
      "cat": "select",
      "diff": "Facile",
      "q": "Quelle clause indique la table à interroger ?",
      "code": "SELECT nom_Cli\n______ Client\nWHERE ville = 'Tunis';",
      "answers": [
        "SET",
        "FROM",
        "INTO",
        "WHERE"
      ],
      "correct": 1,
      "explain": "On lit la requête en trois temps : SELECT (quoi afficher), FROM (où chercher), WHERE (quelle condition). FROM indique la table source.",
      "hint": "Relis la notion : On lit la requête en trois temps : SELECT (quoi afficher), FROM (où chercher), WHERE (quelle condition).",
      "id": 63
    },
    {
      "cat": "where",
      "diff": "Facile",
      "q": "Quelle clause filtre les lignes selon une condition ?",
      "code": "SELECT nom_Cli\nFROM Client\n______ ville = 'Tunis';",
      "answers": [
        "GROUP BY",
        "FROM",
        "WHERE",
        "ORDER BY"
      ],
      "correct": 2,
      "explain": "WHERE ne garde que les lignes qui respectent la condition. Sans WHERE, toutes les lignes de la table sont renvoyées.",
      "hint": "Relis la notion : WHERE ne garde que les lignes qui respectent la condition.",
      "id": 64
    },
    {
      "cat": "select",
      "diff": "Difficile",
      "q": "Comment lire cette requête en langage courant ?",
      "code": "SELECT nom_Cli\nFROM Client\nWHERE ville = 'Tunis';",
      "answers": [
        "« Quels sont les noms des clients qui habitent à Tunis ? »",
        "« Quel est le nombre exact de clients enregistrés qui habitent dans la ville de Tunis ? »",
        "« Quelles villes habitent les clients ? »",
        "« Ajoute un client de Tunis »"
      ],
      "correct": 0,
      "explain": "C'est exactement l'exemple du cours : SELECT nom_Cli (quoi demander), FROM Client (où chercher), WHERE ville = 'Tunis' (quelle condition).",
      "hint": "Relis la notion : C'est exactement l'exemple du cours : SELECT nom_Cli (quoi demander), FROM Client (où chercher), WHERE ville = 'Tunis' (quelle condition).",
      "id": 65
    },
    {
      "cat": "select",
      "diff": "Moyen",
      "q": "Que fait DISTINCT dans cette requête ?",
      "code": "SELECT DISTINCT ville FROM Client;",
      "answers": [
        "Il compte les clients de chaque ville",
        "Il supprime les doublons dans les résultats",
        "Il crée une colonne ville unique",
        "Il trie les villes par ordre alphabétique"
      ],
      "correct": 1,
      "explain": "DISTINCT renvoie chaque valeur différente une seule fois : la liste des villes apparaît sans répétition, même si plusieurs clients habitent la même ville.",
      "hint": "Relis la notion : DISTINCT renvoie chaque valeur différente une seule fois : la liste des villes apparaît sans répétition, même si plusieurs clients habitent la même ville.",
      "id": 66
    },
    {
      "cat": "where",
      "diff": "Moyen",
      "q": "Que teste l'opérateur BETWEEN 2000 AND 2022 ?",
      "code": "SELECT marque FROM Vehicule\nWHERE Annee_Acq BETWEEN 2000 AND 2022;",
      "answers": [
        "Une liste de valeurs autorisées",
        "Une égalité stricte avec deux valeurs",
        "Une différence entre deux colonnes",
        "Un intervalle, bornes comprises"
      ],
      "correct": 3,
      "explain": "BETWEEN a AND b équivaut à « au moins a et au plus b » : les véhicules de 2000 et de 2022 sont inclus dans le résultat.",
      "hint": "Relis la notion : BETWEEN a AND b équivaut à « au moins a et au plus b » : les véhicules de 2000 et de 2022 sont inclus dans le résultat.",
      "id": 67
    },
    {
      "cat": "where",
      "diff": "Moyen",
      "q": "À quoi sert l'opérateur LIKE ?",
      "code": "SELECT nom_Cli FROM Client\nWHERE nom_Cli LIKE 'A%';",
      "answers": [
        "À comparer une chaîne selon un modèle (recherche partielle)",
        "À vérifier l'égalité stricte entre deux valeurs numériques décimales dans une condition",
        "À trier les chaînes par longueur",
        "À convertir une chaîne en majuscules"
      ],
      "correct": 0,
      "explain": "LIKE compare un texte à un modèle : le symbole % remplace une suite de caractères, _ un seul caractère. Ici la requête cherche les noms commençant par A.",
      "hint": "Relis la notion : LIKE compare un texte à un modèle : le symbole % remplace une suite de caractères, _ un seul caractère.",
      "id": 68
    },
    {
      "cat": "where",
      "diff": "Moyen",
      "q": "Que fait l'opérateur IN ('Tunis', 'Sfax') ?",
      "code": "SELECT nom_Cli FROM Client\nWHERE ville IN ('Tunis', 'Sfax');",
      "answers": [
        "Il insère deux nouvelles villes",
        "Il compare les deux villes entre elles",
        "Il vérifie que la valeur appartient à la liste donnée",
        "Il vérifie que la ville contient le mot Tunis"
      ],
      "correct": 2,
      "explain": "IN teste l'appartenance à une liste : la requête renvoie les clients de Tunis ou de Sfax, ce qui évite d'écrire plusieurs OR.",
      "hint": "Relis la notion : IN teste l'appartenance à une liste : la requête renvoie les clients de Tunis ou de Sfax, ce qui évite d'écrire plusieurs OR.",
      "id": 69
    },
    {
      "cat": "agg",
      "diff": "Moyen",
      "q": "À quoi sert GROUP BY Cod_cli ?",
      "code": "SELECT Cod_cli, count(*) AS \"Nombre d'achat\"\nFROM ventes\nGROUP BY Cod_cli;",
      "answers": [
        "À créer une colonne Cod_cli",
        "À trier l'affichage final des factures par ordre croissant du code client Cod_cli",
        "À supprimer les clients sans achat",
        "À regrouper les lignes par client pour calculer une statistique"
      ],
      "correct": 3,
      "explain": "GROUP BY rassemble les lignes qui ont la même valeur : les fonctions d'agrégation comme count(*) s'appliquent alors à chaque groupe séparément.",
      "hint": "Relis la notion : GROUP BY rassemble les lignes qui ont la même valeur : les fonctions d'agrégation comme count(*) s'appliquent alors à chaque groupe séparément.",
      "id": 70
    },
    {
      "cat": "agg",
      "diff": "Difficile",
      "q": "Que renvoie ce regroupement par code client ?",
      "code": "SELECT Cod_cli, count(*) AS \"Nombre d'achat\"\nFROM ventes\nGROUP BY Cod_cli\nHAVING count(*) >= 2;",
      "answers": [
        "La liste détaillée de toutes les ventes triées par client dès le premier achat enregistré",
        "Une ligne par client avec son nombre d'achats, seulement si ce nombre atteint 2",
        "Le nombre total de ventes de la table",
        "Une erreur : HAVING s'utilise sans GROUP BY"
      ],
      "correct": 1,
      "explain": "HAVING filtre les groupes après le regroupement : seuls les clients ayant au moins 2 achats apparaissent, avec leur compteur en alias « Nombre d'achat ».",
      "hint": "Relis la notion : HAVING filtre les groupes après le regroupement : seuls les clients ayant au moins 2 achats apparaissent, avec leur compteur en alias « Nombre d'achat ».",
      "id": 71
    },
    {
      "cat": "agg",
      "diff": "Difficile",
      "q": "Quelle est la différence entre WHERE et HAVING ?",
      "code": "SELECT Cod_cli, count(*)\nFROM ventes\nWHERE montant > 0\nGROUP BY Cod_cli\nHAVING count(*) >= 2;",
      "answers": [
        "Les deux sont interchangeables",
        "HAVING s'utilise uniquement avec ORDER BY",
        "WHERE filtre les lignes avant le regroupement, HAVING filtre les groupes après",
        "WHERE filtre les groupes après calcul des agrégats, tandis que HAVING filtre chaque ligne"
      ],
      "correct": 2,
      "explain": "WHERE s'applique aux lignes individuelles, avant que GROUP BY ne les rassemble ; HAVING s'applique aux groupes obtenus, avec leurs résultats d'agrégation.",
      "hint": "Relis la notion : WHERE s'applique aux lignes individuelles, avant que GROUP BY ne les rassemble.",
      "id": 72
    },
    {
      "cat": "select",
      "diff": "Moyen",
      "q": "Que fait ORDER BY nom_Cli ?",
      "code": "SELECT nom_Cli FROM Client\nORDER BY nom_Cli;",
      "answers": [
        "Il trie le résultat par nom, du plus petit au plus grand",
        "Il renomme la colonne nom_Cli",
        "Il ne garde qu'un seul nom",
        "Il regroupe toutes les lignes portant le même nom_Cli en une seule ligne résumée"
      ],
      "correct": 0,
      "explain": "ORDER BY place les lignes dans l'ordre croissant de la colonne citée (c'est le sens par défaut, équivalent à ASC).",
      "hint": "Relis la notion : ORDER BY place les lignes dans l'ordre croissant de la colonne citée (c'est le sens par défaut, équivalent à ASC).",
      "id": 73
    },
    {
      "cat": "select",
      "diff": "Difficile",
      "q": "Que renvoie ce tri décroissant ?",
      "code": "SELECT des_art, pv_art FROM articles\nORDER BY pv_art DESC;",
      "answers": [
        "Les articles du moins cher au plus cher",
        "Les articles du plus cher au moins cher",
        "Un seul article, le plus cher",
        "Les articles dans l'ordre d'insertion"
      ],
      "correct": 1,
      "explain": "DESC inverse le tri : la valeur la plus grande (le prix de vente le plus élevé) arrive en première ligne.",
      "hint": "Relis la notion : DESC inverse le tri : la valeur la plus grande (le prix de vente le plus élevé) arrive en première ligne.",
      "id": 74
    },
    {
      "cat": "select",
      "diff": "Moyen",
      "q": "À quoi sert AS \"Nombre d'achat\" dans cette requête ?",
      "code": "SELECT Cod_cli, count(*) AS \"Nombre d'achat\"\nFROM ventes\nGROUP BY Cod_cli;",
      "answers": [
        "À trier le résultat par ce compteur",
        "À masquer la colonne Cod_cli",
        "À renommer définitivement la colonne de la table",
        "À donner un nom lisible à la colonne calculée du résultat"
      ],
      "correct": 3,
      "explain": "L'alias AS n'existe que dans le résultat affiché : la structure de la table n'est pas modifiée. Les guillemets permettent d'utiliser des espaces dans le nom.",
      "hint": "Relis la notion : L'alias AS n'existe que dans le résultat affiché : la structure de la table n'est pas modifiée.",
      "id": 75
    },
    {
      "cat": "agg",
      "diff": "Facile",
      "q": "Quelle fonction compte le nombre de lignes ?",
      "code": "SELECT ______ FROM Articles WHERE num_frs = 777;",
      "answers": [
        "count(*)",
        "max(*)",
        "sum(*)",
        "length(*)"
      ],
      "correct": 0,
      "explain": "count(*) compte les lignes concernées par la requête. C'est la fonction d'agrégation de base des statistiques.",
      "hint": "Relis la notion : count(*) compte les lignes concernées par la requête.",
      "id": 76
    },
    {
      "cat": "agg",
      "diff": "Moyen",
      "q": "Que renvoie ce comptage ?",
      "code": "SELECT count(*) FROM Articles WHERE num_frs = 777;",
      "answers": [
        "Le numéro du fournisseur 777",
        "La somme des prix des articles 777",
        "Le nombre d'articles du fournisseur 777",
        "La liste des articles 777"
      ],
      "correct": 2,
      "explain": "count(*) renvoie un seul nombre : celui des lignes qui satisfont la condition num_frs = 777.",
      "hint": "Relis la notion : count(*) renvoie un seul nombre : celui des lignes qui satisfont la condition num_frs = 777.",
      "id": 77
    },
    {
      "cat": "agg",
      "diff": "Facile",
      "q": "Quelle fonction calcule une moyenne ?",
      "code": "SELECT ______ FROM articles;",
      "answers": [
        "count(pa_art)",
        "min(pa_art)",
        "sum(pa_art)",
        "avg(pa_art)"
      ],
      "correct": 3,
      "explain": "avg() renvoie la moyenne des valeurs de la colonne indiquée. sum() additionne, count() compte, min() et max() cherchent les extrêmes.",
      "hint": "Relis la notion : avg() renvoie la moyenne des valeurs de la colonne indiquée.",
      "id": 78
    },
    {
      "cat": "agg",
      "diff": "Moyen",
      "q": "Que renvoie cette somme ?",
      "code": "SELECT sum(pa_art) FROM articles;",
      "answers": [
        "Le prix d'achat unitaire le plus élevé parmi l'ensemble des articles de la table",
        "La somme des prix d'achat de tous les articles",
        "Le prix d'achat moyen",
        "Le nombre d'articles"
      ],
      "correct": 1,
      "explain": "sum(pa_art) additionne la colonne des prix d'achat sur toute la table : le résultat est un seul nombre.",
      "hint": "Relis la notion : sum(pa_art) additionne la colonne des prix d'achat sur toute la table : le résultat est un seul nombre.",
      "id": 79
    },
    {
      "cat": "agg",
      "diff": "Difficile",
      "q": "Que renvoie cette sous-requête ?",
      "code": "-- Désignation de l'article le plus cher\nSELECT des_art AS \"Article plus cher\"\nFROM articles\nWHERE pv_art = (SELECT max(pv_art) FROM articles);",
      "answers": [
        "Le prix maximal de la table",
        "Tous les articles triés par prix",
        "La désignation de l'article au prix de vente maximal",
        "Une erreur : max() ne s'utilise pas dans une sous-requête"
      ],
      "correct": 2,
      "explain": "La sous-requête (SELECT max(pv_art) ...) calcule le prix maximal ; la requête principale ne garde que l'article dont le prix est égal à ce maximum.",
      "hint": "Relis la notion : La sous-requête (SELECT max(pv_art) ...) calcule le prix maximal.",
      "id": 80
    },
    {
      "cat": "agg",
      "diff": "Moyen",
      "q": "Quelle fonction renvoie la plus petite valeur d'une colonne ?",
      "code": "SELECT ______ FROM articles;",
      "answers": [
        "min(pa_art)",
        "count(pa_art)",
        "avg(pa_art)",
        "max(pa_art)"
      ],
      "correct": 0,
      "explain": "min() renvoie la valeur minimale de la colonne, max() la valeur maximale. Les deux sont souvent utilisées dans des sous-requêtes.",
      "hint": "Relis la notion : min() renvoie la valeur minimale de la colonne, max() la valeur maximale.",
      "id": 81
    },
    {
      "cat": "agg",
      "diff": "Difficile",
      "q": "Peut-on utiliser count(*) sans GROUP BY ?",
      "code": "SELECT count(*) FROM Articles WHERE num_frs = 777;",
      "answers": [
        "Non : count(*) exige un alias AS",
        "Oui : la fonction s'applique alors à toute la table (ou aux lignes filtrées)",
        "Non : toute fonction d'agrégation comme count(*) exige obligatoirement une clause GROUP BY",
        "Oui, mais le résultat est toujours 1"
      ],
      "correct": 1,
      "explain": "Sans GROUP BY, l'agrégation porte sur l'ensemble des lignes retenues par WHERE : la requête renvoie un seul nombre.",
      "hint": "Relis la notion : Sans GROUP BY, l'agrégation porte sur l'ensemble des lignes retenues par WHERE : la requête renvoie un seul nombre.",
      "id": 82
    },
    {
      "cat": "agg",
      "diff": "Difficile",
      "q": "Avec quoi MAX et MIN sont-elles souvent combinées ?",
      "code": "-- Article le plus cher\nSELECT des_art FROM articles\nWHERE pv_art = (SELECT max(pv_art) FROM articles);",
      "answers": [
        "Avec la commande ALTER TABLE, pour fixer la borne maximale autorisée sur une colonne",
        "Avec la commande DROP TABLE",
        "Avec la clause USE",
        "Avec des sous-requêtes, pour comparer une valeur au maximum"
      ],
      "correct": 3,
      "explain": "Une fonction d'agrégation ne peut pas apparaître seule dans un WHERE : on l'isole dans une sous-requête, puis on compare la colonne à ce résultat.",
      "hint": "Relis la notion : Une fonction d'agrégation ne peut pas apparaître seule dans un WHERE : on l'isole dans une sous-requête, puis on compare la colonne à ce résultat.",
      "id": 83
    },
    {
      "cat": "adv",
      "diff": "Moyen",
      "q": "Que fait CONCAT(prenom, ' ', nom) ?",
      "code": "SELECT id, CONCAT(prenom, ' ', nom) AS affichage_nom\nFROM utilisateur;",
      "answers": [
        "Il assemble le prénom et le nom en une seule chaîne, séparés par un espace",
        "Il compare alphabétiquement le prénom et le nom puis renvoie la chaîne la plus longue",
        "Il supprime les espaces du nom",
        "Il additionne deux nombres"
      ],
      "correct": 0,
      "explain": "CONCAT réunit plusieurs textes bout à bout. Le second argument ' ' ajoute l'espace entre le prénom et le nom, et l'alias affichage_nom nomme le résultat.",
      "hint": "Relis la notion : CONCAT réunit plusieurs textes bout à bout.",
      "id": 84
    },
    {
      "cat": "adv",
      "diff": "Moyen",
      "q": "Que fait LENGTH dans cette requête ?",
      "code": "SELECT id, login FROM utilisateur\nWHERE LENGTH(telephone) < 10;",
      "answers": [
        "Il vérifie que le téléphone est vide",
        "Il convertit le téléphone en nombre",
        "Il ne garde que les téléphones de moins de 10 caractères",
        "Il tronque automatiquement chaque numéro de téléphone pour n'en garder que 10 chiffres"
      ],
      "correct": 2,
      "explain": "LENGTH renvoie la longueur de la chaîne (en octets) : le WHERE conserve donc les numéros trop courts, sans doute incomplets.",
      "hint": "Relis la notion : LENGTH renvoie la longueur de la chaîne (en octets) : le WHERE conserve donc les numéros trop courts, sans doute incomplets.",
      "id": 85
    },
    {
      "cat": "adv",
      "diff": "Moyen",
      "q": "Que fait SUBSTR(nom_colonne, 2) ?",
      "code": "-- Exclure le premier caractère\nSELECT SUBSTR(nom_colonne, 2) FROM table WHERE condition;",
      "answers": [
        "Il renvoie les deux premiers caractères",
        "Il double la chaîne",
        "Il renvoie le 2e caractère seulement",
        "Il renvoie la chaîne à partir du 2e caractère"
      ],
      "correct": 3,
      "explain": "Le premier argument est la chaîne et le second le point de départ : à partir de 2, le premier caractère est laissé de côté.",
      "hint": "Relis la notion : Le premier argument est la chaîne et le second le point de départ : à partir de 2, le premier caractère est laissé de côté.",
      "id": 86
    },
    {
      "cat": "adv",
      "diff": "Difficile",
      "q": "Que renvoie SUBSTR('Bizerte', 2, 3) ?",
      "code": "SELECT SUBSTR('Bizerte', 2, 3);",
      "answers": [
        "'zerte'",
        "'ize'",
        "'B'",
        "'Biz'"
      ],
      "correct": 1,
      "explain": "SUBSTR(chaîne, début, longueur) : on part du 2e caractère (i) et on prend 3 caractères, soit i, z et e.",
      "hint": "Relis la notion : SUBSTR(chaîne, début, longueur) : on part du 2e caractère (i) et on prend 3 caractères, soit i, z et e.",
      "id": 87
    },
    {
      "cat": "adv",
      "diff": "Facile",
      "q": "Que renvoie LEFT('abcdefghij', 2) ?",
      "code": "SELECT LEFT('abcdefghij', 2);   -- Résultat : ?",
      "answers": [
        "'a'",
        "'ij'",
        "'ab'",
        "'abcdefghij'"
      ],
      "correct": 2,
      "explain": "LEFT extrait les premiers caractères : LEFT('abcdefghij', 2) donne « ab ». C'est le pendant de RIGHT, qui prend les derniers.",
      "hint": "Relis la notion : LEFT extrait les premiers caractères : LEFT('abcdefghij', 2) donne « ab ».",
      "id": 88
    },
    {
      "cat": "adv",
      "diff": "Facile",
      "q": "Que renvoie RIGHT('abcdefghij', 3) ?",
      "code": "SELECT RIGHT('abcdefghij', 3);  -- Résultat : ?",
      "answers": [
        "'hij'",
        "'abc'",
        "'cde'",
        "'j'"
      ],
      "correct": 0,
      "explain": "RIGHT extrait les derniers caractères : les trois derniers de « abcdefghij » sont h, i et j.",
      "hint": "Relis la notion : RIGHT extrait les derniers caractères : les trois derniers de « abcdefghij » sont h, i et j.",
      "id": 89
    },
    {
      "cat": "adv",
      "diff": "Moyen",
      "q": "Quelle est la différence entre SUBSTRING et SUBSTR ?",
      "code": "SELECT SUBSTR(nom_colonne, 2);\nSELECT SUBSTRING(nom_colonne, 2);",
      "answers": [
        "SUBSTR ne fonctionne que sur les dates",
        "Ce sont deux noms de la même fonction selon le SGBD",
        "SUBSTRING supprime la colonne",
        "SUBSTRING renvoie un nombre, SUBSTR un texte"
      ],
      "correct": 1,
      "explain": "Les deux découpent une chaîne de caractères : MySQL accepte les deux écritures, d'autres SGBD n'en connaissent qu'une.",
      "hint": "Relis la notion : Les deux découpent une chaîne de caractères : MySQL accepte les deux écritures, d'autres SGBD n'en connaissent qu'une.",
      "id": 90
    },
    {
      "cat": "adv",
      "diff": "Facile",
      "q": "Quelle fonction renvoie la date et l'heure actuelles du système ?",
      "code": "SELECT ______;",
      "answers": [
        "DATE()",
        "TODAY()",
        "CURRENT()",
        "NOW()"
      ],
      "correct": 3,
      "explain": "NOW() retourne la date et l'heure courantes du système. On la retrouve aussi dans la définition DEFAULT CURRENT_TIMESTAMP.",
      "hint": "Relis la notion : NOW() retourne la date et l'heure courantes du système.",
      "id": 91
    },
    {
      "cat": "adv",
      "diff": "Moyen",
      "q": "Que renvoie MONTH('2024-03-06') ?",
      "code": "SELECT MONTH('2024-03-06');  -- Résultat : ?",
      "answers": [
        "3",
        "6",
        "2024",
        "'2024-03'"
      ],
      "correct": 0,
      "explain": "MONTH() isole le mois de la date : mars correspond au 3e mois. YEAR() et DAY() fonctionnent de la même façon.",
      "hint": "Relis la notion : MONTH() isole le mois de la date : mars correspond au 3e mois.",
      "id": 92
    },
    {
      "cat": "adv",
      "diff": "Moyen",
      "q": "Que renvoie YEAR('2024-03-01') ?",
      "code": "SELECT YEAR('2024-03-01');   -- Résultat : ?",
      "answers": [
        "1",
        "'2024-03-01'",
        "2024",
        "3"
      ],
      "correct": 2,
      "explain": "YEAR() extrait l'année de la date, ici 2024. Ces fonctions d'extraction servent à isoler une partie de la date pour les comparaisons.",
      "hint": "Relis la notion : YEAR() extrait l'année de la date, ici 2024.",
      "id": 93
    },
    {
      "cat": "adv",
      "diff": "Moyen",
      "q": "Que renvoie TIMESTAMP(\"2024-09-15\", \"10:35\") ?",
      "code": "SELECT TIMESTAMP(\"2024-09-15\", \"10:35\");  -- Résultat : ?",
      "answers": [
        "2024-09-15 35:10:00",
        "2024-09-15",
        "10:35",
        "2024-09-15 10:35:00"
      ],
      "correct": 3,
      "explain": "TIMESTAMP combine un champ date et un champ heure en un seul DATETIME ; les secondes sont complétées par 00.",
      "hint": "Relis la notion : TIMESTAMP combine un champ date et un champ heure en un seul DATETIME.",
      "id": 94
    },
    {
      "cat": "adv",
      "diff": "Difficile",
      "q": "Que renvoie DATEADD(month, 3, '2024/08/25') ?",
      "code": "SELECT DATEADD(month, 3, '2024/08/25');  -- Résultat : ?",
      "answers": [
        "2024-05-25",
        "2024-11-25",
        "2024-08-28",
        "2025-11-25"
      ],
      "correct": 1,
      "explain": "DATEADD ajoute un intervalle à une date : 3 mois après le 25 août 2024, on obtient le 25 novembre 2024.",
      "hint": "Relis la notion : DATEADD ajoute un intervalle à une date : 3 mois après le 25 août 2024, on obtient le 25 novembre 2024.",
      "id": 95
    },
    {
      "cat": "adv",
      "diff": "Difficile",
      "q": "Que renvoie DATEDIFF(year, '2024/08/25', '2011/08/25') ?",
      "code": "SELECT DATEDIFF(year, '2024/08/25', '2011/08/25');  -- Résultat : ?",
      "answers": [
        "-12",
        "0",
        "-13",
        "13"
      ],
      "correct": 2,
      "explain": "DATEDIFF calcule l'écart selon l'unité demandée (ici en années) entre la première et la seconde date : 2011 - 2024 = -13.",
      "hint": "Relis la notion : DATEDIFF calcule l'écart selon l'unité demandée (ici en années) entre la première et la seconde date : 2011 - 2024 = -13.",
      "id": 96
    },
    {
      "cat": "adv",
      "diff": "Moyen",
      "q": "Quelle fonction isole le jour du mois dans une date ?",
      "code": "SELECT ______('2024-03-06');  -- Résultat : 6",
      "answers": [
        "DAY",
        "TIMESTAMP",
        "MONTH",
        "YEAR"
      ],
      "correct": 0,
      "explain": "DAY() renvoie le jour du mois (6), MONTH() le mois (3) et YEAR() l'année (2024) : trois fonctions d'extraction données par le cours.",
      "hint": "Relis la notion : DAY() renvoie le jour du mois (6), MONTH() le mois (3) et YEAR() l'année (2024) : trois fonctions d'extraction données par le cours.",
      "id": 97
    },
    {
      "cat": "adv",
      "diff": "Difficile",
      "q": "Pourquoi écrire DEFAULT CURRENT_TIMESTAMP plutôt que NOW() dans chaque INSERT ?",
      "code": "date_loc TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
      "answers": [
        "Parce que la fonction NOW() est interdite à l'intérieur d'une requête INSERT INTO en SQL",
        "Parce que la valeur est alors remplie automatiquement, sans la préciser à chaque insertion",
        "Parce que DEFAULT remplace la clé primaire",
        "Parce que CURRENT_TIMESTAMP est un type de colonne"
      ],
      "correct": 1,
      "explain": "Déclarer la valeur par défaut dans la structure évite d'écrire la date à chaque insertion : le SGBD l'ajoute lui-même quand la colonne est omise.",
      "hint": "Relis la notion : Déclarer la valeur par défaut dans la structure évite d'écrire la date à chaque insertion : le SGBD l'ajoute lui-même quand la colonne est omise.",
      "id": 98
    },
    {
      "cat": "adv",
      "diff": "Moyen",
      "q": "À quoi sert DATEDIFF ?",
      "code": "SELECT DATEDIFF(year, '2024/08/25', '2011/08/25');",
      "answers": [
        "À convertir une date en texte",
        "À comparer deux chaînes de caractères",
        "À ajouter automatiquement un nombre donné de jours ou de mois à une date existante",
        "À calculer l'écart entre deux dates selon une unité donnée"
      ],
      "correct": 3,
      "explain": "DATEDIFF donne la différence entre deux dates dans l'unité demandée (jour, mois, année…). Son pendant DATEADD ajoute un intervalle au lieu de le mesurer.",
      "hint": "Relis la notion : DATEDIFF donne la différence entre deux dates dans l'unité demandée (jour, mois, année…).",
      "id": 99
    },
    {
      "cat": "select",
      "diff": "Facile",
      "q": "Quel nom arrive en premier dans ce tri ?",
      "code": "SELECT nom_Cli FROM Client\nORDER BY nom_Cli;",
      "answers": [
        "Ali",
        "Aucun : ORDER BY ne trie pas les textes",
        "Karim",
        "Mouna"
      ],
      "correct": 0,
      "explain": "ORDER BY trie par ordre croissant (ASC par défaut) : les noms se suivent dans l'ordre alphabétique, Ali avant Karim et Mouna.",
      "hint": "Relis la notion : ORDER BY trie par ordre croissant (ASC par défaut) : les noms se suivent dans l'ordre alphabétique, Ali avant Karim et Mouna.",
      "id": 100
    },
    {
      "cat": "where",
      "diff": "Moyen",
      "q": "Combien de clients ces deux conditions retiennent-elles ?",
      "code": "SELECT nom_Cli FROM Client\nWHERE ville = 'Tunis' OR ville = 'Sfax';",
      "answers": [
        "3",
        "1",
        "2",
        "0"
      ],
      "correct": 2,
      "explain": "OR suffit qu'une seule des conditions soit vraie : Ali (Tunis) et Mouna (Sfax) sont retenus, Karim (Sousse) est écarté.",
      "hint": "Relis la notion : OR suffit qu'une seule des conditions soit vraie : Ali (Tunis) et Mouna (Sfax) sont retenus, Karim (Sousse) est écarté.",
      "id": 101
    },
    {
      "cat": "lien",
      "diff": "Difficile",
      "q": "Que renvoie cette jointure ?",
      "code": "-- Les locations avec le nom du client qui les a prises\nSELECT c.nom_Cli, l.id_location\nFROM Location l, Client c\nWHERE c.NCIN_Cli = l.NCIN_Cli;",
      "answers": [
        "Une erreur : les deux tables ne peuvent pas être listées ensemble",
        "Le nombre de locations de chaque client",
        "Tous les clients, même ceux qui n'ont aucune location",
        "Une ligne par location, avec le nom du client correspondant"
      ],
      "correct": 3,
      "explain": "La jointure associe chaque location à son client grâce à la condition d'égalité sur la clé (NCIN_Cli) : les clients sans location ne figurent pas dans le résultat.",
      "hint": "Relis la notion : La jointure associe chaque location à son client grâce à la condition d'égalité sur la clé (NCIN_Cli) : les clients sans location ne figurent pas dans le résult",
      "id": 102
    },
    {
      "cat": "agg",
      "diff": "Moyen",
      "q": "Que renvoie cette moyenne ?",
      "code": "SELECT avg(pa_art) FROM articles;",
      "answers": [
        "30",
        "20",
        "60",
        "3"
      ],
      "correct": 1,
      "explain": "avg() additionne les valeurs (10 + 20 + 30 = 60) puis divise par le nombre de lignes (3) : la moyenne vaut 20.",
      "hint": "Relis la notion : avg() additionne les valeurs (10 + 20 + 30 = 60) puis divise par le nombre de lignes (3) : la moyenne vaut 20.",
      "id": 103
    },
    {
      "cat": "agg",
      "diff": "Difficile",
      "q": "Que renvoie ce regroupement avec sum ?",
      "code": "SELECT Cod_cli, sum(montant) AS total\nFROM ventes\nGROUP BY Cod_cli;",
      "answers": [
        "Une seule ligne avec 60",
        "Deux lignes : C1 avec 20 et C2 avec 30",
        "Deux lignes : C1 avec 30 et C2 avec 30",
        "Trois lignes, une par vente"
      ],
      "correct": 2,
      "explain": "GROUP BY crée un groupe par client : les deux ventes de C1 sont additionnées (10 + 20 = 30), et C2 n'ayant qu'une vente, son total reste 30.",
      "hint": "Relis la notion : GROUP BY crée un groupe par client : les deux ventes de C1 sont additionnées (10 + 20 = 30), et C2 n'ayant qu'une vente, son total reste 30.",
      "id": 104
    },
    {
      "cat": "write",
      "diff": "Moyen",
      "q": "Combien de lignes cette mise à jour modifie-t-elle ?",
      "code": "UPDATE Client\nSET ville = 'Sousse'\nWHERE NCIN_Cli = '12345678';",
      "answers": [
        "1",
        "0",
        "2",
        "3"
      ],
      "correct": 0,
      "explain": "La condition porte sur la clé primaire : elle ne désigne qu'une seule ligne, celle du client 12345678.",
      "hint": "Relis la notion : La condition porte sur la clé primaire : elle ne désigne qu'une seule ligne, celle du client 12345678.",
      "id": 105
    },
    {
      "cat": "write",
      "diff": "Moyen",
      "q": "Combien de locations restent après ce nettoyage ?",
      "code": "DELETE FROM Location\nWHERE duree_loc = 0;",
      "answers": [
        "3",
        "1",
        "0",
        "2"
      ],
      "correct": 1,
      "explain": "Seules les lignes dont la durée vaut 0 sont supprimées : sur les trois locations, il en reste une.",
      "hint": "Relis la notion : Seules les lignes dont la durée vaut 0 sont supprimées : sur les trois locations, il en reste une.",
      "id": 106
    },
    {
      "cat": "select",
      "diff": "Facile",
      "q": "Quelle requête récupère TOUTES les colonnes de la table Clients ?",
      "code": "-- Afficher tous les clients",
      "answers": [
        "GET ALL FROM Clients",
        "SELECT ALL Clients",
        "FETCH * IN Clients",
        "SELECT * FROM Clients"
      ],
      "correct": 3,
      "explain": "SELECT * signifie « toutes les colonnes ». FROM indique la table source.",
      "hint": "Le joker * veut dire « tout » et on commence toujours par SELECT.",
      "id": 107
    },
    {
      "cat": "select",
      "diff": "Facile",
      "q": "Que fait le mot-clé DISTINCT ?",
      "code": "SELECT DISTINCT ville FROM Clients;",
      "answers": [
        "Il supprime les doublons",
        "Il filtre avec une condition",
        "Il compte les lignes",
        "Il trie les résultats"
      ],
      "correct": 0,
      "explain": "DISTINCT élimine les lignes en double dans le résultat.",
      "hint": "Pense « distinct » = différent, unique.",
      "id": 108
    },
    {
      "cat": "select",
      "diff": "Moyen",
      "q": "Comment trier les employés du salaire le plus élevé au plus bas ?",
      "code": "SELECT * FROM Employes ...",
      "answers": [
        "GROUP BY salaire DESC",
        "ORDER BY salaire ASC",
        "ORDER BY salaire DESC",
        "SORT BY salaire DESC"
      ],
      "correct": 2,
      "explain": "ORDER BY trie, DESC = décroissant, ASC = croissant.",
      "hint": "DESC comme Descendre.",
      "id": 109
    },
    {
      "cat": "select",
      "diff": "Moyen",
      "q": "Quel mot-clé limite le nombre de lignes retournées ? (MySQL / PostgreSQL)",
      "code": "SELECT * FROM Produits LIMIT 5;",
      "answers": [
        "STOP",
        "END",
        "MAX ROWS",
        "LIMIT"
      ],
      "correct": 3,
      "explain": "LIMIT n retourne seulement les n premières lignes. En SQL Server on utilise TOP.",
      "hint": "Ça limite, comme une limitation de vitesse.",
      "id": 110
    },
    {
      "cat": "select",
      "diff": "Moyen",
      "q": "À quoi sert AS dans « SELECT nom AS username » ?",
      "code": "SELECT nom AS username, salaire * 12 AS annuel FROM Employes;",
      "answers": [
        "À trier",
        "À créer un alias (renommer)",
        "À convertir le type",
        "À filtrer les noms"
      ],
      "correct": 1,
      "explain": "AS crée un alias temporaire pour une colonne ou une table, plus lisible.",
      "hint": "AS = surnom, un petit nom sympa.",
      "id": 111
    },
    {
      "cat": "select",
      "diff": "Difficile",
      "q": "Que retourne « SELECT * FROM Produits LIMIT 5 OFFSET 10 » ?",
      "code": "SELECT * FROM Produits LIMIT 5 OFFSET 10;",
      "answers": [
        "Les 5 dernières lignes",
        "Les 5 premières lignes",
        "Les lignes 11 à 15",
        "Les 10 premières lignes"
      ],
      "correct": 2,
      "explain": "OFFSET saute 10 lignes, puis LIMIT prend les 5 suivantes : lignes 11-15. Parfait pour la pagination !",
      "hint": "OFFSET = on saute, LIMIT = on prend.",
      "id": 112
    },
    {
      "cat": "where",
      "diff": "Facile",
      "q": "Quel mot-clé permet de filtrer les lignes selon une condition ?",
      "code": "SELECT * FROM Employes WHERE salaire > 40000;",
      "answers": [
        "WHERE",
        "FILTER",
        "HAVING",
        "CONDITION"
      ],
      "correct": 0,
      "explain": "WHERE filtre les lignes AVANT tout regroupement ou tri.",
      "hint": "WHERE = OÙ la condition est vraie.",
      "id": 113
    },
    {
      "cat": "where",
      "diff": "Facile",
      "q": "Quel opérateur vérifie qu'une valeur est comprise entre deux bornes ?",
      "code": "SELECT * FROM Produits WHERE prix BETWEEN 10 AND 50;",
      "answers": [
        "IN BETWEEN",
        "BETWEEN ... AND ...",
        "AMONG",
        "RANGE"
      ],
      "correct": 1,
      "explain": "BETWEEN 10 AND 50 est inclusif : supérieur ou égal à 10 et inférieur ou égal à 50.",
      "hint": "Between = entre, avec AND pour les bornes.",
      "id": 114
    },
    {
      "cat": "where",
      "diff": "Moyen",
      "q": "Que sélectionne « WHERE nom LIKE 'A%' » ?",
      "code": "SELECT * FROM Clients WHERE nom LIKE 'A%';",
      "answers": [
        "Le nom exact A%",
        "Les noms contenant un A",
        "Les noms finissant par A",
        "Les noms commençant par A"
      ],
      "correct": 3,
      "explain": "% = joker. 'A%' = commence par A. '%A' = finit par A. '%A%' = contient A.",
      "hint": "% est un joker magique qui remplace tout.",
      "id": 115
    },
    {
      "cat": "where",
      "diff": "Moyen",
      "q": "Comment tester correctement qu'une colonne est vide (NULL) ?",
      "code": "SELECT * FROM Clients WHERE email IS NULL;",
      "answers": [
        "WHERE email IS NULL",
        "WHERE email = NULL",
        "WHERE email == NULL",
        "WHERE email IS EMPTY"
      ],
      "correct": 0,
      "explain": "NULL n'est pas une valeur ! On ne peut pas utiliser =. Il faut IS NULL ou IS NOT NULL.",
      "hint": "NULL est spécial, on utilise IS, pas =.",
      "id": 116
    },
    {
      "cat": "where",
      "diff": "Difficile",
      "q": "Tu veux les clients de Paris OU Lyon qui ont PLUS de 25 ans. Quelle requête est correcte ?",
      "code": "-- Attention à la logique !",
      "answers": [
        "WHERE ville IN ('Paris','Lyon') OR age>25",
        "WHERE ville='Paris' AND ville='Lyon' AND age>25",
        "WHERE (ville='Paris' OR ville='Lyon') AND age>25",
        "WHERE ville='Paris' OR ville='Lyon' AND age>25"
      ],
      "correct": 2,
      "explain": "AND est prioritaire sur OR ! Sans parenthèses : Paris tous âges + Lyon >25. Les parenthèses forcent le OU d'abord.",
      "hint": "AND passe avant OR, comme × avant + en maths. Mets des parenthèses !",
      "id": 117
    },
    {
      "cat": "where",
      "diff": "Difficile",
      "q": "Que fait « WHERE id IN (1, 2, 3) » ?",
      "code": "SELECT * FROM Clients WHERE id IN (1,2,3);",
      "answers": [
        "Erreur de syntaxe",
        "id est entre 1 et 3 inclus",
        "id n'est pas 1, 2 ou 3",
        "id vaut 1, 2 ou 3"
      ],
      "correct": 3,
      "explain": "IN teste l'appartenance à une liste. Équivaut à id=1 OR id=2 OR id=3, mais plus propre.",
      "hint": "IN = dans la liste.",
      "id": 118
    },
    {
      "cat": "lien",
      "diff": "Facile",
      "q": "Que fait cette requête de jointure (forme a.x = b.x) sur deux tables ?",
      "code": "SELECT c.nom_Cli, c.ville, l.id_location, l.date_loc\nFROM Client c, Location l\nWHERE c.NCIN_Cli = l.NCIN_Cli;",
      "answers": [
        "Elle conserve tous les clients de la table Client, même ceux qui n'ont aucune location enregistrée",
        "Elle retourne uniquement les lignes qui se correspondent dans les 2 tables (c.NCIN_Cli = l.NCIN_Cli)",
        "Elle garde toutes les lignes des 2 tables sans condition",
        "Elle mélange les lignes au hasard"
      ],
      "correct": 1,
      "explain": "La condition du WHERE (c.NCIN_Cli = l.NCIN_Cli, de la forme a.x = b.x) relie les deux tables sur l'attribut commun NCIN_Cli : seules les lignes qui se correspondent sont gardées.",
      "hint": "Deux tables dans le FROM, l'égalité a.x = b.x dans le WHERE.",
      "id": 119
    },
    {
      "cat": "lien",
      "diff": "Moyen",
      "q": "Un client qui n'a effectué aucune location apparaît-il dans ce résultat ?",
      "code": "SELECT c.nom_Cli, l.id_location\nFROM Client c, Location l\nWHERE c.NCIN_Cli = l.NCIN_Cli;",
      "answers": [
        "Oui, il apparaît une seule fois dans le résultat à condition d'ajouter le mot-clé DISTINCT",
        "Oui, il apparaît avec un id_location égal à 0",
        "Non : aucune ligne de Location ne vérifie c.NCIN_Cli = l.NCIN_Cli pour ce client",
        "Oui, avec NULL à droite"
      ],
      "correct": 2,
      "explain": "La condition d'égalité c.NCIN_Cli = l.NCIN_Cli (forme a.x = b.x) ne garde que les correspondances : un client sans location disparaît du résultat. Pour retrouver les clients sans location, on utilise une sous-requête avec NOT IN ou NOT EXISTS.",
      "hint": "Cherche dans Location une ligne où l.NCIN_Cli = c.NCIN_Cli.",
      "id": 120
    },
    {
      "cat": "lien",
      "diff": "Moyen",
      "q": "À quoi sert la condition v.immat_Vehicule = l.immat_Vehicule (forme a.x = b.x) ?",
      "code": "SELECT v.marque, v.modele, l.date_loc\nFROM Vehicule v, Location l\nWHERE v.immat_Vehicule = l.immat_Vehicule;",
      "answers": [
        "À relier chaque ligne de la 1re table à sa correspondance dans la 2de (même attribut immat_Vehicule)",
        "À renommer les tables du FROM",
        "Au tri final du résultat",
        "À regrouper les véhicules identiques afin de compter automatiquement le nombre de locations"
      ],
      "correct": 0,
      "explain": "La condition de jointure a.x = b.x (ici v.immat_Vehicule = l.immat_Vehicule, clé primaire d'un côté et clé étrangère de même nom de l'autre) relie les lignes des deux tables. Les autres filtres s'ajoutent ensuite avec AND.",
      "hint": "Clé primaire et clé étrangère de même nom : a.x = b.x.",
      "id": 121
    },
    {
      "cat": "lien",
      "diff": "Difficile",
      "q": "Combien de lignes retourne cette requête si on oublie WHERE c.NCIN_Cli = l.NCIN_Cli ?",
      "code": "-- Client contient 3 lignes, Location en contient 4\nSELECT *\nFROM Client c, Location l;   -- aucune condition WHERE a.x = b.x !",
      "answers": [
        "7 lignes",
        "12 lignes",
        "4 lignes",
        "3 lignes"
      ],
      "correct": 1,
      "explain": "Sans la condition WHERE c.NCIN_Cli = l.NCIN_Cli (a.x = b.x), chaque ligne de Client est combinée à chaque ligne de Location : c'est le produit cartésien, 3 × 4 = 12 lignes. Avec WHERE a.x = b.x, on obtient la jointure.",
      "hint": "Sans condition WHERE a.x = b.x : toutes les combinaisons possibles (3 × 4).",
      "id": 122
    },
    {
      "cat": "lien",
      "diff": "Difficile",
      "q": "Comment relie-t-on les 3 tables Client c, Location l et Vehicule v ?",
      "code": "SELECT c.nom_Cli, v.marque, l.date_loc\nFROM Client c, Location l, Vehicule v\nWHERE c.NCIN_Cli = l.NCIN_Cli\n  AND v.immat_Vehicule = l.immat_Vehicule;",
      "answers": [
        "Elle met les trois tables dans la clause FROM sans écrire de condition dans le WHERE",
        "Elle supprime les véhicules loués",
        "Elle interroge trois bases de données différentes",
        "Elle relie les 3 tables avec deux conditions de la forme a.x = b.x séparées par AND"
      ],
      "correct": 3,
      "explain": "Pour joindre 3 tables (Client c, Location l, Vehicule v), on écrit deux égalités de la forme a.x = b.x dans le WHERE : c.NCIN_Cli = l.NCIN_Cli AND v.immat_Vehicule = l.immat_Vehicule.",
      "hint": "3 tables dans le FROM → 2 conditions a.x = b.x reliées par AND dans le WHERE.",
      "id": 123
    },
    {
      "cat": "lien",
      "diff": "Expert",
      "q": "Comment lister les clients qui n'ont effectué AUCUNE location ?",
      "code": "-- Objectif : les clients sans la moindre location\nSELECT c.nom_Cli, c.NCIN_Cli\nFROM Client c\nWHERE NOT EXISTS (\n  SELECT 1 FROM Location l\n  WHERE l.NCIN_Cli = c.NCIN_Cli\n);",
      "answers": [
        "Écrire la sous-requête NOT EXISTS (ou NOT IN) avec l.NCIN_Cli = c.NCIN_Cli",
        "Trier par nom_Cli puis garder la première ligne",
        "Écrire une jointure classique FROM Client c, Location l WHERE c.NCIN_Cli != l.NCIN_Cli",
        "Ajouter DISTINCT devant la colonne nom_Cli"
      ],
      "correct": 0,
      "explain": "La condition d'égalité c.NCIN_Cli = l.NCIN_Cli (a.x = b.x) ne garde que les clients ayant au moins une location : les clients sans location disparaissent. On les retrouve donc avec une sous-requête NOT EXISTS (WHERE l.NCIN_Cli = c.NCIN_Cli) ou NOT IN.",
      "hint": "Cherche les clients pour lesquels aucune ligne de Location ne vérifie l.NCIN_Cli = c.NCIN_Cli.",
      "id": 124
    },
    {
      "cat": "agg",
      "diff": "Facile",
      "q": "Que retourne COUNT(*) ?",
      "code": "SELECT COUNT(*) FROM Clients;",
      "answers": [
        "La somme des valeurs",
        "La moyenne",
        "Le nombre total de lignes",
        "Le nombre de colonnes"
      ],
      "correct": 2,
      "explain": "COUNT(*) compte toutes les lignes, y compris celles avec des NULL.",
      "hint": "COUNT = compter les étoiles = les lignes.",
      "id": 125
    },
    {
      "cat": "agg",
      "diff": "Moyen",
      "q": "Quelle requête calcule le salaire moyen PAR département ?",
      "code": "SELECT ...",
      "answers": [
        "SELECT dept, AVG(salaire) FROM Employes WHERE dept",
        "SELECT dept FROM Employes ORDER BY AVG(salaire)",
        "SELECT AVG(salaire) FROM Employes",
        "SELECT dept, AVG(salaire) FROM Employes GROUP BY dept"
      ],
      "correct": 3,
      "explain": "GROUP BY crée un groupe par département, puis AVG calcule la moyenne de chaque groupe.",
      "hint": "PAR département = GROUP BY département.",
      "id": 126
    },
    {
      "cat": "agg",
      "diff": "Difficile",
      "q": "Que fait GROUP BY ?",
      "code": "SELECT ville, COUNT(*) FROM Clients GROUP BY ville;",
      "answers": [
        "Il joint deux tables",
        "Il regroupe les lignes identiques pour calculer des agrégats",
        "Il trie les résultats",
        "Il supprime physiquement de la table toutes les lignes qui possèdent des valeurs dupliquées"
      ],
      "correct": 1,
      "explain": "GROUP BY rassemble les lignes ayant mêmes valeurs pour appliquer COUNT, SUM, AVG...",
      "hint": "GROUP = groupe, on fait des paquets.",
      "id": 127
    },
    {
      "cat": "agg",
      "diff": "Difficile",
      "q": "Laquelle compte AUSSI les lignes où la colonne est NULL ?",
      "code": "-- Table avec des NULL dans nom",
      "answers": [
        "COUNT(nom)",
        "AVG(nom)",
        "COUNT(*)",
        "SUM(nom)"
      ],
      "correct": 2,
      "explain": "COUNT(*) compte les lignes. COUNT(col), AVG et SUM ignorent les NULL !",
      "hint": "L'étoile voit tout, même les NULL.",
      "id": 128
    },
    {
      "cat": "agg",
      "diff": "Expert",
      "q": "Quelle requête trouve les départements avec PLUS de 10 employés ?",
      "code": "SELECT ...",
      "answers": [
        "SELECT dept, COUNT(*) FROM Emp GROUP BY dept HAVING COUNT(*)>10",
        "SELECT dept, COUNT(*) FROM Emp GROUP BY dept WHERE COUNT(*)>10",
        "SELECT dept FROM Emp ORDER BY COUNT(*)>10",
        "SELECT dept FROM Emp WHERE COUNT(*)>10"
      ],
      "correct": 0,
      "explain": "On groupe, on compte, puis HAVING filtre les groupes. WHERE ne peut pas utiliser COUNT(*).",
      "hint": "Filtrer sur un COUNT après GROUP BY = HAVING.",
      "id": 129
    },
    {
      "cat": "adv",
      "diff": "Moyen",
      "q": "Qu'est-ce qu'une sous-requête ?",
      "code": "SELECT * FROM Employes WHERE salaire > (SELECT AVG(salaire) FROM Employes);",
      "answers": [
        "Une requête sauvegardée",
        "Une requête imbriquée dans une autre",
        "Deux requêtes indépendantes exécutées l'une après l'autre et séparées par un point-virgule",
        "Une requête en commentaire"
      ],
      "correct": 1,
      "explain": "La requête interne s'exécute d'abord, puis l'externe l'utilise. Puissant !",
      "hint": "Sous = à l'intérieur, entre parenthèses.",
      "id": 130
    },
    {
      "cat": "adv",
      "diff": "Expert",
      "q": "Quelle est la différence entre UNION et UNION ALL ?",
      "code": "SELECT nom FROM Clients UNION SELECT nom FROM Prospects;",
      "answers": [
        "UNION conserve toutes les lignes dupliquées, tandis que UNION ALL élimine les doublons",
        "Ce sont des synonymes",
        "UNION ALL trie, UNION non",
        "UNION supprime les doublons, UNION ALL les garde (plus rapide)"
      ],
      "correct": 3,
      "explain": "<strong>[Bonus Culture BD — hors épreuve Bac]</strong> UNION fait un DISTINCT implicite (plus lent). UNION ALL empile tout, plus rapide.",
      "hint": "ALL = tout, même les doublons.",
      "id": 131
    },
    {
      "cat": "adv",
      "diff": "Expert",
      "q": "Que fait CASE WHEN ?",
      "code": "SELECT nom, CASE WHEN note>=10 THEN 'Admis' ELSE 'Recale' END AS res FROM Etudiants;",
      "answers": [
        "Un if/else pour créer une colonne calculée",
        "Une jointure",
        "Un filtre appliqué après GROUP BY pour éliminer les groupes ne vérifiant pas la condition",
        "Une boucle"
      ],
      "correct": 0,
      "explain": "<strong>[Bonus Culture BD — hors épreuve Bac]</strong> CASE permet des conditions ligne par ligne, comme un if/else. Indispensable pour les rapports !",
      "hint": "CASE = cas : dans tel cas, affiche ceci.",
      "id": 132
    },
    {
      "cat": "adv",
      "diff": "Expert",
      "q": "Que fait EXISTS (SELECT ...) ?",
      "code": "SELECT * FROM Client c WHERE EXISTS (SELECT 1 FROM Location l WHERE l.NCIN_Cli = c.NCIN_Cli);",
      "answers": [
        "Compte les lignes",
        "Vérifie dans le schéma si la table ou la colonne citée existe bien dans la base",
        "Teste si la sous-requête retourne au moins une ligne",
        "Teste si une valeur est NULL"
      ],
      "correct": 2,
      "explain": "EXISTS est vrai dès qu'une ligne existe dans Location avec l.NCIN_Cli = c.NCIN_Cli (forme a.x = b.x). Très optimisé : s'arrête au premier match.",
      "hint": "EXISTS = existe-t-il au moins une ligne ?",
      "id": 133
    },
    {
      "cat": "adv",
      "diff": "Expert",
      "q": "Qu'est-ce qu'une CTE (WITH ...) ?",
      "code": "WITH TopClients AS (SELECT ...) SELECT * FROM TopClients;",
      "answers": [
        "Une nouvelle table physique",
        "Un index",
        "Une vue permanente stockée sur le disque et partagée entre toutes les sessions",
        "Une requête temporaire nommée et réutilisable"
      ],
      "correct": 3,
      "explain": "<strong>[Bonus Culture BD — hors épreuve Bac]</strong> CTE = Common Table Expression. Plus lisible que les sous-requêtes géantes. Peut être récursive !",
      "hint": "WITH = avec, on définit un bloc nommé avant le SELECT.",
      "id": 134
    },
    {
      "cat": "adv",
      "diff": "Expert",
      "q": "Quel objet accélère les recherches SANS changer les données ?",
      "code": "CREATE INDEX idx_nom ON Clients(nom);",
      "answers": [
        "TRIGGER",
        "INDEX",
        "PROCEDURE",
        "VIEW"
      ],
      "correct": 1,
      "explain": "<strong>[Bonus Culture BD — hors épreuve Bac]</strong> Un INDEX est comme le sommaire d'un livre : il accélère la recherche dans le WHERE, dans les conditions de liaison et dans le ORDER BY.",
      "hint": "Comme l'index d'un livre pour retrouver vite.",
      "id": 135
    },
    {
      "cat": "ddl",
      "diff": "Facile",
      "q": "Quelle commande crée une table ?",
      "code": "CREATE TABLE Clients (id INT PRIMARY KEY, nom VARCHAR(100));",
      "answers": [
        "ADD TABLE",
        "MAKE TABLE",
        "CREATE TABLE",
        "NEW TABLE"
      ],
      "correct": 2,
      "explain": "CREATE TABLE définit la structure : nom, colonnes, types et contraintes.",
      "hint": "CREATE = créer, tout simplement.",
      "id": 136
    },
    {
      "cat": "ddl",
      "diff": "Facile",
      "q": "Quel type est idéal pour un texte court comme un nom ?",
      "code": "nom VARCHAR(100) -- 100 caracteres max",
      "answers": [
        "VARCHAR",
        "INT",
        "DATE",
        "BOOLEAN"
      ],
      "correct": 0,
      "explain": "VARCHAR(n) = texte variable jusqu'à n caractères. INT = entier, DATE = date.",
      "hint": "VAR CHAR = caractères variables.",
      "id": 137
    },
    {
      "cat": "ddl",
      "diff": "Moyen",
      "q": "Que fait « ALTER TABLE Clients ADD email VARCHAR(100); » ?",
      "code": "ALTER TABLE Clients ADD email VARCHAR(100);",
      "answers": [
        "Supprime la colonne email",
        "Ajoute une colonne email",
        "Crée un index",
        "Renomme la table"
      ],
      "correct": 1,
      "explain": "ALTER TABLE modifie la structure : ADD ajoute, DROP COLUMN supprime.",
      "hint": "ADD = ajouter, ALTER = modifier.",
      "id": 138
    },
    {
      "cat": "ddl",
      "diff": "Moyen",
      "q": "Quelle contrainte garantit unicité + non-nullité et identifie chaque ligne ?",
      "code": "id INT PRIMARY KEY",
      "answers": [
        "DEFAULT",
        "FOREIGN KEY",
        "CHECK",
        "PRIMARY KEY"
      ],
      "correct": 3,
      "explain": "PRIMARY KEY = identifiant unique, jamais NULL, un seul par table.",
      "hint": "PRIMARY = principal, la clé principale.",
      "id": 139
    },
    {
      "cat": "ddl",
      "diff": "Expert",
      "q": "Quelle affirmation sur DROP / DELETE / TRUNCATE est VRAIE ?",
      "code": "-- 3 façons de supprimer, 3 effets !",
      "answers": [
        "DROP supprime la table, DELETE des lignes (filtrable), TRUNCATE vide vite toute la table",
        "Ce sont des synonymes",
        "DELETE détruit la structure de la table, DROP vide les lignes et TRUNCATE filtre avec WHERE",
        "TRUNCATE supprime la base entière"
      ],
      "correct": 0,
      "explain": "<strong>[Bonus Culture BD — hors épreuve Bac]</strong> DROP = table détruite. DELETE = lignes (avec WHERE, rollback possible). TRUNCATE = vidage rapide total.",
      "hint": "DROP = on drop la table entière !",
      "id": 140
    },
    {
      "cat": "ddl",
      "diff": "Expert",
      "q": "Que fait une FOREIGN KEY ?",
      "code": "FOREIGN KEY (NCIN_Cli) REFERENCES Client(NCIN_Cli)",
      "answers": [
        "Elle génère automatiquement un compteur entier auto-incrémenté sur la table enfant",
        "Elle empêche les NULL",
        "Elle lie une colonne à la clé primaire de même nom d'une autre table",
        "Elle rend une colonne unique"
      ],
      "correct": 2,
      "explain": "Clé étrangère = intégrité référentielle (NCIN_Cli dans Location pointe vers NCIN_Cli dans Client). Impossible d'avoir une location pour un client inexistant !",
      "hint": "FOREIGN = étrangère, elle référence la clé primaire de la table parente.",
      "id": 141
    }
  ];
  
  window.STI_QUIZ_SQL_CATS = {
    "select": {
      "name": "Fête du SELECT",
      "short": "SELECT",
      "desc": "Récupérer les bonnes colonnes, trier, aliaser.",
      "icon": "🎯",
      "color": "#FFD23F",
      "bg": "#FFF3C4",
      "fg": "#1A1A2E"
    },
    "where": {
      "name": "Guerriers du WHERE",
      "short": "WHERE",
      "desc": "Filtrer avec précision chirurgicale.",
      "icon": "🔍",
      "color": "#FF9F6B",
      "bg": "#FFE8D9",
      "fg": "#1A1A2E"
    },
    "lien": {
      "name": "Ponts des tables",
      "short": "LIAISONS",
      "desc": "Relier deux tables : a.cle = b.cle.",
      "icon": "🧩",
      "color": "#7B61FF",
      "bg": "#E3DCFF",
      "fg": "#FFFFFF"
    },
    "agg": {
      "name": "Gang du GROUP BY",
      "short": "GROUP BY",
      "desc": "Compter, moyenner, agréger en boss.",
      "icon": "📊",
      "color": "#2ECC9E",
      "bg": "#D9F6EC",
      "fg": "#1A1A2E"
    },
    "adv": {
      "name": "Fonctions & boss avancés",
      "short": "AVANCÉ",
      "desc": "Chaînes, dates, sous-requêtes, UNION...",
      "icon": "🧠",
      "color": "#FF5D8F",
      "bg": "#FFE0EB",
      "fg": "#FFFFFF"
    },
    "ddl": {
      "name": "Bâtisseurs DDL",
      "short": "DDL",
      "desc": "Créer et structurer des bases solides.",
      "icon": "🏗️",
      "color": "#4CC9F0",
      "bg": "#D6F0FF",
      "fg": "#1A1A2E"
    },
    "bdd": {
      "name": "Cavernes des données",
      "short": "SGBD",
      "desc": "SGBD, LDD et LMD : les fondations.",
      "icon": "🗄️",
      "color": "#B8F135",
      "bg": "#F0FFD0",
      "fg": "#1A1A2E"
    },
    "write": {
      "name": "Atelier écriture",
      "short": "LMD",
      "desc": "INSERT, UPDATE, DELETE : écrire dans la base.",
      "icon": "✍️",
      "color": "#FFB800",
      "bg": "#FFF3C4",
      "fg": "#1A1A2E"
    }
  };
})();
