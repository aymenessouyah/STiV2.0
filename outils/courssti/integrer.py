#!/usr/bin/env python3
"""Installe la vidéo du cours « Systèmes, technologies et Internet » dans le site.

    python3 integrer.py            # copie le MP4 + le VTT, réécrit la durée
    python3 integrer.py --verifier # contrôle seulement (aucune écriture)

1. copie `sortie_courssti.mp4` vers `assets/videos/CoursSystemesInternet-<version>.mp4` ;
2. copie `sous-titres.vtt` vers `assets/subtitles/CoursSystemesInternet-fr-<version>.vtt` ;

Le nom du fichier porte la version (`VERSION_MEDIA`) : c'est la seule façon de
forcer un nouveau téléchargement côté élève, car le service worker sert les
vidéos depuis son cache et ne les revalide jamais (`.mp4` et `.vtt` sont en
« cache d'abord »). Renommer à chaque refonte de la vidéo.

3. relit la durée réelle et met à jour le badge du cours
   (`data-video-duree="cours-sti"` dans `cours/systemes-technologies-internet.html`) ;
4. réécrit les **chapitres** `STI_CHAPITRES_MEDIA["cours-sti"]` de
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
if not os.path.exists(FF):
    FF = "ffmpeg"

SLUG = "CoursSystemesInternet"
VERSION_MEDIA = "v577"          # à changer à chaque refonte : l'URL est la version
CLE_CHAPITRES = "cours-sti"
NOM_MP4 = f"{SLUG}-{VERSION_MEDIA}.mp4"
NOM_VTT = f"{SLUG}-fr-{VERSION_MEDIA}.vtt"
SOURCE_MP4 = os.path.join(ICI, "sortie_courssti.mp4")
SOURCE_VTT = os.path.join(ICI, "sous-titres.vtt")
CIBLE_MP4 = os.path.join(RACINE, "assets", "videos", NOM_MP4)
CIBLE_VTT = os.path.join(RACINE, "assets", "subtitles", NOM_VTT)

PAGE = os.path.join(RACINE, "cours", "systemes-technologies-internet.html")
PROTECTION = os.path.join(RACINE, "assets", "js", "protection.js")
SERVICE = os.path.join(RACINE, "sw.js")
CALAGE = os.path.join(ICI, "calage.json")

# Le badge de durée de la carte, dans la page du cours.
MOTIF_BADGE = r'(data-video-duree="cours-sti">)(\d+:\d{2})(<)'


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
    return f'      STI_CHAPITRES_MEDIA["{CLE_CHAPITRES}"] = [\n' + ",\n".join(lignes) + "\n      ];\n"


def ecrire_chapitres():
    """Ajoute (ou remplace) le bloc des chapitres de la vidéo."""
    s = open(PROTECTION, encoding="utf-8").read()
    nouveau = bloc_chapitres()
    entete = f'      STI_CHAPITRES_MEDIA["{CLE_CHAPITRES}"] = ['
    if entete in s:
        debut = s.index(entete)
        fin = s.index("];", debut) + 3
        s = s[:debut] + nouveau.rstrip("\n") + s[fin:]
    else:
        ancre = s.index("STI_CHAPITRES_MEDIA")
        fin_ligne = s.index("\n", s.index("];", ancre)) + 1
        s = s[:fin_ligne] + nouveau + s[fin_ligne:]
    open(PROTECTION, "w", encoding="utf-8").write(s)


def ecrire_duree(secondes):
    s = open(PAGE, encoding="utf-8").read()
    nouveau, n = re.subn(MOTIF_BADGE, lambda m: m.group(1) + mmss_court(secondes) + m.group(3), s)
    if n == 0:
        print("badge de durée introuvable dans la page du cours")
        return False
    open(PAGE, "w", encoding="utf-8").write(nouveau)
    return True


def duree_reelle():
    sortie = subprocess.run(
        [FF, "-i", SOURCE_MP4], capture_output=True, text=True, errors="ignore")
    m = re.search(r"Duration:\s*(\d+):(\d+):(\d+\.\d+)", sortie.stderr)
    if not m:
        return 0.0
    return int(m.group(1)) * 3600 + int(m.group(2)) * 60 + float(m.group(3))


def main():
    verifier = "--verifier" in sys.argv
    problemes = []

    for chemin, nom in ((SOURCE_MP4, "sortie_courssti.mp4"), (SOURCE_VTT, "sous-titres.vtt"),
                        (CALAGE, "calage.json")):
        if not os.path.exists(chemin):
            problemes.append(f"absent : {nom}")
    service = open(SERVICE, encoding="utf-8").read()
    for chemin in (f'./assets/videos/{NOM_MP4}', f'./assets/subtitles/{NOM_VTT}'):
        if chemin not in service:
            problemes.append(f"absent de OFFLINE_LIST (sw.js) : {chemin}")

    if problemes:
        for p in problemes:
            print("✗", p)
        return 1
    if verifier:
        print("✓ vidéo, sous-titres et hors-ligne en ordre")
        return 0

    os.makedirs(os.path.dirname(CIBLE_MP4), exist_ok=True)
    os.makedirs(os.path.dirname(CIBLE_VTT), exist_ok=True)
    shutil.copyfile(SOURCE_MP4, CIBLE_MP4)
    shutil.copyfile(SOURCE_VTT, CIBLE_VTT)
    secondes = duree_reelle()
    ecrire_duree(secondes)
    ecrire_chapitres()
    print(f"écrit : assets/videos/{NOM_MP4} ({mmss_court(secondes)})")
    print(f"écrit : assets/subtitles/{NOM_VTT}")
    print(f"écrit : chapitres STI_CHAPITRES_MEDIA[\"{CLE_CHAPITRES}\"]")
    return 0


if __name__ == "__main__":
    sys.exit(main())
