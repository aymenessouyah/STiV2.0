/* STI v2 — configuration d'accès (Supabase) */
window.STI_AUTH = {
  URL: "https://vywujxmepvcbgedgmger.supabase.co",
  CLE: "sb_publishable_FI5FimytONd5VdWK6GfXLA_I6vPTrvn",
  CLE_TURNSTILE: "0x4AAAAAAFeMDzetHdIs1MmC",
  VERSION: 335,
  RACINE: (typeof location !== "undefined" && location.origin && location.origin !== "null")
    ? (function () {
        /* v417 : l'ancien regex ne connaissait qu'une liste de pages ; toute page utilitaire
           hors liste (glossaire, nouveautes, memo-veille, revision-erreurs…) produisait
           « …/glossaire.html/ » et les redirections/acces de acces.js tombaient dans un 404.
           Nouveau calcul général : on coupe au premier segment de section connu ; sinon on
           retire simplement le nom de fichier. Les cas listés avant gardent le même résultat. */
        var pn = String(location.pathname || "").replace(/(\.html?)\/+$/i, "$1");
        var m = pn.match(/^(.*?)\/(?:cours|exercices|projets|documents|annexes|quiz|cssanimee|Positionnement-animee|tests)\//);
        var base = m ? m[1] + "/" : pn.slice(0, pn.lastIndexOf("/") + 1);
        return location.origin + base;
      })()
    : "./",
  ADMIN: "aymenessouyah@gmail.com"
};

/* v441 : si Supabase renvoie un lien « mot de passe oublié » sur Site URL (index.html ou une autre
   page au lieu de portail.html), transférer immédiatement ?search et #hash intacts vers portail.html
   avant que acces.js ne restaure une ancienne session ou n'écrase les jetons avec #connexion. */
(function () {
  try {
    if (typeof location === "undefined" || !/^https?:$/.test(location.protocol)) return;
    var pn = String(location.pathname || "").replace(/\/+$/, "");
    if (pn.indexOf("/tests/") !== -1 || /(^|\/)portail(\.html)?$/i.test(pn)) return;
    var qs = new URLSearchParams(location.search || "");
    var hs = new URLSearchParams((location.hash || "").replace(/^#/, ""));
    var errCode = String(qs.get("error_code") || hs.get("error_code") || "");
    var errDesc = String(qs.get("error_description") || hs.get("error_description") || "");
    var estRecup = qs.get("mode") === "recovery" ||
      qs.get("type") === "recovery" ||
      hs.get("type") === "recovery" ||
      Boolean(qs.get("token_hash") || hs.get("token_hash")) ||
      Boolean(hs.get("access_token") && hs.get("refresh_token")) ||
      /^(otp_expired|otp_disabled|flow_state_expired|flow_state_not_found|bad_code_verifier)$/i.test(errCode) ||
      Boolean((qs.get("error") === "access_denied" || hs.get("error") === "access_denied") && /otp|expired|token|recovery/i.test(errDesc));
    if (estRecup && window.STI_AUTH && window.STI_AUTH.RACINE) {
      location.replace(window.STI_AUTH.RACINE + "portail.html" + (location.search || "") + (location.hash || ""));
    }
  } catch (e) {}
})();

/* v413 — barre de navigation mobile en bas d'écran (Accueil · Exercices · Quiz · Autres).
   Le chargeur vit ici car config.js est le seul script présent sur TOUTES les pages du site :
   rien à toucher dans les 33 fichiers HTML. Toute la logique est dans assets/js/mobile-nav.js
   (chargé seulement en http/https ; la barre ne s'affiche qu'en dessous de 700 px). */
(function () {
  try {
    if (!/^https?:$/.test(location.protocol)) return;
    if (window.__STI_BNAV || document.getElementById("sti-bnav")) return;
    var s = document.createElement("script");
    var base = "./";
    try {
      var pn = String(location.pathname || "").replace(/(\.html?)\/+$/i, "$1");
      var m = pn.match(/^(.*?)\/(?:cours|exercices|projets|documents|annexes|quiz|cssanimee|Positionnement-animee|tests)\//);
      base = m ? location.origin + m[1] + "/" : location.origin + pn.slice(0, pn.lastIndexOf("/") + 1);
    } catch (e) {}
    s.src = base + "assets/js/mobile-nav.js?v=464";
    s.async = true;
    (document.head || document.documentElement).appendChild(s);
  } catch (e) {}
})();

/* v421 (consigne auteur n°5) : « la barre du bas disparaît un instant quand on choisit un
   bouton ». Entre le rendu d'une nouvelle page et l'injection de la barre par mobile-nav.js,
   une bande vide occupait le bas de l'écran. Comme config.js est un script bloquant présent
   sur toutes les pages, il peint dès le parsing le GABARIT de la barre mémorisé à la visite
   précédente (couleurs, hauteur, bordure réelles — non cliquable) ; mobile-nav.js l'efface à
   l'instant où la vraie barre est installée, donc aucun flash. Pages exclues : tableau de bord
   et harnais de tests (mêmes règles que le module) ; sous 700 px seulement ; repli total si
   rien n'a été mémorisé — la page est alors exactement comme avant. */
(function () {
  try {
    if (!/^https?:$/.test(location.protocol)) return;
    if (window.__STI_BNAV || document.getElementById("sti-bnav")) return;
    if (!window.matchMedia || !window.matchMedia("(max-width: 700px)").matches) return;
    /* v425 : <head> porte déjà le gabarit (sti-early-boot) -> on ne le peint pas deux fois. */
    if (document.getElementById("sti-bnav-skel")) return;
    var pn = location.pathname;
    if (pn.indexOf("/tests/") !== -1) return;
    if (/(^|\/)admin(\.html)?$/i.test(pn.replace(/\/$/, ""))) return;
    var d = JSON.parse(localStorage.getItem("sti-bnav-skel") || "null");
    if (!d || !d.h || typeof d.f !== "string" || !/^#[0-9a-f]{3,8}$|^rgba?\(/i.test(d.f)) return;
    if (Date.now() - (d.t || 0) > 45 * 24 * 3600 * 1000) return;
    var head = document.head || document.documentElement;
    var style = document.createElement("style");
    style.id = "sti-bnav-skel-css";
    style.textContent = "@media (max-width:700px){html:not(.sti-bnav-on) #sti-bnav-skel{display:block;position:fixed;left:0;right:0;bottom:0;height:" + d.h + "px;background:" + d.f + ";border-top:" + (d.brd || "1.5px") + " solid " + (d.b || "#e7d9bd") + ";z-index:2147483000;pointer-events:none}}";
    var sk = document.createElement("div");
    sk.id = "sti-bnav-skel";
    sk.setAttribute("aria-hidden", "true");
    head.appendChild(style);
    /* En tête de document, <body> n'existe pas encore : on greffe le gabarit sur <html>,
       le navigateur le peint quand même (position:fixed) et mobile-nav.js l'effacera. */
    (document.body || document.documentElement).appendChild(sk);
    setTimeout(function () {
      try {
        if (!document.getElementById("sti-bnav")) {
          var a = document.getElementById("sti-bnav-skel"); if (a) a.remove();
          var c = document.getElementById("sti-bnav-skel-css"); if (c) c.remove();
        }
      } catch (e) {}
    }, 5000);
  } catch (e) {}
})();

/* v465 — Navigation retour instantanée vers l'accueil (bfcache 0 ms, zéro rechargement complet) :
   Quand l'élève ouvre un cours, un exercice ou un quiz depuis index.html puis clique sur « Retour »,
   « Accueil », « Cours » ou « Quiz », remonter directement à l'entrée index.html déjà présente dans
   l'historique de l'onglet (history.go(-delta)) au lieu d'empiler et recharger un nouveau document
   complet (~1,8 Mo de HTML/JS/CSS). Au réveil bfcache (pageshow), index.html se positionne sur la
   section demandée (#modules, #cours, haut de page) et rafraîchit instantanément les badges locaux. */
(function () {
  try {
    if (typeof window === "undefined" || typeof location === "undefined" || !/^https?:$/.test(location.protocol)) return;
    if (window.__STI_FAST_HOME_V465) return;
    window.__STI_FAST_HOME_V465 = true;

    var pnInit = String(location.pathname || "");
    if (pnInit.indexOf("/tests/") !== -1) return;
    if (/(^|\/)(admin|portail)(\.html)?$/i.test(pnInit.replace(/\/+$/, ""))) return;

    var racUrl = new URL((window.STI_AUTH && window.STI_AUTH.RACINE) || "./", location.href);
    var racPath = racUrl.pathname.replace(/\/+$/, "") + "/";

    function estUrlAccueilRacine(u) {
      if (!u || u.origin !== racUrl.origin) return false;
      var p = String(u.pathname || "").replace(/(\.html?)\/+$/i, "$1");
      return p === racPath || p === racPath.slice(0, -1) || p === racPath + "index.html";
    }
    function estUrlSeriesExercices(u) {
      if (!u || u.origin !== racUrl.origin) return false;
      var p = String(u.pathname || "").replace(/(\.html?)\/+$/i, "$1");
      return p === racPath + "exercices/series-exercices.html";
    }
    function estUrlExclueHop(u) {
      if (!u || u.origin !== racUrl.origin) return true;
      var p = String(u.pathname || "").replace(/\/+$/, "");
      return /(^|\/)(admin|portail)(\.html)?$/i.test(p) || p.indexOf("/tests/") !== -1;
    }

    var surAccueil = estUrlAccueilRacine(location);
    var surSeries = !surAccueil && estUrlSeriesExercices(location);

    function appliquerAncreRetourHub(cleSession, etatPatch) {
      var hCible = "";
      try {
        hCible = sessionStorage.getItem(cleSession) || "";
        if (hCible) sessionStorage.removeItem(cleSession);
      } catch (e) {}
      if (!hCible) return false;
      try {
        var st = Object.assign({}, (history && history.state) || {}, etatPatch || {});
        if (hCible === "#top") {
          if (location.hash) history.replaceState(st, "", location.pathname + (location.search || ""));
          window.scrollTo(0, 0);
        } else {
          var idSec = hCible.replace(/^#/, "");
          var secEl = idSec ? document.getElementById(idSec) : null;
          if (location.hash !== hCible) {
            history.replaceState(st, "", location.pathname + (location.search || "") + hCible);
          }
          if (secEl && typeof secEl.scrollIntoView === "function") {
            secEl.scrollIntoView({ block: "start", behavior: "auto" });
          }
        }
      } catch (e2) {}
      return true;
    }

    function appliquerAncreRetourAccueil() {
      return appliquerAncreRetourHub("sti-retour-accueil-hash", { __stiHome: 1, __stiHop: 0 });
    }

    if (surAccueil) {
      var marquerAccueilActif = function () {
        try {
          var stAct = Object.assign({}, (history && history.state) || {}, { __stiHome: 1, __stiHop: 0 });
          history.replaceState(stAct, "");
          sessionStorage.setItem("sti-home-active", "1");
          sessionStorage.setItem("sti-home-hop", "0");
          sessionStorage.removeItem("sti-series-active");
          sessionStorage.removeItem("sti-series-hop");
        } catch (e) {}
      };
      marquerAccueilActif();
      window.addEventListener("hashchange", marquerAccueilActif);
      window.addEventListener("popstate", marquerAccueilActif);
      window.addEventListener("pageshow", function (ev) {
        marquerAccueilActif();
        var aBouge = appliquerAncreRetourAccueil();
        if ((ev && ev.persisted) || aBouge) {
          try { window.dispatchEvent(new CustomEvent("sti-accueil-restored", { detail: { persisted: Boolean(ev && ev.persisted) } })); } catch (eEv) {}
        }
      });
      return;
    }

    /* Sur une page secondaire (cours, quiz, exercices, annexes…) : calculer la distance exacte vers index.html et vers series-exercices.html */
    var curHop = 0;
    var curSeriesHop = 0;
    try {
      if (history.state && typeof history.state.__stiHop === "number" && history.state.__stiHop > 0) {
        curHop = history.state.__stiHop;
      } else if (sessionStorage.getItem("sti-home-active") === "1" && document.referrer) {
        var refU = new URL(document.referrer, location.href);
        if (!estUrlExclueHop(refU)) {
          if (estUrlAccueilRacine(refU)) {
            curHop = 1;
          } else {
            var prevH = parseInt(sessionStorage.getItem("sti-home-hop") || "0", 10) || 0;
            curHop = prevH > 0 ? prevH + 1 : 0;
          }
        }
      }
      if (surSeries) {
        curSeriesHop = 0;
        var stSer = Object.assign({}, history.state || {}, { __stiSeries: 1, __stiSeriesHop: 0 });
        if (curHop > 0) stSer.__stiHop = curHop;
        history.replaceState(stSer, "");
        sessionStorage.setItem("sti-series-active", "1");
        sessionStorage.setItem("sti-series-hop", "0");
      } else {
        if (history.state && typeof history.state.__stiSeriesHop === "number" && history.state.__stiSeriesHop > 0) {
          curSeriesHop = history.state.__stiSeriesHop;
        } else if (sessionStorage.getItem("sti-series-active") === "1" && document.referrer) {
          var refS = new URL(document.referrer, location.href);
          if (!estUrlExclueHop(refS)) {
            if (estUrlSeriesExercices(refS)) {
              curSeriesHop = 1;
            } else {
              var prevSH = parseInt(sessionStorage.getItem("sti-series-hop") || "0", 10) || 0;
              curSeriesHop = prevSH > 0 ? prevSH + 1 : 0;
            }
          }
        }
        var stSub = Object.assign({}, history.state || {});
        if (curHop > 0) stSub.__stiHop = curHop;
        if (curSeriesHop > 0) stSub.__stiSeriesHop = curSeriesHop;
        if (curHop > 0 || curSeriesHop > 0) {
          history.replaceState(stSub, "");
        }
        if (curSeriesHop > 0) sessionStorage.setItem("sti-series-hop", String(curSeriesHop));
        else sessionStorage.removeItem("sti-series-hop");
      }
      if (curHop > 0) {
        sessionStorage.setItem("sti-home-hop", String(curHop));
      } else {
        sessionStorage.removeItem("sti-home-hop");
      }
    } catch (eHop) {}

    window.addEventListener("popstate", function () {
      try {
        if (history.state && typeof history.state.__stiHop === "number") {
          curHop = history.state.__stiHop;
          sessionStorage.setItem("sti-home-hop", String(curHop));
        }
        if (surSeries) {
          curSeriesHop = 0;
          sessionStorage.setItem("sti-series-active", "1");
          sessionStorage.setItem("sti-series-hop", "0");
        } else if (history.state && typeof history.state.__stiSeriesHop === "number") {
          curSeriesHop = history.state.__stiSeriesHop;
          sessionStorage.setItem("sti-series-hop", String(curSeriesHop));
        }
      } catch (e) {}
    });
    window.addEventListener("hashchange", function () {
      try {
        var patch = Object.assign({}, history.state || {});
        var doitRemplacer = false;
        if (!history.state || typeof history.state.__stiHop !== "number") {
          if (curHop > 0) {
            curHop += 1;
            patch.__stiHop = curHop;
            doitRemplacer = true;
            sessionStorage.setItem("sti-home-hop", String(curHop));
          }
        } else {
          curHop = history.state.__stiHop;
          sessionStorage.setItem("sti-home-hop", String(curHop));
        }
        if (surSeries) {
          curSeriesHop = 0;
          patch.__stiSeries = 1;
          patch.__stiSeriesHop = 0;
          doitRemplacer = true;
          sessionStorage.setItem("sti-series-active", "1");
          sessionStorage.setItem("sti-series-hop", "0");
        } else if (!history.state || typeof history.state.__stiSeriesHop !== "number") {
          if (curSeriesHop > 0) {
            curSeriesHop += 1;
            patch.__stiSeriesHop = curSeriesHop;
            doitRemplacer = true;
            sessionStorage.setItem("sti-series-hop", String(curSeriesHop));
          }
        } else {
          curSeriesHop = history.state.__stiSeriesHop;
          sessionStorage.setItem("sti-series-hop", String(curSeriesHop));
        }
        if (doitRemplacer) history.replaceState(patch, "");
      } catch (e) {}
    });
    window.addEventListener("pageshow", function (ev) {
      try {
        if (history.state && typeof history.state.__stiHop === "number" && history.state.__stiHop > 0) {
          curHop = history.state.__stiHop;
          sessionStorage.setItem("sti-home-hop", String(curHop));
        }
        if (surSeries) {
          curSeriesHop = 0;
          sessionStorage.setItem("sti-series-active", "1");
          sessionStorage.setItem("sti-series-hop", "0");
          var patchSer = { __stiSeries: 1, __stiSeriesHop: 0 };
          if (curHop > 0) patchSer.__stiHop = curHop;
          var aBougeS = appliquerAncreRetourHub("sti-retour-series-hash", patchSer);
          if ((ev && ev.persisted) || aBougeS) {
            try { window.dispatchEvent(new CustomEvent("sti-series-restored", { detail: { persisted: Boolean(ev && ev.persisted) } })); } catch (eEvS) {}
          }
        } else if (history.state && typeof history.state.__stiSeriesHop === "number" && history.state.__stiSeriesHop > 0) {
          curSeriesHop = history.state.__stiSeriesHop;
          sessionStorage.setItem("sti-series-hop", String(curSeriesHop));
        }
      } catch (e) {}
    });

    function calculerDeltaVersAccueil() {
      try {
        if (window.navigation && typeof window.navigation.entries === "function" && window.navigation.currentEntry) {
          var entries = window.navigation.entries();
          var idxCur = window.navigation.currentEntry.index;
          for (var i = idxCur - 1; i >= 0; i--) {
            if (entries[i] && entries[i].url && estUrlAccueilRacine(new URL(entries[i].url, location.href))) {
              return i - idxCur;
            }
          }
          return 0;
        }
      } catch (eNav) {}
      var h = (history.state && typeof history.state.__stiHop === "number") ? history.state.__stiHop : curHop;
      if (h >= 1 && history.length > h) return -h;
      return 0;
    }

    function calculerDeltaVersSeries() {
      try {
        if (window.navigation && typeof window.navigation.entries === "function" && window.navigation.currentEntry) {
          var entries = window.navigation.entries();
          var idxCur = window.navigation.currentEntry.index;
          for (var i = idxCur - 1; i >= 0; i--) {
            if (entries[i] && entries[i].url && estUrlSeriesExercices(new URL(entries[i].url, location.href))) {
              return i - idxCur;
            }
          }
          return 0;
        }
      } catch (eNavS) {}
      var hs = (history.state && typeof history.state.__stiSeriesHop === "number") ? history.state.__stiSeriesHop : curSeriesHop;
      if (hs >= 1 && history.length > hs) return -hs;
      return 0;
    }

    window.addEventListener("click", function (ev) {
      if (ev.defaultPrevented || ev.button !== 0) return;
      if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
      var el = ev.target;
      var a = el && el.closest ? el.closest("a[href]") : null;
      if (!a || a.hasAttribute("download")) return;
      var tgt = String(a.getAttribute("target") || "").trim().toLowerCase();
      if (tgt && tgt !== "_self" && !(tgt === "_top" && window === window.top)) return;
      var rawHref = a.getAttribute("href") || "";
      if (!rawHref || rawHref.charAt(0) === "#" || /^javascript:/i.test(rawHref)) return;
      var uCible = null;
      try { uCible = new URL(rawHref, location.href); } catch (eU) { return; }
      if (uCible.search) return;

      var cleHash = "";
      var delta = 0;
      if (estUrlAccueilRacine(uCible)) {
        delta = calculerDeltaVersAccueil();
        cleHash = "sti-retour-accueil-hash";
      } else if (!surSeries && estUrlSeriesExercices(uCible)) {
        delta = calculerDeltaVersSeries();
        cleHash = "sti-retour-series-hash";
      } else {
        return;
      }
      if (delta >= 0) {
        if (window.opener && !window.opener.closed && history.length <= 2) {
          ev.preventDefault();
          try { sessionStorage.setItem(cleHash, uCible.hash && uCible.hash.length > 1 ? uCible.hash : "#top"); } catch (eOpS) {}
          try { window.opener.focus(); } catch (eOpF) {}
          try { window.close(); } catch (eOpC) {}
          setTimeout(function () {
            try { if (!window.closed) location.href = uCible.href; } catch (eOpNav) {}
          }, 120);
        }
        return;
      }

      /* Laisser tout onclick synchrone de la balise <a> (ex. write-ahead des quiz) s'exécuter,
         tout en bloquant le rechargement complet du document et en remontant via bfcache. */
      ev.preventDefault();
      try {
        sessionStorage.setItem(cleHash, uCible.hash && uCible.hash.length > 1 ? uCible.hash : "#top");
      } catch (eSt) {}
      Promise.resolve().then(function () {
        history.go(delta);
      });
    }, true);
  } catch (e) {}
})();

/* v466 : État PWA unifié sur tout le site — interception immédiate de la bulle native
   « Installer cette application » et mémorisation définitive dès que l'application est installée. */
(function () {
  try {
    if (typeof window === "undefined") return;

    function modeAutonomeActif() {
      try {
        if (window.matchMedia && window.matchMedia("(display-mode: standalone), (display-mode: fullscreen), (display-mode: window-controls-overlay), (display-mode: minimal-ui)").matches) {
          return true;
        }
      } catch (eM) {}
      try {
        if (typeof navigator !== "undefined" && navigator.standalone === true) return true;
      } catch (eN) {}
      try {
        if (typeof document !== "undefined" && String(document.referrer || "").indexOf("android-app://") === 0) return true;
      } catch (eR) {}
      return false;
    }

    function marquerInstalleeGlobale() {
      window.__stiDeferredInstallPrompt = null;
      try {
        localStorage.setItem("sti-pwa-installed", "1");
        localStorage.setItem("sti-pwa-installee", "1");
        localStorage.setItem("sti-install-fab", "off");
        localStorage.setItem("sti-pwa-bulle-vue", "1");
        localStorage.setItem("sti-pwa-pan-vu", "1");
      } catch (eS) {}
      try {
        if (typeof CustomEvent === "function" && typeof window.dispatchEvent === "function") {
          window.dispatchEvent(new CustomEvent("sti:pwa-installee"));
        }
      } catch (eE) {}
    }

    function pwaEstInstalleeGlobale() {
      if (modeAutonomeActif()) {
        marquerInstalleeGlobale();
        return true;
      }
      try {
        return localStorage.getItem("sti-pwa-installed") === "1" ||
          localStorage.getItem("sti-pwa-installee") === "1";
      } catch (eL) {
        return false;
      }
    }

    window.__stiMarquerPwaInstallee = marquerInstalleeGlobale;
    window.__stiPwaEstInstallee = pwaEstInstalleeGlobale;

    if (modeAutonomeActif()) {
      marquerInstalleeGlobale();
    } else if (typeof navigator !== "undefined" && typeof navigator.getInstalledRelatedApps === "function") {
      navigator.getInstalledRelatedApps().then(function (apps) {
        if (apps && apps.length) marquerInstalleeGlobale();
      }).catch(function () {});
    }

    if (typeof window.addEventListener === "function") {
      window.addEventListener("beforeinstallprompt", function (ev) {
        if (ev && typeof ev.preventDefault === "function") ev.preventDefault();
        if (pwaEstInstalleeGlobale()) {
          window.__stiDeferredInstallPrompt = null;
          return;
        }
        window.__stiDeferredInstallPrompt = ev;
      });
      window.addEventListener("appinstalled", function () {
        marquerInstalleeGlobale();
      });
    }
  } catch (e) {}
})();

/* v475 — Préchargement anticipé intelligent au survol / toucher (instant-page local STI) :
   Dès que l'élève survole une carte de cours/quiz/exercice pendant >= 75 ms ou pose le doigt
   (pointerdown / touchstart, 120–250 ms avant le clic effectif), injecte un <link rel="prefetch">
   vers la page HTML interne cible (plafonné à 8 URL uniques, désactivé en économie de données / 2G,
   jamais vers admin/portail/médias lourds). Le document cible est déjà chaud en mémoire au clic. */
(function () {
  try {
    if (typeof window === "undefined" || typeof document === "undefined" || typeof location === "undefined") return;
    if (!/^https?:$/.test(location.protocol)) return;
    if (window.__STI_PREFETCH_NAV_V475) return;
    if (String(location.pathname || "").indexOf("/tests/") !== -1) return;
    var conn = navigator && (navigator.connection || navigator.mozConnection || navigator.webkitConnection);
    if (conn && (conn.saveData || /(^|-)2g$/i.test(String(conn.effectiveType || "")))) return;

    var deja = Object.create(null);
    var nbPrefetch = 0;
    var MAX_PREFETCH = 8;
    var hoverTimer = null;
    var hoverHref = "";

    function urlPrefetchableSTI(el) {
      if (!el || typeof el.closest !== "function") return "";
      var a = el.closest("a[href]");
      if (!a || a.hasAttribute("download")) return "";
      var tgt = String(a.getAttribute("target") || "").toLowerCase();
      if (tgt && tgt !== "_self") return "";
      var raw = String(a.getAttribute("href") || "").trim();
      if (!raw || raw.charAt(0) === "#" || /^(javascript|mailto|tel|data|blob):/i.test(raw)) return "";
      var u;
      try { u = new URL(raw, location.href); } catch (eU) { return ""; }
      if (u.origin !== location.origin) return "";
      if (u.pathname === location.pathname && u.search === location.search) return "";
      if (/(^|\/)(admin|portail)(\.html)?$/i.test(u.pathname.replace(/\/+$/, "")) || u.pathname.indexOf("/tests/") !== -1) return "";
      if (/\.(mp4|webm|mp3|ogg|wav|pdf|zip|rar|7z|png|jpe?g|gif|webp|svg|ico|woff2?)$/i.test(u.pathname)) return "";
      if (!/(\.html?|\/)$/i.test(u.pathname)) return "";
      u.hash = "";
      return u.href;
    }

    function declencherPrefetchSTI(href) {
      if (!href || deja[href] || nbPrefetch >= MAX_PREFETCH) return;
      deja[href] = 1;
      nbPrefetch++;
      try {
        var lnk = document.createElement("link");
        lnk.rel = "prefetch";
        lnk.as = "document";
        lnk.href = href;
        (document.head || document.documentElement).appendChild(lnk);
      } catch (eL) {}
    }

    window.__STI_PREFETCH_NAV_V475 = {
      urlPrefetchableSTI: urlPrefetchableSTI,
      declencherPrefetchSTI: declencherPrefetchSTI,
      _deja: deja
    };

    document.addEventListener("pointerdown", function (ev) {
      var h = urlPrefetchableSTI(ev && ev.target);
      if (h) declencherPrefetchSTI(h);
    }, { passive: true });

    document.addEventListener("pointerover", function (ev) {
      if (ev && ev.pointerType && ev.pointerType !== "mouse") return;
      var h = urlPrefetchableSTI(ev && ev.target);
      if (!h || deja[h]) return;
      if (hoverHref === h) return;
      if (hoverTimer) clearTimeout(hoverTimer);
      hoverHref = h;
      hoverTimer = setTimeout(function () {
        hoverTimer = null;
        declencherPrefetchSTI(h);
      }, 75);
    }, { passive: true });

    document.addEventListener("pointerout", function (ev) {
      if (!hoverTimer) return;
      var rel = ev && ev.relatedTarget;
      if (rel && urlPrefetchableSTI(rel) === hoverHref) return;
      clearTimeout(hoverTimer);
      hoverTimer = null;
      hoverHref = "";
    }, { passive: true });
  } catch (e) {}
})();


