/* ═══════════════ STI SYNC (v255) — sauvegarde cloud des progressions ═══════════════
   Principe : les progressions (tableau de bord, quiz…) vivent dans localStorage.
   Si l'élève est connecté (session Supabase), elles sont aussi copiées dans la
   table cloud « sti_progressions » : il les retrouve sur tous ses appareils.
   Sans session ou sans table activée : fonctionnement local inchangé. */
(function () {
  "use strict";
  var CLE_SYNC_MAJ = "sti-sync-maj";
  var CLE_SYNC_UID = "sti-sync-uid";
  var EXCLUES = [
    "sti-session-cache",
    "sti-admin-gold",
    "sti-gold",
    "sti-cred",
    "sti-offline",
    "sti-bio-nav-ts",
    "sti-bio-lease-ts",
    "sti-bio-click-nav-ts",
    "sti-bio-session-ok",
    "sti-sec-config",
    "sti-admin-theme",
    "sti-admin-palette",
    "sti-admin-badge-mob-repli",
    "sti-quiz-sync-file-v1",
    "sti-quiz-sync-vus-v1",
    "sti-quiz-sync-vus-purge-v1",
    "sti-quiz-sync-rep-v1",
    "sti-quiz-sessions-actives-v1",
    "sti-quiz-sessions-purge-v1",
    CLE_SYNC_MAJ,
    CLE_SYNC_UID
  ];
  var CLES_QUIZ_CLOUD = [
    "js_quiz_high_score",
    "js_quiz_total_answered",
    "sqlQuestV3",
    "quizphp_v1_user",
    "quizphp_v1_hist",
    "quizphp_v1_board",
    "quizzora_xp_v1",
    "sti-quiz-xp-js-v1"
  ];
  var cfg = window.STI_AUTH || { URL: "https://vywujxmepvcbgedgmger.supabase.co", CLE: "sb_publishable_FI5FimytONd5VdWK6GfXLA_I6vPTrvn" };
  var session = null, dernierHash = "", minuteur = null;
  var enVolTirer = false, pullInitialTermine = false, pushDiffere = false;

  function lireSessionDepuisStore(st) {
    if (!st) return null;
    try {
      for (var i = 0; i < st.length; i++) {
        var k = st.key(i) || "";
        if (k.indexOf("sb-") === 0 && k.indexOf("-auth-token") !== -1) {
          var v = JSON.parse(st.getItem(k) || "null");
          if (v && v.access_token && v.user && v.user.id) return { token: v.access_token, id: v.user.id, email: v.user.email || "" };
        }
      }
    } catch (e) {}
    return null;
  }
  function lireSession() {
    return lireSessionDepuisStore(typeof localStorage !== "undefined" ? localStorage : null) ||
           lireSessionDepuisStore(typeof sessionStorage !== "undefined" ? sessionStorage : null);
  }
  function estCleSynchronisable(k) {
    if (!k || EXCLUES.indexOf(k) !== -1) return false;
    return k.indexOf("sti-") === 0 || CLES_QUIZ_CLOUD.indexOf(k) !== -1;
  }
  function collecter() {
    var d = {};
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i) || "";
      if (estCleSynchronisable(k)) { try { d[k] = localStorage.getItem(k); } catch (e) {} }
    }
    return d;
  }
  function hash(d) {
    try {
      var ks = Object.keys(d || {}).sort();
      var h = 2166136261;
      var len = 0;
      for (var i = 0; i < ks.length; i++) {
        var s = ks[i] + "=" + String(d[ks[i]] == null ? "" : d[ks[i]]) + "|";
        len += s.length;
        for (var j = 0; j < s.length; j++) {
          h ^= s.charCodeAt(j);
          h = Math.imul ? Math.imul(h, 16777619) : ((h * 16777619) | 0);
        }
      }
      return (h >>> 0).toString(36) + ":" + len + ":" + ks.length;
    } catch (e) { return ""; }
  }
  function fusionnerMediaProgMonotone(rawLoc, rawDist) {
    var mLoc = {}, mDist = {};
    try { mLoc = (typeof rawLoc === "string" ? JSON.parse(rawLoc || "{}") : rawLoc) || {}; } catch (e1) { mLoc = {}; }
    try { mDist = (typeof rawDist === "string" ? JSON.parse(rawDist || "{}") : rawDist) || {}; } catch (e2) { mDist = {}; }
    var out = {};
    var cles = {};
    Object.keys(mDist).forEach(function (c) { cles[c] = 1; });
    Object.keys(mLoc).forEach(function (c) { cles[c] = 1; });
    Object.keys(cles).forEach(function (c) {
      var rawA = mLoc[c];
      var rawB = mDist[c];
      var a = (rawA && typeof rawA === "object") ? rawA : (typeof rawA === "number" && rawA > 0 ? { sec: rawA, pct: rawA >= 2 ? 1 : 0, maxPct: rawA >= 2 ? 1 : 0 } : null);
      var b = (rawB && typeof rawB === "object") ? rawB : (typeof rawB === "number" && rawB > 0 ? { sec: rawB, pct: rawB >= 2 ? 1 : 0, maxPct: rawB >= 2 ? 1 : 0 } : null);
      if (!a && !b) return;
      a = a || {};
      b = b || {};
      var secA = Number(a.sec != null ? a.sec : (a.t || a.time || 0)) || 0;
      var secB = Number(b.sec != null ? b.sec : (b.t || b.time || 0)) || 0;
      var maxPct = Math.max(Number(a.maxPct) || 0, Number(b.maxPct) || 0, Number(a.pct) || 0, Number(b.pct) || 0);
      if (!maxPct && (secA >= 2 || secB >= 2)) maxPct = 1;
      var done = Boolean(a.done || b.done || maxPct >= 88);
      if (done) maxPct = 100;
      var tsA = Number(a.ts || a.maj) || 0;
      var tsB = Number(b.ts || b.maj) || 0;
      var aExiste = Boolean(rawA && (typeof rawA === "object" || typeof rawA === "number"));
      var bExiste = Boolean(rawB && (typeof rawB === "object" || typeof rawB === "number"));
      var recent = !bExiste ? a : (!aExiste ? b : (tsA >= tsB ? a : b));
      var masque = Boolean(!done && recent && recent.repriseMasquee && Number(recent.sec || 0) === 0);
      var secOut = (done || masque) ? 0 : (Number(recent.sec != null ? recent.sec : (recent.t || recent.time || 0)) || secA || secB || 0);
      var entree = {
        pct: done ? 100 : Math.max(Number(recent.pct) || 0, maxPct > 0 ? 1 : 0),
        maxPct: maxPct,
        sec: secOut,
        dur: Math.max(Number(a.dur) || 0, Number(b.dur) || 0),
        done: done,
        ts: Math.max(tsA, tsB)
      };
      if (masque) entree.repriseMasquee = true;
      out[c] = entree;
    });
    return JSON.stringify(out);
  }
  function isolerComptePartageSiBesoin(uid) {
    if (!uid) return;
    try {
      var prevUid = localStorage.getItem(CLE_SYNC_UID) || "";
      if (prevUid && prevUid !== uid) {
        var garderUi = { "sti-theme": 1, "sti-pc-zoom": 1, "sti-veilleuse": 1 };
        var aPurger = [];
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i) || "";
          if (k && !garderUi[k] && estCleSynchronisable(k)) aPurger.push(k);
        }
        aPurger.forEach(function (kRem) { try { localStorage.removeItem(kRem); } catch (eRem) {} });
        localStorage.removeItem(CLE_SYNC_MAJ);
        dernierHash = "";
        pullInitialTermine = false;
        try {
          if (typeof sessionStorage !== "undefined") {
            sessionStorage.removeItem("sti-sync-pull-uid");
            sessionStorage.removeItem("sti-sync-pull-ts");
            sessionStorage.removeItem("sti-sync-last-hash");
          }
        } catch (eSs) {}
      }
      localStorage.setItem(CLE_SYNC_UID, uid);
    } catch (e) {}
  }
  function parserJsonSoupleSync(raw, repli) {
    if (raw == null || raw === "") return repli;
    if (typeof raw === "object") return raw;
    try {
      var v = JSON.parse(String(raw));
      return v == null ? repli : v;
    } catch (e) { return repli; }
  }
  function scoreValideSync(v) {
    var s = String(v == null ? "" : v).trim();
    if (!s) return false;
    if (/\/\s*\d+/.test(s) || /%/.test(s)) return true;
    if (/\bpts?\b/i.test(s)) return false;
    var nb = parseFloat(s.replace(",", "."));
    return isFinite(nb) && nb >= 0 && nb <= 20;
  }
  /* v478 : fusion strictement monotone des XP, niveaux, records et scores de quiz
     (ne permet jamais à un état local vierge ou à xp=0 d'écraser les XP acquis dans le cloud) */
  function fusionnerCleQuizMonotone(k, rawLoc, rawDist) {
    if (rawDist == null) return null;
    if (k === "js_quiz_high_score" || k === "js_quiz_total_answered") {
      var vLoc = parseInt(rawLoc || "0", 10) || 0;
      var vDist = parseInt(rawDist || "0", 10) || 0;
      return String(Math.max(vLoc, vDist));
    }
    if (k === "quizphp_v1_user") {
      var uLoc = parserJsonSoupleSync(rawLoc, null);
      var uDist = parserJsonSoupleSync(rawDist, null);
      if (!uDist || typeof uDist !== "object") return null;
      if (!uLoc || typeof uLoc !== "object") return JSON.stringify(uDist);
      var uOut = Object.assign({}, uDist, uLoc);
      uOut.xp = Math.max(Number(uLoc.xp) || 0, Number(uDist.xp) || 0);
      uOut.best = Math.max(Number(uLoc.best) || 0, Number(uDist.best) || 0);
      uOut.streak = Math.max(Number(uLoc.streak) || 0, Number(uDist.streak) || 0);
      if (!uOut.name && uDist.name) {
        uOut.name = uDist.name;
        if (uDist.avatar) uOut.avatar = uDist.avatar;
      }
      return JSON.stringify(uOut);
    }
    if (k === "sqlQuestV3") {
      var sLoc = parserJsonSoupleSync(rawLoc, null);
      var sDist = parserJsonSoupleSync(rawDist, null);
      if (!sDist || typeof sDist !== "object") return null;
      if (!sLoc || typeof sLoc !== "object") return JSON.stringify(sDist);
      var sOut = Object.assign({}, sDist, sLoc);
      sOut.xp = Math.max(Number(sLoc.xp) || 0, Number(sDist.xp) || 0);
      sOut.level = Math.max(Number(sLoc.level) || 1, Number(sDist.level) || 1);
      sOut.streak = Math.max(Number(sLoc.streak) || 0, Number(sDist.streak) || 0);
      sOut.totalAnswered = Math.max(Number(sLoc.totalAnswered) || 0, Number(sDist.totalAnswered) || 0);
      sOut.totalCorrect = Math.max(Number(sLoc.totalCorrect) || 0, Number(sDist.totalCorrect) || 0);
      sOut.bestCombo = Math.max(Number(sLoc.bestCombo) || 0, Number(sDist.bestCombo) || 0);
      sOut.playgroundCount = Math.max(Number(sLoc.playgroundCount) || 0, Number(sDist.playgroundCount) || 0);
      if ((!sLoc.pseudo || sLoc.pseudo === "Apprenti SQL") && sDist.pseudo && sDist.pseudo !== "Apprenti SQL") {
        sOut.pseudo = sDist.pseudo;
        if (sDist.avatar) sOut.avatar = sDist.avatar;
        sOut.profileSet = true;
      } else {
        sOut.profileSet = Boolean(sLoc.profileSet || sDist.profileSet);
      }
      var bMerged = Object.assign({}, sDist.best || {}, sLoc.best || {});
      Object.keys(bMerged).forEach(function (m) {
        bMerged[m] = Math.max(Number(sLoc.best && sLoc.best[m]) || 0, Number(sDist.best && sDist.best[m]) || 0);
      });
      sOut.best = bMerged;
      var mMerged = Object.assign({}, sDist.mastery || {}, sLoc.mastery || {});
      Object.keys(mMerged).forEach(function (cat) {
        var ml = (sLoc.mastery && sLoc.mastery[cat]) || {};
        var md = (sDist.mastery && sDist.mastery[cat]) || {};
        mMerged[cat] = {
          c: Math.max(Number(ml.c) || 0, Number(md.c) || 0),
          t: Math.max(Number(ml.t) || 0, Number(md.t) || 0)
        };
      });
      sOut.mastery = mMerged;
      if (Array.isArray(sLoc.badges) || Array.isArray(sDist.badges)) {
        var bgMap = {};
        (Array.isArray(sDist.badges) ? sDist.badges : []).concat(Array.isArray(sLoc.badges) ? sLoc.badges : []).forEach(function (b) {
          if (b) bgMap[String(b)] = true;
        });
        sOut.badges = Object.keys(bgMap);
      }
      return JSON.stringify(sOut);
    }
    if (k === "quizzora_xp_v1" || k === "sti-quiz-xp-js-v1") {
      var qLoc = parserJsonSoupleSync(rawLoc, null);
      var qDist = parserJsonSoupleSync(rawDist, null);
      if (!qDist || typeof qDist !== "object") return null;
      if (!qLoc || typeof qLoc !== "object") return JSON.stringify(qDist);
      return JSON.stringify({
        xp: Math.max(Number(qLoc.xp) || 0, Number(qDist.xp) || 0),
        best: Math.max(Number(qLoc.best) || 0, Number(qDist.best) || 0),
        parties: Math.max(Number(qLoc.parties) || 0, Number(qDist.parties) || 0),
        bonnes: Math.max(Number(qLoc.bonnes) || 0, Number(qDist.bonnes) || 0),
        total: Math.max(Number(qLoc.total) || 0, Number(qDist.total) || 0)
      });
    }
    if (k === "sti-mes-scores") {
      var scLoc = parserJsonSoupleSync(rawLoc, {}) || {};
      var scDist = parserJsonSoupleSync(rawDist, {}) || {};
      var scOut = {};
      Object.keys(scDist).forEach(function (qz) { if (scoreValideSync(scDist[qz])) scOut[qz] = scDist[qz]; });
      Object.keys(scLoc).forEach(function (qz) { if (scoreValideSync(scLoc[qz])) scOut[qz] = scLoc[qz]; });
      return JSON.stringify(scOut);
    }
    return null;
  }
  function fusionnerAcquisMonotonesDistants(donneesDist) {
    if (!donneesDist || typeof donneesDist !== "object") return false;
    var change = false;
    if (donneesDist["sti-media-prog-v1"]) {
      try {
        var curM = localStorage.getItem("sti-media-prog-v1");
        var fusM = fusionnerMediaProgMonotone(curM, donneesDist["sti-media-prog-v1"]);
        if (fusM !== curM) { localStorage.setItem("sti-media-prog-v1", fusM); change = true; }
      } catch (eFm) {}
    }
    var clesMonotones = [
      "sqlQuestV3",
      "quizphp_v1_user",
      "js_quiz_high_score",
      "js_quiz_total_answered",
      "quizzora_xp_v1",
      "sti-quiz-xp-js-v1",
      "sti-mes-scores"
    ];
    clesMonotones.forEach(function (k) {
      if (donneesDist[k] == null) return;
      try {
        var cur = localStorage.getItem(k);
        var fus = fusionnerCleQuizMonotone(k, cur, donneesDist[k]);
        if (fus !== null && fus !== cur) {
          localStorage.setItem(k, fus);
          change = true;
        }
      } catch (eKm) {}
    });
    ["quizphp_v1_hist", "quizphp_v1_board", "sti-quiz-tableaux-v1"].forEach(function (k) {
      if (donneesDist[k] == null) return;
      try {
        if (!localStorage.getItem(k)) {
          localStorage.setItem(k, typeof donneesDist[k] === "string" ? donneesDist[k] : JSON.stringify(donneesDist[k]));
          change = true;
        }
      } catch (eOpt) {}
    });
    return change;
  }
  function appliquer(d) {
    try {
      Object.keys(d || {}).forEach(function (k) {
        if (!estCleSynchronisable(k) || d[k] == null) return;
        if (k === "sti-media-prog-v1") {
          try {
            localStorage.setItem(k, fusionnerMediaProgMonotone(localStorage.getItem(k), d[k]));
            return;
          } catch (eMed) {}
        }
        if (k === "sti-pages-vues-v432") {
          try {
            var pvLoc = JSON.parse(localStorage.getItem(k) || "{}") || {};
            var pvDist = (typeof d[k] === "string" ? JSON.parse(d[k] || "{}") : d[k]) || {};
            var pvOut = {};
            Object.keys(pvDist).forEach(function (pg) { pvOut[pg] = pvDist[pg]; });
            Object.keys(pvLoc).forEach(function (pg) {
              if (!pvOut[pg]) { pvOut[pg] = pvLoc[pg]; return; }
              var tA = Number(pvOut[pg]) || 0, tB = Number(pvLoc[pg]) || 0;
              pvOut[pg] = (tA > 0 && tB > 0) ? Math.min(tA, tB) : (tB || tA || 1);
            });
            localStorage.setItem(k, JSON.stringify(pvOut));
            return;
          } catch (ePv) {}
        }
        if (k === "sti-revision-v436") {
          try {
            var rvLoc = JSON.parse(localStorage.getItem(k) || "{}") || {};
            var rvDist = (typeof d[k] === "string" ? JSON.parse(d[k] || "{}") : d[k]) || {};
            var rvOut = {};
            Object.keys(rvDist).forEach(function (pg) { rvOut[pg] = rvDist[pg]; });
            Object.keys(rvLoc).forEach(function (pg) {
              var a = rvOut[pg], b = rvLoc[pg];
              if (!a || typeof a !== "object") { rvOut[pg] = b; return; }
              if (!b || typeof b !== "object") return;
              var etA = Number(a.etape) || 0, etB = Number(b.etape) || 0;
              rvOut[pg] = etB > etA ? b : (etA > etB ? a : ((new Date(b.dernier || b.vu || 0).getTime() || 0) >= (new Date(a.dernier || a.vu || 0).getTime() || 0) ? b : a));
            });
            localStorage.setItem(k, JSON.stringify(rvOut));
            return;
          } catch (eRv) {}
        }
        if (
          k === "sti-mes-scores" ||
          k === "js_quiz_high_score" ||
          k === "js_quiz_total_answered" ||
          k === "quizphp_v1_user" ||
          k === "sqlQuestV3" ||
          k === "quizzora_xp_v1" ||
          k === "sti-quiz-xp-js-v1"
        ) {
          try {
            var fusQuiz = fusionnerCleQuizMonotone(k, localStorage.getItem(k), d[k]);
            if (fusQuiz !== null) {
              localStorage.setItem(k, fusQuiz);
              return;
            }
          } catch (eQz) {}
        }
        if (k === "sti-chapitres-vus" || k === "sti-revised-courses" || k === "sti-pieges-bac-ok" || k === "sti-flashcards-mastered" || k === "sti-exos-faits") {
          try {
            var cLoc = JSON.parse(localStorage.getItem(k) || "{}") || {};
            var cDist = (typeof d[k] === "string" ? JSON.parse(d[k] || "{}") : d[k]) || {};
            if (Array.isArray(cLoc) || Array.isArray(cDist)) {
              var uArr = {};
              (Array.isArray(cDist) ? cDist : []).concat(Array.isArray(cLoc) ? cLoc : []).forEach(function (x) { if (x != null) uArr[String(x)] = x; });
              localStorage.setItem(k, JSON.stringify(Object.keys(uArr).map(function (kx) { return uArr[kx]; })));
            } else {
              localStorage.setItem(k, JSON.stringify(Object.assign({}, cDist, cLoc)));
            }
            return;
          } catch (eCh) {}
        }
        if (k === "sti-derniere-visite") {
          try {
            var dvLoc = localStorage.getItem(k) || "";
            var dvDist = String(d[k] || "");
            var tL = new Date(dvLoc || 0).getTime() || 0;
            var tD = new Date(dvDist || 0).getTime() || 0;
            localStorage.setItem(k, tL >= tD ? dvLoc : dvDist);
            return;
          } catch (eDv) {}
        }
        localStorage.setItem(k, typeof d[k] === "string" ? d[k] : JSON.stringify(d[k]));
      });
      if (typeof window !== "undefined" && typeof window.dispatchEvent === "function" && typeof CustomEvent === "function") {
        window.dispatchEvent(new CustomEvent("sti-cloud-restored"));
      }
    } catch (e) {}
  }
  function pastille(texte, couleur) {
    var el = document.getElementById("sti-sync-pastille");
    if (!el) {
      el = document.createElement("div"); el.id = "sti-sync-pastille";
      el.setAttribute("style", "position:fixed;right:14px;bottom:14px;z-index:99999;padding:8px 14px;border-radius:999px;border:2px solid #1a1a2e;background:#fff;color:#1a1a2e;font:700 13px system-ui,sans-serif;box-shadow:3px 3px 0 #1a1a2e;");
      document.body.appendChild(el);
    }
    el.textContent = texte; el.style.background = couleur || "#fff";
  }
  function entetes() { return { "apikey": cfg.CLE, "Authorization": "Bearer " + session.token, "Content-Type": "application/json" }; }
  function tirer(forcerPull) {
    if (!session) { pastille("💾 Progression : cet appareil seulement", "#fff3e0"); return; }
    isolerComptePartageSiBesoin(session.id);
    /* v473 : éviter un aller-retour GET + POST Supabase à chaque clic de page dans le même onglet (< 20 s) */
    if (!forcerPull && typeof sessionStorage !== "undefined") {
      try {
        var lastUid = sessionStorage.getItem("sti-sync-pull-uid") || "";
        var lastTs = parseInt(sessionStorage.getItem("sti-sync-pull-ts") || "0", 10) || 0;
        var lastHash = sessionStorage.getItem("sti-sync-last-hash") || "";
        if (lastUid === session.id && lastTs > 0 && (Date.now() - lastTs) < 20000) {
          pullInitialTermine = true;
          if (lastHash) dernierHash = lastHash;
          pastille("☁️ Progression synchronisée (cloud)", "#e8f5e9");
          pousser(false, false);
          return;
        }
      } catch (eTh) {}
    }
    enVolTirer = true;
    fetch(cfg.URL + "/rest/v1/sti_progressions?user_id=eq." + encodeURIComponent(session.id) + "&select=donnees,maj", { headers: entetes() })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (lignes) {
        enVolTirer = false;
        pullInitialTermine = true;
        var avaitPushDiffere = pushDiffere;
        pushDiffere = false;
        try {
          if (typeof sessionStorage !== "undefined") {
            sessionStorage.setItem("sti-sync-pull-uid", session.id);
            sessionStorage.setItem("sti-sync-pull-ts", String(Date.now()));
          }
        } catch (eSt) {}
        if (lignes && lignes.length) {
          var distant = new Date(lignes[0].maj).getTime() || 0;
          var local = parseInt(localStorage.getItem(CLE_SYNC_MAJ) || "0", 10) || 0;
          if (lignes[0].donnees && (distant > local || !local)) {
            var avantHash = hash(collecter());
            appliquer(lignes[0].donnees);
            localStorage.setItem(CLE_SYNC_MAJ, String(distant));
            var apresHash = hash(collecter());
            dernierHash = apresHash;
            try { if (typeof sessionStorage !== "undefined") sessionStorage.setItem("sti-sync-last-hash", apresHash); } catch (eH1) {}
            pastille("☁️ Progression restaurée depuis le cloud", "#e8f5e9");
            if ((avantHash && avantHash !== apresHash) || avaitPushDiffere) {
              /* Si la fusion monotone a conservé des avancées locales plus récentes, les pousser aussi au cloud */
              setTimeout(function () { pousser(true); }, 600);
            }
            /* Consigne auteur v422 : l'annonce de restauration ne reste affichée QUE deux
               secondes, puis la pastille retrouve son état ordinaire « synchronisée » —
               et seulement si rien d'autre ne l'a remplacée entre-temps (une coupure réseau
               survenue pendant le compte à rebours annonce « cet appareil seulement » et
               garde la main). La pastille elle-même ne disparaît pas : en v418 l'auteur
               l'a voulue durables dans la roue ⚙️, c'est le message qui est temporaire. */
            setTimeout(function () {
              try {
                var elA = document.getElementById("sti-sync-pastille");
                if (elA && String(elA.textContent).indexOf("Progression restaurée") !== -1)
                  pastille("☁️ Progression synchronisée (cloud)", "#e8f5e9");
              } catch (eA) {}
            }, 2000);
            /* Mettre à jour les cases à cocher en mémoire sans recharger la page ni bloquer le nouvel onglet */
            try {
              var cbs = document.getElementsByClassName("bord-notion");
              if (cbs && cbs.length) {
                var cochees = JSON.parse(localStorage.getItem("sti-sql-bord-notions") || "{}");
                for (var idx = 0; idx < cbs.length; idx++) {
                  var cleCb = cbs[idx].getAttribute("data-notion") || "";
                  if (cleCb) cbs[idx].checked = Boolean(cochees[cleCb]);
                }
                if (cbs[0] && typeof Event === "function") {
                  cbs[0].dispatchEvent(new Event("change", { bubbles: true }));
                }
              }
            } catch (e) {}
            return;
          } else if (lignes[0].donnees) {
            /* v478 : même si local >= distant (décalage d'horloge ou push préalable depuis l'accueil),
               fusionner de façon strictement monotone les XP/scores de quiz et la progression média
               afin de ne jamais réécrire xp=0 par-dessus un XP cloud existant. */
            var aEnrichiQuizOuMedia = fusionnerAcquisMonotonesDistants(lignes[0].donnees);
            if (aEnrichiQuizOuMedia && typeof window !== "undefined" && typeof window.dispatchEvent === "function" && typeof CustomEvent === "function") {
              try { window.dispatchEvent(new CustomEvent("sti-cloud-restored")); } catch (eEv) {}
            }
            /* v473 : l'empreinte de référence cloud est toujours celle de lignes[0].donnees ;
               si le contenu local est identique, pousser(false, false) n'envoie aucun POST inutile ;
               si l'élève a progressé hors-ligne (contenu différent), pousser(false, false) synchronise immédiatement. */
            if (!dernierHash) {
              dernierHash = hash(lignes[0].donnees);
              try { if (typeof sessionStorage !== "undefined") sessionStorage.setItem("sti-sync-last-hash", dernierHash); } catch (eH2) {}
            }
          }
          pastille("☁️ Progression synchronisée (cloud)", "#e8f5e9");
          pousser(false, false);
          return;
        }
        pastille("☁️ Progression synchronisée (cloud)", "#e8f5e9"); pousser(true);
      })
      .catch(function () {
        enVolTirer = false;
        pastille("💾 Progression : cet appareil seulement", "#fff3e0");
      });
  }
  function pousser(force, enFermeture) {
    session = session || lireSession();
    if (!session) return;
    isolerComptePartageSiBesoin(session.id);
    /* v478 : interdire tout POST vers sti_progressions tant que le premier GET (tirer)
       est en vol ou qu'un compte fraîchement connecté / isolé n'a pas encore lu le cloud. */
    var aMajLocaleConnue = false;
    try { aMajLocaleConnue = (parseInt(localStorage.getItem(CLE_SYNC_MAJ) || "0", 10) || 0) > 0; } catch (eMj) {}
    if (enVolTirer || (!pullInitialTermine && !aMajLocaleConnue)) {
      pushDiffere = true;
      return;
    }
    var d = collecter(), h = hash(d);
    if (!force && h === dernierHash) return;
    dernierHash = h;
    try { if (typeof sessionStorage !== "undefined") sessionStorage.setItem("sti-sync-last-hash", h); } catch (eHs) {}
    var maj = new Date().toISOString();
    var bodyStr = JSON.stringify({ user_id: session.id, email: session.email, donnees: d, maj: maj });
    var optsFetch = {
      method: "POST",
      headers: (function () { var e = entetes(); e["Prefer"] = "resolution=merge-duplicates"; return e; })(),
      body: bodyStr
    };
    if ((force || enFermeture) && bodyStr.length < 60000) optsFetch.keepalive = true;
    fetch(cfg.URL + "/rest/v1/sti_progressions", optsFetch).then(function (r) {
      if (r.ok) { localStorage.setItem(CLE_SYNC_MAJ, String(new Date(maj).getTime())); pastille("☁️ Progression synchronisée (cloud)", "#e8f5e9"); }
      else pastille("💾 Progression : cet appareil seulement", "#fff3e0");
    }).catch(function () { pastille("💾 Progression : cet appareil seulement", "#fff3e0"); });
  }
  var timerPushMedia = null;
  var dernierPushFermetureTs = 0;
  function pousserFermetureDeduplique() {
    var maintenant = Date.now();
    if (dernierPushFermetureTs && (maintenant - dernierPushFermetureTs) < 1500) return;
    dernierPushFermetureTs = maintenant;
    pousser(false, true);
  }
  function estSousIframeInterneSTI() {
    try {
      if (window.frameElement) return true;
      if (window.self && window.top && window.self !== window.top) {
        return Boolean(window.top.location && window.top.location.origin === window.location.origin);
      }
    } catch (eTop) {
      return false;
    }
    return false;
  }
  /* v519 — le total XP et la progression suivent l'élève d'un terminal à
     l'autre : on relit le cloud à la reconnexion, au retour sur l'onglet et
     toutes les 45 s. Sans cela, un PC resté ouvert ne voyait jamais les gains
     marqués sur le téléphone avant un rechargement complet. */
  var dernierPullCloud = 0;
  var timerPullCloud = 0;
  function rafraichirDepuisCloud(forcer) {
    if (!session || enVolTirer) return;
    if (typeof navigator !== "undefined" && navigator.onLine === false) return;
    if (typeof document !== "undefined" && document.hidden) return;
    var maintenant = Date.now();
    if (!forcer && maintenant - dernierPullCloud < 15000) return;
    dernierPullCloud = maintenant;
    tirer(true);
  }

  function demarrer() {
    if (estSousIframeInterneSTI()) return;
    if (!document.body) { setTimeout(demarrer, 300); return; }
    session = lireSession();
    tirer();
    minuteur = setInterval(function () {
      var nvSess = lireSession();
      if (nvSess && (!session || nvSess.id !== session.id)) {
        session = nvSess;
        tirer();
        return;
      }
      session = nvSess || session;
      pousser(false, false);
    }, 12000);
    window.addEventListener("sti-media-prog-updated", function () {
      if (timerPushMedia) clearTimeout(timerPushMedia);
      timerPushMedia = setTimeout(function () { timerPushMedia = null; pousser(false, false); }, 1800);
    });
    window.addEventListener("pagehide", function () {
      if (timerPushMedia) { clearTimeout(timerPushMedia); timerPushMedia = null; }
      pousserFermetureDeduplique();
    });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { pousserFermetureDeduplique(); return; }
      /* Retour sur l'onglet : les gains faits ailleurs arrivent tout de suite. */
      rafraichirDepuisCloud(false);
    });
    /* Reconnexion internet : on relit le cloud immédiatement. */
    window.addEventListener("online", function () { rafraichirDepuisCloud(true); });
    /* Appareil resté ouvert : rafraîchissement discret toutes les 45 s. */
    if (!timerPullCloud && typeof setInterval === "function") {
      timerPullCloud = setInterval(function () {
        if (document.hidden) return;
        var nvSess = lireSession();
        if (!nvSess) return;
        session = nvSess;
        rafraichirDepuisCloud(false);
      }, 45000);
    }
    window.STIProgressionCloud = window.STIProgressionCloud || {};
    window.STIProgressionCloud.rafraichir = rafraichirDepuisCloud;
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", demarrer); else demarrer();
})();

/* ═══════════════ v394 — Journal d'erreurs élèves (table sti_diagnostics) ═══════════════
   Signale en silence les erreurs JS, les promesses rejetées et les ressources
   introuvables vers Supabase, pour que le professeur les voie dans l'admin.
   Règles de discrétion : rien n'est envoyé sans session élève ; une même erreur
   n'est renvoyée qu'au-delà de 3 jours (par appareil) ; au bout de 2 échecs
   réseau consécutifs (table pas encore créée ?), on arrête sans rien casser. */
(function () {
  "use strict";
  var cfgD = window.STI_AUTH || { URL: "https://vywujxmepvcbgedgmger.supabase.co", CLE: "sb_publishable_FI5FimytONd5VdWK6GfXLA_I6vPTrvn" };
  var CLE_VUES = "sti-diags-vues";
  var MAX_LIGNES = 200, MAX_PAR_PAGE = 8, DELAI_REENVOI = 2592e5;
  var echecs = 0, envoys = 0, enVol = false, sessionD = null;
  function lireSessionD() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i) || "";
        if (k.indexOf("sb-") === 0 && k.indexOf("-auth-token") !== -1) {
          var v = JSON.parse(localStorage.getItem(k) || "null");
          if (v && v.access_token && v.user && v.user.id) return { token: v.access_token, id: v.user.id };
        }
      }
    } catch (e) {}
    return null;
  }
  function vues() { try { return JSON.parse(localStorage.getItem(CLE_VUES) || "{}") || {}; } catch (e) { return {}; } }
  function dejaVue(c) { var m = vues()[c]; return m ? (Date.now() - m) < DELAI_REENVOI : false; }
  function noterVue(c) {
    try {
      var m = vues(), now = Date.now();
      Object.keys(m).forEach(function (k) { if (now - m[k] > 2592e6) delete m[k]; });
      m[c] = now;
      var ks = Object.keys(m);
      if (ks.length > MAX_LIGNES) { ks.sort(function (a, b) { return m[a] - m[b]; }); for (var q = 0; q < ks.length - MAX_LIGNES; q++) delete m[ks[q]]; }
      localStorage.setItem(CLE_VUES, JSON.stringify(m));
    } catch (e) {}
  }
  function pageCourte() { try { return (location.pathname.replace(/^\/STiV2\.0/, "") || "/").slice(0, 180); } catch (e) { return "?"; } }
  function signaler(genre, message, detail) {
    try {
      message = String(message || "erreur inconnue").slice(0, 400);
      if (/chrome-extension|moz-extension|favicon|non-error/i.test(message + (detail || ""))) return;
      if (location.search.indexOf("diags=off") !== -1) return;
      var c = genre + "|" + message + "|" + String(detail || "").slice(0, 120);
      if (dejaVue(c)) return;
      sessionD = sessionD || lireSessionD();
      if (!sessionD || echecs >= 2 || envoys >= MAX_PAR_PAGE) return;
      envoys++; noterVue(c);
      var corps = {
        page: pageCourte(), genre: genre, message: message,
        detail: String(detail || "").slice(0, 1800),
        agent: String(navigator.userAgent || "").slice(0, 300),
        resolution: (screen.width || 0) + "x" + (screen.height || 0),
        en_ligne: navigator.onLine !== false
      };
      enVol = true;
      fetch(cfgD.URL + "/rest/v1/sti_diagnostics", {
        method: "POST",
        headers: { "apikey": cfgD.CLE, "Authorization": "Bearer " + sessionD.token, "Content-Type": "application/json", "Prefer": "return=minimal" },
        body: JSON.stringify(corps)
      }).then(function (r) { if (!r.ok) echecs++; }, function () { echecs++; }).then(function () { enVol = false; });
    } catch (e) {}
  }
  window.addEventListener("error", function (ev) {
    if (enVol) return;
    try {
      var el = ev.target;
      if (el && el !== window && (el.tagName === "SCRIPT" || el.tagName === "IMG" || el.tagName === "LINK" || el.tagName === "VIDEO" || el.tagName === "AUDIO")) {
        signaler("ressource", "Chargement raté : " + el.tagName + " " + String(el.src || el.href || "").replace(location.origin, "").slice(-140), "element=" + String(el.tagName).toLowerCase());
        return;
      }
      var pile = (ev.error && ev.error.stack) ? String(ev.error.stack).slice(0, 1700) : "";
      var src = ev.filename ? String(ev.filename).replace(location.origin, "") + ":" + (ev.lineno || 0) + ":" + (ev.colno || 0) : "";
      signaler("js", ev.message || "Erreur JS sans message", src + (pile ? "\n" + pile : ""));
    } catch (e) {}
  }, true);
  window.addEventListener("unhandledrejection", function (ev) {
    try {
      var r = ev.reason;
      signaler("promise", (r && r.message) ? r.message : String(r || "rejet sans motif").slice(0, 380), r && r.stack ? String(r.stack).slice(0, 1700) : "");
    } catch (e) {}
  });
  function demarrerD() { sessionD = lireSessionD(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", demarrerD); else setTimeout(demarrerD, 1500);
})();
