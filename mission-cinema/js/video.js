/* ============================================================================
   MISSION CINÉMA — Contrôleur vidéo et synchronisation des questions
   HTML5 VIDEO + currentTime / pause() / play()
   
   Flux : la vidéo joue normalement depuis t=0.
   À chaque début de question Q_i (t_i) : afficher la bulle Q_i, continuer la vidéo.
   À chaque début de Q_{i+1} (= fin de Q_i) : mettre en pause la vidéo.
   Q6 et Q7 sont automatiques (correctes par défaut) : pas de bulle, pas de pause.
   Clic "Poursuivre" : reprendre à t_{i+1}, afficher la bulle de Q_{i+1}.
   ============================================================================ */

window.VideoController = (function () {
  "use strict";

  var data = window.QUESTIONS_DATA;
  var video = null;

  // État
  var playing = false;
  var loopCount = 0;
  var lastCurrentTime = 0;
  var missionDuration = data.video.duration;
  var loopDuration = data.video.loopDuration;
  var pausedForQuestion = false;
  var questionLocked = false;
  var answeredIds = new Set();
  var nextQuestionIndex = 0;
  var pauseTime = 0;
  var pendingQuestion = null;   // question dont la bulle doit s'afficher après "Poursuivre"
var nextFreezeTime = null;    // instant auquel geler la vidéo (fin de la question courante)
var nextQuestionAfterFreeze = null;  // question à afficher après le gel ("Poursuivre")
  var videoFailed = false;
  var questionPollTimer = null;

  // Callbacks
  var onQuestionTrigger = null;
  var onTimeUpdate = null;
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
    });

    video.addEventListener("timeupdate", function () {
      if (pausedForQuestion || questionLocked) return;

      var ct = video.currentTime;
      if (ct < lastCurrentTime - 1) loopCount++;
      lastCurrentTime = ct;

      var missionTime = ct + loopCount * loopDuration;
      if (missionTime > missionDuration) missionTime = missionDuration;

      if (onTimeUpdate) onTimeUpdate(missionTime, (missionTime / missionDuration) * 100);

      checkQuestionAtTime(missionTime);
    });

    function checkQuestion() {
      if (!video) return;
      var ct = video.currentTime;
      if (ct < lastCurrentTime - 1) loopCount++;
      lastCurrentTime = ct;
      var missionTime = ct + loopCount * loopDuration;
      if (missionTime > missionDuration) missionTime = missionDuration;

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

  // Déclenche la question si son temps est atteint
  function checkQuestionAtTime(t) {
    if (nextQuestionIndex >= data.questions.length) return;
    var q = data.questions[nextQuestionIndex];
    if (answeredIds.has(q.id)) return;

    // Gel de la vidéo à l'heure programmée (fin de la question courante)
    if (nextFreezeTime != null && t >= nextFreezeTime) {
      pausedForQuestion = true;
      questionLocked = true;
      pauseTime = nextFreezeTime;
      pendingQuestion = nextQuestionAfterFreeze || q;
      video.pause();
      try { video.currentTime = pauseTime; } catch (e) {}
      video.pause();
      nextFreezeTime = null;
      nextQuestionAfterFreeze = null;
      return;
    }

    if (q.time > t + 0.5) return;

    // Déclencher la bulle de la question courante, la vidéo continue
    triggerQuestion(q);
  }

  function triggerQuestion(q) {
    answeredIds.add(q.id);
    nextQuestionIndex++;
    pausedForQuestion = false;
    questionLocked = false;
    // Q6 et Q7 affichent une bulle mais la vidéo continue (pas de gel)
    if (q.num === 6 || q.num === 7) {
      nextFreezeTime = null;
      nextQuestionAfterFreeze = null;
    }
    // Programmer le gel à la fin de cette question (stopTime si défini,
    // sinon une seconde avant la question suivante)
    else if (q.stopTime) {
      nextFreezeTime = q.stopTime;
    } else if (nextQuestionIndex < data.questions.length) {
      nextFreezeTime = data.questions[nextQuestionIndex].time - 1.0;
    } else {
      nextFreezeTime = null;
    }
    if (nextQuestionIndex < data.questions.length) {
      nextQuestionAfterFreeze = data.questions[nextQuestionIndex];
    } else {
      nextQuestionAfterFreeze = null;
    }
    if (onQuestionTrigger) onQuestionTrigger(q);
  }

  // Reprend la lecture à l'heure de la question en attente, puis affiche sa bulle
  function handleResume() {
    pausedForQuestion = false;
    questionLocked = false;
    var pending = getPendingQuestion();
    if (pending && pending.time != null) {
      try { video.currentTime = pending.time; } catch (e) {}
    }
    return video.play().catch(function (err) {
      console.warn("Reprise lecture bloquée :", err);
    });
  }

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

  function seekToSeconds(seconds) {
    if (!video) return;
    var target = seconds;
    if (target < 0) target = 0;
    if (target > missionDuration) target = missionDuration;

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

  function allQuestionsSorted() {
    return data.questions.slice().sort(function (a, b) { return a.time - b.time; });
  }

  function nextQuestionAt(t) {
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
    for (var i = 0; i < data.questions.length; i++) {
      if (!answeredIds.has(data.questions[i].id)) {
        return data.questions[i].time;
      }
    }
    return null;
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
    isPlaying: isPlaying,
    handleResume: handleResume,
    getPendingQuestion: function () { return pendingQuestion; },
    clearPendingQuestion: function () { pendingQuestion = null; }
  };
})();