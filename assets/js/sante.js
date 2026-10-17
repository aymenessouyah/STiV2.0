/* ═══ STI SANTÉ DU SITE (v259) — Vérificateur automatique dans l'admin ═══
   Teste : pages clés, vidéos MP4 (Range 0-0), bases .sql, archives .zip/.pdf,
   fiches énoncés A4 et API Supabase (profiles, acces, sti_progressions). */
(function () {
  "use strict";
  var cfg = window.STI_AUTH || { URL: "https://vywujxmepvcbgedgmger.supabase.co", CLE: "sb_publishable_FI5FimytONd5VdWK6GfXLA_I6vPTrvn" };
  var ITEMS = [
    { cat: "Pages", nom: "Accueil", url: "index.html" },
    { cat: "Pages", nom: "Portail", url: "portail.html" },
    { cat: "Pages", nom: "Nouveautés + JSON", url: "assets/data/nouveautes.json" },
    { cat: "Pages", nom: "Cours HTML5", url: "cours/html5.html" },
    { cat: "Pages", nom: "Cours CSS3", url: "cours/css3.html" },
    { cat: "Pages", nom: "Cours JavaScript", url: "cours/javascript.html" },
    { cat: "Pages", nom: "Cours PHP (synthèses 1 & 2)", url: "cours/php.html" },
    { cat: "Pages", nom: "Cours SQL (Partie 4 Bac)", url: "cours/sql.html" },
    { cat: "Fiches A4", nom: "Énoncé Série 4 (ETUDIANT_BD)", url: "documents/enonces/enonce-serie4-a4.html" },
    { cat: "Fiches A4", nom: "Énoncé Série 5 (Gesthotel)", url: "documents/enonces/enonce-serie5-a4.html" },
    { cat: "Bases & ZIP", nom: "BD ecole.sql (synthèse 1)", url: "documents/bd/ecole.sql" },
    { cat: "Bases & ZIP", nom: "BD station.sql (synthèse 2)", url: "documents/bd/station.sql" },
    { cat: "Bases & ZIP", nom: "Archive gestion-eleves.zip", url: "documents/complet/gestion-eleves.zip", range: true },
    { cat: "Bases & ZIP", nom: "Archive recharge-ve.zip", url: "documents/complet/recharge-ve.zip", range: true },
    { cat: "Bases & ZIP", nom: "Mémento synthèse PDF", url: "documents/complet/fiche-memento-synthese.pdf", range: true },
    { cat: "Vidéos", nom: "PHP — Synthèse n°1", url: "assets/videos/php-synthese.mp4", range: true },
    { cat: "Vidéos", nom: "PHP — Cours", url: "assets/videos/php-cours.mp4", range: true },
    { cat: "Vidéos", nom: "SQL — Cours", url: "assets/videos/sql-cours.mp4", range: true },
    { cat: "Vidéos", nom: "SQL — Série 1", url: "assets/videos/sql-serie1.mp4", range: true },
    { cat: "Vidéos", nom: "SQL — Série 2", url: "assets/videos/sql-serie2.mp4", range: true },
    { cat: "Vidéos", nom: "SQL — Série 3", url: "assets/videos/sql-serie3.mp4", range: true },
    { cat: "Vidéos", nom: "SQL — Série 4 (ETUDIANT_BD)", url: "assets/videos/sql-serie4.mp4", range: true },
    { cat: "Vidéos", nom: "SQL — Série 5 (Gesthotel)", url: "assets/videos/sql-serie5.mp4", range: true },
    { cat: "Vidéos", nom: "SQL — Série 6", url: "assets/videos/sql-serie6.mp4", range: true },
    { cat: "Vidéos", nom: "HTML5 — Cours", url: "assets/videos/html5-cours.mp4", range: true },
    { cat: "Vidéos", nom: "CSS3 — Cours", url: "assets/videos/css3-cours.mp4", range: true },
    { cat: "Vidéos", nom: "JavaScript — Cours", url: "assets/videos/javascript-cours.mp4", range: true }
  ];
  function token() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i) || "";
        if (k.indexOf("sb-") === 0 && k.indexOf("-auth-token") !== -1) {
          var v = JSON.parse(localStorage.getItem(k) || "null");
          if (v && v.access_token) return v.access_token;
        }
      }
    } catch (e) {}
    return cfg.CLE;
  }
  function testerUn(it) {
    var t0 = Date.now();
    var opts = it.headers ? { method: "GET", headers: it.headers, cache: "no-store" }
      : (it.range ? { method: "GET", headers: { "Range": "bytes=0-0" }, cache: "no-store" } : { method: "HEAD", cache: "no-store" });
    return fetch(it.url, opts).then(function (r) {
      var ok = (r.status >= 200 && r.status < 300) || r.status === 206;
      return { it: it, ok: ok, code: r.status, ms: Date.now() - t0 };
    }).catch(function (e) {
      return { it: it, ok: false, code: String(e.message || e), ms: Date.now() - t0 };
    });
  }
  function lancer(zone) {
    zone.innerHTML = "<p>⏳ Vérification en cours…</p>";
    var tk = token();
    var hdr = { "apikey": cfg.CLE, "Authorization": "Bearer " + tk };
    var tous = ITEMS.concat([
      { cat: "Supabase", nom: "Table profiles", url: cfg.URL + "/rest/v1/profiles?select=id&limit=1", headers: hdr },
      { cat: "Supabase", nom: "Table acces", url: cfg.URL + "/rest/v1/acces?select=id&limit=1", headers: hdr },
      { cat: "Supabase", nom: "Table sti_progressions", url: cfg.URL + "/rest/v1/sti_progressions?select=user_id&limit=1", headers: hdr }
    ]);
    Promise.all(tous.map(testerUn)).then(function (res) {
      var nbOk = res.filter(function (x) { return x.ok; }).length;
      var nbKo = res.length - nbOk;
      var resume = '<p style="padding:12px 16px;border-radius:12px;border:2.5px solid #1a1a2e;background:' + (nbKo ? '#ffebee' : '#e8f5e9') + ';font-weight:800;">'
        + (nbKo === 0 ? '✅ Tout est opérationnel : ' + nbOk + ' / ' + res.length + ' contrôles réussis — prêt pour la séance !'
                      : '⚠️ ' + nbKo + ' anomalie(s) détectée(s) sur ' + res.length + ' contrôles (' + nbOk + ' OK)') + '</p>';
      var lignes = res.map(function (r) {
        var badge = r.ok ? '<span style="color:#2e7d32;font-weight:900">✅ OK (' + r.code + ')</span>'
                         : '<span style="color:#c62828;font-weight:900">❌ ÉCHEC (' + r.code + ')</span>';
        return '<tr style="background:' + (r.ok ? 'transparent' : '#ffebee') + '"><td style="padding:6px;border-bottom:1px solid #ddd;font-weight:700">' + r.it.cat + '</td>'
          + '<td style="padding:6px;border-bottom:1px solid #ddd">' + r.it.nom + '</td>'
          + '<td style="padding:6px;border-bottom:1px solid #ddd">' + badge + '</td>'
          + '<td style="padding:6px;border-bottom:1px solid #ddd">' + r.ms + ' ms</td></tr>';
      }).join("");
      zone.innerHTML = resume + '<table style="width:100%;border-collapse:collapse;font-size:.92rem"><thead><tr style="background:#f3e9d7"><th style="padding:7px;text-align:left">Catégorie</th><th style="padding:7px;text-align:left">Ressource</th><th style="padding:7px;text-align:left">État</th><th style="padding:7px;text-align:left">Délai</th></tr></thead><tbody>' + lignes + '</tbody></table>';
    });
  }
  function ouvrir() {
    if (document.getElementById("sti-sante")) return;
    var ov = document.createElement("div"); ov.id = "sti-sante";
    ov.setAttribute("style", "position:fixed;inset:3% 4%;z-index:100000;background:#fffdf7;border:3px solid #1a1a2e;border-radius:18px;box-shadow:8px 8px 0 #1a1a2e;padding:22px 26px;overflow:auto;font-family:system-ui,sans-serif;color:#1a1a2e;");
    ov.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">'
      + '<h2 style="margin:0">🩺 Vérificateur de santé du site</h2>'
      + '<div><button type="button" id="sti-sante-relancer" style="padding:8px 14px;border-radius:10px;border:2px solid #1a1a2e;background:#1565c0;color:#fff;font-weight:800;cursor:pointer">🔄 Relancer les tests</button> '
      + '<button type="button" id="sti-sante-fermer" style="padding:8px 14px;border-radius:10px;border:2px solid #1a1a2e;background:#fff;font-weight:800;cursor:pointer">✕ Fermer</button></div></div>'
      + '<p>Teste en direct les pages de cours, les 12 vidéos, les bases <code>.sql</code>, les archives <code>.zip</code>, les fiches A4 et les 3 tables Supabase — idéal la veille d\'une séance.</p>'
      + '<div id="sti-sante-zone"></div>';
    document.body.appendChild(ov);
    var zone = document.getElementById("sti-sante-zone");
    document.getElementById("sti-sante-fermer").addEventListener("click", function () { ov.remove(); });
    document.getElementById("sti-sante-relancer").addEventListener("click", function () { lancer(zone); });
    lancer(zone);
  }
  function bouton() {
    if (document.getElementById("sti-btn-sante")) return;
    var b = document.createElement("button");
    b.id = "sti-btn-sante"; b.type = "button"; b.textContent = "🩺 Santé du site";
    b.setAttribute("style", "position:fixed;left:14px;bottom:164px;z-index:99999;padding:11px 16px;border-radius:999px;border:3px solid #1a1a2e;background:#6a1b9a;color:#fff;font-weight:800;font-size:14px;cursor:pointer;box-shadow:4px 4px 0 #1a1a2e;");
    b.addEventListener("click", ouvrir);
    document.body.appendChild(b);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bouton); else bouton();
})();
