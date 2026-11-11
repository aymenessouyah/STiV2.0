# Capsule SQL — série 7

La seconde version est une création originale construite à partir du scénario fourni : tableaux, croix de couleur accompagnées d'une légende, repères au stylo, requêtes avec résultats et duels en écran partagé. Les médias d'une vidéo externe ne sont pas inclus. La narration est en français ; la musique douce est synthétisée par le script.

## Refaire la vidéo

Installer Python 3, Pillow et imageio-ffmpeg, puis exécuter `python3 outils/capsule-sql7/render-v2.py`. Les dix prises de narration sont dans `voix-v2/`. Le script produit le MP4 et la piste WebVTT utilisée par le cours ; une piste de sous-titres est également intégrée au MP4. Les repères sont estimés à partir du texte et des pauses détectées dans la voix : leur synchronisation doit être contrôlée manuellement avant une diffusion définitive.

`render.py` et `voix/` conservent les sources de la première version à titre historique ; seul le nouveau fichier vidéo est lié au site et au paquet hors ligne.
