-- ============================================================
--  Export de la base de données « ecole »
--  Exercice de synthèse PHP — Point 10 (cours/php.html)
--  Plateforme STI V2.0 by AE · Lycée Raféha
-- ------------------------------------------------------------
--  Import : phpMyAdmin → Importer → choisir ce fichier.
--  Table utilisée par les pages 10.1 à 10.4 :
--  eleves(Id, Nom_prenom, Moyenne, DateNaissance)
--  L'Id commence toujours par une lettre en majuscule :
--  cette première lettre est la Catégorie de l'élève (A, B, C…).
-- ============================================================

CREATE DATABASE IF NOT EXISTS ecole CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE ecole;

DROP TABLE IF EXISTS eleves;

CREATE TABLE eleves (
  Id VARCHAR(10) NOT NULL,
  Nom_prenom VARCHAR(60) NOT NULL,
  Moyenne DECIMAL(4,2) NOT NULL,
  DateNaissance DATE NOT NULL,
  PRIMARY KEY (Id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Jeu d'essai : 2 élèves par Catégorie (A, B, C, D)
INSERT INTO eleves (Id, Nom_prenom, Moyenne, DateNaissance) VALUES
('A01', 'Benali Amine',   17.50, '2008-03-14'),
('A02', 'Trabelsi Sara',  16.25, '2008-07-02'),
('B01', 'Gharbi Yassine', 14.75, '2007-11-25'),
('B02', 'Haddad Leila',   13.50, '2008-01-19'),
('C01', 'Mansouri Khalil', 11.75, '2007-09-08'),
('C02', 'Ayadi Nour',     10.50, '2008-05-30'),
('D01', 'Slimani Omar',    8.75, '2007-12-11'),
('D02', 'Cherif Ines',     7.25, '2008-09-17');
