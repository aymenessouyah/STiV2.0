# La boucle Pour — de la variable à la boucle (vidéo)

Capsule JavaScript de la Série 6. Le décor est un **immeuble de quatre étages**
(4 · 7 · 2 · 9) ; le récit fait le tour de deux idées difficiles avant de donner
la boucle : **la variable** (un sac, un nom, un contenu qu'on remplace), puis
**pourquoi la boucle** (quatre lignes, un seul chiffre qui change).

## La trame : trois colonnes, toujours les mêmes

| Colonne | Contenu |
| --- | --- |
| **à gauche** | l'immeuble, son ascenseur, son compteur d'étage |
| **au milieu** | le **brouillon** : papier réglé, écriture au crayon, annotations au **stylo rouge** |
| **à droite** | **l'algo · le code** : ce que j'écris vraiment (algorithme puis JavaScript) |

Le travail commence au brouillon. L'algorithme n'apparaît qu'au moment où le
chiffre entre crochets devient `quelque chose` (étape 8) ; on revient alors au
brouillon, stylo rouge en main, pour y écrire « compteur » et encercler les
chiffres (étape 9), avant la question principale (étape 10) et la boucle (11).

| Étape | Ce que raconte la voix off | Ce qu'on voit |
| --- | --- | --- |
| 1 | le plan de travail, l'immeuble, `T = [4, 7, 2, 9]`, « la somme dans S », « comment je vais m'y prendre ? » | les trois colonnes se posent ; le brouillon reçoit les quatre valeurs, `T = [4, 7, 2, 9]` et `S = ?` |
| 2 | « une case mémoire », « une boîte, avec un nom, et une valeur dedans », « le nom reste, la valeur bouge » | le sac passe de vide à 4 puis 7 ; le brouillon garde la trace des essais |
| 3 | « beaucoup de sacs », « si je dis le sac, personne ne sait », « une étiquette », « il s'appelle S » | les quatre sacs au brouillon, puis l'étiquette `S` et la boîte mémoire nommée |
| 4 | « S, je peux le lire », « S, je peux aussi l'écrire », « S égal S plus quelque chose » | la formule aux **deux S colorés** (nouvelle / ancienne valeur), les trois gestes **lire · ajouter · écrire**, le sac qui passe à 11 |
| 5 | « il reste à monter », « à chaque étage, qu'est-ce que je fais ? », « toujours la même chose » | l'ascenseur, la porte qui s'ouvre, les trois gestes recopiés au brouillon ; la colonne de droite reste vide : « l'algo, plus tard » |
| 6 | « étage zéro », « T crochet zéro contient quatre », « S égal S plus T crochet zéro » | la carte `4` glisse jusqu'au sac, le brouillon écrit `S = S + T[0]` puis `S = 4` |
| 7 | « étage un, sept », « étage deux, deux », « étage trois, neuf », « quatre fois la même ligne » | l'ascenseur monte, le sac se remplit, les quatre lignes s'écrivent avec leurs totaux |
| 8 | « je n'écris plus de chiffre : j'écris quelque chose », « en JavaScript, S = S + T[i] » | les quatre chiffres entre crochets s'allument ; **on passe à droite** : `S = S + T[quelque chose]`, puis `S = S + T[i];` |
| 9 | « revenons au brouillon, cette fois avec le stylo rouge », « qui la fait monter ? le compteur » | **retour au brouillon** : cercles rouges sur `0` et `1`, le mot « compteur » au stylo rouge, et le cercle sur `T[quelque chose]` côté algo |
| 10 | « ce qui est entre crochets est changeable, exactement comme le pas du compteur », « est-ce que je connais le nombre de répétitions ? » | « donc : une boucle et un compteur », la question **combien de répétitions ?**, « je dois compléter la fin » |
| 11 | « je prends mon algorithme et je l'entoure », « Pour compteur de zéro à n moins un », « pourquoi j'écris compteur dans les crochets ? » | la ligne seule devient un **bloc enveloppé**, les quatre tours avec leur valeur, `S = 22` |

## Mise en page

Trois colonnes fixes : `l'immeuble` (64 → 644), `le brouillon` (670 → 1250),
`l'algo · le code` (1276 → 1856) ; en bas le **fil rouge** : le tableau `T` en
cases, le compteur d'étage et la variable `S` qui grandit
(0 → 4 → 11 → 13 → 22). Le titre reste le même dans toutes les scènes, seul le
sous-titre change, et le décompte affiche « ÉTAPE n / 11 ».

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
| `narration.py` | texte de la voix off (11 sections) et sous-titres |
| `theme.py` | accès au thème commun (`outils/tpvid6/theme.py`, chargé par chemin) |
| `dessin.py` | primitives : les trois colonnes, l'immeuble + cage, le sac, la boîte mémoire, le **papier du brouillon**, le **crayon** et le **stylo rouge** |
| `scenes.py` | les 11 scènes et le bandeau d'état |
| `montage.py` | concaténation des clips de `voix/`, `calage.json`, VTT |
| `render.py` | chronologie calée sur la voix, images, encodage ffmpeg |
| `integrer.py` | installation dans le site (MP4, VTT, durées, hors-ligne) |
| `manifeste.py` | régénération `offline-complete-manifest.json` |

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
* `dessin.sac(cx, cy, contenu, nom)` — la case mémoire voyageuse.
* `dessin.papier_brouillon(box)` — le papier réglé et sa marge rouge.
* `dessin.crayon(x, y, texte)` / `crayon_centre` — l'écriture au crayon,
  caractère par caractère.
* `dessin.stylo_note`, `stylo_cercle`, `stylo_souligne`, `stylo_fleche` — les
  annotations au stylo rouge (le mot « compteur », les cercles sur les chiffres).
