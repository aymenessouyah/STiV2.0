"""Capsule 1 — TP « Événements, liens et arrière-plans ».

10 scènes narrées (~75-85 s chacune) + carton d'ouverture et carton final.
"""

from PIL import Image, ImageDraw

import lib as R

CODE_BASE = """<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>TP : événements</title>
  <style>
    body { max-width: 900px; margin: 20px auto;
           font-family: Arial, sans-serif; }
    h1 { color: #1f4e79; }
    .journal { height: 140px; background: #111;
               color: #7ee787; font-family: monospace;
               padding: 8px; overflow: auto; }
  </style>
</head>
<body onload="journal('onload : la page est chargée')">

  <h1>TP : événements et arrière-plans</h1>
  <div id="journal" class="journal"></div>

  <script>
    function journal(texte) {
      var zone = document.getElementById("journal");
      zone.innerHTML += texte + "<br>";
      zone.scrollTop = zone.scrollHeight;
    }
  </script>
</body>
</html>"""

CODE_CHAMPS = """<label for="nom">Nom :</label>
<input type="text" id="nom" name="nom"
       onfocus="journal('onfocus : champ nom')"
       onblur="journal('onblur : champ nom')">

<label for="ville">Ville :</label>
<input type="text" id="ville" name="ville"
       onfocus="journal('onfocus : champ ville')"
       onblur="journal('onblur : champ ville')">

<!-- onfocus : le champ reçoit le focus
     onblur  : le champ le perd -->"""

CODE_CLIC = """<button id="b1" onclick="journal('onclick : bouton')">
  Cliquer ici
</button>

<a href="#cours" onclick="journal('onclick : lien'); return false">
  Lien cliquable
</a>

<!-- return false annule le déplacement :
     le journal reste affiché -->

<img src="drapeau.png" alt="drapeau" width="120"
     onclick="journal('onclick : image')">"""

CODE_SAISIE = """<label for="prenom">Prénom :</label>
<input type="text" id="prenom" name="prenom"
       oninput="journal('oninput : ' + this.value)">

<label for="niv">Niveau :</label>
<input type="range" id="niv" min="0" max="20" value="10"
       oninput="sortie.value = this.value"
       onchange="journal('onchange : ' + this.value)">
<output id="sortie">10</output> / 20

<!-- oninput  : à chaque frappe, tout de suite
     onchange : seulement à la fin, en quittant -->"""

CODE_CLAVIER = """<label for="touche">Tapez ici :</label>
<input type="text" id="touche" name="touche"
       onkeydown="journal('onkeydown : ' + event.key)"
       onkeyup="journal('onkeyup : ' + event.key)">

<!-- event.key contient le nom de la touche :
     une lettre, Entrée, Tabulation, Flèche droite -->

<script>
  function journal(t) {
    var z = document.getElementById("journal");
    z.innerHTML += t + "<br>";
    z.scrollTop = z.scrollHeight;
  }
</script>"""

CODE_SOURIS = """<div id="boite" class="boite"
     onmouseover="journal('onmouseover : la souris entre')"
     onmouseout="journal('onmouseout : la souris sort')"
     onclick="journal('onclick : clic dans la boite')">
  Passez la souris ici
</div>

<style>
  .boite { width: 320px; height: 70px;
           background: #eaf2fb; border: 2px solid #1f4e79;
           text-align: center; line-height: 70px; }
</style>

<!-- onmousemove : à chaque pixel
     onmouseenter : une seule fois, sans les enfants -->"""

CODE_ENVOI = """<form action="traitement.php" method="post"
      onsubmit="return verifier()">

  <label for="nom">Nom :</label>
  <input type="text" id="nom" name="nom" required>

  <button type="submit">Envoyer</button>
</form>

<script>
  function verifier() {
    journal("onsubmit : formulaire envoyé");
    return false;   // empêche le rechargement
  }
</script>

<!-- onsubmit capte TOUS les envois :
     bouton submit, touche Entrée, .submit() -->"""

CODE_LECTEUR = """<video id="v" src="drapeau.mp4" controls
       width="420" poster="drapeau.png"
       onplay="journal('onplay : lecture démarrée')"
       onpause="journal('onpause : lecture en pause')"
       ontimeupdate="avancer()">
  Votre navigateur ne gère pas la vidéo.
</video>

<progress id="barre" value="0" max="100"></progress>

<script>
  function avancer() {
    var v = document.getElementById("v");
    var p = (v.currentTime / v.duration) * 100;
    document.getElementById("barre").value = p;
  }
</script>"""

CODE_LIENS = """<a href="cours.html">Lien vers le cours</a>

<style>
  /* l'ordre compte : LVHA */
  a:link    { color: #1f4e79; text-decoration: none; }
  a:visited { color: #7b3fa0; }
  a:hover   { color: #e67e22; text-decoration: underline; }
  a:active  { color: #c0392b; }
  a:focus-visible { outline: 3px solid #1f4e79; }
</style>

<!-- link    : jamais visité
     visited : déjà ouvert
     hover   : la souris passe
     active  : pendant le clic -->"""

CODE_FONDS = """<header class="bandeau">
  <h1>Lycée Raféha</h1>
</header>

<style>
  .bandeau {
    background-color: #1f4e79;
    background-image: url('drapeau.png');
    background-repeat: no-repeat;
    background-position: center;
    background-size: 60%;
    height: 200px;
    color: #ffffff;
    text-align: center;
  }
  .raccourci {
    background: #1f4e79 url('drapeau.png') no-repeat center / 60%;
  }
</style>

<!-- repeat : repeat | repeat-x | repeat-y | no-repeat
     size   : cover | contain | 300px 200px | 50%
     raccourci : couleur image repeat position / taille -->"""


CARTONS = {
    "sous_titre": "TP animé — Événements, liens et arrière-plans",
    "fichier": "evenements.html",
    "url": "evenements.html",
}


# ------------------------------------------------------------------ décors
def decor_bandeau(im, d, box, p, e):
    """Bandeau bleu + drapeau répété à sa taille naturelle, texte blanc."""
    x0, y0, x1, y1 = box
    bx0, by0 = x0 + 92, y0 + 150
    bx1, by1 = x1 - 46, by0 + 200
    d.rectangle([bx0, by0, bx1, by1], fill=(31, 78, 121))
    if p > 0.28:
        try:
            src = Image.open(R.DRAPEAU).convert("RGB")
        except Exception:
            src = Image.open(R.VIDEO_IMG).convert("RGB")
        tw = 150
        th = int(src.height * tw / src.width)
        tuile = src.resize((tw, th))
        for yy in range(by0, by1, th):
            for xx in range(bx0, bx1, tw):
                im.paste(tuile.crop((0, 0, min(tw, bx1 - xx), min(th, by1 - yy))), (xx, yy))
        d = ImageDraw.Draw(im)
        if p > 0.55:
            bande = Image.new("RGBA", (bx1 - bx0, 60), (10, 20, 34, 155))
            iy = by0 + 70
            im.paste(Image.alpha_composite(
                im.crop((bx0, iy, bx1, iy + 60)).convert("RGBA"), bande).convert("RGB"), (bx0, iy))
            d = ImageDraw.Draw(im)
            d.text(((bx0 + bx1) / 2, iy + 30), "Lycée Raféha", font=R.police(R.POLICE_B, 26),
                   fill=(255, 255, 255), anchor="mm")
    d.rectangle([bx0, by0, bx1, by1], outline=(31, 78, 121), width=3)
    d.text((bx0, by1 + 12), "height: 200px   ·   color: #ffffff   ·   background-size: 60%",
           font=R.police(R.MONO, 10), fill=(110, 120, 135))
    return {}


def decor_motifs(im, d, box, p, e):
    """Quatre vignettes comparatives (repeat / repeat-x / repeat-y / no-repeat)."""
    x0, y0, x1, y1 = box
    cases = [("repeat", "les deux sens"), ("repeat-x", "horizontal"),
             ("repeat-y", "vertical"), ("no-repeat", "une seule image")]
    try:
        src = Image.open(R.DRAPEAU).convert("RGB")
    except Exception:
        src = Image.open(R.VIDEO_IMG).convert("RGB")
    lw = int(((x1 - 26) - (x0 + 92) - 18) / 2)
    lh = 132
    zones = {}
    for i, (nom, sous) in enumerate(cases):
        cx = x0 + 92 + (i % 2) * (lw + 18)
        cy = y0 + 180 + (i // 2) * (lh + 42)
        actif = p > 0.34 + i * 0.14
        d.rounded_rectangle([cx - 2, cy - 2, cx + lw + 2, cy + lh + 2], radius=6,
                            outline=R.ORANGE if actif else (200, 210, 225), width=3 if actif else 1)
        cadre = Image.new("RGB", (lw, lh), (31, 78, 121))
        if actif:
            if i < 3:
                tw = 110 if i == 0 else 140
                th = int(tw * 3 / 4)
                tuile = src.resize((tw, th))
                xs = range(0, lw, tw) if i in (0, 1) else [(lw - tw) // 2]
                ys = range(0, lh, th) if i in (0, 2) else [(lh - th) // 2]
                for yy in ys:
                    for xx in xs:
                        cadre.paste(tuile.crop((0, 0, min(tw, lw - xx), min(th, lh - yy))), (xx, yy))
            else:
                tw, th = min(lw - 20, 190), min(lh - 10, 132)
                cadre.paste(src.resize((tw, th)), ((lw - tw) // 2, (lh - th) // 2))
        im.paste(cadre, (cx, cy))
        d = ImageDraw.Draw(im)
        d.rectangle([cx, cy, cx + 118, cy + 18], fill=(12, 18, 30))
        d.text((cx + 6, cy + 3), nom, font=R.police(R.MONO_B, 10), fill=(255, 255, 255))
        d.text((cx, cy + lh + 5), sous, font=R.police(R.POLICE, 10), fill=(90, 100, 115))
    return zones


SCENES = [
    dict(cle="intro", ep=None, voix=None, type="intro",
         titre="TP animé — Événements, liens et arrière-plans",
         episodes=[("ÉPISODE 1", "Document, champs, clics et saisie"),
                   ("ÉPISODE 2", "Clavier, souris, envoi et lecteur vidéo"),
                   ("ÉPISODE 3", "Liens LVHA et arrière-plans")],
         duree=10),

    dict(cle="document", ep=1, voix="a02.mp3", type="code", code=CODE_BASE,
         pages=[dict(debut=0.0, url="evenements.html", widgets=[
             dict(t="titre", texte="TP : événements et arrière-plans"),
             dict(t="journal", id="journal", hauteur=150,
                  lignes=["onload : la page est chargée"]),
             dict(t="texte", texte="Le journal écrit chaque événement : c'est notre fenêtre de vérité."),
         ])],
         texte="Bonjour et bienvenue dans ce TP pas à pas. Nous construisons, ligne après ligne, une page qui réagit à tout : au chargement, à la souris, au clavier, à la saisie, aux liens et à la vidéo. Prenez le temps de regarder à gauche le code et à droite la page qui répond. Commençons par le squelette : la déclaration doctype, la balise html avec lang égal fr, la balise head avec meta charset pour les accents et un titre, puis la balise style. Dans le style, le body reçoit une largeur maximale de neuf cents pixels, une marge automatique qui le centre et la police Arial. Le titre h1 prend le bleu de la charte. Ensuite vient la pièce maîtresse : la div qui porte l'identifiant journal, colorée en noir, avec un texte vert à chasse fixe, une hauteur de cent quarante pixels et un débordement automatique, ce qui ajoute une barre de défilement quand le texte dépasse. Puis la fonction journal, qui récupère la div par son identifiant, y ajoute la ligne reçue et fait défiler la zone jusqu'en bas avec scrollTop. Enfin, sur la balise body, l'attribut onload appelle cette fonction. Regardez à droite : la ligne onload apparaît toute seule, nous n'avons rien cliqué. Retenez le principe fondamental : un événement est un signal du navigateur, et un attribut qui commence par on est une fonction appelée quand ce signal arrive. Toute la suite du TP repose sur cette idée simple.",
         etapes=[dict(f=0.08, x=350, y=120), dict(f=0.24, x=360, y=330),
                 dict(f=0.4, x=380, y=430), dict(f=0.56, x=360, y=520),
                 dict(f=0.74, x=820, y=250, s="journal"),
                 dict(f=0.9, x=880, y=262, s="journal")]),

    dict(cle="champs", ep=1, voix="a03.mp3", type="code", code=CODE_CHAMPS,
         pages=[dict(debut=0.0, url="evenements.html", widgets=[
             dict(t="titre", texte="Champs et focus"),
             dict(t="input", id="nom", label="Nom :", valeur="", aide="onfocus / onblur"),
             dict(t="input", id="ville", label="Ville :", valeur="", aide="onfocus / onblur"),
             dict(t="journal", id="journal", hauteur=140,
                  lignes=["onfocus : champ nom", "onblur : champ nom",
                          "onfocus : champ ville"]),
         ])],
         texte="Deuxième famille d'événements : ceux des champs, et ils sont très utiles pour valider un formulaire. Chaque input porte un identifiant, et le label pointe dessus avec l'attribut for : cliquer sur le mot nom place directement le curseur dans la case, et un lecteur d'écran annonce correctement le champ. C'est la première bonne pratique à retenir. onfocus se déclenche au moment où le champ reçoit le focus, c'est-à-dire quand on clique dedans ou quand on arrive dessus avec la touche tabulation. onblur, à l'inverse, se déclenche à l'instant où le champ perd le focus, parce qu'on a cliqué ailleurs ou qu'on est passé au champ suivant. Regardez la souris : elle clique dans le champ du nom, le cadre devient bleu, une ligne onfocus s'écrit dans le journal. Puis elle passe au champ de la ville : onblur pour le nom, onfocus pour la ville, deux lignes de plus. C'est exactement ce couple qu'on utilise pour valider un champ au moment où l'élève le quitte : vérifier qu'il n'est pas vide, que le nom contient au moins deux lettres, ou que l'adresse comporte une arobase. On peut aussi y afficher une aide, un compteur ou un message d'erreur en rouge, sans jamais bloquer la saisie.",
         etapes=[dict(f=0.08, x=700, y=230), dict(f=0.22, x=900, y=210, s="nom", clic="nom", focus="nom"),
                 dict(f=0.38, x=900, y=210, s="nom", focus="nom"),
                 dict(f=0.54, x=700, y=270),
                 dict(f=0.7, x=900, y=252, s="ville", clic="ville", focus="ville"),
                 dict(f=0.86, x=1000, y=360, s="journal")]),

    dict(cle="clic", ep=1, voix="a04.mp3", type="code", code=CODE_CLIC,
         pages=[dict(debut=0.0, url="evenements.html", widgets=[
             dict(t="titre", texte="Le clic"),
             dict(t="boutons", items=[("Cliquer ici", (31, 78, 121), "b1")]),
             dict(t="liens", items=[("Lien cliquable", "normal", "lien1")]),
             dict(t="figure", id="img", taille=(150, 84), legende="drapeau.png  ·  onclick aussi"),
             dict(t="journal", id="journal", hauteur=100,
                  lignes=["onclick : bouton", "onclick : lien", "onclick : image"]),
         ])],
         texte="L'événement le plus connu, et le premier que l'on apprend : onclick. Il s'écrit sur un bouton, sur un lien, sur une image, sur un paragraphe, sur n'importe quel élément visible, et il réagit à un clic de souris comme à un appui sur la barre espace quand l'élément possède le focus. Ici, le bouton appelle la fonction journal avec un message. Sur le lien, il y a un détail qu'il faut absolument comprendre : après l'appel de la fonction, on ajoute return false. Sans cela, le navigateur suivrait l'adresse indiquée dans href, la page changerait et le journal serait aussitôt effacé ; return false annule le comportement par défaut du lien. La souris s'approche du bouton, le contour devient orange, puis elle clique : une onde apparaît sous le pointeur et une ligne s'écrit dans le journal. Même scénario sur le lien, puis sur l'image du drapeau. Retenez la différence essentielle : l'effet visuel du survol peut se faire uniquement en CSS avec la pseudo-classe hover, mais dès qu'il faut exécuter du code, compter, vérifier ou envoyer une donnée, c'est onclick. Pour un formulaire complet, on préfère onsubmit, que nous verrons dans l'épisode deux, parce qu'il capte aussi la touche Entrée.",
         etapes=[dict(f=0.08, x=700, y=300), dict(f=0.2, x=790, y=238, s="b1"),
                 dict(f=0.32, x=790, y=238, s="b1", clic="b1"),
                 dict(f=0.5, x=760, y=310), dict(f=0.64, x=800, y=296, s="lien1", clic="lien1"),
                 dict(f=0.8, x=770, y=400), dict(f=0.9, x=800, y=400, s="img", clic="img")]),

    dict(cle="saisie", ep=1, voix="a05.mp3", type="code", code=CODE_SAISIE,
         pages=[dict(debut=0.0, url="evenements.html", widgets=[
             dict(t="titre", texte="Saisie en direct"),
             dict(t="input", id="prenom", label="Prénom :", valeur="Aymen", aide="oninput"),
             dict(t="range", id="niv", label="Niveau :", part=0.5, sortie="10 / 20"),
             dict(t="journal", id="journal", hauteur=110,
                  lignes=["oninput : Aymen", "oninput : 14", "onchange : 14"]),
         ])],
         texte="Pour la saisie, deux événements se ressemblent et pourtant ne servent pas à la même chose. oninput se déclenche à chaque modification, lettre après lettre, à chaque déplacement du curseur : c'est lui qui permet l'affichage en direct, compter les caractères restants d'un commentaire, filtrer une liste pendant la frappe ou colorer un mot-clé dès qu'il est reconnu. onchange, lui, n'arrive qu'à la fin : quand on quitte le champ après l'avoir modifié, ou qu'on relâche le curseur d'une plage. C'est l'événement de la validation, pas celui de la frappe. Sur la page, la souris clique dans le champ du prénom et tape une lettre : chaque frappe écrit une ligne dans le journal. Puis elle attrape le curseur du niveau et le déplace : oninput met à jour la balise output à chaque pixel parcouru, et onchange n'écrit une seule ligne qu'au relâchement, ici quatorze. La règle pratique à retenir : oninput pour réagir tout de suite, onchange pour valider à la fin. Et n'oubliez pas la balise output, avec son identifiant : elle affiche le résultat d'un calcul, souvent pilotée par oninput, et c'est bien plus propre qu'une alerte qui obligerait l'élève à cliquer sur OK à chaque frappe.",
         etapes=[dict(f=0.08, x=700, y=280), dict(f=0.2, x=900, y=210, s="prenom", clic="prenom", k=["A"]),
                 dict(f=0.38, x=900, y=210, s="prenom", k=["y", "m"]),
                 dict(f=0.56, x=740, y=250), dict(f=0.72, x=940, y=252, s="niv", k=["→"]),
                 dict(f=0.88, x=1000, y=252, s="niv")]),

    dict(cle="clavier", ep=2, voix="a06.mp3", type="code", code=CODE_CLAVIER,
         pages=[dict(debut=0.0, url="evenements.html", widgets=[
             dict(t="titre", texte="Le clavier"),
             dict(t="input", id="touche", label="Tapez ici :", valeur="Bac", aide="onkeydown / onkeyup"),
             dict(t="journal", id="journal", hauteur=110,
                  lignes=["onkeydown : B", "onkeyup : B", "onkeydown : a"]),
         ])],
         texte="Épisode deux. Passons au clavier, avec deux événements symétriques. onkeydown se déclenche à l'instant où la touche s'enfonce, onkeyup à l'instant où elle se relâche. Entre les deux, la touche est maintenue : c'est ce qui permet de répéter une action, avancer dans un jeu, faire défiler une page, régler un volume. L'objet event transporte la propriété key, qui contient le nom de la touche : une lettre, Entrée, Tabulation, Flèche droite, Échap, Majuscule. Il transporte aussi ctrlKey, shiftKey et altKey pour savoir si une touche modificatrice était enfoncée, ce qui permet des raccourcis comme contrôle plus S pour enregistrer. Sur la page, la souris clique dans le champ, puis nous tapons les lettres B, a, c : à chaque appui, onkeydown écrit une ligne, à chaque relâchement, onkeyup en écrit une autre. Regardez bien les deux lignes produites par une seule frappe. C'est exactement ce mécanisme qui permet de bloquer une touche interdite, par exemple refuser les lettres dans un champ de note, de compter les caractères restants, ou de lancer une recherche dès qu'on appuie sur Entrée, sans bouton. Attention toutefois : sur un champ, la touche Tabulation déplace le focus, il faut donc la gérer avec précaution.",
         etapes=[dict(f=0.08, x=700, y=250), dict(f=0.2, x=900, y=210, s="touche", clic="touche", k=["B"]),
                 dict(f=0.4, x=900, y=210, s="touche", k=["a"]),
                 dict(f=0.6, x=900, y=210, s="touche", k=["c"]),
                 dict(f=0.8, x=1000, y=330, s="journal"),
                 dict(f=0.92, x=1000, y=350, s="journal")]),

    dict(cle="souris", ep=2, voix="a07.mp3", type="code", code=CODE_SOURIS,
         pages=[dict(debut=0.0, url="evenements.html", widgets=[
             dict(t="titre", texte="La souris"),
             dict(t="zone", id="boite", texte="Passez la souris ici", hauteur=70, largeur=380),
             dict(t="journal", id="journal", hauteur=110,
                  lignes=["onmouseover : la souris entre", "onmouseout : la souris sort",
                          "onclick : clic dans la boite"]),
         ])],
         texte="Troisième famille d'événements : la souris. onmouseover se déclenche quand le pointeur entre sur l'élément, onmouseout quand il en sort. Regardez bien le trajet : la souris arrive de la droite, entre dans la boîte, le fond devient orange clair et le journal écrit onmouseover ; elle ressort à gauche, onmouseout s'écrit ; elle revient et clique, onclick s'ajoute. Trois événements, trois lignes, une seule boîte. Il existe des variantes utiles à connaître : onmousemove se répète à chaque pixel parcouru, très pratique pour suivre la position du pointeur ou dessiner ; onmouseenter ressemble à onmouseover, mais ne se répète pas quand on passe sur les enfants de l'élément, ce qui évite des clignotements dans un menu. Attention à ne pas confondre l'effet visuel et le code : pour un simple changement de couleur au survol, le CSS suffit avec la pseudo-classe hover, c'est plus léger et cela fonctionne même sans JavaScript ; pour déclencher du code, on utilise les attributs de la souris. Et pour les écrans tactiles, le clic fonctionne au doigt, mais pas le survol : pensez donc toujours à une solution de repli.",
         etapes=[dict(f=0.06, x=1180, y=240), dict(f=0.2, x=1000, y=246, s="boite"),
                 dict(f=0.38, x=640, y=246), dict(f=0.54, x=800, y=246, s="boite"),
                 dict(f=0.7, x=800, y=246, s="boite", clic="boite"),
                 dict(f=0.86, x=1000, y=360, s="journal")]),

    dict(cle="envoi", ep=2, voix="a08.mp3", type="code", code=CODE_ENVOI,
         pages=[dict(debut=0.0, url="evenements.html", widgets=[
             dict(t="titre", texte="Envoyer un formulaire"),
             dict(t="input", id="nomf", label="Nom :", valeur="Ali", aide="required"),
             dict(t="boutons", items=[("Envoyer", (31, 78, 121), "btnEnv")]),
             dict(t="journal", id="journal", hauteur=100,
                  lignes=["onsubmit : formulaire envoyé"]),
         ])],
         texte="Le formulaire a lui aussi ses événements, et c'est souvent une question d'examen. onsubmit se déclenche au moment de l'envoi, que ce soit par un clic sur le bouton de type submit, par la touche Entrée dans un champ, ou par un appel de script. Pourquoi le placer sur la balise form plutôt que sur le bouton ? Justement parce que l'envoi peut arriver par plusieurs chemins, et que seul le formulaire les capte tous. Ici, la fonction verifier écrit une ligne dans le journal puis renvoie false : la page ne se recharge pas, le message reste visible et l'adresse ne change pas. Pour un vrai contrôle, on utilise event point preventDefault, on vérifie chaque champ, et on renvoie false seulement si une erreur est trouvée ; sinon on laisse partir la requête. Sur la page, la souris clique dans le champ, tape une lettre, puis clique sur envoyer : la ligne apparaît et la page ne bouge pas. Ajoutez maintenant l'attribut required sur le champ et essayez d'envoyer vide : le navigateur bloque l'envoi et affiche son propre message, sans une seule ligne de JavaScript. C'est le premier niveau de validation, gratuit et accessible ; le script, lui, sert pour les règles plus fines : mot de passe identique à la confirmation, note entre zéro et vingt, adresse d'un domaine précis.",
         etapes=[dict(f=0.08, x=700, y=250), dict(f=0.22, x=900, y=250, s="nomf", clic="nomf", k=["i"]),
                 dict(f=0.44, x=760, y=300), dict(f=0.6, x=790, y=296, s="btnEnv"),
                 dict(f=0.72, x=790, y=296, s="btnEnv", clic="btnEnv"),
                 dict(f=0.88, x=980, y=360, s="journal")]),

    dict(cle="lecteur-commandes", ep=2, voix="a09.mp3", type="code", code=CODE_LECTEUR,
         pages=[dict(debut=0.0, url="evenements.html", widgets=[
             dict(t="titre", texte="Le lecteur vidéo, commande par commande"),
             dict(t="soustitre", texte="controls : lecture, progression, volume, vitesse, plein écran"),
             dict(t="player", id="lecteur", temps=0.30, legende="drapeau.mp4", largeur=520),
             dict(t="journal", id="journal", hauteur=64, lignes=["onplay : lecture démarrée"]),
         ])],
         texte="Arrêtons-nous maintenant sur le lecteur vidéo, commande par commande, parce qu'un élève doit savoir nommer ce qu'il utilise. Le lecteur apparaît dès que la balise video porte l'attribut controls, sans valeur. À gauche, le bouton lecture et pause : un premier clic lance la vidéo et l'icône devient deux barres verticales, un second clic arrête l'image sur la dernière position atteinte ; au clavier, la barre espace fait exactement la même chose, et la lettre K aussi. Vient ensuite la barre de progression : le trait gris représente la durée totale, le trait orange la partie déjà lue, le rond blanc la position courante. Un clic n'importe où sur cette barre déplace la lecture à cet instant. Puis le haut-parleur, qui coupe le son d'un clic, l'icône barrée d'une croix, et un second clic rétablit le niveau précédent. À côté, le réglage de vitesse, un x, propose zéro virgule cinq, un, un virgule cinq et deux. Enfin le plein écran, dessiné par quatre coins blancs, et la sortie par Échap. Pour finir, l'attribut poster affiche une image d'attente avant la lecture, et la balise source permet de proposer plusieurs formats. Sur l'écran, la souris passe sur chaque commande : elle s'orange avant le clic, pour que le geste soit bien visible.",
         etapes=[dict(f=0.06, x=740, y=420), dict(f=0.12, x=724, y=418, s="btn-play", q="Lecture / pause",
                                                  qc="btn-play"),
                 dict(f=0.2, x=724, y=418, s="btn-play", clic="btn-play"),
                 dict(f=0.3, x=850, y=418, s="btn-seek", q="clic : aller à cet instant", qc="btn-seek"),
                 dict(f=0.38, x=850, y=418, s="btn-seek", clic="btn-seek"),
                 dict(f=0.46, x=1085, y=418, s="btn-volume", q="Volume · M pour couper", qc="btn-volume"),
                 dict(f=0.52, x=1122, y=418, s="btn-speed", q="Vitesse : 0,5x à 2x", qc="btn-speed"),
                 dict(f=0.58, x=1150, y=418, s="btn-full", q="Plein écran · F", qc="btn-full"),
                 dict(f=0.7, x=900, y=520), dict(f=0.86, x=980, y=600, s="journal")]),

    dict(cle="lecteur-evenements", ep=2, voix="a10.mp3", type="code", code=CODE_LECTEUR,
         pages=[dict(debut=0.0, url="evenements.html", widgets=[
             dict(t="titre", texte="Suivre la lecture : ontimeupdate"),
             dict(t="player", id="lecteur", temps=0.55, legende="drapeau.mp4", largeur=520),
             dict(t="range", id="barre", label="Progression :", part=0.55, sortie="55 %"),
             dict(t="journal", id="journal", hauteur=56, lignes=["ontimeupdate : 55 %"]),
         ])],
         texte="Le lecteur vidéo possède aussi ses propres événements, et ils sont très utiles pour vérifier qu'un élève a réellement regardé la capsule. onplay se déclenche au démarrage de la lecture, onpause à la mise en pause, onended à la fin du fichier : ces trois-là suffisent pour compter les ouvertures et les abandons. Le plus important est ontimeupdate : il se répète pendant toute la lecture, environ quatre fois par seconde, et il transporte deux informations, currentTime, la position en secondes, et duration, la durée totale. En divisant l'un par l'autre et en multipliant par cent, on obtient un pourcentage : c'est exactement ce que fait la fonction avancer de notre exemple, qui remplit une balise progress et affiche cinquante-cinq pour cent. Cette valeur est celle qu'on envoie ensuite à la base de données pour reprendre la vidéo plus tard, exactement à la seconde où l'élève s'était arrêté : c'est le principe du reprendre là où on s'est arrêté, que vous connaissez dans les plateformes de cours. Il faut toutefois ne pas envoyer une requête à chaque déclenchement : on stocke la valeur localement et on l'envoie toutes les dix secondes environ, pour ne pas saturer le réseau. Avec trois événements, on peut donc suivre sérieusement le visionnage.",
         etapes=[dict(f=0.08, x=740, y=420), dict(f=0.2, x=724, y=418, s="btn-play", q="onplay : lecture",
                                                  qc="btn-play"),
                 dict(f=0.32, x=724, y=418, s="btn-play", clic="btn-play", q="onpause : arrêt",
                       qc="btn-play"),
                 dict(f=0.5, x=860, y=560, s="barre"),
                 dict(f=0.66, x=860, y=520, s="barre", q="ontimeupdate : 55 %", qc="barre"),
                 dict(f=0.82, x=980, y=610, s="journal"),
                 dict(f=0.92, x=1000, y=620, s="journal")]),

    dict(cle="liens", ep=3, voix="a11.mp3", type="code", code=CODE_LIENS,
         pages=[dict(debut=0.0, url="evenements.html", widgets=[
             dict(t="titre", texte="Les quatre états d'un lien"),
             dict(t="soustitre", texte="link → visited → hover → active"),
             dict(t="etats", id="etats", hauteur=170,
                  items=[("e1", "normal", "a:link", "1er — jamais visité"),
                         ("e2", "visited", "a:visited", "2e — déjà ouvert"),
                         ("e3", "hover", "a:hover", "3e — la souris passe"),
                         ("e4", "active", "a:active", "4e — pendant le clic")]),
             dict(t="espace", hauteur=10),
             dict(t="table", id="t", entetes=["Ordre", "Règle CSS", "Couleur"],
                  lignes=[["1", "a:link", "bleu #1f4e79"],
                          ["2", "a:visited", "violet #7b3fa0"],
                          ["3", "a:hover", "orange #e67e22"],
                          ["4", "a:active", "rouge #c0392b"]],
                  largeurs=[80, 170, 200]),
         ])],
         texte="Épisode trois : les liens, et un vocabulaire précis à connaître. Une ancre a connaît quatre états, et le CSS les nomme avec des pseudo-classes, c'est-à-dire des mots précédés de deux points qui décrivent une situation. link, c'est le lien jamais visité : ici le bleu de la charte. visited, c'est le lien déjà ouvert par l'élève : il devient violet, ce qui aide beaucoup à voir ce qu'on a déjà consulté. hover, c'est le survol, quand la souris passe sur le lien : la couleur devient orange et le soulignement apparaît. active, enfin, c'est l'instant du clic, entre l'appui et le relâchement : la couleur passe au rouge. Regardez la page : les quatre états sont montrés côte à côte pour que la différence soit visible immédiatement, et la souris passe sur chacun d'eux. On peut aussi agir sur la décoration : text-decoration none retire le soulignement, underline l'ajoute, et focus-visible dessine un contour pour les élèves qui naviguent au clavier avec la touche tabulation. Un lien doit rester reconnaissable : changez la couleur si vous voulez, mais gardez toujours un contraste suffisant et un signe distinctif, sinon l'utilisateur ne saura pas que c'est cliquable.",
         etapes=[dict(f=0.08, x=420, y=400), dict(f=0.18, x=430, y=230, s="e1", q="a:link — jamais visité",
                                                   qc="e1"),
                 dict(f=0.34, x=650, y=230, s="e2", q="a:visited — déjà ouvert", qc="e2"),
                 dict(f=0.5, x=880, y=230, s="e3", q="a:hover — la souris passe", qc="e3"),
                 dict(f=0.64, x=1110, y=230, s="e4", q="a:active — pendant le clic", qc="e4"),
                 dict(f=0.82, x=700, y=470, s="t")]),

    dict(cle="lvha", ep=3, voix="a12.mp3", type="lvha",
         pages=[dict(debut=0.0, url="evenements.html", widgets=[
             dict(t="titre", texte="L'ordre à retenir : LVHA"),
             dict(t="soustitre", texte="link → visited → hover → active, dans cet ordre"),
             dict(t="etats", id="etats", hauteur=170,
                  items=[("e1", "normal", "a:link", "écrit en premier"),
                         ("e2", "visited", "a:visited", "puis visited"),
                         ("e3", "hover", "a:hover", "puis hover"),
                         ("e4", "active", "a:active", "active en dernier")]),
             dict(t="espace", hauteur=10),
             dict(t="zone", id="mauvais", hauteur=64, largeur=520,
                  texte="hover écrit avant link : le lien reste orange au repos"),
             dict(t="texte", texte="Même force, plus bas dans la feuille = gagnant."),
         ])],
         texte="Voici le piège classique du bac, et il tombe presque chaque année : l'ordre des quatre règles de lien. Le navigateur applique la dernière règle de même force, c'est-à-dire celle qui est écrite le plus bas dans la feuille de style. Si vous écrivez hover avant link, alors la règle link, écrite plus bas, gagne sur le survol, et le lien garde la couleur du repos quand la souris passe ; inversement, si hover est écrit après link mais avant visited, un lien déjà visité reprendra la couleur du survol même quand la souris sera partie. L'ordre correct, et il faut le mémoriser, est LVHA : link, visited, hover, active, dans cet ordre de haut en bas. Une phrase pour s'en souvenir : le lien, puis le lien visité, puis le lien survolé, puis le lien actif. Sur l'écran, les quatre états sont montrés côte à côte avec leur numéro d'ordre, puis la souris passe sur chacun d'eux pour que vous voyiez la différence : bleu au repos, violet une fois visité, orange au survol, rouge à l'appui. Et si vous ajoutez focus-visible pour les élèves qui naviguent au clavier, placez-le après hover, pour la même raison. Retenez la règle générale : à force égale, l'ordre d'écriture décide.",
         etapes=[dict(f=0.08, x=430, y=300), dict(f=0.2, x=430, y=230, s="e1"),
                 dict(f=0.36, x=650, y=230, s="e2"),
                 dict(f=0.5, x=880, y=230, s="e3"),
                 dict(f=0.64, x=1110, y=230, s="e4"),
                 dict(f=0.8, x=760, y=480, s="mauvais")]),

    dict(cle="fonds", ep=3, voix="a13.mp3", type="code", code=CODE_FONDS,
         pages=[
             dict(debut=0.0, url="evenements.html", widgets=[
                 dict(t="titre", texte="Le bandeau et son arrière-plan"),
                 dict(t="soustitre", texte="background-color + background-image + size"),
             ], decor=decor_bandeau),
             dict(debut=0.55, url="evenements.html", widgets=[
                 dict(t="titre", texte="background-repeat : quatre valeurs"),
                 dict(t="soustitre", texte="une seule propriété change à chaque essai"),
             ], decor=decor_motifs),
         ],
         texte="Dernière partie : les arrière-plans, avec trois propriétés à ne pas confondre, et un raccourci bien pratique. background-color pose une couleur unie derrière le contenu : elle remplit toute la boîte, y compris là où l'image ne va pas, et derrière les zones transparentes. background-image pose une image, avec la notation url entre parenthèses et le chemin du fichier entre apostrophes : ici le drapeau du lycée. background-repeat décide si l'image se répète : repeat, la valeur par défaut, la répète dans les deux sens jusqu'à remplir la boîte ; repeat-x seulement horizontalement, donc en une bande, et l'espace au-dessus laisse voir la couleur de fond ; repeat-y seulement verticalement ; no-repeat n'affiche qu'une seule image. background-size règle sa taille : cover agrandit l'image pour couvrir toute la boîte, quitte à la rogner ; contain garde l'image entière et laisse des marges remplies par la couleur ; on peut aussi imposer trois cents pixels sur deux cents, ou cinquante pour cent. Enfin la propriété raccourcie background réunit tout en une ligne : la couleur, l'image, la répétition, la position, puis obligatoirement une barre oblique et la taille, sinon le navigateur prend la taille pour une position. Sur l'écran, le bandeau reçoit le bleu et le drapeau, puis les quatre valeurs de repeat sont comparées côte à côte. Pour un drapeau unique : no-repeat. Pour une frise : repeat-x. Pour un fond plein écran : cover.",
         etapes=[dict(f=0.08, x=700, y=300), dict(f=0.2, x=900, y=300),
                 dict(f=0.34, x=1000, y=330), dict(f=0.48, x=1000, y=360),
                 dict(f=0.6, x=300, y=230), dict(f=0.72, x=300, y=400),
                 dict(f=0.84, x=760, y=230), dict(f=0.93, x=760, y=400)]),

    dict(cle="fin", ep=None, voix=None, type="fin",
         lignes=["Document : onload · journal pour tout tracer",
                 "Champs : onfocus, onblur · saisie : oninput, onchange",
                 "Clavier : onkeydown, onkeyup · souris : onmouseover, onmouseout",
                 "Formulaire : onsubmit + return false · médias : onplay, onpause, ontimeupdate",
                 "Liens : link, visited, hover, active — ordre LVHA",
                 "Arrière-plans : color, image, repeat, size, raccourci"],
         pied="Enseignant : Aymen Essouyah  ·  Lycée Raféha  ·  3e & 4e SI",
         titre="TP terminé — à vous de jouer !",
         duree=12),
]
