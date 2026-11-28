"""Texte de la voix off de « Recharge voiture électrique — Synthèse PHP n°2 ».

Capsule du chapitre 10 du cours PHP : l'exercice de synthèse n°2, le site
« Recharge VE — Station électrique » (base `station`, table `recharges`).
Elle suit le contenu visé affiché dans la description du nœud :

* envoi des données via formulaire et via lien hypertexte ;
* chaînes de caractères, transtypage, dates ;
* tableau indexé, tableau associatif, boucles.

Les textes sont écrits pour être prononcés : les symboles sont nommés
(« dollar », « crochet ») et chaque section reste sous la limite d'un clip
de synthèse vocale (1 500 caractères).
"""
from __future__ import annotations

# L'ordre de lecture ; il sert aussi à numéroter les chapitres.
ORDRE = [
    "ouverture", "envois", "reception", "chaines", "disponibilite",
    "liste", "modifier", "stats_comptes", "stats_types", "dispos", "bilan",
]

SECTIONS = {
    "ouverture": {
        "titre": "Bienvenue — le contenu visé de la synthèse n°2",
        "fichier": "recharge-ve",
        "segments": [("ouverture", [
            "Bienvenue dans STI Version 2.0.",
            "Aujourd'hui, nous expliquons l'exercice de synthèse numéro deux du cours PHP : Recharge voiture électrique.",
            "Le site s'appelle Recharge VE, Station électrique ; sa base est station, et sa table, recharges.",
            "Chaque recharge a un identifiant qui commence par une lettre : L pour Lente, N pour Normale, R pour Rapide, U pour Ultra-rapide.",
            "Voici le contenu visé, celui du nœud du cours : l'envoi des données par formulaire et par lien hypertexte ;",
            " les chaînes de caractères ; le transtypage ; les dates ;",
            " le tableau indexé ; le tableau associatif ; et les boucles.",
            "Nous allons traverser les quatre pages PHP du corrigé — ajouter, liste, modifier, statistiques —",
            " en suivant ces sept savoir-faire un par un, dans le code réel.",
            "À gauche, la méthode ; à droite, le code, révélé ligne par ligne.",
        ])],
    },
    "envois": {
        "titre": "Envoyer les données — formulaire POST et lien hypertexte",
        "fichier": "index.html",
        "segments": [("envois", [
            "Premier savoir-faire : faire voyager les données. Il y a deux routes.",
            "La route du formulaire : inscription.html contient une balise form, méthode post, action ajouter.php,",
            " et target cadre, pour que la réponse s'affiche dans l'iframe du site.",
            "Quand l'élève clique sur Enregistrer, le navigateur envoie les champs à ajouter.php :",
            " l'identifiant, le nom, la station, l'énergie, la date et l'heure.",
            "La route du lien hypertexte : dans index.html, la navigation contient des liens simples,",
            " par exemple liste.php avec target cadre.",
            "Un clic ne transmet aucun champ, mais il demande une page : c'est un envoi léger, en lecture.",
            "Retenez la différence : le formulaire envoie des données à traiter ;",
            " le lien hypertexte demande un affichage.",
            "La page modifier.php, elle, porte son propre formulaire, qui s'envoie à elle-même en POST.",
            "Dans tout l'exercice, POST sert donc à écrire, et les liens servent à naviguer et à lire.",
        ])],
    },
    "reception": {
        "titre": "ajouter.php — recevoir le formulaire dans $_POST",
        "fichier": "ajouter.php",
        "segments": [("reception", [
            "Ouvrons ajouter.php. Les deux premières lignes ouvrent la connexion :",
            " mysqli connect vers localhost, utilisateur root, mot de passe vide,",
            " puis mysqli select db choisit la base station.",
            "Ensuite vient le garde d'entrée : isset de dollar underscore POST, crochet ok.",
            "ok est le nom du bouton Enregistrer ; tant qu'il n'a pas été cliqué, il n'y a rien à traiter.",
            "Quand le formulaire arrive, chaque champ se récupère par son nom :",
            " dollar Id reçoit dollar underscore POST crochet Id,",
            " dollar Nom_prenom reçoit le champ Nom_prenom, dollar Borne reçoit la station choisie,",
            " et les champs DateRecharge et HeureRecharge arrivent tels quels, au format de la balise input.",
            "Le tableau dollar underscore POST est un tableau associatif : ses clés sont les noms des champs.",
            "C'est toujours lui qui reçoit un formulaire envoyé en POST.",
            "Reste le champ Kwh, que nous traitons dans la section suivante, car il demande un transtypage.",
        ])],
    },
    "chaines": {
        "titre": "Chaînes et transtypage — la première lettre donne le type",
        "fichier": "ajouter.php",
        "segments": [("chaines", [
            "Deuxième et troisième savoir-faire : les chaînes, puis le transtypage.",
            "L'énoncé exige que l'identifiant commence par une majuscule, car cette lettre donne le type de recharge.",
            "La ligne du corrigé découpe la chaîne : substr de dollar Id, départ zéro, longueur un, prend la première lettre ;",
            " strtoupper la met en majuscule ;",
            " puis on recolle, avec le point de concaténation, le reste de la chaîne, substr à partir de un.",
            "Résultat : si l'élève envoie r zéro trois en minuscule, PHP range R zéro trois, donc une recharge Rapide.",
            "La chaîne se manipule donc en trois gestes : découper, transformer, recoller.",
            "Le transtypage, maintenant : dollar Kwh reçoit, entre parenthèses, float, puis le champ Kwh reçu.",
            "Le formulaire envoie toujours du texte ; le transtypage float transforme ce texte en nombre réel,",
            " pour que la base reçoive un nombre et non une chaîne.",
            "C'est le même réflexe que le transtypage int des capsules précédentes, adapté à une énergie en kilowattheures.",
            "Retenez : substr et strtoupper travaillent sur le texte ; les parenthèses float changent le type.",
        ])],
    },
    "disponibilite": {
        "titre": "ajouter.php — vérifier la disponibilité avant l'INSERT",
        "fichier": "ajouter.php",
        "segments": [("disponibilite", [
            "Avant d'insérer, ajouter.php pose une question à la base : cette station est-elle déjà occupée,",
            " ce jour-là, à cette heure-là ?",
            "La requête est un SELECT COUNT étoile, AS nb, FROM recharges,",
            " avec trois conditions reliées par AND : la même Borne, la même DateRecharge, la même HeureRecharge.",
            "COUNT compte sans ramener les lignes : le résultat contient une seule ligne, une seule valeur.",
            "mysqli fetch array la récupère, et on la lit par son nom : dollar ligneVerif, crochet nb.",
            "C'est un tableau associatif : nb est le nom que le AS de la requête a donné à la colonne.",
            "Si ce compteur est supérieur à zéro, la station est occupée :",
            " le message s'affiche — Station occupée, choisissez une autre station ou une autre heure — et rien n'est inséré.",
            "Sinon, seulement sinon, on construit la requête INSERT INTO recharges,",
            " avec les six colonnes, le texte entre apostrophes et le nombre sans apostrophes,",
            " puis mysqli query l'exécute et le message confirme l'enregistrement.",
            "La leçon : on n'écrit dans la base qu'après avoir vérifié ; l'INSERT est la dernière étape, pas la première.",
        ])],
    },
    "liste": {
        "titre": "liste.php — la boucle while transforme le SELECT en tableau",
        "fichier": "liste.php",
        "segments": [("liste", [
            "liste.php affiche l'historique. La requête sélectionne les six colonnes, triées par Nom_prenom.",
            "ORDER BY demande le tri à SQL : la page reçoit les recharges déjà rangées par conducteur.",
            "Puis vient la boucle centrale de tout le cours PHP :",
            " while, dollar ligne reçoit mysqli fetch array du résultat.",
            "À chaque tour, fetch array donne la ligne suivante, sous forme de tableau ;",
            " quand il n'y a plus de ligne, il renvoie null, et la boucle s'arrête toute seule.",
            "Dans la boucle, chaque case de la ligne devient une cellule du tableau HTML :",
            " dollar ligne, crochet Id ; crochet Nom_prenom ; crochet Borne ; crochet Kwh ; puis la date et l'heure.",
            "Les clés portent les noms des colonnes : c'est le tableau associatif, lisible et sûr.",
            "La même ligne existerait aussi en tableau indexé : crochet zéro pour Id, crochet un pour le nom, et ainsi de suite,",
            " dans l'ordre du SELECT. fetch array donne les deux accès à la fois.",
            "Après la boucle, mysqli num rows compte les lignes du résultat et la page affiche le total.",
            "Une requête, une boucle, un tableau : c'est le schéma de toutes les pages de liste.",
        ])],
    },
    "modifier": {
        "titre": "modifier.php — UPDATE et mysqli_affected_rows",
        "fichier": "modifier.php",
        "segments": [("modifier", [
            "modifier.php met à jour une recharge existante. Sa structure reprend ajouter.php :",
            " le même garde isset de dollar underscore POST, crochet ok,",
            " la même première lettre forcée en majuscule avec strtoupper et substr,",
            " et le même transtypage float sur l'énergie.",
            "La requête change : UPDATE recharges, SET Borne, Kwh, DateRecharge, HeureRecharge,",
            " WHERE Id égale l'identifiant saisi.",
            "Le WHERE est vital : sans lui, la mise à jour toucherait toutes les lignes de la table.",
            "mysqli query exécute la mise à jour, mais elle ne dit pas combien de lignes ont changé.",
            "Le juge de paix est mysqli affected rows : s'il est supérieur à zéro, une ligne a été modifiée,",
            " et la page confirme « Recharge mise à jour » ;",
            " sinon, elle répond honnêtement : aucune ligne modifiée,",
            " identifiant introuvable ou valeurs identiques.",
            "Retenez le couple : num rows après un SELECT, affected rows après un UPDATE ou un INSERT.",
            "Et le formulaire de la page se poste sur elle-même : réception et traitement vivent dans le même fichier.",
        ])],
    },
    "stats_comptes": {
        "titre": "statistiques.php — compter, moyenner, trouver le maximum",
        "fichier": "statistiques.php",
        "segments": [("stats_comptes", [
            "statistiques.php commence comme ajouter.php, mais sa connexion nomme la base directement,",
            " et elle teste l'échec : si la connexion est fausse, die arrête la page avec le message d'erreur.",
            "Premier calcul : SELECT COUNT étoile AS nb donne le nombre total de recharges,",
            " lu avec fetch array, crochet nb.",
            "Si ce nombre vaut zéro, la page entière des statistiques serait absurde :",
            " tout le reste vit donc dans le if, dollar ligneTotal crochet nb supérieur à zéro.",
            "Deuxième calcul : AVG de Kwh donne l'énergie moyenne, arrondie à deux décimales avec round.",
            "Troisième : la plus grosse recharge, avec ORDER BY Kwh DESC, LIMIT un :",
            " SQL trie de la plus grande à la plus petite, et on ne garde que la première ligne.",
            "Deux compteurs terminent : les recharges complètes, Kwh supérieur ou égal à quarante,",
            " et les partielles, en dessous de quarante.",
            "Chaque résultat suit le même chemin : une requête, un fetch array, une lecture par le nom de la colonne.",
            "Cinq questions, cinq fois le même geste : c'est cela, savoir programmer.",
        ])],
    },
    "stats_types": {
        "titre": "statistiques.php — type, tarif et coût : chaînes et tableaux",
        "fichier": "statistiques.php",
        "segments": [("stats_types", [
            "Le deuxième tableau de statistiques.php trie les recharges par type :",
            " ORDER BY LEFT de Id, virgule, un — la première lettre de l'identifiant — puis par nom.",
            "La boucle while parcourt ce résultat, et chaque ligne commence par un travail de chaîne :",
            " dollar Categorie reçoit substr de l'Id, départ zéro, longueur un.",
            "Une chaîne de tests attribue alors le tarif : L vaut zéro trois cents,",
            " N zéro quatre cent cinquante, R zéro sept cents, et sinon — donc U — zéro neuf cent cinquante dinars par kilowattheure.",
            "Le coût est l'énergie multipliée par le tarif, arrondie à deux décimales.",
            "Autre travail de chaîne : le nom complet se sépare en Nom et Prénom.",
            "explode coupe la chaîne à chaque espace, avec une limite de deux morceaux,",
            " et fabrique un tableau indexé : crochet zéro, le nom de famille ; crochet un, le prénom, s'il existe.",
            "isset vérifie ce deuxième morceau avant de l'afficher : un nom d'un seul mot ne doit rien casser.",
            "La ligne du tableau affiche alors la catégorie dans sa couleur, le nom, le prénom, l'énergie, le tarif et le coût.",
            "Chaîne découpée, tableau indexé, boucle : trois savoir-faire dans une seule ligne de tableau.",
        ])],
    },
    "dispos": {
        "titre": "statistiques.php — la date du jour et la grille des stations",
        "fichier": "statistiques.php",
        "segments": [("dispos", [
            "Le dernier tableau répond à une question de date : quelles stations sont libres aujourd'hui ?",
            "date, format Y tiret m tiret j, donne la date du jour, exactement au format de la base.",
            "On interroge les recharges de ce jour-là, et chaque ligne remplit un tableau associatif, dollar occupees :",
            " la clé est fabriquée par concaténation — la borne, un tiret, les deux premiers caractères de l'heure,",
            " extraits par substr — et la valeur est vrai.",
            "Ce tableau est un registre : une clé présente signifie « occupée », une clé absente signifie « libre ».",
            "Vient ensuite le tableau indexé des heures ouvrables : zéro huit, zéro neuf, dix, onze,",
            " puis treize à dix-sept — jamais douze, c'est la pause.",
            "Deux boucles foreach imbriquées fabriquent la grille :",
            " la boucle extérieure parcourt les quatre stations, S1 à S4 ;",
            " la boucle intérieure parcourt les neuf heures.",
            "Pour chaque case, isset teste la clé dans le registre :",
            " présente, la case est rouge, Occupée ; absente, elle est verte, Libre.",
            "Date du jour, tableau associatif, tableau indexé, boucles imbriquées :",
            " tout le contenu visé se retrouve dans ce dernier tableau.",
        ])],
    },
    "bilan": {
        "titre": "Bilan — les gestes à savoir refaire",
        "fichier": "recharge-ve",
        "segments": [("bilan", [
            "Terminons par les gestes à savoir refaire, dans l'ordre du contenu visé.",
            "Un : envoyer. Le formulaire part en POST vers sa page de traitement ;",
            " le lien hypertexte demande une page, avec target cadre pour rester dans le site.",
            "Deux : recevoir. dollar underscore POST est un tableau associatif dont les clés sont les noms des champs,",
            " et isset du bouton dit si le formulaire a vraiment été soumis.",
            "Trois : les chaînes. substr découpe, strtoupper transforme, explode sépare, le point recolle.",
            "Quatre : le transtypage. Les parenthèses float changent le texte reçu en nombre avant de l'écrire.",
            "Cinq : les dates. date donne aujourd'hui au format de la base, et les heures se testent dans les horaires de travail.",
            "Six : les tableaux. fetch array donne la ligne par position et par nom ;",
            " un tableau indexé garde une liste ordonnée, un tableau associatif relie une clé à une valeur.",
            "Sept : les boucles. while avance ligne par ligne dans un résultat ;",
            " foreach parcourt un tableau, même imbriqué dans un autre foreach.",
            "Formulaire, chaîne, nombre, date, tableaux, boucles : vous savez reconstruire les quatre pages.",
            "Bon courage pour la synthèse, et à vous de jouer.",
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
# Consigne de l'enseignant : tout ce qui est « mysqli » se prononce EN ANGLAIS.
# La voix de synthèse est française : on lui donne donc une transcription
# qu'elle lira à l'anglaise, tandis que les sous-titres gardent le nom exact
# des fonctions.
PRONONCIATION = [
    ("mysqli fetch array", "maïe sikouèle aïe fètche euré"),
    ("mysqli num rows", "maïe sikouèle aïe neume rôze"),
    ("mysqli affected rows", "maïe sikouèle aïe afektide rôze"),
    ("mysqli select db", "maïe sikouèle aïe sélèkte di bi"),
    ("mysqli connect", "maïe sikouèle aïe konnèkte"),
    ("mysqli query", "maïe sikouèle aïe kouiri"),
    ("mysqli close", "maïe sikouèle aïe clôze"),
    ("mysqli error", "maïe sikouèle aïe èreur"),
    ("fetch array", "fètche euré"),
    ("num rows", "neume rôze"),
    ("affected rows", "afektide rôze"),
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
