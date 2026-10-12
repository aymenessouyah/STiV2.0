# 📚 STI By A'e — Le Web de A à Z (Version 2.0 · `v130`)

Plateforme éducative interactive dédiée aux **Sciences et Technologies de l'Informatique (STI — 3ème & 4ème SI)** :
cours complets, leçons animées pas à pas, annexes officielles du Bac Tunisien, flashcards 3D, bac à sable de code en direct, écran partagé Énoncé + Code, simulateur SQL hors-ligne, laboratoire Chaînes & ASCII JavaScript, simulateur visuel Form ➔ PHP ➔ SQL, constructeur visuel Tableaux/Formulaires/Flexbox, chasse aux erreurs (débogage Bac STI), examen blanc chronométré `/20`, tableau blanc live, coffre de partage rapide de fichiers TP, boîte de réception et notation des copies TP, sondages QCM Live (mode Kahoot STI), messagerie temps réel avec pièces jointes, séries d'exercices, TP corrigés, quiz interactifs et épreuves pratiques en **HTML5, CSS3, JavaScript, SQL et PHP / MySQLi**.

> **Auteur** : **Aymen Essouyah** (`By A'e`) — Lycée Rafèha  
> **Version active** : **V2.0 · `v130`** (Application PWA 100 % hors-ligne, Portail sécurisé, Tableau de bord organisé par pôles pédagogiques, Pack Sécurité Totale & Bouclier Anti-IA)

---

## ✨ 1. Portail d'accès, Inscription & Gestion des profils (`portail.html`)

- **Identité visuelle unifiée** : thème sombre (`#0d1526` + halo orange + grille de points) avec animation dactylo **`STI`**.
- **Modes d'inscription et de connexion** :
  - **Par e-mail** ou **par téléphone (`+216 `)** avec saisie obligatoire du **Nom** et du **Prénom**, et validation par **code WhatsApp à 6 chiffres** (6 cases OTP individuelles).
  - **Par Badge Laboratoire à 6 caractères (`🪪 Badge Labo`)** : connexion rapide en salle informatique pendant une séance de TP sans exposer le mot de passe personnel.
- **Protection Anti-Brute-Force** : verrouillage temporaire automatique de 60 secondes avec compte à rebours après 5 tentatives de connexion infructueuses.
- **Sélection dynamique du lycée et de la classe** synchronisée en temps réel avec la configuration du professeur.
- **Session permanente « Labo » (`elevelabo3`)** : maintien automatique de la session sur les postes du laboratoire avec accès à tous les cours et bouton `🚪 Déconnexion`, **sans aucun accès à `admin.html`**.
- **Profil Enseignant (`Prof`) & Restriction automatique par niveau (`3ème SI` vs `4ème SI`)** :
  - Les ressources **PHP / MySQLi**, l'**Atelier Bac Pratique** et le **Projet STI 0** (`projetsti0.pdf` et `ressources-projet-sti0.zip`) sont automatiquement masqués et verrouillés dès `0 ms` pour toutes les classes autres que **`4SI` (`4SI1` à `4SI5`)**, **`Prof`**, **`elevelabo3`** et l'**Administrateur**.

---

## 🎓 2. Laboratoires Interactifs, Outils d'étude & Révision Élève (`index.html` & `assets/js/acces.js`)

- **🗄️ Simulateur SQL Hors-ligne & Atelier Requêtes STI** :
  - Moteur SQL relationnel embarqué **100 % hors-ligne** permettant d'exécuter de vraies requêtes **`SELECT`, `DISTINCT`, `WHERE`, `JOIN`, `GROUP BY`, `HAVING`, `ORDER BY`, `INSERT INTO`, `UPDATE`, `DELETE`** et fonctions (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`, `YEAR`, `MONTH`, `DAY`) sur **3 bases de données officielles du Bac Tunisien** (*Gestion Commerciale*, *Transport & Voyages*, *Club Sportif & Abonnements*).
  - Inclut **8 défis SQL progressifs auto-corrigés** et l'envoi en 1 clic de la requête et du résultat au professeur (`📤 Envoyer au Prof`).
- **🔤 Laboratoire Interactif « Chaînes & Code ASCII JavaScript » (Conforme Annexe Bac STI)** :
  - Visualisation case par case de toute chaîne `ch` avec ses indices (`0` à `ch.length - 1`) et ses codes ASCII (`65 = 'A'`, `97 = 'a'`, `48 = '0'`).
  - Testeur interactif utilisant exclusivement les propriétés et méthodes de l'**Annexe Officielle STI** : `ch.length`, `ch[i]`, `ch.indexOf(s)`, `ch.lastIndexOf(s)`, `ch.substring(d, f)`, `ch.toUpperCase()`, `ch.toLowerCase()`, `ch.trim()`, `ch.replace(a, b)`, `ch.charCodeAt(i)`, `String.fromCharCode(n)` et `T.length`.
  - Générateur commenté des algorithmes classiques de contrôle de saisie du Bac STI (*`estAlpha(ch)`*, *`estChiffres(ch)` (CIN / Tél.)*, *extraction `Nom` / `Prénom`*, *validation d'e-mail*).
- **🌗 Mode « Écran Partagé (Split-View) : Énoncé / Annexe + Éditeur de Code »** :
  - Permet de travailler côte à côte avec l'**Énoncé de TP ou l'Annexe officielle STI** à gauche et l'**Éditeur de code multi-onglets (`HTML`, `CSS`, `JS`, `SQL / PHP`) + Aperçu live** à droite, avec remise directe de la copie au professeur (`📤 Rendre ma copie au Prof`).
- **💻 Mini « Bac à sable » de code en direct (`HTML / CSS / JS`)** :
  - Éditeur interactif **100 % hors-ligne** avec modèles Type Bac préchargés, aperçu instantané, console JS intégrée et bouton **`📤 Envoyer mon code au Prof`**.
- **📋 Constructeur Visuel de Tableaux (`rowspan` / `colspan`), Formulaires HTML5 & Flexbox CSS3** :
  - Générateur visuel interactif produisant automatiquement le code HTML5/CSS3 propre et indenté pour les tableaux fusionnés, les formulaires avec validation et les mises en page Flexbox.
- **🔗 Simulateur Visuel « Du Formulaire HTML vers PHP & MySQL (`$_POST` ➔ `mysqli_query`) »** :
  - Animation pas à pas illustrant le cycle complet d'une application Web STI : saisie HTML ➔ contrôle JS `onsubmit="return verif()"` ➔ tableau `$_POST[...]` sur le serveur Apache/PHP ➔ exécution SQL `mysqli_query($con, $req)` ➔ retour `mysqli_affected_rows($con)` ou `mysqli_num_rows($res)`.
- **🃏 Mode « Flashcards Bac STI » en 3D réaliste (`Recto / Verso 3D`)** :
  - Plus de **30 cartes de révision officielles** (**HTML5, CSS3, JavaScript, SQL, PHP / MySQLi**) animées à 60 FPS (`requestAnimationFrame`, perspective 3D, filtres par module et suivi des cartes maîtrisées).
- **🐞 Mode « Chasse aux erreurs (Débogage Bac STI) » & 📝 Examen Blanc Chronométré (`/20`)** :
  - **10 défis officiels de débogage × 3 erreurs = 30 pièges classiques du Bac STI** avec diagnostic en direct (`🐞` ➔ `✅`), indices progressifs et corrigé détaillé.
  - **Examen Blanc STI (`/20`)** : 20 questions QCM tirées aléatoirement par élève (4 par module), chronomètre de 20 minutes, copie détaillée et transmission automatique de la note au professeur.
- **💬 Messenger STI bidirectionnel (`📎`), 🗂️ Coffre TP, 🙋‍♂️ Lever la main, 🏆 Palmarès & 🩺 Docteur STI** :
  - Messagerie instantanée avec pièces jointes (images, `.pdf`, `.zip`, `.sql`, `.php`, `.html`, `.js`), dictée vocale sans répétition et masquage automatique de la barre inférieure sur mobile lors de l'ouverture du chat.
  - Accès direct aux fichiers distribués par le professeur (**`🗂️ Coffre TP`**), bouton **`🙋‍♂️ Lever la main`** pour demander de l'aide en TP, consultation du **`🏆 Palmarès`** et outil d'auto-réparation du cache (**`🩺 Docteur STI`**).
- **🔍 Recherche profonde globale (`Ctrl + K` ou `/`)**, **📍 Reprise automatique de lecture**, **📝 Carnet de notes (`Alt + N`)** et **bouton universel `⬆ Haut`**.

---

## 📖 3. Cours interactifs, Animations & Projets Bac

- **🐘 Cours PHP (`cours/php.html`), `cours/PHP-recap.html` & `cours/php-mysqli.html`** :
  - Bouton permanent **`🪄 PHP-recap ✨`** ouvrant la fiche récapitulative complète en modale plein écran.
  - Bouton **`🎬`** ouvrant l'animation interactive du guichet Client / Serveur Apache / PHP / MySQL (avec invitation « Tournez-moi ! 🔄 » sur mobile portrait).
  - Boîte interactive dédiée aux fonctions **PHP & MySQLi** (`cours/php-mysqli.html`).
- **🗄️ Cours SQL (`cours/sql.html`) & Animation des contraintes (`cours/sql-contraintes.html`)** :
  - Cours complet LDD / LMD avec bouton **`⚡ Voir l'animation : Effet des contraintes`** ouvrant le simulateur néo-brutaliste (`PRIMARY KEY`, `FOREIGN KEY`, `ON DELETE CASCADE`, `UNIQUE`, `CHECK`, `NOT NULL`, `DEFAULT`, `AUTO_INCREMENT`).
- **🎬 Leçons animées pas à pas (`cssanimee/` & `Positionnement-animee/`)** :
  - Découverte visuelle et animée des balises HTML5, des propriétés CSS3 des annexes officielles, du positionnement CSS et de Flexbox.
- **🧪 Atelier Bac Pratique (`bac-pratique.html`) & Projet STI 0 (`projets/sti0/`)** :
  - Épreuves pratiques notées sur `/20` et téléchargement 100 % hors-ligne garanti de l'énoncé PDF (`projetsti0.pdf`) et de l'archive des ressources (`ressources-projet-sti0.zip`).
- **🪪 Carte de visite numérique (`carte-visite.html`)** :
  - Carte professionnelle interactive avec logo **AE** (export `.vcf` et impression réservés à l'administrateur).

---

## 📊 4. Tableau de bord Administrateur réorganisé & Pilotage de classe (`admin.html`)

- **Organisation claire en 4 zones ergonomiques (PC & Mobile)** :
  1. **En-tête supérieur épuré (`.hero-admin`)** : indicateur réseau temps réel (vert `#177245` en ligne / rouge `#c0392b` hors ligne), témoin de Mode Examen, version active, **jauge de quota Supabase (`500 Mo`) cliquable**, accès directs prioritaires avec pastilles live (`💬 Messenger`, `⚡ Question Flash`, `📋 Appel`, `🛡️ Sécurité`, `🙋‍♂️ Mains levées`, `🏆 Palmarès`, `🔄 Actualiser`) et tiroir **`⚙️ Système & Plus ▾`** (`🏠 Accueil`, `🪪 Carte visite`, `🩺 Forcer Maj Élèves`, `🔒 Verrouiller PIN`, `📖 README`, `🔔 Notifications`).
  2. **Boîte à outils du Professeur classée en 3 Pôles thématiques par onglets (`.poles-tabs`)** :
     - **📡 Pôle 1 — Séance & Direct (4 outils)** : *📢 Message par classe*, *📺 Tableau Blanc Live*, *🗂️ Coffre de Partage TP*, *🪪 Badges Labo (Classe)*.
     - **📝 Pôle 2 — Évaluations & Corrections (5 outils)** : *⚡ Question Flash / Sondage*, *📊 Sondage QCM Live (Kahoot STI)*, *📥 Copies & TP rendus (/20)*, *🧮 Grille Devoirs (DC / DS + CSV Eduserv)*, *⏱️ Contrôle chronométré*.
     - **🛡️ Pôle 3 — Classe, Sécurité & Suivi (3 outils)** : *🛡️ Sécurité & Mode Examen*, *🧪 Atelier Bac Pratique*, *📊 Trier par durée / accès*.
  3. **5 Compteurs en direct (`#stats`) & Barre de navigation par sections (`#nav-sections-admin`)** : permet d'afficher la vue complète ou de filtrer/replier en 1 clic chacune des **4 grandes sections de données** :
     - **👥 `1. Liste des Abonnés & Classes`** (`📋 Liste détaillée` ou `🔵 Nœuds`),
     - **🏆 `2. Résultats des Quiz & Atelier Bac Pratique`**,
     - **📨 `3. Suivi de lecture des messages & réponses des élèves`**,
     - **🕒 `4. Dernières connexions (tous abonnés)`**.
  4. **Ergonomie Mobile dédiée (`≤ 768px`)** : barre de navigation fixe au pouce en bas d'écran (`#mob-bottom-nav`), masquée automatiquement dès l'ouverture du Chat Messenger ou d'une fenêtre modale.
- **✅ Confirmation systématique à 2 boutons (`Annuler` et `Confirmer`)** :
  - Chaque opération de changement ou de suppression dans **Liste des Abonnés & Classes** et dans **Gestion des Lycées & des Classes** (*suppression de classe*, *suppression de lycée*, *suppression de candidat*, *renommage ou ajout de classe/lycée*, *changement de classe d'un candidat*, *changement de statut Actif / En attente / Exclu*, *bascule 👑 Gold*, *pause écran*, *activation groupée*) affiche une boîte de confirmation dédiée avec les **2 boutons `Annuler` et `Confirmer`**.
- **📥 Boîte de Réception & Notation des Copies TP (`/20`), 🧮 Grille Devoirs (`DC / DS`) & 📄 Bulletin PDF (`A4`)** :
  - Test en 1 clic du code rendu par un élève, attribution d'une note `/20` et d'une appréciation envoyées en direct sur son écran.
  - Grille de barème par composante (*HTML `/4`*, *CSS `/4`*, *JS `/4`*, *SQL `/4`*, *PHP `/4`*) avec export CSV compatible Eduserv.
  - Génération depuis la Fiche Élève d'un **Bulletin / Bilan Individuel PDF A4** officiel prêt à imprimer ou signer.
- **🧹 Analyseur & Nettoyeur Intelligent du Quota Supabase (`500 Mo`)** :
  - Détail visuel de l'espace occupé par catégorie et nettoyage ciblé en 1 clic des anciens journaux et pièces jointes sans jamais toucher aux comptes élèves ni aux notes récentes.

---

## 🛡️ 5. Pack Sécurité Totale, Compte 👑 Gold, PDF & Bouclier Anti-IA

- **📄 Documents PDF accessibles à tous & Statut 👑 Gold** :
  - **Tous les documents PDF (`.pdf` et `.pdf.html`) sont téléchargeables et imprimables par 100 % des abonnés actifs**.
  - Le statut **👑 Gold** débloque en plus la copie de texte/code, la capture d'écran et l'impression des pages de cours interactives.
- **Verrouillage strict du code source (`assets/js/protection.js`)** :
  - Clic droit, `Ctrl + S`, `Ctrl + U`, `F12`, `Ctrl + Shift + I / J / C / K` et bouclier **Anti-DevTools** bloqués pour **100 % des abonnés** (y compris **👑 Gold** et **`elevelabo3`** ; seul l'administrateur strict est exempté), avec **éjection automatique (`3/3`)**.
- **🛡️ Centre de Sécurité & Bouclier Anti-IA (`#modal-securite`)** :
  - **Mode Examen / Verrouillage par classe** avec **minuteur d'auto-déverrouillage** (`30 min`, `45 min`, `1 h`, `1 h 30`, `2 h`), **Plein Écran (`F11`) obligatoire**, **Téléportation d'écran** et **Pause écran individuel**.
  - **Session unique anti-partage de compte**, **chronométrage exact des sorties d'onglet (`Alt + Tab` ≥ 10 s)**, **Anti-Écran partagé (`Split-screen < 80 %`)** et **Anti-Traduction automatique (`translate="no"`)**.
  - **🔀 Tirage aléatoire des QCM par élève** et **🕵️‍♂️ Piège « Cheval de Troie » au Copier (`Copy-Trap`)** détectant automatiquement les réponses générées par IA (`verif_sti_ae` / `sti_ctrl_94`).
  - **🤖 Bouclier Anti-IA complet (Anti-ChatGPT · Anti-Gemini · Anti-Claude)** : blocage du collage/glisser-déposer externe, neutralisation des extensions latérales d'IA et des Auto-Typers, filigrane nominatif anti-photo smartphone (`#XXXX`) et sauvegarde complète **Backup JSON**.

---

## 🗂️ 6. Structure du projet

```text
STI-Atelier-V2.0/
│
├── index.html                        # 🏠 Accueil — cours, recherche Ctrl+K, laboratoires & outils interactifs
├── portail.html                      # 🔐 Portail de connexion / inscription (e-mail, WhatsApp +216 & Badge Labo)
├── admin.html                        # 📊 Tableau de bord Admin organisé en 3 pôles & 4 sections repliables
├── bac-pratique.html                 # 🧪 Atelier Épreuve Pratique Bac STI (4SI / Prof / Labo / Admin)
├── carte-visite.html                 # 🪪 Carte de visite numérique AE (.vcf & impression réservés Admin)
├── sw.js                             # ⚙️ Service Worker PWA (cache 100 % hors-ligne sti-atelier-v132)
├── manifest.webmanifest              # 📱 Manifeste d'installation PWA
├── robots.txt                        # 🤖 Directives SEO & blocage des robots d'IA
├── sitemap.xml                       # 🗺️ Plan du site
├── README.md                         # 📄 Documentation complète du projet
│
├── assets/                           # 🎨 Ressources globales (CSS, JS, polices, icônes, médias)
│   ├── css/                          #   atelier.css, atelier-pages.css, atelier-php.css, protection.css
│   └── js/                           #   config.js, portail.js, acces.js, admin.js, protection.js, supabase-umd.js
│
├── cours/                            # 📖 Cours interactifs & Fiches récapitulatives (HTML5, CSS3, JS, SQL, PHP)
├── cssanimee/                        # 🎬 Leçon animée 1 : Balises HTML5 & propriétés CSS3 des annexes
├── Positionnement-animee/            # 📐 Leçon animée 2 : Positionnement CSS & Flexbox pas à pas
├── quiz/                             # 🎯 Quiz interactifs & Défis (HTML/CSS, JS, SQL, PHP)
├── exercices/                        # ✏️ Séries d'exercices & TP corrigés par module
├── projets/                          # 🛠️ Projets complets (STI 0, Carte bancaire, Formulaire, Fleurs, Tunisie)
├── documents/                        # 📄 Annexes officielles PDF & Cours complets imprimables par tous
└── tools/                            # 🔧 Schéma SQL Supabase (RLS blindé, triggers & fonctions RPC)
```
