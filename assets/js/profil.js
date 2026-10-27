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

  var CLE = 'sti-profil-abonne';            // préfixe « sti- » → synchronisé
  var THEMES = ['sombre', 'clair', 'intermediaire'];
  var LANGUES = ['fr', 'en', 'ar'];
  var TAILLES = { petit: .9, normal: 1, grand: 1.15 };
  var cache = null;                          // copie mémoire du profil

  /* Objet vierge : toute nouvelle clé doit être ajoutée ici. */
  function profilVierge() {
    return {
      prenom: '',
      nom: '',
      theme: 'sombre',
      langue: 'fr',
      tailleTexte: 'normal',
      derniereLecture: { matiere: '', chapitre: '', pourcent: 0, url: '' },
      progression: { html5: 0, css3: 0, javascript: 0, sql: 0, php: 0 },
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
        parQuiz: {}        // { "sql": { meilleur, reponses, xp, niveau, serie,
                           //   badges:[], classement:[], meilleurChrono, parties } }
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
    if (!TAILLES[v.tailleTexte]) v.tailleTexte = 'normal';
    if (p.derniereLecture && typeof p.derniereLecture === 'object') {
      v.derniereLecture = {
        matiere: String(p.derniereLecture.matiere || ''),
        chapitre: String(p.derniereLecture.chapitre || ''),
        pourcent: Math.max(0, Math.min(100, Number(p.derniereLecture.pourcent) || 0)),
        url: String(p.derniereLecture.url || '')
      };
    }
    if (p.progression && typeof p.progression === 'object') {
      Object.keys(v.progression).forEach(function (m) {
        v.progression[m] = Math.max(0, Math.min(5, Number(p.progression[m]) || 0));
      });
    }
    if (Array.isArray(p.quiz)) v.quiz = p.quiz.slice(-40).filter(function (q) { return q && typeof q === 'object'; });
    if (p.videos && typeof p.videos === 'object') {
      v.videos.vues = Array.isArray(p.videos.vues) ? p.videos.vues.slice(-200) : [];
      v.videos.derniere = (p.videos.derniere && typeof p.videos.derniere === 'object') ? p.videos.derniere : null;
      if (p.videos.positions && typeof p.videos.positions === 'object') {
        Object.keys(p.videos.positions).slice(0, 200).forEach(function (k) {
          var q = p.videos.positions[k];
          if (q && typeof q === 'object') v.videos.positions[k] = { temps: Number(q.temps) || 0, duree: Number(q.duree) || 0 };
        });
      }
    }
    if (Array.isArray(p.notes)) v.notes = p.notes.slice(-40);
    if (Array.isArray(p.nouveautesLues)) v.nouveautesLues = p.nouveautesLues.slice(-100);
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
    if (cache) return cache;
    var brut = null;
    try { brut = localStorage.getItem(CLE); } catch (e) { /* stockage bloqué */ }
    var p = null;
    if (brut) { try { p = JSON.parse(brut); } catch (e) { p = null; } }
    if (!p) {
      /* Migration douce : on récupère l'ancien thème et d'éventuels scores de
         quiz déjà écrits par les scripts historiques, sans toucher à leur code. */
      p = {};
      try {
        var t = localStorage.getItem('sti-theme') || '';
        if (t === 'dark') p.theme = 'sombre';
        else if (t === 'light') p.theme = 'clair';
        var hs = localStorage.getItem('js_quiz_high_score');
        if (hs && Number(hs) > 0) p.quiz = [{ matiere: 'javascript', score: Number(hs), total: 20, date: '', erreurs: [] }];
      } catch (e) {}
    }
    cache = normaliser(p);
    return cache;
  }

  /* Miroir des clés de thème historiques : les pages d'origine et les quiz
     lisent « sti-roue-theme » / « sti-theme ». C'est bien profil.js, et lui
     seul, qui écrit dans localStorage. */
  function mirroirTheme(profil) {
    var p = profil || chargerProfil();
    try {
      localStorage.setItem('sti-roue-theme', p.theme);
      var legacy = p.theme === 'sombre' ? 'dark' : p.theme === 'clair' ? 'light' : '';
      if (legacy) { localStorage.setItem('sti-theme', legacy); localStorage.setItem('theme', legacy); }
      else { localStorage.removeItem('sti-theme'); localStorage.removeItem('theme'); }
    } catch (e) { /* stockage bloqué */ }
  }

  function sauvegarderProfil(profil) {
    cache = normaliser(profil || cache || {});
    try { localStorage.setItem(CLE, JSON.stringify(cache)); } catch (e) { /* quota / privé */ }
    mirroirTheme(cache);
    /* Événement interne : permet à app.js de rafraîchir badge & tableau de bord. */
    try { window.dispatchEvent(new CustomEvent('sti:profil', { detail: cache })); } catch (e) {}
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
  function statsQuiz(id) {
    var p = chargerProfil();
    return p.quizStats.parQuiz[id] || {
      meilleur: 0, reponses: 0, xp: 0, niveau: 1, serie: 0,
      badges: [], classement: [], meilleurChrono: 0, parties: 0
    };
  }

  function enregistrerPartieQuiz(id, partie) {
    var p = chargerProfil();
    var d = partie || {};
    var score = Number(d.score) || 0, total = Math.max(1, Number(d.total) || 1);
    var reponses = Number(d.reponses) || 0;
    /* 1. Historique des parties (structure d'origine, lue par le tableau de bord). */
    p.quiz.push({
      matiere: id, score: score, total: total,
      date: new Date().toISOString().slice(0, 10),
      erreurs: Array.isArray(d.erreurs) ? d.erreurs.slice(0, 200) : [],
      mode: String(d.mode || ''), precision: Math.round(score / total * 100),
      combo: Number(d.combo) || 0, duree: Number(d.duree) || 0
    });
    p.quiz = p.quiz.slice(-40);
    /* 2. Statistiques gamifiées de l'arène. */
    var s = statsQuiz(id);
    s.parties += 1;
    s.meilleur = Math.max(s.meilleur, score);
    s.reponses += reponses;
    s.xp += Number(d.xp) || 0;
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
    var brut = null;
    try { brut = localStorage.getItem(ancienneCle); } catch (e) { return p; }
    if (!brut) return p;
    var ancien = null;
    try { ancien = JSON.parse(brut); } catch (e2) { return p; }
    if (!ancien || typeof ancien !== 'object') return p;
    var s = statsQuiz(id);
    s.meilleur = Math.max(s.meilleur, Number(ancien.bestScore || ancien.meilleur || ancien.highScore) || 0);
    s.reponses += Number(ancien.totalAnswered || ancien.answered || ancien.reponses) || 0;
    s.xp += Number(ancien.xp) || 0;
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

  function marquerChapitre(matiere, id, fait, total) {
    var p = chargerProfil(), k = cle(matiere, id);
    if (fait) p.cours.chapitres[k] = true; else delete p.cours.chapitres[k];
    /* Agrégat 0 → 5 pour le tableau de bord (compatibilité v1). */
    var tous = Object.keys(p.cours.chapitres).filter(function (x) { return x.indexOf(matiere + ':') === 0; }).length;
    p.progression[matiere] = Math.min(5, Math.round(tous / Math.max(1, Number(total) || 5) * 5));
    return sauvegarderProfil(p);
  }
  function estChapitreFait(matiere, id) { return chargerProfil().cours.chapitres[cle(matiere, id)] === true; }
  function nbChapitresFaits(matiere) {
    return Object.keys(chargerProfil().cours.chapitres).filter(function (k) {
      return k.indexOf(matiere + ':') === 0;
    }).length;
  }
  function marquerExercice(matiere, id, fait) {
    var p = chargerProfil(), k = cle(matiere, id);
    if (fait) p.cours.exercices[k] = true; else delete p.cours.exercices[k];
    return sauvegarderProfil(p);
  }
  function estExerciceFait(matiere, id) { return chargerProfil().cours.exercices[cle(matiere, id)] === true; }
  function nbExercicesFaits(matiere) {
    return Object.keys(chargerProfil().cours.exercices).filter(function (k) {
      return k.indexOf(matiere + ':') === 0;
    }).length;
  }
  function enregistrerLaboratoire(matiere, id, valeurs) {
    var p = chargerProfil();
    p.cours.laboratoires[cle(matiere, id)] = valeurs || {};
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

  /* Position de lecture : vidéo (.mp4) et piste audio du Guide-Ligne. */
  function enregistrerPositionVideo(id, temps, duree) {
    var p = chargerProfil();
    p.videos.positions[id] = { temps: Math.round(Number(temps) || 0), duree: Math.round(Number(duree) || 0) };
    p.videos.derniere = { id: id, temps: Math.round(Number(temps) || 0), date: new Date().toISOString().slice(0, 10) };
    return sauvegarderProfil(p);
  }
  function positionVideo(id) { return chargerProfil().videos.positions[id] || null; }
  function enregistrerPositionAudio(id, temps) {
    var p = chargerProfil();
    p.cours.audio[id] = { temps: Math.round((Number(temps) || 0) * 10) / 10 };
    return sauvegarderProfil(p);
  }
  function positionAudio(id) { return (chargerProfil().cours.audio[id] || {}).temps || 0; }

  /* Reprise de lecture : une seule écriture, utilisée par toutes les matières. */
  function enregistrerLecture(matiere, chapitre, pourcent, url) {
    return mettreAJour('derniereLecture', {
      matiere: String(matiere || ''), chapitre: String(chapitre || ''),
      pourcent: Math.max(0, Math.min(100, Math.round(Number(pourcent) || 0))),
      url: String(url || '')
    });
  }

  /* Export public */
  window.STIProfil = {
    __stiCharge: true,
    CLE: CLE,
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
    marquerChapitre: marquerChapitre,
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

  /* Application immédiate des préférences, dès l'exécution du script. */
  try {
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
