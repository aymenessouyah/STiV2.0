/* ═════════ STI v439 — ANALYSE PAR TYPE D'ERREUR (côté professeur) ═════════
   La plateforme notait ; elle explique désormais POURQUOI un élève perd des points, à partir
   de la table « sti_quiz_reponses » (une ligne par question répondue : élève, quiz, question,
   correct oui/non) que les quiz alimentent déjà — aucune nouvelle saisie.

   Trois profils par question, calculés sur toutes ses réponses :
   - 🔴 NE SAIT PAS      : jamais réussie (0 bonne réponse) ;
   - 🟠 SAIT MAIS SE TROMPE : réussie au moins une fois ET ratée au moins une fois (instable) ;
   - 🟢 MAÎTRISE         : toujours réussie.
   Pour chaque élève on compte ces trois profils → un conseil différent :
     « reprendre le cours » / « refaire des exercices » / « entretenir ».

   Bonus (le pendant « qualité du contenu ») : questions SUSPECTES
   - réussite < 25 % → énoncé ambigu, correction douteuse ou notion non vue ;
   - réussite = 100 % sur au moins 8 réponses → question trop facile / indice dans la page.

   Lectures seules. Monté uniquement si #erreurs-admin existe (aucun effet côté élève).
   API de test : window.STI_TYPES_ERREUR.{calculer, analyser, csv, lignes, questions}. */
(function () {
  "use strict";
  if (window.__STI_TYPES_ERREUR) return;
  window.__STI_TYPES_ERREUR = true;
  var doc = document;
  var section = doc.getElementById("erreurs-admin");
  if (!section) return;

  var cfg = window.STI_AUTH || { URL: "https://vywujxmepvcbgedgmger.supabase.co", CLE: "sb_publishable_FI5FimytONd5VdWK6GfXLA_I6vPTrvn" };
  var MAX_LIGNES = 20000, SEUIL_FAIBLE = 25, MIN_REPONSES_SUSPECTE = 8;
  var client = null, dernier = [], dernierQ = [];

  var elClasse = doc.getElementById("err-classe");
  var elMin = doc.getElementById("err-min");
  var elEtat = doc.getElementById("err-etat");
  var elCorps = doc.getElementById("err-corps");
  var elQ = doc.getElementById("err-questions");
  var btnCalc = doc.getElementById("btn-err-generer");
  var btnCsv = doc.getElementById("btn-err-csv");
  if (!btnCalc || !elCorps) return;

  function sb() {
    if (client) return client;
    try { client = window.supabase.createClient(cfg.URL, cfg.CLE, { auth: { persistSession: true, autoRefreshToken: false } }); }
    catch (e) { client = null; }
    return client;
  }
  function etat(t, c) { if (elEtat) { elEtat.textContent = t; elEtat.style.color = c || ""; } }
  function ech(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function nomDe(p) { var n = String((p.prenom || "") + " " + (p.nom || "")).trim(); return n || p.email || p.id; }

  /* Fonction PURE (testable) : réponses brutes + profils → profils d'erreur par élève + questions. */
  function analyser(profils, reponses, minReponses) {
    minReponses = minReponses || 1;
    var parEleve = {};      /* uid -> { q: { qid: {ok, ko, enonce, quiz} } } */
    var parQuestion = {};   /* quiz|qid -> {n, ok, enonce, quiz} */
    (reponses || []).forEach(function (r) {
      if (!r || !r.user_id || !r.question_id) return;
      var uid = r.user_id, qid = String(r.question_id), quiz = String(r.quiz || "");
      var cle = quiz + "|" + qid;
      var e = parEleve[uid] || (parEleve[uid] = {});
      var q = e[cle] || (e[cle] = { ok: 0, ko: 0, enonce: r.enonce || "", quiz: quiz });
      if (r.correct) q.ok++; else q.ko++;
      var g = parQuestion[cle] || (parQuestion[cle] = { n: 0, ok: 0, enonce: r.enonce || "", quiz: quiz, qid: qid });
      g.n++; if (r.correct) g.ok++;
    });

    var lignes = (profils || []).map(function (p) {
      var e = parEleve[p.id] || {};
      var jamais = 0, instable = 0, maitrise = 0, detailJamais = [];
      Object.keys(e).forEach(function (cle) {
        var q = e[cle];
        if (!q.ok && q.ko) { jamais++; if (detailJamais.length < 4) detailJamais.push(q.enonce || cle); }
        else if (q.ok && q.ko) instable++;
        else if (q.ok) maitrise++;
      });
      var total = jamais + instable + maitrise;
      var profil = total >= minReponses
        ? (jamais > instable && jamais >= maitrise ? "reprendre"
          : (instable >= jamais && instable >= maitrise ? "exercices" : "entretien"))
        : null;
      var conseil = profil === "reprendre" ? "📘 Reprendre le cours"
        : profil === "exercices" ? "✍️ Refaire des exercices"
        : profil === "entretien" ? "✅ Entretenir" : "—";
      return {
        id: p.id, nom: nomDe(p), classe: String(p.classe || "").trim() || "—", email: p.email || "",
        jamais: jamais, instable: instable, maitrise: maitrise, total: total, profil: profil, conseil: conseil,
        details: detailJamais,
        tauxReussite: (function () {
          var ok = 0, n = 0; Object.keys(e).forEach(function (k) { ok += e[k].ok; n += e[k].ok + e[k].ko; });
          return n ? Math.round((ok * 100) / n) : null;
        })(),
      };
    });
    var ordre = { reprendre: 0, exercices: 1, entretien: 2 };
    lignes.sort(function (a, b) {
      var d = (ordre[a.profil] === undefined ? 3 : ordre[a.profil]) - (ordre[b.profil] === undefined ? 3 : ordre[b.profil]);
      return d !== 0 ? d : (a.tauxReussite === null ? 101 : a.tauxReussite) - (b.tauxReussite === null ? 101 : b.tauxReussite);
    });

    var questions = Object.keys(parQuestion).map(function (cle) {
      var g = parQuestion[cle];
      var taux = g.n ? Math.round((g.ok * 100) / g.n) : 0;
      var suspect = "";
      if (g.n >= MIN_REPONSES_SUSPECTE && taux <= SEUIL_FAIBLE) suspect = "ambigu";
      else if (g.n >= MIN_REPONSES_SUSPECTE && taux >= 100) suspect = "trop-facile";
      return { cle: cle, quiz: g.quiz, qid: g.qid, enonce: g.enonce, n: g.n, ok: g.ok, taux: taux, suspect: suspect };
    });
    questions.sort(function (a, b) { return (a.taux - b.taux) || (b.n - a.n); });
    return { lignes: lignes, questions: questions };
  }
  function rendre(res) {
    var lignes = res.lignes;
    var nb = { reprendre: 0, exercices: 0, entretien: 0 };
    lignes.forEach(function (l) { if (l.profil) nb[l.profil]++; });
    var avec = lignes.filter(function (l) { return l.profil; });
    var moy = avec.length ? Math.round(avec.reduce(function (s, l) { return s + (l.tauxReussite || 0); }, 0) / avec.length) : null;
    var html = "<p class='couv-resume'>" + lignes.length + " élève" + (lignes.length > 1 ? "s" : "") +
      " · <b>" + nb.reprendre + "</b> à reprendre le cours · <b>" + nb.exercices + "</b> à refaire des exercices · <b>" +
      nb.entretien + "</b> à entretenir · réussite moyenne <b>" + (moy === null ? "—" : moy + " %") + "</b></p>";
    if (!avec.length) { elCorps.innerHTML = html + "<p class='couv-vide'>Aucune réponse de quiz enregistrée pour cette sélection.</p>"; }
    else {
      html += "<table class='carte-diff-table' id='table-err'><thead><tr><th>Élève</th><th>Classe</th><th>Ne sait pas</th>" +
        "<th>Sait mais se trompe</th><th>Maîtrise</th><th>Réussite</th><th>Conseil</th></tr></thead><tbody>";
      lignes.forEach(function (l) {
        if (!l.profil) return;
        var niv = l.profil === "reprendre" ? "rouge" : (l.profil === "exercices" ? "orange" : "vert");
        html += "<tr class='couv-ligne'><td><b>" + ech(l.nom) + "</b><br><small>" + ech(l.email) + "</small></td>" +
          "<td>" + ech(l.classe) + "</td>" +
          "<td><b style='color:#c0392b'>" + l.jamais + "</b></td>" +
          "<td><b style='color:#b45309'>" + l.instable + "</b></td>" +
          "<td><b style='color:#177245'>" + l.maitrise + "</b></td>" +
          "<td>" + (l.tauxReussite === null ? "—" : l.tauxReussite + " %") + "</td>" +
          "<td><span class='carte-diff-" + niv + " couv-sig'>" + ech(l.conseil) + "</span></td></tr>";
      });
      html += "</tbody></table>";
      elCorps.innerHTML = html;
    }
    /* questions : les plus ratées + les suspectes */
    if (!elQ) return;
    var qs = (res.questions || []).slice(0, 12);
    var sus = (res.questions || []).filter(function (q) { return q.suspect; });
    var h = "";
    if (sus.length) {
      h += "<p class='couv-resume'>⚠️ <b>" + sus.length + "</b> question(s) suspecte(s) : " +
        sus.slice(0, 6).map(function (q) { return ech((q.enonce || q.qid).slice(0, 60)) + " (" + q.taux + " % sur " + q.n + ")"; }).join(" · ") + "</p>";
    }
    if (!qs.length) { elQ.innerHTML = h + "<p class='couv-vide'>Aucune question à afficher.</p>"; return; }
    h += "<table class='carte-diff-table' id='table-err-q'><thead><tr><th>Question</th><th>Quiz</th><th>Réponses</th><th>Réussite</th><th>Alerte</th></tr></thead><tbody>";
    qs.forEach(function (q) {
      var alerte = q.suspect === "ambigu" ? "<span class='carte-diff-rouge couv-sig'>énoncé ambigu ?</span>"
        : (q.suspect === "trop-facile" ? "<span class='carte-diff-orange couv-sig'>trop facile ?</span>" : "");
      h += "<tr><td>" + ech((q.enonce || q.qid).slice(0, 90)) + "</td><td>" + ech(q.quiz) + "</td><td>" + q.n + "</td>" +
        "<td><span class='couv-jauge'><i style='width:" + q.taux + "%'></i></span> <b>" + q.taux + " %</b></td><td>" + alerte + "</td></tr>";
    });
    elQ.innerHTML = h + "</tbody></table>";
  }
  function csv(lignes, questions) {
    var l = ["Type;Nom;Classe;E-mail;Ne sait pas;Sait mais se trompe;Maitrise;Reponses;Reussite %;Conseil"];
    (lignes || []).forEach(function (x) {
      if (!x.profil) return;
      l.push([x.profil, x.nom, x.classe, x.email, x.jamais, x.instable, x.maitrise, x.total, (x.tauxReussite === null ? "" : x.tauxReussite), x.conseil]
        .map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(";"));
    });
    if (questions && questions.length) {
      l.push("");
      l.push("Question;Quiz;Reponses;Reussite %;Alerte");
      questions.forEach(function (q) {
        l.push([(q.enonce || q.qid), q.quiz, q.n, q.taux, (q.suspect || "")].map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(";"));
      });
    }
    return l.join("\r\n");
  }
  function telecharger() {
    if (!dernier.length) { etat("⚠️ Calculez d'abord l'analyse.", "#b45309"); return; }
    try {
      var blob = new Blob(["\ufeff" + csv(dernier, dernierQ)], { type: "text/csv;charset=utf-8;" });
      var a = doc.createElement("a");
      a.href = URL.createObjectURL(blob);
      var cl = (elClasse && elClasse.value !== "*") ? String(elClasse.value).replace(/[^\w-]+/g, "_") : "toutes";
      a.download = "STI_V2_types_erreurs_" + cl + "_" + new Date().toISOString().slice(0, 10) + ".csv";
      doc.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
      etat("📥 Analyse exportée en CSV.", "#16a34a");
    } catch (e) { etat("⚠️ Export impossible : " + e.message, "#b91c1c"); }
  }
  function remplirClasses(profils) {
    if (!elClasse) return;
    var vus = {}, garde = elClasse.value;
    (profils || []).forEach(function (p) { var c = String(p.classe || "").trim(); if (c && !vus[c]) vus[c] = 1; });
    var opts = Object.keys(vus).sort().map(function (c) { return "<option value='" + ech(c) + "'>" + ech(c) + "</option>"; }).join("");
    elClasse.innerHTML = "<option value='*'>Toutes les classes</option>" + opts;
    if (garde) { try { elClasse.value = garde; } catch (e) {} }
  }
  function calculer() {
    var c = sb();
    if (!c) { etat("⚠️ Supabase indisponible dans cette page.", "#b91c1c"); return Promise.reject(new Error("no client")); }
    var minRep = Math.max(1, parseInt(elMin && elMin.value, 10) || 1);
    btnCalc.disabled = true;
    etat("⏳ Lecture des réponses question par question…");
    return Promise.all([
      c.from("profiles").select("id,email,nom,prenom,classe,statut").limit(3000),
      c.from("sti_quiz_reponses").select("user_id,quiz,module,question_id,enonce,correct").limit(MAX_LIGNES),
    ]).then(function (res) {
      btnCalc.disabled = false;
      var profils = (res[0] && !res[0].error && res[0].data) || [];
      var rep = (res[1] && !res[1].error && res[1].data) || [];
      if (!profils.length) { etat("⚠️ Profils illisibles : " + ((res[0] && res[0].error && res[0].error.message) || "aucun élève (session admin ?)"), "#b91c1c"); return; }
      if (!rep.length) { etat("⚠️ Aucune réponse de quiz enregistrée (table sti_quiz_reponses vide).", "#b45309"); }
      remplirClasses(profils);
      var classe = elClasse ? elClasse.value : "*";
      var actifs = profils.filter(function (p) { return String(p.statut || "actif") === "actif" && (classe === "*" || String(p.classe || "").trim() === classe); });
      var ids = {}; actifs.forEach(function (p) { ids[p.id] = 1; });
      var repClasse = rep.filter(function (r) { return r && ids[r.user_id]; });
      var out = analyser(actifs, repClasse, minRep);
      dernier = out.lignes; dernierQ = out.questions;
      rendre(out);
      var nb = out.lignes.filter(function (l) { return l.profil === "reprendre"; }).length;
      etat("✅ " + out.lignes.length + " élève(s) · " + repClasse.length + " réponse(s) analysée(s) · " + nb + " à reprendre le cours · minimum " + minRep + " réponse(s) pour un profil.", "#16a34a");
    }).catch(function (e) {
      btnCalc.disabled = false;
      etat("⚠️ " + (e && e.message ? e.message : "échec de lecture"), "#b91c1c");
    });
  }
  btnCalc.addEventListener("click", function () { calculer(); });
  if (btnCsv) btnCsv.addEventListener("click", telecharger);
  try {
    window.STI_TYPES_ERREUR = {
      calculer: calculer, analyser: analyser, csv: csv,
      lignes: function () { return dernier; }, questions: function () { return dernierQ; },
    };
  } catch (e) {}
})();
