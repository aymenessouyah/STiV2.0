"""Rendu des capsules TP longues (15-20 min).

    python3 build.py scenes_events sortie.mp4
    python3 build.py apercu scenes_events /tmp/a.mp4 3 12   # 3 scènes, 12 s chacune

Chaque scène = une narration (voix/*.mp3), un code affiché dans l'éditeur, une ou
plusieurs pages de navigateur et une liste d'étapes (curseur, survol, clic,
frappe, bulle explicative).
"""
import importlib
import os
import re
import subprocess
import sys
import textwrap
import wave

from PIL import Image, ImageDraw

import lib as R

ICI = os.path.dirname(os.path.abspath(__file__))
FF = os.path.join(ICI, "..", "..", "node_modules", "@ffmpeg-installer", "linux-x64", "ffmpeg")
FF = os.path.normpath(FF)
VOIX = os.path.join(ICI, "voix")
TMP = os.path.join(ICI, "audio")
FPS = 12
L, H = R.L, R.H
SR = 44100
PAUSE = 0.7

os.makedirs(TMP, exist_ok=True)

BOX_CODE = (16, 60, 686, 668)
BOX_PAGE = (696, 60, 1264, 668)
BOX_LARGE = (16, 60, 1264, 668)
BOX_CODE_ETROIT = (16, 60, 470, 668)
BOX_DROITE = (486, 60, 1264, 668)

TOUS = []


# ------------------------------------------------------------------- audio
def duree(chemin):
    sortie = subprocess.run([FF, "-hide_banner", "-i", chemin], capture_output=True, text=True).stderr
    m = re.search(r"Duration: (\d+):(\d+):(\d+\.\d+)", sortie)
    if not m:
        return 0.0
    h, mn, s = m.groups()
    return int(h) * 3600 + int(mn) * 60 + float(s)


def pcm(chemin):
    return subprocess.run([FF, "-v", "error", "-i", chemin, "-f", "s16le", "-ac", "1",
                           "-ar", str(SR), "-"], capture_output=True).stdout


def silence(d):
    return b"\x00\x00" * int(SR * d)


def sous_titres(texte, debut, fin, maxi=52):
    phrases = re.split(r"(?<=[.!?])\s+", texte.strip())
    blocs = []
    for phrase in phrases:
        blocs.extend(textwrap.wrap(phrase, maxi) or [phrase])
    total = sum(len(b) for b in blocs) or 1
    d = fin - debut
    sortie, curseur = [], debut
    for b in blocs:
        part = len(b) / total
        sortie.append((curseur, curseur + part * d, b))
        curseur += part * d
    return sortie


def construire_audio(SCENES):
    morceaux = [silence(0.6)]
    ecoule = 0.6
    for scene in SCENES:
        scene["debut"] = ecoule
        if scene.get("voix"):
            chemin = os.path.join(VOIX, scene["voix"])
            donnees = pcm(chemin)
            morceaux.append(donnees)
            ecoule += len(donnees) / (2 * SR)
        else:
            d = float(scene.get("duree", 8))
            morceaux.append(silence(d))
            ecoule += d
        scene["fin_scene"] = ecoule
        morceaux.append(silence(PAUSE))
        ecoule += PAUSE
    chemin = os.path.join(TMP, os.path.basename(SCENES[0].get("_wav", "piste")) + ".wav")
    with wave.open(chemin, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(b"".join(morceaux))
    TOUS.clear()
    for sc in SCENES:
        if sc.get("texte"):
            TOUS.extend(sous_titres(sc["texte"], sc["debut"], sc["fin_scene"]))
    return chemin, ecoule


# ------------------------------------------------------------------- états
def etat_scene(scene, p):
    etapes = scene.get("etapes", [])
    points = [(0.0, 640, 600)] + [(e["f"], e["x"], e["y"]) for e in etapes]
    points.sort(key=lambda t: t[0])
    pos = R.interpoler(points, p)
    courante = None
    for e in etapes:
        if p >= e["f"]:
            courante = e
    survol, clic, focus, clavier, bulle = [], None, None, [], None
    if courante:
        if courante.get("s"):
            survol.append(courante["s"])
        clic = courante.get("clic")
        focus = courante.get("focus")
        clavier = courante.get("k", [])
        if courante.get("q"):
            bulle = (courante["q"], courante.get("qc"))
        if clic:
            duree = max(0.2, scene["fin_scene"] - scene["debut"])
            if p > courante["f"] + 1.3 / duree:
                clic = None
    return R.Etat(survol=survol, clic=clic, focus=focus, curseur=pos, touches=clavier,
                  bulle=bulle, temps=scene["debut"] + p * max(0.1, scene["fin_scene"] - scene["debut"]),
                  p=p)


def page_active(scene, p):
    pages = scene.get("pages") or []
    choix = None
    for pg in pages:
        if p >= pg.get("debut", 0.0):
            choix = pg
    return choix


# ------------------------------------------------------------------- dessin
def dessiner(t, index, scene, total, cartons):
    duree = max(0.1, scene["fin_scene"] - scene["debut"])
    p = min(1.0, max(0.0, (t - scene["debut"]) / duree))
    typ = scene.get("type", "code")

    if typ == "intro":
        im = R.carte_intro(min(1.0, 0.35 + (t - scene["debut"]) / 2.2), scene["titre"], scene["episodes"])
        d = ImageDraw.Draw(im)
        R.barre_sup(im, d, "INTRODUCTION", 0.0, cartons["sous_titre"])
        return im
    if typ == "fin":
        im = R.carte_fin(min(1.0, 0.45 + (t - scene["debut"]) / 2.2), scene["titre"], scene["lignes"],
                         scene["pied"])
        d = ImageDraw.Draw(im)
        R.barre_sup(im, d, "FIN", 1.0, cartons["sous_titre"])
        return im

    im = R.FOND_BASE.copy()
    d = ImageDraw.Draw(im)
    ep = scene.get("ep")
    etiquette = f"ÉPISODE {ep} / 3   ·   {int(p * 100)} %" if ep else f"TP ANIMÉ   ·   {int(p * 100)} %"
    R.barre_sup(im, d, etiquette, t / total, cartons["sous_titre"])

    e = etat_scene(scene, p)
    page = page_active(scene, p)
    zones = {}
    box = BOX_LARGE

    if scene.get("code") and typ in ("code", "decor"):
        ligne_code = scene["code"].rstrip("\n").split("\n")
        # v510 : une scène peut retarder l'écriture du CSS (la boîte parle d'abord).
        debut_code, fin_code = scene.get("code_fenetre", (0.0, 0.4))
        avancement = min(1.0, max(0.0, (p - debut_code) / max(1e-6, fin_code - debut_code)))
        cycle = max(1, len(ligne_code) - 2)
        surligne = None
        if avancement > 0.05:
            surligne = min(len(ligne_code) - 1,
                           int(((avancement - 0.05) / 0.95) * cycle * (scene.get("cycles", 1.0))) % cycle)
        R.editeur(im, d, ligne_code, BOX_CODE, avancement, surligne,
                   scene.get("fichier") or cartons.get("fichier", "tp.html"))
        box = BOX_PAGE
        d = ImageDraw.Draw(im)

    if page:
        R.navigateur(im, d, box, page.get("url", cartons.get("url", "tp.html")))
        zones = R.Page(page["widgets"]).dessiner(im, d, box, e)
        d = ImageDraw.Draw(im)

    if page and page.get("decor"):
        zones.update(page["decor"](im, d, box, p, e))
        d = ImageDraw.Draw(im)

    if e.touches:
        R.touches(im, d, e.touches, x=box[0] + 24, y=box[1] + 48)
        d = ImageDraw.Draw(im)
    if e.bulle:
        texte, cible = e.bulle
        z = zones.get(cible)
        if z:
            R.bulle(im, d, texte, z)
            d = ImageDraw.Draw(im)
    if e.curseur:
        im = R.curseur(im, e.curseur[0], e.curseur[1], clic=bool(e.clic))
        d = ImageDraw.Draw(im)

    sous, part = R.position_sous_titre(TOUS, t)
    return R.sous_titre(im, d, sous, part)


# ------------------------------------------------------------------- rendu
def rendre(SCENES, cartons, sortie, preset="medium", crf=25):
    wav, total = construire_audio(SCENES)
    print(f"audio : {total:.1f} s ({total / 60:.1f} min)", flush=True)
    images = int(round(total * FPS))
    cmd = [FF, "-y", "-hide_banner", "-loglevel", "error",
           "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{L}x{H}", "-r", str(FPS), "-i", "-",
           "-i", wav, "-c:v", "libx264", "-preset", preset, "-crf", str(crf), "-pix_fmt", "yuv420p",
           "-c:a", "aac", "-b:a", "96k", "-ac", "1", "-movflags", "+faststart", "-shortest", sortie]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    idx = 0
    for n in range(images):
        t = n / FPS
        while idx < len(SCENES) - 1 and t >= SCENES[idx]["fin_scene"]:
            idx += 1
        proc.stdin.write(dessiner(t, idx, SCENES[idx], total, cartons).convert("RGB").tobytes())
        if n % 900 == 0:
            print(f"  {n}/{images} ({100 * n / images:.0f} %)", flush=True)
    proc.stdin.close()
    proc.wait()
    print("terminé :", sortie, os.path.getsize(sortie), "octets", flush=True)


def main():
    module = sys.argv[1] if len(sys.argv) > 1 else "scenes_events"
    sortie = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ICI, "sortie.mp4")
    mod = importlib.import_module(module)
    SCENES = mod.SCENES
    cartons = mod.CARTONS
    manquants = [s["voix"] for s in SCENES if s.get("voix") and
                 not os.path.exists(os.path.join(VOIX, s["voix"]))]
    if manquants:
        print("voix manquantes :", manquants)
        return 1
    rendre(SCENES, cartons, sortie)


def apercu():
    module = sys.argv[2]
    sortie = sys.argv[3]
    nombre = int(sys.argv[4]) if len(sys.argv) > 4 else 3
    duree_fixe = float(sys.argv[5]) if len(sys.argv) > 5 else 12.0
    mod = importlib.import_module(module)
    SCENES = mod.SCENES[:nombre]
    for sc in SCENES:
        sc.setdefault("duree", duree_fixe)
        sc["voix"] = None
    rendre(SCENES, mod.CARTONS, sortie, preset="veryfast", crf=27)


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "apercu":
        apercu()
    else:
        main()
