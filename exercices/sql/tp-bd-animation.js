/* ============================================================================
   STI V2.0 — Studio d'Animation Pas à Pas des 15 Requêtes SQL
   Série : Tp-BD-Jointure-sous-requetes-Group-By.html & Tp4-correction-bd.html
   Base de données : ÉTUDIANT (ETUDIANT, SEXE, ENSEIGNANT, MATIERE, NOTES)
   Toutes les jointures respectent la forme STI : WHERE a.x = b.x (sans JOIN)
   ============================================================================ */
(function () {
  "use strict";

  var DB_SAMPLE = {
    ETUDIANT: [
      { Numetu: 1, Nometu: "Asma Ben Mahmoud", Dtnaiss: "2003-05-12", Cdsexe: "F" },
      { Numetu: 2, Nometu: "Bassem Hdhili", Dtnaiss: "2004-11-23", Cdsexe: "H" },
      { Numetu: 3, Nometu: "Souhir Korbsi", Dtnaiss: "2003-09-01", Cdsexe: "F" },
      { Numetu: 4, Nometu: "Karim Hfayedh", Dtnaiss: "2005-02-14", Cdsexe: "H" },
      { Numetu: 5, Nometu: "Wissal Wertani", Dtnaiss: "2004-07-19", Cdsexe: "F" }
    ],
    SEXE: [
      { Cdsexe: "H", Lbsexe: "Garçon" },
      { Cdsexe: "F", Lbsexe: "Fille" }
    ],
    ENSEIGNANT: [
      { Numens: 101, Nomens: "Ali Ben Salah", Grade: "Professeur", Ancien: 15 },
      { Numens: 102, Nomens: "Safia Tammar", Grade: "MCF", Ancien: 8 },
      { Numens: 103, Nomens: "Karim Foughali", Grade: "Assistant", Ancien: 3 }
    ],
    MATIERE: [
      { Numat: 10, Nomat: "Informatique", Coeff: 3, Numens: 101 },
      { Numat: 11, Nomat: "Mathématiques", Coeff: 4, Numens: 102 },
      { Numat: 12, Nomat: "Histoire", Coeff: 2, Numens: 103 },
      { Numat: 13, Nomat: "Sociologie", Coeff: 2, Numens: 101 }
    ],
    NOTES: [
      { Numetu: 1, Numat: 10, Note: 15.5 },
      { Numetu: 1, Numat: 11, Note: 12.0 },
      { Numetu: 1, Numat: 12, Note: 14.0 },
      { Numetu: 2, Numat: 10, Note: 11.0 },
      { Numetu: 2, Numat: 11, Note: 9.0 },
      { Numetu: 3, Numat: 10, Note: 18.0 },
      { Numetu: 3, Numat: 11, Note: 15.5 },
      { Numetu: 3, Numat: 12, Note: 13.5 },
      { Numetu: 3, Numat: 13, Note: 16.0 },
      { Numetu: 4, Numat: 12, Note: 10.0 },
      { Numetu: 5, Numat: 10, Note: 13.0 },
      { Numetu: 5, Numat: 12, Note: 8.0 }
    ]
  };

  var QUERIES = [
    {
      num: 1,
      shortTitle: "Âge moyen par sexe au 01/01/2025",
      question: "Afficher quel était l'âge moyen des garçons et des filles au premier janvier 2025.",
      tables: ["SEXE", "ETUDIANT"],
      notions: ["Jointure a.x = b.x", "DATEDIFF", "AVG()", "GROUP BY"],
      steps: [
        {
          badge: "Étape 1 · FROM",
          clause: "FROM SEXE S, ETUDIANT E",
          sqlSoFar: "FROM SEXE S, ETUDIANT E",
          explain: "On sélectionne les 2 tables nécessaires : ETUDIANT E (qui contient la date de naissance Dtnaiss et le code Cdsexe) et SEXE S (qui contient le libellé Lbsexe : Garçon / Fille).",
          trace: [
            { status: "info", label: "Table SEXE S", detail: "2 lignes : ('H', 'Garçon') et ('F', 'Fille')" },
            { status: "info", label: "Table ETUDIANT E", detail: "5 étudiants avec leur Dtnaiss et leur Cdsexe" }
          ]
        },
        {
          badge: "Étape 2 · Jointure (a.x = b.x)",
          clause: "WHERE E.Cdsexe = S.Cdsexe",
          sqlSoFar: "FROM SEXE S, ETUDIANT E\nWHERE E.Cdsexe = S.Cdsexe",
          explain: "On relie chaque étudiant à son libellé de sexe grâce à la condition de jointure STI : WHERE E.Cdsexe = S.Cdsexe (forme a.x = b.x).",
          trace: [
            { status: "ok", label: "Asma, Souhir, Wissal (E.Cdsexe = 'F')", detail: "Reliées à S.Cdsexe = 'F' → 'Fille'" },
            { status: "ok", label: "Bassem, Karim (E.Cdsexe = 'H')", detail: "Reliés à S.Cdsexe = 'H' → 'Garçon'" }
          ]
        },
        {
          badge: "Étape 3 · GROUP BY",
          clause: "GROUP BY S.Cdsexe, S.Lbsexe",
          sqlSoFar: "FROM SEXE S, ETUDIANT E\nWHERE E.Cdsexe = S.Cdsexe\nGROUP BY S.Cdsexe, S.Lbsexe",
          explain: "On rassemble les lignes en 2 paquets selon le sexe : un groupe 'Fille' (3 étudiantes) et un groupe 'Garçon' (2 étudiants).",
          trace: [
            { status: "ok", label: "📦 Groupe 'Fille' (3 lignes)", detail: "Asma (2003-05-12), Souhir (2003-09-01), Wissal (2004-07-19)" },
            { status: "ok", label: "📦 Groupe 'Garçon' (2 lignes)", detail: "Bassem (2004-11-23), Karim (2005-02-14)" }
          ]
        },
        {
          badge: "Étape 4 · SELECT + AVG(DATEDIFF)",
          clause: "SELECT S.Lbsexe, AVG(DATEDIFF('2025-01-01', E.Dtnaiss) / 365) AS \"Age Moyen\"",
          sqlSoFar: "SELECT S.Lbsexe, AVG(DATEDIFF('2025-01-01', E.Dtnaiss) / 365) AS \"Age Moyen\"\nFROM SEXE S, ETUDIANT E\nWHERE E.Cdsexe = S.Cdsexe\nGROUP BY S.Cdsexe, S.Lbsexe;",
          explain: "DATEDIFF('2025-01-01', E.Dtnaiss) calcule le nombre de jours vécus au 1er janvier 2025. On divise par 365 pour avoir l'âge en années, puis AVG(...) calcule la moyenne de chaque groupe.",
          trace: [
            { status: "ok", label: "Calcul groupe 'Fille'", detail: "Âges au 01/01/2025 : 21.65, 21.35, 20.47 → Moyenne = 21.16 ans" },
            { status: "ok", label: "Calcul groupe 'Garçon'", detail: "Âges au 01/01/2025 : 20.12, 19.89 → Moyenne = 20.01 ans" }
          ]
        }
      ],
      resultCols: ["Lbsexe", "Age Moyen"],
      resultRows: [
        { Lbsexe: "Fille", "Age Moyen": "21.16" },
        { Lbsexe: "Garçon", "Age Moyen": "20.01" }
      ]
    },
    {
      num: 2,
      shortTitle: "Enseignants d'Histoire",
      question: "Afficher le nom et le grade des enseignants d'histoire.",
      tables: ["ENSEIGNANT", "MATIERE"],
      notions: ["Jointure a.x = b.x", "Restriction WHERE"],
      steps: [
        {
          badge: "Étape 1 · FROM",
          clause: "FROM ENSEIGNANT E, MATIERE M",
          sqlSoFar: "FROM ENSEIGNANT E, MATIERE M",
          explain: "Le nom et le grade sont dans ENSEIGNANT E ; le libellé 'Histoire' est dans MATIERE M. On place donc les 2 tables dans le FROM.",
          trace: [
            { status: "info", label: "ENSEIGNANT E", detail: "3 enseignants (101 Ali Ben Salah, 102 Safia Tammar, 103 Karim Foughali)" },
            { status: "info", label: "MATIERE M", detail: "4 matières (Informatique, Mathématiques, Histoire, Sociologie)" }
          ]
        },
        {
          badge: "Étape 2 · Jointure (a.x = b.x)",
          clause: "WHERE E.Numens = M.Numens",
          sqlSoFar: "FROM ENSEIGNANT E, MATIERE M\nWHERE E.Numens = M.Numens",
          explain: "On relie chaque matière à son enseignant par l'attribut commun Numens : WHERE E.Numens = M.Numens.",
          trace: [
            { status: "ok", label: "101 = 101", detail: "Ali Ben Salah ↔ Informatique, Sociologie" },
            { status: "ok", label: "102 = 102", detail: "Safia Tammar ↔ Mathématiques" },
            { status: "ok", label: "103 = 103", detail: "Karim Foughali ↔ Histoire" }
          ]
        },
        {
          badge: "Étape 3 · Filtre AND",
          clause: "AND M.Nomat = 'Histoire'",
          sqlSoFar: "SELECT E.Nomens, E.Grade\nFROM ENSEIGNANT E, MATIERE M\nWHERE E.Numens = M.Numens\n  AND M.Nomat = 'Histoire';",
          explain: "On ajoute la condition AND M.Nomat = 'Histoire' et on projette uniquement E.Nomens et E.Grade.",
          trace: [
            { status: "no", label: "Ali Ben Salah / Safia Tammar", detail: "M.Nomat != 'Histoire' → écartés" },
            { status: "ok", label: "Karim Foughali (Assistant)", detail: "E.Numens = M.Numens (103) ET M.Nomat = 'Histoire' → retenu !" }
          ]
        }
      ],
      resultCols: ["Nomens", "Grade"],
      resultRows: [
        { Nomens: "Karim Foughali", Grade: "Assistant" }
      ]
    },
    {
      num: 3,
      shortTitle: "Étudiants sans note en Sociologie",
      question: "Afficher les noms et numéro des étudiants qui n'ont pas de notes en Sociologie.",
      tables: ["ETUDIANT", "NOTES", "MATIERE"],
      notions: ["Sous-requête NOT IN", "Jointure a.x = b.x"],
      steps: [
        {
          badge: "Étape 1 · Sous-requête",
          clause: "(SELECT N.Numetu FROM NOTES N, MATIERE M WHERE N.Numat = M.Numat AND M.Nomat = 'Sociologie')",
          sqlSoFar: "-- 1. Sous-requête : qui A une note en Sociologie ?\n(SELECT N.Numetu\n FROM NOTES N, MATIERE M\n WHERE N.Numat = M.Numat\n   AND M.Nomat = 'Sociologie')",
          explain: "Pour trouver ceux qui N'ONT PAS de note en Sociologie, on cherche d'abord dans une sous-requête les Numetu de ceux qui ONT une note en Sociologie (via la jointure N.Numat = M.Numat).",
          trace: [
            { status: "ok", label: "Résultat de la sous-requête", detail: "Seule l'étudiante Numetu = 3 (Souhir Korbsi, note 16.0 en Sociologie Numat=13) est trouvée → liste = (3)" }
          ]
        },
        {
          badge: "Étape 2 · WHERE Numetu NOT IN (...)",
          clause: "WHERE E.Numetu NOT IN (...)",
          sqlSoFar: "SELECT E.Nometu, E.Numetu\nFROM ETUDIANT E\nWHERE E.Numetu NOT IN (\n  SELECT N.Numetu\n  FROM NOTES N, MATIERE M\n  WHERE N.Numat = M.Numat\n    AND M.Nomat = 'Sociologie'\n);",
          explain: "La requête principale parcourt ETUDIANT E et conserve tous les étudiants dont le numéro E.Numetu ne figure pas dans la liste renvoyée par la sous-requête.",
          trace: [
            { status: "ok", label: "Numetu 1, 2, 4, 5", detail: "Ne sont pas dans (3) → GARDÉS !" },
            { status: "no", label: "Numetu 3 (Souhir Korbsi)", detail: "Est dans (3) → ÉLIMINÉE par NOT IN" }
          ]
        }
      ],
      resultCols: ["Nometu", "Numetu"],
      resultRows: [
        { Nometu: "Asma Ben Mahmoud", Numetu: 1 },
        { Nometu: "Bassem Hdhili", Numetu: 2 },
        { Nometu: "Karim Hfayedh", Numetu: 4 },
        { Nometu: "Wissal Wertani", Numetu: 5 }
      ]
    },
    {
      num: 4,
      shortTitle: "Matières enseignées par MCF ou Assistant",
      question: "Afficher le nom et le coefficient des matières qui sont enseignées par des maîtres de conférences ou des assistants.",
      tables: ["MATIERE", "ENSEIGNANT"],
      notions: ["Jointure a.x = b.x", "Opérateur IN (...)"],
      steps: [
        {
          badge: "Étape 1 · FROM & Jointure",
          clause: "FROM MATIERE M, ENSEIGNANT E WHERE M.Numens = E.Numens",
          sqlSoFar: "FROM MATIERE M, ENSEIGNANT E\nWHERE M.Numens = E.Numens",
          explain: "On relie chaque matière M à son enseignant E avec la condition d'égalité WHERE M.Numens = E.Numens (forme a.x = b.x).",
          trace: [
            { status: "info", label: "Informatique (3) & Sociologie (2)", detail: "Enseignant 101 : Ali Ben Salah (Grade = 'Professeur')" },
            { status: "info", label: "Mathématiques (4)", detail: "Enseignant 102 : Safia Tammar (Grade = 'MCF')" },
            { status: "info", label: "Histoire (2)", detail: "Enseignant 103 : Karim Foughali (Grade = 'Assistant')" }
          ]
        },
        {
          badge: "Étape 2 · Filtre IN ('MCF', 'Assistant')",
          clause: "AND E.Grade IN ('MCF', 'Assistant')",
          sqlSoFar: "SELECT M.Nomat, M.Coeff\nFROM MATIERE M, ENSEIGNANT E\nWHERE M.Numens = E.Numens\n  AND E.Grade IN ('MCF', 'Assistant');",
          explain: "⚠️ Correction importante : l'énoncé demande les maîtres de conférences ('MCF') ou les assistants ('Assistant'), et NON 'PR' (Professeur) ! On filtre donc avec E.Grade IN ('MCF', 'Assistant').",
          trace: [
            { status: "no", label: "Informatique & Sociologie", detail: "Grade = 'Professeur' → écartées" },
            { status: "ok", label: "Mathématiques (Coeff 4)", detail: "Grade = 'MCF' → retenue !" },
            { status: "ok", label: "Histoire (Coeff 2)", detail: "Grade = 'Assistant' → retenue !" }
          ]
        }
      ],
      resultCols: ["Nomat", "Coeff"],
      resultRows: [
        { Nomat: "Mathématiques", Coeff: 4 },
        { Nomat: "Histoire", Coeff: 2 }
      ]
    },
    {
      num: 5,
      shortTitle: "Moyenne par étudiant et par matière (triée)",
      question: "Afficher pour chaque étudiant (nom et numéro), et par ordre alphabétique, la moyenne qu'il a obtenue dans chaque matière.",
      tables: ["ETUDIANT", "NOTES", "MATIERE"],
      notions: ["Jointure 3 tables (a.x = b.x)", "AVG()", "GROUP BY", "ORDER BY"],
      steps: [
        {
          badge: "Étape 1 · Double jointure (a.x = b.x)",
          clause: "FROM ETUDIANT E, NOTES N, MATIERE M WHERE E.Numetu = N.Numetu AND N.Numat = M.Numat",
          sqlSoFar: "FROM ETUDIANT E, NOTES N, MATIERE M\nWHERE E.Numetu = N.Numetu\n  AND N.Numat = M.Numat",
          explain: "Pour relier les 3 tables, on écrit deux conditions de la forme a.x = b.x séparées par AND : E.Numetu = N.Numetu ET N.Numat = M.Numat.",
          trace: [
            { status: "ok", label: "Liaison 1 : E.Numetu = N.Numetu", detail: "Associe chaque note au nom de l'étudiant" },
            { status: "ok", label: "Liaison 2 : N.Numat = M.Numat", detail: "Associe chaque note au nom de la matière" }
          ]
        },
        {
          badge: "Étape 2 · GROUP BY + AVG(N.Note)",
          clause: "GROUP BY E.Numetu, E.Nometu, M.Numat, M.Nomat",
          sqlSoFar: "SELECT E.Nometu, E.Numetu, M.Nomat, AVG(N.Note) AS Moyenne\nFROM ETUDIANT E, NOTES N, MATIERE M\nWHERE E.Numetu = N.Numetu\n  AND N.Numat = M.Numat\nGROUP BY E.Numetu, E.Nometu, M.Numat, M.Nomat",
          explain: "On regroupe par étudiant (E.Numetu, E.Nometu) ET par matière (M.Numat, M.Nomat) pour calculer la moyenne AVG(N.Note) de chaque étudiant dans chacune de ses matières.",
          trace: [
            { status: "ok", label: "Règle GROUP BY respectée", detail: "Toutes les colonnes non agrégées du SELECT figurent dans le GROUP BY" }
          ]
        },
        {
          badge: "Étape 3 · ORDER BY E.Nometu ASC",
          clause: "ORDER BY E.Nometu ASC;",
          sqlSoFar: "SELECT E.Nometu, E.Numetu, M.Nomat, AVG(N.Note) AS Moyenne\nFROM ETUDIANT E, NOTES N, MATIERE M\nWHERE E.Numetu = N.Numetu\n  AND N.Numat = M.Numat\nGROUP BY E.Numetu, E.Nometu, M.Numat, M.Nomat\nORDER BY E.Nometu ASC;",
          explain: "On trie enfin le résultat par ordre alphabétique croissant sur le nom de l'étudiant (ORDER BY E.Nometu ASC).",
          trace: [
            { status: "ok", label: "Tri alphabétique", detail: "Asma Ben Mahmoud → Bassem Hdhili → Karim Hfayedh → Souhir Korbsi → Wissal Wertani" }
          ]
        }
      ],
      resultCols: ["Nometu", "Numetu", "Nomat", "Moyenne"],
      resultRows: [
        { Nometu: "Asma Ben Mahmoud", Numetu: 1, Nomat: "Informatique", Moyenne: 15.5 },
        { Nometu: "Asma Ben Mahmoud", Numetu: 1, Nomat: "Mathématiques", Moyenne: 12.0 },
        { Nometu: "Asma Ben Mahmoud", Numetu: 1, Nomat: "Histoire", Moyenne: 14.0 },
        { Nometu: "Bassem Hdhili", Numetu: 2, Nomat: "Informatique", Moyenne: 11.0 },
        { Nometu: "Bassem Hdhili", Numetu: 2, Nomat: "Mathématiques", Moyenne: 9.0 },
        { Nometu: "Karim Hfayedh", Numetu: 4, Nomat: "Histoire", Moyenne: 10.0 },
        { Nometu: "Souhir Korbsi", Numetu: 3, Nomat: "Informatique", Moyenne: 18.0 },
        { Nometu: "Souhir Korbsi", Numetu: 3, Nomat: "Mathématiques", Moyenne: 15.5 },
        { Nometu: "Souhir Korbsi", Numetu: 3, Nomat: "Histoire", Moyenne: 13.5 },
        { Nometu: "Souhir Korbsi", Numetu: 3, Nomat: "Sociologie", Moyenne: 16.0 },
        { Nometu: "Wissal Wertani", Numetu: 5, Nomat: "Informatique", Moyenne: 13.0 },
        { Nometu: "Wissal Wertani", Numetu: 5, Nomat: "Histoire", Moyenne: 8.0 }
      ]
    },
    {
      num: 6,
      shortTitle: "Note d'Informatique > moyenne de la classe",
      question: "Afficher le nom, l'âge et le sexe des étudiants qui ont eu une note d'informatique supérieure à la moyenne générale de la classe.",
      tables: ["ETUDIANT", "SEXE", "NOTES", "MATIERE"],
      notions: ["Jointure a.x = b.x", "Sous-requête AVG()", "DATEDIFF"],
      steps: [
        {
          badge: "Étape 1 · Sous-requête (Moyenne)",
          clause: "(SELECT AVG(N2.Note) FROM NOTES N2, MATIERE M2 WHERE N2.Numat = M2.Numat AND M2.Nomat = 'Informatique')",
          sqlSoFar: "-- 1. Sous-requête : calculer la moyenne en Informatique\n(SELECT AVG(N2.Note)\n FROM NOTES N2, MATIERE M2\n WHERE N2.Numat = M2.Numat\n   AND M2.Nomat = 'Informatique')",
          explain: "La sous-requête calcule d'abord la moyenne des notes d'Informatique (avec des alias distincts N2 et M2) : (15.5 + 11.0 + 18.0 + 13.0) / 4 = 14.375.",
          trace: [
            { status: "info", label: "Notes en Informatique", detail: "Asma (15.5), Bassem (11.0), Souhir (18.0), Wissal (13.0) → Moyenne = 14.38" }
          ]
        },
        {
          badge: "Étape 2 · Jointures de la requête principale",
          clause: "FROM ETUDIANT E, SEXE S, NOTES N, MATIERE M WHERE E.Cdsexe = S.Cdsexe AND E.Numetu = N.Numetu AND N.Numat = M.Numat AND M.Nomat = 'Informatique'",
          sqlSoFar: "FROM ETUDIANT E, SEXE S, NOTES N, MATIERE M\nWHERE E.Cdsexe = S.Cdsexe\n  AND E.Numetu = N.Numetu\n  AND N.Numat = M.Numat\n  AND M.Nomat = 'Informatique'",
          explain: "On joint ETUDIANT E, SEXE S (pour afficher le libellé du sexe S.Lbsexe), NOTES N et MATIERE M sur la matière 'Informatique'.",
          trace: [
            { status: "ok", label: "Jointures a.x = b.x", detail: "E.Cdsexe = S.Cdsexe AND E.Numetu = N.Numetu AND N.Numat = M.Numat" }
          ]
        },
        {
          badge: "Étape 3 · Comparaison N.Note > (Sous-requête)",
          clause: "AND N.Note > (SELECT AVG(N2.Note) ...)",
          sqlSoFar: "SELECT E.Nometu, DATEDIFF(CURRENT_DATE, E.Dtnaiss) / 365 AS Age, S.Lbsexe\nFROM ETUDIANT E, SEXE S, NOTES N, MATIERE M\nWHERE E.Cdsexe = S.Cdsexe\n  AND E.Numetu = N.Numetu\n  AND N.Numat = M.Numat\n  AND M.Nomat = 'Informatique'\n  AND N.Note > (\n    SELECT AVG(N2.Note)\n    FROM NOTES N2, MATIERE M2\n    WHERE N2.Numat = M2.Numat\n      AND M2.Nomat = 'Informatique'\n  );",
          explain: "On ne garde que les étudiants dont la note d'Informatique dépasse 14.38.",
          trace: [
            { status: "ok", label: "Asma Ben Mahmoud (15.5 > 14.38)", detail: "Retenue !" },
            { status: "no", label: "Bassem Hdhili (11.0) & Wissal Wertani (13.0)", detail: "Notes <= 14.38 → écartés" },
            { status: "ok", label: "Souhir Korbsi (18.0 > 14.38)", detail: "Retenue !" }
          ]
        }
      ],
      resultCols: ["Nometu", "Age", "Lbsexe"],
      resultRows: [
        { Nometu: "Asma Ben Mahmoud", Age: "23 ans", Lbsexe: "Fille" },
        { Nometu: "Souhir Korbsi", Age: "23 ans", Lbsexe: "Fille" }
      ]
    },
    {
      num: 7,
      shortTitle: "Moyenne au diplôme (toutes les matières notées)",
      question: "Afficher, pour chaque étudiant (nom et numéro) qui a une note dans chacune des matières, la moyenne obtenue au diplôme.",
      tables: ["ETUDIANT", "NOTES", "MATIERE"],
      notions: ["Jointure a.x = b.x", "SUM(Note*Coeff)/SUM(Coeff)", "GROUP BY", "HAVING + Sous-requête"],
      steps: [
        {
          badge: "Étape 1 · Jointures & GROUP BY",
          clause: "FROM ETUDIANT E, NOTES N, MATIERE M WHERE E.Numetu = N.Numetu AND N.Numat = M.Numat GROUP BY E.Numetu, E.Nometu",
          sqlSoFar: "FROM ETUDIANT E, NOTES N, MATIERE M\nWHERE E.Numetu = N.Numetu\n  AND N.Numat = M.Numat\nGROUP BY E.Numetu, E.Nometu",
          explain: "On relie chaque étudiant à ses notes et aux coefficients des matières, puis on regroupe les lignes par étudiant (E.Numetu, E.Nometu).",
          trace: [
            { status: "info", label: "Asma (Numetu=1)", detail: "3 matières notées sur 4" },
            { status: "info", label: "Bassem (2), Wissal (5)", detail: "2 matières notées sur 4" },
            { status: "ok", label: "Souhir Korbsi (Numetu=3)", detail: "4 matières notées sur 4 (Info, Maths, Histoire, Sociologie)" },
            { status: "info", label: "Karim (4)", detail: "1 matière notée sur 4" }
          ]
        },
        {
          badge: "Étape 2 · HAVING COUNT(DISTINCT N.Numat) = (SELECT COUNT(*) FROM MATIERE)",
          clause: "HAVING COUNT(DISTINCT N.Numat) = (SELECT COUNT(*) FROM MATIERE)",
          sqlSoFar: "FROM ETUDIANT E, NOTES N, MATIERE M\nWHERE E.Numetu = N.Numetu\n  AND N.Numat = M.Numat\nGROUP BY E.Numetu, E.Nometu\nHAVING COUNT(DISTINCT N.Numat) = (SELECT COUNT(*) FROM MATIERE)",
          explain: "La sous-requête (SELECT COUNT(*) FROM MATIERE) vaut 4. La clause HAVING filtre les groupes d'étudiants pour ne garder que ceux qui ont une note dans les 4 matières distinctes.",
          trace: [
            { status: "no", label: "Asma (3 != 4), Bassem (2 != 4), Karim (1 != 4), Wissal (2 != 4)", detail: "Éliminés par HAVING" },
            { status: "ok", label: "Souhir Korbsi (COUNT = 4 = 4)", detail: "Gardée par HAVING !" }
          ]
        },
        {
          badge: "Étape 3 · Moyenne pondérée SUM(Note*Coeff)/SUM(Coeff)",
          clause: "SELECT E.Nometu, E.Numetu, SUM(N.Note * M.Coeff) / SUM(M.Coeff) AS Moyenne",
          sqlSoFar: "SELECT E.Nometu, E.Numetu, SUM(N.Note * M.Coeff) / SUM(M.Coeff) AS Moyenne\nFROM ETUDIANT E, NOTES N, MATIERE M\nWHERE E.Numetu = N.Numetu\n  AND N.Numat = M.Numat\nGROUP BY E.Numetu, E.Nometu\nHAVING COUNT(DISTINCT N.Numat) = (SELECT COUNT(*) FROM MATIERE)\nORDER BY E.Nometu ASC;",
          explain: "La moyenne au diplôme est pondérée par les coefficients : SUM(N.Note * M.Coeff) / SUM(M.Coeff).",
          trace: [
            { status: "ok", label: "Calcul pour Souhir Korbsi", detail: "(18×3 + 15.5×4 + 13.5×2 + 16×2) / (3 + 4 + 2 + 2) = 175 / 11 = 15.91" }
          ]
        }
      ],
      resultCols: ["Nometu", "Numetu", "Moyenne"],
      resultRows: [
        { Nometu: "Souhir Korbsi", Numetu: 3, Moyenne: "15.91" }
      ]
    },
    {
      num: 8,
      shortTitle: "Enseignants ayant plus d'une matière",
      question: "Afficher le nom, le grade et l'ancienneté des enseignants qui enseignent dans plus d'une matière.",
      tables: ["ENSEIGNANT", "MATIERE"],
      notions: ["Jointure a.x = b.x", "GROUP BY", "HAVING COUNT() > 1"],
      steps: [
        {
          badge: "Étape 1 · Jointure ENSEIGNANT & MATIERE",
          clause: "FROM ENSEIGNANT E, MATIERE M WHERE E.Numens = M.Numens",
          sqlSoFar: "FROM ENSEIGNANT E, MATIERE M\nWHERE E.Numens = M.Numens",
          explain: "On relie chaque enseignant aux matières qu'il assure grâce à WHERE E.Numens = M.Numens.",
          trace: [
            { status: "info", label: "Ali Ben Salah (101)", detail: "Informatique (10) + Sociologie (13) → 2 matières" },
            { status: "info", label: "Safia Tammar (102)", detail: "Mathématiques (11) → 1 matière" },
            { status: "info", label: "Karim Foughali (103)", detail: "Histoire (12) → 1 matière" }
          ]
        },
        {
          badge: "Étape 2 · GROUP BY + HAVING COUNT(M.Numat) > 1",
          clause: "GROUP BY E.Numens, E.Nomens, E.Grade, E.Ancien HAVING COUNT(M.Numat) > 1",
          sqlSoFar: "SELECT E.Nomens, E.Grade, E.Ancien\nFROM ENSEIGNANT E, MATIERE M\nWHERE E.Numens = M.Numens\nGROUP BY E.Numens, E.Nomens, E.Grade, E.Ancien\nHAVING COUNT(M.Numat) > 1;",
          explain: "⚠️ Correction importante : on regroupe en incluant la clé primaire E.Numens (pour ne jamais fusionner deux homonymes) et on filtre les groupes avec HAVING COUNT(M.Numat) > 1.",
          trace: [
            { status: "ok", label: "Ali Ben Salah (COUNT = 2 > 1)", detail: "GARDÉ par HAVING !" },
            { status: "no", label: "Safia Tammar (1) & Karim Foughali (1)", detail: "COUNT = 1 → ÉLIMINÉS par HAVING" }
          ]
        }
      ],
      resultCols: ["Nomens", "Grade", "Ancien"],
      resultRows: [
        { Nomens: "Ali Ben Salah", Grade: "Professeur", Ancien: 15 }
      ]
    },
    {
      num: 9,
      shortTitle: "Nombre d'admis au diplôme par sexe",
      question: "Afficher le nombre de garçons et le nombre de filles qui ont réussi au diplôme : moyenne >= 10.",
      tables: ["SEXE", "ETUDIANT", "NOTES", "MATIERE"],
      notions: ["Sous-requête GROUP BY + HAVING", "Jointure a.x = b.x", "COUNT()"],
      steps: [
        {
          badge: "Étape 1 · Sous-requête des admis",
          clause: "(SELECT N.Numetu FROM NOTES N, MATIERE M WHERE N.Numat = M.Numat GROUP BY N.Numetu HAVING SUM(N.Note * M.Coeff) / SUM(M.Coeff) >= 10 AND COUNT(DISTINCT N.Numat) = (SELECT COUNT(*) FROM MATIERE))",
          sqlSoFar: "-- 1. Sous-requête : Numetu des étudiants admis au diplôme\n(SELECT N.Numetu\n FROM NOTES N, MATIERE M\n WHERE N.Numat = M.Numat\n GROUP BY N.Numetu\n HAVING SUM(N.Note * M.Coeff) / SUM(M.Coeff) >= 10\n    AND COUNT(DISTINCT N.Numat) = (SELECT COUNT(*) FROM MATIERE))",
          explain: "⚠️ Correction importante : le nombre total de matières s'écrit (SELECT COUNT(*) FROM MATIERE) et non '5' en dur ! La sous-requête identifie les Numetu ayant toutes leurs notes et une moyenne pondérée >= 10.",
          trace: [
            { status: "ok", label: "Étudiants admis trouvés", detail: "Numetu = 3 (Souhir Korbsi : 4 matières sur 4 et moyenne 15.91 >= 10)" }
          ]
        },
        {
          badge: "Étape 2 · Requête principale par sexe",
          clause: "SELECT S.Lbsexe, COUNT(E.Numetu) AS Nb_Reussis FROM SEXE S, ETUDIANT E WHERE S.Cdsexe = E.Cdsexe AND E.Numetu IN (...) GROUP BY S.Cdsexe, S.Lbsexe;",
          sqlSoFar: "SELECT S.Lbsexe, COUNT(E.Numetu) AS Nb_Reussis\nFROM SEXE S, ETUDIANT E\nWHERE S.Cdsexe = E.Cdsexe\n  AND E.Numetu IN (\n    SELECT N.Numetu\n    FROM NOTES N, MATIERE M\n    WHERE N.Numat = M.Numat\n    GROUP BY N.Numetu\n    HAVING SUM(N.Note * M.Coeff) / SUM(M.Coeff) >= 10\n       AND COUNT(DISTINCT N.Numat) = (SELECT COUNT(*) FROM MATIERE)\n  )\nGROUP BY S.Cdsexe, S.Lbsexe;",
          explain: "La requête principale relie les étudiants admis à la table SEXE S (S.Cdsexe = E.Cdsexe) et les compte par sexe avec GROUP BY S.Cdsexe, S.Lbsexe.",
          trace: [
            { status: "ok", label: "Groupe 'Fille'", detail: "COUNT(E.Numetu) = 1" }
          ]
        }
      ],
      resultCols: ["Lbsexe", "Nb_Reussis"],
      resultRows: [
        { Lbsexe: "Fille", Nb_Reussis: 1 }
      ]
    },
    {
      num: 10,
      shortTitle: "Note Informatique > Note Mathématiques",
      question: "Afficher le nom, le numéro et le sexe des étudiants qui ont une note en informatique supérieure à leur note de Mathématiques.",
      tables: ["ETUDIANT", "SEXE", "NOTES", "MATIERE"],
      notions: ["Jointure a.x = b.x", "Sous-requête corrélée", "Piège > ALL évité"],
      steps: [
        {
          badge: "Étape 1 · Note d'Informatique de l'étudiant E",
          clause: "FROM ETUDIANT E, SEXE S, NOTES N1, MATIERE M1 WHERE E.Cdsexe = S.Cdsexe AND E.Numetu = N1.Numetu AND N1.Numat = M1.Numat AND M1.Nomat = 'Informatique'",
          sqlSoFar: "FROM ETUDIANT E, SEXE S, NOTES N1, MATIERE M1\nWHERE E.Cdsexe = S.Cdsexe\n  AND E.Numetu = N1.Numetu\n  AND N1.Numat = M1.Numat\n  AND M1.Nomat = 'Informatique'",
          explain: "Avec les alias N1 et M1, on récupère pour chaque étudiant E sa note d'Informatique N1.Note.",
          trace: [
            { status: "info", label: "Notes en Informatique (N1.Note)", detail: "Asma : 15.5 | Bassem : 11.0 | Souhir : 18.0 | Wissal : 13.0" }
          ]
        },
        {
          badge: "Étape 2 · Sous-requête corrélée (Note de Maths du MÊME étudiant)",
          clause: "AND N1.Note > (SELECT N2.Note FROM NOTES N2, MATIERE M2 WHERE N2.Numat = M2.Numat AND M2.Nomat = 'Mathématiques' AND N2.Numetu = E.Numetu)",
          sqlSoFar: "SELECT E.Nometu, E.Numetu, S.Lbsexe\nFROM ETUDIANT E, SEXE S, NOTES N1, MATIERE M1\nWHERE E.Cdsexe = S.Cdsexe\n  AND E.Numetu = N1.Numetu\n  AND N1.Numat = M1.Numat\n  AND M1.Nomat = 'Informatique'\n  AND N1.Note > (\n    SELECT N2.Note\n    FROM NOTES N2, MATIERE M2\n    WHERE N2.Numat = M2.Numat\n      AND M2.Nomat = 'Mathématiques'\n      AND N2.Numetu = E.Numetu\n  );",
          explain: "⚠️ Correction essentielle : on utilise '>' (SANS 'ALL') et des alias distincts N2, M2. Pourquoi ? Parce que Wissal (Numetu=5) n'a pas de note en Maths : avec '> ALL', '13.0 > ALL (vide)' serait VRAI et Wissal serait affichée à tort ! Avec '>', seuls ceux qui ont une note en Maths inférieure à leur note d'Info sont gardés.",
          trace: [
            { status: "ok", label: "Asma (Info 15.5 > Maths 12.0)", detail: "GARDÉE !" },
            { status: "ok", label: "Bassem (Info 11.0 > Maths 9.0)", detail: "GARDÉ !" },
            { status: "ok", label: "Souhir (Info 18.0 > Maths 15.5)", detail: "GARDÉE !" },
            { status: "no", label: "Wissal (Info 13.0, aucune note en Maths)", detail: "Sous-requête NULL → ÉCARTÉE à juste titre !" }
          ]
        }
      ],
      resultCols: ["Nometu", "Numetu", "Lbsexe"],
      resultRows: [
        { Nometu: "Asma Ben Mahmoud", Numetu: 1, Lbsexe: "Fille" },
        { Nometu: "Bassem Hdhili", Numetu: 2, Lbsexe: "Garçon" },
        { Nometu: "Souhir Korbsi", Numetu: 3, Lbsexe: "Fille" }
      ]
    },
    {
      num: 11,
      shortTitle: "Couples garçon/fille (écart d'âge <= 180 j)",
      question: "Afficher le nom des couples, nom du garçon nom de la fille, dont la différence d'âge ne dépasse pas 6 mois (180 jours).",
      tables: ["ETUDIANT"],
      notions: ["Auto-jointure (E1, E2)", "DATEDIFF / ABS"],
      steps: [
        {
          badge: "Étape 1 · Deux alias pour ETUDIANT",
          clause: "FROM ETUDIANT E1, ETUDIANT E2 WHERE E1.Cdsexe = 'H' AND E2.Cdsexe = 'F'",
          sqlSoFar: "FROM ETUDIANT E1, ETUDIANT E2\nWHERE E1.Cdsexe = 'H'\n  AND E2.Cdsexe = 'F'",
          explain: "Pour comparer un garçon et une fille qui sont dans la même table ETUDIANT, on appelle la table deux fois dans le FROM avec deux alias : E1 (garçons 'H') et E2 (filles 'F').",
          trace: [
            { status: "info", label: "E1 (Garçons 'H')", detail: "Bassem (2004-11-23), Karim (2005-02-14)" },
            { status: "info", label: "E2 (Filles 'F')", detail: "Asma (2003-05-12), Souhir (2003-09-01), Wissal (2004-07-19)" }
          ]
        },
        {
          badge: "Étape 2 · Différence d'âge <= 180 jours",
          clause: "AND ABS(DATEDIFF(E1.Dtnaiss, E2.Dtnaiss)) <= 180",
          sqlSoFar: "SELECT E1.Nometu AS Nom_Garcon, E2.Nometu AS Nom_Fille\nFROM ETUDIANT E1, ETUDIANT E2\nWHERE E1.Cdsexe = 'H'\n  AND E2.Cdsexe = 'F'\n  AND ABS(DATEDIFF(E1.Dtnaiss, E2.Dtnaiss)) <= 180;",
          explain: "DATEDIFF(E1.Dtnaiss, E2.Dtnaiss) donne l'écart en jours (positif ou négatif). ABS(...) prend la valeur absolue (ou on écrit BETWEEN -180 AND 180).",
          trace: [
            { status: "no", label: "Bassem & Asma (561 j) / Bassem & Souhir (449 j)", detail: "> 180 jours → écartés" },
            { status: "ok", label: "Bassem (2004-11-23) & Wissal (2004-07-19)", detail: "|DATEDIFF| = 127 jours <= 180 → COUPLE RETENU !" },
            { status: "no", label: "Karim & Wissal (210 j)", detail: "210 > 180 jours → écarté" }
          ]
        }
      ],
      resultCols: ["Nom_Garcon", "Nom_Fille"],
      resultRows: [
        { Nom_Garcon: "Bassem Hdhili", Nom_Fille: "Wissal Wertani" }
      ]
    },
    {
      num: 12,
      shortTitle: "Couples (Étudiant, Matière) sans note",
      question: "Pour les étudiants n'ayant pas de note dans une matière, afficher le numéro, le nom de l'étudiant et le nom de la matière concernée.",
      tables: ["ETUDIANT", "MATIERE", "NOTES"],
      notions: ["Produit (ETUDIANT, MATIERE)", "Sous-requête corrélée NOT IN"],
      steps: [
        {
          badge: "Étape 1 · Couples (ETUDIANT E, MATIERE M)",
          clause: "FROM ETUDIANT E, MATIERE M",
          sqlSoFar: "FROM ETUDIANT E, MATIERE M",
          explain: "On cherche pour chaque étudiant E quelle matière M lui manque : on part donc de tous les couples possibles (ETUDIANT E, MATIERE M) (5 × 4 = 20 couples).",
          trace: [
            { status: "info", label: "20 couples (E, M) générés", detail: "Chaque étudiant est associé aux 4 matières pour tester lesquelles n'ont pas de note" }
          ]
        },
        {
          badge: "Étape 2 · Sous-requête corrélée sur M.Numat",
          clause: "WHERE E.Numetu NOT IN (SELECT N.Numetu FROM NOTES N WHERE N.Numat = M.Numat)",
          sqlSoFar: "SELECT E.Numetu, E.Nometu, M.Nomat\nFROM ETUDIANT E, MATIERE M\nWHERE E.Numetu NOT IN (\n  SELECT N.Numetu\n  FROM NOTES N\n  WHERE N.Numat = M.Numat\n);",
          explain: "Pour la matière M.Numat en cours, la sous-requête renvoie les Numetu qui ONT une note dans cette matière. NOT IN garde les étudiants qui n'ont PAS de note dans cette matière M.",
          trace: [
            { status: "ok", label: "Asma (Numetu=1)", detail: "Manque : Sociologie" },
            { status: "ok", label: "Bassem (Numetu=2)", detail: "Manque : Histoire, Sociologie" },
            { status: "no", label: "Souhir (Numetu=3)", detail: "A toutes ses notes → 0 matière manquante" },
            { status: "ok", label: "Karim (Numetu=4)", detail: "Manque : Informatique, Mathématiques, Sociologie" },
            { status: "ok", label: "Wissal (Numetu=5)", detail: "Manque : Mathématiques, Sociologie" }
          ]
        }
      ],
      resultCols: ["Numetu", "Nometu", "Nomat"],
      resultRows: [
        { Numetu: 1, Nometu: "Asma Ben Mahmoud", Nomat: "Sociologie" },
        { Numetu: 2, Nometu: "Bassem Hdhili", Nomat: "Histoire" },
        { Numetu: 2, Nometu: "Bassem Hdhili", Nomat: "Sociologie" },
        { Numetu: 4, Nometu: "Karim Hfayedh", Nomat: "Informatique" },
        { Numetu: 4, Nometu: "Karim Hfayedh", Nomat: "Mathématiques" },
        { Numetu: 4, Nometu: "Karim Hfayedh", Nomat: "Sociologie" },
        { Numetu: 5, Nometu: "Wissal Wertani", Nomat: "Mathématiques" },
        { Numetu: 5, Nometu: "Wissal Wertani", Nomat: "Sociologie" }
      ]
    },
    {
      num: 13,
      shortTitle: "Matières avec moyenne < 10 et leur enseignant",
      question: "Afficher les matières pour lesquelles la moyenne des notes est inférieure à 10. Afficher le nom de l'enseignant correspondant.",
      tables: ["ENSEIGNANT", "MATIERE", "NOTES"],
      notions: ["Double jointure a.x = b.x", "GROUP BY", "HAVING AVG(Note) < 10"],
      steps: [
        {
          badge: "Étape 1 · Double jointure (a.x = b.x)",
          clause: "FROM ENSEIGNANT E, MATIERE M, NOTES N WHERE E.Numens = M.Numens AND M.Numat = N.Numat",
          sqlSoFar: "FROM ENSEIGNANT E, MATIERE M, NOTES N\nWHERE E.Numens = M.Numens\n  AND M.Numat = N.Numat",
          explain: "On relie ENSEIGNANT E à MATIERE M (E.Numens = M.Numens) et MATIERE M à NOTES N (M.Numat = N.Numat).",
          trace: [
            { status: "info", label: "Moyennes calculées par matière", detail: "Informatique : 14.38 | Mathématiques : 12.17 | Histoire : 11.38 | Sociologie : 16.0" }
          ]
        },
        {
          badge: "Étape 2 · GROUP BY + HAVING AVG(N.Note) < 10",
          clause: "GROUP BY M.Numat, M.Nomat, E.Numens, E.Nomens HAVING AVG(N.Note) < 10",
          sqlSoFar: "SELECT M.Nomat, E.Nomens, AVG(N.Note) AS Moyenne\nFROM ENSEIGNANT E, MATIERE M, NOTES N\nWHERE E.Numens = M.Numens\n  AND M.Numat = N.Numat\nGROUP BY M.Numat, M.Nomat, E.Numens, E.Nomens\nHAVING AVG(N.Note) < 10;",
          explain: "On regroupe par matière et enseignant, puis HAVING AVG(N.Note) < 10 filtre uniquement les matières dont la moyenne est strictement inférieure à 10.",
          trace: [
            { status: "info", label: "Test HAVING AVG(N.Note) < 10", detail: "Seules les matières dont la moyenne des notes est < 10 sont conservées" }
          ]
        }
      ],
      resultCols: ["Nomat", "Nomens", "Moyenne"],
      resultRows: [
        { Nomat: "(Aucune matière < 10 dans le jeu d'essai : min = 11.38 en Histoire)", Nomens: "—", Moyenne: "—" }
      ]
    },
    {
      num: 14,
      shortTitle: "Meilleure note de chaque matière et étudiant",
      question: "Afficher, pour chaque matière, quelle est la meilleure note et quel est l'étudiant qui l'a obtenue.",
      tables: ["MATIERE", "NOTES", "ETUDIANT"],
      notions: ["Jointure a.x = b.x", "Sous-requête corrélée MAX(Note)"],
      steps: [
        {
          badge: "Étape 1 · Jointure des 3 tables",
          clause: "FROM MATIERE M, NOTES N, ETUDIANT E WHERE N.Numat = M.Numat AND E.Numetu = N.Numetu",
          sqlSoFar: "FROM MATIERE M, NOTES N, ETUDIANT E\nWHERE N.Numat = M.Numat\n  AND E.Numetu = N.Numetu",
          explain: "On relie chaque note N à sa matière M (N.Numat = M.Numat) et à l'étudiant E qui l'a obtenue (E.Numetu = N.Numetu).",
          trace: [
            { status: "info", label: "Pourquoi ne pas faire juste GROUP BY M.Nomat ?", detail: "Parce qu'un simple GROUP BY M.Nomat avec MAX(N.Note) ne permet pas de savoir QUEL étudiant E.Nometu a obtenu cette note maximale !" }
          ]
        },
        {
          badge: "Étape 2 · Sous-requête corrélée MAX(N2.Note)",
          clause: "AND N.Note = (SELECT MAX(N2.Note) FROM NOTES N2 WHERE N2.Numat = M.Numat)",
          sqlSoFar: "SELECT M.Nomat, N.Note AS Meilleure_Note, E.Nometu\nFROM MATIERE M, NOTES N, ETUDIANT E\nWHERE N.Numat = M.Numat\n  AND E.Numetu = N.Numetu\n  AND N.Note = (\n    SELECT MAX(N2.Note)\n    FROM NOTES N2\n    WHERE N2.Numat = M.Numat\n  );",
          explain: "Pour chaque matière M.Numat, la sous-requête corrélée cherche la note maximale MAX(N2.Note) de cette matière, et la requête principale garde l'étudiant ayant obtenu cette note.",
          trace: [
            { status: "ok", label: "Informatique (MAX = 18.0)", detail: "Souhir Korbsi (18.0)" },
            { status: "ok", label: "Mathématiques (MAX = 15.5)", detail: "Souhir Korbsi (15.5)" },
            { status: "ok", label: "Histoire (MAX = 14.0)", detail: "Asma Ben Mahmoud (14.0)" },
            { status: "ok", label: "Sociologie (MAX = 16.0)", detail: "Souhir Korbsi (16.0)" }
          ]
        }
      ],
      resultCols: ["Nomat", "Meilleure_Note", "Nometu"],
      resultRows: [
        { Nomat: "Informatique", Meilleure_Note: 18.0, Nometu: "Souhir Korbsi" },
        { Nomat: "Mathématiques", Meilleure_Note: 15.5, Nometu: "Souhir Korbsi" },
        { Nomat: "Histoire", Meilleure_Note: 14.0, Nometu: "Asma Ben Mahmoud" },
        { Nomat: "Sociologie", Meilleure_Note: 16.0, Nometu: "Souhir Korbsi" }
      ]
    },
    {
      num: 15,
      shortTitle: "Moyenne par sexe chez Ali Ben Salah",
      question: "Afficher, pour chaque sexe (Homme, Femme) la moyenne des notes dans la matière enseignée par Ali Ben Salah.",
      tables: ["SEXE", "ETUDIANT", "NOTES", "MATIERE", "ENSEIGNANT"],
      notions: ["Chaîne de 4 jointures a.x = b.x", "UPPER()", "AVG()", "GROUP BY"],
      steps: [
        {
          badge: "Étape 1 · Chaîne de 4 jointures (5 tables)",
          clause: "FROM SEXE S, ETUDIANT E, NOTES N, MATIERE M, ENSEIGNANT G WHERE S.Cdsexe = E.Cdsexe AND E.Numetu = N.Numetu AND N.Numat = M.Numat AND M.Numens = G.Numens",
          sqlSoFar: "FROM SEXE S, ETUDIANT E, NOTES N, MATIERE M, ENSEIGNANT G\nWHERE S.Cdsexe = E.Cdsexe\n  AND E.Numetu = N.Numetu\n  AND N.Numat = M.Numat\n  AND M.Numens = G.Numens",
          explain: "Cette requête traverse les 5 tables de la base grâce à 4 égalités de la forme a.x = b.x : SEXE S ↔ ETUDIANT E ↔ NOTES N ↔ MATIERE M ↔ ENSEIGNANT G.",
          trace: [
            { status: "ok", label: "Chaîne complète de jointures", detail: "S.Cdsexe = E.Cdsexe → E.Numetu = N.Numetu → N.Numat = M.Numat → M.Numens = G.Numens" }
          ]
        },
        {
          badge: "Étape 2 · Filtre sur l'enseignant Ali Ben Salah",
          clause: "AND UPPER(G.Nomens) = 'ALI BEN SALAH'",
          sqlSoFar: "FROM SEXE S, ETUDIANT E, NOTES N, MATIERE M, ENSEIGNANT G\nWHERE S.Cdsexe = E.Cdsexe\n  AND E.Numetu = N.Numetu\n  AND N.Numat = M.Numat\n  AND M.Numens = G.Numens\n  AND UPPER(G.Nomens) = 'ALI BEN SALAH'",
          explain: "On filtre uniquement les notes obtenues dans une matière assurée par Ali Ben Salah (Numens = 101 : Informatique et Sociologie).",
          trace: [
            { status: "info", label: "Notes retenues pour 'Fille'", detail: "Asma (15.5), Souhir (18.0 et 16.0), Wissal (13.0) → 4 notes" },
            { status: "info", label: "Notes retenues pour 'Garçon'", detail: "Bassem (11.0) → 1 note" }
          ]
        },
        {
          badge: "Étape 3 · GROUP BY S.Cdsexe, S.Lbsexe + AVG(N.Note)",
          clause: "GROUP BY S.Cdsexe, S.Lbsexe",
          sqlSoFar: "SELECT S.Lbsexe, AVG(N.Note) AS Moyenne\nFROM SEXE S, ETUDIANT E, NOTES N, MATIERE M, ENSEIGNANT G\nWHERE S.Cdsexe = E.Cdsexe\n  AND E.Numetu = N.Numetu\n  AND N.Numat = M.Numat\n  AND M.Numens = G.Numens\n  AND UPPER(G.Nomens) = 'ALI BEN SALAH'\nGROUP BY S.Cdsexe, S.Lbsexe;",
          explain: "On regroupe par sexe et on calcule directement AVG(N.Note) AS Moyenne pour chaque groupe.",
          trace: [
            { status: "ok", label: "Groupe 'Fille'", detail: "AVG(15.5, 18.0, 16.0, 13.0) = 15.63" },
            { status: "ok", label: "Groupe 'Garçon'", detail: "AVG(11.0) = 11.00" }
          ]
        }
      ],
      resultCols: ["Lbsexe", "Moyenne"],
      resultRows: [
        { Lbsexe: "Fille", Moyenne: "15.63" },
        { Lbsexe: "Garçon", Moyenne: "11.00" }
      ]
    }
  ];

  function escHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function injectStyles() {
    if (document.getElementById("tpbd-anim-styles")) return;
    var st = document.createElement("style");
    st.id = "tpbd-anim-styles";
    st.textContent =
      ".tpbd-studio{margin:18px 0 24px;border:2.5px solid #1a365d;border-radius:14px;background:linear-gradient(180deg,#f8fafc 0%,#eef5ff 100%);box-shadow:0 8px 24px rgba(26,54,93,.12);overflow:hidden;font-family:'Segoe UI',Arial,sans-serif;}" +
      ".tpbd-studio-head{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;padding:12px 16px;background:linear-gradient(120deg,#1a365d,#2b6cb0);color:#fff;}" +
      ".tpbd-studio-head h3{margin:0;font-size:1.05rem;display:flex;align-items:center;gap:8px;}" +
      ".tpbd-q-pills{display:flex;flex-wrap:wrap;gap:5px;padding:10px 14px;background:#e2e8f0;border-bottom:1px solid #cbd5e1;}" +
      ".tpbd-q-pill{border:1.5px solid #1a365d;background:#fff;color:#1a365d;font-weight:800;font-size:12px;padding:5px 10px;border-radius:999px;cursor:pointer;transition:all .15s;}" +
      ".tpbd-q-pill:hover{background:#dbeafe;transform:translateY(-1px);}" +
      ".tpbd-q-pill.active{background:#1a365d;color:#ffd54f;box-shadow:0 2px 6px rgba(26,54,93,.3);}" +
      ".tpbd-studio-body{padding:14px 16px;}" +
      ".tpbd-q-banner{display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:10px;background:#fff;border:1.5px solid #cbd5e1;border-left:5px solid #2b6cb0;border-radius:10px;padding:10px 14px;margin-bottom:12px;}" +
      ".tpbd-q-title{font-weight:800;color:#1a365d;font-size:.98rem;margin-bottom:4px;}" +
      ".tpbd-q-notions{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px;}" +
      ".tpbd-notion-tag{font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;background:#dbeafe;color:#1e40af;border:1px solid #93c5fd;}" +
      ".tpbd-schema-bar{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;align-items:center;}" +
      ".tpbd-table-chip{font-family:Consolas,monospace;font-size:11.5px;padding:4px 9px;border-radius:6px;border:1.5px solid #cbd5e1;background:#f1f5f9;color:#64748b;transition:all .2s;}" +
      ".tpbd-table-chip.used{border-color:#16a34a;background:#dcfce7;color:#14532d;font-weight:800;transform:scale(1.03);}" +
      ".tpbd-controls{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-bottom:12px;}" +
      ".tpbd-btn{border:1.5px solid #1a365d;background:#fff;color:#1a365d;font-weight:800;font-size:12px;padding:6px 12px;border-radius:8px;cursor:pointer;transition:all .14s;}" +
      ".tpbd-btn:hover{background:#ebf8ff;}" +
      ".tpbd-btn.primary{background:#16a34a;border-color:#15803d;color:#fff;}" +
      ".tpbd-btn.primary:hover{background:#15803d;}" +
      ".tpbd-btn.accent{background:#2b6cb0;border-color:#1a365d;color:#fff;}" +
      ".tpbd-step-dots{display:flex;wrap:wrap;gap:6px;margin-left:auto;align-items:center;}" +
      ".tpbd-step-dot{font-size:11.5px;font-weight:800;padding:4px 9px;border-radius:999px;border:1.5px solid #94a3b8;background:#fff;color:#475569;cursor:pointer;}" +
      ".tpbd-step-dot.done{border-color:#16a34a;background:#dcfce7;color:#14532d;}" +
      ".tpbd-step-dot.current{border-color:#1a365d;background:#fef08a;color:#1a202c;transform:scale(1.05);}" +
      ".tpbd-grid{display:grid;grid-template-columns:minmax(0,1.08fr) minmax(0,1fr);gap:12px;margin-bottom:12px;}" +
      "@media(max-width:800px){.tpbd-grid{grid-template-columns:1fr;}}" +
      ".tpbd-code-box{background:#0f172a;color:#e2e8f0;border:2px solid #1e293b;border-radius:10px;overflow:hidden;display:flex;flex-direction:column;}" +
      ".tpbd-code-head{background:#1e293b;padding:7px 12px;font-size:12px;font-weight:800;color:#fbbf24;display:flex;justify-content:space-between;align-items:center;}" +
      ".tpbd-code-pre{margin:0;padding:12px;font-family:Consolas,monospace;font-size:13px;line-height:1.55;white-space:pre-wrap;color:#f8fafc;flex:1;}" +
      ".tpbd-clause-focus{background:rgba(250,204,21,.22);border-left:3px solid #facc15;padding:4px 8px;margin-top:8px;font-family:Consolas,monospace;font-size:12px;color:#fef08a;}" +
      ".tpbd-explain-box{background:#fff;border:1.5px solid #cbd5e1;border-radius:10px;padding:11px 13px;display:flex;flex-direction:column;gap:8px;}" +
      ".tpbd-explain-title{font-weight:800;font-size:13px;color:#1e40af;}" +
      ".tpbd-explain-text{font-size:13px;color:#1e293b;line-height:1.48;}" +
      ".tpbd-trace-list{display:flex;flex-direction:column;gap:6px;margin-top:4px;}" +
      ".tpbd-trace-item{padding:7px 10px;border-radius:8px;font-size:12.2px;border-left:4px solid #64748b;background:#f8fafc;animation:tpbdPop .3s ease;}" +
      ".tpbd-trace-item.ok{border-left-color:#16a34a;background:#f0fdf4;color:#14532d;}" +
      ".tpbd-trace-item.no{border-left-color:#dc2626;background:#fef2f2;color:#7f1d1d;}" +
      ".tpbd-trace-item.info{border-left-color:#2563eb;background:#eff6ff;color:#1e3a8a;}" +
      "@keyframes tpbdPop{0%{opacity:.3;transform:translateY(4px);}100%{opacity:1;transform:translateY(0);}}" +
      ".tpbd-res-box{background:#fff;border:1.5px solid #cbd5e1;border-radius:10px;overflow:hidden;}" +
      ".tpbd-res-head{background:linear-gradient(120deg,#0f766e,#0284c7);color:#fff;padding:7px 12px;font-size:12.5px;font-weight:800;display:flex;justify-content:space-between;align-items:center;}" +
      ".tpbd-res-table{width:100%;border-collapse:collapse;font-size:12.5px;}" +
      ".tpbd-res-table th,.tpbd-res-table td{padding:6px 10px;border-bottom:1px solid #e2e8f0;text-align:left;}" +
      ".tpbd-res-table th{background:#f1f5f9;color:#1e293b;font-weight:800;}" +
      ".btn-anim-inline{margin-left:6px;background:#fef08a;color:#1a365d;border:1.5px solid #1a365d;border-radius:5px;padding:2px 8px;font-size:.78em;font-weight:800;cursor:pointer;}" +
      ".btn-anim-inline:hover{background:#fde047;}" +
      "@media print{.tpbd-studio,.btn-anim-inline{display:none!important;}}";
    document.head.appendChild(st);
  }

  function buildStudioDOM() {
    injectStyles();
    var anchor = document.getElementById("tpbd-anim- studio-mount");
    if (!anchor) {
      anchor = document.createElement("div");
      anchor.id = "tpbd-anim-studio-mount";
      var firstOl = document.querySelector("ol");
      if (firstOl && firstOl.parentNode) {
        firstOl.parentNode.insertBefore(anchor, firstOl);
      } else {
        document.body.appendChild(anchor);
      }
    }

    var pillsHtml = "";
    for (var i = 0; i < QUERIES.length; i++) {
      pillsHtml +=
        '<button type="button" class="tpbd-q-pill' +
        (i === 0 ? " active" : "") +
        '" data-qidx="' +
        i +
        '" title="Requête ' +
        QUERIES[i].num +
        " : " +
        escHtml(QUERIES[i].shortTitle) +
        '">R' +
        QUERIES[i].num +
        "</button>";
    }

    anchor.innerHTML =
      '<section class="tpbd-studio" id="tpbd-studio-box" aria-label="Animation pas à pas des 15 requêtes SQL">' +
      '  <div class="tpbd-studio-head">' +
      '    <h3>🎬 Animation Interactive Pas à Pas — Correction des 15 Requêtes (R1 à R15)</h3>' +
      '    <div style="display:flex;gap:6px;align-items:center">' +
      '      <button type="button" class="tpbd-btn" id="tpbd-prev-q" style="padding:4px 9px">◀ Req. préc.</button>' +
      '      <button type="button" class="tpbd-btn" id="tpbd-next-q" style="padding:4px 9px">Req. suiv. ▶</button>' +
      '    </div>' +
      "  </div>" +
      '  <div class="tpbd-q-pills" id="tpbd-q-pills">' +
      pillsHtml +
      "  </div>" +
      '  <div class="tpbd-studio-body">' +
      '    <div class="tpbd-q-banner">' +
      '      <div style="flex:1;min-width:240px">' +
      '        <div class="tpbd-q-title" id="tpbd-q-title"></div>' +
      '        <div style="font-size:13.5px;color:#334155" id="tpbd-q-question"></div>' +
      '        <div class="tpbd-q-notions" id="tpbd-q-notions"></div>' +
      "      </div>" +
      "    </div>" +
      '    <div class="tpbd-schema-bar" id="tpbd-schema-bar"></div>' +
      '    <div class="tpbd-controls">' +
      '      <button type="button" class="tpbd-btn primary" id="tpbd-btn-play">▶ Animer pas à pas</button>' +
      '      <button type="button" class="tpbd-btn" id="tpbd-btn-prev-step">◀ Étape préc.</button>' +
      '      <button type="button" class="tpbd-btn" id="tpbd-btn-next-step">Étape suiv. ▶</button>' +
      '      <button type="button" class="tpbd-btn" id="tpbd-btn-reset">⏮ Début</button>' +
      '      <button type="button" class="tpbd-btn accent" id="tpbd-btn-all">⚡ Requête complète</button>' +
      '      <div class="tpbd-step-dots" id="tpbd-step-dots"></div>' +
      "    </div>" +
      '    <div class="tpbd-grid">' +
      '      <div class="tpbd-code-box">' +
      '        <div class="tpbd-code-head">' +
      '          <span id="tpbd-code-step-lbl">📝 Construction SQL pas à pas</span>' +
      '          <button type="button" class="tpbd-btn" id="tpbd-btn-copy" style="padding:2px 8px;font-size:11px">📋 Copier SQL</button>' +
      "        </div>" +
      '        <pre class="tpbd-code-pre" id="tpbd-code-pre"></pre>' +
      '        <div class="tpbd-clause-focus" id="tpbd-clause-focus"></div>' +
      "      </div>" +
      '      <div class="tpbd-explain-box">' +
      '        <div class="tpbd-explain-title" id="tpbd-explain-title"></div>' +
      '        <div class="tpbd-explain-text" id="tpbd-explain-text"></div>' +
      '        <div class="tpbd-trace-list" id="tpbd-trace-list"></div>' +
      "      </div>" +
      "    </div>" +
      '    <div class="tpbd-res-box">' +
      '      <div class="tpbd-res-head">' +
      '        <span id="tpbd-res-title">📊 Résultat de la requête sur la base ÉTUDIANT</span>' +
      '        <span id="tpbd-res-count" style="font-size:11.5px;opacity:.9"></span>' +
      "      </div>" +
      '      <div style="overflow-x:auto">' +
      '        <table class="tpbd-res-table" id="tpbd-res-table"></table>' +
      "      </div>" +
      "    </div>" +
      "  </div>" +
      "</section>";

    var qIdx = 0;
    var stepIdx = 0;
    var timer = null;

    var elTitle = document.getElementById("tpbd-q-title");
    var elQuestion = document.getElementById("tpbd-q-question");
    var elNotions = document.getElementById("tpbd-q-notions");
    var elSchema = document.getElementById("tpbd-schema-bar");
    var elDots = document.getElementById("tpbd-step-dots");
    var elCodeLbl = document.getElementById("tpbd-code-step-lbl");
    var elCodePre = document.getElementById("tpbd-code-pre");
    var elClauseFocus = document.getElementById("tpbd-clause-focus");
    var elExpTitle = document.getElementById("tpbd-explain-title");
    var elExpText = document.getElementById("tpbd-explain-text");
    var elTrace = document.getElementById("tpbd-trace-list");
    var elResTable = document.getElementById("tpbd-res-table");
    var elResCount = document.getElementById("tpbd-res-count");
    var btnPlay = document.getElementById("tpbd-btn-play");

    var ALL_TABLES = [
      { name: "ETUDIANT", cols: "(Numetu, Nometu, Dtnaiss, #Cdsexe)" },
      { name: "SEXE", cols: "(Cdsexe, Lbsexe)" },
      { name: "ENSEIGNANT", cols: "(Numens, Nomens, Grade, Ancien)" },
      { name: "MATIERE", cols: "(Numat, Nomat, Coeff, #Numens)" },
      { name: "NOTES", cols: "(#Numetu, #Numat, Note)" }
    ];

    function stopAnim() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      if (btnPlay) btnPlay.textContent = "▶ Animer pas à pas";
    }

    function render() {
      var q = QUERIES[qIdx];
      var st = q.steps[stepIdx] || q.steps[q.steps.length - 1];

      var pills = document.querySelectorAll("#tpbd-q-pills .tpbd-q-pill");
      for (var p = 0; p < pills.length; p++) {
        pills[p].classList.toggle("active", p === qIdx);
      }

      elTitle.textContent = "Requête " + q.num + " — " + q.shortTitle;
      elQuestion.textContent = "« " + q.question + " »";

      var nHtml = "";
      for (var n = 0; n < q.notions.length; n++) {
        nHtml += '<span class="tpbd-notion-tag">' + escHtml(q.notions[n]) + "</span>";
      }
      elNotions.innerHTML = nHtml;

      var sHtml = '<span style="font-size:12px;font-weight:800;color:#1a365d">🗄️ Tables mobilisées :</span>';
      for (var t = 0; t < ALL_TABLES.length; t++) {
        var tb = ALL_TABLES[t];
        var used = q.tables.indexOf(tb.name) !== -1;
        sHtml +=
          '<span class="tpbd-table-chip' +
          (used ? " used" : "") +
          '">' +
          (used ? "✔ " : "") +
          "<b>" +
          tb.name +
          "</b> " +
          tb.cols +
          "</span>";
      }
      elSchema.innerHTML = sHtml;

      var dHtml = "";
      for (var s = 0; s < q.steps.length; s++) {
        var cls = s < stepIdx ? "done" : s === stepIdx ? "current" : "";
        dHtml +=
          '<button type="button" class="tpbd-step-dot ' +
          cls +
          '" data-sidx="' +
          s +
          '">' +
          escHtml(q.steps[s].badge) +
          "</button>";
      }
      elDots.innerHTML = dHtml;
      var dotBtns = elDots.querySelectorAll(".tpbd-step-dot");
      Array.prototype.forEach.call(dotBtns, function (b) {
        b.addEventListener("click", function () {
          stopAnim();
          stepIdx = parseInt(b.getAttribute("data-sidx") || "0", 10);
          render();
        });
      });

      elCodeLbl.textContent =
        "📝 Requête " + q.num + " — " + st.badge + " (" + (stepIdx + 1) + "/" + q.steps.length + ")";
      elCodePre.textContent = st.sqlSoFar;
      elClauseFocus.innerHTML = "🔍 <b>Clause ajoutée à cette étape :</b> <code>" + escHtml(st.clause) + "</code>";

      elExpTitle.textContent = "💡 Explication de l'" + st.badge;
      elExpText.textContent = st.explain;

      var trHtml = "";
      for (var k = 0; k < st.trace.length; k++) {
        var tr = st.trace[k];
        trHtml +=
          '<div class="tpbd-trace-item ' +
          tr.status +
          '"><b>' +
          escHtml(tr.label) +
          " :</b> " +
          escHtml(tr.detail) +
          "</div>";
      }
      elTrace.innerHTML = trHtml;

      var isFinal = stepIdx === q.steps.length - 1;
      elResCount.textContent = isFinal
        ? "✅ Requête complète (" + q.resultRows.length + " ligne" + (q.resultRows.length > 1 ? "s" : "") + ")"
        : "⏳ Étape " + (stepIdx + 1) + "/" + q.steps.length + " (résultat final affiché ci-dessous)";

      var rHtml = "<thead><tr>";
      for (var c = 0; c < q.resultCols.length; c++) {
        rHtml += "<th>" + escHtml(q.resultCols[c]) + "</th>";
      }
      rHtml += "</tr></thead><tbody>";
      for (var r = 0; r < q.resultRows.length; r++) {
        rHtml += "<tr>";
        for (var rc = 0; rc < q.resultCols.length; rc++) {
          var colName = q.resultCols[rc];
          rHtml += "<td>" + escHtml(q.resultRows[r][colName]) + "</td>";
        }
        rHtml += "</tr>";
      }
      rHtml += "</tbody>";
      elResTable.innerHTML = rHtml;
    }

    function selectQuery(idx, autoPlay) {
      stopAnim();
      if (idx < 0) idx = QUERIES.length - 1;
      if (idx >= QUERIES.length) idx = 0;
      qIdx = idx;
      stepIdx = 0;
      render();
      if (autoPlay) startPlay();
    }

    function startPlay() {
      var q = QUERIES[qIdx];
      if (timer) {
        stopAnim();
        return;
      }
      if (stepIdx >= q.steps.length - 1) {
        stepIdx = 0;
        render();
      }
      btnPlay.textContent = "⏸ Pause";
      timer = setInterval(function () {
        var curQ = QUERIES[qIdx];
        if (stepIdx < curQ.steps.length - 1) {
          stepIdx++;
          render();
        } else {
          stopAnim();
        }
      }, 1500);
    }

    Array.prototype.forEach.call(
      document.querySelectorAll("#tpbd-q-pills .tpbd-q-pill"),
      function (b) {
        b.addEventListener("click", function () {
          selectQuery(parseInt(b.getAttribute("data-qidx") || "0", 10), false);
        });
      }
    );

    document.getElementById("tpbd-prev-q").addEventListener("click", function () {
      selectQuery(qIdx - 1, false);
    });
    document.getElementById("tpbd-next-q").addEventListener("click", function () {
      selectQuery(qIdx + 1, false);
    });
    btnPlay.addEventListener("click", startPlay);
    document.getElementById("tpbd-btn-prev-step").addEventListener("click", function () {
      stopAnim();
      if (stepIdx > 0) {
        stepIdx--;
        render();
      }
    });
    document.getElementById("tpbd-btn-next-step").addEventListener("click", function () {
      stopAnim();
      var q = QUERIES[qIdx];
      if (stepIdx < q.steps.length - 1) {
        stepIdx++;
        render();
      }
    });
    document.getElementById("tpbd-btn-reset").addEventListener("click", function () {
      stopAnim();
      stepIdx = 0;
      render();
    });
    document.getElementById("tpbd-btn-all").addEventListener("click", function () {
      stopAnim();
      stepIdx = QUERIES[qIdx].steps.length - 1;
      render();
    });
    document.getElementById("tpbd-btn-copy").addEventListener("click", function () {
      var q = QUERIES[qIdx];
      var fullSql = q.steps[q.steps.length - 1].sqlSoFar;
      var btn = document.getElementById("tpbd-btn-copy");
      var done = function () {
        btn.textContent = "✓ Copié !";
        setTimeout(function () {
          btn.textContent = "📋 Copier SQL";
        }, 1400);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(fullSql).then(done, done);
      } else {
        done();
      }
    });

    /* Ajouter un bouton « 🎬 Animer » sur chacune des 15 questions de la liste <ol> */
    var lis = document.querySelectorAll("ol > li");
    Array.prototype.forEach.call(lis, function (li, idx) {
      if (idx >= QUERIES.length) return;
      var bAnim = document.createElement("button");
      bAnim.type = "button";
      bAnim.className = "btn-anim-inline";
      bAnim.textContent = "🎬 Animer R" + (idx + 1);
      bAnim.title = "Voir l'animation pas à pas de la Requête " + (idx + 1);
      bAnim.addEventListener("click", function () {
        selectQuery(idx, true);
        var box = document.getElementById("tpbd-studio-box");
        if (box && box.scrollIntoView) {
          box.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
      var existingBtn = li.querySelector(".btn-q-corr");
      if (existingBtn) {
        existingBtn.parentNode.insertBefore(bAnim, existingBtn.nextSibling);
      } else {
        var firstPre = li.querySelector("pre");
        if (firstPre) {
          li.insertBefore(bAnim, firstPre);
        } else {
          li.appendChild(bAnim);
        }
      }
    });

    window.animerRequeteTpBD = function (numRequete) {
      var idx = Math.max(0, Math.min(QUERIES.length - 1, (Number(numRequete) || 1) - 1));
      selectQuery(idx, true);
      var box = document.getElementById("tpbd-studio-box");
      if (box && box.scrollIntoView) {
        box.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildStudioDOM);
  } else {
    buildStudioDOM();
  }
})();
