/* ═══ STI SAUVEGARDE (v467) — Export paginé complet 15 tables (.json & .json.gz) + Sync Google Drive ═══
   Exporte l'intégralité des 15 tables public Supabase (profiles, acces, sti_progressions,
   sti_quiz_parties, sti_quiz_reponses, sti_quiz_sessions, sti_quiz_vus, sti_diagnostics,
   sti_observations, labo_devices, labo_device_sessions, labo_device_messages, badges_labo,
   app_config_public, push_subscriptions) avec tri déterministe multi-colonnes par tranches de 1 000 lignes
   + préférences locales sti-* + synchronisation quotidienne Google Drive (STISauvegardeSupbase). */
(function () {
  "use strict";
  var cfg = window.STI_AUTH || {
    URL: "https://vywujxmepvcbgedgmger.supabase.co",
    CLE: "sb_publishable_FI5FimytONd5VdWK6GfXLA_I6vPTrvn"
  };
  var NON_RESTAURABLES = {
    "sti-cred": 1,
    "sti-session-cache": 1,
    "sti-admin-gold": 1,
    "sti-gold": 1,
    "sti-offline": 1,
    "sti-drive-webapp-url": 1
  };
  var CLE_WEBAPP_DRIVE = "sti-drive-webapp-url";
  var CLE_DERNIERE_SYNC_DRIVE = "sti-drive-last-sync-v467";
  var DELAI_AUTO_DRIVE_MS = 24 * 3600 * 1000;

  var TABLES_CLOUD = [
    { nom: "profiles",             ordre: "id" },
    { nom: "acces",                ordre: "id" },
    { nom: "sti_progressions",     ordre: "user_id" },
    { nom: "sti_quiz_parties",     ordre: "id" },
    { nom: "sti_quiz_reponses",    ordre: "id" },
    { nom: "sti_quiz_sessions",    ordre: "user_id,quiz,mode" },
    { nom: "sti_quiz_vus",         ordre: "user_id,module,question_id" },
    { nom: "sti_diagnostics",      ordre: "id" },
    { nom: "sti_observations",     ordre: "id" },
    { nom: "labo_devices",         ordre: "id",         viaRpcAnnexe: true },
    { nom: "labo_device_sessions", ordre: "session_id", viaRpcAnnexe: true },
    { nom: "labo_device_messages", ordre: "id" },
    { nom: "badges_labo",          ordre: "code_hash",  viaRpcAnnexe: true },
    { nom: "app_config_public",    ordre: "id" },
    { nom: "push_subscriptions",   ordre: "id",         viaRpcAnnexe: true }
  ];

  function ech(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function ordrePostgrest(ordre) {
    return String(ordre || "id")
      .split(",")
      .map(function (col) { return col.trim() + ".asc"; })
      .join(",");
  }

  function estUrlWebAppDriveValide(u) {
    return /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec(?:\?.*)?$/.test(String(u || "").trim());
  }

  function lireUrlWebAppDrive() {
    try {
      var u = String(localStorage.getItem(CLE_WEBAPP_DRIVE) || "").trim();
      return estUrlWebAppDriveValide(u) ? u : "";
    } catch (e) {
      return "";
    }
  }

  function sessionAdminComplete() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i) || "";
        if (k.indexOf("sb-") === 0 && k.indexOf("-auth-token") !== -1) {
          var v = JSON.parse(localStorage.getItem(k) || "null");
          var tok = (v && v.access_token) || (v && v.currentSession && v.currentSession.access_token) || (v && v.session && v.session.access_token) || null;
          var usr = (v && v.user) || (v && v.currentSession && v.currentSession.user) || (v && v.session && v.session.user) || null;
          if (tok) return { token: tok, uid: usr && usr.id ? String(usr.id) : null, email: usr && usr.email ? String(usr.email) : null };
        }
      }
    } catch (e) {}
    return null;
  }

  function tokenAdmin() {
    var s = sessionAdminComplete();
    return s ? s.token : null;
  }

  function locales() {
    var d = {};
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i) || "";
        if (k.indexOf("sti-") === 0 && !NON_RESTAURABLES[k]) {
          try { d[k] = localStorage.getItem(k); } catch (e) {}
        }
      }
    } catch (e2) {}
    return d;
  }

  function telechargerBlob(nom, blob) {
    var a = document.createElement("a");
    var urlObj = URL.createObjectURL(blob);
    a.href = urlObj;
    a.download = nom;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { try { URL.revokeObjectURL(urlObj); } catch (e) {} }, 4000);
  }

  function compresserGzip(texteJson) {
    if (typeof CompressionStream === "function" && typeof Response === "function") {
      try {
        var flux = new Blob([texteJson], { type: "application/json" })
          .stream()
          .pipeThrough(new CompressionStream("gzip"));
        return new Response(flux).blob();
      } catch (e) {}
    }
    return Promise.resolve(null);
  }

  function lireTablePaginee(tableObj, token, maxLignes) {
    var nomTable = typeof tableObj === "string" ? tableObj : tableObj.nom;
    var clauseOrdre = ordrePostgrest(typeof tableObj === "object" && tableObj ? tableObj.ordre : "id");
    var tout = [], pas = 1000, max = maxLignes || 50000;
    function pageSuiv(de) {
      return fetch(cfg.URL + "/rest/v1/" + nomTable + "?select=*&order=" + clauseOrdre, {
        headers: {
          "apikey": cfg.CLE,
          "Authorization": "Bearer " + token,
          "Range-Unit": "items",
          "Range": de + "-" + (de + pas - 1)
        }
      }).then(function (r) {
        if (!r.ok && r.status !== 206) return Promise.reject(nomTable + " HTTP " + r.status);
        return r.json();
      }).then(function (lignes) {
        var lot = Array.isArray(lignes) ? lignes : [];
        tout = tout.concat(lot);
        if (lot.length < pas || tout.length >= max) return tout;
        return pageSuiv(de + pas);
      });
    }
    return pageSuiv(0);
  }

  function chargerTablesAnnexesRpc(token) {
    return fetch(cfg.URL + "/rest/v1/rpc/admin_sauvegarde_tables_annexes", {
      method: "POST",
      headers: {
        "apikey": cfg.CLE,
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json"
      },
      body: "{}"
    }).then(function (r) {
      if (!r || !r.ok) return null;
      return r.json();
    }).then(function (d) {
      return d && typeof d === "object" ? d : null;
    }).catch(function () {
      return null;
    });
  }

  function chargerLaboDevicesRepli(token) {
    return fetch(cfg.URL + "/rest/v1/rpc/admin_labo_devices_list", {
      method: "POST",
      headers: {
        "apikey": cfg.CLE,
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json"
      },
      body: "{}"
    }).then(function (rRpc) {
      return rRpc && rRpc.ok ? rRpc.json() : [];
    }).then(function (dRpc) {
      return Array.isArray(dRpc) ? dRpc : (dRpc && Array.isArray(dRpc.devices) ? dRpc.devices : []);
    }).catch(function () {
      return null;
    });
  }

  function collecterToutCloud(token) {
    var iso = new Date().toISOString();
    var sortie = {
      exporte_le: iso,
      genere_le: iso,
      automatique: false,
      version: "v467",
      plateforme: "STI By AE V2.0",
      nb_tables: TABLES_CLOUD.length,
      total_lignes: 0,
      tables: {},
      cloud: {},
      erreurs: {},
      local: locales()
    };

    return chargerTablesAnnexesRpc(token).then(function (annexes) {
      var chaines = TABLES_CLOUD.map(function (t) {
        if (t.viaRpcAnnexe && annexes && Array.isArray(annexes[t.nom])) {
          sortie.tables[t.nom] = annexes[t.nom];
          sortie.cloud[t.nom] = annexes[t.nom];
          return Promise.resolve();
        }
        return lireTablePaginee(t, token, 50000)
          .then(function (lignes) {
            if (t.nom === "labo_devices" && (!lignes || !lignes.length)) {
              return chargerLaboDevicesRepli(token).then(function (arrRpc) {
                var retenu = arrRpc && arrRpc.length ? arrRpc : lignes;
                sortie.tables[t.nom] = retenu;
                sortie.cloud[t.nom] = retenu;
              });
            }
            sortie.tables[t.nom] = lignes;
            sortie.cloud[t.nom] = lignes;
          })
          .catch(function (e) {
            if (t.nom === "labo_devices") {
              return chargerLaboDevicesRepli(token).then(function (arrRpc) {
                if (arrRpc) {
                  sortie.tables[t.nom] = arrRpc;
                  sortie.cloud[t.nom] = arrRpc;
                } else {
                  sortie.erreurs[t.nom] = String(e);
                  sortie.tables[t.nom] = null;
                  sortie.cloud[t.nom] = null;
                }
              });
            }
            sortie.erreurs[t.nom] = String(e);
            sortie.tables[t.nom] = null;
            sortie.cloud[t.nom] = null;
          });
      });

      return Promise.all(chaines).then(function () {
        var total = 0;
        TABLES_CLOUD.forEach(function (t) {
          if (Array.isArray(sortie.cloud[t.nom])) total += sortie.cloud[t.nom].length;
        });
        sortie.total_lignes = total;
        return sortie;
      });
    });
  }

  function exporter(zone, enGzip) {
    var token = tokenAdmin();
    if (!token) {
      if (zone) zone.innerHTML = "<p>⚠️ Connectez-vous en administrateur d'abord.</p>";
      return Promise.resolve(null);
    }
    if (zone) zone.innerHTML = "<p>⏳ Collecte paginée des <b>15 tables Supabase</b> en cours…</p>";
    return collecterToutCloud(token).then(function (sortie) {
      var dateJour = new Date().toISOString().slice(0, 10);
      var baseNom = "sti-sauvegarde-" + dateJour + ".json";
      var texteJson = enGzip ? JSON.stringify(sortie) : JSON.stringify(sortie, null, 2);

      var actionDl = enGzip
        ? compresserGzip(texteJson).then(function (gzBlob) {
            if (gzBlob) {
              telechargerBlob(baseNom + ".gz", gzBlob);
              return baseNom + ".gz";
            }
            telechargerBlob(baseNom, new Blob([JSON.stringify(sortie, null, 2)], { type: "application/json" }));
            return baseNom;
          })
        : Promise.resolve().then(function () {
            telechargerBlob(baseNom, new Blob([texteJson], { type: "application/json" }));
            return baseNom;
          });

      return actionDl.then(function (nomFinal) {
        var ok = TABLES_CLOUD
          .filter(function (t) { return Array.isArray(sortie.cloud[t.nom]); })
          .map(function (t) { return ech(t.nom) + " (" + sortie.cloud[t.nom].length + ")"; });
        var ko = Object.keys(sortie.erreurs).map(ech);
        if (zone) {
          zone.innerHTML = "<p>✅ <b>" + ech(nomFinal) + "</b> téléchargé (" + ok.length + "/" + TABLES_CLOUD.length + " tables · <b>" + sortie.total_lignes + "</b> lignes cloud · " + Object.keys(sortie.local).length + " clés locales).<br>"
            + "<span style='font-size:12px;opacity:.9'>Tables : " + (ok.join(" · ") || "aucune") + "</span>"
            + (ko.length ? "<br>⚠️ Non exportées : " + ko.join(", ") : "")
            + "</p>";
        }
        return sortie;
      });
    });
  }

  function lireTexteFichierSauvegarde(fichier) {
    if (fichier && (/\.gz$/i.test(fichier.name || "") || fichier.type === "application/gzip" || fichier.type === "application/x-gzip") && typeof DecompressionStream === "function" && typeof Response === "function") {
      try {
        var flux = fichier.stream().pipeThrough(new DecompressionStream("gzip"));
        return new Response(flux).text();
      } catch (e) {}
    }
    return new Promise(function (resolve, reject) {
      var lecteur = new FileReader();
      lecteur.onload = function () { resolve(String(lecteur.result || "")); };
      lecteur.onerror = function () { reject(new Error("Lecture impossible")); };
      lecteur.readAsText(fichier);
    });
  }

  function importer(fichier, zone) {
    lireTexteFichierSauvegarde(fichier).then(function (brut) {
      try {
        var data = JSON.parse(brut);
        var loc = data.local || {};
        var n = 0;
        Object.keys(loc).forEach(function (k) {
          if (k.indexOf("sti-") === 0 && !NON_RESTAURABLES[k]) {
            localStorage.setItem(k, loc[k]);
            n++;
          }
        });
        var nbTablesArchive = data.tables ? Object.keys(data.tables).length : (data.cloud ? Object.keys(data.cloud).length : 0);
        if (zone) {
          zone.innerHTML = "<p>✅ Archive vérifiée (" + nbTablesArchive + " table(s) cloud présente(s)) · " + n + " clé(s) locale(s) restaurée(s)."
            + (n > 0 ? " Rechargement…" : "") + "</p>";
        }
        if (n > 0) setTimeout(function () { location.reload(); }, 900);
      } catch (e) {
        if (zone) zone.innerHTML = "<p>⚠️ Fichier illisible : " + ech(e && e.message) + "</p>";
      }
    }).catch(function (err) {
      if (zone) zone.innerHTML = "<p>⚠️ Lecture impossible : " + ech(err && err.message) + "</p>";
    });
  }

  function memoriserResultatDrive(res) {
    if (!res || !res.ok) return;
    var resume = {
      ts: Date.now(),
      fichier: res.fichier || "",
      taille_octets: res.taille_octets || 0,
      nb_tables: res.nb_tables || 15,
      total_lignes: res.total_lignes || 0,
      cree_le: res.cree_le || new Date().toISOString()
    };
    try {
      localStorage.setItem(CLE_DERNIERE_SYNC_DRIVE, JSON.stringify(resume));
    } catch (eS) {}
  }

  function synchroniserConfigDriveAdmin() {
    if (lireUrlWebAppDrive()) return Promise.resolve(lireUrlWebAppDrive());
    try {
      if (typeof sessionStorage !== "undefined" && sessionStorage.getItem("sti-drive-cfg-checked-v1") === "1") {
        return Promise.resolve("");
      }
    } catch (eSC) {}
    var sess = sessionAdminComplete();
    if (!sess || !sess.token || !sess.uid || String(sess.email || "").toLowerCase() !== "aymenessouyah@gmail.com") {
      return Promise.resolve("");
    }
    return fetch(cfg.URL + "/rest/v1/sti_progressions?select=donnees&user_id=eq." + encodeURIComponent(sess.uid) + "&limit=1", {
      method: "GET",
      headers: { "apikey": cfg.CLE, "Authorization": "Bearer " + sess.token, "Accept": "application/json" }
    }).then(function (r) { return r && r.ok ? r.json() : []; }).then(function (rows) {
      try { if (typeof sessionStorage !== "undefined") sessionStorage.setItem("sti-drive-cfg-checked-v1", "1"); } catch (eSC2) {}
      var d = rows && rows[0] && rows[0].donnees;
      var urlCloud = d && d[CLE_WEBAPP_DRIVE] ? String(d[CLE_WEBAPP_DRIVE]).trim() : "";
      if (estUrlWebAppDriveValide(urlCloud)) {
        try { localStorage.setItem(CLE_WEBAPP_DRIVE, urlCloud); } catch (eL) {}
        if (d[CLE_DERNIERE_SYNC_DRIVE] && !localStorage.getItem(CLE_DERNIERE_SYNC_DRIVE)) {
          try { localStorage.setItem(CLE_DERNIERE_SYNC_DRIVE, String(d[CLE_DERNIERE_SYNC_DRIVE])); } catch (eM) {}
        }
        return urlCloud;
      }
      return "";
    }).catch(function () { return ""; });
  }

  function pousserConfigDriveAdmin(urlDrive) {
    var sess = sessionAdminComplete();
    if (!sess || !sess.token || !sess.uid || String(sess.email || "").toLowerCase() !== "aymenessouyah@gmail.com") return;
    fetch(cfg.URL + "/rest/v1/sti_progressions?select=donnees&user_id=eq." + encodeURIComponent(sess.uid) + "&limit=1", {
      method: "GET",
      headers: { "apikey": cfg.CLE, "Authorization": "Bearer " + sess.token, "Accept": "application/json" }
    }).then(function (r) { return r && r.ok ? r.json() : []; }).then(function (rows) {
      var donnees = (rows && rows[0] && rows[0].donnees && typeof rows[0].donnees === "object") ? rows[0].donnees : {};
      if (urlDrive && estUrlWebAppDriveValide(urlDrive)) donnees[CLE_WEBAPP_DRIVE] = String(urlDrive).trim();
      else delete donnees[CLE_WEBAPP_DRIVE];
      var memSync = localStorage.getItem(CLE_DERNIERE_SYNC_DRIVE);
      if (memSync) donnees[CLE_DERNIERE_SYNC_DRIVE] = memSync;
      return fetch(cfg.URL + "/rest/v1/sti_progressions", {
        method: "POST",
        headers: {
          "apikey": cfg.CLE,
          "Authorization": "Bearer " + sess.token,
          "Content-Type": "application/json",
          "Prefer": "resolution=merge-duplicates,return=minimal"
        },
        body: JSON.stringify({ user_id: sess.uid, email: sess.email, donnees: donnees, maj: new Date().toISOString() })
      });
    }).catch(function () {});
  }

  function televerserArchiveVersDrive(urlOverride) {
    var url = estUrlWebAppDriveValide(urlOverride) ? String(urlOverride).trim() : lireUrlWebAppDrive();
    if (!url) return Promise.reject(new Error("URL Web App Apps Script non configurée."));
    var token = tokenAdmin();
    if (!token) return Promise.reject(new Error("Session administrateur requise."));
    return collecterToutCloud(token).then(function (sortie) {
      return fetch(url, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "televerser",
          access_token: token,
          archive_json: JSON.stringify(sortie)
        })
      });
    }).then(function (r) {
      if (!r || !r.ok) return Promise.reject(new Error("HTTP " + (r ? r.status : 0)));
      return r.json();
    }).then(function (res) {
      memoriserResultatDrive(res);
      return res;
    });
  }

  function appelerWebAppDrive(action, urlOverride) {
    var url = estUrlWebAppDriveValide(urlOverride) ? String(urlOverride).trim() : lireUrlWebAppDrive();
    if (!url) return Promise.reject(new Error("URL Web App Apps Script non configurée."));
    var token = tokenAdmin();
    if (!token) return Promise.reject(new Error("Session administrateur requise."));
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: action || "sauvegarder", access_token: token })
    }).then(function (r) {
      if (!r || !r.ok) return Promise.reject(new Error("HTTP " + (r ? r.status : 0)));
      return r.json();
    }).then(function (res) {
      if ((!res || !res.ok) && (action || "sauvegarder") === "sauvegarder" && res && /SUPABASE_SERVICE_KEY|HTTP 401/i.test(String(res.erreur || ""))) {
        return televerserArchiveVersDrive(url);
      }
      if (action !== "statut") memoriserResultatDrive(res);
      return res;
    });
  }

  function rendreResumeDrive() {
    try {
      var mem = JSON.parse(localStorage.getItem(CLE_DERNIERE_SYNC_DRIVE) || "null");
      if (!mem || !mem.fichier) return "Aucune synchronisation Web App enregistrée sur ce navigateur (le déclencheur quotidien Apps Script tourne à 02 h).";
      var ko = Math.max(1, Math.round((mem.taille_octets || 0) / 1024));
      return "Dernière archive Drive : <b>" + ech(mem.fichier) + "</b> (" + ko + " Ko · " + (mem.nb_tables || 15) + " tables · " + (mem.total_lignes || 0) + " lignes).";
    } catch (e) {
      return "";
    }
  }

  function copierScriptAppsScript(zone) {
    fetch("./documents/sql/sauvegarde-auto-drive.gs", { cache: "no-store" })
      .then(function (r) { return r && r.ok ? r.text() : Promise.reject(new Error("HTTP " + (r ? r.status : 0))); })
      .then(function (codeGs) {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
          return navigator.clipboard.writeText(codeGs).then(function () { return true; });
        }
        var ta = document.createElement("textarea");
        ta.value = codeGs;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        return true;
      })
      .then(function () {
        if (zone) {
          zone.innerHTML = "<p>✅ <b>Script v467 copié dans le presse-papiers !</b><br>"
            + "1️⃣ Ouvrez votre projet Google Apps Script <code>STISauvegardeSupbase</code> et remplacez le contenu de <code>Code.gs</code>.<br>"
            + "2️⃣ Exécutez une seule fois la fonction <b><code>installer</code></b> pour activer la sauvegarde quotidienne automatique à 02 h sur les <b>15 tables</b>.</p>";
        }
      })
      .catch(function (e) {
        if (zone) zone.innerHTML = "<p>⚠️ Impossible de copier automatiquement (" + ech(e && e.message) + ") — ouvrez <code>documents/sql/sauvegarde-auto-drive.gs</code>.</p>";
      });
  }

  var enSyncAutoDrive = false;
  function verifierSyncAutoDrive() {
    if (enSyncAutoDrive) return Promise.resolve({ ignore: true, raison: "en_cours" });
    return synchroniserConfigDriveAdmin().then(function () {
      var url = lireUrlWebAppDrive();
      if (!url) return { ignore: true, raison: "pas_d_url" };
      var token = tokenAdmin();
      if (!token) return { ignore: true, raison: "pas_de_token" };
      try {
        var mem = JSON.parse(localStorage.getItem(CLE_DERNIERE_SYNC_DRIVE) || "null");
        if (mem && mem.ts && (Date.now() - mem.ts) < DELAI_AUTO_DRIVE_MS) {
          return { ignore: true, raison: "deja_a_jour", derniere: mem };
        }
      } catch (e) {}
      enSyncAutoDrive = true;
      return appelerWebAppDrive("sauvegarder", url)
        .then(function (res) {
          if (res && res.ok) pousserConfigDriveAdmin(url);
          return res;
        })
        .catch(function (err) {
          return { ok: false, erreur: String((err && err.message) || err) };
        })
        .then(function (finalRes) {
          enSyncAutoDrive = false;
          return finalRes;
        });
    });
  }

  function panneau() {
    var exist = document.getElementById("sti-sauvegarde");
    if (exist) { exist.remove(); return; }
    var ov = document.createElement("div");
    ov.id = "sti-sauvegarde";
    ov.setAttribute("role", "dialog");
    ov.setAttribute("aria-modal", "true");
    ov.setAttribute("style", 'position:fixed;inset:auto 4% 4% 4%;max-height:86vh;overflow-y:auto;z-index:100000;background:var(--adm-surface,#fffdf7);border:3px solid var(--adm-border-strong,#1a1a2e);border-radius:18px;box-shadow:8px 8px 0 rgba(15,23,42,.35);padding:20px 24px;font-family:"Comic Sans MS","Comic Sans","Comic Neue","Chalkboard SE",cursive,sans-serif;color:var(--adm-text,#1a1a2e);');
    var urlActuelle = lireUrlWebAppDrive();
    ov.innerHTML = '<button type="button" id="sti-sauv-fermer" style="float:right;padding:7px 13px;border-radius:10px;border:2px solid var(--adm-border-strong,#1a1a2e);background:var(--adm-surface-2,#fff);color:var(--adm-text,#1a1a2e);font-weight:800;cursor:pointer">✕ Fermer</button>'
      + '<h2 style="margin:0 0 8px;font-size:19px">💾 Sauvegarde complète (15 tables Supabase + Google Drive)</h2>'
      + '<p style="margin:0 0 10px;font-size:13.2px;line-height:1.45">Exporte l\'intégralité des <b>15 tables <code>public</code></b> (profils, connexions, progressions, parties/réponses/sessions/vus quiz, diagnostics, observations, postes/sessions/messages Labo 3, badges labo, configuration publique, notifications) avec pagination par tranches de 1 000 lignes + préférences locales.</p>'
      + '<div style="display:flex;flex-wrap:wrap;gap:9px;margin-bottom:12px">'
      + '  <button type="button" id="sti-sauv-export-gz" style="padding:10px 16px;border-radius:10px;border:2.5px solid var(--adm-border-strong,#1a1a2e);background:linear-gradient(120deg,#15803d,#0f766e);color:#fff;font-weight:800;cursor:pointer">⬇️ Exporter .json.gz (format Drive)</button>'
      + '  <button type="button" id="sti-sauv-export" style="padding:10px 16px;border-radius:10px;border:2.5px solid var(--adm-border-strong,#1a1a2e);background:#0f766e;color:#fff;font-weight:800;cursor:pointer">⬇️ Exporter .json complet</button>'
      + '  <button type="button" id="sti-sauv-copier-gs" style="padding:10px 14px;border-radius:10px;border:2px solid var(--adm-border-strong,#1a1a2e);background:#fef3c7;color:#1a1a2e;font-weight:800;cursor:pointer">📋 Copier le script Apps Script v467</button>'
      + '</div>'
      + '<div style="background:var(--adm-surface-2,#f5efe2);border:2px solid var(--adm-border-strong,#1a1a2e);border-radius:13px;padding:11px 13px;margin-bottom:11px;font-size:12.6px;color:var(--adm-text,#1a1a2e)">'
      + '  <div style="font-weight:900;margin-bottom:5px">☁️ Synchronisation automatique Google Drive (<code>STISauvegardeSupbase</code> — 1× / 24 h + 02 h du matin)</div>'
      + '  <div id="sti-sauv-drive-resume" style="margin-bottom:7px;color:var(--adm-muted,#334155)">' + rendreResumeDrive() + '</div>'
      + '  <div style="display:flex;flex-wrap:wrap;gap:7px;align-items:center">'
      + '    <input type="url" id="sti-sauv-drive-url" placeholder="https://script.google.com/macros/s/.../exec (optionnel : URL Web App)" value="' + ech(urlActuelle) + '" style="flex:1 1 280px;padding:7px 10px;border-radius:9px;border:1.8px solid var(--adm-border-strong,#1a1a2e);background:var(--adm-surface,#fff);color:var(--adm-text,#1a1a2e);font-size:12.2px" />'
      + '    <button type="button" id="sti-sauv-drive-save" style="padding:7px 12px;border-radius:9px;border:2px solid var(--adm-border-strong,#1a1a2e);background:var(--adm-surface,#fff);color:var(--adm-text,#1a1a2e);font-weight:800;cursor:pointer">💾 Enregistrer URL</button>'
      + '    <button type="button" id="sti-sauv-drive-now" style="padding:7px 12px;border-radius:9px;border:2px solid var(--adm-border-strong,#1a1a2e);background:#15803d;color:#fff;font-weight:800;cursor:pointer">☁️ Sauvegarder vers Drive</button>'
      + '    <button type="button" id="sti-sauv-drive-statut" style="padding:7px 12px;border-radius:9px;border:2px solid var(--adm-border-strong,#1a1a2e);background:var(--adm-surface,#fff);color:var(--adm-text,#1a1a2e);font-weight:800;cursor:pointer">🔄 État Drive</button>'
      + '  </div>'
      + '</div>'
      + '<p style="margin:0 0 8px;font-size:12.8px">Restaurer les préférences locales depuis une archive (<code>.json</code> ou <code>.json.gz</code>) : <input type="file" id="sti-sauv-fichier" accept=".json,.gz,application/json,application/gzip"></p>'
      + '<div id="sti-sauv-zone" style="font-size:13px"></div>';
    document.body.appendChild(ov);

    var zone = document.getElementById("sti-sauv-zone");
    var resumeEl = document.getElementById("sti-sauv-drive-resume");
    var inpUrl = document.getElementById("sti-sauv-drive-url");

    function fermer() {
      if (ov.parentNode) ov.remove();
      document.removeEventListener("keydown", onEsc);
    }
    function onEsc(ev) {
      if (ev.key === "Escape") fermer();
    }
    document.addEventListener("keydown", onEsc);
    document.getElementById("sti-sauv-fermer").addEventListener("click", fermer);
    document.getElementById("sti-sauv-export-gz").addEventListener("click", function () { exporter(zone, true); });
    document.getElementById("sti-sauv-export").addEventListener("click", function () { exporter(zone, false); });
    document.getElementById("sti-sauv-copier-gs").addEventListener("click", function () { copierScriptAppsScript(zone); });
    document.getElementById("sti-sauv-fichier").addEventListener("change", function () {
      if (this.files && this.files[0]) importer(this.files[0], zone);
    });

    document.getElementById("sti-sauv-drive-save").addEventListener("click", function () {
      var val = String((inpUrl && inpUrl.value) || "").trim();
      if (!val) {
        localStorage.removeItem(CLE_WEBAPP_DRIVE);
        pousserConfigDriveAdmin("");
        zone.innerHTML = "<p>ℹ️ URL Web App Drive effacée (le déclencheur horaire Apps Script reste actif côté Google).</p>";
        return;
      }
      if (!estUrlWebAppDriveValide(val)) {
        zone.innerHTML = "<p>⚠️ URL invalide : utilisez l'adresse officielle <code>https://script.google.com/macros/s/.../exec</code> issue de <i>Déployer → Application Web</i>.</p>";
        return;
      }
      localStorage.setItem(CLE_WEBAPP_DRIVE, val);
      pousserConfigDriveAdmin(val);
      zone.innerHTML = "<p>✅ URL Web App Google Drive enregistrée et synchronisée sur votre compte admin. La sauvegarde automatique (1× / 24 h) est active.</p>";
    });

    document.getElementById("sti-sauv-drive-now").addEventListener("click", function () {
      var val = String((inpUrl && inpUrl.value) || "").trim();
      if (val && estUrlWebAppDriveValide(val)) {
        localStorage.setItem(CLE_WEBAPP_DRIVE, val);
        pousserConfigDriveAdmin(val);
      }
      zone.innerHTML = "<p>⏳ Sauvegarde des 15 tables vers Google Drive en cours…</p>";
      appelerWebAppDrive("sauvegarder", val).then(function (res) {
        if (!res || !res.ok) {
          zone.innerHTML = "<p>⚠️ Réponse Drive : " + ech((res && (res.erreur || res.message)) || "échec") + "</p>";
          return;
        }
        pousserConfigDriveAdmin(val || lireUrlWebAppDrive());
        if (resumeEl) resumeEl.innerHTML = rendreResumeDrive();
        zone.innerHTML = "<p>✅ <b>" + ech(res.fichier) + "</b> enregistré dans Google Drive (" + Math.max(1, Math.round((res.taille_octets || 0) / 1024)) + " Ko · " + res.nb_tables + " tables · " + res.total_lignes + " lignes).</p>";
      }).catch(function (err) {
        zone.innerHTML = "<p>⚠️ " + ech(err && err.message) + "</p>";
      });
    });

    document.getElementById("sti-sauv-drive-statut").addEventListener("click", function () {
      var val = String((inpUrl && inpUrl.value) || "").trim();
      zone.innerHTML = "<p>⏳ Lecture du dossier Google Drive <code>STI — Sauvegardes base</code>…</p>";
      appelerWebAppDrive("statut", val).then(function (res) {
        if (!res || !res.ok) {
          zone.innerHTML = "<p>⚠️ " + ech((res && res.erreur) || "Impossible de lire le statut Drive") + "</p>";
          return;
        }
        var d = res.derniere;
        if (!d) {
          zone.innerHTML = "<p>ℹ️ Aucune archive trouvée dans le dossier Drive.</p>";
          return;
        }
        zone.innerHTML = "<p>✅ Dernière sauvegarde dans Drive : <b>" + ech(d.nom) + "</b> (" + Math.max(1, Math.round((d.taille_octets || 0) / 1024)) + " Ko · créée le " + ech(String(d.cree_le || "").slice(0, 19).replace("T", " ")) + ") · " + (res.fichiers ? res.fichiers.length : 1) + " archive(s) disponible(s).</p>";
      }).catch(function (err) {
        zone.innerHTML = "<p>⚠️ " + ech(err && err.message) + "</p>";
      });
    });
  }

  function bouton() {
    if (document.getElementById("sti-btn-sauvegarde")) return;
    var b = document.createElement("button");
    b.id = "sti-btn-sauvegarde";
    b.type = "button";
    b.textContent = "💾 Sauvegarde complète";
    b.setAttribute("style", 'position:fixed;left:14px;bottom:114px;z-index:99999;padding:11px 16px;border-radius:999px;border:3px solid #1a1a2e;background:#15803d;color:#fff;font-family:"Comic Sans MS","Comic Sans","Comic Neue","Chalkboard SE",cursive,sans-serif;font-weight:800;font-size:14px;cursor:pointer;box-shadow:4px 4px 0 #1a1a2e;');
    b.addEventListener("click", panneau);
    document.body.appendChild(b);
    setTimeout(function () {
      try { verifierSyncAutoDrive(); } catch (e) {}
    }, 15000);
    if (typeof setInterval === "function") {
      setInterval(function () {
        try { verifierSyncAutoDrive(); } catch (eI) {}
      }, 30 * 60 * 1000);
    }
    if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
      window.addEventListener("online", function () {
        try { verifierSyncAutoDrive(); } catch (eO) {}
      });
    }
    if (typeof document !== "undefined" && typeof document.addEventListener === "function") {
      document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "visible") {
          try { verifierSyncAutoDrive(); } catch (eV) {}
        }
      });
    }
  }

  window.STI_SAUVEGARDE = {
    TABLES_CLOUD: TABLES_CLOUD,
    ordrePostgrest: ordrePostgrest,
    estUrlWebAppDriveValide: estUrlWebAppDriveValide,
    collecterToutCloud: collecterToutCloud,
    compresserGzip: compresserGzip,
    lireTexteFichierSauvegarde: lireTexteFichierSauvegarde,
    exporter: exporter,
    appelerWebAppDrive: appelerWebAppDrive,
    televerserArchiveVersDrive: televerserArchiveVersDrive,
    verifierSyncAutoDrive: verifierSyncAutoDrive,
    ouvrirPanneau: panneau
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bouton);
  } else {
    bouton();
  }
})();
