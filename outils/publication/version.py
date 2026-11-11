#!/usr/bin/env python3
"""Prépare ou contrôle l'identité d'une publication sans modifier les caches PWA.

  python3 outils/publication/version.py --incrementer
  python3 outils/publication/version.py --verifier --base <commit>

L'incrémentateur écrit la date UTC du lancement et régénère le manifeste hors ligne.
La vérification CI compare la branche avec le commit de base de la pull request.
"""
import argparse
from datetime import datetime, timezone
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
SW = ROOT / 'sw.js'
VERSION = re.compile(r'var VERSION_PUBLIEE = "v(\d+)";')
DATE = re.compile(r'var PUBLIEE_LE = "([^"]+)";')

def lire(texte):
    v = VERSION.findall(texte)
    d = DATE.findall(texte)
    if len(v) != 1 or len(d) != 1:
        raise ValueError('VERSION_PUBLIEE et PUBLIEE_LE doivent être présents une seule fois')
    if not re.fullmatch(r'\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ', d[0]):
        raise ValueError('PUBLIEE_LE doit être une date UTC ISO 8601 avec secondes')
    return int(v[0]), datetime.strptime(d[0], '%Y-%m-%dT%H:%M:%SZ').replace(tzinfo=timezone.utc)

def verifier(texte, ancien):
    version, date = lire(texte)
    version_base, date_base = lire(ancien)
    if version <= version_base or date <= date_base:
        raise ValueError("publication non avancée : incrémenter VERSION_PUBLIEE et PUBLIEE_LE après la version de base")
    return version, date, version_base, date_base

def main():
    p = argparse.ArgumentParser()
    action = p.add_mutually_exclusive_group(required=True)
    action.add_argument('--incrementer', action='store_true')
    action.add_argument('--verifier', action='store_true')
    p.add_argument('--base', help='commit de base, obligatoire avec --verifier')
    args = p.parse_args()
    texte = SW.read_text(encoding='utf-8')
    version, date = lire(texte)
    if args.incrementer:
        maintenant = datetime.now(timezone.utc).replace(microsecond=0)
        if maintenant <= date:
            raise ValueError('horloge UTC non postérieure à la dernière publication')
        texte = VERSION.sub(f'var VERSION_PUBLIEE = "v{version + 1}";', texte, count=1)
        texte = DATE.sub(f'var PUBLIEE_LE = "{maintenant.strftime("%Y-%m-%dT%H:%M:%SZ")}";', texte, count=1)
        SW.write_text(texte, encoding='utf-8')
        subprocess.run([sys.executable, str(ROOT / 'outils/bouclepour/manifeste.py')], cwd=ROOT, check=True)
        print(f'Publication v{version + 1} · {maintenant.isoformat()}')
    else:
        if not args.base:
            p.error('--base est obligatoire avec --verifier')
        ancien = subprocess.check_output(['git', 'show', f'{args.base}:sw.js'], cwd=ROOT, text=True)
        version, date, version_base, date_base = verifier(texte, ancien)
        print(f'Publication v{version} · {date.isoformat()} > v{version_base} · {date_base.isoformat()}')

if __name__ == '__main__':
    try:
        main()
    except (ValueError, subprocess.CalledProcessError) as exc:
        print(f'Erreur publication : {exc}', file=sys.stderr)
        sys.exit(1)
