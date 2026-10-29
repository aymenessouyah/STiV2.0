/* ══════════ STI v529 — VUES DES VIDÉOS (petit coin du tableau de bord) ══════════
   Consigne professeur : « un petit coin qui affiche le nombre de vues total de
   chaque vidéo » dans le tableau de bord admin.

   D'où viennent les chiffres (aucune table nouvelle, aucune écriture ici) :
   • chaque lecture réelle (≥ 2 s) d'une vidéo laisse une entrée
     « video:<slug> » dans la clé locale « sti-media-prog-v1 » ; sync-progressions.js
     la recopie dans le nuage (table sti_progressions, colonne donnees) ;
   • depuis la v529 cette entrée porte en plus « vues », un compteur par appareil
     ({ "<appareil>": n }) que protection.js incrémente à chaque lecture ; il est
     fusionné sans perte d'un appareil à l'autre (maximum par appareil) ;
   • une entrée ancienne (avant la v529) n'a pas ce champ : on la compte pour une
     lecture au moins — le passé n'a jamais été chiffré, on ne l'invente pas.

   Le module est ADDITIF et LECTURE SEULE : il ne s'affiche que si la section
   #vues-videos-admin existe dans la page (donc jamais sur une autre page) et il
   ne modifie aucune progression d'élève. Testable seul : window.STI_VUES_VIDEOS
   ({catalogue, analyser, pourcentageMedia, vuesDeLEntree, charger, rendre}). */
(function () {
  "use strict";
  if (window.__STI_VUES_VIDEOS_ADMIN) return;
  window.__STI_VUES_VIDEOS_ADMIN = true;

  var doc = document;
  var cfg = window.STI_AUTH || { URL: "https://vywujxmepvcbgedgmger.supabase.co", CLE: "sb_publishable_FI5FimytONd5VdWK6GfXLA_I6vPTrvn" };
  var CLE_MEDIA = "sti-media-prog-v1";

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

  var racine = null, elListe = null, elEtat = null, elResume = null, btn = null;
  var client = null;
  var dernier = null;
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

  function estComptePedagogique(r, profParId, profParMail) {
    var em = String((r && r.email) || "").trim().toLowerCase();
    var pr = (r && r.user_id && profParId[r.user_id]) || (em && profParMail[em]) || null;
    var email = pr && pr.email ? String(pr.email).trim().toLowerCase() : em;
    if (email === "elevelabo3@exemple.tn" || email === "aymenessouyah@gmail.com") return false;
    var classe = pr && pr.classe ? String(pr.classe).trim() : "";
    if (classe && /^(prof|professeur|enseignant|admin|elevelabo3|labo3)$/i.test(classe)) return false;
    return true;
  }

  /* Fonction PURE (testée) : agrège les progressions cloud en vues par vidéo.
     vues   = lectures cumulées (tous élèves, tous appareils)
     eleves = élèves distincts ayant lancé la vidéo (au moins 2 s) */
  function analyser(progRows, profils) {
    var profParId = {}, profParMail = {};
    (profils || []).forEach(function (p) {
      if (!p) return;
      if (p.id) profParId[p.id] = p;
      if (p.email) profParMail[String(p.email).trim().toLowerCase()] = p;
    });
    var compteurs = {};
    var elevesComptes = 0, elevesAyantVu = 0;
    (progRows || []).forEach(function (r) {
      if (!r || !estComptePedagogique(r, profParId, profParMail)) return;
      var d = parseSouple(r.donnees) || {};
      var mp = parseSouple(d[CLE_MEDIA]) || {};
      if (!mp || typeof mp !== "object") return;
      elevesComptes++;
      var aVuUneVideo = false;
      Object.keys(mp).forEach(function (k) {
        if (String(k).indexOf("video:") !== 0) return;
        var slug = String(k).slice(6);
        if (!slug) return;
        var e = mp[k];
        if (pourcentageMedia(e) <= 0) return;
        var c = compteurs[slug] || (compteurs[slug] = { vues: 0, eleves: 0 });
        c.eleves += 1;
        c.vues += vuesDeLEntree(e);
        aVuUneVideo = true;
      });
      if (aVuUneVideo) elevesAyantVu++;
    });
    var lignes = catalogue().map(function (v) {
      var c = compteurs[v.id] || { vues: 0, eleves: 0 };
      return { id: v.id, titre: v.titre, matiere: v.matiere, icone: v.icone, horsCatalogue: v.horsCatalogue, vues: c.vues, eleves: c.eleves };
    });
    /* Un média vu mais absent du catalogue connu (ancien slug, alias) ne disparaît pas. */
    Object.keys(compteurs).forEach(function (slug) {
      var deja = false;
      for (var i = 0; i < lignes.length; i++) { if (lignes[i].id === slug) { deja = true; break; } }
      if (deja) return;
      lignes.push({
        id: slug, titre: slug, matiere: "", icone: "🎬", horsCatalogue: true,
        vues: compteurs[slug].vues, eleves: compteurs[slug].eleves
      });
    });
    var totVues = 0, totEleves = 0;
    lignes.forEach(function (l) { totVues += l.vues; totEleves += l.eleves; });
    /* vues = lectures cumulées ; eleves = couples élève-vidéo ; elevesAyantVu = élèves
       distincts ayant lancé au moins une capsule ; elevesAnalyses = progressions lues. */
    return {
      lignes: lignes,
      vues: totVues,
      eleves: totEleves,
      elevesAyantVu: elevesAyantVu,
      elevesAnalyses: elevesComptes,
      maxVues: maxVuesLignes(lignes)
    };
  }

  function maxVuesLignes(lignes) {
    var max = 1;
    (lignes || []).forEach(function (l) { if (l.vues > max) max = l.vues; });
    return max;
  }

  function rendre(res) {
    if (!elListe) return;
    var lignes = (res && res.lignes ? res.lignes : []).slice();
    lignes.sort(function (a, b) {
      return (b.vues - a.vues) || (b.eleves - a.eleves) || String(a.titre).localeCompare(String(b.titre), "fr");
    });
    var max = maxVuesLignes(lignes);
    var html = "";
    lignes.forEach(function (l) {
      var pct = Math.max(0, Math.min(100, Math.round((l.vues / max) * 100)));
      var vide = !l.vues && !l.eleves;
      html += '<div class="vues-video' + (vide ? " vues-video-vide" : "") + (l.horsCatalogue ? " vues-video-hors-catalogue" : "") +
        '" data-video="' + ech(l.id) + '" data-vues="' + l.vues + '" title="' + ech(l.titre) + " — " + l.vues +
        " lecture(s) cumulée(s) · " + l.eleves + ' élève(s) ayant regardé">' +
        '<span class="vues-video-nom"><i aria-hidden="true">' + l.icone + "</i><span>" + ech(l.titre) + "</span></span>" +
        '<span class="vues-video-nb"><b>' + l.vues + "</b> vue" + (l.vues > 1 ? "s" : "") + "</span>" +
        '<span class="vues-video-detail">' + l.eleves + " élève" + (l.eleves > 1 ? "s" : "") + "</span>" +
        '<span class="vues-video-jauge" aria-hidden="true"><i style="width:' + pct + '%"></i></span>' +
        "</div>";
    });
    elListe.innerHTML = html || "<p class='vues-vide'>Aucune vidéo dans le catalogue.</p>";
    if (elResume) {
      elResume.textContent = lignes.length + " capsule" + (lignes.length > 1 ? "s" : "") + " · " +
        res.vues + " vue" + (res.vues > 1 ? "s" : "") + " au total · " +
        res.elevesAyantVu + " élève" + (res.elevesAyantVu > 1 ? "s" : "") + " devant au moins une vidéo";
      elResume.title = res.elevesAnalyses + " progression(s) d'élève lue(s) dans le nuage · " +
        res.eleves + " couple(s) élève-vidéo";
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
      if (!lignes.length) {
        etat(erreur ? "⚠️ Lecture refusée : " + (erreur.message || "session admin ?") : "ℹ️ Aucune progression vidéo synchronisée pour le moment.", erreur ? "#b91c1c" : "");
        dernier = analyser([], (res[1] && res[1].data) || []);
        rendre(dernier);
        return dernier;
      }
      dernier = analyser(lignes, (res[1] && res[1].data) || []);
      rendre(dernier);
      var h = new Date();
      etat("✅ À jour à " + String(h.getHours()).padStart(2, "0") + ":" + String(h.getMinutes()).padStart(2, "0"), "#16a34a");
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
    btn = doc.getElementById("btn-vues-videos");
    if (!elListe) return;
    if (btn) btn.addEventListener("click", function () { charger(3); });
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
      charger: charger,
      rendre: rendre,
      monter: monter,
      lignes: function () { return dernier; }
    };
  } catch (e) {}

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", monter);
  else monter();
})();
