/* ═══════════════════════════════════════════════════════════════════════════
   STI V2.0 — Exercices « Systèmes, technologies et Internet » (v595)

   Ce module ne fait que quatre choses, sans dépendance externe :
   1. QCM : un clic donne la correction et l'explication, sans jamais laisser
      la bonne réponse en évidence avant le clic ;
   2. cases « exercice fait » et bouton « atelier terminé » : tout passe par
      STIProfil, donc la progression suit l'élève d'un appareil à l'autre ;
   3. barre de progression de l'atelier ;
   4. bouton « tout corriger » pour ouvrir les corrigés d'un coup.

   Rien n'est bloquant : si STIProfil manque, la page reste lisible et les QCM
   fonctionnent quand même (seule la mémorisation est désactivée).
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var MATIERE = "sti";
  var prof = function () { return (window.STIProfil && window.STIProfil.chargerProfil()) || null; };

  /* La liste des exercices faits pour cette matière, sous forme de tableau plat. */
  function faits() {
    var p = prof();
    var liste = p && p.exercicesFaits && p.exercicesFaits[MATIERE];
    return Array.isArray(liste) ? liste : [];
  }

  function memoriser(id, fait) {
    if (!window.STIProfil || !window.STIProfil.basculerExerciceFait) return;
    try { window.STIProfil.basculerExerciceFait(MATIERE, id, fait); } catch (e) { /* jamais bloquant */ }
  }

  /* ── 1. QCM ────────────────────────────────────────────────────────────── */
  function initialiserQcm() {
    var blocs = Array.prototype.slice.call(document.querySelectorAll("[data-qcm]"));
    blocs.forEach(function (bloc) {
      var bonne = String(bloc.getAttribute("data-qcm") || "").trim();
      var boutons = Array.prototype.slice.call(bloc.querySelectorAll("[data-choix]"));
      var retour = bloc.querySelector(".exo-qcm__retour");
      boutons.forEach(function (bouton) {
        bouton.addEventListener("click", function () {
          if (bloc.dataset.repondu === "oui") return;
          bloc.dataset.repondu = "oui";
          var choix = String(bouton.getAttribute("data-choix") || "").trim();
          var juste = choix === bonne;
          bouton.classList.add(juste ? "is-juste" : "is-faux");
          bouton.setAttribute("aria-pressed", "true");
          if (!juste) {
            var vrai = boutons.filter(function (b) { return b.getAttribute("data-choix") === bonne; })[0];
            if (vrai) { vrai.classList.add("is-juste"); vrai.setAttribute("aria-pressed", "true"); }
          }
          boutons.forEach(function (b) { b.disabled = true; });
          if (retour) {
            retour.textContent = juste
              ? (retour.getAttribute("data-juste") || "✅ Exact.")
              : (retour.getAttribute("data-faux") || "❌ Pas tout à fait — la bonne réponse est en vert.");
            retour.classList.add(juste ? "is-juste" : "is-faux");
          }
          bloc.classList.add("is-repondu");
        });
      });
    });
  }

  /* ── 2. « Tout corriger » ──────────────────────────────────────────────── */
  function initialiserCorrections() {
    var bouton = document.querySelector("[data-tout-corriger]");
    if (!bouton) return;
    var cibles = Array.prototype.slice.call(document.querySelectorAll("details.exo-corrige"));
    if (!cibles.length) { bouton.hidden = true; return; }
    var libelle = function () {
      var ouvert = cibles.every(function (d) { return d.open; });
      bouton.textContent = ouvert ? "🙈 Masquer tous les corrigés" : "🔎 Tout corriger";
      bouton.setAttribute("aria-pressed", ouvert ? "true" : "false");
    };
    libelle();
    bouton.addEventListener("click", function () {
      var ouvert = cibles.every(function (d) { return d.open; });
      cibles.forEach(function (d) { d.open = !ouvert; });
      libelle();
    });
  }

  /* ── 3. Progression d'un atelier ───────────────────────────────────────── */
  function majProgression() {
    var barre = document.querySelector("[data-exo-barre]");
    var chiffres = document.querySelector("[data-exo-compteur]");
    if (!barre) return;
    var items = Array.prototype.slice.call(document.querySelectorAll("[data-exo-item]"));
    if (!items.length) return;
    var liste = faits();
    var nb = 0;
    items.forEach(function (item) {
      var id = item.getAttribute("data-exo-item");
      var fait = liste.indexOf(id) !== -1;
      if (fait) nb += 1;
      item.classList.toggle("is-fait", fait);
      var bouton = item.querySelector("[data-exo-item-bouton]");
      if (bouton) {
        bouton.setAttribute("aria-pressed", fait ? "true" : "false");
        bouton.textContent = fait ? "✓ Exercice fait" : "○ Marquer cet exercice comme fait";
      }
    });
    var pct = Math.round((nb / items.length) * 100);
    barre.style.width = pct + "%";
    barre.parentNode.setAttribute("aria-valuenow", String(pct));
    if (chiffres) chiffres.textContent = nb + " / " + items.length + " exercices faits";
    return pct === 100;
  }

  function initialiserSuivi() {
    /* Cases / boutons « exercice fait », un par exercice. */
    Array.prototype.slice.call(document.querySelectorAll("[data-exo-item-bouton]")).forEach(function (bouton) {
      bouton.addEventListener("click", function () {
        var item = bouton.closest("[data-exo-item]");
        if (!item) return;
        var id = item.getAttribute("data-exo-item");
        var fait = faits().indexOf(id) !== -1;
        memoriser(id, !fait);
        majProgression();
        majAtelierEntete();
        majSommaire();
      });
    });

    /* Bouton de fin d'atelier : marque l'atelier entier comme terminé. */
    var global = document.querySelector("[data-atelier-fait]");
    if (global) {
      var idAtelier = global.getAttribute("data-atelier-fait");
      var deja = function () { return faits().indexOf(idAtelier) !== -1; };
      var peindre = function () {
        global.setAttribute("aria-pressed", deja() ? "true" : "false");
        global.textContent = deja() ? "✓ Atelier terminé" : "☐ Marquer l’atelier comme terminé";
      };
      peindre();
      global.addEventListener("click", function () {
        memoriser(idAtelier, !deja());
        peindre();
        majSommaire();
      });
    }

    majProgression();
    majAtelierEntete();
    majSommaire();
  }

  /* Bandeau de haut de page : rappelle le nom de l'atelier et son état. */
  function majAtelierEntete() {
    var titre = document.querySelector("[data-atelier-titre]");
    if (!titre) return;
    var id = titre.getAttribute("data-atelier-titre");
    var fait = faits().indexOf(id) !== -1;
    var badge = document.querySelector("[data-atelier-etat]");
    if (badge) {
      badge.textContent = fait ? "✓ Atelier terminé" : "À faire";
      badge.classList.toggle("is-fait", fait);
    }
  }

  /* Sommaire (page d'accueil des exercices) : x / 4 ateliers terminés. */
  function majSommaire() {
    var cartes = Array.prototype.slice.call(document.querySelectorAll("[data-atelier-carte]"));
    if (!cartes.length) return;
    var liste = faits();
    var nb = 0;
    cartes.forEach(function (carte) {
      var fait = liste.indexOf(carte.getAttribute("data-atelier-carte")) !== -1;
      if (fait) nb += 1;
      carte.classList.toggle("is-fait", fait);
    });
    var compteur = document.querySelector("[data-atelier-compteur]");
    if (compteur) compteur.textContent = nb + " / " + cartes.length + " ateliers terminés";
    var barre = document.querySelector("[data-atelier-barre]");
    if (barre) barre.style.width = Math.round((nb / cartes.length) * 100) + "%";
  }

  function demarrer() {
    initialiserQcm();
    initialiserCorrections();
    initialiserSuivi();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", demarrer, { once: true });
  } else {
    demarrer();
  }
})();
