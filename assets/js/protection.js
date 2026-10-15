/* ══════════════════════════════════════════════════════════
   🔒 Protection du contenu & verrouillage du code source — Plateforme STI par A. Essouyah
   - Code source (Ctrl+U, F12, Ctrl+Shift+I/J/C/K, Ctrl+S, clic droit,
     bouclier Anti-Inspecteur) verrouillé pour 100 % des abonnés
     (y compris les comptes 👑 Gold et la classe elevelabo3).
   - 👑 Comptes GOLD & elevelabo3 : seules la copie de texte (Ctrl+C),
     l'impression (Ctrl+P) et la capture d'écran du cours sont autorisées.
   - Seul l'Administrateur (aymenessouyah@gmail.com) dispose d'un accès
     technique complet.
   ══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var MSG_PROTECT =
    "\uD83D\uDD12 Contenu protégé \u00A9 A. Essouyah \u2014 copie et captures non autorisées";
  var MSG_SOURCE_BLOQUE =
    "\uD83D\uDEE1\uFE0F Code source et inspecteur verrouillés \u00A9 A. Essouyah";

  /* 1) Détecte si l'utilisateur connecté est strictement l'Administrateur (aymenessouyah@gmail.com) */
  function estAdminStrict() {
    try {
      if (window.__STI_ADMIN_STRICT === true) return true;
      if (window.top && window.top !== window && window.top.__STI_ADMIN_STRICT === true) return true;
      var adminEmail = (
        (window.STI_AUTH && window.STI_AUTH.ADMIN) ||
        "aymenessouyah@gmail.com"
      ).trim().toLowerCase();

      var cSess = null;
      try {
        cSess = JSON.parse(localStorage.getItem("sti-session-cache") || "null");
      } catch (e) {}
      if (cSess && cSess.isAdmin === true && String(cSess.email || "").trim().toLowerCase() === adminEmail) {
        localStorage.setItem("sti-admin-gold", "1");
        localStorage.setItem("sti-gold", "1");
        window.__STI_ADMIN_STRICT = true;
        return true;
      }

      /* Vérifier en priorité le jeton du projet STI V2.0 */
      var cleProjet = "sb-vywujxmepvcbgedgmger-auth-token";
      var valProjet = (localStorage.getItem(cleProjet) || "").toLowerCase();
      if (valProjet && valProjet !== "null") {
        if (valProjet.indexOf(adminEmail) !== -1) {
          localStorage.setItem("sti-admin-gold", "1");
          localStorage.setItem("sti-gold", "1");
          window.__STI_ADMIN_STRICT = true;
          return true;
        }
        if (valProjet.indexOf("@") !== -1 || valProjet.indexOf("access_token") !== -1) {
          localStorage.removeItem("sti-admin-gold");
          return false;
        }
      }

      var tokenAdmin = false;
      var tokenNonAdmin = false;
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i) || "";
        if (k.indexOf("sb-") === 0 && k.indexOf("-auth-token") !== -1) {
          var v = (localStorage.getItem(k) || "").toLowerCase();
          if (v && v !== "null") {
            if (v.indexOf(adminEmail) !== -1) {
              tokenAdmin = true;
              break;
            } else if (v.indexOf("@") !== -1 || v.indexOf("access_token") !== -1) {
              tokenNonAdmin = true;
            }
          }
        }
      }
      if (tokenAdmin) {
        localStorage.setItem("sti-admin-gold", "1");
        localStorage.setItem("sti-gold", "1");
        window.__STI_ADMIN_STRICT = true;
        return true;
      }
      if (tokenNonAdmin) {
        localStorage.removeItem("sti-admin-gold");
        return false;
      }
      if (localStorage.getItem("sti-admin-gold") === "1" && (!cSess || cSess.isAdmin !== false)) {
        return true;
      }
    } catch (e) {}
    return false;
  }

  /* 2) Détecte si l'utilisateur bénéficie du statut 👑 Gold (impression / copie de texte / capture) */
  function estGoldActif() {
    try {
      if (estAdminStrict()) return true;
      if (window.__STI_GOLD === true) return true;
      if (window.top && window.top !== window && window.top.__STI_GOLD === true) return true;
      var permLab = JSON.parse(localStorage.getItem("sti-labo3-permanent") || "null");
      var cSess = permLab || JSON.parse(localStorage.getItem("sti-session-cache") || "null");
      if (cSess) {
        var clNorm = String(cSess.classe || "").trim().toLowerCase();
        try { clNorm = clNorm.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); } catch (e) {}
        clNorm = clNorm.replace(/[\s._\-]+/g, "");
        if (cSess.gold === true || cSess.isAdmin === true || clNorm === "elevelabo3" || /\|\s*GOLD$/i.test(cSess.lycee || "")) {
          localStorage.setItem("sti-gold", "1");
          window.__STI_GOLD = true;
          return true;
        }
        /* Si une session active est présente et n'est ni Gold ni elevelabo3, nettoyer tout sti-gold résiduel */
        localStorage.removeItem("sti-gold");
        return false;
      }
      if (localStorage.getItem("sti-gold") === "1") return true;
    } catch (e) {}
    return false;
  }

  function trouverIframePdfOuverte() {
    try {
      var iframes = document.querySelectorAll("iframe");
      for (var i = 0; i < iframes.length; i++) {
        var fr = iframes[i];
        var src = fr.getAttribute("src") || fr.src || "";
        if (/\.pdf(\.html)?($|[?#])/i.test(src) && fr.offsetParent !== null && fr.contentWindow) {
          return fr;
        }
      }
    } catch (e) {}
    return null;
  }

  function estPagePdfDoc() {
    try {
      return /\.pdf\.html($|[?#])/i.test((location.pathname || "") + (location.href || ""));
    } catch (e) {
      return false;
    }
  }

  function synchroniserDomGold() {
    var okGold = estGoldActif();
    var okAdmin = estAdminStrict();
    var okPdf = estPagePdfDoc();
    if (document.documentElement) {
      document.documentElement.classList.toggle("sti-gold", okGold);
      document.documentElement.classList.toggle("sti-admin-strict", okAdmin);
      document.documentElement.classList.toggle("sti-pdf-doc", okPdf);
    }
    if (document.body) {
      document.body.classList.toggle("sti-gold", okGold);
      document.body.classList.toggle("sti-admin-strict", okAdmin);
      document.body.classList.toggle("sti-pdf-doc", okPdf);
    }

    /* Note : protection.css reste TOUJOURS active pour maintenir le bouclier Anti-Inspecteur (#sti-devtools-overlay) et #sti-toast */
    var wm = document.getElementById("sti-watermark");
    var pm = document.getElementById("sti-print-msg");
    if (okGold || okPdf) {
      if (pm && pm.parentNode) pm.parentNode.removeChild(pm);
    }
    if (okGold) {
      if (wm && wm.parentNode) wm.parentNode.removeChild(wm);
      var stOvr = document.getElementById("sti-gold-override");
      if (!stOvr && document.head) {
        stOvr = document.createElement("style");
        stOvr.id = "sti-gold-override";
        stOvr.textContent =
          "html.sti-gold body,html.sti-gold body *,body.sti-gold,body.sti-gold *{-webkit-user-select:text!important;-moz-user-select:text!important;user-select:text!important}" +
          "#sti-watermark,#sti-print-msg{display:none!important}" +
          "@media print{.sti-no-print,#sti-watermark,#sti-print-msg,#sti-devtools-overlay,#sti-toast{display:none!important}}";
        document.head.appendChild(stOvr);
      }
    } else {
      var stOvrOff = document.getElementById("sti-gold-override");
      if (stOvrOff && stOvrOff.parentNode) stOvrOff.parentNode.removeChild(stOvrOff);
      if (document.body) {
        installWatermark();
        if (!okPdf) installPrintBlock();
      }
    }
    return okGold;
  }

  /* Exécution immédiate dès le chargement du script */
  synchroniserDomGold();

  window.addEventListener("storage", function (e) {
    if (e && (e.key === "sti-gold" || e.key === "sti-admin-gold")) {
      synchroniserDomGold();
    }
  });
  window.addEventListener("beforeprint", function () {
    synchroniserDomGold();
  });

  var dernierSignalTs = 0;
  var devtoolsEtaitOuvert = false;
  function signalerTentativeCodeSource(motif) {
    if (estAdminStrict() || window.origin === "null") return;
    var now = Date.now();
    if (now - dernierSignalTs < 1200) return;
    dernierSignalTs = now;
    try {
      var cibles = [window];
      if (window.top && window.top !== window) cibles.push(window.top);
      cibles.forEach(function (w) {
        try {
          w.dispatchEvent(new CustomEvent("sti:tentative-securite", {
            detail: { motif: motif, page: (location.pathname || "").split("/").pop() || "index.html", ts: now }
          }));
        } catch (e) {}
      });
    } catch (e) {}
  }
  var toastEl = null;
  var toastTimer = null;
  function toast(msg, forcerAffichage) {
    if (!forcerAffichage && estGoldActif()) return;
    if (!document.body) return;
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.id = "sti-toast";
      toastEl.setAttribute("role", "status");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg || MSG_PROTECT;
    toastEl.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove("visible");
    }, 2600);
  }

  /* ─────────────────────────────────────────────
     1) Clic droit bloqué pour TOUS les abonnés (empêche « Afficher le code source » et « Inspecter »)
     ───────────────────────────────────────────── */
  document.addEventListener(
    "contextmenu",
    function (e) {
      if (estAdminStrict()) return;
      var t = e.target;
      if (t && t.closest && t.closest("input, textarea, [contenteditable='true'], #sti-messenger-eleve, #sti-messenger-admin, #sti-messenger-admin-site")) return;
      e.preventDefault();
      e.stopPropagation();
      toast(MSG_SOURCE_BLOQUE, true);
    },
    true
  );

  /* ─────────────────────────────────────────────
     2) Copier / couper bloqués (sauf Admin / Compte GOLD)
     ───────────────────────────────────────────── */
  ["copy", "cut"].forEach(function (evt) {
    document.addEventListener(evt, function (e) {
      if (synchroniserDomGold()) return;
      var t = e.target;
      if (t && t.closest && t.closest("input, textarea, [contenteditable='true']")) return;
      e.preventDefault();
      toast(MSG_PROTECT, false);
    });
  });

  /* ─────────────────────────────────────────────
     3) Raccourcis clavier bloqués :
        - Pour TOUS les abonnés (y compris Gold & elevelabo3) :
          F12 · Ctrl/Cmd+U (code source) · Ctrl/Cmd+S (enregistrer HTML) ·
          Ctrl/Cmd+Shift+I/J/C/K/E/M (Inspecteur/Console) · Alt+Cmd+I/J/C/U · Shift+F10
        - Pour les abonnés standards (non Gold) :
          PrintScreen · Ctrl/Cmd+P/C/X/A
     ───────────────────────────────────────────── */
  window.addEventListener(
    "keydown",
    function (e) {
      if (estAdminStrict()) return;

      var k = (e.key || "").toLowerCase();
      var code = e.keyCode || e.which || 0;
      var mod = e.ctrlKey || e.metaKey;

      /* Raccourcis d'accès au code source et aux outils de développement : bloqués pour 100 % des abonnés */
      var estRaccourciCodeSource =
        k === "f12" ||
        code === 123 ||
        k === "contextmenu" ||
        (e.shiftKey && k === "f10") ||
        (mod && (k === "u" || k === "s")) ||
        (mod && e.shiftKey && (k === "i" || k === "j" || k === "c" || k === "k" || k === "e" || k === "m")) ||
        (e.metaKey && e.altKey && (k === "i" || k === "j" || k === "c" || k === "u"));

      if (estRaccourciCodeSource) {
        e.preventDefault();
        e.stopPropagation();
        if (k === "f12" || code === 123 || (mod && k === "u") || (mod && e.shiftKey) || (e.metaKey && e.altKey)) {
          signalerTentativeCodeSource("Raccourci code source / inspecteur (" + (e.ctrlKey ? "Ctrl+" : "") + (e.shiftKey ? "Shift+" : "") + k.toUpperCase() + ")");
        }
        toast(MSG_SOURCE_BLOQUE, true);
        return false;
      }

      /* Raccourcis de copie / impression / capture : autorisés uniquement pour les comptes Gold */
      if (synchroniserDomGold()) return;

      var bloqueStandard = false;
      if (k === "printscreen" || code === 44) {
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText("").catch(function () {});
          }
        } catch (err) {}
        toast("\uD83D\uDEAB Capture d'écran non autorisée \u2014 contenu protégé", true);
        bloqueStandard = true;
      } else if (mod && (k === "p" || k === "c" || k === "x" || k === "a")) {
        if (k === "p") {
          if (estPagePdfDoc()) {
            /* Tous les liens et pages PDF (.pdf.html) peuvent être imprimés par tout le monde */
            return;
          }
          var frPdf = trouverIframePdfOuverte();
          if (frPdf) {
            e.preventDefault();
            e.stopPropagation();
            try { frPdf.contentWindow.focus(); frPdf.contentWindow.print(); } catch (err) {}
            return false;
          }
        }
        var t = e.target;
        var dansChamp = t && t.closest && t.closest("input, textarea, [contenteditable='true']");
        if (!dansChamp || k === "p") {
          bloqueStandard = true;
        }
      }

      if (bloqueStandard) {
        e.preventDefault();
        e.stopPropagation();
        if (k !== "printscreen") toast(MSG_PROTECT, false);
        return false;
      }
    },
    true
  );

  /* ─────────────────────────────────────────────
     4) Glisser-déposer bloqué
     ───────────────────────────────────────────── */
  document.addEventListener("dragstart", function (e) {
    if (estAdminStrict()) return;
    e.preventDefault();
  });

  /* ─────────────────────────────────────────────
     5) Filigrane + message d'impression (uniquement comptes standards hors pages PDF)
     ───────────────────────────────────────────── */
  function installWatermark() {
    if (estGoldActif() || !document.body) return;
    if (document.getElementById("sti-watermark")) return;
    var wm = document.createElement("div");
    wm.id = "sti-watermark";
    wm.setAttribute("aria-hidden", "true");
    document.body.appendChild(wm);
  }

  function installPrintBlock() {
    if (estGoldActif() || estPagePdfDoc() || !document.body) return;
    if (document.getElementById("sti-print-msg")) return;
    var box = document.createElement("div");
    box.id = "sti-print-msg";
    box.innerHTML =
      '<div class="sti-print-ico" aria-hidden="true">\uD83D\uDD12</div>' +
      '<div class="sti-print-title">Contenu protégé \u00A9 A. Essouyah</div>' +
      '<div class="sti-print-txt">' +
      "L\u2019impression et la capture d\u2019écran de cette plateforme ne sont pas autoris\u00E9es." +
      "<br>Consultez le cours directement sur la plateforme STI V2.0." +
      "</div>";
    document.body.appendChild(box);
  }

  /* ─────────────────────────────────────────────
     6) Nettoyage de tout overlay résiduel (pas de fausse détection par taille de fenêtre / DPI / zoom)
     ───────────────────────────────────────────── */
  function checkDevtools() {
    var exOv = document.getElementById("sti-devtools-overlay");
    if (exOv) {
      exOv.classList.remove("visible");
      if (exOv.parentNode) exOv.parentNode.removeChild(exOv);
    }
    if (document.documentElement) {
      document.documentElement.classList.remove("sti-devtools-open");
    }
  }

  /* ─────────────────────────────────────────────
     7) Masquage de l'adresse GitHub en haut sur PC (pour 100 % des comptes, y compris admin, Prof, elevelabo3 et élèves)
     ───────────────────────────────────────────── */
  function estAppareilPC() {
    try {
      var ua = navigator.userAgent || "";
      if (/Android|iPhone|iPad|iPod|Mobile/i.test(ua)) return false;
      if (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) return false;
      return (window.innerWidth || screen.width || 1024) > 768;
    } catch (e) {
      return false;
    }
  }

  function obtenirRacineSite() {
    try {
      if (window.STI_AUTH && window.STI_AUTH.RACINE) return window.STI_AUTH.RACINE;
      if (location.origin && location.origin !== "null") {
        return (
          location.origin +
          location.pathname
            .replace(/\/(?:cours|exercices|projets|documents|annexes|quiz|cssanimee|Positionnement-animee)(?:\/.*)?$|\/?(?:portail|admin|index|carte-visite|bac-pratique|404|series-exercices|PHP-recap)(?:\.html)?.*$/i, "")
            .replace(/\/?$/, "/")
        );
      }
    } catch (e) {}
    return "./";
  }

  function activerPleinEcranSansAdressePC(forcer) {
    try {
      if (!estAppareilPC()) return;
      if (window.self !== window.top) return;
      if (!forcer && localStorage.getItem("sti-pc-fullscreen-off") === "1") return;
      document.documentElement.classList.add("sti-kiosk-css-full");
      majBoutonPleinEcranPC();
    } catch (e) {}
  }

  window.basculerPleinEcranSansAdressePC = function (btnEl) {
    try {
      var docEl = document.documentElement;
      var dejaActif = docEl.classList.contains("sti-kiosk-css-full");
      if (dejaActif) {
        localStorage.setItem("sti-pc-fullscreen-off", "1");
        docEl.classList.remove("sti-kiosk-css-full");
      } else {
        localStorage.removeItem("sti-pc-fullscreen-off");
        docEl.classList.add("sti-kiosk-css-full");
      }
      majBoutonPleinEcranPC();
    } catch (e) {}
  };

  function majBoutonPleinEcranPC() {
    try {
      var btn = document.getElementById("sti-btn-pc-fullscreen");
      if (!btn) return;
      var actif = document.documentElement.classList.contains("sti-kiosk-css-full") || Boolean(document.__stiCssFsEl);
      if (actif) {
        btn.style.background = "#177245";
        btn.style.color = "#ffffff";
        btn.innerHTML = "⛶ <span>Plein écran actif</span>";
      } else {
        btn.style.background = "#fffdf7";
        btn.style.color = "#23201a";
        btn.innerHTML = "⛶ <span>Sans adresse</span>";
      }
    } catch (e) {}
  }

  function installerPleinEcranSansAdresseGitHub() {
    try {
      if (window.__stiSafeFullscreenInstalled) return;
      window.__stiSafeFullscreenInstalled = true;

      if (document.head && !document.getElementById("sti-safe-fs-style")) {
        var stFs = document.createElement("style");
        stFs.id = "sti-safe-fs-style";
        stFs.textContent =
          "video::-webkit-media-controls-fullscreen-button { display: none !important; }" +
          ".sti-css-fullscreen-target {" +
          "  position: fixed !important; inset: 0 !important; left: 0 !important; top: 0 !important;" +
          "  width: 100vw !important; height: 100dvh !important; max-width: 100vw !important; max-height: 100dvh !important;" +
          "  margin: 0 !important; border-radius: 0 !important; z-index: 2147483640 !important;" +
          "  box-sizing: border-box !important; overflow: auto !important;" +
          "}" +
          ".sti-video-modal-card.sti-css-fullscreen-target {" +
          "  background: #0a0f1d !important; padding: 8px 12px !important;" +
          "}" +
          ".sti-video-modal-card.sti-css-fullscreen-target video {" +
          "  max-height: calc(100dvh - 68px) !important; height: calc(100dvh - 68px) !important;" +
          "}";
        document.head.appendChild(stFs);
      }

      function activerCssFsSur(el) {
        var cible = (el && el !== document.documentElement && el !== document.body) ? el : document.documentElement;
        if (document.__stiCssFsEl && document.__stiCssFsEl !== cible) {
          document.__stiCssFsEl.classList.remove("sti-css-fullscreen-target");
        }
        document.__stiCssFsEl = cible;
        if (cible !== document.documentElement) {
          cible.classList.add("sti-css-fullscreen-target");
        } else {
          document.documentElement.classList.add("sti-kiosk-css-full");
        }
        if (window.self !== window.top) {
          try {
            window.parent.postMessage({ type: "STI_IFRAME_CSS_FS", active: true }, "*");
          } catch (e) {}
        }
        try {
          document.dispatchEvent(new Event("fullscreenchange"));
        } catch (e2) {}
        majBoutonPleinEcranPC();
        return Promise.resolve();
      }

      function quitterCssFs() {
        /* Si une vraie session plein écran native était ouverte par le navigateur, la fermer */
        try {
          if (origExitFs && ( origFsDesc ? origFsDesc.get.call(document) : false )) {
            origExitFs.call(document);
          }
        } catch (e) {}
        if (document.__stiCssFsEl) {
          try {
            document.__stiCssFsEl.classList.remove("sti-css-fullscreen-target");
          } catch (e2) {}
          document.__stiCssFsEl = null;
        }
        document.documentElement.classList.remove("sti-kiosk-css-full");
        if (window.self !== window.top) {
          try {
            window.parent.postMessage({ type: "STI_IFRAME_CSS_FS", active: false }, "*");
          } catch (e3) {}
        }
        try {
          document.dispatchEvent(new Event("fullscreenchange"));
        } catch (e4) {}
        majBoutonPleinEcranPC();
        return Promise.resolve();
      }

      var origExitFs = document.exitFullscreen || document.webkitExitFullscreen;
      var origFsDesc = Object.getOwnPropertyDescriptor(Document.prototype, "fullscreenElement") ||
                       Object.getOwnPropertyDescriptor(document, "fullscreenElement");

      /* Surcharger requestFullscreen / webkitRequestFullscreen / webkitEnterFullscreen pour empêcher Chrome/Safari mobile d'afficher la bannière d'adresse native */
      if (typeof Element !== "undefined" && Element.prototype) {
        Element.prototype.requestFullscreen = function () {
          return activerCssFsSur(this);
        };
        Element.prototype.webkitRequestFullscreen = Element.prototype.requestFullscreen;
        Element.prototype.msRequestFullscreen = Element.prototype.requestFullscreen;
      }
      if (typeof HTMLVideoElement !== "undefined" && HTMLVideoElement.prototype) {
        HTMLVideoElement.prototype.webkitEnterFullscreen = function () {
          var card = this.closest ? (this.closest(".sti-video-modal-card, .sti-video-pas-a-pas-box") || this) : this;
          return activerCssFsSur(card);
        };
        HTMLVideoElement.prototype.webkitEnterFullScreen = HTMLVideoElement.prototype.webkitEnterFullscreen;
      }
      document.exitFullscreen = quitterCssFs;
      document.webkitExitFullscreen = quitterCssFs;
      try {
        Object.defineProperty(document, "fullscreenElement", {
          configurable: true,
          get: function () { return document.__stiCssFsEl || null; }
        });
        Object.defineProperty(document, "webkitFullscreenElement", {
          configurable: true,
          get: function () { return document.__stiCssFsEl || null; }
        });
      } catch (e) {}

      window.addEventListener("message", function (ev) {
        if (!ev || !ev.data || ev.data.type !== "STI_IFRAME_CSS_FS") return;
        var iframes = document.querySelectorAll("iframe");
        for (var i = 0; i < iframes.length; i++) {
          if (iframes[i].contentWindow === ev.source) {
            var box = iframes[i].closest(".anim-box, .modal-box") || iframes[i];
            if (ev.data.active) {
              activerCssFsSur(box);
            } else {
              quitterCssFs();
            }
            break;
          }
        }
      });
    } catch (e) {}
  }

  function installerMasquageAdressePC() {
    try {
      var racine = obtenirRacineSite();
      /* 1. Assurer que <link rel="manifest"> est présent sur 100 % des pages pour éviter toute barre d'URL hors-scope dans la PWA sur PC */
      if (document.head && !document.querySelector('link[rel="manifest"]')) {
        var lnkMan = document.createElement("link");
        lnkMan.rel = "manifest";
        lnkMan.href = racine + "manifest.webmanifest";
        document.head.appendChild(lnkMan);
      }

      /* 2. Supprimer l'en-tête URL d'impression (@page margin: 0) et couvrir toute barre Window Controls Overlay résiduelle */
      if (document.head && !document.getElementById("sti-hide-url-pc-style")) {
        var stHide = document.createElement("style");
        stHide.id = "sti-hide-url-pc-style";
        stHide.textContent =
          "@media print { @page { margin: 0mm !important; } body { padding: 8mm !important; } }" +
          "#sti-wco-cover { display: none; }" +
          "@media (display-mode: window-controls-overlay) {" +
          "  #sti-wco-cover {" +
          "    display: flex !important; align-items: center; gap: 8px;" +
          "    position: fixed; left: env(titlebar-area-x, 0); top: env(titlebar-area-y, 0);" +
          "    width: env(titlebar-area-width, 100%); height: env(titlebar-area-height, 34px);" +
          "    background: #0f1726; color: #fffdf7; padding: 0 14px; z-index: 2147483647;" +
          "    font: 800 12px/1 system-ui, -apple-system, 'Segoe UI', sans-serif;" +
          "    -webkit-app-region: drag; app-region: drag; user-select: none;" +
          "  }" +
          "}";
        document.head.appendChild(stHide);
      }

      if (document.body && !document.getElementById("sti-wco-cover")) {
        var wcoBar = document.createElement("div");
        wcoBar.id = "sti-wco-cover";
        wcoBar.setAttribute("aria-hidden", "true");
        wcoBar.innerHTML = "<span>⚡ STI by AE — L'Atelier du Web V2.0</span>";
        document.body.appendChild(wcoBar);
      }

      if (!estAppareilPC()) return;

      /* 3. Neutraliser tous les target="_blank" internes pour éviter toute ouverture de fenêtre externe avec barre d'adresse GitHub en haut */
      document.addEventListener(
        "click",
        function (e) {
          /* Activer automatiquement le plein écran sans adresse au 1er clic utilisateur sur PC (pour tous les comptes) */
          var t = e.target;
          var surBtnFs = t && t.closest && t.closest("#sti-btn-pc-fullscreen");
          if (!surBtnFs) {
            activerPleinEcranSansAdressePC(false);
          }

          var a = t && t.closest ? t.closest("a") : null;
          if (!a) return;
          var href = a.getAttribute("href") || a.getAttribute("data-sti-href") || "";
          if (!href || href.indexOf("javascript:") === 0 || href.indexOf("mailto:") === 0 || href.indexOf("tel:") === 0) return;
          if (a.hasAttribute("download")) return;
          try {
            var u = new URL(href, location.href);
            if (u.origin === location.origin) {
              if (a.getAttribute("target") === "_blank") {
                a.removeAttribute("target");
              }
              if (a.hasAttribute("data-sti-href") && !a.getAttribute("href")) {
                e.preventDefault();
                location.assign(u.href);
              }
            }
          } catch (err) {}
        },
        true
      );

      /* 4. Masquer l'aperçu d'adresse GitHub au survol des liens internes sur PC */
      document.addEventListener(
        "mouseover",
        function (e) {
          var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
          if (!a || a.hasAttribute("download")) return;
          var h = a.getAttribute("href") || "";
          if (!h || h.charAt(0) === "#" || h.indexOf("javascript:") === 0 || h.indexOf("mailto:") === 0 || h.indexOf("tel:") === 0) return;
          try {
            var u = new URL(h, location.href);
            if (u.origin === location.origin) {
              if (a.getAttribute("target") === "_blank") a.removeAttribute("target");
              a.setAttribute("data-sti-href", h);
              a.removeAttribute("href");
              if (!a.style.cursor) a.style.cursor = "pointer";
            }
          } catch (err) {}
        },
        true
      );

      document.addEventListener("fullscreenchange", majBoutonPleinEcranPC);
      document.addEventListener("webkitfullscreenchange", majBoutonPleinEcranPC);
    } catch (e) {}
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     🎥 VIDÉO DE L'ANIMATION DU GUICHET (php-guichet.mp4 AVEC LA VOIX DE L'HOMME)
     - Zéro voix dans les pas à pas interactifs (aucune lecture commentée ni audio d'étape).
     - Seule la vidéo de l'animation du guichet (assets/videos/php-guichet.mp4) est conservée
       avec la voix de l'homme qui explique les étapes pas à pas.
     ═══════════════════════════════════════════════════════════════════════════ */
  function installerVideosPasAPasSTI() {
    try {
      /* Couper et neutraliser définitivement toute synthèse vocale (window.speechSynthesis) */
      if ("speechSynthesis" in window && window.speechSynthesis) {
        try {
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak = function () {};
        } catch (e) {}
      }

      var oldDock = document.getElementById("sti-voix-dock");
      if (oldDock && oldDock.parentNode) oldDock.parentNode.removeChild(oldDock);
      var oldVoixBtns = document.querySelectorAll(".sti-btn-voix-inline, .sti-btn-voix-homme-toggle, .sti-btn-ecouter-bloc");
      for (var k = 0; k < oldVoixBtns.length; k++) {
        if (oldVoixBtns[k].parentNode) oldVoixBtns[k].parentNode.removeChild(oldVoixBtns[k]);
      }

      var pathLower = (location.pathname || "").toLowerCase();
      if (
        pathLower.indexOf("portail.html") !== -1 ||
        pathLower.indexOf("admin.html") !== -1 ||
        pathLower.indexOf("carte-visite.html") !== -1 ||
        pathLower.indexOf("404.html") !== -1 ||
        pathLower.indexOf(".pdf.html") !== -1
      ) {
        return;
      }

      /* Vidéos commentées avec la voix de l'homme : Guichet PHP + MySQLi, CSS pas à pas Positionnement animé, CSS animée et les 5 cours complets (SQL, HTML5, CSS3, JavaScript, PHP) */
      var VIDEO_GUICHET_INFO = {
        file: "php-guichet.mp4?v=218",
        title: "🎥 Animation du Guichet PHP + MySQLi (3 états : INSERT · UPDATE · SELECT)"
      };
      var VIDEO_CSS_POS_INFO = {
        file: "css-positionnement.mp4?v=218",
        title: "🎥 CSS pas à pas — Positionnement animé (display, position & flex)"
      };
      var VIDEO_CSS_DECO_INFO = {
        file: "css-animee.mp4?v=218",
        title: "🎥 CSS pas à pas — Décoration animée (background, shadow, border, table & list)"
      };
      var VIDEO_SQL_INFO = {
        file: "sql-cours.mp4?v=218",
        title: "🎥 Bienvenue dans STI V2.0 By AE — Cours SQL complet animé (.mp4)"
      };
      var VIDEO_HTML5_INFO = {
        file: "html5-cours.mp4?v=218",
        title: "🎥 Bienvenue dans STI V2.0 By AE — Cours HTML5 complet animé (.mp4)"
      };
      var VIDEO_CSS3_INFO = {
        file: "css3-cours.mp4?v=218",
        title: "🎥 Bienvenue dans STI V2.0 By AE — Cours CSS3 complet animé (.mp4)"
      };
      var VIDEO_JS_INFO = {
        file: "javascript-cours.mp4?v=218",
        title: "🎥 Bienvenue dans STI V2.0 By AE — Cours JavaScript STI complet animé (.mp4)"
      };
      var VIDEO_PHP_COURS_INFO = {
        file: "php-cours.mp4?v=218",
        title: "🎥 Bienvenue dans STI V2.0 By AE — Cours PHP & MySQLi complet animé (.mp4)"
      };

      /* Chapitrage précis (en secondes) pour les 8 vidéos (.mp4) et les 5 audios (.mp3) de cours */
      var STI_CHAPITRES_MEDIA = {
        "html5-cours": [
          { t: 0.00, short: "I. Squelette", label: "00:00 · I. Squelette HTML5 (<head>, <meta>)", sel: "#entete" },
          { t: 26.13, short: "II. Structure", label: "00:26 · II. Structuration (<header>, <nav>, <main>)", sel: "#structuration" },
          { t: 44.93, short: "III. Textes", label: "00:45 · III. Conteneurs & textes (<div>, <span>, <p>)", sel: "#conteneurs" },
          { t: 57.40, short: "IV. Listes", label: "00:57 · IV. Listes (<ul>, <ol>, <dl>)", sel: "#listes" },
          { t: 67.92, short: "V. Tableaux", label: "01:08 · V. Tableaux (<table>, rowspan, colspan)", sel: "#tableaux" },
          { t: 77.98, short: "VI. Médias & Liens", label: "01:18 · VI. Multimédia & Liens (<img>, <audio>, <video>, <a>)", sel: "#texte-media" },
          { t: 96.72, short: "VII. Événements", label: "01:37 · VII. Attributs globaux & Événements JS", sel: "#attributs-evenements" },
          { t: 110.88, short: "VIII. target", label: "01:51 · VIII. Attribut target (_blank, _self, iframe)", sel: "#target-explication" },
          { t: 121.35, short: "IX. Formulaires", label: "02:01 · IX. Formulaires HTML5 (<form>, <input>, <datalist>)", sel: "#formulaires" },
          { t: 140.47, short: "X. <iframe>", label: "02:20 · X. Cadres intégrés (<iframe>) & Conclusion", sel: "#iframe" }
        ],
        "css3-cours": [
          { t: 0.00, short: "I. Sélecteurs", label: "00:00 · I. Syntaxe et Sélecteurs CSS3", sel: "#point-1" },
          { t: 36.01, short: "II. Polices & Texte", label: "00:36 · II. Polices, Textes et Couleurs (font, text)", sel: "#point-2" },
          { t: 57.37, short: "III. Fond", label: "00:57 · III. Arrière-plans et Dégradés (background)", sel: "#point-3" },
          { t: 65.32, short: "IV. Listes & Tables", label: "01:05 · IV. Listes et Tableaux stylisés (border-collapse)", sel: "#point-6" },
          { t: 73.07, short: "V. Boîtes & Ombres", label: "01:13 · V. Modèle de boîte, Bordures & Ombres", sel: "#point-7" },
          { t: 88.63, short: "VI. Position", label: "01:29 · VI. Affichage & Positionnement (display, position)", sel: "#point-4" },
          { t: 110.11, short: "VII. Flexbox", label: "01:50 · VII. Mise en page Flexbox", sel: "#point-5" },
          { t: 132.12, short: "VIII. Animations", label: "02:12 · VIII. Transitions, Transformations & Animations", sel: "#point-8" },
          { t: 144.62, short: "IX. Pas à pas", label: "02:25 · IX. Leçons animées CSS pas à pas", sel: "#css-pas-a-pas" }
        ],
        "javascript-cours": [
          { t: 0.00, short: "I. Intro JS", label: "00:00 · I. Qu'est-ce que JavaScript ?", sel: "#sec1" },
          { t: 14.96, short: "II. <script>", label: "00:15 · II. Intégration dans HTML (<script>)", sel: "#sec2" },
          { t: 24.18, short: "III. Variables", label: "00:24 · III. Variables, Types & Opérateurs (!=)", sel: "#sec3" },
          { t: 42.38, short: "IV. Conversions", label: "00:42 · IV. Boîtes de dialogue & Conversions (Number, parseInt)", sel: "#sec4" },
          { t: 60.87, short: "V. Conditions", label: "01:01 · V. Structures conditionnelles (if / else, switch)", sel: "#sec5" },
          { t: 67.51, short: "VI. Boucles", label: "01:08 · VI. Boucles répétitives (for, while, do...while)", sel: "#sec6" },
          { t: 76.51, short: "VII. Fonctions", label: "01:17 · VII. Fonctions & Portée des variables", sel: "#sec7" },
          { t: 93.59, short: "VIII. Tableaux", label: "01:34 · VIII. Tableaux (Array, .length)", sel: "#sec8" },
          { t: 111.37, short: "IX. Chaînes/ASCII", label: "01:51 · IX. Chaînes & Code ASCII (substring, indexOf, charCodeAt)", sel: "#sec9" },
          { t: 143.49, short: "X. Math", label: "02:23 · X. Objet Math (round, sqrt, random)", sel: "#sec10" },
          { t: 152.68, short: "XI. Date", label: "02:33 · XI. Objet Date (getFullYear, getMonth)", sel: "#sec11" },
          { t: 167.48, short: "XII. Événements", label: "02:47 · XII. Événements HTML (onsubmit, onclick, oninput)", sel: "#sec12" },
          { t: 178.03, short: "XIII. DOM", label: "02:58 · XIII. Accès au DOM (getElementById, querySelector)", sel: "#sec13" },
          { t: 187.69, short: "XIV. Contrôle", label: "03:08 · XIV. Contrôle de saisie (radio, select, checkbox)", sel: "#sec14" },
          { t: 202.20, short: "XV. verif() Bac", label: "03:22 · XV. Fonctions de vérification types du Bac", sel: "#sec15" },
          { t: 218.14, short: "XVI. Annexe JS", label: "03:38 · XVI. Récapitulatif Annexe Officielle JS", sel: "#sec16" }
        ],
        "php-cours": [
          { t: 0.00, short: "I. Définition", label: "00:00 · I. Définition de PHP & Client-Serveur", sel: "#s1" },
          { t: 47.13, short: "I.3 Syntaxe", label: "00:47 · I.3 Syntaxe d'un script PHP (<?php ... ?> & echo)", sel: "#s1-3" },
          { t: 64.02, short: "II. Variables", label: "01:04 · II. Types de données, Variables ($) & Constantes", sel: "#s2" },
          { t: 111.40, short: "III. Opérateurs", label: "01:51 · III. Opérateurs (!=), Conditions & Boucles", sel: "#s3" },
          { t: 227.01, short: "IV. Tableaux", label: "03:47 · IV. Tableaux indexés et associatifs ($T, foreach)", sel: "#s2-5" },
          { t: 258.42, short: "V. Chaînes", label: "04:18 · V. Fonctions sur les chaînes (strlen, substr, strpos)", sel: "#s4" },
          { t: 315.35, short: "VI. Dates/Tests", label: "05:15 · VI. Fonctions standards, Math & Dates (isset, date)", sel: "#s2-4" },
          { t: 393.77, short: "VII. $_POST/$_GET", label: "06:34 · VII. Formulaires HTML & Superglobales ($_POST, $_GET)", sel: "#s6" },
          { t: 473.15, short: "VIII.1 Connexion", label: "07:53 · VIII.1 PHP & MySQLi : mysqli_connect", sel: "#s8" },
          { t: 495.14, short: "VIII.2 INSERT/MAJ", label: "08:15 · VIII.2 INSERT, UPDATE, DELETE & mysqli_affected_rows", sel: "#s8-2" },
          { t: 528.84, short: "VIII.3 SELECT", label: "08:49 · VIII.3 SELECT, mysqli_num_rows & mysqli_fetch_array", sel: "#s8-3" },
          { t: 582.94, short: "VIII.5 Script Bac", label: "09:43 · VIII.5 mysqli_close & Script complet type Bac", sel: "#s8-5" },
          { t: 631.98, short: "IX. Récap & Guichet", label: "10:32 · IX. Récapitulatif Annexe PHP/MySQLi & Guichet", sel: "#s9" }
        ],
        "sql-cours": [
          { t: 0.00, short: "I.1 Intro BD", label: "00:00 · I.1 Introduction : BD, SGBD & SQL", sel: "#intro" },
          { t: 76.75, short: "I.2 Clés PK/FK", label: "01:17 · I.2 Clés primaires, étrangères & Contraintes", sel: "#intro-cles" },
          { t: 122.65, short: "I.3 Relations/Types", label: "02:03 · I.3 Relations entre tables & Types SQL", sel: "#intro-relations" },
          { t: 203.25, short: "II.1 CREATE TABLE", label: "03:23 · II.1 LDD : CREATE DATABASE & CREATE TABLE", sel: "#ldd" },
          { t: 263.05, short: "II.2 CASCADE", label: "04:23 · II.2 Contraintes & ON DELETE CASCADE / RESTRICT", sel: "#ldd-constraints" },
          { t: 294.85, short: "II.3 ALTER/DROP", label: "04:55 · II.3 Modification & Suppression (ALTER, DROP)", sel: "#ldd-alter" },
          { t: 358.30, short: "III.1 INSERT/UPDATE", label: "05:58 · III.1 LMD : INSERT INTO, UPDATE & DELETE", sel: "#lmd" },
          { t: 453.45, short: "III.2 SELECT/WHERE", label: "07:33 · III.2 SELECT, WHERE (!=), ORDER BY, DISTINCT", sel: "#lmd-select" },
          { t: 478.00, short: "III.3 Jointure WHERE", label: "07:58 · III.3 Jointure dans WHERE (a.col = b.col)", sel: "#lmd-jointure" },
          { t: 504.80, short: "III.4 Agrégation", label: "08:25 · III.4 Fonctions d'agrégation (COUNT, SUM, AVG…)", sel: "#lmd-aggr" },
          { t: 529.00, short: "III.5 GROUP/HAVING", label: "08:49 · III.5 Regroupement GROUP BY & HAVING", sel: "#lmd-groupby" },
          { t: 573.60, short: "III.6 Chaînes/Dates", label: "09:34 · III.6 Fonctions chaînes, dates & Conclusion", sel: "#lmd-strings" }
        ],
        "php-guichet": [
          { t: 0.00, short: "1. Client & JS", label: "00:00 · Étapes 1 à 5 : Client, Formulaire HTML & Contrôle JS" },
          { t: 73.68, short: "2. Cas INSERT", label: "01:14 · Cas 1 (INSERT INTO) : Envoi PHP, MySQL & Retour" },
          { t: 226.19, short: "3. Cas UPDATE", label: "03:46 · Cas 2 (UPDATE) : Modification & mysqli_affected_rows" },
          { t: 283.39, short: "4. Cas SELECT", label: "04:43 · Cas 3 (SELECT) : Lecture avec mysqli_fetch_array" }
        ],
        "css-positionnement": [
          { t: 0.00, short: "0. Flux HTML", label: "00:00 · 0. Le flux naturel HTML (block & inline)" },
          { t: 34.47, short: "1. display", label: "00:34 · 1. La propriété display (block, inline, none)" },
          { t: 61.44, short: "2. Boîtes", label: "01:01 · 2. Modèle de boîte (margin, padding, border)" },
          { t: 92.71, short: "3. overflow", label: "01:33 · 3. Débordement (overflow: hidden, scroll, auto)" },
          { t: 120.00, short: "4.0 Position ★", label: "02:00 · 4.0 Position : La phrase à retenir (Flux & Référence)" },
          { t: 150.85, short: "4-5. static/relative", label: "02:31 · 4 & 5. position: static et position: relative" },
          { t: 193.78, short: "6. absolute", label: "03:14 · 6. position: absolute (parent positionné)" },
          { t: 224.27, short: "7-8. fixed/sticky", label: "03:44 · 7 & 8. position: fixed, sticky et z-index" },
          { t: 259.70, short: "9-10. float/clear", label: "04:20 · 9 & 10. Flottants (float et clear)" },
          { t: 302.63, short: "11. Flexbox", label: "05:03 · 11. Flexbox (display: flex, justify-content)" }
        ],
        "css-animee": [
          { t: 0.00, short: "0-1. Sélecteurs", label: "00:00 · 0 & 1. Structure HTML & Sélecteurs CSS" },
          { t: 36.39, short: "2-3. Texte/Couleur", label: "00:36 · 2 & 3. Typographie, Polices & Couleurs" },
          { t: 90.80, short: "4-5. Fond/Dégradé", label: "01:31 · 4 & 5. Arrière-plans & Dégradés (linear-gradient)" },
          { t: 152.10, short: "6-7. Bordure/Ombre", label: "02:32 · 6 & 7. Bordures arrondies & Ombres (box-shadow)" },
          { t: 196.63, short: "8-9. Listes/Tables", label: "03:17 · 8 & 9. Habillage des listes & Tableaux" },
          { t: 248.97, short: "10-11. Transitions", label: "04:09 · 10 & 11. Transitions (:hover) & Transformations" }
        ]
      };
      window.STI_CHAPITRES_MEDIA = STI_CHAPITRES_MEDIA;

      function trouverIndexChapitreActif(chaps, sec) {
        if (!chaps || !chaps.length) return 0;
        var idx = 0;
        var t = Number(sec) || 0;
        for (var i = 0; i < chaps.length; i++) {
          if (t + 0.35 >= chaps[i].t) idx = i;
          else break;
        }
        return idx;
      }

      /* ── Suivi de progression des vidéos (.mp4) et cours vocaux (.mp3) : ✅ Vu / ⏳ En cours ── */
      var CLE_PROG_MEDIA = "sti-media-prog-v1";

      function lireProgressionMediaSTI() {
        try {
          return JSON.parse(localStorage.getItem(CLE_PROG_MEDIA) || "{}") || {};
        } catch (e) {
          return {};
        }
      }
      window.lireProgressionMediaSTI = lireProgressionMediaSTI;

      function synchroniserRevisionDepuisMedia(cleMedia) {
        var mapRev = {
          "video:html5-cours": { rev: "html5", chap: "HTML5" },
          "audio:html5-cours": { rev: "html5", chap: "HTML5" },
          "video:css3-cours": { rev: "css3", chap: "CSS3" },
          "audio:css3-cours": { rev: "css3", chap: "CSS3" },
          "video:javascript-cours": { rev: "js", chap: "JS" },
          "audio:javascript-cours": { rev: "js", chap: "JS" },
          "video:sql-cours": { rev: "sql", chap: "SQL" },
          "audio:sql-cours": { rev: "sql", chap: "SQL" },
          "video:php-cours": { rev: "php", chap: "PHP" },
          "audio:php-cours": { rev: "php", chap: "PHP" }
        };
        var info = mapRev[cleMedia];
        if (!info) return;
        try {
          var revObj = JSON.parse(localStorage.getItem("sti-revised-courses") || "{}") || {};
          revObj[info.rev] = true;
          localStorage.setItem("sti-revised-courses", JSON.stringify(revObj));
          var vusObj = JSON.parse(localStorage.getItem("sti-chapitres-vus") || "{}") || {};
          vusObj[info.chap] = 1;
          localStorage.setItem("sti-chapitres-vus", JSON.stringify(vusObj));
        } catch (e) {}
      }

      function enregistrerProgressionMediaSTI(cle, sec, dur, forceDone) {
        if (!cle) return;
        var s = Math.max(0, Number(sec) || 0);
        var d = Math.max(0, Number(dur) || 0);
        if (!forceDone && s < 2.5) return;
        var map = lireProgressionMediaSTI();
        var prev = map[cle] || { pct: 0, maxPct: 0, sec: 0, done: false };
        var pct = (d > 2) ? Math.min(100, Math.round((s / d) * 100)) : (prev.pct || 5);
        var maxPct = Math.max(prev.maxPct || 0, pct);
        var isDone = Boolean(forceDone || prev.done || maxPct >= 88);
        if (isDone) maxPct = 100;
        var changed = (prev.done !== isDone) || (Math.abs((prev.maxPct || 0) - maxPct) >= 2) || (Math.abs((prev.sec || 0) - Math.round(s)) >= 4);
        map[cle] = {
          pct: pct,
          maxPct: maxPct,
          sec: isDone ? 0 : Math.round(s),
          dur: Math.round(d),
          done: isDone,
          ts: Date.now()
        };
        if (changed || forceDone) {
          try {
            localStorage.setItem(CLE_PROG_MEDIA, JSON.stringify(map));
          } catch (e) {}
          if (isDone) synchroniserRevisionDepuisMedia(cle);
          rafraichirBadgesProgressionSTI();
          var oldTier = Math.floor((prev.maxPct || 0) / 25);
          var newTier = isDone ? 4 : Math.floor(maxPct / 25);
          if ((isDone && !prev.done) || newTier > oldTier) {
            if (typeof window.synchroniserProgressionMediaServeurSTI === "function") {
              window.synchroniserProgressionMediaServeurSTI(isDone);
            }
          }
        }
      }
      window.enregistrerProgressionMediaSTI = enregistrerProgressionMediaSTI;

      function badgeProgTexteCourt(entry) {
        if (!entry) return "";
        if (entry.done) return "✅ Vu";
        if ((entry.maxPct || 0) >= 2) return "⏳ " + entry.maxPct + "%";
        return "";
      }

      function majPastilleSurBouton(btn, cleMedia) {
        if (!btn) return;
        var map = lireProgressionMediaSTI();
        var entry = map[cleMedia];
        var span = btn.querySelector(".sti-prog-pill");
        if (!entry || (!entry.done && (entry.maxPct || 0) < 2)) {
          if (span) span.remove();
          return;
        }
        if (!span) {
          span = document.createElement("span");
          span.className = "sti-prog-pill";
          span.style.cssText = "display:inline-flex;align-items:center;padding:2px 7px;margin-left:5px;border-radius:999px;font-size:11px;font-weight:900;line-height:1.1;letter-spacing:0.01em;";
          btn.appendChild(span);
        }
        if (entry.done) {
          span.textContent = "✅ Vu";
          span.style.background = "#dcfce7";
          span.style.color = "#14532d";
          span.style.border = "1.5px solid #16a34a";
        } else {
          span.textContent = "⏳ En cours · " + entry.maxPct + "%";
          span.style.background = "#fef3c7";
          span.style.color = "#78350f";
          span.style.border = "1.5px solid #f59e0b";
        }
      }

      function rafraichirBadgesProgressionSTI() {
        try {
          var map = lireProgressionMediaSTI();
          var slugC = estPageHtml5 ? "html5-cours" : (estPageCss3 ? "css3-cours" : (estPageJs ? "javascript-cours" : (estPagePhpCours ? "php-cours" : (estPageSql ? "sql-cours" : ""))));
          if (slugC) {
            majPastilleSurBouton(document.getElementById("sti-btn-cours-video-hero"), "video:" + slugC);
            majPastilleSurBouton(document.getElementById("sti-btn-cours-voix-hero"), "audio:" + slugC);
            majPastilleSurBouton(document.getElementById("sti-btn-sql-video-hero"), "video:sql-cours");
            majPastilleSurBouton(document.getElementById("sti-btn-sql-voix-hero"), "audio:sql-cours");
          }
          majPastilleSurBouton(document.getElementById("sti-btn-php-guichet-hero"), "video:php-guichet");
          var btnsGuichet = document.querySelectorAll(".sti-btn-video-guichet, .sti-btn-video-modal-guichet");
          for (var g = 0; g < btnsGuichet.length; g++) {
            majPastilleSurBouton(btnsGuichet[g], "video:php-guichet");
          }
          if (estPageGuichet) {
            var bDedG = document.querySelectorAll(".sti-btn-video-dedie");
            for (var dg = 0; dg < bDedG.length; dg++) majPastilleSurBouton(bDedG[dg], "video:php-guichet");
          }
          if (estPageCssPos) {
            var bPos = document.querySelectorAll("#btn-video-mp4, .sti-btn-video-dedie");
            for (var bp = 0; bp < bPos.length; bp++) majPastilleSurBouton(bPos[bp], "video:css-positionnement");
          }
          if (estPageCssDeco) {
            var bDeco = document.querySelectorAll("#btn-video-mp4, .sti-btn-video-dedie");
            for (var bd = 0; bd < bDeco.length; bd++) majPastilleSurBouton(bDeco[bd], "video:css-animee");
          }

          /* Cartes de cours sur index.html (.annexe-card[data-course-id]) */
          var mapCartes = {
            html5: { v: ["video:html5-cours"], a: "audio:html5-cours" },
            css3: { v: ["video:css3-cours", "video:css-positionnement", "video:css-animee"], a: "audio:css3-cours" },
            js: { v: ["video:javascript-cours"], a: "audio:javascript-cours" },
            sql: { v: ["video:sql-cours"], a: "audio:sql-cours" },
            php: { v: ["video:php-cours", "video:php-guichet"], a: "audio:php-cours" }
          };
          var cards = document.querySelectorAll(".annexe-card[data-course-id]");
          for (var c = 0; c < cards.length; c++) {
            var card = cards[c];
            var cid = card.getAttribute("data-course-id") || "";
            var cfg = mapCartes[cid];
            if (!cfg) continue;
            var wrapB = card.querySelector(".sti-card-media-prog");
            var vEntry = map[cfg.v[0]];
            var aEntry = map[cfg.a];
            var parts = [];
            if (vEntry && (vEntry.done || (vEntry.maxPct || 0) >= 2)) {
              parts.push(
                '<span style="display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:999px;font-size:10.5px;font-weight:800;border:1.5px solid ' +
                (vEntry.done ? '#16a34a;background:#dcfce7;color:#14532d' : '#f59e0b;background:#fef3c7;color:#78350f') +
                ';">🎥 ' + (vEntry.done ? '✅ Vu' : ('⏳ ' + vEntry.maxPct + '%')) + '</span>'
              );
            }
            if (aEntry && (aEntry.done || (aEntry.maxPct || 0) >= 2)) {
              parts.push(
                '<span style="display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:999px;font-size:10.5px;font-weight:800;border:1.5px solid ' +
                (aEntry.done ? '#16a34a;background:#dcfce7;color:#14532d' : '#f59e0b;background:#fef3c7;color:#78350f') +
                ';">🔊 ' + (aEntry.done ? '✅ Écouté' : ('⏳ ' + aEntry.maxPct + '%')) + '</span>'
              );
            }
            if (parts.length) {
              if (!wrapB) {
                wrapB = document.createElement("div");
                wrapB.className = "sti-card-media-prog";
                wrapB.style.cssText = "display:flex;flex-wrap:wrap;gap:5px;margin:6px 0 2px;";
                var pDesc = card.querySelector("p");
                if (pDesc && pDesc.parentNode) {
                  pDesc.parentNode.insertBefore(wrapB, pDesc.nextSibling);
                } else {
                  card.appendChild(wrapB);
                }
              }
              wrapB.innerHTML = parts.join("");
            } else if (wrapB) {
              wrapB.remove();
            }
          }

          /* Rafraîchir aussi le panneau candidat ⚙️ si ouvert */
          if (typeof window.__stiMajProgressionPan === "function") {
            window.__stiMajProgressionPan();
          }
        } catch (e) {}
      }
      window.rafraichirBadgesProgressionSTI = rafraichirBadgesProgressionSTI;

      function prefixeAssetsSTI() {
        var scripts = document.querySelectorAll("script[src]");
        for (var i = 0; i < scripts.length; i++) {
          var s = scripts[i].getAttribute("src") || "";
          if (s.indexOf("assets/js/protection.js") !== -1) {
            return s.replace(/assets\/js\/protection\.js.*$/, "assets/");
          }
        }
        return "assets/";
      }

      function resoudreUrlVideoGuichet() {
        return prefixeAssetsSTI() + "videos/" + VIDEO_GUICHET_INFO.file;
      }

      function resoudreUrlVideoCssPos() {
        return prefixeAssetsSTI() + "videos/" + VIDEO_CSS_POS_INFO.file;
      }

      function resoudreUrlVideoCssDeco() {
        return prefixeAssetsSTI() + "videos/" + VIDEO_CSS_DECO_INFO.file;
      }

      function resoudreUrlVideoSql() {
        return prefixeAssetsSTI() + "videos/" + VIDEO_SQL_INFO.file;
      }

      function resoudreUrlVideoHtml5() {
        return prefixeAssetsSTI() + "videos/" + VIDEO_HTML5_INFO.file;
      }

      function resoudreUrlVideoCss3() {
        return prefixeAssetsSTI() + "videos/" + VIDEO_CSS3_INFO.file;
      }

      function resoudreUrlVideoJs() {
        return prefixeAssetsSTI() + "videos/" + VIDEO_JS_INFO.file;
      }

      function resoudreUrlVideoPhpCours() {
        return prefixeAssetsSTI() + "videos/" + VIDEO_PHP_COURS_INFO.file;
      }

      var estPageGuichet = (pathLower.indexOf("php-mysqli") !== -1);
      var estPageCssPos = (pathLower.indexOf("positionnement-animee") !== -1);
      var estPageCssDeco = (pathLower.indexOf("cssanimee") !== -1);
      var estPageSql = (pathLower.indexOf("/sql.html") !== -1 || pathLower.indexOf("sql-contraintes") !== -1);
      var estPageHtml5 = (pathLower.indexOf("/html5.html") !== -1);
      var estPageCss3 = (pathLower.indexOf("/css3.html") !== -1);
      var estPageJs = (pathLower.indexOf("/javascript.html") !== -1);
      var estPagePhpCours = (pathLower.indexOf("/php.html") !== -1);

      /* ── Écran de fin interactif (Logo + QR code + Relecture ou Quitter) ── */
      function creerEcranFinVideoSTI(onReplay, onQuit) {
        var logoSrc = prefixeAssetsSTI() + "icons/STI_by_AE.ico";
        var qrSrc = prefixeAssetsSTI() + "images/qr-code-site.png";
        var endEl = document.createElement("div");
        endEl.className = "sti-video-end-screen sti-no-print";
        endEl.hidden = true;
        endEl.style.cssText =
          "display:none;position:absolute;inset:52px 10px 10px 10px;z-index:30;" +
          "background:rgba(10,15,29,0.96);border:3px solid #f4511e;border-radius:16px;" +
          "flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:18px;text-align:center;" +
          "box-shadow:0 12px 36px rgba(0,0,0,0.65);";
        endEl.innerHTML =
          '<div style="display:inline-block;padding:5px 16px;border-radius:999px;background:#facc15;color:#0f172a;font-weight:900;font-size:13px;letter-spacing:0.04em;">★ FIN DE LA VIDÉO ★</div>' +
          '<div style="display:flex;align-items:center;justify-content:center;gap:24px;flex-wrap:wrap;margin:4px 0;">' +
            '<div style="display:flex;flex-direction:column;align-items:center;gap:6px;background:#0f172a;border:2px solid #facc15;border-radius:16px;padding:12px 16px;">' +
              '<img src="' + logoSrc + '" alt="Logo STI by AE" style="width:92px;height:92px;object-fit:contain;border-radius:12px;" />' +
              '<span style="font-size:11px;font-weight:800;color:#facc15;">LOGO STI BY AE</span>' +
            '</div>' +
            '<div style="max-width:440px;display:flex;flex-direction:column;gap:6px;">' +
              '<div style="font-size:clamp(16px,2.2vw,22px);font-weight:900;color:#f8fafc;line-height:1.25;">Maintenant vous pouvez commencer à jouer <span style="color:#38bdf8;">les quiz et les exercices</span> !</div>' +
              '<div style="font-size:clamp(14px,1.8vw,17px);font-weight:700;color:#cbd5e1;">Merci pour votre Attention ...</div>' +
              '<div style="font-size:clamp(20px,2.8vw,30px);font-weight:900;color:#facc15;letter-spacing:0.02em;">STI version 2.0 By AE</div>' +
            '</div>' +
            '<div style="display:flex;flex-direction:column;align-items:center;gap:6px;background:#ffffff;border:2px solid #facc15;border-radius:16px;padding:12px 16px;">' +
              '<img src="' + qrSrc + '" alt="QR Code STI version 2.0" style="width:92px;height:92px;object-fit:contain;" />' +
              '<span style="font-size:11px;font-weight:800;color:#0f172a;">SCAN QR CODE</span>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap;margin-top:6px;">' +
            '<button type="button" data-end-replay="1" style="padding:11px 24px;border-radius:12px;border:2px solid #86efac;background:#177245;color:#ffffff;font-weight:900;font-size:15px;cursor:pointer;display:inline-flex;align-items:center;gap:8px;box-shadow:0 4px 14px rgba(23,114,69,0.45);">↻ Relecture</button>' +
            '<button type="button" data-end-quit="1" style="padding:11px 24px;border-radius:12px;border:2px solid #fca5a5;background:#dc2626;color:#ffffff;font-weight:900;font-size:15px;cursor:pointer;display:inline-flex;align-items:center;gap:8px;box-shadow:0 4px 14px rgba(220,38,38,0.45);">✕ Quitter</button>' +
          '</div>';
        endEl.querySelector("button[data-end-replay]").addEventListener("click", function (ev) {
          ev.stopPropagation();
          endEl.hidden = true;
          endEl.style.display = "none";
          if (typeof onReplay === "function") onReplay();
        });
        endEl.querySelector("button[data-end-quit]").addEventListener("click", function (ev) {
          ev.stopPropagation();
          endEl.hidden = true;
          endEl.style.display = "none";
          if (typeof onQuit === "function") onQuit();
        });
        return endEl;
      }

      /* ── Lecteur vidéo réservé exclusivement à l'animation du Guichet (php-guichet.mp4) ── */
      function creerBlocVideoGuichetInline(idBox) {
        var url = resoudreUrlVideoGuichet();
        var box = document.createElement("div");
        box.className = "sti-video-pas-a-pas-box sti-no-print";
        if (idBox) box.id = idBox;
        box.hidden = true;
        box.style.cssText = "display:none;position:relative;width:min(1080px,96vw);max-width:100%;max-height:90vh;overflow:hidden;box-sizing:border-box;margin:12px auto;padding:10px 14px;flex-direction:column;";
        box.innerHTML =
          '<div class="sti-video-pas-a-pas-head">' +
            '<div class="sti-video-pas-a-pas-title">' + VIDEO_GUICHET_INFO.title + '</div>' +
            '<div class="sti-video-pas-a-pas-actions">' +
              '<button type="button" data-vchap-prev="1" title="Chapitre précédent">⏮</button>' +
              '<select data-vchap-sel="1" aria-label="Chapitres de la vidéo du Guichet" style="max-width:220px;padding:4px 8px;border-radius:8px;border:1.5px solid #facc15;background:#1e293b;color:#fde68a;font:800 11.5px/1.2 system-ui,sans-serif;cursor:pointer;"></select>' +
              '<button type="button" data-vchap-next="1" title="Chapitre suivant">⏭</button>' +
              '<button type="button" data-vrate="0.75">0.75×</button>' +
              '<button type="button" data-vrate="0.85">0.85×</button>' +
              '<button type="button" data-vrate="1" class="is-active" style="background:#177245;border-color:#86efac;color:#fff;">1×</button>' +
              '<button type="button" data-vrate="1.25">1.25×</button>' +
              '<button type="button" data-vfs="1">⛶ Plein écran</button>' +
              '<a href="' + url + '" download>⬇ MP4</a>' +
              '<button type="button" data-vclose="1">✕ Fermer</button>' +
            '</div>' +
          '</div>' +
          '<video controls controlsList="nofullscreen" disablePictureInPicture playsinline webkit-playsinline preload="metadata" src="' + url + '" style="width:100%;max-width:100%;height:auto;max-height:calc(88vh - 82px);aspect-ratio:16/9;object-fit:contain;display:block;margin:0 auto;">' +
            '<source src="' + url + '" type="video/mp4" />' +
          '</video>';

        var vid = box.querySelector("video");
        var selChapG = box.querySelector("select[data-vchap-sel]");
        var chapsG = STI_CHAPITRES_MEDIA["php-guichet"] || [];
        if (selChapG) {
          selChapG.innerHTML = chapsG.map(function (c, idx) {
            return '<option value="' + idx + '">📑 ' + c.label + '</option>';
          }).join("");
          selChapG.addEventListener("change", function () {
            var cIdx = parseInt(selChapG.value, 10) || 0;
            if (chapsG[cIdx] && vid) {
              endInline.hidden = true;
              endInline.style.display = "none";
              try { vid.currentTime = chapsG[cIdx].t; vid.play(); } catch (e) {}
            }
          });
        }
        var btnPrevG = box.querySelector("button[data-vchap-prev]");
        var btnNextG = box.querySelector("button[data-vchap-next]");
        if (btnPrevG) {
          btnPrevG.addEventListener("click", function () {
            if (!vid || !chapsG.length) return;
            var curI = trouverIndexChapitreActif(chapsG, vid.currentTime);
            var nvI = Math.max(0, curI - 1);
            try { vid.currentTime = chapsG[nvI].t; vid.play(); } catch (e) {}
          });
        }
        if (btnNextG) {
          btnNextG.addEventListener("click", function () {
            if (!vid || !chapsG.length) return;
            var curI = trouverIndexChapitreActif(chapsG, vid.currentTime);
            var nvI = Math.min(chapsG.length - 1, curI + 1);
            try { vid.currentTime = chapsG[nvI].t; vid.play(); } catch (e) {}
          });
        }
        if (vid && selChapG) {
          vid.addEventListener("timeupdate", function () {
            var idxA = trouverIndexChapitreActif(chapsG, vid.currentTime);
            if (String(selChapG.value) !== String(idxA)) selChapG.value = String(idxA);
            enregistrerProgressionMediaSTI("video:php-guichet", vid.currentTime, vid.duration, false);
          });
        }
        var endInline = creerEcranFinVideoSTI(
          function () {
            if (vid) {
              try { vid.currentTime = 0; vid.play(); } catch (e) {}
            }
          },
          function () {
            if (vid) {
              try { vid.pause(); vid.currentTime = 0; } catch (e) {}
            }
            box.classList.remove("sti-css-fullscreen-target");
            box.hidden = true;
            box.style.display = "none";
          }
        );
        box.appendChild(endInline);
        if (vid) {
          vid.addEventListener("ended", function () {
            enregistrerProgressionMediaSTI("video:php-guichet", vid.duration || 320, vid.duration || 320, true);
            endInline.hidden = false;
            endInline.style.display = "flex";
          });
          vid.addEventListener("play", function () {
            endInline.hidden = true;
            endInline.style.display = "none";
          });
        }
        var btnFsInline = box.querySelector("button[data-vfs]");
        if (btnFsInline) {
          btnFsInline.addEventListener("click", function (ev) {
            ev.stopPropagation();
            var isFull = box.classList.toggle("sti-css-fullscreen-target");
            btnFsInline.textContent = isFull ? "⤡ Réduire" : "⛶ Plein écran";
          });
        }
        var btnsRate = box.querySelectorAll("button[data-vrate]");
        function majBoutonsVitesseInline(rateActif) {
          for (var k = 0; k < btnsRate.length; k++) {
            var btnK = btnsRate[k];
            var rVal = parseFloat(btnK.getAttribute("data-vrate")) || 1;
            var actif = Math.abs(rVal - rateActif) < 0.01;
            btnK.classList.toggle("is-active", actif);
            btnK.style.background = actif ? "#177245" : "";
            btnK.style.borderColor = actif ? "#86efac" : "";
            btnK.style.color = actif ? "#fff" : "";
          }
        }
        for (var r = 0; r < btnsRate.length; r++) {
          (function (b) {
            b.addEventListener("click", function () {
              var nvRate = parseFloat(b.getAttribute("data-vrate")) || 1;
              if (vid) vid.playbackRate = nvRate;
              majBoutonsVitesseInline(nvRate);
            });
          })(btnsRate[r]);
        }
        var btnClose = box.querySelector("button[data-vclose]");
        if (btnClose) {
          btnClose.addEventListener("click", function (ev) {
            if (ev && ev.stopPropagation) ev.stopPropagation();
            if (vid) {
              try { vid.pause(); vid.currentTime = 0; } catch (e) {}
            }
            endInline.hidden = true;
            endInline.style.display = "none";
            box.classList.remove("sti-css-fullscreen-target");
            box.hidden = true;
            box.style.display = "none";
          });
        }
        return box;
      }

      function basculerBlocVideoInline(box) {
        if (!box) return;
        var vid = box.querySelector("video");
        if (box.hidden || box.style.display === "none") {
          box.hidden = false;
          box.style.display = "flex";
          try {
            box.scrollIntoView({ behavior: "smooth", block: "nearest" });
          } catch (e) {}
          if (vid) {
            vid.muted = false;
            vid.volume = 1.0;
            try { vid.play(); } catch (e) {}
          }
        } else {
          if (vid) {
            try { vid.pause(); vid.currentTime = 0; } catch (e) {}
          }
          box.hidden = true;
          box.style.display = "none";
        }
      }

      window.ouvrirVideoPasAPasSTI = function (slugOuUrl, titreOpt, startSecOpt) {
        var sSlug = String(slugOuUrl || "");
        var estHtml5 = (sSlug === "html5-cours" || sSlug.indexOf("html5-cours") !== -1 || (!sSlug && estPageHtml5));
        var estCss3 = (!estHtml5 && (sSlug === "css3-cours" || sSlug.indexOf("css3-cours") !== -1 || (!sSlug && estPageCss3)));
        var estJs = (!estHtml5 && !estCss3 && (sSlug === "javascript-cours" || sSlug.indexOf("javascript-cours") !== -1 || (!sSlug && estPageJs)));
        var estPhpC = (!estHtml5 && !estCss3 && !estJs && (sSlug === "php-cours" || sSlug.indexOf("php-cours") !== -1 || (!sSlug && estPagePhpCours)));
        var estSql = (!estHtml5 && !estCss3 && !estJs && !estPhpC && (sSlug === "sql-cours" || sSlug.indexOf("sql-cours") !== -1 || (!sSlug && estPageSql)));
        var estCssDeco = (!estHtml5 && !estCss3 && !estJs && !estPhpC && !estSql && (sSlug === "css-animee" || sSlug.indexOf("css-animee") !== -1 || (!sSlug && estPageCssDeco)));
        var estCssPos = (!estHtml5 && !estCss3 && !estJs && !estPhpC && !estSql && !estCssDeco && (sSlug === "css-positionnement" || sSlug.indexOf("css-positionnement") !== -1 || (!sSlug && estPageCssPos)));
        var estGuichet = (!estHtml5 && !estCss3 && !estJs && !estPhpC && !estSql && !estCssDeco && !estCssPos && (sSlug === "php-guichet" || sSlug.indexOf("php-guichet") !== -1 || sSlug === "guichet" || (!sSlug && estPageGuichet)));
        if (!estHtml5 && !estCss3 && !estJs && !estPhpC && !estSql && !estCssDeco && !estCssPos && !estGuichet) {
          return;
        }
        /* Couper immédiatement toute voix de l'animation interactive pour éviter que 2 voix ne parlent en même temps */
        try {
          if (typeof window.stop === "function" && document.getElementById("mIns")) {
            window.stop();
          }
          if (typeof window.arreterAuto === "function") {
            window.arreterAuto();
          }
          if (typeof window.arreterVoixPos === "function") {
            window.arreterVoixPos();
          }
          if (typeof window.arreterVoixDeco === "function") {
            window.arreterVoixDeco();
          }
          if (typeof window.arreterVoixSqlSTI === "function") {
            window.arreterVoixSqlSTI();
          }
          if (typeof window.arreterVoixCoursSTI === "function") {
            window.arreterVoixCoursSTI();
          }
          var fSql = document.getElementById("sqlContraintesFrame");
          if (fSql && fSql.contentWindow) {
            fSql.contentWindow.postMessage({ type: "STI_STOP_SQL" }, "*");
          }
          var fAnim = document.getElementById("animFrame");
          if (fAnim && fAnim.contentWindow) {
            fAnim.contentWindow.postMessage({ type: "STI_STOP_GUICHET" }, "*");
          }
        } catch (e) {}
        var slugCible = estHtml5 ? "html5-cours" : (estCss3 ? "css3-cours" : (estJs ? "javascript-cours" : (estPhpC ? "php-cours" : (estSql ? "sql-cours" : (estCssDeco ? "css-animee" : (estCssPos ? "css-positionnement" : "php-guichet"))))));
        try {
          if (
            window.top &&
            window.top !== window &&
            typeof window.top.ouvrirVideoPasAPasSTI === "function"
          ) {
            window.top.ouvrirVideoPasAPasSTI(slugCible, titreOpt, startSecOpt);
            return;
          }
        } catch (e) {}
        var url = estHtml5 ? resoudreUrlVideoHtml5() : (estCss3 ? resoudreUrlVideoCss3() : (estJs ? resoudreUrlVideoJs() : (estPhpC ? resoudreUrlVideoPhpCours() : (estSql ? resoudreUrlVideoSql() : (estCssDeco ? resoudreUrlVideoCssDeco() : (estCssPos ? resoudreUrlVideoCssPos() : resoudreUrlVideoGuichet()))))));
        var titre = titreOpt || (estHtml5 ? VIDEO_HTML5_INFO.title : (estCss3 ? VIDEO_CSS3_INFO.title : (estJs ? VIDEO_JS_INFO.title : (estPhpC ? VIDEO_PHP_COURS_INFO.title : (estSql ? VIDEO_SQL_INFO.title : (estCssDeco ? VIDEO_CSS_DECO_INFO.title : (estCssPos ? VIDEO_CSS_POS_INFO.title : VIDEO_GUICHET_INFO.title)))))));

        var overlay = document.getElementById("sti-video-modal-overlay");
        if (!overlay) {
          overlay = document.createElement("div");
          overlay.id = "sti-video-modal-overlay";
          overlay.className = "sti-no-print";
          overlay.hidden = true;
          overlay.style.cssText = "display:none;position:fixed;inset:0;z-index:2147483647;background:rgba(10,15,28,0.88);align-items:center;justify-content:center;padding:10px;box-sizing:border-box;";
          overlay.innerHTML =
            '<div class="sti-video-modal-card" id="sti-video-modal-card" role="dialog" aria-modal="true" style="position:relative;width:min(1180px,96vw);max-width:96vw;max-height:94vh;overflow:hidden;box-sizing:border-box;display:flex;flex-direction:column;background:#0d1526;color:#f9f1e3;border:2px solid #f4511e;border-radius:16px;padding:10px 14px 12px;">' +
              '<div class="sti-video-pas-a-pas-head" style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:6px;flex-shrink:0;">' +
                '<div class="sti-video-pas-a-pas-title" id="sti-video-modal-title"></div>' +
                '<div class="sti-video-pas-a-pas-actions" style="display:flex;align-items:center;gap:5px;flex-wrap:wrap;">' +
                  '<button type="button" id="sti-video-modal-chap-prev" title="Chapitre précédent">⏮</button>' +
                  '<select id="sti-video-modal-chap-sel" aria-label="Aller à un chapitre de la vidéo" style="max-width:255px;padding:4px 8px;border-radius:8px;border:1.5px solid #facc15;background:#1e293b;color:#fde68a;font:800 11.5px/1.2 system-ui,sans-serif;cursor:pointer;"></select>' +
                  '<button type="button" id="sti-video-modal-chap-next" title="Chapitre suivant">⏭</button>' +
                  '<button type="button" data-mrate="0.75">0.75×</button>' +
                  '<button type="button" data-mrate="0.85">0.85×</button>' +
                  '<button type="button" data-mrate="1" class="is-active" style="background:#177245;border-color:#86efac;color:#fff;">1×</button>' +
                  '<button type="button" data-mrate="1.25">1.25×</button>' +
                  '<button type="button" id="sti-video-modal-fs">⛶ Plein écran</button>' +
                  '<a id="sti-video-modal-dl" href="#" download>⬇ MP4</a>' +
                  '<button type="button" id="sti-video-modal-close">✕ Fermer</button>' +
                '</div>' +
              '</div>' +
              '<div id="sti-video-modal-chap-pills" style="display:flex;align-items:center;gap:5px;overflow-x:auto;padding:2px 2px 6px;margin-bottom:4px;flex-shrink:0;scrollbar-width:thin;"></div>' +
              '<video id="sti-video-modal-player" controls controlsList="nofullscreen" disablePictureInPicture playsinline webkit-playsinline preload="metadata" style="width:100%;max-width:100%;height:auto;max-height:calc(94vh - 116px);aspect-ratio:16/9;object-fit:contain;display:block;margin:0 auto;border-radius:10px;background:#0d1526;"></video>' +
            '</div>';
          document.body.appendChild(overlay);

          var mCard = document.getElementById("sti-video-modal-card");
          var mVid = document.getElementById("sti-video-modal-player");
          var mBtnFs = document.getElementById("sti-video-modal-fs");
          var mRates = overlay.querySelectorAll("button[data-mrate]");
          var mChapSel = document.getElementById("sti-video-modal-chap-sel");
          var mChapPrev = document.getElementById("sti-video-modal-chap-prev");
          var mChapNext = document.getElementById("sti-video-modal-chap-next");
          var mChapPills = document.getElementById("sti-video-modal-chap-pills");

          function sauterChapitreModale(idxCible) {
            var chapsAct = STI_CHAPITRES_MEDIA[overlay.getAttribute("data-slug") || ""] || [];
            if (!chapsAct.length || !mVid) return;
            var ic = Math.max(0, Math.min(chapsAct.length - 1, idxCible));
            if (mEndScreen) {
              mEndScreen.hidden = true;
              mEndScreen.style.display = "none";
            }
            try {
              mVid.currentTime = chapsAct[ic].t;
              var pr = mVid.play();
              if (pr && pr.catch) pr.catch(function () {});
            } catch (e) {}
          }

          if (mChapSel) {
            mChapSel.addEventListener("change", function () {
              sauterChapitreModale(parseInt(mChapSel.value, 10) || 0);
            });
          }
          if (mChapPrev) {
            mChapPrev.addEventListener("click", function (ev) {
              ev.stopPropagation();
              var chapsAct = STI_CHAPITRES_MEDIA[overlay.getAttribute("data-slug") || ""] || [];
              if (!chapsAct.length || !mVid) return;
              var cur = trouverIndexChapitreActif(chapsAct, mVid.currentTime);
              sauterChapitreModale(cur - 1);
            });
          }
          if (mChapNext) {
            mChapNext.addEventListener("click", function (ev) {
              ev.stopPropagation();
              var chapsAct = STI_CHAPITRES_MEDIA[overlay.getAttribute("data-slug") || ""] || [];
              if (!chapsAct.length || !mVid) return;
              var cur = trouverIndexChapitreActif(chapsAct, mVid.currentTime);
              sauterChapitreModale(cur + 1);
            });
          }
          if (mVid) {
            mVid.addEventListener("timeupdate", function () {
              var slugAct = overlay.getAttribute("data-slug") || "";
              if (slugAct) {
                enregistrerProgressionMediaSTI("video:" + slugAct, mVid.currentTime, mVid.duration, false);
              }
              var chapsAct = STI_CHAPITRES_MEDIA[slugAct] || [];
              if (!chapsAct.length) return;
              var idxAct = trouverIndexChapitreActif(chapsAct, mVid.currentTime);
              if (mChapSel && String(mChapSel.value) !== String(idxAct)) {
                mChapSel.value = String(idxAct);
              }
              if (mChapPills) {
                var pills = mChapPills.querySelectorAll("button[data-chap-idx]");
                for (var pi = 0; pi < pills.length; pi++) {
                  var onP = pi === idxAct;
                  pills[pi].style.background = onP ? "#177245" : "#1e293b";
                  pills[pi].style.borderColor = onP ? "#86efac" : "#334155";
                  pills[pi].style.color = onP ? "#ffffff" : "#cbd5e1";
                }
              }
            });
          }

          function fermerModaleVideo(ev) {
            if (ev && ev.stopPropagation) ev.stopPropagation();
            if (mVid) {
              try { mVid.pause(); mVid.currentTime = 0; } catch (e) {}
            }
            if (mEndScreen) {
              mEndScreen.hidden = true;
              mEndScreen.style.display = "none";
            }
            if (mCard) mCard.classList.remove("sti-css-fullscreen-target");
            if (mBtnFs) mBtnFs.textContent = "⛶ Plein écran";
            overlay.hidden = true;
            overlay.style.display = "none";
          }

          var mEndScreen = creerEcranFinVideoSTI(
            function () {
              if (mVid) {
                try { mVid.currentTime = 0; mVid.play(); } catch (e) {}
              }
            },
            function () {
              fermerModaleVideo();
            }
          );
          mEndScreen.id = "sti-video-modal-end-screen";
          if (mCard) mCard.appendChild(mEndScreen);

          if (mVid) {
            mVid.addEventListener("ended", function () {
              var slugEnd = overlay.getAttribute("data-slug") || "";
              if (slugEnd) {
                enregistrerProgressionMediaSTI("video:" + slugEnd, mVid.duration || 200, mVid.duration || 200, true);
              }
              mEndScreen.hidden = false;
              mEndScreen.style.display = "flex";
            });
            mVid.addEventListener("play", function () {
              mEndScreen.hidden = true;
              mEndScreen.style.display = "none";
            });
          }

          if (mBtnFs && mCard) {
            mBtnFs.addEventListener("click", function (ev) {
              ev.stopPropagation();
              var isFull = mCard.classList.toggle("sti-css-fullscreen-target");
              mBtnFs.textContent = isFull ? "⤡ Réduire" : "⛶ Plein écran";
            });
          }

          function majBoutonsVitesseModale(rateActif) {
            for (var k = 0; k < mRates.length; k++) {
              var btnK = mRates[k];
              var rVal = parseFloat(btnK.getAttribute("data-mrate")) || 1;
              var actif = Math.abs(rVal - rateActif) < 0.01;
              btnK.classList.toggle("is-active", actif);
              btnK.style.background = actif ? "#177245" : "";
              btnK.style.borderColor = actif ? "#86efac" : "";
              btnK.style.color = actif ? "#fff" : "";
            }
          }
          for (var i = 0; i < mRates.length; i++) {
            (function (b) {
              b.addEventListener("click", function () {
                var nvRate = parseFloat(b.getAttribute("data-mrate")) || 1;
                if (mVid) mVid.playbackRate = nvRate;
                majBoutonsVitesseModale(nvRate);
              });
            })(mRates[i]);
          }
          document.getElementById("sti-video-modal-close").addEventListener("click", fermerModaleVideo);
          overlay.addEventListener("click", function (ev) {
            if (ev.target === overlay) fermerModaleVideo(ev);
          });
          document.addEventListener("keydown", function (ev) {
            if (ev.key === "Escape" && !overlay.hidden && overlay.style.display !== "none") {
              fermerModaleVideo(ev);
            }
          });
        }

        var prevEnd = document.getElementById("sti-video-modal-end-screen");
        if (prevEnd) {
          prevEnd.hidden = true;
          prevEnd.style.display = "none";
        }

        /* Si un élément est en plein écran (#animBox ou autre), attacher la modale vidéo à l'élément plein écran pour qu'elle soit toujours visible (jamais de voix qui démarre sans vidéo !) */
        var fsParent = document.fullscreenElement || document.webkitFullscreenElement || document.body;
        if (fsParent && overlay.parentNode !== fsParent) {
          fsParent.appendChild(overlay);
        }

        overlay.setAttribute("data-slug", slugCible);
        var chapsCible = STI_CHAPITRES_MEDIA[slugCible] || [];
        var selChapEl = document.getElementById("sti-video-modal-chap-sel");
        var pillsChapEl = document.getElementById("sti-video-modal-chap-pills");
        if (selChapEl) {
          selChapEl.innerHTML = chapsCible.map(function (c, idx) {
            return '<option value="' + idx + '">📑 ' + c.label + '</option>';
          }).join("");
          selChapEl.style.display = chapsCible.length ? "" : "none";
        }
        if (pillsChapEl) {
          pillsChapEl.innerHTML = chapsCible.map(function (c, idx) {
            return '<button type="button" data-chap-idx="' + idx + '" title="' + c.label.replace(/"/g, "&quot;") + '" style="flex-shrink:0;padding:4px 10px;border-radius:999px;border:1.5px solid ' + (idx === 0 ? '#86efac' : '#334155') + ';background:' + (idx === 0 ? '#177245' : '#1e293b') + ';color:' + (idx === 0 ? '#ffffff' : '#cbd5e1') + ';font:800 11px/1.1 system-ui,sans-serif;cursor:pointer;white-space:nowrap;">' + (c.short || c.label) + '</button>';
          }).join("");
          pillsChapEl.style.display = chapsCible.length ? "flex" : "none";
          var pillBtns = pillsChapEl.querySelectorAll("button[data-chap-idx]");
          for (var pb = 0; pb < pillBtns.length; pb++) {
            (function (btnP) {
              btnP.addEventListener("click", function (ev) {
                ev.stopPropagation();
                var idxP = parseInt(btnP.getAttribute("data-chap-idx"), 10) || 0;
                var vPlayer = document.getElementById("sti-video-modal-player");
                var endSc = document.getElementById("sti-video-modal-end-screen");
                if (endSc) { endSc.hidden = true; endSc.style.display = "none"; }
                if (vPlayer && chapsCible[idxP]) {
                  try { vPlayer.currentTime = chapsCible[idxP].t; vPlayer.play(); } catch (e) {}
                }
              });
            })(pillBtns[pb]);
          }
        }

        var tEl = document.getElementById("sti-video-modal-title");
        var dlEl = document.getElementById("sti-video-modal-dl");
        var vEl = document.getElementById("sti-video-modal-player");
        if (tEl) tEl.textContent = titre;
        if (dlEl) dlEl.href = url;
        if (vEl) {
          vEl.muted = false;
          vEl.volume = 1.0;
          if (vEl.getAttribute("src") !== url) {
            vEl.setAttribute("src", url);
            vEl.innerHTML = '<source src="' + url + '" type="video/mp4" />';
            try { vEl.load(); } catch (e) {}
          }
          overlay.hidden = false;
          overlay.style.display = "flex";
          if (typeof startSecOpt === "number" && startSecOpt >= 0) {
            var applyStart = function () {
              vEl.removeEventListener("loadedmetadata", applyStart);
              try { vEl.currentTime = startSecOpt; } catch (e) {}
            };
            if (vEl.readyState >= 1) {
              try { vEl.currentTime = startSecOpt; } catch (e) {}
            } else {
              vEl.addEventListener("loadedmetadata", applyStart);
            }
          }
          try { vEl.play(); } catch (e) {}
        }
      };

      function injecterBoutonsStudio() {
        /* Boutons vidéo .mp4 UNIQUEMENT sur la page de l'animation du guichet (cours/php-mysqli.html) */
        if (estPageGuichet) {
          var barresGuichet = [
            document.querySelector(".controls"),
            document.querySelector(".topbar-guichet"),
            document.getElementById("phpm-ctrl")
          ];
          for (var i = 0; i < barresGuichet.length; i++) {
            var bar = barresGuichet[i];
            if (!bar || bar.tagName === "INPUT" || bar.querySelector(".sti-btn-video-dedie")) continue;
            var bVid = document.createElement("button");
            bVid.type = "button";
            bVid.className = "sti-btn-video-dedie";
            bVid.textContent = (bar.id === "phpm-ctrl")
              ? "🎥 Vidéo"
              : "🎥 Vidéo du Guichet (.mp4)";
            bVid.title = VIDEO_GUICHET_INFO.title;
            bVid.addEventListener("click", function (ev) {
              ev.stopPropagation();
              window.ouvrirVideoPasAPasSTI("php-guichet");
            });
            bar.appendChild(bVid);
          }

          /* Écran mobile portrait « Tournez-moi ! 🔄 » pour l'animation du guichet */
          var rotBoites = [
            document.querySelector("#rot-overlay .rot-boite"),
            document.getElementById("rotate-overlay")
          ];
          for (var rb = 0; rb < rotBoites.length; rb++) {
            var rBoite = rotBoites[rb];
            if (rBoite && !rBoite.querySelector(".sti-btn-video-rot-mobile")) {
              var bRotVid = document.createElement("button");
              bRotVid.type = "button";
              bRotVid.className = "sti-btn-video-dedie sti-btn-video-rot-mobile";
              bRotVid.style.cssText = "margin:14px auto 4px;padding:12px 20px;font-size:14px;border-radius:999px;display:inline-flex;";
              bRotVid.textContent = "🎥 Regarder la vidéo du Guichet (.mp4)";
              bRotVid.addEventListener("click", function (ev) {
                ev.stopPropagation();
                window.ouvrirVideoPasAPasSTI("php-guichet");
              });
              rBoite.appendChild(bRotVid);
            }
          }
        }

        if (estPageCssPos || estPageCssDeco) {
          var rotCss = document.querySelector("#rotate-overlay .rotate-boite");
          if (rotCss && !rotCss.querySelector(".sti-btn-video-rot-mobile")) {
            var bRotCss = document.createElement("button");
            bRotCss.type = "button";
            bRotCss.className = "sti-btn-video-dedie sti-btn-video-rot-mobile";
            bRotCss.style.cssText = "margin:14px auto 4px;padding:12px 20px;font-size:14px;border-radius:999px;display:inline-flex;";
            bRotCss.textContent = "🎥 Regarder la vidéo CSS pas à pas (.mp4)";
            bRotCss.addEventListener("click", function (ev) {
              ev.stopPropagation();
              window.ouvrirVideoPasAPasSTI(estPageCssDeco ? "css-animee" : "css-positionnement");
            });
            rotCss.appendChild(bRotCss);
          }
        }

        /* Boutons Guichet (#animOpen, #btn-top-anim-guichet, #animModal) dans cours/php.html */
        var btnAnimOpen = document.getElementById("animOpen");
        if (btnAnimOpen && btnAnimOpen.parentNode && !btnAnimOpen.parentNode.querySelector(".sti-btn-video-guichet")) {
          var bVG = document.createElement("button");
          bVG.type = "button";
          bVG.className = "sti-btn-video-dedie sti-btn-video-guichet";
          bVG.style.marginTop = "8px";
          bVG.textContent = "🎥 Vidéo : L'Histoire du Guichet PHP + MySQLi (.mp4)";
          var boxG = creerBlocVideoGuichetInline("sti-video-box-php-guichet");
          bVG.addEventListener("click", function () {
            basculerBlocVideoInline(boxG);
          });
          btnAnimOpen.parentNode.insertBefore(bVG, btnAnimOpen.nextSibling);
          if (boxG) {
            var pCont = btnAnimOpen.parentNode;
            if (pCont && pCont.parentNode) {
              pCont.parentNode.insertBefore(boxG, pCont.nextSibling);
            } else {
              pCont.insertBefore(boxG, bVG.nextSibling);
            }
          }
        }
        var btnTopGuichet = document.getElementById("btn-top-anim-guichet");
        if (btnTopGuichet && btnTopGuichet.parentNode && !btnTopGuichet.parentNode.querySelector(".sti-btn-video-top-php")) {
          var bVGTop = document.createElement("button");
          bVGTop.type = "button";
          bVGTop.className = "sti-btn-video-dedie sti-btn-video-top-php";
          bVGTop.innerHTML = '<span>🎥</span><span>Guichet</span>';
          bVGTop.title = "Vidéo : Histoire du Guichet PHP + MySQLi (.mp4)";
          bVGTop.addEventListener("click", function () {
            window.ouvrirVideoPasAPasSTI("php-guichet");
          });
          btnTopGuichet.parentNode.appendChild(bVGTop);
        }
        var animTools = document.querySelector("#animModal .anim-tools");
        if (animTools && !animTools.querySelector(".sti-btn-video-modal-guichet")) {
          var bModG = document.createElement("button");
          bModG.type = "button";
          bModG.className = "sti-btn-video-dedie sti-btn-video-modal-guichet";
          bModG.textContent = "🎥 Vidéo (.mp4)";
          bModG.addEventListener("click", function () {
            window.ouvrirVideoPasAPasSTI("php-guichet");
          });
          animTools.insertBefore(bModG, animTools.firstChild);
        }

        /* ── Sélecteur de chapitres dans .hero-media-bar sur cours/sql.html ── */
        if (estPageSql && !document.getElementById("sti-select-sql-chap-hero")) {
          var sqlBar = document.querySelector(".hero-media-bar");
          var chapsSql = STI_CHAPITRES_MEDIA["sql-cours"] || [];
          if (sqlBar && chapsSql.length) {
            var selSql = document.createElement("select");
            selSql.id = "sti-select-sql-chap-hero";
            selSql.setAttribute("aria-label", "Choisir un chapitre du cours SQL");
            selSql.style.cssText = "padding:9px 14px;border-radius:12px;border:3px solid #1a1a2e;background:#1e293b;color:#fde68a;font-weight:800;font-size:0.88rem;cursor:pointer;box-shadow:4px 4px 0 #1a1a2e;max-width:310px;";
            selSql.innerHTML = '<option value="">📑 Chapitre SQL (Audio / Vidéo)…</option>' + chapsSql.map(function (ch, idx) {
              return '<option value="' + idx + '">' + ch.label + '</option>';
            }).join("");
            sqlBar.appendChild(selSql);
            selSql.addEventListener("change", function () {
              if (selSql.value === "") return;
              var idxS = parseInt(selSql.value, 10) || 0;
              var chapS = chapsSql[idxS];
              if (!chapS) return;
              if (chapS.sel) {
                var domS = document.querySelector(chapS.sel);
                if (domS) {
                  try { domS.scrollIntoView({ behavior: "smooth", block: "center" }); } catch (e) {}
                }
              }
              if (typeof window.__stiSauterChapitreAudioCours === "function") {
                window.__stiSauterChapitreAudioCours(idxS, false);
              }
            });
          }
          window.__stiSauterChapitreAudioCours = function (idxOuDelta, estRelatif) {
            var chapsS = STI_CHAPITRES_MEDIA["sql-cours"] || [];
            if (!chapsS.length) return;
            var audS = window.__stiActiveVoiceAudio || document.querySelector("audio");
            if (!audS) return;
            var curI = trouverIndexChapitreActif(chapsS, audS.currentTime || 0);
            var nvI = estRelatif ? Math.max(0, Math.min(chapsS.length - 1, curI + idxOuDelta)) : Math.max(0, Math.min(chapsS.length - 1, idxOuDelta));
            var chapObj = chapsS[nvI];
            if (!chapObj) return;
            var selH = document.getElementById("sti-select-sql-chap-hero");
            if (selH) selH.value = String(nvI);
            if (chapObj.sel) {
              var domT = document.querySelector(chapObj.sel);
              if (domT) {
                try { domT.scrollIntoView({ behavior: "smooth", block: "center" }); } catch (e) {}
              }
            }
            if (typeof window.arreterVoixSqlSTI === "function") {
              try { window.arreterVoixSqlSTI(); } catch (e) {}
            }
            try {
              audS.muted = false;
              audS.volume = 1.0;
              audS.playbackRate = 0.95;
              audS.currentTime = chapObj.t;
              var pS = audS.play();
              if (pS && pS.catch) pS.catch(function () {});
              var bHero = document.getElementById("sti-btn-sql-voix-hero");
              if (bHero) {
                bHero.textContent = "⏸️ Pause Voix SQL";
                bHero.style.background = "#b45309";
              }
            } catch (e2) {}
          };
        }

        /* ── Barre Vidéo (.mp4) + Voix (.mp3) sur les cours HTML5, CSS3, JavaScript et PHP ── */
        if ((estPageHtml5 || estPageCss3 || estPageJs || estPagePhpCours) && !document.getElementById("sti-cours-media-bar")) {
          var cKey = estPageHtml5 ? "html5" : (estPageCss3 ? "css3" : (estPageJs ? "javascript" : "php"));
          var cLabel = estPageHtml5 ? "HTML5" : (estPageCss3 ? "CSS3" : (estPageJs ? "JavaScript" : "PHP"));
          var cSlug = cKey + "-cours";
          var cAudioUrl = prefixeAssetsSTI() + "audio/" + cSlug + ".mp3?v=218";

          var CUES_MAP = {
            html5: {
              "entete": [9.10, 26.13],
              "structuration": [26.13, 44.93],
              "conteneurs": [44.93, 57.40],
              "listes": [57.40, 67.92],
              "tableaux": [67.92, 77.98],
              "texte-media": [77.98, 96.72],
              "attributs-evenements": [96.72, 110.88],
              "target-explication": [110.88, 121.35],
              "formulaires": [121.35, 140.47],
              "iframe": [140.47, 147.71]
            },
            css3: {
              "point-1": [9.78, 36.01],
              "point-2": [36.01, 57.37],
              "point-3": [57.37, 65.32],
              "point-6": [65.32, 73.07],
              "point-7": [73.07, 88.63],
              "point-4": [88.63, 110.11],
              "point-5": [110.11, 132.12],
              "point-8": [132.12, 144.62],
              "css-pas-a-pas": [144.62, 150.15]
            },
            javascript: {
              "sec1": [6.27, 14.96],
              "sec2": [14.96, 24.18],
              "sec3": [24.18, 42.38],
              "sec4": [42.38, 60.87],
              "sec5": [60.87, 67.51],
              "sec6": [67.51, 76.51],
              "sec7": [76.51, 93.59],
              "sec8": [93.59, 111.37],
              "sec9": [111.37, 143.49],
              "sec10": [143.49, 152.68],
              "sec11": [152.68, 167.48],
              "sec12": [167.48, 178.03],
              "sec13": [178.03, 187.69],
              "sec14": [187.69, 202.20],
              "sec15": [202.20, 218.14],
              "sec16": [218.14, 220.11]
            },
            php: {
              "s1": [9.12, 64.02],
              "s1-1": [9.12, 29.83],
              "s1b": [29.83, 47.13],
              "s1-3": [47.13, 64.02],
              "s2": [64.02, 111.40],
              "s2-1": [64.02, 80.90],
              "s2-2": [80.90, 95.68],
              "s2-3": [95.68, 111.40],
              "s2-4": [315.35, 393.77],
              "s2-5": [227.01, 258.42],
              "s3": [155.31, 190.20],
              "s4": [258.42, 315.35],
              "s5": [258.42, 315.35],
              "s6": [433.20, 473.15],
              "s7": [190.20, 227.01],
              "s8": [473.15, 650.34],
              "s8anim": [473.15, 495.14],
              "s8-1": [473.15, 495.14],
              "s8-2": [495.14, 528.84],
              "s8-3": [528.84, 582.94],
              "s8-4": [603.31, 631.98],
              "s8-5": [582.94, 603.31],
              "s8-6": [495.14, 528.84],
              "s8-7": [528.84, 582.94],
              "s9": [631.98, 650.34],
              "s10": [631.98, 650.34],
              "s10a": [631.98, 650.34],
              "s10b": [631.98, 650.34],
              "s10c": [631.98, 650.34],
              "s10d": [631.98, 650.34]
            }
          };

          var cAudio = document.createElement("audio");
          cAudio.preload = "metadata";
          cAudio.src = cAudioUrl;
          cAudio.style.display = "none";
          document.body.appendChild(cAudio);
          var cTimer = null;
          var cSegEnd = 0;

          function majBtnVoixCours(enLecture) {
            var bV = document.getElementById("sti-btn-cours-voix-hero");
            if (bV) {
              bV.textContent = enLecture ? ("⏸️ Pause Voix " + cLabel) : ("🔊 Écouter le cours " + cLabel);
              bV.style.background = enLecture ? "#b45309" : "#177245";
            }
          }

          window.arreterVoixCoursSTI = function () {
            if (cTimer) { clearTimeout(cTimer); cTimer = null; }
            cSegEnd = 0;
            try { cAudio.pause(); } catch (e) {}
            majBtnVoixCours(false);
          };

          cAudio.addEventListener("timeupdate", function () {
            enregistrerProgressionMediaSTI("audio:" + cSlug, cAudio.currentTime, cAudio.duration, false);
            if (cSegEnd > 0 && cAudio.currentTime >= cSegEnd - 0.05) {
              window.arreterVoixCoursSTI();
            }
          });
          cAudio.addEventListener("ended", function () {
            enregistrerProgressionMediaSTI("audio:" + cSlug, cAudio.duration || 200, cAudio.duration || 200, true);
            majBtnVoixCours(false);
          });

          function jouerSegmentCours(st, en) {
            window.arreterVoixCoursSTI();
            cSegEnd = en || 0;
            function go() {
              try {
                cAudio.muted = false;
                cAudio.volume = 1.0;
                cAudio.playbackRate = 0.96;
                cAudio.currentTime = st || 0;
                var p = cAudio.play();
                if (p && p.catch) p.catch(function () {});
                majBtnVoixCours(true);
                if (en && en > st) {
                  cTimer = setTimeout(window.arreterVoixCoursSTI, Math.max(900, Math.round(((en - st) / 0.96) * 1000) + 250));
                }
              } catch (e) {}
            }
            if (cAudio.readyState >= 1) {
              go();
            } else {
              var onM = function () {
                cAudio.removeEventListener("loadedmetadata", onM);
                go();
              };
              cAudio.addEventListener("loadedmetadata", onM);
              try { cAudio.load(); } catch (e) {}
            }
          }

          var chapsCours = STI_CHAPITRES_MEDIA[cSlug] || [];
          var optsChapsHtml = '<option value="">📑 Chapitre (Audio / Vidéo)…</option>' + chapsCours.map(function (ch, idx) {
            return '<option value="' + idx + '">' + ch.label + '</option>';
          }).join("");

          var barEl = document.createElement("div");
          barEl.id = "sti-cours-media-bar";
          barEl.className = "sti-no-print";
          barEl.style.cssText = "display:flex;flex-wrap:wrap;gap:10px;justify-content:center;align-items:center;margin:12px auto 16px;padding:10px 14px;background:rgba(13,21,38,0.92);border:2px solid #f4511e;border-radius:14px;max-width:960px;box-shadow:0 6px 18px rgba(0,0,0,0.22);";
          barEl.innerHTML =
            '<button type="button" id="sti-btn-cours-video-hero" style="padding:9px 16px;border-radius:10px;border:2px solid #fde68a;background:linear-gradient(120deg,#f4511e,#ff7043);color:#fff;font-weight:800;font-size:13.5px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;">🎥 Vidéo du cours ' + cLabel + ' (.mp4)</button>' +
            '<button type="button" id="sti-btn-cours-voix-hero" style="padding:9px 16px;border-radius:10px;border:2px solid #86efac;background:#177245;color:#fff;font-weight:800;font-size:13.5px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;">🔊 Écouter le cours ' + cLabel + '</button>' +
            '<select id="sti-select-cours-chap-hero" aria-label="Choisir un chapitre du cours ' + cLabel + '" style="padding:8px 12px;border-radius:10px;border:2px solid #facc15;background:#1e293b;color:#fde68a;font-weight:800;font-size:12.5px;cursor:pointer;max-width:290px;">' + optsChapsHtml + '</select>' +
            (estPagePhpCours ? '<button type="button" id="sti-btn-php-guichet-hero" style="padding:9px 16px;border-radius:10px;border:2px solid #7dd3fc;background:#0369a1;color:#fff;font-weight:800;font-size:13.5px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;">🎬 Vidéo du Guichet (.mp4)</button>' : '');

          var targetAnchor =
            document.getElementById("def-php") ||
            document.querySelector("main section:first-of-type") ||
            document.querySelector("main .wrap h1.title") ||
            document.querySelector("main #sec1") ||
            document.querySelector("main") ||
            document.body.firstChild;
          if (targetAnchor && targetAnchor.parentNode) {
            if (estPageHtml5 && targetAnchor.tagName === "SECTION") {
              targetAnchor.appendChild(barEl);
            } else if (estPagePhpCours && targetAnchor.classList && targetAnchor.classList.contains("title")) {
              var subEl = targetAnchor.nextElementSibling;
              if (subEl && subEl.parentNode) subEl.parentNode.insertBefore(barEl, subEl.nextSibling);
              else targetAnchor.parentNode.insertBefore(barEl, targetAnchor.nextSibling);
            } else {
              targetAnchor.parentNode.insertBefore(barEl, targetAnchor);
            }
          }

          var bVidHero = document.getElementById("sti-btn-cours-video-hero");
          if (bVidHero) {
            bVidHero.addEventListener("click", function (ev) {
              ev.stopPropagation();
              window.ouvrirVideoPasAPasSTI(cSlug);
            });
          }
          var bGuiHero = document.getElementById("sti-btn-php-guichet-hero");
          if (bGuiHero) {
            bGuiHero.addEventListener("click", function (ev) {
              ev.stopPropagation();
              window.ouvrirVideoPasAPasSTI("guichet");
            });
          }
          var bVoixHero = document.getElementById("sti-btn-cours-voix-hero");
          if (bVoixHero) {
            bVoixHero.addEventListener("click", function (ev) {
              ev.stopPropagation();
              if (!cAudio.paused) {
                window.arreterVoixCoursSTI();
              } else {
                jouerSegmentCours(0, 0);
              }
            });
          }
          var selChapHero = document.getElementById("sti-select-cours-chap-hero");
          if (selChapHero) {
            selChapHero.addEventListener("change", function () {
              if (selChapHero.value === "") return;
              var idxC = parseInt(selChapHero.value, 10) || 0;
              var chapObj = chapsCours[idxC];
              if (!chapObj) return;
              if (chapObj.sel) {
                var targetDom = document.querySelector(chapObj.sel);
                if (targetDom) {
                  try { targetDom.scrollIntoView({ behavior: "smooth", block: "center" }); } catch (e) {}
                }
              }
              jouerSegmentCours(chapObj.t, 0);
            });
            cAudio.addEventListener("timeupdate", function () {
              if (cAudio.paused) return;
              var idxA = trouverIndexChapitreActif(chapsCours, cAudio.currentTime);
              if (String(selChapHero.value) !== String(idxA)) {
                selChapHero.value = String(idxA);
              }
            });
          }
          window.__stiSauterChapitreAudioCours = function (idxOuDelta, estRelatif) {
            if (!chapsCours.length) return;
            var curIdx = trouverIndexChapitreActif(chapsCours, cAudio.currentTime || 0);
            var nvIdx = estRelatif ? Math.max(0, Math.min(chapsCours.length - 1, curIdx + idxOuDelta)) : Math.max(0, Math.min(chapsCours.length - 1, idxOuDelta));
            var chapObj = chapsCours[nvIdx];
            if (!chapObj) return;
            if (selChapHero) selChapHero.value = String(nvIdx);
            if (chapObj.sel) {
              var targetDom = document.querySelector(chapObj.sel);
              if (targetDom) {
                try { targetDom.scrollIntoView({ behavior: "smooth", block: "center" }); } catch (e) {}
              }
            }
            jouerSegmentCours(chapObj.t, 0);
          };

          document.addEventListener("click", function (ev) {
            var tabBtn = ev.target && ev.target.closest ? ev.target.closest("#tabs button[data-t]") : null;
            if (tabBtn && !ev.__stiAutoSync && !cAudio.paused) {
              var tId = tabBtn.getAttribute("data-t") || "";
              var cuesT = CUES_MAP[cKey] || {};
              if (cuesT[tId]) {
                jouerSegmentCours(cuesT[tId][0], cuesT[tId][1]);
              }
              return;
            }
            var a = ev.target && ev.target.closest ? ev.target.closest("a[href^='#']") : null;
            if (!a) return;
            var idSec = (a.getAttribute("href") || "").slice(1);
            var cues = CUES_MAP[cKey] || {};
            if (cues[idSec] && !cAudio.paused) {
              jouerSegmentCours(cues[idSec][0], cues[idSec][1]);
            }
          });
        }
      }

      injecterBoutonsStudio();
      rafraichirBadgesProgressionSTI();
      setTimeout(function () {
        injecterBoutonsStudio();
        rafraichirBadgesProgressionSTI();
      }, 900);
    } catch (err) {}
  }

  /* ─────────────────────────────────────────────
     Guide Rectangle + Guide-Ligne visant le texte en cours en parlant
     ───────────────────────────────────────────── */
  function installerGuideVocalEnParlant() {
    try {
      if (window.__stiGuideVocalInit) return;
      window.__stiGuideVocalInit = true;

      /* Intercepter tout audio vocal lancé (new Audio() ou <audio>) */
      var origPlay = window.HTMLMediaElement && window.HTMLMediaElement.prototype
        ? window.HTMLMediaElement.prototype.play
        : null;
      if (origPlay && !window.__stiPlayWrapped) {
        window.__stiPlayWrapped = true;
        window.HTMLMediaElement.prototype.play = function () {
          try {
            var src = (this.currentSrc || this.src || "").toLowerCase();
            if (this.tagName === "AUDIO" && src.indexOf("foret.mp3") === -1) {
              window.__stiActiveVoiceAudio = this;
            }
          } catch (e) {}
          return origPlay.apply(this, arguments);
        };
      }

      var TIMELINES = {
        html5: [
          [0.00, 26.13, "#entete"],
          [26.13, 44.93, "#structuration"],
          [44.93, 57.40, "#conteneurs"],
          [57.40, 62.99, "#listes > div:nth-of-type(1)"],
          [62.99, 67.92, "#listes > div:nth-of-type(2)"],
          [67.92, 74.88, "#tableaux > div:nth-of-type(1)"],
          [74.88, 77.98, "#tableaux > div:nth-of-type(2)"],
          [77.98, 84.78, "#texte-media > div:nth-of-type(1)"],
          [84.78, 96.72, "#texte-media > div:nth-of-type(2)"],
          [96.72, 100.44, "#attributs-evenements > div.grid > div:nth-child(1)"],
          [100.44, 110.88, "#attributs-evenements > div.grid > div:nth-child(2), #attributs-evenements > div:nth-of-type(2)"],
          [110.88, 121.35, "#target-explication"],
          [121.35, 128.51, "#formulaires > div:nth-of-type(1)"],
          [128.51, 136.61, "#formulaires > div:nth-of-type(2)"],
          [136.61, 140.47, "#formulaires > div:nth-of-type(3)"],
          [140.47, 155.00, "#iframe > div:nth-of-type(1), #iframe > div:nth-of-type(2)"]
        ],
        css3: [
          [0.00, 17.69, "#point-1 .grid > div:nth-child(1)"],
          [17.69, 20.85, "#point-1 .grid > div:nth-child(2)"],
          [20.85, 27.07, "#point-1 .grid > div:nth-child(3)"],
          [27.07, 36.01, "#point-1 > div.mt-5"],
          [36.01, 41.33, "#point-2 .grid > div:nth-child(1)"],
          [41.33, 45.97, "#point-2 .grid > div:nth-child(2)"],
          [45.97, 51.77, "#point-2 .grid > div:nth-child(3)"],
          [51.77, 57.37, "#point-2 .grid > div:nth-child(4)"],
          [57.37, 65.32, "#point-3 > div"],
          [65.32, 73.07, "#point-6 > div"],
          [73.07, 79.95, "#point-7 .grid > div:nth-child(1)"],
          [79.95, 83.60, "#point-7 .grid > div:nth-child(2)"],
          [83.60, 88.63, "#point-7 .grid > div:nth-child(3)"],
          [88.63, 97.76, "#point-4 .grid > div:nth-child(1)"],
          [97.76, 104.65, "#point-4 .grid > div:nth-child(2)"],
          [104.65, 110.11, "#point-4 .grid > div:nth-child(3)"],
          [110.11, 115.91, "#point-5 .grid > div:nth-child(1)"],
          [115.91, 122.31, "#point-5 .grid > div:nth-child(2)"],
          [122.31, 127.09, "#point-5 .grid > div:nth-child(3)"],
          [127.09, 132.12, "#point-5 .grid > div:nth-child(4)"],
          [132.12, 137.30, "#point-8 > div > div.grid > div:nth-child(1)"],
          [137.30, 144.62, "#point-8 > div > div.grid > div:nth-child(2)"],
          [144.62, 160.00, "#css-pas-a-pas > div"]
        ],
        javascript: [
          [0.00, 14.96, "#sec1"],
          [14.96, 24.18, "#sec2"],
          [24.18, 33.52, "#sec3 .grid > .card:nth-child(1), #sec3 .grid > .card:nth-child(2)"],
          [33.52, 42.38, "#sec3 .grid > .card:nth-child(3), #sec3 .grid > .card:nth-child(4)"],
          [42.38, 60.87, "#sec4"],
          [60.87, 67.51, "#sec5"],
          [67.51, 76.51, "#sec6"],
          [76.51, 93.59, "#sec7"],
          [93.59, 111.37, "#sec8"],
          [111.37, 125.68, "#sec9 > .card:nth-of-type(1), #s-plus, #s-length, #s-indexof, #s-lastindexof"],
          [125.68, 143.49, "#s-substring, #s-replace, #s-lower, #s-upper, #s-trim, #s-fromcharcode"],
          [143.49, 152.68, "#sec10"],
          [152.68, 167.48, "#sec11"],
          [167.48, 178.03, "#sec12"],
          [178.03, 187.69, "#sec13"],
          [187.69, 202.20, "#sec14"],
          [202.20, 218.14, "#sec15"],
          [218.14, 230.00, "#sec16 > h2, #sec16 > .card:nth-of-type(1), #sec16 > .card:nth-of-type(2)"]
        ],
        php: [
          [0.00, 29.83, "#s1, #s1-1, #s1-1 + p, #s1-1 + p + p"],
          [29.83, 38.50, "#s1b, #s1b + .analogy"],
          [38.50, 47.13, "#s1b + .analogy + .analogy"],
          [47.13, 64.02, "#s1-3, #s1-3 + pre, #s1-3 + pre + p"],
          [64.02, 80.90, "#s2, #s2-1, #s2-1 + table"],
          [80.90, 95.68, "#s2-2, #s2-2 + p, #s2-2 + p + pre"],
          [95.68, 111.40, "#s2-3, #s2-3 + p, #s2-3 + p + pre"],
          [111.40, 155.31, "#s7"],
          [155.31, 190.20, "#s3, #s3 + table, #s3 + table + pre"],
          [190.20, 227.01, "#s7, #s7 + table, #s7 + table + pre"],
          [227.01, 258.42, "#s2-5, #s2-5 + pre"],
          [258.42, 315.35, "#s4, #s4 + table, #s4 + table + pre"],
          [315.35, 393.77, "#s2-4, #s2-4 + table"],
          [393.77, 433.20, "#s1-3, #s1-3 + pre"],
          [433.20, 473.15, "#s6, #s6-1, #s6-2"],
          [473.15, 495.14, "#s8, #s8anim, #s8-1"],
          [495.14, 528.84, "#s8-2, #s8-6"],
          [528.84, 582.94, "#s8-3, #s8-7"],
          [582.94, 603.31, "#s8-5"],
          [603.31, 631.98, "#s8-4"],
          [631.98, 660.00, "#s9, #s10"]
        ],
        sql: [
          [0.00, 19.20, "#intro"],
          [19.20, 41.35, "#intro-bd"],
          [41.35, 58.65, "#schema-analogie"],
          [58.65, 76.75, "#intro-sub"],
          [76.75, 101.70, "#intro-cles"],
          [101.70, 122.65, "#intro-contraintes"],
          [122.65, 160.90, "#intro-relations"],
          [160.90, 173.70, "#c-t1"],
          [173.70, 182.70, "#c-t2"],
          [182.70, 192.60, "#c-t3"],
          [192.60, 203.25, "#c-t4"],
          [203.25, 229.35, "#ldd"],
          [229.35, 263.05, "#ldd-create"],
          [263.05, 294.85, "#ldd-constraints"],
          [294.85, 340.55, "#ldd-alter"],
          [340.55, 358.30, "#ldd-drop"],
          [358.30, 375.10, "#lmd"],
          [375.10, 395.90, "#lmd-insert"],
          [395.90, 410.00, "#lmd-update"],
          [410.00, 435.05, "#lmd-update-jointure"],
          [435.05, 453.45, "#lmd-delete"],
          [453.45, 478.00, "#lmd-select"],
          [478.00, 504.80, "#lmd-jointure"],
          [504.80, 529.00, "#lmd-aggr"],
          [529.00, 552.55, "#lmd-groupby"],
          [552.55, 573.60, "#lmd-having"],
          [573.60, 595.80, "#lmd-strings"],
          [595.80, 622.03, "#lmd-dates"]
        ]
      };

      var guideBox = null;
      var topVoiceBar = null;
      var lastScrollKey = "";
      var lastScrollAt = 0;

      function couperEcouteCoursSTI() {
        window.__stiVoiceSessionActive = false;
        var a = window.__stiActiveVoiceAudio;
        if (a) {
          try { a.pause(); a.currentTime = 0; } catch (e) {}
        }
        window.__stiActiveVoiceAudio = null;
        if (typeof window.arreterVoixCoursSTI === "function") {
          try { window.arreterVoixCoursSTI(); } catch (e2) {}
        }
        if (typeof window.arreterVoixSqlSTI === "function") {
          try { window.arreterVoixSqlSTI(); } catch (e3) {}
        }
        masquerGuide();
      }
      window.couperEcouteCoursSTI = couperEcouteCoursSTI;

      function basculerPausePlayEcouteSTI() {
        var a = window.__stiActiveVoiceAudio;
        if (!a) return;
        try {
          if (a.paused) {
            var p = a.play();
            if (p && p.catch) p.catch(function () {});
          } else {
            a.pause();
          }
        } catch (e) {}
        majBoutonsPausePlayGuide();
      }
      window.basculerPausePlayEcouteSTI = basculerPausePlayEcouteSTI;

      function majBoutonsPausePlayGuide() {
        var a = window.__stiActiveVoiceAudio;
        var enPause = !a || a.paused;
        var txt = enPause ? "▶️ Play" : "⏸️ Pause";
        var bg = enPause ? "#177245" : "#b45309";
        var b1 = document.getElementById("sti-voice-guide-pp");
        if (b1) {
          b1.textContent = txt;
          b1.style.background = bg;
        }
        var b2 = document.getElementById("sti-voice-top-pp");
        if (b2) {
          b2.textContent = txt;
          b2.style.background = bg;
        }
        var bV = document.getElementById("sti-btn-cours-voix-hero");
        if (bV && a) {
          var lbl = bV.textContent.replace(/^.*?cours\s+/i, "").replace(/^.*?Voix\s+/i, "");
          bV.textContent = enPause ? ("🔊 Écouter le cours " + lbl) : ("⏸️ Pause Voix " + lbl);
          bV.style.background = enPause ? "#177245" : "#b45309";
        }
        var bSql = document.getElementById("sti-btn-sql-voix-hero");
        if (bSql && a) {
          bSql.textContent = enPause ? "🔊 Écouter le cours SQL" : "⏸️ Pause Voix SQL";
          bSql.style.background = enPause ? "#177245" : "#b45309";
        }
      }

      function ensureTopVoiceBar() {
        if (topVoiceBar && topVoiceBar.parentNode) return topVoiceBar;
        topVoiceBar = document.createElement("div");
        topVoiceBar.id = "sti-voice-top-ctrl";
        topVoiceBar.className = "sti-no-print";
        topVoiceBar.style.cssText =
          "position:fixed;top:8px;left:50%;transform:translateX(-50%);z-index:2147482600;" +
          "display:none;align-items:center;flex-wrap:wrap;justify-content:center;gap:6px;padding:6px 12px;border-radius:999px;" +
          "max-width:96vw;background:rgba(13,21,38,0.96);border:2px solid #ff2a00;color:#fff;" +
          "box-shadow:0 6px 20px rgba(0,0,0,0.42);font:800 12px/1 system-ui,-apple-system,sans-serif;";
        topVoiceBar.innerHTML =
          '<span style="color:#fde68a;display:inline-flex;align-items:center;gap:4px;">📏 Guide vocal</span>' +
          '<button type="button" id="sti-voice-top-prev" title="Chapitre précédent" style="display:none;padding:4px 8px;border-radius:999px;border:1.5px solid #facc15;background:#1e293b;color:#fde68a;font-weight:800;font-size:11.5px;cursor:pointer;">⏮</button>' +
          '<select id="sti-voice-top-chap" aria-label="Chapitre vocal en cours" style="display:none;max-width:225px;padding:4px 8px;border-radius:999px;border:1.5px solid #facc15;background:#1e293b;color:#fde68a;font:800 11.5px/1.1 system-ui,sans-serif;cursor:pointer;"></select>' +
          '<button type="button" id="sti-voice-top-next" title="Chapitre suivant" style="display:none;padding:4px 8px;border-radius:999px;border:1.5px solid #facc15;background:#1e293b;color:#fde68a;font-weight:800;font-size:11.5px;cursor:pointer;">⏭</button>' +
          '<button type="button" id="sti-voice-top-pp" style="padding:5px 11px;border-radius:999px;border:1.5px solid #fde68a;background:#b45309;color:#fff;font-weight:800;font-size:12px;cursor:pointer;">⏸️ Pause</button>' +
          '<button type="button" id="sti-voice-top-close" title="Couper l\'écoute et fermer le guide-ligne" style="padding:5px 10px;border-radius:999px;border:1.5px solid #fca5a5;background:#dc2626;color:#fff;font-weight:800;font-size:12px;cursor:pointer;">✕ Fermer</button>';
        document.body.appendChild(topVoiceBar);
        document.getElementById("sti-voice-top-pp").addEventListener("click", function (ev) {
          ev.stopPropagation();
          basculerPausePlayEcouteSTI();
        });
        document.getElementById("sti-voice-top-close").addEventListener("click", function (ev) {
          ev.stopPropagation();
          couperEcouteCoursSTI();
        });
        document.getElementById("sti-voice-top-prev").addEventListener("click", function (ev) {
          ev.stopPropagation();
          if (typeof window.__stiSauterChapitreAudioCours === "function") {
            window.__stiSauterChapitreAudioCours(-1, true);
          }
        });
        document.getElementById("sti-voice-top-next").addEventListener("click", function (ev) {
          ev.stopPropagation();
          if (typeof window.__stiSauterChapitreAudioCours === "function") {
            window.__stiSauterChapitreAudioCours(1, true);
          }
        });
        document.getElementById("sti-voice-top-chap").addEventListener("change", function (ev) {
          ev.stopPropagation();
          var selTop = document.getElementById("sti-voice-top-chap");
          if (selTop && typeof window.__stiSauterChapitreAudioCours === "function") {
            window.__stiSauterChapitreAudioCours(parseInt(selTop.value, 10) || 0, false);
          }
        });
        return topVoiceBar;
      }

      function ensureGuideDom() {
        if (guideBox && guideBox.parentNode) return guideBox;
        guideBox = document.createElement("div");
        guideBox.id = "sti-voice-guide-rect";
        guideBox.className = "sti-no-print";
        guideBox.style.cssText =
          "position:fixed;left:0;top:0;width:0;height:0;opacity:0;pointer-events:none;z-index:2147482500;" +
          "border:3px solid #ff2a00;border-radius:12px;background:rgba(255,200,0,0.09);" +
          "box-shadow:0 0 0 4px rgba(255,145,0,0.34),0 8px 24px rgba(255,42,0,0.22);" +
          "transition:top 0.18s ease-out,left 0.18s ease-out,width 0.18s ease-out,height 0.18s ease-out,opacity 0.15s ease;";
        guideBox.innerHTML =
          '<div id="sti-voice-guide-ctrl" style="position:absolute;right:8px;top:-34px;display:inline-flex;align-items:center;gap:6px;padding:3px 8px;border-radius:999px;background:rgba(13,21,38,0.96);border:2px solid #ff2a00;box-shadow:0 4px 12px rgba(0,0,0,0.38);pointer-events:auto;font:800 11.5px/1 system-ui,-apple-system,sans-serif;">' +
            '<button type="button" id="sti-voice-guide-pp" style="padding:4px 9px;border-radius:999px;border:1px solid #fde68a;background:#b45309;color:#fff;font-weight:800;font-size:11.5px;cursor:pointer;">⏸️ Pause</button>' +
            '<button type="button" id="sti-voice-guide-close" title="Couper l\'écoute et fermer le guide-ligne" style="padding:4px 8px;border-radius:999px;border:1px solid #fca5a5;background:#dc2626;color:#fff;font-weight:800;font-size:11.5px;cursor:pointer;">✕</button>' +
          '</div>' +
          '<div id="sti-voice-guide-badge" style="position:absolute;left:-34px;top:50%;transform:translateY(-50%);width:28px;height:28px;border-radius:8px;background:#ff2a00;border:2px solid #fde68a;color:#fff;font-size:13px;font-weight:900;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,0.35);">▶</div>' +
          '<div id="sti-voice-guide-line" style="position:absolute;left:6px;right:6px;bottom:-4px;height:5px;border-radius:4px;background:linear-gradient(90deg,#ff2a00,#ffd600,#ff2a00);box-shadow:0 0 10px rgba(255,42,0,0.75);"></div>';
        document.body.appendChild(guideBox);
        document.getElementById("sti-voice-guide-pp").addEventListener("click", function (ev) {
          ev.stopPropagation();
          basculerPausePlayEcouteSTI();
        });
        document.getElementById("sti-voice-guide-close").addEventListener("click", function (ev) {
          ev.stopPropagation();
          couperEcouteCoursSTI();
        });
        return guideBox;
      }

      function masquerGuide() {
        if (guideBox) {
          guideBox.style.opacity = "0";
          guideBox.style.pointerEvents = "none";
        }
        if (topVoiceBar) {
          topVoiceBar.style.display = "none";
        }
        lastScrollKey = "";
      }

      function trouverAudioActif() {
        var a = window.__stiActiveVoiceAudio;
        if (a && !a.ended && (!a.paused || window.__stiVoiceSessionActive)) {
          return a;
        }
        var list = document.querySelectorAll("audio");
        for (var i = 0; i < list.length; i++) {
          var el = list[i];
          var s = (el.currentSrc || el.src || "").toLowerCase();
          if (!el.paused && !el.ended && s.indexOf("foret.mp3") === -1) {
            window.__stiActiveVoiceAudio = el;
            window.__stiVoiceSessionActive = true;
            return el;
          }
        }
        window.__stiVoiceSessionActive = false;
        return null;
      }

      function majPositionGuide() {
        var modVid = document.getElementById("sti-video-modal-overlay");
        if (modVid && !modVid.hidden && modVid.style.display !== "none") {
          masquerGuide();
          return;
        }
        var audio = trouverAudioActif();
        if (!audio) {
          masquerGuide();
          return;
        }
        ensureTopVoiceBar().style.display = "inline-flex";
        majBoutonsPausePlayGuide();

        var pLow = (window.location.pathname || "").toLowerCase();
        var courseKey =
          pLow.indexOf("/html5.html") !== -1 ? "html5" :
          pLow.indexOf("/css3.html") !== -1 ? "css3" :
          pLow.indexOf("/javascript.html") !== -1 ? "javascript" :
          pLow.indexOf("/php.html") !== -1 ? "php" :
          pLow.indexOf("/sql.html") !== -1 ? "sql" : "";

        /* Synchroniser le sélecteur de chapitres dans la barre vocale haute (#sti-voice-top-ctrl) */
        var chapsMap = window.STI_CHAPITRES_MEDIA || {};
        var chapsKey = courseKey ? (courseKey + "-cours") : "";
        if (chapsKey && typeof window.enregistrerProgressionMediaSTI === "function") {
          window.enregistrerProgressionMediaSTI("audio:" + chapsKey, audio.currentTime || 0, audio.duration || 0, false);
        }
        var chapsList = chapsMap[chapsKey] || [];
        var topSel = document.getElementById("sti-voice-top-chap");
        var topPrev = document.getElementById("sti-voice-top-prev");
        var topNext = document.getElementById("sti-voice-top-next");
        if (topSel) {
          if (chapsList.length) {
            if (topSel.getAttribute("data-key") !== chapsKey) {
              topSel.setAttribute("data-key", chapsKey);
              topSel.innerHTML = chapsList.map(function (c, idx) {
                return '<option value="' + idx + '">📑 ' + c.label + '</option>';
              }).join("");
            }
            topSel.style.display = "inline-block";
            if (topPrev) topPrev.style.display = "inline-block";
            if (topNext) topNext.style.display = "inline-block";
            var curChapIdx = 0;
            var tAud = audio.currentTime || 0;
            for (var ci = 0; ci < chapsList.length; ci++) {
              if (tAud + 0.35 >= chapsList[ci].t) curChapIdx = ci;
              else break;
            }
            if (String(topSel.value) !== String(curChapIdx)) {
              topSel.value = String(curChapIdx);
            }
            var heroSqlSel = document.getElementById("sti-select-sql-chap-hero");
            if (heroSqlSel && String(heroSqlSel.value) !== String(curChapIdx)) {
              heroSqlSel.value = String(curChapIdx);
            }
          } else {
            topSel.style.display = "none";
            if (topPrev) topPrev.style.display = "none";
            if (topNext) topNext.style.display = "none";
          }
        }

        var els = [];
        var segKey = "";
        if (courseKey && TIMELINES[courseKey]) {
          var t = audio.currentTime || 0;
          var list = TIMELINES[courseKey];
          var activeSeg = list[0];
          for (var i = 0; i < list.length; i++) {
            if (t >= list[i][0] && t <= list[i][1]) {
              activeSeg = list[i];
              break;
            }
          }
          segKey = courseKey + ":" + activeSeg[0];
          var nodes = document.querySelectorAll(activeSeg[2]);
          for (var n = 0; n < nodes.length; n++) {
            els.push(nodes[n]);
          }
        } else {
          var single =
            document.querySelector(".phrase-retenir-cadre:not([hidden])") ||
            document.querySelector("#panneau-explication") ||
            document.querySelector("#explainBox") ||
            document.querySelector(".tab-pane.active .card") ||
            document.querySelector("#code-box");
          if (single) {
            els.push(single);
            segKey = "anim:" + (single.id || single.className);
          }
        }

        if (!els.length) {
          return;
        }

        var now = Date.now();
        if (segKey !== lastScrollKey && !audio.paused) {
          lastScrollKey = segKey;
          var firstRect = els[0].getBoundingClientRect();
          if ((firstRect.top < 96 || firstRect.bottom > window.innerHeight - 76) && now - lastScrollAt > 500) {
            lastScrollAt = now;
            try {
              els[0].scrollIntoView({ behavior: "smooth", block: "center" });
            } catch (e) {}
          }
        }

        var x1 = 99999, y1 = 99999, x2 = 0, y2 = 0;
        for (var k = 0; k < els.length; k++) {
          var r = els[k].getBoundingClientRect();
          if (r.width < 20 || r.height < 12) continue;
          if (r.left < x1) x1 = r.left;
          if (r.top < y1) y1 = r.top;
          if (r.right > x2) x2 = r.right;
          if (r.bottom > y2) y2 = r.bottom;
        }
        if (x2 <= x1 || y2 <= y1 || y2 < 45 || y1 > window.innerHeight - 25) {
          if (guideBox) guideBox.style.opacity = "0";
          return;
        }
        var g = ensureGuideDom();
        var padX = 8;
        var padY = 5;
        var left = Math.max(8, Math.round(x1 - padX));
        var top = Math.max(54, Math.round(y1 - padY));
        var width = Math.min(window.innerWidth - left - 8, Math.round((x2 - x1) + padX * 2));
        var height = Math.min(window.innerHeight - top - 8, Math.round((y2 - y1) + padY * 2));
        g.style.left = left + "px";
        g.style.top = top + "px";
        g.style.width = width + "px";
        g.style.height = height + "px";
        g.style.opacity = "1";
      }

      setInterval(majPositionGuide, 120);
      window.addEventListener("scroll", function () {
        if (window.__stiVoiceSessionActive) majPositionGuide();
      }, { passive: true });
      window.addEventListener("resize", function () {
        if (window.__stiVoiceSessionActive) majPositionGuide();
      });
    } catch (e) {}
  }

  /* ─────────────────────────────────────────────
     Mise en place au chargement
     ───────────────────────────────────────────── */
  function init() {
    if (!synchroniserDomGold()) {
      installWatermark();
      installPrintBlock();
    }
    checkDevtools();
    installerPleinEcranSansAdresseGitHub();
    installerMasquageAdressePC();
    installerVideosPasAPasSTI();
    installerGuideVocalEnParlant();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
