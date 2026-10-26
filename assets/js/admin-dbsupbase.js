/* ══════════ STI v466 — DBSupbase : Niveau de chaque table par rapport à 1 000 lignes ══════════
   Affiche en direct dans le tableau de bord administrateur (#bloc-sec-dbsupbase) le remplissage
   exact de chacune des 15 tables public de Supabase par rapport au plafond par requête PostgREST
   de 1 000 lignes, avec jauges visuelles, alertes de seuil, tri/filtre, export CSV et cache hors ligne.
   Source principale : RPC sécurisée public.admin_dbsupbase_niveaux() (SECURITY DEFINER + est_admin()).
   Repli automatique : requêtes HEAD exactes PostgREST + cache localStorage « sti-dbsupbase-v466 ». */
(function () {
  "use strict";
  if (window.__STI_DBSUPBASE_INIT) return;
  window.__STI_DBSUPBASE_INIT = true;

  var SEUIL_LIGNES = 1000;
  var CLE_CACHE = "sti-dbsupbase-v466";

  var TABLES_META = {
    profiles: { icone: "👥", libelle: "Abonnés, profils élèves & compte administrateur", actionPurge: "" },
    acces: { icone: "🕒", libelle: "Connexions, messages par classe, Coffre TP & journaux", actionPurge: "purge-acces" },
    sti_progressions: { icone: "📈", libelle: "Progressions cours, vidéos, signets & révision espacée", actionPurge: "" },
    sti_quiz_reponses: { icone: "🎯", libelle: "Détail des réponses & erreurs aux questions de quiz", actionPurge: "purge-quiz" },
    sti_quiz_parties: { icone: "🏆", libelle: "Parties de quiz terminées & moyennes (/20)", actionPurge: "purge-quiz" },
    sti_quiz_sessions: { icone: "⏳", libelle: "Sessions de quiz en cours (reprise automatique)", actionPurge: "" },
    sti_quiz_vus: { icone: "👁️", libelle: "Tirages de questions déjà vues par candidat", actionPurge: "" },
    sti_diagnostics: { icone: "🩺", libelle: "Journaux techniques & erreurs clientes remontées", actionPurge: "quota-modal" },
    sti_observations: { icone: "📝", libelle: "Observations pédagogiques par classe & élève", actionPurge: "" },
    labo_devices: { icone: "🖥️", libelle: "Postes machines enregistrés au Labo 3", actionPurge: "" },
    labo_device_sessions: { icone: "🔌", libelle: "Sessions actives des postes du Labo 3", actionPurge: "" },
    labo_device_messages: { icone: "💬", libelle: "Messages directs Professeur ↔ Postes Labo 3", actionPurge: "" },
    badges_labo: { icone: "🪪", libelle: "Badges d'accès rapide au labo (codes 6 caractères)", actionPurge: "" },
    app_config_public: { icone: "⚙️", libelle: "Configuration publique & news du bandeau d'accueil", actionPurge: "" },
    push_subscriptions: { icone: "🔔", libelle: "Abonnements aux notifications Push Web", actionPurge: "" }
  };

  var ORDRE_TABLES_DEFAUT = [
    "profiles",
    "sti_quiz_reponses",
    "sti_progressions",
    "labo_devices",
    "sti_diagnostics",
    "acces",
    "labo_device_messages",
    "sti_quiz_parties",
    "app_config_public",
    "labo_device_sessions",
    "sti_quiz_vus",
    "badges_labo",
    "push_subscriptions",
    "sti_observations",
    "sti_quiz_sessions"
  ];

  var doc = document;
  var section = doc.getElementById("bloc-sec-dbsupbase");
  if (!section) return;

  var cfg = window.STI_AUTH || {
    URL: "https://vywujxmepvcbgedgmger.supabase.co",
    CLE: "sb_publishable_FI5FimytONd5VdWK6GfXLA_I6vPTrvn"
  };

  var client = null;
  var enChargement = false;
  var dejaChargeUneFois = false;
  var dernierEtat = null;

  var elKpiTables = doc.getElementById("dbsb-kpi-tables");
  var elKpiMax = doc.getElementById("dbsb-kpi-max");
  var elKpiMaxSub = doc.getElementById("dbsb-kpi-max-sub");
  var elKpiAlertes = doc.getElementById("dbsb-kpi-alertes");
  var elKpiAlertesSub = doc.getElementById("dbsb-kpi-alertes-sub");
  var elKpiTotal = doc.getElementById("dbsb-kpi-total");
  var elKpiTotalSub = doc.getElementById("dbsb-kpi-total-sub");
  var elEtat = doc.getElementById("dbsb-etat");
  var elGrille = doc.getElementById("dbsb-grille-tables");
  var elTri = doc.getElementById("dbsb-tri");
  var elFiltre = doc.getElementById("dbsb-filtre");
  var btnActualiser = doc.getElementById("btn-dbsb-actualiser");
  var btnCsv = doc.getElementById("btn-dbsb-csv");
  var btnPurge = doc.getElementById("btn-dbsb-nettoyeur");
  var elBadgeTab = doc.getElementById("badge-dbsupbase-tab");

  function ech(t) {
    return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function obtenirClient() {
    if (client) return client;
    if (window.__STI_ADMIN_SB && typeof window.__STI_ADMIN_SB.rpc === "function") {
      client = window.__STI_ADMIN_SB;
      return client;
    }
    try {
      if (window.supabase && typeof window.supabase.createClient === "function") {
        client = window.supabase.createClient(cfg.URL, cfg.CLE, {
          auth: { persistSession: true, autoRefreshToken: false }
        });
      }
    } catch (e) {
      client = null;
    }
    return client;
  }

  function formaterNombre(n) {
    var v = Math.max(0, Math.round(Number(n) || 0));
    return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }

  function formaterPct(pct) {
    var v = Number(pct) || 0;
    if (v === 0) return "0 %";
    if (v < 10) return v.toFixed(1).replace(".", ",") + " %";
    return Math.round(v) + " %";
  }

  function formaterOctets(octets) {
    var b = Number(octets);
    if (!isFinite(b) || b <= 0) return "—";
    if (b < 1024) return Math.round(b) + " o";
    if (b < 1048576) return (b / 1024).toFixed(1).replace(".", ",") + " Ko";
    return (b / 1048576).toFixed(2).replace(".", ",") + " Mo";
  }

  function calculerStatut(lignes, seuil) {
    var plafond = Number(seuil) > 0 ? Number(seuil) : SEUIL_LIGNES;
    var n = Math.max(0, Math.round(Number(lignes) || 0));
    var pctExact = (n / plafond) * 100;
    var pctBarre = Math.min(100, Math.max(0, pctExact));
    var restant = plafond - n;

    if (n >= plafond) {
      return {
        code: "depasse",
        icone: "🔴",
        label: "Seuil 1 000 atteint",
        classe: "dbsb-niv-depasse",
        pctExact: pctExact,
        pctBarre: 100,
        restant: restant,
        resumeRestant: "+" + formaterNombre(Math.abs(restant)) + " au-dessus de " + formaterNombre(plafond)
      };
    }
    if (pctExact >= 80) {
      return {
        code: "vigilance",
        icone: "🟠",
        label: "Vigilance (≥ 80 %)",
        classe: "dbsb-niv-vigilance",
        pctExact: pctExact,
        pctBarre: pctBarre,
        restant: restant,
        resumeRestant: "Reste " + formaterNombre(restant) + " avant 1 000"
      };
    }
    if (pctExact >= 50) {
      return {
        code: "modere",
        icone: "🟡",
        label: "Modéré (50–79 %)",
        classe: "dbsb-niv-modere",
        pctExact: pctExact,
        pctBarre: pctBarre,
        restant: restant,
        resumeRestant: "Reste " + formaterNombre(restant) + " lignes"
      };
    }
    return {
      code: "confort",
      icone: "🟢",
      label: "Confort (< 50 %)",
      classe: "dbsb-niv-confort",
      pctExact: pctExact,
      pctBarre: pctBarre,
      restant: restant,
      resumeRestant: "Reste " + formaterNombre(restant) + " lignes"
    };
  }

  function normaliserPayload(brut, source) {
    var seuil = (brut && Number(brut.seuil_lignes) > 0) ? Number(brut.seuil_lignes) : SEUIL_LIGNES;
    var listeBrute = (brut && Array.isArray(brut.tables)) ? brut.tables : [];
    var vus = {};
    var tables = [];

    listeBrute.forEach(function (item) {
      if (!item || !item.nom) return;
      var nom = String(item.nom).trim();
      if (!nom || vus[nom]) return;
      vus[nom] = true;
      var meta = TABLES_META[nom] || { icone: "📦", libelle: "Table Supabase public", actionPurge: "" };
      var lignes = Math.max(0, Math.round(Number(item.lignes) || 0));
      var octets = item.octets != null ? Math.max(0, Math.round(Number(item.octets) || 0)) : null;
      var st = calculerStatut(lignes, seuil);
      tables.push({
        nom: nom,
        icone: meta.icone,
        libelle: meta.libelle,
        actionPurge: meta.actionPurge || "",
        lignes: lignes,
        octets: octets,
        seuil: seuil,
        statut: st
      });
    });

    ORDRE_TABLES_DEFAUT.forEach(function (nomDef) {
      if (vus[nomDef]) return;
      vus[nomDef] = true;
      var meta = TABLES_META[nomDef];
      var st = calculerStatut(0, seuil);
      tables.push({
        nom: nomDef,
        icone: meta.icone,
        libelle: meta.libelle,
        actionPurge: meta.actionPurge || "",
        lignes: 0,
        octets: null,
        seuil: seuil,
        statut: st
      });
    });

    return {
      seuil: seuil,
      mesureAt: (brut && brut.mesure_at) ? String(brut.mesure_at) : new Date().toISOString(),
      publicBytes: (brut && brut.public_bytes != null) ? Number(brut.public_bytes) : null,
      dbBytes: (brut && brut.db_bytes != null) ? Number(brut.db_bytes) : null,
      source: source || "rpc",
      tables: tables
    };
  }

  function sauvegarderCache(etatObj) {
    try {
      localStorage.setItem(CLE_CACHE, JSON.stringify({
        seuil_lignes: etatObj.seuil,
        mesure_at: etatObj.mesureAt,
        public_bytes: etatObj.publicBytes,
        db_bytes: etatObj.dbBytes,
        tables: etatObj.tables.map(function (t) {
          return { nom: t.nom, lignes: t.lignes, octets: t.octets };
        })
      }));
    } catch (e) {}
  }

  function lireCache() {
    try {
      var raw = localStorage.getItem(CLE_CACHE);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.tables)) return null;
      return normaliserPayload(parsed, "cache");
    } catch (e) {
      return null;
    }
  }

  function chargerParRepliRest(sb) {
    var promesses = ORDRE_TABLES_DEFAUT.map(function (nom) {
      if (nom === "labo_devices") {
        return sb.rpc("admin_labo_devices_list").then(function (r) {
          var n = (r && !r.error && Array.isArray(r.data)) ? r.data.length : 0;
          return { nom: nom, lignes: n, octets: null };
        }).catch(function () {
          return { nom: nom, lignes: 0, octets: null };
        });
      }
      return sb.from(nom).select("*", { count: "exact", head: true }).then(function (r) {
        var n = (r && !r.error && typeof r.count === "number") ? r.count : 0;
        return { nom: nom, lignes: n, octets: null };
      }).catch(function () {
        return { nom: nom, lignes: 0, octets: null };
      });
    });

    return Promise.all(promesses).then(function (liste) {
      return normaliserPayload({
        seuil_lignes: SEUIL_LIGNES,
        mesure_at: new Date().toISOString(),
        tables: liste
      }, "rest");
    });
  }

  function formaterHeureMesure(iso) {
    try {
      var d = new Date(iso);
      if (isNaN(d.getTime())) return "";
      return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch (e) {
      return "";
    }
  }

  function trierEtFiltrer(tables) {
    var tri = elTri ? elTri.value : "niveau";
    var filtre = elFiltre ? elFiltre.value : "all";

    var liste = tables.filter(function (t) {
      if (filtre === "actives") return t.lignes > 0;
      if (filtre === "alerte") return t.statut.pctExact >= 50 || t.lignes >= t.seuil;
      return true;
    });

    liste.sort(function (a, b) {
      if (tri === "alpha") return a.nom.localeCompare(b.nom);
      if (tri === "taille") {
        var oa = a.octets != null ? a.octets : -1;
        var ob = b.octets != null ? b.octets : -1;
        if (ob !== oa) return ob - oa;
        return b.lignes - a.lignes;
      }
      if (b.lignes !== a.lignes) return b.lignes - a.lignes;
      return a.nom.localeCompare(b.nom);
    });

    return liste;
  }

  function majBadgeOnglet(nbVigilanceOuPlus, nbDepasse) {
    if (!elBadgeTab) return;
    if (nbDepasse > 0) {
      elBadgeTab.style.display = "inline-flex";
      elBadgeTab.textContent = String(nbDepasse);
      elBadgeTab.className = "dbsb-tab-pill dbsb-tab-danger";
      elBadgeTab.title = nbDepasse + " table(s) ont atteint ou dépassé 1 000 lignes";
    } else if (nbVigilanceOuPlus > 0) {
      elBadgeTab.style.display = "inline-flex";
      elBadgeTab.textContent = String(nbVigilanceOuPlus);
      elBadgeTab.className = "dbsb-tab-pill dbsb-tab-warn";
      elBadgeTab.title = nbVigilanceOuPlus + " table(s) approchent du seuil de 1 000 lignes (≥ 80 %)";
    } else {
      elBadgeTab.style.display = "none";
      elBadgeTab.textContent = "0";
    }
  }

  function afficher(etatObj) {
    if (!etatObj || !Array.isArray(etatObj.tables)) return;
    dernierEtat = etatObj;

    var totalTables = etatObj.tables.length;
    var totalLignes = 0;
    var maxTable = null;
    var nbDepasse = 0;
    var nbVigilance = 0;
    var nbActives = 0;

    etatObj.tables.forEach(function (t) {
      totalLignes += t.lignes;
      if (t.lignes > 0) nbActives++;
      if (!maxTable || t.lignes > maxTable.lignes) maxTable = t;
      if (t.statut.code === "depasse") nbDepasse++;
      else if (t.statut.code === "vigilance") nbVigilance++;
    });

    if (elKpiTables) elKpiTables.textContent = totalTables + " tables";
    var elKpiTablesSub = doc.getElementById("dbsb-kpi-tables-sub");
    if (elKpiTablesSub) {
      elKpiTablesSub.textContent = nbActives + " active(s) · " + (totalTables - nbActives) + " vide(s) (0 ligne)";
    }

    if (elKpiMax && maxTable) {
      elKpiMax.textContent = maxTable.nom + " (" + formaterNombre(maxTable.lignes) + " / " + formaterNombre(etatObj.seuil) + ")";
    }
    if (elKpiMaxSub && maxTable) {
      elKpiMaxSub.textContent = "Niveau max : " + formaterPct(maxTable.statut.pctExact) + " · " + maxTable.statut.resumeRestant;
    }

    var nbAlertesTot = nbDepasse + nbVigilance;
    if (elKpiAlertes) {
      if (nbDepasse > 0) {
        elKpiAlertes.textContent = "🔴 " + nbDepasse + " ≥ 1 000";
      } else if (nbVigilance > 0) {
        elKpiAlertes.textContent = "🟠 " + nbVigilance + " ≥ 800";
      } else {
        elKpiAlertes.textContent = "🟢 0 alerte";
      }
    }
    if (elKpiAlertesSub) {
      if (nbAlertesTot === 0) {
        elKpiAlertesSub.textContent = "Toutes les tables sont largement sous 1 000 lignes";
      } else {
        elKpiAlertesSub.textContent = nbDepasse + " au-dessus de 1 000 · " + nbVigilance + " en vigilance (≥ 80 %)";
      }
    }

    if (elKpiTotal) {
      elKpiTotal.textContent = formaterNombre(totalLignes) + " lignes";
    }
    if (elKpiTotalSub) {
      var strTaille = etatObj.publicBytes != null
        ? "Tables public : " + formaterOctets(etatObj.publicBytes) + (etatObj.dbBytes != null ? " · Base totale : " + formaterOctets(etatObj.dbBytes) : "")
        : "Cumul sur l'ensemble des " + totalTables + " tables";
      elKpiTotalSub.textContent = strTaille;
    }

    majBadgeOnglet(nbAlertesTot, nbDepasse);

    var h = formaterHeureMesure(etatObj.mesureAt);
    if (elEtat) {
      if (etatObj.source === "cache") {
        elEtat.textContent = "📦 Dernière mesure mémorisée" + (h ? " (" + h + ")" : "") + " — hors ligne";
      } else if (etatObj.source === "rest") {
        elEtat.textContent = "🟢 Mesure directe PostgREST" + (h ? " à " + h : "");
      } else {
        elEtat.textContent = "🟢 Mesure SQL exacte en direct" + (h ? " à " + h : "");
      }
    }

    if (!elGrille) return;
    var liste = trierEtFiltrer(etatObj.tables);
    if (liste.length === 0) {
      elGrille.innerHTML = '<div class="dbsb-vide">🟢 Aucune table ne correspond à ce filtre actuellement.</div>';
      return;
    }

    var html = liste.map(function (t) {
      var st = t.statut;
      var tailleTxt = t.octets != null ? formaterOctets(t.octets) : "";
      var btnActionHtml = "";
      if (t.actionPurge && t.lignes >= 500) {
        btnActionHtml = '<button type="button" class="dbsb-btn-purge-rapide" data-dbsb-purge="' + ech(t.actionPurge) + '">🧹 Alléger</button>';
      }
      var barreLargeur = st.pctBarre > 0 && st.pctBarre < 1.6 ? 1.6 : Number(st.pctBarre.toFixed(2));
      return (
        '<article class="dbsb-carte-table ' + ech(st.classe) + '" data-table-nom="' + ech(t.nom) + '" data-table-lignes="' + t.lignes + '">' +
          '<div class="dbsb-carte-haut">' +
            '<div class="dbsb-table-id">' +
              '<span class="dbsb-table-ico" aria-hidden="true">' + ech(t.icone) + '</span>' +
              '<div class="dbsb-table-titres">' +
                '<div class="dbsb-table-nom-wrap">' +
                  '<code class="dbsb-table-code">' + ech(t.nom) + '</code>' +
                  (tailleTxt ? '<span class="dbsb-table-octets" title="Taille disque PostgreSQL (table + index)">' + ech(tailleTxt) + '</span>' : '') +
                '</div>' +
                '<span class="dbsb-table-desc">' + ech(t.libelle) + '</span>' +
              '</div>' +
            '</div>' +
            '<div class="dbsb-table-compteur">' +
              '<strong class="dbsb-ratio">' + formaterNombre(t.lignes) + ' <small>/ ' + formaterNombre(t.seuil) + '</small></strong>' +
              '<span class="dbsb-badge-statut ' + ech(st.classe) + '">' + ech(st.icone) + ' ' + formaterPct(st.pctExact) + ' · ' + ech(st.label) + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="dbsb-jauge-piste" role="progressbar" aria-valuemin="0" aria-valuemax="' + t.seuil + '" aria-valuenow="' + t.lignes + '" aria-label="Niveau de la table ' + ech(t.nom) + ' sur ' + t.seuil + ' lignes">' +
            '<div class="dbsb-jauge-remplissage" style="width:' + barreLargeur + '%"></div>' +
            '<span class="dbsb-jauge-repere dbsb-rep-50" title="500 lignes (50 %)"></span>' +
            '<span class="dbsb-jauge-repere dbsb-rep-80" title="800 lignes (80 % — seuil de vigilance)"></span>' +
          '</div>' +
          '<div class="dbsb-carte-bas">' +
            '<span class="dbsb-restant">' + ech(st.resumeRestant) + '</span>' +
            '<div class="dbsb-bas-droite">' +
              '<span class="dbsb-echelle-repere">0 · 500 · 800 · 1 000 lignes</span>' +
              btnActionHtml +
            '</div>' +
          '</div>' +
        '</article>'
      );
    }).join("");

    elGrille.innerHTML = html;
  }

  function charger() {
    if (enChargement) return Promise.resolve(dernierEtat);
    var sb = obtenirClient();
    if (!sb || (typeof navigator !== "undefined" && navigator.onLine === false)) {
      var cacheOff = lireCache();
      if (cacheOff) {
        afficher(cacheOff);
        return Promise.resolve(cacheOff);
      }
      if (elEtat) elEtat.textContent = "🔴 Hors ligne — reconnectez-vous pour mesurer les tables Supabase.";
      return Promise.resolve(null);
    }

    enChargement = true;
    if (btnActualiser) btnActualiser.disabled = true;
    if (elEtat) elEtat.textContent = "⏳ Mesure exacte des 15 tables Supabase en cours…";

    return sb.rpc("admin_dbsupbase_niveaux").then(function (res) {
      if (res && !res.error && res.data && Array.isArray(res.data.tables)) {
        return normaliserPayload(res.data, "rpc");
      }
      return chargerParRepliRest(sb);
    }).catch(function () {
      return chargerParRepliRest(sb);
    }).then(function (etatNeuf) {
      enChargement = false;
      dejaChargeUneFois = true;
      if (btnActualiser) btnActualiser.disabled = false;
      if (etatNeuf) {
        sauvegarderCache(etatNeuf);
        afficher(etatNeuf);
      }
      return etatNeuf;
    }).catch(function () {
      enChargement = false;
      if (btnActualiser) btnActualiser.disabled = false;
      var secours = lireCache();
      if (secours) afficher(secours);
      else if (elEtat) elEtat.textContent = "⚠️ Impossible de lire les niveaux Supabase pour le moment.";
      return secours;
    });
  }

  function genererCsv(etatObj) {
    var src = etatObj || dernierEtat;
    if (!src || !Array.isArray(src.tables)) return "";
    var lignesCsv = [
      "Table;Description;Lignes actuelles;Seuil PostgREST;Niveau (%);Ecart avant 1000;Taille disque;Statut"
    ];
    trierEtFiltrer(src.tables).forEach(function (t) {
      lignesCsv.push([
        t.nom,
        '"' + String(t.libelle || "").replace(/"/g, '""') + '"',
        t.lignes,
        t.seuil,
        t.statut.pctExact.toFixed(1).replace(".", ","),
        t.statut.restant,
        t.octets != null ? formaterOctets(t.octets) : "",
        '"' + t.statut.label + '"'
      ].join(";"));
    });
    return "\uFEFF" + lignesCsv.join("\r\n");
  }

  function exporterCsv() {
    if (!dernierEtat) return;
    var contenu = genererCsv(dernierEtat);
    if (!contenu) return;
    try {
      var blob = new Blob([contenu], { type: "text/csv;charset=utf-8;" });
      var url = URL.createObjectURL(blob);
      var a = doc.createElement("a");
      var d = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = "DBSupbase-niveaux-1000-" + d + ".csv";
      doc.body.appendChild(a);
      a.click();
      setTimeout(function () {
        if (a.parentNode) a.parentNode.removeChild(a);
        URL.revokeObjectURL(url);
      }, 250);
    } catch (e) {}
  }

  function ouvrirActionPurge(cible) {
    if (cible === "purge-acces") {
      var bAcc = doc.getElementById("btn-ouvrir-purge-acces");
      if (bAcc) { bAcc.click(); return; }
    }
    if (cible === "purge-quiz") {
      var mQuiz = doc.getElementById("modal-purge-quiz");
      if (mQuiz) { mQuiz.classList.add("visible"); return; }
    }
    var mQuota = doc.getElementById("modal-quota-supabase");
    if (mQuota) mQuota.classList.add("visible");
  }

  if (btnActualiser) {
    btnActualiser.addEventListener("click", function () {
      charger();
    });
  }
  if (elTri) {
    elTri.addEventListener("change", function () {
      if (dernierEtat) afficher(dernierEtat);
    });
  }
  if (elFiltre) {
    elFiltre.addEventListener("change", function () {
      if (dernierEtat) afficher(dernierEtat);
    });
  }
  if (btnCsv) {
    btnCsv.addEventListener("click", exporterCsv);
  }
  if (btnPurge) {
    btnPurge.addEventListener("click", function () {
      ouvrirActionPurge("quota-modal");
    });
  }
  if (elGrille) {
    elGrille.addEventListener("click", function (ev) {
      var btn = ev.target && ev.target.closest ? ev.target.closest("[data-dbsb-purge]") : null;
      if (!btn) return;
      ouvrirActionPurge(btn.getAttribute("data-dbsb-purge") || "quota-modal");
    });
  }

  /* Lien rapide depuis la modale Quota Supabase vers DBSupbase */
  var btnAllerDepuisQuota = doc.getElementById("btn-ouvrir-dbsupbase-depuis-quota");
  if (btnAllerDepuisQuota) {
    btnAllerDepuisQuota.addEventListener("click", function () {
      var mQuota = doc.getElementById("modal-quota-supabase");
      if (mQuota) mQuota.classList.remove("visible");
      var btnTab = doc.getElementById("btn-tab-dbsupbase");
      if (btnTab) btnTab.click();
      section.classList.remove("sec-repliee");
      section.style.display = "";
      section.scrollIntoView({ behavior: "smooth", block: "start" });
      charger();
    });
  }

  /* Chargement immédiat du cache s'il existe, puis mesure fraîche à l'ouverture de DBSupbase
     (et une vérification silencieuse en arrière-plan après le démarrage admin pour le badge d'alerte). */
  var cacheInitial = lireCache();
  if (cacheInitial) {
    afficher(cacheInitial);
  }

  window.addEventListener("sti:section-admin-ouverte", function (ev) {
    var secId = ev && ev.detail ? ev.detail.secId : "";
    if (secId === "bloc-sec-dbsupbase" || secId === "open-all") {
      charger();
    }
  });

  var btnReplier = section.querySelector('.btn-replier-sec[data-replier="bloc-sec-dbsupbase"]');
  if (btnReplier) {
    btnReplier.addEventListener("click", function () {
      setTimeout(function () {
        if (!section.classList.contains("sec-repliee")) charger();
      }, 20);
    });
  }

  /* Vérification légère après ouverture du tableau de bord pour alimenter les jauges & le badge d'alerte */
  setTimeout(function () {
    if (!dejaChargeUneFois && typeof navigator !== "undefined" && navigator.onLine !== false) {
      var aSessionAdmin = false;
      try {
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i) || "";
          if (k.indexOf("sb-") === 0 && k.indexOf("-auth-token") !== -1) {
            var v = (localStorage.getItem(k) || "").toLowerCase();
            if (v.indexOf("aymenessouyah@gmail.com") !== -1) {
              aSessionAdmin = true;
              break;
            }
          }
        }
      } catch (e) {}
      if (aSessionAdmin) charger();
    }
  }, 1800);

  window.STI_DBSUPBASE = {
    SEUIL_LIGNES: SEUIL_LIGNES,
    TABLES_META: TABLES_META,
    ORDRE_TABLES_DEFAUT: ORDRE_TABLES_DEFAUT,
    charger: charger,
    afficher: afficher,
    normaliserPayload: normaliserPayload,
    calculerStatut: calculerStatut,
    formaterOctets: formaterOctets,
    genererCsv: genererCsv,
    getDernierEtat: function () { return dernierEtat; }
  };
})();
