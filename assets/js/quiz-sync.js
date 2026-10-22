/* ═══ STI — Synchronisation centrale des quiz (v358, maj v362, réponses v365, révision v367) ═══
   Partagé par toutes les pages quiz. Enregistre CHAQUE partie jouée dans
   Supabase (sti_quiz_parties : score, total, %, date — rejouable à l'infini)
   et synchronise les questions déjà vues du Quiz des tableaux
   (sti_quiz_vus : tirage sans jamais répéter, entre appareils).
   - Silencieux si l'élève n'est pas connecté ou si les tables n'existent
     pas encore : le comportement local des quiz reste inchangé.
   - File d'attente locale : une partie non envoyée (hors ligne) est
     conservée et retentée au chargement suivant ET dès le retour de la
     connexion (événement « online »), sans recharger la page.
   - Exception : le compte laboratoire (elevelabo3@exemple.tn) n'envoie
     AUCUN score en ligne (compte partagé de classe) ; ses quiz restent
     en distribution aléatoire locale et sa banque se met à jour avec
     le site, comme pour tous. */
(function () {
  "use strict";
  var CLE_FILE = "sti-quiz-sync-file-v1";
  var CLE_FILE_VUS = "sti-quiz-sync-vus-v1";
  var COMPTES_SANS_SCORE = ["elevelabo3@exemple.tn"];
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
  function utilisateur() {
    if (promesseUser) return promesseUser;
    promesseUser = (async function () {
      var s = sb();
      if (!s) return null;
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

  /* ---------- File d'attente locale ---------- */
  function lireFile() {
    try { return JSON.parse(localStorage.getItem(CLE_FILE) || "[]"); } catch (e) { return []; }
  }
  function sauverFile(f) {
    try { localStorage.setItem(CLE_FILE, JSON.stringify(f.slice(-50))); } catch (e) {}
  }
  function mettreEnFile(ligne) {
    var f = lireFile();
    f.push(ligne);
    sauverFile(f);
  }
  async function viderFile() {
    var s = sb();
    var u = await utilisateur();
    if (!s || !u || sansScore(u)) return;
    var f = lireFile();
    if (f.length) {
      var reste = [];
      for (var i = 0; i < f.length; i++) {
        try {
          var r = await s.from("sti_quiz_parties").insert(f[i]);
          if (r.error) reste.push(f[i]);
        } catch (e) { reste.push(f[i]); }
      }
      sauverFile(reste);
    }
    await viderFileRep(s, u);
    var fv = lireFileVus();
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
        if (ok) sauverFileVus([]);
      } catch (e) {}
    }
  }
  function lireFileVus() {
    try { return JSON.parse(localStorage.getItem(CLE_FILE_VUS) || "[]"); } catch (e) { return []; }
  }
  function sauverFileVus(f) {
    try { localStorage.setItem(CLE_FILE_VUS, JSON.stringify(f.slice(-2000))); } catch (e) {}
  }
  function mettreVusEnFile(module, ids) {
    var f = lireFileVus();
    ids.forEach(function (id) { f.push({ module: String(module), question_id: String(id) }); });
    sauverFileVus(f);
  }

  /* ---------- Réponses question par question (v365) ---------- */
  function hashTxt(t) {
    var h = 5381, x = String(t == null ? "" : t);
    for (var i = 0; i < x.length; i++) h = (((h << 5) + h) ^ x.charCodeAt(i)) >>> 0;
    return "h" + h.toString(36);
  }
  var CLE_FILE_REP = "sti-quiz-sync-rep-v1";
  function lireFileRep() {
    try { return JSON.parse(localStorage.getItem(CLE_FILE_REP) || "[]"); } catch (e) { return []; }
  }
  function sauverFileRep(f) {
    try { localStorage.setItem(CLE_FILE_REP, JSON.stringify(f.slice(-500))); } catch (e) {}
  }
  function mettreRepEnFile(lignes) {
    var f = lireFileRep();
    lignes.forEach(function (l) {
      f.push({ quiz: l.quiz, module: l.module, question_id: l.question_id, enonce: l.enonce, correct: l.correct });
    });
    sauverFileRep(f);
  }
  async function enregistrerReponses(quiz, module, liste) {
    if (!quiz || !liste || !liste.length) return false;
    var s = sb();
    var u = await utilisateur();
    if (!s || !u || sansScore(u)) return false;
    var lignes = [];
    liste.slice(0, 120).forEach(function (r) {
      if (!r) return;
      lignes.push({
        user_id: u.id, email: u.email, quiz: String(quiz),
        module: module ? String(module) : null,
        question_id: String(r.id != null && r.id !== "" ? r.id : hashTxt(r.enonce)),
        enonce: String(r.enonce == null ? "" : r.enonce).slice(0, 200),
        correct: !!r.ok
      });
    });
    if (!lignes.length) return false;
    try {
      for (var i = 0; i < lignes.length; i += 200) {
        var r2 = await s.from("sti_quiz_reponses").insert(lignes.slice(i, i + 200));
        if (r2.error) { mettreRepEnFile(lignes); return false; }
      }
      return true;
    } catch (e) { mettreRepEnFile(lignes); return false; }
  }
  async function viderFileRep(s, u) {
    var f = lireFileRep();
    if (!f.length) return;
    var lignes = f.map(function (l) {
      return { user_id: u.id, email: u.email, quiz: l.quiz, module: l.module,
               question_id: l.question_id, enonce: l.enonce, correct: l.correct };
    });
    try {
      for (var i = 0; i < lignes.length; i += 200) {
        var r = await s.from("sti_quiz_reponses").insert(lignes.slice(i, i + 200));
        if (r.error) return;
      }
      sauverFileRep([]);
    } catch (e) {}
  }

  /* ---------- API publique ---------- */
  async function enregistrer(quiz, score, total, module) {
    score = parseInt(score, 10);
    total = parseInt(total, 10);
    if (!quiz || isNaN(score) || isNaN(total) || total <= 0 || score < 0 || score > total) return false;
    var s = sb();
    var u = await utilisateur();
    if (!s || !u || sansScore(u)) return false;
    var ligne = {
      user_id: u.id, email: u.email, quiz: String(quiz),
      module: module ? String(module) : null, score: score, total: total
    };
    try {
      var r = await s.from("sti_quiz_parties").insert(ligne);
      if (r.error) { mettreEnFile(ligne); return false; }
      return true;
    } catch (e) { mettreEnFile(ligne); return false; }
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
      var r = await s.from("sti_quiz_vus").select("module,question_id").limit(5000);
      if (r.error || !r.data) return null;
      var sortie = {};
      r.data.forEach(function (l) {
        if (!sortie[l.module]) sortie[l.module] = [];
        sortie[l.module].push(l.question_id);
      });
      return sortie;
    } catch (e) { return null; }
  }

  async function marquerVus(module, ids) {
    var s = sb();
    var u = await utilisateur();
    if (!s || !u || !module || !ids || !ids.length) return false;
    if (sansScore(u)) return false;
    var lignes = ids.map(function (id) {
      return { user_id: u.id, module: String(module), question_id: String(id) };
    });
    try {
      for (var i = 0; i < lignes.length; i += 200) {
        var r = await s.from("sti_quiz_vus").upsert(lignes.slice(i, i + 200), {
          onConflict: "user_id,module,question_id", ignoreDuplicates: true
        });
        if (r.error) { mettreVusEnFile(module, ids); return false; }
      }
      return true;
    } catch (e) { mettreVusEnFile(module, ids); return false; }
  }

  window.STIQuizSync = {
    enregistrer: enregistrer,
    enregistrerReponses: enregistrerReponses,
    hash: hashTxt,
    preparerRevision: preparerRevision,
    revisionIds: revisionIds,
    quitterRevision: quitterRevision,
    resume: resume,
    chargerVus: chargerVus,
    marquerVus: marquerVus,
    utilisateur: utilisateur
  };

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

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", viderFile);
  else viderFile();
  window.addEventListener("online", viderFile);
})();
