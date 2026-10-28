/* ═══ STI REPRENDRE LA LECTURE (v471) — Carte « Continuer où je m'étais arrêté » sur l'accueil ═══
   Lit sti-media-prog-v1 (alimenté par protection.js) + le quiz entamé éventuel et affiche
   un bandeau discret en haut de l'accueil pour reprendre à la seconde exacte sur le bon cours. */
(function () {
  "use strict";
  var ROUTES_MEDIA = [
    { motif: "html5-cours", nom: "HTML5 — Le cours complet", lien: "cours/html5.html" },
    { motif: "css3-cours", nom: "CSS3 — Le cours complet", lien: "cours/css3.html" },
    { motif: "css-displayanim", nom: "CSS3 — Animation display & visibilité", lien: "cours/css3.html" },
    { motif: "displayanim", nom: "CSS3 — Animation display & visibilité", lien: "cours/css3.html" },
    { motif: "css-animee", nom: "CSS3 — Démonstration animée", lien: "cssanimee/index.html" },
    { motif: "css-positionnement", nom: "CSS3 — Positionnement animé", lien: "Positionnement-animee/index.html" },
    { motif: "explore-tunisie-float", nom: "TP Explore Tunisie — Mise en page Float", lien: "exercices/html-css/Explore_Tunisie/Explore_Tunisie_Solution/ExploreTunisie/index-float.html" },
    { motif: "explore-tunisie-flex", nom: "TP Explore Tunisie — Mise en page Flexbox", lien: "exercices/html-css/Explore_Tunisie/Explore_Tunisie_Solution/ExploreTunisie/index.html" },
    { motif: "javascript-cours", nom: "JavaScript — Le cours complet", lien: "cours/javascript.html" },
    { motif: "sql-guide-requete", nom: "SQL — Comment construire une requête", lien: "exercices/sql/CommentConstruireunerequêteSQL.html" },
    { motif: "sql-serie1", nom: "SQL — Série n°1 (Partie 4 Bac)", lien: "cours/sql.html#bac" },
    { motif: "sql-serie2", nom: "SQL — Série n°2 (Partie 4 Bac)", lien: "cours/sql.html#bac" },
    { motif: "sql-serie3", nom: "SQL — Série n°3 (Partie 4 Bac)", lien: "cours/sql.html#bac" },
    { motif: "sql-serie4", nom: "SQL — Série n°4 (ETUDIANT_BD)", lien: "cours/sql.html#bac" },
    { motif: "sql-serie5", nom: "SQL — Série n°5 (Gesthotel)", lien: "cours/sql.html#bac" },
    { motif: "sql-serie6", nom: "SQL — Série n°6 (Partie 4 Bac)", lien: "cours/sql.html#bac" },
    { motif: "sql-cours", nom: "SQL — Le cours complet", lien: "cours/sql.html" },
    { motif: "php-synthese", nom: "PHP — Synthèse n°1 (Gestion des élèves)", lien: "cours/php.html#syntheses" },
    { motif: "php-guichet", nom: "PHP — Synthèse Guichet & formulaires", lien: "cours/php.html#syntheses" },
    { motif: "recharge-ve", nom: "PHP — Synthèse n°2 (Bornes VE)", lien: "cours/php.html#syntheses" },
    { motif: "php-cours", nom: "PHP & MySQLi — Le cours complet", lien: "cours/php.html" }
  ];

  function ech(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function fmt(sec) {
    sec = Math.max(0, Math.floor(sec || 0));
    var m = Math.floor(sec / 60), s = sec % 60;
    return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
  }
  function resoudreMedia(cle) {
    var brute = String(cle || "");
    var c = brute.toLowerCase();
    var estAudio = c.indexOf("audio:") === 0 || /\.(?:m4a|mp3|ogg|wav)(?:$|\?)/.test(c);
    var typeLabel = estAudio ? "🎧 Podcast" : "🎬 Vidéo";
    for (var i = 0; i < ROUTES_MEDIA.length; i++) {
      if (c.indexOf(ROUTES_MEDIA[i].motif) !== -1) {
        return { typeLabel: typeLabel, nom: ROUTES_MEDIA[i].nom, lien: ROUTES_MEDIA[i].lien };
      }
    }
    var propre = brute.replace(/^(?:video|audio):/i, "").replace(/\.[a-z0-9]{2,4}$/i, "").replace(/[-_]+/g, " ").trim() || "Cours STI";
    var lienDefaut = c.indexOf("php") !== -1 ? "cours/php.html"
      : (c.indexOf("javascript") !== -1 || c.indexOf("js") !== -1 ? "cours/javascript.html"
      : (c.indexOf("css") !== -1 ? "cours/css3.html"
      : (c.indexOf("html") !== -1 ? "cours/html5.html" : "cours/sql.html")));
    return { typeLabel: typeLabel, nom: propre, lien: lienDefaut };
  }
  function est3SIStrict() {
    try {
      var cs = JSON.parse(localStorage.getItem("sti-session-cache") || "{}") || {};
      if (cs.isAdmin || cs.isGold || /\bGOLD\b/i.test(String(cs.lycee || "")) || /\bGOLD\b/i.test(String(cs.classe || ""))) return false;
      var cl = String(cs.classe || "").trim().toUpperCase().replace(/[\s._\-]+/g, "");
      return /^3(E|ÈME|EME)?SI([1-5])?$/i.test(cl);
    } catch (e) { return false; }
  }
  function trouverCible() {
    return document.getElementById("cours") || document.querySelector("main") || document.body;
  }
  function rendre() {
    var exist = document.getElementById("sti-reprendre");
    if (exist && exist.parentNode) exist.parentNode.removeChild(exist);
    var prog = {};
    try { prog = JSON.parse(localStorage.getItem("sti-media-prog-v1") || "{}") || {}; } catch (e) {}
    var mode3si = est3SIStrict();
    var meilleure = null;
    Object.keys(prog).forEach(function (k) {
      if (mode3si && String(k).toLowerCase().indexOf("php") !== -1) return;
      var v = prog[k];
      var sec = typeof v === "number" ? v : (v && Number(v.t || v.time || v.sec || 0));
      var ts = (v && Number(v.maj || v.ts || 0)) || 0;
      if (sec > 15) {
        if (!meilleure || ts > meilleure.ts || (!meilleure.ts && sec > meilleure.sec)) {
          meilleure = { cle: k, sec: sec, ts: ts };
        }
      }
    });
    if (!meilleure) return;
    var info = resoudreMedia(meilleure.cle);
    var cible = trouverCible();
    if (!cible || !cible.parentNode) return;
    var box = document.createElement("aside");
    box.id = "sti-reprendre";
    box.setAttribute("aria-label", "Reprendre la dernière activité");
    box.setAttribute("style", 'max-width:1100px;margin:18px auto 6px;padding:14px 20px;border-radius:16px;border:3px solid #1a1a2e;background:linear-gradient(135deg,#fff8e1,#ffe0b2);box-shadow:5px 5px 0 #1a1a2e;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;font-family:"Comic Sans MS","Comic Sans",cursive,sans-serif;color:#1a1a2e;');
    box.innerHTML = '<div><div style="font-size:.82rem;font-weight:800;color:#bf360c;text-transform:uppercase;letter-spacing:.4px">⏯ Continuer où je m\'étais arrêté</div>'
      + '<div style="font-size:1.05rem;font-weight:800;margin-top:2px">' + info.typeLabel + ' : ' + ech(info.nom) + ' <span style="background:#1a1a2e;color:#ffd54f;padding:2px 9px;border-radius:999px;font-size:.85rem">repris à ' + fmt(meilleure.sec) + '</span></div></div>'
      + '<div style="display:flex;gap:8px;align-items:center">'
      + '<a href="' + ech(info.lien) + '" style="padding:9px 16px;border-radius:999px;border:2.5px solid #1a1a2e;background:#2e7d32;color:#fff;font-weight:800;text-decoration:none;box-shadow:3px 3px 0 #1a1a2e">▶ Reprendre</a>'
      + '<button type="button" id="sti-reprendre-x" title="Masquer" style="padding:7px 11px;border-radius:999px;border:2px solid #1a1a2e;background:#fff;font-weight:800;cursor:pointer">✕</button></div>';
    cible.parentNode.insertBefore(box, cible);
    document.getElementById("sti-reprendre-x").addEventListener("click", function () {
      try { delete prog[meilleure.cle]; localStorage.setItem("sti-media-prog-v1", JSON.stringify(prog)); } catch (e) {}
      box.remove();
    });
  }
  window.__stiRafraichirReprendre = rendre;
  window.__stiResoudreMediaReprendre = resoudreMedia;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", rendre); else rendre();
})();
