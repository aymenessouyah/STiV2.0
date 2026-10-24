/* STI v431 (consigne auteur : « le centre de la roue contient A. (1re lettre du prénom)
   B. (1re lettre du nom) ») — le centre du ⚙️ porte désormais les INITIALES du compte
   connecté : « P.N » (1re lettre du prénom, point, 1re lettre du nom), comme un avatar.
   Source : le cache de session « sti-session-cache » (champs prenom/nom fusionnés depuis la
   table profiles par acces.js) ; à défaut, on les déduit de l'email local (séparateurs
   . _ - chiffres ou camelCase → « leila.sassi@ » → L.S ; « aymenessouyah@ » indécoupable → A).
   Strictement additif : seul le GLYPHE du bouton est remplacé (l'engrenage ⚙️ laisse place aux
   lettres) — anneau de progression, badge, panneau, habillage v429 et annonce v430 intacts.
   Le bouton étant recréé quand la session se rafraîchit, une veille légère (700 ms) recalcule
   et re-pose les initiales si elles manquent ou changent ; l'évènement « storage » les met à
   jour aussitôt qu'un autre onglet se connecte. Compte sans prénom/nom ET sans email (cas
   aberrant) : le ⚙️ d'origine reste. Admin : le ⚙️ est masqué par acces.js — rien à faire ici. */
(function () {
  "use strict";
  if (window.__STI_ROUE_INITIALES) return;
  window.__STI_ROUE_INITIALES = true;
  var doc = document;

  function cache() {
    try { return JSON.parse(localStorage.getItem("sti-session-cache") || "null") || {}; } catch (e) { return {}; }
  }
  function premiereLettre(s) {
    s = String(s || "").trim();
    if (!s) return "";
    /* à la lettre près, ignorer accents/majuscules : normaliser puis capitaliser */
    var c = s.charAt(0);
    try { c = c.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); } catch (e) {}
    return c.toUpperCase();
  }
  function depuisEmail(email) {
    var local = String(email || "").split("@")[0] || "";
    var toks = local.split(/[.\-_\d+]+/).filter(Boolean);
    if (toks.length < 2) {
      /* camelCase : aymenEssouyah → ["aymen","Essouyah"] */
      var camel = local.match(/[a-zà-öø-ÿ]+|[A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ]*/g) || [];
      if (camel.length >= 2) toks = camel;
    }
    if (!toks.length) return "";
    var a = premiereLettre(toks[0]);
    var b = toks.length > 1 ? premiereLettre(toks[toks.length - 1]) : "";
    return a + (b ? "." + b : "");
  }
  function initiales() {
    var c = cache();
    var p = premiereLettre(c.prenom);
    var n = premiereLettre(c.nom);
    if (p && n) return p + "." + n;
    if (p || n) return p || n;
    return depuisEmail(c.email || c.phone || "");
  }
  function appliquer() {
    var btn = doc.getElementById("sti-roue-btn");
    if (!btn) return;
    var want = initiales();
    if (btn.getAttribute("data-sti-init") === want && (want === "" || btn.textContent === want)) return;
    btn.setAttribute("data-sti-init", want);
    if (!want) return; /* ni prénom/nom ni email : on laisse l'engrenage d'origine */
    btn.textContent = want;
    btn.style.fontSize = "16px";
    btn.style.fontWeight = "900";
    btn.style.letterSpacing = ".3px";
    btn.style.lineHeight = "1";
  }
  /* veille légère : re-pose les initiales après toute reconstruction du ⚙️ (actualisation de
     session, changement de compte) — même esprit que la veille de roue-nuage.js (v418). */
  setInterval(appliquer, 700);
  try { window.addEventListener("storage", appliquer); } catch (e) {}
  appliquer();
  /* le ⚙️ est créé après validation de session : premier passage utile souvent tardif */
  setTimeout(appliquer, 300);
  setTimeout(appliquer, 1200);
})();
