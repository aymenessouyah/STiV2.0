"""Texte de la voix off de « La boucle Pour — de la variable à la boucle ».

La capsule se lit sur **trois colonnes**, toujours les mêmes :

  * à gauche **l'immeuble** (et son ascenseur) ;
  * au milieu **le brouillon** : ce que je note à la main, et où je reviens
    avec le stylo rouge ;
  * à droite **l'algo · le code** : ce que j'écris vraiment.

Le cheminement suit exactement celui dicté :

 1. le problème : quatre étages, le tableau T, la somme cherchée dans S ;
 2. la variable : un nom fixe, un contenu qui change ;
 3. le nom : plusieurs sacs, « lequel ? », l'étiquette S ;
 4. `S = S + …` : lire, ajouter, réécrire ;
 5. l'immeuble et l'ascenseur : le même geste à chaque étage ;
 6. étage 0, sur le brouillon : `S = S + T[0]` ;
 7. étage 1, 2, 3 : quatre lignes, seul le chiffre entre crochets change ;
 8. **passage à l'algo** : `S = S + T[quelque chose]` ;
 9. **retour au brouillon, stylo rouge** : « compteur », et les cercles
    autour du 0 et du 1 entre les crochets ;
10. **la question principale** : est-ce que je connais dès le départ le nombre
    de répétitions ? Oui ⇒ je dois compléter la fin ⇒ la boucle Pour ;
11. **engendrer le bloc** par la boucle Pour, et expliquer pourquoi on y écrit
    le compteur dans les crochets.
"""
from __future__ import annotations

# L'ordre de lecture et le découpage des sous-titres.
ORDRE = ["probleme", "variable", "nom", "accumuler", "immeuble",
         "etage0", "repetition", "quelquechose", "compteur", "pourquoi", "boucle"]

SECTIONS = {
    "probleme": {
        "titre": "Le problème et le plan de travail",
        "segments": [
            ("probleme", [
                "Voilà mon plan de travail.",
                "À gauche, l'immeuble. Au milieu, mon brouillon."
                " Et à droite, ce que j'écris vraiment : l'algorithme, puis le code.",
                "Commençons par l'immeuble : quatre étages.",
                "Au rez-de-chaussée, il y a quatre. Au premier, sept."
                " Au deuxième, deux. Et au troisième, neuf.",
                "Quatre nombres, rangés dans cet ordre : c'est un tableau."
                " Et ce tableau, je l'appelle T.",
                "Ce que je veux, c'est la somme de ces quatre nombres.",
                "Et je veux ranger le résultat dans une case que j'appelle S.",
                "S égal T crochet zéro, plus T crochet un, plus T crochet deux,"
                " plus T crochet trois.",
                "La question, c'est : comment je vais m'y prendre ?",
            ]),
        ],
    },
    "variable": {
        "titre": "Une variable : un nom, un contenu qui change",
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
                "Et tout ça, je le note au brouillon : la valeur d'avant,"
                " et la valeur d'aujourd'hui.",
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
                "Et maintenant, quand j'écris S dans mon algorithme,"
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
        "titre": "Étage 0, sur le brouillon : S = S + T[0]",
        "segments": [
            ("etage0", [
                "Allons-y. Étage zéro.",
                "La porte s'ouvre : la case T crochet zéro contient quatre.",
                "Je prends mon brouillon, et je note le premier tour.",
                "Le sac vaut zéro : j'ajoute quatre, et j'écris quatre.",
                "Donc, sur le brouillon : S égal S plus T crochet zéro.",
                "Le sac contient quatre. Je peux monter.",
            ]),
        ],
    },
    "repetition": {
        "titre": "Étages 1, 2, 3 : seul le chiffre change",
        "segments": [
            ("repetition", [
                "Étage un. Sept. S égal S plus T crochet un : onze.",
                "Étage deux : deux. Treize.",
                "Étage trois : neuf. Vingt-deux.",
                "Et maintenant, regardez mon brouillon.",
                "Quatre lignes. Quatre fois la même chose.",
                "Seul le chiffre entre les crochets a changé : zéro, un, deux, trois.",
            ]),
        ],
    },
    "quelquechose": {
        "titre": "Passage à l'algo : T[quelque chose]",
        "segments": [
            ("quelquechose", [
                "Alors je quitte le brouillon, et je passe à l'algorithme.",
                "Puisque seul le chiffre entre les crochets change,"
                " je n'écris plus de chiffre : j'écris quelque chose.",
                "S égal S plus T crochet quelque chose.",
                "Voilà le geste écrit une seule fois,"
                " et qui vaut pour n'importe quel étage.",
                "En JavaScript, cette même ligne s'écrit : S égal S plus T crochet i.",
            ]),
        ],
    },
    "compteur": {
        "titre": "Retour au brouillon, stylo rouge : le compteur",
        "segments": [
            ("compteur", [
                "Mais revenons au brouillon. Cette fois, avec le stylo rouge.",
                "Dans S plus T crochet zéro, il y a zéro.",
                "Dans S plus T crochet un, il y a un.",
                "Dans les deux suivantes, deux, puis trois.",
                "Zéro, un, deux, trois : c'est une suite, et elle monte toute seule.",
                "Qui la fait monter ? Le compteur de l'ascenseur.",
                "Alors j'écris en rouge : compteur.",
                "Et j'entoure les deux chiffres, parce que c'est exactement la même chose.",
            ]),
        ],
    },
    "pourquoi": {
        "titre": "La question principale : combien de répétitions ?",
        "segments": [
            ("pourquoi", [
                "À partir de ce moment, je remarque quelque chose d'important.",
                "Ce qui est entre les crochets est changeable,"
                " exactement comme le pas du compteur.",
                "Donc il y a une boucle, et il y a un compteur.",
                "Alors je me pose la question principale :"
                " est-ce que je connais, dès le départ, le nombre de répétitions ?",
                "Ici, oui : quatre étages, donc quatre tours.",
                "Et si je connais le nombre de tours, je dois compléter la fin :"
                " dire où je commence, et dire quand je m'arrête.",
                "Une structure répétitive, mais complète.",
                "C'est exactement ça, la boucle Pour.",
            ]),
        ],
    },
    "boucle": {
        "titre": "La boucle Pour : engendrer le bloc",
        "segments": [
            ("boucle", [
                "Il ne me reste qu'à engendrer le bloc.",
                "Je prends mon algorithme, S égal S plus T crochet quelque chose,"
                " et je l'entoure.",
                "Pour compteur de zéro à n moins un, faire le bloc. Fin Pour.",
                "Et maintenant, la question : pourquoi j'écris compteur dans les crochets ?",
                "Parce que c'est lui qui change à chaque tour.",
                "Premier tour : zéro, donc T crochet zéro, quatre.",
                "Deuxième tour : un, sept. Troisième : deux, deux. Quatrième : trois, neuf.",
                "Puis le compteur atteint quatre, et la boucle s'arrête.",
                "Dans le sac, à la fin : vingt-deux.",
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
