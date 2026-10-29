# Les 37 Défis — Tableau, Aléas & Captchas, Média (vidéo)

Capsule JavaScript de la Série 6 : les **onze défis 26 → 36** de
`exercices/javascript/js-37-defis-tt.html`, répartis en trois familles.

| Famille | Défis | Contenu |
| --- | --- | --- |
| Tableau | 26 · 27 · 28 | créer, accéder, ajouter/retirer des cases |
| Aléas & Captchas | 29 → 35 | `Math.random/floor/ceil`, `String.fromCharCode`, `toString(16)`, mélange de Fisher-Yates |
| Média | 36 | `play()`, `pause()`, `paused` |

Trois fiches de rappel (pleine largeur) s'intercalent : **les tableaux**,
**l'objet Math** (formule de l'entier aléatoire) et **les chaînes**
(`substring` / `substr`, la différence et le piège des bornes).

## Mise en page

À gauche l'énoncé (titre, consigne révélée mot à mot, « à retenir »,
démonstration animée, résultat), à droite le code (gouttière numérotée,
ligne active, frappe caractère par caractère, mémo). 1920 × 1080, 30 i/s.

Les polices du système (DejaVu) ne contiennent pas d'emoji : les valeurs du TP
sont écrites en toutes lettres (« pomme », « banane »…) et les pictogrammes
sont dessinés en vectoriel (`dessin37.icone`, `style.sans_emoji`).

## Chaîne de fabrication

```bash
python3 render37.py --plan                 # chronologie prévisionnelle
python3 render37.py --images /tmp/f --instants 60,150   # images de contrôle
python3 montage.py                         # voix-off.mp3 + calage.json + VTT
python3 render37.py --durees calage.json --sortie sortie_defis37.mp4 --audio voix-off.mp3
python3 integrer.py                        # copie MP4/VTT dans assets/ + durées
python3 integrer.py --verifier             # contrôle hors-ligne
```

| Fichier | Rôle |
| --- | --- |
| `contenu.py` | les 11 défis (consigne, points clés, code, démo, mémo, résultat) |
| `rappels.py` | les trois fiches de rappel |
| `narration37.py` | texte de la voix off (13 sections) et découpage des sous-titres |
| `dessin37.py` | primitives d'affichage et les 11 démonstrations animées |
| `render37.py` | chronologie, images, encodage ffmpeg |
| `montage.py` | concaténation audio, `calage.json`, VTT |
| `integrer.py` | installation dans le site |

La durée d'une séquence est proportionnelle au nombre de caractères de son
texte : l'image reste synchronisée avec la voix off (654,6 s → 10:54,56).
