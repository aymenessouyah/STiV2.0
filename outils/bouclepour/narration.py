"""Texte de la voix off de « Les boucles — Pour, Répéter…jusqu'à, Tant que ».

Capsule de la Série 6 (JavaScript). Elle ne montre plus une seule boucle mais
les **trois**, et surtout **comment choisir**. Le fil conducteur est un
**schéma de décision** affiché en permanence à partir de la quatrième section :

    une répétition
      ├─ est-ce que je connais le nombre de répétitions à l'avance ?
      │    non → boucles conditionnelles (0 à n fois)
      │    oui → est-ce qu'une condition d'arrêt peut me stopper avant la fin ?
      │             non → POUR          (compteur de I à F, FAIRE Bloc)
      │             oui → combien de fois au moins je répète ?
      │                     au moins une fois → RÉPÉTER…JUSQU'À
      │                     risque zéro      → TANT QUE

Les trois exemples, dans le même décor (l'immeuble et le sac) :

* **Pour** : la somme des quatre étages, T = [4, 7, 2, 9] → S = 22 ;
* **Répéter…jusqu'à** : chercher X dans T — X = 7 (trouvé au 2e tour) et
  X = 5 (absent, quatre tours, on sort sur `i > 3`) ;
* **Tant que** : vider la boîte de jetons dans le sac — trois jetons (trois
  tours) et zéro jeton (aucun tour : c'est là que répéter…jusqu'à serait faux).

À droite, **l'algorithme et le JavaScript sont deux cadres séparés** : on écrit
toujours l'algorithme d'abord, on le traduit ensuite. À chaque changement de
boucle, le tableau des trois boucles est rappelé et la branche courante du
schéma est surlignée.
"""
from __future__ import annotations

# L'ordre de lecture et le découpage des sous-titres.
ORDRE = [
    "bienvenue", "probleme", "repetition", "q1", "q2", "q3",
    "pour_algo", "pour_js", "pour_trace", "rappel1",
    "chercher_quoi", "chercher_q", "repet_algo", "repet_js",
    "repet_trouve", "repet_absent", "rappel2",
    "tantque_quoi", "tantque_algo", "tantque_js", "tantque_trace", "rappel3",
    "tableau3", "choisir", "algo_js", "fin",
]

SECTIONS = {
    "bienvenue": {
        "titre": "Bienvenue — l'histoire des boucles",
        "segments": [
            ("bienvenue", [
                "Bienvenue dans STI Version 2.0.",
                "Aujourd'hui, on va détailler encore une autre fois l'histoire des boucles.",
                "On va d'abord poser les bonnes questions, puis voir les trois boucles,"
                " une par une, et surtout apprendre à choisir la bonne.",
            ]),
        ],
    },
    "probleme": {
        "titre": "Le décor et le problème",
        "segments": [
            ("probleme", [
                "Commençons par le décor.",
                "À gauche, l'immeuble : quatre étages, avec quatre nombres.",
                "Au rez-de-chaussée, quatre. Au premier, sept."
                " Au deuxième, deux. Au troisième, neuf.",
                "Rangés dans cet ordre, c'est un tableau : T.",
                "Au milieu, mon brouillon.",
                "Et à droite, ce que j'écris vraiment : l'algorithme en haut,"
                " le JavaScript en bas.",
                "Ce que je veux, c'est la somme de ces quatre nombres,"
                " dans une case que j'appelle S.",
            ]),
        ],
    },
    "repetition": {
        "titre": "Quatre fois le même geste",
        "segments": [
            ("repetition", [
                "Je prends mon brouillon, et je note : S égal S plus T crochet zéro,"
                " puis un, puis deux, puis trois.",
                "Quatre lignes. Et regardez : c'est toujours le même geste.",
                "Seul le chiffre entre les crochets change.",
                "Quand je vois ça, je ne recopie pas :"
                " je me dis qu'il y a une répétition.",
                "Et face à une répétition, je suis obligé de poser une question.",
            ]),
        ],
    },
    "q1": {
        "titre": "Question 1 : connais-je le nombre de répétitions ?",
        "segments": [
            ("q1", [
                "Première question : est-ce que je connais le nombre de répétitions"
                " à l'avance ?",
                "Ici, oui : quatre étages, donc quatre tours.",
                "Si la réponse est non, je ne peux pas compter mes tours :"
                " je dois passer par une boucle conditionnelle, qui s'arrête sur une condition.",
                "Mais ici, je connais le nombre : je continue dans le schéma.",
            ]),
        ],
    },
    "q2": {
        "titre": "Question 2 : une condition d'arrêt ?",
        "segments": [
            ("q2", [
                "Deuxième question : est-ce qu'il y a une condition d'arrêt,"
                " quelque chose qui peut me faire sortir avant la fin ?",
                "Pour la somme, non : je dois aller jusqu'au dernier étage,"
                " sinon ma somme est fausse.",
                "Nombre de tours connu, pas de condition d'arrêt :"
                " c'est exactement le cas de la boucle Pour.",
            ]),
        ],
    },
    "q3": {
        "titre": "Question 3 : au moins une fois ?",
        "segments": [
            ("q3", [
                "Et si, au contraire, il y avait une condition d'arrêt ?",
                "Alors je pose une troisième question : combien de fois, au moins,"
                " je vais répéter ?",
                "Si c'est au moins une fois, j'utilise répéter jusqu'à.",
                "S'il y a un risque de ne jamais répéter, c'est la boucle tant que.",
                "Voilà le schéma complet. Maintenant, les trois boucles.",
            ]),
        ],
    },
    "pour_algo": {
        "titre": "La boucle Pour — algorithme",
        "segments": [
            ("pour_algo", [
                "La boucle Pour, en algorithme.",
                "J'écris : Pour compteur, de zéro à trois, faire.",
                "S égal S plus T crochet compteur. Fin Pour.",
                "Décomposons. Le compteur démarre à la position initiale, zéro.",
                "Il s'arrête à la position finale, trois.",
                "Et entre les deux, faire le bloc.",
                "Le bloc, c'est la seule ligne que j'ai écrite quatre fois tout à l'heure.",
            ]),
        ],
    },
    "pour_js": {
        "titre": "La boucle Pour — JavaScript",
        "segments": [
            ("pour_js", [
                "Maintenant, la même boucle, en JavaScript.",
                "En bas, à droite : for, entre parenthèses, let i égal zéro,"
                " point-virgule, i plus petit ou égal à trois, point-virgule, i plus plus.",
                "Entre accolades : S égal S plus T crochet i.",
                "C'est la traduction, mot pour mot, de l'algorithme. Le compteur, c'est i.",
            ]),
        ],
    },
    "pour_trace": {
        "titre": "La boucle Pour — les quatre tours",
        "segments": [
            ("pour_trace", [
                "Exécutons.",
                "Premier tour : i vaut zéro, j'ajoute quatre, S vaut quatre.",
                "Deuxième tour : i vaut un, j'ajoute sept, onze.",
                "Troisième : i vaut deux, j'ajoute deux, treize.",
                "Quatrième : i vaut trois, j'ajoute neuf, vingt-deux.",
                "Quatre tours, et la boucle s'arrête : i vaut quatre, la condition est fausse.",
            ]),
        ],
    },
    "rappel1": {
        "titre": "Rappel : le tableau des trois boucles",
        "segments": [
            ("rappel1", [
                "Rappel : trois boucles, un seul schéma.",
                "Pour : je connais le nombre de répétitions, et aucune condition ne m'arrête.",
                "Le compteur va de la position initiale à la position finale, et je fais le bloc.",
                "Retenez la question : est-ce que je connais le nombre de répétitions"
                " à l'avance ?",
            ]),
        ],
    },
    "chercher_quoi": {
        "titre": "Chercher X : un nombre de tours inconnu",
        "segments": [
            ("chercher_quoi", [
                "Nouveau problème : je cherche une valeur X dans le tableau.",
                "Est-ce que je connais le nombre de tours à l'avance ? Non :"
                " ça dépend où est X.",
                "S'il est au premier étage, je m'arrête tout de suite.",
                "S'il est au dernier, je fais tout l'immeuble.",
                "Et s'il n'est pas là, je visite tout pour rien.",
                "Donc : nombre de tours inconnu.",
            ]),
        ],
    },
    "chercher_q": {
        "titre": "Chercher X : au moins une fois",
        "segments": [
            ("chercher_q", [
                "Mais il y a une condition d'arrêt : dès que je trouve X, je m'arrête.",
                "Alors je pose la troisième question : combien de fois, au moins,"
                " je répète ?",
                "Au moins une fois : je dois tester au moins une case,"
                " sinon je ne peux pas savoir.",
                "Au moins une fois, donc : répéter jusqu'à.",
                "Regardez le schéma : c'est cette branche.",
            ]),
        ],
    },
    "repet_algo": {
        "titre": "Répéter…jusqu'à — algorithme",
        "segments": [
            ("repet_algo", [
                "Algorithme. Je me place sur la première case : i égal zéro.",
                "Répéter : prendre la valeur T crochet i.",
                "Si c'est X, j'arrête : j'ai trouvé.",
                "Sinon, je passe à la case suivante.",
                "Jusqu'à : trouvé, ou i dépasse la dernière case.",
                "Deux façons de sortir : la valeur est trouvée,"
                " ou j'ai fini le tableau sans la trouver.",
            ]),
        ],
    },
    "repet_js": {
        "titre": "Répéter…jusqu'à — JavaScript",
        "segments": [
            ("repet_js", [
                "En JavaScript : do, entre accolades, le corps.",
                "Puis while, entre parenthèses : trouvé est faux, et i inférieur à quatre.",
                "Le corps s'exécute avant le test : c'est ça, répéter jusqu'à.",
                "On entre toujours au moins une fois dans la boucle.",
                "Et si on ne l'a pas trouvée, on sort et on affiche : absente.",
            ]),
        ],
    },
    "repet_trouve": {
        "titre": "X = 7 : trouvé au deuxième tour",
        "segments": [
            ("repet_trouve", [
                "Cherchons sept.",
                "Tour un : T crochet zéro vaut quatre. Ce n'est pas sept.",
                "Tour deux : T crochet un vaut sept. C'est sept :"
                " trouvé passe à vrai, et on sort.",
                "Deux tours seulement.",
                "La condition d'arrêt a fait son travail avant la fin du tableau.",
            ]),
        ],
    },
    "repet_absent": {
        "titre": "X = 5 : absent, quatre tours",
        "segments": [
            ("repet_absent", [
                "Cherchons cinq. Cinq n'est nulle part.",
                "Tour un : quatre. Tour deux : sept. Tour trois : deux. Tour quatre : neuf.",
                "Jamais trouvé.",
                "i vaut quatre : la deuxième condition est vraie, on sort.",
                "Et là, le résultat, c'est : absent.",
                "Attention : sans le test i plus petit que quatre,"
                " la boucle continuerait au-delà du tableau.",
            ]),
        ],
    },
    "rappel2": {
        "titre": "Rappel : répéter…jusqu'à",
        "segments": [
            ("rappel2", [
                "Rappel. Répéter jusqu'à : le nombre de tours n'est pas connu,"
                " il y a une condition d'arrêt, et je répète au moins une fois.",
                "Le test se fait après le bloc.",
                "Dans le tableau : boucle avec condition, au moins un tour garanti.",
            ]),
        ],
    },
    "tantque_quoi": {
        "titre": "Tant que : le risque de zéro tour",
        "segments": [
            ("tantque_quoi", [
                "Dernier cas. J'ai une boîte de jetons, et je veux les mettre dans le sac,"
                " un par un, tant qu'il en reste.",
                "Est-ce que je connais le nombre de tours ? Non,"
                " il dépend du contenu de la boîte.",
                "Est-ce qu'il y a une condition d'arrêt ? Oui : la boîte vide.",
                "Et combien de fois au moins ? Là, ça peut être zéro :"
                " si la boîte est vide au départ, je ne fais aucun tour.",
            ]),
        ],
    },
    "tantque_algo": {
        "titre": "Tant que — algorithme",
        "segments": [
            ("tantque_algo", [
                "Donc : tant que la boîte n'est pas vide, faire.",
                "Prendre un jeton. Le mettre dans le sac. Fin tant que.",
                "Le test est avant le bloc : si la boîte est vide dès le départ,"
                " on ne rentre pas dans la boucle.",
                "C'est exactement ce que je veux ici : aucun jeton à prendre,"
                " aucun tour.",
            ]),
        ],
    },
    "tantque_js": {
        "titre": "Tant que — JavaScript",
        "segments": [
            ("tantque_js", [
                "En JavaScript : while, entre parenthèses, jetons supérieur à zéro.",
                "Entre accolades : prendre un jeton, le mettre dans le sac,"
                " et décrémenter le compteur de jetons.",
                "Tant que la condition est vraie, on répète.",
                "Dès qu'elle est fausse, on sort.",
            ]),
        ],
    },
    "tantque_trace": {
        "titre": "Tant que — trois jetons, puis zéro",
        "segments": [
            ("tantque_trace", [
                "Avec trois jetons : trois tours, la boîte se vide, le sac se remplit,"
                " et on sort quand jetons vaut zéro.",
                "Avec zéro jeton : la condition est fausse tout de suite, zéro tour.",
                "Comparez avec répéter jusqu'à : là, on serait entré au moins une fois,"
                " et on aurait pris un jeton qui n'existe pas.",
            ]),
        ],
    },
    "rappel3": {
        "titre": "Rappel : tant que",
        "segments": [
            ("rappel3", [
                "Rappel. Tant que : nombre de tours inconnu, condition d'arrêt,"
                " et risque de zéro tour.",
                "Le test se fait avant le bloc.",
                "C'est la boucle la plus prudente : elle peut ne rien faire du tout.",
            ]),
        ],
    },
    "tableau3": {
        "titre": "Le tableau des trois boucles",
        "segments": [
            ("tableau3", [
                "Le tableau des trois boucles.",
                "Pour : nombre de tours connu, pas de condition d'arrêt, test avant,"
                " le compteur va de la position initiale à la position finale.",
                "Répéter jusqu'à : nombre inconnu, condition d'arrêt, test après,"
                " au moins un tour.",
                "Tant que : nombre inconnu, condition d'arrêt, test avant,"
                " zéro tour possible.",
                "Trois boucles, trois situations.",
            ]),
        ],
    },
    "choisir": {
        "titre": "Comment choisir",
        "segments": [
            ("choisir", [
                "Et pour choisir, une seule chose à faire : poser les questions,"
                " dans l'ordre.",
                "Est-ce que je connais le nombre de répétitions ?",
                "Oui, et rien ne m'arrête : Pour.",
                "Oui, mais une condition peut m'arrêter :"
                " répéter jusqu'à si au moins un tour, tant que sinon.",
                "Non : boucle conditionnelle, et je regarde si le premier tour est garanti.",
                "C'est tout.",
            ]),
        ],
    },
    "algo_js": {
        "titre": "Algorithme et JavaScript : ne pas mélanger",
        "segments": [
            ("algo_js", [
                "Une dernière chose : ne mélangez pas les deux écritures.",
                "À droite, en haut, l'algorithme : Pour, Répéter jusqu'à, Tant que,"
                " en français.",
                "En bas, le JavaScript : for, do while, while.",
                "Même logique, deux langages.",
                "On écrit l'algorithme d'abord, on le traduit ensuite.",
            ]),
        ],
    },
    "fin": {
        "titre": "À vous de jouer",
        "segments": [
            ("fin", [
                "Voilà. Trois boucles, un schéma, et une question à se poser"
                " à chaque fois : est-ce que je connais le nombre de répétitions"
                " à l'avance ?",
                "Si oui, est-ce qu'une condition m'arrête ? Et au moins une fois ?",
                "Vous avez maintenant la méthode.",
                "À vous de jouer, dans STI Version 2.0.",
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
