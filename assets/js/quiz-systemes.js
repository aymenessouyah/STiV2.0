/* STI V2.0 — Quiz « Systèmes, technologies et Internet » (v580)
   ─────────────────────────────────────────────────────────────────────────
   Premier quiz de la partie 1 du manuel 3ᵉ SI : systèmes d'exploitation,
   réseaux, objets connectés. Les 18 questions viennent UNIQUEMENT du cours
   (assets/data/quiz-systemes-internet.json), qui suit lui-même les pages 5
   à 13 du livre : aucun hors-programme, aucune invention.

   Même moteur d'idées que le Quiz des tableaux :
   - réservé aux abonnés (la session donne le nom de l'élève, stockage local) ;
   - tirage aléatoire sans répétition : une question déjà répondue ne revient
     pas tant que le vivier du module n'est pas épuisé ;
   - plafond de 20 % de bonnes réponses en case A (assets/js/quiz-alea.js) ;
   - correction détaillée + « points à réviser » reliés aux chapitres du cours ;
   - score, réponses et XP envoyés à Supabase via assets/js/quiz-sync.js.
*/
(function () {
  "use strict";
  var NB_PAR_SESSION = 10;
  var CLE_STOCKAGE = "sti-quiz-systemes-v1";
  var SLUG = "systemes";
  var BANQUE_URL = "../assets/data/quiz-systemes-internet.json";

  var LIBELLE_MODULE = {
    systemes: "Systèmes d’exploitation",
    reseaux: "Réseaux",
    iot: "Internet des objets"
  };
  var ICO_MODULE = { systemes: "🖥️", reseaux: "🌐", iot: "📡" };
  var LIEN_COURS_MODULE = {
    systemes: "../cours/systemes-technologies-internet.html#ch1",
    reseaux: "../cours/systemes-technologies-internet.html#ch2",
    iot: "../cours/systemes-technologies-internet.html#ch3"
  };
  var LIEN_VIDEO = "../cours/systemes-technologies-internet.html#video-cours";

  var app = document.getElementById("qt-app");
  if (!app) return;

  /* ---------- Petits outils ---------- */
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function entierAleatoire(maxExcl) {
    if (maxExcl <= 1) return 0;
    if (window.crypto && typeof window.crypto.getRandomValues === "function") {
      var buf = new Uint32Array(1);
      window.crypto.getRandomValues(buf);
      return buf[0] % maxExcl;
    }
    return Math.floor(Math.random() * maxExcl);
  }
  function melanger(tab) {
    var a = tab.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = entierAleatoire(i + 1);
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* Le plan de réponses (20 % de A au maximum) est celui de toutes les
     capsules : on ne réécrit pas la règle, on l'applique. */
  function preparerQuestions(liste) {
    var tirees = liste.map(function (q) {
      return { ref: q, choix: melanger([q.bonne].concat(q.choix_faux || [])), choixEleve: -1 };
    });
    var alea = window.STIQuizAlea;
    if (!alea || typeof alea.planReponses !== "function" || typeof alea.placerReponse !== "function") return tirees;
    var plan = alea.planReponses(tirees.map(function (it) { return it.choix.length; }), { maxA: 0.2 });
    for (var i = 0; i < tirees.length; i++) {
      var idx = tirees[i].choix.indexOf(tirees[i].ref.bonne);
      if (idx < 0) continue;
      var place = alea.placerReponse(tirees[i].choix, idx, plan[i]);
      tirees[i].choix = place.options;
    }
    return tirees;
  }

  /* ---------- Session et stockage local ---------- */
  function lireSession() {
    var bruts = [];
    try { bruts.push(localStorage.getItem("sti-session-cache")); } catch (e1) {}
    try { bruts.push(sessionStorage.getItem("sti-session-cache")); } catch (e2) {}
    for (var i = 0; i < bruts.length; i++) {
      if (!bruts[i]) continue;
      try {
        var c = JSON.parse(bruts[i]);
        if (c && (c.email || c.id)) return c;
      } catch (e3) {}
    }
    return null;
  }
  var session = lireSession();
  var userKey = session ? String(session.email || session.id || "abonne").toLowerCase() : null;

  function lireStockage() {
    try {
      var tout = JSON.parse(localStorage.getItem(CLE_STOCKAGE) || "{}");
      return tout && typeof tout === "object" ? tout : {};
    } catch (e) { return {}; }
  }
  function etatEleve() {
    var tout = lireStockage();
    if (!tout[userKey]) tout[userKey] = { vus: {}, resultats: [] };
    if (!tout[userKey].vus) tout[userKey].vus = {};
    if (!tout[userKey].resultats) tout[userKey].resultats = [];
    return tout[userKey];
  }
  function sauverEtat(etat) {
    try {
      var tout = lireStockage();
      tout[userKey] = etat;
      localStorage.setItem(CLE_STOCKAGE, JSON.stringify(tout));
    } catch (e) {}
  }
  function marquerVus(questions) {
    var etat = etatEleve();
    var parModule = {};
    questions.forEach(function (q) {
      if (!etat.vus[q.module]) etat.vus[q.module] = [];
      if (etat.vus[q.module].indexOf(q.id) === -1) etat.vus[q.module].push(q.id);
      if (!parModule[q.module]) parModule[q.module] = [];
      parModule[q.module].push(q.id);
    });
    sauverEtat(etat);
    if (window.STIQuizSync && STIQuizSync.marquerVus) {
      Object.keys(parModule).forEach(function (m) { STIQuizSync.marquerVus(m, parModule[m]); });
    }
  }
  function fusionnerVusDistants() {
    if (!window.STIQuizSync || !STIQuizSync.chargerVus) return;
    STIQuizSync.chargerVus().then(function (distants) {
      if (!distants) return;
      var etat = etatEleve(), change = false;
      Object.keys(distants).forEach(function (m) {
        if (!Object.prototype.hasOwnProperty.call(LIBELLE_MODULE, m)) return;
        if (!etat.vus[m]) etat.vus[m] = [];
        (distants[m] || []).forEach(function (id) {
          if (etat.vus[m].indexOf(id) === -1) { etat.vus[m].push(id); change = true; }
        });
      });
      if (!change) return;
      sauverEtat(etat);
      if (!sessionQuiz) afficherAccueil();
    }).catch(function () {});
  }

  /* ---------- Banque ---------- */
  var banque = null;
  function questionsPour(module) {
    if (!banque) return [];
    return banque.filter(function (q) { return module === "mix" || q.module === module; });
  }
  function vivier(module) {
    var dejaVus = {};
    var etat = etatEleve();
    Object.keys(etat.vus).forEach(function (m) {
      if (!Object.prototype.hasOwnProperty.call(LIBELLE_MODULE, m)) return;
      if (module === "mix" || m === module) etat.vus[m].forEach(function (id) { dejaVus[id] = true; });
    });
    return questionsPour(module).filter(function (q) { return !dejaVus[q.id]; });
  }

  /* ---------- Écrans ---------- */
  function afficherVerrou() {
    app.innerHTML =
      '<div class="qt-verrou"><div class="qt-gros">🔒</div>' +
      "<h1>Quiz <em>Systèmes &amp; Internet</em></h1>" +
      '<p class="qt-sous">Ce quiz est réservé aux élèves abonnés à la plateforme.<br>Connectez-vous avec votre compte pour y accéder.</p>' +
      '<div class="qt-actions" style="justify-content:center"><a class="qt-btn" style="text-decoration:none" href="../portail.html">Se connecter</a>' +
      '<a class="qt-btn secondaire" style="text-decoration:none" href="../cours/systemes-technologies-internet.html">📖 Lire le cours</a></div></div>';
  }

  function cartesModules() {
    var modules = Object.keys(LIBELLE_MODULE).filter(function (m) { return questionsPour(m).length > 0; });
    return modules.map(function (m) {
      var reste = vivier(m).length;
      var total = questionsPour(m).length;
      return '<button type="button" class="qt-module' + (reste === 0 ? " epuise" : "") + '" data-module="' + m + '">' +
        '<span class="qt-mod-ico">' + ICO_MODULE[m] + "</span>" +
        '<span class="qt-mod-nom">' + esc(LIBELLE_MODULE[m]) + "</span>" +
        '<span class="qt-mod-reste">' + (reste === 0
          ? "Vivier épuisé 🎉 (" + total + " questions vues)"
          : reste + " question" + (reste > 1 ? "s" : "") + " jamais vue" + (reste > 1 ? "s" : "")) + "</span></button>";
    }).join("");
  }

  function afficherAccueil() {
    var total = banque ? banque.length : 0;
    var resteMix = vivier("mix").length;
    app.innerHTML =
      "<h1>Quiz <em>Systèmes, technologies et Internet</em></h1>" +
      '<p class="qt-sous">Les ' + total + " questions viennent uniquement du cours de la partie 1 du manuel 3ᵉ SI " +
      "(systèmes d’exploitation, réseaux, objets connectés). À chaque session, le tirage est aléatoire : " +
      "une question déjà répondue ne revient pas tant qu’il en reste.</p>" +
      '<div id="qt-cloud-bilan" style="margin:0 0 12px"></div>' +
      '<div class="qt-modules">' + cartesModules() + "</div>" +
      '<div class="qt-actions"><button type="button" class="qt-btn" data-module="mix" ' +
      (resteMix === 0 ? "disabled" : "") + ">🎲 Mix des trois chapitres (" + resteMix + " restantes)</button>" +
      '<button type="button" class="qt-btn secondaire" id="qt-reinit">↺ Réinitialiser un module épuisé</button>' +
      '<a class="qt-btn secondaire" style="text-decoration:none" href="' + LIEN_VIDEO + '">🎬 Revoir la vidéo du cours</a></div>' +
      '<p class="qt-sous" style="margin-top:14px">Session de ' + NB_PAR_SESSION +
      " questions, corrigé expliqué et renvoi vers le chapitre exact du cours.</p>";
    app.querySelectorAll("[data-module]").forEach(function (b) {
      b.addEventListener("click", function () { demarrer(b.getAttribute("data-module")); });
    });
    var reinit = document.getElementById("qt-reinit");
    if (reinit) reinit.addEventListener("click", afficherReinit);
    afficherBilanCloud();
  }

  function afficherBilanCloud() {
    if (!window.STIQuizSync || !STIQuizSync.resume) return;
    STIQuizSync.resume(SLUG).then(function (res) {
      var el = document.getElementById("qt-cloud-bilan");
      if (!el || !res || !res.parties) return;
      el.innerHTML =
        '<div style="padding:10px 14px;border-radius:12px;border:1.5px solid rgba(16,185,129,.4);background:rgba(16,185,129,.09);font-size:13px;font-weight:700">' +
        "☁️ <strong>Scores Supabase :</strong> " + res.parties + " partie" + (res.parties > 1 ? "s" : "") +
        (res.meilleur ? " · 🏆 Meilleur : <strong>" + res.meilleur.score + "/" + res.meilleur.total + "</strong> (" + res.meilleur.pct + " %)" : "") +
        (res.dernier ? " · 🕒 Dernier : <strong>" + res.dernier.score + "/" + res.dernier.total + "</strong> (" + res.dernier.pct + " %)" : "") +
        "</div>";
    }).catch(function () {});
  }

  function afficherReinit() {
    var modules = Object.keys(LIBELLE_MODULE).filter(function (m) { return vivier(m).length === 0; });
    app.innerHTML = "<h1>Réinitialiser <em>un module épuisé</em></h1>" +
      '<p class="qt-sous">Choisissez le module dont vous voulez revoir les questions.</p>' +
      '<div class="qt-actions">' + (modules.length
        ? modules.map(function (m) {
          return '<button type="button" class="qt-btn secondaire" data-reinit="' + m + '">' +
            ICO_MODULE[m] + " " + esc(LIBELLE_MODULE[m]) + "</button>";
        }).join("")
        : '<span class="qt-sous">Aucun module épuisé pour le moment : continuez, vous avez encore des questions neuves.</span>') +
      "</div>" +
      '<div class="qt-actions"><button type="button" class="qt-btn" id="qt-retour">← Retour</button></div>';
    app.querySelectorAll("[data-reinit]").forEach(function (b) {
      b.addEventListener("click", function () {
        var m = b.getAttribute("data-reinit");
        var etat = etatEleve();
        etat.vus[m] = [];
        sauverEtat(etat);
        if (window.STIQuizSync && STIQuizSync.reinitialiserVus) STIQuizSync.reinitialiserVus(m);
        afficherAccueil();
      });
    });
    document.getElementById("qt-retour").addEventListener("click", afficherAccueil);
  }

  var sessionQuiz = null;

  function demarrer(module) {
    if (!banque || !banque.length) return;
    var revIds = window.STIQuizSync && STIQuizSync.revisionIds ? STIQuizSync.revisionIds(SLUG) : null;
    var pool;
    if (revIds && revIds.length) {
      pool = banque.filter(function (q) { return revIds.indexOf(q.id) !== -1; });
      if (!pool.length) pool = vivier(module);
    } else {
      pool = vivier(module);
    }
    if (!pool.length) { afficherAccueil(); return; }
    var mode = revIds && revIds.length ? "erreurs" : "officiel";
    sessionQuiz = {
      partieId: window.STIQuizSync && STIQuizSync.creerIdentifiantPartie ? STIQuizSync.creerIdentifiantPartie() : null,
      module: module, mode: mode, synchronise: false,
      questions: preparerQuestions(melanger(pool).slice(0, mode === "erreurs" ? pool.length : NB_PAR_SESSION)),
      index: 0
    };
    afficherQuestion();
  }

  function afficherQuestion() {
    var s = sessionQuiz;
    var item = s.questions[s.index];
    var q = item.ref;
    var pct = Math.round((s.index / s.questions.length) * 100);
    var nbRepondues = s.questions.filter(function (it) { return it.choixEleve !== -1; }).length;
    app.innerHTML =
      '<div class="qt-qmeta"><span class="qt-badge">' + ICO_MODULE[q.module] + " " + esc(LIBELLE_MODULE[q.module]) + "</span>" +
      "<span>Question " + (s.index + 1) + " / " + s.questions.length +
      (s.mode === "erreurs" ? " · révision erreurs" : (s.mode === "reviser_encore" ? " · réviser encore" : "")) + "</span></div>" +
      '<div class="qt-barre"><i style="width:' + pct + '%"></i></div>' +
      '<p class="qt-question">' + esc(q.q) + "</p>" +
      '<div class="qt-choix">' + item.choix.map(function (c, i) {
        return '<button type="button" class="qt-choix-btn' + (item.choixEleve === i ? " choisi" : "") + '" data-choix="' + i + '">' +
          "<strong>" + String.fromCharCode(65 + i) + ".</strong> " + esc(c) + "</button>";
      }).join("") + "</div>" +
      '<div class="qt-actions">' +
      '<button type="button" class="qt-btn" id="qt-suivant" ' + (item.choixEleve === -1 ? "disabled" : "") + ">" +
      (s.index + 1 === s.questions.length ? "🏁 Voir l’évaluation ✓" : "Question suivante →") + "</button>" +
      '<button type="button" class="qt-btn secondaire" id="qt-arreter">' +
      (nbRepondues > 0 ? "⏹ Terminer & évaluer" : "Arrêter") + "</button></div>";
    app.querySelectorAll("[data-choix]").forEach(function (b) {
      b.addEventListener("click", function () {
        item.choixEleve = parseInt(b.getAttribute("data-choix"), 10);
        afficherQuestion();
      });
    });
    document.getElementById("qt-suivant").addEventListener("click", function () {
      s.index++;
      if (s.index >= s.questions.length) terminer();
      else afficherQuestion();
    });
    document.getElementById("qt-arreter").addEventListener("click", terminer);
  }

  /* ---------- Enregistrement du score ---------- */
  function synchroniserSession(s) {
    if (!s || s.synchronise) return;
    var repondues = s.questions.filter(function (it) { return it.choixEleve !== -1; });
    if (!repondues.length) return;
    s.synchronise = true;
    var bonnes = repondues.filter(function (it) { return it.choix[it.choixEleve] === it.ref.bonne; });
    if (s.mode === "officiel" || s.mode === "reviser_encore") {
      marquerVus(repondues.map(function (it) { return it.ref; }));
      var etat = etatEleve();
      etat.resultats.push({
        partie_id: s.partieId, ts: Date.now(), module: s.module,
        score: bonnes.length, total: repondues.length
      });
      etat.resultats = etat.resultats.slice(-200);
      sauverEtat(etat);
      if (window.STIQuizSync && STIQuizSync.enregistrer) {
        STIQuizSync.enregistrer(SLUG, bonnes.length, repondues.length, s.module, {
          points: bonnes.length * 10,
          ordre_questions: repondues.map(function (it, idx) {
            return { rang: idx + 1, id: it.ref.id, enonce: it.ref.q, ok: it.choix[it.choixEleve] === it.ref.bonne };
          }),
          partie_id: s.partieId
        });
      }
    }
    if (window.STIQuizSync && STIQuizSync.enregistrerReponses) {
      STIQuizSync.enregistrerReponses(SLUG, s.module, repondues.map(function (it) {
        return { id: it.ref.id, module: it.ref.module || s.module, enonce: it.ref.q,
          ok: it.choix[it.choixEleve] === it.ref.bonne };
      }));
    }
  }

  window.addEventListener("pagehide", function () {
    if (sessionQuiz && !sessionQuiz.synchronise) synchroniserSession(sessionQuiz);
  });

  function conseilParFaute(it) {
    var q = it.ref;
    var choisie = it.choix[it.choixEleve] || "";
    return "Ne confonds plus « " + choisie + " » avec « " + q.bonne + " » : relis " +
      (q.ref || "le cours") + " dans le cours « Systèmes, technologies et Internet ».";
  }

  function terminer() {
    var s = sessionQuiz;
    var repondues = s.questions.filter(function (it) { return it.choixEleve !== -1; });
    if (!repondues.length) {
      s.synchronise = true;
      sessionQuiz = null;
      if (window.STIQuizSync && STIQuizSync.quitterRevision) STIQuizSync.quitterRevision();
      afficherAccueil();
      return;
    }
    var bonnes = repondues.filter(function (it) { return it.choix[it.choixEleve] === it.ref.bonne; });
    synchroniserSession(s);
    if (window.STIQuizSync && STIQuizSync.quitterRevision) STIQuizSync.quitterRevision();
    var erreurs = repondues.filter(function (it) { return it.choix[it.choixEleve] !== it.ref.bonne; });
    var pct = Math.round((bonnes.length / repondues.length) * 100);

    var blocPoints = "";
    if (erreurs.length) {
      var parModule = {};
      erreurs.forEach(function (it) {
        var m = it.ref.module;
        if (!parModule[m]) parModule[m] = { count: 0, refs: [] };
        parModule[m].count++;
        if (it.ref.ref && parModule[m].refs.indexOf(it.ref.ref) === -1) parModule[m].refs.push(it.ref.ref);
      });
      blocPoints =
        '<section class="qt-points-reviser" aria-label="Points à réviser"><h2>📌 Points à réviser en priorité (' +
        erreurs.length + " faute" + (erreurs.length > 1 ? "s" : "") + ")</h2><div class=\"qt-points-grille\">" +
        Object.keys(parModule).sort(function (a, b) { return parModule[b].count - parModule[a].count; }).map(function (m) {
          var info = parModule[m];
          return '<div class="qt-point-carte"><div class="qt-point-entete"><span>' + ICO_MODULE[m] + " " +
            esc(LIBELLE_MODULE[m]) + " (" + info.count + ')</span><a class="qt-point-lien" href="' +
            esc(LIEN_COURS_MODULE[m]) + '">📖 Cours →</a></div><p class="qt-point-refs">À revoir : ' +
            esc(info.refs.slice(0, 6).join(" · ")) + "</p></div>";
        }).join("") + "</div></section>";
    }

    app.innerHTML =
      "<h1>Évaluation <em>de la session</em></h1>" +
      '<p class="qt-score">' + bonnes.length + " / " + repondues.length + " bonnes réponses (" + pct + " %)</p>" +
      '<p class="qt-sous">' + (erreurs.length === 0
        ? "Sans faute, bravo ! Aucun point à réviser sur ce tirage 🎉"
        : "Retrouvez ci-dessous vos points à réviser en priorité, avec un conseil pour chaque faute.") + "</p>" +
      blocPoints +
      repondues.map(function (it) {
        var ok = it.choix[it.choixEleve] === it.ref.bonne;
        return '<div class="qt-correction ' + (ok ? "ok" : "ko") + '">' +
          '<p class="qt-cq">' + (ok ? "✅" : "❌") + " " + esc(it.ref.q) + "</p>" +
          (ok
            ? '<p class="qt-ligne">Bonne réponse : <strong>' + esc(it.ref.bonne) + "</strong></p>"
            : '<p class="qt-ligne">Ta réponse : ' + esc(it.choix[it.choixEleve]) + "</p>" +
              '<p class="qt-ligne">Bonne réponse : <strong>' + esc(it.ref.bonne) + "</strong></p>" +
              '<div class="qt-conseil">💡 <strong>Conseil :</strong> ' + esc(conseilParFaute(it)) + "</div>") +
          '<a class="qt-ref" style="text-decoration:none" href="../' + esc(it.ref.ancre || "") + '">' +
          ICO_MODULE[it.ref.module] + " " + esc(it.ref.ref || "") + "</a></div>";
      }).join("") +
      '<div class="qt-actions">' +
      (erreurs.length ? '<button type="button" class="qt-btn" id="qt-erreurs">🎯 Revoir mes erreurs (' + erreurs.length + ")</button>" : "") +
      '<button type="button" class="qt-btn" id="qt-reviser-encore">🔁 Réviser encore une autre fois (même série)</button>' +
      '<button type="button" class="qt-btn" id="qt-encore">🎲 Nouvelles questions</button>' +
      '<button type="button" class="qt-btn secondaire" id="qt-accueil">← Choisir un autre module</button>' +
      '<a class="qt-btn secondaire" style="text-decoration:none" href="../index.html#modules">← Retour aux quiz</a></div>';

    var bErr = document.getElementById("qt-erreurs");
    if (bErr) bErr.addEventListener("click", function () {
      sessionQuiz = {
        partieId: window.STIQuizSync && STIQuizSync.creerIdentifiantPartie ? STIQuizSync.creerIdentifiantPartie() : null,
        module: s.module, mode: "erreurs", synchronise: false, index: 0,
        questions: preparerQuestions(erreurs.map(function (it) { return it.ref; }))
      };
      afficherQuestion();
    });
    var bRev = document.getElementById("qt-reviser-encore");
    if (bRev) bRev.addEventListener("click", function () {
      sessionQuiz = {
        partieId: window.STIQuizSync && STIQuizSync.creerIdentifiantPartie ? STIQuizSync.creerIdentifiantPartie() : null,
        module: s.module, mode: "reviser_encore", synchronise: false, index: 0,
        questions: preparerQuestions(s.questions.map(function (it) { return it.ref; }))
      };
      afficherQuestion();
    });
    document.getElementById("qt-encore").addEventListener("click", function () { demarrer(s.module); });
    document.getElementById("qt-accueil").addEventListener("click", afficherAccueil);
  }

  /* ---------- Démarrage ---------- */
  if (!session || !userKey) { afficherVerrou(); return; }
  fetch(BANQUE_URL, { cache: "no-store" })
    .then(function (r) { if (!r.ok) throw new Error("banque introuvable"); return r.json(); })
    .then(function (data) {
      banque = (data && data.questions) || [];
      if (!banque.length) throw new Error("banque vide");
      var revIds = window.STIQuizSync && STIQuizSync.revisionIds ? STIQuizSync.revisionIds(SLUG) : null;
      if (revIds && revIds.length) demarrer("mix");
      else afficherAccueil();
      fusionnerVusDistants();
    })
    .catch(function () {
      app.innerHTML = "<h1>Quiz <em>Systèmes &amp; Internet</em></h1>" +
        '<p class="qt-sous">⚠️ Impossible de charger les questions pour le moment. ' +
        "Vérifiez votre connexion puis rechargez la page.</p>" +
        '<div class="qt-actions"><a class="qt-btn secondaire" style="text-decoration:none" href="../index.html#modules">← Retour aux quiz</a></div>';
    });
})();
