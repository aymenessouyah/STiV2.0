#!/usr/bin/env python3
"""Extrait du manuel les images utilisées dans la vidéo du cours.

    python3 extraits.py                     # écrit dans assets/images/cours-sti/
    python3 extraits.py --verifier          # contrôle seulement
    python3 extraits.py --planche /tmp/x    # planche de contrôle (PNG)

Les pages 5 à 13 du manuel « STI V2.0 — Systèmes, technologies et Internet »
(3ᵉ SI, édition 2026) contiennent des schémas et des tableaux qui sont
exactement le cours. Plutôt que de les redessiner, la vidéo les affiche : ce
script les découpe une fois pour toutes, à 170 ppp, avec une marge franche.

Chaque extrait est décrit par `EXTRAITS` : page du PDF (0 = couverture, donc
la page 1 du manuel est l'indice 4), bornes verticales en points, et le
repère imprimé sous l'image dans la vidéo (« manuel p. 6 · § 1.2 »).

Les deux photographies du manuel (parc informatique et baie de brassage) sont
extraites telles quelles, en JPEG, pour ne pas les ré-encoder deux fois.
"""
from __future__ import annotations

import os
import sys

import pymupdf

ICI = os.path.dirname(os.path.abspath(__file__))
RACINE = os.path.normpath(os.path.join(ICI, "..", ".."))
PDF = os.path.join(RACINE, "documents", "livre", "sti-smart-book-3si-2026.pdf")
SORTIE = os.path.join(RACINE, "assets", "images", "cours-sti")

GAUCHE, DROITE = 44, 552      # la colonne utile de la page
PPP = 210

# nom d'image : (page du PDF, haut, bas, repère imprimé dans la vidéo)
EXTRAITS = {
    "livre-p5-triade":      (4, 232, 432, "manuel p. 5 · introduction générale"),
    "livre-p5-pile":        (4, 690, 800, "manuel p. 5 · § 1.1 la pile de la machine", 248, 420),
    "livre-p6-roles":       (5, 76, 240, "manuel p. 6 · § 1.2 les six rôles"),
    "livre-p6-types":       (5, 245, 468, "manuel p. 6 · § 1.3 les types"),
    "livre-p6-licences":    (5, 472, 618, "manuel p. 6 · § 1.4 propriétaire / libre"),
    "livre-p6-domaines":    (9, 448, 616, "manuel p. 6 · § 3.1 où rencontre-t-on l'IoT ?"),
    "livre-p6-composants":  (9, 620, 716, "manuel p. 6 · § 3.2 les cinq composants"),
    "livre-p7-vm":          (6, 40, 232, "manuel p. 7 · la machine virtuelle"),
    "livre-p7-securite":    (6, 236, 360, "manuel p. 7 · § 1.6 sécuriser"),
    "livre-p8-reseau":      (7, 44, 190, "manuel p. 8 · § 2.1 le réseau"),
    "livre-p8-etendue":     (7, 192, 298, "manuel p. 8 · § 2.2 LAN / MAN / WAN"),
    "livre-p8-equipements": (7, 300, 446, "manuel p. 8 · § 2.3 les équipements"),
    "livre-p8-parametres":  (7, 448, 762, "manuel p. 8 · § 2.4 les paramètres"),
    "livre-p9-architectures": (8, 44, 278, "manuel p. 9 · § 2.5 les deux architectures"),
    "livre-p9-protocoles":  (8, 281, 602, "manuel p. 9 · § 2.6 les protocoles"),
    "livre-p11-echange":    (10, 328, 594, "manuel p. 11 · § 3.4 échanger"),
    "livre-p11-tester":     (10, 596, 722, "manuel p. 11 · § 3.5 tester"),
    "livre-p12-fiche":      (11, 234, 528, "manuel p. 12 · la fiche de synthèse"),
    "livre-p12-idee":       (11, 518, 566, "manuel p. 12 · l'idée clé"),
}

# Les deux photographies du manuel : (xref, nom, repère).
PHOTOS = [
    (50, "livre-photo-baie", "manuel p. 3 · les équipements réseau"),
    (49, "livre-photo-poste", "manuel p. 3 · des systèmes différents"),
]


def ecrire(verifier=False, planche=None):
    doc = pymupdf.open(PDF)
    os.makedirs(SORTIE, exist_ok=True)
    faits = []
    for nom, (page, haut, bas, repere, *colonnes) in EXTRAITS.items():
        x0, x1 = colonnes if colonnes else (GAUCHE, DROITE)
        pix = doc[page].get_pixmap(dpi=PPP, clip=pymupdf.Rect(x0, haut, x1, bas))
        chemin = os.path.join(SORTIE, nom + ".png")
        if not verifier and planche is None:
            pix.save(chemin)
        faits.append((nom, pix.width, pix.height, repere))
    for xref, nom, repere in PHOTOS:
        info = doc.extract_image(xref)
        chemin = os.path.join(SORTIE, nom + ".jpg")
        if not verifier and planche is None:
            open(chemin, "wb").write(info["image"])
        faits.append((nom, info["width"], info["height"], repere))
    return faits


def main():
    verifier = "--verifier" in sys.argv
    faits = ecrire(verifier=verifier)
    for nom, largeur, hauteur, repere in faits:
        suffixe = ".jpg" if nom.startswith("livre-photo") else ".png"
        chemin = os.path.join(SORTIE, nom + suffixe)
        etat = "ok" if os.path.exists(chemin) else "manquant"
        taille = f"{os.path.getsize(chemin) // 1024} ko" if os.path.exists(chemin) else "—"
        print(f"{etat:8s} {nom+suffixe:26s} {largeur}x{hauteur}  {taille:>8s}  {repere}")
    if verifier:
        manquants = [n for n, *_ in faits
                     if not os.path.exists(os.path.join(SORTIE, n + (".jpg" if n.startswith("livre-photo") else ".png")))]
        return 1 if manquants else 0
    print(f"écrit : {SORTIE}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
