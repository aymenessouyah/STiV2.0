# Recharge Véhicule électrique — les pages PHP (vidéo)

Capsule PHP du sujet « Recharge Véhicule électrique » (Similaire Bac Pratique,
Lycée Rafèha, 4ᵉ SI). Elle reprend la formule de la capsule Bibliothèque
« correction de liste.php », mais elle traverse les **quatre fichiers PHP**
du corrigé ChargeTN au lieu d'une seule page.

* **à gauche la méthode** — les gestes et les pièges, dans l'ordre ;
* **à droite le code du corrigé** — révélé ligne par ligne, avec ce que la
  page affiche.

## La trame : dix sections, une voix

| # | Section | Ce qui est dit | Ce qui est montré |
| --- | --- | --- | --- |
| 1 | `ouverture` | le trajet complet des données, les trois temps d'une page PHP | les quatre fichiers et leur rôle |
| 2 | `connexion` | le fuseau `Africa/Tunis`, `mysqli_connect`, `SET NAMES utf8mb4` | les 5 lignes de `connexion.php` |
| 3 | `ajout_controles` | `isset($_POST['ok'])`, `(int)`, `checkdate`, futur et `kwh` refusés | le traitement POST d'`ajout.php` |
| 4 | `ajout_insertion` | l'`INSERT`, `mysqli_affected_rows`, le `<select>` fabriqué par SQL | la requête et la boucle des options |
| 5 | `liste_filtres` | les liens `liste.php?type=N`, la jointure, le filtre conditionnel | la requête principale de `liste.php` |
| 6 | `liste_tableau` | une ligne SQL devient une ligne HTML ; on range les puissances | la boucle du tableau et le lien `detail.php?id=…` |
| 7 | `liste_statistiques` | max, min, moyenne ; `GROUP BY` ; la date en lettres | le tableau indexé, le tableau associatif, `date("w")` |
| 8 | `detail_borne` | `$_GET['id']`, `mysqli_num_rows`, `mysqli_fetch_array` par nom | la fiche d'une borne |
| 9 | `detail_recharges` | `ORDER BY daterec DESC`, l'ancienneté en jours, le montant | l'historique et `floor((time() - strtotime(...)) / 86400)` |
| 10 | `bilan` | GET/POST, le transtypage, les deux `fetch`, les deux compteurs | les cinq gestes à emporter |

Les très longues chaînes du corrigé (la requête `INSERT`, les `SELECT`
jointifs) sont présentées en concaténations successives : la requête
construite et le HTML produit sont strictement les mêmes.

## La chaîne de fabrication

```
narration.py   les dix textes (≤ 1500 caractères par section, la limite d'un clip)
    ↓  generate_speech → voix/<section>.mp3          (même voix que la capsule Bibliothèque)
montage.py     voix-off.wav + calage.json + sous-titres.vtt
    ↓
scenes.py      une scène par section, dessinées par dessin.py
render.py      capsule-recharge-php.mp4 (1920×1080, 30 i/s, H.264 + AAC mono)
    ↓
integrer.py    assets/videos/capsule-correction-recharge-php-v706.mp4
               assets/subtitles/RechargePhp-fr-v706.vtt
               + chapitres de protection.js, durée de la carte
```

Commandes :

```bash
python3 outils/rechargephp/montage.py
python3 outils/rechargephp/render.py --durees outils/rechargephp/calage.json --plan
python3 outils/rechargephp/render.py --durees outils/rechargephp/calage.json --images /tmp/f
python3 outils/rechargephp/render.py --durees outils/rechargephp/calage.json \
        --audio outils/rechargephp/voix-off.wav \
        --sortie outils/rechargephp/capsule-recharge-php.mp4
python3 outils/rechargephp/integrer.py
```

## Les conventions

* **La version est dans le nom des fichiers** : le service worker sert `.mp4`
  et `.vtt` en « cache d'abord ». Changer `VERSION_MEDIA` dans `integrer.py`
  à chaque refonte, sinon les appareils gardent l'ancienne vidéo.
* **La voix est française** : les symboles se lisent (« dollar » pour `$`,
  « crochet » pour `[`, « point d'interrogation » pour `?`).
* **Tout « mysqli » se prononce en anglais** (consigne de l'enseignant) :
  `narration.texte_parle()` transcrit les fonctions pour la voix française
  (« maïe sikouèle aïe kouiri » pour `mysqli_query`, « fètche rô » pour
  `fetch_row`…), tandis que les sous-titres gardent le nom exact du code.
* **Le corrigé fait foi** : le filtre de `liste.php` colle `$_GET['type']`
  sans transtypage, et `detail.php` reçoit `$_GET['id']` sans contrôle ; la
  capsule le montre tel quel, puis rappelle le réflexe sûr — `(int)` quand
  un nombre est attendu — dans le bilan.
