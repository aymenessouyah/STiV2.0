-- Série 8 SQL — restaurant Dar Zitouna (MySQL / MariaDB)
-- Données et dates du nouvel énoncé et du corrigé fourni.
-- Exécuter dans une base vide ou adaptée : les tables ne sont pas supprimées.

CREATE TABLE SERVEUR (
    num INT PRIMARY KEY,
    nom VARCHAR(20),
    salle VARCHAR(20),
    date_embauche DATE
);

CREATE TABLE COMMANDE (
    num INT PRIMARY KEY,
    plat VARCHAR(30),
    categorie VARCHAR(15),
    prix DECIMAL(5,2),
    qte INT,
    numserveur INT,
    date_cmd DATE,
    FOREIGN KEY (numserveur) REFERENCES SERVEUR(num)
);

INSERT INTO SERVEUR (num, nom, salle, date_embauche) VALUES
(1, 'Sami', 'Terrasse', '2022-01-01'),
(2, 'Rim', 'Salon', '2023-09-01'),
(3, 'Karim', 'Terrasse', '2019-02-15'),
(4, 'Nour', 'Salon', '2024-01-10');

INSERT INTO COMMANDE (num, plat, categorie, prix, qte, numserveur, date_cmd) VALUES
(1, 'Salade tunisienne', 'Entrée', 6, 2, 1, '2026-03-15'),
(2, 'Brik à l''oeuf', 'Entrée', 4, 5, 2, '2026-03-15'),
(3, 'Couscous à l''agneau', 'Plat', 22, 3, 1, '2026-03-22'),
(4, 'Poisson grillé', 'Plat', 28, 2, 3, '2026-03-28'),
(5, 'Ojja merguez', 'Plat', 18, 4, 2, '2026-04-15'),
(6, 'Makroudh', 'Dessert', 5, 6, 3, '2026-06-10'),
(7, 'Assidat zgougou', 'Dessert', 7, 3, 1, '2026-11-15'),
(8, 'Thé à la menthe', 'Boisson', 3, 8, 2, '2027-01-15'),
(9, 'Jus d''orange', 'Boisson', 4, 5, 3, '2027-02-20'),
(10, 'Brik au thon', 'Entrée', 4, 4, 1, '2027-03-15'),
(11, 'Lablabi', 'Plat', 9, 2, 2, '2027-04-08'),
(12, 'Eau minérale', 'Boisson', 2, 10, 3, '2027-04-14');
