/* STI v418 (consigne auteur) — les boutons « ☁️ Progression synchronisée (cloud) » et
   « 📶 Normal / 🌿 Économie » (diagnostic réseau) doivent être DANS la roue ⚙️, plus flottants
   sur la page.
   Mécanisme sans duplicité : on ne réécrit pas ces composants — on DÉPLACE leurs éléments réels
   (pastille de sync-progressions.js, boîtier de mobile-diagnostics.js) dans un bloc
   « ☁️ Nuage & réseau » du panneau de la roue, où ils gardent toute leur vie (texte en direct,
   détail au clic, Actualiser, Libérer le cache, mise à jour toutes les 5 s…).
   Hors roue, ils sont masqués (classe .dans-roue : seuls visibles). Depuis v423, le
   boîtier Normal/Économie est masqué MÊME sur les pages sans roue : il ne vit que dans la roue. Si le module ne peut pas
   tourner (page sans roue, ancien cache), rien ne change : les flotteurs restent comme avant —
   la règle de masquage vit ICI et ne s'applique donc que si cette logique est active.
   Le panneau de la roue pouvant être reconstruit à chaque ouverture, une veille légère re-verse
   les éléments dès qu'ils manquent au panneau ouvert.
   v430 (consigne auteur : « la boîte "Progression : cet appareil seulement" gêne
   l'affichage des autres ») : la pastille quitte le flux de la carte. Elle devient une
   ANNONCE FLOTTANTE en overlay sous la carte « Nuage & réseau » (hors flux → plus rien
   n'est poussé), visible DEUX SECONDES à chaque ouverture du panneau et à chaque changement
   d'état (« restaurée », « synchronisée », « cet appareil seulement »…), puis masquée
   (opacité/visibilité, pointer-events:none — on peut cliquer à travers). Le boîtier
   diagnostic « 📶 Normal » reste, lui, durable dans la carte comme en v418 : seul le
   message de synchro est temporaire. Les couleurs d'état de sync-progressions.js sont
   conservées (le module les pose en dur sur el.style.background, on ne les écrase pas). */
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
    /* v423 (consigne auteur, « idem pour Normal — le laisser dans la roue seulement ») :
       le boîtier « 📶 Normal / Économie » est masqué PARTOUT hors de la roue, y compris sur les
       pages qui n'ont pas de roue — il n'existe plus qu'à l'intérieur du panneau. La pastille
       cloud, elle, garde la règle de v418 (masquée seulement quand la roue est là), car c'est
       elle qui porte les annonces dont l'auteur veut vérifier l'affichage (v422). */
    "#sti-diagnostic-donnees:not(.dans-roue){display:none!important}" +
    "html.sti-roue-dispo #sti-sync-pastille:not(.dans-roue){display:none!important}" +
    "#sti-pan-nuage .dans-roue{width:100%;max-width:none;box-sizing:border-box}" +
    /* v430 — la pastille n'est PLUS dans le flux : bulle overlay sous la carte, 2 s, puis disparaît */
    "#sti-pan-nuage{position:relative}" +
    "#sti-pan-nuage #sti-sync-pastille.dans-roue{position:absolute!important;top:100%!important;bottom:auto!important;left:6px!important;right:6px!important;width:auto!important;max-width:none!important;margin:6px 0 0!important;z-index:4;text-align:center;opacity:0;visibility:hidden;transform:translateY(-6px);pointer-events:none;transition:opacity .25s ease,transform .25s ease,visibility .25s}" +
    "#sti-pan-nuage #sti-sync-pastille.dans-roue.sti-show{opacity:1;visibility:visible;transform:none}" +
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
      if (el.id === "sti-sync-pastille") {
        /* v430 : on garde la couleur d'état posée par sync-progressions.js (fond en dur),
           tout le reste vient de la feuille ci-dessus. On ne remet JAMAIS width:100%/static. */
        var bg = el.style.background || "";
        el.setAttribute("style", "box-sizing:border-box" + (bg ? ";background:" + bg : ""));
      } else {
        el.setAttribute("style", "position:static;width:100%;max-width:none;box-sizing:border-box" + (el.id === "sti-diagnostic-donnees" ? ";margin:0" : ""));
      }
      el.classList.add("dans-roue");
      bloc.appendChild(el);
    }
    /* si le bloc a été créé mais qu'aucun élément n'est encore né (sync en retard), on garde le bloc */
    annoncerSiEtat(p);
  }

  /* ---------- v430 : la pastille s'annonce 2 s puis s'efface ---------- */
  var dernierTexte = null;
  var minuteurAnnonce = null;
  function annoncer(past) {
    past.classList.add("sti-show");
    if (minuteurAnnonce) clearTimeout(minuteurAnnonce);
    minuteurAnnonce = setTimeout(function () {
      past.classList.remove("sti-show");
      minuteurAnnonce = null;
    }, 2000);
  }
  function annoncerSiEtat(p) {
    var pas = doc.getElementById("sti-sync-pastille");
    var bloc = p.querySelector("#sti-pan-nuage");
    if (!pas || !bloc || !bloc.contains(pas)) return;
    var t = String(pas.textContent);
    if (t !== dernierTexte) { dernierTexte = t; annoncer(pas); }
  }

  function lier() {
    var btn = doc.getElementById("sti-roue-btn");
    if (btn) {
      btn.addEventListener("click", function () {
        dernierTexte = null; /* v430 : réarme l'annonce de 2 s à chaque ouverture */
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
