-- ==========================================================
-- Exercice de synthèse n°2 : Recharge voiture électrique
-- Base : station   ·   Table : recharges
-- STI version 2.0 By AE
-- Id : commence par une lettre majuscule = le TYPE de recharge
--   L = Lente · N = Normale · R = Rapide · U = Ultra-rapide
-- ==========================================================
CREATE DATABASE IF NOT EXISTS station;
USE station;

CREATE TABLE recharges (
  Id VARCHAR(10) PRIMARY KEY,
  Nom_prenom VARCHAR(60) NOT NULL,
  Kwh DECIMAL(5,2) NOT NULL,
  DateRecharge DATE NOT NULL
);

INSERT INTO recharges (Id, Nom_prenom, Kwh, DateRecharge) VALUES
('L01', 'Trabelsi Sara', 12.50, '2025-09-03'),
('L02', 'Ayadi Nour',     15.00, '2025-09-10'),
('N01', 'Benali Amine',   25.00, '2025-10-02'),
('N02', 'Haddad Leila',   30.50, '2025-10-05'),
('R01', 'Gharbi Yassine', 45.00, '2025-10-08'),
('R02', 'Mansouri Khalil', 52.75, '2025-10-12'),
('U01', 'Slimani Omar',    68.00, '2025-10-15'),
('U02', 'Cherif Ines',     80.25, '2025-10-20');
