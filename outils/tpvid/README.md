# Capsules TP — moteur de rendu

Générateur des vidéos longues des TP :

- `scenes_events.py` → `assets/videos/tp-evenements-liens.mp4`
  (événements, clavier, souris, lecteur vidéo, liens LVHA, arrière-plans)
- `scenes_form.py` → `assets/videos/tp-formulaire-tableau-autre.mp4`
  (formulaire complet, listes, tableaux et murs CSS, figure + vidéo du drapeau)
- `scenes_display.py` → `assets/videos/tp-display-float-position.mp4`
  (display, float, clear, position — chaque boîte se présente avant le CSS)
- `scenes_transitions.py` → `assets/videos/tp-transitions-animations.mp4`
  (transition, @keyframes, menu animé — exercices 1 et 2 du TP CSS3)

## Pré-requis

    pip install --break-system-packages pillow          # PIL
    npm install --no-save @ffmpeg-installer/ffmpeg      # ffmpeg local

## Rendu

    cd outils/tpvid
    python3 build.py apercu scenes_events /tmp/a.mp4 4 14   # 4 scènes de 14 s, sans voix
    python3 build.py scenes_events ../../assets/videos/tp-evenements-liens.mp4
    python3 build.py scenes_form   ../../assets/videos/tp-formulaire-tableau-autre.mp4
    python3 build.py scenes_transitions ../../assets/videos/tp-transitions-animations.mp4

Format : 1280×720, 12 fps, H.264 + AAC mono 44,1 kHz. Vitesse mesurée ≈ 23 ms/frame,
soit ~4 min pour une capsule de 15 min.

## Narrations

Les voix off françaises sont dans `voix/` (`a02…a13`, `b02…b14`, `c02…c11`,
`d02…d10`), générées avec l'outil de synthèse puis concaténées en PCM par
`build.py` (0,7 s de silence entre les scènes). Elles sont ignorées par Git (fichiers générés) mais restent dans
l'espace de travail.

## Structure d'une scène

    dict(cle="nom", ep=2, voix="a09.mp3", type="code", code=CODE_X,
         pages=[dict(debut=0.0, url="evenements.html", widgets=[...], decor=fn)],
         texte="narration…",
         etapes=[dict(f=0.2, x=900, y=210, s="id", clic="id", k=["B"], q="bulle", qc="id")])

Types : `intro`, `code`, `decor`, `lvha`, `fin`. Chaque étape place le curseur
(`f` = fraction de la scène), déclenche un survol (`s`), un clic (`clic`), une
frappe (`k`) et une bulle d'explication (`q` sur la zone `qc`).
