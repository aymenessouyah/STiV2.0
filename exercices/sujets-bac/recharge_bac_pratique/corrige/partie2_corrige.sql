USE recharge;

-- LDD
-- 1
CREATE TABLE recharge (
  idrec INT PRIMARY KEY AUTO_INCREMENT,
  idborne INT,
  immat VARCHAR(15) NOT NULL,
  daterec DATE NOT NULL,
  kwh DECIMAL(5,1),
  FOREIGN KEY (idborne) REFERENCES borne(idborne)
);
-- 2
ALTER TABLE borne ADD etat VARCHAR(15) DEFAULT 'libre';
-- 3
ALTER TABLE recharge ADD CHECK (kwh > 0);

-- LMD
-- 4
INSERT INTO recharge(idborne,immat,daterec,kwh) VALUES
(1,'123 TUN 4567','2026-11-18',12.5),
(3,'234 TUN 8910','2026-11-19',35.0),
(3,'345 TUN 1122','2026-11-21',28.4),
(5,'456 TUN 3344','2026-11-22',42.0),
(5,'678 TUN 7788','2026-11-23',55.0),
(3,'123 TUN 4567','2026-11-25',3.2),
(6,'567 TUN 5566','2026-11-26',NULL);
-- 5
UPDATE borne SET etat='hors service' WHERE ville='Sfax';
-- 6
DELETE FROM recharge WHERE kwh < 5;
-- 7
SELECT nomborne, COUNT(*), SUM(kwh)
FROM borne b, recharge r
WHERE b.idborne = r.idborne
GROUP BY b.idborne, nomborne
HAVING COUNT(*) > 1;
