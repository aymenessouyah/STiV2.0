# Systèmes, technologies et Internet — la vidéo du cours (3ᵉ SI)

**Ce n'est pas une capsule.** C'est le cours de la partie 1 du manuel (pages 5 à
13, 3ᵉ année SI), expliqué de bout en bout : les systèmes d'exploitation, les
réseaux informatiques, l'Internet des objets. Même thème visuel, même voix,
mêmes sous-titres et mêmes chapitres que les capsules — mais un contenu de
cours, sans énoncé ni correction.

* **à gauche** — les définitions et les schémas : la pile de la machine, le
  réseau du lycée, les cartes des notions ;
* **à droite** — les tableaux du manuel et les exemples chiffrés ;
* **en bas** — la phrase à recopier dans le cahier.

Les exemples sont ceux du livre, une seule fois chacun : `192.168.1.20` avec le
masque `255.255.255.0` donne le réseau `192.168.1.0` ; la MAC
`A4-B1-C1-2D-3E-4F` ; le sujet MQTT `maison/salon/temperature` ; la mesure de
25 °C qui va du capteur au téléphone.

## La trame : dix sections, une voix

| # | Section | Ce qui est dit | Ce qui est montré |
| --- | --- | --- | --- |
| 1 | `ouverture` | le cours, les trois chapitres, le manuel p. 5–13 | les trois cartes, les objectifs |
| 2 | `systeme` | définition, les six rôles | la pile utilisateur → matériel, le tableau des rôles |
| 3 | `systeme_types` | PC, mobiles, embarqués, propriétaire / libre | les trois familles, le tableau des licences |
| 4 | `systeme_deployer` | installer, configurer, mettre à jour, VM, sécurité | les trois temps, la chaîne de virtualisation, quatre moyens |
| 5 | `reseau_definition` | définition, LAN / MAN / WAN, équipements | le schéma du réseau, les deux tableaux |
| 6 | `reseau_parametres` | IP, masque, DNS, MAC | les quatre octets et le masque, le calcul du réseau |
| 7 | `reseau_architectures` | client / serveur, poste à poste, protocoles, ACL | les deux schémas, le tableau des protocoles |
| 8 | `iot_principe` | définition, cinq composants, trajet d'une mesure | les composants, la chaîne capteur → téléphone |
| 9 | `iot_echange` | MQTT, HTTP, tester, la serre intelligente | publisher → broker → subscriber, le tableau des pannes |
| 10 | `synthese` | la fiche de synthèse, l'idée clé | le tableau des onze notions, les trois idées |

## La chaîne de fabrication

```
narration.py   les dix textes (≤ 1500 caractères par section, la limite d'un clip)
    ↓  generate_speech → voix/<section>.mp3
montage.py     voix-off.wav + calage.json + sous-titres.vtt
    ↓
scenes.py      une scène par section, dessinées par dessin.py (carte, table, chaine, pile)
render.py      sortie_courssti.mp4 (1920×1080, 30 i/s, H.264 + AAC mono)
    ↓
integrer.py    assets/videos/CoursSystemesInternet-v577.mp4
               assets/subtitles/CoursSystemesInternet-fr-v577.vtt
               + chapitres de protection.js, durée du cours
```

Commandes :

```bash
python3 outils/courssti/narration.py --dit systeme     # ce que la voix prononce
python3 outils/courssti/montage.py                     # après les clips
python3 outils/courssti/render.py --plan               # chronologie prévisionnelle
python3 outils/courssti/render.py --images /tmp/f --instants 60,300,700
python3 outils/courssti/render.py --durees outils/courssti/calage.json \
        --audio outils/courssti/voix-off.wav \
        --sortie outils/courssti/sortie_courssti.mp4
python3 outils/courssti/integrer.py                    # copie + chapitres + durée
```

`render.py` et `montage.py` cherchent `ffmpeg` dans
`node_modules/@ffmpeg-installer/linux-x64/ffmpeg` (comme les capsules), puis
dans le `PATH` ; `montage.py` n'a besoin que du binaire.

## Les conventions

* **La version est dans le nom des fichiers** : le service worker sert `.mp4` et
  `.vtt` en « cache d'abord » et ne les revalide jamais. Changer `VERSION_MEDIA`
  dans `integrer.py` à chaque refonte, sinon le téléphone garde l'ancienne vidéo.
* **Deux colonnes, jamais mélangées** : `GAUCHE = (64, 186, 916, 884)` pour les
  définitions, `DROITE = (940, 186, 1856, 884)` pour les tableaux, `BANDE` pour
  la phrase à retenir.
* **L'image suit la voix** : chaque dessin apparaît à `narration.avance()`, la
  fraction de la section où commence le passage qui l'explique. Une phrase
  ajoutée déplace l'image toute seule.
* **`dit()` écrit pour la bouche** : à l'écran et dans les sous-titres,
  `192.168.1.20` et `MQTT` ; dans le clip, « 192 point 168 point 1 point 20 » et
  « M Q T T ». On n'envoie jamais le texte brut à la synthèse.
* **Un cours, pas une capsule** : pas d'énoncé, pas de correction, pas de
  ruban d'octets. Chaque chapitre du livre a sa ou ses sections, et la dernière
  section est la fiche de synthèse du manuel.
