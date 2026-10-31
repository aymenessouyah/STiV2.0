#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Génère assets/pages-couverture.json (v583).

Source unique du décompte « x / N pages » du tableau de bord, des fiches élèves,
des exports CSV et du bulletin.

Règle retenue (consigne auteur du 31/10/2026) : **toutes les pages HTML du site
suivies par Git, sauf les pages de test (tests/)**. Soit 145 pages aujourd'hui,
y compris les pages techniques (404.html, admin.html, dashboard.html,
migration-photos-bucket.html) et portail.html.

Corrections apportées par rapport à l'ancien tools/pages-couverture.py (hors service) :
  - les chemins gardent leur CASSE RÉELLE (l'ancien générateur passait tout en
    minuscules : 48 des 124 entrées ne désignaient plus aucun fichier) ;
  - le décompte `n` est calculé, jamais recopié à la main ;
  - la liste est relue sur Git (`git ls-files`), donc elle ne peut pas contenir de
    fantôme ni oublier une page ajoutée.

Usage : python3 outils/couverture/generer-couverture.py [--verifier]
        --verifier : ne réécrit rien, sort en code 1 si le fichier est périmé.
"""
import json
import os
import subprocess
import sys

RACINE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CIBLE = os.path.join(RACINE, "assets", "pages-couverture.json")
GEN = "v583"
EXCLUS = ("tests/",)


def pages_du_site():
    brut = subprocess.check_output(["git", "ls-files", "-z", "*.html"], cwd=RACINE)
    fichiers = [p for p in brut.decode("utf-8").split("\0") if p]
    gardees = [p for p in fichiers if not p.startswith(EXCLUS)]
    # tri stable et indépendant de la plateforme : insensible à la casse, puis exact
    return sorted(gardees, key=lambda p: (p.lower(), p))


def rendre(pages):
    lignes = [
        "{",
        '"gen": "%s",' % GEN,
        '"n": %d,' % len(pages),
        '"regle": "toutes les pages HTML du site suivies par Git, hors tests/ (pages de test non livrées)",',
        '"pages": [',
    ]
    lignes += ['%s%s' % (json.dumps(p, ensure_ascii=False), "," if i < len(pages) - 1 else "")
               for i, p in enumerate(pages)]
    lignes += ["]", "}", ""]
    return "\n".join(lignes)


def main():
    pages = pages_du_site()
    contenu = rendre(pages)
    verifier = "--verifier" in sys.argv[1:]
    actuel = ""
    if os.path.exists(CIBLE):
        with open(CIBLE, encoding="utf-8") as f:
            actuel = f.read()
    if verifier:
        if actuel != contenu:
            print("❌ assets/pages-couverture.json est périmé : relancer sans --verifier.")
            return 1
        print("✅ assets/pages-couverture.json est à jour (%d pages)." % len(pages))
        return 0
    with open(CIBLE, "w", encoding="utf-8", newline="\n") as f:
        f.write(contenu)
    print("✅ assets/pages-couverture.json : %d pages (%s)." % (len(pages), GEN))
    return 0


if __name__ == "__main__":
    sys.exit(main())
