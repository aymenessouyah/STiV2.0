/* ══════════ STI v529 → v531 — VUES DES VIDÉOS (petit coin du tableau de bord) ══════════
   Consigne professeur : « un petit coin qui affiche le nombre de vues total de
   chaque vidéo » dans le tableau de bord admin, avec filtre par classe, période
   et export CSV.

   D'où viennent les chiffres (aucune table nouvelle, aucune écriture ici) :
   • chaque lecture réelle (≥ 2 s) d'une vidéo laisse une entrée
     « video:<slug> » dans la clé locale « sti-media-prog-v1 » ; sync-progressions.js
     la recopie dans le nuage (table sti_progressions, colonne donnees) ;
   • depuis la v529 cette entrée porte « vues », un compteur par appareil
     ({ "<appareil>": n }) que protection.js incrémente à chaque lecture ; il est
     fusionné sans perte d'un appareil à l'autre (maximum par appareil) ;
   • depuis la v531 elle porte aussi « hist » ({ "<appareil>": { "AAAA-MM-JJ": n } }),
     le journal daté des lectures : c'est lui qui alimente « 7 derniers jours ».
     Le journal est purgé au-delà de 60 jours côté lecteur.
   • une entrée antérieure à la v531 n'a pas d'historique daté : sa dernière
     lecture connue (« ts ») sert alors d'estimation, signalée par « ≈ » — le
     passé n'a jamais été chiffré jour par jour, on ne l'invente pas.

   Le module est ADDITIF et LECTURE SEULE : il ne s'affiche que si la section
   #vues-videos-admin existe dans la page (donc jamais sur une autre page) et il
   ne modifie aucune progression d'élève. Testable seul : window.STI_VUES_VIDEOS
   ({catalogue, analyser, pourcentageMedia, vuesDeLEntree, versCsv, charger, rendre}). */
(function () {
  "use strict";
  if (window.__STI_VUES_VIDEOS_ADMIN) return;
  window.__STI_VUES_VIDEOS_ADMIN = true;

  var doc = document;
  var cfg = window.STI_AUTH || { URL: "https://vywujxmepvcbgedgmger.supabase.co", CLE: "sb_publishable_FI5FimytONd5VdWK6GfXLA_I6vPTrvn" };
  var CLE_MEDIA = "sti-media-prog-v1";
  var CLASSE_TOUTES = "*";
  var RE_CLASSE_TECHNIQUE = /^(prof|professeur|enseignant|admin|elevelabo3|labo3)$/i;
  /* Périodes proposées : 0 = tout l'historique cumulé. */
  var PERIODES = [
    { valeur: 0, libelle: "🗓️ Toutes les périodes", court: "cumulées" },
    { valeur: 7, libelle: "7 derniers jours", court: "sur 7 jours" },
    { valeur: 30, libelle: "30 derniers jours", court: "sur 30 jours" }
  ];

  /* Catalogue affiché : les 20 capsules publiques de l'accueil (mêmes identifiants
     que CATALOGUE_VIDEOS de app.js) puis les médias vidéo des pages de cours.
     Les titres sont volontairement courts : c'est un « petit coin ». */
  var CATALOGUE = [
    { id: "html5-cours", titre: "HTML5 — Structure & formulaires", matiere: "html5", icone: "🧱" },
    { id: "css3-cours", titre: "CSS3 — Sélecteurs, Flexbox", matiere: "css3", icone: "🎨" },
    { id: "css3-display", titre: "CSS3 — Display animé", matiere: "css3", icone: "🎨" },
    { id: "css-positionnement", titre: "CSS3 — Positionnement", matiere: "css3", icone: "🎨" },
    { id: "css-animee", titre: "CSS3 — Décoration, ombres", matiere: "css3", icone: "🎨" },
    { id: "javascript-cours", titre: "JavaScript — Récapitulatif", matiere: "javascript", icone: "⚡" },
    { id: "validation-nom-prenom-js", titre: "JS — Validation Nom & Prénom", matiere: "javascript", icone: "⚡" },
    { id: "tp-train-serie6", titre: "TP Train — Série 6", matiere: "javascript", icone: "⚡" },
    { id: "defis37-tableau-aleas-media", titre: "Les 37 Défis — Tableau & Média", matiere: "javascript", icone: "⚡" },
    { id: "boucle-pour", titre: "La boucle Pour — le sac", matiere: "javascript", icone: "🔁" },
    { id: "tp-evenements-liens", titre: "TP — Événements & liens", matiere: "javascript", icone: "⚡" },
    { id: "tp-formulaire-tableau-autre", titre: "TP — Formulaire & tableau", matiere: "javascript", icone: "⚡" },
    { id: "tp-display-float-position", titre: "TP — display, float, position", matiere: "javascript", icone: "⚡" },
    { id: "tp-transitions-animations", titre: "TP — Transitions & animations", matiere: "javascript", icone: "⚡" },
    { id: "sql-cours", titre: "SQL — SELECT & jointures", matiere: "sql", icone: "🗃️" },
    { id: "sql-initiation", titre: "SQL — Construire une requête", matiere: "sql", icone: "🗃️" },
    { id: "sql-serie4", titre: "SQL Série 4 — Jointures", matiere: "sql", icone: "🗃️" },
    { id: "sql-serie5", titre: "SQL Série 5 — Dates", matiere: "sql", icone: "🗃️" },
    { id: "php-cours", titre: "PHP & MySQLi", matiere: "php", icone: "🐘" },
    { id: "php-synthese", titre: "PHP — Synthèse élèves", matiere: "php", icone: "🐘" },
    { id: "php-guichet", titre: "PHP — Application Guichet", matiere: "php", icone: "🐘" },
    /* Médias vidéo présents dans les pages de cours (hors vitrine de l'accueil). */
    { id: "sql-serie1", titre: "SQL Série 1 — Création de tables", matiere: "sql", icone: "🗃️", horsCatalogue: true },
    { id: "sql-serie2", titre: "SQL Série 2 — SELECT & filtres", matiere: "sql", icone: "🗃️", horsCatalogue: true },
    { id: "sql-serie3", titre: "SQL Série 3 — Requêtes avancées", matiere: "sql", icone: "🗃️", horsCatalogue: true },
    { id: "sql-serie6", titre: "SQL Série 6", matiere: "sql", icone: "🗃️", horsCatalogue: true },
    { id: "explore-tunisie-flex", titre: "Explore Tunisie — Flex", matiere: "css3", icone: "🎨", horsCatalogue: true },
    { id: "explore-tunisie-float", titre: "Explore Tunisie — Float", matiere: "css3", icone: "🎨", horsCatalogue: true }
  ];

  var racine = null, elListe = null, elEtat = null, elResume = null, elClasse = null, elPeriode = null, btn = null, btnCsv = null;
  var client = null;
  var dernier = null;
  var donneesBrutes = null; /* { lignes: [], profils: [] } : lu une fois, refiltré localement */
  var classeActive = CLASSE_TOUTES;
  var periodeActive = 0;
  var chargementEnCours = false;

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
  /* Jour local au format AAAA-MM-JJ (les clés se comparent alors comme du texte). */
  function isoJour(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  /* Premier jour de la fenêtre : aujourd'hui + (jours - 1) jours en arrière. */
  function debutPeriode(jours) {
    var d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - (Math.max(1, Number(jours) || 1) - 1));
    return isoJour(d);
  }
  function libellePeriode(jours) {
    for (var i = 0; i < PERIODES.length; i++) { if (PERIODES[i].valeur === jours) return PERIODES[i]; }
    return PERIODES[0];
  }
  function jetonAdmin() {
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
  function sb() {
    if (client) return client;
    if (window.__STI_ADMIN_SB || window.__STI_SB_CLIENT) {
      client = window.__STI_ADMIN_SB || window.__STI_SB_CLIENT;
      return client;
    }
    try {
      client = window.supabase.createClient(cfg.URL, cfg.CLE, {
        auth: { persistSession: true, autoRefreshToken: false, detectSessionInUrl: false, lock: function (n, t, fn) { return fn(); } }
      });
    } catch (e) { client = null; }
    return client;
  }
  function etat(t, couleur) {
    if (!elEtat) return;
    elEtat.textContent = t;
    elEtat.style.color = couleur || "";
  }

  function catalogue() {
    return CATALOGUE.map(function (v) {
      return { id: v.id, titre: v.titre, matiere: v.matiere, icone: v.icone, horsCatalogue: Boolean(v.horsCatalogue) };
    });
  }

  /* Avancement enregistré pour un média (0 = jamais lancé). Même règle qu'analytique.js
     et que la roue : maxPct/pct, à défaut « ≥ 2 s » d'écoute. */
  function pourcentageMedia(e) {
    if (e == null) return 0;
    if (typeof e === "number") return Math.max(0, Math.min(100, Math.round(e)));
    if (typeof e !== "object") return 0;
    var p = Math.max(Number(e.maxPct) || 0, Number(e.pct) || 0);
    if (!p) {
      var s = Number(e.sec != null ? e.sec : (e.t != null ? e.t : e.time)) || 0;
      if (s >= 2) p = 1;
    }
    if (e.done && p < 100) p = 100;
    return Math.max(0, Math.min(100, Math.round(p)));
  }

  /* Nombre de lectures d'un média pour UN élève : somme des compteurs d'appareils.
     Entrée ancienne (sans « vues ») : une lecture au moins, jamais zéro inventé. */
  function vuesDeLEntree(e) {
    if (!e || typeof e !== "object") return 1;
    var v = e.vues;
    var total = 0;
    if (v && typeof v === "object") {
      Object.keys(v).forEach(function (app) {
        var n = Math.round(Number(v[app]));
        if (isFinite(n) && n > 0) total += n;
      });
      if (total > 0) return total;
      if (Object.keys(v).length) return 0;
    }
    return 1;
  }

  /* v531 : lectures d'un média DANS la fenêtre [depuis ; aujourd'hui], d'après le
     journal daté « hist » = { appareil: { "AAAA-MM-JJ": n } }.
     Entrée sans journal daté (avant la v531) : on rattache ses lectures connues à
     la date de sa dernière lecture (« ts »), et on le signale (estime = true).
     → { vues, estime }. */
  function vuesPeriodeDeLEntree(e, depuis) {
    if (!e || typeof e !== "object" || !depuis) return { vues: 0, estime: false };
    var h = e.hist, total = 0, aJournal = false;
    if (h && typeof h === "object") {
      Object.keys(h).forEach(function (app) {
        var jours = h[app];
        if (!jours || typeof jours !== "object") return;
        Object.keys(jours).forEach(function (jour) {
          aJournal = true;
          if (jour < depuis) return;
          var n = Math.round(Number(jours[jour]));
          if (isFinite(n) && n > 0) total += n;
        });
      });
    }
    if (aJournal) return { vues: total, estime: false };
    var ts = Number(e.ts) || 0;
    if (ts > 0) {
      var jourLecture = isoJour(new Date(ts));
      if (jourLecture >= depuis) return { vues: vuesDeLEntree(e), estime: true };
    }
    return { vues: 0, estime: false };
  }

  function profilDeLEleve(r, profParId, profParMail) {
    var em = String((r && r.email) || "").trim().toLowerCase();
    return (r && r.user_id && profParId[r.user_id]) || (em && profParMail[em]) || null;
  }

  function classeDeLEleve(r, profParId, profParMail) {
    var pr = profilDeLEleve(r, profParId, profParMail);
    var c = pr && pr.classe ? String(pr.classe).trim() : "";
    return c || "—";
  }

  function estComptePedagogique(r, profParId, profParMail) {
    var pr = profilDeLEleve(r, profParId, profParMail);
    var em = String((r && r.email) || "").trim().toLowerCase();
    var email = pr && pr.email ? String(pr.email).trim().toLowerCase() : em;
    if (email === "elevelabo3@exemple.tn" || email === "aymenessouyah@gmail.com") return false;
    var classe = pr && pr.classe ? String(pr.classe).trim() : "";
    if (classe && RE_CLASSE_TECHNIQUE.test(classe)) return false;
    return true;
  }

  /* Options : « 3SI » (compatibilité v530) ou { classe, jours }. */
  function normaliserOptions(options) {
    if (options == null) return { classe: CLASSE_TOUTES, jours: 0 };
    if (typeof options === "string" || typeof options === "number") {
      var c0 = String(options).trim();
      return { classe: c0 === "" ? CLASSE_TOUTES : c0, jours: 0 };
    }
    var c = options.classe == null ? "" : String(options.classe).trim();
    var j = Math.max(0, Math.round(Number(options.jours) || 0));
    if (j !== 7 && j !== 30) j = 0;
    return { classe: c === "" ? CLASSE_TOUTES : c, jours: j };
  }

  /* Fonction PURE (testée) : agrège les progressions cloud en vues par vidéo.
     Sans période : vues = lectures cumulées, eleves = élèves distincts.
     Avec période (jours = 7 ou 30) : vues / eleves ne comptent que la fenêtre,
     les cumuls restent dans cumulVues / cumulEleves pour l'infobulle et le CSV.
     classe : "*" (toutes) ou nom exact d'une classe — filtre côté élève. */
  function analyser(progRows, profils, options) {
    var opt = normaliserOptions(options);
    var filtre = opt.classe, jours = opt.jours;
    var depuis = jours > 0 ? debutPeriode(jours) : "";
    var profParId = {}, profParMail = {}, classes = {};
    (profils || []).forEach(function (p) {
      if (!p) return;
      if (p.id) profParId[p.id] = p;
      if (p.email) profParMail[String(p.email).trim().toLowerCase()] = p;
      var c = String(p.classe || "").trim();
      var mail = String(p.email || "").trim().toLowerCase();
      if (!c || RE_CLASSE_TECHNIQUE.test(c)) return;
      if (mail === "elevelabo3@exemple.tn" || mail === "aymenessouyah@gmail.com") return;
      classes[c] = 1;
    });
    var compteurs = {};
    var elevesComptes = 0, elevesAyantVu = 0, elevesPeriode = 0, estimees = 0;
    (progRows || []).forEach(function (r) {
      if (!r || !estComptePedagogique(r, profParId, profParMail)) return;
      if (filtre !== CLASSE_TOUTES && classeDeLEleve(r, profParId, profParMail) !== filtre) return;
      var d = parseSouple(r.donnees) || {};
      var mp = parseSouple(d[CLE_MEDIA]) || {};
      if (!mp || typeof mp !== "object") return;
      elevesComptes++;
      var aVuUneVideo = false, aVuPeriode = false;
      Object.keys(mp).forEach(function (k) {
        if (String(k).indexOf("video:") !== 0) return;
        var slug = String(k).slice(6);
        if (!slug) return;
        var e = mp[k];
        if (pourcentageMedia(e) <= 0) return;
        var c = compteurs[slug] || (compteurs[slug] = { cumulVues: 0, cumulEleves: 0, periodeVues: 0, periodeEleves: 0, estime: false });
        c.cumulVues += vuesDeLEntree(e);
        c.cumulEleves += 1;
        if (jours > 0) {
          var p = vuesPeriodeDeLEntree(e, depuis);
          if (p.vues > 0) {
            c.periodeVues += p.vues;
            c.periodeEleves += 1;
            aVuPeriode = true;
            if (p.estime) c.estime = true;
          }
        }
        aVuUneVideo = true;
      });
      if (aVuUneVideo) elevesAyantVu++;
      if (aVuPeriode) elevesPeriode++;
    });
    var periode = jours > 0;
    function ligneDe(v) {
      var c = compteurs[v.id] || { cumulVues: 0, cumulEleves: 0, periodeVues: 0, periodeEleves: 0, estime: false };
      if (c.estime) estimees++;
      return {
        id: v.id, titre: v.titre, matiere: v.matiere, icone: v.icone, horsCatalogue: Boolean(v.horsCatalogue),
        vues: periode ? c.periodeVues : c.cumulVues,
        eleves: periode ? c.periodeEleves : c.cumulEleves,
        cumulVues: c.cumulVues, cumulEleves: c.cumulEleves,
        periodeVues: c.periodeVues, periodeEleves: c.periodeEleves,
        estime: Boolean(c.estime)
      };
    }
    var lignes = catalogue().map(ligneDe);
    /* Un média vu mais absent du catalogue connu (ancien slug, alias) ne disparaît pas. */
    Object.keys(compteurs).forEach(function (slug) {
      for (var i = 0; i < lignes.length; i++) { if (lignes[i].id === slug) return; }
      lignes.push(ligneDe({ id: slug, titre: slug, matiere: "", icone: "🎬", horsCatalogue: true }));
    });
    var totVues = 0, totEleves = 0, totCumul = 0;
    lignes.forEach(function (l) { totVues += l.vues; totEleves += l.eleves; totCumul += l.cumulVues; });
    /* vues = lectures (de la période, sinon cumulées) ; eleves = couples élève-vidéo ;
       elevesAyantVu = élèves distincts ayant lancé une capsule ; elevesAnalyses =
       progressions lues ; cumulVues = total historique quel que soit le filtre. */
    return {
      lignes: lignes,
      vues: totVues,
      eleves: totEleves,
      elevesAyantVu: periode ? elevesPeriode : elevesAyantVu,
      elevesAnalyses: elevesComptes,
      maxVues: maxVuesLignes(lignes),
      classe: filtre,
      classes: Object.keys(classes).sort(function (a, b) { return a.localeCompare(b, "fr"); }),
      jours: jours,
      depuis: depuis,
      estimees: estimees,
      cumulVues: totCumul
    };
  }

  function maxVuesLignes(lignes) {
    var max = 1;
    (lignes || []).forEach(function (l) { if (l.vues > max) max = l.vues; });
    return max;
  }

  function trierLignes(lignes) {
    return (lignes || []).slice().sort(function (a, b) {
      return (b.vues - a.vues) || (b.eleves - a.eleves) || String(a.titre).localeCompare(String(b.titre), "fr");
    });
  }

  function rendre(res) {
    if (!elListe) return;
    var lignes = trierLignes(res && res.lignes ? res.lignes : []);
    var max = maxVuesLignes(lignes);
    var periode = Boolean(res && res.jours > 0);
    var fLigne = periode ? libellePeriode(res.jours).court : "cumulée(s)";
    var html = "";
    lignes.forEach(function (l) {
      var pct = Math.max(0, Math.min(100, Math.round((l.vues / max) * 100)));
      var vide = !l.vues && !l.eleves;
      var info = periode
        ? l.vues + " lecture(s) " + fLigne + " · " + l.eleves + " élève(s) · cumul " + l.cumulVues
        : l.vues + " lecture(s) cumulée(s) · " + l.eleves + " élève(s) ayant regardé";
      html += '<div class="vues-video' + (vide ? " vues-video-vide" : "") + (l.horsCatalogue ? " vues-video-hors-catalogue" : "") +
        '" data-video="' + ech(l.id) + '" data-vues="' + l.vues + '" data-eleves="' + l.eleves +
        '" data-cumul="' + l.cumulVues + '" data-estime="' + (l.estime ? "1" : "0") +
        '" title="' + ech(l.titre) + " — " + ech(info) + '">' +
        '<span class="vues-video-nom"><i aria-hidden="true">' + l.icone + "</i><span>" + ech(l.titre) + "</span></span>" +
        '<span class="vues-video-nb"><b>' + (l.estime ? "≈" : "") + l.vues + "</b> vue" + (l.vues > 1 ? "s" : "") + "</span>" +
        '<span class="vues-video-detail">' + l.eleves + " élève" + (l.eleves > 1 ? "s" : "") + "</span>" +
        '<span class="vues-video-jauge" aria-hidden="true"><i style="width:' + pct + '%"></i></span>' +
        "</div>";
    });
    elListe.innerHTML = html || "<p class='vues-vide'>Aucune vidéo dans le catalogue.</p>";
    if (elResume) {
      var classeTxt = res.classe && res.classe !== CLASSE_TOUTES ? " (" + res.classe + ")" : "";
      elResume.textContent = lignes.length + " capsule" + (lignes.length > 1 ? "s" : "") + " · " +
        res.vues + " vue" + (res.vues > 1 ? "s" : "") +
        (periode ? " " + libellePeriode(res.jours).court : " au total") + " · " +
        res.elevesAyantVu + " élève" + (res.elevesAyantVu > 1 ? "s" : "") +
        (periode ? " actif" + (res.elevesAyantVu > 1 ? "s" : "") : " devant au moins une vidéo") + classeTxt;
      elResume.title = res.elevesAnalyses + " progression(s) d'élève lue(s) dans le nuage · " +
        res.eleves + " couple(s) élève-vidéo · " + res.cumulVues + " vue(s) cumulée(s)";
    }
    if (btnCsv) btnCsv.disabled = !res;
  }

  /* Export CSV de ce qui est affiché (même classe, même période, même tri). */
  function versCsv(res) {
    var cellule = function (v) { return '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"'; };
    var periode = Boolean(res && res.jours > 0);
    var libelle = res && res.classe && res.classe !== CLASSE_TOUTES ? res.classe : "Toutes les classes";
    var lignes;
    if (periode) {
      lignes = ["Vidéo;Matière;Vues " + res.jours + " j;Élèves " + res.jours + " j;Vues cumulées;Élèves cumulés;Hors catalogue;Classe"];
    } else {
      lignes = ["Vidéo;Matière;Vues cumulées;Élèves;Hors catalogue;Classe"];
    }
    trierLignes(res && res.lignes ? res.lignes : []).forEach(function (l) {
      var cellules = periode
        ? [l.titre, l.matiere || "—", l.vues, l.eleves, l.cumulVues, l.cumulEleves, l.horsCatalogue ? "oui" : "non", libelle]
        : [l.titre, l.matiere || "—", l.vues, l.eleves, l.horsCatalogue ? "oui" : "non", libelle];
      lignes.push(cellules.map(cellule).join(";"));
    });
    if (res) {
      var tot = periode
        ? ["TOTAL", "", res.vues, res.elevesAyantVu, res.cumulVues, "", "", libelle]
        : ["TOTAL", "", res.vues, res.elevesAyantVu, "", libelle];
      lignes.push(tot.map(cellule).join(";"));
    }
    return lignes.join("\r\n");
  }

  function exporterCsv() {
    if (!dernier) return;
    try {
      var contenu = "\ufeff" + versCsv(dernier);
      var nom = "STI_V2_vues_videos_" +
        (dernier.classe && dernier.classe !== CLASSE_TOUTES ? String(dernier.classe).replace(/[^\w-]+/g, "_") : "toutes_classes") +
        (dernier.jours > 0 ? "_" + dernier.jours + "j" : "") +
        "_" + new Date().toISOString().slice(0, 10) + ".csv";
      var blob = new Blob([contenu], { type: "text/csv;charset=utf-8;" });
      var a = doc.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = nom;
      doc.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); if (a.parentNode) a.remove(); }, 1500);
      etat("📥 Export CSV : " + nom, "#16a34a");
    } catch (e) {
      etat("⚠️ Export impossible : " + (e && e.message ? e.message : "navigateur"), "#b91c1c");
    }
  }

  /* Liste déroulante des classes : reconstruite à chaque lecture, sélection gardée. */
  function remplirClasses(classes) {
    if (!elClasse) return;
    var garde = classeActive;
    var liste = (classes || []).slice();
    if (garde !== CLASSE_TOUTES && liste.indexOf(garde) < 0) liste.push(garde);
    var html = '<option value="*">🏫 Toutes les classes</option>';
    liste.forEach(function (c) { html += '<option value="' + ech(c) + '">' + ech(c) + "</option>"; });
    elClasse.innerHTML = html;
    elClasse.value = liste.indexOf(garde) >= 0 || garde === CLASSE_TOUTES ? garde : CLASSE_TOUTES;
    classeActive = elClasse.value;
  }

  /* Recalcule à partir des données déjà lues : aucune requête au changement de filtre. */
  function rafraichirAffichage() {
    if (!donneesBrutes) return;
    dernier = analyser(donneesBrutes.lignes, donneesBrutes.profils, { classe: classeActive, jours: periodeActive });
    rendre(dernier);
    remplirClasses(dernier.classes);
    var contexte = [];
    if (classeActive !== CLASSE_TOUTES) contexte.push("🏫 " + classeActive);
    if (periodeActive > 0) contexte.push("🗓️ " + dernier.jours + " derniers jours");
    if (!dernier.elevesAnalyses) {
      etat("ℹ️ Aucune progression pour " + (classeActive === CLASSE_TOUTES ? "les élèves" : "la classe " + classeActive) + ".", "#b45309");
    } else if (periodeActive > 0 && !dernier.vues) {
      etat("ℹ️ Aucune vue datée sur les " + dernier.jours + " derniers jours" +
        (classeActive !== CLASSE_TOUTES ? " en " + classeActive : "") +
        " (le comptage daté démarre avec la v531).", "#b45309");
    } else if (contexte.length) {
      etat(contexte.join(" · ") + " : " + dernier.elevesAnalyses + " élève(s) lu(s), " +
        (periodeActive > 0 ? dernier.vues + " vue(s) datée(s)" : dernier.vues + " vue(s) cumulée(s)") +
        (dernier.estimees ? " · " + dernier.estimees + " vidéo(s) estimée(s) ≈" : "") + ".", "#0f766e");
    }
  }

  function lireToutPagine(fabriquerRequete, plafond) {
    var acc = [], pas = 1000, max = plafond || 10000;
    function page(de) {
      if (de >= max) return Promise.resolve({ data: acc, error: null });
      var q = fabriquerRequete();
      var p = typeof q.range === "function" ? q.range(de, de + pas - 1) : q;
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

  function charger(essai) {
    if (!racine) return Promise.resolve(null);
    if (chargementEnCours) return Promise.resolve(dernier);
    var c = sb();
    if (!c) { etat("⚠️ Supabase indisponible dans cette page.", "#b91c1c"); return Promise.resolve(null); }
    if (!jetonAdmin() && (essai || 0) < 3) {
      etat("⏳ Session administrateur en cours de restauration…");
      return new Promise(function (resoudre) {
        setTimeout(function () { resoudre(charger((essai || 0) + 1)); }, 1200);
      });
    }
    chargementEnCours = true;
    if (btn) btn.disabled = true;
    etat("⏳ Lecture des progressions vidéo des élèves…");
    return Promise.all([
      lireToutPagine(function () { return c.from("sti_progressions").select("user_id,email,donnees").order("user_id", { ascending: true }); }, 5000),
      lireToutPagine(function () { return c.from("profiles").select("id,email,classe,statut").order("id", { ascending: true }); }, 5000)
    ]).then(function (res) {
      chargementEnCours = false;
      if (btn) btn.disabled = false;
      var lignes = (res[0] && res[0].data) || [];
      var erreur = res[0] && res[0].error;
      var profils = (res[1] && res[1].data) || [];
      donneesBrutes = { lignes: lignes, profils: profils };
      if (!lignes.length) {
        etat(erreur ? "⚠️ Lecture refusée : " + (erreur.message || "session admin ?") : "ℹ️ Aucune progression vidéo synchronisée pour le moment.", erreur ? "#b91c1c" : "");
        dernier = analyser([], profils, { classe: classeActive, jours: periodeActive });
        rendre(dernier);
        remplirClasses(dernier.classes);
        return dernier;
      }
      rafraichirAffichage();
      var h = new Date();
      var details = [];
      if (periodeActive > 0) details.push(dernier.jours + " derniers jours");
      if (classeActive !== CLASSE_TOUTES) details.push("classe " + classeActive);
      etat("✅ À jour à " + String(h.getHours()).padStart(2, "0") + ":" + String(h.getMinutes()).padStart(2, "0") +
        (details.length ? " · " + details.join(" · ") : ""), "#16a34a");
      return dernier;
    }).catch(function (e) {
      chargementEnCours = false;
      if (btn) btn.disabled = false;
      etat("⚠️ " + (e && e.message ? e.message : "échec de lecture des progressions"), "#b91c1c");
      return null;
    });
  }

  function monter() {
    if (racine) return;
    try { racine = doc.getElementById("vues-videos-admin"); } catch (e) { racine = null; }
    if (!racine) return;
    elListe = doc.getElementById("vues-videos-liste");
    elEtat = doc.getElementById("vues-videos-etat");
    elResume = doc.getElementById("vues-videos-resume");
    elClasse = doc.getElementById("vues-videos-classe");
    elPeriode = doc.getElementById("vues-videos-periode");
    btn = doc.getElementById("btn-vues-videos");
    btnCsv = doc.getElementById("btn-vues-videos-csv");
    if (!elListe) return;
    if (btn) btn.addEventListener("click", function () { charger(3); });
    if (btnCsv) btnCsv.addEventListener("click", exporterCsv);
    if (elClasse) {
      elClasse.addEventListener("change", function () {
        classeActive = elClasse.value || CLASSE_TOUTES;
        rafraichirAffichage();
      });
    }
    if (elPeriode) {
      elPeriode.addEventListener("change", function () {
        periodeActive = Math.max(0, Math.round(Number(elPeriode.value) || 0));
        rafraichirAffichage();
      });
    }
    var vue = false;
    function lancerUneFois() { if (vue) return; vue = true; charger(0); }
    /* Le tableau de bord charge déjà ses propres compteurs : on laisse passer
       ~1,4 s avant de lire les progressions, pour ne pas doubler le trafic. */
    function lancerDiffere() { setTimeout(lancerUneFois, 1400); }
    if ("IntersectionObserver" in window && racine.getBoundingClientRect) {
      var obs = new IntersectionObserver(function (entrees) {
        if (entrees[0] && entrees[0].isIntersecting) { lancerDiffere(); obs.disconnect(); }
      }, { rootMargin: "200px" });
      obs.observe(racine);
      /* Filet de sécurité : si l'observateur ne se déclenche jamais (onglet masqué), charger à 8 s. */
      setTimeout(lancerUneFois, 8000);
    } else {
      lancerDiffere();
    }
  }

  try {
    window.STI_VUES_VIDEOS = {
      catalogue: catalogue,
      analyser: analyser,
      pourcentageMedia: pourcentageMedia,
      vuesDeLEntree: vuesDeLEntree,
      vuesPeriodeDeLEntree: vuesPeriodeDeLEntree,
      debutPeriode: debutPeriode,
      periodes: PERIODES,
      versCsv: versCsv,
      exporterCsv: exporterCsv,
      charger: charger,
      rendre: rendre,
      monter: monter,
      lignes: function () { return dernier; }
    };
  } catch (e) {}

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", monter);
  else monter();
})();
