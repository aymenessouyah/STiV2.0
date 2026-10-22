/* v380 — Le bouton « Retour » du Smart Book ramène là où l'élève était
   avant de venir (historique réel). Sans historique (nouvel onglet,
   ouverture directe), il garde son rôle d'origine : retour aux cours.
   Fichier externe : la CSP de la page interdit les scripts inline. */
(function () {
  "use strict";
  function init() {
    var lien = document.querySelector("a.back");
    if (!lien) return;
    if (history.length > 1) {
      lien.setAttribute("data-href-original", lien.getAttribute("href") || "index.html#cours");
      lien.setAttribute("href", "#");
      lien.setAttribute("title", "Revenir à la page où vous étiez avant");
      var txt = lien.firstChild;
      if (txt && txt.nodeType === 3) txt.nodeValue = "← Retour";
      lien.addEventListener("click", function (ev) {
        /* clic milieu / ctrl+clic : on ne peut pas history.back() ; le href
           « # » reste inoffensif. Clic normal : retour à la page précédente. */
        if (ev.defaultPrevented) return;
        if (ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.button !== 0) return;
        ev.preventDefault();
        history.back();
      });
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
