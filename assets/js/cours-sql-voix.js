/* Repères audio et commandes d’origine ; le lecteur est visible et synchronisé. */
(function(){
    var SQL_VOIX_CUES = {
      "welcome": [0.0, 4.44],
      "intro": [4.56, 19.20],
      "intro-bd": [19.33, 41.35],
      "schema-analogie": [41.49, 58.65],
      "intro-sub": [58.77, 76.75],
      "intro-cles": [76.88, 101.70],
      "intro-contraintes": [101.84, 122.65],
      "intro-relations": [122.79, 160.90],
      "c-t1": [161.02, 173.70],
      "c-t2": [173.85, 182.70],
      "c-t3": [182.86, 192.60],
      "c-t4": [192.77, 203.25],
      "ldd": [203.38, 229.35],
      "ldd-construction": [203.38, 229.35],
      "ldd-db-commands": [203.38, 229.35],
      "ldd-create": [229.46, 263.05],
      "ldd-constraints": [263.18, 294.85],
      "ldd-date": [263.18, 294.85],
      "ldd-alter": [294.99, 340.55],
      "ldd-drop": [340.70, 358.30],
      "lmd": [358.43, 375.10],
      "lmd-insert": [375.20, 395.90],
      "lmd-update": [396.10, 410.00],
      "lmd-update-jointure": [410.18, 435.05],
      "lmd-delete": [435.23, 453.45],
      "lmd-select": [453.60, 478.00],
      "lmd-jointure": [478.22, 491.45],
      "j-0": [478.22, 491.45],
      "j-1": [491.65, 504.80],
      "j-2": [491.65, 504.80],
      "j-3": [491.65, 504.80],
      "lmd-aggr": [505.00, 529.00],
      "lmd-groupby": [529.13, 552.55],
      "gb-0": [529.13, 552.55],
      "gb-1": [529.13, 552.55],
      "gb-2": [529.13, 552.55],
      "lmd-having": [552.78, 573.60],
      "hv-0": [552.78, 573.60],
      "hv-1": [552.78, 573.60],
      "hv-2": [552.78, 573.60],
      "lmd-strings": [573.82, 595.80],
      "lmd-dates": [596.02, 613.55],
      "outro": [613.76, 622.03],
      "cours-complet": [0.0, 622.03]
    };
    var voixSqlActive = true;
    var sqlVoixTimer = null;
    var sqlSegFin = 0;
    var sqlAudio = document.createElement("audio");
    sqlAudio.preload = "metadata";
    sqlAudio.src = "../assets/audio/sql-cours.mp3?v=235";
    sqlAudio.id = "sqlGuideAudio"; sqlAudio.controls = true; sqlAudio.setAttribute("aria-label", "Guide-Ligne audio du cours SQL");
    (document.getElementById("sqlGuidePlayer") || document.body).appendChild(sqlAudio);
    window.STISQLVoix = { audio: sqlAudio, reperes: SQL_VOIX_CUES, jouer: function(cle) { jouerVoixSqlCle(cle); } };

    function majBoutonHeroVoix(enLecture) {
      var bHero = document.getElementById("sti-btn-sql-voix-hero");
      if (bHero) {
        var pill = bHero.querySelector(".sti-prog-pill");
        var enPause = !enLecture && sqlAudio && sqlAudio.paused && sqlAudio.currentTime > 0.5 && !sqlAudio.ended && window.__stiVoiceSessionActive;
        bHero.textContent = enLecture
          ? "⏸️ Pause Voix SQL"
          : (enPause ? "▶️ Reprendre Voix SQL" : "🔊 Écouter le cours SQL");
        if (pill) bHero.appendChild(pill);
        bHero.style.background = enLecture ? "#b45309" : "#177245";
      }
    }

    function arreterVoixSqlSTI() {
      if (sqlVoixTimer) { clearTimeout(sqlVoixTimer); sqlVoixTimer = null; }
      sqlSegFin = 0;
      try { sqlAudio.pause(); } catch (e) {}
      majBoutonHeroVoix(false);
    }
    window.arreterVoixSqlSTI = arreterVoixSqlSTI;

    sqlAudio.addEventListener("timeupdate", function () {
      if (sqlAudio.paused) return;
      if (sqlSegFin > 0 && sqlAudio.currentTime >= sqlSegFin - 0.04) {
        arreterVoixSqlSTI();
      }
    });
    sqlAudio.addEventListener("pause", function () {
      majBoutonHeroVoix(false);
    });
    sqlAudio.addEventListener("play", function () {
      majBoutonHeroVoix(true);
    });
    sqlAudio.addEventListener("ended", function () {
      window.__stiVoiceSessionActive = false;
      majBoutonHeroVoix(false);
    });

    function jouerVoixSqlCle(cle) {
      if (sqlVoixTimer) { clearTimeout(sqlVoixTimer); sqlVoixTimer = null; }
      try { sqlAudio.pause(); } catch (e0) {}
      if (!voixSqlActive && cle !== "cours-complet") return;
      var seg = SQL_VOIX_CUES[cle];
      if (!seg) return;
      sqlSegFin = seg[1];
      function lancer() {
        try {
          var rSql = (typeof window.lireVitesseVoixSTI === "function") ? window.lireVitesseVoixSTI() : 1;
          sqlAudio.muted = false;
          sqlAudio.volume = 1.0;
          sqlAudio.playbackRate = rSql;
          sqlAudio.currentTime = seg[0];
          window.__stiActiveVoiceAudio = sqlAudio;
          window.__stiVoiceSessionActive = true;
          var p = sqlAudio.play();
          if (p && p.catch) p.catch(function () {});
          majBoutonHeroVoix(true);
        } catch (e) {}
      }
      if (sqlAudio.readyState >= 1) {
        lancer();
      } else {
        var onMeta = function () {
          sqlAudio.removeEventListener("loadedmetadata", onMeta);
          lancer();
        };
        sqlAudio.addEventListener("loadedmetadata", onMeta);
        try { sqlAudio.load(); } catch (e) {}
      }
    }
    window.jouerVoixSqlCle = jouerVoixSqlCle;

    window.lancerOuCouperVoixCoursSqlComplet = function () {
      if (!sqlAudio.paused) {
        window.__stiVoiceSessionActive = true;
        try { sqlAudio.pause(); } catch (e) {}
        majBoutonHeroVoix(false);
      } else if (sqlAudio.currentTime > 0.5 && !sqlAudio.ended) {
        voixSqlActive = true;
        window.__stiActiveVoiceAudio = sqlAudio;
        window.__stiVoiceSessionActive = true;
        try {
          sqlAudio.playbackRate = (typeof window.lireVitesseVoixSTI === "function") ? window.lireVitesseVoixSTI() : 1;
          var pR = sqlAudio.play();
          if (pR && pR.catch) pR.catch(function () {});
        } catch (e2) {}
        majBoutonHeroVoix(true);
      } else {
        voixSqlActive = true;
        var btns = document.querySelectorAll(".sti-btn-voix-sql");
        for (var i = 0; i < btns.length; i++) {
          btns[i].textContent = "🔊 Voix : ON";
          btns[i].style.background = "#177245";
        }
        jouerVoixSqlCle("cours-complet");
      }
    };

    function cleCourante(famille) {
      if (famille === "gb") {
        var tGb = document.querySelector("#sql-groupby-anim-app .sql-janim-tab.active");
        return "gb-" + (tGb ? (tGb.getAttribute("data-gbex") || "0") : "0");
      }
      if (famille === "hv") {
        var tHv = document.querySelector("#sql-having-anim-app .sql-janim-tab.active");
        return "hv-" + (tHv ? (tHv.getAttribute("data-hvex") || "0") : "0");
      }
      var tJ = document.querySelector("#sql-jointure-anim-app .sql-janim-tab.active");
      return "j-" + (tJ ? (tJ.getAttribute("data-jex") || "0") : "0");
    }

    window.basculerVoixSqlSTI = function (famille) {
      voixSqlActive = !voixSqlActive;
      var btns = document.querySelectorAll(".sti-btn-voix-sql");
      for (var i = 0; i < btns.length; i++) {
        btns[i].textContent = voixSqlActive ? "🔊 Voix : ON" : "🔇 Voix : OFF";
        btns[i].style.background = voixSqlActive ? "#177245" : "#475569";
      }
      if (voixSqlActive) {
        jouerVoixSqlCle(cleCourante(famille || "j"));
      } else {
        arreterVoixSqlSTI();
      }
    };

    document.addEventListener("click", function (ev) {
      var a = ev.target && ev.target.closest ? ev.target.closest("a[href^='#']") : null;
      if (a && voixSqlActive) {
        var idSec = (a.getAttribute("href") || "").slice(1);
        if (SQL_VOIX_CUES[idSec]) {
          jouerVoixSqlCle(idSec);
          return;
        }
      }
      var btn = ev.target && ev.target.closest ? ev.target.closest("button") : null;
      if (!btn) return;
      if (btn.hasAttribute("data-jex")) {
        jouerVoixSqlCle("j-" + btn.getAttribute("data-jex"));
      } else if (btn.id === "janim-btn-play") {
        jouerVoixSqlCle(cleCourante("j"));
      } else if (btn.hasAttribute("data-gbex")) {
        jouerVoixSqlCle("gb-" + btn.getAttribute("data-gbex"));
      } else if (btn.id === "gbanim-btn-play") {
        jouerVoixSqlCle(cleCourante("gb"));
      } else if (btn.hasAttribute("data-hvex")) {
        jouerVoixSqlCle("hv-" + btn.getAttribute("data-hvex"));
      } else if (btn.id === "hvanim-btn-play") {
        jouerVoixSqlCle(cleCourante("hv"));
      }
    });
  })();
