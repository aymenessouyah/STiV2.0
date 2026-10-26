/* ═══ STI REPRENDRE (v343) — « Continuer où je m'étais arrêté » ═══
   v343 : carte lisible en thème sombre (styles en classes, fond/texte adaptés).
   Lit les progressions locales (déjà synchronisées cloud par sync-progressions.js) :
   vidéo en cours la plus récente, sinon prochaine notion non acquise du tableau de bord. */
(function () {
  "use strict";
  function lireJSON(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } }
  function mmss(s) { s = Math.max(0, Math.round(s || 0)); return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); }
  var NOMS = { "sql-serie4": "🎬 Série 4 SQL — Jointures, Sous-requêtes, Group By", "sql-serie5": "🎬 Série 5 SQL — Gesthotel (Dates)", "php-synthese": "🎬 Synthèse PHP n°1", "sql-cours": "🎬 Cours SQL complet", "css": "🎬 Cours CSS3", "php-guichet": "🎬 Guichet PHP + MySQLi" };
  function nomMedia(cle) { for (var k in NOMS) if (String(cle).indexOf(k) !== -1) return NOMS[k]; return "🎬 Vidéo : " + cle; }

  function construire() {
    var hero = document.querySelector("main .hero") || document.querySelector(".hero");
    if (!hero) return;
    var exist = document.getElementById("sti-reprendre");
    var titre = "", texte = "", lien = "", bouton = "";
    /* 1) Vidéo en cours la plus récente */
    var prog = lireJSON("sti-media-prog-v1") || {};
    var best = null;
    Object.keys(prog).forEach(function (cle) {
      var e = prog[cle] || {};
      if (!e.done && (e.sec || 0) > 5 && (!best || (e.ts || 0) > (best.e.ts || 0))) best = { cle: cle, e: e };
    });
    if (best) {
      titre = "▶️ Continuer où je m'étais arrêté";
      texte = nomMedia(best.cle) + " — reprise à " + mmss(best.e.sec) + " (" + (best.e.maxPct || best.e.pct || 0) + " % déjà vu). Vos progressions vous suivent sur tous vos appareils ☁️";
      lien = "cours/sql.html#bac"; bouton = "▶️ Reprendre";
      if (String(best.cle).indexOf("php") !== -1) lien = "cours/php.html";
    } else {
      /* 2) Prochaine notion non acquise */
      var bord = lireJSON("sti-bord-classe-v1") || {};
      var cles = Object.keys(bord);
      var suivante = null, total = 0, faites = 0;
      cles.forEach(function (k) { total++; if (bord[k]) faites++; else if (!suivante) suivante = k; });
      if (suivante) {
        var parties = suivante.split("|");
        titre = "🧭 Ma prochaine étape de révision";
        texte = "Notion à travailler : « " + (parties[1] || suivante) + " » (" + (parties[0] || "") + ") — " + faites + " / " + total + " notions déjà acquises. Au travail ! 💪";
        lien = "cours/sql.html#bac-enseignant"; bouton = "🧭 Voir ma progression";
      } else if (total > 0) {
        titre = "🏆 Révisions SQL : tout est acquis !";
        texte = "Toutes les notions du tableau de bord sont cochées (" + total + " / " + total + "). Direction les vidéos et les corrigés pour consolider avant le Bac 🎓";
        lien = "cours/sql.html#bac"; bouton = "🎬 Revoir les vidéos";
      }
    }
    if (!titre) {
      if (exist && exist.parentNode) exist.parentNode.removeChild(exist);
      return; /* aucun historique : on n'affiche rien */
    }
    /* Styles en classes (et non en ligne) pour suivre le thème clair/sombre,
       y compris lorsque l'utilisateur bascule le thème sans recharger. */
    if (!document.getElementById("sti-reprendre-css")) {
      var style = document.createElement("style");
      style.id = "sti-reprendre-css";
      style.textContent =
        "#sti-reprendre{max-width:1100px;margin:22px auto;padding:0 16px;}" +
        ".sti-reprendre-carte{border:3px solid #1a1a2e;border-radius:18px;padding:20px 24px;background:linear-gradient(120deg,#fff8ec,#ffe9d6);box-shadow:6px 6px 0 #1a1a2e;color:#1a1a2e;}" +
        ".sti-reprendre-carte h2{margin:0 0 8px;font-size:1.5rem;color:inherit;}" +
        ".sti-reprendre-carte p{margin:0 0 14px;font-size:1.05rem;line-height:1.5;color:inherit;}" +
        ".sti-reprendre-btn{display:inline-block;padding:12px 20px;border-radius:12px;border:3px solid #1a1a2e;background:linear-gradient(120deg,#f4511e,#d81b60);color:#fff;font-weight:800;text-decoration:none;box-shadow:4px 4px 0 #1a1a2e;}" +
        "[data-theme=\"dark\"] .sti-reprendre-carte{background:linear-gradient(120deg,#26313f,#1a2431);border-color:#0b1118;box-shadow:6px 6px 0 rgba(0,0,0,.55);color:#eef3f6;}" +
        "[data-theme=\"dark\"] .sti-reprendre-btn{border-color:#0b1118;box-shadow:4px 4px 0 rgba(0,0,0,.55);color:#fff;}";
      document.head.appendChild(style);
    }
    var inner = '<div class="sti-reprendre-carte">'
      + '<h2>' + titre + '</h2>'
      + '<p>' + texte + '</p>'
      + '<a class="sti-reprendre-btn" href="' + lien + '">' + bouton + '</a></div>';
    if (exist) {
      exist.innerHTML = inner;
      return;
    }
    var section = document.createElement("section");
    section.id = "sti-reprendre";
    section.innerHTML = inner;
    hero.insertAdjacentElement("afterend", section);
  }
  window.__stiRafraichirReprendre = construire;
  window.addEventListener("pageshow", function (ev) {
    if (ev && ev.persisted) construire();
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(construire, 400); });
  else setTimeout(construire, 400);
})();
