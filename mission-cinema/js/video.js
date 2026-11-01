/* ============================================================================
   MISSION CINÉMA — Contrôleur vidéo et synchronisation des questions
   HTML5 VIDEO + currentTime / pause() / play()
   ============================================================================ */

window.VideoController = (function () {
  "use strict";

  var data = window.QUESTIONS_DATA;
  var video = null;

  // État
  var playing = false;
  var loopCount = 0;          // nombre de boucles effectuées (vidéo de démo de 30 s)
  var lastCurrentTime = 0;
  var missionDuration = data.video.duration;          // 330 s timeline mission
  var loopDuration = data.video.loopDuration;         // 30 s fichier réel
  var pausedForQuestion = false;                      // en pause pour une question
  var questionLocked = false;                         // une question est en cours de traitement
  var answeredIds = new Set();                        // questions déjà traitées
  var videoFailed = false;                            // vrai si le fichier MP4 ne charge pas
  var questionPollTimer = null;                       // poller pour détecter les questions de façon fiable

  // Callbacks
  var onQuestionTrigger = null;   // function(question)
  var onTimeUpdate = null;        // function(missionTime, pct)
  var onEnded = null;
  var onError = null;

  function init(videoEl, callbacks) {
    video = videoEl;
    if (callbacks) {
      onQuestionTrigger = callbacks.onQuestionTrigger || null;
      onTimeUpdate = callbacks.onTimeUpdate || null;
      onEnded = callbacks.onEnded || null;
      onError = callbacks.onError || null;
    }
    bindEvents();
    return this;
  }

  function bindEvents() {
    if (!video) return;

    video.addEventListener("play", function () { playing = true; startQuestionPoll(); });
    video.addEventListener("pause", function () { playing = false; stopQuestionPoll(); });
    video.addEventListener("ended", function () {
      stopQuestionPoll();
      if (onEnded) onEnded();
    });
    video.addEventListener("error", function () {
      videoFailed = true;
      if (onError) onError(video.error);
    });

    video.addEventListener("loadedmetadata", function () {
      if (videoFailed) return;
      // La vidéo est prête : on peut démarrer
    });

    // Synchronisation : currentTime + détection des boucles de la vidéo démo
    video.addEventListener("timeupdate", function () {
      if (pausedForQuestion || questionLocked) return;

      var ct = video.currentTime;
      // Détection d'un retour à 0 (boucle du fichier de démonstration)
      if (ct < lastCurrentTime - 1) {
        loopCount++;
      }
      lastCurrentTime = ct;

      var missionTime = ct + loopCount * loopDuration;
      if (missionTime > missionDuration) missionTime = missionDuration;

      if (onTimeUpdate) onTimeUpdate(missionTime, (missionTime / missionDuration) * 100);

      // Déclenchement de la question programmée à cet instant
      if (onQuestionTrigger) {
        var q = nextQuestionAt(missionTime);
        if (q && !answeredIds.has(q.id) && !questionLocked) {
          triggerQuestion(q);
        }
      }
    });

    // Polling supplémentaire pour détecter les questions de façon fiable
    // même si timeupdate ne tire pas assez fréquemment
    function checkQuestion() {
      if (pausedForQuestion || questionLocked || !video) return;
      var ct = video.currentTime;
      if (ct < lastCurrentTime - 1) {
        loopCount++;
      }
      lastCurrentTime = ct;
      var missionTime = ct + loopCount * loopDuration;
      if (missionTime > missionDuration) missionTime = missionDuration;
      if (onTimeUpdate) onTimeUpdate(missionTime, (missionTime / missionDuration) * 100);
      if (onQuestionTrigger) {
        var q = nextQuestionAt(missionTime);
        if (q && !answeredIds.has(q.id) && !questionLocked) {
          triggerQuestion(q);
        }
      }
    }
    function startQuestionPoll() {
      if (questionPollTimer) return;
      questionPollTimer = setInterval(checkQuestion, 100);
    }
    function stopQuestionPoll() {
      if (questionPollTimer) {
        clearInterval(questionPollTimer);
        questionPollTimer = null;
      }
    }
  }

  // ------------------------------------------------------------------
  // Contrôle lecture
  // ------------------------------------------------------------------
  function play() {
    if (!video) return Promise.reject(new Error("vidéo non initialisée"));
    pausedForQuestion = false;
    return video.play().catch(function (err) {
      console.warn("Lecture vidéo bloquée :", err);
      throw err;
    });
  }

  function pause() {
    if (!video) return;
    pausedForQuestion = true;
    try { video.pause(); } catch (e) {}
  }

  function resume() {
    pausedForQuestion = false;
    return video.play().catch(function (err) {
      console.warn("Reprise lecture bloquée :", err);
    });
  }

  // Empêche de sauter une question non encore répondue : le seek en avant
  // est ramené à l'instant de la question suivante en attente.
  function seekToSeconds(seconds) {
    if (!video) return;
    var target = seconds;
    if (target < 0) target = 0;
    if (target > missionDuration) target = missionDuration;

    var blocking = nextQuestionAt(target);
    if (blocking && !answeredIds.has(blocking.id) && !questionLocked) {
      // On se positionne juste avant la question, qui se déclenchera
      target = blocking.time - 0.5;
      if (target < 0) target = 0;
    }

    try { video.currentTime = target; } catch (e) {}
  }

  function setSpeed(rate) {
    if (video) video.playbackRate = parseFloat(rate) || 1;
  }

  function forcePlay() {
    if (videoFailed) return Promise.reject(new Error("vidéo indisponible"));
    if (!video) return Promise.reject(new Error("vidéo non initialisée"));
    pausedForQuestion = false;
    return video.play().catch(function (err) {
      console.warn("Lecture vidéo bloquée :", err);
      throw err;
    });
  }

  function isFailed() { return videoFailed; }

  function toggleFullscreen() {
    if (!video) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      video.requestFullscreen().catch(function () {});
    }
  }

  function formatTime(seconds) {
    var s = Math.max(0, Math.floor(seconds || 0));
    var m = Math.floor(s / 60);
    s = s % 60;
    return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
  }

  // ------------------------------------------------------------------
  // Questions programmées
  // ------------------------------------------------------------------
  function allQuestionsSorted() {
    return data.questions.slice().sort(function (a, b) { return a.time - b.time; });
  }

  function nextQuestionAt(t) {
    var qs = allQuestionsSorted();
    for (var i = 0; i < qs.length; i++) {
      // Déclenche la question si son temps est atteint (dans une marge de 1 s)
      // ou si on l'a déjà dépassé (rattrapage si timeupdate a râté le créneau).
      if (!answeredIds.has(qs[i].id) && qs[i].time >= t - 1.0 && qs[i].time <= t + 1.0) {
        return qs[i];
      }
    }
    return null;
  }

  function nextUnansweredTime() {
    var qs = allQuestionsSorted();
    var t = null;
    for (var i = 0; i < qs.length; i++) {
      if (!answeredIds.has(qs[i].id)) {
        t = qs[i].time;
        break;
      }
    }
    return t;
  }

  function triggerQuestion(q) {
    pausedForQuestion = true;
    questionLocked = true;
    video.pause();
    if (onQuestionTrigger) onQuestionTrigger(q);
  }

  function questionAnswered(q) {
    answeredIds.add(q.id);
    questionLocked = false;
    pausedForQuestion = false;
  }

  function isLocked() { return questionLocked; }
  function isPausedForQuestion() { return pausedForQuestion; }
  function getAnsweredIds() { return answeredIds; }
  function setAnswered(ids) {
    if (Array.isArray(ids)) ids.forEach(function (id) { answeredIds.add(id); });
  }

  function currentMissionTime() {
    if (!video) return 0;
    var ct = video.currentTime;
    var mt = ct + loopCount * loopDuration;
    return Math.min(mt, missionDuration);
  }

  function getDuration() { return missionDuration; }
  function isPlaying() { return playing && !pausedForQuestion; }

  return {
    init: init,
    play: play,
    forcePlay: forcePlay,
    pause: pause,
    resume: resume,
    seekToSeconds: seekToSeconds,
    setSpeed: setSpeed,
    toggleFullscreen: toggleFullscreen,
    formatTime: formatTime,
    isFailed: isFailed,
    allQuestions: allQuestionsSorted,
    nextQuestionAt: nextQuestionAt,
    nextUnansweredTime: nextUnansweredTime,
    triggerQuestion: triggerQuestion,
    questionAnswered: questionAnswered,
    isLocked: isLocked,
    isPausedForQuestion: isPausedForQuestion,
    getAnsweredIds: getAnsweredIds,
    setAnswered: setAnswered,
    currentMissionTime: currentMissionTime,
    getDuration: getDuration,
    isPlaying: isPlaying
  };
})();
