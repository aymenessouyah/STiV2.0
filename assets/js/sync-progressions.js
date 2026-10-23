/* ═══════════════ STI SYNC (v255) — sauvegarde cloud des progressions ═══════════════
   Principe : les progressions (tableau de bord, quiz…) vivent dans localStorage.
   Si l'élève est connecté (session Supabase), elles sont aussi copiées dans la
   table cloud « sti_progressions » : il les retrouve sur tous ses appareils.
   Sans session ou sans table activée : fonctionnement local inchangé. */
(function () {
  "use strict";
  var CLE_SYNC_MAJ = "sti-sync-maj";
  var EXCLUES = ["sti-session-cache", "sti-admin-gold", "sti-gold", CLE_SYNC_MAJ];
  var cfg = window.STI_AUTH || { URL: "https://vywujxmepvcbgedgmger.supabase.co", CLE: "sb_publishable_FI5FimytONd5VdWK6GfXLA_I6vPTrvn" };
  var session = null, dernierHash = "", minuteur = null;

  function lireSession() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i) || "";
        if (k.indexOf("sb-") === 0 && k.indexOf("-auth-token") !== -1) {
          var v = JSON.parse(localStorage.getItem(k) || "null");
          if (v && v.access_token && v.user && v.user.id) return { token: v.access_token, id: v.user.id, email: v.user.email || "" };
        }
      }
    } catch (e) {}
    return null;
  }
  function collecter() {
    var d = {};
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i) || "";
      if (k.indexOf("sti-") === 0 && EXCLUES.indexOf(k) === -1) { try { d[k] = localStorage.getItem(k); } catch (e) {} }
    }
    return d;
  }
  function hash(d) { try { return JSON.stringify(d).length + ":" + Object.keys(d).sort().join(","); } catch (e) { return ""; } }
  function appliquer(d) {
    try { Object.keys(d || {}).forEach(function (k) { if (k.indexOf("sti-") === 0 && EXCLUES.indexOf(k) === -1 && d[k] != null) localStorage.setItem(k, d[k]); }); } catch (e) {}
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
    fetch(cfg.URL + "/rest/v1/sti_progressions?user_id=eq." + encodeURIComponent(session.id) + "&select=donnees,maj", { headers: entetes() })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (lignes) {
        if (lignes && lignes.length) {
          var distant = new Date(lignes[0].maj).getTime() || 0;
          var local = parseInt(localStorage.getItem(CLE_SYNC_MAJ) || "0", 10) || 0;
          if (distant > local && lignes[0].donnees) {
            appliquer(lignes[0].donnees);
            localStorage.setItem(CLE_SYNC_MAJ, String(distant));
            dernierHash = hash(collecter());
            pastille("☁️ Progression restaurée depuis le cloud", "#e8f5e9");
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
          }
        }
        pastille("☁️ Progression synchronisée (cloud)", "#e8f5e9"); pousser(true);
      })
      .catch(function () { pastille("💾 Progression : cet appareil seulement", "#fff3e0"); });
  }
  function pousser(force) {
    if (!session) return;
    var d = collecter(), h = hash(d);
    if (!force && h === dernierHash) return;
    dernierHash = h;
    var maj = new Date().toISOString();
    fetch(cfg.URL + "/rest/v1/sti_progressions", {
      method: "POST",
      headers: (function () { var e = entetes(); e["Prefer"] = "resolution=merge-duplicates"; return e; })(),
      body: JSON.stringify({ user_id: session.id, email: session.email, donnees: d, maj: maj })
    }).then(function (r) {
      if (r.ok) { localStorage.setItem(CLE_SYNC_MAJ, String(new Date(maj).getTime())); pastille("☁️ Progression synchronisée (cloud)", "#e8f5e9"); }
      else pastille("💾 Progression : cet appareil seulement", "#fff3e0");
    }).catch(function () { pastille("💾 Progression : cet appareil seulement", "#fff3e0"); });
  }
  function demarrer() {
    if (!document.body) { setTimeout(demarrer, 300); return; }
    session = lireSession();
    tirer();
    minuteur = setInterval(function () { session = session || lireSession(); pousser(false); }, 5000);
    window.addEventListener("beforeunload", function () { pousser(true); });
    document.addEventListener("visibilitychange", function () { if (document.hidden) pousser(true); });
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
