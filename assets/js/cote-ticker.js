/* STI by AE — « La Cote » : bandeau type tableau de bourse (page d'accueil) + régie mobile.
   Sources des news, par ordre de préférence : 1) liste saisie par l'admin (table app_config_public,
   ligne « ticker_news », couverte de couleur) ; 2) dernieres lignes du README ; 3) secours intégré.
   Cotations tech : STI_COTE ci-dessous (une seule source de vérité).
   Aucune dépendance externe. */
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
  function couleurSure(c) {
    return /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(String(c || "")) ? c : "#fbbf24";
  }
  function itemTech(t) {
    var it = span("cote-item", "");
    it.appendChild(span("cote-sym", t.nom, "color:" + t.couleur));
    it.appendChild(span("cote-up", "\u25b2 " + t.cote));
    it.appendChild(span("cote-det", t.det));
    return it;
  }
  function itemNews(n) {
    var it = span("cote-item", "");
    it.appendChild(span("cote-news", "\ud83d\udd14 " + n.t, "color:" + couleurSure(n.c)));
    return it;
  }
  function construireGroupe(news) {
    var g = document.createDocumentFragment();
    g.appendChild(span("cote-sec", "DERNI\u00c8RES NOUVELLES"));
    news.forEach(function (n) { g.appendChild(itemNews(n)); });
    g.appendChild(span("cote-sec", "CORBEILLE TECH \u00b7 COT\u00c9E AU " + STI_COTE.maj));
    STI_COTE.tech.forEach(function (t) { g.appendChild(itemTech(t)); });
    return g;
  }
  /* Rendu continu droite → gauche : la piste = deux moitiés identiques, chaque moitié répétée
     assez de fois pour dépasser la largeur d'écran (pas de trou même avec deux news seulement). */
  function render(news) {
    var moitie = 1;
    function reconstruire() {
      while (piste.firstChild) piste.removeChild(piste.firstChild);
      var i;
      for (i = 0; i < moitie; i++) piste.appendChild(construireGroupe(news));
      for (i = 0; i < moitie; i++) {
        var g = construireGroupe(news);
        g.setAttribute("aria-hidden", "true");
        piste.appendChild(g);
      }
    }
    if (reduce) {
      while (piste.firstChild) piste.removeChild(piste.firstChild);
      piste.appendChild(construireGroupe(news));
      return;
    }
    var cible = Math.max((window.innerWidth || 900) * 1.15, 480);
    reconstruire();
    requestAnimationFrame(function () {
      while (moitie < 4 && (piste.scrollWidth || 0) / 2 < cible) { moitie++; reconstruire(); }
      var demi = Math.max((piste.scrollWidth || 0) / 2, 1);
      piste.style.animationDuration = Math.max(26, Math.round(demi / 55)) + "s";
    });
  }

  function normaliser(l) {
    if (!l || !l.length) return null;
    var out = [];
    for (var i = 0; i < l.length && out.length < 12; i++) {
      var t = String((l[i] && l[i].t) || "").replace(/\s+/g, " ").trim().slice(0, 140);
      if (t) out.push({ t: t, c: couleurSure(l[i].c) });
    }
    return out.length ? out : null;
  }
  function lireAdmin(cb) {
    var a = window.STI_AUTH || {};
    if (!a.URL || !a.CLE || !window.fetch) { cb(null); return; }
    fetch(a.URL + "/rest/v1/app_config_public?select=value&id=eq.ticker_news", {
      headers: { apikey: a.CLE, Accept: "application/json", "Cache-Control": "no-cache" },
      cache: "no-store"
    })
      .then(function (r) { return r && r.ok ? r.json() : []; })
      .then(function (rows) {
        var v = rows && rows[0] && rows[0].value;
        cb(normaliser(v && v.liste));
      })
      .catch(function () { cb(null); });
  }
  function lireReadme(cb) {
    if (!window.fetch) { cb([]); return; }
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
          return { t: ver + " \u2014 " + desc, c: "#fbbf24" };
        }).filter(function (o) { return o.t.length > 8; });
        cb(cinq);
      })
      .catch(function () { cb([]); });
  }
  function demarrer() {
    render(STI_COTE.news_secours.map(function (t) { return { t: t, c: "#fbbf24" }; }));
    lireAdmin(function (liste) {
      if (liste) { render(liste); return; }
      lireReadme(function (n) {
        if (n.length) render(n);
      });
    });
  }
  /* v404 : retour d'onglet = relecture des news — après un enregistrement dans l'admin,
     le bandeau se met à jour sans recharger la page. */
  var rafraichir = function () {
    lireAdmin(function (liste) { if (liste) render(liste); });
  };
  try {
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) rafraichir();
    });
  } catch (e) {}

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", demarrer);
  else demarrer();
})();
