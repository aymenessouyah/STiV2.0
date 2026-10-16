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
          if (distant > local && lignes[0].donnees) { appliquer(lignes[0].donnees); localStorage.setItem(CLE_SYNC_MAJ, String(distant)); dernierHash = hash(collecter()); pastille("☁️ Progression restaurée depuis le cloud", "#e8f5e9"); return; }
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
