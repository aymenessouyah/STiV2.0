"""Texte de la voix off de « Recharge Véhicule électrique — les pages PHP ».

Capsule de correction du sujet « Similaire Bac Pratique » Recharge Véhicule
électrique (site ChargeTN, 4ᵉ SI). Elle suit le même principe que la capsule
Bibliothèque « correction de liste.php », mais elle traverse les quatre
fichiers PHP du corrigé :

* `connexion.php` — le ticket d'entrée commun ;
* `ajout.php` — recevoir un formulaire POST, contrôler, insérer ;
* `liste.php` — filtrer en GET, afficher, compter et calculer ;
* `detail.php` — recevoir un identifiant, afficher une fiche et son historique.

Les textes sont écrits pour être prononcés : les symboles sont nommés
(« dollar », « crochet », « point d'interrogation ») et chaque section reste
sous la limite d'un clip de synthèse vocale (1 500 caractères).
"""
from __future__ import annotations

# L'ordre de lecture ; il sert aussi à numéroter les chapitres.
ORDRE = [
    "ouverture", "connexion", "ajout_controles", "ajout_insertion",
    "liste_filtres", "liste_tableau", "liste_statistiques",
    "detail_borne", "detail_recharges", "bilan",
]

SECTIONS = {
    "ouverture": {
        "titre": "Bienvenue — le trajet complet des données",
        "fichier": "ChargeTN",
        "segments": [("ouverture", [
            "Bienvenue dans STI Version 2.0.",
            "Aujourd'hui, nous corrigeons toutes les pages PHP du sujet Recharge Véhicule électrique, le site ChargeTN.",
            "Dans la capsule Bibliothèque, nous avions suivi une seule page, liste.php.",
            "Ici, nous suivons tout le trajet des données : connexion.php ouvre la porte de la base recharge ;",
            " ajout.php reçoit le formulaire et insère une recharge ;",
            " liste.php lit les bornes, filtre par type et calcule des statistiques ;",
            " detail.php reçoit un identifiant dans l'adresse et affiche une borne avec son historique.",
            "À gauche, la méthode et les pièges ; à droite, le code du corrigé, révélé ligne par ligne.",
            "Gardez une règle sous les yeux : une page PHP mélange trois temps.",
            "D'abord le traitement serveur, ensuite la construction de la réponse HTML,",
            " et souvent une boucle qui transforme chaque ligne SQL en morceau de page.",
            "Si vous savez repérer ces trois temps, le code devient beaucoup plus facile à écrire le jour du Bac.",
        ])],
    },
    "connexion": {
        "titre": "connexion.php — le ticket d'entrée commun",
        "fichier": "connexion.php",
        "segments": [("connexion", [
            "Commençons par le plus petit fichier, connexion.php, parce qu'il sert à toutes les pages.",
            "Première ligne, date default timezone set avec Africa slash Tunis : on fixe le fuseau horaire de Tunis.",
            "Sans cela, les dates et les heures pourraient dépendre du serveur,",
            " et les calculs d'ancienneté de detail.php seraient décalés.",
            "Deuxième instruction : dollar cnx reçoit mysqli connect, avec localhost, root, un mot de passe vide, puis le nom de la base, recharge.",
            "Retenez l'ordre : serveur, utilisateur, mot de passe, base.",
            "La variable dollar cnx est le ticket d'entrée ; chaque mysqli query recevra ce ticket en premier argument.",
            "Troisième instruction : SET NAMES utf8mb4 impose l'encodage des échanges.",
            "Les accents de ville, libellé ou immatriculation ne seront pas abîmés entre PHP et MariaDB.",
            "Ce fichier ne produit aucun affichage : il prépare seulement le travail.",
            "C'est pour cela que les autres pages commencent par include de connexion.php.",
            "Au Bac, écrivez-le une fois, proprement, puis incluez-le partout.",
        ])],
    },
    "ajout_controles": {
        "titre": "ajout.php — recevoir le formulaire et contrôler la date",
        "fichier": "ajout.php",
        "segments": [("ajout_controles", [
            "Passons à ajout.php. Avant même le HTML, le PHP traite le formulaire.",
            "La page s'inclut elle-même : le formulaire envoie en POST vers ajout.php.",
            "Le garde d'entrée est isset de dollar underscore POST, crochet ok.",
            "Tant que le bouton Enregistrer n'a pas été soumis, on prépare seulement la page.",
            "Dès qu'il est cliqué, on récupère jour, mois et année.",
            "Le transtypage entre parenthèses int transforme le texte reçu en entier :",
            " c'est le même réflexe que dans la capsule Bibliothèque.",
            "Puis checkdate reçoit mois, jour, année, dans cet ordre précis.",
            "Il répond si la date existe vraiment : le trente et un février sera refusé.",
            "Si la date est invalide, dollar message reçoit Date invalide.",
            "Sinon, on recolle année, mois et jour avec des tirets pour fabriquer une date au format année-mois-jour.",
            "strtotime transforme ce texte en timestamp ; si ce timestamp est supérieur à time, la date est dans le futur et on la refuse.",
            "Dernier contrôle : l'énergie doit être positive.",
            "L'ordre compte : existence, futur, quantité. Aucun INSERT ne doit partir avant ces trois portes.",
        ])],
    },
    "ajout_insertion": {
        "titre": "ajout.php — insérer, confirmer et remplir le formulaire",
        "fichier": "ajout.php",
        "segments": [("ajout_insertion", [
            "Quand les contrôles passent, on normalise la date avec date, format Y tiret m tiret j, à partir de strtotime.",
            "Puis on construit la requête INSERT INTO recharge :",
            " idborne vient du select, immat est entre apostrophes parce que c'est du texte,",
            " daterec reçoit la date normalisée, et kwh reçoit le nombre.",
            "À l'écran, je présente cette longue instruction sur plusieurs lignes, mais c'est exactement la même requête.",
            "On l'exécute avec mysqli query.",
            "Le juge de paix est mysqli affected rows : s'il vaut un, une ligne a été insérée",
            " et le message confirme l'enregistrement avec la date au format jour slash mois slash année.",
            "Sinon, on annonce l'échec.",
            "Plus bas, le formulaire affiche dollar message seulement s'il n'est pas vide.",
            "Le select des bornes n'est pas écrit à la main : une requête lit idborne, nomborne et ville,",
            " puis la boucle fabrique une balise option par borne, avec l'identifiant comme valeur.",
            "Enfin, jour, mois et année sont préremplis par la date du jour.",
            "Le corrigé attend donc l'élève avec un formulaire déjà vivant.",
        ])],
    },
    "liste_filtres": {
        "titre": "liste.php — les liens de filtre et le paramètre type",
        "fichier": "liste.php",
        "segments": [("liste_filtres", [
            "Ouvrons liste.php, la page la plus riche.",
            "Elle commence par include de connexion.php, puis elle ferme le PHP pour écrire le squelette HTML.",
            "Dans le corps, on rouvre PHP pour fabriquer les liens de filtre.",
            "D'abord le lien Toutes, sans paramètre.",
            "Ensuite, une requête lit idtype et libelle dans typeborne.",
            "La boucle mysqli fetch row prend les lignes une par une :",
            " dollar t crochet zéro est l'identifiant, dollar t crochet un est le libellé.",
            "Chaque tour fabrique un lien liste.php point d'interrogation type égal identifiant.",
            "Nous retrouvons l'anatomie de la capsule Bibliothèque :",
            " après le point d'interrogation, type est le nom du paramètre et le nombre est sa valeur.",
            "La requête principale joint borne et typeborne grâce à b point idtype égal t point idtype.",
            "Si isset de dollar underscore GET crochet type est vrai, on colle à la requête AND b point idtype égal la valeur reçue.",
            "Sinon, on ne colle rien : toutes les bornes restent.",
            "Puis mysqli query exécute la requête finale, et mysqli num rows donne le compteur affiché.",
            "Une adresse, un paramètre, une condition en plus : voilà le filtre.",
        ])],
    },
    "liste_tableau": {
        "titre": "liste.php — transformer le résultat en tableau",
        "fichier": "liste.php",
        "segments": [("liste_tableau", [
            "La même page transforme maintenant le résultat SQL en tableau HTML.",
            "On ouvre la balise table et la ligne des titres : Borne, Ville, Puissance, Type, État et Détails.",
            "Deux variables préparent la suite : dollar puis, un tableau indexé vide, et dollar n, le compteur de cases.",
            "Dans la boucle while, chaque ligne SQL devient dollar l.",
            "On range immédiatement la puissance, dollar l crochet trois, dans dollar puis crochet n, puis on incrémente n.",
            "C'est le geste central : pendant que la page s'affiche, on remplit en parallèle le tableau qui servira aux statistiques.",
            "Les colonnes affichées suivent l'ordre du SELECT : le nom, la ville, la puissance, le libellé et l'état.",
            "Le dernier lien mène à detail.php point d'interrogation id égal dollar l crochet zéro.",
            "Encore un paramètre GET : l'identifiant voyage dans l'adresse.",
            "Après la boucle, on ferme le tableau.",
            "Retenez la différence entre les deux compteurs :",
            " mysqli num rows compte les lignes de la requête ; dollar n compte les puissances rangées.",
            "Ici, ils arrivent au même nombre, mais ils ne racontent pas la même chose.",
        ])],
    },
    "liste_statistiques": {
        "titre": "liste.php — puissances, statistiques et date en lettres",
        "fichier": "liste.php",
        "segments": [("liste_statistiques", [
            "Après l'affichage, liste.php exploite le tableau des puissances.",
            "Si count de dollar puis est supérieur à zéro, on initialise max et min avec la première case, somme à zéro,",
            " puis une boucle for parcourt toutes les cases.",
            "Chaque puissance peut remplacer le maximum, remplacer le minimum, et s'ajoute à la somme.",
            "La moyenne est somme divisée par count, arrondie à un chiffre après la virgule avec round.",
            "Deuxième statistique : une requête GROUP BY libelle compte les bornes par type.",
            "On remplit deux tableaux ensemble : dollar noms, indexé, garde l'ordre des types ;",
            " dollar stat, associatif, relie chaque libellé à son nombre.",
            "Pour trouver le type le plus représenté, on part du premier nom,",
            " puis on compare dollar stat du candidat à dollar stat du champion actuel.",
            "Dernier geste : la date en lettres.",
            "date w donne le jour de semaine, de zéro pour dimanche à six ;",
            " date j donne le jour du mois ; date n donne le mois de un à douze,",
            " parfait pour indexer le tableau des mois qui commence à un.",
            "La page finit donc comme un petit tableau de bord.",
        ])],
    },
    "detail_borne": {
        "titre": "detail.php — recevoir un identifiant et afficher la fiche",
        "fichier": "detail.php",
        "segments": [("detail_borne", [
            "detail.php commence encore plus directement : include de connexion.php,",
            " puis dollar id reçoit dollar underscore GET crochet id.",
            "Pas de formulaire ici : l'information arrive par l'adresse, fabriquée par le lien Détails de liste.php.",
            "La requête cherche nomborne, ville, puissance, libellé, tarifkwh et etat,",
            " en joignant borne à typeborne et en imposant idborne égal dollar id.",
            "Premier test : si mysqli num rows vaut zéro, aucune borne ne correspond ; on affiche Borne introuvable.",
            "Sinon, mysqli fetch array récupère l'unique ligne.",
            "Cette fois, on lit les champs par leur nom :",
            " dollar b crochet nomborne, dollar b crochet ville, dollar b crochet tarifkwh.",
            "C'est plus lisible qu'un tableau indexé quand la page affiche une fiche.",
            "On écrit le titre, la ville, la puissance, le type, le tarif et l'état.",
            "L'idée Bac est simple : un seul enregistrement attendu, donc un seul fetch suffit.",
            "Pas de boucle pour la borne elle-même ; la boucle viendra pour ses recharges.",
            "Et si l'identifiant n'existe pas, le programme doit le dire au lieu d'afficher une page vide.",
        ])],
    },
    "detail_recharges": {
        "titre": "detail.php — l'historique, l'ancienneté et le montant",
        "fichier": "detail.php",
        "segments": [("detail_recharges", [
            "Dans la même page, on demande ensuite l'historique :",
            " SELECT immat, daterec, kwh FROM recharge WHERE idborne égal dollar id,",
            " trié par daterec DESC, donc de la recharge la plus récente à la plus ancienne.",
            "Si le nombre de lignes vaut zéro, on écrit Aucune recharge.",
            "Sinon, on ouvre un tableau : véhicule, date, ancienneté, énergie, montant.",
            "Pour chaque ligne, l'ancienneté se calcule en jours :",
            " time moins strtotime de la date donne des secondes ;",
            " on divise par quatre-vingt-six mille quatre cents, le nombre de secondes d'un jour,",
            " puis floor arrondit à l'entier inférieur.",
            "La date affichée passe au format jour slash mois slash année.",
            "Si kwh est vide, la recharge est encore en cours : on affiche en cours et un tiret pour le montant.",
            "Sinon, le montant est kwh multiplié par tarifkwh, arrondi à deux décimales.",
            "Cette page relie donc trois savoir-faire : recevoir un paramètre, afficher une fiche, puis calculer sur une liste.",
            "C'est exactement le genre d'enchaînement que le Bac pratique récompense.",
        ])],
    },
    "bilan": {
        "titre": "Bilan — la méthode à emporter au Bac pratique",
        "fichier": "ChargeTN",
        "segments": [("bilan", [
            "Terminons par la méthode à emporter.",
            "Un : chaque page commence par inclure connexion.php ; on ne répète jamais mysqli connect.",
            "Deux : GET sert à demander une lecture ou un filtre ; POST sert à envoyer un formulaire qui modifie la base.",
            "Trois : avant d'utiliser une valeur, demandez d'où elle vient.",
            "Un paramètre d'adresse arrive comme du texte ;",
            " le corrigé de liste.php le colle directement, mais votre réflexe sûr reste le transtypage en entier quand un nombre est attendu.",
            "detail.php ferait la même chose avec son identifiant.",
            "Quatre : le résultat d'un SELECT se traverse avec fetch row quand on suit l'ordre des colonnes,",
            " ou fetch array quand on veut les noms.",
            "Cinq : les compteurs et les tableaux ne sont pas des décorations.",
            "num rows vérifie l'existence, affected rows vérifie l'écriture,",
            " les tableaux gardent les valeurs pour calculer après la boucle.",
            "Si vous retenez le voyage des données — adresse, formulaire, requête, tableau, page —",
            " vous pouvez reconstruire ces quatre fichiers sans les apprendre par cœur.",
            "Bon courage, et à vous de jouer.",
        ])],
    },
}


def texte_segment(section: str, cle: str) -> str:
    for identifiant, phrases in SECTIONS[section]["segments"]:
        if identifiant == cle:
            return " ".join(phrases)
    return ""


def texte_section(section: str) -> str:
    return " ".join(texte_segment(section, cle) for cle, _ in SECTIONS[section]["segments"])


# ── Prononciation anglaise des fonctions MySQLi ─────────────────────────────
# Consigne de l'enseignant : tout ce qui est « mysqli » se prononce EN ANGLAIS
# (comme « GET » dans la capsule Bibliothèque). La voix de synthèse est
# française : on lui donne donc une transcription qu'elle lira à l'anglaise,
# tandis que les sous-titres gardent le nom exact des fonctions.
PRONONCIATION = [
    ("mysqli affected rows", "maïe sikouèle aïe afektide rôze"),
    ("mysqli fetch array", "maïe sikouèle aïe fètche euré"),
    ("mysqli fetch row", "maïe sikouèle aïe fètche rô"),
    ("mysqli num rows", "maïe sikouèle aïe neume rôze"),
    ("mysqli connect", "maïe sikouèle aïe konnèkte"),
    ("mysqli query", "maïe sikouèle aïe kouiri"),
    ("affected rows", "afektide rôze"),
    ("fetch array", "fètche euré"),
    ("fetch row", "fètche rô"),
    ("num rows", "neume rôze"),
    ("fetch", "fètche"),
]


def texte_parle(section: str) -> str:
    """Le texte réellement dit : les fonctions MySQLi y sont transcrites pour
    être prononcées à l'anglaise par la voix française."""
    texte = texte_section(section)
    for ecrit, dit in PRONONCIATION:
        texte = texte.replace(ecrit, dit)
    return texte


def nombre_caracteres() -> int:
    return sum(len(texte_section(s)) for s in ORDRE)


def numero(section: str) -> int:
    """Le numéro d'étape (1 → n) d'une section."""
    return ORDRE.index(section) + 1


# ── Sous-titres ────────────────────────────────────────────────────────────
_INSECABLE = "\u00a0"


def _typo(phrase: str) -> str:
    """Espace insécable avant les ponctuations doubles."""
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
