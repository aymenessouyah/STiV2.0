/* ══════════ STI v438 — SUIVI DE LA RÉVISION ESPACÉE (côté professeur) ══════════
   Le cycle de révision de la roue (J+1 / J+3 / J+7, journal « sti-revision-v436 ») est déjà
   copié dans le nuage par sync-progressions.js. Ce module le rend lisible pour le professeur :
   qui révise VRAIMENT, qui a des pages en retard, qui n'a jamais entamé son cycle.

   Ce que calcule chaque ligne (par élève actif) :
   - enCycle    : pages entrées dans le cycle de révision ;
   - revisées   : pages dont le cycle a été avancé au moins une fois (✔) ;
   - acquises   : pages vues qui sont SORTIES du cycle (acquises) ;
   - enRetard   : pages dont l'échéance est dépassée AUJOURD'HUI ;
   - adhesion % : revisées / (revisées + enCycle) — 100 % = l'élève fait ses révisions ;
   - dernierRev : date de la dernière révision faite (✔) ;
   - quizFaibles: quiz notés < 10/20 restant à refaire ;
   - signaux    : 🔴 cycle jamais entamé · 🕳 rien à réviser faute de pages vues ·
                  😴 inactivité · ⏰ retard accumulé · 📉 quiz faibles persistants.

   Lectures seules (profiles + sti_progressions + manifeste du build). Aucune écriture.
   Monté uniquement si #revision-admin existe : aucun effet sur les pages élèves.
   API de test : window.STI_SUIVI_REVISION.{calculer, analyser, csv, lignes}. */
(function () {
  "use strict";
  if (window.__STI_SUIVI_REVISION) return;
  window.__STI_SUIVI_REVISION = true;
  var doc = document;
  var section = doc.getElementById("revision-admin");
  if (!section) return;

  var cfg = window.STI_AUTH || { URL: "https://vywujxmepvcbgedgmger.supabase.co", CLE: "sb_publishable_FI5FimytONd5VdWK6GfXLA_I6vPTrvn" };
  var CLE_REV = "sti-revision-v436", CLE_VUES = "sti-pages-vues-v432", CLE_SCORES = "sti-mes-scores";
  var ETAPES = [1, 3, 7], JOUR = 86400000;
  var seuilAdhesion = 50, seuilRetard = 3, seuilJours = 14;
  var manifeste = null, dernier = [], client = null;

  var elClasse = doc.getElementById("rev-classe");
  var elAdh = doc.getElementById("rev-adhesion");
  var elRetard = doc.getElementById("rev-retard");
  var elEtat = doc.getElementById("rev-etat");
  var elCorps = doc.getElementById("rev-corps");
  var btnCalc = doc.getElementById("btn-rev-generer");
  var btnCsv = doc.getElementById("btn-rev-csv");
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
  function parse(v) {
    if (v == null) return null;
    if (typeof v === "object") return v;
    try { return JSON.parse(v); } catch (e) { return null; }
  }
  function chargementManifeste() {
    if (manifeste) return Promise.resolve(manifeste);
    return fetch("assets/pages-couverture.json", { cache: "no-cache" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        manifeste = (j && j.pages ? j.pages : []).map(function (x) { return String(x).toLowerCase(); });
        return manifeste.length ? manifeste : null;
      })
      .catch(function () { return null; });
  }
  function noteSur20(txt) {
    var s = String(txt == null ? "" : txt).trim();
    if (!s || (/\bpts?\b/i.test(s) && !/\/\s*\d+/.test(s) && !/%/.test(s))) return null;
    var mFrac = s.match(/(\d+(?:[.,]\d+)?)\s*\/\s*(\d+(?:[.,]\d+)?)/);
    if (mFrac) {
      var n = parseFloat(mFrac[1].replace(",", ".")), sur = parseFloat(mFrac[2].replace(",", "."));
      if (!isFinite(n) || !isFinite(sur) || sur <= 0 || n < 0 || n > sur) return null;
      return Math.round((n * 20 / sur) * 10) / 10;
    }
    var mPct = s.match(/(\d+(?:[.,]\d+)?)\s*%/);
    if (mPct) {
      var pct = parseFloat(mPct[1].replace(",", "."));
      if (!isFinite(pct) || pct < 0 || pct > 100) return null;
      return Math.round((pct * 20 / 100) * 10) / 10;
    }
    if (/^\d+(?:[.,]\d+)?$/.test(s)) {
      var v = parseFloat(s.replace(",", "."));
      if (isFinite(v) && v >= 0 && v <= 20) return Math.round(v * 10) / 10;
    }
    return null;
  }
  /* Fonction PURE (testable) : données brutes → lignes de suivi. */
  function analyser(profils, progRows, pages) {
    var setPages = {}; (pages || []).forEach(function (p) { setPages[p] = 1; });
    var maintenant = Date.now();
    var donnees = {};
    (progRows || []).forEach(function (r) { if (r && r.user_id) donnees[r.user_id] = parse(r.donnees) || {}; });

    var lignes = (profils || []).map(function (p) {
      var d = donnees[p.id] || {};
      var rev = parse(d[CLE_REV]) || {};
      var vues = parse(d[CLE_VUES]) || {};
      var scores = parse(d[CLE_SCORES]) || {};
      var enCycle = 0, revis = 0, enRetard = 0, retardMax = 0, dernierRev = 0, dernierMvt = 0;
      Object.keys(rev).forEach(function (slug) {
        if (pages && pages.length && !setPages[String(slug).toLowerCase()]) return;
        var e = rev[slug] || {};
        enCycle++;
        var etape = Math.min(ETAPES.length - 1, Math.max(0, Number(e.etape) || 0));
        if ((Number(e.etape) || 0) > 0) {
          revis++;
          var t = new Date(e.dernier || 0).getTime();
          if (t && !isNaN(t) && t > dernierRev) dernierRev = t;
        }
        var base = new Date(e.dernier || e.vu || 0).getTime();
        if (base && !isNaN(base)) {
          if (base > dernierMvt) dernierMvt = base;
          var ecart = Math.floor((maintenant - (base + ETAPES[etape] * JOUR)) / JOUR);
          if (ecart >= 0) { enRetard++; if (ecart + 1 > retardMax) retardMax = ecart + 1; }
        }
      });
      var vuesConnues = 0;
      Object.keys(vues).forEach(function (slug) { if (!pages || !pages.length || setPages[String(slug).toLowerCase()]) vuesConnues++; });
      var acquises = Math.max(0, vuesConnues - enCycle);
      var adhesion = (revis + enCycle) ? Math.round((revis * 100) / (revis + enCycle)) : null;
      var quizFaibles = 0, pires = [];
      Object.keys(scores).forEach(function (nom) {
        var n = noteSur20(scores[nom]);
        if (n !== null && n < 10) { quizFaibles++; pires.push({ nom: nom, note: n }); }
      });
      pires.sort(function (a, b) { return a.note - b.note; });
      /* inactivité = temps depuis le dernier mouvement du cycle (✔ OU entrée d'une page),
         pour qu'un élève qui n'a JAMAIS coché soit tout de même mesuré. */
      var inactifJ = dernierMvt ? Math.floor((maintenant - dernierMvt) / JOUR) : null;

      var signaux = [];
      if (!enCycle && !vuesConnues) signaux.push({ t: "🕳 aucune page vue", n: "orange" });
      else if (!enCycle && vuesConnues) signaux.push({ t: "🔴 cycle jamais entamé", n: "rouge" });
      else if (adhesion !== null && adhesion < seuilAdhesion) signaux.push({ t: "🔴 révise peu (" + adhesion + " %)", n: "rouge" });
      if (enRetard >= seuilRetard) signaux.push({ t: "⏰ " + enRetard + " en retard (max " + retardMax + " j)", n: "orange" });
      else if (enRetard > 0) signaux.push({ t: "⏰ " + enRetard + " à revoir", n: "orange" });
      if (inactifJ !== null && inactifJ >= seuilJours) signaux.push({ t: "😴 inactif " + inactifJ + " j", n: "orange" });
      if (quizFaibles) signaux.push({ t: "📉 " + quizFaibles + " quiz < 10/20", n: "orange" });
      var risque = signaux.filter(function (s) { return s.n === "rouge"; }).length ? "risque"
        : (signaux.length ? "vigilance" : "ok");
      return {
        id: p.id, nom: nomDe(p), classe: String(p.classe || "").trim() || "—", email: p.email || "",
        enCycle: enCycle, revis: revis, acquises: acquises, enRetard: enRetard, retardMax: retardMax,
        adhesion: adhesion, dernierRev: dernierRev || null, dernierMvt: dernierMvt || null, inactifJ: inactifJ,
        quizFaibles: quizFaibles, pires: pires, signaux: signaux, risque: risque,
      };
    });
    var ordre = { risque: 0, vigilance: 1, ok: 2 };
    lignes.sort(function (a, b) {
      var d = ordre[a.risque] - ordre[b.risque];
      if (d !== 0) return d;
      var aa = a.adhesion === null ? 101 : a.adhesion, bb = b.adhesion === null ? 101 : b.adhesion;
      return (aa - bb) || a.nom.localeCompare(b.nom);
    });
    return lignes;
  }
  function rendre(lignes) {
    var nbR = lignes.filter(function (l) { return l.risque !== "ok"; }).length;
    var avecAdh = lignes.filter(function (l) { return l.adhesion !== null; });
    var moy = avecAdh.length ? Math.round(avecAdh.reduce(function (s, l) { return s + l.adhesion; }, 0) / avecAdh.length) : null;
    var retardTot = lignes.reduce(function (s, l) { return s + l.enRetard; }, 0);
    var html = "<p class='couv-resume'>" + lignes.length + " élève" + (lignes.length > 1 ? "s" : "") +
      " · <b class='couv-nb-risque'>" + nbR + "</b> à signaler · adhésion moyenne <b>" +
      (moy === null ? "—" : moy + " %") + "</b> · <b>" + retardTot + "</b> page(s) en retard au total</p>";
    if (!lignes.length) { elCorps.innerHTML = html + "<p class='couv-vide'>Aucun élève actif pour cette sélection.</p>"; return; }
    html += "<table class='carte-diff-table' id='table-rev'><thead><tr><th>Élève</th><th>Classe</th>" +
      "<th>Cycle</th><th>Adhésion</th><th>En retard</th><th>Acquises</th><th>Dernière révision</th><th>Signaux</th></tr></thead><tbody>";
    lignes.forEach(function (l) {
      var jauge = l.adhesion === null
        ? "<span style='opacity:.6'>—</span>"
        : "<span class='couv-jauge'><i style='width:" + l.adhesion + "%'></i></span> <b>" + l.adhesion + " %</b>";
      html += "<tr class='couv-ligne couv-" + l.risque + "'><td><b>" + ech(l.nom) + "</b><br><small>" + ech(l.email) + "</small></td>" +
        "<td>" + ech(l.classe) + "</td>" +
        "<td>" + l.enCycle + " page" + (l.enCycle > 1 ? "s" : "") + " <small>(dont " + l.revis + " révisée" + (l.revis > 1 ? "s" : "") + ")</small></td>" +
        "<td>" + jauge + "</td>" +
        "<td>" + (l.enRetard ? "<b style='color:#b45309'>" + l.enRetard + "</b> <small>(max " + l.retardMax + " j)</small>" : "0") + "</td>" +
        "<td>" + l.acquises + "</td>" +
        "<td>" + (l.inactifJ === null ? "—" : (l.inactifJ === 0 ? "aujourd'hui" : "il y a " + l.inactifJ + " j")) + (l.revis ? "" : " <small>(jamais coché)</small>") + "</td>" +
        "<td>" + (l.signaux.length ? l.signaux.map(function (s) { return "<span class='carte-diff-" + s.n + " couv-sig'>" + ech(s.t) + "</span>"; }).join(" ") : "<span class='carte-diff-vert couv-sig'>✅ à jour</span>") + "</td></tr>";
    });
    elCorps.innerHTML = html + "</tbody></table>";
  }
  function csv(lignes) {
    var l = ["Nom;Classe;E-mail;Pages en cycle;Revisitees;Adhesion %;En retard;Retard max (j);Acquises;Derniere revision (j);Quiz < 10/20;Signaux"];
    lignes.forEach(function (x) {
      l.push([x.nom, x.classe, x.email, x.enCycle, x.revis, (x.adhesion === null ? "" : x.adhesion), x.enRetard, x.retardMax, x.acquises,
        (x.inactifJ === null ? "" : x.inactifJ), x.quizFaibles,
        x.signaux.map(function (s) { return s.t; }).join(" + ")]
        .map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(";"));
    });
    return l.join("\r\n");
  }
  function telecharger() {
    var lignes = dernier.filter(function (l) { return l.risque !== "ok"; });
    if (!lignes.length) { etat("⚠️ Aucun élève à signaler dans cette sélection — rien à exporter.", "#b45309"); return; }
    try {
      var blob = new Blob(["\ufeff" + csv(lignes)], { type: "text/csv;charset=utf-8;" });
      var a = doc.createElement("a");
      a.href = URL.createObjectURL(blob);
      var cl = (elClasse && elClasse.value !== "*") ? String(elClasse.value).replace(/[^\w-]+/g, "_") : "toutes";
      a.download = "STI_V2_suivi_revision_" + cl + "_" + new Date().toISOString().slice(0, 10) + ".csv";
      doc.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
      etat("📥 " + lignes.length + " élève(s) exporté(s) en CSV.", "#16a34a");
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
    seuilAdhesion = Math.max(0, Math.min(100, parseInt(elAdh && elAdh.value, 10) || 50));
    seuilRetard = Math.max(1, parseInt(elRetard && elRetard.value, 10) || 3);
    btnCalc.disabled = true;
    etat("⏳ Lecture des journaux de révision synchronisés…");
    return Promise.all([
      lireToutPagine(function () { return c.from("profiles").select("id,email,nom,prenom,classe,statut").order("id", { ascending: true }); }, 5000),
      lireToutPagine(function () { return c.from("sti_progressions").select("user_id,donnees,maj").order("user_id", { ascending: true }); }, 5000),
      chargementManifeste(),
    ]).then(function (res) {
      btnCalc.disabled = false;
      var profils = (res[0] && !res[0].error && res[0].data) || [];
      var pb = res[0] && res[0].error;
      if (!profils.length) { etat("⚠️ Profils illisibles : " + ((pb && pb.message) || "aucun élève renvoyé (session admin ?)"), "#b91c1c"); return; }
      var pages = res[2];
      if (!pages) { etat("⚠️ Manifeste assets/pages-couverture.json introuvable — lancez tools/pages-couverture.py.", "#b91c1c"); return; }
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
      dernier = analyser(actifs, res[1] && res[1].data, pages);
      rendre(dernier);
      var nbR = dernier.filter(function (l) { return l.risque !== "ok"; }).length;
      etat("✅ " + dernier.length + " élève(s) analysé(s) · " + nbR + " à signaler · seuils : adhésion < " + seuilAdhesion + " %, retard ≥ " + seuilRetard + " pages, inactivité ≥ " + seuilJours + " j.", "#16a34a");
    }).catch(function (e) {
      btnCalc.disabled = false;
      etat("⚠️ " + (e && e.message ? e.message : "échec de lecture"), "#b91c1c");
    });
  }
  btnCalc.addEventListener("click", function () { calculer(); });
  if (btnCsv) btnCsv.addEventListener("click", telecharger);
  try { window.STI_SUIVI_REVISION = { calculer: calculer, analyser: analyser, csv: csv, lireToutPagine: lireToutPagine, lignes: function () { return dernier; } }; } catch (e) {}
})();
