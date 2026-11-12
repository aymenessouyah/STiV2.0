# Capsule SQL — série 7

La seconde version est une création originale construite à partir du scénario fourni : tableaux, croix de couleur accompagnées d'une légende, repères au stylo, requêtes avec résultats et duels en écran partagé. Les médias d'une vidéo externe ne sont pas inclus. La narration est en français ; la musique douce est synthétisée par le script.

## Ancienne version v2 (historique)

Installer Python 3, Pillow et imageio-ffmpeg, puis exécuter `python3 outils/capsule-sql7/render-v2.py`. Les dix prises de narration sont dans `voix-v2/`. Le script produit le MP4 et la piste WebVTT de cette ancienne version ; une piste de sous-titres est également intégrée au MP4. Ces sous-titres ne conviennent pas à la v3. Les repères sont estimés à partir du texte et des pauses détectées dans la voix : leur synchronisation doit être contrôlée manuellement avant une diffusion définitive.

`render.py` et `voix/` conservent les sources de la première version à titre historique.

## Version provisoire v3

`assets/videos/sql-serie7-groupby-having-sous-requetes-v3.mp4` est la version provisoire liée au site, à finaliser. Elle reprend la source historique `assets/videos/GroupBy-Having.mp4` du commit `6d4bb1c` (640 × 360, agrandie en 1920 × 1080), suivie d'une nouvelle séquence narrée. Refaire la maquette avec `python3 outils/capsule-sql7/render-v3.py`, après installation de Pillow et imageio-ffmpeg ; les prises sont dans `voix-v3/` et le commit source doit être disponible dans l'historique Git.

**À finaliser** : contrôler à l'écoute la narration originale et la mention de la devise, corriger le masquage et l'alignement de « Dinars », et réaliser les animations au marqueur et les comparaisons demandées. Les sous-titres ne sont pas encore créés pour cette maquette. L'agrandissement ne rétablit pas les détails absents de la source basse résolution.

## Aperçu v4 — en cours de réalisation

`outils/capsule-sql7/apercu-v4.mp4` conserve le générique et le cours de la v3, puis reprend la séquence finale avec une main au marqueur mobile et une comparaison côte à côte des deux résultats. La comparaison distingue les colonnes différentes des mêmes vendeurs retenus. Cet aperçu n'est pas relié au site.

Pour le recréer : `python3 outils/capsule-sql7/render-v4.py` avec Pillow et imageio-ffmpeg. Le script extrait la vidéo v3 du commit `cfe853de7e0c83d7e0fd4be80919f1f22a20bce3`, puis utilise les neuf prises dans `voix-v3/`. `node --test tests/capsule-sql7-v4-apercu.test.mjs` vérifie les quatre requêtes sur les données du TP.

**À terminer** : la main est un repère mobile, pas une véritable écriture progressive de chaque texte. Le cours original reste en basse résolution agrandie. La devise dans la narration originale n'a pas été vérifiée à l'écoute et le remplacement visuel reste à affiner. La synchronisation et les sous-titres complets restent à réaliser et à vérifier. La v4 ne doit pas être présentée comme terminée.

## Travail v5 — comparaison des missions D et E

`apercu-comparaisons-v5.mp4` est un aperçu autonome, non raccordé au cours : représentation textuelle et données de la base, puis missions 1 à 5 en trois colonnes. Les requêtes sont extraites du corrigé HTML et leurs résultats sont exécutés sur `boutique.sql` par `preparer-v5.py`, qui génère `storyboard-v5.json`. `rendu-comparaisons-v5.py` utilise ce storyboard et les prises dans `voix-v5/` pour produire l'aperçu. Vérifier avec `node --test tests/capsule-sql7-comparaisons-v5.test.mjs`.

`apercu-complet-v5.mp4` est un montage de travail de 22 min 06 : il conserve la voix originale du cours, masque la mention « Vidéo 8 - Formation », corrige visuellement la ligne HAVING et emploie la même nouvelle voix pour la suite. Il place la représentation de la base avant la suite et les missions avant « À retenir ». Des repères visuels distinguent notamment les parties intérieure et extérieure de la sous-requête.

**À vérifier avant remplacement du site** : les coupures audio approximatives autour de 12:40 et 13:21 doivent être contrôlées à l’écoute pour s'assurer qu’elles retirent effectivement « euros » sans couper les explications ; les masquages, les repères et la synchronisation doivent être revus sur toute la durée. Les sous-titres complets restent à créer. Les tables et résultats n'apparaissent pas encore ensemble sur tous les plans de requêtes.

Pour reconstruire l'aperçu complet, exécuter d'abord `python3 outils/capsule-sql7/preparer-v5.py` puis `python3 outils/capsule-sql7/rendu-comparaisons-v5.py`, puis `python3 outils/capsule-sql7/render-v5.py`. Les fichiers intermédiaires `base-v5.mp4` et `missions-v5.mp4` sont générés par le deuxième script.

## Aperçu v6 — corrigé rectifié par l'enseignant

`assets/videos/sql-serie7-groupby-having-sous-requetes-v6.mp4` adapte le montage v5 aux deux PDF fournis dans `references-v6/`. La nouvelle partie traite les sous-requêtes **non corrélées dans WHERE** : E1 (CA > 700), E2 (au moins trois catégories), E3 (prix ≥ 40 et CA > 500), E4 (prix supérieur à la moyenne), NOT IN et MAX. Les exemples antérieurs de sous-requête corrélée dans SELECT et de table dérivée dans FROM ne sont pas repris. Pour les missions 1 et 2, le corrigé ne propose pas de solution par sous-requête. Les résultats sont exécutés sur `boutique.sql`, y compris la distinction entre les noms seuls et les noms accompagnés du CA.

Pour reconstruire : installer `pypdf`, `Pillow` et `imageio-ffmpeg`, puis exécuter `preparer-v6.py`, `rendu-comparaisons-v6.py` et `render-v6.py` dans cet ordre. Les sorties temporaires `base-v6.mp4` et `missions-v6.mp4` sont produites par le second script. Vérification : `node --test tests/capsule-sql7-corrige-v6.test.mjs`.

Cette version provisoire et les PDF rectifiés sont liés au site. La première partie est reprise de l'aperçu v5 : les coupures audio vers 12:40 et 13:21 restent à contrôler à l'écoute, les sous-titres complets et l'affichage simultané des tables et résultats sur tous les plans restent à finaliser.

## Montage v7 — quatre extraits insérés

`assets/videos/sql-serie7-groupby-having-sous-requetes-v7.mp4` conserve la v6 avant et après 13:34 et insère à ce point, dans l’ordre, `sous_req1.mp4`, `sous_req2.mp4`, `sous_req3.mp4` et `sous_req4.mp4`. Ces quatre sources provenaient du commit `5d396e5` et ont été retirées du dépôt courant après montage. Pour reconstruire la v7, il faut les récupérer depuis cet historique ou fournir de nouveau les fichiers ; le script vérifie leur présence. Les repères du lecteur sont répartis autour des insertions et de la suite décalée. La vidéo est réencodée en 1080p H.264/AAC.

La v6 reste disponible comme source. Les réserves de la v6 sur les coupures audio et les sous-titres restent valables ; les extraits ajoutés n'ont pas été revus intégralement sur le fond pédagogique.

## Montage v8 — transition avant la partie 8

La v8 conserve la v7 et déplace son passage de 13:31 à 13:33 au début de la partie 8. Le reste de 13:33 à 13:34 reste avant les extraits, conformément aux bornes demandées. Un écran noir de 0,5 seconde suit la partie 7 ; après l’extrait 4, un second écran noir de 0,5 seconde précède le titre « Group by vs Sous_requête » affiché 3 secondes, puis le passage déplacé et la suite. Reproduction avec `sh outils/capsule-sql7/montage-v8.sh` et FFmpeg ; les deux pistes sont découpées ensemble. Les réserves audio et sous-titres des versions précédentes restent valables.

## Montage v9

À partir de la v8, `masquer-intro-v9.sh` remplace 13:30–13:32 par deux secondes de noir et de silence, et masque le bandeau « Vidéo 21 - Formation » de la carte d’introduction du premier extrait. Les repères restent inchangés.
