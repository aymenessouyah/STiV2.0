"""Texte de la voix off de « Les variables, la portée et les types » (PHP).

Capsule de PHP (4ᵉ SI) : la **déclaration** (le dollar, les constantes), la
**portée** (le lycée, `global`, les superglobales, pas de bloc, `static`), le
**hoisting** qui n'existe pas en PHP, les **types** (scalaires, `array`, `null`),
les **tableaux** indexés et associatifs. Le plan suit la fiche de cours
« Capsule PHP : variables, portée et types ».

L'écran est coupé en deux, comme la capsule JavaScript :

* **à gauche** le cours et ses analogies (lycée, casiers, fiche de
  renseignements, cuisine) ;
* **à droite** le code PHP et ce que la page affiche — et pour les exercices,
  l'énoncé à gauche et la **correction détaillée** à droite.

Une partie est **hors programme** : falsy/truthy et `==` / `===`, avec les
conversions. Elle est affichée barrée et la voix dit clairement « c'est hors
programme, mais c'est bien de le connaître ».

Conventions de nommage, une fois pour toutes :

* **dollar** = le signe `$` qui commence tout nom de variable ;
* **variable globale** = celle du dehors ; **locale** = celle d'une fonction ;
* **superglobale** = `$_GET`, `$_POST`, `$_SESSION` : visibles partout ;
* **static** = la variable locale qui survit d'un appel à l'autre.
"""
from __future__ import annotations

# L'ordre de lecture ; il sert aussi à numéroter les chapitres.
ORDRE = [
    "ouverture", "declarer", "portee", "bloc_static", "hoisting",
    "types", "tableaux", "hors_programme", "exercice_1", "exercice_moyenne",
]

SECTIONS = {
    "ouverture": {
        "titre": "Bienvenue — les variables PHP",
        "segments": [
            ("ouverture", [
                "Bienvenue dans STI Version 2.0.",
                "Aujourd'hui, une capsule de PHP : les variables, la portée, et les types.",
                "L'écran est coupé en deux : à gauche, le cours et ses analogies ;",
                " à droite, le code PHP, et rien que le code.",
                "Et à la fin, des exercices : l'énoncé à gauche, la correction détaillée à droite.",
                "Une différence avec JavaScript, à dire tout de suite :",
                " en PHP, une variable commence par le signe dollar,",
                " et il n'y a ni var, ni let, ni const.",
                "On commence par la déclaration.",
            ]),
        ],
    },
    "declarer": {
        "titre": "Déclarer une variable, et les constantes",
        "segments": [
            ("declarer", [
                "En PHP, une variable commence par le signe dollar.",
                "Il n'y a pas de mot-clé de déclaration : ni var, ni let, ni const.",
                "La variable naît à sa première affectation.",
                "J'écris : dollar nom égal Ali entre guillemets, dollar age égal seize,",
                " dollar moyenne égal treize virgule cinq.",
                "Trois règles.",
                "Un : le nom commence par une lettre ou un souligné, jamais par un chiffre.",
                "Dollar note un est correct ; dollar un note est une erreur.",
                "Deux : PHP distingue les majuscules et les minuscules.",
                "Dollar age et dollar Age sont deux variables différentes.",
                "Trois : le type est attaché à la valeur, comme en JavaScript.",
                "Dollar x égal dix, c'est un entier ;",
                " puis dollar x égal le mot dix entre guillemets, c'est une chaîne : autorisé.",
            ]),
            ("afficher", [
                "Pour afficher, j'utilise echo.",
                "Avec des guillemets doubles, la variable est remplacée :",
                " echo, Bonjour, dollar nom, affiche Bonjour Ali.",
                "Avec des guillemets simples, le texte reste tel quel :",
                " echo, Bonjour, dollar nom, affiche Bonjour, dollar nom.",
                "Et pour coller deux morceaux, le point :",
                " echo, Bonjour, point, dollar nom.",
                "Trois fonctions pour tester :",
                " isset, qui dit si elle existe et n'est pas null ;",
                " unset, qui la supprime ;",
                " et empty, qui dit si elle est vide.",
            ]),
            ("constantes", [
                "Enfin les constantes.",
                "Une constante ne change jamais de valeur, et son nom ne porte pas de dollar.",
                "On la crée avec define, entre parenthèses : define, TVA, virgule, zéro virgule dix-neuf.",
                "Ou avec const : const, PI, égal, trois virgule quatorze.",
                "Et une constante est visible partout, y compris dans les fonctions.",
            ]),
        ],
    },
    "portee": {
        "titre": "La portée : l'analogie du lycée",
        "segments": [
            ("portee", [
                "La portée, en anglais scope, c'est la zone du programme où une variable existe.",
                "En dehors de cette zone, PHP ne la connaît pas.",
                "Pour la comprendre, pensez au lycée : la portée, c'est la distance que la voix peut atteindre.",
                "Une annonce au haut-parleur est entendue dans le couloir et dans la cour :",
                " c'est une variable globale.",
                "Une fonction, elle, est une salle de classe porte fermée :",
                " l'annonce du haut-parleur n'y entre pas.",
                "Ce qui se dit dans la salle reste dans la salle : c'est une variable locale.",
            ]),
            ("global", [
                "Et voilà la différence importante avec JavaScript :",
                " dans une fonction PHP, une variable globale n'est pas accessible par défaut.",
                "Regardez à droite : dollar site égal STI, puis une fonction qui fait echo dollar site.",
                "Rien ne s'affiche : PHP donne un avertissement, variable non définie.",
                "Pour ouvrir la porte, le mot global : global, dollar site, et l'echo affiche STI.",
                "Autre solution, souvent préférable : passer la valeur en paramètre.",
                "Et il y a les carnets de liaison : dollar underscore GET, POST, SESSION.",
                "Ils sont donnés à tous les élèves : ce sont les variables superglobales, entendues partout.",
            ]),
        ],
    },
    "bloc_static": {
        "titre": "Pas de portée de bloc ; static",
        "segments": [
            ("bloc", [
                "Deuxième différence avec JavaScript : en PHP, il n'y a pas de portée de bloc.",
                "Les accolades de if, de for et de while ne créent pas de zone propre.",
                "Une variable créée dans un bloc reste visible après.",
                "Regardez : if, true, accolades, dollar a égal un.",
                "Puis echo dollar a, en dehors du bloc : la page affiche un.",
                "Avec une boucle for, dollar i vaut trois après la boucle,",
                " et dollar dernier garde la dernière valeur : deux.",
                "Seule la fonction crée une portée locale.",
            ]),
            ("static", [
                "Une variable locale, elle, disparaît à la fin de la fonction.",
                "Avec le mot static, elle garde sa valeur d'un appel à l'autre.",
                "Voici un compteur : function compteur, accolades, static dollar n égal zéro.",
                "Dollar n plus plus, puis return dollar n.",
                "Premier appel : un. Deuxième appel : deux. Troisième : trois.",
                "Sans static, dollar n serait recréée à zéro à chaque appel, et afficherait toujours un.",
            ]),
        ],
    },
    "hoisting": {
        "titre": "Le hoisting n'existe pas en PHP",
        "segments": [
            ("hoisting", [
                "Le hoisting, en français la remontée :",
                " en JavaScript, les déclarations remontent en haut de leur zone avant l'exécution.",
                "PHP ne le fait pas pour les variables : le fichier est lu de haut en bas.",
                "L'analogie de la classe : le surveillant n'appelle que les élèves déjà inscrits et arrivés.",
                "Un élève qui n'existe pas encore sur la liste ne répond pas.",
                "Regardez à droite : echo dollar x, puis dollar x égal cinq.",
                "Le premier echo n'affiche rien : avertissement, variable non définie.",
                "Le second affiche cinq.",
                "Une exception, et une seule : les fonctions.",
                "Elles sont connues avant le début de la lecture, comme le règlement du lycée affiché avant la rentrée.",
                "On peut donc appeler double de quatre avant de l'avoir écrit : huit.",
            ]),
        ],
    },
    "types": {
        "titre": "Les types : scalaires, array, null",
        "segments": [
            ("scalaires", [
                "Les types, maintenant. PHP a trois familles.",
                "Les scalaires : int, float, string, bool.",
                "Le composé : array, le tableau.",
                "Et le spécial : null, qui veut dire aucune valeur.",
                "Scalaire vient du latin scala, l'échelle, le degré :",
                " une valeur simple, à un seul niveau, qui ne contient rien d'autre.",
                "L'analogie de la cuisine : le sel, la farine et l'œuf sont des ingrédients de base,",
                " impossibles à décomposer en plus simple.",
                "Un gâteau, lui, est composé de plusieurs ingrédients : c'est un tableau.",
            ]),
            ("gettype", [
                "Pour connaître le type, deux outils.",
                "gettype : entier pour quinze, double pour trois virgule quatorze,",
                " chaîne pour Ali, booléen pour true, NULL pour null, array pour un tableau.",
                "var_dump, plus précis, affiche le type et la valeur :",
                " int, quinze ; string, deux.",
                "Et pour tester : is int, is float, is string, is array, is null.",
            ]),
            ("copie", [
                "Et voici la grande différence avec JavaScript :",
                " en PHP, tout est copié par valeur, les tableaux compris.",
                "Dollar a égal cinq ; dollar b égal dollar a ; dollar b égal dix :",
                " dollar a vaut toujours cinq.",
                "Dollar t un égal un tableau ; dollar t deux égal dollar t un ;",
                " puis dollar t deux crochet zéro égal quatre-vingt-dix-neuf :",
                " dollar t un crochet zéro vaut toujours un.",
                "L'analogie : copier par valeur, c'est donner une photocopie du document ; l'original reste intact.",
                "Copier par référence, avec le et commercial, c'est donner l'original lui-même :",
                " toute modification est vue des deux côtés.",
                "Dans une fonction, dollar n est une copie ;",
                " et commercial dollar n, c'est l'original.",
            ]),
        ],
    },
    "tableaux": {
        "titre": "Les tableaux : indexés et associatifs",
        "segments": [
            ("indexe", [
                "Un tableau range plusieurs valeurs sous un seul nom.",
                "Il en existe deux sortes, et la différence tient à la façon de retrouver une case.",
                "Le tableau indexé : chaque case porte un numéro, l'indice, qui commence à zéro.",
                "L'analogie du couloir : une rangée de casiers numérotés zéro, un, deux, trois.",
                "Pour retrouver un objet, on donne le numéro du casier.",
                "Dollar notes égal un tableau de douze, quinze, neuf.",
                "Dollar notes crochet un affiche quinze.",
                "Dollar notes crochet zéro égal quatorze modifie une case.",
                "Dollar notes crochet trois égal dix ajoute le casier numéro trois.",
                "Et count de dollar notes donne quatre.",
                "Pour parcourir : une boucle for, avec i plus petit que count de dollar notes.",
            ]),
            ("associatif", [
                "Le tableau associatif, lui, repère ses cases par un nom : la clé.",
                "On écrit clé, flèche, valeur.",
                "L'analogie de la fiche de renseignements : une fiche d'élève avec des rubriques,",
                " nom, age, moyenne.",
                "Pour lire une information, on donne le nom de la rubrique, pas un numéro.",
                "Dollar eleve égal un tableau, nom flèche Ali, age flèche seize, moyenne flèche treize virgule cinq.",
                "Echo dollar eleve crochet nom affiche Ali.",
                "On ajoute une rubrique, classe, et on parcourt avec foreach :",
                " foreach, dollar eleve as, dollar cle, flèche, dollar valeur.",
                "À chaque tour, dollar cle reçoit l'étiquette et dollar valeur son contenu.",
                "Et pour tester une clé : isset de dollar eleve crochet nom.",
            ]),
        ],
    },
    "hors_programme": {
        "titre": "Hors programme : falsy, et == / ===",
        "segments": [
            ("hors_programme", [
                "Deux apartés, maintenant. Ils sont hors programme, mais c'est bien de les connaître.",
                "Premier aparté : les valeurs vraies et fausses.",
                "Dans un test, PHP transforme la valeur en vrai ou faux.",
                "Sont fausses : false, zéro, zéro virgule zéro, la chaîne vide,",
                " la chaîne zéro, un tableau vide, et null.",
                "Tout le reste est vrai.",
                "Attention : contrairement à JavaScript, la chaîne zéro est fausse en PHP.",
                "Deuxième aparté : les comparaisons.",
                "Cinq égal égal cinq entre guillemets donne true, parce que PHP convertit.",
                "Cinq égal égal égal cinq entre guillemets donne false, parce que les types diffèrent.",
                "Et zéro virgule un plus zéro virgule deux égal égal zéro virgule trois donne false :",
                " la précision des réels.",
                "La règle : utilisez trois égales, et pas égal.",
                "Et retenez les conversions : cinq entre guillemets plus deux donne sept, une addition ;",
                " cinq entre guillemets point deux donne cinquante-deux, une concaténation.",
                "Entier de quinze px donne quinze ; entier de abc donne zéro.",
                "Ces apartés sont hors programme : on les connaît, on ne les révise pas.",
            ]),
        ],
    },
    "exercice_1": {
        "titre": "Exercice — que s'affiche-t-il ?",
        "segments": [
            ("exercice_1", [
                "Passons aux exercices. Même écran, coupé en deux : l'énoncé à gauche, la correction à droite.",
                "Exercice un : que s'affiche-t-il ?",
                "Pour chaque extrait, donner ce qui s'affiche, ou le problème rencontré.",
                "Extrait a : dollar a égal un, puis une fonction f qui fait echo dollar a, puis l'appel.",
                "Correction : rien ne s'affiche, avec un avertissement, variable non définie.",
                "La fonction ne voit pas la variable globale.",
                "Extrait b : dollar b égal deux, fonction g, global dollar b, echo dollar b, appel.",
                "Correction : deux. Global ouvre la porte.",
                "Extrait c : if, true, accolades, dollar c égal trois, puis echo dollar c en dehors.",
                "Correction : trois. Il n'y a pas de portée de bloc en PHP.",
                "Extrait d : fonction h, static dollar n égal zéro, dollar n plus plus, echo, puis trois appels.",
                "Correction : un, deux, trois. Static garde la valeur entre les appels.",
                "Extrait e : echo dollar d, puis dollar d égal quatre.",
                "Correction : rien, avec un avertissement. Il n'y a pas de remontée des variables.",
                "Extrait f : define, X, dix, une fonction k qui fait echo X, puis l'appel.",
                "Correction : dix. Une constante est visible partout.",
                "Six extraits, et trois idées : la portée, static, et les constantes.",
            ]),
        ],
    },
    "exercice_moyenne": {
        "titre": "Exercice — la fonction moyenne",
        "segments": [
            ("exercice_moyenne", [
                "Dernier exercice.",
                "Écrire une fonction moyenne de dollar notes, qui reçoit un tableau de nombres et retourne leur moyenne.",
                "Contraintes : une boucle for, la fonction count, et aucune variable globale.",
                "Lisons la correction, ligne par ligne.",
                "Ligne un : function moyenne, entre parenthèses, dollar notes.",
                "Le paramètre est local à la fonction.",
                "Ligne deux : dollar somme égal zéro.",
                "Ligne trois : for, dollar i égal zéro, dollar i plus petit que count de dollar notes, dollar i plus plus.",
                "Ligne quatre : dollar somme égal dollar somme plus dollar notes crochet i.",
                "J'ajoute chaque note.",
                "Ligne six, après la boucle : return dollar somme divisé par count de dollar notes :",
                " le total divisé par le nombre de notes.",
                "À l'appel, avec douze, quinze, neuf : la page affiche douze.",
                "Vérifions : douze plus quinze plus neuf, trente-six ; divisé par trois, douze.",
            ]),
            ("recap", [
                "À retenir.",
                "Une variable commence par un dollar, sans mot-clé ; PHP distingue les majuscules.",
                "Une constante se crée avec define ou const, sans dollar, et se voit partout.",
                "Dans une fonction, une variable globale n'est pas visible : un paramètre, ou global.",
                "Seule la fonction crée une portée ; static garde la valeur d'un appel à l'autre.",
                "Les scalaires : int, float, string, bool ; le composé : array ; le spécial : null.",
                "Un tableau est indexé, ou associatif.",
                "Tout est copié par valeur ; le et commercial transmet l'original.",
                "Le plus additionne, le point concatène ; et on préfère trois égales.",
                "À vous de jouer, dans STI Version 2.0. À bientôt.",
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
