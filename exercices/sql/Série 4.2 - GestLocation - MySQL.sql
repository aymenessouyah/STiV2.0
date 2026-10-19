-- ============================================================
-- SÉRIE 4.2 - GESTLOCATION - VERSION MySQL 8.x
-- Lycée Rafèha Mnihla Ariana - Enseignant : Aymen Essouyah
-- Année 2026-2027 - 5 tables + 41 requêtes
-- Testé MySQL 8 : OK - Syntaxe sans JOIN
-- ============================================================
-- Pour tester : ouvrez MySQL Workbench / phpMyAdmin
-- Copiez-collez tout ce fichier et exécutez (F9)
-- ============================================================

DROP DATABASE IF EXISTS GestLocation;
CREATE DATABASE GestLocation CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE GestLocation;

-- ------------------------------------------------------------
-- 2. Création des tables (ordre important à cause des FK)
-- ------------------------------------------------------------
CREATE TABLE Marque (
    codeMarque VARCHAR(10) PRIMARY KEY,
    nomMarque  VARCHAR(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Modele (
    codeModele VARCHAR(10) PRIMARY KEY,
    nomModele  VARCHAR(30) NOT NULL,
    codeMarque VARCHAR(10) NOT NULL,
    FOREIGN KEY (codeMarque) REFERENCES Marque(codeMarque) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Voiture (
    matricule   VARCHAR(10) PRIMARY KEY,
    codeMarque  VARCHAR(10) NOT NULL,
    codeModele  VARCHAR(10) NOT NULL,
    type        CHAR(1) NOT NULL CHECK (type IN ('C','S','B')),
    prixJour    INT NOT NULL CHECK (prixJour > 0),
    FOREIGN KEY (codeMarque) REFERENCES Marque(codeMarque) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (codeModele) REFERENCES Modele(codeModele) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Client (
    numCl VARCHAR(10) PRIMARY KEY,
    nom   VARCHAR(40) NOT NULL,
    ville VARCHAR(30)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Location (
    numLoc    INT AUTO_INCREMENT PRIMARY KEY,
    matricule VARCHAR(10) NOT NULL,
    numCl     VARCHAR(10) NOT NULL,
    dateDebut DATETIME NOT NULL,
    nbJours   INT NOT NULL CHECK (nbJours > 0),
    assurance VARCHAR(5) NOT NULL CHECK (assurance IN ('TR','S')),
    FOREIGN KEY (matricule) REFERENCES Voiture(matricule) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (numCl) REFERENCES Client(numCl) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 3. Jeu d'essai
-- ------------------------------------------------------------
INSERT INTO Marque (codeMarque, nomMarque) VALUES
('M01','Renault'),
('M02','Peugeot'),
('M03','Volkswagen');

INSERT INTO Modele (codeModele, nomModele, codeMarque) VALUES
('MO01','Clio','M01'),
('MO02','Duster','M01'),
('MO03','Passat','M03'),
('MO04','3008','M02');

INSERT INTO Voiture (matricule, codeMarque, codeModele, type, prixJour) VALUES
('V01','M01','MO01','C',120),
('V02','M01','MO02','S',180),
('V03','M03','MO03','B',250),
('V04','M02','MO04','S',180);

INSERT INTO Client (numCl, nom, ville) VALUES
('Cl01','Ahmed Ben Ali','Tunis'),
('Cl02','Leila Mansour','Ariana'),
('Cl03','Sami Trabelsi','Sfax');

INSERT INTO Location (matricule, numCl, dateDebut, nbJours, assurance) VALUES
('V01','Cl02','2022-05-20 09:00:00',3,'TR'),
('V01','Cl03','2022-04-07 11:00:00',5,'S'),
('V02','Cl01','2022-06-24 15:00:00',10,'TR'),
('V03','Cl01','2022-06-24 15:00:00',10,'TR'),
('V03','Cl03','2022-07-17 08:30:00',7,'S'),
('V04','Cl02','2022-06-26 13:30:00',4,'S');

-- Vérification rapide
SELECT 'Marque' AS tbl, COUNT(*) FROM Marque UNION ALL
SELECT 'Modele', COUNT(*) FROM Modele UNION ALL
SELECT 'Voiture', COUNT(*) FROM Voiture UNION ALL
SELECT 'Client', COUNT(*) FROM Client UNION ALL
SELECT 'Location', COUNT(*) FROM Location;

-- ============================================================
-- B. MISES À JOUR (Q2-Q3) - MySQL syntax
-- ============================================================
-- Q2 : Année → 2026 (garder jour/mois/heure)
UPDATE Location SET dateDebut = DATE_ADD(dateDebut, INTERVAL (2026 - YEAR(dateDebut)) YEAR);
SELECT numLoc, dateDebut, YEAR(dateDebut) FROM Location; -- vérif : 2026 partout

-- Q3 : +15% voitures louées par clients d'Ariana (avec liaison WHERE, sans JOIN)
UPDATE Voiture SET prixJour = prixJour * 1.15
WHERE matricule IN (
    SELECT L.matricule FROM Location L, Client C WHERE L.numCl=C.numCl AND C.ville='Ariana'
);
SELECT matricule, prixJour FROM Voiture; -- V01 138, V04 207

-- ============================================================
-- C. CONSULTATIONS Q4-Q23 (syntaxe WHERE sans JOIN)
-- ============================================================
-- Q4 Clients Ariana
SELECT * FROM Client WHERE ville='Ariana';
-- Q5 Voitures par marque
SELECT M.nomMarque, COUNT(*) AS nb FROM Voiture V, Marque M WHERE V.codeMarque=M.codeMarque GROUP BY M.nomMarque;
-- Q6 Moins chère
SELECT * FROM Voiture WHERE prixJour=(SELECT MIN(prixJour) FROM Voiture);
-- Q7 Détail 5 tables
SELECT L.numLoc, L.dateDebut, C.nom, M.nomMarque, MO.nomModele FROM Location L, Client C, Voiture V, Marque M, Modele MO WHERE L.numCl=C.numCl AND L.matricule=V.matricule AND V.codeMarque=M.codeMarque AND V.codeModele=MO.codeModele;
-- Q8.1 Aujourd'hui
SELECT L.numLoc, C.nom FROM Location L, Client C WHERE L.numCl=C.numCl AND DATE(L.dateDebut)=CURDATE();
-- Q8.2 7 derniers jours
SELECT * FROM Location WHERE DATEDIFF(CURDATE(), DATE(dateDebut)) BETWEEN 0 AND 7;
-- Q8.3 >30 jours
SELECT * FROM Location WHERE DATEDIFF(CURDATE(), DATE(dateDebut)) > 30;
-- Q9 Prix moyen
SELECT AVG(prixJour) AS prixMoyen FROM Voiture;
-- Q10 Prix moyen par marque
SELECT M.nomMarque, AVG(V.prixJour) AS moy FROM Voiture V, Marque M WHERE V.codeMarque=M.codeMarque GROUP BY M.nomMarque;
-- Q11 Locations Cl03
SELECT * FROM Location WHERE numCl='Cl03';
-- Q12 Facture Cl03
SELECT SUM(L.nbJours*V.prixJour) AS facture FROM Location L, Voiture V WHERE L.matricule=V.matricule AND L.numCl='Cl03';
-- Q13 En cours
SELECT DISTINCT C.nom FROM Location L, Client C WHERE L.numCl=C.numCl AND NOW() BETWEEN L.dateDebut AND DATE_ADD(L.dateDebut, INTERVAL L.nbJours DAY);
-- Q14 Même assurance que Cl02
SELECT COUNT(DISTINCT numCl) FROM Location WHERE assurance IN (SELECT assurance FROM Location WHERE numCl='Cl02');
-- Q15 Durée > moyenne
SELECT * FROM Location WHERE nbJours > (SELECT AVG(nbJours) FROM Location);
-- Q16 Durée > numLoc2
SELECT * FROM Location WHERE nbJours > (SELECT nbJours FROM Location WHERE numLoc=2);
-- Q17 Citadine
SELECT COUNT(*) FROM Location L, Voiture V WHERE L.matricule=V.matricule AND V.type='C';
-- Q18 Total jours par voiture
SELECT V.matricule, M.nomMarque, MO.nomModele, SUM(L.nbJours) AS tot FROM Location L, Voiture V, Marque M, Modele MO WHERE L.matricule=V.matricule AND V.codeMarque=M.codeMarque AND V.codeModele=MO.codeModele GROUP BY V.matricule, M.nomMarque, MO.nomModele;
-- Q19 CA par voiture
SELECT V.matricule, SUM(L.nbJours*V.prixJour) AS CA FROM Location L, Voiture V WHERE L.matricule=V.matricule GROUP BY V.matricule;
-- Q20 Par client/assurance
SELECT numCl, assurance, COUNT(*) AS nb FROM Location GROUP BY numCl, assurance ORDER BY numCl;
-- Q21 Tri
SELECT * FROM Voiture ORDER BY type ASC, prixJour DESC;
-- Q22 >=2 locations
SELECT numCl, COUNT(*) AS nb FROM Location GROUP BY numCl HAVING COUNT(*)>=2;
-- Q23 Sans location
SELECT * FROM Voiture WHERE matricule NOT IN (SELECT matricule FROM Location);

-- ============================================================
-- D. FONCTIONS CHAÎNES & DATES (Q24-Q35)
-- ============================================================
-- Q24 CONCAT
SELECT CONCAT(M.nomMarque, ' ', MO.nomModele, ' (', V.matricule, ')') AS libelle FROM Voiture V, Marque M, Modele MO WHERE V.codeMarque=M.codeMarque AND V.codeModele=MO.codeModele;
-- Q25 Longueur nom client
SELECT nom, CHAR_LENGTH(nom) AS longueur FROM Client; -- LENGTH() compte octets, CHAR_LENGTH() caractères
-- Q26 SUBSTRING 3 premiers du modèle
SELECT nomModele, SUBSTRING(nomModele,1,3) AS ext FROM Modele;
-- Q27 LEFT 3 premières lettres client
SELECT nom, LEFT(nom,3) AS debut FROM Client;
-- Q28 RIGHT 2 derniers du matricule
SELECT matricule, RIGHT(matricule,2) AS fin FROM Voiture;
-- Q29 DAY / DAYOFMONTH
SELECT numLoc, DAY(dateDebut) AS jour, DAYOFMONTH(dateDebut) AS jour2 FROM Location;
-- Q30 DAYNAME
SELECT numLoc, DAYNAME(dateDebut) AS nomJour FROM Location;
-- Q31 DAYOFWEEK 1=Dimanche...
SELECT numLoc, DAYOFWEEK(dateDebut) AS numJour FROM Location;
-- Q32 DAYOFYEAR 1-366
SELECT numLoc, DAYOFYEAR(dateDebut) AS jourAnnee FROM Location;
-- Q33 MONTH
SELECT numLoc, MONTH(dateDebut) AS mois FROM Location;
-- Q34 YEAR
SELECT numLoc, YEAR(dateDebut) AS annee FROM Location;
-- Q35 NOW / GETDATE
SELECT NOW() AS maintenant, CURDATE() AS aujourdhui, CURTIME() AS heure;

-- ============================================================
-- E. AUTRE UPDATE + 2 DELETE avec liaison (Q36-Q38)
-- ============================================================
-- Q36 UPDATE ville Ariana pour clients ayant loué Volkswagen
UPDATE Client SET ville='Ariana'
WHERE numCl IN (SELECT L.numCl FROM Location L, Voiture V, Marque M WHERE L.matricule=V.matricule AND V.codeMarque=M.codeMarque AND M.nomMarque='Volkswagen');

-- Vérif
SELECT * FROM Client;

-- Q37 DELETE locations <5j de voitures Citadine (liaison)
DELETE FROM Location WHERE nbJours < 5 AND matricule IN (SELECT matricule FROM Voiture WHERE type='C');
SELECT * FROM Location; -- 1 ligne supprimée (V01, 3j)

-- Pour retester, réinsérez si besoin :
-- INSERT INTO Location (matricule,numCl,dateDebut,nbJours,assurance) VALUES ('V01','Cl02','2026-05-20 09:00:00',3,'TR');

-- Q38 DELETE clients sans location
DELETE FROM Client WHERE numCl NOT IN (SELECT numCl FROM Location WHERE numCl IS NOT NULL);
SELECT * FROM Client; -- 0 supprimé (tous ont une location)
-- Test : INSERT INTO Client VALUES ('Cl04','Test','Sousse'); puis re-exécuter → 1 supprimé

-- ============================================================
-- F. RÔLE (Q39-Q41) - Analyse
-- ============================================================
-- Q39 Rôle : SELECT M.nomMarque, COUNT(*) ... GROUP BY M.nomMarque;
-- → Affiche le nombre de voitures par marque (Renault 2, Peugeot 1, VW 1)
SELECT M.nomMarque, COUNT(*) AS nb FROM Voiture V, Marque M WHERE V.codeMarque=M.codeMarque GROUP BY M.nomMarque;

-- Q40 Rôle : SELECT nom, LENGTH(nom) FROM Client WHERE ville='Ariana';
-- → Affiche le nom et sa longueur pour les clients d'Ariana
SELECT nom, CHAR_LENGTH(nom) AS longueur FROM Client WHERE ville='Ariana';

-- Q41 Rôle : DELETE ... WHERE nbJours<5 AND matricule IN (SELECT ... WHERE type='C')
-- → Supprime les petites locations (<5j) des voitures Citadines
-- Vérif avant/après : SELECT * FROM Location WHERE nbJours<5;

-- BONUS : CA par marque
SELECT M.nomMarque, SUM(L.nbJours*V.prixJour) AS CA FROM Location L, Voiture V, Marque M WHERE L.matricule=V.matricule AND V.codeMarque=M.codeMarque GROUP BY M.nomMarque ORDER BY CA DESC;
