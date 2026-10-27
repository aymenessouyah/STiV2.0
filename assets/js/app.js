/* ============================================================================
   STI V2.0 — « Le web de A à Z » — APPLICATION (assets/js/app.js)
   ----------------------------------------------------------------------------
   JavaScript natif, sans framework. Chargé après config.js, supabase-umd.js,
   acces.js, sync-progressions.js puis profil.js (ordre imposé par le verrou).
   Ce fichier NE touche JAMAIS le stockage navigateur : toutes les données passent par
   window.STIProfil. Il ne recalcule ni la session ni le statut GOLD : il lit
   uniquement ce que acces.js et supabase-umd.js exposent déjà. Aucune URL ni
   clé Supabase n'est écrite ici (tout vient de window.STI_AUTH.RACINE).
   Aucune image externe : emojis, SVG intégrés et médias locaux uniquement.
   ========================================================================== */
(function () {
  'use strict';

  /* -------------------------------------------------------------------------
     0. UTILITAIRES
     ---------------------------------------------------------------------- */
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var P = window.STIProfil;
  var REDUIT = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ROOT = (window.STI_AUTH && window.STI_AUTH.RACINE) ? window.STI_AUTH.RACINE : './';
  function u(chemin) { return ROOT + String(chemin || '').replace(/^\/+/, ''); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function el(html) { var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; }
  function svg(path) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + path + '</svg>'; }
  function toast(msg) {
    var t = $('#stiToast');
    if (!t) {
      t = el('<div id="stiToast" role="status" aria-live="polite"></div>');
      t.style.cssText = 'position:fixed;bottom:26px;left:50%;transform:translateX(-50%) translateY(20px);z-index:200;background:var(--surface);color:var(--text);border:1px solid var(--border);border-radius:999px;padding:.7rem 1.3rem;box-shadow:var(--shadow-lg);font-size:.85rem;opacity:0;transition:.3s;pointer-events:none';
      document.body.appendChild(t);
    }
    t.textContent = msg; t.style.opacity = '1'; t.style.transform = 'translateX(-50%)';
    clearTimeout(t._timer); t._timer = setTimeout(function () { t.style.opacity = '0'; t.style.transform = 'translateX(-50%) translateY(20px)'; }, 2400);
  }

  /* -------------------------------------------------------------------------
     1. CATALOGUE DES MATIÈRES (un accent par matière)
     ---------------------------------------------------------------------- */
  var MATIERES = {
    html5:      { nom: 'HTML5',      emoji: '🧱', varc: '--html', badge: '🎥 1 vidéo & audio', nb: 1, cours: 'cours/html5.html',      quiz: 'quiz/html-css.html',  desc: 'Balises sémantiques, formulaires, tableaux, images et multimédia : la structure de vos pages.' },
    css3:       { nom: 'CSS3',       emoji: '🎨', varc: '--css',  badge: '🎥 3 vidéos & audio', nb: 3, cours: 'cours/css3.html',       quiz: 'quiz/html-css.html',  desc: 'Sélecteurs, box model, Flexbox, Grid, animations et responsive design.' },
    javascript: { nom: 'JavaScript', emoji: '⚡', varc: '--js',   badge: '🎥 1 vidéo & audio', nb: 1, cours: 'cours/javascript.html', quiz: 'quiz/javascript.html',desc: 'Variables, conditions, boucles, fonctions, tableaux, dates et manipulation du DOM.' },
    sql:        { nom: 'SQL',        emoji: '🗄️', varc: '--sql',  badge: '🎥 1 vidéo & audio', nb: 1, cours: 'cours/sql.html',        quiz: 'quiz/sql.html',       desc: 'Modèle relationnel, SELECT, WHERE, jointures, GROUP BY et agrégations.' },
    php:        { nom: 'PHP',        emoji: '🐘', varc: '--php',  badge: '🎥 2 vidéos & audio', nb: 2, cours: 'cours/php.html',        quiz: 'quiz/php.html',       desc: 'Syntaxe PHP, formulaires, sessions, MySQL et CRUD — réservé à la 4ème SI.' }
  };
  var ORDRE = ['html5', 'css3', 'javascript', 'sql', 'php'];
  /* Catégories du filtre d'accueil : HTML5 + CSS3 partagent « htmlcss ». */
  function tech(m) { return (m === 'html5' || m === 'css3') ? 'htmlcss' : (m === 'javascript' ? 'js' : m); }

  /* -------------------------------------------------------------------------
     2. VIDÉOS — chemins faciles à remplacer.
        Convention : déposez « assets/videos/[matiere]-cours.mp4 » puis
        remplacez simplement la propriété src ci-dessous. Les posters sont
        locaux (assets/images/…). « audio » est la piste vocale synchronisée.
     ---------------------------------------------------------------------- */
  var VIDEOS = [
    { id:'html5-cours', matiere:'html5', titre:'HTML5 — Les balises essentielles', duree:'12:40', src:'assets/videos/html5-cours.mp4', poster:'', audio:'assets/audio/html5-cours.mp3', desc:'Structure d’une page, titres, liens, images et formulaires expliqués pas à pas.' },
    { id:'css3-cours', matiere:'css3', titre:'CSS3 — Cours complet synchronisé', duree:'24:15', src:'assets/videos/css3-cours-v9-sync.mp4', poster:'assets/images/css3-cours-v9-sync-poster.jpg', audio:'assets/audio/css3-cours.mp3', desc:'Le cours de référence, avec guide-ligne et écoute vocale synchronisée.' },
    { id:'css-animee', matiere:'css3', titre:'CSS3 — Les animations', duree:'08:30', src:'assets/videos/css-animee.mp4', poster:'', audio:'assets/audio/css-animee.mp3', desc:'Transitions, keyframes et transformations : donnez vie à vos pages.' },
    { id:'css-positionnement', matiere:'css3', titre:'CSS3 — Le positionnement', duree:'09:12', src:'assets/videos/css-positionnement.mp4', poster:'', audio:'assets/audio/css-positionnement.mp3', desc:'Static, relative, absolute, fixed, float, flex et grid en pratique.' },
    { id:'javascript-cours', matiere:'javascript', titre:'JavaScript — Cours complet', duree:'18:05', src:'assets/videos/javascript-cours.mp4', poster:'', audio:'assets/audio/javascript-cours.mp3', desc:'Variables, fonctions, événements et DOM, du premier script au projet.' },
    { id:'sql-cours', matiere:'sql', titre:'SQL — Initiation aux requêtes', duree:'16:20', src:'assets/videos/sql-cours-v7.mp4', poster:'assets/images/sql-initiation-poster.jpg', audio:'assets/audio/sql-cours.mp3', desc:'Créer une base, interroger avec SELECT, filtrer et trier les résultats.' },
    { id:'php-cours', matiere:'php', titre:'PHP — Cours complet', duree:'20:10', src:'assets/videos/php-cours.mp4', poster:'', audio:'assets/audio/php-cours.mp3', desc:'Variables, formulaires, sessions et connexion à une base MySQL.' },
    { id:'php-guichet', matiere:'php', titre:'PHP — Projet guichet pas à pas', duree:'14:35', src:'assets/videos/php-guichet-v10.mp4', poster:'assets/images/php-guichet-v10-poster.jpg', audio:'', desc:'Étude de cas complète : un guichet dynamique HTML → PHP → SQL.' }
  ];
  var VIDEO_UNE = VIDEOS[1]; /* « Vidéo à la une » du hero */
  function videoParId(id) { for (var i = 0; i < VIDEOS.length; i++) if (VIDEOS[i].id === id) return VIDEOS[i]; return null; }

  /* -------------------------------------------------------------------------
     3. EXERCICES & ANNEXES (tous les fichiers du site de référence restent)
     ---------------------------------------------------------------------- */
  var EXERCICES = {
    html5: [
      ['🎯', 'Séries & exercices (toutes matières)', 'exercices/series-exercices.html'],
      ['📄', 'TP1 CSS — mise en page', 'exercices/html-css/TP1-css.pdf.html'],
      ['📄', 'TP2 CSS — positionnement', 'exercices/html-css/TP2-css.pdf.html'],
      ['📄', 'TP3 CSS — mise en forme', 'exercices/html-css/TP3-css.pdf.html'],
      ['🧩', 'Activité 1 & 2 — position et animation', 'exercices/html-css/activite1-2-position-animation-css3.pdf.html'],
      ['📝', 'Formulaire d’inscription', 'exercices/html-css/formulaire-inscription.pdf.html'],
      ['🗓️', 'Emploi du temps en tableau', 'exercices/html-css/emploi-temps/emploidutemps.html'],
      ['💡', 'Box-shadow & text-shadow', 'exercices/html-css/box-shadow-text-shadow-css3.html'],
      ['🏫', 'Projet STI0 — sondage & statistiques', 'projets/sti0/index.html']
    ],
    css3: [
      ['🎯', 'Séries & exercices (toutes matières)', 'exercices/series-exercices.html'],
      ['📄', 'TP1 CSS — sélecteurs', 'exercices/html-css/TP1-css.pdf.html'],
      ['📄', 'TP2 CSS — positionnement', 'exercices/html-css/TP2-css.pdf.html'],
      ['📄', 'TP3 CSS — mise en page', 'exercices/html-css/TP3-css.pdf.html'],
      ['🧩', 'Activité 1 & 2 — animation CSS3', 'exercices/html-css/activite1-2-position-animation-css3.pdf.html'],
      ['🌊', 'Positionnement animé (module interactif)', 'Positionnement-animee/index.html'],
      ['🌍', 'Projet Explore Tunisie — float & flex', 'projets/site-tunisie/index.html'],
      ['💳', 'Projet carte bancaire', 'projets/carte-bancaire/enonce-tp-carte-bancaire.html']
    ],
    javascript: [
      ['🎯', 'Séries & exercices (toutes matières)', 'exercices/series-exercices.html'],
      ['1️⃣', 'TP1 JavaScript + corrigé', 'exercices/javascript/Tp1-js.html'],
      ['2️⃣', 'TP2 JavaScript + corrigé', 'exercices/javascript/Tp2-js.html'],
      ['3️⃣', 'TP3 JavaScript + corrigé', 'exercices/javascript/Tp3-js.html'],
      ['4️⃣', 'TP4 JavaScript + corrigé', 'exercices/javascript/Tp4-js.html'],
      ['5️⃣', 'TP5 JavaScript + corrigé', 'exercices/javascript/Tp5-js.html'],
      ['🏆', 'Les 37 défis JavaScript', 'exercices/javascript/js-37-defis-tt.html'],
      ['🔤', 'Résumé des fonctions standards', 'exercices/resume-fonctions-standards.html'],
      ['🛠️', 'Atelier des 10 fonctions de contrôle du Bac', 'outils-js-bac.html']
    ],
    sql: [
      ['🎯', 'Séries & exercices (toutes matières)', 'exercices/series-exercices.html'],
      ['📘', 'Comment construire une requête SQL', 'exercices/sql/CommentConstruireunerequêteSQL.html'],
      ['1️⃣', 'TP1 base de données', 'exercices/sql/Tp1-bd.html'],
      ['2️⃣', 'TP2 base de données', 'exercices/sql/Tp2-bd.html'],
      ['3️⃣', 'TP3 base de données (corrigé)', 'exercices/sql/Tp3-Correction-bd.html'],
      ['🔗', 'TP jointures, sous-requêtes & GROUP BY', 'exercices/sql/Tp-BD-Jointure-sous-requetes-Group-By.html'],
      ['📊', 'TP GROUP BY', 'exercices/sql/Tp-GroupBy-bd.html'],
      ['🗓️', 'TP dates, SSR, jointures & groupes', 'exercices/sql/Tp-date-ssr-j-gp-bd.html'],
      ['🧪', 'Atelier SQL 3 fenêtres', 'exercices/sql/atelier_sql_3_fenetres.html'],
      ['▶️', 'Série 4.2 GestLocation (vidéo)', 'exercices/sql/Série 4.2 - GestLocation - Vidéo.mp4']
    ],
    php: [
      ['🎯', 'Séries & exercices (toutes matières)', 'exercices/series-exercices.html'],
      ['1️⃣', 'TP1 PHP + corrigé', 'exercices/php/Tp1-php.html'],
      ['2️⃣', 'TP2 PHP + corrigé', 'exercices/php/Tp2-php.html'],
      ['3️⃣', 'TP3 PHP + corrigé', 'exercices/php/Tp3-php.html'],
      ['4️⃣', 'TP4 PHP + corrigé', 'exercices/php/Tp4-php.html'],
      ['5️⃣', 'TP5 PHP + corrigé', 'exercices/php/Tp5-php.html'],
      ['🐞', 'Débogage PHP Bac', 'exercices/php/debogage-php-bac.html'],
      ['🔀', 'Ordre d’exécution PHP Bac', 'exercices/php/ordre-php-bac.html'],
      ['🧭', 'Sondage — parcours pas à pas', 'exercices/php/sondage-parcours-pas-a-pas.html'],
      ['📊', 'Statistiques PHP animées', 'exercices/php/statphpanimee.html']
    ]
  };
  var ANNEXES = {
    html5: [
      ['📕', 'Annexe HTML5 (PDF)', 'documents/annexes/annexe-html5.pdf'],
      ['📖', 'Annexe HTML5 — lecture en ligne', 'documents/annexes/annexe-html5.pdf.html'],
      ['🧾', 'Fiche de révision HTML5', 'cours/fiche-revision-html5.html'],
      ['🌸', 'Annexe fleuriste HTML5', 'cours/annexe-fleuriste-html5.html'],
      ['📚', 'Document complet 3ème SI', 'documents/complet/complet-3eme-si.pdf']
    ],
    css3: [
      ['📘', 'Annexe CSS3 (PDF)', 'documents/annexes/annexe-css3.pdf'],
      ['📖', 'Annexe CSS3 — lecture en ligne', 'documents/annexes/annexe-css3.pdf.html'],
      ['🧾', 'Fiche synthèse globale CSS3', 'cours/courscss3.html'],
      ['📐', 'Annexe CSS3 (module positionnement)', 'Positionnement-animee/uploads/Annexe CSS3 By A.E.pdf'],
      ['📚', 'Document complet 4ème SI — cours', 'documents/complet/complet-4eme-si-cours.pdf']
    ],
    javascript: [
      ['📗', 'Annexe JavaScript (PDF)', 'documents/annexes/annexe-javascript.pdf'],
      ['📖', 'Annexe JavaScript — lecture en ligne', 'documents/annexes/annexe-javascript.pdf.html'],
      ['🧾', 'Récapitulatif JavaScript STI', 'cours/Recap-JavaScript-STI.html'],
      ['🔤', 'Résumé des fonctions standards', 'exercices/resume-fonctions-standards.html'],
      ['🧠', 'Mémo A4 — veille du Bac', 'memo-veille-bac.html']
    ],
    sql: [
      ['📙', 'Annexe SQL (PDF)', 'documents/annexes/annexe-sql.pdf'],
      ['📖', 'Annexe SQL — lecture en ligne', 'documents/annexes/annexe-sql.pdf.html'],
      ['🧾', 'Bases LDD / LMD / LCD', 'cours/sql-bases-ldd-lmd-lcd.html'],
      ['🔑', 'Contraintes SQL', 'cours/sql-contraintes.html'],
      ['📝', 'Guide texte — construire une requête', 'documents/sql/Documentation-Construire-Requete-SQL-Guide-Texte.pdf'],
      ['🗃️', 'Bases d’exercices (.sql)', 'documents/bd/ecole.sql']
    ],
    php: [
      ['📓', 'Annexe PHP (PDF)', 'documents/annexes/annexe-php.pdf'],
      ['📖', 'Annexe PHP — lecture en ligne', 'documents/annexes/annexe-php.pdf.html'],
      ['🧾', 'Récapitulatif PHP', 'cours/PHP-recap.html'],
      ['🔌', 'PHP & MySQLi', 'cours/php-mysqli.html'],
      ['🧠', 'Fiche mémento synthèse', 'documents/complet/fiche-memento-synthese.html']
    ]
  };

  /* -------------------------------------------------------------------------
     4. OUTILS & QUIZ (les fonctions window.* sont fournies par acces.js)
     ---------------------------------------------------------------------- */
  var OUTILS = [
    { em:'🎓', titre:'Atelier Bac', desc:'Sujets types, corrigés détaillés et chronomètre.', url:'bac-pratique.html', couleur:'--html', tech:'htmlcss' },
    { em:'⚠️', titre:'Les 25 Pièges du Bac', desc:'Les erreurs à éviter absolument le jour J.', url:'pieges-bac.html', couleur:'--php', tech:'php' },
    { em:'🧠', titre:'Mémo A4 (veille du Bac)', desc:'La fiche de révision express à imprimer.', url:'memo-veille-bac.html', couleur:'--sql', tech:'sql' },
    { em:'🛠️', titre:'Atelier JavaScript Bac', desc:'Les 10 fonctions de contrôle + générateur.', url:'outils-js-bac.html', couleur:'--js', tech:'js' },
    { em:'🃏', titre:'Flashcards Bac STI', desc:'Cartes recto/verso trilingues FR · EN · AR.', fn:'ouvrirFlashcardsSTI', couleur:'--css', tech:'htmlcss' },
    { em:'💻', titre:'Bac à sable Code', desc:'Testez HTML, CSS et JS en direct, hors-ligne.', fn:'ouvrirSandboxSTI', couleur:'--js', tech:'js' },
    { em:'🖥️', titre:'Console JavaScript', desc:'Écrivez et exécutez votre code JS.', fn:'ouvrirConsoleNavigateurSTI', couleur:'--js', tech:'js' },
    { em:'🐞', titre:'Chasse aux erreurs', desc:'Débogage Bac : trouvez les 3 erreurs classiques.', fn:'ouvrirChasseErreursSTI', couleur:'--html', tech:'htmlcss' },
    { em:'📝', titre:'Examen Blanc (/20)', desc:'Épreuve chronométrée avec radar de compétences.', fn:'ouvrirExamenBlancSTI', couleur:'--sql', tech:'sql' },
    { em:'📋', titre:'Constructeur Table / Form / Flex', desc:'Générez tableaux, formulaires et Flexbox.', fn:'ouvrirConstructeurVisuelSTI', couleur:'--css', tech:'htmlcss' },
    { em:'🗄️', titre:'Labo SQL (Mini-phpMyAdmin)', desc:'SELECT, jointures, GROUP BY, INSERT, UPDATE.', fn:'ouvrirSimulateurSqlSTI', couleur:'--sql', tech:'sql' },
    { em:'🔤', titre:'Chaînes & ASCII JavaScript', desc:'charAt, substring, indexOf, charCodeAt.', fn:'ouvrirLaboChainesAsciiSTI', couleur:'--js', tech:'js' },
    { em:'🔗', titre:'Form ➜ PHP ➜ SQL', desc:'Simulateur du parcours $_POST puis INSERT.', fn:'ouvrirSimulateurFormPhpSqlSTI', couleur:'--php', tech:'php' },
    { em:'🗂️', titre:'Fichiers TP du professeur', desc:'Coffre des fichiers .sql, .zip, .html, .php.', fn:'ouvrirCoffreTpEleveSTI', couleur:'--php', tech:'php' },
    { em:'📖', titre:'Scanner mon livre', desc:'Smart Book 3ème SI (72 p.) & 4ème SI (100 p.).', url:'livre-smart.html', couleur:'--accent', tech:'all' },
    { em:'📇', titre:'Glossaire FR · EN · AR', desc:'Tout le vocabulaire technique traduit.', url:'glossaire.html', couleur:'--accent', tech:'all' }
  ];
  var QUIZ = [
    { n:'01', titre:'HTML5 & CSS3', desc:'Balisage, formulaires, sélecteurs, box model, responsive.', url:'quiz/html-css.html', couleur:'--html', tech:'htmlcss', meta:['Auto-corrigé','30 questions','15 min'] },
    { n:'02', titre:'JavaScript', desc:'Types, opérateurs, boucles, fonctions, tableaux, DOM.', url:'quiz/javascript.html', couleur:'--js', tech:'js', meta:['Auto-corrigé','35 questions','20 min'] },
    { n:'03', titre:'SQL', desc:'SELECT, WHERE, jointures, GROUP BY et agrégations.', url:'quiz/sql.html', couleur:'--sql', tech:'sql', meta:['Auto-corrigé','25 questions','18 min'] },
    { n:'04', titre:'PHP', desc:'Variables, superglobales, sessions, requêtes préparées.', url:'quiz/php.html', couleur:'--php', tech:'php', meta:['Auto-corrigé','28 questions','22 min'] },
    { n:'🔁', titre:'Révision « Mes erreurs »', desc:'Rejouez uniquement les questions que vous avez ratées.', url:'revision-erreurs.html', couleur:'--accent', tech:'all', meta:['Ciblé','1 244 questions'] },
    { n:'📊', titre:'Quiz des tableaux', desc:'Tableaux HTML, JS et SQL — réservé aux abonnés.', url:'quiz/tableaux.html', couleur:'--gold', tech:'all', meta:['⭐ Abonnés','Réservé'] }
  ];

  /* Catalogue de la recherche globale (Ctrl+K) */
  var RECHERCHE = (function () {
    var r = [];
    ORDRE.forEach(function (m) {
      r.push({ em: MATIERES[m].emoji, t: 'Cours ' + MATIERES[m].nom, s: 'Cours · exercices · annexes · vidéos', u: u(MATIERES[m].cours) });
    });
    ['html-css', 'javascript', 'sql', 'php'].forEach(function (q) {
      r.push({ em: '🧠', t: 'Quiz ' + q.replace('-', ' & ').toUpperCase(), s: 'Quiz auto-corrigé', u: u('quiz/' + q + '.html') });
    });
    OUTILS.forEach(function (o) { r.push({ em: o.em, t: o.titre, s: o.desc, u: o.url ? u(o.url) : '', fn: o.fn }); });
    [['dashboard.html', '📊', 'Tableau de bord'], ['glossaire.html', '📇', 'Glossaire FR · EN · AR'],
     ['nouveautes.html', '🆕', 'Nouveautés'], ['carte-visite.html', '🪪', 'Carte de visite'],
     ['ma-fiche-revision.html', '🧾', 'Ma fiche de révision'], ['portail.html', '🔑', 'Connexion abonné']
    ].forEach(function (x) { r.push({ em: x[1], t: x[2], s: 'Page STI V2.0', u: u(x[0]) }); });
    return r;
  })();

  /* -------------------------------------------------------------------------
     5. TRADUCTIONS LÉGÈRES DE L'INTERFACE (FR · EN · AR)
     ---------------------------------------------------------------------- */
  var I18N = {
    fr: { accueil:'Accueil', matieres:'Matières', videos:'Vidéos', quiz:'Quiz', outils:'Outils', conseils:'Conseils', contact:'Contact', installer:'Installer', commencer:'Commencer', tableau:'Tableau de bord' },
    en: { accueil:'Home', matieres:'Subjects', videos:'Videos', quiz:'Quizzes', outils:'Tools', conseils:'Tips', contact:'Contact', installer:'Install', commencer:'Start', tableau:'Dashboard' },
    ar: { accueil:'الرئيسية', matieres:'المواد', videos:'الفيديوهات', quiz:'اختبارات', outils:'الأدوات', conseils:'نصائح', contact:'اتصال', installer:'تثبيت', commencer:'ابدأ', tableau:'لوحة التحكم' }
  };
  function traduire() {
    var dico = I18N[P.chargerProfil().langue] || I18N.fr;
    $$('[data-i18n]').forEach(function (n) {
      var cle = n.getAttribute('data-i18n');
      if (dico[cle] && n.getAttribute('data-i18n-keep') !== '1') n.textContent = dico[cle];
    });
  }

  /* -------------------------------------------------------------------------
     6. EN-TÊTE, PIED DE PAGE, PANNEAUX ET MODALES (coquille commune)
     ---------------------------------------------------------------------- */
  function headerHTML() {
    return '' +
    '<div class="scroll-progress" id="scrollProgress" aria-hidden="true"></div>' +
    '<header class="site-header" id="siteHeader"><div class="header-inner">' +
      '<a class="brand" href="' + u('index.html') + '" aria-label="STI V2.0 — accueil">' +
        '<span class="brand__mark" aria-hidden="true">STI</span><span class="brand__text">' +
        '<span class="brand__name">STI V2.0</span><span class="brand__tag">Le web de A à Z</span></span></a>' +
      '<nav class="nav" aria-label="Navigation principale">' +
        '<a href="' + u('index.html') + '" data-nav="index" data-i18n="accueil">Accueil</a>' +
        '<a href="' + u('index.html#matieres') + '" data-nav="matieres" data-i18n="matieres">Matières</a>' +
        '<a href="' + u('index.html#videos') + '" data-nav="videos" data-i18n="videos">Vidéos</a>' +
        '<a href="' + u('index.html#quiz') + '" data-nav="quiz" data-i18n="quiz">Quiz</a>' +
        '<a href="' + u('index.html#outils') + '" data-nav="outils" data-i18n="outils">Outils</a>' +
        '<a href="' + u('index.html#conseils') + '" data-nav="conseils" data-i18n="conseils">Conseils</a>' +
        '<a href="#contact" data-nav="contact" data-i18n="contact">Contact</a>' +
      '</nav>' +
      '<div class="header-actions">' +
        '<button class="icon-btn hide-xs" id="stiSearchBtn" type="button" aria-label="Rechercher (Ctrl+K)" title="Rechercher (Ctrl+K)">' + svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/>') + '</button>' +
        '<button class="btn btn--ghost btn--sm btn--hide-sm" id="stiInstallBtn" type="button" data-i18n="installer">⤓ Installer</button>' +
        '<div class="modes" role="group" aria-label="Mode d’affichage">' +
          '<button type="button" data-theme-choice="sombre" title="Mode sombre" aria-label="Mode sombre" aria-pressed="true">🌙</button>' +
          '<button type="button" data-theme-choice="clair" title="Mode clair" aria-label="Mode clair" aria-pressed="false">☀️</button>' +
          '<button type="button" data-theme-choice="intermediaire" title="Mode intermédiaire" aria-label="Mode intermédiaire" aria-pressed="false">◐</button>' +
        '</div>' +
        '<div id="stiBadgeSlot"></div>' +
        '<button class="icon-btn burger" id="burger" type="button" aria-label="Ouvrir le menu" aria-expanded="false">' + svg('<path d="M4 7h16M4 12h16M4 17h16"/>') + '</button>' +
      '</div></div></header>' +
    '<div class="mobile-menu" id="mobileMenu">' +
      '<a href="' + u('index.html') + '" data-i18n="accueil">Accueil</a>' +
      '<a href="' + u('index.html#matieres') + '" data-i18n="matieres">Matières</a>' +
      '<a href="' + u('index.html#videos') + '" data-i18n="videos">Vidéos</a>' +
      '<a href="' + u('index.html#quiz') + '" data-i18n="quiz">Quiz</a>' +
      '<a href="' + u('index.html#outils') + '" data-i18n="outils">Outils</a>' +
      '<a href="' + u('dashboard.html') + '" data-i18n="tableau">Tableau de bord</a>' +
      '<a href="' + u('glossaire.html') + '">Glossaire FR · EN · AR</a>' +
      '<a href="#contact" data-i18n="contact">Contact</a>' +
    '</div>';
  }

  function footerHTML() {
    return '' +
    '<footer class="site-footer"><div class="container"><div class="footer-grid">' +
      '<div class="footer-col"><a class="brand" href="' + u('index.html') + '" style="margin-bottom:1rem">' +
        '<span class="brand__mark">STI</span><span class="brand__text"><span class="brand__name">STI V2.0</span><span class="brand__tag">Le web de A à Z</span></span></a>' +
        '<p style="color:var(--text-muted);font-size:var(--fs-sm);max-width:34ch">Plateforme éducative du Lycée Raféha pour les classes de 3<sup>ème</sup> et 4<sup>ème</sup> Sciences de l’Informatique. Réalisée par <strong>Aymen Essouyah</strong>.</p>' +
        '<div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-top:1.2rem">' +
          '<a class="badge" href="' + u('dashboard.html') + '">📊 Tableau de bord</a>' +
          '<a class="badge" href="' + u('portail.html') + '">🔑 Espace abonné</a></div></div>' +
      '<div class="footer-col"><h4>Matières</h4><ul>' + ORDRE.map(function (m) {
        return '<li><a href="' + u(MATIERES[m].cours) + '"><span class="bullet" style="background:var(' + MATIERES[m].varc + ')"></span> ' + esc(MATIERES[m].nom) + '</a></li>';
      }).join('') + '<li><a href="' + u('glossaire.html') + '"><span class="bullet"></span> Glossaire FR · EN · AR</a></li></ul></div>' +
      '<div class="footer-col"><h4>Ressources</h4><ul>' +
        '<li><a href="' + u('quiz/html-css.html') + '"><span class="bullet"></span> Quiz interactifs</a></li>' +
        '<li><a href="' + u('bac-pratique.html') + '"><span class="bullet"></span> Atelier Bac</a></li>' +
        '<li><a href="' + u('pieges-bac.html') + '"><span class="bullet"></span> 25 Pièges du Bac</a></li>' +
        '<li><a href="' + u('memo-veille-bac.html') + '"><span class="bullet"></span> Mémo A4</a></li>' +
        '<li><a href="' + u('outils-js-bac.html') + '"><span class="bullet"></span> Atelier JavaScript</a></li>' +
        '<li><a href="' + u('exercices/series-exercices.html') + '"><span class="bullet"></span> Séries d’exercices</a></li>' +
        '<li><a href="' + u('nouveautes.html') + '"><span class="bullet"></span> Nouveautés</a></li></ul></div>' +
      '<div class="footer-col"><h4>Contact</h4><ul class="footer-contact">' +
        '<li>✉️ <a href="mailto:aymenessouyah@gmail.com">aymenessouyah@gmail.com</a></li>' +
        '<li>🏫 Lycée Raféha — Département SI</li>' +
        '<li>🪪 <a href="' + u('carte-visite.html') + '">Carte de visite du professeur</a></li>' +
        '<li>📱 <button class="btn btn--ghost btn--sm" type="button" data-modal-open="modalContact">QR code & contact</button></li>' +
      '</ul><div class="qr-card"><img src="' + u('assets/images/qr-code-site.png') + '" alt="QR code vers la plateforme STI V2.0" loading="lazy">' +
        '<p><strong>📱 Scannez-moi !</strong>Accédez à STI V2.0 directement depuis votre téléphone.</p></div></div>' +
    '</div><div class="footer-bottom"><span>© <span id="year">' + new Date().getFullYear() + '</span> STI V2.0 — Le web de A à Z · Lycée Raféha · Aymen Essouyah.</span>' +
      '<span>Design system V2.0 · HTML5 · CSS3 · JavaScript natif · <a href="' + u('index-origine.html') + '" style="color:var(--accent)">Version classique</a></span></div></div></footer>';
  }

  function overlayHTML() {
    return '' +
    /* Panneau latéral de l'abonné */
    '<div class="side-panel__backdrop" id="stiPanelBackdrop"></div>' +
    '<aside class="side-panel" id="stiPanel" role="dialog" aria-modal="true" aria-label="Espace abonné"><div id="stiPanelContent"></div></aside>' +
    /* Palette de recherche Ctrl+K */
    '<div class="modal" id="modalSearch" role="dialog" aria-modal="true" aria-label="Recherche globale"><div class="modal__box palette">' +
      '<input type="search" id="stiSearchInput" placeholder="Rechercher un cours, un quiz, un outil…" aria-label="Rechercher dans la plateforme">' +
      '<div style="display:flex;gap:.5rem;align-items:center;margin-top:.75rem;color:var(--text-dim);font-size:.75rem"><span class="kbd">Entrée</span> ouvrir · <span class="kbd">Échap</span> fermer</div>' +
      '<div class="palette__list" id="stiSearchResults"></div></div></div>' +
    /* Lecteur vidéo */
    '<div class="modal modal--video" id="modalVideo" role="dialog" aria-modal="true" aria-label="Lecteur vidéo"><div class="modal__box" style="position:relative">' +
      '<button class="modal__close" type="button" data-modal-close aria-label="Fermer">✕</button>' +
      '<div id="stiVideoWrap"></div><h3 id="stiVideoTitle" style="margin-top:1rem;font-size:var(--fs-lg)"></h3>' +
      '<p id="stiVideoDesc" style="color:var(--text-muted);font-size:var(--fs-sm);margin:0"></p></div></div>' +
    /* Modale Contact + QR code */
    '<div class="modal" id="modalContact" role="dialog" aria-modal="true" aria-labelledby="stiContactTitle"><div class="modal__box" style="position:relative">' +
      '<button class="modal__close" type="button" data-modal-close aria-label="Fermer">✕</button>' +
      '<span class="badge badge--gold" style="margin-bottom:1rem">📬 Contact</span>' +
      '<h3 id="stiContactTitle" style="font-size:var(--fs-xl)">STI by AE V2.0</h3>' +
      '<p style="color:var(--text-muted);font-size:var(--fs-sm)">👨‍🏫 M. Aymen Essouyah · Lycée Raféha<br>✉️ <a href="mailto:aymenessouyah@gmail.com" style="color:var(--accent);font-weight:700">aymenessouyah@gmail.com</a></p>' +
      '<div class="qr-card"><img src="' + u('assets/images/qr-code-site.png') + '" alt="QR code du site STI V2.0">' +
      '<p><strong>📱 Scanner-moi !</strong>Flashez ce code pour ouvrir la plateforme sur votre téléphone. <a href="' + u('carte-visite.html') + '" style="color:var(--accent)">Carte de visite complète →</a></p></div>' +
      '<button class="btn btn--primary btn--sm" type="button" data-modal-close style="margin-top:1.25rem">Compris</button></div></div>' +
    /* Modale d'installation (PWA) */
    '<div class="modal" id="modalInstall" role="dialog" aria-modal="true" aria-labelledby="stiInstallTitle"><div class="modal__box" style="position:relative">' +
      '<button class="modal__close" type="button" data-modal-close aria-label="Fermer">✕</button>' +
      '<h3 id="stiInstallTitle" style="font-size:var(--fs-xl)">⤓ Installer l’application</h3>' +
      '<p style="color:var(--text-muted);font-size:var(--fs-sm)">Sur ordinateur : menu du navigateur → « Installer STI V2.0 ». Sur mobile : « Partager » → « Sur l’écran d’accueil ». L’application fonctionne ensuite hors connexion.</p>' +
      '<button class="btn btn--primary btn--sm" type="button" id="stiInstallGo">Installer maintenant</button></div></div>' +
    '<button class="to-top" id="toTop" type="button" aria-label="Retour en haut">' + svg('<path d="M12 19V5M6 11l6-6 6 6"/>') + '</button>';
  }

  function injecterCoquille() {
    var body = document.body;
    if (!body) return;
    body.classList.add('sti-v2');
    if (!$('#siteHeader')) {
      var h = el('<div>' + headerHTML() + '</div>');
      while (h.firstChild) body.insertBefore(h.firstChild, body.firstChild);
    }
    if (!$('.site-footer')) body.insertAdjacentHTML('beforeend', footerHTML());
    if (!$('#stiPanel')) body.insertAdjacentHTML('beforeend', overlayHTML());
    if (!$('#contact')) {
      var c = document.createElement('span'); c.id = 'contact'; c.setAttribute('aria-hidden', 'true');
      var f = $('.site-footer'); if (f && f.parentNode) f.parentNode.insertBefore(c, f);
    }
  }

  /* -------------------------------------------------------------------------
     7. TROIS MODES D'AFFICHAGE (sombre · clair · intermédiaire)
     ---------------------------------------------------------------------- */
  function initThemes() {
    function peindre() {
      var t = P.chargerProfil().theme;
      $$('[data-theme-choice],[data-theme-segment]').forEach(function (b) {
        var v = b.getAttribute('data-theme-choice') || b.getAttribute('data-theme-segment');
        b.setAttribute('aria-pressed', String(v === t));
      });
    }
    $$('[data-theme-choice],[data-theme-segment]').forEach(function (b) {
      b.addEventListener('click', function () {
        var t = b.getAttribute('data-theme-choice') || b.getAttribute('data-theme-segment');
        P.mettreAJour('theme', t);
        P.appliquerPreferences(); P.garderTheme(); peindre();
        toast(({ sombre:'🌙 Mode sombre', clair:'☀️ Mode clair', intermediaire:'◐ Mode intermédiaire' })[t] || t);
      });
    });
    peindre();
    window.addEventListener('sti:profil', peindre);
  }

  /* -------------------------------------------------------------------------
     8. BADGE ABONNÉ + PANNEAU LATÉRAL
     ---------------------------------------------------------------------- */
  var etat = null;
  function rendreBadge(e) {
    etat = e || etat || P.etatAbonne(null);
    var slot = $('#stiBadgeSlot'); if (!slot) return;
    if (etat.connecte) {
      var photo = etat.photo ? '<img src="' + esc(etat.photo) + '" alt="">' : esc(etat.initiales);
      slot.innerHTML = '<button class="sub-badge" id="stiBadgeBtn" type="button" aria-label="Ouvrir mon espace abonné">' +
        '<span class="avatar' + (etat.gold ? ' avatar--gold' : '') + '">' + photo + '</span>' +
        '<span class="sub-badge__txt"><span class="sub-badge__name">' + esc(etat.affiche || 'Abonné') + '</span>' +
        '<span class="sub-badge__star">⭐ Abonné' + (etat.gold ? ' GOLD' : '') + '</span></span></button>';
    } else {
      slot.innerHTML = '<a class="sub-badge sub-badge--guest" href="' + u('portail.html') + '">🔑 Se connecter / Devenir abonné</a>';
    }
    var btn = $('#stiBadgeBtn');
    if (btn) btn.addEventListener('click', function () {
      if (document.body.getAttribute('data-page') === 'accueil') ouvrirPanel();
      else window.location.href = u('dashboard.html');
    });
  }
  function initBadge() {
    rendreBadge(P.etatAbonne(null));
    try {
      var s = P.session();
      if (s && typeof s.then === 'function') s.then(function (sess) { if (sess) rendreBadge(P.etatAbonne(sess)); });
    } catch (e) {}
    setTimeout(function () { rendreBadge(P.etatAbonne(null)); }, 1600); /* GOLD activé après coup par acces.js */
    window.addEventListener('sti:profil', function () { rendreBadge(etat); });
  }

  function panelHTML() {
    var p = P.chargerProfil();
    var e = etat || P.etatAbonne(null);
    var lecture = p.derniereLecture || {};
    var revises = ORDRE.reduce(function (n, m) { return n + (p.progression[m] || 0); }, 0);
    var nbVues = (p.videos.vues || []).length;
    return '<div class="side-panel__head"><span class="avatar avatar--gold" style="width:46px;height:46px">' + esc(e.initiales) + '</span>' +
      '<div><strong style="display:block">' + esc(e.affiche || 'Mon espace') + '</strong><span class="sub-badge__star">⭐ Abonné</span></div>' +
      '<button class="icon-btn side-panel__close" id="stiPanelClose" type="button" aria-label="Fermer le panneau">✕</button></div>' +
      '<div class="side-panel__section"><h4>Mon activité</h4>' +
        '<div class="link-row">📖 <span>Reprise de lecture</span><span class="end">' + esc(lecture.chapitre || 'À découvrir') + '</span></div>' +
        '<div class="link-row">📈 <span>Chapitres révisés</span><span class="end">' + revises + ' / 25</span></div>' +
        '<div class="link-row">🎥 <span>Vidéos vues</span><span class="end">' + nbVues + ' / ' + VIDEOS.length + '</span></div>' +
        '<div class="link-row">🧠 <span>Mes quiz</span><span class="end">' + p.quiz.length + '</span></div></div>' +
      '<div class="side-panel__section"><h4>Accès rapide</h4>' +
        '<a class="link-row" href="' + u('dashboard.html') + '">📊 <span>Tableau de bord complet</span><span class="end">→</span></a>' +
        '<a class="link-row" href="' + u('revision-erreurs.html') + '">🔁 <span>Rejouer mes erreurs</span><span class="end">→</span></a>' +
        '<a class="link-row" href="' + u('quiz/tableaux.html') + '">📊 <span>Quiz des tableaux</span><span class="end">⭐</span></a>' +
        '<a class="link-row" href="' + u('nouveautes.html') + '">🆕 <span>Nouveautés</span><span class="end">→</span></a></div>' +
      '<div class="side-panel__section"><h4>Préférences rapides</h4>' +
        '<div class="pref-row"><span class="pref-row__label">Mode d’affichage<small>Sombre · Clair · Intermédiaire</small></span>' +
        '<div class="seg">' + P.THEMES.map(function (t, i) {
          return '<button type="button" data-theme-segment="' + t + '" aria-pressed="' + (p.theme === t) + '">' + ['🌙', '☀️', '◐'][i] + '</button>';
        }).join('') + '</div></div></div>' +
      '<button class="btn btn--ghost btn--block btn--sm" type="button" id="stiLogoutBtn">🚪 Se déconnecter</button>';
  }
  function ouvrirPanel() {
    var pan = $('#stiPanel'), fond = $('#stiPanelBackdrop');
    if (!pan) return;
    $('#stiPanelContent').innerHTML = panelHTML();
    pan.classList.add('is-open'); fond.classList.add('is-open');
    $('#stiPanelClose').addEventListener('click', fermerPanel);
    $('#stiLogoutBtn').addEventListener('click', function () { P.deconnecter(); });
    $$('#stiPanelContent [data-theme-segment]').forEach(function (b) {
      b.addEventListener('click', function () {
        P.mettreAJour('theme', b.getAttribute('data-theme-segment'));
        P.appliquerPreferences(); P.garderTheme(); ouvrirPanel();
      });
    });
    setTimeout(function () { $('#stiPanelClose').focus(); }, 60);
  }
  function fermerPanel() {
    var pan = $('#stiPanel'), fond = $('#stiPanelBackdrop');
    if (pan) pan.classList.remove('is-open');
    if (fond) fond.classList.remove('is-open');
  }
  function initPanel() {
    var fond = $('#stiPanelBackdrop');
    if (fond) fond.addEventListener('click', fermerPanel);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fermerPanel(); });
  }

  /* -------------------------------------------------------------------------
     9. RECHERCHE GLOBALE (Ctrl+K) + FILTRES PAR CATÉGORIE
     ---------------------------------------------------------------------- */
  function initRecherche() {
    var input = $('#stiSearchInput'), liste = $('#stiSearchResults');
    if (!input || !liste) return;
    function rendre(q) {
      q = (q || '').trim().toLowerCase();
      var items = RECHERCHE.filter(function (x) {
        return !q || (x.t + ' ' + x.s).toLowerCase().indexOf(q) !== -1;
      }).slice(0, 12);
      liste.innerHTML = items.length ? items.map(function (x, i) {
        return '<button class="palette__item" type="button" data-idx="' + RECHERCHE.indexOf(x) + '" ' + (i === 0 ? 'data-first="1"' : '') + '>' +
          '<span class="em">' + x.em + '</span><span><strong>' + esc(x.t) + '</strong><small>' + esc(x.s) + '</small></span></button>';
      }).join('') : '<div class="palette__empty">Aucun résultat. Essayez « SQL », « quiz », « vidéo »…</div>';
      $$('.palette__item', liste).forEach(function (b) {
        b.addEventListener('click', function () { ouvrirResultat(RECHERCHE[Number(b.getAttribute('data-idx'))]); });
      });
    }
    function ouvrirResultat(x) {
      if (!x) return;
      fermerModales();
      if (x.fn && typeof window[x.fn] === 'function') { try { window[x.fn](); return; } catch (e) {} }
      if (x.u) window.location.href = x.u;
    }
    input.addEventListener('input', function () { rendre(input.value); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); var n = $$('.palette__item', liste)[1] || $('.palette__item', liste); if (n) n.focus(); }
      if (e.key === 'Enter') { e.preventDefault(); var f = $('.palette__item', liste); if (f) f.click(); }
    });
    var bouton = $('#stiSearchBtn');
    if (bouton) bouton.addEventListener('click', function () { rendre(''); ouvrirModal('modalSearch'); setTimeout(function () { input.focus(); }, 60); });
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault(); rendre(''); ouvrirModal('modalSearch'); setTimeout(function () { input.focus(); input.select(); }, 60);
      }
    });
    rendre('');
  }

  function initFiltres() {
    var chips = $$('[data-filter]').filter(function (c) { return !c.closest('#glossaireFiltres'); });
    if (!chips.length) return;
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var f = chip.getAttribute('data-filter');
        chips.forEach(function (c) { c.classList.toggle('is-active', c === chip); });
        $$('.filterable').forEach(function (item) {
          var tech = item.getAttribute('data-tech') || 'all';
          item.classList.toggle('is-filtered-out', f !== 'all' && tech !== f && tech !== 'all');
        });
        var visibles = $$('.filterable:not(.is-filtered-out)').length;
        var empty = $('#filterEmpty'); if (empty) empty.hidden = visibles > 0;
      });
    });
  }

  /* -------------------------------------------------------------------------
     10. MODALES
     ---------------------------------------------------------------------- */
  var dernierFocus = null;
  function ouvrirModal(id) {
    var m = document.getElementById(id); if (!m) return;
    dernierFocus = document.activeElement;
    m.classList.add('is-open'); document.body.style.overflow = 'hidden';
    var f = m.querySelector('button,input,[href]'); if (f) setTimeout(function () { f.focus(); }, 50);
  }
  function fermerModales() {
    $$('.modal.is-open').forEach(function (m) { m.classList.remove('is-open'); });
    document.body.style.overflow = '';
    /* On arrête aussi la vidéo pour ne pas laisser le son en fond. */
    var v = $('#stiVideoWrap video'); if (v) { try { v.pause(); } catch (e) {} }
    if (dernierFocus && dernierFocus.focus) dernierFocus.focus();
  }
  function initModales() {
    document.addEventListener('click', function (e) {
      if (!e.target.closest) return;
      var open = e.target.closest('[data-modal-open]');
      if (open) { e.preventDefault(); ouvrirModal(open.getAttribute('data-modal-open')); return; }
      if (e.target.closest('[data-modal-close]')) { e.preventDefault(); fermerModales(); return; }
      if (e.target.classList.contains('modal')) fermerModales();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { fermerModales(); fermerMenu(); } });
  }

  /* -------------------------------------------------------------------------
     11. VIDÉOS : vignettes, une à la une, lecteur
     ---------------------------------------------------------------------- */
  function badgeMatiere(m) {
    var cls = { html5:'badge--html', css3:'badge--css', javascript:'badge--js', sql:'badge--sql', php:'badge--php' }[m];
    return '<span class="badge ' + cls + '">' + esc(MATIERES[m].nom) + '</span>';
  }
  function vignette(v) {
    var m = MATIERES[v.matiere];
    var visuelles = v.poster
      ? '<img src="' + u(v.poster) + '" alt="Aperçu de la vidéo ' + esc(v.titre) + '" loading="lazy">'
      : '<div class="video-thumb-fallback">' + m.emoji + '</div>';
    var vue = P.chargerProfil().videos.vues.indexOf(v.id) !== -1;
    return '<article class="video-card filterable' + (vue ? ' is-vue' : '') + '" data-tech="' + tech(v.matiere) + '" data-video-id="' + v.id + '" style="--vc:var(' + m.varc + ')" tabindex="0" role="button" aria-label="Lire la vidéo ' + esc(v.titre) + '">' +
      '<div class="video-card__thumb">' + visuelles +
        badgeMatiere(v.matiere).replace('class="badge', 'class="badge video-card__badge') +
        '<button class="play-btn play-btn--sm" type="button" tabindex="-1" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></button>' +
        '<span class="video-card__duration">' + esc(v.duree) + '</span></div>' +
      '<div class="video-card__body"><h3>' + esc(v.titre) + '</h3><p>' + esc(v.desc) + '</p>' +
        '<div class="video-card__foot"><span>🎬 .mp4' + (v.audio ? ' · 🔊 audio' : '') + '</span><span>▶ Regarder</span></div></div></article>';
  }
  function brancherVideos(contexte) {
    $$('[data-video-id]', contexte).forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        var card = b.closest('.video-card');
        lireVideo(b.getAttribute('data-video-id') || (card && card.getAttribute('data-video-id')));
      });
    });
    $$('.video-card', contexte).forEach(function (c) {
      c.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); lireVideo(c.getAttribute('data-video-id')); }
      });
    });
  }
  function initVideos() {
    var grille = $('#videosSlot');
    if (grille) grille.innerHTML = VIDEOS.map(vignette).join('');
    var une = $('#featureVideoSlot');
    if (une) {
      var v = VIDEO_UNE, m = MATIERES[v.matiere];
      une.innerHTML = '<article class="card feature-video reveal" style="--vc:var(' + m.varc + ')">' +
        '<div class="feature-video__poster">' + (v.poster ? '<img src="' + u(v.poster) + '" alt="Aperçu de la vidéo à la une">' : '') +
          '<button class="play-btn" type="button" data-video-id="' + v.id + '" aria-label="Lire ' + esc(v.titre) + '"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></button></div>' +
        '<div class="feature-video__body"><span class="eyebrow"><span class="dot"></span> Vidéo à la une</span>' +
          '<h2 style="font-size:var(--fs-xl)">' + esc(v.titre) + '</h2>' +
          '<p style="color:var(--text-muted);font-size:var(--fs-sm)">' + esc(v.desc) + '</p>' +
          '<div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:1.25rem">' + badgeMatiere(v.matiere) +
            '<span class="badge">⏱ ' + esc(v.duree) + '</span><span class="badge">🔊 Audio synchronisé</span></div>' +
          '<div><button class="btn btn--primary" type="button" data-video-id="' + v.id + '">▶ Regarder la vidéo</button> ' +
          '<a class="btn btn--ghost" href="' + u(m.cours) + '">Voir le cours</a></div></div></article>';
    }
    brancherVideos(document);
  }

  function lireVideo(id) {
    var v = videoParId(id); if (!v) return;
    var wrap = $('#stiVideoWrap'); if (!wrap) return;
    /* <video> avec controls, preload="metadata" et poster : chemin remplaçable. */
    wrap.innerHTML = '<video class="modal__video" controls preload="metadata" playsinline ' +
      (v.poster ? 'poster="' + u(v.poster) + '" ' : '') + 'src="' + u(v.src) + '">Votre navigateur ne lit pas la vidéo.</video>' +
      (v.audio ? '<p style="margin-top:.6rem"><a class="badge badge--gold" href="' + u(v.audio) + '">🔊 Écouter la version audio</a></p>' : '');
    $('#stiVideoTitle').textContent = v.titre;
    $('#stiVideoDesc').textContent = v.desc + ' — ' + MATIERES[v.matiere].nom + ' · ' + v.duree;
    ouvrirModal('modalVideo');
    var video = $('video', wrap);
    if (video) {
      video.addEventListener('ended', function () {
        P.marquerVideoVue(v.id, video.currentTime);
        P.mettreAJour('derniereLecture', {
          matiere: v.matiere, chapitre: v.titre, pourcent: 100, url: MATIERES[v.matiere].cours
        });
        toast('✅ Vidéo marquée comme vue');
      }, { once: true });
      /* play() renvoie une Promesse (ou rien sur certains navigateurs) : on garde. */
      var lecture = null;
      try { lecture = video.play(); } catch (e) {}
      if (lecture && typeof lecture.catch === 'function') lecture.catch(function () {});
    }
  }

  /* -------------------------------------------------------------------------
     12. CARTES MATIÈRES / OUTILS / QUIZ (contenu de l'accueil)
     ---------------------------------------------------------------------- */
  function initCartes() {
    var slot = $('#matieresSlot');
    if (slot) {
      var p = P.chargerProfil();
      slot.innerHTML = ORDRE.map(function (m, i) {
        var M = MATIERES[m];
        var pr = Math.round((p.progression[m] || 0) / 5 * 100);
        var lock = m === 'php' ? ' subject--locked' : '';
        return '<article class="card subject filterable reveal' + lock + '" data-tech="' + tech(m) + '" style="--vc:var(' + M.varc + ');--d:' + (i * .06) + 's">' +
          '<div class="subject__media"><span class="em">' + M.emoji + '</span><span class="badge subject__badge" style="border-color:var(' + M.varc + ');color:var(' + M.varc + ')">' + M.nom + '</span></div>' +
          '<div class="subject__body"><h3>' + M.emoji + ' ' + M.nom + '</h3><p class="subject__desc">' + esc(M.desc) + '</p>' +
          '<div class="subject__progress"><div class="row"><span>Progression du cours</span><span>' + pr + '%</span></div>' +
            '<div class="progress"><div class="progress__fill" data-progress="' + pr + '" style="--bar:linear-gradient(90deg,var(' + M.varc + '),var(--accent))"></div></div></div>' +
          '<div class="subject__foot"><a class="subject__link" href="' + u(M.cours) + '">Ouvrir la matière ' + svg('<path d="M5 12h14M13 6l6 6-6 6"/>') + '</a>' +
            '<span class="badge">' + M.badge + '</span></div>' +
          (m === 'php' ? '<span class="badge badge--gold" style="margin-top:.6rem">🔒 Réservé à la 4<sup>ème</sup> SI</span>' : '') +
          '</div></article>';
      }).join('');
    }
    var outils = $('#outilsSlot');
    if (outils) outils.innerHTML = OUTILS.map(function (o, i) {
      var attrs = o.url ? 'href="' + u(o.url) + '"' : 'href="#" data-outil-fn="' + o.fn + '"';
      return '<a class="card tool filterable reveal" ' + attrs + ' data-tech="' + o.tech + '" style="--tc:var(' + o.couleur + ');--d:' + (i % 4 * .05) + 's">' +
        '<span class="tool__icon">' + o.em + '</span><h3>' + esc(o.titre) + '</h3><p>' + esc(o.desc) + '</p><span class="tool__tag">Outil en ligne</span></a>';
    }).join('');
    $$('[data-outil-fn]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var fn = a.getAttribute('data-outil-fn');
        if (typeof window[fn] === 'function') window[fn]();
        else toast('🔧 Ouvre cet outil depuis la version classique du site.');
      });
    });
    var quiz = $('#quizSlot');
    if (quiz) quiz.innerHTML = QUIZ.map(function (q, i) {
      return '<a class="card quiz-card filterable reveal" href="' + u(q.url) + '" data-tech="' + q.tech + '" style="--qc:var(' + q.couleur + ');--d:' + (i * .05) + 's">' +
        '<span class="quiz-card__idx">' + q.n + '</span><span><h3>' + esc(q.titre) + '</h3><p>' + esc(q.desc) + '</p>' +
        '<span class="quiz-card__meta">' + q.meta.map(function (x) { return '<span class="badge">' + esc(x) + '</span>'; }).join('') + '</span></span></a>';
    }).join('');
  }

  /* -------------------------------------------------------------------------
     13. NOUVEAUTÉS (badge NOUVEAU, journal JSON existant)
     ---------------------------------------------------------------------- */
  function initNouveautes() {
    var slot = $('#newsSlot'); if (!slot) return;
    var p = P.chargerProfil();
    function afficher(liste) {
      var items = (liste || []).slice(0, 4);
      slot.innerHTML = items.length ? items.map(function (n) {
        var lu = p.nouveautesLues.indexOf(n.version) !== -1;
        return '<article class="news-item"><span class="em">' + esc(n.icone || '🆕') + '</span><div style="flex:1">' +
          '<h4>' + esc(n.titre) + ' ' + (lu ? '' : '<span class="badge badge--nouveau">NOUVEAU</span>') + '</h4>' +
          '<p>' + esc(String(n.resume || '').slice(0, 150)) + (String(n.resume || '').length > 150 ? '…' : '') + '</p></div>' +
          '<time>' + esc(n.date || '') + '</time></article>';
      }).join('') : '<div class="empty">Journal des nouveautés indisponible hors ligne. <a href="' + u('nouveautes.html') + '" style="color:var(--accent)">Voir l’historique →</a></div>';
      var lues = p.nouveautesLues.slice();
      items.forEach(function (n) { if (lues.indexOf(n.version) === -1) lues.push(n.version); });
      if (lues.length !== p.nouveautesLues.length) P.mettreAJour('nouveautesLues', lues.slice(-100));
    }
    fetch(u('assets/data/nouveautes.json')).then(function (r) { return r.json(); }).then(afficher).catch(function () { afficher([]); });
  }

  /* -------------------------------------------------------------------------
     14. TABLEAU DE BORD
     ---------------------------------------------------------------------- */
  function initDashboard() {
    var root = $('#dashboardRoot'); if (!root) return;
    var p = P.chargerProfil();
    var e = etat || P.etatAbonne(null);
    var totalRevises = ORDRE.reduce(function (n, m) { return n + (p.progression[m] || 0); }, 0);
    var lecture = p.derniereLecture || {};
    var vues = p.videos.vues || [];
    var derniereVideo = (p.videos.derniere && videoParId(p.videos.derniere.id)) || null;
    var moyenneQuiz = p.quiz.length ? Math.round(p.quiz.reduce(function (n, q) { return n + (q.score / (q.total || 20)) * 20; }, 0) / p.quiz.length * 10) / 10 : null;
    var moyenneNotes = p.notes.length ? Math.round(p.notes.reduce(function (n, x) { return n + Number(x.note || 0); }, 0) / p.notes.length * 10) / 10 : null;

    root.innerHTML = '' +
      '<div class="dash-hero reveal"><span class="avatar avatar--gold">' + esc(e.initiales) + '</span>' +
        '<div><h1>Bonjour ' + esc(e.affiche || 'à toi') + ' 👋</h1><p>Voici ta progression sur « Le web de A à Z » — Lycée Raféha · 3<sup>ème</sup> &amp; 4<sup>ème</sup> SI.</p></div>' +
        '<div class="dash-hero__end"><span class="badge badge--gold">⭐ Abonné' + (e.gold ? ' GOLD' : '') + '</span>' +
        '<span class="badge">' + totalRevises + ' / 25 chapitres révisés</span></div></div>' +

      '<div class="dash-grid">' +
        '<section class="dash-card dash-col-8 reveal"><div class="dash-card__head"><h2>▶️ Reprise de lecture</h2><a class="btn btn--ghost btn--sm" href="' + u('index.html#videos') + '">Toutes les vidéos</a></div>' +
          '<div class="dash-stat"><div class="ring" style="--pct:' + (lecture.pourcent || 0) + ';--ring-color:var(--accent)"><span class="ring__label">' + (lecture.pourcent || 0) + '%<small>lu</small></span></div>' +
          '<div class="dash-stat__txt"><strong>' + esc(lecture.chapitre || 'Commence par un cours') + '</strong>' +
          '<span>' + (lecture.matiere ? esc((MATIERES[lecture.matiere] || {}).nom || lecture.matiere) : 'Aucune lecture en cours') + '</span>' +
          '<div style="margin-top:.8rem;display:flex;gap:.5rem;flex-wrap:wrap"><a class="btn btn--primary btn--sm" href="' + u(lecture.url || 'cours/html5.html') + '">Reprendre</a>' +
          (derniereVideo ? '<button class="btn btn--ghost btn--sm" type="button" data-video-id="' + derniereVideo.id + '">▶ Reprendre la vidéo</button>' : '') + '</div></div></div></section>' +

        '<section class="dash-card dash-col-4 reveal"><h2>🎓 Ma cote / notes /20</h2>' +
          '<div class="dash-stat"><div class="ring" style="--pct:' + (moyenneNotes ? moyenneNotes * 5 : 0) + ';--ring-color:var(--gold)"><span class="ring__label">' + (moyenneNotes !== null ? moyenneNotes : '—') + '<small>/ 20</small></span></div>' +
          '<div class="dash-stat__txt"><strong>' + p.notes.length + ' copie(s)</strong><span>Notes envoyées au professeur</span></div></div>' +
          '<button class="btn btn--ghost btn--sm btn--block" type="button" data-outil-fn="ouvrirCarnetNotesSTI" style="margin-top:1rem">📒 Ouvrir mon carnet de notes</button></section>' +

        '<section class="dash-card dash-col-8 reveal"><h2>📈 Progression par matière</h2><div class="dash-progress-list">' +
          ORDRE.map(function (m) {
            var n = p.progression[m] || 0, M = MATIERES[m];
            return '<div><div class="row"><span>' + M.emoji + ' <a href="' + u(M.cours) + '" style="font-weight:700">' + M.nom + '</a></span><span>' + n + ' / 5 révisés</span></div>' +
              '<div class="progress"><div class="progress__fill" data-progress="' + (n / 5 * 100) + '" style="--bar:linear-gradient(90deg,var(' + M.varc + '),var(--accent))"></div></div></div>';
          }).join('') + '</div></section>' +

        '<section class="dash-card dash-col-4 reveal"><div class="dash-card__head"><h2>🧠 Mes quiz</h2><span class="badge">' + p.quiz.length + '</span></div>' +
          '<p style="color:var(--text-muted);font-size:var(--fs-sm)">Moyenne : <strong>' + (moyenneQuiz !== null ? moyenneQuiz + ' / 20' : 'pas encore de score') + '</strong></p>' +
          (p.quiz.length ? '<div class="list-rows" style="max-height:190px;overflow:auto">' + p.quiz.slice().reverse().slice(0, 6).map(function (q) {
            return '<div class="list-row"><span class="em">🧠</span><span class="list-row__txt"><strong>' + esc((MATIERES[q.matiere] || {}).nom || q.matiere) + '</strong><small>' + esc(q.date || '') + '</small></span><span class="list-row__end">' + q.score + '/' + q.total + '</span></div>';
          }).join('') + '</div>' : '<div class="empty">Lance un quiz pour voir tes scores ici.</div>') +
          '<a class="btn btn--primary btn--sm btn--block" href="' + u('revision-erreurs.html') + '" style="margin-top:1rem">🔁 Rejouer mes erreurs (' + P.totalErreurs() + ')</a></section>' +

        '<section class="dash-card dash-col-6 reveal"><div class="dash-card__head"><h2>🎥 Mes vidéos</h2><span class="badge badge--css">' + vues.length + ' / ' + VIDEOS.length + ' vues</span></div>' +
          '<div class="progress" style="margin-bottom:1rem"><div class="progress__fill" data-progress="' + Math.round(vues.length / VIDEOS.length * 100) + '"></div></div>' +
          '<div class="list-rows">' + VIDEOS.slice(0, 5).map(function (v) {
            var vue = vues.indexOf(v.id) !== -1;
            return '<button class="list-row" type="button" data-video-id="' + v.id + '" style="width:100%;text-align:start;cursor:pointer">' +
              '<span class="em">' + (vue ? '✅' : '▶️') + '</span><span class="list-row__txt"><strong>' + esc(v.titre) + '</strong><small>' + esc(v.duree) + ' · ' + esc(MATIERES[v.matiere].nom) + '</small></span>' +
              '<span class="list-row__end">' + (vue ? 'Vu' : 'À voir') + '</span></button>';
          }).join('') + '</div></section>' +

        '<section class="dash-card dash-col-6 reveal"><h2>⭐ Contenus réservés aux abonnés</h2>' +
          '<div class="list-rows">' +
            '<a class="link-row" href="' + u('quiz/tableaux.html') + '">📊 <span>Quiz des tableaux</span><span class="end">Ouvrir →</span></a>' +
            '<a class="link-row" href="' + u('cours/php.html') + '">🐘 <span>Cours PHP — 4<sup>ème</sup> SI</span><span class="end">Ouvrir →</span></a>' +
            '<a class="link-row" href="' + u('bac-pratique.html') + '">🎓 <span>Atelier Épreuve Pratique Bac</span><span class="end">Ouvrir →</span></a>' +
          '</div><h3 style="margin-top:1.5rem;font-size:var(--fs-base)">🆕 Nouveautés non lues</h3><div id="dashNews"></div></section>' +

        '<section class="dash-card dash-col-6 reveal"><h2>📒 Mes notes envoyées au professeur</h2>' +
          (p.notes.length ? '<table class="table"><thead><tr><th>Atelier</th><th>Note</th><th>Date</th></tr></thead><tbody>' +
            p.notes.slice().reverse().map(function (x) { return '<tr><td>' + esc(x.atelier) + '</td><td><strong>' + esc(x.note) + ' / 20</strong></td><td>' + esc(x.date) + '</td></tr>'; }).join('') +
            '</tbody></table>' : '<div class="empty">Aucune note pour le moment. Envoie une copie depuis l’Atelier Bac pour la retrouver ici.</div>') + '</section>' +

        '<section class="dash-card dash-col-6 reveal"><h2>⚙️ Préférences</h2>' +
          '<div class="pref-row"><span class="pref-row__label">Mode d’affichage<small>Sombre · Clair · Intermédiaire</small></span><div class="seg">' +
            P.THEMES.map(function (t, i) { return '<button type="button" data-theme-segment="' + t + '" aria-pressed="' + (p.theme === t) + '">' + ['🌙 Sombre', '☀️ Clair', '◐ Intermédiaire'][i] + '</button>'; }).join('') + '</div></div>' +
          '<div class="pref-row"><span class="pref-row__label">Langue<small>FR · EN · AR (RTL automatique)</small></span><div class="seg">' +
            P.LANGUES.map(function (l) { return '<button type="button" data-langue="' + l + '" aria-pressed="' + (p.langue === l) + '">' + l.toUpperCase() + '</button>'; }).join('') + '</div></div>' +
          '<div class="pref-row"><span class="pref-row__label">Taille du texte<small>Petit · Normal · Grand</small></span><div class="seg">' +
            Object.keys(P.TAILLES).map(function (t) { return '<button type="button" data-taille="' + t + '" aria-pressed="' + (p.tailleTexte === t) + '">' + t + '</button>'; }).join('') + '</div></div>' +
          '<div style="display:flex;gap:.6rem;flex-wrap:wrap;margin-top:1.25rem"><button class="btn btn--ghost btn--sm" type="button" id="dashReset">♻️ Réinitialiser mon profil</button>' +
          '<button class="btn btn--ghost btn--sm" type="button" id="dashLogout">🚪 Se déconnecter</button></div></section>' +
      '</div>';

    $$('#dashboardRoot [data-video-id]').forEach(function (b) {
      b.addEventListener('click', function () { lireVideo(b.getAttribute('data-video-id')); });
    });
    $$('#dashboardRoot [data-outil-fn]').forEach(function (b) {
      b.addEventListener('click', function () { var f = b.getAttribute('data-outil-fn'); if (typeof window[f] === 'function') window[f](); else toast('📒 Carnet de notes disponible sur la version classique.'); });
    });
    $$('#dashboardRoot [data-theme-segment]').forEach(function (b) {
      b.addEventListener('click', function () {
        P.mettreAJour('theme', b.getAttribute('data-theme-segment')); P.appliquerPreferences(); P.garderTheme(); initDashboard(); initThemes();
      });
    });
    $$('#dashboardRoot [data-langue]').forEach(function (b) {
      b.addEventListener('click', function () { P.mettreAJour('langue', b.getAttribute('data-langue')); P.appliquerPreferences(); traduire(); initDashboard(); });
    });
    $$('#dashboardRoot [data-taille]').forEach(function (b) {
      b.addEventListener('click', function () { P.mettreAJour('tailleTexte', b.getAttribute('data-taille')); P.appliquerPreferences(); initDashboard(); });
    });
    var reset = $('#dashReset'); if (reset) reset.addEventListener('click', function () {
      if (window.confirm('Réinitialiser toutes tes données locales (progression, quiz, vidéos) ?')) { P.reinitialiser(); P.appliquerPreferences(); initDashboard(); toast('Profil réinitialisé'); }
    });
    var logout = $('#dashLogout'); if (logout) logout.addEventListener('click', function () { P.deconnecter(); });

    var dn = $('#dashNews');
    if (dn) fetch(u('assets/data/nouveautes.json')).then(function (r) { return r.json(); }).then(function (liste) {
      var nonLues = (liste || []).filter(function (n) { return p.nouveautesLues.indexOf(n.version) === -1; }).slice(0, 3);
      dn.innerHTML = nonLues.length ? nonLues.map(function (n) {
        return '<a class="link-row" href="' + u(n.lien || 'nouveautes.html') + '">' + esc(n.icone || '🆕') + ' <span>' + esc(String(n.titre).slice(0, 48)) + '…</span><span class="badge badge--nouveau">NOUVEAU</span></a>';
      }).join('') : '<div class="empty">Tout est à jour ✅ — <a href="' + u('nouveautes.html') + '" style="color:var(--accent)">voir l’historique</a></div>';
    }).catch(function () { dn.innerHTML = '<div class="empty">Journal indisponible hors ligne.</div>'; });
  }

  /* -------------------------------------------------------------------------
     15. COQUILLE « UNE PAGE PAR MATIÈRE » (par-dessus les cours historiques)
     ---------------------------------------------------------------------- */
  function listeLiens(items) {
    if (!items || !items.length) return '<div class="empty">Aucun élément pour le moment.</div>';
    return '<div class="list-rows">' + items.map(function (x) {
      var href = u(x[2]).replace(/ /g, '%20'); /* fichiers avec espaces encodés */
      return '<a class="list-row" href="' + href + '" target="_blank" rel="noopener"><span class="em">' + x[0] + '</span>' +
        '<span class="list-row__txt"><strong>' + esc(x[1]) + '</strong><small>' + esc(String(x[2]).split('/').pop()) + '</small></span>' +
        '<span class="list-row__end">Ouvrir →</span></a>';
    }).join('') + '</div>';
  }
  function videosMatiere(m) {
    var liste = VIDEOS.filter(function (v) { return v.matiere === m; });
    return '<div class="videos-grid" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr))">' + liste.map(vignette).join('') + '</div>' +
      '<div class="alert alert--tip" style="margin-top:1.25rem"><strong>Chemin des vidéos :</strong> remplacez simplement <code>assets/videos/' + m + '-cours.mp4</code> pour mettre à jour le cours filmé (poster et audio facultatifs).</div>';
  }
  function initCourseShell() {
    var m = document.documentElement.getAttribute('data-sti-matiere');
    if (!m || !MATIERES[m] || $('#stiCourseShell')) return;
    var M = MATIERES[m], body = document.body;
    var mesVideos = VIDEOS.filter(function (v) { return v.matiere === m; });

    /* On enveloppe le contenu d'origine SANS déplacer les <script> déjà exécutés. */
    var panelCours = document.createElement('div');
    panelCours.className = 'sti-course-panel sti-course-panel--cours tab-panel';
    panelCours.id = 'panel-cours';
    panelCours.setAttribute('role', 'tabpanel');
    Array.prototype.slice.call(body.children).forEach(function (node) {
      if (/^(SCRIPT|STYLE|LINK|NOSCRIPT)$/.test(node.tagName)) return;
      /* Les éléments injectés par acces.js (roue, modales, barre mobile…) restent
         au niveau du <body> : ils ne doivent pas être enfermés dans un onglet. */
      if (node.id && node.id.indexOf('sti-') === 0) return;
      if (node.classList && Array.prototype.some.call(node.classList, function (c) { return c.indexOf('sti-') === 0; })) return;
      if (node.id === 'contact') return;
      if (node.classList && (node.classList.contains('site-header') || node.classList.contains('site-footer') ||
          node.classList.contains('modal') || node.classList.contains('side-panel') ||
          node.classList.contains('side-panel__backdrop') || node.classList.contains('mobile-menu') ||
          node.classList.contains('scroll-progress') || node.classList.contains('to-top') ||
          node.id === 'stiToast' || node.id === 'stiLegacyHero')) return;
      panelCours.appendChild(node);
    });

    var shell = el('<div class="container sti-course-shell" id="stiCourseShell"></div>');
    shell.innerHTML =
      '<div class="sti-course-head"><span class="badge" style="border-color:var(' + M.varc + ');color:var(' + M.varc + ')">' + M.emoji + ' ' + M.nom + '</span>' +
        '<h1>' + M.nom + ' — cours, exercices, annexes & vidéos</h1>' +
        '<a class="btn btn--ghost btn--sm" href="' + u('index.html#matieres') + '">← Toutes les matières</a></div>' +
      '<div class="sti-course-tabs tabs" id="stiCourseTabs" role="tablist" aria-label="Sections de la matière"><div class="tabs__thumb" id="stiCourseThumb"></div>' +
        '<button class="tab" type="button" role="tab" data-panel="panel-cours" aria-selected="true">📘 Cours</button>' +
        '<button class="tab" type="button" role="tab" data-panel="panel-exercices" aria-selected="false" id="tabExercices">✍️ Exercices</button>' +
        '<button class="tab" type="button" role="tab" data-panel="panel-annexes" aria-selected="false">📎 Annexes</button>' +
        '<button class="tab" type="button" role="tab" data-panel="panel-videos" aria-selected="false">🎥 Vidéos (' + mesVideos.length + ')</button>' +
      '</div>' +
      '<div id="panel-exercices" class="sti-course-panel tab-panel" role="tabpanel" hidden>' +
        '<h2>✍️ Exercices & corrigés — ' + M.nom + '</h2><p style="color:var(--text-muted);font-size:var(--fs-sm)">Tous les exercices historiques restent accessibles. Les anciennes pages d’index renvoient désormais vers cet onglet.</p>' +
        listeLiens(EXERCICES[m]) + '</div>' +
      '<div id="panel-annexes" class="sti-course-panel tab-panel" role="tabpanel" hidden>' +
        '<h2>📎 Annexes & fiches — ' + M.nom + '</h2>' + listeLiens(ANNEXES[m]) + '</div>' +
      '<div id="panel-videos" class="sti-course-panel tab-panel" role="tabpanel" hidden>' +
        '<h2>🎥 Vidéos explicatives — ' + M.nom + '</h2>' + videosMatiere(m) + '</div>';

    var footer = $('.site-footer');
    if (footer) body.insertBefore(shell, footer); else body.appendChild(shell);
    shell.appendChild(panelCours);

    var tabs = $$('.tab', $('#stiCourseTabs')), thumb = $('#stiCourseThumb');
    function deplacer(t) {
      if (!thumb || !t) return;
      thumb.style.width = t.offsetWidth + 'px';
      thumb.style.transform = 'translateX(' + Math.max(t.offsetLeft - 6, 0) + 'px)';
    }
    function activer(t, changerHash) {
      tabs.forEach(function (x) {
        var ok = x === t;
        x.setAttribute('aria-selected', String(ok));
        var pan = document.getElementById(x.getAttribute('data-panel'));
        if (pan) pan.hidden = !ok;
      });
      deplacer(t);
      if (changerHash && t.id === 'tabExercices') history.replaceState(null, '', '#exercices');
    }
    tabs.forEach(function (t) { t.addEventListener('click', function () { activer(t, true); }); });
    requestAnimationFrame(function () { deplacer(tabs[0]); });
    window.addEventListener('resize', function () { deplacer($('.tab[aria-selected="true"]', $('#stiCourseTabs')) || tabs[0]); });
    brancherVideos($('#panel-videos'));
    if (location.hash === '#exercices') activer($('#tabExercices'), false);
    window.addEventListener('hashchange', function () { if (location.hash === '#exercices') activer($('#tabExercices'), false); });
  }

  /* Petit bandeau de titre pour les autres pages historiques (quiz, outils…) */
  function initLegacyHero() {
    if (document.documentElement.getAttribute('data-sti-matiere')) return;
    var titre = document.documentElement.getAttribute('data-sti-titre');
    if (!titre || $('#stiLegacyHero')) return;
    var hero = el('<div class="container" id="stiLegacyHero" style="padding-top:1.75rem;padding-bottom:.5rem">' +
      '<div style="display:flex;align-items:center;gap:.75rem;flex-wrap:wrap"><span class="badge badge--css">' + esc(titre) + '</span>' +
      '<a class="btn btn--ghost btn--sm" href="' + u('index.html') + '">← Accueil</a>' +
      '<a class="btn btn--ghost btn--sm" href="' + u('dashboard.html') + '">📊 Tableau de bord</a></div></div>');
    var header = $('#siteHeader');
    if (header && header.nextElementSibling) document.body.insertBefore(hero, header.nextElementSibling);
    else document.body.insertBefore(hero, document.body.firstElementChild);
  }

  /* -------------------------------------------------------------------------
     16. GLOSSAIRE TRILINGUE (données extraites de l'ancienne page)
     ---------------------------------------------------------------------- */
  function initGlossaire() {
    var grille = $('#glossaireGrille'); if (!grille || !window.STI_TERMES) return;
    var terme = '', matiere = 'all', champ = $('#glossaireSearch');
    function rendre() {
      var q = terme.trim().toLowerCase();
      var items = window.STI_TERMES.filter(function (t) {
        return (matiere === 'all' || t.m === matiere) && (!q || (t.fr + ' ' + t.en + ' ' + t.ar + ' ' + t.d).toLowerCase().indexOf(q) !== -1);
      });
      grille.innerHTML = items.length ? items.map(function (t) {
        var M = MATIERES[t.m] || MATIERES.html5;
        return '<article class="card reveal" style="--vc:var(' + M.varc + ')"><div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:.75rem">' +
          badgeMatiere(t.m) + '<span class="badge">FR · EN · AR</span></div>' +
          '<h3 style="font-size:1.15rem">' + esc(t.fr) + '</h3>' +
          '<p style="font-size:var(--fs-sm);color:var(--text-muted);margin-bottom:.4rem"><strong>EN :</strong> ' + esc(t.en) + '</p>' +
          '<p style="font-size:var(--fs-md);margin-bottom:.6rem" lang="ar" dir="rtl">' + esc(t.ar) + '</p>' +
          '<p style="font-size:var(--fs-xs);color:var(--text-dim);margin:0">' + t.d + '</p></article>';
      }).join('') : '<div class="empty">Aucun terme ne correspond. Essayez un autre mot (français, anglais ou arabe).</div>';
      var c = $('#glossaireCount'); if (c) c.textContent = items.length + ' terme(s)';
    }
    if (champ) champ.addEventListener('input', function () { terme = champ.value; rendre(); });
    $$('#glossaireFiltres [data-filter]').forEach(function (b) {
      b.addEventListener('click', function () {
        $$('#glossaireFiltres [data-filter]').forEach(function (x) { x.classList.toggle('is-active', x === b); });
        matiere = b.getAttribute('data-filter'); rendre();
      });
    });
    rendre();
  }

  /* -------------------------------------------------------------------------
     17. COMPORTEMENTS GÉNÉRIQUES (scroll, onglets, accordéon, compteurs…)
     ---------------------------------------------------------------------- */
  function fermerMenu() {
    var m = $('#mobileMenu'), b = $('#burger');
    if (m) m.classList.remove('is-open');
    if (b) b.setAttribute('aria-expanded', 'false');
  }
  function initGenerique() {
    document.documentElement.classList.add('js');
    var barre = $('#scrollProgress'), header = $('#siteHeader'), toTop = $('#toTop'), tick = false;
    function scroll() {
      var y = window.pageYOffset || document.documentElement.scrollTop;
      var h = document.documentElement.scrollHeight - window.innerHeight;
      if (barre) barre.style.transform = 'scaleX(' + (h > 0 ? y / h : 0) + ')';
      if (header) header.classList.toggle('is-stuck', y > 12);
      if (toTop) toTop.classList.toggle('is-visible', y > 520);
      tick = false;
    }
    window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(scroll); } }, { passive: true });
    scroll();
    if (toTop) toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: REDUIT ? 'auto' : 'smooth' }); });
    var burger = $('#burger'), menu = $('#mobileMenu');
    if (burger && menu) {
      burger.addEventListener('click', function () { var o = menu.classList.toggle('is-open'); burger.setAttribute('aria-expanded', String(o)); });
      $$('a', menu).forEach(function (a) { a.addEventListener('click', fermerMenu); });
    }
    var ici = location.pathname.split('/').pop() || 'index.html';
    $$('.nav a').forEach(function (a) {
      if (a.getAttribute('href').indexOf(ici) !== -1 && ici !== 'index.html') a.classList.add('is-active');
    });
    /* Onglets génériques */
    $$('.tabs:not(#stiCourseTabs)').forEach(function (root) {
      var tabs = $$('.tab', root), thumb = $('.tabs__thumb', root);
      function move(t) { if (!thumb) return; thumb.style.width = t.offsetWidth + 'px'; thumb.style.transform = 'translateX(' + Math.max(t.offsetLeft - 6, 0) + 'px)'; }
      function go(t) {
        tabs.forEach(function (x) {
          var ok = x === t; x.setAttribute('aria-selected', String(ok));
          var pan = document.getElementById(x.getAttribute('aria-controls'));
          if (pan) pan.hidden = !ok;
        });
        move(t);
      }
      tabs.forEach(function (t) { t.addEventListener('click', function () { go(t); }); });
      var premier = $('.tab[aria-selected="true"]', root) || tabs[0];
      if (premier) requestAnimationFrame(function () { go(premier); });
      window.addEventListener('resize', function () { var a = $('.tab[aria-selected="true"]', root); if (a) move(a); });
    });
    /* Accordéon */
    $$('.acc-item').forEach(function (item) {
      var btn = $('.acc-btn', item), pan = $('.acc-panel', item);
      if (!btn || !pan) return;
      if (item.classList.contains('is-open')) pan.style.maxHeight = pan.scrollHeight + 'px';
      btn.addEventListener('click', function () {
        var ouvert = item.classList.contains('is-open');
        $$('.acc-item').forEach(function (o) {
          o.classList.remove('is-open'); $('.acc-panel', o).style.maxHeight = '0px'; $('.acc-btn', o).setAttribute('aria-expanded', 'false');
        });
        item.classList.toggle('is-open', !ouvert);
        btn.setAttribute('aria-expanded', String(!ouvert));
        pan.style.maxHeight = ouvert ? '0px' : pan.scrollHeight + 'px';
      });
    });
    /* Flashcards */
    $$('.flashcard').forEach(function (c) {
      function flip() { c.classList.toggle('is-flipped'); }
      c.addEventListener('click', flip);
      c.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });
    });
    /* Compteurs animés */
    function compte(n) {
      var cible = parseFloat(n.getAttribute('data-count')) || 0, suffixe = n.getAttribute('data-suffix') || '';
      var fmt = new Intl.NumberFormat('fr-FR');
      if (REDUIT) { n.textContent = fmt.format(cible) + suffixe; return; }
      var debut = performance.now(), duree = 1400;
      function step(t) {
        var p = Math.min((t - debut) / duree, 1), e = 1 - Math.pow(1 - p, 3);
        n.textContent = fmt.format(Math.round(cible * e)) + suffixe;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    var observe = function (elements, fn, ratio) {
      if (!('IntersectionObserver' in window)) { elements.forEach(fn); return; }
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (en) { if (en.isIntersecting) { fn(en.target); io.unobserve(en.target); } });
      }, { threshold: ratio || .12 });
      elements.forEach(function (x) { io.observe(x); });
    };
    observe($$('.reveal,.reveal-scale,.stat'), function (x) { x.classList.add('is-visible'); }, .12);
    observe($$('[data-count]'), compte, .5);
    observe($$('.progress__fill[data-progress]'), function (x) { x.style.width = (Number(x.getAttribute('data-progress')) || 0) + '%'; }, .3);
    /* Copie des blocs de code */
    $$('.codeblock').forEach(function (b) {
      var bar = $('.codeblock__bar', b), pre = $('pre', b); if (!bar || !pre) return;
      var btn = el('<button class="codeblock__copy" type="button">Copier</button>');
      bar.appendChild(btn);
      btn.addEventListener('click', function () {
        var txt = pre.innerText;
        var ok = function () { btn.textContent = 'Copié !'; setTimeout(function () { btn.textContent = 'Copier'; }, 1800); };
        if (navigator.clipboard) navigator.clipboard.writeText(txt).then(ok).catch(ok);
        else ok();
      });
    });
    /* Halo des cartes au survol */
    if (!REDUIT && window.matchMedia && window.matchMedia('(hover:hover)').matches) {
      $$('.card').forEach(function (c) {
        c.addEventListener('mousemove', function (e) {
          var r = c.getBoundingClientRect();
          c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
          c.style.setProperty('--my', (e.clientY - r.top) + 'px');
        });
      });
    }
    var y = $('#year'); if (y) y.textContent = new Date().getFullYear();
  }

  /* -------------------------------------------------------------------------
     18. INSTALLATION PWA
     ---------------------------------------------------------------------- */
  var promptInstall = null;
  function initInstall() {
    window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); promptInstall = e; });
    var btn = $('#stiInstallBtn');
    if (btn) btn.addEventListener('click', function () {
      if (promptInstall) { promptInstall.prompt(); promptInstall.userChoice.then(function () { promptInstall = null; }); }
      else ouvrirModal('modalInstall');
    });
    var go = $('#stiInstallGo');
    if (go) go.addEventListener('click', function () {
      if (promptInstall) promptInstall.prompt();
      else toast('Menu du navigateur → « Installer l’application ».');
    });
  }

  /* -------------------------------------------------------------------------
     19. PROGRESSION « X / 5 RÉVISÉS » (mémorisée à chaque entrée dans un cours)
     ---------------------------------------------------------------------- */
  function initProgression() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href*="cours/"]');
      if (!a) return;
      var m = (a.getAttribute('href').match(/(html5|css3|javascript|sql|php)/) || [])[1];
      if (!m) return;
      var p = P.chargerProfil();
      P.mettreAJour('derniereLecture', {
        matiere: m, chapitre: 'Cours ' + MATIERES[m].nom,
        pourcent: Math.max(p.derniereLecture.pourcent || 0, 10), url: a.getAttribute('href')
      });
    });
  }

  /* -------------------------------------------------------------------------
     20. INITIALISATION
     ---------------------------------------------------------------------- */
  function init() {
    injecterCoquille();
    P.appliquerPreferences(); P.garderTheme(); traduire();
    initGenerique();
    initThemes(); initModales(); initRecherche(); initFiltres();
    initBadge(); initPanel(); initInstall();
    initVideos(); initCartes(); initNouveautes(); initProgression();
    initCourseShell(); initLegacyHero(); initGlossaire(); initDashboard();
    window.addEventListener('sti:profil', traduire);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
