#!/usr/bin/env python3
"""Régénérer le manifeste portable sans inclure les livrables non suivis.

Les actifs des stories sont ajoutés explicitement, afin qu'une vérification
locale fonctionne également avant leur premier commit. Aucune URL ni secret.
"""
import hashlib
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path

racine = Path(__file__).resolve().parents[1]
chemin = racine / 'offline-complete-manifest.json'
manifeste = json.loads(chemin.read_text(encoding='utf-8'))
existants = [x['path'] for x in manifeste['files']]
suivis = subprocess.check_output(['git', 'ls-files', '-z'], cwd=racine).decode('utf-8').split('\0')
# Les références de l'application sont incluses, mais pas les captures, tests,
# sources de montage ni fichiers produits pour d'autres livraisons.
public = ('assets/', 'cours/', 'exercices/', 'projets/', 'quiz/', 'documents/')
acceptes = ('.html', '.css', '.js', '.json', '.svg', '.webmanifest', '.png', '.jpg', '.jpeg', '.gif',
            '.webp', '.vtt', '.srt', '.mp4', '.mp3', '.wav', '.ogg', '.woff', '.woff2', '.wasm', '.pdf', '.ico')
for f in suivis:
    if f and f.startswith(public) and f.lower().endswith(acceptes):
        existants.append(f)
for dossier in ('assets/images/stories', 'assets/videos/stories', 'assets/subtitles/stories'):
    existants.extend(p.relative_to(racine).as_posix() for p in (racine / dossier).glob('*') if p.is_file())
# Le manifeste Windows ne peut contenir deux noms ne différant que par la casse.
# Conserver en priorité le chemin déjà livré lorsqu'il existe un alias identique.
uniques, variantes = {}, []
for rel in existants:
    p = racine / rel
    if not p.is_file() or rel == 'offline-complete-manifest.json':
        continue
    cle = rel.casefold()
    if cle in uniques and uniques[cle] != rel:
        if p.read_bytes() != (racine / uniques[cle]).read_bytes():
            # Deux contenus différents existent déjà dans le dépôt : Windows ne
            # peut pas installer les deux sous ces noms. Ne modifier aucun fichier.
            variante = {'retenu': uniques[cle], 'autre': rel}
            if variante not in variantes:
                variantes.append(variante)
        continue
    uniques[cle] = rel
entrees = []
for rel in sorted(uniques.values(), key=str.casefold):
    contenu = (racine / rel).read_bytes()
    blob = hashlib.sha1(b'blob ' + str(len(contenu)).encode() + b'\0' + contenu).hexdigest()
    entrees.append({'path': rel, 'bytes': len(contenu), 'gitSha': blob})
manifeste.update(version='v495-sti-atelier-v356', generatedAt=datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
                 totalFiles=len(entrees), totalBytes=sum(e['bytes'] for e in entrees), files=entrees,
                 variantesCasse=variantes)
chemin.write_text(json.dumps(manifeste, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f"{len(entrees)} fichiers, {manifeste['totalBytes']} octets")
