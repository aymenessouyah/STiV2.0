# 📚 STI By A'e — Plateforme STI V2.0 (3ᵉ & 4ᵉ SI)

Plateforme éducative interactive dédiée aux **Sciences et Technologies de l'Informatique** (sections **3SI** et **4SI**, programme officiel du Baccalauréat Tunisien) : cours complets avec **14 vidéos explicatives (`.mp4`)**, chapitrage interactif et écoute vocale synchronisée, **2 livres connectés (Smart Books) avec QR codes**, exercices et séries corrigées, **quiz consolidés à reprise multi-appareils**, révision espacée **J+1 / J+3 / J+7**, suivi de couverture sur **124 pages**, **navigation retour instantanée 0 ms (`bfcache`)**, sauvegarde automatique quotidienne des **15 tables** vers Google Drive et tableau de bord enseignant complet.

> 🌐 **Site en ligne** : https://aymenessouyah.github.io/STiV2.0/
> 👨‍🏫 **Auteur** : Aymen Essouyah — Lycée Rafèha
> 🏗️ **Architecture** : GitHub Pages (HTML/CSS/JS statique) + Supabase (Auth, PostgreSQL + RLS sur 15 tables) + PWA 100 % hors-ligne (`sw.js` `sti-atelier-v327`)
> 📌 **Version active** : **v467** (`sti-atelier-v327` — 26 octobre 2026)

---

## 📖 Sommaire

1. [Contenus pédagogiques](#-contenus-pédagogiques)
2. [Comptes, accès, PWA & navigation instantanée](#-comptes-accès-pwa--navigation-instantanée)
3. [Quiz consolidés, évaluations & révision des erreurs](#-quiz-consolidés-évaluations--révision-des-erreurs)
4. [Progression multi-appareils, couverture & révision espacée](#-progression-multi-appareils-couverture--révision-espacée)
5. [Tableau de bord administrateur (`admin.html`)](#-tableau-de-bord-administrateur-adminhtml)
6. [Architecture technique](#-architecture-technique)
7. [Base de données Supabase (15 tables) & Sauvegarde Google Drive](#-base-de-données-supabase-15-tables--sauvegarde-google-drive)
8. [Publication & maintenance](#-publication--maintenance)
9. [Conventions du code enseigné](#-conventions-du-code-enseigné)
10. [Historique des versions](#-historique-des-versions)

---

## 🎓 Contenus pédagogiques

- **Cours interactifs** HTML5, CSS3, JavaScript, Bases de données & SQL, PHP/MySQLi (`4SI`) :
  - **14 vidéos explicatives (`.mp4`)** avec filigrane officiel, chapitrage cliquable, **écoute vocale `.mp3` synchronisée** avec Guide-Ligne (`0.85×` / `1×` / `1.15×`), reprise automatique à la seconde près et badges **`✅ Vu` / `⏳ En cours`** synchronisés côté administrateur (`PROG_MEDIA`).
  - **SQL de poche (`cours/sql-playground.html`)** : moteur SQLite WASM 100 % local avec 3 bases de révision et historique hors-ligne.
- **Smart Books (livres connectés)** — 2 manuels PDF (`documents/livre/`) :
  - *4ᵉ SI* (100 pages) et *3ᵉ SI* (72 pages) : fiches de cours, exercices et **tableaux récapitulatifs** finaux.
  - **Un QR code par page** ouvrant directement la ressource correspondante (`livre-smart.html?livre=…&page=N`) avec mémorisation cloud de la dernière page lue.
- **Annexes officielles** du programme (`documents/annexes/`) : mise en page unifiée ; le code hors programme indispensable y est **barré en rouge** (`.hp`), jamais supprimé.
- **Séries d'exercices & laboratoires** (`exercices/series-exercices.html` + 41 fiches TP et corrigés HTML/CSS, JavaScript, SQL séries 1 à 6 corrigées en vidéo, PHP séries 1 à 5 + remise en ordre Bac), **37 Défis JS**, **Atelier Bac Pratique** (`bac-pratique.html`), **Projet STI 0**, **25 pièges du Bac** (`pieges-bac.html`), **10 fonctions JavaScript** (`outils-js-bac.html`), **Mémo veille** (`memo-veille-bac.html`) et **Glossaire FR/AR** (`glossaire.html`).
- **Optimisé 3G & Mobile** : chargement différé des médias (`preload="none"` sur les animations lourdes), barre mobile basse à 5 onglets (`Accueil · Cours · Exercices · Quiz · Autres`) sans clignotement (`#sti-bnav-skel`) et enroulement fluide des barres au défilement (`v428`).

---

## 👤 Comptes, accès, PWA & navigation instantanée

- **Modes d'inscription et de connexion (`portail.html`, thèmes Clair / Sombre)** :
  - par **e-mail** ou **téléphone (`+216`)** avec validation WhatsApp OTP à 6 chiffres ;
  - par **Badge Laboratoire à 6 caractères (`🪪 Badge Labo`)** avec protection anti-brute-force et confirmation des postes Salle Info (Labo 3) ;
  - **Récupération robuste du mot de passe oublié (`v441`)** : prise en charge complète des liens PKCE (`token_hash`) et implicites, avec transfert automatique vers `portail.html` par `config.js` si Supabase redirige vers la racine.
- **Photos de profil & Cartes officielles (`v444`–`v448`, `v462`)** :
  - Chaque élève peut téléverser/recadrer sa photo depuis la roue `⚙️` (stockée en `photo_attente`), soumise à **validation de l'administrateur** avant publication dans `photo_url`.
  - Une fois validée, la photo remplace automatiquement le carré d'initiales au centre de la roue `⚙️` comme dans le tableau de bord et sur la **Carte Officielle d'Abonné STI V2.0** (téléchargeable en PNG HD et imprimable en planche trombinoscope A4).
- **Installation PWA (« 1re visite uniquement », `v466`)** :
  - La bulle d'invitation à installer l'application ne s'affiche **qu'à la toute première visite** ; dès la visite suivante ou une fois l'application installée (`appinstalled` / mode `standalone` / `getInstalledRelatedApps`), plus aucune bulle redondante n'apparaît.
- **Navigation retour instantanée 0 ms sans rechargement (`v465` + `v467`)** :
  - Cliquer sur « Retour », « Accueil », « Cours », « Exercices » ou « Quiz » depuis n'importe quel cours, quiz (y compris `quiz/pp.html`) ou fiche d'exercice remonte directement par **`bfcache` (`history.go(-delta)`)** vers `index.html` (`#modules`, `#cours`, `#exercices`, `#top`) ou vers `exercices/series-exercices.html` (`#css3`, `#javascript`, `#bdd`, `#php`) en **0 ms, sans recharger le document**.
- **Ergonomie épurée (`v449`–`v454`)** :
  - **Messenger côté élève uniquement dans la roue `⚙️` (« Écrire au prof »)** ; le bouton Messenger flottant n'existe que sur `admin.html`.
  - **Barre d'outils PC Windows (`🛠️ ▸`)** conservée et recalée proprement en bas à gauche (`left: 14px`), sans puces d'outils dupliquées sur l'accueil.

---

## 🏆 Quiz consolidés, évaluations & révision des erreurs

- **5 modules actifs + banque consolidée (`assets/data/quiz-banque.json`, 635 questions)** :
  - `quiz/html-css.html` (141 q.), `quiz/javascript.html` (106 q.), `quiz/sql.html` (140 q.), `quiz/php.html` (176 q., avec redirection propre depuis `quiz/pp.html`) et `quiz/tableaux.html` (tableaux officiels 3SI/4SI).
- **Équité & anti-biais (`v455`–`v458`)** : propositions mélangées aléatoirement à chaque question, répartition équilibrée des bonnes réponses (`A/B/C/D`), zéro série consécutive sur le même indice, et tirage sans répétition inter-appareils (`sti_quiz_vus`).
- **Synchronisation temps réel, reprise exacte & file hors-ligne (`assets/js/quiz-sync.js`, `v455`–`v460`)** :
  - Sauvegarde **write-ahead** synchrone avant toute navigation retour ;
  - Reprise exacte d'une partie en cours (score, points, question courante et `ordre_questions`) entre appareils via `sti_quiz_sessions` ;
  - Historique complet des parties (`sti_quiz_parties`) et détail question par question (`sti_quiz_reponses`, colonne booléenne `correct`) envoyés immédiatement en ligne ou vidés automatiquement dès le retour réseau (`STIQuizSync.viderFile()`).
- **Révision ciblée & Carte d'évaluation (`v455`, `v459`)** :
  - `revision-erreurs.html` regroupe les erreurs de l'élève et relance automatiquement une séance ciblée (`?revision=erreurs`) ;
  - Chaque fin de quiz génère une **Carte d'Évaluation Officielle STI V2.0** téléchargeable en PNG HD et imprimable.
- 🔬 **Exception compte partagé laboratoire (`elevelabo3@exemple.tn`)** : tirage et fonctionnement 100 % locaux au poste, aucun score envoyé dans le nuage et exclusion systématique de toutes les statistiques et alertes de l'admin.

---

## ☁️ Progression multi-appareils, couverture & révision espacée

- **Miroir cloud `sti_progressions` (`assets/js/sync-progressions.js`, `v391`–`v463`)** :
  - Synchronisation bidirectionnelle monotone des progressions vidéo/audio (`sti-media-prog-v1`), chapitres vus (`sti-chapitres-vus`), signets de lecture (`sti-reading-bookmarks`), pages vues, révisions espacées et manuels connectés.
  - **Isolation stricte sur poste partagé (`v463`)** : changement de compte = nettoyage automatique des clés locales de l'élève précédent, et exclusion des clés d'authentification ou de réglages admin (`sti-cred`, `sti-offline`, `sti-sec-config`, `sti-admin-palette`).
- **Couverture des 124 pages de contenu (`roue-couverture.js` + `assets/pages-couverture.json`)** : l'anneau autour du bouton `⚙️` affiche en direct le pourcentage réel du site exploré par l'élève.
- **Révision espacée J+1 / J+3 / J+7 & Plan jusqu'au Bac (`roue-revision.js`, `roue-plan.js`, `ma-fiche-revision.html`)** : planification automatique des rappels, fiche personnelle imprimable et rappels locaux opt-in (`rappels-locaux.js`).
- **Journal d'erreurs client (`sti_diagnostics`, `v394`)** : remontée silencieuse et dédupliquée des anomalies JS/ressources vers le tableau de bord professeur (`?diags=off` pour désactiver en test).

---

## 🛠️ Tableau de bord administrateur (`admin.html`)

Interface enseignant en police **Comic** avec logo officiel STI (`assets/icons/sti-icon-512.png`), indicateur d'état temps réel sur le titre (`#titre-tb-admin` vert connecté / rouge `.hors-ligne`), thèmes **Clair / Sombre** et **4 univers visuels** (`foret`, `cyber`, `pop`, `spotify`), recherche globale `Ctrl+K`, verrouillage rapide par code PIN et changement sécurisé du mot de passe admin (`admin-mdp.js`).

| Onglet / Module | Fonctionnalités clés |
|---|---|
| 👥 **Abonnés & Classes** | Gestion complète avec double confirmation (`Annuler` / `Confirmer`), validation des photos élèves (`v445`), statut 👑 Gold, pause écran, **Carte Officielle d'Abonné** & trombinoscope A4 (`v448`/`v462`), **📋 Conseil de Classe** et bulletin PDF A4 |
| 🏆 **Quiz & Bac** | Tableau détaillé élève × quiz, vues Par classe, Par jour, Top 3, Alertes, Progression, Questions ratées (`quiz-admin.js`) et analyse cognitive des erreurs (`admin-erreurs.js`) |
| 🔁 **Révision espacée** | Adhésion réelle aux rappels J+1/J+3/J+7, pages en retard, pages acquises, quiz faibles (< 10/20) et export CSV (`admin-revision.js`) |
| 🗺️ **Couverture (124 p.)** | Taux d'exploration réel par élève (pages vues + signets + chapitres vus), détection des élèves à risque et export CSV (`admin-couverture.js`) |
| 🗄️ **DBSupbase (`v466`)** | Surveillance exacte des **15 tables `public`** par rapport au plafond PostgREST de **1 000 lignes** via la RPC SQL `public.admin_dbsupbase_niveaux()` (4 paliers : Confort, Modéré, Vigilance ≥ 800, Seuil atteint ≥ 1 000 + badge d'alerte et export CSV) |
| 📨 **Messages & Direct** | Messenger STI flottant bidirectionnel (pièces jointes, micro, diffusion par classe, WhatsApp), Question Flash, Appel / Présence, Mains levées, Copies TP `/20`, Grille Devoirs DC/DS et Régie des news « La Cote » (`app_config_public`) |
| 🕒 **Connexions & Sécurité** | Historique paginé des sessions (`acces`), gestion et confirmation des postes Labo 3 (`labo_devices`), Centre de Sécurité (Mode Examen, Plein écran, Anti-DevTools, Filigrane), Journal des erreurs (`sti_diagnostics`) et **💾 Sauvegarde complète 15 tables** (`sauvegarde.js`) |

---

## 🧱 Architecture technique

- **Frontend 100 % statique** (aucun serveur PHP requis en production, zéro dépendance CDN pour l'authentification : `assets/js/supabase-umd.js` est embarqué localement pour fonctionner en salle informatique sans Internet).
- **Service Worker incrémental (`sw.js` — `sti-atelier-v327`)** : ne retélécharge sur mobile que les fichiers listés dans la nouvelle révision de `UPDATE_FILES`, tout en maintenant le manifeste complet hors-ligne (`offline-complete-manifest.json`).
- **Modules JavaScript principaux (`assets/js/`)** :
  - `config.js` — configuration Supabase, redirection récupération mot de passe (`v441`), amorçage barre mobile sans flash, moteur `bfcache` 0 ms (`index.html` + `series-exercices.html`, `v465`/`v467`) et état d'installation PWA global (`v466`) ;
  - `acces.js` — contrôle d'accès, roue candidat `⚙️`, recherche globale, signets, mode veilleuse, suivi média (`chargé sur toutes les pages élèves, jamais sur portail.html ni admin.html`) ;
  - `mobile-nav.js` — barre mobile à 5 onglets + chargement modulaire de la roue (`roue-nuage.js`, `roue-habillage.js`, `roue-initiales.js`, `roue-couverture.js`, `roue-revision.js`, `roue-plan.js`, `rappels-locaux.js`, `rayonsx-surligneur.js`) ;
  - `sync-progressions.js` — miroir cloud `sti_progressions` + remontée `sti_diagnostics` ;
  - `quiz-sync.js`, `quiz-tableaux.js`, `quiz-admin.js` — moteur de synchronisation, reprise et analytique des quiz ;
  - `admin.js`, `admin-dbsupbase.js`, `admin-couverture.js`, `admin-revision.js`, `admin-erreurs.js`, `admin-mdp.js`, `graphiques-activite.js`, `analytique.js`, `sauvegarde.js`, `sante.js` — briques du tableau de bord enseignant.

---

## 🗄️ Base de données Supabase (15 tables) & Sauvegarde Google Drive

Toutes les **15 tables du schéma `public`** ont **Row Level Security (`RLS`) activée** sur le projet Supabase `vywujxmepvcbgedgmger` :

| Table `public` | Clé de tri déterministe | Rôle |
|---|---|---|
| `profiles` | `id` | Profils abonnés (identité, classe, lycée, statut, Gold, `photo_url`, `photo_attente`) |
| `acces` | `id` | Journal horodaté des sessions, durées, pages et événements (`PROG_MEDIA`, `CFG_ECOLES`) |
| `sti_progressions` | `user_id` | Miroir cloud multi-appareils des clés `sti-*` de chaque élève |
| `sti_quiz_parties` | `id` | Historique complet des parties terminées (score, total, %, points, `ordre_questions`) |
| `sti_quiz_reponses` | `id` | Détail question par question (`enonce`, booléen `correct`) |
| `sti_quiz_sessions` | `user_id,quiz,mode` | Parties de quiz en cours pour reprise multi-appareils |
| `sti_quiz_vus` | `user_id,module,question_id` | Questions déjà tirées par élève et par module |
| `sti_diagnostics` | `id` | Journal d'erreurs techniques remontées depuis les pages élèves |
| `sti_observations` | `id` | Carnet d'observations pédagogiques de l'enseignant |
| `labo_devices` | `id` | Postes physiques enregistrés et confirmés de la salle Labo 3 |
| `labo_device_sessions` | `session_id` | Sessions actives des postes du laboratoire |
| `labo_device_messages` | `id` | Messages directs envoyés aux postes du laboratoire |
| `badges_labo` | `code_hash` | Badges d'accès rapide laboratoire (empreintes hachées) |
| `app_config_public` | `id` | Configuration publique temps réel (`ecoles`, bandeau `ticker_news`) |
| `push_subscriptions` | `id` | Abonnements Web Push des appareils autorisés |

### Migrations SQL principales (`supabase/migrations/` & `documents/sql/`)

| Fichier | Objet |
|---|---|
| `MIGRATION-v312-CONFIRMATION-POSTES.sql` & `MIGRATION-v314-LABO3-COMPLETE.sql` | Postes, sessions et sécurité de la salle informatique Labo 3 |
| `MIGRATION-v358-QUIZ-SYNC.sql` & `MIGRATION-v365-REPONSES.sql` | Tables `sti_quiz_parties`, `sti_quiz_vus` et `sti_quiz_reponses` |
| `documents/sql/sti_progressions.sql`, `sti_progressions-admin.sql`, `sti_diagnostics.sql`, `sti_observations.sql` | Miroir cloud, journal d'erreurs et carnet d'observations |
| `supabase/migrations/20261025_student_photos_v445.sql` | Colonnes `photo_url` / `photo_attente` et workflow de validation admin |
| `supabase/migrations/20261025_quiz_consolidation_v456.sql` & `20261025_quiz_sessions_ordre_v460.sql` | Politiques `DELETE` admin quiz + reprise d'ordre exact `sti_quiz_sessions` |
| `supabase/migrations/20261026_dbsupbase_niveaux_v466.sql` | RPC `public.admin_dbsupbase_niveaux()` (comptage exact des 15 tables vs seuil 1 000) |
| `supabase/migrations/20261026_sauvegarde_complete_v467.sql` | RPC `public.admin_sauvegarde_tables_annexes()` (export admin sécurisé des tables annexes sans secrets) |

### 💾 Sauvegarde automatique quotidienne vers Google Drive (`v467`)

- **Script Apps Script versionné** : `documents/sql/sauvegarde-auto-drive.gs` (projet Google Apps Script `STISauvegardeSupbase`, dossier Drive `STI — Sauvegardes base`).
- **Couverture intégrale** : export paginé (par tranches de 1 000 lignes avec tri déterministe multi-colonnes `.asc`) des **15 tables `public`** en archive compressée `sti-sauvegarde-YYYY-MM-DD.json.gz` chaque nuit vers **02 h (heure de Tunis)** via `installer()` / `installerQuotidien()`, avec déduplication automatique du jour et rotation (`RETENTION_MOIS` / `RETENTION_JOURS`).
- **Depuis `admin.html` (`💾 Sauvegarde complète`, `assets/js/sauvegarde.js`)** : export local en un clic au format `.json.gz` (identique à Drive) ou `.json`, copie en un clic du script Apps Script `v467`, et synchronisation automatique 1× / 24 h ou à la demande via l'URL Web App `doPost` vérifiée par jeton JWT administrateur Supabase.

---

## 🚀 Publication & maintenance

- **Tests automatisés sans dépendance externe** : `node --test tests/v302-static.test.mjs tests/password-recovery-v441.test.mjs` (vérifications statiques, sécurité, CSP, cohérence des banques de quiz et simulations comportementales `node:vm`).
- **Règle Service Worker & cache-busters** : à chaque publication, incrémenter `CACHE` (`sti-atelier-vNNN`) et `UPDATE_ID` dans `sw.js`, déclarer uniquement les fichiers modifiés en tête de `UPDATE_FILES`, et régénérer `offline-complete-manifest.json`.
- ⚠️ **Sécurité des secrets** : aucune clé secrète (`service_role`, Turnstile Secret, jeton OAuth/PAT) ni aucune archive de données élèves ne doit jamais être commitée dans Git.

---

## ✍️ Conventions du code enseigné

Harmonisées sur **100 % des supports** (cours, Smart Books, séries d'exercices et quiz) :

- **JavaScript** : strictement limité aux fonctions et propriétés de l'annexe officielle STI (`ch[i]`, `substring`, `indexOf`, `lastIndexOf`, `trim`, `toUpperCase`, `toLowerCase`, `replace`, `charCodeAt`, `String.fromCharCode`, `getElementById`, `getElementsByName`, `Date`, `innerHTML`/`textContent`/`document.write`).
- **SQL** : jointures écrites exclusivement dans `WHERE table1.col = table2.col` (aucune syntaxe `JOIN … ON`) et opérateur `!=`.
- **PHP / MySQLi** : procédural `mysqli_*`, arrêt par **`die()` uniquement** (aucun `exit`), validation numérique par `is_numeric()` (pas de `ctype_digit`), aucun `date_default_timezone_set`.
- **Code hors programme indispensable** : conservé et **barré en rouge** (`.hp`), jamais supprimé.

---

## 🕘 Historique des versions

| Version | Contenu |
|---|---|
| v358 | Synchronisation centrale des quiz (`sti_quiz_parties` + `sti_quiz_vus` entre appareils) |
| v359 | Audit de conformité aux tableaux des Smart Books et harmonisation `die()` / `is_numeric()` |
| v361 | Révision des 2 Smart Books (3SI 72 p. & 4SI 100 p.) : tableaux complétés et barrés rouges |
| v362 | Envoi automatique des scores dès le retour de connexion et exception du compte partagé `elevelabo3` |
| v363 | Tableau de bord admin : vues quiz par classe, par jour, Top 3 et détail par candidat |
| v364 | Alertes pédagogiques (difficulté, inactivité ≥ 7 j, jamais joué) et suivi de progression |
| v365 | Détail question par question dans `sti_quiz_reponses` et analyse des questions les plus ratées |
| v367 | Quiz rejouables à l'infini avec conservation intégrale de l'historique des parties |
| v373 | Application PWA installable, thème sombre universel, glossaire FR/AR et graphiques d'activité |
| v380 | Retour intelligent du lecteur Smart Book vers la page exacte ouverte par QR code |
| v389 | Recherche globale `Ctrl+K` partagée entre l'accueil élève et le tableau de bord admin |
| v391 | Miroir cloud multi-appareils `sti_progressions` (vidéos/audios à la seconde près, signets, livres) |
| v392 | Carte des difficultés par chapitre dans la Vue d'ensemble administrateur |
| v394 | Journal d'erreurs techniques des pages élèves (`sti_diagnostics` + interface de suivi admin) |
| v396 | Laboratoire SQL de poche (`cours/sql-playground.html`, SQLite WASM 100 % local hors-ligne) |
| v397 | Carnet d'observations pédagogiques par élève (`sti_observations`, protégé par RLS admin) |
| v400 | Bandeau défilant « La Cote » sur la page d'accueil (cotations technos + dernières nouvelles) |
| v402 | Régie des news du bandeau dans `admin.html` via `app_config_public` (`ticker_news`) |
| v413 | Barre de navigation mobile fixe en bas d'écran injectée automatiquement par `config.js` |
| v418 | Barre mobile à 5 onglets (`Accueil · Cours · Exercices · Quiz · Autres`) et état cloud dans la roue `⚙️` |
| v424 | Le logo d'en-tête ouvre directement le sommaire mobile sur les cours CSS3, SQL, PHP et JavaScript |
| v425 | Amorçage précoce `<script id="sti-early-boot">` : zéro flash de thème ni disparition de la barre mobile |
| v428 | Enroulement fluide des barres haute et basse au défilement sur tous les cours et séries d'exercices |
| v431 | Initiales `P.N` au centre du bouton de la roue `⚙️` |
| v432 | Anneau dynamique de couverture du site autour de la roue `⚙️` |
| v435 | Suivi admin de la couverture par élève, détection des élèves à risque et export CSV |
| v436 | Révision espacée J+1 / J+3 / J+7 dans la roue, fiche imprimable `ma-fiche-revision.html` et rappels locaux |
| v438 | Suivi enseignant de la révision espacée (`assets/js/admin-revision.js`) + export CSV |
| v439 | Plan de révision jusqu'au Bac dans la roue `⚙️` et analyse cognitive des erreurs (`admin-erreurs.js`) |
| v440 | Changement sécurisé du mot de passe administrateur depuis le tableau de bord (`admin-mdp.js`) |
| v441 | Récupération fiable du mot de passe oublié (PKCE `token_hash` + redirection automatique vers `portail.html`) |
| v442 | Refonte Bento/Spotlight de `admin.html` en police Comic avec 4 univers visuels (`foret`, `cyber`, `pop`, `spotify`) |
| v444 | Logo officiel STI (`sti-icon-512.png`), indicateur réseau vert/rouge sur le titre admin et Badge Officiel Administrateur |
| v445 | Photos de profil des élèves avec validation administrateur remplaçant les initiales dans l'admin et la roue `⚙️` |
| v448 | Carte Officielle d'Abonné STI V2.0 (téléchargement PNG HD, studio photo et impression trombinoscope A4) |
| v449 | Mode Rayons X & surligneur dans la roue `⚙️`, Messenger élève réservé à « Écrire au prof » et barre PC `🛠️ ▸` recalée à gauche |
| v453 | Harmonisation des thèmes Clair/Sombre, du logo officiel et de `acces.js` sur `ma-fiche-revision`, `glossaire`, `revision-erreurs` et `404` |
| v454 | Épuration de la barre de navigation haute de `index.html` (retrait du lien « Conseils » redondant) |
| v455 | Révision complète des Quiz : mélange des options, répartition équilibrée des réponses et write-ahead vers `revision-erreurs.html` |
| v456 | Consolidation des Quiz (Lots A–D) : politiques RLS `DELETE`, redirection `quiz/pp.html` → `php.html` et mode sombre Tableaux sous CSP |
| v459 | Carte d'Évaluation Officielle en fin de quiz (PNG HD & impression) et fiabilisation des compteurs |
| v460 | Sauvegarde et reprise exacte des parties en cours (`sti_quiz_sessions` + `ordre_questions`) sur Supabase |
| v461 | Correction des compteurs de progression vidéo/audio (`PROG_MEDIA`) et de leur agrégation côté admin |
| v462 | Réparation complète des boutons et de l'impression dédiée de la Carte Officielle d'Abonné dans `admin.html` |
| v463 | Audit intégral : isolation des comptes sur poste partagé, fusion monotone cloud et exactitude des statistiques admin |
| v464 | Correctifs E2E : purges quota sécurisées, WhatsApp sans numéro, couverture signets/chapitres et sauvegarde `labo_devices` |
| v465 | Navigation retour ultra-fluide 0 ms via `bfcache` vers `index.html` sans rechargement et suppression du prérendu lourd |
| v466 | Module `DBSupbase` (niveau exact des 15 tables / 1 000 lignes via RPC) et bulle d'installation PWA limitée à la 1re visite |
| v467 | Sauvegarde automatique quotidienne des 15 tables vers Google Drive (`.json.gz`), retours `bfcache` sur `series-exercices` + `pp.html` et refonte des README |

---

*STI By A'e — © Aymen Essouyah, Lycée Rafèha. Tous droits réservés.*
