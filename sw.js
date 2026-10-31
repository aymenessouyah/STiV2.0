/* STI by AE — Service Worker hors-ligne (PC Windows & Mobile) — v48 incrémentale
   RÈGLE MOBILE : une mise à jour automatique ne télécharge que les fichiers réellement modifiés.
   Le cache existant est migré localement, sans réseau, et le téléchargement intégral reste
   disponible uniquement après une action volontaire sur le bouton « Hors-ligne ». */

var CACHE = "sti-atelier-v386";
/* À chaque publication, ne placer ici QUE les chemins réellement modifiés (1 seule entrée par URL).
   Ne jamais y ajouter automatiquement les vidéos, audios, PDF ou archives lourdes. */
var UPDATE_ID = "v582-journal-connexions";
/* v587 · identité de la PUBLICATION — affichée dans le tableau de bord juste après
   le numéro de version (« Version V2.0 · v587 · 31/10/2026 10:15 »). À mettre à jour
   à chaque livraison, avec la date et l'heure UTC du commit de fusion.
   Ce n'est PAS le jeton de cache : UPDATE_ID et CACHE restent volontairement stables,
   sinon les 778 entrées de chaîne du delta seraient re-téléchargées en entier. */
var VERSION_PUBLIEE = "v607";
var PUBLIEE_LE = "2026-11-01T21:20:00Z";
/* Historique caches : sti-atelier-v379, sti-atelier-v373, sti-atelier-v372, sti-atelier-v371, sti-atelier-v370, sti-atelier-v369, sti-atelier-v368, sti-atelier-v367, sti-atelier-v366, sti-atelier-v365, sti-atelier-v364, sti-atelier-v363, sti-atelier-v362, sti-atelier-v361, sti-atelier-v360, sti-atelier-v359, sti-atelier-v358, sti-atelier-v357, sti-atelier-v356, sti-atelier-v355, sti-atelier-v354, sti-atelier-v353, sti-atelier-v352, sti-atelier-v351, sti-atelier-v350, sti-atelier-v349, sti-atelier-v348, sti-atelier-v347, sti-atelier-v346, sti-atelier-v345, sti-atelier-v344, sti-atelier-v343, sti-atelier-v342, sti-atelier-v341, sti-atelier-v340, sti-atelier-v339, sti-atelier-v338, sti-atelier-v337, sti-atelier-v336, sti-atelier-v335, sti-atelier-v334, sti-atelier-v333, sti-atelier-v332, sti-atelier-v331, sti-atelier-v330, sti-atelier-v329, sti-atelier-v328, sti-atelier-v327, sti-atelier-v326 | Historique lots : v607-journal-acces-20261101, v606-export-trouvable-20261101, v605-compteurs-expliques-20261101, v604-cercle-carte-20261101, v603-export-drive-20261101, v602-roue-compte-20261101, v601-pastilles-ligne-20261101, v600-pastilles-cours-20261101, v599-accueil-mobile-20261031, v547-boucles-php-20261030, v546-boucles-tableau-20261030, v545-boucles-media-20261030, v544-boucles-intro-fin-20261030, v543-boucles-trois-20261030, v542-boucle-pour-grille-20261030, v541-boucle-pour-brouillon-20261030, v540-boucle-pour-variable-20261030, v537-boucle-pour-20261029, v536-classe-nav-active-20261029, v535-volet-sans-fiches-20261029, v534-pastille-sync-2s-20261029, v533-tableau-de-bord-mobile-20261029, v532-barre-mobile-moderne-20261029, v531-vues-videos-periode-20261029, v530-vues-videos-classe-20261029, v529-vues-videos-20261029, v519-tirage-xp-rapide-20261029, v513-compteurs-videos-20261029, v512-tp-transitions-20261028, v511-tp-display-lecteur-20261028, v510-tp-display-20261028, v509-drapeau-vent-20261028, v508-retrait-fond-cours-20261028, v507-accueil-video-fond-20261028, v506-fond-cours-20261028, v505-tp-formulaire-long-20261028, v504-tp-capsules-longues-20261028, v503-accueil-lycee-20261028, v502-tp-formulaire-20261028, v501-tp-voix-20261028, v500-tp-evenements-liens-20261028, v499-ruban-orange-20261028, v498-accueil-drapeau-ruban-20261028, v497-news-niveaux-20261028, v496-news-perso-20261028, v495-video-alea-xp-20261028, v494-retour-quiz-intelligent-20261028, v493-onglets-mobile-20261028, v492-progression-chapitres-20261028, v491-suivi-contextes-20261028, v490-xp-parties-pwa-20261028, v489-reconnexion-delta-20261028, v488-badge-image-20261028, v486-cours-retour-xp-20261027, v485-video-js-validation-20261027, v484-navigation-videos-mobile-20261027, v479-compteur-media-monotone, v478-refonte-sql-php-20261027, v478-xp-quiz-monotone, xp-quiz-monotone-v478, v477-maj-version-cache-direct, maj-version-v477, v476-retour-accueil-quiz-exo, retour-quiz-v476, v476-retour-exercices-accueil, retour-exo-v476, v475-nav-fluide-instant, nav-fluide-v475, v474-perf-quiz-php, perf-quiz-php-v474, v473-perf-fluide, sauvegarde-18-v590, v472-test-plateforme-complet, v471-tester-tout-e2e, v470-audit-fonctionnel-readme, v469-pagination-integrale, v468-audit-integral, v467-sauvegarde-readme, v466-dbsupbase, v465-nav-fluide, v464-verif-e2e, v463-audit-complet, v462-carte-boutons, compteurs-media-v461, v461-compteurs-media, v460-quiz-supabase-ordre, v459-carte-quiz-eval, v458-quiz-revision-2, v457-quiz-lot-d, v456-quiz-lots-abc, quiz-lots-abc-v456, revision-quiz-v455, retrait-nav-conseils-v454, unif-acces-themes-v453, conseil-classe-nouveautes-marque-v451, messenger-roue-admin-only-v450, rayonsx-surligneur-v449, trombi-carte-recadrage-v448, zoom-photo-v447, ruban-modes-v446, student-photos-v445, v358-quiz-sync
   Manifeste cumulatif dédupliqué : une révision déjà appliquée est ignorée localement,
   et aucun fichier non présent dans le cache local n'est pré-téléchargé inutilement à l'installation. */
var UPDATE_FILES = [
  /* v556 — assets/css/capsules-vedettes.css est un FICHIER NEUF : rien de périmé à
     invalider, et le delta reste plafonné à 262 entrées. Il est déclaré dans SHELL,
     OFFLINE_LIST et NOYAU_RAPIDE_RECHARGEMENT ; NOUVEAUTES_NOYAU le télécharge à
     l'installation sur les appareils déjà équipés. */
  { url: "./assets/js/cours-onglets-mobile.js", revision: "onglets-mobile-v493", refreshIfCached: true },
  { url: "./assets/js/appel-quiz.js", revision: "retour-quiz-intelligent-v494" },
  { url: "./assets/js/suivi-profil.js", revision: "suivi-contextes-v491" },
  { url: "./assets/js/reconnexion-profil.js", revision: "vues-videos-v531" },
  /* Pages et modules légers modifiés par la fidélité visuelle ; seuls les fichiers déjà visités sont invalidés. */
  { url: "./Positionnement-animee/index.html", revision: "meta-seo-v521" },
  { url: "./assets/css/theme-patrimoine.css", revision: "fidelite-origine-v481" },
  { url: "./assets/js/lecteur-commun.js", revision: "cours-sti-v578" },
  { url: "./assets/subtitles/validation-nom-prenom-js-fr.vtt", revision: "video-js-validation-v485" },
  { url: "./assets/js/retour-quiz.js", revision: "retour-quiz-intelligent-v494" },
  { url: "./cours/PHP-recap.html", revision: "meta-seo-v521" },
  { url: "./cours/Recap-JavaScript-STI.html", revision: "fidelite-origine-v481" },
  { url: "./cours/annexe-fleuriste-html5.html", revision: "audit-plateforme-v552", refreshIfCached: true },
  { url: "./cours/datalist.html", revision: "suivi-contextes-v491", refreshIfCached: true },
  { url: "./cours/php-recap.html", revision: "meta-seo-v521" },
  { url: "./cssanimee/index.html", revision: "meta-seo-v521" },
  { url: "./documents/annexes/annexe-css3.pdf.html", revision: "meta-seo-v521" },
  { url: "./documents/annexes/annexe-javascript.pdf.html", revision: "meta-seo-v521" },
  { url: "./documents/annexes/annexe-php.pdf.html", revision: "meta-seo-v521" },
  /* v531 : le module du petit coin doit être invalidé comme les autres (place prise
     sur l'annexe SQL, figée depuis la v481 ; à remettre dans la liste si elle évolue). */
  { url: "./assets/js/admin-vues-videos.js", revision: "cours-sti-v578" },
  { url: "./documents/complet/complet-3eme-si-bd.pdf.html", revision: "meta-seo-v521" },
  { url: "./documents/complet/complet-3eme-si.pdf.html", revision: "meta-seo-v521" },
  { url: "./documents/complet/complet-4eme-si-cours.pdf.html", revision: "meta-seo-v521" },
  { url: "./documents/complet/complet-4eme-si-resume.pdf.html", revision: "meta-seo-v521" },
  { url: "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Enonce.pdf.html", revision: "meta-seo-v521" },
  { url: "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Solution/ExploreTunisie/index-float.html", revision: "meta-seo-v521" },
  { url: "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Solution/ExploreTunisie/index-position.html", revision: "meta-seo-v521" },
  { url: "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Solution/ExploreTunisie/index.html", revision: "meta-seo-v521" },
  { url: "./exercices/html-css/TP1-css.pdf.html", revision: "meta-seo-v521" },
  { url: "./exercices/html-css/TP2-css.pdf.html", revision: "meta-seo-v521" },
  { url: "./exercices/html-css/TP2/tp2corrposition.html", revision: "meta-seo-v521", refreshIfCached: true },
  { url: "./exercices/html-css/TP3-css.pdf.html", revision: "meta-seo-v521" },
  { url: "./exercices/html-css/activite-html-css/Act1/page1.html", revision: "meta-seo-v521", refreshIfCached: true },
  { url: "./exercices/html-css/activite-html-css/Act2/page2.html", revision: "meta-seo-v521", refreshIfCached: true },
  { url: "./exercices/html-css/activite1-2-position-animation-css3.pdf.html", revision: "meta-seo-v521" },
  { url: "./exercices/html-css/box-shadow-text-shadow-css3.html", revision: "meta-seo-v521", refreshIfCached: true },
  { url: "./exercices/html-css/emploi-temps/emploidutemps.html", revision: "meta-seo-v521", refreshIfCached: true },
  { url: "./exercices/html-css/formulaire-inscription.pdf.html", revision: "meta-seo-v521" },
  { url: "./exercices/javascript/Tp1-Correction-js.html", revision: "meta-seo-v521", refreshIfCached: true },
  { url: "./exercices/javascript/Tp1-js.html", revision: "meta-seo-v521", refreshIfCached: true },
  { url: "./exercices/javascript/Tp2-Correction-js.html", revision: "meta-seo-v521", refreshIfCached: true },
  { url: "./exercices/javascript/Tp2-js.html", revision: "meta-seo-v521", refreshIfCached: true },
  { url: "./exercices/javascript/Tp3-Correction-js.html", revision: "meta-seo-v521", refreshIfCached: true },
  { url: "./exercices/javascript/Tp3-js.html", revision: "meta-seo-v521", refreshIfCached: true },
  { url: "./exercices/javascript/Tp4-Correction-js.html", revision: "meta-seo-v521", refreshIfCached: true },
  { url: "./exercices/javascript/Tp4-js.html", revision: "meta-seo-v521", refreshIfCached: true },
  { url: "./exercices/javascript/Tp5-Correction-js.html", revision: "meta-seo-v521", refreshIfCached: true },
  { url: "./exercices/javascript/Tp5-js.html", revision: "meta-seo-v521", refreshIfCached: true },
  { url: "./exercices/php/4STi-dc-6-2025-2026.pdf.html", revision: "meta-seo-v521" },
  { url: "./exercices/php/Tp1-Correction-php.html", revision: "meta-seo-v521" },
  { url: "./exercices/php/Tp1-php.html", revision: "meta-seo-v521" },
  { url: "./exercices/php/Tp2-Correction-php.html", revision: "meta-seo-v521", refreshIfCached: true },
  { url: "./exercices/php/Tp2-php.html", revision: "meta-seo-v521", refreshIfCached: true },
  { url: "./exercices/php/Tp3-correction-php.html", revision: "meta-seo-v521", refreshIfCached: true },
  { url: "./exercices/php/Tp3-php.html", revision: "meta-seo-v521", refreshIfCached: true },
  { url: "./exercices/php/Tp4-Correction-php.html", revision: "meta-seo-v521" },
  { url: "./exercices/php/Tp4-php.html", revision: "meta-seo-v521" },
  { url: "./exercices/php/Tp5-Correction-php.html", revision: "meta-seo-v521" },
  { url: "./exercices/php/Tp5-php.html", revision: "meta-seo-v521" },
  { url: "./exercices/php/sondage-parcours-pas-a-pas.html", revision: "meta-seo-v521" },
  { url: "./exercices/php/statphpanimee.html", revision: "meta-seo-v521" },
  { url: "./exercices/resume-fonctions-standards.html", revision: "suivi-contextes-v491", refreshIfCached: true },
  { url: "./exercices/sql/Tp-BD-Jointure-sous-requetes-Group-By.html", revision: "meta-seo-v521", refreshIfCached: true },
  { url: "./exercices/sql/Tp-GroupBy-bd.html", revision: "meta-seo-v521", refreshIfCached: true },
  { url: "./exercices/sql/Tp-date-ssr-j-gp-bd.html", revision: "meta-seo-v521", refreshIfCached: true },
  { url: "./exercices/sql/Tp-date-ssr-j-gp-correction-bd.html", revision: "meta-seo-v521", refreshIfCached: true },
  { url: "./exercices/sql/Tp1-Correction-bd.html", revision: "meta-seo-v521", refreshIfCached: true },
  { url: "./exercices/sql/Tp1-bd.html", revision: "meta-seo-v521", refreshIfCached: true },
  { url: "./exercices/sql/Tp2-Correction-bd.html", revision: "meta-seo-v521", refreshIfCached: true },
  { url: "./exercices/sql/Tp2-bd.html", revision: "meta-seo-v521", refreshIfCached: true },
  { url: "./exercices/sql/Tp3-Correction-bd.html", revision: "meta-seo-v521", refreshIfCached: true },
  { url: "./exercices/sql/Tp4-correction-bd.html", revision: "meta-seo-v521", refreshIfCached: true },
  { url: "./exercices/sql/atelier_sql_3_fenetres.html", revision: "meta-seo-v521", refreshIfCached: true },
  { url: "./exercices/sql/sql-correction.html", revision: "meta-seo-v521", refreshIfCached: true },
  { url: "./exercices/sql/sql.html", revision: "meta-seo-v521", refreshIfCached: true },
  { url: "./projets/carte-bancaire/enonce-tp-carte-bancaire.html", revision: "meta-seo-v521" },
  { url: "./projets/fleurs/Corrections.html", revision: "meta-seo-v521" },
  { url: "./projets/fleurs/media/projet-fleurs-4sti-eleve.pdf.html", revision: "meta-seo-v521" },
  { url: "./projets/formulaire-inscription/enonce/cvFleurs-énoncé/formulaire inscription.pdf.html", revision: "meta-seo-v521" },
  { url: "./projets/site-tunisie/correction-details/carte-timbre-droite-haut.html", revision: "meta-seo-v521" },
  { url: "./projets/site-tunisie/enonce.html", revision: "meta-seo-v521" },
  { url: "./projets/site-tunisie/index.html", revision: "meta-seo-v521" },
  { url: "./projets/site-tunisie/pages/accueil.html", revision: "meta-seo-v521" },
  { url: "./projets/site-tunisie/pages/centre.html", revision: "meta-seo-v521" },
  { url: "./projets/site-tunisie/pages/nord.html", revision: "meta-seo-v521" },
  { url: "./projets/site-tunisie/pages/sud.html", revision: "meta-seo-v521" },
  { url: "./projets/site-tunisie/site-tunisie-Correction-animation-html-css.html", revision: "meta-seo-v521" },
  { url: "./projets/sti0/Sondage.html", revision: "meta-seo-v521" },
  { url: "./projets/sti0/Statistiques.html", revision: "meta-seo-v521" },
  { url: "./projets/sti0/index.html", revision: "meta-seo-v521" },
  { url: "./projets/sti0/projetsti0.pdf.html", revision: "meta-seo-v521" },
  { url: "./projets/sti0/sondage.html", revision: "meta-seo-v521" },
  { url: "./projets/sti0/statistiques.html", revision: "meta-seo-v521" },
  /* La visionneuse, les logos et le complément de démonstration restent locaux. */
  { url: "./assets/css/visionneuse-exercices.css", revision: "fidelite-origine-v481" },
  { url: "./assets/js/visionneuse-exercices.js", revision: "fidelite-origine-v481" },
  { url: "./assets/icons/matieres.svg", revision: "matiere-sti-v596" },
  { url: "./projets/carte-bancaire/demo.js", revision: "fidelite-origine-v481" },
  /* Pages SQL/PHP et ressources légères de leur refonte. */
  { url: "./assets/css/cours-matieres.css", revision: "barre-mobile-v532" },
  { url: "./assets/css/cours-sql-heritage.css", revision: "refonte-sql-php-20261027" },
  { url: "./assets/css/cours-php-heritage.css", revision: "refonte-sql-php-20261027" },
  { url: "./assets/js/cours-matieres.js", revision: "progression-chapitres-v492", refreshIfCached: true },
  { url: "./assets/js/cours-media-reperes.js", revision: "refonte-sql-php-20261027" },
  { url: "./assets/js/cours-sql-animations.js", revision: "refonte-sql-php-20261027" },
  { url: "./assets/js/cours-sql-voix.js", revision: "refonte-sql-php-20261027" },
  { url: "./assets/js/cours-sql-worker.js", revision: "refonte-sql-php-20261027" },
  /* Refonte HTML5, CSS3 et JavaScript : invalider les versions précédentes sans toucher aux accès. */
  { url: "./assets/css/dialogues-compat.css", revision: "correctif-ressources-js-20261027" },
  { url: "./assets/js/dialogues-compat.js", revision: "fidelite-origine-v481" },
  { url: "./projets/fleurs/index.html", revision: "meta-seo-v521" },
  { url: "./projets/fleurs/inscription.html", revision: "meta-seo-v521" },
  { url: "./projets/fleurs/controle.js", revision: "fidelite-origine-v481" },
  { url: "./projets/fleurs/styles.css", revision: "correctif-ressources-js-20261027" },
  { url: "./projets/formulaire-inscription/cvFleurs.html", revision: "meta-seo-v521" },
  { url: "./projets/carte-bancaire/cb.html", revision: "meta-seo-v521" },
  { url: "./projets/carte-bancaire/controle.js", revision: "fidelite-origine-v481" },
  { url: "./projets/carte-bancaire/style.css", revision: "correctif-ressources-js-20261027" },
  { url: "./assets/css/cours-javascript.css", revision: "barre-mobile-v532" },
  { url: "./assets/js/cours-javascript.js", revision: "progression-chapitres-v492", refreshIfCached: true },
  { url: "./assets/css/cours-css3.css", revision: "videos-pas-a-pas-css3-20261027" },
  { url: "./assets/js/cours-css3.js", revision: "tp-transitions-v512", refreshIfCached: true },
  { url: "./assets/css/theme.css", revision: "roue-compte-v602" },
  { url: "./assets/css/badge-compte.css", revision: "cercle-carte-v604" },
  { url: "./assets/images/badge-compte-vierge.png", revision: "badge-image-v488", bootstrapBySize: true, bytes: 61624, sha256: "5db4dd880a51ad29b9bf2a931ac678c1c07eccc7b6cc0c5c10e3dc233c65c576" },
  { url: "./assets/icons/sti-icon-192.png", revision: "badge-dependances-v483", bootstrapBySize: true, bytes: 46307, sha256: "3cb051093c543b33427d00126f859678f8d696b3be3e22265ad3a0a548727714" },
  { url: "./assets/images/qr-code-site.png", revision: "badge-dependances-v483", bootstrapBySize: true, bytes: 9391, sha256: "b21601d270b3f2d6971100d77e1a11232a9d34bf475caa7be6c3542c96328cd0" },
  { url: "./assets/css/cours.css", revision: "retrait-fond-cours-v508", refreshIfCached: true },
  { url: "./assets/js/app.js", revision: "roue-compte-v602" },
  /* v587 — la feuille des capsules n'avait aucune révision propre : elle n'était
     jamais rafraîchie chez les appareils déjà installés. */
  { url: "./assets/css/capsules-vedettes.css", revision: "cours-sti-v595", refreshIfCached: true },
  { url: "./assets/js/news-perso.js", revision: "ruban-vert-v517" },
  { url: "./assets/images/drapeau-tunisie.svg", revision: "accueil-lycee-v503" },
  { url: "./assets/js/profil.js", revision: "roue-compte-v602" },
  { url: "./assets/js/cours-html5.js", revision: "tp-display-v510", refreshIfCached: true },
  { url: "./index.html", revision: "cours-sti-v596" },
  { url: "./dashboard.html", revision: "livre-3si-81p-v585", refreshIfCached: true },
  { url: "./admin.html", revision: "journal-acces-v607" },
  { url: "./README.md", revision: "couverture-v583" },
  { url: "./package.json", revision: "xp-operations-v487" },
  { url: "./package-lock.json", revision: "xp-operations-v487" },
  { url: "./assets/data/nouveautes.json", revision: "exercices-sti-v595" },
  { url: "./assets/js/config.js", revision: "cercle-carte-v604" },
  { url: "./assets/js/acces.js", revision: "journal-acces-v607" },
  { url: "./assets/js/protection.js", revision: "cours-sti-v578" },
  { url: "./assets/js/mobile-nav.js", revision: "cercle-carte-v604" },
  { url: "./assets/js/roue-nuage.js", revision: "pastille-sync-v534" },
  { url: "./assets/js/roue-habillage.js", revision: "badge-dependances-v483", bootstrapBySize: true, bytes: 8050, sha256: "0cbd800edc65bb32fa9f370071ce4405c30b2088a72ef89119d14232685557fc" },
  { url: "./assets/js/roue-initiales.js", revision: "cercle-carte-v604" },
  { url: "./assets/css/quiz-php-tw.css", revision: "perf-quiz-php-v474" },
  { url: "./assets/css/quiz-sql-tw.css", revision: "perf-quiz-php-v474" },
  { url: "./assets/css/quiz-js-tw.css", revision: "perf-quiz-php-v474" },
  { url: "./assets/js/vendor/chart.umd.min.js", revision: "perf-quiz-php-v474" },
  { url: "./assets/js/vendor/confetti.browser.min.js", revision: "perf-quiz-php-v474" },
  { url: "./assets/js/vendor/prism-js.min.js", revision: "perf-quiz-php-v474" },
  { url: "./assets/fonts/fredoka-var.woff2", revision: "nav-fluide-v475" },
  { url: "./assets/fonts/jetbrains-mono-400.woff2", revision: "nav-fluide-v475" },
  { url: "./assets/fonts/nunito-var.woff2", revision: "nav-fluide-v475" },
  { url: "./assets/fonts/inter-var.woff2", revision: "nav-fluide-v475" },
  { url: "./assets/fonts/jetbrains-mono-var.woff2", revision: "nav-fluide-v475" },
  { url: "./quiz/php.html", revision: "plafond-a-v555" },
  { url: "./quiz/sql.html", revision: "plafond-a-v555" },
  { url: "./quiz/javascript.html", revision: "plafond-a-v555" },
  { url: "./cours/sql.html", revision: "schema-notation-v563", refreshIfCached: true },
  { url: "./cours/sql-contraintes.html", revision: "meta-seo-v521" },
  { url: "./exercices/php/debogage-php-bac.html", revision: "meta-seo-v521" },
  { url: "./exercices/php/ordre-php-bac.html", revision: "meta-seo-v521" },
  { url: "./exercices/php/trace-fetch-php.html", revision: "meta-seo-v521" },
  { url: "./memo-veille-bac.html", revision: "meta-seo-v521" },
  { url: "./outils-js-bac.html", revision: "meta-seo-v521" },
  { url: "./pieges-bac.html", revision: "meta-seo-v521" },
  /* v504 : capsule « Événements » refondue (14 min, voix off, lecteur expliqué). */
  { url: "./offline-complete-manifest.json", revision: "journal-acces-v607" },
  { url: "./exercices/html-css/tp-evenements-liens/index.html", revision: "audit-plateforme-v552" },
  /* v502 : nouveau TP pas à pas — formulaire, tableau et autres balises. */
  /* v512 : nouveau TP — transitions et animations (deux exercices corrigés). */
  { url: "./exercices/html-css/tp-transitions-animations/index.html", revision: "meta-seo-v521" },
  { url: "./exercices/html-css/tp-display-float-position/index.html", revision: "meta-seo-v521" },
  { url: "./exercices/html-css/tp-formulaire-tableau-autre/index.html", revision: "meta-seo-v521" },
  { url: "./exercices/html-css/tp-formulaire-tableau-autre/drapeau.png", revision: "tp-formulaire-v502" },
  { url: "./exercices/html-css/tp-evenements-liens/drapeau.png", revision: "tp-evenements-v500" },
  { url: "./ma-fiche-revision.html", revision: "fidelite-origine-v481" },
  { url: "./assets/js/roue-couverture.js", revision: "couverture-v598", bootstrapBySize: true, bytes: 13954, sha256: "581824de88f82616bbae91d66e59d30d32a8725e2e6208afe943556ab3e5ac33" },
  { url: "./assets/js/roue-revision.js", revision: "tp-train-v523" },
  { url: "./assets/js/roue-plan.js", revision: "sauvegarde-18-v590" },
  { url: "./assets/js/sync-progressions.js", revision: "pastille-sync-v534" },
  { url: "./assets/js/xp-plancher.js", revision: "xp-jamais-en-recul-v520" },
  { url: "./assets/js/admin.js", revision: "journal-acces-v607" },
  { url: "./assets/js/quiz-admin.js", revision: "nav-fluide-v475" },
  { url: "./assets/js/sauvegarde.js", revision: "export-trouvable-v606" },
  { url: "./assets/js/export-drive.js", revision: "export-drive-v603" },
  { url: "./assets/js/reprendre.js", revision: "vues-videos-v531" },
  { url: "./assets/js/sante.js", revision: "tp-transitions-v512" },
  { url: "./revision-erreurs.html", revision: "quiz-syst-71-v590", refreshIfCached: true },
  { url: "./bac-pratique.html", revision: "meta-seo-v521" },
  { url: "./exercices/series-exercices.html", revision: "serie6-exercices-v524", refreshIfCached: true },
  { url: "./cours/courscss3.html", revision: "suivi-contextes-v491", refreshIfCached: true },
  { url: "./cours/css3.html", revision: "tp-transitions-v512", refreshIfCached: true },
  { url: "./cours/coursphp.html", revision: "suivi-contextes-v491", refreshIfCached: true },
  { url: "./cours/javascript.html", revision: "cours-sti-v595", refreshIfCached: true },
  { url: "./cours/php.html", revision: "cours-sti-v595", refreshIfCached: true },
  { url: "./cours/fiche-revision-html5.html", revision: "suivi-contextes-v491", refreshIfCached: true },
  { url: "./quiz/html-css.html", revision: "plafond-a-v555" },
  { url: "./assets/js/quiz-alea.js", revision: "plafond-a-v555" },
  { url: "./assets/js/portail.js", revision: "audit-fonctionnel-v470" },
  { url: "./assets/js/quiz-sync.js", revision: "quiz-syst-71-v590" },
  { url: "./assets/js/quiz-tableaux.js", revision: "plafond-a-v555" },
  { url: "./assets/js/quiz-systemes.js", revision: "quiz-syst-71-v590" },
  { url: "./assets/js/quiz-systemes-boot.js", revision: "quiz-syst-71-v590" },
  { url: "./assets/data/quiz-systemes-internet.json", revision: "quiz-syst-71-v590" },
  { url: "./quiz/systemes-internet.html", revision: "quiz-syst-71-v590", refreshIfCached: true },
  { url: "./documents/sql/sauvegarde-auto-drive.gs", revision: "audit-fonctionnel-v470" },
  { url: "./documents/annexes/annexe-html5.pdf.html", revision: "meta-seo-v521" },
  { url: "./assets/js/admin-couverture.js", revision: "couverture-v583" },
  { url: "./assets/js/admin-revision.js", revision: "couverture-v583" },
  { url: "./assets/js/graphiques-activite.js", revision: "nav-fluide-v475" },
  { url: "./assets/js/analytique.js", revision: "secours-plateforme-v598" },
  { url: "./quiz/pp.html", revision: "meta-seo-v521" },
  { url: "./quiz/tableaux.html", revision: "plafond-a-v555", refreshIfCached: true },
  { url: "./manifest.webmanifest", revision: "dbsupbase-v466" },
  { url: "./assets/js/admin-dbsupbase.js", revision: "dbsupbase-v466" },
  { url: "./assets/js/cote-ticker.js", revision: "nav-fluide-v465" },
  { url: "./cours/php-mysqli.html", revision: "fidelite-origine-v481" },
  { url: "./assets/js/modules/mobile-diagnostics.js", revision: "verif-e2e-v464" },
  { url: "./assets/js/admin-erreurs.js", revision: "nav-fluide-v475" },
  { url: "./cours/sql-playground.html", revision: "suivi-contextes-v491", refreshIfCached: true },
  { url: "./documents/complet/fiche-memento-synthese.html", revision: "meta-seo-v521" },
  { url: "./documents/enonces/enonce-serie4-a4.html", revision: "meta-seo-v521" },
  { url: "./documents/enonces/enonce-serie5-a4.html", revision: "meta-seo-v521" },
  { url: "./exercices/javascript/js-37-defis-tt.html", revision: "barre-mobile-v532" },
  { url: "./exercices/sql/CommentConstruireunerequêteSQL.html", revision: "barre-mobile-v532" },
  { url: "./assets/css/admin-saas.css", revision: "nav-fluide-v475" },
  { url: "./assets/data/quiz-banque.json", revision: "quiz-bases-v590" },
  { url: "./assets/pages-couverture.json", revision: "secours-plateforme-v598" },
  { url: "./assets/js/quiz-tableaux-boot.js", revision: "quiz-lots-abc-v456" },
  { url: "./glossaire.html", revision: "glossaire-sti-v578" },
  { url: "./404.html", revision: "meta-seo-v521" },
  { url: "./nouveautes.html", revision: "meta-seo-v521" },
  { url: "./assets/js/nouveautes.js", revision: "maj-version-v477" },
  { url: "./carte-visite.html", revision: "fidelite-origine-v481" },
  { url: "./assets/js/rayonsx-surligneur.js", revision: "defilement-passif-v553" },
  { url: "./assets/images/admin-aymen.jpg", revision: "admin-badge-v444" },
  { url: "./assets/js/admin-mdp.js", revision: "nav-fluide-v475" },
  { url: "./assets/fonts/fonts.css", revision: "admin-saas-v443-atelier" },
  { url: "./assets/fonts/comic-neue-latin-400.woff2", revision: "admin-saas-v443-atelier" },
  { url: "./assets/fonts/comic-neue-latin-700.woff2", revision: "admin-saas-v443-atelier" },
  { url: "./portail.html", revision: "portail-sans-barre-v579" },
  { url: "./assets/js/modules/password-recovery.js", revision: "recovery-v441" },
  { url: "./assets/js/rappels-locaux.js", revision: "rappels-v436" },
  { url: "./cours/html5.html", revision: "sti-3si-v573", refreshIfCached: true },
  { url: "./cours/courshtml5.html", revision: "audit-plateforme-v552", refreshIfCached: true },
  { url: "./assets/js/sql-playground.js", revision: "moteur-sql-local-v396" },
  { url: "./livre-smart.html", revision: "livre-3si-v593" },
  { url: "./assets/js/retour-livre-smart.js", revision: "retour-intelligent-v380" },
  { url: "./assets/css/sombre-universel-v372.css", revision: "sombre-site-v372" },
  { url: "./assets/css/smart-book-fan-v341.css", revision: "smart-books-v341" },
  { url: "./assets/css/smart-book-fan-v340.css", revision: "smart-books-v341" },
  { url: "./assets/images/smart-books/couverture-3si.jpg", revision: "livre-3si-v593" },
  { url: "./assets/images/smart-books/couverture-4si.jpg", revision: "livre-3si-v593" },
  { url: "./assets/data/smart-book-3si-2026.json", revision: "livre-3si-v593" },
  /* v573 : nouveau cours 3ème SI « Systèmes, technologies et Internet ». */
  { url: "./cours/systemes-technologies-internet.html", revision: "cours-sti-v596", refreshIfCached: true },
  { url: "./assets/css/cours-sti.css", revision: "cours-sti-v595" },
  { url: "./assets/js/cours-sti.js", revision: "cours-sti-v595" },
  /* v596 — pictogramme vectoriel de la matière « Systèmes, technologies et Internet ». */
  { url: "./exercices/systemes/index.html", revision: "exercices-sti-v596", refreshIfCached: true },
  { url: "./exercices/systemes/atelier-1-systemes-exploitation.html", revision: "exercices-sti-v596", refreshIfCached: true },
  { url: "./exercices/systemes/atelier-2-reseaux.html", revision: "exercices-sti-v596", refreshIfCached: true },
  { url: "./exercices/systemes/atelier-3-machine-virtuelle.html", revision: "exercices-sti-v596", refreshIfCached: true },
  { url: "./exercices/systemes/atelier-4-objets-connectes.html", revision: "exercices-sti-v596", refreshIfCached: true },
  { url: "./cours/sql-bases-ldd-lmd-lcd.html", revision: "schema-notation-v563", refreshIfCached: true },
  { url: "./assets/css/smart-book.css", revision: "livre-3si-v593" },
  { url: "./assets/js/smart-book.js", revision: "livre-3si-v593" },
  { url: "./assets/data/smart-book-2026.json", revision: "livre-3si-v593" },
  /* v597 — galerie des projets (fichiers neufs, déclarés pour la première visite hors-ligne). */
  { url: "./projets/index.html", revision: "galerie-projets-v597", refreshIfCached: true },
  { url: "./assets/css/projets-galerie.css", revision: "galerie-projets-v597" },
  { url: "./assets/vendor/jsqr/jsQR.js", revision: "smart-book-v330" },
  { url: "./assets/css/admin-v19.css", revision: "admin-airbus-cockpit-v316-24" },
  { url: "./assets/icons/sti-logo-complet.png", revision: "official-full-logo-v316-20" },
  { url: "./assets/icons/STI_by_AE.ico", revision: "official-square-logo-v316-3" },
  { url: "./assets/subtitles/css3-cours-v9-sync-fr.vtt", revision: "css3-vtt-sync-v309" },
  { url: "./assets/images/css3-cours-v9-sync-poster.jpg", revision: "css3-poster-v309" },
  { url: "./assets/js/modules/admin-mfa.js", revision: "mfa-module-v302" },
  { url: "./assets/js/modules/labo-device-client.js", revision: "labo-portable-local-v315" },
  { url: "./assets/js/modules/admin-labo-devices.js", revision: "labo-confirm-ui-v312" },
  { url: "./assets/js/modules/labo-offline-diagnostics.js", revision: "offline-diagnostics-v315" },
  { url: "./Lancer-Labo3-Hors-Ligne.bat", revision: "portable-launcher-v315" },
  { url: "./Lancer-Labo3-Hors-Ligne.ps1", revision: "portable-powershell-server-v315" }
];
var CACHE_REVISIONS = "sti-update-revisions-v1";
var CACHE_VIDEOS_LABO = "sti-videos-labo-v1";
var CACHE_LRU_META = "sti-runtime-lru-v302";
var MAX_RUNTIME_BYTES = 180 * 1024 * 1024;
var _lruTouchRecents = {};
var _dernierEvictAutoTs = 0;
var _octetsHitEnAttente = 0;
var _timerHitDebounce = null;

function tailleReponseSTI(rep) {
  if (!rep || !rep.headers) return 0;
  var n = parseInt(rep.headers.get("content-length") || "0", 10);
  return isFinite(n) && n > 0 ? n : 0;
}
function cleMetaLRUSTI(url) {
  return new Request(new URL("./__sti_lru__/" + encodeURIComponent(url), self.location.href).toString());
}
async function toucherLRUSTI(req, rep, cacheName, type) {
  try {
    var urlObj = typeof req === "string" ? new URL(req, self.location.href).toString() : req.url;
    var maintenant = Date.now();
    _lruTouchRecents[urlObj] = maintenant;
    var meta = await caches.open(CACHE_LRU_META);
    var objet = {
      url: urlObj,
      cache: cacheName,
      type: type || "runtime",
      bytes: tailleReponseSTI(rep),
      at: maintenant
    };
    await meta.put(cleMetaLRUSTI(objet.url), new Response(JSON.stringify(objet), { headers: { "Content-Type": "application/json" } }));
  } catch (e) {}
}
async function rafraichirLRUExistantSTI(req, rep, cacheName, type) {
  try {
    var url = typeof req === "string" ? new URL(req, self.location.href).toString() : req.url;
    /* v473 : ne pas réécrire CacheStorage à chaque ressource servie (< 5 min d'intervalle par URL) */
    var dernierTs = _lruTouchRecents[url] || 0;
    if (dernierTs && (Date.now() - dernierTs) < 300000) return;
    _lruTouchRecents[url] = Date.now();
    var meta = await caches.open(CACHE_LRU_META);
    if (await meta.match(cleMetaLRUSTI(url))) await toucherLRUSTI(req, rep, cacheName, type);
  } catch (e) {}
}
async function lireEntreesLRUSTI() {
  var meta = await caches.open(CACHE_LRU_META);
  var cles = await meta.keys();
  var lots = await Promise.all(cles.map(async function (c) {
    try {
      var r = await meta.match(c);
      var j = r ? await r.json() : null;
      if (j && j.url) { j._metaKey = c; return j; }
    } catch (e) {}
    return null;
  }));
  return lots.filter(Boolean);
}
async function notifierStockageSTI(extra, lignesPrechargees) {
  var estimation = {};
  try {
    if (self.navigator && self.navigator.storage && self.navigator.storage.estimate) estimation = await self.navigator.storage.estimate();
  } catch (e) {}
  var lignes = Array.isArray(lignesPrechargees) ? lignesPrechargees : [];
  if (!Array.isArray(lignesPrechargees)) {
    try { lignes = await lireEntreesLRUSTI(); } catch (e) {}
  }
  var runtime = lignes.reduce(function (n, x) { return n + (Number(x.bytes) || 0); }, 0);
  var payload = Object.assign({
    type: "STI_STORAGE_STATUS",
    usage: Number(estimation.usage) || runtime,
    quota: Number(estimation.quota) || 0,
    runtimeBytes: runtime,
    runtimeEntries: lignes.length
  }, extra || {});
  var clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  for (var c of clients) c.postMessage(payload);
}
async function evincerRuntimeLRUSTI(force) {
  /* v473 : en mode automatique (non forcé), espacer les scans complets du cache à 30 s max */
  if (!force) {
    var nowEv = Date.now();
    if (_dernierEvictAutoTs && (nowEv - _dernierEvictAutoTs) < 30000) return;
    _dernierEvictAutoTs = nowEv;
  }
  var lignes = await lireEntreesLRUSTI();
  var estimation = {};
  try {
    if (self.navigator && self.navigator.storage && self.navigator.storage.estimate) estimation = await self.navigator.storage.estimate();
  } catch (e) {}
  var quota = Number(estimation.quota) || 0;
  var usage = Number(estimation.usage) || 0;
  var runtime = lignes.reduce(function (n, x) { return n + (Number(x.bytes) || 0); }, 0);
  var pression = quota > 0 && usage / quota >= 0.82;
  if (!force && !pression && runtime <= MAX_RUNTIME_BYTES) {
    if (force) await notifierStockageSTI(null, lignes);
    return;
  }
  lignes.sort(function (a, b) { return (Number(a.at) || 0) - (Number(b.at) || 0); });
  var cible = force ? 0 : Math.min(MAX_RUNTIME_BYTES * 0.72, pression ? Math.max(0, runtime - (usage - quota * 0.70)) : MAX_RUNTIME_BYTES * 0.72);
  var liberes = 0;
  var nb = 0;
  var meta = await caches.open(CACHE_LRU_META);
  var restantes = [];
  for (var i = 0; i < lignes.length; i++) {
    var l = lignes[i];
    if (runtime - liberes > cible) {
      try {
        var c = await caches.open(l.cache === CACHE_VIDEOS_LABO ? CACHE_VIDEOS_LABO : CACHE);
        await c.delete(l.url, { ignoreSearch: true });
        await meta.delete(l._metaKey);
        delete _lruTouchRecents[l.url];
        liberes += Number(l.bytes) || 0;
        nb++;
        continue;
      } catch (e) {}
    }
    restantes.push(l);
  }
  await notifierStockageSTI({ evictedEntries: nb, evictedBytes: liberes }, restantes);
}
async function mettreCacheRuntimeSTI(cache, req, rep, type) {
  try {
    var nomCache = type === "media" ? CACHE_VIDEOS_LABO : CACHE;
    await cache.put(req, rep);
    await toucherLRUSTI(req, rep, nomCache, type);
    await evincerRuntimeLRUSTI(false);
  } catch (e) {}
}
function signalerCacheEviteSTI(rep) {
  var octets = tailleReponseSTI(rep);
  if (octets <= 0) return;
  _octetsHitEnAttente += octets;
  if (_timerHitDebounce) return;
  if (typeof setTimeout !== "function") return;
  _timerHitDebounce = setTimeout(function () {
    var totalOctets = _octetsHitEnAttente;
    _octetsHitEnAttente = 0;
    _timerHitDebounce = null;
    if (totalOctets <= 0 || !self.clients || typeof self.clients.matchAll !== "function") return;
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clients) {
      for (var c of clients) c.postMessage({ type: "STI_CACHE_HIT", bytes: totalOctets });
    }).catch(function () {});
  }, 1800);
}
var SHELL = [
  "./assets/css/exercices-sti.css",
  "./assets/js/appel-quiz.js",
  "./assets/js/exercices-sti.js",
  "./assets/js/suivi-profil.js",
  "./assets/js/reconnexion-profil.js",
  "./assets/images/badge-compte-vierge.png",
  "./assets/css/badge-compte.css",
  "./assets/js/mobile-nav.js",
  "./assets/js/roue-initiales.js",
  "./assets/js/roue-habillage.js",
  "./assets/js/roue-couverture.js",
  "./assets/images/qr-code-site.png",
  "./assets/css/theme-patrimoine.css",
  "./assets/js/lecteur-commun.js",
  "./assets/js/retour-quiz.js",
  "./assets/css/visionneuse-exercices.css",
  "./assets/js/visionneuse-exercices.js",
  "./assets/icons/matieres.svg",
  "./exercices/systemes/atelier-1-systemes-exploitation.html",
  "./exercices/systemes/atelier-2-reseaux.html",
  "./exercices/systemes/atelier-3-machine-virtuelle.html",
  "./exercices/systemes/atelier-4-objets-connectes.html",
  "./exercices/systemes/index.html",
  "./projets/carte-bancaire/demo.js",
  "./assets/js/news-perso.js",
  "./assets/images/drapeau-tunisie.svg",
  "./exercices/html-css/tp-evenements-liens/index.html",
  "./exercices/html-css/tp-evenements-liens/drapeau.png",
  "./exercices/html-css/tp-transitions-animations/index.html",
  "./exercices/html-css/tp-transitions-animations/exercice1.html",
  "./exercices/html-css/tp-transitions-animations/exercice2.html",
  "./exercices/html-css/tp-transitions-animations/style1.css",
  "./exercices/html-css/tp-transitions-animations/style2.css",
  "./exercices/html-css/tp-display-float-position/index.html",
  "./exercices/html-css/tp-formulaire-tableau-autre/index.html",
  "./exercices/html-css/tp-formulaire-tableau-autre/drapeau.png",
  "./",
  "./index.html",
  "./portail.html",
  "./admin.html",
  "./assets/css/admin-saas.css",
  "./bac-pratique.html",
  "./pieges-bac.html",
  "./memo-veille-bac.html",
  "./outils-js-bac.html",
  "./exercices/php/Tp1-php.html",
  "./exercices/php/Tp1-Correction-php.html",
  "./exercices/php/Tp4-php.html",
  "./exercices/php/Tp4-Correction-php.html",
  "./exercices/php/Tp5-php.html",
  "./exercices/php/Tp5-Correction-php.html",
  "./exercices/php/trace-fetch-php.html",
  "./exercices/php/ordre-php-bac.html",
  "./exercices/php/debogage-php-bac.html",
  "./carte-visite.html",
  "./README.md",
  "./manifest.webmanifest",
  "./assets/css/atelier.css",
  "./assets/css/atelier-pages.css",
  "./assets/css/protection.css",
  "./assets/css/tailwind.css",
  "./assets/js/config.js",
  "./assets/js/supabase-umd.js",
  "./assets/js/protection.js",
  "./assets/js/acces.js",
  "./assets/js/portail.js",
  "./assets/js/admin.js",
  "./assets/fonts/fonts.css",
  "./assets/fontawesome/css/all.min.css",
  "./assets/icons/STI_by_AE.ico",
  "./assets/icons/sti-icon-192.png",
  "./assets/icons/sti-icon-512.png",
  "./assets/images/sti-course-pause-qr.png",
  "./assets/images/php-cours-poster.jpg",
  "./assets/images/php-guichet-v10-poster.jpg",
  "./assets/images/css3-cours-v9-sync-poster.jpg",
  "./assets/images/css-restaurant-capture-v298.jpg",
  "./assets/subtitles/css3-cours-v9-sync-fr.vtt",
  "./assets/images/guichet-animation-capture-v288.jpg",
  "./cours/systemes-technologies-internet.html",
  "./cours/html5.html",
  "./cours/css3.html",
  "./cours/fiche-revision-html5.html",
  "./cours/annexe-fleuriste-html5.html",
  "./Positionnement-animee/index.html",
  "./Positionnement-animee/cours.js",
  "./Positionnement-animee/style.css",
  "./cssanimee/index.html",
  "./cssanimee/cours.js",
  "./cssanimee/style.css",
  "./cours/javascript.html",
  "./cours/Recap-JavaScript-STI.html",
  "./cours/php.html",
  "./cours/coursphp.html",
  "./cours/PHP-recap.html",
  "./cours/php-recap.html",
  "./cours/php-mysqli.html",
  "./cours/sql.html",
  "./cours/sql-contraintes.html",
  "./exercices/series-exercices.html",
  "./exercices/resume-fonctions-standards.html",
  "./exercices/sql/Tp1-bd.html",
  "./exercices/sql/Tp1-Correction-bd.html",
  "./exercices/sql/Tp2-bd.html",
  "./exercices/sql/Tp2-Correction-bd.html",
  "./exercices/sql/Tp-GroupBy-bd.html",
  "./exercices/sql/Tp3-Correction-bd.html",
  "./exercices/sql/Tp-BD-Jointure-sous-requetes-Group-By.html",
  "./exercices/sql/Tp4-correction-bd.html",
  "./exercices/sql/Tp-date-ssr-j-gp-bd.html",
  "./exercices/sql/Tp-date-ssr-j-gp-correction-bd.html",
  "./exercices/sql/sql.html",
  "./exercices/sql/sql-correction.html",
  "./exercices/sql/atelier_sql_3_fenetres.html",
  "./exercices/sql/CommentConstruireunerequêteSQL.html",
  "./exercices/javascript/Tp1-js.html",
  "./exercices/javascript/Tp1-Correction-js.html",
  "./exercices/javascript/Tp2-js.html",
  "./exercices/javascript/Tp2-Correction-js.html",
  "./exercices/javascript/Tp3-js.html",
  "./exercices/javascript/Tp3-Correction-js.html",
  "./exercices/javascript/Tp4-js.html",
  "./exercices/javascript/Tp4-Correction-js.html",
  "./exercices/javascript/Tp5-js.html",
  "./exercices/javascript/Tp5-Correction-js.html",
  "./exercices/javascript/js-37-defis-tt.html",
  "./exercices/php/Tp1-php.html",
  "./exercices/php/Tp2-php.html",
  "./exercices/php/Tp2-Correction-php.html",
  "./exercices/php/Tp3-php.html",
  "./exercices/php/Tp3-correction-php.html",
  "./exercices/php/Tp4-php.html",
  "./exercices/php/sondage-parcours-pas-a-pas.html",
  "./exercices/php/statphpanimee.html",
  "./exercices/html-css/box-shadow-text-shadow-css3.html",
  "./exercices/html-css/emploi-temps/emploidutemps.html",
  "./exercices/html-css/TP2/tp2corrposition.html",
  "./exercices/html-css/TP2/style2.css",
  "./quiz/html-css.html",
  "./quiz/javascript.html",
  "./quiz/php.html",
  "./quiz/systemes-internet.html",
  "./quiz/tableaux.html",
  "./quiz/pp.html",
  "./quiz/sql.html",
  "./projets/sti0/index.html",
  "./projets/sti0/Sondage.html",
  "./projets/sti0/Statistiques.html",
  "./projets/sti0/projetsti0.pdf",
  "./projets/sti0/projetsti0.pdf.html",
  "./projets/sti0/ressources-projet-sti0.zip",
  "./dashboard.html",
  "./assets/css/theme.css",
  "./assets/css/capsules-vedettes.css",
  "./assets/css/cours.css",
  "./assets/css/cours-sti.css",
  "./assets/js/cours-sti.js",
  "./assets/js/app.js",
  "./assets/js/profil.js",
  "./assets/js/cours-html5.js",
  "./assets/js/cours-onglets-mobile.js",
  "./assets/css/cours-css3.css",
  "./assets/js/cours-css3.js",
  "./assets/css/cours-javascript.css",
  "./assets/js/cours-javascript.js",
  "./assets/css/cours-matieres.css",
  "./assets/css/cours-sql-heritage.css",
  "./assets/css/cours-php-heritage.css",
  "./assets/js/cours-matieres.js",
  "./assets/js/cours-media-reperes.js",
  "./assets/js/cours-sql-animations.js",
  "./assets/js/cours-sql-voix.js",
  "./assets/js/cours-sql-worker.js",
  "./assets/js/sqljs/sql-wasm.js",
  "./assets/js/sqljs/sql-wasm.wasm",
  "./assets/css/dialogues-compat.css",
  "./assets/js/dialogues-compat.js",
  "./assets/js/sync-progressions.js",
  "./assets/js/xp-plancher.js",
  "./assets/css/projets-galerie.css",
  "./projets/index.html",
];

var OFFLINE_LIST = [
  "./assets/css/exercices-sti.css",
  "./assets/js/appel-quiz.js",
  "./assets/js/exercices-sti.js",
  "./assets/js/suivi-profil.js",
  "./assets/js/reconnexion-profil.js",
  "./assets/images/badge-compte-vierge.png",
  "./assets/css/badge-compte.css",
  "./assets/js/mobile-nav.js",
  "./assets/js/roue-initiales.js",
  "./assets/js/roue-habillage.js",
  "./assets/js/roue-couverture.js",
  "./assets/css/theme-patrimoine.css",
  "./assets/js/lecteur-commun.js",
  "./assets/js/retour-quiz.js",
  "./assets/css/visionneuse-exercices.css",
  "./assets/js/visionneuse-exercices.js",
  "./assets/icons/matieres.svg",
  "./exercices/systemes/atelier-1-systemes-exploitation.html",
  "./exercices/systemes/atelier-2-reseaux.html",
  "./exercices/systemes/atelier-3-machine-virtuelle.html",
  "./exercices/systemes/atelier-4-objets-connectes.html",
  "./exercices/systemes/index.html",
  "./projets/carte-bancaire/demo.js",
  "./projets/index.html",
  "./assets/css/projets-galerie.css",
  "./assets/js/cote-ticker.js",
  "./404.html",
  "./Positionnement-animee/bonus-flex.css",
  "./Positionnement-animee/cours.js",
  "./Positionnement-animee/index.html",
  "./Positionnement-animee/style.css",
  "./Positionnement-animee/uploads/Annexe CSS3 By A.E.pdf",
  "./Positionnement-animee/uploads/Annexe HTML5 By A.E.pdf",
  "./admin.html",
  "./assets/audio/foret.mp3",
  "./assets/audio/guichet-etapes.mp3",
  "./assets/audio/css-positionnement.mp3",
  "./assets/audio/css-animee.mp3",
  "./assets/js/quiz-systemes.js",
  "./assets/js/quiz-systemes-boot.js",
  "./assets/js/quiz-tableaux.js",
  "./assets/js/quiz-tableaux-boot.js",
  "./assets/js/quiz-sync.js",
  "./assets/js/quiz-alea.js",
  "./assets/js/xp-plancher.js",
  "./assets/data/quiz-banque.json",
  "./assets/data/quiz-systemes-internet.json",
  "./assets/audio/sql-cours.mp3",
  "./assets/css/atelier-pages.css",
  "./assets/css/atelier-php.css",
  "./assets/css/atelier.css",
  "./assets/css/css.css",
  "./assets/css/html.css",
  "./assets/css/js.css",
  "./assets/css/php.css",
  "./assets/css/protection.css",
  "./assets/css/sql.css",
  "./assets/css/tailwind.css",
  "./assets/fontawesome/LICENSE.txt",
  "./assets/fontawesome/css/all.min.css",
  "./assets/fontawesome/webfonts/fa-brands-400.woff2",
  "./assets/fontawesome/webfonts/fa-regular-400.woff2",
  "./assets/fontawesome/webfonts/fa-solid-900.woff2",
  "./assets/fonts/baloo-2-latin-ext.woff2",
  "./assets/fonts/baloo-2-latin.woff2",
  "./assets/fonts/fa6-brands-subset.woff2",
  "./assets/fonts/fa6-regular-subset.woff2",
  "./assets/fonts/fa6-solid-subset.woff2",
  "./assets/fonts/fonts.css",
  "./assets/fonts/fredoka-var.woff2",
  "./assets/fonts/inter-var.woff2",
  "./assets/fonts/jetbrains-mono-400.woff2",
  "./assets/fonts/jetbrains-mono-latin-ext.woff2",
  "./assets/fonts/jetbrains-mono-latin.woff2",
  "./assets/fonts/jetbrains-mono-var.woff2",
  "./assets/fonts/manrope-latin-ext.woff2",
  "./assets/fonts/manrope-latin.woff2",
  "./assets/fonts/nunito-var.woff2",
  "./assets/icons/STI_by_AE.ico",
  "./assets/icons/sti-icon-192.png",
  "./assets/icons/sti-icon-512.png",
  "./assets/images/JavaScript_logo.svg",
  "./assets/images/carte-visite-sti-v2.png",
  "./assets/images/lycee_logo.png",
  "./assets/images/qr-code-site.png",
  "./assets/images/qr-stiv2.png",
  "./assets/images/admin-aymen.jpg",
  "./assets/images/sti-course-pause-qr.png",
  "./assets/images/php-cours-poster.jpg",
  "./assets/images/php-guichet-v10-poster.jpg",
  "./assets/js/acces.js",
  "./assets/js/admin.js",
  "./assets/js/admin-vues-videos.js",
  "./assets/js/config.js",
  "./assets/js/portail.js",
  "./assets/js/protection.js",
  "./assets/js/supabase-umd.js",
  "./assets/video/flower.webm",
  "./bac-pratique.html",
  "./carte-visite.html",
  "./cours/annexe-fleuriste-html5.html",
  "./cours/courscss3.html",
  "./cours/courshtml5.html",
  "./cours/coursphp.html",
  "./cours/css3.html",
  "./cours/datalist.html",
  "./cours/fiche-revision-html5.html",
  "./cours/html5.html",
  "./cours/systemes-technologies-internet.html",
  "./cours/javascript.html",
  "./cours/Recap-JavaScript-STI.html",
  "./cours/PHP-recap.html",
  "./cours/php-recap.html",
  "./cours/php-mysqli.html",
  "./cours/php.html",
  "./cours/sql-bases-ldd-lmd-lcd.html",
  "./cours/sql-contraintes.html",
  "./cours/sql.html",
  "./cssanimee/cours.js",
  "./cssanimee/index.html",
  "./cssanimee/style.css",
  "./documents/bd/ecole.sql",
  "./documents/annexes/annexe-css3.pdf",
  "./documents/annexes/annexe-css3.pdf.assets/page-01.jpg",
  "./documents/annexes/annexe-css3.pdf.assets/page-02.jpg",
  "./documents/annexes/annexe-css3.pdf.assets/page-03.jpg",
  "./documents/annexes/annexe-css3.pdf.assets/page-04.jpg",
  "./documents/annexes/annexe-css3.pdf.assets/page-05.jpg",
  "./documents/annexes/annexe-css3.pdf.assets/page-06.jpg",
  "./documents/annexes/annexe-css3.pdf.assets/page-07.jpg",
  "./documents/annexes/annexe-css3.pdf.assets/page-08.jpg",
  "./documents/annexes/annexe-css3.pdf.assets/page-09.jpg",
  "./documents/annexes/annexe-css3.pdf.html",
  "./documents/annexes/annexe-html5.pdf",
  "./documents/annexes/annexe-html5.pdf.assets/page-01.jpg",
  "./documents/annexes/annexe-html5.pdf.assets/page-02.jpg",
  "./documents/annexes/annexe-html5.pdf.assets/page-03.jpg",
  "./documents/annexes/annexe-html5.pdf.assets/page-04.jpg",
  "./documents/annexes/annexe-html5.pdf.assets/page-05.jpg",
  "./documents/annexes/annexe-html5.pdf.assets/page-06.jpg",
  "./documents/annexes/annexe-html5.pdf.html",
  "./documents/annexes/annexe-javascript.pdf",
  "./documents/annexes/annexe-javascript.pdf.assets/page-01.jpg",
  "./documents/annexes/annexe-javascript.pdf.assets/page-02.jpg",
  "./documents/annexes/annexe-javascript.pdf.assets/page-03.jpg",
  "./documents/annexes/annexe-javascript.pdf.assets/page-04.jpg",
  "./documents/annexes/annexe-javascript.pdf.html",
  "./documents/annexes/annexe-php.pdf",
  "./documents/annexes/annexe-php.pdf.assets/page-01.jpg",
  "./documents/annexes/annexe-php.pdf.assets/page-02.jpg",
  "./documents/annexes/annexe-php.pdf.assets/page-03.jpg",
  "./documents/annexes/annexe-php.pdf.assets/page-04.jpg",
  "./documents/annexes/annexe-php.pdf.assets/page-05.jpg",
  "./documents/annexes/annexe-php.pdf.assets/page-06.jpg",
  "./documents/annexes/annexe-php.pdf.assets/page-07.jpg",
  "./documents/annexes/annexe-php.pdf.assets/page-08.jpg",
  "./documents/annexes/annexe-php.pdf.assets/page-09.jpg",
  "./documents/annexes/annexe-php.pdf.assets/page-10.jpg",
  "./documents/annexes/annexe-php.pdf.html",
  "./documents/annexes/annexe-sql.pdf",
  "./documents/annexes/annexe-sql.pdf.assets/page-01.jpg",
  "./documents/annexes/annexe-sql.pdf.assets/page-02.jpg",
  "./documents/annexes/annexe-sql.pdf.assets/page-03.jpg",
  "./documents/annexes/annexe-sql.pdf.assets/page-04.jpg",
  "./documents/annexes/annexe-sql.pdf.assets/page-05.jpg",
  "./documents/annexes/annexe-sql.pdf.assets/page-06.jpg",
  "./documents/annexes/annexe-sql.pdf.assets/page-07.jpg",
  "./documents/annexes/annexe-sql.pdf.html",
  "./documents/complet/complet-3eme-si-bd.pdf",
  "./documents/complet/complet-3eme-si-bd.pdf.assets/page-01.jpg",
  "./documents/complet/complet-3eme-si-bd.pdf.assets/page-02.jpg",
  "./documents/complet/complet-3eme-si-bd.pdf.assets/page-03.jpg",
  "./documents/complet/complet-3eme-si-bd.pdf.assets/page-04.jpg",
  "./documents/complet/complet-3eme-si-bd.pdf.assets/page-05.jpg",
  "./documents/complet/complet-3eme-si-bd.pdf.assets/page-06.jpg",
  "./documents/complet/complet-3eme-si-bd.pdf.assets/page-07.jpg",
  "./documents/complet/complet-3eme-si-bd.pdf.assets/page-08.jpg",
  "./documents/complet/complet-3eme-si-bd.pdf.assets/page-09.jpg",
  "./documents/complet/complet-3eme-si-bd.pdf.assets/page-10.jpg",
  "./documents/complet/complet-3eme-si-bd.pdf.assets/page-11.jpg",
  "./documents/complet/complet-3eme-si-bd.pdf.assets/page-12.jpg",
  "./documents/complet/complet-3eme-si-bd.pdf.assets/page-13.jpg",
  "./documents/complet/complet-3eme-si-bd.pdf.html",
  "./documents/complet/complet-3eme-si.pdf",
  "./documents/complet/complet-3eme-si.pdf.assets/page-01.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-02.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-03.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-04.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-05.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-06.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-07.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-08.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-09.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-10.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-11.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-12.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-13.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-14.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-15.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-16.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-17.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-18.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-19.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-20.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-21.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-22.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-23.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-24.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-25.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-26.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-27.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-28.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-29.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-30.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-31.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-32.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-33.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-34.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-35.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-36.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-37.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-38.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-39.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-40.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-41.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-42.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-43.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-44.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-45.jpg",
  "./documents/complet/complet-3eme-si.pdf.html",
  "./documents/complet/complet-4eme-si-cours.pdf",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-01.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-02.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-03.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-04.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-05.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-06.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-07.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-08.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-09.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-10.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-11.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-12.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-13.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-14.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-15.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-16.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-17.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-18.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-19.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-20.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-21.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-22.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-23.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-24.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-25.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-26.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-27.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-28.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-29.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-30.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-31.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-32.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-33.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-34.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-35.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-36.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-37.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-38.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-39.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-40.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-41.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-42.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-43.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-44.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-45.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-46.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-47.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-48.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-49.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-50.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-51.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-52.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-53.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-54.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-55.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-56.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-57.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-58.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-59.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-60.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-61.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-62.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-63.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-64.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-65.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.html",
  "./documents/complet/complet-4eme-si-resume.pdf",
  "./documents/complet/complet-4eme-si-resume.pdf.assets/page-01.jpg",
  "./documents/complet/complet-4eme-si-resume.pdf.assets/page-02.jpg",
  "./documents/complet/complet-4eme-si-resume.pdf.assets/page-03.jpg",
  "./documents/complet/complet-4eme-si-resume.pdf.assets/page-04.jpg",
  "./documents/complet/complet-4eme-si-resume.pdf.assets/page-05.jpg",
  "./documents/complet/complet-4eme-si-resume.pdf.assets/page-06.jpg",
  "./documents/complet/complet-4eme-si-resume.pdf.assets/page-07.jpg",
  "./documents/complet/complet-4eme-si-resume.pdf.assets/page-08.jpg",
  "./documents/complet/complet-4eme-si-resume.pdf.assets/page-09.jpg",
  "./documents/complet/complet-4eme-si-resume.pdf.assets/page-10.jpg",
  "./documents/complet/complet-4eme-si-resume.pdf.assets/page-11.jpg",
  "./documents/complet/complet-4eme-si-resume.pdf.assets/page-12.jpg",
  "./documents/complet/complet-4eme-si-resume.pdf.assets/page-13.jpg",
  "./documents/complet/complet-4eme-si-resume.pdf.assets/page-14.jpg",
  "./documents/complet/complet-4eme-si-resume.pdf.html",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Enonce.docx",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Enonce.pdf",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Enonce.pdf.assets/page-01-v157.jpg",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Enonce.pdf.assets/page-02-v157.jpg",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Enonce.pdf.assets/page-03-v157.jpg",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Enonce.pdf.assets/page-04-v157.jpg",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Enonce.pdf.assets/page-05-v157.jpg",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Enonce.pdf.assets/page-06-v157.jpg",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Enonce.pdf.assets/page-01.jpg",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Enonce.pdf.assets/page-02.jpg",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Enonce.pdf.assets/page-03.jpg",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Enonce.pdf.assets/page-04.jpg",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Enonce.pdf.assets/page-05.jpg",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Enonce.pdf.assets/page-06.jpg",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Enonce.pdf.html",
  "./exercices/html-css/Explore_Tunisie/images.rar",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Images/ExploreTunisie/images.rar",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Images/ExploreTunisie/images/djerba.jpg",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Images/ExploreTunisie/images/presentation.jpg",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Images/ExploreTunisie/images/sahara.jpg",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Images/ExploreTunisie/images/sidi-bou-said.jpg",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Solution/ExploreTunisie/index.html",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Solution/ExploreTunisie/index-float.html",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Solution/ExploreTunisie/index-position.html",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Solution/ExploreTunisie/style.css",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Solution/ExploreTunisie/style-flex.css",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Solution/ExploreTunisie/style-float.css",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Solution/ExploreTunisie/style-position.css",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Solution/ExploreTunisie/images/djerba.jpg",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Solution/ExploreTunisie/images/presentation.jpg",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Solution/ExploreTunisie/images/sahara.jpg",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Solution/ExploreTunisie/images/sidi-bou-said.jpg",
  "./exercices/html-css/TP1-css.pdf",
  "./exercices/html-css/TP1-css.pdf.assets/page-01.jpg",
  "./exercices/html-css/TP1-css.pdf.html",
  "./exercices/html-css/TP2-css.pdf",
  "./exercices/html-css/TP2-css.pdf.assets/page-01.jpg",
  "./exercices/html-css/TP2-css.pdf.assets/page-02.jpg",
  "./exercices/html-css/TP2-css.pdf.assets/page-03.jpg",
  "./exercices/html-css/TP2-css.pdf.html",
  "./exercices/html-css/TP2/style2.css",
  "./exercices/html-css/TP2/tp2corrposition.html",
  "./exercices/html-css/TP3-css.pdf",
  "./exercices/html-css/TP3-css.pdf.assets/page-01.jpg",
  "./exercices/html-css/TP3-css.pdf.assets/page-02.jpg",
  "./exercices/html-css/TP3-css.pdf.html",
  "./exercices/html-css/activite-html-css/Act1/page1.html",
  "./exercices/html-css/activite-html-css/Act1/style.css",
  "./exercices/html-css/activite-html-css/Act2/page2.html",
  "./exercices/html-css/activite-html-css/Act2/style2.css",
  "./exercices/html-css/activite1-2-position-animation-css3.pdf",
  "./exercices/html-css/activite1-2-position-animation-css3.pdf.assets/page-01.jpg",
  "./exercices/html-css/activite1-2-position-animation-css3.pdf.assets/page-02.jpg",
  "./exercices/html-css/activite1-2-position-animation-css3.pdf.assets/page-03.jpg",
  "./exercices/html-css/activite1-2-position-animation-css3.pdf.html",
  "./exercices/html-css/box-shadow-text-shadow-css3.html",
  "./exercices/html-css/emploi-temps/emploidutemps.html",
  "./exercices/html-css/formulaire-inscription.pdf",
  "./exercices/html-css/formulaire-inscription.pdf.assets/page-01.jpg",
  "./exercices/html-css/formulaire-inscription.pdf.assets/page-02.jpg",
  "./exercices/html-css/formulaire-inscription.pdf.html",
  "./exercices/javascript/Tp1-Correction-js.html",
  "./exercices/javascript/Tp1-js.html",
  "./exercices/javascript/Tp2-Correction-js.html",
  "./exercices/javascript/Tp2-js.html",
  "./exercices/javascript/Tp3-Correction-js.html",
  "./exercices/javascript/Tp3-js.html",
  "./exercices/javascript/Tp4-Correction-js.html",
  "./exercices/javascript/Tp4-js.html",
  "./exercices/javascript/Tp5-Correction-js.html",
  "./exercices/javascript/Tp5-js.html",
  "./exercices/javascript/TP Train/index.html",
  "./exercices/javascript/TP Train/Ressource_eleve_TrainTN.html",
  "./exercices/javascript/TP Train/Enonce_TP_TrainTN_JavaScript.html",
  "./exercices/javascript/TP Train/TP_Train_JavaScript_cORRECTION.html",
  "./exercices/javascript/js-37-defis-tt.html",
  "./exercices/php/Tp1-php.html",
  "./exercices/php/Tp2-Correction-php.html",
  "./exercices/php/Tp2-php.html",
  "./exercices/php/Tp3-correction-php.html",
  "./exercices/php/Tp3-php.html",
  "./exercices/php/Tp4-php.html",
  "./exercices/php/DC6Sti2025-2026.rar",
  "./exercices/php/sondage-parcours-pas-a-pas.html",
  "./exercices/php/statphpanimee.html",
  "./exercices/php/4STi-dc-6-2025-2026.pdf",
  "./exercices/php/4STi-dc-6-2025-2026.pdf.html",
  "./exercices/php/4STi-dc-6-2025-2026.pdf.assets/page-01.jpg",
  "./exercices/php/4STi-dc-6-2025-2026.pdf.assets/page-02.jpg",
  "./exercices/php/4STi-dc-6-2025-2026.pdf.assets/page-03.jpg",
  "./exercices/php/4STi-dc-6-2025-2026.pdf.assets/page-04.jpg",
  "./exercices/resume-fonctions-standards.html",
  "./exercices/series-exercices.html",
  "./exercices/sql/Tp-BD-Jointure-sous-requetes-Group-By.html",
  "./exercices/sql/Tp-GroupBy-bd.html",
  "./exercices/sql/Tp-date-ssr-j-gp-bd.html",
  "./exercices/sql/Tp-date-ssr-j-gp-correction-bd.html",
  "./exercices/sql/Tp1-Correction-bd.html",
  "./exercices/sql/Tp1-bd.html",
  "./exercices/sql/Tp2-Correction-bd.html",
  "./exercices/sql/Tp2-bd.html",
  "./exercices/sql/Tp3-Correction-bd.html",
  "./exercices/sql/Tp4-correction-bd.html",
  "./exercices/sql/Série 4.2 - GestLocation - énoncé.pdf",
  "./exercices/sql/Série 4.2 - GestLocation - Corrigé.pdf",
  "./exercices/sql/Série 4.2 - GestLocation - Vidéo.mp4",
  "./exercices/sql/Série 4.2 - GestLocation - MySQL.sql",
  "./exercices/sql/atelier_sql_3_fenetres.html",
  "./exercices/sql/CommentConstruireunerequêteSQL.html",
  "./exercices/sql/sql-correction.html",
  "./exercices/sql/sql.html",
  "./index.html",
  "./manifest.webmanifest",
  "./portail.html",
  "./projets/carte-bancaire/cb.html",
  "./projets/carte-bancaire/controle.js",
  "./projets/carte-bancaire/enonce-tp-carte-bancaire.html",
  "./projets/carte-bancaire/media/STI_by_AE.ico",
  "./projets/carte-bancaire/media/cap1.png",
  "./projets/carte-bancaire/media/cap2.png",
  "./projets/carte-bancaire/style.css",
  "./projets/fleurs.zip",
  "./projets/fleurs/Corrections.html",
  "./projets/fleurs/affichage-condidat.php",
  "./projets/fleurs/ajout.php",
  "./projets/fleurs/controle.js",
  "./projets/fleurs/controlecorrection.js",
  "./projets/fleurs/index.html",
  "./projets/fleurs/inscription.html",
  "./projets/fleurs/media/Lyc",
  "./projets/fleurs/media/femme.jpg",
  "./projets/fleurs/media/fleur.png",
  "./projets/fleurs/media/flower.webm",
  "./projets/fleurs/media/formulaire1.png",
  "./projets/fleurs/media/formulaire2.png",
  "./projets/fleurs/media/formulaire3.png",
  "./projets/fleurs/media/homme.png",
  "./projets/fleurs/media/lesTextes.txt",
  "./projets/fleurs/media/logo.png",
  "./projets/fleurs/media/orchidee.jpg",
  "./projets/fleurs/media/pageindex.png",
  "./projets/fleurs/media/pivoine.jpg",
  "./projets/fleurs/media/projet-fleurs-3sti-corrige.docx",
  "./projets/fleurs/media/projet-fleurs-4sti-corrige.docx",
  "./projets/fleurs/media/projet-fleurs-4sti-eleve.docx",
  "./projets/fleurs/media/projet-fleurs-4sti-eleve.pdf",
  "./projets/fleurs/media/projet-fleurs-4sti-eleve.pdf.assets/page-01.jpg",
  "./projets/fleurs/media/projet-fleurs-4sti-eleve.pdf.assets/page-02.jpg",
  "./projets/fleurs/media/projet-fleurs-4sti-eleve.pdf.assets/page-03.jpg",
  "./projets/fleurs/media/projet-fleurs-4sti-eleve.pdf.assets/page-04.jpg",
  "./projets/fleurs/media/projet-fleurs-4sti-eleve.pdf.assets/page-05.jpg",
  "./projets/fleurs/media/projet-fleurs-4sti-eleve.pdf.html",
  "./projets/fleurs/media/projet-fleurs.docx",
  "./projets/fleurs/media/tulipes.jpg",
  "./projets/fleurs/mise-a-jour-condidat.php",
  "./projets/fleurs/stylecorrection.css",
  "./projets/fleurs/styles.css",
  "./projets/formulaire-inscription/cvFleurs.html",
  "./projets/formulaire-inscription/enonce/cvFleurs-énoncé/formulaire inscription.pdf",
  "./projets/formulaire-inscription/enonce/cvFleurs-énoncé/formulaire inscription.pdf.assets/page-01.jpg",
  "./projets/formulaire-inscription/enonce/cvFleurs-énoncé/formulaire inscription.pdf.assets/page-02.jpg",
  "./projets/formulaire-inscription/enonce/cvFleurs-énoncé/formulaire inscription.pdf.html",
  "./projets/formulaire-inscription/enonce/lycee-rafha-niveau.docx",
  "./projets/formulaire-inscription/media/SON.mp3",
  "./projets/formulaire-inscription/media/femme.jpg",
  "./projets/formulaire-inscription/media/fleur.png",
  "./projets/formulaire-inscription/media/flower.webm",
  "./projets/formulaire-inscription/media/homme.png",
  "./projets/formulaire-inscription/media/imageslider1.jpg",
  "./projets/formulaire-inscription/media/imageslider2.jpg",
  "./projets/formulaire-inscription/media/imageslider3.jpg",
  "./projets/formulaire-inscription/media/imageslider4.jpg",
  "./projets/formulaire-inscription/media/logo.png",
  "./projets/formulaire-inscription/media/orchidee.jpg",
  "./projets/formulaire-inscription/media/pageindex.png",
  "./projets/formulaire-inscription/media/pivoine.jpg",
  "./projets/formulaire-inscription/media/tulipes.jpg",
  "./projets/site-tunisie/correction-details/carte-timbre-droite-haut.html",
  "./projets/site-tunisie/enonce.html",
  "./projets/site-tunisie/images/carte-tunisie.png",
  "./projets/site-tunisie/images/centre.jpg",
  "./projets/site-tunisie/images/nord.jpg",
  "./projets/site-tunisie/images/oud-c-arabian.mp3",
  "./projets/site-tunisie/images/portrait.jpg",
  "./projets/site-tunisie/images/sidibou.mp4",
  "./projets/site-tunisie/images/sud.jpg",
  "./projets/site-tunisie/index.html",
  "./projets/site-tunisie/pages/accueil.html",
  "./projets/site-tunisie/pages/centre.html",
  "./projets/site-tunisie/pages/nord.html",
  "./projets/site-tunisie/pages/sud.html",
  "./projets/site-tunisie/ressources-site-tunisie.rar",
  "./projets/site-tunisie/site-tunisie-Correction-animation-html-css.html",
  "./projets/sti0/Sondage.html",
  "./projets/sti0/Statistiques.html",
  "./projets/sti0/index.html",
  "./projets/sti0/projetsti0.pdf",
  "./projets/sti0/projetsti0.pdf.assets/page-01.jpg",
  "./projets/sti0/projetsti0.pdf.assets/page-02.jpg",
  "./projets/sti0/projetsti0.pdf.assets/page-03.jpg",
  "./projets/sti0/projetsti0.pdf.assets/page-04.jpg",
  "./projets/sti0/projetsti0.pdf.html",
  "./projets/sti0/ressources-projet-sti0.zip",
  "./projets/sti0/sondage.html",
  "./projets/sti0/statistiques.html",
  "./quiz/html-css.html",
  "./quiz/javascript.html",
  "./quiz/php.html",
  "./quiz/systemes-internet.html",
  "./quiz/pp.html",
  "./quiz/sql.html",
  "./assets/audio/sql-cours.mp3",
  "./assets/audio/sql-serie1.mp3",
  "./assets/audio/sql-serie2.mp3",
  "./assets/audio/sql-serie3.mp3",
  "./assets/audio/sql-serie4.mp3",
  "./assets/audio/sql-serie5.mp3",
  "./assets/audio/sql-serie6.mp3",
  "./assets/audio/explore-tunisie-flex.mp3",
  "./assets/audio/explore-tunisie-float.mp3",
  "./assets/audio/html5-cours.mp3",
  "./assets/audio/css3-cours.mp3",
  "./assets/audio/javascript-cours.mp3",
  "./assets/audio/php-cours.mp3",
  "./assets/video/drapeaurafeha.mp4",
  "./assets/video/drapeau-sti-vent.mp4",
  "./assets/videos/tp-evenements-liens-v2.mp4",
  "./assets/videos/tp-transitions-animations.mp4",
  "./assets/videos/tp-display-float-position.mp4",
  "./assets/videos/tp-formulaire-tableau-autre.mp4",
  "./assets/videos/php-guichet-v10.mp4",
  "./assets/videos/css-positionnement.mp4",
  "./assets/videos/css-animee.mp4",
  "./assets/videos/sql-cours-v7.mp4",
  "./assets/videos/sql-serie1.mp4",
  "./assets/videos/sql-serie2.mp4",
  "./assets/videos/sql-serie3.mp4",
  "./assets/videos/sql-serie4.mp4",
  "./assets/videos/sql-serie5.mp4",
  "./assets/videos/sql-serie6.mp4",
  "./assets/videos/explore-tunisie-flex.mp4",
  "./assets/videos/explore-tunisie-float.mp4",
  "./assets/videos/html5-cours.mp4",
  "./assets/videos/displayanim.mp4",
  "./assets/videos/css3-cours-v9-sync.mp4",
  "./assets/videos/css3-cours-v9-sync-mobile-720p.mp4",
  "./assets/subtitles/css3-cours-v9-sync-fr.vtt",
  "./assets/videos/javascript-cours.mp4",
  "./assets/videos/validation-nom-prenom-js.mp4",
  "./assets/subtitles/validation-nom-prenom-js-fr.vtt",
  "./assets/videos/tp-train-serie6.mp4",
  "./assets/subtitles/tp-train-serie6-fr.vtt",
  "./assets/videos/defis37-tableau-aleas-media.mp4",
  "./assets/subtitles/defis37-tableau-aleas-media-fr.vtt",
  "./assets/videos/BouclePour-v547.mp4",
  "./assets/subtitles/BouclePour-fr-v547.vtt",
  "./assets/videos/ConsoleVariables-v548.mp4",
  "./assets/subtitles/ConsoleVariables-fr-v548.vtt",
  "./assets/videos/PhpVariables-v549.mp4",
  "./assets/subtitles/PhpVariables-fr-v549.vtt",
  "./assets/videos/FonctionsChaine-v564.mp4",
  "./assets/subtitles/FonctionsChaine-fr-v564.vtt",
  "./assets/videos/DateJS-v565.mp4",
  "./assets/subtitles/DateJS-fr-v565.vtt",
  "./assets/videos/PhpChaines-v566.mp4",
  "./assets/subtitles/PhpChaines-fr-v566.vtt",
  "./assets/videos/CoursSystemesInternet-v578.mp4",
  "./assets/subtitles/CoursSystemesInternet-fr-v578.vtt",
  "./exercices/javascript/validation-nom-prenom-js.srt",
  "./assets/videos/php-cours.mp4",
  "./exercices/sql/sql-construire-requete-guide-texte.mp4",
  "./assets/images/sql-construire-requete-guide-texte-poster.jpg",
  "./assets/subtitles/sql-construire-requete-guide-texte-fr.srt",
  "./documents/sql/Documentation-Construire-Requete-SQL-Guide-Texte.docx",
  "./documents/sql/Documentation-Construire-Requete-SQL-Guide-Texte.pdf",
  "./documents/sql/transcription-construire-requete-sql-guide-texte.md",
  "./robots.txt",
  "./sitemap.xml",
  "./dashboard.html",
  "./assets/css/theme.css",
  "./assets/css/capsules-vedettes.css",
  "./assets/css/cours.css",
  "./assets/css/cours-sti.css",
  "./assets/js/cours-sti.js",
  "./assets/audio/cours-sti-ch1.mp3",
  "./assets/audio/cours-sti-ch2.mp3",
  "./assets/audio/cours-sti-ch3.mp3",
  "./assets/js/app.js",
  "./assets/js/profil.js",
  "./assets/js/cours-html5.js",
  "./assets/js/cours-onglets-mobile.js",
  "./assets/css/cours-css3.css",
  "./assets/js/cours-css3.js",
  "./assets/css/cours-javascript.css",
  "./assets/js/cours-javascript.js",
  "./assets/css/cours-matieres.css",
  "./assets/css/cours-sql-heritage.css",
  "./assets/css/cours-php-heritage.css",
  "./assets/js/cours-matieres.js",
  "./assets/js/cours-media-reperes.js",
  "./assets/js/cours-sql-animations.js",
  "./assets/js/cours-sql-voix.js",
  "./assets/js/cours-sql-worker.js",
  "./assets/js/sqljs/sql-wasm.js",
  "./assets/js/sqljs/sql-wasm.wasm",
  "./assets/css/dialogues-compat.css",
  "./assets/js/dialogues-compat.js",
  "./assets/js/sync-progressions.js",
];

var precacheEnCours = false;

async function prechargerSequentiel(forcerMajCode) {
  if (precacheEnCours && !forcerMajCode) return;
  precacheEnCours = true;
  try {
    var cache = await caches.open(CACHE);
    var total = OFFLINE_LIST.length;
    var done = 0;
    var batchSize = 6;
    for (var i = 0; i < total; i += batchSize) {
      var lot = OFFLINE_LIST.slice(i, i + batchSize);
      await Promise.allSettled(lot.map(async function (u) {
        try {
          var estCode = /\.(html|js|css|webmanifest)$/i.test(u) || u === "./";
          var ex = (!forcerMajCode || !estCode) ? await cache.match(u, { ignoreSearch: true }) : null;
          if (!ex) {
            var rep = await fetch(u, (forcerMajCode && estCode) ? { cache: "reload" } : undefined);
            if (rep && rep.ok) await cache.put(u, rep);
          }
        } catch (e) {}
        done++;
      }));
      if (done % 12 === 0 || done >= total) {
        var clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
        for (var c of clients) {
          c.postMessage({ type: "STI_OFFLINE_PROGRESS", done: Math.min(done, total), total: total, cache: CACHE });
        }
      }
    }
    var cdns = [
      "https://cdn.tailwindcss.com",
      "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js",
      "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
    ];
    for (var cu of cdns) {
      try {
        var exCdn = await cache.match(cu);
        if (!exCdn) {
          var repCdn = await fetch(new Request(cu, { mode: "no-cors" }));
          if (repCdn && (repCdn.ok || repCdn.type === "opaque")) {
            await cache.put(cu, repCdn);
          }
        }
      } catch (e) {}
    }
  } catch (e) {}
  precacheEnCours = false;
}

var _actualisationDeltaEnCours = false;
var _migrationCachesEnCours = null;
var NOYAU_RAPIDE_RECHARGEMENT = {
  "./assets/css/badge-compte.css": 1,
  "./assets/js/roue-initiales.js": 1,
  "./assets/css/theme-patrimoine.css": 1,
  "./assets/js/lecteur-commun.js": 1,
  "./assets/js/retour-quiz.js": 1,
  "./assets/css/visionneuse-exercices.css": 1,
  "./assets/js/visionneuse-exercices.js": 1,
  "./assets/icons/matieres.svg": 1,
  "./index.html": 1,
  "./assets/css/theme.css": 1,
  "./assets/css/capsules-vedettes.css": 1,
  "./assets/js/app.js": 1,
  "./assets/js/profil.js": 1,
  "./portail.html": 1,
  "./assets/js/config.js": 1,
  "./assets/js/mobile-nav.js": 1,
  "./assets/js/news-perso.js": 1,
  "./assets/images/drapeau-tunisie.svg": 1,
  "./assets/js/reprendre.js": 1,
  "./assets/css/atelier.css": 1,
  "./assets/css/protection.css": 1,
  "./assets/data/nouveautes.json": 1
};

/* Dépendances légères indispensables aux pages déjà installées, sans médias lourds. */
var NOUVEAUTES_NOYAU = {
  "./assets/js/cours-onglets-mobile.js": 1,
  "./assets/js/appel-quiz.js": 1,
  "./assets/js/suivi-profil.js": 1,
  "./assets/js/reconnexion-profil.js": 1,
  "./assets/images/badge-compte-vierge.png": 1,
  "./assets/css/badge-compte.css": 1,
  "./assets/js/mobile-nav.js": 1,
  "./assets/js/roue-initiales.js": 1,
  "./assets/js/roue-habillage.js": 1,
  "./assets/js/roue-couverture.js": 1,
  "./assets/icons/sti-icon-192.png": 1,
  "./assets/images/qr-code-site.png": 1,
  "./assets/css/theme-patrimoine.css": 1,
  "./assets/js/lecteur-commun.js": 1,
  "./assets/js/retour-quiz.js": 1,
  "./assets/css/visionneuse-exercices.css": 1,
  "./assets/js/visionneuse-exercices.js": 1,
  "./assets/icons/matieres.svg": 1,
  "./projets/carte-bancaire/demo.js": 1,
  "./assets/css/capsules-vedettes.css": 1
};

/* Une taille identique ne prouve pas qu'un fichier est inchangé. */
async function empreinteFichierIdentique(reponse, item) {
  if (!reponse || !item.sha256 || typeof crypto === "undefined" || !crypto.subtle) return false;
  try {
    var contenu = await reponse.clone().arrayBuffer();
    if (contenu.byteLength !== item.bytes) return false;
    var empreinte = await crypto.subtle.digest("SHA-256", contenu);
    var octets = new Uint8Array(empreinte);
    var hex = "";
    for (var i = 0; i < octets.length; i++) hex += ("0" + octets[i].toString(16)).slice(-2);
    return hex === item.sha256;
  } catch (e) { return false; }
}

/* Remplacer la copie canonique AVANT de supprimer ses variantes : en cas
   de panne réseau ou de stockage, l'ancienne version reste disponible. */
async function remplacerFichierNoyau(cache, chemin, alias, reponse) {
  var principal = new URL(chemin, self.location.href);
  var racine = alias ? new URL(alias, self.location.href) : null;
  await cache.put(principal.href, reponse.clone());
  if (racine) await cache.put(racine.href, reponse.clone());
  var requetes = await cache.keys();
  for (var i = 0; i < requetes.length; i++) {
    var ancienne = requetes[i];
    var urlAncienne = new URL(ancienne.url);
    var memeFichier = urlAncienne.origin === principal.origin && urlAncienne.pathname === principal.pathname;
    var memeRacine = racine && urlAncienne.origin === racine.origin && urlAncienne.pathname === racine.pathname;
    if ((memeFichier && ancienne.url !== principal.href) || (memeRacine && ancienne.url !== racine.href)) {
      await cache.delete(ancienne);
    }
  }
}

async function actualiserFichiersConcernes() {
  if (_actualisationDeltaEnCours) return;
  _actualisationDeltaEnCours = true;
  try {
    /* Un message reçu après clients.claim() ne doit pas rouvrir un ancien
       cache pendant que l'activation le copie puis le supprime. */
    if (_migrationCachesEnCours) await _migrationCachesEnCours;
    var cache = await caches.open(CACHE);
    var revisions = await caches.open(CACHE_REVISIONS);
    var nomsCaches = [];
    try { nomsCaches = await caches.keys(); } catch (eKeys) {}
    var anciensCaches = [];
    for (var ic = 0; ic < nomsCaches.length; ic++) {
      var nomC = nomsCaches[ic];
      if (nomC && nomC !== CACHE && nomC !== CACHE_VIDEOS_LABO && nomC.indexOf("sti-atelier-") === 0) {
        try { anciensCaches.push(await caches.open(nomC)); } catch (eOpenAnc) {}
      }
    }
    var clesActives = [];
    try { clesActives = await cache.keys(); } catch (eKAct) {}
    var appareilSansCachePrealable = (clesActives.length === 0 && anciensCaches.length === 0);

    /* Déduplication stricte par URL pour ne jamais retélécharger un même chemin plusieurs fois */
    var vusUrl = {};
    var uniques = [];
    for (var iu = 0; iu < UPDATE_FILES.length; iu++) {
      var rawIt = UPDATE_FILES[iu];
      var uCle = typeof rawIt === "string" ? rawIt : rawIt.url;
      if (!uCle || vusUrl[uCle]) continue;
      vusUrl[uCle] = 1;
      uniques.push(rawIt);
    }

    /* Sur un nouvel appareil sans cache existant : 0 requête réseau à l'installation, chaque page se mettra en cache à la visite */
    if (appareilSansCachePrealable) {
      await Promise.allSettled(uniques.map(function (item) {
        var u0 = typeof item === "string" ? item : item.url;
        var rev0 = typeof item === "string" ? UPDATE_ID : item.revision;
        var marker0 = new Request(new URL("./__sti_revision__/" + encodeURIComponent(u0) + "?rev=" + encodeURIComponent(rev0), self.location.href));
        return revisions.put(marker0, new Response(UPDATE_ID));
      }));
      return;
    }

    /* Appareil déjà équipé d'un cache : invalider immédiatement les copies obsolètes et ne recharger en tâche de fond (par petits lots de 4) QUE le noyau léger déjà présent */
    var lotTaille = 4;
    for (var debut = 0; debut < uniques.length; debut += lotTaille) {
      var tranche = uniques.slice(debut, debut + lotTaille);
      await Promise.allSettled(tranche.map(async function (item) {
        var u = typeof item === "string" ? item : item.url;
        var revision = typeof item === "string" ? UPDATE_ID : item.revision;
        var marker = new Request(new URL("./__sti_revision__/" + encodeURIComponent(u) + "?rev=" + encodeURIComponent(revision), self.location.href));
        try {
          if (await revisions.match(marker)) return;
          if (item.bootstrapBySize && item.bytes) {
            var existant = await cache.match(u, { ignoreSearch: true });
            /* Au moment de l'installation, les fichiers inchangés peuvent encore
               se trouver dans l'ancien cache avant sa copie à l'activation. */
            if (!existant) {
              for (var ib = 0; ib < anciensCaches.length && !existant; ib++) {
                existant = await anciensCaches[ib].match(u, { ignoreSearch: true });
              }
            }
            if (await empreinteFichierIdentique(existant, item)) {
              await revisions.put(marker, new Response(UPDATE_ID));
              return;
            }
          }
          var uRacine = /\/index\.html$/i.test(u) ? u.slice(0, -10) : "";
          var etaitEnCache = Boolean(
            (await cache.match(u, { ignoreSearch: true })) ||
            (uRacine && (await cache.match(uRacine, { ignoreSearch: true })))
          );
          if (!etaitEnCache) {
            for (var idxA = 0; idxA < anciensCaches.length; idxA++) {
              if (
                (await anciensCaches[idxA].match(u, { ignoreSearch: true })) ||
                (uRacine && (await anciensCaches[idxA].match(uRacine, { ignoreSearch: true })))
              ) {
                etaitEnCache = true;
                break;
              }
            }
          }
          /* Pas de téléchargement pour une page jamais visitée. Exception :
             les nouveaux modules légers indispensables au noyau déjà installé. */
          if (!etaitEnCache) {
            if (NOUVEAUTES_NOYAU[u]) {
              var repNouveau = await fetch(u, { cache: "reload" });
              if (!repNouveau || !repNouveau.ok) return;
              await cache.put(u, repNouveau.clone());
            }
            await revisions.put(marker, new Response(UPDATE_ID));
            return;
          }
          /* Pour le noyau et les pages appelantes déjà en cache, ne jamais effacer l'ancienne copie avant
             d'avoir reçu ET stocké la nouvelle. Un 503 ou une coupure laisse
             la révision en attente pour le prochain retour du réseau. */
          if (NOYAU_RAPIDE_RECHARGEMENT[u] || item.refreshIfCached || (item.bootstrapBySize && NOUVEAUTES_NOYAU[u])) {
            var rep = await fetch(u, { cache: "reload" });
            if (!rep || !rep.ok) return;
            await remplacerFichierNoyau(cache, u, uRacine, rep);
          } else {
            /* Les autres pages modifiées restent téléchargées à la demande. */
            try { await cache.delete(u, { ignoreSearch: true }); } catch (eDel) {}
            if (uRacine) {
              try { await cache.delete(uRacine, { ignoreSearch: true }); } catch (eDelR) {}
            }
          }
          for (var idxC = 0; idxC < anciensCaches.length; idxC++) {
            var ancC = anciensCaches[idxC];
            try {
              await ancC.delete(u, { ignoreSearch: true });
            } catch (eAncDel) {}
            if (uRacine) {
              try {
                await ancC.delete(uRacine, { ignoreSearch: true });
              } catch (eAncDelR) {}
            }
          }
          await revisions.put(marker, new Response(UPDATE_ID));
        } catch (e) {}
      }));
    }
  } finally {
    _actualisationDeltaEnCours = false;
  }
}

/* Si un ancien onglet ne connaît pas la poignée de main, laisser le nouveau
   worker en attente : son activation naturelle suivra la fermeture des onglets. */
async function preparerClientsActivation() {
  if (!self.clients || typeof self.clients.matchAll !== "function" || typeof MessageChannel === "undefined") return false;
  var version = (CACHE.match(/sti-atelier-v(\d+)/) || [])[1];
  if (!version) return false;
  try {
    var pages = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    if (self.registration && self.registration.scope) pages = pages.filter(function (page) { return page.url.indexOf(self.registration.scope) === 0; });
    var reponses = await Promise.all(pages.map(function (page) {
      return new Promise(function (resolve) {
        var canal = new MessageChannel(), fini = false;
        var timer = setTimeout(function () { terminer(false); }, 1800);
        function terminer(ok) {
          if (fini) return;
          fini = true;
          clearTimeout(timer);
          canal.port1.close();
          resolve(ok);
        }
        canal.port1.onmessage = function (evt) { terminer(Boolean(evt.data && evt.data.prepare)); };
        try { page.postMessage({ type: "STI_PREPARER_ACTIVATION", version: version }, [canal.port2]); }
        catch (e) { terminer(false); }
      });
    }));
    return reponses.every(Boolean);
  } catch (e) { return false; }
}
async function activerSiClientsPrets() {
  if (await preparerClientsActivation()) await self.skipWaiting();
}

self.addEventListener("install", function (evt) {
  /* Le delta reste léger ; les pages en cours ne sont pas rechargées. */
  evt.waitUntil((async function () {
    await actualiserFichiersConcernes();
    await activerSiClientsPrets();
  })());
});

self.addEventListener("activate", function (evt) {
  _migrationCachesEnCours = (async function () {
      /* Prendre immédiatement le contrôle sans bloquer les requêtes de navigation pendant la migration locale des caches */
      try { await self.clients.claim(); } catch (eClaim) {}
      try {
        var nvCache = await caches.open(CACHE);
        var cVid = await caches.open(CACHE_VIDEOS_LABO);
        var cles = await caches.keys();
        for (var k of cles) {
          if (k === CACHE || k === CACHE_VIDEOS_LABO || k.indexOf("sti-atelier-") !== 0) continue;
          try {
            var ancCache = await caches.open(k);
            var reqs = await ancCache.keys();
            for (var bi = 0; bi < reqs.length; bi += 16) {
              var blocReqs = reqs.slice(bi, bi + 16);
              await Promise.all(blocReqs.map(async function (r) {
                var rPath = "";
                try { rPath = new URL(r.url).pathname; } catch (e) {}
                var cible = (rPath.indexOf("/assets/videos/") !== -1 && /\.mp4$/i.test(rPath)) ? cVid : nvCache;
                var deja = await cible.match(r, { ignoreSearch: true });
                if (!deja && rPath.slice(-1) === "/") {
                  var repIdxNeuf = await cible.match(r.url.split("?")[0] + "index.html", { ignoreSearch: true });
                  if (repIdxNeuf) {
                    await cible.put(r, repIdxNeuf.clone());
                    deja = repIdxNeuf;
                  }
                }
                if (!deja) {
                  var rep = await ancCache.match(r);
                  if (rep) await cible.put(r, rep);
                }
              }));
            }
          } catch (eMigration) {}
          /* Suppression seulement après copie locale : zéro re-téléchargement. */
          await caches.delete(k);
        }
        /* La v309 remplace réellement la vidéo CSS3 : supprimer les anciennes copies lourdes sans les re-télécharger. */
        var anciensCss3 = ["/assets/videos/css3-cours-v8.mp4", "/assets/videos/css3-cours-v8-mobile-720p.mp4", "/assets/subtitles/css3-cours-v8-fr.vtt", "/assets/images/css3-cours-v8-poster.jpg"];
        for (var cacheCss3 of [nvCache, cVid]) {
          var reqCss3 = await cacheCss3.keys();
          for (var ancienneReq of reqCss3) {
            var ancienPath = "";
            try { ancienPath = new URL(ancienneReq.url).pathname; } catch (eAncien) {}
            if (anciensCss3.some(function (suffixe) { return ancienPath.slice(-suffixe.length) === suffixe; })) {
              await cacheCss3.delete(ancienneReq, { ignoreSearch: true });
            }
          }
        }
      } catch (e) {}
      /* Aucun préchargement global automatique après activation. */
    })();
  evt.waitUntil(_migrationCachesEnCours);
});

self.addEventListener("message", function (evt) {
  if (!evt.data) return;
  if (evt.data.type === "SKIP_WAITING") {
    evt.waitUntil(activerSiClientsPrets());
    return;
  }
  if (evt.data.type === "STI_STORAGE_STATUS") {
    evt.waitUntil(notifierStockageSTI());
    return;
  }
  if (evt.data.type === "STI_EVICT_RUNTIME") {
    evt.waitUntil(evincerRuntimeLRUSTI(true));
    return;
  }
  if (evt.data.type === "PRECACHE_ALL_USER") {
    /* Téléchargement complet uniquement après le clic volontaire « Hors-ligne ». */
    evt.waitUntil(prechargerSequentiel(true));
    return;
  }
  if (evt.data.type === "PRECACHE_ALL" || evt.data.type === "SYNC_UPDATE" || evt.data.type === "FORCE_REFRESH_VERSION") {
    /* La commande explicite du tableau d'administration garde son effet. */
    var forceAdmin = evt.data.type === "FORCE_REFRESH_VERSION" && evt.source && /\/admin(?:\.html)?(?:[?#]|$)/i.test(evt.source.url || "");
    evt.waitUntil((async function () {
      await actualiserFichiersConcernes();
      if (forceAdmin) await self.skipWaiting();
    })());
  }
});

var _cacheActifMem = null;
var _cacheActifNom = "";

async function chercherDansCache(req, url) {
  try {
    if (_cacheActifMem && _cacheActifNom === CACHE) {
      var mMemExact = await _cacheActifMem.match(req);
      if (mMemExact) { signalerCacheEviteSTI(mMemExact); rafraichirLRUExistantSTI(req, mMemExact, CACHE, "runtime"); return mMemExact; }
      var mMem = await _cacheActifMem.match(req, { ignoreSearch: true });
      if (mMem) { signalerCacheEviteSTI(mMem); rafraichirLRUExistantSTI(req, mMem, CACHE, "runtime"); return mMem; }
    } else {
      var cActif = await caches.open(CACHE);
      _cacheActifMem = cActif;
      _cacheActifNom = CACHE;
      var mActifExact = await cActif.match(req);
      if (mActifExact) { signalerCacheEviteSTI(mActifExact); rafraichirLRUExistantSTI(req, mActifExact, CACHE, "runtime"); return mActifExact; }
      var mActif = await cActif.match(req, { ignoreSearch: true });
      if (mActif) { signalerCacheEviteSTI(mActif); rafraichirLRUExistantSTI(req, mActif, CACHE, "runtime"); return mActif; }
    }
  } catch (eActif) {}
  var mExact = await caches.match(req);
  if (mExact) { signalerCacheEviteSTI(mExact); rafraichirLRUExistantSTI(req, mExact, CACHE, "runtime"); return mExact; }
  var m = await caches.match(req, { ignoreSearch: true });
  if (m) { signalerCacheEviteSTI(m); rafraichirLRUExistantSTI(req, m, CACHE, "runtime"); return m; }
  if (url.origin === self.location.origin) {
    try {
      var decodedUrl = url.origin + decodeURIComponent(url.pathname);
      var mDec = await caches.match(decodedUrl, { ignoreSearch: true });
      if (mDec) return mDec;
      var encodedUrl = url.origin + encodeURI(decodeURIComponent(url.pathname));
      var mEnc = await caches.match(encodedUrl, { ignoreSearch: true });
      if (mEnc) return mEnc;
    } catch (e) {}
    if (url.pathname.slice(-1) === "/") {
      var mSubIdx = await caches.match(url.origin + url.pathname + "index.html", { ignoreSearch: true });
      if (mSubIdx) return mSubIdx;
    }
    var scopePath = new URL("./", self.location.href).pathname;
    if (url.pathname === scopePath || url.pathname === scopePath + "index.html") {
      var mIdx = await caches.match("./index.html", { ignoreSearch: true });
      if (mIdx) return mIdx;
      var mRoot = await caches.match("./", { ignoreSearch: true });
      if (mRoot) return mRoot;
    }
  }
  return null;
}

self.addEventListener("fetch", function (evt) {
  var req = evt.request;
  if (req.method !== "GET") return;

  var url = new URL(req.url);

  /* Ne jamais mettre sw.js lui-même en cache dans CACHE pour garantir la détection immédiate de chaque nouvelle version */
  if (url.origin === self.location.origin && /\/sw\.js$/i.test(url.pathname)) {
    evt.respondWith(
      fetch(req, { cache: "no-store" }).catch(function () {
        return caches.match(req, { ignoreSearch: true });
      })
    );
    return;
  }

  /* Ressources CDN versionnées : cache d'abord, sans revalidation gourmande à chaque page. */
  if (url.origin !== self.location.origin) {
    if (/cdn\.tailwindcss\.com|cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com/i.test(url.hostname)) {
      evt.respondWith(
        caches.match(req).then(function (m) {
          if (m) return m;
          return fetch(req).then(function (rep) {
            if (rep && (rep.ok || rep.type === "opaque")) {
              var cop = rep.clone();
              evt.waitUntil(caches.open(CACHE).then(function (c) { return mettreCacheRuntimeSTI(c, req, cop, "cdn"); }));
            }
            return rep;
          }).catch(function () { return Response.error(); });
        })
      );
    }
    return;
  }

  /* 1. Pages (navigation, documents HTML, iframes) & Scripts / Styles :
        - Si déjà en cache pour la version courante (CACHE) -> 0 ms depuis le cache (navigation ultra-légère : la plateforme ne se met à jour que s'il y a une nouvelle version de CACHE)
        - Si pas encore en cache -> réseau + mise en cache */
  var estHoteLocalDossier = /^(localhost|127\.0\.0\.1|::1|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)|\.e2b\.app$/i.test(url.hostname || "");
  if (req.mode === "navigate" || /\.(html|css|js|webmanifest)$/i.test(url.pathname) || /\/nouveautes\.json$/i.test(url.pathname)
        || /\/assets\/data\/smart-book[^/]*\.json$/i.test(url.pathname) || url.pathname.slice(-1) === "/") {
    evt.respondWith(
      (async function () {
        /* Sur un dossier local servi en localhost/LAN (PC Labo 3 sans Internet), revalider légèrement (304 Not Modified) sans re-télécharger 1,8 Mo en no-store à chaque clic */
        if (estHoteLocalDossier) {
          try {
            var repLoc = await fetch(req, { cache: "no-cache" });
            if (repLoc && repLoc.ok) {
              var copLoc = repLoc.clone();
              caches.open(CACHE).then(function (c) { c.put(req, copLoc); });
              return repLoc;
            }
          } catch (e) {}
        }
        var enCache = await chercherDansCache(req, url);
        if (enCache) {
          return enCache;
        }
        try {
          var rep = await fetch(req, { cache: "no-cache" });
          if (rep && rep.ok) {
            var copie = rep.clone();
            var copieNue = rep.clone();
            caches.open(CACHE).then(function (c) {
              var contientJeton = /(?:^|[?&])(token_hash|token|code|access_token|refresh_token)=/i.test(url.search || "");
              if (!contientJeton) c.put(req, copie);
              if (url.search) {
                var urlNue = new URL(req.url);
                urlNue.search = "";
                c.put(urlNue.toString(), copieNue);
              }
              var scopePath = new URL("./", self.location.href).pathname;
              if (url.pathname === scopePath || url.pathname === scopePath + "index.html") {
                c.put("./index.html", rep.clone());
              } else if (url.pathname.slice(-1) === "/") {
                c.put(url.origin + url.pathname + "index.html", rep.clone());
              }
            });
          }
          return rep;
        } catch (e) {
          return (await chercherDansCache(req, url)) || Response.error();
        }
      })()
    );
    return;
  }

  /* 2. Fichiers vidéo/audio (.mp4, .webm, .mp3, .wav) & Mode « Réseau Labo Fluide » (cache persistant CACHE_VIDEOS_LABO + support HTTP Range) */
  if (/\.(mp4|webm|mp3|wav|ogg|m4a)$/i.test(url.pathname) || req.headers.get("range")) {
    evt.respondWith(
      (async function () {
        var rangeHeader = req.headers.get("range");
        var clePropre = new Request(url.origin + url.pathname);
        var cVid = null;
        var enCache = null;
        try {
          cVid = await caches.open(CACHE_VIDEOS_LABO);
          enCache = await cVid.match(clePropre, { ignoreSearch: true });
        } catch (e) {}
        if (!enCache) {
          enCache = await chercherDansCache(clePropre, url);
        }

        if (enCache) {
          signalerCacheEviteSTI(enCache);
          rafraichirLRUExistantSTI(clePropre, enCache, CACHE_VIDEOS_LABO, "media");
          if (rangeHeader) {
            try {
              var buf = await enCache.clone().arrayBuffer();
              var total = buf.byteLength;
              var mRange = /bytes=(\d+)-(\d*)/i.exec(rangeHeader);
              var start = mRange ? parseInt(mRange[1], 10) : 0;
              var end = mRange && mRange[2] ? parseInt(mRange[2], 10) : total - 1;
              if (isNaN(start) || start < 0) start = 0;
              if (isNaN(end) || end >= total) end = total - 1;
              if (start > end) start = 0;
              var chunk = buf.slice(start, end + 1);
              var cType = enCache.headers.get("Content-Type") || (/\.mp4$/i.test(url.pathname) ? "video/mp4" : "application/octet-stream");
              return new Response(chunk, {
                status: 206,
                statusText: "Partial Content",
                headers: {
                  "Content-Type": cType,
                  "Accept-Ranges": "bytes",
                  "Content-Range": "bytes " + start + "-" + end + "/" + total,
                  "Content-Length": String(chunk.byteLength)
                }
              });
            } catch (e) {}
          }
          return enCache;
        }

        /* Une requête Range reste une requête Range : aucun téléchargement MP4 complet parallèle.
           Seule une vraie réponse réseau 200 (ou le bouton Hors-ligne explicite) remplit le cache vidéo. */
        try {
          var rep = await fetch(req);
          if (rep && rep.status === 200) {
            var copie = rep.clone();
            evt.waitUntil((cVid ? Promise.resolve(cVid) : caches.open(CACHE_VIDEOS_LABO)).then(function (c) {
              return mettreCacheRuntimeSTI(c, clePropre, copie, "media");
            }).catch(function () {}));
          }
          return rep;
        } catch (err) {
          return enCache || Response.error();
        }
      })()
    );
    return;
  }

  /* 3. Images, PDF, archives, polices et documents : cache d'abord.
        Un fichier déjà présent n'est plus retéléchargé silencieusement à chaque consultation. */
  evt.respondWith(
    chercherDansCache(req, url).then(function (m) {
      if (m) return m;
      return fetch(req)
        .then(function (rep) {
          if (rep && rep.status === 200) {
            var copie = rep.clone();
            evt.waitUntil(caches.open(CACHE).then(function (c) { return mettreCacheRuntimeSTI(c, req, copie, "asset"); }));
          }
          return rep;
        })
        .catch(function () { return Response.error(); });
    })
  );
});
