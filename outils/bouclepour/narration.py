"""Texte de la voix off de « La boucle Pour — le sac et l'ascenseur ».

Chaque section correspond à un fichier audio de `voix/` produit par l'outil de
synthèse. La vidéo est calée sur la durée réelle de ces fichiers : c'est la voix
qui mène, l'image suit (`calage.json`).

Le récit suit exactement les onze étapes dictées par l'auteur :

 1. j'ai besoin de ramasser, je prends un sac ;
 2. le contenu du sac est changeable → une variable ;
 3. plusieurs sacs : il faut les distinguer → je le nomme S ;
 4. un immeuble, l'ascenseur, et la question « que faire avec chaque client ? » ;
 5. étage 0 : le sac reçoit l'étage → S = S + T[0] ;
 6. l'ascenseur avance et compte → un compteur ;
 7. je répète la même opération à l'étage 1 ;
 8. la première fois S = S + T[0], maintenant S = S + T[1] ;
 9. ce « quelque chose » qui change, c'est le compteur → S = S + T[compteur] ;
10. j'écris le bloc ;
11. combien de fois ? un arrêt avant la fin ? → la boucle Pour, complète.
"""
from __future__ import annotations

# L'ordre de lecture et le découpage des sous-titres.
ORDRE = ["sac", "nom", "immeuble", "etage0", "compteur", "repetition",
         "quelquechose", "bloc", "boucle"]

SECTIONS = {
    "sac": {
        "titre": "Un sac, c'est une variable",
        "segments": [
            ("sac", [
                "Comme j'ai besoin de ramasser, je prends un sac.",
                "Voilà mon sac.",
                "Pour l'instant il est vide : je n'ai encore rien ramassé.",
                "Mais attention : le contenu de ce sac est changeable.",
                "Je peux y mettre une chose, puis une autre à la place, autant de fois que je veux.",
                "Changeable… ah, une variable !",
                "Car en programmation, une variable c'est exactement ça : une boîte avec un nom,"
                " dans laquelle je range une valeur, et dont je peux changer le contenu quand je veux.",
                "Un sac, c'est une variable : il a un contenu, et ce contenu peut changer.",
            ]),
        ],
    },
    "nom": {
        "titre": "Plusieurs sacs : il faut un nom",
        "segments": [
            ("nom", [
                "Seulement voilà : je possède plusieurs sacs.",
                "Un sac pour chaque étage, un sac pour chaque client :"
                " trois sacs, et trois contenus différents.",
                "Si je dis simplement « le sac », personne ne sait duquel je parle."
                " L'ordinateur, encore moins.",
                "Alors je dois les distinguer. Comment faire ?",
                "Mmmm… ah, voilà : je vais lui donner un nom.",
                "Une étiquette sur le sac : un seul nom, le même dans tout le programme.",
                "Je le nomme S. S, comme sac.",
                "Et maintenant, quand j'écris S, c'est de ce sac-là que je parle."
                " Je m'en servirai jusqu'à la fin.",
            ]),
        ],
    },
    "immeuble": {
        "titre": "L'immeuble et l'ascenseur",
        "segments": [
            ("immeuble", [
                "Je commence. Oh, c'est un immeuble !",
                "Donc je dois utiliser l'ascenseur.",
                "Mais attends, je dois réfléchir un peu.",
                "Que dois-je faire ?",
                "Et que dois-je faire avec chaque client ?",
                "Mmmm.",
            ]),
        ],
    },
    "etage0": {
        "titre": "Étage 0 : le sac reçoit l'étage",
        "segments": [
            ("etage0", [
                "Je prends l'ascenseur, et je mets étage un.",
                "La porte est ouverte : donc je ramasse ce qu'il y a dans l'étage,",
                "et je l'ajoute à mon sac S.",
                "Le nouveau contenu du sac, c'est l'ancien contenu plus ce que j'ai trouvé dans l'étage numéro zéro.",
                "Mmmm… mais pourquoi j'écris toute cette phrase ?",
                "Donc je vais dire : S égal S plus T crochet zéro.",
                "Et oui, ça marche ! Donc je passe à l'étage un.",
            ]),
        ],
    },
    "compteur": {
        "titre": "L'ascenseur compte",
        "segments": [
            ("compteur", [
                "Je prends l'ascenseur et j'avance.",
                "Ah… c'est moi qui avance, ou c'est l'ascenseur qui avance ?",
                "Et oui, c'est l'ascenseur.",
                "Mais il est en train de compter les étages.",
                "Donc on va utiliser un compteur.",
            ]),
        ],
    },
    "repetition": {
        "titre": "Je répète l'opération",
        "segments": [
            ("repetition", [
                "Et ça marche.",
                "Je répète la même opération dans l'étage numéro un.",
                "Attends… j'ai dit : je répète.",
                "La première fois j'ai écrit S égal S plus T crochet zéro.",
                "Et maintenant, S égal S plus T crochet un.",
            ]),
        ],
    },
    "quelquechose": {
        "titre": "Ce quelque chose, c'est le compteur",
        "segments": [
            ("quelquechose", [
                "Attends, ça se répète !",
                "Donc j'écris : S égal S plus T crochet quelque chose.",
                "Mmmm… c'est quoi, alors, ce quelque chose ?",
                "Quand le compteur est à zéro, j'écris zéro.",
                "Et quand il est à un, je mets un.",
                "Et bien voilà : ce quelque chose, c'est bel et bien le compteur.",
            ]),
        ],
    },
    "bloc": {
        "titre": "Le bloc à répéter",
        "segments": [
            ("bloc", [
                "Attends, j'écris le bloc.",
                "Donc c'est : S égal S plus T crochet compteur.",
                "Voilà le bloc, tout seul, entre deux accolades.",
            ]),
        ],
    },
    "boucle": {
        "titre": "La boucle Pour, complète",
        "segments": [
            ("boucle", [
                "Et bien c'est vrai. Mais combien de fois je vais répéter ça ?",
                "Et est-ce qu'il y a un risque d'arrêt avant la fin ?",
                "Donc je dois compléter.",
                "Il me faut une structure répétitive, itérative, complète.",
                "C'est-à-dire : je complète à la fin.",
                "Et bien, je l'ai trouvée : c'est la boucle Pour, que je vais engendrer au bloc.",
                "OUI, c'est ça ! Et voilà le résultat.",
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
