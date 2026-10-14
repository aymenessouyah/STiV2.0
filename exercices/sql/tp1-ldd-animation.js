/* ==========================================================================
   Atelier d'Animation Pas à Pas — Série 1 : LDD (Création & Modification)
   Exercice 1 (Hôpital : Patient, Medecin, Sejour, traite)
   Exercice 2 (Agence de Location : Client, Vehicule, Location)
   Utilisé dans : exercices/sql/Tp1-bd.html
   ========================================================================== */
(function () {
  "use strict";

  var REQUETES = [
    // ==================== EXERCICE 1 : HÔPITAL ====================
    {
      code: "Ex1-Q1a",
      exo: 1,
      qIndex: 1,
      cat: "CREATE TABLE + PRIMARY KEY",
      question: "Ex1 - Q1 (a) : Créer la table Patient avec ses colonnes et contraintes.",
      tables: ["Patient"],
      sqlLines: [
        "CREATE TABLE Patient (",
        "    num_patient INT(10) PRIMARY KEY,",
        "    nom_patient VARCHAR(20) NOT NULL,",
        "    prenom_patient VARCHAR(20) NOT NULL,",
        "    adr_patient VARCHAR(50)",
        ");"
      ],
      steps: [
        {
          activeLines: [0, 5],
          title: "Étape 1 — Déclaration de la table Patient",
          explain: "La commande CREATE TABLE Patient (...) initialise une nouvelle table dans la base de données de l'hôpital.",
          trace: [
            { badge: "LDD", text: "Création de l'entité vide Patient", status: "info" }
          ]
        },
        {
          activeLines: [0, 1, 5],
          title: "Étape 2 — Définition de la clé primaire num_patient",
          explain: "num_patient est de type numérique INT(10) et identifie chaque patient de façon unique grâce à PRIMARY KEY.",
          trace: [
            { badge: "🔑 PK", text: "num_patient INT(10) PRIMARY KEY (unique + non nul)", status: "ok" }
          ]
        },
        {
          activeLines: [0, 1, 2, 3, 4, 5],
          title: "Étape 3 — Colonnes obligatoires (NOT NULL) et adresse",
          explain: "nom_patient et prenom_patient sont obligatoires (NOT NULL), tandis que adr_patient VARCHAR(50) est facultative.",
          trace: [
            { badge: "✔ Colonne", text: "nom_patient VARCHAR(20) NOT NULL", status: "ok" },
            { badge: "✔ Colonne", text: "prenom_patient VARCHAR(20) NOT NULL", status: "ok" },
            { badge: "✔ Colonne", text: "adr_patient VARCHAR(50)", status: "ok" }
          ],
          result: {
            cols: ["Colonne", "Type SQL", "Contrainte"],
            rows: [
              ["num_patient", "INT(10)", "PRIMARY KEY"],
              ["nom_patient", "VARCHAR(20)", "NOT NULL"],
              ["prenom_patient", "VARCHAR(20)", "NOT NULL"],
              ["adr_patient", "VARCHAR(50)", "NULL autorisé"]
            ]
          }
        }
      ]
    },
    {
      code: "Ex1-Q1b",
      exo: 1,
      qIndex: 1,
      cat: "CREATE TABLE + CHECK (IN)",
      question: "Ex1 - Q1 (b) : Créer la table Medecin, Sejour et traite avec leurs contraintes.",
      tables: ["Medecin", "Sejour", "traite"],
      sqlLines: [
        "CREATE TABLE Medecin (",
        "    code_med VARCHAR(10) PRIMARY KEY,",
        "    nom_med VARCHAR(20) NOT NULL,",
        "    prenom_med VARCHAR(20) NOT NULL,",
        "    tel_med INT(8),",
        "    specialite VARCHAR(12) CHECK (specialite IN ('generaliste', 'chirurgien'))",
        ");",
        "CREATE TABLE Sejour (",
        "    num_sej INT AUTO_INCREMENT PRIMARY KEY,",
        "    num_chambre INT(4) NOT NULL CHECK (num_chambre BETWEEN 1 AND 1000),",
        "    date_deb DATE NOT NULL,",
        "    date_fin DATE CHECK (date_fin > date_deb),",
        "    num_patient INT(10)",
        ");",
        "CREATE TABLE traite (",
        "    num_patient INT(10),",
        "    date_deb_trait DATE,",
        "    code_med VARCHAR(10),",
        "    PRIMARY KEY (num_patient, code_med),",
        "    FOREIGN KEY (num_patient) REFERENCES Patient(num_patient),",
        "    FOREIGN KEY (code_med) REFERENCES Medecin(code_med)",
        ");"
      ],
      steps: [
        {
          activeLines: [0, 1, 2, 3, 4, 5, 6],
          title: "Étape 1 — Table Medecin avec contrainte de domaine CHECK",
          explain: "La colonne specialite est limitée aux deux valeurs autorisées ('generaliste', 'chirurgien') via CHECK (specialite IN (...)).",
          trace: [
            { badge: "🔑 Medecin", text: "code_med VARCHAR(10) PRIMARY KEY", status: "ok" },
            { badge: "✔ CHECK", text: "specialite IN ('generaliste', 'chirurgien')", status: "ok" }
          ]
        },
        {
          activeLines: [7, 8, 9, 10, 11, 12, 13],
          title: "Étape 2 — Table Sejour avec AUTO_INCREMENT et intervalles",
          explain: "num_sej s'incrémente automatiquement, num_chambre est compris entre 1 et 1000, et date_fin doit être postérieure à date_deb.",
          trace: [
            { badge: "🔑 Sejour", text: "num_sej INT AUTO_INCREMENT PRIMARY KEY", status: "ok" },
            { badge: "✔ CHECK", text: "num_chambre BETWEEN 1 AND 1000 | date_fin > date_deb", status: "ok" }
          ]
        },
        {
          activeLines: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
          title: "Étape 3 — Table d'association traite (clé primaire composée)",
          explain: "La table traite possède une clé primaire composée (num_patient, code_med) faisant référence à Patient et Medecin.",
          trace: [
            { badge: "🔑 PK composée", text: "PRIMARY KEY (num_patient, code_med)", status: "ok" }
          ],
          result: {
            cols: ["Table créée", "Clé Primaire", "Contraintes spécifiques"],
            rows: [
              ["Patient", "num_patient", "nom_patient, prenom_patient NOT NULL"],
              ["Medecin", "code_med", "CHECK (specialite IN ('generaliste','chirurgien'))"],
              ["Sejour", "num_sej (AUTO_INCREMENT)", "CHECK (num_chambre BETWEEN 1 AND 1000), date_fin > date_deb"],
              ["traite", "(num_patient, code_med)", "2 clés étrangères vers Patient et Medecin"]
            ]
          }
        }
      ]
    },
    {
      code: "Ex1-Q2",
      exo: 1,
      qIndex: 2,
      cat: "ALTER TABLE ... ADD",
      question: "Ex1 - Q2 : Ajouter la colonne Age dans la table Patient (Numérique(2), Non nulle et >= 1).",
      tables: ["Patient"],
      sqlLines: [
        "ALTER TABLE Patient",
        "ADD Age INT(2) NOT NULL CHECK (Age >= 1);"
      ],
      steps: [
        {
          activeLines: [0],
          title: "Étape 1 — Ciblage de la table existante Patient",
          explain: "ALTER TABLE Patient indique que l'on modifie la structure de la table Patient sans perdre ses données.",
          trace: [
            { badge: "Avant", text: "Patient (num_patient, nom_patient, prenom_patient, adr_patient)", status: "info" }
          ]
        },
        {
          activeLines: [0, 1],
          title: "Étape 2 — Ajout de la colonne Age avec NOT NULL et CHECK",
          explain: "ADD Age INT(2) NOT NULL CHECK (Age >= 1) ajoute la nouvelle colonne à la fin de la table avec sa contrainte de valeur.",
          trace: [
            { badge: "✔ Ajoutée", text: "Age INT(2) NOT NULL CHECK (Age >= 1)", status: "ok" }
          ],
          result: {
            cols: ["Colonne", "Type", "Contrainte"],
            rows: [
              ["num_patient", "INT(10)", "PRIMARY KEY"],
              ["nom_patient", "VARCHAR(20)", "NOT NULL"],
              ["prenom_patient", "VARCHAR(20)", "NOT NULL"],
              ["adr_patient", "VARCHAR(50)", "—"],
              ["Age (NOUVEAU)", "INT(2)", "NOT NULL, CHECK (Age >= 1)"]
            ]
          }
        }
      ]
    },
    {
      code: "Ex1-Q3",
      exo: 1,
      qIndex: 3,
      cat: "ALTER TABLE ... MODIFY",
      question: "Ex1 - Q3 : Modifier la colonne tel_med de la table Medecin (type : texte, taille : 15).",
      tables: ["Medecin"],
      sqlLines: [
        "ALTER TABLE Medecin",
        "MODIFY tel_med VARCHAR(15);"
      ],
      steps: [
        {
          activeLines: [0],
          title: "Étape 1 — Sélection de la table Medecin",
          explain: "Initialement, tel_med a été défini en INT(8).",
          trace: [
            { badge: "Avant", text: "tel_med INT(8)", status: "info" }
          ]
        },
        {
          activeLines: [0, 1],
          title: "Étape 2 — Conversion du type avec MODIFY",
          explain: "MODIFY tel_med VARCHAR(15) remplace le type numérique par une chaîne de 15 caractères (utile pour stocker '+216 ...').",
          trace: [
            { badge: "✔ Modifiée", text: "tel_med VARCHAR(15)", status: "ok" }
          ],
          result: {
            cols: ["Colonne", "Ancien type", "Nouveau type"],
            rows: [["tel_med", "INT(8)", "VARCHAR(15)"]]
          }
        }
      ]
    },
    {
      code: "Ex1-Q4",
      exo: 1,
      qIndex: 4,
      cat: "ALTER TABLE ... DROP",
      question: "Ex1 - Q4 : Supprimer la colonne tel_med de la table Medecin.",
      tables: ["Medecin"],
      sqlLines: [
        "ALTER TABLE Medecin",
        "DROP COLUMN tel_med;"
      ],
      steps: [
        {
          activeLines: [0],
          title: "Étape 1 — Ciblage de la table Medecin",
          explain: "On souhaite retirer définitivement la colonne tel_med de la structure de Medecin.",
          trace: [
            { badge: "Avant", text: "Colonnes : code_med, nom_med, prenom_med, tel_med, specialite", status: "info" }
          ]
        },
        {
          activeLines: [0, 1],
          title: "Étape 2 — Suppression de la colonne avec DROP COLUMN",
          explain: "DROP COLUMN tel_med (ou DROP tel_med) supprime la colonne et toutes ses valeurs de la table Medecin.",
          trace: [
            { badge: "✖ Supprimée", text: "Colonne tel_med retirée de Medecin", status: "no" },
            { badge: "✔ Restantes", text: "code_med, nom_med, prenom_med, specialite", status: "ok" }
          ],
          result: {
            cols: ["Colonne restante", "Type"],
            rows: [
              ["code_med", "VARCHAR(10) PRIMARY KEY"],
              ["nom_med", "VARCHAR(20) NOT NULL"],
              ["prenom_med", "VARCHAR(20) NOT NULL"],
              ["specialite", "VARCHAR(12)"]
            ]
          }
        }
      ]
    },
    {
      code: "Ex1-Q5",
      exo: 1,
      qIndex: 5,
      cat: "FOREIGN KEY (ALTER TABLE)",
      question: "Ex1 - Q5 : Ajouter la contrainte de clé étrangère entre num_patient de Patient (mère) et Sejour (fille).",
      tables: ["Sejour", "Patient"],
      sqlLines: [
        "ALTER TABLE Sejour",
        "ADD CONSTRAINT fk_sejour_patient",
        "FOREIGN KEY (num_patient) REFERENCES Patient(num_patient);"
      ],
      steps: [
        {
          activeLines: [0],
          title: "Étape 1 — On modifie toujours la table FILLE (Sejour)",
          explain: "C'est la table Sejour (table fille) qui contient la clé étrangère num_patient pointant vers Patient (table mère).",
          trace: [
            { badge: "Règle STI", text: "La contrainte FOREIGN KEY s'ajoute sur la table fille (Sejour)", status: "info" }
          ]
        },
        {
          activeLines: [0, 1, 2],
          title: "Étape 2 — Ajout de la référence d'intégrité référentielle",
          explain: "Tout num_patient saisi dans Sejour devra obligatoirement exister dans Patient(num_patient).",
          trace: [
            { badge: "🔗 FK", text: "Sejour.num_patient ➔ Patient.num_patient", status: "ok" }
          ],
          result: {
            cols: ["Table Fille", "Clé Étrangère", "Table Mère référencée"],
            rows: [["Sejour", "num_patient", "Patient (num_patient)"]]
          }
        }
      ]
    },
    {
      code: "Ex1-Q6",
      exo: 1,
      qIndex: 6,
      cat: "DEFAULT (Valeur par défaut)",
      question: "Ex1 - Q6 : Ajouter la valeur par défaut 'Tunis' à la colonne adr_patient de la table Patient.",
      tables: ["Patient"],
      sqlLines: [
        "ALTER TABLE Patient",
        "ALTER adr_patient SET DEFAULT 'Tunis';"
      ],
      steps: [
        {
          activeLines: [0],
          title: "Étape 1 — Ciblage de la colonne adr_patient dans Patient",
          explain: "On veut que toute insertion d'un patient sans adresse renseignée prenne automatiquement 'Tunis' (variante acceptée : MODIFY adr_patient VARCHAR(50) DEFAULT 'Tunis').",
          trace: [
            { badge: "Variante SQL", text: "ALTER TABLE Patient MODIFY adr_patient VARCHAR(50) DEFAULT 'Tunis';", status: "info" }
          ]
        },
        {
          activeLines: [0, 1],
          title: "Étape 2 — Application de DEFAULT 'Tunis'",
          explain: "La contrainte DEFAULT 'Tunis' est maintenant active sur adr_patient.",
          trace: [
            { badge: "✔ DEFAULT", text: "adr_patient prend 'Tunis' par défaut", status: "ok" }
          ],
          result: {
            cols: ["Colonne", "Type", "Valeur par défaut"],
            rows: [["adr_patient", "VARCHAR(50)", "'Tunis'"]]
          }
        }
      ]
    },

    // ==================== EXERCICE 2 : AGENCE DE LOCATION ====================
    {
      code: "Ex2-Q1",
      exo: 2,
      qIndex: 1,
      cat: "CREATE DATABASE",
      question: "Ex2 - Q1 : Créer la base de données Gestion_Location.",
      tables: ["Gestion_Location"],
      sqlLines: [
        "CREATE DATABASE Gestion_Location;",
        "USE Gestion_Location;"
      ],
      steps: [
        {
          activeLines: [0, 1],
          title: "Étape 1 — Création et sélection de la base Gestion_Location",
          explain: "CREATE DATABASE Gestion_Location; crée le schéma de base de données, puis USE Gestion_Location; la sélectionne.",
          trace: [
            { badge: "🗄️ Base créée", text: "Gestion_Location prête à recevoir les tables", status: "ok" }
          ],
          result: {
            cols: ["Base de données", "Statut"],
            rows: [["Gestion_Location", "Créée et active"]]
          }
        }
      ]
    },
    {
      code: "Ex2-Q2",
      exo: 2,
      qIndex: 2,
      cat: "CREATE TABLE (3 tables)",
      question: "Ex2 - Q2 : Créer les trois tables Client, Vehicule et Location.",
      tables: ["Client", "Vehicule", "Location"],
      sqlLines: [
        "CREATE TABLE Client (",
        "    NCIN_Cli VARCHAR(8) PRIMARY KEY,",
        "    Nom_Cli VARCHAR(20) NOT NULL,",
        "    Prenom_Cli VARCHAR(20) NOT NULL,",
        "    Adresse_Cli VARCHAR(50),",
        "    Ville VARCHAR(20)",
        ");",
        "CREATE TABLE Vehicule (",
        "    Immat_vehicule VARCHAR(10) PRIMARY KEY,",
        "    Marque VARCHAR(20) NOT NULL CHECK (Marque IN ('Peugeot','BYD','Fiat','Opel','Volkswagen','Citroen')),",
        "    Model VARCHAR(20) NOT NULL,",
        "    Annee_Acq YEAR NOT NULL",
        ");",
        "CREATE TABLE Location (",
        "    Immat_vehicule VARCHAR(10),",
        "    NCIN_Cli VARCHAR(8),",
        "    Date_Loc TIMESTAMP DEFAULT CURRENT_TIMESTAMP,",
        "    Duree_Loc INT CHECK (Duree_Loc > 0),",
        "    Cout_Loc DECIMAL(10,3) CHECK (Cout_Loc > 0),",
        "    PRIMARY KEY (Immat_vehicule, NCIN_Cli),",
        "    FOREIGN KEY (Immat_vehicule) REFERENCES Vehicule(Immat_vehicule),",
        "    FOREIGN KEY (NCIN_Cli) REFERENCES Client(NCIN_Cli)",
        ");"
      ],
      steps: [
        {
          activeLines: [0, 1, 2, 3, 4, 5, 6],
          title: "Étape 1 — Création de la table mère Client",
          explain: "NCIN_Cli VARCHAR(8) est la clé primaire ; Nom_Cli et Prenom_Cli sont obligatoires (NOT NULL).",
          trace: [
            { badge: "🔑 Client", text: "NCIN_Cli VARCHAR(8) PRIMARY KEY", status: "ok" }
          ]
        },
        {
          activeLines: [7, 8, 9, 10, 11, 12],
          title: "Étape 2 — Création de la table mère Vehicule",
          explain: "Immat_vehicule est la clé primaire, Marque est contrôlée par CHECK (... IN (...)) et Annee_Acq est de type YEAR NOT NULL.",
          trace: [
            { badge: "🔑 Vehicule", text: "Immat_vehicule VARCHAR(10) PRIMARY KEY", status: "ok" }
          ]
        },
        {
          activeLines: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22],
          title: "Étape 3 — Création de la table fille Location",
          explain: "Location possède une clé primaire composée (Immat_vehicule, NCIN_Cli), une date par défaut (TIMESTAMP DEFAULT CURRENT_TIMESTAMP) et des contraintes CHECK (> 0).",
          trace: [
            { badge: "🔑 Location", text: "PRIMARY KEY (Immat_vehicule, NCIN_Cli) + 2 FOREIGN KEY", status: "ok" }
          ],
          result: {
            cols: ["Table", "Clé Primaire", "Contraintes"],
            rows: [
              ["Client", "NCIN_Cli", "Nom_Cli, Prenom_Cli NOT NULL"],
              ["Vehicule", "Immat_vehicule", "Marque IN (...), Annee_Acq NOT NULL"],
              ["Location", "(Immat_vehicule, NCIN_Cli)", "Duree_Loc > 0, Cout_Loc > 0, 2 FK"]
            ]
          }
        }
      ]
    },
    {
      code: "Ex2-Q3a",
      exo: 2,
      qIndex: 3,
      subIndex: 1,
      cat: "ALTER TABLE ADD",
      question: "Ex2 - Q3.a : Ajouter à la table Client un champ Tel_Cli de type texte(10).",
      tables: ["Client"],
      sqlLines: [
        "ALTER TABLE Client",
        "ADD Tel_Cli VARCHAR(10);"
      ],
      steps: [
        {
          activeLines: [0, 1],
          title: "Ajout de la colonne Tel_Cli VARCHAR(10)",
          explain: "La commande ADD ajoute Tel_Cli de type VARCHAR(10) à la table Client.",
          trace: [
            { badge: "✔ Ajout", text: "Colonne Tel_Cli VARCHAR(10) ajoutée à Client", status: "ok" }
          ],
          result: {
            cols: ["Table", "Opération", "Détail"],
            rows: [["Client", "ADD COLUMN", "Tel_Cli VARCHAR(10)"]]
          }
        }
      ]
    },
    {
      code: "Ex2-Q3b",
      exo: 2,
      qIndex: 3,
      subIndex: 2,
      cat: "ALTER TABLE MODIFY",
      question: "Ex2 - Q3.b : Modifier le type de Tel_Cli en numérique de 8 chiffres.",
      tables: ["Client"],
      sqlLines: [
        "ALTER TABLE Client",
        "MODIFY Tel_Cli INT(8);"
      ],
      steps: [
        {
          activeLines: [0, 1],
          title: "Modification du type de Tel_Cli avec MODIFY",
          explain: "MODIFY Tel_Cli INT(8) change le type de la colonne Tel_Cli de VARCHAR(10) vers INT(8).",
          trace: [
            { badge: "✔ Modifié", text: "Tel_Cli passe de VARCHAR(10) à INT(8)", status: "ok" }
          ],
          result: {
            cols: ["Colonne", "Ancien type", "Nouveau type"],
            rows: [["Tel_Cli", "VARCHAR(10)", "INT(8)"]]
          }
        }
      ]
    },
    {
      code: "Ex2-Q3c",
      exo: 2,
      qIndex: 3,
      subIndex: 3,
      cat: "ALTER TABLE DROP COLUMN",
      question: "Ex2 - Q3.c : Supprimer la colonne Adresse_Cli dans la table Client.",
      tables: ["Client"],
      sqlLines: [
        "ALTER TABLE Client",
        "DROP COLUMN Adresse_Cli;"
      ],
      steps: [
        {
          activeLines: [0, 1],
          title: "Suppression de la colonne Adresse_Cli",
          explain: "DROP COLUMN Adresse_Cli retire définitivement la colonne Adresse_Cli de la table Client.",
          trace: [
            { badge: "✖ Supprimée", text: "Adresse_Cli retirée de Client", status: "no" }
          ],
          result: {
            cols: ["Table", "Colonne supprimée"],
            rows: [["Client", "Adresse_Cli"]]
          }
        }
      ]
    },
    {
      code: "Ex2-Q3d",
      exo: 2,
      qIndex: 3,
      subIndex: 4,
      cat: "ADD CONSTRAINT CHECK",
      question: "Ex2 - Q3.d : Vérifier que les valeurs de Annee_Acq dans Vehicule sont entre 2010 et 2026.",
      tables: ["Vehicule"],
      sqlLines: [
        "ALTER TABLE Vehicule",
        "ADD CONSTRAINT chk_annee CHECK (Annee_Acq BETWEEN 2010 AND 2026);"
      ],
      steps: [
        {
          activeLines: [0, 1],
          title: "Ajout d'une contrainte CHECK sur Annee_Acq",
          explain: "CHECK (Annee_Acq BETWEEN 2010 AND 2026) interdit toute année d'acquisition hors de l'intervalle [2010, 2026].",
          trace: [
            { badge: "✔ CHECK", text: "2010 <= Annee_Acq <= 2026", status: "ok" }
          ],
          result: {
            cols: ["Table", "Contrainte ajoutée", "Condition"],
            rows: [["Vehicule", "chk_annee (CHECK)", "Annee_Acq BETWEEN 2010 AND 2026"]]
          }
        }
      ]
    },
    {
      code: "Ex2-Q3e",
      exo: 2,
      qIndex: 3,
      subIndex: 5,
      cat: "DROP & ADD PRIMARY KEY",
      question: "Ex2 - Q3.e : Modifier la clé primaire de Location par (Immat_Vehicule, NCIN_Cli, Date_Loc).",
      tables: ["Location"],
      sqlLines: [
        "ALTER TABLE Location",
        "DROP PRIMARY KEY,",
        "ADD PRIMARY KEY (Immat_vehicule, NCIN_Cli, Date_Loc);"
      ],
      steps: [
        {
          activeLines: [0, 1],
          title: "Étape 1 — Suppression de l'ancienne clé primaire",
          explain: "Une table ne pouvant avoir qu'une seule clé primaire, on supprime d'abord l'ancienne avec DROP PRIMARY KEY.",
          trace: [
            { badge: "1. DROP PK", text: "Ancienne PK (Immat_vehicule, NCIN_Cli) retirée", status: "info" }
          ]
        },
        {
          activeLines: [0, 1, 2],
          title: "Étape 2 — Création de la nouvelle clé primaire à 3 colonnes",
          explain: "En intégrant Date_Loc dans la clé primaire, un même client peut louer le même véhicule à des dates différentes.",
          trace: [
            { badge: "2. ADD PK", text: "Nouvelle PK : (Immat_vehicule, NCIN_Cli, Date_Loc)", status: "ok" }
          ],
          result: {
            cols: ["Table", "Nouvelle Clé Primaire Composée"],
            rows: [["Location", "(Immat_vehicule, NCIN_Cli, Date_Loc)"]]
          }
        }
      ]
    },
    {
      code: "Ex2-Q3f..k",
      exo: 2,
      qIndex: 3,
      subIndex: 6,
      cat: "Opérations sur Clés, Tables & BD",
      question: "Ex2 - Q3 (f à k) : Supprimer PK Client, Désactiver/Réactiver contraintes, Renommer Vehicule en Voiture, Supprimer Client et la BD.",
      tables: ["Client", "Vehicule", "Location"],
      sqlLines: [
        "-- f. Supprimer la clé primaire de Client :",
        "ALTER TABLE Client DROP PRIMARY KEY;",
        "-- g & h. Désactiver / Réactiver les contraintes (MySQL) :",
        "ALTER TABLE Location DISABLE KEYS;",
        "ALTER TABLE Location ENABLE KEYS;",
        "-- i. Renommer la table Vehicule en Voiture :",
        "RENAME TABLE Vehicule TO Voiture;",
        "-- j. Supprimer la table Client :",
        "DROP TABLE Client;",
        "-- k. Supprimer la base de données Gestion_Location :",
        "DROP DATABASE Gestion_Location;"
      ],
      steps: [
        {
          activeLines: [0, 1, 2, 3, 4],
          title: "Étape 1 — Gestion des clés (f, g, h)",
          explain: "DROP PRIMARY KEY supprime la clé primaire de Client ; DISABLE KEYS / ENABLE KEYS désactive puis réactive les index/contraintes.",
          trace: [
            { badge: "f", text: "ALTER TABLE Client DROP PRIMARY KEY;", status: "info" },
            { badge: "g / h", text: "DISABLE KEYS / ENABLE KEYS sur Location", status: "info" }
          ]
        },
        {
          activeLines: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
          title: "Étape 2 — Renommage et suppression (i, j, k)",
          explain: "RENAME TABLE Vehicule TO Voiture renomme la table (ou ALTER TABLE Vehicule RENAME TO Voiture) ; DROP TABLE et DROP DATABASE suppriment définitivement la table et la base.",
          trace: [
            { badge: "i. RENAME", text: "Vehicule ➔ Voiture", status: "ok" },
            { badge: "j. DROP TABLE", text: "Suppression de la table Client", status: "no" },
            { badge: "k. DROP DATABASE", text: "Suppression complète de Gestion_Location", status: "no" }
          ],
          result: {
            cols: ["Sous-question", "Commande SQL"],
            rows: [
              ["3.f", "ALTER TABLE Client DROP PRIMARY KEY;"],
              ["3.g", "ALTER TABLE Location DISABLE KEYS;"],
              ["3.h", "ALTER TABLE Location ENABLE KEYS;"],
              ["3.i", "RENAME TABLE Vehicule TO Voiture;"],
              ["3.j", "DROP TABLE Client;"],
              ["3.k", "DROP DATABASE Gestion_Location;"]
            ]
          }
        }
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
    if (document.getElementById("tp1-anim-styles")) return;
    var st = document.createElement("style");
    st.id = "tp1-anim-styles";
    st.textContent = [
      ".tp1-anim-wrap{margin:22px 0 28px;border:2px solid #1e3a8a;border-radius:14px;background:linear-gradient(180deg,#0f172a 0%,#172554 100%);color:#f8fafc;box-shadow:0 14px 34px rgba(15,23,42,.24);overflow:hidden;font-family:'Segoe UI',system-ui,sans-serif}",
      ".tp1-anim-head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;padding:14px 18px;background:rgba(15,23,42,.78);border-bottom:1px solid rgba(148,163,184,.22)}",
      ".tp1-anim-title{display:flex;align-items:center;gap:10px;font-weight:800;font-size:1.05rem;color:#f8fafc}",
      ".tp1-anim-badge{background:linear-gradient(135deg,#0284c7,#2563eb);color:#fff;font-size:.76rem;font-weight:800;padding:4px 10px;border-radius:999px;letter-spacing:.03em;text-transform:uppercase}",
      ".tp1-anim-sub{font-size:.83rem;color:#cbd5e1;margin-top:2px}",
      ".tp1-qbar{display:flex;flex-wrap:wrap;gap:6px;padding:12px 16px;background:rgba(30,41,59,.75);border-bottom:1px solid rgba(148,163,184,.18)}",
      ".tp1-qbtn{border:1px solid rgba(148,163,184,.32);background:rgba(15,23,42,.7);color:#e2e8f0;font-weight:700;font-size:.8rem;padding:6px 10px;border-radius:8px;cursor:pointer;transition:all .15s}",
      ".tp1-qbtn:hover{border-color:#38bdf8;color:#fff;transform:translateY(-1px)}",
      ".tp1-qbtn.active{background:linear-gradient(135deg,#0284c7,#2563eb);border-color:#7dd3fc;color:#fff;box-shadow:0 4px 12px rgba(2,132,199,.4)}",
      ".tp1-body{padding:16px 18px;display:grid;grid-template-columns:1.1fr 1.2fr;gap:16px}",
      "@media(max-width:920px){.tp1-body{grid-template-columns:1fr}}",
      ".tp1-card{background:rgba(15,23,42,.66);border:1px solid rgba(148,163,184,.22);border-radius:11px;padding:13px 15px}",
      ".tp1-qheader{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}",
      ".tp1-qcat{font-size:.75rem;font-weight:800;padding:3px 9px;border-radius:999px;background:rgba(56,189,248,.16);color:#7dd3fc;border:1px solid rgba(56,189,248,.35)}",
      ".tp1-qtext{font-size:.95rem;font-weight:700;color:#f1f5f9;line-height:1.4;margin-bottom:10px}",
      ".tp1-sqlbox{background:#090d16;border:1px solid rgba(148,163,184,.25);border-radius:9px;padding:10px 12px;font-family:Consolas,'JetBrains Mono',monospace;font-size:.84rem;line-height:1.55;overflow-x:auto}",
      ".tp1-sqlline{padding:2px 8px;border-radius:5px;color:#64748b;transition:all .2s;white-space:pre}",
      ".tp1-sqlline.done{color:#e2e8f0}",
      ".tp1-sqlline.current{background:rgba(2,132,199,.25);border-left:3px solid #38bdf8;color:#fff;font-weight:700}",
      ".tp1-controls{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:12px}",
      ".tp1-cbtn{border:1px solid rgba(148,163,184,.35);background:#1e293b;color:#f8fafc;font-weight:700;font-size:.8rem;padding:7px 12px;border-radius:8px;cursor:pointer;display:inline-flex;align-items:center;gap:5px}",
      ".tp1-cbtn:hover:not(:disabled){background:#334155;border-color:#7dd3fc}",
      ".tp1-cbtn:disabled{opacity:.45;cursor:not-allowed}",
      ".tp1-cbtn.primary{background:linear-gradient(135deg,#059669,#10b981);border-color:#34d399;color:#fff}",
      ".tp1-step-dots{display:flex;gap:6px;margin-left:auto;align-items:center}",
      ".tp1-dot{width:26px;height:26px;border-radius:999px;border:1px solid rgba(148,163,184,.38);background:#0f172a;color:#94a3b8;font-size:.76rem;font-weight:800;cursor:pointer}",
      ".tp1-dot.active{background:#0284c7;color:#fff;border-color:#7dd3fc}",
      ".tp1-dot.done{background:rgba(16,185,129,.22);color:#6ee7b7;border-color:rgba(16,185,129,.5)}",
      ".tp1-step-box{margin-bottom:10px;padding:10px 12px;border-radius:9px;background:rgba(2,132,199,.13);border:1px solid rgba(56,189,248,.3)}",
      ".tp1-step-title{font-weight:800;font-size:.9rem;color:#7dd3fc;margin-bottom:4px}",
      ".tp1-step-exp{font-size:.84rem;color:#e2e8f0;line-height:1.45}",
      ".tp1-trace-list{display:flex;flex-direction:column;gap:6px;margin:10px 0}",
      ".tp1-trace-item{display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:7px;font-size:.82rem;background:rgba(30,41,59,.75);border:1px solid rgba(148,163,184,.2)}",
      ".tp1-trace-item.ok{background:rgba(16,185,129,.14);border-color:rgba(16,185,129,.4);color:#d1fae5}",
      ".tp1-trace-item.no{background:rgba(239,68,68,.13);border-color:rgba(239,68,68,.35);color:#fecaca}",
      ".tp1-trace-item.info{background:rgba(59,130,246,.13);border-color:rgba(59,130,246,.35);color:#dbeafe}",
      ".tp1-tbadge{font-weight:800;font-size:.73rem;padding:2px 7px;border-radius:5px;background:rgba(15,23,42,.65);white-space:nowrap}",
      ".tp1-res-wrap{margin-top:10px;border-top:1px solid rgba(148,163,184,.22);padding-top:10px}",
      ".tp1-res-title{font-size:.78rem;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:#6ee7b7;margin-bottom:6px}",
      ".tp1-res-table{width:100%;border-collapse:collapse;font-size:.8rem;background:#0f172a;border-radius:7px;overflow:hidden}",
      ".tp1-res-table th{background:#1e3a8a;color:#e0f2fe;padding:6px 9px;text-align:left;border:1px solid rgba(148,163,184,.25)}",
      ".tp1-res-table td{padding:5px 9px;border:1px solid rgba(148,163,184,.2);color:#f1f5f9}",
      ".tp1-inline-btn{margin-left:6px;background:linear-gradient(135deg,#0284c7,#2563eb);color:#fff;border:none;border-radius:5px;padding:4px 10px;font-size:.78rem;font-weight:700;cursor:pointer;vertical-align:middle}",
      ".tp1-show-btn{margin-left:6px;background:#2b6cb0;color:#fff;border:none;border-radius:5px;padding:4px 10px;font-size:.78rem;font-weight:700;cursor:pointer;vertical-align:middle}",
      ".tp1-inline-sql{display:none;background:#f7fafc;border:1px solid #cbd5e0;border-left:4px solid #2b6cb0;padding:8px 10px;border-radius:4px;font-family:Consolas,monospace;font-size:.86em;color:#2b6cb0;white-space:pre-wrap;margin:6px 0 10px}",
      ".tp1-global-bar{text-align:center;margin:14px 0}",
      ".tp1-global-btn{background:#2b6cb0;color:#fff;border:none;padding:9px 18px;border-radius:6px;font-weight:700;font-size:.9rem;cursor:pointer}",
      "@media print{.tp1-anim-wrap,.tp1-inline-btn,.tp1-show-btn,.tp1-global-bar{display:none!important}.tp1-inline-sql{display:block!important}}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function buildStudio() {
    injectStyles();

    var wrap = document.createElement("section");
    wrap.className = "tp1-anim-wrap";
    wrap.id = "tp1-anim-studio-mount";
    wrap.innerHTML =
      '<div class="tp1-anim-head">' +
        '<div>' +
          '<div class="tp1-anim-title">' +
            '<span class="tp1-anim-badge">🎬 Animation LDD Pas à Pas</span>' +
            '<span>Studio Interactif de Correction — Série 1 : Requêtes LDD (Exercices 1 & 2)</span>' +
          '</div>' +
          '<div class="tp1-anim-sub">Visualisez la création et la modification de structure : <code>CREATE TABLE</code>, <code>PRIMARY KEY</code>, <code>FOREIGN KEY</code>, <code>CHECK</code>, <code>ALTER TABLE (ADD, MODIFY, DROP)</code>.</div>' +
        '</div>' +
      '</div>' +
      '<div class="tp1-qbar" id="tp1-qbar"></div>' +
      '<div class="tp1-body">' +
        '<div class="tp1-card">' +
          '<div class="tp1-qheader">' +
            '<span class="tp1-qcat" id="tp1-qcat"></span>' +
            '<span style="font-size:.78rem;color:#94a3b8;" id="tp1-step-counter"></span>' +
          '</div>' +
          '<div class="tp1-qtext" id="tp1-qtext"></div>' +
          '<div class="tp1-sqlbox" id="tp1-sqlbox"></div>' +
          '<div class="tp1-controls">' +
            '<button type="button" class="tp1-cbtn primary" id="tp1-btn-play">▶ Animer pas à pas</button>' +
            '<button type="button" class="tp1-cbtn" id="tp1-btn-prev">◀ Étape préc.</button>' +
            '<button type="button" class="tp1-cbtn" id="tp1-btn-next">Étape suiv. ▶</button>' +
            '<button type="button" class="tp1-cbtn" id="tp1-btn-reset">⏮ Début</button>' +
            '<button type="button" class="tp1-cbtn" id="tp1-btn-full">⚡ Requête complète</button>' +
            '<button type="button" class="tp1-cbtn" id="tp1-btn-copy">📋 Copier SQL</button>' +
            '<div class="tp1-step-dots" id="tp1-step-dots"></div>' +
          '</div>' +
        '</div>' +
        '<div class="tp1-card">' +
          '<div class="tp1-step-box">' +
            '<div class="tp1-step-title" id="tp1-step-title"></div>' +
            '<div class="tp1-step-exp" id="tp1-step-exp"></div>' +
          '</div>' +
          '<div class="tp1-trace-list" id="tp1-trace-list"></div>' +
          '<div class="tp1-res-wrap" id="tp1-res-wrap"></div>' +
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
      var playBtn = document.getElementById("tp1-btn-play");
      if (playBtn) playBtn.textContent = "▶ Animer pas à pas";
    }

    function render() {
      var q = REQUETES[state.qIdx];
      var step = q.steps[state.stepIdx];

      var qBtns = document.querySelectorAll(".tp1-qbtn");
      for (var i = 0; i < qBtns.length; i++) {
        if (i === state.qIdx) qBtns[i].classList.add("active");
        else qBtns[i].classList.remove("active");
      }

      document.getElementById("tp1-qcat").textContent = q.code + " • " + q.cat;
      document.getElementById("tp1-step-counter").textContent =
        "Étape " + (state.stepIdx + 1) + " / " + q.steps.length;
      document.getElementById("tp1-qtext").textContent = q.question;

      var sqlBox = document.getElementById("tp1-sqlbox");
      var sqlHtml = "";
      var prevLines = state.stepIdx > 0 ? q.steps[state.stepIdx - 1].activeLines : [];
      for (var l = 0; l < q.sqlLines.length; l++) {
        var isActive = step.activeLines.indexOf(l) !== -1;
        var isNew = isActive && prevLines.indexOf(l) === -1;
        var cls = "tp1-sqlline";
        if (isNew || (state.stepIdx === 0 && isActive)) cls += " current";
        else if (isActive) cls += " done";
        sqlHtml += '<div class="' + cls + '">' + escapeHtml(q.sqlLines[l]) + "</div>";
      }
      sqlBox.innerHTML = sqlHtml;

      var dotsWrap = document.getElementById("tp1-step-dots");
      var dotsHtml = "";
      for (var s = 0; s < q.steps.length; s++) {
        var dCls = "tp1-dot";
        if (s === state.stepIdx) dCls += " active";
        else if (s < state.stepIdx) dCls += " done";
        dotsHtml += '<button type="button" class="' + dCls + '" data-step="' + s + '">' + (s + 1) + "</button>";
      }
      dotsWrap.innerHTML = dotsHtml;
      var dotBtns = dotsWrap.querySelectorAll(".tp1-dot");
      for (var db = 0; db < dotBtns.length; db++) {
        dotBtns[db].addEventListener("click", function () {
          stopAuto();
          state.stepIdx = parseInt(this.getAttribute("data-step"), 10);
          render();
        });
      }

      document.getElementById("tp1-btn-prev").disabled = state.stepIdx === 0;
      document.getElementById("tp1-btn-next").disabled = state.stepIdx === q.steps.length - 1;

      document.getElementById("tp1-step-title").textContent = step.title;
      document.getElementById("tp1-step-exp").textContent = step.explain;

      var traceList = document.getElementById("tp1-trace-list");
      var trHtml = "";
      for (var tr = 0; tr < step.trace.length; tr++) {
        var item = step.trace[tr];
        trHtml +=
          '<div class="tp1-trace-item ' + (item.status || "info") + '">' +
            '<span class="tp1-tbadge">' + escapeHtml(item.badge) + "</span>" +
            '<span>' + escapeHtml(item.text) + "</span>" +
          "</div>";
      }
      traceList.innerHTML = trHtml;

      var resWrap = document.getElementById("tp1-res-wrap");
      if (step.result) {
        var rHtml = '<div class="tp1-res-title">📐 État / Schéma SQL résultant</div>';
        rHtml += '<table class="tp1-res-table"><thead><tr>';
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
          '<div style="font-size:.8rem;color:#94a3b8;font-style:italic;">⏳ Passez à l\'étape suivante pour voir l\'état final de la structure…</div>';
      }
    }

    var qbar = document.getElementById("tp1-qbar");
    for (var q = 0; q < REQUETES.length; q++) {
      (function (idx) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "tp1-qbtn";
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

    document.getElementById("tp1-btn-prev").addEventListener("click", function () {
      stopAuto();
      if (state.stepIdx > 0) {
        state.stepIdx--;
        render();
      }
    });

    document.getElementById("tp1-btn-next").addEventListener("click", function () {
      stopAuto();
      var qObj = REQUETES[state.qIdx];
      if (state.stepIdx < qObj.steps.length - 1) {
        state.stepIdx++;
        render();
      }
    });

    document.getElementById("tp1-btn-reset").addEventListener("click", function () {
      stopAuto();
      state.stepIdx = 0;
      render();
    });

    document.getElementById("tp1-btn-full").addEventListener("click", function () {
      stopAuto();
      state.stepIdx = REQUETES[state.qIdx].steps.length - 1;
      render();
    });

    document.getElementById("tp1-btn-play").addEventListener("click", function () {
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

    document.getElementById("tp1-btn-copy").addEventListener("click", function () {
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
      var studio = document.getElementById("tp1-anim-studio-mount");
      if (studio && studio.scrollIntoView) {
        studio.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      var playBtn = document.getElementById("tp1-btn-play");
      if (playBtn) playBtn.click();
    }

    // Attacher les boutons "👁️ Voir la réponse" et "🎬 Animer" aux questions des Exercices 1 et 2
    var ols = document.querySelectorAll("ol");
    if (ols.length >= 2) {
      var gBar = document.createElement("div");
      gBar.className = "tp1-global-bar";
      var gBtn = document.createElement("button");
      gBtn.type = "button";
      gBtn.className = "tp1-global-btn";
      gBtn.textContent = "✅ Afficher toutes les réponses SQL";
      gBtn.addEventListener("click", function () {
        var pres = document.querySelectorAll(".tp1-inline-sql");
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
        var sBtns = document.querySelectorAll(".tp1-show-btn");
        for (var sb = 0; sb < sBtns.length; sb++) {
          sBtns[sb].textContent = anyHidden ? "🙈 Masquer" : "👁️ Voir la réponse";
        }
        gBtn.textContent = anyHidden ? "🙈 Masquer toutes les réponses SQL" : "✅ Afficher toutes les réponses SQL";
      });
      gBar.appendChild(gBtn);
      wrap.parentNode.insertBefore(gBar, wrap.nextSibling);

      var ex1Lis = ols[0].children;
      // Ex1 Q1 combines index 0 & 1
      var ex1Map = [
        { li: ex1Lis[0], reqIdx: 1, sql: REQUETES[0].sqlLines.join("\n") + "\n\n" + REQUETES[1].sqlLines.join("\n") },
        { li: ex1Lis[1], reqIdx: 2, sql: REQUETES[2].sqlLines.join("\n") },
        { li: ex1Lis[2], reqIdx: 3, sql: REQUETES[3].sqlLines.join("\n") },
        { li: ex1Lis[3], reqIdx: 4, sql: REQUETES[4].sqlLines.join("\n") },
        { li: ex1Lis[4], reqIdx: 5, sql: REQUETES[5].sqlLines.join("\n") },
        { li: ex1Lis[5], reqIdx: 6, sql: REQUETES[6].sqlLines.join("\n") }
      ];

      var ex2Lis = ols[1].children;
      var ex2SubLis = ex2Lis[2] ? ex2Lis[2].querySelectorAll("ul > li") : [];
      var ex2Map = [
        { li: ex2Lis[0], reqIdx: 7, sql: REQUETES[7].sqlLines.join("\n") },
        { li: ex2Lis[1], reqIdx: 8, sql: REQUETES[8].sqlLines.join("\n") },
        { li: ex2SubLis[0], reqIdx: 9, sql: REQUETES[9].sqlLines.join("\n") },
        { li: ex2SubLis[1], reqIdx: 10, sql: REQUETES[10].sqlLines.join("\n") },
        { li: ex2SubLis[2], reqIdx: 11, sql: REQUETES[11].sqlLines.join("\n") },
        { li: ex2SubLis[3], reqIdx: 12, sql: REQUETES[12].sqlLines.join("\n") },
        { li: ex2SubLis[4], reqIdx: 13, sql: REQUETES[13].sqlLines.join("\n") },
        { li: ex2SubLis[5], reqIdx: 14, sql: "ALTER TABLE Client DROP PRIMARY KEY;" },
        { li: ex2SubLis[6], reqIdx: 14, sql: "ALTER TABLE Location DISABLE KEYS;" },
        { li: ex2SubLis[7], reqIdx: 14, sql: "ALTER TABLE Location ENABLE KEYS;" },
        { li: ex2SubLis[8], reqIdx: 14, sql: "RENAME TABLE Vehicule TO Voiture;" },
        { li: ex2SubLis[9], reqIdx: 14, sql: "DROP TABLE Client;" },
        { li: ex2SubLis[10], reqIdx: 14, sql: "DROP DATABASE Gestion_Location;" }
      ];

      var allItems = ex1Map.concat(ex2Map);
      for (var m = 0; m < allItems.length; m++) {
        (function (item) {
          if (!item.li) return;
          var sBtn = document.createElement("button");
          sBtn.type = "button";
          sBtn.className = "tp1-show-btn";
          sBtn.textContent = "👁️ Voir la réponse";

          var aBtn = document.createElement("button");
          aBtn.type = "button";
          aBtn.className = "tp1-inline-btn";
          aBtn.textContent = "🎬 Animer " + REQUETES[item.reqIdx].code;

          var pre = document.createElement("pre");
          pre.className = "tp1-inline-sql";
          pre.textContent = item.sql;

          sBtn.addEventListener("click", function () {
            var vis = pre.style.display === "block";
            pre.style.display = vis ? "none" : "block";
            sBtn.textContent = vis ? "👁️ Voir la réponse" : "🙈 Masquer";
          });

          aBtn.addEventListener("click", function () {
            pre.style.display = "block";
            sBtn.textContent = "🙈 Masquer";
            openAndAnimate(item.reqIdx);
          });

          item.li.appendChild(sBtn);
          item.li.appendChild(aBtn);
          item.li.appendChild(pre);
        })(allItems[m]);
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
