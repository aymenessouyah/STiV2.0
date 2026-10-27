# Aperçu de la refonte STI V2.0

Ce dossier contient une **prévisualisation visuelle** de la nouvelle interface.
Il ne fait pas partie du site pédagogique : ce sont des captures et deux petits
outils de démonstration.

## 1. Voir l'aperçu

| Ce que vous voulez voir | Où |
| --- | --- |
| Le site réel, navigable | Aperçu en direct d'Arena, **port 8000** (racine du dépôt) |
| La galerie de captures | `<hôte de l'aperçu>/apercu/` |
| **Les 5 cours en direct** | `<hôte de l'aperçu>/apercu/cours/` (portail d'accès) |
| La planche récapulative | [`00-apercu-general.png`](00-apercu-general.png) |
| La planche des cours | [`cours/00-planche-cours.png`](cours/00-planche-cours.png) |

### Accès direct aux cours (sans passer par l'accueil)

Toutes les pages matière sont servies par le même serveur d'aperçu : **aucune
connexion Supabase n'est demandée** puisque `acces.js` est neutralisé en mémoire.

| Matière | Cours | Exercices | Annexes | Vidéos |
| --- | --- | --- | --- | --- |
| 🧱 HTML5 | [`../cours/html5.html#cours`](../cours/html5.html#cours) | [`#exercices`](../cours/html5.html#exercices) | [`#annexes`](../cours/html5.html#annexes) | [`#videos`](../cours/html5.html#videos) |
| 🎨 CSS3 | [`../cours/css3.html#cours`](../cours/css3.html#cours) | [`#exercices`](../cours/css3.html#exercices) | [`#annexes`](../cours/css3.html#annexes) | [`#videos`](../cours/css3.html#videos) |
| ⚡ JavaScript | [`../cours/javascript.html#cours`](../cours/javascript.html#cours) | [`#exercices`](../cours/javascript.html#exercices) | [`#annexes`](../cours/javascript.html#annexes) | [`#videos`](../cours/javascript.html#videos) |
| 🗄️ SQL | [`../cours/sql.html#cours`](../cours/sql.html#cours) | [`#exercices`](../cours/sql.html#exercices) | [`#annexes`](../cours/sql.html#annexes) | [`#videos`](../cours/sql.html#videos) |
| 🐘 PHP | [`../cours/php.html#cours`](../cours/php.html#cours) | [`#exercices`](../cours/php.html#exercices) | [`#annexes`](../cours/php.html#annexes) | [`#videos`](../cours/php.html#videos) |

Ces liens sont **relatifs** : ils fonctionnent depuis l'hôte de prévisualisation
Arena comme depuis `http://127.0.0.1:8000`. Les anciennes pages
`exercices/html5.html` … `exercices/php.html` redirigent vers `#exercices`.

L'aperçu en direct est servi par `tools/serveur-apercu.py`. Ce serveur **ne modifie
aucun fichier du dépôt** : il remplace uniquement *en mémoire*, au moment de la
réponse HTTP, quatre fichiers qui empêcheraient la démonstration sans session
Supabase :

| Fichier servi | Comportement dans l'aperçu | Fichier sur le disque |
| --- | --- | --- |
| `assets/js/acces.js` | commentaire vide (verrou désactivé) | **inchangé**, 927 607 octets |
| `assets/js/protection.js` | commentaire vide | **inchangé** |
| `assets/css/protection.css` | feuille vide | **inchangé** |
| `sw.js` | miniature qui vide les caches et se désinscrit | **inchangé**, 71 046 octets |

Tout le reste est servi tel quel depuis le dépôt. En production, le vrai verrou
d'accès, la protection et le service worker restent donc actifs.

> Au déploiement, pensez à incrémenter la constante `CACHE` de `sw.js` pour
> purger les anciennes feuilles de style mises en cache chez les utilisateurs
> qui ont déjà installé le site.

## 2. Les captures

| Fichier | Vue |
| --- | --- |
| `00-apercu-general.png` | Planche 1600 × 1300 : 7 vues + 2 cartes de synthèse |
| `01-accueil-sombre.png` | Accueil, hero/terminal, statistiques, vidéo à la une — thème sombre |
| `02-videos.png` | Section vidéos : 8 cartes .mp4 et filtres par matière |
| `03-accueil-clair.png` | Même accueil après un clic réel sur le sélecteur de thème clair |
| `04-tableau-de-bord.png` | Tableau de bord avec profil de démonstration (Aymen, 1 note, 1 quiz) |
| `05-cours-html5.png` | Coquille 5 onglets autour du cours HTML5 historique (capture de la première version) ; voir `cours/` pour la version enrichie |
| `06-glossaire.png` | Glossaire FR · EN · AR, 75 termes — thème intermédiaire |
| `07-mobile.png` | Accueil en 390 × 844, navigation basse |

Résolution : 1440 × 900 pour les vues bureau, 390 × 844 pour le mobile.
Navigateur : Chromium 153 headless. **Aucune erreur JavaScript** sur les sept
pages (`pageerror` et `console.error` vides).

### Captures des pages matière (`apercu/cours/`)

| Fichier | Vue |
| --- | --- |
| `cours/index.html` | **Portail d'accès** aux 5 cours : liens directs vers chaque onglet |
| `cours/00-planche-cours.png` | Planche 1600 × 1010 : 6 vues des 5 matières |
| `cours/html5-cours.png` · `html5-exercices.png` · `html5-fenetre.png` | HTML5 : cours, exercices, fenêtre « Agrandir » redimensionnable |
| `cours/css3-cours.png` · `css3-videos.png` | CSS3 : laboratoires, playlist |
| `cours/javascript-cours.png` | JavaScript : cours et récapitulatif |
| `cours/sql-cours.png` | SQL : cours et Guide-Ligne audio |
| `cours/php-videos.png` | PHP : onglet Vidéos et chapitres cliquables |
| `cours/html5-intermediaire-rtl.png` · `html5-mobile.png` | Thème intermédiaire + RTL arabe, mobile 390 × 844 |

Génération : `node tools/captures-cours.mjs` puis `python3 tools/composer-cours.py`.

### Limites connues des captures

- Le navigateur de la sandbox n'a pas accès aux Google Fonts (`fonts.googleapis.com`,
  `fonts.gstatic.com`). Les captures utilisent donc les polices de repli
  (Open Sans / DejaVu). Avec un accès réseau normal, le site affiche Outfit,
  Plus Jakarta Sans et JetBrains Mono comme prévu.
- Une police emoji (Noto Color Emoji) et DejaVu Sans ont été ajoutées au
  navigateur de capture pour que les émojis et l'arabe ne s'affichent pas en
  carrés. Ce réglage concerne **uniquement le navigateur de capture**, pas le site.
- La pastille « Progression : cet appareil seulement » de
  `sync-progressions.js` est masquée dans les captures : elle apparaît parce
  qu'aucune session Supabase n'est ouverte dans l'aperçu.
- Les animations de révélation sont forcées à leur état final pour éviter les
  éléments encore transparents au moment de la capture.

## 3. Régénérer les images

```bash
# 1. serveur d'aperçu (à laisser tourner)
python3 tools/serveur-apercu.py 8000

# 2. navigateur headless (sans Chromium système, dans la sandbox Arena)
npm install --no-save puppeteer-core @sparticuz/chromium
# décompresser les bibliothèques et installer une police emoji + DejaVu
LD_LIBRARY_PATH=/tmp/al2023/lib FONTCONFIG_PATH=/tmp/fonts node tools/captures-apercu.mjs

# 3. planche récapitulative
python3 tools/composer-apercu.py     # nécessite Pillow

# 4. captures des 5 pages matière + leur planche
LD_LIBRARY_PATH=/tmp/al2023/lib FONTCONFIG_PATH=/tmp/fonts node tools/captures-cours.mjs
python3 tools/composer-cours.py
```

Sur une machine disposant déjà de Chrome/Chromium, il suffit de remplacer
`executablePath` dans `tools/captures-apercu.mjs` par le chemin du navigateur
local et de lancer le script sans variables d'environnement.

## 4. Rappel du périmètre de la refonte

- **Seul le design change** : tous les contenus, quiz, outils, exercices et
  chemins de fichiers du site de référence sont conservés.
- Fichiers protégés jamais modifiés : `assets/js/config.js`,
  `assets/js/supabase-umd.js`, `assets/js/acces.js`,
  `assets/js/sync-progressions.js`, `portail.html`, `admin.html`.
- Aucun framework, aucune image externe, aucune URL ni clé Supabase dans le
  code généré ; le backend existant est réutilisé via `window.STI_AUTH`.
- Une seule couche de stockage local : `assets/js/profil.js`, clé
  `sti-profil-abonne`, objet `profilAbonne`.
- Le code complet de chaque fichier créé figure dans
  [`DESIGN-STI-V2.md`](../DESIGN-STI-V2.md).
