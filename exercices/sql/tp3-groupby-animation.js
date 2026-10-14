/* ==========================================================================
   Atelier d'Animation Pas à Pas — Série 3 : LMD (Group By)
   3 Exercices :
   - Ex 1 : Base bdtp5 (Sondage, Question, Participant, Reponse) — Q1 à Q9
   - Ex 2 : Départements & Employés — Q1 à Q7
   - Ex 3 : Gestion des Notes Annuelles — Q1 à Q5
   Utilisé dans : exercices/sql/Tp-GroupBy-bd.html
   ========================================================================== */
(function () {
  "use strict";

  var EXO_LABELS = {
    1: "Ex 1 • Sondage (bdtp5)",
    2: "Ex 2 • Départements & Employés",
    3: "Ex 3 • Notes Annuelles"
  };

  var REQUETES = [
    // ==================== EXERCICE 1 : SONDAGE (bdtp5) ====================
    {
      exo: 1, q: 1, code: "Ex1-Q1", cat: "CREATE + INSERT INTO",
      question: "Ex1 - Q1 : Créer la base bdtp5, ses 4 tables (Sondage, Question, Participant, Reponse) et insérer les lignes dans Sondage et Question.",
      tables: ["Sondage", "Question", "Participant", "Reponse"],
      sqlLines: [
        "CREATE DATABASE bdtp5;",
        "USE bdtp5;",
        "CREATE TABLE Sondage (",
        "    NumS INT AUTO_INCREMENT PRIMARY KEY,",
        "    Theme VARCHAR(50),",
        "    DateDebut DATE",
        ");",
        "CREATE TABLE Question (",
        "    NumQ INT,",
        "    NumS INT REFERENCES Sondage(NumS),",
        "    Contenu VARCHAR(150),",
        "    PRIMARY KEY (NumQ, NumS)",
        ");",
        "CREATE TABLE Participant (",
        "    IdParticipant INT AUTO_INCREMENT PRIMARY KEY,",
        "    Mail VARCHAR(50),",
        "    Mdp VARCHAR(6),",
        "    Genre CHAR(1) CHECK (Genre IN ('M', 'F'))",
        ");",
        "CREATE TABLE Reponse (",
        "    NumQ INT,",
        "    NumS INT,",
        "    IdParticipant INT REFERENCES Participant(IdParticipant),",
        "    Rep CHAR(1) CHECK (Rep IN ('O', 'N', 'S')),",
        "    PRIMARY KEY (NumQ, NumS, IdParticipant)",
        ");",
        "-- a) Insertion dans Sondage :",
        "INSERT INTO Sondage (NumS, Theme, DateDebut) VALUES",
        "(1, 'Les réseaux sociaux', '2026-05-01'),",
        "(2, 'Les jeux vidéo', '2026-06-01');",
        "-- b) Insertion dans Question :",
        "INSERT INTO Question (NumQ, NumS, Contenu) VALUES",
        "(1, 1, 'Les informations partagées sur les réseaux sociaux sont fiables'),",
        "(2, 1, 'L''usage des réseaux sociaux par les enfants doit être sous le contrôle parental'),",
        "(3, 1, 'Les réseaux sociaux deviennent une nécessité pour les citoyens'),",
        "(1, 2, 'Les jeux vidéo contribuent au développement de la pensée logique');"
      ],
      steps: [
        { activeLines: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25], title: "Étape 1 — Création de la base bdtp5 et des 4 tables", explain: "On crée Sondage, Question, Participant et Reponse avec leurs clés primaires et les contraintes CHECK sur Genre ('M','F') et Rep ('O','N','S').", trace: [{ badge: "LDD", text: "4 tables créées dans bdtp5", status: "ok" }] },
        { activeLines: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35], title: "Étape 2 — Insertion des sondages (1, 2) et des 4 questions", explain: "On insère d'abord les 2 sondages dans Sondage (table mère), puis les 4 questions dans Question (table fille).", trace: [{ badge: "✔ Sondage", text: "2 lignes insérées (NumS 1 et 2)", status: "ok" }, { badge: "✔ Question", text: "4 questions insérées", status: "ok" }], result: { cols: ["NumQ", "NumS", "Theme"], rows: [["1, 2, 3", "1", "Les réseaux sociaux"], ["1", "2", "Les jeux vidéo"]] } }
      ]
    },
    {
      exo: 1, q: 2, code: "Ex1-Q2", cat: "Export SQL (phpMyAdmin)",
      question: "Ex1 - Q2 : Exporter la base au format SQL sous le nom bdtp5.sql.",
      tables: ["bdtp5"],
      sqlLines: [
        "-- Dans phpMyAdmin :",
        "-- 1. Sélectionner la base de données 'bdtp5' dans le panneau gauche",
        "-- 2. Cliquer sur l'onglet 'Exporter' en haut",
        "-- 3. Choisir le format 'SQL' puis cliquer sur 'Exécuter' -> génère bdtp5.sql"
      ],
      steps: [
        { activeLines: [0, 1, 2, 3], title: "Procédure d'exportation dans phpMyAdmin", explain: "Dans phpMyAdmin, l'onglet Exporter permet de sauvegarder toute la structure (CREATE TABLE) et les données (INSERT INTO) dans le fichier bdtp5.sql.", trace: [{ badge: "💾 Export", text: "Fichier généré : bdtp5.sql", status: "ok" }], result: { cols: ["Fichier exporté", "Format", "Contenu"], rows: [["bdtp5.sql", "SQL", "Structure + Données de bdtp5"]] } }
      ]
    },
    {
      exo: 1, q: 3, code: "Ex1-Q3", cat: "Projection SELECT",
      question: "Ex1 - Q3 : Afficher les adresses mail et les mots de passe existant dans la base de données.",
      tables: ["Participant"],
      sqlLines: [
        "SELECT Mail, Mdp",
        "FROM Participant;"
      ],
      steps: [
        { activeLines: [0, 1], title: "Projection des colonnes Mail et Mdp de la table Participant", explain: "On sélectionne uniquement les colonnes Mail et Mdp pour tous les participants inscrits.", trace: [{ badge: "✔ SELECT", text: "Affichage de Mail et Mdp de chaque participant", status: "ok" }], result: { cols: ["Mail", "Mdp"], rows: [["amine@sti.tn", "az1234"], ["sarra@sti.tn", "sr5678"], ["yassine@sti.tn", "ys9012"]] } }
      ]
    },
    {
      exo: 1, q: 4, code: "Ex1-Q4", cat: "Jointure + GROUP BY + COUNT(DISTINCT)",
      question: "Ex1 - Q4 : Afficher le nombre total des participants qui ont participé à ce sondage relatif à un thème.",
      tables: ["Sondage", "Reponse"],
      sqlLines: [
        "SELECT S.Theme, COUNT(DISTINCT R.IdParticipant) AS nb_participants",
        "FROM Sondage S, Reponse R",
        "WHERE S.NumS = R.NumS",
        "GROUP BY S.NumS, S.Theme;"
      ],
      steps: [
        { activeLines: [1, 2], title: "Étape 1 — Jointure entre Sondage (S) et Reponse (R)", explain: "On relie chaque réponse à son sondage via S.NumS = R.NumS pour disposer du Theme.", trace: [{ badge: "Jointure", text: "S.NumS = R.NumS", status: "info" }] },
        { activeLines: [0, 1, 2, 3], title: "Étape 2 — Regroupement par thème et COUNT(DISTINCT R.IdParticipant)", explain: "Comme un même participant répond à plusieurs questions d'un même sondage, on utilise COUNT(DISTINCT R.IdParticipant) pour ne le compter qu'une seule fois par thème.", trace: [{ badge: "✔ DISTINCT", text: "Les réseaux sociaux : 3 participants | Les jeux vidéo : 2 participants", status: "ok" }], result: { cols: ["Theme", "nb_participants"], rows: [["Les réseaux sociaux", "3"], ["Les jeux vidéo", "2"]] } }
      ]
    },
    {
      exo: 1, q: 5, code: "Ex1-Q5", cat: "Jointure 3 tables + Genre = 'F'",
      question: "Ex1 - Q5 : Afficher le nombre total des femmes qui ont participé à un sondage relatif à un thème.",
      tables: ["Sondage", "Reponse", "Participant"],
      sqlLines: [
        "SELECT S.Theme, COUNT(DISTINCT P.IdParticipant) AS nb_femmes",
        "FROM Sondage S, Reponse R, Participant P",
        "WHERE S.NumS = R.NumS",
        "  AND R.IdParticipant = P.IdParticipant",
        "  AND P.Genre = 'F'",
        "GROUP BY S.NumS, S.Theme;"
      ],
      steps: [
        { activeLines: [1, 2, 3, 4], title: "Étape 1 — Jointure Sondage, Reponse et Participant + filtre Genre = 'F'", explain: "On relie les 3 tables dans WHERE et on garde uniquement les participantes de genre féminin (P.Genre = 'F').", trace: [{ badge: "Filtre", text: "P.Genre = 'F' (Femmes uniquement)", status: "info" }] },
        { activeLines: [0, 1, 2, 3, 4, 5], title: "Étape 2 — Regroupement par thème et comptage sans doublon", explain: "COUNT(DISTINCT P.IdParticipant) compte le nombre de femmes ayant participé à chaque thème.", trace: [{ badge: "✔ Résultat", text: "Nombre de femmes par thème", status: "ok" }], result: { cols: ["Theme", "nb_femmes"], rows: [["Les réseaux sociaux", "2"], ["Les jeux vidéo", "1"]] } }
      ]
    },
    {
      exo: 1, q: 6, code: "Ex1-Q6", cat: "Jointure 3 tables + Genre = 'M'",
      question: "Ex1 - Q6 : Afficher le nombre total des hommes qui ont participé à un sondage relatif à un thème.",
      tables: ["Sondage", "Reponse", "Participant"],
      sqlLines: [
        "SELECT S.Theme, COUNT(DISTINCT P.IdParticipant) AS nb_hommes",
        "FROM Sondage S, Reponse R, Participant P",
        "WHERE S.NumS = R.NumS",
        "  AND R.IdParticipant = P.IdParticipant",
        "  AND P.Genre = 'M'",
        "GROUP BY S.NumS, S.Theme;"
      ],
      steps: [
        { activeLines: [1, 2, 3, 4], title: "Étape 1 — Jointure des 3 tables + filtre Genre = 'M'", explain: "Même principe que la question 5 mais en filtrant sur le genre masculin P.Genre = 'M'.", trace: [{ badge: "Filtre", text: "P.Genre = 'M' (Hommes uniquement)", status: "info" }] },
        { activeLines: [0, 1, 2, 3, 4, 5], title: "Étape 2 — Comptage COUNT(DISTINCT P.IdParticipant) par thème", explain: "Retourne le nombre d'hommes par thème de sondage.", trace: [{ badge: "✔ Résultat", text: "Nombre d'hommes par thème", status: "ok" }], result: { cols: ["Theme", "nb_hommes"], rows: [["Les réseaux sociaux", "1"], ["Les jeux vidéo", "1"]] } }
      ]
    },
    {
      exo: 1, q: 7, code: "Ex1-Q7", cat: "Pourcentage + Rep = 'O'",
      question: "Ex1 - Q7 : Afficher le pourcentage des internautes ayant répondu 'Oui' relatif à un thème.",
      tables: ["Sondage", "Reponse"],
      sqlLines: [
        "SELECT S.Theme, (COUNT(*) * 100) / (",
        "    SELECT COUNT(*) FROM Reponse R2 WHERE R2.NumS = S.NumS",
        ") AS pct_oui",
        "FROM Sondage S, Reponse R",
        "WHERE S.NumS = R.NumS",
        "  AND R.Rep = 'O'",
        "GROUP BY S.NumS, S.Theme;"
      ],
      steps: [
        { activeLines: [3, 4, 5, 6], title: "Étape 1 — Filtrage des réponses 'Oui' (Rep = 'O') et regroupement par thème", explain: "On joint Sondage et Reponse, on garde R.Rep = 'O' et on regroupe par sondage.", trace: [{ badge: "Filtre", text: "R.Rep = 'O' (Oui)", status: "info" }] },
        { activeLines: [0, 1, 2, 3, 4, 5, 6], title: "Étape 2 — Calcul du pourcentage : (COUNT(*) * 100) / Total réponses du thème", explain: "On divise le nombre de 'Oui' multiplié par 100 par le nombre total de réponses enregistrées pour ce sondage.", trace: [{ badge: "✔ % Oui", text: "Les réseaux sociaux : 66.67% | Les jeux vidéo : 75.00%", status: "ok" }], result: { cols: ["Theme", "pct_oui"], rows: [["Les réseaux sociaux", "66.67"], ["Les jeux vidéo", "75.00"]] } }
      ]
    },
    {
      exo: 1, q: 8, code: "Ex1-Q8", cat: "Pourcentage + Rep = 'N'",
      question: "Ex1 - Q8 : Afficher le pourcentage des internautes ayant répondu 'Non' pour chaque thème.",
      tables: ["Sondage", "Reponse"],
      sqlLines: [
        "SELECT S.Theme, (COUNT(*) * 100) / (",
        "    SELECT COUNT(*) FROM Reponse R2 WHERE R2.NumS = S.NumS",
        ") AS pct_non",
        "FROM Sondage S, Reponse R",
        "WHERE S.NumS = R.NumS",
        "  AND R.Rep = 'N'",
        "GROUP BY S.NumS, S.Theme;"
      ],
      steps: [
        { activeLines: [0, 1, 2, 3, 4, 5, 6], title: "Filtrage R.Rep = 'N' et calcul du pourcentage par thème", explain: "On sélectionne les réponses 'Non' (R.Rep = 'N') et on calcule (COUNT(*) * 100) / total des réponses du thème.", trace: [{ badge: "✔ % Non", text: "Pourcentage de réponses 'Non' par thème", status: "ok" }], result: { cols: ["Theme", "pct_non"], rows: [["Les réseaux sociaux", "22.22"], ["Les jeux vidéo", "25.00"]] } }
      ]
    },
    {
      exo: 1, q: 9, code: "Ex1-Q9", cat: "Pourcentage + Rep = 'S'",
      question: "Ex1 - Q9 : Afficher le pourcentage des internautes ayant répondu 'Sans avis' pour chaque thème.",
      tables: ["Sondage", "Reponse"],
      sqlLines: [
        "SELECT S.Theme, (COUNT(*) * 100) / (",
        "    SELECT COUNT(*) FROM Reponse R2 WHERE R2.NumS = S.NumS",
        ") AS pct_sans_avis",
        "FROM Sondage S, Reponse R",
        "WHERE S.NumS = R.NumS",
        "  AND R.Rep = 'S'",
        "GROUP BY S.NumS, S.Theme;"
      ],
      steps: [
        { activeLines: [0, 1, 2, 3, 4, 5, 6], title: "Filtrage R.Rep = 'S' et calcul du pourcentage par thème", explain: "On sélectionne les réponses 'Sans avis' (R.Rep = 'S') et on divise COUNT(*) * 100 par le total des réponses du sondage.", trace: [{ badge: "✔ % Sans avis", text: "Pourcentage de réponses 'Sans avis' par thème", status: "ok" }], result: { cols: ["Theme", "pct_sans_avis"], rows: [["Les réseaux sociaux", "11.11"]] } }
      ]
    },

    // ==================== EXERCICE 2 : DÉPARTEMENTS & EMPLOYÉS ====================
    {
      exo: 2, q: 1, code: "Ex2-Q1", cat: "IS NOT NULL",
      question: "Ex2 - Q1 : Donnez la liste des employés ayant une commission ?",
      tables: ["Employes"],
      sqlLines: [
        "SELECT *",
        "FROM Employes",
        "WHERE COMM IS NOT NULL;"
      ],
      steps: [
        { activeLines: [0, 1, 2], title: "Filtrage WHERE COMM IS NOT NULL", explain: "Sélectionne tous les employés dont la commission est renseignée (non nulle).", trace: [{ badge: "✔ Retenus", text: "Employés avec COMM IS NOT NULL", status: "ok" }], result: { cols: ["ENO", "ENOM", "PROF", "SAL", "COMM", "DNO"], rows: [["10", "Ali", "Ingenieur", "2500", "500", "1"], ["30", "Karim", "Analyste", "2800", "2200", "3"]] } }
      ]
    },
    {
      exo: 2, q: 2, code: "Ex2-Q2", cat: "ORDER BY PROF ASC, SAL DESC",
      question: "Ex2 - Q2 : Donnez les noms, emplois et salaires des employés par emploi croissant, et pour chaque emploi, par salaire décroissant ?",
      tables: ["Employes"],
      sqlLines: [
        "SELECT ENOM, PROF, SAL",
        "FROM Employes",
        "ORDER BY PROF ASC, SAL DESC;"
      ],
      steps: [
        { activeLines: [0, 1, 2], title: "Tri multi-critères ORDER BY PROF ASC, SAL DESC", explain: "Trie d'abord par profession dans l'ordre alphabétique, puis par salaire décroissant en cas d'égalité de profession.", trace: [{ badge: "✔ Trié", text: "Analyste ➔ Ingenieur ➔ Technicien", status: "ok" }], result: { cols: ["ENOM", "PROF", "SAL"], rows: [["Karim", "Analyste", "2800"], ["Ali", "Ingenieur", "2500"], ["Sonia", "Technicien", "1800"]] } }
      ]
    },
    {
      exo: 2, q: 3, code: "Ex2-Q3", cat: "Agrégation AVG(SAL)",
      question: "Ex2 - Q3 : Donnez le salaire moyen des employés ?",
      tables: ["Employes"],
      sqlLines: [
        "SELECT AVG(SAL) AS salaire_moyen",
        "FROM Employes;"
      ],
      steps: [
        { activeLines: [0, 1], title: "Calcul de la moyenne globale AVG(SAL)", explain: "AVG(SAL) calcule la moyenne des salaires de tous les employés de l'entreprise.", trace: [{ badge: "✔ AVG(SAL)", text: "2366.67", status: "ok" }], result: { cols: ["salaire_moyen"], rows: [["2366.67"]] } }
      ]
    },
    {
      exo: 2, q: 4, code: "Ex2-Q4", cat: "Jointure + AVG(SAL)",
      question: "Ex2 - Q4 : Donnez le salaire moyen du département Production ?",
      tables: ["Employes", "Departements"],
      sqlLines: [
        "SELECT AVG(E.SAL) AS sal_moy_production",
        "FROM Employes E, Departements D",
        "WHERE E.DNO = D.DNO",
        "  AND UPPER(D.DNOM) = 'PRODUCTION';"
      ],
      steps: [
        { activeLines: [1, 2, 3], title: "Étape 1 — Jointure Employes et Departements + filtre 'PRODUCTION'", explain: "Le nom du département est dans Departements (D), le salaire est dans Employes (E). On les relie via E.DNO = D.DNO.", trace: [{ badge: "Jointure", text: "E.DNO = D.DNO AND UPPER(D.DNOM) = 'PRODUCTION'", status: "info" }] },
        { activeLines: [0, 1, 2, 3], title: "Étape 2 — Calcul de la moyenne AVG(E.SAL)", explain: "Calcule la moyenne des salaires uniquement pour les employés du département Production.", trace: [{ badge: "✔ Résultat", text: "sal_moy_production = 1800.00", status: "ok" }], result: { cols: ["sal_moy_production"], rows: [["1800.00"]] } }
      ]
    },
    {
      exo: 2, q: 5, code: "Ex2-Q5", cat: "GROUP BY DNO + MAX(SAL)",
      question: "Ex2 - Q5 : Donnez les numéros de département et leur salaire maximum ?",
      tables: ["Employes"],
      sqlLines: [
        "SELECT DNO, MAX(SAL) AS sal_max",
        "FROM Employes",
        "GROUP BY DNO;"
      ],
      steps: [
        { activeLines: [0, 1, 2], title: "Regroupement par DNO et recherche de MAX(SAL)", explain: "GROUP BY DNO forme un paquet par département et MAX(SAL) extrait le salaire le plus élevé de chacun.", trace: [{ badge: "✔ MAX(SAL)", text: "DNO 1 : 2500 | DNO 2 : 1800 | DNO 3 : 2800", status: "ok" }], result: { cols: ["DNO", "sal_max"], rows: [["1", "2500"], ["2", "1800"], ["3", "2800"]] } }
      ]
    },
    {
      exo: 2, q: 6, code: "Ex2-Q6", cat: "GROUP BY PROF + AVG(SAL)",
      question: "Ex2 - Q6 : Donnez les différentes professions et leur salaire moyen ?",
      tables: ["Employes"],
      sqlLines: [
        "SELECT PROF, AVG(SAL) AS sal_moy",
        "FROM Employes",
        "GROUP BY PROF;"
      ],
      steps: [
        { activeLines: [0, 1, 2], title: "Regroupement par profession et calcul de AVG(SAL)", explain: "GROUP BY PROF regroupe les employés par métier et calcule leur salaire moyen.", trace: [{ badge: "✔ AVG(SAL)", text: "Salaire moyen par profession", status: "ok" }], result: { cols: ["PROF", "sal_moy"], rows: [["Analyste", "2800.00"], ["Ingenieur", "2500.00"], ["Technicien", "1800.00"]] } }
      ]
    },
    {
      exo: 2, q: 7, code: "Ex2-Q7", cat: "GROUP BY + ORDER BY ASC LIMIT 1",
      question: "Ex2 - Q7 : Donnez le salaire moyen par profession le plus bas ?",
      tables: ["Employes"],
      sqlLines: [
        "SELECT PROF, AVG(SAL) AS sal_moy_min",
        "FROM Employes",
        "GROUP BY PROF",
        "ORDER BY sal_moy_min ASC",
        "LIMIT 1;"
      ],
      steps: [
        { activeLines: [0, 1, 2, 3, 4], title: "Calcul des moyennes par profession et sélection de la plus basse", explain: "Après GROUP BY PROF, on trie les moyennes par ordre croissant (ORDER BY sal_moy_min ASC) et on garde la première ligne (ou HAVING AVG(SAL) <= ALL (SELECT AVG(SAL) FROM Employes GROUP BY PROF)).", trace: [{ badge: "✔ Minimum", text: "Technicien — 1800.00", status: "ok" }], result: { cols: ["PROF", "sal_moy_min"], rows: [["Technicien", "1800.00"]] } }
      ]
    },

    // ==================== EXERCICE 3 : NOTES ANNUELLES ====================
    {
      exo: 3, q: 1, code: "Ex3-Q1", cat: "COUNT(*)",
      question: "Ex3 - Q1 : Afficher le nombre total d'étudiants ?",
      tables: ["ETUDIANT"],
      sqlLines: [
        "SELECT COUNT(*) AS nb_etudiants",
        "FROM ETUDIANT;"
      ],
      steps: [
        { activeLines: [0, 1], title: "Comptage de tous les étudiants avec COUNT(*)", explain: "COUNT(*) retourne le nombre total de lignes de la table ETUDIANT.", trace: [{ badge: "✔ COUNT(*)", text: "nb_etudiants = 30", status: "ok" }], result: { cols: ["nb_etudiants"], rows: [["30"]] } }
      ]
    },
    {
      exo: 3, q: 2, code: "Ex3-Q2", cat: "GROUP BY + MAX() & MIN()",
      question: "Ex3 - Q2 : Afficher la note la plus haute et la note la plus basse pour chaque étudiant ?",
      tables: ["EVALUER"],
      sqlLines: [
        "SELECT NEtudiant, MAX(Note) AS note_max, MIN(Note) AS note_min",
        "FROM EVALUER",
        "GROUP BY NEtudiant;"
      ],
      steps: [
        { activeLines: [1, 2], title: "Étape 1 — Regroupement des notes par étudiant (GROUP BY NEtudiant)", explain: "Toutes les notes d'un même étudiant dans la table EVALUER sont rassemblées dans un même groupe.", trace: [{ badge: "Groupes", text: "1 groupe par NEtudiant", status: "info" }] },
        { activeLines: [0, 1, 2], title: "Étape 2 — Extraction de MAX(Note) et MIN(Note) par étudiant", explain: "Pour chaque étudiant, on affiche sa meilleure note et sa note la plus basse.", trace: [{ badge: "✔ Résultat", text: "E01 : max 18.00 / min 12.50 | E02 : max 15.00 / min 9.50", status: "ok" }], result: { cols: ["NEtudiant", "note_max", "note_min"], rows: [["E01", "18.00", "12.50"], ["E02", "15.00", "9.50"]] } }
      ]
    },
    {
      exo: 3, q: 3, code: "Ex3-Q3", cat: "Jointure + GROUP BY + AVG()",
      question: "Ex3 - Q3 : Afficher les moyennes de chaque étudiant dans chacune des matières ?",
      tables: ["ETUDIANT", "MATIERE", "EVALUER"],
      sqlLines: [
        "SELECT E.NEtudiant, E.Nom, E.Prenom, M.LibelleMat, AVG(EV.Note) AS moyenne",
        "FROM ETUDIANT E, MATIERE M, EVALUER EV",
        "WHERE E.NEtudiant = EV.NEtudiant",
        "  AND M.CodeMat = EV.CodeMat",
        "GROUP BY E.NEtudiant, E.Nom, E.Prenom, M.CodeMat, M.LibelleMat;"
      ],
      steps: [
        { activeLines: [1, 2, 3], title: "Étape 1 — Jointure des 3 tables ETUDIANT, MATIERE et EVALUER", explain: "On relie chaque note à l'étudiant et à la matière via les clés étrangères dans WHERE.", trace: [{ badge: "Jointure", text: "E.NEtudiant = EV.NEtudiant AND M.CodeMat = EV.CodeMat", status: "info" }] },
        { activeLines: [0, 1, 2, 3, 4], title: "Étape 2 — Regroupement par (Étudiant, Matière) et moyenne AVG(EV.Note)", explain: "Calcule la moyenne de chaque étudiant dans chacune des matières.", trace: [{ badge: "✔ Moyennes", text: "Moyenne affichée par couple (Étudiant, Matière)", status: "ok" }], result: { cols: ["NEtudiant", "Nom", "Prenom", "LibelleMat", "moyenne"], rows: [["E01", "Ben Salah", "Amine", "BD", "15.50"], ["E01", "Ben Salah", "Amine", "Algo", "14.00"], ["E02", "Trabelsi", "Ines", "BD", "12.75"]] } }
      ]
    },
    {
      exo: 3, q: 4, code: "Ex3-Q4", cat: "Jointure 3 tables + DISTINCT",
      question: "Ex3 - Q4 : Afficher les noms et les prénoms des étudiants dans chaque matière ?",
      tables: ["ETUDIANT", "MATIERE", "EVALUER"],
      sqlLines: [
        "SELECT DISTINCT M.LibelleMat, E.Nom, E.Prenom",
        "FROM ETUDIANT E, MATIERE M, EVALUER EV",
        "WHERE E.NEtudiant = EV.NEtudiant",
        "  AND M.CodeMat = EV.CodeMat",
        "ORDER BY M.LibelleMat ASC, E.Nom ASC;"
      ],
      steps: [
        { activeLines: [1, 2, 3], title: "Étape 1 — Jointure ETUDIANT, MATIERE et EVALUER", explain: "La table EVALUER fait le lien entre les étudiants et les matières dans lesquelles ils sont évalués.", trace: [{ badge: "Jointure", text: "E.NEtudiant = EV.NEtudiant AND M.CodeMat = EV.CodeMat", status: "info" }] },
        { activeLines: [0, 1, 2, 3, 4], title: "Étape 2 — Élimination des doublons avec DISTINCT et tri par matière", explain: "DISTINCT évite d'afficher deux fois le même étudiant s'il a eu plusieurs notes dans la même matière.", trace: [{ badge: "✔ DISTINCT", text: "Liste des étudiants inscrits par matière", status: "ok" }], result: { cols: ["LibelleMat", "Nom", "Prenom"], rows: [["Algo", "Ben Salah", "Amine"], ["BD", "Ben Salah", "Amine"], ["BD", "Trabelsi", "Ines"]] } }
      ]
    },
    {
      exo: 3, q: 5, code: "Ex3-Q5", cat: "Jointure + ORDER BY Note DESC",
      question: "Ex3 - Q5 : Afficher les noms et les prénoms des étudiants dans un ordre décroissant des notes pour chaque matière ?",
      tables: ["ETUDIANT", "MATIERE", "EVALUER"],
      sqlLines: [
        "SELECT M.LibelleMat, E.Nom, E.Prenom, EV.Note",
        "FROM ETUDIANT E, MATIERE M, EVALUER EV",
        "WHERE E.NEtudiant = EV.NEtudiant",
        "  AND M.CodeMat = EV.CodeMat",
        "ORDER BY M.LibelleMat ASC, EV.Note DESC;"
      ],
      steps: [
        { activeLines: [1, 2, 3], title: "Étape 1 — Jointure des 3 tables", explain: "On relie ETUDIANT, MATIERE et EVALUER dans la clause WHERE.", trace: [{ badge: "Jointure", text: "E.NEtudiant = EV.NEtudiant AND M.CodeMat = EV.CodeMat", status: "info" }] },
        { activeLines: [0, 1, 2, 3, 4], title: "Étape 2 — Tri par matière puis par note décroissante (ORDER BY ... EV.Note DESC)", explain: "ORDER BY M.LibelleMat ASC, EV.Note DESC regroupe l'affichage par matière et classe les étudiants de la meilleure note à la plus faible.", trace: [{ badge: "✔ Trié", text: "Classé par matière puis par Note DESC", status: "ok" }], result: { cols: ["LibelleMat", "Nom", "Prenom", "Note"], rows: [["BD", "Ben Salah", "Amine", "18.00"], ["BD", "Trabelsi", "Ines", "15.00"], ["BD", "Ben Salah", "Amine", "13.00"]] } }
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
    if (document.getElementById("tp3-anim-styles")) return;
    var st = document.createElement("style");
    st.id = "tp3-anim-styles";
    st.textContent = [
      ".tp3-anim-wrap{margin:22px 0 28px;border:2px solid #1e3a8a;border-radius:14px;background:linear-gradient(180deg,#0f172a 0%,#172554 100%);color:#f8fafc;box-shadow:0 14px 34px rgba(15,23,42,.24);overflow:hidden;font-family:'Segoe UI',system-ui,sans-serif}",
      ".tp3-anim-head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;padding:14px 18px;background:rgba(15,23,42,.78);border-bottom:1px solid rgba(148,163,184,.22)}",
      ".tp3-anim-title{display:flex;align-items:center;gap:10px;font-weight:800;font-size:1.05rem;color:#f8fafc}",
      ".tp3-anim-badge{background:linear-gradient(135deg,#0284c7,#2563eb);color:#fff;font-size:.76rem;font-weight:800;padding:4px 10px;border-radius:999px;letter-spacing:.03em;text-transform:uppercase}",
      ".tp3-anim-sub{font-size:.83rem;color:#cbd5e1;margin-top:2px}",
      ".tp3-exobar{display:flex;flex-wrap:wrap;gap:8px;padding:10px 16px;background:rgba(15,23,42,.9);border-bottom:1px solid rgba(148,163,184,.18)}",
      ".tp3-exobtn{border:1px solid rgba(148,163,184,.35);background:#1e293b;color:#cbd5e1;font-weight:800;font-size:.8rem;padding:6px 12px;border-radius:999px;cursor:pointer;transition:all .15s}",
      ".tp3-exobtn.active{background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;border-color:#fde68a}",
      ".tp3-qbar{display:flex;flex-wrap:wrap;gap:6px;padding:10px 16px;background:rgba(30,41,59,.75);border-bottom:1px solid rgba(148,163,184,.18)}",
      ".tp3-qbtn{border:1px solid rgba(148,163,184,.32);background:rgba(15,23,42,.7);color:#e2e8f0;font-weight:700;font-size:.78rem;padding:5px 10px;border-radius:8px;cursor:pointer;transition:all .15s}",
      ".tp3-qbtn:hover{border-color:#38bdf8;color:#fff}",
      ".tp3-qbtn.active{background:linear-gradient(135deg,#0284c7,#2563eb);border-color:#7dd3fc;color:#fff;box-shadow:0 4px 12px rgba(2,132,199,.4)}",
      ".tp3-body{padding:16px 18px;display:grid;grid-template-columns:1.1fr 1.2fr;gap:16px}",
      "@media(max-width:920px){.tp3-body{grid-template-columns:1fr}}",
      ".tp3-card{background:rgba(15,23,42,.66);border:1px solid rgba(148,163,184,.22);border-radius:11px;padding:13px 15px}",
      ".tp3-qheader{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}",
      ".tp3-qcat{font-size:.75rem;font-weight:800;padding:3px 9px;border-radius:999px;background:rgba(56,189,248,.16);color:#7dd3fc;border:1px solid rgba(56,189,248,.35)}",
      ".tp3-qtext{font-size:.95rem;font-weight:700;color:#f1f5f9;line-height:1.4;margin-bottom:10px}",
      ".tp3-sqlbox{background:#090d16;border:1px solid rgba(148,163,184,.25);border-radius:9px;padding:10px 12px;font-family:Consolas,'JetBrains Mono',monospace;font-size:.84rem;line-height:1.55;overflow-x:auto}",
      ".tp3-sqlline{padding:2px 8px;border-radius:5px;color:#64748b;transition:all .2s;white-space:pre}",
      ".tp3-sqlline.done{color:#e2e8f0}",
      ".tp3-sqlline.current{background:rgba(2,132,199,.25);border-left:3px solid #38bdf8;color:#fff;font-weight:700}",
      ".tp3-controls{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:12px}",
      ".tp3-cbtn{border:1px solid rgba(148,163,184,.35);background:#1e293b;color:#f8fafc;font-weight:700;font-size:.8rem;padding:7px 12px;border-radius:8px;cursor:pointer;display:inline-flex;align-items:center;gap:5px}",
      ".tp3-cbtn:hover:not(:disabled){background:#334155;border-color:#7dd3fc}",
      ".tp3-cbtn:disabled{opacity:.45;cursor:not-allowed}",
      ".tp3-cbtn.primary{background:linear-gradient(135deg,#059669,#10b981);border-color:#34d399;color:#fff}",
      ".tp3-step-dots{display:flex;gap:6px;margin-left:auto;align-items:center}",
      ".tp3-dot{width:26px;height:26px;border-radius:999px;border:1px solid rgba(148,163,184,.38);background:#0f172a;color:#94a3b8;font-size:.76rem;font-weight:800;cursor:pointer}",
      ".tp3-dot.active{background:#0284c7;color:#fff;border-color:#7dd3fc}",
      ".tp3-dot.done{background:rgba(16,185,129,.22);color:#6ee7b7;border-color:rgba(16,185,129,.5)}",
      ".tp3-step-box{margin-bottom:10px;padding:10px 12px;border-radius:9px;background:rgba(2,132,199,.13);border:1px solid rgba(56,189,248,.3)}",
      ".tp3-step-title{font-weight:800;font-size:.9rem;color:#7dd3fc;margin-bottom:4px}",
      ".tp3-step-exp{font-size:.84rem;color:#e2e8f0;line-height:1.45}",
      ".tp3-trace-list{display:flex;flex-direction:column;gap:6px;margin:10px 0}",
      ".tp3-trace-item{display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:7px;font-size:.82rem;background:rgba(30,41,59,.75);border:1px solid rgba(148,163,184,.2)}",
      ".tp3-trace-item.ok{background:rgba(16,185,129,.14);border-color:rgba(16,185,129,.4);color:#d1fae5}",
      ".tp3-trace-item.no{background:rgba(239,68,68,.13);border-color:rgba(239,68,68,.35);color:#fecaca}",
      ".tp3-trace-item.info{background:rgba(59,130,246,.13);border-color:rgba(59,130,246,.35);color:#dbeafe}",
      ".tp3-tbadge{font-weight:800;font-size:.73rem;padding:2px 7px;border-radius:5px;background:rgba(15,23,42,.65);white-space:nowrap}",
      ".tp3-res-wrap{margin-top:10px;border-top:1px solid rgba(148,163,184,.22);padding-top:10px}",
      ".tp3-res-title{font-size:.78rem;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:#6ee7b7;margin-bottom:6px}",
      ".tp3-res-table{width:100%;border-collapse:collapse;font-size:.8rem;background:#0f172a;border-radius:7px;overflow:hidden}",
      ".tp3-res-table th{background:#1e3a8a;color:#e0f2fe;padding:6px 9px;text-align:left;border:1px solid rgba(148,163,184,.25)}",
      ".tp3-res-table td{padding:5px 9px;border:1px solid rgba(148,163,184,.2);color:#f1f5f9}",
      ".tp3-inline-btn{margin-left:6px;background:linear-gradient(135deg,#0284c7,#2563eb);color:#fff;border:none;border-radius:5px;padding:4px 10px;font-size:.78rem;font-weight:700;cursor:pointer;vertical-align:middle}",
      ".tp3-show-btn{margin-left:6px;background:#2b6cb0;color:#fff;border:none;border-radius:5px;padding:4px 10px;font-size:.78rem;font-weight:700;cursor:pointer;vertical-align:middle}",
      ".tp3-inline-sql{display:none;background:#f7fafc;border:1px solid #cbd5e0;border-left:4px solid #2b6cb0;padding:8px 10px;border-radius:4px;font-family:Consolas,monospace;font-size:.86em;color:#2b6cb0;white-space:pre-wrap;margin:6px 0 10px}",
      ".tp3-global-bar{text-align:center;margin:14px 0}",
      ".tp3-global-btn{background:#2b6cb0;color:#fff;border:none;padding:9px 18px;border-radius:6px;font-weight:700;font-size:.9rem;cursor:pointer}",
      "@media print{.tp3-anim-wrap,.tp3-inline-btn,.tp3-show-btn,.tp3-global-bar{display:none!important}.tp3-inline-sql{display:block!important}}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function buildStudio() {
    injectStyles();

    var wrap = document.createElement("section");
    wrap.className = "tp3-anim-wrap";
    wrap.id = "tp3-anim-studio-mount";
    wrap.innerHTML =
      '<div class="tp3-anim-head">' +
        '<div>' +
          '<div class="tp3-anim-title">' +
            '<span class="tp3-anim-badge">🎬 Animation GROUP BY Pas à Pas</span>' +
            '<span>Studio Interactif de Correction — Série 3 : LMD Group By (Exercices 1, 2 & 3)</span>' +
          '</div>' +
          '<div class="tp3-anim-sub">Visualisez la correction pas à pas des 21 requêtes : Sondage <code>bdtp5</code>, Départements/Employés et Gestion des Notes.</div>' +
        '</div>' +
      '</div>' +
      '<div class="tp3-exobar" id="tp3-exobar"></div>' +
      '<div class="tp3-qbar" id="tp3-qbar"></div>' +
      '<div class="tp3-body">' +
        '<div class="tp3-card">' +
          '<div class="tp3-qheader">' +
            '<span class="tp3-qcat" id="tp3-qcat"></span>' +
            '<span style="font-size:.78rem;color:#94a3b8;" id="tp3-step-counter"></span>' +
          '</div>' +
          '<div class="tp3-qtext" id="tp3-qtext"></div>' +
          '<div class="tp3-sqlbox" id="tp3-sqlbox"></div>' +
          '<div class="tp3-controls">' +
            '<button type="button" class="tp3-cbtn primary" id="tp3-btn-play">▶ Animer pas à pas</button>' +
            '<button type="button" class="tp3-cbtn" id="tp3-btn-prev">◀ Étape préc.</button>' +
            '<button type="button" class="tp3-cbtn" id="tp3-btn-next">Étape suiv. ▶</button>' +
            '<button type="button" class="tp3-cbtn" id="tp3-btn-reset">⏮ Début</button>' +
            '<button type="button" class="tp3-cbtn" id="tp3-btn-full">⚡ Requête complète</button>' +
            '<button type="button" class="tp3-cbtn" id="tp3-btn-copy">📋 Copier SQL</button>' +
            '<div class="tp3-step-dots" id="tp3-step-dots"></div>' +
          '</div>' +
        '</div>' +
        '<div class="tp3-card">' +
          '<div class="tp3-step-box">' +
            '<div class="tp3-step-title" id="tp3-step-title"></div>' +
            '<div class="tp3-step-exp" id="tp3-step-exp"></div>' +
          '</div>' +
          '<div class="tp3-trace-list" id="tp3-trace-list"></div>' +
          '<div class="tp3-res-wrap" id="tp3-res-wrap"></div>' +
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
      var playBtn = document.getElementById("tp3-btn-play");
      if (playBtn) playBtn.textContent = "▶ Animer pas à pas";
    }

    function rebuildQBar() {
      var curExo = REQUETES[state.qIdx].exo;
      var exoBtns = document.querySelectorAll(".tp3-exobtn");
      for (var e = 0; e < exoBtns.length; e++) {
        var bExo = parseInt(exoBtns[e].getAttribute("data-exo"), 10);
        if (bExo === curExo) exoBtns[e].classList.add("active");
        else exoBtns[e].classList.remove("active");
      }

      var qbar = document.getElementById("tp3-qbar");
      qbar.innerHTML = "";
      for (var i = 0; i < REQUETES.length; i++) {
        if (REQUETES[i].exo !== curExo) continue;
        (function (idx) {
          var b = document.createElement("button");
          b.type = "button";
          b.className = "tp3-qbtn" + (idx === state.qIdx ? " active" : "");
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

      document.getElementById("tp3-qcat").textContent = q.code + " • " + q.cat;
      document.getElementById("tp3-step-counter").textContent =
        "Étape " + (state.stepIdx + 1) + " / " + q.steps.length;
      document.getElementById("tp3-qtext").textContent = q.question;

      var sqlBox = document.getElementById("tp3-sqlbox");
      var sqlHtml = "";
      var prevLines = state.stepIdx > 0 ? q.steps[state.stepIdx - 1].activeLines : [];
      for (var l = 0; l < q.sqlLines.length; l++) {
        var isActive = step.activeLines.indexOf(l) !== -1;
        var isNew = isActive && prevLines.indexOf(l) === -1;
        var cls = "tp3-sqlline";
        if (isNew || (state.stepIdx === 0 && isActive)) cls += " current";
        else if (isActive) cls += " done";
        sqlHtml += '<div class="' + cls + '">' + escapeHtml(q.sqlLines[l]) + "</div>";
      }
      sqlBox.innerHTML = sqlHtml;

      var dotsWrap = document.getElementById("tp3-step-dots");
      var dotsHtml = "";
      for (var s = 0; s < q.steps.length; s++) {
        var dCls = "tp3-dot";
        if (s === state.stepIdx) dCls += " active";
        else if (s < state.stepIdx) dCls += " done";
        dotsHtml += '<button type="button" class="' + dCls + '" data-step="' + s + '">' + (s + 1) + "</button>";
      }
      dotsWrap.innerHTML = dotsHtml;
      var dotBtns = dotsWrap.querySelectorAll(".tp3-dot");
      for (var db = 0; db < dotBtns.length; db++) {
        dotBtns[db].addEventListener("click", function () {
          stopAuto();
          state.stepIdx = parseInt(this.getAttribute("data-step"), 10);
          render();
        });
      }

      document.getElementById("tp3-btn-prev").disabled = state.stepIdx === 0;
      document.getElementById("tp3-btn-next").disabled = state.stepIdx === q.steps.length - 1;

      document.getElementById("tp3-step-title").textContent = step.title;
      document.getElementById("tp3-step-exp").textContent = step.explain;

      var traceList = document.getElementById("tp3-trace-list");
      var trHtml = "";
      for (var tr = 0; tr < step.trace.length; tr++) {
        var item = step.trace[tr];
        trHtml +=
          '<div class="tp3-trace-item ' + (item.status || "info") + '">' +
            '<span class="tp3-tbadge">' + escapeHtml(item.badge) + "</span>" +
            '<span>' + escapeHtml(item.text) + "</span>" +
          "</div>";
      }
      traceList.innerHTML = trHtml;

      var resWrap = document.getElementById("tp3-res-wrap");
      if (step.result) {
        var rHtml = '<div class="tp3-res-title">📊 Table Résultat (' + step.result.rows.length + ' ligne' + (step.result.rows.length > 1 ? 's' : '') + ')</div>';
        rHtml += '<table class="tp3-res-table"><thead><tr>';
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

    var exobar = document.getElementById("tp3-exobar");
    for (var ex = 1; ex <= 3; ex++) {
      (function (exoNum) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "tp3-exobtn";
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

    document.getElementById("tp3-btn-prev").addEventListener("click", function () {
      stopAuto();
      if (state.stepIdx > 0) {
        state.stepIdx--;
        render();
      }
    });

    document.getElementById("tp3-btn-next").addEventListener("click", function () {
      stopAuto();
      var qObj = REQUETES[state.qIdx];
      if (state.stepIdx < qObj.steps.length - 1) {
        state.stepIdx++;
        render();
      }
    });

    document.getElementById("tp3-btn-reset").addEventListener("click", function () {
      stopAuto();
      state.stepIdx = 0;
      render();
    });

    document.getElementById("tp3-btn-full").addEventListener("click", function () {
      stopAuto();
      state.stepIdx = REQUETES[state.qIdx].steps.length - 1;
      render();
    });

    document.getElementById("tp3-btn-play").addEventListener("click", function () {
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

    document.getElementById("tp3-btn-copy").addEventListener("click", function () {
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
      var studio = document.getElementById("tp3-anim-studio-mount");
      if (studio && studio.scrollIntoView) {
        studio.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      var playBtn = document.getElementById("tp3-btn-play");
      if (playBtn) playBtn.click();
    }

    // Attacher les boutons sur les 3 listes <ol> des 3 exercices
    var ols = document.querySelectorAll("ol");
    if (ols.length >= 3) {
      var gBar = document.createElement("div");
      gBar.className = "tp3-global-bar";
      var gBtn = document.createElement("button");
      gBtn.type = "button";
      gBtn.className = "tp3-global-btn";
      gBtn.textContent = "✅ Afficher toutes les réponses SQL";
      gBtn.addEventListener("click", function () {
        var pres = document.querySelectorAll(".tp3-inline-sql");
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
        var sBtns = document.querySelectorAll(".tp3-show-btn");
        for (var sb = 0; sb < sBtns.length; sb++) {
          sBtns[sb].textContent = anyHidden ? "🙈 Masquer" : "👁️ Voir la réponse";
        }
        gBtn.textContent = anyHidden ? "🙈 Masquer toutes les réponses SQL" : "✅ Afficher toutes les réponses SQL";
      });
      gBar.appendChild(gBtn);
      wrap.parentNode.insertBefore(gBar, wrap.nextSibling);

      for (var rIdx = 0; rIdx < REQUETES.length; rIdx++) {
        (function (reqIndex) {
          var req = REQUETES[reqIndex];
          var ol = ols[req.exo - 1];
          if (!ol) return;
          var li = ol.children[req.q - 1];
          if (!li) return;

          var sBtn = document.createElement("button");
          sBtn.type = "button";
          sBtn.className = "tp3-show-btn";
          sBtn.textContent = "👁️ Voir la réponse";

          var aBtn = document.createElement("button");
          aBtn.type = "button";
          aBtn.className = "tp3-inline-btn";
          aBtn.textContent = "🎬 Animer " + req.code;

          var pre = document.createElement("pre");
          pre.className = "tp3-inline-sql";
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
        })(rIdx);
      }
    }

    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildStudio);
  } else {
    buildStudio();
  }
})();
