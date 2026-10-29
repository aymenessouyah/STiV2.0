"""Texte de la voix off et découpage des sous-titres.

Chaque section correspond à un fichier audio (voix/) et contient une ou
plusieurs séquences visuelles. La durée d'une séquence est proportionnelle au
nombre de caractères de son texte : l'image et la voix restent synchronisées.
"""
from __future__ import annotations

SECTIONS = {
    "intro": {
        "segments": [
            ("intro", [
                "Bienvenue dans cette vidéo consacrée aux 37 Défis de JavaScript, "
                "et plus particulièrement à trois familles : Tableau, Aléas et Captchas, puis Média.",
                "Onze défis, du plus simple au plus difficile.",
                "Pour chacun, l'écran est toujours le même : à gauche l'énoncé, à droite le code "
                "qui s'écrit pas à pas.",
                "Et entre les familles, trois fiches de rappel : les tableaux, l'objet Math, "
                "et les chaînes de caractères.",
                "C'est parti pour le premier défi.",
            ]),
        ],
    },
    "tableau": {
        "segments": [
            ("defi26", [
                "Premier défi, le numéro vingt-six : créer un tableau.",
                "Un tableau, c'est une liste de valeurs rangées dans des cases numérotées. "
                "On l'écrit avec des crochets, et les valeurs sont séparées par des virgules.",
                "Ici, cinq fruits : une pomme, une banane, un raisin, une orange et une fraise.",
                "Attention au piège numéro un : la première case porte l'indice zéro, pas un. "
                "Le premier fruit est donc fruits crochet zéro, et le cinquième est fruits crochet quatre.",
                "La propriété length donne le nombre de cases : cinq.",
                "Un tableau peut aussi partir vide : deux crochets, length vaut zéro, "
                "et on le remplira plus tard.",
            ]),
            ("defi27", [
                "Défi vingt-sept : accéder aux éléments.",
                "Pour lire une case, on met son indice entre crochets : fruits crochet deux "
                "donne le troisième fruit.",
                "Pour la dernière case, on n'écrit pas trois en dur : on écrit "
                "fruits crochet fruits point length moins un. "
                "Ainsi le code continue de fonctionner même si le tableau grandit.",
                "Et si l'indice dépasse la taille ? Pas d'erreur : JavaScript renvoie undefined. "
                "C'est une valeur spéciale qui veut dire : rien.",
                "Pour parcourir tout le tableau, une boucle for classique : i démarre à zéro "
                "et s'arrête à length moins un.",
            ]),
        ],
    },
    "tableau2": {
        "segments": [
            ("defi28", [
                "Défi vingt-huit : ajouter et retirer.",
                "On ajoute à la fin en écrivant dans la case qui suit la dernière : "
                "fruits crochet fruits point length. Puisque length vaut trois, on écrit dans la case trois, "
                "et le tableau passe à quatre cases.",
                "Pour retirer, on réduit tout simplement length de un. La dernière case disparaît, "
                "et le tableau repasse à trois.",
                "push et pop font exactement la même chose, mais en une seule instruction. "
                "Le TP demande la version avec length, parce qu'elle montre ce qui se passe vraiment.",
            ]),
        ],
    },
    "rappel_tableau": {
        "segments": [
            ("rappel_tableau", [
                "Petit arrêt sur les tableaux, parce que c'est la brique de base de tout ce qui suit.",
                "Retenez le schéma : des cases, un indice qui commence à zéro, "
                "une longueur qui donne le nombre de cases.",
                "Pour lire : tab crochet zéro pour la première, tab crochet tab point length moins un "
                "pour la dernière, tab point length pour la taille.",
                "Pour modifier : tab crochet tab point length égal valeur ajoute à la fin ; "
                "tab point length égal tab point length moins un retire la dernière.",
                "Et le piège : un indice hors limites ne plante pas, il renvoie undefined. "
                "C'est souvent la cause d'un affichage vide alors qu'on croyait le tableau rempli.",
                "Maintenant, on passe aux choses sérieuses : le hasard.",
            ]),
        ],
    },
    "rappel_math": {
        "segments": [
            ("rappel_math", [
                "Deuxième rappel, indispensable pour toute la famille Aléas : l'objet Math.",
                "Math point random renvoie un nombre décimal entre zéro inclus et un exclu. "
                "Jamais un, jamais au-delà.",
                "Math point floor arrondit vers le bas : quatre virgule sept donne quatre. "
                "Floor, c'est le plancher.",
                "Math point ceil arrondit vers le haut : quatre virgule un donne cinq. "
                "Ceil, c'est le plafond.",
                "Math point round arrondit au plus proche : quatre virgule cinq donne cinq.",
                "Et voici la formule à connaître par cœur pour tirer un entier entre un minimum "
                "et un maximum : Math point floor de Math point random fois, entre parenthèses, "
                "max moins min plus un, le tout plus min.",
                "Pourquoi plus un ? Pour que le maximum soit possible. Pourquoi plus min ? "
                "Pour décaler la plage.",
            ]),
        ],
    },
    "aleas": {
        "segments": [
            ("defi29", [
                "Défi vingt-neuf : tirer un caractère au hasard dans une chaîne.",
                "Une chaîne, c'est un tableau de caractères déguisé : elle a une longueur, "
                "et chaque caractère a un indice.",
                "On tire donc un indice au hasard : Math point random fois la longueur, "
                "puis Math point floor. Pour Bonjour Tunisie, quinze caractères, "
                "donc un indice de zéro à quatorze.",
                "Puis substring de i à i plus un découpe exactement un caractère.",
                "Au passage : charAt fait la même chose, et la notation entre crochets aussi.",
            ]),
            ("defi30", [
                "Défi trente : les entiers aléatoires.",
                "On applique la formule du rappel, avec min égal un et max égal cent.",
                "Vérifions les bornes : Math point random donne zéro à un exclu. "
                "Multiplié par cent, on obtient zéro à cent exclu. Math point floor donne zéro "
                "à quatre-vingt-dix-neuf. Plus un : un à cent. Le maximum est bien atteignable.",
                "Attention : si vous oubliez le plus un, le maximum ne sortira jamais. "
                "Et si vous remplacez floor par round, les extrémités deviennent deux fois moins probables.",
            ]),
        ],
    },
    "aleas2": {
        "segments": [
            ("defi31", [
                "Défi trente et un : cinq lettres au hasard.",
                "Il faut une autre brique : String point fromCharCode. Cette fonction transforme "
                "un code numérique en caractère. Soixante-cinq, c'est le A majuscule. "
                "Quatre-vingt-dix, c'est le Z.",
                "Donc un tirage entre zéro et vingt-cinq, plus soixante-cinq, donne un code entre "
                "soixante-cinq et quatre-vingt-dix : une lettre majuscule.",
                "On recommence cinq fois, et on ajoute au fur et à mesure dans la variable code. "
                "Le plus égal concatène.",
            ]),
            ("defi32", [
                "Défi trente-deux : une couleur au hasard.",
                "Une couleur en HTML s'écrit avec un dièse et six chiffres hexadécimaux : "
                "deux pour le rouge, deux pour le vert, deux pour le bleu.",
                "Chaque composante va de zéro à deux cent cinquante-cinq. Math point random fois "
                "deux cent cinquante-six, puis Math point floor, donne bien zéro à deux cent cinquante-cinq.",
                "toString de seize convertit ce nombre en hexadécimal : deux cent cinquante-cinq "
                "devient f f.",
                "Piège : un petit nombre donne un seul chiffre. Dix devient a. Il faut donc ajouter "
                "un zéro devant : zéro a. Sinon la couleur n'a plus six chiffres et le navigateur l'ignore.",
                "On assemble les trois composantes, et on obtient par exemple dièse trois F, B zéro, E sept.",
            ]),
        ],
    },
    "rappel_chaine": {
        "segments": [
            ("rappel_chaine", [
                "Troisième rappel : les chaînes de caractères. C'est là que les confusions "
                "coûtent le plus de points.",
                "String point fromCharCode : nombre vers caractère. Soixante-cinq donne A, "
                "quatre-vingt-dix donne Z, quatre-vingt-dix-sept donne a minuscule.",
                "toString : conversion de base. toString de seize transforme un nombre en hexadécimal, "
                "toString de deux en binaire.",
                "toUpperCase et toLowerCase changent la casse.",
                "Et maintenant le point crucial : substring et substr.",
                "substring de début, fin, prend deux indices. Le caractère de fin n'est pas inclus. "
                "Sur Bonjour, substring de un à quatre donne o, n, j : trois caractères.",
                "substr de début, longueur, prend un indice de départ, puis un nombre de caractères. "
                "Sur le même mot, substr de un, quatre donne o, n, j, o : quatre caractères.",
                "Même appel, deux résultats différents. Retenez : substring compte jusqu'à un indice, "
                "substr compte des caractères.",
                "Deuxième différence : si le début dépasse la fin, substring échange les deux bornes, "
                "substr renvoie une chaîne vide.",
                "Enfin, substr est une ancienne fonction, considérée comme obsolète. "
                "Préférez substring ou slice.",
            ]),
        ],
    },
    "captchas": {
        "segments": [
            ("defi33", [
                "Défi trente-trois : le code visuel multicolore.",
                "Le principe : six caractères tirés au hasard dans une réserve de lettres et de chiffres. "
                "On a retiré les caractères ambigus : ni I, ni O, ni zéro, ni un.",
                "On construit d'abord le vrai code, caractère par caractère, avec l'indice aléatoire "
                "dans la chaîne. On le garde dans une variable : c'est lui qui servira à vérifier la saisie.",
                "Ensuite, deuxième boucle : pour chaque caractère, on tire une couleur, et on fabrique "
                "un span avec cette couleur. innerHTML affiche le tout.",
                "Résultat : six caractères, six couleurs, et un code gardé en mémoire que seul le script connaît.",
            ]),
        ],
    },
    "captchas_b": {
        "segments": [
            ("defi34", [
                "Défi trente-quatre : le code barré.",
                "Même génération de code. La différence tient en deux lignes : on calcule un angle, "
                "et on applique une rotation à la barre.",
                "Math point floor de Math point random fois quarante et un donne zéro à quarante. "
                "Moins vingt : de moins vingt à plus vingt degrés.",
                "transform, rotate, et l'angle en degrés. La barre traverse le code, "
                "ce qui rend la lecture automatique beaucoup plus difficile.",
                "Pour vérifier, on compare la saisie au code caché, en majuscules et sans espaces "
                "superflus : trim, puis toUpperCase.",
            ]),
        ],
    },
    "captchas2": {
        "segments": [
            ("defi35", [
                "Défi trente-cinq : la grille de vélos, le plus difficile.",
                "Il faut placer quatre vélos parmi neuf cases, mais de façon aléatoire.",
                "On utilise le mélange de Fisher-Yates : on parcourt le tableau du dernier indice "
                "vers le premier, et pour chaque case on tire un indice au hasard entre zéro et i, "
                "puis on échange les deux cases.",
                "L'échange tient en une ligne grâce à la déstructuration : crochet i, crochet j "
                "égal crochet j, crochet i.",
                "Pourquoi partir de la fin ? Parce que chaque case est tirée une seule fois, "
                "et le mélange est parfaitement équitable.",
                "Ensuite on relève les indices des vélos : une boucle forEach avec la valeur et l'indice. "
                "Ces indices serviront à vérifier que l'utilisateur a bien cliqué sur les quatre vélos, "
                "et seulement sur eux.",
            ]),
        ],
    },
    "media": {
        "segments": [
            ("defi36", [
                "Dernier défi, la famille Média : piloter un lecteur audio.",
                "On récupère la balise audio avec getElementById, comme n'importe quel élément de la page.",
                "audio point play démarre la lecture, audio point pause l'arrête.",
                "Et la propriété paused dit si la lecture est arrêtée : vrai quand c'est en pause, "
                "faux quand ça joue.",
                "Deux autres propriétés bien utiles : volume, entre zéro et un, "
                "et currentTime, la position en secondes.",
                "Le même code fonctionne avec une balise vidéo.",
            ]),
        ],
    },
    "outro": {
        "segments": [
            ("outro", [
                "Récapitulons. Trois familles, onze défis, et trois réflexes.",
                "Les tableaux : des cases, des indices à partir de zéro, length pour la taille.",
                "Le hasard : Math point random pour tirer, Math point floor pour arrondir vers le bas, "
                "et la formule avec plus un et plus min pour un entier entre deux bornes.",
                "Les chaînes : fromCharCode pour transformer un nombre en lettre, toString pour changer de base, "
                "substring pour découper par indices, substr par longueur.",
                "À vous de jouer : ouvrez la page des trente-sept défis, et tapez les onze défis dans l'ordre. "
                "Bon courage !",
            ]),
        ],
    },
}

ORDRE = ["intro", "tableau", "tableau2", "rappel_tableau", "rappel_math", "aleas",
         "aleas2", "rappel_chaine", "captchas", "captchas_b", "captchas2",
         "media", "outro"]


def texte_section(section):
    return " ".join(" ".join(phrases) for _, phrases in SECTIONS[section]["segments"])


def texte_segment(section, cle):
    for nom, phrases in SECTIONS[section]["segments"]:
        if nom == cle:
            return " ".join(phrases)
    return ""


def sous_titres(durees, decalages):
    """Entrées VTT (début, fin, texte) réparties proportionnellement au texte."""
    entrees = []
    for section in ORDRE:
        segments = SECTIONS[section]["segments"]
        total_car = sum(len(" ".join(p)) for _, p in segments) or 1
        t = decalages[section]
        for _, phrases in segments:
            poids = sum(len(p) for p in phrases) or 1
            duree_seg = durees[section] * poids / total_car
            total_phrases = sum(len(p) for p in phrases) or 1
            for phrase in phrases:
                part = duree_seg * len(phrase) / total_phrases
                entrees.append((t, t + part, phrase))
                t += part
    return entrees


def vtt(entrees):
    def h(t):
        ms = int(round(t * 1000))
        s, ms = divmod(ms, 1000)
        m, s = divmod(s, 60)
        return f"{m:02d}:{s:02d}.{ms:03d}"

    lignes = ["WEBVTT", ""]
    for debut, fin, texte in entrees:
        lignes.append(f"{h(debut)} --> {h(fin)}")
        mots, courante, sortie = texte.split(), "", []
        for mot in mots:
            if len(courante) + len(mot) + 1 > 42 and courante:
                sortie.append(courante)
                courante = mot
            else:
                courante = (courante + " " + mot).strip()
        if courante:
            sortie.append(courante)
        lignes.extend(sortie)
        lignes.append("")
    return "\n".join(lignes)
