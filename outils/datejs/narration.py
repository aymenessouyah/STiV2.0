"""Texte de la voix off de « L'objet Date » (JavaScript).

Capsule de la fiche « L'objet Date en javascript » (Annexe JS, 3ᵉ/4ᵉ SI,
Lycée Rafèha). Le plan suit la fiche, dans son ordre :

1. `new Date()` — la date et l'heure courantes ;
2. `new Date(ch)` — une date à partir d'une chaîne ;
3. `getDate()` — le jour du mois ;
4. `getMonth()` — le **piège** : les mois commencent à zéro ;
5. `getFullYear()` — l'année sur quatre chiffres ;
6. `toString()` — la date en texte ;
7. l'exemple complet — « Rentrée au Lycée Rafèha : 15 septembre 2026 ».

L'écran est coupé en deux, du début à la fin :

* **à gauche** — la fiche, et surtout **le calendrier** de septembre 2026 avec
  le 15 encerclé : c'est de là que sortent `getDate`, `getMonth` et
  `getFullYear` ;
* **à droite** — le code JavaScript dans sa console noire, puis sa sortie.

Une seule date d'exemple, celle de la fiche : la rentrée au Lycée Rafèha,
`new Date("2026-09-15T08:00:00")`.

Conventions de nommage, une fois pour toutes :

* **objet Date** = la valeur fabriquée par `new Date(...)`, pas un texte ;
* **méthode** = elle se lit **sur** la date, avec des parenthèses :
  `d.getDate()` ;
* **numéro JavaScript** = celui que renvoie `getMonth()` : de 0 à 11 ;
* **numéro habituel** = celui qu'un humain écrit : de 1 à 12.

La sortie est écrite avec `console.log`, comme dans les autres capsules : les
exemples de la fiche s'écrivent ici `console.log(...)` et non `alert(...)`.
"""
from __future__ import annotations

# L'ordre de lecture ; il sert aussi à numéroter les chapitres.
ORDRE = [
    "ouverture", "date_courante", "date_chaine", "getdate", "getmonth",
    "getfullyear", "tostring", "exemple_complet", "exercices",
]

# La date d'exemple de toute la capsule (celle de la fiche).
SOURCE = "2026-09-15T08:00:00"

# Les douze noms de mois, dans l'ordre de getMonth() : 0 → 11.
MOIS = ["janvier", "février", "mars", "avril", "mai", "juin",
        "juillet", "août", "septembre", "octobre", "novembre", "décembre"]

SECTIONS = {
    "ouverture": {
        "titre": "Bienvenue — l'objet Date",
        "segments": [
            ("ouverture", [
                "Bienvenue dans STI Version 2.0.",
                "Aujourd'hui, une capsule de JavaScript sur l'objet Date.",
                "Un objet Date représente une date et une heure :"
                " le jour, le mois, l'année, l'heure, et le fuseau horaire.",
                "Tous les exemples utilisent la même date : la rentrée au Lycée Rafèha,"
                " le quinze septembre deux mille vingt-six, à huit heures.",
                "On va voir deux façons de la fabriquer, puis quatre méthodes pour la lire,"
                " et enfin l'exemple complet qui affiche la date en toutes lettres.",
                "L'écran est coupé en deux : à gauche la fiche, avec le calendrier de septembre ;"
                " à droite le code, puis ce que la console affiche.",
                "Une règle à retenir dès maintenant, et c'est le piège du programme :"
                " le numéro du mois retourné par getMonth commence à zéro.",
                "Janvier, c'est zéro. Septembre, c'est huit. Décembre, c'est onze.",
                "Pour obtenir le numéro habituel, celui qu'un humain écrit,"
                " il faut ajouter un.",
            ]),
        ],
    },
    "date_courante": {
        "titre": "La date du jour : new Date()",
        "segments": [
            ("date_courante", [
                "Première façon de fabriquer une date : sans argument.",
                "new Date, avec les parenthèses vides, crée un objet Date contenant"
                " la date et l'heure courantes de l'ordinateur, au moment de l'exécution.",
                "Regardez à gauche : c'est la date de votre machine, pas la mienne.",
                "On la range dans une variable : let aujourd'hui, égal new Date.",
                "Puis on lit l'année avec getFullYear.",
                "console point log de aujourd'hui point getFullYear :"
                " la console affiche deux mille vingt-six, ou l'année où vous lisez ceci.",
                "Et on peut la coller dans une phrase :"
                " Bienvenue au Lycée Rafèha, nous sommes en, plus l'année.",
                "Attention, et c'est une règle d'exercice :"
                " le résultat change à chaque exécution, parce qu'il dépend de l'horloge"
                " de l'utilisateur.",
                "Donc on ne peut pas écrire une réponse figée dans un exercice :"
                " on écrit le code qui l'affiche.",
            ]),
        ],
    },
    "date_chaine": {
        "titre": "Une date à partir d'une chaîne : new Date(ch)",
        "segments": [
            ("date_chaine", [
                "Deuxième façon : à partir d'une chaîne de caractères.",
                "new Date de ch fabrique un objet Date à partir d'un texte qui représente"
                " une date.",
                "Le format le plus sûr, c'est année tiret mois tiret jour :"
                " deux mille vingt-six, tiret, zéro neuf, tiret, quinze.",
                "On peut ajouter un T et l'heure : T huit deux points zéro zéro deux points"
                " zéro zéro.",
                "Regardez à droite : trois lignes, trois cas.",
                "La première donne la rentrée, avec l'heure.",
                "La deuxième donne la même date, sans l'heure : minuit.",
                "Et la troisième, new Date de Lycée Rafèha, ne veut rien dire :"
                " la console répond Invalid Date.",
                "Invalid Date, ce n'est pas une erreur qui arrête le programme :"
                " c'est une date invalide, et toutes ses méthodes répondent NaN.",
                "Retenez aussi ceci : le format jour barre mois barre année,"
                " à la française, n'est pas fiable avec new Date d'une chaîne.",
                "Écrivez toujours année, tiret, mois, tiret, jour.",
            ]),
        ],
    },
    "getdate": {
        "titre": "Le jour du mois : getDate()",
        "segments": [
            ("getdate", [
                "Maintenant, on lit la date. Première méthode : getDate.",
                "d point getDate renvoie le jour du mois : un entier entre un et trente et un.",
                "Pour la rentrée, la console affiche quinze.",
                "Regardez le calendrier à gauche : le quinze est encerclé, c'est bien le jour"
                " du mois.",
                "Et voilà le premier piège : getDate renvoie le numéro du jour dans le mois,"
                " pas le jour de la semaine.",
                "Ici, le quinze septembre deux mille vingt-six est un mardi,"
                " mais getDate répond quinze, pas mardi.",
                "Pour le jour de la semaine, il existe une autre méthode, getDay,"
                " qui n'est pas dans cette fiche : on la connaît, on ne la récite pas.",
                "Jour du mois, entre un et trente et un : getDate.",
            ]),
        ],
    },
    "getmonth": {
        "titre": "Le numéro du mois : getMonth(), le piège",
        "segments": [
            ("getmonth", [
                "Deuxième méthode, et c'est celle qui fait perdre des points : getMonth.",
                "d point getMonth renvoie le numéro du mois, un entier entre zéro et onze.",
                "Zéro et onze, pas un et douze.",
                "Pour la rentrée, septembre, la console affiche huit.",
                "Et si j'ajoute un, j'obtiens neuf : le numéro habituel.",
                "Regardez la bande des douze mois, à gauche : sous chaque nom,"
                " deux numéros.",
                "Le numéro du haut, c'est celui de JavaScript ; entre parenthèses,"
                " c'est celui qu'un humain écrit.",
                "Janvier, zéro. Février, un. Septembre, huit. Décembre, onze.",
                "Comment afficher le mois en lettres ? Avec un tableau.",
                "On écrit les douze noms dans l'ordre, de janvier à décembre,"
                " et on lit la case numéro getMonth.",
                "console point log de mois crochet d point getMonth :"
                " la console affiche septembre.",
                "Pas besoin d'ajouter un : le tableau est déjà rangé à partir de zéro.",
                "Deux usages, donc : getMonth tout seul pour le tableau des noms,"
                " et getMonth plus un pour le numéro habituel.",
            ]),
        ],
    },
    "getfullyear": {
        "titre": "L'année : getFullYear()",
        "segments": [
            ("getfullyear", [
                "Troisième méthode : getFullYear.",
                "d point getFullYear renvoie l'année sur quatre chiffres :"
                " deux mille vingt-six.",
                "Sur quatre chiffres, c'est important : il existe une vieille méthode,"
                " getYear, qui renvoyait l'année moins mille neuf cents."
                " Ne l'utilisez pas, elle est fausse depuis l'an deux mille.",
                "Vous avez maintenant les trois morceaux : le jour avec getDate,"
                " le mois avec getMonth, l'année avec getFullYear.",
                "Et on peut les assembler : jour, barre, getMonth plus un, barre, année,"
                " ce qui donne quinze barre neuf barre deux mille vingt-six.",
                "C'est exactement la date à la française, telle qu'on l'écrit en Tunisie.",
            ]),
        ],
    },
    "tostring": {
        "titre": "La date en texte : toString()",
        "segments": [
            ("tostring", [
                "Quatrième méthode : toString.",
                "d point toString renvoie une chaîne de caractères qui représente la date,"
                " avec le jour, le mois, l'année, l'heure et le fuseau horaire.",
                "La console affiche : Tue Sep 15 2026 08:00:00 GMT plus zéro un zéro zéro,"
                " heure normale d'Europe centrale.",
                "Et typeof de cette valeur donne string : c'est bien du texte,"
                " plus un objet Date.",
                "Attention : le format exact dépend du navigateur et du fuseau horaire.",
                "Ne le figez jamais dans une réponse d'exercice : affichez-le.",
                "Et si vous voulez une date lisible, à la française,"
                " il vaut mieux l'assembler vous-même avec getDate, getMonth plus un"
                " et getFullYear.",
                "Une fois la date convertie en texte, elle se traite comme une chaîne :"
                " on peut mesurer sa longueur, la découper, la mettre en majuscules.",
            ]),
        ],
    },
    "exemple_complet": {
        "titre": "L'exemple complet : la date de rentrée",
        "segments": [
            ("exemple_complet", [
                "Voilà l'exercice type du contrôle : afficher la date de façon lisible,"
                " avec le mois en lettres.",
                "Trois étapes, toujours les mêmes.",
                "Un : on crée la date : let d, égal new Date de la rentrée.",
                "Deux : on prépare le tableau des douze mois, de janvier à décembre.",
                "Trois : on lit les trois morceaux dans la date,"
                " et on les range dans trois variables.",
                "let jour, égal d point getDate. let nomMois, égal mois crochet"
                " d point getMonth. let annee, égal d point getFullYear.",
                "Puis on colle le tout dans une phrase :"
                " Rentrée au Lycée Rafèha, deux points, jour, espace, nomMois, espace, année.",
                "La console affiche : Rentrée au Lycée Rafèha : quinze septembre deux mille"
                " vingt-six.",
                "Regardez bien : jour vaut quinze, sans zéro devant ;"
                " nomMois vaut septembre, sans le huit ; et annee vaut deux mille vingt-six.",
                "Aucun numéro de mois n'apparaît dans la phrase : c'est le tableau"
                " qui a traduit le huit en septembre.",
            ]),
        ],
    },
    "exercices": {
        "titre": "Exercices et ce qu'il faut retenir",
        "segments": [
            ("exercices", [
                "Trois exercices pour finir, comme en classe : l'énoncé à gauche,"
                " la correction détaillée à droite.",
                "Premier exercice. d vaut la rentrée. Que renvoie d point getMonth ?"
                " Et que renvoie d point getMonth plus un ?",
                "Réponse : huit, puis neuf. Septembre est le neuvième mois de l'année,"
                " mais JavaScript le numérote huit, parce qu'il part de zéro.",
                "Deuxième exercice. Comment afficher vingt-cinq décembre deux mille vingt-six"
                " en toutes lettres, à partir d'une date ?",
                "Réponse : le jour avec getDate, le nom du mois avec le tableau crochet"
                " getMonth, et l'année avec getFullYear, puis on concatène.",
                "Troisième exercice. Un élève écrit new Date de quinze barre neuf barre"
                " deux mille vingt-six. Que se passe-t-il ?",
                "Réponse : le format à la française n'est pas fiable ;"
                " il faut écrire l'année d'abord, puis le mois, puis le jour.",
                "À retenir, en quatre points.",
                "Un : getMonth commence à zéro, janvier vaut zéro, septembre vaut huit ;"
                " on ajoute un pour le numéro habituel.",
                "Deux : getDate renvoie le jour du mois, entre un et trente et un,"
                " pas le jour de la semaine.",
                "Trois : getFullYear donne l'année sur quatre chiffres ;"
                " le format sûr pour créer une date, c'est année, mois, jour.",
                "Quatre : toString donne un texte qui dépend du navigateur ;"
                " pour une date lisible, on assemble soi-même les trois morceaux.",
                "Bonne révision, et à bientôt dans une prochaine capsule.",
            ]),
        ],
    },
}


# ── Assemblage ─────────────────────────────────────────────────────────────
def texte_segment(section: str, cle: str) -> str:
    for nom, phrases in SECTIONS[section]["segments"]:
        if nom == cle:
            # chaque phrase est complète : on les colle avec une espace, sinon la
            # voix off lirait « 2.0.Aujourd'hui » d'un seul trait
            return " ".join(phrases)
    raise KeyError(f"{section} / {cle}")


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
