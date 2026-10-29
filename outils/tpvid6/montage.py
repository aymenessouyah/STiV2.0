"""Assemble la voix off, calcule les durées et écrit les sous-titres.

Usage :
    python3 montage.py                 # concatène l'audio + durees.json + VTT
    python3 montage.py --seulement-prix
"""
from __future__ import annotations

import json
import os
import subprocess
import sys

import narration

DOSSIER = os.path.dirname(os.path.abspath(__file__))
AUDIO = os.path.join(DOSSIER, "voix")

# fichier(s) audio de chaque section (une section peut être en deux morceaux)
FICHIERS = {
    "intro": ["01-intro.mp3"],
    "outils": ["02-outils.mp3"],
    "identite": ["03-identite.mp3"],
    "voyage": ["04-voyage.mp3"],
    "prix": ["05a-prix.mp3", "05b-prix.mp3"],
    "captcha": ["06-captcha.mp3"],
    "envoi": ["07-envoi.mp3"],
    "outro": ["08-outro.mp3"],
}

PAUSE = 0.7        # respiration entre deux sections
QUEUE = 1.6        # silence à la fin de la vidéo


def ffmpeg() -> str:
    local = os.path.join(DOSSIER, "..", "..", "node_modules", "@ffmpeg-installer", "linux-x64", "ffmpeg")
    return os.path.abspath(local) if os.path.exists(local) else "ffmpeg"


def duree(chemin: str) -> float:
    sortie = subprocess.run([ffmpeg(), "-i", chemin], capture_output=True, text=True).stderr
    for ligne in sortie.splitlines():
        if "Duration:" in ligne:
            h, m, s = ligne.split("Duration:")[1].split(",")[0].strip().split(":")
            return int(h) * 3600 + int(m) * 60 + float(s)
    return 0.0


def morceaux(section: str) -> list:
    return [os.path.join(AUDIO, f) for f in FICHIERS[section]]


def verifier() -> bool:
    manquants = [f for s in narration.ORDRE for f in morceaux(s) if not os.path.exists(f)]
    if manquants:
        print("Audio manquant :", ", ".join(os.path.basename(m) for m in manquants))
        return False
    return True


def main():
    if not verifier():
        sys.exit(1)

    # durées par section
    durees, morceau_liste, entrees, decalages = {}, [], [], {}
    t = 0.0
    for section in narration.ORDRE:
        d = 0.0
        for f in morceaux(section):
            d += duree(f)
            morceau_liste.append(f)
        if section != narration.ORDRE[-1]:
            d += PAUSE
        durees[section] = d
        decalages[section] = t
        t += d

    silence = os.path.join(AUDIO, "_silence.mp3")
    subprocess.run([ffmpeg(), "-y", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono",
                    "-t", str(PAUSE), silence], capture_output=True)

    # concaténation : un silence entre chaque section
    entrees = []
    for i, section in enumerate(narration.ORDRE):
        for f in morceaux(section):
            entrees.append(f)
        if section != narration.ORDRE[-1]:
            entrees.append(silence)
    entrees.append(silence)

    arguments = []
    for f in entrees:
        arguments += ["-i", f]
    filtre = "".join(f"[{i}:a]" for i in range(len(entrees)))
    filtre += f"concat=n={len(entrees)}:v=0:a=1[out]"
    sortie = os.path.join(DOSSIER, "voix-off.mp3")
    subprocess.run([ffmpeg(), "-y", *arguments, "-filter_complex", filtre,
                    "-map", "[out]", "-ar", "44100", "-ac", "1", "-b:a", "128k", sortie],
                   capture_output=True)

    total = duree(sortie)
    with open(os.path.join(DOSSIER, "durees.json"), "w", encoding="utf-8") as f:
        json.dump(durees, f, indent=2, ensure_ascii=False)
    # calage exact : instant de départ de chaque section dans la piste finale
    with open(os.path.join(DOSSIER, "calage.json"), "w", encoding="utf-8") as f:
        json.dump({"durees": durees, "debuts": decalages, "total": total},
                  f, indent=2, ensure_ascii=False)

    # sous-titres
    vtt = narration.vtt(narration.sous_titres(durees, decalages))
    with open(os.path.join(DOSSIER, "tp-train-serie6.vtt"), "w", encoding="utf-8") as f:
        f.write(vtt)

    print(f"voix off : {total:.1f} s  ({total/60:.1f} min)")
    for section in narration.ORDRE:
        print(f"  {section:9s} {durees[section]:6.1f} s  début {decalages[section]:6.1f} s")
    print("durees.json et tp-train-serie6.vtt écrits")


if __name__ == "__main__":
    main()
