/* ==========================================================================
   Atelier d'Animation Pas à Pas — Série 2 : LMD (Jointures, Sous-requêtes,
   GROUP BY, HAVING, UPDATE)
   5 Exercices :
   - Ex 1 : Festival de Musique (Q1 à Q6)
   - Ex 2 : BDDEPEMP - Départements & Employés (Q1 à Q23)
   - Ex 3 : Gestion des Ventes (Q1 à Q3)
   - Ex 4 : Tour de France 2021 (Q1 à Q7)
   - Ex 5 : Gestion des Notes Annuelles (Q1 à Q7)
   Utilisé dans :
   - exercices/sql/Tp2-bd.html
   - exercices/sql/Tp2-Correction-bd.html
   ========================================================================== */
(function () {
  "use strict";

  var EXO_LABELS = {
    1: "Ex 1 • Festival de Musique",
    2: "Ex 2 • BDDEPEMP (Employés)",
    3: "Ex 3 • Gestion des Ventes",
    4: "Ex 4 • Tour de France 2021",
    5: "Ex 5 • Notes Annuelles"
  };

  var REQUETES = [
    // ==================== EXERCICE 1 : FESTIVAL DE MUSIQUE ====================
    {
      exo: 1, q: 1, code: "Ex1-Q1", cat: "Projection simple",
      question: "Ex1 - Q1 : La liste des titres des représentations.",
      tables: ["Representation"],
      sqlLines: [
        "SELECT titre_Rep",
        "FROM Representation;"
      ],
      steps: [
        { activeLines: [1], title: "Étape 1 — Lecture de la table Representation", explain: "Le SGBD parcourt toutes les lignes de la table Representation (Num_Rep, titre_Rep, lieu).", trace: [{ badge: "Table", text: "Representation : (10, 'Symphonie de Carthage', 'Théâtre Municipal'), (20, 'Nuit du Jazz', 'Hammamet')...", status: "info" }] },
        { activeLines: [0, 1], title: "Étape 2 — Projection de la colonne titre_Rep", explain: "SELECT titre_Rep extrait uniquement la colonne contenant les titres des représentations.", trace: [{ badge: "✔ Résultat", text: "Colonne titre_Rep affichée pour toutes les représentations", status: "ok" }], result: { cols: ["titre_Rep"], rows: [["Symphonie de Carthage"], ["Nuit du Jazz"], ["Malouf Tunisien"]] } }
      ]
    },
    {
      exo: 1, q: 2, code: "Ex1-Q2", cat: "Sélection WHERE",
      question: "Ex1 - Q2 : La liste des titres des représentations ayant lieu au « théâtre Municipal ».",
      tables: ["Representation"],
      sqlLines: [
        "SELECT titre_Rep",
        "FROM Representation",
        "WHERE UPPER(lieu) = 'THEATRE MUNICIPAL';"
      ],
      steps: [
        { activeLines: [1], title: "Étape 1 — Lecture de Representation", explain: "On lit chaque ligne de Representation avec son lieu.", trace: [{ badge: "Lecture", text: "Vérification de la colonne lieu", status: "info" }] },
        { activeLines: [1, 2], title: "Étape 2 — Filtrage WHERE sur le lieu", explain: "UPPER(lieu) = 'THEATRE MUNICIPAL' sélectionne les représentations qui se déroulent au Théâtre Municipal sans souci de majuscules/minuscules.", trace: [{ badge: "✔ Gardée", text: "Num_Rep 10 — 'Symphonie de Carthage' (Théâtre Municipal)", status: "ok" }, { badge: "✖ Écartée", text: "Num_Rep 20 — 'Nuit du Jazz' (Hammamet)", status: "no" }] },
        { activeLines: [0, 1, 2], title: "Étape 3 — Affichage de titre_Rep", explain: "On projette uniquement le titre des représentations retenues.", trace: [{ badge: "Résultat", text: "Symphonie de Carthage", status: "ok" }], result: { cols: ["titre_Rep"], rows: [["Symphonie de Carthage"]] } }
      ]
    },
    {
      exo: 1, q: 3, code: "Ex1-Q3", cat: "Jointure WHERE a.x = b.x",
      question: "Ex1 - Q3 : La liste des noms des musiciens et les titres des représentations auxquelles ils participent.",
      tables: ["Musicien", "Representation"],
      sqlLines: [
        "SELECT M.nom, R.titre_Rep",
        "FROM Musicien M, Representation R",
        "WHERE R.Num_Rep = M.Num_Rep;"
      ],
      steps: [
        { activeLines: [1], title: "Étape 1 — Mobilisation de Musicien (M) et Representation (R)", explain: "Le nom du musicien est dans Musicien (M) et le titre du spectacle est dans Representation (R).", trace: [{ badge: "Tables", text: "Musicien M × Representation R", status: "info" }] },
        { activeLines: [1, 2], title: "Étape 2 — Condition de jointure dans WHERE", explain: "WHERE R.Num_Rep = M.Num_Rep relie chaque musicien à la représentation à laquelle il participe.", trace: [{ badge: "✔ Jointure", text: "M.Num_Rep = R.Num_Rep associe chaque musicien à son spectacle", status: "ok" }] },
        { activeLines: [0, 1, 2], title: "Étape 3 — Projection de M.nom et R.titre_Rep", explain: "On affiche le couple (nom du musicien, titre de la représentation).", trace: [{ badge: "Résultat", text: "Liste des musiciens avec leur représentation", status: "ok" }], result: { cols: ["nom", "titre_Rep"], rows: [["Anouar Brahem", "Nuit du Jazz"], ["Sami اللجمي", "Malouf Tunisien"], ["Amine Bouhafa", "Symphonie de Carthage"]] } }
      ]
    },
    {
      exo: 1, q: 4, code: "Ex1-Q4", cat: "Jointure + Condition Date",
      question: "Ex1 - Q4 : La liste des titres des représentations, les lieux et les tarifs du 25/01/2022.",
      tables: ["Programmer", "Representation"],
      sqlLines: [
        "SELECT R.titre_Rep, R.lieu, P.tarif",
        "FROM Programmer P, Representation R",
        "WHERE P.Num_Rep = R.Num_Rep",
        "  AND P.Date = '2022-01-25';"
      ],
      steps: [
        { activeLines: [1, 2], title: "Étape 1 — Jointure entre Programmer (P) et Representation (R)", explain: "P.Num_Rep = R.Num_Rep relie chaque programmation (date et tarif) aux infos de la représentation (titre et lieu).", trace: [{ badge: "Jointure", text: "P.Num_Rep = R.Num_Rep", status: "info" }] },
        { activeLines: [1, 2, 3], title: "Étape 2 — Filtrage sur la date du 25/01/2022", explain: "AND P.Date = '2022-01-25' ne garde que les représentations programmées ce jour-là.", trace: [{ badge: "✔ Gardée", text: "Programmations du 2022-01-25", status: "ok" }] },
        { activeLines: [0, 1, 2, 3], title: "Étape 3 — Projection de titre_Rep, lieu et tarif", explain: "Affiche les 3 colonnes demandées.", trace: [{ badge: "Résultat", text: "Titres, lieux et tarifs du 25/01/2022", status: "ok" }], result: { cols: ["titre_Rep", "lieu", "tarif"], rows: [["Symphonie de Carthage", "Théâtre Municipal", "25"], ["Malouf Tunisien", "Médina", "15"]] } }
      ]
    },
    {
      exo: 1, q: 5, code: "Ex1-Q5", cat: "Agrégation COUNT(*)",
      question: "Ex1 - Q5 : Le nombre des musiciens qui participent à la représentation n°20.",
      tables: ["Musicien"],
      sqlLines: [
        "SELECT COUNT(*) AS nb_musiciens",
        "FROM Musicien",
        "WHERE Num_Rep = 20;"
      ],
      steps: [
        { activeLines: [1, 2], title: "Étape 1 — Sélection des musiciens de la représentation n°20", explain: "Comme Num_Rep est déjà une clé étrangère dans la table Musicien, pas besoin de jointure : on filtre directement WHERE Num_Rep = 20.", trace: [{ badge: "Filtre", text: "Lignes de Musicien où Num_Rep = 20", status: "info" }] },
        { activeLines: [0, 1, 2], title: "Étape 2 — Comptage avec COUNT(*)", explain: "COUNT(*) compte le nombre de musiciens retenus.", trace: [{ badge: "✔ COUNT(*)", text: "nb_musiciens = 4", status: "ok" }], result: { cols: ["nb_musiciens"], rows: [["4"]] } }
      ]
    },
    {
      exo: 1, q: 6, code: "Ex1-Q6", cat: "Jointure + Comparaison",
      question: "Ex1 - Q6 : Les représentations et leurs dates dont le tarif ne dépasse pas 20 DT.",
      tables: ["Representation", "Programmer"],
      sqlLines: [
        "SELECT R.Num_Rep, R.titre_Rep, P.Date",
        "FROM Representation R, Programmer P",
        "WHERE R.Num_Rep = P.Num_Rep",
        "  AND P.tarif <= 20;"
      ],
      steps: [
        { activeLines: [1, 2], title: "Étape 1 — Jointure Representation et Programmer", explain: "R.Num_Rep = P.Num_Rep relie chaque représentation à ses dates et tarifs de programmation.", trace: [{ badge: "Jointure", text: "R.Num_Rep = P.Num_Rep", status: "info" }] },
        { activeLines: [1, 2, 3], title: "Étape 2 — Condition tarif <= 20", explain: "« Ne dépasse pas 20 DT » se traduit par P.tarif <= 20.", trace: [{ badge: "✔ Gardée", text: "Malouf Tunisien (tarif = 15 <= 20)", status: "ok" }, { badge: "✖ Écartée", text: "Symphonie de Carthage (tarif = 25 > 20)", status: "no" }] },
        { activeLines: [0, 1, 2, 3], title: "Étape 3 — Affichage des représentations et dates", explain: "On affiche Num_Rep, titre_Rep et Date.", trace: [{ badge: "Résultat", text: "Représentations à tarif <= 20 DT", status: "ok" }], result: { cols: ["Num_Rep", "titre_Rep", "Date"], rows: [["30", "Malouf Tunisien", "2022-01-25"]] } }
      ]
    },

    // ==================== EXERCICE 2 : BDDEPEMP ====================
    {
      exo: 2, q: 1, code: "Ex2-Q1", cat: "LDD : CREATE DATABASE & TABLE",
      question: "Ex2 - Q1 : Créer la BD BDDEPEMP ainsi que les tables Départements (DEPT) et Employés (EMP).",
      tables: ["DEPT", "EMP"],
      sqlLines: [
        "CREATE DATABASE BDDEPEMP;",
        "USE BDDEPEMP;",
        "CREATE TABLE DEPT (",
        "    DNO INT PRIMARY KEY,",
        "    DNOM VARCHAR(30) NOT NULL,",
        "    DIR INT,",
        "    VILLE VARCHAR(30)",
        ");",
        "CREATE TABLE EMP (",
        "    ENO INT PRIMARY KEY,",
        "    ENOM VARCHAR(30) NOT NULL,",
        "    PROF VARCHAR(30),",
        "    DATEEMB DATE,",
        "    SAL DECIMAL(10,2),",
        "    COMM DECIMAL(10,2),",
        "    DNO INT REFERENCES DEPT(DNO)",
        ");"
      ],
      steps: [
        { activeLines: [0, 1, 2, 3, 4, 5, 6, 7], title: "Étape 1 — Création de la base BDDEPEMP et de la table mère DEPT", explain: "DEPT contient DNO (clé primaire), DNOM, DIR et VILLE.", trace: [{ badge: "🔑 DEPT", text: "DNO INT PRIMARY KEY", status: "ok" }] },
        { activeLines: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], title: "Étape 2 — Création de la table fille EMP", explain: "EMP contient ENO (clé primaire), ENOM, PROF, DATEEMB, SAL, COMM et la clé étrangère DNO vers DEPT(DNO).", trace: [{ badge: "🔑 EMP", text: "ENO PRIMARY KEY + DNO REFERENCES DEPT(DNO)", status: "ok" }], result: { cols: ["Table", "Clé Primaire", "Colonnes"], rows: [["DEPT", "DNO", "DNO, DNOM, DIR, VILLE"], ["EMP", "ENO", "ENO, ENOM, PROF, DATEEMB, SAL, COMM, DNO#"]] } }
      ]
    },
    {
      exo: 2, q: 2, code: "Ex2-Q2", cat: "LMD : INSERT INTO",
      question: "Ex2 - Q2 : Insérer les lignes spécifiées dans les tables Départements et Employés.",
      tables: ["DEPT", "EMP"],
      sqlLines: [
        "INSERT INTO DEPT VALUES (1, 'COMMERCIAL', 10, 'Sousse');",
        "INSERT INTO DEPT VALUES (2, 'PRODUCTION', 20, 'Tunis');",
        "INSERT INTO DEPT VALUES (3, 'DEVELOPPEMENT', 30, 'Sfax');",
        "INSERT INTO EMP VALUES (10, 'Ali', 'Ingenieur', '2020-03-15', 2500, 500, 1);",
        "INSERT INTO EMP VALUES (20, 'Sonia', 'Technicien', '2021-06-10', 1800, NULL, 2);",
        "INSERT INTO EMP VALUES (30, 'Karim', 'Analyste', '2019-01-20', 2800, 2200, 3);"
      ],
      steps: [
        { activeLines: [0, 1, 2], title: "Étape 1 — Insertion dans la table mère DEPT d'abord", explain: "On insère d'abord les départements (1, 2, 3) pour respecter l'intégrité référentielle.", trace: [{ badge: "DEPT", text: "3 départements insérés : COMMERCIAL, PRODUCTION, DEVELOPPEMENT", status: "ok" }] },
        { activeLines: [0, 1, 2, 3, 4, 5], title: "Étape 2 — Insertion des employés dans EMP", explain: "On insère ensuite les employés en rattachant chacun à un DNO existant.", trace: [{ badge: "EMP", text: "Ali (COMM=500), Sonia (COMM=NULL), Karim (COMM=2200)", status: "ok" }], result: { cols: ["ENO", "ENOM", "PROF", "SAL", "COMM", "DNO"], rows: [["10", "Ali", "Ingenieur", "2500", "500", "1"], ["20", "Sonia", "Technicien", "1800", "NULL", "2"], ["30", "Karim", "Analyste", "2800", "2200", "3"]] } }
      ]
    },
    {
      exo: 2, q: 3, code: "Ex2-Q3", cat: "IS NOT NULL",
      question: "Ex2 - Q3 : Donnez la liste des employés ayant une commission.",
      tables: ["EMP"],
      sqlLines: [
        "SELECT *",
        "FROM Employes",
        "WHERE COMM IS NOT NULL;"
      ],
      steps: [
        { activeLines: [1, 2], title: "Étape 1 — Test de non-nullité avec IS NOT NULL", explain: "En SQL, on ne teste jamais la valeur NULL avec != NULL, mais toujours avec IS NOT NULL.", trace: [{ badge: "✔ Gardés", text: "Ali (COMM = 500), Karim (COMM = 2200)", status: "ok" }, { badge: "✖ Écartée", text: "Sonia (COMM IS NULL)", status: "no" }] },
        { activeLines: [0, 1, 2], title: "Étape 2 — Affichage des employés retenus", explain: "Affiche toutes les colonnes des employés qui touchent une commission.", trace: [{ badge: "Résultat", text: "2 employés avec commission", status: "ok" }], result: { cols: ["ENO", "ENOM", "PROF", "SAL", "COMM", "DNO"], rows: [["10", "Ali", "Ingenieur", "2500", "500", "1"], ["30", "Karim", "Analyste", "2800", "2200", "3"]] } }
      ]
    },
    {
      exo: 2, q: 4, code: "Ex2-Q4", cat: "ORDER BY multiple",
      question: "Ex2 - Q4 : Donnez les noms, emplois et salaires des employés par emploi croissant, et pour chaque emploi, par salaire décroissant.",
      tables: ["EMP"],
      sqlLines: [
        "SELECT ENOM, PROF, SAL",
        "FROM Employes",
        "ORDER BY PROF ASC, SAL DESC;"
      ],
      steps: [
        { activeLines: [0, 1], title: "Étape 1 — Sélection des colonnes ENOM, PROF et SAL", explain: "On extrait le nom, la profession et le salaire de chaque employé.", trace: [{ badge: "Colonnes", text: "ENOM, PROF, SAL", status: "info" }] },
        { activeLines: [0, 1, 2], title: "Étape 2 — Tri sur PROF ASC puis SAL DESC", explain: "Les employés sont triés par ordre alphabétique d'emploi (PROF ASC) ; à emploi identique, le salaire le plus élevé apparaît en premier (SAL DESC).", trace: [{ badge: "Tri", text: "Analyste (2800) ➔ Ingenieur (2500) ➔ Technicien (1800)", status: "ok" }], result: { cols: ["ENOM", "PROF", "SAL"], rows: [["Karim", "Analyste", "2800"], ["Ali", "Ingenieur", "2500"], ["Sonia", "Technicien", "1800"]] } }
      ]
    },
    {
      exo: 2, q: 5, code: "Ex2-Q5", cat: "Agrégation AVG()",
      question: "Ex2 - Q5 : Donnez le salaire moyen des employés.",
      tables: ["EMP"],
      sqlLines: [
        "SELECT AVG(SAL) AS salaire_moyen",
        "FROM Employes;"
      ],
      steps: [
        { activeLines: [0, 1], title: "Calcul de la moyenne globale des salaires AVG(SAL)", explain: "AVG(SAL) additionne tous les salaires et divise par le nombre d'employés : (2500 + 1800 + 2800) / 3 = 2366.67.", trace: [{ badge: "✔ AVG(SAL)", text: "(2500 + 1800 + 2800) / 3 = 2366.67", status: "ok" }], result: { cols: ["salaire_moyen"], rows: [["2366.67"]] } }
      ]
    },
    {
      exo: 2, q: 6, code: "Ex2-Q6", cat: "GROUP BY + MAX()",
      question: "Ex2 - Q6 : Donnez les numéros de département et leur salaire maximum.",
      tables: ["EMP"],
      sqlLines: [
        "SELECT DNO, MAX(SAL) AS sal_max",
        "FROM Employes",
        "GROUP BY DNO;"
      ],
      steps: [
        { activeLines: [1, 2], title: "Étape 1 — Regroupement des employés par département (GROUP BY DNO)", explain: "Les employés sont rassemblés par numéro de département DNO.", trace: [{ badge: "Groupes", text: "DNO 1, DNO 2, DNO 3", status: "info" }] },
        { activeLines: [0, 1, 2], title: "Étape 2 — Recherche du maximum MAX(SAL) dans chaque département", explain: "MAX(SAL) retourne le plus haut salaire au sein de chaque groupe DNO.", trace: [{ badge: "Résultat", text: "DNO 1 : 2500 | DNO 2 : 1800 | DNO 3 : 2800", status: "ok" }], result: { cols: ["DNO", "sal_max"], rows: [["1", "2500"], ["2", "1800"], ["3", "2800"]] } }
      ]
    },
    {
      exo: 2, q: 7, code: "Ex2-Q7", cat: "Sous-requête IN (DNO, MAX(SAL))",
      question: "Ex2 - Q7 : Donner les noms des employés ayant le salaire maximum de chaque département.",
      tables: ["EMP"],
      sqlLines: [
        "SELECT ENOM",
        "FROM EMP",
        "WHERE (DNO, SAL) IN (",
        "    SELECT DNO, MAX(SAL)",
        "    FROM EMP",
        "    GROUP BY DNO",
        ");"
      ],
      steps: [
        { activeLines: [3, 4, 5], title: "Étape 1 — Sous-requête : couple (DNO, salaire max) par département", explain: "La sous-requête calcule le salaire maximal de chaque département : (1, 2500), (2, 1800), (3, 2800).", trace: [{ badge: "Sous-requête", text: "{ (1, 2500), (2, 1800), (3, 2800) }", status: "info" }] },
        { activeLines: [0, 1, 2, 3, 4, 5, 6], title: "Étape 2 — Filtrage des employés dont (DNO, SAL) appartient à cette liste", explain: "Seuls les employés dont le département et le salaire correspondent au maximum de leur département sont affichés.", trace: [{ badge: "✔ Retenus", text: "Ali (DNO 1, 2500), Sonia (DNO 2, 1800), Karim (DNO 3, 2800)", status: "ok" }], result: { cols: ["ENOM"], rows: [["Ali"], ["Sonia"], ["Karim"]] } }
      ]
    },
    {
      exo: 2, q: 8, code: "Ex2-Q8", cat: "GROUP BY + AVG()",
      question: "Ex2 - Q8 : Donnez les différentes professions et leur salaire moyen.",
      tables: ["EMP"],
      sqlLines: [
        "SELECT PROF, AVG(SAL) AS sal_moyen",
        "FROM Employes",
        "GROUP BY PROF;"
      ],
      steps: [
        { activeLines: [1, 2], title: "Étape 1 — Regroupement par profession (GROUP BY PROF)", explain: "On forme un groupe par profession distincte.", trace: [{ badge: "Groupes", text: "Analyste, Ingenieur, Technicien", status: "info" }] },
        { activeLines: [0, 1, 2], title: "Étape 2 — Calcul de AVG(SAL) par profession", explain: "On calcule le salaire moyen de chaque profession.", trace: [{ badge: "Résultat", text: "Moyenne affichée pour chaque profession", status: "ok" }], result: { cols: ["PROF", "sal_moyen"], rows: [["Analyste", "2800.00"], ["Ingenieur", "2500.00"], ["Technicien", "1800.00"]] } }
      ]
    },
    {
      exo: 2, q: 9, code: "Ex2-Q9", cat: "Jointure + Sous-requête IN",
      question: "Ex2 - Q9 : Donner les noms des employés du département COMMERCIAL embauchés le même jour qu'un employé du département PRODUCTION.",
      tables: ["EMP", "DEPT"],
      sqlLines: [
        "SELECT EMP.ENOM",
        "FROM EMP, DEPT",
        "WHERE EMP.DNO = DEPT.DNO",
        "  AND DEPT.DNOM = 'COMMERCIAL'",
        "  AND EMP.DATEEMB IN (",
        "      SELECT E2.DATEEMB",
        "      FROM EMP E2, DEPT D2",
        "      WHERE E2.DNO = D2.DNO AND D2.DNOM = 'PRODUCTION'",
        "  );"
      ],
      steps: [
        { activeLines: [5, 6, 7], title: "Étape 1 — Sous-requête : dates d'embauche du département PRODUCTION", explain: "La sous-requête joint EMP et DEPT pour extraire toutes les DATEEMB des employés du département 'PRODUCTION'.", trace: [{ badge: "Sous-requête", text: "Liste des DATEEMB du département PRODUCTION", status: "info" }] },
        { activeLines: [0, 1, 2, 3, 4, 5, 6, 7, 8], title: "Étape 2 — Requête principale : employés de COMMERCIAL ayant l'une de ces dates", explain: "La requête externe sélectionne les employés du département 'COMMERCIAL' dont DATEEMB figure dans la liste retournée.", trace: [{ badge: "✔ Résultat", text: "Employés de COMMERCIAL embauchés à la même date", status: "ok" }], result: { cols: ["ENOM"], rows: [["Ali"]] } }
      ]
    },
    {
      exo: 2, q: 10, code: "Ex2-Q10", cat: "Sous-requête < ALL / MIN()",
      question: "Ex2 - Q10 : Donner les noms des employés embauchés avant tous les employés du département 1.",
      tables: ["EMP"],
      sqlLines: [
        "SELECT ENOM",
        "FROM EMP",
        "WHERE DATEEMB < ALL (",
        "    SELECT DATEEMB FROM EMP WHERE DNO = 1",
        ");"
      ],
      steps: [
        { activeLines: [3], title: "Étape 1 — Sous-requête : dates d'embauche du département 1", explain: "On récupère les dates d'embauche des employés où DNO = 1 (on peut aussi utiliser < (SELECT MIN(DATEEMB) FROM EMP WHERE DNO = 1)).", trace: [{ badge: "Sous-requête", text: "Dates d'embauche du DNO 1 : ['2020-03-15']", status: "info" }] },
        { activeLines: [0, 1, 2, 3, 4], title: "Étape 2 — Comparaison DATEEMB < ALL (...)", explain: "Karim (embauché le 2019-01-20) a été embauché avant le 2020-03-15.", trace: [{ badge: "✔ Gardé", text: "Karim ('2019-01-20' < '2020-03-15')", status: "ok" }], result: { cols: ["ENOM"], rows: [["Karim"]] } }
      ]
    },
    {
      exo: 2, q: 11, code: "Ex2-Q11", cat: "Jointure + Sous-requête multi-colonnes",
      question: "Ex2 - Q11 : Donner les noms des employés ayant le même emploi et le même directeur que 'Ali'.",
      tables: ["EMP", "DEPT"],
      sqlLines: [
        "SELECT E.ENOM",
        "FROM EMP E, DEPT D",
        "WHERE E.DNO = D.DNO",
        "  AND (E.PROF, D.DIR) = (",
        "      SELECT E2.PROF, D2.DIR",
        "      FROM EMP E2, DEPT D2",
        "      WHERE E2.DNO = D2.DNO AND UPPER(E2.ENOM) = 'ALI'",
        "  );"
      ],
      steps: [
        { activeLines: [4, 5, 6], title: "Étape 1 — Sous-requête : profession et directeur de 'Ali'", explain: "En joignant EMP et DEPT, la sous-requête trouve le couple (PROF, DIR) de l'employé 'Ali'.", trace: [{ badge: "Sous-requête", text: "Ali ➔ (PROF = 'Ingenieur', DIR = 10)", status: "info" }] },
        { activeLines: [0, 1, 2, 3, 4, 5, 6, 7], title: "Étape 2 — Sélection des employés ayant ce même couple (PROF, DIR)", explain: "La requête principale affiche les employés partageant ce même emploi et ce même directeur.", trace: [{ badge: "✔ Résultat", text: "Employés ayant même emploi et même directeur qu'Ali", status: "ok" }], result: { cols: ["ENOM"], rows: [["Ali"]] } }
      ]
    },
    {
      exo: 2, q: 12, code: "Ex2-Q12", cat: "IS NOT NULL",
      question: "Ex2 - Q12 : Donner la liste des employés ayant une commission.",
      tables: ["EMP"],
      sqlLines: [
        "SELECT *",
        "FROM EMP",
        "WHERE COMM IS NOT NULL;"
      ],
      steps: [
        { activeLines: [0, 1, 2], title: "Filtrage WHERE COMM IS NOT NULL", explain: "Retourne tous les employés dont la colonne COMM contient une valeur non nulle.", trace: [{ badge: "✔ Résultat", text: "Ali et Karim (COMM IS NOT NULL)", status: "ok" }], result: { cols: ["ENO", "ENOM", "PROF", "SAL", "COMM", "DNO"], rows: [["10", "Ali", "Ingenieur", "2500", "500", "1"], ["30", "Karim", "Analyste", "2800", "2200", "3"]] } }
      ]
    },
    {
      exo: 2, q: 13, code: "Ex2-Q13", cat: "ORDER BY PROF ASC, SAL DESC",
      question: "Ex2 - Q13 : Donner les noms, emplois et salaires des employés par emploi croissant et, pour chaque emploi, par salaire décroissant.",
      tables: ["EMP"],
      sqlLines: [
        "SELECT ENOM, PROF, SAL",
        "FROM EMP",
        "ORDER BY PROF ASC, SAL DESC;"
      ],
      steps: [
        { activeLines: [0, 1, 2], title: "Tri par PROF croissant puis SAL décroissant", explain: "ORDER BY PROF ASC, SAL DESC classe d'abord par profession de A à Z, puis du plus grand au plus petit salaire.", trace: [{ badge: "✔ Trié", text: "Karim (Analyste, 2800), Ali (Ingenieur, 2500), Sonia (Technicien, 1800)", status: "ok" }], result: { cols: ["ENOM", "PROF", "SAL"], rows: [["Karim", "Analyste", "2800"], ["Ali", "Ingenieur", "2500"], ["Sonia", "Technicien", "1800"]] } }
      ]
    },
    {
      exo: 2, q: 14, code: "Ex2-Q14", cat: "Agrégation AVG(SAL)",
      question: "Ex2 - Q14 : Donner le salaire moyen des employés.",
      tables: ["EMP"],
      sqlLines: [
        "SELECT AVG(SAL) AS 'SALAIRE MOYEN'",
        "FROM EMP;"
      ],
      steps: [
        { activeLines: [0, 1], title: "Calcul du salaire moyen avec alias", explain: "AVG(SAL) calcule la moyenne arithmétique de la colonne SAL.", trace: [{ badge: "✔ Résultat", text: "SALAIRE MOYEN = 2366.67", status: "ok" }], result: { cols: ["SALAIRE MOYEN"], rows: [["2366.67"]] } }
      ]
    },
    {
      exo: 2, q: 15, code: "Ex2-Q15", cat: "Jointure + COUNT(*)",
      question: "Ex2 - Q15 : Donner le nombre d'employés du département PRODUCTION.",
      tables: ["EMP", "DEPT"],
      sqlLines: [
        "SELECT COUNT(*) AS nb_employes",
        "FROM EMP, DEPT",
        "WHERE EMP.DNO = DEPT.DNO",
        "  AND DEPT.DNOM = 'PRODUCTION';"
      ],
      steps: [
        { activeLines: [1, 2, 3], title: "Étape 1 — Jointure EMP et DEPT + filtre DNOM = 'PRODUCTION'", explain: "Le nom du département ('PRODUCTION') est dans DEPT, les employés sont dans EMP. On joint par EMP.DNO = DEPT.DNO.", trace: [{ badge: "✔ Filtre", text: "Employés rattachés au département PRODUCTION", status: "ok" }] },
        { activeLines: [0, 1, 2, 3], title: "Étape 2 — Comptage COUNT(*)", explain: "COUNT(*) compte les employés retenus.", trace: [{ badge: "Résultat", text: "nb_employes = 1", status: "ok" }], result: { cols: ["nb_employes"], rows: [["1"]] } }
      ]
    },
    {
      exo: 2, q: 16, code: "Ex2-Q16", cat: "GROUP BY DNO + MAX(SAL)",
      question: "Ex2 - Q16 : Les numéros de département et leur salaire maximum.",
      tables: ["EMP"],
      sqlLines: [
        "SELECT DNO, MAX(SAL)",
        "FROM EMP",
        "GROUP BY DNO;"
      ],
      steps: [
        { activeLines: [0, 1, 2], title: "Regroupement par DNO et calcul de MAX(SAL)", explain: "Pour chaque numéro de département DNO, MAX(SAL) affiche le salaire le plus élevé.", trace: [{ badge: "✔ GROUP BY", text: "1 ligne par DNO avec son salaire maximal", status: "ok" }], result: { cols: ["DNO", "MAX(SAL)"], rows: [["1", "2500"], ["2", "1800"], ["3", "2800"]] } }
      ]
    },
    {
      exo: 2, q: 17, code: "Ex2-Q17", cat: "GROUP BY PROF + AVG(SAL)",
      question: "Ex2 - Q17 : Les professions et leur salaire moyen.",
      tables: ["EMP"],
      sqlLines: [
        "SELECT PROF, AVG(SAL)",
        "FROM EMP",
        "GROUP BY PROF;"
      ],
      steps: [
        { activeLines: [0, 1, 2], title: "Regroupement par PROF et calcul de AVG(SAL)", explain: "Affiche chaque profession accompagnée de son salaire moyen.", trace: [{ badge: "✔ GROUP BY", text: "Moyenne des salaires par profession", status: "ok" }], result: { cols: ["PROF", "AVG(SAL)"], rows: [["Analyste", "2800.00"], ["Ingenieur", "2500.00"], ["Technicien", "1800.00"]] } }
      ]
    },
    {
      exo: 2, q: 18, code: "Ex2-Q18", cat: "GROUP BY + ORDER BY / MIN",
      question: "Ex2 - Q18 : Le salaire moyen le plus bas (par profession).",
      tables: ["EMP"],
      sqlLines: [
        "SELECT AVG(SAL) AS sal_moy_min",
        "FROM EMP",
        "GROUP BY PROF",
        "ORDER BY sal_moy_min ASC",
        "LIMIT 1;"
      ],
      steps: [
        { activeLines: [0, 1, 2], title: "Étape 1 — Calcul des salaires moyens par profession", explain: "GROUP BY PROF calcule AVG(SAL) pour chaque profession (1800, 2500, 2800).", trace: [{ badge: "Moyennes", text: "Technicien: 1800 | Ingenieur: 2500 | Analyste: 2800", status: "info" }] },
        { activeLines: [0, 1, 2, 3, 4], title: "Étape 2 — Extraction de la plus basse moyenne", explain: "En triant par moyenne croissante (ou via MIN(AVG(SAL)) en Oracle / sous-requête), on obtient 1800.", trace: [{ badge: "✔ Minimum", text: "1800.00", status: "ok" }], result: { cols: ["sal_moy_min"], rows: [["1800.00"]] } }
      ]
    },
    {
      exo: 2, q: 19, code: "Ex2-Q19", cat: "GROUP BY + HAVING",
      question: "Ex2 - Q19 : Donnez le ou les emplois ayant le salaire moyen le plus bas, ainsi que leur salaire moyen.",
      tables: ["EMP"],
      sqlLines: [
        "SELECT PROF, AVG(SAL) AS sal_moy",
        "FROM EMP",
        "GROUP BY PROF",
        "HAVING AVG(SAL) <= ALL (",
        "    SELECT AVG(SAL) FROM EMP GROUP BY PROF",
        ");"
      ],
      steps: [
        { activeLines: [4], title: "Étape 1 — Sous-requête : liste des salaires moyens par profession", explain: "La sous-requête calcule la moyenne de chaque profession : { 2800, 2500, 1800 }.", trace: [{ badge: "Sous-requête", text: "Moyennes par profession : 2800, 2500, 1800", status: "info" }] },
        { activeLines: [0, 1, 2, 3, 4, 5], title: "Étape 2 — Filtrage du groupe minimal avec HAVING", explain: "HAVING AVG(SAL) <= ALL (...) (ou = (SELECT MIN(AVG(SAL))...)) ne conserve que la profession ayant la moyenne la plus basse.", trace: [{ badge: "✔ Retenu", text: "Technicien — 1800.00", status: "ok" }], result: { cols: ["PROF", "sal_moy"], rows: [["Technicien", "1800.00"]] } }
      ]
    },
    {
      exo: 2, q: 20, code: "Ex2-Q20", cat: "MONTH() + GROUP BY + SUM()",
      question: "Ex2 - Q20 : Afficher la somme des commissions par mois.",
      tables: ["EMP"],
      sqlLines: [
        "SELECT MONTH(DATEEMB) AS mois, SUM(COMM) AS total_comm",
        "FROM EMP",
        "GROUP BY MONTH(DATEEMB);"
      ],
      steps: [
        { activeLines: [1, 2], title: "Étape 1 — Regroupement par mois avec MONTH(DATEEMB)", explain: "La fonction MONTH(DATEEMB) extrait le numéro du mois (1 à 12) et GROUP BY regroupe les lignes par mois.", trace: [{ badge: "Groupes", text: "Mois 1 (Janvier), Mois 3 (Mars), Mois 6 (Juin)", status: "info" }] },
        { activeLines: [0, 1, 2], title: "Étape 2 — Somme des commissions SUM(COMM) par mois", explain: "SUM(COMM) additionne les commissions de chaque mois.", trace: [{ badge: "✔ Résultat", text: "Mois 1 : 2200 | Mois 3 : 500 | Mois 6 : NULL", status: "ok" }], result: { cols: ["mois", "total_comm"], rows: [["1", "2200"], ["3", "500"], ["6", "NULL"]] } }
      ]
    },
    {
      exo: 2, q: 21, code: "Ex2-Q21", cat: "UPDATE + Sous-requête",
      question: "Ex2 - Q21 : Augmenter tous les salaires du département « Développement » de 10%.",
      tables: ["EMP", "DEPT"],
      sqlLines: [
        "UPDATE EMP",
        "SET SAL = SAL * 1.10",
        "WHERE DNO = (",
        "    SELECT DNO FROM DEPT WHERE UPPER(DNOM) = 'DEVELOPPEMENT'",
        ");"
      ],
      steps: [
        { activeLines: [2, 3, 4], title: "Étape 1 — Sous-requête : trouver le DNO du département Développement", explain: "La sous-requête cherche le numéro DNO correspondant au département 'DEVELOPPEMENT' (DNO = 3).", trace: [{ badge: "Sous-requête", text: "DNOM = 'DEVELOPPEMENT' ➔ DNO = 3", status: "info" }] },
        { activeLines: [0, 1, 2, 3, 4], title: "Étape 2 — Mise à jour SET SAL = SAL * 1.10", explain: "Augmenter un salaire de 10% revient à le multiplier par 1.10 (ou SAL = SAL + SAL * 0.10).", trace: [{ badge: "✔ UPDATE", text: "Karim (DNO 3) : 2800 × 1.10 = 3080", status: "ok" }], result: { cols: ["ENOM", "Ancien SAL", "Nouveau SAL (+10%)"], rows: [["Karim", "2800", "3080"]] } }
      ]
    },
    {
      exo: 2, q: 22, code: "Ex2-Q22", cat: "UPDATE ... WHERE",
      question: "Ex2 - Q22 : Augmenter les salaires des employés ayant une commission supérieure à 2000.",
      tables: ["EMP"],
      sqlLines: [
        "UPDATE EMP",
        "SET SAL = SAL * 1.10",
        "WHERE COMM > 2000;"
      ],
      steps: [
        { activeLines: [0, 1, 2], title: "Filtrage WHERE COMM > 2000 et mise à jour du salaire", explain: "Seuls les employés dont la commission dépasse strictement 2000 voient leur salaire augmenté.", trace: [{ badge: "✔ Modifié", text: "Karim (COMM = 2200 > 2000) : salaire mis à jour", status: "ok" }], result: { cols: ["ENOM", "COMM", "Statut"], rows: [["Karim", "2200", "Salaire augmenté"]] } }
      ]
    },
    {
      exo: 2, q: 23, code: "Ex2-Q23", cat: "UPDATE + CONCAT()",
      question: "Ex2 - Q23 : Changer les noms des villes des départements en ajoutant l'abréviation « TN » (ex : « Sousse » devient « TNSousse »).",
      tables: ["DEPT"],
      sqlLines: [
        "UPDATE DEPT",
        "SET VILLE = CONCAT('TN', VILLE);"
      ],
      steps: [
        { activeLines: [0, 1], title: "Concaténation du préfixe 'TN' avec CONCAT('TN', VILLE)", explain: "Sans clause WHERE, toutes les lignes de la table DEPT sont mises à jour : CONCAT('TN', VILLE) préfixe chaque nom de ville par 'TN'.", trace: [{ badge: "✔ DEPT", text: "'Sousse' ➔ 'TNSousse' | 'Tunis' ➔ 'TNTunis' | 'Sfax' ➔ 'TNSfax'", status: "ok" }], result: { cols: ["DNO", "DNOM", "Nouvelle VILLE"], rows: [["1", "COMMERCIAL", "TNSousse"], ["2", "PRODUCTION", "TNTunis"], ["3", "DEVELOPPEMENT", "TNSfax"]] } }
      ]
    },

    // ==================== EXERCICE 3 : GESTION DES VENTES ====================
    {
      exo: 3, q: 1, code: "Ex3-Q1", cat: "Jointure 3 tables + Date + GROUP BY",
      question: "Ex3 - Q1 : Obtenir le chiffre d'affaires mensuel de l'année en cours.",
      tables: ["Produit", "Vente", "Commande"],
      sqlLines: [
        "SELECT MONTH(C.DateCmd) AS mois, SUM(V.Qte * P.PrixUnitaire) AS CA_mensuel",
        "FROM Produit P, Vente V, Commande C",
        "WHERE P.Ref = V.Ref",
        "  AND V.Ncom = C.Ncom",
        "  AND YEAR(C.DateCmd) = YEAR(NOW())",
        "GROUP BY MONTH(C.DateCmd);"
      ],
      steps: [
        { activeLines: [1, 2, 3, 4], title: "Étape 1 — Jointure des 3 tables et filtre sur l'année en cours", explain: "On relie Produit (PrixUnitaire), Vente (Qte) et Commande (DateCmd) dans WHERE, puis on garde l'année en cours avec YEAR(C.DateCmd) = YEAR(NOW()).", trace: [{ badge: "Jointure", text: "P.Ref = V.Ref AND V.Ncom = C.Ncom", status: "info" }] },
        { activeLines: [0, 1, 2, 3, 4, 5], title: "Étape 2 — Regroupement par mois et somme SUM(Qte * PrixUnitaire)", explain: "GROUP BY MONTH(C.DateCmd) regroupe les ventes par mois et calcule le chiffre d'affaires mensuel.", trace: [{ badge: "✔ CA mensuel", text: "Somme (Qte × PrixUnitaire) calculée pour chaque mois", status: "ok" }], result: { cols: ["mois", "CA_mensuel"], rows: [["1", "14500.00"], ["2", "19200.00"], ["3", "23800.00"]] } }
      ]
    },
    {
      exo: 3, q: 2, code: "Ex3-Q2", cat: "GROUP BY + Sous-requête dans SELECT",
      question: "Ex3 - Q2 : Calculer le taux de vente de chaque produit.",
      tables: ["Vente"],
      sqlLines: [
        "SELECT Ref, SUM(Qte) / (SELECT SUM(Qte) FROM Vente) AS taux_vente",
        "FROM Vente",
        "GROUP BY Ref;"
      ],
      steps: [
        { activeLines: [0], title: "Étape 1 — Sous-requête : quantité totale vendue tous produits confondus", explain: "(SELECT SUM(Qte) FROM Vente) calcule le total global des quantités vendues.", trace: [{ badge: "Total global", text: "SUM(Qte) global = 100 unités", status: "info" }] },
        { activeLines: [0, 1, 2], title: "Étape 2 — Regroupement par produit (GROUP BY Ref) et division", explain: "Pour chaque référence Ref, on divise sa quantité vendue SUM(Qte) par la quantité totale.", trace: [{ badge: "✔ Taux", text: "P01 : 45/100 = 0.45 | P02 : 35/100 = 0.35 | P03 : 20/100 = 0.20", status: "ok" }], result: { cols: ["Ref", "taux_vente"], rows: [["P01", "0.4500"], ["P02", "0.3500"], ["P03", "0.2000"]] } }
      ]
    },
    {
      exo: 3, q: 3, code: "Ex3-Q3", cat: "Jointure + GROUP BY + ORDER BY DESC",
      question: "Ex3 - Q3 : Afficher le produit le plus vendu du mois en cours.",
      tables: ["Produit", "Vente", "Commande"],
      sqlLines: [
        "SELECT P.Ref, P.Designation, SUM(V.Qte) AS tot",
        "FROM Produit P, Vente V, Commande C",
        "WHERE P.Ref = V.Ref",
        "  AND V.Ncom = C.Ncom",
        "  AND MONTH(C.DateCmd) = MONTH(NOW())",
        "  AND YEAR(C.DateCmd) = YEAR(NOW())",
        "GROUP BY P.Ref, P.Designation",
        "ORDER BY tot DESC",
        "LIMIT 1;"
      ],
      steps: [
        { activeLines: [1, 2, 3, 4, 5], title: "Étape 1 — Jointure et filtrage sur le mois en cours", explain: "On relie Produit, Vente et Commande et on filtre les commandes du mois et de l'année en cours.", trace: [{ badge: "Filtre Date", text: "MONTH(DateCmd) = MONTH(NOW()) AND YEAR(DateCmd) = YEAR(NOW())", status: "info" }] },
        { activeLines: [0, 1, 2, 3, 4, 5, 6, 7, 8], title: "Étape 2 — Cumul SUM(V.Qte) par produit et tri décroissant", explain: "On regroupe par produit, on trie par quantité totale décroissante (ORDER BY tot DESC) et on garde le 1er.", trace: [{ badge: "✔ N°1", text: "P01 — Clavier Mécanique (tot = 45)", status: "ok" }], result: { cols: ["Ref", "Designation", "tot"], rows: [["P01", "Clavier Mécanique", "45"]] } }
      ]
    },

    // ==================== EXERCICE 4 : TOUR DE FRANCE 2021 ====================
    {
      exo: 4, q: 1, code: "Ex4-Q1", cat: "Jointure à 3 tables",
      question: "Ex4 - Q1 : Quelle est la composition de l'équipe Festina (Numéro, nom et pays des coureurs) ?",
      tables: ["EQUIPE", "COUREUR", "PAYS"],
      sqlLines: [
        "SELECT B.NumeroCoureur, B.NomCoureur, C.NomPays",
        "FROM EQUIPE A, COUREUR B, PAYS C",
        "WHERE A.CodeEquipe = B.CodeEquipe",
        "  AND B.CodePays = C.CodePays",
        "  AND A.NomEquipe = 'FESTINA';"
      ],
      steps: [
        { activeLines: [1, 2, 3], title: "Étape 1 — Jointure entre EQUIPE (A), COUREUR (B) et PAYS (C)", explain: "On relie COUREUR à EQUIPE via CodeEquipe, et COUREUR à PAYS via CodePays.", trace: [{ badge: "Jointure", text: "A.CodeEquipe = B.CodeEquipe AND B.CodePays = C.CodePays", status: "info" }] },
        { activeLines: [0, 1, 2, 3, 4], title: "Étape 2 — Sélection de l'équipe 'FESTINA' et projection", explain: "On filtre sur A.NomEquipe = 'FESTINA' et on affiche NumeroCoureur, NomCoureur et NomPays.", trace: [{ badge: "✔ FESTINA", text: "Coureurs de l'équipe FESTINA avec leur pays", status: "ok" }], result: { cols: ["NumeroCoureur", "NomCoureur", "NomPays"], rows: [["101", "Richard Virenque", "France"], ["102", "Alex Zülle", "Suisse"]] } }
      ]
    },
    {
      exo: 4, q: 2, code: "Ex4-Q2", cat: "Agrégation SUM()",
      question: "Ex4 - Q2 : Quel est le nombre de kilomètres total du Tour de France 2021 ?",
      tables: ["ETAPE"],
      sqlLines: [
        "SELECT SUM(NbKm) AS total_km",
        "FROM ETAPE;"
      ],
      steps: [
        { activeLines: [0, 1], title: "Somme totale des kilomètres SUM(NbKm)", explain: "SUM(NbKm) additionne la distance de toutes les étapes de la table ETAPE.", trace: [{ badge: "✔ SUM(NbKm)", text: "3414 km au total", status: "ok" }], result: { cols: ["total_km"], rows: [["3414"]] } }
      ]
    },
    {
      exo: 4, q: 3, code: "Ex4-Q3", cat: "Jointure + SUM()",
      question: "Ex4 - Q3 : Quel est le nombre de kilomètres total des étapes de type « Haute Montagne » ?",
      tables: ["ETAPE", "TYPE_ETAPE"],
      sqlLines: [
        "SELECT SUM(A.NbKm) AS km_haute_montagne",
        "FROM ETAPE A, TYPE_ETAPE B",
        "WHERE A.CodeType = B.CodeType",
        "  AND B.LibelleType = 'HAUTE MONTAGNE';"
      ],
      steps: [
        { activeLines: [1, 2, 3], title: "Étape 1 — Jointure ETAPE et TYPE_ETAPE + filtre 'HAUTE MONTAGNE'", explain: "Le libellé 'HAUTE MONTAGNE' est dans TYPE_ETAPE (B), tandis que NbKm est dans ETAPE (A).", trace: [{ badge: "Filtre", text: "Étapes de type HAUTE MONTAGNE uniquement", status: "info" }] },
        { activeLines: [0, 1, 2, 3], title: "Étape 2 — Cumul SUM(A.NbKm)", explain: "Additionne les kilomètres des étapes retenues.", trace: [{ badge: "✔ Résultat", text: "km_haute_montagne = 892 km", status: "ok" }], result: { cols: ["km_haute_montagne"], rows: [["892"]] } }
      ]
    },
    {
      exo: 4, q: 4, code: "Ex4-Q4", cat: "Sous-requête NOT IN",
      question: "Ex4 - Q4 : Quels sont les noms des coureurs qui n'ont pas obtenu de bonifications ?",
      tables: ["COUREUR", "ATTRIBUER_BONIFICATION"],
      sqlLines: [
        "SELECT NomCoureur",
        "FROM COUREUR",
        "WHERE NumeroCoureur NOT IN (",
        "    SELECT NumeroCoureur FROM ATTRIBUER_BONIFICATION",
        ");"
      ],
      steps: [
        { activeLines: [3], title: "Étape 1 — Sous-requête : numéros des coureurs ayant eu une bonification", explain: "La sous-requête liste tous les NumeroCoureur présents dans ATTRIBUER_BONIFICATION.", trace: [{ badge: "Sous-requête", text: "Coureurs avec bonification", status: "info" }] },
        { activeLines: [0, 1, 2, 3, 4], title: "Étape 2 — Exclusion avec NOT IN", explain: "NOT IN sélectionne les coureurs de la table COUREUR qui ne figurent pas dans cette liste.", trace: [{ badge: "✔ Résultat", text: "Coureurs sans aucune bonification", status: "ok" }], result: { cols: ["NomCoureur"], rows: [["David Gaudu"], ["Guillaume Martin"]] } }
      ]
    },
    {
      exo: 4, q: 5, code: "Ex4-Q5", cat: "Jointure + GROUP BY + HAVING + Sous-requête",
      question: "Ex4 - Q5 : Quels sont les noms des coureurs qui ont participé à toutes les étapes ?",
      tables: ["PARTICIPER", "COUREUR", "ETAPE"],
      sqlLines: [
        "SELECT B.NomCoureur",
        "FROM PARTICIPER A, COUREUR B",
        "WHERE A.NumeroCoureur = B.NumeroCoureur",
        "GROUP BY B.NumeroCoureur, B.NomCoureur",
        "HAVING COUNT(*) = (",
        "    SELECT COUNT(*) FROM ETAPE",
        ");"
      ],
      steps: [
        { activeLines: [5], title: "Étape 1 — Sous-requête : nombre total d'étapes du Tour", explain: "(SELECT COUNT(*) FROM ETAPE) renvoie le nombre total d'étapes (ex: 21 étapes).", trace: [{ badge: "Sous-requête", text: "COUNT(*) FROM ETAPE = 21 étapes", status: "info" }] },
        { activeLines: [0, 1, 2, 3, 4, 5, 6], title: "Étape 2 — Regroupement par coureur et HAVING COUNT(*) = 21", explain: "On compte le nombre d'étapes courues par chaque coureur dans PARTICIPER et on garde ceux qui en ont 21.", trace: [{ badge: "✔ Complet", text: "Coureurs ayant participé aux 21 étapes", status: "ok" }], result: { cols: ["NomCoureur"], rows: [["Tadej Pogacar"], ["Jonas Vingegaard"]] } }
      ]
    },
    {
      exo: 4, q: 6, code: "Ex4-Q6", cat: "Jointure + GROUP BY + ORDER BY",
      question: "Ex4 - Q6 : Classement général des coureurs (nom, code équipe, code pays et temps) à l'issue des 13 premières étapes.",
      tables: ["PARTICIPER", "COUREUR"],
      sqlLines: [
        "SELECT B.NomCoureur, B.CodeEquipe, B.CodePays, SUM(A.TempsRealise) AS Total",
        "FROM PARTICIPER A, COUREUR B",
        "WHERE A.NumeroCoureur = B.NumeroCoureur",
        "  AND A.NumeroEtape <= 13",
        "GROUP BY B.NomCoureur, B.CodeEquipe, B.CodePays",
        "ORDER BY Total ASC;"
      ],
      steps: [
        { activeLines: [1, 2, 3], title: "Étape 1 — Jointure et restriction aux 13 premières étapes", explain: "WHERE A.NumeroCoureur = B.NumeroCoureur AND A.NumeroEtape <= 13 sélectionne les participations des étapes 1 à 13.", trace: [{ badge: "Filtre", text: "NumeroEtape <= 13", status: "info" }] },
        { activeLines: [0, 1, 2, 3, 4, 5], title: "Étape 2 — Somme des temps SUM(TempsRealise) et tri croissant", explain: "Le vainqueur est celui qui a le temps cumulé Total le plus faible (ORDER BY Total ASC).", trace: [{ badge: "✔ Classement", text: "Trié du temps le plus court au plus long", status: "ok" }], result: { cols: ["NomCoureur", "CodeEquipe", "CodePays", "Total"], rows: [["Tadej Pogacar", "UAE", "SLO", "52h 14m"], ["Jonas Vingegaard", "JUM", "DAN", "52h 19m"]] } }
      ]
    },
    {
      exo: 4, q: 7, code: "Ex4-Q7", cat: "Jointure 3 tables + GROUP BY + ORDER BY",
      question: "Ex4 - Q7 : Classement par équipe à l'issue des 13 premières étapes (nom et temps des équipes).",
      tables: ["PARTICIPER", "COUREUR", "EQUIPE"],
      sqlLines: [
        "SELECT C.NomEquipe, SUM(A.TempsRealise) AS Total",
        "FROM PARTICIPER A, COUREUR B, EQUIPE C",
        "WHERE A.NumeroCoureur = B.NumeroCoureur",
        "  AND B.CodeEquipe = C.CodeEquipe",
        "  AND A.NumeroEtape <= 13",
        "GROUP BY C.NomEquipe",
        "ORDER BY Total ASC;"
      ],
      steps: [
        { activeLines: [1, 2, 3, 4], title: "Étape 1 — Jointure PARTICIPER, COUREUR et EQUIPE sur les 13 premières étapes", explain: "On relie chaque participation au coureur puis à son équipe, pour NumeroEtape <= 13.", trace: [{ badge: "Jointure", text: "A.NumeroCoureur = B.NumeroCoureur AND B.CodeEquipe = C.CodeEquipe", status: "info" }] },
        { activeLines: [0, 1, 2, 3, 4, 5, 6], title: "Étape 2 — Regroupement par NomEquipe et tri sur Total croissant", explain: "SUM(A.TempsRealise) calcule le temps cumulé de chaque équipe et ORDER BY Total ASC les classe.", trace: [{ badge: "✔ Équipes", text: "Classement général par équipe", status: "ok" }], result: { cols: ["NomEquipe", "Total"], rows: [["UAE Team Emirates", "156h 45m"], ["Jumbo-Visma", "157h 02m"]] } }
      ]
    },

    // ==================== EXERCICE 5 : GESTION DES NOTES ANNUELLES ====================
    {
      exo: 5, q: 1, code: "Ex5-Q1", cat: "Agrégation COUNT(*)",
      question: "Ex5 - Q1 : Quel est le nombre total d'étudiants ?",
      tables: ["ETUDIANT"],
      sqlLines: [
        "SELECT COUNT(*) AS nb_etudiants",
        "FROM ETUDIANT;"
      ],
      steps: [
        { activeLines: [0, 1], title: "Comptage des lignes de la table ETUDIANT", explain: "COUNT(*) compte le nombre total d'étudiants inscrits dans la table ETUDIANT.", trace: [{ badge: "✔ COUNT(*)", text: "nb_etudiants = 30", status: "ok" }], result: { cols: ["nb_etudiants"], rows: [["30"]] } }
      ]
    },
    {
      exo: 5, q: 2, code: "Ex5-Q2", cat: "Agrégation MIN() et MAX()",
      question: "Ex5 - Q2 : Quelles sont, parmi l'ensemble des notes, la note la plus haute et la note la plus basse ?",
      tables: ["EVALUER"],
      sqlLines: [
        "SELECT MIN(Note) AS 'plus basse note', MAX(Note) AS 'plus haute note'",
        "FROM EVALUER;"
      ],
      steps: [
        { activeLines: [0, 1], title: "Calcul simultané de MIN(Note) et MAX(Note)", explain: "Sur la table EVALUER, MIN(Note) trouve la note minimale et MAX(Note) la note maximale.", trace: [{ badge: "✔ Extrêmes", text: "Plus basse note = 6.50 | Plus haute note = 19.25", status: "ok" }], result: { cols: ["plus basse note", "plus haute note"], rows: [["6.50", "19.25"]] } }
      ]
    },
    {
      exo: 5, q: 3, code: "Ex5-Q3", cat: "Jointure 3 tables + GROUP BY",
      question: "Ex5 - Q3 : Quelles sont les moyennes de chaque étudiant dans chacune des matières ?",
      tables: ["EVALUER", "MATIERE", "ETUDIANT"],
      sqlLines: [
        "SELECT E.NEtudiant, M.LibelleMat, AVG(EV.Note) AS MoyEtuMat",
        "FROM EVALUER EV, MATIERE M, ETUDIANT E",
        "WHERE EV.CodeMat = M.CodeMat",
        "  AND EV.NEtudiant = E.NEtudiant",
        "GROUP BY E.NEtudiant, M.LibelleMat;"
      ],
      steps: [
        { activeLines: [1, 2, 3], title: "Étape 1 — Jointure entre EVALUER, MATIERE et ETUDIANT", explain: "On relie chaque note d'évaluation à l'étudiant et à la matière correspondante.", trace: [{ badge: "Jointure", text: "EV.CodeMat = M.CodeMat AND EV.NEtudiant = E.NEtudiant", status: "info" }] },
        { activeLines: [0, 1, 2, 3, 4], title: "Étape 2 — Regroupement par (NEtudiant, LibelleMat) et moyenne AVG(Note)", explain: "GROUP BY E.NEtudiant, M.LibelleMat calcule la moyenne de chaque étudiant dans chaque matière.", trace: [{ badge: "✔ MoyEtuMat", text: "Moyenne par étudiant et par matière", status: "ok" }], result: { cols: ["NEtudiant", "LibelleMat", "MoyEtuMat"], rows: [["E01", "Bases de données", "15.50"], ["E01", "Algorithmique", "14.00"], ["E02", "Bases de données", "12.75"]] } }
      ]
    },
    {
      exo: 5, q: 4, code: "Ex5-Q4", cat: "GROUP BY sur Vue MOYETUMAT",
      question: "Ex5 - Q4 : Quelles sont les moyennes par matière ? (Avec la vue MOYETUMAT de la question 3)",
      tables: ["MOYETUMAT"],
      sqlLines: [
        "SELECT LibelleMat, AVG(MoyEtuMat) AS moy_matiere",
        "FROM MOYETUMAT",
        "GROUP BY LibelleMat;"
      ],
      steps: [
        { activeLines: [0, 1, 2], title: "Regroupement par matière sur la vue MOYETUMAT", explain: "À partir de la vue MOYETUMAT (NEtudiant, LibelleMat, CoeffMat, MoyEtuMat), on regroupe par LibelleMat et on calcule AVG(MoyEtuMat).", trace: [{ badge: "✔ Moyenne matière", text: "Bases de données : 14.12 | Algorithmique : 13.80", status: "ok" }], result: { cols: ["LibelleMat", "moy_matiere"], rows: [["Bases de données", "14.12"], ["Algorithmique", "13.80"]] } }
      ]
    },
    {
      exo: 5, q: 5, code: "Ex5-Q5", cat: "Moyenne pondérée SUM(x*c)/SUM(c)",
      question: "Ex5 - Q5 : Quelle est la moyenne générale de chaque étudiant ? (Avec la vue MOYETUMAT de la question 3)",
      tables: ["MOYETUMAT"],
      sqlLines: [
        "SELECT NEtudiant, SUM(MoyEtuMat * CoeffMat) / SUM(CoeffMat) AS MgEtu",
        "FROM MOYETUMAT",
        "GROUP BY NEtudiant;"
      ],
      steps: [
        { activeLines: [1, 2], title: "Étape 1 — Regroupement par étudiant (GROUP BY NEtudiant)", explain: "On rassemble toutes les moyennes par matière d'un même étudiant.", trace: [{ badge: "Groupe", text: "1 paquet par NEtudiant", status: "info" }] },
        { activeLines: [0, 1, 2], title: "Étape 2 — Calcul de la moyenne pondérée par les coefficients", explain: "La moyenne générale pondérée est la somme des (moyenne × coefficient) divisée par la somme des coefficients : SUM(MoyEtuMat * CoeffMat) / SUM(CoeffMat).", trace: [{ badge: "✔ MgEtu", text: "E01 : 14.85 | E02 : 11.90", status: "ok" }], result: { cols: ["NEtudiant", "MgEtu"], rows: [["E01", "14.85"], ["E02", "11.90"]] } }
      ]
    },
    {
      exo: 5, q: 6, code: "Ex5-Q6", cat: "AVG() sur Vue MGETU",
      question: "Ex5 - Q6 : Quelle est la moyenne générale de la promotion ? (Avec la vue MGETU de la question 5)",
      tables: ["MGETU"],
      sqlLines: [
        "SELECT AVG(MgEtu) AS moy_promotion",
        "FROM MGETU;"
      ],
      steps: [
        { activeLines: [0, 1], title: "Moyenne des moyennes générales AVG(MgEtu)", explain: "AVG(MgEtu) sur la vue MGETU donne la moyenne générale de toute la promotion.", trace: [{ badge: "✔ Promotion", text: "moy_promotion = 13.38", status: "ok" }], result: { cols: ["moy_promotion"], rows: [["13.38"]] } }
      ]
    },
    {
      exo: 5, q: 7, code: "Ex5-Q7", cat: "Sous-requête AVG() sur Vue",
      question: "Ex5 - Q7 : Quels sont les étudiants qui ont une moyenne générale >= à la moyenne générale de la promotion ?",
      tables: ["MGETU"],
      sqlLines: [
        "SELECT NEtudiant, Nom, Prenom, MgEtu",
        "FROM MGETU",
        "WHERE MgEtu >= (",
        "    SELECT AVG(MgEtu) FROM MGETU",
        ");"
      ],
      steps: [
        { activeLines: [3], title: "Étape 1 — Sous-requête : calcul de la moyenne de la promotion", explain: "(SELECT AVG(MgEtu) FROM MGETU) renvoie 13.38.", trace: [{ badge: "Sous-requête", text: "AVG(MgEtu) = 13.38", status: "info" }] },
        { activeLines: [0, 1, 2, 3, 4], title: "Étape 2 — Sélection des étudiants avec MgEtu >= 13.38", explain: "La requête externe garde uniquement les étudiants dont la moyenne générale atteint ou dépasse 13.38.", trace: [{ badge: "✔ Retenu", text: "E01 (MgEtu = 14.85 >= 13.38)", status: "ok" }], result: { cols: ["NEtudiant", "Nom", "Prenom", "MgEtu"], rows: [["E01", "Ben Salah", "Amine", "14.85"]] } }
      ]
    }
  ];

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function injectStyles() {
    if (document.getElementById("tp2-anim-styles")) return;
    var st = document.createElement("style");
    st.id = "tp2-anim-styles";
    st.textContent = [
      ".tp2-anim-wrap{margin:22px 0 28px;border:2px solid #1e3a8a;border-radius:14px;background:linear-gradient(180deg,#0f172a 0%,#172554 100%);color:#f8fafc;box-shadow:0 14px 34px rgba(15,23,42,.24);overflow:hidden;font-family:'Segoe UI',system-ui,sans-serif}",
      ".tp2-anim-head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;padding:14px 18px;background:rgba(15,23,42,.78);border-bottom:1px solid rgba(148,163,184,.22)}",
      ".tp2-anim-title{display:flex;align-items:center;gap:10px;font-weight:800;font-size:1.05rem;color:#f8fafc}",
      ".tp2-anim-badge{background:linear-gradient(135deg,#0284c7,#2563eb);color:#fff;font-size:.76rem;font-weight:800;padding:4px 10px;border-radius:999px;letter-spacing:.03em;text-transform:uppercase}",
      ".tp2-anim-sub{font-size:.83rem;color:#cbd5e1;margin-top:2px}",
      ".tp2-exobar{display:flex;flex-wrap:wrap;gap:8px;padding:10px 16px;background:rgba(15,23,42,.9);border-bottom:1px solid rgba(148,163,184,.18)}",
      ".tp2-exobtn{border:1px solid rgba(148,163,184,.35);background:#1e293b;color:#cbd5e1;font-weight:800;font-size:.8rem;padding:6px 12px;border-radius:999px;cursor:pointer;transition:all .15s}",
      ".tp2-exobtn.active{background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;border-color:#fde68a}",
      ".tp2-qbar{display:flex;flex-wrap:wrap;gap:6px;padding:10px 16px;background:rgba(30,41,59,.75);border-bottom:1px solid rgba(148,163,184,.18)}",
      ".tp2-qbtn{border:1px solid rgba(148,163,184,.32);background:rgba(15,23,42,.7);color:#e2e8f0;font-weight:700;font-size:.78rem;padding:5px 10px;border-radius:8px;cursor:pointer;transition:all .15s}",
      ".tp2-qbtn:hover{border-color:#38bdf8;color:#fff}",
      ".tp2-qbtn.active{background:linear-gradient(135deg,#0284c7,#2563eb);border-color:#7dd3fc;color:#fff;box-shadow:0 4px 12px rgba(2,132,199,.4)}",
      ".tp2-body{padding:16px 18px;display:grid;grid-template-columns:1.1fr 1.2fr;gap:16px}",
      "@media(max-width:920px){.tp2-body{grid-template-columns:1fr}}",
      ".tp2-card{background:rgba(15,23,42,.66);border:1px solid rgba(148,163,184,.22);border-radius:11px;padding:13px 15px}",
      ".tp2-qheader{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}",
      ".tp2-qcat{font-size:.75rem;font-weight:800;padding:3px 9px;border-radius:999px;background:rgba(56,189,248,.16);color:#7dd3fc;border:1px solid rgba(56,189,248,.35)}",
      ".tp2-qtext{font-size:.95rem;font-weight:700;color:#f1f5f9;line-height:1.4;margin-bottom:10px}",
      ".tp2-sqlbox{background:#090d16;border:1px solid rgba(148,163,184,.25);border-radius:9px;padding:10px 12px;font-family:Consolas,'JetBrains Mono',monospace;font-size:.84rem;line-height:1.55;overflow-x:auto}",
      ".tp2-sqlline{padding:2px 8px;border-radius:5px;color:#64748b;transition:all .2s;white-space:pre}",
      ".tp2-sqlline.done{color:#e2e8f0}",
      ".tp2-sqlline.current{background:rgba(2,132,199,.25);border-left:3px solid #38bdf8;color:#fff;font-weight:700}",
      ".tp2-controls{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:12px}",
      ".tp2-cbtn{border:1px solid rgba(148,163,184,.35);background:#1e293b;color:#f8fafc;font-weight:700;font-size:.8rem;padding:7px 12px;border-radius:8px;cursor:pointer;display:inline-flex;align-items:center;gap:5px}",
      ".tp2-cbtn:hover:not(:disabled){background:#334155;border-color:#7dd3fc}",
      ".tp2-cbtn:disabled{opacity:.45;cursor:not-allowed}",
      ".tp2-cbtn.primary{background:linear-gradient(135deg,#059669,#10b981);border-color:#34d399;color:#fff}",
      ".tp2-step-dots{display:flex;gap:6px;margin-left:auto;align-items:center}",
      ".tp2-dot{width:26px;height:26px;border-radius:999px;border:1px solid rgba(148,163,184,.38);background:#0f172a;color:#94a3b8;font-size:.76rem;font-weight:800;cursor:pointer}",
      ".tp2-dot.active{background:#0284c7;color:#fff;border-color:#7dd3fc}",
      ".tp2-dot.done{background:rgba(16,185,129,.22);color:#6ee7b7;border-color:rgba(16,185,129,.5)}",
      ".tp2-step-box{margin-bottom:10px;padding:10px 12px;border-radius:9px;background:rgba(2,132,199,.13);border:1px solid rgba(56,189,248,.3)}",
      ".tp2-step-title{font-weight:800;font-size:.9rem;color:#7dd3fc;margin-bottom:4px}",
      ".tp2-step-exp{font-size:.84rem;color:#e2e8f0;line-height:1.45}",
      ".tp2-trace-list{display:flex;flex-direction:column;gap:6px;margin:10px 0}",
      ".tp2-trace-item{display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:7px;font-size:.82rem;background:rgba(30,41,59,.75);border:1px solid rgba(148,163,184,.2)}",
      ".tp2-trace-item.ok{background:rgba(16,185,129,.14);border-color:rgba(16,185,129,.4);color:#d1fae5}",
      ".tp2-trace-item.no{background:rgba(239,68,68,.13);border-color:rgba(239,68,68,.35);color:#fecaca}",
      ".tp2-trace-item.info{background:rgba(59,130,246,.13);border-color:rgba(59,130,246,.35);color:#dbeafe}",
      ".tp2-tbadge{font-weight:800;font-size:.73rem;padding:2px 7px;border-radius:5px;background:rgba(15,23,42,.65);white-space:nowrap}",
      ".tp2-res-wrap{margin-top:10px;border-top:1px solid rgba(148,163,184,.22);padding-top:10px}",
      ".tp2-res-title{font-size:.78rem;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:#6ee7b7;margin-bottom:6px}",
      ".tp2-res-table{width:100%;border-collapse:collapse;font-size:.8rem;background:#0f172a;border-radius:7px;overflow:hidden}",
      ".tp2-res-table th{background:#1e3a8a;color:#e0f2fe;padding:6px 9px;text-align:left;border:1px solid rgba(148,163,184,.25)}",
      ".tp2-res-table td{padding:5px 9px;border:1px solid rgba(148,163,184,.2);color:#f1f5f9}",
      ".tp2-inline-btn{margin-left:6px;background:linear-gradient(135deg,#0284c7,#2563eb);color:#fff;border:none;border-radius:5px;padding:4px 10px;font-size:.78rem;font-weight:700;cursor:pointer;vertical-align:middle}",
      ".tp2-show-btn{margin-left:6px;background:#2b6cb0;color:#fff;border:none;border-radius:5px;padding:4px 10px;font-size:.78rem;font-weight:700;cursor:pointer;vertical-align:middle}",
      ".tp2-inline-sql{display:none;background:#f7fafc;border:1px solid #cbd5e0;border-left:4px solid #2b6cb0;padding:8px 10px;border-radius:4px;font-family:Consolas,monospace;font-size:.86em;color:#2b6cb0;white-space:pre-wrap;margin:6px 0 10px}",
      ".tp2-global-bar{text-align:center;margin:14px 0}",
      ".tp2-global-btn{background:#2b6cb0;color:#fff;border:none;padding:9px 18px;border-radius:6px;font-weight:700;font-size:.9rem;cursor:pointer}",
      "@media print{.tp2-anim-wrap,.tp2-inline-btn,.tp2-show-btn,.tp2-global-bar{display:none!important}.tp2-inline-sql{display:block!important}}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function buildStudio() {
    injectStyles();

    var wrap = document.createElement("section");
    wrap.className = "tp2-anim-wrap";
    wrap.id = "tp2-anim-studio-mount";
    wrap.innerHTML =
      '<div class="tp2-anim-head">' +
        '<div>' +
          '<div class="tp2-anim-title">' +
            '<span class="tp2-anim-badge">🎬 Animation LMD Pas à Pas</span>' +
            '<span>Studio Interactif de Correction — Série 2 : Les 5 Exercices (46 Requêtes)</span>' +
          '</div>' +
          '<div class="tp2-anim-sub">Jointures dans <code>WHERE</code> (<code>a.x = b.x</code>), Sous-requêtes (<code>IN</code>, <code>NOT IN</code>, <code>ALL</code>), <code>GROUP BY</code>, <code>HAVING</code> et <code>UPDATE</code>.</div>' +
        '</div>' +
      '</div>' +
      '<div class="tp2-exobar" id="tp2-exobar"></div>' +
      '<div class="tp2-qbar" id="tp2-qbar"></div>' +
      '<div class="tp2-body">' +
        '<div class="tp2-card">' +
          '<div class="tp2-qheader">' +
            '<span class="tp2-qcat" id="tp2-qcat"></span>' +
            '<span style="font-size:.78rem;color:#94a3b8;" id="tp2-step-counter"></span>' +
          '</div>' +
          '<div class="tp2-qtext" id="tp2-qtext"></div>' +
          '<div class="tp2-sqlbox" id="tp2-sqlbox"></div>' +
          '<div class="tp2-controls">' +
            '<button type="button" class="tp2-cbtn primary" id="tp2-btn-play">▶ Animer pas à pas</button>' +
            '<button type="button" class="tp2-cbtn" id="tp2-btn-prev">◀ Étape préc.</button>' +
            '<button type="button" class="tp2-cbtn" id="tp2-btn-next">Étape suiv. ▶</button>' +
            '<button type="button" class="tp2-cbtn" id="tp2-btn-reset">⏮ Début</button>' +
            '<button type="button" class="tp2-cbtn" id="tp2-btn-full">⚡ Requête complète</button>' +
            '<button type="button" class="tp2-cbtn" id="tp2-btn-copy">📋 Copier SQL</button>' +
            '<div class="tp2-step-dots" id="tp2-step-dots"></div>' +
          '</div>' +
        '</div>' +
        '<div class="tp2-card">' +
          '<div class="tp2-step-box">' +
            '<div class="tp2-step-title" id="tp2-step-title"></div>' +
            '<div class="tp2-step-exp" id="tp2-step-exp"></div>' +
          '</div>' +
          '<div class="tp2-trace-list" id="tp2-trace-list"></div>' +
          '<div class="tp2-res-wrap" id="tp2-res-wrap"></div>' +
        '</div>' +
      '</div>';

    var firstH2 = document.querySelector("h2");
    if (firstH2 && firstH2.parentNode) {
      firstH2.parentNode.insertBefore(wrap, firstH2);
    } else {
      document.body.appendChild(wrap);
    }

    var state = { qIdx: 0, stepIdx: 0, timer: null };

    function stopAuto() {
      if (state.timer) {
        clearInterval(state.timer);
        state.timer = null;
      }
      var playBtn = document.getElementById("tp2-btn-play");
      if (playBtn) playBtn.textContent = "▶ Animer pas à pas";
    }

    function rebuildQBar() {
      var curExo = REQUETES[state.qIdx].exo;
      var exoBtns = document.querySelectorAll(".tp2-exobtn");
      for (var e = 0; e < exoBtns.length; e++) {
        var bExo = parseInt(exoBtns[e].getAttribute("data-exo"), 10);
        if (bExo === curExo) exoBtns[e].classList.add("active");
        else exoBtns[e].classList.remove("active");
      }

      var qbar = document.getElementById("tp2-qbar");
      qbar.innerHTML = "";
      for (var i = 0; i < REQUETES.length; i++) {
        if (REQUETES[i].exo !== curExo) continue;
        (function (idx) {
          var b = document.createElement("button");
          b.type = "button";
          b.className = "tp2-qbtn" + (idx === state.qIdx ? " active" : "");
          b.textContent = "Q" + REQUETES[idx].q;
          b.title = REQUETES[idx].question;
          b.addEventListener("click", function () {
            stopAuto();
            state.qIdx = idx;
            state.stepIdx = 0;
            render();
          });
          qbar.appendChild(b);
        })(i);
      }
    }

    function render() {
      rebuildQBar();
      var q = REQUETES[state.qIdx];
      var step = q.steps[state.stepIdx];

      document.getElementById("tp2-qcat").textContent = q.code + " • " + q.cat;
      document.getElementById("tp2-step-counter").textContent =
        "Étape " + (state.stepIdx + 1) + " / " + q.steps.length;
      document.getElementById("tp2-qtext").textContent = q.question;

      var sqlBox = document.getElementById("tp2-sqlbox");
      var sqlHtml = "";
      var prevLines = state.stepIdx > 0 ? q.steps[state.stepIdx - 1].activeLines : [];
      for (var l = 0; l < q.sqlLines.length; l++) {
        var isActive = step.activeLines.indexOf(l) !== -1;
        var isNew = isActive && prevLines.indexOf(l) === -1;
        var cls = "tp2-sqlline";
        if (isNew || (state.stepIdx === 0 && isActive)) cls += " current";
        else if (isActive) cls += " done";
        sqlHtml += '<div class="' + cls + '">' + escapeHtml(q.sqlLines[l]) + "</div>";
      }
      sqlBox.innerHTML = sqlHtml;

      var dotsWrap = document.getElementById("tp2-step-dots");
      var dotsHtml = "";
      for (var s = 0; s < q.steps.length; s++) {
        var dCls = "tp2-dot";
        if (s === state.stepIdx) dCls += " active";
        else if (s < state.stepIdx) dCls += " done";
        dotsHtml += '<button type="button" class="' + dCls + '" data-step="' + s + '">' + (s + 1) + "</button>";
      }
      dotsWrap.innerHTML = dotsHtml;
      var dotBtns = dotsWrap.querySelectorAll(".tp2-dot");
      for (var db = 0; db < dotBtns.length; db++) {
        dotBtns[db].addEventListener("click", function () {
          stopAuto();
          state.stepIdx = parseInt(this.getAttribute("data-step"), 10);
          render();
        });
      }

      document.getElementById("tp2-btn-prev").disabled = state.stepIdx === 0;
      document.getElementById("tp2-btn-next").disabled = state.stepIdx === q.steps.length - 1;

      document.getElementById("tp2-step-title").textContent = step.title;
      document.getElementById("tp2-step-exp").textContent = step.explain;

      var traceList = document.getElementById("tp2-trace-list");
      var trHtml = "";
      for (var tr = 0; tr < step.trace.length; tr++) {
        var item = step.trace[tr];
        trHtml +=
          '<div class="tp2-trace-item ' + (item.status || "info") + '">' +
            '<span class="tp2-tbadge">' + escapeHtml(item.badge) + "</span>" +
            '<span>' + escapeHtml(item.text) + "</span>" +
          "</div>";
      }
      traceList.innerHTML = trHtml;

      var resWrap = document.getElementById("tp2-res-wrap");
      if (step.result) {
        var rHtml = '<div class="tp2-res-title">📊 Table Résultat (' + step.result.rows.length + ' ligne' + (step.result.rows.length > 1 ? 's' : '') + ')</div>';
        rHtml += '<table class="tp2-res-table"><thead><tr>';
        for (var rc = 0; rc < step.result.cols.length; rc++) {
          rHtml += "<th>" + escapeHtml(step.result.cols[rc]) + "</th>";
        }
        rHtml += "</tr></thead><tbody>";
        for (var rr = 0; rr < step.result.rows.length; rr++) {
          rHtml += "<tr>";
          for (var rcc = 0; rcc < step.result.rows[rr].length; rcc++) {
            rHtml += "<td>" + escapeHtml(step.result.rows[rr][rcc]) + "</td>";
          }
          rHtml += "</tr>";
        }
        rHtml += "</tbody></table>";
        resWrap.innerHTML = rHtml;
      } else {
        resWrap.innerHTML =
          '<div style="font-size:.8rem;color:#94a3b8;font-style:italic;">⏳ Passez à l\'étape suivante pour voir le résultat final…</div>';
      }
    }

    var exobar = document.getElementById("tp2-exobar");
    for (var ex = 1; ex <= 5; ex++) {
      (function (exoNum) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "tp2-exobtn";
        b.setAttribute("data-exo", exoNum);
        b.textContent = EXO_LABELS[exoNum];
        b.addEventListener("click", function () {
          stopAuto();
          for (var i = 0; i < REQUETES.length; i++) {
            if (REQUETES[i].exo === exoNum) {
              state.qIdx = i;
              state.stepIdx = 0;
              break;
            }
          }
          render();
        });
        exobar.appendChild(b);
      })(ex);
    }

    document.getElementById("tp2-btn-prev").addEventListener("click", function () {
      stopAuto();
      if (state.stepIdx > 0) {
        state.stepIdx--;
        render();
      }
    });

    document.getElementById("tp2-btn-next").addEventListener("click", function () {
      stopAuto();
      var qObj = REQUETES[state.qIdx];
      if (state.stepIdx < qObj.steps.length - 1) {
        state.stepIdx++;
        render();
      }
    });

    document.getElementById("tp2-btn-reset").addEventListener("click", function () {
      stopAuto();
      state.stepIdx = 0;
      render();
    });

    document.getElementById("tp2-btn-full").addEventListener("click", function () {
      stopAuto();
      state.stepIdx = REQUETES[state.qIdx].steps.length - 1;
      render();
    });

    document.getElementById("tp2-btn-play").addEventListener("click", function () {
      if (state.timer) {
        stopAuto();
        return;
      }
      var qObj = REQUETES[state.qIdx];
      if (state.stepIdx >= qObj.steps.length - 1) {
        state.stepIdx = 0;
        render();
      }
      this.textContent = "⏸ Pause";
      state.timer = setInterval(function () {
        var curQ = REQUETES[state.qIdx];
        if (state.stepIdx < curQ.steps.length - 1) {
          state.stepIdx++;
          render();
        } else {
          stopAuto();
        }
      }, 1800);
    });

    document.getElementById("tp2-btn-copy").addEventListener("click", function () {
      var btn = this;
      var sqlText = REQUETES[state.qIdx].sqlLines.join("\n");
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(sqlText).then(function () {
          btn.textContent = "✅ Copié !";
          setTimeout(function () {
            btn.textContent = "📋 Copier SQL";
          }, 1400);
        });
      }
    });

    function openAndAnimate(reqIdx) {
      stopAuto();
      state.qIdx = reqIdx;
      state.stepIdx = 0;
      render();
      var studio = document.getElementById("tp2-anim-studio-mount");
      if (studio && studio.scrollIntoView) {
        studio.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      var playBtn = document.getElementById("tp2-btn-play");
      if (playBtn) playBtn.click();
    }

    // Attacher les boutons sur les 5 listes <ol> des 5 exercices
    var ols = document.querySelectorAll("ol");
    var isEnoncePage = document.querySelectorAll(".sql-block").length === 0;

    if (isEnoncePage && ols.length >= 5) {
      var gBar = document.createElement("div");
      gBar.className = "tp2-global-bar";
      var gBtn = document.createElement("button");
      gBtn.type = "button";
      gBtn.className = "tp2-global-btn";
      gBtn.textContent = "✅ Afficher toutes les réponses SQL";
      gBtn.addEventListener("click", function () {
        var pres = document.querySelectorAll(".tp2-inline-sql");
        var anyHidden = false;
        for (var p = 0; p < pres.length; p++) {
          if (pres[p].style.display !== "block") {
            anyHidden = true;
            break;
          }
        }
        for (var p2 = 0; p2 < pres.length; p2++) {
          pres[p2].style.display = anyHidden ? "block" : "none";
        }
        var sBtns = document.querySelectorAll(".tp2-show-btn");
        for (var sb = 0; sb < sBtns.length; sb++) {
          sBtns[sb].textContent = anyHidden ? "🙈 Masquer" : "👁️ Voir la réponse";
        }
        gBtn.textContent = anyHidden ? "🙈 Masquer toutes les réponses SQL" : "✅ Afficher toutes les réponses SQL";
      });
      gBar.appendChild(gBtn);
      wrap.parentNode.insertBefore(gBar, wrap.nextSibling);
    }

    for (var rIdx = 0; rIdx < REQUETES.length; rIdx++) {
      (function (reqIndex) {
        var req = REQUETES[reqIndex];
        var ol = ols[req.exo - 1];
        if (!ol) return;
        var li = ol.children[req.q - 1];
        if (!li) return;

        var existingBlock = li.querySelector(".sql-block");

        var aBtn = document.createElement("button");
        aBtn.type = "button";
        aBtn.className = "tp2-inline-btn";
        aBtn.textContent = "🎬 Animer " + req.code;

        if (isEnoncePage || !existingBlock) {
          var sBtn = document.createElement("button");
          sBtn.type = "button";
          sBtn.className = "tp2-show-btn";
          sBtn.textContent = "👁️ Voir la réponse";

          var pre = document.createElement("pre");
          pre.className = "tp2-inline-sql";
          pre.textContent = req.sqlLines.join("\n");

          sBtn.addEventListener("click", function () {
            var vis = pre.style.display === "block";
            pre.style.display = vis ? "none" : "block";
            sBtn.textContent = vis ? "👁️ Voir la réponse" : "🙈 Masquer";
          });

          aBtn.addEventListener("click", function () {
            pre.style.display = "block";
            sBtn.textContent = "🙈 Masquer";
            openAndAnimate(reqIndex);
          });

          li.appendChild(sBtn);
          li.appendChild(aBtn);
          li.appendChild(pre);
        } else {
          aBtn.addEventListener("click", function () {
            openAndAnimate(reqIndex);
          });
          li.insertBefore(aBtn, existingBlock);
        }
      })(rIdx);
    }

    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildStudio);
  } else {
    buildStudio();
  }
})();
