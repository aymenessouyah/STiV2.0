# La console, les variables et les types (vidéo)

Capsule JavaScript de la fiche « Capsule JavaScript variables (var, let, const)
et types » (Lycée Rafèha, 3ᵉ/4ᵉ SI). Un seul écran, coupé en deux, du début à
la fin :

* **à gauche le cours et ses analogies** — le carnet de bord, la case mémoire,
  le lycée et ses salles, le surveillant qui lit la liste, la cuisine ;
* **à droite le code JavaScript** — tapé ligne à ligne, avec ce que la console
  affiche.

## La trame : dix sections, une voix

| # | Section | Ce qui est dit | Ce qui est montré |
| --- | --- | --- | --- |
| 1 | `ouverture` | le programme, les deux colonnes, les exercices | les quatre blocs + `console.log("Bonjour STI")` |
| 2 | `console` | à quoi sert la console : voir, tester, lire l'erreur | `console.log`, `console.error`, `console.table` et leur sortie |
| 3 | `declarer` | une case mémoire nommée ; var, let, const | `let age = 16; age = 17;` puis `17` |
| 4 | `portee` | l'analogie du lycée : haut-parleur, salle 12, groupe | les trois portées, puis `var` sans groupes |
| 5 | `let_const` | TDZ, réaffectation, redéclaration, `const` et le contenu | `SyntaxError`, `TypeError`, `notes[0] = 14` ✔ / `notes = […]` ✖ |
| 6 | `hoisting` | la liste lue avant le cours : assis (`undefined`) ou couloir (`ReferenceError`) | les deux appels et les deux résultats |
| 7 | `types` | sept primitifs, `typeof`, valeur ou référence, conversions | la grille des types, les trois pièges, `"5" + 2` |
| 8 | `hors_programme` | falsy/truthy et `==` / `===`, **hors programme** | les deux titres **barrés** d'un trait rouge |
| 9 | `exercice_1` | que s'affiche-t-il ? six extraits a → f | énoncé à gauche, correction détaillée à droite |
| 10 | `exercice_moyenne` | la fonction `moyenne`, corrigée ligne par ligne | énoncé + contraintes à gauche, code commenté à droite |

Les corrigés retenus : a → `2`, b → `1`, c → `undefined`, d → `ReferenceError`,
e → `TypeError`, f → `[5, 2]` ; `moyenne([12, 15, 9])` → `12`.

## La chaîne de fabrication

```
narration.py   les dix textes (≤ 1500 caractères par section, la limite d'un clip)
    ↓  generate_speech → voix/<section>.mp3          (même voix que la capsule boucles)
montage.py     voix-off.wav + calage.json + sous-titres.vtt
    ↓
scenes.py      une scène par section, dessinées par dessin.py
render.py      sortie_variables.mp4 (1920×1080, 30 i/s, H.264 + AAC mono)
    ↓
integrer.py    assets/videos/ConsoleVariables-v548.mp4
               assets/subtitles/ConsoleVariables-fr-v548.vtt
               + chapitres de protection.js, durées des cartes
```

Commandes :

```bash
python3 outils/variables/montage.py                  # à faire après les clips
python3 outils/variables/render.py --plan            # chronologie prévisionnelle
python3 outils/variables/render.py --images /tmp/f --instants 20,120,300
python3 outils/variables/render.py --durees outils/variables/calage.json \
        --audio outils/variables/voix-off.wav --sortie outils/variables/sortie_variables.mp4
python3 outils/variables/integrer.py                 # copie + chapitres + durées
python3 outils/bouclepour/manifeste.py               # porté par le lot suivant
```

## Les conventions

* **La version est dans le nom des fichiers** : le service worker sert `.mp4` et
  `.vtt` en « cache d'abord » et ne les revalide jamais. Changer `VERSION_MEDIA`
  dans `integrer.py` à chaque refonte, sinon le téléphone garde l'ancienne vidéo.
* **Deux colonnes, jamais mélangées** : `GAUCHE = (64, 186, 916, 884)` pour le
  cours, `DROITE = (940, 186, 1856, 884)` pour le code, `BANDE` pour la synthèse.
* **Hors programme reste barré** : `dessin.barrer()` trace le trait rouge sous le
  titre de l'aparté, et la voix dit que c'est hors programme mais bon à connaître.
* **Les exercices sont toujours en deux colonnes** : `_enonce()` à gauche,
  `_correction()` à droite — jamais la réponse dans l'énoncé.
* **Aucune ellipse** : chaque notion annoncée est montrée avant la suivante, et
  chaque section garde le même décor (pas de changement d'écran).
* `manifeste.py` est partagé : il régénère `offline-complete-manifest.json` pour
  tout le paquet (la version du lot se change en tête du fichier).
