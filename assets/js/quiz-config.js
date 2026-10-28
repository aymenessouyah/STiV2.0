/* ============================================================================
   STI V2.0 — CONFIGURATION DES 5 ARÈNES DE QUIZ (assets/js/quiz-config.js)
   ----------------------------------------------------------------------------
   Une seule source de vérité pour quiz.js. Les questions ne sont PAS régénérées :
   elles viennent des fichiers assets/data/questions-*.js, extraits mot pour mot
   des pages de référence (187 / 106 / 140 / 176 questions).

   Chaque entrée décrit :
     - l'identité (titre, accent, emoji, lien vers le ou les cours),
     - les modes de jeu et les mécaniques activées,
     - la fonction « normaliser » qui met la banque d'origine dans un format
       interne unique { id, cat, catNom, diff, q, options, answer, explain,
       hint, code, demo } SANS modifier le texte des questions.

   JavaScript natif, aucune dépendance, commentaires en français.
   ========================================================================== */
(function () {
  'use strict';

  var D = window;   /* raccourci de lecture */

  function escHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* Les explications des banques d'origine contiennent déjà du HTML simple
     (<b>, <code>, <br>) : on le conserve, seul le texte brut est échappé
     lorsqu'il n'y a pas de balise. */
  function explication(s) {
    var v = String(s == null ? '' : s);
    return /<\/?[a-z][^>]*>/i.test(v) ? v : escHtml(v);
  }

  /* --------------------------------------------------------------------------
     1. HTML5 & CSS3 — Quizzora (187 questions, 12 thèmes, 48 démos)
     ------------------------------------------------------------------------ */
  function questionsHtmlCss() {
    var cats = D.STI_QUIZ_HTMLCSS_CATEGORIES || {};
    var demos = D.STI_QUIZ_HTMLCSS_DEMOS || {};
    var icones = D.STI_QUIZ_HTMLCSS_ICONES || {};
    var conseils = D.STI_QUIZ_HTMLCSS_CONSEILS || {};
    var liste = [], n = 0;
    Object.keys(cats).forEach(function (cle) {
      (cats[cle].questions || []).forEach(function (q) {
        liste.push({
          id: 'hc-' + (++n),
          cat: cle,
          catNom: cats[cle].name || cle,
          catIcone: icones[cle] || '📘',
          diff: 'Moyen',
          q: q.text,
          options: q.options.slice(),
          answer: q.correct,
          explain: explication(conseils[cle] || 'Relis le chapitre correspondant du cours pour consolider cette notion.'),
          hint: '',
          code: '',
          demo: demos[q.text] || ''
        });
      });
    });
    return liste;
  }

  /* --------------------------------------------------------------------------
     2. JavaScript — Arène JavaScript (106 questions)
     ------------------------------------------------------------------------ */
  function questionsJavascript() {
    return (D.STI_QUIZ_JS_QUESTIONS || []).map(function (q, i) {
      return {
        id: 'js-' + (i + 1),
        cat: q.category,
        catNom: q.category,
        catIcone: '⚡',
        diff: q.difficulty || 'MOYEN',
        q: q.title,
        options: q.options.slice(),
        answer: q.answer,
        explain: explication(q.explanation),
        hint: '',
        code: q.code || '',
        demo: ''
      };
    });
  }

  /* --------------------------------------------------------------------------
     3. SQL — SQL Quest (140 défis, 8 mondes)
     ------------------------------------------------------------------------ */
  var SQL_CATS = D.STI_QUIZ_SQL_CATS || {};
  function questionsSql() {
    return (D.STI_QUIZ_SQL_QUESTIONS || []).map(function (q, i) {
      var c = SQL_CATS[q.cat] || {};
      return {
        id: 'sql-' + (q.id != null ? q.id : i + 1),
        cat: q.cat,
        catNom: c.name || q.cat,
        catIcone: '🗄️',
        diff: q.diff || 'Facile',
        q: q.q,
        options: (q.answers || []).slice(),
        answer: q.correct,
        explain: explication(q.explain),
        hint: q.hint || '',
        code: q.code || '',
        demo: ''
      };
    });
  }

  /* --------------------------------------------------------------------------
     4. PHP — QuizPHP (176 questions, 10 catégories)
     ------------------------------------------------------------------------ */
  var PHP_CATS = D.STI_QUIZ_PHP_CATS || [];
  function nomCatPhp(id) {
    var c = PHP_CATS.filter(function (x) { return x.id === id; })[0];
    return c ? c.name : id;
  }
  function questionsPhp() {
    return (D.STI_QUIZ_PHP_QUESTIONS || []).map(function (q, i) {
      return {
        id: 'php-' + (i + 1),
        cat: q.cat,
        catNom: nomCatPhp(q.cat),
        catIcone: '🐘',
        diff: q.diff || 'Facile',
        q: q.q,
        options: (q.options || []).slice(),
        answer: q.answer,
        explain: explication(q.explain),
        hint: q.hint || '',
        code: q.code || '',
        demo: ''
      };
    });
  }

  /* --------------------------------------------------------------------------
     5. Configuration commune
     ------------------------------------------------------------------------ */
  function racine(chemin) {
    var r = (window.STI_AUTH && window.STI_AUTH.RACINE) ? window.STI_AUTH.RACINE : '../';
    return r + String(chemin || '').replace(/^(\.\.\/)+/, '').replace(/^\//, '');
  }

  var REGLES_COMMUNES = [
    ['1', 'Choisis une réponse', 'Clique sur une carte ou utilise les touches 1 à 4 (A à D sur Quizzora).'],
    ['2', 'Gagne des points', 'Une bonne réponse augmente ton score et ton combo.'],
    ['3', 'Bilan complet', 'À la fin, retrouve chaque question, ta réponse et la correction.']
  ];

  window.STI_QUIZ_CONFIG = {
    /* ===================== 3a — Quizzora ===================== */
    'html-css': {
      id: 'html-css', titre: 'Quizzora', nom: 'HTML5 & CSS3', emoji: '🧱',
      sousTitre: '187 questions · 12 thèmes · HTML5 & CSS3',
      accent: '--html', accent2: '--css', badge: 'badge--html',
      introduction: 'Le quiz de référence HTML5 & CSS3 : balises, formulaires, sélecteurs, animations et mise en page.',
      touches: ['A', 'B', 'C', 'D'],
      clavier: 'abcd',
      cours: [
        { label: '📖 Cours HTML5', url: 'cours/html5.html#cours' },
        { label: '📖 Cours CSS3', url: 'cours/css3.html#cours' }
      ],
      video: 'html5-cours',
      ancienneCle: 'quizzora_xp_v1',
      questions: questionsHtmlCss,
      modes: [
        { id: 'classic', emoji: '🎯', nom: 'Classique', desc: 'Le chronomètre reste visible en haut de l’écran.', temps: 30 },
        { id: 'zen', emoji: '🧘', nom: 'Zen', desc: 'Sans stress : le temps est mesuré mais reste caché.', temps: 0 }
      ],
      regles: [
        ['1', 'Zéro réponse révélée', 'Pendant l’épreuve, aucune correction : ton choix est seulement surligné. Les réponses sont dévoilées à la fin.'],
        ['2', 'Clavier A → D', 'Réponds avec les touches A, B, C, D ou 1, 2, 3, 4.'],
        ['3', 'Bilan complet à la fin', 'Chaque question est corrigée avec la bonne réponse et une explication.']
      ],
      fonctionnalites: {
        nombreQuestions: true, maximum: 187, defaut: 20,
        themes: true, apercu: true, navigation: true,
        correctionImmediate: false, jokers: [], chrono: true,
        vies: false, combo: false, boss: false, xp: false,
        badges: false, classement: false, certificat: false, terrain: false
      }
    },

    /* ===================== 3b — Arène JavaScript ===================== */
    javascript: {
      id: 'javascript', titre: 'Arène JavaScript', nom: 'JavaScript', emoji: '⚡',
      sousTitre: 'Quiz de l’annexe JS · 3ème & 4ème SI',
      accent: '--js', accent2: '--js', badge: 'badge--js',
      introduction: 'Variables, opérateurs, fonctions, tableaux et DOM : affronte l’arène JavaScript.',
      touches: ['1', '2', '3', '4'],
      clavier: '1234',
      cours: [{ label: '📖 Cours JavaScript', url: 'cours/javascript.html#cours' }],
      video: 'javascript-cours',
      ancienneCle: 'sti-quiz-xp-js-v1',
      questions: questionsJavascript,
      modes: [
        { id: 'arcade', emoji: '🎮', nom: 'Arcade', desc: '3 vies, combo et minuteur : la partie s’arrête quand tu n’as plus de vie.', temps: 20, vies: 3 },
        { id: 'survival', emoji: '🔥', nom: 'Survie', desc: 'Une seule vie : chaque erreur est éliminatoire.', temps: 18, vies: 1 },
        { id: 'boss', emoji: '👾', nom: 'Boss', desc: 'Affronte le boss : fais tomber sa barre de vie à chaque bonne réponse.', temps: 22, vies: 3, boss: 8 },
        { id: 'revision', emoji: '🔁', nom: 'Révision', desc: 'Rejoue uniquement les questions que tu as ratées.', temps: 0 }
      ],
      regles: REGLES_COMMUNES,
      fonctionnalites: {
        nombreQuestions: true, maximum: 106, defaut: 15,
        themes: true, apercu: false, navigation: false,
        correctionImmediate: true, jokers: ['fifty'], chrono: true,
        vies: true, combo: true, boss: true, xp: true,
        badges: false, classement: false, certificat: false, terrain: false
      }
    },

    /* ===================== 3c — SQL Quest ===================== */
    sql: {
      id: 'sql', titre: '140 défis SQL', nom: 'SQL', emoji: '🗄️',
      sousTitre: '140 défis SQL du cours, en jeu',
      accent: '--sql', accent2: '--sql', badge: 'badge--sql',
      introduction: 'Modèle relationnel, LDD, LMD, jointures et agrégations : huit mondes à conquérir.',
      touches: ['1', '2', '3', '4'],
      clavier: '1234',
      cours: [{ label: '📖 Cours SQL', url: 'cours/sql.html#cours' }],
      video: 'sql-cours',
      ancienneCle: 'sqlQuestV3',
      questions: questionsSql,
      modes: [
        { id: 'classique', emoji: '🎯', nom: 'Classique', desc: '10 défis, 30 secondes par question.', temps: 30, vies: 3 },
        { id: 'chrono', emoji: '⏱', nom: 'Chrono 60 s', desc: '60 secondes au total : marque un maximum de points.', temps: 60, global: true },
        { id: 'sansfaute', emoji: '💎', nom: 'Sans Faute', desc: 'La moindre erreur termine la partie.', temps: 30, vies: 1 },
        { id: 'duel', emoji: '🤖', nom: 'Duel vs RoboQuery', desc: 'Le bot répond aussi : battre son score.', temps: 25, duel: true }
      ],
      regles: REGLES_COMMUNES,
      fonctionnalites: {
        nombreQuestions: true, maximum: 140, defaut: 10,
        themes: true, apercu: false, navigation: false,
        correctionImmediate: true, jokers: ['fifty', 'hint', 'pass'], chrono: true,
        vies: true, combo: true, boss: false, xp: true,
        badges: true, classement: true, certificat: false, terrain: true,
        niveau: true
      }
    },

    /* ===================== 3d — QuizPHP ===================== */
    php: {
      id: 'php', titre: 'QuizPHP', nom: 'PHP', emoji: '🐘',
      sousTitre: 'Maîtrisez PHP en jouant · réservé à la 4ème SI',
      accent: '--php', accent2: '--php', badge: 'badge--php',
      introduction: 'Syntaxe, chaînes, tableaux, dates et MySQLi procédural : 176 questions du cours de 4ème SI.',
      touches: ['1', '2', '3', '4'],
      clavier: '1234',
      cours: [{ label: '📖 Cours PHP', url: 'cours/php.html#cours' }],
      video: 'php-cours',
      ancienneCle: 'quizphp_v1_user',
      questions: questionsPhp,
      modes: [
        { id: 'practice', emoji: '🌱', nom: 'Entraînement', desc: 'Questions mélangées, sans pression.', temps: 35 },
        { id: 'exam', emoji: '📝', nom: 'Examen', desc: '10 questions difficiles, toutes notions confondues, environ 4 minutes.', temps: 240, global: true, count: 10 },
        { id: 'death', emoji: '💀', nom: 'Mort subite', desc: 'Une seule vie : la première erreur est fatale.', temps: 25, vies: 1 },
        { id: 'sixty', emoji: '⚡', nom: 'PHP en 60 secondes', desc: 'Marque un maximum de points en une minute.', temps: 60, global: true }
      ],
      regles: REGLES_COMMUNES,
      fonctionnalites: {
        nombreQuestions: true, maximum: 176, defaut: 15,
        themes: true, apercu: false, navigation: false,
        correctionImmediate: true, jokers: ['fifty', 'hint', 'pass'], chrono: true,
        vies: true, combo: true, boss: false, xp: true,
        badges: false, classement: true, certificat: true, terrain: false,
        niveau: true
      }
    }
  };

  /* Utilitaire partagé : racine du site, fournie par config.js. */
  window.STI_QUIZ_RACINE = racine;
})();
