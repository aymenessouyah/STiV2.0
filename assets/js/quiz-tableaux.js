/* STI V2.0 — Quiz des tableaux (v356)
   Questions generees UNIQUEMENT depuis les tableaux recapitulatifs en fin
   des deux Smart Books (assets/data/quiz-banque.json) : aucun hors-programme.
   - Reserve aux abonnes : la session determine le niveau (3SI / 4SI) ;
   - Tirage aleatoire a chaque session, SANS repetition : les questions deja
     repondues (par cet eleve, sur cet appareil) ne ressortent pas tant que
     le vivier du module n'est pas epuise ;
   - Correction detaillee en fin de session + mode « Revoir mes erreurs ». */
(function () {
  "use strict";
  var NB_PAR_SESSION = 10;
  var CLE_STOCKAGE = "sti-quiz-tableaux-v1";
  var LIBELLE_MODULE = { html5: "HTML5", css3: "CSS3", javascript: "JavaScript", sql: "SQL", php: "PHP", defis: "66 Défis JS & HTML", "recap-php": "Récap PHP" };
  var ICO_MODULE = { html5: "🌐", css3: "🎨", javascript: "⚡", sql: "🗄️", php: "🐘", defis: "🎯", "recap-php": "🧾" };
  var app = document.getElementById("qt-app");
  if (!app) return;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function melanger(tab) {
    var a = tab.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* ---------- Session et niveau ---------- */
  function lireSession() {
    var bruts = [];
    try { bruts.push(localStorage.getItem("sti-session-cache")); } catch (e) {}
    try { bruts.push(sessionStorage.getItem("sti-session-cache")); } catch (e) {}
    for (var i = 0; i < bruts.length; i++) {
      if (!bruts[i]) continue;
      try {
        var c = JSON.parse(bruts[i]);
        if (c && (c.email || c.id)) return c;
      } catch (e) {}
    }
    return null;
  }
  function niveauDepuisClasse(classe) {
    var c = String(classe || "").trim();
    if (/^3/.test(c)) return "3si";
    if (/^4/.test(c)) return "4si";
    return null; // prof, admin, Gold, elevelabo3... : les deux banques
  }

  var session = lireSession();
  var userKey = session ? String(session.email || session.id || "abonne").toLowerCase() : null;
  var niveauDetecte = session ? niveauDepuisClasse(session.classe) : null;

  /* ---------- Stockage local (par eleve, sur cet appareil) ---------- */
  function lireStockage() {
    try {
      var brut = localStorage.getItem(CLE_STOCKAGE);
      var tout = brut ? JSON.parse(brut) : {};
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
  function vusDu(module) {
    var etat = etatEleve();
    return etat.vus[module] || [];
  }
  function marquerVus(questionsRepondues) {
    var etat = etatEleve();
    var parModule = {};
    questionsRepondues.forEach(function (q) {
      if (!etat.vus[q.module]) etat.vus[q.module] = [];
      if (etat.vus[q.module].indexOf(q.id) === -1) etat.vus[q.module].push(q.id);
      if (!parModule[q.module]) parModule[q.module] = [];
      parModule[q.module].push(q.id);
    });
    sauverEtat(etat);
    if (window.STIQuizSync) {
      Object.keys(parModule).forEach(function (m) { STIQuizSync.marquerVus(m, parModule[m]); });
    }
  }

  /* Fusion avec l'historique central (autres appareils) : union des deux,
     puis renvoi de l'historique complet vers le serveur (idempotent). */
  function fusionnerVusDistants() {
    if (!window.STIQuizSync) return;
    STIQuizSync.chargerVus().then(function (distants) {
      if (!distants) return;
      var etat = etatEleve();
      Object.keys(distants).forEach(function (m) {
        if (!etat.vus[m]) etat.vus[m] = [];
        distants[m].forEach(function (id) {
          if (etat.vus[m].indexOf(id) === -1) etat.vus[m].push(id);
        });
      });
      sauverEtat(etat);
      Object.keys(etat.vus).forEach(function (m) {
        if (etat.vus[m].length) STIQuizSync.marquerVus(m, etat.vus[m]);
      });
      if (!sessionQuiz) afficherAccueil();
    }).catch(function () {});
  }

  /* ---------- Banque ---------- */
  var banque = null;
  function questionsPour(niveau, module) {
    return banque.filter(function (q) {
      return q.niveaux.indexOf(niveau) !== -1 && (module === "mix" || q.module === module);
    });
  }
  function vivier(niveau, module) {
    var dejaVus = {};
    var etat = etatEleve();
    Object.keys(etat.vus).forEach(function (m) {
      if (module === "mix" || m === module) etat.vus[m].forEach(function (id) { dejaVus[id] = true; });
    });
    return questionsPour(niveau, module).filter(function (q) { return !dejaVus[q.id]; });
  }

  /* ---------- Ecrans ---------- */
  function afficherVerrou() {
    app.innerHTML =
      '<div class="qt-verrou"><div class="qt-gros">🔒</div>' +
      "<h1>Quiz <em>des tableaux</em></h1>" +
      '<p class="qt-sous">Ce quiz est réservé aux élèves abonnés à la plateforme.<br>Connectez-vous avec votre compte pour y accéder.</p>' +
      '<div class="qt-actions" style="justify-content:center"><a class="qt-btn" style="text-decoration:none" href="../portail.html">Se connecter</a></div></div>';
  }

  var niveauChoisi = niveauDetecte; // null = choix libre (prof / Gold / labo)
  function afficherAccueil() {
    var niveauxHtml = "";
    if (!niveauDetecte) {
      niveauxHtml =
        '<p class="qt-sous" style="margin-bottom:8px">Votre compte donne accès aux deux banques. Choisissez le niveau :</p>' +
        '<div class="qt-actions" style="margin:0 0 16px">' +
        '<button type="button" class="qt-btn' + (niveauChoisi === "4si" ? "" : " secondaire") + '" data-niveau="3si">3ème SI</button>' +
        '<button type="button" class="qt-btn' + (niveauChoisi === "4si" ? "" : " secondaire") + '" data-niveau="4si">4ème SI</button></div>';
      if (!niveauChoisi) niveauChoisi = "4si";
    } else {
      niveauxHtml = '<p class="qt-sous">Niveau détecté : <strong>' +
        (niveauDetecte === "3si" ? "3ème SI" : "4ème SI") + "</strong> (" + esc(session.classe || "") +
        "). Les questions viennent uniquement des contenus de la plateforme : tableaux récapitulatifs de votre livre et 66 Défis JS &amp; HTML" +
        (niveauDetecte === "4si" ? " et Récap PHP" : "") + " : " +
        "à chaque session, le tirage est aléatoire et une question déjà répondue ne revient jamais (tant qu'il en reste).</p>";
    }
    var modules = Object.keys(LIBELLE_MODULE).filter(function (m) {
      return questionsPour(niveauChoisi, m).length > 0;
    });
    var cartes = modules.map(function (m) {
      var reste = vivier(niveauChoisi, m).length;
      var total = questionsPour(niveauChoisi, m).length;
      return '<button type="button" class="qt-module' + (reste === 0 ? " epuise" : "") + '" data-module="' + m + '">' +
        '<span class="qt-mod-ico">' + ICO_MODULE[m] + '</span>' +
        '<span class="qt-mod-nom">' + LIBELLE_MODULE[m] + "</span>" +
        '<span class="qt-mod-reste">' + (reste === 0
          ? "Vivier épuisé 🎉 (" + total + " questions vues)"
          : reste + " question" + (reste > 1 ? "s" : "") + " jamais vue" + (reste > 1 ? "s" : "")) + "</span></button>";
    }).join("");
    var resteMix = vivier(niveauChoisi, "mix").length;
    app.innerHTML =
      "<h1>Quiz <em>des tableaux</em></h1>" + niveauxHtml +
      '<div class="qt-modules">' + cartes + "</div>" +
      '<div class="qt-actions"><button type="button" class="qt-btn" data-module="mix" ' +
      (resteMix === 0 ? "disabled" : "") + ">🎲 Mix de tous les tableaux (" + resteMix + " restantes)</button>" +
      '<button type="button" class="qt-btn secondaire" id="qt-reinit">↺ Réinitialiser un module épuisé</button></div>' +
      '<p class="qt-sous" style="margin-top:14px">Session de ' + NB_PAR_SESSION + " questions, correction détaillée à la fin, puis mode « Revoir mes erreurs ».</p>";
    app.querySelectorAll("[data-module]").forEach(function (b) {
      b.addEventListener("click", function () { demarrer(b.getAttribute("data-module")); });
    });
    app.querySelectorAll("[data-niveau]").forEach(function (b) {
      b.addEventListener("click", function () { niveauChoisi = b.getAttribute("data-niveau"); afficherAccueil(); });
    });
    var reinit = document.getElementById("qt-reinit");
    if (reinit) reinit.addEventListener("click", afficherReinit);
  }

  function afficherReinit() {
    var etat = etatEleve();
    var modules = Object.keys(LIBELLE_MODULE).filter(function (m) { return (etat.vus[m] || []).length > 0; });
    if (!modules.length) { afficherAccueil(); return; }
    app.innerHTML = "<h1>Recommencer <em>un cycle</em></h1>" +
      '<p class="qt-sous">Réinitialiser efface l\u2019historique des questions vues d\u2019un module : ' +
      "elles pourront ressortir dans les prochains tirages. Vos résultats restent conservés.</p>" +
      '<div class="qt-modules">' + modules.map(function (m) {
        return '<button type="button" class="qt-module" data-reinit="' + m + '"><span class="qt-mod-ico">' + ICO_MODULE[m] +
          '</span><span class="qt-mod-nom">' + LIBELLE_MODULE[m] + '</span><span class="qt-mod-reste">' +
          etat.vus[m].length + " questions vues</span></button>";
      }).join("") + "</div>" +
      '<div class="qt-actions">' +
      (modules.length > 1 ? '<button type="button" class="qt-btn" id="qt-reinit-tout">↺ Tout réinitialiser</button>' : "") +
      '<button type="button" class="qt-btn secondaire" id="qt-retour">← Retour</button></div>';
    app.querySelectorAll("[data-reinit]").forEach(function (b) {
      b.addEventListener("click", function () {
        var mod = b.getAttribute("data-reinit");
        var etat2 = etatEleve();
        etat2.vus[mod] = [];
        sauverEtat(etat2);
        if (window.STIQuizSync && typeof STIQuizSync.reinitialiserVus === "function") {
          STIQuizSync.reinitialiserVus(mod);
        }
        afficherAccueil();
      });
    });
    var btnTout = document.getElementById("qt-reinit-tout");
    if (btnTout) btnTout.addEventListener("click", function () {
      var etat3 = etatEleve();
      etat3.vus = {};
      sauverEtat(etat3);
      if (window.STIQuizSync && typeof STIQuizSync.reinitialiserVus === "function") {
        STIQuizSync.reinitialiserVus("*");
      }
      afficherAccueil();
    });
    document.getElementById("qt-retour").addEventListener("click", afficherAccueil);
  }

  /* ---------- Session de quiz ---------- */
  var sessionQuiz = null;
  function demarrer(module) {
    var revTab = window.STIQuizSync && STIQuizSync.revisionIds ? STIQuizSync.revisionIds("tableaux") : null;
    var pool;
    if (revTab) {
      var baseTab = niveauChoisi ? questionsPour(niveauChoisi, module)
        : banque.filter(function (q) { return module === "mix" || q.module === module; });
      pool = baseTab.filter(function (q) { return revTab.indexOf("tab-" + q.id) !== -1; });
      if (!pool.length) pool = vivier(niveauChoisi, module);
    } else {
      pool = vivier(niveauChoisi, module);
    }
    if (!pool.length) { afficherAccueil(); return; }
    var tirees = melanger(pool).slice(0, revTab ? pool.length : NB_PAR_SESSION).map(function (q) {
      return { ref: q, choix: melanger([q.bonne].concat(q.choix_faux)), choixEleve: -1 };
    });
    sessionQuiz = { module: module, questions: tirees, index: 0, mode: "officiel", synchronise: false };
    afficherQuestion();
  }

  function afficherQuestion() {
    var s = sessionQuiz;
    var item = s.questions[s.index];
    var q = item.ref;
    var pct = Math.round((s.index / s.questions.length) * 100);
    app.innerHTML =
      '<div class="qt-qmeta"><span class="qt-badge">' + ICO_MODULE[q.module] + " " + LIBELLE_MODULE[q.module] + "</span>" +
      "<span>Question " + (s.index + 1) + " / " + s.questions.length + (s.mode === "erreurs" ? " · entraînement" : "") + "</span></div>" +
      '<div class="qt-barre"><i style="width:' + pct + '%"></i></div>' +
      '<p class="qt-question">' + esc(q.q) + "</p>" +
      '<div class="qt-choix">' + item.choix.map(function (c, i) {
        return '<button type="button" class="qt-choix-btn' + (item.choixEleve === i ? " choisi" : "") + '" data-choix="' + i + '">' + esc(c) + "</button>";
      }).join("") + "</div>" +
      '<div class="qt-actions">' +
      '<button type="button" class="qt-btn" id="qt-suivant" ' + (item.choixEleve === -1 ? "disabled" : "") + ">" +
      (s.index + 1 === s.questions.length ? "Terminer ✓" : "Question suivante →") + "</button>" +
      '<button type="button" class="qt-btn secondaire" id="qt-arreter">Arrêter</button></div>';
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

  function synchroniserSessionTableaux(s) {
    if (!s || s.synchronise) return;
    var repondues = s.questions.filter(function (it) { return it.choixEleve !== -1; });
    if (!repondues.length) return;
    s.synchronise = true;
    var bonnes = repondues.filter(function (it) { return it.choix[it.choixEleve] === it.ref.bonne; });
    if (s.mode === "officiel") {
      marquerVus(repondues.map(function (it) { return it.ref; }));
      var etat = etatEleve();
      etat.resultats.push({
        ts: Date.now(), module: s.module, niveau: niveauChoisi,
        score: bonnes.length, total: repondues.length
      });
      etat.resultats = etat.resultats.slice(-200);
      sauverEtat(etat);
      if (window.STIQuizSync) STIQuizSync.enregistrer("tableaux", bonnes.length, repondues.length, s.module);
    }
    if (window.STIQuizSync && STIQuizSync.enregistrerReponses) {
      STIQuizSync.enregistrerReponses("tableaux", s.module, repondues.map(function (it) {
        return { id: it.ref.id != null ? "tab-" + it.ref.id : STIQuizSync.hash(it.ref.q),
                 module: it.ref.module || s.module,
                 enonce: it.ref.q, ok: it.choix[it.choixEleve] === it.ref.bonne };
      }));
    }
  }

  window.addEventListener("pagehide", function () {
    if (sessionQuiz && !sessionQuiz.synchronise) synchroniserSessionTableaux(sessionQuiz);
  });

  function terminer() {
    var s = sessionQuiz;
    var repondues = s.questions.filter(function (it) { return it.choixEleve !== -1; });
    var bonnes = repondues.filter(function (it) { return it.choix[it.choixEleve] === it.ref.bonne; });
    synchroniserSessionTableaux(s);
    if (window.STIQuizSync && STIQuizSync.quitterRevision) STIQuizSync.quitterRevision();
    var erreurs = repondues.filter(function (it) { return it.choix[it.choixEleve] !== it.ref.bonne; });
    var pct = repondues.length ? Math.round((bonnes.length / repondues.length) * 100) : 0;
    app.innerHTML =
      "<h1>Résultat <em>" + (s.mode === "erreurs" ? "de l'entraînement" : "de la session") + "</em></h1>" +
      '<p class="qt-score">' + bonnes.length + " / " + repondues.length + " bonnes réponses (" + pct + " %)</p>" +
      '<p class="qt-sous">' + (erreurs.length === 0 && repondues.length
        ? "Sans faute, bravo ! 🎉"
        : "Correction détaillée ci-dessous : la bonne réponse et la ligne du tableau d\u2019où elle vient.") + "</p>" +
      repondues.map(function (it) {
        var ok = it.choix[it.choixEleve] === it.ref.bonne;
        return '<div class="qt-correction ' + (ok ? "ok" : "ko") + '">' +
          '<p class="qt-cq">' + (ok ? "✅" : "❌") + " " + esc(it.ref.q) + "</p>" +
          (ok
            ? '<p class="qt-ligne">Bonne réponse : <strong>' + esc(it.ref.bonne) + "</strong></p>"
            : '<p class="qt-ligne">Ta réponse : ' + esc(it.choix[it.choixEleve]) + "</p>" +
              '<p class="qt-ligne">Bonne réponse : <strong>' + esc(it.ref.bonne) + "</strong></p>") +
          '<span class="qt-ref">' + ICO_MODULE[it.ref.module] + " Tableau " + LIBELLE_MODULE[it.ref.module] +
          " — « " + esc(it.ref.ref) + " »</span></div>";
      }).join("") +
      '<div class="qt-actions">' +
      (erreurs.length
        ? '<button type="button" class="qt-btn" id="qt-erreurs">🎯 Revoir mes erreurs (' + erreurs.length + ")</button>"
        : "") +
      (s.mode === "officiel"
        ? '<button type="button" class="qt-btn" id="qt-encore">🎲 Nouvelles questions</button>'
        : "") +
      '<button type="button" class="qt-btn secondaire" id="qt-accueil">← Choisir un autre module</button>' +
      '<a class="qt-btn secondaire" style="text-decoration:none" href="../index.html#modules">← Retour aux quiz</a></div>';
    var bErr = document.getElementById("qt-erreurs");
    if (bErr) bErr.addEventListener("click", function () {
      sessionQuiz = {
        module: s.module, mode: "erreurs", synchronise: false,
        questions: erreurs.map(function (it) {
          return { ref: it.ref, choix: melanger(it.choix), choixEleve: -1 };
        }),
        index: 0
      };
      afficherQuestion();
    });
    var bEnc = document.getElementById("qt-encore");
    if (bEnc) bEnc.addEventListener("click", function () { demarrer(s.module); });
    document.getElementById("qt-accueil").addEventListener("click", afficherAccueil);
  }

  /* ---------- Demarrage ---------- */
  if (!session || !userKey) { afficherVerrou(); return; }
  fetch("../assets/data/quiz-banque.json", { cache: "no-store" })
    .then(function (r) { if (!r.ok) throw new Error("banque introuvable"); return r.json(); })
    .then(function (data) {
      banque = (data && data.questions) || [];
      if (!banque.length) throw new Error("banque vide");
      var revTab2 = window.STIQuizSync && STIQuizSync.revisionIds ? STIQuizSync.revisionIds("tableaux") : null;
      var modRev = null;
      try { modRev = new URLSearchParams(window.location.search).get("module"); } catch (e) {}
      if (revTab2) demarrer(modRev || "mix");
      else afficherAccueil();
      fusionnerVusDistants();
    })
    .catch(function () {
      app.innerHTML = "<h1>Quiz <em>des tableaux</em></h1>" +
        '<p class="qt-sous">⚠️ Impossible de charger la banque de questions pour le moment. ' +
        "Vérifiez votre connexion puis rechargez la page.</p>";
    });
})();
