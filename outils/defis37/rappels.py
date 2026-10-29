"""Les trois fiches de rappel de la vidéo.

Chaque rappel occupe tout l'écran et se construit par étapes : le titre,
puis les blocs, l'un après l'autre.
"""

RAPPELS = {
    "rappel_tableau": {
        "sur_titre": "RAPPEL · LES TABLEAUX",
        "titre": "Un tableau, c'est des cases numérotées",
        "sous_titre": "const fruits = [\"pomme\", \"banane\", \"raisin\", \"orange\", \"fraise\"];",
        "type": "tableau",
        "cases": ["pomme", "banane", "raisin", "orange", "fraise"],
        "regles": [
            ("fruits[0]", "première case"),
            ("fruits[fruits.length - 1]", "dernière case"),
            ("fruits.length", "nombre de cases"),
            ("fruits[10]", "undefined : hors limites"),
        ],
        "ajout": [
            ("fruits[fruits.length] = \"kiwi\"", "ajoute à la fin"),
            ("fruits.length = fruits.length - 1", "retire la dernière"),
            ("fruits.push(\"kiwi\") / fruits.pop()", "les raccourcis"),
        ],
        "note": "Les indices commencent à 0 : un tableau de 5 cases va de 0 à 4.",
    },
    "rappel_math": {
        "sur_titre": "RAPPEL · L'OBJET MATH",
        "titre": "random, floor, ceil : trois outils pour tirer un nombre",
        "sous_titre": "Math.random()  →  un nombre entre 0 (inclus) et 1 (exclu)",
        "type": "math",
        "lignes": [
            ("Math.random()", "0 ≤ x < 1", "ex. 0,738", "jamais 1"),
            ("Math.floor(4,7)", "4", "toujours vers le bas", "floor = plancher"),
            ("Math.ceil(4,1)", "5", "toujours vers le haut", "ceil = plafond"),
            ("Math.round(4,5)", "5", "au plus proche", "round = arrondi"),
        ],
        "formule": "Math.floor(Math.random() * (max - min + 1)) + min",
        "etapes": [
            ("Math.random()", "0 → 1"),
            ("× (max - min + 1)", "0 → 99"),
            ("Math.floor", "0 → 99"),
            ("+ min", "1 → 100"),
        ],
        "note": "Avec min = 1 et max = 100, on obtient un entier de 1 à 100, bornes comprises.",
    },
    "rappel_chaine": {
        "sur_titre": "RAPPEL · LES CHAÎNES DE CARACTÈRES",
        "titre": "substring et substr ne découpent pas pareil",
        "sous_titre": "const mot = \"Bonjour\";   // B0 o1 n2 j3 o4 u5 r6",
        "type": "chaine",
        "lignes": [
            ("String.fromCharCode(65)", "\"A\"", "65 = A, 90 = Z, 97 = a"),
            ("(255).toString(16)", "\"ff\"", "conversion en base 16"),
            ("\"abc\".toUpperCase()", "\"ABC\"", "en majuscules"),
            ("mot.charAt(2)", "\"n\"", "un caractère à l'indice 2"),
        ],
        "comparaison": {
            "gauche": ("substring(début, fin)", "les deux bornes sont des INDICES", "fin exclue"),
            "droite": ("substr(début, longueur)", "le second nombre est une LONGUEUR", "peut dépasser la fin"),
        },
        "exemples": [
            ("mot.substring(1, 4)", "\"onj\"", "de l'indice 1 à l'indice 3"),
            ("mot.substr(1, 4)", "\"onjo\"", "4 caractères à partir de l'indice 1"),
        ],
        "note": "substr est ancien : préfère substring ou slice. En cas d'inversion, substring échange les bornes.",
    },
}

ORDRE = ["rappel_tableau", "rappel_math", "rappel_chaine"]
