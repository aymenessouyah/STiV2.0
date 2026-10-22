# 📚 STI By A'e — Plateforme STI (3ᵉ & 4ᵉ SI)

Plateforme éducative interactive pour les **Sciences et Technologies de l'Informatique** (sections **3SI** et **4SI**, programme Tunisien) : cours complets avec vidéos, exercices corrigés, **livres connectés (Smart Books) avec QR codes**, quiz synchronisés entre appareils et tableau de bord enseignant complet.

> 🌐 **Site en ligne** : https://aymenessouyah.github.io/STiV2.0/
> 👨‍🏫 **Auteur** : Aymen Essouyah — Lycée Rafèha
> 🏗️ **Hébergement** : GitHub Pages (site statique) + Supabase (comptes & données)

---

## 📖 Sommaire

1. [Contenus pédagogiques](#-contenus-pédagogiques)
2. [Comptes & accès](#-comptes--accès)
3. [Quiz : règles et synchronisation](#-quiz--règles-et-synchronisation)
4. [Tableau de bord admin](#-tableau-de-bord-admin)
5. [Architecture technique](#-architecture-technique)
6. [Base de données & migrations](#-base-de-données--migrations)
7. [Publication & maintenance](#-publication--maintenance)
8. [Conventions du code enseigné](#-conventions-du-code-enseigné)
9. [Historique des versions](#-historique-des-versions)

---

## 🎓 Contenus pédagogiques

- **Cours** HTML5, CSS3, JavaScript, Bases de données & SQL, PHP/MySQLi : leçons interactives, vidéos commentées avec chapitrage, écoute vocale, exemples exécutables.
- **Smart Books (livres connectés)** — 2 livres PDF (`documents/livre/`) :
  - *4ᵉ SI* (100 pages) et *3ᵉ SI* (72 pages) : fiches de cours, exercices et **tableaux récapitulatifs** finaux.
  - **Un QR code par page** : il ouvre la partie du site correspondante (`livre-smart.html?livre=…&page=N`). La pagination imprimée ne doit donc **jamais** changer sans régénérer les QR.
  - Les tableaux des livres sont la **source officielle** du contenu des quiz.
- **Annexes officielles** du programme (`documents/annexes/`) : mêmes couleurs, même format ; le code hors programme indispensable y est **barré en rouge** (classe `.hp`), jamais supprimé.
- **Exercices & séries SQL corrigées**, défis JavaScript, récapitulatifs PHP, épreuves du Bac pratique.

## 👤 Comptes & accès

- Inscription **e-mail** ou **téléphone (+216)** avec code de validation WhatsApp ; connexion par badge laboratoire en salle informatique.
- Comptes gérés par **Supabase Auth** ; profils dans la table `profiles` (nom, prénom, **classe**, lycée…). *Ne jamais activer « Confirm email »* (validation gérée côté plateforme + administrateur).
- **Quiz réservés aux abonnés connectés.**
- Compte partagé du laboratoire : `elevelabo3@exemple.tn` (voir exception ci-dessous).

## 🏆 Quiz : règles et synchronisation

- **Banques séparées 3SI et 4SI**, questions limitées strictement aux sources autorisées : tableaux récapitulatifs des 2 livres, 37 Défis JavaScript et Récap PHP.
- **Tirage aléatoire à chaque visite, sans jamais répéter** une question déjà vue — sur **tous les appareils** de l'élève (table `sti_quiz_vus`).
- **Rejouables à l'infini** : **chaque partie est conservée** (score, total, %, date) dans `sti_quiz_parties`, ce qui donne dernier score, meilleur score, % moyen, nombre de parties et l'historique détaillé.
- **Fonctionnement de la synchronisation** (`assets/js/quiz-sync.js`) :
  - en ligne : envoi immédiat en fin de partie ;
  - hors ligne : file d'attente locale sur l'appareil ;
  - **dès le retour de la connexion** (événement `online`) ou au prochain chargement d'un quiz : envoi automatique, sans action de l'élève.
- **Détail question par question** (depuis la v365) : chaque réponse (énoncé, juste/faux) part dans `sti_quiz_reponses` pour l'analyse des questions les plus ratées.
- 🔬 **Exception compte labo** (`elevelabo3@exemple.tn`) : **aucun score en ligne** (compte partagé par toute la classe) ; distribution aléatoire **locale** à chaque poste ; banque de quiz mise à jour avec le site, comme pour tous. Il est **exclu des statistiques** de l'admin.

## 🛠️ Tableau de bord admin

Page `admin.html` (2 modes d'affichage : Clair / Sombre). Sections : Abonnés & Classes, Quiz & Bac Pratique, Messages & Réponses, Dernières Connexions — plus une **aide intégrée « ❓ Aide & rappels »**.

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

La **classe** affichée vient du champ `classe` du profil (section Abonnés). Limites d'affichage : 5 000 parties et 8 000 réponses les plus récentes.

## 🧱 Architecture technique

- **GitHub Pages** : site 100 % statique (HTML/CSS/JS), PWA installable et utilisable hors-ligne (service worker).
- **Supabase** : authentification, profils et tables des quiz, protégées par **RLS** (chaque élève ne voit que ses données ; l'admin lit tout via `est_admin()`).
- Fichiers clés :
  - `assets/js/quiz-sync.js` — synchronisation des quiz (parties, vus, réponses, file hors-ligne, exception labo) ;
  - `assets/js/quiz-tableaux.js` — moteur du Quiz des tableaux ;
  - `assets/js/quiz-admin.js` — statistiques quiz du tableau de bord ;
  - `quiz/*.html` — les 5 quiz (html-css, javascript, sql, php, tableaux) ;
  - `admin.html` — tableau de bord (aide intégrée incluse).

## 🗄️ Base de données & migrations

À exécuter **une seule fois** dans Supabase (SQL Editor), dans l'ordre :

| Fichier | Objet |
|---|---|
| `MIGRATION-v358-QUIZ-SYNC.sql` | Tables `sti_quiz_parties` et `sti_quiz_vus` |
| `MIGRATION-v365-REPONSES.sql` | Table `sti_quiz_reponses` (détail question par question) |

Sauvegarde automatique des profils vers Google Drive (Apps Script `sauvegarde-auto-drive`, un seul fichier `.json.gz` conservé).

## 🚀 Publication & maintenance

- Publication sur GitHub via **clé SSH de déploiement** (deploy key avec accès en écriture, enregistrée dans les paramètres du dépôt) — aucun jeton à manipuler.
- Convention de commits : `vNNN Description courte` ; vérifier après chaque push la présence des changements sur le site en ligne.
- ⚠️ Ne jamais stocker de secret (jeton, clé privée, clé Turnstile *Secret*) dans le dépôt ou dans les messages.

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

---

*STI By A'e — © Aymen Essouyah, Lycée Rafèha. Tous droits réservés.*
