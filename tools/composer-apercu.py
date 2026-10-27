#!/usr/bin/env python3
"""Compose la planche d'aperçu unique à partir des captures du dossier /apercu.

Usage : python3 tools/composer-apercu.py
Dépendance : Pillow (pip install Pillow). Aucune image n'est téléchargée.
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
APERCU = ROOT / "apercu"

W, H = 1600, 1300
MARGE, GOUTTIERE = 40, 20
TUILLE_W, IMG_H, ETIQUETTE_H = 493, 308, 40
LIGNE_H = IMG_H + ETIQUETTE_H
LIGNES_Y = [140, 140 + LIGNE_H + GOUTTIERE, 140 + 2 * (LIGNE_H + GOUTTIERE)]
COLONNES_X = [MARGE, MARGE + TUILLE_W + GOUTTIERE, MARGE + 2 * (TUILLE_W + GOUTTIERE)]

FOND_HAUT, FOND_BAS = (11, 18, 32), (22, 35, 59)
CARTE, BORDURE = (17, 28, 48), (42, 58, 84)
BLANC, GRIS, ACCENT = (241, 246, 255), (150, 166, 192), (90, 169, 255)


def police(gras=False, taille=18):
    """Cherche une police système avec accents, sinon police Pillow."""
    noms = ["DejaVuSans-Bold.ttf", "DejaVuSans.ttf"] if gras else ["DejaVuSans.ttf"]
    for dossier in ("/usr/share/fonts/truetype/dejavu", "/usr/share/fonts", "/tmp/fonts/fonts"):
        for nom in noms:
            p = Path(dossier) / nom
            if p.exists():
                return ImageFont.truetype(str(p), taille)
    return ImageFont.load_default(size=taille)


F_TITRE = police(True, 40)
F_SOUS = police(False, 18)
F_ETIQUETTE = police(True, 18)
F_PETIT = police(False, 14)
F_CARTE_TITRE = police(True, 22)
F_CARTE_TEXTE = police(False, 16)
F_PIED = police(False, 15)

# ---------------------------------------------------------------------------
# Fond dégradé
# ---------------------------------------------------------------------------
planche = Image.new("RGB", (W, H))
d = ImageDraw.Draw(planche)
for y in range(H):
    k = y / (H - 1)
    d.line([(0, y), (W, y)], fill=tuple(int(a + (b - a) * k) for a, b in zip(FOND_HAUT, FOND_BAS)))
d.rectangle([0, 0, W, 5], fill=ACCENT)

# En-tête
d.text((MARGE, 30), "STI V2.0 — Aperçu de la refonte UI/UX", font=F_TITRE, fill=BLANC)
d.text((MARGE, 88), "Lycée Raféha · 3ème & 4ème SI · M. Aymen Essouyah — 7 vues réelles (Chromium headless, 1440 × 900)",
       font=F_SOUS, fill=GRIS)
pilule = (1260, 34, 1560, 74)
d.rounded_rectangle(pilule, radius=20, fill=(28, 47, 78), outline=(64, 104, 165))
d.text((pilule[0] + 24, pilule[1] + 11), "DESIGN SYSTEM · 3 THÈMES", font=F_PETIT, fill=(169, 205, 255))

# ---------------------------------------------------------------------------
# Tuiles
# ---------------------------------------------------------------------------
cases = [
    ("01-accueil-sombre.png", "01  ·  Accueil — mode sombre"),
    ("02-videos.png", "02  ·  Vidéos prioritaires (8 .mp4)"),
    ("03-accueil-clair.png", "03  ·  Accueil — mode clair"),
    ("04-tableau-de-bord.png", "04  ·  Tableau de bord abonné"),
    ("05-cours-html5.png", "05  ·  Page matière (4 onglets)"),
    ("06-glossaire.png", "06  ·  Glossaire FR · EN · AR"),
]

for i, (fichier, titre) in enumerate(cases):
    x, y = COLONNES_X[i % 3], LIGNES_Y[i // 3]
    d.rounded_rectangle([x, y, x + TUILLE_W, y + LIGNE_H], radius=12, fill=CARTE, outline=BORDURE)
    with Image.open(APERCU / fichier) as im:
        im = im.convert("RGB").resize((TUILLE_W, IMG_H), Image.LANCZOS)
        planche.paste(im, (x, y))
    d.line([(x, y + IMG_H), (x + TUILLE_W, y + IMG_H)], fill=BORDURE, width=1)
    d.text((x + 14, y + IMG_H + 10), titre, font=F_ETIQUETTE, fill=BLANC)

# ---------------------------------------------------------------------------
# Tuile mobile (3e ligne, 1re colonne) : téléphone centré sur fond sombre
# ---------------------------------------------------------------------------
x, y = COLONNES_X[0], LIGNES_Y[2]
d.rounded_rectangle([x, y, x + TUILLE_W, y + LIGNE_H], radius=12, fill=CARTE, outline=BORDURE)
with Image.open(APERCU / "07-mobile.png") as im:
    im = im.convert("RGB")
    h = IMG_H - 12
    w = int(im.width * h / im.height)
    im = im.resize((w, h), Image.LANCZOS)
    px = x + (TUILLE_W - w) // 2
    py = y + 6
    d.rounded_rectangle([px - 5, py - 5, px + w + 5, py + h + 5], radius=14, outline=(95, 130, 185), width=2)
    planche.paste(im, (px, py))
d.line([(x, y + IMG_H), (x + TUILLE_W, y + IMG_H)], fill=BORDURE, width=1)
d.text((x + 14, y + IMG_H + 10), "07  ·  Mobile 390 px", font=F_ETIQUETTE, fill=BLANC)

# ---------------------------------------------------------------------------
# Deux cartes de synthèse (3e ligne, colonnes 2 et 3)
# ---------------------------------------------------------------------------
infos = [
    ("Design system", [
        "3 thèmes sans flash : sombre / clair / intermédiaire",
        "Glassmorphism, cartes, badges, onglets, modales",
        "1 accent par matière : HTML · CSS · JS · SQL · PHP",
        "Mobile-first, RTL arabe, prefers-reduced-motion",
        "Aucune image externe, aucun framework",
    ]),
    ("Fonctionnalités conservées", [
        "Badge Abonné + panneau profil latéral",
        "Tableau de bord : notes, quiz, vidéos, nouveautés",
        "Lecteur .mp4 avec poster, durée et plein écran",
        "Anciens exercices redirigés vers #exercices",
        "profilAbonne = 1 seul objet localStorage",
    ]),
]

for j, (titre, lignes) in enumerate(infos):
    x, y = COLONNES_X[j + 1], LIGNES_Y[2]
    d.rounded_rectangle([x, y, x + TUILLE_W, y + LIGNE_H], radius=12, fill=CARTE, outline=BORDURE)
    d.rectangle([x, y, x + 6, y + LIGNE_H], fill=ACCENT)
    d.text((x + 24, y + 22), titre, font=F_CARTE_TITRE, fill=BLANC)
    yy = y + 68
    for ligne in lignes:
        d.ellipse([x + 26, yy + 7, x + 32, yy + 13], fill=ACCENT)
        d.text((x + 44, yy), ligne, font=F_CARTE_TEXTE, fill=GRIS)
        yy += 43

# Pied de page
d.line([(MARGE, 1252), (W - MARGE, 1252)], fill=BORDURE, width=1)
d.text((MARGE, 1264),
       "Aperçu local : verrou d'accès neutralisé uniquement pour la démonstration — aucune donnée Supabase, aucun fichier protégé modifié.",
       font=F_PIED, fill=GRIS)

sortie = APERCU / "00-apercu-general.png"
planche.save(sortie, optimize=True)
print("Planche créée :", sortie, planche.size)
