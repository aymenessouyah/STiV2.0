"""Les neuf scènes de « L'objet Date ».

L'écran est coupé en deux, du début à la fin :

  * **à gauche** — la fiche, et surtout **le calendrier de septembre 2026**
    avec le 15 encerclé, puis **la bande des douze mois** avec leurs deux
    numéros (0 → 11 et 1 → 12). C'est de là que sortent `getDate`,
    `getMonth` et `getFullYear` ;
  * **à droite** — le code JavaScript dans sa console noire, puis sa sortie.

Pour les exercices, la coupure change de sens : **l'énoncé à gauche**, la
**correction détaillée à droite**, ligne par ligne.

Le titre de chapitre est lu dans `narration.py` : le repère du menu et l'écran
ne peuvent pas diverger.
"""
from __future__ import annotations

from PIL import ImageDraw

from theme import (
    FOND, FOND_PANNEAU, FOND_PANNEAU_2, BORDURE, TEXTE, TEXTE_2, TEXTE_3,
    ORANGE, AMBRE, VIOLET, VERT, BLEU, ROSE, ROUGE_BORD,
    police, melange, boite_arrondie, fleche,
)
import dessin as G
from dessin import (
    LARGEUR, HAUTEUR, MARGE, GAUCHE, DROITE, BANDE,
    PAPIER, ENCRE, ROUGE_STYLO, CODE_FOND,
    fond, panneau, papier, console, barrer, calendrier, bande_mois, horloge, MOIS,
)
import narration as N

TOTAL = len(N.ORDRE)

# ── les deux moitiés ───────────────────────────────────────────────────────
G_TITRE = "la fiche et le calendrier"
D_TITRE = "le code"
X = GAUCHE[0] + 22          # marge intérieure du papier
Y0 = GAUCHE[1] + 62         # première ligne du papier
PAS = 34                    # interligne de la fiche
CODE_X = DROITE[0] + 44
CODE_Y = DROITE[1] + 104

# Le calendrier : 7 colonnes de 54 px, il tient dans la moitié gauche.
CAL_X = GAUCHE[0] + 46
CAL_Y = 330
CASE = 50


# ══════════════════════════════════════════════════════════════════════════
#  L'en-tête et les deux panneaux
# ══════════════════════════════════════════════════════════════════════════
def _entete(d, cle):
    d.text((MARGE, 44), "CAPSULE · JAVASCRIPT · L'OBJET DATE",
           font=police(19, True), fill=ORANGE)
    d.text((MARGE, 74), "L'objet Date : le jour, le mois, l'année",
           font=police(41, True), fill=TEXTE)
    d.text((MARGE, 138), f"{N.numero(cle)} · {N.SECTIONS[cle]['titre']}",
           font=police(23), fill=TEXTE_2)
    x1 = LARGEUR - MARGE
    d.text((x1, 50), f"ÉTAPE {N.numero(cle)} / {TOTAL}", font=police(22, True),
           fill=TEXTE_2, anchor="ra")
    y = 174
    d.rounded_rectangle([MARGE, y, x1, y + 6], radius=3, fill=(26, 38, 58))
    d.rounded_rectangle([MARGE, y, MARGE + (x1 - MARGE) * N.numero(cle) / TOTAL, y + 6],
                        radius=3, fill=ORANGE)


def _deux(d, gauche=G_TITRE, droite=D_TITRE, accent_g=AMBRE, accent_d=VERT):
    panneau(d, GAUCHE, gauche, accent=melange(BORDURE, accent_g, 0.55))
    panneau(d, DROITE, droite, accent=melange(BORDURE, accent_d, 0.55))


def _bandeau(d, gauche="", droite="", couleur=TEXTE_2):
    boite_arrondie(d, BANDE, rayon=16, fond=FOND_PANNEAU_2,
                   bord=melange(BORDURE, ORANGE, 0.35), largeur_bord=2)
    d.text((BANDE[0] + 26, (BANDE[1] + BANDE[3]) / 2), gauche, font=police(19),
           fill=TEXTE_3, anchor="lm")
    d.text((BANDE[2] - 26, (BANDE[1] + BANDE[3]) / 2), droite,
           font=police(21, True), fill=couleur, anchor="rm")


# ══════════════════════════════════════════════════════════════════════════
#  Les primitives de la fiche (à gauche) et du code (à droite)
# ══════════════════════════════════════════════════════════════════════════
def _apparait(p, seuil, duree=0.10):
    if p <= seuil:
        return 0.0
    return max(0.0, min(1.0, (p - seuil) / max(0.01, duree)))


def _ligne(d, i, texte, taille=24, couleur=ENCRE, seuil=0.0, p=1.0, gras=False, x=None):
    k = _apparait(p, seuil, 0.12)
    if k <= 0:
        return
    d.text((X if x is None else x, Y0 + i * PAS), texte, font=police(taille, gras),
           fill=melange(PAPIER, couleur, k), anchor="la")


def _note(d, i, texte, taille=22, couleur=ROUGE_STYLO, seuil=0.0, p=1.0, x=None):
    """Une ligne écrite au stylo rouge : l'idée à retenir."""
    k = _apparait(p, seuil, 0.12)
    if k <= 0:
        return
    d.text((X if x is None else x, Y0 + i * PAS), texte, font=police(taille, True),
           fill=melange(PAPIER, couleur, k), anchor="la")


def _sous_titre(d, y, texte, couleur=AMBRE, p=1.0, seuil=0.0, x=None):
    k = _apparait(p, seuil, 0.12)
    if k <= 0:
        return
    d.text((CAL_X if x is None else x, y), texte, font=police(19, True),
           fill=melange(PAPIER, couleur, k), anchor="la")


def _code(d, lignes, seuil=0.06, pas=0.07, taille=21, numeros=True, y=None):
    """Le code tapé dans la console, ligne à la fois, avec ses numéros."""
    y = CODE_Y if y is None else y
    for i, ligne in enumerate(lignes):
        if ligne is None:
            y += taille + 12
            continue
        k = _apparait(p_global[0], seuil + pas * i, 0.09)
        if k <= 0:
            break
        visible = ligne[: max(1, int(len(ligne) * k + 0.999))]
        if numeros:
            d.text((CODE_X - 6, y), str(i + 1), font=police(taille - 5, True, mono=True),
                   fill=melange(CODE_FOND, TEXTE_3, 0.85 * k), anchor="rm")
        couleur = VERT if ligne.strip().startswith(("//", "/*")) else TEXTE
        d.text((CODE_X + 18, y), visible, font=police(taille, False, mono=True),
               fill=melange(CODE_FOND, couleur, k), anchor="lm")
        y += taille + 12
    return y


p_global = [1.0]   # la progression courante, lue par `_code`


def _sortie(d, lignes, titre="console", y=None, seuil=0.0):
    """Le panneau « sortie de la console » : ce que le programme affiche."""
    y = 712 if y is None else y
    box = [DROITE[0] + 16, y, DROITE[2] - 16, DROITE[3] - 16]
    boite_arrondie(d, box, rayon=14, fond=(8, 14, 22),
                   bord=melange(BORDURE, BLEU, 0.55), largeur_bord=2)
    d.text((box[0] + 18, box[1] + 18), titre, font=police(15, True),
           fill=melange(CODE_FOND, BLEU, 0.9), anchor="la")
    yy = box[1] + 52
    for i, ligne in enumerate(lignes):
        k = _apparait(p_global[0], seuil + 0.05 * i, 0.09)
        if k <= 0:
            break
        d.text((box[0] + 22, yy), ligne, font=police(19, True, mono=True),
               fill=melange(CODE_FOND, TEXTE_2, 0.95 * k), anchor="lm")
        yy += 30
    return box


def _etiquette(d, x, y, texte, couleur, p=1.0, taille=17, seuil=0.0):
    k = _apparait(p, seuil, 0.10)
    if k <= 0:
        return
    largeur = police(taille, True).getlength(texte) + 26
    boite_arrondie(d, [x, y - 15, x + largeur, y + 15], rayon=15,
                   fond=melange(FOND_PANNEAU_2, couleur, 0.20 * k),
                   bord=melange(FOND_PANNEAU_2, couleur, 0.75 * k), largeur_bord=2)
    d.text((x + 13, y), texte, font=police(taille, True),
           fill=melange(FOND_PANNEAU_2, couleur, k), anchor="lm")


def _calendrier(d, p, seuil=0.0, actif=15, couleur=AMBRE, y=CAL_Y):
    k = _apparait(p, seuil, 0.26)
    if k <= 0:
        return
    calendrier(d, CAL_X, y, case=CASE, actif=actif, couleur=couleur, k=k)


def _mois(d, p, seuil=0.0, actif=8, couleur=VIOLET, y=430):
    k = _apparait(p, seuil, 0.26)
    if k <= 0:
        return
    bande_mois(d, CAL_X, y, largeur_case=66, actif=actif, couleur=couleur, k=k)


def _fleche_gauche(d, y, texte, couleur=BLEU, p=1.0, seuil=0.0):
    """Le lien « cette méthode sort d'ici », du calendrier vers la ligne."""
    k = _apparait(p, seuil, 0.12)
    if k <= 0:
        return
    d.text((CAL_X, y), "↑ " + texte, font=police(17, True),
           fill=melange(PAPIER, couleur, k), anchor="la")


# ══════════════════════════════════════════════════════════════════════════
#  1 · Bienvenue
# ══════════════════════════════════════════════════════════════════════════
def scene_ouverture(d, p, t):
    p_global[0] = p
    _entete(d, "ouverture")
    panneau(d, GAUCHE, "ce qu'on va voir", accent=melange(BORDURE, AMBRE, 0.55))
    panneau(d, DROITE, "le code, et rien que le code",
            accent=melange(BORDURE, VERT, 0.55))

    blocs = [
        ("créer une date", "new Date()  ·  new Date(\"2026-09-15\")", BLEU, 0.08),
        ("lire le jour et l'année", "getDate()  ·  getFullYear()", AMBRE, 0.20),
        ("lire le mois — le piège", "getMonth() : 0 → 11", ROSE, 0.32),
        ("afficher la date", "toString()  ·  l'exemple complet", VERT, 0.44),
    ]
    y = 240
    for nom, detail, couleur, seuil in blocs:
        k = _apparait(p, seuil, 0.12)
        if k <= 0:
            y += 104
            continue
        boite_arrondie(d, [96, y, 884, y + 86], rayon=16,
                       fond=melange(FOND_PANNEAU_2, couleur, 0.12 * k),
                       bord=melange(BORDURE, couleur, 0.60 * k), largeur_bord=2)
        d.text((120, y + 18), nom, font=police(25, True),
               fill=melange(FOND, couleur, k), anchor="la")
        d.text((120, y + 54), detail, font=police(16, False, mono=True),
               fill=melange(FOND, TEXTE_2, k), anchor="la")
        y += 104

    _sous_titre(d, 668, "la date de toute la capsule", TEXTE_3, p, 0.56)
    _calendrier(d, p, 0.60, actif=15, couleur=AMBRE, y=696)

    console(d, [DROITE[0] + 16, DROITE[1] + 16, DROITE[2] - 16, DROITE[1] + 300])
    lignes = [
        'let d = new Date("2026-09-15T08:00:00");',
        "// → la rentrée au Lycée Rafèha",
    ]
    yy = DROITE[1] + 82
    for i, ligne in enumerate(lignes):
        k = _apparait(p, 0.26 + 0.14 * i, 0.10)
        if k <= 0:
            break
        d.text((CODE_X + 10, yy), ligne, font=police(21, True, mono=True),
               fill=melange(CODE_FOND, VERT if i else TEXTE, k), anchor="lm")
        yy += 44

    _etiquette(d, DROITE[0] + 40, DROITE[1] + 210, "getMonth() : janvier = 0",
               ROSE, p, taille=16, seuil=0.56)
    _etiquette(d, DROITE[0] + 40, DROITE[1] + 252, "septembre = 8 — d'où le + 1",
               AMBRE, p, taille=16, seuil=0.66)

    _bandeau(d, "créer, lire, afficher une date",
             "le mois commence à zéro", AMBRE)


# ══════════════════════════════════════════════════════════════════════════
#  2 · La date du jour
# ══════════════════════════════════════════════════════════════════════════
def scene_date_courante(d, p, t):
    p_global[0] = p
    _entete(d, "date_courante")
    _deux(d, "new Date() : maintenant", "la date de l'ordinateur")

    _ligne(d, 0, "Sans argument : la date et l'heure courantes,", 24, ENCRE, 0.06, p)
    _ligne(d, 1, "lues sur l'ordinateur, au moment de l'exécution.", 24, ENCRE, 0.12, p)

    k = _apparait(p, 0.22, 0.20)
    if k > 0:
        horloge(d, CAL_X - 22, 300, jour=30, mois_num=10, annee=2026, couleur=BLEU, k=k)

    _ligne(d, 7, "let auj = new Date();", 23, BLEU, 0.42, p, gras=True)
    _ligne(d, 8, "auj.getFullYear()  →  2026", 23, AMBRE, 0.52, p, gras=True)
    _note(d, 10, "Le résultat change à chaque exécution :", 21, ROUGE_STYLO, 0.62, p)
    _note(d, 11, "il dépend de l'horloge de l'utilisateur.", 21, ROUGE_STYLO, 0.68, p)
    _ligne(d, 13, "Donc jamais de réponse figée dans un exercice :", 21, TEXTE_2, 0.78, p)
    _ligne(d, 14, "on écrit le code qui l'affiche.", 21, TEXTE_2, 0.84, p)

    _code(d, [
        "let auj = new Date();",
        "console.log(auj.getFullYear());",
        'console.log("Bienvenue au Lycée Rafèha, nous sommes en " + auj.getFullYear());',
    ], seuil=0.14, taille=19)
    _sortie(d, ["2026", "Bienvenue au Lycée Rafèha, nous sommes en 2026"],
            titre="ce que la console affiche", y=660, seuil=0.44)
    _bandeau(d, "new Date() = maintenant", "l'année change d'une machine à l'autre", BLEU)


# ══════════════════════════════════════════════════════════════════════════
#  3 · Une date à partir d'une chaîne
# ══════════════════════════════════════════════════════════════════════════
def scene_date_chaine(d, p, t):
    p_global[0] = p
    _entete(d, "date_chaine")
    _deux(d, "new Date(ch) : une date écrite", "AAAA-MM-JJ, le format sûr")

    _ligne(d, 0, "ANNÉE - MOIS - JOUR", 26, VERT, 0.06, p, gras=True)
    _ligne(d, 1, "2026 - 09 - 15", 26, VERT, 0.12, p, gras=True)
    _ligne(d, 3, "puis, si besoin :  T08:00:00", 22, TEXTE_2, 0.20, p)

    k = _apparait(p, 0.24, 0.16)
    if k > 0:
        boite_arrondie(d, [X, 326, GAUCHE[2] - 24, 430], rayon=14,
                       fond=melange(FOND_PANNEAU_2, VERT, 0.12 * k),
                       bord=melange(BORDURE, VERT, 0.60 * k), largeur_bord=2)
        d.text((X + 22, 350), 'new Date("2026-09-15T08:00:00")',
               font=police(20, False, mono=True), fill=melange(FOND, TEXTE, k), anchor="la")
        d.text((X + 22, 386), "→ 15 septembre 2026, 08:00  (la rentrée)",
               font=police(17, True), fill=melange(FOND, VERT, k), anchor="la")

    _note(d, 6, "Journal/Mois/Année n'est PAS fiable", 22, ROUGE_STYLO, 0.44, p)
    _note(d, 7, 'new Date("15/09/2026") → Invalid Date', 21, ROUGE_STYLO, 0.52, p)
    _ligne(d, 9, "Invalid Date n'arrête pas le programme :", 21, TEXTE_2, 0.62, p)
    _ligne(d, 10, "c'est une date invalide, ses méthodes répondent NaN.", 21, TEXTE_2, 0.68, p)

    _code(d, [
        'let d = new Date("2026-09-15T08:00:00");',
        'let e = new Date("2026-09-15");',
        'console.log(new Date("Lycée Rafèha"));',
        "console.log(d.getDate());",
        "console.log(e.getDate());",
    ], seuil=0.10, taille=19)
    _sortie(d, ["Invalid Date", "15", "15"],
            titre="ce que la console affiche", y=640, seuil=0.42)
    _bandeau(d, "AAAA-MM-JJ : le seul format sûr", "sinon : Invalid Date", VERT)


# ══════════════════════════════════════════════════════════════════════════
#  4 · Le jour du mois
# ══════════════════════════════════════════════════════════════════════════
def scene_getdate(d, p, t):
    p_global[0] = p
    _entete(d, "getdate")
    _deux(d, "getDate() : le jour du mois", "un entier de 1 à 31")

    _ligne(d, 0, "d.getDate()  →  15", 27, AMBRE, 0.06, p, gras=True)
    _ligne(d, 1, "le jour dans le mois, entre 1 et 31", 22, TEXTE_2, 0.12, p)

    # le calendrier porte lui-même son titre (« septembre 2026 ») : pas de doublon
    _calendrier(d, p, 0.18, actif=15, couleur=AMBRE, y=330)
    _fleche_gauche(d, 668, "getDate() lit ce numéro-là", AMBRE, p, 0.44)

    _note(d, 14, "PIÈGE : getDate() ≠ jour de la semaine", 21, ROUGE_STYLO, 0.56, p)
    _ligne(d, 15, "le 15 septembre 2026 est un mardi → 15, pas « mardi »", 20, TEXTE_2, 0.64, p)
    _ligne(d, 17, "getDay() existe (hors fiche) pour le jour de la semaine.", 20, TEXTE_3, 0.80, p)

    _code(d, [
        'let d = new Date("2026-09-15T08:00:00");',
        "console.log(d.getDate());",
        "console.log(d.getDate() + 1);",
    ], seuil=0.12, taille=20)
    _sortie(d, ["15", "16"], titre="ce que la console affiche", y=700, seuil=0.48)
    _bandeau(d, "getDate() : jour du mois, 1 → 31", "pas le jour de la semaine", AMBRE)


# ══════════════════════════════════════════════════════════════════════════
#  5 · Le numéro du mois — le piège
# ══════════════════════════════════════════════════════════════════════════
def scene_getmonth(d, p, t):
    p_global[0] = p
    _entete(d, "getmonth")
    _deux(d, "getMonth() : 0 → 11, le piège", "et le tableau des douze mois")

    _ligne(d, 0, "d.getMonth()      →  8   (septembre)", 23, ROSE, 0.06, p, gras=True)
    _ligne(d, 1, "d.getMonth() + 1  →  9   (le numéro habituel)", 23, AMBRE, 0.14, p, gras=True)

    _sous_titre(d, 348, "les douze mois, leurs DEUX numéros", VIOLET, p, 0.22)
    _mois(d, p, 0.24, actif=8, couleur=VIOLET, y=380)
    d.text((CAL_X, 472), "numéro JavaScript (0 → 11)   ·   (numéro habituel, 1 → 12)",
           font=police(15), fill=melange(PAPIER, TEXTE_3, _apparait(p, 0.34)), anchor="la")

    k = _apparait(p, 0.50, 0.14)
    if k > 0:
        boite_arrondie(d, [X, 528, GAUCHE[2] - 24, 618], rayon=12,
                       fond=melange(FOND_PANNEAU_2, VIOLET, 0.10 * k),
                       bord=melange(BORDURE, VIOLET, 0.55 * k), largeur_bord=2)
        for i, ligne in enumerate([
            'let mois = ["janvier", "février", "mars", …];',
            'mois[d.getMonth()]  →  "septembre"',
        ]):
            d.text((X + 20, 550 + i * 34), ligne, font=police(17, False, mono=True),
                   fill=melange(FOND, VERT if i else TEXTE, k), anchor="la")

    _note(d, 15, "Tableau : pas de + 1 — il est déjà rangé à partir de 0.", 20, ROUGE_STYLO, 0.68, p)
    _ligne(d, 16, "Numéro habituel : + 1.  Nom en lettres : le tableau.", 20, VERT, 0.76, p)

    _code(d, [
        'let d = new Date("2026-09-15T08:00:00");',
        "console.log(d.getMonth());",
        "console.log(d.getMonth() + 1);",
        'let mois = ["janvier", "février", "mars", "avril",',
        '            "mai", "juin", "juillet", "août",',
        '            "septembre", "octobre", "novembre", "décembre"];',
        "console.log(mois[d.getMonth()]);",
    ], seuil=0.08, taille=17)
    _sortie(d, ["8", "9", "septembre"], titre="ce que la console affiche", y=720, seuil=0.40)
    _bandeau(d, "janvier = 0 · septembre = 8 · décembre = 11", "+ 1 pour un humain", ROSE)


# ══════════════════════════════════════════════════════════════════════════
#  6 · L'année
# ══════════════════════════════════════════════════════════════════════════
def scene_getfullyear(d, p, t):
    p_global[0] = p
    _entete(d, "getfullyear")
    _deux(d, "getFullYear() : sur 4 chiffres", "et les trois morceaux assemblés")

    _ligne(d, 0, "d.getFullYear()  →  2026", 27, AMBRE, 0.06, p, gras=True)
    _ligne(d, 1, "l'année complète, quatre chiffres", 22, TEXTE_2, 0.12, p)

    _note(d, 3, "getYear() existe mais elle est fausse depuis 2000 :", 20, ROUGE_STYLO, 0.22, p)
    _note(d, 4, "elle renvoie l'année moins 1900. On ne l'utilise pas.", 20, ROUGE_STYLO, 0.28, p)

    _sous_titre(d, 366, "les trois morceaux de la date", VERT, p, 0.38)
    morceaux = [
        ("getDate()", "le jour", "15", AMBRE, 0.44),
        ("getMonth() + 1", "le mois", "9", ROSE, 0.52),
        ("getFullYear()", "l'année", "2026", VERT, 0.60),
    ]
    y = 396
    for methode, quoi, valeur, couleur, seuil in morceaux:
        k = _apparait(p, seuil, 0.12)
        if k <= 0:
            y += 78
            continue
        boite_arrondie(d, [CAL_X - 22, y, GAUCHE[2] - 24, y + 66], rayon=12,
                       fond=melange(FOND_PANNEAU_2, couleur, 0.12 * k),
                       bord=melange(BORDURE, couleur, 0.55 * k), largeur_bord=2)
        d.text((CAL_X, y + 20), methode, font=police(19, True, mono=True),
               fill=melange(FOND, couleur, k), anchor="la")
        d.text((CAL_X, y + 46), quoi, font=police(15),
               fill=melange(FOND, TEXTE_3, k), anchor="la")
        d.text((GAUCHE[2] - 46, y + 33), valeur, font=police(24, True, mono=True),
               fill=melange(FOND, TEXTE, k), anchor="rm")
        y += 78

    _ligne(d, 16, "assemblés :  15 / 9 / 2026", 23, VERT, 0.74, p, gras=True)
    _ligne(d, 17, "la date à la française, telle qu'on l'écrit ici.", 20, TEXTE_2, 0.82, p)

    _code(d, [
        'let d = new Date("2026-09-15T08:00:00");',
        "console.log(d.getFullYear());",
        'console.log(d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear());',
    ], seuil=0.12, taille=18)
    _sortie(d, ["2026", "15/9/2026"], titre="ce que la console affiche", y=700, seuil=0.46)
    _bandeau(d, "getFullYear() : 2026, pas 126", "trois morceaux, une date", VERT)


# ══════════════════════════════════════════════════════════════════════════
#  7 · La date en texte
# ══════════════════════════════════════════════════════════════════════════
def scene_tostring(d, p, t):
    p_global[0] = p
    _entete(d, "tostring")
    _deux(d, "toString() : la date en texte", "un format qui dépend du navigateur")

    _ligne(d, 0, "d.toString()", 26, AMBRE, 0.06, p, gras=True)
    k = _apparait(p, 0.14, 0.16)
    if k > 0:
        boite_arrondie(d, [X, 236, GAUCHE[2] - 24, 330], rayon=14,
                       fond=melange(FOND_PANNEAU_2, AMBRE, 0.12 * k),
                       bord=melange(BORDURE, AMBRE, 0.60 * k), largeur_bord=2)
        d.text((X + 20, 258), "Tue Sep 15 2026 08:00:00 GMT+0100",
               font=police(19, False, mono=True), fill=melange(FOND, TEXTE, k), anchor="la")
        d.text((X + 20, 292), "(heure normale d'Europe centrale)",
               font=police(17), fill=melange(FOND, TEXTE_2, k), anchor="la")

    _ligne(d, 6, "jour · mois · année · heure · fuseau", 21, TEXTE_2, 0.30, p)
    _ligne(d, 7, "typeof d.toString()  →  string", 22, VERT, 0.40, p, gras=True)

    _note(d, 9, "Le format dépend du navigateur et du fuseau :", 21, ROUGE_STYLO, 0.50, p)
    _note(d, 10, "on l'affiche, on ne le fige jamais.", 21, ROUGE_STYLO, 0.56, p)
    _ligne(d, 12, "Pour une date lisible, on assemble soi-même :", 21, ENCRE, 0.66, p)
    _ligne(d, 13, "getDate(), getMonth() + 1, getFullYear().", 21, VERT, 0.72, p)
    _ligne(d, 15, "Une fois en texte, la date a les méthodes des chaînes :", 20, TEXTE_2, 0.82, p)
    _ligne(d, 16, "length, substring, toUpperCase.", 20, TEXTE_2, 0.88, p)

    _code(d, [
        'let d = new Date("2026-09-15T08:00:00");',
        "console.log(d.toString());",
        "console.log(typeof d.toString());",
        "console.log(d.toString().length);",
    ], seuil=0.12, taille=19)
    _sortie(d, ["Tue Sep 15 2026 08:00:00 GMT+0100",
                "(heure normale d'Europe centrale)",
                "string", "49"], titre="ce que la console affiche", y=660, seuil=0.44)
    _bandeau(d, "toString() : une chaîne, pas une date", "le format n'est pas garanti", AMBRE)


# ══════════════════════════════════════════════════════════════════════════
#  8 · L'exemple complet
# ══════════════════════════════════════════════════════════════════════════
def scene_exemple_complet(d, p, t):
    p_global[0] = p
    _entete(d, "exemple_complet")
    _deux(d, "assembler : jour + nomMois + année", "la date de rentrée, en toutes lettres")

    etapes = [
        ("1 · créer la date", "let d = new Date(\"2026-09-15T08:00:00\");", BLEU, 0.06),
        ("2 · les douze noms", "let mois = [\"janvier\", …, \"décembre\"];", VIOLET, 0.16),
        ("3 · lire les trois morceaux", "jour · nomMois · annee", AMBRE, 0.26),
        ("4 · coller dans la phrase", "\"Rentrée au Lycée Rafèha : \" + jour + …", VERT, 0.36),
    ]
    y = 236
    for titre_, detail, couleur, seuil in etapes:
        k = _apparait(p, seuil, 0.12)
        if k <= 0:
            y += 88
            continue
        boite_arrondie(d, [X, y, GAUCHE[2] - 24, y + 70], rayon=12,
                       fond=melange(FOND_PANNEAU_2, couleur, 0.12 * k),
                       bord=melange(BORDURE, couleur, 0.55 * k), largeur_bord=2)
        d.text((X + 20, y + 14), titre_, font=police(18, True),
               fill=melange(FOND, couleur, k), anchor="la")
        d.text((X + 20, y + 42), detail, font=police(15, False, mono=True),
               fill=melange(FOND, TEXTE_2, k), anchor="la")
        y += 88

    k = _apparait(p, 0.60, 0.14)
    if k > 0:
        boite_arrondie(d, [X, 596, GAUCHE[2] - 24, 682], rayon=14,
                       fond=melange(FOND_PANNEAU_2, VERT, 0.16 * k),
                       bord=melange(BORDURE, VERT, 0.70 * k), largeur_bord=2)
        d.text((X + 20, 614), "Rentrée au Lycée Rafèha :", font=police(21, True),
               fill=melange(FOND, VERT, k), anchor="la")
        d.text((X + 20, 646), "15 septembre 2026", font=police(25, True),
               fill=melange(FOND, TEXTE, k), anchor="la")

    _ligne(d, 15, "jour = 15   nomMois = septembre   annee = 2026", 19, TEXTE_2, 0.74, p)
    _note(d, 17, "Aucun numéro de mois dans la phrase :", 20, ROUGE_STYLO, 0.80, p)
    _note(d, 18, "c'est le tableau qui a traduit 8 en « septembre ».", 20, ROUGE_STYLO, 0.86, p)

    _code(d, [
        'let d = new Date("2026-09-15T08:00:00");',
        'let mois = ["janvier", "février", "mars", "avril", "mai", "juin",',
        '            "juillet", "août", "septembre", "octobre", "novembre", "décembre"];',
        "let jour = d.getDate();",
        "let nomMois = mois[d.getMonth()];",
        "let annee = d.getFullYear();",
        'console.log("Rentrée au Lycée Rafèha : " + jour + " " + nomMois + " " + annee);',
    ], seuil=0.08, taille=16)
    _sortie(d, ["Rentrée au Lycée Rafèha : 15 septembre 2026"],
            titre="ce que la console affiche", y=742, seuil=0.50)
    _bandeau(d, "getDate + tableau[getMonth] + getFullYear",
             "15 septembre 2026", VERT)


# ══════════════════════════════════════════════════════════════════════════
#  9 · Exercices et bilan
# ══════════════════════════════════════════════════════════════════════════
def _enonce(d, lignes, seuil=0.06):
    y = GAUCHE[1] + 74
    for titre_, contenu, s in lignes:
        k = _apparait(p_global[0], seuil + s, 0.12)
        if k <= 0:
            continue
        d.text((X, y), titre_, font=police(20, True),
               fill=melange(PAPIER, AMBRE, k), anchor="la")
        d.text((X, y + 30), contenu, font=police(19, False, mono=True),
               fill=melange(PAPIER, ENCRE, k), anchor="la")
        y += 74


def _correction(d, lignes, seuil=0.10):
    y = DROITE[1] + 96
    for i, (code, resultat, couleur) in enumerate(lignes):
        k = _apparait(p_global[0], seuil + 0.06 * i, 0.10)
        if k <= 0:
            continue
        d.text((CODE_X, y), code, font=police(18, False, mono=True),
               fill=melange(CODE_FOND, TEXTE, k), anchor="la")
        d.text((CODE_X, y + 26), "→ " + resultat, font=police(19, True, mono=True),
               fill=melange(CODE_FOND, couleur, k), anchor="la")
        y += 66


def scene_exercices(d, p, t):
    p_global[0] = p
    _entete(d, "exercices")
    panneau(d, GAUCHE, "l'énoncé", accent=melange(BORDURE, AMBRE, 0.55))
    panneau(d, DROITE, "la correction détaillée", accent=melange(BORDURE, VERT, 0.55))
    papier(d, [GAUCHE[0] + 16, GAUCHE[1] + 56, GAUCHE[2] - 16, GAUCHE[3] - 16])

    _enonce(d, [
        ("exercice 1", "d.getMonth()  =  ?   et   d.getMonth() + 1  =  ?", 0.06),
        ("exercice 2", "afficher 25 décembre 2026 en toutes lettres", 0.28),
        ("exercice 3", 'new Date("15/09/2026")  =  ?', 0.50),
    ])

    _correction(d, [
        ("d.getMonth()", "8   (septembre, mais zéro = janvier)", ROSE),
        ("d.getMonth() + 1", "9   (le numéro habituel)", AMBRE),
        ("mois[d.getMonth()] + getFullYear()", "\"25 décembre 2026\"", VERT),
        ("new Date(\"15/09/2026\")", "Invalid Date — écrire AAAA-MM-JJ", ROUGE_STYLO),
    ])

    _note(d, 11, "1 · getMonth() : 0 → 11 ; + 1 pour le numéro habituel", 20, ROUGE_STYLO, 0.62, p)
    _note(d, 12, "2 · getDate() : le jour du mois, jamais le jour de la semaine", 20, ROUGE_STYLO, 0.68, p)
    _note(d, 13, "3 · getFullYear() : quatre chiffres ; créer en AAAA-MM-JJ", 20, ROUGE_STYLO, 0.74, p)
    _note(d, 14, "4 · toString() : un texte selon le navigateur ; assembler soi-même", 19, ROUGE_STYLO, 0.80, p)

    _bandeau(d, "la fiche : new Date · getDate · getMonth · getFullYear · toString",
             "à bientôt dans une prochaine capsule", VERT)


# ══════════════════════════════════════════════════════════════════════════
#  Le répartiteur
# ══════════════════════════════════════════════════════════════════════════
SCENES = {
    "ouverture": scene_ouverture,
    "date_courante": scene_date_courante,
    "date_chaine": scene_date_chaine,
    "getdate": scene_getdate,
    "getmonth": scene_getmonth,
    "getfullyear": scene_getfullyear,
    "tostring": scene_tostring,
    "exemple_complet": scene_exemple_complet,
    "exercices": scene_exercices,
}

assert list(SCENES) == N.ORDRE, "une scène par section, dans le même ordre"


def dessiner(d: ImageDraw.ImageDraw, cle: str, p: float, t: float):
    p_global[0] = p
    G.fond(d, t)
    SCENES[cle](d, p, t)
