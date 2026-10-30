# La boucle Pour — de la variable à la boucle (vidéo)

Capsule JavaScript de la Série 6. Le décor est un **immeuble de quatre étages**
(4 · 7 · 2 · 9) ; le récit fait le tour de deux idées difficiles avant de donner
la boucle :

1. **la variable** — un sac vide, un nom fixe, un contenu qu'on remplace ;
2. **pourquoi la boucle** — sans boucle il faut écrire une ligne par étage.

| Étape | Ce que raconte la voix off | Ce qu'on voit |
| --- | --- | --- |
| 1 | le problème : « quatre étages », « quatre, sept, deux, neuf », « c'est un tableau », « je l'appelle T », « la somme dans S », `S = T[0]+T[1]+T[2]+T[3]`, « comment je vais m'y prendre ? » | l'immeuble se dresse, la carte du tableau se remplit case par case, le bandeau du bas affiche `S = …` |
| 2 | « une case mémoire », « un sac, si vous voulez », « une boîte, avec un nom, et une valeur dedans », « le nom reste, la valeur bouge » | le sac passe de vide à 4 puis 7, la figure **une variable** montre le nom, la valeur et la trace « avant : vide · 4 » |
| 3 | « beaucoup de sacs », « si je dis le sac, personne ne sait », « une étiquette », « il s'appelle S » | trois sacs légendés, la question « lequel ? », l'étiquette `S` qui vient se poser et la flèche qui désigne le bon sac |
| 4 | « S, je peux le lire », « S, je peux aussi l'écrire », « S égal S plus quelque chose », « le S de droite, c'est l'ancienne valeur » | la formule `S = S + quelque chose` avec les deux étiquettes *nouvelle* / *ancienne*, et les trois gestes numérotés **lire · ajouter · écrire** |
| 5 | « il reste à monter », « à chaque étage, qu'est-ce que je fais ? », « toujours la même chose » | l'immeuble **avec sa cage d'ascenseur** ; la cabine au rez-de-chaussée, la porte qui s'ouvre, les trois gestes |
| 6 | « étage zéro », « T crochet zéro contient quatre », « S égal S plus T crochet zéro » | la porte s'ouvre, la carte `4` glisse de l'étage jusqu'au sac, `S = 4` |
| 7 | « étage un, sept », « étage deux, deux », « étage trois, neuf », « quatre fois la même ligne » | l'ascenseur monte, le sac se remplit, les quatre lignes s'écrivent l'une après l'autre |
| 8 | « un immeuble de cent étages », « cent lignes », « recopier, ce n'est pas programmer » | le papier qui se remplit (4, 10 puis **100 lignes**), l'immeuble qui grandit, la croix rouge, puis « 1 ligne, répétée n fois » |
| 9 | « prendre la valeur de l'étage », « une seule chose change : le numéro », « c'est son compteur » | le bloc entre accolades, `S = S + T[compteur]`, les quatre indices dont un seul est allumé |
| 10 | « Pour compteur de zéro à n moins un, faire », « le départ », « la condition », « le pas », « dans le sac : vingt-deux » | l'anneau de la boucle avec son curseur, le bloc, les trois réglages coloriés, `S = 22` |

## Mise en page

À gauche **l'histoire** (l'immeuble et son ascenseur intégré, le sac), à droite
**ce que j'écris** (le cahier qui se tape caractère par caractère), et en bas le
**fil rouge** : le tableau `T` en cases (la case courante en ambre, les
ramassées en vert), le compteur d'étage et la variable `S` qui grandit
(0 → 4 → 11 → 13 → 22). Le titre reste le même dans toutes les scènes : c'est
l'objet du récit, seul le sous-titre change.

1920 × 1080, 30 i/s, H.264 + AAC mono.

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
| `narration.py` | texte de la voix off (10 sections) et sous-titres |
| `theme.py` | accès au thème commun (`outils/tpvid6/theme.py`, chargé par chemin) |
| `dessin.py` | primitives : immeuble + cage d'ascenseur, sac, boîte mémoire, pile de lignes, schéma de boucle, cahier |
| `scenes.py` | les 10 scènes et le bandeau d'état |
| `montage.py` | concaténation des clips de `voix/`, `calage.json`, VTT |
| `render.py` | chronologie calée sur la voix, images, encodage ffmpeg |
| `integrer.py` | installation dans le site (MP4, VTT, durées, hors-ligne) |
| `manifeste.py` | régénération de `offline-complete-manifest.json` |

La voix est synthétisée section par section dans `voix/` (`probleme.mp3`,
`variable.mp3`, `nom.mp3`, …), puis `montage.py` ramène chaque clip en PCM
44,1 kHz mono, insère 1,2 s de silence au début, 0,55 s entre les sections et
1,8 s à la fin : **c'est la voix qui donne la durée de chaque scène**, l'image
suit (`calage.json`).

## Les figures réutilisables

* `dessin.immeuble(box, actif, faits, cabine, ouvert, ramassage)` — l'immeuble
  et l'ascenseur dans une seule boîte ; `cabine` se donne en étages (0 → n-1).
* `dessin.boite_memoire(box, nom, valeur, historique)` — la variable : le nom,
  la valeur et la trace des valeurs précédentes.
* `dessin.pile_lignes(box, n, depasse)` — les lignes de code, une par étage ;
  au-delà de ce qui tient, la pile déborde et la croix rouge tombe.
* `dessin.boucle_schema(box, n, compteur)` — l'anneau, le bloc et les trois
  réglages (départ, condition, pas).
