/* ═══ STI EXPORT DRIVE (v603) — la sauvegarde de secours de TOUTE la plateforme,
       déposée sur Google Drive depuis le tableau de bord administrateur.

   Les sauvegardes existantes ne protégeaient que la base (18 tables). Celle-ci
   réunit dans UN SEUL fichier déposé dans « STI — Sauvegardes base » :
     • les 18 tables Supabase (comme avant) ;
     • le schéma complet de la base : le schéma initial puis les migrations,
       dans l'ordre, tels quels — de quoi recréer la base sans le dépôt ;
     • le code source du site (HTML, CSS, JS, JSON, SVG, SQL) dans la limite de
       8 Mo ; au-delà, l'empreinte de chaque fichier est conservée ;
     • le manifeste des fichiers du site (chemin, taille, empreinte), pour
       savoir exactement ce qu'il reste à récupérer sur GitHub ;
     • la procédure de remise en service, en clair, dans l'archive.

   L'archive passe par le même Web App Apps Script que « Sauvegarder vers
   Drive » (action « televerser ») : aucun nouveau déploiement n'est requis, et
   le fichier du jour (`sti-sauvegarde-AAAA-MM-JJ.json.gz`) contient tout. */
(function (window, document) {
  "use strict";

  var PLAFOND_OCTETS = 8 * 1024 * 1024;
  var MAX_FICHIER = 400 * 1024;
  var MOTIF_TEXTE = /\.(?:html?|css|js|mjs|json|webmanifest|md|txt|sql|svg|gs|py|ya?ml|csv|vtt|xml)$/i;

  function ech(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function estTextuel(chemin) {
    return MOTIF_TEXTE.test(String(chemin || ""));
  }

  /* Ordre de collecte : la base d'abord (c'est la seule chose qui n'existe
     nulle part ailleurs), puis les pages, puis le style et les scripts. */
  function rang(chemin) {
    var c = String(chemin || "");
    if (/^supabase\//i.test(c) || /^tools\/.*\.sql$/i.test(c)) return 0;
    if (/^documents\/sql\//i.test(c)) return 1;
    if (/\.html?$/i.test(c)) return 2;
    if (/\.css$/i.test(c)) return 3;
    if (/\.m?js$/i.test(c)) return 4;
    if (/\.(?:json|webmanifest)$/i.test(c)) return 5;
    if (/\.(?:md|txt)$/i.test(c)) return 6;
    if (/\.svg$/i.test(c)) return 7;
    return 8;
  }

  function empreinte(texte) {
    try {
      if (window.crypto && window.crypto.subtle && window.TextEncoder) {
        return window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(texte))
          .then(function (tampon) {
            var octets = new Uint8Array(tampon), hex = "";
            for (var i = 0; i < octets.length; i++) hex += (octets[i] < 16 ? "0" : "") + octets[i].toString(16);
            return hex;
          })
          .catch(function () { return ""; });
      }
    } catch (e) {}
    return Promise.resolve("");
  }

  function lireTexte(chemin) {
    return fetch(chemin, { credentials: "same-origin" })
      .then(function (r) { return r && r.ok ? r.text() : ""; })
      .catch(function () { return ""; });
  }

  function versionPubliee() {
    return lireTexte("sw.js").then(function (texte) {
      var m = String(texte || "").match(/var\s+VERSION_PUBLIEE\s*=\s*"([^"]+)"/);
      return m ? m[1] : "";
    });
  }

  function poidsLisible(octets) {
    var n = Number(octets) || 0;
    if (n >= 1024 * 1024) return (Math.round(n / 1024 / 102.4) / 10) + " Mo";
    return Math.max(1, Math.round(n / 1024)) + " Ko";
  }

  /* Le mode d'emploi voyage DANS l'archive : dans six mois, celui qui ouvre le
     fichier doit pouvoir tout remonter sans rien demander à personne. */
  function instructions(entree) {
    var version = (entree && entree.version) || "inconnue";
    var date = (entree && entree.date) || new Date().toISOString();
    return [
      "# STI V2.0 — remise en service",
      "",
      "Archive complète : données + schéma de la base + code du site.",
      "Version de la plateforme : " + version + " · exportée le " + date + ".",
      "",
      "## 1. Le site",
      "1. Récupérer `sti-plateforme-CODE-*.tar.gz` sur le Drive (dossier « STI — Sauvegardes base »).",
      "2. Extraire, puis copier le dossier `plateforme/` à la racine du domaine (GitHub Pages).",
      "3. Vérifier les empreintes : `cd <dossier>` puis `sha256sum -c _secours/empreintes.txt`.",
      "4. Rien n'est à paramétrer : `assets/js/config.js` porte l'URL et la clé publique Supabase.",
      "",
      "## 2. La base",
      "1. Créer un projet Supabase.",
      "2. Coller, dans l'éditeur SQL, les fichiers de `export_plateforme.schema.fichiers`",
      "   dans cet ordre : `tools/supabase-schema.sql`, puis les `supabase/migrations/*.sql`",
      "   par date croissante, puis les `documents/sql/*.sql`.",
      "3. Vérifier : chaque table doit avoir RLS activée et ses politiques (voir § 4).",
      "4. Les fonctions SQL métier (`admin_sauvegarde_tables_annexes`, RPC XP, etc.)",
      "   sont incluses dans ces scripts.",
      "",
      "## 3. Les données",
      "1. Lire `tables` (ou `cloud`) dans ce fichier : ce sont les 18 tables, ligne par ligne.",
      "2. Les réinjecter table par table, dans cet ordre : profiles, acces,",
      "   sti_progressions, sti_quiz_parties, sti_quiz_reponses, sti_quiz_sessions,",
      "   sti_quiz_vus, sti_quiz_xp_compteurs, sti_quiz_xp_operations, sti_diagnostics,",
      "   sti_observations, labo_devices, labo_device_sessions, labo_device_messages,",
      "   badges_labo, app_config_public, push_subscriptions, acces_sauvegardes.",
      "3. Le bouton « Restaurer les préférences locales depuis une archive » du tableau",
      "   de bord administrateur fait le plus gros du travail depuis un `.json.gz`.",
      "",
      "## 4. Les contrôles",
      "- Connexion administrateur : `admin.html` doit s'ouvrir sans erreur.",
      "- Contact Supabase : la roue du compte et le tableau de bord doivent afficher les noms.",
      "- Les 18 tables doivent compter le même nombre de lignes qu'à l'export.",
      "- Le service worker doit annoncer la version " + version + ".",
      "",
      "## 5. Ce que cette archive ne contient pas",
      "- Les vidéos et les sons (près d'un gigaoctet) : ils restent sur GitHub.",
      "- Les secrets : la clé `service_role` n'est écrite nulle part dans le site.",
      "  Elle se recrée dans Supabase → Project Settings → API.",
      ""
    ].join("\n");
  }

  /* Fonction pure, sans lecture réseau : c'est elle que vérifient les tests. */
  function assembler(entree) {
    entree = entree || {};
    var donnees = entree.donnees || {};
    var files = (entree.manifeste && entree.manifeste.files) || [];
    var textes = entree.textes || [];
    var omis = entree.omis || [];
    var date = entree.date || new Date().toISOString();
    var schema = {}, site = {}, inclus = [], octetsSchema = 0, octetsSite = 0;

    textes.forEach(function (f) {
      var texte = String(f.texte == null ? "" : f.texte);
      if (rang(f.chemin) <= 1) { schema[f.chemin] = texte; octetsSchema += texte.length; }
      else { site[f.chemin] = texte; octetsSite += texte.length; }
      inclus.push({ chemin: f.chemin, octets: texte.length, sha256: f.sha256 || "" });
    });

    var totalOctets = files.reduce(function (t, f) { return t + (Number(f.bytes) || 0); }, 0);

    return {
      exporte_le: date,
      genere_le: date,
      automatique: false,
      version: "v603",
      plateforme: "STI By AE V2.0",
      nb_tables: donnees.nb_tables || 0,
      total_lignes: donnees.total_lignes || 0,
      tables: donnees.tables || {},
      cloud: donnees.cloud || {},
      local: donnees.local || {},
      erreurs: donnees.erreurs || {},
      export_plateforme: {
        format: "sti-export-plateforme/1",
        version_publiee: entree.version || "",
        genere_le: date,
        origine: "admin.html — bouton « Export vers Drive »",
        schema: { fichiers: schema, total_octets: octetsSchema, nb_fichiers: Object.keys(schema).length },
        site: { fichiers: site, total_octets: octetsSite, nb_fichiers: Object.keys(site).length },
        omis: omis,
        manifeste: {
          total_fichiers: files.length,
          total_octets: totalOctets,
          fichiers: files.map(function (f) {
            return { chemin: f.path, octets: Number(f.bytes) || 0, empreinte: f.sha256 || f.gitSha || "" };
          }),
          inclus: inclus
        },
        instructions: instructions({ version: entree.version, date: date })
      }
    };
  }

  /* Lecture des fichiers du site, par ordre de priorité, jusqu'au plafond.
     Au-delà, la raison exacte est écrite dans `omis` : l'archive reste donc
     vérifiable, fichier par fichier. */
  function collecterFichiers(manifeste, plafond, onEtat) {
    var files = ((manifeste && manifeste.files) || []).filter(function (f) {
      return f && f.path && estTextuel(f.path);
    });
    files.sort(function (a, b) {
      var ra = rang(a.path), rb = rang(b.path);
      if (ra !== rb) return ra - rb;
      return String(a.path).localeCompare(String(b.path));
    });

    var textes = [], omis = [], employe = 0, curseur = 0;
    var limite = Number(plafond) > 0 ? Number(plafond) : PLAFOND_OCTETS;

    function suivant() {
      if (curseur >= files.length) return Promise.resolve({ textes: textes, omis: omis });
      var f = files[curseur++];
      var taille = Number(f.bytes) || 0;
      if (taille > MAX_FICHIER) {
        omis.push({ chemin: f.path, octets: taille, raison: "fichier de plus de " + Math.round(MAX_FICHIER / 1024) + " Ko" });
        if (onEtat) onEtat({ fait: curseur, total: files.length });
        return suivant();
      }
      if (employe + taille > limite) {
        omis.push({ chemin: f.path, octets: taille, raison: "plafond de " + Math.round(limite / (1024 * 1024)) + " Mo atteint" });
        if (onEtat) onEtat({ fait: curseur, total: files.length });
        return suivant();
      }
      return lireTexte(f.path).then(function (texte) {
        if (!texte) {
          omis.push({ chemin: f.path, octets: taille, raison: "lecture impossible" });
          return null;
        }
        employe += texte.length;
        return empreinte(texte).then(function (sha) {
          textes.push({ chemin: f.path, texte: texte, sha256: sha });
        });
      }).then(function () {
        if (onEtat) onEtat({ fait: curseur, total: files.length });
        return suivant();
      });
    }

    return suivant();
  }

  function preparer(collecterDonnees, options, onEtat) {
    var opts = options || {};
    var date = new Date().toISOString();
    if (onEtat) onEtat({ etape: "Données : lecture paginée des tables Supabase…" });
    return collecterDonnees().then(function (donnees) {
      if (onEtat) onEtat({ etape: "Version publiée…" });
      return versionPubliee().then(function (version) {
        return lireTexte("offline-complete-manifest.json").then(function (brut) {
          var manifeste = null;
          try { manifeste = JSON.parse(brut); } catch (e) { manifeste = null; }
          if (!manifeste || !Array.isArray(manifeste.files)) {
            return Promise.reject(new Error("Manifeste hors-ligne illisible : rechargez la page puis relancez l'export."));
          }
          var liste = manifeste.files;
          if (opts.avecCode === false) {
            liste = liste.filter(function (f) { return rang(f.path) <= 1; });
            if (onEtat) onEtat({ etape: "Schéma de la base et consignes (sans le code du site)…" });
            return collecterFichiers({ files: liste }, PLAFOND_OCTETS, null).then(function (lot) {
              return assembler({ donnees: donnees, manifeste: manifeste, textes: lot.textes, omis: lot.omis, version: version, date: date });
            });
          }
          if (onEtat) onEtat({ etape: "Code du site : lecture des fichiers texte…", fait: 0, total: 0 });
          return collecterFichiers({ files: liste }, PLAFOND_OCTETS, function (p) {
            if (onEtat) onEtat({ etape: "Code du site : lecture des fichiers texte…", fait: p.fait, total: p.total });
          }).then(function (lot) {
            return assembler({ donnees: donnees, manifeste: manifeste, textes: lot.textes, omis: lot.omis, version: version, date: date });
          });
        });
      });
    });
  }

  /* Envoi : même Web App que la sauvegarde des données (action « televerser »).
     Le script Apps Script gzippe `archive_json` et le dépose dans le dossier
     « STI — Sauvegardes base » : rien à redéployer. */
  function televerser(url, jeton, charge) {
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "televerser", access_token: jeton, archive_json: JSON.stringify(charge) })
    }).then(function (r) {
      if (!r || !r.ok) return Promise.reject(new Error("HTTP " + (r ? r.status : 0)));
      return r.json();
    });
  }

  function exporter(contexte, options) {
    contexte = contexte || {};
    var opts = options || {};
    var zone = opts.zone || null;
    var etat = document.getElementById("sti-sauv-export-etat");
    function dire(texte) { if (etat) etat.innerHTML = texte; }

    if (!contexte.urlDrive) return Promise.reject(new Error("URL Web App Apps Script non configurée : collez-la dans le champ ci-dessus puis « Enregistrer URL »."));
    if (!contexte.jeton) return Promise.reject(new Error("Session administrateur requise."));

    dire("<p>⏳ Préparation de l'archive complète…</p>");
    if (zone) zone.innerHTML = "<p>⏳ Export vers Drive en cours : données, schéma, code du site et consignes.</p>";

    return preparer(contexte.collecterDonnees, opts, function (p) {
      if (p.etape) dire("<p>⏳ " + ech(p.etape) + (p.total ? " <b>" + p.fait + " / " + p.total + "</b>" : "") + "</p>");
      else if (p.total) dire("<p>⏳ Code du site : <b>" + p.fait + " / " + p.total + "</b> fichiers lus…</p>");
    }).then(function (charge) {
      var bloc = charge.export_plateforme;
      var octets = JSON.stringify(charge).length;
      dire("<p>⏳ Envoi vers Google Drive (" + poidsLisible(octets) + " : "
        + bloc.schema.nb_fichiers + " fichiers de schéma, "
        + bloc.site.nb_fichiers + " fichiers du site, "
        + bloc.manifeste.total_fichiers + " fichiers inventoriés)…</p>");
      return televerser(contexte.urlDrive, contexte.jeton, charge).then(function (res) {
        if (res && typeof contexte.memoriser === "function") contexte.memoriser(res);
        if (!res || !res.ok) throw new Error((res && (res.erreur || res.message)) || "Drive a refusé l'archive.");
        var fin = "<p>✅ <b>Export vers Drive réussi.</b><br>"
          + "Fichier : <b>" + ech(res.fichier || "—") + "</b> · " + poidsLisible(res.taille_octets || octets)
          + (res.file_id ? ' · <a href="https://drive.google.com/file/d/' + encodeURIComponent(res.file_id) + '/view" target="_blank" rel="noopener">ouvrir sur le Drive</a>' : "")
          + "<br><span style='font-size:12px'>Contenu : " + charge.total_lignes + " lignes sur " + charge.nb_tables + " tables · "
          + bloc.schema.nb_fichiers + " fichiers de schéma · " + bloc.site.nb_fichiers + " fichiers du site ("
          + poidsLisible(bloc.site.total_octets + bloc.schema.total_octets) + ") · version " + ech(bloc.version_publiee || "?") + "</span>"
          + (bloc.omis.length ? "<br><span style='font-size:12px;opacity:.85'>Non inclus (empreinte conservée dans le manifeste) : " + bloc.omis.length + " fichier(s).</span>" : "")
          + "</p>";
        dire(fin);
        if (zone) zone.innerHTML = fin;
        return res;
      });
    }).catch(function (err) {
      var ko = "<p>⚠️ Export impossible : " + ech((err && err.message) || err) + "</p>";
      dire(ko);
      if (zone) zone.innerHTML = ko;
      return null;
    });
  }

  window.STIExportDrive = {
    VERSION: "v603",
    PLAFOND_OCTETS: PLAFOND_OCTETS,
    MAX_FICHIER: MAX_FICHIER,
    estTextuel: estTextuel,
    rang: rang,
    assembler: assembler,
    collecterFichiers: collecterFichiers,
    instructions: instructions,
    preparer: preparer,
    televerser: televerser,
    exporter: exporter
  };
})(window, document);
