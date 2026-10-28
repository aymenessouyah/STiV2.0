/* ============================================================================
   STI V2.0 — COUCHE DE DONNÉES DE L'ABONNÉ (assets/js/profil.js)
   ----------------------------------------------------------------------------
   C'est LE SEUL fichier du nouveau design qui parle à localStorage.
   Toutes les données de l'élève vivent dans UN SEUL objet « profilAbonne »,
   sérialisé en JSON sous la clé « sti-profil-abonne ». Le préfixe « sti- » est
   obligatoire : sync-progressions.js copie automatiquement les clés « sti-* »
   vers la table cloud « sti_progressions » quand une session Supabase existe.
   Sans session, tout fonctionne localement (principe d'origine respecté).

   STRUCTURE DU PROFIL (documentation officielle) :
   {
     prenom: "Aymen",                         // prénom affiché dans le badge
     nom: "",                                 // nom (facultatif)
     theme: "sombre",                         // sombre | clair | intermediaire
     langue: "fr",                            // fr | en | ar
     tailleTexte: "normal",                  // petit | normal | grand
     derniereLecture: {                       // reprise de lecture
       matiere: "html5", chapitre: "Les balises", pourcent: 35, url: "cours/html5.html"
     },
     progression: { html5:0, css3:0, javascript:0, sql:0, php:0 }, // 0 → 5 chapitres révisés
     quiz: [ { matiere:"sql", score:14, total:20, date:"2026-10-27", erreurs:[] } ],
     videos: { vues:["html5-cours"], derniere:{ id:"css3-cours", temps:0 }, positions:{} },
     notes: [ { atelier:"TP1 HTML", note:16, date:"2026-10-20" } ],
     nouveautesLues: ["v478"],
     cours: { chapitres:{}, exercices:{}, laboratoires:{}, fenetres:{},
              miniQuiz:{}, audio:{} }   // pages matière (cours.js)
   }

   API PUBLIQUE (window.STIProfil) :
     chargerProfil()                  → objet complet (toujours valide)
     sauvegarderProfil(profil)       → persiste + notifie l'interface
     mettreAJour("quiz", valeur)     → met à jour un chemin (« a.b.c » ou tableau)
     reinitialiser()                 → profil vierge
     ... + quelques utilitaires de lecture d'état (session / GOLD) qui ne font
         QUE lire ce que acces.js et supabase-umd.js ont déjà calculé.
   ========================================================================== */
(function () {
  'use strict';

  /* Chargé deux fois sur les pages matière (une fois en tête pour peindre le
     thème sans flash, une fois dans la chaîne imposée config → … → profil →
     app) : la seconde exécution est neutralisée ici, sans double observateur. */
  if (window.STIProfil && window.STIProfil.__stiCharge) return;

  var global = window;
  var CLE = 'sti-profil-abonne';            // préfixe « sti- » → synchronisé
  var MATIERES_CLES = ['html5', 'css3', 'javascript', 'sql', 'php'];
  var ETATS_CHAPITRE_VALIDES = { a_reviser: true, en_cours: true, revise: true };
  var PAGES_COURS_HISTORIQUES = {
    html5: ['cours/html5.html', 'cours/courshtml5.html'],
    css3: ['cours/css3.html', 'cours/courscss3.html'],
    javascript: ['cours/javascript.html'],
    sql: ['cours/sql.html', 'cours/sql-bases-ldd-lmd-lcd.html'],
    php: ['cours/php.html', 'cours/coursphp.html', 'cours/php-mysqli.html']
  };
  /* Les identifiants v493 et ceux de la refonte désignent les mêmes leçons.
     Les anciens états sont conservés et les deux écritures restent lisibles. */
  var CHAPITRES_HISTORIQUES = {
    html5: { h1:'entete', h2:'structuration', h3:'conteneurs', h4:'listes', h5:'tableaux', h6:'texte-media', h7:'attributs-evenements', h8:'target-explication', h9:'formulaires', h10:'iframe' },
    css3: { c1:'selecteurs', c2:'typographie', c3:'arriere-plan', c4:'boite-display', c5:'marges-debordement', c6:'positionnement', c7:'tableaux-listes', c8:'filtres', c9:'animations', c10:'pas-a-pas' },
    javascript: { j1:'sec1', j2:'sec2', j3:'sec3', j4:'sec4', j5:'sec5', j6:'sec6', j7:'sec7', j8:'sec8', 'j-chaines':'sec9', j9:'sec10', 'j-date':'sec11', j10:'sec12', j11:'sec13', j12:'sec14', j13:'sec15' },
    sql: { s1:'intro', s2:'ldd', s3:'lmd', s4:'bac' },
    php: { p1:'s1', p2:'s2', p3:'s3', p4:'s4', p5:'s5', p6:'s6', p7:'s7', p8:'s8', p9:'s9', p10:'s10' }
  };
  function identifiantChapitre(matiere, id) {
    var map = CHAPITRES_HISTORIQUES[matiere] || {}, texte = String(id || '');
    if (Object.prototype.hasOwnProperty.call(map, texte)) return texte;
    return Object.keys(map).find(function (k) { return map[k] === texte; }) || texte;
  }
  function aliasChapitre(matiere, id) {
    var courant = identifiantChapitre(matiere, id), ancien = (CHAPITRES_HISTORIQUES[matiere] || {})[courant];
    return ancien && ancien !== courant ? [courant, ancien] : [courant];
  }
  function chapitreFaitDans(p, matiere, id) {
    return aliasChapitre(matiere, id).some(function (alias) {
      return p.cours.chapitres[cle(matiere, alias)] === true ||
        Boolean(p.chapitres[matiere] && p.chapitres[matiere][alias] === 'revise');
    });
  }
  function compteurChapitres(p, matiere, ids) {
    var candidats = Array.isArray(ids) ? ids : Object.keys(CHAPITRES_HISTORIQUES[matiere] || {});
    /* j14 est un ajout de la refonte, distinct des anciennes sections JS. */
    if (!Array.isArray(ids) && matiere === 'javascript') candidats.push('j14');
    return candidats.filter(function (id, i) {
      return candidats.findIndex(function (autre) { return identifiantChapitre(matiere, autre) === identifiantChapitre(matiere, id); }) === i && chapitreFaitDans(p, matiere, id);
    }).length;
  }
  var scriptProfil = document.currentScript;
  var sourceProfil = scriptProfil && scriptProfil.src || '';
  var profilPourQuiz = Boolean(scriptProfil && scriptProfil.hasAttribute && scriptProfil.hasAttribute('data-sti-quiz-seul'));
  var etatSessionCourant = { connecte: false, id: '', estGold: false, email: '',
    prenomSession: '', nomSession: '', classe: '', lycee: '', initiales: '' };
  var THEMES = ['sombre', 'clair', 'intermediaire'];
  var LANGUES = ['fr', 'en', 'ar'];
  var TAILLES = { petit: .9, normal: 1, grand: 1.15 };
  var cache = null;                          // copie mémoire du profil
  var derniereValeurStockee = null;
  var profilPresentDansStockage = false;

  /* Objet vierge : toute nouvelle clé doit être ajoutée ici. */
  function profilVierge() {
    return {
      prenom: '',
      nom: '',
      theme: 'sombre',
      langue: 'fr',
      tailleTexte: 'normal',
      vitesseAudio: 1,
      coursVisites: [],
      chapitres: { html5: {}, css3: {}, javascript: {}, sql: {}, php: {} },
      exercicesFaits: { html5: [], css3: [], javascript: [], sql: [], php: [] },
      laboratoires: { html5: [], css3: [], javascript: [], sql: [], php: [] },
      invitationInstallationVue: false,
      derniereLecture: { matiere: '', chapitre: '', chapitreId: '', pourcent: 0, url: '' },
      progression: { html5: false, css3: false, javascript: false, sql: false, php: false },
      quiz: [],
      videos: { vues: [], derniere: null, positions: {} },
      notes: [],
      nouveautesLues: [],
      /* ---- Pages de cours (ajout de la refonte v2) ----
         Toutes les actions pédagogiques sont regroupées ici : aucun autre
         script du nouveau design n'a le droit d'écrire dans localStorage. */
      cours: {
        chapitres: {},     // { "html5:ch3": true }        — chapitre révisé
        exercices: {},     // { "sql:ex4": true }          — exercice fait
        laboratoires: {},  // { "css3:box-shadow": {...} } — valeurs des curseurs
        fenetres: {},      // { "html5:tpl-target": true } — fenêtre déjà ouverte
        miniQuiz: {},      // { "php:synthese": {score,total,date} }
        audio: {}          // { "sql-cours": { temps: 42 } } — Guide-Ligne
      },
      /* ---- Quiz (arènes) : une entrée par quiz, dans le même objet ---- */
      quizStats: {
        parQuiz: {},       // Statistiques gamifiées de chaque arène.
        partiesTerminees: [] // Identifiants des parties déjà enregistrées localement.
      }
    };
  }

  /* Fusion défensive : garantit la structure même si le JSON est ancien/altéré. */
  function normaliser(p) {
    var v = profilVierge();
    if (!p || typeof p !== 'object') return v;
    ['prenom', 'nom', 'theme', 'langue', 'tailleTexte'].forEach(function (k) {
      if (typeof p[k] === 'string') v[k] = p[k];
    });
    if (THEMES.indexOf(v.theme) === -1) v.theme = 'sombre';
    if (LANGUES.indexOf(v.langue) === -1) v.langue = 'fr';
    /* Accepter les noms de tailles utilisés avant la refonte. */
    v.tailleTexte = ({ petite: 'petit', normale: 'normal', grande: 'grand' })[v.tailleTexte] || v.tailleTexte;
    if (!TAILLES[v.tailleTexte]) v.tailleTexte = 'normal';
    v.vitesseAudio = [0.85, 1, 1.15].indexOf(Number(p.vitesseAudio)) >= 0 ? Number(p.vitesseAudio) : 1;
    v.invitationInstallationVue = p.invitationInstallationVue === true;
    v.coursVisites = Array.isArray(p.coursVisites) ? Array.from(new Set(p.coursVisites.filter(function (m) {
      return MATIERES_CLES.indexOf(m) !== -1;
    }))) : [];
    MATIERES_CLES.forEach(function (m) {
      var etats = p.chapitres && p.chapitres[m];
      if (etats && typeof etats === 'object' && !Array.isArray(etats)) {
        Object.keys(etats).forEach(function (id) {
          var etat = etats[id] === true ? 'revise' : etats[id];
          if (/^[a-z0-9-]+$/i.test(id) && ETATS_CHAPITRE_VALIDES[etat] && etat !== 'a_reviser') v.chapitres[m][id] = etat;
        });
      }
      ['exercicesFaits', 'laboratoires'].forEach(function (nom) {
        var liste = p[nom] && p[nom][m];
        if (Array.isArray(liste)) v[nom][m] = Array.from(new Set(liste.map(String).filter(Boolean)));
      });
    });
    if (p.derniereLecture && typeof p.derniereLecture === 'object') {
      v.derniereLecture = {
        matiere: String(p.derniereLecture.matiere || ''),
        chapitre: String(p.derniereLecture.chapitre || ''),
        chapitreId: String(p.derniereLecture.chapitreId || ''),
        pourcent: Math.max(0, Math.min(100, Number(p.derniereLecture.pourcent) || 0)),
        url: String(p.derniereLecture.url || '')
      };
    }
    if (p.progression && typeof p.progression === 'object') {
      Object.keys(v.progression).forEach(function (m) {
        var valeur = p.progression[m];
        /* L'ancien indicateur est booléen ; le tableau de bord V2 utilise 0–5. */
        v.progression[m] = typeof valeur === 'boolean' ? valeur : Math.max(0, Math.min(5, Number(valeur) || 0));
      });
    }
    if (Array.isArray(p.quiz)) v.quiz = p.quiz.slice(-40).filter(function (q) { return q && typeof q === 'object'; });
    if (p.videos && typeof p.videos === 'object') {
      v.videos.vues = Array.isArray(p.videos.vues) ? p.videos.vues.slice(-200) : [];
      v.videos.derniere = (p.videos.derniere && typeof p.videos.derniere === 'object') ? p.videos.derniere : null;
      if (p.videos.positions && typeof p.videos.positions === 'object') {
        Object.keys(p.videos.positions).slice(0, 200).forEach(function (k) {
          var q = p.videos.positions[k];
          if (typeof q === 'number' && Number.isFinite(q)) v.videos.positions[k] = Math.max(0, q);
          else if (q && typeof q === 'object') v.videos.positions[k] = { temps: Number(q.temps) || 0, duree: Number(q.duree) || 0 };
        });
      }
    }
    if (Array.isArray(p.notes)) v.notes = p.notes.slice(-40);
    if (Array.isArray(p.nouveautesLues)) v.nouveautesLues = p.nouveautesLues.slice(-100);
    if (p.quizStats && Array.isArray(p.quizStats.partiesTerminees)) {
      v.quizStats.partiesTerminees = Array.from(new Set(p.quizStats.partiesTerminees.filter(function (id) {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id));
      }))).slice(-1000);
    }
    if (p.quizStats && p.quizStats.parQuiz && typeof p.quizStats.parQuiz === 'object') {
      Object.keys(p.quizStats.parQuiz).slice(0, 20).forEach(function (cle) {
        var q = p.quizStats.parQuiz[cle];
        if (q && typeof q === 'object') v.quizStats.parQuiz[cle] = {
          meilleur: Number(q.meilleur) || 0,
          reponses: Number(q.reponses) || 0,
          xp: Number(q.xp) || 0,
          niveau: Math.max(1, Number(q.niveau) || 1),
          serie: Number(q.serie) || 0,
          badges: Array.isArray(q.badges) ? q.badges.slice(-60) : [],
          classement: Array.isArray(q.classement) ? q.classement.slice(-10) : [],
          meilleurChrono: Number(q.meilleurChrono) || 0,
          parties: Number(q.parties) || 0
        };
      });
    }
    if (p.cours && typeof p.cours === 'object') {
      v.cours.chapitres = objetBooleen(p.cours.chapitres, 400);
      v.cours.exercices = objetBooleen(p.cours.exercices, 400);
      v.cours.fenetres = objetBooleen(p.cours.fenetres, 200);
      ['laboratoires', 'miniQuiz', 'audio'].forEach(function (k) {
        if (!p.cours[k] || typeof p.cours[k] !== 'object') return;
        Object.keys(p.cours[k]).slice(0, 200).forEach(function (cle) {
          var val = p.cours[k][cle];
          if (val && typeof val === 'object') v.cours[k][cle] = val;
        });
      });
    }
    return v;
  }

  /* Copie défensive d'un dictionnaire { clé : valeur } venu du JSON. */
  function objetBooleen(source, limite, transformer) {
    var out = {};
    if (!source || typeof source !== 'object' || Array.isArray(source)) return out;
    Object.keys(source).slice(0, limite).forEach(function (cle) {
      var val = source[cle];
      if (transformer) out[cle] = transformer(val);
      else if (val === true || val === 1 || val === '1') out[cle] = true;
    });
    return out;
  }

  /* ---------- 1. LECTURE / ÉCRITURE (seul endroit autorisé) ---------- */
  function chargerProfil() {
    var brut;
    try { brut = localStorage.getItem(CLE); }
    catch (e) { return cache || (cache = profilVierge()); }
    /* Relire après une restauration cloud, un autre onglet ou une isolation de compte. */
    if (cache && brut === derniereValeurStockee) return cache;
    var p = null;
    if (brut) { try { p = JSON.parse(brut); } catch (eJson) { p = null; } }
    if (!brut && !profilPresentDansStockage && !cache) {
      /* Migration initiale des préférences historiques, jamais après une purge de compte. */
      p = {};
      try {
        var t = localStorage.getItem('sti-theme') || '';
        if (t === 'dark') p.theme = 'sombre';
        else if (t === 'light') p.theme = 'clair';
        var hs = localStorage.getItem('js_quiz_high_score');
        if (hs && Number(hs) > 0) p.quiz = [{ matiere: 'javascript', score: Number(hs), total: 20, date: '', erreurs: [] }];
      } catch (eMigration) {}
    }
    cache = normaliser(p);
    derniereValeurStockee = brut;
    profilPresentDansStockage = Boolean(brut);
    return cache;
  }

  /* Miroir des clés de thème historiques : les pages d'origine et les quiz
     lisent « sti-roue-theme » / « sti-theme ». C'est bien profil.js, et lui
     seul, qui écrit dans localStorage. */
  function mirroirTheme(profil) {
    var p = profil || chargerProfil();
    try {
      if (localStorage.getItem('sti-roue-theme') !== p.theme) localStorage.setItem('sti-roue-theme', p.theme);
      var legacy = p.theme === 'clair' ? 'light' : 'dark';
      if (localStorage.getItem('sti-theme') !== legacy) localStorage.setItem('sti-theme', legacy);
      if (localStorage.getItem('theme') !== legacy) localStorage.setItem('theme', legacy);
    } catch (e) { /* stockage bloqué */ }
  }

  function sauvegarderProfil(profil) {
    cache = normaliser(profil || cache || {});
    try {
      derniereValeurStockee = JSON.stringify(cache);
      localStorage.setItem(CLE, derniereValeurStockee);
      profilPresentDansStockage = true;
    } catch (e) { /* quota / privé : la copie mémoire reste utilisable */ }
    if (!profilPourQuiz) mirroirTheme(cache);
    /* Les deux noms d'événements maintiennent les interfaces V2 et historiques. */
    notifierChangement('sti:profil', cache);
    notifierChangement('sti:profil-maj', cache);
    return cache;
  }

  /* met à jour un chemin : "theme", "progression.sql", "videos.vues", … */
  function mettreAJour(chemin, valeur) {
    var p = chargerProfil();
    var morceaux = String(chemin || '').split('.').filter(Boolean);
    if (!morceaux.length) return p;
    var cible = p;
    for (var i = 0; i < morceaux.length - 1; i++) {
      var k = morceaux[i];
      if (typeof cible[k] !== 'object' || cible[k] === null || Array.isArray(cible[k])) cible[k] = {};
      cible = cible[k];
    }
    cible[morceaux[morceaux.length - 1]] = valeur;
    return sauvegarderProfil(p);
  }

  function reinitialiser() {
    cache = profilVierge();
    try { localStorage.removeItem(CLE); } catch (e) {}
    derniereValeurStockee = null;
    profilPresentDansStockage = false;
    return sauvegarderProfil(cache);
  }

  /* ---------- 2. PRÉFÉRENCES ---------- */
  function appliquerPreferences() {
    var p = chargerProfil();
    mirroirTheme(p);
    var r = document.documentElement;
    r.setAttribute('data-theme', p.theme);          // sombre | clair | intermediaire
    r.style.setProperty('--echelle-texte', TAILLES[p.tailleTexte] || 1);
    r.setAttribute('lang', p.langue);
    r.setAttribute('dir', p.langue === 'ar' ? 'rtl' : 'ltr');
    return p;
  }

  /* Antiflash : ce fichier est chargé (defer) après acces.js ; le petit script
     inline du <head> pose déjà data-theme. Ici on confirme la valeur et on
     neutralise l'ancien thème sombre universel si acces.js l'a réinjecté. */
  function garderTheme() {
    var p = chargerProfil();
    var r = document.documentElement;
    if (r.getAttribute('data-theme') !== p.theme) r.setAttribute('data-theme', p.theme);
    var legacy = document.getElementById('sti-sombre-css-v372');
    if (legacy) legacy.disabled = true;
    ['dark', 'light'].forEach(function (c) {
      if (p.theme !== 'sombre' || c !== 'dark') r.classList.remove(c + '-mode');
    });
  }

  /* ---------- 3. ÉTAT DE SESSION / GOLD (lecture seule) ----------
     On ne recalcule RIEN : on lit uniquement ce que les scripts conservés
     (acces.js, supabase-umd.js) exposent déjà. Aucune clé ni URL n'est écrite
     ici, tout passe par window.STI_AUTH. */
  function estGold() {
    try {
      if (window.__STI_GOLD === true) return true;
      if (document.documentElement.classList.contains('sti-gold')) return true;
      if (document.body && document.body.classList.contains('sti-gold')) return true;
    } catch (e) {}
    return false;
  }

  function session() {
    var sb = window.__STI_SB_CLIENT || (window.supabase && window.supabase.__stiClient);
    if (sb && sb.auth && typeof sb.auth.getSession === 'function') {
      try {
        var r = sb.auth.getSession();
        if (r && typeof r.then === 'function') {
          return r.then(function (x) { return (x && x.data && x.data.session) || null; }).catch(function () { return null; });
        }
        return (r && r.data && r.data.session) || null;
      } catch (e) { return null; }
    }
    return null;
  }

  /* Résume l'état abonné pour l'interface : ne fait que lire. */
  function etatAbonne(donneesSession) {
    var p = chargerProfil();
    var s = donneesSession || null;
    var meta = (s && s.user && (s.user.user_metadata || s.user.metadata)) || {};
    var email = (s && s.user && s.user.email) || '';
    var prenom = String(meta.prenom || meta.first_name || p.prenom || '').trim();
    var nom = String(meta.nom || meta.last_name || p.nom || '').trim();
    var connecte = Boolean(s && s.user) || estGold();
    var affiche = prenom || (email ? email.split('@')[0] : '');
    return {
      connecte: connecte,
      gold: estGold(),
      prenom: prenom,
      nom: nom,
      email: email,
      affiche: affiche,
      initiales: initiales((prenom + ' ' + nom).trim() || affiche || 'STI'),
      photo: String(meta.photo_url || meta.avatar_url || '')
    };
  }

  function initiales(texte) {
    var mots = String(texte || 'STI').trim().split(/\s+/).filter(Boolean);
    if (!mots.length) return 'STI';
    if (mots.length === 1) return mots[0].slice(0, 2).toUpperCase();
    return (mots[0][0] + mots[mots.length - 1][0]).toUpperCase();
  }

  /* ---------- 4. RACCOURCIS MÉTIER (utilisés par app.js) ---------- */
  function marquerVideoVue(id, temps) {
    var p = chargerProfil();
    if (p.videos.vues.indexOf(id) === -1) p.videos.vues.push(id);
    p.videos.derniere = { id: id, temps: Math.round(Number(temps) || 0), date: new Date().toISOString().slice(0, 10) };
    return sauvegarderProfil(p);
  }
  function enregistrerQuiz(matiere, score, total, erreurs) {
    var p = chargerProfil();
    p.quiz.push({
      matiere: matiere, score: Number(score) || 0, total: Number(total) || 20,
      date: new Date().toISOString().slice(0, 10), erreurs: erreurs || []
    });
    p.quiz = p.quiz.slice(-40);
    return sauvegarderProfil(p);
  }
  function totalErreurs() {
    return chargerProfil().quiz.reduce(function (n, q) { return n + (Array.isArray(q.erreurs) ? q.erreurs.length : 0); }, 0);
  }

  /* ---------- 6. ARÈNES DE QUIZ (statistiques par quiz) ----------
     Toutes les parties passent par ici : quiz.js ne lit/écrit aucun stockage.
     Les erreurs sont stockées dans p.quiz[].erreurs sous forme d'identifiants
     de questions, ce qui alimente « Rejouer mes erreurs » et la page
     revision-erreurs.html (via STIQuizSync.enregistrerReponses). */
  var CLES_XP_PAR_QUIZ = { 'html-css':'quizzora_xp_v1', javascript:'sti-quiz-xp-js-v1', sql:'sqlQuestV3', php:'quizphp_v1_user' };
  function statsQuiz(id) {
    var p = chargerProfil();
    var s = Object.assign({ meilleur: 0, reponses: 0, xp: 0, niveau: 1, serie: 0,
      badges: [], classement: [], meilleurChrono: 0, parties: 0 }, p.quizStats.parQuiz[id] || {});
    /* Les acquis historiques restent la source cloud du compte isolé. */
    var etat = lireEtatSession(), ancienneCle = CLES_XP_PAR_QUIZ[id];
    var acquis = ancienneCle && etat.id && lireAcquisQuiz(ancienneCle, etat.id);
    if (acquis) {
      s.xp = Math.max(s.xp, Number(acquis.xp) || 0);
      s.niveau = Math.max(s.niveau, Number(acquis.level) || 0, 1 + Math.floor(s.xp / 500));
      s.meilleur = Math.max(s.meilleur, typeof acquis.best === 'number' ? acquis.best : 0);
      s.reponses = Math.max(s.reponses, Number(acquis.totalAnswered || acquis.total) || 0);
      s.parties = Math.max(s.parties, Number(acquis.parties) || 0);
      s.serie = Math.max(s.serie, Number(acquis.streak) || 0);
    }
    return s;
  }

  function enregistrerPartieQuiz(id, partie) {
    var p = chargerProfil(), d = partie || {};
    var partieId = String(d.partieId || '');
    if (partieId && p.quizStats.partiesTerminees.indexOf(partieId) !== -1) return p;
    var score = Number(d.score) || 0, total = Math.max(1, Number(d.total) || 1);
    var points = Number(d.points === undefined ? score : d.points) || 0;
    var reponses = Number(d.reponses) || 0;
    p.quiz.push({
      matiere: id, score: score, points: points, total: total, partieId: partieId,
      date: new Date().toISOString().slice(0, 10),
      erreurs: Array.isArray(d.erreurs) ? d.erreurs.slice(0, 200) : [],
      mode: String(d.mode || ''), precision: Math.round(score / total * 100),
      combo: Number(d.combo) || 0, duree: Number(d.duree) || 0
    });
    p.quiz = p.quiz.slice(-40);
    if (partieId) p.quizStats.partiesTerminees = p.quizStats.partiesTerminees.concat(partieId).slice(-1000);
    var s = Object.assign({ meilleur: 0, reponses: 0, xp: 0, niveau: 1, serie: 0,
      badges: [], classement: [], meilleurChrono: 0, parties: 0 }, p.quizStats.parQuiz[id] || {});
    var acquisAvant = statsQuiz(id), session = lireEtatSession();
    var acquis = CLES_XP_PAR_QUIZ[id] && session.id && lireAcquisQuiz(CLES_XP_PAR_QUIZ[id], session.id);
    var marque = partieId && session.id && CLES_XP_PAR_QUIZ[id] && lireGainPartieQuiz(session.id, CLES_XP_PAR_QUIZ[id], partieId);
    var dejaCreditee = Boolean(acquis && marque && marque.connue);
    /* Le compteur historique peut déjà inclure cette partie dès la première
       réponse, notamment si un autre onglet vient de migrer les acquis. */
    s.parties = dejaCreditee ? Math.max(s.parties, Number(acquis.parties) || 0) : s.parties + 1;
    s.meilleur = Math.max(s.meilleur, points);
    s.reponses = dejaCreditee ? Math.max(s.reponses, Number(acquis.totalAnswered || acquis.total) || 0) : s.reponses + reponses;
    s.xp = dejaCreditee ? Math.max(s.xp, acquisAvant.xp) : Math.max(s.xp + (Number(d.xp) || 0), acquisAvant.xp);
    s.niveau = Math.max(s.niveau, 1 + Math.floor(s.xp / 500));
    s.serie = Number(d.serie) || 0;
    s.meilleurChrono = d.chrono ? (s.meilleurChrono ? Math.min(s.meilleurChrono, Number(d.chrono)) : Number(d.chrono)) : s.meilleurChrono;
    if (Array.isArray(d.badges)) d.badges.forEach(function (b) { if (s.badges.indexOf(b) === -1) s.badges.push(b); });
    if (score > 0) {
      s.classement.push({ score: score, total: total, date: new Date().toISOString().slice(0, 10), mode: String(d.mode || '') });
      s.classement = s.classement.sort(function (a, b) { return (b.score / (b.total || 1)) - (a.score / (a.total || 1)); }).slice(0, 10);
    }
    p.quizStats.parQuiz[id] = s;
    return sauvegarderProfil(p);
  }

  /* Identifiants uniques des questions ratées d'un quiz (les plus récentes). */
  function erreursQuiz(id) {
    var p = chargerProfil(), vues = {}, out = [];
    p.quiz.slice().reverse().forEach(function (q) {
      if (q.matiere !== id || !Array.isArray(q.erreurs)) return;
      q.erreurs.forEach(function (e) {
        var cle = String(e);
        if (!vues[cle]) { vues[cle] = 1; out.push(cle); }
      });
    });
    return out;
  }

  /* Migration douce d'une ancienne clé localStorage d'un quiz historique.
     Lecture effectuée ici aussi : profil.js reste le SEUL point d'accès. */
  function migrerAncienQuiz(id, ancienneCle) {
    var p = chargerProfil();
    if (p.quizStats.parQuiz[id] && p.quizStats.parQuiz[id].parties > 0) return p;
    var session = lireEtatSession();
    var utilisateur = global.STIQuizSync && global.STIQuizSync.utilisateurLocal && global.STIQuizSync.utilisateurLocal();
    var uid = (utilisateur && utilisateur.id) || session.id;
    /* Sans identité vérifiée, les anciennes clés peuvent appartenir à un
       autre abonné sur cet appareil partagé : ne pas les importer. */
    if (!uid || session.compteEnAttente || !compteQuizIsole(uid)) return p;
    var brut = null;
    try { brut = localStorage.getItem(ancienneCle); } catch (e) { return p; }
    if (!brut) return p;
    var ancien = null;
    try { ancien = JSON.parse(brut); } catch (e2) { return p; }
    if (!ancien || typeof ancien !== 'object') return p;
    var s = statsQuiz(id);
    s.meilleur = Math.max(s.meilleur, Number(ancien.bestScore || ancien.meilleur || ancien.highScore || ancien.best) || 0);
    s.reponses = Math.max(s.reponses, Number(ancien.totalAnswered || ancien.total || ancien.answered || ancien.reponses) || 0);
    s.xp = Math.max(s.xp, Number(ancien.xp) || 0);
    s.niveau = Math.max(s.niveau, Number(ancien.level || ancien.niveau) || 1);
    s.serie = Math.max(s.serie, Number(ancien.streak || ancien.serie) || 0);
    if (Array.isArray(ancien.badges)) s.badges = ancien.badges.slice(-60);
    if (Array.isArray(ancien.leaderboard)) s.classement = ancien.leaderboard.slice(-10);
    p.quizStats.parQuiz[id] = s;
    return sauvegarderProfil(p);
  }

  /* Déconnexion : on délègue au client Supabase déjà créé par acces.js
     (aucun calcul de session, aucune clé écrite ici). */
  function deconnecter() {
    var cfg = window.STI_AUTH || {};
    var sb = window.__STI_SB_CLIENT;
    var fin = function () {
      var racine = cfg.RACINE || './';
      window.location.href = racine + 'portail.html#deconnecte';
    };
    try {
      if (sb && sb.auth && typeof sb.auth.signOut === 'function') {
        var r = sb.auth.signOut();
        if (r && typeof r.then === 'function') r.then(fin).catch(fin);
        else setTimeout(fin, 250);
        setTimeout(fin, 1800); /* filet de sécurité si le réseau ne répond pas */
        return;
      }
    } catch (e) {}
    fin();
  }

  /* ---------- 5. PAGES DE COURS (raccourcis métier) ----------
     Toutes ces fonctions sont les SEULES portes d'entrée pour les actions
     de l'élève sur une page matière : cours.js ne fait que les appeler. */
  function cle(matiere, id) { return String(matiere || '') + ':' + String(id || ''); }

  function definirEtatChapitre(matiere, id, etat, total) {
    var p = chargerProfil();
    if (MATIERES_CLES.indexOf(matiere) === -1 || !/^[a-z0-9-]+$/i.test(id || '')) return p;
    var valide = ETATS_CHAPITRE_VALIDES[etat] ? etat : 'a_reviser';
    aliasChapitre(matiere, id).forEach(function (alias) {
      if (valide === 'a_reviser') delete p.chapitres[matiere][alias];
      else p.chapitres[matiere][alias] = valide;
      if (valide === 'revise') p.cours.chapitres[cle(matiere, alias)] = true;
      else delete p.cours.chapitres[cle(matiere, alias)];
    });
    var denominator = Array.isArray(total) ? total.length : Number(total) || 0;
    if (denominator > 0) {
      var revises = compteurChapitres(p, matiere, Array.isArray(total) ? total : null);
      p.progression[matiere] = Math.min(5, Math.round(revises / denominator * 5));
    }
    return sauvegarderProfil(p);
  }
  function marquerChapitre(matiere, id, fait, total) {
    return definirEtatChapitre(matiere, id, fait ? 'revise' : 'en_cours', total);
  }
  function estChapitreFait(matiere, id) {
    return chapitreFaitDans(chargerProfil(), matiere, id);
  }
  function etatChapitre(matiere, id) {
    var p = chargerProfil();
    if (chapitreFaitDans(p, matiere, id)) return 'revise';
    return aliasChapitre(matiere, id).some(function (alias) {
      return p.chapitres[matiere] && p.chapitres[matiere][alias] === 'en_cours';
    }) ? 'en_cours' : 'a_reviser';
  }
  function nbChapitresFaits(matiere) {
    return compteurChapitres(chargerProfil(), matiere);
  }
  function marquerExercice(matiere, id, fait) {
    var p = chargerProfil(), k = cle(matiere, id);
    if (MATIERES_CLES.indexOf(matiere) === -1 || !id) return p;
    if (fait) p.cours.exercices[k] = true; else delete p.cours.exercices[k];
    var liste = p.exercicesFaits[matiere];
    if (fait && liste.indexOf(id) < 0) liste.push(id);
    else if (!fait) p.exercicesFaits[matiere] = liste.filter(function (x) { return x !== id; });
    return sauvegarderProfil(p);
  }
  function basculerExerciceFait(matiere, id, fait) {
    return marquerExercice(matiere, id, typeof fait === 'boolean' ? fait : !estExerciceFait(matiere, id));
  }
  function estExerciceFait(matiere, id) {
    var p = chargerProfil();
    return p.cours.exercices[cle(matiere, id)] === true || Boolean(p.exercicesFaits[matiere] && p.exercicesFaits[matiere].indexOf(id) >= 0);
  }
  function nbExercicesFaits(matiere) {
    var p = chargerProfil(), ids = {};
    Object.keys(p.cours.exercices).forEach(function (k) { if (k.indexOf(matiere + ':') === 0) ids[k.slice(matiere.length + 1)] = true; });
    (p.exercicesFaits[matiere] || []).forEach(function (id) { ids[id] = true; });
    return Object.keys(ids).length;
  }
  function enregistrerLaboratoire(matiere, id, valeurs) {
    var p = chargerProfil();
    if (MATIERES_CLES.indexOf(matiere) === -1 || !/^[a-z0-9-]+$/i.test(id || '')) return p;
    p.cours.laboratoires[cle(matiere, id)] = valeurs || {};
    if (p.laboratoires[matiere].indexOf(id) < 0) p.laboratoires[matiere].push(id);
    return sauvegarderProfil(p);
  }
  function laboratoire(matiere, id) { return chargerProfil().cours.laboratoires[cle(matiere, id)] || null; }
  function enregistrerFenetre(matiere, id) {
    var p = chargerProfil();
    p.cours.fenetres[cle(matiere, id)] = true;
    return sauvegarderProfil(p);
  }
  function enregistrerMiniQuiz(matiere, id, score, total) {
    var p = chargerProfil();
    p.cours.miniQuiz[cle(matiere, id)] = {
      score: Number(score) || 0, total: Number(total) || 10,
      date: new Date().toISOString().slice(0, 10)
    };
    return sauvegarderProfil(p);
  }
  function miniQuiz(matiere, id) { return chargerProfil().cours.miniQuiz[cle(matiere, id)] || null; }

  /* Position de lecture : accepte aussi l'objet transmis par le lecteur historique. */
  function enregistrerPositionVideo(id, temps, duree) {
    var info = id && typeof id === 'object' ? id : { id: id, temps: temps, duree: duree };
    if (!info.id) return chargerProfil();
    var p = chargerProfil(), slug = String(info.id);
    var secondes = Math.max(0, Math.floor(Number(info.temps) || 0));
    var longueur = Math.max(0, Math.floor(Number(info.duree) || 0));
    if (info.terminee) {
      delete p.videos.positions[slug];
      if (p.videos.vues.indexOf(slug) < 0) p.videos.vues.push(slug);
    } else if (secondes > 2) {
      /* Nombre canonique compatible avec la reprise du lecteur historique. */
      p.videos.positions[slug] = secondes;
    }
    if (!info.secondaire) {
      p.videos.derniere = { id: slug, matiere: String(info.matiere || ''), titre: String(info.titre || ''),
        temps: info.terminee ? 0 : secondes, duree: longueur, url: String(info.url || '') };
    }
    return sauvegarderProfil(p);
  }
  function positionVideo(id) {
    var position = chargerProfil().videos.positions[id];
    return typeof position === 'number' ? { temps: position, duree: 0 } : (position || null);
  }
  function enregistrerPositionAudio(id, temps) {
    var p = chargerProfil();
    p.cours.audio[id] = { temps: Math.round((Number(temps) || 0) * 10) / 10 };
    return sauvegarderProfil(p);
  }
  function positionAudio(id) { return (chargerProfil().cours.audio[id] || {}).temps || 0; }

  /* Une visite est « en cours », jamais automatiquement « révisée ». */
  function enregistrerLecture(matiere, id, titre, pourcent, url) {
    var p = chargerProfil();
    if (MATIERES_CLES.indexOf(matiere) === -1) return p;
    if (arguments.length < 5) {
      /* Ancienne signature de la refonte : matière, titre, pourcentage, URL. */
      url = pourcent; pourcent = titre; titre = id;
      var correspondance = String(url || '').match(/(?:[#&]ch=)([a-z0-9-]+)/i);
      id = correspondance ? correspondance[1] : '';
    }
    if (id && /^[a-z0-9-]+$/i.test(id) && !chapitreFaitDans(p, matiere, id)) {
      aliasChapitre(matiere, id).forEach(function (alias) { p.chapitres[matiere][alias] = 'en_cours'; });
    }
    p.coursVisites = [matiere].concat(p.coursVisites.filter(function (m) { return m !== matiere; }));
    p.derniereLecture = { matiere: matiere, chapitre: String(titre || ''), chapitreId: String(id || ''),
      pourcent: Math.max(0, Math.min(100, Math.round(Number(pourcent) || 0))), url: String(url || '') };
    return sauvegarderProfil(p);
  }

  function notifierChangement(nom, detail) {
    try { if (typeof CustomEvent === 'function') window.dispatchEvent(new CustomEvent(nom, { detail: detail })); } catch (e) {}
  }

  /* Les visites identiques ne provoquent pas de réécriture. */
  function enregistrerVisiteCours(matiere) {
    var p = chargerProfil();
    if (MATIERES_CLES.indexOf(matiere) === -1 || p.coursVisites[0] === matiere) return p;
    p.coursVisites = [matiere].concat(p.coursVisites.filter(function (m) { return m !== matiere; }));
    return sauvegarderProfil(p, false);
  }

  /* Fusionner les visites sans modifier les autres données du profil. */
  function fusionnerCoursVisites(visitesLocales) {
    var p = chargerProfil();
    if (!Array.isArray(visitesLocales)) return p;
    var manquantes = Array.from(new Set(visitesLocales.filter(function (m) {
      return MATIERES_CLES.indexOf(m) !== -1 && p.coursVisites.indexOf(m) === -1;
    })));
    if (!manquantes.length) return p;
    p.coursVisites = p.coursVisites.concat(manquantes);
    return sauvegarderProfil(p, false);
  }

  /* Lire les visites historiques sans compter les exercices seuls. */
  function listerCoursVisites() {
    var p = chargerProfil();
    var visites = p.coursVisites.slice();
    function ajouter(matiere) {
      if (MATIERES_CLES.indexOf(matiere) !== -1 && visites.indexOf(matiere) === -1) visites.push(matiere);
    }
    if (p.derniereLecture && p.derniereLecture.chapitreId) ajouter(p.derniereLecture.matiere);
    MATIERES_CLES.forEach(function (m) {
      var etats = p.chapitres[m] || {};
      if (Object.keys(etats).some(function (id) { return etats[id] === "en_cours" || etats[id] === "revise"; })) ajouter(m);
    });
    try {
      var pages = JSON.parse(global.localStorage.getItem("sti-pages-vues-v432") || "{}");
      if (pages && typeof pages === "object" && !Array.isArray(pages)) {
        MATIERES_CLES.forEach(function (m) {
          if (PAGES_COURS_HISTORIQUES[m].some(function (slug) {
            var valeur = pages[slug];
            return valeur === true || ((typeof valeur === "number" || typeof valeur === "string") && Number(valeur) > 0);
          })) ajouter(m);
        });
      }
    } catch (e) {}
    return visites;
  }

  function calculerInitiales(prenom, nom, email) {
    var p = String(prenom || "").trim();
    var n = String(nom || "").trim();
    if (p && n) {
      return (p.charAt(0) + n.charAt(0)).toUpperCase();
    }
    if (p) {
      var morceaux = p.split(/\s+/).filter(Boolean);
      if (morceaux.length >= 2) {
        return (morceaux[0].charAt(0) + morceaux[1].charAt(0)).toUpperCase();
      }
      return p.slice(0, 2).toUpperCase();
    }
    var em = String(email || "").trim();
    if (em) {
      return em.slice(0, 2).toUpperCase();
    }
    return "AB";
  }

  /* Session et GOLD : lecture seule des scripts d’accès existants. */
  function lireEtatSession() {
    var profil = chargerProfil();
    var cacheAcces = null;

    /* Lecture seule du cache de session maintenu par acces.js pour le mode hors-ligne */
    try {
      if (global.localStorage) {
        cacheAcces = JSON.parse(global.localStorage.getItem("sti-session-cache") || "null");
      }
    } catch (e) {}

    /* Un cache d'accès d'un ancien compte ne doit pas fournir le nom du nouveau. */
    if (etatSessionCourant.connecte && cacheAcces) {
      var identitesConnues = etatSessionCourant.id && cacheAcces.id;
      var autreCompte = identitesConnues
        ? etatSessionCourant.id !== cacheAcces.id
        : Boolean(etatSessionCourant.email && cacheAcces.email && String(etatSessionCourant.email).toLowerCase() !== String(cacheAcces.email).toLowerCase());
      if (autreCompte) cacheAcces = null;
    }

    /* Attendre l’isolation avant d’exposer les données du compte. */
    var uidActuel = etatSessionCourant.id || (cacheAcces && cacheAcces.id) || "";
    var compteEnAttente = false;
    try {
      var uidStocke = global.localStorage && global.localStorage.getItem("sti-sync-uid");
      compteEnAttente = Boolean(uidActuel && uidStocke && uidActuel !== uidStocke);
    } catch (eUid) {}

    var docEl = document.documentElement;
    var bodyEl = document.body;
    var estGoldActif = Boolean(
      global.__STI_GOLD === true ||
      (docEl && docEl.classList.contains("sti-gold")) ||
      (bodyEl && bodyEl.classList.contains("sti-gold")) ||
      (cacheAcces && cacheAcces.gold === true)
    );

    var connecteCache = Boolean(cacheAcces && cacheAcces.statut === "actif");
    var prenomCompte = (cacheAcces && cacheAcces.prenom) ||
      etatSessionCourant.prenomSession ||
      (!compteEnAttente && profil.prenom) || "";
    var prenom = (!compteEnAttente && profil.prenom) || prenomCompte;
    var nom = (cacheAcces && cacheAcces.nom) || etatSessionCourant.nomSession || "";
    var email = (cacheAcces && cacheAcces.email) || etatSessionCourant.email || "";

    if (!prenom && email) {
      prenom = email.split("@")[0].replace(/[._-]+/g, " ");
      prenom = prenom.charAt(0).toUpperCase() + prenom.slice(1);
    }

    var connecte = Boolean(etatSessionCourant.connecte || connecteCache);

    return {
      connecte: connecte,
      compteEnAttente: compteEnAttente,
      id: uidActuel,
      estGold: estGoldActif,
      prenom: prenom || "Abonné",
      prenomCompte: String(prenomCompte || "Abonné").trim().slice(0, 48) || "Abonné",
      nom: nom,
      email: email,
      classe: (cacheAcces && cacheAcces.classe) || etatSessionCourant.classe || "",
      lycee: (cacheAcces && cacheAcces.lycee) || etatSessionCourant.lycee || "Lycée Raféha",
      initiales: calculerInitiales(prenom, nom, email),
      urlPortail: ((global.STI_AUTH && global.STI_AUTH.RACINE) || "./") + "portail.html"
    };
  }

  function memoriserSession(sess) {
    var utilisateur = sess && sess.user;
    var meta = (utilisateur && utilisateur.user_metadata) || {};
    etatSessionCourant.connecte = Boolean(utilisateur);
    etatSessionCourant.id = (utilisateur && utilisateur.id) || "";
    etatSessionCourant.email = (utilisateur && utilisateur.email) || "";
    etatSessionCourant.prenomSession = meta.prenom || meta.first_name || "";
    etatSessionCourant.nomSession = meta.nom || meta.last_name || "";
    etatSessionCourant.classe = meta.classe || "";
    etatSessionCourant.lycee = meta.lycee || "";
  }

  function synchroniserLectureSessionSupabase() {
    try {
      var client = global.__STI_SB_CLIENT;
      if (!client || !client.auth || typeof client.auth.getSession !== "function") {
        return;
      }
      client.auth.getSession().then(function (rep) {
        var sess = rep && rep.data ? rep.data.session : null;
        memoriserSession(sess);
        if (sess && sess.user) {
          var p = chargerProfil();
          if (!lireEtatSession().compteEnAttente && !p.prenom && etatSessionCourant.prenomSession) {
            mettreAJour("prenom", etatSessionCourant.prenomSession);
          }
        }
        notifierChangement("sti:session-maj", lireEtatSession());
      }).catch(function () {});

      if (!synchroniserLectureSessionSupabase._ecouteurActif && typeof client.auth.onAuthStateChange === "function") {
        synchroniserLectureSessionSupabase._ecouteurActif = true;
        client.auth.onAuthStateChange(function (_ev, sess) {
          memoriserSession(sess);
          notifierChangement("sti:session-maj", lireEtatSession());
        });
      }
    } catch (e) {}
  }

  /* Préparer le verrou historique avant activation du SW. */
  function preparerActivationServiceWorker(version) {
    var numero = String(version || "");
    if (!/^\d{1,6}$/.test(numero)) return false;
    try {
      global.sessionStorage.setItem("sti-sw-reload-ver", numero);
      global.localStorage.setItem("sti-sw-reload-ver", numero);
      global.localStorage.setItem("sti-version-installee", numero);
      return true;
    } catch (e) { return false; }
  }
  function preparerVerificationServiceWorker(version) {
    var numero = String(version || "");
    if (!/^\d{1,6}$/.test(numero)) return false;
    try {
      if (Number(numero) <= Number(global.localStorage.getItem("sti-version-installee") || 0)) return false;
      return preparerActivationServiceWorker(numero);
    } catch (e) { return false; }
  }

  /* Passerelle réservée aux compteurs historiques du compte isolé. */
  var CLES_XP_QUIZ = ["quizzora_xp_v1", "sti-quiz-xp-js-v1", "sqlQuestV3", "quizphp_v1_user"];
  function compteQuizIsole(uid) {
    try { return Boolean(uid && global.localStorage.getItem("sti-sync-uid") === String(uid)); }
    catch (e) { return false; }
  }
  /* Le mode invité ne doit pas écrire dans le profil d'un ancien abonné. */
  function quizInviteIsole() {
    try { return !global.localStorage.getItem("sti-sync-uid"); }
    catch (e) { return false; }
  }
  function lireAcquisQuiz(cle, uid) {
    if (CLES_XP_QUIZ.indexOf(cle) < 0 || !compteQuizIsole(uid)) return null;
    try {
      var brut = global.localStorage.getItem(cle);
      if (brut === null) return {};
      var valeur = JSON.parse(brut);
      return valeur && typeof valeur === "object" && !Array.isArray(valeur) ? valeur : null;
    } catch (e) { return null; }
  }
  function ecrireAcquisQuiz(cle, uid, valeur, notifier) {
    if (!lireAcquisQuiz(cle, uid) || !valeur || typeof valeur !== "object" || Array.isArray(valeur)) return false;
    try {
      var texte = JSON.stringify(valeur);
      if (texte === global.localStorage.getItem(cle)) return true;
      global.localStorage.setItem(cle, texte);
      if (notifier !== false) notifierChangement("sti-cloud-restored", { quiz: cle });
      return true;
    } catch (e) { return false; }
  }

  /* Une clé par opération et par compte évite les collisions d’onglets. */
  var PREFIXE_XP = "quiz-xp-operation-v1:";
  function prefixeOperations(uid) { return PREFIXE_XP + encodeURIComponent(String(uid)) + ":"; }
  function operationValide(o) {
    return o && CLES_XP_QUIZ.indexOf(o.cle) >= 0 &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(o.id) &&
      Number.isSafeInteger(o.gain) && o.gain > 0 && o.gain <= 1000000000 &&
      Number.isSafeInteger(o.base) && o.base >= 0 &&
      (!o.cumulatif || (Number.isSafeInteger(o.attente) && o.attente >= 0 && o.attente <= o.gain));
  }
  function listerOperationsQuiz(uid, cle) {
    if (!compteQuizIsole(uid)) return [];
    var liste = [], prefixe = prefixeOperations(uid);
    try {
      for (var i = 0; i < global.localStorage.length; i++) {
        var k = global.localStorage.key(i) || "";
        if (k.indexOf(prefixe) !== 0) continue;
        var o = JSON.parse(global.localStorage.getItem(k));
        if (!operationValide(o) || k !== prefixe + o.id) return null;
        if (!cle || o.cle === cle) liste.push(o);
      }
    } catch (e) { return null; }
    return liste;
  }
  function ajouterOperationQuiz(uid, operation) {
    if (!compteQuizIsole(uid) || !operationValide(operation)) return false;
    try {
      var cle = prefixeOperations(uid) + operation.id;
      var precedent = JSON.parse(global.localStorage.getItem(cle) || "null");
      if (precedent) {
        if (!operationValide(precedent) || precedent.cle !== operation.cle || !precedent.cumulatif || !operation.cumulatif) return false;
        operation = Object.assign({}, operation, {
          gain: Math.max(precedent.gain, operation.gain),
          attente: Math.min(Math.max(precedent.gain, operation.gain), precedent.attente + operation.attente),
          base: Math.max(precedent.base, operation.base)
        });
      }
      global.localStorage.setItem(cle, JSON.stringify(operation));
      return true;
    } catch (e) { return false; }
  }
  function confirmerOperationsQuiz(uid, ids, envoyees) {
    if (!compteQuizIsole(uid)) return;
    try {
      (ids || []).forEach(function (id) {
        var cle = prefixeOperations(uid) + id;
        var courant = JSON.parse(global.localStorage.getItem(cle) || "null");
        var envoye = (envoyees || []).find(function (o) { return o.id === id; });
        /* Une progression plus récente a pu arriver pendant le POST. */
        if (courant && courant.cumulatif && envoye && courant.gain > envoye.gain) {
          courant.attente = Math.max(0, courant.attente - (Number(envoye.attente) || 0));
          global.localStorage.setItem(cle, JSON.stringify(courant));
        } else {
          global.localStorage.removeItem(cle);
        }
      });
    } catch (e) {}
  }
  /* Le marqueur de partie survit à l'acquittement et reste isolé par compte. */
  var PREFIXE_PARTIE_XP = "quiz-xp-partie-v1:";
  function clePartieQuiz(uid, id) { return PREFIXE_PARTIE_XP + encodeURIComponent(String(uid)) + ":" + id; }
  function lireGainPartieQuiz(uid, cle, id) {
    if (!compteQuizIsole(uid) || !/^[0-9a-f-]{36}$/i.test(String(id || ""))) return null;
    try {
      var o = JSON.parse(global.localStorage.getItem(clePartieQuiz(uid, id)) || "null");
      if (!o) return { cle: cle, gain: 0, bonnes: 0, total: 0, connue: false };
      if (o.cle !== cle || !Number.isSafeInteger(o.gain) || o.gain < 0) return null;
      return o;
    } catch (e) { return null; }
  }
  function memoriserGainPartieQuiz(uid, id, valeur) {
    if (!compteQuizIsole(uid) || !valeur || !/^[0-9a-f-]{36}$/i.test(String(id || ""))) return false;
    try { global.localStorage.setItem(clePartieQuiz(uid, id), JSON.stringify(valeur)); return true; }
    catch (e) { return false; }
  }
  function ecrireProtocoleQuiz(uid, attentes) {
    if (!compteQuizIsole(uid)) return false;
    try { global.localStorage.setItem("sti-xp-protocole-v487", JSON.stringify({ uid: String(uid), version: 2, attentes: attentes })); return true; }
    catch (e) { return false; }
  }

  /* Export public */
  window.STIProfil = {
    __stiCharge: true,
    CLE: CLE,
    CLE_STOCKAGE: CLE,
    normaliserProfil: normaliser,
    enregistrerVisiteCours: enregistrerVisiteCours,
    fusionnerCoursVisites: fusionnerCoursVisites,
    listerCoursVisites: listerCoursVisites,
    definirEtatChapitre: definirEtatChapitre,
    basculerExerciceFait: basculerExerciceFait,
    lireEtatSession: lireEtatSession,
    preparerActivationServiceWorker: preparerActivationServiceWorker,
    preparerVerificationServiceWorker: preparerVerificationServiceWorker,
    compteQuizIsole: compteQuizIsole,
    quizInviteIsole: quizInviteIsole,
    lireAcquisQuiz: lireAcquisQuiz,
    ecrireAcquisQuiz: ecrireAcquisQuiz,
    lireGainPartieQuiz: lireGainPartieQuiz,
    memoriserGainPartieQuiz: memoriserGainPartieQuiz,
    listerOperationsQuiz: listerOperationsQuiz,
    ajouterOperationQuiz: ajouterOperationQuiz,
    confirmerOperationsQuiz: confirmerOperationsQuiz,
    ecrireProtocoleQuiz: ecrireProtocoleQuiz,
    /* Journaux historiques : seul profil.js y accède pour les modules V2. */
    projectionSuivi: function (cle, valeur) {
      if (['sti-exos-faits', 'sti-pages-vues-v432', 'sti-media-prog-v1'].indexOf(cle) < 0) return {};
      try {
        if (arguments.length > 1) localStorage.setItem(cle, JSON.stringify(valeur));
        return JSON.parse(localStorage.getItem(cle) || '{}');
      } catch (e) { return {}; }
    },
    projectionSynchronisation: function (filtre, cle, valeur) {
      try {
        if (arguments.length === 1) {
          var donnees = {};
          for (var i = 0; i < localStorage.length; i++) {
            var k = localStorage.key(i); if (filtre(k)) donnees[k] = localStorage.getItem(k);
          }
          return donnees;
        }
        if (!filtre(cle)) return null;
        if (arguments.length > 2) {
          if (valeur == null) localStorage.removeItem(cle); else localStorage.setItem(cle, String(valeur));
        }
        return localStorage.getItem(cle);
      } catch (e) { return arguments.length === 1 ? {} : null; }
    },
    THEMES: THEMES,
    LANGUES: LANGUES,
    TAILLES: TAILLES,
    chargerProfil: chargerProfil,
    sauvegarderProfil: sauvegarderProfil,
    mettreAJour: mettreAJour,
    reinitialiser: reinitialiser,
    appliquerPreferences: appliquerPreferences,
    garderTheme: garderTheme,
    estGold: estGold,
    session: session,
    etatAbonne: etatAbonne,
    initiales: initiales,
    marquerVideoVue: marquerVideoVue,
    enregistrerQuiz: enregistrerQuiz,
    totalErreurs: totalErreurs,
    deconnecter: deconnecter,
    /* Pages de cours */
    identifiantChapitre: identifiantChapitre,
    marquerChapitre: marquerChapitre,
    etatChapitre: etatChapitre,
    estChapitreFait: estChapitreFait,
    nbChapitresFaits: nbChapitresFaits,
    marquerExercice: marquerExercice,
    estExerciceFait: estExerciceFait,
    nbExercicesFaits: nbExercicesFaits,
    enregistrerLaboratoire: enregistrerLaboratoire,
    laboratoire: laboratoire,
    enregistrerFenetre: enregistrerFenetre,
    enregistrerMiniQuiz: enregistrerMiniQuiz,
    miniQuiz: miniQuiz,
    enregistrerPositionVideo: enregistrerPositionVideo,
    positionVideo: positionVideo,
    enregistrerPositionAudio: enregistrerPositionAudio,
    positionAudio: positionAudio,
    enregistrerLecture: enregistrerLecture,
    /* Arènes de quiz */
    statsQuiz: statsQuiz,
    enregistrerPartieQuiz: enregistrerPartieQuiz,
    erreursQuiz: erreursQuiz,
    migrerAncienQuiz: migrerAncienQuiz
  };

  /* Reprendre les opérations XP en attente, même hors d'une page de quiz. */
  var chargementQuiz = false;
  function relancerOperationsQuiz() {
    var uid;
    try { uid = localStorage.getItem('sti-sync-uid'); } catch (e) { return; }
    if (!uid || window.STIQuizSync || chargementQuiz || !sourceProfil || !document.head) return;
    var operations = listerOperationsQuiz(uid);
    if (!operations || !operations.length) return;
    chargementQuiz = true;
    var script = document.createElement('script');
    script.src = new URL('quiz-sync.js', sourceProfil).href;
    script.onload = script.onerror = function () { chargementQuiz = false; if (!window.STIQuizSync) script.remove(); };
    document.head.appendChild(script);
  }
  if (!profilPourQuiz && typeof window.addEventListener === 'function') {
    window.addEventListener('online', relancerOperationsQuiz);
    window.addEventListener('sti-cloud-restored', relancerOperationsQuiz);
    if (typeof window.setInterval === 'function') window.setInterval(relancerOperationsQuiz, 10000);
  }

  if (sourceProfil && document.head && document.querySelector && document.createElement) {
    ['suivi-profil.js', 'reconnexion-profil.js', 'appel-quiz.js'].forEach(function (nom) {
      if (document.querySelector('script[src$="/' + nom + '"]')) return;
      var script = document.createElement('script');
      script.src = new URL(nom, sourceProfil).href;
      script.async = false;
      document.head.appendChild(script);
    });
  }

  /* Les métadonnées du compte ne doivent jamais venir d'un compte précédent. */
  if (typeof window.addEventListener === 'function') {
    window.addEventListener('DOMContentLoaded', function () {
      synchroniserLectureSessionSupabase();
      setTimeout(synchroniserLectureSessionSupabase, 600);
      if (!profilPourQuiz) relancerOperationsQuiz();
    });
    window.addEventListener('storage', function (ev) {
      if (!ev || !ev.key || ev.key === CLE || ev.key === 'sti-session-cache' || ev.key === 'sti-gold') {
        var profil = chargerProfil();
        if (!profilPourQuiz) appliquerPreferences();
        notifierChangement('sti:profil', profil);
        notifierChangement('sti:profil-maj', profil);
        notifierChangement('sti:session-maj', lireEtatSession());
      }
    });
    window.addEventListener('sti-cloud-restored', function () {
      var profil = chargerProfil();
      if (!profilPourQuiz) appliquerPreferences();
      notifierChangement('sti:profil', profil);
      notifierChangement('sti:profil-maj', profil);
    });
  }

  /* Application immédiate des préférences, dès l'exécution du script. */
  try {
    if (profilPourQuiz) return;
    appliquerPreferences();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', garderTheme, { once: true });
    } else {
      garderTheme();
    }
    /* acces.js peut réécrire data-theme après nous : on surveille l'attribut. */
    if (window.MutationObserver) {
      var r = document.documentElement;
      var observer = new MutationObserver(function () {
        var p = chargerProfil();
        if (r.getAttribute('data-theme') !== p.theme) r.setAttribute('data-theme', p.theme);
        var l = document.getElementById('sti-sombre-css-v372');
        if (l) l.disabled = true;
      });
      observer.observe(r, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    }
  } catch (e) { /* repli silencieux */ }
})();
