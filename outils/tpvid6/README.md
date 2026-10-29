# TP Train — Série 6 : moteur de la vidéo de correction

Générateur de `assets/videos/tp-train-serie6.mp4` : la correction détaillée du
TP Train JavaScript (Série 6), du diagramme jusqu'au code.

## Le parti pris d'affichage

L'écran est découpé en **deux lignes**, comme demandé :

1. **ligne 1 (haute de 242 px)** : l'énoncé de la partie — chapeau, titre,
   rappel des fonctions utilisées ;
2. **ligne 2 (haute de 620 px, plus haute que la ligne 1)** : la zone de travail.
   Le **diagramme occupe d'abord toute la largeur** et se construit nœud par
   nœud ; une fois terminé, il **se replie à gauche** et laisse la place à la
   **colonne de code** qui s'écrit à droite, ligne par ligne.

Pendant la frappe, chaque fonction atteinte **allume son nœud** dans le
diagramme : le code reste ainsi fidèle au diagramme, étape par étape.

Le thème reprend celui des capsules CSS3 existantes : fond nuit `#0d1424`,
panneaux arrondis `#131c2e`, titres ambre double-soulignés, pastilles d'étapes
(active en dégradé orange), cartouche de code avec numéros de ligne et ligne
active surlignée en rouge sombre.

## Les six chapitres

| # | Chapitre | Diagramme | Code tapé |
|---|----------|-----------|-----------|
| 1 | Outils communs | 5 nœuds | `lire()`, `ecrire()`, `colorer()` |
| 2 | Identité | 9 nœuds | `demanderNom()`, `emailValide()`, `identite()` |
| 3 | Voyage et dates | 10 nœuds | `typeChoisi()`, `typeVoyage()`, `voyage()` |
| 4 | Prix du billet | 10 nœuds | `prix()` |
| 5 | Captcha | 10 nœuds | `nouveauCode()`, `verifierCaptcha()`, `aide()` |
| 6 | Validation et envoi | 9 nœuds | `verif()`, `reserver()`, `positionnerTrain()`, `deplacerTrain()` |

Le code affiché est celui du corrigé officiel
(`exercices/javascript/TP Train/TP_Train_JavaScript_cORRECTION.html`),
reformaté pour tenir dans la colonne (`contenu.py`) : mêmes noms de fonctions,
mêmes algorithmes.

## Pré-requis

    pip install --break-system-packages pillow          # PIL
    npm install --no-save @ffmpeg-installer/ffmpeg      # ffmpeg local

## Intégration au site

    cd outils/tpvid6
    python3 montage.py            # voix off → voix-off.mp3, calage.json, VTT
    python3 render.py --durees calage.json --sortie sortie_tp6.mp4 --audio voix-off.mp3
    python3 integrer.py           # copie MP4 + VTT, met à jour les durées affichées

La capsule est ensuite proposée :

- dans l'onglet **Vidéos** de `cours/javascript.html` (carte dédiée + sous-titres) ;
- sur la carte de la **Série 6** du cours (bouton « 🎥 Vidéo de correction ») ;
- en 4ᵉ carte de la page d'accueil du TP (`exercices/javascript/TP Train/index.html`) ;
- au **catalogue de l'accueil** (`assets/js/app.js`) et dans le **lecteur partagé**
  (`assets/js/protection.js`, huit repères de chapitres).

## Rendu

    cd outils/tpvid6
    python3 render.py --plan                            # chronologie seule
    python3 render.py --durees durees.json --images /tmp/f --instants 20,40,60
    python3 render.py --durees durees.json --sortie sortie_tp6.mp4
    python3 render.py --durees durees.json --sortie apercu.mp4 --fin 69 --audio extrait.mp3

Durée : 7 min 08. Format : 1920×1080, 30 images par seconde, H.264 + AAC mono 44,1 kHz.
Vitesse mesurée ≈ 21 ms/image, soit ~5 min pour les 7 minutes de la capsule.

`--debut` / `--fin` permettent de ne rendre qu'un extrait ; `--audio` muxe une
piste sonore.

## Voix off et sous-titres

Les voix françaises sont dans `voix/` (une section par fichier :
`01-intro` … `08-outro`, `05a`/`05b` pour la partie prix, découpée en deux).
`montage.py` concatène les sections (0,7 s de silence entre chacune), mesure la
durée réelle de chaque section, écrit `durees.json` et génère
`tp-train-serie6.vtt`.

    python3 montage.py

`durees.json` est ensuite passé à `render.py` : **chaque partie est étirée ou
resserrée** pour que l'image et la voix restent synchronisées à la seconde.

## Structure

    theme.py       palette, polices, primitives de dessin
    contenu.py     énoncés, diagrammes, code des six chapitres
    dessin.py      composants : en-tête, pastilles, énoncé, nœuds, éditeur
    render.py      chronologie + rendu des images + encodage ffmpeg
    narration.py   texte de la voix off et découpage des sous-titres
    montage.py     concaténation audio, durées, VTT

## Extraits

`apercu-extrait.mp4` (1 min 09) : le carton d'ouverture, la démonstration
animée du principe « deux lignes, deux temps », puis la première partie
complète (outils communs) avec la voix off.
