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
    "html.sti-bnav-on body{padding-bottom:calc(var(--sti-bnav-h) + 10px)}",
    "#sti-bnav{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));align-items:stretch;position:fixed;left:0;right:0;bottom:0;z-index:2147483000;background:var(--surface,#fffcf3);border-top:1.5px solid var(--border,#e7d9bd);padding-bottom:env(safe-area-inset-bottom,0px);font-family:system-ui,-apple-system,'Segoe UI',sans-serif;box-shadow:0 -6px 18px rgba(15,23,38,.10)}",
    "html[data-theme='dark'] #sti-bnav{background:var(--surface,#121a2b);border-top-color:var(--border,#26314c)}",
    "#sti-bnav *{box-sizing:border-box}",
    "html[data-theme='dark'] #sti-bnav .sti-bnav-i{color:var(--muted,#9aa7c4)}",
    "#sti-bnav .sti-bnav-i{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;min-height:56px;padding:7px 4px 6px;margin:0;color:var(--muted,#6b6250);text-decoration:none;text-transform:none;font:800 10.5px/1 system-ui,-apple-system,'Segoe UI',sans-serif;letter-spacing:.02em;white-space:nowrap;-webkit-tap-highlight-color:transparent;background:none;border:0;box-shadow:none;transform:none;cursor:pointer;width:100%;transition:none}",
    "#sti-bnav .sti-bnav-i svg{display:block;width:21px;height:21px;margin:0;stroke:currentColor;fill:none;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}",
    "#sti-bnav .sti-bnav-i span{display:block}",
    "@media (max-width:400px){#sti-bnav .sti-bnav-i{font-size:9px;gap:2px}}",
    "html.sti-modal-open #sti-bnav,html.sti-msn-mob-open #sti-bnav{display:none!important}",
    /* flotteurs existants du bas de page : on les pose au-dessus de la barre, sans les toucher ailleurs */
    "html.sti-bnav-on #sti-btn-messenger-global{bottom:calc(var(--sti-bnav-h) + 10px)!important}",
    "html.sti-bnav-on #sti-msn-bulle-attention{bottom:calc(var(--sti-bnav-h) + 64px)!important}",
    "html.sti-bnav-on #sti-auto-to-top{bottom:calc(var(--sti-bnav-h) + 10px)!important}",
    /* Consigne auteur v414→v416 : le bouton de thème flottant en bas à gauche est éliminé de
       toutes les pages (la création est coupée dans acces.js ; ce plug neutralise les anciennes
       copies d'acces.js qui traîneraient encore dans un cache). Le thème reste accessible :
       barre du haut (bouton Jour/Nuit) + roue ⚙️. */
    "#sti-universal-theme-btn{display:none!important}",
    "html.sti-bnav-on #sti-sync-pastille{bottom:calc(var(--sti-bnav-h) + 14px)!important}",
    "html.sti-bnav-on #sti-diagnostic-donnees,html.sti-bnav-on #sti-labo-offline-diagnostic-button{bottom:calc(var(--sti-bnav-h) + 14px)!important}",
    "}",
    /* tiroir « Autres » */
    "#sti-bnav-voile{display:none;position:fixed;inset:0;z-index:2147482990;background:rgba(13,18,30,.45)}",
    "#sti-bnav-sheet{display:none;position:fixed;left:0;right:0;bottom:var(--sti-bnav-h,56px);z-index:2147482995;max-height:62vh;overflow-y:auto;padding:14px 12px calc(14px + env(safe-area-inset-bottom,0px));gap:8px;grid-template-columns:1fr 1fr;background:var(--surface,#fffcf3);border-top:1.5px solid var(--border,#e7d9bd);border-radius:16px 16px 0 0;box-shadow:0 -10px 24px rgba(15,23,38,.20);font-family:system-ui,-apple-system,'Segoe UI',sans-serif}",
    "html[data-theme='dark'] #sti-bnav-sheet{background:var(--surface,#121a2b);border-top-color:var(--border,#26314c)}",
    "html.sti-bnav-sheet-open #sti-bnav-voile{display:block}",
    "html.sti-bnav-sheet-open #sti-bnav-sheet{display:grid}",
    "#sti-bnav .sti-bnav-i.on{color:var(--accent,#f4511e)}",
    "html[data-theme='dark'] #sti-bnav-sheet .sti-bnav-l{color:var(--ink,#eef2ff);background:#1a2338;border-color:#26314c}",
    "#sti-bnav .sti-bnav-i.on::before{content:'';position:absolute;top:-1.5px;left:22%;right:22%;height:2.5px;border-radius:0 0 3px 3px;background:var(--accent,#f4511e)}",
    "#sti-bnav-sheet .sti-bnav-l{display:flex;align-items:center;gap:9px;padding:12px 12px;border:1.5px solid var(--border,#e7d9bd);border-radius:12px;text-decoration:none;font:800 12.5px/1.2 system-ui,-apple-system,'Segoe UI',sans-serif;color:var(--ink,#0f1726);background:var(--surface-2,#f6eedc);margin:0;box-shadow:none;text-align:left}",
    "#sti-bnav-sheet .sti-bnav-l b{font-weight:800}",
    "@media (max-width:700px){html.sti-bnav-on #sti-bnav{}}",
    "@media print{#sti-bnav,#sti-bnav-sheet,#sti-bnav-voile{display:none!important}html.sti-bnav-on body{padding-bottom:0!important}}"
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
      sc.src = R + "assets/js/roue-nuage.js?v=418";
      sc.async = true;
      (doc.head || doc.documentElement).appendChild(sc);
    } catch (e) {}
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
