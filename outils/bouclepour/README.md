# Les boucles — Pour, Répéter…jusqu'à, Tant que (vidéo)

Capsule « Les boucles » — JavaScript et PHP. Elle ne montre plus **une** boucle mais les
**trois**, et surtout **comment choisir**. Le fil conducteur est un **schéma de
décision** : face à une répétition, je pose trois questions, dans l'ordre.

```
une répétition
  ├─ Q1 : est-ce que je connais le nombre de répétitions à l'avance ?
  │    non → boucle conditionnelle (0 à n fois)
  │    oui → Q2 : est-ce qu'une condition d'arrêt peut m'arrêter avant la fin ?
  │             non → POUR            compteur de I à F, FAIRE le bloc
  │             oui → Q3 : combien de fois, au moins, je répète ?
  │                     au moins une fois → RÉPÉTER…JUSQU'À
  │                     risque zéro      → TANT QUE
```

Les trois exemples tiennent dans **le même décor** (l'immeuble, l'ascenseur, le
sac) :

* **POUR** — la somme des quatre étages, `T = [4, 7, 2, 9]` → `S = 22` ;
* **RÉPÉTER…JUSQU'À** — chercher `X` dans `T` : `X = 7` (trouvé au 2ᵉ tour) et
  `X = 5` (absent : quatre tours, on sort sur `i > 3`) ;
* **TANT QUE** — vider la **boîte de jetons** dans le sac tant qu'il en reste :
  trois jetons → trois tours ; boîte vide au départ → **zéro tour**.

## La trame : trois colonnes, toujours les mêmes

| Colonne | Contenu |
| --- | --- |
| **à gauche** | le décor : l'immeuble et son ascenseur, la boîte de jetons, le sac |
| **au milieu** | le **brouillon**, le **schéma de décision**, le **tableau des trois boucles** |
| **à droite** | **trois cadres séparés** : ① l'**ALGORITHME**, ② le **JAVASCRIPT**, ③ le **PHP** |

On écrit **l'algorithme d'abord**, puis on le traduit deux fois — JavaScript,
puis PHP : les trois cadres ne sont jamais mélangés, et le cadre qui n'est pas encore écrit affiche ce qu'il
attendra.

## Les 36 étapes

| # | Section | Ce que l'on voit |
| --- | --- | --- |
| 1 | ouverture | la phrase d'ouverture, la définition, les trois boucles nommées |
| 2 | introduction | sans boucle / avec boucle, et les trois ingrédients |
| 3 | probleme | l'immeuble, `T = [4, 7, 2, 9]`, `S = ?` |
| 4 | immeuble | le tableau : un contenu variable, donc un nom, `T` |
| 5 | ascenseur | l'ascenseur = la cabine carrée `[ ]` ; `T[i]` = étage i, portes ouvertes |
| 6 | scalaire | le compteur de l'ascenseur : un type scalaire |
| 7 | repetition | quatre lignes identiques : « seul le chiffre change » |
| 8 | q1 | « je connais le nombre ? » → oui (4 étages) |
| 9 | q2 | « une condition d'arrêt ? » → non |
| 10 | q3 | « au moins une fois ? » → le schéma est complet |
| 11 | engendrer | `S = S + T[quelque chose]`, et la boucle Pour l'engendre × 4 |
| 12 | pour_algo | `POUR compteur DE 0 À 3 FAIRE` |
| 13 | pour_js | `for (let i = 0; i < T.length; i++)` : départ, continuité, pas |
| 14 | **pour_php** | `for ($i = 0; $i < count($T); $i++)` : les `$`, `count` |
| 15 | pour_trace | les quatre tours, `S = 22`, `4 < 4` est faux |
| 16 | rappel1 | schéma + tableau, branche POUR allumée |
| 17 | chercher_quoi | chercher `X`, tours inconnus |
| 18 | chercher_q | condition d'arrêt, au moins un tour → RÉPÉTER…JUSQU'À |
| 19 | repet_algo | `RÉPÉTER … JUSQU'À trouvé OU i > 3` |
| 20 | repet_js | `do { … } while (!trouve && i < 4);` |
| 21 | **repet_php** | `do { … } while (!$trouve && $i < 4);` — `==`, pas `===` |
| 22 | repet_trouve | `X = 7` : trouvé au deuxième tour |
| 23 | repet_absent | `X = 5` : quatre tours, « absent » |
| 24 | rappel2 | branche RÉPÉTER…JUSQU'À allumée |
| 25 | tantque_quoi | la boîte de jetons : zéro tour possible |
| 26 | tantque_algo | `TANT QUE jetons > 0 FAIRE` |
| 27 | tantque_js | `while (jetons > 0) { jetons--; n++; }` |
| 28 | **tantque_php** | `while ($jetons > 0) { $jetons--; $n++; }` |
| 29 | tantque_trace | trois jetons → trois tours ; zéro jeton → zéro tour |
| 30 | rappel3 | branche TANT QUE allumée |
| 31 | tableau3 | le tableau des trois boucles en grand |
| 32 | choisir | le schéma complet et les trois exemples en regard |
| 33 | algo_js | les correspondances des **trois** langages, côte à côte |
| 34 | bilan | trois colonnes × trois cadres : algorithme, JavaScript, PHP |
| 35 | conclusion | la méthode en trois questions |
| 36 | generique | la carte de fin : STI Version 2.0, « à vous de jouer » |

## Le tableau, expliqué comme un immeuble

| L'image | Le mot | L'écriture |
| --- | --- | --- |
| l'immeuble, dont le contenu peut changer | **le tableau** (une variable) | `T` |
| la cabine carrée de l'ascenseur | **les crochets** | `[ ]` |
| l'étage où la cabine s'arrête | **l'indice** | `i` |
| l'étage i, portes ouvertes | **l'élément** | `T[i]` |

Et l'ascenseur **compte tout seul** : son compteur est d'un type **scalaire**, c'est-à-dire
un type qui possède un successeur et un prédécesseur (l'entier, le caractère). D'où
`i + 1` : après un, on trouve deux, sans avoir à l'expliquer.

La boucle, elle, ne s'écrit pas quatre fois : on écrit **une** ligne au brouillon,
`S = S + T[quelque chose]`, et la boucle **Pour l'engendre** quatre fois. Le JavaScript
vient **après** l'algorithme, avec ses trois morceaux : `i = 0` (départ),
`i < T.length` (continuité), `i++` (pas, c'est-à-dire `i = i + 1`).

## Mise en page

Trois colonnes fixes : `le décor` (64 → 644), `le raisonnement` (670 → 1250),
les trois cadres : `ALGORITHME` (1276 → 1856, 186 → 412), `JAVASCRIPT`
(1276 → 1856, 422 → 648) et `PHP` (1276 → 1856, 658 → 884). En bas, le **fil rouge** : les trois boucles, la
boucle courante allumée et l'information du moment. Le titre reste le même
dans toutes les scènes, seul le sous-titre change, et le décompte affiche
« ÉTAPE n / 36 » avec une barre de progression.

1920 × 1080, 30 i/s, H.264 + AAC mono, sous-titres `WebVTT` calés sur la voix.

## Chaîne de fabrication

```bash
python3 render.py --plan                                  # chronologie prévisionnelle
python3 render.py --images /tmp/f --instants 40,90,140     # images de contrôle
python3 montage.py                     # voix/ → voix-off.wav + calage.json + VTT
python3 render.py --durees calage.json --audio voix-off.wav --sortie sortie_bouclepour.mp4
python3 integrer.py                    # copie MP4/VTT dans assets/ + durées
python3 integrer.py --verifier         # contrôle hors-ligne
```

`render.py --images` accepte aussi `--durees calage.json` pour des images
calées sur la voix ; sans calage, des images de travail se font directement :

```bash
python3 - <<'PY'
from PIL import Image, ImageDraw
import scenes, narration as N
from dessin import LARGEUR, HAUTEUR
for cle in N.ORDRE:
    img = Image.new("RGB", (LARGEUR, HAUTEUR), (13, 20, 36))
    scenes.dessiner(ImageDraw.Draw(img), cle, 0.8, 6.0)
    img.save(f"/tmp/{cle}.png")
PY
```

| Fichier | Rôle |
| --- | --- |
| `narration.py` | texte de la voix off (36 sections) et sous-titres |
| `theme.py` | accès au thème commun (`outils/tpvid6/theme.py`, chargé par chemin) |
| `dessin.py` | primitives : les trois colonnes, l'immeuble + cage, le sac, la boîte de jetons, le papier du brouillon, le crayon, le stylo rouge, le schéma de décision, le tableau des trois boucles |
| `scenes.py` | les 36 scènes et le bandeau d'état |
| `montage.py` | concaténation des clips de `voix/`, `calage.json`, VTT |
| `render.py` | chronologie calée sur la voix, images, encodage ffmpeg |
| `integrer.py` | installation dans le site (MP4, VTT, durées, hors-ligne) |
| `manifeste.py` | régénération `offline-complete-manifest.json` |

La voix est synthétisée section par section dans `voix/` (`bienvenue.mp3`,
`probleme.mp3`, …), puis `montage.py` ramène chaque clip en PCM 44,1 kHz mono,
insère 1,2 s de silence au début, 0,55 s entre les sections et 1,8 s à la fin :
**c'est la voix qui donne la durée de chaque scène**, l'image suit
(`calage.json`).

## Les figures réutilisables

* `dessin.schema_arbre(box, etape, actif)` — le schéma de décision, révélé
  question par question (`etape` 1 → 3), la branche `actif` allumée.
* `dessin.tableau_boucles(box, actif)` — le tableau des trois boucles ; il
  s'adapte à la largeur de la boîte (colonne du milieu ou pleine largeur).
* `dessin.bandeau_boucles(actif, info)` — le fil rouge du bas.
* `dessin.boite_jetons(cx, cy, n)` — la boîte de jetons, jusqu'à zéro.
* `dessin.immeuble(box, actif, faits, cabine, ouvert)` — l'immeuble et
  l'ascenseur dans une seule boîte ; `cabine` se donne en étages (0 → n-1).
* `dessin.sac(cx, cy, contenu, nom, vide)` — la case mémoire voyageuse.
* `dessin.papier_brouillon(box)` / `dessin.crayon(x, y, texte)` — le papier
  réglé et l'écriture au crayon, caractère par caractère.
* `dessin.stylo_note`, `stylo_cercle`, `stylo_souligne` — les annotations au
  stylo rouge.
