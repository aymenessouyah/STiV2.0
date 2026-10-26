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
    "quizphp_v1_board"
  ];
  var cfg = window.STI_AUTH || { URL: "https://vywujxmepvcbgedgmger.supabase.co", CLE: "sb_publishable_FI5FimytONd5VdWK6GfXLA_I6vPTrvn" };
  var session = null, dernierHash = "", minuteur = null;

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
      var a = mLoc[c];
      var b = mDist[c];
      if (!a || typeof a !== "object") { out[c] = b; return; }
      if (!b || typeof b !== "object") { out[c] = a; return; }
      var maxPct = Math.max(Number(a.maxPct) || 0, Number(b.maxPct) || 0, Number(a.pct) || 0, Number(b.pct) || 0);
      var done = Boolean(a.done || b.done || maxPct >= 88);
      if (done) maxPct = 100;
      var tsA = Number(a.ts) || 0;
      var tsB = Number(b.ts) || 0;
      var recent = tsA >= tsB ? a : b;
      out[c] = {
        pct: done ? 100 : Math.max(Number(recent.pct) || 0, maxPct > 0 ? 1 : 0),
        maxPct: maxPct,
        sec: done ? 0 : (Number(recent.sec) || Number(a.sec) || Number(b.sec) || 0),
        dur: Math.max(Number(a.dur) || 0, Number(b.dur) || 0),
        done: done,
        ts: Math.max(tsA, tsB)
      };
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
      }
      localStorage.setItem(CLE_SYNC_UID, uid);
    } catch (e) {}
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
        if (k === "sti-mes-scores") {
          try {
            var scLoc = JSON.parse(localStorage.getItem(k) || "{}") || {};
            var scDist = (typeof d[k] === "string" ? JSON.parse(d[k] || "{}") : d[k]) || {};
            var scOut = {};
            function scoreValideSync(v) {
              var s = String(v == null ? "" : v).trim();
              if (!s) return false;
              if (/\/\s*\d+/.test(s) || /%/.test(s)) return true;
              if (/\bpts?\b/i.test(s)) return false;
              var nb = parseFloat(s.replace(",", "."));
              return isFinite(nb) && nb >= 0 && nb <= 20;
            }
            Object.keys(scDist).forEach(function (qz) { if (scoreValideSync(scDist[qz])) scOut[qz] = scDist[qz]; });
            Object.keys(scLoc).forEach(function (qz) { if (scoreValideSync(scLoc[qz])) scOut[qz] = scLoc[qz]; });
            localStorage.setItem(k, JSON.stringify(scOut));
            return;
          } catch (eSc) {}
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
        if (k === "js_quiz_high_score" || k === "js_quiz_total_answered") {
          var vLoc = parseInt(localStorage.getItem(k) || "0", 10) || 0;
          var vDist = parseInt(d[k], 10) || 0;
          localStorage.setItem(k, String(Math.max(vLoc, vDist)));
          return;
        }
        if (k === "quizphp_v1_user") {
          try {
            var uLoc = JSON.parse(localStorage.getItem(k) || "null") || {};
            var uDist = JSON.parse(d[k]) || {};
            uDist.xp = Math.max(Number(uLoc.xp) || 0, Number(uDist.xp) || 0);
            uDist.best = Math.max(Number(uLoc.best) || 0, Number(uDist.best) || 0);
            uDist.streak = Math.max(Number(uLoc.streak) || 0, Number(uDist.streak) || 0);
            localStorage.setItem(k, JSON.stringify(uDist));
            return;
          } catch (ePhp) {}
        }
        if (k === "sqlQuestV3") {
          try {
            var sLoc = JSON.parse(localStorage.getItem(k) || "null");
            var sDist = JSON.parse(d[k]);
            if (sLoc && sDist) {
              sDist.xp = Math.max(Number(sLoc.xp) || 0, Number(sDist.xp) || 0);
              sDist.level = Math.max(Number(sLoc.level) || 1, Number(sDist.level) || 1);
              sDist.totalAnswered = Math.max(Number(sLoc.totalAnswered) || 0, Number(sDist.totalAnswered) || 0);
              sDist.totalCorrect = Math.max(Number(sLoc.totalCorrect) || 0, Number(sDist.totalCorrect) || 0);
              sDist.bestCombo = Math.max(Number(sLoc.bestCombo) || 0, Number(sDist.bestCombo) || 0);
              if (sLoc.best && sDist.best) {
                Object.keys(sLoc.best).forEach(function (m) {
                  sDist.best[m] = Math.max(Number(sLoc.best[m]) || 0, Number(sDist.best[m]) || 0);
                });
              }
              localStorage.setItem(k, JSON.stringify(sDist));
              return;
            }
          } catch (eSql) {}
        }
        localStorage.setItem(k, d[k]);
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
  function tirer() {
    if (!session) { pastille("💾 Progression : cet appareil seulement", "#fff3e0"); return; }
    isolerComptePartageSiBesoin(session.id);
    fetch(cfg.URL + "/rest/v1/sti_progressions?user_id=eq." + encodeURIComponent(session.id) + "&select=donnees,maj", { headers: entetes() })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (lignes) {
        if (lignes && lignes.length) {
          var distant = new Date(lignes[0].maj).getTime() || 0;
          var local = parseInt(localStorage.getItem(CLE_SYNC_MAJ) || "0", 10) || 0;
          if (lignes[0].donnees && (distant > local || !local)) {
            var avantHash = hash(collecter());
            appliquer(lignes[0].donnees);
            localStorage.setItem(CLE_SYNC_MAJ, String(distant));
            var apresHash = hash(collecter());
            dernierHash = apresHash;
            pastille("☁️ Progression restaurée depuis le cloud", "#e8f5e9");
            if (avantHash && avantHash !== apresHash) {
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
          } else if (lignes[0].donnees && lignes[0].donnees["sti-media-prog-v1"]) {
            /* Même si local >= distant, fusionner de façon monotone toute progression média distante manquante */
            try {
              var fusionM = fusionnerMediaProgMonotone(localStorage.getItem("sti-media-prog-v1"), lignes[0].donnees["sti-media-prog-v1"]);
              if (fusionM !== localStorage.getItem("sti-media-prog-v1")) {
                localStorage.setItem("sti-media-prog-v1", fusionM);
              }
            } catch (eFm) {}
          }
        }
        pastille("☁️ Progression synchronisée (cloud)", "#e8f5e9"); pousser(true);
      })
      .catch(function () { pastille("💾 Progression : cet appareil seulement", "#fff3e0"); });
  }
  function pousser(force, enFermeture) {
    session = session || lireSession();
    if (!session) return;
    isolerComptePartageSiBesoin(session.id);
    var d = collecter(), h = hash(d);
    if (!force && h === dernierHash) return;
    dernierHash = h;
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
  function demarrer() {
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
    }, 5000);
    window.addEventListener("sti-media-prog-updated", function () {
      if (timerPushMedia) clearTimeout(timerPushMedia);
      timerPushMedia = setTimeout(function () { timerPushMedia = null; pousser(false, false); }, 1800);
    });
    window.addEventListener("pagehide", function () {
      if (timerPushMedia) { clearTimeout(timerPushMedia); timerPushMedia = null; }
      pousser(false, true);
    });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) pousser(false, true);
    });
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
