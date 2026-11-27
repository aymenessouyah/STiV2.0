-- ==========================================================
-- Exercice de synthèse n°2 : Recharge voiture électrique
-- Base : station   ·   Table : recharges
-- STI version 2.0 By AE
-- Id : commence par une lettre majuscule = le TYPE de recharge
--   L = Lente · N = Normale · R = Rapide · U = Ultra-rapide
-- Borne : la station utilisée (S1, S2, S3, S4)
-- Horaires de travail : 8h00-12h00 et 13h00-18h00
-- ==========================================================
CREATE DATABASE IF NOT EXISTS station;
USE station;

CREATE TABLE recharges (
  Id VARCHAR(10) PRIMARY KEY,
  Nom_prenom VARCHAR(60) NOT NULL,
  Borne VARCHAR(5) NOT NULL,
  Kwh DECIMAL(5,2) NOT NULL,
  DateRecharge DATE NOT NULL,
  HeureRecharge TIME NOT NULL
);

INSERT INTO recharges (Id, Nom_prenom, Borne, Kwh, DateRecharge, HeureRecharge) VALUES
('L01', 'Trabelsi Sara', 'S1', 12.50, '2025-09-03', '08:30:00'),
('L02', 'Ayadi Nour',     'S2', 15.00, '2025-09-10', '09:00:00'),
('N01', 'Benali Amine',   'S1', 25.00, '2025-10-02', '10:00:00'),
('N02', 'Haddad Leila',   'S3', 30.50, '2025-10-05', '11:00:00'),
('R01', 'Gharbi Yassine', 'S2', 45.00, CURDATE(),    '13:30:00'),
('R02', 'Mansouri Khalil', 'S4', 52.75, '2025-10-12', '14:00:00'),
('U01', 'Slimani Omar',    'S1', 68.00, CURDATE(),    '15:30:00'),
('U02', 'Cherif Ines',     'S3', 80.25, '2025-10-20', '16:00:00');
