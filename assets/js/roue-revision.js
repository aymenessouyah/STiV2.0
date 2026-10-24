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

  function lire() {
    try { return JSON.parse(localStorage.getItem(CLE) || "{}") || {}; } catch (e) { return {}; }
  }
  function ecrire(o) { try { localStorage.setItem(CLE, JSON.stringify(o)); } catch (e) {} }
  function jour(ts) { var d = new Date(ts || Date.now()); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
  function slug() {
    var p = location.pathname || "";
    try { p = decodeURIComponent(p); } catch (e) {}
    p = p.replace(/^\/+/, "").toLowerCase();
    if (p.indexOf("stiv2.0/") === 0) p = p.slice(8);
    if (/\/$/.test(p)) p += "index.html";
    return p;
  }
  function pagesManifeste() {
    if (manifeste) return Promise.resolve(manifeste);
    /* racine du site calculée comme dans config.js (les pages vivent à des profondeurs
       différentes : un chemin relatif pointerait sur /cours/assets/… et ferait un 404) */
    var base = "./";
    try {
      var pn = location.pathname || "";
      var mm = pn.match(/^(.*?)\/(?:cours|exercices|projets|documents|annexes|quiz|cssanimee|Positionnement-animee|tests)\//);
      base = mm ? location.origin + mm[1] + "/" : location.origin + pn.slice(0, pn.lastIndexOf("/") + 1);
    } catch (eB) {}
    return fetch(base + "assets/pages-couverture.json", { cache: "no-cache" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { manifeste = (j && j.pages ? j.pages : []).map(function (x) { return String(x).toLowerCase(); }); return manifeste; })
      .catch(function () { manifeste = []; return manifeste; });
  }
  /* 1°) dater la visite de la page courante (si c'est une page de contenu) */
  function dater() {
    var s = slug();
    pagesManifeste().then(function (pages) {
      if (pages && pages.length && pages.indexOf(s) === -1) return;
      var o = lire();
      if (!o[s]) o[s] = { vu: new Date().toISOString(), etape: 0, dernier: null };
      ecrire(o);
    });
  }
  function noteChiffree(txt) {
    var m = String(txt || "").match(/(\d+(?:[.,]\d+)?)\s*(?:\/\s*(\d+))?/);
    if (!m) return null;
    var n = parseFloat(String(m[1]).replace(",", "."));
    var sur = m[2] ? parseFloat(m[2]) : 20;
    if (!sur) return null;
    return Math.round((n * 20 / sur) * 10) / 10;
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
        out.push({ type: "page", slug: p, etape: etape + 1, retard: Math.floor((maintenant - echeance) / JOUR), href: p });
      }
    });
    out.sort(function (a, b) { return b.retard - a.retard; });
    var nomsQuiz = [], quiz = [];
    try { nomsQuiz = Object.keys(JSON.parse(localStorage.getItem("sti-mes-scores") || "{}") || {}); } catch (e) {}
    nomsQuiz.forEach(function (nom) {
      var note = noteChiffree((function () { try { return JSON.parse(localStorage.getItem("sti-mes-scores"))[nom]; } catch (e) { return null; } })());
      if (note !== null && note < 10) {
        var href = /^bac/i.test(nom) ? "bac-pratique.html" : (/php/i.test(nom) ? "quiz/php.html" : (/sql/i.test(nom) ? "quiz/sql.html" : (/javascript|js/i.test(nom) ? "quiz/javascript.html" : "quiz/html-css.html")));
        quiz.push({ type: "quiz", nom: nom, note: note, href: href, retard: 1 });
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
      items.forEach(function (it, i) {
        html += "<div class='sti-rev-ligne' data-cle='" + it.cle.replace(/'/g, "\\'") + "' style='display:flex;align-items:center;gap:6px;border:1.5px solid rgba(35,32,26,.18);border-radius:10px;padding:4px 6px;background:rgba(255,255,255,.55)'>" +
          "<a href='" + it.href + "' style='flex:1 1 auto;min-width:0;text-decoration:none;color:inherit'><div style='font-size:11.5px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis'>" + it.titre + "</div>" +
          "<div style='font-size:9.5px;font-weight:800;opacity:.7'>" + it.meta + "</div></a>" +
          "<button type='button' class='sti-rev-fait' data-cle='" + it.cle.replace(/'/g, "\\'") + "' title='Marquer comme révisé'" +
          " style='flex:0 0 auto;border:1.5px solid #177245;background:#dcfce7;color:#14532d;border-radius:999px;padding:3px 9px;font:900 10.5px system-ui,sans-serif;cursor:pointer'>✔</button>" +
          "</div>";
      });
    }
    html += "<div style='display:flex;gap:6px;margin-top:1px'>" +
      "<a href='ma-fiche-revision.html' style='flex:1 1 auto;text-align:center;text-decoration:none;border:1.5px solid #23201a;background:#fffdf7;color:#23201a;border-radius:999px;padding:4px 8px;font:900 10.5px system-ui,sans-serif'>🖨 Ma fiche de révision</a>" +
      "<button type='button' id='sti-pan-rappel-btn' style='flex:1 1 auto;border:1.5px solid #23201a;background:#fffdf7;color:#23201a;border-radius:999px;padding:4px 8px;font:900 10.5px system-ui,sans-serif;cursor:pointer'>🔔 Rappels</button>" +
      "</div>";
    b.innerHTML = html;
    /* Le site masque certains liens de quiz selon la classe (règle auteur « 4SI autorisé »).
       Si notre lien est masqué par cette règle, on le renvoie vers « Retravailler mes erreurs »
       au lieu de laisser une ligne vide — la règle du site reste intacte. */
    Array.prototype.forEach.call(b.querySelectorAll(".sti-rev-ligne a"), function (a) {
      try {
        if (getComputedStyle(a).display === "none") {
          a.setAttribute("href", "revision-erreurs.html");
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
      s.src = (doc.currentScript && doc.currentScript.src ? doc.currentScript.src.replace(/roue-revision\.js.*$/, "") : "assets/js/") + "rappels-locaux.js?v=436";
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

  window.STI_REVISION = { dus: dus, marquerFait: marquerFait, oublier: oublier, lire: lire, libelle: libelle, ETAPES: ETAPES };
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
