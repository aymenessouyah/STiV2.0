/* STI v2 — configuration d'accès (Supabase + support bilingue FR / EN) */
(function () {
  var estHttp = typeof location !== "undefined" && location.origin && location.origin !== "null";
  var pathname = estHttp ? location.pathname : "";
  var estEn = /\/en(\/|$)/i.test(pathname);
  var racine = estHttp
    ? (location.origin + pathname
        .replace(/\/en(?:\/.*)?$/i, "")
        .replace(/\/(?:cours|exercices|projets|documents|annexes|quiz|cssanimee|Positionnement-animee)(?:\/.*)?$|\/?(?:portail|admin|index|carte-visite|bac-pratique|404|series-exercices|PHP-recap)(?:\.html)?.*$/i, "")
        .replace(/\/?$/, "/"))
    : "./";
  window.STI_AUTH = {
    URL: "https://vywujxmepvcbgedgmger.supabase.co",
    CLE: "sb_publishable_FI5FimytONd5VdWK6GfXLA_I6vPTrvn",
    RACINE: racine,
    EST_EN: estEn,
    RACINE_LANG: estHttp ? (racine + (estEn ? "en/" : "")) : "./",
    ADMIN: "aymenessouyah@gmail.com"
  };
  if (typeof document !== "undefined" && !document.getElementById("sti-i18n-en-script")) {
    var s = document.createElement("script");
    s.id = "sti-i18n-en-script";
    s.src = (estHttp ? racine : "./") + "assets/js/i18n-en.js?v=158";
    s.defer = true;
    (document.head || document.documentElement).appendChild(s);
  }
})();
