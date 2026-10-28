#!/usr/bin/env python3
"""
Montage final de la vidéo « id · class · name : le graphe ».

Assemblage :
  1. liste de concaténation des images-clés (avec durées),
  2. piste audio : silences (générique, cartes de chapitre, pauses) + clips,
  3. encodage MP4 1080×1920 25 fps avec sous-titres SRT embarqués.

La piste vidéo est générée à partir des images statiques produites par
`composeur-graphe-video.py` ; une barre de progression globale et un filigrane
STI V2.0 sont dessinés par ffmpeg en post-traitement.
"""
import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORK = os.path.join(ROOT, ".video-work")
FRAMES = os.path.join(WORK, "frames")
AUDIO = os.path.join(WORK, "audio")
OUT = os.path.join(WORK, "out")
os.makedirs(OUT, exist_ok=True)

FFMPEG = subprocess.check_output(
    ["python3", "-c", "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())"]
).decode().strip()

W, H = 1080, 1920
FPS = 25


def run(cmd):
    print("→", " ".join(cmd))
    subprocess.run(cmd, check=True)


def silence(dur, path):
    """Crée un fichier de silence AAC stéréo 44100 Hz."""
    if not os.path.exists(path):
        run([FFMPEG, "-y", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo",
             "-t", str(dur), "-c:a", "aac", "-b:a", "128k", path])
    return path


def main():
    scen = json.load(open(os.path.join(ROOT, "tools/scenario-graphe-video.json")))
    gen_dur = scen["duree_generique"]
    pause = scen["pause_entre_clips"]
    chap_dur = 2.6

    # ---------------------------------------------------------------- vidéo
    # liste concat : chaque image avec sa durée
    vlist = os.path.join(WORK, "vlist.txt")
    with open(vlist, "w") as f:
        def emit(frame, dur):
            f.write(f"file '{os.path.join(FRAMES, frame)}'\n")
            f.write(f"duration {dur}\n")
        # générique
        emit("generique.png", gen_dur)
        # chapitre 1
        emit(f"chapitre-1.png", chap_dur)
        nph = 0
        for ci, c in enumerate(scen["clips"]):
            for i, (a, b, share) in enumerate(c["timeline"]):
                emit(f"ph-{nph:04d}.png", share)
                nph += 1
            # chapitre suivant (avec pause incluse) sauf après le dernier clip
            if ci < len(scen["clips"]) - 1:
                emit(f"chapitre-{ci+2}.png", chap_dur + pause)
        # image de fin : garantit que la vidéo brute dure au moins l'audio
        # (le concat ignore la durée de la dernière entrée, on ajoute donc
        # une image finale longue et -shortest coupera à la durée de l'audio).
        with open(vlist, "a") as f:
            f.write(f"file '{os.path.join(FRAMES, 'generique.png')}'\n")
            f.write("duration 15\n")
    # vidéo sans audio (slideshow)
    vide = os.path.join(OUT, "video-brut.mp4")
    run([FFMPEG, "-y", "-f", "concat", "-safe", "0", "-i", vlist,
         "-vf", f"fps={FPS},format=yuv420p",
         "-c:v", "libx264", "-preset", "medium", "-crf", "20",
         "-pix_fmt", "yuv420p", vide])

    # ---------------------------------------------------------------- audio
    alist = os.path.join(WORK, "alist.txt")
    silences = []
    silences.append(silence(gen_dur, os.path.join(WORK, "sil-gen.m4a")))
    silences.append(silence(chap_dur, os.path.join(WORK, "sil-chap.m4a")))
    inputs = list(silences)
    with open(alist, "w") as f:
        for s in silences:
            f.write(f"file '{s}'\n")
    for ci, c in enumerate(scen["clips"]):
        clip = os.path.join(AUDIO, f"{c['id']}.mp3")
        # convert mp3 → m4a pour concat uniforme
        m4a = os.path.join(WORK, f"{c['id']}.m4a")
        if not os.path.exists(m4a):
            run([FFMPEG, "-y", "-i", clip, "-c:a", "aac", "-b:a", "128k", m4a])
        inputs.append(m4a)
        with open(alist, "a") as f:
            f.write(f"file '{m4a}'\n")
        if ci < len(scen["clips"]) - 1:
            sp = silence(pause, os.path.join(WORK, f"sil-pause-{ci}.m4a"))
            inputs.append(sp)
            with open(alist, "a") as f:
                f.write(f"file '{sp}'\n")
            sp2 = silence(chap_dur, os.path.join(WORK, f"sil-chap-{ci+2}.m4a"))
            inputs.append(sp2)
            with open(alist, "a") as f:
                f.write(f"file '{sp2}'\n")
    # concat audio
    audio = os.path.join(OUT, "audio-brut.m4a")
    run([FFMPEG, "-y", "-f", "concat", "-safe", "0", "-i", alist,
         "-c:a", "copy", audio])

    # ---------------------------------------------------------------- montage
    srt = os.path.join(OUT, "graphe.srt")
    final = os.path.join(ROOT, "assets/videos/id-class-name-graphe.mp4")
    os.makedirs(os.path.dirname(final), exist_ok=True)
    # barre de progression dynamique (drawbox supporte les expressions)
    total = gen_dur + chap_dur
    for c in scen["clips"]:
        total += c["duree_audio"] + pause + chap_dur
    total -= pause + chap_dur  # pas après le dernier clip
    vf = (
        f"drawbox=x=60:y={H-70}:w=iw-120:h=6:color=0x2a3860@0.5:t=fill,"
        f"drawbox=x=60:y={H-70}:w='(t/{total})*(iw-120)':h=6:color=0x6d4aff@0.9:t=fill"
    )

    run([FFMPEG, "-y",
         "-i", vide, "-i", audio,
         "-i", srt,
         "-map", "0:v", "-map", "1:a", "-map", "2:s",
         "-vf", vf,
         "-c:v", "libx264", "-preset", "medium", "-crf", "20",
         "-c:a", "aac", "-b:a", "154k",
         "-c:s", "mov_text",
         "-shortest", "-movflags", "+faststart",
         final])
    print(f"\n✓ vidéo finale : {final}")
    # stats
    dur = subprocess.check_output(
        [FFMPEG, "-i", final], capture_output=True, text=True
    ).stderr
    for line in dur.splitlines():
        if "Duration" in line or "Stream" in line:
            print(" ", line.strip())
    # taille
    sz = os.path.getsize(final) / 1024 / 1024
    print(f"  taille : {sz:.1f} Mo")


if __name__ == "__main__":
    main()
