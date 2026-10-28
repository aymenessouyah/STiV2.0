/* Récupération des données du profil après une coupure, sans recharger la page.
   Le synchroniseur historique reste intact ; ses POST attendent la lecture cloud. */
(function (global) {
  'use strict';
  // La page principale synchronise déjà les aperçus internes, comme le code historique.
  try { if (global.frameElement || (global.self !== global.top && global.top.location.origin === global.location.origin)) return; }
  catch (e) { return; }
  var api = global.STIProfil, cfg = global.STI_AUTH;
  if (!api || !api.projectionSynchronisation || !cfg || !cfg.URL || typeof global.fetch !== 'function') return;
  var fetchOriginal = global.fetch.bind(global), adresse = new URL(cfg.URL + '/rest/v1/sti_progressions');
  var base = null, baseDonnees = null, uidBase = '', sequence = 0, sequenceBase = 0;
  var lecture = null, postEnAttente = null, timer = 0, delai = 1500;
  var attenteLecture = !global.navigator.onLine;
  // Même périmètre que le synchroniseur protégé : ne jamais renvoyer les clés de session.
  var exclues = 'sti-session-cache sti-admin-gold sti-gold sti-cred sti-offline sti-bio-nav-ts sti-bio-lease-ts sti-bio-click-nav-ts sti-bio-session-ok sti-sec-config sti-admin-theme sti-admin-palette sti-admin-badge-mob-repli sti-quiz-sync-file-v1 sti-quiz-sync-vus-v1 sti-quiz-sync-vus-purge-v1 sti-quiz-sync-rep-v1 sti-quiz-sessions-actives-v1 sti-quiz-sessions-purge-v1 sti-sync-maj sti-sync-uid'.split(' ');
  var quiz = 'js_quiz_high_score js_quiz_total_answered sqlQuestV3 quizphp_v1_user quizphp_v1_hist quizphp_v1_board quizzora_xp_v1 sti-quiz-xp-js-v1'.split(' ');
  function admise(k) { return k && exclues.indexOf(k) < 0 && (k.indexOf('sti-') === 0 || quiz.indexOf(k) >= 0); }
  function instantane() { return api.projectionSynchronisation(admise); }
  var etatInitial = api.lireEtatSession();
  // Le premier GET historique peut être terminé avant le chargement de ce module.
  if (!attenteLecture && etatInitial.id && !etatInitial.compteEnAttente) {
    uidBase = String(etatInitial.id); base = api.chargerProfil(); baseDonnees = instantane();
  }

  function objet(valeur) {
    try { if (typeof valeur === 'string') valeur = JSON.parse(valeur); } catch (e) { return null; }
    return valeur && typeof valeur === 'object' ? valeur : null;
  }
  function egal(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
  function profilDans(donnees) {
    var p = donnees && objet(donnees['sti-profil-abonne']);
    return p && !Array.isArray(p) ? api.normaliserProfil(p) : null;
  }
  function retenirBase(uid, profil, ordre, donnees) {
    if (!uid || !profil || ordre < sequenceBase) return;
    uidBase = String(uid); base = profil; sequenceBase = ordre;
    if (!donnees) { baseDonnees = instantane(); return; }
    baseDonnees = {};
    Object.keys(donnees).forEach(function (k) {
      if (admise(k) && donnees[k] != null) baseDonnees[k] = typeof donnees[k] === 'string' ? donnees[k] : JSON.stringify(donnees[k]);
    });
  }
  function utilisateurActuel(uid) {
    var etat = api.lireEtatSession();
    return Boolean(etat.connecte && !etat.compteEnAttente && etat.id && String(etat.id) === String(uid));
  }

  /* Fusion à trois états : préserver les changements locaux et distants
     indépendants ; en cas de conflit sur une même valeur, garder le local. */
  function fusion(ancien, local, distant) {
    if (egal(local, ancien)) return distant;
    if (egal(distant, ancien) || egal(local, distant)) return local;
    if (Array.isArray(local) && Array.isArray(distant)) {
      var av = Array.isArray(ancien) ? ancien : [];
      var cle = function (v) { return JSON.stringify(v); };
      var old = new Set(av.map(cle)), loc = new Set(local.map(cle)), dist = new Set(distant.map(cle)), vus = new Set();
      return local.concat(distant).filter(function (valeur) {
        var k = cle(valeur);
        if (vus.has(k) || (old.has(k) && (!loc.has(k) || !dist.has(k)))) return false;
        vus.add(k); return true;
      });
    }
    if (local && distant && typeof local === 'object' && typeof distant === 'object' && !Array.isArray(local) && !Array.isArray(distant)) {
      var resultat = {}, reference = ancien && typeof ancien === 'object' && !Array.isArray(ancien) ? ancien : {};
      var cles = new Set(Object.keys(reference).concat(Object.keys(local), Object.keys(distant)));
      cles.forEach(function (k) {
        var valeur = fusion(reference[k], local[k], distant[k]);
        if (valeur !== undefined) resultat[k] = valeur;
      });
      return resultat;
    }
    return local;
  }

  /* Les autres journaux synchronisés doivent aussi survivre au POST complet.
     On conserve leurs valeurs brutes et on fusionne les JSON quand c'est possible. */
  function fusionBrute(ancien, local, distant) {
    if (distant == null) return local;
    distant = typeof distant === 'string' ? distant : JSON.stringify(distant);
    if (local == null) return ancien != null && ancien === distant ? local : distant;
    if (local === ancien) return distant;
    if (distant === ancien || local === distant) return local;
    try {
      var l = JSON.parse(local), d = JSON.parse(distant), a;
      try { a = JSON.parse(ancien); } catch (e) { a = undefined; }
      if (l && d && typeof l === 'object' && typeof d === 'object') return JSON.stringify(fusion(a, l, d));
    } catch (e) {}
    return local;
  }
  function maximumImbrique(a, b) {
    if ((typeof a === 'number' || typeof a === 'string') && (typeof b === 'number' || typeof b === 'string') &&
        String(a).trim() && String(b).trim() && Number.isFinite(Number(a)) && Number.isFinite(Number(b))) return Math.max(Number(a), Number(b));
    if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
      var out = Object.assign({}, a, b);
      Object.keys(out).forEach(function (k) { if (a[k] != null && b[k] != null) out[k] = maximumImbrique(a[k], b[k]); });
      return out;
    }
    return a == null ? b : a;
  }
  function fusionQuiz(cle, ancien, local, distant) {
    if (distant == null) return local;
    if (cle === 'js_quiz_high_score' || cle === 'js_quiz_total_answered') {
      return String(Math.max(Number(local) || 0, Number(distant) || 0));
    }
    var resultat = fusionBrute(ancien, local, distant);
    if (['sqlQuestV3', 'quizphp_v1_user', 'quizzora_xp_v1', 'sti-quiz-xp-js-v1'].indexOf(cle) < 0) return resultat;
    try {
      var a = JSON.parse(local || '{}'), b = typeof distant === 'string' ? JSON.parse(distant) : distant;
      var out = JSON.parse(resultat || '{}');
      if (!a || !b || !out || typeof a !== 'object' || typeof b !== 'object' || typeof out !== 'object') return resultat;
      ['xp', 'best', 'level', 'streak', 'parties', 'bonnes', 'total', 'totalAnswered', 'totalCorrect', 'bestCombo', 'playgroundCount', 'mastery'].forEach(function (k) {
        if (a[k] != null && b[k] != null) out[k] = maximumImbrique(a[k], b[k]);
      });
      if (Array.isArray(a.badges) || Array.isArray(b.badges)) {
        out.badges = Array.from(new Set((Array.isArray(a.badges) ? a.badges : []).concat(Array.isArray(b.badges) ? b.badges : [])));
      }
      return JSON.stringify(out);
    } catch (e) { return resultat; }
  }

  function fusionMedias(loc, dist) {
    var sortie = {}, cles = new Set(Object.keys(loc).concat(Object.keys(dist)));
    cles.forEach(function (k) {
      var a = loc[k], b = dist[k];
      if (!a) { sortie[k] = b; return; }
      if (!b) { sortie[k] = a; return; }
      if (typeof a === 'number') a = { sec: a, pct: a >= 2 ? 1 : 0, maxPct: a >= 2 ? 1 : 0 };
      if (typeof b === 'number') b = { sec: b, pct: b >= 2 ? 1 : 0, maxPct: b >= 2 ? 1 : 0 };
      if (typeof a !== 'object' || typeof b !== 'object') { sortie[k] = a; return; }
      var max = Math.max(Number(a.maxPct) || 0, Number(b.maxPct) || 0, Number(a.pct) || 0, Number(b.pct) || 0);
      if (!max && ((Number(a.sec) || 0) >= 2 || (Number(b.sec) || 0) >= 2)) max = 1;
      var fini = Boolean(a.done || b.done || max >= 88), recent = (Number(a.ts || a.maj) || 0) >= (Number(b.ts || b.maj) || 0) ? a : b;
      var masque = Boolean(!fini && recent.repriseMasquee && Number(recent.sec || 0) === 0);
      sortie[k] = { pct: fini ? 100 : Math.max(Number(recent.pct) || 0, max > 0 ? 1 : 0), maxPct: fini ? 100 : max,
        sec: fini || masque ? 0 : (Number(recent.sec) || Number(a.sec) || Number(b.sec) || 0),
        dur: Math.max(Number(a.dur) || 0, Number(b.dur) || 0), done: fini, ts: Math.max(Number(a.ts || a.maj) || 0, Number(b.ts || b.maj) || 0) };
      if (masque) sortie[k].repriseMasquee = true;
    });
    return sortie;
  }

  function fusionnerDonnees(uid, donnees) {
    if (!utilisateurActuel(uid)) return false;
    donnees = objet(donnees) || {};
    var change = false, remote = profilDans(donnees), actuel = api.chargerProfil();
    if (remote) {
      var reference = uidBase === String(uid) && base ? base : api.normaliserProfil({});
      var combine = api.normaliserProfil(fusion(reference, actuel, remote));
      if (!egal(combine, actuel)) { api.sauvegarderProfil(combine, false); change = true; }
    }
    function mettre(cle, valeur) {
      var local = api.projectionSuivi(cle);
      if (!egal(local, valeur)) { api.projectionSuivi(cle, valeur); change = true; }
    }
    var pagesDist = objet(donnees['sti-pages-vues-v432']);
    if (pagesDist && !Array.isArray(pagesDist)) {
      var pagesLoc = objet(api.projectionSuivi('sti-pages-vues-v432')) || {};
      var pages = Object.assign({}, pagesDist, pagesLoc);
      Object.keys(pagesDist).forEach(function (k) {
        var a = Number(pagesLoc[k]) || 0, b = Number(pagesDist[k]) || 0;
        if (a && b) pages[k] = Math.min(a, b);
      });
      mettre('sti-pages-vues-v432', pages);
    }
    var exosDist = objet(donnees['sti-exos-faits']);
    if (exosDist) {
      function carte(v) {
        if (!Array.isArray(v)) return v && typeof v === 'object' ? v : {};
        var out = {}; v.forEach(function (k) { if (k != null) out[String(k)] = true; }); return out;
      }
      mettre('sti-exos-faits', Object.assign({}, carte(exosDist), carte(api.projectionSuivi('sti-exos-faits'))));
    }
    var mediasDist = objet(donnees['sti-media-prog-v1']);
    if (mediasDist && !Array.isArray(mediasDist)) {
      mettre('sti-media-prog-v1', fusionMedias(objet(api.projectionSuivi('sti-media-prog-v1')) || {}, mediasDist));
      if (typeof global.rafraichirBadgesProgressionSTI === 'function') global.rafraichirBadgesProgressionSTI();
    }
    var locales = instantane(), referenceBrute = uidBase === String(uid) && baseDonnees ? baseDonnees : {};
    Object.keys(donnees).forEach(function (cle) {
      if (!admise(cle) || donnees[cle] == null || ['sti-profil-abonne', 'sti-exos-faits', 'sti-pages-vues-v432', 'sti-media-prog-v1'].indexOf(cle) >= 0) return;
      var locale = locales[cle], ancienne = referenceBrute[cle];
      var valeur = fusionQuiz(cle, ancienne, locale, donnees[cle]);
      if (valeur !== locale) { api.projectionSynchronisation(admise, cle, valeur); change = true; }
    });
    if (change) global.dispatchEvent(new CustomEvent('sti-cloud-restored', { detail: { reconnexion: true } }));
    return true;
  }

  function cheminSync(input) {
    try {
      var u = new URL(typeof input === 'string' ? input : input.url, global.location.href);
      return u.origin === adresse.origin && u.pathname === adresse.pathname;
    } catch (e) { return false; }
  }
  function corpsActualise(options, uid) {
    var copie = Object.assign({}, options), ligne;
    try { ligne = JSON.parse(copie.body); } catch (e) { return copie; }
    if (!ligne || String(ligne.user_id) !== String(uid) || !ligne.donnees) return null;
    // Recollecter après fusion : le POST historique remplace tout le document cloud.
    ligne.donnees = instantane();
    ligne.maj = new Date().toISOString();
    copie.body = JSON.stringify(ligne);
    if (copie.keepalive && copie.body.length >= 60000) delete copie.keepalive;
    return copie;
  }
  function envoyer(input, options) {
    var ordre = ++sequence, ligne = objet(options && options.body);
    return fetchOriginal(input, options).then(function (rep) {
      if (rep.ok && ligne && utilisateurActuel(ligne.user_id)) retenirBase(ligne.user_id, profilDans(ligne.donnees), ordre, ligne.donnees);
      return rep;
    });
  }

  /* Ne différer que le POST du synchroniseur protégé pendant le GET de reprise.
     Toutes les autres requêtes conservent exactement leur comportement. */
  global.fetch = function (input, options) {
    if (!cheminSync(input)) return fetchOriginal.apply(global, arguments);
    var methode = String((options && options.method) || (input && input.method) || 'GET').toUpperCase();
    if (methode === 'GET') {
      var ordre = ++sequence;
      return fetchOriginal(input, options).then(async function (rep) {
        if (rep.ok) {
          try {
            var lignes = await rep.clone().json(), premiere = lignes && lignes[0];
            var uid = new URL(typeof input === 'string' ? input : input.url).searchParams.get('user_id');
            uid = String(uid || '').replace(/^eq\./, '');
            if (utilisateurActuel(uid)) retenirBase(uid, profilDans(premiere && premiere.donnees) || api.normaliserProfil({}), ordre, (premiere && premiere.donnees) || {});
          } catch (e) {}
        }
        return rep;
      });
    }
    if (methode !== 'POST' || !options || typeof options.body !== 'string') return fetchOriginal.apply(global, arguments);
    if (!attenteLecture) return envoyer(input, options);
    function attendreOuRefuser(resultat) {
      var ligne = objet(options.body), uid = ligne && ligne.user_id;
      if (!resultat || !uid || String(resultat) !== String(uid) || !utilisateurActuel(uid)) {
        if (uid && utilisateurActuel(uid)) postEnAttente = { input: input, options: options, uid: uid };
        return new Response('', { status: 503 });
      }
      var actualise = corpsActualise(options, uid);
      return actualise ? envoyer(input, actualise) : new Response('', { status: 409 });
    }
    return lecture ? lecture.then(attendreOuRefuser) : Promise.resolve(attendreOuRefuser(false));
  };

  function programmerNouvelEssai() {
    if (timer || !global.navigator.onLine) return;
    timer = global.setTimeout(function () { timer = 0; rafraichir(); }, delai);
    delai = Math.min(delai * 2, 15000);
  }
  function rafraichir() {
    if (lecture || !global.navigator.onLine) return lecture;
    lecture = (async function () {
      try {
        var client = global.__STI_SB_CLIENT;
        if (!client || !client.auth || typeof client.auth.getSession !== 'function') return false;
        var reponse = await client.auth.getSession(), session = reponse && reponse.data && reponse.data.session;
        var uid = session && session.user && session.user.id;
        if (!uid || !session.access_token || !utilisateurActuel(uid)) return false;
        var url = new URL(adresse.href);
        url.searchParams.set('user_id', 'eq.' + uid); url.searchParams.set('select', 'donnees,maj');
        var rep = await fetchOriginal(url.href, { cache: 'no-store', headers: { apikey: cfg.CLE, Authorization: 'Bearer ' + session.access_token } });
        if (!rep.ok) return false;
        var lignes = await rep.json(), encore = await client.auth.getSession();
        if (!encore || !encore.data || !encore.data.session || !encore.data.session.user || String(encore.data.session.user.id) !== String(uid)) return false;
        var donnees = lignes && lignes[0] && lignes[0].donnees;
        if (!fusionnerDonnees(uid, donnees)) return false;
        retenirBase(uid, profilDans(donnees) || api.normaliserProfil({}), ++sequence, donnees || {});
        if (postEnAttente && String(postEnAttente.uid) !== String(uid)) postEnAttente = null;
        while (postEnAttente) {
          var post = postEnAttente, actualise = corpsActualise(post.options, uid);
          if (!actualise) return false;
          actualise.headers = Object.assign({}, actualise.headers, { Authorization: 'Bearer ' + session.access_token });
          var renvoi = await envoyer(post.input, actualise);
          if (!renvoi.ok) return false;
          if (postEnAttente === post) postEnAttente = null;
        }
        delai = 1500;
        return uid;
      } catch (e) { return false; }
    })().then(function (resultat) {
      lecture = null;
      if (resultat) attenteLecture = false;
      else programmerNouvelEssai();
      return resultat;
    });
    return lecture;
  }
  global.addEventListener('sti-cloud-restored', function (event) {
    if (event && event.detail) return;
    var etat = api.lireEtatSession();
    if (etat.id && !etat.compteEnAttente) retenirBase(etat.id, api.chargerProfil(), ++sequence);
  });
  global.__STI_RECONNEXION_PROFIL = true;
  global.addEventListener('offline', function () { attenteLecture = true; });
  global.addEventListener('online', function () { global.__STI_RECONNEXION_ATTENDUE = false; attenteLecture = true; rafraichir(); });
  if (global.__STI_RECONNEXION_ATTENDUE) {
    global.__STI_RECONNEXION_ATTENDUE = false; attenteLecture = true; rafraichir();
  }
  // Une nouvelle connexion explicite doit relire le cloud, même dans le délai
  // de temporisation des navigations successives du synchroniseur historique.
  var clientAuth = global.__STI_SB_CLIENT && global.__STI_SB_CLIENT.auth;
  if (clientAuth && typeof clientAuth.onAuthStateChange === 'function') {
    clientAuth.onAuthStateChange(function (evenement, session) {
      if (evenement !== 'SIGNED_IN' || !session || !session.user) return;
      global.setTimeout(function () { attenteLecture = true; rafraichir(); }, 0);
    });
  }
})(window);
