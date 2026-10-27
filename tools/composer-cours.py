#!/usr/bin/env python3
"""Compose la planche d'aperçu des 5 pages matière (dossier /apercu/cours).

Usage : python3 tools/composer-cours.py
Dépendance : Pillow. Les images sources sont produites par
tools/captures-apercu.mjs (Chromium headless, aucun appel réseau externe).
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "apercu" / "cours"

W, H = 1600, 1010
MARGE, GOUTTIERE = 40, 20
TUILLE_W, IMG_H, ETIQUETTE_H = 493, 300, 44
LIGNE_H = IMG_H + ETIQUETTE_H
LIGNES_Y = [132, 132 + LIGNE_H + GOUTTIERE]
COLONNES_X = [MARGE, MARGE + TUILLE_W + GOUTTIERE, MARGE + 2 * (TUILLE_W + GOUTTIERE)]

FOND_HAUT, FOND_BAS = (11, 18, 32), (22, 35, 59)
CARTE, BORDURE = (17, 28, 48), (42, 58, 84)
BLANC, GRIS, ACCENT = (241, 246, 255), (150, 166, 192), (90, 169, 255)


def police(gras=False, taille=18):
    noms = ["DejaVuSans-Bold.ttf"] if gras else ["DejaVuSans.ttf"]
    for dossier in ("/usr/share/fonts/truetype/dejavu", "/usr/share/fonts", "/tmp/fonts/fonts"):
        for nom in noms:
            p = Path(dossier) / nom
            if p.exists():
                return ImageFont.truetype(str(p), taille)
    return ImageFont.load_default(size=taille)


F_TITRE = police(True, 38)
F_SOUS = police(False, 17)
F_ETIQUETTE = police(True, 17)
F_PETIT = police(False, 14)
F_PIED = police(False, 15)

planche = Image.new("RGB", (W, H))
d = ImageDraw.Draw(planche)
for y in range(H):
    k = y / (H - 1)
    d.line([(0, y), (W, y)], fill=tuple(int(a + (b - a) * k) for a, b in zip(FOND_HAUT, FOND_BAS)))
d.rectangle([0, 0, W, 5], fill=ACCENT)

d.text((MARGE, 28), "STI V2.0 — Les 5 pages matière", font=F_TITRE, fill=BLANC)
d.text((MARGE, 82), "Lycée Raféha · 3ème & 4ème SI — une seule page par matière : cours, exercices, annexes, vidéos, quiz.",
       font=F_SOUS, fill=GRIS)
pilule = (1300, 30, 1560, 70)
d.rounded_rectangle(pilule, radius=20, fill=(28, 47, 78), outline=(64, 104, 165))
d.text((pilule[0] + 20, pilule[1] + 11), "6 VUES RÉELLES · 1440 × 900", font=F_PETIT, fill=(169, 205, 255))

cases = [
    ("html5-cours.png", "01  ·  HTML5 — cours (sombre)"),
    ("css3-cours.png", "02  ·  CSS3 — laboratoires"),
    ("javascript-cours.png", "03  ·  JavaScript — cours"),
    ("sql-cours.png", "04  ·  SQL — Guide-Ligne"),
    ("php-videos.png", "05  ·  PHP — onglet Vidéos"),
    ("html5-fenetre.png", "06  ·  Fenêtre « Agrandir » redimensionnable"),
]

for i, (fichier, titre) in enumerate(cases):
    x, y = COLONNES_X[i % 3], LIGNES_Y[i // 3]
    d.rounded_rectangle([x, y, x + TUILLE_W, y + LIGNE_H], radius=12, fill=CARTE, outline=BORDURE)
    chemin = SRC / fichier
    if chemin.exists():
        with Image.open(chemin) as im:
            im = im.convert("RGB").resize((TUILLE_W, IMG_H), Image.LANCZOS)
            planche.paste(im, (x, y))
    d.line([(x, y + IMG_H), (x + TUILLE_W, y + IMG_H)], fill=BORDURE, width=1)
    d.text((x + 14, y + IMG_H + 11), titre, font=F_ETIQUETTE, fill=BLANC)

d.line([(MARGE, 925), (W - MARGE, 925)], fill=BORDURE, width=1)
d.text((MARGE, 938),
       "Sommaire sticky à 3 états · anneau de progression · 5 onglets à ancres · éditeurs live en iframe sandbox · corrigés masqués ·",
       font=F_PIED, fill=GRIS)
d.text((MARGE, 962),
       "fenêtres modales avec focus piégé · reprise vidéo · Guide-Ligne · 3 thèmes · RTL · mobile-first — 100 % du contenu d'origine conservé.",
       font=F_PIED, fill=GRIS)

sortie = SRC / "00-planche-cours.png"
planche.save(sortie, optimize=True)
print("Planche créée :", sortie, planche.size)
