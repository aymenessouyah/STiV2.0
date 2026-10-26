# 📚 STI By A'e — Plateforme Pédagogique STI V2.0 (3ᵉ & 4ᵉ SI)

Plateforme éducative interactive et **PWA 100 % hors-ligne** dédiée aux **Sciences et Technologies de l'Informatique** (**3SI** et **4SI**, programme officiel du Baccalauréat Tunisien) : cours multimédias avec **14 vidéos explicatives (`.mp4`)** et écoute vocale synchronisée, **2 livres connectés (Smart Books) par QR codes**, laboratoire **SQLite WASM**, **41 fiches d'exercices et séries corrigées**, **5 modules de quiz CSPRNG (1 244 questions au total)** avec tirage neuf à chaque connexion et reprise multi-appareils, hub **« Mes erreurs »**, révision espacée **J+1 / J+3 / J+7**, couverture sur **124 pages**, **retour instantané 0 ms sans rechargement (`bfcache`)**, sauvegarde automatique quotidienne des **15 tables Supabase** vers **Google Drive** et tableau de bord enseignant complet.

> 🌐 **Plateforme en ligne** : https://aymenessouyah.github.io/STiV2.0/
> 👨‍🏫 **Auteur** : M. Aymen Essouyah — Lycée Rafèha
> 🏗️ **Architecture** : Frontend statique GitHub Pages + Supabase PostgreSQL (`15` tables RLS + `22` fonctions sécurisées) + Service Worker incrémental (`sw.js` — `sti-atelier-v334`)
> 📌 **Version active** : **v474** (`sti-atelier-v334` — 26 octobre 2026)

---

## 📖 Sommaire

1. [Vue d'ensemble & chiffres vérifiés](#-vue-densemble--chiffres-vérifiés)
2. [Cours interactifs, vidéos, Smart Books & exercices](#-cours-interactifs-vidéos-smart-books--exercices)
3. [Quiz CSPRNG, calcul du score & hub « Mes erreurs »](#-quiz-csprng-calcul-du-score--hub-mes-erreurs)
4. [Navigation retour 0 ms sans rechargement (`bfcache`)](#-navigation-retour-0-ms-sans-rechargement-bfcache)
5. [Comptes, accès laboratoire, PWA & suivi multi-appareils](#-comptes-accès-laboratoire-pwa--suivi-multi-appareils)
6. [Tableau de bord administrateur (`admin.html`)](#-tableau-de-bord-administrateur-adminhtml)
7. [Sécurité de la plateforme & protection des données](#-sécurité-de-la-plateforme--protection-des-données)
8. [Base Supabase (15 tables) & Sauvegarde automatique Google Drive](#-base-supabase-15-tables--sauvegarde-automatique-google-drive)
9. [Maintenance, tests automatisés & conventions Bac STI](#-maintenance-tests-automatisés--conventions-bac-sti)
10. [Historique des versions](#-historique-des-versions)

---

## 📊 Vue d'ensemble & chiffres vérifiés

| Pilier | Détail vérifié dans le dépôt et la base active |
|---|---|
| **Cours & multimédia** | HTML5, CSS3, JavaScript, Bases de données / SQL et PHP / MySQLi (`4SI`), **14 vidéos `.mp4`** chapitrées + écoute vocale `.mp3` synchronisée avec Guide-Ligne (`0.85×` / `1×` / `1.15×`) |
| **Smart Books QR** | **2 manuels PDF connectés** : *3ᵉ SI* (**72 pages**) et *4ᵉ SI* (**100 pages**) reliés page par page via `livre-smart.html` |
| **Exercices & Bac** | Hub `exercices/series-exercices.html`, **41 fiches TP / corrigés**, séries SQL 1 à 6 en vidéo, 37 Défis JS, `bac-pratique.html`, `pieges-bac.html`, `outils-js-bac.html`, `memo-veille-bac.html` |
| **Banques de quiz** | **5 modules actifs** totalisant **1 244 questions** : HTML5/CSS3 (**187**), JavaScript (**106**), SQL (**140**), PHP (**176**) et Tableaux Smart Books (**635** dans `quiz-banque.json`) |
| **Suivi élève** | Anneau de couverture sur **124 pages**, révision espacée **J+1 / J+3 / J+7**, fiche imprimable `ma-fiche-revision.html`, mode Rayons X & surligneur |
| **Cloud & sauvegarde** | **15 tables `public`** sous RLS stricte (`vywujxmepvcbgedgmger`), pagination déterministe `> 1 000` lignes et export automatique quotidien `.json.gz` vers **Google Drive** |

---

## 🎓 Cours interactifs, vidéos, Smart Books & exercices

- **Cours complets conformes au programme tunisien** (`cours/html5.html`, `cours/css3.html`, `cours/javascript.html`, `cours/sql.html`, `cours/php.html`, `cours/php-mysqli.html`, `cours/sql-bases-ldd-lmd-lcd.html`) :
  - **14 vidéos explicatives (`.mp4`)** : 5 cours complets, 2 animations CSS3, l'histoire animée du Guichet PHP/MySQLi et les 6 corrigés vidéo des séries SQL, avec reprise automatique à la seconde près et remontée cloud `PROG_MEDIA` (`✅ Vu` / `⏳ En cours`).
  - **Laboratoire SQL de poche (`cours/sql-playground.html`)** : moteur SQLite WASM 100 % local avec 3 bases d'entraînement et exécution hors-ligne.
- **Smart Books & Annexes officielles** :
  - Chaque page des manuels *3ᵉ SI* et *4ᵉ SI* possède un QR code ouvrant la ressource exacte et mémorisant la dernière page consultée ;
  - Les **annexes officielles** (`documents/annexes/`) conservent le code hors programme indispensable **barré en rouge** (`.hp`), sans suppression.
- **Séries d'exercices & préparation Bac** :
  - Hub unifié `exercices/series-exercices.html` (`#css3`, `#javascript`, `#bdd`, `#php`) avec aperçu intégré, ouverture plein écran et corrigés détaillés ;
  - Fiches transversales : **Atelier Bac Pratique** (`bac-pratique.html`), **25 pièges du Bac** (`pieges-bac.html`), **10 fonctions JS clés** (`outils-js-bac.html`), **Mémo veille du Bac** (`memo-veille-bac.html`) et **Glossaire bilingue FR/AR** (`glossaire.html`).

---

## 🏆 Quiz CSPRNG, calcul du score & hub « Mes erreurs »

### 1. Tirage aléatoire intégral à chaque nouvelle connexion (`v455`–`v470`)
- **5 modules actifs** : `quiz/html-css.html` (**187 q.**), `quiz/javascript.html` (**106 q.**), `quiz/sql.html` (**140 q.**), `quiz/php.html` (**176 q.**, avec redirection propre depuis `quiz/pp.html`) et `quiz/tableaux.html` (**635 q.** issues de `assets/data/quiz-banque.json`).
- **Mélange cryptographique (`window.crypto.getRandomValues`)** :
  - À **chaque nouvelle connexion** (`portail.js` → `preparerNouvelleConnexionQuiz()` + `STIQuizSync.reinitialiserSessionsConnexion()`), toute ancienne session inachevée est purgée afin de garantir un **nouveau tirage aléatoire des questions ET un nouveau mélange aléatoire des propositions `A/B/C/D`** ;
  - Anti-série intégré (jamais 3 bonnes réponses consécutives à la même position) et rotation prioritaire des questions jamais vues (`sti_quiz_vus`, isolé par `user_id` sur poste partagé).
  - En cours d'une même session de connexion, si au moins une réponse a été validée (`estSessionDemarree`), la partie peut être reprise exactement au même indice et avec le même ordre sur un autre appareil (`sti_quiz_sessions`).

### 2. Calcul du score & synchronisation write-ahead vers Supabase (`assets/js/quiz-sync.js`)
- Calcul instantané du **score exact**, du **pourcentage**, de la **note ramenée sur `/20`** et des **points** (avec pont synchrone vers `acces.js` / `sti-mes-scores`).
- **File locale write-ahead isolée par `user_id`** : chaque fin de partie (`STIQuizSync.enregistrer`) et chaque lot de réponses (`STIQuizSync.enregistrerReponses`) est inscrit en `localStorage` **avant** l'appel réseau, puis vidé automatiquement vers `sti_quiz_parties` et `sti_quiz_reponses` dès que la connexion est disponible — sans jamais mélanger deux élèves successifs sur un poste du Labo 3.
- **Carte d'Évaluation Officielle STI V2.0 (`v459`)** en fin de quiz : bilan détaillé, points à réviser, un conseil ciblé par faute, export PNG HD et impression.
- **Exception compte partagé laboratoire (`elevelabo3@exemple.tn`)** : fonctionnement 100 % local au poste, zéro envoi cloud et exclusion automatique de toutes les moyennes et alertes enseignant.

### 3. Table & séance ciblée « Mes erreurs » (`revision-erreurs.html`)
- Agrège en direct `sti_quiz_reponses` (et la file locale hors-ligne de l'élève connecté), filtre automatiquement le module PHP pour les classes de **3ᵉ SI**, distingue les questions encore ratées de celles déjà corrigées, et lance en un clic une séance ciblée **`?revision=erreurs`** sur le quiz correspondant.
- Côté enseignant, `assets/js/admin-erreurs.js` croise ces réponses avec `profiles` pour classer chaque notion en *Ne sait pas*, *Sait mais se trompe* ou *Maîtrise* et détecter les questions ambiguës ou trop faciles.

---

## ⚡ Navigation retour 0 ms sans rechargement (`bfcache`)

Conçue dans `assets/js/config.js` (`v465`, `v467`, `v470`) pour offrir un retour instantané sur mobile 3G comme sur PC :

- **Retour vers Quiz (`#modules`), Cours (`#cours`) et Exercices (`#exercices`) sans recharger `index.html`** :
  - Tout clic sur un lien de retour vers `index.html` (`#modules`, `#cours`, `#exercices`, `#top`) ou vers `exercices/series-exercices.html` (`#css3`, `#javascript`, `#bdd`, `#php`) intercepte la navigation, mémorise l'ancre cible en `sessionStorage` et exécute `history.go(-delta)` pour restaurer le document directement depuis le **`bfcache` en 0 ms**.
  - Sur un onglet ouvert en plein écran (`window.opener` avec `history.length <= 2`), le bouton Retour referme proprement l'onglet enfant et redonne le focus au hub déjà ouvert sans rechargement.
- **Préservation intégrale de l'état d'historique et du `bfcache` (`v470`)** :
  - Aucun écouteur `beforeunload` ni en-tête `Cache-Control: no-store` ;
  - Les boutons `▲ Haut` (`#stix-top`), la barre mobile (`mobile-nav.js`) et la recherche globale `Ctrl+K` (`acces.js`) préservent intégralement `history.state` (`__stiHome`, `__stiHop`, `__stiSeries`) ;
  - Lors de `pagehide`, `sync-progressions.js` et `acces.js` n'émettent aucune requête redondante si l'empreinte des données n'a pas changé et utilisent `fetch(..., { keepalive: true })` sans trafic WebSocket bloquant le `bfcache`.

---

## 👤 Comptes, accès laboratoire, PWA & suivi multi-appareils

- **Portail d'accès (`portail.html`, Clair / Sombre)** :
  - Connexion / inscription par **e-mail**, par **téléphone (`+216` + code WhatsApp OTP)** ou par **Badge Laboratoire à 6 caractères (`🪪 Badge Labo`)** ;
  - Récupération complète du mot de passe oublié (`v441`, flux PKCE `token_hash` et implicite redirigés automatiquement vers `portail.html`).
- **Photos élèves validées & Carte d'Abonné (`v445`, `v448`, `v462`)** :
  - Téléversement et recadrage par l'élève dans `photo_attente`, validation en 1 clic par l'enseignant vers `photo_url`, remplacement automatique des initiales dans la roue `⚙️` et dans `admin.html`, et génération de la **Carte Officielle d'Abonné STI V2.0** (PNG HD + planche trombinoscope A4).
- **Bulle d'installation PWA « 1re visite uniquement » (`v466`)** : affichée uniquement lors de la toute première visite et définitivement masquée ensuite ou dès que l'application est installée.
- **Ergonomie unifiée (`v449`–`v454`)** :
  - **Messenger élève** accessible exclusivement via **« Écrire au prof »** dans la roue `⚙️` (aucun bouton Messenger flottant sur les pages élèves ; le dock flottant est réservé à `admin.html`) ;
  - **Barre d'outils PC Windows (`🛠️ ▸`)** conservée et recalée à gauche (`left: 14px`), sans puces dupliquées sur l'accueil ni lien « Conseils » dans l'en-tête de `index.html`.
- **Miroir cloud `sti_progressions` (`sync-progressions.js`)** : fusion monotone des vidéos/audios (`sti-media-prog-v1`), chapitres vus, signets, livres QR et révisions J+1/J+3/J+7, avec purge automatique lors d'un changement de compte sur poste partagé (`v463`).

---

## 🛠️ Tableau de bord administrateur (`admin.html`)

Interface Bento/Spotlight en police **Comic**, ornée du logo officiel (`assets/icons/sti-icon-512.png`), du titre d'état temps réel (`#titre-tb-admin` **vert** connecté / **rouge** `.hors-ligne`), des modes **Clair / Sombre** et des **4 univers approuvés** (`foret`, `cyber`, `pop`, `spotify`), avec **262 boutons interactifs vérifiés** et pagination PostgREST intégrale (`> 1 000` lignes) sur tous les modules :

| Pôle / Outil | Fonctionnalités opérationnelles |
|---|---|
| 👥 **Abonnés & Classes** | Validation/refus avec double confirmation, approbation des photos élèves (individuelle ou en lot), statut 👑 Gold, pause écran, Carte Officielle d'Abonné, Trombinoscope A4, **📋 Fiche Conseil de Classe A4**, Badges Labo A4 et gestion des lycées/classes |
| 🏆 **Quiz & Analyse d'erreurs** | Synthèse élève × quiz (`quiz-admin.js`), vues *Classes*, *Jours*, *Top 3*, *Alertes*, *Progression*, *Questions ratées*, ordre exact des questions tirées et diagnostic cognitif (`admin-erreurs.js` + export CSV) |
| 🔁 **Révision & 🗺️ Couverture** | Suivi J+1/J+3/J+7 (`admin-revision.js`), taux réel d'exploration des **124 pages** (`admin-couverture.js`), repérage des élèves inactifs/à risque, graphiques d'activité (`graphiques-activite.js`) et panneau **📊 Progressions** (`analytique.js`) |
| 🗄️ **DBSupbase (`/ 1 000 lignes`)** | Jauge exacte en direct des **15 tables `public`** via la RPC `public.admin_dbsupbase_niveaux()`, 4 seuils visuels (*Confort*, *Modéré*, *Vigilance ≥ 80 %*, *Seuil atteint ≥ 1 000*), tri/filtre, export CSV et passerelle directe depuis la modale Quota 500 Mo |
| 💬 **Messenger & Séance Live** | Messenger STI flottant temps réel (texte, fichiers, dictée vocale, diffusion par classe, WhatsApp), Appel & Présence A4/CSV, Mains levées, Question Flash, Kahoot Live, Tableau blanc, Coffre TP, Copies TP `/20`, Grille Devoirs DC/DS et Régie « La Cote » |
| 🛡️ **Sécurité, Santé & Sauvegarde** | Centre de Sécurité (Mode Examen, Plein écran, Anti-DevTools, Filigrane), gestion des postes Labo 3, changement du mot de passe admin (`admin-mdp.js` + MFA AAL2), **🩺 Santé du site** (`sante.js`, 36 contrôles en direct) et **💾 Sauvegarde complète** (`sauvegarde.js`) |

---

## 🔐 Sécurité de la plateforme & protection des données

- **PostgreSQL & Row Level Security (`15 / 15` tables protégées)** :
  - Chaque table élève (`sti_progressions`, `sti_quiz_parties`, `sti_quiz_reponses`, `sti_quiz_sessions`, `sti_quiz_vus`, `acces`, `profiles`) applique `auth.uid() = user_id` pour les écritures/lectures individuelles et réserve l'administration à `public.est_admin()` / `public.est_admin_mfa()`.
  - **22 / 22 fonctions SQL du schéma `public`** s'exécutent avec `search_path=public` figé (zéro vulnérabilité de détournement de schéma) ; la RPC `public.admin_sauvegarde_tables_annexes()` exclut explicitement les colonnes sensibles (`secret_hash`).
- **Authentification renforcée & anti-abus** :
  - **Cloudflare Turnstile** actif sur `portail.html` et `admin.html`, **MFA TOTP (`AAL2`)** sur les opérations sensibles administrateur (`admin-mdp.js`, purges, mots de passe), verrouillage anti-brute-force sur la connexion et les badges Labo, et redirection Auth strictement limitée à `https://aymenessouyah.github.io/STiV2.0/**`.
- **Content-Security-Policy (CSP) & hygiène XSS** :
  - En-têtes `<meta http-equiv="Content-Security-Policy">` stricts (`object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, domaines `connect-src` restreints à Supabase, Cloudflare Turnstile et Google Apps Script sur `admin.html`), échappement HTML systématique des entrées et erreurs réseau (`ech` / `echHtml`), et zéro secret commité dans Git.

---

## 🗄️ Base Supabase (15 tables) & Sauvegarde automatique Google Drive

### Les 15 tables `public` sauvegardées avec tri déterministe

| Table `public` | Ordre d'export | Contenu |
|---|---|---|
| `profiles` | `id` | Identité, classe, lycée, statut, Gold, `photo_url`, `photo_attente` |
| `acces` | `id` | Connexions horodatées, durées, pages, messages, `PROG_MEDIA`, `CFG_ECOLES` |
| `sti_progressions` | `user_id` | Miroir cloud `sti-*` par abonné (médias, chapitres, signets, révisions, config Drive admin) |
| `sti_quiz_parties` | `id` | Parties terminées (score, total, points, `ordre_questions`, date) |
| `sti_quiz_reponses` | `id` | Historique question par question (`enonce`, booléen `correct`) |
| `sti_quiz_sessions` | `user_id,quiz,mode` | Parties entamées en cours (clé primaire `(user_id, quiz)`) |
| `sti_quiz_vus` | `user_id,module,question_id` | Questions déjà tirées par abonné et par module |
| `sti_diagnostics` | `id` | Journaux techniques et erreurs clientes remontées silencieusement |
| `sti_observations` | `id` | Observations pédagogiques privées de l'enseignant |
| `labo_devices` | `id` | Postes physiques enregistrés et confirmés du Labo 3 |
| `labo_device_sessions` | `session_id` | Sessions actives des postes du Labo 3 |
| `labo_device_messages` | `id` | Messages directs Professeur ↔ Postes Labo 3 |
| `badges_labo` | `code_hash` | Badges d'accès rapide au laboratoire (6 caractères) |
| `app_config_public` | `id` | Configuration publique (`ecoles`, bandeau d'actualités `ticker_news`) |
| `push_subscriptions` | `id` | Abonnements Web Push enregistrés |

### ☁️ Envoi automatique des données vers Google Drive (`v467` + `v470`)

Deux mécanismes complémentaires garantissent la continuité des sauvegardes dans le dossier Drive **`STI — Sauvegardes base`** au format compressé **`sti-sauvegarde-YYYY-MM-DD.json.gz`** :

1. **Déclencheur autonome Google Apps Script (`documents/sql/sauvegarde-auto-drive.gs` — projet `STISauvegardeSupbase`)** :
   - Exécute chaque nuit vers **02 h (heure de Tunis)** (`installer()` / `installerQuotidien()` → `everyDays(1).atHour(2)`) la lecture paginée par tranches de 1 000 lignes des **15 tables**, compresse l'archive en `.json.gz`, remplace sans doublon toute archive du même jour et purge automatiquement les archives dépassant `RETENTION_MOIS` (6 mois par défaut) ou `RETENTION_JOURS`.
   - Détecte automatiquement le dossier Drive `STI — Sauvegardes base` même si `DRIVE_FOLDER_ID` est omis, et vérifie cryptographiquement le jeton JWT administrateur auprès de `/auth/v1/user` (avec repli sur la clé publique Supabase si `SUPABASE_SERVICE_KEY` n'est pas encore renseignée).
2. **Synchronisation automatique depuis `admin.html` (`assets/js/sauvegarde.js`)** :
   - Dès l'ouverture du tableau de bord, puis **toutes les 30 minutes**, au **retour en ligne (`online`)** et au **réveil de l'onglet (`visibilitychange`)**, `verifierSyncAutoDrive()` déclenche automatiquement une sauvegarde vers Google Drive dès que la dernière archive a plus de **24 h** (`text/plain;charset=utf-8` sans préflight CORS).
   - L'URL Web App configurée est **synchronisée automatiquement entre tous les appareils de l'administrateur** via sa ligne privée `sti_progressions` (tout en restant exclue des fichiers `.json`/`.json.gz` exportés via `NON_RESTAURABLES`).
   - En cas d'absence de `SUPABASE_SERVICE_KEY` côté Apps Script, `sauvegarde.js` bascule automatiquement en mode **`televerser`** : collecte locale des 15 tables via la session admin + RPC `admin_sauvegarde_tables_annexes()` et envoi direct de l'archive vers Drive.

---

## 🚀 Maintenance, tests automatisés & conventions Bac STI

- **Suite de vérification statique et comportementale (`node:test` + `node:vm`)** :
  ```bash
  node --test tests/v302-static.test.mjs tests/password-recovery-v441.test.mjs
  ```
- **Protocole de mise à jour PWA (`sw.js`)** : incrémenter `CACHE` (`sti-atelier-v330`, après `sti-atelier-v329` / `sti-atelier-v328` / `sti-atelier-v327`) et `UPDATE_ID`, lister uniquement les fichiers modifiés en tête de `UPDATE_FILES`, et régénérer `offline-complete-manifest.json` avec les empreintes Git blob exactes.
- **Conventions pédagogiques strictes Bac STI** :
  - **JavaScript** : uniquement les méthodes de l'annexe officielle (`ch[i]`, `substring`, `indexOf`, `lastIndexOf`, `trim`, `toUpperCase`, `toLowerCase`, `replace`, `charCodeAt`, `String.fromCharCode`, `getElementById`, `getElementsByName`, `Date`, `innerHTML`/`textContent`/`document.write`) ;
  - **SQL** : jointures exclusivement dans `WHERE t1.col = t2.col` (aucun `JOIN … ON`) et opérateur `!=` ;
  - **PHP / MySQLi** : procédural `mysqli_*`, arrêt par **`die()` uniquement** (aucun `exit`), validation numérique par `is_numeric()` ;
  - **Hors programme indispensable** : conservé et **barré en rouge** (`.hp`).

---

## 🕘 Historique des versions

| Version | Contenu |
|---|---|
| v358 | Synchronisation centrale des quiz (`sti_quiz_parties` + `sti_quiz_vus` entre appareils) |
| v361 | Révision des 2 Smart Books (3SI 72 p. & 4SI 100 p.) : tableaux complétés et code hors programme barré en rouge |
| v365 | Détail question par question dans `sti_quiz_reponses`, « Mes erreurs » (`revision-erreurs.html`) et analyse des questions ratées |
| v373 | Application PWA installable, thème sombre universel, glossaire FR/AR et graphiques d'activité |
| v391 | Miroir cloud multi-appareils `sti_progressions` (vidéos/audios à la seconde près, signets, livres QR) |
| v396 | Laboratoire SQL de poche (`cours/sql-playground.html`, SQLite WASM 100 % local hors-ligne) |
| v418 | Barre mobile à 5 onglets (`Accueil · Cours · Exercices · Quiz · Autres`) et état cloud dans la roue `⚙️` |
| v436 | Révision espacée J+1 / J+3 / J+7 dans la roue, fiche imprimable `ma-fiche-revision.html` et couverture 124 pages |
| v441 | Récupération fiable du mot de passe oublié (PKCE `token_hash` + redirection automatique vers `portail.html`) |
| v442 | Refonte Bento/Spotlight de `admin.html` en police Comic avec les 4 univers (`foret`, `cyber`, `pop`, `spotify`) |
| v445 | Photos de profil élèves avec validation administrateur remplaçant les initiales dans `admin.html` et la roue `⚙️` |
| v448 | Carte Officielle d'Abonné STI V2.0 (téléchargement PNG HD, studio photo et impression trombinoscope A4) |
| v449 | Mode Rayons X & surligneur dans la roue `⚙️`, Messenger élève réservé à « Écrire au prof » et barre PC `🛠️ ▸` recalée à gauche |
| v455 | Révision des Quiz : mélange CSPRNG des propositions, répartition équilibrée et persistance write-ahead |
| v459 | Carte d'Évaluation Officielle en fin de quiz (PNG HD & impression), points à réviser et conseil ciblé par faute |
| v460 | Sauvegarde et reprise exacte des parties entamées (`sti_quiz_sessions` + `ordre_questions`) sur Supabase |
| v461 | Compteurs de progression vidéo/audio (`PROG_MEDIA`) reliés à `sti_progressions` et protégés des purges |
| v463 | Isolation stricte des comptes sur poste partagé, fusion monotone cloud et exactitude des statistiques admin |
| v465 | Navigation retour ultra-fluide 0 ms via `bfcache` vers `index.html` sans rechargement |
| v466 | Module `DBSupbase` (niveau exact des 15 tables / 1 000 lignes via RPC) et bulle d'installation PWA limitée à la 1re visite |
| v467 | Sauvegarde automatique quotidienne des 15 tables vers Google Drive (`.json.gz`), retours `bfcache` sur `series-exercices` + `pp.html` et documentation (`sti-atelier-v327`) |
| v468 | Audit intégral : liens Défis JS réparés (`javascript.html` & `quiz-tableaux.js`), pagination > 1 000 lignes dans `analytique.js` et contraste multi-univers (`sti-atelier-v328`) |
| v469 | Pagination PostgREST intégrale (> 1 000 lignes) dans `admin.js`, `admin-couverture.js`, `admin-revision.js` et `graphiques-activite.js`, parité hors-ligne 124/124 et ancre `#annexe-html5` (`sti-atelier-v329`) |
| v470 | Validation fonctionnelle E2E en 9 points : tirage aléatoire neuf à chaque connexion, isolation multi-élèves des files quiz, reprise Tableaux réparée, retours `bfcache` 0 ms préservant `history.state` (Quiz, Cours, Exercices), auto-sync Google Drive multi-appareils avec secours direct et réécriture complète des README (`sti-atelier-v330`) |
| v471 | Vérification intégrale de bout en bout (« Tester tout ») : résolution exacte de casse Git sur les 48 pages mixtes dans `roue-revision.js` (zéro 404 GitHub Pages), routage fidèle des vidéos et podcasts dans `reprendre.js` (HTML5, CSS3, JS, SQL, PHP & animations), durcissement XSS de la roue et 43 contrôles temps réel dans `sante.js` (`sti-atelier-v331`) |
| v472 | Audit forensique de toute la plateforme : réparation du rendu HTML des explications de `quiz/php.html` (`<?php`, `<HR>`, `<>`, `<input>`, `<select>`) et du bilan `quiz/sql.html` (`<strong>`), filtrage cohérent 3ᵉ SI hors PHP dans `roue-plan.js`, `ma-fiche-revision.html`, `reprendre.js` et `acces.js` (`sti-atelier-v332`) |
| v473 | Accélération drastique de la plateforme : suppression des 297 téléchargements dupliqués (`85,7 Mo`) dans `sw.js`, fin de la boucle de réinitialisation de version (`316` vs `333`) et des requêtes `sw.js` `no-store` à chaque clic, zéro reflow forcé dans la Roue, chargement différé de `#bloc-sec-quiz` et lissage de `sync-progressions.js` (`sti-atelier-v333`) |
| v474 | Allègement massif des Quiz PHP (`-74,5 %`), SQL (`-77,5 %`) et JS (`-85,3 %`) par pré-compilation Tailwind hors-ligne (`0 ms` JIT) et mutualisation différée `Chart.js`/`Confetti`/`Prism`, déduplication des polices SQL (`-423 Ko`), `defer` sur les exercices Bac PHP et arrêt du minuteur `120 ms` au repos dans `protection.js` (`sti-atelier-v334`) |

---

*STI By A'e — © Aymen Essouyah, Lycée Rafèha. Tous droits réservés.*
