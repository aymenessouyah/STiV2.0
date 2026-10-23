/* STI v418 (consigne auteur) — les boutons « ☁️ Progression synchronisée (cloud) » et
   « 📶 Normal / 🌿 Économie » (diagnostic réseau) doivent être DANS la roue ⚙️, plus flottants
   sur la page.
   Mécanisme sans duplicité : on ne réécrit pas ces composants — on DÉPLACE leurs éléments réels
   (pastille de sync-progressions.js, boîtier de mobile-diagnostics.js) dans un bloc
   « ☁️ Nuage & réseau » du panneau de la roue, où ils gardent toute leur vie (texte en direct,
   détail au clic, Actualiser, Libérer le cache, mise à jour toutes les 5 s…).
   Hors roue, ils sont masqués (classe .dans-roue : seuls visibles). Si le module ne peut pas
   tourner (page sans roue, ancien cache), rien ne change : les flotteurs restent comme avant —
   la règle de masquage vit ICI et ne s'applique donc que si cette logique est active.
   Le panneau de la roue pouvant être reconstruit à chaque ouverture, une veille légère re-verse
   les éléments dès qu'ils manquent au panneau ouvert. */
(function () {
  "use strict";
  if (window.__STI_ROUE_NUAGE) return;
  window.__STI_ROUE_NUAGE = true;
  var doc = document;

  var CIBLES = ["sti-sync-pastille", "sti-diagnostic-donnees"];

  /* masque les origines flottantes tant qu'elles ne sont pas dans la roue */
  var st = doc.createElement("style");
  st.id = "sti-roue-nuage-css";
  st.textContent =
    /* le masquage ne s'active qu'une fois la roue ⚙️ repérée sur la page : sans roue, rien
       ne disparaît jamais (les modules d'origine gardent leurs flotteurs tels quels) */
    "html.sti-roue-dispo #sti-sync-pastille:not(.dans-roue),html.sti-roue-dispo #sti-diagnostic-donnees:not(.dans-roue){display:none!important}" +
    "#sti-pan-nuage .dans-roue{width:100%;max-width:none;box-sizing:border-box}" +
    "#sti-pan-nuage #sti-diagnostic-detail{max-height:32vh;overflow:auto}";
  (doc.head || doc.documentElement).appendChild(st);

  function panneau() {
    return doc.querySelector(".sti-pan.ouvert") || (function () {
      var p = doc.querySelector(".sti-pan");
      return p && p.offsetParent !== null ? p : null;
    })();
  }

  function blocDans(p) {
    var b = p.querySelector("#sti-pan-nuage");
    if (b) return b;
    b = doc.createElement("div");
    b.id = "sti-pan-nuage";
    b.setAttribute("style", "margin-top:7px;display:flex;flex-direction:column;gap:5px");
    var t = doc.createElement("div");
    t.textContent = "☁️ Nuage & réseau";
    t.setAttribute("style", "font-size:10.5px;font-weight:900;opacity:.72;padding-left:2px");
    b.appendChild(t);
    var ancre = p.querySelector("#sti-pan-install-wrap") || p.querySelector("#sti-pan-prog-media");
    if (ancre && ancre.parentNode) ancre.parentNode.insertBefore(b, ancre.nextSibling);
    else p.appendChild(b);
    return b;
  }

  function verser() {
    if (doc.getElementById("sti-roue-btn")) doc.documentElement.classList.add("sti-roue-dispo");
    var p = panneau();
    if (!p) return; /* panneau fermé : on ne touche à rien (les origines restent masquées) */
    var bloc = null;
    for (var i = 0; i < CIBLES.length; i++) {
      var el = doc.getElementById(CIBLES[i]);
      if (!el) continue;
      if (bloc && bloc.contains(el)) continue; /* déjà en place */
      if (!bloc) bloc = blocDans(p);
      if (!el.getAttribute("data-style-original")) el.setAttribute("data-style-original", el.getAttribute("style") || "");
      el.setAttribute("style", "position:static;width:100%;max-width:none;box-sizing:border-box" + (el.id === "sti-diagnostic-donnees" ? ";margin:0" : ""));
      el.classList.add("dans-roue");
      bloc.appendChild(el);
    }
    /* si le bloc a été créé mais qu'aucun élément n'est encore né (sync en retard), on garde le bloc */
  }

  function lier() {
    var btn = doc.getElementById("sti-roue-btn");
    if (btn) {
      btn.addEventListener("click", function () {
        setTimeout(verser, 40);
        setTimeout(verser, 400);
      });
    }
    setInterval(verser, 500);
    verser();
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", lier);
  else lier();
})();
