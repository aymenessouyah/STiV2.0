/* ============================================================================
   MISSION CINÉMA — Contrôleur vidéo
   - La vidéo se lance uniquement quand l'utilisateur clique sur Play
   - À chaque question : la vidéo se met en PAUSE et la bulle s'affiche
   - La vidéo reprend uniquement quand l'utilisateur clique sur "Poursuivre"
   - Aucune exécution de SQL élève dans le navigateur
   ============================================================================ */

window.VideoController = (function () {
  "use strict";

  var data = window.QUESTIONS_DATA;
  var video = null;

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
  var pendingQuestion = null;
  var nextFreezeTime = null;
  var nextQuestionAfterFreeze = null;
  var videoFailed = false;
  var questionPollTimer = null;
  var resumeGraceUntil = 0; // bloquer le déclenchement des questions juste après une reprise

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
    });
    video.addEventListener("pause", function () {
      playing = false;
      stopQuestionPoll();
    });
    video.addEventListener("ended", function () {
      stopQuestionPoll();
      if (onEnded) onEnded();
    });
    video.addEventListener("error", function () {
      videoFailed = true;
      if (onError) onError(video.error);
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
  }

  function startQuestionPoll() {
    if (questionPollTimer) return;
    questionPollTimer = setInterval(function () {
      if (!video) return;
      if (pausedForQuestion || questionLocked) return;
      var ct = video.currentTime;
      if (ct < lastCurrentTime - 1) loopCount++;
      lastCurrentTime = ct;
      var missionTime = ct + loopCount * loopDuration;
      if (missionTime > missionDuration) missionTime = missionDuration;
      if (onTimeUpdate) onTimeUpdate(missionTime, (missionTime / missionDuration) * 100);
      checkQuestionAtTime(missionTime);
    }, 100);
  }

  function stopQuestionPoll() {
    if (questionPollTimer) {
      clearInterval(questionPollTimer);
      questionPollTimer = null;
    }
  }

  function checkQuestionAtTime(t) {
    if (nextQuestionIndex >= data.questions.length) return;
    if (Date.now() < resumeGraceUntil) return; // délai de grâce après reprise
    var q = data.questions[nextQuestionIndex];
    if (answeredIds.has(q.id)) return;

    if (nextFreezeTime != null && t >= nextFreezeTime) {
      pausedForQuestion = true;
      questionLocked = true;
      pauseTime = nextFreezeTime;
      pendingQuestion = nextQuestionAfterFreeze || q;
      video.pause();
      try { video.currentTime = pauseTime; } catch (e) {}
      nextFreezeTime = null;
      nextQuestionAfterFreeze = null;
      return;
    }

    if (q.time > t + 0.5) return;

    triggerQuestion(q);
  }

  function triggerQuestion(q) {
    answeredIds.add(q.id);
    nextQuestionIndex++;
    pausedForQuestion = false;
    questionLocked = false;

    if (q.num === 6 || q.num === 7) {
      nextFreezeTime = null;
      nextQuestionAfterFreeze = null;
    } else if (q.stopTime) {
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

  function forcePlay() {
    if (videoFailed) return Promise.reject(new Error("vidéo indisponible"));
    if (!video) return Promise.reject(new Error("vidéo non initialisée"));
    pausedForQuestion = false;
    video.muted = false;
    return video.play().catch(function (err) {
      console.warn("Lecture bloquée avec son :", err);
      video.muted = true;
      return video.play().catch(function (err2) {
        console.warn("Lecture bloquée en muet :", err2);
        throw err2;
      });
    });
  }

  function handleResume() {
    pausedForQuestion = false;
    questionLocked = false;
    // Délai de grâce : pas de déclenchement de question pendant 1 seconde après reprise
    resumeGraceUntil = Date.now() + 1000;
    var pending = getPendingQuestion();
    if (pending && pending.time != null) {
      try { video.currentTime = Math.max(0, pending.time - 0.5); } catch (e) {}
    }
    video.muted = false;
    return video.play().catch(function (err) {
      console.warn("Reprise bloquée avec son :", err);
      video.muted = true;
      return video.play().catch(function (err2) {
        console.warn("Reprise bloquée en muet :", err2);
        throw err2;
      });
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
      console.warn("Resume bloqué :", err);
      video.muted = true;
      return video.play();
    });
  }

  function seekToSeconds(seconds) {
    if (!video) return;
    var target = seconds < 0 ? 0 : seconds;
    if (target > missionDuration) target = missionDuration;
    try { video.currentTime = target; } catch (e) {}
  }

  function setSpeed(rate) {
    if (video) video.playbackRate = parseFloat(rate) || 1;
  }

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
  function getPendingQuestion() { return pendingQuestion; }
  function clearPendingQuestion() { pendingQuestion = null; }

  return {
    init: init,
    forcePlay: forcePlay,
    handleResume: handleResume,
    pause: pause,
    resume: resume,
    seekToSeconds: seekToSeconds,
    setSpeed: setSpeed,
    toggleFullscreen: toggleFullscreen,
    formatTime: formatTime,
    questionAnswered: questionAnswered,
    isLocked: isLocked,
    isPausedForQuestion: isPausedForQuestion,
    getAnsweredIds: getAnsweredIds,
    setAnswered: setAnswered,
    currentMissionTime: currentMissionTime,
    getDuration: getDuration,
    isPlaying: isPlaying,
    getPendingQuestion: getPendingQuestion,
    clearPendingQuestion: clearPendingQuestion
  };
})();