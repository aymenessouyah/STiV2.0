/* Garder la navigation des cours accessible quand on remonte sur téléphone. */
(function () {
  "use strict";

  function installerOnglets() {
  /* La refonte construit la barre après le chargement du document. */
  var racine = document.documentElement;
  var barre = document.querySelector("#stiCourseTabs");
  var entete = document.querySelector(".site-header");
  if (!barre || !entete || !window.matchMedia) return;

  var mobile = window.matchMedia("(max-width: 700px)");
  var reserve = document.createElement("div");
  reserve.className = "course-tabs-reserve";
  reserve.hidden = true;
  reserve.setAttribute("aria-hidden", "true");
  barre.parentNode.insertBefore(reserve, barre);
  var fixee = false;
  var cachees = racine.classList.contains("sti-barres-cachees");

  /* La réserve évite un saut de contenu lorsque la barre sort du flux. */
  function mesurer() {
    if (!fixee) return;
    var hauteur = barre.offsetHeight + "px";
    var hauteurEntete = entete.offsetHeight + "px";
    if (reserve.style.height !== hauteur) reserve.style.height = hauteur;
    if (racine.style.getPropertyValue("--sti-course-entete") !== hauteurEntete) {
      racine.style.setProperty("--sti-course-entete", hauteurEntete);
    }
  }

  function fixer() {
    if (fixee || !mobile.matches) return;
    /* Une ancienne feuille conservée hors ligne ne connaît pas la fixation :
       attendre sa mise à jour plutôt que d'ajouter un espace dans le flux. */
    if (window.getComputedStyle(barre).getPropertyValue("--sti-onglets-fixation-disponible").trim() !== "1") return;
    /* Mesurer avant de changer le flux : aucune position intermédiaire ne
       doit déclencher l'ancrage de défilement du navigateur. */
    var hauteur = barre.offsetHeight + "px";
    var hauteurEntete = entete.offsetHeight + "px";
    reserve.style.height = hauteur;
    racine.style.setProperty("--sti-course-entete", hauteurEntete);
    reserve.hidden = false;
    fixee = true;
    racine.classList.add("sti-onglets-cours-fixes");
  }

  function liberer() {
    if (!fixee) return;
    racine.classList.remove("sti-onglets-cours-fixes");
    racine.style.removeProperty("--sti-course-entete");
    reserve.hidden = true;
    fixee = false;
  }

  /* Suivre le même état que les barres haute et basse, sans changer leurs commandes.
     Dès le masquage, fixer aussi la barre pour qu'elle ne réapparaisse pas plus bas
     dans l'écran avant d'avoir atteint sa position d'origine. */
  if (cachees) fixer();
  new MutationObserver(function () {
    var maintenantCachees = racine.classList.contains("sti-barres-cachees");
    if (cachees !== maintenantCachees) fixer();
    cachees = maintenantCachees;
  }).observe(racine, { attributes: true, attributeFilter: ["class"] });

  barre.addEventListener("focusin", function () {
    if (racine.classList.contains("sti-barres-cachees")) fixer();
  });
  /* Après une remontée, les onglets restent visibles même au sommet de la page.
     À la descente, l'état partagé les masque avec les autres barres. */
  window.addEventListener("resize", function () {
    if (!mobile.matches) liberer();
    else if (cachees && !fixee) fixer();
    else mesurer();
  }, { passive: true });
  if (window.ResizeObserver) {
    var observateur = new ResizeObserver(mesurer);
    observateur.observe(entete);
    observateur.observe(barre);
  }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", installerOnglets, { once: true });
  else installerOnglets();
})();
