/* ═══ STI — Synchronisation centrale des quiz (v358) ═══
   Partagé par toutes les pages quiz. Enregistre CHAQUE partie jouée dans
   Supabase (sti_quiz_parties : score, total, %, date — rejouable à l'infini)
   et synchronise les questions déjà vues du Quiz des tableaux
   (sti_quiz_vus : tirage sans jamais répéter, entre appareils).
   - Silencieux si l'élève n'est pas connecté ou si les tables n'existent
     pas encore : le comportement local des quiz reste inchangé.
   - File d'attente locale : une partie non envoyée (hors ligne) est
     conservée et retentée au chargement suivant. */
(function () {
  "use strict";
  var CLE_FILE = "sti-quiz-sync-file-v1";
  var client = null;
  var promesseUser = null;

  function sb() {
    if (!window.supabase || !window.STI_AUTH) return null;
    if (!client) client = window.supabase.createClient(window.STI_AUTH.URL, window.STI_AUTH.CLE);
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
    if (!s || !u) return;
    var f = lireFile();
    if (!f.length) return;
    var reste = [];
    for (var i = 0; i < f.length; i++) {
      try {
        var r = await s.from("sti_quiz_parties").insert(f[i]);
        if (r.error) reste.push(f[i]);
      } catch (e) { reste.push(f[i]); }
    }
    sauverFile(reste);
  }

  /* ---------- API publique ---------- */
  async function enregistrer(quiz, score, total, module) {
    score = parseInt(score, 10);
    total = parseInt(total, 10);
    if (!quiz || isNaN(score) || isNaN(total) || total <= 0 || score < 0 || score > total) return false;
    var s = sb();
    var u = await utilisateur();
    if (!s || !u) return false;
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
    if (!s || !u) return null;
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
    var lignes = ids.map(function (id) {
      return { user_id: u.id, module: String(module), question_id: String(id) };
    });
    try {
      for (var i = 0; i < lignes.length; i += 200) {
        var r = await s.from("sti_quiz_vus").upsert(lignes.slice(i, i + 200), {
          onConflict: "user_id,module,question_id", ignoreDuplicates: true
        });
        if (r.error) return false;
      }
      return true;
    } catch (e) { return false; }
  }

  window.STIQuizSync = {
    enregistrer: enregistrer,
    resume: resume,
    chargerVus: chargerVus,
    marquerVus: marquerVus,
    utilisateur: utilisateur
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", viderFile);
  else viderFile();
})();
