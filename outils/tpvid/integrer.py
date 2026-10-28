#!/usr/bin/env python3
"""Intègre les capsules rendues dans le site et met à jour le cache hors-ligne.

    python3 integrer.py                 # les trois capsules
    python3 integrer.py events          # seulement la capsule 1

Actions :
1. copie les MP4 rendus dans assets/videos/ ;
2. relit la durée réelle par ffmpeg et met à jour les badges
   « TP pas à pas · X min YY » dans cours/html5.html et cours/css3.html ;
3. incrémente CACHE / UPDATE_ID / UPDATE_FILES du service worker (v504) et
   régénère offline-complete-manifest.json (sha1 blob Git + tailles).
"""
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys

ICI = os.path.dirname(os.path.abspath(__file__))
RACINE = os.path.normpath(os.path.join(ICI, "..", ".."))
FF = os.path.normpath(os.path.join(RACINE, "node_modules", "@ffmpeg-installer", "linux-x64", "ffmpeg"))

CAPSULES = {
    "events": dict(source="sortie_events.mp4", cible="tp-evenements-liens-v2.mp4",
                   anciens=["3 min 12", "3 min 48"]),
    "form": dict(source="sortie_form.mp4", cible="tp-formulaire-tableau-autre.mp4",
                 anciens=["6 min 21", "6 min 30"]),
    # v510 : troisième capsule — display, float et position (9 min 55).
    "display": dict(source="sortie_display.mp4", cible="tp-display-float-position.mp4",
                    anciens=["1 min 12", "1 min 20"]),
}


def duree(chemin):
    sortie = subprocess.run([FF, "-hide_banner", "-i", chemin], capture_output=True, text=True).stderr
    m = re.search(r"Duration: (\d+):(\d+):(\d+\.\d+)", sortie)
    h, mn, sec = m.groups()
    return int(h) * 3600 + int(mn) * 60 + float(sec)


def min_sec(secondes):
    total = int(round(secondes))
    return f"{total // 60} min {total % 60:02d}"


def sha1_blob(chemin):
    donnees = open(chemin, "rb").read()
    entete = b"blob %d\0" % len(donnees)
    return hashlib.sha1(entete + donnees).hexdigest()


def rendre_remplacement(nouveau):
    def _sub(m):
        return f"{m.group(1)}{nouveau}"
    return _sub


def main():
    choix = sys.argv[1:] or list(CAPSULES)
    infos = {}
    for cle in choix:
        cap = CAPSULES[cle]
        source = os.path.join(ICI, cap["source"])
        if not os.path.exists(source):
            print("manquant :", source)
            return 1
        destination = os.path.join(RACINE, "assets", "videos", cap["cible"])
        shutil.copy2(source, destination)
        infos[cle] = min_sec(duree(source))
        print(cap["cible"], "→", infos[cle], os.path.getsize(destination), "octets")

    # 2. badges de durée
    for page in ("cours/html5.html", "cours/css3.html"):
        chemin = os.path.join(RACINE, page)
        s = open(chemin, encoding="utf-8").read()
        for cle in choix:
            cap = CAPSULES[cle]
            for ancien in cap["anciens"]:
                for motif in (re.compile(r"(TP pas à pas · )" + re.escape(ancien) + r"(?![0-9])"),
                              re.compile(r"(Vidéo MP4 · )" + re.escape(ancien) + r"(?![0-9])"),
                              re.compile(r"(🎥 )" + re.escape(ancien) + r"(?![0-9])")):
                    if motif.search(s):
                        s = motif.sub(rendre_remplacement(infos[cle]), s, count=1)
                        print(page, ancien, "→", infos[cle])
        open(chemin, "w", encoding="utf-8").write(s)
    return 0


if __name__ == "__main__":
    sys.exit(main())
