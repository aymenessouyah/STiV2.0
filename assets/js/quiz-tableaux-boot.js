/* STI V2.0 — Initialisation synchrone sans flash (FOUC) pour quiz/tableaux.html (v456)
   Fichier externe compatible avec la CSP stricte script-src 'self' (zéro inline).
   Applique dès <head> le thème mémorisé (html.dark / data-theme="dark") et le squelette
   de barre mobile, puis câble le bouton Clair/Sombre #qt-theme-toggle. */
(function () {
  "use strict";
  function lireThemeMemorise() {
    var t = "";
    try { t = localStorage.getItem("sti-theme") || localStorage.getItem("theme") || ""; } catch (e1) {}
    if (t !== "dark" && t !== "light") {
      try { t = localStorage.getItem("sti-roue-theme") === "sombre" ? "dark" : ""; } catch (e2) {}
    }
    return t;
  }

  function appliquerTheme(mode) {
    var r = document.documentElement;
    if (!r) return;
    if (mode === "dark") {
      r.setAttribute("data-theme", "dark");
      r.classList.add("dark", "dark-mode");
    } else if (mode === "light") {
      r.removeAttribute("data-theme");
      r.classList.remove("dark", "dark-mode");
    }
    var btn = document.getElementById("qt-theme-toggle");
    if (btn) {
      var estSombre = r.classList.contains("dark") || r.getAttribute("data-theme") === "dark";
      btn.textContent = estSombre ? "☀️ Clair" : "🌙 Sombre";
      btn.setAttribute("aria-pressed", estSombre ? "true" : "false");
    }
  }

  try {
    var initT = lireThemeMemorise();
    if (initT === "dark" || initT === "light") appliquerTheme(initT);
  } catch (eBoot) {}

  function brancherBoutonTheme() {
    var btn = document.getElementById("qt-theme-toggle");
    if (!btn) return;
    var r = document.documentElement;
    var estSombreInitial = r.classList.contains("dark") || r.getAttribute("data-theme") === "dark";
    btn.textContent = estSombreInitial ? "☀️ Clair" : "🌙 Sombre";
    btn.setAttribute("aria-pressed", estSombreInitial ? "true" : "false");
    btn.addEventListener("click", function () {
      var sombre = !(r.classList.contains("dark") || r.getAttribute("data-theme") === "dark");
      var prochain = sombre ? "dark" : "light";
      try {
        localStorage.setItem("sti-theme", prochain);
        localStorage.setItem("theme", prochain);
        localStorage.setItem("sti-roue-theme", sombre ? "sombre" : "clair");
      } catch (eSave) {}
      appliquerTheme(prochain);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", brancherBoutonTheme);
  } else {
    brancherBoutonTheme();
  }
})();
