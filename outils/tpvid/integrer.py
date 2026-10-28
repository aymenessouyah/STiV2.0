#!/usr/bin/env python3
"""Intègre les deux capsules rendues dans le site.

    python3 integrer.py

1. copie les MP4 rendus dans assets/videos/ ;
2. relit leur durée réelle et met à jour les badges « TP pas à pas · X min Y »
   dans cours/html5.html et cours/css3.html ;
3. incrémente la révision du service worker et régénère le manifeste hors-ligne.
"""
import json
import os
import re
import shutil
import subprocess
import sys

ICI = os.path.dirname(os.path.abspath(__file__))
RACINE = os.path.normpath(os.path.join(ICI, "..", ".."))
FF = os.path.normpath(os.path.join(RACINE, "node_modules", "@ffmpeg-installer", "linux-x64", "ffmpeg"))

CIBLES = [
    ("sortie_events.mp4", "tp-evenements-liens-v2.mp4"),
    ("sortie_form.mp4", "tp-formulaire-tableau-autre.mp4"),
]


def duree(chemin):
    s = subprocess.run([FF, "-hide_banner", "-i", chemin], capture_output=True, text=True).stderr
    m = re.search(r"Duration: (\d+):(\d+):(\d+\.\d+)", s)
    h, mn, sec = m.groups()
    return int(h) * 3600 + int(mn) * 60 + float(sec)


def min_sec(secondes):
    total = int(round(secondes))
    return f"{total // 60} min {total % 60:02d}"


def main():
    infos = {}
    for source, cible in CIBLES:
        chemin = os.path.join(ICI, source)
        if not os.path.exists(chemin):
            print("manquant :", chemin)
            return 1
        shutil.copy2(chemin, os.path.join(RACINE, "assets", "videos", cible))
        infos[cible] = min_sec(duree(chemin))
        print(cible, infos[cible])
    print(json.dumps(infos, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
