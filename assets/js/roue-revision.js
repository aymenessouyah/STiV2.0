/* ════════ STI v436 — RÉVISION ESPACÉE DANS LA ROUE (consigne auteur n°6) ════════
   Le panneau de la roue propose, à chaque ouverture, CE QUI DOIT ÊTRE REVU AUJOURD'HUI :
   - les pages de contenu consultées il y a 1, 3 puis 7 jours (une visite = entrée dans le
     cycle ; « ✔ révisé » le fait avancer, après quoi la page est considérée acquise) ;
   - les quiz faibles (note < 10/20 dans « sti-mes-scores »), à refaire.
   Journal daté propre : localStorage « sti-revision-v436 » — clé « sti- » donc déjà
   synchronisée entre appareils par sync-progressions.js, sans rien ajouter au nuage.
   Ajout PUREMENT additif : un bloc « 🔁 À revoir aujourd'hui » dans le panneau, et une
   API (window.STI_REVISION) pour la fiche imprimable et les rappels locaux.
   Aucun autre comportement n'est modifié ; si le panneau n'existe pas (PC, portail),
   le module se contente de dater la visite et de répondre à l'API. */
(function () {
  "use strict";
  if (window.__STI_ROUE_REVISION) return;
  window.__STI_ROUE_REVISION = true;
  var doc = document;
  if (!/^https?:$/.test(location.protocol)) return;

  var CLE = "sti-revision-v436";
  var CLE_ANCIENNE = "sti-pages-vues-v432";
  var JOUR = 86400000;
  var ETAPES = [1, 3, 7]; /* intervalles en jours */
  var MAX_PROPOSITIONS = 3;
  var manifeste = null;
  /* Table canonique des 48 pages suivies dont le chemin Git réel comporte des majuscules
     (évite les erreurs HTTP 404 sur GitHub Pages / Linux sensible à la casse, y compris
     pour les entrées historiques déjà enregistrées en minuscules dans sti-revision-v436). */
  var CHEMINS_REELS = {
    "cours/recap-javascript-sti.html": "cours/Recap-JavaScript-STI.html",
    "exercices/html-css/activite-html-css/act1/page1.html": "exercices/html-css/activite-html-css/Act1/page1.html",
    "exercices/html-css/activite-html-css/act2/page2.html": "exercices/html-css/activite-html-css/Act2/page2.html",
    "exercices/html-css/explore_tunisie/explore_tunisie_enonce.pdf.html": "exercices/html-css/Explore_Tunisie/Explore_Tunisie_Enonce.pdf.html",
    "exercices/html-css/explore_tunisie/explore_tunisie_solution/exploretunisie/index-float.html": "exercices/html-css/Explore_Tunisie/Explore_Tunisie_Solution/ExploreTunisie/index-float.html",
    "exercices/html-css/explore_tunisie/explore_tunisie_solution/exploretunisie/index-position.html": "exercices/html-css/Explore_Tunisie/Explore_Tunisie_Solution/ExploreTunisie/index-position.html",
    "exercices/html-css/explore_tunisie/explore_tunisie_solution/exploretunisie/index.html": "exercices/html-css/Explore_Tunisie/Explore_Tunisie_Solution/ExploreTunisie/index.html",
    "exercices/html-css/tp1-css.pdf.html": "exercices/html-css/TP1-css.pdf.html",
    "exercices/html-css/tp2-css.pdf.html": "exercices/html-css/TP2-css.pdf.html",
    "exercices/html-css/tp2/tp2corrposition.html": "exercices/html-css/TP2/tp2corrposition.html",
    "exercices/html-css/tp3-css.pdf.html": "exercices/html-css/TP3-css.pdf.html",
    "exercices/javascript/tp1-correction-js.html": "exercices/javascript/Tp1-Correction-js.html",
    "exercices/javascript/tp1-js.html": "exercices/javascript/Tp1-js.html",
    "exercices/javascript/tp2-correction-js.html": "exercices/javascript/Tp2-Correction-js.html",
    "exercices/javascript/tp2-js.html": "exercices/javascript/Tp2-js.html",
    "exercices/javascript/tp3-correction-js.html": "exercices/javascript/Tp3-Correction-js.html",
    "exercices/javascript/tp3-js.html": "exercices/javascript/Tp3-js.html",
    "exercices/javascript/tp4-correction-js.html": "exercices/javascript/Tp4-Correction-js.html",
    "exercices/javascript/tp4-js.html": "exercices/javascript/Tp4-js.html",
    "exercices/javascript/tp5-correction-js.html": "exercices/javascript/Tp5-Correction-js.html",
    "exercices/javascript/tp5-js.html": "exercices/javascript/Tp5-js.html",
    "exercices/php/4sti-dc-6-2025-2026.pdf.html": "exercices/php/4STi-dc-6-2025-2026.pdf.html",
    "exercices/php/tp1-correction-php.html": "exercices/php/Tp1-Correction-php.html",
    "exercices/php/tp1-php.html": "exercices/php/Tp1-php.html",
    "exercices/php/tp2-correction-php.html": "exercices/php/Tp2-Correction-php.html",
    "exercices/php/tp2-php.html": "exercices/php/Tp2-php.html",
    "exercices/php/tp3-correction-php.html": "exercices/php/Tp3-correction-php.html",
    "exercices/php/tp3-php.html": "exercices/php/Tp3-php.html",
    "exercices/php/tp4-correction-php.html": "exercices/php/Tp4-Correction-php.html",
    "exercices/php/tp4-php.html": "exercices/php/Tp4-php.html",
    "exercices/php/tp5-correction-php.html": "exercices/php/Tp5-Correction-php.html",
    "exercices/php/tp5-php.html": "exercices/php/Tp5-php.html",
    "exercices/sql/commentconstruireunerequêtesql.html": "exercices/sql/CommentConstruireunerequêteSQL.html",
    "exercices/sql/tp-bd-jointure-sous-requetes-group-by.html": "exercices/sql/Tp-BD-Jointure-sous-requetes-Group-By.html",
    "exercices/sql/tp-date-ssr-j-gp-bd.html": "exercices/sql/Tp-date-ssr-j-gp-bd.html",
    "exercices/sql/tp-date-ssr-j-gp-correction-bd.html": "exercices/sql/Tp-date-ssr-j-gp-correction-bd.html",
    "exercices/sql/tp-groupby-bd.html": "exercices/sql/Tp-GroupBy-bd.html",
    "exercices/sql/tp1-bd.html": "exercices/sql/Tp1-bd.html",
    "exercices/sql/tp1-correction-bd.html": "exercices/sql/Tp1-Correction-bd.html",
    "exercices/sql/tp2-bd.html": "exercices/sql/Tp2-bd.html",
    "exercices/sql/tp2-correction-bd.html": "exercices/sql/Tp2-Correction-bd.html",
    "exercices/sql/tp3-correction-bd.html": "exercices/sql/Tp3-Correction-bd.html",
    "exercices/sql/tp4-correction-bd.html": "exercices/sql/Tp4-correction-bd.html",
    "positionnement-animee/index.html": "Positionnement-animee/index.html",
    "projets/fleurs/corrections.html": "projets/fleurs/Corrections.html",
    "projets/formulaire-inscription/cvfleurs.html": "projets/formulaire-inscription/cvFleurs.html",
    "projets/formulaire-inscription/enonce/cvfleurs-énoncé/formulaire inscription.pdf.html": "projets/formulaire-inscription/enonce/cvFleurs-énoncé/formulaire inscription.pdf.html",
    "projets/site-tunisie/site-tunisie-correction-animation-html-css.html": "projets/site-tunisie/site-tunisie-Correction-animation-html-css.html"
  };

  function ech(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function lire() {
    try { return JSON.parse(localStorage.getItem(CLE) || "{}") || {}; } catch (e) { return {}; }
  }
  function ecrire(o) { try { localStorage.setItem(CLE, JSON.stringify(o)); } catch (e) {} }
  function jour(ts) { var d = new Date(ts || Date.now()); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
  function cheminReelCourant() {
    var p = location.pathname || "";
    try { p = decodeURIComponent(p); } catch (e) {}
    p = p.replace(/^\/+/, "");
    if (/^stiv2\.0\//i.test(p)) p = p.slice(8);
    if (/\/$/.test(p)) p += "index.html";
    return CHEMINS_REELS[p.toLowerCase()] || p;
  }
  function slug() {
    return cheminReelCourant().toLowerCase();
  }
  function resoudreCheminReel(cleSlug, entree) {
    var k = String(cleSlug || "").replace(/^\/+/, "").toLowerCase();
    if (CHEMINS_REELS[k]) return CHEMINS_REELS[k];
    if (entree && typeof entree.chemin === "string" && entree.chemin.replace(/^\/+/, "").toLowerCase() === k) {
      return entree.chemin.replace(/^\/+/, "");
    }
    return String(cleSlug || "").replace(/^\/+/, "");
  }
  function racineSite() {
    try {
      var orig = location.origin && location.origin !== "null" ? location.origin : "";
      var pn = location.pathname || "";
      var mm = pn.match(/^(.*?)\/(?:cours|exercices|projets|documents|annexes|quiz|cssanimee|Positionnement-animee|tests)\//i);
      if (mm) return orig + mm[1] + "/";
      if (typeof window.STI_ROOT === "string" && window.STI_ROOT) return window.STI_ROOT;
      return orig + pn.slice(0, pn.lastIndexOf("/") + 1);
    } catch (eB) {
      return "./";
    }
  }
  function versRacine(rel) {
    var r = String(rel || "").replace(/^\/+/, "");
    if (/^https?:\/\//i.test(r)) return r;
    var complet = racineSite() + r;
    try { return encodeURI(decodeURI(complet)); } catch (eU) { return complet.replace(/ /g, "%20"); }
  }
  function pagesManifeste() {
    if (manifeste) return Promise.resolve(manifeste);
    return fetch(versRacine("assets/pages-couverture.json"), { cache: "no-cache" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { manifeste = (j && j.pages ? j.pages : []).map(function (x) { return String(x).toLowerCase(); }); return manifeste; })
      .catch(function () { manifeste = []; return manifeste; });
  }
  /* 1°) dater la visite de la page courante (si c'est une page de contenu) */
  function dater() {
    var s = slug();
    var reel = cheminReelCourant();
    pagesManifeste().then(function (pages) {
      if (pages && pages.length && pages.indexOf(s) === -1) return;
      var o = lire();
      if (!o[s]) {
        o[s] = { vu: new Date().toISOString(), etape: 0, dernier: null, chemin: reel };
        ecrire(o);
      } else if (!o[s].chemin && reel && reel !== s) {
        o[s].chemin = reel;
        ecrire(o);
      }
    });
  }
  function noteChiffree(txt) {
    var s = String(txt == null ? "" : txt).trim();
    if (!s || /\bpts?\b/i.test(s) && !/\/\s*\d+/.test(s) && !/%/.test(s)) return null;
    var mFrac = s.match(/(\d+(?:[.,]\d+)?)\s*\/\s*(\d+(?:[.,]\d+)?)/);
    if (mFrac) {
      var n = parseFloat(mFrac[1].replace(",", "."));
      var sur = parseFloat(mFrac[2].replace(",", "."));
      if (!isFinite(n) || !isFinite(sur) || sur <= 0 || n < 0 || n > sur) return null;
      return Math.round((n * 20 / sur) * 10) / 10;
    }
    var mPct = s.match(/(\d+(?:[.,]\d+)?)\s*%/);
    if (mPct) {
      var pct = parseFloat(mPct[1].replace(",", "."));
      if (!isFinite(pct) || pct < 0 || pct > 100) return null;
      return Math.round((pct * 20 / 100) * 10) / 10;
    }
    if (/^\d+(?:[.,]\d+)?$/.test(s)) {
      var v = parseFloat(s.replace(",", "."));
      if (isFinite(v) && v >= 0 && v <= 20) return Math.round(v * 10) / 10;
    }
    return null;
  }
  /* 2°) ce qui est dû aujourd'hui : pages arrivées à échéance + quiz faibles */
  function dus() {
    var o = lire(), out = [], maintenant = Date.now();
    Object.keys(o).forEach(function (p) {
      var e = o[p] || {};
      var base = new Date(e.dernier || e.vu || 0).getTime();
      if (!base || isNaN(base)) return;
      var etape = Math.min(ETAPES.length - 1, Math.max(0, Number(e.etape) || 0));
      var echeance = base + ETAPES[etape] * JOUR;
      if (maintenant >= echeance) {
        var reelP = resoudreCheminReel(p, e);
        out.push({ type: "page", slug: p, chemin: reelP, etape: ETAPES[etape], rang: etape + 1, retard: Math.floor((maintenant - echeance) / JOUR), href: versRacine(reelP) });
      }
    });
    out.sort(function (a, b) { return b.retard - a.retard; });
    var nomsQuiz = [], quiz = [];
    try { nomsQuiz = Object.keys(JSON.parse(localStorage.getItem("sti-mes-scores") || "{}") || {}); } catch (e) {}
    nomsQuiz.forEach(function (nom) {
      var note = noteChiffree((function () { try { return JSON.parse(localStorage.getItem("sti-mes-scores"))[nom]; } catch (e) { return null; } })());
      if (note !== null && note < 10) {
        var cibleQuiz = /^bac/i.test(nom) ? "bac-pratique.html"
          : (/tableaux/i.test(nom) ? "quiz/tableaux.html"
          : (/php/i.test(nom) ? "quiz/php.html"
          : (/sql/i.test(nom) ? "quiz/sql.html"
          : (/javascript|js/i.test(nom) ? "quiz/javascript.html" : "quiz/html-css.html"))));
        quiz.push({ type: "quiz", nom: nom, note: note, href: versRacine(cibleQuiz), retard: 1 });
      }
    });
    return { pages: out, quiz: quiz, total: out.length + quiz.length };
  }
  function marquerFait(p) {
    var o = lire();
    if (!o[p]) return false;
    var e = o[p];
    var etape = (Number(e.etape) || 0) + 1;
    if (etape >= ETAPES.length) { delete o[p]; ecrire(o); return "acquis"; }
    e.etape = etape; e.dernier = new Date().toISOString();
    o[p] = e; ecrire(o); return "avance";
  }
  function oublier(p) { var o = lire(); delete o[p]; ecrire(o); }

  /* 3°) bloc dans le panneau de la roue */
  function panneau() {
    return doc.querySelector(".sti-pan.ouvert") || (function () {
      var p = doc.querySelector(".sti-pan");
      return p && p.offsetParent !== null ? p : null;
    })();
  }
  function bloc(p) {
    var b = p.querySelector("#sti-pan-revision");
    if (b) return b;
    b = doc.createElement("div");
    b.id = "sti-pan-revision";
    b.setAttribute("style", "margin-top:7px;display:flex;flex-direction:column;gap:5px");
    var ancre = p.querySelector("#sti-pan-nuage") || p.querySelector("#sti-pan-install-wrap");
    if (ancre && ancre.parentNode) ancre.parentNode.insertBefore(b, ancre.nextSibling);
    else p.appendChild(b);
    return b;
  }
  function libelle(s) {
    var f = String(s || "").split("/").pop() || s;
    return f.replace(/\.html$/i, "").replace(/[-_]+/g, " ").replace(/\b\w/g, function (c) { return c.toUpperCase(); }).slice(0, 34);
  }
  function rendre() {
    var p = panneau();
    if (!p) return;
    var b = bloc(p);
    var d = dus();
    var items = [];
    d.pages.slice(0, MAX_PROPOSITIONS).forEach(function (x) {
      items.push({ cle: x.slug, titre: libelle(x.slug), meta: "révision J+" + x.etape + (x.retard > 0 ? " · " + x.retard + " j de retard" : ""), href: x.href, type: "page" });
    });
    d.quiz.slice(0, Math.max(0, MAX_PROPOSITIONS - items.length)).forEach(function (q) {
      items.push({ cle: "__quiz__" + q.nom, titre: q.nom + " — " + q.note + "/20", meta: "quiz à refaire", href: q.href, type: "quiz" });
    });
    var html = "<div style='font-size:10.5px;font-weight:900;opacity:.72;padding-left:2px'>🔁 À revoir aujourd'hui" +
      (d.total ? " (" + d.total + ")" : "") + "</div>";
    if (!items.length) {
      html += "<div style='font-size:11px;font-weight:700;opacity:.75;padding:2px 2px 0'>Rien d'urgent : continue tes cours, la roue te rappellera les pages au bon moment.</div>";
    } else {
      items.forEach(function (it) {
        html += "<div class='sti-rev-ligne' data-cle='" + ech(it.cle) + "' style='display:flex;align-items:center;gap:6px;border:1.5px solid rgba(35,32,26,.18);border-radius:10px;padding:4px 6px;background:rgba(255,255,255,.55)'>" +
          "<a href='" + ech(it.href) + "' style='flex:1 1 auto;min-width:0;text-decoration:none;color:inherit'><div style='font-size:11.5px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis'>" + ech(it.titre) + "</div>" +
          "<div style='font-size:9.5px;font-weight:800;opacity:.7'>" + ech(it.meta) + "</div></a>" +
          "<button type='button' class='sti-rev-fait' data-cle='" + ech(it.cle) + "' title='Marquer comme révisé'" +
          " style='flex:0 0 auto;border:1.5px solid #177245;background:#dcfce7;color:#14532d;border-radius:999px;padding:3px 9px;font:900 10.5px system-ui,sans-serif;cursor:pointer'>✔</button>" +
          "</div>";
      });
    }
    html += "<div style='display:flex;gap:6px;margin-top:1px'>" +
      "<a href='" + versRacine("ma-fiche-revision.html") + "' style='flex:1 1 auto;text-align:center;text-decoration:none;border:1.5px solid #23201a;background:#fffdf7;color:#23201a;border-radius:999px;padding:4px 8px;font:900 10.5px system-ui,sans-serif'>🖨 Ma fiche de révision</a>" +
      "<button type='button' id='sti-pan-rappel-btn' style='flex:1 1 auto;border:1.5px solid #23201a;background:#fffdf7;color:#23201a;border-radius:999px;padding:4px 8px;font:900 10.5px system-ui,sans-serif;cursor:pointer'>🔔 Rappels</button>" +
      "</div>";
    b.innerHTML = html;
    /* Le site masque certains liens de quiz selon la classe (règle auteur « 4SI autorisé »).
       Si notre lien est masqué par cette règle, on le renvoie vers « Retravailler mes erreurs »
       au lieu de laisser une ligne vide — la règle du site reste intacte. */
    Array.prototype.forEach.call(b.querySelectorAll(".sti-rev-ligne a"), function (a) {
      try {
        if (getComputedStyle(a).display === "none") {
          a.setAttribute("href", versRacine("revision-erreurs.html"));
          a.style.setProperty("display", "block", "important");
        }
      } catch (e) {}
    });
    Array.prototype.forEach.call(b.querySelectorAll(".sti-rev-fait"), function (btn) {
      btn.addEventListener("click", function () {
        var cle = btn.getAttribute("data-cle") || "";
        if (cle.indexOf("__quiz__") === 0) {
          var nom = cle.slice(8);
          try { var sc = JSON.parse(localStorage.getItem("sti-mes-scores") || "{}"); if (sc && nom) { delete sc[nom]; localStorage.setItem("sti-mes-scores", JSON.stringify(sc)); } } catch (e) {}
        } else { marquerFait(cle); }
        rendre();
      });
    });
    var rb = b.querySelector("#sti-pan-rappel-btn");
    if (rb) rb.addEventListener("click", function () {
      if (window.STI_RAPPELS && window.STI_RAPPELS.demander) { window.STI_RAPPELS.demander(rb); return; }
      var s = doc.createElement("script");
      s.src = (doc.currentScript && doc.currentScript.src ? doc.currentScript.src.replace(/roue-revision\.js.*$/, "") : versRacine("assets/js/")) + "rappels-locaux.js?v=436";
      s.onload = function () { try { window.STI_RAPPELS.demander(rb); } catch (e) {} };
      (doc.head || doc.documentElement).appendChild(s);
    });
  }
  /* veille légère : le panneau est rebâti à chaque ouverture */
  var dernierEtat = "";
  setInterval(function () {
    var p = panneau();
    if (!p) return;
    var sig = p.querySelector("#sti-pan-revision") ? "ok" : "absent";
    var d = dus();
    var sig2 = sig + "|" + d.total;
    if (!p.querySelector("#sti-pan-revision")) rendre();
    else if (sig2 !== dernierEtat) rendre();
    dernierEtat = sig2;
  }, 700);

  window.STI_REVISION = { dus: dus, marquerFait: marquerFait, oublier: oublier, lire: lire, libelle: libelle, resoudreCheminReel: resoudreCheminReel, CHEMINS_REELS: CHEMINS_REELS, ETAPES: ETAPES };
  dater();
  try { if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", rendre); else rendre(); } catch (e) {}
  /* amorçage : les pages déjà vues avant la v436 entrent dans le cycle une fois */
  (function amorcer() {
    var o = lire();
    var ancien = {};
    try { ancien = JSON.parse(localStorage.getItem(CLE_ANCIENNE) || "{}") || {}; } catch (e) { return; }
    var nouveau = false;
    Object.keys(ancien).forEach(function (p) {
      if (!ancien[p] || o[p]) return;
      var maintenant = Date.now();
      o[p] = { vu: new Date(maintenant).toISOString(), etape: 0, dernier: null };
      nouveau = true;
    });
    if (nouveau) ecrire(o);
  })();
})();
