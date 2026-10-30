# L'objet Date (vidéo)

Capsule JavaScript de la fiche « Capsule date en JavaScript » (3ᵉ/4ᵉ SI,
Lycée Rafèha). Même modèle que les quatre capsules précédentes : une seule voix,
un écran coupé en deux du début à la fin, des exercices, des sous-titres et des
chapitres.

* **à gauche la fiche** — et surtout **le calendrier de septembre 2026**, la
  grille du mois avec le 15 encerclé, puis **la bande des douze mois** qui porte
  sous chaque nom deux numéros : celui de JavaScript (`0`–`11`) et celui qu'un
  humain écrit (`1`–`12`) ;
* **à droite le code** — tapé ligne à ligne, avec ce que la console affiche.
  Tous les exemples passent par `console.log` (jamais `alert`).

Une seule date sert d'exemple partout : `new Date("2026-09-15T08:00:00")` —
la rentrée au Lycée Rafèha, le 15 septembre 2026 à 8 h.

## La trame : neuf sections, une voix

| # | Section | Ce qui est dit | Ce qui est montré |
| --- | --- | --- | --- |
| 1 | `ouverture` | l'objet Date, la fiche, les deux colonnes | les quatre méthodes + le calendrier de septembre |
| 2 | `date_courante` | `new Date()` sans argument, l'horloge de la machine | le calendrier, l'année lue, la phrase d'accueil |
| 3 | `date_chaine` | `new Date(ch)`, format `AAAA-MM-JJ`, `Invalid Date` | les trois essais, la sortie ligne par ligne |
| 4 | `getdate` | 1 → 31, ≠ jour de la semaine | le 15 encerclé sur la grille, le piège |
| 5 | `getmonth` | **0 → 11**, septembre = 8, `+ 1` = 9, le tableau | la bande des douze mois, les deux numéros |
| 6 | `getfullyear` | quatre chiffres, `getYear` à éviter | l'année lue, la date assemblée `15/9/2026` |
| 7 | `tostring` | le texte dépend du navigateur, `typeof` → string | `Tue Sep 15 2026 08:00:00 GMT+0100` |
| 8 | `exemple_complet` | les trois étapes, le tableau des mois | `Rentrée au Lycée Rafèha : 15 septembre 2026` |
| 9 | `exercices` | trois exercices + les quatre règles | énoncé à gauche, correction à droite |

## La chaîne de fabrication

```
narration.py   les neuf textes (≤ 1500 caractères par section, la limite d'un clip)
    ↓  generate_speech → voix/<section>.mp3
montage.py     voix-off.wav + calage.json + sous-titres.vtt
    ↓
scenes.py      une scène par section, dessinées par dessin.py (calendrier, bande, horloge)
render.py      sortie_date.mp4 (1920×1080, 30 i/s, H.264 + AAC mono)
    ↓
integrer.py    assets/videos/DateJS-v565.mp4
               assets/subtitles/DateJS-fr-v565.vtt
               + chapitres de protection.js, durée des cartes
```

Commandes :

```bash
python3 outils/datejs/montage.py              # après les clips
python3 outils/datejs/render.py --plan        # chronologie prévisionnelle
python3 outils/datejs/render.py --images /tmp/f --instants 20,120,300
python3 outils/datejs/render.py --durees outils/datejs/calage.json \
        --audio outils/datejs/voix-off.wav \
        --sortie outils/datejs/sortie_date.mp4
python3 outils/datejs/integrer.py             # copie + chapitres + durée
```

`render.py` et `montage.py` cherchent `ffmpeg` dans
`node_modules/@ffmpeg-installer/linux-x64/ffmpeg` (comme les autres capsules),
puis dans le `PATH` ; `montage.py` n'a besoin que du binaire.

## Les conventions

* **La version est dans le nom des fichiers** : le service worker sert `.mp4` et
  `.vtt` en « cache d'abord » et ne les revalide jamais. Changer `VERSION_MEDIA`
  dans `integrer.py` à chaque refonte, sinon le téléphone garde l'ancienne vidéo.
* **Deux colonnes, jamais mélangées** : `GAUCHE = (64, 186, 916, 884)` pour la
  fiche, `DROITE = (940, 186, 1856, 884)` pour le code, `BANDE` pour la synthèse.
* **Une seule date** : `narration.SOURCE`. Le calendrier, la bande des mois et
  les corrigés se recalculent à partir d'elle — on n'écrit pas « 15 » à la main.
* **Les exercices sont toujours en deux colonnes** : `_enonce()` à gauche,
  `_correction()` à droite — jamais la réponse dans l'énoncé.
* **`console.log`, jamais `alert`** : c'est la demande de la fiche corrigée, et
  c'est ce que la console du navigateur montre aux élèves.
