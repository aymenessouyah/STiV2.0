# PHP — les variables, la portée et les types (vidéo)

Capsule PHP de la fiche « Capsule PHP variables, portée et types » (Lycée
Rafèha, 4ᵉ SI). Même formule que la capsule JavaScript « La console, les
variables et les types » : un seul écran, coupé en deux, du début à la fin.

* **à gauche le cours et ses analogies** — le lycée et ses salles, la salle de
  classe porte fermée, les carnets de liaison, la cuisine ;
* **à droite le code PHP** — tapé ligne à ligne, avec ce que la page affiche.

L'équivalent de la console du navigateur, ici, c'est la sortie de la page :
`echo`, `print_r` et `var_dump` — voir la valeur, tester une idée, lire l'erreur.

## La trame : dix sections, une voix

| # | Section | Ce qui est dit | Ce qui est montré |
| --- | --- | --- | --- |
| 1 | `ouverture` | le programme, les deux colonnes, les exercices, le dollar | les quatre blocs + `echo "Bonjour $nom"` |
| 2 | `declarer` | pas de mot-clé, les trois règles, `echo`, `isset`/`unset`/`empty`, les constantes | `$nom`, `$age`, `$moyenne`, `define`, `const PI` |
| 3 | `portee` | l'analogie du lycée : haut-parleur, salle fermée, carnets de liaison | `global $site`, l'avertissement puis `STI` |
| 4 | `bloc_static` | pas de portée de bloc ; seule la fonction isole ; `static` | `if`/`for` qui fuient, `static $n` → 1, 2, 3 |
| 5 | `hoisting` | PHP ne remonte pas les variables ; les fonctions, oui | `echo $x` avant `$x = 5`, puis `double(4)` |
| 6 | `types` | scalaires, `array`, `null` ; `gettype`, `var_dump`, `is_*` ; copie par valeur | les appels et les sorties, `$b = $a` |
| 7 | `tableaux` | indexé (casiers) et associatif (fiche) ; `count`, `foreach` | `$notes`, `$eleve`, `foreach ($eleve as $cle => $valeur)` |
| 8 | `hors_programme` | falsy/truthy (le `"0"` faux !) et `==` / `===`, **hors programme** | les deux titres **barrés** d'un trait rouge |
| 9 | `exercice_1` | que s'affiche-t-il ? six extraits a → f | énoncé à gauche, correction détaillée à droite |
| 10 | `exercice_moyenne` | la fonction `moyenne`, corrigée ligne par ligne | énoncé + contraintes à gauche, code commenté à droite |

Les corrigés retenus : a → rien (« Undefined variable $a »), b → `2`, c → `3`,
d → `123`, e → rien (« Undefined variable $d »), f → `10` ;
`moyenne([12, 15, 9])` → `12`.

## La chaîne de fabrication

```
narration.py   les dix textes (≤ 1500 caractères par section, la limite d'un clip)
    ↓  generate_speech → voix/<section>.mp3          (même voix que les autres capsules)
montage.py     voix-off.wav + calage.json + sous-titres.vtt
    ↓
scenes.py      une scène par section, dessinées par dessin.py
render.py      sortie_php.mp4 (1920×1080, 30 i/s, H.264 + AAC mono)
    ↓
integrer.py    assets/videos/PhpVariables-v549.mp4
               assets/subtitles/PhpVariables-fr-v549.vtt
               + chapitres de protection.js, durée de la carte
```

Commandes :

```bash
python3 outils/phpvariables/montage.py               # à faire après les clips
python3 outils/phpvariables/render.py --plan         # chronologie prévisionnelle
python3 outils/phpvariables/render.py --images /tmp/f --instants 20,120,300
python3 outils/phpvariables/render.py --durees outils/phpvariables/calage.json \
        --audio outils/phpvariables/voix-off.wav --sortie outils/phpvariables/sortie_php.mp4
python3 outils/phpvariables/integrer.py              # copie + chapitres + durée
python3 outils/bouclepour/manifeste.py               # en dernier, pour tout le paquet
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
* **La voix est française** : les symboles se lisent (« dollar » pour `$`, « et
  commercial » pour `&`, « flèche » pour `=>`, « point » pour `.`).
* `manifeste.py` est partagé : il régénère `offline-complete-manifest.json` pour
  tout le paquet (la version du lot se change en tête du fichier).
