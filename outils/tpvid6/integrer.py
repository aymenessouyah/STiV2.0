#!/usr/bin/env python3
"""Installe la vidéo du TP Train dans le site et met à jour le cache hors-ligne.

    python3 integrer.py            # copie le MP4 + le VTT, réécrit les durées
    python3 integrer.py --verifier # contrôle seulement (aucune écriture)

Actions :
1. copie `sortie_tp6.mp4` vers `assets/videos/tp-train-serie6.mp4` ;
2. copie `tp-train-serie6.vtt` vers `assets/subtitles/tp-train-serie6-fr.vtt` ;
3. relit la durée réelle par ffmpeg et met à jour les badges « (7:07) » de
   `cours/javascript.html` (carte vidéo) et `assets/js/app.js` (catalogue) ;
4. contrôle que le MP4 et le VTT sont présents dans OFFLINE_LIST du service worker.

Le service worker (UPDATE_ID, UPDATE_FILES) et `offline-complete-manifest.json`
sont mis à jour par le script de publication habituel du dépôt.
"""
import os
import re
import shutil
import subprocess
import sys

ICI = os.path.dirname(os.path.abspath(__file__))
RACINE = os.path.normpath(os.path.join(ICI, "..", ".."))
FF = os.path.normpath(os.path.join(RACINE, "node_modules", "@ffmpeg-installer", "linux-x64", "ffmpeg"))

SOURCE_MP4 = os.path.join(ICI, "sortie_tp6.mp4")
SOURCE_VTT = os.path.join(ICI, "tp-train-serie6.vtt")
CIBLE_MP4 = os.path.join(RACINE, "assets", "videos", "tp-train-serie6.mp4")
CIBLE_VTT = os.path.join(RACINE, "assets", "subtitles", "tp-train-serie6-fr.vtt")

PAGES = ["cours/javascript.html", "assets/js/app.js"]


def duree(chemin):
    sortie = subprocess.run([FF, "-hide_banner", "-i", chemin], capture_output=True, text=True).stderr
    m = re.search(r"Duration: (\d+):(\d+):(\d+\.\d+)", sortie)
    if not m:
        return 0.0
    h, mn, sec = m.groups()
    return int(h) * 3600 + int(mn) * 60 + float(sec)


def mmss(secondes):
    total = int(round(secondes))
    return f"{total // 60}:{total % 60:02d}"


def main():
    verifier = "--verifier" in sys.argv
    if not os.path.exists(SOURCE_MP4):
        print("manquant :", SOURCE_MP4, "(lancer render.py d'abord)")
        return 1

    temps = mmss(duree(SOURCE_MP4))
    print("durée réelle :", temps, "—", os.path.getsize(SOURCE_MP4), "octets")

    if not verifier:
        shutil.copy2(SOURCE_MP4, CIBLE_MP4)
        shutil.copy2(SOURCE_VTT, CIBLE_VTT)
        print("copié :", os.path.relpath(CIBLE_MP4, RACINE), "+", os.path.relpath(CIBLE_VTT, RACINE))

        # badges de durée dans la page et dans le catalogue
        for page in PAGES:
            chemin = os.path.join(RACINE, page)
            s = open(chemin, encoding="utf-8").read()
            avant = s
            s = re.sub(r"(SÉRIE 6 · TP TRAIN \()\d+:\d{2}(\))", r"\g<1>" + temps + r"\g<2>", s)
            s = re.sub(r'(titre: "TP Train — correction détaillée \(Série 6\)",\n      dureeTexte: ")\d+:\d{2}(")',
                       r"\g<1>" + temps + r"\g<2>", s)
            if s != avant:
                open(chemin, "w", encoding="utf-8").write(s)
                print(page, "→ durée", temps)

    # contrôle hors-ligne
    sw = open(os.path.join(RACINE, "sw.js"), encoding="utf-8").read()
    for chemin in ("./assets/videos/tp-train-serie6.mp4", "./assets/subtitles/tp-train-serie6-fr.vtt"):
        etat = "présent" if chemin in sw else "ABSENT"
        print(f"OFFLINE_LIST {chemin} : {etat}")
        if etat == "ABSENT":
            return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
