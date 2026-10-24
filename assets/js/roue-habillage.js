/* STI v429 (consigne auteur : « on veut améliorer la roue » → look & ergonomie) — l'habillage
   du panneau ⚙️. STRICTEMENT additif : acces.js n'est pas touché, aucun contenu n'est modifié.
   Tout vit sous #sti-roue-wrap (le conteneur de la roue) et ne s'applique que si CE module est
   chargé (config.js → mobile-nav.js → roue-habillage.js). Retirer la ligne du chargeur dans
   mobile-nav.js ramène la roue à son look d'avant v429, à l'octet près.

   1) Look & ergonomie (CSS pur, donc sûr quand le panneau est reconstruit à chaque ouverture) :
      - le panneau s'agrandit (330 px max, 90 % de la hauteur utile) et s'ouvre en fondu-coulissé
        (neutralisé si le système demande « mouvement réduit ») ;
      - la scrollbar devient fine et colorée (on comprend enfin que le panneau défile) ;
      - ✕ et 🌙 deviennent des pastilles rondes de 36 px (cible tactile correcte) ;
      - tous les boutons du panneau atteignent 40 px de haut, avec états survol/appui/focus ;
      - « Nuage & réseau », « Mes pages » et les tuiles deviennent de vraies cartes arrondies ;
      - la barre de progression s'épaissit (11 px, fully rounded) ;
      - les libellés de section gagnent un interlettrage régulier ; le pied de version se détache.
   2) Micro-correction : le thème sombre du panneau n'a JAMAIS été actif — acces.js pose la
      classe « sti-theme-sombre » sur le wrap PUIS écrase className avec « sti-no-print » (et
      reconstruit le panneau périodiquement), donc ses ~15 règles sombres ne matchent jamais ;
      de plus quand le thème global existe, 🌙 bascule html.dark-mode sans rien peindre sur la
      roue (panneau clair sur page sombre). Intouchable sans risque, acces.js reçoit ici un
      complément 100 % runtime : une veille légère (800 ms) + clic dans le panneau + évènement
      « storage » maintiennent la classe selon « sti-roue-theme === sombre » OU « sti-theme ===
      dark » OU html.dark-mode, et le libellé 🌙/☀️ du bouton suit. Les règles CSS sombres
      existantes d'acces.js se retrouvent donc actives, et ce fichier ajoute les contreparties
      sombres des cartes créées ici. */
(function () {
  "use strict";
  if (window.__STI_ROUE_HABILLAGE) return;
  window.__STI_ROUE_HABILLAGE = true;
  var doc = document;
  var root = doc.documentElement;
  root.classList.add("sti-roue-habille");

  var st = doc.createElement("style");
  st.id = "sti-roue-habillage-css";
  st.textContent =
    /* ---------- panneau : taille, rayon, scrollbar, ouverture ---------- */
    "#sti-roue-wrap .sti-pan{width:min(330px,calc(100vw - 22px))!important;max-width:calc(100vw - 16px)!important;max-height:min(90dvh,calc(100vh - 12px))!important;border-radius:22px!important;padding:14px 13px 10px!important;scrollbar-width:thin;scrollbar-color:rgba(244,81,30,.5) rgba(35,32,26,.05)}" +
    "#sti-roue-wrap .sti-pan::-webkit-scrollbar{width:8px}" +
    "#sti-roue-wrap .sti-pan::-webkit-scrollbar-thumb{background:rgba(244,81,30,.45);border-radius:8px}" +
    "#sti-roue-wrap .sti-pan::-webkit-scrollbar-track{background:transparent}" +
    "@keyframes sti-pan-in{from{opacity:0;transform:translateX(18px) scale(.965)}to{opacity:1;transform:none}}" +
    "#sti-roue-wrap .sti-pan.ouvert{animation:sti-pan-in .24s cubic-bezier(.22,.9,.35,1)}" +
    "@media (prefers-reduced-motion:reduce){#sti-roue-wrap .sti-pan.ouvert{animation:none}}" +
    /* ---------- interactions : boutons du panneau + roue ---------- */
    "#sti-roue-wrap .sti-pan button:not(#sti-pan-close-x):not(#sti-pan-theme){min-height:40px!important;border-radius:14px!important;line-height:1.35;transition:transform .16s ease,box-shadow .16s ease,filter .16s ease}" +
    "#sti-roue-wrap .sti-pan button:not(#sti-pan-close-x):not(#sti-pan-theme):hover{filter:brightness(1.055)}" +
    "#sti-roue-wrap .sti-pan button:not(#sti-pan-close-x):not(#sti-pan-theme):active{transform:scale(.975)}" +
    "#sti-roue-btn:focus-visible,#sti-roue-wrap .sti-pan button:focus-visible{outline:2px solid #0e7490;outline-offset:2px}" +
    /* ---------- pastilles ✕ et 🌙/☀️ : rondes et pleine cible ---------- */
    "#sti-pan-close-x,#sti-pan-theme{width:36px!important;height:36px!important;min-height:36px!important;border-radius:50%!important;display:inline-flex!important;align-items:center;justify-content:center;padding:0!important;line-height:1;transition:background .15s ease,transform .15s ease}" +
    "#sti-pan-close-x:hover,#sti-pan-theme:hover{transform:scale(1.07)}" +
    "#sti-pan-close-x:active,#sti-pan-theme:active{transform:scale(.93)}" +
    /* ---------- cartes de sections ---------- */
    "#sti-pan-nuage{background:rgba(14,116,144,.07)!important;border:2px solid rgba(14,116,144,.24)!important;border-radius:16px!important;padding:10px 10px 8px!important;margin:12px 0 2px!important}" +
    "#sti-pan-signets-tuile{border-radius:16px!important;padding:10px 10px 8px!important;margin:12px 0 2px!important}" +
    "#sti-pan-prog-track{height:11px!important;border-radius:999px!important;overflow:hidden}" +
    "#sti-pan-prog-track>div{border-radius:999px!important}" +
    "#sti-roue-wrap .sti-pan [style*='text-transform:uppercase']{letter-spacing:.07em!important}" +
    "#sti-pan-version-foot{border-top:1px solid rgba(35,32,26,.12)!important;padding-top:8px!important;margin-top:10px!important}" +
    /* ---------- thème sombre : contreparties des cartes (les règles d'acces.js revivent) ---------- */
    "#sti-roue-wrap.sti-theme-sombre .sti-pan{background:rgba(13,17,25,.94)!important;color:#e8eef7!important;border-color:rgba(255,255,255,.16)!important;scrollbar-color:rgba(255,255,255,.32) rgba(255,255,255,.05)}" +
    "#sti-roue-wrap.sti-theme-sombre .sti-pan::-webkit-scrollbar-thumb{background:rgba(255,255,255,.30)}" +
    "#sti-roue-wrap.sti-theme-sombre #sti-pan-nuage{background:rgba(94,234,212,.08)!important;border-color:rgba(94,234,212,.24)!important}" +
    "#sti-roue-wrap.sti-theme-sombre #sti-pan-version-foot{border-top-color:rgba(255,255,255,.14)!important}" +
    "#sti-roue-wrap.sti-theme-sombre #sti-pan-close-x:hover,#sti-roue-wrap.sti-theme-sombre #sti-pan-theme:hover{background:rgba(255,255,255,.16)!important}" +
    /* ---------- impression : la roue (habillée ou non) ne se peint jamais ---------- */
    "@media print{#sti-roue-wrap{display:none!important}}";
  (doc.head || doc.documentElement).appendChild(st);

  /* ---------- micro-correction du thème : voir l'en-tête du fichier ---------- */
  function estSombre() {
    try {
      if (localStorage.getItem("sti-roue-theme") === "sombre") return true;
      if (localStorage.getItem("sti-theme") === "dark") return true;
    } catch (e) {}
    return root.classList.contains("dark-mode");
  }
  function syncTheme() {
    var w = doc.getElementById("sti-roue-wrap");
    if (!w) return;
    var s = estSombre();
    if (w.classList.contains("sti-theme-sombre") !== s) w.classList.toggle("sti-theme-sombre", s);
    /* le libellé 🌙/☀️ est fixé par acces.js au seul chemin legacy (☀️ si sombre) ; on l'aligne ici pour
       que les deux chemins (thème global ou local) affichent la bonne icône. */
    var t = doc.getElementById("sti-pan-theme");
    if (t) {
      var attendu = s ? "☀️" : "🌙";
      if (t.textContent.indexOf(attendu) !== 0) t.textContent = attendu;
    }
  }
  /* veille légère : le wrap peut être reconstruit à tout moment (actualisation de session) —
     un getElementById + deux comparaisons toutes les 800 ms est négligeable, et c'est le même
     mécanisme « re-verse quand ça manque » que roue-nuage.js (v418). */
  setInterval(syncTheme, 800);
  doc.addEventListener("click", function (e) {
    try {
      var pan = doc.querySelector("#sti-roue-wrap .sti-pan");
      if (pan && e.target && e.target.closest && pan.contains(e.target)) setTimeout(syncTheme, 0);
    } catch (err) {}
  }, false);
  try { window.addEventListener("storage", syncTheme); } catch (e2) {}
})();
