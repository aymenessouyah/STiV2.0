"""Les scènes de « Recharge Véhicule électrique — les pages PHP ».

L'écran reprend la grammaire de la capsule Bibliothèque : **la méthode à
gauche**, **le code du corrigé à droite**, révélé ligne par ligne, et un
panneau « ce que la page affiche » sous le code. Les extraits sont ceux des
quatre fichiers du corrigé ChargeTN ; les très longues chaînes du corrigé
sont présentées en concaténations successives, ce qui ne change ni la
requête construite ni le HTML produit.
"""
from __future__ import annotations

from PIL import ImageDraw

from theme import (
    FOND, FOND_PANNEAU, FOND_PANNEAU_2, BORDURE, TEXTE, TEXTE_2, TEXTE_3,
    ORANGE, AMBRE, VIOLET, VERT, BLEU, ROSE, ROUGE_BORD,
    police, melange, boite_arrondie,
)
import dessin as G
from dessin import (
    LARGEUR, HAUTEUR, MARGE, GAUCHE, DROITE, BANDE,
    PAPIER, ENCRE, ROUGE_STYLO, CODE_FOND,
    fond, panneau, papier, console,
)
import narration as N

TOTAL = len(N.ORDRE)
X = GAUCHE[0] + 24
Y0 = GAUCHE[1] + 70
CODE_X = DROITE[0] + 48
CODE_Y = DROITE[1] + 86


def _apparait(p, seuil, duree=0.10):
    if p <= seuil:
        return 0.0
    return max(0.0, min(1.0, (p - seuil) / max(0.01, duree)))


def _entete(d, cle):
    d.text((MARGE, 42), "CAPSULE · PHP · SIMILAIRE BAC PRATIQUE · RECHARGE VÉHICULE ÉLECTRIQUE",
           font=police(18, True), fill=ORANGE)
    d.text((MARGE, 72), "Recharge VE — les quatre pages PHP du corrigé",
           font=police(40, True), fill=TEXTE)
    d.text((MARGE, 134), f"{N.numero(cle)} · {N.SECTIONS[cle]['titre']}",
           font=police(22), fill=TEXTE_2)
    x1 = LARGEUR - MARGE
    d.text((x1, 48), f"ÉTAPE {N.numero(cle)} / {TOTAL}", font=police(21, True),
           fill=TEXTE_2, anchor="ra")
    y = 172
    d.rounded_rectangle([MARGE, y, x1, y + 6], radius=3, fill=(26, 38, 58))
    d.rounded_rectangle([MARGE, y, MARGE + (x1 - MARGE) * N.numero(cle) / TOTAL, y + 6],
                        radius=3, fill=ORANGE)


def _bandeau(d, gauche, droite, couleur=AMBRE):
    boite_arrondie(d, BANDE, rayon=16, fond=FOND_PANNEAU_2,
                   bord=melange(BORDURE, ORANGE, 0.35), largeur_bord=2)
    d.text((BANDE[0] + 26, (BANDE[1] + BANDE[3]) / 2), gauche, font=police(19),
           fill=TEXTE_3, anchor="lm")
    d.text((BANDE[2] - 26, (BANDE[1] + BANDE[3]) / 2), droite,
           font=police(20, True), fill=couleur, anchor="rm")


DONNEES = {
    "ouverture": {
        "gauche_titre": "la méthode",
        "droite_titre": "le trajet des données",
        "accent": AMBRE,
        "gauche": [
            ("titre", "Le même site, quatre responsabilités"),
            ("", "1 · connexion.php — ouvrir la base recharge"),
            ("", "2 · ajout.php — recevoir le formulaire, insérer"),
            ("", "3 · liste.php — filtrer, afficher, calculer"),
            ("", "4 · detail.php — une fiche et son historique"),
            ("note", "Trois temps dans chaque page :"),
            ("", "traitement serveur → réponse HTML → boucle SQL."),
            ("", "Repérez ces trois temps, et le code s'éclaire."),
        ],
        "code": [
            "ChargeTN/",
            "  index.html        → l'accueil (HTML)",
            "  connexion.php     → la base recharge",
            "  ajout.php         → INSERT INTO recharge",
            "  liste.php         → SELECT + statistiques",
            "  detail.php?id=... → la fiche d'une borne",
            "",
            "GET  : lire, filtrer, naviguer",
            "POST : envoyer un formulaire, modifier",
        ],
        "sortie": ["adresse → requête SQL → tableau HTML → page"],
        "bande": ("une capsule, quatre fichiers", "on suit les données"),
    },
    "connexion": {
        "gauche_titre": "à retenir",
        "droite_titre": "connexion.php — 5 lignes",
        "accent": BLEU,
        "gauche": [
            ("titre", "Le fichier que toutes les pages incluent"),
            ("", "· Africa/Tunis : les heures ne dépendent plus du serveur"),
            ("", "· mysqli_connect : serveur, utilisateur, mot de passe, base"),
            ("", "· $cnx est le ticket passé à chaque mysqli_query"),
            ("", "· SET NAMES utf8mb4 protège les accents"),
            ("note", "Aucun affichage ici : on prépare, c'est tout."),
            ("", "On l'écrit une fois, on l'inclut partout."),
        ],
        "code": [
            "<?php",
            "date_default_timezone_set(\"Africa/Tunis\");",
            "$cnx = mysqli_connect(\"localhost\", \"root\", \"\", \"recharge\");",
            "mysqli_query($cnx, \"SET NAMES utf8mb4\");",
            "?>",
        ],
        "sortie": ["$cnx prêt · base « recharge » · accents préservés"],
        "bande": ("connexion.php ne s'affiche jamais", "il sert partout"),
    },
    "ajout_controles": {
        "gauche_titre": "les trois portes avant l'INSERT",
        "droite_titre": "ajout.php — le traitement POST",
        "accent": AMBRE,
        "gauche": [
            ("titre", "D'abord recevoir, ensuite contrôler"),
            ("", "· isset($_POST['ok']) : le bouton a été soumis"),
            ("", "· (int) : le texte reçu devient un entier"),
            ("", "· checkdate(mois, jour, année) : la date existe ?"),
            ("", "· strtotime($d) > time() : le futur est refusé"),
            ("", "· kwh <= 0 : l'énergie doit être positive"),
            ("note", "Existence, futur, quantité — dans cet ordre."),
            ("", "Aucun INSERT ne part avant ces trois portes."),
        ],
        "code": [
            "<?php",
            "include(\"connexion.php\");",
            "$message = \"\";",
            "if (isset($_POST['ok'])) {",
            "  $j = (int)$_POST['jour'];",
            "  $m = (int)$_POST['mois'];",
            "  $a = (int)$_POST['annee'];",
            "  if (!checkdate($m, $j, $a)) {",
            "    $message = \"Date invalide\";",
            "  } else {",
            "    $d = $a.\"-\".$m.\"-\".$j;",
            "    if (strtotime($d) > time()) {",
            "      $message = \"La date ne peut pas être dans le futur\";",
            "    } else if ($_POST['kwh'] <= 0) {",
            "      $message = \"La quantité d'énergie doit être positive\";",
            "    } else {",
        ],
        "sortie": ["31/02/2027 → « Date invalide »", "demain → refusé · kwh = 0 → refusé"],
        "bande": ("isset · (int) · checkdate · strtotime", "contrôler avant d'écrire"),
    },
    "ajout_insertion": {
        "gauche_titre": "écrire, puis confirmer",
        "droite_titre": "ajout.php — INSERT et formulaire vivant",
        "accent": VERT,
        "gauche": [
            ("titre", "Une ligne insérée, un message qui le prouve"),
            ("", "· date(\"Y-m-d\") : le format que MariaDB attend"),
            ("", "· le texte entre apostrophes, les nombres sans"),
            ("", "· mysqli_affected_rows == 1 : l'insertion a réussi"),
            ("", "· le <select> des bornes est fabriqué par une boucle"),
            ("", "· jour, mois, année préremplis par la date du jour"),
            ("note", "Le formulaire n'est pas statique : il lit la base."),
        ],
        "code": [
            "      $date = date(\"Y-m-d\", strtotime($d));",
            "      $req = \"INSERT INTO recharge(idborne,immat,daterec,kwh) VALUES (\"",
            "        .$_POST['borne'].\",'\"",
            "        .$_POST['immat'].\"','\"",
            "        .$date.\"',\".$_POST['kwh'].\")\";",
            "      mysqli_query($cnx, $req);",
            "      if (mysqli_affected_rows($cnx) == 1) {",
            "        $message = \"Recharge enregistrée le \".date(\"d/m/Y\", strtotime($d));",
            "      } else {",
            "        $message = \"Échec de l'enregistrement\";",
            "      }",
            "",
            "$rb = mysqli_query($cnx, \"SELECT idborne, nomborne, ville FROM borne\");",
            "while ($b = mysqli_fetch_row($rb)) {",
            "  echo \"<option value='\".$b[0].\"'>\".$b[1].\" (\".$b[2].\")</option>\";",
            "}",
        ],
        "sortie": ["Recharge enregistrée le 10/11/2026", "<option value='3'>Borne Sud (Sfax)</option>"],
        "bande": ("INSERT · affected_rows · boucle d'options", "écrire, puis prouver"),
    },
    "liste_filtres": {
        "gauche_titre": "un paramètre = un filtre",
        "droite_titre": "liste.php — les liens et la requête",
        "accent": BLEU,
        "gauche": [
            ("titre", "L'adresse commande la requête"),
            ("", "· « Toutes » : aucun paramètre, aucun filtre"),
            ("", "· chaque type devient liste.php?type=N"),
            ("", "· fetch_row : $t[0] l'identifiant, $t[1] le libellé"),
            ("", "· la jointure relie borne et typeborne"),
            ("", "· isset($_GET['type']) ajoute une condition… ou rien"),
            ("note", "Après ? : le nom du paramètre. Après = : sa valeur."),
            ("", "mysqli_num_rows donne le compteur affiché."),
        ],
        "code": [
            "echo \"<p><a href='liste.php'>Toutes</a>\";",
            "$rt = mysqli_query($cnx, \"SELECT idtype, libelle FROM typeborne\");",
            "while ($t = mysqli_fetch_row($rt)) {",
            "  echo \" | <a href='liste.php?type=\".$t[0].\"'>\".$t[1].\"</a>\";",
            "}",
            "echo \"</p>\";",
            "",
            "$req = \"SELECT idborne, nomborne, ville, puissance, libelle, etat\"",
            "  .\" FROM borne b, typeborne t WHERE b.idtype=t.idtype\";",
            "if (isset($_GET['type'])) {",
            "  $req = $req.\" AND b.idtype=\".$_GET['type'];",
            "}",
            "$rl = mysqli_query($cnx, $req);",
            "echo \"<p>\".mysqli_num_rows($rl).\" borne(s)</p>\";",
        ],
        "sortie": ["Toutes | Lente AC | Rapide DC | Ultra-rapide DC", "liste.php?type=2 → 3 borne(s)"],
        "bande": ("?type=2 : nom = type, valeur = 2", "le filtre est une condition"),
    },
    "liste_tableau": {
        "gauche_titre": "afficher et ranger en même temps",
        "droite_titre": "liste.php — du SELECT au tableau HTML",
        "accent": VERT,
        "gauche": [
            ("titre", "Une ligne SQL devient une ligne de tableau"),
            ("", "· les colonnes suivent l'ordre du SELECT"),
            ("", "· $puis[$n] = $l[3] : la puissance est rangée"),
            ("", "· $n compte les cases du tableau des puissances"),
            ("", "· detail.php?id=… : l'identifiant voyage en GET"),
            ("note", "num_rows compte la requête ; $n compte le tableau."),
            ("", "Ici ils coïncident — mais ils ne racontent pas la même chose."),
        ],
        "code": [
            "echo \"<table><tr><th>Borne</th><th>Ville</th>\"",
            "  .\"<th>Puissance (kW)</th><th>Type</th><th>État</th>\"",
            "  .\"<th>Détails</th></tr>\";",
            "$puis = array();",
            "$n = 0;",
            "while ($l = mysqli_fetch_row($rl)) {",
            "  $puis[$n] = $l[3];",
            "  $n = $n + 1;",
            "  echo \"<tr><td>\".$l[1].\"</td><td>\".$l[2].\"</td><td>\".$l[3]",
            "    .\"</td><td>\".$l[4].\"</td><td>\".$l[5].\"</td>\";",
            "  echo \"<td><a href='detail.php?id=\".$l[0].\"'>Détails</a></td></tr>\";",
            "}",
            "echo \"</table>\";",
        ],
        "sortie": ["Borne Nord · Tunis · 22 kW · Lente AC · libre · Détails"],
        "bande": ("fetch_row : l'ordre du SELECT fait loi", "on range en affichant"),
    },
    "liste_statistiques": {
        "gauche_titre": "compter après la boucle",
        "droite_titre": "liste.php — puissances, types, date en lettres",
        "accent": VIOLET,
        "gauche": [
            ("titre", "Le tableau rangé devient un tableau de bord"),
            ("", "· max, min et somme en un seul parcours for"),
            ("", "· la moyenne : round(somme / count, 1)"),
            ("", "· GROUP BY libelle compte les bornes par type"),
            ("", "· $noms garde l'ordre, $stat associe libellé → nombre"),
            ("", "· le champion se compare avec $stat[$best]"),
            ("note", "date(\"w\") : 0 = dimanche · date(\"n\") : 1 = janvier."),
        ],
        "code": [
            "if (count($puis) > 0) {",
            "  $max = $puis[0];  $min = $puis[0];  $somme = 0;",
            "  for ($i = 0; $i < count($puis); $i++) {",
            "    if ($puis[$i] > $max) { $max = $puis[$i]; }",
            "    if ($puis[$i] < $min) { $min = $puis[$i]; }",
            "    $somme = $somme + $puis[$i];",
            "  }",
            "  echo \"… moyenne : \".round($somme / count($puis), 1).\" kW\";",
            "}",
            "$rs = mysqli_query($cnx, \"SELECT libelle, COUNT(*) FROM borne b,\"",
            "  .\" typeborne t WHERE b.idtype=t.idtype GROUP BY libelle\");",
            "while ($s = mysqli_fetch_row($rs)) {",
            "  $noms[$k] = $s[0];  $stat[$s[0]] = $s[1];  $k = $k + 1;",
            "}",
            "$best = $noms[0];   // puis : $stat[$noms[$i]] > $stat[$best] ?",
            "echo $jours[date(\"w\")].\" \".date(\"j\").\" \".$mois[date(\"n\")].\" \".date(\"Y\");",
        ],
        "sortie": ["max 150 kW · min 7 kW · moyenne 62,4 kW", "Nous sommes le mardi 10 novembre 2026"],
        "bande": ("indexé pour parcourir, associatif pour nommer", "compter, puis conclure"),
    },
    "detail_borne": {
        "gauche_titre": "un identifiant, une fiche",
        "droite_titre": "detail.php — recevoir $_GET['id']",
        "accent": ROSE,
        "gauche": [
            ("titre", "Pas de formulaire : l'adresse suffit"),
            ("", "· $id = $_GET['id'] : le lien de liste.php l'a fabriqué"),
            ("", "· num_rows == 0 : la borne n'existe pas, on le dit"),
            ("", "· un seul enregistrement attendu : un seul fetch"),
            ("", "· fetch_array : les champs se lisent par leur nom"),
            ("note", "$b['nomborne'] se lit mieux que $b[0] sur une fiche."),
            ("", "La boucle viendra pour les recharges, pas pour la borne."),
        ],
        "code": [
            "<?php",
            "include(\"connexion.php\");",
            "$id = $_GET['id'];",
            "?>",
            "… le squelette HTML de la page …",
            "$r = mysqli_query($cnx, \"SELECT nomborne, ville, puissance,\"",
            "  .\" libelle, tarifkwh, etat FROM borne b, typeborne t\"",
            "  .\" WHERE b.idtype=t.idtype AND idborne=\".$id);",
            "if (mysqli_num_rows($r) == 0) {",
            "  echo \"<p>Borne introuvable</p>\";",
            "} else {",
            "  $b = mysqli_fetch_array($r);",
            "  echo \"<h2>\".$b['nomborne'].\"</h2>\";",
            "  echo \"Ville : \".$b['ville'].\"<br>Puissance : \".$b['puissance'].\" kW\";",
            "  echo \"<br>Type : \".$b['libelle'].\"<br>Tarif : \".$b['tarifkwh'].\" DT/kWh\";",
            "}",
        ],
        "sortie": ["Borne Nord — Tunis · 22 kW · Lente AC · 0,35 DT/kWh · libre"],
        "bande": ("GET reçoit · num_rows vérifie · fetch_array lit", "une fiche, un fetch"),
    },
    "detail_recharges": {
        "gauche_titre": "calculer sur l'historique",
        "droite_titre": "detail.php — ancienneté et montant",
        "accent": AMBRE,
        "gauche": [
            ("titre", "Du plus récent au plus ancien"),
            ("", "· ORDER BY daterec DESC : le tri est demandé à SQL"),
            ("", "· (time() − strtotime) / 86400 : des secondes → des jours"),
            ("", "· floor : on garde les jours entiers écoulés"),
            ("", "· kwh vide : « en cours », pas de montant"),
            ("", "· sinon : kwh × tarifkwh, arrondi à 2 décimales"),
            ("note", "86400 = 24 × 60 × 60, les secondes d'un jour."),
        ],
        "code": [
            "$re = mysqli_query($cnx, \"SELECT immat, daterec, kwh FROM recharge\"",
            "  .\" WHERE idborne=\".$id.\" ORDER BY daterec DESC\");",
            "if (mysqli_num_rows($re) == 0) {",
            "  echo \"<p>Aucune recharge</p>\";",
            "} else {",
            "  echo \"<table><tr><th>Véhicule</th><th>Date</th>\"",
            "    .\"<th>Ancienneté</th><th>Énergie (kWh)</th><th>Montant (DT)</th></tr>\";",
            "  while ($e = mysqli_fetch_row($re)) {",
            "    $nb = floor((time() - strtotime($e[1])) / 86400);",
            "    echo \"<tr><td>\".$e[0].\"</td><td>\".date(\"d/m/Y\", strtotime($e[1]))",
            "      .\"</td><td>il y a \".$nb.\" jour(s)</td>\";",
            "    if ($e[2] == \"\") {",
            "      echo \"<td>en cours</td><td>-</td></tr>\";",
            "    } else {",
            "      echo \"<td>\".$e[2].\"</td><td>\".round($e[2] * $b['tarifkwh'], 2).\"</td></tr>\";",
            "    }",
            "  }",
            "  echo \"</table>\";",
            "}",
        ],
        "sortie": ["128 TU 456 · 02/11/2026 · il y a 8 jour(s) · 40 kWh · 14,00 DT"],
        "bande": ("DESC trie · floor compte les jours · round arrondit", "une date devient un calcul"),
    },
    "bilan": {
        "gauche_titre": "la méthode à emporter",
        "droite_titre": "cinq gestes, quatre fichiers",
        "accent": VERT,
        "gauche": [
            ("titre", "Ce qu'il faut savoir refaire"),
            ("", "1 · include(\"connexion.php\") partout, jamais deux connexions"),
            ("", "2 · GET pour lire et filtrer, POST pour modifier"),
            ("", "3 · une valeur d'adresse est du texte : (int) si un nombre"),
            ("", "4 · fetch_row suit le SELECT, fetch_array nomme les champs"),
            ("", "5 · num_rows vérifie, affected_rows confirme, les tableaux gardent"),
            ("note", "Adresse → requête → tableau → page : le voyage des données."),
        ],
        "code": [
            "include(\"connexion.php\");        // toujours",
            "",
            "GET  → lire · filtrer · naviguer",
            "POST → envoyer · insérer · modifier",
            "",
            "(int)$_GET['id']                  // le réflexe sûr",
            "mysqli_fetch_row($r)              // par position",
            "mysqli_fetch_array($r)            // par nom",
            "mysqli_num_rows($r)               // ça existe ?",
            "mysqli_affected_rows($cnx)        // c'est écrit ?",
        ],
        "sortie": ["quatre fichiers, une seule méthode"],
        "bande": ("le voyage des données, du lien à la page", "à vous de jouer"),
    },
}


def _gauche(d, spec, p):
    panneau(d, GAUCHE, spec["gauche_titre"], accent=melange(BORDURE, spec["accent"], 0.55))
    papier(d, [GAUCHE[0] + 16, GAUCHE[1] + 56, GAUCHE[2] - 16, GAUCHE[3] - 16])
    y = Y0
    total = len(spec["gauche"])
    for i, (genre, texte) in enumerate(spec["gauche"]):
        seuil = 0.04 + 0.72 * i / max(1, total)
        k = _apparait(p, seuil, 0.10)
        if k <= 0:
            continue
        if genre == "titre":
            d.text((X, y), texte, font=police(23, True),
                   fill=melange(PAPIER, spec["accent"], k), anchor="la")
            y += 48
        elif genre == "note":
            d.text((X, y), texte, font=police(20, True),
                   fill=melange(PAPIER, ROUGE_STYLO, k), anchor="la")
            y += 40
        else:
            d.text((X, y), texte, font=police(19),
                   fill=melange(PAPIER, ENCRE, k), anchor="la")
            y += 38


def _code(d, spec, p):
    panneau(d, DROITE, spec["droite_titre"], accent=melange(BORDURE, spec["accent"], 0.55))
    console(d, [DROITE[0] + 16, DROITE[1] + 56, DROITE[2] - 16, 700])
    lignes = spec["code"]
    y = CODE_Y + 22
    # Les scènes les plus denses (detail.php) comptent une vingtaine de lignes :
    # l'interligne et la taille se resserrent pour que tout le code reste visible
    # au-dessus du panneau de sortie, sans jamais être masqué par lui.
    if len(lignes) > 1:
        pas_y = min(30, (684 - y) / (len(lignes) - 1))
    else:
        pas_y = 30
    taille = 19 if pas_y >= 28 else 18 if pas_y >= 25 else 17 if pas_y >= 22 else 16
    for i, ligne in enumerate(lignes):
        seuil = 0.05 + 0.70 * i / max(1, len(lignes))
        k = _apparait(p, seuil, 0.07)
        if k <= 0:
            break
        actuel = p < seuil + 0.10
        if actuel and ligne.strip():
            boite_arrondie(d, [DROITE[0] + 28, y - pas_y / 2 + 2, DROITE[2] - 28, y + pas_y / 2 - 2],
                           rayon=7, fond=melange(CODE_FOND, spec["accent"], 0.16),
                           bord=melange(CODE_FOND, spec["accent"], 0.35), largeur_bord=1)
        couleur = VERT if ligne.strip().startswith(("//", "#")) else TEXTE
        if ligne.strip().startswith(("<?php", "?>")):
            couleur = AMBRE
        visible = ligne[:max(1, int(len(ligne) * k + 0.999))] if ligne else ""
        d.text((CODE_X - 8, y), str(i + 1), font=police(taille - 4, True, mono=True),
               fill=melange(CODE_FOND, TEXTE_3, 0.8 * k), anchor="rm")
        d.text((CODE_X + 14, y), visible, font=police(taille, False, mono=True),
               fill=melange(CODE_FOND, couleur, k), anchor="lm")
        y += pas_y


def _sortie(d, spec, p):
    if p < 0.62:
        return
    k = _apparait(p, 0.62, 0.16)
    box = [DROITE[0] + 16, 716, DROITE[2] - 16, DROITE[3] - 16]
    boite_arrondie(d, box, rayon=14, fond=(8, 14, 22),
                   bord=melange(BORDURE, BLEU, 0.55 * k), largeur_bord=2)
    d.text((box[0] + 18, box[1] + 14), "ce que la page affiche", font=police(15, True),
           fill=melange(CODE_FOND, BLEU, 0.9 * k), anchor="la")
    y = box[1] + 50
    for ligne in spec["sortie"]:
        d.text((box[0] + 22, y), ligne, font=police(18, True, mono=True),
               fill=melange(CODE_FOND, TEXTE_2, 0.95 * k), anchor="lm")
        y += 29


def dessiner(d: ImageDraw.ImageDraw, cle: str, p: float, t: float):
    fond(d, t)
    _entete(d, cle)
    spec = DONNEES[cle]
    _gauche(d, spec, p)
    _code(d, spec, p)
    _sortie(d, spec, p)
    gauche, droite = spec["bande"]
    _bandeau(d, gauche, droite, spec["accent"])


SCENES = {cle: dessiner for cle in N.ORDRE}
assert list(DONNEES) == N.ORDRE, "une scène par section, dans le même ordre"
