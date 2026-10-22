/* ═══ STI — Admin : détail synchronisé des quiz (v358, vues v363, alertes+progression v364) ═══
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
  var vueActuelle = "classes";   // classes | jours | top3
  var classeOuverte = null;

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
          .order("cree_le", { ascending: false }).limit(5000),
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
    var vs = $("vue-quiz-stats"); if (vs) vs.innerHTML = "";
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
    afficherStats();
    var liste = groupesFiltres();
    var nbParties = (donnees || []).length;
    resume.textContent = nbParties
      ? nbParties + " partie(s) synchronisée(s)" + (nbParties >= 5000 ? " (les 5000 plus récentes)" : "") +
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

  /* ═══ v363 : vues statistiques (par classe, par jour, Top 3, détail) ═══ */
  var EMAIL_LABO = "elevelabo3@exemple.tn";
  function estLabo(l) { return (l.email || "").toLowerCase() === EMAIL_LABO; }
  function lignesStats() { return (donnees || []).filter(function (l) { return !estLabo(l); }); }

  function agregerEleves(lignes) {
    var par = {};
    lignes.forEach(function (l) {
      if (!par[l.user_id]) par[l.user_id] = { rep: l, parties: [] };
      par[l.user_id].parties.push(l);
    });
    return Object.keys(par).map(function (uid) {
      var g = par[uid];
      var parties = g.parties.slice().sort(function (x, y) { return new Date(y.cree_le) - new Date(x.cree_le); });
      var meilleur = parties[0], somme = 0;
      parties.forEach(function (l) { somme += pct(l); if (pct(l) > pct(meilleur)) meilleur = l; });
      var premier = parties[parties.length - 1];
      return { uid: uid, rep: g.rep, parties: parties, nb: parties.length, dernier: parties[0],
               premier: premier, delta: Math.round((pct(parties[0]) - pct(premier)) * 10) / 10,
               meilleur: meilleur, pctMoyen: Math.round((somme / parties.length) * 10) / 10,
               classe: classeEleve(g.rep) };
    });
  }
  function agregerClasses(lignes) {
    var eleves = agregerEleves(lignes);
    var par = {};
    eleves.forEach(function (e) {
      var c = e.classe || "—";
      if (!par[c]) par[c] = { classe: c, eleves: [], parties: 0, somme: 0, derniere: null };
      par[c].eleves.push(e); par[c].parties += e.nb; par[c].somme += e.pctMoyen * e.nb;
      if (!par[c].derniere || new Date(e.dernier.cree_le) > new Date(par[c].derniere)) par[c].derniere = e.dernier.cree_le;
    });
    return Object.keys(par).map(function (c) {
      var g = par[c];
      g.pctMoyen = g.parties ? Math.round((g.somme / g.parties) * 10) / 10 : 0;
      return g;
    }).sort(function (a, b) { return a.classe.localeCompare(b.classe, "fr"); });
  }

  function afficherStats() {
    var zone = $("vue-quiz-stats");
    if (!zone || !donnees) return;
    document.querySelectorAll(".btn-vue-quiz").forEach(function (b) {
      var actif = b.getAttribute("data-vue") === vueActuelle;
      b.style.background = actif ? "#23201a" : "#fffdf7";
      b.style.color = actif ? "#fffdf7" : "#23201a";
    });
    if (vueActuelle === "jours") zone.innerHTML = vueJours();
    else if (vueActuelle === "alertes") { zone.innerHTML = vueAlertes(); brancherClasses(zone); brancherNoms(zone); }
    else if (vueActuelle === "progression") { zone.innerHTML = vueProgression(); brancherClasses(zone); }
    else if (vueActuelle === "top3") { zone.innerHTML = vueTop3(); brancherClasses(zone); }
    else { zone.innerHTML = vueClasses(); brancherClasses(zone); }
    if (classeOuverte) rendreClasse();
  }

  function vueClasses() {
    var classes = agregerClasses(lignesStats());
    if (!classes.length) return '<p style="color:#7a6f5d;font-size:12.5px">Aucune donnée pour le moment.</p>';
    var h = '<div class="table-wrap"><table><thead><tr><th>Classe</th><th>Élèves actifs</th><th>Parties</th><th>% moyen</th><th>Dernière activité</th><th></th></tr></thead><tbody>';
    classes.forEach(function (g, i) {
      h += '<tr data-classe="' + i + '" style="cursor:pointer" title="Ouvrir le détail de cette classe">' +
        '<td style="font-weight:800">🏫 ' + esc(g.classe) + "</td>" +
        '<td style="text-align:center;font-weight:800">' + g.eleves.length + "</td>" +
        '<td style="text-align:center;font-weight:800">' + g.parties + "</td>" +
        '<td style="text-align:center">' + g.pctMoyen + " %</td>" +
        '<td style="font-size:12px">' + esc(fmtDate(g.derniere)) + "</td>" +
        '<td style="text-align:center">▸</td></tr>';
    });
    return h + "</tbody></table></div>" +
      '<p style="font-size:12px;color:#7a6f5d;margin:6px 0 12px">Cliquez sur une classe pour le détail par candidat. (Compte labo partagé exclu des statistiques.)</p>';
  }

  function vueJours() {
    var lignes = lignesStats();
    var jours = [], idx = {};
    for (var i = 13; i >= 0; i--) {
      var d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
      var cle = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
      idx[cle] = { date: new Date(d), parties: 0, somme: 0, eleves: {} };
      jours.push(idx[cle]);
    }
    lignes.forEach(function (l) {
      var d = new Date(l.cree_le);
      var cle = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
      var j = idx[cle];
      if (!j) return;
      j.parties++; j.somme += pct(l); j.eleves[l.user_id] = 1;
    });
    var maxi = 1;
    jours.forEach(function (j) { if (j.parties > maxi) maxi = j.parties; });
    var h = '<div class="table-wrap"><table><thead><tr><th>Jour</th><th>Parties</th><th>Élèves actifs</th><th>% moyen</th><th style="min-width:140px">Activité</th></tr></thead><tbody>';
    jours.slice().reverse().forEach(function (j) {
      var etiquette = j.date.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
      var pm = j.parties ? Math.round((j.somme / j.parties) * 10) / 10 : 0;
      h += "<tr>" +
        '<td style="font-weight:800">' + esc(etiquette) + "</td>" +
        '<td style="text-align:center;font-weight:800">' + j.parties + "</td>" +
        '<td style="text-align:center">' + Object.keys(j.eleves).length + "</td>" +
        '<td style="text-align:center">' + (j.parties ? pm + " %" : "—") + "</td>" +
        '<td><div style="height:12px;border-radius:6px;background:#f4511e;width:' + Math.round((j.parties / maxi) * 100) + '%;min-width:' + (j.parties ? 6 : 0) + 'px"></div></td></tr>';
    });
    return h + "</tbody></table></div>" +
      '<p style="font-size:12px;color:#7a6f5d;margin:6px 0 12px">14 derniers jours (parties synchronisées, compte labo exclu).</p>';
  }

  function vueTop3() {
    var classes = agregerClasses(lignesStats());
    if (!classes.length) return '<p style="color:#7a6f5d;font-size:12.5px">Aucune donnée pour le moment.</p>';
    var medailles = ["🥇", "🥈", "🥉"];
    var h = "";
    classes.forEach(function (g, i) {
      var top = g.eleves.slice().sort(function (a, b) {
        return (b.pctMoyen - a.pctMoyen) || (b.nb - a.nb);
      }).slice(0, 3);
      h += '<div style="border:2px solid #23201a;border-radius:14px;background:#fffdf7;padding:10px 14px;margin:0 0 10px">' +
        '<div data-classe="' + i + '" style="cursor:pointer;font-weight:900;font-size:14px" title="Ouvrir le détail de cette classe">🏫 ' + esc(g.classe) +
        ' <span style="font-size:11px;color:#7a6f5d;font-weight:700">(' + g.eleves.length + " élève(s), " + g.parties + " partie(s)) — ouvrir ▸</span></div>";
      h += top.map(function (e, r) {
        return '<div style="display:flex;gap:8px;align-items:center;padding:4px 0;font-size:13px">' +
          '<span style="font-size:17px">' + medailles[r] + "</span>" +
          '<strong>' + esc(nomEleve(e.rep)) + "</strong>" +
          '<span style="color:#7a6f5d;font-size:12px">' + e.nb + " partie(s) · % moyen " + e.pctMoyen + " % · meilleur " + e.meilleur.score + "/" + e.meilleur.total + " (" + pct(e.meilleur) + " %)</span></div>";
      }).join("");
      h += "</div>";
    });
    return h + '<p style="font-size:12px;color:#7a6f5d;margin:6px 0 12px">Classement par % moyen de toutes les parties (départage : nombre de parties). Cliquez sur une classe pour le détail par candidat.</p>';
  }

  function joursDepuis(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return 9999;
    return Math.floor((Date.now() - d.getTime()) / 86400000);
  }

  function vueAlertes() {
    var eleves = agregerEleves(lignesStats());
    var difficulte = eleves.filter(function (e) { return e.nb >= 2 && e.pctMoyen < 50; })
      .sort(function (a, b) { return a.pctMoyen - b.pctMoyen; });
    var inactifs = eleves.filter(function (e) { return joursDepuis(e.dernier.cree_le) >= 7; })
      .sort(function (a, b) { return joursDepuis(b.dernier.cree_le) - joursDepuis(a.dernier.cree_le); });
    var joues = {};
    eleves.forEach(function (e) { joues[e.uid] = 1; });
    var jamais = Object.keys(profilsParId).map(function (id) { return profilsParId[id]; })
      .filter(function (pr) {
        return pr && (pr.classe || "").trim() && !joues[pr.id] &&
          (pr.email || "").toLowerCase() !== EMAIL_LABO;
      });
    var classes = agregerClasses(lignesStats());
    function idxClasse(nom) {
      for (var i = 0; i < classes.length; i++) if (classes[i].classe === nom) return i;
      return -1;
    }
    var h = "";
    /* — en difficulte — */
    h += '<div style="border:2px solid #c0392b;border-radius:14px;background:#fffdf7;padding:10px 14px;margin:0 0 10px">' +
      '<strong style="color:#c0392b">🔴 En difficulté (% moyen &lt; 50 %, au moins 2 parties) : ' + difficulte.length + "</strong>";
    if (difficulte.length) {
      h += '<div class="table-wrap"><table><thead><tr><th>Élève</th><th>Classe</th><th>Parties</th><th>% moyen</th><th>Dernier score</th></tr></thead><tbody>';
      difficulte.forEach(function (e) {
        var ci = idxClasse(e.classe);
        h += '<tr' + (ci >= 0 ? ' data-classe="' + ci + '" style="cursor:pointer" title="Ouvrir la classe"' : "") + ">" +
          '<td style="font-weight:800">' + esc(nomEleve(e.rep)) + "</td>" +
          "<td>" + esc(e.classe) + "</td>" +
          '<td style="text-align:center;font-weight:800">' + e.nb + "</td>" +
          '<td style="text-align:center;font-weight:900;color:#c0392b">' + e.pctMoyen + " %</td>" +
          "<td>" + e.dernier.score + "/" + e.dernier.total + " (" + pct(e.dernier) + ' %)<div style="font-size:11px;color:#7a6f5d">' + esc(fmtDate(e.dernier.cree_le)) + "</div></td></tr>";
      });
      h += "</tbody></table></div>";
    } else h += '<p style="font-size:12.5px;color:#177245;margin:6px 0 2px">✅ Aucun élève en difficulté. Bravo !</p>';
    h += "</div>";
    /* — inactifs — */
    h += '<div style="border:2px solid #e67e22;border-radius:14px;background:#fffdf7;padding:10px 14px;margin:0 0 10px">' +
      '<strong style="color:#b95f06">😴 Inactifs depuis 7 jours ou plus : ' + inactifs.length + "</strong>";
    if (inactifs.length) {
      h += '<div class="table-wrap"><table><thead><tr><th>Élève</th><th>Classe</th><th>Dernière partie</th><th>Inactivité</th><th>% moyen</th></tr></thead><tbody>';
      inactifs.forEach(function (e) {
        var ci = idxClasse(e.classe), j = joursDepuis(e.dernier.cree_le);
        h += '<tr' + (ci >= 0 ? ' data-classe="' + ci + '" style="cursor:pointer" title="Ouvrir la classe"' : "") + ">" +
          '<td style="font-weight:800">' + esc(nomEleve(e.rep)) + "</td>" +
          "<td>" + esc(e.classe) + "</td>" +
          '<td style="font-size:12px">' + esc(fmtDate(e.dernier.cree_le)) + "</td>" +
          '<td style="text-align:center;font-weight:900;color:#b95f06">' + (j >= 9000 ? "—" : j + " j") + "</td>" +
          '<td style="text-align:center">' + e.pctMoyen + " %</td></tr>";
      });
      h += "</tbody></table></div>";
    } else h += '<p style="font-size:12.5px;color:#177245;margin:6px 0 2px">✅ Tous les élèves actifs ont joué cette semaine.</p>';
    h += "</div>";
    /* — jamais joue — */
    h += '<div style="border:2px solid #23201a;border-radius:14px;background:#fffdf7;padding:10px 14px;margin:0 0 12px">' +
      '<strong>🌱 Inscrits n\'ayant jamais joué : ' + jamais.length + "</strong>";
    if (jamais.length) {
      h += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">' +
        jamais.slice(0, 60).map(function (pr) {
          return '<span data-classe-nom="' + esc(pr.classe) + '" style="cursor:pointer;border:1.5px solid #23201a;border-radius:999px;padding:3px 10px;font-size:12px;font-weight:700" title="Ouvrir la classe ' + esc(pr.classe) + '">' +
            esc(((pr.nom || "") + " " + (pr.prenom || "")).trim() || pr.email || "") +
            ' <span style="color:#7a6f5d">(' + esc(pr.classe) + ")</span></span>";
        }).join("") + "</div>" +
        (jamais.length > 60 ? '<p style="font-size:12px;color:#7a6f5d;margin:6px 0 0">… et ' + (jamais.length - 60) + " autre(s).</p>" : "");
    } else h += '<p style="font-size:12.5px;color:#177245;margin:6px 0 2px">✅ Tous les inscrits ont au moins une partie.</p>';
    h += '<p style="font-size:12px;color:#7a6f5d;margin:8px 0 0">Compte labo exclu. Cliquez sur un élève (ou sa classe) pour ouvrir le détail de la classe.</p></div>';
    return h;
  }

  function vueProgression() {
    var eleves = agregerEleves(lignesStats()).filter(function (e) { return e.nb >= 2; });
    if (!eleves.length) return '<p style="color:#7a6f5d;font-size:12.5px">Pas encore assez de données (il faut au moins 2 parties par élève).</p>';
    var classes = agregerClasses(lignesStats());
    function idxClasse(nom) {
      for (var i = 0; i < classes.length; i++) if (classes[i].classe === nom) return i;
      return -1;
    }
    eleves.sort(function (a, b) { return (b.delta - a.delta) || (b.nb - a.nb); });
    var prog = eleves.filter(function (e) { return e.delta > 0; }).length;
    var baisse = eleves.filter(function (e) { return e.delta < 0; }).length;
    var h = '<p style="font-size:12.5px;margin:0 0 8px">📈 <strong>' + prog + "</strong> en progrès · <strong>" + baisse +
      "</strong> en baisse · <strong>" + (eleves.length - prog - baisse) + "</strong> stables (écart entre la première et la dernière partie, tous quiz confondus).</p>" +
      '<div class="table-wrap"><table><thead><tr><th>Élève</th><th>Classe</th><th>Parties</th><th>Premier score</th><th>Dernier score</th><th>Écart</th></tr></thead><tbody>';
    eleves.forEach(function (e) {
      var ci = idxClasse(e.classe);
      var couleur = e.delta > 0 ? "#177245" : (e.delta < 0 ? "#c0392b" : "#7a6f5d");
      var fleche = e.delta > 0 ? "↗" : (e.delta < 0 ? "↘" : "→");
      h += '<tr' + (ci >= 0 ? ' data-classe="' + ci + '" style="cursor:pointer" title="Ouvrir la classe"' : "") + ">" +
        '<td style="font-weight:800">' + esc(nomEleve(e.rep)) + "</td>" +
        "<td>" + esc(e.classe) + "</td>" +
        '<td style="text-align:center;font-weight:800">' + e.nb + "</td>" +
        "<td>" + e.premier.score + "/" + e.premier.total + " (" + pct(e.premier) + ' %)<div style="font-size:11px;color:#7a6f5d">' + esc(fmtDate(e.premier.cree_le)) + "</div></td>" +
        "<td><strong>" + e.dernier.score + "/" + e.dernier.total + "</strong> (" + pct(e.dernier) + ' %)<div style="font-size:11px;color:#7a6f5d">' + esc(fmtDate(e.dernier.cree_le)) + "</div></td>" +
        '<td style="text-align:center;font-weight:900;color:' + couleur + '">' + fleche + " " + (e.delta > 0 ? "+" : "") + e.delta + " pt</td></tr>";
    });
    return h + "</tbody></table></div>" +
      '<p style="font-size:12px;color:#7a6f5d;margin:6px 0 12px">Cliquez sur une ligne pour ouvrir le détail de sa classe.</p>';
  }

  function brancherNoms(zone) {
    zone.querySelectorAll("[data-classe-nom]").forEach(function (el) {
      el.addEventListener("click", function () { ouvrirClasse(el.getAttribute("data-classe-nom")); });
    });
  }

  function brancherClasses(zone) {
    zone.querySelectorAll("[data-classe]").forEach(function (el) {
      el.addEventListener("click", function () {
        var classes = agregerClasses(lignesStats());
        var g = classes[parseInt(el.getAttribute("data-classe"), 10)];
        if (g) ouvrirClasse(g.classe);
      });
    });
  }

  function ouvrirClasse(classe) {
    classeOuverte = classe;
    rendreClasse();
    var z = $("vue-quiz-classe");
    if (z) z.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function rendreClasse() {
    var zone = $("vue-quiz-classe");
    if (!zone || !donnees) return;
    var classes = agregerClasses(lignesStats());
    var g = null;
    classes.forEach(function (c) { if (c.classe === classeOuverte) g = c; });
    if (!g) { zone.style.display = "none"; classeOuverte = null; return; }
    zone.style.display = "";
    var eleves = g.eleves.slice().sort(function (a, b) { return (b.pctMoyen - a.pctMoyen) || (b.nb - a.nb); });
    var h = '<div style="border:2.5px solid #1f4257;border-radius:14px;background:#fffdf7;padding:12px 14px;margin:14px 0">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">' +
      '<strong style="font-size:15px">🏫 Détail quiz — classe ' + esc(g.classe) + "</strong>" +
      '<button type="button" id="btn-fermer-classe" style="border:2px solid #23201a;border-radius:999px;padding:4px 12px;background:#fffdf7;color:#23201a;font-weight:800;font-size:12px;cursor:pointer">✕ Fermer</button></div>' +
      '<p style="font-size:12px;color:#7a6f5d;margin:6px 0 10px">' + g.eleves.length + " élève(s) actifs · " + g.parties + " partie(s) · % moyen " + g.pctMoyen + " %. Cliquez sur un candidat pour le détail de ses parties.</p>" +
      '<div class="table-wrap"><table><thead><tr><th>Candidat</th><th>Parties</th><th>Dernier score</th><th>Meilleur score</th><th>% moyen</th><th></th></tr></thead><tbody>';
    eleves.forEach(function (e, i) {
      var det = e.parties.map(function (l) {
        return "<div>🗓️ " + esc(fmtDate(l.cree_le)) + " — " + esc(nomQuiz(l)) + " : <strong>" + l.score + "/" + l.total + "</strong> (" + pct(l) + " %)</div>";
      }).join("");
      h += '<tr data-eleve="' + i + '" style="cursor:pointer">' +
        '<td style="font-weight:800">' + esc(nomEleve(e.rep)) +
          '<div style="font-weight:600;font-size:11px;color:#7a6f5d">' + esc(e.rep.email || "") + "</div></td>" +
        '<td style="text-align:center;font-weight:800">' + e.nb + "</td>" +
        "<td><strong>" + e.dernier.score + "/" + e.dernier.total + "</strong> (" + pct(e.dernier) + ' %)<div style="font-size:11px;color:#7a6f5d">' + esc(fmtDate(e.dernier.cree_le)) + "</div></td>" +
        '<td><strong style="color:#177245">' + e.meilleur.score + "/" + e.meilleur.total + "</strong> (" + pct(e.meilleur) + " %)</td>" +
        '<td style="text-align:center">' + e.pctMoyen + " %" +
          (e.nb > 1 ? '<div style="font-size:11px;font-weight:800;color:' + (e.delta > 0 ? "#177245" : (e.delta < 0 ? "#c0392b" : "#7a6f5d")) + '">Δ ' + (e.delta > 0 ? "+" : "") + e.delta + " pt</div>" : "") + "</td>" +
        '<td style="text-align:center">▸</td></tr>' +
        '<tr class="detail-eleve-classe" id="detail-eleve-' + i + '" style="display:none"><td colspan="6" style="background:#f9f1e3;font-size:12.5px;line-height:1.7"><strong>📋 Parties (' + e.nb + ") :</strong>" + det + "</td></tr>";
    });
    h += "</tbody></table></div></div>";
    zone.innerHTML = h;
    var bf = $("btn-fermer-classe");
    if (bf) bf.addEventListener("click", function () { classeOuverte = null; zone.style.display = "none"; zone.innerHTML = ""; });
    zone.querySelectorAll("tr[data-eleve]").forEach(function (tr) {
      tr.addEventListener("click", function () {
        var det = $("detail-eleve-" + tr.getAttribute("data-eleve"));
        if (det) det.style.display = det.style.display === "none" ? "" : "none";
      });
    });
  }

  function init() {
    var tb = $("tb-quiz-sync");
    if (!tb) return;
    var btn = $("btn-quiz-sync-charger");
    if (btn) btn.addEventListener("click", charger);
    document.querySelectorAll(".btn-vue-quiz").forEach(function (b) {
      b.addEventListener("click", function () {
        vueActuelle = b.getAttribute("data-vue");
        if (donnees) afficherStats();
      });
    });
    var sel = $("filtre-quiz-sync-quiz");
    if (sel) sel.addEventListener("change", function () { if (donnees) afficher(); });
    var rech = $("rech-quiz-sync");
    if (rech) rech.addEventListener("input", function () { if (donnees) afficher(); });
    charger();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
