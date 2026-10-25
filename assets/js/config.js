/* STI v2 — configuration d'accès (Supabase) */
window.STI_AUTH = {
  URL: "https://vywujxmepvcbgedgmger.supabase.co",
  CLE: "sb_publishable_FI5FimytONd5VdWK6GfXLA_I6vPTrvn",
  CLE_TURNSTILE: "0x4AAAAAAFeMDzetHdIs1MmC",
  VERSION: 316,
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
