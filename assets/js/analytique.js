/* ═══ STI ANALYTIQUE (v257) — Agrégation des progressions cloud (admin) ═══
   Lit la table Supabase sti_progressions (connexion admin requise + policy
   « admin lit tout » : voir documents/sql/sti_progressions-admin.sql). */
(function () {
  "use strict";
  var cfg = window.STI_AUTH || { URL: "https://vywujxmepvcbgedgmger.supabase.co", CLE: "sb_publishable_FI5FimytONd5VdWK6GfXLA_I6vPTrvn" };
  function sessionAdmin() {
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
  function barre(pct) { return '<div style="background:#e8e4da;border-radius:999px;height:14px;min-width:140px;overflow:hidden"><div style="height:100%;width:' + pct + '%;background:' + (pct >= 70 ? "#2e7d32" : pct >= 40 ? "#ef6c00" : "#c62828") + '"></div></div>'; }
  function analyser(lignes) {
    var notions = {}, medias = {}, eleves = [];
    lignes.forEach(function (l) {
      var d = l.donnees || {}, fait = 0, tot = 0;
      try {
        var bord = JSON.parse(d["sti-bord-classe-v1"] || "{}");
        Object.keys(bord).forEach(function (k) { tot++; notions[k] = notions[k] || [0, 0]; notions[k][1]++; if (bord[k]) { notions[k][0]++; fait++; } });
      } catch (e) {}
      try {
        var mp = JSON.parse(d["sti-media-prog-v1"] || "{}");
        Object.keys(mp).forEach(function (k) { var e = mp[k] || {}; medias[k] = medias[k] || [0, 0]; medias[k][0] += (e.maxPct || e.pct || 0); medias[k][1]++; });
      } catch (e) {}
      eleves.push({ email: l.email || "(sans e-mail)", pct: tot ? Math.round(fait * 100 / tot) : 0, maj: l.maj });
    });
    function tableau(titre, obj, suffixe) {
      var cles = Object.keys(obj).sort(function (a, b) { return (obj[a][0] / Math.max(1, obj[a][1])) - (obj[b][0] / Math.max(1, obj[b][1])); });
      if (!cles.length) return "<h3>" + titre + "</h3><p>Aucune donnée pour le moment.</p>";
      var h = "<h3>" + titre + "</h3><table style='border-collapse:collapse;width:100%'><tr><th style='text-align:left;border-bottom:2px solid #1a1a2e;padding:6px'>Élément</th><th style='border-bottom:2px solid #1a1a2e;padding:6px'>Taux</th><th style='border-bottom:2px solid #1a1a2e;padding:6px'>Détail</th></tr>";
      cles.forEach(function (k) {
        var pct = Math.round(obj[k][0] * 100 / Math.max(1, obj[k][1]));
        h += "<tr><td style='padding:6px;border-bottom:1px solid #ddd'>" + k + "</td><td style='padding:6px;border-bottom:1px solid #ddd'>" + barre(pct) + "</td><td style='padding:6px;border-bottom:1px solid #ddd'><b>" + pct + " %</b> " + suffixe(obj[k]) + "</td></tr>";
      });
      return h + "</table>";
    }
    var html = "<p><b>" + lignes.length + " élève(s)</b> ont une progression synchronisée dans le cloud.</p>";
    html += tableau("🧭 Notions du tableau de bord — des moins acquises (à retravailler) aux plus acquises", notions, function (v) { return "(" + v[0] + "/" + v[1] + " élèves)"; });
    html += tableau("🎬 Vidéos — avancement moyen", medias, function (v) { return "(moyenne sur " + v[1] + " élève(s))"; });
    html += "<h3>👥 Par élève (tableau de bord SQL)</h3><table style='border-collapse:collapse;width:100%'><tr><th style='text-align:left;border-bottom:2px solid #1a1a2e;padding:6px'>Élève</th><th style='border-bottom:2px solid #1a1a2e;padding:6px'>Progression</th><th style='border-bottom:2px solid #1a1a2e;padding:6px'>Dernière synchro</th></tr>";
    eleves.sort(function (a, b) { return a.pct - b.pct; }).forEach(function (e) {
      html += "<tr><td style='padding:6px;border-bottom:1px solid #ddd'>" + e.email + "</td><td style='padding:6px;border-bottom:1px solid #ddd'>" + barre(e.pct) + "</td><td style='padding:6px;border-bottom:1px solid #ddd'><b>" + e.pct + " %</b> · " + (e.maj ? new Date(e.maj).toLocaleString("fr-FR") : "—") + "</td></tr>";
    });
    return html + "</table>";
  }
  function panneau() {
    if (document.getElementById("sti-analytique")) return;
    var ov = document.createElement("div"); ov.id = "sti-analytique";
    ov.setAttribute("style", "position:fixed;inset:4% 4%;z-index:100000;background:#fffdf7;border:3px solid #1a1a2e;border-radius:18px;box-shadow:8px 8px 0 #1a1a2e;padding:22px 26px;overflow:auto;font-family:system-ui,sans-serif;color:#1a1a2e;");
    ov.innerHTML = '<button type="button" id="sti-ana-fermer" style="float:right;padding:8px 14px;border-radius:10px;border:2px solid #1a1a2e;background:#fff;font-weight:800;cursor:pointer">✕ Fermer</button>'
      + '<h2 style="margin-top:0">📊 Analytique des progressions (cloud)</h2><div id="sti-ana-corps"><p>⏳ Chargement des progressions des élèves…</p></div>';
    document.body.appendChild(ov);
    document.getElementById("sti-ana-fermer").addEventListener("click", function () { ov.remove(); });
    var token = sessionAdmin(), corps = document.getElementById("sti-ana-corps");
    if (!token) { corps.innerHTML = "<p>⚠️ Aucune session Supabase détectée : connectez-vous en administrateur puis rouvrez ce panneau.</p>"; return; }
    fetch(cfg.URL + "/rest/v1/sti_progressions?select=email,donnees,maj&order=maj.desc", { headers: { "apikey": cfg.CLE, "Authorization": "Bearer " + token } })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (lignes) {
        if (!lignes.length) { corps.innerHTML = "<p>ℹ️ Aucune ligne lisible. Deux causes possibles : aucun élève ne s'est encore synchronisé, <b>ou</b> la policy admin n'est pas installée — exécutez <code>documents/sql/sti_progressions-admin.sql</code> dans Supabase (SQL Editor).</p>"; return; }
        corps.innerHTML = analyser(lignes);
      })
      .catch(function (st) { corps.innerHTML = "<p>⚠️ Lecture refusée (HTTP " + st + "). Exécutez <code>documents/sql/sti_progressions-admin.sql</code> dans Supabase pour autoriser la lecture admin, puis réessayez.</p>"; });
  }
  function bouton() {
    if (document.getElementById("sti-btn-analytique")) return;
    var b = document.createElement("button");
    b.id = "sti-btn-analytique"; b.type = "button"; b.textContent = "📊 Analytique progressions";
    b.setAttribute("style", "position:fixed;left:14px;bottom:64px;z-index:99999;padding:11px 16px;border-radius:999px;border:3px solid #1a1a2e;background:#1565c0;color:#fff;font-weight:800;font-size:14px;cursor:pointer;box-shadow:4px 4px 0 #1a1a2e;");
    b.addEventListener("click", panneau);
    document.body.appendChild(b);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bouton); else bouton();
})();
