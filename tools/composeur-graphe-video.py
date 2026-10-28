#!/usr/bin/env python3
"""
Compositeur d'images-clés pour la vidéo « id · class · name : le graphe ».

Génère des frames 1080×1920 (vertical, comme la vidéo de référence) pour chaque
segment de la vidéo : générique, cartes de chapitre, et phrases de dialogue.

Chaque frame montre :
  • un bandeau chapitre en haut (couleur de l'orateur),
  • l'état du graphe (SVG capturé) au centre,
  • une bulle de dialogue (avatar + orateur + phrase) en bas.

Les frames sont sauvegardés dans .video-work/frames/ et le fichier SRT dans
.video-work/out/.
"""
import json
import os
import textwrap
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# ---------------------------------------------------------------- config ----
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCEN = os.path.join(ROOT, "tools/scenario-graphe-video.json")
ETATS = os.path.join(ROOT, ".video-work/etats")
AVATARS = os.path.join(ROOT, ".video-work/assets")
FRAMES = os.path.join(ROOT, ".video-work/frames")
OUT = os.path.join(ROOT, ".video-work/out")
os.makedirs(FRAMES, exist_ok=True)
os.makedirs(OUT, exist_ok=True)

W, H = 1080, 1920
FPS = 25

# polices
F = {
    "reg": "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "bold": "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "mono": "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
    "monob": "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf",
    "os": "/tmp/fonts/fonts/Open_Sans/OpenSans-Regular.ttf",
    "osb": "/tmp/fonts/fonts/Open_Sans/OpenSans-Bold.ttf",
}

# couleurs
BG_TOP = (13, 21, 38)
BG_BOT = (26, 35, 64)
CARD = (255, 255, 255)
FG = (232, 236, 248)
MUTED = (154, 166, 196)
BORDER = (42, 56, 96)

def font(size, variant="reg"):
    return ImageFont.truetype(F[variant], size)

def couleur(hexs):
    hexs = hexs.lstrip("#")
    return tuple(int(hexs[i:i+2], 16) for i in (0, 2, 4))

def wrap(text, fnt, max_w, draw):
    """Renvoie une liste de lignes qui tiennent dans max_w pixels."""
    lines = []
    for para in text.split("\n"):
        words = para.split()
        if not words:
            lines.append("")
            continue
        line = words[0]
        for w in words[1:]:
            test = line + " " + w
            if draw.textlength(test, font=fnt) <= max_w:
                line = test
            else:
                lines.append(line)
                line = w
        lines.append(line)
    return lines

def grad_bg():
    """Gradient vertical sombre."""
    img = Image.new("RGB", (W, H), BG_TOP)
    d = ImageDraw.Draw(img)
    for y in range(H):
        t = y / H
        r = int(BG_TOP[0] + (BG_BOT[0] - BG_TOP[0]) * t)
        g = int(BG_TOP[1] + (BG_BOT[1] - BG_TOP[1]) * t)
        b = int(BG_TOP[2] + (BG_BOT[2] - BG_TOP[2]) * t)
        d.line([(0, y), (W, y)], fill=(r, g, b))
    return img

def rounded(d, box, radius, fill=None, outline=None, width=1):
    d.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)

def filigrane(img):
    """Filigrane STI V2.0 discret en haut à droite."""
    d = ImageDraw.Draw(img, "RGBA")
    f = font(26, "bold")
    d.text((W - 40, 16), "STI V2.0", fill=(255, 255, 255, 90), font=f, anchor="ra")

def cadre_chapitre(img, chapitre, couleur_hex):
    """Bandeau chapitre en haut."""
    d = ImageDraw.Draw(img, "RGBA")
    col = couleur(couleur_hex)
    # bandeau
    rounded(d, [32, 36, W - 32, 132], 28, fill=(col[0], col[1], col[2], 230))
    # texte chapitre
    f = font(40, "bold")
    d.text((64, 56), chapitre, fill=FG, font=f)
    # point décoratif
    d.ellipse([W - 76, 68, W - 48, 96], fill=FG)
    filigrane(img)

def graphe_sur(img, nom_fichier):
    """Place l'image du graphe dans la zone centrale."""
    path = os.path.join(ETATS, nom_fichier)
    if not os.path.exists(path):
        return
    g = Image.open(path).convert("RGBA")
    # zone disponible
    avail_w, avail_h = W - 60, 1240
    scale = min(avail_w / g.width, avail_h / g.height)
    nw, nh = int(g.width * scale), int(g.height * scale)
    g = g.resize((nw, nh), Image.LANCZOS)
    # fond blanc derrière (carte)
    d = ImageDraw.Draw(img, "RGBA")
    card_box = [(W - nw - 40) // 2, 170, (W + nw) // 2 + 20, 170 + nh + 20]
    rounded(d, card_box, 28, fill=(255, 255, 255, 250), outline=(255, 255, 255, 60), width=2)
    img.paste(g, ((W - nw) // 2, 180 + 10), g)

def bulle_dialogue(img, avatar_nom, orateur, phrase, couleur_hex):
    """Bulle de dialogue en bas avec avatar."""
    d = ImageDraw.Draw(img, "RGBA")
    col = couleur(couleur_hex)
    # calcul hauteur
    f_name = font(34, "bold")
    f_text = font(30, "reg")
    max_w = W - 180 - 60  # marge + avatar
    lines = wrap(phrase, f_text, max_w, d)
    n_lines = len(lines)
    line_h = 42
    bubble_h = 80 + 20 + n_lines * line_h + 28
    bx, by = 30, H - bubble_h - 40
    bw = W - 60
    # fond bulle
    rounded(d, [bx, by, bx + bw, by + bubble_h], 32, fill=(20, 30, 54, 235), outline=BORDER, width=2)
    # avatar
    av_path = os.path.join(AVATARS, f"avatar-{avatar_nom}.png")
    av_size = 120
    if os.path.exists(av_path):
        av = Image.open(av_path).convert("RGBA").resize((av_size, av_size), Image.LANCZOS)
        img.paste(av, (bx + 24, by + 28), av)
    # nom orateur
    d.text((bx + 24 + av_size + 16, by + 32), orateur, fill=col, font=f_name)
    # texte phrase
    ty = by + 32 + 50
    for ln in lines:
        d.text((bx + 24 + av_size + 16, ty), ln, fill=FG, font=f_text)
        ty += line_h

def frame_generique(scenario):
    """Frame du générique : titre + sous-titre + plateforme."""
    img = grad_bg()
    d = ImageDraw.Draw(img, "RGBA")
    gen = scenario["generique"]
    # logo STI
    f_logo = font(52, "bold")
    d.text((W // 2, 280), "STI VERSION 2.0", fill=couleur("#6d4aff"), font=f_logo, anchor="mm")
    # ligne décorative
    d.line([(W//2 - 200, 340), (W//2 + 200, 340)], fill=couleur("#6d4aff"), width=4)
    # titre principal
    f_title = font(72, "bold")
    title = gen["titre"]
    lines = wrap(title, f_title, W - 120, d)
    ty = 480
    for ln in lines:
        d.text((W // 2, ty), ln, fill=FG, font=f_title, anchor="mm")
        ty += 88
    # sous-titre (phrase d'accueil exigée)
    f_sub = font(44, "reg")
    d.text((W // 2, ty + 80), gen["sous_titre"], fill=couleur("#0e9f8e"), font=f_sub, anchor="mm")
    # plateforme
    f_plat = font(30, "reg")
    d.text((W // 2, H - 220), gen["plateforme"], fill=MUTED, font=f_plat, anchor="mm")
    # barre de progression vide
    rounded(d, [60, H - 130, W - 60, H - 122], 4, fill=(60, 72, 110))
    img.save(os.path.join(FRAMES, "generique.png"), quality=92)

def frame_chapitre(chapitre, titre, couleur_hex, numero):
    """Carte de chapitre."""
    img = grad_bg()
    d = ImageDraw.Draw(img, "RGBA")
    col = couleur(couleur_hex)
    # fond coloré
    rounded(d, [60, 300, W - 60, H - 300], 40, fill=(col[0], col[1], col[2], 230))
    # numéro
    f_num = font(160, "bold")
    d.text((W // 2, 480), f"Chapitre {numero}", fill=FG, font=f_num, anchor="mm")
    # titre
    f_titre = font(58, "bold")
    lines = wrap(titre, f_titre, W - 160, d)
    ty = 720
    for ln in lines:
        d.text((W // 2, ty), ln, fill=FG, font=f_titre, anchor="mm")
        ty += 70
    img.save(os.path.join(FRAMES, f"chapitre-{numero}.png"), quality=92)

def frame_phrase(chapitre, avatar_nom, orateur, phrase, etat, couleur_hex, numero):
    """Frame complète pour une phrase."""
    img = grad_bg()
    cadre_chapitre(img, chapitre, couleur_hex)
    # graphe
    if etat:
        graphe_sur(img, f"graphe-{etat}.png")
    bulle_dialogue(img, avatar_nom, orateur, phrase, couleur_hex)
    img.save(os.path.join(FRAMES, f"ph-{numero:04d}.png"), quality=92)

def fmt_srt(s):
    h = int(s // 3600)
    m = int((s % 3600) // 60)
    sec = s % 60
    return f"{h:02d}:{m:02d}:{sec:06.3f}".replace(".", ",")

def main():
    scenario = json.load(open(SCEN))
    # 1. générique
    frame_generique(scenario)
    print("✓ générique")
    # 2. chapitres + phrases
    srt_entries = []
    # générique
    srt_entries.append(("[GÉNÉRIQUE]", 0.0, scenario["duree_generique"]))
    t = scenario["duree_generique"]
    # carte chapitre 1
    chap1 = scenario["clips"][0]["chapitre"]
    titre1 = scenario["clips"][0]["titre"]
    col1 = scenario["clips"][0]["couleur"]
    srt_entries.append((f"[{chap1}]", t, t + 2.6))
    frame_chapitre(chap1, titre1, col1, 1)
    t += 2.6
    nph = 0
    for ci, c in enumerate(scenario["clips"]):
        chapitre = c["chapitre"]
        couleur_hex = c["couleur"]
        avatar = {"SECRÉTAIRE": "secretaire", "PROFESSEUR": "professeur", "ÉLÈVE": "eleve"}[c["orateur"]]
        if ci > 0:
            srt_entries.append((f"[{chapitre}]", t, t + 2.6))
            frame_chapitre(chapitre, c["titre"], couleur_hex, ci + 1)
            t += 2.6
        for i, (a, b, share) in enumerate(c["timeline"]):
            phr = c["phrases"][i]
            etat = c["etats"][i]
            frame_phrase(chapitre, avatar, c["orateur"], phr, etat, couleur_hex, nph)
            srt_entries.append((f"{c['orateur']} : {phr}", t + a, t + b))
            nph += 1
        t += c["duree_audio"] + scenario["pause_entre_clips"]
    # écriture SRT
    with open(os.path.join(OUT, "graphe.srt"), "w", encoding="utf-8") as f:
        for i, (texte, a, b) in enumerate(srt_entries, 1):
            f.write(f"{i}\n{fmt_srt(a)} --> {fmt_srt(b)}\n{texte}\n\n")
    print(f"✓ {nph} frames de phrases + chapitres + générique")
    print(f"✓ SRT: {len(srt_entries)} entrées, durée totale ~{t:.1f}s")
    print(f"  frames dans {FRAMES}")

if __name__ == "__main__":
    main()
