/* ═══ STI — Admin : détail synchronisé des quiz (v358, vues v363-v364, questions v365) ═══
   Lit la table centrale sti_quiz_parties (chaque partie jouée, tous
   appareils) et affiche, par élève et par quiz : nombre de parties,
   dernier score, meilleur score, pourcentage — avec le détail complet
   de chaque partie en cliquant sur une ligne. Client Supabase dédié
   (même session que l'admin), aucun couplage avec admin.js. */
(function () {
  "use strict";
  var client = null;
  var donnees = null;      // lignes brutes sti_quiz_parties
  var reponses = null;     // lignes sti_quiz_reponses (v365) : null = table absente
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
    php: "PHP", defis: "66 Défis JS & HTML", "recap-php": "Récap PHP", mix: "🎲 Mix", revision: "🎯 Révision erreurs"
  };

  async function lireToutPagine(fabriquerRequete, maxLignes, taillePage) {
    var pas = taillePage || 1000;
    var plafond = maxLignes || 10000;
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

  function $(id) { return document.getElementById(id); }
  function sb() {
    if (!window.supabase || !window.STI_AUTH) return null;
    if (!client) {
      client = window.__STI_ADMIN_SB || window.__STI_SB_CLIENT || window.supabase.createClient(window.STI_AUTH.URL, window.STI_AUTH.CLE, {
        auth: { persistSession: true, autoRefreshToken: false, detectSessionInUrl: false, lock: function (n, t, fn) { return fn(); } }
      });
    }
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
      var rr = await lireToutPagine(function () {
        return s.from("sti_quiz_reponses")
          .select("user_id,email,quiz,module,question_id,enonce,correct,cree_le")
          .order("cree_le", { ascending: false });
      }, 20000, 1000).then(function (r) { return r; }, function () { return { data: null }; });
      reponses = rr && !rr.error && rr.data ? rr.data : null;
      var [rp, rf] = await Promise.all([
        lireToutPagine(function () {
          return s.from("sti_quiz_parties")
            .select("user_id,email,quiz,module,score,total,points,ordre_questions,cree_le")
            .order("cree_le", { ascending: false });
        }, 10000, 1000).then(function (r) {
          if (r && r.error) {
            return lireToutPagine(function () {
              return s.from("sti_quiz_parties")
                .select("user_id,email,quiz,module,score,total,cree_le")
                .order("cree_le", { ascending: false });
            }, 10000, 1000);
          }
          return r;
        }),
        lireToutPagine(function () {
          return s.from("profiles").select("id,email,nom,prenom,classe");
        }, 3000, 1000)
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
      ? nbParties + " partie(s) synchronisée(s)" + (nbParties >= 10000 ? " (les 10 000 plus récentes)" : "") +
        " · " + liste.length + " ligne(s) élève × quiz affichée(s). Cliquez sur une ligne pour le détail de chaque partie."
      : "Aucune partie synchronisée pour le moment (les quiz joués par les élèves connectés apparaîtront ici).";
    if (!liste.length) {
      tb.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#7a6f5d;padding:16px">Aucun résultat pour cette sélection.</td></tr>';
      return;
    }
    tb.innerHTML = liste.map(function (g, idx) {
      var d = g.dernier, m = g.meilleur;
      var detail = g.parties.map(function (l) {
        var ptsTxt = (l.points != null && !isNaN(Number(l.points))) ? " · ⭐ " + Number(l.points) + " pts" : "";
        var blocOrdre = "";
        if (Array.isArray(l.ordre_questions) && l.ordre_questions.length) {
          blocOrdre = '<details style="margin:2px 0 6px 20px"><summary style="cursor:pointer;color:#177245;font-weight:800;font-size:11.5px">🔢 Ordre exact des ' +
            l.ordre_questions.length + ' questions tirées</summary><ol style="margin:4px 0 6px 18px;padding:0;font-size:11.5px;line-height:1.5">' +
            l.ordre_questions.map(function (oq) {
              return "<li>" + (oq && oq.ok ? "✅ " : "❌ ") + esc((oq && oq.enonce) || (oq && oq.id) || "") + "</li>";
            }).join("") + "</ol></details>";
        }
        return "<div>🗓️ " + esc(fmtDate(l.cree_le)) + " — <strong>" + l.score + "/" + l.total +
          "</strong> (" + pct(l) + " %)" + ptsTxt + blocOrdre + "</div>";
      }).join("");
      var modAttr = g.rep.module == null ? "" : g.rep.module;
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
        '<tr class="quiz-sync-detail" id="quiz-sync-detail-' + idx + '" style="display:none"><td colspan="8" style="background:var(--adm-surface-2,#f9f1e3);color:var(--adm-text,#23201a);font-size:12.5px;line-height:1.7">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">' +
          "<strong>📋 Toutes les parties (" + g.nb + ") :</strong>" +
          '<button type="button" class="btn-purger-quiz-eleve" data-uid="' + esc(g.rep.user_id) + '" data-quiz="' + esc(g.rep.quiz) + '" data-module="' + esc(modAttr) + '" data-label="' + esc(nomEleve(g.rep) + " — " + nomQuiz(g.rep)) + '" style="border:1.5px solid #c0392b;border-radius:999px;padding:3px 10px;background:var(--adm-surface,#fffdf7);color:#c0392b;font-weight:800;font-size:11.5px;cursor:pointer">🗑️ Purger ce quiz</button>' +
          "</div>" + detail + questionsRateesEleve(g.rep.user_id, g.rep.quiz, g.rep.module) + "</td></tr>";
    }).join("");
    tb.querySelectorAll("tr[data-idx]").forEach(function (tr) {
      tr.addEventListener("click", function () {
        var det = $("quiz-sync-detail-" + tr.getAttribute("data-idx"));
        if (det) det.style.display = det.style.display === "none" ? "" : "none";
      });
    });
    tb.querySelectorAll(".btn-purger-quiz-eleve").forEach(function (btnP) {
      btnP.addEventListener("click", function (ev) {
        ev.stopPropagation();
        purgerGroupeEleve(
          btnP.getAttribute("data-uid"),
          btnP.getAttribute("data-quiz"),
          btnP.getAttribute("data-module"),
          btnP.getAttribute("data-label")
        );
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
      b.style.background = actif ? "var(--adm-accent,#23201a)" : "var(--adm-surface,#fffdf7)";
      b.style.color = actif ? "#ffffff" : "var(--adm-text,#23201a)";
    });
    if (vueActuelle === "jours") zone.innerHTML = vueJours();
    else if (vueActuelle === "alertes") { zone.innerHTML = vueAlertes(); brancherClasses(zone); brancherNoms(zone); }
    else if (vueActuelle === "progression") { zone.innerHTML = vueProgression(); brancherClasses(zone); }
    else if (vueActuelle === "questions") { zone.innerHTML = vueQuestions(); brancherQuestions(zone); }
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
      h += '<div style="border:2px solid var(--adm-border-strong,#23201a);border-radius:14px;background:var(--adm-surface,#fffdf7);color:var(--adm-text,#23201a);padding:10px 14px;margin:0 0 10px">' +
        '<div data-classe="' + i + '" style="cursor:pointer;font-weight:900;font-size:14px" title="Ouvrir le détail de cette classe">🏫 ' + esc(g.classe) +
        ' <span style="font-size:11px;color:var(--adm-muted,#7a6f5d);font-weight:700">(' + g.eleves.length + " élève(s), " + g.parties + " partie(s)) — ouvrir ▸</span></div>";
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
        var cl = String((pr && pr.classe) || "").trim();
        var em = String((pr && pr.email) || "").trim().toLowerCase();
        return pr && cl && !joues[pr.id] &&
          String(pr.statut || "actif") === "actif" &&
          em !== EMAIL_LABO &&
          em !== "aymenessouyah@gmail.com" &&
          !/^(prof|professeur|enseignant|admin|elevelabo3|labo3)$/i.test(cl);
      });
    var classes = agregerClasses(lignesStats());
    function idxClasse(nom) {
      for (var i = 0; i < classes.length; i++) if (classes[i].classe === nom) return i;
      return -1;
    }
    var h = "";
    /* — en difficulte — */
    h += '<div style="border:2px solid #c0392b;border-radius:14px;background:var(--adm-surface,#fffdf7);color:var(--adm-text,#23201a);padding:10px 14px;margin:0 0 10px">' +
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
          "<td>" + e.dernier.score + "/" + e.dernier.total + " (" + pct(e.dernier) + ' %)<div style="font-size:11px;color:var(--adm-muted,#7a6f5d)">' + esc(fmtDate(e.dernier.cree_le)) + "</div></td></tr>";
      });
      h += "</tbody></table></div>";
    } else h += '<p style="font-size:12.5px;color:#177245;margin:6px 0 2px">✅ Aucun élève en difficulté. Bravo !</p>';
    h += "</div>";
    /* — inactifs — */
    h += '<div style="border:2px solid #e67e22;border-radius:14px;background:var(--adm-surface,#fffdf7);color:var(--adm-text,#23201a);padding:10px 14px;margin:0 0 10px">' +
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
    h += '<div style="border:2px solid var(--adm-border-strong,#23201a);border-radius:14px;background:var(--adm-surface,#fffdf7);color:var(--adm-text,#23201a);padding:10px 14px;margin:0 0 12px">' +
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

  /* ═══ v365 / v456 : analyse par question (avec distinction « encore à retravailler » vs « corrigée depuis ») ═══ */
  var quizQuestionFiltre = "*";
  var questionSel = null;
  var questionsAffichees = [];

  function questionsRateesEleve(uid, quizFiltre, moduleFiltre) {
    if (!reponses || !reponses.length) return "";
    var par = {};
    /* reponses est trie du plus recent au plus ancien (cree_le DESC) */
    reponses.forEach(function (r) {
      if (r.user_id !== uid) return;
      if (quizFiltre && r.quiz !== quizFiltre) return;
      if (quizFiltre === "tableaux" && moduleFiltre && moduleFiltre !== "mix" && moduleFiltre !== "revision" && r.module && r.module !== "mix" && r.module !== "revision" && r.module !== moduleFiltre) return;
      var cle = r.quiz + "|" + r.question_id;
      if (!par[cle]) {
        par[cle] = { enonce: r.enonce, quiz: r.quiz, module: r.module, nb: 0, dernierCorrect: !!r.correct };
      }
      if (!r.correct) par[cle].nb++;
      if (!par[cle].enonce && r.enonce) par[cle].enonce = r.enonce;
    });
    var liste = Object.keys(par).map(function (k) { return par[k]; })
      .filter(function (q) { return q.nb > 0; })
      .sort(function (a, b) {
        if (a.dernierCorrect !== b.dernierCorrect) return a.dernierCorrect ? 1 : -1;
        return b.nb - a.nb;
      }).slice(0, 6);
    if (!liste.length) return "";
    return '<div style="margin-top:6px"><strong>❌ Questions ratées sur ce quiz :</strong>' + liste.map(function (q) {
      var badgeEtat = q.dernierCorrect
        ? '<span style="color:#177245;font-weight:800">✅ corrigée depuis</span>'
        : '<span style="color:#c0392b;font-weight:800">🔴 à retravailler</span>';
      return "<div>• (" + esc(LIBELLE_QUIZ[q.quiz] || q.quiz) + (q.module ? " · " + esc(LIBELLE_MODULE[q.module] || q.module) : "") + ") " +
        esc((q.enonce || "").slice(0, 110)) + " — <strong>" + q.nb + " échec(s)</strong> · " + badgeEtat + "</div>";
    }).join("") + "</div>";
  }

  function agregerQuestions() {
    var par = {};
    var dernierParEleve = {};
    (reponses || []).forEach(function (r) {
      if (!r || String(r.email || "").trim().toLowerCase() === EMAIL_LABO) return;
      var prU = r.user_id && profilsParId ? profilsParId[r.user_id] : null;
      if (prU && String(prU.email || "").trim().toLowerCase() === EMAIL_LABO) return;
      if (quizQuestionFiltre !== "*" && r.quiz !== quizQuestionFiltre) return;
      var cle = r.quiz + "|" + r.question_id;
      if (!par[cle]) par[cle] = { cle: cle, quiz: r.quiz, module: r.module, question_id: r.question_id, enonce: "", tentatives: 0, echecs: 0, nonMaitrises: 0 };
      var g = par[cle];
      g.tentatives++;
      if (!r.correct) g.echecs++;
      if (!g.enonce && r.enonce) g.enonce = r.enonce;
      if ((!g.module || g.module === "mix" || g.module === "revision") && r.module && r.module !== "mix" && r.module !== "revision") {
        g.module = r.module;
      }
      var cleU = cle + "|" + r.user_id;
      if (!(cleU in dernierParEleve)) {
        dernierParEleve[cleU] = !!r.correct;
        if (!r.correct) g.nonMaitrises++;
      }
    });
    return Object.keys(par).map(function (k) {
      var g = par[k];
      g.pctEchec = g.tentatives ? Math.round((g.echecs * 1000) / g.tentatives) / 10 : 0;
      return g;
    });
  }

  function vueQuestions() {
    if (reponses === null) {
      return '<div style="border:2px dashed #c0392b;border-radius:14px;background:var(--adm-surface,#fffdf7);color:var(--adm-text,#23201a);padding:12px 14px;margin:0 0 12px">' +
        "<strong>⚠️ Analyse par question pas encore active.</strong>" +
        '<p style="font-size:12.5px;margin:6px 0 0">Exécutez <strong>MIGRATION-v365-REPONSES.sql</strong> dans Supabase (SQL Editor), puis cliquez sur « ↻ Actualiser ». Les nouvelles parties des élèves enverront alors le détail question par question.</p></div>';
    }
    if (!reponses.length) {
      return '<p style="color:#7a6f5d;font-size:12.5px">Aucune réponse détaillée pour le moment : le détail question par question arrive avec les nouvelles parties jouées.</p>';
    }
    var quizPresents = {};
    reponses.forEach(function (r) { quizPresents[r.quiz] = 1; });
    var options = '<option value="*">Tous les quiz</option>' + Object.keys(quizPresents).sort().map(function (q) {
      return '<option value="' + esc(q) + '"' + (quizQuestionFiltre === q ? " selected" : "") + ">" + esc(LIBELLE_QUIZ[q] || q) + "</option>";
    }).join("");
    /* synthese par quiz */
    var parQuiz = {};
    reponses.forEach(function (r) {
      if (!parQuiz[r.quiz]) parQuiz[r.quiz] = { t: 0, ok: 0 };
      parQuiz[r.quiz].t++;
      if (r.correct) parQuiz[r.quiz].ok++;
    });
    var synthese = Object.keys(parQuiz).sort().map(function (q) {
      var g = parQuiz[q], pr = Math.round((g.ok * 1000) / g.t) / 10;
      return "<span style=\"display:inline-block;border:1.5px solid #23201a;border-radius:999px;padding:3px 10px;font-size:12px;font-weight:700;margin:0 6px 6px 0\">" +
        esc(LIBELLE_QUIZ[q] || q) + " : " + pr + " % de réussite (" + g.t + " rép.)</span>";
    }).join("");
    var toutes = agregerQuestions();
    questionsAffichees = toutes.filter(function (g) { return g.tentatives >= 2 && g.echecs > 0; })
      .sort(function (a, b) { return (b.nonMaitrises - a.nonMaitrises) || (b.pctEchec - a.pctEchec) || (b.tentatives - a.tentatives); }).slice(0, 40);
    var h = '<div style="margin:0 0 8px">' + synthese + "</div>" +
      '<label style="font-size:12.5px;font-weight:800">Quiz : <select id="filtre-questions-quiz" style="border:2px solid var(--adm-border-strong,#23201a);border-radius:999px;padding:5px 12px;background:var(--adm-surface,#fffdf7);color:var(--adm-text,#23201a);font-weight:800;font-size:12px">' + options + "</select></label>";
    if (!questionsAffichees.length) {
      return h + '<p style="color:#7a6f5d;font-size:12.5px;margin-top:8px">Pas encore de question assez répondue (au moins 2 tentatives) avec des échecs.</p>';
    }
    h += '<div class="table-wrap" style="margin-top:8px"><table><thead><tr><th>Question</th><th>Quiz</th><th>Tentatives</th><th>Échecs</th><th>% échec</th><th>Maîtrise actuelle</th><th></th></tr></thead><tbody>';
    questionsAffichees.forEach(function (g, i) {
      var etatMaitrise = g.nonMaitrises > 0
        ? '<span style="color:#c0392b;font-weight:800">🔴 ' + g.nonMaitrises + " à revoir</span>"
        : '<span style="color:#177245;font-weight:800">✅ Maîtrisée</span>';
      h += '<tr data-question="' + i + '" style="cursor:pointer" title="Voir les élèves ayant échoué sur cette question">' +
        '<td style="font-weight:700">' + esc((g.enonce || g.question_id || "").slice(0, 130)) + "</td>" +
        "<td>" + esc(LIBELLE_QUIZ[g.quiz] || g.quiz) + (g.module ? '<div style="font-size:11px;color:#7a6f5d">' + esc(LIBELLE_MODULE[g.module] || g.module) + "</div>" : "") + "</td>" +
        '<td style="text-align:center;font-weight:800">' + g.tentatives + "</td>" +
        '<td style="text-align:center;font-weight:800">' + g.echecs + "</td>" +
        '<td style="text-align:center"><strong style="color:#c0392b">' + g.pctEchec + ' %</strong><div style="height:8px;border-radius:4px;background:#c0392b;width:' + Math.min(100, g.pctEchec) + '%;margin-top:3px"></div></td>' +
        '<td style="text-align:center;font-size:12px">' + etatMaitrise + "</td>" +
        '<td style="text-align:center">▸</td></tr>';
    });
    h += "</tbody></table></div>" +
      '<p style="font-size:12px;color:#7a6f5d;margin:6px 0 4px">Questions répondues au moins 2 fois, triées par nombre d\'élèves encore non maîtrisés puis taux d\'échec. Cliquez sur une question pour le détail.</p><div id="question-eleves"></div>';
    return h;
  }

  function brancherQuestions(zone) {
    var sel = zone.querySelector("#filtre-questions-quiz");
    if (sel) sel.addEventListener("change", function () {
      quizQuestionFiltre = sel.value;
      questionSel = null;
      afficherStats();
    });
    zone.querySelectorAll("[data-question]").forEach(function (tr) {
      tr.addEventListener("click", function () {
        var g = questionsAffichees[parseInt(tr.getAttribute("data-question"), 10)];
        if (g) { questionSel = g.cle; rendreElevesQuestion(zone, g); }
      });
    });
    if (questionSel) {
      for (var i = 0; i < questionsAffichees.length; i++) {
        if (questionsAffichees[i].cle === questionSel) { rendreElevesQuestion(zone, questionsAffichees[i]); break; }
      }
    }
  }

  function rendreElevesQuestion(zone, g) {
    var dest = zone.querySelector("#question-eleves");
    if (!dest) return;
    var par = {};
    (reponses || []).forEach(function (r) {
      var cle = r.quiz + "|" + r.question_id;
      if (cle !== g.cle) return;
      if (!par[r.user_id]) par[r.user_id] = { rep: r, nb: 0, derniere: r.cree_le, dernierCorrect: !!r.correct };
      if (!r.correct) {
        par[r.user_id].nb++;
        if (new Date(r.cree_le) > new Date(par[r.user_id].derniere)) par[r.user_id].derniere = r.cree_le;
      }
    });
    var eleves = Object.keys(par).map(function (k) { return par[k]; })
      .filter(function (e) { return e.nb > 0; })
      .sort(function (a, b) {
        if (a.dernierCorrect !== b.dernierCorrect) return a.dernierCorrect ? 1 : -1;
        return (b.nb - a.nb) || (new Date(b.derniere) - new Date(a.derniere));
      });
    if (!eleves.length) { dest.innerHTML = ""; return; }
    dest.innerHTML = '<div style="border:2px solid #c0392b;border-radius:14px;background:var(--adm-surface,#fffdf7);color:var(--adm-text,#23201a);padding:10px 14px;margin:8px 0 12px">' +
      '<strong style="color:#c0392b">❌ Élèves ayant échoué sur cette question (' + eleves.length + ")</strong>" +
      '<p style="font-size:12.5px;margin:4px 0 8px">« ' + esc((g.enonce || "").slice(0, 160)) + " »</p>" +
      '<div class="table-wrap"><table><thead><tr><th>Élève</th><th>Classe</th><th>Échecs</th><th>Statut actuel</th><th>Dernier échec</th></tr></thead><tbody>' +
      eleves.map(function (e) {
        var st = e.dernierCorrect
          ? '<span style="color:#177245;font-weight:800">✅ Corrigée depuis</span>'
          : '<span style="color:#c0392b;font-weight:800">🔴 À retravailler</span>';
        return "<tr><td style=\"font-weight:800\">" + esc(nomEleve(e.rep)) + "</td><td>" + esc(classeEleve(e.rep)) + "</td>" +
          '<td style="text-align:center;font-weight:900;color:#c0392b">' + e.nb + "</td>" +
          '<td style="text-align:center;font-size:12px">' + st + "</td>" +
          '<td style="font-size:12px">' + esc(fmtDate(e.derniere)) + "</td></tr>";
      }).join("") + "</tbody></table></div></div>";
    dest.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function csvCell(val) {
    var s = String(val == null ? "" : val).replace(/\r?\n/g, " ").trim();
    if (/[;"\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function exporterCsv() {
    var liste = groupesFiltres();
    if (!liste.length) {
      window.alert("Aucun résultat de quiz à exporter pour la sélection actuelle.");
      return;
    }
    var entete = ["Élève", "E-mail", "Classe", "Quiz", "Module", "Parties", "Dernier score", "Dernier %", "Date dernière partie", "Meilleur score", "Meilleur %", "% moyen"];
    var lignesCsv = [entete.map(csvCell).join(";")];
    liste.forEach(function (g) {
      var d = g.dernier, m = g.meilleur;
      lignesCsv.push([
        nomEleve(g.rep),
        g.rep.email || "",
        classeEleve(g.rep),
        LIBELLE_QUIZ[g.rep.quiz] || g.rep.quiz,
        g.rep.module ? (LIBELLE_MODULE[g.rep.module] || g.rep.module) : "",
        g.nb,
        d.score + "/" + d.total,
        String(pct(d)).replace(".", ","),
        fmtDate(d.cree_le),
        m.score + "/" + m.total,
        String(pct(m)).replace(".", ","),
        String(g.pctMoyen).replace(".", ",")
      ].map(csvCell).join(";"));
    });
    var contenuCsv = "\uFEFF" + lignesCsv.join("\r\n");
    var a = document.createElement("a");
    var dateIso = new Date().toISOString().slice(0, 10);
    a.setAttribute("download", "sti-resultats-quiz-" + dateIso + ".csv");
    if (window.Blob && window.URL && typeof window.URL.createObjectURL === "function") {
      var blob = new Blob([contenuCsv], { type: "text/csv;charset=utf-8;" });
      var url = URL.createObjectURL(blob);
      a.href = url;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { try { URL.revokeObjectURL(url); } catch (e) {} }, 2000);
    } else {
      a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(contenuCsv);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }

  async function purgerGroupeEleve(uid, quiz, mod, label) {
    if (!uid || !quiz) return;
    if (!window.confirm("Confirmer la suppression définitive des parties et réponses enregistrées pour :\n\n" + (label || uid + " / " + quiz) + " ?")) return;
    var s = sb();
    if (!s) return;
    try {
      var qp = s.from("sti_quiz_parties").delete().eq("user_id", uid).eq("quiz", quiz);
      qp = mod ? qp.eq("module", mod) : qp.is("module", null);
      var rp = await qp;
      if (rp && rp.error) throw rp.error;
      var qr = s.from("sti_quiz_reponses").delete().eq("user_id", uid).eq("quiz", quiz);
      if (mod) qr = qr.eq("module", mod);
      await qr;
      try {
        var qs = s.from("sti_quiz_sessions").delete().eq("user_id", uid).eq("quiz", quiz);
        if (mod) qs = qs.eq("mode", mod);
        await qs;
      } catch (eS) {}
      await charger();
    } catch (e) {
      window.alert("⚠️ Suppression refusée ou échouée : " + ((e && e.message) || String(e)));
    }
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
    var h = '<div style="border:2.5px solid var(--adm-border-strong,#1f4257);border-radius:14px;background:var(--adm-surface,#fffdf7);color:var(--adm-text,#23201a);padding:12px 14px;margin:14px 0">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">' +
      '<strong style="font-size:15px">🏫 Détail quiz — classe ' + esc(g.classe) + "</strong>" +
      '<button type="button" id="btn-fermer-vue-quiz-classe" style="border:2px solid var(--adm-border-strong,#23201a);border-radius:999px;padding:4px 12px;background:var(--adm-surface-2,#fffdf7);color:var(--adm-text,#23201a);font-weight:800;font-size:12px;cursor:pointer">✕ Fermer</button></div>' +
      '<p style="font-size:12px;color:var(--adm-muted,#7a6f5d);margin:6px 0 10px">' + g.eleves.length + " élève(s) actifs · " + g.parties + " partie(s) · % moyen " + g.pctMoyen + " %. Cliquez sur un candidat pour le détail de ses parties.</p>" +
      '<div class="table-wrap"><table><thead><tr><th>Candidat</th><th>Parties</th><th>Dernier score</th><th>Meilleur score</th><th>% moyen</th><th></th></tr></thead><tbody>';
    eleves.forEach(function (e, i) {
      var det = e.parties.map(function (l) {
        return "<div>🗓️ " + esc(fmtDate(l.cree_le)) + " — " + esc(nomQuiz(l)) + " : <strong>" + l.score + "/" + l.total + "</strong> (" + pct(l) + " %)</div>";
      }).join("");
      h += '<tr data-eleve="' + i + '" style="cursor:pointer">' +
        '<td style="font-weight:800">' + esc(nomEleve(e.rep)) +
          '<div style="font-weight:600;font-size:11px;color:var(--adm-muted,#7a6f5d)">' + esc(e.rep.email || "") + "</div></td>" +
        '<td style="text-align:center;font-weight:800">' + e.nb + "</td>" +
        "<td><strong>" + e.dernier.score + "/" + e.dernier.total + "</strong> (" + pct(e.dernier) + ' %)<div style="font-size:11px;color:var(--adm-muted,#7a6f5d)">' + esc(fmtDate(e.dernier.cree_le)) + "</div></td>" +
        '<td><strong style="color:#177245">' + e.meilleur.score + "/" + e.meilleur.total + "</strong> (" + pct(e.meilleur) + " %)</td>" +
        '<td style="text-align:center">' + e.pctMoyen + " %" +
          (e.nb > 1 ? '<div style="font-size:11px;font-weight:800;color:' + (e.delta > 0 ? "#177245" : (e.delta < 0 ? "#c0392b" : "#7a6f5d")) + '">Δ ' + (e.delta > 0 ? "+" : "") + e.delta + " pt</div>" : "") + "</td>" +
        '<td style="text-align:center">▸</td></tr>' +
        '<tr class="detail-eleve-classe" id="detail-eleve-' + i + '" style="display:none"><td colspan="6" style="background:var(--adm-surface-2,#f9f1e3);color:var(--adm-text,#23201a);font-size:12.5px;line-height:1.7"><strong>📋 Parties (' + e.nb + ") :</strong>" + det + "</td></tr>";
    });
    h += "</tbody></table></div></div>";
    zone.innerHTML = h;
    var bf = zone.querySelector("#btn-fermer-vue-quiz-classe");
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
    var btnCsv = $("btn-quiz-sync-csv");
    if (btnCsv) btnCsv.addEventListener("click", exporterCsv);
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

    /* v473 : ne pas lancer 4 requêtes paginées complètes à l'ouverture d'admin.html tant que #bloc-sec-quiz est replié */
    var secQuiz = $("bloc-sec-quiz");
    var dejaChargeAuto = false;
    function chargerUneFoisSiOuvert() {
      if (dejaChargeAuto) return;
      if (secQuiz && secQuiz.classList && secQuiz.classList.contains("sec-repliee")) return;
      dejaChargeAuto = true;
      charger();
    }
    if (secQuiz && secQuiz.classList && secQuiz.classList.contains("sec-repliee")) {
      var resEl = $("quiz-sync-resume");
      if (resEl) resEl.textContent = "Ouvrez cette section (ou cliquez sur ↻ Actualiser) pour charger les résultats détaillés des quiz.";
      if (typeof MutationObserver === "function") {
        var obsSec = new MutationObserver(function () {
          if (!secQuiz.classList.contains("sec-repliee")) {
            obsSec.disconnect();
            chargerUneFoisSiOuvert();
          }
        });
        obsSec.observe(secQuiz, { attributes: true, attributeFilter: ["class"] });
      }
      document.addEventListener("click", function (ev) {
        var t = ev && ev.target;
        if (!t || !t.closest) return;
        if (t.closest('[data-sec-cible="bloc-sec-quiz"]') || t.closest('[data-replier="bloc-sec-quiz"]') || t.closest('[data-nav-groupe="grp-scolarite"]')) {
          setTimeout(function () { dejaChargeAuto = true; charger(); }, 30);
        }
      });
    } else {
      chargerUneFoisSiOuvert();
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
