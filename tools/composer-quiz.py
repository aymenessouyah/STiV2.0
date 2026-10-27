#!/usr/bin/env python3
"""Compose la planche d'aperçu des 5 arènes de quiz (/apercu/quiz).

Usage : python3 tools/composer-quiz.py
Dépendance : Pillow. Les images sources viennent de tools/captures-quiz.mjs.
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "apercu" / "quiz"
W, H = 1600, 1010
M, G = 40, 20
TW, IH, LH = 493, 300, 44
ROW_H = IH + LH
YS = [132, 132 + ROW_H + G]
XS = [M, M + TW + G, M + 2 * (TW + G)]

HAUT, BAS = (11, 18, 32), (22, 35, 59)
CARTE, BORD = (17, 28, 48), (42, 58, 84)
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
F_ETIQ = police(True, 17)
F_PETIT = police(False, 14)
F_PIED = police(False, 15)

img = Image.new("RGB", (W, H))
d = ImageDraw.Draw(img)
for y in range(H):
    k = y / (H - 1)
    d.line([(0, y), (W, y)], fill=tuple(int(a + (b - a) * k) for a, b in zip(HAUT, BAS)))
d.rectangle([0, 0, W, 5], fill=ACCENT)

d.text((M, 28), "STI V2.0 — Les 5 arènes de quiz", font=F_TITRE, fill=BLANC)
d.text((M, 82), "Lycée Raféha · 3ème & 4ème SI — 609 questions d'origine : 187 + 106 + 140 + 176, plus le Quiz des tableaux.",
       font=F_SOUS, fill=GRIS)
pilule = (1300, 30, 1560, 70)
d.rounded_rectangle(pilule, radius=20, fill=(28, 47, 78), outline=(64, 104, 165))
d.text((pilule[0] + 20, pilule[1] + 11), "6 VUES RÉELLES · 1440 × 900", font=F_PETIT, fill=(169, 205, 255))

cases = [
    ("html-css-depart.png", "01  ·  Quizzora — configuration"),
    ("html-css-jeu.png", "02  ·  Quizzora — question A → D"),
    ("javascript-jeu.png", "03  ·  Arène JavaScript — vies & combo"),
    ("sql-jeu.png", "04  ·  SQL Quest — duel & jokers"),
    ("php-bilan.png", "05  ·  QuizPHP — bilan & certificat"),
    ("tableaux-verrou.png", "06  ·  Quiz des tableaux — accès abonnés"),
]

for i, (fichier, titre) in enumerate(cases):
    x, y = XS[i % 3], YS[i // 3]
    d.rounded_rectangle([x, y, x + TW, y + ROW_H], radius=12, fill=CARTE, outline=BORD)
    chemin = SRC / fichier
    if chemin.exists():
        with Image.open(chemin) as im:
            img.paste(im.convert("RGB").resize((TW, IH), Image.LANCZOS), (x, y))
    d.line([(x, y + IH), (x + TW, y + IH)], fill=BORD, width=1)
    d.text((x + 14, y + IH + 11), titre, font=F_ETIQ, fill=BLANC)

d.line([(M, 925), (W - M, 925)], fill=BORD, width=1)
d.text((M, 938),
       "3 écrans (départ · jeu · bilan) · modes par quiz · jokers 50/50 / indice / passer · combo, vies, boss, XP, badges & classement ·",
       font=F_PIED, fill=GRIS)
d.text((M, 962),
       "bilan corrigé complet · « Rejouer mes erreurs » · retour au cours · 3 thèmes, RTL, mobile — données via profil.js uniquement.",
       font=F_PIED, fill=GRIS)

sortie = SRC / "00-planche-quiz.png"
img.save(sortie, optimize=True)
print("Planche créée :", sortie, img.size)
