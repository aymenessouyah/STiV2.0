/* ═══ STI ANALYTIQUE (v463) — Agrégation complète des progressions cloud (admin) ═══
   Lit sti_progressions + profiles + sti_quiz_parties pour synthétiser :
   pages vues (/124), cours/chapitres, exercices, vidéos (.mp4 /15), audios (.mp3 /8) et quiz. */
(function () {
  "use strict";
  var cfg = window.STI_AUTH || { URL: "https://vywujxmepvcbgedgmger.supabase.co", CLE: "sb_publishable_FI5FimytONd5VdWK6GfXLA_I6vPTrvn" };
  var TOTAL_PAGES_SITE = 124;
  var TOTAL_VIDEOS_SITE = 15;
  var TOTAL_AUDIOS_SITE = 8;

  function ech(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function parseSouple(v) {
    if (v == null) return null;
    if (typeof v === "object") return v;
    if (typeof v === "string") { try { return JSON.parse(v); } catch (e) { return null; } }
    return null;
  }
  function sessionAdmin() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i) || "";
        if (k.indexOf("sb-") === 0 && k.indexOf("-auth-token") !== -1) {
          var v = JSON.parse(localStorage.getItem(k) || "null");
          if (v && v.access_token) return v.access_token;
          if (v && v.currentSession && v.currentSession.access_token) return v.currentSession.access_token;
        }
      }
    } catch (e) {}
    return null;
  }
  function barre(pct) {
    var p = Math.max(0, Math.min(100, Math.round(Number(pct) || 0)));
    var col = p >= 70 ? "#15803d" : p >= 35 ? "#d97706" : "#c0392b";
    return '<div style="background:var(--adm-border,#e2e8f0);border-radius:999px;height:13px;min-width:120px;overflow:hidden"><div style="height:100%;width:' + p + '%;background:' + col + '"></div></div>';
  }
  function analyser(lignes, profils, partiesQuiz) {
    var profParId = {}, profParMail = {};
    (profils || []).forEach(function (p) {
      if (!p) return;
      if (p.id) profParId[p.id] = p;
      if (p.email) profParMail[String(p.email).trim().toLowerCase()] = p;
    });
    var quizParUser = {};
    (partiesQuiz || []).forEach(function (q) {
      if (!q || !q.user_id) return;
      quizParUser[q.user_id] = (quizParUser[q.user_id] || 0) + 1;
    });

    var medias = {}, chapitres = {}, eleves = [];
    (lignes || []).forEach(function (l) {
      if (!l) return;
      var em = String(l.email || "").trim().toLowerCase();
      if (em === "elevelabo3@exemple.tn" || em === "aymenessouyah@gmail.com") return;
      var pr = (l.user_id && profParId[l.user_id]) || (em && profParMail[em]) || null;
      if (pr && /^(prof|professeur|enseignant|admin|elevelabo3|labo3)$/i.test(String(pr.classe || "").trim())) return;

      var d = parseSouple(l.donnees) || {};
      var pv = parseSouple(d["sti-pages-vues-v432"]) || {};
      var chVus = parseSouple(d["sti-chapitres-vus"]) || {};
      var revC = parseSouple(d["sti-revised-courses"]) || {};
      var exos = parseSouple(d["sti-exos-faits"]) || {};
      var mp = parseSouple(d["sti-media-prog-v1"]) || {};
      var sc = parseSouple(d["sti-mes-scores"]) || {};

      var nbPages = Object.keys(pv).filter(function (k) { return Boolean(pv[k]); }).length;
      var coursSet = {};
      Object.keys(chVus).forEach(function (k) { if (chVus[k]) { coursSet[String(k).toUpperCase()] = 1; chapitres[String(k).toUpperCase()] = (chapitres[String(k).toUpperCase()] || 0) + 1; } });
      Object.keys(revC).forEach(function (k) { if (revC[k]) { var ck = String(k).toUpperCase(); coursSet[ck] = 1; chapitres[ck] = (chapitres[ck] || 0) + 1; } });
      Object.keys(pv).forEach(function (k) { if (/^cours\//i.test(k) && pv[k]) coursSet[k.toLowerCase()] = 1; });

      var nbExos = Array.isArray(exos) ? exos.length : Object.keys(exos).filter(function (k) { return Boolean(exos[k]); }).length;
      Object.keys(pv).forEach(function (k) { if (/^exercices\//i.test(k) && pv[k]) nbExos++; });
      Object.keys(d).forEach(function (k) { if (k.indexOf("sti-autosave-v1:") === 0 && d[k]) nbExos++; });

      var nbVid = 0, nbAud = 0;
      Object.keys(mp).forEach(function (k) {
        var e = mp[k];
        var pctM = typeof e === "number" ? e : Number((e && (e.maxPct != null ? e.maxPct : e.pct)) || ((e && e.done) ? 100 : 0));
        if (pctM > 0) {
          if (k.indexOf("video:") === 0) nbVid++;
          else if (k.indexOf("audio:") === 0) nbAud++;
          medias[k] = medias[k] || [0, 0];
          medias[k][0] += Math.min(100, pctM);
          medias[k][1]++;
        }
      });

      var nbQuiz = (l.user_id && quizParUser[l.user_id]) || 0;
      var nbScoresLoc = Object.keys(sc).filter(function (k) { return /(\/\s*\d+|%)/.test(String(sc[k] || "")); }).length;
      if (nbScoresLoc > nbQuiz) nbQuiz = nbScoresLoc;

      var pctGlobal = Math.min(100, Math.round(
        (Math.min(1, nbPages / 30) * 35) +
        (Math.min(1, Object.keys(coursSet).length / 5) * 20) +
        (Math.min(1, (nbVid + nbAud) / 8) * 25) +
        (Math.min(1, nbQuiz / 3) * 20)
      ));

      var nomAff = pr ? (((pr.nom || "") + " " + (pr.prenom || "")).trim() || pr.email || em) : (em || "(sans e-mail)");
      var clAff = pr && pr.classe ? pr.classe : "—";
      eleves.push({
        nom: nomAff,
        classe: clAff,
        nbPages: nbPages,
        nbCours: Object.keys(coursSet).length,
        nbExos: nbExos,
        nbVid: nbVid,
        nbAud: nbAud,
        nbQuiz: nbQuiz,
        pct: pctGlobal,
        maj: l.maj
      });
    });

    var clesMed = Object.keys(medias).sort(function (a, b) {
      return (medias[b][0] / Math.max(1, medias[b][1])) - (medias[a][0] / Math.max(1, medias[a][1]));
    });
    var html = "<p><b>" + eleves.length + " élève(s)</b> disposent d'une progression synchronisée dans le cloud.</p>";

    if (clesMed.length) {
      html += "<h3>🎬🔊 Vidéos (.mp4) &amp; Audios (.mp3) — avancement moyen</h3><table style='border-collapse:collapse;width:100%;margin-bottom:14px'><tr><th style='text-align:left;border-bottom:2px solid var(--adm-border-strong,#1a1a2e);padding:6px'>Média</th><th style='border-bottom:2px solid var(--adm-border-strong,#1a1a2e);padding:6px'>Avancement</th><th style='border-bottom:2px solid var(--adm-border-strong,#1a1a2e);padding:6px'>Détail</th></tr>";
      clesMed.forEach(function (k) {
        var moy = Math.round(medias[k][0] / Math.max(1, medias[k][1]));
        var ico = k.indexOf("audio:") === 0 ? "🔊 " : "🎬 ";
        html += "<tr><td style='padding:6px;border-bottom:1px solid var(--adm-border,#ddd)'><b>" + ico + ech(k.replace(/^(video|audio):/, "")) + "</b></td><td style='padding:6px;border-bottom:1px solid var(--adm-border,#ddd)'>" + barre(moy) + "</td><td style='padding:6px;border-bottom:1px solid var(--adm-border,#ddd)'><b>" + moy + " %</b> (" + medias[k][1] + " élève(s))</td></tr>";
      });
      html += "</table>";
    }

    html += "<h3>👥 Détail complet par élève (Pages · Cours · Exercices · Vidéos · Audios · Quiz)</h3><div style='overflow-x:auto'><table style='border-collapse:collapse;width:100%;font-size:13px'><tr><th style='text-align:left;border-bottom:2px solid var(--adm-border-strong,#1a1a2e);padding:6px'>Élève</th><th style='text-align:left;border-bottom:2px solid var(--adm-border-strong,#1a1a2e);padding:6px'>Classe</th><th style='border-bottom:2px solid var(--adm-border-strong,#1a1a2e);padding:6px'>📄 Pages</th><th style='border-bottom:2px solid var(--adm-border-strong,#1a1a2e);padding:6px'>📚 Cours</th><th style='border-bottom:2px solid var(--adm-border-strong,#1a1a2e);padding:6px'>✏️ Exos</th><th style='border-bottom:2px solid var(--adm-border-strong,#1a1a2e);padding:6px'>🎬 Vidéos</th><th style='border-bottom:2px solid var(--adm-border-strong,#1a1a2e);padding:6px'>🔊 Audios</th><th style='border-bottom:2px solid var(--adm-border-strong,#1a1a2e);padding:6px'>🎯 Quiz</th><th style='border-bottom:2px solid var(--adm-border-strong,#1a1a2e);padding:6px'>Indice global</th><th style='border-bottom:2px solid var(--adm-border-strong,#1a1a2e);padding:6px'>Dernière synchro</th></tr>";
    eleves.sort(function (a, b) { return b.pct - a.pct || b.nbPages - a.nbPages; }).forEach(function (e) {
      html += "<tr>" +
        "<td style='padding:6px;border-bottom:1px solid var(--adm-border,#ddd)'><b>" + ech(e.nom) + "</b></td>" +
        "<td style='padding:6px;border-bottom:1px solid var(--adm-border,#ddd)'>" + ech(e.classe) + "</td>" +
        "<td style='padding:6px;border-bottom:1px solid var(--adm-border,#ddd);text-align:center'><b>" + e.nbPages + "</b>/" + TOTAL_PAGES_SITE + "</td>" +
        "<td style='padding:6px;border-bottom:1px solid var(--adm-border,#ddd);text-align:center'><b>" + e.nbCours + "</b></td>" +
        "<td style='padding:6px;border-bottom:1px solid var(--adm-border,#ddd);text-align:center'><b>" + e.nbExos + "</b></td>" +
        "<td style='padding:6px;border-bottom:1px solid var(--adm-border,#ddd);text-align:center'><b>" + e.nbVid + "</b>/" + TOTAL_VIDEOS_SITE + "</td>" +
        "<td style='padding:6px;border-bottom:1px solid var(--adm-border,#ddd);text-align:center'><b>" + e.nbAud + "</b>/" + TOTAL_AUDIOS_SITE + "</td>" +
        "<td style='padding:6px;border-bottom:1px solid var(--adm-border,#ddd);text-align:center'><b>" + e.nbQuiz + "</b></td>" +
        "<td style='padding:6px;border-bottom:1px solid var(--adm-border,#ddd)'>" + barre(e.pct) + "<small style='font-weight:800'>" + e.pct + " %</small></td>" +
        "<td style='padding:6px;border-bottom:1px solid var(--adm-border,#ddd);font-size:11.5px'>" + (e.maj ? ech(new Date(e.maj).toLocaleString("fr-FR")) : "—") + "</td>" +
      "</tr>";
    });
    return html + "</table></div>";
  }

  function chargerTablePaginee(urlBase, hd, tolerant) {
    var acc = [];
    var pas = 1000;
    function page(offset) {
      if (offset >= 50000) return Promise.resolve(acc);
      var sep = urlBase.indexOf("?") === -1 ? "?" : "&";
      return fetch(urlBase + sep + "limit=" + pas + "&offset=" + offset, { headers: hd })
        .then(function (r) {
          if (!r || !r.ok) {
            if (tolerant) return [];
            return Promise.reject(r ? r.status : 0);
          }
          return r.json();
        })
        .then(function (lot) {
          if (!Array.isArray(lot) || !lot.length) return acc;
          acc = acc.concat(lot);
          if (lot.length < pas) return acc;
          return page(offset + pas);
        })
        .catch(function (err) {
          if (tolerant) return acc;
          return Promise.reject(err);
        });
    }
    return page(0);
  }

  function panneau() {
    var exist = document.getElementById("sti-analytique");
    if (exist) { exist.remove(); return; }
    var ov = document.createElement("div"); ov.id = "sti-analytique";
    ov.setAttribute("role", "dialog");
    ov.setAttribute("aria-modal", "true");
    ov.setAttribute("style", 'position:fixed;inset:4% 4%;z-index:100000;background:var(--adm-surface,#fffdf7);border:3px solid var(--adm-border-strong,#1a1a2e);border-radius:18px;box-shadow:8px 8px 0 rgba(15,23,42,.35);padding:22px 26px;overflow:auto;font-family:"Comic Sans MS","Comic Sans","Comic Neue","Chalkboard SE",cursive,sans-serif;color:var(--adm-text,#1a1a2e);');
    ov.innerHTML = '<button type="button" id="sti-ana-fermer" style="float:right;padding:8px 14px;border-radius:10px;border:2px solid var(--adm-border-strong,#1a1a2e);background:var(--adm-surface-2,#fff);color:var(--adm-text,#1a1a2e);font-weight:800;cursor:pointer">✕ Fermer</button>'
      + '<h2 style="margin-top:0">📊 Analytique complète des progressions (cloud)</h2><div id="sti-ana-corps"><p>⏳ Chargement des progressions des élèves…</p></div>';
    document.body.appendChild(ov);
    function fermer() { if (ov.parentNode) ov.remove(); document.removeEventListener("keydown", onEsc); }
    function onEsc(ev) { if (ev.key === "Escape") fermer(); }
    document.addEventListener("keydown", onEsc);
    document.getElementById("sti-ana-fermer").addEventListener("click", fermer);
    var token = sessionAdmin(), corps = document.getElementById("sti-ana-corps");
    if (!token) { corps.innerHTML = "<p>⚠️ Aucune session Supabase détectée : connectez-vous en administrateur puis rouvrez ce panneau.</p>"; return; }
    var hd = { "apikey": cfg.CLE, "Authorization": "Bearer " + token };
    Promise.all([
      chargerTablePaginee(cfg.URL + "/rest/v1/sti_progressions?select=user_id,email,donnees,maj&order=maj.desc,user_id.asc", hd, false),
      chargerTablePaginee(cfg.URL + "/rest/v1/profiles?select=id,email,nom,prenom,classe,statut&order=id.asc", hd, true),
      chargerTablePaginee(cfg.URL + "/rest/v1/sti_quiz_parties?select=user_id,quiz,score,total&order=id.asc", hd, true)
    ])
      .then(function (res) {
        var lignes = res[0] || [];
        if (!lignes.length) { corps.innerHTML = "<p>ℹ️ Aucune progression synchronisée pour le moment.</p>"; return; }
        corps.innerHTML = analyser(lignes, res[1] || [], res[2] || []);
      })
      .catch(function (st) { corps.innerHTML = "<p>⚠️ Lecture refusée (HTTP " + ech(st) + ").</p>"; });
  }
  function bouton() {
    if (document.getElementById("sti-btn-analytique")) return;
    var b = document.createElement("button");
    b.id = "sti-btn-analytique"; b.type = "button"; b.textContent = "📊 Analytique progressions";
    b.setAttribute("style", 'position:fixed;left:14px;bottom:64px;z-index:99999;padding:11px 16px;border-radius:999px;border:3px solid #1a1a2e;background:#0f766e;color:#fff;font-family:"Comic Sans MS","Comic Sans","Comic Neue","Chalkboard SE",cursive,sans-serif;font-weight:800;font-size:14px;cursor:pointer;box-shadow:4px 4px 0 #1a1a2e;');
    b.addEventListener("click", panneau);
    document.body.appendChild(b);
  }
  window.STI_ANALYTIQUE = {
    chargerTablePaginee: chargerTablePaginee,
    analyser: analyser,
    ouvrirPanneau: panneau
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bouton); else bouton();
})();
