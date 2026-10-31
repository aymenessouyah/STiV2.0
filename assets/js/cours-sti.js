/* ═══════════════════════════════════════════════════════════════════════════
   STI V2.0 — Cours « Systèmes, technologies et Internet » (3ème SI)
   v593 : la page se comporte comme les cinq autres cours de la plateforme.
   - même anneau de progression (chapitres consultés / révisés) ;
   - chaque chapitre se marque « révisé » ;
   - la lecture met à jour « Reprendre ma dernière lecture » du tableau de bord ;
   - le bouton « Écouter le cours » ouvre le lecteur audio et lance le chapitre 1.
   Toute écriture passe par l'API STIProfil (clé sti-profil-abonne) : rien d'autre
   n'est stocké, et aucun réseau n'est nécessaire.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (global, document) {
  "use strict";

  var MATIERE = "sti";
  var CHAPITRES = [
    { id: "ch1", titre: "Les systèmes d’exploitation" },
    { id: "ch2", titre: "Les réseaux informatiques" },
    { id: "ch3", titre: "L’Internet des objets (IoT)" }
  ];

  function id(nom) { return document.getElementById(nom); }
  function tous(selecteur) { return Array.prototype.slice.call(document.querySelectorAll(selecteur)); }
  function profil() { return global.STIProfil ? global.STIProfil.chargerProfil() : null; }
  function chapitre(idChapitre) {
    for (var i = 0; i < CHAPITRES.length; i++) if (CHAPITRES[i].id === idChapitre) return CHAPITRES[i];
    return null;
  }

  /* ── Anneau et compteurs ─────────────────────────────────────────────── */
  function actualiser() {
    var p = profil();
    var etats = p && p.chapitres ? p.chapitres[MATIERE] || {} : {};
    var consultes = 0;
    var revises = 0;

    CHAPITRES.forEach(function (c) {
      var revise = etats[c.id] === "revise";
      if (revise) revises++;
      if (revise || etats[c.id] === "en_cours") consultes++;

      var section = id(c.id);
      if (section) section.classList.toggle("is-revised", revise);
      var bouton = document.querySelector('[data-toggle-revise="' + c.id + '"]');
      if (bouton) {
        bouton.setAttribute("aria-pressed", String(revise));
        bouton.textContent = revise ? "✓ Chapitre révisé" : "☐ Marquer comme révisé";
      }
    });

    var pourcentage = Math.round(consultes / CHAPITRES.length * 100);
    var cercle = id("courseRingFill");
    if (cercle) {
      var longueur = 2 * Math.PI * 26;
      cercle.style.strokeDasharray = String(longueur);
      cercle.style.strokeDashoffset = String(longueur * (1 - pourcentage / 100));
    }
    var pct = id("courseRingPct");
    if (pct) pct.textContent = pourcentage + "%";
    var compteur = id("courseRingCount");
    if (compteur) compteur.textContent = consultes + " / " + CHAPITRES.length + " chapitres consultés";
    var compteurRevises = id("courseRevisedCount");
    if (compteurRevises) compteurRevises.textContent = revises + " / " + CHAPITRES.length + " chapitres révisés";
  }

  /* ── Lecture : quel chapitre est sous les yeux ? ─────────────────────── */
  var dernierChapitre = "";
  var minuteurLecture = 0;

  function enregistrerLecture(idChapitre) {
    var c = chapitre(idChapitre);
    if (!c || !global.STIProfil || dernierChapitre === idChapitre) return;
    dernierChapitre = idChapitre;
    global.STIProfil.enregistrerLecture(
      MATIERE, idChapitre, c.titre, 0,
      global.location.pathname + "#" + idChapitre
    );
    actualiser();
  }

  function chapitreVisible() {
    var meilleur = "";
    var meilleureDistance = Infinity;
    var milieu = global.innerHeight * 0.35;
    var sections = tous("[data-chapter-id]");
    for (var i = 0; i < sections.length; i++) {
      var rect = sections[i].getBoundingClientRect();
      if (rect.bottom < 0) continue;
      var distance = Math.abs(rect.top - milieu);
      if (distance < meilleureDistance) {
        meilleureDistance = distance;
        meilleur = sections[i].getAttribute("data-chapter-id");
      }
    }
    return meilleur;
  }

  function surDefilement() {
    if (minuteurLecture) return;
    minuteurLecture = global.setTimeout(function () {
      minuteurLecture = 0;
      var visible = chapitreVisible();
      if (visible) enregistrerLecture(visible);
    }, 400);
  }

  /* ── Boutons « Marquer comme révisé » ────────────────────────────────── */
  function basculerRevision(bouton) {
    var idChapitre = bouton.getAttribute("data-toggle-revise");
    var p = profil();
    var etats = p && p.chapitres ? p.chapitres[MATIERE] || {} : {};
    var nouveau = etats[idChapitre] === "revise" ? "a_reviser" : "revise";
    if (global.STIProfil) {
      global.STIProfil.definirEtatChapitre(MATIERE, idChapitre, nouveau, CHAPITRES.length);
    }
    actualiser();
    bouton.focus({ preventScroll: true });
  }

  /* ── « Écouter le cours » : ouvre le lecteur audio et lance le chapitre 1 ── */
  function ecouterLeCours() {
    var section = id("audio-cours");
    if (section) section.scrollIntoView({ block: "center", behavior: "smooth" });
    var premier = document.querySelector('[data-sti-audio="ch1"]');
    var audio = id("stiCoursAudio");
    if (premier) premier.click();
    else if (audio) {
      var lecture = audio.play();
      if (lecture && lecture.catch) lecture.catch(function () {});
    }
  }

  /* ── Mise en route ───────────────────────────────────────────────────── */
  function demarrer() {
    if (global.STIProfil) global.STIProfil.enregistrerVisiteCours(MATIERE);

    tous("[data-toggle-revise]").forEach(function (bouton) {
      bouton.addEventListener("click", function () { basculerRevision(bouton); });
    });

    var boutonAudio = id("heroListenBtn");
    if (boutonAudio) boutonAudio.addEventListener("click", ecouterLeCours);

    /* Le chapitre d'arrivée (ancre) compte tout de suite comme consulté. */
    var ancre = String(global.location.hash || "").replace("#", "");
    if (ancre && chapitre(ancre)) enregistrerLecture(ancre);

    actualiser();
    global.addEventListener("scroll", surDefilement, { passive: true });
    surDefilement();
    global.addEventListener("sti-cloud-restored", actualiser);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", demarrer);
  else demarrer();
})(window, document);
