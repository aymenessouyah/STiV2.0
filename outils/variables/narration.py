"""Texte de la voix off de « La console et les variables » (JavaScript).

Capsule de la Série 1 (JavaScript) : la **console**, puis les **variables**
(`var`, `let`, `const`) et les **types**. Le plan suit la fiche de cours
« Capsule JavaScript : variables (var, let, const) et types ».

L'écran est coupé en deux, comme demandé :

* **à gauche** le cours et ses analogies (lycée, appel, cuisine) ;
* **à droite** le code JavaScript, seul — et pour les exercices, l'énoncé à
  gauche et la **correction détaillée** à droite.

Deux parties sont **hors programme** : falsy/truthy et `==` / `===`. Elles sont
affichées barrées et la voix dit clairement « c'est hors programme, mais c'est
bien de le connaître ».

Conventions de nommage, une fois pour toutes :

* **console** = l'endroit où j'écris et où je lis les résultats ;
* `let`, `const`, `var` = les trois mots-clés de déclaration ;
* **portée** = la zone où la variable existe ; **TDZ** = la zone morte ;
* **hoisting** = la remontée des déclarations.
"""
from __future__ import annotations

# L'ordre de lecture ; il sert aussi à numéroter les chapitres.
ORDRE = [
    "ouverture", "console", "declarer", "portee", "let_const",
    "hoisting", "types", "hors_programme", "exercice_1", "exercice_moyenne",
]

SECTIONS = {
    "ouverture": {
        "titre": "Bienvenue — la console et les variables",
        "segments": [
            ("ouverture", [
                "Bienvenue dans STI Version 2.0.",
                "Aujourd'hui, une capsule de JavaScript pour bien commencer :",
                " la console, les variables, et les types.",
                "L'écran est coupé en deux.",
                "À gauche, le cours et ses analogies ; à droite, le code, et rien que le code.",
                "Et à la fin, des exercices : l'énoncé à gauche, la correction détaillée à droite.",
                "On commence par l'outil que tout programmeur utilise tout le temps : la console.",
            ]),
        ],
    },
    "console": {
        "titre": "La console : à quoi ça sert ?",
        "segments": [
            ("console", [
                "La console, c'est le carnet de bord du programme.",
                "C'est un endroit où j'écris des valeurs, et où je les lis, une ligne après l'autre.",
                "À quoi ça sert, concrètement ? Trois choses.",
                "Un : voir ce que contient une variable, au lieu de le deviner.",
                "Deux : tester une petite idée en trois secondes, sans créer de page.",
                "Trois : lire l'erreur quand quelque chose casse.",
                "Parce qu'une erreur, c'est un cadeau : JavaScript vous donne le fichier,"
                " la ligne, et le type d'erreur.",
                "Pour l'ouvrir : F12, ou contrôle, majuscule, J, selon le navigateur, puis l'onglet Console.",
                "J'écris console point log, entre parenthèses, ce que je veux voir.",
                "console point log, c'est la fonction que j'utiliserai dans toute cette capsule.",
                "Et il y a deux cousines utiles : console point error pour signaler une erreur,"
                " et console point table pour afficher un tableau proprement.",
                "Une console ouverte, et vous ne devinez plus : vous voyez.",
            ]),
        ],
    },
    "declarer": {
        "titre": "Déclarer une variable",
        "segments": [
            ("declarer", [
                "Maintenant, les variables.",
                "Une variable, c'est un espace mémoire nommé.",
                "Autrement dit : une case dans la mémoire de l'ordinateur, et une étiquette dessus.",
                "Je mets une valeur dans la case, et je parle à la case par son nom.",
                "En JavaScript, trois mots-clés permettent de déclarer.",
                "var : la plus ancienne. Sa portée est la fonction entière, et on peut la redéclarer.",
                "let : la moderne, quand la valeur doit changer. Sa portée est le bloc.",
                "const : la moderne, quand la valeur ne doit plus changer.",
                "Pour choisir, une seule règle : const par défaut, let si la valeur doit changer,"
                " et var, on l'évite.",
                "Regardez le code à droite : let age égal seize. Puis age égal dix-sept.",
                "La variable est créée une fois, avec let, et ensuite je peux lui redonner une valeur.",
                "Et pour voir le résultat, console point log : la console affiche dix-sept.",
            ]),
        ],
    },
    "portee": {
        "titre": "La portée : l'analogie du lycée",
        "segments": [
            ("portee", [
                "La portée, en anglais scope, c'est la zone du programme où une variable existe.",
                "En dehors de cette zone, JavaScript ne la connaît pas.",
                "Pour la comprendre, pensez au lycée.",
                "La portée, c'est la distance que la voix peut atteindre.",
                "L'annonce au haut-parleur est entendue dans toutes les salles :"
                " c'est une variable globale.",
                "Ce que l'enseignant dit dans la salle douze n'est entendu que dans la salle douze :"
                " c'est une variable locale, dans une fonction.",
                "Ce qu'un groupe de travail dit à l'intérieur de la salle n'est entendu que par ce groupe :"
                " c'est une variable de bloc, et c'est let et const.",
                "Avec var, il n'y a pas de groupes : tout ce qui est dit est entendu dans toute la salle.",
                "Un élève de la salle douze entend l'annonce générale,"
                " mais le reste du lycée n'entend pas ce qui se dit dans la salle douze.",
                "Dans le code à droite, le bloc entre accolades redéclare x avec let :"
                " c'est une autre variable, et le x du dehors reste intact.",
                "Une fonction accède aux variables de ses fonctions parentes, jamais l'inverse.",
            ]),
        ],
    },
    "let_const": {
        "titre": "let et const en détail",
        "segments": [
            ("let_const", [
                "let, d'abord.",
                "On peut réaffecter : let age égal seize, puis age égal dix-sept, sans erreur.",
                "Mais on ne peut pas redéclarer dans le même bloc :"
                " deux fois let x, c'est une erreur de syntaxe.",
                "Et il y a la zone morte temporelle, la TDZ.",
                "Regardez à droite : console point log de n, puis let n égal cinq.",
                "La variable existe, mais elle n'est pas encore utilisable : JavaScript répond"
                " ReferenceError.",
                "Zéro ligne avant sa déclaration, donc.",
                "Maintenant const.",
                "const PI égal trois virgule quatorze. PI égal trois virgule quinze :"
                " TypeError, on ne réaffecte pas une constante.",
                "Et const sans valeur, c'est aussi une erreur : il faut initialiser tout de suite.",
                "Attention, et c'est le piège du programme : la liaison est constante, pas le contenu.",
                "const notes égal un tableau : notes crochet zéro égal quatorze est autorisé,"
                " parce qu'on modifie une case, pas la variable.",
                "Mais notes égal un autre tableau, c'est TypeError.",
                "Et const est possible dans for point point point of, mais pas dans un for à compteur.",
            ]),
        ],
    },
    "hoisting": {
        "titre": "Le hoisting, ou la remontée",
        "segments": [
            ("hoisting", [
                "Le hoisting, en français la remontée.",
                "Avant d'exécuter le code, JavaScript parcourt tout le programme"
                " et note les déclarations de variables, comme si elles étaient remontées"
                " en haut de leur zone.",
                "Seule la déclaration remonte, pas la valeur donnée ensuite.",
                "L'analogie de la classe : avant le début du cours, le surveillant lit la liste.",
                "Tous les noms sont connus dès le départ, même si les élèves ne sont pas encore arrivés.",
                "Avec var : l'élève est déjà assis à sa place, mais son sac est vide."
                " Si on l'appelle, il répond undefined.",
                "Avec let et const : l'élève est inscrit, mais il attend encore dans le couloir.",
                "L'appeler avant son arrivée provoque une erreur, un ReferenceError.",
                "Il devient utilisable à la ligne où la variable est déclarée : c'est son entrée en classe.",
                "Regardez à droite : les deux appels se ressemblent, les deux résultats non.",
            ]),
        ],
    },
    "types": {
        "titre": "Les types, et typeof",
        "segments": [
            ("types", [
                "Dernier chapitre avant les exercices : les types.",
                "JavaScript est à typage dynamique : le type est attaché à la valeur,"
                " pas à la variable.",
                "let x égal dix, puis x égal le mot dix entre guillemets :"
                " autorisé, et le type change avec la valeur.",
                "Il y a sept types primitifs, et tout le reste est un objet.",
                "Primitif vient du latin primitivus, premier, de base :"
                " une valeur simple et indivisible, qui ne contient rien d'autre.",
                "L'analogie de la cuisine : un ingrédient est primitif ;"
                " un gâteau, fait de plusieurs ingrédients, est un objet.",
                "Les sept : string pour le texte, number pour les nombres,"
                " boolean pour vrai et faux, undefined quand il n'y a pas encore de valeur,"
                " null pour une absence volontaire, bigint pour les très grands entiers,"
                " et symbol pour un identifiant unique.",
                "Pour connaître le type d'une valeur, j'utilise typeof :"
                " string pour un texte, number pour quarante-deux, boolean pour true.",
                "Trois pièges : typeof de null donne object, c'est un bug historique ;"
                " typeof d'un tableau donne object aussi, donc pour un tableau"
                " j'utilise Array point isArray ; et typeof de NaN donne number,"
                " car NaN est un nombre invalide.",
                "Valeur ou référence, maintenant.",
                "Deux primitifs se copient par valeur : deux sacs de farine sont"
                " indépendants, vider l'un ne vide pas l'autre.",
                "Un tableau, lui, se copie par référence : deux noms, un seul et même tableau.",
                "Enfin les conversions : explicites avec Number, parseInt, String, Boolean ;"
                " ou implicites, comme cinq entre guillemets plus deux, qui donne cinquante-deux.",
            ]),
        ],
    },
    "hors_programme": {
        "titre": "Hors programme : falsy, truthy, et == / ===",
        "segments": [
            ("hors_programme", [
                "Maintenant, deux apartés. Ils sont hors programme, mais c'est bien de les connaître.",
                "Premier aparté : falsy et truthy.",
                "Dans un test, JavaScript transforme la valeur en vrai ou faux.",
                "Falsy, c'est-à-dire faux pour JavaScript : false, zéro, la chaîne vide,"
                " null, undefined et NaN.",
                "Tout le reste est truthy, y compris la chaîne zéro,"
                " et même un tableau vide.",
                "Deuxième aparté : les comparaisons.",
                "cinq égal égal cinq entre guillemets donne true, parce que JavaScript convertit.",
                "cinq égal égal égal cinq entre guillemets donne false, parce que les types diffèrent.",
                "La règle : utilisez trois égales. Toujours.",
                "Ces deux apartés sont hors programme : retenez-les pour plus tard,"
                " mais le cœur du cours, c'est le reste.",
            ]),
        ],
    },
    "exercice_1": {
        "titre": "Exercice — que s'affiche-t-il ?",
        "segments": [
            ("exercice_1", [
                "Passons aux exercices. Même écran, coupé en deux :"
                " l'énoncé à gauche, la correction à droite.",
                "Exercice un : que s'affiche-t-il ? Pour chaque extrait,"
                " donner ce qui apparaît dans la console, ou l'erreur produite.",
                "Extrait a : var a égal un, puis un bloc qui refait var a égal deux,"
                " puis console point log de a.",
                "Correction : var ignore le bloc, et redéclare la même variable : deux.",
                "Extrait b : let b égal un, un bloc qui refait let b égal deux, puis log de b.",
                "Correction : le let du bloc est une autre variable, elle meurt à la fin du bloc : un.",
                "Extrait c : console point log de c, puis var c égal cinq.",
                "Correction : hoisting de var, la déclaration remonte, mais pas la valeur : undefined.",
                "Extrait d : console point log de d, puis let d égal cinq.",
                "Correction : d est dans la zone morte temporelle : ReferenceError.",
                "Extrait e : const e égal dix, puis e égal vingt.",
                "Correction : on réaffecte une constante : TypeError.",
                "Extrait f : const f égal un tableau, puis f crochet zéro égal cinq.",
                "Correction : on modifie une case, pas la liaison : le tableau affiché est cinq, deux.",
                "Et voilà les deux idées de l'exercice : la portée change tout,"
                " et const protège la liaison, pas le contenu.",
            ]),
        ],
    },
    "exercice_moyenne": {
        "titre": "Exercice — la fonction moyenne",
        "segments": [
            ("exercice_moyenne", [
                "Dernier exercice, et c'est de la programmation.",
                "Écrire une fonction moyenne qui reçoit un tableau de notes"
                " et retourne leur moyenne.",
                "Contraintes : utiliser const ou let selon le cas, une boucle for,"
                " et ne déclarer aucune variable globale à l'intérieur de la fonction.",
                "Lisons la correction, ligne par ligne.",
                "Ligne un : function moyenne, entre parenthèses notes."
                " Le paramètre est local à la fonction.",
                "Ligne deux : let somme égal zéro. let, parce que la valeur va changer ;"
                " et pas var, parce que la portée reste dans la fonction.",
                "Ligne trois : for, let i égal zéro, i plus petit que notes point length, i plus plus.",
                "Ligne quatre : somme plus égal notes crochet i : j'ajoute chaque note.",
                "Ligne six, après la boucle : return somme divisé par notes point length.",
                "La moyenne : le total divisé par le nombre de notes.",
                "À l'appel : log de moyenne, avec le tableau douze, quinze, neuf, affiche douze.",
                "Vérifions : douze plus quinze plus neuf fait trente-six ; divisé par trois, douze.",
                "Ce qu'il faut retenir. const par défaut, let si réaffectation, var à éviter.",
                "let et const ont une portée de bloc, et une zone morte temporelle.",
                "const empêche la réaffectation, pas la modification du contenu d'un tableau.",
                "Sept types primitifs, tout le reste est un objet.",
                "typeof de null et typeof d'un tableau valent object : deux cas particuliers.",
                "Et la console, c'est votre carnet de bord : ouvrez-la, écrivez, lisez.",
                "À vous de jouer, dans STI Version 2.0. La capsule de la console et des variables."
                " À bientôt.",
            ]),
        ],
    },
}

def texte_segment(section: str, cle: str) -> str:
    for identifiant, phrases in SECTIONS[section]["segments"]:
        if identifiant == cle:
            return " ".join(phrases)
    return ""


def texte_section(section: str) -> str:
    return " ".join(texte_segment(section, cle) for cle, _ in SECTIONS[section]["segments"])


def nombre_caracteres() -> int:
    return sum(len(texte_section(s)) for s in ORDRE)


def numero(section: str) -> int:
    """Le numéro d'étape (1 → n) d'une section."""
    return ORDRE.index(section) + 1


# ── Sous-titres ────────────────────────────────────────────────────────────
_INSECABLE = "\u00a0"


def _typo(phrase: str) -> str:
    """Espace insécable avant les ponctuations doubles : elles ne passent
    jamais seules en début de ligne."""
    for signe in (":", ";", "?", "!", "»"):
        phrase = phrase.replace(f" {signe}", f"{_INSECABLE}{signe}")
    return phrase.replace("« ", f"«{_INSECABLE}")


def _replier(phrase, maxi=42):
    """Replie une phrase en lignes courtes, sans jamais couper un mot."""
    lignes, courant = [], ""
    for mot in _typo(phrase).split(" "):
        essai = (courant + " " + mot).strip()
        if len(essai) <= maxi or not courant:
            courant = essai
        else:
            lignes.append(courant)
            courant = mot
    if courant:
        lignes.append(courant)
    return lignes


def _decouper(phrases, lignes_max=2):
    """Une réplique = une phrase entière, repliée sur deux lignes au plus."""
    cues = []
    for phrase in phrases:
        lignes = _replier(phrase)
        for i in range(0, len(lignes), lignes_max):
            cues.append("\n".join(lignes[i:i + lignes_max]))
    return cues


def sous_titres(durees: dict, debuts: dict):
    """Renvoie [(début, fin, texte)] calés proportionnellement aux caractères."""
    entrees = []
    for section in ORDRE:
        debut = debuts.get(section, 0.0)
        duree = durees.get(section, 0.0)
        if duree <= 0:
            continue
        cues = []
        for cle, phrases in SECTIONS[section]["segments"]:
            cues.extend(_decouper(phrases))
        poids = [max(1, len(c.replace("\n", " "))) for c in cues]
        total = sum(poids)
        curseur = debut
        for cue, p in zip(cues, poids):
            d = duree * p / total
            entrees.append((curseur, curseur + d, cue))
            curseur += d
    return entrees


def _hms(secondes: float) -> str:
    ms = int(round(secondes * 1000))
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"


def vtt(entrees) -> str:
    lignes = ["WEBVTT", ""]
    for debut, fin, texte in entrees:
        lignes += [_hms(debut) + " --> " + _hms(fin), texte, ""]
    return "\n".join(lignes)
