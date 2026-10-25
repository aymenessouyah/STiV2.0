/* ═══ STI — Synchronisation centrale des quiz (v358, maj v362, réponses v365, révision v367, fiabilité v455) ═══
   Partagé par toutes les pages quiz. Enregistre CHAQUE partie jouée dans
   Supabase (sti_quiz_parties : score, total, %, date — rejouable à l'infini)
   et les réponses question par question (sti_quiz_reponses : alimente « Mes erreurs »),
   ainsi que les questions déjà vues du Quiz des tableaux
   (sti_quiz_vus : tirage sans jamais répéter, entre appareils).
   - File d'attente locale write-ahead (v455) : toute partie ou liste de réponses
     est inscrite immédiatement en localStorage AVANT la requête réseau, puis
     retirée dès confirmation d'insertion. Même si l'élève clique sur « Retour »
     dans la foulée, rien n'est perdu : la page suivante (accueil ou « Mes erreurs »)
     vide automatiquement la file avant lecture.
   - Silencieux si l'élève n'est pas connecté ou si les tables n'existent
     pas encore : le comportement local des quiz reste inchangé.
   - Exception : le compte laboratoire (elevelabo3@exemple.tn) n'envoie
     AUCUN score en ligne (compte partagé de classe). */
(function () {
  "use strict";
  var CLE_FILE = "sti-quiz-sync-file-v1";
  var CLE_FILE_VUS = "sti-quiz-sync-vus-v1";
  var CLE_PURGE_VUS = "sti-quiz-sync-vus-purge-v1";
  var CLE_FILE_REP = "sti-quiz-sync-rep-v1";
  var COMPTES_SANS_SCORE = ["elevelabo3@exemple.tn"];
  var seqSync = 0;
  var promesseVidage = null;
  var cidsEnVol = {};

  function nouveauCid() {
    seqSync = (seqSync + 1) % 1000000;
    return "c-" + Date.now().toString(36) + "-" + seqSync.toString(36) + "-" + Math.random().toString(36).slice(2, 6);
  }
  function sansScore(u) {
    return !!(u && u.email && COMPTES_SANS_SCORE.indexOf(String(u.email).toLowerCase()) !== -1);
  }
  var client = null;
  var promesseUser = null;

  function sb() {
    if (!window.supabase || !window.STI_AUTH) return null;
    if (!client) {
      client = window.supabase.createClient(window.STI_AUTH.URL, window.STI_AUTH.CLE);
      try {
        client.auth.onAuthStateChange(function () { promesseUser = null; });
      } catch (e) {}
    }
    return client;
  }

  function utilisateurDepuisStockageLocal() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!k || !/^sb-.*-auth-token$/.test(k)) continue;
        var brut = localStorage.getItem(k);
        if (!brut) continue;
        var parsed = JSON.parse(brut);
        var u = (parsed && parsed.user) || (parsed && parsed.currentSession && parsed.currentSession.user) || null;
        if (u && u.id) return { id: String(u.id), email: u.email || null };
      }
    } catch (e) {}
    return null;
  }

  function utilisateur() {
    if (promesseUser) return promesseUser;
    promesseUser = (async function () {
      var s = sb();
      if (!s) return utilisateurDepuisStockageLocal();
      try {
        if (s.auth && typeof s.auth.getSession === "function") {
          var rs = await s.auth.getSession();
          if (rs && rs.data && rs.data.session && rs.data.session.user) {
            var us = rs.data.session.user;
            return { id: us.id, email: us.email || null };
          }
        }
      } catch (e0) {}
      var loc = utilisateurDepuisStockageLocal();
      if (loc) return loc;
      try {
        var r = await s.auth.getUser();
        if (r && r.data && r.data.user) return { id: r.data.user.id, email: r.data.user.email || null };
      } catch (e) {}
      return null;
    })();
    return promesseUser;
  }
  function pctDe(score, total) {
    return total > 0 ? Math.round((score * 1000) / total) / 10 : 0;
  }

  /* ---------- File d'attente locale (parties) ---------- */
  function lireFile() {
    try { return JSON.parse(localStorage.getItem(CLE_FILE) || "[]"); } catch (e) { return []; }
  }
  function sauverFile(f) {
    try { localStorage.setItem(CLE_FILE, JSON.stringify(f.slice(-80))); } catch (e) {}
  }
  function mettreEnFile(ligne) {
    var f = lireFile();
    f.push(ligne);
    sauverFile(f);
  }
  function retirerCidFile(cid) {
    if (!cid) return;
    var f = lireFile().filter(function (x) { return !x || x._cid !== cid; });
    sauverFile(f);
  }

  /* ---------- File d'attente locale (questions vues Tableaux + purges modules épuisés v456) ---------- */
  function lireFileVus() {
    try { return JSON.parse(localStorage.getItem(CLE_FILE_VUS) || "[]"); } catch (e) { return []; }
  }
  function sauverFileVus(f) {
    try { localStorage.setItem(CLE_FILE_VUS, JSON.stringify(f.slice(-2000))); } catch (e) {}
  }
  function mettreVusEnFile(module, ids, cid) {
    var f = lireFileVus();
    ids.forEach(function (id) {
      f.push({ _cid: cid || null, module: String(module), question_id: String(id) });
    });
    sauverFileVus(f);
  }
  function retirerCidVus(cid) {
    if (!cid) return;
    var f = lireFileVus().filter(function (v) { return !v || v._cid !== cid; });
    sauverFileVus(f);
  }
  function lirePurgeVus() {
    try { return JSON.parse(localStorage.getItem(CLE_PURGE_VUS) || "[]"); } catch (e) { return []; }
  }
  function sauverPurgeVus(liste) {
    try {
      var uniq = [];
      (liste || []).forEach(function (m) {
        var s = String(m || "");
        if (s && uniq.indexOf(s) === -1) uniq.push(s);
      });
      localStorage.setItem(CLE_PURGE_VUS, JSON.stringify(uniq.slice(-30)));
    } catch (e) {}
  }
  function retirerModuleFileVus(module) {
    var mod = String(module || "");
    if (!mod) return;
    var f = mod === "*" ? [] : lireFileVus().filter(function (v) { return v && String(v.module) !== mod; });
    sauverFileVus(f);
  }
  function retirerModulePurgeVus(module) {
    var mod = String(module || "");
    if (!mod) return;
    if (mod === "*") { sauverPurgeVus([]); return; }
    sauverPurgeVus(lirePurgeVus().filter(function (m) { return m !== mod; }));
  }

  /* ---------- Lecture paginée PostgREST (> 1 000 lignes v456) ---------- */
  async function lireToutPagine(fabriquerRequete, maxLignes, taillePage) {
    var pas = taillePage || 1000;
    var plafond = maxLignes || 5000;
    var cumul = [];
    for (var offset = 0; offset < plafond; offset += pas) {
      var fin = Math.min(offset + pas, plafond) - 1;
      var req = fabriquerRequete();
      var r = (req && typeof req.range === "function")
        ? await req.range(offset, fin)
        : await req.limit(plafond);
      if (r && r.error) return { data: null, error: r.error };
      var lot = (r && r.data) || [];
      cumul = cumul.concat(lot);
      if (!req || typeof req.range !== "function" || lot.length < (fin - offset + 1)) break;
    }
    return { data: cumul, error: null };
  }

  /* ---------- Réponses question par question (v365 / write-ahead v455) ---------- */
  function hashTxt(t) {
    var h = 5381, x = String(t == null ? "" : t);
    for (var i = 0; i < x.length; i++) h = (((h << 5) + h) ^ x.charCodeAt(i)) >>> 0;
    return "h" + h.toString(36);
  }
  function lireFileRep() {
    try { return JSON.parse(localStorage.getItem(CLE_FILE_REP) || "[]"); } catch (e) { return []; }
  }
  function sauverFileRep(f) {
    try { localStorage.setItem(CLE_FILE_REP, JSON.stringify(f.slice(-600))); } catch (e) {}
  }
  function mettreRepEnFile(lignes, cid) {
    var f = lireFileRep();
    lignes.forEach(function (l) {
      f.push({
        _cid: cid || l._cid || null,
        quiz: l.quiz,
        module: l.module,
        question_id: l.question_id,
        enonce: l.enonce,
        correct: !!l.correct
      });
    });
    sauverFileRep(f);
  }
  function retirerCidRep(cid) {
    if (!cid) return;
    var f = lireFileRep().filter(function (x) { return !x || x._cid !== cid; });
    sauverFileRep(f);
  }

  async function enregistrerReponses(quiz, module, liste) {
    if (!quiz || !liste || !liste.length) return false;
    var preLignes = [];
    liste.slice(0, 120).forEach(function (r) {
      if (!r) return;
      preLignes.push({
        quiz: String(quiz),
        module: r.module ? String(r.module) : (module ? String(module) : null),
        question_id: String(r.id != null && r.id !== "" ? r.id : hashTxt(r.enonce)),
        enonce: String(r.enonce == null ? "" : r.enonce).slice(0, 200),
        correct: !!r.ok
      });
    });
    if (!preLignes.length) return false;

    /* Sauvegarde locale immédiate AVANT tout await (survit à un clic immédiat sur « Retour ») */
    var cid = nouveauCid();
    cidsEnVol[cid] = true;
    mettreRepEnFile(preLignes, cid);

    try {
      var s = sb();
      var u = await utilisateur();
      if (sansScore(u)) {
        retirerCidRep(cid);
        return false;
      }
      if (!s || !u) return false;
      var lignes = preLignes.map(function (l) {
        return {
          user_id: u.id,
          email: u.email,
          quiz: l.quiz,
          module: l.module,
          question_id: l.question_id,
          enonce: l.enonce,
          correct: l.correct
        };
      });
      for (var i = 0; i < lignes.length; i += 200) {
        var r2 = await s.from("sti_quiz_reponses").insert(lignes.slice(i, i + 200));
        if (r2.error) return false;
      }
      retirerCidRep(cid);
      return true;
    } catch (e) {
      return false;
    } finally {
      delete cidsEnVol[cid];
    }
  }

  async function viderFileRep(s, u) {
    var tout = lireFileRep();
    var prets = tout.filter(function (l) { return l && (!l._cid || !cidsEnVol[l._cid]); });
    if (!prets.length) return;
    var lignes = prets.map(function (l) {
      return {
        user_id: u.id,
        email: u.email,
        quiz: String(l.quiz),
        module: l.module ? String(l.module) : null,
        question_id: String(l.question_id),
        enonce: String(l.enonce == null ? "" : l.enonce).slice(0, 200),
        correct: !!l.correct
      };
    });
    try {
      for (var i = 0; i < lignes.length; i += 200) {
        var r = await s.from("sti_quiz_reponses").insert(lignes.slice(i, i + 200));
        if (r.error) return;
      }
      var envoyes = new Set(prets);
      var restant = lireFileRep().filter(function (l) {
        if (!l) return false;
        if (l._cid && cidsEnVol[l._cid]) return true;
        for (var k = 0; k < prets.length; k++) {
          if (prets[k]._cid && l._cid === prets[k]._cid) return false;
          if (!prets[k]._cid && !l._cid && l.quiz === prets[k].quiz && l.question_id === prets[k].question_id && l.enonce === prets[k].enonce) return false;
        }
        return !envoyes.has(l);
      });
      sauverFileRep(restant);
    } catch (e) {}
  }

  async function viderFileInterne() {
    var s = sb();
    var u = await utilisateur();
    if (!s || !u) return;
    if (sansScore(u)) {
      sauverFile([]);
      sauverFileRep([]);
      sauverFileVus([]);
      sauverPurgeVus([]);
      return;
    }
    var f = lireFile();
    var prets = f.filter(function (x) { return x && (!x._cid || !cidsEnVol[x._cid]); });
    if (prets.length) {
      var cidsEchec = {};
      var restesSansCid = [];
      for (var i = 0; i < prets.length; i++) {
        var item = prets[i];
        var payload = {
          user_id: item.user_id || u.id,
          email: item.email !== undefined ? item.email : u.email,
          quiz: String(item.quiz),
          module: item.module ? String(item.module) : null,
          score: parseInt(item.score, 10),
          total: parseInt(item.total, 10)
        };
        if (!payload.quiz || isNaN(payload.score) || isNaN(payload.total) || payload.total <= 0) continue;
        try {
          var r = await s.from("sti_quiz_parties").insert(payload);
          if (r.error) {
            if (item._cid) cidsEchec[item._cid] = true;
            else restesSansCid.push(item);
          }
        } catch (e) {
          if (item._cid) cidsEchec[item._cid] = true;
          else restesSansCid.push(item);
        }
      }
      var cidsTraites = {};
      prets.forEach(function (p) { if (p._cid) cidsTraites[p._cid] = true; });
      var nouvFile = lireFile().filter(function (x) {
        if (!x) return false;
        if (x._cid && cidsEnVol[x._cid]) return true;
        if (x._cid && cidsTraites[x._cid]) return !!cidsEchec[x._cid];
        return false;
      }).concat(restesSansCid);
      sauverFile(nouvFile);
    }
    await viderFileRep(s, u);
    var purges = lirePurgeVus();
    if (purges.length && typeof s.from === "function") {
      var purgesRestantes = [];
      for (var p = 0; p < purges.length; p++) {
        var modP = String(purges[p] || "");
        if (!modP) continue;
        try {
          var tblDel = s.from("sti_quiz_vus");
          if (!tblDel || typeof tblDel.delete !== "function") { purgesRestantes.push(modP); continue; }
          var qDel = tblDel.delete().eq("user_id", u.id);
          if (modP !== "*") qDel = qDel.eq("module", modP);
          var rDel = await qDel;
          if (rDel && rDel.error) purgesRestantes.push(modP);
        } catch (eDel) {
          purgesRestantes.push(modP);
        }
      }
      sauverPurgeVus(purgesRestantes);
    }
    var fv = lireFileVus().filter(function (v) { return v && (!v._cid || !cidsEnVol[v._cid]); });
    if (fv.length) {
      var lignes = fv.map(function (v) {
        return { user_id: u.id, module: String(v.module), question_id: String(v.question_id) };
      });
      try {
        var ok = true;
        for (var j = 0; j < lignes.length; j += 200) {
          var rv = await s.from("sti_quiz_vus").upsert(lignes.slice(j, j + 200), {
            onConflict: "user_id,module,question_id", ignoreDuplicates: true
          });
          if (rv.error) { ok = false; break; }
        }
        if (ok) {
          var envoyesVus = new Set(fv);
          sauverFileVus(lireFileVus().filter(function (v) {
            if (!v) return false;
            if (v._cid && cidsEnVol[v._cid]) return true;
            for (var kv = 0; kv < fv.length; kv++) {
              if (fv[kv]._cid && v._cid === fv[kv]._cid) return false;
              if (!fv[kv]._cid && !v._cid && v.module === fv[kv].module && v.question_id === fv[kv].question_id) return false;
            }
            return !envoyesVus.has(v);
          }));
        }
      } catch (e) {}
    }
  }

  function viderFile() {
    if (promesseVidage) return promesseVidage;
    promesseVidage = viderFileInterne().catch(function () {}).then(function () {
      promesseVidage = null;
    });
    return promesseVidage;
  }

  var NOMS_QUIZ_ACCES = {
    "html-css": "Quiz HTML/CSS",
    "javascript": "Quiz JS",
    "sql": "Quiz SQL",
    "php": "Quiz PHP",
    "tableaux": "Quiz Tableaux"
  };

  /* ---------- API publique ---------- */
  async function enregistrer(quiz, score, total, module) {
    score = parseInt(score, 10);
    total = parseInt(total, 10);
    if (!quiz || isNaN(score) || isNaN(total) || total <= 0 || score < 0 || score > total) return false;

    /* Notification immédiate vers acces.js / sti-mes-scores (note réelle /20 avant tout départ de page) */
    var sur20Calc = Math.round((score / total) * 200) / 10;
    var pctCalc = Math.round((score * 100) / total);
    var nomAcces = NOMS_QUIZ_ACCES[String(quiz)] || ("Quiz " + String(quiz));
    var noteAcces = score + "/" + total + " (" + Math.round(sur20Calc) + "/20 · " + pctCalc + "%)";
    try {
      window.__stiDernierScoreQuiz = {
        quiz: String(quiz),
        nomQuiz: nomAcces,
        score: score,
        total: total,
        pct: pctCalc,
        sur20: sur20Calc,
        note: noteAcces,
        ts: Date.now()
      };
      if (typeof window.__notifierScoreQuizAccesSTI === "function") {
        window.__notifierScoreQuizAccesSTI(nomAcces, noteAcces, sur20Calc);
      }
    } catch (ePont) {}

    /* Sauvegarde locale immédiate AVANT tout await */
    var cid = nouveauCid();
    cidsEnVol[cid] = true;
    mettreEnFile({
      _cid: cid,
      quiz: String(quiz),
      module: module ? String(module) : null,
      score: score,
      total: total
    });

    try {
      var s = sb();
      var u = await utilisateur();
      if (sansScore(u)) {
        retirerCidFile(cid);
        return false;
      }
      if (!s || !u) return false;
      var ligne = {
        user_id: u.id,
        email: u.email,
        quiz: String(quiz),
        module: module ? String(module) : null,
        score: score,
        total: total
      };
      var r = await s.from("sti_quiz_parties").insert(ligne);
      if (r.error) return false;
      retirerCidFile(cid);
      return true;
    } catch (e) {
      return false;
    } finally {
      delete cidsEnVol[cid];
    }
  }

  async function resume(quiz) {
    var s = sb();
    var u = await utilisateur();
    if (!s || !u) return null;
    if (sansScore(u)) return { parties: 0, dernier: null, meilleur: null };
    try {
      var q = s.from("sti_quiz_parties").select("score,total,module,cree_le")
        .order("cree_le", { ascending: false }).limit(300);
      if (quiz) q = q.eq("quiz", quiz);
      var r = await q;
      if (r.error || !r.data) return null;
      var lignes = r.data;
      if (!lignes.length) return { parties: 0, dernier: null, meilleur: null };
      var meilleur = lignes[0];
      lignes.forEach(function (l) {
        if (pctDe(l.score, l.total) > pctDe(meilleur.score, meilleur.total)) meilleur = l;
      });
      function forme(l) {
        return { score: l.score, total: l.total, pct: pctDe(l.score, l.total), date: l.cree_le, module: l.module || null };
      }
      return { parties: lignes.length, dernier: forme(lignes[0]), meilleur: forme(meilleur) };
    } catch (e) { return null; }
  }

  async function chargerVus() {
    var s = sb();
    var u = await utilisateur();
    if (!s || !u || sansScore(u)) return null;
    try {
      await viderFile();
      var r = await lireToutPagine(function () {
        return s.from("sti_quiz_vus").select("module,question_id").eq("user_id", u.id);
      }, 6000, 1000);
      if (r.error || !r.data) return null;
      var enPurge = {};
      lirePurgeVus().forEach(function (m) { enPurge[m] = true; });
      if (enPurge["*"]) return {};
      var sortie = {};
      r.data.forEach(function (l) {
        if (!l || enPurge[l.module]) return;
        if (!sortie[l.module]) sortie[l.module] = [];
        if (sortie[l.module].indexOf(l.question_id) === -1) sortie[l.module].push(l.question_id);
      });
      lireFileVus().forEach(function (v) {
        if (!v || !v.module || enPurge[v.module]) return;
        if (!sortie[v.module]) sortie[v.module] = [];
        if (sortie[v.module].indexOf(v.question_id) === -1) sortie[v.module].push(v.question_id);
      });
      return sortie;
    } catch (e) { return null; }
  }

  async function marquerVus(module, ids) {
    if (!module || !ids || !ids.length) return false;
    var cid = nouveauCid();
    cidsEnVol[cid] = true;
    mettreVusEnFile(module, ids, cid);
    try {
      var s = sb();
      var u = await utilisateur();
      if (sansScore(u)) {
        retirerCidVus(cid);
        return false;
      }
      if (!s || !u) return false;
      var lignes = ids.map(function (id) {
        return { user_id: u.id, module: String(module), question_id: String(id) };
      });
      for (var i = 0; i < lignes.length; i += 200) {
        var r = await s.from("sti_quiz_vus").upsert(lignes.slice(i, i + 200), {
          onConflict: "user_id,module,question_id", ignoreDuplicates: true
        });
        if (r.error) return false;
      }
      retirerCidVus(cid);
      return true;
    } catch (e) {
      return false;
    } finally {
      delete cidsEnVol[cid];
    }
  }

  async function reinitialiserVus(module) {
    var mod = String(module || "");
    if (!mod) return false;
    retirerModuleFileVus(mod);
    var pActuel = lirePurgeVus();
    pActuel.push(mod);
    sauverPurgeVus(pActuel);
    try {
      var s = sb();
      var u = await utilisateur();
      if (sansScore(u)) {
        retirerModulePurgeVus(mod);
        return false;
      }
      if (!s || !u) return false;
      var tblDel = s.from("sti_quiz_vus");
      if (!tblDel || typeof tblDel.delete !== "function") return false;
      var qDel = tblDel.delete().eq("user_id", u.id);
      if (mod !== "*") qDel = qDel.eq("module", mod);
      var r = await qDel;
      if (r && r.error) return false;
      retirerModulePurgeVus(mod);
      return true;
    } catch (e) {
      return false;
    }
  }

  async function chargerReponses(maxLignes) {
    var s = sb();
    var u = await utilisateur();
    if (!s || !u) return null;
    if (sansScore(u)) return [];
    try {
      await viderFile();
    } catch (eV) {}
    var distantes = null;
    try {
      var r = await lireToutPagine(function () {
        return s.from("sti_quiz_reponses")
          .select("quiz,module,question_id,enonce,correct,cree_le")
          .eq("user_id", u.id)
          .order("cree_le", { ascending: false });
      }, maxLignes || 6000, 1000);
      if (!r.error && r.data) distantes = r.data;
    } catch (eR) {}
    var locales = lireFileRep().slice().reverse().map(function (l) {
      return {
        quiz: l.quiz,
        module: l.module || null,
        question_id: l.question_id,
        enonce: l.enonce || "",
        correct: !!l.correct,
        cree_le: new Date().toISOString()
      };
    });
    if (distantes === null) return locales.length ? locales : null;
    return locales.concat(distantes);
  }

  /* ---------- Mode « Retravailler mes erreurs » (v367) ---------- */
  var CLE_REVISION = "sti-revision-erreurs-v1";
  function preparerRevision(quiz, ids) {
    try {
      localStorage.setItem(CLE_REVISION, JSON.stringify({ quiz: String(quiz), ids: ids || [], ts: Date.now() }));
    } catch (e) {}
  }
  function revisionIds(quiz) {
    try {
      if (!/[?&]revision=erreurs/.test(window.location.search || "")) return null;
      var h = JSON.parse(localStorage.getItem(CLE_REVISION) || "null");
      if (!h || h.quiz !== quiz || !h.ids || !h.ids.length) return null;
      if (Date.now() - (h.ts || 0) > 2 * 3600 * 1000) return null;
      return h.ids;
    } catch (e) { return null; }
  }
  function quitterRevision() {
    try { localStorage.removeItem(CLE_REVISION); } catch (e) {}
  }

  window.STIQuizSync = {
    enregistrer: enregistrer,
    enregistrerReponses: enregistrerReponses,
    chargerReponses: chargerReponses,
    lireToutPagine: lireToutPagine,
    viderFile: viderFile,
    hash: hashTxt,
    preparerRevision: preparerRevision,
    revisionIds: revisionIds,
    quitterRevision: quitterRevision,
    resume: resume,
    chargerVus: chargerVus,
    marquerVus: marquerVus,
    reinitialiserVus: reinitialiserVus,
    utilisateur: utilisateur
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", viderFile);
  else viderFile();
  window.addEventListener("online", viderFile);
})();
