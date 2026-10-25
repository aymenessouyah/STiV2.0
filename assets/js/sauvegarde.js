/* ═══ STI SAUVEGARDE (v463) — Export paginé complet admin en un fichier ═══
   Exporte : toutes les tables cloud accessibles (profiles, acces, sti_progressions,
   sti_quiz_parties, sti_quiz_reponses, sti_quiz_vus, sti_observations, labo_devices)
   avec pagination par tranches de 1 000 lignes + données locales sti-* → JSON unique. */
(function () {
  "use strict";
  var cfg = window.STI_AUTH || { URL: "https://vywujxmepvcbgedgmger.supabase.co", CLE: "sb_publishable_FI5FimytONd5VdWK6GfXLA_I6vPTrvn" };
  var NON_RESTAURABLES = { "sti-cred": 1, "sti-session-cache": 1, "sti-admin-gold": 1, "sti-gold": 1, "sti-offline": 1 };

  function ech(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function tokenAdmin() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i) || "";
        if (k.indexOf("sb-") === 0 && k.indexOf("-auth-token") !== -1) {
          var v = JSON.parse(localStorage.getItem(k) || "null");
          if (v && v.access_token) return v.access_token;
          if (v && v.currentSession && v.currentSession.access_token) return v.currentSession.access_token;
          if (v && v.session && v.session.access_token) return v.session.access_token;
        }
      }
    } catch (e) {}
    return null;
  }
  function locales() {
    var d = {};
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i) || "";
      if (k.indexOf("sti-") === 0 && !NON_RESTAURABLES[k]) {
        try { d[k] = localStorage.getItem(k); } catch (e) {}
      }
    }
    return d;
  }
  function telecharger(nom, obj) {
    var blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = nom;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
  }
  function lireTablePaginee(table, token, maxLignes) {
    var tout = [], pas = 1000, max = maxLignes || 30000;
    function pageSuiv(de) {
      return fetch(cfg.URL + "/rest/v1/" + table + "?select=*", {
        headers: {
          "apikey": cfg.CLE,
          "Authorization": "Bearer " + token,
          "Range-Unit": "items",
          "Range": de + "-" + (de + pas - 1)
        }
      }).then(function (r) {
        if (!r.ok && r.status !== 206) return Promise.reject(table + " HTTP " + r.status);
        return r.json();
      }).then(function (lignes) {
        var lot = Array.isArray(lignes) ? lignes : [];
        tout = tout.concat(lot);
        if (lot.length < pas || tout.length >= max) return tout;
        return pageSuiv(de + pas);
      });
    }
    return pageSuiv(0);
  }
  function exporter(zone) {
    var token = tokenAdmin();
    if (!token) { zone.innerHTML = "<p>⚠️ Connectez-vous en administrateur d'abord.</p>"; return; }
    zone.innerHTML = "<p>⏳ Collecte paginée de toutes les tables Supabase…</p>";
    var tables = [
      "profiles",
      "acces",
      "sti_progressions",
      "sti_quiz_parties",
      "sti_quiz_reponses",
      "sti_quiz_vus",
      "sti_observations",
      "labo_devices"
    ];
    var sortie = { genere_le: new Date().toISOString(), plateforme: "STI By AE V2.0", cloud: {}, erreurs: {}, local: locales() };
    var chaines = tables.map(function (t) {
      return lireTablePaginee(t, token, 30000)
        .then(function (lignes) {
          if (t === "labo_devices" && (!lignes || !lignes.length)) {
            return fetch(cfg.URL + "/rest/v1/rpc/admin_labo_devices_list", {
              method: "POST",
              headers: { "apikey": cfg.CLE, "Authorization": "Bearer " + token, "Content-Type": "application/json" },
              body: "{}"
            }).then(function (rRpc) { return rRpc.ok ? rRpc.json() : []; })
              .then(function (dRpc) {
                var arrRpc = Array.isArray(dRpc) ? dRpc : (dRpc && Array.isArray(dRpc.devices) ? dRpc.devices : []);
                sortie.cloud[t] = arrRpc.length ? arrRpc : lignes;
              }).catch(function () { sortie.cloud[t] = lignes; });
          }
          sortie.cloud[t] = lignes;
        })
        .catch(function (e) { sortie.erreurs[t] = String(e); sortie.cloud[t] = null; });
    });
    Promise.all(chaines).then(function () {
      var nom = "sti-sauvegarde-" + new Date().toISOString().slice(0, 10) + ".json";
      telecharger(nom, sortie);
      var ok = tables.filter(function (t) { return sortie.cloud[t]; }).map(function (t) { return ech(t) + " (" + sortie.cloud[t].length + " lignes)"; });
      var ko = Object.keys(sortie.erreurs).map(ech);
      zone.innerHTML = "<p>✅ <b>" + ech(nom) + "</b> téléchargé.<br>Cloud exporté : " + (ok.join(" · ") || "aucune table") + (ko.length ? "<br>⚠️ Non exportées : " + ko.join(", ") : "") + "<br>Données locales incluses : " + Object.keys(sortie.local).length + " clés.</p>";
    });
  }
  function importer(fichier, zone) {
    var lecteur = new FileReader();
    lecteur.onload = function () {
      try {
        var data = JSON.parse(lecteur.result);
        var loc = data.local || {};
        var n = 0;
        Object.keys(loc).forEach(function (k) {
          if (k.indexOf("sti-") === 0 && !NON_RESTAURABLES[k]) {
            localStorage.setItem(k, loc[k]);
            n++;
          }
        });
        zone.innerHTML = "<p>✅ " + n + " clé(s) locale(s) restaurée(s). Rechargement…</p>";
        setTimeout(function () { location.reload(); }, 900);
      } catch (e) { zone.innerHTML = "<p>⚠️ Fichier illisible : " + ech(e && e.message) + "</p>"; }
    };
    lecteur.readAsText(fichier);
  }
  function panneau() {
    var exist = document.getElementById("sti-sauvegarde");
    if (exist) { exist.remove(); return; }
    var ov = document.createElement("div"); ov.id = "sti-sauvegarde";
    ov.setAttribute("role", "dialog");
    ov.setAttribute("aria-modal", "true");
    ov.setAttribute("style", 'position:fixed;inset:auto 4% 4% 4%;z-index:100000;background:#fffdf7;border:3px solid #1a1a2e;border-radius:18px;box-shadow:8px 8px 0 #1a1a2e;padding:22px 26px;font-family:"Comic Sans MS","Comic Sans","Comic Neue",cursive,sans-serif;color:#1a1a2e;');
    ov.innerHTML = '<button type="button" id="sti-sauv-fermer" style="float:right;padding:8px 14px;border-radius:10px;border:2px solid #1a1a2e;background:#fff;font-weight:800;cursor:pointer">✕ Fermer</button>'
      + '<h2 style="margin-top:0">💾 Sauvegarde complète de la plateforme</h2>'
      + '<p>Exporte en <b>un seul fichier JSON paginé</b> : toutes les tables cloud accessibles (profils, connexions, progressions, quiz, observations, postes Labo 3) et les préférences locales.</p>'
      + '<p><button type="button" id="sti-sauv-export" style="padding:11px 18px;border-radius:10px;border:2.5px solid #1a1a2e;background:linear-gradient(120deg,#15803d,#0f766e);color:#fff;font-weight:800;cursor:pointer">⬇️ Exporter la sauvegarde complète</button></p>'
      + '<p>Restaurer les préférences locales depuis un fichier : <input type="file" id="sti-sauv-fichier" accept=".json,application/json"></p>'
      + '<div id="sti-sauv-zone"></div>';
    document.body.appendChild(ov);
    function fermer() { if (ov.parentNode) ov.remove(); document.removeEventListener("keydown", onEsc); }
    function onEsc(ev) { if (ev.key === "Escape") fermer(); }
    document.addEventListener("keydown", onEsc);
    document.getElementById("sti-sauv-fermer").addEventListener("click", fermer);
    document.getElementById("sti-sauv-export").addEventListener("click", function () { exporter(document.getElementById("sti-sauv-zone")); });
    document.getElementById("sti-sauv-fichier").addEventListener("change", function () { if (this.files && this.files[0]) importer(this.files[0], document.getElementById("sti-sauv-zone")); });
  }
  function bouton() {
    if (document.getElementById("sti-btn-sauvegarde")) return;
    var b = document.createElement("button");
    b.id = "sti-btn-sauvegarde"; b.type = "button"; b.textContent = "💾 Sauvegarde complète";
    b.setAttribute("style", "position:fixed;left:14px;bottom:114px;z-index:99999;padding:11px 16px;border-radius:999px;border:3px solid #1a1a2e;background:#15803d;color:#fff;font-weight:800;font-size:14px;cursor:pointer;box-shadow:4px 4px 0 #1a1a2e;");
    b.addEventListener("click", panneau);
    document.body.appendChild(b);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bouton); else bouton();
})();
