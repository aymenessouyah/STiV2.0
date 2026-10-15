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

      /* Vidéos commentées avec la voix de l'homme : Guichet PHP + MySQLi, CSS pas à pas Positionnement animé, CSS animée et les 5 cours complets (SQL, HTML5, CSS3, JavaScript, PHP) */
      var VIDEO_GUICHET_INFO = {
        file: "php-guichet.mp4?v=211",
        title: "🎥 Animation du Guichet PHP + MySQLi (3 états : INSERT · UPDATE · SELECT)"
      };
      var VIDEO_CSS_POS_INFO = {
        file: "css-positionnement.mp4?v=211",
        title: "🎥 CSS pas à pas — Positionnement animé (display, position & flex)"
      };
      var VIDEO_CSS_DECO_INFO = {
        file: "css-animee.mp4?v=211",
        title: "🎥 CSS pas à pas — Décoration animée (background, shadow, border, table & list)"
      };
      var VIDEO_SQL_INFO = {
        file: "sql-cours.mp4?v=211",
        title: "🎥 Bienvenue dans STI V2.0 By AE — Cours SQL complet animé (.mp4)"
      };
      var VIDEO_HTML5_INFO = {
        file: "html5-cours.mp4?v=211",
        title: "🎥 Bienvenue dans STI V2.0 By AE — Cours HTML5 complet animé (.mp4)"
      };
      var VIDEO_CSS3_INFO = {
        file: "css3-cours.mp4?v=211",
        title: "🎥 Bienvenue dans STI V2.0 By AE — Cours CSS3 complet animé (.mp4)"
      };
      var VIDEO_JS_INFO = {
        file: "javascript-cours.mp4?v=211",
        title: "🎥 Bienvenue dans STI V2.0 By AE — Cours JavaScript STI complet animé (.mp4)"
      };
      var VIDEO_PHP_COURS_INFO = {
        file: "php-cours.mp4?v=211",
        title: "🎥 Bienvenue dans STI V2.0 By AE — Cours PHP & MySQLi complet animé (.mp4)"
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
        var estHtml5 = (sSlug === "html5-cours" || sSlug.indexOf("html5-cours") !== -1 || (!sSlug && estPageHtml5));
        var estCss3 = (!estHtml5 && (sSlug === "css3-cours" || sSlug.indexOf("css3-cours") !== -1 || (!sSlug && estPageCss3)));
        var estJs = (!estHtml5 && !estCss3 && (sSlug === "javascript-cours" || sSlug.indexOf("javascript-cours") !== -1 || (!sSlug && estPageJs)));
        var estPhpC = (!estHtml5 && !estCss3 && !estJs && (sSlug === "php-cours" || sSlug.indexOf("php-cours") !== -1 || (!sSlug && estPagePhpCours)));
        var estSql = (!estHtml5 && !estCss3 && !estJs && !estPhpC && (sSlug === "sql-cours" || sSlug.indexOf("sql-cours") !== -1 || (!sSlug && estPageSql)));
        var estCssDeco = (!estHtml5 && !estCss3 && !estJs && !estPhpC && !estSql && (sSlug === "css-animee" || sSlug.indexOf("css-animee") !== -1 || (!sSlug && estPageCssDeco)));
        var estCssPos = (!estHtml5 && !estCss3 && !estJs && !estPhpC && !estSql && !estCssDeco && (sSlug === "css-positionnement" || sSlug.indexOf("css-positionnement") !== -1 || (!sSlug && estPageCssPos)));
        var estGuichet = (!estHtml5 && !estCss3 && !estJs && !estPhpC && !estSql && !estCssDeco && !estCssPos && (sSlug === "php-guichet" || sSlug.indexOf("php-guichet") !== -1 || (!sSlug && estPageGuichet)));
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
            window.top.ouvrirVideoPasAPasSTI(slugCible, titreOpt);
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

        /* ── Barre Vidéo (.mp4) + Voix (.mp3) sur les cours HTML5, CSS3, JavaScript et PHP ── */
        if ((estPageHtml5 || estPageCss3 || estPageJs || estPagePhpCours) && !document.getElementById("sti-cours-media-bar")) {
          var cKey = estPageHtml5 ? "html5" : (estPageCss3 ? "css3" : (estPageJs ? "javascript" : "php"));
          var cLabel = estPageHtml5 ? "HTML5" : (estPageCss3 ? "CSS3" : (estPageJs ? "JavaScript" : "PHP"));
          var cSlug = cKey + "-cours";
          var cAudioUrl = prefixeAssetsSTI() + "audio/" + cSlug + ".mp3?v=209";

          var CUES_MAP = {
            html5: {
              "entete": [8.0, 26.0],
              "structuration": [26.0, 44.0],
              "conteneurs": [44.0, 56.0],
              "listes": [56.0, 67.0],
              "tableaux": [67.0, 78.0],
              "texte-media": [78.07, 95.5],
              "attributs-evenements": [95.5, 107.5],
              "target-explication": [107.5, 117.5],
              "formulaires": [117.5, 137.5],
              "iframe": [137.5, 145.7]
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
              "sec1": [8.5, 18.5],
              "sec2": [8.5, 18.5],
              "sec3": [18.5, 30.5],
              "sec4": [30.5, 44.5],
              "sec5": [44.5, 58.5],
              "sec6": [30.5, 44.5],
              "sec7": [58.5, 73.01],
              "sec8": [73.27, 89.2],
              "sec9": [89.2, 119.2],
              "sec10": [119.2, 131.2],
              "sec11": [131.2, 144.05],
              "sec12": [144.31, 157.3],
              "sec13": [157.3, 171.3],
              "sec14": [171.3, 183.3],
              "sec15": [183.3, 210.9],
              "sec16": [183.3, 210.9]
            },
            php: {
              "s1": [8.0, 24.0],
              "s1-1": [8.0, 24.0],
              "s1b": [8.0, 24.0],
              "s1-3": [8.0, 24.0],
              "s2": [24.0, 44.0],
              "s2-1": [24.0, 44.0],
              "s2-2": [24.0, 44.0],
              "s2-3": [24.0, 44.0],
              "s2-4": [24.0, 44.0],
              "s2-5": [24.0, 44.0],
              "s3": [44.0, 61.18],
              "s4": [61.44, 79.4],
              "s5": [79.4, 93.4],
              "s6": [93.4, 107.4],
              "s7": [107.4, 121.97],
              "s8": [122.23, 158.2],
              "s8anim": [122.23, 138.2],
              "s8-1": [122.23, 138.2],
              "s8-2": [138.2, 158.2],
              "s8-3": [138.2, 158.2],
              "s8-4": [138.2, 158.2],
              "s8-5": [138.2, 158.2],
              "s8-6": [138.2, 158.2],
              "s8-7": [158.2, 172.2],
              "s9": [172.2, 188.8],
              "s10": [172.2, 188.8],
              "s10a": [172.2, 188.8],
              "s10b": [172.2, 188.8],
              "s10c": [172.2, 188.8],
              "s10d": [172.2, 188.8]
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
            if (cSegEnd > 0 && cAudio.currentTime >= cSegEnd - 0.05) {
              window.arreterVoixCoursSTI();
            }
          });
          cAudio.addEventListener("ended", function () {
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

          var barEl = document.createElement("div");
          barEl.id = "sti-cours-media-bar";
          barEl.className = "sti-no-print";
          barEl.style.cssText = "display:flex;flex-wrap:wrap;gap:10px;justify-content:center;align-items:center;margin:12px auto 16px;padding:10px 14px;background:rgba(13,21,38,0.92);border:2px solid #f4511e;border-radius:14px;max-width:760px;box-shadow:0 6px 18px rgba(0,0,0,0.22);";
          barEl.innerHTML =
            '<button type="button" id="sti-btn-cours-video-hero" style="padding:9px 16px;border-radius:10px;border:2px solid #fde68a;background:linear-gradient(120deg,#f4511e,#ff7043);color:#fff;font-weight:800;font-size:13.5px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;">🎥 Vidéo du cours ' + cLabel + ' (.mp4)</button>' +
            '<button type="button" id="sti-btn-cours-voix-hero" style="padding:9px 16px;border-radius:10px;border:2px solid #86efac;background:#177245;color:#fff;font-weight:800;font-size:13.5px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;">🔊 Écouter le cours ' + cLabel + '</button>';

          var targetAnchor =
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

          document.addEventListener("click", function (ev) {
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
      setTimeout(injecterBoutonsStudio, 900);
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
          [0.0, 26.0, "#entete"],
          [26.0, 44.0, "#structuration"],
          [44.0, 56.0, "#conteneurs"],
          [56.0, 67.0, "#listes"],
          [67.0, 78.0, "#tableaux"],
          [78.0, 95.5, "#texte-media"],
          [95.5, 107.5, "#attributs-evenements"],
          [107.5, 117.5, "#target-explication"],
          [117.5, 137.5, "#formulaires"],
          [137.5, 155.0, "#iframe"]
        ],
        css3: [
          [9.78, 36.01, "#point-1"],
          [36.01, 57.37, "#point-2"],
          [57.37, 65.32, "#point-3"],
          [65.32, 73.07, "#point-6"],
          [73.07, 88.63, "#point-7"],
          [88.63, 110.11, "#point-4"],
          [110.11, 132.12, "#point-5"],
          [132.12, 144.62, "#point-8"],
          [144.62, 150.15, "#css-pas-a-pas"]
        ],
        javascript: [
          [0.0, 18.5, "#sec1"],
          [18.5, 30.5, "#sec3"],
          [30.5, 44.5, "#sec4"],
          [44.5, 58.5, "#sec5"],
          [58.5, 73.1, "#sec7"],
          [73.1, 89.2, "#sec8"],
          [89.2, 119.2, "#sec9"],
          [119.2, 131.2, "#sec10"],
          [131.2, 144.2, "#sec11"],
          [144.2, 157.3, "#sec12"],
          [157.3, 171.3, "#sec13"],
          [171.3, 183.3, "#sec14"],
          [183.3, 220.0, "#sec15"]
        ],
        php: [
          [0.0, 24.0, "#s1"],
          [24.0, 44.0, "#s2"],
          [44.0, 61.3, "#s3"],
          [61.3, 79.4, "#s4"],
          [79.4, 93.4, "#s5"],
          [93.4, 107.4, "#s6"],
          [107.4, 122.1, "#s7"],
          [122.1, 138.2, "#s8"],
          [138.2, 158.2, "#s8-2"],
          [158.2, 172.2, "#s8-7"],
          [172.2, 198.0, "#s9"]
        ],
        sql: [
          [0.0, 19.1, "#intro"],
          [19.1, 41.4, "#intro-bd"],
          [41.4, 58.8, "#schema-analogie"],
          [58.8, 77.2, "#intro-sub"],
          [77.2, 102.0, "#intro-cles"],
          [102.0, 123.4, "#intro-contraintes"],
          [123.4, 204.5, "#intro-relations"],
          [204.5, 230.7, "#ldd"],
          [230.7, 264.5, "#ldd-create"],
          [264.5, 296.5, "#ldd-constraints"],
          [296.5, 342.3, "#ldd-alter"],
          [342.3, 360.1, "#ldd-drop"],
          [360.1, 377.0, "#lmd"],
          [377.0, 397.7, "#lmd-insert"],
          [397.7, 411.9, "#lmd-update"],
          [411.9, 437.3, "#lmd-update-jointure"],
          [437.3, 455.8, "#lmd-delete"],
          [455.8, 480.3, "#lmd-select"],
          [480.3, 507.5, "#lmd-jointure"],
          [507.5, 531.7, "#lmd-aggr"],
          [531.7, 555.2, "#lmd-groupby"],
          [555.2, 576.7, "#lmd-having"],
          [576.7, 598.8, "#lmd-strings"],
          [598.8, 626.0, "#lmd-dates"]
        ]
      };

      var guideBox = null;
      var lastTargetEl = null;
      var lastScrollAt = 0;

      function ensureGuideDom() {
        if (guideBox && guideBox.parentNode) return guideBox;
        guideBox = document.createElement("div");
        guideBox.id = "sti-voice-guide-rect";
        guideBox.className = "sti-no-print";
        guideBox.style.cssText =
          "position:fixed;left:0;top:0;width:0;height:0;opacity:0;pointer-events:none;z-index:2147482500;" +
          "border:3px solid #ff2a00;border-radius:12px;background:rgba(255,200,0,0.09);" +
          "box-shadow:0 0 0 4px rgba(255,145,0,0.34),0 8px 24px rgba(255,42,0,0.22);" +
          "transition:top 0.22s ease-out,left 0.22s ease-out,width 0.22s ease-out,height 0.22s ease-out,opacity 0.18s ease;";
        guideBox.innerHTML =
          '<div id="sti-voice-guide-badge" style="position:absolute;left:-34px;top:50%;transform:translateY(-50%);width:28px;height:28px;border-radius:8px;background:#ff2a00;border:2px solid #fde68a;color:#fff;font-size:13px;font-weight:900;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,0.35);">▶</div>' +
          '<div id="sti-voice-guide-line" style="position:absolute;left:6px;right:6px;bottom:-4px;height:5px;border-radius:4px;background:linear-gradient(90deg,#ff2a00,#ffd600,#ff2a00);box-shadow:0 0 10px rgba(255,42,0,0.75);"></div>';
        document.body.appendChild(guideBox);
        return guideBox;
      }

      function masquerGuide() {
        if (guideBox) {
          guideBox.style.opacity = "0";
        }
        lastTargetEl = null;
      }

      function trouverAudioActif() {
        var a = window.__stiActiveVoiceAudio;
        if (a && !a.paused && !a.ended) return a;
        var list = document.querySelectorAll("audio");
        for (var i = 0; i < list.length; i++) {
          var el = list[i];
          var s = (el.currentSrc || el.src || "").toLowerCase();
          if (!el.paused && !el.ended && s.indexOf("foret.mp3") === -1) {
            window.__stiActiveVoiceAudio = el;
            return el;
          }
        }
        return null;
      }

      function collecterBlocsSection(anchorEl) {
        if (!anchorEl) return [];
        var containers = [];
        var tag = (anchorEl.tagName || "").toUpperCase();
        if (tag === "SECTION" || (tag === "DIV" && !anchorEl.classList.contains("section-divider"))) {
          containers.push(anchorEl);
        } else {
          containers.push(anchorEl);
          var sib = anchorEl.nextElementSibling;
          var guard = 0;
          while (sib && guard < 35) {
            guard++;
            var sTag = (sib.tagName || "").toUpperCase();
            if (
              (tag === "H2" && sTag === "H2") ||
              (anchorEl.classList.contains("section-divider") && sib.classList && sib.classList.contains("section-divider"))
            ) {
              break;
            }
            containers.push(sib);
            sib = sib.nextElementSibling;
          }
        }

        var raw = [];
        for (var c = 0; c < containers.length; c++) {
          var root = containers[c];
          var kids = root.querySelectorAll
            ? root.querySelectorAll("h2, h3, h4, p, pre, table, .card, .fiche, .req-card, .code-block, .tip, .warn, .alert, ul, ol")
            : [];
          if (!kids || kids.length === 0) {
            raw.push(root);
          } else {
            for (var k = 0; k < kids.length; k++) {
              raw.push(kids[k]);
            }
          }
        }

        /* Filtrer les éléments visibles de taille lisible sans doublons imbriqués */
        var filtered = [];
        for (var i = 0; i < raw.length; i++) {
          var el = raw[i];
          if (!el || !el.getBoundingClientRect) continue;
          var r = el.getBoundingClientRect();
          if (r.width < 120 || r.height < 20 || r.height > 460) continue;
          var skip = false;
          for (var j = 0; j < filtered.length; j++) {
            if (filtered[j].contains(el) && filtered[j].getBoundingClientRect().height < 210) {
              skip = true;
              break;
            }
          }
          if (!skip) filtered.push(el);
        }
        return filtered.length > 0 ? filtered : [anchorEl];
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
        var pLow = (window.location.pathname || "").toLowerCase();
        var courseKey =
          pLow.indexOf("/html5.html") !== -1 ? "html5" :
          pLow.indexOf("/css3.html") !== -1 ? "css3" :
          pLow.indexOf("/javascript.html") !== -1 ? "javascript" :
          pLow.indexOf("/php.html") !== -1 ? "php" :
          pLow.indexOf("/sql.html") !== -1 ? "sql" : "";

        var targetEl = null;
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
          var anchor = document.querySelector(activeSeg[2]);
          if (anchor) {
            var blocs = collecterBlocsSection(anchor);
            var ratio = (t - activeSeg[0]) / Math.max(0.5, activeSeg[1] - activeSeg[0]);
            if (ratio < 0) ratio = 0;
            if (ratio > 0.999) ratio = 0.999;
            var idx = Math.floor(ratio * blocs.length);
            targetEl = blocs[idx] || anchor;
          }
        } else {
          /* Pages d'animations pas à pas (Positionnement CSS, Décoration CSS, Guichet, Contraintes SQL) */
          targetEl =
            document.querySelector(".phrase-retenir-cadre:not([hidden])") ||
            document.querySelector("#panneau-explication") ||
            document.querySelector("#explainBox") ||
            document.querySelector(".tab-pane.active .card") ||
            document.querySelector("#code-box");
        }

        if (!targetEl || !targetEl.getBoundingClientRect) {
          masquerGuide();
          return;
        }

        var now = Date.now();
        if (targetEl !== lastTargetEl) {
          lastTargetEl = targetEl;
          var rectCheck = targetEl.getBoundingClientRect();
          if ((rectCheck.top < 88 || rectCheck.bottom > window.innerHeight - 68) && now - lastScrollAt > 900) {
            lastScrollAt = now;
            try {
              targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
            } catch (e) {}
          }
        }

        var rect = targetEl.getBoundingClientRect();
        if (rect.bottom < 40 || rect.top > window.innerHeight - 20 || rect.width < 60) {
          masquerGuide();
          return;
        }
        var g = ensureGuideDom();
        var padX = 8;
        var padY = 5;
        var left = Math.max(8, Math.round(rect.left - padX));
        var top = Math.max(54, Math.round(rect.top - padY));
        var width = Math.min(window.innerWidth - left - 8, Math.round(rect.width + padX * 2));
        var height = Math.min(window.innerHeight - top - 8, Math.round(rect.height + padY * 2));
        g.style.left = left + "px";
        g.style.top = top + "px";
        g.style.width = width + "px";
        g.style.height = height + "px";
        g.style.opacity = "1";
      }

      setInterval(majPositionGuide, 160);
      window.addEventListener("scroll", function () {
        if (lastTargetEl) majPositionGuide();
      }, { passive: true });
      window.addEventListener("resize", function () {
        if (lastTargetEl) majPositionGuide();
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
