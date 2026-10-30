/* STI V2.0 — script principal unifié · Lycée Raféha
   Sans framework ni ressources externes ; stockage via STIProfil. */
(function (global, document) {
  "use strict";

  /* 1. Utilitaires */
  function echapperHtml(valeur) {
    return String(valeur == null ? "" : valeur)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /**
   * Calcule le préfixe relatif vers la racine du site ("./" ou "../")
   * afin que tous les liens fonctionnent aussi bien sur index.html que dans cours/ ou quiz/.
   */
  function obtenirPrefixeRacine() {
    var chemin = String((global.location && global.location.pathname) || "").replace(/\\/g, "/");
    if (/\/(?:cours|quiz|exercices)\/[^/]*$/i.test(chemin)) {
      return "../";
    }
    return "./";
  }

  function estAutorise4SI() {
    return Boolean(
      document.documentElement &&
      document.documentElement.classList.contains("sti-4si-autorise")
    );
  }

  function formaterDureeSecondes(sec) {
    var total = Math.max(0, Math.floor(Number(sec) || 0));
    var m = Math.floor(total / 60);
    var s = total % 60;
    return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
  }

  /**
   * Génère un poster SVG vectoriel encodé en data URI (zéro image externe)
   * utilisé à la fois dans les cartes vidéos et dans l'attribut `poster` de <video>.
   */
  function creerPosterSvgDataUri(titre, sousTitre, couleurHex, codeExtrait) {
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360">' +
      '<defs>' +
      '<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="#0d1526"/>' +
      '<stop offset="100%" stop-color="#172542"/>' +
      "</linearGradient>" +
      '<radialGradient id="gl" cx="82%" cy="18%" r="60%">' +
      '<stop offset="0%" stop-color="' + couleurHex + '" stop-opacity="0.42"/>' +
      '<stop offset="100%" stop-color="' + couleurHex + '" stop-opacity="0"/>' +
      "</radialGradient>" +
      "</defs>" +
      '<rect width="640" height="360" fill="url(#bg)"/>' +
      '<rect width="640" height="360" fill="url(#gl)"/>' +
      '<rect x="28" y="26" width="584" height="308" rx="18" fill="none" stroke="' + couleurHex + '" stroke-opacity="0.35" stroke-width="2"/>' +
      '<rect x="48" y="48" width="136" height="30" rx="15" fill="' + couleurHex + '" fill-opacity="0.22"/>' +
      '<text x="116" y="68" text-anchor="middle" fill="#f8fafc" font-family="Inter,Arial,sans-serif" font-size="13" font-weight="800">' +
      echapperHtml(sousTitre) +
      "</text>" +
      '<text x="48" y="132" fill="#f8fafc" font-family="Inter,Arial,sans-serif" font-size="27" font-weight="800">' +
      echapperHtml(titre) +
      "</text>" +
      '<rect x="48" y="166" width="544" height="126" rx="12" fill="#070d19" stroke="#334155" stroke-width="1.2"/>' +
      '<text x="68" y="206" fill="' + couleurHex + '" font-family="monospace" font-size="15" font-weight="700">' +
      echapperHtml(codeExtrait || "/* STI V2.0 — Lycée Raféha */") +
      "</text>" +
      '<text x="68" y="238" fill="#94a3b8" font-family="monospace" font-size="13">STI V2.0 · Le web de A à Z · Aymen Essouyah</text>' +
      '<text x="68" y="268" fill="#cbd5e1" font-family="Inter,Arial,sans-serif" font-size="13" font-weight="600">Vidéo explicative (.mp4) &amp; écoute synchronisée</text>' +
      "</svg>";
    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
  }

  /* 2. Catalogue des matières */
  var MATIERES = {
    html5: {
      id: "html5",
      nom: "HTML5",
      icone: "🌐",
      badgeClasse: "badge-html",
      couleur: "#ff783c",
      nbVideos: 3,
      urlCours: "cours/html5.html",
      urlQuiz: "quiz/html-css.html",
      urlAudio: "assets/audio/html5-cours.mp3",
      urlAnnexe: "documents/annexes/annexe-html5.pdf.html#annexe-html5",
      urlAnnexePdf: "documents/annexes/annexe-html5.pdf",
      resume: "Structure sémantique, formulaires contrôlés, tableaux fusionnés, datalist et multimédia.",
      exercices: [
        { titre: "TP Formulaire d'inscription HTML5", niveau: "Débutant", enonce: "exercices/html-css/formulaire-inscription.pdf.html", corrige: "projets/formulaire-inscription/cvFleurs.html" },
        { titre: "TP Emploi du temps (rowspan / colspan)", niveau: "Intermédiaire", enonce: "exercices/html-css/emploi-temps/emploidutemps.html", corrige: "exercices/html-css/emploi-temps/emploidutemps.html" },
        { titre: "Projet Explore Tunisie (Structure & Médias)", niveau: "Avancé", enonce: "exercices/html-css/Explore_Tunisie/Explore_Tunisie_Enonce.pdf.html", corrige: "exercices/html-css/Explore_Tunisie/Explore_Tunisie_Solution/ExploreTunisie/index.html" }
      ]
    },
    css3: {
      id: "css3",
      nom: "CSS3",
      icone: "🎨",
      badgeClasse: "badge-css",
      couleur: "#38bdf8",
      nbVideos: 7,
      urlCours: "cours/css3.html",
      urlQuiz: "quiz/html-css.html",
      urlAudio: "assets/audio/css3-cours.mp3",
      urlAnnexe: "documents/annexes/annexe-css3.pdf.html",
      urlAnnexePdf: "documents/annexes/annexe-css3.pdf",
      resume: "Sélecteurs, modèle de boîte, Flexbox, positionnement, ombres, transitions et @keyframes.",
      exercices: [
        { titre: "TP 1 — Sélecteurs, typographie et boîtes CSS3", niveau: "Débutant", enonce: "exercices/html-css/TP1-css.pdf.html", corrige: "exercices/html-css/box-shadow-text-shadow-css3.html" },
        { titre: "TP 2 — Positionnement CSS3", niveau: "Intermédiaire", enonce: "exercices/html-css/TP2-css.pdf.html", corrige: "exercices/html-css/TP2/tp2corrposition.html" },
        { titre: "TP 3 & Activités — Transitions et animations", niveau: "Avancé", enonce: "exercices/html-css/TP3-css.pdf.html", corrige: "exercices/html-css/activite1-2-position-animation-css3.pdf.html" }
      ]
    },
    javascript: {
      id: "javascript",
      nom: "JavaScript",
      icone: "⚡",
      badgeClasse: "badge-js",
      couleur: "#facc15",
      nbVideos: 5,
      urlCours: "cours/javascript.html",
      urlQuiz: "quiz/javascript.html",
      urlAudio: "assets/audio/javascript-cours.mp3",
      urlAnnexe: "documents/annexes/annexe-javascript.pdf.html",
      urlAnnexePdf: "documents/annexes/annexe-javascript.pdf",
      resume: "Variables let/const, fonctions de contrôle Bac, DOM, événements, chaînes, tableaux et Date.",
      exercices: [
        { titre: "Série 1 — Variables, types et opérateurs", niveau: "Débutant", enonce: "exercices/javascript/Tp1-js.html", corrige: "exercices/javascript/Tp1-Correction-js.html" },
        { titre: "Série 2 — Événements et manipulation du DOM", niveau: "Intermédiaire", enonce: "exercices/javascript/Tp2-js.html", corrige: "exercices/javascript/Tp2-Correction-js.html" },
        { titre: "Série 3 — Objets Date, String, Array et Math", niveau: "Avancé", enonce: "exercices/javascript/Tp3-js.html", corrige: "exercices/javascript/Tp3-Correction-js.html" },
        { titre: "Série 4 — Objets, propriétés et fonctions prédéfinies", niveau: "Avancé", enonce: "exercices/javascript/Tp4-js.html", corrige: "exercices/javascript/Tp4-Correction-js.html" },
        { titre: "Série 5 — Objet String", niveau: "Avancé", enonce: "exercices/javascript/Tp5-js.html", corrige: "exercices/javascript/Tp5-Correction-js.html" },
        { titre: "Série 6 — TP Train : réserver un billet", niveau: "Projet complet", enonce: "exercices/javascript/TP Train/Enonce_TP_TrainTN_JavaScript.html", corrige: "exercices/javascript/TP Train/TP_Train_JavaScript_cORRECTION.html", ressources: "exercices/javascript/TP Train/Ressource_eleve_TrainTN.html", dossier: "exercices/javascript/TP Train/index.html" },
        { titre: "Les 37 Défis JavaScript interactifs", niveau: "Défis Bac", enonce: "exercices/javascript/js-37-defis-tt.html", corrige: "exercices/javascript/js-37-defis-tt.html" }
      ]
    },
    sql: {
      id: "sql",
      nom: "SQL",
      icone: "🗄️",
      badgeClasse: "badge-sql",
      couleur: "#34d399",
      nbVideos: 4,
      urlCours: "cours/sql.html",
      urlQuiz: "quiz/sql.html",
      urlAudio: "assets/audio/sql-cours.mp3",
      urlAnnexe: "documents/annexes/annexe-sql.pdf.html",
      urlAnnexePdf: "documents/annexes/annexe-sql.pdf",
      resume: "LDD, LMD, contraintes d'intégrité, SELECT, jointures, GROUP BY / HAVING et sous-requêtes.",
      exercices: [
        { titre: "Série 1 — Création de tables et LMD", niveau: "Débutant", enonce: "exercices/sql/Tp1-bd.html", corrige: "exercices/sql/Tp1-Correction-bd.html" },
        { titre: "Série 2 — Requêtes SELECT et filtres", niveau: "Intermédiaire", enonce: "exercices/sql/Tp2-bd.html", corrige: "exercices/sql/Tp2-Correction-bd.html" },
        { titre: "Jointures, GROUP BY et fonctions de dates", niveau: "Avancé", enonce: "exercices/sql/Tp-date-ssr-j-gp-bd.html", corrige: "exercices/sql/Tp-date-ssr-j-gp-correction-bd.html" },
        { titre: "Atelier SQL 3 fenêtres & Guide de requête", niveau: "Interactif", enonce: "exercices/sql/atelier_sql_3_fenetres.html", corrige: "exercices/sql/CommentConstruireunerequêteSQL.html" }
      ]
    },
    php: {
      id: "php",
      nom: "PHP",
      icone: "🐘",
      badgeClasse: "badge-php",
      couleur: "#a78bfa",
      nbVideos: 3,
      reserve4si: true,
      urlCours: "cours/php.html",
      urlQuiz: "quiz/php.html",
      urlAudio: "assets/audio/php-cours.mp3",
      urlAnnexe: "documents/annexes/annexe-php.pdf.html",
      urlAnnexePdf: "documents/annexes/annexe-php.pdf",
      resume: "Traitement $_POST / $_GET, tableaux associatifs, fonctions et accès MySQLi procédural.",
      exercices: [
        { titre: "Série 1 — Syntaxe PHP et variables", niveau: "Débutant", enonce: "exercices/php/Tp1-php.html", corrige: "exercices/php/Tp1-Correction-php.html" },
        { titre: "Série 2 & 3 — Formulaires et tableaux PHP", niveau: "Intermédiaire", enonce: "exercices/php/Tp2-php.html", corrige: "exercices/php/Tp2-Correction-php.html" },
        { titre: "Série 4 & 5 — Connexion MySQLi et requêtes", niveau: "Avancé", enonce: "exercices/php/Tp4-php.html", corrige: "exercices/php/Tp4-Correction-php.html" },
        { titre: "Débogage & Remise en ordre PHP Bac", niveau: "Spécial Bac", enonce: "exercices/php/debogage-php-bac.html", corrige: "exercices/php/ordre-php-bac.html" }
      ]
    }
  };

  /**
   * Les 18 vidéos présentées ici (.mp4), et non tous les médias du site :
   * HTML5 (4) · CSS3 (8) · JavaScript (2) · SQL (4, dont 2 Bac) · PHP (3 Bac).
   * Les variantes mobiles, autres séries et leçons interactives ne sont pas comptées.
   * Noms et durées correspondent aux fichiers présents dans le dépôt.
   */
  var CATALOGUE_VIDEOS = [
    {
      id: "html5-cours",
      matiere: "html5",
      nomMatiere: "HTML5",
      badgeClasse: "badge-html",
      couleur: "#ff783c",
      titre: "HTML5 — Structure, formulaires & tableaux",
      dureeTexte: "07:36",
      srcPrincipal: "assets/videos/html5-cours.mp4",
      srcSecours: "assets/videos/html5-cours.mp4",
      urlCours: "cours/html5.html#videos",
      codeApercu: '<form action="ajout.php" method="post">'
    },
    {
      id: "css3-cours",
      matiere: "css3",
      nomMatiere: "CSS3",
      badgeClasse: "badge-css",
      couleur: "#38bdf8",
      titre: "CSS3 — Sélecteurs, Flexbox & transitions",
      dureeTexte: "11:24",
      srcPrincipal: "assets/videos/css3-cours-v9-sync.mp4",
      srcSecours: "assets/videos/css3-cours-v9-sync.mp4",
      sousTitres: "assets/subtitles/css3-cours-v9-sync-fr.vtt",
      urlCours: "cours/css3.html#videos",
      codeApercu: ".grille { display: flex; gap: 16px; }"
    },
    {
      id: "css3-display",
      matiere: "css3", nomMatiere: "CSS3", badgeClasse: "badge-css", couleur: "#38bdf8",
      titre: "CSS3 — Display : la démo animée", dureeTexte: "00:05",
      srcPrincipal: "assets/videos/displayanim.mp4", urlCours: "cours/css3.html#videos",
      codeApercu: "display: inline-block;"
    },
    {
      /* v526 : correction vidéo du TP Train, Série 6 JavaScript. */
      id: "tp-train-serie6",
      matiere: "javascript",
      nomMatiere: "JavaScript",
      badgeClasse: "badge-js",
      couleur: "#f7df1e",
      titre: "TP Train — correction détaillée (Série 6)",
      dureeTexte: "7:08",
      srcPrincipal: "assets/videos/tp-train-serie6.mp4",
      srcSecours: "assets/videos/tp-train-serie6.mp4",
      urlCours: "cours/javascript.html#videos",
      codeApercu: "function prix() { let t = parseFloat(lire(\"trajet\")); }"
    },
    {
      /* v527 : capsule « Les 37 Défis » — Tableau, Aléas & Captchas, Média. */
      id: "defis37-tableau-aleas-media",
      matiere: "javascript",
      nomMatiere: "JavaScript",
      badgeClasse: "badge-js",
      couleur: "#f7df1e",
      titre: "Les 37 Défis — Tableau, Aléas & Captchas, Média",
      dureeTexte: "10:55",
      srcPrincipal: "assets/videos/defis37-tableau-aleas-media.mp4",
      srcSecours: "assets/videos/defis37-tableau-aleas-media.mp4",
      sousTitres: "assets/subtitles/defis37-tableau-aleas-media-fr.vtt",
      urlCours: "cours/javascript.html#videos",
      codeApercu: "Math.floor(Math.random() * (max - min + 1)) + min"
    },
    {
      /* v543 : capsule « Les boucles » — les trois boucles et comment choisir. */
      id: "boucle-pour",
      matiere: "javascript",
      nomMatiere: "JavaScript",
      badgeClasse: "badge-js",
      couleur: "#f7df1e",
      titre: "Les boucles — Pour, Répéter…jusqu'à, Tant que",
      dureeTexte: "16:00",
      srcPrincipal: "assets/videos/BouclePour-v547.mp4",
      srcSecours: "assets/videos/BouclePour-v547.mp4",
      sousTitres: "assets/subtitles/BouclePour-fr-v547.vtt",
      urlCours: "cours/javascript.html#videos",
      codeApercu: "for (let i = 0; i <= 3; i++) { S = S + T[i]; }"
    },
    {
      /* v548 : capsule « La console, les variables et les types ». */
      id: "console-variables",
      matiere: "javascript",
      nomMatiere: "JavaScript",
      badgeClasse: "badge-js",
      couleur: "#f7df1e",
      titre: "La console, les variables et les types",
      dureeTexte: "11:31",
      srcPrincipal: "assets/videos/ConsoleVariables-v548.mp4",
      srcSecours: "assets/videos/ConsoleVariables-v548.mp4",
      sousTitres: "assets/subtitles/ConsoleVariables-fr-v548.vtt",
      urlCours: "cours/javascript.html#videos",
      codeApercu: "const notes = [12, 15, 9]; console.log(notes[0]);"
    },
    {
      id: "css-positionnement",
      matiere: "css3",
      nomMatiere: "CSS3",
      badgeClasse: "badge-css",
      couleur: "#38bdf8",
      titre: "CSS3 Pas à pas — Positionnement & mise en page",
      dureeTexte: "05:58",
      srcPrincipal: "assets/videos/css-positionnement.mp4",
      srcSecours: "assets/videos/css-positionnement.mp4",
      urlCours: "cours/css3.html#videos",
      codeApercu: "position: relative; top: 0; z-index: 10;"
    },
    {
      id: "css-animee",
      matiere: "css3",
      nomMatiere: "CSS3",
      badgeClasse: "badge-css",
      couleur: "#38bdf8",
      titre: "CSS3 Pas à pas — Décoration, ombres & bordures",
      dureeTexte: "05:01",
      srcPrincipal: "assets/videos/css-animee.mp4",
      srcSecours: "assets/videos/css-animee.mp4",
      urlCours: "cours/css3.html#videos",
      codeApercu: "background: url(image.jpg) center / cover;"
    },
    {
      /* v500 : TP pas à pas — la même capsule est proposée en HTML5 et en CSS3. */
      id: "tp-evenements-liens",
      matiere: "html5",
      matieres: ["html5", "css3"],
      nomMatiere: "HTML5 + CSS3",
      badgeClasse: "badge-html",
      couleur: "#ff783c",
      titre: "TP — Événements, liens et arrière-plans",
      dureeTexte: "14:12",
      srcPrincipal: "assets/videos/tp-evenements-liens-v2.mp4",
      urlTP: "exercices/html-css/tp-evenements-liens/index.html",
      urlCours: "exercices/html-css/tp-evenements-liens/index.html",
      codeApercu: "onclick=\"journal('clic')\""
    },
    {
      /* v502 : TP pas à pas « formulaire, tableau et autres balises », commun à HTML5 et CSS3. */
      id: "tp-formulaire-tableau-autre",
      matiere: "html5",
      matieres: ["html5", "css3"],
      nomMatiere: "HTML5 + CSS3",
      badgeClasse: "badge-html",
      couleur: "#ff783c",
      titre: "TP — Formulaire, tableau et autres balises",
      dureeTexte: "15:11",
      srcPrincipal: "assets/videos/tp-formulaire-tableau-autre.mp4",
      urlTP: "exercices/html-css/tp-formulaire-tableau-autre/index.html",
      urlCours: "exercices/html-css/tp-formulaire-tableau-autre/index.html",
      codeApercu: "<td colspan=\"2\">fusion</td>"
    },
    {
      /* v510 : capsule « display, float et position » — chaque boîte se présente, puis le CSS. */
      id: "tp-display-float-position",
      matiere: "html5",
      matieres: ["html5", "css3"],
      nomMatiere: "HTML5 + CSS3",
      badgeClasse: "badge-html",
      couleur: "#ff783c",
      titre: "TP — display, float et position",
      dureeTexte: "09:55",
      srcPrincipal: "assets/videos/tp-display-float-position.mp4",
      urlTP: "exercices/html-css/tp-display-float-position/index.html",
      urlCours: "exercices/html-css/tp-display-float-position/index.html",
      codeApercu: "display: inline-block"
    },
    {
      /* v512 : TP « transitions et animations » — deux exercices, corrigés dans la même page. */
      id: "tp-transitions-animations",
      matiere: "css3",
      nomMatiere: "CSS3",
      badgeClasse: "badge-css",
      couleur: "#38bdf8",
      titre: "TP — transitions et animations",
      dureeTexte: "10:38",
      srcPrincipal: "assets/videos/tp-transitions-animations.mp4",
      urlTP: "exercices/html-css/tp-transitions-animations/index.html",
      urlCours: "exercices/html-css/tp-transitions-animations/index.html",
      codeApercu: "@keyframes pulse"
    },
    {
      id: "javascript-cours",
      matiere: "javascript",
      nomMatiere: "JavaScript",
      badgeClasse: "badge-js",
      couleur: "#facc15",
      titre: "JavaScript — Contrôles de saisie & DOM Bac",
      dureeTexte: "14:43",
      srcPrincipal: "assets/videos/javascript-cours.mp4",
      srcSecours: "assets/videos/javascript-cours.mp4",
      urlCours: "cours/javascript.html#videos",
      codeApercu: "const v = document.getElementById('cin').value;"
    },
    {
      id: "validation-nom-prenom-js",
      matiere: "javascript",
      nomMatiere: "JavaScript",
      badgeClasse: "badge-js",
      couleur: "#facc15",
      titre: "JavaScript — Validation du champ Nom & Prénom",
      dureeTexte: "12:11",
      srcPrincipal: "assets/videos/validation-nom-prenom-js.mp4",
      srcSecours: "assets/videos/validation-nom-prenom-js.mp4",
      sousTitres: "assets/subtitles/validation-nom-prenom-js-fr.vtt",
      urlCours: "cours/javascript.html#videos",
      codeApercu: "for (let i = 0; i < ch.length; i++) { ... }"
    },
    {
      id: "sql-cours",
      matiere: "sql",
      nomMatiere: "SQL",
      badgeClasse: "badge-sql",
      couleur: "#34d399",
      titre: "SQL — Requêtes SELECT, jointures & agrégats",
      dureeTexte: "09:32",
      srcPrincipal: "assets/videos/sql-cours-v7.mp4",
      srcSecours: "assets/videos/sql-cours-v7.mp4",
      urlCours: "cours/sql.html#videos",
      codeApercu: "SELECT nom, AVG(note) FROM eleve GROUP BY cl;"
    },
    {
      id: "sql-initiation",
      matiere: "sql", nomMatiere: "SQL", badgeClasse: "badge-sql", couleur: "#34d399",
      titre: "SQL — Construire une requête pas à pas", dureeTexte: "08:45",
      srcPrincipal: "exercices/sql/sql-construire-requete-guide-texte.mp4", urlCours: "cours/sql.html#videos",
      codeApercu: "SELECT colonnes FROM table;"
    },
    {
      id: "sql-serie4",
      matiere: "sql", nomMatiere: "SQL", badgeClasse: "badge-sql", couleur: "#34d399", reserve4si: true,
      titre: "SQL Série 4 — Jointures et GROUP BY", dureeTexte: "14:34",
      srcPrincipal: "assets/videos/sql-serie4.mp4", urlCours: "cours/sql.html#videos",
      codeApercu: "SELECT ... GROUP BY ...;"
    },
    {
      id: "sql-serie5",
      matiere: "sql", nomMatiere: "SQL", badgeClasse: "badge-sql", couleur: "#34d399", reserve4si: true,
      titre: "SQL Série 5 — Dates et GROUP BY", dureeTexte: "18:09",
      srcPrincipal: "assets/videos/sql-serie5.mp4", urlCours: "cours/sql.html#videos",
      codeApercu: "SELECT ... WHERE ...;"
    },
    {
      id: "php-cours",
      matiere: "php",
      nomMatiere: "PHP",
      badgeClasse: "badge-php",
      couleur: "#a78bfa",
      titre: "PHP & MySQLi — Traitement serveur de A à Z",
      dureeTexte: "10:59",
      reserve4si: true,
      srcPrincipal: "assets/videos/php-cours.mp4",
      srcSecours: "assets/videos/php-cours.mp4",
      urlCours: "cours/php.html#videos",
      codeApercu: "$res = mysqli_query($con, $sql);"
    },
    {
      id: "php-synthese",
      matiere: "php", nomMatiere: "PHP", badgeClasse: "badge-php", couleur: "#a78bfa", reserve4si: true,
      titre: "PHP — Synthèse : gestion des élèves", dureeTexte: "14:08",
      srcPrincipal: "assets/videos/php-synthese.mp4", urlCours: "cours/php.html#videos",
      codeApercu: "$resultat = mysqli_query($con, $sql);"
    },
    {
      id: "php-guichet",
      matiere: "php",
      nomMatiere: "PHP",
      badgeClasse: "badge-php",
      couleur: "#a78bfa",
      titre: "PHP Synthèse — Application Guichet & formulaires",
      dureeTexte: "05:22",
      reserve4si: true,
      srcPrincipal: "assets/videos/php-guichet-v10.mp4",
      srcSecours: "assets/videos/php-guichet-v10.mp4",
      urlCours: "cours/php.html#videos",
      codeApercu: "while ($lig = mysqli_fetch_assoc($res)) { ... }"
    }
  ];

  /* 3. Traductions */
  var TRADUCTIONS = {
    fr: {
      "nav.cours": "Cours",
      "nav.videos": "Vidéos",
      "nav.livres": "Scanner mon livre",
      "nav.outils": "Outils Bac",
      "nav.quiz": "Quiz",
      "nav.glossaire": "Glossaire",
      "sub.connecter": "Se connecter / Devenir abonné",
      "sub.abonne": "⭐ Abonné",
      "dash.titre": "Mon tableau de bord",
      "dash.deconnexion": "🚪 Se déconnecter"
    },
    en: {
      "nav.cours": "Courses",
      "nav.videos": "Videos",
      "nav.livres": "Smart Book",
      "nav.outils": "Bac Tools",
      "nav.quiz": "Quizzes",
      "nav.glossaire": "Glossary",
      "sub.connecter": "Sign in / Subscribe",
      "sub.abonne": "⭐ Subscriber",
      "dash.titre": "My Dashboard",
      "dash.deconnexion": "🚪 Sign out"
    },
    ar: {
      "nav.cours": "الدروس",
      "nav.videos": "الفيديوهات",
      "nav.livres": "مسح الكتاب",
      "nav.outils": "أدوات البكالوريا",
      "nav.quiz": "الاختبارات",
      "nav.glossaire": "المعجم",
      "sub.connecter": "تسجيل الدخول / اشتراك",
      "sub.abonne": "⭐ مشترك",
      "dash.titre": "لوحة المتابعة",
      "dash.deconnexion": "🚪 تسجيل الخروج"
    }
  };

  function traduire(cle) {
    var profil = global.STIProfil ? global.STIProfil.chargerProfil() : { langue: "fr" };
    var table = TRADUCTIONS[profil.langue] || TRADUCTIONS.fr;
    return table[cle] || TRADUCTIONS.fr[cle] || cle;
  }

  function appliquerTraductionsPage() {
    var noeuds = document.querySelectorAll("[data-i18n]");
    noeuds.forEach(function (el) {
      var cle = el.getAttribute("data-i18n");
      if (cle) el.textContent = traduire(cle);
    });
  }

  /* 4. Modes d’affichage */
  function rafraichirBoutonsTheme() {
    if (!global.STIProfil) return;
    var themeActif = global.STIProfil.chargerProfil().theme;
    document.querySelectorAll("[data-set-theme]").forEach(function (btn) {
      var cible = btn.getAttribute("data-set-theme");
      btn.setAttribute("aria-pressed", cible === themeActif ? "true" : "false");
    });
  }

  function initialiserSelecteursTheme() {
    document.addEventListener("click", function (ev) {
      var btn = ev.target && ev.target.closest ? ev.target.closest("[data-set-theme]") : null;
      if (!btn || !global.STIProfil) return;
      var nouveauTheme = btn.getAttribute("data-set-theme");
      global.STIProfil.mettreAJour("theme", nouveauTheme);
      rafraichirBoutonsTheme();
    });
    rafraichirBoutonsTheme();
  }

  /* 5. Déconnexion */
  function declencherDeconnexion() {
    var btnAcces = document.getElementById("sti-out");
    if (btnAcces) {
      btnAcces.click();
      return;
    }
    var racine = (global.STI_AUTH && global.STI_AUTH.RACINE) || obtenirPrefixeRacine();
    var rediriger = function () {
      global.location.replace(racine + "portail.html#deconnecte");
    };
    if (global.__STI_SB_CLIENT && global.__STI_SB_CLIENT.auth) {
      global.__STI_SB_CLIENT.auth.signOut().then(rediriger).catch(rediriger);
    } else {
      rediriger();
    }
  }

  /* 6. Badge et panneau abonné */
  function estPageAccueil() {
    var pn = String((global.location && global.location.pathname) || "").replace(/\/+$/, "");
    return pn === "" || /\/STiV2\.0$/i.test(pn) || /\/index\.html$/i.test(pn);
  }

  function calculerResumeRevision() {
    var profil = global.STIProfil ? global.STIProfil.chargerProfil() : { progression: {} };
    var ok4 = estAutorise4SI();
    var cles = ok4 ? ["html5", "css3", "javascript", "sql", "php"] : ["html5", "css3", "javascript", "sql"];
    var nb = 0;
    cles.forEach(function (k) {
      if (profil.progression && profil.progression[k]) nb++;
    });
    return { faits: nb, total: cles.length, pourcent: Math.round((nb / cles.length) * 100) };
  }

  function assurerTiroirAbonneDOM() {
    if (document.getElementById("stiSubDrawer")) return;
    var pref = obtenirPrefixeRacine();

    var fond = document.createElement("div");
    fond.className = "sub-drawer-backdrop";
    fond.id = "stiSubDrawerBackdrop";

    var tiroir = document.createElement("aside");
    tiroir.className = "sub-drawer";
    tiroir.id = "stiSubDrawer";
    tiroir.setAttribute("role", "dialog");
    tiroir.setAttribute("aria-modal", "true");
    tiroir.setAttribute("aria-label", "Espace abonné rapide");

    tiroir.innerHTML =
      '<div class="sub-drawer__head">' +
        '<div style="display:flex;align-items:center;gap:12px">' +
          '<div class="sub-avatar" id="drawerAvatar" style="width:42px;height:42px;font-size:.95rem">AB</div>' +
          "<div>" +
            '<div style="font-weight:800;font-size:1rem" id="drawerName">Abonné</div>' +
            '<div style="font-size:.76rem;color:var(--text-muted)" id="drawerMeta">Lycée Raféha</div>' +
          "</div>" +
        "</div>" +
        '<button type="button" class="modal__close" id="btnCloseSubDrawer" aria-label="Fermer le panneau">✕</button>' +
      "</div>" +
      '<div class="sub-drawer__body">' +
        '<div id="drawerGoldBox"></div>' +
        '<div class="card" style="padding:14px">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
            '<strong style="font-size:.86rem">📚 Progression des matières</strong>' +
            '<span class="badge" id="drawerRevCount">0 / 5 révisés</span>' +
          "</div>" +
          '<div class="progress-bar"><div class="progress-bar__fill" id="drawerRevBar" style="width:0%"></div></div>' +
        "</div>" +
        '<div class="card" style="padding:14px" id="drawerResumeCard">' +
          '<strong style="font-size:.86rem;display:block;margin-bottom:6px">📍 Dernière activité</strong>' +
          '<p style="font-size:.82rem" id="drawerResumeText">Aucun chapitre en cours pour le moment.</p>' +
        "</div>" +
        '<div class="card" style="padding:14px">' +
          '<strong style="font-size:.86rem;display:block;margin-bottom:8px">🎨 Mode d\'affichage</strong>' +
          '<div class="segmented" role="group" aria-label="Mode d\'affichage">' +
            '<button type="button" class="segmented__btn" data-set-theme="clair">☀️ Clair</button>' +
            '<button type="button" class="segmented__btn" data-set-theme="intermediaire">🌗 Intermédiaire</button>' +
            '<button type="button" class="segmented__btn" data-set-theme="sombre">🌙 Sombre</button>' +
          "</div>" +
        "</div>" +
        '<div id="drawerProfAction"></div>' +
      "</div>" +
      '<div class="sub-drawer__foot">' +
        '<a class="btn btn-primary" href="' + pref + 'dashboard.html">📊 Ouvrir mon tableau de bord complet</a>' +
        '<button type="button" class="btn btn-danger btn-sm" id="drawerLogoutBtn" data-i18n="dash.deconnexion">🚪 Se déconnecter</button>' +
      "</div>";

    document.body.appendChild(fond);
    document.body.appendChild(tiroir);

    var fermer = function () {
      fond.classList.remove("is-open");
      tiroir.classList.remove("is-open");
    };
    fond.addEventListener("click", fermer);
    tiroir.querySelector("#btnCloseSubDrawer").addEventListener("click", fermer);
    tiroir.querySelector("#drawerLogoutBtn").addEventListener("click", declencherDeconnexion);
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && tiroir.classList.contains("is-open")) fermer();
    });
  }

  function ouvrirTiroirAbonne() {
    assurerTiroirAbonneDOM();
    rafraichirTiroirAbonne();
    document.getElementById("stiSubDrawerBackdrop").classList.add("is-open");
    document.getElementById("stiSubDrawer").classList.add("is-open");
  }

  function rafraichirTiroirAbonne() {
    var tiroir = document.getElementById("stiSubDrawer");
    if (!tiroir || !global.STIProfil) return;
    var etat = global.STIProfil.lireEtatSession();
    var profil = global.STIProfil.chargerProfil();
    var rev = calculerResumeRevision();
    var pref = obtenirPrefixeRacine();

    var elAv = document.getElementById("drawerAvatar");
    var elNm = document.getElementById("drawerName");
    var elMt = document.getElementById("drawerMeta");
    var elGb = document.getElementById("drawerGoldBox");
    var elRc = document.getElementById("drawerRevCount");
    var elRb = document.getElementById("drawerRevBar");
    var elRt = document.getElementById("drawerResumeText");
    var elPr = document.getElementById("drawerProfAction");

    if (elAv) elAv.textContent = etat.initiales;
    if (elNm) elNm.textContent = profil.prenom || etat.prenom;
    if (elMt) elMt.textContent = (etat.classe ? etat.classe + " · " : "") + etat.lycee;
    if (elGb) {
      elGb.innerHTML = etat.estGold
        ? '<span class="badge badge-gold">⭐ Compte Abonné GOLD actif · Impression & contenus débloqués</span>'
        : '<a class="badge" href="' + echapperHtml(pref + "portail.html") + '">🔐 Session locale · Connectez-vous pour la synchro cloud</a>';
    }
    if (elRc) elRc.textContent = rev.faits + " / " + rev.total + " révisés";
    if (elRb) elRb.style.width = rev.pourcent + "%";

    if (elRt) {
      if (profil.derniereLecture && profil.derniereLecture.url) {
        elRt.innerHTML =
          echapperHtml(profil.derniereLecture.chapitre || profil.derniereLecture.matiere.toUpperCase()) +
          " (" + profil.derniereLecture.pourcent + ' %) — <a href="' +
          echapperHtml(pref + profil.derniereLecture.url) +
          '" style="color:var(--brand);font-weight:700">Reprendre ➜</a>';
      } else if (profil.videos && profil.videos.derniere && profil.videos.derniere.titre) {
        elRt.innerHTML =
          "🎬 " + echapperHtml(profil.videos.derniere.titre) +
          " (" + formaterDureeSecondes(profil.videos.derniere.temps) + ")";
      }
    }

    if (elPr) {
      var btnRoueProf = document.getElementById("sti-roue-btn-ecrire-prof");
      if (btnRoueProf) {
        elPr.innerHTML = '<button type="button" class="btn btn-secondary btn-sm" style="width:100%" id="drawerWriteProfBtn">💬 Écrire au professeur</button>';
        var bWp = document.getElementById("drawerWriteProfBtn");
        if (bWp) {
          bWp.addEventListener("click", function () {
            document.getElementById("stiSubDrawerBackdrop").classList.remove("is-open");
            tiroir.classList.remove("is-open");
            btnRoueProf.click();
          });
        }
      } else {
        elPr.innerHTML = "";
      }
    }
    rafraichirBoutonsTheme();
  }

  /** Utiliser les éléments vivants créés par acces.js, sans recréer le compte.
   * Les mêmes bouton, avatar, état GOLD, écouteurs et panneau restent en place. */
  function rendreBadgeAbonne() {
    var slot = document.querySelector("[data-subscriber-slot]");
    if (!slot || !global.STIProfil) return;
    var roue = document.getElementById("sti-roue-wrap");
    if (roue) {
      // acces.js peut reconstruire la roue après une mise à jour de session.
      if (!slot.contains(roue)) slot.replaceChildren(roue);
      roue.classList.add("sti-roue-wrap");
      roue.classList.toggle("sti-theme-sombre", global.STIProfil.chargerProfil().theme !== "clair");
      var datePlan = roue.querySelector("#sti-plan-date");
      if (datePlan && !datePlan.hasAttribute("aria-label")) datePlan.setAttribute("aria-label", "Date de l’épreuve du bac");
      return;
    }
    var etat = global.STIProfil.lireEtatSession();
    var texte = etat.connecte ? "Mon compte" : traduire("sub.connecter");
    var href = obtenirPrefixeRacine() + "portail.html";
    if (slot.dataset.etatRoue === texte && slot.firstElementChild) return;
    slot.dataset.etatRoue = texte;
    slot.innerHTML = '<a class="sub-login-btn" href="' + echapperHtml(href) + '">' +
      '<span aria-hidden="true">🔐</span><span class="sub-login-btn__long">' + echapperHtml(texte) + '</span>' +
      '<span class="sub-login-btn__short">Compte</span></a>';
  }

  function initialiserClicBadgeAbonne() {
    // La roue est insérée asynchroniquement par acces.js ; surveiller ses remplacements.
    if (typeof MutationObserver !== "function") return;
    var obs = new MutationObserver(function (mutations) {
      var change = mutations.some(function (mutation) {
        return Array.prototype.some.call(mutation.addedNodes, function (n) {
          return n.nodeType === 1 && (n.id === "sti-roue-wrap" || n.id === "sti-plan-date" ||
            (n.querySelector && n.querySelector("#sti-roue-wrap, #sti-plan-date")));
        }) || Array.prototype.some.call(mutation.removedNodes, function (n) {
          return n.nodeType === 1 && n.id === "sti-roue-wrap";
        });
      });
      if (change) rendreBadgeAbonne();
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  /* 7. Lecteur vidéo */
  function attacherSuiviElementVideo(videoEl, metaVideo) {
    if (!videoEl || videoEl._suiviStiActif || !global.STIProfil) return;
    videoEl._suiviStiActif = true;
    var dernierEnregistrement = 0;

    videoEl.addEventListener("timeupdate", function () {
      var maintenant = Date.now();
      if (maintenant - dernierEnregistrement < 3500) return;
      dernierEnregistrement = maintenant;

      var t = Math.floor(videoEl.currentTime || 0);
      var d = Math.floor(videoEl.duration || 0);
      if (t < 3) return;

      var p = global.STIProfil.chargerProfil();
      p.videos.derniere = {
        id: metaVideo.id,
        matiere: metaVideo.matiere,
        titre: metaVideo.titre,
        temps: t,
        duree: d,
        url: metaVideo.urlCours
      };
      if (d > 0 && t / d >= 0.85 && p.videos.vues.indexOf(metaVideo.id) === -1) {
        p.videos.vues.push(metaVideo.id);
      }
      global.STIProfil.sauvegarderProfil(p, false);
    });

    videoEl.addEventListener("ended", function () {
      var p = global.STIProfil.chargerProfil();
      if (p.videos.vues.indexOf(metaVideo.id) === -1) {
        p.videos.vues.push(metaVideo.id);
      }
      if (p.videos.derniere && p.videos.derniere.id === metaVideo.id) {
        p.videos.derniere.temps = 0;
      }
      global.STIProfil.sauvegarderProfil(p, false);
      rendreGrilleVideosAccueil();
    });
  }

  function ouvrirModaleVideo(idVideo, tempsDepart) {
    var meta = CATALOGUE_VIDEOS.find(function (v) { return v.id === idVideo; });
    if (!meta || (meta.reserve4si && !estAutorise4SI())) return;
    // Une seule interface : le lecteur historique, avec tous ses chapitres et commandes.
    if (typeof global.ouvrirVideoPasAPasSTI === "function") {
      global.ouvrirVideoPasAPasSTI(meta.id, meta.titre, Number(tempsDepart) || 0);
    }
  }

  /* Tirage de la vidéo à la une : chaque ouverture de l'accueil met une vidéo
     différente en avant. Seules les vidéos accessibles à tous sont candidates
     (les séries réservées aux 4e SI restent dans leur rubrique) et les capsules
     de quelques secondes sont écartées pour ne pas occuper la vitrine. */
  var CLE_DERNIERE_VIDEO_ALEATOIRE = "sti-video-a-la-une-derniere";
  function dureeEnSecondesHms(texte) {
    var morceaux = String(texte || "").split(":");
    var total = 0;
    for (var i = 0; i < morceaux.length; i++) total = total * 60 + (parseInt(morceaux[i], 10) || 0);
    return total;
  }
  function choisirVideoALaUne() {
    var eligibles = CATALOGUE_VIDEOS.filter(function (v) {
      if (v.reserve4si) return false;
      return dureeEnSecondesHms(v.dureeTexte) >= 60;
    });
    if (!eligibles.length) eligibles = CATALOGUE_VIDEOS.filter(function (v) { return !v.reserve4si; });
    if (!eligibles.length) eligibles = CATALOGUE_VIDEOS.slice();
    if (eligibles.length === 1) return eligibles[0];
    /* Éviter de reproposer exactement la même capsule deux ouvertures de suite. */
    var precedente = "";
    try { precedente = global.sessionStorage.getItem(CLE_DERNIERE_VIDEO_ALEATOIRE) || ""; } catch (e) {}
    var candidates = eligibles.filter(function (v) { return v.id !== precedente; });
    if (!candidates.length) candidates = eligibles;
    var choix = candidates[Math.floor(Math.random() * candidates.length)];
    try { global.sessionStorage.setItem(CLE_DERNIERE_VIDEO_ALEATOIRE, choix.id); } catch (e) {}
    return choix;
  }

  function initialiserVideoHero() {
    var vidHero = document.getElementById("heroFeaturedVideo");
    var btnOverlay = document.getElementById("heroVideoOverlay");
    if (!vidHero) return;

    var meta = choisirVideoALaUne();
    var carte = vidHero.closest(".featured-video-card");
    vidHero.dataset.stiVideoId = meta.id;
    /* Le lecteur commun résout ainsi la capsule réellement affichée. */
    vidHero.dataset.videoId = meta.id;
    vidHero.setAttribute("aria-label", meta.titre);
    vidHero.setAttribute(
      "poster",
      creerPosterSvgDataUri(meta.titre, "À LA UNE · " + meta.nomMatiere, meta.couleur, meta.codeApercu)
    );

    /* Source et sous-titres suivent le tirage, sans recharger la page. */
    var source = vidHero.querySelector("source");
    if (source) {
      source.setAttribute("src", meta.srcPrincipal);
      source.setAttribute("type", "video/mp4");
    }
    var piste = vidHero.querySelector("track");
    if (piste) {
      if (meta.sousTitres) {
        piste.setAttribute("src", meta.sousTitres);
        piste.hidden = false;
      } else {
        piste.remove();
      }
    } else if (meta.sousTitres) {
      var pisteNeuve = document.createElement("track");
      pisteNeuve.kind = "subtitles";
      pisteNeuve.srclang = "fr";
      pisteNeuve.label = "Français";
      pisteNeuve.src = meta.sousTitres;
      vidHero.appendChild(pisteNeuve);
    }
    try { vidHero.load(); } catch (e) {}

    /* Libellés visibles : matière, durée, titre de la capsule. */
    var badge = document.getElementById("heroVideoBadge");
    if (badge) {
      badge.className = "badge " + (meta.badgeClasse || "badge-css");
      badge.textContent = meta.nomMatiere + " · " + meta.dureeTexte;
    }
    var titre = document.getElementById("heroVideoTitre");
    if (titre) titre.textContent = meta.titre;

    attacherSuiviElementVideo(vidHero, meta);

    if (btnOverlay) {
      btnOverlay.setAttribute("aria-label", "CAPSULE VIDÉO EXPLICATIVE " + meta.titre + " : lancer la vidéo");
      btnOverlay.addEventListener("click", function () {
        ouvrirModaleVideo(meta.id, 0);
      });
      vidHero.addEventListener("play", function () {
        btnOverlay.classList.add("is-playing");
      });
    }
    if (carte) carte.classList.add("is-pret");
  }

  var filtreVideoActif = "all";

  /* Une vidéo peut être partagée par deux matières (TP HTML + CSS). */
  function matieresVideo(v) {
    return (v && v.matieres) || [v.matiere];
  }
  function videoDeMatiere(v, idMat) {
    return matieresVideo(v).indexOf(idMat) !== -1;
  }

  function rendreGrilleVideosAccueil() {
    var grille = document.getElementById("videosGrid");
    if (!grille) return;

    var profil = global.STIProfil ? global.STIProfil.chargerProfil() : { videos: { vues: [] } };
    var vues = (profil.videos && profil.videos.vues) || [];
    var ok4 = estAutorise4SI();

    var libellesFiltres = { html5: "HTML5", css3: "CSS3", javascript: "JS", sql: "SQL", php: "PHP" };
    /* Le total est calculé, jamais recopié : il suit le catalogue à chaque ajout. */
    var accessibles = CATALOGUE_VIDEOS.filter(function (v) { return !v.reserve4si || ok4; }).length;
    var pastilleToutes = document.querySelector('[data-video-filter="all"]');
    if (pastilleToutes) pastilleToutes.textContent = "Toutes (" + accessibles + ")";
    var totalTexte = document.getElementById("videosTotalNombre");
    if (totalTexte) totalTexte.textContent = String(accessibles);
    /* v515 : la tuile « Vidéos du catalogue » annonce le catalogue entier,
       elle n'est plus un chiffre figé qui vieillit à chaque capsule ajoutée. */
    var statVideos = document.getElementById("videosStatNombre");
    if (statVideos) {
      statVideos.setAttribute("data-count", String(CATALOGUE_VIDEOS.length));
      statVideos.textContent = String(CATALOGUE_VIDEOS.length);
    }
    document.querySelectorAll("[data-video-filter]").forEach(function (btnF) {
      var cleF = btnF.getAttribute("data-video-filter") || "";
      if (!libellesFiltres[cleF]) return;
      var nbF = CATALOGUE_VIDEOS.filter(function (v) {
        return videoDeMatiere(v, cleF) && (!v.reserve4si || ok4);
      }).length;
      btnF.textContent = libellesFiltres[cleF] + " (" + nbF + ")";
    });

    var liste = CATALOGUE_VIDEOS.filter(function (v) {
      if (v.reserve4si && !ok4) return false;
      if (filtreVideoActif !== "all" && !videoDeMatiere(v, filtreVideoActif)) return false;
      return true;
    });

    // Ne pas remplacer les boutons à chaque notification de session ou de
    // progression : ils restent les appelants du lecteur et gardent le focus.
    var signature = liste.map(function (v) { return v.id + ":" + (vues.indexOf(v.id) !== -1 ? "1" : "0"); }).join("|");
    if (grille.dataset.signatureVideos === signature && grille.children.length) return;
    grille.dataset.signatureVideos = signature;
    grille.innerHTML = liste.map(function (v) {
      var dejaVue = vues.indexOf(v.id) !== -1;
      var poster = creerPosterSvgDataUri(v.titre, v.nomMatiere, v.couleur, v.codeApercu);
      return (
        '<article class="video-card' + (v.reserve4si ? " sti-4si-only" : "") + '" data-matiere="' + echapperHtml(v.matiere) + '">' +
          '<button type="button" class="video-card__thumb" data-play-video="' + echapperHtml(v.id) + '" aria-label="▶ ' + (dejaVue ? '✓ Vue ' : '') + echapperHtml(v.dureeTexte) + ' — Lire la vidéo ' + echapperHtml(v.titre) + '">' +
            '<img src="' + echapperHtml(poster) + '" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block" />' +
            '<span class="video-card__play"><span class="video-play-btn" aria-hidden="true">▶</span></span>' +
            (dejaVue ? '<span class="video-card__seen" aria-hidden="true">✓ Vue</span>' : "") +
            '<span class="video-card__duration" aria-hidden="true">' + echapperHtml(v.dureeTexte) + "</span>" +
          "</button>" +
          '<div class="video-card__body">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px">' +
              '<span class="badge ' + echapperHtml(v.badgeClasse) + '">🎥 ' + echapperHtml(v.nomMatiere) + "</span>" +
              (v.reserve4si ? '<span class="badge badge-4si">4e SI</span>' : '<span style="font-size:.74rem;color:var(--text-muted)">.mp4 HD</span>') +
            "</div>" +
            '<h3 class="video-card__title">' + echapperHtml(v.titre) + "</h3>" +
            '<div class="video-card__actions">' +
              '<button type="button" class="btn btn-primary btn-sm" data-play-video="' + echapperHtml(v.id) + '">▶ Regarder</button>' +
              '<a class="btn btn-ghost btn-sm" href="' + echapperHtml(v.urlCours) + '">Cours ➜</a>' +
            "</div>" +
          "</div>" +
        "</article>"
      );
    }).join("");
  }

  function initialiserSectionVideos() {
    rendreGrilleVideosAccueil();

    document.addEventListener("click", function (ev) {
      var btnPlay = ev.target && ev.target.closest ? ev.target.closest("[data-play-video]") : null;
      if (btnPlay) {
        ev.preventDefault();
        var id = btnPlay.getAttribute("data-play-video");
        var depart = Number(btnPlay.getAttribute("data-start-time") || 0);
        ouvrirModaleVideo(id, depart);
        return;
      }

      var btnFiltre = ev.target && ev.target.closest ? ev.target.closest("[data-video-filter]") : null;
      if (btnFiltre) {
        filtreVideoActif = btnFiltre.getAttribute("data-video-filter") || "all";
        document.querySelectorAll("[data-video-filter]").forEach(function (b) {
          b.classList.toggle("is-active", b === btnFiltre);
        });
        rendreGrilleVideosAccueil();
      }
    });

    var btnPrev = document.getElementById("videosScrollPrev");
    var btnNext = document.getElementById("videosScrollNext");
    var grille = document.getElementById("videosGrid");
    if (btnPrev && grille) {
      btnPrev.addEventListener("click", function () {
        grille.scrollBy({ left: -320, behavior: "smooth" });
      });
    }
    if (btnNext && grille) {
      btnNext.addEventListener("click", function () {
        grille.scrollBy({ left: 320, behavior: "smooth" });
      });
    }
  }

  /* 8. Accueil */
  function initialiserTerminalHero() {
    var iconeEl = document.getElementById("rotatorIcon");
    var texteEl = document.getElementById("rotatorText");
    if (!iconeEl || !texteEl) return;

    var itemsBase = [
      { icone: "🏫", texte: "Lycée Raféha · 3ème & 4ème SI — Par Aymen Essouyah" },
      { icone: "🌐", texte: "HTML5 : structure sémantique, formulaires & tableaux" },
      { icone: "🎨", texte: "CSS3 : Flexbox, responsive et vidéos du cours (.mp4)" },
      { icone: "⚡", texte: "JavaScript : fonctions de contrôle Bac & DOM" },
      { icone: "🗄️", texte: "SQL : requêtes SELECT, jointures & agrégations" },
      { icone: "🐘", texte: "PHP & MySQLi : traitement serveur 4e SI", reserve4si: true },
      { icone: "🎯", texte: "1 244 questions auto-corrigées & révision de mes erreurs" }
    ];

    var index = 0;
    var reduireMouvement = global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduireMouvement) return;

    setInterval(function () {
      var actifs = itemsBase.filter(function (it) {
        return !it.reserve4si || estAutorise4SI();
      });
      index = (index + 1) % actifs.length;
      var suivant = actifs[index];
      iconeEl.classList.add("rotator-fade");
      texteEl.classList.add("rotator-fade");
      setTimeout(function () {
        iconeEl.textContent = suivant.icone;
        texteEl.textContent = suivant.texte;
        iconeEl.classList.remove("rotator-fade");
        texteEl.classList.remove("rotator-fade");
      }, 200);
    }, 2800);
  }

  function initialiserCompteursStats() {
    var compteurs = document.querySelectorAll("[data-count]");
    if (!compteurs.length) return;

    var reduire = global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var animer = function (el) {
      var cible = parseInt(el.getAttribute("data-count"), 10) || 0;
      var formater = function (n) {
        return n >= 1000 ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ") : String(n);
      };
      if (reduire) {
        el.textContent = formater(cible);
        return;
      }
      var debut = null;
      var duree = 1100;
      function etape(ts) {
        if (!debut) debut = ts;
        var p = Math.min(1, (ts - debut) / duree);
        var courbe = 1 - Math.pow(1 - p, 3);
        el.textContent = formater(Math.round(cible * courbe));
        if (p < 1) requestAnimationFrame(etape);
      }
      requestAnimationFrame(etape);
    };

    if ("IntersectionObserver" in global && !reduire) {
      var io = new IntersectionObserver(function (entrees) {
        entrees.forEach(function (entree) {
          if (entree.isIntersecting) {
            animer(entree.target);
            io.unobserve(entree.target);
          }
        });
      }, { threshold: 0.25 });
      compteurs.forEach(function (c) { io.observe(c); });
    } else {
      compteurs.forEach(animer);
    }
  }

  /* v516/v518 : les logos des dix outils interactifs attirent l'attention.
     À l'arrivée sur la section, les dix logos font un petit salut en cascade ;
     ensuite, toutes les 1,2 à 2,8 s, un logo tiré au sort (ou une vague de 2 à
     3 voisins) exécute une des sept animations, avec un halo de la couleur de
     la classe sur la pastille. Pause de 6 s tous les dix passages pour ne pas
     devenir agaçant. */
  var CLASSES_OUTIL_ANIM = [
    "sti-outil-anim-1", "sti-outil-anim-2", "sti-outil-anim-3", "sti-outil-anim-4",
    "sti-outil-anim-5", "sti-outil-anim-6", "sti-outil-anim-7"
  ];
  var minuteurOutils = null;
  var dernierReveilOutils = 0;

  function pastilleOutilsVisible(pastille) {
    if (!pastille || pastille.hidden) return false;
    if (!global.getComputedStyle) return true;
    return global.getComputedStyle(pastille).display !== "none";
  }

  function iconesOutilsVisibles() {
    var icones = Array.prototype.slice.call(
      document.querySelectorAll("#ateliers-rapides .lab-chip__ico")
    );
    return icones.filter(function (ico) {
      return pastilleOutilsVisible(ico.closest ? ico.closest(".lab-chip") : null);
    });
  }

  /* Une icône : animation tirée au sort + halo sur sa pastille, après un délai
     qui permet les cascades. */
  function animerIconeOutil(ico, classe, delai) {
    if (!ico) return;
    global.setTimeout(function () {
      CLASSES_OUTIL_ANIM.forEach(function (c) { ico.classList.remove(c); });
      /* force le recalcul : la même animation doit pouvoir repartir aussitôt. */
      void ico.offsetWidth;
      ico.classList.add(classe);
      var pastille = ico.closest ? ico.closest(".lab-chip") : null;
      if (pastille && pastille.classList) {
        pastille.classList.remove("sti-outil-halo");
        void pastille.offsetWidth;
        pastille.classList.add("sti-outil-halo");
        global.setTimeout(function () { pastille.classList.remove("sti-outil-halo"); }, 1250);
      }
      global.setTimeout(function () { ico.classList.remove(classe); }, 1350);
    }, delai || 0);
  }

  function tirerClasseOutil() {
    return CLASSES_OUTIL_ANIM[Math.floor(Math.random() * CLASSES_OUTIL_ANIM.length)];
  }

  function animerUnOutilAuHasard() {
    var cibles = iconesOutilsVisibles();
    if (!cibles.length) return;
    animerIconeOutil(cibles[Math.floor(Math.random() * cibles.length)], tirerClasseOutil(), 0);
  }

  /* Deux ou trois logos voisins partent en cascade : l'œil suit la vague. */
  function animerVagueOutils() {
    var cibles = iconesOutilsVisibles();
    if (!cibles.length) return;
    var depart = Math.floor(Math.random() * cibles.length);
    var taille = Math.min(cibles.length, 2 + Math.floor(Math.random() * 2));
    var classe = tirerClasseOutil();
    for (var i = 0; i < taille; i += 1) {
      animerIconeOutil(cibles[(depart + i) % cibles.length], classe, i * 150);
    }
  }

  /* Le salut d'arrivée : les dix logos, en cascade, une seule fois. */
  function saluerLesOutils() {
    iconesOutilsVisibles().forEach(function (ico, i) {
      animerIconeOutil(ico, i % 2 ? "sti-outil-anim-2" : "sti-outil-anim-1", i * 110);
    });
  }

  function initialiserAnimationsOutils() {
    var section = document.getElementById("ateliers-rapides");
    if (!section) return;
    var reduire = global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduire) return;

    var passages = 0;
    function planifier(attenteForcee) {
      var attente = attenteForcee || 1200 + Math.round(Math.random() * 1600);
      minuteurOutils = global.setTimeout(function () {
        if (document.hidden) { planifier(); return; }
        passages += 1;
        if (Math.random() < 0.35) animerVagueOutils();
        else animerUnOutilAuHasard();
        /* Anti-agitation : respiration de 6 s après dix animations. */
        planifier(passages % 10 === 0 ? 6000 : 0);
      }, attente);
    }

    /* Premier clin d'œil groupé dès que la section entre à l'écran. */
    var demarre = false;
    function demarrerSalut() {
      if (demarre) return;
      demarre = true;
      global.setTimeout(saluerLesOutils, 150);
      planifier(900);
    }
    if (global.IntersectionObserver && section.getBoundingClientRect) {
      try {
        var observateur = new global.IntersectionObserver(function (entrees) {
          entrees.forEach(function (e) { if (e.isIntersecting) { demarrerSalut(); observateur.disconnect(); } });
        }, { threshold: 0.35 });
        observateur.observe(section);
      } catch (e) { demarrerSalut(); }
      /* Filet de sécurité : si l'observateur ne dit rien, on salue quand même. */
      global.setTimeout(demarrerSalut, 6000);
    } else {
      demarrerSalut();
    }

    /* Un survol relance un clin d'œil, au plus une fois toutes les 2,5 s. */
    try {
      section.addEventListener("pointerenter", function () {
        var maintenant = Date.now();
        if (maintenant - dernierReveilOutils < 2500) return;
        dernierReveilOutils = maintenant;
        animerUnOutilAuHasard();
      });
    } catch (e) {}
  }

  function rafraichirUIRevisionAccueil() {
    if (!global.STIProfil) return;
    var profil = global.STIProfil.chargerProfil();
    var resume = calculerResumeRevision();

    var txtEl = document.getElementById("revisionCountText");
    var barEl = document.getElementById("revisionBarFill");
    if (txtEl) txtEl.textContent = resume.faits + " / " + resume.total + " révisés";
    if (barEl) barEl.style.width = resume.pourcent + "%";

    document.querySelectorAll("[data-toggle-course]").forEach(function (btn) {
      var idMatiere = btn.getAttribute("data-toggle-course");
      var estFait = Boolean(profil.progression && profil.progression[idMatiere]);
      btn.setAttribute("aria-pressed", estFait ? "true" : "false");
      btn.textContent = estFait ? "✓ Révisé" : "○ À réviser";
    });
  }

  /* La fermeture reste valable pour cette lecture dans l'onglet courant, sans
     masquer une nouvelle lecture ni enregistrer de clé locale supplémentaire. */
  var signatureRepriseCourante = "";
  var signatureRepriseMasquee = "";

  function masquerBandeauRepriseAccueil() {
    var bandeau = document.getElementById("resumeBanner");
    if (bandeau) bandeau.hidden = true;
    signatureRepriseMasquee = signatureRepriseCourante;
  }

  function rafraichirBandeauRepriseAccueil() {
    var bandeau = document.getElementById("resumeBanner");
    if (!bandeau || !global.STIProfil) return;

    var etat = global.STIProfil.lireEtatSession();
    /* Le synchroniseur n'a pas encore isolé le profil du compte précédent. */
    if (!etat.connecte || etat.compteEnAttente) {
      signatureRepriseCourante = "";
      bandeau.hidden = true;
      var titreEnAttente = document.getElementById("resumeTitle");
      var kickerEnAttente = document.getElementById("resumeKicker");
      var lienEnAttente = document.getElementById("resumeGoBtn");
      if (titreEnAttente) titreEnAttente.textContent = "Chapitre en cours";
      if (kickerEnAttente) kickerEnAttente.textContent = "📍 Reprendre ma dernière lecture";
      if (lienEnAttente) {
        lienEnAttente.setAttribute("href", "#cours");
        lienEnAttente.removeAttribute("data-play-video");
        lienEnAttente.removeAttribute("data-start-time");
      }
      return;
    }

    var profil = global.STIProfil.chargerProfil();
    var dl = profil.derniereLecture;
    var vid = profil.videos && profil.videos.derniere;
    var ok4 = estAutorise4SI();
    var compte = etat.id || etat.email || "session-locale";
    var titreEl = document.getElementById("resumeTitle");
    var kickerEl = document.getElementById("resumeKicker");
    var btnGo = document.getElementById("resumeGoBtn");
    var lectureAutorisee = dl && dl.url && (dl.matiere !== "php" || ok4) &&
      (dl.matiere !== "sql" || dl.chapitreId !== "bac" || ok4);

    if (lectureAutorisee) {
      signatureRepriseCourante = JSON.stringify([compte, "lecture", dl.url]);
      bandeau.hidden = signatureRepriseCourante === signatureRepriseMasquee;
      if (kickerEl) kickerEl.textContent = "📍 Reprendre ma dernière lecture · " + (dl.pourcent || 0) + " %";
      if (titreEl) titreEl.textContent = (dl.matiere ? dl.matiere.toUpperCase() + " — " : "") + (dl.chapitre || "Cours en cours");
      if (btnGo) {
        btnGo.href = dl.url;
        btnGo.removeAttribute("data-play-video");
        btnGo.removeAttribute("data-start-time");
      }
      return;
    }

    var metaVideo = vid && CATALOGUE_VIDEOS.find(function (v) { return v.id === vid.id; });
    if (vid && vid.id && vid.temps > 5 && (vid.matiere !== "php" || ok4) && (!metaVideo || !metaVideo.reserve4si || ok4)) {
      signatureRepriseCourante = JSON.stringify([compte, "video", vid.id]);
      bandeau.hidden = signatureRepriseCourante === signatureRepriseMasquee;
      if (kickerEl) kickerEl.textContent = "🎬 Reprendre ma vidéo à " + formaterDureeSecondes(vid.temps);
      if (titreEl) titreEl.textContent = vid.titre;
      if (btnGo) {
        btnGo.href = "#videos";
        btnGo.setAttribute("data-play-video", vid.id);
        btnGo.setAttribute("data-start-time", String(vid.temps));
      }
      return;
    }

    signatureRepriseCourante = "";
    bandeau.hidden = true;
  }

  function initialiserRechercheEtFiltres() {
    var champ = document.getElementById("moduleSearch");
    var pucesFiltre = document.querySelectorAll("[data-filter]");
    var filtreCourant = "all";

    function normaliserTexte(s) {
      return String(s || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
    }

    function appliquerFiltresAccueil() {
      var q = champ ? normaliserTexte(champ.value) : "";
      var ok4 = estAutorise4SI();

      /* Filtrage des cartes cours, outils et quiz */
      document.querySelectorAll("[data-filter-item]").forEach(function (carte) {
        var cats = (carte.getAttribute("data-filter-item") || "").split(/\s+/);
        if (cats.indexOf("php") !== -1 && !ok4) {
          carte.classList.add("filter-hidden");
          return;
        }
        var okCat = filtreCourant === "all" || cats.indexOf(filtreCourant) !== -1;
        var okTxt = !q || normaliserTexte(carte.textContent).indexOf(q) !== -1;
        carte.classList.toggle("filter-hidden", !(okCat && okTxt));
      });

      /* Recherche profonde dans les chapitres via le moteur existant d'acces.js */
      var boiteProf = document.getElementById("deepSearchResults");
      var grilleProf = document.getElementById("deepSearchGrid");
      var cptProf = document.getElementById("deepSearchCount");
      if (boiteProf && grilleProf) {
        if (q.length >= 2 && typeof global.rechercherChapitresSTI === "function") {
          var mapF = { html5: "htmlcss", css3: "htmlcss", javascript: "js", sql: "sql", php: "php", all: "all" };
          var resultats = global.rechercherChapitresSTI(q, mapF[filtreCourant] || "all");
          if (resultats && resultats.length) {
            boiteProf.hidden = false;
            if (cptProf) cptProf.textContent = "🔎 " + resultats.length + " chapitre(s) ou syntaxe(s) trouvé(s)";
            grilleProf.innerHTML = resultats.slice(0, 8).map(function (it) {
              return (
                '<a class="deep-result-item" href="' + echapperHtml(it.url) + '">' +
                  '<div style="display:flex;justify-content:space-between;gap:8px">' +
                    '<span class="badge">' + echapperHtml(it.badge) + "</span>" +
                    '<span style="font-size:.76rem;color:var(--brand);font-weight:700">Ouvrir ➜</span>' +
                  "</div>" +
                  '<strong style="font-size:.88rem;color:var(--text)">' + echapperHtml(it.title) + "</strong>" +
                  '<span style="font-size:.76rem;color:var(--text-muted)">' + echapperHtml(it.sub || "") + "</span>" +
                "</a>"
              );
            }).join("");
            return;
          }
        }
        boiteProf.hidden = true;
        grilleProf.innerHTML = "";
      }
    }

    if (champ) {
      champ.addEventListener("input", appliquerFiltresAccueil);
    }

    var btnClear = document.getElementById("deepSearchClear");
    if (btnClear && champ) {
      btnClear.addEventListener("click", function () {
        champ.value = "";
        appliquerFiltresAccueil();
        champ.focus();
      });
    }

    pucesFiltre.forEach(function (puce) {
      puce.addEventListener("click", function () {
        pucesFiltre.forEach(function (p) { p.classList.remove("is-active"); });
        puce.classList.add("is-active");
        filtreCourant = puce.getAttribute("data-filter") || "all";
        appliquerFiltresAccueil();
      });
    });

    /* Palette de recherche globale Ctrl+K / bouton en-tête */
    function ouvrirPaletteRecherche() {
      var val = champ ? champ.value : "";
      if (typeof global.ouvrirRechercheGlobaleSTI === "function") {
        global.ouvrirRechercheGlobaleSTI(val);
      } else if (champ) {
        champ.scrollIntoView({ behavior: "smooth", block: "center" });
        champ.focus();
      }
    }

    document.querySelectorAll("[data-open-search]").forEach(function (b) {
      b.addEventListener("click", ouvrirPaletteRecherche);
    });

    document.addEventListener("keydown", function (ev) {
      if ((ev.ctrlKey || ev.metaKey) && String(ev.key).toLowerCase() === "k") {
        ev.preventDefault();
        ouvrirPaletteRecherche();
      }
    });

    /* Relais vers les mini-ateliers interactifs intégrés d'acces.js */
    var liaisonsLabos = [
      ["btnHomeFlashcards", "ouvrirFlashcardsSTI"],
      ["btnHomeSandbox", "ouvrirSandboxSTI"],
      ["btnHomeConsoleJs", "ouvrirConsoleNavigateurSTI"],
      ["btnHomeDebug", "ouvrirChasseErreursSTI"],
      ["btnHomeExamenBlanc", "ouvrirExamenBlancSTI"],
      ["btnHomeConstructeur", "ouvrirConstructeurVisuelSTI", "table"],
      ["btnHomeLaboSql", "ouvrirSimulateurSqlSTI"],
      ["btnHomeLaboAscii", "ouvrirLaboChainesAsciiSTI"],
      ["btnHomeSimPhpSql", "ouvrirSimulateurFormPhpSqlSTI"],
      ["btnHomeCoffreTp", "ouvrirCoffreTpEleveSTI"]
    ];
    liaisonsLabos.forEach(function (cfg) {
      var el = document.getElementById(cfg[0]);
      if (!el) return;
      el.addEventListener("click", function () {
        var fn = global[cfg[1]];
        if (typeof fn === "function") fn(cfg[2]);
      });
    });

    global.__stiMaj4SI = function () {
      rafraichirUIRevisionAccueil();
      rafraichirBandeauRepriseAccueil();
      rendreGrilleVideosAccueil();
      appliquerFiltresAccueil();
    };
  }

  function chargerNouveautesAccueilEtDashboard() {
    var contAccueil = document.getElementById("stiNouveautesGrid");
    var contDash = document.getElementById("dashUnreadNews");
    if (!contAccueil && !contDash) return;

    var pref = obtenirPrefixeRacine();
    var ver = String((global.STI_AUTH && (global.STI_AUTH.VERSION_AFFICHEE || global.STI_AUTH.VERSION)) || "477");

    fetch(pref + "assets/data/nouveautes.json?v=" + encodeURIComponent(ver))
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (liste) {
        if (!Array.isArray(liste)) return;
        var profil = global.STIProfil ? global.STIProfil.chargerProfil() : { nouveautesLues: [] };
        var lues = profil.nouveautesLues || [];

        if (contAccueil) {
          contAccueil.innerHTML = liste.slice(0, 4).map(function (item) {
            var estNouveau = lues.indexOf(item.version) === -1;
            var lien = item.lien ? (pref + String(item.lien).replace(/^\.\//, "")) : (pref + "nouveautes.html");
            return (
              '<article class="news-card' + (estNouveau ? " is-unread" : "") + '">' +
                '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
                  '<span class="badge">' + echapperHtml(item.icone || "🆕") + " " + echapperHtml(item.version || "") + "</span>" +
                  (estNouveau ? '<span class="badge badge-new">NOUVEAU</span>' : "") +
                  '<span style="margin-inline-start:auto;font-size:.75rem;color:var(--text-muted)">' + echapperHtml(item.date || "") + "</span>" +
                "</div>" +
                '<h3 style="font-size:1rem">' + echapperHtml(item.titre || "") + "</h3>" +
                '<p style="font-size:.85rem">' + echapperHtml(item.resume || "") + "</p>" +
                '<div style="margin-top:auto;padding-top:8px;display:flex;justify-content:space-between;align-items:center">' +
                  '<a class="btn btn-ghost btn-sm" data-mark-news="' + echapperHtml(item.version || "") + '" href="' + echapperHtml(lien) + '">' +
                    echapperHtml(item.libelleLien || "Découvrir") + " ➜" +
                  "</a>" +
                "</div>" +
              "</article>"
            );
          }).join("");
        }

        if (contDash) {
          var nonLues = liste.filter(function (it) { return lues.indexOf(it.version) === -1; });
          var badgeNb = document.getElementById("dashNewsCountBadge");
          if (badgeNb) badgeNb.textContent = nonLues.length + " non lue(s)";

          if (!nonLues.length) {
            contDash.innerHTML = '<div class="alert alert-success">✅ Vous êtes à jour : toutes les nouveautés ont été consultées.</div>';
          } else {
            contDash.innerHTML = nonLues.slice(0, 5).map(function (it) {
              return (
                '<div class="dash-row">' +
                  '<div style="max-width:74%">' +
                    '<div style="display:flex;gap:6px;align-items:center;margin-bottom:4px">' +
                      '<span class="badge">' + echapperHtml(it.version) + '</span>' +
                      '<span class="badge badge-new">NOUVEAU</span>' +
                    "</div>" +
                    '<strong style="font-size:.9rem">' + echapperHtml(it.titre) + "</strong>" +
                  "</div>" +
                  '<button type="button" class="btn btn-secondary btn-sm" data-mark-news-btn="' + echapperHtml(it.version) + '">✓ Lu</button>' +
                "</div>"
              );
            }).join("");
          }

          var btnToutLu = document.getElementById("btnMarkAllNewsRead");
          if (btnToutLu && !btnToutLu._lie) {
            btnToutLu._lie = true;
            btnToutLu.addEventListener("click", function () {
              var toutesVersions = liste.map(function (x) { return x.version; }).filter(Boolean);
              global.STIProfil.mettreAJour("nouveautesLues", toutesVersions);
              chargerNouveautesAccueilEtDashboard();
            });
          }
        }
      })
      .catch(function () {});
  }

  function initialiserNavigationEtModalesCommunes() {
    /* Menu mobile burger */
    var burger = document.getElementById("stiBurgerBtn");
    var menuMob = document.getElementById("stiMobileNav");
    if (burger && menuMob) {
      burger.addEventListener("click", function () {
        var ouvert = menuMob.classList.toggle("is-open");
        burger.setAttribute("aria-expanded", ouvert ? "true" : "false");
      });
      menuMob.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () {
          menuMob.classList.remove("is-open");
          burger.setAttribute("aria-expanded", "false");
        });
      });
    }

    /* Barre de progression de défilement */
    var barreLecture = document.getElementById("readingProgressBar");
    if (barreLecture) {
      var raf = 0;
      global.addEventListener("scroll", function () {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = 0;
          var h = document.documentElement;
          var max = h.scrollHeight - h.clientHeight;
          var ratio = max > 0 ? Math.min(1, Math.max(0, h.scrollTop / max)) : 0;
          barreLecture.style.transform = "scaleX(" + ratio + ")";
        });
      }, { passive: true });
    }

    /* Boutons « À réviser / Révisé » et marquage des nouveautés */
    document.addEventListener("click", function (ev) {
      var btnRev = ev.target && ev.target.closest ? ev.target.closest("[data-toggle-course]") : null;
      if (btnRev && global.STIProfil) {
        ev.preventDefault();
        ev.stopPropagation();
        var idMat = btnRev.getAttribute("data-toggle-course");
        var p = global.STIProfil.chargerProfil();
        var actuel = Boolean(p.progression && p.progression[idMat]);
        global.STIProfil.mettreAJour("progression." + idMat, !actuel);
        rafraichirUIRevisionAccueil();
        rendreTableauDeBord();
        return;
      }

      var lienNews = ev.target && ev.target.closest ? ev.target.closest("[data-mark-news]") : null;
      if (lienNews && global.STIProfil) {
        var ver = lienNews.getAttribute("data-mark-news");
        var pr = global.STIProfil.chargerProfil();
        if (ver && pr.nouveautesLues.indexOf(ver) === -1) {
          pr.nouveautesLues.push(ver);
          global.STIProfil.sauvegarderProfil(pr, false);
        }
      }

      var btnNews = ev.target && ev.target.closest ? ev.target.closest("[data-mark-news-btn]") : null;
      if (btnNews && global.STIProfil) {
        var vId = btnNews.getAttribute("data-mark-news-btn");
        var p2 = global.STIProfil.chargerProfil();
        if (vId && p2.nouveautesLues.indexOf(vId) === -1) {
          p2.nouveautesLues.push(vId);
          global.STIProfil.sauvegarderProfil(p2, false);
          chargerNouveautesAccueilEtDashboard();
        }
      }
    });

    /* Modale Contact & QR Code : focus contenu et retour à l'appelant. */
    var modContact = document.getElementById("modalContactQr");
    if (modContact) {
      var btnFermer = document.getElementById("btnCloseContactModal"), retourContact = null, fondsContact = [], classeModalAvant = false;
      function fermerContact() {
        if (!modContact.classList.contains("is-open")) return;
        modContact.classList.remove("is-open");
        fondsContact.forEach(function (e) { e[0].inert = e[1]; }); fondsContact = [];
        if (!classeModalAvant) document.documentElement.classList.remove("sti-modal-open");
        if (retourContact && retourContact.isConnected) retourContact.focus({preventScroll:true});
        retourContact = null;
      }
      document.querySelectorAll("[data-open-contact]").forEach(function (b) {
        b.addEventListener("click", function (e) {
          e.preventDefault(); retourContact = b;
          classeModalAvant = document.documentElement.classList.contains("sti-modal-open");
          Array.prototype.forEach.call(document.body.children, function (enfant) {
            if (enfant === modContact) return; fondsContact.push([enfant, enfant.inert]); enfant.inert = true;
          });
          document.documentElement.classList.add("sti-modal-open");
          modContact.classList.add("is-open"); if (btnFermer) btnFermer.focus({preventScroll:true});
        });
      });
      if (btnFermer) btnFermer.addEventListener("click", fermerContact);
      modContact.addEventListener("click", function (e) { if (e.target === modContact) fermerContact(); });
      document.addEventListener("keydown", function (e) {
        if (!modContact.classList.contains("is-open")) return;
        if (e.key === "Escape") { e.preventDefault(); fermerContact(); return; }
        if (e.key !== "Tab") return;
        var liste = Array.prototype.filter.call(modContact.querySelectorAll('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])'), function (el) { return el.getClientRects().length; });
        if (!liste.length) { e.preventDefault(); return; }
        if (e.shiftKey && document.activeElement === liste[0]) { e.preventDefault(); liste[liste.length-1].focus(); }
        else if (!e.shiftKey && document.activeElement === liste[liste.length-1]) { e.preventDefault(); liste[0].focus(); }
      });
    }

    /* Installation PWA : invitation historique limitée à la première visite et état d'installation partagé. */
    var btnInstall = document.getElementById("installBtn");
    var invitation = document.getElementById("pwaInvitation");
    var aideInstallation = document.getElementById("pwaInvitationAide");
    var premiereInvitation = false;
    var estIos = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    function applicationInstallee() {
      try { return typeof global.__stiPwaEstInstallee === "function" && global.__stiPwaEstInstallee(); }
      catch (e) { return false; }
    }
    function majBoutonPwa() {
      if (!btnInstall) return;
      var disponible = Boolean(global.__stiDeferredInstallPrompt) || estIos;
      btnInstall.hidden = !premiereInvitation || !disponible || applicationInstallee();
      if (applicationInstallee() && invitation) invitation.hidden = true;
    }
    function fermerInvitationPwa() {
      premiereInvitation = false;
      if (invitation) invitation.hidden = true;
      majBoutonPwa();
    }
    function afficherAideInstallation() {
      if (!invitation || !aideInstallation) return;
      invitation.hidden = false;
      aideInstallation.textContent = estIos
        ? "Sur Safari, touchez Partager puis « Sur l’écran d’accueil »."
        : "Dans le menu du navigateur, choisissez « Installer l’application » ou « Ajouter à l’écran d’accueil ».";
      aideInstallation.hidden = false;
    }
    function installerPwa() {
      if (!premiereInvitation || applicationInstallee()) { fermerInvitationPwa(); return; }
      var evenement = global.__stiDeferredInstallPrompt;
      if (!evenement || typeof evenement.prompt !== "function") { afficherAideInstallation(); return; }
      try {
        var resultat = evenement.prompt();
        Promise.resolve(evenement.userChoice || resultat).then(function (choix) {
          global.__stiDeferredInstallPrompt = null;
          if (choix && choix.outcome === "accepted" && typeof global.__stiMarquerPwaInstallee === "function") {
            global.__stiMarquerPwaInstallee();
          }
          fermerInvitationPwa();
        }, afficherAideInstallation);
      } catch (e) { afficherAideInstallation(); }
    }
    if (btnInstall && global.STIProfil) {
      premiereInvitation = !applicationInstallee() && !global.STIProfil.invitationInstallationDejaVue();
      if (premiereInvitation) {
        global.STIProfil.mettreAJour("invitationInstallationVue", true);
        if (invitation && global.matchMedia && global.matchMedia("(max-width: 860px), (pointer: coarse)").matches) {
          invitation.hidden = false;
        }
      }
      btnInstall.addEventListener("click", installerPwa);
      var btnInvitation = document.getElementById("pwaInvitationInstaller");
      var btnFermerInvitation = document.getElementById("pwaInvitationFermer");
      if (btnInvitation) btnInvitation.addEventListener("click", installerPwa);
      if (btnFermerInvitation) btnFermerInvitation.addEventListener("click", fermerInvitationPwa);
      global.addEventListener("beforeinstallprompt", majBoutonPwa);
      global.addEventListener("appinstalled", fermerInvitationPwa);
      global.addEventListener("sti:pwa-installee", fermerInvitationPwa);
      majBoutonPwa();
    }

    /* Enregistrement du Service Worker sur l'accueil */
    if (estPageAccueil() && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" }).catch(function () {});
    }
  }

  /* 9. Cours unifiés */
  function ouvrirVisionneuseDocument(urlRelative, titreDoc) {
    var pref = obtenirPrefixeRacine();
    var mod = document.getElementById("stiDocViewerModal");
    if (!mod) {
      mod = document.createElement("div");
      mod.className = "modal-backdrop";
      mod.id = "stiDocViewerModal";
      mod.setAttribute("role", "dialog");
      mod.setAttribute("aria-modal", "true");
      mod.innerHTML =
        '<div class="modal modal--wide" style="height:88vh;display:flex;flex-direction:column">' +
          '<div class="modal__head">' +
            '<h3 id="stiDocViewerTitle" style="font-size:1.05rem">Document</h3>' +
            '<div style="display:flex;gap:8px;align-items:center">' +
              '<a class="btn btn-secondary btn-sm" id="stiDocViewerExternal" href="#" target="_blank" rel="noopener">↗ Nouvel onglet</a>' +
              '<button type="button" class="modal__close" id="stiDocViewerClose" aria-label="Fermer">✕</button>' +
            "</div>" +
          "</div>" +
          '<iframe id="pdfFrame" src="about:blank" title="Visionneuse STI" style="flex:1;width:100%;border:1px solid var(--border);border-radius:var(--radius-md);background:#fff"></iframe>' +
        "</div>";
      document.body.appendChild(mod);

      var fermerDoc = function () {
        mod.classList.remove("is-open");
        var fr = document.getElementById("pdfFrame");
        if (fr && fr.contentWindow) {
          fr.contentWindow.location.replace("about:blank");
        }
      };
      mod.querySelector("#stiDocViewerClose").addEventListener("click", fermerDoc);
      mod.addEventListener("click", function (e) { if (e.target === mod) fermerDoc(); });
    }

    var cible = pref + String(urlRelative || "").replace(/^\.\.?\//, "");
    document.getElementById("stiDocViewerTitle").textContent = titreDoc || "Support STI";
    document.getElementById("stiDocViewerExternal").href = cible;
    var frame = document.getElementById("pdfFrame");
    if (frame && frame.contentWindow) {
      frame.contentWindow.location.replace(cible);
    } else if (frame) {
      frame.src = cible;
    }
    mod.classList.add("is-open");
  }
  global.openPdfModal = global.openPdfModal || ouvrirVisionneuseDocument;

  function detecterMatierePageCourante() {
    var pn = String((global.location && global.location.pathname) || "").toLowerCase();
    var m = pn.match(/\/cours\/(html5|css3|javascript|sql|php)\.html$/i);
    return m ? m[1].toLowerCase() : "";
  }

  /**
   * Redirige les anciennes pages d'exercices autonomes (ex. exercices/series-exercices.html)
   * vers l'onglet « Exercices » de la page matière unifiée correspondante.
   */
  function redirigerAnciennePageExercices() {
    var pn = String((global.location && global.location.pathname) || "").replace(/\\/g, "/");
    if (!/\/exercices\/series-exercices\.html$/i.test(pn)) return false;

    var hs = String(global.location.hash || "").replace(/^#/, "").toLowerCase();
    var qs = new URLSearchParams(global.location.search || "");
    var cle = hs || (qs.get("matiere") || "").toLowerCase();

    var correspondances = {
      html: "html5",
      html5: "html5",
      "html-css": "html5",
      css: "css3",
      css3: "css3",
      js: "javascript",
      javascript: "javascript",
      sql: "sql",
      bd: "sql",
      php: "php"
    };
    /* Les liens de matière reconnus gardent leur redirection ; sans matière explicite,
       conserver la page de séries historique et sa visionneuse média. */
    var matiereCible = correspondances[cle];
    if (!matiereCible) return false;
    global.location.replace("../cours/" + matiereCible + ".html#exercices");
    return true;
  }

  function initialiserPageMatiereUnifiee() {
    var idMat = detecterMatierePageCourante();
    /* Une page possédant déjà sa propre navigation unifiée ne doit pas recevoir
       une deuxième barre d'onglets ni voir son contenu historique masqué. */
    if (!idMat || !MATIERES[idMat] || document.getElementById("stiUnifiedCourseHub") ||
        (document.body && document.body.hasAttribute("data-course-unified"))) return;

    var mat = MATIERES[idMat];
    var pref = obtenirPrefixeRacine();
    var videosMatiere = CATALOGUE_VIDEOS.filter(function (v) { return videoDeMatiere(v, idMat); });

    /* Barre supérieure unifiée STI V2.0 (3 modes + Badge Abonné + Onglets Cours / Exercices / Annexes / Vidéos) */
    var barre = document.createElement("div");
    barre.id = "stiUnifiedCourseHub";
    barre.className = "sti-course-hub-bar";
    barre.innerHTML =
      '<div class="sti-course-hub-bar__inner">' +
        '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
          '<a class="btn btn-ghost btn-sm" href="' + pref + 'index.html#cours">← Accueil</a>' +
          '<span class="badge ' + mat.badgeClasse + '">' + mat.icone + " " + echapperHtml(mat.nom) + "</span>" +
        "</div>" +
        '<div class="sti-tabs" role="tablist" aria-label="Sections de la matière ' + echapperHtml(mat.nom) + '">' +
          '<button type="button" class="sti-tab-btn" role="tab" data-course-tab="cours" aria-selected="true">📖 Cours</button>' +
          '<button type="button" class="sti-tab-btn" role="tab" data-course-tab="exercices" aria-selected="false">📝 Exercices (' + mat.exercices.length + ")</button>" +
          '<button type="button" class="sti-tab-btn" role="tab" data-course-tab="annexes" aria-selected="false">📎 Annexes</button>' +
          '<button type="button" class="sti-tab-btn" role="tab" data-course-tab="videos" aria-selected="false">🎥 Vidéos (' + videosMatiere.length + ")</button>" +
        "</div>" +
        '<div style="display:flex;align-items:center;gap:8px">' +
          '<div class="theme-switcher" role="group" aria-label="Mode d\'affichage">' +
            '<button type="button" class="theme-switcher__btn" data-set-theme="clair" title="Mode clair">☀️</button>' +
            '<button type="button" class="theme-switcher__btn" data-set-theme="intermediaire" title="Mode intermédiaire">🌗</button>' +
            '<button type="button" class="theme-switcher__btn" data-set-theme="sombre" title="Mode sombre">🌙</button>' +
          "</div>" +
          '<div data-subscriber-slot></div>' +
        "</div>" +
      "</div>";

    /* Panneaux dédiés Exercices, Annexes et Vidéos */
    var zonePanneaux = document.createElement("div");
    zonePanneaux.id = "stiUnifiedCoursePanels";

    var exosHtml = mat.exercices.map(function (ex) {
      return (
        '<article class="tool-card">' +
          '<span class="badge ' + mat.badgeClasse + '">' + echapperHtml(ex.niveau) + "</span>" +
          "<h3>" + echapperHtml(ex.titre) + "</h3>" +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:auto;padding-top:10px">' +
            '<button type="button" class="btn btn-primary btn-sm" data-open-doc="' + echapperHtml(ex.enonce) + '" data-doc-title="' + echapperHtml(ex.titre + " — Énoncé") + '">📄 Énoncé</button>' +
            '<button type="button" class="btn btn-secondary btn-sm" data-open-doc="' + echapperHtml(ex.corrige) + '" data-doc-title="' + echapperHtml(ex.titre + " — Corrigé") + '">✅ Corrigé</button>' +
            (ex.ressources ? '<button type="button" class="btn btn-secondary btn-sm" data-open-doc="' + echapperHtml(ex.ressources) + '" data-doc-title="' + echapperHtml(ex.titre + " — Ressources") + '">🧰 Ressources</button>' : "") +
          "</div>" +
        "</article>"
      );
    }).join("");

    var vidsHtml = videosMatiere.map(function (v) {
      var poster = creerPosterSvgDataUri(v.titre, v.nomMatiere, v.couleur, v.codeApercu);
      return (
        '<article class="card">' +
          '<h3 style="margin-bottom:10px">🎬 ' + echapperHtml(v.titre) + " (" + echapperHtml(v.dureeTexte) + ")</h3>" +
          '<div class="video-player-shell" style="border-radius:var(--radius-md);overflow:hidden;aspect-ratio:16/9">' +
            '<video controls preload="metadata" playsinline poster="' + echapperHtml(poster) + '">' +
              '<source src="' + echapperHtml(pref + v.srcPrincipal) + '" type="video/mp4">' +
              (v.srcSecours !== v.srcPrincipal ? '<source src="' + echapperHtml(pref + v.srcSecours) + '" type="video/mp4">' : "") +
            "</video>" +
          "</div>" +
        "</article>"
      );
    }).join("");

    zonePanneaux.innerHTML =
      '<section class="sti-course-hub-panel sti-tab-panel" data-course-panel="exercices" hidden>' +
        '<div class="section-header"><div><span class="section-kicker">Application directe</span><h2>📝 Séries d\'exercices — ' + echapperHtml(mat.nom) + '</h2></div>' +
        '<a class="btn btn-primary btn-sm" href="' + echapperHtml(pref + mat.urlQuiz) + '">🎯 Passer au Quiz ' + echapperHtml(mat.nom) + "</a></div>" +
        '<div class="tools-grid">' + exosHtml + "</div>" +
      "</section>" +
      '<section class="sti-course-hub-panel sti-tab-panel" data-course-panel="annexes" hidden>' +
        '<div class="section-header"><div><span class="section-kicker">Référence officielle Bac</span><h2>📎 Annexe officielle — ' + echapperHtml(mat.nom) + '</h2></div>' +
        '<a class="btn btn-secondary btn-sm" href="' + echapperHtml(pref + mat.urlAnnexePdf) + '" download>⤓ Télécharger le PDF</a></div>' +
        '<iframe src="' + echapperHtml(pref + mat.urlAnnexe) + '" title="Annexe ' + echapperHtml(mat.nom) + '" style="width:100%;height:75vh;border:1px solid var(--border);border-radius:var(--radius-lg);background:#fff"></iframe>' +
      "</section>" +
      '<section class="sti-course-hub-panel sti-tab-panel" data-course-panel="videos" hidden>' +
        '<div class="section-header"><div><span class="section-kicker">Multimédia & Audio</span><h2>🎥 Vidéos explicatives & écoute vocale — ' + echapperHtml(mat.nom) + "</h2></div></div>" +
        '<div class="card" style="margin-bottom:18px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">' +
          '<strong>🔊 Podcast audio du cours (' + echapperHtml(mat.nom) + ')</strong>' +
          '<audio controls preload="metadata" src="' + echapperHtml(pref + mat.urlAudio) + '"></audio>' +
        "</div>" +
        '<div style="display:grid;gap:20px">' + vidsHtml + "</div>" +
      "</section>";

    /* Masquer les anciens liens flottants vers series-exercices.html devenu obsolète */
    var ancienNav = document.getElementById("stix-nav");
    if (ancienNav) ancienNav.style.display = "none";

    var enfantsOrigine = Array.prototype.slice.call(document.body.children);
    document.body.insertBefore(zonePanneaux, document.body.firstChild);
    document.body.insertBefore(barre, zonePanneaux);

    function activerOngletMatiere(nomOnglet) {
      var cible = ["cours", "exercices", "annexes", "videos"].indexOf(nomOnglet) !== -1 ? nomOnglet : "cours";
      barre.querySelectorAll("[data-course-tab]").forEach(function (b) {
        b.setAttribute("aria-selected", b.getAttribute("data-course-tab") === cible ? "true" : "false");
      });
      zonePanneaux.querySelectorAll("[data-course-panel]").forEach(function (p) {
        p.hidden = p.getAttribute("data-course-panel") !== cible;
      });
      enfantsOrigine.forEach(function (el) {
        if (el.tagName === "SCRIPT" || el.tagName === "STYLE" || el.tagName === "LINK") return;
        if (el.id && /^sti-/i.test(el.id)) return;
        el.style.display = cible === "cours" ? "" : "none";
      });
    }

    barre.addEventListener("click", function (ev) {
      var b = ev.target && ev.target.closest ? ev.target.closest("[data-course-tab]") : null;
      if (!b) return;
      var ong = b.getAttribute("data-course-tab");
      activerOngletMatiere(ong);
      try {
        history.replaceState(history.state, "", "#" + ong);
      } catch (e) {}
    });

    zonePanneaux.addEventListener("click", function (ev) {
      var bDoc = ev.target && ev.target.closest ? ev.target.closest("[data-open-doc]") : null;
      if (!bDoc) return;
      ouvrirVisionneuseDocument(bDoc.getAttribute("data-open-doc"), bDoc.getAttribute("data-doc-title"));
    });

    function lireOngletDepuisUrl() {
      var hs = String(global.location.hash || "").replace(/^#/, "").toLowerCase();
      var qs = new URLSearchParams(global.location.search || "");
      var param = (qs.get("onglet") || qs.get("tab") || "").toLowerCase();
      if (["exercices", "annexes", "videos", "cours"].indexOf(hs) !== -1) {
        activerOngletMatiere(hs);
      } else if (["exercices", "annexes", "videos", "cours"].indexOf(param) !== -1) {
        activerOngletMatiere(param);
      }
    }
    lireOngletDepuisUrl();
    global.addEventListener("hashchange", lireOngletDepuisUrl);

    /* Mémorisation automatique de la progression de lecture via STIProfil */
    var timerLecture = 0;
    global.addEventListener("scroll", function () {
      if (timerLecture || !global.STIProfil) return;
      timerLecture = setTimeout(function () {
        timerLecture = 0;
        var h = document.documentElement;
        var max = h.scrollHeight - h.clientHeight;
        if (max <= 80) return;
        var pct = Math.max(5, Math.min(100, Math.round((h.scrollTop / max) * 100)));
        global.STIProfil.mettreAJour("derniereLecture", {
          matiere: idMat,
          chapitre: mat.nom + " — Cours complet",
          pourcent: pct,
          url: mat.urlCours
        });
      }, 900);
    }, { passive: true });

    rendreBadgeAbonne();
    rafraichirBoutonsTheme();
  }

  /* 10. Tableau de bord abonné */
  function rendreTableauDeBord() {
    var racineDash = document.getElementById("stiDashboardRoot");
    if (!racineDash || !global.STIProfil) return;

    var profil = global.STIProfil.chargerProfil();
    var etat = global.STIProfil.lireEtatSession();
    var rev = calculerResumeRevision();
    var ok4 = estAutorise4SI();
    var pref = obtenirPrefixeRacine();

    /* 1. En-tête et anneau de progression */
    var elAvatar = document.getElementById("dashAvatar");
    var elWelcome = document.getElementById("dashWelcomeName");
    var elSub = document.getElementById("dashSessionStatus");
    var champPrenom = document.getElementById("dashPrenomInput");
    var anneauCercle = document.getElementById("dashProgressCircle");
    var anneauTexte = document.getElementById("dashProgressLabel");

    var nomAffiche = profil.prenom || etat.prenom || "Abonné";
    if (elAvatar) elAvatar.textContent = etat.initiales || nomAffiche.slice(0, 2).toUpperCase();
    if (elWelcome) elWelcome.textContent = nomAffiche;
    if (champPrenom && document.activeElement !== champPrenom) {
      champPrenom.value = profil.prenom || "";
    }
    if (elSub) {
      elSub.innerHTML = etat.estGold
        ? '<span class="badge badge-gold">⭐ Abonné GOLD · Synchronisation Cloud active</span>'
        : (etat.connecte
            ? '<span class="badge badge-sql">☁️ Connecté (' + echapperHtml(etat.email) + ")</span>"
            : '<a class="badge" href="' + pref + 'portail.html">💾 Mode local · Se connecter sur portail.html pour synchroniser</a>');
    }
    if (anneauCercle) {
      var circonf = 2 * Math.PI * 34; /* r=34 => ~213.6 */
      anneauCercle.style.strokeDasharray = String(circonf);
      anneauCercle.style.strokeDashoffset = String(circonf * (1 - rev.pourcent / 100));
    }
    if (anneauTexte) anneauTexte.textContent = rev.pourcent + "%";

    /* 2. Reprise de lecture */
    var contReprise = document.getElementById("dashResumeContent");
    if (contReprise) {
      if (profil.derniereLecture && profil.derniereLecture.url) {
        var dl = profil.derniereLecture;
        contReprise.innerHTML =
          '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:10px">' +
            "<div>" +
              '<span class="badge">' + echapperHtml((dl.matiere || "cours").toUpperCase()) + "</span>" +
              '<h3 style="margin-top:6px">' + echapperHtml(dl.chapitre || "Continuer mon cours") + "</h3>" +
            "</div>" +
            '<a class="btn btn-primary btn-sm" href="' + echapperHtml(pref + dl.url) + '">Reprendre (' + dl.pourcent + " %) ➜</a>" +
          "</div>" +
          '<div class="progress-bar"><div class="progress-bar__fill" style="width:' + dl.pourcent + '%"></div></div>';
      } else {
        contReprise.innerHTML =
          '<p style="margin-bottom:12px">Vous n\'avez pas encore entamé de chapitre. Choisissez une matière pour démarrer votre parcours !</p>' +
          '<a class="btn btn-secondary btn-sm" href="' + pref + 'index.html#cours">📚 Explorer les 5 matières</a>';
      }
    }

    /* 3. Progression par matière */
    var badgeProg = document.getElementById("dashRevisedBadge");
    var listeProg = document.getElementById("dashSubjectsList");
    if (badgeProg) badgeProg.textContent = rev.faits + " / " + rev.total + " révisés";
    if (listeProg) {
      var clesMat = ok4 ? ["html5", "css3", "javascript", "sql", "php"] : ["html5", "css3", "javascript", "sql"];
      listeProg.innerHTML = clesMat.map(function (id) {
        var m = MATIERES[id];
        var fait = Boolean(profil.progression && profil.progression[id]);
        return (
          '<div class="dash-row">' +
            '<div style="display:flex;align-items:center;gap:10px">' +
              '<span style="font-size:1.3rem">' + m.icone + "</span>" +
              "<div>" +
                '<strong style="display:block">' + echapperHtml(m.nom) + "</strong>" +
                '<div style="display:flex;gap:8px;font-size:.76rem;color:var(--text-muted);margin-top:2px">' +
                  '<a href="' + pref + m.urlCours + '#cours">Cours</a>·' +
                  '<a href="' + pref + m.urlCours + '#exercices">Exercices</a>·' +
                  '<a href="' + pref + m.urlCours + '#annexes">Annexes</a>·' +
                  '<a href="' + pref + m.urlCours + '#videos">Vidéos (' + CATALOGUE_VIDEOS.filter(function (v) { return videoDeMatiere(v, m.id) && (!v.reserve4si || ok4); }).length + ")</a>" +
                "</div>" +
              "</div>" +
            "</div>" +
            '<button type="button" class="revise-btn" data-toggle-course="' + m.id + '" aria-pressed="' + (fait ? "true" : "false") + '">' +
              (fait ? "✓ Révisé" : "○ À réviser") +
            "</button>" +
          "</div>"
        );
      }).join("");
    }

    /* 4. Quiz et erreurs */
    var contQuiz = document.getElementById("dashQuizList");
    if (contQuiz) {
      if (!profil.quiz.length) {
        contQuiz.innerHTML =
          '<p style="font-size:.88rem;margin-bottom:10px">Aucun score enregistré dans votre carnet pour l\'instant.</p>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
            '<a class="btn btn-secondary btn-sm" href="' + pref + 'quiz/html-css.html">🎨 Quiz HTML/CSS</a>' +
            '<a class="btn btn-secondary btn-sm" href="' + pref + 'quiz/javascript.html">⚡ Quiz JS</a>' +
            '<a class="btn btn-secondary btn-sm" href="' + pref + 'quiz/sql.html">🗄️ Quiz SQL</a>' +
            (ok4 ? '<a class="btn btn-secondary btn-sm" href="' + pref + 'quiz/php.html">🐘 Quiz PHP</a>' : "") +
          "</div>";
      } else {
        contQuiz.innerHTML = profil.quiz.slice(0, 6).map(function (q) {
          var pct = Math.round((q.score / q.total) * 100);
          return (
            '<div class="dash-row">' +
              "<div>" +
                '<strong>' + echapperHtml(q.matiere) + "</strong>" +
                '<div style="font-size:.76rem;color:var(--text-muted)">📅 ' + echapperHtml(q.date || "Récent") +
                  (q.erreurs && q.erreurs.length ? " · " + q.erreurs.length + " erreur(s) à revoir" : " · Sans faute") +
                "</div>" +
              "</div>" +
              '<span class="badge ' + (pct >= 70 ? "badge-sql" : "badge-html") + '">' + q.score + " / " + q.total + " (" + pct + "%)</span>" +
            "</div>"
          );
        }).join("");
      }
    }

    /* 5. Vidéos vues ou à reprendre */
    var contVideos = document.getElementById("dashVideosList");
    var badgeVid = document.getElementById("dashVideosBadge");
    var vidsDispo = CATALOGUE_VIDEOS.filter(function (v) { return !v.reserve4si || ok4; });
    var vuesSet = (profil.videos && profil.videos.vues) || [];
    var nbVues = vidsDispo.filter(function (v) { return vuesSet.indexOf(v.id) !== -1; }).length;
    if (badgeVid) badgeVid.textContent = nbVues + " / " + vidsDispo.length + " vues";

    if (contVideos) {
      var blocReprendre = "";
      var derV = profil.videos && profil.videos.derniere;
      if (derV && derV.id && derV.temps > 5) {
        blocReprendre =
          '<div class="alert alert-info" style="margin-bottom:12px;align-items:center;justify-content:space-between;flex-wrap:wrap">' +
            '<div><strong>⏯ À reprendre : ' + echapperHtml(derV.titre) + '</strong><div style="font-size:.78rem;color:var(--text-muted)">Arrêté à ' + formaterDureeSecondes(derV.temps) + "</div></div>" +
            '<button type="button" class="btn btn-primary btn-sm" data-play-video="' + echapperHtml(derV.id) + '" data-start-time="' + derV.temps + '">▶ Reprendre</button>' +
          "</div>";
      }
      contVideos.innerHTML = blocReprendre + vidsDispo.map(function (v) {
        var vue = vuesSet.indexOf(v.id) !== -1;
        return (
          '<div class="dash-row">' +
            '<div><span class="badge ' + v.badgeClasse + '" style="margin-inline-end:6px">' + v.nomMatiere + "</span><strong>" + echapperHtml(v.titre) + "</strong></div>" +
            '<div style="display:flex;align-items:center;gap:8px">' +
              (vue ? '<span class="badge badge-sql">✓ Vue</span>' : '<span class="badge">' + v.dureeTexte + "</span>") +
              '<button type="button" class="btn btn-ghost btn-sm" data-play-video="' + echapperHtml(v.id) + '">▶</button>' +
            "</div>" +
          "</div>"
        );
      }).join("");
    }

    /* 6. Notes envoyées au professeur */
    var contNotes = document.getElementById("dashNotesList");
    var badgeMoy = document.getElementById("dashNotesAvgBadge");
    if (contNotes) {
      if (!profil.notes.length) {
        if (badgeMoy) badgeMoy.textContent = "— / 20";
        contNotes.innerHTML =
          '<p style="font-size:.88rem;margin-bottom:10px">Aucune note d\'atelier (/20) transmise pour le moment.</p>' +
          '<button type="button" class="btn btn-secondary btn-sm" id="dashLaunchExamBtn">📝 Passer un Examen Blanc (/20)</button>';
        var bEx = document.getElementById("dashLaunchExamBtn");
        if (bEx) {
          bEx.addEventListener("click", function () {
            if (typeof global.ouvrirExamenBlancSTI === "function") global.ouvrirExamenBlancSTI();
            else global.location.href = pref + "bac-pratique.html";
          });
        }
      } else {
        var somme = profil.notes.reduce(function (acc, n) { return acc + Number(n.note || 0); }, 0);
        var moy = (somme / profil.notes.length).toFixed(2);
        if (badgeMoy) badgeMoy.textContent = "Moyenne : " + moy + " / 20";
        contNotes.innerHTML = profil.notes.map(function (n) {
          return (
            '<div class="dash-row">' +
              '<div><strong>' + echapperHtml(n.atelier) + '</strong><div style="font-size:.76rem;color:var(--text-muted)">📅 ' + echapperHtml(n.date || "") + "</div></div>" +
              '<span class="badge badge-gold">' + Number(n.note).toFixed(2).replace(/\.00$/, "") + " / 20</span>" +
            "</div>"
          );
        }).join("");
      }
    }

    /* 7. Préférences actives */
    document.querySelectorAll("[data-set-lang]").forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-set-lang") === profil.langue ? "true" : "false");
    });
    document.querySelectorAll("[data-set-fontsize]").forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-set-fontsize") === profil.tailleTexte ? "true" : "false");
    });
    rafraichirBoutonsTheme();
  }

  function initialiserEvenementsDashboard() {
    var racineDash = document.getElementById("stiDashboardRoot");
    if (!racineDash || !global.STIProfil) return;

    var formPrenom = document.getElementById("dashPrenomForm");
    var inpPrenom = document.getElementById("dashPrenomInput");
    if (formPrenom && inpPrenom) {
      formPrenom.addEventListener("submit", function (ev) {
        ev.preventDefault();
        global.STIProfil.mettreAJour("prenom", inpPrenom.value.trim());
        rendreBadgeAbonne();
        rendreTableauDeBord();
      });
    }

    racineDash.addEventListener("click", function (ev) {
      var bLang = ev.target && ev.target.closest ? ev.target.closest("[data-set-lang]") : null;
      if (bLang) {
        global.STIProfil.mettreAJour("langue", bLang.getAttribute("data-set-lang"));
        appliquerTraductionsPage();
        rendreBadgeAbonne();
        rendreTableauDeBord();
        return;
      }

      var bTaille = ev.target && ev.target.closest ? ev.target.closest("[data-set-fontsize]") : null;
      if (bTaille) {
        global.STIProfil.mettreAJour("tailleTexte", bTaille.getAttribute("data-set-fontsize"));
        rendreTableauDeBord();
      }
    });

    var btnReset = document.getElementById("btnResetProfil");
    if (btnReset) {
      btnReset.addEventListener("click", function () {
        if (global.confirm("Réinitialiser vos préférences et progressions locales sur cet appareil ?")) {
          global.STIProfil.reinitialiser();
          appliquerTraductionsPage();
          rendreBadgeAbonne();
          rendreTableauDeBord();
          chargerNouveautesAccueilEtDashboard();
        }
      });
    }

    var btnCompte = document.getElementById("dashOuvrirCompte");
    if (btnCompte) btnCompte.addEventListener("click", function () {
      var roue = document.getElementById("sti-roue-btn");
      if (roue) roue.click(); else global.location.href = obtenirPrefixeRacine() + "portail.html";
    });

    var btnLogout = document.getElementById("btnDashboardLogout");
    if (btnLogout) {
      btnLogout.addEventListener("click", declencherDeconnexion);
    }

  }

  /* 11. Scores de quiz */
  function connecterPontQuizEtAteliers() {
    var origEnregistrer = global.enregistrerScoreQuizSTI;
    if (typeof origEnregistrer === "function" && !origEnregistrer._pontProfilSti) {
      var enveloppe = function (nomQuiz, noteTexte, sur20) {
        try {
          if (global.STIProfil) {
            var p = global.STIProfil.chargerProfil();
            var dateIso = new Date().toISOString().slice(0, 10);
            var scoreNum = Number(sur20);
            if (!isFinite(scoreNum)) {
              var m = String(noteTexte || "").match(/(\d+(?:[.,]\d+)?)/);
              scoreNum = m ? parseFloat(m[1].replace(",", ".")) : 0;
            }
            if (/atelier|bac|examen/i.test(String(nomQuiz || ""))) {
              p.notes.unshift({ atelier: String(nomQuiz), note: scoreNum, date: dateIso });
              p.notes = p.notes.slice(0, 20);
            } else {
              p.quiz.unshift({ matiere: String(nomQuiz || "Quiz STI"), score: scoreNum, total: 20, date: dateIso, erreurs: [] });
              p.quiz = p.quiz.slice(0, 25);
            }
            global.STIProfil.sauvegarderProfil(p, false);
          }
        } catch (e) {}
        return origEnregistrer.apply(this, arguments);
      };
      enveloppe._pontProfilSti = true;
      global.enregistrerScoreQuizSTI = enveloppe;
    }
  }

  /* Le temps de lecture est indicatif : texte des chapitres à 180 mots/minute,
     sans les commandes ni les vidéos. La valeur HTML reste lisible sans script. */
  function estimerLectureCours() {
    var cible = document.querySelector("[data-estimation-lecture]");
    if (!cible) return;
    var chapitres = document.querySelectorAll('[data-course-panel="cours"] [data-chapter-id]');
    if (!chapitres.length) return;
    var texte = Array.prototype.map.call(chapitres, function (chapitre) {
      var copie = chapitre.cloneNode(true);
      Array.prototype.forEach.call(copie.querySelectorAll('script,style,button,nav,svg,audio,video,iframe,[aria-hidden="true"]'), function (element) { element.remove(); });
      return copie.textContent || "";
    }).join(" ");
    var mots = texte.match(/[A-Za-zÀ-ÖØ-öø-ÿ0-9]+(?:['’_-][A-Za-zÀ-ÖØ-öø-ÿ0-9]+)*/g) || [];
    cible.textContent = Math.max(1, Math.ceil(mots.length / 180)) + " min";
  }

  /* Les identifiants correspondent aux vrais chapitres des cinq cours. */
  var CHAPITRES_ACCUEIL = {
    html5: ["entete", "structuration", "conteneurs", "listes", "tableaux", "texte-media", "attributs-evenements", "target-explication", "formulaires", "iframe"],
    css3: ["selecteurs", "typographie", "arriere-plan", "boite-display", "marges-debordement", "positionnement", "tableaux-listes", "filtres", "animations", "pas-a-pas"],
    javascript: ["sec1", "sec2", "sec3", "sec4", "sec5", "sec6", "sec7", "sec8", "sec9", "sec10", "sec11", "sec12", "sec13", "sec14", "sec15"],
    sql: ["intro", "ldd", "lmd", "bac"],
    php: ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9", "s10"]
  };
  var minuteurCompteAccueil = 0;
  var delaiCompteAccueil = 1200;
  var compteVisitesEnMemoire = "";
  var visitesEnMemoire = [];

  /* Le pull cloud peut remplacer le profil entier. Garder les visites locales
     déjà connues, uniquement pour le même compte, jusqu'à sa restauration. */
  function memoriserVisitesDuCompte(etat) {
    if (!etat.connecte || etat.compteEnAttente) {
      compteVisitesEnMemoire = "";
      visitesEnMemoire = [];
      return;
    }
    var compte = etat.id || (etat.email ? "email:" + etat.email.toLowerCase() : "session-locale");
    if (compteVisitesEnMemoire !== compte) {
      compteVisitesEnMemoire = compte;
      visitesEnMemoire = [];
    }
    global.STIProfil.chargerProfil().coursVisites.forEach(function (m) {
      if (visitesEnMemoire.indexOf(m) === -1) visitesEnMemoire.push(m);
    });
  }

  /* Une prévisualisation interne ne doit pas créer une visite de cours. */
  function estDansIframeInterne() {
    try {
      if (global.frameElement) return true;
      if (global.self && global.top && global.self !== global.top) {
        return Boolean(global.top.location && global.top.location.origin === global.location.origin);
      }
    } catch (e) { return false; } /* Aperçu externe, par exemple dans un navigateur intégré. */
    return false;
  }

  function marquerCoursEffectivementOuvert(etat) {
    var matiere = detecterMatierePageCourante();
    if (!matiere || !etat.connecte || etat.compteEnAttente || document.prerendering || estDansIframeInterne()) return;
    /* Le verrou existant reste l'unique source d'autorisation pour le PHP. */
    if (matiere === "php" && !estAutorise4SI()) return;
    global.STIProfil.enregistrerVisiteCours(matiere);
  }

  /* v498 : la vidéo de fond ne tourne que quand le bloc « Bonjour » est visible. */
  function piloterVideoAccueil(actif) {
    var video = document.getElementById("welcomeFondVideo");
    if (!video || typeof video.play !== "function") return;
    try {
      /* v499 : la boucle du fond est garantie — un lecteur mis en pause par erreur
         (économie d'énergie, retour d'onglet) repart tout seul. */
      if (!video.__stiBoucleFond) {
        video.__stiBoucleFond = true;
        video.addEventListener("ended", function () {
          if (!video.loop) return;
          try {
            var relance = video.play();
            if (relance && typeof relance.catch === "function") relance.catch(function () {});
          } catch (e) {}
        });
        video.addEventListener("pause", function () {
          var section = document.getElementById("welcomeReturn");
          if (!section || section.hidden || document.hidden) return;
          setTimeout(function () {
            if (!video.paused) return;
            var s2 = document.getElementById("welcomeReturn");
            if (!s2 || s2.hidden || document.hidden) return;
            try {
              var relance = video.play();
              if (relance && typeof relance.catch === "function") relance.catch(function () {});
            } catch (e) {}
          }, 600);
        });
      }
      if (actif) {
        var p = video.play();
        if (p && typeof p.catch === "function") p.catch(function () {});
      } else {
        video.pause();
      }
    } catch (e) {}
  }

  function rendreAccueilPersonnalise(etat) {
    var section = document.getElementById("welcomeReturn");
    if (!section || !global.STIProfil) return;
    var zone = document.getElementById("welcomeCourses");
    var vide = document.getElementById("welcomeEmpty");
    var compteur = document.getElementById("welcomeCount");
    var nom = document.getElementById("welcomePrenom");
    if (!etat.connecte) {
      section.hidden = true;
      piloterVideoAccueil(false);
      zone.replaceChildren();
      zone._signatureAccueil = "";
      nom.textContent = "";
      return;
    }
    section.hidden = false;
    piloterVideoAccueil(true);
    /* GOLD seul ne fait pas d'un abonné l'administrateur. */
    var emailAdmin = global.STI_AUTH && global.STI_AUTH.ADMIN;
    nom.textContent = emailAdmin && String(etat.email || "").trim().toLowerCase() === String(emailAdmin).trim().toLowerCase()
      ? "Aymen" : (etat.prenomCompte || etat.prenom || "Abonné");
    /* v498 : le ruban du prénom suit la présence réelle du texte. */
    try {
      if (global.STINewsPerso && global.STINewsPerso.appliquerRuban) global.STINewsPerso.appliquerRuban();
    } catch (eRuban) {}
    if (etat.compteEnAttente) {
      compteur.textContent = "Synchronisation des cours…";
      compteur.removeAttribute("aria-label");
      zone.replaceChildren();
      zone._signatureAccueil = "";
      vide.hidden = true;
      return;
    }

    var profil = global.STIProfil.chargerProfil();
    var ok4 = estAutorise4SI();
    var visites = global.STIProfil.listerCoursVisites().filter(function (id) { return id !== "php" || ok4; });
    compteur.textContent = visites.length + " en cours";
    compteur.setAttribute("aria-label", visites.length + " cours déjà visités");
    vide.hidden = visites.length !== 0;

    var pref = obtenirPrefixeRacine();
    var cartes = visites.map(function (id) {
      var matiere = MATIERES[id];
      var chapitres = CHAPITRES_ACCUEIL[id].filter(function (chapitre) { return id !== "sql" || chapitre !== "bac" || ok4; });
      var etats = profil.chapitres[id] || {};
      var revises = chapitres.filter(function (chapitre) { return etats[chapitre] === "revise"; }).length;
      var consultes = chapitres.filter(function (c) { return etats[c] === "revise" || etats[c] === "en_cours"; }).length;
      var derniere = profil.derniereLecture || {};
      var ancre = derniere.matiere === id && chapitres.indexOf(derniere.chapitreId) !== -1 ? "#" + derniere.chapitreId : "";
      return { id: id, titre: matiere.nom, href: pref + matiere.urlCours + ancre, revises: revises, consultes: consultes, total: chapitres.length };
    });
    var signature = JSON.stringify(cartes);
    if (zone._signatureAccueil === signature) return;
    var lienActif = document.activeElement && document.activeElement.closest && document.activeElement.closest("[data-welcome-course]");
    var focusId = lienActif && zone.contains(lienActif) ? lienActif.getAttribute("data-welcome-course") : "";
    zone.innerHTML = cartes.map(function (c) {
      return '<a class="welcome-course welcome-course--' + c.id + '" data-welcome-course="' + c.id + '" href="' + c.href + '">' +
        '<span class="welcome-course__cover"><span class="welcome-course__icon" aria-hidden="true"><svg><use href="' + pref + 'assets/icons/matieres.svg#' + c.id + '"></use></svg></span></span>' +
        '<span class="welcome-course__body"><strong class="welcome-course__title">' + echapperHtml(c.titre) + '</strong>' +
        '<span class="welcome-course__details">Cours · ' + c.consultes + ' / ' + c.total + ' chapitres consultés · Continuer →</span></span>' +
        '<span class="welcome-course__state">' + (c.revises ? c.revises + " / " + c.total + " révisés" : "Consulté") + '</span></a>';
    }).join("");
    zone._signatureAccueil = signature;
    if (focusId) {
      var nouveauLien = zone.querySelector('[data-welcome-course="' + focusId + '"]') || section.querySelector(".welcome-return__dashboard");
      if (nouveauLien) nouveauLien.focus({ preventScroll: true });
    }
  }

  function actualiserAccueilEtVisite() {
    if (!global.STIProfil) return;
    var etat = global.STIProfil.lireEtatSession();
    marquerCoursEffectivementOuvert(etat);
    memoriserVisitesDuCompte(etat);
    rendreAccueilPersonnalise(etat);
    rafraichirBandeauRepriseAccueil();
    /* En cas de changement de compte dans le même onglet, attendre la purge
       de l'ancien profil effectuée par le synchroniseur existant. */
    if (etat.connecte && etat.compteEnAttente) {
      if (!minuteurCompteAccueil) {
        minuteurCompteAccueil = global.setTimeout(function () {
          minuteurCompteAccueil = 0;
          actualiserAccueilEtVisite();
        }, delaiCompteAccueil);
        delaiCompteAccueil = Math.min(delaiCompteAccueil * 2, 12000);
      }
    } else {
      if (minuteurCompteAccueil) global.clearTimeout(minuteurCompteAccueil);
      minuteurCompteAccueil = 0;
      delaiCompteAccueil = 1200;
    }
  }

  /* 12. Initialisation */
  function demarrerApplication() {
    if (redirigerAnciennePageExercices()) return;
    estimerLectureCours();
    initialiserPageMatiereUnifiee();
    actualiserAccueilEtVisite();
    appliquerTraductionsPage();
    initialiserSelecteursTheme();
    rendreBadgeAbonne();
    initialiserClicBadgeAbonne();
    initialiserVideoHero();
    initialiserSectionVideos();
    initialiserTerminalHero();
    initialiserCompteursStats();
    initialiserAnimationsOutils();
    rafraichirUIRevisionAccueil();
    rafraichirBandeauRepriseAccueil();
    initialiserRechercheEtFiltres();
    initialiserNavigationEtModalesCommunes();
    chargerNouveautesAccueilEtDashboard();
    rendreTableauDeBord();
    initialiserEvenementsDashboard();
    connecterPontQuizEtAteliers();

    var btnFermerReprise = document.getElementById("resumeCloseBtn");
    if (btnFermerReprise) btnFermerReprise.addEventListener("click", masquerBandeauRepriseAccueil);

    global.addEventListener("sti:profil-maj", function () {
      var etat = global.STIProfil.lireEtatSession();
      memoriserVisitesDuCompte(etat);
      rendreAccueilPersonnalise(etat);
      appliquerTraductionsPage();
      rafraichirBoutonsTheme();
      rendreBadgeAbonne();
      rafraichirTiroirAbonne();
      rafraichirUIRevisionAccueil();
      rafraichirBandeauRepriseAccueil();
      rendreGrilleVideosAccueil();
      rendreTableauDeBord();
    });

    global.addEventListener("sti:session-maj", function () {
      actualiserAccueilEtVisite();
      rendreBadgeAbonne();
      rafraichirTiroirAbonne();
      rendreGrilleVideosAccueil();
      rendreTableauDeBord();
    });

    /* Les restaurations cloud et les autres onglets modifient le journal sans
       notification localStorage dans l'onglet courant. */
    global.addEventListener("sti-cloud-restored", function () {
      var etat = global.STIProfil.lireEtatSession();
      var compte = etat.id || (etat.email ? "email:" + etat.email.toLowerCase() : "session-locale");
      if (etat.connecte && !etat.compteEnAttente && compteVisitesEnMemoire === compte && visitesEnMemoire.length) {
        global.STIProfil.fusionnerCoursVisites(visitesEnMemoire);
      }
      actualiserAccueilEtVisite();
    });
    global.addEventListener("sti:profil-reset", function () {
      compteVisitesEnMemoire = "";
      visitesEnMemoire = [];
    });
    global.addEventListener("storage", function (ev) {
      if (!ev) return;
      if (!ev.key || (ev.key === "sti-profil-abonne" && ev.newValue === null)) {
        compteVisitesEnMemoire = "";
        visitesEnMemoire = [];
      } else if (ev.key === "sti-profil-abonne") {
        var etat = global.STIProfil.lireEtatSession();
        var compte = etat.id || (etat.email ? "email:" + etat.email.toLowerCase() : "session-locale");
        if (etat.connecte && !etat.compteEnAttente && compteVisitesEnMemoire === compte) {
          global.STIProfil.fusionnerCoursVisites(visitesEnMemoire);
        }
      }
      if (!ev.key || ev.key === "sti-pages-vues-v432") actualiserAccueilEtVisite();
    });
    document.addEventListener("prerenderingchange", actualiserAccueilEtVisite);
    global.addEventListener("online", actualiserAccueilEtVisite);

    global.addEventListener("pageshow", function (ev) {
      if (ev && ev.persisted) {
        actualiserAccueilEtVisite();
        rendreBadgeAbonne();
        rafraichirUIRevisionAccueil();
        rafraichirBandeauRepriseAccueil();
        rendreGrilleVideosAccueil();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", demarrerApplication);
  } else {
    demarrerApplication();
  }
})(window, document);
