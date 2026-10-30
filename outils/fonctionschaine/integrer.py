#!/usr/bin/env python3
"""Installe la capsule « Les chaînes de caractères » dans le site.

    python3 integrer.py            # copie le MP4 + le VTT, réécrit la durée
    python3 integrer.py --verifier # contrôle seulement (aucune écriture)

1. copie `sortie_chaines.mp4` vers `assets/videos/FonctionsChaine-<version>.mp4` ;
2. copie `sous-titres.vtt` vers `assets/subtitles/FonctionsChaine-fr-<version>.vtt` ;

Le nom du fichier porte la version (`VERSION_MEDIA`) : c'est la seule façon de
forcer un nouveau téléchargement côté élève, car le service worker sert les
vidéos depuis son cache et ne les revalide jamais (`.mp4` et `.vtt` sont en
« cache d'abord »). Renommer à chaque refonte de la capsule.

3. relit la durée réelle et met à jour le badge « (12:03) » de
   `cours/javascript.html` et la `dureeTexte` de `assets/js/app.js` ;
4. réécrit les **chapitres** `STI_CHAPITRES_MEDIA["chaines-caracteres"]` de
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

SLUG = "FonctionsChaine"
VERSION_MEDIA = "v564"          # à changer à chaque refonte : l'URL est la version
CLE_CHAPITRES = "fonctions-chaine"
NOM_MP4 = f"{SLUG}-{VERSION_MEDIA}.mp4"
NOM_VTT = f"{SLUG}-fr-{VERSION_MEDIA}.vtt"
SOURCE_MP4 = os.path.join(ICI, "sortie_chaines.mp4")
SOURCE_VTT = os.path.join(ICI, "sous-titres.vtt")
CIBLE_MP4 = os.path.join(RACINE, "assets", "videos", NOM_MP4)
CIBLE_VTT = os.path.join(RACINE, "assets", "subtitles", NOM_VTT)

PAGES = ["cours/javascript.html", "assets/js/app.js"]
PROTECTION = os.path.join(RACINE, "assets", "js", "protection.js")
CALAGE = os.path.join(ICI, "calage.json")

# Le badge de durée de la carte, dans la page du cours et dans le catalogue.
MOTIF_BADGE = r"(CAPSULE · LES FONCTIONS DE CHAÎNE \()(\d+:\d{2})(\))"
MOTIF_DUREE = r"(id: \"fonctions-chaine\"[\s\S]{0,400}?dureeTexte: \")(\d+:\d{2})(\")"


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
    """Ajoute (ou remplace) le bloc des chapitres de la capsule."""
    s = open(PROTECTION, encoding="utf-8").read()
    nouveau = bloc_chapitres()
    entete = f'      STI_CHAPITRES_MEDIA["{CLE_CHAPITRES}"] = ['
    if entete in s:
        debut = s.index(entete)
        debut = s.rindex("\n", 0, debut) + 1
        fin = s.index("      ];", debut) + len("      ];\n")
        if s[debut:fin] != nouveau:
            open(PROTECTION, "w", encoding="utf-8").write(s[:debut] + nouveau + s[fin:])
            return True
        return False
    # première installation : juste après les chapitres de la capsule précédente
    ancre = '      STI_CHAPITRES_MEDIA["console-variables"] = ['
    fin = s.index("      ];", s.index(ancre)) + len("      ];\n")
    open(PROTECTION, "w", encoding="utf-8").write(s[:fin] + nouveau + s[fin:])
    return True


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

        for page, motif in ((PAGES[0], MOTIF_BADGE), (PAGES[1], MOTIF_DUREE)):
            chemin = os.path.join(RACINE, page)
            s = open(chemin, encoding="utf-8").read()
            avant = s
            s = re.sub(motif, lambda m: m.group(1) + temps + m.group(3), s)
            if s != avant:
                open(chemin, "w", encoding="utf-8").write(s)
                print(page, "→ durée", temps)

    sw = open(os.path.join(RACINE, "sw.js"), encoding="utf-8").read()
    absents = 0
    for chemin in (f"./assets/videos/{NOM_MP4}", f"./assets/subtitles/{NOM_VTT}"):
        etat = "présent" if chemin in sw else "ABSENT"
        print(f"OFFLINE_LIST {chemin} : {etat}")
        absents += etat == "ABSENT"

    protection = open(PROTECTION, encoding="utf-8").read()
    if f'STI_CHAPITRES_MEDIA["{CLE_CHAPITRES}"] = [' in protection:
        debut = protection.index(f'STI_CHAPITRES_MEDIA["{CLE_CHAPITRES}"] = [')
        fin = protection.index("];", debut)
        reperes = protection[debut:fin].count("{ t:")
    else:
        reperes = 0
    print(f"chapitres {CLE_CHAPITRES} : {reperes} / {len(N.ORDRE)}")
    absents += reperes != len(N.ORDRE)

    page = open(os.path.join(RACINE, "cours/javascript.html"), encoding="utf-8").read()
    if f"../assets/videos/{NOM_MP4}" not in page:
        print("ABSENT : la carte vidéo de cours/javascript.html")
        absents += 1
    app = open(os.path.join(RACINE, "assets/js/app.js"), encoding="utf-8").read()
    if 'id: "fonctions-chaine"' not in app:
        print("ABSENT : l'entrée « fonctions-chaine » de CATALOGUE_VIDEOS")
        absents += 1
    return 2 if absents else 0


if __name__ == "__main__":
    sys.exit(main())
