#!/usr/bin/env python3
"""Installe la vidéo des 37 Défis dans le site.

    python3 integrer.py            # copie le MP4 + le VTT, réécrit la durée
    python3 integrer.py --verifier # contrôle seulement (aucune écriture)

1. copie `sortie_defis37.mp4` vers `assets/videos/defis37-tableau-aleas-media.mp4` ;
2. copie le VTT vers `assets/subtitles/defis37-tableau-aleas-media-fr.vtt` ;
3. relit la durée réelle et met à jour les badges « (11:03) » de
   `cours/javascript.html` et `assets/js/app.js` ;
4. vérifie que le MP4 et le VTT sont bien listés dans OFFLINE_LIST (sw.js).
"""
import os
import re
import shutil
import subprocess
import sys

ICI = os.path.dirname(os.path.abspath(__file__))
RACINE = os.path.normpath(os.path.join(ICI, "..", ".."))
FF = os.path.normpath(os.path.join(RACINE, "node_modules", "@ffmpeg-installer", "linux-x64", "ffmpeg"))

SLUG = "defis37-tableau-aleas-media"
SOURCE_MP4 = os.path.join(ICI, "sortie_defis37.mp4")
SOURCE_VTT = os.path.join(ICI, f"{SLUG}-fr.vtt")
CIBLE_MP4 = os.path.join(RACINE, "assets", "videos", f"{SLUG}.mp4")
CIBLE_VTT = os.path.join(RACINE, "assets", "subtitles", f"{SLUG}-fr.vtt")

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
        print("manquant :", SOURCE_MP4, "(lancer render37.py d'abord)")
        return 1

    temps = mmss(duree(SOURCE_MP4))
    print("durée réelle :", temps, "—", os.path.getsize(SOURCE_MP4), "octets")

    if not verifier:
        shutil.copy2(SOURCE_MP4, CIBLE_MP4)
        shutil.copy2(SOURCE_VTT, CIBLE_VTT)
        print("copié :", os.path.relpath(CIBLE_MP4, RACINE), "+", os.path.relpath(CIBLE_VTT, RACINE))

        for page in PAGES:
            chemin = os.path.join(RACINE, page)
            s = open(chemin, encoding="utf-8").read()
            avant = s
            s = re.sub(r"(LES 37 DÉFIS · TABLEAU, ALÉAS &amp; MÉDIA \()\d+:\d{2}(\))",
                       r"\g<1>" + temps + r"\g<2>", s)
            s = re.sub(r'(titre: "Les 37 Défis — Tableau, Aléas & Captchas, Média",\n      dureeTexte: ")\d+:\d{2}(")',
                       r"\g<1>" + temps + r"\g<2>", s)
            if s != avant:
                open(chemin, "w", encoding="utf-8").write(s)
                print(page, "→ durée", temps)

    sw = open(os.path.join(RACINE, "sw.js"), encoding="utf-8").read()
    for chemin in (f"./assets/videos/{SLUG}.mp4", f"./assets/subtitles/{SLUG}-fr.vtt"):
        etat = "présent" if chemin in sw else "ABSENT"
        print(f"OFFLINE_LIST {chemin} : {etat}")
        if etat == "ABSENT":
            return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
