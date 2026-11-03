/* ============================================================================
   MISSION CINÉMA — Contrôleur principal
   - Pas d'autoplay : la vidéo se lance uniquement par le bouton Play
   - À chaque question : la vidéo se gèle, la bulle s'affiche
   - "Poursuivre" reprend la vidéo exactement là où elle s'était arrêtée
   - Aucune exécution de SQL élève dans le navigateur
   ============================================================================ */

window.AppController = (function () {
  "use strict";

  var data = window.QUESTIONS_DATA;
  var video = window.VideoController;
  var quiz = window.QuizController;

  var ecranAccueil = document.getElementById("ecran-accueil");
  var ecranMission = document.getElementById("ecran-mission");
  var ecranBilan = document.getElementById("ecran-bilan");
  var videoEl = document.getElementById("video");
  var zoneInteraction = document.getElementById("zone-interaction");

  var btnStart = document.getElementById("btn-start");
  var btnPlayVideo = document.getElementById("btn-play-video");

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

  var updateUITimer = null;
  var detectedError = false;

  var revisionMode = false;
  var revisionQuestions = [];
  var revisionIndex = 0;

  function afficherPlaceholder(montrer) {
    if (!videoEl) return;
    if (montrer) {
      document.getElementById("video-placeholder")?.classList.remove("cacher");
      videoEl.style.display = "none";
    } else {
      document.getElementById("video-placeholder")?.classList.add("cacher");
      videoEl.style.display = "block";
    }
  }

  function init() {
    afficherEcran("accueil");

    btnStart.addEventListener("click", function () {
      quiz.setNom("Abonné");
      afficherEcran("mission");
      startMission();
    });

    if (btnPlayVideo) {
      btnPlayVideo.addEventListener("click", function () {
        btnPlayVideo.classList.add("cacher");
        video.forcePlay().catch(function () {});
      });
    }

    var btnAudio = document.getElementById("btn-audio");
    if (btnAudio) {
      btnAudio.addEventListener("click", function () {
        var enabled = quiz.toggleAudio();
        btnAudio.textContent = enabled ? "🔊" : "🔇";
        btnAudio.classList.toggle("mute", !enabled);
      });
    }

    quiz.on({
      onResume: function () {
        video.handleResume().catch(function () {
          document.getElementById("video-erreur")?.classList.remove("cacher");
          videoEl.style.display = "none";
          afficherPlaceholder(true);
        });
        rafraichirPanneau();
      },
      onAllDone: function () {
        afficherBilan();
      }
    });

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

    spanTotal.textContent = quiz.getTotal();
  }

  function startMission() {
    cacherBulleResultatsAuto();
    spanScore.textContent = quiz.getScore();
    rafraichirListeQuestions();
    rafraichirPanneau();
    if (quiz.isComplete()) {
      afficherBilan();
      return;
    }
    afficherPlaceholder(false);
    panneauQuestion.classList.add("cacher");
    zoneInteraction.classList.add("cacher");
    zoneInteraction.innerHTML = "";
  }

  function afficherEcran(nom) {
    ecranAccueil.classList.add("cacher");
    ecranMission.classList.add("cacher");
    ecranBilan.classList.add("cacher");
    if (nom === "accueil") ecranAccueil.classList.remove("cacher");
    if (nom === "mission") ecranMission.classList.remove("cacher");
    if (nom === "bilan") ecranBilan.classList.remove("cacher");
  }

  function rafraichirPanneau() {
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
    panneauQuestion.classList.remove("cacher");
    zoneInteraction.classList.remove("cacher");
    zoneInteraction.innerHTML = "";
    quiz.renderQuestion(q, zoneInteraction);
    rafraichirPanneau();
  }

  function cacherQuestion() {
    panneauQuestion.classList.add("cacher");
    zoneInteraction.classList.add("cacher");
    zoneInteraction.innerHTML = "";
    quiz.hideCorrection();
  }

  function reprendreVideo() {
    cacherQuestion();
    video.handleResume();
    var pending = video.getPendingQuestion();
    if (pending) {
      video.triggerQuestion(pending);
      video.clearPendingQuestion();
    }
  }

  function chapitrePourTemps(t) {
    var chap = null;
    for (var i = 0; i < data.chapters.length; i++) {
      if (t >= data.chapters[i].timeStart && t < data.chapters[i].timeEnd) chap = data.chapters[i];
    }
    return chap;
  }

  function afficherBilan() {
    cacherQuestion();
    var total = quiz.getTotal();
    var score = quiz.getScore();
    var pct = quiz.getPct();
    var succes = 0, echec = 0;
    data.questions.forEach(function (q) {
      var a = quiz.getAnswers()[q.id];
      if (a) { if (a.correct) succes++; else echec++; }
    });

    var bilanHtml = "";
    bilanHtml += "<h2>Bilan de la mission</h2>";
    bilanHtml += "<p>Mission terminée, <b>" + echapperHtml(quiz.getNom() || "élève") + "</b>.</p>";
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
                 "<button class='btn' onclick='AppController.recommencer()'>Recommencer la mission</button>" +
                 "<button class='btn secondaire' onclick='location.reload()'>Quitter</button>" +
                 "</div>";

    document.getElementById("contenu-bilan").innerHTML = bilanHtml;
    afficherEcran("bilan");
  }

  function echapperHtml(texte) {
    return String(texte)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  var recommencer = function () {
    quiz.resetProgress();
    video.setAnswered([]);
    spanScore.textContent = "0";
    spanProgression.textContent = "0";
    if (spanScorePct) spanScorePct.textContent = "0";
    if (spanScorePoints) spanScorePoints.textContent = "0";
    if (spanScoreNiveau) spanScoreNiveau.textContent = "1";
    if (cercleProgress) cercleProgress.style.strokeDashoffset = "364";
    afficherEcran("accueil");
  };

  var revoirQuestion = function (id) {
    var q = data.questions.find(function (x) { return x.id === id; });
    if (!q) return;
    video.pause();
    panneauQuestion.classList.remove("cacher");
    zoneInteraction.classList.remove("cacher");
    zoneInteraction.innerHTML = "<div class='q-card'><div class='q-meta'><span class='q-num'>Question " + q.num + " (relecture)</span><span class='q-type'>Correction</span></div></div>";
    quiz.showCorrection(q, quiz.getAnswers()[id].correct, "Relecture de la correction.");
    afficherEcran("mission");
  };

  return {
    init: init,
    reprendreVideo: reprendreVideo,
    revoirQuestion: revoirQuestion,
    recommencer: recommencer
  };
})();

document.addEventListener("DOMContentLoaded", function () {
  window.AppController.init();
});