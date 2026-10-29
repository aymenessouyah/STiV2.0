"""Rendu de la vidéo « Les 37 Défis — Tableau, Aléas & Captchas, Média ».

    python3 render37.py --plan
    python3 render37.py --images /tmp/f --instants 20,40,90
    python3 render37.py --durees calage.json --sortie sortie_defis37.mp4 --audio voix-off.mp3

Disposition : **à gauche l'énoncé, à droite le code**.
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess

from PIL import Image, ImageDraw

import contenu
import dessin37 as D
import narration37 as N
import rappels
from style import (
    FOND, FOND_PANNEAU, FOND_PANNEAU_2, BORDURE, TEXTE, TEXTE_2, TEXTE_3,
    ORANGE, ORANGE_FONCE, AMBRE, VIOLET, VERT, BLEU, ROSE,
    melange, boite_arrondie, texte, texte_centre, degrade_vertical, police,
)

LARGEUR, HAUTEUR = 1920, 1080
FPS = 30


# ══════════════════════════════════════════════════════════════════════════
#  Chronologie
# ══════════════════════════════════════════════════════════════════════════
def _poids_ligne(ligne):
    s = ligne.strip()
    if not s:
        return 0.45
    if s.startswith("//"):
        return 0.75
    return 0.50 + len(s) * 0.013


def construire_plan(durees=None, debuts=None):
    """Découpe la vidéo en séquences calées sur la voix off."""
    segments = []
    t = 0.0
    for section in N.ORDRE:
        parties = N.SECTIONS[section]["segments"]
        total_car = sum(len(N.texte_segment(section, cle)) for cle, _ in parties) or 1
        debut_section = debuts[section] if debuts else t
        duree_section = durees[section] if durees else 0.0
        curseur = debut_section
        for cle, phrases in parties:
            poids = len(" ".join(phrases))
            duree = duree_section * poids / total_car
            seg = {"cle": cle, "section": section, "debut": curseur, "fin": curseur + duree,
                   "duree": max(0.6, duree)}
            if cle.startswith("defi"):
                seg["type"] = "defi"
                seg["defi"] = contenu.DEFIS[int(cle[4:])]
                seg["defi"]["id"] = int(cle[4:])
                seg["instants"] = _instants_code(seg)
            elif cle.startswith("rappel"):
                seg["type"] = "rappel"
                seg["rappel"] = rappels.RAPPELS[cle]
            elif cle == "intro":
                seg["type"] = "intro"
            else:
                seg["type"] = "outro"
            segments.append(seg)
            curseur += duree
        t = debut_section + duree_section
    total = segments[-1]["fin"] if segments else 0.0
    return {"segments": segments, "total": total,
            "fin_intro": segments[0]["fin"] if segments else 0.0}


def _instants_code(seg):
    """Répartit la frappe des lignes sur la seconde moitié de la séquence."""
    d = seg["duree"]
    debut = seg["debut"] + d * 0.30
    fin = seg["fin"] - d * 0.05
    lignes = seg["defi"]["code"]
    poids = [_poids_ligne(l) for l in lignes]
    total = sum(poids) or 1
    instants, tc = [], debut
    for p in poids:
        instants.append(tc)
        tc += (fin - debut) * p / total
    return instants


def etat_code(seg, t):
    instants = seg["instants"]
    lignes = seg["defi"]["code"]
    if t < instants[0]:
        return {"curseur": -1.0, "caracteres": None}
    idx = 0
    for i, ti in enumerate(instants):
        if t >= ti:
            idx = i
    suivant = instants[idx + 1] if idx + 1 < len(instants) else seg["fin"]
    f = (t - instants[idx]) / max(0.05, suivant - instants[idx])
    longueur = len(lignes[idx])
    caracteres = int(min(1.0, f * 1.7) * longueur) if longueur else 0
    return {"curseur": float(idx), "caracteres": caracteres}


def progression(seg, t):
    return max(0.0, min(1.0, (t - seg["debut"]) / max(0.1, seg["duree"])))


# ══════════════════════════════════════════════════════════════════════════
#  Écrans particuliers
# ══════════════════════════════════════════════════════════════════════════
def _ease_out(x):
    x = max(0.0, min(1.0, x))
    return 1 - (1 - x) ** 3


def dessiner_intro(img, trace, p, duree):
    degrade_vertical(img, (0, 0, LARGEUR, HAUTEUR), melange(FOND, VIOLET, 0.10), FOND)
    a = _ease_out(min(1.0, p * 6))
    y0 = (1 - a) * 30
    boite_arrondie(trace, (LARGEUR / 2 - 260, 96 + y0, LARGEUR / 2 + 260, 156 + y0), rayon=30,
                   fond=melange(FOND_PANNEAU, ORANGE, 0.18), bord=ORANGE, largeur_bord=2)
    texte_centre(trace, (LARGEUR / 2 - 260, 96 + y0, LARGEUR / 2 + 260, 156 + y0),
                 "LES 37 DÉFIS  ·  JAVASCRIPT", 22, AMBRE, gras=True)
    texte_centre(trace, (0, 186 + y0, LARGEUR, 276 + y0), "Tableau · Aléas & Captchas · Média", 64, TEXTE, gras=True)
    texte_centre(trace, (0, 288 + y0, LARGEUR, 336 + y0),
                 "onze défis expliqués : l'énoncé à gauche, le code à droite", 30, ORANGE, gras=True)

    # trois cartes de familles
    n = len(contenu.FAMILLES)
    cw, ecart = 470, 26
    total = n * cw + (n - 1) * ecart
    x = (LARGEUR - total) / 2
    y = 400
    for i, fam in enumerate(contenu.FAMILLES):
        apparait = _ease_out((p * 6) - 1.6 - i * 0.35)
        if apparait <= 0:
            continue
        xf = (LARGEUR - total) / 2 + i * (cw + ecart)
        yy = y + (1 - apparait) * 24
        accent = fam["couleur"]
        boite_arrondie(trace, (xf, yy, xf + cw, yy + 150), rayon=16,
                       fond=melange(FOND, melange(FOND_PANNEAU, accent, 0.12), apparait),
                       bord=melange(FOND, accent, apparait), largeur_bord=2)
        D.icone(trace, xf + cw / 2, yy + 42, 38, fam["icone"], melange(FOND, accent, apparait))
        texte_centre(trace, (xf, yy + 66, xf + cw, yy + 104), fam["nom"], 27,
                     melange(FOND, TEXTE, apparait), gras=True)
        nb = len(fam["defis"])
        texte_centre(trace, (xf, yy + 104, xf + cw, yy + 136),
                     f"{nb} défi{'s' if nb > 1 else ''}", 18, melange(FOND, TEXTE_3, apparait))

    # principe : énoncé à gauche, code à droite
    a2 = _ease_out((p * 6) - 3.4)
    if a2 > 0:
        y = 600
        boite_arrondie(trace, (300, y, 900, y + 240), rayon=16, fond=FOND_PANNEAU,
                       bord=melange(FOND, BORDURE, a2), largeur_bord=2)
        texte(trace, (330, y + 22), "ÉNONCÉ", 18, AMBRE, gras=True)
        for i, ligne in enumerate(["Créer un tableau", "de cinq fruits,", "puis afficher length."]):
            texte(trace, (330, y + 66 + i * 40), ligne, 24, melange(FOND, TEXTE, a2))
        texte_centre(trace, (300, y + 186, 900, y + 226), "→ à gauche", 18, melange(FOND, TEXTE_3, a2))

        boite_arrondie(trace, (1020, y, 1620, y + 240), rayon=16, fond=FOND_PANNEAU,
                       bord=melange(FOND, BORDURE, a2), largeur_bord=2)
        texte(trace, (1050, y + 22), "CODE", 18, AMBRE, gras=True)
        code = ["const fruits = [\"pomme\", \"kiwi\"];", "fruits.length;   // 2"]
        tape = int((p * 6 - 3.6) * 40)
        reste = tape
        for i, ligne in enumerate(code):
            vu = ligne[:max(0, min(len(ligne), reste))]
            reste -= len(ligne) + 2
            actif = 0 < len(vu) < len(ligne)
            if actif:
                trace.rectangle([1040, y + 62 + i * 34, 1610, y + 92 + i * 34], fill=(88, 26, 32))
            texte(trace, (1050, y + 64 + i * 34), vu, 22, (255, 226, 226) if actif else melange(FOND, TEXTE, a2), mono=True)
        texte_centre(trace, (1020, y + 186, 1620, y + 226), "→ à droite, écrit pas à pas", 18, melange(FOND, TEXTE_3, a2))

    a3 = _ease_out((p * 6) - 4.8)
    if a3 > 0:
        texte_centre(trace, (0, 900, LARGEUR, 950),
                     "exercices/javascript/js-37-defis-tt.html", 22, melange(FOND, TEXTE_2, a3), mono=True)


def dessiner_outro(img, trace, p, duree):
    degrade_vertical(img, (0, 0, LARGEUR, HAUTEUR), melange(FOND, VIOLET, 0.10), FOND)
    texte_centre(trace, (0, 92, LARGEUR, 132), "RÉCAPITULATIF", 20, AMBRE, gras=True)
    texte_centre(trace, (0, 140, LARGEUR, 210), "Trois réflexes à garder", 52, TEXTE, gras=True)

    cartes = [
        ("tableau", "Les tableaux", ["des cases numérotées dès 0", "t[i] pour lire, length pour la taille",
                                "t[t.length] = v ajoute, t.length-- retire"], (20, 184, 166)),
        ("alea", "Le hasard", ["Math.random() → [0, 1[", "Math.floor : vers le bas, Math.ceil : vers le haut",
                             "l'entier : floor(random × (max-min+1)) + min"], (239, 68, 68)),
        ("chaine", "Les chaînes", ["String.fromCharCode(65) → A", "toString(16) : « ff »",
                               "substring = indices, substr = longueur"], (99, 102, 241)),
    ]
    y = 250
    for i, (type_icone, titre, lignes, accent) in enumerate(cartes):
        a = _ease_out((p * 5) - 0.6 - i * 0.5)
        if a <= 0:
            continue
        boite_arrondie(trace, (300, y, LARGEUR - 300, y + 168), rayon=16,
                       fond=melange(FOND, melange(FOND_PANNEAU, accent, 0.10), a),
                       bord=melange(FOND, accent, 0.8 * a), largeur_bord=2)
        D.icone(trace, 366, y + 84, 46, type_icone, melange(FOND, accent, a))
        texte(trace, (420, y + 22), titre, 28, melange(FOND, TEXTE, a), gras=True)
        for j, ligne in enumerate(lignes):
            texte(trace, (420, y + 66 + j * 32), "· " + ligne, 19, melange(FOND, TEXTE_2, a))
        y += 186

    a = _ease_out((p * 5) - 2.6)
    if a > 0:
        texte_centre(trace, (0, 830, LARGEUR, 890), "À vous de jouer : les onze défis, dans l'ordre.",
                     28, melange(FOND, ORANGE, a), gras=True)
        texte_centre(trace, (0, 900, LARGEUR, 940),
                     "exercices/javascript/js-37-defis-tt.html", 20, melange(FOND, TEXTE_3, a), mono=True)


# ══════════════════════════════════════════════════════════════════════════
#  Image
# ══════════════════════════════════════════════════════════════════════════
def _segment_a(plan, t):
    for seg in plan["segments"]:
        if seg["debut"] <= t < seg["fin"]:
            return seg
    return plan["segments"][-1]


def _famille_de(num):
    for fam in contenu.FAMILLES:
        if num in fam["defis"]:
            return fam
    return contenu.FAMILLES[0]


def _index_famille(num):
    for i, fam in enumerate(contenu.FAMILLES):
        if num in fam["defis"]:
            return i
    return 0


def image(t: float, plan: dict) -> Image.Image:
    img = Image.new("RGB", (LARGEUR, HAUTEUR), FOND)
    trace = ImageDraw.Draw(img)
    seg = _segment_a(plan, t)

    if seg["type"] == "intro":
        dessiner_intro(img, trace, progression(seg, t), seg["duree"])
        D.progression(trace, t, plan["total"])
        return img
    if seg["type"] == "outro":
        dessiner_outro(img, trace, progression(seg, t), seg["duree"])
        D.progression(trace, t, plan["total"])
        return img

    D.entete(img, trace, "Les 37 Défis — Tableau, Aléas & Média",
             "Série 6 · JavaScript · lycée Raféha")

    if seg["type"] == "defi":
        defi = seg["defi"]
        num = defi["id"]
        fam = _famille_de(num)
        D.pastilles(img, trace, contenu.FAMILLES, _index_famille(num), defi_num=num)
        prog = progression(seg, t)
        D.panneau_enonce(img, trace, D.GAUCHE, defi, fam, prog, None)
        D.panneau_code(trace, D.DROITE, defi["code"], etat_code(seg, t), contenu.MEMOS[num])
    elif seg["type"] == "rappel":
        cle = seg["cle"]
        famille_cle = {"rappel_tableau": 0, "rappel_math": 1, "rappel_chaine": 2}[cle]
        D.pastilles(img, trace, contenu.FAMILLES, famille_cle)
        D.rappel(img, trace, D.PLEIN, seg["rappel"], progression(seg, t))

    D.progression(trace, t, plan["total"])
    D.pied(trace)
    return img


# ══════════════════════════════════════════════════════════════════════════
#  Encodage
# ══════════════════════════════════════════════════════════════════════════
def ffmpeg():
    local = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                         "..", "..", "node_modules", "@ffmpeg-installer", "linux-x64", "ffmpeg")
    return os.path.abspath(local) if os.path.exists(local) else "ffmpeg"


def encoder(plan, sortie, fps, debut, fin, audio=None):
    cmd = [ffmpeg(), "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
           "-s", f"{LARGEUR}x{HAUTEUR}", "-r", str(fps), "-i", "-"]
    if audio:
        cmd += ["-i", audio]
    cmd += ["-c:v", "libx264", "-preset", "medium", "-crf", "23",
            "-pix_fmt", "yuv420p", "-g", str(fps * 2), "-movflags", "+faststart"]
    if audio:
        cmd += ["-c:a", "aac", "-b:a", "128k", "-shortest"]
    cmd += ["-t", f"{fin - debut:.3f}", sortie]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    total = int(round((fin - debut) * fps))
    pas = max(1, total // 100)
    for k in range(total):
        proc.stdin.write(image(debut + k / fps, plan).tobytes())
        if k % pas == 0:
            print(f"\r  {k}/{total} images", end="", flush=True)
    proc.stdin.close()
    proc.wait()
    print(f"\r  {total}/{total} images — {sortie}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--images")
    ap.add_argument("--instants")
    ap.add_argument("--sortie")
    ap.add_argument("--fps", type=int, default=FPS)
    ap.add_argument("--debut", type=float, default=0.0)
    ap.add_argument("--fin", type=float)
    ap.add_argument("--audio")
    ap.add_argument("--durees")
    ap.add_argument("--plan", action="store_true")
    a = ap.parse_args()

    durees = debuts = None
    if a.durees and os.path.exists(a.durees):
        charge = json.load(open(a.durees, encoding="utf-8"))
        if "durees" in charge:
            durees, debuts = charge["durees"], charge["debuts"]
        else:
            durees = charge
    plan = construire_plan(durees, debuts)

    if a.plan:
        print(json.dumps({
            "total": round(plan["total"], 1),
            "sequences": [{"cle": s["cle"], "type": s["type"],
                           "debut": round(s["debut"], 1), "fin": round(s["fin"], 1)}
                          for s in plan["segments"]],
        }, indent=2, ensure_ascii=False))
        return

    if a.images:
        os.makedirs(a.images, exist_ok=True)
        for inst in [float(x) for x in (a.instants or "10").split(",")]:
            chemin = os.path.join(a.images, f"t{inst:07.2f}.png")
            image(inst, plan).save(chemin)
            print(chemin)

    if a.sortie:
        fin = a.fin if a.fin is not None else plan["total"]
        encoder(plan, a.sortie, a.fps, a.debut, fin, a.audio)


if __name__ == "__main__":
    main()
