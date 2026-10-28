"""Bibliothèque de rendu des capsules TP (PIL).

Tout est dessiné à la main : éditeur de code sombre à gauche, navigateur à
droite, curseur animé, bulles d'explication, sous-titres, cartons.
"""
import os
import re

from PIL import Image, ImageDraw, ImageFont

ICI = os.path.dirname(os.path.abspath(__file__))
FONTES = "/usr/share/fonts/truetype/dejavu"
POLICE = os.path.join(FONTES, "DejaVuSans.ttf")
POLICE_B = os.path.join(FONTES, "DejaVuSans-Bold.ttf")
MONO = os.path.join(FONTES, "DejaVuSansMono.ttf")
MONO_B = os.path.join(FONTES, "DejaVuSansMono-Bold.ttf")
POLICE_AR = os.path.join(FONTES, "DejaVuSans.ttf")

L, H = 1280, 720
BLEU_TP = (31, 78, 121)
BLEU_CLAIR = (234, 242, 251)
ORANGE = (230, 126, 34)
DRAPEAU = os.path.join(ICI, "images", "drapeau.png")
VIDEO_IMG = os.path.join(ICI, "images", "video-drapeau.png")

_cache = {}


def police(chemin, taille):
    cle = (chemin, taille)
    if cle not in _cache:
        _cache[cle] = ImageFont.truetype(chemin, taille)
    return _cache[cle]


# ------------------------------------------------------------------ fond
def _fond():
    im = Image.new("RGB", (L, H), (12, 16, 28))
    d = ImageDraw.Draw(im)
    for y in range(H):
        k = y / H
        d.line([(0, y), (L, y)], fill=(int(14 + 10 * k), int(18 + 8 * k), int(30 + 14 * k)))
    # halo bleu discret en haut à droite
    halo = Image.new("RGB", (L, H), (0, 0, 0))
    dh = ImageDraw.Draw(halo)
    dh.ellipse([820, -260, 1500, 320], fill=(26, 46, 78))
    halo = halo.filter(__import__("PIL.ImageFilter", fromlist=["ImageFilter"]).GaussianBlur(80))
    return Image.blend(im, halo, 0.35)


FOND_BASE = _fond()


def interpoler(points, t):
    if not points:
        return None
    if t <= points[0][0]:
        return points[0][1], points[0][2]
    for (ta, xa, ya), (tb, xb, yb) in zip(points, points[1:]):
        if ta <= t <= tb:
            k = 0 if tb == ta else (t - ta) / (tb - ta)
            k = k * k * (3 - 2 * k)
            return xa + (xb - xa) * k, ya + (yb - ya) * k
    return points[-1][1], points[-1][2]


class Etat:
    def __init__(self, survol=(), clic=None, focus=None, curseur=None, touches=(), bulle=None,
                 temps=0.0, p=0.0):
        self.survol = list(survol)
        self.clic = clic
        self.focus = focus
        self.curseur = curseur
        self.touches = list(touches)
        self.bulle = bulle
        self.temps = temps
        self.p = p

    def survole(self, ident):
        return ident in self.survol


# ------------------------------------------------------------------ barre haute
def _logo(im, d, x, y, taille=38):
    d.rounded_rectangle([x, y, x + taille, y + taille], radius=8, fill=(255, 255, 255))
    d.text((x + taille / 2, y + 10), "STI", font=police(POLICE_B, 13), fill=BLEU_TP, anchor="ma")
    d.text((x + taille / 2, y + 23), "AE", font=police(POLICE_B, 9), fill=ORANGE, anchor="ma")


def barre_sup(im, d, etiquette, progression, sous_titre):
    d.rectangle([0, 0, L, 52], fill=(8, 12, 22))
    _logo(im, d, 14, 7)
    d.text((64, 12), "STI by AE V2.0", font=police(POLICE_B, 15), fill=(255, 255, 255))
    d.text((196, 15), sous_titre, font=police(POLICE, 11), fill=(150, 165, 190))
    d.text((L - 16, 17), etiquette, font=police(POLICE_B, 13), fill=ORANGE, anchor="ra")
    d.rectangle([0, 50, L, 52], fill=(28, 36, 54))
    d.rectangle([0, 50, int(L * min(1.0, max(0.0, progression))), 52], fill=ORANGE)


# ------------------------------------------------------------------ cartons
def carte_intro(alpha, titre, episodes):
    im = FOND_BASE.copy()
    d = ImageDraw.Draw(im)
    a = min(1.0, max(0.0, alpha))
    _logo(im, d, 590, 96, 100)
    d.text((L / 2, 246), "Bienvenue dans", font=police(POLICE, 26), fill=(200, 212, 232), anchor="mm")
    d.text((L / 2, 292), "STI Version 2.0", font=police(POLICE_B, 52), fill=(255, 255, 255), anchor="mm")
    d.text((L / 2, 336), "By AE", font=police(POLICE_B, 22), fill=ORANGE, anchor="mm")
    d.line([(360, 372), (920, 372)], fill=(60, 76, 104), width=2)
    d.text((L / 2, 404), titre, font=police(POLICE_B, 22), fill=(255, 255, 255), anchor="mm")
    y = 452
    for i, (num, libelle) in enumerate(episodes):
        if a <= 0.15 * i:
            continue
        d.rounded_rectangle([300, y - 4, 980, y + 44], radius=8, fill=(20, 28, 44),
                            outline=(46, 60, 86), width=1)
        d.rounded_rectangle([300, y - 4, 316, y + 44], radius=6, fill=ORANGE)
        d.text((332, y + 6), num, font=police(POLICE_B, 14), fill=ORANGE)
        d.text((452, y + 8), libelle, font=police(POLICE, 15), fill=(232, 238, 248))
        y += 56
    return im


def carte_fin(alpha, titre, lignes, pied):
    im = FOND_BASE.copy()
    d = ImageDraw.Draw(im)
    _logo(im, d, 14, 8)
    d.text((64, 13), "STI by AE V2.0", font=police(POLICE_B, 15), fill=(255, 255, 255))
    d.text((L / 2, 96), titre, font=police(POLICE_B, 38), fill=(255, 255, 255), anchor="mm")
    d.line([(300, 132), (980, 132)], fill=ORANGE, width=3)
    y = 168
    a = min(1.0, max(0.0, alpha))
    for i, ligne in enumerate(lignes):
        if a <= 0.08 * i:
            continue
        d.rounded_rectangle([250, y - 2, 1030, y + 42], radius=8, fill=(20, 28, 44),
                            outline=(46, 60, 86), width=1)
        d.text((272, y + 9), ligne, font=police(POLICE, 15), fill=(226, 234, 246))
        y += 50
    d.text((L / 2, 646), pied, font=police(POLICE, 14), fill=(150, 165, 190), anchor="mm")
    return im


# ------------------------------------------------------------------ éditeur
TOK_TAG = (126, 178, 255)
TOK_ATTR = (255, 186, 116)
TOK_STR = (150, 220, 150)
TOK_COM = (120, 132, 150)
TOK_CSS = (198, 148, 255)
TOK_VAL = (255, 224, 130)
TOK_TXT = (226, 232, 240)


def _colore(ligne):
    """Renvoie une liste de (texte, couleur) pour une ligne de code."""
    parts = []
    if ligne.strip().startswith("<!--") or ligne.strip().startswith("/*") or ligne.strip().startswith("//"):
        return [(ligne, TOK_COM)]
    i = 0
    tampon = ""

    def vide():
        nonlocal tampon
        if tampon:
            parts.append((tampon, TOK_TXT))
            tampon = ""

    while i < len(ligne):
        c = ligne[i]
        if c == "<":
            vide()
            j = ligne.find(">", i)
            j = len(ligne) - 1 if j < 0 else j
            bout = ligne[i:j + 1]
            for morceau in re.split(r'("[^"]*"|\'[^\']*\')', bout):
                if not morceau:
                    continue
                if morceau[0] in "\"'":
                    parts.append((morceau, TOK_STR))
                elif morceau.startswith("</") or morceau.startswith("<!"):
                    parts.append((morceau, TOK_TAG))
                else:
                    for sub in re.split(r"(=)", morceau):
                        if not sub:
                            continue
                        parts.append((sub, TOK_ATTR if sub != "=" else TOK_TXT))
            i = j + 1
        elif c in "#." and ligne.strip().startswith(("/*", "#")):
            vide()
            parts.append((c, TOK_CSS))
            i += 1
        elif c == ":" and "{" in ligne or (c == ":" and ligne.rstrip().endswith(";")):
            vide()
            parts.append((c, TOK_VAL))
            i += 1
        else:
            tampon += c
            i += 1
    vide()
    return parts


def editeur(im, d, lignes, box, avancement, surligne, nom_fichier="tp.html"):
    x0, y0, x1, y1 = box
    d.rounded_rectangle([x0, y0, x1, y1], radius=10, fill=(15, 20, 33), outline=(40, 50, 72), width=2)
    d.rounded_rectangle([x0, y0, x1, y0 + 34], radius=10, fill=(24, 31, 47))
    for i, c in enumerate([(255, 95, 86), (255, 189, 46), (39, 201, 63)]):
        d.ellipse([x0 + 14 + i * 18, y0 + 11, x0 + 24 + i * 18, y0 + 21], fill=c)
    d.text((x0 + 76, y0 + 9), nom_fichier, font=police(MONO, 12), fill=(160, 172, 192))
    d.text((x1 - 12, y0 + 9), "éditeur", font=police(POLICE, 10), fill=(90, 102, 126), anchor="ra")
    marge = y0 + 46
    interligne = 19
    f = police(MONO, 13)
    fn = police(MONO, 12)
    visibles = max(1, int(round(avancement * len(lignes))))
    for idx, ligne in enumerate(lignes[:visibles]):
        y = marge + idx * interligne
        if y > y1 - 14:
            break
        if surligne is not None and idx == surligne:
            d.rounded_rectangle([x0 + 6, y - 2, x1 - 8, y + interligne - 3], radius=4, fill=(32, 44, 68))
        d.text((x0 + 10, y), str(idx + 1).rjust(3), font=fn, fill=(71, 85, 105))
        x = x0 + 48
        for texte, coul in _colore(ligne.expandtabs(2)):
            d.text((x, y), texte, font=f, fill=coul)
            x += d.textlength(texte, font=f)


# ------------------------------------------------------------------ navigateur
def navigateur(im, d, box, url):
    x0, y0, x1, y1 = box
    d.rounded_rectangle([x0, y0, x1, y1], radius=12, fill=(255, 255, 255), outline=(40, 50, 72), width=2)
    d.rounded_rectangle([x0, y0, x1, y0 + 36], radius=12, fill=(238, 242, 248))
    d.rectangle([x0, y0 + 24, x1, y0 + 36], fill=(238, 242, 248))
    for i, c in enumerate([(255, 95, 86), (255, 189, 46), (39, 201, 63)]):
        d.ellipse([x0 + 14 + i * 18, y0 + 11, x0 + 24 + i * 18, y0 + 21], fill=c)
    d.rounded_rectangle([x0 + 78, y0 + 7, x1 - 14, y0 + 29], radius=11, fill=(255, 255, 255),
                        outline=(214, 222, 234), width=1)
    d.text((x0 + 90, y0 + 11), url, font=police(POLICE, 11), fill=(90, 100, 115))


# ------------------------------------------------------------------ widgets
def _champ(im, d, box, label, valeur, aide=None, largeur=330, focus=False, sur=False, x=0):
    x0, y0, x1, _ = box
    bx = x0 + 24 + x
    d.text((bx, y0), label, font=police(POLICE, 13), fill=(60, 70, 88))
    cx = bx + 120
    d.rounded_rectangle([cx, y0 - 6, cx + largeur, y0 + 24], radius=5, fill=(255, 255, 255),
                        outline=ORANGE if sur else (BLEU_TP if focus else (196, 206, 220)),
                        width=3 if (sur or focus) else 1)
    d.text((cx + 8, y0), valeur, font=police(POLICE, 13), fill=(30, 40, 55))
    if focus:
        d.line([(cx + 8, y0 + 18), (cx + 8 + max(2, d.textlength(valeur, font=police(POLICE, 13))), y0 + 18)],
               fill=BLEU_TP, width=2)
    if aide:
        d.text((cx + largeur + 10, y0), aide, font=police(MONO, 10), fill=(150, 160, 175))
    return (cx, y0 - 6, cx + largeur, y0 + 24)


class Page:
    def __init__(self, widgets):
        self.widgets = widgets

    def dessiner(self, im, d, box, etat):
        x0, y0, x1, y1 = box
        y = y0 + 52
        zones = {}
        for w in self.widgets:
            y = self._widget(im, d, box, y, w, etat, zones)
        return zones

    def _widget(self, im, d, box, y, w, etat, zones):
        x0, y0, x1, y1 = box
        t = w["t"]
        if t == "titre":
            d.text((x0 + 24, y), w["texte"], font=police(POLICE_B, 18), fill=BLEU_TP)
            return y + 30
        if t == "soustitre":
            d.text((x0 + 24, y), w["texte"], font=police(MONO, 11), fill=(120, 130, 145))
            return y + 24
        if t == "texte":
            d.text((x0 + 24, y), w["texte"], font=police(POLICE, 13), fill=(60, 70, 88))
            return y + 24
        if t == "espace":
            return y + w.get("hauteur", 10)
        if t == "input":
            z = _champ(im, d, (x0, y + 8, x1, y1), w["label"], w.get("valeur", ""), w.get("aide"),
                       largeur=w.get("largeur", 300), focus=(etat.focus == w["id"]),
                       sur=etat.survole(w["id"]), x=w.get("x", 0))
            zones[w["id"]] = z
            return y + 44
        if t == "area":
            bx = x0 + 24 + w.get("x", 0)
            d.text((bx, y), w["label"], font=police(POLICE, 13), fill=(60, 70, 88))
            h = w.get("hauteur", 56)
            sur = etat.survole(w["id"])
            d.rounded_rectangle([bx + 120, y - 6, bx + 120 + w.get("largeur", 300), y + h], radius=6,
                                fill=(252, 252, 253), outline=ORANGE if sur else (196, 206, 220),
                                width=3 if sur else 1)
            for i, ligne in enumerate(w.get("valeur", [])):
                d.text((bx + 128, y + 2 + i * 17), ligne, font=police(MONO, 11), fill=(70, 80, 95))
            if w.get("note"):
                d.text((bx + 130 + w.get("largeur", 300), y), w["note"], font=police(MONO, 10),
                       fill=(150, 160, 175))
            zones[w["id"]] = (bx + 120, y - 6, bx + 120 + w.get("largeur", 300), y + h)
            return y + h + 18
        if t == "range":
            bx = x0 + 24 + w.get("x", 0)
            d.text((bx, y), w["label"], font=police(POLICE, 13), fill=(60, 70, 88))
            cx = bx + 120
            larg = w.get("largeur", 240)
            d.line([(cx, y + 8), (cx + larg, y + 8)], fill=(196, 206, 220), width=6)
            pos = cx + larg * w.get("part", 0.5)
            d.line([(cx, y + 8), (pos, y + 8)], fill=BLEU_TP, width=6)
            d.ellipse([pos - 9, y - 1, pos + 9, y + 17], fill=BLEU_TP if not etat.survole(w["id"]) else ORANGE)
            d.text((cx + larg + 14, y), str(w.get("sortie", "")), font=police(MONO_B, 13), fill=BLEU_TP)
            zones[w["id"]] = (cx - 10, y - 8, cx + larg + 10, y + 24)
            return y + 40
        if t == "boutons":
            bx = x0 + 24 + w.get("x", 0)
            for libelle, couleur, ident in w["items"]:
                largeur = 24 + int(d.textlength(libelle, font=police(POLICE_B, 13)))
                sur = etat.survole(ident)
                d.rounded_rectangle([bx, y, bx + largeur, y + 32], radius=6,
                                    fill=ORANGE if sur else couleur)
                d.text((bx + 12, y + 8), libelle, font=police(POLICE_B, 13), fill=(255, 255, 255))
                zones[ident] = (bx, y, bx + largeur, y + 32)
                bx += largeur + 12
            return y + 44
        if t == "liens":
            bx = x0 + 24 + w.get("x", 0)
            for libelle, etatlien, ident in w["items"]:
                coul = {"normal": BLEU_TP, "visited": (123, 63, 160), "hover": ORANGE,
                        "active": (192, 57, 43)}[etatlien]
                if etat.survole(ident):
                    coul = ORANGE if etatlien != "visited" else (123, 63, 160)
                f = police(POLICE_B, 15)
                d.text((bx, y), libelle, font=f, fill=coul)
                tw = d.textlength(libelle, font=f)
                if etatlien in ("hover", "active") or etat.survole(ident):
                    d.line([(bx, y + 20), (bx + tw, y + 20)], fill=coul, width=2)
                zones[ident] = (bx, y, bx + tw, y + 22)
                bx += tw + 28
            return y + 32
        if t == "table":
            lignes = [w.get("entetes", [])] + w.get("lignes", [])
            largeurs = w.get("largeurs") or [int((x1 - x0 - 48) / max(1, len(lignes[0])))] * len(lignes[0])
            bx = x0 + 24
            if w.get("caption"):
                d.text((bx, y), w["caption"], font=police(POLICE_B, 12), fill=BLEU_TP)
                y += 22
            for j, ligne in enumerate(lignes):
                cx = bx
                for i, cell in enumerate(ligne):
                    d.rectangle([cx, y, cx + largeurs[i], y + 24],
                                fill=BLEU_TP if j == 0 else (255, 255, 255),
                                outline=(180, 194, 212))
                    d.text((cx + 8, y + 5), str(cell), font=police(POLICE if j else POLICE_B, 11),
                           fill=(255, 255, 255) if j == 0 else (40, 50, 65))
                    cx += largeurs[i]
                y += 24
            if w.get("pied"):
                cx = bx
                for i, cell in enumerate(w["pied"]):
                    d.rectangle([cx, y, cx + largeurs[i], y + 24], fill=(226, 234, 245),
                                outline=(180, 194, 212))
                    d.text((cx + 8, y + 5), str(cell), font=police(POLICE_B, 11), fill=(40, 50, 65))
                    cx += largeurs[i]
                y += 24
            zones[w.get("id", "table")] = (bx, y - 24 * len(lignes), bx + sum(largeurs), y)
            return y + 14
        if t == "journal":
            bx = x0 + 24
            h = w.get("hauteur", 130)
            d.rounded_rectangle([bx, y, x1 - 20, y + h], radius=8, fill=(18, 18, 20),
                                outline=(60, 60, 60), width=1)
            d.text((bx + 10, y + 6), "journal des événements", font=police(POLICE, 10), fill=(110, 110, 110))
            for i, ligne in enumerate(w.get("lignes", [])[-6:]):
                d.text((bx + 10, y + 24 + i * 17), ligne, font=police(MONO, 11), fill=(120, 220, 120))
            zones[w["id"]] = (bx, y, x1 - 20, y + h)
            return y + h + 16
        if t == "zone":
            bx = x0 + 24 + w.get("x", 0)
            h = w.get("hauteur", 80)
            fond = w.get("fond", (234, 242, 251))
            bord = w.get("bord", (196, 206, 220))
            sur = etat.survole(w["id"])
            d.rounded_rectangle([bx, y, bx + w.get("largeur", x1 - x0 - 72), y + h], radius=8,
                                fill=(255, 236, 220) if sur else fond,
                                outline=ORANGE if sur else bord, width=3 if sur else 2)
            d.text((bx + 14, y + h / 2), w.get("texte", ""), font=police(POLICE_B, 13),
                   fill=(60, 70, 88) if not sur else (120, 60, 10), anchor="lm")
            zones[w["id"]] = (bx, y, bx + w.get("largeur", x1 - x0 - 72), y + h)
            return y + h + 16
        if t == "select":
            bx = x0 + 24 + w.get("x", 0)
            d.text((bx, y), w["label"], font=police(POLICE, 13), fill=(60, 70, 88))
            cx = bx + 90
            sur = etat.survole(w["id"])
            largeur = w.get("largeur", 190)
            h = w.get("hauteur", 34)
            d.rounded_rectangle([cx, y - 6, cx + largeur, y + h], radius=5, fill=(255, 255, 255),
                                outline=ORANGE if sur else (196, 206, 220), width=3 if sur else 1)
            yy = y
            for actif, opt in w["options"]:
                if opt.startswith("--") or (actif is None and opt in ("Nord", "Sud")):
                    d.text((cx + 8, yy + 1), opt, font=police(POLICE_B, 11), fill=(120, 130, 145))
                else:
                    if actif in (True, "*"):
                        d.rectangle([cx + 2, yy - 3, cx + largeur - 2, yy + 15], fill=(31, 78, 121))
                    d.text((cx + 10, yy), opt, font=police(POLICE, 12),
                           fill=(255, 255, 255) if actif in (True, "*") else (40, 50, 65))
                yy += 18
            zones[w["id"]] = (cx, y - 6, cx + largeur, y + h)
            return y + h + 18
        if t == "choix":
            bx = x0 + 24 + w.get("x", 0)
            for libelle, coche, ident in w["items"]:
                sur = etat.survole(ident)
                if w.get("type") == "radio":
                    d.ellipse([bx, y, bx + 18, y + 18], outline=ORANGE if sur else (120, 130, 145), width=2,
                              fill=(255, 255, 255))
                    if coche:
                        d.ellipse([bx + 5, y + 5, bx + 13, y + 13], fill=BLEU_TP)
                else:
                    d.rectangle([bx, y, bx + 18, y + 18], outline=ORANGE if sur else (120, 130, 145),
                                width=2, fill=(255, 255, 255))
                    if coche:
                        d.line([(bx + 4, y + 9), (bx + 8, y + 14), (bx + 15, y + 4)], fill=BLEU_TP, width=3)
                d.text((bx + 26, y + 1), libelle, font=police(POLICE, 13), fill=(40, 50, 65))
                largeur = 26 + int(d.textlength(libelle, font=police(POLICE, 13)))
                zones[ident] = (bx - 2, y - 4, bx + largeur + 4, y + 22)
                bx += largeur + 26
            return y + 34
        if t == "file":
            bx = x0 + 24
            d.text((bx, y), w["label"], font=police(POLICE, 13), fill=(60, 70, 88))
            sur = etat.survole(w["id"])
            d.rounded_rectangle([bx + 120, y - 6, bx + 120 + w.get("largeur", 210), y + 26], radius=5,
                                fill=(240, 244, 250), outline=ORANGE if sur else (196, 206, 220),
                                width=3 if sur else 1)
            d.text((bx + 130, y + 1), w.get("bouton", "Choisir un fichier"), font=police(POLICE, 11),
                   fill=(50, 60, 80))
            if w.get("fichiers"):
                d.text((bx + 140 + w.get("largeur", 210), y + 2), w["fichiers"], font=police(MONO, 10),
                       fill=(90, 100, 115))
            zones[w["id"]] = (bx + 120, y - 6, bx + 120 + w.get("largeur", 210), y + 26)
            return y + 44
        if t == "figure":
            bx = x0 + 24 + w.get("x", 0)
            lw, lh = w.get("taille", (200, 112))
            sur = etat.survole(w["id"])
            src = VIDEO_IMG if w.get("image") == "video" else (DRAPEAU if os.path.exists(DRAPEAU) else VIDEO_IMG)
            try:
                img = Image.open(src).convert("RGB").resize((lw, lh))
                im.paste(img, (bx, y))
                d = ImageDraw.Draw(im)
            except Exception:
                d.rectangle([bx, y, bx + lw, y + lh], fill=(210, 220, 232))
            d.rectangle([bx, y, bx + lw, y + lh], outline=ORANGE if sur else (150, 165, 185), width=3 if sur else 1)
            if w.get("controls"):
                cy = y + lh - 20
                d.rectangle([bx, cy, bx + lw, cy + 20], fill=(30, 30, 32))
                d.polygon([(bx + 8, cy + 4), (bx + 8, cy + 16), (bx + 18, cy + 10)], fill=(255, 255, 255))
                d.rectangle([bx + 24, cy + 8, bx + lw - 60, cy + 12], fill=(90, 90, 92))
                d.rectangle([bx + 24, cy + 8, bx + 24 + int((lw - 84) * 0.35), cy + 12], fill=ORANGE)
                d.rectangle([bx + lw - 52, cy + 6, bx + lw - 40, cy + 14], fill=(255, 255, 255))
                d.rectangle([bx + lw - 34, cy + 5, bx + lw - 22, cy + 15], outline=(255, 255, 255), width=2)
            d.text((bx, y + lh + 6), w["legende"], font=police(POLICE, 11), fill=(90, 100, 115))
            zones[w["id"]] = (bx, y, bx + lw, y + lh)
            return y + lh + 30
        if t == "player":
            bx = x0 + 24
            largeur = w.get("largeur", x1 - x0 - 72)
            rapport = 9 / 16
            h = int(largeur * rapport)
            try:
                img = Image.open(VIDEO_IMG).convert("RGB").resize((largeur, h))
                im.paste(img, (bx, y))
                d = ImageDraw.Draw(im)
            except Exception:
                d.rectangle([bx, y, bx + largeur, y + h], fill=(200, 210, 220))
            sur = {k: etat.survole(k) for k in ("btn-play", "btn-seek", "btn-volume", "btn-speed", "btn-full")}
            cy = y + h - 34
            d.rectangle([bx, cy, bx + largeur, cy + 34], fill=(20, 20, 22))
            # lecture / pause
            if w.get("paused", False):
                d.polygon([(bx + 14, cy + 8), (bx + 14, cy + 26), (bx + 28, cy + 17)],
                          fill=ORANGE if sur["btn-play"] else (255, 255, 255))
            else:
                d.rectangle([bx + 14, cy + 8, bx + 20, cy + 26], fill=ORANGE if sur["btn-play"] else (255, 255, 255))
                d.rectangle([bx + 24, cy + 8, bx + 30, cy + 26], fill=ORANGE if sur["btn-play"] else (255, 255, 255))
            # progression
            sx0, sx1 = bx + 44, bx + largeur - 176
            d.rounded_rectangle([sx0, cy + 14, sx1, cy + 20], radius=3, fill=(90, 90, 94))
            d.rounded_rectangle([sx0, cy + 14, sx0 + int((sx1 - sx0) * w.get("temps", 0.35)), cy + 20],
                                radius=3, fill=ORANGE)
            px = sx0 + int((sx1 - sx0) * w.get("temps", 0.35))
            d.ellipse([px - 7, cy + 10, px + 7, cy + 24], fill=ORANGE if sur["btn-seek"] else (255, 255, 255))
            # volume
            vx = bx + largeur - 168
            d.polygon([(vx, cy + 13), (vx + 6, cy + 13), (vx + 12, cy + 8), (vx + 12, cy + 26),
                       (vx + 6, cy + 21), (vx, cy + 21)], fill=ORANGE if sur["btn-volume"] else (255, 255, 255))
            # vitesse
            d.text((bx + largeur - 140, cy + 10), "1x", font=police(POLICE_B, 11),
                   fill=ORANGE if sur["btn-speed"] else (255, 255, 255))
            # plein écran
            fx, fy = bx + largeur - 108, cy + 8
            for dx, dy in ((0, 0), (1, 0), (0, 1), (1, 1)):
                ox = fx + (0 if dx == 0 else 16)
                oy = fy + (0 if dy == 0 else 16)
                d.line([(ox, oy + (6 if dy else 0)), (ox, oy), (ox + (6 if dx == 0 else -6), oy)],
                       fill=ORANGE if sur["btn-full"] else (255, 255, 255), width=2)
            zones["btn-play"] = (bx + 8, cy + 4, bx + 36, cy + 30)
            zones["btn-seek"] = (sx0 - 6, cy + 8, sx1 + 6, cy + 26)
            zones["btn-volume"] = (vx - 6, cy + 4, vx + 18, cy + 30)
            zones["btn-speed"] = (bx + largeur - 148, cy + 4, bx + largeur - 114, cy + 28)
            zones["btn-full"] = (fx - 6, cy + 2, fx + 26, cy + 30)
            d.text((bx, y + h + 6), w.get("legende", "drapeau.mp4"), font=police(MONO, 10), fill=(110, 120, 135))
            zones["lecteur"] = (bx, y, bx + largeur, y + h)
            return y + h + 24
        if t == "etats":
            bx = x0 + 24
            lw = int(((x1 - 24) - bx - 3 * 16) / 4)
            hb = w.get("hauteur", 150)
            couleurs = {"normal": BLEU_TP, "visited": (123, 63, 160), "hover": ORANGE, "active": (192, 57, 43)}
            for i, (ident, etatlien, nom, doc) in enumerate(w["items"]):
                cx = bx + i * (lw + 16)
                sur = etat.survole(ident)
                d.rounded_rectangle([cx, y, cx + lw, y + hb], radius=8, fill=(255, 255, 255),
                                    outline=ORANGE if sur else (206, 218, 234), width=3 if sur else 1)
                d.text((cx + 10, y + 8), nom, font=police(MONO_B, 11), fill=BLEU_TP)
                d.text((cx + 10, y + 26), doc, font=police(POLICE, 9), fill=(120, 130, 145))
                f = police(POLICE_B, 16)
                d.text((cx + 10, y + 52), "Lien vers le cours", font=f, fill=couleurs[etatlien])
                tw = d.textlength("Lien vers le cours", font=f)
                if etatlien in ("hover", "active"):
                    d.line([(cx + 10, y + 76), (cx + 10 + tw, y + 76)], fill=couleurs[etatlien], width=2)
                d.text((cx + 10, y + 92), "état : " + etatlien, font=police(MONO, 9), fill=(70, 80, 95))
                zones[ident] = (cx, y, cx + lw, y + hb)
            return y + hb + 14
        return y + 10


# ------------------------------------------------------------------ décor animé
def bulle(im, d, texte, zone, dessous=False):
    f = police(POLICE_B, 12)
    largeur = int(d.textlength(texte, font=f)) + 24
    hauteur = 30
    cx = (zone[0] + zone[2]) / 2 - largeur / 2
    cy = zone[3] + 12 if not dessous else zone[1] - hauteur - 12
    cx = max(10, min(L - largeur - 10, cx))
    cy = max(60, min(H - hauteur - 60, cy))
    d.rounded_rectangle([cx, cy, cx + largeur, cy + hauteur], radius=7, fill=(24, 24, 28),
                        outline=ORANGE, width=2)
    d.polygon([((zone[0] + zone[2]) / 2 - 7, cy if dessous else cy + hauteur),
               ((zone[0] + zone[2]) / 2 + 7, cy if dessous else cy + hauteur),
               ((zone[0] + zone[2]) / 2, cy - 7 if dessous else cy + hauteur + 7)], fill=ORANGE)
    d.text((cx + 12, cy + 7), texte, font=f, fill=(255, 255, 255))


def touches(im, d, liste, x=40, y=92):
    f = police(MONO_B, 12)
    for i, touche in enumerate(liste):
        largeur = max(30, int(d.textlength(touche, font=f)) + 18)
        d.rounded_rectangle([x, y, x + largeur, y + 28], radius=6, fill=(250, 250, 252),
                            outline=(90, 100, 120), width=2)
        d.text((x + largeur / 2, y + 6), touche, font=f, fill=(30, 40, 55), anchor="ma")
        x += largeur + 8


def curseur(im, x, y, clic=False):
    im = im.copy()
    d = ImageDraw.Draw(im)
    if clic:
        d.ellipse([x - 16, y - 16, x + 16, y + 16], outline=ORANGE, width=3)
        d.ellipse([x - 9, y - 9, x + 9, y + 9], fill=(255, 210, 160))
    d.polygon([(x, y), (x, y + 22), (x + 6, y + 16), (x + 11, y + 25), (x + 15, y + 22),
               (x + 10, y + 14), (x + 17, y + 13)], fill=(255, 255, 255), outline=(30, 30, 40))
    return im


def sous_titre(im, d, texte, part=1.0):
    if not texte:
        return im
    f = police(POLICE_B, 17)
    lignes = texte.split("\n")[:2]
    haut = H - 52 if len(lignes) == 1 else H - 74
    total = sum(len(l) for l in lignes) or 1
    if part is not None and 0 < part < 1:
        curseur_pos = int(part * total)
        for i, ligne in enumerate(lignes):
            tw = d.textlength(ligne, font=f)
            x = (L - tw) / 2
            for mot in ligne.split(" "):
                w2 = d.textlength(mot + " ", font=f)
                actif = 0 <= curseur_pos < len(mot) + 1
                y2 = haut + i * 26
                if actif:
                    d.rounded_rectangle([x - 4, y2 - 2, x + w2, y2 + 22], radius=5, fill=(250, 204, 21))
                    d.text((x, y2), mot, font=f, fill=(20, 25, 40))
                else:
                    d.text((x, y2), mot, font=f, fill=(248, 250, 252))
                x += w2
                curseur_pos -= len(mot) + 1
                if curseur_pos < 0:
                    curseur_pos = -10 ** 9
    else:
        for i, ligne in enumerate(lignes):
            tw = d.textlength(ligne, font=f)
            d.text(((L - tw) / 2, haut + i * 26), ligne, font=f, fill=(248, 250, 252))
    return im


def position_sous_titre(liste, t):
    for (a, b, texte) in liste:
        if a <= t < b:
            return texte, (t - a) / max(0.001, b - a)
    return None, None
