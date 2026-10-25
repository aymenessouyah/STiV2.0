#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""STI v434 — génère le MANIFESTE des pages de contenu pour l'anneau de couverture.

Source = fichiers .html SUIVIS PAR GIT (jamais le désordre d'un dossier local), moins
les pages techniques. Sortie = assets/pages-couverture.json, à committer en même temps
que toute page ajoutée ou retirée : l'anneau ⚙️ du mobile (assets/js/roue-couverture.js)
lit ce fichier au démarrage et retombe sur sa liste embarquée s'il est absent (hors ligne).

Usage :  python3 tools/pages-couverture.py
"""
import json
import os
import subprocess
import sys

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXCLUS_PIED = {"404.html", "admin.html", "offline.html", "index.html", "quiz/pp.html", "tests/index.html"}
EXCLUS_DOSSIERS = ("tests/", "node_modules/", "backups/")


def collecter():
    try:
        out = subprocess.run(["git", "-C", RACINE, "ls-files", "-z", "*.html"],
                             capture_output=True, check=True).stdout
        pages = [p.decode("utf-8") for p in out.split(b"\0") if p]
    except Exception:  # repli sans git : parcours du disque (hors dossiers ignorés)
        pages = []
        for root, dirs, files in os.walk(RACINE):
            dirs[:] = [d for d in dirs if d not in (".git", "node_modules", "__pycache__", "backups", "tests")]
            for f in files:
                if f.endswith(".html"):
                    pages.append(os.path.relpath(os.path.join(root, f), RACINE).replace(os.sep, "/"))
    keep = []
    for p in pages:
        low = p.lower()
        if low in EXCLUS_PIED or low.startswith(EXCLUS_DOSSIERS) or "/backups/" in low:
            continue
        keep.append(low)
    return sorted(set(keep))


def main():
    pages = collecter()
    if len(pages) < 50:
        sys.exit("REFUS : %d pages seulement — le dépôt semble incomplet, rien n'est écrit." % len(pages))
    chemin = os.path.join(RACINE, "assets", "pages-couverture.json")
    with open(chemin, "w", encoding="utf-8") as fh:
        json.dump({"gen": "v434", "n": len(pages), "pages": pages}, fh, ensure_ascii=False, indent=0)
    print("assets/pages-couverture.json : %d pages de contenu (unique, minuscules)" % len(pages))


if __name__ == "__main__":
    main()
