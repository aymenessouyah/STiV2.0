# Les chaînes de caractères (vidéo)

Capsule JavaScript de la fiche « Chaînes de caractères, conversions de types et
dates » (Annexe JS, 3ᵉ/4ᵉ SI, Lycée Rafèha). Même modèle que la capsule
« La console, les variables et les types » : une seule voix, un écran coupé en
deux du début à la fin, des exercices, des sous-titres et des chapitres.

* **à gauche la fiche** — et surtout **le ruban de caractères** : une case par
  caractère, avec sa position au-dessus. C'est le même dessin qui revient dans
  six scènes, parce que c'est lui qui explique les crochets, `indexOf`,
  `substring`, `trim` et `charCodeAt` ;
* **à droite le code** — tapé ligne à ligne, avec ce que la console affiche.

Une seule chaîne sert d'exemple partout : `let ch = "Lycée Rafèha";`
— douze caractères, positions de zéro à onze, l'espace compris.

## La trame : dix sections, une voix

| # | Section | Ce qui est dit | Ce qui est montré |
| --- | --- | --- | --- |
| 1 | `ouverture` | la fiche, les trois parties, les deux colonnes | les trois parties + le sommaire, puis la chaîne |
| 2 | `positions` | zéro à onze, l'espace compte, `length - 1` | le ruban numéroté, le repère sur l'espace |
| 3 | `concat_longueur` | `+` ne met pas d'espace, `length` sans parenthèses | `nom + " " + ville`, la sortie, les 12 caractères |
| 4 | `acces_recherche` | `ch[p]`, `undefined`, `indexOf`, `lastIndexOf`, `-1` | le ruban avec 0, 6 et 11 désignés, les quatre recherches |
| 5 | `decouper_remplacer` | début inclus / fin exclue, arguments échangés, `replace` | le trait après la case 2, `LycéRAfèha`, `ch` intact |
| 6 | `casse_trim` | casse, bords, champ vide | la saisie à 18 caractères, les six espaces marqués, `trim()` → 12 |
| 7 | `codes` | `charCodeAt`, `String.fromCharCode`, accents > 127 | le ruban avec **le code sous chaque caractère** |
| 8 | `nombres` | `isNaN`, `Number`, `parseFloat`, `parseInt`, le piège `"20" + "5"` | les quatre cartes de conversion, la sortie |
| 9 | `texte_date` | `String()`, `new Date`, `toString()` | `annee.length` → `undefined`, la date en toutes lettres |
| 10 | `exercices` | trois exercices + les cinq règles | énoncé à gauche, correction détaillée à droite |

Les corrigés retenus : `ch.substring(4, 7)` → `e, espace, R` (trois
caractères) ; `ch.indexOf("a") + ch.lastIndexOf("a")` → `7 + 11 = 18` ;
`prenom.trim().length` pour un prénom propre, `toLowerCase()` pour comparer.

## La chaîne de fabrication

```
narration.py   les dix textes (≤ 1500 caractères par section, la limite d'un clip)
    ↓  generate_speech → voix/<section>.mp3
montage.py     voix-off.wav + calage.json + sous-titres.vtt
    ↓
scenes.py      une scène par section, dessinées par dessin.py (le ruban)
render.py      sortie_chaines.mp4 (1920×1080, 30 i/s, H.264 + AAC mono)
    ↓
integrer.py    assets/videos/FonctionsChaine-v564.mp4
               assets/subtitles/FonctionsChaine-fr-v564.vtt
               + chapitres de protection.js, durée des cartes
```

Commandes :

```bash
python3 outils/fonctionschaine/montage.py              # après les clips
python3 outils/fonctionschaine/render.py --plan        # chronologie prévisionnelle
python3 outils/fonctionschaine/render.py --images /tmp/f --instants 20,120,300
python3 outils/fonctionschaine/render.py --durees outils/fonctionschaine/calage.json \
        --audio outils/fonctionschaine/voix-off.wav \
        --sortie outils/fonctionschaine/sortie_chaines.mp4
python3 outils/fonctionschaine/integrer.py             # copie + chapitres + durée
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
* **Une seule chaîne** : `narration.CH`. Le ruban, les codes et les corrigés se
  recalculent à partir d'elle — on ne réécrit pas « 12 » à la main.
* **Les exercices sont toujours en deux colonnes** : `_enonce()` à gauche,
  `_correction()` à droite — jamais la réponse dans l'énoncé.
* **Aucune ellipse** : chaque notion annoncée est montrée avant la suivante, et
  chaque section garde le même décor.
