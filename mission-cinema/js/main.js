/* ============================================================================
   MISSION CINÉMA — Contrôleur principal de l'application
   Orchestre les écrans, le nom d'élève, les chapitres et le bilan.
   ============================================================================ */

window.AppController = (function () {
  "use strict";

  var data = window.QUESTIONS_DATA;
  var video = window.VideoController;
  var quiz = window.QuizController;

  // Éléments DOM
  var ecranAccueil = document.getElementById("ecran-accueil");
  var ecranMission = document.getElementById("ecran-mission");
  var ecranBilan = document.getElementById("ecran-bilan");
  var videoEl = document.getElementById("video");
  var zoneInteraction = document.getElementById("zone-interaction");

  var btnStart = document.getElementById("btn-start");
  var inputNom = document.getElementById("input-nom");
  var spanNom = document.getElementById("nom-eleve");

  var spanProgression = document.getElementById("progression-pct");
  var spanScore = document.getElementById("score");
  var spanTotal = document.getElementById("total");
  var spanTemps = document.getElementById("temps");
  var spanTempsVideo = document.getElementById("temps-courant");
  var spanDuree = document.getElementById("temps-total");
  var listeQuestions = document.getElementById("liste-questions");
  var spanChapitre = document.getElementById("chapitre-actuel");

  var videoPlaceholder = document.getElementById("video-placeholder");
  var panneauQuestion = document.getElementById("panneau-question");
  var bulleResultatsAuto = document.getElementById("bulle-resultats-auto");
  var contenuResultatsAuto = document.getElementById("resultats-auto-contenu");

  // État UI
  var updateUITimer = null;
  var detectedError = false;

  function afficherPlaceholder(montrer) {
    if (!videoPlaceholder) return;
    if (montrer) {
      videoPlaceholder.classList.remove("cacher");
      videoEl.style.display = "none";
    } else {
      videoPlaceholder.classList.add("cacher");
      videoEl.style.display = "block";
    }
  }

  function init() {
    // Sauvegarde existante ?
    var sauve = quiz.chargerSauvegarde();
    if (sauve && sauve.nom) {
      inputNom.value = sauve.nom;
      quiz.setNom(sauve.nom);
      afficherEcran("mission");
      startMission();
      return;
    }
    afficherEcran("accueil");

    btnStart.addEventListener("click", function () {
      var nom = String(inputNom.value || "").trim();
      if (nom === "") {
        inputNom.focus();
        inputNom.classList.add("erreur");
        return;
      }
      inputNom.classList.remove("erreur");
      quiz.setNom(nom);
      if (spanNom) spanNom.textContent = nom;
      afficherEcran("mission");
      startMission();
    });

    inputNom.addEventListener("input", function () { inputNom.classList.remove("erreur"); });
    inputNom.addEventListener("keydown", function (e) { if (e.key === "Enter") btnStart.click(); });

    // Pas de contrôles manuels : la vidéo est pilotée par le système
    // (démarrage auto à t=0, pause aux questions, reprise via "Poursuivre")

    // Sauvegarde de la position de lecture (reprise après interruption)
    var POS_KEY = "stiv2_cinema_position";
    var lastPosSave = 0;
    function sauvegarderPosition(t) {
      var now = Date.now();
      if (now - lastPosSave < 4000) return;
      try { localStorage.setItem(POS_KEY, String(Math.floor(t))); lastPosSave = now; } catch (e) {}
    }

    // Callbacks quiz → vidéo
    quiz.on({
      onResume: function () {
        // Après correction : on reprend la lecture exactement là où on était
        video.forcePlay().catch(function () {
          // Si la vidéo ne reprend pas, basculer en mode simulation
          document.getElementById("video-erreur")?.classList.remove("cacher");
          videoEl.style.display = "none";
          afficherPlaceholder(true);
          startSimulationClock();
        });
        rafraichirPanneau();
      },
      onAllDone: function () {
        afficherBilan();
      }
    });

    // Callbacks vidéo → quiz
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
        sauvegarderPosition(missionTime);
      },
      onEnded: function () {
        if (quiz.isComplete()) afficherBilan();
      },
      onError: function (err) {
        detectedError = true;
        var alert = document.getElementById("video-erreur");
        if (alert) {
          alert.innerHTML = "Le fichier vidéo n'a pas pu être chargé (" +
                            (err && err.message ? err.message : "erreur inconnue") +
                            "). <br>L'activité reste accessible : les questions s'affichent au fil du timeline de la mission.<br>" +
                            "<button class='btn' onclick='AppController.modeSansVideo()'>Poursuivre sans la vidéo</button>";
          alert.classList.remove("cacher");
        }
        afficherPlaceholder(true);
        // Mode simulation : horloge qui fait défiler le timeline de la mission
        startSimulationClock();
      }
    });

    spanTotal.textContent = quiz.getTotal();
  }

  var modeSansVideo = function () {
    document.getElementById("video-erreur")?.classList.add("cacher");
    afficherPlaceholder(true);
    startSimulationClock();
  };

  function startMission() {
    cacherBulleResultatsAuto();
    spanScore.textContent = quiz.getScore();
    rafraichirListeQuestions();
    rafraichirPanneau();
    if (quiz.isComplete()) {
      afficherBilan();
      return;
    }
    // Attendre que la vidéo soit chargée avant de faire le seek et le play
    // (sinon seekToSeconds échoue silencieusement et Q1 ne se déclenche pas)
    if (videoEl.readyState >= HTMLMediaElement.HAVE_METADATA) {
      lancerMission();
    } else {
      videoEl.addEventListener("loadedmetadata", function lancer() {
        videoEl.removeEventListener("loadedmetadata", lancer);
        lancerMission();
      }, { once: true });
    }
  }

  function lancerMission() {
    // Reprise : position de lecture enregistrée (si activité interrompue)
    var savedPos = 0;
    try { savedPos = parseInt(localStorage.getItem(POS_KEY) || "0", 10) || 0; } catch (e) {}
    if (savedPos > 5 && savedPos < data.video.duration - 5) {
      // Reprise d'une activité interrompue : se positionner à la dernière position connue
      video.seekToSeconds(savedPos);
    } else {
      // Nouvelle mission : commencer à l'instant 0 de la vidéo
      video.seekToSeconds(0);
    }
    // Démarrage automatique de la vidéo dès le lancement de la mission
    video.forcePlay().catch(function () {
      // Si la vidéo ne peut pas jouer, basculer en mode simulation
      basculerModeSansVideo();
    });
  }

  function basculerModeSansVideo() {
    // Masquer l'alerte d'erreur si présente
    document.getElementById("video-erreur")?.classList.add("cacher");
    // Afficher le placeholder et cacher la vidéo
    afficherPlaceholder(true);
    // Démarrer l'horloge de simulation (les questions se déclenchent sur le timeline)
    startSimulationClock();
  }

  function startSimulationClock() {
    if (updateUITimer) clearInterval(updateUITimer);
    var base = Date.now();
    var missionStart = 0;
    // reprendre là où en était la vidéo avant l'erreur
    var saved = 0;
    var next = video.nextUnansweredTime();
    if (next != null) saved = Math.max(0, next - 5);
    updateUITimer = setInterval(function () {
      var elapsed = (Date.now() - base) / 1000;
      var missionTime = Math.min(saved + elapsed, data.video.duration);
      var pct = (missionTime / data.video.duration) * 100;
      if (spanTemps) spanTemps.textContent = video.formatTime(missionTime);
      var chap = chapitrePourTemps(missionTime);
      if (chap && spanChapitre) spanChapitre.textContent = "Chapitre " + chap.id + " : " + chap.title;
      rafraichirPanneau();

      var q = video.nextQuestionAt(missionTime);
      if (q && !quiz.isAnswered(q.id) && !video.isLocked()) {
        // déclenchement (la vidéo est déjà en pause virtuelle)
        video.pause();
        afficherQuestion(q);
        // arrêter l'horloge pendant la question
        if (updateUITimer) { clearInterval(updateUITimer); updateUITimer = null; }
      }
      if (missionTime >= data.video.duration) {
        if (updateUITimer) { clearInterval(updateUITimer); updateUITimer = null; }
        if (quiz.isComplete()) afficherBilan();
      }
    }, 250);
  }

  function afficherEcran(nom) {
    ecranAccueil.classList.add("cacher");
    ecranMission.classList.add("cacher");
    ecranBilan.classList.add("cacher");
    if (nom === "accueil") ecranAccueil.classList.remove("cacher");
    if (nom === "mission") ecranMission.classList.remove("cacher");
    if (nom === "bilan") ecranBilan.classList.remove("cacher");
  }

  function afficherBulleResultatsAuto() {
    if (!bulleResultatsAuto || !contenuResultatsAuto) return;
    var a6 = quiz.getAnswers()[6];
    var a7 = quiz.getAnswers()[7];
    var html = "";
    if (a6) {
      html += "<div class='resultat-ligne'><span class='resultat-libelle'>Q6 — Insertion données initiales</span><span class='resultat-statut'>✓ Validée (auto)</span></div>";
    }
    if (a7) {
      html += "<div class='resultat-ligne'><span class='resultat-libelle'>Q7 — Nouvel inséré (Tenet)</span><span class='resultat-statut'>✓ Validée (auto)</span></div>";
    }
    contenuResultatsAuto.innerHTML = html;
    bulleResultatsAuto.classList.remove("cacher");
  }

  function cacherBulleResultatsAuto() {
    if (bulleResultatsAuto) bulleResultatsAuto.classList.add("cacher");
  }

  function afficherQuestion(q) {
    panneauQuestion.classList.remove("cacher");
    zoneInteraction.classList.remove("cacher");
    zoneInteraction.innerHTML = "";
    video.pause(); // s'assurer que la vidéo est en pause
    quiz.renderQuestion(q, zoneInteraction);
    rafraichirPanneau();
    // Afficher la bulle résultats Q6-Q7 à partir de Q8
    if (q.num >= 8) afficherBulleResultatsAuto();
    else cacherBulleResultatsAuto();
  }

  function cacherQuestion() {
    panneauQuestion.classList.add("cacher");
    zoneInteraction.classList.add("cacher");
    zoneInteraction.innerHTML = "";
    quiz.hideCorrection();
  }

  // appelé par le bouton "Poursuivre" (dans quiz.showCorrection)
  function reprendreVideo() {
    cacherQuestion();
    video.resume();
  }

  function chapitrePourTemps(t) {
    var chap = null;
    for (var i = 0; i < data.chapters.length; i++) {
      if (t >= data.chapters[i].timeStart && t < data.chapters[i].timeEnd) chap = data.chapters[i];
    }
    return chap;
  }

  function rafraichirPanneau() {
    spanProgression.textContent = quiz.getPct();
    spanScore.textContent = quiz.getScore();
    rafraichirListeQuestions();
  }

  function rafraichirListeQuestions() {
    if (!listeQuestions) return;
    listeQuestions.innerHTML = "";
    data.questions.forEach(function (q) {
      var li = document.createElement("li");
      var re = quiz.isAnswered(q.id);
      li.className = "q-item " + (re ? "traitee" : "");
      var badge = re ? (quiz.getAnswers()[q.id].correct ? "✓" : "✗") : "?";
      li.innerHTML = "<span class='q-badge'>" + badge + "</span> Q" + q.num;
      li.title = q.enonce.replace(/<[^>]*>/g, "").slice(0, 60);
      li.onclick = function () {
        if (quiz.isAnswered(q.id)) {
          // revoir la correction d'une question traitée
          var a = quiz.getAnswers()[q.id];
          video.pause();
          panneauQuestion.classList.remove("cacher");
          zoneInteraction.classList.remove("cacher");
          zoneInteraction.innerHTML = "<div class='q-card'><div class='q-meta'><span class='q-num'>Question " + q.num + " (relecture)</span><span class='q-type'>" + quiz.typeLabel(q.type) + "</span></div></div>";
          quiz.showCorrection(q, a.correct, a.declared ? "Validation déclarative (autre écriture)." : (a.correct ? "Correcte." : "Incorrecte."));
        } else if (!quiz.isComplete()) {
          // Déclencher la question manuellement (utile si la vidéo ne lit pas)
          video.pause();
          afficherQuestion(q);
        }
      };
      listeQuestions.appendChild(li);
    });
  }

  function dernierQuestionTraite() {
    var dernier = null;
    data.questions.forEach(function (q) {
      if (quiz.isAnswered(q.id) && (!dernier || q.time > dernier.time)) dernier = q;
    });
    return dernier;
  }

  // ----------------------------- Bilan -----------------------------
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
    bilanHtml += "<p class='bilan-accroche'>Mission terminée, <b>" + echapperHtml(quiz.getNom() || "élève") + "</b>.</p>";
    bilanHtml += "<div class='bilan-score'><span class='chiffre'>" + score + "</span> / <span>" + total + "</span> <span class='pct'>" + pct + "% de réussite</span></div>";

    // par chapitre
    bilanHtml += "<h3>Bilan par chapitre</h3>";
    data.chapters.forEach(function (chap) {
      var qs = chap.questionIds;
      var ok = 0, tot = 0;
      qs.forEach(function (id) {
        var a = quiz.getAnswers()[id];
        if (a) { tot++; if (a.correct) ok++; }
      });
      var pc = tot ? Math.round((ok / tot) * 100) : 0;
      bilanHtml += "<div class='chap-bilan'><span class='chap-nom'>Chapitre " + chap.id + " – " + chap.title + "</span> " +
                   "<span class='chap-res'>" + ok + " / " + tot + " (" + pc + "%)</span></div>";
    });

    // révisions
    bilanHtml += "<h3>Questions à revoir</h3>";
    var faux = data.questions.filter(function (q) {
      var a = quiz.getAnswers()[q.id];
      return a && !a.correct;
    });
    if (faux.length === 0) {
      bilanHtml += "<p class='vide'>Aucune erreur ! Toutes les réponses sont correctes. 🎬</p>";
    } else {
      faux.forEach(function (q) {
        bilanHtml += "<div class='revision-item'>" +
                     "<span class='q-num'>Q" + q.num + "</span> " +
                     echapperHtml(q.enonce.replace(/<[^>]*>/g, " ")).slice(0, 90) + "…" +
                     "<button class='btn petit' onclick='AppController.revoirQuestion(" + q.id + ")'>Voir la correction</button>" +
                     "</div>";
      });
    }

    bilanHtml += "<div class='bilan-actions'>" +
                 "<button class='btn' onclick='AppController.recommencer()'>Recommencer la mission</button>" +
                 "<button class='btn secondaire' onclick='location.reload()'>Quitter</button>" +
                 "</div>";

    document.getElementById("contenu-bilan").innerHTML = bilanHtml;
    afficherEcran("bilan");
  }

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

  var recommencer = function () {
    quiz.resetProgress();
    video.setAnswered([]);
    spanScore.textContent = "0";
    spanProgression.textContent = "0";
    afficherEcran("accueil");
    inputNom.value = "";
    inputNom.focus();
  };

  function echapperHtml(texte) {
    return String(texte)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  return {
    init: init,
    reprendreVideo: reprendreVideo,
    revoirQuestion: revoirQuestion,
    recommencer: recommencer,
    modeSansVideo: modeSansVideo
  };
})();

// Démarrage quand le DOM est prêt
document.addEventListener("DOMContentLoaded", function () {
  window.AppController.init();
});
