# 📚 STI By A'e — Le Web de A à Z (Version 2.0 · `STiV2.0.215`)

Plateforme éducative interactive dédiée aux **Sciences et Technologies de l'Informatique (STI — 3ème & 4ème SI)** :
cours complets avec **8 vidéos explicatives (`.mp4`) commentées pas à pas** et **écoute vocale synchronisée avec Guide-Ligne**, leçons animées pas à pas, annexes officielles du Bac Tunisien, studios d'animation SQL et PHP pas à pas, flashcards 3D, bac à sable multi-fichiers en direct, console JavaScript ancrée à droite, écran partagé Énoncé + Code, simulateur SQL hors-ligne, laboratoire Chaînes & ASCII JavaScript, simulateur visuel Form ➔ PHP ➔ SQL, constructeur visuel Tableaux/Formulaires/Flexbox, chasse aux erreurs (débogage Bac STI), examen blanc chronométré `/20`, tableau blanc live, coffre de partage rapide de fichiers TP, boîte de réception et notation des copies TP, sondages QCM Live (mode Kahoot STI), messagerie temps réel avec pièces jointes et SOS Capture, séries d'exercices, TP corrigés, quiz interactifs et épreuves pratiques en **HTML5, CSS3, JavaScript, SQL et PHP / MySQLi**.

> **Auteur** : **Aymen Essouyah** (`By A'e`) — Lycée Rafèha  
> **Version active** : **V2.0 · `STiV2.0.215`** (Application PWA 100 % hors-ligne autonome, Connexion & Navigation allégées avec mise à jour des données personnelles à chaque accès et mise à jour de la plateforme uniquement lors d'une nouvelle version, 8 Vidéos `.mp4` avec filigrane Logo + QR Code et Guide-Ligne synchronisé, Plein écran sans adresse sur PC & Mobile, Console JS & Outils PC Windows, Pack Sécurité Totale & Bouclier Anti-IA)

---

## ✨ 1. Portail d'accès, Inscription, Biométrie & Connexion Allégée (`portail.html`)

- **Identité visuelle unifiée** : thème sombre (`#0d1526` + halo orange + grille de points) avec animation dactylo **`STI`**.
- **Modes d'inscription et de connexion** :
  - **Par e-mail** ou **par téléphone (`+216 `)** avec saisie obligatoire du **Nom** et du **Prénom**, et validation par **code WhatsApp à 6 chiffres** (6 cases OTP individuelles).
  - **Par Badge Laboratoire à 6 caractères (`🪪 Badge Labo`)** : connexion rapide en salle informatique pendant une séance de TP sans exposer le mot de passe personnel.
- **Biométrie & Code de sécurité intelligents (Android, iPhone & PC)** :
  - Vérification demandée **uniquement lors de la 1re ouverture et à chaque nouvelle ouverture de l'application**, sans jamais interrompre la navigation interne entre les pages de cours, d'exercices ou de quiz.
- **Mise à jour des données personnelles à l'accès & Mise à jour allégée de la plateforme (`STiV2.0.215`)** :
  - **Données personnelles toujours à jour** : chaque accès du candidat met immédiatement à jour ses données personnelles (Nom, Prénom, Lycée, Classe, Statut, privilège 👑 Gold, durée d'étude hebdomadaire et scores de quiz).
  - **Mise à jour de la plateforme uniquement en cas de nouvelle version** : le téléchargement et le rafraîchissement des caches de la plateforme ne se déclenchent **que s'il existe une nouvelle version publiée** (ou sur demande via le bouton **`📲 Hors-ligne`** de la roue `⚙️`), ce qui allège considérablement la connexion et rend la navigation entre les pages instantanée (`0 ms`).
- **Protection Anti-Brute-Force** : verrouillage temporaire automatique de 2 minutes après 5 tentatives de connexion infructueuses avec alerte temps réel envoyée au professeur.
- **Session permanente « Labo » (`elevelabo3`)** : maintien automatique de la session sur les postes du laboratoire avec accès à tous les cours et bouton `🚪 Déconnexion`, **sans aucun accès à `admin.html`**.
- **Profil Enseignant (`Prof`) & Restriction automatique par niveau (`3ème SI` vs `4ème SI`)** :
  - Les ressources **PHP / MySQLi**, l'**Atelier Bac Pratique** et le **Projet STI 0** (`projetsti0.pdf` et `ressources-projet-sti0.zip`) sont automatiquement masqués et verrouillés dès `0 ms` pour toutes les classes autres que **`4SI` (`4SI1` à `4SI5`)**, **`Prof`**, **`elevelabo3`** et l'**Administrateur**.

---

## 🎥 2. Vidéos Explicatives (`.mp4`), Écoute Vocale Synchronisée (`.mp3`) & Guide-Ligne

- **8 Vidéos explicatives (`.mp4`) commentées pas à pas avec voix masculine** :
  - **5 vidéos de cours complets** : **HTML5** (`html5-cours.mp4`), **CSS3** (`css3-cours.mp4`), **JavaScript** (`javascript-cours.mp4`), **SQL** (`sql-cours.mp4`) et **PHP** (`php-cours.mp4` présentant la définition, l'architecture client-serveur, la syntaxe, les types, les variables puis tous les exemples détaillés de `PHP-recap.html`).
  - **2 vidéos CSS pas à pas** : **Positionnement animé** (`css-positionnement.mp4` avec `position` dans un grand cadre rouge et « La phrase à retenir » à l'étape `4.0 · Position`) et **Décoration animée** (`css-animee.mp4`).
  - **1 vidéo de l'animation du Guichet PHP + MySQLi** (`php-guichet.mp4` synchronisée sur `INSERT`, `UPDATE` et `SELECT`).
- **Habillage visuel unifié des vidéos & Écran de fin interactif** :
  - **Filigrane en haut à droite** incrusté sur toutes les vidéos (cours, CSS pas à pas et Guichet) regroupant le **Logo officiel (`STI_by_AE.ico`), `STI by AE V2.0` et le QR Code** sans gêner le contenu.
  - **Grand titre de la partie (`I. ...`, `II. ...`)** affiché en haut à gauche et **Guide Rectangle + Guide-Ligne** suivant en temps réel la ligne expliquée.
  - **Introduction & Écran de fin** : chaque vidéo débute par *« Bienvenue dans STI V2.0 By AE »* et se termine par *« STI version 2.0 By AE »* en laissant affichés le **Logo et le QR Code** avec les boutons **`↻ Relecture`** et **`✕ Quitter`**.
- **🔊 Écoute vocale synchronisée sur les pages de cours** :
  - Voix masculine `.mp3` ralentie et synchronisée avec le défilement automatique des cartes du cours, accompagnée d'un **Guide Rectangle + Guide-Ligne** visant le texte en cours et doté de petits boutons rapides **Pause/Play (`⏸️`/`▶️`)** et **Fermer (`✕`)** directement sur le guide-ligne et dans la barre supérieure.
  - Lecteur vidéo plein cadre `16:9` avec bouton **`✕ Fermer`** et sélecteur de vitesse (`0.85×`, `0.92×`, `1×`, `1.15×`) surlignant la vitesse active en vert (`#177245`).

---

## 🖥️ 3. Barre d'Outils PC Windows (`🛠️ ▸`), Console JS, Plein Écran & Roue Candidat (`⚙️`)

- **🛠️ Barre d'outils PC Windows repliable (`#sti-pc-win-tools`)** :
  - Réduite par défaut en bas à gauche sous un bouton discret **`🛠️ ▸`** pour ne jamais gêner la lecture, et extensible en 1 clic :
    1. **`⛶ Sans adresse` / `⛶ Plein écran actif`** : masque l'adresse en haut sur PC pour **tous les comptes** et active sur PC comme sur mobile un mode plein écran CSS plein viewport (`100vw × 100dvh`) sans jamais déclencher la bannière d'adresse native du navigateur mobile.
    2. **`📌 1er plan`** : maintient l'énoncé ou le cours au 1er plan sur Windows pendant que l'élève code dans son éditeur.
    3. **`🔍−` / `100%` / `🔍+`** : zoom de page immédiat et persistant (`60 %` à `200 %`).
    4. **`🔴 Laser` & `📏 Guide-ligne`** *(réservé à l'Administrateur et aux comptes `Prof`)* : pointeur laser rouge spécial vidéo-projecteur (1er clic) et règle lumineuse guide-ligne (2e clic) **restant actifs lors de la navigation entre toutes les pages et à l'intérieur des iframes** jusqu'à désactivation manuelle (3e clic).
    5. **`◫ 2 vues`** : mode écran scindé côte-à-côte redimensionnable à la souris (cours/exercice à gauche + annexe officielle ou énoncé à droite).
    6. **`▶️ Tester code`** : bac à sable multi-fichiers (`index.html`, `styles.css`, `controle.js`, `bd.sql`, `traitement.php`) avec modèles Bac STI pré-chargés, exécution instantanée et sauvegarde locale.
    7. **`🖥️ Console`** : Console JavaScript du navigateur ancrée à droite sur toute la hauteur de l'écran, poussant automatiquement la page vers la gauche pour que rien ne soit caché, redimensionnable à la souris, avec exécution directe sans `EvalError`, interception de `console.log`/`warn`/`error`/`alert`, historique `↑`/`↓` et puces d'exemples conformes à l'annexe STI (`ch.length`, `ch.substring(0,3)`, `ch.indexOf("@")`, `ch.charCodeAt(0)`, `String.fromCharCode(65)`, `isNaN("123")`).
- **⚙️ Roue Candidat compacte (`#sti-roue-btn`)** :
  - Affichée uniquement pour les candidats (jamais pour l'administrateur), elle indique en temps réel les données personnelles du candidat (Nom, Prénom, Lycée, Classe), le numéro de version exact (**`STiV2.0.215`**), la durée d'étude hebdomadaire, l'accès aux laboratoires, le bouton **`📸 SOS Capture`** et le bouton **`📲 Hors-ligne`**.

---

## 🎓 4. Laboratoires Interactifs, Conformité Programme Bac STI & Révision Élève

- **Conformité stricte au Programme Officiel & aux Annexes du Bac STI Tunisien** :
  - **JavaScript STI** : utilisation exclusive des propriétés et méthodes de l'annexe officielle STI (`ch.length`, `ch[i]`, `ch.substring(d, f)`, `ch.indexOf(s)`, `ch.lastIndexOf(s)`, `ch.trim()`, `ch.toUpperCase()`, `ch.toLowerCase()`, `ch.replace(a, b)`, `ch.charCodeAt(i)`, `String.fromCharCode(n)`, `T.length` — sans `split` ni `charAt`).
  - **SQL STI** : jointures systématiquement écrites dans la clause **`WHERE` avec `a.col = b.col`** (sans mot-clé `JOIN`), et opérateur de différence toujours écrit **`!=`** (ligatures de police désactivées pour afficher clairement `!=`, `<=`, `>=`).
  - **PHP & MySQLi STI** : utilisation systématique de `mysqli_connect`, `mysqli_query`, `mysqli_num_rows`, `mysqli_fetch_array`, `mysqli_affected_rows`, `mysqli_close` et de l'opérateur `!=`.
- **🗄️ Simulateur SQL Hors-ligne & Atelier Requêtes STI** :
  - Moteur SQL relationnel embarqué **100 % hors-ligne** exécutant les requêtes `SELECT`, `DISTINCT`, `WHERE` (avec jointures `a.x = b.x`), `GROUP BY`, `HAVING`, `ORDER BY`, `INSERT INTO`, `UPDATE`, `DELETE` et fonctions d'agrégation/date sur **3 bases officielles du Bac Tunisien**, avec **8 défis auto-corrigés** et envoi en 1 clic au professeur (`📤 Envoyer au Prof`).
- **🔤 Laboratoire Interactif « Chaînes & Code ASCII JavaScript »** :
  - Visualisation case par case des indices (`0` à `ch.length - 1`) et des codes ASCII (`65 = 'A'`, `97 = 'a'`, `48 = '0'`), testeur en direct et algorithmes types du Bac STI (*`estAlpha(ch)`*, *`estChiffres(ch)`*, *extraction `Nom` / `Prénom`*, *validation d'e-mail*).
- **📋 Constructeur Visuel Tableaux (`rowspan` / `colspan`), Formulaires HTML5 & Flexbox CSS3**, **🔗 Simulateur Form ➔ PHP ➔ MySQL (`$_POST` ➔ `mysqli_query`)**, **🃏 Flashcards 3D réalistes (60 FPS)**, **🐞 Chasse aux erreurs (30 pièges Bac STI)** et **📝 Examen Blanc Chronométré (`/20`)**.
- **💬 Messenger STI bidirectionnel (`📎` & `📸 SOS Capture`)** :
  - Bouton flottant réduit au seul logo rond Messenger avec **point vert (`#31a24c`) en ligne** et **point mauve (`#8b5cf6`) hors ligne**.
  - Envoi de pièces jointes, dictée vocale sans répétition, suivi de lecture « Lu / Non lu » et bouton **`📸 SOS Capture`** permettant d'envoyer instantanément son code + une question au professeur (avec bouton **`👁️ Voir le code`** côté professeur pour visualiser et tester le code en 1 clic).

---

## 📖 5. Cours interactifs, Studios d'Animation Pas à Pas & Projets Bac

- **🗄️ Cours SQL (`cours/sql.html`), Contraintes (`cours/sql-contraintes.html`) & Studios d'Animation SQL (`exercices/sql/`)** :
  - **Compteurs d'en-tête interactifs (`3 Parties`, `24 Fiches`, `28 Requêtes`)** ouvrant un explorateur rapide permettant de sauter directement vers n'importe quelle partie, fiche ou requête du cours.
  - **Ateliers animés pas à pas** dans le cours SQL pour la **Jointure dans `WHERE` (`a.col = b.col`)**, le regroupement **`GROUP BY`** et le filtrage **`HAVING`**.
  - **Studios d'animation pas à pas dans les Séries 1 à 5 (`exercices/sql/`)** :
    - *Série 1 (`Tp1-bd.html`)* : animation LDD (`CREATE TABLE`, `ALTER TABLE`, `DROP TABLE` et contraintes).
    - *Série 2 (`Tp2-bd.html`)* : animation LMD (`INSERT INTO`, `UPDATE`, `DELETE`, `SELECT`).
    - *Série 3 (`Tp-GroupBy-bd.html`)* : animation des fonctions d'agrégation (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`), `GROUP BY` et `HAVING`.
    - *Série 4 (`Tp-BD-Jointure-sous-requetes-Group-By.html`)* : animation des jointures `WHERE` et sous-requêtes (`IN`, `NOT IN`).
    - *Série 5 (`Tp-date-ssr-j-gp-bd.html`)* : animation complète sur la base *GestHotel* (fonctions de date, jointures, sous-requêtes et `GROUP BY`).
- **🐘 Cours PHP (`cours/php.html`), `cours/PHP-recap.html`, `cours/php-mysqli.html` & Devoir de Contrôle N°6** :
  - Bouton **`🪄 PHP-recap ✨`** ouvrant directement la fiche récapitulative dédiée `cours/PHP-recap.html` (munie de son bouton retour `← Retour au cours PHP`), vidéo complète `php-cours.mp4`, animation interactive du Guichet Client / Serveur Apache / PHP / MySQL (`php-guichet.mp4`), fiche interactive **PHP & MySQLi** et **Devoir de Contrôle N°6 PHP (4SI 2025-2026)**.
- **🧪 Atelier Bac Pratique (`bac-pratique.html`) & Projet STI 0 (`projets/sti0/`)** :
  - Épreuves pratiques notées sur `/20`, téléchargement 100 % hors-ligne de `projetsti0.pdf` et `ressources-projet-sti0.zip`, et **animations pas à pas de `sondage.php` (`exercices/php/sondage-parcours-pas-a-pas.html`) et `Correctionstat.php` (`exercices/php/statphpanimee.html`)** intégrées exclusivement au **Projet STI 0 (`p0`)**.
- **🌐 Cours HTML5 / CSS3 (`cours/html5.html`, `cours/css3.html`), Leçons animées (`cssanimee/`, `Positionnement-animee/`) & TP Explore Tunisie** :
  - Médias de démonstration HTML5 (`<img>`, `<video>`, `<audio>`) 100 % locaux et fonctionnels hors-ligne.
  - Section **« CSS pas à pas »** avec vidéos explicatives (`css-positionnement.mp4`, `css-animee.mp4`), retour direct vers `cours/css3.html#css-pas-a-pas` et **TP Explore Tunisie** en carte pleine largeur (`exo-card-wide`) avec énoncé PDF/DOCX, pack d'images et corrigé complet.

---

## 📊 6. Tableau de bord Administrateur & Pilotage de classe (`admin.html`)

- **Organisation claire en 4 zones ergonomiques (PC & Mobile)** :
  1. **En-tête supérieur épuré (`.hero-admin`)** : logo SVG et titre **`Tableau de bord STI V2.0`** dynamiques (**vert `#177245` en ligne / rouge `#c0392b` hors ligne**), témoin de Mode Examen, version active, **jauge de quota Supabase (`500 Mo`) cliquable**, raccourcis prioritaires avec pastilles live et tiroir **`⚙️ Système & Plus ▾`**.
  2. **Boîte à outils du Professeur classée en 3 Pôles thématiques par onglets (`.poles-tabs`)** :
     - **📡 Pôle 1 — Séance & Direct** : *📢 Message par classe*, *📺 Tableau Blanc Live*, *🗂️ Coffre de Partage TP*, *🪪 Badges Labo (Classe)*.
     - **📝 Pôle 2 — Évaluations & Corrections** : *⚡ Question Flash / Sondage*, *📊 Sondage QCM Live (Kahoot STI)*, *📥 Copies & TP rendus (/20)*, *🧮 Grille Devoirs (DC / DS + CSV Eduserv)*, *⏱️ Contrôle chronométré*.
     - **🛡️ Pôle 3 — Classe, Sécurité & Suivi** : *🛡️ Sécurité & Mode Examen*, *🧪 Atelier Bac Pratique*, *📊 Trier par durée / accès*.
  3. **5 Compteurs en direct (`#stats`) & 4 Sections repliables (`#nav-sections-admin`)** :
     - **👥 `1. Liste des Abonnés & Classes`** (couleurs : **en ligne `#a7e8bd`**, **actif `#c4b5fd`**, attente beige, exclu rose, **Gold doré**),
     - **🏆 `2. Résultats des Quiz & Atelier Bac Pratique`**,
     - **📨 `3. Suivi de lecture des messages & réponses des élèves`** (suppression par mois ou par message),
     - **🕒 `4. Dernières connexions (tous abonnés)`** avec affichage du **Lycée** et de la **Classe**.
  4. **Ergonomie Mobile dédiée (`≤ 768px`)** : barre de navigation fixe au pouce en bas d'écran (`#mob-bottom-nav`), masquée automatiquement dès l'ouverture du Chat Messenger ou d'une fenêtre modale.
- **✅ Confirmation systématique à 2 boutons (`Annuler` et `Confirmer`)** sur toute action de modification ou de suppression (candidats, classes, lycées, statuts, Gold).

---

## 🛡️ 7. Pack Sécurité Totale, Compte 👑 Gold, PDF, Mode 100 % Hors-ligne & Bouclier Anti-IA

- **📄 Documents PDF accessibles à tous & Statut 👑 Gold** :
  - **Tous les documents PDF (`.pdf` et `.pdf.html`) sont téléchargeables et imprimables par 100 % des abonnés actifs**.
  - Le statut **👑 Gold** débloque en plus la copie de texte/code, la capture d'écran et l'impression des pages de cours interactives.
- **Verrouillage strict du code source (`assets/js/protection.js`)** :
  - Clic droit, `Ctrl + S`, `Ctrl + U`, `F12`, `Ctrl + Shift + I / J / C / K` bloqués pour **100 % des abonnés** (seul l'administrateur strict est exempté), sans faux positif de redimensionnement/zoom.
- **🛡️ Centre de Sécurité & Bouclier Anti-IA (`#modal-securite`)** :
  - **Mode Examen / Verrouillage par classe** avec minuteur d'auto-déverrouillage, **Plein Écran**, **Téléportation d'écran**, **Pause écran individuel**, **Session unique**, **chronométrage des sorties d'onglet (`Alt + Tab` ≥ 10 s)**, **Tirage aléatoire des QCM**, **Piège Copy-Trap** et **Bouclier Anti-IA complet (Anti-ChatGPT · Anti-Gemini · Anti-Claude)**.
- **📴 Autonomie 100 % Hors-ligne (`sw.js` · `sti-atelier-v226`)** :
  - Service instantané (`0 ms`) depuis le cache local de la version active (`SHELL` de 94 fichiers essentiels + `OFFLINE_LIST` de ressources locales : cours, exercices, studios d'animation SQL/PHP/CSS, console JS, médias HTML5/audio/vidéo locaux, PDF et archives `.zip`/`.rar`) permettant de travailler **100 % sans Internet** avec synchronisation automatique dès le retour de la connexion.

---

## 🗂️ 8. Structure du projet

```text
STI-Atelier-V2.0/
│
├── index.html                        # 🏠 Accueil — cours avec vidéos .mp4 & audio, recherche Ctrl+K & laboratoires
├── portail.html                      # 🔐 Portail de connexion / inscription (e-mail, WhatsApp +216 & Badge Labo)
├── admin.html                        # 📊 Tableau de bord Admin organisé en 3 pôles & 4 sections repliables
├── bac-pratique.html                 # 🧪 Atelier Épreuve Pratique Bac STI + Projet STI 0 (sondage & stats pas à pas)
├── carte-visite.html                 # 🪪 Carte de visite numérique AE (.vcf & impression réservés Admin)
├── sw.js                             # ⚙️ Service Worker PWA (cache 100 % hors-ligne sti-atelier-v226)
├── manifest.webmanifest              # 📱 Manifeste PWA (fullscreen / standalone sans barre d'adresse)
├── robots.txt                        # 🤖 Directives SEO & blocage des robots d'IA (noai / noimageai)
├── sitemap.xml                       # 🗺️ Plan du site
├── README.md                         # 📄 Documentation complète du projet
│
├── assets/                           # 🎨 Ressources globales 100 % locales (CSS, JS, polices, icônes, médias)
│   ├── css/                          #   atelier.css, atelier-pages.css, protection.css, tailwind.css
│   ├── fonts/                        #   fonts.css & polices locales hors-ligne (ligatures désactivées)
│   ├── fontawesome/                  #   icônes FontAwesome locales hors-ligne
│   ├── audio/ & videos/              #   audios .mp3 synchronisés & 8 vidéos .mp4 avec filigrane Logo + QR Code
│   └── js/                           #   config.js, portail.js, acces.js, admin.js, protection.js, supabase-umd.js
│
├── cours/                            # 📖 Cours interactifs & Fiches (HTML5, CSS3, JS, SQL, sql-contraintes, PHP, PHP-recap, php-mysqli)
├── cssanimee/                        # 🎬 Leçon animée 1 : Balises HTML5 & propriétés CSS3 des annexes
├── Positionnement-animee/            # 📐 Leçon animée 2 : Positionnement CSS & Flexbox pas à pas
├── quiz/                             # 🎯 Quiz interactifs & Défis (HTML/CSS, JS, SQL, PHP)
├── exercices/                        # ✏️ Séries d'exercices, TP Explore Tunisie, DC6 PHP & Studios d'animation SQL (Séries 1 à 5)
├── projets/                          # 🛠️ Projets complets (STI 0, Carte bancaire, Formulaire, Fleurs, Tunisie)
├── documents/                        # 📄 Annexes officielles PDF & Cours complets imprimables par tous
└── tools/                            # 🔧 Schéma SQL Supabase (RLS blindé, triggers & fonctions RPC)
```
