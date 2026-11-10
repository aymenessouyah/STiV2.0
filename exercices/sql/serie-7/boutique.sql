-- ============================================================================
-- BASE DE DONNÉES : Boutique (Vendeurs & Ventes)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. LANGAGE DE DÉFINITION DE DONNÉES (LDD)
-- ----------------------------------------------------------------------------

-- Création de la table VENDEUR
CREATE TABLE VENDEUR (
    id_vendeur INT PRIMARY KEY,
    nom VARCHAR(50) NOT NULL
);

-- Création de la table VENTE
CREATE TABLE VENTE (
    id INT PRIMARY KEY,
    article VARCHAR(50) NOT NULL,
    categorie VARCHAR(50) NOT NULL,
    quantite INT NOT NULL,
    prix_unitaire DECIMAL(10, 2) NOT NULL,
    id_vendeur INT,
    FOREIGN KEY (id_vendeur) REFERENCES VENDEUR(id_vendeur)
);

-- ----------------------------------------------------------------------------
-- 2. INSERTION DES DONNÉES (LMD)
-- ----------------------------------------------------------------------------

-- Insertion dans VENDEUR
INSERT INTO VENDEUR (id_vendeur, nom) VALUES
(1, 'Sana'),
(2, 'Karim'),
(3, 'Lina'),
(4, 'Walid');

-- Insertion dans VENTE
INSERT INTO VENTE (id, article, categorie, quantite, prix_unitaire, id_vendeur) VALUES
(1,  'T-shirt',   'Vêtements',   10, 25.00,  1),
(2,  'Jean',      'Vêtements',   4,  60.00,  2),
(3,  'Robe',      'Vêtements',   3,  90.00,  1),
(4,  'Sac',       'Accessoires', 5,  40.00,  3),
(5,  'Ceinture',  'Accessoires', 6,  20.00,  2),
(6,  'Écharpe',   'Accessoires', 2,  15.00,  3),
(7,  'Baskets',   'Chaussures',  3,  100.00, 1),
(8,  'Sandales',  'Chaussures',  8,  35.00,  2),
(9,  'Bottines',  'Chaussures',  2,  120.00, 3),
(10, 'Casquette', 'Accessoires', 7,  18.00,  2),
(11, 'Chemise',   'Vêtements',   5,  45.00,  1),
(12, 'Parfum',    'Parfumerie',  1,  150.00, 3);

-- ----------------------------------------------------------------------------
-- 3. EXEMPLE FICHE MÉTHODE / PARTIE C
-- ----------------------------------------------------------------------------
-- Afficher le CA des articles dont le prix unitaire est >= 30, pour les vendeurs ayant un CA > 700

SELECT ve.nom, SUM(v.quantite * v.prix_unitaire) AS ca
FROM VENDEUR ve, VENTE v
WHERE ve.id_vendeur = v.id_vendeur
  AND v.prix_unitaire >= 30
GROUP BY ve.id_vendeur, ve.nom
HAVING SUM(v.quantite * v.prix_unitaire) > 700;


-- ----------------------------------------------------------------------------
-- 4. PARTIE D : REQUÊTES AVEC JOINTURE
-- ----------------------------------------------------------------------------

-- Mission 1 : Le registre
-- Afficher pour chaque vente : l'article, sa catégorie et le nom du vendeur
SELECT v.article, v.categorie, ve.nom
FROM VENTE v, VENDEUR ve
WHERE v.id_vendeur = ve.id_vendeur;

-- Mission 2 : Le classement
-- Afficher le CA de chaque vendeur (avec son nom)

SELECT ve.nom, SUM(v.quantite * v.prix_unitaire) AS ca
FROM VENDEUR ve, VENTE v
WHERE ve.id_vendeur = v.id_vendeur
GROUP BY ve.id_vendeur, ve.nom;

-- Mission 3 : Les vendeurs performants
-- Afficher les vendeurs dont le CA dépasse 700

SELECT ve.nom, SUM(v.quantite * v.prix_unitaire) AS ca
FROM VENDEUR ve, VENTE v
WHERE ve.id_vendeur = v.id_vendeur
GROUP BY ve.id_vendeur, ve.nom
HAVING SUM(v.quantite * v.prix_unitaire) > 700;

-- Mission 4 : Les polyvalents
-- Afficher les vendeurs qui ont vendu dans au moins 3 catégories différentes

SELECT ve.nom, COUNT(DISTINCT v.categorie) AS nb_rayons
FROM VENDEUR ve, VENTE v
WHERE ve.id_vendeur = v.id_vendeur
GROUP BY ve.id_vendeur, ve.nom
HAVING COUNT(DISTINCT v.categorie) >= 3;

-- Mission 5 : Le tri du vendeur
-- Articles avec prix unitaire >= 40, puis filtrer les vendeurs avec CA > 500

SELECT ve.nom, SUM(v.quantite * v.prix_unitaire) AS ca
FROM VENDEUR ve, VENTE v
WHERE ve.id_vendeur = v.id_vendeur
  AND v.prix_unitaire >= 40
GROUP BY ve.id_vendeur, ve.nom
HAVING SUM(v.quantite * v.prix_unitaire) > 500;


-- ----------------------------------------------------------------------------
-- 5. PARTIE E : REQUÊTES AVEC SOUS-REQUÊTES
-- ----------------------------------------------------------------------------

-- E1 : Sous-requête dans le SELECT (Affiche tous les vendeurs, y compris Walid avec NULL)

SELECT nom,
       (SELECT SUM(quantite * prix_unitaire) 
        FROM VENTE 
        WHERE VENTE.id_vendeur = VENDEUR.id_vendeur) AS ca
FROM VENDEUR;

-- E2 : Sous-requête avec IN (Mission 3)

SELECT nom
FROM VENDEUR
WHERE id_vendeur IN (
    SELECT id_vendeur
    FROM VENTE
    GROUP BY id_vendeur
    HAVING SUM(quantite * prix_unitaire) > 700
);

-- E2 bis : Sous-requête dans le FROM (Affiche le CA)

SELECT ve.nom, t.ca
FROM VENDEUR ve,
     (SELECT id_vendeur, SUM(quantite * prix_unitaire) AS ca
      FROM VENTE
      GROUP BY id_vendeur) t
WHERE ve.id_vendeur = t.id_vendeur
  AND t.ca > 700;

-- E3 : Mission 5 avec sous-requête dans le FROM

SELECT ve.nom, t.ca
FROM VENDEUR ve,
     (SELECT id_vendeur, SUM(quantite * prix_unitaire) AS ca
      FROM VENTE
      WHERE prix_unitaire >= 40
      GROUP BY id_vendeur) t
WHERE ve.id_vendeur = t.id_vendeur
  AND t.ca > 500;

-- Mission 4 avec IN (Polyvalents)

SELECT nom
FROM VENDEUR
WHERE id_vendeur IN (
    SELECT id_vendeur
    FROM VENTE
    GROUP BY id_vendeur
    HAVING COUNT(DISTINCT categorie) >= 3
);

-- Bonus : NOT IN (Vendeurs sans aucune vente)

SELECT nom
FROM VENDEUR
WHERE id_vendeur NOT IN (
    SELECT id_vendeur 
    FROM VENTE
    WHERE id_vendeur IS NOT NULL
);

-- Pour aller plus loin : Vendeurs au-dessus de la moyenne

SELECT id_vendeur, SUM(quantite * prix_unitaire) AS ca
FROM VENTE
GROUP BY id_vendeur
HAVING SUM(quantite * prix_unitaire) > (
    SELECT SUM(quantite * prix_unitaire) / COUNT(DISTINCT id_vendeur)
    FROM VENTE
);


-- ----------------------------------------------------------------------------
-- 6. PARTIE F : CORRECTIONS DES ERREURS
-- ----------------------------------------------------------------------------

-- a) Correction : Ajout de la condition de jointure

SELECT ve.nom, SUM(v.quantite * v.prix_unitaire) AS ca
FROM VENDEUR ve, VENTE v
WHERE ve.id_vendeur = v.id_vendeur
GROUP BY ve.id_vendeur, ve.nom;

-- b) Correction : Remplacement du WHERE sur SUM par un HAVING

SELECT ve.nom, SUM(v.quantite * v.prix_unitaire) AS ca
FROM VENDEUR ve, VENTE v
WHERE ve.id_vendeur = v.id_vendeur
GROUP BY ve.id_vendeur, ve.nom
HAVING SUM(v.quantite * v.prix_unitaire) > 700;

-- c) Correction : Retrait de categorie non agrégée (ou ajout dans le GROUP BY)

SELECT ve.nom, SUM(v.quantite * v.prix_unitaire) AS ca
FROM VENDEUR ve, VENTE v
WHERE ve.id_vendeur = v.id_vendeur
GROUP BY ve.id_vendeur, ve.nom;

-- d) Correction : Retrait de la colonne "nom" dans la sous-requête avec IN

SELECT nom 
FROM VENDEUR
WHERE id_vendeur IN (
    SELECT id_vendeur
    FROM VENTE
    GROUP BY id_vendeur
    HAVING SUM(quantite * prix_unitaire) > 700
);

-- e) Correction : Ajout de l'alias 't' à la table temporaire et résolution des ambiguïtés

SELECT ve.nom, t.ca
FROM VENDEUR ve,
     (SELECT id_vendeur, SUM(quantite * prix_unitaire) AS ca
      FROM VENTE 
      GROUP BY id_vendeur) t
WHERE ve.id_vendeur = t.id_vendeur 
  AND t.ca > 700;