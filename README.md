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

- **v428 — les deux barres se roulent au défilement (consigne auteur, capture Facebook à l'appui)** : sur TOUTES les pages /cours/ et sur la page exercices (series-exercices), en mode mobile, l'en-tête du haut et la barre d'onglets du bas s'effacent quand on défile vers le bas et reviennent dès qu'on remonte (transitions .28 s, seuils 10/8 px, jamais de saut : les barres sont en couches fixes, le texte ne bouge pas). La barre du haut est reconnue par sa nature (premier header/nav fixed ou sticky bordé en haut, pleine largeur, ≤ 45 % de l'écran) et non par une liste de sélecteurs — les 18 fiches cours ont chacune son gabarit. Le roulement se suspend automatiquement si un menu de sommaire (logo-menu v424/426), le tiroir « Autres » ou une boîte modale est ouvert : on ne cache jamais ce que le lecteur consulte. Aucune fiche de contenu modifiée — la logique vit dans le module de barre ; admin/tests exclus ; PC et tablettes hors portée (règles ≤ 700 px). sw `v428-barres-roulables`.
- **v429 — la roue ⚙️ s'habille (consigne auteur « on veut améliorer la roue » → look & ergonomie)** : panneau élargi (330 px, 90 % de hauteur utile), ouverture en fondu-coulissé (neutralisée si mouvement réduit), scrollbar fine visible, pastilles ✕ et 🌙 rondes de 36 px, boutons ≥ 40 px avec survol/appui/focus, cartes arrondies pour « Nuage & réseau » et « Mes pages », barre de progression épaissie, interlettrage des titres de section, pied de version détaché. Micro-correction au passage : le thème sombre du panneau ne s'était JAMAIS appliqué (acces.js écrasait la classe « sti-theme-sombre » avec « sti-no-print » juste après l'avoir posée, et le chemin « thème global » de 🌙 ne la posait pas du tout) — le module roue-habillage.js la maintient à présent en continu (veille 800 ms + clic + évènement storage) et aligne le libellé 🌙/☀️. 100 % additif : un fichier CSS+veille chargé par mobile-nav.js, acces.js et toutes les fiches intactes ; le décharger rend la roue v428 à l'identique. sw `v429-roue-habillee`.
- **v430 — la pastille de synchro devient une annonce de 2 s (consigne auteur : « la boîte « Progression : cet appareil seulement » gêne l'affichage des autres »)** : dans la roue, la pastille quitte le FLOT de la carte « Nuage & réseau » — elle devient une bulle overlay posée SOUS la carte (largeur auto, centrée, couleur d'état conservée), donc plus rien n'est poussé sous le boîtier 📶 ; elle apparaît DEUX SECONDES à chaque ouverture du panneau et à chaque changement d'état (☁️ restaurée / synchronisée / 💾 cet appareil seulement…), puis s'efface en fondu (pointer-events:none : on clique à travers). Le boîtier 📶 Normal reste durable comme en v418 — seul le message de synchro est temporaire. Modifié dans roue-nuage.js lui-même (c'est son rôle : le placement des deux éléments), mobile-nav/config bumpés, sw `v430-annonce-2s`.
- **v431 — les initiales au centre de la roue (consigne auteur : « le centre de la roue contient A. (1re lettre du prénom) B. (1re lettre du nom) »)** : le ⚙️ porte désormais « P.N » (ex. A.E) — 1re lettre du prénom, 1re lettre du nom, lues dans le cache de session que acces.js fusionne depuis la table profiles ; à défaut, déduites de l'email local (séparateurs . _ - ou camelCase). Seul le glyphe du bouton change (lettres 16 px 900 sur le dégradé doré/orange, anneau de progression, badge, panneau, habillage v429 et annonce v430 intacts) ; veille 700 ms + évènement storage re-posent les lettres après toute reconstruction du bouton ou changement de compte ; sans prénom/nom ni email, l'engrenage d'origine reste. admin : ⚙️ masqué, non concerné. Module additif roue-initiales.js chargé par mobile-nav.js ; sw `v431-initiales`.
- **v432 — l'anneau du ⚙️ montre la couverture du site (consigne auteur : « la partie qui tourne autour de la roue montre le niveau de couverture du site »)** : l'anneau orange ne peint plus la progression des leçons mais la proportion de pages de contenu réellement consultées — journal localStorage « sti-pages-vues-v432 » (une entrée par page visitée, alimenté à chaque page de la liste des 126 pages du site : cours, exercices, quiz, projets, documents, outils de révision — hors portail/index/404) ; le pourcentage = intersection vues/liste ÷ 126, plafonné à 100. Étant une clé « sti- », le journal est collecté par sync-progressions.js SANS MODIFICATION → la couverture suit l'élève entre ses appareils. Le panneau garde sa ligne « 📈 Progression » intacte : seul l'anneau change de sens (title = « 🗺️ Couverture du site : X % · n vue(s) sur 126 » — l'infobulle donne le détail). Peinture en property important + observateur : quand acces.js repeint « Progression » à chaque ouverture, l'anneau redevient couverture à la milliseconde. Module additif roue-couverture.js (quand le site gagne une fiche, on la liste dedans — une ligne). sw `v432-couverture`.
- **v433 — audit global de la plateforme (PC + mobile, thèmes clair/sombre) + 3 réparations techniques** : parcours instrumenté des 135 pages × 2 vues (270 chargements) — 0 chargement > 6 s, 0 long task, 0 erreur de page, panneau ⚙️ ouvert en 18–24 ms, barres roulées en 16–96 ms, impression propre, thème sombre persistant et contrasté (aucun texte sous 4.5:1 sur l'échantillon), porte admin fermée (renvoi portail sécurisé), tests/admin hors modules, 0 eval, 0 secret, _blank externes tous noopener. Réparations sans toucher au pédagogique : favicon de « révision-erreurs » (chemin assets/img → assets/icons) ; 15 chaînes JS cassées par des guillemets HTML non échappés dans les 3 pages d'exercices PHP bac (« trouver l'erreur ») → moteur « Pannes » restauré (60 boutons rendus, symptômes affichés, 0 console). Attribution mesurée : les 3 CLS restants sont propres aux scripts des pages (identiques avec/sans nos modules) ; le CSP de datalist.html est hors <head> (ignoré) et le badge décoratif PHP 8.3.7 de quiz/pp.html — deux points signalés à l'auteur, non touchés. Détail complet : RAPPORT-audit-global-v433.md. sw `v433-audit-plateforme`.
- **v427 — prérendu : la barre ne peut plus manquer à l'arrivée (consigne auteur : « je propose de mettre tout dans une seule page »)** : au lieu de fusionner 120 fiches en un monstre, le module de la barre déclare au navigateur des règles de prérendu (Speculation Rules, API JS + repli balise pour Chrome/Edge 121-124) sur tous ses onglets : l'instance de la page suivante est rendue d'avance en arrière-plan — barre installée, thème posé — et la bascule au survol/appui est instantanée, comme dans une page unique. Navigateurs non compatibles : rien ne change, le gabarit v425 reste le filet. Aucun contenu, aucun lien profond, aucun fichier de fiche touchés ; admin exclu comme toujours. sw `v427-prerendu-barre`.
- **v426 — JavaScript : le logo devient le menu, et la page s'appelle « JavaScript » (consigne auteur)** : sur `cours/javascript.html`, le clic sur le logo JS de la barre du haut ouvre/ferme désormais seul le sommaire (≤ 900 px, seuil du ☰ de cette fiche) ; le ☰ distinct est retiré de l'affichage ; la page ne posant pas aria-expanded, notre script le pose pour le bouton et le logo. Au-delà du seuil et sur ordinateur, le logo garde son rôle « haut de page ». Le titre devient **JavaScript** (onglet, bandeau, marque de la barre) et non plus « Annexe JavaScript » — le badge « Conforme à l'Annexe JavaScript officielle » et le lien 📄 ANNEXE JS (le PDF du programme officiel) sont conservés : ils désignent l'annexe réelle, pas la page. sw `v426-javascript-logo-menu`.
- **v425 — navigation sans coupure (consigne auteur : « la barre du bas disparaît en quelques millisecondes quand on appelle l'index depuis une autre page ; exercices s'affiche en clair avant de se rattraper »)** : la cause était le placement — barre et thème se peignaient par des scripts de fin de page, donc APRÈS le premier rendu. Un amorçage précoce (`<script id="sti-early-boot">`) est greffé en tête des 120 pages servies par config.js : avant la moindre feuille de style, il pose le thème mémorisé (html.dark + [data-theme]) et peint le gabarit de la barre mesiné à la visite précédente (mêmes ids que le gabarit v421 ; mobile-nav.js l'efface à l'installation de la vraie barre ; filet de 5 s si le module ne vient jamais). Le gabarit mémorise désormais aussi le thème de la mesure (couleurs de repli cohérentes quand on change de thème entre deux visites) ; config.js passe si le gabarit est déjà peint ; pages à CSP stricte (quiz/tableaux, livre-smart) : inchangées, le gabarit v421 de config.js y reste actif. Aucun contenu pédagogique touché. sw `v425-navigation-sans-coupure` ; refs config.js unifiées à `?v=425`.
- **v424 — le logo devient le menu (consigne auteur : « le bouton en haut à gauche qui contient le logo CSS devient lui seul le menu de la page, idem SQL, idem PHP »)** : sur les fiches CSS3 (les deux copies), SQL et PHP (les deux copies), un clic sur le logo de l'en-tête ouvre/ferme le sommaire — c'est le bouton ☰ existant qui est actionné, donc même animation, même aria, aucun mécanisme réécrit ; le ☰ distinct disparaît de l'affichage sur mobile (une seule entrée : le logo). Au-delà du point de rupture du bouton (640 px pour CSS3, 820 px pour SQL/PHP) et sur ordinateur, le logo garde son rôle « haut de page ». Les pages HTML5, déjà conçues « menu déclenché par le logo », ne bougent pas. sw `v424-logo-menu`.
- **v423 — « 📶 Normal » : la roue seule** (suite de v422, précision auteur « le laisser dans la roue seulement ») : le boîtier de diagnostic réseau Normal/Économie est désormais masqué **partout** hors de la roue ⚙️ — même sur les pages qui n'ont pas de roue, où il restait flottant en bas de l'écran depuis v416 ; dans la roue, rien ne change (ligne en direct « 📶 Normal · X Ko », détail au clic, bascule Économie, Actualiser, Libérer). La pastille cloud garde le comportement de v418 (elle porte les annonces de progression). Tableau de bord et harnais de tests exclus du module : intacts. sw `v423-normal-dans-la-roue-seule`.
- **v422 — annonce de restauration du cloud** : le message « ☁️ Progression restaurée depuis le cloud » (pastille de sync-progressions.js, logée dans la roue ⚙️ depuis v418) ne reste plus figé — il s'affiche **deux secondes** puis la pastille retrouve son état ordinaire « ☁️ Progression synchronisée (cloud) » ; si un autre événement (réseau coupé, échec d'envoi) a changé son texte pendant ces 2 s, c'est cet état qui garde la main. La pastille, elle, ne quitte jamais la roue. sw `v422-annonce-restauration-2s`.
- **v421 — navigation plus légère dans la barre mobile** : (1) onglets Accueil/Cours/Exercices/Quiz et liens du tiroir qui visent la page courante ne rechargent plus la plateforme — remontée douce en haut ou glissement vers la section (#cours, #modules), l'onglet actif suit ; (2) la barre ne « clignote » plus entre deux pages : un gabarit de même couleur et hauteur que la barre réelle est peint dès le parsing par config.js et effacé à l'arrivée de la vraie barre ; (3) les deux destinations hors-document sont préchauffées à l'inactivité ; (4) la puce « 📚 Cours du site » de la barre flottante des séries d'exercices est masquée en dessous de 700 px (l'onglet Cours la remplace) ; (5) le bandeau du cours HTML5 s'appelle « Guide Pratique HTML5 » — la marque de l'exemple-fleuriste en est retirée, contenu et annexe conservés. sw `v421-clic-leger-barre-fantome`.
- **v420 — barre et boutons « haut de page » sur mobile** : (1) la barre du bas ne disparaît plus quand on remonte tout en haut (cours HTML/CSS/SQL…) — sa position et celle de tous les flotteurs suivent désormais la *visualViewport*, donc ils se haussent au-dessus de la barre d'URL (Android) ou d'onglets (iOS) qui réapparaît en haut de page ; sur ordinateur, décalage nul, rien ne bouge. (2) les boutons « remonter en haut » natifs des pages cours (`#to-top` de CSS/SQL/PHP, `#backToTop` de HTML5), jusqu'ici ensevelis sous la barre — les clics tombaient sur l'onglet « Autres » — sont haussés au-dessus d'elle, cliquables à 320 px comme à 700 px. sw `v420-barre-sur-viewport`.
- **v419 — bulle « Reprendre votre lecture »** (cours & exercices, `sti-resume-toast` d'acces.js) : elle quitte le bas-gauche — où elle chevauchait la barre mobile et le tiroir — pour s'ancrer **à gauche, au milieu vertical**, en miroir de la roue ⚙️ ; largeur max réduite de 6 px pour ne jamais toucher la roue. sw `v419-bulle-milieu-gauche`.
- **v418 — barre mobile à 5 onglets + nuage dans la roue** : la barre du bas propose désormais Accueil · **Cours** · Exercices · Quiz · Autres ; le tiroir « Autres » met en tête les trois demandes de l'auteur (les 25 pièges, l'atelier épreuve pratique, les 10 fonctions JavaScript) puis les sections utiles ; la pastille « ☁️ Progression synchronisée (cloud) » et le bouton « 📶 Normal » (diagnostic réseau) ne flottent plus sur les pages — déplacés dans un bloc « ☁️ Nuage & réseau » du panneau de la roue ⚙️, sans réécriture des composants d'origine. sw `v418-barre-cinq-et-roue-nuage`.
- **v417 — RACINE corrigée dans config.js** : l'ancien calcul ne connaissait qu'une liste de pages ; toute page utilitaire hors liste (glossaire, nouveautés, mémo-veille, révision des erreurs, BAC pratique…) produisait une racine fautive, et un visiteur sans session y était renvoyé vers « …/glossaire.html/portail.html » (404). Nouveau calcul général (coupe au premier segment de section connu, sinon retire le nom de fichier) : les redirections d'accès retrouvent le portail réel, sur les 106 pages. Le module de barre garde son calcul autonome (résistant aux vieux caches). sw `v417-racine-reglee-partout`.
- **v416 — retours usage sur la barre mobile** : (1) le bouton « ⬆ Haut » est soulevé au-dessus de la barre (plus de chevauchement, il reste cliquable) ; (2) le bouton flottant « ☀️/🌙 Mode » en bas à gauche est éliminé de toutes les pages (création coupée dans acces.js + neutralisé en CSS pour les anciens caches — le thème reste pilotable par la barre du haut et la roue ⚙️) ; (3) corrigé au passage sur « Mémo veille » : une balise `<iframe>` d'exemple, non échappée dans un titre, avalait tout le bas de la page (sections + scripts) — le contenu et la barre y reviennent. sw `v416-haut-souleve-theme-flottant-hors-jeu`.
- **v415 — correction du manifeste du service worker** : l'entrée du guide SQL ajoutée en v413 était mal orthographiée (« unereête » au lieu de « requête ») et renvoyait un 404 lors de la migration incrémentale ; chemin corrigé (forme accentuée brute, comme les autres entrées) et révision `bnav-admin-out-v415` pour que les clients déjà passés par v413 retentent le téléchargement. sw `v415-manifeste-corrige`.
- **v414 — précisions barre mobile** : le tableau de bord (admin.html) est explicitement exclu du mécanisme (aucun style, aucune barre, aucun padding) ; les boutons flottants existants (messenger, thème clair/sombre universel, pastille de synchro, diagnostics) sont garantis visibles et cliquables au-dessus de la barre. sw `v414-tableau-de-bord-epargne`.
- **v413 — barre de navigation mobile en bas de l'écran** : sur toutes les pages en dessous de 700 px, une barre fixe propose Accueil · Exercices · Quiz · Autres ; « Autres » ouvre un tiroir vers les autres sections (cours, livres, progression, glossaire, outils du bac, portail…). Elle se masque avec les modales, soulève les flotteurs du bas et respecte le thème clair/sombre. Mécanisme : injection depuis config.js (+ script direct sur les 2 pages orphelines), sw `v413-barre-basse`.
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
| v438 | 🔁 Tableau de bord : **suivi de la révision espacée** (qui révise vraiment — adhésion, pages en retard, pages acquises, quiz faibles) + export CSV · module additif `assets/js/admin-revision.js` |
| v437 | 🩹 corrige l'affichage de l'échéance de révision (« J+2 » → **J+1 / J+3 / J+7**, intervalles réels) dans le panneau de la roue et sur la fiche |
| v436 | 🔁 **révision espacée** dans la roue (pages à revoir à J+1/J+3/J+7 + quiz < 10/20, bouton ✔), 🖨 **fiche de révision imprimable** (`ma-fiche-revision.html`), 🔔 **rappels locaux** opt-in (une notification par jour max, zéro serveur), 🌗 **thème clair du portail** de connexion |
| v435 | 🗺 Tableau de bord : **couverture du site par élève** (journal de la roue, lu depuis le nuage) + section « élèves à risque » (seuils couverture / inactivité / quiz) et **export CSV** pour le conseil de classe — module additif `assets/js/admin-couverture.js` |
| v434 | 🔧 gains rapides d'audit : fin des fences markdown de `cours/datalist.html` (quirks mode + CSP ignorée), badges PHP 8.5 dans `quiz/pp.html`, 404 sans charges mortes, preconnect polices (CLS), **manifeste de couverture généré** (`tools/pages-couverture.py` → `assets/pages-couverture.json`) |
| v396 | 🧪 SQL de poche : `cours/sql-playground.html` — SQLite wasm 100 % local, 3 bases de révision, historique & favoris hors-ligne |
| v397 | 📓 Carnet d’observations de la classe : table `sti_observations` (RLS prof, purge liée à l’élève) |
| v398 | ⚙️ Tiroir « Système & Plus » : Flash, Appel, Top 3, Aide, Maj rangés sous le plus/moins de la barre d’outils |
| v399 | 🧹 Suppression du second tiroir « Tous les outils & actions » — un seul point d’entrée vers les outils du tableau de bord |
| v400 | 📟 « La Cote » sur la page d’accueil : bandeau défilant type tableau de bourse — cotation officielle des technos (HTML5 Living Standard, CSS3, JavaScript ES2026, SQL:2023, PHP 8.5.12) + les 5 dernières nouvelles lues dans ce README |
| **v408** | **Bandeau réparé et visible sur mobile** — le défilement est relancé (bug v406 : la moitié dupliquée recevait un `setAttribute` interdit sur un fragment, ce qui tuait tout le moteur du bandeau) ; sur téléphone le bandeau reste EN HAUT de la page en carte compacte au lieu d'être poussé sous le hero où on ne le voyait plus. |
| **v409** | **Sens droite → gauche + bandeau épuré** — le texte défile de la droite vers la gauche (retour usage) ; l'étiquette « LA COTE · STI » et le bouton HISTORIQUE sont retirés du bandeau : il ne reste que le point vert, la piste et son contenu. |
| **v410** | **Bouton clair/sombre remis sur la ligne** — en mode téléphone, la marque trop large faisait tomber le bouton de thème à la seconde ligne de la barre du haut ; la marque se raccourcit désormais au lieu de pousser le bouton (desktop inchangé). |
| **v411** | **La définition animée revient sur téléphone** — le bouton clair/sombre n'était plus renvoyé à la ligne au prix de la disparition du texte « Systèmes et Technologies de l'Informatique » (v410) ; il est maintenant dactylographié sur deux lignes si la place manque, et le bouton garde sa place. |
| **v412** | **Fin des sauts de page dus à la dactylo** — sur téléphone, la définition « Systèmes et Technologies de l'Informatique » ne se replie plus sur deux lignes (la barre grandissait puis rétrécissait pendant la frappe, et la page dansait) ; seule sa taille de police est réduite, avec un ajustement automatique à la largeur d'écran. |
| v401 | 📱 Mobile : le bandeau « La Cote » glisse sous le hero (après les boutons quiz & cours) au lieu de les pousser hors écran ; étiquettes allégées et bandeau compact sous 700px |
| v402 | 📰 Régie des news dans le tableau de bord (tiroir ⚙️ → bouton « News du bandeau ») : jusqu’à 12 messages colorés, ordonnables et supprimables, stockés dans `app_config_public` (ligne `ticker_news`, RLS admin) ; le bandeau de l’accueil les lit en priorité (repli README), défilement continu sans trou quelle que soit la largeur |
| v403 | 🐛 Correction régie news : le module s’exécutait avant la fin du parse de `admin.html` (la modale vit en fin de `<body>`), le bouton « News du bandeau » était donc inerte — initialisation désormais différée à `DOMContentLoaded` ; cache-buster `admin.js?v=403-regie-news` |
| v404 | 🔄 News de la régie lues en « no-store » (plus de copie périmée du navigateur) et relecture automatique au retour d’onglet : après « Enregistrer » dans l’admin, le bandeau de l’accueil passe à jour sans rechargement |
| v405 | 🏷️ Le bandeau affiche son « MOTEUR vNNN » en clair + cache-buster `?v=` sur le module : fini de deviner si l’écran montre une vieille copie du cache |
| v406 | ⏱️→ Sens de défilement inversé (gauche → droite) + dans la régie news, case « News visibles sur l’accueil » : décochée, le bandeau retire les news (liste conservée, rien ne sont supprimées) et n’affiche plus que la corbeille tech |
| v407 | ⚡ Le bandeau ne montre plus jamais de vieux texte en attendant la réponse : premier cadre = corbeille tech seule, les news de la régie arrivent dès la réponse (timeout 3,5 s + pré-connexion Supabase en haut de page pour tuer le froid TLS) |

---

*STI By A'e — © Aymen Essouyah, Lycée Rafèha. Tous droits réservés.*
