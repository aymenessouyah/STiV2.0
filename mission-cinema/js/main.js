/* ============================================================================
   MISSION CINÉMA — Contrôleur principal (Style Cinéma)
   Version ultra-robuste : chaque opération est protégée, aucune dépendance
   externe n'est requise pour le démarrage.
   ============================================================================ */

window.AppController = (function () {
  "use strict";

  // ---------- Références DOM (résolues à l'initialisation) ----------
  function $id(id) { return document.getElementById(id); }
  function $qs(sel) { return document.querySelector(sel); }

  var ecranAccueil = null;
  var ecranMission = null;
  var ecranBilan = null;
  var videoEl = null;
  var zoneInteraction = null;
  var panneauQuestion = null;

  var btnStart = null;
  var btnPlayVideo = null;

  var rideauGauche = null;
  var rideauDroit = null;
  var lumiereSalle = null;
  var projecteurGauche = null;
  var projecteurDroit = null;

  // ---------- Contrôleurs externes (optionnels) ----------
  var quiz = null;
  var video = null;

  var rideauxOuverts = false;

  // ---------- Helpers ----------
  function tryOp(fn, label) {
    try { return fn(); } catch (e) {
      console.error("AppController [" + label + "] :", e);
      return null;
    }
  }

  function afficherEcran(nom) {
    tryOp(function () {
      if (ecranAccueil) { ecranAccueil.classList.add("cacher"); ecranAccueil.classList.remove("actif"); }
      if (ecranMission) { ecranMission.classList.add("cacher"); ecranMission.classList.remove("actif"); }
      if (ecranBilan) { ecranBilan.classList.add("cacher"); ecranBilan.classList.remove("actif"); }
      if (nom === "accueil" && ecranAccueil) { ecranAccueil.classList.remove("cacher"); ecranAccueil.classList.add("actif"); }
      if (nom === "mission" && ecranMission) { ecranMission.classList.remove("cacher"); ecranMission.classList.add("actif"); }
      if (nom === "bilan" && ecranBilan) { ecranBilan.classList.remove("cacher"); ecranBilan.classList.add("actif"); }
    }, "afficherEcran");
  }

  function ouvrirRideaux() {
    tryOp(function () {
      if (rideauxOuverts) return;
      rideauxOuverts = true;
      if (rideauGauche) rideauGauche.classList.add("ouvert");
      if (rideauDroit) rideauDroit.classList.add("ouvert");
      if (lumiereSalle) lumiereSalle.classList.add("allumee");
      if (projecteurGauche) projecteurGauche.classList.add("allume");
      if (projecteurDroit) projecteurDroit.classList.add("allume");
    }, "ouvrirRideaux");
  }

  // ---------- Démarrage séance ----------
  function demarrerSeance() {
    tryOp(function () {
      ouvrirRideaux();
      setTimeout(function () {
        afficherEcran("mission");
        // Afficher le bouton Play de la vidéo
        var ph = $id("video-placeholder");
        if (ph) { ph.classList.add("cacher"); }
        if (videoEl) { videoEl.style.display = "block"; }
        if (btnPlayVideo) { btnPlayVideo.classList.remove("cacher"); }
        // Initialiser les contrôleurs externes si disponibles
        if (window.VideoController && window.VideoController.init) {
          video = window.VideoController;
          video.init(videoEl, {
            onQuestionTrigger: function (q) { afficherQuestion(q); },
            onTimeUpdate: function (t, pct) {
              var s = $id("temps");
              if (s) s.textContent = (video.formatTime ? video.formatTime(t) : t);
            },
            onEnded: function () {
              if (quiz && quiz.isComplete && quiz.isComplete()) afficherBilan();
            },
            onError: function () {
              var ph = $id("video-placeholder");
              if (ph) { ph.classList.remove("cacher"); }
              if (videoEl) videoEl.style.display = "none";
            }
          });
        }
        if (window.QuizController) {
          quiz = window.QuizController;
          if (quiz.setNom) quiz.setNom("Abonné");
          if (quiz.on) quiz.on({
            onResume: function () {
              tryOp(function () {
                if (video && video.handleResume) video.handleResume();
                rafraichirPanneau();
              }, "onResume");
            },
            onAllDone: function () { afficherBilan(); }
          });
        }
        rafraichirPanneau();
      }, 600);
    }, "demarrerSeance");
  }

  // ---------- Bouton Play vidéo ----------
  function jouerVideo() {
    tryOp(function () {
      if (btnPlayVideo) btnPlayVideo.classList.add("cacher");
      ouvrirRideaux();
      setTimeout(function () {
        var tente = function () {
          if (video && video.forcePlay) {
            video.forcePlay().catch(function (err) {
              console.warn("forcePlay échoué, tentative directe :", err);
              if (videoEl) {
                videoEl.muted = true;
                videoEl.play().catch(function (err2) {
                  console.error("Lecture vidéo impossible :", err2);
                  var ph = $id("video-placeholder");
                  if (ph) { ph.classList.remove("cacher"); }
                  if (videoEl) videoEl.style.display = "none";
                  if (btnPlayVideo) btnPlayVideo.classList.remove("cacher");
                });
              }
            });
          } else if (videoEl) {
            videoEl.muted = true;
            videoEl.play().catch(function (err) {
              console.error("Lecture vidéo impossible :", err);
              var ph = $id("video-placeholder");
              if (ph) { ph.classList.remove("cacher"); }
              if (videoEl) videoEl.style.display = "none";
              if (btnPlayVideo) btnPlayVideo.classList.remove("cacher");
            });
          }
        };
        tente();
      }, 300);
    }, "jouerVideo");
  }

  // ---------- Questions ----------
  function afficherQuestion(q) {
    tryOp(function () {
      if (panneauQuestion) panneauQuestion.classList.remove("cacher");
      if (zoneInteraction) {
        zoneInteraction.classList.remove("cacher");
        zoneInteraction.innerHTML = "";
      }
      if (quiz && quiz.renderQuestion) {
        quiz.renderQuestion(q, zoneInteraction);
      }
      rafraichirPanneau();
    }, "afficherQuestion");
  }

  function cacherQuestion() {
    tryOp(function () {
      if (panneauQuestion) panneauQuestion.classList.add("cacher");
      if (zoneInteraction) {
        zoneInteraction.classList.add("cacher");
        zoneInteraction.innerHTML = "";
      }
      if (quiz && quiz.hideCorrection) quiz.hideCorrection();
    }, "cacherQuestion");
  }

  function reprendreVideo() {
    tryOp(function () {
      cacherQuestion();
      if (video && video.handleResume) video.handleResume();
      var pending = video.getPendingQuestion ? video.getPendingQuestion() : null;
      if (pending) {
        video.triggerQuestion(pending);
        video.clearPendingQuestion();
      }
    }, "reprendreVideo");
  }

  function rafraichirPanneau() {
    tryOp(function () {
      if (!quiz) return;
      var spanProgression = $id("progression-pct");
      var spanScore = $id("score");
      var spanTotal = $id("total");
      var spanTemps = $id("temps");
      var spanChapitre = $id("chapitre-actuel");
      var spanScorePct = $id("score-pct");
      var spanScorePoints = $id("score-points");
      var spanScoreNiveau = $id("score-niveau");
      var cercleProgress = $id("score-cercle-progress");
      var modulesListe = $id("modules-liste");
      var listeQuestions = $id("liste-questions");

      var pct = quiz.getPct ? quiz.getPct() : 0;
      var score = quiz.getScore ? quiz.getScore() : 0;
      var points = quiz.getPoints ? quiz.getPoints() : 0;
      var niveau = quiz.getNiveau ? quiz.getNiveau() : 1;
      var total = quiz.getTotal ? quiz.getTotal() : 0;

      if (spanProgression) spanProgression.textContent = pct;
      if (spanScore) spanScore.textContent = score;
      if (spanTotal) spanTotal.textContent = total;
      if (spanScorePct) spanScorePct.textContent = pct;
      if (spanScorePoints) spanScorePoints.textContent = points;
      if (spanScoreNiveau) spanScoreNiveau.textContent = niveau;
      if (cercleProgress) {
        var offset = 364 * (1 - pct / 100);
        cercleProgress.style.strokeDashoffset = offset;
      }
    }, "rafraichirPanneau");
  }

  function afficherBilan() {
    tryOp(function () {
      cacherQuestion();
      afficherEcran("bilan");
      var contenu = $id("contenu-bilan");
      if (!contenu) return;
      var total = quiz ? (quiz.getTotal ? quiz.getTotal() : 0) : 0;
      var score = quiz ? (quiz.getScore ? quiz.getScore() : 0) : 0;
      var pct = quiz ? (quiz.getPct ? quiz.getPct() : 0) : 0;
      var nom = quiz ? (quiz.getNom ? quiz.getNom() : "élève") : "élève";

      contenu.innerHTML =
        "<h2>BILAN DE LA SÉANCE</h2>" +
        "<p>Séance terminée, <b>" + nom + "</b>.</p>" +
        "<div style='font-size: 1.5rem; font-weight: 800; color: var(--blanc); margin: 20px 0;'>" +
        score + " / " + total + " (" + pct + "% de réussite)</div>" +
        "<div style='margin-top: 30px; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;'>" +
        "<button class='btn' onclick='location.reload()'>Recommencer</button>" +
        "<button class='btn secondaire' onclick='afficherEcran(\"accueil\")'>Menu</button>" +
        "</div>";
    }, "afficherBilan");
  }

  // ---------- Initialisation ----------
  function init() {
    ecranAccueil = $id("ecran-accueil");
    ecranMission = $id("ecran-mission");
    ecranBilan = $id("ecran-bilan");
    videoEl = $id("video");
    zoneInteraction = $id("zone-interaction");
    panneauQuestion = $id("panneau-question");

    btnStart = $id("btn-start");
    btnPlayVideo = $id("btn-play-video");

    rideauGauche = $qs(".rideau-gauche");
    rideauDroit = $qs(".rideau-droit");
    lumiereSalle = $qs(".lumiere-salle");
    projecteurGauche = $qs(".projecteur-gauche");
    projecteurDroit = $qs(".projecteur-droit");

    if (!ecranAccueil || !ecranMission || !ecranBilan) {
      console.error("Écrans manquants dans le DOM");
      return;
    }

    afficherEcran("accueil");

    // Bouton Démarrer — totalement autonome, aucune dépendance externe
    if (btnStart) {
      btnStart.addEventListener("click", demarrerSeance);
    } else {
      console.error("Bouton btn-start non trouvé");
    }

    // Bouton Play vidéo
    if (btnPlayVideo) {
      btnPlayVideo.addEventListener("click", jouerVideo);
    }

    // Bouton audio (optionnel)
    var btnAudio = $id("btn-audio");
    if (btnAudio && quiz) {
      btnAudio.addEventListener("click", function () {
        tryOp(function () {
          var enabled = quiz.toggleAudio ? quiz.toggleAudio() : true;
          btnAudio.textContent = enabled ? "🔊" : "🔇";
          btnAudio.classList.toggle("mute", !enabled);
        }, "audio");
      });
    }
  }

  return {
    init: init,
    reprendreVideo: reprendreVideo,
    afficherBilan: afficherBilan,
    afficherEcran: afficherEcran
  };
})();

document.addEventListener("DOMContentLoaded", function () {
  try {
    window.AppController.init();
  } catch (e) {
    console.error("Erreur initialisation globale :", e);
  }
});