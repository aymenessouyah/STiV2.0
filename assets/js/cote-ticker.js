/* STI by AE — « La Cote » : bandeau type tableau de bourse (page d'accueil).
   Cote officielle des technologies enseignées + dernières nouvelles du README.
   Pour revoir la cotation : modifier STI_COTE ci-dessous (une seule source de vérité).
   Aucune dépendance externe ; le fil d'actualité lit README.md (même origine, déjà pré-cache hors-ligne). */
(function () {
  "use strict";

  /* --- Mobile (≤700px) : le bandeau se glisse sous le hero, après les gros boutons
     « Choisir un quiz » / « Voir les cours & exercices », pour ne rien pousser hors cadre.
     PC : il reste sous la barre de navigation. La bascule suit les changements de largeur. --- */
  (function placerCote() {
    try {
      if (!window.matchMedia) return;
      var mq = matchMedia("(max-width:700px)");
      var appliquer = function () {
        var cote = document.getElementById("cote-sti");
        var main = document.querySelector("main.wrap");
        var hero = main && main.querySelector("section.hero");
        if (!cote || !main || !hero) return;
        if (mq.matches) {
          if (cote.parentNode !== main) main.insertBefore(cote, hero.nextSibling);
        } else if (cote.parentNode === main) {
          document.body.insertBefore(cote, main);
        }
      };
      appliquer();
      if (mq.addEventListener) mq.addEventListener("change", appliquer);
      else if (mq.addListener) mq.addListener(appliquer);
    } catch (e) {}
  })();

  var STI_COTE = {
    maj: "23/10/2026",
    tech: [
      { nom: "HTML5", cote: "Standard vivant", det: "WHATWG — évolue en continu", couleur: "#ff8a65" },
      { nom: "CSS3", cote: "Modules vivants", det: "W3C — niveau 3 + modules à jour", couleur: "#90caf9" },
      { nom: "JavaScript", cote: "ES2026", det: "ECMA-262 17ᵉ éd. — 30 juin 2026", couleur: "#ffd54f" },
      { nom: "SQL", cote: "SQL:2023", det: "ISO/IEC 9075:2023 + amendements 2025", couleur: "#4dd0e1" },
      { nom: "PHP", cote: "8.5.12", det: "21 oct. 2026 — correctif sécurité ; 8.6 attendu le 19 nov.", couleur: "#a5b4fc" }
    ],
    news_secours: [
      "v400 — La Cote ouvre la page d'accueil",
      "v399 — Tableau de bord : un seul tiroir d'outils",
      "v398 — Cinq boutons rangés dans le tiroir à engrenage",
      "v397 — Carnet d'observations de classe",
      "v396 — SQL de poche : trois bases SQLite dans le navigateur"
    ]
  };

  var piste = document.getElementById("cote-piste");
  if (!piste) return;
  var reduce = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);

  function span(cls, txt, style) {
    var s = document.createElement("span");
    s.className = cls;
    s.textContent = txt;
    if (style) s.setAttribute("style", style);
    return s;
  }
  function itemTech(t) {
    var it = span("cote-item", "");
    it.appendChild(span("cote-sym", t.nom, "color:" + t.couleur));
    it.appendChild(span("cote-up", "\u25b2 " + t.cote));
    it.appendChild(span("cote-det", t.det));
    return it;
  }
  function itemNews(txt) {
    var it = span("cote-item", "");
    it.appendChild(span("cote-news", "\ud83d\udd14 " + txt));
    return it;
  }
  function construire(news) {
    var g = document.createDocumentFragment();
    g.appendChild(span("cote-sec", "DERNI\u00c8RES NOUVELLES"));
    news.forEach(function (n) { g.appendChild(itemNews(n)); });
    g.appendChild(span("cote-sec", "CORBEILLE TECH \u00b7 COT\u00c9E AU " + STI_COTE.maj));
    STI_COTE.tech.forEach(function (t) { g.appendChild(itemTech(t)); });
    return g;
  }
  function render(news) {
    while (piste.firstChild) piste.removeChild(piste.firstChild);
    piste.appendChild(construire(news));
    if (!reduce) {
      var clone = construire(news);
      clone.setAttribute("aria-hidden", "true");
      piste.appendChild(clone);
      requestAnimationFrame(function () {
        var moitie = Math.max(piste.scrollWidth / 2, 1);
        piste.style.animationDuration = Math.max(30, Math.round(moitie / 55)) + "s";
      });
    }
  }

  render(STI_COTE.news_secours);

  if (window.fetch) {
    fetch("./README.md", { cache: "default" })
      .then(function (r) { return r && r.ok ? r.text() : ""; })
      .then(function (txt) {
        var lignes = String(txt || "").split("\n").filter(function (l) {
          return /^\|\s*v\d{3}/.test(l);
        });
        var cinq = lignes.slice(-5).reverse().map(function (l) {
          var cel = l.split("|");
          var ver = (cel[1] || "").trim();
          var desc = (cel[2] || "").replace(/[*`]/g, "").replace(/\s+/g, " ").trim();
          if (desc.length > 92) desc = desc.slice(0, 89) + "\u2026";
          return ver + " \u2014 " + desc;
        }).filter(function (s) { return s.length > 8; });
        if (cinq.length) render(cinq);
      })
      .catch(function () {});
  }
})();
