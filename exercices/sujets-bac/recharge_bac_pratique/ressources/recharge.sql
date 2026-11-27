-- Base fournie : réseau de bornes de recharge pour véhicules électriques
CREATE DATABASE recharge DEFAULT CHARACTER SET utf8mb4;
USE recharge;

CREATE TABLE typeborne (
  idtype INT PRIMARY KEY AUTO_INCREMENT,
  libelle VARCHAR(30) NOT NULL,
  tarifkwh DECIMAL(4,2) NOT NULL
);

CREATE TABLE borne (
  idborne INT PRIMARY KEY AUTO_INCREMENT,
  nomborne VARCHAR(40) NOT NULL,
  ville VARCHAR(30),
  puissance INT,
  idtype INT,
  FOREIGN KEY (idtype) REFERENCES typeborne(idtype)
);

INSERT INTO typeborne VALUES
(1,'Lente (AC)',0.35),
(2,'Rapide (DC)',0.55),
(3,'Ultra-rapide (DC)',0.75);

INSERT INTO borne VALUES
(1,'Centre Ville','Tunis',7,1),
(2,'Berges du Lac','Tunis',22,1),
(3,'Aéroport Tunis-Carthage','Tunis',50,2),
(4,'Corniche','Sousse',22,1),
(5,'Autoroute A1 Sousse','Sousse',150,3),
(6,'Zone Industrielle','Sfax',50,2),
(7,'Port de Sfax','Sfax',7,1),
(8,'Ennasr','Ariana',22,1),
(9,'Autoroute A1 Hammamet','Hammamet',150,3),
(10,'Centre Commercial','Sousse',50,2);
