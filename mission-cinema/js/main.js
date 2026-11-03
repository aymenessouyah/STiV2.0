/* ============================================================================
   MISSION CINÉMA — Contrôleur principal (Style Cinéma)
   ============================================================================ */

window.AppController = (function () {
  "use strict";

  var data = window.QUESTIONS_DATA || {};
  var video = window.VideoController;
  var quiz = window.QuizController;

  // Éléments DOM
  var ecranAccueil = document.getElementById("ecran-accueil");
  var ecranMission = document.getElementById("ecran-mission");
  var ecranBilan = document.getElementById("ecran-bilan");
  var videoEl = document.getElementById("video");
  var zoneInteraction = document.getElementById("zone-interaction");

  var btnStart = document.getElementById("btn-start");
  var btnPlayVideo = document.getElementById("btn-play-video");

  var rideauGauche = document.querySelector(".rideau-gauche");
  var rideauDroit = document.querySelector(".rideau-droit");
  var lumiereSalle = document.querySelector(".lumiere-salle");
  var projecteurGauche = document.querySelector(".projecteur-gauche");
  var projecteurDroit = document.querySelector(".projecteur-droit");

  var spanProgression = document.getElementById("progression-pct");
  var spanScore = document.getElementById("score");
  var spanTotal = document.getElementById("total");
  var spanTemps = document.getElementById("temps");
  var spanChapitre = document.getElementById("chapitre-actuel");
  var spanScorePct = document.getElementById("score-pct");
  var spanScorePoints = document.getElementById("score-points");
  var spanScoreNiveau = document.getElementById("score-niveau");
  var cercleProgress = document.getElementById("score-cercle-progress");
  var listeQuestions = document.getElementById("liste-questions");
  var modulesListe = document.getElementById("modules-liste");

  var panneauQuestion = document.getElementById("panneau-question");

  var rideauxOuverts = false;

  function ouvrirRideaux() {
    if (!rideauxOuverts) {
      rideauxOuverts = true;
      if (rideauGauche) rideauGauche.classList.add("ouvert");
      if (rideauDroit) rideauDroit.classList.add("ouvert");
      if (lumiereSalle) lumiereSalle.classList.add("allumee");
      if (projecteurGauche) projecteurGauche.classList.add("allume");
      if (projecteurDroit) projecteurDroit.classList.add("allume");
    }
  }

  function afficherPlaceholder(montrer) {
    if (!videoEl) return;
    var ph = document.getElementById("video-placeholder");
    if (ph) {
      if (montrer) {
        ph.classList.remove("cacher");
        videoEl.style.display = "none";
      } else {
        ph.classList.add("cacher");
        videoEl.style.display = "block";
      }
    }
  }

  function init() {
    if (!ecranAccueil || !ecranMission || !ecranBilan) {
      console.error("Écrans manquants dans le DOM");
      return;
    }

    afficherEcran("accueil");

    if (btnStart) {
      btnStart.addEventListener("click", function () {
        try {
          quiz.setNom("Abonné");
          ouvrirRideaux();
          setTimeout(function () {
            afficherEcran("mission");
            startMission();
          }, 600);
        } catch (e) {
          console.error("Erreur démarrage :", e);
        }
      });
    } else {
      console.error("Bouton btn-start non trouvé");
    }

    if (btnPlayVideo) {
      btnPlayVideo.addEventListener("click", function () {
        try {
          btnPlayVideo.classList.add("cacher");
          ouvrirRideaux();
          setTimeout(function () {
            if (video && video.forcePlay) {
              video.forcePlay().catch(function () {});
            }
          }, 300);
        } catch (e) {
          console.error("Erreur lecture vidéo :", e);
        }
      });
    }

    var btnAudio = document.getElementById("btn-audio");
    if (btnAudio) {
      btnAudio.addEventListener("click", function () {
        try {
          var enabled = quiz.toggleAudio();
          btnAudio.textContent = enabled ? "🔊" : "🔇";
          btnAudio.classList.toggle("mute", !enabled);
        } catch (e) {
          console.error("Erreur audio :", e);
        }
      });
    }

    if (quiz && quiz.on) {
      quiz.on({
        onResume: function () {
          try {
            if (video && video.handleResume) {
              video.handleResume().catch(function () {
                document.getElementById("video-erreur")?.classList.remove("cacher");
                if (videoEl) videoEl.style.display = "none";
                afficherPlaceholder(true);
              });
            }
            rafraichirPanneau();
          } catch (e) {
            console.error("Erreur onResume :", e);
          }
        },
        onAllDone: function () {
          afficherBilan();
        }
      });
    }

    if (video && video.init) {
      video.init(videoEl, {
        onQuestionTrigger: function (q) {
          afficherQuestion(q);
        },
        onTimeUpdate: function (missionTime, pct) {
          if (detectedError) return;
          if (spanTemps) spanTemps.textContent = video.formatTime(missionTime);
          var chap = chapitrePourTemps(missionTime);
          if (chap && spanChapitre) {
            spanChapitre.textContent = "Chapitre " + chap.id + " : " + chap.title;
          }
          rafraichirPanneau();
        },
        onEnded: function () {
          if (quiz.isComplete()) afficherBilan();
        },
        onError: function (err) {
          detectedError = true;
          afficherPlaceholder(true);
        }
      });
    }

    if (spanTotal && quiz.getTotal) {
      spanTotal.textContent = quiz.getTotal();
    }
  }

  function startMission() {
    try {
      cacherBulleResultatsAuto();
      if (spanScore && quiz.getScore) spanScore.textContent = quiz.getScore();
      rafraichirListeQuestions();
      rafraichirPanneau();
      if (quiz.isComplete()) {
        afficherBilan();
        return;
      }
      afficherPlaceholder(false);
      if (panneauQuestion) panneauQuestion.classList.add("cacher");
      if (zoneInteraction) {
        zoneInteraction.classList.add("cacher");
        zoneInteraction.innerHTML = "";
      }
    } catch (e) {
      console.error("Erreur startMission :", e);
    }
  }

  function afficherEcran(nom) {
    if (ecranAccueil) ecranAccueil.classList.add("cacher");
    if (ecranMission) ecranMission.classList.add("cacher");
    if (ecranBilan) ecranBilan.classList.add("cacher");
    if (nom === "accueil" && ecranAccueil) ecranAccueil.classList.remove("cacher");
    if (nom === "mission" && ecranMission) ecranMission.classList.remove("cacher");
    if (nom === "bilan" && ecranBilan) ecranBilan.classList.remove("cacher");
  }

  function rafraichirPanneau() {
    try {
      var pct = quiz.getPct();
      var points = quiz.getPoints();
      var niveau = quiz.getNiveau();

      if (spanProgression) spanProgression.textContent = pct;
      if (spanScore) spanScore.textContent = quiz.getScore();
      if (spanScorePct) spanScorePct.textContent = pct;
      if (spanScorePoints) spanScorePoints.textContent = points;
      if (spanScoreNiveau) spanScoreNiveau.textContent = niveau;
      if (cercleProgress) {
        var offset = 364 * (1 - pct / 100);
        cercleProgress.style.strokeDashoffset = offset;
      }
      rafraichirModulesSQL();
      rafraichirListeQuestions();
    } catch (e) {
      console.error("Erreur rafraichirPanneau :", e);
    }
  }

  function rafraichirModulesSQL() {
    if (!modulesListe || !data.chapters) return;
    modulesListe.innerHTML = "";
    data.chapters.forEach(function (chap) {
      var qs = chap.questionIds || [];
      var ok = 0, tot = qs.length, traite = 0;
      qs.forEach(function (id) {
        var a = quiz.getAnswers()[id];
        if (a) { traite++; if (a.correct) ok++; }
      });
      var pc = tot ? Math.round((ok / tot) * 100) : 0;
      var termine = ok === tot && tot > 0;

      var div = document.createElement("div");
      div.className = "module-item" + (termine ? " termine" : "");
      div.innerHTML =
        "<span class='module-num'>" + chap.id + "</span>" +
        "<span class='module-titre'>" + echapperHtml(chap.title) + "</span>" +
        "<span class='module-pct'>" + pc + "%</span>" +
        "<div class='module-barre'><div class='module-barre-remplissage' style='width:" + pc + "%'></div></div>";
      modulesListe.appendChild(div);
    });
  }

  function rafraichirListeQuestions() {
    if (!listeQuestions) return;
    listeQuestions.innerHTML = "";
    data.questions.forEach(function (q) {
      var li = document.createElement("li");
      var re = quiz.isAnswered(q.id);
      var a = quiz.getAnswers()[q.id];
      li.className = "q-item " + (re ? (a.correct ? "traitee" : "incorrecte") : "");
      var badge = re ? (a.correct ? "✓" : "✗") : "?";
      li.innerHTML = "<span class='q-badge'>" + badge + "</span> Q" + q.num;
      listeQuestions.appendChild(li);
    });
  }

  function afficherQuestion(q) {
    try {
      if (panneauQuestion) panneauQuestion.classList.remove("cacher");
      if (zoneInteraction) {
        zoneInteraction.classList.remove("cacher");
        zoneInteraction.innerHTML = "";
      }
      quiz.renderQuestion(q, zoneInteraction);
      rafraichirPanneau();
    } catch (e) {
      console.error("Erreur afficherQuestion :", e);
    }
  }

  function cacherQuestion() {
    if (panneauQuestion) panneauQuestion.classList.add("cacher");
    if (zoneInteraction) {
      zoneInteraction.classList.add("cacher");
      zoneInteraction.innerHTML = "";
    }
    quiz.hideCorrection();
  }

  function reprendreVideo() {
    try {
      cacherQuestion();
      if (video && video.handleResume) {
        video.handleResume();
      }
      var pending = video.getPendingQuestion ? video.getPendingQuestion() : null;
      if (pending) {
        video.triggerQuestion(pending);
        video.clearPendingQuestion();
      }
    } catch (e) {
      console.error("Erreur reprendreVideo :", e);
    }
  }

  function chapitrePourTemps(t) {
    var chap = null;
    if (data.chapters) {
      for (var i = 0; i < data.chapters.length; i++) {
        if (t >= data.chapters[i].timeStart && t < data.chapters[i].timeEnd) chap = data.chapters[i];
      }
    }
    return chap;
  }

  function afficherBilan() {
    try {
      cacherQuestion();
      var total = quiz.getTotal();
      var score = quiz.getScore();
      var pct = quiz.getPct();

      var bilanHtml = "";
      bilanHtml += "<h2>BILAN DE LA SÉANCE</h2>";
      bilanHtml += "<p>Séance terminée, <b>" + echapperHtml(quiz.getNom() || "élève") + "</b>.</p>";
      bilanHtml += "<div style='font-size: 1.5rem; font-weight: 800; color: var(--blanc); margin: 20px 0;'>" + score + " / " + total + " (" + pct + "% de réussite)</div>";

      bilanHtml += "<h3 style='text-align: left;'>Questions à revoir</h3>";
      var faux = data.questions.filter(function (q) {
        var a = quiz.getAnswers()[q.id];
        return a && !a.correct;
      });
      if (faux.length === 0) {
        bilanHtml += "<p style='color: var(--vert);'>Aucune erreur ! Toutes les réponses sont correctes. 🎬</p>";
      } else {
        faux.forEach(function (q) {
          bilanHtml += "<div style='margin: 10px 0; padding: 10px; background: var(--glass); border-radius: var(--rayon-sm); text-align: left;'>" +
                       "<strong>Q" + q.num + "</strong> " + echapperHtml(q.enonce.replace(/<[^>]*>/g, " ")).slice(0, 100) + "…" +
                       "<button class='btn' onclick='AppController.revoirQuestion(" + q.id + ")'>Voir la correction</button>" +
                       "</div>";
        });
      }

      bilanHtml += "<div style='margin-top: 30px; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;'>" +
                   "<button class='btn' onclick='AppController.recommencer()'>Recommencer la séance</button>" +
                   "<button class='btn secondaire' onclick='location.reload()'>Quitter</button>" +
                   "</div>";

      document.getElementById("contenu-bilan").innerHTML = bilanHtml;
      afficherEcran("bilan");
    } catch (e) {
      console.error("Erreur afficherBilan :", e);
    }
  }

  function echapperHtml(texte) {
    return String(texte)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  var recommencer = function () {
    try {
      quiz.resetProgress();
      video.setAnswered([]);
      spanScore.textContent = "0";
      spanProgression.textContent = "0";
      if (spanScorePct) spanScorePct.textContent = "0";
      if (spanScorePoints) spanScorePoints.textContent = "0";
      if (spanScoreNiveau) spanScoreNiveau.textContent = "1";
      if (cercleProgress) cercleProgress.style.strokeDashoffset = "364";
      afficherEcran("accueil");
    } catch (e) {
      console.error("Erreur recommencer :", e);
    }
  };

  var revoirQuestion = function (id) {
    try {
      var q = data.questions.find(function (x) { return x.id === id; });
      if (!q) return;
      video.pause();
      panneauQuestion.classList.remove("cacher");
      zoneInteraction.classList.remove("cacher");
      zoneInteraction.innerHTML = "<div class='q-card'><div class='q-meta'><span class='q-num'>Question " + q.num + " (relecture)</span><span class='q-type'>Correction</span></div></div>";
      quiz.showCorrection(q, quiz.getAnswers()[id].correct, "Relecture de la correction.");
      afficherEcran("mission");
    } catch (e) {
      console.error("Erreur revoirQuestion :", e);
    }
  };

  return {
    init: init,
    reprendreVideo: reprendreVideo,
    revoirQuestion: revoirQuestion,
    recommencer: recommencer
  };
})();

document.addEventListener("DOMContentLoaded", function () {
  try {
    window.AppController.init();
  } catch (e) {
    console.error("Erreur initialisation :", e);
  }
});