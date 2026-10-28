#!/usr/bin/env python3
"""v509 — vidéo de fond du bloc « Bonjour » : drapeau STI bleu nuit au vent.

Le drapeau porte, floqués dans la toile :
  • le logo STI (pastille crème),
  • le texte « STI V2.0 » puis « By A'e »,
  • un QR code décoratif (volontairement NON scannable : bas contraste, trame
    diagonale fine, et déformation par les plis du tissu).

Le vent est une onde progressive : chaque colonne de toile est décalée
verticalement et horizontalement, avec une amplitude qui grandit vers le bord
libre (le mât reste fixe) ; l'éclairage des plis est recalculé colonne par
colonne. La phase parcourt exactement un tour sur N images : la boucle est donc
parfaite, sans raccord visible.

Sortie : 1280 × 720, 12 i/s, 8 s, H.264 (yuv420p) sans audio — la vidéo de fond
est toujours jouée en muet par index.html.

Usage :
    python3 outils/drapeau-vent/rendre_drapeau.py            # rend + encode
    python3 outils/drapeau-vent/rendre_drapeau.py --apercu 0 # une seule image
"""

import argparse
import math
import os
import shutil
import subprocess
import tempfile

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

RACINE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

# ── Format ────────────────────────────────────────────────────────────────────
LARGEUR, HAUTEUR = 1280, 720
IMAGES_PAR_SECONDE = 12
NB_IMAGES = 96              # 96 / 12 = 8 s

# ── Drapeau ───────────────────────────────────────────────────────────────────
DRAPEAU_X = 100
DRAPEAU_Y = 104
DRAPEAU_L = 1140
DRAPEAU_H = 512
CYCLES_ONDE = 1.15          # nombre de vagues visibles sur la largeur
AMPLITUDE_Y = 34.0          # débattement vertical au bord libre (px)
AMPLITUDE_X = 4.0           # froissement horizontal (px)
INCLINAISON = 6.0           # léger tombé du tissu vers la droite (px)

# ── Palette ───────────────────────────────────────────────────────────────────
BLEU_NUIT = (16, 41, 74)      # toile darkblue
BLEU_NUIT_CLAIR = (30, 70, 118)
BLEU_NUIT_FONCE = (8, 22, 44)
CREME = (243, 237, 226)
BLANC = (245, 248, 255)
BLEU_TEXTE = (168, 215, 247)

POLICE_GRAS = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
POLICE_NORMAL = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"


def police(taille, gras=True):
    chemin = POLICE_GRAS if gras else POLICE_NORMAL
    if not os.path.exists(chemin):
        return ImageFont.load_default()
    return ImageFont.truetype(chemin, taille)


def melange(base, autre, part):
    return tuple(int(round(a + (b - a) * part)) for a, b in zip(base, autre))


# ── Toile plate ───────────────────────────────────────────────────────────────
def texture_drapeau():
    """Drapeau à plat, avant déformation : tissu, logo, textes, QR décoratif."""
    largeur, hauteur = DRAPEAU_L, DRAPEAU_H
    toile = Image.new("RGB", (largeur, hauteur), BLEU_NUIT)
    pixels = np.zeros((hauteur, largeur, 3), dtype=np.float32)

    # Dégradé vertical : le tissu s'éclaircit au-dessus du pli médian.
    y = np.linspace(0.0, 1.0, hauteur, dtype=np.float32)[:, None, None]
    haut = np.array(BLEU_NUIT_FONCE, dtype=np.float32)[None, None, :]
    milieu = np.array(BLEU_NUIT_CLAIR, dtype=np.float32)[None, None, :]
    bas = np.array(BLEU_NUIT, dtype=np.float32)[None, None, :]
    part = np.clip(np.sin(y * math.pi), 0.0, 1.0)
    pixels[:] = bas + (milieu - bas) * part + (haut - bas) * (1.0 - part) * 0.55

    # Trame du tissu : fines lignes horizontales + grain régulier.
    xs = np.arange(largeur, dtype=np.float32)
    ys = np.arange(hauteur, dtype=np.float32)[:, None]
    trame = 1.0 + 0.030 * np.sin(ys * math.pi / 2.0) + 0.012 * np.sin(xs * math.pi / 6.0)
    pixels *= trame[:, :, None]

    # Grain organique très léger (déterministe : même vidéo à chaque rendu).
    generateur = np.random.default_rng(509)
    pixels += generateur.normal(0.0, 2.2, pixels.shape)

    toile = Image.fromarray(np.clip(pixels, 0, 255).astype(np.uint8))

    # Couture : fine ligne crème en pointillés à 16 px du bord.
    couture = Image.new("RGBA", (largeur, hauteur), (0, 0, 0, 0))
    pinceau = ImageDraw.Draw(couture)
    marge = 16
    pas = 14
    for x in range(marge, largeur - marge, pas):
        pinceau.line([(x, marge), (x + 7, marge)], fill=CREME + (110,), width=2)
        pinceau.line([(x, hauteur - marge), (x + 7, hauteur - marge)], fill=CREME + (110,), width=2)
    for y2 in range(marge, hauteur - marge, pas):
        pinceau.line([(marge, y2), (marge, y2 + 7)], fill=CREME + (110,), width=2)
        pinceau.line([(largeur - marge, y2), (largeur - marge, y2 + 7)], fill=CREME + (110,), width=2)
    toile = Image.alpha_composite(toile.convert("RGBA"), couture).convert("RGB")

    # Pastille crème + logo STI (broderie).
    logo = Image.open(os.path.join(RACINE, "assets/icons/sti-icon-512.png")).convert("RGB")
    cote_logo = 126
    logo = logo.resize((cote_logo, cote_logo), Image.LANCZOS)
    pastille_l, pastille_h = 156, 156
    px, py = 58, (hauteur - pastille_h) // 2
    ombre = Image.new("RGBA", (largeur, hauteur), (0, 0, 0, 0))
    ImageDraw.Draw(ombre).rounded_rectangle(
        [px + 3, py + 5, px + pastille_l + 3, py + pastille_h + 5], radius=26, fill=(0, 0, 0, 90)
    )
    toile = Image.alpha_composite(toile.convert("RGBA"), ombre.filter(ImageFilter.GaussianBlur(6)))

    plaque = Image.new("RGBA", (largeur, hauteur), (0, 0, 0, 0))
    ImageDraw.Draw(plaque).rounded_rectangle(
        [px, py, px + pastille_l, py + pastille_h], radius=26, fill=CREME + (255,),
        outline=(214, 205, 190, 255), width=2,
    )
    toile = Image.alpha_composite(toile, plaque)
    toile.paste(logo, (px + (pastille_l - cote_logo) // 2, py + (pastille_h - cote_logo) // 2))
    toile = toile.convert("RGB")

    # Textes floqués.
    dessin = ImageDraw.Draw(toile)
    titre = "STI V2.0"
    signature = "By A'e"
    centre_titre = 520

    dessin.text((centre_titre, 186), titre, font=police(108), fill=BLANC, anchor="mm", stroke_width=2,
                stroke_fill=melange(BLANC, BLEU_NUIT_FONCE, 0.35))
    dessin.text((centre_titre, 284), signature, font=police(60, gras=False), fill=BLEU_TEXTE, anchor="mm")
    # Filet de séparation sous la signature.
    dessin.line([(centre_titre - 104, 336), (centre_titre + 104, 336)], fill=BLEU_TEXTE + (160,), width=2)

    # QR décoratif : bas contraste + trame diagonale ⇒ volontairement non scannable.
    qr = Image.open(os.path.join(RACINE, "assets/images/qr-code-site.png")).convert("L")
    cote_qr = 146
    qr = qr.resize((cote_qr, cote_qr), Image.NEAREST)
    qr = Image.eval(qr, lambda v: int(255 - (255 - v) * 0.45))   # aplatit le contraste
    qr_couleur = Image.new("RGB", (cote_qr, cote_qr), melange(CREME, BLEU_NUIT_CLAIR, 0.62))
    qr_couleur.paste(Image.new("RGB", (cote_qr, cote_qr), CREME), (0, 0), qr)

    qx, qy = largeur - 240, (hauteur - cote_qr) // 2
    plaque_qr = Image.new("RGBA", (largeur, hauteur), (0, 0, 0, 0))
    ImageDraw.Draw(plaque_qr).rounded_rectangle(
        [qx - 12, qy - 12, qx + cote_qr + 12, qy + cote_qr + 12], radius=18, fill=CREME + (215,)
    )
    toile = Image.alpha_composite(toile.convert("RGBA"), plaque_qr)
    toile.paste(qr_couleur, (qx, qy))

    # Trame diagonale fine, strictement contenue dans la plaque du QR.
    hachures = Image.new("RGBA", (cote_qr, cote_qr), (0, 0, 0, 0))
    trait = ImageDraw.Draw(hachures)
    for d in range(-cote_qr, cote_qr * 2, 9):
        trait.line(
            [(d, 0), (d + cote_qr, cote_qr)],
            fill=melange(CREME, BLEU_NUIT_CLAIR, 0.5) + (55,), width=2,
        )
    toile.alpha_composite(hachures, (qx, qy))

    return toile.convert("RGB")


# ── Déformation « vent » ──────────────────────────────────────────────────────
def fond(depuis, vers):
    """Ciel sombre dégradé + halo derrière le drapeau + vignettage."""
    y = np.linspace(0.0, 1.0, HAUTEUR, dtype=np.float32)[:, None, None]
    x = np.linspace(0.0, 1.0, LARGEUR, dtype=np.float32)[None, :]
    a = np.array(depuis, dtype=np.float32)[None, None, :]
    b = np.array(vers, dtype=np.float32)[None, None, :]
    image = a + (b - a) * (y ** 0.9)
    image = np.broadcast_to(image, (HAUTEUR, LARGEUR, 3)).copy()

    yy = np.linspace(0.0, 1.0, HAUTEUR, dtype=np.float32)[:, None]
    halo = np.exp(-(((x - 0.55) ** 2) / 0.16 + ((yy - 0.5) ** 2) / 0.40)) * 26.0
    image += halo[:, :, None]

    vignette = 1.0 - 0.42 * (((x - 0.5) ** 2) * 1.5 + ((yy - 0.5) ** 2) * 1.1)
    image *= np.clip(vignette, 0.25, 1.0)[:, :, None]
    return np.clip(image, 0, 255).astype(np.uint8)


def dessiner_mat(calque):
    """Mât métallique, pommeau et ombre portée sur la toile."""
    dessin = ImageDraw.Draw(calque)
    x0 = DRAPEAU_X - 26
    dessin.rounded_rectangle([x0, 58, x0 + 20, HAUTEUR - 18], radius=8, fill=(58, 66, 78, 255))
    dessin.line([(x0 + 5, 66), (x0 + 5, HAUTEUR - 26)], fill=(96, 106, 122, 255), width=3)
    dessin.line([(x0 + 15, 66), (x0 + 15, HAUTEUR - 26)], fill=(28, 33, 42, 255), width=3)
    dessin.ellipse([x0 - 6, 40, x0 + 26, 72], fill=(126, 136, 152, 255), outline=(52, 60, 72, 255))


def rendre_image(toile, indice, total=NB_IMAGES):
    """Une image : onde progressive appliquée colonne par colonne."""
    largeur, hauteur = DRAPEAU_L, DRAPEAU_H
    t = np.asarray(toile, dtype=np.float32)

    u = np.arange(largeur, dtype=np.float32) / (largeur - 1)          # 0 → 1
    phase = 2.0 * math.pi * (CYCLES_ONDE * u - indice / total)

    bord = 0.12 + 0.88 * u ** 1.45                                    # fixe au mât
    decalage_y = (AMPLITUDE_Y * np.sin(phase) + INCLINAISON * u) * bord / 0.88
    decalage_x = AMPLITUDE_X * np.sin(phase + 0.7) * bord * 0.9

    # Colonne source de chaque colonne affichée (froissement horizontal).
    source_x = np.clip(np.round(np.arange(largeur) + decalage_x), 0, largeur - 1).astype(np.int32)
    # Ligne source : décalage vertical, avec marge pour ne pas tirer les bords.
    marge = int(math.ceil(AMPLITUDE_Y + abs(INCLINAISON))) + 4
    rembourre = np.pad(t, ((marge, marge), (0, 0), (0, 0)), mode="edge")
    lignes = np.arange(hauteur, dtype=np.float32)[:, None] - decalage_y[None, :]
    lignes = np.clip(np.round(lignes) + marge, 0, hauteur + 2 * marge - 1).astype(np.int32)
    rendre = np.take_along_axis(rembourre, lignes[:, :, None], axis=0)          # (h, l, 3)
    rendre = np.take_along_axis(rendre, np.broadcast_to(source_x[None, :, None], rendre.shape), axis=1)

    # Éclairage des plis : une face éclairée, une face à l'ombre.
    eclat = (0.93 + 0.11 * np.cos(phase + 0.35)) * (0.97 + 0.03 * np.cos(phase * 2.0))
    rendre *= eclat[None, :, None]
    # Haut et bas légèrement plus sombres (le tissu s'enroule).
    bords = np.clip(np.minimum(np.arange(hauteur), hauteur - 1 - np.arange(hauteur)) / 22.0, 0, 1)
    rendre *= (0.74 + 0.26 * bords)[:, None, None]

    drapeau = Image.fromarray(np.clip(rendre, 0, 255).astype(np.uint8)).convert("RGBA")

    cadre = Image.fromarray(fond((6, 11, 20), (13, 26, 44))).convert("RGBA")

    # Ombre portée du drapeau.
    ombre = Image.new("RGBA", (LARGEUR, HAUTEUR), (0, 0, 0, 0))
    ImageDraw.Draw(ombre).rectangle(
        [DRAPEAU_X + 6, DRAPEAU_Y + 12, DRAPEAU_X + DRAPEAU_L + 6, DRAPEAU_Y + DRAPEAU_H + 12],
        fill=(2, 5, 10, 165),
    )
    cadre = Image.alpha_composite(cadre, ombre.filter(ImageFilter.GaussianBlur(16)))

    dessiner_mat(cadre)
    cadre.alpha_composite(drapeau, (DRAPEAU_X, DRAPEAU_Y))

    # Voile sombre en bas, pour que le texte de l'accueil reste lisible.
    voile = np.clip((np.linspace(0.0, 1.0, HAUTEUR, dtype=np.float32) - 0.55) / 0.45, 0, 1) ** 1.4
    voile = voile[:, None]
    arr = np.asarray(cadre.convert("RGB"), dtype=np.float32)
    arr *= (1.0 - voile * 0.42)[:, :, None]
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))


def encoder(dossier, sortie):
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        candidat = os.path.join(RACINE, "node_modules/@ffmpeg-installer/linux-x64/ffmpeg")
        ffmpeg = candidat if os.path.exists(candidat) else None
    if not ffmpeg:
        raise SystemExit("ffmpeg introuvable : installer @ffmpeg-installer/ffmpeg (npm) ou ffmpeg système.")
    commande = [
        ffmpeg, "-y", "-v", "error",
        "-framerate", str(IMAGES_PAR_SECONDE),
        "-i", os.path.join(dossier, "%04d.png"),
        "-c:v", "libx264", "-profile:v", "high", "-level", "4.0",
        "-pix_fmt", "yuv420p", "-crf", "24", "-preset", "medium",
        "-movflags", "+faststart", "-an",
        sortie,
    ]
    subprocess.run(commande, check=True)


def main():
    parseur = argparse.ArgumentParser(description="Drapeau STI animé par le vent")
    parseur.add_argument("--apercu", type=int, default=None, help="rendre une seule image (indice)")
    parseur.add_argument("--sortie", default=os.path.join(RACINE, "assets/video/drapeau-sti-vent.mp4"))
    options = parseur.parse_args()

    toile = texture_drapeau()

    if options.apercu is not None:
        image = rendre_image(toile, options.apercu)
        chemin = os.path.join(RACINE, "build/drapeau-vent/apercu-%03d.png" % options.apercu)
        os.makedirs(os.path.dirname(chemin), exist_ok=True)
        image.save(chemin)
        print(chemin)
        return

    dossier = tempfile.mkdtemp(prefix="drapeau-vent-")
    for i in range(NB_IMAGES):
        rendre_image(toile, i).save(os.path.join(dossier, "%04d.png" % i))
    os.makedirs(os.path.dirname(options.sortie), exist_ok=True)
    encoder(dossier, options.sortie)
    shutil.rmtree(dossier, ignore_errors=True)
    print(options.sortie, os.path.getsize(options.sortie), "octets")


if __name__ == "__main__":
    main()
