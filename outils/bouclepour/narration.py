"""Texte de la voix off de « La boucle Pour — l'immeuble et le sac ».

Le récit est reconstruit de bout en bout autour de l'immeuble, avec une
progression volontairement lente sur deux idées difficiles :

  * **la variable** (sections `variable` et `accumuler`) : un sac vide, un nom
    qui ne bouge pas, un contenu qui change ; puis `S = S + valeur`, où le S de
    droite est l'ancien contenu et le S de gauche le nouveau ;
  * **la nécessité de la boucle** (section `pourquoi`) : sans boucle il faut
    écrire une ligne par étage — quatre lignes pour quatre étages, cent lignes
    pour cent étages — et le copier-coller ne passe pas à l'échelle.

Chaque section correspond à un fichier audio de `voix/` ; c'est la voix qui
donne la durée de la scène, l'image suit (`calage.json`).
"""
from __future__ import annotations

# L'ordre de lecture et le découpage des sous-titres.
ORDRE = ["probleme", "variable", "nom", "accumuler", "immeuble",
         "etage0", "repetition", "pourquoi", "bloc", "boucle"]

SECTIONS = {
    "probleme": {
        "titre": "Le problème : la somme des étages",
        "segments": [
            ("probleme", [
                "Voici mon immeuble : quatre étages.",
                "Au rez-de-chaussée, il y a quatre. Au premier, sept."
                " Au deuxième, deux. Et au troisième, neuf.",
                "Quatre nombres, rangés dans cet ordre : c'est un tableau."
                " Et ce tableau, je l'appelle T.",
                "Ce que je veux, c'est la somme de ces quatre nombres :"
                " quatre, plus sept, plus deux, plus neuf.",
                "Et je veux ranger le résultat dans une case que j'appelle S.",
                "S égal T crochet zéro, plus T crochet un, plus T crochet deux,"
                " plus T crochet trois.",
                "La question, c'est : comment je vais m'y prendre ?",
            ]),
        ],
    },
    "variable": {
        "titre": "Une variable : une boîte au contenu changeable",
        "segments": [
            ("variable", [
                "Première idée : il me faut une case mémoire.",
                "Un sac, si vous voulez.",
                "Une boîte, avec un nom, et une valeur dedans.",
                "Au début, mon sac est vide : je n'ai encore rien ramassé.",
                "Maintenant, j'y mets quatre. Regardez : le sac n'a pas changé,"
                " mais son contenu, oui.",
                "Je change d'avis : je retire quatre, je mets sept."
                " Même sac, même nom, autre valeur.",
                "C'est exactement ça, une variable :"
                " une boîte avec un nom, un contenu qu'on peut lire,"
                " et un contenu qu'on peut remplacer.",
                "Le nom reste, la valeur bouge.",
            ]),
        ],
    },
    "nom": {
        "titre": "Un nom : S, le même jusqu'à la fin",
        "segments": [
            ("nom", [
                "Mais attention : dans un immeuble, il y a beaucoup de sacs.",
                "Un par étage, un par habitant.",
                "Si je dis simplement « le sac », personne ne sait duquel je parle.",
                "L'ordinateur, encore moins que moi.",
                "Alors je donne un nom à celui que je vais utiliser :"
                " une étiquette, et je m'y tiens.",
                "Il s'appelle S. S comme somme.",
                "Et maintenant, quand j'écris S dans mon programme,"
                " c'est ce sac-là, et pas un autre.",
            ]),
        ],
    },
    "accumuler": {
        "titre": "S = S + … : lire, ajouter, réécrire",
        "segments": [
            ("accumuler", [
                "Passons à l'idée la plus importante.",
                "S, je peux le lire. S, je peux aussi l'écrire."
                " Et je peux faire les deux dans la même ligne.",
                "Mon sac vaut zéro. Je lis : zéro. J'ajoute quatre : quatre."
                " J'écris dans le sac : quatre.",
                "Je recommence : je lis S, qui vaut quatre. J'ajoute sept : onze."
                " J'écris onze dans S.",
                "Le nouveau contenu, c'est l'ancien contenu, plus ce que j'ajoute.",
                "Ça s'écrit : S égal S plus quelque chose.",
                "Et ça ne tourne pas en rond : le S de droite, c'est l'ancienne valeur ;"
                " le S de gauche, c'est la nouvelle.",
            ]),
        ],
    },
    "immeuble": {
        "titre": "L'immeuble et l'ascenseur",
        "segments": [
            ("immeuble", [
                "J'ai mon sac, j'ai mon tableau. Il reste à monter.",
                "Quatre étages, quatre cases : je vais les visiter un par un,"
                " et l'ascenseur va m'y aider.",
                "Mais avant de partir, une question : à chaque étage,"
                " qu'est-ce que je fais ?",
                "Réponse : toujours la même chose.",
                "J'ouvre la porte, je prends la valeur de l'étage,"
                " et je l'ajoute dans mon sac.",
            ]),
        ],
    },
    "etage0": {
        "titre": "Étage 0 : le premier tour, à la main",
        "segments": [
            ("etage0", [
                "Allons-y. Étage zéro.",
                "La porte s'ouvre : la case T crochet zéro contient quatre.",
                "Je lis mon sac : zéro. J'ajoute quatre. J'écris quatre dans le sac.",
                "En une seule ligne : S égal S plus T crochet zéro.",
                "Et voilà : mon sac contient quatre. Je peux monter.",
            ]),
        ],
    },
    "repetition": {
        "titre": "Étages 1, 2, 3 : je me répète",
        "segments": [
            ("repetition", [
                "Étage un. La porte s'ouvre : sept.",
                "S égal S plus T crochet un. Mon sac contient onze.",
                "Étage deux : deux. S égal S plus T crochet deux. Treize.",
                "Étage trois : neuf. Vingt-deux.",
                "Et là, je m'arrête et je regarde ce que j'ai écrit.",
                "Quatre lignes. Quatre fois la même ligne,"
                " avec juste le numéro de l'étage qui change.",
                "Ça marche… mais ça se voit que je me répète.",
            ]),
        ],
    },
    "pourquoi": {
        "titre": "Pourquoi une boucle ? Parce que je me répète",
        "segments": [
            ("pourquoi", [
                "Imaginons maintenant un immeuble de cent étages.",
                "Sans boucle, je dois écrire une ligne par étage : cent lignes.",
                "Mille étages ? Mille lignes.",
                "Et le jour où l'immeuble gagne un étage, il faut encore en ajouter une.",
                "Et si je me trompe sur une seule ligne, tout le résultat est faux.",
                "Recopier, ce n'est pas programmer : c'est du travail d'escargot.",
                "Ce que je veux, c'est écrire le geste une seule fois,"
                " et demander à l'ordinateur de le répéter pour chaque étage.",
                "C'est exactement le travail d'une boucle.",
            ]),
        ],
    },
    "bloc": {
        "titre": "Le bloc et le compteur",
        "segments": [
            ("bloc", [
                "Alors, quel est le geste, exactement ?",
                "Prendre la valeur de l'étage, et l'ajouter dans le sac.",
                "Une seule chose change d'un étage à l'autre : le numéro de la case.",
                "Zéro, puis un, puis deux, puis trois.",
                "Et ce numéro, l'ascenseur le connaît déjà : c'est son compteur.",
                "Donc le geste s'écrit : S égal S plus T crochet compteur.",
                "Voilà le bloc, seul, entre deux accolades.",
                "C'est lui qu'on va répéter.",
            ]),
        ],
    },
    "boucle": {
        "titre": "La boucle Pour : écrire une fois, répéter n fois",
        "segments": [
            ("boucle", [
                "Il ne reste qu'à l'entourer.",
                "Pour compteur de zéro à n moins un, faire le bloc. Fin Pour.",
                "Trois choses sont dites, et les trois comptent.",
                "Le départ : le compteur vaut zéro.",
                "La condition : tant que le compteur reste plus petit que n, on continue.",
                "Le pas : à chaque tour, le compteur augmente de un.",
                "L'ordinateur fait alors tout seul ce que je faisais à la main :"
                " il monte, il ajoute, il compte.",
                "Quatre étages : le compteur passe par zéro, un, deux, trois, puis s'arrête.",
                "Et dans le sac, à la fin : vingt-deux.",
                "Quatre plus sept plus deux plus neuf. La somme est juste.",
                "Une variable pour garder le résultat. Un bloc pour le geste."
                " Une boucle pour le répéter.",
                "Voilà tout ce qu'il fallait.",
            ]),
        ],
    },
}


# Ce que dit chaque section, phrases à plat (pour les sous-titres).
def texte_segment(section: str, cle: str) -> str:
    for identifiant, phrases in SECTIONS[section]["segments"]:
        if identifiant == cle:
            return " ".join(phrases)
    return ""


def texte_section(section: str) -> str:
    return " ".join(texte_segment(section, cle) for cle, _ in SECTIONS[section]["segments"])


def nombre_caracteres() -> int:
    return sum(len(texte_section(s)) for s in ORDRE)


# ── Sous-titres ────────────────────────────────────────────────────────────
def _replier(phrase, maxi=42):
    """Replie une phrase en lignes courtes, sans jamais couper un mot."""
    lignes, courant = [], ""
    for mot in phrase.split():
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
    """Une réplique = une phrase entière, repliée sur deux lignes au plus.

    On ne coupe jamais une phrase au milieu : si elle tient en deux lignes, elle
    forme une seule réplique ; sinon on la répartit sur plusieurs répliques en
    respectant les groupes de deux lignes.
    """
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
