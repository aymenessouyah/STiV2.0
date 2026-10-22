/* ═══ STI — Admin : détail synchronisé des quiz (v358) ═══
   Lit la table centrale sti_quiz_parties (chaque partie jouée, tous
   appareils) et affiche, par élève et par quiz : nombre de parties,
   dernier score, meilleur score, pourcentage — avec le détail complet
   de chaque partie en cliquant sur une ligne. Client Supabase dédié
   (même session que l'admin), aucun couplage avec admin.js. */
(function () {
  "use strict";
  var client = null;
  var donnees = null;      // lignes brutes sti_quiz_parties
  var profilsParId = {};   // user_id -> profil
  var enCours = false;

  var LIBELLE_QUIZ = {
    "html-css": "🌐 HTML5 & CSS3",
    "javascript": "⚡ JavaScript",
    "sql": "🗄️ SQL (BD)",
    "php": "🐘 PHP",
    "tableaux": "🃏 Quiz des tableaux"
  };
  var LIBELLE_MODULE = {
    html5: "HTML5", css3: "CSS3", javascript: "JavaScript", sql: "SQL",
    php: "PHP", defis: "37 Défis JS", "recap-php": "Récap PHP", mix: "Mix"
  };

  function $(id) { return document.getElementById(id); }
  function sb() {
    if (!window.supabase || !window.STI_AUTH) return null;
    if (!client) client = window.supabase.createClient(window.STI_AUTH.URL, window.STI_AUTH.CLE);
    return client;
  }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function pct(l) { return l.total > 0 ? Math.round((l.score * 1000) / l.total) / 10 : 0; }
  function fmtDate(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return "—";
    return d.toLocaleDateString("fr-FR") + " " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }
  function nomQuiz(l) {
    var base = LIBELLE_QUIZ[l.quiz] || l.quiz;
    if (l.quiz === "tableaux" && l.module) base += " · " + (LIBELLE_MODULE[l.module] || l.module);
    return base;
  }
  function nomEleve(l) {
    var p = profilsParId[l.user_id];
    if (p && (p.nom || p.prenom)) return ((p.nom || "") + " " + (p.prenom || "")).trim();
    return l.email || l.user_id;
  }
  function classeEleve(l) {
    var p = profilsParId[l.user_id];
    return p ? (p.classe || "—") : "—";
  }

  async function charger() {
    var resume = $("quiz-sync-resume"), tb = $("tb-quiz-sync");
    if (!resume || !tb || enCours) return;
    var s = sb();
    if (!s) { resume.textContent = "⚠️ Client Supabase indisponible."; return; }
    enCours = true;
    resume.textContent = "Chargement des résultats synchronisés…";
    try {
      var [rp, rf] = await Promise.all([
        s.from("sti_quiz_parties").select("user_id,email,quiz,module,score,total,cree_le")
          .order("cree_le", { ascending: false }).limit(2000),
        s.from("profiles").select("id,email,nom,prenom,classe").limit(2000)
      ]);
      if (rp.error) throw rp.error;
      donnees = rp.data || [];
      profilsParId = {};
      (rf.data || []).forEach(function (p) { profilsParId[p.id] = p; });
      afficher();
    } catch (e) {
      var msg = (e && e.message) || String(e);
      if (/sti_quiz_parties/.test(msg) || /42P01|relation .* does not exist/i.test(msg)) {
        resume.innerHTML = "⚠️ La table centrale des quiz n'existe pas encore : exécutez " +
          "<strong>MIGRATION-v358-QUIZ-SYNC.sql</strong> dans Supabase (SQL Editor), puis cliquez sur Actualiser.";
      } else {
        resume.textContent = "⚠️ Impossible de charger les résultats des quiz : " + msg;
      }
      tb.innerHTML = "";
    } finally { enCours = false; }
  }

  function groupesFiltres() {
    var selQuiz = $("filtre-quiz-sync-quiz");
    var rech = ($("rech-quiz-sync") ? $("rech-quiz-sync").value : "").trim().toLowerCase();
    var quizChoisi = selQuiz ? selQuiz.value : "*";
    var groupes = {};
    (donnees || []).forEach(function (l) {
      var cle = l.user_id + "|" + l.quiz + "|" + (l.module || "");
      if (!groupes[cle]) groupes[cle] = { rep: l, parties: [] };
      groupes[cle].parties.push(l);
    });
    var liste = Object.keys(groupes).map(function (cle) {
      var g = groupes[cle];
      var parties = g.parties.slice().sort(function (a, b) { return new Date(b.cree_le) - new Date(a.cree_le); });
      var meilleur = parties[0];
      var somme = 0;
      parties.forEach(function (l) {
        somme += pct(l);
        if (pct(l) > pct(meilleur)) meilleur = l;
      });
      return {
        rep: g.rep, parties: parties, nb: parties.length,
        dernier: parties[0], meilleur: meilleur,
        pctMoyen: Math.round((somme / parties.length) * 10) / 10
      };
    });
    liste = liste.filter(function (g) {
      if (quizChoisi !== "*" && g.rep.quiz !== quizChoisi) return false;
      if (rech) {
        var cible = (nomEleve(g.rep) + " " + (g.rep.email || "") + " " + classeEleve(g.rep)).toLowerCase();
        if (cible.indexOf(rech) === -1) return false;
      }
      return true;
    });
    liste.sort(function (a, b) { return new Date(b.dernier.cree_le) - new Date(a.dernier.cree_le); });
    return liste;
  }

  function afficher() {
    var resume = $("quiz-sync-resume"), tb = $("tb-quiz-sync");
    if (!resume || !tb) return;
    var liste = groupesFiltres();
    var nbParties = (donnees || []).length;
    resume.textContent = nbParties
      ? nbParties + " partie(s) synchronisée(s)" + (nbParties >= 2000 ? " (les 2000 plus récentes)" : "") +
        " · " + liste.length + " ligne(s) élève × quiz affichée(s). Cliquez sur une ligne pour le détail de chaque partie."
      : "Aucune partie synchronisée pour le moment (les quiz joués par les élèves connectés apparaîtront ici).";
    if (!liste.length) {
      tb.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#7a6f5d;padding:16px">Aucun résultat pour cette sélection.</td></tr>';
      return;
    }
    tb.innerHTML = liste.map(function (g, idx) {
      var d = g.dernier, m = g.meilleur;
      var detail = g.parties.map(function (l) {
        return "<div>🗓️ " + esc(fmtDate(l.cree_le)) + " — <strong>" + l.score + "/" + l.total +
          "</strong> (" + pct(l) + " %)</div>";
      }).join("");
      return "<tr data-idx=\"" + idx + "\" style=\"cursor:pointer\" title=\"Cliquer pour le détail des parties\">" +
        "<td style=\"font-weight:800\">" + esc(nomEleve(g.rep)) +
          '<div style="font-weight:600;font-size:11px;color:#7a6f5d">' + esc(g.rep.email || "") + "</div></td>" +
        "<td>" + esc(classeEleve(g.rep)) + "</td>" +
        "<td>" + esc(nomQuiz(g.rep)) + "</td>" +
        "<td style=\"text-align:center;font-weight:800\">" + g.nb + "</td>" +
        "<td><strong>" + d.score + "/" + d.total + "</strong> (" + pct(d) + " %)<div style=\"font-size:11px;color:#7a6f5d\">" + esc(fmtDate(d.cree_le)) + "</div></td>" +
        "<td><strong style=\"color:#177245\">" + m.score + "/" + m.total + "</strong> (" + pct(m) + " %)</td>" +
        "<td style=\"text-align:center\">" + g.pctMoyen + " %</td>" +
        "<td style=\"text-align:center\">▸</td></tr>" +
        '<tr class="quiz-sync-detail" id="quiz-sync-detail-' + idx + '" style="display:none"><td colspan="8" style="background:#f9f1e3;font-size:12.5px;line-height:1.7">' +
          "<strong>📋 Toutes les parties (" + g.nb + ") :</strong>" + detail + "</td></tr>";
    }).join("");
    tb.querySelectorAll("tr[data-idx]").forEach(function (tr) {
      tr.addEventListener("click", function () {
        var det = $("quiz-sync-detail-" + tr.getAttribute("data-idx"));
        if (det) det.style.display = det.style.display === "none" ? "" : "none";
      });
    });
  }

  function init() {
    var tb = $("tb-quiz-sync");
    if (!tb) return;
    var btn = $("btn-quiz-sync-charger");
    if (btn) btn.addEventListener("click", charger);
    var sel = $("filtre-quiz-sync-quiz");
    if (sel) sel.addEventListener("change", function () { if (donnees) afficher(); });
    var rech = $("rech-quiz-sync");
    if (rech) rech.addEventListener("input", function () { if (donnees) afficher(); });
    charger();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
