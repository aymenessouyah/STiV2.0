/* ═══ STI NOUVEAUTÉS (v451) — Journal des dernières mises en ligne ═══
   Lit assets/data/nouveautes.json ; supporte le schéma complet
   { version, date, categorie, icone, titre, resume, lien, libelleLien }
   ainsi que l'ancien repli { tag, desc } (zéro "undefined").
   Support natif Clair / Sombre (html.dark, html.dark-mode, [data-theme="dark"])
   + filtres par catégorie sur la page complète nouveautes.html. */
(function () {
  "use strict";
  var boite = document.getElementById("sti-nouveautes");
  if (!boite) return;

  function esc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function injectCss() {
    if (document.getElementById("sti-nouveautes-css")) return;
    var st = document.createElement("style");
    st.id = "sti-nouveautes-css";
    st.textContent = [
      ".sti-news-toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:14px 0 18px}",
      ".sti-news-chip{appearance:none;border:2px solid #23201a;background:#fffdf7;color:#23201a;border-radius:999px;padding:6px 13px;font-size:.82rem;font-weight:800;cursor:pointer;box-shadow:2px 2px 0 #23201a;transition:transform .12s ease,background .15s ease}",
      ".sti-news-chip:hover{transform:translate(-1px,-1px)}",
      ".sti-news-chip.is-active{background:#d84315;color:#fff;border-color:#23201a}",
      ".sti-news-list{display:grid;grid-template-columns:1fr;gap:14px;margin:12px 0}",
      ".sti-news-list.is-compact{grid-template-columns:repeat(auto-fit,minmax(265px,1fr))}",
      ".sti-news-card{border:2.5px solid #23201a;border-radius:16px;padding:16px 18px;background:#fffdf7;color:#1a1a2e;box-shadow:4px 4px 0 #23201a;display:flex;flex-direction:column;justify-content:space-between;gap:8px;transition:transform .14s ease}",
      ".sti-news-card:hover{transform:translateY(-2px)}",
      ".sti-news-meta{display:flex;flex-wrap:wrap;align-items:center;gap:7px;margin:0}",
      ".sti-news-ver{background:#0f766e;color:#fff;border-radius:999px;padding:3px 10px;font-size:.76rem;font-weight:900;letter-spacing:.02em}",
      ".sti-news-cat{background:#fdebd0;color:#7c2d12;border:1.5px solid rgba(124,45,18,.25);border-radius:999px;padding:2px 10px;font-size:.77rem;font-weight:800}",
      ".sti-news-date{font-size:.8rem;font-weight:700;opacity:.82;margin-left:auto}",
      ".sti-news-new{background:#d81b60;color:#fff;border-radius:999px;padding:3px 9px;font-size:.73rem;font-weight:900;letter-spacing:.03em}",
      ".sti-news-title{margin:2px 0;font-size:1.08rem;line-height:1.35;font-weight:900;color:inherit}",
      ".sti-news-desc{margin:0;font-size:.93rem;line-height:1.56;opacity:.92}",
      ".sti-news-link{display:inline-flex;align-items:center;gap:6px;align-self:flex-start;margin-top:4px;font-weight:900;font-size:.88rem;color:#d84315;text-decoration:none;padding:5px 11px;border-radius:10px;background:rgba(216,67,21,.1);border:1.5px solid rgba(216,67,21,.28)}",
      ".sti-news-link:hover{background:rgba(216,67,21,.18)}",
      "html.dark .sti-news-chip,html.dark-mode .sti-news-chip,html[data-theme='dark'] .sti-news-chip{background:#162033;color:#f1f5f9;border-color:#334155;box-shadow:2px 2px 0 #090d16}",
      "html.dark .sti-news-chip.is-active,html.dark-mode .sti-news-chip.is-active,html[data-theme='dark'] .sti-news-chip.is-active{background:#f97316;color:#0f172a;border-color:#fdba74}",
      "html.dark .sti-news-card,html.dark-mode .sti-news-card,html[data-theme='dark'] .sti-news-card{background:#131c2e;color:#f1f5f9;border-color:#334155;box-shadow:4px 4px 0 #090d16}",
      "html.dark .sti-news-ver,html.dark-mode .sti-news-ver,html[data-theme='dark'] .sti-news-ver{background:#14b8a6;color:#042f2e}",
      "html.dark .sti-news-cat,html.dark-mode .sti-news-cat,html[data-theme='dark'] .sti-news-cat{background:rgba(249,115,22,.16);color:#fdba74;border-color:rgba(251,146,60,.35)}",
      "html.dark .sti-news-link,html.dark-mode .sti-news-link,html[data-theme='dark'] .sti-news-link{color:#fb923c;background:rgba(249,115,22,.14);border-color:rgba(251,146,60,.35)}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function numVersion(v) {
    var m = String(v || "").match(/(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
  }

  function fmtDateFr(iso) {
    var s = String(iso || "").trim();
    var m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return s || "Mise à jour";
    return m[3] + "/" + m[2] + "/" + m[1];
  }

  function familleCat(raw) {
    var c = String(raw || "").toLowerCase();
    if (/admin|conseil|trombi|tableau/.test(c)) return "Tableau de bord & Suivi";
    if (/roue|ergonomie|navigation|accueil|carte|marque|th[eè]me/.test(c)) return "Interface & Roue";
    if (/vid[eé]o|audio|css|html|js|javascript|php|sql|cours|fiche|fluo|rayon/.test(c)) return "Cours & Outils d'étude";
    return "Plateforme & Sécurité";
  }

  injectCss();

  var racine = boite.getAttribute("data-racine") || "./";
  var limite = parseInt(boite.getAttribute("data-limite") || "5", 10);
  if (!isFinite(limite) || limite <= 0) limite = 5;
  var estCompact = limite <= 6;
  var derniere = "";
  try { derniere = localStorage.getItem("sti-derniere-visite") || ""; } catch (e0) {}

  fetch(racine + "assets/data/nouveautes.json?v=451")
    .then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then(function (liste) {
      if (!Array.isArray(liste) || !liste.length) {
        boite.innerHTML = "<p>Aucune nouveauté pour le moment.</p>";
        return;
      }

      var triee = liste.slice().sort(function (a, b) {
        var da = String((a && a.date) || "");
        var db = String((b && b.date) || "");
        if (da !== db) return da < db ? 1 : -1;
        return numVersion(b && b.version) - numVersion(a && a.version);
      });

      var filtreActif = "TOUT";

      function rendre() {
        var sousListe = triee.filter(function (n) {
          if (filtreActif === "TOUT") return true;
          return familleCat(n.categorie || n.tag) === filtreActif;
        }).slice(0, limite);

        var html = "";
        if (!estCompact) {
          var familles = ["TOUT", "Cours & Outils d'étude", "Interface & Roue", "Tableau de bord & Suivi", "Plateforme & Sécurité"];
          html += '<div class="sti-news-toolbar" role="tablist" aria-label="Filtrer les nouveautés">';
          familles.forEach(function (f) {
            var lbl = f === "TOUT" ? "✨ Tout (" + Math.min(triee.length, limite) + ")" : f;
            html += '<button type="button" class="sti-news-chip' + (filtreActif === f ? " is-active" : "") + '" data-news-cat="' + esc(f) + '">' + esc(lbl) + "</button>";
          });
          html += "</div>";
        }

        html += '<div class="sti-news-list' + (estCompact ? " is-compact" : "") + '">';
        sousListe.forEach(function (n) {
          var version = n.version || "";
          var categorie = n.categorie || n.tag || "Nouveauté STI";
          var icone = n.icone || "🆕";
          var titre = n.titre || "Mise à jour STI V2.0";
          var resume = n.resume || n.desc || "";
          var dateIso = n.date || "";
          var nouveau = Boolean(derniere && dateIso && dateIso > derniere);
          var lienBrut = String(n.lien || "").trim();
          var href = "";
          if (lienBrut && !/^javascript:/i.test(lienBrut)) {
            href = /^(https?:|\/|#)/i.test(lienBrut) ? lienBrut : (racine + lienBrut);
          }
          var libelle = n.libelleLien || "Découvrir";

          html += '<article class="sti-news-card">'
            + "<div>"
            + '<p class="sti-news-meta">'
            + (version ? '<span class="sti-news-ver">' + esc(version) + "</span>" : "")
            + '<span class="sti-news-cat">' + esc(icone + " " + categorie) + "</span>"
            + (nouveau ? '<span class="sti-news-new">NOUVEAU</span>' : "")
            + (dateIso ? '<span class="sti-news-date">📅 ' + esc(fmtDateFr(dateIso)) + "</span>" : "")
            + "</p>"
            + '<h3 class="sti-news-title">' + esc(titre) + "</h3>"
            + (resume ? '<p class="sti-news-desc">' + esc(resume) + "</p>" : "")
            + "</div>"
            + (href ? '<a class="sti-news-link" href="' + esc(href) + '">➜ ' + esc(libelle) + "</a>" : "")
            + "</article>";
        });
        html += "</div>";

        boite.innerHTML = sousListe.length ? html : "<p>Aucune nouveauté dans cette catégorie.</p>";

        if (!estCompact) {
          var btns = boite.querySelectorAll("[data-news-cat]");
          for (var i = 0; i < btns.length; i++) {
            btns[i].addEventListener("click", function () {
              filtreActif = this.getAttribute("data-news-cat") || "TOUT";
              rendre();
            });
          }
        }
      }

      rendre();
      try { localStorage.setItem("sti-derniere-visite", new Date().toISOString().slice(0, 10)); } catch (e1) {}
    })
    .catch(function () {
      boite.innerHTML = "<p>⚠️ Journal momentanément indisponible.</p>";
    });
})();
