/* ============================================================================
   STI V2.0 — MOTEUR DES ARÈNES DE QUIZ (assets/js/quiz.js)
   ----------------------------------------------------------------------------
   JavaScript natif, sans framework. Chargé APRÈS, dans cet ordre :
     config.js · supabase-umd.js · acces.js · sync-progressions.js ·
     quiz-sync.js · profil.js · app.js · questions-[matiere].js ·
     quiz-config.js · quiz.js

   Il pilote les 4 arènes (Quizzora, Arène JavaScript, SQL Quest, QuizPHP)
   à partir de leur configuration et de leur banque de questions d'origine.
   Les 3 écrans (départ / jeu / résultat), les modes, les jokers, le combo,
   les vies, le boss, les badges, l'XP et le bilan sont conservés.

   RÈGLE ABSOLUE : aucune écriture directe dans localStorage. Toutes les
   données passent par window.STIProfil (assets/js/profil.js) ; les réponses
   détaillées sont aussi transmises à window.STIQuizSync (script conservé)
   pour alimenter « Mes erreurs ». Aucune URL ni clé Supabase ici.
   ========================================================================== */
(function () {
  'use strict';

  var P = window.STIProfil;
  var TOUT = window.STI_QUIZ_CONFIG || {};
  var ID = document.documentElement.getAttribute('data-sti-quiz');
  var CFG = TOUT[ID];
  if (!P || !CFG || ID === 'tableaux') return;   /* tableaux garde ses scripts */

  var F = CFG.fonctionnalites;
  var RACINE = window.STI_QUIZ_RACINE || function (p) { return '../' + p; };
  function u(p) { return /^(https?:|#|mailto:|\/)/i.test(String(p || '')) ? p : RACINE(p); }
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function el(html) { var d = document.createElement('div'); d.innerHTML = String(html).trim(); return d.firstElementChild; }
  function melanger(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function fmtTemps(s) {
    s = Math.max(0, Math.round(Number(s) || 0));
    return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
  }
  function toast(msg) {
    var t = $('#qzToast');
    if (!t) {
      t = el('<div id="qzToast" role="status" aria-live="polite"></div>');
      t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(16px);z-index:220;' +
        'background:var(--surface);color:var(--text);border:1px solid var(--qz-accent);border-radius:999px;' +
        'padding:.7rem 1.3rem;box-shadow:var(--shadow-lg);font-size:.85rem;opacity:0;transition:.3s;pointer-events:none';
      document.body.appendChild(t);
    }
    t.textContent = msg; t.style.opacity = '1'; t.style.transform = 'translateX(-50%)';
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.style.opacity = '0'; t.style.transform = 'translateX(-50%) translateY(16px)'; }, 2400);
  }

  /* -------------------------------------------------------------------------
     0. ÉTAT DE LA PARTIE
     ---------------------------------------------------------------------- */
  var BANQUE = [];
  var S = {
    ecran: 'start',
    mode: CFG.modes[0].id,
    count: F.defaut,
    cats: [],
    liste: [],
    index: 0,
    reponses: [],          // index -> choix de l'élève (ou null)
    score: 0,
    bonnes: 0,
    vies: 3,
    combo: 0,
    meilleurCombo: 0,
    streak: 0,
    bossHp: 0,
    botScore: 0,
    debut: 0,
    duree: 0,
    tempsRestant: 0,
    chrono: 0,
    termine: false,
    jokers: { fifty: false, hint: false, pass: false },
    exclus: [],
    niveauAvant: 1,
    modeRevision: false,
    partieId: '',      // Identifiant stable entre les onglets et appareils.
    partieUtilisateur: '' // Une partie ne peut pas suivre un autre compte.
  };
  var timerID = null;

  /* -------------------------------------------------------------------------
     1. SQUELETTE : les 3 écrans + TOUS les identifiants d'origine
     ---------------------------------------------------------------------- */
  function boutonCours() {
    return CFG.cours.map(function (c) {
      return '<a class="qz-bouton qz-bouton--ghost" href="' + esc(u(c.url)) + '">' + esc(c.label) + '</a>';
    }).join('');
  }

  function filHTML() {
    return '<nav class="qz-fil" aria-label="Fil d’Ariane">' +
      '<a href="' + esc(u('index.html')) + '">Accueil</a><span aria-hidden="true">›</span>' +
      '<a href="' + esc(u('index.html#quiz')) + '">Quiz</a><span aria-hidden="true">›</span>' +
      '<span class="qz-fil__ici" aria-current="page">' + esc(CFG.nom) + '</span></nav>';
  }

  function hudHTML() {
    var communes =
      '<div class="qz-hud__item"><small>Catégorie</small><strong id="question-category">—</strong></div>' +
      '<div class="qz-hud__item"><small>Question</small><strong id="question-counter">0 / 0</strong></div>' +
      '<div class="qz-hud__item"><small>Difficulté</small><strong id="qzDifficulte" class="qz-badge">—</strong>' +
        '<span class="qz-sr-only" id="qDiffBadge">—</span></div>' +
      '<div class="qz-hud__item"><small>Mode</small><strong id="quizModeBadge" class="qz-badge">—</strong>' +
        '<span class="qz-sr-only" id="qModeBadge">—</span></div>';
    var specifiques = '';
    if (ID === 'html-css') {
      specifiques =
        '<div class="qz-hud__item"><small>Chrono</small><strong id="timerPill">' + fmtTemps(CFG.modes[0].temps) + '</strong></div>';
    } else if (ID === 'javascript') {
      specifiques =
        '<div class="qz-hud__item"><small>Score</small><strong id="stat-score" aria-live="polite">0</strong></div>' +
        '<div class="qz-hud__item"><small>Vies</small><strong id="stat-lives">❤️❤️❤️</strong></div>' +
        '<div class="qz-hud__item"><small>Combo</small><strong id="stat-combo">🔥 0</strong></div>' +
        '<div class="qz-hud__item" id="stat-boss-hp" hidden><small>Boss</small><div class="qz-bossbar"><i id="qzBossFill"></i></div></div>' +
        '<div class="qz-hud__item"><small>Temps</small><strong id="qzTemps">0:00</strong></div>';
    } else if (ID === 'sql') {
      specifiques =
        '<div class="qz-hud__item"><small>Score</small><strong id="quizScore" aria-live="polite">0</strong></div>' +
        '<div class="qz-hud__item"><small>Combo</small><strong id="quizCombo">🔥 0</strong></div>' +
        '<div class="qz-hud__item"><small>Vies</small><strong id="qzVies">❤️❤️❤️</strong></div>' +
        '<div class="qz-hud__item" id="qzBotBox" hidden><small>RoboQuery</small><strong id="botScoreBadge">0</strong></div>' +
        '<div class="qz-hud__item"><small>Temps</small><strong id="qzTemps">0:00</strong></div>';
    } else {
      specifiques =
        '<div class="qz-hud__item"><small>Score</small><strong id="qScore" aria-live="polite">0</strong></div>' +
        '<div class="qz-hud__item"><small>Série</small><strong id="qStreak">0</strong></div>' +
        '<div class="qz-hud__item"><small>Points</small><strong id="qPtsBadge">100</strong></div>' +
        '<div class="qz-hud__item"><small>Vies</small><strong id="qzVies">❤️❤️❤️</strong></div>' +
        '<div class="qz-hud__item"><small>Chrono</small><strong id="qTimer">0:00</strong></div>';
    }
    /* Alias compatibles avec les scripts et les sélecteurs historiques :
       on n'ajoute QUE les identifiants absents du HUD visible (pas de doublon). */
    var deja = {};
    (communes + specifiques).replace(/id="([^"]+)"/g, function (m, x) { deja[x] = 1; return m; });
    var alias = ['stat-score', 'stat-lives', 'stat-combo', 'stat-boss-hp', 'quizModeBadge',
      'quizScore', 'quizCombo', 'qDiffBadge', 'qModeBadge', 'qPtsBadge', 'qScore',
      'qStreak', 'qTimer', 'timerPill', 'qzScore', 'botScoreBadge', 'qzVies']
      .filter(function (x) { return !deja[x]; })
      .map(function (x) { return '<span id="' + x + '"></span>'; }).join('');

    return '<div class="qz-hud" role="group" aria-label="Tableau de bord de la partie">' +
      communes + specifiques +
      '<div class="qz-hud__item qz-hud__score"><small>Score</small><strong id="qzScoreGlobal" aria-live="polite">0</strong></div>' +
      '</div><div class="qz-sr-only" aria-live="polite">' + alias + '</div>';
  }

  function coquilleHTML() {
    return '' +
      filHTML() +
      '<header class="qz-hero" id="qzHero">' +
        '<div class="qz-hero__texte">' +
          '<span class="qz-eyebrow" id="examBadge">' + esc(CFG.emoji + ' ' + CFG.titre) + '</span>' +
          '<h1 id="qzTitre">' + esc(CFG.nom) + ' <span class="qz-grad">— ' + esc(CFG.titre) + '</span></h1>' +
          '<p class="qz-hero__sous">' + esc(CFG.introduction) + '</p>' +
          '<div class="qz-hero__stats">' +
            '<div class="qz-stat"><small>Meilleur score</small><strong id="heroScore">0</strong>' +
              '<span class="qz-sr-only" id="home-high-score">0</span></div>' +
            '<div class="qz-stat"><small>Meilleur chrono</small><strong id="heroTimer">—</strong>' +
              '<span class="qz-sr-only" id="best-chrono">—</span></div>' +
            '<div class="qz-stat"><small>Réponses données</small><strong id="home-total-answered">0</strong></div>' +
            '<div class="qz-stat"><small>Dernier résultat</small><strong id="heroResult">—</strong>' +
              '<span class="qz-sr-only" id="bestScoreLabel">—</span></div>' +
            '<div class="qz-stat"><small>Niveau</small><strong id="navLevel">1</strong>' +
              '<span id="navXP">0 XP</span></div>' +
            '<div class="qz-stat"><small>Série</small><strong id="navStreak">0</strong></div>' +
          '</div>' +
          '<div class="progress qz-xpbar"><div class="progress__fill" id="xpBar" style="--bar:var(--qz-accent)"></div></div>' +
          '<div class="qz-hero__actions">' +
            '<button type="button" class="btn btn--primary" id="quickStart">▶ Démarrage rapide</button>' +
            boutonCours() +
          '</div>' +
        '</div>' +
        '<aside class="qz-hero__panneau" aria-label="Liens avec le cours">' +
          '<h2>📚 Réviser avant de jouer</h2><p>Toutes les notions du quiz viennent du cours. Un doute ? Ouvre le chapitre, puis reviens tenter l’arène.</p>' +
          '<div class="qz-hero__liens">' + boutonCours() + '</div>' +
          '<div class="qz-hero__regles"><strong>Règles</strong><span id="qzReglesRapides"></span></div>' +
        '</aside>' +
      '</header>' +

      /* ---------- ÉCRAN 1 : DÉPART ---------- */
      '<section class="qz-ecran" id="screen-start" aria-label="Configuration de la partie">' +
        '<div class="qz-config__bloc" id="qzSessionEnCours" hidden></div>' +
        '<div class="qz-section-head"><h2>🎮 Mode de jeu</h2><p>Choisis ton épreuve, le nombre de questions et les thèmes à réviser.</p></div>' +
        '<div class="qz-modes" id="qzModes" role="radiogroup" aria-label="Mode de jeu"></div>' +
        '<div class="qz-config">' +
          '<div class="qz-config__bloc"><h3>🔢 Nombre de questions</h3>' +
            '<label class="qz-label" for="qzCount">De 5 à ' + BANQUE.length + ' questions</label>' +
            '<input type="range" id="qzCount" min="5" max="' + BANQUE.length + '" step="1" value="' + S.count + '">' +
            '<output id="qzCountOut">' + S.count + ' questions</output>' +
            '<div class="qz-rapides" id="qzRapides"></div>' +
          '</div>' +
          '<div class="qz-config__bloc"><h3>🌌 Thèmes</h3>' +
            '<div class="qz-themes" id="categoriesGrid"></div>' +
            '<div class="qz-themes__actions"><button type="button" class="qz-bouton qz-bouton--ghost" id="qzToutCocher">Tout cocher</button>' +
            '<button type="button" class="qz-bouton qz-bouton--ghost" id="qzToutDecocher">Tout décocher</button></div>' +
          '</div>' +
          '<div class="qz-config__bloc qz-config__resume"><h3>⚙️ Résumé de la partie</h3>' +
            '<div id="qzResume"></div></div>' +
        '</div>' +
        '<div class="qz-regles" id="qzRegles"></div>' +
        (F.badges || F.classement ?
          '<div class="qz-palmares">' +
            (F.badges ? '<div class="qz-config__bloc"><h3>🏅 Mes badges <span class="qz-badge" id="badgeCount">0</span></h3>' +
              '<div class="progress"><div class="progress__fill" id="qzBadgeBarre"></div></div>' +
              '<div class="qz-badges" id="badgeGrid"></div></div>' : '') +
            (F.classement ? '<div class="qz-config__bloc"><h3 id="leaderboard">🏆 Panthéon / Classement</h3>' +
              '<ol class="qz-classement" id="leaderList"></ol></div>' : '') +
          '</div>' : '') +
        '<div class="qz-actions"><button type="button" class="btn btn--primary qz-bouton--grand" id="qzCommencer">🚀 Commencer</button>' +
        '<button type="button" class="qz-bouton qz-bouton--ghost" id="qzMesErreurs">🔁 Rejouer mes erreurs</button></div>' +
      '</section>' +

      /* ---------- ÉCRAN 2 : JEU ---------- */
      '<section class="qz-ecran" id="screen-gameplay" aria-label="Question" hidden>' +
        hudHTML() +
        '<div class="qz-timer"><div class="qz-timer__barre" id="timer-bar"></div></div>' +
        '<div class="qz-progress"><div class="qz-progress__fill" id="qzProgressFill"></div></div>' +
        '<article class="qz-carte-question">' +
          '<div class="qz-qmeta"><span class="qz-badge" id="qzCatBadge">—</span>' +
            '<span id="qzCompteurQuestion">Question 1 / 1</span>' +
            '<span class="qz-badge qz-badge--accent" id="quizModeBadge2">—</span></div>' +
          '<h2 class="qz-question" id="question-title">…</h2>' +
          '<div class="qz-code" id="qzCode" hidden></div>' +
          '<div class="qz-apercu" id="qzApercu" hidden><div class="qz-apercu__barre">🔍 Aperçu en direct <span>Chargement de l’aperçu…</span></div>' +
            '<iframe sandbox="allow-scripts" loading="lazy" title="Aperçu du code de la question"></iframe></div>' +
          '<div class="qz-choix" id="qzOptions" role="group" aria-label="Réponses proposées"></div>' +
          '<div class="qz-hint" id="hintBox" hidden>💡 <span id="hintText"></span></div>' +
          '<div class="qz-explain" id="explainBox" aria-live="polite" hidden></div>' +
          '<div class="qz-playground" id="playgroundResult" hidden></div>' +
          '<div class="qz-jokers" id="lifelinesRow"></div>' +
          '<div class="qz-nav-q" id="qzNav"></div>' +
        '</article>' +
      '</section>' +

      /* ---------- ÉCRAN 3 : RÉSULTAT ---------- */
      '<section class="qz-ecran" id="screen-result" aria-label="Résultat" hidden>' +
        '<div class="qz-result" id="resultsOverlay">' +
          '<div class="qz-result__entete"><span class="qz-result__icone" id="result-badge-icon">🏆</span>' +
            '<span class="qz-badge" id="gradeBadge">—</span></div>' +
          '<h2 id="result-title">Partie terminée</h2>' +
          '<span class="qz-badge qz-badge--accent" id="result-status-tag">—</span>' +
          '<p id="result-desc">—</p>' +
          '<div class="qz-result__score"><strong id="resScore">0</strong><span>points</span></div>' +
          '<div class="qz-result__stats" id="resStatsGrid"></div>' +
          '<div class="qz-sr-only"><span id="res-accuracy"></span><span id="res-combo"></span>' +
            '<span id="res-time-bonus"></span><span id="resStreak"></span><span id="xpGained"></span>' +
            '<span id="resXP"></span><span id="resBotResult"></span></div>' +
          '<div class="qz-xp"><div class="progress"><div class="progress__fill" id="resXpBar"></div></div>' +
            '<p id="levelUpMsg" hidden>🎉 Niveau supérieur !</p></div>' +
          '<div class="qz-certificat" id="qzCertificat" hidden><h3>🎓 Certificat de réussite</h3>' +
            '<p>STI V2.0 · Lycée Raféha — atteste de la réussite du quiz <strong>' + esc(CFG.titre) + '</strong></p>' +
            '<p>Score : <strong id="certScore">0</strong> · Date : <span id="qzCertDate"></span></p></div>' +
          '<div class="qz-actions qz-actions--centre">' +
            '<button type="button" class="btn btn--primary" id="qzRejouer">🔄 Rejouer</button>' +
            '<button type="button" class="qz-bouton" id="qzRejouerErreurs">🔁 Rejouer mes erreurs</button>' +
            '<button type="button" class="qz-bouton qz-bouton--ghost" id="qzRevoirVideo">🎥 Revoir la vidéo</button>' +
            boutonCours() +
          '</div>' +
          '<h3 class="qz-revue__titre">📋 Bilan complet <span class="qz-badge" id="reviewCount">0</span></h3>' +
          '<div class="qz-revue" id="reviewList"></div>' +
          '<div class="qz-sr-only" id="resReview"></div>' +
        '</div>' +
      '</section>' +

      '<div class="qz-modale" id="levelupModal" hidden role="dialog" aria-modal="true" aria-labelledby="qzLevelTitre">' +
        '<div class="qz-modale__boite"><span style="font-size:3rem">🎉</span>' +
        '<h2 id="qzLevelTitre">Niveau supérieur !</h2><p id="qzLevelNom">Niveau 2</p>' +
        '<button type="button" class="btn btn--primary" id="qzLevelFermer">Continuer</button></div></div>' +
      '<div class="qz-confettis" id="qzConfettis" aria-hidden="true"></div>' +
      '<button type="button" class="qz-haut" id="qzHaut" aria-label="↑ Haut de page" title="Haut de page">↑</button>';
  }

  /* -------------------------------------------------------------------------
     2. ÉCRAN DE DÉPART — statistiques, modes, thèmes, règles, palmarès
     ---------------------------------------------------------------------- */
  var BADGES_SQL = [
    { id: 'first', ico: '🌱', nom: 'Premier Pas', test: function (s) { return s.parties >= 1; } },
    { id: 'dix', ico: '🔟', nom: 'Dix parties', test: function (s) { return s.parties >= 10; } },
    { id: 'xp500', ico: '⚡', nom: '500 XP', test: function (s) { return s.xp >= 500; } },
    { id: 'xp2000', ico: '🚀', nom: '2 000 XP', test: function (s) { return s.xp >= 2000; } },
    { id: 'combo', ico: '🔥', nom: 'Combo x5', test: function (s) { return (s.serie || 0) >= 5; } },
    { id: 'sansfaute', ico: '💎', nom: 'Sans Faute', test: function (s) { return (s.meilleur || 0) >= 1000; } },
    { id: 'niveau5', ico: '🏅', nom: 'Niveau 5', test: function (s) { return s.niveau >= 5; } },
    { id: 'reponses', ico: '🧠', nom: '100 réponses', test: function (s) { return s.reponses >= 100; } }
  ];

  function peindreHero() {
    var st = P.statsQuiz(ID);
    var p = P.chargerProfil();
    var dernier = p.quiz.slice().reverse().filter(function (q) { return q.matiere === ID; })[0];
    function set(id, v) { var n = document.getElementById(id); if (n) n.textContent = v; }
    set('heroScore', st.meilleur || 0);
    set('home-high-score', st.meilleur || 0);
    set('heroTimer', st.meilleurChrono ? fmtTemps(st.meilleurChrono) : '—');
    set('best-chrono', st.meilleurChrono ? fmtTemps(st.meilleurChrono) : '—');
    set('home-total-answered', st.reponses || 0);
    set('heroResult', dernier ? (dernier.score + ' / ' + dernier.total) : '—');
    set('bestScoreLabel', 'Meilleur : ' + (st.meilleur || 0));
    set('navLevel', st.niveau || 1);
    set('navXP', (st.xp || 0) + ' XP');
    set('navStreak', st.serie || 0);
    var barre = $('#xpBar');
    if (barre) barre.style.width = Math.min(100, ((st.xp || 0) % 500) / 5) + '%';
    var exam = $('#examBadge');
    if (exam) exam.textContent = CFG.emoji + ' ' + CFG.titre + ' · ' + BANQUE.length + ' questions';
    var regles = $('#qzReglesRapides');
    if (regles) regles.textContent = CFG.regles.map(function (r) { return r[1]; }).join(' · ');
  }

  function peindreModes() {
    var root = $('#qzModes');
    root.innerHTML = CFG.modes.map(function (m) {
      return '<button type="button" class="qz-mode' + (m.id === S.mode ? ' is-actif' : '') + '" role="radio" ' +
        'aria-checked="' + (m.id === S.mode) + '" data-mode="' + esc(m.id) + '">' +
        '<span class="qz-mode__ico" aria-hidden="true">' + m.emoji + '</span>' +
        '<strong>' + esc(m.nom) + '</strong><small>' + esc(m.desc) + '</small></button>';
    }).join('');
    $$('[data-mode]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        S.mode = b.getAttribute('data-mode');
        $$('[data-mode]', root).forEach(function (x) {
          var ok = x === b; x.classList.toggle('is-actif', ok); x.setAttribute('aria-checked', String(ok));
        });
        peindreResume();
      });
    });
  }

  function categories() {
    var m = {}, ordre = [];
    BANQUE.forEach(function (q) {
      if (!m[q.cat]) { m[q.cat] = { nom: q.catNom || q.cat, icone: q.catIcone || '📘', n: 0 }; ordre.push(q.cat); }
      m[q.cat].n++;
    });
    return ordre.map(function (k) { return { id: k, nom: m[k].nom, icone: m[k].icone, n: m[k].n }; });
  }

  function peindreThemes() {
    var root = $('#categoriesGrid');
    if (!F.themes || !root) { if (root) root.innerHTML = '<p>Toutes les notions sont mélangées.</p>'; return; }
    root.innerHTML = categories().map(function (c) {
      var coche = S.cats.indexOf(c.id) !== -1;
      return '<label class="qz-theme' + (coche ? ' is-actif' : '') + '">' +
        '<input type="checkbox" value="' + esc(c.id) + '"' + (coche ? ' checked' : '') + '>' +
        '<span aria-hidden="true">' + c.icone + '</span><strong>' + esc(c.nom) + '</strong>' +
        '<small>' + c.n + ' questions</small></label>';
    }).join('');
    $$('input[type="checkbox"]', root).forEach(function (cb) {
      cb.addEventListener('change', function () {
        var v = cb.value, i = S.cats.indexOf(v);
        if (cb.checked && i === -1) S.cats.push(v);
        if (!cb.checked && i !== -1) S.cats.splice(i, 1);
        cb.closest('.qz-theme').classList.toggle('is-actif', cb.checked);
        peindreResume();
      });
    });
  }

  function peindreRegles() {
    var r = $('#qzRegles');
    if (!r) return;
    r.innerHTML = '<h2>📜 Les règles</h2><div class="qz-regles__grille">' + CFG.regles.map(function (x) {
      return '<div class="qz-regle"><span>' + esc(x[0]) + '</span><strong>' + esc(x[1]) + '</strong>' +
        '<p>' + esc(x[2]) + '</p></div>';
    }).join('') + '</div>';
  }

  function peindrePalmares() {
    if (!F.badges && !F.classement) return;
    var st = P.statsQuiz(ID);
    if (F.badges) {
      var grid = $('#badgeGrid'), count = $('#badgeCount'), barre = $('#qzBadgeBarre');
      var acquis = BADGES_SQL.filter(function (b) {
        return (st.badges || []).indexOf(b.id) !== -1 || b.test(st);
      });
      if (grid) grid.innerHTML = BADGES_SQL.map(function (b) {
        var ok = acquis.indexOf(b) !== -1;
        return '<div class="qz-badge-carte' + (ok ? ' is-acquis' : '') + '" title="' + esc(b.nom) + '">' +
          '<span aria-hidden="true">' + b.ico + '</span><small>' + esc(b.nom) + '</small></div>';
      }).join('');
      if (count) count.textContent = acquis.length + ' / ' + BADGES_SQL.length;
      if (barre) barre.style.width = Math.round(acquis.length / BADGES_SQL.length * 100) + '%';
    }
    if (F.classement) {
      var liste = $('#leaderList');
      if (liste) {
        var lignes = (st.classement || []).slice(0, 5);
        liste.innerHTML = lignes.length ? lignes.map(function (l, i) {
          return '<li><span>' + (i + 1) + '.</span><strong>' + (l.score || 0) + ' pts</strong>' +
            '<small>' + esc(l.date || '') + ' · ' + esc(l.mode || '') + '</small></li>';
        }).join('') : '<li class="qz-vide">Aucune partie enregistrée pour le moment.</li>';
      }
    }
  }

  function modeCourant() {
    return CFG.modes.filter(function (m) { return m.id === S.mode; })[0] || CFG.modes[0];
  }

  function peindreResume() {
    var m = modeCourant(), n = Math.min(S.count, poolFiltre().length || S.count);
    var duree = m.global ? m.temps : Math.round(n * (m.temps || 20) / 60);
    var box = $('#qzResume');
    if (box) box.innerHTML =
      '<div class="qz-resume__ligne"><span>Mode</span><strong>' + esc(m.emoji + ' ' + m.nom) + '</strong></div>' +
      '<div class="qz-resume__ligne"><span>Questions</span><strong>' + n + '</strong></div>' +
      '<div class="qz-resume__ligne"><span>Thèmes</span><strong>' + (S.cats.length || 'Tous') + '</strong></div>' +
      '<div class="qz-resume__ligne"><span>Durée estimée</span><strong>≈ ' + duree + ' min</strong></div>';
  }

  function poolFiltre() {
    if (!S.cats.length) return BANQUE;
    return BANQUE.filter(function (q) { return S.cats.indexOf(q.cat) !== -1; });
  }

  function peindreStart() {
    peindreHero(); peindreModes(); peindreThemes(); peindreRegles(); peindrePalmares(); peindreResume();
    var champ = $('#qzCount'), sortie = $('#qzCountOut');
    if (champ) {
      champ.max = BANQUE.length;
      champ.value = Math.min(S.count, BANQUE.length);
      if (sortie) sortie.textContent = champ.value + ' questions';
      champ.addEventListener('input', function () {
        S.count = Number(champ.value) || F.defaut;
        if (sortie) sortie.textContent = S.count + ' questions';
        peindreResume();
      });
    }
    var rapides = $('#qzRapides');
    if (rapides) {
      [10, 20, 50, BANQUE.length].filter(function (x, i, a) { return a.indexOf(x) === i; }).forEach(function (n) {
        var b = el('<button type="button" class="qz-bouton qz-bouton--ghost" data-n="' + n + '">' + n + '</button>');
        b.addEventListener('click', function () {
          S.count = n; if (champ) champ.value = n; if (sortie) sortie.textContent = n + ' questions'; peindreResume();
        });
        rapides.appendChild(b);
      });
    }
    var tout = $('#qzToutCocher'), rien = $('#qzToutDecocher');
    if (tout) tout.addEventListener('click', function () { S.cats = categories().map(function (c) { return c.id; }); peindreThemes(); peindreResume(); });
    if (rien) rien.addEventListener('click', function () { S.cats = []; peindreThemes(); peindreResume(); });
  }

  /* -------------------------------------------------------------------------
     SESSION ET XP : interface v490, sans toucher aux contrôles de la refonte.
     Le crédit est cumulatif pour une même partie ; l'UUID rend sa reprise et
     ses envois répétés idempotents, y compris entre plusieurs appareils.
     ---------------------------------------------------------------------- */
  var CLES_XP = { 'html-css': 'quizzora_xp_v1', javascript: 'sti-quiz-xp-js-v1',
    sql: 'sqlQuestV3', php: 'quizphp_v1_user' };

  function quizSync() { return window.STIQuizSync || null; }
  function identiteQuiz() {
    var qs = quizSync(), utilisateur = qs && qs.utilisateurLocal && qs.utilisateurLocal();
    var etat = P.lireEtatSession();
    return String((utilisateur && utilisateur.id) || etat.id || '');
  }
  function comptePret(avertir) {
    var etat = P.lireEtatSession(), uid = identiteQuiz();
    var inviteIsole = !uid && P.quizInviteIsole && P.quizInviteIsole();
    var pret = !etat.compteEnAttente && (uid ? P.compteQuizIsole(uid) : inviteIsole);
    if (!pret && avertir) toast(uid ? 'Synchronisation du compte en cours : réessaie dans un instant.' :
      'Reconnecte le dernier compte pour protéger sa progression sur cet appareil.');
    return pret;
  }
  function comptePartieValide(avertir) {
    if (!comptePret(avertir)) return false;
    if (S.partieUtilisateur === identiteQuiz()) return true;
    if (avertir) toast('Cette partie appartient à un autre compte. Reconnecte ce compte pour la reprendre.');
    return false;
  }
  function creerPartieId() {
    var qs = quizSync();
    if (qs && qs.creerIdentifiantPartie) return qs.creerIdentifiantPartie();
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16);
    });
  }
  function nbReponsesDonnees() {
    return S.reponses.reduce(function (n, r) { return n + (typeof r === 'number' && r >= 0 ? 1 : 0); }, 0);
  }
  function gainXp(finale) {
    var repondues = nbReponsesDonnees();
    var pct = repondues ? Math.round(S.bonnes * 100 / repondues) : 0;
    if (ID === 'html-css') return S.bonnes * 250;
    if (ID === 'javascript') return Math.max(S.score, S.bonnes * 150);
    if (ID === 'sql') {
      var sql = Math.round(S.score / 15);
      if (finale && repondues) {
        sql += (pct === 100 ? 100 : pct >= 80 ? 50 : pct >= 50 ? 20 : 5) + S.meilleurCombo * 5;
        if (S.mode === 'duel' && S.score >= S.botScore) sql += 50;
      }
      return sql;
    }
    if (ID === 'php') return S.score + (finale && repondues ? S.meilleurCombo * 50 + (pct === 100 ? 500 : pct >= 80 ? 200 : 0) : 0);
    return 0;
  }
  function creditXp(finale) {
    var qs = quizSync(), cle = CLES_XP[ID];
    var utilisateur = qs && qs.utilisateurLocal && qs.utilisateurLocal();
    if (!cle || !S.partieId || !utilisateur || !comptePartieValide(false) || !qs.sauverXP) return false;
    var ancien = P.lireAcquisQuiz(cle, utilisateur.id) || {}, gain = gainXp(finale);
    var valeur = Object.assign({}, ancien, { xp: (Number(ancien.xp) || 0) + gain,
      streak: Math.max(Number(ancien.streak) || 0, S.meilleurCombo) });
    if (ID === 'sql') {
      /* SQL Quest stocke les records par mode, contrairement aux autres quiz. */
      valeur.best = Object.assign({}, ancien.best && typeof ancien.best === 'object' ? ancien.best : {});
      valeur.best[S.mode] = Math.max(Number(valeur.best[S.mode]) || 0, S.score);
      var marque = P.lireGainPartieQuiz(utilisateur.id, cle, S.partieId) || {};
      valeur.totalAnswered = (Number(ancien.totalAnswered) || 0) + Math.max(0, nbReponsesDonnees() - (Number(marque.total) || 0));
      valeur.totalCorrect = (Number(ancien.totalCorrect) || 0) + Math.max(0, S.bonnes - (Number(marque.bonnes) || 0));
      valeur.bestCombo = Math.max(Number(ancien.bestCombo) || 0, S.meilleurCombo);
    } else valeur.best = Math.max(typeof ancien.best === 'number' ? ancien.best : 0, S.score);
    var ok = qs.sauverXP(cle, valeur, gain, { id: S.partieId, bonnes: S.bonnes, total: nbReponsesDonnees() });
    if (ok && qs.notifierXP) qs.notifierXP(cle);
    return ok;
  }
  function sauverPartieActive() {
    var qs = quizSync();
    if (!qs || !qs.sauverSession || !S.partieId || S.termine || !comptePartieValide(false) ||
        !S.liste.length || !S.reponses.some(function (r) { return r !== null && r !== undefined; })) return;
    qs.sauverSession(ID, {
      module: S.cats.length === 1 ? S.cats[0] : '*', mode: S.mode,
      score: S.bonnes, points: S.score, total: S.liste.length, index_courant: S.index,
      ordre_questions: S.liste,
      etat_meta: {
        moteur_sti: 495, partie_id: S.partieId, reponses: S.reponses.slice(),
        score: S.score, vies: S.vies, combo: S.combo, meilleurCombo: S.meilleurCombo,
        streak: S.streak, bossHp: S.bossHp, botScore: S.botScore,
        duree: Math.max(0, Math.floor((Date.now() - S.debut) / 1000)),
        tempsRestant: S.tempsRestant, jokers: Object.assign({}, S.jokers), exclus: S.exclus.slice(),
        cats: S.cats.slice(), modeRevision: S.modeRevision
      }
    });
  }
  function reprendrePartie(session) {
    if (!comptePret(true) || !session || !session.etat_meta || session.etat_meta.moteur_sti !== 495) return;
    if (session.user_id && String(session.user_id) !== identiteQuiz()) {
      toast('Cette partie appartient à un autre compte.'); return;
    }
    var meta = session.etat_meta, liste = session.ordre_questions;
    if (!Array.isArray(liste) || !liste.length || !Array.isArray(meta.reponses)) return;
    /* Les questions et leurs choix restent dans l'ordre exact de la partie. */
    if (!liste.every(function (q) { return q && typeof q.q === 'string' && Array.isArray(q.options) && typeof q.answer === 'number'; })) {
      toast('Cette partie ne peut pas être reprise avec cette version du quiz.'); return;
    }
    arreterChrono();
    S.mode = CFG.modes.some(function (m) { return m.id === session.mode; }) ? session.mode : CFG.modes[0].id;
    S.liste = liste; S.count = liste.length;
    S.reponses = liste.map(function (q, i) {
      var r = meta.reponses[i];
      return typeof r === 'number' && Number.isInteger(r) && r >= -2 && r < q.options.length ? r : null;
    });
    S.index = Math.max(0, Math.min(liste.length - 1, Number(session.index_courant) || 0));
    S.bonnes = S.reponses.reduce(function (n, r, i) { return n + (r === liste[i].answer ? 1 : 0); }, 0);
    S.score = Math.max(0, Number(meta.score) || Number(session.points) || 0);
    S.vies = Math.max(0, Number(meta.vies) || 0); S.combo = Math.max(0, Number(meta.combo) || 0);
    S.meilleurCombo = Math.max(0, Number(meta.meilleurCombo) || 0); S.streak = Math.max(0, Number(meta.streak) || 0);
    S.bossHp = Math.max(0, Number(meta.bossHp) || 0); S.botScore = Math.max(0, Number(meta.botScore) || 0);
    S.duree = Math.max(0, Number(meta.duree) || 0); S.debut = Date.now() - S.duree * 1000;
    S.tempsRestant = Math.max(0, Number(meta.tempsRestant) || 0);
    S.jokers = Object.assign({ fifty: false, hint: false, pass: false }, meta.jokers || {});
    S.exclus = Array.isArray(meta.exclus) ? meta.exclus.slice(0, 10) : [];
    S.cats = Array.isArray(meta.cats) ? meta.cats.slice(0, 100) : [];
    S.modeRevision = Boolean(meta.modeRevision); S.termine = false;
    var qs = quizSync();
    S.partieId = qs && qs.identifierPartieReprise ? qs.identifierPartieReprise(ID, session) : meta.partie_id;
    S.partieUtilisateur = identiteQuiz();
    if (!S.partieId) { toast('Identifiant de partie indisponible.'); return; }
    S.niveauAvant = P.statsQuiz(ID).niveau || 1;
    $('#qzSessionEnCours').hidden = true;
    afficherEcran('jeu'); renderQuestion(); lancerChrono(true); creditXp(false);
    toast('Partie reprise.');
  }
  function proposerReprise() {
    var qs = quizSync();
    if (!qs || !qs.chargerSession || !comptePret(false)) return;
    Promise.resolve(qs.chargerSession(ID)).then(function (session) {
      if (!session || S.ecran !== 'start' || S.liste.length || !comptePret(false) ||
          (session.user_id && String(session.user_id) !== identiteQuiz())) return;
      var zone = $('#qzSessionEnCours');
      if (!zone) return;
      zone.replaceChildren();
      var titre = document.createElement('h3'); titre.textContent = '☁️ Une partie est en cours'; zone.appendChild(titre);
      var texte = document.createElement('p');
      texte.textContent = 'Retrouve tes questions et tes réponses enregistrées.'; zone.appendChild(texte);
      if (session.etat_meta && session.etat_meta.moteur_sti === 495) {
        var bouton = document.createElement('button'); bouton.type = 'button'; bouton.className = 'btn btn--primary';
        bouton.textContent = 'Reprendre la partie'; bouton.addEventListener('click', function () { reprendrePartie(session); });
        zone.appendChild(bouton);
      } else {
        /* Les sessions de l'ancienne interface conservent leur propre format. */
        texte.textContent = 'Cette partie a été commencée dans la version précédente du quiz.';
        var lien = document.createElement('a'); lien.className = 'qz-bouton qz-bouton--ghost';
        lien.href = u('quiz/' + ID + '-origine.html'); lien.textContent = 'Reprendre dans la version précédente';
        zone.appendChild(lien);
      }
      zone.hidden = false;
    }).catch(function () { /* La prochaine connexion réessaiera. */ });
  }

  /* -------------------------------------------------------------------------
     3. MOTEUR DE JEU — sélection, minuteur, vies, combo, boss, jokers
     ---------------------------------------------------------------------- */
  function pointsQuestion(q) {
    var d = String(q.diff || '').toLowerCase();
    if (d.indexOf('expert') !== -1) return 500;
    if (d.indexOf('difficile') !== -1 || d.indexOf('hard') !== -1) return 300;
    if (d.indexOf('moyen') !== -1 || d.indexOf('medium') !== -1) return 200;
    return 100;
  }
  function coeurs(n) {
    n = Math.max(0, Math.min(5, n));
    return '❤️'.repeat(n) + '🖤'.repeat(Math.max(0, 3 - n));
  }
  function setTxt(id, v) { var n = document.getElementById(id); if (n) n.textContent = v; }

  function majHUD() {
    var q = S.liste[S.index], mode = modeCourant();
    setTxt('question-category', q ? (q.catNom || q.cat) : '—');
    setTxt('question-counter', (S.index + 1) + ' / ' + S.liste.length);
    setTxt('qzCompteurQuestion', 'Question ' + (S.index + 1) + ' / ' + S.liste.length);
    setTxt('qzDifficulte', q ? q.diff : '—');
    setTxt('qDiffBadge', q ? q.diff : '—');
    setTxt('quizModeBadge', mode.emoji + ' ' + mode.nom);
    setTxt('quizModeBadge2', mode.emoji + ' ' + mode.nom);
    setTxt('qModeBadge', mode.nom);
    setTxt('qzCatBadge', q ? (q.catIcone || '📘') + ' ' + (q.catNom || q.cat) : '—');
    setTxt('qPtsBadge', q ? pointsQuestion(q) : 100);

    var valeurs = {
      'stat-score': S.score, 'quizScore': S.score, 'qScore': S.score,
      'qzScore': S.score, 'qzScoreGlobal': S.score,
      'stat-lives': coeurs(S.vies), 'qzVies': coeurs(S.vies),
      'stat-combo': '🔥 ' + S.combo, 'quizCombo': '🔥 ' + S.combo,
      'qStreak': S.streak, 'navStreak': S.streak,
      'qzTemps': fmtTemps(S.duree), 'qTimer': fmtTemps(S.tempsRestant),
      'timerPill': fmtTemps(S.tempsRestant),
      'botScoreBadge': S.botScore
    };
    Object.keys(valeurs).forEach(function (id) { setTxt(id, valeurs[id]); });

    var boss = $('#stat-boss-hp');
    if (boss) {
      var actif = !!mode.boss;
      boss.hidden = !actif;
      var fill = $('#qzBossFill');
      if (fill) fill.style.width = Math.max(0, S.bossHp / mode.boss * 100) + '%';
      setTxt('stat-boss-hp', actif ? 'Boss : ' + S.bossHp + ' PV' : '');
    }
    var bot = $('#qzBotBox');
    if (bot) bot.hidden = !mode.duel;

    var barre = $('#timer-bar');
    if (barre) {
      var total = mode.temps || 1;
      var pct = mode.temps ? Math.max(0, S.tempsRestant / total * 100) : 0;
      barre.style.width = pct + '%';
      barre.classList.toggle('is-urgent', mode.temps && pct < 25);
      barre.parentNode.classList.toggle('is-masque', mode.temps === 0 || ID === 'html-css' && S.mode === 'zen');
    }
    var progression = $('#qzProgressFill');
    if (progression) progression.style.width = Math.round(S.index / Math.max(1, S.liste.length) * 100) + '%';
  }

  function arreterChrono() { if (timerID) { clearInterval(timerID); timerID = null; } }

  function lancerChrono(conserver) {
    arreterChrono();
    var mode = modeCourant();
    if (!mode.temps) { S.tempsRestant = 0; majHUD(); return; }
    if (mode.global && S.tempsRestant <= 0 && !conserver) S.tempsRestant = mode.temps;
    if (!mode.global && !conserver) S.tempsRestant = mode.temps;
    timerID = setInterval(function () {
      if (S.termine) { arreterChrono(); return; }
      S.tempsRestant = Math.max(0, S.tempsRestant - 1);
      S.duree = Math.round((Date.now() - S.debut) / 1000);
      majHUD();
      if (S.tempsRestant === 0) {
        arreterChrono();
        if (mode.global) terminerPartie();
        else repondre(-1, true);
      }
    }, 1000);
    majHUD();
  }

  function demarrerPartie(listeForcee, modeForce) {
    if (!comptePret(true)) return;
    var mode = modeForce || S.mode;
    if (modeForce) S.mode = modeForce;
    var m = modeCourant();
    var pool = listeForcee || poolFiltre();
    if (!pool.length) { toast('Sélectionne au moins un thème.'); return; }
    var n = listeForcee ? pool.length : Math.min(S.count || F.defaut, pool.length);
    if (m.count) n = Math.min(n, m.count);
    S.liste = melanger(pool).slice(0, Math.max(1, n));
    S.index = 0; S.reponses = new Array(S.liste.length).fill(null);
    S.partieId = creerPartieId();
    S.partieUtilisateur = identiteQuiz();
    var reprise = $('#qzSessionEnCours'); if (reprise) reprise.hidden = true;
    S.score = 0; S.bonnes = 0; S.combo = 0; S.meilleurCombo = 0; S.streak = 0;
    S.vies = F.vies ? (m.vies || 3) : 99;
    S.bossHp = m.boss || 0; S.botScore = 0;
    S.duree = 0; S.debut = Date.now(); S.tempsRestant = m.global ? m.temps : m.temps;
    S.termine = false; S.jokers = { fifty: false, hint: false, pass: false };
    S.exclus = []; S.niveauAvant = P.statsQuiz(ID).niveau || 1;
    S.modeRevision = !!listeForcee;
    afficherEcran('jeu');
    renderQuestion();
    lancerChrono();
  }

  function afficherEcran(nom) {
    S.ecran = nom;
    $('#screen-start').hidden = nom !== 'start';
    $('#screen-gameplay').hidden = nom !== 'jeu';
    $('#screen-result').hidden = nom !== 'result';
    var hero = $('#qzHero'); if (hero) hero.hidden = nom === 'result';
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function htmlCode(q) {
    if (!q.code) return '';
    return '<div class="qz-code__barre"><span>fichier : ' + (ID === 'sql' ? 'requete.sql' : ID === 'php' ? 'exemple.php' : 'exemple.js') + '</span>' +
      '<button type="button" class="qz-bouton qz-bouton--ghost" id="qzCopierCode">📋 Copier</button></div>' +
      '<pre><code>' + esc(q.code) + '</code></pre>';
  }

  function renderQuestion() {
    var q = S.liste[S.index];
    if (!q) { terminerPartie(); return; }
    var titre = $('#question-title');
    if (titre) titre.innerHTML = /<\/?[a-z][^>]*>/i.test(q.q) ? q.q : esc(q.q);

    var code = $('#qzCode');
    if (code) {
      if (q.code) { code.hidden = false; code.innerHTML = htmlCode(q); var c = $('#qzCopierCode'); if (c) c.addEventListener('click', function () { copierTexte(q.code); }); }
      else { code.hidden = true; code.innerHTML = ''; }
    }
    /* Aperçu en direct du code HTML/CSS (Quizzora). */
    var apercu = $('#qzApercu');
    if (apercu) {
      var demo = q.demo || (ID === 'html-css' && q.code ? q.code : '');
      if (demo) {
        apercu.hidden = false;
        var frame = $('iframe', apercu);
        frame.srcdoc = '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">' +
          '<style>body{margin:0;padding:12px;font:14px/1.6 system-ui,sans-serif;color:#16223a;background:#fff}' +
          'pre{white-space:pre-wrap;background:#eef2fa;padding:10px;border-radius:8px}' +
          '.demo-panel,.demo-label{padding:8px;border:1px solid #ccd6e6;border-radius:8px;margin:6px 0}</style></head><body>' +
          demo + '</body></html>';
        var charg = $('.qz-apercu__barre span', apercu); if (charg) charg.textContent = 'Rendu isolé (iframe sandbox)';
      } else { apercu.hidden = true; }
    }

    var options = $('#qzOptions');
    var choix = S.reponses[S.index];
    options.innerHTML = q.options.map(function (o, i) {
      var lettre = (CFG.touches || ['1', '2', '3', '4'])[i] || (i + 1);
      var classe = 'qz-choix-btn';
      if (choix !== null && choix !== undefined) {
        if (F.correctionImmediate) {
          if (i === q.answer) classe += ' is-juste';
          else if (i === choix) classe += ' is-faux';
        } else if (i === choix) classe += ' is-choisi';
      }
      if (S.exclus.indexOf(i) !== -1) classe += ' is-exclu';
      return '<button type="button" class="' + classe + '" data-choix="' + i + '" ' +
        (choix !== null && choix !== undefined || S.exclus.indexOf(i) !== -1 ? 'disabled' : '') +
        ' aria-label="Réponse ' + lettre + ' : ' + esc(String(o).replace(/<[^>]+>/g, '')) + '">' +
        '<kbd>' + esc(lettre) + '</kbd><span>' + (/<\/?[a-z][^>]*>/i.test(o) ? o : esc(o)) + '</span></button>';
    }).join('');
    $$('[data-choix]', options).forEach(function (b) {
      b.addEventListener('click', function () { repondre(Number(b.getAttribute('data-choix')), false); });
    });

    var hint = $('#hintBox'); if (hint) hint.hidden = true;
    var expl = $('#explainBox');
    if (expl) {
      if (F.correctionImmediate && choix !== null && choix !== undefined) {
        expl.hidden = false;
        expl.innerHTML = explicationHTML(q, choix);
      } else { expl.hidden = true; expl.innerHTML = ''; }
    }
    var terrain = $('#playgroundResult');
    if (terrain) {
      if (F.terrain && q.code) {
        terrain.hidden = false;
        terrain.innerHTML = '<label for="qzRequete">🧪 Zone d’essai SQL</label>' +
          '<textarea id="qzRequete" rows="2" spellcheck="false">' + esc(q.code) + '</textarea>' +
          '<button type="button" class="qz-bouton qz-bouton--ghost" id="qzExecuterSql">▶ Simuler</button>' +
          '<div class="qz-playground__resultat" id="qzResultatSql"></div>';
        var bt = $('#qzExecuterSql');
        if (bt) bt.addEventListener('click', function () {
          var r = $('#qzResultatSql');
          if (r) r.innerHTML = simulerSQL($('#qzRequete').value);
        });
      } else { terrain.hidden = true; }
    }
    renderJokers();
    renderNav();
    var suivantReprise = $('#qzSuivantAuto');
    if (suivantReprise) suivantReprise.addEventListener('click', questionSuivante);
    majHUD();
  }

  function simulerSQL(requete) {
    var q = String(requete || '').trim();
    if (!q) return '<em>Saisis une requête.</em>';
    if (/^\s*(CREATE|INSERT|UPDATE|DELETE|DROP|ALTER|USE)\b/i.test(q))
      return '✅ Requête de définition / manipulation acceptée (simulation, aucune base modifiée).';
    if (!/SELECT/i.test(q)) return '⚠️ Résultat simulé : utilise une requête SELECT.';
    var lignes = [['1', 'Ali Ben Salah', 'Tunis'], ['2', 'Sara Trabelsi', 'Sfax'], ['3', 'Nour Ayadi', 'Tunis']];
    var f = /WHERE\s+\w+\s*=\s*'?([^'\s;]+)'?/i.exec(q);
    if (f) lignes = lignes.filter(function (l) { return l.join(' ').toLowerCase().indexOf(f[1].toLowerCase()) !== -1; });
    return '<table class="qz-table"><thead><tr><th>NCIN_Cli</th><th>nom_Cli</th><th>ville</th></tr></thead><tbody>' +
      lignes.map(function (l) { return '<tr>' + l.map(function (x) { return '<td>' + esc(x) + '</td>'; }).join('') + '</tr>'; }).join('') +
      '</tbody></table><small>Résultat indicatif sur un jeu d’essai réduit du cours.</small>';
  }

  function explicationHTML(q, choix) {
    var juste = choix === q.answer;
    var bonne = q.options[q.answer];
    var video = CFG.video ? '<button type="button" class="qz-bouton qz-bouton--ghost" id="qzVoirVideo">🎥 Revoir la vidéo du chapitre</button>' : '';
    return '<div class="qz-explain__titre">' + (juste ? '✅ Bonne réponse !' : '❌ Pas tout à fait…') + '</div>' +
      '<p><strong>Bonne réponse :</strong> ' + esc(String(bonne).replace(/<[^>]+>/g, '')) + '</p>' +
      '<div class="qz-explain__texte">' + explication(q.explain) + '</div>' +
      (!juste ? video : '') +
      (F.correctionImmediate ? '<button type="button" class="qz-bouton" id="qzSuivantAuto">Suivant →</button>' : '');
  }

  function explication(v) {
    var s = String(v == null ? '' : v);
    return /<\/?[a-z][^>]*>/i.test(s) ? s : esc(s);
  }

  function renderJokers() {
    var row = $('#lifelinesRow');
    if (!row) return;
    var j = F.jokers || [];
    row.innerHTML = j.map(function (x) {
      var lib = { fifty: '✂️ 50/50', hint: '💡 Indice', pass: '⏭ Passer' }[x];
      return '<button type="button" class="qz-bouton qz-bouton--ghost" data-joker="' + x + '"' +
        (S.jokers[x] ? ' disabled' : '') + '>' + lib + '</button>';
    }).join('') + '<span class="qz-sr-only" id="hintText"></span>';
    $$('[data-joker]', row).forEach(function (b) {
      b.addEventListener('click', function () { utiliserJoker(b.getAttribute('data-joker')); });
    });
  }

  function utiliserJoker(type) {
    var q = S.liste[S.index];
    if (!q || S.jokers[type] || (S.reponses[S.index] !== null && S.reponses[S.index] !== undefined)) return;
    S.jokers[type] = true;
    if (type === 'fifty') {
      var faux = melanger(q.options.map(function (o, i) { return i; }).filter(function (i) { return i !== q.answer; })).slice(0, 2);
      S.exclus = faux;
      toast('✂️ Deux réponses éliminées');
      renderQuestion();
    } else if (type === 'hint') {
      var h = $('#hintBox');
      if (h) { h.hidden = false; setTxt('hintText', q.hint || 'Relis l’énoncé et élimine les réponses impossibles.'); }
    } else if (type === 'pass') {
      S.reponses[S.index] = -2;
      toast('⏭ Question passée');
      questionSuivante();
    }
  }

  function renderNav() {
    var nav = $('#qzNav');
    if (!nav) return;
    var boutons = '';
    if (F.navigation) {
      boutons += '<button type="button" class="qz-bouton qz-bouton--ghost" id="qzPrecedent"' + (S.index === 0 ? ' disabled' : '') + '>← Précédent</button>';
      boutons += '<button type="button" class="qz-bouton" id="qzSuivantNav">Suivant →</button>';
    }
    boutons += '<button type="button" class="qz-bouton qz-bouton--ghost" id="qzTerminer">🏁 Terminer</button>';
    nav.innerHTML = boutons;
    var p = $('#qzPrecedent'), s = $('#qzSuivantNav'), t = $('#qzTerminer');
    if (p) p.addEventListener('click', function () { if (S.index > 0) { S.index--; S.exclus = []; renderQuestion(); lancerChrono(); } });
    if (s) s.addEventListener('click', function () { questionSuivante(); });
    if (t) t.addEventListener('click', terminerPartie);
  }

  function repondre(index, horsDelai) {
    var q = S.liste[S.index];
    if (!q || S.termine) return;
    if (!comptePartieValide(!horsDelai)) { arreterChrono(); return; }
    if (S.reponses[S.index] !== null && S.reponses[S.index] !== undefined) return;
    S.reponses[S.index] = index;
    var juste = index === q.answer;
    var mode = modeCourant();
    if (!mode.global) arreterChrono();   /* le chrono global continue de tourner */

    if (juste) {
      S.bonnes++;
      S.combo++; S.streak++;
      S.meilleurCombo = Math.max(S.meilleurCombo, S.combo);
      var primeTemps = mode.temps && !mode.global ? Math.round(S.tempsRestant * 2) : 0;
      var points = ID === 'html-css' ? 1 : pointsQuestion(q) + primeTemps + Math.min(5, S.combo) * 10;
      S.score += points;
      if (mode.boss) S.bossHp = Math.max(0, S.bossHp - 1);
    } else {
      S.combo = 0; S.streak = 0;
      if (F.vies) {
        S.vies--;
        document.body.classList.add('qz-perte-vie');
        setTimeout(function () { document.body.classList.remove('qz-perte-vie'); }, 450);
      }
    }
    if (mode.duel) {
      var proba = String(q.diff).toLowerCase().indexOf('facile') !== -1 ? 0.82 : 0.62;
      if (Math.random() < proba) S.botScore += pointsQuestion(q);
    }

    majHUD();
    var options = $('#qzOptions');
    $$('[data-choix]', options).forEach(function (b) {
      var i = Number(b.getAttribute('data-choix'));
      b.disabled = true;
      if (F.correctionImmediate) {
        if (i === q.answer) b.classList.add('is-juste');
        else if (i === index) b.classList.add('is-faux');
      } else if (i === index) b.classList.add('is-choisi');
    });
    if (F.correctionImmediate) {
      var expl = $('#explainBox');
      if (expl) {
        expl.hidden = false;
        expl.innerHTML = explicationHTML(q, index);
        var auto = $('#qzSuivantAuto');
        if (auto) auto.addEventListener('click', questionSuivante);
        var vid = $('#qzVoirVideo');
        if (vid) vid.addEventListener('click', revoirVideo);
      }
      if (F.combo && S.combo >= 3) {
        var flamme = $('#stat-combo') || $('#quizCombo');
        if (flamme) { flamme.classList.add('is-flamme'); setTimeout(function () { flamme.classList.remove('is-flamme'); }, 700); }
      }
    }
    sauverPartieActive();
    creditXp(false);
    /* Fin de partie immédiate si plus de vies. */
    if (F.vies && S.vies <= 0) { setTimeout(terminerPartie, 600); return; }
    /* En correction différée (Quizzora), on avance automatiquement. */
    if (!F.correctionImmediate) setTimeout(questionSuivante, 320);
  }

  function questionSuivante() {
    if (S.termine) return;
    if (!comptePartieValide(true)) { arreterChrono(); return; }
    S.exclus = [];
    if (S.index >= S.liste.length - 1) { terminerPartie(); return; }
    S.index++;
    renderQuestion();
    lancerChrono();   /* lancerChrono() nettoie l'intervalle précédent */
    sauverPartieActive();
  }

  function copierTexte(txt) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(function () { toast('✅ Code copié'); }, function () { toast('Copie impossible'); });
    } else toast('Copie indisponible');
  }

  function revoirVideo() {
    var id = CFG.video;
    if (typeof window.ouvrirVideoPasAPasSTI === 'function' && id) {
      window.ouvrirVideoPasAPasSTI(id, '🎥 Revoir la vidéo du chapitre');
    } else {
      var c = CFG.cours[0];
      if (c) window.location.href = u(c.url.replace('#cours', '#videos'));
    }
  }

  /* -------------------------------------------------------------------------
     4. BILAN FINAL — score, précision, XP, badges, certificat, revue
     ---------------------------------------------------------------------- */
  function identifiantErreurs() {
    var out = [];
    S.liste.forEach(function (q, i) {
      var r = S.reponses[i];
      if (typeof r === 'number' && r >= 0 && r !== q.answer) out.push(q.id);
    });
    return out;
  }

  function reponsesDetaillees() {
    return S.liste.map(function (q, i) {
      return typeof S.reponses[i] === 'number' && S.reponses[i] >= 0 ?
        { id: q.id, module: q.cat, enonce: q.q, ok: S.reponses[i] === q.answer } : null;
    }).filter(Boolean);
  }

  function confettis() {
    var boite = $('#qzConfettis');
    if (!boite) return;
    boite.innerHTML = '';
    for (var i = 0; i < 46; i++) {
      var p = document.createElement('i');
      p.style.left = (Math.random() * 100) + '%';
      p.style.animationDelay = (Math.random() * 1.2) + 's';
      p.style.animationDuration = (2 + Math.random() * 2) + 's';
      p.style.background = ['var(--html)', 'var(--css)', 'var(--js)', 'var(--sql)', 'var(--php)', 'var(--gold)'][i % 6];
      boite.appendChild(p);
    }
    setTimeout(function () { boite.innerHTML = ''; }, 5200);
  }

  function terminerPartie() {
    if (S.termine) return;
    if (!comptePartieValide(true)) { arreterChrono(); return; }
    S.termine = true;
    arreterChrono();
    S.duree = Math.round((Date.now() - S.debut) / 1000);
    var repondues = nbReponsesDonnees();
    var total = Math.max(1, repondues);
    var precision = repondues ? Math.round(S.bonnes / repondues * 100) : 0;
    var bonusTemps = ID !== 'html-css' && repondues ? Math.round(S.tempsRestant * 3) : 0;
    S.score += bonusTemps;
    var erreurs = identifiantErreurs();
    var xp = gainXp(true), nouveauxBadges = [];
    if (F.badges) {
      var st = P.statsQuiz(ID);
      var simil = {
        parties: st.parties + 1, xp: st.xp + xp, niveau: st.niveau,
        serie: Math.max(st.serie, S.meilleurCombo), meilleur: Math.max(st.meilleur, S.score),
        reponses: st.reponses + repondues, badges: st.badges
      };
      BADGES_SQL.forEach(function (b) { if (b.test(simil) && (st.badges || []).indexOf(b.id) === -1) nouveauxBadges.push(b.id); });
    }
    /* Le compte de laboratoire est partagé : ses résultats ne doivent pas
       entrer dans le profil synchronisé ni dans les files cloud. */
    var qs = quizSync(), compteSansScore = Boolean(qs && qs.compteSansScore && qs.compteSansScore());
    /* Crédit cumulatif write-ahead : un seul delta par UUID, même si la
       partie est reprise ou terminée dans plusieurs onglets. */
    if (repondues && !compteSansScore) {
      creditXp(true);
      P.enregistrerPartieQuiz(ID, {
        partieId: S.partieId, score: S.bonnes, points: S.score, total: total,
        mode: S.mode, reponses: repondues, erreurs: erreurs, combo: S.meilleurCombo, duree: S.duree,
        xp: xp, serie: S.meilleurCombo, badges: nouveauxBadges,
        chrono: S.mode === 'chrono' || S.mode === 'sixty' ? S.duree : 0
      });
    }
    var details = reponsesDetaillees();
    if (qs && !compteSansScore && repondues && typeof qs.enregistrer === 'function') {
      try { qs.enregistrer(ID, S.bonnes, repondues, S.mode, {
        partie_id: S.partieId, points: S.score, ordre_questions: S.liste
      }); } catch (e) {}
    } else if (qs && !compteSansScore && typeof qs.effacerSession === 'function') {
      try { qs.effacerSession(ID, S.partieId); } catch (e) {}
    }
    if (qs && !compteSansScore && details.length && typeof qs.enregistrerReponses === 'function') {
      try { qs.enregistrerReponses(ID, null, details); } catch (e) {}
    }

    renderResultat(precision, bonusTemps, xp, nouveauxBadges);
    afficherEcran('result');
    if (precision >= 70) confettis();
    peindreHero(); peindrePalmares();
  }

  function renderResultat(precision, bonusTemps, xp, nouveauxBadges) {
    var total = nbReponsesDonnees();
    var gagne = total > 0 && precision >= 70;
    var titre = precision >= 90 ? '🏆 Légende du code !' : precision >= 70 ? '🎉 Très belle partie !' :
      precision >= 50 ? '👍 Continue comme ça' : '📚 Encore un effort';
    var grade = precision >= 90 ? 'S' : precision >= 75 ? 'A' : precision >= 60 ? 'B' : precision >= 40 ? 'C' : 'D';
    setTxt('result-title', titre);
    setTxt('result-badge-icon', gagne ? '🏆' : '📘');
    setTxt('gradeBadge', 'Niveau ' + grade);
    setTxt('result-status-tag', precision + ' % de réussite');
    setTxt('result-desc', 'Tu as répondu correctement à ' + S.bonnes + ' question(s) sur ' + total +
      ' en ' + fmtTemps(S.duree) + '. ' + (gagne ? 'Bravo, tu maîtrises cette matière !' : 'Rejoue mes erreurs pour progresser.'));
    setTxt('resScore', S.score);
    setTxt('res-accuracy', precision + ' %');
    setTxt('res-combo', S.meilleurCombo);
    setTxt('res-time-bonus', bonusTemps);
    setTxt('resStreak', S.streak);
    setTxt('xpGained', xp);
    setTxt('resXP', xp);
    setTxt('certScore', S.score);
    setTxt('qzCertDate', new Date().toLocaleDateString('fr-FR'));

    var stats = [
      ['Questions', total], ['Réussies', S.bonnes], ['Précision', precision + ' %'],
      ['Meilleur combo', S.meilleurCombo], ['Durée', fmtTemps(S.duree)], ['Bonus temps', bonusTemps]
    ];
    var grille = $('#resStatsGrid');
    if (grille) grille.innerHTML = stats.map(function (x) {
      return '<div class="qz-result__stat"><small>' + esc(x[0]) + '</small><strong>' + esc(String(x[1])) + '</strong></div>';
    }).join('');
    var bot = modeCourant().duel;
    setTxt('resBotResult', bot ? (S.botScore > S.score ? 'RoboQuery gagne ce duel 🤖' : 'Tu as battu RoboQuery ! 🏆') : '');

    var st = P.statsQuiz(ID);
    var barre = $('#resXpBar');
    if (barre) barre.style.width = Math.min(100, ((st.xp || 0) % 500) / 5) + '%';
    var niveau = st.niveau || 1;
    var lvl = $('#levelUpMsg');
    if (lvl) {
      lvl.hidden = niveau <= S.niveauAvant;
      lvl.textContent = '🎉 Niveau supérieur ! Tu passes niveau ' + niveau + '.';
    }
    if (niveau > S.niveauAvant) {
      var mod = $('#levelupModal');
      if (mod) {
        mod.hidden = false;
        setTxt('qzLevelTitre', 'Niveau ' + niveau + ' atteint !');
        setTxt('qzLevelNom', 'Bravo, tu gagnes de l’expérience à chaque partie.');
        var f = $('#qzLevelFermer'); if (f) f.addEventListener('click', function () { mod.hidden = true; }, { once: true });
      }
    }
    var cert = $('#qzCertificat');
    if (cert) cert.hidden = !F.certificat || precision < 50;

    renderRevue();
  }

  function renderRevue() {
    var liste = $('#reviewList'), compteur = $('#reviewCount'), alias = $('#resReview');
    var html = S.liste.map(function (q, i) {
      var r = S.reponses[i];
      var juste = r === q.answer;
      var mienne = r === -2 ? 'Question passée' : r === null || r === undefined || r < 0 ? 'Aucune réponse' : q.options[r];
      return '<article class="qz-revue__item ' + (juste ? 'is-ok' : 'is-ko') + '">' +
        '<div class="qz-revue__tete"><span class="qz-badge">' + (i + 1) + ' · ' + esc(q.catNom || q.cat) + '</span>' +
        '<span class="qz-badge">' + (juste ? '✅ Juste' : r === null || r === undefined || r < 0 ? 'Non répondue' : '❌ À revoir') + '</span></div>' +
        '<h4>' + esc(String(q.q).replace(/<[^>]+>/g, '')) + '</h4>' +
        '<p><strong>Ta réponse :</strong> ' + esc(String(mienne).replace(/<[^>]+>/g, '')) + '</p>' +
        '<p><strong>Bonne réponse :</strong> ' + esc(String(q.options[q.answer]).replace(/<[^>]+>/g, '')) + '</p>' +
        '<div class="qz-revue__explain">' + explication(q.explain) + '</div>' +
        '<button type="button" class="qz-bouton qz-bouton--ghost" data-revoir-chapitre="' + esc(q.cat) + '">📖 Revoir le chapitre</button>' +
        '</article>';
    }).join('');
    if (liste) liste.innerHTML = html;
    if (compteur) compteur.textContent = S.liste.length + ' questions';
    if (alias) alias.textContent = S.liste.length + ' questions corrigées';
    $$('[data-revoir-chapitre]', liste || document).forEach(function (b) {
      b.addEventListener('click', function () {
        var c = CFG.cours[0];
        if (c) window.location.href = u(c.url);
      });
    });
  }

  /* -------------------------------------------------------------------------
     5. REJOUER MES ERREURS (mêmes données que la page « Mes erreurs »)
     ---------------------------------------------------------------------- */
  function listeErreurs() {
    var ids = P.erreursQuiz(ID);
    try {
      if (window.STIQuizSync && typeof window.STIQuizSync.revisionIds === 'function') {
        var rev = window.STIQuizSync.revisionIds(ID);
        if (rev && rev.length) ids = ids.concat(rev.map(String));
      }
    } catch (e) {}
    ids = ids.filter(function (x, i, a) { return a.indexOf(x) === i; });
    var trouvees = BANQUE.filter(function (q) { return ids.indexOf(String(q.id)) !== -1; });
    if (!trouvees.length) {
      /* Repli : les erreurs de la dernière partie viennent d'être enregistrées. */
      var derniere = P.chargerProfil().quiz.slice().reverse().filter(function (x) { return x.matiere === ID; })[0];
      var e = derniere && derniere.erreurs || [];
      trouvees = BANQUE.filter(function (q) { return e.map(String).indexOf(String(q.id)) !== -1; });
    }
    return trouvees;
  }

  function rejouerErreurs() {
    var liste = listeErreurs();
    if (!liste.length) { toast('🎉 Aucune erreur enregistrée : bravo !'); return; }
    var rev = CFG.modes.filter(function (m) { return m.id === 'revision'; })[0];
    demarrerPartie(liste, rev ? 'revision' : S.mode);
    toast('🔁 ' + liste.length + ' question(s) à retravailler');
  }

  /* -------------------------------------------------------------------------
     6. ÉVÉNEMENTS + CLAVIER + DÉMARRAGE
     ---------------------------------------------------------------------- */
  function brancherEvenements() {
    var start = $('#qzCommencer'); if (start) start.addEventListener('click', function () { demarrerPartie(); });
    var rapide = $('#quickStart'); if (rapide) rapide.addEventListener('click', function () { S.cats = []; S.count = F.defaut; demarrerPartie(); });
    var err = $('#qzMesErreurs'); if (err) err.addEventListener('click', rejouerErreurs);
    var rej = $('#qzRejouer'); if (rej) rej.addEventListener('click', function () { demarrerPartie(); });
    var rejErr = $('#qzRejouerErreurs'); if (rejErr) rejErr.addEventListener('click', rejouerErreurs);
    var video = $('#qzRevoirVideo'); if (video) video.addEventListener('click', revoirVideo);
    var haut = $('#qzHaut');
    if (haut) {
      haut.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
      window.addEventListener('scroll', function () { haut.classList.toggle('is-visible', window.pageYOffset > 450); }, { passive: true });
    }
    document.addEventListener('keydown', function (e) {
      if (S.ecran !== 'jeu' || S.termine) return;
      if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      var touche = String(e.key || '').toLowerCase();
      var touches = CFG.touches || ['1', '2', '3', '4'];
      var idx = touches.map(function (t) { return String(t).toLowerCase(); }).indexOf(touche);
      if (idx === -1) {
        idx = ['1', '2', '3', '4'].indexOf(touche);
      }
      if (idx >= 0 && idx < 4) { e.preventDefault(); repondre(idx, false); return; }
      if (e.key === 'Enter') {
        var bouton = $('#qzSuivantAuto') || $('#qzSuivantNav');
        if (bouton) { e.preventDefault(); bouton.click(); }
      }
      if (e.key === 'Escape' && !$('#levelupModal').hidden) $('#levelupModal').hidden = true;
    });
    window.addEventListener('pagehide', sauverPartieActive);
    window.addEventListener('beforeunload', arreterChrono);
  }

  /* Crochet stable pour acces.js : l'ancien scripts met à jour #sti-roue-btn
     (titre « Mon compte GOLD », couleur, avatar). Le badge visible du design
     system garde #stiBadgeBtn ; cet alias caché évite tout doublon d'identifiant
     et laisse acces.js fonctionner sans modification. */
  function installerAliasRoue() {
    if (document.getElementById('sti-roue-btn')) return;
    var slot = $('#stiBadgeSlot');
    var alias = el('<span id="sti-roue-btn" data-sti-init="1" class="qz-sr-only" aria-hidden="true">' +
      '<img class="sti-roue-photo-img" alt="" width="1" height="1"></span>');
    if (slot && slot.parentNode) slot.parentNode.insertBefore(alias, slot.nextSibling);
    else document.body.appendChild(alias);
  }

  function demarrer() {
    if ($('#stiQuizApp')) return;
    try {
      BANQUE = CFG.questions() || [];
      if (!BANQUE.length) { console.warn('STI quiz : banque vide pour', ID); return; }
      S.count = Math.min(F.defaut, BANQUE.length);
      /* Migration douce de l'ancienne progression du quiz (SQL Quest v3…). */
      if (CFG.ancienneCle) P.migrerAncienQuiz(ID, CFG.ancienneCle);

      var app = el('<div class="container qz-shell" id="stiQuizApp" data-accent="' + esc(ID) + '"></div>');
      app.innerHTML = coquilleHTML();
      var footer = $('.site-footer');
      if (footer) document.body.insertBefore(app, footer); else document.body.appendChild(app);
      document.documentElement.style.setProperty('--qz-accent', 'var(' + CFG.accent + ')');
      document.documentElement.style.setProperty('--qz-accent-2', 'var(' + CFG.accent2 + ')');
      document.body.classList.add('qz-page');
      installerAliasRoue();

      peindreStart();
      brancherEvenements();
      afficherEcran('start');
      proposerReprise();
      window.addEventListener('online', function () { if (S.ecran === 'start') proposerReprise(); });
      window.addEventListener('storage', function () { if (S.ecran === 'start') proposerReprise(); });
      window.addEventListener('sti-cloud-restored', function () {
        if (S.ecran !== 'start' || !comptePret(false)) return;
        if (CFG.ancienneCle) P.migrerAncienQuiz(ID, CFG.ancienneCle);
        peindreHero();
        proposerReprise();
      });

      /* Lien direct depuis « Mes erreurs » (?revision=erreurs). */
      if (/[?&]revision=erreurs/.test(location.search || '')) {
        setTimeout(function () { rejouerErreurs(); }, 120);
      }
      /* Compatibilité : ouverture de la vidéo du chapitre. */
      if (typeof window.ouvrirVideoPasAPasSTI !== 'function') {
        window.ouvrirVideoPasAPasSTI = function (identifiant, titre) {
          var c = CFG.cours[0];
          if (c) window.location.href = u(c.url.replace('#cours', '#videos'));
        };
      }
    } catch (err) {
      if (window.console && console.warn) console.warn('STI quiz v2 :', err);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer);
  else demarrer();
})();
