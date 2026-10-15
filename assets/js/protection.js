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

      /* Vidéos commentées avec la voix de l'homme : Guichet PHP + MySQLi, CSS pas à pas Positionnement animé et CSS animée */
      var VIDEO_GUICHET_INFO = {
        file: "php-guichet.mp4?v=208",
        title: "🎥 Animation du Guichet PHP + MySQLi (3 états : INSERT · UPDATE · SELECT)"
      };
      var VIDEO_CSS_POS_INFO = {
        file: "css-positionnement.mp4?v=208",
        title: "🎥 CSS pas à pas — Positionnement animé (display, position & flex)"
      };
      var VIDEO_CSS_DECO_INFO = {
        file: "css-animee.mp4?v=208",
        title: "🎥 CSS pas à pas — Décoration animée (background, shadow, border, table & list)"
      };
      var VIDEO_SQL_INFO = {
        file: "sql-cours.mp4?v=208",
        title: "🎥 Bienvenue dans STI V2.0 By AE — Cours SQL complet animé (.mp4)"
      };

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

      var estPageGuichet = (pathLower.indexOf("php-mysqli") !== -1);
      var estPageCssPos = (pathLower.indexOf("positionnement-animee") !== -1);
      var estPageCssDeco = (pathLower.indexOf("cssanimee") !== -1);
      var estPageSql = (pathLower.indexOf("/sql.html") !== -1 || pathLower.indexOf("sql-contraintes") !== -1);

      /* ── Lecteur vidéo réservé exclusivement à l'animation du Guichet (php-guichet.mp4) ── */
      function creerBlocVideoGuichetInline(idBox) {
        var url = resoudreUrlVideoGuichet();
        var box = document.createElement("div");
        box.className = "sti-video-pas-a-pas-box sti-no-print";
        if (idBox) box.id = idBox;
        box.hidden = true;
        box.style.cssText = "display:none;width:min(1080px,96vw);max-width:100%;max-height:90vh;overflow:hidden;box-sizing:border-box;margin:12px auto;padding:10px 14px;flex-direction:column;";
        box.innerHTML =
          '<div class="sti-video-pas-a-pas-head">' +
            '<div class="sti-video-pas-a-pas-title">' + VIDEO_GUICHET_INFO.title + '</div>' +
            '<div class="sti-video-pas-a-pas-actions">' +
              '<button type="button" data-vrate="0.75">0.75×</button>' +
              '<button type="button" data-vrate="0.85">0.85×</button>' +
              '<button type="button" data-vrate="1" class="is-active" style="background:#177245;border-color:#86efac;color:#fff;">1×</button>' +
              '<button type="button" data-vrate="1.25">1.25×</button>' +
              '<a href="' + url + '" download>⬇ MP4</a>' +
              '<button type="button" data-vclose="1">✕ Fermer</button>' +
            '</div>' +
          '</div>' +
          '<video controls playsinline webkit-playsinline preload="metadata" src="' + url + '" style="width:100%;max-width:100%;height:auto;max-height:calc(88vh - 82px);aspect-ratio:16/9;object-fit:contain;display:block;margin:0 auto;">' +
            '<source src="' + url + '" type="video/mp4" />' +
          '</video>';

        var vid = box.querySelector("video");
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

      window.ouvrirVideoPasAPasSTI = function (slugOuUrl, titreOpt) {
        var sSlug = String(slugOuUrl || "");
        var estSql = (sSlug === "sql-cours" || sSlug.indexOf("sql-cours") !== -1 || (!sSlug && estPageSql));
        var estCssDeco = (!estSql && (sSlug === "css-animee" || sSlug.indexOf("css-animee") !== -1 || (!sSlug && estPageCssDeco)));
        var estCssPos = (!estSql && !estCssDeco && (sSlug === "css-positionnement" || sSlug.indexOf("css-positionnement") !== -1 || (!sSlug && estPageCssPos)));
        var estGuichet = (!estSql && !estCssDeco && !estCssPos && (sSlug === "php-guichet" || sSlug.indexOf("php-guichet") !== -1 || (!sSlug && estPageGuichet)));
        if (!estSql && !estCssDeco && !estCssPos && !estGuichet) {
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
          var fSql = document.getElementById("sqlContraintesFrame");
          if (fSql && fSql.contentWindow) {
            fSql.contentWindow.postMessage({ type: "STI_STOP_SQL" }, "*");
          }
          var fAnim = document.getElementById("animFrame");
          if (fAnim && fAnim.contentWindow) {
            fAnim.contentWindow.postMessage({ type: "STI_STOP_GUICHET" }, "*");
          }
        } catch (e) {}
        var slugCible = estSql ? "sql-cours" : (estCssDeco ? "css-animee" : (estCssPos ? "css-positionnement" : "php-guichet"));
        try {
          if (
            window.top &&
            window.top !== window &&
            typeof window.top.ouvrirVideoPasAPasSTI === "function"
          ) {
            window.top.ouvrirVideoPasAPasSTI(slugCible, titreOpt);
            return;
          }
        } catch (e) {}
        var url = estSql ? resoudreUrlVideoSql() : (estCssDeco ? resoudreUrlVideoCssDeco() : (estCssPos ? resoudreUrlVideoCssPos() : resoudreUrlVideoGuichet()));
        var titre = titreOpt || (estSql ? VIDEO_SQL_INFO.title : (estCssDeco ? VIDEO_CSS_DECO_INFO.title : (estCssPos ? VIDEO_CSS_POS_INFO.title : VIDEO_GUICHET_INFO.title)));

        var overlay = document.getElementById("sti-video-modal-overlay");
        if (!overlay) {
          overlay = document.createElement("div");
          overlay.id = "sti-video-modal-overlay";
          overlay.className = "sti-no-print";
          overlay.hidden = true;
          overlay.style.cssText = "display:none;position:fixed;inset:0;z-index:2147483647;background:rgba(10,15,28,0.88);align-items:center;justify-content:center;padding:10px;box-sizing:border-box;";
          overlay.innerHTML =
            '<div class="sti-video-modal-card" role="dialog" aria-modal="true" style="width:min(1180px,96vw);max-width:96vw;max-height:94vh;overflow:hidden;box-sizing:border-box;display:flex;flex-direction:column;background:#0d1526;color:#f9f1e3;border:2px solid #f4511e;border-radius:16px;padding:10px 14px 12px;">' +
              '<div class="sti-video-pas-a-pas-head" style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:8px;flex-shrink:0;">' +
                '<div class="sti-video-pas-a-pas-title" id="sti-video-modal-title"></div>' +
                '<div class="sti-video-pas-a-pas-actions" style="display:flex;align-items:center;gap:5px;flex-wrap:wrap;">' +
                  '<button type="button" data-mrate="0.75">0.75×</button>' +
                  '<button type="button" data-mrate="0.85">0.85×</button>' +
                  '<button type="button" data-mrate="1" class="is-active" style="background:#177245;border-color:#86efac;color:#fff;">1×</button>' +
                  '<button type="button" data-mrate="1.25">1.25×</button>' +
                  '<a id="sti-video-modal-dl" href="#" download>⬇ MP4</a>' +
                  '<button type="button" id="sti-video-modal-close">✕ Fermer</button>' +
                '</div>' +
              '</div>' +
              '<video id="sti-video-modal-player" controls playsinline webkit-playsinline preload="metadata" style="width:100%;max-width:100%;height:auto;max-height:calc(94vh - 82px);aspect-ratio:16/9;object-fit:contain;display:block;margin:0 auto;border-radius:10px;background:#0d1526;"></video>' +
            '</div>';
          document.body.appendChild(overlay);

          var mVid = document.getElementById("sti-video-modal-player");
          var mRates = overlay.querySelectorAll("button[data-mrate]");
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
          function fermerModaleVideo(ev) {
            if (ev && ev.stopPropagation) ev.stopPropagation();
            if (mVid) {
              try { mVid.pause(); mVid.currentTime = 0; } catch (e) {}
            }
            overlay.hidden = true;
            overlay.style.display = "none";
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

        /* Si un élément est en plein écran (#animBox ou autre), attacher la modale vidéo à l'élément plein écran pour qu'elle soit toujours visible (jamais de voix qui démarre sans vidéo !) */
        var fsParent = document.fullscreenElement || document.webkitFullscreenElement || document.body;
        if (fsParent && overlay.parentNode !== fsParent) {
          fsParent.appendChild(overlay);
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
