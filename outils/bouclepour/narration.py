"""Texte de la voix off de « Les boucles — Pour, Répéter…jusqu'à, Tant que ».

Capsule de la Série 6 (JavaScript). Elle montre les **trois** boucles et,
surtout, **comment choisir**. Le fil conducteur est un **schéma de décision** :

    une répétition
      ├─ Q1 : est-ce que je connais le nombre de répétitions à l'avance ?
      │    non → boucle conditionnelle (0 à n fois)
      │    oui → Q2 : est-ce qu'une condition d'arrêt peut m'arrêter avant la fin ?
      │             non → POUR            compteur de I à F, FAIRE le bloc
      │             oui → Q3 : combien de fois, au moins, je répète ?
      │                     au moins une fois → RÉPÉTER…JUSQU'À
      │                     risque zéro      → TANT QUE

La capsule a une vraie entrée et une vraie sortie :

* `ouverture` et `introduction` expliquent **ce qu'est une boucle** et
  **pourquoi** il en faut une — c'est le sujet annoncé par le titre ;
* `bilan`, `conclusion` et `generique` referment la capsule : les trois blocs
  côte à côte, la méthode, puis la carte de fin.

Les noms sont fixés une fois pour toutes et ne changent plus d'une partie à
l'autre :

* **S** = la **somme** des étages, et rien d'autre (partie POUR) ;
* **compteur** en algorithme / **i** en JavaScript = l'indice de tour (POUR) ;
* **i** et **trouvé** = l'indice et le drapeau de la recherche (RÉPÉTER) ;
* **jetons** = ce qui reste dans la boîte, **n** = ce qui est déjà dans le sac
  (TANT QUE). Le sac ne s'appelle jamais S.

Les trois exemples, dans le même décor (l'immeuble, l'ascenseur, le sac) :

* **POUR** : la somme des quatre étages, T = [4, 7, 2, 9] → S = 22 ;
* **RÉPÉTER…JUSQU'À** : chercher X dans T — X = 7 (trouvé au 2e tour) et
  X = 5 (absent, quatre tours, on sort sur `i > 3`) ;
* **TANT QUE** : vider la boîte de jetons dans le sac — trois jetons (trois
  tours) et zéro jeton (aucun tour : c'est là que répéter…jusqu'à serait faux).

À droite, **l'algorithme et le JavaScript sont deux cadres séparés** : on écrit
toujours l'algorithme d'abord, on le traduit ensuite.
"""
from __future__ import annotations

# L'ordre de lecture ; il sert aussi à numéroter les chapitres.
ORDRE = [
    "ouverture", "introduction", "probleme",
    "immeuble", "ascenseur", "scalaire",
    "repetition",
    "q1", "q2", "q3",
    "engendrer",
    "pour_algo", "pour_js", "pour_trace", "rappel1",
    "chercher_quoi", "chercher_q", "repet_algo", "repet_js",
    "repet_trouve", "repet_absent", "rappel2",
    "tantque_quoi", "tantque_algo", "tantque_js", "tantque_trace", "rappel3",
    "tableau3", "choisir", "algo_js",
    "bilan", "conclusion", "generique",
]

SECTIONS = {
    "ouverture": {
        "titre": "Bienvenue — les boucles",
        "segments": [
            ("ouverture", [
                "Bienvenue dans STI Version 2.0.",
                "Aujourd'hui, on va détailler encore une autre fois l'histoire des boucles.",
                "Une boucle, c'est une instruction qui fait répéter un bloc d'instructions.",
                "Et en JavaScript, il n'y a pas une boucle : il y en a trois.",
                "La boucle Pour, la boucle Répéter jusqu'à, et la boucle Tant que.",
                "Trois boucles, trois façons de répéter, et une seule question à se poser",
                " pour choisir la bonne.",
            ]),
        ],
    },
    "introduction": {
        "titre": "Ce qu'est une boucle, et pourquoi",
        "segments": [
            ("introduction", [
                "Prenons le temps de la définir, cette boucle.",
                "Imaginez que je doive additionner quatre nombres : j'écris quatre lignes.",
                "Quatre. Mais s'il y en avait cent ? Cent lignes, recopiées à la main,",
                " avec une faute au bout du troisième.",
                "Une boucle, c'est exactement l'inverse : j'écris le bloc une seule fois,",
                " et je dis au programme : répète-le.",
                "Le bloc ne change pas. Ce qui change, c'est le nombre de tours,",
                " et la condition qui décide de continuer ou de s'arrêter.",
                "Une boucle, c'est donc trois choses : un bloc, des tours, une condition.",
                " Et le schéma de décision, c'est ce qui me dit laquelle des trois choisir.",
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
    "immeuble": {
        "titre": "L'immeuble a un nom : T",
        "segments": [
            ("immeuble", [
                "Regardons cet immeuble de plus près, parce que c'est lui qui va tout expliquer.",
                "Il contient plusieurs éléments — ici quatre nombres — et son contenu peut changer :",
                " demain, ce sera peut-être huit, quinze, trois et six.",
                "Comme le contenu est variable, je ne peux pas nommer l'immeuble par son contenu.",
                "Alors je lui donne un nom, un seul : T.",
                "L'immeuble s'appelle T, et chacun de ses étages contient un nombre.",
                "Deux immeubles différents peuvent porter le même nom T :",
                " ce qui compte, c'est ce qu'il y a dedans au moment où je regarde.",
            ]),
        ],
    },
    "ascenseur": {
        "titre": "L'ascenseur, et les crochets",
        "segments": [
            ("ascenseur", [
                "Maintenant, comment est-ce que je monte à un étage ?",
                "À pied, ce serait long, et surtout je ne saurais pas où je suis.",
                "Alors je prends l'ascenseur.",
                "L'ascenseur, c'est la cabine carrée : les crochets.",
                "Les crochets, c'est la cabine ; et le nombre écrit entre les crochets,",
                " c'est l'étage où elle s'arrête.",
                "Quand j'écris T crochet zéro, je raconte exactement ceci :",
                " je suis dans l'immeuble T, j'ai pris l'ascenseur, il s'arrête à l'étage zéro.",
                "Et je ne peux voir le contenu de cet étage que lorsque les portes s'ouvrent.",
                "Portes fermées, je n'ai rien ; portes ouvertes, j'ai la valeur.",
                "Voilà pourquoi on écrit T crochet i : je suis dans T, l'ascenseur s'arrête",
                " à l'étage i, et les portes s'ouvrent sur T crochet i.",
            ]),
        ],
    },
    "scalaire": {
        "titre": "L'ascenseur compte tout seul",
        "segments": [
            ("scalaire", [
                "Une dernière chose sur cet ascenseur : il a un compteur automatique.",
                "Je lui indique l'étage un ; il sait déjà que le suivant, c'est deux.",
                "Je n'ai pas besoin de lui expliquer l'ordre : il le connaît.",
                "On dit alors que l'ascenseur est d'un type scalaire.",
                "Un type scalaire, c'est tout type qui possède un successeur et un prédécesseur :",
                " l'entier, par exemple, ou le caractère.",
                "Trois a pour successeur quatre, et pour prédécesseur deux.",
                "C'est ce qui me permettra d'écrire i plus un :",
                " l'ascenseur saura tout seul que, après un, on trouve deux.",
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
        "titre": "Question 1 : le nombre de répétitions",
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
        "titre": "Question 2 : une condition d'arrêt",
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
        "titre": "Question 3 : au moins une fois",
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
    "engendrer": {
        "titre": "Du brouillon à la boucle : engendrer",
        "segments": [
            ("engendrer", [
                "Alors je rassemble tout ce que j'ai au brouillon.",
                "J'ai quatre lignes, et dans ces quatre lignes une seule chose change :",
                " le chiffre écrit entre les crochets.",
                "Je peux donc les écrire d'un coup, en laissant un trou à la place du chiffre :",
                " S égal S plus T crochet quelque chose.",
                "Ce quelque chose, c'est justement ce que la boucle va remplacer.",
                "Le point de départ, le point d'arrivée, et le passage d'un étage au suivant :",
                " c'est le compteur qui s'en occupe.",
                "J'écris donc une seule fois S égal S plus T crochet quelque chose,",
                " et la boucle Pour l'engendre : elle le fabrique quatre fois,",
                " avec les quatre bons étages.",
                "C'est le mot à retenir : j'engendre les quatre lignes à partir d'une seule.",
            ]),
        ],
    },
    "pour_algo": {
        "titre": "La boucle Pour — algorithme",
        "segments": [
            ("pour_algo", [
                "La boucle Pour, maintenant, en algorithme.",
                "J'écris : Pour compteur, de zéro à trois, faire.",
                "S égal S plus T crochet compteur. Fin Pour.",
                "Décomposons. Le compteur démarre à la position initiale, zéro.",
                "Il s'arrête à la position finale, trois — le dernier étage de l'immeuble,",
                " c'est-à-dire la hauteur moins un.",
                "Et entre les deux : faire le bloc.",
                "Le bloc, c'est la ligne engendrée, S égal S plus T crochet compteur :",
                " le trou a été rempli par le compteur.",
                "Une seule ligne écrite, et les quatre étages visités.",
            ]),
        ],
    },
    "pour_js": {
        "titre": "La boucle Pour — JavaScript",
        "segments": [
            ("pour_js", [
                "Une fois la boucle Pour comprise au brouillon et en algorithme,",
                " je passe à la même boucle, en JavaScript.",
                "En bas, à droite : for, entre parenthèses, let i égal zéro, point-virgule,"
                " i plus petit que T point length, point-virgule, i plus plus.",
                "Trois morceaux entre les parenthèses, et chacun a son rôle.",
                "i égal zéro : c'est la condition de départ —"
                " l'ascenseur démarre au rez-de-chaussée.",
                "i plus petit que T point length : c'est la condition de continuité.",
                "T point length, c'est la hauteur de l'immeuble : quatre étages.",
                "Tant que i reste plus petit que quatre, je continue.",
                "Et i plus plus : c'est l'avancement du pas.",
                "i plus plus, c'est exactement i égal i plus un : l'ascenseur monte d'un étage,",
                " et il sait tout seul que, après un, on trouve deux.",
                "Entre accolades : S égal S plus T crochet i.",
                "C'est la traduction, mot pour mot, de l'algorithme : le compteur, c'est i.",
            ]),
        ],
    },
    "pour_trace": {
        "titre": "La boucle Pour — les quatre tours",
        "segments": [
            ("pour_trace", [
                "Exécutons, étage par étage.",
                "Premier tour : i vaut zéro, l'ascenseur ouvre sur quatre,"
                " j'ajoute quatre, S vaut quatre.",
                "Deuxième tour : i vaut un, l'ascenseur ouvre sur sept, j'ajoute sept, onze.",
                "Troisième : i vaut deux, j'ajoute deux, treize.",
                "Quatrième : i vaut trois, j'ajoute neuf, vingt-deux.",
                "Quatre tours, et les quatre étages sont visités.",
                "Ensuite i passe à quatre, et quatre n'est pas plus petit que quatre :",
                " la condition de continuité est fausse, la boucle s'arrête.",
            ]),
        ],
    },
    "rappel1": {
        "titre": "Rappel : où se place Pour",
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
        "titre": "Rappel : où se place Répéter…jusqu'à",
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
                "Prendre un jeton. Le mettre dans le sac, et ajouter un au compteur n,",
                " le nombre de jetons qui sont dans le sac. Fin tant que.",
                "Le test est avant le bloc : si la boîte est vide dès le départ,",
                " on ne rentre pas dans la boucle.",
                "C'est exactement ce que je veux ici : aucun jeton à prendre,"
                " aucun tour, et n reste à zéro.",
            ]),
        ],
    },
    "tantque_js": {
        "titre": "Tant que — JavaScript",
        "segments": [
            ("tantque_js", [
                "En JavaScript : while, entre parenthèses, jetons supérieur à zéro.",
                "Entre accolades : jetons moins moins, pour en sortir un de la boîte,",
                " et n plus plus, pour en compter un de plus dans le sac.",
                "Tant que la condition est vraie, on répète.",
                "Dès qu'elle est fausse, on sort.",
            ]),
        ],
    },
    "tantque_trace": {
        "titre": "Tant que — trois jetons, puis zéro",
        "segments": [
            ("tantque_trace", [
                "Avec trois jetons : trois tours, la boîte se vide, le sac se remplit,",
                " n vaut trois, et on sort quand jetons vaut zéro.",
                "Avec zéro jeton : la condition est fausse tout de suite,",
                " zéro tour, et le sac reste vide : n vaut zéro.",
                "Comparez avec répéter jusqu'à : là, on serait entré au moins une fois,",
                " et on aurait pris un jeton qui n'existe pas.",
            ]),
        ],
    },
    "rappel3": {
        "titre": "Rappel : où se place Tant que",
        "segments": [
            ("rappel3", [
                "Rappel. Tant que : nombre de tours inconnu, condition d'arrêt,",
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
                "Et pour choisir, une seule chose à faire : poser les questions,",
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
    "bilan": {
        "titre": "Les trois blocs côte à côte",
        "segments": [
            ("bilan", [
                "Voilà les trois blocs côte à côte.",
                "À gauche, Pour : je connais le nombre de tours, rien ne m'arrête,",
                " le compteur va de la position initiale à la position finale.",
                "Au milieu, Répéter jusqu'à : le nombre est inconnu, une condition m'arrête,",
                " et je répète au moins une fois.",
                "À droite, Tant que : le nombre est inconnu, une condition m'arrête,",
                " mais je peux ne pas répéter du tout.",
                "Trois boucles, trois situations, et le même schéma pour choisir.",
            ]),
        ],
    },
    "conclusion": {
        "titre": "La méthode, en trois questions",
        "segments": [
            ("conclusion", [
                "La méthode tient en trois questions, et elles se posent toujours dans cet ordre.",
                "Un : est-ce que je connais le nombre de répétitions à l'avance ?",
                "Deux : est-ce qu'une condition peut m'arrêter avant la fin ?",
                "Trois : combien de fois, au moins, est-ce que je répète ?",
                "Avec ces trois réponses, vous ne vous tromperez plus de boucle.",
            ]),
        ],
    },
    "generique": {
        "titre": "À vous de jouer",
        "segments": [
            ("generique", [
                "Voilà. Trois boucles, un schéma, et cette question à se poser"
                " à chaque fois.",
                "À vous de jouer, dans STI Version 2.0.",
                "Série 6, les boucles. À bientôt.",
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
