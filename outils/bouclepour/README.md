# La boucle Pour — le sac et l'ascenseur (vidéo)

Capsule JavaScript de la Série 6 : la **boucle Pour** racontée avec un sac, un
immeuble et un ascenseur, exactement dans l'ordre du récit dicté par l'auteur.

| Étape | Ce que raconte la voix off | Ce qu'on voit |
| --- | --- | --- |
| 1 | « comme j'ai besoin de ramasser, je prends un sac » ; il est **vide** ; son contenu est **changeable** → une variable | le sac se dessine, la mention « contenu : rien », puis `T[0]` → `T[1]` → `T[2]` ; pastille « VARIABLE » et schéma *une boîte · un nom · une valeur* |
| 2 | plusieurs sacs, « trois contenus différents », « « le sac »… lequel ? », l'étiquette, « je le nomme **S** » | trois sacs légendés (`étage 0`, `étage 1`, `client`) avec une plaque `?`, la question « lequel ? », l'étiquette `S` qui vient se poser, puis « quand j'écris S, c'est ce sac-là » |
| 4 | « oh c'est un immeuble donc je dois utiliser l'ascenseur » | immeuble 4 étages, bulles « Que dois-je faire ? » |
| 5 | ascenseur, étage 0, porte ouverte ⇒ « `S = S + T[0]` » | ramassage animé du jeton, ligne validée + coche |
| 6 | « c'est moi qui avance ou c'est l'ascenseur ? » ⇒ **compteur** | la cage monte, l'écran compte `0 → 1` |
| 7 | « je répète la même opération » à l'étage 1 | `S = S + T[1]`, souligné |
| 8 | 1re fois `T[0]`, maintenant `T[1]` | les deux essais côte à côte |
| 9 | le « quelque chose » qui change, **c'est le compteur** | `S = S + T[compteur]`, flèche compteur → indice |
| 10 | « j'écris le bloc » | le corps entre accolades, seul |
| 11 | combien de fois ? un arrêt avant la fin ? | `Pour compteur de 0 à n-1 faire … Fin Pour` + `for` |

## Mise en page

À gauche **l'histoire** (sac `S`, immeuble, ascenseur, compteur), à droite **ce
que j'écris** (le cahier : phrases puis code tapé caractère par caractère), et
en bas le bandeau de rappel permanent `S` · `T[k]` · `compteur`. Les sous-titres
suivent les phrases entières (repliées sur deux lignes au plus, jamais coupées
au milieu d'un mot). La dernière
scène remplace le bandeau par les quatre parties de la boucle : départ,
condition, corps, incrément. 1920 × 1080, 30 i/s, H.264 + AAC mono.

## Chaîne de fabrication

```bash
python3 render.py --plan                                  # chronologie prévisionnelle
python3 render.py --images /tmp/f --instants 40,90,140     # images de contrôle
python3 montage.py                     # voix/ → voix-off.wav + calage.json + VTT
python3 render.py --durees calage.json --audio voix-off.wav --sortie sortie_bouclepour.mp4
python3 integrer.py                    # copie MP4/VTT dans assets/ + durées
python3 integrer.py --verifier         # contrôle hors-ligne
```

| Fichier | Rôle |
| --- | --- |
| `narration.py` | texte de la voix off (9 sections, les 11 étapes dictées) et sous-titres |
| `theme.py` | accès au thème commun (`outils/tpvid6/theme.py`, chargé par chemin) |
| `dessin.py` | primitives : sac, immeuble, ascenseur, compteur, cahier, bulles |
| `scenes.py` | les 9 scènes et le bandeau de rappel |
| `montage.py` | concaténation des clips de `voix/`, `calage.json`, VTT |
| `render.py` | chronologie calée sur la voix, images, encodage ffmpeg |
| `integrer.py` | installation dans le site (MP4, VTT, durées, hors-ligne) |
| `manifeste.py` | régénération de `offline-complete-manifest.json` |

La voix est synthétisée section par section dans `voix/` (`sac.mp3`, `nom.mp3`,
…), puis `montage.py` ramène chaque clip en PCM 44,1 kHz mono, insère 1,2 s de
silence au début, 0,55 s entre les sections et 1,8 s à la fin : **c'est la voix
qui donne la durée de chaque scène**, l'image suit (`calage.json`).
