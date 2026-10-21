/* ═══ STI — Graphiques d'activité admin (v347) ═══
   Deux graphiques calculés depuis le journal « acces » existant :
   connexions par jour (7/14/30 jours) et pages les plus consultées.
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

  /* roundRect avec repli pour anciens navigateurs */
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
    var largeur = canvas.clientWidth || canvas.parentNode.clientWidth || 600;
    var hauteur = 190;
    canvas.width = largeur * ratio;
    canvas.height = hauteur * ratio;
    canvas.style.height = hauteur + "px";
    var ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    return { ctx: ctx, w: largeur, h: hauteur };
  }

  function dessinerBarresJours(canvas, jours, valeurs, actifs) {
    var p = preparerCanvas(canvas), ctx = p.ctx;
    ctx.clearRect(0, 0, p.w, p.h);
    var max = Math.max(1, Math.max.apply(null, valeurs));
    var padBas = 22, padHaut = 16, padG = 6;
    var bw = (p.w - padG * 2) / jours.length;
    ctx.font = "10px system-ui, sans-serif";
    jours.forEach(function (j, i) {
      var v = valeurs[i];
      var h = Math.round((p.h - padBas - padHaut) * (v / max));
      var x = padG + i * bw, y = p.h - padBas - h;
      ctx.fillStyle = "#4338ca";
      barre(ctx, x + 2, y, Math.max(4, bw - 5), Math.max(h, 1), 3);
      ctx.fill();
      ctx.fillStyle = "#23201a";
      ctx.textAlign = "center";
      ctx.fillText(String(v), x + bw / 2, y - 4);
      ctx.fillStyle = "#7a6f5d";
      if (jours.length <= 14 || i % 2 === 0) ctx.fillText(jourCourt(j), x + bw / 2, p.h - 8);
      if (actifs) {
        ctx.fillStyle = "#b4552d";
        ctx.fillText("👤" + actifs[i], x + bw / 2, y - 16);
      }
    });
  }

  function dessinerBarresPages(canvas, noms, valeurs) {
    var p = preparerCanvas(canvas), ctx = p.ctx;
    ctx.clearRect(0, 0, p.w, p.h);
    if (!noms.length) {
      ctx.fillStyle = "#7a6f5d"; ctx.font = "13px system-ui, sans-serif"; ctx.textAlign = "center";
      ctx.fillText("Aucune donnée sur la période.", p.w / 2, p.h / 2);
      return;
    }
    var max = Math.max(1, Math.max.apply(null, valeurs));
    var lh = Math.min(24, (p.h - 8) / noms.length);
    ctx.font = "11px system-ui, sans-serif";
    noms.forEach(function (n, i) {
      var y = 6 + i * lh;
      var nomCourt = n.length > 26 ? n.slice(0, 25) + "…" : n;
      ctx.fillStyle = "#23201a"; ctx.textAlign = "left";
      ctx.fillText(nomCourt, 4, y + lh - 8);
      var lx = 150;
      var larg = Math.round((p.w - lx - 44) * (valeurs[i] / max));
      ctx.fillStyle = "#f4511e";
      barre(ctx, lx, y + 3, Math.max(4, larg), Math.max(lh - 9, 2), 3);
      ctx.fill();
      ctx.fillStyle = "#23201a";
      ctx.fillText(String(valeurs[i]), lx + larg + 7, y + lh - 8);
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
      if (resume) resume.textContent = "⏳ Chargement des données…";
      var depuis = new Date(Date.now() - periode * 86400000);
      var lignes = [], de = 0;
      for (;;) {
        var r = await s.from("acces").select("debut,page,user_id")
          .gte("debut", depuis.toISOString())
          .order("debut", { ascending: true })
          .range(de, de + 999);
        if (r.error) throw r.error;
        lignes = lignes.concat(r.data);
        if (r.data.length < 1000 || lignes.length >= 20000) break;
        de += 1000;
      }
      /* Agrégation par jour */
      var jours = [], parJour = {}, actifsJour = {};
      for (var i = periode - 1; i >= 0; i--) {
        var c = jourCle(new Date(Date.now() - i * 86400000));
        jours.push(c); parJour[c] = 0; actifsJour[c] = {};
      }
      var pages = {}, utilisateurs = {};
      lignes.forEach(function (a) {
        if (!a.debut) return;
        var c = jourCle(new Date(a.debut));
        if (c in parJour) {
          parJour[c]++;
          if (a.user_id) { actifsJour[c][a.user_id] = 1; utilisateurs[a.user_id] = 1; }
        }
        var pg = String(a.page || "—").split("?")[0].split("#")[0].split("/").pop() || "—";
        pages[pg] = (pages[pg] || 0) + 1;
      });
      var top = Object.keys(pages).sort(function (a, b) { return pages[b] - pages[a]; }).slice(0, 8);
      dessinerBarresJours($("graph-jours"), jours, jours.map(function (j) { return parJour[j]; }), jours.map(function (j) { return Object.keys(actifsJour[j]).length; }));
      dessinerBarresPages($("graph-pages"), top, top.map(function (n) { return pages[n]; }));
      if (resume) {
        resume.textContent = "📈 " + lignes.length + " session(s) sur " + periode + " jour(s) · " +
          Object.keys(utilisateurs).length + " élève(s) actif(s) distinct(s). Barres violettes = sessions/jour, 👤 = élèves distincts ce jour-là.";
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
    var minuteur;
    window.addEventListener("resize", function () {
      clearTimeout(minuteur);
      minuteur = setTimeout(function () { if (dejaInit) charger(); }, 300);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
