# Capsule SQL — série 7

La capsule est une création originale basée sur le scénario fourni : les médias d'une vidéo externe ne sont pas inclus. Le montage utilise les clips de voix synthétique dans `voix/`, des planches créées avec Pillow, et une piste sonore originale générée par FFmpeg. La narration mêle quelques expressions tunisiennes au français ; la piste WebVTT les traduit en français. Les repères des sous-titres sont estimés par proportion de texte dans chaque prise : une vérification manuelle est recommandée avant une diffusion définitive.

Pour reconstruire : installer Python 3, Pillow et imageio-ffmpeg, puis exécuter `python3 outils/capsule-sql7/render.py`. Le script produit le MP4 avec une piste de sous-titres intégrée et le WebVTT utilisé par le lecteur du cours. Les fondus sont courts ; aucune ressource externe n'est nécessaire à la lecture.
