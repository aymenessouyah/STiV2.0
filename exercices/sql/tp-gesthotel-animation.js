/* ==========================================================================
   Atelier d'Animation Pas à Pas — Série 5 : Gesthotel
   (Date, Jointure WHERE a.x = b.x, Sous-requêtes, GROUP BY, HAVING)
   Utilisé dans :
   - exercices/sql/Tp-date-ssr-j-gp-bd.html
   - exercices/sql/Tp-date-ssr-j-gp-correction-bd.html
   ========================================================================== */
(function () {
  "use strict";

  var DB = {
    CHAMBRE: {
      cols: ["NumCh", "Prix", "Type"],
      rows: [
        ["C01", "250", "S (Simple)"],
        ["C02", "250", "D (Double)"],
        ["C03", "400", "Q (Quadruple)"],
        ["C04", "300", "D (Double)"]
      ]
    },
    RESERVATION: {
      cols: ["NumR", "NumCh#", "NumCl#", "DateDebut", "Nbjours", "pension"],
      rows: [
        ["1", "C01", "CL02", "2022-05-20 12:30", "3", "PC"],
        ["2", "C01", "CL03", "2022-04-07 10:00", "5", "DP"],
        ["3", "C02", "CL01", "2022-06-24 15:00", "10", "ALLIN"],
        ["4", "C03", "CL01", "2022-06-24 15:00", "10", "ALLIN"],
        ["5", "C03", "CL03", "2022-07-17 08:00", "7", "PC"],
        ["6", "C04", "CL02", "2022-06-26 13:30", "4", "DP"]
      ]
    },
    CLIENT: {
      cols: ["NumCl", "Nom", "Adresse"],
      rows: [
        ["CL01", "Ali Trabelsi", "Ariana"],
        ["CL02", "Alia Ben Ahmed", "Tunis"],
        ["CL03", "Sonia Kammoun", "Sfax"]
      ]
    }
  };

  var REQUETES = [
    {
      num: 1,
      code: "R1",
      qIndex: 1,
      cat: "Sélection simple",
      question: "1. Afficher tous les Clients d'Ariana.",
      tables: ["CLIENT"],
      sqlLines: [
        "SELECT *",
        "FROM client",
        "WHERE adresse = 'Ariana';"
      ],
      steps: [
        {
          clause: "FROM client",
          activeLines: [1],
          title: "Étape 1 — Lecture de la table CLIENT",
          explain: "Le SGBD parcourt les 3 clients enregistrés dans la table CLIENT.",
          trace: [
            { badge: "CLIENT", text: "CL01 | Ali Trabelsi | Ariana", status: "info" },
            { badge: "CLIENT", text: "CL02 | Alia Ben Ahmed | Tunis", status: "info" },
            { badge: "CLIENT", text: "CL03 | Sonia Kammoun | Sfax", status: "info" }
          ]
        },
        {
          clause: "WHERE adresse = 'Ariana'",
          activeLines: [1, 2],
          title: "Étape 2 — Filtrage sur la colonne adresse",
          explain: "Seules les lignes dont la colonne adresse vaut 'Ariana' sont retenues.",
          trace: [
            { badge: "✔ Gardé", text: "CL01 — Ali Trabelsi (adresse = 'Ariana')", status: "ok" },
            { badge: "✖ Écarté", text: "CL02 — Alia Ben Ahmed (adresse = 'Tunis' != 'Ariana')", status: "no" },
            { badge: "✖ Écarté", text: "CL03 — Sonia Kammoun (adresse = 'Sfax' != 'Ariana')", status: "no" }
          ]
        },
        {
          clause: "SELECT *",
          activeLines: [0, 1, 2],
          title: "Étape 3 — Projection de toutes les colonnes (*)",
          explain: "SELECT * affiche toutes les colonnes (NumCl, Nom, Adresse) du client retenu.",
          trace: [
            { badge: "Résultat", text: "1 ligne retournée : CL01 | Ali Trabelsi | Ariana", status: "ok" }
          ],
          result: {
            cols: ["NumCl", "Nom", "Adresse"],
            rows: [["CL01", "Ali Trabelsi", "Ariana"]]
          }
        }
      ]
    },
    {
      num: 2,
      code: "R2",
      qIndex: 2,
      cat: "GROUP BY + COUNT",
      question: "2. Donner le nombre de chambres par type de chambre.",
      tables: ["CHAMBRE"],
      sqlLines: [
        "SELECT type, COUNT(*) AS nb_chambre",
        "FROM chambre",
        "GROUP BY type;"
      ],
      steps: [
        {
          clause: "FROM chambre",
          activeLines: [1],
          title: "Étape 1 — Lecture des 4 chambres",
          explain: "Le SGBD lit les 4 lignes de la table CHAMBRE.",
          trace: [
            { badge: "C01", text: "Prix = 250 | Type = 'S'", status: "info" },
            { badge: "C02", text: "Prix = 250 | Type = 'D'", status: "info" },
            { badge: "C03", text: "Prix = 400 | Type = 'Q'", status: "info" },
            { badge: "C04", text: "Prix = 300 | Type = 'D'", status: "info" }
          ]
        },
        {
          clause: "GROUP BY type",
          activeLines: [1, 2],
          title: "Étape 2 — Regroupement par type de chambre (GROUP BY type)",
          explain: "Les chambres ayant le même type ('S', 'D', 'Q') sont rassemblées dans un même paquet.",
          trace: [
            { badge: "Groupe 'D'", text: "{ C02, C04 } → 2 chambres doubles", status: "ok" },
            { badge: "Groupe 'Q'", text: "{ C03 } → 1 chambre quadruple", status: "ok" },
            { badge: "Groupe 'S'", text: "{ C01 } → 1 chambre simple", status: "ok" }
          ]
        },
        {
          clause: "SELECT type, COUNT(*) AS nb_chambre",
          activeLines: [0, 1, 2],
          title: "Étape 3 — Comptage COUNT(*) par groupe",
          explain: "COUNT(*) compte le nombre de lignes dans chaque paquet de type.",
          trace: [
            { badge: "D", text: "nb_chambre = 2", status: "ok" },
            { badge: "Q", text: "nb_chambre = 1", status: "ok" },
            { badge: "S", text: "nb_chambre = 1", status: "ok" }
          ],
          result: {
            cols: ["type", "nb_chambre"],
            rows: [
              ["D", "2"],
              ["Q", "1"],
              ["S", "1"]
            ]
          }
        }
      ]
    },
    {
      num: 3,
      code: "R3",
      qIndex: 3,
      cat: "Sous-requête MIN()",
      question: "3. Trouver les chambres qui coûtent le moins cher.",
      tables: ["CHAMBRE"],
      sqlLines: [
        "SELECT *",
        "FROM chambre",
        "WHERE prix = (",
        "    SELECT MIN(prix) FROM chambre",
        ");"
      ],
      steps: [
        {
          clause: "(SELECT MIN(prix) FROM chambre)",
          activeLines: [3],
          title: "Étape 1 — Exécution de la sous-requête interne MIN(prix)",
          explain: "Le SGBD cherche d'abord le tarif minimum parmi toutes les chambres : MIN(250, 250, 400, 300) = 250.",
          trace: [
            { badge: "Sous-requête", text: "MIN(250, 250, 400, 300) → renvoie 250", status: "info" }
          ]
        },
        {
          clause: "WHERE prix = 250",
          activeLines: [1, 2, 3, 4],
          title: "Étape 2 — Comparaison du prix de chaque chambre à 250",
          explain: "La requête principale sélectionne toutes les chambres dont le prix est égal à 250.",
          trace: [
            { badge: "✔ Gardée", text: "C01 — prix = 250 (Type 'S')", status: "ok" },
            { badge: "✔ Gardée", text: "C02 — prix = 250 (Type 'D')", status: "ok" },
            { badge: "✖ Écartée", text: "C03 — prix = 400 != 250", status: "no" },
            { badge: "✖ Écartée", text: "C04 — prix = 300 != 250", status: "no" }
          ]
        },
        {
          clause: "SELECT *",
          activeLines: [0, 1, 2, 3, 4],
          title: "Étape 3 — Affichage des chambres les moins chères",
          explain: "Les deux chambres à 250 DT (C01 et C02) sont affichées.",
          trace: [
            { badge: "Résultat", text: "2 chambres trouvées : C01 et C02 (Prix = 250)", status: "ok" }
          ],
          result: {
            cols: ["NumCh", "Prix", "Type"],
            rows: [
              ["C01", "250", "S"],
              ["C02", "250", "D"]
            ]
          }
        }
      ]
    },
    {
      num: 4,
      code: "R4",
      qIndex: 4,
      cat: "Jointure WHERE a.x = b.x",
      question: "4. Afficher une liste qui comprend le numéro de réservation, la date d'entrée et le nom du client.",
      tables: ["CLIENT", "RESERVATION"],
      sqlLines: [
        "SELECT r.numr, r.dateDebut, cl.nom",
        "FROM client cl, reservation r",
        "WHERE r.numcl = cl.numcl;"
      ],
      steps: [
        {
          clause: "FROM client cl, reservation r",
          activeLines: [1],
          title: "Étape 1 — Mobilisation des tables CLIENT (cl) et RESERVATION (r)",
          explain: "Le numéro de réservation et la date sont dans RESERVATION (r), tandis que le nom du client est dans CLIENT (cl).",
          trace: [
            { badge: "Tables", text: "3 clients × 6 réservations = 18 combinaisons avant filtrage", status: "info" }
          ]
        },
        {
          clause: "WHERE r.numcl = cl.numcl",
          activeLines: [1, 2],
          title: "Étape 2 — Condition de jointure dans WHERE",
          explain: "La condition r.numcl = cl.numcl relie chaque réservation à son client correspondant.",
          trace: [
            { badge: "✔ R1", text: "r.numcl='CL02' = cl.numcl='CL02' → Alia Ben Ahmed", status: "ok" },
            { badge: "✔ R2", text: "r.numcl='CL03' = cl.numcl='CL03' → Sonia Kammoun", status: "ok" },
            { badge: "✔ R3 & R4", text: "r.numcl='CL01' = cl.numcl='CL01' → Ali Trabelsi", status: "ok" },
            { badge: "✔ R5", text: "r.numcl='CL03' = cl.numcl='CL03' → Sonia Kammoun", status: "ok" },
            { badge: "✔ R6", text: "r.numcl='CL02' = cl.numcl='CL02' → Alia Ben Ahmed", status: "ok" }
          ]
        },
        {
          clause: "SELECT r.numr, r.dateDebut, cl.nom",
          activeLines: [0, 1, 2],
          title: "Étape 3 — Projection de numr, dateDebut et nom",
          explain: "On affiche les 3 colonnes demandées pour les 6 réservations.",
          trace: [
            { badge: "Résultat", text: "6 lignes retournées avec le nom complet du client", status: "ok" }
          ],
          result: {
            cols: ["numr", "dateDebut", "nom"],
            rows: [
              ["1", "2022-05-20 12:30", "Alia Ben Ahmed"],
              ["2", "2022-04-07 10:00", "Sonia Kammoun"],
              ["3", "2022-06-24 15:00", "Ali Trabelsi"],
              ["4", "2022-06-24 15:00", "Ali Trabelsi"],
              ["5", "2022-07-17 08:00", "Sonia Kammoun"],
              ["6", "2022-06-26 13:30", "Alia Ben Ahmed"]
            ]
          }
        }
      ]
    },
    {
      num: 5,
      code: "R5.1",
      qIndex: 5,
      subIndex: 1,
      cat: "Fonctions Date + Jointure",
      question: "5.1 Afficher le numéro de réservation et le nom du client pour les entrées d'aujourd'hui (date de début = date système).",
      tables: ["CLIENT", "RESERVATION"],
      sqlLines: [
        "SELECT r.numr, cl.nom",
        "FROM client cl, reservation r",
        "WHERE r.numcl = cl.numcl",
        "  AND DATE(r.dateDebut) = DATE(NOW());"
      ],
      steps: [
        {
          clause: "FROM client cl, reservation r WHERE r.numcl = cl.numcl",
          activeLines: [1, 2],
          title: "Étape 1 — Jointure entre CLIENT et RESERVATION",
          explain: "On relie chaque réservation à son client via r.numcl = cl.numcl.",
          trace: [
            { badge: "Jointure", text: "Les 6 réservations sont associées aux noms des clients", status: "info" }
          ]
        },
        {
          clause: "AND DATE(r.dateDebut) = DATE(NOW())",
          activeLines: [1, 2, 3],
          title: "Étape 2 — Extraction de la date sans l'heure avec DATE()",
          explain: "Comme dateDebut est de type DATETIME (date + heure), DATE(r.dateDebut) extrait uniquement la partie AAAA-MM-JJ pour la comparer à DATE(NOW()). Exemple si NOW() = '2022-06-24 18:00' :",
          trace: [
            { badge: "✔ R3", text: "DATE('2022-06-24 15:00') = '2022-06-24' = DATE(NOW()) → Ali Trabelsi", status: "ok" },
            { badge: "✔ R4", text: "DATE('2022-06-24 15:00') = '2022-06-24' = DATE(NOW()) → Ali Trabelsi", status: "ok" },
            { badge: "✖ Autres", text: "R1, R2, R5, R6 ont une date différente de DATE(NOW())", status: "no" }
          ]
        },
        {
          clause: "SELECT r.numr, cl.nom",
          activeLines: [0, 1, 2, 3],
          title: "Étape 3 — Projection du numéro de réservation et du nom",
          explain: "Affiche les réservations dont l'entrée a lieu aujourd'hui (ex. en simulant aujourd'hui = 24/06/2022).",
          trace: [
            { badge: "Résultat", text: "Simulation au 2022-06-24 : réservations 3 et 4 (Ali Trabelsi)", status: "ok" }
          ],
          result: {
            cols: ["numr", "nom"],
            rows: [
              ["3", "Ali Trabelsi"],
              ["4", "Ali Trabelsi"]
            ]
          }
        }
      ]
    },
    {
      num: 6,
      code: "R5.2",
      qIndex: 5,
      subIndex: 2,
      cat: "DATE_SUB + INTERVAL 7 DAY",
      question: "5.2 Afficher le numéro de réservation et le nom du client pour les entrées passées au cours des 7 derniers jours.",
      tables: ["CLIENT", "RESERVATION"],
      sqlLines: [
        "SELECT r.numr, cl.nom",
        "FROM client cl, reservation r",
        "WHERE r.numcl = cl.numcl",
        "  AND DATE(r.dateDebut) >= DATE_SUB(NOW(), INTERVAL 7 DAY);"
      ],
      steps: [
        {
          clause: "FROM client cl, reservation r WHERE r.numcl = cl.numcl",
          activeLines: [1, 2],
          title: "Étape 1 — Jointure CLIENT et RESERVATION",
          explain: "Association de chaque réservation avec son client via r.numcl = cl.numcl.",
          trace: [
            { badge: "Jointure", text: "6 réservations reliées aux clients", status: "info" }
          ]
        },
        {
          clause: "AND DATE(r.dateDebut) >= DATE_SUB(NOW(), INTERVAL 7 DAY)",
          activeLines: [1, 2, 3],
          title: "Étape 2 — Calcul de la date limite (NOW() - 7 jours)",
          explain: "DATE_SUB(NOW(), INTERVAL 7 DAY) recule de 7 jours par rapport à la date système. Exemple si aujourd'hui = 2022-06-28, la borne est 2022-06-21 :",
          trace: [
            { badge: "✔ R3 (24/06)", text: "2022-06-24 >= 2022-06-21 → Ali Trabelsi", status: "ok" },
            { badge: "✔ R4 (24/06)", text: "2022-06-24 >= 2022-06-21 → Ali Trabelsi", status: "ok" },
            { badge: "✔ R6 (26/06)", text: "2022-06-26 >= 2022-06-21 → Alia Ben Ahmed", status: "ok" },
            { badge: "✖ R1, R2", text: "Mai et Avril 2022 < 2022-06-21 (écartées)", status: "no" }
          ]
        },
        {
          clause: "SELECT r.numr, cl.nom",
          activeLines: [0, 1, 2, 3],
          title: "Étape 3 — Affichage de numr et nom",
          explain: "On projette le numéro de réservation et le nom du client.",
          trace: [
            { badge: "Résultat", text: "Réservations récentes (>= NOW() - 7 jours)", status: "ok" }
          ],
          result: {
            cols: ["numr", "nom"],
            rows: [
              ["3", "Ali Trabelsi"],
              ["4", "Ali Trabelsi"],
              ["6", "Alia Ben Ahmed"]
            ]
          }
        }
      ]
    },
    {
      num: 7,
      code: "R5.3",
      qIndex: 5,
      subIndex: 3,
      cat: "DATE_SUB + INTERVAL 30 DAY",
      question: "5.3 Afficher le numéro de réservation et le nom du client pour les entrées passées il y a plus de 30 jours.",
      tables: ["CLIENT", "RESERVATION"],
      sqlLines: [
        "SELECT r.numr, cl.nom",
        "FROM client cl, reservation r",
        "WHERE r.numcl = cl.numcl",
        "  AND DATE(r.dateDebut) < DATE_SUB(NOW(), INTERVAL 30 DAY);"
      ],
      steps: [
        {
          clause: "FROM client cl, reservation r WHERE r.numcl = cl.numcl",
          activeLines: [1, 2],
          title: "Étape 1 — Jointure CLIENT et RESERVATION",
          explain: "On relie les tables client et reservation par la clé numcl.",
          trace: [
            { badge: "Jointure", text: "6 réservations reliées à leur client", status: "info" }
          ]
        },
        {
          clause: "AND DATE(r.dateDebut) < DATE_SUB(NOW(), INTERVAL 30 DAY)",
          activeLines: [1, 2, 3],
          title: "Étape 2 — Filtrage des dates antérieures à (NOW() - 30 jours)",
          explain: "On garde uniquement les réservations dont la dateDebut est strictement inférieure à DATE_SUB(NOW(), INTERVAL 30 DAY). Toutes les réservations de 2022 ont plus de 30 jours d'ancienneté :",
          trace: [
            { badge: "✔ R1..R6", text: "Toutes les dates de 2022 sont < DATE_SUB(NOW(), INTERVAL 30 DAY)", status: "ok" }
          ]
        },
        {
          clause: "SELECT r.numr, cl.nom",
          activeLines: [0, 1, 2, 3],
          title: "Étape 3 — Projection du résultat",
          explain: "Affiche le numéro de réservation et le nom du client.",
          trace: [
            { badge: "Résultat", text: "Les 6 réservations de 2022 sont retournées", status: "ok" }
          ],
          result: {
            cols: ["numr", "nom"],
            rows: [
              ["1", "Alia Ben Ahmed"],
              ["2", "Sonia Kammoun"],
              ["3", "Ali Trabelsi"],
              ["4", "Ali Trabelsi"],
              ["5", "Sonia Kammoun"],
              ["6", "Alia Ben Ahmed"]
            ]
          }
        }
      ]
    },
    {
      num: 8,
      code: "R6",
      qIndex: 6,
      cat: "Agrégation AVG()",
      question: "6. Calculer le prix moyen des chambres.",
      tables: ["CHAMBRE"],
      sqlLines: [
        "SELECT AVG(prix) AS prix_moyenne",
        "FROM chambre;"
      ],
      steps: [
        {
          clause: "FROM chambre",
          activeLines: [1],
          title: "Étape 1 — Lecture des prix de toutes les chambres",
          explain: "Le SGBD lit la colonne Prix des 4 chambres : 250, 250, 400 et 300.",
          trace: [
            { badge: "Valeurs", text: "C01: 250 | C02: 250 | C03: 400 | C04: 300", status: "info" }
          ]
        },
        {
          clause: "SELECT AVG(prix) AS prix_moyenne",
          activeLines: [0, 1],
          title: "Étape 2 — Calcul de la moyenne globale AVG(prix)",
          explain: "Sans GROUP BY, AVG(prix) calcule une seule moyenne sur toute la table : (250 + 250 + 400 + 300) / 4 = 1200 / 4 = 300.",
          trace: [
            { badge: "Calcul", text: "(250 + 250 + 400 + 300) / 4 = 300.0000", status: "ok" }
          ],
          result: {
            cols: ["prix_moyenne"],
            rows: [["300.0000"]]
          }
        }
      ]
    },
    {
      num: 9,
      code: "R7",
      qIndex: 7,
      cat: "GROUP BY + AVG()",
      question: "7. Calculer le prix moyen des chambres par type de chambre.",
      tables: ["CHAMBRE"],
      sqlLines: [
        "SELECT AVG(prix) AS prix_moyenne, type",
        "FROM chambre",
        "GROUP BY type;"
      ],
      steps: [
        {
          clause: "FROM chambre",
          activeLines: [1],
          title: "Étape 1 — Lecture de la table CHAMBRE",
          explain: "Lecture des 4 chambres avec leur type et leur prix.",
          trace: [
            { badge: "CHAMBRE", text: "C01(250, S), C02(250, D), C03(400, Q), C04(300, D)", status: "info" }
          ]
        },
        {
          clause: "GROUP BY type",
          activeLines: [1, 2],
          title: "Étape 2 — Regroupement par type de chambre",
          explain: "Les chambres sont regroupées en 3 paquets selon leur colonne type ('D', 'Q', 'S').",
          trace: [
            { badge: "Groupe 'D'", text: "Prix : [250, 300]", status: "info" },
            { badge: "Groupe 'Q'", text: "Prix : [400]", status: "info" },
            { badge: "Groupe 'S'", text: "Prix : [250]", status: "info" }
          ]
        },
        {
          clause: "SELECT AVG(prix) AS prix_moyenne, type",
          activeLines: [0, 1, 2],
          title: "Étape 3 — Moyenne AVG(prix) dans chaque groupe",
          explain: "AVG(prix) est calculée séparément pour chaque type de chambre.",
          trace: [
            { badge: "Type 'D'", text: "AVG(250, 300) = 275.0000", status: "ok" },
            { badge: "Type 'Q'", text: "AVG(400) = 400.0000", status: "ok" },
            { badge: "Type 'S'", text: "AVG(250) = 250.0000", status: "ok" }
          ],
          result: {
            cols: ["prix_moyenne", "type"],
            rows: [
              ["275.0000", "D"],
              ["400.0000", "Q"],
              ["250.0000", "S"]
            ]
          }
        }
      ]
    },
    {
      num: 10,
      code: "R8",
      qIndex: 8,
      cat: "Sélection WHERE",
      question: "8. Lister toutes les réservations du client CL03.",
      tables: ["RESERVATION"],
      sqlLines: [
        "SELECT *",
        "FROM reservation",
        "WHERE numcl = 'CL03';"
      ],
      steps: [
        {
          clause: "FROM reservation",
          activeLines: [1],
          title: "Étape 1 — Lecture de la table RESERVATION",
          explain: "On parcourt les 6 lignes de la table RESERVATION.",
          trace: [
            { badge: "RESERVATION", text: "6 réservations (NumR 1 à 6)", status: "info" }
          ]
        },
        {
          clause: "WHERE numcl = 'CL03'",
          activeLines: [1, 2],
          title: "Étape 2 — Filtrage sur numcl = 'CL03'",
          explain: "On garde uniquement les réservations dont le code client est 'CL03'.",
          trace: [
            { badge: "✔ NumR 2", text: "C01 | CL03 | 2022-04-07 10:00 | 5 jours | DP", status: "ok" },
            { badge: "✔ NumR 5", text: "C03 | CL03 | 2022-07-17 08:00 | 7 jours | PC", status: "ok" },
            { badge: "✖ Autres", text: "NumR 1, 3, 4, 6 appartiennent à CL01 ou CL02", status: "no" }
          ]
        },
        {
          clause: "SELECT *",
          activeLines: [0, 1, 2],
          title: "Étape 3 — Affichage complet des réservations retenues",
          explain: "Les 2 réservations du client CL03 sont affichées.",
          trace: [
            { badge: "Résultat", text: "2 réservations trouvées (NumR 2 et NumR 5)", status: "ok" }
          ],
          result: {
            cols: ["NumR", "NumCh", "NumCl", "DateDebut", "Nbjours", "pension"],
            rows: [
              ["2", "C01", "CL03", "2022-04-07 10:00", "5", "DP"],
              ["5", "C03", "CL03", "2022-07-17 08:00", "7", "PC"]
            ]
          }
        }
      ]
    },
    {
      num: 11,
      code: "R9",
      qIndex: 9,
      cat: "Jointure + SUM(prix * nbjours)",
      question: "9. Calculer le montant total de la facture en cours du client CL03.",
      tables: ["RESERVATION", "CHAMBRE"],
      sqlLines: [
        "SELECT R.numcl, SUM(ch.prix * R.nbjours) AS facture",
        "FROM reservation R, chambre ch",
        "WHERE ch.numch = R.numch",
        "  AND R.numcl = 'CL03'",
        "GROUP BY R.numcl;"
      ],
      steps: [
        {
          clause: "FROM reservation R, chambre ch WHERE ch.numch = R.numch",
          activeLines: [1, 2],
          title: "Étape 1 — Jointure RESERVATION et CHAMBRE",
          explain: "Pour calculer le montant d'un séjour, il faut multiplier Nbjours (dans RESERVATION) par Prix (dans CHAMBRE). On les relie via ch.numch = R.numch.",
          trace: [
            { badge: "Jointure", text: "Chaque réservation récupère le prix unitaire de sa chambre", status: "info" }
          ]
        },
        {
          clause: "AND R.numcl = 'CL03'",
          activeLines: [1, 2, 3],
          title: "Étape 2 — Restriction au client CL03",
          explain: "On ne garde que les séjours du client CL03 (NumR 2 et NumR 5).",
          trace: [
            { badge: "✔ NumR 2", text: "Chambre C01 (prix = 250) × 5 jours = 1250 DT", status: "ok" },
            { badge: "✔ NumR 5", text: "Chambre C03 (prix = 400) × 7 jours = 2800 DT", status: "ok" }
          ]
        },
        {
          clause: "GROUP BY R.numcl + SELECT SUM(ch.prix * R.nbjours)",
          activeLines: [0, 1, 2, 3, 4],
          title: "Étape 3 — Somme totale de la facture (SUM)",
          explain: "SUM(prix * nbjours) additionne les montants des séjours de CL03 : 1250 + 2800 = 4050 DT.",
          trace: [
            { badge: "Facture CL03", text: "1250 + 2800 = 4050 DT", status: "ok" }
          ],
          result: {
            cols: ["numcl", "facture"],
            rows: [["CL03", "4050"]]
          }
        }
      ]
    },
    {
      num: 12,
      code: "R10",
      qIndex: 10,
      cat: "Jointure + Intervalle de Dates",
      question: "10. Lister les noms des clients résidant actuellement à l'hôtel.",
      tables: ["CLIENT", "RESERVATION"],
      sqlLines: [
        "SELECT C.nom",
        "FROM client C, reservation R",
        "WHERE C.numcl = R.numcl",
        "  AND DATE(R.dateDebut) + R.nbjours >= DATE(NOW())",
        "  AND DATE(R.dateDebut) <= DATE(NOW());"
      ],
      steps: [
        {
          clause: "FROM client C, reservation R WHERE C.numcl = R.numcl",
          activeLines: [1, 2],
          title: "Étape 1 — Jointure CLIENT et RESERVATION",
          explain: "On relie chaque réservation au nom de son client via C.numcl = R.numcl.",
          trace: [
            { badge: "Jointure", text: "6 séjours reliés aux clients", status: "info" }
          ]
        },
        {
          clause: "AND DATE(dateDebut) + nbjours >= DATE(NOW()) AND DATE(dateDebut) <= DATE(NOW())",
          activeLines: [1, 2, 3, 4],
          title: "Étape 2 — Vérification que la date actuelle est comprise dans le séjour",
          explain: "Un client réside actuellement à l'hôtel si sa date d'arrivée est passée ou aujourd'hui (DATE(dateDebut) <= DATE(NOW())) ET sa date de départ (DATE(dateDebut) + nbjours) n'est pas encore dépassée (>= DATE(NOW())). Exemple si NOW() = 2022-06-27 :",
          trace: [
            { badge: "✔ R3 & R4", text: "Arrivée 24/06 + 10j = 04/07 >= 27/06 → Ali Trabelsi réside à l'hôtel", status: "ok" },
            { badge: "✔ R6", text: "Arrivée 26/06 + 4j = 30/06 >= 27/06 → Alia Ben Ahmed réside à l'hôtel", status: "ok" },
            { badge: "✖ R1, R2, R5", text: "Séjours terminés (Avril/Mai) ou non commencés (Juillet)", status: "no" }
          ]
        },
        {
          clause: "SELECT C.nom",
          activeLines: [0, 1, 2, 3, 4],
          title: "Étape 3 — Affichage des noms des clients présents",
          explain: "On projette le nom des clients dont le séjour est en cours.",
          trace: [
            { badge: "Résultat", text: "Clients présents (simulation au 27/06/2022) : Ali Trabelsi, Alia Ben Ahmed", status: "ok" }
          ],
          result: {
            cols: ["nom"],
            rows: [
              ["Ali Trabelsi"],
              ["Ali Trabelsi"],
              ["Alia Ben Ahmed"]
            ]
          }
        }
      ]
    },
    {
      num: 13,
      code: "R11",
      qIndex: 11,
      cat: "Sous-requête + COUNT(DISTINCT)",
      question: "11. Donner le nombre de clients qui ont choisi les mêmes pensions que le client CL02.",
      tables: ["RESERVATION"],
      sqlLines: [
        "SELECT COUNT(DISTINCT numcl) AS nbrclient",
        "FROM reservation",
        "WHERE pension IN (",
        "    SELECT pension FROM reservation WHERE numcl = 'CL02'",
        ");"
      ],
      steps: [
        {
          clause: "(SELECT pension FROM reservation WHERE numcl = 'CL02')",
          activeLines: [3],
          title: "Étape 1 — Sous-requête : pensions choisies par CL02",
          explain: "Le SGBD cherche d'abord les pensions réservées par CL02 (NumR 1 : 'PC', NumR 6 : 'DP').",
          trace: [
            { badge: "Sous-requête", text: "Pensions de CL02 → ('PC', 'DP')", status: "info" }
          ]
        },
        {
          clause: "WHERE pension IN ('PC', 'DP')",
          activeLines: [1, 2, 3, 4],
          title: "Étape 2 — Sélection des réservations ayant ces pensions",
          explain: "La requête externe garde les réservations dont la pension est 'PC' ou 'DP'.",
          trace: [
            { badge: "✔ NumR 1 & 6", text: "Client CL02 (pensions PC et DP)", status: "ok" },
            { badge: "✔ NumR 2 & 5", text: "Client CL03 (pensions DP et PC)", status: "ok" },
            { badge: "✖ NumR 3 & 4", text: "Client CL01 (pension ALLIN)", status: "no" }
          ]
        },
        {
          clause: "SELECT COUNT(DISTINCT numcl) AS nbrclient",
          activeLines: [0, 1, 2, 3, 4],
          title: "Étape 3 — Comptage sans doublon des clients (COUNT DISTINCT)",
          explain: "COUNT(DISTINCT numcl) compte le nombre de clients distincts : { CL02, CL03 } → 2 clients.",
          trace: [
            { badge: "Résultat", text: "nbrclient = 2 (CL02 et CL03)", status: "ok" }
          ],
          result: {
            cols: ["nbrclient"],
            rows: [["2"]]
          }
        }
      ]
    },
    {
      num: 14,
      code: "R12",
      qIndex: 12,
      cat: "Sous-requête AVG()",
      question: "12. Afficher les réservations dont le séjour est supérieur à la moyenne des séjours.",
      tables: ["RESERVATION"],
      sqlLines: [
        "SELECT *",
        "FROM reservation",
        "WHERE nbjours > (",
        "    SELECT AVG(nbjours) FROM reservation",
        ");"
      ],
      steps: [
        {
          clause: "(SELECT AVG(nbjours) FROM reservation)",
          activeLines: [3],
          title: "Étape 1 — Calcul de la durée moyenne des séjours (sous-requête)",
          explain: "Le SGBD calcule d'abord AVG(nbjours) sur les 6 réservations : (3 + 5 + 10 + 10 + 7 + 4) / 6 = 39 / 6 = 6.5 jours.",
          trace: [
            { badge: "Sous-requête", text: "AVG(3, 5, 10, 10, 7, 4) = 6.5 jours", status: "info" }
          ]
        },
        {
          clause: "WHERE nbjours > 6.5",
          activeLines: [1, 2, 3, 4],
          title: "Étape 2 — Comparaison de chaque réservation à 6.5 jours",
          explain: "Seules les réservations avec nbjours > 6.5 sont conservées.",
          trace: [
            { badge: "✖ NumR 1, 2, 6", text: "nbjours = 3, 5, 4 (<= 6.5 → écartées)", status: "no" },
            { badge: "✔ NumR 3", text: "nbjours = 10 > 6.5", status: "ok" },
            { badge: "✔ NumR 4", text: "nbjours = 10 > 6.5", status: "ok" },
            { badge: "✔ NumR 5", text: "nbjours = 7 > 6.5", status: "ok" }
          ]
        },
        {
          clause: "SELECT *",
          activeLines: [0, 1, 2, 3, 4],
          title: "Étape 3 — Affichage des réservations retenues",
          explain: "Les 3 réservations (NumR 3, 4 et 5) sont affichées.",
          trace: [
            { badge: "Résultat", text: "3 réservations de durée > 6.5 jours", status: "ok" }
          ],
          result: {
            cols: ["NumR", "NumCh", "NumCl", "DateDebut", "Nbjours", "pension"],
            rows: [
              ["3", "C02", "CL01", "2022-06-24 15:00", "10", "ALLIN"],
              ["4", "C03", "CL01", "2022-06-24 15:00", "10", "ALLIN"],
              ["5", "C03", "CL03", "2022-07-17 08:00", "7", "PC"]
            ]
          }
        }
      ]
    },
    {
      num: 15,
      code: "R13",
      qIndex: 13,
      cat: "Sous-requête scalaire",
      question: "13. Afficher les réservations dont le séjour est supérieur à celui de numr = 2.",
      tables: ["RESERVATION"],
      sqlLines: [
        "SELECT *",
        "FROM reservation",
        "WHERE nbjours > (",
        "    SELECT nbjours FROM reservation WHERE numr = 2",
        ");"
      ],
      steps: [
        {
          clause: "(SELECT nbjours FROM reservation WHERE numr = 2)",
          activeLines: [3],
          title: "Étape 1 — Durée du séjour de la réservation n°2",
          explain: "La sous-requête cherche nbjours pour numr = 2 et renvoie 5.",
          trace: [
            { badge: "Sous-requête", text: "numr = 2 → nbjours = 5", status: "info" }
          ]
        },
        {
          clause: "WHERE nbjours > 5",
          activeLines: [1, 2, 3, 4],
          title: "Étape 2 — Filtrage des réservations avec nbjours > 5",
          explain: "On compare nbjours de chaque réservation à 5.",
          trace: [
            { badge: "✖ NumR 1, 2, 6", text: "nbjours = 3, 5, 4 (<= 5 → écartées)", status: "no" },
            { badge: "✔ NumR 3", text: "nbjours = 10 > 5", status: "ok" },
            { badge: "✔ NumR 4", text: "nbjours = 10 > 5", status: "ok" },
            { badge: "✔ NumR 5", text: "nbjours = 7 > 5", status: "ok" }
          ]
        },
        {
          clause: "SELECT *",
          activeLines: [0, 1, 2, 3, 4],
          title: "Étape 3 — Affichage du résultat",
          explain: "Les réservations 3, 4 et 5 sont retournées.",
          trace: [
            { badge: "Résultat", text: "3 réservations ont une durée strictement supérieure à 5 jours", status: "ok" }
          ],
          result: {
            cols: ["NumR", "NumCh", "NumCl", "DateDebut", "Nbjours", "pension"],
            rows: [
              ["3", "C02", "CL01", "2022-06-24 15:00", "10", "ALLIN"],
              ["4", "C03", "CL01", "2022-06-24 15:00", "10", "ALLIN"],
              ["5", "C03", "CL03", "2022-07-17 08:00", "7", "PC"]
            ]
          }
        }
      ]
    },
    {
      num: 16,
      code: "R14",
      qIndex: 14,
      cat: "Jointure + COUNT(*)",
      question: "14. Donner le nombre de réservations faites pour des chambres simples.",
      tables: ["RESERVATION", "CHAMBRE"],
      sqlLines: [
        "SELECT COUNT(*) AS nbchambre",
        "FROM reservation R, chambre ch",
        "WHERE R.numch = ch.numch",
        "  AND ch.type = 'S';"
      ],
      steps: [
        {
          clause: "FROM reservation R, chambre ch WHERE R.numch = ch.numch",
          activeLines: [1, 2],
          title: "Étape 1 — Jointure entre RESERVATION et CHAMBRE",
          explain: "Le type de chambre ('S') se trouve dans CHAMBRE, tandis que les réservations sont dans RESERVATION. On les joint via R.numch = ch.numch.",
          trace: [
            { badge: "Jointure", text: "Chaque réservation est associée au type de sa chambre", status: "info" }
          ]
        },
        {
          clause: "AND ch.type = 'S'",
          activeLines: [1, 2, 3],
          title: "Étape 2 — Filtrage sur les chambres simples (type = 'S')",
          explain: "Seule la chambre C01 est de type 'S'. On garde donc les réservations portant sur C01.",
          trace: [
            { badge: "✔ NumR 1", text: "Chambre C01 (type = 'S') — Client CL02", status: "ok" },
            { badge: "✔ NumR 2", text: "Chambre C01 (type = 'S') — Client CL03", status: "ok" },
            { badge: "✖ NumR 3..6", text: "Chambres C02 ('D'), C03 ('Q'), C04 ('D') != 'S'", status: "no" }
          ]
        },
        {
          clause: "SELECT COUNT(*) AS nbchambre",
          activeLines: [0, 1, 2, 3],
          title: "Étape 3 — Comptage des réservations retenues",
          explain: "COUNT(*) compte les 2 réservations correspondant à des chambres simples.",
          trace: [
            { badge: "Résultat", text: "nbchambre = 2", status: "ok" }
          ],
          result: {
            cols: ["nbchambre"],
            rows: [["2"]]
          }
        }
      ]
    },
    {
      num: 17,
      code: "R15",
      qIndex: 15,
      cat: "GROUP BY + SUM()",
      question: "15. Calculer le nombre total de nuitées par chambre.",
      tables: ["RESERVATION"],
      sqlLines: [
        "SELECT SUM(nbjours) AS nbrnuits, numch",
        "FROM reservation",
        "GROUP BY numch;"
      ],
      steps: [
        {
          clause: "FROM reservation",
          activeLines: [1],
          title: "Étape 1 — Lecture de la table RESERVATION",
          explain: "On lit NumCh et Nbjours pour les 6 réservations.",
          trace: [
            { badge: "RESERVATION", text: "C01(3j), C01(5j), C02(10j), C03(10j), C03(7j), C04(4j)", status: "info" }
          ]
        },
        {
          clause: "GROUP BY numch",
          activeLines: [1, 2],
          title: "Étape 2 — Regroupement des réservations par chambre (GROUP BY numch)",
          explain: "On forme un paquet par numéro de chambre.",
          trace: [
            { badge: "Groupe C01", text: "Séjours : 3j et 5j", status: "info" },
            { badge: "Groupe C02", text: "Séjour : 10j", status: "info" },
            { badge: "Groupe C03", text: "Séjours : 10j et 7j", status: "info" },
            { badge: "Groupe C04", text: "Séjour : 4j", status: "info" }
          ]
        },
        {
          clause: "SELECT SUM(nbjours) AS nbrnuits, numch",
          activeLines: [0, 1, 2],
          title: "Étape 3 — Somme des nuitées SUM(nbjours) par chambre",
          explain: "SUM(nbjours) additionne les nuitées de chaque chambre.",
          trace: [
            { badge: "C01", text: "3 + 5 = 8 nuitées", status: "ok" },
            { badge: "C02", text: "10 nuitées", status: "ok" },
            { badge: "C03", text: "10 + 7 = 17 nuitées", status: "ok" },
            { badge: "C04", text: "4 nuitées", status: "ok" }
          ],
          result: {
            cols: ["nbrnuits", "numch"],
            rows: [
              ["8", "C01"],
              ["10", "C02"],
              ["17", "C03"],
              ["4", "C04"]
            ]
          }
        }
      ]
    },
    {
      num: 18,
      code: "R16",
      qIndex: 16,
      cat: "Jointure + GROUP BY + Calcul",
      question: "16. Calculer le chiffre d'affaires total par chambre (= total des nuitées * prix).",
      tables: ["RESERVATION", "CHAMBRE"],
      sqlLines: [
        "SELECT SUM(R.nbjours) * ch.prix AS chiffre_affaire, R.numch",
        "FROM reservation R, chambre ch",
        "WHERE R.numch = ch.numch",
        "GROUP BY R.numch, ch.prix;"
      ],
      steps: [
        {
          clause: "FROM reservation R, chambre ch WHERE R.numch = ch.numch",
          activeLines: [1, 2],
          title: "Étape 1 — Jointure RESERVATION et CHAMBRE",
          explain: "On relie chaque réservation à sa chambre pour connaître son prix par nuitée.",
          trace: [
            { badge: "Jointure", text: "C01(250 DT), C02(250 DT), C03(400 DT), C04(300 DT)", status: "info" }
          ]
        },
        {
          clause: "GROUP BY R.numch, ch.prix",
          activeLines: [1, 2, 3],
          title: "Étape 2 — Regroupement par chambre et prix",
          explain: "Les réservations sont regroupées par chambre (R.numch, ch.prix).",
          trace: [
            { badge: "C01 (250 DT)", text: "Total nuitées = 3 + 5 = 8", status: "info" },
            { badge: "C02 (250 DT)", text: "Total nuitées = 10", status: "info" },
            { badge: "C03 (400 DT)", text: "Total nuitées = 10 + 7 = 17", status: "info" },
            { badge: "C04 (300 DT)", text: "Total nuitées = 4", status: "info" }
          ]
        },
        {
          clause: "SELECT SUM(R.nbjours) * ch.prix AS chiffre_affaire, R.numch",
          activeLines: [0, 1, 2, 3],
          title: "Étape 3 — Calcul du chiffre d'affaires par chambre",
          explain: "Pour chaque chambre, on multiplie le total des nuitées par le prix unitaire.",
          trace: [
            { badge: "C01", text: "8 × 250 = 2000 DT", status: "ok" },
            { badge: "C02", text: "10 × 250 = 2500 DT", status: "ok" },
            { badge: "C03", text: "17 × 400 = 6800 DT", status: "ok" },
            { badge: "C04", text: "4 × 300 = 1200 DT", status: "ok" }
          ],
          result: {
            cols: ["chiffre_affaire", "numch"],
            rows: [
              ["2000", "C01"],
              ["2500", "C02"],
              ["6800", "C03"],
              ["1200", "C04"]
            ]
          }
        }
      ]
    },
    {
      num: 19,
      code: "R17",
      qIndex: 17,
      cat: "GROUP BY multi-colonnes",
      question: "17. Afficher le nombre de réservations par client et pension.",
      tables: ["RESERVATION"],
      sqlLines: [
        "SELECT numcl, pension, COUNT(*) AS nbreservation",
        "FROM reservation",
        "GROUP BY numcl, pension;"
      ],
      steps: [
        {
          clause: "FROM reservation",
          activeLines: [1],
          title: "Étape 1 — Lecture des couples (numcl, pension) dans RESERVATION",
          explain: "On observe le client et le type de pension de chacune des 6 réservations.",
          trace: [
            { badge: "RESERVATION", text: "(CL02,PC), (CL03,DP), (CL01,ALLIN), (CL01,ALLIN), (CL03,PC), (CL02,DP)", status: "info" }
          ]
        },
        {
          clause: "GROUP BY numcl, pension",
          activeLines: [1, 2],
          title: "Étape 2 — Regroupement par couple (numcl, pension)",
          explain: "Deux lignes vont dans le même paquet uniquement si elles ont le même client ET la même pension.",
          trace: [
            { badge: "(CL01, ALLIN)", text: "NumR 3 et NumR 4 → 2 lignes", status: "ok" },
            { badge: "(CL02, PC)", text: "NumR 1 → 1 ligne", status: "ok" },
            { badge: "(CL02, DP)", text: "NumR 6 → 1 ligne", status: "ok" },
            { badge: "(CL03, DP)", text: "NumR 2 → 1 ligne", status: "ok" },
            { badge: "(CL03, PC)", text: "NumR 5 → 1 ligne", status: "ok" }
          ]
        },
        {
          clause: "SELECT numcl, pension, COUNT(*) AS nbreservation",
          activeLines: [0, 1, 2],
          title: "Étape 3 — Comptage COUNT(*) par couple (numcl, pension)",
          explain: "On affiche chaque couple (numcl, pension) avec son nombre de réservations.",
          trace: [
            { badge: "Résultat", text: "5 groupes distincts retournés", status: "ok" }
          ],
          result: {
            cols: ["numcl", "pension", "nbreservation"],
            rows: [
              ["CL01", "ALLIN", "2"],
              ["CL02", "PC", "1"],
              ["CL02", "DP", "1"],
              ["CL03", "DP", "1"],
              ["CL03", "PC", "1"]
            ]
          }
        }
      ]
    },
    {
      num: 20,
      code: "R18",
      qIndex: 18,
      cat: "ORDER BY multiple (ASC, DESC)",
      question: "18. Lister les chambres dans l'ordre croissant des types et l'ordre décroissant des prix.",
      tables: ["CHAMBRE"],
      sqlLines: [
        "SELECT *",
        "FROM chambre",
        "ORDER BY type ASC, prix DESC;"
      ],
      steps: [
        {
          clause: "FROM chambre",
          activeLines: [1],
          title: "Étape 1 — Lecture des 4 chambres",
          explain: "On récupère toutes les lignes de la table CHAMBRE.",
          trace: [
            { badge: "CHAMBRE", text: "C01(250, S), C02(250, D), C03(400, Q), C04(300, D)", status: "info" }
          ]
        },
        {
          clause: "ORDER BY type ASC, prix DESC",
          activeLines: [0, 1, 2],
          title: "Étape 2 — Tri primaire sur type (A→Z) puis secondaire sur prix (décroissant)",
          explain: "D'abord par type croissant ('D', puis 'Q', puis 'S'). Pour les deux chambres de même type 'D' (C02 et C04), on les départage par prix décroissant : 300 (C04) avant 250 (C02).",
          trace: [
            { badge: "1er (D)", text: "C04 — Type 'D', Prix 300 (plus cher des 'D' en premier)", status: "ok" },
            { badge: "2e (D)", text: "C02 — Type 'D', Prix 250", status: "ok" },
            { badge: "3e (Q)", text: "C03 — Type 'Q', Prix 400", status: "ok" },
            { badge: "4e (S)", text: "C01 — Type 'S', Prix 250", status: "ok" }
          ],
          result: {
            cols: ["NumCh", "Prix", "Type"],
            rows: [
              ["C04", "300", "D"],
              ["C02", "250", "D"],
              ["C03", "400", "Q"],
              ["C01", "250", "S"]
            ]
          }
        }
      ]
    },
    {
      num: 21,
      code: "R19",
      qIndex: 19,
      cat: "Jointure + GROUP BY + HAVING",
      question: "19. Lister les clients ayant effectué au moins 2 réservations.",
      tables: ["CLIENT", "RESERVATION"],
      sqlLines: [
        "SELECT cl.numcl, cl.nom, cl.adresse, COUNT(r.numr) AS nbreservation",
        "FROM client cl, reservation r",
        "WHERE cl.numcl = r.numcl",
        "GROUP BY cl.numcl, cl.nom, cl.adresse",
        "HAVING COUNT(r.numr) >= 2;"
      ],
      steps: [
        {
          clause: "FROM client cl, reservation r WHERE cl.numcl = r.numcl",
          activeLines: [1, 2],
          title: "Étape 1 — Jointure CLIENT et RESERVATION",
          explain: "On relie chaque client à ses réservations via cl.numcl = r.numcl.",
          trace: [
            { badge: "CL01", text: "Ali Trabelsi → réservations n°3 et n°4", status: "info" },
            { badge: "CL02", text: "Alia Ben Ahmed → réservations n°1 et n°6", status: "info" },
            { badge: "CL03", text: "Sonia Kammoun → réservations n°2 et n°5", status: "info" }
          ]
        },
        {
          clause: "GROUP BY cl.numcl, cl.nom, cl.adresse",
          activeLines: [1, 2, 3],
          title: "Étape 2 — Regroupement par client et comptage COUNT(r.numr)",
          explain: "On regroupe les réservations par client et on compte combien chaque client en possède.",
          trace: [
            { badge: "Groupe CL01", text: "COUNT(numr) = 2 réservations", status: "info" },
            { badge: "Groupe CL02", text: "COUNT(numr) = 2 réservations", status: "info" },
            { badge: "Groupe CL03", text: "COUNT(numr) = 2 réservations", status: "info" }
          ]
        },
        {
          clause: "HAVING COUNT(r.numr) >= 2",
          activeLines: [0, 1, 2, 3, 4],
          title: "Étape 3 — Filtrage des groupes avec HAVING COUNT(r.numr) >= 2",
          explain: "La condition porte sur la fonction d'agrégation COUNT(r.numr) : on utilise donc HAVING (après GROUP BY). Les 3 clients ont chacun 2 réservations (>= 2).",
          trace: [
            { badge: "✔ CL01", text: "Ali Trabelsi (Ariana) — 2 réservations >= 2", status: "ok" },
            { badge: "✔ CL02", text: "Alia Ben Ahmed (Tunis) — 2 réservations >= 2", status: "ok" },
            { badge: "✔ CL03", text: "Sonia Kammoun (Sfax) — 2 réservations >= 2", status: "ok" }
          ],
          result: {
            cols: ["numcl", "nom", "adresse", "nbreservation"],
            rows: [
              ["CL01", "Ali Trabelsi", "Ariana", "2"],
              ["CL02", "Alia Ben Ahmed", "Tunis", "2"],
              ["CL03", "Sonia Kammoun", "Sfax", "2"]
            ]
          }
        }
      ]
    },
    {
      num: 22,
      code: "R20",
      qIndex: 20,
      cat: "Sous-requête NOT IN",
      question: "20. Lister les chambres n'ayant aucune réservation enregistrée dans la base.",
      tables: ["CHAMBRE", "RESERVATION"],
      sqlLines: [
        "SELECT *",
        "FROM chambre",
        "WHERE numch NOT IN (",
        "    SELECT numch FROM reservation",
        ");"
      ],
      steps: [
        {
          clause: "(SELECT numch FROM reservation)",
          activeLines: [3],
          title: "Étape 1 — Sous-requête : liste des chambres réservées",
          explain: "La sous-requête extrait tous les numéros de chambres présents dans la table RESERVATION.",
          trace: [
            { badge: "Sous-requête", text: "Chambres réservées : ('C01', 'C02', 'C03', 'C04')", status: "info" }
          ]
        },
        {
          clause: "WHERE numch NOT IN ('C01', 'C02', 'C03', 'C04')",
          activeLines: [1, 2, 3, 4],
          title: "Étape 2 — Recherche des chambres absentes de cette liste (NOT IN)",
          explain: "On teste chaque chambre de la table CHAMBRE pour voir si son numch n'appartient pas à la liste des réservations.",
          trace: [
            { badge: "✖ C01", text: "C01 figure dans RESERVATION (NumR 1, 2)", status: "no" },
            { badge: "✖ C02", text: "C02 figure dans RESERVATION (NumR 3)", status: "no" },
            { badge: "✖ C03", text: "C03 figure dans RESERVATION (NumR 4, 5)", status: "no" },
            { badge: "✖ C04", text: "C04 figure dans RESERVATION (NumR 6)", status: "no" }
          ]
        },
        {
          clause: "SELECT *",
          activeLines: [0, 1, 2, 3, 4],
          title: "Étape 3 — Résultat final",
          explain: "Dans ce jeu d'essai où C01, C02, C03 et C04 ont toutes au moins une réservation, l'ensemble retourné est vide (si une chambre C05 existait sans réservation, elle serait affichée ici).",
          trace: [
            { badge: "Résultat", text: "Aucune chambre non réservée dans le jeu d'essai actuel (0 ligne)", status: "info" }
          ],
          result: {
            cols: ["NumCh", "Prix", "Type"],
            rows: [["(Aucune ligne — toutes les chambres C01..C04 ont été réservées)", "—", "—"]]
          }
        }
      ]
    }
  ];

  function injectStyles() {
    if (document.getElementById("tpgh-anim-styles")) return;
    var st = document.createElement("style");
    st.id = "tpgh-anim-styles";
    st.textContent = [
      ".tpgh-anim-wrap{margin:22px 0 28px;border:2px solid #1e3a8a;border-radius:14px;background:linear-gradient(180deg,#0f172a 0%,#172554 100%);color:#f8fafc;box-shadow:0 14px 34px rgba(15,23,42,.24);overflow:hidden;font-family:'Segoe UI',system-ui,sans-serif}",
      ".tpgh-anim-head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;padding:14px 18px;background:rgba(15,23,42,.78);border-bottom:1px solid rgba(148,163,184,.22)}",
      ".tpgh-anim-title{display:flex;align-items:center;gap:10px;font-weight:800;font-size:1.05rem;color:#f8fafc}",
      ".tpgh-anim-badge{background:linear-gradient(135deg,#0284c7,#2563eb);color:#fff;font-size:.76rem;font-weight:800;padding:4px 10px;border-radius:999px;letter-spacing:.03em;text-transform:uppercase}",
      ".tpgh-anim-sub{font-size:.83rem;color:#cbd5e1;margin-top:2px}",
      ".tpgh-qbar{display:flex;flex-wrap:wrap;gap:6px;padding:12px 16px;background:rgba(30,41,59,.75);border-bottom:1px solid rgba(148,163,184,.18)}",
      ".tpgh-qbtn{border:1px solid rgba(148,163,184,.32);background:rgba(15,23,42,.7);color:#e2e8f0;font-weight:700;font-size:.8rem;padding:6px 10px;border-radius:8px;cursor:pointer;transition:all .15s}",
      ".tpgh-qbtn:hover{border-color:#38bdf8;color:#fff;transform:translateY(-1px)}",
      ".tpgh-qbtn.active{background:linear-gradient(135deg,#0284c7,#2563eb);border-color:#7dd3fc;color:#fff;box-shadow:0 4px 12px rgba(2,132,199,.4)}",
      ".tpgh-body{padding:16px 18px;display:grid;grid-template-columns:1.05fr 1.25fr;gap:16px}",
      "@media(max-width:920px){.tpgh-body{grid-template-columns:1fr}}",
      ".tpgh-card{background:rgba(15,23,42,.66);border:1px solid rgba(148,163,184,.22);border-radius:11px;padding:13px 15px}",
      ".tpgh-qheader{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}",
      ".tpgh-qcat{font-size:.75rem;font-weight:800;padding:3px 9px;border-radius:999px;background:rgba(56,189,248,.16);color:#7dd3fc;border:1px solid rgba(56,189,248,.35)}",
      ".tpgh-qtext{font-size:.95rem;font-weight:700;color:#f1f5f9;line-height:1.4;margin-bottom:10px}",
      ".tpgh-sqlbox{background:#090d16;border:1px solid rgba(148,163,184,.25);border-radius:9px;padding:10px 12px;font-family:Consolas,'JetBrains Mono',monospace;font-size:.86rem;line-height:1.55;overflow-x:auto}",
      ".tpgh-sqlline{padding:2px 8px;border-radius:5px;color:#64748b;transition:all .2s;white-space:pre}",
      ".tpgh-sqlline.done{color:#e2e8f0}",
      ".tpgh-sqlline.current{background:rgba(2,132,199,.25);border-left:3px solid #38bdf8;color:#fff;font-weight:700}",
      ".tpgh-controls{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:12px}",
      ".tpgh-cbtn{border:1px solid rgba(148,163,184,.35);background:#1e293b;color:#f8fafc;font-weight:700;font-size:.8rem;padding:7px 12px;border-radius:8px;cursor:pointer;display:inline-flex;align-items:center;gap:5px;transition:all .15s}",
      ".tpgh-cbtn:hover:not(:disabled){background:#334155;border-color:#7dd3fc}",
      ".tpgh-cbtn:disabled{opacity:.45;cursor:not-allowed}",
      ".tpgh-cbtn.primary{background:linear-gradient(135deg,#059669,#10b981);border-color:#34d399;color:#fff}",
      ".tpgh-cbtn.primary:hover{filter:brightness(1.08)}",
      ".tpgh-step-dots{display:flex;gap:6px;margin-left:auto;align-items:center}",
      ".tpgh-dot{width:26px;height:26px;border-radius:999px;border:1px solid rgba(148,163,184,.38);background:#0f172a;color:#94a3b8;font-size:.76rem;font-weight:800;cursor:pointer;display:inline-flex;align-items:center;justify-content:center}",
      ".tpgh-dot.active{background:#0284c7;color:#fff;border-color:#7dd3fc}",
      ".tpgh-dot.done{background:rgba(16,185,129,.22);color:#6ee7b7;border-color:rgba(16,185,129,.5)}",
      ".tpgh-tables-bar{display:flex;flex-wrap:wrap;gap:7px;margin-top:11px;padding-top:10px;border-top:1px dashed rgba(148,163,184,.22);align-items:center}",
      ".tpgh-tbl-pill{font-size:.75rem;font-weight:700;padding:3px 9px;border-radius:6px;background:rgba(30,41,59,.9);color:#64748b;border:1px solid rgba(148,163,184,.18)}",
      ".tpgh-tbl-pill.used{background:rgba(16,185,129,.16);color:#6ee7b7;border-color:rgba(16,185,129,.45)}",
      ".tpgh-step-box{margin-bottom:10px;padding:10px 12px;border-radius:9px;background:rgba(2,132,199,.13);border:1px solid rgba(56,189,248,.3)}",
      ".tpgh-step-title{font-weight:800;font-size:.9rem;color:#7dd3fc;margin-bottom:4px}",
      ".tpgh-step-exp{font-size:.84rem;color:#e2e8f0;line-height:1.45}",
      ".tpgh-trace-list{display:flex;flex-direction:column;gap:6px;margin:10px 0}",
      ".tpgh-trace-item{display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:7px;font-size:.82rem;background:rgba(30,41,59,.75);border:1px solid rgba(148,163,184,.2)}",
      ".tpgh-trace-item.ok{background:rgba(16,185,129,.14);border-color:rgba(16,185,129,.4);color:#d1fae5}",
      ".tpgh-trace-item.no{background:rgba(239,68,68,.13);border-color:rgba(239,68,68,.35);color:#fecaca;opacity:.85}",
      ".tpgh-trace-item.info{background:rgba(59,130,246,.13);border-color:rgba(59,130,246,.35);color:#dbeafe}",
      ".tpgh-tbadge{font-weight:800;font-size:.73rem;padding:2px 7px;border-radius:5px;background:rgba(15,23,42,.65);white-space:nowrap}",
      ".tpgh-res-wrap{margin-top:10px;border-top:1px solid rgba(148,163,184,.22);padding-top:10px}",
      ".tpgh-res-title{font-size:.78rem;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:#6ee7b7;margin-bottom:6px}",
      ".tpgh-res-table{width:100%;border-collapse:collapse;font-size:.8rem;background:#0f172a;border-radius:7px;overflow:hidden}",
      ".tpgh-res-table th{background:#1e3a8a;color:#e0f2fe;padding:6px 9px;text-align:left;border:1px solid rgba(148,163,184,.25)}",
      ".tpgh-res-table td{padding:5px 9px;border:1px solid rgba(148,163,184,.2);color:#f1f5f9}",
      ".tpgh-db-preview{padding:0 18px 16px}",
      ".tpgh-db-toggle{background:rgba(30,41,59,.85);color:#bae6fd;border:1px solid rgba(56,189,248,.35);border-radius:8px;padding:6px 12px;font-size:.8rem;font-weight:700;cursor:pointer}",
      ".tpgh-db-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:10px;margin-top:10px}",
      ".tpgh-db-card{background:rgba(15,23,42,.8);border:1px solid rgba(148,163,184,.22);border-radius:8px;padding:8px 10px;transition:all .2s}",
      ".tpgh-db-card.active-tbl{border-color:#34d399;box-shadow:0 0 0 2px rgba(16,185,129,.25)}",
      ".tpgh-db-name{font-weight:800;font-size:.78rem;color:#93c5fd;margin-bottom:5px;display:flex;justify-content:space-between}",
      ".tpgh-mini-tbl{width:100%;border-collapse:collapse;font-size:.73rem}",
      ".tpgh-mini-tbl th{background:rgba(30,58,138,.6);color:#e2e8f0;padding:3px 5px;border:1px solid rgba(148,163,184,.2);text-align:left}",
      ".tpgh-mini-tbl td{padding:2px 5px;border:1px solid rgba(148,163,184,.16);color:#cbd5e1}",
      ".tpgh-inline-btn{margin-left:6px;background:linear-gradient(135deg,#0284c7,#2563eb);color:#fff;border:none;border-radius:5px;padding:4px 10px;font-size:.78rem;font-weight:700;cursor:pointer;vertical-align:middle;box-shadow:0 2px 6px rgba(2,132,199,.3)}",
      ".tpgh-inline-btn:hover{filter:brightness(1.1)}",
      ".tpgh-show-btn{margin-left:6px;background:#2b6cb0;color:#fff;border:none;border-radius:5px;padding:4px 10px;font-size:.78rem;font-weight:700;cursor:pointer;vertical-align:middle}",
      ".tpgh-show-btn:hover{background:#2c5282}",
      ".tpgh-inline-sql{display:none;background:#f7fafc;border:1px solid #cbd5e0;border-left:4px solid #2b6cb0;padding:8px 10px;border-radius:4px;font-family:Consolas,monospace;font-size:.86em;color:#2b6cb0;white-space:pre-wrap;margin:6px 0 10px}",
      ".tpgh-global-bar{text-align:center;margin:12px 0 16px}",
      ".tpgh-global-btn{background:#2b6cb0;color:#fff;border:none;padding:9px 18px;border-radius:6px;font-weight:700;font-size:.9rem;cursor:pointer;box-shadow:0 2px 5px rgba(0,0,0,.15)}",
      "@media print{.tpgh-anim-wrap,.tpgh-inline-btn,.tpgh-show-btn,.tpgh-global-bar{display:none!important}.tpgh-inline-sql{display:block!important}}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function buildStudio() {
    injectStyles();

    var wrap = document.createElement("section");
    wrap.className = "tpgh-anim-wrap";
    wrap.id = "tpgh-anim-studio-mount";

    var allTblNames = ["CHAMBRE", "RESERVATION", "CLIENT"];

    wrap.innerHTML =
      '<div class="tpgh-anim-head">' +
        '<div>' +
          '<div class="tpgh-anim-title">' +
            '<span class="tpgh-anim-badge">🎬 Animation SQL Pas à Pas</span>' +
            '<span>Studio Interactif de Correction — Les 22 Requêtes Gesthotel (R1 à R20)</span>' +
          '</div>' +
          '<div class="tpgh-anim-sub">Visualisez l\'exécution clause par clause : fonctions de Date (<code>NOW</code>, <code>DATE</code>, <code>DATE_SUB</code>), Jointure dans <code>WHERE</code> (<code>a.x = b.x</code>), Sous-requêtes, <code>GROUP BY</code> et <code>HAVING</code>.</div>' +
        '</div>' +
        '<button type="button" class="tpgh-db-toggle" id="tpgh-toggle-db">🗄️ Afficher / Masquer le jeu d\'essai Gesthotel (3 tables)</button>' +
      '</div>' +
      '<div class="tpgh-qbar" id="tpgh-qbar"></div>' +
      '<div class="tpgh-db-preview" id="tpgh-db-preview" style="display:block;">' +
        '<div class="tpgh-db-grid" id="tpgh-db-grid"></div>' +
      '</div>' +
      '<div class="tpgh-body">' +
        '<div class="tpgh-card">' +
          '<div class="tpgh-qheader">' +
            '<span class="tpgh-qcat" id="tpgh-qcat"></span>' +
            '<span style="font-size:.78rem;color:#94a3b8;" id="tpgh-step-counter"></span>' +
          '</div>' +
          '<div class="tpgh-qtext" id="tpgh-qtext"></div>' +
          '<div class="tpgh-sqlbox" id="tpgh-sqlbox"></div>' +
          '<div class="tpgh-controls">' +
            '<button type="button" class="tpgh-cbtn primary" id="tpgh-btn-play">▶ Animer pas à pas</button>' +
            '<button type="button" class="tpgh-cbtn" id="tpgh-btn-prev">◀ Étape préc.</button>' +
            '<button type="button" class="tpgh-cbtn" id="tpgh-btn-next">Étape suiv. ▶</button>' +
            '<button type="button" class="tpgh-cbtn" id="tpgh-btn-reset">⏮ Début</button>' +
            '<button type="button" class="tpgh-cbtn" id="tpgh-btn-full">⚡ Requête complète</button>' +
            '<button type="button" class="tpgh-cbtn" id="tpgh-btn-copy">📋 Copier SQL</button>' +
            '<div class="tpgh-step-dots" id="tpgh-step-dots"></div>' +
          '</div>' +
          '<div class="tpgh-tables-bar" id="tpgh-tables-bar"></div>' +
        '</div>' +
        '<div class="tpgh-card">' +
          '<div class="tpgh-step-box">' +
            '<div class="tpgh-step-title" id="tpgh-step-title"></div>' +
            '<div class="tpgh-step-exp" id="tpgh-step-exp"></div>' +
          '</div>' +
          '<div class="tpgh-trace-list" id="tpgh-trace-list"></div>' +
          '<div class="tpgh-res-wrap" id="tpgh-res-wrap"></div>' +
        '</div>' +
      '</div>';

    var targetH2 = null;
    var h2s = document.querySelectorAll("h2");
    for (var i = 0; i < h2s.length; i++) {
      var txt = h2s[i].textContent || "";
      if (txt.indexOf("Travail Demandé") !== -1 || txt.indexOf("Correction des Requêtes") !== -1) {
        targetH2 = h2s[i];
        break;
      }
    }
    if (targetH2 && targetH2.parentNode) {
      targetH2.parentNode.insertBefore(wrap, targetH2);
    } else {
      document.body.appendChild(wrap);
    }

    var dbGrid = document.getElementById("tpgh-db-grid");
    for (var t = 0; t < allTblNames.length; t++) {
      var tName = allTblNames[t];
      var tData = DB[tName];
      var card = document.createElement("div");
      card.className = "tpgh-db-card";
      card.setAttribute("data-tbl", tName);
      var html = '<div class="tpgh-db-name"><span>📋 ' + tName + '</span><span class="tpgh-tbl-state"></span></div>';
      html += '<table class="tpgh-mini-tbl"><thead><tr>';
      for (var c = 0; c < tData.cols.length; c++) {
        html += "<th>" + escapeHtml(tData.cols[c]) + "</th>";
      }
      html += "</tr></thead><tbody>";
      for (var r = 0; r < tData.rows.length; r++) {
        html += "<tr>";
        for (var cc = 0; cc < tData.rows[r].length; cc++) {
          html += "<td>" + escapeHtml(tData.rows[r][cc]) + "</td>";
        }
        html += "</tr>";
      }
      html += "</tbody></table>";
      card.innerHTML = html;
      dbGrid.appendChild(card);
    }

    var state = {
      qIdx: 0,
      stepIdx: 0,
      timer: null
    };

    function stopAuto() {
      if (state.timer) {
        clearInterval(state.timer);
        state.timer = null;
      }
      var playBtn = document.getElementById("tpgh-btn-play");
      if (playBtn) playBtn.textContent = "▶ Animer pas à pas";
    }

    function render() {
      var q = REQUETES[state.qIdx];
      var step = q.steps[state.stepIdx];

      var qBtns = document.querySelectorAll(".tpgh-qbtn");
      for (var i = 0; i < qBtns.length; i++) {
        if (i === state.qIdx) qBtns[i].classList.add("active");
        else qBtns[i].classList.remove("active");
      }

      document.getElementById("tpgh-qcat").textContent = q.code + " • " + q.cat;
      document.getElementById("tpgh-step-counter").textContent =
        "Étape " + (state.stepIdx + 1) + " / " + q.steps.length;
      document.getElementById("tpgh-qtext").textContent = q.question;

      var sqlBox = document.getElementById("tpgh-sqlbox");
      var sqlHtml = "";
      var prevStepLines = state.stepIdx > 0 ? q.steps[state.stepIdx - 1].activeLines : [];
      for (var l = 0; l < q.sqlLines.length; l++) {
        var isActive = step.activeLines.indexOf(l) !== -1;
        var isNew = isActive && prevStepLines.indexOf(l) === -1;
        var cls = "tpgh-sqlline";
        if (isNew || (state.stepIdx === 0 && isActive)) cls += " current";
        else if (isActive) cls += " done";
        sqlHtml += '<div class="' + cls + '">' + escapeHtml(q.sqlLines[l]) + "</div>";
      }
      sqlBox.innerHTML = sqlHtml;

      var dotsWrap = document.getElementById("tpgh-step-dots");
      var dotsHtml = "";
      for (var s = 0; s < q.steps.length; s++) {
        var dCls = "tpgh-dot";
        if (s === state.stepIdx) dCls += " active";
        else if (s < state.stepIdx) dCls += " done";
        dotsHtml += '<button type="button" class="' + dCls + '" data-step="' + s + '">' + (s + 1) + "</button>";
      }
      dotsWrap.innerHTML = dotsHtml;
      var dotBtns = dotsWrap.querySelectorAll(".tpgh-dot");
      for (var db = 0; db < dotBtns.length; db++) {
        dotBtns[db].addEventListener("click", function () {
          stopAuto();
          state.stepIdx = parseInt(this.getAttribute("data-step"), 10);
          render();
        });
      }

      document.getElementById("tpgh-btn-prev").disabled = state.stepIdx === 0;
      document.getElementById("tpgh-btn-next").disabled = state.stepIdx === q.steps.length - 1;

      var tblBar = document.getElementById("tpgh-tables-bar");
      var tblHtml = '<span style="font-size:.76rem;color:#94a3b8;font-weight:700;">Tables mobilisées :</span>';
      for (var tn = 0; tn < allTblNames.length; tn++) {
        var name = allTblNames[tn];
        var used = q.tables.indexOf(name) !== -1;
        tblHtml += '<span class="tpgh-tbl-pill' + (used ? " used" : "") + '">' + (used ? "✔ " : "") + name + "</span>";
      }
      tblBar.innerHTML = tblHtml;

      var dbCards = document.querySelectorAll(".tpgh-db-card");
      for (var dc = 0; dc < dbCards.length; dc++) {
        var cName = dbCards[dc].getAttribute("data-tbl");
        var isUsed = q.tables.indexOf(cName) !== -1;
        var stSpan = dbCards[dc].querySelector(".tpgh-tbl-state");
        if (isUsed) {
          dbCards[dc].classList.add("active-tbl");
          if (stSpan) stSpan.textContent = "⚡ Mobilisée";
        } else {
          dbCards[dc].classList.remove("active-tbl");
          if (stSpan) stSpan.textContent = "";
        }
      }

      document.getElementById("tpgh-step-title").textContent = step.title;
      document.getElementById("tpgh-step-exp").textContent = step.explain;

      var traceList = document.getElementById("tpgh-trace-list");
      var trHtml = "";
      for (var tr = 0; tr < step.trace.length; tr++) {
        var item = step.trace[tr];
        trHtml +=
          '<div class="tpgh-trace-item ' + (item.status || "info") + '">' +
            '<span class="tpgh-tbadge">' + escapeHtml(item.badge) + "</span>" +
            '<span>' + escapeHtml(item.text) + "</span>" +
          "</div>";
      }
      traceList.innerHTML = trHtml;

      var resWrap = document.getElementById("tpgh-res-wrap");
      if (step.result) {
        var rHtml = '<div class="tpgh-res-title">📊 Table Résultat de la requête (' + step.result.rows.length + ' ligne' + (step.result.rows.length > 1 ? 's' : '') + ')</div>';
        rHtml += '<table class="tpgh-res-table"><thead><tr>';
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
        resWrap.style.display = "block";
      } else {
        resWrap.innerHTML =
          '<div style="font-size:.8rem;color:#94a3b8;font-style:italic;">⏳ Passez à l\'étape suivante pour voir le résultat final de la requête…</div>';
        resWrap.style.display = "block";
      }
    }

    var qbar = document.getElementById("tpgh-qbar");
    for (var q = 0; q < REQUETES.length; q++) {
      (function (idx) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "tpgh-qbtn";
        b.textContent = REQUETES[idx].code;
        b.title = REQUETES[idx].question;
        b.addEventListener("click", function () {
          stopAuto();
          state.qIdx = idx;
          state.stepIdx = 0;
          render();
        });
        qbar.appendChild(b);
      })(q);
    }

    document.getElementById("tpgh-btn-prev").addEventListener("click", function () {
      stopAuto();
      if (state.stepIdx > 0) {
        state.stepIdx--;
        render();
      }
    });

    document.getElementById("tpgh-btn-next").addEventListener("click", function () {
      stopAuto();
      var qObj = REQUETES[state.qIdx];
      if (state.stepIdx < qObj.steps.length - 1) {
        state.stepIdx++;
        render();
      }
    });

    document.getElementById("tpgh-btn-reset").addEventListener("click", function () {
      stopAuto();
      state.stepIdx = 0;
      render();
    });

    document.getElementById("tpgh-btn-full").addEventListener("click", function () {
      stopAuto();
      state.stepIdx = REQUETES[state.qIdx].steps.length - 1;
      render();
    });

    document.getElementById("tpgh-btn-play").addEventListener("click", function () {
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

    document.getElementById("tpgh-btn-copy").addEventListener("click", function () {
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

    document.getElementById("tpgh-toggle-db").addEventListener("click", function () {
      var p = document.getElementById("tpgh-db-preview");
      p.style.display = p.style.display === "none" ? "block" : "none";
    });

    function openAndAnimate(reqIdx) {
      stopAuto();
      state.qIdx = reqIdx;
      state.stepIdx = 0;
      render();
      var studio = document.getElementById("tpgh-anim-studio-mount");
      if (studio && studio.scrollIntoView) {
        studio.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      var playBtn = document.getElementById("tpgh-btn-play");
      if (playBtn) playBtn.click();
    }

    // Attacher les boutons "🎬 Animer R..." (et "👁️ Voir la réponse" sur l'énoncé)
    var allOls = document.querySelectorAll("ol");
    var targetOl = null;
    for (var o = 0; o < allOls.length; o++) {
      // Chercher la liste ordonnée contenant les 20 questions
      var directLis = [];
      for (var ch = 0; ch < allOls[o].children.length; ch++) {
        if (allOls[o].children[ch].tagName === "LI") {
          directLis.push(allOls[o].children[ch]);
        }
      }
      if (directLis.length >= 18) {
        targetOl = allOls[o];
        break;
      }
    }

    if (targetOl) {
      var topLis = [];
      for (var cIdx = 0; cIdx < targetOl.children.length; cIdx++) {
        if (targetOl.children[cIdx].tagName === "LI") {
          topLis.push(targetOl.children[cIdx]);
        }
      }

      var hasExistingPre = targetOl.querySelectorAll("pre").length > 0;

      // Si on est sur la page Énoncé (sans <pre>), ajouter le bouton global Afficher/Masquer toutes les réponses
      if (!hasExistingPre) {
        var gBar = document.createElement("div");
        gBar.className = "tpgh-global-bar";
        var gBtn = document.createElement("button");
        gBtn.type = "button";
        gBtn.className = "tpgh-global-btn";
        gBtn.textContent = "✅ Afficher toutes les réponses";
        gBtn.addEventListener("click", function () {
          var pres = document.querySelectorAll(".tpgh-inline-sql");
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
          var sBtns = document.querySelectorAll(".tpgh-show-btn");
          for (var sb = 0; sb < sBtns.length; sb++) {
            sBtns[sb].textContent = anyHidden ? "🙈 Masquer" : "👁️ Voir la réponse";
          }
          gBtn.textContent = anyHidden ? "🙈 Masquer toutes les réponses" : "✅ Afficher toutes les réponses";
        });
        gBar.appendChild(gBtn);
        targetOl.parentNode.insertBefore(gBar, targetOl);
      }

      // Associer chaque requête à son <li> (y compris 5.1, 5.2, 5.3)
      for (var rIdx = 0; rIdx < REQUETES.length; rIdx++) {
        (function (reqIndex) {
          var req = REQUETES[reqIndex];
          var li = topLis[req.qIndex - 1];
          if (!li) return;

          var targetNode = li;
          if (req.subIndex) {
            var subLis = li.querySelectorAll("ul > li");
            if (subLis[req.subIndex - 1]) {
              targetNode = subLis[req.subIndex - 1];
            }
          }

          var existingPre = targetNode.querySelector("pre");

          // Sur la page énoncé, injecter bouton "👁️ Voir la réponse" + bloc SQL
          var sqlPre = existingPre;
          var showBtn = null;
          if (!existingPre) {
            showBtn = document.createElement("button");
            showBtn.type = "button";
            showBtn.className = "tpgh-show-btn";
            showBtn.textContent = "👁️ Voir la réponse";

            sqlPre = document.createElement("pre");
            sqlPre.className = "tpgh-inline-sql";
            sqlPre.textContent = req.sqlLines.join("\n");

            showBtn.addEventListener("click", function () {
              var visible = sqlPre.style.display === "block";
              sqlPre.style.display = visible ? "none" : "block";
              showBtn.textContent = visible ? "👁️ Voir la réponse" : "🙈 Masquer";
            });
          }

          var animBtn = document.createElement("button");
          animBtn.type = "button";
          animBtn.className = "tpgh-inline-btn";
          animBtn.textContent = "🎬 Animer " + req.code;
          animBtn.addEventListener("click", function () {
            if (sqlPre && !existingPre) {
              sqlPre.style.display = "block";
              if (showBtn) showBtn.textContent = "🙈 Masquer";
            }
            openAndAnimate(reqIndex);
          });

          if (existingPre) {
            targetNode.insertBefore(animBtn, existingPre);
          } else {
            targetNode.appendChild(showBtn);
            targetNode.appendChild(animBtn);
            targetNode.appendChild(sqlPre);
          }
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
