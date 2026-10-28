# 📚 STI By A'e — Plateforme Pédagogique STI V2.0 (3ᵉ & 4ᵉ SI)

Plateforme éducative interactive et **PWA utilisable hors ligne après mise en cache des ressources nécessaires** dédiée aux **Sciences et Technologies de l'Informatique** (**3SI** et **4SI**, programme officiel du Baccalauréat Tunisien) : cours multimédias avec **14 vidéos `.mp4` sélectionnées dans le catalogue d’accueil** (dont les ressources réservées 4SI), d’autres séries vidéo et une écoute vocale synchronisée, **2 livres connectés (Smart Books) par QR codes**, laboratoire **SQLite WASM**, **41 fiches d'exercices et séries corrigées**, **5 modules de quiz CSPRNG (1 244 questions au total)** avec tirage neuf à chaque connexion et possibilité de reprise d’une partie encore active, hub **« Mes erreurs »**, révision espacée **J+1 / J+3 / J+7**, couverture sur **124 pages**, **retour par `bfcache` lorsque le navigateur le permet**, sauvegarde automatique quotidienne des **15 tables Supabase** vers **Google Drive** et tableau de bord enseignant complet.

> 🌐 **Plateforme en ligne** : https://aymenessouyah.github.io/STiV2.0/
> 👨‍🏫 **Auteur** : M. Aymen Essouyah — Lycée Rafèha
> 🏗️ **Architecture** : Frontend statique GitHub Pages + Supabase PostgreSQL (15 tables historiques et deux tables techniques XP protégées par RLS) + Service Worker incrémental (`sw.js` — `sti-atelier-v357`, historique `sti-atelier-v356` / `sti-atelier-v355` / `sti-atelier-v354` / `sti-atelier-v353` / `sti-atelier-v352` / `sti-atelier-v351` / `sti-atelier-v350` / `sti-atelier-v349` / `sti-atelier-v348` / `sti-atelier-v347` / `sti-atelier-v346` / `sti-atelier-v345` / `sti-atelier-v344` / `sti-atelier-v343` / `sti-atelier-v342` / `sti-atelier-v341` / `sti-atelier-v340`)
> 📌 **Version du code** : **v499** (`sti-atelier-v360` — 28 octobre 2026). La configuration d'accès protégée conserve son socle v479 (`sti-atelier-v340`) ; la version effective est lue depuis le Service Worker.

---

## 📖 Sommaire

1. [Vue d'ensemble & chiffres vérifiés](#-vue-densemble--chiffres-vérifiés)
2. [Cours interactifs, vidéos, Smart Books & exercices](#-cours-interactifs-vidéos-smart-books--exercices)
3. [Quiz CSPRNG, calcul du score & hub « Mes erreurs »](#-quiz-csprng-calcul-du-score--hub-mes-erreurs)
4. [Navigation retour et `bfcache`](#-navigation-retour-et-bfcache)
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
| **Cours & multimédia** | HTML5, CSS3, JavaScript, Bases de données / SQL et PHP / MySQLi (`4SI`), **14 vidéos `.mp4` dans le catalogue d’accueil**, plus les autres séries et médias historiques + écoute vocale `.mp3` synchronisée avec Guide-Ligne (`0.85×` / `1×` / `1.15×`) |
| **Smart Books QR** | **2 manuels PDF connectés** : *3ᵉ SI* (**72 pages**) et *4ᵉ SI* (**100 pages**) reliés page par page via `livre-smart.html` |
| **Exercices & Bac** | Hub `exercices/series-exercices.html`, **41 fiches TP / corrigés**, séries SQL 1 à 6 en vidéo, 37 Défis JS, `bac-pratique.html`, `pieges-bac.html`, `outils-js-bac.html`, `memo-veille-bac.html` |
| **Banques de quiz** | **5 modules actifs** totalisant **1 244 questions** : HTML5/CSS3 (**187**), JavaScript (**106**), SQL (**140**), PHP (**176**) et Tableaux Smart Books (**635** dans `quiz-banque.json`) |
| **Suivi élève** | Anneau de couverture sur **124 pages**, révision espacée **J+1 / J+3 / J+7**, fiche imprimable `ma-fiche-revision.html`, mode Rayons X & surligneur |
| **Cloud & sauvegarde** | **15 tables `public`** sous RLS stricte (`vywujxmepvcbgedgmger`), pagination déterministe `> 1 000` lignes et export automatique quotidien `.json.gz` vers **Google Drive** |

---

## 🎓 Cours interactifs, vidéos, Smart Books & exercices

- **Accueil `v499`** : drapeau tunisien à gauche du logo (même hauteur que lui, pastille sur mobile), fond vidéo `assets/video/drapeaurafeha.mp4` (le drapeau et l'affiche du lycée Raféha) en boucle derrière le bloc « Bonjour », **exclu de la « pause pédagogique »** qui recouvrait la page, cadré en bas pour que l'affiche de l'établissement reste visible ; ruban à plat sur le **B** de « Bonjour » et sur la **première lettre du prénom**, avec le logo STI — **bleu** 3ᵉ SI, **vert** 4ᵉ SI, **or** pour l'admin, les comptes GOLD et les profs, **orangé** pour les autres comptes ; boîtes « en cours » compactes sur **une seule ligne** défilante.
- **News de ma classe (`v496`, niveaux corrigés en `v497`)** : la barre de news « La Cote » est retirée de l’accueil ; à sa place, une ligne défilante personnalisée s’affiche juste après « Bonjour, prénom ». L’admin choisit la classe (**3ᵉ SI** ou **4ᵉ SI**) puis saisit **texte 1, texte 2, …** dans son tableau de bord (bouton « News de la classe »). Le texte est **bleu en 3ᵉ SI** et **vert en 4ᵉ SI** ; le fond sombre, la typographie et le défilement sont ceux de l’ancien bandeau. Rien n’est affiché tant qu’aucun texte n’est saisi pour la classe de l’élève. Depuis la `v497`, chaque compte ne reçoit **que les textes de sa propre classe** : le privilège « 4ᵉ SI » accordé aux profs, à l’admin, au labo et aux comptes GOLD ne fait plus basculer le bandeau sur les 4ᵉ SI, et un compte enseignant sans classe (admin, prof, labo) ne voit **aucune** news de classe — l’aperçu de la modale admin montre exactement ce que recevra la classe choisie.
- **Quiz sans vidéo de cours (`v495`)** : les six pages de quiz (`html-css`, `javascript`, `sql`, `php`, `tableaux`, `pp`) ne portent aucune surface vidéo — ni balise `<video>`, ni piste `.mp4/.webm/.vtt`, ni lecteur — et `protection.js` refuse désormais d'y installer le lecteur pas à pas (garde `/quiz/`), même si un média était réintroduit dans le balisage.
- **Vitrine aléatoire (`v495`)** : la carte « Vidéo à la une » de l’accueil tire une capsule différente à chaque visite parmi les vidéos accessibles à tous, hors démonstrations de moins d’une minute et hors séries réservées aux 4e SI ; la même capsule n’est jamais reproposée deux fois de suite. Source, sous-titres, affiche, badge et libellés d’accessibilité suivent le tirage.
- **Cours complets conformes au programme tunisien** (`cours/html5.html`, `cours/css3.html`, `cours/javascript.html`, `cours/sql.html`, `cours/php.html`, `cours/php-mysqli.html`, `cours/sql-bases-ldd-lmd-lcd.html`) :
  - Les cinq cours unifiés présentent trois objectifs, une feuille de route cliquable et un temps de lecture indicatif calculé à **180 mots par minute**, hors vidéos. Les étapes réservées à la 4ᵉ SI restent protégées.
  - La vidéo principale PHP est le cours complet d’origine `php-cours.mp4` ; son lecteur historique et ses chapitres sont conservés, ainsi que la vidéo de synthèse distincte.
  - **Catalogue d’accueil : 14 vidéos `.mp4`** — HTML5 (1), CSS3 (4), JavaScript (2), SQL (4 dont deux réservées 4SI) et PHP (3 réservées 4SI). Les six vidéos des séries SQL, les variantes mobiles et les leçons interactives restent également disponibles dans leurs ressources historiques ; elles ne sont pas toutes comptées dans ce catalogue. La reprise et la remontée cloud `PROG_MEDIA` restent actives (`✅ Vu` / `⏳ En cours`).
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
- **Retour contextuel (`v494`)** : `assets/js/appel-quiz.js` mémorise la provenance exacte (chemin, onglet de cours, section, position de défilement) au moment du clic ; `assets/js/retour-quiz.js` la revalide (même origine, jamais un autre quiz) et adapte chaque bouton de retour — y compris le bouton mobile ajouté sur les cinq pages de quiz. Sans provenance connue, le retour reste `index.html#quiz`.
- **Mélange cryptographique (`window.crypto.getRandomValues`)** :
  - À **chaque nouvelle connexion** (`portail.js` → `preparerNouvelleConnexionQuiz()`), toute ancienne session inachevée est purgée afin d'effectuer un **nouveau tirage aléatoire des questions ET un nouveau mélange aléatoire des propositions `A/B/C/D`** ; deux tirages indépendants peuvent toutefois coïncider ;
  - Anti-série intégré (jamais 3 bonnes réponses consécutives à la même position) et rotation prioritaire des questions jamais vues (`sti_quiz_vus`, isolé par `user_id` sur poste partagé).
  - En cours d'une même session de connexion, une partie active avec au moins une réponse peut être reprise au même indice, avec les mêmes propositions et le même score (`sti_quiz_sessions`). Quitter ou recharger le quiz après une réponse déclenche sa finalisation et la purge de sa session ; une nouvelle connexion purge également les sessions inachevées.
  - **Reprises simultanées (`v490`)** : une partie identifiée conserve le même identifiant sur les appareils qui la reprennent ; ses finalisations et ses gains cumulatifs sont dédupliqués. Les parties issues d'anciens clients sans identifiant ne peuvent pas toutes être réconciliées rétroactivement avec certitude.

### 2. Calcul du score & synchronisation write-ahead vers Supabase (`assets/js/quiz-sync.js`)
- Calcul instantané du **score exact**, du **pourcentage**, de la **note ramenée sur `/20`** et des **points** (avec pont synchrone vers `acces.js` / `sti-mes-scores`).
- **File locale write-ahead isolée par `user_id`** : chaque fin de partie (`STIQuizSync.enregistrer`) et chaque lot de réponses (`STIQuizSync.enregistrerReponses`) est inscrit en `localStorage` **avant** l'appel réseau, puis vidé automatiquement vers `sti_quiz_parties` et `sti_quiz_reponses` dès que la connexion est disponible — sans jamais mélanger deux élèves successifs sur un poste du Labo 3.
- **Carte d'Évaluation Officielle STI V2.0 (`v459`)** en fin de quiz : bilan détaillé, points à réviser, un conseil ciblé par faute, export PNG HD et impression.
- **Badge d'abonné (`v488`)** : un seul fond local précompose le logo et le QR STI ; la photo ou les initiales, le nom, le prénom et la classe restent propres au compte. Le QR est masqué sur mobile et agrandi au survol ou au focus sur ordinateur ; le QR original reste disponible dans la fenêtre Contact.
- **Gains XP multi-appareils (`v490`)** : chaque nouvelle partie reçoit un identifiant conservé lors de sa reprise. Pour les quatre quiz à XP, `sti_appliquer_gain_partie_quiz` enregistre une seule fois le gain cumulatif maximal de cette partie, y compris après une réponse perdue ou une finalisation partielle suivie d'une reprise ; les gains de parties distinctes restent additifs. L'historique des cinq quiz utilise également cet identifiant. La file locale reste isolée par compte et retentée à la reconnexion ; ne pas effacer les données locales avant synchronisation. Pour une ancienne session sans identifiant, la compatibilité repose sur l'empreinte de son tirage ; des gains déjà enregistrés par un ancien client sans identité ne peuvent pas être dédupliqués rétroactivement avec certitude.
- **Déploiement et sauvegarde XP** : appliquer, dans l'ordre, `supabase/migrations/20261027_xp_quiz_sync_v485.sql`, `supabase/migrations/20261027_xp_quiz_operations_v487.sql` puis `supabase/migrations/20261028_xp_parties_idempotentes_v490.sql`, **avant** de publier ce frontend. Les modifications v490 ne sont pas automatiquement appliquées à la base par la publication statique. Les deux tables techniques ont RLS et ne sont accessibles qu'aux RPC ; les archives Drive existantes couvrent les 15 tables historiques, pas ces deux tables. Prévoir une sauvegarde PostgreSQL/Supabase incluant le journal et les compteurs XP pour conserver l'idempotence lors d'une restauration.
- **Test de concurrence PostgreSQL** : `tests/xp-quiz-concurrence.test.mjs` s'exécute lorsque `STI_TEST_POSTGRES_URL` désigne une base locale jetable nommée `sti_xp_tests`. Le test recrée ses schémas `public` et `auth` : ne jamais l'utiliser sur une base à conserver.
- **Exception compte partagé laboratoire (`elevelabo3@exemple.tn`)** : fonctionnement 100 % local au poste, zéro envoi cloud et exclusion automatique de toutes les moyennes et alertes enseignant.

### 3. Table & séance ciblée « Mes erreurs » (`revision-erreurs.html`)
- Agrège en direct `sti_quiz_reponses` (et la file locale hors-ligne de l'élève connecté), filtre automatiquement le module PHP pour les classes de **3ᵉ SI**, distingue les questions encore ratées de celles déjà corrigées, et lance en un clic une séance ciblée **`?revision=erreurs`** sur le quiz correspondant.
- Côté enseignant, `assets/js/admin-erreurs.js` croise ces réponses avec `profiles` pour classer chaque notion en *Ne sait pas*, *Sait mais se trompe* ou *Maîtrise* et détecter les questions ambiguës ou trop faciles.

---

## ⚡ Navigation retour et `bfcache`

La navigation utilise le `bfcache` lorsque le navigateur le permet ; aucun temps nul n’est garanti. Les liens équipés conservent le chemin, les paramètres et le fragment de la page appelante, sans accepter de destination externe ou de traversée de répertoires. En l’absence de ce lien équipé, le navigateur peut transmettre la page d’origine mais pas son fragment ; une ouverture directe revient au choix de quiz. L’interface des quiz n’est pas modifiée.

Le mécanisme historique dans `assets/js/config.js` (`v465`, `v467`, `v470`) reste disponible :

- **Retour vers Quiz (`#modules`), Cours (`#cours`) et Exercices (`#exercices`) sans recharger `index.html`** :
  - Tout clic sur un lien de retour vers `index.html` (`#modules`, `#cours`, `#exercices`, `#top`) ou vers `exercices/series-exercices.html` (`#css3`, `#javascript`, `#bdd`, `#php`) intercepte la navigation, mémorise l'ancre cible en `sessionStorage` et exécute `history.go(-delta)` pour restaurer le document depuis le **`bfcache` lorsque disponible**.
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
- **Progression des chapitres v492** : les cinq cours et l’accueil indiquent le nombre de chapitres consultés, tandis que les chapitres volontairement marqués « révisés » restent comptés séparément. Les anciennes visites `en_cours` et révisions `revise` déjà présentes dans le profil sont conservées ; une ancre de cours et une lecture visible, même lors d’un défilement lent, sont enregistrées sans compter les passages rapides. La fin d’un cours tient compte uniquement des chapitres réellement présents et accessibles : en 3SI, le chapitre Bac masqué est exclu du total SQL et le verrou PHP reste inchangé. Il est impossible de reconstituer les visites antérieures qui n’avaient pas été enregistrées.
- **Suivi et reconnexion v491** : sur les pages équipées du profil (notamment l’accueil, le tableau de bord, les cinq cours, les quiz et plusieurs exercices), le profil unique projette les visites et exercices cochés vers les journaux historiques lus par l’administration. Une connexion explicite ou un retour en ligne y relit le cloud avant de transmettre la progression locale ; la fusion conserve les modifications indépendantes lorsque la base précédente est connue, préserve les records XP et les autres journaux synchronisés, et diffère les envois si la lecture échoue. Les aperçus intégrés laissent la page principale synchroniser. Les autres pages conservent leur synchronisation historique. Après un rechargement entièrement hors ligne, sans base commune connue, une suppression locale ne peut pas toujours être distinguée d’un ajout distant ; il ne faut donc pas promettre une résolution parfaite de tous les conflits. Les XP restent gérés par leur protocole idempotent dédié.

---

## 🛠️ Tableau de bord administrateur (`admin.html`)

Interface Bento/Spotlight en police **Comic**, ornée du logo officiel (`assets/icons/sti-icon-512.png`), du titre d'état temps réel (`#titre-tb-admin` **vert** connecté / **rouge** `.hors-ligne`), des modes **Clair / Sombre** et des **4 univers approuvés** (`foret`, `cyber`, `pop`, `spotify`), avec **262 boutons interactifs vérifiés** et pagination PostgREST intégrale (`> 1 000` lignes) sur tous les modules :

| Pôle / Outil | Fonctionnalités opérationnelles |
|---|---|
| 👥 **Abonnés & Classes** | Validation/refus avec double confirmation, approbation des photos élèves (individuelle ou en lot), statut 👑 Gold, pause écran, Carte Officielle d'Abonné, Trombinoscope A4, **📋 Fiche Conseil de Classe A4**, Badges Labo A4 et gestion des lycées/classes |
| 🏆 **Quiz & Analyse d'erreurs** | Synthèse élève × quiz (`quiz-admin.js`), vues *Classes*, *Jours*, *Top 3*, *Alertes*, *Progression*, *Questions ratées*, ordre exact des questions tirées et diagnostic cognitif (`admin-erreurs.js` + export CSV) |
| 🔁 **Révision & 🗺️ Couverture** | Suivi J+1/J+3/J+7 (`admin-revision.js`), taux réel d'exploration des **124 pages** (`admin-couverture.js`), repérage des élèves inactifs/à risque, graphiques d'activité (`graphiques-activite.js`) et panneau **📊 Progressions** (`analytique.js`) |
| 🗄️ **DBSupbase (`/ 1 000 lignes`)** | Jauge exacte en direct des **15 tables `public`** via la RPC `public.admin_dbsupbase_niveaux()`, 4 seuils visuels (*Confort*, *Modéré*, *Vigilance ≥ 80 %*, *Seuil atteint ≥ 1 000*), tri/filtre, export CSV et passerelle directe depuis la modale Quota 500 Mo |
| 💬 **Messenger & Séance Live** | Messenger STI flottant temps réel (texte, fichiers, dictée vocale, diffusion par classe, WhatsApp), Appel & Présence A4/CSV, Mains levées, Question Flash, Kahoot Live, Tableau blanc, Coffre TP, Copies TP `/20`, Grille Devoirs DC/DS et Régie « News de la classe » (3ᵉ SI / 4ᵉ SI) |
| 🛡️ **Sécurité, Santé & Sauvegarde** | Centre de Sécurité (Mode Examen, Plein écran, Anti-DevTools, Filigrane), gestion des postes Labo 3, changement du mot de passe admin (`admin-mdp.js` + MFA AAL2), **🩺 Santé du site** (`sante.js`, 36 contrôles en direct) et **💾 Sauvegarde complète** (`sauvegarde.js`) |

---

## 🔐 Sécurité de la plateforme & protection des données

- **PostgreSQL & Row Level Security (`15 / 15` tables protégées)** :
  - Chaque table élève (`sti_progressions`, `sti_quiz_parties`, `sti_quiz_reponses`, `sti_quiz_sessions`, `sti_quiz_vus`, `acces`, `profiles`) applique `auth.uid() = user_id` pour les écritures/lectures individuelles et réserve l'administration à `public.est_admin()` / `public.est_admin_mfa()`.
  - Les fonctions SQL du schéma `public` fixent `search_path=public` ; la RPC `public.admin_sauvegarde_tables_annexes()` exclut explicitement les colonnes sensibles (`secret_hash`).
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

- **Tests automatisés** : après `npm ci` et `npx playwright install chromium`, lancer les tests statiques et les suites navigateur depuis la racine :
  ```bash
  node --test tests/*.test.mjs
  python3 -m unittest discover -s tests -p 'test_*.py' -v
  for suite in accueil-personnalise ajustements-cours badge-reprise mobile-nav fidelite css3 javascript sql-php demandes parcours main-integration sw-fidelite v303; do
    npx playwright test --config "tests/playwright-$suite.config.mjs"
  done
  npx playwright test --config tests/playwright.config.mjs
  npx playwright test --config tests/playwright-xp-quiz.config.mjs
  npx playwright test --config tests/playwright-quiz-tirages.config.mjs
  npx playwright test --config tests/playwright-reconnexion-maj.config.mjs
  npx playwright test --config tests/playwright-nouvelle-verification.config.mjs
  npx playwright test --config tests/playwright-progression-lecture.config.mjs
  ```
  Les tests navigateur utilisent des identités et un cloud fictifs : ils ne valident pas une authentification Supabase réelle. Les tests SQL utilisent PGlite ; le test de concurrence complémentaire exige explicitement une base PostgreSQL locale jetable. La validation locale v494 ajoute 3 scénarios Chromium (retour contextuel des quiz : cours, tableau de bord, série d'exercices, révision des erreurs, position de lecture et refus d'une provenance étrangère) ; ces scénarios n'ont pas été rejoués faute de binaire Chromium dans l'environnement de rédaction. Côté Node, 169 des 171 tests passent, les deux autres exigeant une base PostgreSQL 17 jetable avec les paquets `pg` et `@electric-sql/pglite` absents ici ; elle ne constitue pas une validation de la production réelle. Les 27 PDF ont été ouverts et un court extrait au milieu de chacun des 45 fichiers audio/vidéo a été décodé, sans vérifier leur lecture intégrale.
- **Accueil personnalisé** : le prénom provient de la session existante ; le compteur dénombre les cours distincts effectivement ouverts, y compris les anciennes pages de cours du journal de couverture. La dernière lecture ou vidéo reprend dans « Continuer à apprendre », sans exposer le profil en attente d’isolation. Les visites sont conservées dans `sti-profil-abonne` et réunies lors des restaurations cloud ; les restrictions PHP et Bac restent actives.
- **Badge de compte** : le bouton, l’anneau de couverture, la notification, la loupe et le panneau de compte d’origine sont conservés. La photo validée ou les initiales NOM.Prénom côtoient le logo et le QR locaux ; le ruban est bleu en 3e, vert en 4e, doré pour les professeurs et comptes GOLD, orange pour `elevelabo3` (et l’alias `elevelao3`), noir sinon. Le compte laboratoire prime sur GOLD.
- **Navigation mobile** : la barre propose Accueil, Cours, Vidéos, Quiz et Autres ; les séries d’exercices restent accessibles dans « Autres ». Dans les cinq cours, les onglets et le bouton Plan reviennent sous l’en-tête lorsqu’on remonte, y compris avant les chapitres et jusqu’au sommet ; leur espace est conservé pour éviter les sauts de page.
- **Protocole de mise à jour PWA (`sw.js`)** : lors d’une nouvelle publication, incrémenter `CACHE` après `sti-atelier-v356` et `UPDATE_ID`, actualiser les révisions des fichiers modifiés et régénérer `offline-complete-manifest.json`. À la reconnexion, les révisions concernées sont recherchées ; une panne conserve l’ancienne copie et retente le fichier. Les pages appelantes déjà en cache sont remplacées atomiquement lorsqu’elles ont changé ; celles non visitées restent chargées à la demande. Le service worker ne précharge pas automatiquement les médias lourds lors des mises à jour. Les onglets équipés préparent le verrou historique avant activation ; si un onglet ancien ou son stockage ne répond pas, l’activation automatique attend au lieu de provoquer son rechargement. La vérification historique au focus est également préparée sur les pages équipées. **Limites :** un onglet encore ouvert avec l'ancien code peut lui-même lancer un contrôle de version et se recharger au premier déploiement ; une mise à jour forcée explicitement par l’administrateur conserve son comportement d’origine. Sur une installation vierge, le premier affichage précède le contrôle du worker : une visite contrôlée ultérieure met l’accueil en cache ; l’aperçu vidéo CSS3 historique peut, lui, déclencher une requête média indépendamment du worker.
- **Mesures locales PWA** : avec un cache préchauffé et un serveur de test non compressé, une reconnexion sans changement a demandé `sw.js` une fois (94 348 octets de corps) ; avec un fichier modifié, elle a demandé `sw.js` (94 348 octets) et `app.js` (101 580 octets) une fois chacun, en conservant les autres fichiers et la vidéo en cache. L’accueil réel testé a également demandé `sw.js` une seconde fois, sans rechargement ; le déploiement fictif y avait aussi modifié `app.js`. Ces valeurs ne sont pas des mesures de trafic en production.
- **Navigation, essai local indicatif** : trois passages par cours pendant le développement, serveur sans compression et ressources externes bloquées. Sur mobile simulé (CPU ×4, 40 ms, 1,6 Mbit/s), les médianes d’ouverture étaient de 18,4 à 21,9 s à froid et de 4,4 à 6,4 s avec PWA préchauffée ; le retour navigateur mesuré allait de 14,8 à 16,6 s à froid et de 2,2 à 2,4 s en cache. Des tests concurrents et les conditions locales influencent ces chiffres ; ils ne remplacent pas une mesure sur téléphone et réseau réels. Le fichier d’accès historique protégé reste notamment volumineux et n’a pas été modifié.
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
| v475 | Cure complète de navigation et d'ouverture des pages : éligibilité `bfcache` `0 ms` réparée (suspension/reprise propre des WebSockets Realtime), `defer` non-bloquant sur `126` pages (`382` balises `<script>`), polices WOFF2 SQL/PHP externalisées en binaire (`-475 Ko` dans `<head>`), préchargement anticipé au survol/toucher, zéro `blur(95px)`/`background-attachment: fixed`, client Supabase mutualisé et index B-tree sur `acces` & `labo_device_sessions` (`sti-atelier-v335`) |
| v476 | Retour instantané depuis `exercices/series-exercices.html` (`#exercices`) et tous les Quiz dont `quiz/php.html` (`#modules`) : suppression de l'auto-rechargement caché en double dans `<iframe id="pdfFrame">` (`src="about:blank"` + `location.replace`), traversée `navigation.traverseTo(key)` avec repli garanti, verrouillage `scrollRestoration="manual"` + ré-alignement post-rendu sur la section cible et déduplication `pagehide` dans `sync-progressions.js` (`sti-atelier-v337`) |
| v477 | Synchronisation intégrale de la version active `v477` (`sti-atelier-v338`) : purge et mise à jour de l'alias racine `./` avec `./index.html` dans `sw.js`, alignement immédiat de `VERSION_AFFICHEE` sur la roue (`STiV2.0.477`), `admin.html` (`badge-version-admin` & `pied-version-admin`), `nouveautes.js` et `README.md`, et détection instantanée au rechargement `F5` sans délai inter-onglets de 15 minutes (`sti-atelier-v338`) |
| v478 | Protection monotone multicouche des XP et records de Quiz élèves (`v478` · `sti-atelier-v339`) : verrouillage `pull-before-push` dans `sync-progressions.js` (aucun `POST` avant la fin du premier `tirer()` sur navigateur neuf ou PC partagé), fusion monotone bidirectionnelle des XP/niveaux/records (`sqlQuestV3`, `quizphp_v1_user`, `quizzora_xp_v1`, `sti-quiz-xp-js-v1`, `js_quiz_high_score`, `js_quiz_total_answered`) même lorsque `local >= distant`, plancher d'XP reconstruit automatiquement depuis l'historique immuable `sti_quiz_parties` (`STIQuizSync.resume().xpPlancher`), crédit XP garanti avant rendu ou `pagehide` sur les 4 moteurs de quiz, et trigger PostgreSQL `trg_sti_progressions_monotone_xp` (`public.sti_progressions_preserver_xp()`) actif sur `public.sti_progressions` (`sti-atelier-v339`) |
| v479 | Fiabilisation intégrale du compteur des vidéos (`.mp4`) et audios (`.mp3`) (`v479` · `sti-atelier-v340`) : conservation de `maxPct`/`done` au clic sur `✕` du bandeau `reprendre.js` (`sec: 0` + `repriseMasquee` sans suppression de clé), suivi automatique des vidéos `.mp4` ouvertes dans `<iframe id="pdfFrame">` sur `exercices/series-exercices.html` (dont Série 4.2 GestLocation), harmonisation des compteurs roue élève (`acces.js`) / `admin.js` / `analytique.js`, résolution canonique des slugs versionnés/encodés dans `protection.js` et fusion monotone sous-clé par sous-clé de `sti-media-prog-v1` dans PostgreSQL (`sti-atelier-v340`) |
| v480 | Intégration de la refonte de l'accueil, du profil et des cinq cours avec les correctifs XP/médias de v478–v479 : ancres historiques conservées, installation PWA accessible, tests de migration et cache différentiel `sti-atelier-v341` ; les fichiers d'accès protégés restent inchangés. |
| v481 | Fidélité à l’origine : roue, logo, QR et Cote restaurés ; 13 vidéos avec le lecteur historique complet ; cours PHP animé d’origine ; cinq séries PHP et corrigés ; synthèses dans le cours ; retour contextuel des quiz ; exercices en bulles ; trois thèmes et dix outils regroupés. Les cinq cours affichent leurs objectifs, leur feuille de route et une durée de lecture ; les nouveaux modules essentiels restent disponibles hors ligne (`sti-atelier-v342`). |
| v482 | Accueil de connexion personnalisé avec prénom, compteur de cours distincts déjà visités, cartes de reprise, état zéro et conservation des visites historiques ; isolation des comptes partagés et mise à jour PWA incrémentale (`sti-atelier-v343`). |
| v483 | Reprise de lecture/vidéo intégrée à l’accueil personnel et badge de compte à ruban par classe, sans remplacer le panneau ni la progression d’origine ; ressources disponibles hors ligne (`sti-atelier-v344`). |
| v484 | Navigation mobile : accès direct aux vidéos dans la barre inférieure ; séries d’exercices conservées dans « Autres » (`sti-atelier-v345`). |
| v485 | Vidéo JavaScript « Validation du champ Nom & Prénom » déplacée dans `assets/videos/` et intégrée à la Série 5 JavaScript (`series-exercices.html` & `cours/javascript.html`) ainsi qu’au catalogue « Vidéos explicatives » avec chapitrage et sous-titres FR (`sti-atelier-v346`). |
| v486 | Présentation des cours, barre mobile et retour contextuel du quiz ; QR du badge limité à l’ordinateur ; relance ciblée des compteurs XP (`sti-atelier-v347`). |
| v487 | Cumul idempotent des gains XP effectués hors ligne sur plusieurs appareils, avec reprise par compte et protection des acquis (`sti-atelier-v348`). |
| v488 | Badge d'abonné sur fond unique avec identité superposée et QR masqué sur mobile (`sti-atelier-v349`). |
| v489 | Vérification à la reconnexion, reprise du delta après panne sans perdre le noyau hors ligne et comparaison des dépendances par empreinte (`sti-atelier-v350`). |
| v490 | Identité commune des parties reprises, gains XP cumulatifs idempotents et activation PWA coordonnée entre onglets (`sti-atelier-v351`). Migration SQL préalable requise. |
| v491 | Logos de matières, salut administrateur, retours quiz contextualisés, projection du suivi et relecture cloud à la reconnexion ; mise à jour incrémentale des pages déjà visitées (`sti-atelier-v352`). |
| v492 | Compteurs de chapitres consultés distincts des révisions volontaires, navigation mobile et restauration cloud des cinq cours ; mise à jour hors ligne ciblée (`sti-atelier-v353`). |
| v493 | Retour de la barre Cours/Exercices/Plan en remontant sur mobile, avec mise à jour incrémentale et compatibilité hors ligne (`sti-atelier-v354`). |
| v494 | Retour intelligent des cinq quiz : chaque bouton de retour reprend la page appelante exacte (cours et onglet, accueil, tableau de bord, exercices, révision des erreurs), avec son libellé et sa position de lecture, y compris depuis le téléphone (`sti-atelier-v355`). |
| v495 | Vidéo à la une tirée au hasard à chaque ouverture de l’accueil (capsules de moins d’une minute et séries réservées exclues, sans répétition immédiate) ; pages de quiz définitivement sans vidéo de cours (`protection.js` coupe sur `/quiz/`) ; file write-ahead des quiz et des gains XP vidée dès la première reconnexion depuis l’accueil ou le tableau de bord (`sti-atelier-v356`). |
| v496 | « News de ma classe » : la barre de news « La Cote » disparaît de l’accueil, remplacée par une ligne défilante juste après « Bonjour, prénom » — l’admin choisit la classe (3ᵉ SI / 4ᵉ SI) et saisit texte 1, texte 2… (bleu en 3ᵉ, vert en 4ᵉ, fond et défilement identiques à l’ancien bandeau) (`sti-atelier-v357`). |
| v497 | News par classe strictement cloisonnées : l’admin, les profs, le labo et les comptes GOLD ne voient plus les news de toutes les classes (plus de repli sur les 4ᵉ SI via le privilège, plus de cumul avec l’ancien format) ; aperçu élève dans la modale admin (`sti-atelier-v358`). |
| v498 | Accueil : drapeau tunisien à gauche du logo, fond vidéo du bloc « Bonjour », ruban bleu/vert/argent avec le logo STI sur l’initiale de « Bonjour » et du prénom, boîtes « en cours » compactes sur une seule ligne (`sti-atelier-v359`). |
| v499 | Accueil : fond vidéo en boucle qui n'est plus interrompu par la pause pédagogique, affiche du lycée visible, ruban à plat sans découpe avec l'initiale colorée — bleu 3ᵉ SI, vert 4ᵉ SI, or pour admin/GOLD/profs, orangé pour les autres comptes (`sti-atelier-v360`). |

---

*STI By A'e — © Aymen Essouyah, Lycée Rafèha. Tous droits réservés.*
