/* STI by AE — v496 : « News de ma classe », le bandeau personnalisé de l'accueil.
   Il remplace « La Cote » et se place sur la ligne juste après « Bonjour, prénom ».
   L'admin choisit la classe (3e SI ou 4e SI) puis saisit texte 1, texte 2, … depuis
   son tableau de bord. Stockage : table app_config_public, ligne id = "ticker_news"
   (même ligne publique que l'ancienne régie, nouveau format) :
     { actif: true, classes: { "3si": ["texte 1", "texte 2"], "4si": ["…"] }, maj: 1699… }
   Lecture seule côté élève, aucune dépendance externe.
   Le fond, la typographie et le défilement reprennent exactement ceux de l'ancien
   bandeau (variables --cote-* et animation cote-defile de theme.css). */
(function () {
  "use strict";

  var CLE_CACHE = "sti-news-perso-v1";
  var LIGNE_CONFIG = "ticker_news";
  var MAX_TEXTES = 12;
  var MAX_CARACTERES = 140;
  var DUREE_CACHE = 300000; /* 5 min : l'admin enregistre, l'élève voit au retour d'onglet */

  var barre = document.getElementById("bandeauNewsPerso");
  if (!barre) return;

  var piste = document.getElementById("newsPersoPiste");
  var etiquette = document.getElementById("newsPersoEtiquette");
  var reduce = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);

  /* ---------- Classe de l'élève : 4e SI (vert) ou 3e SI (bleu) ---------- */
  function classeCourante() {
    try {
      var cache = window.STI_AUTH && window.STI_AUTH.CACHE_SESSION;
      if (cache) return String(cache.classe || "");
    } catch (e) {}
    try {
      var brut = sessionStorage.getItem("sti-session-cache") || localStorage.getItem("sti-session-cache");
      var o = brut ? JSON.parse(brut) : null;
      if (o && o.classe) return String(o.classe);
    } catch (e) {}
    return "";
  }
  function niveau() {
    /* acces.js pose cette classe dès la lecture de la session, avant le rendu. */
    if (document.documentElement && document.documentElement.classList.contains("sti-4si-autorise")) return "4si";
    var c = classeCourante().toUpperCase().replace(/[\s._-]+/g, "");
    if (/^4(E|ÈME)?SI/.test(c) || c.indexOf("4SI") === 0) return "4si";
    return "3si";
  }
  function libelleNiveau(n) {
    return n === "4si" ? "4e SI" : "3e SI";
  }

  /* ---------- Lecture des textes de la classe ---------- */
  function textePropre(v) {
    return String(v == null ? "" : v).replace(/\s+/g, " ").trim().slice(0, MAX_CARACTERES);
  }
  function listePropre(l) {
    var out = [];
    (Array.isArray(l) ? l : []).forEach(function (x) {
      var t = textePropre(x && typeof x === "object" ? (x.t || x.texte || "") : x);
      if (t) out.push(t);
    });
    return out.slice(0, MAX_TEXTES);
  }
  function normaliser(valeur) {
    var v = valeur && typeof valeur === "object" ? valeur : {};
    var classes = v.classes && typeof v.classes === "object" ? v.classes : null;
    var parClasse = { "3si": [], "4si": [] };
    var communs = [];
    if (classes) {
      parClasse["3si"] = listePropre(classes["3si"] || classes["3e"] || classes["3eme"]);
      parClasse["4si"] = listePropre(classes["4si"] || classes["4e"] || classes["4eme"]);
    } else if (Array.isArray(v.liste)) {
      /* Ancien format (liste unique avec couleurs) : les textes restent visibles
         pour les deux classes jusqu'au prochain enregistrement de l'admin. */
      communs = listePropre(v.liste);
    }
    return { actif: v.actif !== false, parClasse: parClasse, communs: communs };
  }
  function textesPour(etat, n) {
    if (!etat) return [];
    var liste = (etat.parClasse[n] || []).concat(etat.communs || []);
    var vus = {};
    return liste.filter(function (t) {
      if (vus[t]) return false;
      vus[t] = 1;
      return true;
    }).slice(0, MAX_TEXTES);
  }

  /* ---------- Rendu du tapis défilant (même moteur que l'ancien bandeau) ---------- */
  function item(texte) {
    var s = document.createElement("span");
    s.className = "news-perso-item";
    s.textContent = "📣 " + texte;
    return s;
  }
  function construireGroupe(textes) {
    var g = document.createDocumentFragment();
    textes.forEach(function (t) { g.appendChild(item(t)); });
    return g;
  }
  function rendre(textes) {
    var n = niveau();
    barre.dataset.classe = n;
    if (etiquette) etiquette.textContent = libelleNiveau(n);
    if (!piste) return;
    while (piste.firstChild) piste.removeChild(piste.firstChild);
    if (!textes || !textes.length) {
      barre.hidden = true;
      barre.setAttribute("aria-hidden", "true");
      return;
    }
    barre.hidden = false;
    barre.removeAttribute("aria-hidden");
    barre.setAttribute("aria-label", "News de la " + libelleNiveau(n) + " : " + textes.join(" · "));

    if (reduce) {
      piste.appendChild(construireGroupe(textes));
      return;
    }
    var moitie = 1;
    function reconstruire() {
      while (piste.firstChild) piste.removeChild(piste.firstChild);
      var i;
      for (i = 0; i < moitie; i++) piste.appendChild(construireGroupe(textes));
      for (i = 0; i < moitie; i++) {
        var g = construireGroupe(textes);
        /* Un DocumentFragment n'accepte pas setAttribute : on marque chaque enfant. */
        var kids = g.childNodes ? Array.prototype.slice.call(g.childNodes) : [];
        for (var k = 0; k < kids.length; k++) { try { kids[k].setAttribute("aria-hidden", "true"); } catch (e0) {} }
        piste.appendChild(g);
      }
    }
    var cible = Math.max((window.innerWidth || 900) * 1.15, 480);
    try { reconstruire(); } catch (errR) {
      while (piste.firstChild) piste.removeChild(piste.firstChild);
      piste.appendChild(construireGroupe(textes));
    }
    requestAnimationFrame(function () {
      while (moitie < 4 && (piste.scrollWidth || 0) / 2 < cible) { moitie++; reconstruire(); }
      var demi = Math.max((piste.scrollWidth || 0) / 2, 1);
      piste.style.animationDuration = Math.max(26, Math.round(demi / 55)) + "s";
    });
  }

  /* ---------- Réseau : lecture publique, cache court ---------- */
  function lireCache() {
    try {
      var mem = JSON.parse(sessionStorage.getItem(CLE_CACHE) || "null");
      if (mem && mem.ts && Date.now() - mem.ts < DUREE_CACHE && mem.etat) return mem.etat;
    } catch (e) {}
    return null;
  }
  function ecrireCache(etat) {
    try { sessionStorage.setItem(CLE_CACHE, JSON.stringify({ ts: Date.now(), etat: etat })); } catch (e) {}
  }
  function appliquer(etat) {
    var n = niveau();
    var textes = etat && etat.actif === false ? [] : textesPour(etat, n);
    rendre(textes);
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
    fetch(a.URL + "/rest/v1/app_config_public?select=value&id=eq." + LIGNE_CONFIG, opts)
      .then(function (r) { return r && r.ok ? r.json() : []; })
      .then(function (rows) {
        var etat = normaliser(rows && rows[0] && rows[0].value);
        ecrireCache(etat);
        once(etat);
      })
      .catch(function () { once(null); });
  }

  function demarrer(fort) {
    if (!fort) {
      var mem = lireCache();
      if (mem) { appliquer(mem); return; }
    }
    lireAdmin(function (etat) {
      if (etat) { appliquer(etat); return; }
      var secours = lireCache();
      appliquer(secours || { actif: false, parClasse: { "3si": [], "4si": [] }, communs: [] });
    });
  }

  /* Retour d'onglet : l'admin enregistre, l'élève voit la mise à jour sans recharger. */
  try {
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) demarrer(false);
    });
  } catch (e) {}

  window.STINewsPerso = {
    recharger: function () { demarrer(true); },
    niveau: niveau,
    textes: function (etat) { return textesPour(normaliser(etat), niveau()); },
    normaliser: normaliser
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { demarrer(false); });
  else demarrer(false);
})();
