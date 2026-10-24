/* STI by AE — barre de navigation mobile en bas de l'écran (v413).
   But de l'auteur : « en bas, en mode mobile, toujours afficher dans toutes les pages une barre
   contenant : Accueil, Exercices, Quiz, Autres ».
   - Visible uniquement en mode mobile (≤ 700 px, le seuil déjà utilisé partout dans le site).
   - Injectée par config.js (seul script commun à toutes les pages) → aucun fichier HTML à éditer
     en masse ; les deux pages orphelines l'incluent directement.
   - « Autres » n'est pas une page morte : c'est un tiroir qui ouvre les autres sections réelles
     du site (cours, livres, progression, glossaire, outils du bac, portail…).
   - Se masque quand une boîte modale est ouverte (html.sti-modal-open) et quand le messenger
     occupe l'écran (html.sti-msn-mob-open) — hooks déjà posés par acces.js, on ne réinvente pas.
   - Soulève les flotteurs fixes du bas (messenger, thème universel, pastille de synchro…) d'une
     hauteur de barre pile pour qu'ils restent cliquables au-dessus du bandeau.
   - S'adapte au thème clair/sombre via les tokens atelier (--surface/--ink/--accent) avec
     valeurs de repli littérales pour les pages qui ne chargent pas ces tokens (portail…). EXCLUSION : le tableau de bord (admin) ne reçoit rien (consigne auteur v414). */
(function () {
  "use strict";
  if (window.__STI_BNAV) return;
  window.__STI_BNAV = true;

  var doc = document;
  var root = doc.documentElement;
  if (!/^https?:$/.test(location.protocol)) return;
  if (location.pathname.indexOf("/tests/") !== -1) return; /* harnais internes : rien ne doit bouger */
  /* Consigne de l'auteur (v414) : « ne pas toucher la page tableau de bord ».
     Sur /admin.html, on sort AVANT même d'injecter le style : layout, flotteurs et padding
     du tableau de bord restent exactement ceux de la version précédente. */
  var pnNet = location.pathname.replace(/\/$/, "");
  if (/(^|\/)admin(\.html)?$/i.test(pnNet)) return;

  /* Racine réelle du site, recalculée ici (depuis v417 le STI_AUTH.RACINE de config.js est
     devenu correct partout, mais le module reste autonome — un vieux cache de config.js ne
     doit pas casser la barre). Sans confiance : son ancien regex ignorait
     les pages utilitaires à la racine (glossaire, nouveautes, livre-smart…) et produit alors
     « /glossaire.html/ » — des liens morts. Algorithme sûr : on coupe au premier segment de
     section connu (/cours/, /quiz/, /exercices/…), sinon on retire le nom de fichier ; le
     préfixe de montagem (/STiV2.0/) est conservé tel quel dans les deux cas. */
  function racine() {
    try {
      var pn = location.pathname;
      var m = pn.match(/^(.*?)\/(?:cours|exercices|projets|documents|annexes|quiz|cssanimee|Positionnement-animee|tests)\//);
      if (m) return location.origin + m[1] + "/";
      return location.origin + pn.slice(0, pn.lastIndexOf("/") + 1);
    } catch (e) { return "./"; }
  }

  var R = racine();

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
    /* flotteurs existants du bas de page : on les pose au-dessus de la barre, sans les toucher ailleurs */
    "html.sti-bnav-on #sti-btn-messenger-global{bottom:calc(var(--sti-bnav-h) + var(--sti-bnav-bas,0px) + 10px)!important}",
    "html.sti-bnav-on #sti-msn-bulle-attention{bottom:calc(var(--sti-bnav-h) + var(--sti-bnav-bas,0px) + 64px)!important}",
    "html.sti-bnav-on #sti-auto-to-top{bottom:calc(var(--sti-bnav-h) + var(--sti-bnav-bas,0px) + 118px)!important}",
    /* v420 (consigne n°2) : idem pour les boutons « haut de page » natifs des pages cours
       (#to-top des pages CSS/SQL/PHP, #backToTop des pages HTML5). Attention à l'étage :
       la pastille de diagnostic du labo occupe déjà la bande 14→51 px au-dessus de la barre
       (règle plus bas), ces boutons-là sont donc posés AU-DESSUS d'elle (+118), sinon leurs
       clics sont volés par la pastille — z-index 150 contre ~2147483xxx. Le bouton universel
       monte à l'étage +118 pour la même raison (il cohabite avec la pastille sur l'accueil). */
    "html.sti-bnav-on #to-top,html.sti-bnav-on #backToTop,html.sti-bnav-on #backToTopBtn,html.sti-bnav-on .to-top,html.sti-bnav-on .back-to-top-btn{bottom:calc(var(--sti-bnav-h) + var(--sti-bnav-bas,0px) + 118px)!important}",
    /* Consigne auteur v414→v416 : le bouton de thème flottant en bas à gauche est éliminé de
       toutes les pages (la création est coupée dans acces.js ; ce plug neutralise les anciennes
       copies d'acces.js qui traîneraient encore dans un cache). Le thème reste accessible :
       barre du haut (bouton Jour/Nuit) + roue ⚙️. */
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
    if (nom === "exercices") s += '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M9 7.5h7M9 11h5"/>';
    if (nom === "cours") s += '<path d="M12 6.4C10.4 4.9 7.4 4.4 4.4 5.1v12.8c3-.7 6-.2 7.6 1.3 1.6-1.5 4.6-2 7.6-1.3V5.1c-3-.7-6-.2-7.6 1.3z"/><path d="M12 6.4v12.8"/>';
    if (nom === "quiz") s += '<circle cx="12" cy="12" r="9"/><path d="M9.3 9.2a2.8 2.8 0 0 1 5.4 1c0 1.9-2.7 2.2-2.7 4"/><path d="M12 17.3h.01"/>';
    if (nom === "autres") s += '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>';
    return s + "</svg>";
  }

  /* ---------- état actif ---------- */
  /* L'état actif se déduit du chemin seul — jamais du titre : plusieurs pages partagent
     « STI Quiz » dans leur <title> et l'historique avait surligné le mauvais onglet. */
  var UTILES = /(^|\/)(glossaire|nouveautes|bac-pratique|memo-veille-bac|outils-js-bac|pieges-bac|revision-erreurs|livre-smart|carte-visite)\.html/i;
  function sectionActive() {
    var p = location.pathname.replace(/^\/STiV2\.0/i, "");
    var h = location.hash || "";
    if (h === "#modules") return "quiz";
    if (h === "#exercices") return "exercices";
    if (/\/(quiz|exercices)\//i.test(p) || /series-exercices/i.test(p)) return h === "#modules" ? "quiz" : (/\/(quiz)\//.test(p) ? "quiz" : "exercices");
    if (h === "#cours") return "cours";
    if (/\/(cours)\//i.test(p)) return "cours";
    if (/\/(index\.html)?$/i.test(p) && !UTILES.test(p)) return "accueil";
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
  /* ---------- v428 : les deux barres se roulent au défilement (pages cours + exercices) ----------
     Consigne auteur : « en mode mobile, pour toutes les pages cours ainsi que la page exercices,
     afficher les 2 barres ; quand l'utilisateur défile vers le bas les 2 barres se cachent,
     dès qu'il commence à remonter elles se réaffichent ». Le haut de l'écran étant occupé par
     un en-tête différent sur chaque fiche (header.topbar, nav.topbar, header.top…), la barre du
     haut est RECONNAÎTRE par sa nature plutôt que par une liste de sélecteurs : premier header/
     nav collant (fixed ou sticky) posé à bord supérieur, qui fait la largeur et moins de 45 %
     de la hauteur d'écran. Rien de trouvé → seule la barre du bas se roule (aucune page ne casse).
     Le roulement est suspendu tant qu'un menu de sommaire, le tiroir « Autres » ou une boîte
     modale est ouvert — on ne cache jamais ce que le lecteur est en train de consulter. */
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
      if (doc.querySelector("nav.toc-nav.is-open, #side.open, #sidebar.menu-open, .sidebar.menu-open")) return true;
      /* html5/courshtml5 : leur menu de logo (antérieur à v424) ouvre un « .menu-open » posé
         sur le panneau latéral — même respect : rien ne se cache pendant la lecture du sommaire. */
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
      { cle: "exercices", lib: "Exercices", href: R + "exercices/series-exercices.html", ico: "exercices" },
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

    /* v421 (consigne n°5) : la barre « disparaissait un instant » entre le rendu d'une page
       et l'injection de la barre. config.js a pu peindre un gabarit (même couleur, même
       hauteur, non cliquable) dès le parsing : on l'efface à l'instant où la vraie barre est là. */
    var skel0 = doc.getElementById("sti-bnav-skel"); if (skel0) skel0.remove();
    var skel1 = doc.getElementById("sti-bnav-skel-css"); if (skel1) skel1.remove();

    var sheet = doc.createElement("div");
    sheet.id = "sti-bnav-sheet";
    sheet.setAttribute("role", "dialog");
    sheet.setAttribute("aria-label", "Autres sections du site");
    var liens = [
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

    /* v421 (consignes n°2 et n°3) : un onglet — ou un lien du tiroir — qui pointe vers la page
       où l'on est déjà ne doit PAS « recharger toute la plateforme ». On reste dans le document
       et on fait ce que l'utilisateur attend : remonter en haut (Accueil, ou un onglet déjà
       actif) ou glisser jusqu'à la section demandée (#cours, #modules…). Le titre actif suit. */
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
        try { history.pushState(null, "", u.pathname + (u.search || "") + "#" + hash); } catch (er) { try { location.hash = hash; } catch (e2) {} }
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
        try { if (location.hash) history.pushState(null, "", u.pathname + (u.search || "")); } catch (er) {}
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

    /* Préchauffage : les deux destinations hors-document des onglets sont demandées à l'inactivité,
       si bien qu'un clic « Accueil/Exercices » depuis un long cours repart d'un cache chaud. */
    try {
      var prechauffe = function () {
        [R + "index.html", R + "exercices/series-exercices.html"].forEach(function (href) {
          try { fetch(href, { priority: "low" }).then(function (r) { return r.blob ? r.blob() : null; }).catch(function () {}); } catch (e) {}
        });
      };
      if (window.requestIdleCallback) requestIdleCallback(prechauffe, { timeout: 4000 });
      else setTimeout(prechauffe, 2500);
    } catch (e) {}

    /* v428 (consigne auteur) : sur les pages cours et la page exercices, les deux barres se
       roulent au défilement — cachées en descendant, revenues en remontant, façon application.
       Portée stricte : /cours/ (toutes les fiches) et exercices/series-exercices.html. */
    try {
      var pnV428 = location.pathname;
      if (/\/cours\//.test(pnV428) || /\/exercices\/series-exercices\.html/.test(pnV428)) installerBarresQuiSeRoulent();
    } catch (eRoule) {}

    /* v427 (consigne auteur) : « mettre tout dans une seule page pour ne plus voir la barre
       disparaître entre deux pages ». On ne fusionne rien — on donne au navigateur le moyen
       d'arriver au même résultat : le PRÉRENDU (Speculation Rules). Dès que la barre est en
       place, Chrome/Edge préparent en arrière-plan une vraie instance des pages visées par
       ses onglets (barre déjà installée, thème déjà posé, scripts déjà réchauffés). Au geste
       — survol, ou simple appui — la bascule est instantanée : aucune frame « sans barre »,
       la navigation donne le rendu d'une page unique sans en être une. Les navigateurs qui
       ne connaissent pas la fonctionnalité ignorent la règle EN SILENCE : on reste exactement
       au comportement v425 (gabarit peint dès le premier rendu). Aucun fichier de contenu
       n'est touché, le tableau de bord ne reçoit rien (module exclu comme avant). */
    try {
      /* grammaire réellement livrée par le moteur (Chrome 121+) : « where », pas « sources » —
         vérifié en direct : ce build 156 avertit « unknown key: sources ». Un seul sélecteur
         CSS combiné couvre les onglets de la barre et les liens du tiroir « Autres ». */
      var spec = {
        prerender: [{
          where: { selector_matches: "#sti-bnav a, #sti-bnav-sheet a" },
          eagerness: "moderate"
        }]
      };
      if (window.speculationRules && typeof window.speculationRules.addRules === "function") {
        window.speculationRules.addRules(spec);
      } else {
        /* Chrome/Edge 121-124 : la balise <script type="speculationrules"> est comprise,
           pas encore l'API JS. Même grammaire, voie d'expression différente. */
        var stSpec = doc.createElement("script");
        stSpec.type = "speculationrules";
        stSpec.textContent = JSON.stringify(spec);
        (doc.head || root).appendChild(stSpec);
      }
    } catch (eSpec) {}
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
  /* v418 (consigne auteur) : la pastille « Progression synchronisée (cloud) » et le bouton
     « 📶 Normal » (diagnostic réseau) quittent les bords de la page pour la roue ⚙️. Leur
     logique vit dans roue-nuage.js, chargé ici — donc uniquement sur les pages où le module
     de barre tourne (jamais sur le tableau de bord, jamais en fichier://). */
  (function chargerRoueNuage() {
    try {
      var sc = doc.createElement("script");
      sc.src = R + "assets/js/roue-nuage.js?v=430";
      sc.async = true;
      (doc.head || doc.documentElement).appendChild(sc);
    } catch (e) {}
  })();
  /* v429 (consigne auteur : « on veut améliorer la roue » → look & ergonomie) : habillage du
     panneau ⚙️ (cartes, pastilles rondes, cibles 40 px, animation d'ouverture, scrollbar visible)
     + micro-correction runtime du thème sombre (la classe « sti-theme-sombre » est écrasée par
     acces.js à chaque construction du wrap, et le chemin « thème global » de 🌙 ne la posait
     jamais). Purement visuel : zéro contenu touché, zéro logique modifiée ; décharger ce fichier
     ramène la roue à son look v428. */
  (function chargerRoueHabillage() {
    try {
      var sc2 = doc.createElement("script");
      sc2.src = R + "assets/js/roue-habillage.js?v=429";
      sc2.async = true;
      (doc.head || doc.documentElement).appendChild(sc2);
    } catch (e) {}
  })();
  /* v431 (consigne auteur) : le centre du ⚙️ porte les initiales du compte (P.N) — module
     additif, voir roue-initiales.js. */
  (function chargerRoueInitiales() {
    try {
      var sc3 = doc.createElement("script");
      sc3.src = R + "assets/js/roue-initiales.js?v=431";
      sc3.async = true;
      (doc.head || doc.documentElement).appendChild(sc3);
    } catch (e) {}
  })();
  /* v432 (consigne auteur) : l'anneau autour du ⚙️ montre le niveau de couverture du site
     (pages vues / 126 pages de contenu), journal synchronisé par la voie « sti- » existante. */
  (function chargerRoueCouverture() {
    try {
      var sc4 = doc.createElement("script");
      sc4.src = R + "assets/js/roue-couverture.js?v=434";
      var sc5 = doc.createElement("script");
      sc5.src = R + "assets/js/roue-revision.js?v=437";
      sc5.async = true; (doc.head || doc.documentElement).appendChild(sc5);
      var sc6 = doc.createElement("script");
      sc6.src = R + "assets/js/rappels-locaux.js?v=436";
      sc6.async = true; (doc.head || doc.documentElement).appendChild(sc6);
      var sc7 = doc.createElement("script");
      sc7.src = R + "assets/js/roue-plan.js?v=439";
      sc7.async = true; (doc.head || doc.documentElement).appendChild(sc7);
      sc4.async = true;
      (doc.head || doc.documentElement).appendChild(sc4);
    } catch (e) {}
  })();

  /* v420 (consigne n°1) : « quand on monte en haut complètement, la barre en bas se cache ».
     Sur téléphone, revenir en haut du page fait réapparaître la barre d'URL (Chrome Android)
     ou la barre d'onglets (Safari iOS) : elle se peint PAR-DESSUS le bas de l'écran, et un
     élément `position:fixed;bottom:0` n'en sait rien → la barre semblait disparaître (surtout
     visible sur les longs cours html5/css3/sql, qu'on parcourt de haut en bas). La visualViewport
     connaît la zone réellement visible : on en déduit la hauteur d'UI et on pose tout le matériel
     fixé en bas juste au-dessus. Sur ordinateur la différence est nulle → strictement inchangé. */
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

  /* Visite (v414) : certaines pages reconstruisent le <body> APRÈS nous — portail.js qui
     relit la session, vues de quiz… — et le bandeau se retrouve effacé avec. On observe
     simplement les retraits : la barre revient dès qu'elle disparaît alors qu'elle devrait être là.
     (construire() garde son garde-fou « si #sti-bnav existe déjà, ne rien faire ».) */
  if (!window.__STI_BNAV_WATCH) {
    window.__STI_BNAV_WATCH = true;
    try {
      var mo = new MutationObserver(function () {
        if (mq && mq.matches && !doc.getElementById("sti-bnav")) construire();
      });
      mo.observe(doc.documentElement, { childList: true, subtree: true });
    } catch (e) {}
    setTimeout(function () { if (mq && mq.matches) construire(); }, 2500);
  }
})();
