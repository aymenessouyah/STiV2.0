/* ============================================================================
   STI V2.0 — CONFIGURATION DES 5 PAGES MATIÈRE (assets/js/cours-config.js)
   ----------------------------------------------------------------------------
   Une seule source de données pour cours.js. AUCUN contenu pédagogique n'est
   inventé ici : les titres de chapitres, les intitulés d'exercices, les chemins
   d'annexes, les fichiers .mp4/.mp3 et les fenêtres de détails sont ceux des
   pages de référence du dépôt (cours/*.html, exercices/*, documents/*).

   Les chemins sont relatifs à la RACINE du site (window.STI_AUTH.RACINE) :
   cours.js les préfixe automatiquement. Sur les pages de cours, cela revient
   exactement aux liens « ../… » d'origine.

   Code commenté en français, JavaScript natif, aucune clé ni URL Supabase.
   ========================================================================== */
(function () {
  'use strict';

  /* --------------------------------------------------------------------------
     Fichiers vidéo réels du dépôt. Pour remplacer un cours filmé, il suffit de
     modifier la propriété « src » ci-dessous (convention : assets/videos/…).
     ------------------------------------------------------------------------ */
  var V = {
    html5:    '../assets/videos/html5-cours.mp4',
    css3:     '../assets/videos/css3-cours-v9-sync.mp4',
    cssAnim:  '../assets/videos/css-animee.mp4',
    cssPos:   '../assets/videos/css-positionnement.mp4',
    display:  '../assets/videos/displayanim.mp4',
    js:       '../assets/videos/javascript-cours.mp4',
    sql:      '../assets/videos/sql-cours-v7.mp4',
    sqlS4:    '../assets/videos/sql-serie4.mp4',
    sqlS5:    '../assets/videos/sql-serie5.mp4',
    phpCours: '../assets/videos/php-cours.mp4',
    phpSynt:  '../assets/videos/php-synthese.mp4'
  };
  var A = {
    html5: '../assets/audio/html5-cours.mp3',
    css3:  '../assets/audio/css3-cours.mp3',
    js:    '../assets/audio/javascript-cours.mp3',
    sql:   '../assets/audio/sql-cours.mp3'
  };

  /* Fenêtres de détails déjà présentes dans les pages historiques :
     on les conserve et on les améliore (cours.js ajoute le redimensionnement,
     le piège de focus, Échap et le clic sur le fond). */
  var FENETRES_NATIVES = {
    html5: ['tpl-target', 'tpl-datalist'],
    css3: ['win-link-states', 'win-text-shadow', 'win-bg-color', 'win-box-model',
      'win-bg-image', 'win-bg-repeat', 'win-bg-size', 'win-bg-clip',
      'win-bg-shorthand', 'win-overflow', 'win-opacity', 'win-float',
      'win-radius', 'win-box-shadow', 'win-collapse', 'win-table-layout',
      'win-filter', 'win-transition', 'win-animation', 'win-rotate',
      'win-skew', 'win-scale', 'win-translate']
  };

  /* --------------------------------------------------------------------------
     HTML — chapitres (issus des <h2> de cours/html5.html)
     ------------------------------------------------------------------------ */
  var CH_HTML5 = [
    { id: 'h1', titre: "Éléments d'en-tête / 1er niveau", match: "Éléments d'en-tête" },
    { id: 'h2', titre: "Éléments de structuration d'une page web", match: 'structuration d’une page' },
    { id: 'h3', titre: 'Conteneurs', match: 'Conteneurs' },
    { id: 'h4', titre: 'Listes (ul, ol, li)', match: 'Listes (' },
    { id: 'h5', titre: 'Tableaux', match: 'Tableaux' },
    { id: 'h6', titre: 'Structuration de texte & média', match: 'Structuration de texte' },
    { id: 'h7', titre: 'Attributs globaux & événements', match: 'Attributs Globaux' },
    { id: 'h8', titre: 'Zoom : target dans un formulaire', match: 'Zoom : L’attribut target' },
    { id: 'h9', titre: "Formulaires & types d'input", match: 'Formulaires & Types' },
    { id: 'h10', titre: 'Intégrer une page : iframe', match: 'Intégrer une page' }
  ];

  /* --------------------------------------------------------------------------
     CSS3 — 10 groupes demandés, ancrés sur les titres réels de la fiche
     ------------------------------------------------------------------------ */
  var CH_CSS3 = [
    { id: 'c1', titre: 'Sélecteurs et priorités', match: 'Priorité selon l’Emplacement' },
    { id: 'c2', titre: 'Polices, alignement et ombres', match: 'Polices & Styles' },
    { id: 'c3', titre: 'Couleur de fond', match: 'Couleur de Fond' },
    { id: 'c4', titre: 'Modèle de boîte et display', match: 'Modèle de boîte & fond' },
    { id: 'c5', titre: 'Marges, padding, débordement', match: 'Marges & Padding' },
    { id: 'c6', titre: 'Positionnement (relative → flex)', match: 'Position relative' },
    { id: 'c7', titre: 'Tableaux, listes et puces', match: 'Table Layout & Border Collapse' },
    { id: 'c8', titre: 'Filtres', match: 'CSS : la propriété filter' },
    { id: 'c9', titre: 'Transitions et animations', match: 'transition' },
    { id: 'c10', titre: 'CSS pas à pas', match: 'CSS pas à pas' }
  ];

  /* --------------------------------------------------------------------------
     JavaScript — chapitres de la page de référence
     ------------------------------------------------------------------------ */
  var CH_JS = [
    { id: 'j1', titre: "Qu'est-ce que JavaScript ?", match: 'Qu’est-ce que JavaScript' },
    { id: 'j2', titre: 'Où placer le code', match: 'Où placer le code JavaScript' },
    { id: 'j3', titre: 'Variables : portée et déclaration', match: 'Variables : portée' },
    { id: 'j4', titre: 'Opérateurs', match: 'Opérateurs' },
    { id: 'j5', titre: 'Entrées / sorties', match: 'Entrées / sorties' },
    { id: 'j6', titre: 'Comparatifs', match: 'Comparatifs' },
    { id: 'j7', titre: 'Fonctions / méthodes globales', match: 'Fonctions/méthodes globales' },
    { id: 'j8', titre: 'Math', match: 'Math' },
    { id: 'j9', titre: 'Tableaux', match: 'Tableaux' },
    { id: 'j10', titre: 'Structures conditionnelles', match: 'Structures conditionnelles' },
    { id: 'j11', titre: 'Boucles', match: 'Boucles' },
    { id: 'j12', titre: 'Fonctions', match: 'Fonctions' },
    { id: 'j13', titre: 'Manipulation du DOM', match: 'Manipulation du DOM' },
    { id: 'j14', titre: 'Exercices', match: 'Exercices' }
  ];

  /* --------------------------------------------------------------------------
     SQL — 4 parties de la page de référence
     ------------------------------------------------------------------------ */
  var CH_SQL = [
    { id: 's1', titre: 'Introduction : BD & SQL', match: 'Introduction : BD & SQL' },
    { id: 's2', titre: 'Partie LDD (définition des données)', match: 'Partie LDD' },
    { id: 's3', titre: 'Partie LMD (manipulation des données)', match: 'Partie LMD' },
    { id: 's4', titre: "L'essentiel pour le Bac : vidéos de révision", match: 'L’essentiel pour les Bac' }
  ];

  /* --------------------------------------------------------------------------
     PHP — ancres réelles (#s1 … #s10) de la page de référence
     ------------------------------------------------------------------------ */
  var CH_PHP = [
    { id: 'p1', titre: 'Introduction au langage PHP', ancre: 's1' },
    { id: 'p2', titre: 'Types de données, variables et opérateurs', ancre: 's2' },
    { id: 'p3', titre: 'Fonctions de manipulation de variables', ancre: 's3' },
    { id: 'p4', titre: 'Chaînes de caractères', ancre: 's4' },
    { id: 'p5', titre: 'Tableaux', ancre: 's5' },
    { id: 'p6', titre: 'Date et heure', ancre: 's6' },
    { id: 'p7', titre: 'Variables superglobales et fonctions diverses', ancre: 's7' },
    { id: 'p8', titre: 'Utiliser MySQL avec PHP', ancre: 's8' },
    { id: 'p9', titre: 'Exercice de synthèse', ancre: 's9' },
    { id: 'p10', titre: 'Second exercice de synthèse', ancre: 's10' }
  ];

  /* --------------------------------------------------------------------------
     Exercices : TOUS les liens sont ceux du site de référence.
     « code » est uniquement le contenu initial du bac à sable (zone d'essai),
     ce n'est pas un énoncé : l'énoncé reste le document lié.
     ------------------------------------------------------------------------ */
  var EX_HTML5 = [
    { id: 'x1', chapitre: 'h5', titre: 'Séries & exercices (toutes matières)', difficulte: 'Tous niveaux', lien: 'exercices/series-exercices.html', langage: 'html', corrige: 'exercices/series-exercices.html' },
    { id: 'x2', chapitre: 'h5', titre: 'TP1 CSS — mise en page', difficulte: 'Facile', lien: 'exercices/html-css/TP1-css.pdf.html', langage: 'html', corrige: 'exercices/html-css/TP1-css.pdf.html' },
    { id: 'x3', chapitre: 'h6', titre: 'Emploi du temps en tableau', difficulte: 'Moyen', lien: 'exercices/html-css/emploi-temps/emploidutemps.html', langage: 'html', corrige: 'exercices/html-css/emploi-temps/emploidutemps.html' },
    { id: 'x4', chapitre: 'h9', titre: "Formulaire d'inscription", difficulte: 'Moyen', lien: 'exercices/html-css/formulaire-inscription.pdf.html', langage: 'html', corrige: 'exercices/html-css/formulaire-inscription.pdf.html' },
    { id: 'x5', chapitre: 'h10', titre: 'Projet STI0 — sondage & statistiques', difficulte: 'Difficile', lien: 'projets/sti0/index.html', langage: 'html', corrige: 'projets/sti0/index.html' }
  ];
  var EX_CSS3 = [
    { id: 'x1', chapitre: 'c1', titre: 'TP1 CSS — sélecteurs', difficulte: 'Facile', lien: 'exercices/html-css/TP1-css.pdf.html', langage: 'css', corrige: 'exercices/html-css/TP1-css.pdf.html' },
    { id: 'x2', chapitre: 'c6', titre: 'TP2 CSS — positionnement', difficulte: 'Moyen', lien: 'exercices/html-css/TP2-css.pdf.html', langage: 'css', corrige: 'exercices/html-css/TP2-css.pdf.html' },
    { id: 'x3', chapitre: 'c9', titre: 'Activité 1 & 2 — animation CSS3', difficulte: 'Moyen', lien: 'exercices/html-css/activite1-2-position-animation-css3.pdf.html', langage: 'css', corrige: 'exercices/html-css/activite1-2-position-animation-css3.pdf.html' },
    { id: 'x4', chapitre: 'c6', titre: 'Projet Explore Tunisie — float & flex', difficulte: 'Difficile', lien: 'projets/site-tunisie/index.html', langage: 'css', corrige: 'projets/site-tunisie/index.html' },
    { id: 'x5', chapitre: 'c4', titre: 'Projet carte bancaire', difficulte: 'Difficile', lien: 'projets/carte-bancaire/enonce-tp-carte-bancaire.html', langage: 'css', corrige: 'projets/carte-bancaire/enonce-tp-carte-bancaire.html' }
  ];
  var EX_JS = [
    { id: 'x1', chapitre: 'j3', titre: 'TP1 JavaScript + corrigé', difficulte: 'Facile', lien: 'exercices/javascript/Tp1-js.html', langage: 'js', corrige: 'exercices/javascript/Tp1-js.html' },
    { id: 'x2', chapitre: 'j10', titre: 'TP2 JavaScript + corrigé', difficulte: 'Moyen', lien: 'exercices/javascript/Tp2-js.html', langage: 'js', corrige: 'exercices/javascript/Tp2-js.html' },
    { id: 'x3', chapitre: 'j11', titre: 'TP3 JavaScript + corrigé', difficulte: 'Moyen', lien: 'exercices/javascript/Tp3-js.html', langage: 'js', corrige: 'exercices/javascript/Tp3-js.html' },
    { id: 'x4', chapitre: 'j12', titre: 'TP4 JavaScript + corrigé', difficulte: 'Difficile', lien: 'exercices/javascript/Tp4-js.html', langage: 'js', corrige: 'exercices/javascript/Tp4-js.html' },
    { id: 'x5', chapitre: 'j13', titre: 'TP5 JavaScript + corrigé', difficulte: 'Difficile', lien: 'exercices/javascript/Tp5-js.html', langage: 'js', corrige: 'exercices/javascript/Tp5-js.html' },
    { id: 'x6', chapitre: 'j14', titre: 'Les 37 défis JavaScript', difficulte: 'Difficile', lien: 'exercices/javascript/js-37-defis-tt.html', langage: 'js', corrige: 'exercices/javascript/js-37-defis-tt.html' }
  ];
  var EX_SQL = [
    { id: 'x1', chapitre: 's3', titre: 'Comment construire une requête SQL', difficulte: 'Facile', lien: 'exercices/sql/CommentConstruireunerequêteSQL.html', langage: 'sql', corrige: 'exercices/sql/CommentConstruireunerequêteSQL.html' },
    { id: 'x2', chapitre: 's3', titre: 'TP3 base de données (corrigé)', difficulte: 'Moyen', lien: 'exercices/sql/Tp3-Correction-bd.html', langage: 'sql', corrige: 'exercices/sql/Tp3-Correction-bd.html' },
    { id: 'x3', chapitre: 's4', titre: 'Série 4 — énoncé A4 (jointures, sous-requêtes, GROUP BY)', difficulte: 'Difficile', lien: 'documents/enonces/enonce-serie4-a4.html', langage: 'sql', corrige: 'exercices/sql/Tp4-correction-bd.html' },
    { id: 'x4', chapitre: 's4', titre: 'Série 5 — énoncé A4 (dates, sous-requêtes, GROUP BY)', difficulte: 'Difficile', lien: 'documents/enonces/enonce-serie5-a4.html', langage: 'sql', corrige: 'exercices/sql/Tp-date-ssr-j-gp-correction-bd.html' },
    { id: 'x5', chapitre: 's3', titre: 'TP jointures, sous-requêtes & GROUP BY', difficulte: 'Difficile', lien: 'exercices/sql/Tp-BD-Jointure-sous-requetes-Group-By.html', langage: 'sql', corrige: 'exercices/sql/Tp-BD-Jointure-sous-requetes-Group-By.html' }
  ];
  var EX_PHP = [
    { id: 'x1', chapitre: 'p9', titre: '9.1 Énoncé — Gestion des élèves', difficulte: 'Difficile', lien: 'cours/php.html#s9a', corrige: 'cours/php.html#s9b', fenetre: 'exoModal', telechargements: [
      { titre: 'Corrigé complet (gestion-eleves.zip + ecole.sql)', url: 'documents/complet/gestion-eleves.zip' },
      { titre: 'Fiche mémento imprimable (PDF)', url: 'documents/complet/fiche-memento-synthese.pdf' }
    ] },
    { id: 'x2', chapitre: 'p9', titre: '9.2 Solution — correction complète', difficulte: 'Difficile', lien: 'cours/php.html#s9b', corrige: 'cours/php.html#s9b', fenetre: 'solModal' },
    { id: 'x3', chapitre: 'p10', titre: '10.1 Énoncé — Recharge voiture électrique', difficulte: 'Difficile', lien: 'cours/php.html#s10a', corrige: 'cours/php.html#s10b', fenetre: 'exo2Modal' },
    { id: 'x4', chapitre: 'p10', titre: '10.2 Solution — correction complète', difficulte: 'Difficile', lien: 'cours/php.html#s10b', corrige: 'cours/php.html#s10b', fenetre: 'sol2Modal' },
    { id: 'x5', chapitre: 'p8', titre: 'TP1 PHP + corrigé', difficulte: 'Moyen', lien: 'exercices/php/Tp1-php.html', langage: 'php', corrige: 'exercices/php/Tp1-php.html' },
    { id: 'x6', chapitre: 'p8', titre: 'Débogage PHP Bac', difficulte: 'Difficile', lien: 'exercices/php/debogage-php-bac.html', langage: 'php', corrige: 'exercices/php/debogage-php-bac.html' }
  ];

  /* --------------------------------------------------------------------------
     Annexes : mêmes documents que la page de référence + liens demandés
     ------------------------------------------------------------------------ */
  function annexe(icone, titre, url, type, telecharger) {
    return { icone: icone, titre: titre, url: url, type: type || 'PDF', telecharger: telecharger !== false };
  }
  var AN_HTML5 = [
    annexe('📕', 'Annexe HTML5 (PDF)', 'documents/annexes/annexe-html5.pdf', 'PDF'),
    annexe('📖', 'Annexe HTML5 — lecture en ligne', 'documents/annexes/annexe-html5.pdf.html', 'HTML', false),
    annexe('🧾', 'Fiche de révision HTML5', 'cours/fiche-revision-html5.html', 'HTML', false),
    annexe('🌸', 'Annexe fleuriste HTML5', 'cours/annexe-fleuriste-html5.html', 'HTML', false),
    annexe('📚', 'Document complet 3ème SI', 'documents/complet/complet-3eme-si.pdf', 'PDF'),
    annexe('📱', 'Livre interactif Smart Book', 'livre-smart.html', 'HTML', false)
  ];
  var AN_CSS3 = [
    annexe('📘', 'Annexe CSS3 (PDF)', 'documents/annexes/annexe-css3.pdf', 'PDF'),
    annexe('📖', 'Annexe CSS3 — lecture en ligne', 'documents/annexes/annexe-css3.pdf.html', 'HTML', false),
    annexe('🧾', 'Fiche synthèse globale CSS3', 'cours/courscss3.html', 'HTML', false),
    annexe('📐', 'Annexe HTML5 & CSS3 (module positionnement)', 'Positionnement-animee/uploads/Annexe CSS3 By A.E.pdf', 'PDF'),
    annexe('📚', 'Document complet 4ème SI — cours', 'documents/complet/complet-4eme-si-cours.pdf', 'PDF'),
    annexe('📱', 'Livre interactif Smart Book', 'livre-smart.html', 'HTML', false)
  ];
  var AN_JS = [
    annexe('📗', 'Annexe JavaScript (PDF)', 'documents/annexes/annexe-javascript.pdf', 'PDF'),
    annexe('📖', 'Annexe JavaScript — lecture en ligne', 'documents/annexes/annexe-javascript.pdf.html', 'HTML', false),
    annexe('🧾', 'Récapitulatif JavaScript STI', 'cours/Recap-JavaScript-STI.html', 'HTML', false),
    annexe('🔤', 'Résumé des fonctions standards', 'exercices/resume-fonctions-standards.html', 'HTML', false),
    annexe('🧠', 'Mémo A4 — veille du Bac', 'memo-veille-bac.html', 'HTML', false),
    annexe('📱', 'Livre interactif Smart Book', 'livre-smart.html', 'HTML', false)
  ];
  var AN_SQL = [
    annexe('📙', 'Annexe SQL (PDF)', 'documents/annexes/annexe-sql.pdf', 'PDF'),
    annexe('📖', 'Annexe SQL — lecture en ligne', 'documents/annexes/annexe-sql.pdf.html', 'HTML', false),
    annexe('🧾', 'Bases LDD / LMD / LCD', 'cours/sql-bases-ldd-lmd-lcd.html', 'HTML', false),
    annexe('🔑', 'Contraintes SQL (animation)', 'cours/sql-contraintes.html', 'HTML', false),
    annexe('📝', 'Guide texte — construire une requête', 'documents/sql/Documentation-Construire-Requete-SQL-Guide-Texte.pdf', 'PDF'),
    annexe('🖨️', 'Énoncé Série 4 (A4)', 'documents/enonces/enonce-serie4-a4.html', 'HTML', false),
    annexe('🖨️', 'Énoncé Série 5 (A4)', 'documents/enonces/enonce-serie5-a4.html', 'HTML', false),
    annexe('🗃️', "Bases d'exercices (.sql)", 'documents/bd/ecole.sql', 'SQL'),
    annexe('📱', 'Livre interactif Smart Book', 'livre-smart.html', 'HTML', false)
  ];
  var AN_PHP = [
    annexe('📓', 'Annexe PHP (PDF)', 'documents/annexes/annexe-php.pdf', 'PDF'),
    annexe('📖', 'Annexe PHP — lecture en ligne', 'documents/annexes/annexe-php.pdf.html', 'HTML', false),
    annexe('🧾', 'Récapitulatif PHP', 'cours/PHP-recap.html', 'HTML', false),
    annexe('🔌', 'PHP & MySQLi', 'cours/php-mysqli.html', 'HTML', false),
    annexe('🧠', 'Fiche mémento synthèse', 'documents/complet/fiche-memento-synthese.html', 'HTML', false),
    annexe('📄', 'Fiche mémento imprimable (PDF)', 'documents/complet/fiche-memento-synthese.pdf', 'PDF'),
    annexe('📱', 'Livre interactif Smart Book', 'livre-smart.html', 'HTML', false)
  ];

  /* --------------------------------------------------------------------------
     Nouvelles fenêtres unifiées. Le contenu est placé dans un <template> par
     cours.js, exactement comme les fenêtres historiques. Les iframes pointent
     vers les animations existantes du dépôt.
     ------------------------------------------------------------------------ */
  function fenetreIframe(id, titre, src) {
    return { id: id, titre: titre, type: 'iframe', source: src };
  }
  function fenetreVideo(id, titre) {
    return { id: id, titre: titre, type: 'video' };
  }
  var LECONS_CSS3 = [
    { icone: '📐', titre: 'Positionnement animé', sous: 'display · position · float', url: 'Positionnement-animee/index.html' },
    { icone: '✨', titre: 'CSS animée', sous: 'arrière-plans · liens · ombres · bordures · tableaux · listes', url: 'cssanimee/index.html' },
    { icone: '🖼️', titre: 'Détails background — TP Site Tunisie', sous: 'mémo interactif corrigé', url: 'projets/site-tunisie/correction-details/carte-timbre-droite-haut.html' }
  ];

  /* --------------------------------------------------------------------------
     EXPORT
     ------------------------------------------------------------------------ */
  window.STI_COURS = {
    html5: {
      nom: 'HTML5', emoji: '🧱', accent: '--html', badge: 'badge--html',
      titre: 'HTML5 — cours, exercices, annexes & vidéos',
      intro: "Balises sémantiques, tableaux, formulaires, multimédia et iframes : toute la structure d'une page web, avec les fenêtres « Agrandir » du cours d'origine.",
      classe: '4ème SI',
      fil: ['Accueil', 'Cours', 'HTML5'],
      quiz: { url: 'quiz/html-css.html', label: 'Quiz HTML5 & CSS3' },
      chapitres: CH_HTML5, exercices: EX_HTML5, annexes: AN_HTML5,
      fenetresNatives: FENETRES_NATIVES.html5,
      videoUne: { id: 'html5-cours', titre: 'Vidéo du cours HTML5 (.mp4)', src: V.html5, poster: '', duree: '12:40', audio: A.html5, desc: "Le cours HTML5 complet, de la balise <h1> aux formulaires et aux iframes, avec démonstrations." },
      videos: [
        { id: 'html5-cours', titre: 'HTML5 — Les balises essentielles', duree: '12:40', src: V.html5, poster: '', desc: 'Structure, titres, liens, images et formulaires expliqués pas à pas.' },
        { id: 'html5-demo-video', titre: 'Démonstration <video> du chapitre multimédia', duree: '—', src: '../assets/video/flower.webm', poster: '', desc: 'Élément <video controls> conservé dans le chapitre 6, avec cadre arrondi et fond noir.' },
        { id: 'html5-demo-audio', titre: 'Démonstration <audio> du chapitre multimédia', duree: '—', src: '../assets/audio/foret.mp3', poster: '', type: 'audio', desc: 'Élément <audio controls> conservé dans le chapitre 6.' }
      ],
      fenetres: [
        { id: 'tpl-target', titre: 'target="…" — où afficher la réponse du formulaire', type: 'template', source: 'tpl-target' },
        { id: 'tpl-datalist', titre: 'Agrandir <datalist> — détails & exemples', type: 'template', source: 'tpl-datalist' }
      ],
      modales: [{ root: '#modal-overlay', box: '#modal-window', titre: '#modal-title', corps: '#modal-body', ouvert: '.flex' }],
      guideLigne: { audio: A.html5, titre: 'Guide-Ligne — écoute vocale du cours HTML5' },
      comparatifs: true,
      boiteTypes: ['retenir', 'definition', 'exemple', 'attention', 'astuce', 'syntaxe', 'resultat', 'atoi']
    },

    css3: {
      nom: 'CSS3', emoji: '🎨', accent: '--css', badge: 'badge--css',
      titre: 'CSS3 — cours, exercices, annexes & vidéos',
      intro: 'Sélecteurs et priorités, modèle de boîte interactif, positionnement, filtres, transitions et leçons animées : toute la fiche synthèse CSS3.',
      classe: '4ème SI',
      fil: ['Accueil', 'Cours', 'CSS3'],
      quiz: { url: 'quiz/html-css.html', label: 'Quiz HTML5 & CSS3' },
      chapitres: CH_CSS3, exercices: EX_CSS3, annexes: AN_CSS3,
      fenetresNatives: FENETRES_NATIVES.css3,
      videoUne: { id: 'css3-cours', titre: 'Vidéo du cours CSS3 (.mp4)', src: V.css3, poster: '../assets/images/css3-cours-v9-sync-poster.jpg', duree: '24:15', audio: A.css3, desc: 'Le cours de référence, avec guide-ligne et écoute vocale synchronisée.' },
      videos: [
        { id: 'css3-cours', titre: 'CSS3 — Cours complet synchronisé', duree: '24:15', src: V.css3, poster: '../assets/images/css3-cours-v9-sync-poster.jpg', desc: 'Guide-Ligne synchronisé, blur, grayscale et invert.' },
        { id: 'css-animee', titre: 'CSS3 — Les animations', duree: '08:30', src: V.cssAnim, poster: '', desc: 'Transitions, keyframes et transformations.' },
        { id: 'css-positionnement', titre: 'CSS3 — Le positionnement', duree: '09:12', src: V.cssPos, poster: '', desc: 'Static, relative, absolute, fixed, float, flex et grid.' },
        { id: 'display-anim', titre: 'Vidéo du chapitre Display — displayanim.mp4', duree: '3,7 Mo', src: V.display, poster: '../assets/icons/sti-icon-512.png', desc: 'Vidéo conservée du chapitre Display (fichier de 3,7 Mo).', telecharger: V.display }
      ],
      lecons: LECONS_CSS3,
      fenetres: [].concat(FENETRES_NATIVES.css3.map(function (id) {
        return { id: id, titre: id.replace(/^win-/, '').replace(/-/g, ' '), type: 'template', source: id };
      })),
      modales: [{ root: '#win-overlay', box: '#win', titre: '#win-title', corps: '#win-body', ouvert: '.open' }],
      boxModel: true,
      laboratoires: [
        { id: 'box-shadow', titre: 'Laboratoire — box-shadow', prop: 'boxShadow', champs: [
          { cle: 'x', label: 'Décalage X', min: 0, max: 40, valeur: 8, unite: 'px' },
          { cle: 'y', label: 'Décalage Y', min: 0, max: 40, valeur: 8, unite: 'px' },
          { cle: 'b', label: 'Flou', min: 0, max: 60, valeur: 18, unite: 'px' }
        ], modele: '.ma-boite { box-shadow: {x}px {y}px {b}px rgba(0,0,0,.4); }' },
        { id: 'transform', titre: 'Laboratoire — transform & opacity', prop: 'transform', champs: [
          { cle: 'r', label: 'Rotation', min: -180, max: 180, valeur: 0, unite: 'deg' },
          { cle: 's', label: 'Échelle', min: 0.5, max: 2, valeur: 1, unite: '', pas: 0.05 },
          { cle: 'o', label: 'Opacité', min: 0, max: 1, valeur: 1, unite: '', pas: 0.05 }
        ], modele: '.mon-element { transform: rotate({r}deg) scale({s}); opacity: {o}; }' }
      ],
      comparatifs: true,
      boiteTypes: ['retenir', 'definition', 'exemple', 'attention', 'astuce', 'syntaxe', 'resultat', 'atoi']
    },

    javascript: {
      nom: 'JavaScript', emoji: '⚡', accent: '--js', badge: 'badge--js',
      titre: 'JavaScript — cours, exercices, annexes & vidéo',
      intro: 'Variables, opérateurs, fonctions, Math, tableaux, boucles et manipulation du DOM, avec le récapitulatif interactif exécutable.',
      classe: '4ème SI',
      fil: ['Accueil', 'Cours', 'JavaScript'],
      quiz: { url: 'quiz/javascript.html', label: 'Quiz JavaScript' },
      chapitres: CH_JS, exercices: EX_JS, annexes: AN_JS,
      fenetresNatives: [],
      videoUne: { id: 'javascript-cours', titre: 'Vidéo du Récapitulatif JavaScript (.mp4)', src: V.js, poster: '', duree: '18:05', audio: A.js, desc: 'Variables, fonctions, événements et DOM, du premier script au projet.' },
      videos: [
        { id: 'javascript-cours', titre: 'JavaScript — Cours complet', duree: '18:05', src: V.js, poster: '', desc: 'Le récapitulatif animé de la matière.' }
      ],
      fenetres: [
        { id: 'sti-recap-js', titre: '🪄 Récapitulatif JavaScript — Synthèse interactive & exemples exécutables', type: 'iframe', source: 'cours/Recap-JavaScript-STI.html?embed=1' }
      ],
      modales: [{ root: '#jsRecapModal', box: '#jsRecapModal > div', titre: '#jsRecapModal h2', corps: '#jsRecapModal iframe' }],
      recapitulatif: true,
      comparatifs: true,
      editeurJS: true,
      boiteTypes: ['retenir', 'definition', 'exemple', 'attention', 'astuce', 'syntaxe', 'resultat', 'atoi']
    },

    sql: {
      nom: 'SQL', emoji: '🗄️', accent: '--sql', badge: 'badge--sql',
      titre: 'SQL — cours, exercices, annexes & vidéos',
      intro: 'Modèle relationnel, LDD, LMD, jointures, GROUP BY et les deux vidéos de révision du Bac, avec animation des contraintes.',
      classe: '4ème SI',
      fil: ['Accueil', 'Cours', 'SQL'],
      quiz: { url: 'quiz/sql.html', label: 'Quiz SQL' },
      chapitres: CH_SQL, exercices: EX_SQL, annexes: AN_SQL,
      fenetresNatives: [],
      videoUne: { id: 'sql-cours', titre: 'Vidéo du cours SQL (.mp4)', src: V.sql, poster: '../assets/images/sql-initiation-poster.jpg', duree: '09:23', audio: A.sql, desc: 'Archives (BD), SGBD, avion mère → fille, LDD, LMD et 4ème SI.' },
      videos: [
        { id: 'sql-cours', titre: 'Vidéo du cours SQL — cours complet', duree: '09:23', src: V.sql, poster: '../assets/images/sql-initiation-poster.jpg', desc: "Bases de données, SGBD, LDD et LMD. Bouton « Vidéo (.mp4) » d'origine." },
        { id: 'sql-initiation', titre: 'Construire une requête SQL — Guide-Texte', duree: '08:45', src: V.sql, poster: '../assets/images/sql-construire-requete-guide-texte-poster.jpg', desc: 'Sept étapes, sous-requêtes, auto-jointures et guide texte synchronisé.', remplacerPar: '../assets/videos/sql-initiation.mp4' },
        { id: 'sql-serie4', titre: 'Série 4 — Jointures, Sous-requêtes et Group By', duree: '14:34', src: V.sqlS4, poster: '../assets/images/sql-serie4-poster.jpg', desc: 'Base ETUDIANT_BD · 15 requêtes corrigées en vidéo.' },
        { id: 'sql-serie5', titre: 'Série 5 — Date, Sous-requêtes et Group By', duree: '18:09', src: V.sqlS5, poster: '../assets/images/sql-serie5-poster.jpg', desc: 'Base Gesthotel · 20 requêtes corrigées en vidéo.' }
      ],
      fenetres: [
        { id: 'sti-sql-contraintes', titre: 'SQL – Effet des contraintes (animation)', type: 'iframe', source: 'cours/sql-contraintes.html?embed=1' }
      ],
      modales: [{ root: '#sqlContraintesModal', box: '#sqlContraintesBox', titre: '#sqlContraintesModal h2', corps: '#sqlContraintesFrame', ouvert: ':not([hidden])' }],
      guideLigne: { audio: A.sql, titre: 'Guide-Ligne — écoute vocale du cours SQL' },
      videosBac: ['sql-serie4', 'sql-serie5'],
      comparatifs: true,
      boiteTypes: ['retenir', 'definition', 'exemple', 'attention', 'astuce', 'syntaxe', 'resultat', 'atoi']
    },

    php: {
      nom: 'PHP', emoji: '🐘', accent: '--php', badge: 'badge--php',
      titre: 'PHP — cours, exercices, annexes & vidéos',
      intro: 'Syntaxe PHP, chaînes, tableaux, dates, superglobales et MySQLi procédural — réservé à la 4ème SI.',
      classe: '4ème SI',
      fil: ['Accueil', 'Cours', 'PHP'],
      quiz: { url: 'quiz/php.html', label: 'Quiz PHP' },
      chapitres: CH_PHP, exercices: EX_PHP, annexes: AN_PHP,
      fenetresNatives: [],
      videoUne: { id: 'php-synthese', titre: 'Explication synthèse animée — l’exercice pas à pas', src: V.phpSynt, poster: '../assets/images/php-synthese-poster.jpg', duree: '14 min · Full HD', audio: '', desc: "Toutes les étapes du projet de synthèse, de la base de données à l'affichage." },
      videos: [
        { id: 'php-synthese', titre: 'Explication synthèse animée — l’exercice pas à pas', duree: '14 min · Full HD', src: V.phpSynt, poster: '../assets/images/php-synthese-poster.jpg', desc: 'Chapitres cliquables et mini-quiz de 10 questions.', telecharger: V.phpSynt },
        { id: 'php-cours', titre: 'PHP — Cours complet', duree: '20:10', src: V.phpCours, poster: '', desc: 'Variables, formulaires, sessions et connexion MySQL.' },
        { id: 'php-mysqli', titre: 'Leçon animée — Du formulaire aux archives : l’histoire du guichet', duree: 'Animation', src: '', poster: '', type: 'lecon', iframe: 'cours/php-mysqli.html?embed=1', desc: 'Le dialogue PHP ↔ MySQL, étape par étape.' },
        { id: 'php-recap', titre: 'Leçon animée — PHP : voir l’effet, étape par étape', duree: 'Animation', src: '', poster: '', type: 'lecon', iframe: 'cours/PHP-recap.html?embed=1', desc: 'Récapitulatif interactif du langage.' }
      ],
      fenetres: [
        fenetreIframe('sti-php-mysqli', '🐘 Du formulaire aux archives : l’histoire du guichet', 'cours/php-mysqli.html?embed=1'),
        fenetreIframe('sti-php-recap', '🐘 PHP : voir l’effet, étape par étape', 'cours/PHP-recap.html?embed=1')
      ],
      modales: [
        { root: '#animModal', box: '#animModal > div', titre: '#animModal h2' },
        { root: '#exoModal', box: '#exoModal > div', titre: '#exoModal h2' },
        { root: '#solModal', box: '#solModal > div', titre: '#solModal h2' },
        { root: '#recapModal', box: '#recapModal > div', titre: '#recapModal h2' },
        { root: '#exo2Modal', box: '#exo2Modal > div', titre: '#exo2Modal h2' },
        { root: '#sol2Modal', box: '#sol2Modal > div', titre: '#sol2Modal h2' }
      ],
      miniQuiz: { id: 'synthese', total: 10, messages: { parfait: '🏆 Parfait', bien: '👏 Très bien', moyen: '🙂 Pas mal — revoyez les scènes de la vidéo' } },
      chapitresVideo: '.chapitre-btn[data-t]',
      comparatifs: true,
      boiteTypes: ['retenir', 'definition', 'exemple', 'attention', 'astuce', 'syntaxe', 'resultat', 'atoi']
    }
  };
})();

/* --------------------------------------------------------------------------
   Comparatifs « À éviter / Bon réflexe » : extraits des constructions réellement
   étudiées dans les cours (aucun nouvel énoncé pédagogique).
   ------------------------------------------------------------------------ */
(function () {
  var CMP = {
    html5: [
      { ko: '<img src="fleur.jpg">', ok: '<img src="fleur.jpg" alt="Fleur de printemps">' },
      { ko: '<font color="red">Attention</font>', ok: '<strong class="important">Attention</strong> + CSS' }
    ],
    css3: [
      { ko: '<p style="color:red">Texte</p>', ok: '<p class="alerte">Texte</p>\n/* .alerte { color: red; } */' },
      { ko: 'div { width: 300px; padding: 20px; }', ok: 'div { width: 300px; padding: 20px;\n       box-sizing: border-box; }' }
    ],
    javascript: [
      { ko: 'if (a == b) { … }', ok: 'if (a === b) { … }' },
      { ko: 'var total = 0;', ok: 'let total = 0;\nconst TAUX = 0.2;' }
    ],
    sql: [
      { ko: 'SELECT * FROM ELEVES;', ok: 'SELECT Nom, Prenom, Age\nFROM ELEVES;' },
      { ko: 'SELECT * FROM ELEVES, CLASSES;', ok: 'SELECT e.Nom, c.Libelle\nFROM ELEVES e, CLASSES c\nWHERE e.IdClasse = c.IdClasse;' }
    ],
    php: [
      { ko: '$r = mysql_query($req);', ok: '$r = mysqli_query($connexion, $req);' },
      { ko: 'echo $_POST["nom"];', ok: '$nom = mysqli_real_escape_string(\n  $connexion, $_POST["nom"]);\necho htmlspecialchars($nom);' }
    ]
  };
  Object.keys(CMP).forEach(function (k) {
    if (window.STI_COURS[k]) window.STI_COURS[k].comparatifs = CMP[k];
  });
})();
