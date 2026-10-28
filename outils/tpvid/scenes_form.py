"""Capsule 2 — TP « Formulaire, tableau et autres balises » (HTML5 + CSS3)."""
from PIL import Image, ImageDraw

import lib as R

CODE_BASE = """<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TP : formulaire, tableaux et autres balises</title>
  <style>
    body { max-width: 900px; margin: 20px auto;
           font-family: Arial, sans-serif;
           background-color: #eaf2fb; }
    h1, h2 { color: #1f4e79; }
  </style>
</head>
<body>
  <h1>TP : formulaire, tableaux et autres balises</h1>
  <h2>1. Formulaire complet</h2>
  <h2>2. Le tableau et ses propriétés CSS</h2>
</body>
</html>"""

CODE_METHOD = """<form action="traitement.php" method="get" target="_self">
  <label for="nom">Nom :</label>
  <input type="text" id="nom" name="nom" value="Ali">
  <button type="submit">Envoyer</button>
</form>

<!-- method="get"  : données visibles dans l'URL
     method="post" : données invisibles (corps)
     target : _self | _blank | nom d'un iframe -->"""

CODE_LABEL = """<label for="nom">Nom :</label>
<input type="text" id="nom" name="nom"
       placeholder="Votre nom" required>

<label for="email">Email :</label>
<input type="email" id="email" name="email"
       placeholder="exemple@mail.tn">

<label for="mdp">Mot de passe :</label>
<input type="password" id="mdp" name="mdp" minlength="6">

<!-- for du label = id de l'input -->"""

CODE_TYPES = """<label for="age">Âge (number) :</label>
<input type="number" id="age" name="age" min="10" max="99" value="16">

<label for="niveau">Niveau (range) :</label>
<input type="range" id="niveau" min="0" max="20" value="10"
       oninput="sortie.value = this.value">
<output id="sortie">10</output> / 20

<input type="time" id="h" name="heure" value="14:00">
<input type="month" id="m" name="mois" value="2026-10">
<input type="color" id="c" name="couleur" value="#1f4e79">

<!-- number : bornes min / max   ·   range : curseur
     time / month / color : sélecteurs natifs -->"""

CODE_CSS = """<style>
  legend { font-weight: bold; color: #1f4e79; }
  label { display: inline-block;
          min-width: 150px; margin: 6px 0; }
  input, select, textarea { padding: 4px; }
  fieldset { margin-bottom: 16px;
             border: 2px solid #1f4e79;
             border-radius: 6px; }
</style>

<!-- label : largeur fixe = champs alignés
     fieldset : cadre + marges = groupes lisibles -->"""

CODE_CHOIX = """<fieldset>
  <legend>Sexe (un seul choix)</legend>
  <input type="radio" id="g" name="sexe" value="garcon" checked>
  <label for="g">Garçon</label>
  <input type="radio" id="f" name="sexe" value="fille">
  <label for="f">Fille</label>
</fieldset>

<fieldset>
  <legend>Langages connus (choix multiples)</legend>
  <input type="checkbox" id="c1" name="lang[]" value="html">
  <label for="c1">HTML</label>
  <input type="checkbox" id="c2" name="lang[]" value="css">
  <label for="c2">CSS</label>
</fieldset>

<!-- radio : même name = un seul choix
     checkbox : indépendantes = plusieurs -->"""

CODE_LISTES = """<label for="ville">Ville :</label>
<select id="ville" name="ville">
  <option value="">-- Choisir --</option>
  <optgroup label="Nord">
    <option value="tunis">Tunis</option>
    <option value="bizerte">Bizerte</option>
  </optgroup>
  <optgroup label="Sud">
    <option value="gafsa" selected>Gafsa</option>
    <option value="gabes">Gabès</option>
  </optgroup>
</select>

<select id="matieres" name="matieres[]" multiple size="3">
  <option>Web</option><option>SQL</option><option>Algo</option>
</select>

<input type="text" id="nav" list="liste-nav">
<datalist id="liste-nav">
  <option value="Chrome"></option>
  <option value="Firefox"></option>
</datalist>"""

CODE_ZONES = """<label for="msg">Message :</label>
<textarea id="msg" name="message" rows="4" cols="40"
          maxlength="300" placeholder="Écrivez ici..."></textarea>

<label for="fichier">Fichier :</label>
<input type="file" id="fichier" name="fichier"
       accept=".pdf,.jpg,.png" multiple>

<textarea id="t-ro" name="lecture" readonly>Lecture seule</textarea>
<textarea id="t-dis" name="desactive" disabled>Désactivé</textarea>
<input type="text" id="t-req" name="obligatoire" required>

<!-- readonly : envoyé   |   disabled : NON envoyé -->"""

CODE_BOUTONS = """<button type="submit">Envoyer</button>
<button type="reset">Effacer</button>
<button type="button" onclick="alert('Bonjour')">Simple</button>

<a class="btn" href="fiche.pdf" download>Télécharger</a>

<script>
  function telecharger() {
    var blob = new Blob(["Nom : Ali"], { type: "text/plain" });
    var lien = document.createElement("a");
    lien.href = URL.createObjectURL(blob);
    lien.download = "donnees.txt";
    lien.click();
  }
</script>"""

CODE_TABLE = """<table class="recap">
  <caption>Récapitulatif des balises</caption>
  <colgroup>
    <col style="width: 30%"><col style="width: 70%">
  </colgroup>
  <thead>
    <tr><th>Balise</th><th>Rôle</th></tr>
  </thead>
  <tbody>
    <tr><td>caption</td><td>Titre du tableau</td></tr>
    <tr><td>thead</td><td>Ligne d'en-têtes</td></tr>
  </tbody>
  <tfoot>
    <tr><td>2</td><td>balises vues</td></tr>
  </tfoot>
</table>"""

CODE_FUSION = """<table class="recap">
  <tr><th colspan="3">Élève : Ali — 3e SI</th></tr>
  <tr>
    <td rowspan="2">Web</td>
    <td>HTML</td><td>15</td>
  </tr>
  <tr>
    <td>CSS</td><td>12</td>
  </tr>
</table>

<!-- colspan : fusion horizontale (colonnes)
     rowspan : fusion verticale (lignes) -->"""

CODE_MURS = """<style>
  .separate {
    border-collapse: separate;
    border-spacing: 6px 10px;
    background-color: #e67e22;   /* les murs */
    empty-cells: show;
  }
  .separate td { background: #eaf2fb;
                 border: 2px solid #1f4e79; }

  .collapse { border-collapse: collapse;
              table-layout: fixed; }
  .collapse th, .collapse td {
    border: 4px solid #e67e22; }
  .fixed td { overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap; }
</style>"""

CODE_AUTRES = """<figure>
  <img src="drapeau.png" alt="Le drapeau du lycée" width="360">
  <figcaption>Figure 1 : le drapeau du lycée Raféha.</figcaption>
</figure>

<figure>
  <video src="drapeaurafeha.mp4" controls width="480"
         poster="drapeau.png">
    Votre navigateur ne supporte pas la balise video.
  </video>
  <figcaption>Figure 2 : la cérémonie du drapeau.</figcaption>
</figure>

<p><cite>Le Petit Prince</cite> — <mark>à retenir</mark></p>
<address>Aymen Essouyah, Lycée Raféha, Gafsa</address>
<details><summary>Déplier</summary>Contenu caché</details>"""

CARTONS = {
    "sous_titre": "TP animé — Formulaire, tableau et autres balises",
    "fichier": "formulaire.html",
    "url": "formulaire.html",
}


# ------------------------------------------------------------------ décors
def _mini_formulaire(im, d, box, style, titre):
    x0, y0, x1, y1 = box
    d.rounded_rectangle([x0, y0, x1, y1], radius=10, fill=(255, 255, 255),
                        outline=(206, 218, 234), width=1)
    d.text((x0 + 14, y0 + 8), titre, font=R.police(R.POLICE_B, 12),
           fill=(140, 150, 165) if style == "brut" else R.BLEU_TP)
    y = y0 + 34
    for etiquette, valeur in (("Nom :", "Ali"), ("Ville :", "Gafsa"), ("Niveau :", "3e SI")):
        if style == "style":
            d.text((x0 + 14, y + 6), etiquette, font=R.police(R.POLICE_B, 12), fill=R.BLEU_TP)
            d.rounded_rectangle([x0 + 130, y, x1 - 14, y + 24], radius=5, fill=(255, 255, 255),
                                outline=(31, 78, 121), width=2)
            d.text((x0 + 138, y + 5), valeur, font=R.police(R.POLICE, 12), fill=(30, 40, 55))
        else:
            d.text((x0 + 8, y + 5), etiquette, font=R.police(R.POLICE, 11), fill=(60, 60, 60))
            d.rectangle([x0 + 66, y, x0 + 170, y + 22], outline=(120, 120, 120), fill=(255, 255, 255))
            d.text((x0 + 70, y + 4), valeur, font=R.police(R.POLICE, 11), fill=(60, 60, 60))
        y += 34
    if style == "style":
        d.rounded_rectangle([x0 + 130, y, x0 + 250, y + 28], radius=6, fill=(31, 78, 121))
        d.text((x0 + 158, y + 7), "Envoyer", font=R.police(R.POLICE_B, 12), fill=(255, 255, 255))
    else:
        d.rectangle([x0 + 66, y, x0 + 170, y + 26], outline=(120, 120, 120), fill=(232, 232, 232))
        d.text((x0 + 90, y + 6), "Envoyer", font=R.police(R.POLICE, 11), fill=(60, 60, 60))


def decor_avant_apres(im, d, box, p, e):
    """Deux mini-formulaires : brut, puis stylé (apparaît à mi-parcours)."""
    x0, y0, x1, y1 = box
    d.rounded_rectangle([x0 + 18, y0 + 96, x1 - 18, y1 - 80], radius=12, fill=(232, 238, 247))
    h = int((y1 - 80 - (y0 + 96) - 60) / 2)
    _mini_formulaire(im, d, (x0 + 40, y0 + 116, x1 - 40, y0 + 116 + h), "brut", "sans CSS")
    if p > 0.45:
        d.text((x0 + 40, y0 + 130 + h), "quatre règles CSS plus bas  →",
               font=R.police(R.POLICE_B, 11), fill=(120, 130, 145))
        _mini_formulaire(im, d, (x0 + 40, y0 + 156 + h, x1 - 40, y0 + 156 + h + h), "style", "avec CSS")
    return {}


def decor_fusion(im, d, box, p, e):
    """Tableau du bulletin : colspan sur la première ligne, rowspan sur la première colonne."""
    x0, y0, x1, y1 = box
    bx = x0 + 60
    y = y0 + 110
    if True:
        d.text((bx, y0 + 78), "colspan + rowspan", font=R.police(R.POLICE_B, 13), fill=R.BLEU_TP)
        lw = int(((x1 - 30) - (x0 + 60)) / 3)
        lh = 32
        # ligne fusionnée
        d.rectangle([bx, y, bx + lw * 3, y + lh], fill=(31, 78, 121), outline=(180, 194, 212))
        d.text((bx + 10, y + 8), "Élève : Ali — 3e SI  (colspan=\"3\")", font=R.police(R.POLICE_B, 12),
               fill=(255, 255, 255))
        y += lh
        d.rectangle([bx, y, bx + lw, y + lh * 2], fill=(234, 242, 251), outline=(180, 194, 212))
        d.text((bx + 10, y + 26), "Web", font=R.police(R.POLICE, 12), fill=(30, 40, 55))
        d.text((bx + 10, y + lh + 26), "rowspan=\"2\"", font=R.police(R.MONO, 9), fill=(120, 130, 145))
        for i, (mat, note) in enumerate((("HTML", "15"), ("CSS", "12"))):
            yy = y + i * lh
            d.rectangle([bx + lw, yy, bx + lw * 2, yy + lh], outline=(180, 194, 212), fill=(255, 255, 255))
            d.rectangle([bx + lw * 2, yy, bx + lw * 3, yy + lh], outline=(180, 194, 212), fill=(255, 255, 255))
            d.text((bx + lw + 10, yy + 8), mat, font=R.police(R.POLICE, 12), fill=(30, 40, 55))
            d.text((bx + lw * 2 + 10, yy + 8), note, font=R.police(R.POLICE, 12), fill=(30, 40, 55))
        d.text((bx, y + lh * 2 + 16), "une seule cellule Web pour deux lignes : rowspan=\"2\"",
               font=R.police(R.MONO, 9), fill=(110, 120, 135))
        return {}


def decor_murs(im, d, box, p, e):
    """Les deux valeurs de border-collapse comparées, avec table-layout fixed."""
    x0, y0, x1, y1 = box
    bx = x0 + 60
    y = y0 + 110
    lignes = [["Matière", "Contenu", "Note"],
              ["Web", "HTML", "15"],
              ["Web", "CSS et un texte beaucoup trop long", "12"]]
    lw = int(((x1 - 30) - (x0 + 60)) / 3)
    lh = 36
    d.text((bx, y0 + 78), "border-collapse: separate + border-spacing",
           font=R.police(R.POLICE_B, 12), fill=R.BLEU_TP)
    d.rectangle([bx, y, bx + lw * 3, y + lh * 3], fill=(230, 126, 34))
    esp = 7
    for j, ligne in enumerate(lignes):
        for i, cell in enumerate(ligne):
            cx, cy = bx + i * lw + esp, y + j * lh + esp
            d.rectangle([cx, cy, cx + lw - 2 * esp, cy + lh - 2 * esp], fill=(234, 242, 251),
                        outline=(31, 78, 121), width=2)
            f = R.police(R.POLICE_B if j == 0 else R.POLICE, 11)
            texte = cell
            if d.textlength(texte, font=f) > lw - 2 * esp - 16:
                while texte and d.textlength(texte + "...", font=f) > lw - 2 * esp - 16:
                    texte = texte[:-1]
                texte += "..."
            d.text((cx + 8, cy + 8), texte, font=f, fill=R.BLEU_TP if j == 0 else (30, 40, 55))
    y2 = y + lh * 3 + 30
    d.text((bx, y2), "border-collapse: collapse + table-layout: fixed",
           font=R.police(R.POLICE_B, 12), fill=R.BLEU_TP)
    y2 += 22
    for j, ligne in enumerate(lignes):
        for i, cell in enumerate(ligne):
            cx, cy = bx + i * lw, y2 + j * lh
            d.rectangle([cx, cy, cx + lw, cy + lh], outline=(230, 126, 34), width=3, fill=(234, 242, 251))
            texte = cell
            f = R.police(R.POLICE_B if j == 0 else R.POLICE, 11)
            if i == 1 and j == 2:
                while d.textlength(texte + "...", font=f) > lw - 16 and len(texte) > 4:
                    texte = texte[:-1]
                texte += "..."
            d.text((cx + 8, cy + 9), texte, font=f, fill=R.BLEU_TP if j == 0 else (30, 40, 55))
    d.text((bx, y2 + lh * 3 + 6), "les murs = la bordure · colonnes fixes · texte tronqué",
           font=R.police(R.MONO, 9), fill=(110, 120, 135))
    return {}


SCENES = [
    dict(cle="intro", ep=None, voix=None, type="intro",
         titre="TP animé — Formulaire, tableau et autres balises",
         episodes=[("ÉPISODE 1", "Formulaire, champs et listes"),
                   ("ÉPISODE 2", "Fichiers, boutons et envoi"),
                   ("ÉPISODE 3", "Tableaux, figure et balises")],
         duree=10),

    dict(cle="base", ep=1, voix="b02.mp3", type="code", code=CODE_BASE,
         pages=[dict(debut=0.0, url="formulaire.html", widgets=[
             dict(t="titre", texte="TP : formulaire, tableaux et autres balises"),
             dict(t="soustitre", texte="h1, h2 · fond #eaf2fb · titres #1f4e79"),
             dict(t="table", id="t", entetes=["Section", "Contenu"],
                  lignes=[["1", "Formulaire complet"], ["2", "Tableau et CSS"]],
                  largeurs=[110, 320]),
         ])],
         texte="Bonjour et bienvenue dans ce TP, le plus complet de l'année. Nous construisons une page qui sert de modèle au bac : un formulaire, un tableau avec ses propriétés CSS, une figure, une vidéo et les balises de structure. Regardez le squelette, à gauche. La déclaration doctype, la balise html avec lang égal fr, puis la balise head avec deux meta : charset pour les accents, et viewport pour que la page s'adapte au téléphone. Vient ensuite le titre de l'onglet. Dans la balise style, le body reçoit une largeur maximale de neuf cents pixels, une marge automatique qui le centre, la police Arial et un fond bleu très clair, eaf2fb. Les titres h1 et h2 prennent le bleu un virgule quatre. Toutes les couleurs sont écrites directement dans le CSS, sans variables : c'est plus simple à relire pour un débutant, et c'est exactement ce que demande le sujet. Puis viennent les deux titres h2 qui annoncent les deux grandes parties du TP : le formulaire complet, et le tableau avec ses propriétés. À droite, la page affiche déjà son fond, son titre et ses deux sections. Nous allons maintenant remplir chacune d'elles, balise par balise.",
         etapes=[dict(f=0.08, x=340, y=120), dict(f=0.26, x=360, y=300),
                 dict(f=0.44, x=380, y=420), dict(f=0.62, x=360, y=520),
                 dict(f=0.82, x=850, y=200)]),

    dict(cle="method", ep=1, voix="b03.mp3", type="code", code=CODE_METHOD,
         pages=[dict(debut=0.0, url="formulaire.html", widgets=[
             dict(t="titre", texte="Attributs method et target"),
             dict(t="table", id="t", entetes=["Attribut", "Valeur", "Effet"],
                  lignes=[["method", "get", "données dans l'URL"],
                          ["method", "post", "données invisibles"],
                          ["target", "_self", "même onglet"],
                          ["target", "_blank", "nouvel onglet"]],
                  largeurs=[110, 110, 240]),
             dict(t="espace", hauteur=10),
             dict(t="input", id="nom", label="Nom :", valeur="Ali"),
             dict(t="boutons", items=[("Envoyer", (31, 78, 121), "env")]),
             dict(t="journal", id="journal", hauteur=86,
                  lignes=["traitement.php?nom=Ali",
                          "méthode GET : visible dans l'URL"]),
         ])],
         texte="La balise form porte deux attributs essentiels, et ils tombent souvent à l'examen. method décide comment les données partent vers le serveur. Avec get, elles sont ajoutées à l'adresse, après un point d'interrogation, sous la forme nom égal valeur, séparées par des esperluettes : elles restent visibles dans la barre d'adresse et la longueur est limitée à quelques kilo-octets. Avec post, elles voyagent dans le corps de la requête : invisibles, sans limite pratique, c'est la méthode obligatoire pour les mots de passe et les fichiers. target choisit ensuite la fenêtre de réponse : self reste dans le même onglet, blank ouvre un nouvel onglet, et le nom d'une iframe y envoie le résultat, ce qui permet d'envoyer un formulaire sans quitter la page. Sur l'écran, la souris clique sur envoyer et l'adresse affichée sous le formulaire contient nom égal Ali : c'est la trace de la méthode get. La conclusion à retenir : get pour une recherche, un tri ou un filtre, post pour une inscription, une modification ou un envoi de fichier. Et n'oubliez pas l'attribut action, sans lui le formulaire se renvoie sur la page elle-même.",
         etapes=[dict(f=0.08, x=760, y=200, s="t"), dict(f=0.24, x=800, y=180, s="t"),
                 dict(f=0.44, x=780, y=330), dict(f=0.6, x=860, y=352, s="nom"),
                 dict(f=0.74, x=760, y=396, s="env"),
                 dict(f=0.86, x=760, y=396, s="env", clic="env"),
                 dict(f=0.94, x=900, y=470, s="journal")]),

    dict(cle="label", ep=1, voix="b04.mp3", type="code", code=CODE_LABEL,
         pages=[dict(debut=0.0, url="formulaire.html", widgets=[
             dict(t="titre", texte="Label et types de champs"),
             dict(t="input", id="nom", label="Nom :", valeur="Aymen", aide="required"),
             dict(t="input", id="email", label="Email :", valeur="aymen@sti.tn", aide="type=email"),
             dict(t="input", id="mdp", label="Mot de passe :", valeur="••••••••", aide="type=password"),
         ])],
         texte="Passons au champ lui-même et à son étiquette, car les deux vont toujours ensemble. La balise label porte l'attribut for, dont la valeur doit être exactement l'identifiant du champ. Résultat : cliquer sur le mot nom place le curseur dans la case, ce qui est indispensable sur téléphone, et un lecteur d'écran annonce correctement le champ, ce qui est indispensable pour l'accessibilité. L'attribut name, lui, n'est pas décoratif : c'est la clé envoyée au serveur, celle que PHP retrouvera dans la variable globale. Un champ sans name n'est jamais transmis. Trois types pour commencer. text accepte n'importe quel texte et c'est le type par défaut ; on y ajoute souvent placeholder pour l'exemple, qui disparaît à la première frappe. email vérifie la présence d'une arobase et propose un clavier adapté sur téléphone. password masque les caractères par des points, sans jamais les chiffrer : la sécurité se joue côté serveur. Ajoutez enfin l'attribut required pour rendre le champ obligatoire : le navigateur bloque l'envoi et affiche son propre message, en français, sans une ligne de JavaScript. Sur l'écran, la souris passe d'un champ à l'autre et clique dans chacun.",
         etapes=[dict(f=0.08, x=760, y=205), dict(f=0.22, x=850, y=205, s="nom", clic="nom"),
                 dict(f=0.42, x=850, y=247, s="email"),
                 dict(f=0.6, x=850, y=247, s="email", clic="email"),
                 dict(f=0.78, x=850, y=289, s="mdp", clic="mdp"),
                 dict(f=0.92, x=700, y=380)]),

    dict(cle="types", ep=1, voix="b05.mp3", type="code", code=CODE_TYPES,
         pages=[dict(debut=0.0, url="formulaire.html", widgets=[
             dict(t="titre", texte="Types number, range et sélecteurs"),
             dict(t="input", id="age", label="Âge (number) :", valeur="16", aide="min 10 · max 99"),
             dict(t="range", id="niveau", label="Niveau (range) :", part=0.5, sortie="10 / 20"),
             dict(t="input", id="h", label="Heure (time) :", valeur="14:00", aide="type=time"),
             dict(t="input", id="m", label="Mois (month) :", valeur="2026-10", aide="type=month"),
             dict(t="input", id="c", label="Couleur (color) :", valeur="#1f4e79", aide="type=color"),
         ])],
         texte="HTML5 a apporté plusieurs types de champs, et chaque type fait gagner du code. number n'accepte que des chiffres, affiche deux petites flèches et respecte les bornes min et max ; step fixe le pas, par exemple un par un, ou zéro virgule cinq pour une moyenne. range affiche un curseur : on glisse, la valeur change, mais on ne peut pas la taper au clavier, elle est bornée par construction ; c'est le champ idéal pour une note sur vingt ou un niveau de classe. Pour afficher la valeur en direct, on utilise la balise output avec un identifiant, et l'attribut oninput sur le curseur : à chaque déplacement, on écrit dans output la valeur courante. time affiche un sélecteur d'heure, avec les minutes ; month un calendrier réduit à l'année et au mois, parfait pour une date d'inscription ; color ouvre la palette du système et renvoie une valeur hexadécimale, comme le bleu de notre charte. D'autres types existent : date, week, tel, url et search. Le navigateur adapte même le clavier du téléphone : chiffres pour number, arobase pour email. Connaître ces types, c'est éviter beaucoup de JavaScript inutile. Sur l'écran, la souris passe sur chaque champ pour montrer son interface.",
         etapes=[dict(f=0.08, x=760, y=205), dict(f=0.2, x=800, y=205, s="age", clic="age", k=["1"]),
                 dict(f=0.38, x=820, y=247, s="niveau", k=["→"]),
                 dict(f=0.54, x=860, y=247, s="niveau"),
                 dict(f=0.68, x=800, y=289, s="h"), dict(f=0.78, x=800, y=331, s="m"),
                 dict(f=0.88, x=800, y=373, s="c")]),

    dict(cle="css", ep=1, voix="b06.mp3", type="decor", code=CODE_CSS,
         pages=[dict(debut=0.0, url="formulaire.html", widgets=[
             dict(t="titre", texte="Le formulaire sans CSS, puis avec CSS"),
         ], decor=decor_avant_apres)],
         texte="Un formulaire sans style est presque illisible : les champs s'alignent au hasard, la légende se confond avec le reste, et l'élève ne sait plus où cliquer. Le CSS règle cela en quatre règles seulement, et c'est le premier avant après de ce TP. legend passe en gras et prend le bleu de la charte, ce qui met le titre du groupe en évidence. label reçoit display inline block et une largeur minimale de cent cinquante pixels : tous les champs commencent donc à la même verticale, ce qui donne une colonne nette. input, select et textarea reçoivent un rembourrage de quatre pixels, qui aère le texte à l'intérieur des cases. fieldset, enfin, ajoute une marge basse, une bordure bleue de deux pixels et des coins arrondis, qui dessinent un cadre autour de chaque groupe. Regardez l'écran : en haut le formulaire brut, tel que le navigateur le propose par défaut, en bas le même formulaire avec nos quatre règles. La différence est spectaculaire, et pourtant nous n'avons écrit que quelques lignes. C'est la démonstration de la séparation des rôles : le HTML donne le sens, le CSS donne la forme. Retenez aussi que ces règles sont réutilisables telles quelles dans tous vos TP, et que le contraste du bleu sur blanc reste lisible pour tous les élèves.",
         etapes=[dict(f=0.1, x=700, y=300), dict(f=0.3, x=820, y=300),
                 dict(f=0.55, x=820, y=470), dict(f=0.8, x=700, y=520)]),

    dict(cle="choix", ep=2, voix="b07.mp3", type="code", code=CODE_CHOIX,
         pages=[dict(debut=0.0, url="formulaire.html", widgets=[
             dict(t="titre", texte="Cases à cocher et boutons radio"),
             dict(t="texte", texte="Un seul choix (radio) :"),
             dict(t="choix", type="radio", items=[("Garçon", True, "r1"), ("Fille", False, "r2")]),
             dict(t="texte", texte="Plusieurs choix (checkbox) :"),
             dict(t="choix", type="checkbox", items=[("HTML", True, "c1"), ("CSS", True, "c2"),
                                                     ("JavaScript", False, "c3")]),
             dict(t="journal", id="journal", hauteur=90,
                  lignes=["radio : sexe=fille", "checkbox : lang[]=html", "checkbox : lang[]=css"]),
         ])],
         texte="Épisode deux : les champs de choix, avec deux balises qu'il ne faut jamais confondre. Le bouton radio, type radio, sert quand une seule réponse est possible. Une règle est absolue : tous les boutons d'un même groupe doivent porter exactement le même attribut name ; c'est ce name commun qui crée le groupe, pas leur position dans la page. Chaque bouton possède en plus un identifiant, relié à son label, et un attribut value, qui sera la valeur envoyée au serveur. checked place le choix par défaut. Si vous oubliez le name commun, les deux boutons pourront être cochés en même temps : c'est l'erreur classique. La case à cocher, type checkbox, répond à la question inverse : plusieurs réponses sont possibles, chaque case est indépendante. Elles peuvent partager le même name, et le serveur recevra alors plusieurs valeurs ; en PHP, on écrit name égal lang suivi de crochets pour récupérer un tableau. Sur la page, la souris coche Garçon puis Fille : Garçon se vide automatiquement, c'est l'exclusivité du groupe radio. Puis elle coche et décoche JavaScript : les deux autres cases restent cochées, elles sont indépendantes. Retenez la phrase : radio quand les réponses s'excluent, checkbox quand elles s'additionnent.",
         etapes=[dict(f=0.08, x=760, y=210), dict(f=0.2, x=790, y=252, s="r1", clic="r1"),
                 dict(f=0.36, x=860, y=252, s="r2", clic="r2"),
                 dict(f=0.56, x=760, y=340), dict(f=0.7, x=960, y=380, s="c3", clic="c3"),
                 dict(f=0.82, x=960, y=380, s="c3", clic="c3"),
                 dict(f=0.92, x=920, y=470, s="journal")]),

    dict(cle="listes", ep=2, voix="b08.mp3", type="code", code=CODE_LISTES,
         pages=[dict(debut=0.0, url="formulaire.html", widgets=[
             dict(t="titre", texte="Listes déroulantes et suggestions"),
             dict(t="select", id="ville", label="Ville :", x=10, largeur=210, hauteur=96,
                  options=[("--", "-- Choisir --"), (None, "Nord"), (None, "Tunis"),
                           ("*", "Gafsa"), (None, "Sud"), (None, "Gabès")]),
             dict(t="input", id="nav", label="Navigateur :", valeur="Ch", aide="list=liste-nav"),
             dict(t="zone", id="sug", hauteur=56, largeur=380,
                  texte="Firefox     ·     Chrome     ·     Edge"),
         ])],
         texte="Trois façons de proposer un choix, et trois usages différents. La liste déroulante select, d'abord, occupe peu de place : une première option vide sert d'invite, c'est une bonne habitude qui oblige l'élève à choisir vraiment. L'attribut selected impose le choix par défaut. Pour les longues listes, optgroup regroupe les options sous un intitulé : ici Nord et Sud, ce qui rend la liste lisible en un coup d'œil. L'attribut multiple, ensuite, autorise plusieurs sélections dans la même boîte : on clique sur la première ligne, puis on maintient la touche contrôle en cliquant sur la suivante, et size fixe le nombre de lignes visibles ; le name reçoit alors des crochets, pour que PHP comprenne qu'il reçoit un tableau. Enfin datalist propose des suggestions sans jamais obliger : deux attributs doivent se répondre, list sur l'input et id sur la datalist. À la frappe, le navigateur filtre les propositions, mais l'élève peut écrire autre chose et ce sera accepté : c'est toute la différence avec select. Sur la page, la souris choisit une ville, puis tape deux lettres dans le champ navigateur et la liste déroule ses suggestions. Retenez : select pour un choix fermé, datalist pour un champ libre avec exemples.",
         etapes=[dict(f=0.08, x=760, y=205), dict(f=0.2, x=790, y=205, s="ville", clic="ville"),
                 dict(f=0.36, x=800, y=260, s="ville"),
                 dict(f=0.5, x=790, y=330), dict(f=0.64, x=810, y=330, s="nav", clic="nav", k=["C", "h"]),
                 dict(f=0.8, x=810, y=400, s="sug")]),

    dict(cle="zones", ep=2, voix="b09.mp3", type="code", code=CODE_ZONES,
         pages=[dict(debut=0.0, url="formulaire.html", widgets=[
             dict(t="titre", texte="Zone de texte, fichier et états"),
             dict(t="area", id="msg", label="Message :", largeur=320, hauteur=56,
                  valeur=["Bonjour, voici mon TP."], note="rows 4 · cols 40 · maxlength 300"),
             dict(t="file", id="fichier", label="Fichier :", largeur=200,
                  bouton="Choisir un fichier", fichiers="2 fichiers", aide="accept .pdf .jpg"),
             dict(t="area", id="ro", label="readonly :", largeur=320, hauteur=26,
                  valeur=["Non modifiable, mais envoyé"]),
             dict(t="area", id="dis", label="disabled :", largeur=320, hauteur=26,
                  valeur=["Grisé et NON envoyé"]),
             dict(t="zone", id="alerte", hauteur=40, largeur=420, fond=(255, 236, 232), bord=(220, 90, 70),
                  texte="Veuillez remplir ce champ (required)."),
         ])],
         texte="Pour un message long, on n'utilise pas input mais textarea : une zone de texte sur plusieurs lignes. Ses attributs : name pour l'envoi, rows et cols pour le nombre de lignes et de colonnes visibles, placeholder pour le texte d'aide qui disparaît à la première frappe, et maxlength pour bloquer au-delà d'un nombre de caractères, ici trois cents. Attention, rows et cols donnent la taille d'affichage, pas une limite de saisie : c'est bien maxlength qui limite. Le champ file, ensuite : un clic ouvre la fenêtre de sélection du système, l'attribut accept filtre les types autorisés, et multiple permet de choisir plusieurs fichiers. Une particularité à retenir : l'envoi d'un fichier exige la méthode post et l'attribut enctype multipart form data. Terminons par trois états souvent confondus. readonly rend le champ non modifiable, mais il reste lisible et il est envoyé : on l'utilise pour une donnée calculée. disabled grise complètement le champ et l'empêche surtout d'être envoyé : la valeur n'arrive jamais au serveur, c'est le piège classique. required rend le champ obligatoire : le navigateur bloque l'envoi et affiche le message en rouge. Sur l'écran, les trois zones sont montrées côte à côte.",
         etapes=[dict(f=0.08, x=760, y=205), dict(f=0.2, x=800, y=232, s="msg", clic="msg", k=["A"]),
                 dict(f=0.42, x=760, y=310), dict(f=0.56, x=800, y=330, s="fichier", clic="fichier"),
                 dict(f=0.7, x=830, y=392, s="ro"), dict(f=0.8, x=830, y=432, s="dis"),
                 dict(f=0.9, x=830, y=490, s="alerte")]),

    dict(cle="boutons", ep=2, voix="b10.mp3", type="code", code=CODE_BOUTONS,
         pages=[dict(debut=0.0, url="formulaire.html", widgets=[
             dict(t="titre", texte="Trois boutons, trois rôles"),
             dict(t="boutons", items=[("Envoyer", (31, 78, 121), "sub"), ("Effacer", (192, 57, 43), "rst"),
                                      ("Simple", (90, 100, 115), "btn")]),
             dict(t="espace", hauteur=12),
             dict(t="liens", items=[("Télécharger la fiche", "normal", "dl")]),
             dict(t="journal", id="journal", hauteur=96,
                  lignes=["reset : champs remis à zéro", "download : fiche.pdf",
                          "Blob : donnees.txt généré"]),
         ])],
         texte="Il existe trois boutons, et il faut absolument les distinguer. type submit envoie le formulaire : c'est le comportement par défaut d'un bouton placé dans un formulaire, et c'est pour cela qu'un bouton de décoration déclenche parfois l'envoi sans qu'on le veuille. type reset remet tous les champs à leur valeur initiale, ce qui efface la saisie d'un seul coup, parfois par accident : utilisez-le avec prudence. type button, lui, ne fait rien par lui-même : il attend un script, ici une simple alerte, ou l'appel d'une fonction. Un lien peut aussi se comporter en bouton : il suffit de le styler en CSS et d'ajouter l'attribut download, qui télécharge le fichier au lieu de l'afficher dans le navigateur ; on peut même y mettre un nom de fichier. Enfin, avec JavaScript, on peut fabriquer un fichier à la volée : on crée un objet Blob avec le texte voulu, on génère une adresse temporaire avec createObjectURL, on crée un lien, on lui donne un nom avec download, et on déclenche un clic. Sur l'écran, les trois boutons réagissent l'un après l'autre, puis le lien télécharge la fiche, et le journal affiche les trois traces. C'est ainsi qu'on exporte une liste d'élèves ou un relevé de notes sans serveur.",
         etapes=[dict(f=0.08, x=760, y=205), dict(f=0.2, x=760, y=215, s="sub"),
                 dict(f=0.36, x=880, y=215, s="rst", clic="rst"),
                 dict(f=0.52, x=1010, y=215, s="btn", clic="btn"),
                 dict(f=0.7, x=800, y=280, s="dl", clic="dl"),
                 dict(f=0.86, x=800, y=360, s="journal")]),

    dict(cle="tableau", ep=3, voix="b11.mp3", type="code", code=CODE_TABLE,
         pages=[dict(debut=0.0, url="formulaire.html", widgets=[
             dict(t="titre", texte="Structure d'un tableau"),
             dict(t="table", id="t", caption="Récapitulatif des balises",
                  entetes=["Balise", "Rôle"],
                  lignes=[["caption", "Titre du tableau"],
                          ["colgroup", "Largeur des colonnes"],
                          ["thead", "Ligne d'en-têtes"],
                          ["tbody", "Les données"]],
                  pied=["4", "balises vues"], largeurs=[190, 330]),
             dict(t="texte", texte="tfoot : pied du tableau (totaux)."),
         ])],
         texte="Épisode trois : le tableau, et sa structure se lit comme un plan de maison. La balise table ouvre l'ensemble. caption donne un titre au tableau : ce n'est pas un ornement, c'est ce qui rend le tableau compréhensible par un lecteur d'écran, et il doit être le premier enfant. colgroup et col fixent la largeur des colonnes, ici trente et soixante-dix pour cent, ce qui évite les colonnes qui dansent quand le contenu change. thead contient la ligne d'en-têtes, avec des th, qui sont en gras et centrés par défaut. tbody contient les données, avec des tr pour les lignes et des td pour les cellules. tfoot contient le pied du tableau : les totaux, les moyennes ou une synthèse. Cette séparation n'est pas obligatoire pour que le tableau s'affiche, mais elle permet de styler chaque partie séparément, d'imprimer correctement et de faire répéter les en-têtes sur plusieurs pages. Sur l'écran, la souris traverse les lignes pour montrer chaque zone. Deux attributs complètent la panoplie : colspan pour fusionner des cellules horizontalement et rowspan verticalement, c'est ce que nous voyons dans la scène suivante avec un bulletin d'élève. Et n'oubliez jamais la règle de base : un tableau sert à présenter des données, jamais à faire la mise en page du site.",
         etapes=[dict(f=0.08, x=780, y=205), dict(f=0.2, x=780, y=190, s="t"),
                 dict(f=0.42, x=820, y=240, s="t"), dict(f=0.6, x=850, y=290, s="t"),
                 dict(f=0.78, x=850, y=340, s="t"), dict(f=0.9, x=850, y=380, s="t")]),

    dict(cle="fusion", ep=3, voix="b12.mp3", type="decor", code=CODE_FUSION,
         pages=[dict(debut=0.0, url="formulaire.html", widgets=[
             dict(t="titre", texte="Fusion de cellules : colspan et rowspan"),
         ], decor=decor_fusion)],
         texte="Il faut parfois fusionner des cellules, surtout pour un bulletin ou un emploi du temps. Deux attributs suffisent, et ce sont eux qui rapportent des points au bac. colspan indique sur combien de colonnes une cellule s'étend : ici, la cellule Élève Ali porte colspan égal trois et occupe donc toute la largeur du tableau, sur une seule ligne, ce qui donne un titre de groupe. rowspan indique sur combien de lignes une cellule s'étend : la cellule Web descend sur deux lignes, en face de HTML et de CSS, ce qui évite de répéter le mot Web. Conséquence importante, et c'est l'erreur la plus fréquente : quand une cellule est fusionnée, il ne faut pas écrire les cellules qu'elle recouvre, sinon le tableau se décale et le navigateur ajoute des colonnes fantômes à droite. Sur l'écran, le tableau montre d'abord la fusion horizontale sur la première ligne, puis la fusion verticale sur la première colonne. Un conseil de méthode pour l'examen : dessinez toujours le tableau sur papier, avec ses cases et ses fusions, avant d'écrire la première balise ; vous éviterez ainsi de compter les colonnes à chaque ligne. Et vérifiez à la fin que toutes les lignes ont bien le même nombre de colonnes, en tenant compte des fusions.",
         etapes=[dict(f=0.1, x=760, y=300), dict(f=0.35, x=800, y=250, s="t"),
                 dict(f=0.6, x=820, y=290, s="t"), dict(f=0.85, x=880, y=340, s="t")]),

    dict(cle="murs", ep=3, voix="b13.mp3", type="decor", code=CODE_MURS,
         pages=[dict(debut=0.0, url="formulaire.html", widgets=[
             dict(t="titre", texte="Les murs d'un tableau en CSS"),
         ], decor=decor_murs)],
         texte="Attaquons le CSS du tableau, avec un mot du programme : les murs. Le programme oppose deux valeurs de border-collapse. Avec separate, chaque cellule garde sa propre bordure, et border-spacing, ici six pixels horizontalement et dix verticalement, crée un espace entre les cellules. Or cet espace n'est pas vide : on voit au travers le fond du tableau. Il suffit donc de colorer le tableau en orange pour obtenir des murs orange entre toutes les cellules, et de donner aux cellules un fond bleu clair et une bordure bleue. C'est exactement l'effet demandé dans les exercices, et c'est pour cela que la couleur de fond se met sur table et non sur les cellules. empty-cells décide si une cellule vide affiche sa bordure et son fond, ou disparaît. Avec collapse, c'est l'inverse : les bordures des cellules voisines fusionnent en une seule, border-spacing est ignoré, et le mur devient la bordure elle-même, donc on met une bordure orange de quatre pixels. On ajoute souvent table-layout fixed pour des colonnes de largeur égale, avec overflow hidden, text-overflow ellipsis et white-space nowrap pour couper proprement un texte trop long, et trois points de suspension apparaissent. Sur l'écran, les deux tableaux sont comparés, plus la version à colonnes fixes.",
         etapes=[dict(f=0.1, x=760, y=520), dict(f=0.32, x=800, y=520, s="t"),
                 dict(f=0.6, x=820, y=560, s="t"), dict(f=0.85, x=860, y=600, s="t")]),

    dict(cle="autres", ep=3, voix="b14.mp3", type="code", code=CODE_AUTRES,
         pages=[dict(debut=0.0, url="formulaire.html", widgets=[
             dict(t="titre", texte="figure, video et autres balises"),
             dict(t="figure", id="f1", image="drapeau", taille=(190, 108),
                  legende="Figure 1 : le drapeau du lycée Raféha."),
             dict(t="figure", id="f2", image="video", taille=(230, 130), controls=True,
                  legende="Figure 2 : la cérémonie du drapeau."),
             dict(t="table", id="t", entetes=["Balise", "Rôle"],
                  lignes=[["cite", "titre d'œuvre"], ["mark", "surligner"],
                          ["address", "coordonnées"], ["details", "bloc repliable"]],
                  largeurs=[130, 260]),
         ])],
         texte="Terminons par la figure, la vidéo et quelques balises de texte. La balise figure regroupe un contenu illustratif et sa légende : une image, une vidéo, un schéma, un bloc de code. figcaption donne cette légende, et doit être le premier ou le dernier enfant de la figure. L'intérêt est sémantique : le lecteur d'écran comprend que la légende décrit l'image, et non qu'elle est un paragraphe séparé. Pour une image, l'attribut alt est obligatoire : c'est le texte lu à la place de l'image, et il doit décrire le contenu, pas répéter le nom du fichier. Pour une vidéo, il faut la balise video, l'attribut src avec le fichier, et surtout controls, sans lequel aucune commande n'apparaît : ni lecture, ni pause, ni son. On ajoute width pour la largeur et poster pour l'image d'attente. Le fichier utilisé ici est la vidéo du drapeau du lycée, placée dans le même dossier que la page. Quelques balises pour finir : cite pour le titre d'une œuvre, mark pour surligner, address pour les coordonnées, output pour un résultat, details et summary pour un bloc repliable, hidden pour masquer un élément, et fieldset disabled pour désactiver tout un groupe de champs d'un seul coup. Votre page est maintenant complète.",
         etapes=[dict(f=0.08, x=780, y=205), dict(f=0.22, x=800, y=250, s="f1"),
                 dict(f=0.44, x=820, y=390, s="f2"), dict(f=0.62, x=820, y=420, s="f2"),
                 dict(f=0.78, x=850, y=500, s="t"), dict(f=0.92, x=880, y=560, s="t")]),

    dict(cle="fin", ep=None, voix=None, type="fin",
         lignes=["Formulaire : method get/post · target _self, _blank, iframe",
                 "Champs : label/for, text, email, password, number, range, file",
                 "Choix : radio, checkbox, select, optgroup, multiple, datalist",
                 "États : readonly, disabled, required · boutons : submit, reset, button",
                 "Tableaux : caption, thead, tbody, tfoot, colspan, rowspan",
                 "CSS des murs : border-collapse, border-spacing, table-layout",
                 "Sémantique : figure, figcaption, video + controls, cite, mark, details"],
         pied="Enseignant : Aymen Essouyah  ·  Lycée Raféha  ·  3e & 4e SI",
         titre="TP terminé — votre page est complète !",
         duree=13),
]
