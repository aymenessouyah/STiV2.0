#!/usr/bin/env python3
"""Installe la capsule « La boucle Pour » dans le site.

    python3 integrer.py            # copie le MP4 + le VTT, réécrit la durée
    python3 integrer.py --verifier # contrôle seulement (aucune écriture)

1. copie `sortie_bouclepour.mp4` vers `assets/videos/BouclePour.mp4` ;
2. copie `sous-titres.vtt` vers `assets/subtitles/BouclePour-fr.vtt` ;
3. relit la durée réelle et met à jour les badges « (5:41) » de
   `cours/javascript.html` et la `dureeTexte` de `assets/js/app.js` ;
4. réécrit les **chapitres** `STI_CHAPITRES_MEDIA["boucle-pour"]` de
   `assets/js/protection.js` d'après `calage.json` (un repère par section) ;
5. vérifie que le MP4 et le VTT sont bien listés dans OFFLINE_LIST (sw.js).
"""
import json
import os
import re
import shutil
import subprocess
import sys

import narration as N

ICI = os.path.dirname(os.path.abspath(__file__))
RACINE = os.path.normpath(os.path.join(ICI, "..", ".."))
FF = os.path.normpath(os.path.join(RACINE, "node_modules", "@ffmpeg-installer", "linux-x64", "ffmpeg"))

SLUG = "BouclePour"
SOURCE_MP4 = os.path.join(ICI, "sortie_bouclepour.mp4")
SOURCE_VTT = os.path.join(ICI, "sous-titres.vtt")
CIBLE_MP4 = os.path.join(RACINE, "assets", "videos", f"{SLUG}.mp4")
CIBLE_VTT = os.path.join(RACINE, "assets", "subtitles", f"{SLUG}-fr.vtt")

PAGES = ["cours/javascript.html", "assets/js/app.js"]
PROTECTION = os.path.join(RACINE, "assets", "js", "protection.js")
CALAGE = os.path.join(ICI, "calage.json")


def mmss_court(secondes):
    total = int(round(secondes))
    return f"{total // 60}:{total % 60:02d}"


def bloc_chapitres():
    """Les repères de chapitre, un par section de la narration."""
    with open(CALAGE, encoding="utf-8") as f:
        calage = json.load(f)
    debuts = calage["debuts"]
    lignes = []
    for i, section in enumerate(N.ORDRE, start=1):
        debut = debuts[section]
        titre = N.SECTIONS[section]["titre"].replace('"', '\\"')
        court = f"{i} · {titre}"
        lignes.append(
            f'        {{ t: {debut:.3f}, short: "{court}", '
            f'label: "{mmss_court(debut)} · {court}" }}')
    return "      STI_CHAPITRES_MEDIA[\"boucle-pour\"] = [\n" + ",\n".join(lignes) + "\n      ];\n"


def ecrire_chapitres():
    """Remplace le bloc des chapitres de la capsule dans protection.js."""
    s = open(PROTECTION, encoding="utf-8").read()
    debut = s.index('STI_CHAPITRES_MEDIA["boucle-pour"] = [')
    fin = s.index('      ];', debut) + len("      ];\n")
    nouveau = bloc_chapitres()
    if s[debut:fin] != nouveau:
        open(PROTECTION, "w", encoding="utf-8").write(s[:debut] + nouveau + s[fin:])
        return True
    return False


def duree(chemin):
    sortie = subprocess.run([FF, "-hide_banner", "-i", chemin],
                            capture_output=True, text=True).stderr
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
        print("copié :", os.path.relpath(CIBLE_MP4, RACINE),
              "+", os.path.relpath(CIBLE_VTT, RACINE))

        if ecrire_chapitres():
            print("chapitres :", len(N.ORDRE), "repères dans protection.js")

        for page in PAGES:
            chemin = os.path.join(RACINE, page)
            s = open(chemin, encoding="utf-8").read()
            avant = s
            s = re.sub(r"(SÉRIE 6 · LES BOUCLES \()\d+:\d{2}(\))",
                       r"\g<1>" + temps + r"\g<2>", s)
            s = re.sub(r'(titre: "Les boucles —[^"]*",\n\s+dureeTexte: ")\d+:\d{2}(")',
                       r"\g<1>" + temps + r"\g<2>", s)
            if s != avant:
                open(chemin, "w", encoding="utf-8").write(s)
                print(page, "→ durée", temps)

    sw = open(os.path.join(RACINE, "sw.js"), encoding="utf-8").read()
    absents = 0
    for chemin in (f"./assets/videos/{SLUG}.mp4", f"./assets/subtitles/{SLUG}-fr.vtt"):
        etat = "présent" if chemin in sw else "ABSENT"
        print(f"OFFLINE_LIST {chemin} : {etat}")
        absents += etat == "ABSENT"

    protection = open(PROTECTION, encoding="utf-8").read()
    debut = protection.index('STI_CHAPITRES_MEDIA["boucle-pour"] = [')
    fin = protection.index("];", debut)
    reperes = protection[debut:fin].count("{ t:")
    print(f"chapitres boucle-pour : {reperes} / {len(N.ORDRE)}")
    absents += reperes != len(N.ORDRE)

    page = open(os.path.join(RACINE, "cours/javascript.html"), encoding="utf-8").read()
    if f"../assets/videos/{SLUG}.mp4" not in page:
        print("ABSENT : la carte vidéo de cours/javascript.html")
        absents += 1
    app = open(os.path.join(RACINE, "assets/js/app.js"), encoding="utf-8").read()
    if 'id: "boucle-pour"' not in app:
        print("ABSENT : l'entrée « boucle-pour » de CATALOGUE_VIDEOS")
        absents += 1
    return 2 if absents else 0


if __name__ == "__main__":
    sys.exit(main())
