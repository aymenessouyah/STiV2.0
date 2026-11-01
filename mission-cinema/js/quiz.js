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

      var ligne = document.createElement("div");
      ligne.className = "q-actions";
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn valider";
      btn.textContent = "Valider ma réponse";
      btn.onclick = function () { validateSQL(q, ta.value); };
      ligne.appendChild(btn);

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
      var ta2 = document.createElement("textarea");
      ta2.placeholder = "Décrivez le résultat attendu (lignes et colonnes)…";
      ta2.spellcheck = false;
      var saved2 = state.answers[q.id];
      if (saved2 && saved2.reponse != null) ta2.value = saved2.reponse;
      wrap.appendChild(ta2);

      var ligne2 = document.createElement("div");
      ligne2.className = "q-actions";
      var btn2 = document.createElement("button");
      btn2.type = "button";
      btn2.className = "btn valider";
      btn2.textContent = "Valider ma réponse";
      btn2.onclick = function () { validateResult(q, ta2.value); };
      ligne2.appendChild(btn2);
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
      motif = "Validation déclarative : vous affirmez que votre requête produit le même résultat que la référence (comparaison pédagogique, pas d'exécution MySQL dans le navigateur).";
    } else {
      correct = false;
      motif = "Votre requête ne correspond pas (textuellement) aux écritures de référence. Consultez la correction ci-dessous.";
    }

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
    btn.textContent = "Continuer la mission";
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
      var ids = Object.keys(state.answers);
      video.setAnswered(ids);
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
  function getAnswers() { return state.answers; }
  function getNom() { return state.nom; }
  function setNom(n) { state.nom = n; if (!state.startedAt) state.startedAt = new Date().toISOString(); persist(); }
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
    getAnswers: getAnswers,
    getNom: getNom,
    setNom: setNom,
    isAnswered: isAnswered,
    isComplete: isComplete,
    typeLabel: typeLabel,
    on: on,
    normaliserSQL: normaliserSQL
  };
})();
