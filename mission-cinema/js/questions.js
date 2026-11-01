/* ============================================================================
   MISSION CINÉMA — STI Version 2.0 By A'E
   Données des questions interactives, extraites fidèlement de la série
   "Corrigé : Série de TD SQL (thème Cinéma)" — Lycée Rafèha / Aymen Essouyah
   (fichier mis à jour : Corrige_TD_SQL_Cinema-3.pdf)

   Règles respectées (voir prompt du projet) :
   - Les questions, réponses et résultats sont ceux de la correction officielle.
   - Aucun nom de table, attribut ou contrainte n'a été modifié.
   - L'ordre et la numérotation de la série sont respectés (questions 1 à 45).
   - La numérotation commence à 1 (LDD : création des tables).

   Structure d'une question :
   {
     id, num,      // numéro dans la série (ex. 1, 2, … 45)
     time,         // instant de pause dans la vidéo (secondes, timeline mission)
     chapter,      // chapitre auquel la question appartient
     type,         // 'sql' (réponse SQL) | 'resultat' (prévoir le résultat)
     enonce,       // énoncé affiché à l'élève
     refs,         // SQL de référence (type 'sql') — une ou plusieurs écritures valides
     attendu,      // pour type 'resultat' : valeurs qui doivent figurer dans la réponse
     resultat,     // { colonnes: [...], lignes: [[...], ...] } résultat de référence
     explication,  // explication pédagogique issue de la correction
     note          // précision optionnelle (seuil abaissé, date de référence…)
   }
   ============================================================================ */

window.QUESTIONS_DATA = (function () {
  "use strict";

  var NULL = null;

  var Q = [
  /* ================= Chapitre 1 — LDD (Définition des données) ================= */
  {
    id: 1, num: 1, time: 50.583, chapter: 1, type: "sql",
    enonce: "Créer les tables <b>REALISATEUR, FILM, ACTEUR, JOUER et PROJECTION</b> avec leurs clés primaires et étrangères.<br>" +
            "<code>duree</code> doit être &gt; 0, <code>annee</code> ≥ 1900 et <code>cachet</code> ≥ 0.<br>" +
            "(<code>idParrain</code> sera ajoutée à la question 25.)",
    refs: [
      "CREATE TABLE realisateur (idReal INT PRIMARY KEY, nom VARCHAR(30) NOT NULL, prenom VARCHAR(30), nationalite VARCHAR(30)); " +
      "CREATE TABLE acteur (idActeur INT PRIMARY KEY, nom VARCHAR(30) NOT NULL, prenom VARCHAR(30), dateNaiss DATE, nationalite VARCHAR(30)); " +
      "CREATE TABLE film (idFilm INT AUTO_INCREMENT PRIMARY KEY, titre VARCHAR(50) NOT NULL, genre VARCHAR(30), annee INT CHECK (annee >= 1900), duree INT CHECK (duree > 0), budget BIGINT, idReal INT, FOREIGN KEY (idReal) REFERENCES realisateur(idReal)); " +
      "CREATE TABLE jouer (idFilm INT, idActeur INT, role VARCHAR(40), cachet DECIMAL(10,2) CHECK (cachet >= 0), PRIMARY KEY (idFilm, idActeur), FOREIGN KEY (idFilm) REFERENCES film(idFilm), FOREIGN KEY (idActeur) REFERENCES acteur(idActeur)); " +
      "CREATE TABLE projection (idProj INT PRIMARY KEY, idFilm INT, salle VARCHAR(20), dateProj DATE, nbSpectateurs INT, FOREIGN KEY (idFilm) REFERENCES film(idFilm));"
    ],
    resultat: {
      colonnes: ["Tables_in_cinema"],
      lignes: [
        ["acteur"], ["film"], ["jouer"], ["projection"], ["realisateur"]
      ]
    },
    explication: "Les cinq tables sont créées avec leurs clés primaires et étrangères. Les contraintes CHECK sur annee (>= 1900), duree (&gt; 0) et cachet (>= 0) garantissent l'intégrité des données."
  },
  {
    id: 2, num: 2, time: 68.500, chapter: 1, type: "sql",
    enonce: "Ajouter à la table <b>ACTEUR</b> une colonne <b>email</b> (VARCHAR 50).",
    refs: ["ALTER TABLE acteur ADD email VARCHAR(50);"],
    resultat: {
      colonnes: ["Field", "Type", "Null", "Key", "Default", "Extra"],
      lignes: [
        ["idActeur", "int(11)", "NO", "PRI", "NULL", ""],
        ["nom", "varchar(30)", "NO", "", "NULL", ""],
        ["prenom", "varchar(30)", "YES", "", "NULL", ""],
        ["dateNaiss", "date", "YES", "", "NULL", ""],
        ["nationalite", "varchar(30)", "YES", "", "NULL", ""],
        ["email", "varchar(50)", "YES", "", "NULL", ""]
      ]
    },
    explication: "ADD email VARCHAR(50) ajoute une nouvelle colonne à la table ACTEUR. Elle accepte les valeurs NULL par défaut."
  },
  {
    id: 3, num: 3, time: 75.083, chapter: 1, type: "sql",
    enonce: "Modifier le type de <b>titre</b> en VARCHAR(100) et rendre la colonne <b>genre</b> NOT NULL dans la table FILM.",
    refs: [
      "ALTER TABLE film MODIFY titre VARCHAR(100);",
      "ALTER TABLE film MODIFY genre VARCHAR(30) NOT NULL;",
      "ALTER TABLE film MODIFY titre VARCHAR(100), MODIFY genre VARCHAR(30) NOT NULL;"
    ],
    resultat: {
      colonnes: ["Field", "Type", "Null", "Key", "Default", "Extra"],
      lignes: [
        ["idFilm", "int(11)", "NO", "PRI", "NULL", "auto_increment"],
        ["titre", "varchar(100)", "YES", "", "NULL", ""],
        ["genre", "varchar(30)", "NO", "", "NULL", ""],
        ["annee", "int(11)", "YES", "", "NULL", ""],
        ["duree", "int(11)", "YES", "", "NULL", ""],
        ["budget", "bigint(20)", "YES", "", "NULL", ""],
        ["idReal", "int(11)", "YES", "MUL", "NULL", ""]
      ]
    },
    explication: "MODIFY permet de changer le type d'une colonne et d'ajouter ou supprimer une contrainte NOT NULL sur une colonne existante."
  },
  {
    id: 4, num: 4, time: 84.833, chapter: 1, type: "sql",
    enonce: "Supprimer la colonne <b>email</b> de la table ACTEUR.",
    refs: ["ALTER TABLE acteur DROP COLUMN email;"],
    resultat: {
      colonnes: ["Field", "Type", "Null", "Key", "Default", "Extra"],
      lignes: [
        ["idActeur", "int(11)", "NO", "PRI", "NULL", ""],
        ["nom", "varchar(30)", "NO", "", "NULL", ""],
        ["prenom", "varchar(30)", "YES", "", "NULL", ""],
        ["dateNaiss", "date", "YES", "", "NULL", ""],
        ["nationalite", "varchar(30)", "YES", "", "NULL", ""]
      ]
    },
    explication: "DROP COLUMN email retire définitivement la colonne de la table ACTEUR."
  },
  {
    id: 5, num: 5, time: 88.333, chapter: 1, type: "sql",
    enonce: "Supprimer la table <b>PROJECTION</b>, puis la recréer avec la même structure (idProj, idFilm, salle, dateProj, nbSpectateurs) et sa clé étrangère vers FILM.",
    refs: [
      "DROP TABLE projection;",
      "CREATE TABLE projection (idProj INT PRIMARY KEY, idFilm INT, salle VARCHAR(20), dateProj DATE, nbSpectateurs INT, FOREIGN KEY (idFilm) REFERENCES film(idFilm));"
    ],
    resultat: {
      colonnes: ["Tables_in_cinema"],
      lignes: [
        ["acteur"], ["film"], ["jouer"], ["projection"], ["realisateur"]
      ]
    },
    explication: "DROP TABLE supprime la table et toutes ses données. CREATE TABLE la recrée avec la structure souhaitée, y compris la clé étrangère vers FILM."
  },
  /* ================= Chapitre 2 — LMD (Manipulation des données) ================= */
  {
    id: 6, num: 6, time: 93.500, chapter: 2, type: "sql",
    enonce: "Insérer 3 réalisateurs, 6 films, 6 acteurs et au moins 10 lignes dans JOUER (+ 9 projections). Le cachet est exprimé en milliers de dollars ; les distributions et dates de naissance sont adaptées pour les besoins de l'exercice.",
    refs: [
      "INSERT INTO realisateur VALUES (1,'Nolan','Christopher','Britannique'),(2,'Scorsese','Martin','Américaine'),(3,'Hazanavicius','Michel','Française'); " +
      "INSERT INTO acteur VALUES (1,'DiCaprio','Leonardo','1974-11-11','Américaine'),(2,'Bale','Christian','1974-11-11','Britannique'),(3,'Ledger','Heath','1979-04-04','Australienne'),(4,'Dujardin','Jean','1972-06-19','Française'),(5,'McConaughey','Matthew','1969-11-04','Américaine'),(6,'Ruffalo','Mark','1967-11-22','Américaine'); " +
      "INSERT INTO film (idFilm, titre, genre, annee, duree, budget, idReal) VALUES (1,'Inception','Science-fiction',2010,140,160000000,1),(2,'Interstellar','Science-fiction',2014,169,165000000,1),(3,'The Dark Knight','Action',2008,152,185000000,1),(4,'Les Infiltrés','Action',2006,151,90000000,2),(5,'Shutter Island','Thriller',2010,138,80000000,2),(6,'OSS 117','Comédie',2006,99,14000000,3); " +
      "INSERT INTO jouer VALUES (1,1,'Dom Cobb',20000),(1,4,'Eames',4000),(1,3,'Arthur',4500),(2,5,'Cooper',15000),(3,2,'Bruce Wayne',12000),(3,3,'Joker',3000),(4,1,'Billy Costigan',25000),(5,1,'Teddy Daniels',30000),(5,6,'Chuck Aule',2500),(6,4,'Hubert Bonisseur',1500),(6,2,'Agent Moreau',900); " +
      "INSERT INTO projection VALUES (1,1,'Salle 1','2026-09-20',85),(2,1,'Salle 2','2026-10-03',120),(3,2,'Salle 1','2026-10-10',150),(4,3,'Salle 3','2026-10-17',8),(5,3,'Salle 1','2026-10-24',95),(6,5,'Salle 2','2026-10-31',60),(7,6,'Salle 3','2026-11-15',70),(8,2,'Salle 1','2026-12-05',110),(9,4,'Salle 2','2026-10-05',5);"
    ],
    resultat: {
      colonnes: ["idFilm", "titre", "genre", "annee", "duree", "budget", "idReal"],
      lignes: [
        [1, "Inception", "Science-fiction", 2010, 140, 160000000, 1],
        [2, "Interstellar", "Science-fiction", 2014, 169, 165000000, 1],
        [3, "The Dark Knight", "Action", 2008, 152, 185000000, 1],
        [4, "Les Infiltrés", "Action", 2006, 151, 90000000, 2],
        [5, "Shutter Island", "Thriller", 2010, 138, 80000000, 2],
        [6, "OSS 117", "Comédie", 2006, 99, 14000000, 3]
      ]
    },
    explication: "Les insertions respectent l'ordre des dépendances : d'abord les tables parentes (REALISATEUR, FILM, ACTEUR), puis les tables liées par clés étrangères (JOUER, PROJECTION). 11 lignes dans JOUER et 9 projections ont été insérées."
  },
  {
    id: 7, num: 7, time: 104.333, chapter: 2, type: "sql",
    enonce: "Insérer un nouveau film en ne renseignant que le titre, le genre et le réalisateur.",
    refs: [
      "INSERT INTO film (titre, genre, idReal) VALUES ('Tenet', 'Action', 1);",
      "INSERT INTO film SET titre = 'Tenet', genre = 'Action', idReal = 1;"
    ],
    resultat: {
      colonnes: ["idFilm", "titre", "genre", "annee", "duree", "budget", "idReal"],
      lignes: [[7, "Tenet", "Action", NULL, NULL, NULL, 1]]
    },
    explication: "Les colonnes non renseignées prennent leur valeur par défaut (NULL ici, aucune contrainte NOT NULL ni DEFAULT sur ces colonnes)."
  },
  {
    id: 8, num: 8, time: 112.667, chapter: 2, type: "sql",
    enonce: "Mettre la durée du film « Inception » à 148 minutes.",
    refs: ["UPDATE film SET duree = 148 WHERE titre = 'Inception';"],
    resultat: {
      colonnes: ["titre", "duree"],
      lignes: [["Inception", 148]]
    },
    explication: "UPDATE modifie uniquement les lignes satisfaisant la clause WHERE. Ici, seule la ligne du film « Inception » est concernée."
  },
  {
    id: 9, num: 9, time: 118.500, chapter: 2, type: "sql",
    enonce: "Augmenter de 10 % le cachet de tous les rôles dont le cachet est inférieur à 5000.",
    refs: [
      "UPDATE jouer SET cachet = cachet * 1.10 WHERE cachet < 5000;",
      "UPDATE jouer SET cachet = cachet + cachet * 0.10 WHERE cachet < 5000;"
    ],
    resultat: {
      colonnes: ["idFilm", "idActeur", "role", "cachet"],
      lignes: [
        [1, 1, "Dom Cobb", 20000.00], [1, 3, "Arthur", 4950.00], [1, 4, "Eames", 4400.00],
        [2, 5, "Cooper", 15000.00], [3, 2, "Bruce Wayne", 12000.00], [3, 3, "Joker", 3300.00],
        [4, 1, "Billy Costigan", 25000.00], [5, 1, "Teddy Daniels", 30000.00],
        [5, 6, "Chuck Aule", 2750.00], [6, 2, "Agent Moreau", 990.00], [6, 4, "Hubert Bonisseur", 1650.00]
      ]
    },
    explication: "L'opération arithmétique s'applique ligne par ligne sur les cachets &lt; 5000 (arrondi décimal de MariaDB). Les deux écritures sont équivalentes."
  },
  {
    id: 10, num: 10, time: 125.417, chapter: 2, type: "sql",
    enonce: "Avec jointure : augmenter de 20 % les cachets des acteurs jouant dans les films du genre « Action » réalisés par « Nolan ».",
    refs: [
      "UPDATE jouer j, film f, realisateur r SET j.cachet = j.cachet * 1.20 WHERE j.idFilm = f.idFilm AND f.idReal = r.idReal AND f.genre = 'Action' AND r.nom = 'Nolan';",
      "UPDATE jouer SET cachet = cachet * 1.20 WHERE idFilm IN (SELECT f.idFilm FROM film f, realisateur r WHERE f.idReal = r.idReal AND f.genre = 'Action' AND r.nom = 'Nolan');"
    ],
    resultat: {
      colonnes: ["titre", "idActeur", "role", "cachet"],
      lignes: [
        ["The Dark Knight", 2, "Bruce Wayne", 14400.00],
        ["The Dark Knight", 3, "Joker", 3960.00]
      ]
    },
    explication: "La mise à jour porte sur plusieurs tables liées (JOUER, FILM, REALISATEUR). Seuls les rôles des films Action de Nolan sont revalorisés."
  },
  {
    id: 11, num: 11, time: 134.583, chapter: 2, type: "sql",
    enonce: "Avec sous-requête : mettre budget = 0 pour les films qui n'ont aucun acteur.",
    refs: [
      "UPDATE film SET budget = 0 WHERE idFilm NOT IN (SELECT idFilm FROM jouer);",
      "UPDATE film f SET f.budget = 0 WHERE NOT EXISTS (SELECT * FROM jouer j WHERE j.idFilm = f.idFilm);"
    ],
    resultat: {
      colonnes: ["idFilm", "titre", "budget"],
      lignes: [
        [1, "Inception", 160000000], [2, "Interstellar", 165000000], [3, "The Dark Knight", 185000000],
        [4, "Les Infiltrés", 90000000], [5, "Shutter Island", 80000000], [6, "OSS 117", 14000000],
        [7, "Tenet", 0]
      ]
    },
    explication: "La sous-requête (ou NOT EXISTS) identifie les films sans aucun acteur dans JOUER. Seul « Tenet » (idFilm 7) n'a aucun acteur : son budget passe à 0."
  },
  {
    id: 12, num: 12, time: 141.417, chapter: 2, type: "sql",
    enonce: "Avec requête imbriquée : passer au genre « Blockbuster » les films dont le budget dépasse le budget moyen des films du genre « Action ».<br>" +
            "(MySQL interdit de lire la table modifiée dans la sous-requête : on passe par une table dérivée.)",
    refs: [
      "UPDATE film SET genre = 'Blockbuster' WHERE budget > (SELECT AVG(f.budget) FROM (SELECT budget, genre FROM film) AS f WHERE f.genre = 'Action');",
      "SET @moy = (SELECT AVG(budget) FROM film WHERE genre = 'Action'); UPDATE film SET genre = 'Blockbuster' WHERE budget > @moy;"
    ],
    resultat: {
      colonnes: ["idFilm", "titre", "genre", "budget"],
      lignes: [
        [1, "Inception", "Blockbuster", 160000000], [2, "Interstellar", "Blockbuster", 165000000],
        [3, "The Dark Knight", "Blockbuster", 185000000], [4, "Les Infiltrés", "Action", 90000000],
        [5, "Shutter Island", "Thriller", 80000000], [6, "OSS 117", "Comédie", 14000000],
        [7, "Tenet", "Action", 0]
      ]
    },
    explication: "La table dérivée (SELECT ... AS f) contourne l'interdiction de MariaDB de lire dans une sous-requête la table en cours de modification."
  },
  {
    id: 13, num: 13, time: 157.000, chapter: 2, type: "sql",
    enonce: "Supprimer les projections ayant moins de 10 spectateurs.",
    refs: ["DELETE FROM projection WHERE nbSpectateurs < 10;"],
    resultat: {
      colonnes: ["idProj", "idFilm", "salle", "dateProj", "nbSpectateurs"],
      lignes: [
        [1, 1, "Salle 1", "2026-09-20", 85], [2, 1, "Salle 2", "2026-10-03", 120],
        [3, 2, "Salle 1", "2026-10-10", 150], [5, 3, "Salle 1", "2026-10-24", 95],
        [6, 5, "Salle 2", "2026-10-31", 60], [7, 6, "Salle 3", "2026-11-15", 70],
        [8, 2, "Salle 1", "2026-12-05", 110]
      ]
    },
    explication: "DELETE supprime les lignes selon le prédicat WHERE. La projection 4 (8 spectateurs) a été supprimée."
  },
  {
    id: 14, num: 14, time: 162.667, chapter: 2, type: "sql",
    enonce: "Avec jointure : supprimer les lignes de JOUER correspondant aux films du réalisateur « Scorsese ».",
    refs: [
      "DELETE j FROM jouer j, film f, realisateur r WHERE j.idFilm = f.idFilm AND f.idReal = r.idReal AND r.nom = 'Scorsese';",
      "DELETE FROM jouer WHERE idFilm IN (SELECT f.idFilm FROM film f, realisateur r WHERE f.idReal = r.idReal AND r.nom = 'Scorsese');"
    ],
    resultat: {
      colonnes: ["nb_lignes_jouer"],
      lignes: [[8]]
    },
    explication: "Les lignes de JOUER liées aux films de Scorsese (idReal = 2 : « Les Infiltrés », « Shutter Island ») sont supprimées. Il reste 8 lignes dans JOUER."
  },
  {
    id: 15, num: 15, time: 171.417, chapter: 2, type: "sql",
    enonce: "Avec sous-requête : supprimer les acteurs qui n'ont joué dans aucun film.",
    refs: [
      "DELETE FROM acteur WHERE idActeur NOT IN (SELECT idActeur FROM jouer);",
      "DELETE FROM acteur WHERE NOT EXISTS (SELECT * FROM jouer j WHERE j.idActeur = acteur.idActeur);"
    ],
    resultat: {
      colonnes: ["idActeur", "nom", "prenom"],
      lignes: [
        [1, "DiCaprio", "Leonardo"], [2, "Bale", "Christian"], [3, "Ledger", "Heath"],
        [4, "Dujardin", "Jean"], [5, "McConaughey", "Matthew"]
      ]
    },
    explication: "À ce stade de la série, tous les acteurs insérés ont joué dans au moins un film : aucune suppression n'intervient ici. (Les acteurs sans film, Cotillard et Hathaway, sont ajoutés plus tard dans la préparation de la Partie 3.)"
  },
  /* ================= Chapitre 3 — Requêtes SELECT ================= */
  {
    id: 16, num: 16, time: 177.583, chapter: 3, type: "sql",
    enonce: "Afficher les films triés par année (ordre décroissant), puis par titre (ordre croissant).",
    refs: ["SELECT * FROM film ORDER BY annee DESC, titre ASC;"],
    resultat: {
      colonnes: ["idFilm", "titre", "genre", "annee", "duree", "budget", "idReal"],
      lignes: [
        [2, "Interstellar", "Blockbuster", 2014, 169, 165000000, 1],
        [1, "Inception", "Blockbuster", 2010, 148, 160000000, 1],
        [5, "Shutter Island", "Thriller", 2010, 138, 80000000, 2],
        [3, "The Dark Knight", "Blockbuster", 2008, 152, 185000000, 1],
        [4, "Les Infiltrés", "Action", 2006, 151, 90000000, 2],
        [6, "OSS 117", "Comédie", 2006, 99, 14000000, 3],
        [7, "Tenet", "Action", NULL, NULL, 0, 1]
      ]
    },
    explication: "ORDER BY annee DESC, titre ASC trie d'abord par année décroissante, puis, à année égale, par titre croissant (« Inception » avant « Shutter Island » en 2010)."
  },
  {
    id: 17, num: 17, time: 187.000, chapter: 3, type: "sql",
    enonce: "Afficher le titre de chaque film avec le nom et le prénom de son réalisateur.",
    refs: ["SELECT f.titre, r.nom, r.prenom FROM film f, realisateur r WHERE f.idReal = r.idReal;"],
    resultat: {
      colonnes: ["titre", "nom", "prenom"],
      lignes: [
        ["Inception", "Nolan", "Christopher"], ["Interstellar", "Nolan", "Christopher"],
        ["The Dark Knight", "Nolan", "Christopher"], ["Les Infiltrés", "Scorsese", "Martin"],
        ["Shutter Island", "Scorsese", "Martin"], ["OSS 117", "Hazanavicius", "Michel"],
        ["Tenet", "Nolan", "Christopher"]
      ]
    },
    explication: "Jointure implicite entre FILM et REALISATEUR via la clé étrangère f.idReal = r.idReal."
  },
  {
    id: 18, num: 18, time: 193.167, chapter: 3, type: "sql",
    enonce: "Afficher le nom de l'acteur, le titre du film, le rôle et le cachet.",
    refs: ["SELECT a.nom, f.titre, j.role, j.cachet FROM acteur a, film f, jouer j WHERE j.idActeur = a.idActeur AND j.idFilm = f.idFilm ORDER BY f.titre;"],
    resultat: {
      colonnes: ["nom", "titre", "role", "cachet"],
      lignes: [
        ["DiCaprio", "Inception", "Dom Cobb", 20000.00], ["Ledger", "Inception", "Arthur", 4950.00],
        ["Dujardin", "Inception", "Eames", 4400.00], ["McConaughey", "Interstellar", "Cooper", 15000.00],
        ["Bale", "OSS 117", "Agent Moreau", 990.00], ["Dujardin", "OSS 117", "Hubert Bonisseur", 1650.00],
        ["Bale", "The Dark Knight", "Bruce Wayne", 14400.00], ["Ledger", "The Dark Knight", "Joker", 3960.00]
      ]
    },
    explication: "Jointure à trois tables (ACTEUR, FILM, JOUER) avec tri sur le titre du film."
  },
  {
    id: 19, num: 19, time: 199.417, chapter: 3, type: "sql",
    enonce: "Afficher les acteurs ayant joué dans un film de « Nolan » avec un cachet supérieur à 10000.",
    refs: ["SELECT DISTINCT a.nom, a.prenom FROM acteur a, jouer j, film f, realisateur r WHERE j.idActeur = a.idActeur AND j.idFilm = f.idFilm AND f.idReal = r.idReal AND r.nom = 'Nolan' AND j.cachet > 10000;"],
    resultat: {
      colonnes: ["nom", "prenom"],
      lignes: [["DiCaprio", "Leonardo"], ["McConaughey", "Matthew"], ["Bale", "Christian"]]
    },
    explication: "Filtre combiné sur le réalisateur (r.nom = 'Nolan') et le cachet (&gt; 10000). DISTINCT évite les doublons quand un acteur joue plusieurs rôles dans les films de Nolan."
  },
  {
    id: 20, num: 20, time: 207.917, chapter: 3, type: "sql",
    enonce: "Afficher le nombre de films par genre.",
    refs: ["SELECT genre, COUNT(*) AS nbFilms FROM film GROUP BY genre;"],
    resultat: {
      colonnes: ["genre", "nbFilms"],
      lignes: [["Action", 2], ["Blockbuster", 3], ["Comédie", 1], ["Thriller", 1]]
    },
    explication: "GROUP BY genre agrège les lignes par genre ; COUNT(*) compte les films de chaque groupe."
  },
  {
    id: 21, num: 21, time: 214.083, chapter: 3, type: "sql",
    enonce: "Afficher le cachet moyen par film.",
    refs: ["SELECT f.titre, ROUND(AVG(j.cachet), 2) AS cachetMoyen FROM film f, jouer j WHERE f.idFilm = j.idFilm GROUP BY f.idFilm, f.titre;"],
    resultat: {
      colonnes: ["titre", "cachetMoyen"],
      lignes: [["Inception", 9783.33], ["Interstellar", 15000.00], ["The Dark Knight", 9180.00], ["OSS 117", 1320.00]]
    },
    explication: "ROUND(AVG(j.cachet), 2) calcule la moyenne des cachets par film, arrondie à 2 décimales. Le GROUP BY porte sur f.idFilm, f.titre."
  },
  {
    id: 22, num: 22, time: 218.667, chapter: 3, type: "sql",
    enonce: "Afficher les réalisateurs ayant réalisé plus de 3 films.",
    refs: ["SELECT r.nom, r.prenom, COUNT(*) AS nbFilms FROM realisateur r, film f WHERE r.idReal = f.idReal GROUP BY r.idReal, r.nom, r.prenom HAVING COUNT(*) > 3;"],
    resultat: {
      colonnes: ["nom", "prenom", "nbFilms"],
      lignes: [["Nolan", "Christopher", 4]]
    },
    explication: "HAVING filtre les groupes après l'agrégation : seuls les réalisateurs avec plus de 3 films sont affichés (Nolan : 4 films)."
  },
  {
    id: 23, num: 23, time: 224.500, chapter: 3, type: "sql",
    enonce: "Afficher les acteurs dont le cachet total est supérieur à 50000. <span style='color:#c0392b;'>(Seuil abaissé à 15000 dans ce corrigé, car le jeu de test est réduit.)</span>",
    refs: ["SELECT a.nom, a.prenom, SUM(j.cachet) AS cachetTotal FROM acteur a, jouer j WHERE a.idActeur = j.idActeur GROUP BY a.idActeur, a.nom, a.prenom HAVING SUM(j.cachet) > 15000;"],
    resultat: {
      colonnes: ["nom", "prenom", "cachetTotal"],
      lignes: [["DiCaprio", "Leonardo", 20000.00], ["Bale", "Christian", 15390.00]]
    },
    note: "Seuil utilisé dans le corrigé : 15000 (au lieu de 50000).",
    explication: "SUM(j.cachet) additionne les cachets de chaque acteur ; HAVING filtre les groupes dont le total dépasse le seuil."
  },
  {
    id: 24, num: 24, time: 231.833, chapter: 3, type: "sql",
    enonce: "Afficher, par genre et par réalisateur, le budget maximal, à condition qu'il dépasse 100 000 000.",
    refs: ["SELECT f.genre, r.nom, MAX(f.budget) AS budgetMax FROM film f, realisateur r WHERE f.idReal = r.idReal GROUP BY f.genre, r.nom HAVING MAX(f.budget) > 100000000;"],
    resultat: {
      colonnes: ["genre", "nom", "budgetMax"],
      lignes: [["Blockbuster", "Nolan", 185000000]]
    },
    explication: "GROUP BY f.genre, r.nom crée un groupe par couple (genre, réalisateur) ; HAVING MAX(f.budget) &gt; 100000000 ne retient que « Blockbuster / Nolan » (185 000 000)."
  },
  {
    id: 25, num: 25, time: 240.333, chapter: 3, type: "sql",
    enonce: "Auto-requête (auto-jointure) : ajouter à ACTEUR la colonne idParrain (l'acteur qui a introduit le débutant dans le métier). Afficher chaque acteur avec le nom de son parrain.",
    refs: [
      "ALTER TABLE acteur ADD idParrain INT, ADD FOREIGN KEY (idParrain) REFERENCES acteur(idActeur);",
      "UPDATE acteur SET idParrain = 1 WHERE idActeur IN (2, 5);",
      "UPDATE acteur SET idParrain = 2 WHERE idActeur = 3;",
      "SELECT a.nom AS acteur, p.nom AS parrain FROM acteur a, acteur p WHERE a.idParrain = p.idActeur;"
    ],
    resultat: {
      colonnes: ["acteur", "parrain"],
      lignes: [["Bale", "DiCaprio"], ["Ledger", "Bale"], ["McConaughey", "DiCaprio"]]
    },
    explication: "Auto-jointure : la table ACTEUR est utilisée deux fois, une fois pour l'acteur (a) et une fois pour son parrain (p), reliés par a.idParrain = p.idActeur."
  },
  {
    id: 26, num: 26, time: 255.167, chapter: 3, type: "sql",
    enonce: "Afficher les couples de films du même réalisateur (sans doublons ni couple (x, x)).",
    refs: ["SELECT f1.titre AS film1, f2.titre AS film2, r.nom AS realisateur FROM film f1, film f2, realisateur r WHERE f1.idReal = f2.idReal AND f1.idFilm &lt; f2.idFilm AND f1.idReal = r.idReal;"],
    resultat: {
      colonnes: ["film1", "film2", "realisateur"],
      lignes: [
        ["Inception", "Interstellar", "Nolan"], ["Inception", "The Dark Knight", "Nolan"],
        ["Inception", "Tenet", "Nolan"], ["Interstellar", "The Dark Knight", "Nolan"],
        ["Interstellar", "Tenet", "Nolan"], ["The Dark Knight", "Tenet", "Nolan"],
        ["Les Infiltrés", "Shutter Island", "Scorsese"]
      ]
    },
    explication: "La condition f1.idFilm &lt; f2.idFilm élimine les doublons symétriques et les couples (x, x)."
  },
  {
    id: 27, num: 27, time: 265.333, chapter: 3, type: "sql",
    enonce: "Afficher les acteurs ayant la même date de naissance qu'un autre acteur.",
    refs: ["SELECT DISTINCT a1.nom, a1.prenom, a1.dateNaiss FROM acteur a1, acteur a2 WHERE a1.dateNaiss = a2.dateNaiss AND a1.idActeur &lt;> a2.idActeur;"],
    resultat: {
      colonnes: ["nom", "prenom", "dateNaiss"],
      lignes: [["Bale", "Christian", "1974-11-11"], ["DiCaprio", "Leonardo", "1974-11-11"]]
    },
    explication: "Auto-jointure avec exclusion de soi-même (a1.idActeur &lt;> a2.idActeur) pour détecter les dates de naissance partagées."
  },
  {
    id: 28, num: 28, time: 271.167, chapter: 3, type: "sql",
    enonce: "Afficher les films dont la durée dépasse la durée moyenne de tous les films.",
    refs: [
      "SELECT titre, duree FROM film WHERE duree > (SELECT AVG(duree) FROM film);",
      "SELECT f.titre, f.duree FROM film f, (SELECT AVG(duree) AS dureeMoyenne FROM film) AS t WHERE f.duree > t.dureeMoyenne;"
    ],
    resultat: {
      colonnes: ["titre", "duree"],
      lignes: [["Inception", 148], ["Interstellar", 169], ["The Dark Knight", 152], ["Les Infiltrés", 151]]
    },
    explication: "La sous-requête (SELECT AVG(duree) FROM film) calcule la durée moyenne de référence (~147,6 min) ; seuls les films au-dessus sont affichés."
  },
  {
    id: 29, num: 29, time: 278.917, chapter: 3, type: "sql",
    enonce: "Afficher les acteurs ayant joué dans au moins un film du genre « Comédie » (IN).",
    refs: ["SELECT nom, prenom FROM acteur WHERE idActeur IN (SELECT j.idActeur FROM jouer j, film f WHERE j.idFilm = f.idFilm AND f.genre = 'Comédie');"],
    resultat: {
      colonnes: ["nom", "prenom"],
      lignes: [["Bale", "Christian"], ["Dujardin", "Jean"]]
    },
    explication: "La sous-requête retourne les idActeur des distributions de films « Comédie » ; le test IN vérifie l'appartenance."
  },
  {
    id: 30, num: 30, time: 286.833, chapter: 3, type: "sql",
    enonce: "Afficher les acteurs n'ayant joué dans aucun film (NOT IN ou NOT EXISTS).",
    refs: [
      "SELECT nom, prenom FROM acteur a WHERE NOT EXISTS (SELECT * FROM jouer j WHERE j.idActeur = a.idActeur);",
      "SELECT nom, prenom FROM acteur WHERE idActeur NOT IN (SELECT idActeur FROM jouer);"
    ],
    resultat: {
      colonnes: ["nom", "prenom"],
      lignes: [["Cotillard", "Marion"], ["Hathaway", "Anne"]]
    },
    note: "Résultat affiché après la préparation du jeu de données complémentaire (ajout de Cotillard et Hathaway).",
    explication: "NOT IN / NOT EXISTS sélectionnent les acteurs absents de la table JOUER."
  },
  {
    id: 31, num: 31, time: 294.083, chapter: 3, type: "sql",
    enonce: "Afficher l'acteur ayant le cachet le plus élevé dans le film « Inception ».",
    refs: ["SELECT a.nom, a.prenom, j.cachet FROM acteur a, jouer j, film f WHERE a.idActeur = j.idActeur AND j.idFilm = f.idFilm AND f.titre = 'Inception' AND j.cachet = (SELECT MAX(j2.cachet) FROM jouer j2, film f2 WHERE j2.idFilm = f2.idFilm AND f2.titre = 'Inception');"],
    resultat: {
      colonnes: ["nom", "prenom", "cachet"],
      lignes: [["DiCaprio", "Leonardo", 20000.00]]
    },
    explication: "La sous-requête (SELECT MAX(j2.cachet)...) détermine le cachet maximum du film, et la requête externe en retourne l'acteur détenteur."
  },
  {
    id: 32, num: 32, time: 300.917, chapter: 3, type: "sql",
    enonce: "Afficher les films dont le nombre d'acteurs est supérieur au nombre moyen d'acteurs par film.",
    refs: ["SELECT f.titre, COUNT(*) AS nbActeurs FROM film f, jouer j WHERE f.idFilm = j.idFilm GROUP BY f.idFilm, f.titre HAVING COUNT(*) &gt; (SELECT AVG(nb) FROM (SELECT COUNT(*) AS nb FROM jouer GROUP BY idFilm) AS t);"],
    resultat: {
      colonnes: ["titre", "nbActeurs"],
      lignes: [["Inception", 3]]
    },
    explication: "Le nombre moyen d'acteurs par film est calculé par une table dérivée (moyenne des comptages par idFilm). Seuls « Inception » (3 acteurs) dépasse cette moyenne."
  },
  {
    id: 33, num: 33, time: 308.167, chapter: 3, type: "sql",
    enonce: "Afficher les acteurs nés en 1980.",
    refs: ["SELECT nom, prenom, dateNaiss FROM acteur WHERE YEAR(dateNaiss) = 1980;"],
    resultat: {
      colonnes: ["nom", "prenom", "dateNaiss"],
      lignes: [["Hathaway", "Anne", "1980-11-12"]]
    },
    explication: "YEAR(dateNaiss) extrait l'année de la date de naissance pour la comparaison."
  },
  {
    id: 34, num: 34, time: 313.083, chapter: 3, type: "sql",
    enonce: "Afficher le nom et l'âge de chaque acteur (TIMESTAMPDIFF).",
    refs: ["SELECT nom, TIMESTAMPDIFF(YEAR, dateNaiss, CURDATE()) AS age FROM acteur;"],
    resultat: {
      colonnes: ["nom", "age"],
      lignes: [
        ["DiCaprio", 51], ["Bale", 51], ["Ledger", 47], ["Dujardin", 54],
        ["McConaughey", 56], ["Cotillard", 51], ["Hathaway", 45]
      ]
    },
    note: "Résultats donnés pour CURDATE() = 01/11/2026.",
    explication: "TIMESTAMPDIFF(YEAR, dateNaiss, CURDATE()) calcule l'âge révolu en années à la date du jour."
  },
  {
    id: 35, num: 35, time: 319.583, chapter: 3, type: "sql",
    enonce: "Afficher les projections programmées entre le 01/11/2026 et le 31/12/2026.",
    refs: ["SELECT f.titre, p.salle, p.dateProj FROM film f, projection p WHERE f.idFilm = p.idFilm AND p.dateProj BETWEEN '2026-11-01' AND '2026-12-31' ORDER BY p.dateProj;"],
    resultat: {
      colonnes: ["titre", "salle", "dateProj"],
      lignes: [["OSS 117", "Salle 3", "2026-11-15"], ["Interstellar", "Salle 1", "2026-12-05"]]
    },
    explication: "BETWEEN '2026-11-01' AND '2026-12-31' retient les dates comprises dans l'intervalle (bornes incluses)."
  },
  {
    id: 36, num: 36, time: 328.500, chapter: 3, type: "sql",
    enonce: "Afficher le nombre de projections par mois (MONTH, GROUP BY).",
    refs: ["SELECT MONTH(dateProj) AS mois, COUNT(*) AS nbProjections FROM projection GROUP BY MONTH(dateProj);"],
    resultat: {
      colonnes: ["mois", "nbProjections"],
      lignes: [[9, 1], [10, 4], [11, 1], [12, 1]]
    },
    explication: "MONTH(dateProj) extrait le numéro du mois ; GROUP BY regroupe les projections par mois."
  },
  {
    id: 37, num: 37, time: 332.917, chapter: 3, type: "sql",
    enonce: "Afficher les acteurs nés un mois de juillet.",
    refs: ["SELECT nom, prenom, dateNaiss FROM acteur WHERE MONTH(dateNaiss) = 7;"],
    resultat: {
      colonnes: ["nom", "prenom", "dateNaiss"],
      lignes: [["Cotillard", "Marion", "1975-07-30"]]
    },
    explication: "MONTH(dateNaiss) = 7 sélectionne les naissances survenues en juillet."
  },
  {
    id: 38, num: 38, time: 337.917, chapter: 3, type: "sql",
    enonce: "Afficher les projections des 30 derniers jours (CURDATE(), DATE_SUB).",
    refs: ["SELECT f.titre, p.dateProj FROM film f, projection p WHERE f.idFilm = p.idFilm AND p.dateProj BETWEEN DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND CURDATE() ORDER BY p.dateProj;"],
    resultat: {
      colonnes: ["titre", "dateProj"],
      lignes: [["Inception", "2026-10-03"], ["Interstellar", "2026-10-10"], ["The Dark Knight", "2026-10-24"], ["Shutter Island", "2026-10-31"]]
    },
    note: "Résultats donnés pour CURDATE() = 01/11/2026 (fenêtre : 02/10/2026 à 01/11/2026).",
    explication: "DATE_SUB(CURDATE(), INTERVAL 30 DAY) borne la fenêtre des 30 derniers jours à partir de la date du jour."
  },
  {
    id: 39, num: 39, time: 342.833, chapter: 3, type: "sql",
    enonce: "Afficher le jour de la semaine de chaque projection (DAYNAME).",
    refs: ["SELECT f.titre, p.dateProj, DAYNAME(p.dateProj) AS jour FROM film f, projection p WHERE f.idFilm = p.idFilm ORDER BY p.dateProj;"],
    resultat: {
      colonnes: ["titre", "dateProj", "jour"],
      lignes: [
        ["Inception", "2026-09-20", "dimanche"], ["Inception", "2026-10-03", "samedi"],
        ["Interstellar", "2026-10-10", "samedi"], ["The Dark Knight", "2026-10-24", "samedi"],
        ["Shutter Island", "2026-10-31", "samedi"], ["OSS 117", "2026-11-15", "dimanche"],
        ["Interstellar", "2026-12-05", "samedi"]
      ]
    },
    note: "Noms de jours en français (locale du serveur MariaDB du corrigé).",
    explication: "DAYNAME(p.dateProj) retourne le nom du jour de la semaine de chaque projection."
  },
  /* ================= Chapitre 4 — Contraintes, DEFAULT et clés étrangères ================= */
  {
    id: 40, num: 40, time: 347.500, chapter: 4, type: "sql",
    enonce: "Ajouter à la table FILM une colonne <b>paysOrigine</b> (VARCHAR(30)) obligatoire, avec la valeur par défaut « Inconnue ».<br>" +
            "La table contient déjà des films. Afficher l'identifiant, le titre et le pays d'origine.",
    refs: [
      "ALTER TABLE film ADD paysOrigine VARCHAR(30) NOT NULL DEFAULT 'Inconnue';",
      "SELECT idFilm, titre, paysOrigine FROM film ORDER BY idFilm;"
    ],
    resultat: {
      colonnes: ["idFilm", "titre", "paysOrigine"],
      lignes: [
        [1, "Inception", "Inconnue"], [2, "Interstellar", "Inconnue"], [3, "The Dark Knight", "Inconnue"],
        [4, "Les Infiltrés", "Inconnue"], [5, "Shutter Island", "Inconnue"], [6, "OSS 117", "Inconnue"],
        [7, "Tenet", "Inconnue"]
      ]
    },
    explication: "DEFAULT fournit une valeur quand aucune n'est donnée à l'insertion. Lorsqu'une colonne avec DEFAULT est ajoutée à une table déjà remplie, les lignes existantes reçoivent également cette valeur par défaut."
  },
  {
    id: 41, num: 41, time: 363.917, chapter: 4, type: "sql",
    enonce: "Remplacer la valeur par défaut de <b>paysOrigine</b> par « Tunisie », puis insérer un film sans préciser cette colonne.<br>" +
            "Afficher les deux films concernés (« Inception » et « Film test »).",
    refs: [
      "ALTER TABLE film ALTER paysOrigine SET DEFAULT 'Tunisie';",
      "INSERT INTO film (titre, genre, idReal) VALUES ('Film test', 'Drame', 1);",
      "SELECT titre, paysOrigine FROM film WHERE titre IN ('Inception', 'Film test') ORDER BY titre;"
    ],
    resultat: {
      colonnes: ["titre", "paysOrigine"],
      lignes: [["Film test", "Tunisie"], ["Inception", "Inconnue"]]
    },
    explication: "Modifier un DEFAULT ne remplace pas les valeurs déjà enregistrées : la nouvelle valeur s'applique uniquement aux insertions futures qui omettent la colonne."
  },
  {
    id: 42, num: 42, time: 375.500, chapter: 4, type: "sql",
    enonce: "Rendre la colonne <b>nationalite</b> obligatoire dans ACTEUR. Pour observer le problème, placez volontairement NULL sur une ligne, puis tentez la modification.<br>" +
            "1) UPDATE acteur SET nationalite = NULL WHERE idActeur = 8;<br>" +
            "2) ALTER TABLE acteur MODIFY nationalite VARCHAR(30) NOT NULL;<br>" +
            "3) Corrigez les données puis relancez l'ALTER TABLE.<br>" +
            "Afficher la ligne de l'acteur idActeur = 8.",
    refs: [
      "UPDATE acteur SET nationalite = NULL WHERE idActeur = 8;",
      "UPDATE acteur SET nationalite = 'Non precisee' WHERE nationalite IS NULL;",
      "ALTER TABLE acteur MODIFY nationalite VARCHAR(30) NOT NULL;",
      "SELECT idActeur, nom, nationalite FROM acteur WHERE idActeur = 8;"
    ],
    resultat: {
      colonnes: ["idActeur", "nom", "nationalite"],
      lignes: [[8, "Hathaway", "Non precisee"]]
    },
    explication: "Une colonne ne peut pas devenir NOT NULL tant qu'une ligne contient encore NULL. Il faut d'abord corriger les anciennes lignes (UPDATE), puis appliquer l'ALTER TABLE. Le message d'erreur exact peut varier selon le mode SQL de MariaDB."
  },
  {
    id: 43, num: 43, time: 387.500, chapter: 4, type: "sql",
    enonce: "Créer une table de test qui référence FILM. La clé étrangère doit propager automatiquement la modification de idFilm.<br>" +
            "Insérer deux projections, modifier l'identifiant du film 7 en 70, puis afficher la table.",
    refs: [
      "CREATE TABLE projection_test (idProj INT PRIMARY KEY, idFilm INT, salle VARCHAR(20), CONSTRAINT fk_test_film FOREIGN KEY (idFilm) REFERENCES film(idFilm) ON UPDATE CASCADE ON DELETE CASCADE);",
      "INSERT INTO projection_test VALUES (101, 7, 'Salle A'), (102, 1, 'Salle B');",
      "UPDATE film SET idFilm = 70 WHERE idFilm = 7;",
      "SELECT * FROM projection_test ORDER BY idProj;"
    ],
    resultat: {
      colonnes: ["idProj", "idFilm", "salle"],
      lignes: [[101, 70, "Salle A"], [102, 1, "Salle B"]]
    },
    explication: "ON UPDATE CASCADE : quand la clé référencée change dans la table parent FILM, MariaDB reporte automatiquement la modification dans la clé étrangère de la table enfant projection_test (la projection 101 pointe maintenant sur le film 70)."
  },
  {
    id: 44, num: 44, time: 405.833, chapter: 4, type: "sql",
    enonce: "Supprimer le film dont l'identifiant est 70, puis afficher le contenu de projection_test.",
    refs: ["DELETE FROM film WHERE idFilm = 70;", "SELECT * FROM projection_test ORDER BY idProj;"],
    resultat: {
      colonnes: ["idProj", "idFilm", "salle"],
      lignes: [[102, 1, "Salle B"]]
    },
    explication: "ON DELETE CASCADE : la suppression d'une ligne parent dans FILM supprime automatiquement les lignes enfants qui la référencent (projection 101 disparaît ; la projection 102 reste)."
  },
  {
    id: 45, num: 45, time: 414.917, chapter: 4, type: "resultat",
    enonce: "Après les opérations précédentes, exécuter la requête suivante et indiquer les lignes affichées.<br>" +
            "<code style='display:block;margin:8px 0;background:#f4f6f8;padding:10px;border-radius:6px;'>SELECT p.idProj, p.idFilm, f.titre FROM projection_test p, film f WHERE p.idFilm = f.idFilm ORDER BY p.idProj;</code>",
    attendu: ["102", "1", "Inception"],
    resultat: {
      colonnes: ["idProj", "idFilm", "titre"],
      lignes: [[102, 1, "Inception"]]
    },
    explication: "Une seule ligne est affichée. La projection 101 a été supprimée par ON DELETE CASCADE ; la projection 102 référence toujours le film 1 (« Inception »)."
  }
  ];

  var CHAPTERS = [
    { id: 1, title: "LDD – Définition des données", timeStart: 50.583, timeEnd: 93.500, questionIds: [1, 2, 3, 4, 5] },
    { id: 2, title: "LMD – Manipulation des données", timeStart: 93.500, timeEnd: 177.583, questionIds: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15] },
    { id: 3, title: "Requêtes SELECT", timeStart: 177.583, timeEnd: 347.500, questionIds: [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39] },
    { id: 4, title: "Contraintes, DEFAULT et clés étrangères", timeStart: 347.500, timeEnd: 434.167, questionIds: [40, 41, 42, 43, 44, 45] }
  ];

  var VIDEO = {
    src: "assets/video/TD_SQL_Cinema_questions.mp4",
    duration: 434.167,              // timeline de la mission (secondes) = durée réelle vidéo
    loopDuration: 434.167,          // durée réelle du fichier TD_SQL_Cinema_questions.mp4 (pas de boucle)
    poster: null
  };

  return { questions: Q, chapters: CHAPTERS, video: VIDEO };
})();
