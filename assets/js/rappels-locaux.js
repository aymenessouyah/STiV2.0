/* ══════ STI v436 — RAPPELS LOCAUX (consigne auteur n°9) ══════
   Aucun serveur, aucune inscription : le navigateur de l'élève affiche AU PLUS un rappel
   par jour (« tu as N pages à revoir aujourd'hui ») la première fois qu'il ouvre la
   plateforme dans la journée. Tout est local :
   - la permission de notification n'est demandée QUE sur un clic explicite (« 🔔 Rappels ») ;
   - refus / navigateur sans Notification / mode hors-ligne → silence total, aucune erreur ;
   - la date du dernier rappel est mémorisée (sti-rappel-jour-v436) → jamais deux fois le
     même jour, jamais de relance insistante.
   Le module ne fait rien tant que l'élève ne l'a pas activé. */
(function () {
  "use strict";
  if (window.__STI_RAPPELS) return;
  var doc = document;
  var CLE_JOUR = "sti-rappel-jour-v436";
  var CLE_ACTIF = "sti-rappel-actif-v436";
  function supporte() { return typeof window.Notification !== "undefined"; }
  function actif() { try { return localStorage.getItem(CLE_ACTIF) === "1"; } catch (e) { return false; } }
  function setActif(v) { try { localStorage.setItem(CLE_ACTIF, v ? "1" : "0"); } catch (e) {} }
  function aujourdhui() { var d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
  function dejaRappele() { try { return localStorage.getItem(CLE_JOUR) === aujourdhui(); } catch (e) { return true; } }
  function texteRappel() {
    var n = 0;
    try { if (window.STI_REVISION && window.STI_REVISION.dus) n = window.STI_REVISION.dus().total || 0; } catch (e) {}
    if (!n) return null;
    return { titre: "🔁 Révision STI", corps: n + (n > 1 ? " pages/quiz à revoir aujourd'hui" : " page à revoir aujourd'hui") + " — ouvre la roue ⚙️ et clique sur ✔." };
  }
  function montrer() {
    if (!supporte() || !actif() || Notification.permission !== "granted" || dejaRappele()) return false;
    var t = texteRappel();
    if (!t) return false;
    try {
      var n = new Notification(t.titre, { body: t.corps, tag: "sti-revision-jour", badge: "assets/icons/sti-icon-192.png", icon: "assets/icons/sti-icon-192.png" });
      n.onclick = function () { try { window.focus(); } catch (e) {} n.close(); };
      try { localStorage.setItem(CLE_JOUR, aujourdhui()); } catch (e) {}
      return true;
    } catch (e) { return false; }
  }
  function demander(bouton) {
    if (!supporte()) { if (bouton) bouton.textContent = "🔕 Non disponible"; return; }
    if (Notification.permission === "granted") {
      setActif(!actif());
      if (bouton) bouton.textContent = actif() ? "🔔 Rappels actifs" : "🔕 Rappels coupés";
      if (actif()) montrer();
      return;
    }
    if (Notification.permission === "denied") { if (bouton) bouton.textContent = "🔕 Refusé (navigateur)"; return; }
    try {
      Notification.requestPermission().then(function (r) {
        setActif(r === "granted");
        if (bouton) bouton.textContent = r === "granted" ? "🔔 Rappels actifs" : "🔕 Rappels refusés";
        if (r === "granted") montrer();
      });
    } catch (e) {}
  }
  window.STI_RAPPELS = { demander: demander, montrer: montrer, actif: actif };
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", function () { setTimeout(montrer, 1200); });
  else setTimeout(montrer, 1200);
})();
