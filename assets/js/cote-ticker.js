/* STI by AE — « La Cote » : bandeau type tableau de bourse (page d'accueil) + régie mobile.
   Sources des news, par ordre de préférence : 1) liste saisie par l'admin (table app_config_public,
   ligne « ticker_news », couverte de couleur) ; 2) dernieres lignes du README ; 3) secours intégré.
   Cotations tech : STI_COTE ci-dessous (une seule source de vérité).
   Aucune dépendance externe. */
(function () {
  "use strict";

  /* v408 : plus de déplacement JS sous le hero — sur mobile le bandeau était poussé
     hors du premier écran (y≈1135) et les news devenaient invisibles. Il reste en
     haut de page sur TOUTES les tailles ; le CSS ≤700px en fait une carte compacte. */

  var MOTEUR = "v410"; /* visible dans le bandeau : permet de vérifier d’un coup d’œil que l’élève (ou l’admin) fait bien tourner la version du jour */
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
    if (news && news.length) {
      g.appendChild(span("cote-sec", "DERNI\u00c8RES NOUVELLES"));
      news.forEach(function (n) { g.appendChild(itemNews(n)); });
    }
    g.appendChild(span("cote-sec", "CORBEILLE TECH \u00b7 MOTEUR " + MOTEUR + " \u00b7 COT\u00c9E AU " + STI_COTE.maj));
    STI_COTE.tech.forEach(function (t) { g.appendChild(itemTech(t)); });
    return g;
  }
  /* Sens (v409, retour usage) : droite → gauche. Piste = deux moitiés identiques, chaque moitié répétée
     assez de fois pour dépasser la largeur d'écran (pas de trou même avec deux news seulement). */
  function render(news) {
    var moitie = 1;
    function reconstruire() {
      while (piste.firstChild) piste.removeChild(piste.firstChild);
      var i;
      for (i = 0; i < moitie; i++) piste.appendChild(construireGroupe(news));
      for (i = 0; i < moitie; i++) {
        var g = construireGroupe(news);
        /* v408 : setAttribute est interdit sur un DocumentFragment (TypeError en vrai
           navigateur) — on marque chaque enfant de la moitié dupliquée, un par un. */
        var kids = g.childNodes ? Array.prototype.slice.call(g.childNodes) : [];
        for (var k = 0; k < kids.length; k++) { try { kids[k].setAttribute("aria-hidden", "true"); } catch (e0) {} }
        piste.appendChild(g);
      }
    }
    if (reduce) {
      while (piste.firstChild) piste.removeChild(piste.firstChild);
      piste.appendChild(construireGroupe(news));
      return;
    }
    var cible = Math.max((window.innerWidth || 900) * 1.15, 480);
    try { reconstruire(); } catch (errR) {
      /* le bandeau doit vivre même si une reconstruite échoue : rendu simple en secours */
      while (piste.firstChild) piste.removeChild(piste.firstChild);
      piste.appendChild(construireGroupe(news));
    }
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
    var fait = false;
    var once = function (x) { if (!fait) { fait = true; cb(x); } };
    var opts = {
      headers: { apikey: a.CLE, Accept: "application/json", "Cache-Control": "no-cache" },
      cache: "no-store"
    };
    try {
      if (typeof AbortController !== "undefined") {
        var ctl = new AbortController();
        opts.signal = ctl.signal;
        setTimeout(function () { try { ctl.abort(); } catch (e) {} }, 3500);
      }
    } catch (e) {}
    fetch(a.URL + "/rest/v1/app_config_public?select=value&id=eq.ticker_news", opts)
      .then(function (r) { return r && r.ok ? r.json() : []; })
      .then(function (rows) {
        var v = rows && rows[0] && rows[0].value;
        once({ liste: normaliser(v && v.liste), actif: !(v && v.actif === false) });
      })
      .catch(function () { once(null); });
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
    /* v407 : premier cadre = corbeille tech seule, sans aucun « vieux texte ».
       Les news de la régie glissent dedans dès réception ; en cas d'échec réseau,
       le repli README/secours s'affiche à la place (et jamais avant la réponse). */
    render(null);
    var secouru = false;
    function secoursRapide() {
      if (secouru) return;
      secouru = true;
      lireReadme(function (n) {
        if (n.length) render(n);
        else render(STI_COTE.news_secours.map(function (t) { return { t: t, c: "#fbbf24" }; }));
      });
    }
    var delai = setTimeout(secoursRapide, 3500);
    lireAdmin(function (etat) {
      clearTimeout(delai);
      if (etat) {
        if (etat.actif === false) { render(null); return; }
        if (etat.liste) { render(etat.liste); return; }
      }
      secoursRapide();
    });
  }
  /* v404 : retour d'onglet = relecture des news — après un enregistrement dans l'admin,
     le bandeau se met à jour sans recharger la page. */
  var rafraichir = function () {
    lireAdmin(function (etat) {
      if (!etat) return;
      if (etat.actif === false) { render(null); return; }
      if (etat.liste) render(etat.liste);
    });
  };
  try {
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) rafraichir();
    });
  } catch (e) {}

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", demarrer);
  else demarrer();
})();
