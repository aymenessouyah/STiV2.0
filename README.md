# 📚 STI By A'e — Plateforme STI (3ᵉ & 4ᵉ SI)

Plateforme éducative interactive pour les **Sciences et Technologies de l'Informatique** (sections **3SI** et **4SI**, programme Tunisien) : cours complets avec vidéos, exercices corrigés, **livres connectés (Smart Books) avec QR codes**, quiz synchronisés entre appareils, **reprise de progression multi-appareils**, recherche globale, signets, mode veilleuse, journal d'erreurs et tableau de bord enseignant complet.

> 🌐 **Site en ligne** : https://aymenessouyah.github.io/STiV2.0/
> 👨‍🏫 **Auteur** : Aymen Essouyah — Lycée Rafèha
> 🏗️ **Hébergement** : GitHub Pages (site statique) + Supabase (comptes & données) — PWA installable, fonctionne hors-ligne

---

## 📖 Sommaire

1. [Contenus pédagogiques](#-contenus-pédagogiques)
2. [Comptes & accès](#-comptes--accès)
3. [Quiz : règles et synchronisation](#-quiz--règles-et-synchronisation)
4. [Progression multi-appareils](#-progression-multi-appareils)
5. [Tableau de bord admin](#-tableau-de-bord-admin)
6. [Architecture technique](#-architecture-technique)
7. [Base de données & migrations](#-base-de-données--migrations)
8. [Publication & maintenance](#-publication--maintenance)
9. [Conventions du code enseigné](#-conventions-du-code-enseigné)
10. [Historique des versions](#-historique-des-versions)

---

## 🎓 Contenus pédagogiques

- **Cours** HTML5, CSS3, JavaScript, Bases de données & SQL, PHP/MySQLi : leçons interactives, vidéos commentées avec chapitrage, écoute vocale, exemples exécutables.
- **Smart Books (livres connectés)** — 2 livres PDF (`documents/livre/`) :
  - *4ᵉ SI* (100 pages) et *3ᵉ SI* (72 pages) : fiches de cours, exercices et **tableaux récapitulatifs** finaux.
  - **Un QR code par page** : il ouvre la partie du site correspondante (`livre-smart.html?livre=…&page=N`). La pagination imprimée ne doit donc **jamais** changer sans régénérer les QR.
  - Les tableaux des livres sont la **source officielle** du contenu des quiz.
  - Le lecteur connecté **mémorise la dernière page lue** par manuel et y reprend la lecture (depuis n'importe quel appareil).
- **Annexes officielles** du programme (`documents/annexes/`) : mêmes couleurs, même format ; le code hors programme indispensable y est **barré en rouge** (classe `.hp`), jamais supprimé.
- **Exercices & séries SQL corrigées**, défis JavaScript, récapitulatifs PHP, épreuves du Bac pratique.
- **Pensé 3G** : toutes les images en chargement différé, et les démos vidéo lourdes (ex. animation `display` du chapitre CSS3) en `preload="none"` — zéro octet téléchargé avant d'appuyer sur ▶.

## 👤 Comptes & accès

- Inscription **e-mail** ou **téléphone (+216)** avec code de validation WhatsApp ; connexion par badge laboratoire en salle informatique.
- Comptes gérés par **Supabase Auth** ; profils dans la table `profiles` (nom, prénom, **classe**, lycée…). *Ne jamais activer « Confirm email »* (validation gérée côté plateforme + administrateur).
- **Quiz réservés aux abonnés connectés.**
- Compte partagé du laboratoire : `elevelabo3@exemple.tn` (voir exception ci-dessous).

## 🏆 Quiz : règles et synchronisation

- **Banques séparées 3SI et 4SI**, questions limitées strictement aux sources autorisées : tableaux récapitulatifs des 2 livres, 37 Défis JavaScript et Récap PHP. La banque consolidée est publiée dans `assets/data/quiz-banque.json` (635 questions).
- **Tirage aléatoire à chaque visite, sans jamais répéter** une question déjà vue — sur **tous les appareils** de l'élève (table `sti_quiz_vus`).
- **Rejouables à l'infini** : **chaque partie est conservée** (score, total, %, date) dans `sti_quiz_parties`, ce qui donne dernier score, meilleur score, % moyen, nombre de parties et l'historique détaillé.
- **Fonctionnement de la synchronisation** (`assets/js/quiz-sync.js`) :
  - en ligne : envoi immédiat en fin de partie ;
  - hors ligne : file d'attente locale sur l'appareil ;
  - **dès le retour de la connexion** (événement `online`) ou au prochain chargement d'un quiz : envoi automatique, sans action de l'élève.
- **Détail question par question** (depuis la v365) : chaque réponse (énoncé, juste/faux) part dans `sti_quiz_reponses` pour l'analyse des questions les plus ratées.
- 🔬 **Exception compte labo** (`elevelabo3@exemple.tn`) : **aucun score en ligne** (compte partagé par toute la classe) ; distribution aléatoire **locale** à chaque poste ; banque de quiz mise à jour avec le site, comme pour tous. Il est **exclu des statistiques** de l'admin.

## ☁️ Progression multi-appareils (depuis v391)

Le script `assets/js/sync-progressions.js` (chargé sur les **117 pages** du site) miroir bidirectionnel de tout ce qui porte la préférence `sti-*` dans la table cloud `sti_progressions` : avancement du tableau de bord, **progression vidéo/audio par chapitre** (reprise automatique à la seconde près, puce « ⏪ Reprendre à mm:ss »), **dernière page de Smart Book**, signets, veilleuse. Sans session ni connexion, le site fonctionne exactement comme avant (local uniquement).

**Journal d'erreurs (v394)** : le même module signale silencieusement les erreurs JS, promesses rejetées et ressources introuvables des pages élèves vers `sti_diagnostics` — uniquement pour les élèves connectés, une même erreur au plus tous les 3 jours par appareil, arrêt automatique après 2 échecs réseau (table absente). `?diags=off` dans l'URL coupe le rapport pendant les tests.

## 🛠️ Tableau de bord admin

Page `admin.html` (**2 modes seulement : Clair / Sombre**, style « carte de visite », même palette partout, tout lisible dans les deux thèmes). Groupes de navigation : Outils, Scolarité, Classe, Connexion — plus une **aide intégrée « ❓ Aide & rappels »**, la **recherche globale Ctrl+K** (v389, partagée avec le panneau de recherche des élèves : 302 entrées), et le raccourci d'**annulation des dernières actions** (v388).

Dans le bloc des résultats de quiz synchronisés (`assets/js/quiz-admin.js`) :

| Vue | Contenu |
|---|---|
| Tableau détaillé | Par élève × quiz : parties, dernier / meilleur score, % moyen ; clic = toutes les parties + questions les plus ratées de l'élève |
| 🏫 **Par classe** | Élèves actifs, parties, % moyen, dernière activité — cliquable vers le détail par candidat |
| 📅 **Par jour** | 14 derniers jours : parties, élèves actifs, % moyen, barre d'activité |
| 🏆 **Top 3 par classe** | Podium par % moyen (départage : nombre de parties) |
| 🚨 **Alertes** | En difficulté (% moyen < 50 %, ≥ 2 parties), inactifs ≥ 7 jours, inscrits n'ayant jamais joué |
| 📈 **Progression** | Premier → dernier score, écart en points (+ Δ dans le détail par classe) |
| 🔍 **Questions ratées** | % de réussite par quiz, questions les plus échouées (≥ 2 tentatives), élèves en échec par question |

Dans la **Vue d'ensemble** (en bas des cartes) :

| Bloc | Contenu |
|---|---|
| 🗺️ **Carte des difficultés par chapitre** (v392) | Par classe : % d'écoutes vidéo/audio terminées (relevés `PROG_MEDIA`), % de réussite aux quiz du module, temps moyen sur les pages ; signaux 🟢🟠🔴 — calculée à la demande, aucune requête au chargement |
| 🧾 **Journal des erreurs** (v394) | 200 dernières lignes signalées par les pages élèves, élève identifié, filtre « non lues », marquage lu / tout marquer lu |

La **classe** affichée vient du champ `classe` du profil (section Abonnés). Limites d'affichage : 5 000 parties et 8 000 réponses les plus récentes.

## 🧱 Architecture technique

- **GitHub Pages** : site 100 % statique (HTML/CSS/JS), PWA installable et utilisable hors-ligne (service worker `sw.js` à manifeste d'update cumulatif).
- **Supabase** : authentification, profils et tables protégées par **RLS** (chaque élève ne voit que ses données ; l'admin lit via politique par e-mail `auth.jwt()`). L'accès Supabase n'existe **que** dans `assets/js/*.js` (jamais de PHP, jamais inline dans les pages).
- Fichiers clés :
  - `assets/js/acces.js` — cœur de la plateforme (verrou d'accès, panneau Mon Compte, recherche, signets, veilleuse, progression média) — **851 Ko, chargé sur toutes les pages SAUF `portail.html` et `admin.html`** ;
  - `assets/js/sync-progressions.js` — miroir cloud `sti-*` + journal d'erreurs ;
  - `assets/js/protection.js` — lecteur vidéo/chapitrage, reprise de lecture ;
  - `assets/js/quiz-sync.js` — synchronisation des quiz (parties, vus, réponses, file hors-ligne, exception labo) ;
  - `assets/js/quiz-tableaux.js` — moteur du Quiz des tableaux ;
  - `assets/js/quiz-admin.js` — statistiques quiz du tableau de bord ;
  - `assets/js/smart-book.js` — lecteur des 2 manuels connectés ;
  - `assets/js/supabase-umd.js` — le SDK est **local** (aucune dépendance CDN, fonctionne en salle sans Internet) ;
  - `quiz/*.html` — les 6 quiz (html-css, javascript, sql, php, pp, tableaux) ;
  - `admin.html` — tableau de bord (aide intégrée incluse).

## 🗄️ Base de données & migrations

À exécuter **une seule fois** dans Supabase (SQL Editor) — toutes déjà appliquées en production :

| Fichier | Objet |
|---|---|
| `MIGRATION-v312-CONFIRMATION-POSTES.sql` | Confirmation des postes du labo |
| `MIGRATION-v314-LABO3-COMPLETE.sql` | Complément salle informatique (labo 3) |
| `MIGRATION-v358-QUIZ-SYNC.sql` | Tables `sti_quiz_parties` et `sti_quiz_vus` |
| `MIGRATION-v365-REPONSES.sql` | Table `sti_quiz_reponses` (détail question par question) |
| `documents/sql/sti_progressions.sql` | Table `sti_progressions` (miroir de progression multi-appareils) |
| `documents/sql/sti_progressions-admin.sql` | Politique « admin lit tout » pour `sti_progressions` |
| `documents/sql/sti_diagnostics.sql` | Table `sti_diagnostics` + RLS (journal d'erreurs : l'élève insère, l'admin lit/marque) |

Sauvegarde automatique des profils vers Google Drive (Apps Script `sauvegarde-auto-drive`, un seul fichier `.json.gz` conservé).

## 🚀 Publication & maintenance

- Publication sur GitHub via **clé SSH de déploiement** (deploy key avec accès en écriture, enregistrée dans les paramètres du dépôt) — aucun jeton à manipuler.
- Convention de commits : `vNNN Description courte` ; vérifier après chaque push la présence des changements sur le site en ligne (cache CDN ~10 min, forcer avec `?z=…`).
- **Règle de cache-buster** : toute modification de `acces.js` ⇒ incrémenter `?v=` **sur chacune des 117 pages** (compteurs indépendants par page) et déclarer la nouvelle révision dans `UPDATE_FILES` du `sw.js` + changer `UPDATE_ID`. Pages hors `sw.js` = invisibles du cache offline.
- ⚠️ Ne jamais stocker de secret (jeton, clé privée, clé Turnstile *Secret*) dans le dépôt ou dans les messages.
- Le dépôt est à l'état **v395** ; l'audit de conformité cours/livres/exercices/quiz ↔ annexes (23/10) est consigné à la racine : `RAPPORT-conformite-annexes.md`.

## ✍️ Conventions du code enseigné

Harmonisées sur **tous** les supports (site, livres, fiches) :

- PHP : **`die()` uniquement** (aucun `exit`) ; `is_numeric()` (pas de `ctype_digit`) ; pas de `date_default_timezone_set`.
- SQL : jointures uniquement en **`WHERE table1.x = table2.x`** (aucune syntaxe `JOIN … ON`).
- Hors programme mais indispensable : **barré en rouge**, jamais supprimé.

## 🕘 Historique des versions

| Version | Contenu |
|---|---|
| v358 | Synchronisation centrale des quiz (parties + questions vues entre appareils) |
| v359–v360 | Audit de conformité aux tableaux ; harmonisation `die()` / `is_numeric()` (site + livre 4SI) |
| v361 | Révision des 2 Smart Books : compléments de tableaux (SQL, JS, CSS), barrés rouges, pages recomposées |
| v362 | Envoi des scores dès le retour de connexion ; exception compte labo |
| v363 | Admin : vues par classe, par jour, Top 3, détail par candidat |
| v364 | Admin : Alertes (difficulté, inactivité, jamais joué) et Progression |
| v365 | Analyse par question : questions les plus ratées, élèves en échec |
| v366 | README refait ; aide intégrée « ❓ Aide & rappels » dans l'admin |
| v367 | Quiz rejouables à l'infini avec historique complet des parties |
| v371–v373 | PWA installable ; thème sombre universel du site ; glossaire arabe + graphiques d'activité |
| v375 | Admin : navigation en 4 groupes (Outils, Scolarité, Classe, Connexion) |
| v380 | Retour intelligent du lecteur Smart Book vers la page du QR |
| v383–v387 | Lisibilité de l'admin dans les 2 thèmes (palette unifiée, secours inline, fiche élève inversée) |
| v388 | Admin : recherche rapide Ctrl+K et annulation des dernières actions |
| v389 | Recherche globale sur tout le site (panneau partagé élèves/admin, 302 entrées) |
| v390 | Signets de pages + mode veilleuse (lecture nocturne) |
| v391 | Reprise multi-appareils : miroir cloud des progressions (vidéos, tableau de bord, livre), puce « Reprendre à mm:ss » ; v391b : chemins relatifs corrigés sur les sous-répertoires |
| v392 | 🗺️ Carte des difficultés par chapitre dans la Vue d'ensemble admin |
| v393 | Allègement 3G (démo `display` en `preload="none"`) ; liens des 3 vraies annexes dans la recherche |
| v394 | 🧾 Journal d'erreurs des pages élèves (table `sti_diagnostics`, RLS, vue admin) |
| v395 | Révision générale : 63 pages rattrapées au cache-buster ; SDK Supabase local partout ; page énoncé du formulaire reconnectée à la synchro |
| v396 | 🧪 SQL de poche : `cours/sql-playground.html` — SQLite wasm 100 % local, 3 bases de révision, historique & favoris hors-ligne |
| v397 | 📓 Carnet d’observations de la classe : table `sti_observations` (RLS prof, purge liée à l’élève) |
| v398 | ⚙️ Tiroir « Système & Plus » : Flash, Appel, Top 3, Aide, Maj rangés sous le plus/moins de la barre d’outils |
| v399 | 🧹 Suppression du second tiroir « Tous les outils & actions » — un seul point d’entrée vers les outils du tableau de bord |
| v400 | 📟 « La Cote » sur la page d’accueil : bandeau défilant type tableau de bourse — cotation officielle des technos (HTML5 Living Standard, CSS3, JavaScript ES2026, SQL:2023, PHP 8.5.12) + les 5 dernières nouvelles lues dans ce README |

---

*STI By A'e — © Aymen Essouyah, Lycée Rafèha. Tous droits réservés.*
