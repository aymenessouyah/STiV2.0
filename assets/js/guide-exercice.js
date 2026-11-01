/* ═══════════════════════════════════════════════════════════════════════════
   STI V2.0 — v614 « GUIDE EXERCICE »

   Consigne du professeur : « créer une partie du tableau de bord nommée
   guide exercice : l'admin peut choisir d'afficher ou non les corrections
   ainsi les vidéos de chaque exercice. »

   Ce fichier est la MOITIÉ ÉLÈVE du dispositif. Il ne fait que lire un
   réglage public et l'appliquer à la page d'exercice ouverte :

     1. le réglage est une ligne de `app_config_public` (id = "guide_exercice"),
        donc lisible sans compte : même un élève non connecté voit la même
        chose sur tous ses appareils ;
     2. le réglage est mis en cache 10 minutes sur l'appareil (léger, et la
        page s'affiche tout de suite même hors ligne) ;
     3. deux interrupteurs, un défaut général et des exceptions par exercice :
          { corrections: true, videos: true,
            parExercice: { "exercices/sql/atelier1.html": { corrections: false } } }
     4. en cas de doute (réseau muet, réglage absent), on AFFICHE : on ne
        cache jamais un corrigé par accident.

   Aucune donnée n'est écrite ici. Aucune page n'est modifiée en profondeur :
   on masque, on ne supprime pas — le contenu reste dans le document, donc
   réapparaît dès que le professeur réactive.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (global) {
  "use strict";
  if (global.STIGuideExercice && global.STIGuideExercice.version) return;

  var VERSION = "v614";
  var ID_CONFIG = "guide_exercice";
  var CLE_CACHE = "sti-guide-exercice-v1";
  var DUREE_CACHE_MS = 10 * 60 * 1000;

  /* Sélecteurs volontairement larges : les 72 pages d'exercices sont des pages
     historiques, écrites à la main, sans attribut commun. On reconnaît donc un
     bloc de correction par son identifiant, sa classe, son texte ou son lien. */
  var SELECTEURS_CORRECTION = [
    "[data-sti-correction]",
    "[id*='correction' i]",
    "[class*='correction' i]",
    "[id*='corrige' i]",
    "[class*='corrige' i]",
    "[id*='solution' i]",
    "[class*='solution' i]",
    "a[href*='correction' i]",
    "a[href*='corrige' i]",
    "a[href*='solution' i]"
  ];
  var SELECTEURS_VIDEO = [
    "[data-sti-video]",
    "[data-video-open]",
    "video",
    "iframe[src*='youtube']",
    "iframe[src*='vimeo']",
    "a[href$='.mp4' i]",
    "[class*='capsule']"
  ];

  var config = null;          /* réglage retenu (objet normalisé) */
  var promesse = null;

  function normaliser(brut) {
    var o = brut && typeof brut === "object" ? brut : {};
    var parExercice = {};
    if (o.parExercice && typeof o.parExercice === "object" && !Array.isArray(o.parExercice)) {
      Object.keys(o.parExercice).forEach(function (cle) {
        var v = o.parExercice[cle];
        if (!v || typeof v !== "object") return;
        var propre = {};
        if (typeof v.corrections === "boolean") propre.corrections = v.corrections;
        if (typeof v.videos === "boolean") propre.videos = v.videos;
        if (Object.keys(propre).length) parExercice[String(cle)] = propre;
      });
    }
    return {
      /* Par défaut tout est visible : on n'a jamais caché un corrigé avant la v614. */
      corrections: typeof o.corrections === "boolean" ? o.corrections : true,
      videos: typeof o.videos === "boolean" ? o.videos : true,
      parExercice: parExercice,
      maj: typeof o.maj === "string" ? o.maj : "",
      version: VERSION
    };
  }

  /* Chemin de la page en cours, relatif à la racine du site, sans « ./ ». */
  function cheminCourant() {
    try {
      var p = String(global.location.pathname || "");
      var i = p.indexOf("/exercices/");
      if (i !== -1) return p.slice(i + 1);
      return p.replace(/^\/+/, "");
    } catch (e) {
      return "";
    }
  }

  /* Réglage EFFECTIF pour une page : exception de l'exercice, sinon le défaut. */
  function configEffectif(chemin, base) {
    var c = base ? normaliser(base) : (config || normaliser(null));
    var propre = c.parExercice[chemin] ||
      /* tolérance : la clé peut avoir été saisie avec ou sans « ./ » */
      c.parExercice["./" + chemin] ||
      c.parExercice[chemin.replace(/^\.\//, "")] ||
      null;
    if (!propre) return { corrections: c.corrections, videos: c.videos, exception: false };
    return {
      corrections: typeof propre.corrections === "boolean" ? propre.corrections : c.corrections,
      videos: typeof propre.videos === "boolean" ? propre.videos : c.videos,
      exception: true
    };
  }

  function lireCache() {
    try {
      var brut = global.localStorage ? global.localStorage.getItem(CLE_CACHE) : null;
      if (!brut) return null;
      var o = JSON.parse(brut);
      if (!o || !o.ts || (Date.now() - Number(o.ts)) > DUREE_CACHE_MS) return null;
      return o.valeur || null;
    } catch (e) { return null; }
  }

  function ecrireCache(valeur) {
    try {
      if (global.localStorage) {
        global.localStorage.setItem(CLE_CACHE, JSON.stringify({ ts: Date.now(), valeur: valeur }));
      }
    } catch (e) {}
  }

  function urlApi() {
    var a = global.STI_AUTH || {};
    if (!a.URL || !a.CLE) return "";
    return a.URL + "/rest/v1/app_config_public?select=value&id=eq." + ID_CONFIG;
  }

  /* Lecture du réglage : cache d'abord (immédiat), réseau ensuite (10 min). */
  function charger(options) {
    var forcer = Boolean(options && options.forcer);
    if (config && !forcer) return Promise.resolve(config);
    if (promesse && !forcer) return promesse;
    var cache = forcer ? null : lireCache();
    if (cache) {
      config = normaliser(cache);
      return Promise.resolve(config);
    }
    var url = urlApi();
    if (!url || !global.fetch) {
      config = normaliser(null);
      return Promise.resolve(config);
    }
    promesse = global.fetch(url, { headers: { apikey: (global.STI_AUTH || {}).CLE } })
      .then(function (r) { return r && r.ok ? r.json() : []; })
      .then(function (lignes) {
        var valeur = lignes && lignes[0] && lignes[0].value;
        config = normaliser(valeur);
        ecrireCache(valeur || {});
        promesse = null;
        return config;
      })
      .catch(function () {
        /* Réseau muet : on garde le défaut « tout visible ». */
        config = normaliser(null);
        promesse = null;
        return config;
      });
    return promesse;
  }

  /* Un élément est-il visible dans la page ? (pour ne pas masquer un parent
     entièrement vide, ni toucher un bloc déjà caché par la page elle-même) */
  function visible(el) {
    try {
      return !!(el && el.offsetParent !== null);
    } catch (e) {
      return !!el;
    }
  }

  function marquerMasque(el, genre) {
    if (!el || el.getAttribute("data-sti-guide-masque")) return;
    el.setAttribute("data-sti-guide-masque", genre);
    el.setAttribute("hidden", "hidden");
    el.style.display = "none";
  }

  function rassembler(selecteurs) {
    var trouves = [];
    selecteurs.forEach(function (sel) {
      var liste;
      try { liste = global.document.querySelectorAll(sel); } catch (e) { liste = []; }
      Array.prototype.forEach.call(liste || [], function (el) {
        if (trouves.indexOf(el) === -1) trouves.push(el);
      });
    });
    /* On ne garde que les blocs dont le parent immédiat n'est pas déjà retenu :
       masquer le parent suffit, et évite de poser 40 attributs pour rien. */
    return trouves.filter(function (el) {
      for (var i = 0; i < trouves.length; i++) {
        if (trouves[i] !== el && trouves[i].contains(el)) return false;
      }
      return true;
    });
  }

  function afficherBandeau(reg, nbCaches) {
    var doc = global.document;
    if (!doc || !doc.body || !nbCaches) return;
    if (doc.getElementById("sti-guide-bandeau")) return;
    var b = doc.createElement("div");
    b.id = "sti-guide-bandeau";
    b.setAttribute("role", "status");
    b.style.cssText = "position:fixed;left:12px;bottom:12px;z-index:2147482000;" +
      "background:#fffdf7;color:#23201a;border:2px solid #23201a;border-radius:12px;" +
      "box-shadow:3px 3px 0 #23201a;padding:8px 12px;font:800 12.5px/1.35 system-ui,'Segoe UI',sans-serif;" +
      "max-width:min(360px,92vw)";
    var quoi = [];
    if (!reg.corrections) quoi.push("les corrections");
    if (!reg.videos) quoi.push("les vidéos");
    b.textContent = "🔒 " + quoi.join(" et ") + " de cet exercice sont masquées par le professeur.";
    /* Refermable : l'élève peut ranger le message, la page reste inchangée. */
    var x = doc.createElement("button");
    x.type = "button";
    x.textContent = "✕";
    x.setAttribute("aria-label", "Masquer ce message");
    x.style.cssText = "margin-left:8px;border:0;background:transparent;font:900 13px system-ui;cursor:pointer;color:#23201a";
    x.addEventListener("click", function () { if (b.parentNode) b.parentNode.removeChild(b); });
    b.appendChild(x);
    doc.body.appendChild(b);
  }

  /* Applique le réglage à la page ouverte. Idempotent : rappelable sans dégât. */
  function appliquer(base) {
    var doc = global.document;
    if (!doc) return { corrections: 0, videos: 0 };
    var reg = configEffectif(cheminCourant(), base || config);
    var nbCorr = 0, nbVideo = 0;
    if (!reg.corrections) {
      rassembler(SELECTEURS_CORRECTION).forEach(function (el) {
        if (!visible(el)) return;
        marquerMasque(el, "correction");
        nbCorr += 1;
      });
    }
    if (!reg.videos) {
      rassembler(SELECTEURS_VIDEO).forEach(function (el) {
        if (!visible(el)) return;
        marquerMasque(el, "video");
        nbVideo += 1;
      });
    }
    if (nbCorr || nbVideo) afficherBandeau(reg, nbCorr + nbVideo);
    return { corrections: nbCorr, videos: nbVideo };
  }

  /* Démarrage : cache immédiat puis réseau, sans jamais bloquer l'affichage. */
  function demarrer() {
    appliquer(config || lireCache() || null);
    charger().then(function (c) { appliquer(c); });
  }

  global.STIGuideExercice = {
    version: VERSION,
    idConfig: ID_CONFIG,
    cleCache: CLE_CACHE,
    normaliser: normaliser,
    configEffectif: configEffectif,
    cheminCourant: cheminCourant,
    charger: charger,
    appliquer: appliquer,
    selecteursCorrection: SELECTEURS_CORRECTION,
    selecteursVideo: SELECTEURS_VIDEO,
    __ecrireCache: ecrireCache,
    __lireCache: lireCache
  };

  if (global.document) {
    if (global.document.readyState === "loading") {
      global.document.addEventListener("DOMContentLoaded", demarrer);
    } else {
      demarrer();
    }
  }
})(typeof window !== "undefined" ? window : this);
