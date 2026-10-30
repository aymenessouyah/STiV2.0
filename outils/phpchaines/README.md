# Chaînes, transtypage et date/heure (vidéo PHP)

Capsule PHP de la fiche « Capsule PHP : chaînes de caractères, transtypage et
date/heure en PHP » (4ᵉ SI, Lycée Rafèha). Même modèle que les capsules
précédentes : une seule voix, un écran coupé en deux du début à la fin, des
exercices, des sous-titres et des chapitres.

* **à gauche la fiche** — et surtout **le ruban d'octets** : quatorze cases
  numérotées de 0 à 13, une par octet, avec **les deux cases de chaque accent
  encadrées** (`é` puis `A9`, `è` puis `A8`). C'est le même dessin qui revient
  dans six scènes, parce que c'est lui qui explique `ord`, `strlen`, `strpos`,
  `substr`, l'exemple complet et le piège du mois ;
* **à droite le code** — tapé ligne à ligne, avec ce que la page affiche.

Une seule chaîne sert d'exemple partout : `$ch = "Lycée Rafèha";`
— douze caractères, **quatorze octets**, positions de 0 à 13. Une seule date
aussi : la rentrée du Lycée Rafèha, le 15 septembre 2026.

## La trame : douze sections, une voix

| # | Section | Ce qui est dit | Ce qui est montré |
| --- | --- | --- | --- |
| 1 | `ouverture` | les trois parties, la chaîne unique, l'octet | les cartes A/B/C, puis le ruban |
| 2 | `octets` | 12 caractères / 14 octets, `ord`, `chr` | le ruban avec 0, 3 et 7, les deux octets des accents |
| 3 | `longueur` | `strlen` compte les octets | 14 contre 12, le ruban |
| 4 | `recherche` | `strpos`, `=== false`, la position 0 | le ruban avec 0, 7 et 8, la boîte du piège |
| 5 | `extraction` | `substr` : début puis **longueur** | le trait sur `Lycée` (0 → 5), l'accent coupé |
| 6 | `remplacer` | `str_replace`, casse, `trim` | les quatre cartes, la boîte `trim` |
| 7 | `separer` | l'exemple complet de la partie A | `Lycée / Rafèha`, le point de concaténation |
| 8 | `transtypage_nombres` | `(int)`, `(float)`, la virgule | les cartes, la sortie ligne par ligne |
| 9 | `transtypage_autres` | `(string)`, `(bool)`, `(array)` | **les six valeurs fausses** en tableau |
| 10 | `dates` | le timestamp, `date()` et ses lettres | la frise 1970 → 2026, le tableau des lettres |
| 11 | `verifier_date` | `time`, `checkdate`, `strtotime` | la boîte des conversions, l'exemple complet |
| 12 | `exercices` | trois exercices + les six règles | énoncé à gauche, correction détaillée à droite |

## La chaîne de fabrication

```
narration.py   les douze textes (≤ 1500 caractères par section, la limite d'un clip)
    ↓  generate_speech → voix/<section>.mp3
montage.py     voix-off.wav + calage.json + sous-titres.vtt
    ↓
scenes.py      une scène par section, dessinées par dessin.py (ruban, frise, tableau)
render.py      sortie_phpchaines.mp4 (1920×1080, 30 i/s, H.264 + AAC mono)
    ↓
integrer.py    assets/videos/PhpChaines-v566.mp4
               assets/subtitles/PhpChaines-fr-v566.vtt
               + chapitres de protection.js, durée des cartes
```

Commandes :

```bash
python3 outils/phpchaines/montage.py              # après les clips
python3 outils/phpchaines/render.py --plan        # chronologie prévisionnelle
python3 outils/phpchaines/render.py --images /tmp/f --instants 20,120,300
python3 outils/phpchaines/render.py --durees outils/phpchaines/calage.json \
        --audio outils/phpchaines/voix-off.wav \
        --sortie outils/phpchaines/sortie_phpchaines.mp4
python3 outils/phpchaines/integrer.py             # copie + chapitres + durée
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
* **Un seul ruban** : `narration.CH`. Les positions, les codes et les corrigés se
  recalculent à partir d'elle — on n'écrit pas « 14 » à la main.
* **Les exercices sont toujours en deux colonnes** : `_enonce()` à gauche,
  `_correction()` à droite — jamais la réponse dans l'énoncé.
* **Aucune ellipse** : chaque notion annoncée est montrée avant la suivante, et
  chaque section garde le même décor.
