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
  var spanNom = document.getElementById("nom-eleve");

  var spanProgression = document.getElementById("progression-pct");
  var spanScore = document.getElementById("score");
  var spanTotal = document.getElementById("total");
  var spanTemps = document.getElementById("temps");
  var spanScorePct = document.getElementById("score-pct");
  var spanScorePoints = document.getElementById("score-points");
  var spanScoreNiveau = document.getElementById("score-niveau");
  var cercleProgress = document.getElementById("score-cercle-progress");
  var modulesListe = document.getElementById("modules-liste");
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

  // État mode révision
  var revisionMode = false;
  var revisionQuestions = [];
  var revisionIndex = 0;

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
    afficherEcran("accueil");

    btnStart.addEventListener("click", function () {
      quiz.setNom("Abonné");
      if (spanNom) spanNom.textContent = "Abonné";
      afficherEcran("mission");
      startMission();
    });

    // Bouton audio (activer/désactiver le son)
    var btnAudio = document.getElementById("btn-audio");
    if (btnAudio) {
      btnAudio.addEventListener("click", function () {
        var enabled = quiz.toggleAudio();
        btnAudio.textContent = enabled ? "🔊" : "🔇";
        btnAudio.classList.toggle("mute", !enabled);
      });
    }

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
    rafraichirPanneau();
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
    // La vidéo CONTINUE pendant l'affichage de la question (pas de pause ici)
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

  function rafraichirPanneau() {
    var pct = quiz.getPct();
    var points = quiz.getPoints();
    var niveau = quiz.getNiveau();

    spanProgression.textContent = pct;
    spanScore.textContent = quiz.getScore();

    // Cercle de score moderne
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

  // Génère la liste des modules SQL avec progression par chapitre
  function rafraichirModulesSQL() {
    if (!modulesListe || !data.chapters) return;
    modulesListe.innerHTML = "";
    data.chapters.forEach(function (chap) {
      var qs = chap.questionIds || [];
      var ok = 0, traite = 0, tot = qs.length;
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

    // Révision avancée par chapitre
    bilanHtml += "<div class='revision-avancee-card'>";
    bilanHtml += "<h3>Révision avancée par chapitre</h3>";
    bilanHtml += "<div class='revision-chap-selector'>";
    data.chapters.forEach(function (chap) {
      var qs = chap.questionIds;
      var ok = 0, tot = 0;
      qs.forEach(function (id) {
        var a = state.answers[id];
        if (a) { tot++; if (a.correct) ok++; }
      });
      var ko = tot - ok;
      var pct = tot ? Math.round((ok / tot) * 100) : 0;
      bilanHtml += "<div class='revision-chap-item'>";
      bilanHtml += "<input type='radio' name='revision-chap' id='chap-" + chap.id + "' value='" + chap.id + "'>";
      bilanHtml += "<div class='revision-chap-info'>";
      bilanHtml += "<span class='revision-chap-nom'>Chapitre " + chap.id + " – " + chap.title + "</span>";
      bilanHtml += "<span class='revision-chap-stats'><span class='" + (ko > 0 ? "ko" : "ok") + "'>" + ok + "/" + tot + " correctes</span> (" + pct + "%)</span>";
      bilanHtml += "</div>";
      bilanHtml += "</div>";
    });
    bilanHtml += "</div>";
    bilanHtml += "<button class='btn' onclick='AppController.startAdvancedRevisionFromSelection()'>Réviser ce chapitre</button>";
    bilanHtml += "</div>";

    bilanHtml += "<div class='bilan-actions'>" +
                 "<button class='btn secondaire' onclick='AppController.rejouerBilanVocal()'>Écouter le bilan vocal</button>" +
                 "<button class='btn' onclick='AppController.voirCorrectionVideo()'>Voir la correction (vidéo)</button>" +
                 "<button class='btn' onclick='AppController.recommencer()'>Recommencer la mission</button>" +
                 "<button class='btn secondaire' onclick='location.reload()'>Quitter</button>" +
                 "</div>";

    document.getElementById("contenu-bilan").innerHTML = bilanHtml;
    afficherEcran("bilan");

    // Narration vocale automatique du bilan (après un léger délai pour laisser le rendu se faire)
    setTimeout(function () {
      quiz.speakBilanSummary();
    }, 800);
  }

  // Rejoue la narration vocale du bilan à la demande
  var rejouerBilanVocal = function () {
    quiz.speakBilanSummary();
  };

  // Relance la vidéo depuis le début pour revoir la correction (vidéo)
  var voirCorrectionVideo = function () {
    afficherEcran("mission");
    cacherQuestion();
    try { video.seekToSeconds(0); } catch (e) {}
    video.forcePlay().catch(function () {});
  };

  var revoirQuestion = function (id) {
    var q = data.questions.find(function (x) { return x.id === id; });
    if (!q) return;
    if (revisionMode) {
      montrerQuestionRevision(id);
      return;
    }
    video.pause();
    panneauQuestion.classList.remove("cacher");
    zoneInteraction.classList.remove("cacher");
    zoneInteraction.innerHTML = "<div class='q-card'><div class='q-meta'><span class='q-num'>Question " + q.num + " (relecture)</span><span class='q-type'>Correction</span></div></div>";
    quiz.showCorrection(q, quiz.getAnswers()[id].correct, "Relecture de la correction.");
    afficherEcran("mission");
  };

  // Démarre le mode révision sur les questions incorrectes
  var startRevision = function () {
    var faux = data.questions.filter(function (q) {
      var a = quiz.getAnswers()[q.id];
      return a && !a.correct;
    });
    if (faux.length === 0) return;
    revisionQuestions = faux;
    revisionIndex = 0;
    revisionMode = true;
    cacherBulleResultatsAuto();
    montrerQuestionRevision();
  };

  // Affiche la question de révision courante pour re-réponse
  var montrerQuestionRevision = function () {
    if (revisionIndex >= revisionQuestions.length) {
      exitRevision();
      return;
    }
    var q = revisionQuestions[revisionIndex];
    video.pause();
    panneauQuestion.classList.remove("cacher");
    zoneInteraction.classList.remove("cacher");

    var html = "<div class='q-card revision-card'>";
    html += "<div class='q-meta'>";
    html += "<span class='q-num'>Révision Q" + q.num + "</span>";
    html += "<span class='q-type'>Question " + (revisionIndex + 1) + " / " + revisionQuestions.length + "</span>";
    html += "</div>";
    html += "<div class='q-enonce'>" + q.enonce + "</div>";

    if (q.type === "sql") {
      html += "<textarea placeholder='Écrivez votre requête SQL…' id='revision-reponse'></textarea>";
    } else {
      html += "<textarea placeholder='Décrivez le résultat attendu…' id='revision-reponse'></textarea>";
    }

    html += "<div class='q-actions'>";
    html += "<button class='btn valider' onclick='AppController.validerRevision()'>Valider ma réponse</button>";
    html += "<button class='btn secondaire' onclick='AppController.sauterRevision()'>Passer</button>";
    html += "</div>";
    html += "<div id='revision-resultat'></div>";
    html += "</div>";

    zoneInteraction.innerHTML = html;
    var ta = document.getElementById("revision-reponse");
    if (ta) ta.focus();
    afficherEcran("mission");
  };

  // Valide la réponse de révision
  var validerRevision = function () {
    if (revisionIndex >= revisionQuestions.length) return;
    var q = revisionQuestions[revisionIndex];
    var ta = document.getElementById("revision-reponse");
    var reponse = ta ? ta.value : "";
    var resDiv = document.getElementById("revision-resultat");

    if (reponse.trim() === "") {
      resDiv.innerHTML = "<span style='color:var(--rouge); font-weight:700;'>Réponse vide.</span>";
      return;
    }

    var correct = false;
    var motif = "";

    if (q.type === "sql") {
      var r = quiz.normaliserSQL(reponse);
      for (var i = 0; i < q.refs.length; i++) {
        if (r === quiz.normaliserSQL(q.refs[i])) {
          correct = true;
          motif = "Votre requête correspond à une écriture de référence.";
          break;
        }
      }
    } else {
      correct = quiz.motsClesPresent(reponse, q.attendu);
      motif = correct ? "Valeurs attendues retrouvées." : "Valeurs attendues non retrouvées.";
    }

    if (correct) {
      quiz.playCorrectSound();
      quiz.reviseQuestion(q, reponse, true, false, motif);
      resDiv.innerHTML = "<span style='color:var(--vert); font-weight:700;'>✓ Correct !</span>";
      resDiv.innerHTML += "<div style='margin-top:10px;'><button class='btn' style='padding:6px 12px;font-size:0.9rem;' onclick='AppController.nextRevision()'>Suivant</button></div>";
    } else {
      quiz.playIncorrectSound();
      quiz.reviseQuestion(q, reponse, false, false, "Incorrect.");
      resDiv.innerHTML = "<span style='color:var(--rouge); font-weight:700;'>✗ Incorrect</span>";
      resDiv.innerHTML += "<div style='margin-top:10px;'><button class='btn' style='padding:6px 12px;font-size:0.9rem;' onclick='AppController.nextRevision()'>Voir la correction</button></div>";
    }
  };

  // Passe à la question de révision suivante
  var nextRevision = function () {
    revisionIndex++;
    montrerQuestionRevision();
  };

  // Sauter une question de révision
  var sauterRevision = function () {
    revisionIndex++;
    montrerQuestionRevision();
  };

  // Quitte le mode révision
  var exitRevision = function () {
    revisionMode = false;
    revisionQuestions = [];
    revisionIndex = 0;
    cacherQuestion();
    afficherBilan();
  };

  // ----------------------------- Révision avancée -----------------------------

  // Démarre la révision avancée à partir du chapitre sélectionné dans le bilan
  var startAdvancedRevisionFromSelection = function () {
    var radios = document.getElementsByName("revision-chap");
    var selected = null;
    for (var i = 0; i < radios.length; i++) {
      if (radios[i].checked) { selected = parseInt(radios[i].value, 10); break; }
    }
    if (selected === null) return;
    startAdvancedRevision(selected);
  };

  // Lance la révision avancée pour un chapitre donné (ou toutes les erreurs si null)
  var startAdvancedRevision = function (chapterId) {
    var firstQ = quiz.startAdvancedRevision(chapterId);
    if (!firstQ) return;
    cacherBulleResultatsAuto();
    montrerQuestionAdvRevision();
  };

  // Affiche la question de révision avancée courante avec indices et progression
  var montrerQuestionAdvRevision = function () {
    var q = quiz.getCurrentAdvRevisionQuestion();
    if (!q) {
      montrerResumeAdvRevision();
      return;
    }

    var stats = quiz.getAdvRevisionStats();
    var hints = quiz.getHints(q);
    var attempt = quiz.getAdvRevisionStats() && revisionAdvAttempts[q.id];

    video.pause();
    panneauQuestion.classList.remove("cacher");
    zoneInteraction.classList.remove("cacher");

    var html = "<div class='q-card revision-card'>";
    html += "<div class='q-meta'>";
    html += "<span class='q-num'>Révision Q" + q.num + "</span>";
    html += "<span class='q-type'>Chapitre " + q.chapter + "</span>";
    html += "</div>";

    // Barre de progression
    html += "<div class='revision-progress'>";
    html += "<div class='revision-progress-label'><span>Progression</span><span>" + stats.revised + "/" + stats.total + "</span></div>";
    html += "<div class='revision-progress-bar'><div class='revision-progress-fill' style='width:" + stats.pct + "%'></div></div>";
    html += "</div>";

    html += "<div class='q-enonce'>" + q.enonce + "</div>";

    // Indices contextuels
    if (hints && hints.length > 0) {
      html += "<div class='revision-hint'>";
      html += "<h4>💡 Indice</h4>";
      html += "<p>" + hints[Math.min(stats.revised, hints.length - 1)] + "</p>";
      html += "</div>";
    }

    if (q.type === "sql") {
      html += "<textarea placeholder='Écrivez votre requête SQL…' id='adv-revision-reponse'></textarea>";
    } else {
      html += "<textarea placeholder='Décrivez le résultat attendu…' id='adv-revision-reponse'></textarea>";
    }

    // Historique des tentatives
    if (attempt) {
      html += "<div class='revision-attempt'>";
      html += "<span class='badge " + (attempt.ok ? "ok" : "ko") + "'>" + (attempt.ok ? "✓ Validé" : "✗ Échec") + "</span>";
      html += "Tentative n°" + attempt.tries;
      html += "</div>";
    }

    html += "<div class='q-actions'>";
    html += "<button class='btn valider' onclick='AppController.validerAdvRevision()'>Valider ma réponse</button>";
    html += "<button class='btn secondaire' onclick='AppController.sauterAdvRevision()'>Passer</button>";
    html += "</div>";
    html += "<div id='adv-revision-resultat'></div>";
    html += "</div>";

    zoneInteraction.innerHTML = html;
    var ta = document.getElementById("adv-revision-reponse");
    if (ta) ta.focus();
    afficherEcran("mission");
  };

  // État des tentatives pour la révision avancée
  var revisionAdvAttempts = {};

  // Valide la réponse en révision avancée (plusieurs tentatives autorisées)
  var validerAdvRevision = function () {
    var q = quiz.getCurrentAdvRevisionQuestion();
    if (!q) return;
    var ta = document.getElementById("adv-revision-reponse");
    var reponse = ta ? ta.value : "";
    var resDiv = document.getElementById("adv-revision-resultat");

    if (reponse.trim() === "") {
      resDiv.innerHTML = "<span style='color:var(--rouge); font-weight:700;'>Réponse vide.</span>";
      return;
    }

    var correct = false;
    var motif = "";

    if (q.type === "sql") {
      var r = quiz.normaliserSQL(reponse);
      for (var i = 0; i < q.refs.length; i++) {
        if (r === quiz.normaliserSQL(q.refs[i])) {
          correct = true;
          motif = "Votre requête correspond à une écriture de référence.";
          break;
        }
      }
    } else {
      correct = quiz.motsClesPresent(reponse, q.attendu);
      motif = correct ? "Valeurs attendues retrouvées." : "Valeurs attendues non retrouvées.";
    }

    var tries = (revisionAdvAttempts[q.id] && revisionAdvAttempts[q.id].tries || 0) + 1;

    if (correct) {
      quiz.playCorrectSound();
      revisionAdvAttempts[q.id] = { ok: true, tries: tries };
      quiz.recordAdvRevisionAttempt(q.id, true, tries);
      resDiv.innerHTML = "<span style='color:var(--vert); font-weight:700;'>✓ Correct !</span>";
      resDiv.innerHTML += "<div style='margin-top:10px;'><button class='btn' style='padding:6px 12px;font-size:0.9rem;' onclick='AppController.nextAdvRevision()'>Question suivante</button></div>";
    } else {
      quiz.playIncorrectSound();
      revisionAdvAttempts[q.id] = { ok: false, tries: tries };
      quiz.recordAdvRevisionAttempt(q.id, false, tries);
      resDiv.innerHTML = "<span style='color:var(--rouge); font-weight:700;'>✗ Incorrect (tentative " + tries + ")</span>";
      resDiv.innerHTML += "<div style='margin-top:10px;'><button class='btn' style='padding:6px 12px;font-size:0.9rem;' onclick='AppController.nextAdvRevision()'>Voir la correction</button></div>";
    }
  };

  // Passe à la question suivante en révision avancée
  var nextAdvRevision = function () {
    var nextQ = quiz.nextAdvRevisionQuestion();
    if (!nextQ) {
      montrerResumeAdvRevision();
      return;
    }
    montrerQuestionAdvRevision();
  };

  // Sauter une question en révision avancée
  var sauterAdvRevision = function () {
    var q = quiz.getCurrentAdvRevisionQuestion();
    if (q) {
      revisionAdvAttempts[q.id] = { ok: false, tries: (revisionAdvAttempts[q.id] && revisionAdvAttempts[q.id].tries || 0) + 1 };
      quiz.recordAdvRevisionAttempt(q.id, false, revisionAdvAttempts[q.id].tries);
    }
    nextAdvRevision();
  };

  // Affiche l'écran de résumé de la révision avancée
  var montrerResumeAdvRevision = function () {
    var stats = quiz.getAdvRevisionStats();
    if (!stats) return;

    cacherQuestion();
    var html = "<div class='revision-summary'>";
    html += "<h3>Résumé de la révision</h3>";
    html += "<div class='revision-summary-score'>" + stats.score + "/" + stats.maxScore + "<span class='delta'>+" + (stats.score - (stats.ok || 0)) + "</span></div>";
    html += "<div class='revision-summary-stats'>";
    html += "<div class='revision-summary-stat'><span class='valeur'>" + stats.revised + "</span><span class='libelle'>questions traitées</span></div>";
    html += "<div class='revision-summary-stat'><span class='valeur'>" + stats.ok + "</span><span class='libelle'>réussies</span></div>";
    html += "<div class='revision-summary-stat'><span class='valeur'>" + stats.pct + "%</span><span class='libelle'>taux de réussite</span></div>";
    html += "</div>";
    html += "<div class='revision-actions'>";
    html += "<button class='btn' onclick='AppController.exitAdvancedRevision()'>Terminer la révision</button>";
    html += "<button class='btn secondaire' onclick='AppController.recommencer()'>Recommencer la mission</button>";
    html += "</div>";
    html += "</div>";

    document.getElementById("contenu-bilan").innerHTML = html;
    afficherEcran("bilan");
  };

  // Quitte la révision avancée et retourne au bilan
  var exitAdvancedRevision = function () {
    quiz.exitAdvancedRevision();
    revisionAdvAttempts = {};
    afficherBilan();
  };

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
    modeSansVideo: modeSansVideo,
    startRevision: startRevision,
    validerRevision: validerRevision,
    nextRevision: nextRevision,
    sauterRevision: sauterRevision,
    exitRevision: exitRevision,
    rejouerBilanVocal: rejouerBilanVocal,
    startAdvancedRevisionFromSelection: startAdvancedRevisionFromSelection,
    startAdvancedRevision: startAdvancedRevision,
    validerAdvRevision: validerAdvRevision,
    nextAdvRevision: nextAdvRevision,
    sauterAdvRevision: sauterAdvRevision,
    exitAdvancedRevision: exitAdvancedRevision,
    voirCorrectionVideo: voirCorrectionVideo
  };
})();

// Démarrage quand le DOM est prêt
document.addEventListener("DOMContentLoaded", function () {
  window.AppController.init();
});
