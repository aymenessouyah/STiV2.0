/* ============================================================================
   MISSION CINÉMA — Moteur des questions interactives
   Rendu, validation, correction, score et sauvegarde locale (localStorage).
   Aucune requête SQL saisie par l'élève n'est jamais exécutée dans le navigateur :
   la correction est une comparaison pédagogique avec la réponse officielle.
   ============================================================================ */

window.QuizController = (function () {
  "use strict";

  var data = window.QUESTIONS_DATA;
  var video = window.VideoController;

// ----------------------------- état -----------------------------
var STORAGE_KEY = "stiv2_mission_cinema_v1";
var state = {
    nom: "",
    startedAt: null,
    answers: {},     // id -> {reponse, correct, type, declared, time}
    currentQuestion: null,
    score: 0,
    total: 0
};

// ----------------------------- feedback audio (Web Audio API) -----------------------------
var audioCtx = null;
var audioEnabled = true;

function ensureAudio() {
    if (!audioCtx) {
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            audioCtx = null;
        }
    }
    return audioCtx;
}

function playTone(freq, duration, type) {
    if (!audioEnabled) return;
    var ctx = ensureAudio();
    if (!ctx) return;
    try {
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = type || "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration / 1000);
    } catch (e) {}
}

function playCorrectSound() {
    playTone(800, 150, "sine");
    setTimeout(function () { playTone(1000, 150, "sine"); }, 120);
}

function playIncorrectSound() {
    playTone(300, 300, "sawtooth");
}

function toggleAudio() {
    audioEnabled = !audioEnabled;
    return audioEnabled;
}

  var callbacks = {
    onValidate: null,   // function(result)
    onResume: null,     // function() après correction, relance la vidéo
    onAllDone: null     // function() quand toutes les questions sont traitées
  };
  var currentCard = null; // élément DOM de la question affichée (pour la case de déclaration)

  // ----------------------------- normalisation SQL -----------------------------
  function normaliserSQL(sql) {
    if (sql == null) return "";
    return String(sql)
      .toLowerCase()
      .replace(/;/g, " ")
      .replace(/--[^\n]*/g, " ")
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .replace(/[\s\u00A0]+/g, " ")
      .replace(/\(/g, " ( ")
      .replace(/\)/g, " ) ")
      .replace(/,\s*/g, ", ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function sqlMatch(reponse, refs) {
    var r = normaliserSQL(reponse);
    if (r === "") return false;
    for (var i = 0; i < refs.length; i++) {
      if (r === normaliserSQL(refs[i])) return true;
    }
    return false;
  }

  function motsClesPresent(reponse, mots) {
    var r = normaliserSQL(reponse);
    for (var i = 0; i < mots.length; i++) {
      if (r.indexOf(String(mots[i]).toLowerCase()) === -1) return false;
    }
    return true;
  }

  // ----------------------------- données de référence des tables (Q40-45) -----------------------------
  var TABLE_DATA = {
    40: {titre: "Table FILM — après ajout de paysOrigine (DEFAULT 'Inconnue')",
         colonnes: ["idFilm","titre","genre","annee","duree","budget","idReal","paysOrigine"],
         lignes: [
           [1,"Inception","Science-fiction",2010,148,160000000,1,"Inconnue"],
           [2,"Interstellar","Science-fiction",2014,169,165000000,1,"Inconnue"],
           [3,"The Dark Knight","Action",2008,152,185000000,1,"Inconnue"],
           [4,"Les Infiltrés","Action",2006,151,90000000,2,"Inconnue"],
           [5,"Shutter Island","Thriller",2010,138,80000000,2,"Inconnue"],
           [6,"OSS 117","Comédie",2006,99,14000000,3,"Inconnue"],
           [7,"Tenet","Action",null,null,0,1,"Inconnue"]
         ]},
    41: {titre: "Table FILM — nouveau DEFAULT 'Tunisie' (film test inséré)",
         colonnes: ["idFilm","titre","genre","annee","duree","budget","idReal","paysOrigine"],
         lignes: [
           [1,"Inception","Science-fiction",2010,148,160000000,1,"Inconnue"],
           [2,"Interstellar","Science-fiction",2014,169,165000000,1,"Inconnue"],
           [3,"The Dark Knight","Action",2008,152,185000000,1,"Inconnue"],
           [4,"Les Infiltrés","Action",2006,151,90000000,2,"Inconnue"],
           [5,"Shutter Island","Thriller",2010,138,80000000,2,"Inconnue"],
           [6,"OSS 117","Comédie",2006,99,14000000,3,"Inconnue"],
           [7,"Tenet","Action",null,null,0,1,"Inconnue"],
           [8,"Film test","Drame",null,null,null,1,"Tunisie"]
         ]},
    42: {titre: "Table ACTEUR — ligne idActeur = 8",
         colonnes: ["idActeur","nom","nationalite"],
         lignes: [[8,"Hathaway","Non precisee"]]},
    43: {titre: "Table projection_test — après UPDATE cascade (idFilm 7→70)",
         colonnes: ["idProj","idFilm","salle"],
         lignes: [[101,70,"Salle A"],[102,1,"Salle B"]]},
    44: {titre: "Table projection_test — après DELETE cascade (idFilm 70 supprimé)",
         colonnes: ["idProj","idFilm","salle"],
         lignes: [[102,1,"Salle B"]]},
    45: {titre: "Résultat de la requête — à remplir",
         colonnes: ["idProj","idFilm","titre"],
         lignes: []}
  };

  function renderTableEditor(parent, titre, colonnes, lignes, onCapture) {
    var box = document.createElement("div");
    box.className = "table-editor";

    var h = document.createElement("h4");
    h.textContent = titre;
    box.appendChild(h);

    var tbl = document.createElement("table");
    tbl.className = "result-table";
    var thead = document.createElement("thead");
    var trh = document.createElement("tr");
    colonnes.forEach(function(c){
      var th = document.createElement("th");
      th.textContent = c;
      trh.appendChild(th);
    });
    thead.appendChild(trh);
    tbl.appendChild(thead);

    var tbody = document.createElement("tbody");
    lignes.forEach(function(lig, ri){
      var tr = document.createElement("tr");
      colonnes.forEach(function(c, ci){
        var td = document.createElement("td");
        var input = document.createElement("input");
        input.type = "text";
        input.className = "table-cell";
        input.value = lig[ci] == null ? "" : String(lig[ci]);
        input.dataset.r = ri;
        input.dataset.c = ci;
        td.appendChild(input);
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    tbl.appendChild(tbody);
    box.appendChild(tbl);

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn valider";
    btn.textContent = "Valider le tableau";
    btn.disabled = true;
    btn.onclick = function(){
      var lignesSaisies = {};
      var inputs = tbl.querySelectorAll("input.table-cell");
      inputs.forEach(function(inp){
        var r = parseInt(inp.dataset.r,10);
        var c = parseInt(inp.dataset.c,10);
        if(!lignesSaisies[r]) lignesSaisies[r] = {};
        lignesSaisies[r][c] = inp.value;
      });
      var keys = Object.keys(lignesSaisies).sort(function(a,b){return parseInt(a)-parseInt(b);});
      var saisie = [];
      keys.forEach(function(r){
        var lig = lignesSaisies[r];
        var row = [];
        for(var c=0;c<colonnes.length;c++){
          row.push(lig[c] != null ? lig[c] : "");
        }
        saisie.push(row.join(" | "));
      });
      var texte = colonnes.join(" | ") + "\n" + saisie.join("\n");
      if(onCapture) onCapture(texte, saisie);
    };
    box.appendChild(btn);

    var delaiMsgTbl = document.createElement("span");
    delaiMsgTbl.className = "q-delai";
    delaiMsgTbl.textContent = "Réponse disponible dans 5 secondes…";
    box.appendChild(delaiMsgTbl);

    var secondesRestantesTbl = 5;
    var timerDelaiTbl = setInterval(function () {
      secondesRestantesTbl--;
      if (secondesRestantesTbl > 0) {
        delaiMsgTbl.textContent = "Réponse disponible dans " + secondesRestantesTbl + " secondes…";
      } else {
        clearInterval(timerDelaiTbl);
        btn.disabled = false;
        delaiMsgTbl.textContent = "";
      }
    }, 1000);

    var info = document.createElement("p");
    info.className = "q-hint";
    info.textContent = "Modifiez les cellules puis cliquez sur Valider le tableau pour saisir vos données.";
    box.appendChild(info);

    parent.appendChild(box);
  }

  // ----------------------------- rendu question -----------------------------
  function renderQuestion(q, container) {
    container.innerHTML = "";
    var wrap = document.createElement("div");
    wrap.className = "q-card";
    currentCard = wrap;

    var meta = document.createElement("div");
    meta.className = "q-meta";
    meta.innerHTML = "<span class='q-num'>Question " + q.num + "</span>" +
                     "<span class='q-type'>" + typeLabel(q.type) + "</span>";
    wrap.appendChild(meta);

    var enonce = document.createElement("div");
    enonce.className = "q-enonce";
    enonce.innerHTML = q.enonce;
    wrap.appendChild(enonce);

    // ---- A. QCM (non utilisé par la série, structure préparée) ----
    // ---- B. Vrai/Faux (non utilisé par la série) ----

    // ---- C. Réponse SQL ----
    if (q.type === "sql") {
      var ta = document.createElement("textarea");
      ta.placeholder = "Écrivez votre requête SQL ici…";
      ta.spellcheck = false;
      var saved = state.answers[q.id];
      if (saved && saved.reponse != null) ta.value = saved.reponse;
      wrap.appendChild(ta);

      var hint = document.createElement("p");
      hint.className = "q-hint";
      hint.textContent = "Comparaison pédagogique avec la réponse officielle (espaces, retours à la ligne et casse ignorés).";
      wrap.appendChild(hint);

      // Tableau éditable pour les questions 40 à 44
      if (q.num >= 40 && TABLE_DATA[q.num]) {
        var td = TABLE_DATA[q.num];
        renderTableEditor(wrap, td.titre, td.colonnes, td.lignes, function(texte, saisie){
          var saved = state.answers[q.id];
          if (!saved) saved = {};
          saved.reponseTableau = texte;
          saved.saisieTableau = saisie;
          state.answers[q.id] = saved;
        });
      }

      var ligne = document.createElement("div");
      ligne.className = "q-actions";
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn valider";
      btn.textContent = "Valider ma réponse";
      btn.disabled = true;
      btn.onclick = function () { validateSQL(q, ta.value); };
      ligne.appendChild(btn);

      var delaiMsg = document.createElement("span");
      delaiMsg.className = "q-delai";
      delaiMsg.textContent = "Réponse disponible dans 5 secondes…";
      ligne.appendChild(delaiMsg);

      var secondesRestantes = 5;
      var timerDelai = setInterval(function () {
        secondesRestantes--;
        if (secondesRestantes > 0) {
          delaiMsg.textContent = "Réponse disponible dans " + secondesRestantes + " secondes…";
        } else {
          clearInterval(timerDelai);
          btn.disabled = false;
          delaiMsg.textContent = "";
        }
      }, 1000);

      var chk = document.createElement("label");
      chk.className = "q-declare";
      var cb = document.createElement("input"); cb.type = "checkbox";
      chk.appendChild(cb);
      chk.appendChild(document.createTextNode(" Ma requête produit le même résultat que la référence (autre écriture valide)"));
      cb.onchange = function () {
        if (cb.checked) {
          btn.textContent = "Valider comme équivalente";
        } else {
          btn.textContent = "Valider ma réponse";
        }
      };
      if (saved && saved.declared) {
        cb.checked = true;
        btn.textContent = "Valider comme équivalente";
      }
      ligne.appendChild(chk);
      wrap.appendChild(ligne);
    }

    // ---- D. Prévoir le résultat d'une requête ----
    if (q.type === "resultat") {
      // Pour Q45 : le tableau éditable est la zone de saisie du résultat
      if (q.num >= 45 && TABLE_DATA[q.num]) {
        var td = TABLE_DATA[q.num];
        renderTableEditor(wrap, td.titre, td.colonnes, td.lignes, function(texte, saisie){
          var saved = state.answers[q.id];
          if (!saved) saved = {};
          saved.reponse = texte;
          state.answers[q.id] = saved;
        });
      } else {
        var ta2 = document.createElement("textarea");
        ta2.placeholder = "Décrivez le résultat attendu (lignes et colonnes)…";
        ta2.spellcheck = false;
        var saved2 = state.answers[q.id];
        if (saved2 && saved2.reponse != null) ta2.value = saved2.reponse;
        wrap.appendChild(ta2);
      }

      var ligne2 = document.createElement("div");
      ligne2.className = "q-actions";
      var btn2 = document.createElement("button");
      btn2.type = "button";
      btn2.className = "btn valider";
      btn2.textContent = "Valider ma réponse";
      btn2.disabled = true;
      btn2.onclick = function () {
        var saved = state.answers[q.id];
        var reponse = saved && saved.reponse != null ? saved.reponse : "";
        validateResult(q, reponse);
      };
      ligne2.appendChild(btn2);

      var delaiMsg2 = document.createElement("span");
      delaiMsg2.className = "q-delai";
      delaiMsg2.textContent = "Réponse disponible dans 5 secondes…";
      ligne2.appendChild(delaiMsg2);

      var secondesRestantes2 = 5;
      var timerDelai2 = setInterval(function () {
        secondesRestantes2--;
        if (secondesRestantes2 > 0) {
          delaiMsg2.textContent = "Réponse disponible dans " + secondesRestantes2 + " secondes…";
        } else {
          clearInterval(timerDelai2);
          btn2.disabled = false;
          delaiMsg2.textContent = "";
        }
      }, 1000);
      wrap.appendChild(ligne2);
    }

    container.appendChild(wrap);
  }

  function typeLabel(type) {
    if (type === "sql") return "Réponse SQL";
    if (type === "resultat") return "Prévoir le résultat";
    return "Question";
  }

  // ----------------------------- validation -----------------------------
  function validateSQL(q, reponse) {
    var btnDeclare = currentCard && currentCard.querySelector(".q-declare input");
    var declared = btnDeclare && btnDeclare.checked;
    var correct = false;
    var motif = "";

    if (reponse == null || String(reponse).trim() === "") {
      correct = false;
      motif = "Réponse vide : aucune requête n'a été saisie.";
    } else if (sqlMatch(reponse, q.refs)) {
      correct = true;
      motif = "Votre requête correspond à l'une des écritures de référence.";
    } else if (declared) {
      correct = true;
      motif = "Votre requête a été acceptée comme équivalente à l'une des écritures de référence (autre écriture valide).";
    } else {
      correct = false;
      motif = "Votre requête ne correspond pas (textuellement) aux écritures de référence. Consultez la correction ci-dessous.";
    }

    if (correct) playCorrectSound(); else playIncorrectSound();
    record(q, reponse, correct, declared, motif);
    showCorrection(q, correct, motif);
  }

  function validateResult(q, reponse) {
    var correct = false;
    var motif = "";
    if (reponse == null || String(reponse).trim() === "") {
      correct = false;
      motif = "Réponse vide : aucun résultat n'a été indiqué.";
    } else if (motsClesPresent(reponse, q.attendu)) {
      correct = true;
      motif = "Votre réponse contient les valeurs attendues : " + q.attendu.join(", ") + ".";
    } else {
      correct = false;
      motif = "Les valeurs attendues n'ont pas été retrouvées dans votre réponse.";
    }
    if (correct) playCorrectSound(); else playIncorrectSound();
    record(q, reponse, correct, false, motif);
    showCorrection(q, correct, motif);
  }

  function record(q, reponse, correct, declared, motif) {
    if (state.answers[q.id]) return; // une question ne se traite qu'une fois
    state.answers[q.id] = {
      reponse: reponse || "",
      correct: !!correct,
      declared: !!declared,
      type: q.type,
      time: video ? video.currentMissionTime() : 0
    };
    if (correct) state.score++;
    state.total++;
    persist();
    if (callbacks.onValidate) callbacks.onValidate({ question: q, correct: correct, score: state.score, total: state.total });

    // Toutes les questions traitées ?
    var all = data.questions;
    var treated = 0;
    for (var k = 0; k < all.length; k++) if (state.answers[all[k].id]) treated++;
    if (treated >= all.length && callbacks.onAllDone) callbacks.onAllDone();
  }

  // Met à jour une réponse lors du mode révision (question déjà traitée)
  function reviseQuestion(q, reponse, correct, declared, motif) {
    var prev = state.answers[q.id];
    if (!prev) return false;
    var wasCorrect = prev.correct;
    state.answers[q.id] = {
      reponse: reponse || "",
      correct: !!correct,
      declared: !!declared,
      type: q.type,
      time: video ? video.currentMissionTime() : 0,
      revised: true
    };
    if (correct && !wasCorrect) state.score++;   // nouveau bon point
    if (!correct && wasCorrect) state.score--;   // point perdu
    persist();
    if (callbacks.onValidate) callbacks.onValidate({ question: q, correct: correct, score: state.score, total: state.total });
    return true;
  }

  // ----------------------------- correction -----------------------------
  function showCorrection(q, correct, motif) {
    var container = document.getElementById("zone-interaction");
    if (!container) return;
    // La correction s'ajoute sous la question déjà rendue dans le panneau

    var badge = document.createElement("div");
    badge.className = "correction-badge " + (correct ? "ok" : "ko");
    badge.textContent = correct ? "  RÉPONSE CORRECTE" : "  RÉPONSE INCORRECTE";
    container.appendChild(badge);

    if (motif) {
      var p = document.createElement("p");
      p.className = "correction-motif";
      p.textContent = motif;
      container.appendChild(p);
    }

    // Votre réponse
    var reponse = state.answers[q.id] && state.answers[q.id].reponse;
    if (reponse && String(reponse).trim() !== "") {
      var blocRep = document.createElement("div");
      blocRep.className = "correction-bloc";
      blocRep.innerHTML = "<strong>Votre réponse :</strong><pre>" + echapperHtml(String(reponse)) + "</pre>";
      container.appendChild(blocRep);
    }

    // Référence
    var blocRef = document.createElement("div");
    blocRef.className = "correction-bloc";
    var refHtml = "<strong>Réponse de référence (correction officielle) :</strong>";
    if (q.type === "sql") {
      refHtml += "<pre><code>" + q.refs.map(function (r) { return echapperHtml(r); }).join("\n\n---\n\n") + "</code></pre>";
    } else {
      refHtml += "<pre><code>" + echapperHtml(q.enonce.replace(/<[^>]*>/g, "").trim()) + "</code></pre>";
    }
    blocRef.innerHTML = refHtml;
    container.appendChild(blocRef);

    // Résultat de référence (tableau)
    if (q.resultat) {
      var t = document.createElement("table");
      t.className = "result-table";
      var thead = document.createElement("thead");
      var trh = document.createElement("tr");
      q.resultat.colonnes.forEach(function (c) {
        var th = document.createElement("th");
        th.textContent = c;
        trh.appendChild(th);
      });
      thead.appendChild(trh);
      t.appendChild(thead);
      var tbody = document.createElement("tbody");
      q.resultat.lignes.forEach(function (ligne) {
        var tr = document.createElement("tr");
        ligne.forEach(function (val) {
          var td = document.createElement("td");
          td.textContent = val === null ? "NULL" : String(val);
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      t.appendChild(tbody);
      var cap = document.createElement("div");
      cap.className = "result-caption";
      cap.textContent = "Résultat de référence :";
      container.appendChild(cap);
      container.appendChild(t);
    }

    // Explication
    if (q.explication) {
      var expl = document.createElement("div");
      expl.className = "correction-explication";
      expl.innerHTML = "<strong>À retenir :</strong> " + q.explication;
      container.appendChild(expl);
    }
    if (q.note) {
      var note = document.createElement("div");
      note.className = "correction-note";
      note.innerHTML = "<strong>Note :</strong> " + q.note;
      container.appendChild(note);
    }

    // Bouton continuer
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn continuer";
    btn.textContent = "Poursuivre";
    btn.onclick = function () {
      video.questionAnswered(q);
      hideCorrection();
      if (callbacks.onResume) callbacks.onResume();
    };
    container.appendChild(btn);
  }

  function hideCorrection() {
    var container = document.getElementById("zone-interaction");
    if (container) container.innerHTML = "";
    document.getElementById("panneau-question")?.classList.add("cacher");
    document.getElementById("zone-interaction")?.classList.add("cacher");
  }

  function echapperHtml(texte) {
    return String(texte)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // ----------------------------- persistence -----------------------------
  function persist() {
    try {
      var payload = {
        nom: state.nom,
        startedAt: state.startedAt,
        answers: state.answers,
        score: state.score,
        total: state.total
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      // localStorage indisponible : on continue sans sauvegarde
    }
  }

  function marquezQuestionsAuto() {
    // Q6 et Q7 : correctes par défaut, non posées à l'élève
    [6, 7].forEach(function (id) {
      if (!state.answers[id]) {
        state.answers[id] = {
          reponse: "Question automatique (pré-validée)",
          correct: true,
          type: "sql",
          declared: false,
          time: 0
        };
        state.score++;
      }
    });
    var ids = Object.keys(state.answers);
    video.setAnswered(ids);
  }

  function chargerSauvegarde() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var p = JSON.parse(raw);
      state.nom = p.nom || "";
      state.startedAt = p.startedAt || null;
      state.answers = p.answers || {};
      state.score = p.score || 0;
      state.total = p.total || 0;
      marquezQuestionsAuto();
      return p;
    } catch (e) {
      return null;
    }
  }

  function resetProgress() {
    state = { nom: state.nom, startedAt: null, answers: {}, currentQuestion: null, score: 0, total: 0 };
    video.setAnswered([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  }

  function getScore() { return state.score; }
  function getTotal() { return data.questions.length; }
  function getPct() { var t = getTotal(); return t ? Math.round((state.score / t) * 100) : 0; }
  function getPoints() { return state.score * 100; }
  function getNiveau() { return Math.floor(state.score / 5) + 1; }
  function getAnswers() { return state.answers; }
  function getNom() { return state.nom; }
  function setNom(n) {
    state.nom = n;
    if (!state.startedAt) state.startedAt = new Date().toISOString();
    marquezQuestionsAuto();
    persist();
  }
  function isAnswered(id) { return !!state.answers[id]; }
  function isComplete() {
    for (var i = 0; i < data.questions.length; i++) {
      if (!state.answers[data.questions[i].id]) return false;
    }
    return true;
  }

  // ----------------------------- callbacks -----------------------------
  function on(cb) {
    if (cb.onValidate) callbacks.onValidate = cb.onValidate;
    if (cb.onResume) callbacks.onResume = cb.onResume;
    if (cb.onAllDone) callbacks.onAllDone = cb.onAllDone;
  }

// ----------------------------- nature de l'échec par question -----------------------------
function getFailureNature(num) {
    // Retourne la nature de l'opération pour une question donnée, en français
    if (num === 1) return "création de tables";
    if (num >= 2 && num <= 5) return "modification de structure de table";
    if (num >= 6 && num <= 7) return "insertion de données";
    if (num >= 8 && num <= 12) return "mise à jour de données";
    if (num >= 13 && num <= 15) return "suppression de données";
    if (num >= 16 && num <= 39) return "requête de sélection";
    if (num >= 40 && num <= 44) return "contraintes et clés étrangères";
    if (num === 45) return "prévision de résultat";
    return "opération SQL";
}

// ----------------------------- indices contextuels par question -----------------------------
function getHints(q) {
    var hints = [];
    var nature = getFailureNature(q.num);

    if (nature === "création de tables") {
      hints.push("N'oubliez pas les clés primaires (PRIMARY KEY) et étrangères (FOREIGN KEY).");
      hints.push("Les contraintes CHECK s'écrivent dans la définition de la colonne.");
    } else if (nature === "modification de structure de table") {
      hints.push("Utilisez ALTER TABLE avec ADD, DROP COLUMN ou MODIFY.");
      hints.push("Vérifiez le nom exact de la table et de la colonne.");
    } else if (nature === "insertion de données") {
      hints.push("Respectez l'ordre des colonnes dans INSERT INTO.");
      hints.push("Les valeurs texte doivent être entre guillemets simples.");
    } else if (nature === "mise à jour de données") {
      hints.push("UPDATE nécessite une clause WHERE pour cibler les lignes.");
      hints.push("Pour plusieurs tables, utilisez la syntaxe multi-table UPDATE.");
    } else if (nature === "suppression de données") {
      hints.push("DELETE supprime des lignes, DROP TABLE supprime toute la table.");
      hints.push("WHERE est obligatoire pour ne pas tout supprimer.");
    } else if (nature === "requête de sélection") {
      hints.push("SELECT ... FROM ... WHERE pour filtrer les résultats.");
      hints.push("GROUP BY avec HAVING pour filtrer après agrégation.");
    } else if (nature === "contraintes et clés étrangères") {
      hints.push("DEFAULT fournit une valeur par défaut lors de l'insertion.");
      hints.push("ON UPDATE CASCADE / ON DELETE CASCADE propagent les modifications.");
    } else if (nature === "prévision de résultat") {
      hints.push("Tracez pas à pas les opérations sur les données.");
      hints.push("Vérifiez les jointures et les filtres avant de donner le résultat.");
    }

    return hints;
}

// ----------------------------- questions par chapitre -----------------------------
function getQuestionsByChapter(chapterId) {
    return data.questions.filter(function (q) { return q.chapter === chapterId; });
}

// ----------------------------- état révision avancée -----------------------------
var revisionAdvState = {
    active: false,
    chapterId: null,
    questions: [],
    index: 0,
    score: 0,
    maxScore: 0,
    attempts: {},  // id -> {ok: boolean, tries: number}
    startedAt: null
};

function startAdvancedRevision(chapterId) {
    var qs = chapterId ? getQuestionsByChapter(chapterId) : data.questions.filter(function(q) {
        var a = state.answers[q.id];
        return a && !a.correct;
    });

    if (qs.length === 0) return null;

    revisionAdvState.active = true;
    revisionAdvState.chapterId = chapterId;
    revisionAdvState.questions = qs;
    revisionAdvState.index = 0;
    revisionAdvState.score = 0;
    revisionAdvState.maxScore = qs.length;
    revisionAdvState.attempts = {};
    revisionAdvState.startedAt = new Date().toISOString();

    return qs[0];
}

function getCurrentAdvRevisionQuestion() {
    if (!revisionAdvState.active) return null;
    if (revisionAdvState.index >= revisionAdvState.questions.length) return null;
    return revisionAdvState.questions[revisionAdvState.index];
}

function recordAdvRevisionAttempt(qId, correct, tries) {
    if (!revisionAdvState.active) return;
    revisionAdvState.attempts[qId] = { ok: correct, tries: tries };
    if (correct && !revisionAdvState.attempts[qId].ok) {
      revisionAdvState.score++;
    }
}

function nextAdvRevisionQuestion() {
    if (!revisionAdvState.active) return null;
    revisionAdvState.index++;
    if (revisionAdvState.index >= revisionAdvState.questions.length) {
      revisionAdvState.active = false;
      return null;
    }
    return revisionAdvState.questions[revisionAdvState.index];
}

function exitAdvancedRevision() {
    revisionAdvState.active = false;
    revisionAdvState.chapterId = null;
    revisionAdvState.questions = [];
    revisionAdvState.index = 0;
    revisionAdvState.score = 0;
    revisionAdvState.maxScore = 0;
    revisionAdvState.attempts = {};
    revisionAdvState.startedAt = null;
}

function getAdvRevisionStats() {
    if (!revisionAdvState.active) return null;
    var total = revisionAdvState.questions.length;
    var revised = Object.keys(revisionAdvState.attempts).length;
    var ok = 0;
    Object.values(revisionAdvState.attempts).forEach(function(a) { if (a.ok) ok++; });
    return {
      total: total,
      revised: revised,
      ok: ok,
      score: revisionAdvState.score,
      maxScore: revisionAdvState.maxScore,
      pct: total ? Math.round((revisionAdvState.score / revisionAdvState.maxScore) * 100) : 0
    };
}

  // ----------------------------- narration vocale du bilan -----------------------------
  function speakBilanSummary() {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    var total = data.questions.length;
    var score = state.score;
    var faux = [];
    data.questions.forEach(function (q) {
      var a = state.answers[q.id];
      if (a && !a.correct) faux.push(q);
    });

    var texte = "";
    if (faux.length === 0) {
      texte = "Mission terminée avec un score parfait de " + score + " sur " + total + ". Félicitations, toutes les réponses sont correctes.";
    } else {
      texte = "Mission terminée. Votre score est de " + score + " sur " + total + ". " + faux.length + " réponse" + (faux.length > 1 ? "s" : "") + " incorrecte" + (faux.length > 1 ? "s" : "") + ".";

      faux.forEach(function (q, index) {
        var nature = getFailureNature(q.num);
        if (index === 0) {
          texte += " La première erreur porte sur la question " + q.num + ", " + nature + ".";
        } else if (index === faux.length - 1) {
          texte += " La dernière erreur concerne la question " + q.num + ", " + nature + ".";
        } else {
          texte += " La question " + q.num + ", " + nature + ".";
        }
      });
    }

    var utterance = new SpeechSynthesisUtterance(texte);
    utterance.lang = "fr-FR";
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    window.speechSynthesis.speak(utterance);
  }

  return {
    renderQuestion: renderQuestion,
    validateSQL: validateSQL,
    validateResult: validateResult,
    showCorrection: showCorrection,
    hideCorrection: hideCorrection,
    persist: persist,
    chargerSauvegarde: chargerSauvegarde,
    resetProgress: resetProgress,
    getScore: getScore,
    getTotal: getTotal,
    getPct: getPct,
    getPoints: getPoints,
    getNiveau: getNiveau,
    getAnswers: getAnswers,
    getNom: getNom,
    setNom: setNom,
    isAnswered: isAnswered,
    isComplete: isComplete,
    typeLabel: typeLabel,
    on: on,
    normaliserSQL: normaliserSQL,
    toggleAudio: toggleAudio,
    isAudioEnabled: function () { return audioEnabled; },
    reviseQuestion: reviseQuestion,
    playCorrectSound: playCorrectSound,
    playIncorrectSound: playIncorrectSound,
    speakBilanSummary: speakBilanSummary,
    getHints: getHints,
    getQuestionsByChapter: getQuestionsByChapter,
    startAdvancedRevision: startAdvancedRevision,
    getCurrentAdvRevisionQuestion: getCurrentAdvRevisionQuestion,
    recordAdvRevisionAttempt: recordAdvRevisionAttempt,
    nextAdvRevisionQuestion: nextAdvRevisionQuestion,
    exitAdvancedRevision: exitAdvancedRevision,
    getAdvRevisionStats: getAdvRevisionStats,
    getFailureNature: getFailureNature
  };
})();
