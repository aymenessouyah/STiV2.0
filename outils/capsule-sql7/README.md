# Capsule SQL — série 7

La seconde version est une création originale construite à partir du scénario fourni : tableaux, croix de couleur accompagnées d'une légende, repères au stylo, requêtes avec résultats et duels en écran partagé. Les médias d'une vidéo externe ne sont pas inclus. La narration est en français ; la musique douce est synthétisée par le script.

## Refaire la vidéo

Installer Python 3, Pillow et imageio-ffmpeg, puis exécuter `python3 outils/capsule-sql7/render-v2.py`. Les dix prises de narration sont dans `voix-v2/`. Le script produit le MP4 et la piste WebVTT utilisée par le cours ; une piste de sous-titres est également intégrée au MP4. Les repères sont estimés à partir du texte et des pauses détectées dans la voix : leur synchronisation doit être contrôlée manuellement avant une diffusion définitive.

`render.py` et `voix/` conservent les sources de la première version à titre historique ; seul le nouveau fichier vidéo est lié au site et au paquet hors ligne.

## Aperçu de travail v3 — non publié

`apercu-serie7-v3.mp4` est une maquette, pas le remplacement de la capsule liée au site. Elle reprend la source historique `assets/videos/GroupBy-Having.mp4` du commit `6d4bb1c` (640 × 360, agrandie en 1920 × 1080), suivie d'une nouvelle séquence narrée. Refaire la maquette avec `python3 outils/capsule-sql7/render-v3.py`, après installation de Pillow et imageio-ffmpeg ; les prises sont dans `voix-v3/` et le commit source doit être disponible dans l'historique Git.

**Avant publication** : contrôler à l'écoute la narration originale et la mention de la devise, corriger le masquage et l'alignement de « Dinars », et réaliser les animations au marqueur et les comparaisons demandées. Les sous-titres ne sont pas encore créés pour cette maquette. L'agrandissement ne rétablit pas les détails absents de la source basse résolution.
