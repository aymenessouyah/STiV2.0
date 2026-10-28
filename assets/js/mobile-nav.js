/* Navigation mobile : Accueil, Cours, Vidéos, Quiz et Autres. */
(function () {
  "use strict";
  if (window.__STI_BNAV) return;
  window.__STI_BNAV = true;

  var doc = document;
  var root = doc.documentElement;
  if (!/^https?:$/.test(location.protocol)) return;
  if (location.pathname.indexOf("/tests/") !== -1) return; /* harnais internes : rien ne doit bouger */
  /* Le tableau de bord reste inchangé. */
  var pnNet = location.pathname.replace(/\/$/, "");
  if (/(^|\/)admin(\.html)?$/i.test(pnNet)) return;

  /* Conserver le préfixe du site dans les liens. */
  function racine() {
    try {
      var pn = location.pathname;
      var m = pn.match(/^(.*?)\/(?:cours|exercices|projets|documents|annexes|quiz|cssanimee|Positionnement-animee|tests)\//);
      if (m) return location.origin + m[1] + "/";
      return location.origin + pn.slice(0, pn.lastIndexOf("/") + 1);
    } catch (e) { return "./"; }
  }

  var R = racine();

  /* Préparer le verrou historique avant changement de contrôleur. */
  var chargementProfilMaj;
  function profilPourActivation() {
    if (window.STIProfil && window.STIProfil.preparerActivationServiceWorker) return Promise.resolve(window.STIProfil);
    if (chargementProfilMaj) return chargementProfilMaj;
    chargementProfilMaj = new Promise(function (resolve) {
      var script = doc.createElement("script"), termine = false;
      function finir() {
        if (termine) return;
        termine = true;
        resolve(window.STIProfil || null);
      }
      script.src = R + "assets/js/profil.js";
      script.setAttribute("data-sti-quiz-seul", "");
      script.onload = script.onerror = finir;
      (doc.head || doc.documentElement).appendChild(script);
      setTimeout(finir, 1200);
    }).then(function (profil) { chargementProfilMaj = null; return profil; });
    return chargementProfilMaj;
  }
  /* Préparer la version avant la décision de rechargement historique. */
  if (navigator.serviceWorker && typeof window.fetch === "function") {
    var fetchAvantVersion = window.fetch;
    window.fetch = function (input) {
      var resultat = fetchAvantVersion.apply(this, arguments), cible;
      try { cible = new URL(typeof input === "string" ? input : input.url, location.href); } catch (e) { return resultat; }
      if (cible.origin !== location.origin || cible.pathname !== new URL(R + "sw.js").pathname || !cible.searchParams.has("t")) return resultat;
      return resultat.then(function (rep) {
        if (!rep || !rep.ok) return rep;
        return rep.clone().text().then(function (texte) {
          var version = (texte.match(/sti-atelier-v(\d+)/i) || [])[1];
          if (!version) return rep;
          return profilPourActivation().then(function (profil) {
            if (profil && profil.preparerVerificationServiceWorker && profil.preparerVerificationServiceWorker(version)) verifierApresReconnexion();
            return rep;
          });
        }).catch(function () { return rep; });
      });
    };
  }
  if (navigator.serviceWorker && typeof navigator.serviceWorker.addEventListener === "function") navigator.serviceWorker.addEventListener("message", function (evt) {
    if (!evt.data || evt.data.type !== "STI_PREPARER_ACTIVATION") return;
    profilPourActivation().then(function (profil) {
      var ok = !!(profil && profil.preparerActivationServiceWorker && profil.preparerActivationServiceWorker(evt.data.version));
      if (evt.ports && evt.ports[0]) evt.ports[0].postMessage({ prepare: ok });
    });
  });

  /* Rechercher uniquement le delta au retour du réseau. */
  var verificationReseauEnCours = false;
  var verificationReseauDemandee = false;
  function verifierApresReconnexion() {
    if (!navigator.serviceWorker || !navigator.serviceWorker.getRegistration) return;
    if (verificationReseauEnCours) { verificationReseauDemandee = true; return; }
    verificationReseauEnCours = true;
    navigator.serviceWorker.getRegistration(R).then(function (reg) {
      if (!reg) return navigator.serviceWorker.register(R + "sw.js", { updateViaCache: "none" });
      return reg.update().catch(function () {}).then(function () {
        /* Réessayer l'activation différée si un ancien onglet a été fermé. */
        if (reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
        else if (!reg.installing && reg.active) reg.active.postMessage({ type: "SYNC_UPDATE" });
      });
    }).catch(function () {}).then(function () {
      verificationReseauEnCours = false;
      if (verificationReseauDemandee && navigator.onLine) {
        verificationReseauDemandee = false;
        verifierApresReconnexion();
      }
    });
  }
  window.addEventListener("online", verifierApresReconnexion);
  window.addEventListener("focus", function () {
    if (navigator.serviceWorker && navigator.serviceWorker.getRegistration) navigator.serviceWorker.getRegistration(R).then(function (reg) {
      if (reg && reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
    }).catch(function () {});
  });

  /* ---------- styles ---------- */
  var css = [
    ":root{--sti-bnav-h:calc(56px + env(safe-area-inset-bottom,0px))}",
    "#sti-bnav{display:none}",
    "@media (max-width:700px){",
    "html.sti-bnav-on body{padding-bottom:calc(var(--sti-bnav-h) + 10px + var(--sti-bnav-bas,0px))}",
    "#sti-bnav{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));align-items:stretch;position:fixed;left:0;right:0;bottom:var(--sti-bnav-bas,0px);z-index:2147483000;background:var(--surface,#fffcf3);border-top:1.5px solid var(--border,#e7d9bd);padding-bottom:env(safe-area-inset-bottom,0px);font-family:system-ui,-apple-system,'Segoe UI',sans-serif;box-shadow:0 -6px 18px rgba(15,23,38,.10)}",
    "html[data-theme='dark'] #sti-bnav{background:var(--surface,#121a2b);border-top-color:var(--border,#26314c)}",
    "#sti-bnav *{box-sizing:border-box}",
    "html[data-theme='dark'] #sti-bnav .sti-bnav-i{color:var(--muted,#9aa7c4)}",
    "#sti-bnav .sti-bnav-i{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;min-height:56px;padding:7px 4px 6px;margin:0;color:var(--muted,#6b6250);text-decoration:none;text-transform:none;font:800 10.5px/1 system-ui,-apple-system,'Segoe UI',sans-serif;letter-spacing:.02em;white-space:nowrap;-webkit-tap-highlight-color:transparent;background:none;border:0;box-shadow:none;transform:none;cursor:pointer;width:100%;transition:none}",
    "#sti-bnav .sti-bnav-i svg{display:block;width:21px;height:21px;margin:0;stroke:currentColor;fill:none;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}",
    "#sti-bnav .sti-bnav-i span{display:block}",
    "@media (max-width:400px){#sti-bnav .sti-bnav-i{font-size:9px;gap:2px}}",
    "html.sti-modal-open #sti-bnav,html.sti-msn-mob-open #sti-bnav{display:none!important}",
    /* Garder les flotteurs au-dessus de la barre. */
    "html.sti-bnav-on #sti-btn-messenger-global{bottom:calc(var(--sti-bnav-h) + var(--sti-bnav-bas,0px) + 10px)!important}",
    "html.sti-bnav-on #sti-msn-bulle-attention{bottom:calc(var(--sti-bnav-h) + var(--sti-bnav-bas,0px) + 64px)!important}",
    "html.sti-bnav-on #sti-auto-to-top{bottom:calc(var(--sti-bnav-h) + var(--sti-bnav-bas,0px) + 118px)!important}",
    /* Les boutons de retour en haut restent au-dessus du diagnostic. */
    "html.sti-bnav-on #to-top,html.sti-bnav-on #backToTop,html.sti-bnav-on #backToTopBtn,html.sti-bnav-on .to-top,html.sti-bnav-on .back-to-top-btn{bottom:calc(var(--sti-bnav-h) + var(--sti-bnav-bas,0px) + 118px)!important}",
    /* Le thème reste accessible dans la roue et la barre du haut. */
    "#sti-universal-theme-btn{display:none!important}",
    "html.sti-bnav-on #sti-sync-pastille{bottom:calc(var(--sti-bnav-h) + var(--sti-bnav-bas,0px) + 14px)!important}",
    "html.sti-bnav-on #sti-diagnostic-donnees,html.sti-bnav-on #sti-labo-offline-diagnostic-button{bottom:calc(var(--sti-bnav-h) + var(--sti-bnav-bas,0px) + 14px)!important}",
    "}",
    /* tiroir « Autres » */
    "#sti-bnav-voile{display:none;position:fixed;inset:0;z-index:2147482990;background:rgba(13,18,30,.45)}",
    "#sti-bnav-sheet{display:none;position:fixed;left:0;right:0;bottom:calc(var(--sti-bnav-h,56px) + var(--sti-bnav-bas,0px));z-index:2147482995;max-height:62vh;overflow-y:auto;padding:14px 12px calc(14px + env(safe-area-inset-bottom,0px));gap:8px;grid-template-columns:1fr 1fr;background:var(--surface,#fffcf3);border-top:1.5px solid var(--border,#e7d9bd);border-radius:16px 16px 0 0;box-shadow:0 -10px 24px rgba(15,23,38,.20);font-family:system-ui,-apple-system,'Segoe UI',sans-serif}",
    "html[data-theme='dark'] #sti-bnav-sheet{background:var(--surface,#121a2b);border-top-color:var(--border,#26314c)}",
    "html.sti-bnav-sheet-open #sti-bnav-voile{display:block}",
    "html.sti-bnav-sheet-open #sti-bnav-sheet{display:grid}",
    "#sti-bnav .sti-bnav-i.on{color:var(--accent,#f4511e)}",
    "html[data-theme='dark'] #sti-bnav-sheet .sti-bnav-l{color:var(--ink,#eef2ff);background:#1a2338;border-color:#26314c}",
    "#sti-bnav .sti-bnav-i.on::before{content:'';position:absolute;top:-1.5px;left:22%;right:22%;height:2.5px;border-radius:0 0 3px 3px;background:var(--accent,#f4511e)}",
    "#sti-bnav-sheet .sti-bnav-l{display:flex;align-items:center;gap:9px;padding:12px 12px;border:1.5px solid var(--border,#e7d9bd);border-radius:12px;text-decoration:none;font:800 12.5px/1.2 system-ui,-apple-system,'Segoe UI',sans-serif;color:var(--ink,#0f1726);background:var(--surface-2,#f6eedc);margin:0;box-shadow:none;text-align:left}",
    "#sti-bnav-sheet .sti-bnav-l b{font-weight:800}",
    "@media (max-width:700px){html.sti-bnav-on #sti-bnav{}}",
    "@media (max-width:700px){#stix-nav a[href$=\"index.html#cours\"]{display:none!important}}", /* v420→421 (consigne n°4) : « cours du site » masqué sur mobile */
    "@media (max-width:700px){#sti-bnav{transition:transform .28s ease}}",
    "@media (max-width:700px){html.sti-barres-cachees #sti-bnav{transform:translateY(150%)}}",
    "@media (max-width:700px){.sti-barre-suivie{transition:transform .28s ease}}",
    "@media (max-width:700px){html.sti-barres-cachees .sti-barre-suivie.sti-barre-roulee{transform:translateY(-105%)}}",
    "@media print{#sti-bnav,#sti-bnav-sheet,#sti-bnav-voile{display:none!important}html.sti-bnav-on body{padding-bottom:0!important}html.sti-barres-cachees .sti-barre-suivie{transform:none!important}}"
  ].join("");
  var st = doc.createElement("style");
  st.id = "sti-bnav-css";
  st.textContent = css;
  (doc.head || doc.documentElement).appendChild(st);

  /* ---------- icônes (SVG en ligne, pas de dépendance externe) ---------- */
  function ico(nom) {
    var s = '<svg viewBox="0 0 24 24" aria-hidden="true">';
    if (nom === "accueil") s += '<path d="M3 10.6 12 3.2l9 7.4"/><path d="M5.6 9.4V20.4h12.8V9.4"/><path d="M10 20.4v-5.2h4v5.2"/>';
    if (nom === "videos") s += '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m10 9 5 3-5 3z"/>';
    if (nom === "cours") s += '<path d="M12 6.4C10.4 4.9 7.4 4.4 4.4 5.1v12.8c3-.7 6-.2 7.6 1.3 1.6-1.5 4.6-2 7.6-1.3V5.1c-3-.7-6-.2-7.6 1.3z"/><path d="M12 6.4v12.8"/>';
    if (nom === "quiz") s += '<circle cx="12" cy="12" r="9"/><path d="M9.3 9.2a2.8 2.8 0 0 1 5.4 1c0 1.9-2.7 2.2-2.7 4"/><path d="M12 17.3h.01"/>';
    if (nom === "autres") s += '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>';
    return s + "</svg>";
  }

  /* ---------- état actif ---------- */
  /* Déterminer l’onglet actif d’après le chemin, pas le titre. */
  var UTILES = /(^|\/)(glossaire|nouveautes|bac-pratique|memo-veille-bac|outils-js-bac|pieges-bac|revision-erreurs|livre-smart|carte-visite)\.html/i;
  function sectionActive() {
    var p = location.pathname.replace(/^\/STiV2\.0/i, "");
    var h = location.hash || "";
    var accueil = /\/(index\.html)?$/i.test(p) && !UTILES.test(p);
    if (h === "#modules") return "quiz";
    /* Les vidéos des cours restent dans la rubrique Cours. */
    if (h === "#videos" && accueil) return "videos";
    if (/\/quiz\//i.test(p)) return "quiz";
    if (/\/exercices\//i.test(p) || /series-exercices/i.test(p)) return "autres";
    if (h === "#cours" || h === "#exercices") return "cours";
    if (/\/(cours)\//i.test(p)) return "cours";
    if (accueil) return "accueil";
    if (/\/portail\.html/i.test(p)) return "accueil";
    if (UTILES.test(p) || /\/(documents)\//i.test(p)) return "autres";
    return "";
  }
  function majActif() {
    var a = sectionActive();
    var nav = doc.getElementById("sti-bnav");
    if (!nav) return;
    var els = nav.querySelectorAll(".sti-bnav-i");
    for (var i = 0; i < els.length; i++) els[i].classList.toggle("on", els[i].getAttribute("data-cle") === a);
  }

  /* ---------- construction ---------- */
  /* Masquer les deux barres au défilement, sauf pendant la lecture des menus. */
  function trouverBarreHaut() {
    try {
      var cands = doc.querySelectorAll("header, nav, [class*='topbar'], [class*='barre-haut'], [id*='barre-haut']");
      var vh = window.innerHeight || 800;
      for (var i = 0; i < cands.length; i++) {
        var el = cands[i];
        if (el.id === "sti-bnav" || el.id === "sti-bnav-sheet" || el.id === "sti-bnav-voile") continue;
        if (el.closest && el.closest("#sti-bnav, #sti-bnav-sheet")) continue;
        var cs = window.getComputedStyle(el);
        if (cs.position !== "fixed" && cs.position !== "sticky") continue;
        if (cs.display === "none" || cs.visibility === "hidden") continue;
        var r = el.getBoundingClientRect();
        if (r.height < 36 || r.height > vh * 0.45) continue;
        if (r.width < (window.innerWidth || 900) * 0.6) continue;
        if (r.top < -4 || r.top > 8) continue;
        return el;
      }
    } catch (e) {}
    return null;
  }
  var barreHaut = null;
  function choisirBarreHaut() {
    if (barreHaut && barreHaut.classList) barreHaut.classList.remove("sti-barre-suivie", "sti-barre-roulee");
    barreHaut = trouverBarreHaut();
    if (barreHaut) barreHaut.classList.add("sti-barre-suivie");
  }
  function roulementSuspendu() {
    try {
      if (root.classList.contains("sti-modal-open") || root.classList.contains("sti-bnav-sheet-open")) return true;
      if (doc.body && doc.body.classList.contains("nav-open")) return true;
      if (doc.querySelector("nav.toc-nav.is-open, #side.open, #sidebar.menu-open, .sidebar.menu-open, .course-sidebar.is-open")) return true;
      /* Garder la barre ouverte pendant la lecture du sommaire HTML5. */
      if (doc.querySelector(".menu-open")) return true;
    } catch (e) {}
    return false;
  }
  function installerBarresQuiSeRoulent() {
    if (window.__STI_BNAV_ROULE) return;
    window.__STI_BNAV_ROULE = true;
    choisirBarreHaut();
    var y0 = window.scrollY || root.scrollTop || 0;
    var roule = false;
    var enAttente = 0;
    function montrer() {
      if (!roule) return;
      roule = false;
      root.classList.remove("sti-barres-cachees");
      if (barreHaut) barreHaut.classList.remove("sti-barre-roulee");
    }
    function cacher() {
      if (roule) return;
      roule = true;
      root.classList.add("sti-barres-cachees");
      if (barreHaut) barreHaut.classList.add("sti-barre-roulee");
    }
    window.addEventListener("scroll", function () {
      if (enAttente) return;
      enAttente = window.requestAnimationFrame(function () {
        enAttente = 0;
        var y = window.scrollY || root.scrollTop || 0;
        if (roulementSuspendu() || y <= 48) { montrer(); y0 = y; return; }
        var d = y - y0;
        if (d > 10) { cacher(); y0 = y; }
        else if (d < -8) { montrer(); y0 = y; }
      });
    }, { passive: true });
    window.addEventListener("resize", function () { choisirBarreHaut(); }, { passive: true });
  }

  function construire() {
    if (doc.getElementById("sti-bnav")) return;
    var actif = sectionActive();
    var nav = doc.createElement("div");
    nav.id = "sti-bnav";
    nav.setAttribute("role", "navigation");
    nav.setAttribute("aria-label", "Navigation mobile");

    var items = [
      { cle: "accueil", lib: "Accueil", href: R + "index.html", ico: "accueil" },
      { cle: "cours", lib: "Cours", href: R + "index.html#cours", ico: "cours" },
      { cle: "videos", lib: "Vidéos", href: R + "index.html#videos", ico: "videos" },
      { cle: "quiz", lib: "Quiz", href: R + "index.html#modules", ico: "quiz" }
    ];
    items.forEach(function (it) {
      var a = doc.createElement("a");
      a.className = "sti-bnav-i" + (actif === it.cle ? " on" : "");
      a.setAttribute("data-cle", it.cle);
      a.href = it.href;
      a.innerHTML = ico(it.ico) + "<span>" + it.lib + "</span>";
      nav.appendChild(a);
    });
    var b = doc.createElement("button");
    b.type = "button";
    b.id = "sti-bnav-autres";
    b.className = "sti-bnav-i" + (actif === "autres" ? " on" : "");
    b.setAttribute("data-cle", "autres");
    b.setAttribute("aria-haspopup", "dialog");
    b.setAttribute("aria-expanded", "false");
    b.innerHTML = ico("autres") + "<span>Autres</span>";
    nav.appendChild(b);
    doc.body.appendChild(nav);

    var voile = doc.createElement("div");
    voile.id = "sti-bnav-voile";
    doc.body.appendChild(voile);

    /* Remplacer le gabarit temporaire par la vraie barre. */
    var skel0 = doc.getElementById("sti-bnav-skel"); if (skel0) skel0.remove();
    var skel1 = doc.getElementById("sti-bnav-skel-css"); if (skel1) skel1.remove();

    var sheet = doc.createElement("div");
    sheet.id = "sti-bnav-sheet";
    sheet.setAttribute("role", "dialog");
    sheet.setAttribute("aria-label", "Autres sections du site");
    var liens = [
      ["Exercices", "exercices/series-exercices.html", "séries et corrigés"],
      ["Les 25 pièges du Bac", "pieges-bac.html", "à lire avant l'épreuve"],
      ["Atelier épreuve pratique", "bac-pratique.html", "🧪 BAC STI · TP noté"],
      ["Les 10 fonctions JavaScript", "outils-js-bac.html", "atelier & générateur"],
      ["Scanner mon livre", "livre-smart.html", "3SI + 4SI"],
      ["Progression", "#progress", "sur l'accueil"],
      ["Conseils", "#conseils", "sur l'accueil"],
      ["Nouveautés", "nouveautes.html", ""],
      ["Glossaire", "glossaire.html", ""],
      ["Révision des erreurs", "revision-erreurs.html", ""],
      ["Mémo veille", "memo-veille-bac.html", ""],
      ["Portail / compte", "portail.html", ""]
    ];
    liens.forEach(function (l) {
      var a = doc.createElement("a");
      a.className = "sti-bnav-l";
      a.href = /^#/.test(l[1]) ? R + "index.html" + l[1] : R + l[1];
      a.innerHTML = "<span><b>" + l[0] + "</b>" + (l[2] ? "<br><em>" + l[2] + "</em>" : "") + "</span>";
      sheet.appendChild(a);
    });
    doc.body.appendChild(sheet);

    function ouvrirSheet(o) {
      root.classList.toggle("sti-bnav-sheet-open", o);
      b.setAttribute("aria-expanded", o ? "true" : "false");
    }
    b.addEventListener("click", function () { ouvrirSheet(!root.classList.contains("sti-bnav-sheet-open")); });
    voile.addEventListener("click", function () { ouvrirSheet(false); });
    doc.addEventListener("keydown", function (e) { if (e.key === "Escape") ouvrirSheet(false); });
    sheet.addEventListener("click", function (e) { if (e.target.closest && e.target.closest("a")) ouvrirSheet(false); });
    window.addEventListener("resize", function () { if (!mq.matches) ouvrirSheet(false); });

    /* Un lien vers la page courante ne provoque pas de rechargement. */
    function clicSansRecharge(e) {
      if (e.defaultPrevented || e.button > 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
      if (!a) return;
      var u;
      try { u = new URL(a.href, location.href); } catch (er) { return; }
      if (u.origin !== location.origin || u.pathname !== location.pathname) return; /* vrai changement de page : navigation normale */
      e.preventDefault();
      var hash = (u.hash || "").replace(/^#/, "");
      if (hash) {
        var el = doc.getElementById(hash) || doc.querySelector('[name="' + hash + '"]');
        if (el && el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "start" });
        else window.scrollTo({ top: 0, behavior: "smooth" });
        try { history.replaceState(history.state, "", u.pathname + (u.search || "") + "#" + hash); } catch (er) { try { location.hash = hash; } catch (e2) {} }
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
        try { if (location.hash) history.replaceState(history.state, "", u.pathname + (u.search || "")); } catch (er) {}
      }
      majActif();
    }
    nav.addEventListener("click", clicSansRecharge);
    sheet.addEventListener("click", clicSansRecharge);

    /* Mémoriser le dessin de la barre (couleurs + hauteur) pour le gabarit de config.js. */
    try {
      var cs = getComputedStyle(nav);
      var r = nav.getBoundingClientRect();
      var h = Math.max(48, Math.min(96, Math.round(r.height)));
      if (cs.backgroundColor && cs.backgroundColor !== "rgba(0, 0, 0, 0)") {
        localStorage.setItem("sti-bnav-skel", JSON.stringify({ t: Date.now(), h: h, f: cs.backgroundColor, b: cs.borderTopColor, brd: cs.borderTopWidth || "1.5px", th: root.getAttribute("data-theme") === "dark" || root.classList.contains("dark") ? "dark" : "light" }));
      }
    } catch (e) {}

    /* Les barres des cours et exercices se roulent au défilement. */
    try {
      var pnV428 = location.pathname;
      if (/\/cours\//.test(pnV428) || /\/exercices\/series-exercices\.html/.test(pnV428)) installerBarresQuiSeRoulent();
    } catch (eRoule) {}
    /* Pas de préchargement des pages complètes en arrière-plan. */
  }

  /* ---------- activation selon la largeur ---------- */
  var mq = window.matchMedia ? window.matchMedia("(max-width: 700px)") : null;
  function appliquer() {
    var show = Boolean(mq && mq.matches);
    if (show) construire();
    root.classList.toggle("sti-bnav-on", show);
    if (!show) root.classList.remove("sti-bnav-sheet-open");
  }
  if (mq) {
    if (mq.addEventListener) mq.addEventListener("change", appliquer);
    else if (mq.addListener) mq.addListener(appliquer);
  }
  window.addEventListener("hashchange", majActif);
  window.addEventListener("pageshow", function () {
    root.classList.remove("sti-bnav-sheet-open");
    var bAut = doc.getElementById("sti-bnav-autres");
    if (bAut) bAut.setAttribute("aria-expanded", "false");
    majActif();
  });
  window.addEventListener("sti-accueil-restored", majActif);
  /* Charger la synchronisation et le diagnostic dans la roue, hors administration. */
  /* Différer les modules complémentaires après la première peinture. */
  (function planifierModulesRoue() {
    var charges = false;
    function injecterModulesRoue() {
      if (charges) return;
      charges = true;
          var liste = [
            "assets/js/roue-nuage.js?v=474",
            "assets/js/roue-habillage.js?v=474",
            "assets/js/roue-initiales.js?v=474",
            "assets/js/roue-couverture.js?v=473",
            "assets/js/roue-revision.js?v=473",
            "assets/js/rappels-locaux.js?v=436",
            "assets/js/roue-plan.js?v=473",
            "assets/js/rayonsx-surligneur.js?v=449"
          ];
      for (var i = 0; i < liste.length; i++) {
        try {
          var sc = doc.createElement("script");
          sc.src = R + liste[i];
          sc.async = true;
          (doc.head || doc.documentElement).appendChild(sc);
        } catch (eS) {}
      }
    }
    function apresChargement() {
      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(injecterModulesRoue, { timeout: 900 });
      } else {
        setTimeout(injecterModulesRoue, 180);
      }
    }
    if (doc.readyState === "complete") apresChargement();
    else window.addEventListener("load", apresChargement, { once: true });
  })();

  /* Adapter le bas de la barre à la zone visible sur mobile. */
  (function suivreVue() {
    var vv = window.visualViewport;
    if (!vv || !vv.addEventListener) return;
    function caler() {
      var bas = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
      var cur = doc.documentElement.style.getPropertyValue("--sti-bnav-bas");
      if (cur !== bas + "px") doc.documentElement.style.setProperty("--sti-bnav-bas", bas + "px");
    }
    vv.addEventListener("resize", caler);
    vv.addEventListener("scroll", caler);
    window.addEventListener("resize", caler, { passive: true });
    window.addEventListener("orientationchange", function () { setTimeout(caler, 120); });
    caler();
  })();

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", appliquer);
  else appliquer();

  /* Restaurer la barre si une page reconstruit son corps. */
  if (!window.__STI_BNAV_WATCH) {
    window.__STI_BNAV_WATCH = true;
    try {
      var moActif = false;
      var mo = new MutationObserver(function () {
        if (mq && mq.matches && !doc.getElementById("sti-bnav")) construire();
      });
      var syncObsMobile = function () {
        var doitObs = Boolean(mq && mq.matches && doc.body);
        if (doitObs && !moActif) {
          mo.observe(doc.body, { childList: true });
          moActif = true;
        } else if (!doitObs && moActif) {
          mo.disconnect();
          moActif = false;
        }
      };
      if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", syncObsMobile);
      else syncObsMobile();
      if (mq) {
        if (mq.addEventListener) mq.addEventListener("change", syncObsMobile);
        else if (mq.addListener) mq.addListener(syncObsMobile);
      }
    } catch (e) {}
    setTimeout(function () { if (mq && mq.matches) construire(); }, 2500);
  }
})();
