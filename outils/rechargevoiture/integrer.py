#!/usr/bin/env python3
"""Installe la capsule « Recharge voiture — Synthèse PHP n°2 » dans le site.

    python3 integrer.py            # copie MP4 + VTT, chapitres, durée
    python3 integrer.py --verifier # contrôle seulement (aucune écriture)

Le nom du fichier porte la version du média (`v706`) : le service worker sert
les vidéos en « cache d'abord », donc seule une nouvelle URL force le
téléchargement de la nouvelle capsule sur les appareils déjà équipés.
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

SLUG = "capsule-recharge-voiture"
VERSION_MEDIA = "v707"
NOM_MP4 = f"capsule-synthese-recharge-voiture-{VERSION_MEDIA}.mp4"
NOM_VTT = f"RechargeVoiture-fr-{VERSION_MEDIA}.vtt"
SOURCE_MP4 = os.path.join(ICI, "capsule-recharge-voiture.mp4")
SOURCE_VTT = os.path.join(ICI, "sous-titres.vtt")
CIBLE_MP4 = os.path.join(RACINE, "assets", "videos", NOM_MP4)
CIBLE_VTT = os.path.join(RACINE, "assets", "subtitles", NOM_VTT)
PROTECTION = os.path.join(RACINE, "assets", "js", "protection.js")
CALAGE = os.path.join(ICI, "calage.json")


def _ffmpeg():
    local = os.path.join(RACINE, "node_modules", "@ffmpeg-installer", "linux-x64", "ffmpeg")
    if os.path.exists(local):
        return local
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return "ffmpeg"


def mmss(secondes):
    total = int(round(secondes))
    return f"{total // 60}:{total % 60:02d}"


def duree_reelle(chemin):
    sortie = subprocess.run([_ffmpeg(), "-hide_banner", "-i", chemin],
                            capture_output=True, text=True).stderr
    m = re.search(r"Duration: (\d+):(\d+):(\d+\.\d+)", sortie)
    if not m:
        return 0.0
    h, mn, sec = m.groups()
    return int(h) * 3600 + int(mn) * 60 + float(sec)


def bloc_chapitres():
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
            f'label: "{mmss(debut)} · {court}" }}')
    return (f'      STI_CHAPITRES_MEDIA["{SLUG}"] = [\n'
            + ",\n".join(lignes) + "\n      ];\n")


def ecrire_chapitres():
    """Remplace le bloc de chapitres, ou l'insère après celui de Recharge VE."""
    s = open(PROTECTION, encoding="utf-8").read()
    nouveau = bloc_chapitres()
    marque = f'STI_CHAPITRES_MEDIA["{SLUG}"] = ['
    if marque in s:
        debut = s.index(marque)
        debut = s.rindex("\n", 0, debut) + 1
        fin = s.index("      ];\n", debut) + len("      ];\n")
        if s[debut:fin] != nouveau:
            open(PROTECTION, "w", encoding="utf-8").write(s[:debut] + nouveau + s[fin:])
            return True
        return False
    ancre = 'STI_CHAPITRES_MEDIA["capsule-recharge-php"] = ['
    debut_ancre = s.index(ancre)
    fin_ancre = s.index("      ];\n", debut_ancre) + len("      ];\n")
    open(PROTECTION, "w", encoding="utf-8").write(s[:fin_ancre] + nouveau + s[fin_ancre:])
    return True


def main():
    verifier = "--verifier" in sys.argv
    if not os.path.exists(SOURCE_MP4):
        print("manquant :", SOURCE_MP4, "(lancer render.py d'abord)")
        return 1
    if not os.path.exists(SOURCE_VTT):
        print("manquant :", SOURCE_VTT, "(lancer montage.py d'abord)")
        return 1

    temps = mmss(duree_reelle(SOURCE_MP4))
    print("durée réelle :", temps, "—", os.path.getsize(SOURCE_MP4), "octets")

    if not verifier:
        shutil.copy2(SOURCE_MP4, CIBLE_MP4)
        shutil.copy2(SOURCE_VTT, CIBLE_VTT)
        print("copié :", os.path.relpath(CIBLE_MP4, RACINE),
              "+", os.path.relpath(CIBLE_VTT, RACINE))
        if ecrire_chapitres():
            print("chapitres :", len(N.ORDRE), "repères dans protection.js")

        page = os.path.join(RACINE, "cours/php.html")
        s = open(page, encoding="utf-8").read()
        avant = s
        s = re.sub(r'(data-video-duree="capsule-recharge-voiture">)\d+:\d{2}(</span>)',
                   r"\g<1>" + temps + r"\g<2>", s)
        if s != avant:
            open(page, "w", encoding="utf-8").write(s)
            print("cours/php.html → durée", temps)

        app = os.path.join(RACINE, "assets/js/app.js")
        s = open(app, encoding="utf-8").read()
        avant = s
        s = re.sub(r'(titre: "Recharge voiture électrique — Synthèse PHP n°2",\n\s+dureeTexte: ")\d+:\d{2}(")',
                   r"\g<1>" + temps + r"\g<2>", s)
        if s != avant:
            open(app, "w", encoding="utf-8").write(s)
            print("assets/js/app.js → durée", temps)

    erreurs = 0
    sw = open(os.path.join(RACINE, "sw.js"), encoding="utf-8").read()
    for chemin in (f"./assets/videos/{NOM_MP4}", f"./assets/subtitles/{NOM_VTT}"):
        etat = "présent" if chemin in sw else "ABSENT"
        print(f"OFFLINE_LIST {chemin} : {etat}")
        erreurs += etat == "ABSENT"

    protection = open(PROTECTION, encoding="utf-8").read()
    if f'STI_CHAPITRES_MEDIA["{SLUG}"]' in protection:
        debut = protection.index(f'STI_CHAPITRES_MEDIA["{SLUG}"] = [')
        fin = protection.index("];", debut)
        reperes = protection[debut:fin].count("{ t:")
    else:
        reperes = 0
    print(f"chapitres {SLUG} : {reperes} / {len(N.ORDRE)}")
    erreurs += reperes != len(N.ORDRE)

    page = open(os.path.join(RACINE, "cours/php.html"), encoding="utf-8").read()
    if f"../assets/videos/{NOM_MP4}" not in page:
        print("ABSENT : la carte vidéo de cours/php.html")
        erreurs += 1
    app = open(os.path.join(RACINE, "assets/js/app.js"), encoding="utf-8").read()
    if f'id: "{SLUG}"' not in app:
        print("ABSENT : l'entrée du catalogue dans app.js")
        erreurs += 1
    return 2 if erreurs else 0


if __name__ == "__main__":
    sys.exit(main())
