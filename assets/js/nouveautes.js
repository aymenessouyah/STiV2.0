/* ═══ STI NOUVEAUTÉS (v258) — Journal des dernières mises en ligne ═══
   Lit assets/data/nouveautes.json ; badge NOUVEAU pour ce qui est paru
   depuis la dernière visite de l'élève (localStorage sti-derniere-visite). */
(function () {
  "use strict";
  var boite = document.getElementById("sti-nouveautes");
  if (!boite) return;
  var racine = boite.getAttribute("data-racine") || "./";
  var limite = parseInt(boite.getAttribute("data-limite") || "5", 10);
  var derniere = localStorage.getItem("sti-derniere-visite") || "";
  fetch(racine + "assets/data/nouveautes.json").then(function (r) { return r.json(); }).then(function (liste) {
    liste.sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    var html = "";
    liste.slice(0, limite).forEach(function (n) {
      var nouveau = derniere && n.date > derniere;
      html += '<article style="border:2.5px solid #1a1a2e;border-radius:14px;padding:14px 18px;margin:12px 0;background:#fffdf7;box-shadow:4px 4px 0 #1a1a2e;">'
        + '<p style="margin:0 0 6px;"><span style="background:#1565c0;color:#fff;border-radius:999px;padding:3px 10px;font-size:.8rem;font-weight:800;">' + n.tag + '</span> '
        + '<span style="font-weight:700;">📅 ' + n.date + '</span>'
        + (nouveau ? ' <span style="background:#d81b60;color:#fff;border-radius:999px;padding:3px 10px;font-size:.8rem;font-weight:900;">NOUVEAU</span>' : '')
        + '</p><h3 style="margin:4px 0;">' + n.titre + '</h3>'
        + '<p style="margin:4px 0 10px;line-height:1.5;">' + n.desc + '</p>'
        + (n.lien ? '<a href="' + racine + n.lien + '" style="font-weight:800;color:#d84315;">➜ Découvrir</a>' : '')
        + '</article>';
    });
    boite.innerHTML = html || "<p>Aucune nouveauté pour le moment.</p>";
    try { localStorage.setItem("sti-derniere-visite", new Date().toISOString().slice(0, 10)); } catch (e) {}
  }).catch(function () { boite.innerHTML = "<p>⚠️ Journal momentanément indisponible.</p>"; });
})();
