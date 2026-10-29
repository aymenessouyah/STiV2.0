/* Navigation mobile : Accueil, Cours, Vidéos, Quiz et Autres. */
(function () {
  "use strict";
  if (window.__STI_BNAV) return;
  window.__STI_BNAV = true;

  var doc = document;
  var root = doc.documentElement;
  if (!/^https?:$/.test(location.protocol)) return;
  /* Harnais internes : rien ne doit bouger — sauf tests/apercu-barre-mobile.html, qui
     demande explicitement la barre (v532) pour la montrer. */
  if (location.pathname.indexOf("/tests/") !== -1 && !window.__STI_BNAV_HARNAIS) return;
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
  /* v532 : barre flottante sombre, bouton « + » central en dégradé (modèle fourni). */
  /* v532 : le thème clair garde la barre flottante mais avec les surfaces du site clair
     (fond laiteux, texte encre, cartes blanches). Le thème sombre reste le défaut. */
  var reglesClair = [];
  ["html[data-theme='light']", "html[data-theme='clair']", "html.light-mode", "body.light-mode"].forEach(function (h) {
    [
      ["#sti-bnav", "background-color:#f4f7ff;background-image:linear-gradient(180deg,rgba(255,255,255,.94),rgba(238,243,252,.9));border-color:rgba(15,23,42,.12);box-shadow:0 12px 30px rgba(15,23,42,.18),inset 0 1px 0 #fff;--sti-bnav-ring:#f4f7ff"],
      ["#sti-bnav .sti-bnav-i", "color:rgba(38,49,76,.60)"],
      ["#sti-bnav .sti-bnav-i.on", "color:#152039"],
      ["#sti-bnav-sheet", "background:linear-gradient(180deg,#ffffff,#eef3fb);border-color:rgba(15,23,42,.12);color:#1b2437;box-shadow:0 22px 48px rgba(15,23,42,.22)"],
      ["#sti-bnav-sheet .sti-sheet-grip", "background:rgba(15,23,42,.18)"],
      ["#sti-bnav-sheet .sti-sheet-tete b", "color:#101a2e"],
      ["#sti-bnav-sheet .sti-sheet-tete button", "border-color:rgba(15,23,42,.16);background:rgba(15,23,42,.06);color:#101a2e"],
      ["#sti-bnav-sheet h4", "color:rgba(38,49,76,.55)"],
      ["#sti-bnav-sheet .sti-sheet-carte", "background:#fff;border-color:rgba(15,23,42,.10);color:#101a2e"],
      ["#sti-bnav-sheet .sti-sheet-carte small", "color:rgba(38,49,76,.62)"],
      ["#sti-bnav-sheet .sti-sheet-puce", "background:#fff;border-color:rgba(15,23,42,.12);color:#101a2e"],
      ["#sti-bnav-sheet .sti-sheet-puce.on", "color:#fff"],
      ["#sti-bnav-sheet .sti-sheet-lien", "background:#fff;border-color:rgba(15,23,42,.10);color:#1b2437"]
    ].forEach(function (r) { reglesClair.push(h + " " + r[0] + "{" + r[1] + "}"); });
  });

  var css = [
    ":root{--sti-bnav-h:calc(88px + env(safe-area-inset-bottom,0px));--sti-bnav-fond:#0d1424;--sti-bnav-ring:#0d1424;--sti-bnav-acc1:#5b8cff;--sti-bnav-acc2:#a855f7;--sti-bnav-acc3:#fb7185}",
    "#sti-bnav{display:none}",
    "@media (max-width:700px){",
    "html.sti-bnav-on body{padding-bottom:calc(var(--sti-bnav-h) + 14px + var(--sti-bnav-bas,0px))}",
    "#sti-bnav{display:grid;grid-template-columns:1fr 1fr 66px 1fr 1fr;align-items:center;position:fixed;left:10px;right:10px;bottom:calc(10px + var(--sti-bnav-bas,0px) + env(safe-area-inset-bottom,0px));z-index:2147483000;height:60px;border-radius:22px;background-color:var(--sti-bnav-fond);background-image:linear-gradient(180deg,rgba(46,60,92,.55),rgba(7,11,20,.72));border:1px solid rgba(255,255,255,.14);box-shadow:0 12px 30px rgba(4,8,18,.42),inset 0 1px 0 rgba(255,255,255,.10);-webkit-backdrop-filter:blur(18px) saturate(150%);backdrop-filter:blur(18px) saturate(150%);font-family:system-ui,-apple-system,'Segoe UI',sans-serif;overflow:visible}",
    "#sti-bnav *{box-sizing:border-box}",
    "#sti-bnav .sti-bnav-i{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;width:100%;height:100%;padding:0 2px;margin:0;color:rgba(233,238,250,.62);text-decoration:none;text-transform:none;font:800 9.5px/1 system-ui,-apple-system,'Segoe UI',sans-serif;letter-spacing:.03em;white-space:nowrap;-webkit-tap-highlight-color:transparent;background:none;border:0;box-shadow:none;transform:none;cursor:pointer}",
    "#sti-bnav .sti-bnav-i svg{display:block;width:22px;height:22px;margin:0;stroke:currentColor;fill:none;stroke-width:1.85;stroke-linecap:round;stroke-linejoin:round}",
    "#sti-bnav .sti-bnav-i span{display:block}",
    "#sti-bnav .sti-bnav-i.on{color:#fff}",
    "#sti-bnav .sti-bnav-i.on svg{filter:drop-shadow(0 4px 10px rgba(91,140,255,.6))}",
    "#sti-bnav .sti-bnav-i.on::after{content:'';position:absolute;left:50%;bottom:5px;width:16px;height:3px;margin-left:-8px;border-radius:999px;background:linear-gradient(90deg,var(--sti-bnav-acc1),var(--sti-bnav-acc2))}",
    "@media (max-width:360px){#sti-bnav .sti-bnav-i{font-size:9px;gap:3px}#sti-bnav .sti-bnav-i svg{width:20px;height:20px}}",
    /* Puits central : le bouton rond dépasse au-dessus de la barre, cerclé de sa couleur. */
    "#sti-bnav .sti-bnav-puits{position:relative;display:flex;align-items:center;justify-content:center;height:100%}",
    "#sti-bnav .sti-bnav-fab{position:absolute;left:50%;top:50%;width:58px;height:58px;margin:-29px 0 0 -29px;padding:0;border:0;border-radius:50%;cursor:pointer;display:grid;place-items:center;background:linear-gradient(140deg,var(--sti-bnav-acc1) 0%,var(--sti-bnav-acc2) 52%,var(--sti-bnav-acc3) 100%);box-shadow:0 0 0 7px var(--sti-bnav-ring),0 12px 24px rgba(91,140,255,.42),inset 0 1px 0 rgba(255,255,255,.35);transform:translateY(-19px);transition:transform .22s ease,box-shadow .22s ease;-webkit-tap-highlight-color:transparent}",
    "#sti-bnav .sti-bnav-fab::before,#sti-bnav .sti-bnav-fab::after{content:'';position:absolute;left:50%;top:50%;border-radius:2px;background:#fff}",
    "#sti-bnav .sti-bnav-fab::before{width:20px;height:2.6px;margin:-1.3px 0 0 -10px}",
    "#sti-bnav .sti-bnav-fab::after{width:2.6px;height:20px;margin:-10px 0 0 -1.3px}",
    "#sti-bnav .sti-bnav-fab:active{transform:translateY(-19px) scale(.93)}",
    "html.sti-bnav-sheet-open #sti-bnav .sti-bnav-fab{transform:translateY(-19px) rotate(135deg)}",
    "#sti-bnav .sti-bnav-fab:focus-visible{outline:3px solid #fff;outline-offset:4px}",
    "#sti-bnav .sti-bnav-fab-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}",
    "#sti-bnav .sti-bnav-fab.on{box-shadow:0 0 0 7px var(--sti-bnav-ring),0 0 0 10px rgba(91,140,255,.35),0 12px 24px rgba(91,140,255,.42),inset 0 1px 0 rgba(255,255,255,.35)}",
    "html.sti-modal-open #sti-bnav,html.sti-msn-mob-open #sti-bnav{display:none!important}",
    /* Garder les flotteurs au-dessus de la barre. */
    "html.sti-bnav-on #sti-btn-messenger-global{bottom:calc(var(--sti-bnav-h) + var(--sti-bnav-bas,0px) + 10px)!important}",
    "html.sti-bnav-on #sti-msn-bulle-attention{bottom:calc(var(--sti-bnav-h) + var(--sti-bnav-bas,0px) + 64px)!important}",
    "html.sti-bnav-on #sti-auto-to-top{bottom:calc(var(--sti-bnav-h) + var(--sti-bnav-bas,0px) + 118px)!important}",
    "html.sti-bnav-on #to-top,html.sti-bnav-on #backToTop,html.sti-bnav-on #backToTopBtn,html.sti-bnav-on .to-top,html.sti-bnav-on .back-to-top-btn{bottom:calc(var(--sti-bnav-h) + var(--sti-bnav-bas,0px) + 118px)!important}",
    "#sti-universal-theme-btn{display:none!important}",
    "html.sti-bnav-on #sti-sync-pastille{bottom:calc(var(--sti-bnav-h) + var(--sti-bnav-bas,0px) + 14px)!important}",
    "html.sti-bnav-on #sti-diagnostic-donnees,html.sti-bnav-on #sti-labo-offline-diagnostic-button{bottom:calc(var(--sti-bnav-h) + var(--sti-bnav-bas,0px) + 14px)!important}",
    "}",
    /* Volet « Cours & vidéos » ouvert par le bouton + */
    "#sti-bnav-voile{display:none;position:fixed;inset:0;z-index:2147482990;background:rgba(6,10,20,.55)}",
    "#sti-bnav-sheet{display:none;position:fixed;left:10px;right:10px;bottom:calc(var(--sti-bnav-h) + var(--sti-bnav-bas,0px) + 2px);z-index:2147482995;max-height:70vh;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding:10px 12px calc(14px + env(safe-area-inset-bottom,0px));background:linear-gradient(180deg,#151e33,#0c1322);border:1px solid rgba(255,255,255,.15);border-radius:22px;box-shadow:0 22px 48px rgba(4,8,18,.6);color:#eef2ff;font-family:system-ui,-apple-system,'Segoe UI',sans-serif}",
    "html.sti-bnav-sheet-open #sti-bnav-voile{display:block}",
    "html.sti-bnav-sheet-open #sti-bnav-sheet{display:block;animation:sti-bnav-up .22s ease-out}",
    "@keyframes sti-bnav-up{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}",
    "#sti-bnav-sheet .sti-sheet-grip{width:42px;height:4px;margin:2px auto 8px;border-radius:999px;background:rgba(255,255,255,.22)}",
    "#sti-bnav-sheet .sti-sheet-tete{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 2px 4px}",
    "#sti-bnav-sheet .sti-sheet-tete b{font:900 13.5px/1.1 system-ui,-apple-system,'Segoe UI',sans-serif}",
    "#sti-bnav-sheet .sti-sheet-tete button{width:30px;height:30px;border-radius:50%;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#fff;font:900 14px/1 system-ui,-apple-system,'Segoe UI',sans-serif;cursor:pointer}",
    "#sti-bnav-sheet h4{margin:12px 2px 7px;font:900 10.5px/1 system-ui,-apple-system,'Segoe UI',sans-serif;letter-spacing:.10em;text-transform:uppercase;color:rgba(226,232,246,.60)}",
    "#sti-bnav-sheet .sti-sheet-cours{display:grid;gap:7px}",
    "#sti-bnav-sheet .sti-sheet-carte{display:flex;align-items:center;gap:10px;padding:9px 11px;border-radius:14px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);text-decoration:none;color:#fff;box-shadow:none;margin:0}",
    "#sti-bnav-sheet .sti-sheet-carte i{display:grid;place-items:center;width:32px;height:32px;border-radius:10px;font-style:normal;font-size:16px;flex:none}",
    "#sti-bnav-sheet .sti-sheet-carte strong{display:block;font:900 12.5px/1.15 system-ui,-apple-system,'Segoe UI',sans-serif}",
    "#sti-bnav-sheet .sti-sheet-carte small{display:block;margin-top:2px;font:700 10.5px/1.2 system-ui,-apple-system,'Segoe UI',sans-serif;color:rgba(226,232,246,.62)}",
    "#sti-bnav-sheet .sti-sheet-puces{display:flex;flex-wrap:wrap;gap:7px}",
    "#sti-bnav-sheet .sti-sheet-puce{display:inline-flex;align-items:center;gap:6px;padding:8px 12px;border-radius:999px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);color:#fff;text-decoration:none;font:800 11.5px/1 system-ui,-apple-system,'Segoe UI',sans-serif}",
    "#sti-bnav-sheet .sti-sheet-puce.on{background:linear-gradient(135deg,rgba(91,140,255,.9),rgba(168,85,247,.9));border-color:transparent}",
    "#sti-bnav-sheet .sti-sheet-liens{display:grid;grid-template-columns:1fr 1fr;gap:7px}",
    "#sti-bnav-sheet .sti-sheet-lien{display:flex;align-items:center;gap:7px;padding:9px 10px;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.10);color:#e8eefc;text-decoration:none;font:800 11px/1.2 system-ui,-apple-system,'Segoe UI',sans-serif}",
    "#sti-bnav-sheet .sti-sheet-lien span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    "@media (max-width:360px){#sti-bnav-sheet .sti-sheet-liens{grid-template-columns:1fr}#sti-bnav-sheet{padding-left:9px;padding-right:9px}}",
    "@media (prefers-reduced-motion:reduce){#sti-bnav,#sti-bnav .sti-bnav-fab,#sti-bnav-sheet{transition:none!important;animation:none!important}}",
    "@media (max-width:700px){#stix-nav a[href$=\"index.html#cours\"]{display:none!important}}", /* v420→421 : « cours du site » masqué sur mobile */
    "@media (max-width:700px){#sti-bnav{transition:transform .28s ease}}",
    "@media (max-width:700px){html.sti-barres-cachees #sti-bnav{transform:translateY(150%)}}",
    "@media (max-width:700px){.sti-barre-suivie{transition:transform .28s ease}}",
    "@media (max-width:700px){html.sti-barres-cachees .sti-barre-suivie.sti-barre-roulee{transform:translateY(-105%)}}",
    "@media print{#sti-bnav,#sti-bnav-sheet,#sti-bnav-voile{display:none!important}html.sti-bnav-on body{padding-bottom:0!important}html.sti-barres-cachees .sti-barre-suivie{transform:none!important}}"
  ].concat(reglesClair).join("");
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
    var fab = nav.querySelector(".sti-bnav-fab");
    if (fab) fab.classList.toggle("on", a === "autres");
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

  /* ---------- contenu du volet « + » : cours, familles de vidéos, outils ---------- */
  var MATIERES = [
    { cle: "html5", nom: "HTML5", ico: "🧱", teinte: "linear-gradient(135deg,#ff9d5c,#f4511e)", sous: "Structure, formulaires, tableaux" },
    { cle: "css3", nom: "CSS3", ico: "🎨", teinte: "linear-gradient(135deg,#5ec8ff,#0284c7)", sous: "Sélecteurs, Flexbox, animations" },
    { cle: "javascript", nom: "JavaScript", ico: "⚡", teinte: "linear-gradient(135deg,#f7df1e,#d99b00)", sous: "DOM, événements, fonctions" },
    { cle: "sql", nom: "SQL", ico: "🗃️", teinte: "linear-gradient(135deg,#7ddc95,#177245)", sous: "Requêtes, jointures, séries" },
    { cle: "php", nom: "PHP", ico: "🐘", teinte: "linear-gradient(135deg,#a78bfa,#6d28d9)", sous: "Formulaires, MySQLi (4e SI)" }
  ];
  var FAMILLES_VIDEOS = [
    { cle: "all", nom: "Toutes les vidéos", ico: "🎬" },
    { cle: "html5", nom: "HTML5", ico: "🧱" },
    { cle: "css3", nom: "CSS3", ico: "🎨" },
    { cle: "javascript", nom: "JavaScript", ico: "⚡" },
    { cle: "sql", nom: "SQL", ico: "🗃️" },
    { cle: "php", nom: "PHP", ico: "🐘" }
  ];
  var OUTILS = [
    ["Exercices", "exercices/series-exercices.html", "📝"],
    ["Bac pratique", "bac-pratique.html", "🧪"],
    ["Les 25 pièges du Bac", "pieges-bac.html", "⚠️"],
    ["10 fonctions JavaScript", "outils-js-bac.html", "🧩"],
    ["Scanner mon livre", "livre-smart.html", "📷"],
    ["Nouveautés", "nouveautes.html", "✨"],
    ["Glossaire", "glossaire.html", "📖"],
    ["Révision des erreurs", "revision-erreurs.html", "🔁"],
    ["Mémo veille", "memo-veille-bac.html", "🌙"],
    ["Mon tableau de bord", "dashboard.html", "📊"]
  ];

  function construire() {
    if (doc.getElementById("sti-bnav")) return;
    var actif = sectionActive();
    var nav = doc.createElement("div");
    nav.id = "sti-bnav";
    nav.setAttribute("role", "navigation");
    nav.setAttribute("aria-label", "Navigation mobile");

    function item(cle, lib, href, icone) {
      var a = doc.createElement("a");
      a.className = "sti-bnav-i" + (actif === cle ? " on" : "");
      a.setAttribute("data-cle", cle);
      a.href = href;
      a.innerHTML = ico(icone) + "<span>" + lib + "</span>";
      return a;
    }
    nav.appendChild(item("accueil", "Accueil", R + "index.html", "accueil"));
    nav.appendChild(item("cours", "Cours", R + "index.html#cours", "cours"));

    /* Bouton central : ouvre le volet des cours et des familles de vidéos. */
    var puits = doc.createElement("div");
    puits.className = "sti-bnav-puits";
    var b = doc.createElement("button");
    b.type = "button";
    b.id = "sti-bnav-plus";
    b.className = "sti-bnav-fab" + (actif === "autres" ? " on" : "");
    b.setAttribute("data-cle", "autres");
    b.setAttribute("aria-haspopup", "dialog");
    b.setAttribute("aria-expanded", "false");
    b.setAttribute("aria-controls", "sti-bnav-sheet");
    b.setAttribute("aria-label", "Ouvrir le menu : cours, vidéos et outils");
    b.title = "Cours, vidéos et outils";
    b.innerHTML = "<span class=\"sti-bnav-fab-sr\">+</span>";
    puits.appendChild(b);
    nav.appendChild(puits);

    nav.appendChild(item("videos", "Vidéos", R + "index.html#videos", "videos"));
    nav.appendChild(item("quiz", "Quiz", R + "index.html#modules", "quiz"));
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
    sheet.setAttribute("aria-label", "Cours, vidéos et outils");

    var corps = "";
    corps += '<div class="sti-sheet-grip" aria-hidden="true"></div>';
    corps += '<div class="sti-sheet-tete"><b>Ouvrir…</b>';
    corps += '<button type="button" id="sti-bnav-fermer" aria-label="Fermer le menu">✕</button></div>';

    corps += '<h4>📚 Tous les cours</h4><div class="sti-sheet-cours">';
    MATIERES.forEach(function (m) {
      corps += '<a class="sti-sheet-carte' + (m.cle === "php" ? " sti-4si-only" : "") + '" href="' + R + 'cours/' + m.cle + '.html">' +
        '<i aria-hidden="true" style="background:' + m.teinte + '">' + m.ico + '</i>' +
        '<span><strong>' + m.nom + '</strong><small>' + m.sous + '</small></span></a>';
    });
    corps += "</div>";

    corps += '<h4>🎬 Familles de vidéos</h4><div class="sti-sheet-puces">';
    FAMILLES_VIDEOS.forEach(function (f) {
      var href = f.cle === "all" ? R + "index.html#videos" : R + "index.html?vf=" + f.cle + "#videos";
      corps += '<a class="sti-sheet-puce' + (f.cle === "php" ? " sti-4si-only" : "") + '" href="' + href + '">' +
        '<span aria-hidden="true">' + f.ico + "</span>" + f.nom + "</a>";
    });
    corps += "</div>";

    corps += '<h4>🧰 Outils &amp; révisions</h4><div class="sti-sheet-liens">';
    OUTILS.forEach(function (o) {
      corps += '<a class="sti-sheet-lien' + (o[1] === "bac-pratique.html" ? " sti-4si-only" : "") + '" href="' + R + o[1] + '">' +
        '<span aria-hidden="true">' + o[2] + "</span><span>" + o[0] + "</span></a>";
    });
    corps += "</div>";
    sheet.innerHTML = corps;
    doc.body.appendChild(sheet);

    function ouvrirSheet(o) {
      var etait = root.classList.contains("sti-bnav-sheet-open");
      root.classList.toggle("sti-bnav-sheet-open", o);
      b.setAttribute("aria-expanded", o ? "true" : "false");
      b.setAttribute("aria-label", o ? "Fermer le menu" : "Ouvrir le menu : cours, vidéos et outils");
      if (o && !etait) {
        try { var fermer = sheet.querySelector("#sti-bnav-fermer"); if (fermer && fermer.focus) fermer.focus({ preventScroll: true }); } catch (eF) {}
      }
    }
    var btnFermer = sheet.querySelector("#sti-bnav-fermer");
    if (btnFermer) btnFermer.addEventListener("click", function () { ouvrirSheet(false); if (b.focus) b.focus({ preventScroll: true }); });
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
      /* v532 : un raccourci du volet (« ?vf=css3#videos ») filtre la galerie sur place. */
      var vf = "";
      try { vf = (u.searchParams.get("vf") || "").toLowerCase(); } catch (eVF) {}
      if (vf) {
        var puce = doc.querySelector('[data-video-filter="' + vf + '"]');
        if (puce && typeof puce.click === "function") puce.click();
      }
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
      /* v532 : + 22 px, car le bouton « + » dépasse au-dessus de la barre. */
      var h = Math.max(48, Math.min(118, Math.round(r.height) + 22));
      if (cs.backgroundColor && cs.backgroundColor !== "rgba(0, 0, 0, 0)") {
        var th = (root.getAttribute("data-theme") === "light" || root.getAttribute("data-theme") === "clair" ||
          root.classList.contains("light-mode")) ? "light" : "dark";
        localStorage.setItem("sti-bnav-skel", JSON.stringify({ t: Date.now(), h: h, f: cs.backgroundColor, b: cs.borderTopColor, brd: cs.borderTopWidth || "1px", th: th }));
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
    var bAut = doc.getElementById("sti-bnav-plus");
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

  /* v532 : arrivée depuis le volet (« index.html?vf=css3#videos ») — la galerie de
     l'accueil est filtrée dès que ses pastilles répondent, sans modifier app.js. */
  (function appliquerFamilleVideos() {
    var vf = "";
    try { vf = (new URLSearchParams(location.search).get("vf") || "").toLowerCase(); } catch (e) { return; }
    if (!vf || vf === "all") return;
    var essais = 0;
    function tenter() {
      var puce = doc.querySelector('[data-video-filter="' + vf + '"]');
      if (!puce) { if (essais++ < 20) setTimeout(tenter, 150); return; }
      if (puce.classList && puce.classList.contains("is-active")) return;
      try { puce.click(); } catch (e) { return; }
      if (essais++ < 20 && !(puce.classList && puce.classList.contains("is-active"))) setTimeout(tenter, 150);
    }
    if (doc.readyState === "complete") setTimeout(tenter, 60);
    else window.addEventListener("load", function () { setTimeout(tenter, 60); }, { once: true });
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
