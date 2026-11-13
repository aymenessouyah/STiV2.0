-- Série 8 SQL — restaurant Dar Zitouna (MySQL / MariaDB)
-- Données de l'énoncé, sans suppression ni création automatique de base.
-- Exécuter dans une base vide ou adaptée : les tables ne sont pas supprimées.
-- La partie D utilise date_cmd et date_embauche, mais l'énoncé ne fournit
-- aucune valeur pour ces dates. Elles sont donc NULL, et doivent être
-- renseignées par l'élève avant d'obtenir des résultats aux questions de dates.

CREATE TABLE SERVEUR (
    num INT PRIMARY KEY,
    nom VARCHAR(50) NOT NULL,
    salle VARCHAR(50) NOT NULL,
    date_embauche DATE DEFAULT NULL
);

CREATE TABLE COMMANDE (
    num INT PRIMARY KEY,
    plat VARCHAR(100) NOT NULL,
    categorie VARCHAR(50) NOT NULL,
    prix DECIMAL(10,2) NOT NULL,
    qte INT NOT NULL,
    numserveur INT,
    date_cmd DATE DEFAULT NULL,
    FOREIGN KEY (numserveur) REFERENCES SERVEUR(num)
);

INSERT INTO SERVEUR (num, nom, salle) VALUES
(1, 'Sami', 'Terrasse'),
(2, 'Rim', 'Salon'),
(3, 'Karim', 'Terrasse'),
(4, 'Nour', 'Salon');

INSERT INTO COMMANDE (num, plat, categorie, prix, qte, numserveur) VALUES
(1, 'Salade tunisienne', 'Entrée', 6, 2, 1),
(2, 'Brik à l''oeuf', 'Entrée', 4, 5, 2),
(3, 'Couscous à l''agneau', 'Plat', 22, 3, 1),
(4, 'Poisson grillé', 'Plat', 28, 2, 3),
(5, 'Ojja merguez', 'Plat', 18, 4, 2),
(6, 'Makroudh', 'Dessert', 5, 6, 3),
(7, 'Assidat zgougou', 'Dessert', 7, 3, 1),
(8, 'Thé à la menthe', 'Boisson', 3, 8, 2),
(9, 'Jus d''orange', 'Boisson', 4, 5, 3),
(10, 'Brik au thon', 'Entrée', 4, 4, 1),
(11, 'Lablabi', 'Plat', 9, 2, 2),
(12, 'Eau minérale', 'Boisson', 2, 10, 3);
