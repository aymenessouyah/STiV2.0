/* ═════════ STI v439 — PLAN DE RÉVISION JUSQU'AU BAC (côté élève) ═════════
   La révision espacée (v436) dit « quoi revoir aujourd'hui » ; ce module ajoute l'OBJECTIF :
   une date d'épreuve, les chapitres qui restent à couvrir, et la charge quotidienne qui en
   découle. Bloc « 🎯 Plan jusqu'au bac » dans le panneau de la roue :

     J-38 · 3 chapitres à finir · ≈ 2 pages/jour
     Programme du jour : HTML5 (2 pages) puis CSS3

   - Date mémorisée dans « sti-bac-date-v439 » (clé sti- → déjà synchronisée entre appareils
     par sync-progressions.js ; rien de nouveau envoyé au nuage).
   - Aucune date saisie : le bloc invite simplement à la fixer (rien d'automatique, aucune
     obligation).
   - Le découpage s'appuie sur le manifeste du build (assets/pages-couverture.json) et sur les
     pages RÉELLEMENT vues : seules les pages non vues sont planifiées.
   - Purement additif : si le panneau n'existe pas, le module ne fait que répondre à l'API.
   - API de test : window.STI_PLAN.{etat, definirDate, plan}. */
(function () {
  "use strict";
  if (window.__STI_ROUE_PLAN) return;
  window.__STI_ROUE_PLAN = true;
  var doc = document;
  if (!/^https?:$/.test(location.protocol)) return;

  var CLE_DATE = "sti-bac-date-v439";
  var CLE_REV = "sti-revision-v436", CLE_VUES = "sti-pages-vues-v432";
  var JOUR = 86400000;
  /* mêmes chapitres que la fiche de révision : le plan parle le même langage qu'elle */
  var CHAPITRES = [
    { cle: "HTML5", pages: ["cours/html5.html", "cours/courshtml5.html", "cours/fiche-revision-html5.html", "cours/datalist.html"] },
    { cle: "CSS3", pages: ["cours/css3.html", "cours/courscss3.html"] },
    { cle: "JavaScript", pages: ["cours/javascript.html", "cours/recap-javascript-sti.html"] },
    { cle: "SQL", pages: ["cours/sql.html", "cours/sql-bases-ldd-lmd-lcd.html", "cours/sql-contraintes.html"] },
    { cle: "PHP & MySQLi", pages: ["cours/php.html", "cours/coursphp.html", "cours/php-recap.html", "cours/php-mysqli.html"] },
  ];

  function lire(cle) { try { return localStorage.getItem(cle) || ""; } catch (e) { return ""; } }
  function objet(cle) { try { return JSON.parse(localStorage.getItem(cle) || "{}") || {}; } catch (e) { return {}; } }
  function aujourdhui0() { var d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); }
  function joursRestants(iso) {
    if (!iso) return null;
    var t = new Date(iso + "T00:00:00").getTime();
    if (!t || isNaN(t)) return null;
    return Math.round((t - aujourdhui0()) / JOUR);
  }
  function pagesVues() {
    var vus = {};
    var vues = objet(CLE_VUES), rev = objet(CLE_REV);
    Object.keys(vues).forEach(function (p) { if (vues[p]) vus[String(p).toLowerCase()] = 1; });
    Object.keys(rev).forEach(function (p) { vus[String(p).toLowerCase()] = 1; });
    return vus;
  }
  /* Fonction PURE (testable) : date + pages vues → état du plan. */
  function plan(dateIso, vus) {
    var jr = joursRestants(dateIso);
    var restants = [], totalRestant = 0, faits = 0;
    CHAPITRES.forEach(function (ch) {
      var reste = ch.pages.filter(function (p) { return !vus[p]; });
      faits += ch.pages.length - reste.length;
      totalRestant += reste.length;
      restants.push({ cle: ch.cle, reste: reste, nbReste: reste.length, nb: ch.pages.length });
    });
    var chapitresRestants = restants.filter(function (c) { return c.nbReste > 0; });
    var parJour = null;
    if (jr !== null && jr > 0) parJour = Math.ceil(totalRestant / jr);
    else if (jr !== null && jr <= 0) parJour = totalRestant ? totalRestant : 0;
    return {
      date: dateIso || null, jours: jr, chapitres: restants, chapitresRestants: chapitresRestants.length,
      pagesRestantes: totalRestant, pagesFaites: faits + (CHAPITRES.reduce(function (s, c) { return s + c.pages.length; }, 0) ? 0 : 0),
      totalChapitres: CHAPITRES.length, parJour: parJour,
      /* le « programme du jour » : les 2 premiers chapitres non terminés */
      programme: chapitresRestants.slice(0, 2).map(function (c) { return { cle: c.cle, pages: c.reste.slice(0, Math.max(1, parJour || 1)) }; }),
      retard: (jr !== null && jr < 0 && totalRestant > 0),
    };
  }
  function etat() { return plan(lire(CLE_DATE), pagesVues()); }
  function definirDate(iso) {
    try {
      if (iso) localStorage.setItem(CLE_DATE, String(iso).slice(0, 10));
      else localStorage.removeItem(CLE_DATE);
    } catch (e) {}
    rendre();
  }

  function panneau() {
    return doc.querySelector(".sti-pan.ouvert") || (function () {
      var p = doc.querySelector(".sti-pan");
      return p && p.offsetParent !== null ? p : null;
    })();
  }
  function bloc(p) {
    var b = p.querySelector("#sti-pan-plan");
    if (b) return b;
    b = doc.createElement("div");
    b.id = "sti-pan-plan";
    b.setAttribute("style", "margin-top:7px;display:flex;flex-direction:column;gap:5px");
    var ancre = p.querySelector("#sti-pan-revision") || p.querySelector("#sti-pan-install-wrap");
    if (ancre && ancre.parentNode) ancre.parentNode.insertBefore(b, ancre.nextSibling);
    else p.appendChild(b);
    return b;
  }
  function rendre() {
    var p = panneau();
    if (!p) return;
    var b = bloc(p);
    var e = etat();
    var tete = "<div style='font-size:10.5px;font-weight:900;opacity:.72;padding-left:2px'>🎯 Plan jusqu'au bac</div>";
    var html;
    if (!e.date) {
      html = tete +
        "<div style='font-size:11px;font-weight:700;opacity:.78;padding:0 2px'>Fixe ta date d'épreuve : le plan répartit les chapitres qui restent sur les jours disponibles.</div>" +
        "<div style='display:flex;gap:6px;align-items:center;margin-top:2px'>" +
        "<input type='date' id='sti-plan-date' style='flex:1 1 auto;font:800 11px system-ui,sans-serif;border:1.5px solid rgba(35,32,26,.3);border-radius:8px;padding:4px 6px;background:#fffdf7;color:inherit'>" +
        "<button type='button' id='sti-plan-ok' style='border:1.5px solid #177245;background:#dcfce7;color:#14532d;border-radius:999px;padding:4px 11px;font:900 10.5px system-ui,sans-serif;cursor:pointer'>OK</button></div>";
    } else {
      var jr = e.jours;
      var badge = jr > 0 ? ("J-" + jr) : (jr === 0 ? "jour J" : ("dépassé de " + Math.abs(jr) + " j"));
      html = tete +
        "<div style='font-size:11.5px;font-weight:900;padding:0 2px'>" + badge + " · " +
        (e.pagesRestantes ? (e.chapitresRestants + " chapitre" + (e.chapitresRestants > 1 ? "s" : "") + " à finir · ≈ " + (e.parJour || 0) + " page" + ((e.parJour || 0) > 1 ? "s" : "") + "/jour")
          : "tout le programme est couvert ✅") + "</div>" +
        (e.programme.length ? "<div style='font-size:10.5px;font-weight:700;opacity:.8;padding:0 2px'>Programme du jour : " +
          e.programme.map(function (c) { return c.cle + " (" + c.pages.length + " page" + (c.pages.length > 1 ? "s" : "") + ")"; }).join(" puis ") + "</div>" : "") +
        (e.retard ? "<div style='font-size:10.5px;font-weight:900;color:#b45309;padding:0 2px'>⚠️ La date est passée mais il reste " + e.pagesRestantes + " page(s).</div>" : "") +
        "<div style='display:flex;gap:6px;align-items:center;margin-top:2px'>" +
        "<input type='date' id='sti-plan-date' value='" + e.date + "' style='flex:1 1 auto;font:800 11px system-ui,sans-serif;border:1.5px solid rgba(35,32,26,.3);border-radius:8px;padding:4px 6px;background:#fffdf7;color:inherit'>" +
        "<button type='button' id='sti-plan-ok' title='Changer la date' style='border:1.5px solid #23201a;background:#fffdf7;color:#23201a;border-radius:999px;padding:4px 10px;font:900 10.5px system-ui,sans-serif;cursor:pointer'>↻</button></div>";
    }
    b.innerHTML = html;
    var ok = b.querySelector("#sti-plan-ok"), inp = b.querySelector("#sti-plan-date");
    if (ok && inp) ok.addEventListener("click", function () {
      if (!inp.value) { definirDate(null); return; }
      definirDate(inp.value);
    });
  }
  var dernier = "";
  setInterval(function () {
    var p = panneau();
    if (!p) return;
    var sig = p.querySelector("#sti-pan-plan") ? JSON.stringify(etat()) : "absent";
    if (sig !== dernier) { rendre(); dernier = sig; }
  }, 900);

  window.STI_PLAN = { etat: etat, definirDate: definirDate, plan: plan, CHAPITRES: CHAPITRES };
  try { if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", rendre); else rendre(); } catch (e) {}
})();
