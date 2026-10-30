"""Montage de la voix off de « La console et les variables » : concatène les clips.

    python3 montage.py                 # voix-off.wav + calage.json + VTT
    python3 montage.py --verifier      # contrôles seulement

Les clips sont produits par la synthèse vocale (un fichier par section, nommé
d'après `narration.ORDRE`). Chaque clip est ramené en PCM 44,1 kHz mono, puis
les sections sont collées avec une respiration entre elles : l'image se cale
ensuite exactement sur ces durées (`calage.json`).
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import wave

import narration as N
from render import ffmpeg, RACINE

ICI = os.path.dirname(os.path.abspath(__file__))
VOIX = os.path.join(ICI, "voix")
FREQ = 44100
LEAD = 1.2      # silence avant la première phrase
RESPIRE = 0.55  # respiration entre deux sections
QUEUE = 1.8     # silence après la dernière phrase


def _wav(section: str) -> str:
    return os.path.join(VOIX, f"{section}.wav")


def convertir(section: str, source: str) -> str:
    """Ramène un clip au format du montage (PCM 16 bits, 44,1 kHz, mono)."""
    sortie = _wav(section)
    subprocess.run([ffmpeg(), "-y", "-loglevel", "error", "-i", source,
                    "-ac", "1", "-ar", str(FREQ), "-acodec", "pcm_s16le", sortie],
                   check=True)
    return sortie


def duree(section: str) -> float:
    with wave.open(_wav(section), "rb") as f:
        return f.getnframes() / f.getframerate()


def silence(secondes: float) -> bytes:
    return b"\x00\x00" * int(round(FREQ * secondes))


def coller(chemin: str, morceaux, respiration: float = RESPIRE,
           lead: float = LEAD, queue: float = QUEUE) -> float:
    """Écrit un WAV mono en insérant les silences ; renvoie la durée totale."""
    with wave.open(chemin, "wb") as sortie:
        sortie.setnchannels(1)
        sortie.setsampwidth(2)
        sortie.setframerate(FREQ)
        sortie.writeframes(silence(lead))
        for i, morceau in enumerate(morceaux):
            with wave.open(morceau, "rb") as f:
                sortie.writeframes(f.readframes(f.getnframes()))
            if i < len(morceaux) - 1:
                sortie.writeframes(silence(respiration))
        sortie.writeframes(silence(queue))
    with wave.open(chemin, "rb") as f:
        return f.getnframes() / f.getframerate()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--verifier", action="store_true")
    ap.add_argument("--respiration", type=float, default=RESPIRE)
    args = ap.parse_args()

    manquants = [s for s in N.ORDRE if not os.path.exists(_wav(s))]
    if manquants and args.verifier:
        for cle in manquants:
            print(f"manquant : voix/{cle}.wav")
        return 1

    if manquants:
        # premier passage : on essaie de convertir les sources brutes
        for section in manquants:
            source = None
            for extension in (".mp3", ".wav", ".m4a", ".ogg"):
                candidat = os.path.join(VOIX, section + extension)
                if os.path.exists(candidat):
                    source = candidat
                    break
            if source is None:
                print(f"clip absent : voix/{section} (mp3, wav, m4a ou ogg)")
                return 1
            convertir(section, source)
    elif not args.verifier:
        # les .wav existent : on rafraîchit depuis les sources si elles sont plus récentes
        for section in N.ORDRE:
            for extension in (".mp3", ".m4a", ".ogg"):
                source = os.path.join(VOIX, section + extension)
                if os.path.exists(source) and os.path.getmtime(source) > os.path.getmtime(_wav(section)):
                    convertir(section, source)

    durees, debuts = {}, {}
    curseur = LEAD
    for i, section in enumerate(N.ORDRE):
        d = duree(section)
        debuts[section] = round(curseur, 3)
        durees[section] = round(d, 3)
        curseur += d + args.respiration
    total = round(curseur - args.respiration + QUEUE, 3)

    print(f"{'section':14s} {'début':>8s} {'durée':>8s}   texte")
    for section in N.ORDRE:
        print(f"{section:14s} {debuts[section]:8.2f} {durees[section]:8.2f}   "
              f"{N.SECTIONS[section]['titre']}")
    print(f"{'total':14s} {total:8.2f} s  ({int(total // 60)}:{total % 60:05.2f})")

    if args.verifier:
        return 0

    voix_off = os.path.join(ICI, "voix-off.wav")
    obtenu = coller(voix_off, [_wav(s) for s in N.ORDRE], args.respiration)
    if abs(obtenu - total) > 0.05:
        print(f"incohérence de durée : {obtenu:.3f} ≠ {total:.3f}")
        return 2

    with open(os.path.join(ICI, "calage.json"), "w", encoding="utf-8") as f:
        json.dump({"durees": durees, "debuts": debuts, "total": total,
                   "debit": round(N.nombre_caracteres() / sum(durees.values()), 2)},
                  f, ensure_ascii=False, indent=2)
    with open(os.path.join(ICI, "sous-titres.vtt"), "w", encoding="utf-8") as f:
        f.write(N.vtt(N.sous_titres(durees, debuts)))
    print("écrit : voix-off.wav, calage.json, sous-titres.vtt")
    return 0


if __name__ == "__main__":
    sys.exit(main())
