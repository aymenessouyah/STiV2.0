/* ═══ STI — Graphiques d'activité admin (v463) ═══
   Deux graphiques calculés depuis le journal « acces » filtré sur les vraies visites :
   connexions par jour (7/14/30 jours) et pages réellement consultées.
   Client Supabase dédié (même session que l'admin), dessin Canvas sans librairie. */
(function () {
  "use strict";
  var client = null;
  var enCours = false;
  var dejaInit = false;

  function sb() {
    if (!client) client = window.supabase.createClient(window.STI_AUTH.URL, window.STI_AUTH.CLE);
    return client;
  }
  function $(id) { return document.getElementById(id); }

  function estVisiteNavigationGraphique(page) {
    var pg = String(page || "").trim();
    if (!pg) return false;
    if (
      pg === "CFG_ECOLES" ||
      pg === "SEC_CONFIG" ||
      pg === "SUPPR_ACCES" ||
      pg === "TABLEAU_BLANC" ||
      pg === "PROG_MEDIA" ||
      pg.indexOf("QUIZ:") === 0 ||
      pg.indexOf("MSG_") === 0 ||
      pg.indexOf("CTRL_") === 0 ||
      pg.indexOf("FLASH_") === 0 ||
      pg.indexOf("KAHOOT_") === 0 ||
      pg.indexOf("COFFRE_TP") === 0 ||
      pg.indexOf("COPIE_") === 0 ||
      pg.indexOf("SEC_") === 0 ||
      pg.indexOf("MAIN_LEVEE:") === 0 ||
      pg.indexOf("ADMIN_") === 0
    ) {
      return false;
    }
    return true;
  }

  function libellePageGraphique(raw) {
    var s = String(raw || "index.html").split("?")[0].split("#")[0].replace(/^\/+/, "").trim() || "index.html";
    if (/^cours\//i.test(s)) return "📖 " + s.replace(/^cours\//i, "").replace(/\.html$/i, "");
    if (/^quiz\//i.test(s)) return "🎯 Quiz " + s.replace(/^quiz\//i, "").replace(/\.html$/i, "");
    if (/^exercices\//i.test(s)) return "✏️ " + s.split("/").pop().replace(/\.html$/i, "");
    if (/^documents\//i.test(s)) return "📄 " + s.split("/").pop().replace(/\.html$/i, "");
    if (/^annexes\//i.test(s)) return "📋 " + s.split("/").pop().replace(/\.html$/i, "");
    return s.replace(/\.html$/i, "");
  }

  function barre(ctx, x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) { ctx.roundRect(x, y, w, h, r); return; }
    ctx.rect(x, y, w, h);
  }

  function jourCle(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function jourCourt(cle) {
    var p = cle.split("-");
    return p[2] + "/" + p[1];
  }

  function preparerCanvas(canvas) {
    var ratio = window.devicePixelRatio || 1;
    var largeur = canvas.clientWidth || (canvas.parentNode && canvas.parentNode.clientWidth) || 600;
    var hauteur = 190;
    canvas.width = largeur * ratio;
    canvas.height = hauteur * ratio;
    canvas.style.height = hauteur + "px";
    var ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    return { ctx: ctx, w: largeur, h: hauteur };
  }

  function couleurTexteGraph() {
    try {
      var sombre = document.documentElement.classList.contains("admin-ardoise");
      return sombre ? "#e2e8f0" : "#23201a";
    } catch (e) { return "#23201a"; }
  }

  function couleurAccentGraph() {
    try {
      var c = getComputedStyle(document.documentElement).getPropertyValue("--adm-accent").trim();
      if (c && !/^#(4f46|4338)/i.test(c)) return c;
    } catch (e) {}
    return "#15803d";
  }

  function dessinerBarresJours(canvas, jours, valeurs, actifs) {
    if (!canvas) return;
    var p = preparerCanvas(canvas), ctx = p.ctx;
    ctx.clearRect(0, 0, p.w, p.h);
    var max = Math.max(1, Math.max.apply(null, valeurs));
    var padBas = 22, padHaut = 24, padG = 6;
    var bw = (p.w - padG * 2) / jours.length;
    var ink = couleurTexteGraph();
    var accent = couleurAccentGraph();
    ctx.font = '700 10px "Comic Sans MS", "Comic Sans", "Comic Neue", cursive, sans-serif';
    jours.forEach(function (j, i) {
      var v = valeurs[i];
      var h = Math.round((p.h - padBas - padHaut) * (v / max));
      var x = padG + i * bw, y = p.h - padBas - h;
      ctx.fillStyle = accent;
      barre(ctx, x + 2, y, Math.max(4, bw - 5), Math.max(h, 2), 4);
      ctx.fill();
      ctx.fillStyle = ink;
      ctx.textAlign = "center";
      ctx.fillText(String(v), x + bw / 2, y - 4);
      ctx.fillStyle = "#94a3b8";
      if (jours.length <= 14 || i % 2 === 0) ctx.fillText(jourCourt(j), x + bw / 2, p.h - 7);
      if (actifs && actifs[i] > 0) {
        ctx.fillStyle = "#eab308";
        ctx.fillText("👤" + actifs[i], x + bw / 2, y - 15);
      }
    });
  }

  function dessinerBarresPages(canvas, noms, valeurs) {
    if (!canvas) return;
    var p = preparerCanvas(canvas), ctx = p.ctx;
    ctx.clearRect(0, 0, p.w, p.h);
    var ink = couleurTexteGraph();
    if (!noms.length) {
      ctx.fillStyle = "#94a3b8";
      ctx.font = '700 12.5px "Comic Sans MS", "Comic Sans", "Comic Neue", cursive, sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("Aucune visite enregistrée sur cette période.", p.w / 2, p.h / 2);
      return;
    }
    var max = Math.max(1, Math.max.apply(null, valeurs));
    var lh = Math.min(23, (p.h - 8) / noms.length);
    ctx.font = '700 11px "Comic Sans MS", "Comic Sans", "Comic Neue", cursive, sans-serif';
    noms.forEach(function (n, i) {
      var y = 6 + i * lh;
      var nomCourt = n.length > 26 ? n.slice(0, 25) + "…" : n;
      ctx.fillStyle = ink; ctx.textAlign = "left";
      ctx.fillText(nomCourt, 4, y + lh - 7);
      var lx = 165;
      var larg = Math.round(Math.max(20, p.w - lx - 44) * (valeurs[i] / max));
      ctx.fillStyle = "#10b981";
      barre(ctx, lx, y + 3, Math.max(4, larg), Math.max(lh - 9, 3), 4);
      ctx.fill();
      ctx.fillStyle = ink;
      ctx.fillText(String(valeurs[i]), lx + larg + 7, y + lh - 7);
    });
  }

  async function charger() {
    if (enCours) return;
    var resume = $("graph-resume");
    var periode = parseInt(($("graph-periode") || {}).value || "14", 10);
    enCours = true;
    try {
      var s = sb();
      var sess = await s.auth.getSession();
      if (!sess.data.session) {
        if (resume) resume.textContent = "⏳ En attente de la session admin… (recharge automatique)";
        enCours = false;
        setTimeout(charger, 3000);
        return;
      }
      if (resume) resume.textContent = "⏳ Chargement des visites et activités…";
      var depuis = new Date(Date.now() - periode * 86400000);
      var lignes = [], de = 0;
      for (;;) {
        var r = await s.from("acces").select("debut,page,user_id")
          .gte("debut", depuis.toISOString())
          .order("debut", { ascending: true })
          .order("id", { ascending: true })
          .range(de, de + 999);
        if (r.error) throw r.error;
        lignes = lignes.concat(r.data || []);
        if (!r.data || r.data.length < 1000 || lignes.length >= 20000) break;
        de += 1000;
      }
      var visites = lignes.filter(function (a) { return a && estVisiteNavigationGraphique(a.page); });
      var partiesQuiz = [];
      try {
        var deQ = 0;
        for (;;) {
          var rq = await s.from("sti_quiz_parties").select("cree_le,quiz,user_id")
            .gte("cree_le", depuis.toISOString())
            .order("cree_le", { ascending: true })
            .order("id", { ascending: true })
            .range(deQ, deQ + 999);
          if (!rq || rq.error) break;
          partiesQuiz = partiesQuiz.concat(rq.data || []);
          if (!rq.data || rq.data.length < 1000 || partiesQuiz.length >= 20000) break;
          deQ += 1000;
        }
      } catch (eQ) {}

      var jours = [], parJour = {}, actifsJour = {};
      for (var i = periode - 1; i >= 0; i--) {
        var c = jourCle(new Date(Date.now() - i * 86400000));
        jours.push(c); parJour[c] = 0; actifsJour[c] = {};
      }
      var pages = {}, utilisateurs = {};
      visites.forEach(function (a) {
        if (!a.debut) return;
        var c = jourCle(new Date(a.debut));
        if (c in parJour) {
          parJour[c]++;
          if (a.user_id) { actifsJour[c][a.user_id] = 1; utilisateurs[a.user_id] = 1; }
        }
        var pg = libellePageGraphique(a.page);
        pages[pg] = (pages[pg] || 0) + 1;
      });
      partiesQuiz.forEach(function (qp) {
        if (!qp || !qp.cree_le) return;
        var cq = jourCle(new Date(qp.cree_le));
        if (cq in actifsJour && qp.user_id) {
          actifsJour[cq][qp.user_id] = 1;
          utilisateurs[qp.user_id] = 1;
          if (!parJour[cq]) parJour[cq]++;
        }
        var lblQ = "🎯 Quiz " + String(qp.quiz || "STI");
        if (!pages[lblQ]) pages[lblQ] = 0;
        pages[lblQ] += 1;
      });

      var top = Object.keys(pages).sort(function (a, b) { return pages[b] - pages[a]; }).slice(0, 8);
      dessinerBarresJours($("graph-jours"), jours, jours.map(function (j) { return parJour[j]; }), jours.map(function (j) { return Object.keys(actifsJour[j]).length; }));
      dessinerBarresPages($("graph-pages"), top, top.map(function (n) { return pages[n]; }));
      if (resume) {
        resume.textContent = "📈 " + visites.length + " visite(s) de page" + (partiesQuiz.length ? (" + " + partiesQuiz.length + " partie(s) de quiz") : "") +
          " sur " + periode + " jour(s) · " + Object.keys(utilisateurs).length + " abonné(s) actif(s) distinct(s) (👤 = distincts/jour).";
      }
      dejaInit = true;
    } catch (e) {
      if (resume) resume.textContent = "⚠️ Impossible de charger les graphiques : " + (e.message || e);
    }
    enCours = false;
  }

  function init() {
    var section = $("bloc-sec-graphiques");
    if (!section || !window.supabase) return;
    var btn = $("btn-graph-charger");
    if (btn) btn.addEventListener("click", charger);
    var sel = $("graph-periode");
    if (sel) sel.addEventListener("change", charger);
    var vu = false;
    if ("IntersectionObserver" in window) {
      var obs = new IntersectionObserver(function (entrees) {
        if (entrees[0].isIntersecting && !vu) { vu = true; charger(); obs.disconnect(); }
      }, { rootMargin: "200px" });
      obs.observe(section);
    } else {
      charger();
    }
    window.addEventListener("resize", function () { if (dejaInit) charger(); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
  try { window.STI_GRAPHIQUES_ACTIVITE = { charger: charger, estVisiteNavigationGraphique: estVisiteNavigationGraphique }; } catch (e) {}
})();
