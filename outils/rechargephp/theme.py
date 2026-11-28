"""Accès au thème commun des capsules du site (outils/tpvid6/theme.py).

Une seule source de vérité pour la palette et les primitives, afin que la
capsule « La boucle Pour » soit exactement dans le thème des autres vidéos.

Le module est chargé par son chemin sous le nom `theme_tpvid6` : le fichier
`theme.py` de ce dossier ne doit pas s'importer lui-même.
"""
from __future__ import annotations

import importlib.util
from pathlib import Path

_SOURCE = Path(__file__).resolve().parent.parent / "tpvid6" / "theme.py"
_spec = importlib.util.spec_from_file_location("theme_tpvid6", _SOURCE)
_theme = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_theme)  # type: ignore[union-attr]

FOND = _theme.FOND
FOND_PANNEAU = _theme.FOND_PANNEAU
FOND_PANNEAU_2 = _theme.FOND_PANNEAU_2
BORDURE = _theme.BORDURE
TEXTE = _theme.TEXTE
TEXTE_2 = _theme.TEXTE_2
TEXTE_3 = _theme.TEXTE_3
ORANGE = _theme.ORANGE
ORANGE_FONCE = _theme.ORANGE_FONCE
AMBRE = _theme.AMBRE
VIOLET = _theme.VIOLET
VERT = _theme.VERT
BLEU = _theme.BLEU
ROSE = _theme.ROSE
ROUGE_LIGNE = _theme.ROUGE_LIGNE
ROUGE_BORD = _theme.ROUGE_BORD

police = _theme.police
melange = _theme.melange
avec_alpha = _theme.avec_alpha
boite_arrondie = _theme.boite_arrondie
texte = _theme.texte
largeur_texte = _theme.largeur_texte
texte_centre = _theme.texte_centre
texte_ajuste = _theme.texte_ajuste
couper_texte = _theme.couper_texte
fleche = _theme.fleche
degrade_vertical = _theme.degrade_vertical
