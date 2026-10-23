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
        var pn = location.pathname;
        var m = pn.match(/^(.*?)\/(?:cours|exercices|projets|documents|annexes|quiz|cssanimee|Positionnement-animee|tests)\//);
        var base = m ? m[1] + "/" : pn.slice(0, pn.lastIndexOf("/") + 1);
        return location.origin + base;
      })()
    : "./",
  ADMIN: "aymenessouyah@gmail.com"
};

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
      var pn = location.pathname;
      var m = pn.match(/^(.*?)\/(?:cours|exercices|projets|documents|annexes|quiz|cssanimee|Positionnement-animee|tests)\//);
      base = m ? location.origin + m[1] + "/" : location.origin + pn.slice(0, pn.lastIndexOf("/") + 1);
    } catch (e) {}
    s.src = base + "assets/js/mobile-nav.js?v=417";
    s.async = true;
    (document.head || document.documentElement).appendChild(s);
  } catch (e) {}
})();
