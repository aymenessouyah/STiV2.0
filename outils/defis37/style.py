"""Accès au thème commun des vidéos du site.

Le style (palette, polices, primitives) est celui de `outils/tpvid6` : une
seule source de vérité pour toutes les capsules, afin que celle des 37 Défis
soit exactement dans le même thème.
"""
from __future__ import annotations

import sys
from pathlib import Path

_CHEMIN = Path(__file__).resolve().parent.parent / "tpvid6"
if str(_CHEMIN) not in sys.path:
    sys.path.insert(0, str(_CHEMIN))

import theme as _theme  # noqa: E402  (outils/tpvid6/theme.py)

# Palette et primitives réexportées telles quelles
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


# ── Nettoyage : les polices DejaVu n'ont pas d'emoji ─────────────────────
import re as _re

_EMOJI = _re.compile("[\U0001F000-\U0001FAFF\U00002600-\U000027BF"
                     "\U0001F1E6-\U0001F1FF\uFE0F\u200D\u2B00-\u2BFF]")


def sans_emoji(contenu):
    """Retire les emojis (non rendus par DejaVu) et normalise les espaces."""
    texte_propre = _EMOJI.sub("", str(contenu))
    return _re.sub(r"\s{2,}", " ", texte_propre).strip()

