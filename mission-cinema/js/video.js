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
  var loopCount = 0;          // nombre de boucles effectuées
  var lastCurrentTime = 0;
  var missionDuration = data.video.duration;          // durée totale de la mission
  var loopDuration = data.video.loopDuration;         // durée réelle du fichier (pas de boucle)
  var pausedForQuestion = false;                      // en pause pour une question
  var questionLocked = false;                         // une question est en cours de traitement
  var answeredIds = new Set();                        // questions déjà répondues
  var nextQuestionIndex = 0;                          // index de la prochaine question à afficher (0-based)
  var pauseTime = 0;                                  // temps auquel la vidéo est en pause pour une question
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

    video.addEventListener("play", function () {
        playing = true;
        startQuestionPoll();
        // Sécurité : si la vidéo est censée être en pause pour une question,
        // on force une nouvelle pause puis on gèle currentTime
        if (pausedForQuestion) {
            video.pause();
            video.currentTime = pauseTime;
        }
    });
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
      if (ct < lastCurrentTime - 1) {
        loopCount++;
      }
      lastCurrentTime = ct;

      var missionTime = ct + loopCount * loopDuration;
      if (missionTime > missionDuration) missionTime = missionDuration;

      if (onTimeUpdate) onTimeUpdate(missionTime, (missionTime / missionDuration) * 100);

      checkQuestionAtTime(missionTime);
    });

    // Polling supplémentaire pour détecter les questions de façon fiable
    // même si timeupdate ne tire pas assez fréquemment
    function checkQuestion() {
      if (!video) return;
      var ct = video.currentTime;
      if (ct < lastCurrentTime - 1) {
        loopCount++;
      }
      lastCurrentTime = ct;
      var missionTime = ct + loopCount * loopDuration;
      if (missionTime > missionDuration) missionTime = missionDuration;

      // Si on est en pause pour une question, geler currentTime au moment de la pause
      // et empêcher toute progression. Le poller revient ici toutes les 100 ms pour
      // maintenir la position tant que la question n'est pas répondue.
      // (pause d'abord, puis figer currentTime car video.pause() est asynchrone)
      if (pausedForQuestion) {
        video.pause();
        video.currentTime = pauseTime;
        if (onTimeUpdate) onTimeUpdate(missionTime, (missionTime / missionDuration) * 100);
        return;
      }

      if (questionLocked) return;

      if (onTimeUpdate) onTimeUpdate(missionTime, (missionTime / missionDuration) * 100);
      checkQuestionAtTime(missionTime);
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

  // Déclenche la question si son temps est atteint et qu'elle n'a pas encore été traitée
  function checkQuestionAtTime(t) {
    if (nextQuestionIndex >= data.questions.length) return;
    var q = data.questions[nextQuestionIndex];
    // Pas de borne inférieure : une fois que t dépasse q.time - 0.5, la question
    // reste déclenchable jusqu'à ce qu'elle soit répondue. Cela évite de manquer
    // une question si le poller ne tire pas exactement au bon moment.
    if (!answeredIds.has(q.id) && q.time <= t + 0.5) {
      triggerQuestion(q);
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

    // Si on saute au-delà de la prochaine question non répondue,
    // on se positionne juste avant pour qu'elle se déclenche
    if (nextQuestionIndex < data.questions.length) {
      var nextQ = data.questions[nextQuestionIndex];
      if (!answeredIds.has(nextQ.id) && target > nextQ.time - 0.5) {
        target = nextQ.time - 0.5;
        if (target < 0) target = 0;
      }
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
    // Retourne la prochaine question non répondue dont le temps est <= t + 0.5
    // (permet le rattrapage si le poller a râté le créneau exact)
    if (nextQuestionIndex >= data.questions.length) return null;
    var q = data.questions[nextQuestionIndex];
    if (!answeredIds.has(q.id) && q.time <= t + 0.5) {
      return q;
    }
    return null;
  }

  function nextUnansweredTime() {
    if (nextQuestionIndex < data.questions.length) {
      var q = data.questions[nextQuestionIndex];
      if (!answeredIds.has(q.id)) return q.time;
    }
    // Sinon chercher la prochaine non répondue
    for (var i = 0; i < data.questions.length; i++) {
      if (!answeredIds.has(data.questions[i].id)) {
        return data.questions[i].time;
      }
    }
    return null;
  }

  function triggerQuestion(q) {
    // Marquer comme traitée immédiatement pour éviter les redéclenchements
    answeredIds.add(q.id);
    nextQuestionIndex++;
    pausedForQuestion = true;
    questionLocked = true;
    // Mémoriser le moment de la pause pour geler currentTime dans le poller
    pauseTime = q.time;
    // PAUSE D'ABORD, puis geler currentTime (video.pause() est asynchrone,
    // il faut arrêter la lecture avant de figer currentTime)
    video.pause();
    try { video.currentTime = pauseTime; } catch (e) {}
    video.pause();
    if (onQuestionTrigger) onQuestionTrigger(q);
  }

  function questionAnswered(q) {
    questionLocked = false;
    pausedForQuestion = false;
  }

  function isLocked() { return questionLocked; }
  function isPausedForQuestion() { return pausedForQuestion; }
  function getAnsweredIds() { return answeredIds; }
  function setAnswered(ids) {
    if (Array.isArray(ids)) ids.forEach(function (id) { answeredIds.add(id); });
    // Avancer nextQuestionIndex au-delà des questions déjà répondues
    while (nextQuestionIndex < data.questions.length && answeredIds.has(data.questions[nextQuestionIndex].id)) {
      nextQuestionIndex++;
    }
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