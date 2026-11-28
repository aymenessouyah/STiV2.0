"""Les scènes de « Recharge voiture électrique — Synthèse PHP n°2 ».

La méthode à gauche, le code du corrigé recharge-ve à droite, révélé ligne
par ligne, et un panneau « ce que la page affiche » sous le code.
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
    d.text((MARGE, 42), "CAPSULE · PHP · SYNTHÈSE N°2 · RECHARGE VOITURE ÉLECTRIQUE",
           font=police(18, True), fill=ORANGE)
    d.text((MARGE, 72), "Recharge voiture — Synthèse PHP n°2",
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
        "gauche_titre": "le contenu visé",
        "droite_titre": "le site et sa base",
        "accent": AMBRE,
        "gauche": [
            ("titre", "Sept savoir-faire, un seul exercice"),
            ("", "1 · envoi par formulaire et par lien hypertexte"),
            ("", "2 · les chaînes de caractères"),
            ("", "3 · le transtypage"),
            ("", "4 · les dates"),
            ("", "5 · le tableau indexé, 6 · le tableau associatif"),
            ("", "7 · les boucles"),
            ("note", "Quatre pages PHP à traverser :"),
            ("", "ajouter · liste · modifier · statistiques."),
        ],
        "code": [
            "recharge-ve/",
            "  index.html        → le cadre du site",
            "  inscription.html  → le formulaire",
            "  ajouter.php       → INSERT (après contrôle)",
            "  liste.php         → SELECT + tableau HTML",
            "  modifier.php      → UPDATE",
            "  statistiques.php  → calculs + disponibilités",
            "",
            "base station · table recharges",
            "Id : L Lente · N Normale · R Rapide · U Ultra",
        ],
        "sortie": ["formulaire → page PHP → base → page affichée"],
        "bande": ("le nœud « Recharge voiture » du cours", "on suit le contenu visé"),
    },
    "envois": {
        "gauche_titre": "deux routes pour les données",
        "droite_titre": "le formulaire et les liens",
        "accent": BLEU,
        "gauche": [
            ("titre", "Envoyer : écrire ou demander"),
            ("", "· form method=\"post\" : les champs voyagent"),
            ("", "· action=\"ajouter.php\" : qui les reçoit"),
            ("", "· target=\"cadre\" : la réponse reste dans le site"),
            ("", "· le lien hypertexte demande une page (lecture)"),
            ("note", "POST sert à écrire ; le lien sert à lire."),
            ("", "modifier.php s'envoie son propre formulaire."),
        ],
        "code": [
            "<form method=\"post\" action=\"ajouter.php\" target=\"cadre\"",
            "      onsubmit=\"return validerInscription()\">",
            "  <input type=\"text\" id=\"Id\" name=\"Id\">",
            "  <select id=\"Borne\" name=\"Borne\"> … S1 à S4 … </select>",
            "  <input type=\"number\" id=\"Kwh\" name=\"Kwh\" step=\"0.01\">",
            "  <input type=\"date\" id=\"DateRecharge\" name=\"DateRecharge\">",
            "  <input type=\"time\" id=\"HeureRecharge\" name=\"HeureRecharge\">",
            "  <input type=\"submit\" name=\"ok\" value=\"Enregistrer\">",
            "</form>",
            "",
            "<nav id=\"menu\">",
            "  <a href=\"liste.php\" target=\"cadre\">📋 Historique</a>",
            "  <a href=\"statistiques.php\" target=\"cadre\">📊 Statistiques</a>",
            "</nav>",
        ],
        "sortie": ["clic Enregistrer → ajouter.php reçoit · clic Historique → liste.php s'affiche"],
        "bande": ("formulaire = données à traiter", "lien = page à afficher"),
    },
    "reception": {
        "gauche_titre": "recevoir le formulaire",
        "droite_titre": "ajouter.php — $_POST, tableau associatif",
        "accent": AMBRE,
        "gauche": [
            ("titre", "Les clés de $_POST sont les name des champs"),
            ("", "· mysqli_select_db choisit la base station"),
            ("", "· isset($_POST[\"ok\"]) : le bouton a été cliqué"),
            ("", "· $_POST['Id'] lit le champ nommé Id"),
            ("", "· date et heure arrivent au format de l'input"),
            ("note", "Pas de clic sur Enregistrer = rien à traiter."),
        ],
        "code": [
            "<?php",
            "$connexion = mysqli_connect(\"localhost\", \"root\", \"\");",
            "mysqli_select_db($connexion, \"station\");",
            "?>",
            "<link rel=\"stylesheet\" href=\"style.css\">",
            "<?php",
            "if (isset($_POST[\"ok\"])) {",
            "   $Id = $_POST['Id'];",
            "   $Nom_prenom = $_POST['Nom_prenom'];",
            "   $Borne = $_POST['Borne'];",
            "   $DateRecharge = $_POST['DateRecharge'];",
            "   $HeureRecharge = $_POST['HeureRecharge'];",
            "   … la suite : chaînes, disponibilité, INSERT …",
            "}",
        ],
        "sortie": ["$_POST['Borne'] → \"S2\" · $_POST['DateRecharge'] → \"2026-11-10\""],
        "bande": ("un champ name=… devient une clé $_POST['…']", "recevoir avant de traiter"),
    },
    "chaines": {
        "gauche_titre": "chaînes + transtypage",
        "droite_titre": "découper, transformer, recoller ; (float)",
        "accent": VERT,
        "gauche": [
            ("titre", "La première lettre = le type de recharge"),
            ("", "· substr($Id, 0, 1) : la première lettre"),
            ("", "· strtoupper : la majuscule obligatoire"),
            ("", "· le point . recolle le reste de la chaîne"),
            ("", "· (float) : le texte reçu devient un nombre"),
            ("note", "r03 envoyé → R03 rangé : une Rapide."),
        ],
        "code": [
            "// Chaque Id commence par une lettre en majuscule",
            "// (le type de recharge : L, N, R, U)",
            "$Id = strtoupper(substr($Id, 0, 1)) . substr($Id, 1);",
            "",
            "$Kwh = (float)$_POST['Kwh'];",
            "",
            "// \"r03\"  → substr → \"r\" → strtoupper → \"R\"",
            "//          → \"R\" . \"03\" → \"R03\"",
            "// \"45.5\" (texte) → (float) → 45.5 (nombre)",
        ],
        "sortie": ["$Id = \"R03\" · $Kwh = 45.5 (nombre, pas du texte)"],
        "bande": ("substr découpe · strtoupper transforme · . recolle", "(float) change le type"),
    },
    "disponibilite": {
        "gauche_titre": "vérifier avant d'écrire",
        "droite_titre": "ajouter.php — COUNT(*) puis INSERT",
        "accent": ROSE,
        "gauche": [
            ("titre", "La station est-elle déjà occupée ?"),
            ("", "· COUNT(*) AS nb : compter sans ramener les lignes"),
            ("", "· trois AND : même Borne, même date, même heure"),
            ("", "· fetch_array lit la ligne unique par son nom"),
            ("", "· $ligneVerif[\"nb\"] > 0 → occupée, on refuse"),
            ("note", "L'INSERT ne part que si le compteur vaut 0."),
        ],
        "code": [
            "$verif = mysqli_query($connexion, \"SELECT COUNT(*) AS nb FROM recharges",
            "        WHERE Borne = '$Borne' AND DateRecharge = '$DateRecharge'",
            "        AND HeureRecharge = '$HeureRecharge'\");",
            "$ligneVerif = mysqli_fetch_array($verif);",
            "",
            "if ($ligneVerif[\"nb\"] > 0) {",
            "   echo \"🔴 Station $Borne occupée le $DateRecharge",
            "         à $HeureRecharge : choisissez une autre heure.\";",
            "} else {",
            "   $req = \"INSERT INTO recharges (Id, Nom_prenom, Borne, Kwh,",
            "           DateRecharge, HeureRecharge)",
            "           VALUES ('$Id', '$Nom_prenom', '$Borne', $Kwh,",
            "           '$DateRecharge', '$HeureRecharge')\";",
            "   if (mysqli_query($connexion, $req)) {",
            "      echo \"✅ Recharge enregistrée (Id = $Id …)\";",
            "   }",
            "}",
        ],
        "sortie": ["nb = 1 → « 🔴 Station S2 occupée… » · nb = 0 → « ✅ Recharge enregistrée »"],
        "bande": ("COUNT répond une seule valeur", "vérifier, puis insérer"),
    },
    "liste": {
        "gauche_titre": "la boucle qui affiche",
        "droite_titre": "liste.php — while + fetch_array",
        "accent": VERT,
        "gauche": [
            ("titre", "Une ligne SQL = une ligne de tableau"),
            ("", "· ORDER BY Nom_prenom : SQL trie avant la page"),
            ("", "· while ($ligne = mysqli_fetch_array(...))"),
            ("", "· fetch_array : accès par nom ET par position"),
            ("", "· plus de ligne → null → la boucle s'arrête"),
            ("note", "mysqli_num_rows donne le total après la boucle."),
        ],
        "code": [
            "$req = \"SELECT Id, Nom_prenom, Borne, Kwh, DateRecharge,",
            "        HeureRecharge FROM recharges ORDER BY Nom_prenom\";",
            "$resultat = mysqli_query($connexion, $req);",
            "?>",
            "<table>",
            "  <tr><th>Id</th><th>Conducteur</th><th>Station</th>…</tr>",
            "  <?php while ($ligne = mysqli_fetch_array($resultat)) { ?>",
            "  <tr>",
            "    <td><?php echo $ligne[\"Id\"]; ?></td>",
            "    <td><?php echo $ligne[\"Nom_prenom\"]; ?></td>",
            "    <td><?php echo $ligne[\"Borne\"]; ?></td>",
            "    <td><?php echo $ligne[\"Kwh\"]; ?></td>",
            "    <td><?php echo $ligne[\"DateRecharge\"]; ?></td>",
            "  </tr>",
            "  <?php } ?>",
            "</table>",
            "<p><?php echo mysqli_num_rows($resultat); ?> recharge(s).</p>",
        ],
        "sortie": ["L01 · Trabelsi Sara · S1 · 12.5 · 2025-09-03 — « 8 recharge(s) au total. »"],
        "bande": ("$ligne[\"Kwh\"] par nom · $ligne[3] par position", "une requête, une boucle, un tableau"),
    },
    "modifier": {
        "gauche_titre": "mettre à jour sans tout écraser",
        "droite_titre": "modifier.php — UPDATE + affected_rows",
        "accent": VIOLET,
        "gauche": [
            ("titre", "Même réception, autre requête"),
            ("", "· le formulaire se poste sur modifier.php lui-même"),
            ("", "· strtoupper/substr et (float) : les mêmes réflexes"),
            ("", "· WHERE Id = … : une seule ligne visée"),
            ("", "· mysqli_affected_rows > 0 : vraiment modifié ?"),
            ("note", "Sans WHERE, l'UPDATE toucherait toute la table."),
        ],
        "code": [
            "if (isset($_POST[\"ok\"])) {",
            "   $Id = $_POST['Id'];",
            "   $Id = strtoupper(substr($Id, 0, 1)) . substr($Id, 1);",
            "   $Borne = $_POST['Borne'];",
            "   $Kwh = (float)$_POST['Kwh'];",
            "   $DateRecharge = $_POST['DateRecharge'];",
            "   $HeureRecharge = $_POST['HeureRecharge'];",
            "",
            "   $req = \"UPDATE recharges",
            "           SET Borne = '$Borne', Kwh = $Kwh,",
            "           DateRecharge = '$DateRecharge',",
            "           HeureRecharge = '$HeureRecharge'",
            "           WHERE Id = '$Id'\";",
            "   mysqli_query($connexion, $req);",
            "",
            "   if (mysqli_affected_rows($connexion) > 0) {",
            "      echo \"Recharge $Id mise à jour.\";",
            "   } else {",
            "      echo \"Aucune ligne modifiée.\";",
            "   }",
            "}",
        ],
        "sortie": ["« Recharge R03 mise à jour. » · Id inconnu → « Aucune ligne modifiée. »"],
        "bande": ("num_rows après SELECT", "affected_rows après UPDATE"),
    },
    "stats_comptes": {
        "gauche_titre": "cinq questions, cinq requêtes",
        "droite_titre": "statistiques.php — COUNT, AVG, MAX",
        "accent": BLEU,
        "gauche": [
            ("titre", "Le même geste, répété proprement"),
            ("", "· COUNT(*) AS nb : le nombre de recharges"),
            ("", "· le if nb > 0 protège toute la suite"),
            ("", "· AVG(Kwh) : l'énergie moyenne, round(..., 2)"),
            ("", "· ORDER BY Kwh DESC LIMIT 1 : la plus grosse"),
            ("note", "Requête → fetch_array → lecture par le nom."),
        ],
        "code": [
            "$connexion = mysqli_connect(\"localhost\",\"root\",\"\",\"station\");",
            "if (!$connexion) {",
            "   die(\"Erreur de connexion : \" . mysqli_connect_error());",
            "}",
            "$total = mysqli_query($connexion,",
            "   \"SELECT COUNT(*) AS nb FROM recharges\");",
            "$ligneTotal = mysqli_fetch_array($total);",
            "",
            "if ($ligneTotal[\"nb\"] > 0) {",
            "   $nrj = mysqli_query($connexion,",
            "      \"SELECT AVG(Kwh) AS m FROM recharges\");",
            "   $ligneNrj = mysqli_fetch_array($nrj);",
            "   // round($ligneNrj[\"m\"], 2) → énergie moyenne",
            "   $max = mysqli_query($connexion, \"SELECT Nom_prenom, Kwh",
            "      FROM recharges ORDER BY Kwh DESC LIMIT 1\");",
            "   $ligneMax = mysqli_fetch_array($max);",
            "   // complètes : Kwh >= 40 · partielles : Kwh < 40",
            "}",
        ],
        "sortie": ["8 recharges · moyenne 41,09 kWh · plus grosse : Cherif Ines (80.25 kWh)"],
        "bande": ("COUNT compte · AVG moyenne · DESC + LIMIT 1 maximise", "cinq questions, un geste"),
    },
    "stats_types": {
        "gauche_titre": "chaîne → tarif → coût",
        "droite_titre": "statistiques.php — par catégorie",
        "accent": AMBRE,
        "gauche": [
            ("titre", "Une ligne, trois savoir-faire"),
            ("", "· ORDER BY LEFT(Id, 1) : trier par type L, N, R, U"),
            ("", "· substr lit la catégorie dans l'Id"),
            ("", "· if / else if : le tarif du type"),
            ("", "· explode sépare Nom et Prénom (tableau indexé)"),
            ("note", "coût = Kwh × tarif, arrondi à 2 décimales."),
        ],
        "code": [
            "$parCategorie = mysqli_query($connexion,",
            "  \"SELECT Id, Nom_prenom, Kwh FROM recharges",
            "   ORDER BY LEFT(Id, 1), Nom_prenom\");",
            "while ($ligne = mysqli_fetch_array($parCategorie)) {",
            "   $Categorie = substr($ligne[\"Id\"], 0, 1);",
            "   if ($Categorie == \"L\") $tarif = 0.300;",
            "   else if ($Categorie == \"N\") $tarif = 0.450;",
            "   else if ($Categorie == \"R\") $tarif = 0.700;",
            "   else $tarif = 0.950; // U : Ultra-rapide",
            "   $cout = round($ligne[\"Kwh\"] * $tarif, 2);",
            "",
            "   $partiesNom = explode(\" \", $ligne[\"Nom_prenom\"], 2);",
            "   $Nom = $partiesNom[0];",
            "   $Prenom = isset($partiesNom[1]) ? $partiesNom[1] : \"\";",
            "   // → ligne : Catégorie | Nom | Prénom | kWh | Tarif | Coût",
            "}",
        ],
        "sortie": ["R · Gharbi · Yassine · 45 kWh · 0.700 · 31,50 DT"],
        "bande": ("substr lit · if choisit · explode sépare", "trois savoir-faire, une ligne"),
    },
    "dispos": {
        "gauche_titre": "dates + tableaux + boucles",
        "droite_titre": "statistiques.php — la grille du jour",
        "accent": VERT,
        "gauche": [
            ("titre", "Tout le contenu visé dans un tableau"),
            ("", "· date(\"Y-m-d\") : aujourd'hui, au format de la base"),
            ("", "· $occupees[\"S1-08\"] = true : tableau associatif"),
            ("", "· $heures : tableau indexé des créneaux (sans 12h)"),
            ("", "· foreach dans foreach : stations × heures"),
            ("note", "isset(clé) décide : rouge occupée, vert libre."),
        ],
        "code": [
            "$aujourdhui = date(\"Y-m-d\");",
            "$occ = mysqli_query($connexion, \"SELECT Borne, HeureRecharge",
            "   FROM recharges WHERE DateRecharge = '$aujourdhui'\");",
            "$occupees = array();",
            "while ($l = mysqli_fetch_array($occ)) {",
            "   $occupees[$l[\"Borne\"] . \"-\" . substr($l[\"HeureRecharge\"], 0, 2)] = true;",
            "}",
            "$heures = array(\"08\",\"09\",\"10\",\"11\",\"13\",\"14\",\"15\",\"16\",\"17\");",
            "foreach (array(\"S1\",\"S2\",\"S3\",\"S4\") as $borne) {",
            "   echo \"<tr><td><b>$borne</b></td>\";",
            "   foreach ($heures as $heure) {",
            "      if (isset($occupees[$borne . \"-\" . $heure]))",
            "         echo \"<td>🔴 Occupée</td>\";",
            "      else echo \"<td>✅ Libre</td>\";",
            "   }",
            "   echo \"</tr>\";",
            "}",
        ],
        "sortie": ["S1 : 08h ✅ · 13h 🔴 (R01) · 15h 🔴 (U01) — 36 cases remplies par 2 boucles"],
        "bande": ("une clé présente = occupée", "date, tableaux, boucles imbriquées"),
    },
    "bilan": {
        "gauche_titre": "la méthode à emporter",
        "droite_titre": "les sept gestes du nœud",
        "accent": VERT,
        "gauche": [
            ("titre", "Ce qu'il faut savoir refaire"),
            ("", "1 · envoyer : formulaire POST, lien hypertexte target cadre"),
            ("", "2 · recevoir : $_POST, tableau associatif des champs"),
            ("", "3 · chaînes : substr, strtoupper, explode, le point"),
            ("", "4 · transtypage : (float) avant d'écrire un nombre"),
            ("", "5 · dates : date(\"Y-m-d\"), horaires de travail"),
            ("note", "6 · tableaux indexé/associatif · 7 · while et foreach."),
        ],
        "code": [
            "form method=\"post\"          // envoyer des données",
            "<a href=\"liste.php\" target=\"cadre\">  // demander une page",
            "",
            "$_POST['Kwh']               // recevoir (associatif)",
            "(float)$_POST['Kwh']        // transtyper",
            "substr · strtoupper · explode   // les chaînes",
            "date(\"Y-m-d\")               // les dates",
            "$ligne[\"Id\"] · $partiesNom[0]  // associatif · indexé",
            "while ($ligne = mysqli_fetch_array(...))  // boucler",
            "foreach ($heures as $heure) { ... }",
        ],
        "sortie": ["formulaire → chaîne → nombre → date → tableaux → boucles"],
        "bande": ("le contenu visé du nœud, en sept gestes", "à vous de jouer"),
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
