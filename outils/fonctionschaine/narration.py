"""Texte de la voix off de « Les chaînes de caractères » (JavaScript).

Capsule de la fiche « Chaînes de caractères, conversions de types et dates »
(Annexe JS, 3ᵉ/4ᵉ SI, Lycée Rafèha). Le plan suit la fiche, dans son ordre :

* **partie A** — les chaînes : concaténation, longueur, accès, recherches,
  substring, replace, casse, trim, codes ASCII ;
* **partie B** — les conversions : isNaN, Number, parseFloat, parseInt, String ;
* **partie C** — l'objet Date et sa conversion en texte.

L'écran est coupé en deux, du début à la fin :

* **à gauche** — la fiche, la chaîne et ses positions (le ruban de caractères) ;
* **à droite** — le code JavaScript, puis ce que la console affiche.

Une seule chaîne sert d'exemple partout : « Lycée Rafèha ». Ses douze
caractères occupent les positions zéro à onze, l'espace compris.

Conventions de nommage, une fois pour toutes :

* **position** (ou indice) = le numéro d'un caractère, à partir de zéro ;
* **méthode** = elle s'appelle avec des parenthèses ; **propriété** =
  `length`, sans parenthèses ;
* **chaîne d'origine** = celle sur laquelle on appelle la méthode : elle n'est
  jamais modifiée, la méthode renvoie une **nouvelle** valeur.
"""
from __future__ import annotations

# L'ordre de lecture ; il sert aussi à numéroter les chapitres.
ORDRE = [
    "ouverture", "positions", "concat_longueur", "acces_recherche",
    "decouper_remplacer", "casse_trim", "codes", "nombres", "texte_date",
    "exercices",
]

# La chaîne d'exemple de toute la capsule (celle de la fiche).
CH = "Lycée Rafèha"

SECTIONS = {
    "ouverture": {
        "titre": "Bienvenue — les chaînes de caractères",
        "segments": [
            ("ouverture", [
                "Bienvenue dans STI Version 2.0.",
                "Aujourd'hui, une capsule de JavaScript sur les chaînes de caractères.",
                "Une chaîne, c'est du texte entre guillemets : un nom, une adresse,"
                " une réponse tapée au clavier.",
                "Tous les exemples de cette capsule utilisent la même chaîne :",
                " Lycée Rafèha.",
                "Trois parties. Partie A : les méthodes des chaînes — concaténer, mesurer,"
                " chercher, découper, remplacer.",
                "Partie B : les conversions — transformer du texte en nombre,"
                " et un nombre en texte.",
                "Partie C : l'objet Date, et sa conversion en chaîne.",
                "L'écran est coupé en deux : à gauche la fiche, la chaîne et ses positions ;"
                " à droite le code, et ce que la console affiche.",
                "Une règle à retenir dès maintenant : aucune de ces méthodes ne modifie"
                " la chaîne d'origine. Elles renvoient une nouvelle valeur.",
                "Pour la garder, il faut l'affecter à une variable.",
            ]),
        ],
    },
    "positions": {
        "titre": "Les positions : de zéro à length moins un",
        "segments": [
            ("positions", [
                "Commençons par ce qui fait perdre le plus de points : les positions.",
                "La chaîne s'écrit L, y, c, é, e, espace, R, a, f, è, h, a.",
                "Chaque caractère occupe une position, et la numérotation commence à zéro.",
                "Le L est à la position zéro, le y à un, le c à deux,"
                " le é à trois, le e à quatre.",
                "Attention : l'espace compte comme un caractère. Il est à la position cinq.",
                "Le R est donc à la position six, et le dernier a, celui de Rafèha,"
                " est à la position onze.",
                "La chaîne mesure douze caractères : ch point length vaut douze.",
                "Et le dernier caractère n'est pas à la position douze,"
                " mais à la position length moins un, donc onze.",
                "Douze caractères, positions de zéro à onze : c'est la seule règle"
                " à retenir, et elle servira dans toute la capsule.",
            ]),
        ],
    },
    "concat_longueur": {
        "titre": "Concaténer ( + ) et mesurer ( length )",
        "segments": [
            ("concat_longueur", [
                "Première méthode : la concaténation, avec le signe plus.",
                "ch1 plus ch2 colle deux chaînes bout à bout, et forme une seule chaîne.",
                "Aucun espace n'est ajouté automatiquement : si je veux une espace,"
                " je l'écris moi-même, entre deux guillemets.",
                "Regardez à droite : nom vaut Lycée, ville vaut Rafèha.",
                "let ch égal nom, plus guillemet espace guillemet, plus ville :"
                " la console affiche Lycée Rafèha.",
                "Sans cet espace, on obtiendrait LycéeRafèha, collé.",
                "Et on peut coller du texte et une chaîne : Bienvenue au, plus ch.",
                "Deuxième méthode : length. C'est une propriété, pas une fonction :"
                " pas de parenthèses.",
                "ch point length vaut douze : cinq pour Lycée, un pour l'espace,"
                " six pour Rafèha.",
                "Deuxième piège : length compte les caractères, pas les mots.",
            ]),
        ],
    },
    "acces_recherche": {
        "titre": "Accéder ( [p] ), indexOf et lastIndexOf",
        "segments": [
            ("acces_recherche", [
                "Troisième méthode : accéder à un caractère, avec des crochets.",
                "ch crochet zéro donne L. ch crochet six donne R.",
                "ch crochet ch point length moins un donne le dernier caractère : a.",
                "Et si je demande une position qui n'existe pas, la position douze"
                " par exemple, JavaScript ne proteste pas : il répond undefined.",
                "Retenez ce mot : undefined, et non une erreur.",
                "Quatrième et cinquième méthodes : chercher.",
                "indexOf donne la position de la première occurrence :"
                " ch point indexOf de a donne sept.",
                "Avec un deuxième argument, la recherche part de cette position :"
                " indexOf de a à partir de huit donne onze.",
                "lastIndexOf donne la dernière occurrence : lastIndexOf de a donne onze ;"
                " en partant de dix et en cherchant vers l'arrière, on retrouve sept.",
                "Et quand la lettre est absente, les deux répondent moins un.",
                "Moins un, ce n'est pas zéro : zéro voudrait dire trouvé au tout début.",
                "Dernier piège : la recherche distingue majuscules, minuscules et accents.",
                "indexOf de e donne quatre, le e de Lycée ; indexOf de é donne trois.",
                "e et é sont deux caractères différents.",
            ]),
        ],
    },
    "decouper_remplacer": {
        "titre": "Découper ( substring ) et remplacer ( replace )",
        "segments": [
            ("decouper_remplacer", [
                "Sixième méthode : substring, pour extraire un morceau.",
                "Deux indices : le début, inclus, et la fin, exclue.",
                "ch point substring de zéro à trois donne L, y, c :"
                " les positions zéro, un et deux, mais pas la trois.",
                "Quatre règles, et elles tombent toutes du même principe.",
                "Si les deux indices sont égaux, on obtient une chaîne vide.",
                "Si le deuxième est omis, on va jusqu'à la fin de la chaîne.",
                "Si un indice est négatif, ou n'est pas un nombre, il est traité comme zéro.",
                "Et si le premier indice est plus grand que le second,"
                " JavaScript les échange : substring de un à zéro donne exactement"
                " la même chose que substring de zéro à un.",
                "Septième méthode : replace.",
                "ch point replace de Lycée par École donne École Rafèha.",
                "Attention, replace ne remplace que la première occurrence :"
                " replace de a par A donne Lycée RAfèha, un seul a passe en majuscule.",
                "Et la chaîne d'origine n'a pas bougé : ch vaut toujours Lycée Rafèha.",
            ]),
        ],
    },
    "casse_trim": {
        "titre": "La casse et les espaces : toLowerCase, toUpperCase, trim",
        "segments": [
            ("casse_trim", [
                "Huitième et neuvième méthodes : changer la casse.",
                "toLowerCase met tout en minuscules : lycée rafèha.",
                "toUpperCase met tout en majuscules : LYCÉE RAFÈHA.",
                "À quoi ça sert ? À comparer deux textes sans tenir compte de la casse :"
                " un élève qui tape son nom en majuscules doit être reconnu.",
                "Dixième méthode : trim, qui enlève les espaces au début et à la fin.",
                "Regardez à droite : la chaîne commence par trois espaces et finit par"
                " trois espaces ; elle mesure dix-huit caractères.",
                "Après trim, elle affiche Lycée Rafèha, et trim point length donne douze.",
                "Les espaces du milieu, eux, sont conservés : trim ne touche qu'aux bords.",
                "C'est la méthode à connaître pour nettoyer une saisie :"
                " un champ de formulaire arrive souvent avec des espaces collés devant.",
                "Attention : pour vérifier qu'un champ n'est pas vide, testez"
                " trim point length égal zéro, et non l'égalité avec une chaîne vide.",
            ]),
        ],
    },
    "codes": {
        "titre": "Les codes des caractères : charCodeAt, fromCharCode",
        "segments": [
            ("codes", [
                "Onzième méthode : charCodeAt, le code d'un caractère.",
                "Pour l'ordinateur, un caractère, c'est un nombre : son code ASCII.",
                "ch point charCodeAt de zéro donne soixante-seize : le code de L majuscule.",
                "De six donne quatre-vingt-deux, le R.",
                "De sept donne quatre-vingt-dix-sept, le a minuscule.",
                "Douzième méthode : String point fromCharCode, la fonction inverse.",
                "Elle s'écrit avec le préfixe String, et non avec le nom de la chaîne.",
                "String point fromCharCode de quatre-vingt-deux, quatre-vingt-dix-sept"
                " et cent-deux donne Raf : le début de Rafèha.",
                "Et pour les lettres accentuées, les codes dépassent cent vingt-sept :"
                " charCodeAt de trois donne deux cent trente-trois, le é.",
                "À quoi ça sert ? À vérifier le contenu d'une saisie :"
                " entre soixante-cinq et quatre-vingt-dix pour les majuscules,"
                " entre quarante-huit et cinquante-sept pour les chiffres.",
            ]),
        ],
    },
    "nombres": {
        "titre": "Convertir : isNaN, Number, parseFloat, parseInt",
        "segments": [
            ("nombres", [
                "Partie B : les conversions.",
                "Tout ce que l'élève tape arrive en texte : prompt renvoie du texte,"
                " un champ de formulaire renvoie du texte.",
                "Avant de calculer, il faut convertir.",
                "isNaN, d'abord : elle répond vrai si la valeur n'est pas"
                " convertible en nombre. NaN veut dire Not a Number.",
                "isNaN de vingt-cinq donne faux ; isNaN de Lycée Rafèha donne vrai.",
                "Piège : isNaN d'une chaîne vide donne faux, parce qu'une chaîne vide"
                " vaut zéro. Pour un champ obligatoire, testez aussi la longueur.",
                "Number : la conversion stricte.",
                "Number de vingt-cinq donne vingt-cinq ; Number de douze point cinq"
                " donne douze point cinq.",
                "Number de douze élèves donne NaN, parce qu'il y a du texte après"
                " le nombre.",
                "parseFloat : la conversion souple. Elle lit le début et s'arrête au"
                " premier caractère invalide : parseFloat de douze point cinq points"
                " donne douze point cinq.",
                "parseInt : pareil, mais sans la partie décimale, et sans arrondi :"
                " parseInt de douze point neuf donne douze.",
                "parseInt accepte aussi une base : parseInt de mille dix en base deux"
                " donne dix ; parseInt de F F en base seize donne deux cent"
                " cinquante-cinq.",
                "Et le piège du programme : vingt plus cinq, entre guillemets,"
                " c'est deux cent cinq, une concaténation.",
                "Number de vingt plus Number de cinq donne vingt-cinq : l'addition.",
            ]),
        ],
    },
    "texte_date": {
        "titre": "String( ) et l'objet Date",
        "segments": [
            ("texte_date", [
                "Dernière conversion : String, pour transformer n'importe quelle"
                " valeur en texte.",
                "annee vaut deux mille vingt-six, un nombre.",
                "annee point length donne undefined : un nombre n'a pas de length.",
                "String de annee, point length, donne quatre.",
                "Et String de annee, plus Lycée Rafèha, donne deux mille vingt-six,"
                " tiret, Lycée Rafèha.",
                "Pourquoi convertir ? Parce qu'une fois la valeur devenue texte,"
                " elle a toutes les méthodes des chaînes : length, indexOf, substring.",
                "Partie C : l'objet Date.",
                "new Date crée une date. Ici, la date de la rentrée au Lycée Rafèha :"
                " le quinze septembre deux mille vingt-six, à huit heures.",
                "toString la transforme en texte : le jour, le mois, l'année,"
                " l'heure et le fuseau horaire.",
                "Le format exact dépend du navigateur et du fuseau : ne le figez jamais"
                " dans une réponse d'exercice, affichez-le.",
                "Une fois la date convertie en texte, elle se traite comme une chaîne :"
                " on peut mesurer sa longueur, la découper avec substring,"
                " et en extraire l'année.",
            ]),
        ],
    },
    "exercices": {
        "titre": "Exercices et ce qu'il faut retenir",
        "segments": [
            ("exercices", [
                "Trois exercices pour finir, comme en classe : l'énoncé à gauche,"
                " la correction détaillée à droite.",
                "Exercice un. On dispose de ch, qui vaut Lycée Rafèha."
                " Que vaut ch point substring de quatre à sept ?",
                "Réponse : le e de Lycée, l'espace, le R. Donc e, espace, R :"
                " trois caractères. La position sept, le a, n'est pas prise.",
                "Exercice deux. Que vaut ch point indexOf de a,"
                " plus ch point lastIndexOf de a ?",
                "Réponse : sept plus onze, donc dix-huit.",
                "Attention : ce n'est pas une position, c'est une somme.",
                "Exercice trois. Un élève tape son prénom avec des espaces devant"
                " et derrière. Comment obtenir un prénom propre, et sa longueur ?",
                "Réponse : prénom point trim, puis point length.",
                "Et pour comparer deux saisies sans tenir compte de la casse,"
                " on ajoute toLowerCase.",
                "À retenir. Un : les méthodes ne modifient jamais la chaîne,"
                " elles renvoient une nouvelle valeur.",
                "Deux : les positions commencent à zéro, et le dernier caractère"
                " est à length moins un.",
                "Trois : les recherches renvoient moins un quand elles ne trouvent rien.",
                "Quatre : majuscules, minuscules et accents sont trois choses différentes.",
                "Cinq : ce qui vient d'un prompt est du texte ; Number, parseInt"
                " ou parseFloat avant de calculer, et isNaN pour vérifier.",
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
