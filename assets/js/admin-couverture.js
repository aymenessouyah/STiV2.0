/* ══════════ STI v435 — COUVERTURE & ÉLÈVES À RISQUE (tableau de bord) ══════════
   Consigne auteur n°10 et 11 : la couverture du site (le journal « sti-pages-vues-v432 »
   que la roue de l'élève alimente déjà, et que sync-progressions.js copie dans le nuage)
   devient lisible par le professeur : une ligne par élève (pages vues / 145, dernière
   activité, moyenne quiz, signaux) + un export CSV « élèves à risque » pour le conseil
   de classe.

   Rien n'est modifié ni retiré : module ADDITIF, monté seulement si la section
   #couverture-risque-admin existe dans la page (donc invisible sur toute autre page).
   Aucune écriture : uniquement des lectures (profiles, sti_progressions, sti_quiz_parties,
   acces) + le manifeste généré au build (assets/pages-couverture.json).
   Testable seule : window.STI_COUV_ADMIN.{calculer, analyser, csv} ; sous-fenêtre debug. */
(function () {
  "use strict";
  if (window.__STI_COUV_ADMIN) return;
  window.__STI_COUV_ADMIN = true;
  var doc = document;
  var section = doc.getElementById("couverture-risque-admin");
  if (!section) return;

  var cfg = window.STI_AUTH || { URL: "https://vywujxmepvcbgedgmger.supabase.co", CLE: "sb_publishable_FI5FimytONd5VdWK6GfXLA_I6vPTrvn" };
  var JE_PAGES = "sti-pages-vues-v432";
  var seuilPct = 25, seuilJours = 14;
  var manifeste = null, dernier = [], client = null;

  var elClasse = doc.getElementById("couv-classe");
  var elSeuil = doc.getElementById("couv-seuil");
  var elJours = doc.getElementById("couv-jours");
  var elEtat = doc.getElementById("couv-etat");
  var elCorps = doc.getElementById("couv-corps");
  var btnCalc = doc.getElementById("btn-couv-generer");
  var btnCsv = doc.getElementById("btn-couv-csv");
  if (!btnCalc || !elCorps) return;

  function sb() {
    if (client) return client;
    if (window.__STI_ADMIN_SB || window.__STI_SB_CLIENT) { client = window.__STI_ADMIN_SB || window.__STI_SB_CLIENT; return client; }
    try { client = window.supabase.createClient(cfg.URL, cfg.CLE, { auth: { persistSession: true, autoRefreshToken: false, detectSessionInUrl: false, lock: function (n, t, fn) { return fn(); } } }); }
    catch (e) { client = null; }
    return client;
  }
  function etat(t, couleur) {
    if (!elEtat) return;
    elEtat.textContent = t;
    elEtat.style.color = couleur || "";
  }
  function ech(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function nomDe(p) {
    var n = String((p.prenom || "") + " " + (p.nom || "")).trim();
    return n || p.email || p.id;
  }
  function chargementManifeste() {
    if (manifeste) return Promise.resolve(manifeste);
    return fetch("assets/pages-couverture.json", { cache: "no-cache" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (j && j.pages && j.pages.length) { manifeste = j.pages.map(function (x) { return String(x).toLowerCase(); }); return manifeste; }
        return null;
      })
      .catch(function () { return null; });
  }
  function joursDepuis(iso) {
    var t = new Date(iso || 0).getTime();
    if (!t || isNaN(t)) return null;
    return Math.floor((Date.now() - t) / 86400000);
  }
  /* Fonction PURE (testable) : construit les lignes à partir des données brutes. */
  function analyser(profils, progRows, quizRows, accesRows, pages) {
    var total = (pages || []).length || 1;
    var setPages = {}; (pages || []).forEach(function (x) { setPages[x] = 1; });
    var journal = {}, maj = {};
    var mapChapPage = { HTML5: "cours/html5.html", CSS3: "cours/css3.html", JS: "cours/javascript.html", SQL: "cours/sql.html", PHP: "cours/php.html" };
    (progRows || []).forEach(function (r) {
      var d = r && r.donnees; if (typeof d === "string") { try { d = JSON.parse(d); } catch (e) { d = null; } }
      if (!d) return;
      var j = d[JE_PAGES]; if (typeof j === "string") { try { j = JSON.parse(j); } catch (e) { j = null; } }
      var acc = Object.assign({}, j || {});
      var bk = d["sti-reading-bookmarks"]; if (typeof bk === "string") { try { bk = JSON.parse(bk); } catch (e2) { bk = null; } }
      if (bk && typeof bk === "object") {
        Object.keys(bk).forEach(function (k) {
          var rel = bk[k] && bk[k].relUrl ? String(bk[k].relUrl).replace(/^\/+/, "").split("?")[0].split("#")[0] : "";
          if (rel) acc[rel] = 1;
        });
      }
      var rev = d["sti-revision-v436"]; if (typeof rev === "string") { try { rev = JSON.parse(rev); } catch (e3) { rev = null; } }
      if (rev && typeof rev === "object") {
        Object.keys(rev).forEach(function (k) {
          var relR = String(k).replace(/^\/+/, "").split("?")[0].split("#")[0];
          if (relR) acc[relR] = 1;
        });
      }
      var ch = d["sti-chapitres-vus"]; if (typeof ch === "string") { try { ch = JSON.parse(ch); } catch (e4) { ch = null; } }
      if (ch && typeof ch === "object") {
        Object.keys(ch).forEach(function (k) {
          var pgC = mapChapPage[String(k).toUpperCase()];
          if (ch[k] && pgC) acc[pgC] = 1;
        });
      }
      journal[r.user_id] = acc; maj[r.user_id] = r.maj || null;
    });
    var quiz = {}, acces = {};
    (quizRows || []).forEach(function (q) {
      var t = Number(q.total) || 0; if (!t) return;
      var a = quiz[q.user_id] || (quiz[q.user_id] = { s: 0, t: 0 });
      a.s += Number(q.score) || 0; a.t += t;
    });
    (accesRows || []).forEach(function (a) {
      var ts = new Date(a.debut || 0).getTime(); if (!ts || isNaN(ts)) return;
      if (!acces[a.user_id] || ts > acces[a.user_id]) acces[a.user_id] = ts;
    });
    var lignes = (profils || []).map(function (p) {
      var j = journal[p.id] || {}, vues = 0;
      Object.keys(j).forEach(function (k) { if (j[k] && setPages[String(k).toLowerCase()]) vues++; });
      var pct = Math.min(100, Math.round((vues * 100) / total));
      var dernierTs = acces[p.id] || (maj[p.id] ? new Date(maj[p.id]).getTime() : 0);
      var inactif = dernierTs ? Math.floor((Date.now() - dernierTs) / 86400000) : null;
      var note = quiz[p.id] && quiz[p.id].t ? Math.round((quiz[p.id].s / quiz[p.id].t) * 200) / 10 : null;
      var signaux = [];
      if (!vues) signaux.push({ t: "🕳 Jamais consulté", n: "rouge" });
      else if (pct < seuilPct) signaux.push({ t: "🌱 Faible couverture", n: "orange" });
      if (inactif === null) signaux.push({ t: "❔ Aucune activité", n: "orange" });
      else if (inactif >= seuilJours) signaux.push({ t: "😴 Inactif " + inactif + " j", n: "orange" });
      if (note !== null && note < 10) signaux.push({ t: "📉 Quiz " + note + "/20", n: "rouge" });
      var risque = signaux.length >= 2 ? "risque" : (signaux.length === 1 ? "vigilance" : "ok");
      return {
        id: p.id, nom: nomDe(p), classe: String(p.classe || "").trim() || "—", email: p.email || "",
        vues: vues, total: total, pct: pct, inactifJ: inactif, note: note, signaux: signaux, risque: risque,
      };
    });
    var ordre = { risque: 0, vigilance: 1, ok: 2 };
    lignes.sort(function (a, b) {
      var d = ordre[a.risque] - ordre[b.risque];
      return d !== 0 ? d : (a.pct - b.pct) || a.nom.localeCompare(b.nom);
    });
    return lignes;
  }
  function rendre(lignes) {
    var nbRisque = lignes.filter(function (l) { return l.risque !== "ok"; }).length;
    var moy = lignes.length ? Math.round(lignes.reduce(function (s, l) { return s + l.pct; }, 0) / lignes.length) : 0;
    var html = "<p class='couv-resume'>" + lignes.length + " élève" + (lignes.length > 1 ? "s" : "") +
      " · <b class='couv-nb-risque'>" + nbRisque + "</b> avec au moins un signal · couverture moyenne <b>" + moy + " %</b> sur " +
      (lignes[0] ? lignes[0].total : 0) + " pages</p>";
    if (!lignes.length) { elCorps.innerHTML = html + "<p class='couv-vide'>Aucun élève actif pour cette sélection.</p>"; return; }
    html += "<table class='carte-diff-table' id='table-couv-risque'><thead><tr><th>Élève</th><th>Classe</th>" +
      "<th>Couverture</th><th>Dernière activité</th><th>Moyenne quiz</th><th>Signaux</th></tr></thead><tbody>";
    lignes.forEach(function (l) {
      html += "<tr class='couv-ligne couv-" + l.risque + "'><td><b>" + ech(l.nom) + "</b><br><small>" + ech(l.email) + "</small></td>" +
        "<td>" + ech(l.classe) + "</td>" +
        "<td><span class='couv-jauge'><i style='width:" + l.pct + "%'></i></span> <b>" + l.pct + " %</b> <small>(" + l.vues + "/" + l.total + ")</small></td>" +
        "<td>" + (l.inactifJ === null ? "—" : (l.inactifJ === 0 ? "aujourd'hui" : "il y a " + l.inactifJ + " j")) + "</td>" +
        "<td>" + (l.note === null ? "—" : l.note + "/20") + "</td>" +
        "<td>" + (l.signaux.length ? l.signaux.map(function (s) { return "<span class='carte-diff-" + s.n + " couv-sig'>" + ech(s.t) + "</span>"; }).join(" ") : "<span class='carte-diff-vert couv-sig'>✅ régulier</span>") + "</td></tr>";
    });
    elCorps.innerHTML = html + "</tbody></table>";
  }
  function csv(lignes) {
    var l = ["Nom;Classe;E-mail;Couverture %;Pages vues;Total pages;Derniere activite (jours);Moyenne quiz /20;Signaux"];
    lignes.forEach(function (x) {
      l.push([x.nom, x.classe, x.email, x.pct, x.vues, x.total, (x.inactifJ === null ? "" : x.inactifJ), (x.note === null ? "" : x.note),
        x.signaux.map(function (s) { return s.t; }).join(" + ")].map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(";"));
    });
    return l.join("\r\n");
  }
  function telechargerCsv() {
    var lignes = dernier.filter(function (l) { return l.risque !== "ok"; });
    if (!lignes.length) { etat("⚠️ Aucun élève à risque dans cette sélection — rien à exporter.", "#b45309"); return; }
    try {
      var blob = new Blob(["\ufeff" + csv(lignes)], { type: "text/csv;charset=utf-8;" });
      var a = doc.createElement("a");
      a.href = URL.createObjectURL(blob);
      var cl = (elClasse && elClasse.value !== "*") ? String(elClasse.value).replace(/[^\w-]+/g, "_") : "toutes";
      a.download = "STI_V2_eleves_a_risque_" + cl + "_" + new Date().toISOString().slice(0, 10) + ".csv";
      doc.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
      etat("📥 " + lignes.length + " élève(s) à risque exporté(s) en CSV (Excel).", "#16a34a");
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
  function lireToutPagine(fabriquerRequete, plafond) {
    var acc = [], pas = 1000, max = plafond || 10000;
    function page(de) {
      if (de >= max) return Promise.resolve({ data: acc, error: null });
      var q = fabriquerRequete();
      var p = typeof q.range === "function" ? q.range(de, de + pas - 1) : (typeof q.limit === "function" ? q.limit(pas) : q);
      return Promise.resolve(p).then(function (r) {
        if (r && r.error) return acc.length ? { data: acc, error: null } : r;
        var lot = (r && Array.isArray(r.data)) ? r.data : [];
        acc = acc.concat(lot);
        if (typeof q.range !== "function" || lot.length < pas) return { data: acc, error: null };
        return page(de + pas);
      });
    }
    return page(0);
  }
  function calculer() {
    var c = sb();
    if (!c) { etat("⚠️ Supabase indisponible dans cette page.", "#b91c1c"); return Promise.reject(new Error("no client")); }
    seuilPct = Math.max(0, Math.min(100, parseInt(elSeuil && elSeuil.value, 10) || 25));
    seuilJours = Math.max(1, parseInt(elJours && elJours.value, 10) || 14);
    btnCalc.disabled = true;
    etat("⏳ Lecture des journaux de couverture, quiz et connexions…");
    return Promise.all([
      lireToutPagine(function () { return c.from("profiles").select("id,email,nom,prenom,classe,statut").order("id", { ascending: true }); }, 5000),
      lireToutPagine(function () { return c.from("sti_progressions").select("user_id,donnees,maj").order("user_id", { ascending: true }); }, 5000),
      lireToutPagine(function () { return c.from("sti_quiz_parties").select("user_id,score,total").order("cree_le", { ascending: false }).order("id", { ascending: false }); }, 20000),
      lireToutPagine(function () { return c.from("acces").select("user_id,debut").neq("page", "PROG_MEDIA").order("debut", { ascending: false }).order("id", { ascending: false }); }, 20000),
      chargementManifeste(),
    ]).then(function (res) {
      btnCalc.disabled = false;
      var profils = (res[0] && !res[0].error && res[0].data) || [];
      var pb = res[0] && res[0].error;
      if (!profils.length) {
        etat("⚠️ Profils illisibles : " + ((pb && pb.message) || "aucun élève renvoyé (session admin ?)"), "#b91c1c");
        return;
      }
      var pages = res[4];
      if (!pages) { etat("⚠️ Manifeste assets/pages-couverture.json introuvable — lancez outils/couverture/generer-couverture.py.", "#b91c1c"); return; }
      remplirClasses(profils);
      var classe = elClasse ? elClasse.value : "*";
      var actifs = profils.filter(function (p) {
        if (String(p.statut || "actif") !== "actif") return false;
        var cl = String(p.classe || "").trim();
        var em = String(p.email || "").trim().toLowerCase();
        if (em === "elevelabo3@exemple.tn" || em === "aymenessouyah@gmail.com") return false;
        if (classe === "*" && /^(prof|professeur|enseignant|admin|elevelabo3|labo3)$/i.test(cl)) return false;
        return classe === "*" || cl === classe;
      });
      dernier = analyser(actifs, res[1] && res[1].data, res[2] && res[2].data, res[3] && res[3].data, pages);
      rendre(dernier);
      var nR = dernier.filter(function (l) { return l.risque !== "ok"; }).length;
      etat("✅ " + dernier.length + " élève(s) analysé(s) · " + nR + " à signaler · seuils : couverture < " + seuilPct + " %, inactivité ≥ " + seuilJours + " j, quiz < 10/20.", "#16a34a");
    }).catch(function (e) {
      btnCalc.disabled = false;
      etat("⚠️ " + (e && e.message ? e.message : "échec de lecture"), "#b91c1c");
    });
  }
  btnCalc.addEventListener("click", function () { calculer(); });
  if (btnCsv) btnCsv.addEventListener("click", telechargerCsv);
  try { window.STI_COUV_ADMIN = { calculer: calculer, analyser: analyser, csv: csv, lireToutPagine: lireToutPagine, lignes: function () { return dernier; } }; } catch (e) {}
})();
