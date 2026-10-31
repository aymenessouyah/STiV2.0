"""Rendu du cours « Systèmes, technologies et Internet » (3ᵉ SI).

    python3 render.py --plan                      # chronologie prévisionnelle
    python3 render.py --images /tmp/f --instants 20,90,180
    python3 render.py --sortie sortie_courssti.mp4 --audio voix-off.mp3

Sans `calage.json` (produit par `montage.py`), la durée de chaque séquence est
estimée à partir du nombre de caractères de sa narration ; avec, l'image est
calée exactement sur la voix off.
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys

from PIL import Image, ImageDraw

import narration as N
import scenes
from dessin import LARGEUR, HAUTEUR

FPS = 30
ICI = os.path.dirname(os.path.abspath(__file__))
RACINE = os.path.normpath(os.path.join(ICI, "..", ".."))

# Débit de lecture estimé (caractères par seconde) pour le plan prévisionnel.
CPS = 15.0
PAUSE = 0.8


def ffmpeg() -> str:
    local = os.path.join(RACINE, "node_modules", "@ffmpeg-installer", "linux-x64", "ffmpeg")
    return local if os.path.exists(local) else "ffmpeg"


def construire_plan(durees=None, debuts=None, total=None):
    """Chronologie : une séquence par section de la narration."""
    segments = []
    t = 0.0
    for i, section in enumerate(N.ORDRE):
        texte = N.texte_section(section)
        debut = debuts[section] if debuts else t
        duree = durees[section] if durees else len(texte) / CPS + PAUSE
        if not debuts and not durees:
            duree = max(12.0, duree)
        segments.append({
            "cle": section,
            "debut": debut,
            "fin": debut + duree,
            "duree": duree,
            "etape": i + 1,
            "titre": N.SECTIONS[section]["titre"],
        })
        t = debut + duree
    fin = segments[-1]["fin"] if segments else 0.0
    return {"segments": segments, "total": max(fin, total or 0.0)}


def segment_a(t, plan):
    for seg in plan["segments"]:
        if seg["debut"] <= t < seg["fin"]:
            return seg
    return plan["segments"][-1]


FONDU_ENTREE = 1.0     # s : la capsule s'allume en douceur
FONDU_SORTIE = 2.4     # s : elle s'éteint, au lieu de couper net


def _fondu(img: Image.Image, t: float, plan) -> Image.Image:
    """Voile noir en entrée et en sortie : la vidéo ne coupe plus abruptement."""
    noir = Image.new("RGB", img.size, (0, 0, 0))
    k = 0.0
    if t < FONDU_ENTREE:
        k = 1.0 - max(0.0, t) / FONDU_ENTREE
    reste = plan["total"] - t
    if 0.0 <= reste < FONDU_SORTIE:
        k = max(k, 1.0 - reste / FONDU_SORTIE)
    if k <= 0.004:
        return img
    return Image.blend(img, noir, min(1.0, k))


def image(t: float, plan) -> Image.Image:
    seg = segment_a(t, plan)
    p = max(0.0, min(1.0, (t - seg["debut"]) / max(0.1, seg["duree"])))
    img = Image.new("RGB", (LARGEUR, HAUTEUR), (13, 20, 36))
    d = ImageDraw.Draw(img)
    scenes.dessiner(d, seg["cle"], p, t)
    return _fondu(img, t, plan)


def encoder(plan, sortie, fps, audio=None):
    cmd = [ffmpeg(), "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
           "-s", f"{LARGEUR}x{HAUTEUR}", "-r", str(fps), "-i", "-"]
    if audio:
        cmd += ["-i", audio]
    cmd += ["-c:v", "libx264", "-preset", "medium", "-crf", "24",
            "-pix_fmt", "yuv420p", "-g", str(fps * 2), "-movflags", "+faststart"]
    if audio:
        cmd += ["-c:a", "aac", "-b:a", "112k", "-ar", "44100", "-ac", "1", "-shortest"]
    cmd += [sortie]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    total = int(round(plan["total"] * fps))
    pas = max(1, total // 100)
    for k in range(total):
        proc.stdin.write(image(k / fps, plan).tobytes())
        if k % pas == 0:
            print(f"\r  {k}/{total} images", end="", flush=True)
    proc.stdin.close()
    proc.wait()
    print(f"\r  {total}/{total} images — {sortie}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--durees", help="calage.json produit par montage.py")
    ap.add_argument("--sortie", default=os.path.join(ICI, "sortie_courssti.mp4"))
    ap.add_argument("--audio", default=None)
    ap.add_argument("--fps", type=int, default=FPS)
    ap.add_argument("--plan", action="store_true")
    ap.add_argument("--images", default=None)
    ap.add_argument("--instants", default="")
    args = ap.parse_args()

    durees = debuts = None
    if args.durees and os.path.exists(args.durees):
        with open(args.durees, encoding="utf-8") as f:
            calage = json.load(f)
        durees = calage["durees"]
        debuts = calage.get("debuts")
        total = calage.get("total")
    else:
        total = None
    plan = construire_plan(durees, debuts, total)

    if args.plan:
        for seg in plan["segments"]:
            print(f"{seg['etape']}. {seg['cle']:14s} {seg['debut']:7.1f} → {seg['fin']:7.1f} s"
                  f"  ({seg['duree']:5.1f} s)  {seg['titre']}")
        t = plan["total"]
        print(f"total : {t:.1f} s  ({int(t // 60)}:{t % 60:05.2f})  images : {int(t * args.fps)}")
        return 0

    if args.images:
        os.makedirs(args.images, exist_ok=True)
        instants = [float(v) for v in args.instants.split(",") if v.strip()] or \
            [s["debut"] + s["duree"] * f for s in plan["segments"] for f in (0.35, 0.8)]
        for instant in instants:
            chemin = os.path.join(args.images, f"i{instant:07.2f}.png")
            image(instant, plan).save(chemin)
            print(chemin)
        return 0

    audio = args.audio
    if audio is None and os.path.exists(os.path.join(ICI, "voix-off.mp3")):
        audio = os.path.join(ICI, "voix-off.mp3")
    encoder(plan, args.sortie, args.fps, audio)
    return 0


if __name__ == "__main__":
    sys.exit(main())
