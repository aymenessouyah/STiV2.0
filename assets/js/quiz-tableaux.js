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
  var LIEN_COURS_MODULE = {
    html5: "../cours/html5.html",
    css3: "../cours/css3.html",
    javascript: "../cours/javascript.html",
    sql: "../cours/sql.html",
    php: "../cours/php.html",
    defis: "../exercices/javascript/js-37-defis-tt.html",
    "recap-php": "../cours/php.html"
  };
  var app = document.getElementById("qt-app");
  if (!app) return;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function entierAleatoireTab(maxExcl) {
    if (maxExcl <= 1) return 0;
    if (typeof window !== "undefined" && window.crypto && typeof window.crypto.getRandomValues === "function") {
      var buf = new Uint32Array(1);
      window.crypto.getRandomValues(buf);
      return buf[0] % maxExcl;
    }
    return Math.floor(Math.random() * maxExcl);
  }
  function melanger(tab) {
    var a = tab.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = entierAleatoireTab(i + 1);
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function preparerQuestionsMelangees(liste) {
    var tirees = liste.map(function (q) {
      return { ref: q, choix: melanger([q.bonne].concat(q.choix_faux)), choixEleve: -1 };
    });
    for (var i = 2; i < tirees.length; i++) {
      var p0 = tirees[i - 2].choix.indexOf(tirees[i - 2].ref.bonne);
      var p1 = tirees[i - 1].choix.indexOf(tirees[i - 1].ref.bonne);
      var p2 = tirees[i].choix.indexOf(tirees[i].ref.bonne);
      if (p2 !== -1 && p2 === p1 && p2 === p0 && tirees[i].choix.length > 1) {
        var alt = (p2 + 1 + entierAleatoireTab(tirees[i].choix.length - 1)) % tirees[i].choix.length;
        var tmp = tirees[i].choix[p2];
        tirees[i].choix[p2] = tirees[i].choix[alt];
        tirees[i].choix[alt] = tmp;
      }
    }
    return tirees;
  }
  function conseilParFauteTab(it) {
    var q = it.ref;
    var choisie = it.choix[it.choixEleve] || "";
    var modLbl = LIBELLE_MODULE[q.module] || q.module;
    var base = 'Ne confonds plus « ' + choisie + ' » avec « ' + q.bonne + ' » : ';
    if (q.type === "inv") {
      return base + 'associe directement la définition demandée à l\u2019élément exact « ' + q.ref + ' » dans le tableau récapitulatif ' + modLbl + '.';
    }
    return base + 'relis la ligne « ' + q.ref + ' » du tableau récapitulatif ' + modLbl + ' dans ton Smart Book et retiens la formulation exacte « ' + q.bonne + ' ».';
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
        if (!Object.prototype.hasOwnProperty.call(LIBELLE_MODULE, m)) return;
        if (!etat.vus[m]) etat.vus[m] = [];
        distants[m].forEach(function (id) {
          if (etat.vus[m].indexOf(id) === -1) etat.vus[m].push(id);
        });
      });
      sauverEtat(etat);
      Object.keys(etat.vus).forEach(function (m) {
        if (!Object.prototype.hasOwnProperty.call(LIBELLE_MODULE, m)) return;
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
      if (!Object.prototype.hasOwnProperty.call(LIBELLE_MODULE, m)) return;
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
      '<div id="qt-cloud-bilan" style="margin:0 0 12px"></div>' +
      '<div id="qt-reprise-cloud" style="margin:0 0 14px"></div>' +
      '<div class="qt-modules">' + cartes + "</div>" +
      '<div class="qt-actions"><button type="button" class="qt-btn" data-module="mix" ' +
      (resteMix === 0 ? "disabled" : "") + ">🎲 Mix de tous les tableaux (" + resteMix + " restantes)</button>" +
      '<button type="button" class="qt-btn secondaire" id="qt-reinit">↺ Réinitialiser un module épuisé</button></div>' +
      '<p class="qt-sous" style="margin-top:14px">Session de ' + NB_PAR_SESSION + " questions, score et ordre des questions synchronisés sur Supabase, puis mode « Réviser encore une autre fois ».</p>";
    app.querySelectorAll("[data-module]").forEach(function (b) {
      b.addEventListener("click", function () { demarrer(b.getAttribute("data-module")); });
    });
    app.querySelectorAll("[data-niveau]").forEach(function (b) {
      b.addEventListener("click", function () { niveauChoisi = b.getAttribute("data-niveau"); afficherAccueil(); });
    });
    var reinit = document.getElementById("qt-reinit");
    if (reinit) reinit.addEventListener("click", afficherReinit);
    hydraterBilanEtSessionCloudTableaux();
  }

  function hydraterBilanEtSessionCloudTableaux() {
    if (!window.STIQuizSync) return;
    if (typeof STIQuizSync.resume === "function") {
      STIQuizSync.resume("tableaux").then(function (res) {
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
    if (typeof STIQuizSync.chargerSession === "function") {
      STIQuizSync.chargerSession("tableaux").then(function (sauv) {
        var zone = document.getElementById("qt-reprise-cloud");
        if (!zone || !sauv || !Array.isArray(sauv.ordre_questions) || !sauv.ordre_questions.length) return;
        var idx = Math.min(Math.max(0, parseInt(sauv.index_courant, 10) || 0), sauv.ordre_questions.length - 1);
        var modLib = LIBELLE_MODULE[sauv.module] || "Mix de tous les tableaux";
        zone.innerHTML =
          '<div style="padding:12px 15px;border-radius:14px;border:2px solid #f59e0b;background:rgba(245,158,11,.12);display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px">' +
          '<div style="font-size:13.5px"><strong>☁️ Partie en cours sauvegardée sur Supabase</strong> (' + esc(modLib) + ")<br>" +
          "Question <strong>" + (idx + 1) + "/" + sauv.ordre_questions.length + "</strong> · Score conservé : <strong>" + (sauv.score || 0) + " bonne" + ((sauv.score || 0) > 1 ? "s" : "") + "</strong> · Ordre exact des questions conservé.</div>" +
          '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
          '<button type="button" class="qt-btn" id="qt-reprendre-cloud">▶️ Reprendre la partie</button>' +
          '<button type="button" class="qt-btn secondaire" id="qt-ignorer-cloud">✕ Nouvelle partie</button>' +
          "</div></div>";
        var btnRep = document.getElementById("qt-reprendre-cloud");
        if (btnRep) btnRep.addEventListener("click", function () { reprendreSessionTableaux(sauv); });
        var btnIgn = document.getElementById("qt-ignorer-cloud");
        if (btnIgn) btnIgn.addEventListener("click", function () {
          if (STIQuizSync.effacerSession) STIQuizSync.effacerSession("tableaux", sauv.etat_meta && sauv.etat_meta.partie_id);
          zone.innerHTML = "";
        });
      }).catch(function () {});
    }
  }

  function reprendreSessionTableaux(sauv) {
    if (!sauv || !Array.isArray(sauv.ordre_questions) || !banque) return;
    var parId = {};
    banque.forEach(function (q) { parId[String(q.id)] = q; });
    var restaurees = [];
    sauv.ordre_questions.forEach(function (it) {
      var ref = parId[String(it.qid)];
      if (!ref) return;
      var tousChoixRef = [ref.bonne].concat(Array.isArray(ref.choix_faux) ? ref.choix_faux : []);
      var choix = Array.isArray(it.choix) && it.choix.length === tousChoixRef.length ? it.choix.slice() : melanger(tousChoixRef);
      var ce = typeof it.choixEleve === "number" ? it.choixEleve : -1;
      restaurees.push({ ref: ref, choix: choix, choixEleve: ce });
    });
    if (!restaurees.length) return;
    if (sauv.etat_meta && sauv.etat_meta.niveau && !niveauDetecte) {
      niveauChoisi = sauv.etat_meta.niveau;
    }
    sessionQuiz = {
      partieId: STIQuizSync.identifierPartieReprise ? STIQuizSync.identifierPartieReprise("tableaux", sauv) : null,
      module: sauv.module || "mix",
      questions: restaurees,
      index: Math.min(Math.max(0, parseInt(sauv.index_courant, 10) || 0), restaurees.length - 1),
      mode: sauv.mode || "officiel",
      synchronise: false
    };
    afficherQuestion();
  }

  function sauvegarderProgressionTableauxCloud() {
    var s = sessionQuiz;
    if (!s || s.synchronise || !window.STIQuizSync || typeof STIQuizSync.sauverSession !== "function") return;
    var nbRepondues = s.questions.filter(function (it) { return it.choixEleve !== -1; }).length;
    if (nbRepondues === 0 && s.index === 0) return;
    var bonnesCourantes = s.questions.filter(function (it) {
      return it.choixEleve !== -1 && it.choix[it.choixEleve] === it.ref.bonne;
    }).length;
    STIQuizSync.sauverSession("tableaux", {
      module: s.module || "mix",
      mode: s.mode || "officiel",
      score: bonnesCourantes,
      points: bonnesCourantes * 10,
      total: s.questions.length,
      index_courant: s.index,
      ordre_questions: s.questions.map(function (it) {
        return { qid: it.ref.id, choix: it.choix, choixEleve: it.choixEleve };
      }),
      etat_meta: { niveau: niveauChoisi, partie_id: s.partieId }
    });
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
        Object.keys(LIBELLE_MODULE).forEach(function (m) {
          STIQuizSync.reinitialiserVus(m);
        });
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
    var tirees = preparerQuestionsMelangees(
      melanger(pool).slice(0, revTab ? pool.length : NB_PAR_SESSION)
    );
    sessionQuiz = { partieId: window.STIQuizSync && STIQuizSync.creerIdentifiantPartie ? STIQuizSync.creerIdentifiantPartie() : null,
      module: module, questions: tirees, index: 0, mode: "officiel", synchronise: false };
    sauvegarderProgressionTableauxCloud();
    afficherQuestion();
  }

  function afficherQuestion() {
    var s = sessionQuiz;
    var item = s.questions[s.index];
    var q = item.ref;
    var pct = Math.round((s.index / s.questions.length) * 100);
    var nbDejaRepondues = s.questions.filter(function (it) { return it.choixEleve !== -1; }).length;
    app.innerHTML =
      '<div class="qt-qmeta"><span class="qt-badge">' + ICO_MODULE[q.module] + " " + LIBELLE_MODULE[q.module] + "</span>" +
      "<span>Question " + (s.index + 1) + " / " + s.questions.length + (s.mode === "erreurs" ? " · révision erreurs" : (s.mode === "reviser_encore" ? " · réviser encore" : "")) + "</span></div>" +
      '<div class="qt-barre"><i style="width:' + pct + '%"></i></div>' +
      '<p class="qt-question">' + esc(q.q) + "</p>" +
      '<div class="qt-choix">' + item.choix.map(function (c, i) {
        return '<button type="button" class="qt-choix-btn' + (item.choixEleve === i ? " choisi" : "") + '" data-choix="' + i + '">' +
          "<strong>" + String.fromCharCode(65 + i) + ".</strong> " + esc(c) + "</button>";
      }).join("") + "</div>" +
      '<div class="qt-actions">' +
      '<button type="button" class="qt-btn" id="qt-suivant" ' + (item.choixEleve === -1 ? "disabled" : "") + ">" +
      (s.index + 1 === s.questions.length ? "🏁 Voir l'évaluation ✓" : "Question suivante →") + "</button>" +
      '<button type="button" class="qt-btn secondaire" id="qt-arreter">' +
      (nbDejaRepondues > 0 ? "⏹ Terminer & évaluer" : "Arrêter") + "</button></div>";
    app.querySelectorAll("[data-choix]").forEach(function (b) {
      b.addEventListener("click", function () {
        item.choixEleve = parseInt(b.getAttribute("data-choix"), 10);
        sauvegarderProgressionTableauxCloud();
        afficherQuestion();
      });
    });
    document.getElementById("qt-suivant").addEventListener("click", function () {
      s.index++;
      if (s.index >= s.questions.length) terminer();
      else {
        sauvegarderProgressionTableauxCloud();
        afficherQuestion();
      }
    });
    document.getElementById("qt-arreter").addEventListener("click", terminer);
  }

  function synchroniserSessionTableaux(s) {
    if (!s || s.synchronise) return;
    var repondues = s.questions.filter(function (it) { return it.choixEleve !== -1; });
    if (!repondues.length) return;
    s.synchronise = true;
    var bonnes = repondues.filter(function (it) { return it.choix[it.choixEleve] === it.ref.bonne; });
    var ordreFinal = repondues.map(function (it, idx) {
      return {
        rang: idx + 1,
        id: it.ref.id != null ? "tab-" + it.ref.id : (window.STIQuizSync ? STIQuizSync.hash(it.ref.q) : String(idx + 1)),
        enonce: it.ref.q,
        ok: it.choix[it.choixEleve] === it.ref.bonne
      };
    });
    if (s.mode === "officiel" || s.mode === "reviser_encore") {
      marquerVus(repondues.map(function (it) { return it.ref; }));
      var etat = etatEleve();
      var precedent = s.partieId && etat.resultats.find(function (r) { return r.partie_id === s.partieId; });
      if (!precedent || repondues.length > precedent.total) {
        if (precedent) etat.resultats = etat.resultats.filter(function (r) { return r !== precedent; });
        etat.resultats.push({
          partie_id: s.partieId, ts: Date.now(), module: s.module, niveau: niveauChoisi,
          score: bonnes.length, total: repondues.length
        });
      }
      etat.resultats = etat.resultats.slice(-200);
      sauverEtat(etat);
      if (window.STIQuizSync) {
        STIQuizSync.enregistrer("tableaux", bonnes.length, repondues.length, s.module, {
          points: bonnes.length * 10,
          ordre_questions: ordreFinal,
          partie_id: s.partieId
        });
      }
    } else if (window.STIQuizSync && STIQuizSync.effacerSession) {
      STIQuizSync.effacerSession("tableaux", s.partieId);
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
    if (!repondues.length) {
      s.synchronise = true;
      sessionQuiz = null;
      if (window.STIQuizSync && STIQuizSync.effacerSession) STIQuizSync.effacerSession("tableaux");
      if (window.STIQuizSync && STIQuizSync.quitterRevision) STIQuizSync.quitterRevision();
      afficherAccueil();
      return;
    }
    var bonnes = repondues.filter(function (it) { return it.choix[it.choixEleve] === it.ref.bonne; });
    synchroniserSessionTableaux(s);
    if (window.STIQuizSync && STIQuizSync.quitterRevision) STIQuizSync.quitterRevision();
    var erreurs = repondues.filter(function (it) { return it.choix[it.choixEleve] !== it.ref.bonne; });
    var pct = repondues.length ? Math.round((bonnes.length / repondues.length) * 100) : 0;

    var blocPointsAReviser = "";
    if (erreurs.length > 0) {
      var parModErr = {};
      erreurs.forEach(function (it) {
        var m = it.ref.module;
        if (!parModErr[m]) parModErr[m] = { count: 0, refs: [] };
        parModErr[m].count++;
        if (it.ref.ref && parModErr[m].refs.indexOf(it.ref.ref) === -1) {
          parModErr[m].refs.push(it.ref.ref);
        }
      });
      var modsTries = Object.keys(parModErr).sort(function (a, b) {
        return parModErr[b].count - parModErr[a].count;
      });
      blocPointsAReviser =
        '<section class="qt-points-reviser" aria-label="Points à réviser">' +
        "<h2>📌 Points à réviser en priorité (" + erreurs.length + " faute" + (erreurs.length > 1 ? "s" : "") + ")</h2>" +
        '<div class="qt-points-grille">' +
        modsTries.map(function (m) {
          var info = parModErr[m];
          var urlCours = LIEN_COURS_MODULE[m] || "../livre-smart.html";
          return '<div class="qt-point-carte">' +
            '<div class="qt-point-entete">' +
              "<span>" + (ICO_MODULE[m] || "📌") + " " + esc(LIBELLE_MODULE[m] || m) + " (" + info.count + ")</span>" +
              '<a class="qt-point-lien" href="' + esc(urlCours) + '">📖 Cours →</a>' +
            "</div>" +
            '<p class="qt-point-refs">Notions à revoir : ' + esc(info.refs.slice(0, 6).join(" · ")) +
              (info.refs.length > 6 ? "…" : "") + "</p>" +
          "</div>";
        }).join("") +
        "</div></section>";
    }

    app.innerHTML =
      "<h1>Évaluation <em>" + (s.mode === "erreurs" ? "de l'entraînement" : "de la session") + "</em></h1>" +
      '<p class="qt-score">' + bonnes.length + " / " + repondues.length + " bonnes réponses (" + pct + " %)</p>" +
      '<p class="qt-sous">' + (erreurs.length === 0 && repondues.length
        ? "Sans faute, bravo ! Aucun point à réviser sur ce tirage 🎉"
        : "Retrouvez ci-dessous vos points à réviser en priorité ainsi qu\u2019un conseil personnalisé pour chaque faute.") + "</p>" +
      blocPointsAReviser +
      repondues.map(function (it) {
        var ok = it.choix[it.choixEleve] === it.ref.bonne;
        return '<div class="qt-correction ' + (ok ? "ok" : "ko") + '">' +
          '<p class="qt-cq">' + (ok ? "✅" : "❌") + " " + esc(it.ref.q) + "</p>" +
          (ok
            ? '<p class="qt-ligne">Bonne réponse : <strong>' + esc(it.ref.bonne) + "</strong></p>"
            : '<p class="qt-ligne">Ta réponse : ' + esc(it.choix[it.choixEleve]) + "</p>" +
              '<p class="qt-ligne">Bonne réponse : <strong>' + esc(it.ref.bonne) + "</strong></p>" +
              '<div class="qt-conseil">💡 <strong>Conseil :</strong> ' + esc(conseilParFauteTab(it)) + "</div>") +
          '<span class="qt-ref">' + ICO_MODULE[it.ref.module] + " Tableau " + LIBELLE_MODULE[it.ref.module] +
          " — « " + esc(it.ref.ref) + " »</span></div>";
      }).join("") +
      '<div class="qt-actions">' +
      (erreurs.length
        ? '<button type="button" class="qt-btn" id="qt-erreurs">🎯 Revoir mes erreurs (' + erreurs.length + ")</button>"
        : "") +
      '<button type="button" class="qt-btn" id="qt-reviser-encore">🔁 Réviser encore une autre fois (même série)</button>' +
      '<button type="button" class="qt-btn" id="qt-encore">🎲 Nouvelles questions</button>' +
      '<button type="button" class="qt-btn secondaire" id="qt-accueil">← Choisir un autre module</button>' +
      '<a class="qt-btn secondaire" style="text-decoration:none" href="../index.html#modules">← Retour aux quiz</a></div>';
    var bErr = document.getElementById("qt-erreurs");
    if (bErr) bErr.addEventListener("click", function () {
      sessionQuiz = {
        partieId: window.STIQuizSync && STIQuizSync.creerIdentifiantPartie ? STIQuizSync.creerIdentifiantPartie() : null,
        module: s.module, mode: "erreurs", synchronise: false,
        questions: preparerQuestionsMelangees(erreurs.map(function (it) { return it.ref; })),
        index: 0
      };
      sauvegarderProgressionTableauxCloud();
      afficherQuestion();
    });
    var bRevEncore = document.getElementById("qt-reviser-encore");
    if (bRevEncore) bRevEncore.addEventListener("click", function () {
      /* Garde exactement le même ordre de questions pour vérifier sa progression, avec choix A/B/C/D remélangés */
      sessionQuiz = {
        partieId: window.STIQuizSync && STIQuizSync.creerIdentifiantPartie ? STIQuizSync.creerIdentifiantPartie() : null,
        module: s.module, mode: "reviser_encore", synchronise: false,
        questions: preparerQuestionsMelangees(s.questions.map(function (it) { return it.ref; })),
        index: 0
      };
      sauvegarderProgressionTableauxCloud();
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
