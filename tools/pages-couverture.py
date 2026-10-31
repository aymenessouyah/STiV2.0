#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""⚠️ DÉPRÉCIÉ depuis la v583 — conservé uniquement pour ne pas casser les appels existants.

Ce script est remplacé par outils/couverture/generer-couverture.py, qui corrige les deux
défauts de la version v434 :

  1. les chemins étaient passés en minuscules (48 des 124 entrées ne désignaient plus
     aucun fichier réel : « exercices/javascript/tp1-js.html » au lieu de « Tp1-js.html ») ;
  2. la liste de 124 pages était figée et excluait arbitrairement des pages réelles
     (index.html, admin.html, 404.html, quiz/pp.html…).

La règle v583 est simple : toutes les pages .html suivies par Git, hors tests/.
Le décompte `n` du fichier est calculé, jamais recopié à la main.

Usage : python3 outils/couverture/generer-couverture.py
"""
import os
import subprocess
import sys

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CIBLE = os.path.join(RACINE, "outils", "couverture", "generer-couverture.py")

if __name__ == "__main__":
    print("⚠️  tools/pages-couverture.py est déprécié : relais vers "
          "outils/couverture/generer-couverture.py", file=sys.stderr)
    sys.exit(subprocess.call([sys.executable, CIBLE] + sys.argv[1:]))
