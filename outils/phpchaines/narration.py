"""Texte de la voix off de « Chaînes, transtypage et date/heure » (PHP).

Capsule de la fiche « Capsule PHP : chaînes de caractères, transtypage et
date/heure en PHP » (4ᵉ SI, Lycée Rafèha). Le plan suit la fiche, dans son
ordre — les trois parties A, B, C et leurs vingt rubriques :

* **partie A** — les chaînes : `ord`, `chr`, `strlen`, `strpos`, `substr`,
  `str_replace`, `strtolower`, `strtoupper`, `trim`, puis l'exemple complet
  qui sépare « Lycée » et « Rafèha » ;
* **partie B** — les transtypages : `(int)`, `(float)`, `(string)`, `(bool)`,
  `(array)` ;
* **partie C** — les dates : le timestamp, `date()`, `time()`, `checkdate()`,
  `strtotime()`, puis l'exemple complet qui affiche la date de rentrée.

L'écran est coupé en deux, comme les autres capsules :

* **à gauche** — la fiche, et surtout **le ruban d'octets** : une case par
  octet, sa position au-dessus, et les deux octets des lettres accentuées
  (`é`, `è`). C'est lui qui explique pourquoi `R` est à la position 7 et
  pourquoi `strlen("Lycée Rafèha")` donne 14 ;
* **à droite** — le code PHP dans sa console noire, puis ce que la page
  affiche.

Une seule chaîne sert d'exemple partout : `$ch = "Lycée Rafèha"` ;
une seule date : la rentrée du Lycée Rafèha, le 15 septembre 2026 à 8 h.

Conventions de nommage, une fois pour toutes :

* **octet** = l'unité que comptent `strlen`, `strpos` et `substr` ; une lettre
  accentuée en occupe deux ;
* **position** = le numéro d'un octet, à partir de zéro ;
* **timestamp** = le nombre de secondes écoulées depuis le 1er janvier 1970 ;
* **transtypage** = écrire le type entre parenthèses devant la valeur.
"""
from __future__ import annotations

# L'ordre de lecture ; il sert aussi à numéroter les chapitres.
ORDRE = [
    "ouverture", "octets", "longueur", "recherche", "extraction", "remplacer",
    "separer", "transtypage_nombres", "transtypage_autres", "dates",
    "verifier_date", "exercices",
]

# La chaîne et la date de toute la capsule.
CH = "Lycée Rafèha"
JOUR, MOIS_DATE, ANNEE = 15, 9, 2026
SOURCE = f"{ANNEE}-{MOIS_DATE:02d}-{JOUR:02d} 08:00:00"
# Le timestamp UTC de la rentrée, celui que la fiche donne.
TIMESTAMP = 1789459200

SECTIONS = {
    "ouverture": {
        "titre": "Bienvenue — chaînes, transtypage et dates en PHP",
        "segments": [
            ("ouverture", [
                "Bienvenue dans STI Version 2.0.",
                "Aujourd'hui, une capsule de PHP en trois parties : les fonctions sur les chaînes de caractères,",
                " les opérateurs de transtypage, et les fonctions de date et d'heure.",
                "L'écran est coupé en deux : à gauche la fiche, à droite le code PHP — et ce que la page affiche.",
                "Pour les exercices, la coupure change de sens : l'énoncé à gauche, la correction détaillée à droite.",
                "Deux choses à retenir dès maintenant.",
                "Un : tous les exemples de la partie A utilisent la même chaîne, dollar ch égal Lycée Rafèha, entre guillemets.",
                "Deux : dans un fichier PHP enregistré en UTF-8, une lettre accentuée occupe deux octets.",
                "Le é et le è pèsent donc deux octets chacun, et cela change toutes les positions.",
                "Regardez le ruban d'octets en bas à gauche : quatorze cases numérotées de zéro à treize.",
                "C'est lui que nous allons suivre pendant toute la partie A.",
            ]),
        ],
    },
    "octets": {
        "titre": "Les octets, et les codes ASCII : ord et chr",
        "segments": [
            ("octets", [
                "Commençons par le ruban.",
                "La chaîne compte douze caractères, mais quatorze octets, parce que le é et le è en occupent deux chacun.",
                "Les positions, celles que comptent les fonctions, sont numérotées à partir de zéro :",
                " zéro pour le L, un pour le y, deux pour le c, trois et quatre pour le é, cinq pour le e, six pour l'espace,",
                " sept pour le R, huit pour le a, neuf pour le f, dix et onze pour le è, douze pour le h, treize pour le a.",
                "Retenez bien ce sept : le R n'est pas à la position six, comme on compterait à la main, mais à la position sept,",
                " parce que le é a pris deux cases.",
                "Première fonction : ord. ord, de ch, retourne le code ASCII du premier caractère de la chaîne, et seulement du premier.",
                " ord de L donne 76. ord de R donne 82. ord de la chaîne entière donne encore 76, le code du L.",
                "Et ord du é donne 195 : ce n'est pas un code ASCII, c'est le premier octet du é en UTF-8.",
                "Seconde fonction : chr, l'inverse. chr de 76 donne la lettre L.",
                "On peut donc écrire chr 82, chr 97, chr 102, et obtenir R a f.",
                "Et l'exemple classique : le code du a minuscule vaut 97, celui du A majuscule 65 ; la différence est de trente-deux.",
                "chr ne travaille que sur les codes de base, de zéro à 127.",
            ]),
        ],
    },
    "longueur": {
        "titre": "La longueur d'une chaîne : strlen",
        "segments": [
            ("longueur", [
                "Troisième fonction : strlen. strlen de ch retourne la longueur de la chaîne, espaces compris.",
                "strlen de dollar ch donne 14.",
                "strlen de Lycée, seul, donne 6, alors que le mot n'a que cinq lettres.",
                "Pourquoi ? Parce que le é occupe deux octets.",
                "Et voilà la phrase à retenir : strlen compte les octets, pas les caractères.",
                "Lycée Rafèha contient douze caractères, mais quatorze octets.",
                "Comparez avec JavaScript : length donne 12, strlen donne 14. Ce n'est pas une erreur, c'est une autre unité.",
                "Conséquence pratique : ne jamais utiliser strlen pour mesurer un texte affiché, seulement pour la place occupée en mémoire.",
                "Regardez le ruban : strlen compte les cases, pas les lettres.",
            ]),
        ],
    },
    "recherche": {
        "titre": "La recherche d'une sous-chaîne : strpos",
        "segments": [
            ("recherche", [
                "Quatrième fonction : strpos, la position d'une sous-chaîne.",
                "La syntaxe est strpos de ch, puis ch1 : la chaîne où l'on cherche d'abord, ce que l'on cherche ensuite.",
                "strpos de dollar ch, R, donne 7.",
                "strpos de dollar ch, a, donne 8 : c'est la première lettre a, celle de Rafèha.",
                "strpos de dollar ch, Raf, donne 7 aussi : c'est la position du début du mot.",
                "Et strpos de dollar ch, L, donne 0, parce que le L est au tout début.",
                "Voilà le piège de cette fonction. Si la sous-chaîne est absente, strpos ne retourne pas moins un : elle retourne false.",
                "Et comme la position zéro s'écrit avec un zéro, un test écrit avec deux signes égal, zéro égal false, serait vrai même quand la lettre est au début.",
                "La fiche le dit et le répète : il faut tester avec trois signes égal, strictement égal à false.",
                "On écrit : si strpos de dollar ch, z, trois signes égal false, alors afficher z est absent.",
                "Dernier point, et il découle du ruban : les positions sont comptées en octets.",
                "Le R est à la position 7, pas à la position 6, à cause du é.",
            ]),
        ],
    },
    "extraction": {
        "titre": "L'extraction d'une sous-chaîne : substr",
        "segments": [
            ("extraction", [
                "Cinquième fonction : substr, pour extraire un morceau de la chaîne.",
                "La syntaxe est substr de ch, la position de début, et, si besoin, une longueur.",
                "Si la longueur est omise, l'extraction va jusqu'à la fin.",
                "Quatre exemples. substr de dollar ch, zéro, six, donne Lycée.",
                "substr de dollar ch, sept, donne Rafèha, jusqu'au bout.",
                "substr de dollar ch, sept, trois, donne Raf.",
                "substr de dollar ch, zéro, trois, donne Lyc.",
                "Et voilà la différence avec JavaScript, à ne pas confondre : le troisième paramètre est une longueur, pas une position de fin.",
                "Lycée occupe six octets, des positions zéro à cinq : d'où substr de zéro, six.",
                "Attention aussi au découpage au milieu d'un accent.",
                "substr de dollar ch, zéro, quatre, affiche L y c, puis un caractère illisible : on a coupé le é en deux.",
                "Sur le ruban, c'est le trait qui tombe au milieu de la case quatre.",
            ]),
        ],
    },
    "remplacer": {
        "titre": "Remplacer, changer la casse, nettoyer les espaces",
        "segments": [
            ("remplacer", [
                "Sixième fonction : str_replace, le remplacement.",
                "La syntaxe est str_replace de ch1, ch2, ch : on met ce qu'on cherche, puis ce qu'on met à la place,",
                " et la chaîne en dernier argument.",
                "str_replace de Lycée par École, dans dollar ch, donne École Rafèha.",
                "str_replace de a par A donne Lycée RAfèhA : les deux a ont été remplacés, en un seul parcours.",
                "str_replace de z par Z ne change rien, et la dernière ligne, echo de dollar ch, affiche toujours Lycée Rafèha :",
                " la chaîne d'origine n'est jamais modifiée, la fonction retourne une nouvelle valeur.",
                "Trois différences avec replace en JavaScript : toutes les occurrences sont remplacées, la chaîne est le dernier argument,",
                " et la recherche distingue les majuscules des minuscules.",
                "Septième et huitième fonctions : strtolower et strtoupper, la casse.",
                "strtolower de dollar ch donne lycée rafèha. strtoupper donne LYCéE RAFèHA.",
                "Regardez bien le é et le è : ils n'ont pas été convertis. Ces deux fonctions ne connaissent que les lettres non accentuées.",
                "Neuvième fonction : trim, qui supprime les espaces du début et de la fin, jamais ceux du milieu.",
                "Avec trois espaces avant et trois espaces après, strlen donne 20 ; après trim, strlen donne 14.",
                "trim sert à nettoyer une saisie, celle de dollar underscore POST ou de dollar underscore GET, avant de la tester ou de l'enregistrer.",
            ]),
        ],
    },
    "separer": {
        "titre": "L'exemple complet : séparer le type et le nom",
        "segments": [
            ("separer", [
                "Voilà l'exercice type de la fiche : séparer Lycée et Rafèha dans la chaîne.",
                "On combine strpos, substr et la concaténation, en trois lignes.",
                "Un : on trouve la position du R. dollar pos égal strpos de dollar ch, R, ce qui donne 7.",
                "Deux : le nom, c'est substr de dollar ch à partir de la position 7 : Rafèha.",
                "Trois : le type, c'est substr de dollar ch, zéro, dollar pos moins un : on s'arrête juste avant l'espace, et on obtient Lycée.",
                "Puis on colle : echo de dollar type point barre oblique point dollar nom, et la page affiche Lycée barre Rafèha.",
                "Regardez ce point : c'est l'opérateur de concaténation en PHP.",
                "En JavaScript, on écrit un plus. En PHP, on écrit un point.",
                "Et la position 7 vient du ruban d'octets : elle est juste parce que le é occupe deux cases.",
            ]),
        ],
    },
    "transtypage_nombres": {
        "titre": "Le transtypage : (int) et (float)",
        "segments": [
            ("transtypage_nombres", [
                "Deuxième partie : les opérateurs de transtypage.",
                "Un transtypage, en anglais un cast, convertit une valeur vers un autre type :",
                " on écrit le type entre parenthèses devant la valeur, par exemple parenthèse int parenthèse dollar x.",
                "La variable d'origine n'est pas modifiée.",
                "Pourquoi c'est indispensable ? Parce que les valeurs de dollar underscore GET et de dollar underscore POST sont toujours des chaînes.",
                "Avant de calculer avec, il faut les convertir.",
                "Onzième rubrique : la conversion en entier, parenthèse int parenthèse.",
                " int de la chaîne 25 donne 25. int de 12 virgule 9 donne 12 : la partie décimale est supprimée, sans arrondi.",
                " int de la chaîne 12 virgule 9 donne 12 aussi.",
                " int de la chaîne 25 élèves donne 25 : PHP lit le nombre du début.",
                " int de Lycée Rafèha donne 0 : aucun nombre au début.",
                " int de true donne 1.",
                "Et la différence avec JavaScript : en PHP, une chaîne qui ne commence pas par un nombre devient simplement zéro.",
                "Pour arrondir au lieu de supprimer les décimales, on utilise round.",
                "Douzième rubrique : la conversion en réel, parenthèse float parenthèse.",
                " float de la chaîne 12 point 5 donne 12 point 5. float de 12 point 5 points donne 12 point 5.",
                "Mais attention : float de 12 virgule 5, avec une virgule, donne 12.",
                "Le séparateur décimal est le point, jamais la virgule.",
                " float de Lycée Rafèha donne 0, et float de 3 donne 3 : un réel affiche 3, sans virgule ni décimale.",
            ]),
        ],
    },
    "transtypage_autres": {
        "titre": "Le transtypage : (string), (bool) et (array)",
        "segments": [
            ("transtypage_autres", [
                "Treizième rubrique : la conversion en chaîne, parenthèse string parenthèse.",
                " string de 2026 donne la chaîne 2026, et strlen de cette chaîne donne 4.",
                " string de 12 point 5 donne 12 point 5.",
                " string de true donne 1, et string de false donne une chaîne vide : rien ne s'affiche.",
                "À noter : le point de concaténation convertit déjà tout en chaîne.",
                "Année espace point 2026 donne Année 2026 sans transtypage ; l'opérateur sert à forcer le type, explicitement.",
                "Quatorzième rubrique, la plus délicate : la conversion en booléen, parenthèse bool parenthèse.",
                "Sont fausses : la valeur zéro, zéro virgule zéro, la chaîne vide, la chaîne zéro, le tableau vide et null.",
                "Toute autre valeur donne vrai.",
                " bool de Lycée Rafèha donne 1, c'est vrai. bool de 12 donne 1.",
                "Et voici le piège : bool de la chaîne false, entre guillemets, donne 1 aussi.",
                "Parce qu'une chaîne non vide est toujours vraie, même quand elle contient le mot false.",
                "En revanche, bool de la chaîne vide ne donne rien, bool du zéro ne donne rien,",
                " et bool de la chaîne zéro ne donne rien non plus.",
                "C'est l'inverse de JavaScript, où la chaîne zéro est vraie.",
                "Dernière rubrique de la partie B : la conversion en tableau, parenthèse array parenthèse.",
                "Une valeur simple devient un tableau d'un seul élément, d'indice zéro.",
                "Avec dollar t égal array de dollar ch : count de dollar t donne 1,",
                " et dollar t crochet zéro donne Lycée Rafèha.",
                "Et count de array de null donne 0, un tableau vide.",
            ]),
        ],
    },
    "dates": {
        "titre": "Le timestamp et la fonction date",
        "segments": [
            ("dates", [
                "Troisième partie : les fonctions de date et d'heure.",
                "Toutes travaillent avec un timestamp : le nombre de secondes écoulées depuis le premier janvier 1970 à minuit.",
                "Regardez la frise en bas à gauche : elle part de 1970 et arrive à notre rentrée, le 15 septembre 2026.",
                "Un timestamp, c'est une simple distance en secondes depuis ce point de départ.",
                "Seizième rubrique : la fonction date.",
                "La syntaxe est date de format, et, si besoin, d'un timestamp.",
                "Sans timestamp, date utilise la date et l'heure courantes.",
                "Le format s'écrit avec des lettres, et il faut les connaître par cœur. Les voici.",
                "La lettre d, c'est le jour du mois sur deux chiffres, de 01 à 31.",
                "La lettre j, le jour du mois sans zéro, de 1 à 31.",
                "La lettre m, le mois sur deux chiffres, de 01 à 12. La lettre n, le mois sans zéro.",
                "La lettre Y, l'année sur quatre chiffres. La lettre y, l'année sur deux chiffres.",
                "La lettre H, l'heure, de 00 à 23. La lettre i, les minutes. La lettre s, les secondes.",
                "La lettre D, le jour de la semaine en trois lettres, et la lettre l, le jour de la semaine en entier, mais en anglais.",
                "Avec le timestamp de la rentrée : date de d barre m barre Y donne 15 barre 09 barre 2026.",
                "date de H deux points i donne 08:00. date de l donne Tuesday.",
                "Et date de Y seul donne l'année courante, deux mille vingt-six aujourd'hui.",
                "Les noms de jours et de mois sont en anglais : Tuesday, September.",
                "Pour écrire une barre ou un tiret, on les place directement dans le format.",
            ]),
        ],
    },
    "verifier_date": {
        "titre": "L'heure, la validité et la conversion d'une date",
        "segments": [
            ("verifier_date", [
                "Dix-septième rubrique : time, l'heure actuelle en timestamp, un grand nombre qui change chaque seconde.",
                "date de d barre m barre Y, espace, H deux points i deux points s, avec time, donne la date et l'heure du jour.",
                "Et date de H deux points i, avec time plus 3600, donne l'heure dans une heure.",
                "Ajouter des secondes à time, c'est décaler une date : 86400 secondes font un jour.",
                "Dix-huitième rubrique : checkdate, la validité d'une date.",
                " checkdate de mois, jour, année : trois arguments, et l'ordre compte.",
                "Le mois est le premier : checkdate de 9, 15, 2026 pour le 15 septembre, l'inverse de l'écriture française.",
                "Elle tient compte du nombre de jours de chaque mois et des années bissextiles :",
                " 15 septembre 2026 est valide, mais le 30 février ne l'est pas,",
                " et le 29 février 2028 est valide alors que le 29 février 2026 ne l'est pas.",
                "Dix-neuvième rubrique : strtotime, une chaîne de caractères devient un timestamp.",
                " strtotime de la chaîne 2026 tiret 09 tiret 15 donne 1789430400,",
                " et strtotime de 15 september 2026 donne exactement le même nombre : les noms de mois sont en anglais.",
                "Avec l'heure, on obtient 1789459200.",
                "Si la chaîne n'est pas une date reconnue, strtotime retourne false : c'est le cas de 2026 tiret 13 tiret 45.",
                "Dernier exemple, celui de la fiche : vérifier puis afficher la date de rentrée.",
                "Jour 15, mois 9, année 2026 : on vérifie avec checkdate, on convertit avec strtotime, on affiche avec date.",
                "La page écrit : Rentrée au Lycée Rafèha, deux points, 15 barre 09 barre 2026.",
            ]),
        ],
    },
    "exercices": {
        "titre": "Exercices et ce qu'il faut retenir",
        "segments": [
            ("exercices", [
                "Trois exercices pour finir, comme en classe : l'énoncé à gauche, la correction détaillée à droite.",
                "Premier exercice. Que valent strlen de la chaîne Lycée Rafèha, et strpos de cette chaîne, R ?",
                "Réponse : 14 pour strlen, et 7 pour strpos, le é et le è occupant deux octets chacun.",
                "Deuxième exercice. Que vaut int de la chaîne 12 euros 50, et que vaut bool de la chaîne zéro ?",
                "Réponse : 12, car PHP lit le nombre du début ; et faux, car la chaîne zéro est une valeur fausse.",
                "Troisième exercice. Comment afficher le 15 septembre 2026 au format jour barre mois barre année, après avoir vérifié la date ?",
                "Réponse : checkdate de 9, 15, 2026, le mois en premier ; puis strtotime, puis date de d barre m barre Y.",
                "À retenir, en six points.",
                "Un : les fonctions sur les chaînes ne modifient pas la variable d'origine.",
                "Deux : strlen, strpos et substr comptent en octets ; une lettre accentuée en occupe deux.",
                "Trois : strpos retourne false, et non moins un, quand la sous-chaîne est absente ; on teste avec trois signes égal.",
                "Quatre : str_replace remplace toutes les occurrences, contrairement à replace en JavaScript.",
                "Cinq : une chaîne non numérique donne zéro avec int et float ; bool donne faux pour zéro, la chaîne vide, la chaîne zéro, un tableau vide et null.",
                "Six : un timestamp est un nombre de secondes depuis le premier janvier 1970, et checkdate attend le mois, puis le jour, puis l'année.",
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
