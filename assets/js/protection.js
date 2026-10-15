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
     🎥 LECTEUR VIDÉO .MP4 PAS-À-PAS STI (SANS VOIX / SANS LECTURE COMMENTÉE)
     - Associe chaque simulation pas à pas et exercice animé à sa vidéo .mp4
       visuelle dédiée (sans piste vocale).
     ═══════════════════════════════════════════════════════════════════════════ */
  function installerVideosPasAPasSTI() {
    try {
      /* Couper et nettoyer toute synthèse vocale résiduelle du navigateur */
      if ("speechSynthesis" in window && window.speechSynthesis) {
        try { window.speechSynthesis.cancel(); } catch (e) {}
      }
      try {
        localStorage.removeItem("sti-voix-auto");
        localStorage.removeItem("sti-voix-speed");
      } catch (e) {}

      var oldDock = document.getElementById("sti-voix-dock");
      if (oldDock && oldDock.parentNode) oldDock.parentNode.removeChild(oldDock);

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

      var CATALOGUE_VIDEOS_STI = {
        "php-guichet": {
          file: "php-guichet.mp4",
          title: "🎥 Pas-à-pas : L'Histoire du Guichet (PHP + MySQLi en 10 étapes)"
        },
        "php-recap": {
          file: "php-recap.mp4",
          title: "🎥 Pas-à-pas : Récapitulatif PHP (8 étapes essentielles)"
        },
        "php-sondage-pas-a-pas": {
          file: "php-sondage-pas-a-pas.mp4",
          title: "🎥 Pas-à-pas : sondage.php en 7 étapes (Projet STI 0)"
        },
        "php-stat-pas-a-pas": {
          file: "php-stat-pas-a-pas.mp4",
          title: "🎥 Pas-à-pas : Correctionstat.php en 7 étapes (Projet STI 0)"
        },
        "sql-contraintes": {
          file: "sql-contraintes.mp4",
          title: "🎥 Pas-à-pas : Les 6 Contraintes d'Intégrité SQL (LDD)"
        },
        "sql-jointure-where": {
          file: "sql-jointure-where.mp4",
          title: "🎥 Pas-à-pas : Jointure SQL dans WHERE (WHERE a.x = b.x)"
        },
        "sql-groupby-having": {
          file: "sql-groupby-having.mp4",
          title: "🎥 Pas-à-pas : Regroupement GROUP BY & Filtrage HAVING"
        },
        "sql-serie1-ldd": {
          file: "sql-serie1-ldd.mp4",
          title: "🎥 Pas-à-pas : SQL Série 1 — LDD (CREATE, ALTER, DROP)"
        },
        "sql-serie2-lmd": {
          file: "sql-serie2-lmd.mp4",
          title: "🎥 Pas-à-pas : SQL Série 2 — LMD (INSERT, UPDATE, DELETE, SELECT)"
        },
        "sql-serie3-groupby": {
          file: "sql-serie3-groupby.mp4",
          title: "🎥 Pas-à-pas : SQL Série 3 — GROUP BY, HAVING & Agrégation"
        },
        "sql-serie4-jointure-sr": {
          file: "sql-serie4-jointure-sr.mp4",
          title: "🎥 Pas-à-pas : SQL Série 4 — Jointures dans WHERE & Sous-requêtes"
        },
        "sql-serie5-gesthotel": {
          file: "sql-serie5-gesthotel.mp4",
          title: "🎥 Pas-à-pas : SQL Série 5 — Base GestHotel & Atelier SQL"
        },
        "css-positionnement": {
          file: "css-positionnement.mp4",
          title: "🎥 Pas-à-pas : Positionnement CSS3 animé en 10 étapes"
        },
        "css-decoration-animations": {
          file: "css-decoration-animations.mp4",
          title: "🎥 Pas-à-pas : Décoration CSS3, Ombres, Transitions & @keyframes"
        },
        "tp2-positionnement-corrige": {
          file: "tp2-positionnement-corrige.mp4",
          title: "🎥 Pas-à-pas : Corrigé TP2 Positionnement CSS3 (Position / Float / Inline-Block)"
        },
        "projet-tunisie-animation": {
          file: "projet-tunisie-animation.mp4",
          title: "🎥 Pas-à-pas : Projet Explore Tunisie — Animation HTML5 & CSS3 en 8 étapes"
        },
        "javascript-controles-sti": {
          file: "javascript-controles-sti.mp4",
          title: "🎥 Pas-à-pas : JavaScript STI — Contrôles de saisie & Annexe Bac"
        }
      };

      function prefixeAssetsVideosSTI() {
        var scripts = document.querySelectorAll("script[src]");
        for (var i = 0; i < scripts.length; i++) {
          var s = scripts[i].getAttribute("src") || "";
          if (s.indexOf("assets/js/protection.js") !== -1) {
            return s.replace(/assets\/js\/protection\.js.*$/, "assets/videos/");
          }
        }
        return "assets/videos/";
      }

      function resoudreUrlVideoSTI(slugOuUrl) {
        if (!slugOuUrl) return "";
        if (CATALOGUE_VIDEOS_STI[slugOuUrl]) {
          return prefixeAssetsVideosSTI() + CATALOGUE_VIDEOS_STI[slugOuUrl].file;
        }
        if (slugOuUrl.indexOf("/") !== -1 || slugOuUrl.indexOf(".mp4") !== -1) {
          return slugOuUrl;
        }
        return prefixeAssetsVideosSTI() + slugOuUrl + ".mp4";
      }

      function detecterVideoParChemin(chemin) {
        var p = String(chemin || "").toLowerCase();
        if (p.indexOf("php-mysqli") !== -1) return "php-guichet";
        if (p.indexOf("php-recap") !== -1) return "php-recap";
        if (p.indexOf("sondage-parcours-pas-a-pas") !== -1 || p.indexOf("sti0/sondage") !== -1) return "php-sondage-pas-a-pas";
        if (p.indexOf("statphpanimee") !== -1 || p.indexOf("sti0/statistiques") !== -1) return "php-stat-pas-a-pas";
        if (p.indexOf("sql-contraintes") !== -1) return "sql-contraintes";
        if (p.indexOf("tp1-bd") !== -1) return "sql-serie1-ldd";
        if (p.indexOf("tp2-bd") !== -1 || p.indexOf("tp2-correction-bd") !== -1) return "sql-serie2-lmd";
        if (p.indexOf("tp-groupby-bd") !== -1) return "sql-serie3-groupby";
        if (p.indexOf("tp-bd-jointure") !== -1 || p.indexOf("tp4-correction-bd") !== -1) return "sql-serie4-jointure-sr";
        if (p.indexOf("tp-date-ssr") !== -1 || p.indexOf("atelier_sql_3_fenetres") !== -1) return "sql-serie5-gesthotel";
        if (p.indexOf("positionnement-animee") !== -1) return "css-positionnement";
        if (p.indexOf("cssanimee") !== -1 || p.indexOf("box-shadow-text-shadow") !== -1) return "css-decoration-animations";
        if (p.indexOf("tp2corrposition") !== -1) return "tp2-positionnement-corrige";
        if (p.indexOf("site-tunisie-correction-animation") !== -1 || p.indexOf("carte-timbre-droite-haut") !== -1) return "projet-tunisie-animation";
        if (p.indexOf("cours/javascript") !== -1 || p.indexOf("-correction-js") !== -1 || p.indexOf("carte-bancaire/cb") !== -1) return "javascript-controles-sti";
        return null;
      }

      function creerBlocVideoInline(slug, idBox) {
        var info = CATALOGUE_VIDEOS_STI[slug];
        if (!info) return null;
        var url = resoudreUrlVideoSTI(slug);
        var box = document.createElement("div");
        box.className = "sti-video-pas-a-pas-box sti-no-print";
        if (idBox) box.id = idBox;
        box.hidden = true;
        box.innerHTML =
          '<div class="sti-video-pas-a-pas-head">' +
            '<div class="sti-video-pas-a-pas-title">' + info.title + '</div>' +
            '<div class="sti-video-pas-a-pas-actions">' +
              '<button type="button" data-vrate="0.85">0.85×</button>' +
              '<button type="button" data-vrate="1">1×</button>' +
              '<button type="button" data-vrate="1.25">1.25×</button>' +
              '<button type="button" data-vrate="1.5">1.5×</button>' +
              '<a href="' + url + '" download>⬇ MP4</a>' +
              '<button type="button" data-vclose="1">✕ Fermer</button>' +
            '</div>' +
          '</div>' +
          '<video controls muted playsinline webkit-playsinline preload="metadata" src="' + url + '">' +
            '<source src="' + url + '" type="video/mp4" />' +
          '</video>';

        var vid = box.querySelector("video");
        var btnsRate = box.querySelectorAll("button[data-vrate]");
        for (var r = 0; r < btnsRate.length; r++) {
          (function (b) {
            b.addEventListener("click", function () {
              if (vid) vid.playbackRate = parseFloat(b.getAttribute("data-vrate")) || 1;
            });
          })(btnsRate[r]);
        }
        var btnClose = box.querySelector("button[data-vclose]");
        if (btnClose) {
          btnClose.addEventListener("click", function () {
            if (vid) {
              try { vid.pause(); } catch (e) {}
            }
            box.hidden = true;
          });
        }
        return box;
      }

      function basculerBlocVideoInline(box) {
        if (!box) return;
        var vid = box.querySelector("video");
        if (box.hidden) {
          box.hidden = false;
          try {
            box.scrollIntoView({ behavior: "smooth", block: "nearest" });
          } catch (e) {}
          if (vid) {
            try { vid.play(); } catch (e) {}
          }
        } else {
          if (vid) {
            try { vid.pause(); } catch (e) {}
          }
          box.hidden = true;
        }
      }

      window.ouvrirVideoPasAPasSTI = function (slugOuUrl, titreOpt) {
        try {
          if (
            window.top &&
            window.top !== window &&
            CATALOGUE_VIDEOS_STI[slugOuUrl] &&
            typeof window.top.ouvrirVideoPasAPasSTI === "function"
          ) {
            window.top.ouvrirVideoPasAPasSTI(slugOuUrl, titreOpt);
            return;
          }
        } catch (e) {}
        var info = CATALOGUE_VIDEOS_STI[slugOuUrl] || null;
        var url = resoudreUrlVideoSTI(slugOuUrl);
        var titre = titreOpt || (info ? info.title : "🎥 Vidéo du pas-à-pas");

        var overlay = document.getElementById("sti-video-modal-overlay");
        if (!overlay) {
          overlay = document.createElement("div");
          overlay.id = "sti-video-modal-overlay";
          overlay.className = "sti-no-print";
          overlay.hidden = true;
          overlay.innerHTML =
            '<div class="sti-video-modal-card" role="dialog" aria-modal="true">' +
              '<div class="sti-video-pas-a-pas-head">' +
                '<div class="sti-video-pas-a-pas-title" id="sti-video-modal-title"></div>' +
                '<div class="sti-video-pas-a-pas-actions">' +
                  '<button type="button" data-mrate="0.85">0.85×</button>' +
                  '<button type="button" data-mrate="1">1×</button>' +
                  '<button type="button" data-mrate="1.25">1.25×</button>' +
                  '<button type="button" data-mrate="1.5">1.5×</button>' +
                  '<a id="sti-video-modal-dl" href="#" download>⬇ MP4</a>' +
                  '<button type="button" id="sti-video-modal-close">✕ Fermer</button>' +
                '</div>' +
              '</div>' +
              '<video id="sti-video-modal-player" controls muted playsinline webkit-playsinline preload="metadata"></video>' +
            '</div>';
          document.body.appendChild(overlay);

          var mVid = document.getElementById("sti-video-modal-player");
          var mRates = overlay.querySelectorAll("button[data-mrate]");
          for (var i = 0; i < mRates.length; i++) {
            (function (b) {
              b.addEventListener("click", function () {
                if (mVid) mVid.playbackRate = parseFloat(b.getAttribute("data-mrate")) || 1;
              });
            })(mRates[i]);
          }
          function fermerModaleVideo() {
            if (mVid) {
              try { mVid.pause(); } catch (e) {}
            }
            overlay.hidden = true;
          }
          document.getElementById("sti-video-modal-close").addEventListener("click", fermerModaleVideo);
          overlay.addEventListener("click", function (ev) {
            if (ev.target === overlay) fermerModaleVideo();
          });
        }

        var tEl = document.getElementById("sti-video-modal-title");
        var dlEl = document.getElementById("sti-video-modal-dl");
        var vEl = document.getElementById("sti-video-modal-player");
        if (tEl) tEl.textContent = titre;
        if (dlEl) dlEl.href = url;
        if (vEl) {
          if (vEl.getAttribute("src") !== url) {
            vEl.setAttribute("src", url);
            vEl.innerHTML = '<source src="' + url + '" type="video/mp4" />';
            try { vEl.load(); } catch (e) {}
          }
          overlay.hidden = false;
          try { vEl.play(); } catch (e) {}
        }
      };

      var slugVideoPage = detecterVideoParChemin(location.pathname);

      function injecterBoutonsStudio() {
        var btnPlayStat = document.getElementById("btn-play");
        var barresCibles = [
          document.querySelector(".controls"),
          document.querySelector(".ctrl"),
          document.querySelector(".ctrl-mobile"),
          document.querySelector(".ctrl-texte"),
          document.querySelector(".topbar-guichet"),
          document.querySelector(".bar:not(.scan-bar)"),
          document.getElementById("phpm-ctrl"),
          document.querySelector(".topbar-recap > div:last-child"),
          document.querySelector(".barre"),
          btnPlayStat ? btnPlayStat.parentNode : null,
          document.querySelector(".tp1-controls"),
          document.querySelector(".tp2-controls"),
          document.querySelector(".tp3-controls"),
          document.querySelector(".tpbd-controls"),
          document.querySelector(".tpgh-controls")
        ];
        for (var i = 0; i < barresCibles.length; i++) {
          var bar = barresCibles[i];
          if (!bar || bar.tagName === "INPUT" || bar.querySelector(".sti-btn-video-dedie")) continue;

          if (slugVideoPage && CATALOGUE_VIDEOS_STI[slugVideoPage]) {
            var bVid = document.createElement("button");
            bVid.type = "button";
            bVid.className = "sti-btn-video-dedie";
            bVid.textContent = (bar.id === "phpm-ctrl" || bar.classList.contains("ctrl-mobile"))
              ? "🎥 Vidéo"
              : "🎥 Vidéo du pas-à-pas (.mp4)";
            bVid.title = CATALOGUE_VIDEOS_STI[slugVideoPage].title;
            bVid.addEventListener("click", function (ev) {
              ev.stopPropagation();
              window.ouvrirVideoPasAPasSTI(slugVideoPage);
            });
            bar.appendChild(bVid);
          }
        }

        /* Écrans mobiles portrait « Tournez-moi ! 🔄 » (#rot-overlay et #rotate-overlay) */
        if (slugVideoPage && CATALOGUE_VIDEOS_STI[slugVideoPage]) {
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
              bRotVid.textContent = "🎥 Regarder la vidéo du pas-à-pas (.mp4)";
              bRotVid.addEventListener("click", function (ev) {
                ev.stopPropagation();
                window.ouvrirVideoPasAPasSTI(slugVideoPage);
              });
              rBoite.appendChild(bRotVid);
            }
          }
        }

        /* Bannière vidéo en haut de chaque page ayant un pas-à-pas dédié (PC & Mobile) */
        if (slugVideoPage && CATALOGUE_VIDEOS_STI[slugVideoPage] && !document.getElementById("sti-banniere-video-dediee")) {
          var conteneurHaut =
            document.querySelector(".topbar-guichet, .topbar-recap, nav.barre, .wrap, .container, main, .page, body > header, body > div");
          if (conteneurHaut && conteneurHaut.parentNode) {
            var barreDediee = document.createElement("div");
            barreDediee.id = "sti-banniere-video-dediee";
            barreDediee.className = "sti-no-print";
            barreDediee.style.cssText = "max-width:980px;margin:8px auto 6px;padding:0 10px;display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;";
            var btnOuvrir = document.createElement("button");
            btnOuvrir.type = "button";
            btnOuvrir.className = "sti-btn-video-dedie";
            btnOuvrir.textContent = "🎥 Voir la vidéo de ce pas-à-pas (.mp4)";
            btnOuvrir.title = CATALOGUE_VIDEOS_STI[slugVideoPage].title;
            var blocV = document.getElementById("sti-video-inline-main") || creerBlocVideoInline(slugVideoPage, "sti-video-inline-main");
            btnOuvrir.addEventListener("click", function () {
              basculerBlocVideoInline(blocV);
            });
            var btnModalV = document.createElement("button");
            btnModalV.type = "button";
            btnModalV.className = "sti-btn-video-dedie";
            btnModalV.style.background = "linear-gradient(125deg,#0e7c86,#6b5bd2)";
            btnModalV.textContent = "⛶ Plein écran (.mp4)";
            btnModalV.addEventListener("click", function () {
              window.ouvrirVideoPasAPasSTI(slugVideoPage);
            });
            barreDediee.appendChild(btnOuvrir);
            barreDediee.appendChild(btnModalV);
            conteneurHaut.parentNode.insertBefore(barreDediee, conteneurHaut);
            if (blocV && !blocV.parentNode) {
              conteneurHaut.parentNode.insertBefore(blocV, conteneurHaut);
            }
          }
        }

        /* Studios SQL intégrés dans cours/sql.html et cours/sql-bases-ldd-lmd-lcd.html */
        var sqlStudios = [
          ["janim-btn-play", "join", "sql-jointure-where", "🎥 Vidéo Jointure WHERE (.mp4)"],
          ["gbanim-btn-play", "groupby", "sql-groupby-having", "🎥 Vidéo GROUP BY & HAVING (.mp4)"],
          ["hvanim-btn-play", "having", "sql-groupby-having", "🎥 Vidéo GROUP BY & HAVING (.mp4)"]
        ];
        for (var s = 0; s < sqlStudios.length; s++) {
          (function (btnId, kind, vSlug, vLabel) {
            var playBtn = document.getElementById(btnId);
            if (!playBtn || !playBtn.parentNode || playBtn.parentNode.querySelector(".sti-btn-video-sql-" + kind)) return;
            var bVideoSql = document.createElement("button");
            bVideoSql.type = "button";
            bVideoSql.className = "sti-btn-video-dedie sti-btn-video-sql-" + kind;
            bVideoSql.textContent = vLabel;
            var idBoxSql = "sti-video-box-sql-" + kind;
            var wrapStudio = playBtn.closest(".sql-janim-wrap") || playBtn.parentNode;
            var boxSql = document.getElementById(idBoxSql);
            if (!boxSql && wrapStudio) {
              boxSql = creerBlocVideoInline(vSlug, idBoxSql);
              if (boxSql) wrapStudio.appendChild(boxSql);
            }
            bVideoSql.addEventListener("click", function () {
              if (boxSql) basculerBlocVideoInline(boxSql);
              else window.ouvrirVideoPasAPasSTI(vSlug);
            });
            playBtn.parentNode.appendChild(bVideoSql);
          })(sqlStudios[s][0], sqlStudios[s][1], sqlStudios[s][2], sqlStudios[s][3]);
        }

        /* Bouton #btnSqlContraintes dans cours/sql.html */
        var btnContraintes = document.getElementById("btnSqlContraintes");
        if (btnContraintes && btnContraintes.parentNode && !btnContraintes.parentNode.querySelector(".sti-btn-video-contraintes")) {
          var wrapC = document.createElement("div");
          wrapC.style.cssText = "margin-top:8px;display:flex;justify-content:center;flex-wrap:wrap;gap:6px;";
          var bVC = document.createElement("button");
          bVC.type = "button";
          bVC.className = "sti-btn-video-dedie sti-btn-video-contraintes";
          bVC.textContent = "🎥 Vidéo pas-à-pas : Les 6 Contraintes d'Intégrité SQL (.mp4)";
          var boxC = creerBlocVideoInline("sql-contraintes", "sti-video-box-sql-contraintes");
          bVC.addEventListener("click", function () {
            basculerBlocVideoInline(boxC);
          });
          wrapC.appendChild(bVC);
          btnContraintes.parentNode.insertBefore(wrapC, btnContraintes.nextSibling);
          if (boxC) {
            btnContraintes.parentNode.insertBefore(boxC, wrapC.nextSibling);
          }
        }

        /* Boutons Guichet (#animOpen, #btn-top-anim-guichet, #animModal, #recapModal) dans cours/php.html */
        var btnAnimOpen = document.getElementById("animOpen");
        if (btnAnimOpen && btnAnimOpen.parentNode && !btnAnimOpen.parentNode.querySelector(".sti-btn-video-guichet")) {
          var bVG = document.createElement("button");
          bVG.type = "button";
          bVG.className = "sti-btn-video-dedie sti-btn-video-guichet";
          bVG.style.marginTop = "8px";
          bVG.textContent = "🎥 Vidéo pas-à-pas : L'Histoire du Guichet PHP + MySQLi (.mp4)";
          var boxG = creerBlocVideoInline("php-guichet", "sti-video-box-php-guichet");
          bVG.addEventListener("click", function () {
            basculerBlocVideoInline(boxG);
          });
          btnAnimOpen.parentNode.insertBefore(bVG, btnAnimOpen.nextSibling);
          if (boxG) {
            btnAnimOpen.parentNode.insertBefore(boxG, bVG.nextSibling);
          }
        }
        var btnTopGuichet = document.getElementById("btn-top-anim-guichet");
        if (btnTopGuichet && btnTopGuichet.parentNode && !btnTopGuichet.parentNode.querySelector(".sti-btn-video-top-php")) {
          var bVGTop = document.createElement("button");
          bVGTop.type = "button";
          bVGTop.className = "sti-btn-video-dedie sti-btn-video-top-php";
          bVGTop.innerHTML = '<span>🎥</span><span>Guichet</span>';
          bVGTop.title = "Vidéo pas-à-pas : Histoire du Guichet PHP + MySQLi (.mp4)";
          bVGTop.addEventListener("click", function () {
            window.ouvrirVideoPasAPasSTI("php-guichet");
          });
          var bVRTop = document.createElement("button");
          bVRTop.type = "button";
          bVRTop.className = "sti-btn-video-dedie";
          bVRTop.innerHTML = '<span>🎥</span><span>Récap</span>';
          bVRTop.title = "Vidéo pas-à-pas : Récap PHP en 8 étapes (.mp4)";
          bVRTop.addEventListener("click", function () {
            window.ouvrirVideoPasAPasSTI("php-recap");
          });
          btnTopGuichet.parentNode.appendChild(bVGTop);
          btnTopGuichet.parentNode.appendChild(bVRTop);
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
        var recapTools = document.querySelector("#recapModal .anim-tools");
        if (recapTools && !recapTools.querySelector(".sti-btn-video-modal-recap")) {
          var bModR = document.createElement("button");
          bModR.type = "button";
          bModR.className = "sti-btn-video-dedie sti-btn-video-modal-recap";
          bModR.textContent = "🎥 Vidéo (.mp4)";
          bModR.addEventListener("click", function () {
            window.ouvrirVideoPasAPasSTI("php-recap");
          });
          recapTools.insertBefore(bModR, recapTools.firstChild);
        }

        /* En-têtes des modales #pdfModal (series-exercices.html) et #modal-doc-bac (bac-pratique.html) */
        var pdfFrame = document.getElementById("pdfFrame");
        var modalReloadBtn = document.getElementById("modalReloadBtn");
        if (pdfFrame && modalReloadBtn && modalReloadBtn.parentNode && !document.getElementById("sti-btn-video-pdfmodal")) {
          var bPdfVid = document.createElement("button");
          bPdfVid.type = "button";
          bPdfVid.id = "sti-btn-video-pdfmodal";
          bPdfVid.className = "sti-btn-video-dedie";
          bPdfVid.style.display = "none";
          bPdfVid.textContent = "🎥 Vidéo (.mp4)";
          bPdfVid.addEventListener("click", function () {
            var sl = detecterVideoParChemin(pdfFrame.getAttribute("src") || "");
            if (sl) window.ouvrirVideoPasAPasSTI(sl);
          });
          modalReloadBtn.parentNode.insertBefore(bPdfVid, modalReloadBtn);
          function majBtnPdfVid() {
            var sl = detecterVideoParChemin(pdfFrame.getAttribute("src") || "");
            bPdfVid.style.display = sl ? "inline-flex" : "none";
          }
          pdfFrame.addEventListener("load", majBtnPdfVid);
          if (typeof MutationObserver !== "undefined") {
            new MutationObserver(majBtnPdfVid).observe(pdfFrame, { attributes: true, attributeFilter: ["src"] });
          }
        }

        var docBacFrame = document.getElementById("modal-doc-frame");
        var docBacTitre = document.getElementById("modal-doc-titre");
        if (docBacFrame && docBacTitre && docBacTitre.nextElementSibling && !document.getElementById("sti-btn-video-docbac")) {
          var bBacVid = document.createElement("button");
          bBacVid.type = "button";
          bBacVid.id = "sti-btn-video-docbac";
          bBacVid.className = "sti-btn-video-dedie";
          bBacVid.style.display = "none";
          bBacVid.textContent = "🎥 Vidéo (.mp4)";
          bBacVid.addEventListener("click", function () {
            var sl = detecterVideoParChemin(docBacFrame.getAttribute("src") || "");
            if (sl) window.ouvrirVideoPasAPasSTI(sl);
          });
          docBacTitre.nextElementSibling.insertBefore(bBacVid, docBacTitre.nextElementSibling.firstChild);
          function majBtnBacVid() {
            var sl = detecterVideoParChemin(docBacFrame.getAttribute("src") || "");
            bBacVid.style.display = sl ? "inline-flex" : "none";
          }
          docBacFrame.addEventListener("load", majBtnBacVid);
          if (typeof MutationObserver !== "undefined") {
            new MutationObserver(majBtnBacVid).observe(docBacFrame, { attributes: true, attributeFilter: ["src"] });
          }
        }
      }

      injecterBoutonsStudio();
      setTimeout(injecterBoutonsStudio, 900);
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
    installerVideosPasAPasSTI();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
