/* ============================================================================
   STI V2.0 (v467) — SAUVEGARDE AUTOMATIQUE QUOTIDIENNE SUPABASE → GOOGLE DRIVE
   Projet Apps Script : STISauvegardeSupbase
   Dossier Google Drive : STI — Sauvegardes base
   Propriétés du script requises (Paramètres du projet → Propriétés du script) :
     - SUPABASE_URL         : https://vywujxmepvcbgedgmger.supabase.co
     - SUPABASE_SERVICE_KEY : clé secrète service_role Supabase (jamais dans Git)
     - DRIVE_FOLDER_ID      : identifiant du dossier Google Drive de destination
   Propriétés optionnelles :
     - RETENTION_MOIS       : durée de conservation en mois (défaut : 6)
     - RETENTION_JOURS      : durée de conservation en jours si précisée (ex. 45)
     - EMAIL_RAPPORT        : "oui" (défaut), "erreurs" ou "non"
     - FREQUENCE_AUTO       : "quotidienne" (défaut) ou "mensuelle"
   ============================================================================ */

var ADMIN_EMAIL_AUTORISE = "aymenessouyah@gmail.com";
var SUPABASE_URL_DEFAUT = "https://vywujxmepvcbgedgmger.supabase.co";
var SUPABASE_ANON_KEY_DEFAUT = "sb_publishable_FI5FimytONd5VdWK6GfXLA_I6vPTrvn";
var NOM_DOSSIER_DRIVE_DEFAUT = "STI — Sauvegardes base";

/* Les 18 tables public de la base STI V2.0 avec tri déterministe multi-colonnes.
   v590 : ajout du journal et des compteurs XP (v487) et des copies du journal de
   connexions (v582). Pour `acces_sauvegardes`, seule une sélection de colonnes est
   lue : la colonne `lignes` contient des copies entières du journal. */
var TABLES_SAUVEGARDE = [
  { nom: "profiles",             ordre: "id" },
  { nom: "acces",                ordre: "id" },
  { nom: "sti_progressions",     ordre: "user_id" },
  { nom: "sti_quiz_parties",     ordre: "id" },
  { nom: "sti_quiz_reponses",    ordre: "id" },
  { nom: "sti_quiz_sessions",    ordre: "user_id,quiz,mode" },
  { nom: "sti_quiz_vus",         ordre: "user_id,module,question_id" },
  { nom: "sti_diagnostics",      ordre: "id" },
  { nom: "sti_observations",     ordre: "id" },
  { nom: "labo_devices",         ordre: "id" },
  { nom: "labo_device_sessions", ordre: "session_id" },
  { nom: "labo_device_messages", ordre: "id" },
  { nom: "badges_labo",          ordre: "code_hash" },
  { nom: "app_config_public",    ordre: "id" },
  { nom: "push_subscriptions",   ordre: "id" },
  { nom: "sti_quiz_xp_compteurs", ordre: "user_id, cle" },
  { nom: "sti_quiz_xp_operations", ordre: "user_id, cree_le, operation_id" },
  { nom: "acces_sauvegardes",      ordre: "id", select: "id,motif,mois,nb_lignes,cree_le" }
];

function prop_(cle) {
  var v = PropertiesService.getScriptProperties().getProperty(cle);
  if (v === null || v === "") {
    throw new Error("Propriété manquante : " + cle + " (Paramètres du projet → Propriétés du script)");
  }
  return v.trim();
}

function ordrePostgrest_(ordre) {
  return String(ordre || "id")
    .split(",")
    .map(function (col) { return col.trim() + ".asc"; })
    .join(",");
}

function lireTable_(base, cle, table) {
  var PAGE = 1000, offset = 0, lignes = [];
  var clauseOrdre = ordrePostgrest_(table.ordre);
  for (;;) {
    var colonnes = table.select || "*";
    var url = base + "/rest/v1/" + table.nom + "?select=" + colonnes + "&order=" + clauseOrdre + "&limit=" + PAGE + "&offset=" + offset;
    var rep = UrlFetchApp.fetch(url, {
      method: "get",
      headers: {
        "apikey": cle,
        "Authorization": "Bearer " + cle,
        "Accept": "application/json"
      },
      muteHttpExceptions: true
    });
    if (rep.getResponseCode() !== 200) {
      throw new Error("HTTP " + rep.getResponseCode() + " : " + rep.getContentText().slice(0, 200));
    }
    var page = JSON.parse(rep.getContentText());
    lignes = lignes.concat(page);
    if (page.length < PAGE) break;
    offset += PAGE;
  }
  return lignes;
}

/* Auto-migration transparente de l'ancien déclencheur mensuel vers le déclencheur quotidien (~02 h) */
function assurerDeclencheurQuotidien_() {
  var props = PropertiesService.getScriptProperties();
  if ((props.getProperty("FREQUENCE_AUTO") || "quotidienne") === "mensuelle") return false;
  if (props.getProperty("TRIGGER_QUOTIDIEN_V467") === "1") return false;
  var existants = ScriptApp.getProjectTriggers();
  existants.forEach(function (d) {
    var fn = d.getHandlerFunction();
    if (fn === "sauvegardeMensuelle" || fn === "sauvegardeQuotidienne") {
      ScriptApp.deleteTrigger(d);
    }
  });
  ScriptApp.newTrigger("sauvegardeMensuelle").timeBased().everyDays(1).atHour(2).create();
  props.setProperty("TRIGGER_QUOTIDIEN_V467", "1");
  return true;
}

function listerSauvegardesDrive_(dossier, maxItems) {
  var liste = [];
  var it = dossier.getFiles();
  while (it.hasNext()) {
    var f = it.next();
    var nom = f.getName();
    if (nom.indexOf("sti-sauvegarde-") === 0 && !f.isTrashed()) {
      liste.push({
        id: f.getId(),
        nom: nom,
        taille_octets: f.getSize(),
        cree_le: f.getDateCreated().toISOString()
      });
    }
  }
  liste.sort(function (a, b) { return a.cree_le < b.cree_le ? 1 : (a.cree_le > b.cree_le ? -1 : 0); });
  return maxItems ? liste.slice(0, maxItems) : liste;
}

function executerSauvegardeDrive_(options) {
  var opts = options || {};
  var verrou = LockService.getScriptLock();
  if (!verrou.tryLock(30 * 1000)) {
    Logger.log("Une sauvegarde est déjà en cours, abandon.");
    return { ok: false, occupe: true, message: "Une sauvegarde est déjà en cours." };
  }
  try {
    try { assurerDeclencheurQuotidien_(); } catch (eTrig) { Logger.log("Info trigger : " + eTrig); }

    var base = (propOpt_("SUPABASE_URL") || SUPABASE_URL_DEFAUT).replace(/\/$/, "");
    var cle = prop_("SUPABASE_SERVICE_KEY");
    var dossier = obtenirDossierSauvegarde_();

    var sortie = {
      exporte_le: new Date().toISOString(),
      automatique: true,
      version: "v467",
      source: opts.source || "trigger",
      nb_tables: TABLES_SAUVEGARDE.length,
      total_lignes: 0,
      tables: {}
    };
    var rapport = [], erreurs = [], resumeTables = {};
    TABLES_SAUVEGARDE.forEach(function (t) {
      try {
        var lignes = lireTable_(base, cle, t);
        sortie.tables[t.nom] = lignes;
        sortie.total_lignes += lignes.length;
        resumeTables[t.nom] = lignes.length;
        rapport.push("✅ " + t.nom + " : " + lignes.length + " ligne(s)");
      } catch (e) {
        sortie.tables[t.nom] = [];
        resumeTables[t.nom] = 0;
        erreurs.push("⚠️ " + t.nom + " : " + e.message);
      }
    });

    var dateFichier = Utilities.formatDate(new Date(), "Africa/Tunis", "yyyy-MM-dd");
    var nomJson = "sti-sauvegarde-" + dateFichier + ".json";
    var nomGz = nomJson + ".gz";
    var blob = Utilities.newBlob(JSON.stringify(sortie), "application/json", nomJson);
    var gz = Utilities.gzip(blob, nomGz);
    var fichier = dossier.createFile(gz);
    var idNouveau = fichier.getId();
    rapport.push("💾 Fichier : " + fichier.getName() + " (" + Math.round(fichier.getSize() / 1024) + " Ko · " + sortie.total_lignes + " lignes sur " + TABLES_SAUVEGARDE.length + " tables)");

    /* Déduplication du jour + rotation des archives anciennes */
    var props = PropertiesService.getScriptProperties();
    var retentionJours = parseInt(props.getProperty("RETENTION_JOURS") || "0", 10);
    var retentionMois = parseInt(props.getProperty("RETENTION_MOIS") || "6", 10);
    var limite = null;
    if (retentionJours > 0) {
      limite = new Date(Date.now() - retentionJours * 24 * 3600 * 1000);
    } else if (retentionMois > 0) {
      limite = new Date();
      limite.setMonth(limite.getMonth() - retentionMois);
    }

    var it = dossier.getFiles();
    while (it.hasNext()) {
      var f = it.next();
      if (f.getId() === idNouveau || f.isTrashed()) continue;
      var n = f.getName();
      if (n.indexOf("sti-sauvegarde-") !== 0) continue;
      if (n === nomGz) {
        f.setTrashed(true);
        rapport.push("♻️ Doublon du jour remplacé : " + n);
      } else if (limite && f.getDateCreated() < limite) {
        f.setTrashed(true);
        rapport.push("🗑️ Ancienne sauvegarde mise à la corbeille : " + n);
      }
    }

    var texte = rapport.concat(erreurs).join("\n");
    Logger.log(texte);

    var modeMail = (props.getProperty("EMAIL_RAPPORT") || "oui").toLowerCase();
    var envoyerMail = modeMail !== "non" && (!opts.silencieux || erreurs.length > 0) && (modeMail !== "erreurs" || erreurs.length > 0);
    if (envoyerMail) {
      try {
        var dest = Session.getActiveUser().getEmail() || ADMIN_EMAIL_AUTORISE;
        MailApp.sendEmail(
          dest,
          (erreurs.length ? "⚠️" : "✅") + " Sauvegarde STI (18 tables) du " + dateFichier + " (" + fichier.getName() + ")",
          texte + "\n\nDossier Drive : " + dossier.getUrl()
        );
      } catch (eMail) {
        Logger.log("Envoi e-mail ignoré : " + eMail);
      }
    }

    if (erreurs.length && !opts.retournerMemeSiErreur) {
      throw new Error(erreurs.join(" ; "));
    }

    return {
      ok: erreurs.length === 0,
      fichier: fichier.getName(),
      file_id: idNouveau,
      taille_octets: fichier.getSize(),
      cree_le: sortie.exporte_le,
      nb_tables: TABLES_SAUVEGARDE.length,
      total_lignes: sortie.total_lignes,
      tables: resumeTables,
      erreurs: erreurs
    };
  } catch (e) {
    try {
      var destErr = Session.getActiveUser().getEmail() || ADMIN_EMAIL_AUTORISE;
      MailApp.sendEmail(destErr, "❌ Échec sauvegarde STI", String((e && e.message) || e));
    } catch (e2) { /* pas d'e-mail possible : l'erreur reste dans le journal */ }
    throw e;
  } finally {
    verrou.releaseLock();
  }
}

/* Conservé sous ce nom exact pour compatibilité immédiate avec tout déclencheur existant */
function sauvegardeMensuelle() {
  return executerSauvegardeDrive_({ source: "trigger-auto" });
}

/* Alias explicite pour l'exécution quotidienne */
function sauvegardeQuotidienne() {
  return executerSauvegardeDrive_({ source: "trigger-quotidien" });
}

/* À exécuter UNE fois : installe le déclencheur quotidien automatique (~02 h heure de Tunis) */
function installer() {
  return installerQuotidien();
}

function installerQuotidien() {
  ScriptApp.getProjectTriggers().forEach(function (d) {
    var fn = d.getHandlerFunction();
    if (fn === "sauvegardeMensuelle" || fn === "sauvegardeQuotidienne") {
      ScriptApp.deleteTrigger(d);
    }
  });
  ScriptApp.newTrigger("sauvegardeMensuelle").timeBased().everyDays(1).atHour(2).create();
  PropertiesService.getScriptProperties().setProperty("FREQUENCE_AUTO", "quotidienne");
  PropertiesService.getScriptProperties().setProperty("TRIGGER_QUOTIDIEN_V467", "1");
  Logger.log("✅ Déclencheur quotidien installé : chaque nuit vers 02 h (18 tables Supabase → Google Drive).");
}

function installerMensuel() {
  ScriptApp.getProjectTriggers().forEach(function (d) {
    var fn = d.getHandlerFunction();
    if (fn === "sauvegardeMensuelle" || fn === "sauvegardeQuotidienne") {
      ScriptApp.deleteTrigger(d);
    }
  });
  ScriptApp.newTrigger("sauvegardeMensuelle").timeBased().onMonthDay(1).atHour(2).create();
  PropertiesService.getScriptProperties().setProperty("FREQUENCE_AUTO", "mensuelle");
  Logger.log("✅ Déclencheur mensuel installé : le 1er de chaque mois vers 02 h.");
}

function propOpt_(cle) {
  var v = PropertiesService.getScriptProperties().getProperty(cle);
  return v ? String(v).trim() : "";
}

function obtenirDossierSauvegarde_() {
  var idDossier = propOpt_("DRIVE_FOLDER_ID");
  if (idDossier) return DriveApp.getFolderById(idDossier);
  if (typeof DriveApp.getFolders === "function") {
    var it = DriveApp.getFolders();
    while (it.hasNext()) {
      var d = it.next();
      if (!d.isTrashed() && String(d.getName() || "").trim() === NOM_DOSSIER_DRIVE_DEFAUT) {
        return d;
      }
    }
  }
  if (typeof DriveApp.createFolder === "function") {
    return DriveApp.createFolder(NOM_DOSSIER_DRIVE_DEFAUT);
  }
  return DriveApp.getFolderById(prop_("DRIVE_FOLDER_ID"));
}

/* Vérification cryptographique du jeton JWT administrateur auprès de Supabase Auth */
function verifierJetonAdmin_(jeton) {
  if (!jeton || typeof jeton !== "string" || jeton.length < 20) return false;
  var base = (propOpt_("SUPABASE_URL") || SUPABASE_URL_DEFAUT).replace(/\/$/, "");
  var cle = propOpt_("SUPABASE_SERVICE_KEY") || SUPABASE_ANON_KEY_DEFAUT;
  var rep = UrlFetchApp.fetch(base + "/auth/v1/user", {
    method: "get",
    headers: {
      "apikey": cle,
      "Authorization": "Bearer " + jeton.trim(),
      "Accept": "application/json"
    },
    muteHttpExceptions: true
  });
  if (rep.getResponseCode() !== 200) return false;
  var usr = JSON.parse(rep.getContentText() || "{}");
  return String(usr.email || "").toLowerCase() === ADMIN_EMAIL_AUTORISE;
}

function reponseJson_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* Téléversement direct d'une archive 18 tables déjà collectée côté admin.html (secours sans service_role) */
function enregistrerArchiveDirecteDrive_(corps) {
  var verrou = LockService.getScriptLock();
  if (!verrou.tryLock(25000)) {
    return { ok: false, erreur: "Une sauvegarde Drive est déjà en cours." };
  }
  try {
    var jsonTxt = String(corps.archive_json || "");
    if (!jsonTxt || jsonTxt.length < 20) {
      return { ok: false, erreur: "Archive JSON absente ou vide." };
    }
    var parsed = JSON.parse(jsonTxt);
    var dossier = obtenirDossierSauvegarde_();
    var maintenant = new Date();
    var dateFichier = Utilities.formatDate(maintenant, "Africa/Tunis", "yyyy-MM-dd");
    var nomJson = "sti-sauvegarde-" + dateFichier + ".json";
    var nomGz = nomJson + ".gz";
    var blob = Utilities.newBlob(jsonTxt, "application/json", nomJson);
    var gz = Utilities.gzip(blob, nomGz);
    if (gz && typeof gz.setName === "function") gz.setName(nomGz);
    var fichier = dossier.createFile(gz);
    var idNouveau = fichier.getId();

    var props = PropertiesService.getScriptProperties();
    var retentionJours = parseInt(props.getProperty("RETENTION_JOURS") || "0", 10);
    var retentionMois = parseInt(props.getProperty("RETENTION_MOIS") || "6", 10);
    var limite = null;
    if (retentionJours > 0) {
      limite = new Date(Date.now() - retentionJours * 24 * 3600 * 1000);
    } else if (retentionMois > 0) {
      limite = new Date();
      limite.setMonth(limite.getMonth() - retentionMois);
    }
    var it = dossier.getFiles();
    while (it.hasNext()) {
      var f = it.next();
      if (f.getId() === idNouveau || f.isTrashed()) continue;
      var n = f.getName();
      if (n.indexOf("sti-sauvegarde-") !== 0) continue;
      if (n === nomGz || (limite && f.getDateCreated() < limite)) {
        f.setTrashed(true);
      }
    }
    var nbTbl = parsed && parsed.tables ? Object.keys(parsed.tables).length : TABLES_SAUVEGARDE.length;
    var totLig = Number(parsed && parsed.total_lignes) || 0;
    return {
      ok: true,
      mode: "televerser",
      fichier: fichier.getName(),
      file_id: idNouveau,
      taille_octets: fichier.getSize(),
      cree_le: (parsed && parsed.exporte_le) || maintenant.toISOString(),
      nb_tables: nbTbl,
      total_lignes: totLig
    };
  } finally {
    verrou.releaseLock();
  }
}

/* Point d'entrée Web App (optionnel) pour synchronisation directe depuis admin.html */
function doPost(e) {
  try {
    var corps = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    var jeton = String(corps.access_token || "");
    if (!verifierJetonAdmin_(jeton)) {
      return reponseJson_({ ok: false, erreur: "Accès refusé : administrateur requis." });
    }
    var action = String(corps.action || "sauvegarder");
    if (action === "statut") {
      var dossier = obtenirDossierSauvegarde_();
      var fichiers = listerSauvegardesDrive_(dossier, 10);
      return reponseJson_({
        ok: true,
        nb_tables_configurees: TABLES_SAUVEGARDE.length,
        derniere: fichiers[0] || null,
        fichiers: fichiers
      });
    }
    if (action === "televerser") {
      return reponseJson_(enregistrerArchiveDirecteDrive_(corps));
    }
    var res = executerSauvegardeDrive_({
      source: "admin-dashboard",
      silencieux: true,
      retournerMemeSiErreur: true
    });
    return reponseJson_(res);
  } catch (err) {
    return reponseJson_({ ok: false, erreur: String((err && err.message) || err) });
  }
}

function doGet() {
  return reponseJson_({
    ok: true,
    service: "STISauvegardeSupbase",
    version: "v467",
    nb_tables: TABLES_SAUVEGARDE.length
  });
}

/* Petit test de connexion (vérifie les 18 tables sans créer d'archive) */
function testerConnexion() {
  var base = prop_("SUPABASE_URL").replace(/\/$/, "");
  var cle = prop_("SUPABASE_SERVICE_KEY");
  TABLES_SAUVEGARDE.forEach(function (t) {
    var rep = UrlFetchApp.fetch(base + "/rest/v1/" + t.nom + "?select=*&order=" + ordrePostgrest_(t.ordre) + "&limit=1", {
      headers: { "apikey": cle, "Authorization": "Bearer " + cle },
      muteHttpExceptions: true
    });
    Logger.log((rep.getResponseCode() === 200 ? "✅ " : "❌ ") + t.nom + " → HTTP " + rep.getResponseCode());
  });
  Logger.log("Dossier Drive : " + DriveApp.getFolderById(prop_("DRIVE_FOLDER_ID")).getName() + " ✅");
}
