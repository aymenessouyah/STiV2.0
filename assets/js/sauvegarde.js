/* ═══ STI SAUVEGARDE (v258) — Export complet admin en un fichier ═══
   Exporte : tables cloud accessibles (profiles, acces, sti_progressions)
   + données locales sti-* → un seul JSON téléchargeable.
   Restauration : réimporte les données LOCALES depuis un fichier exporté. */
(function () {
  "use strict";
  var cfg = window.STI_AUTH || { URL: "https://vywujxmepvcbgedgmger.supabase.co", CLE: "sb_publishable_FI5FimytONd5VdWK6GfXLA_I6vPTrvn" };
  function tokenAdmin() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i) || "";
        if (k.indexOf("sb-") === 0 && k.indexOf("-auth-token") !== -1) {
          var v = JSON.parse(localStorage.getItem(k) || "null");
          if (v && v.access_token) return v.access_token;
        }
      }
    } catch (e) {}
    return null;
  }
  function locales() {
    var d = {};
    for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i) || ""; if (k.indexOf("sti-") === 0) { try { d[k] = localStorage.getItem(k); } catch (e) {} } }
    return d;
  }
  function telecharger(nom, obj) {
    var blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = nom;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
  }
  function exporter(zone) {
    var token = tokenAdmin();
    if (!token) { zone.innerHTML = "<p>⚠️ Connectez-vous en administrateur d'abord.</p>"; return; }
    zone.innerHTML = "<p>⏳ Collecte des données…</p>";
    var tables = ["profiles", "acces", "sti_progressions"], sortie = { genere_le: new Date().toISOString(), plateforme: "STI By AE V2.0", cloud: {}, erreurs: {}, local: locales() };
    var chaines = tables.map(function (t) {
      return fetch(cfg.URL + "/rest/v1/" + t + "?select=*", { headers: { "apikey": cfg.CLE, "Authorization": "Bearer " + token } })
        .then(function (r) { return r.ok ? r.json() : Promise.reject(t + " HTTP " + r.status); })
        .then(function (lignes) { sortie.cloud[t] = lignes; })
        .catch(function (e) { sortie.erreurs[t] = String(e); sortie.cloud[t] = null; });
    });
    Promise.all(chaines).then(function () {
      var nom = "sti-sauvegarde-" + new Date().toISOString().slice(0, 10) + ".json";
      telecharger(nom, sortie);
      var ok = tables.filter(function (t) { return sortie.cloud[t]; }).map(function (t) { return t + " (" + sortie.cloud[t].length + " lignes)"; });
      var ko = Object.keys(sortie.erreurs);
      zone.innerHTML = "<p>✅ <b>" + nom + "</b> téléchargé.<br>Cloud exporté : " + (ok.join(" · ") || "aucune table") + (ko.length ? "<br>⚠️ Non exportées (droits insuffisants ou table absente) : " + ko.join(", ") + " — pensez à la policy admin." : "") + "<br>Données locales incluses : " + Object.keys(sortie.local).length + " clés.</p>";
    });
  }
  function importer(fichier, zone) {
    var lecteur = new FileReader();
    lecteur.onload = function () {
      try {
        var data = JSON.parse(lecteur.result);
        var loc = data.local || {};
        var n = 0;
        Object.keys(loc).forEach(function (k) { if (k.indexOf("sti-") === 0) { localStorage.setItem(k, loc[k]); n++; } });
        zone.innerHTML = "<p>✅ " + n + " clé(s) locale(s) restaurée(s). Rechargement…</p>";
        setTimeout(function () { location.reload(); }, 900);
      } catch (e) { zone.innerHTML = "<p>⚠️ Fichier illisible : " + e.message + "</p>"; }
    };
    lecteur.readAsText(fichier);
  }
  function panneau() {
    if (document.getElementById("sti-sauvegarde")) return;
    var ov = document.createElement("div"); ov.id = "sti-sauvegarde";
    ov.setAttribute("style", "position:fixed;inset:auto 4% 4% 4%;z-index:100000;background:#fffdf7;border:3px solid #1a1a2e;border-radius:18px;box-shadow:8px 8px 0 #1a1a2e;padding:22px 26px;font-family:system-ui,sans-serif;color:#1a1a2e;");
    ov.innerHTML = '<button type="button" id="sti-sauv-fermer" style="float:right;padding:8px 14px;border-radius:10px;border:2px solid #1a1a2e;background:#fff;font-weight:800;cursor:pointer">✕ Fermer</button>'
      + '<h2 style="margin-top:0">💾 Sauvegarde complète de la plateforme</h2>'
      + '<p>Exporte en <b>un seul fichier JSON</b> : les tables cloud accessibles (profiles, acces, progressions) et les données locales de cet appareil. À conserver précieusement (disque externe, cloud personnel…).</p>'
      + '<p><button type="button" id="sti-sauv-export" style="padding:11px 18px;border-radius:10px;border:2.5px solid #1a1a2e;background:linear-gradient(120deg,#f4511e,#d81b60);color:#fff;font-weight:800;cursor:pointer">⬇️ Exporter la sauvegarde complète</button></p>'
      + '<p>Restaurer les données locales depuis un fichier : <input type="file" id="sti-sauv-fichier" accept=".json,application/json"></p>'
      + '<div id="sti-sauv-zone"></div>';
    document.body.appendChild(ov);
    document.getElementById("sti-sauv-fermer").addEventListener("click", function () { ov.remove(); });
    document.getElementById("sti-sauv-export").addEventListener("click", function () { exporter(document.getElementById("sti-sauv-zone")); });
    document.getElementById("sti-sauv-fichier").addEventListener("change", function () { if (this.files && this.files[0]) importer(this.files[0], document.getElementById("sti-sauv-zone")); });
  }
  function bouton() {
    if (document.getElementById("sti-btn-sauvegarde")) return;
    var b = document.createElement("button");
    b.id = "sti-btn-sauvegarde"; b.type = "button"; b.textContent = "💾 Sauvegarde complète";
    b.setAttribute("style", "position:fixed;left:14px;bottom:114px;z-index:99999;padding:11px 16px;border-radius:999px;border:3px solid #1a1a2e;background:#2e7d32;color:#fff;font-weight:800;font-size:14px;cursor:pointer;box-shadow:4px 4px 0 #1a1a2e;");
    b.addEventListener("click", panneau);
    document.body.appendChild(b);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bouton); else bouton();
})();
