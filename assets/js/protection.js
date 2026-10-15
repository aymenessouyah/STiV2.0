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
      var docEl = document.documentElement;
      if (!docEl) return;
      if (document.fullscreenElement || document.webkitFullscreenElement) return;
      var reqFs = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.msRequestFullscreen;
      if (typeof reqFs === "function") {
        var p = reqFs.call(docEl);
        if (p && typeof p.catch === "function") p.catch(function () {});
      }
    } catch (e) {}
  }

  window.basculerPleinEcranSansAdressePC = function (btnEl) {
    try {
      var docEl = document.documentElement;
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        localStorage.setItem("sti-pc-fullscreen-off", "1");
        var exitFs = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
        if (typeof exitFs === "function") exitFs.call(document);
      } else {
        localStorage.removeItem("sti-pc-fullscreen-off");
        var reqFs = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.msRequestFullscreen;
        if (typeof reqFs === "function") {
          var p = reqFs.call(docEl);
          if (p && typeof p.catch === "function") p.catch(function () {});
        }
      }
    } catch (e) {}
  };

  function majBoutonPleinEcranPC() {
    try {
      var btn = document.getElementById("sti-btn-pc-fullscreen");
      if (!btn) return;
      var actif = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
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
     🔊 MOTEUR UNIVERSEL DE NARRATION VOCALE & LECTURE COMMENTÉE PAS-À-PAS STI
     - Décrit vocalement en français chaque étape des simulations pas à pas,
       des animations de cours et des exercices animés / corrigés sur tout le site.
     - Mode « 🎬 Auto + Voix » : enchaîne automatiquement toutes les étapes de
       l'animation ou du cours au rythme exact de la voix off.
     ═══════════════════════════════════════════════════════════════════════════ */
  function installerNarrationVocaleSTI() {
    try {
      if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") return;
      if (document.getElementById("sti-voix-dock")) return;

      var pathLower = (location.pathname || "").toLowerCase();
      /* Ne pas afficher sur le portail de connexion, l'admin, la carte de visite, 404 ou les visionneuses PDF pures */
      if (
        pathLower.indexOf("portail.html") !== -1 ||
        pathLower.indexOf("admin.html") !== -1 ||
        pathLower.indexOf("carte-visite.html") !== -1 ||
        pathLower.indexOf("404.html") !== -1 ||
        pathLower.indexOf(".pdf.html") !== -1
      ) {
        return;
      }

      var synth = window.speechSynthesis;
      var voixChoisie = null;
      var voixAuto = true;
      try {
        var savedAuto = localStorage.getItem("sti-voix-auto");
        if (savedAuto === "0") voixAuto = false;
      } catch (e) {}

      var vitesses = [1.0, 1.15, 1.3];
      var idxVitesse = 1;
      try {
        var savedSpd = parseFloat(localStorage.getItem("sti-voix-speed") || "1.15");
        if (savedSpd === 1.0) idxVitesse = 0;
        else if (savedSpd === 1.3) idxVitesse = 2;
      } catch (e) {}

      var modeAutoVoix = false;
      var timerAutoVoix = null;
      var timerDebounce = null;
      var dernierTexteLu = "";
      var dernierStudioSql = "join";
      var idxBlocCours = 0;
      var blocsCours = [];

      function choisirVoixFr() {
        try {
          var liste = synth.getVoices() || [];
          var best = null;
          var bestScore = -1;
          for (var i = 0; i < liste.length; i++) {
            var v = liste[i];
            var lg = (v.lang || "").toLowerCase();
            if (lg.indexOf("fr") === 0) {
              var sc = 10;
              var nm = (v.name || "").toLowerCase();
              if (lg.indexOf("fr-fr") === 0) sc += 5;
              if (nm.indexOf("natural") !== -1 || nm.indexOf("neural") !== -1 || nm.indexOf("online") !== -1) sc += 15;
              if (nm.indexOf("denise") !== -1 || nm.indexOf("henri") !== -1 || nm.indexOf("thomas") !== -1 || nm.indexOf("amelie") !== -1 || nm.indexOf("google") !== -1 || nm.indexOf("microsoft") !== -1) sc += 8;
              if (v.localService) sc += 2;
              if (sc > bestScore) {
                bestScore = sc;
                best = v;
              }
            }
          }
          voixChoisie = best;
        } catch (e) {}
      }
      choisirVoixFr();
      if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = choisirVoixFr;
      }

      function texteEl(idOrEl) {
        var el = typeof idOrEl === "string" ? document.getElementById(idOrEl) : idOrEl;
        if (!el) return "";
        return (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
      }

      function nettoyerTextePourVoix(brut) {
        if (!brut) return "";
        var t = String(brut);
        /* Retirer les boutons "Écouter" éventuels inclus dans innerText */
        t = t.replace(/🔊\s*Écouter/g, " ").replace(/⏹\s*Stop/g, " ");
        /* Prononciation claire des termes techniques PHP / SQL / JS / CSS */
        t = t
          .replace(/\$_POST\b/g, " dollar POST ")
          .replace(/\$_GET\b/g, " dollar GET ")
          .replace(/\$_SERVER\b/g, " dollar SERVER ")
          .replace(/\$conn\b/g, " dollar conn ")
          .replace(/\$res\b/g, " dollar res ")
          .replace(/\$row\b/g, " dollar row ")
          .replace(/\$sql\b/g, " dollar S Q L ")
          .replace(/\$ok\b/g, " dollar O K ")
          .replace(/\$req\b/g, " dollar req ")
          .replace(/\$([a-zA-Z_][a-zA-Z0-9_]*)/g, " dollar $1 ")
          .replace(/mysqli_connect/g, " mysqli connect ")
          .replace(/mysqli_query/g, " mysqli query ")
          .replace(/mysqli_fetch_row/g, " mysqli fetch row ")
          .replace(/mysqli_fetch_array/g, " mysqli fetch array ")
          .replace(/mysqli_fetch_assoc/g, " mysqli fetch assoc ")
          .replace(/mysqli_num_rows/g, " mysqli num rows ")
          .replace(/mysqli_affected_rows/g, " mysqli affected rows ")
          .replace(/mysqli_close/g, " mysqli close ")
          .replace(/!==/g, " strictement différent de ")
          .replace(/===/g, " strictement égal à ")
          .replace(/!=/g, " différent de ")
          .replace(/==/g, " égal à ")
          .replace(/<=/g, " inférieur ou égal à ")
          .replace(/>=/g, " supérieur ou égal à ")
          .replace(/&&/g, " et ")
          .replace(/\|\|/g, " ou ")
          .replace(/->|→|➔|⟶/g, ", donne ")
          .replace(/↔/g, " entre ")
          .replace(/[✓✔]/g, ", validé, ")
          .replace(/[✕✖]/g, ", refusé, ")
          .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, " ")
          .replace(/[★☆◆▸◀▶⏮⏭⟲↺⛶⤡☰🌙☀️]/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        if (t.length > 950) {
          t = t.substring(0, 950);
        }
        return t;
      }

      /* Détecte le type de page / studio actif et retourne le texte descriptif de l'étape en cours */
      function extraireTexteEtapeActive() {
        /* 1. cours/php-mysqli.html : Animation du Guichet */
        if (document.getElementById("stepTitle") && document.getElementById("scene") && document.getElementById("mIns")) {
          var sNum = texteEl("stepNum");
          var sPhase = texteEl("stepPhase");
          var sTitle = texteEl("stepTitle");
          var sDesc = texteEl("stepDesc");
          var parts = [];
          if (sNum) parts.push("Étape " + sNum + ".");
          if (sPhase) parts.push(sPhase + ".");
          if (sTitle) parts.push(sTitle + ".");
          if (sDesc) parts.push(sDesc);
          var bulles = [
            ["bd", "tbd", "Le directeur dit : "],
            ["bc", "tbc", "La cliente Sara dit : "],
            ["bw", "tbw", "La guichetière JavaScript dit : "],
            ["ba", "tba", "Le coursier PHP dit : "],
            ["bg", "tbg", "L'administration MySQL dit : "]
          ];
          for (var b = 0; b < bulles.length; b++) {
            var gEl = document.getElementById(bulles[b][0]);
            var tEl = document.getElementById(bulles[b][1]);
            if (gEl && tEl && gEl.getAttribute("opacity") === "1") {
              var bt = texteEl(tEl);
              if (bt) parts.push(bulles[b][2] + bt + ".");
            }
          }
          return parts.join(" ");
        }

        /* 2. cours/PHP-recap.html : Animation PHP-recap (8 onglets) */
        if (document.getElementById("tabs") && document.getElementById("go1") && document.getElementById("t1")) {
          var btnOn = document.querySelector("#tabs button.on");
          var secOn = document.querySelector(".sec.on");
          if (secOn) {
            var pRecap = [];
            if (btnOn) pRecap.push("Atelier " + texteEl(btnOn) + ".");
            var h2On = secOn.querySelector("h2");
            if (h2On) pRecap.push(texteEl(h2On) + ".");
            var curCode = secOn.querySelector(".code div.cur");
            if (curCode) pRecap.push("Ligne exécutée : " + texteEl(curCode) + ".");
            var trMe = secOn.querySelector("tr.me");
            if (trMe) pRecap.push("Cas testé : " + texteEl(trMe) + ".");
            var outs = secOn.querySelectorAll(".out");
            for (var oi = 0; oi < outs.length; oi++) {
              var ot = texteEl(outs[oi]);
              if (ot && ot !== "—") pRecap.push("Résultat : " + ot + ".");
            }
            var notes = secOn.querySelectorAll(".note");
            for (var ni = 0; ni < notes.length; ni++) {
              pRecap.push(texteEl(notes[ni]));
            }
            return pRecap.join(" ");
          }
        }

        /* 3. cours/sql-contraintes.html : Animation SQL Contraintes */
        if (document.getElementById("tabs") && document.getElementById("go1") && document.getElementById("c1") && document.getElementById("m1")) {
          var btnC = document.querySelector("#tabs button.on");
          var secC = document.querySelector(".sec.on");
          if (secC) {
            var pCon = [];
            if (btnC) pCon.push("Contrainte SQL : " + texteEl(btnC) + ".");
            var h2C = secC.querySelector("h2");
            if (h2C) pCon.push(texteEl(h2C) + ".");
            var msgC = secC.querySelector(".msg");
            if (msgC && texteEl(msgC)) pCon.push("Effet observé : " + texteEl(msgC) + ".");
            var noteC = secC.querySelector(".note");
            if (noteC) pCon.push(texteEl(noteC));
            return pCon.join(" ");
          }
        }

        /* 4. exercices/php/sondage-parcours-pas-a-pas.html */
        if (document.getElementById("snip") && document.getElementById("t") && document.getElementById("d")) {
          return (
            "Étape " +
            texteEl("count") +
            ". " +
            texteEl("t") +
            ". " +
            texteEl("d") +
            (texteEl("cond") ? ". Évaluation de la condition : " + texteEl("cond") : "")
          );
        }

        /* 5. exercices/php/statphpanimee.html */
        if (document.getElementById("step-title") && document.getElementById("step-desc") && document.getElementById("btn-next")) {
          return (
            texteEl("counter") +
            ". " +
            texteEl("step-badge") +
            " : " +
            texteEl("step-title") +
            ". " +
            texteEl("step-desc") +
            (texteEl("decision") ? ". " + texteEl("decision") : "")
          );
        }

        /* 6. Positionnement-animee/index.html & cssanimee/index.html */
        if (document.getElementById("ctrl-etape") && document.getElementById("pastilles")) {
          var cpt = texteEl("compteur");
          var chipAct = document.querySelector(".chip.actif");
          var noteVis = document.querySelector('[id^="note-"]:not([hidden])');
          return (
            (cpt ? cpt + ". " : "") +
            (chipAct ? texteEl(chipAct) + ". " : "") +
            (noteVis ? texteEl(noteVis) : "")
          );
        }

        /* 7. exercices/html-css/TP2/tp2corrposition.html */
        if (document.getElementById("pTitre") && document.getElementById("pTexte") && document.getElementById("bSuiv")) {
          return (
            texteEl("pNum") +
            " : " +
            texteEl("pTitre") +
            ". " +
            texteEl("pTexte") +
            " " +
            texteEl("pPuceHtml") +
            " " +
            texteEl("pPuceCss") +
            " " +
            texteEl("pPucePlus")
          );
        }

        /* 8. projets/site-tunisie/site-tunisie-Correction-animation-html-css.html */
        if (document.getElementById("lbl") && document.getElementById("skip") && document.getElementById("c-html")) {
          return "Animation HTML et CSS Explore Tunisie : " + texteEl("lbl");
        }

        /* 9. Studios d'animation SQL des Séries 1, 2, 3, 5 (tp1, tp2, tp3, tpgh) */
        var prefixesSql = ["tp1", "tp2", "tp3", "tpgh"];
        for (var pi = 0; pi < prefixesSql.length; pi++) {
          var pf = prefixesSql[pi];
          if (document.getElementById(pf + "-step-title") && document.getElementById(pf + "-step-exp")) {
            var qcat = texteEl(pf + "-qcat");
            var scnt = texteEl(pf + "-step-counter");
            var stit = texteEl(pf + "-step-title");
            var sexp = texteEl(pf + "-step-exp");
            var trList = document.getElementById(pf + "-trace-list");
            var trTxt = trList ? texteEl(trList) : "";
            return (qcat ? qcat + ". " : "") + (scnt ? scnt + ". " : "") + stit + ". " + sexp + (trTxt ? " Détail : " + trTxt : "");
          }
        }

        /* 10. Studio d'animation SQL Série 4 (tp-bd-animation.js) */
        var tpbdTitle = document.querySelector(".tpbd-exp-title");
        var tpbdText = document.querySelector(".tpbd-exp-text");
        if (tpbdTitle && tpbdText) {
          var qTit = document.querySelector(".tpbd-q-title");
          var clFoc = document.querySelector(".tpbd-clause-focus");
          return (
            (qTit ? texteEl(qTit) + ". " : "") +
            (clFoc ? texteEl(clFoc) + ". " : "") +
            texteEl(tpbdTitle) +
            " : " +
            texteEl(tpbdText)
          );
        }

        /* 11. cours/sql.html : 3 studios d'animation (Jointure WHERE, GROUP BY, HAVING) */
        if (document.getElementById("sql-jointure-anim-app") || document.getElementById("sql-groupby-anim-app") || document.getElementById("sql-having-anim-app")) {
          if (dernierStudioSql === "groupby" && document.getElementById("gbanim-step-badge")) {
            return "Animation GROUP BY : " + texteEl("gbanim-step-badge") + ". " + texteEl("gbanim-comparator");
          }
          if (dernierStudioSql === "having" && document.getElementById("hvanim-step-badge")) {
            return "Animation HAVING : " + texteEl("hvanim-step-badge") + ". " + texteEl("hvanim-comparator") + ". " + texteEl("hvanim-decisions");
          }
          if (document.getElementById("janim-step-badge")) {
            return (
              "Animation Jointure dans WHERE : " +
              texteEl("janim-step-badge") +
              ". " +
              texteEl("janim-comparator") +
              ". " +
              texteEl("janim-bridge-sub") +
              ". " +
              texteEl("janim-result-note")
            );
          }
        }

        /* 12. Atelier SQL 3 fenêtres */
        if (document.getElementById("sqlInput") && document.getElementById("terminalStatus") && document.getElementById("output")) {
          return "Atelier SQL : " + texteEl("terminalStatus") + ". " + texteEl("output");
        }

        /* 12b. Modale de détail CSS ouverte dans cours/css3.html (data-win="win-...") */
        var winOpenCss = document.querySelector(".win-overlay.open, .win-overlay.active, [id^='win-'][style*='flex'], [id^='win-'][style*='block']");
        if (winOpenCss) {
          return texteEl(winOpenCss);
        }

        /* 12c. Modale de détail HTML5 ouverte dans cours/html5.html (#modal-overlay) */
        var modHtml5 = document.getElementById("modal-overlay");
        if (modHtml5 && !modHtml5.hidden && modHtml5.style.display !== "none" && modHtml5.classList.contains("active")) {
          return texteEl("modal-title") + ". " + texteEl("modal-body");
        }

        /* 12d. Guide Carte & Timbre (projets/site-tunisie/correction-details/carte-timbre-droite-haut.html) */
        if (document.getElementById("sec-header") && document.getElementById("demo-badge")) {
          var navAct = document.querySelector(".nav-btn.active");
          var secs = ["sec-header", "sec-carte", "sec-titre", "sec-fieldset", "sec-combine"];
          for (var si = 0; si < secs.length; si++) {
            var sEl = document.getElementById(secs[si]);
            if (sEl && sEl.style.display !== "none") {
              return (navAct ? texteEl(navAct) + ". " : "") + texteEl(sEl);
            }
          }
        }

        /* 12e. Atelier box-shadow & text-shadow (exercices/html-css/box-shadow-text-shadow-css3.html) */
        if (document.getElementById("out") && document.getElementById("controls") && document.getElementById("tcontrols")) {
          return "Atelier ombres CSS3 : code généré : " + texteEl("out") + ". " + texteEl("tout");
        }

        /* 13. Pages générales de Cours / Exercices / Corrigés / Bac Pratique */
        collecterBlocsCours();
        if (blocsCours.length > 0) {
          if (idxBlocCours >= blocsCours.length) idxBlocCours = 0;
          var bAct = blocsCours[idxBlocCours];
          mettreEnEvidenceBloc(bAct);
          return texteEl(bAct);
        }

        var h1 = document.querySelector("h1");
        return h1 ? texteEl(h1) : document.title;
      }

      function collecterBlocsCours() {
        if (blocsCours.length > 0) return;
        var selecteurs =
          ".step, .analogy, .exo-card, .question-card, .corr-block, .correction-box, " +
          "#zone-enonce, .sujet-card, main section, article section, .card, ol > li";
        var nodes = document.querySelectorAll(selecteurs);
        var vus = [];
        for (var i = 0; i < nodes.length; i++) {
          var n = nodes[i];
          if (n.closest && (n.closest("#sti-voix-dock") || n.closest("nav") || n.closest("header"))) continue;
          var tx = texteEl(n);
          if (tx.length < 25 || tx.length > 2200) continue;
          /* Éviter d'inclure à la fois un parent et son enfant direct */
          var doublonParent = false;
          for (var j = 0; j < vus.length; j++) {
            if (vus[j].contains(n) || n.contains(vus[j])) {
              doublonParent = true;
              break;
            }
          }
          if (!doublonParent) {
            vus.push(n);
          }
        }
        blocsCours = vus;
      }

      function mettreEnEvidenceBloc(el) {
        var anciens = document.querySelectorAll(".sti-voix-active-bloc");
        for (var i = 0; i < anciens.length; i++) {
          anciens[i].classList.remove("sti-voix-active-bloc");
        }
        if (el && el.classList) {
          el.classList.add("sti-voix-active-bloc");
          try {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          } catch (e) {}
        }
      }

      /* Passe automatiquement à l'étape suivante lors du mode « 🎬 Auto + Voix » */
      function avancerEtapeSuivante() {
        /* 1. cours/php-mysqli.html */
        var btnNextGuichet = document.getElementById("next");
        if (btnNextGuichet && document.getElementById("scene") && document.getElementById("mIns")) {
          if (!btnNextGuichet.disabled) {
            btnNextGuichet.click();
            return true;
          }
          return false;
        }

        /* 2. cours/PHP-recap.html & cours/sql-contraintes.html */
        if (document.getElementById("tabs") && document.getElementById("t1")) {
          var tabBtns = document.querySelectorAll("#tabs button");
          var curIdx = -1;
          for (var ti = 0; ti < tabBtns.length; ti++) {
            if (tabBtns[ti].classList.contains("on")) {
              curIdx = ti;
              break;
            }
          }
          if (curIdx >= 0 && curIdx < tabBtns.length - 1) {
            tabBtns[curIdx + 1].click();
            setTimeout(function () {
              var secOn = document.querySelector(".sec.on");
              var goBtn = secOn ? secOn.querySelector("button.btn.p, button[id^='go']") : null;
              if (goBtn) goBtn.click();
            }, 250);
            return true;
          }
          return false;
        }

        /* 3. sondage-parcours-pas-a-pas.html */
        if (document.getElementById("snip") && document.getElementById("next")) {
          var nSond = document.getElementById("next");
          if (!nSond.disabled) {
            nSond.click();
            return true;
          }
          return false;
        }

        /* 4. statphpanimee.html */
        var nStat = document.getElementById("btn-next");
        if (nStat && document.getElementById("step-title")) {
          if (!nStat.disabled) {
            nStat.click();
            return true;
          }
          return false;
        }

        /* 5. Positionnement-animee & cssanimee */
        if (document.getElementById("ctrl-etape") && typeof window.suivant === "function") {
          return !!window.suivant();
        }

        /* 6. tp2corrposition.html */
        var bSuivTp2 = document.getElementById("bSuiv");
        if (bSuivTp2 && document.getElementById("pTitre")) {
          if (!bSuivTp2.disabled) {
            bSuivTp2.click();
            return true;
          }
          return false;
        }

        /* 7. site-tunisie-Correction-animation-html-css.html */
        var bSkipTun = document.getElementById("skip");
        if (bSkipTun && document.getElementById("lbl")) {
          bSkipTun.click();
          return true;
        }

        /* 8. Studios SQL Séries 1, 2, 3, 5 */
        var pfs = ["tp1", "tp2", "tp3", "tpgh"];
        for (var k = 0; k < pfs.length; k++) {
          var pf = pfs[k];
          var bNextSql = document.getElementById(pf + "-btn-next");
          if (bNextSql) {
            if (!bNextSql.disabled) {
              bNextSql.click();
              return true;
            }
            /* Passer à la requête suivante de la série */
            var qBtns = document.querySelectorAll("." + pf + "-qbtn");
            for (var qi = 0; qi < qBtns.length - 1; qi++) {
              if (qBtns[qi].classList.contains("active")) {
                qBtns[qi + 1].click();
                return true;
              }
            }
            return false;
          }
        }

        /* 9. Studio SQL Série 4 (tp-bd-animation.js) */
        var bNextTpbd = document.getElementById("tpbd-btn-next-step");
        if (bNextTpbd) {
          var pills = document.querySelectorAll("#tpbd-q-pills .tpbd-q-pill");
          var dots = document.querySelectorAll(".tpbd-step-dot");
          var isLastDot = dots.length > 0 && dots[dots.length - 1].classList.contains("current");
          if (!isLastDot) {
            bNextTpbd.click();
            return true;
          }
          var bNextQ = document.getElementById("tpbd-next-q");
          if (bNextQ && pills.length > 1) {
            bNextQ.click();
            return true;
          }
          return false;
        }

        /* 10. Studios SQL dans cours/sql.html */
        if (dernierStudioSql === "groupby" && document.getElementById("gbanim-btn-next")) {
          document.getElementById("gbanim-btn-next").click();
          return true;
        }
        if (dernierStudioSql === "having" && document.getElementById("hvanim-btn-next")) {
          document.getElementById("hvanim-btn-next").click();
          return true;
        }
        if (document.getElementById("janim-btn-next")) {
          document.getElementById("janim-btn-next").click();
          return true;
        }

        /* 11. Parcours pas à pas des blocs de cours / exercices corrigés */
        collecterBlocsCours();
        if (blocsCours.length > 0 && idxBlocCours < blocsCours.length - 1) {
          idxBlocCours++;
          lireTexte(extraireTexteEtapeActive(), true);
          return true;
        }
        return false;
      }

      function majBoutonsUI(enLecture) {
        var btnToggle = document.getElementById("sti-voix-btn-toggle");
        var btnSpeak = document.getElementById("sti-voix-btn-speak");
        var btnAuto = document.getElementById("sti-voix-btn-auto");
        var btnSpeed = document.getElementById("sti-voix-btn-speed");

        if (btnToggle) {
          btnToggle.textContent = voixAuto ? "🔊 Voix ON" : "🔇 Muet";
          btnToggle.classList.toggle("sti-voix-on", voixAuto);
        }
        if (btnSpeak) {
          btnSpeak.textContent = enLecture ? "⏹ Stop" : "▶ Lire l'étape";
          btnSpeak.classList.toggle("sti-voix-speaking", !!enLecture);
        }
        if (btnAuto) {
          btnAuto.textContent = modeAutoVoix ? "⏸ Pause Auto+Voix" : "🎬 Auto + Voix";
          btnAuto.classList.toggle("sti-voix-auto-active", modeAutoVoix);
        }
        if (btnSpeed) {
          btnSpeed.textContent = vitesses[idxVitesse] + "×";
        }

        var inlinesToggle = document.querySelectorAll(".sti-btn-voix-inline-toggle");
        for (var i = 0; i < inlinesToggle.length; i++) {
          inlinesToggle[i].textContent = voixAuto ? "🔊 Voix ON" : "🔇 Voix OFF";
          inlinesToggle[i].classList.toggle("muted", !voixAuto);
        }
        var inlinesAuto = document.querySelectorAll(".sti-btn-voix-inline-auto");
        for (var j = 0; j < inlinesAuto.length; j++) {
          inlinesAuto[j].textContent = modeAutoVoix ? "⏸ Pause commentée" : "🎬 Lecture commentée";
        }
      }

      function arreterVoix(garderAuto) {
        if (timerAutoVoix) {
          clearTimeout(timerAutoVoix);
          timerAutoVoix = null;
        }
        if (!garderAuto) {
          modeAutoVoix = false;
        }
        try {
          synth.cancel();
        } catch (e) {}
        majBoutonsUI(false);
      }

      function lireTexte(brut, depuisAuto) {
        var propre = nettoyerTextePourVoix(brut);
        if (!propre) return;
        dernierTexteLu = propre;
        try {
          synth.cancel();
        } catch (e) {}

        var u = new SpeechSynthesisUtterance(propre);
        u.lang = "fr-FR";
        if (!voixChoisie) choisirVoixFr();
        if (voixChoisie) u.voice = voixChoisie;
        u.rate = vitesses[idxVitesse] || 1.15;
        u.pitch = 1.0;

        u.onstart = function () {
          majBoutonsUI(true);
        };
        u.onend = function () {
          majBoutonsUI(false);
          if (modeAutoVoix) {
            timerAutoVoix = setTimeout(function () {
              if (!modeAutoVoix) return;
              var ok = avancerEtapeSuivante();
              if (!ok) {
                modeAutoVoix = false;
                majBoutonsUI(false);
              }
            }, 550);
          }
        };
        u.onerror = function () {
          majBoutonsUI(false);
        };

        majBoutonsUI(true);
        try {
          synth.speak(u);
        } catch (e) {}
      }

      function planifierLectureEtape(delaiMs) {
        if (!voixAuto && !modeAutoVoix) return;
        if (timerDebounce) clearTimeout(timerDebounce);
        timerDebounce = setTimeout(function () {
          var t = extraireTexteEtapeActive();
          var p = nettoyerTextePourVoix(t);
          if (p && p !== dernierTexteLu) {
            lireTexte(t, modeAutoVoix);
          }
        }, delaiMs || 180);
      }

      /* ── Création du Dock flottant #sti-voix-dock ── */
      var dock = document.createElement("div");
      dock.id = "sti-voix-dock";
      dock.className = "sti-no-print";
      dock.innerHTML =
        '<button type="button" id="sti-voix-btn-collapse" title="Réduire / Ouvrir le lecteur vocal STI">🎧</button>' +
        '<button type="button" id="sti-voix-btn-toggle" class="sti-voix-item" title="Activer ou couper la voix automatique sur les étapes">🔊 Voix ON</button>' +
        '<button type="button" id="sti-voix-btn-speak" class="sti-voix-item" title="Écouter l\'explication de l\'étape actuelle">▶ Lire l\'étape</button>' +
        '<button type="button" id="sti-voix-btn-auto" class="sti-voix-item" title="Lancer l\'animation pas à pas commentée par la voix">🎬 Auto + Voix</button>' +
        '<button type="button" id="sti-voix-btn-speed" class="sti-voix-item" title="Vitesse de la voix">1.15×</button>';
      document.body.appendChild(dock);

      document.getElementById("sti-voix-btn-collapse").addEventListener("click", function () {
        dock.classList.toggle("collapsed");
      });

      document.getElementById("sti-voix-btn-toggle").addEventListener("click", function () {
        voixAuto = !voixAuto;
        try {
          localStorage.setItem("sti-voix-auto", voixAuto ? "1" : "0");
        } catch (e) {}
        if (!voixAuto) {
          arreterVoix(false);
        } else {
          majBoutonsUI(false);
          lireTexte(extraireTexteEtapeActive(), false);
        }
      });

      document.getElementById("sti-voix-btn-speak").addEventListener("click", function () {
        if (synth.speaking) {
          arreterVoix(false);
        } else {
          lireTexte(extraireTexteEtapeActive(), false);
        }
      });

      document.getElementById("sti-voix-btn-auto").addEventListener("click", function () {
        if (modeAutoVoix) {
          arreterVoix(false);
        } else {
          voixAuto = true;
          modeAutoVoix = true;
          try {
            localStorage.setItem("sti-voix-auto", "1");
          } catch (e) {}
          majBoutonsUI(true);
          lireTexte(extraireTexteEtapeActive(), true);
        }
      });

      document.getElementById("sti-voix-btn-speed").addEventListener("click", function () {
        idxVitesse = (idxVitesse + 1) % vitesses.length;
        try {
          localStorage.setItem("sti-voix-speed", String(vitesses[idxVitesse]));
        } catch (e) {}
        majBoutonsUI(synth.speaking);
      });

      /* ── Injection des boutons vocaux directement dans les barres de contrôle des studios ── */
      function injecterBoutonsStudio() {
        var barresCibles = [
          document.querySelector(".controls"),
          document.getElementById("parcours"),
          document.getElementById("ctrl-auto"),
          document.querySelector(".topbar-recap > div:last-child"),
          document.querySelector(".tp1-controls"),
          document.querySelector(".tp2-controls"),
          document.querySelector(".tp3-controls"),
          document.querySelector(".tpbd-controls"),
          document.querySelector(".tpgh-controls"),
          document.getElementById("bar")
        ];
        for (var i = 0; i < barresCibles.length; i++) {
          var bar = barresCibles[i];
          if (!bar || bar.querySelector(".sti-btn-voix-inline")) continue;

          var b1 = document.createElement("button");
          b1.type = "button";
          b1.className = "sti-btn-voix-inline sti-btn-voix-inline-toggle";
          b1.textContent = voixAuto ? "🔊 Voix ON" : "🔇 Voix OFF";
          b1.title = "Activer / couper la description vocale des étapes";
          b1.addEventListener("click", function (ev) {
            ev.stopPropagation();
            document.getElementById("sti-voix-btn-toggle").click();
          });

          var b2 = document.createElement("button");
          b2.type = "button";
          b2.className = "sti-btn-voix-inline auto-play sti-btn-voix-inline-auto";
          b2.textContent = "🎬 Lecture commentée";
          b2.title = "Jouer automatiquement toutes les étapes avec la voix off";
          b2.addEventListener("click", function (ev) {
            ev.stopPropagation();
            document.getElementById("sti-voix-btn-auto").click();
          });

          bar.appendChild(b1);
          bar.appendChild(b2);
        }

        /* Studios SQL intégrés dans cours/sql.html */
        var sqlStudios = [
          ["janim-btn-play", "join"],
          ["gbanim-btn-play", "groupby"],
          ["hvanim-btn-play", "having"]
        ];
        for (var s = 0; s < sqlStudios.length; s++) {
          (function (btnId, kind) {
            var playBtn = document.getElementById(btnId);
            if (!playBtn || !playBtn.parentNode || playBtn.parentNode.querySelector(".sti-btn-voix-sql-" + kind)) return;
            var bv = document.createElement("button");
            bv.type = "button";
            bv.className = "sti-btn-voix-inline auto-play sti-btn-voix-sql-" + kind;
            bv.textContent = "🔊 Animer avec voix";
            bv.addEventListener("click", function () {
              dernierStudioSql = kind;
              voixAuto = true;
              modeAutoVoix = true;
              majBoutonsUI(true);
              lireTexte(extraireTexteEtapeActive(), true);
            });
            playBtn.parentNode.appendChild(bv);
          })(sqlStudios[s][0], sqlStudios[s][1]);
        }
      }

      /* ── Injection des boutons « 🔊 Écouter » sur les blocs de cours et d'exercices corrigés ── */
      function injecterBoutonsBlocsCours() {
        var cibles = document.querySelectorAll(
          ".step, .analogy, .exo-card, .question-card, .corr-block, .correction-box, main section[id], article section[id]"
        );
        for (var i = 0; i < cibles.length; i++) {
          (function (bloc) {
            if (bloc.querySelector(".sti-btn-ecouter-bloc")) return;
            var tx = texteEl(bloc);
            if (tx.length < 30) return;
            var btn = document.createElement("button");
            btn.type = "button";
            btn.className = "sti-btn-ecouter-bloc sti-no-print";
            btn.textContent = "🔊 Écouter";
            btn.title = "Écouter l'explication de cette section";
            btn.addEventListener("click", function (ev) {
              ev.stopPropagation();
              if (btn.classList.contains("speaking") && synth.speaking) {
                btn.classList.remove("speaking");
                btn.textContent = "🔊 Écouter";
                arreterVoix(false);
                return;
              }
              var tous = document.querySelectorAll(".sti-btn-ecouter-bloc.speaking");
              for (var k = 0; k < tous.length; k++) {
                tous[k].classList.remove("speaking");
                tous[k].textContent = "🔊 Écouter";
              }
              btn.classList.add("speaking");
              btn.textContent = "⏹ Stop";
              mettreEnEvidenceBloc(bloc);
              lireTexte(texteEl(bloc), false);
            });
            bloc.insertBefore(btn, bloc.firstChild);
          })(cibles[i]);
        }
      }

      injecterBoutonsStudio();
      injecterBoutonsBlocsCours();
      setTimeout(function () {
        injecterBoutonsStudio();
        injecterBoutonsBlocsCours();
      }, 900);

      /* ── Écoute automatique de tous les clics sur les boutons d'étape / d'animation ── */
      document.addEventListener(
        "click",
        function (e) {
          var t = e.target;
          if (!t || !t.closest) return;
          if (t.closest("#sti-voix-dock") || t.closest(".sti-btn-voix-inline") || t.closest(".sti-btn-ecouter-bloc")) return;

          /* Si une modale d'animation s'ouvre/se ferme dans cours/php.html, couper la voix parente */
          if (t.closest("#animOpen, #btn-top-anim-guichet, #btn-magique-php-recap, #animClose, #recapClose")) {
            arreterVoix(false);
            return;
          }

          /* Détecter quel studio SQL de cours/sql.html est utilisé */
          if (t.closest("#sql-jointure-anim-app")) dernierStudioSql = "join";
          else if (t.closest("#sql-groupby-anim-app")) dernierStudioSql = "groupby";
          else if (t.closest("#sql-having-anim-app")) dernierStudioSql = "having";

          var btn = t.closest("button, input[type='button'], .dot, .phase, .chip, .tpbd-step-dot, .tpbd-q-pill");
          if (!btn) return;

          var idB = (btn.id || "").toLowerCase();
          var clsB = (btn.className || "").toLowerCase();
          var txtB = (btn.innerText || btn.value || "").toLowerCase();

          /* Boutons de détails CSS3 (data-win) */
          var dataWin = btn.getAttribute ? btn.getAttribute("data-win") : null;
          if (dataWin && document.getElementById(dataWin)) {
            if (voixAuto) {
              setTimeout(function () {
                lireTexte(texteEl(dataWin), false);
              }, 260);
            }
            return;
          }

          var estActionAnim =
            idB.indexOf("prev") !== -1 ||
            idB.indexOf("next") !== -1 ||
            idB.indexOf("suiv") !== -1 ||
            idB.indexOf("prec") !== -1 ||
            idB.indexOf("play") !== -1 ||
            idB.indexOf("auto") !== -1 ||
            idB.indexOf("skip") !== -1 ||
            idB.indexOf("rst") !== -1 ||
            idB.indexOf("reset") !== -1 ||
            idB.indexOf("start") !== -1 ||
            idB.indexOf("go") === 0 ||
            idB === "mins" ||
            idB === "msel" ||
            idB === "mupd" ||
            idB === "castgo" ||
            idB === "mathgo" ||
            idB === "datego" ||
            clsB.indexOf("dot") !== -1 ||
            clsB.indexOf("point") !== -1 ||
            clsB.indexOf("chip") !== -1 ||
            clsB.indexOf("phase") !== -1 ||
            clsB.indexOf("qbtn") !== -1 ||
            clsB.indexOf("q-pill") !== -1 ||
            clsB.indexOf("inline-btn") !== -1 ||
            clsB.indexOf("nav-btn") !== -1 ||
            clsB.indexOf("demo") !== -1 ||
            txtB.indexOf("suivant") !== -1 ||
            txtB.indexOf("précédent") !== -1 ||
            txtB.indexOf("étape") !== -1 ||
            txtB.indexOf("exécuter") !== -1 ||
            txtB.indexOf("tester") !== -1 ||
            txtB.indexOf("envoyer") !== -1 ||
            txtB.indexOf("convertir") !== -1 ||
            txtB.indexOf("animer") !== -1 ||
            txtB.indexOf("agrandir") !== -1 ||
            (btn.parentNode && btn.parentNode.id === "tabs");

          if (estActionAnim) {
            /* Délai un peu plus long sur PHP-recap (go1..go8) pour laisser l'animation afficher le résultat */
            var delai = idB.indexOf("go") === 0 ? 1250 : 220;
            planifierLectureEtape(delai);
          }
        },
        true
      );

      /* ── Observation des changements automatiques d'étape (ex. bouton Lecture auto natif) ── */
      var ciblesObsIds = [
        "stepTitle",
        "stepDesc",
        "t",
        "d",
        "step-title",
        "step-desc",
        "compteur",
        "pTitre",
        "lbl",
        "tp1-step-title",
        "tp2-step-title",
        "tp3-step-title",
        "tpgh-step-title",
        "janim-comparator",
        "gbanim-comparator",
        "hvanim-comparator"
      ];
      if (typeof MutationObserver !== "undefined") {
        var obs = new MutationObserver(function () {
          if (voixAuto && !modeAutoVoix) {
            planifierLectureEtape(200);
          }
        });
        setTimeout(function () {
          for (var i = 0; i < ciblesObsIds.length; i++) {
            var elObs = document.getElementById(ciblesObsIds[i]);
            if (elObs) {
              obs.observe(elObs, { childList: true, characterData: true, subtree: true });
            }
          }
          var tpbdExp = document.querySelector(".tpbd-exp-text");
          if (tpbdExp) {
            obs.observe(tpbdExp, { childList: true, characterData: true, subtree: true });
          }
        }, 700);
      }

      window.addEventListener("beforeunload", function () {
        arreterVoix(false);
      });

      majBoutonsUI(false);
    } catch (err) {}
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
    installerMasquageAdressePC();
    installerNarrationVocaleSTI();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
