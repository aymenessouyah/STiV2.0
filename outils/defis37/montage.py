"""Assemble la voix off des 37 Défis, calcule les durées et écrit les sous-titres.

Usage :
    python3 montage.py          # voix-off.mp3 + calage.json + VTT
"""
from __future__ import annotations

import json
import os
import subprocess
import sys

import narration37 as narration

DOSSIER = os.path.dirname(os.path.abspath(__file__))
AUDIO = os.path.join(DOSSIER, "voix")

# un fichier audio par section
FICHIERS = {
    "intro": ["intro.mp3"],
    "tableau": ["tableau.mp3"],
    "tableau2": ["tableau2.mp3"],
    "rappel_tableau": ["rappel_tableau.mp3"],
    "rappel_math": ["rappel_math.mp3"],
    "aleas": ["aleas.mp3"],
    "aleas2": ["aleas2.mp3"],
    "rappel_chaine": ["rappel_chaine.mp3"],
    "captchas": ["captchas.mp3"],
    "captchas_b": ["captchas_b.mp3"],
    "captchas2": ["captchas2.mp3"],
    "media": ["media.mp3"],
    "outro": ["outro.mp3"],
}

PAUSE = 0.8        # respiration entre deux sections
QUEUE = 1.8        # silence à la fin de la vidéo
VTT = "defis37-tableau-aleas-media-fr.vtt"


def ffmpeg() -> str:
    local = os.path.join(DOSSIER, "..", "..", "node_modules",
                         "@ffmpeg-installer", "linux-x64", "ffmpeg")
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
    manquants = [os.path.basename(f) for s in narration.ORDRE for f in morceaux(s)
                 if not os.path.exists(f)]
    # les sections absentes de FICHIERS sont signalées à part
    absentes = [s for s in narration.ORDRE if s not in FICHIERS]
    if absentes:
        print("Section sans fichier audio :", ", ".join(absentes))
    if manquants:
        print("Audio manquant :", ", ".join(manquants))
        return False
    return not absentes


def main():
    if not verifier():
        sys.exit(1)

    durees, decalages = {}, {}
    t = 0.0
    for section in narration.ORDRE:
        d = sum(duree(f) for f in morceaux(section))
        if section != narration.ORDRE[-1]:
            d += PAUSE
        durees[section] = d
        decalages[section] = t
        t += d

    silence = os.path.join(AUDIO, "_silence.mp3")
    subprocess.run([ffmpeg(), "-y", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono",
                    "-t", str(PAUSE), silence], capture_output=True)

    entrees = []
    for section in narration.ORDRE:
        entrees += morceaux(section)
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
    with open(os.path.join(DOSSIER, "calage.json"), "w", encoding="utf-8") as f:
        json.dump({"durees": durees, "debuts": decalages, "total": total},
                  f, indent=2, ensure_ascii=False)

    entrees_vtt = narration.sous_titres(durees, decalages)
    with open(os.path.join(DOSSIER, VTT), "w", encoding="utf-8") as f:
        f.write(narration.vtt(entrees_vtt))

    print(f"voix off : {total:.1f} s  ({int(total // 60)}:{total % 60:05.2f})")
    for section in narration.ORDRE:
        print(f"  {section:14s} {durees[section]:6.1f} s   début {decalages[section]:6.1f} s")
    print(f"calage.json et {VTT} écrits")


if __name__ == "__main__":
    main()
