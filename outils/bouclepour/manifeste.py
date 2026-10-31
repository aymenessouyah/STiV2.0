"""Régénère `offline-complete-manifest.json` (paquet hors-ligne complet).

    python3 manifeste.py            # réécrit le manifeste, version v548
    python3 manifeste.py --verifier # contrôle des empreintes seulement

Le manifeste recense les fichiers du paquet hors-ligne avec leur taille et leur
SHA-1 de blob Git (`sha1("blob <taille>\\0" + contenu)`), sans doublon de casse.
On repart de la liste existante — elle est le reflet historique du paquet — en
recalculant chaque empreinte, et on y ajoute les chemins de `OFFLINE_LIST` qui
n'y figuraient pas encore mais qui existent réellement sur disque.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import unicodedata
from datetime import datetime, timezone

ICI = os.path.dirname(os.path.abspath(__file__))
RACINE = os.path.normpath(os.path.join(ICI, "..", ".."))
MANIFESTE = os.path.join(RACINE, "offline-complete-manifest.json")

VERSION = "v580-sti-atelier-v386"
PORTEE = "installation-complete-windows-sans-doublons-de-casse"


def sha1_blob(chemin: str) -> tuple[int, str]:
    donnees = open(chemin, "rb").read()
    entete = b"blob %d\0" % len(donnees)
    return len(donnees), hashlib.sha1(entete + donnees).hexdigest()


def chemins_offline() -> list[str]:
    sw = open(os.path.join(RACINE, "sw.js"), encoding="utf-8").read()
    bloc = sw.split("var OFFLINE_LIST = [")[1].split("];")[0]
    return [c.replace("\\/", "/") for c in re.findall(r'"\./((?:[^"\\]|\\.)*)"', bloc)]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--verifier", action="store_true")
    args = ap.parse_args()

    ancien = json.load(open(MANIFESTE, encoding="utf-8"))
    chemins = [f["path"] for f in ancien["files"]]
    connus = {c.lower() for c in chemins}
    offline = chemins_offline()

    # Un fichier renommé ou supprimé sort du manifeste : il n'est plus sur le
    # disque et il a quitté la liste hors ligne. S'il manque alors qu'il est
    # encore listé, c'est une vraie erreur, signalée plus bas.
    listes = {c.lower() for c in offline}
    chemins = [c for c in chemins
               if os.path.exists(os.path.join(RACINE, c)) or c.lower() in listes]

    nouveaux = []
    for chemin in offline:
        canonique = unicodedata.normalize("NFC", chemin)
        if canonique.lower() in connus:
            continue
        if not os.path.exists(os.path.join(RACINE, canonique)):
            print("ignoré (absent du disque) :", canonique)
            continue
        nouveaux.append(canonique)
        connus.add(canonique.lower())

    for chemin in nouveaux:
        chemins.append(chemin)
    chemins.sort()

    fichiers = []
    for chemin in chemins:
        complet = os.path.join(RACINE, chemin)
        if not os.path.exists(complet):
            print("ABSENT du disque :", chemin)
            return 2
        octets, sha = sha1_blob(complet)
        fichiers.append({"path": chemin, "bytes": octets, "gitSha": sha})

    doublons = len({f["path"].lower() for f in fichiers}) != len(fichiers)
    if doublons:
        print("doublon de casse dans le manifeste")
        return 3

    total = sum(f["bytes"] for f in fichiers)
    print(f"fichiers : {len(fichiers)} (ajoutés : {len(nouveaux)}) — {total} octets")
    if nouveaux:
        print("ajoutés :", ", ".join(nouveaux))

    if args.verifier:
        return 0

    maintenant = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    manifeste = {
        "version": VERSION,
        "generatedAt": maintenant,
        "scope": PORTEE,
        "totalFiles": len(fichiers),
        "totalBytes": total,
        "files": fichiers,
    }
    with open(MANIFESTE, "w", encoding="utf-8") as f:
        json.dump(manifeste, f, ensure_ascii=False, indent=2)
    print("écrit :", os.path.relpath(MANIFESTE, RACINE))
    return 0


if __name__ == "__main__":
    sys.exit(main())
