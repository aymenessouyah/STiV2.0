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
     videos: { vues:["html5-cours"], derniere:{ id:"css3-cours", temps:0 } },
     notes: [ { atelier:"TP1 HTML", note:16, date:"2026-10-20" } ],
     nouveautesLues: ["v478"]
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
      videos: { vues: [], derniere: null },
      notes: [],
      nouveautesLues: []
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
    }
    if (Array.isArray(p.notes)) v.notes = p.notes.slice(-40);
    if (Array.isArray(p.nouveautesLues)) v.nouveautesLues = p.nouveautesLues.slice(-100);
    return v;
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

  function sauvegarderProfil(profil) {
    cache = normaliser(profil || cache || {});
    try { localStorage.setItem(CLE, JSON.stringify(cache)); } catch (e) { /* quota / privé */ }
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

  /* Export public */
  window.STIProfil = {
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
    deconnecter: deconnecter
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
