/* ============================================================================
   🧪 STI V2.0 — CHANTIER DES EXERCICES (v450) : assets/js/exercices-atelier.js
   - Tableau de bord d'avancement, recherche & filtres sur series-exercices.html
   - Suivi par série (À faire / En cours / Terminé ✅ / À revoir ⭐ + Note /20)
     synchronisé automatiquement vers Supabase (sti_progressions via sti-*)
   - Système d'Indices Progressifs à 2 niveaux (« 💡 Coup de pouce ») avant corrigé
   - Verrouillage en direct des corrigés par matière & classe depuis admin.html
   - Mode TP Interactif sur les feuilles d'énoncés Tp*.html (champs à la place des
     pointillés, auto-correction /20 sur TP1/TP2 JS, zones de réponse auto-sauvées,
     mode sombre lisible et impression A4 propre)
   ============================================================================ */
(function () {
  "use strict";
  if (window.__STI_EXERCICES_ATELIER_V450) return;
  window.__STI_EXERCICES_ATELIER_V450 = true;

  var CLE_SUIVI = "sti-exo-suivi-v1";
  var CLE_BROUILLONS = "sti-exo-brouillons-v1";
  var CLE_INDICES_SESSION = "sti-exo-indices-session-v1";
  var FONT_COMIC = '"Comic Sans MS", "Comic Sans", "Comic Neue", "Chalkboard SE", cursive, sans-serif';

  function lireJson(cle, def, session) {
    try {
      var st = session ? sessionStorage : localStorage;
      var brut = st.getItem(cle);
      if (!brut) return def;
      var v = JSON.parse(brut);
      return v && typeof v === "object" ? v : def;
    } catch (e) {
      return def;
    }
  }

  function ecrireJson(cle, val, session) {
    try {
      var st = session ? sessionStorage : localStorage;
      st.setItem(cle, JSON.stringify(val));
      if (!session) {
        localStorage.setItem("sti-sync-maj", String(Date.now()));
      }
    } catch (e) {}
  }

  function echap(s) {
    return String(s || "").replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function estAdminActif() {
    try {
      if (localStorage.getItem("sti-admin-gold") === "1") return true;
      var perm = JSON.parse(localStorage.getItem("sti-labo3-permanent") || "null");
      var cache = perm || JSON.parse(localStorage.getItem("sti-session-cache") || "null");
      return Boolean(cache && cache.isAdmin);
    } catch (e) {
      return false;
    }
  }

  function obtenirClasseEleve() {
    try {
      var perm = JSON.parse(localStorage.getItem("sti-labo3-permanent") || "null");
      var cache = perm || JSON.parse(localStorage.getItem("sti-session-cache") || "null");
      return String((cache && cache.classe) || "").trim();
    } catch (e) {
      return "";
    }
  }

  function est4SIAutorise() {
    if (document.documentElement.classList.contains("sti-4si-autorise")) return true;
    if (estAdminActif()) return true;
    var cl = obtenirClasseEleve().toUpperCase().replace(/[\s._\-]+/g, "");
    return /^4(E|ÈME|EME)?SI([1-5])?$/i.test(cl) || cl === "ELEVELABO3" || cl.indexOf("GOLD") !== -1;
  }

  function estCibleParVerrou(cible, cl) {
    if (!cible || cible === "*") return true;
    var cNorm = String(cl || "").trim().toUpperCase().replace(/[\s._\-]+/g, "");
    var tNorm = String(cible || "").trim().toUpperCase().replace(/[\s._\-]+/g, "");
    if (!cNorm) return tNorm === "*";
    if (tNorm === "3SI") return /^3(E|ÈME|EME)?SI/i.test(cNorm);
    if (tNorm === "4SI") return /^4(E|ÈME|EME)?SI/i.test(cNorm);
    return cNorm === tNorm;
  }

  function normaliserMatiere(m) {
    var s = String(m || "").toLowerCase().trim();
    if (s === "bdd" || s === "bd" || s.indexOf("sql") !== -1) return "sql";
    if (s.indexOf("js") !== -1 || s.indexOf("javascript") !== -1) return "javascript";
    if (s.indexOf("php") !== -1) return "php";
    return "css3";
  }

  function libelleMatiere(m) {
    var k = normaliserMatiere(m);
    if (k === "javascript") return "⚡ JavaScript";
    if (k === "sql") return "🗄️ Base de données (SQL)";
    if (k === "php") return "🐘 PHP & MySQLi";
    return "🎨 HTML5 & CSS3";
  }

  function lireConfigVerrouCorriges() {
    try {
      var cfgSec = JSON.parse(localStorage.getItem("sti-sec-config") || "null");
      if (!cfgSec || !cfgSec.corrigesVerrou || typeof cfgSec.corrigesVerrou !== "object") {
        return { actif: false, cible: "*", matieres: {}, indicesAutorises: true, finMs: 0, motif: "" };
      }
      var cv = cfgSec.corrigesVerrou;
      if (cv.finMs && Number(cv.finMs) > 0 && Date.now() >= Number(cv.finMs)) {
        return { actif: false, cible: "*", matieres: {}, indicesAutorises: true, finMs: 0, motif: "" };
      }
      return cv;
    } catch (e) {
      return { actif: false, cible: "*", matieres: {}, indicesAutorises: true, finMs: 0, motif: "" };
    }
  }

  function estCorrigeVerrouille(matiere, ignorerAdmin) {
    if (!ignorerAdmin && estAdminActif()) return false;
    var cv = lireConfigVerrouCorriges();
    if (!cv.actif) return false;
    var maCl = obtenirClasseEleve();
    if (maCl && !estCibleParVerrou(cv.cible || "*", maCl)) return false;
    var cle = normaliserMatiere(matiere);
    return Boolean(cv.matieres && cv.matieres[cle]);
  }

  function sontIndicesAutorises() {
    if (estAdminActif()) return true;
    var cv = lireConfigVerrouCorriges();
    if (!cv.actif) return true;
    return cv.indicesAutorises !== false;
  }

  function detecterMatiereDepuisUrl(url) {
    var u = String(url || location.pathname || "").toLowerCase();
    if (u.indexOf("/php/") !== -1 || u.indexOf("-php") !== -1 || u.indexOf("sondage") !== -1 || u.indexOf("statphp") !== -1) return "php";
    if (u.indexOf("/sql/") !== -1 || u.indexOf("-bd") !== -1 || u.indexOf("requ") !== -1 || u.indexOf("sql") !== -1) return "sql";
    if (u.indexOf("/javascript/") !== -1 || u.indexOf("-js") !== -1 || u.indexOf("carte-bancaire") !== -1 || u.indexOf("outils-js") !== -1) return "javascript";
    return "css3";
  }

  function estPageCorrigeDirecte(pathname) {
    var p = String(pathname || "").toLowerCase();
    if (p.indexOf("/exercices/") === -1) return false;
    return (
      p.indexOf("correction") !== -1 ||
      p.indexOf("tp2corrposition") !== -1 ||
      p.indexOf("sondage-parcours-pas-a-pas") !== -1 ||
      p.indexOf("statphpanimee") !== -1
    );
  }

  function estLienCorrigeVerrouillable(btn, hrefOuUrl) {
    var u = String(hrefOuUrl || "").toLowerCase();
    if (!u) return false;
    if (/\.(rar|zip|7z|docx)(\?|$)/i.test(u)) return false;
    if (btn && btn.hasAttribute && btn.hasAttribute("download")) return false;
    var txt = String((btn && btn.textContent) || "").toLowerCase();
    if (txt.indexOf("plein écran") !== -1 && u.indexOf("correction") === -1) return false;
    if (txt.indexOf("10 fonctions js") !== -1) return false;
    if (txt.indexOf("ressources") !== -1) return false;
    return true;
  }

  /* ---------- Générateur d'indices progressifs adaptés par série/sujet ---------- */
  function obtenirIndicesPourSerie(matiere, titre, desc) {
    var m = normaliserMatiere(matiere);
    var t = (String(titre || "") + " " + String(desc || "")).toLowerCase();

    if (m === "css3") {
      if (t.indexOf("flex") !== -1 || t.indexOf("float") !== -1 || t.indexOf("explore") !== -1 || t.indexOf("tp 2") !== -1 || t.indexOf("tp 3") !== -1) {
        return {
          indice1: "Identifiez d'abord les grands blocs HTML5 (<header>, <nav>, <main>/<section>, <aside>, <footer>) et ajoutez * { box-sizing: border-box; } en tête du CSS.",
          indice2: "Pour aligner côte à côte : soit Flexbox sur le parent (display: flex; justify-content: space-between;), soit float: left sur les enfants suivi de clear: both sur le footer !"
        };
      }
      if (t.indexOf("shadow") !== -1 || t.indexOf("transition") !== -1 || t.indexOf("fleurs") !== -1) {
        return {
          indice1: "Vérifiez la syntaxe des ombres : box-shadow: décalageX décalageY flou couleur; et placez transition sur l'état normal (pas uniquement dans :hover).",
          indice2: "Dans les formulaires HTML5, reliez chaque <label for='id'> à son <input id='id'> et vérifiez les attributs required, pattern et placeholder."
        };
      }
      return {
        indice1: "Commencez par toute la structure sémantique HTML5 sans style, puis reliez votre feuille externe avec <link rel='stylesheet' href='style.css'> dans <head>.",
        indice2: "Utilisez l'outil « 🦴 Rayons X CSS » (Alt+X) dans la Roue pour visualiser les marges, bordures et dimensions de vos boîtes !"
      };
    }

    if (m === "javascript") {
      if (t.indexOf("string") !== -1 || t.indexOf("série 5") !== -1 || t.indexOf("série 3") !== -1) {
        return {
          indice1: "Rappel indices String : le 1er caractère est à l'indice 0 et le dernier à ch.length - 1. Attention : ch.substring(d, f) exclut l'indice f !",
          indice2: "Pour parcourir et tester une chaîne caractère par caractère (ex. estAlphabetique), utilisez une boucle while ou for avec ch.charAt(i) et ch.indexOf(...)."
        };
      }
      if (t.indexOf("dom") !== -1 || t.indexOf("série 2") !== -1 || t.indexOf("carte") !== -1) {
        return {
          indice1: "Pour lire un champ de formulaire : document.getElementById('id').value ; pour modifier le contenu HTML d'un bloc : element.innerHTML = ...",
          indice2: "Vérifiez la casse exacte des événements (onclick, oninput, onchange, onblur) et n'oubliez pas onsubmit='return verif()' sur <form>."
        };
      }
      return {
        indice1: "Tracez les variables ligne par ligne sur brouillon : attention à % (reste de division entière), && (ET), || (OU) et à la différence entre x++ et ++x.",
        indice2: "Testez toujours les cas limites : chaîne vide \"\", valeur non numérique avec isNaN(x), liste déroulante selectedIndex == 0 et boutons radio getElementsByName()."
      };
    }

    if (m === "sql") {
      if (t.indexOf("ldd") !== -1 || t.indexOf("série 1") !== -1) {
        return {
          indice1: "Créez toujours les tables MÈRES (sans clé étrangère) AVANT les tables FILLES qui les référencent avec FOREIGN KEY (...) REFERENCES ... !",
          indice2: "Pour modifier une table existante : ALTER TABLE nom ADD col TYPE, MODIFY col TYPE, DROP COLUMN col, ou ADD CONSTRAINT ... FOREIGN KEY ..."
        };
      }
      if (t.indexOf("group by") !== -1 || t.indexOf("série 3") !== -1 || t.indexOf("série 4") !== -1 || t.indexOf("série 5") !== -1 || t.indexOf("série 6") !== -1 || t.indexOf("gestlocation") !== -1) {
        return {
          indice1: "Respectez l'ordre strict : SELECT ... FROM ... WHERE (filtre lignes + conditions de jointure) GROUP BY ... HAVING (filtre sur COUNT/SUM/AVG) ORDER BY ...",
          indice2: "Toute colonne présente dans SELECT hors fonction d'agrégation (COUNT, SUM, AVG, MIN, MAX) doit figurer dans GROUP BY. Pour les dates : YEAR(d), CURDATE(), DATEDIFF(d2, d1)."
        };
      }
      return {
        indice1: "Repérez les tables nécessaires dans le schéma relationnel : s'il y a N tables dans FROM, prévoyez au moins (N - 1) conditions d'égalité clé primaire = clé étrangère dans WHERE.",
        indice2: "Pour exprimer « jamais / aucun » (ex. client n'ayant jamais loué), privilégiez une sous-requête avec WHERE cle NOT IN (SELECT cle FROM ...)."
      };
    }

    /* PHP & MySQLi */
    if (t.indexOf("mysqli") !== -1 || t.indexOf("série 4") !== -1 || t.indexOf("série 5") !== -1 || t.indexOf("sondage") !== -1 || t.indexOf("bac") !== -1) {
      return {
        indice1: "Suivez les 4 étapes MySQLi procédurales : 1) $con = mysqli_connect('localhost','root','','bd'); 2) récupérer $_POST[...]; 3) $res = mysqli_query($con, $req); 4) tester le résultat.",
        indice2: "Piège classique Bac : utilisez mysqli_num_rows($res) uniquement après SELECT, et mysqli_affected_rows($con) après INSERT / UPDATE / DELETE ! Terminez par mysqli_close($con)."
      };
    }
    return {
      indice1: "En PHP, chaque variable commence par $, chaque instruction se termine par ; et la concaténation de chaînes utilise le point (.) et non le signe + !",
      indice2: "Révisez les fonctions phares : isset($_POST['x']), strlen($ch), substr($ch, deb, long), strpos($ch, rech), strtoupper($ch) et date('Y-m-d')."
    };
  }

  /* ---------- Styles globaux injectés par exercices-atelier.js ---------- */
  function injecterStylesAtelier() {
    if (document.getElementById("sti-exo-atelier-css")) return;
    var st = document.createElement("style");
    st.id = "sti-exo-atelier-css";
    st.textContent =
      "/* Chantier des Exercices v450 */" +
      "#sti-exo-dashboard{background:var(--surface,#fffdf5);border:2.5px solid var(--m2-edge,#18202c);border-radius:20px;padding:18px 20px;margin:18px 0 28px;box-shadow:5px 5px 0 var(--m2-edge,#18202c);font-family:" + FONT_COMIC + "}" +
      ".sti-ed-head{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:14px}" +
      ".sti-ed-title{display:flex;align-items:center;gap:11px}" +
      ".sti-ed-title img{width:42px;height:42px;border-radius:12px;border:2px solid var(--m2-edge,#18202c);background:#fff}" +
      ".sti-ed-title h2{margin:0;font-size:1.22rem;font-family:" + FONT_COMIC + ";color:var(--ink,#18202c)}" +
      ".sti-ed-title p{margin:2px 0 0;font-size:0.83rem;color:var(--muted,#5f5747)}" +
      ".sti-ed-cta-group{display:flex;gap:8px;flex-wrap:wrap;align-items:center}" +
      ".sti-ed-cta{font-family:" + FONT_COMIC + ";font-weight:700;font-size:0.83rem;padding:8px 14px;border-radius:999px;border:2px solid var(--m2-edge,#18202c);background:#e84e1b;color:#fff;text-decoration:none;cursor:pointer;display:inline-flex;align-items:center;gap:6px;box-shadow:2.5px 2.5px 0 var(--m2-edge,#18202c)}" +
      ".sti-ed-cta.sec{background:var(--surface-2,#f1e6d0);color:var(--ink,#18202c)}" +
      ".sti-ed-cta.vert{background:#15803d;color:#fff}" +
      ".sti-ed-jauges{display:grid;grid-template-columns:repeat(auto-fit,minmax(195px,1fr));gap:10px;margin-bottom:14px}" +
      ".sti-ed-jauge{padding:10px 13px;border-radius:14px;border:2px solid var(--m2-edge,#18202c);background:var(--surface-2,#f1e6d0);cursor:pointer;text-align:left;font-family:" + FONT_COMIC + ";transition:transform .12s ease}" +
      ".sti-ed-jauge:hover{transform:translateY(-2px)}" +
      ".sti-ed-jauge-top{display:flex;justify-content:space-between;align-items:center;font-size:0.84rem;font-weight:700;margin-bottom:6px;color:var(--ink,#18202c)}" +
      ".sti-ed-bar{height:8px;border-radius:999px;background:rgba(0,0,0,0.12);overflow:hidden;border:1px solid rgba(0,0,0,0.2)}" +
      ".sti-ed-bar > i{display:block;height:100%;border-radius:999px;transition:width .25s ease}" +
      ".sti-ed-filtres{display:flex;gap:9px;flex-wrap:wrap;align-items:center}" +
      ".sti-ed-search{flex:1 1 240px;min-width:200px;padding:8px 13px;border-radius:999px;border:2px solid var(--m2-edge,#18202c);background:var(--bg,#f6eedc);color:var(--ink,#18202c);font-family:" + FONT_COMIC + ";font-size:0.86rem}" +
      ".sti-ed-sel{padding:7px 12px;border-radius:999px;border:2px solid var(--m2-edge,#18202c);background:var(--bg,#f6eedc);color:var(--ink,#18202c);font-family:" + FONT_COMIC + ";font-size:0.82rem;font-weight:700;cursor:pointer}" +
      ".sti-ed-lock-banner{display:none;margin-bottom:12px;padding:10px 14px;border-radius:13px;border:2px solid #b91c1c;background:#fee2e2;color:#7f1d1d;font-size:0.84rem;font-weight:700;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}" +
      "html.dark .sti-ed-lock-banner{background:rgba(185,28,28,0.25);color:#fecaca}" +
      ".sti-ed-lock-banner.visible{display:flex}" +
      /* Barre de suivi sur chaque exo-card */
      ".sti-card-suivi-bar{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:8px;flex-wrap:wrap;font-family:" + FONT_COMIC + "}" +
      ".sti-btn-statut{font-family:" + FONT_COMIC + ";font-size:11.5px;font-weight:700;padding:3px 10px;border-radius:999px;border:1.6px solid var(--m2-edge,#18202c);background:var(--surface-2,#f1e6d0);color:var(--ink,#18202c);cursor:pointer;display:inline-flex;align-items:center;gap:4px}" +
      ".sti-btn-statut[data-st='doing']{background:#fef3c7;color:#92400e;border-color:#d97706}" +
      ".sti-btn-statut[data-st='done']{background:#dcfce7;color:#166534;border-color:#15803d}" +
      ".sti-btn-etoile{border:1.6px solid var(--m2-edge,#18202c);background:transparent;border-radius:999px;padding:2px 8px;font-size:12px;cursor:pointer;color:var(--muted,#6b6250)}" +
      ".sti-btn-etoile.on{background:#fef08a;color:#854d0e;border-color:#ca8a04;font-weight:700}" +
      ".sti-pill-note20{font-size:11px;font-weight:800;padding:2px 9px;border-radius:999px;background:#dcfce7;color:#166534;border:1.5px solid #15803d}" +
      ".exo-card.sti-exo-done{border-color:#15803d !important}" +
      ".exo-card .sti-btn-indice-card{background:#fef3c7 !important;color:#78350f !important;border:1.8px solid #d97706 !important;font-weight:700 !important;padding:6px 11px;border-radius:9px;cursor:pointer;font-size:0.84rem}" +
      ".exo-card .corrige.sti-corrige-verrouille{background:#fee2e2 !important;color:#991b1b !important;border-color:#dc2626 !important;opacity:0.92}" +
      /* Modale d'indice progressif & verrouillage TP */
      "#sti-modal-indice-corrige{position:fixed;inset:0;z-index:2147483500;background:rgba(15,23,38,0.72);backdrop-filter:blur(5px);display:none;align-items:center;justify-content:center;padding:16px;font-family:" + FONT_COMIC + "}" +
      "#sti-modal-indice-corrige.open{display:flex}" +
      ".sti-mic-box{max-width:560px;width:100%;background:var(--surface,#fffdf6);color:var(--ink,#18202c);border:3px solid #18202c;border-radius:22px;padding:22px 22px 18px;box-shadow:7px 7px 0 #e84e1b}" +
      ".sti-mic-step{padding:11px 14px;border-radius:13px;border:2px solid #d97706;background:#fef3c7;color:#451a03;font-size:0.9rem;line-height:1.48;margin:10px 0}" +
      ".sti-mic-step.step2{background:#e0f2fe;border-color:#0284c7;color:#0c4a6e}" +
      ".sti-mic-actions{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin-top:14px}" +
      ".sti-mic-btn{font-family:" + FONT_COMIC + ";font-weight:700;font-size:0.85rem;padding:8px 14px;border-radius:999px;border:2px solid #18202c;cursor:pointer;background:#f1e6d0;color:#18202c}" +
      ".sti-mic-btn.prim{background:#15803d;color:#fff}" +
      ".sti-mic-btn.warn{background:#e84e1b;color:#fff}" +
      /* Feuilles TP interactives (Tp*.html) */
      "#sti-tp-toolbar{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:10px 14px;margin:0 0 16px;border-radius:14px;border:2.5px solid #18202c;background:#fff8eb;color:#18202c;box-shadow:3.5px 3.5px 0 #18202c;font-family:" + FONT_COMIC + "}" +
      "#sti-tp-toolbar .sti-tpt-btn{font-family:" + FONT_COMIC + ";font-size:12px;font-weight:700;padding:6px 11px;border-radius:999px;border:1.8px solid #18202c;background:#fff;color:#18202c;cursor:pointer}" +
      "#sti-tp-toolbar .sti-tpt-btn.ok{background:#15803d;color:#fff}" +
      "#sti-tp-toolbar .sti-tpt-btn.ind{background:#fef3c7;color:#78350f}" +
      ".sti-tp-input{width:100%;min-width:110px;padding:5px 8px;border:2px solid #94a3b8;border-radius:7px;font-family:Consolas,monospace;font-size:0.92em;background:#fffef7;color:#18202c}" +
      ".sti-tp-input.ok{border-color:#15803d !important;background:#dcfce7 !important;color:#14532d !important;font-weight:700}" +
      ".sti-tp-input.err{border-color:#dc2626 !important;background:#fee2e2 !important;color:#7f1d1d !important}" +
      ".sti-tp-zone-q{margin:7px 0 11px;display:block}" +
      ".sti-tp-textarea{width:100%;min-height:56px;padding:8px 10px;border:1.8px dashed #64748b;border-radius:9px;font-family:Consolas,monospace;font-size:0.88em;background:#f8fafc;color:#0f172a;resize:vertical}" +
      "body.sti-tp-sans-saisie .sti-tp-zone-q{display:none !important}" +
      /* Mode sombre propre sur les feuilles TP sans casser l'impression */
      "@media screen{html.dark body.sti-feuille-tp{background:#121820 !important;color:#f1f5f9 !important}" +
      "html.dark body.sti-feuille-tp .header-table td,html.dark body.sti-feuille-tp table.data-table th,html.dark body.sti-feuille-tp table.data-table td{border-color:#334155 !important;color:#f1f5f9 !important}" +
      "html.dark body.sti-feuille-tp table.data-table tr:nth-child(even),html.dark body.sti-feuille-tp .code-box,html.dark body.sti-feuille-tp .form-box,html.dark body.sti-feuille-tp .nb-note{background:#1e293b !important;color:#f1f5f9 !important;border-color:#475569 !important}" +
      "html.dark body.sti-feuille-tp h1,html.dark body.sti-feuille-tp .header-title{color:#fde68a !important}" +
      "html.dark body.sti-feuille-tp h2{background:#1e293b !important;color:#7dd3fc !important}" +
      "html.dark body.sti-feuille-tp code{background:#0f172a !important;color:#fda4af !important}" +
      "html.dark body.sti-feuille-tp #sti-tp-toolbar{background:#1e293b;color:#f8fafc;border-color:#475569}" +
      "html.dark body.sti-feuille-tp .sti-tp-input,html.dark body.sti-feuille-tp .sti-tp-textarea{background:#0f172a;color:#f8fafc;border-color:#475569}}" +
      "@media print{#sti-tp-toolbar,#sti-modal-indice-corrige,#sti-overlay-corrige-tp-lock,.sti-tp-zone-q.vide{display:none !important}}";
    (document.head || document.documentElement).appendChild(st);
  }

  /* ---------- Fenêtre modale d'Indice Progressif & Verrouillage Séance TP ---------- */
  function ouvrirModaleIndiceOuVerrou(opts) {
    injecterStylesAtelier();
    var matiere = normaliserMatiere(opts.matiere);
    var titre = opts.titre || "Série d'exercices";
    var desc = opts.desc || "";
    var cleSerie = opts.exoId || titre;
    var onOuvrirCorrige = opts.onOuvrirCorrige;
    var modeIndiceSeul = Boolean(opts.indiceSeul);

    var verrou = estCorrigeVerrouille(matiere);
    var indOk = sontIndicesAutorises();
    var indices = obtenirIndicesPourSerie(matiere, titre, desc);
    var cv = lireConfigVerrouCorriges();

    var mod = document.getElementById("sti-modal-indice-corrige");
    if (!mod) {
      mod = document.createElement("div");
      mod.id = "sti-modal-indice-corrige";
      mod.setAttribute("role", "dialog");
      mod.setAttribute("aria-modal", "true");
      mod.addEventListener("click", function (e) {
        if (e.target === mod) mod.classList.remove("open");
      });
      document.body.appendChild(mod);
    }

    if (verrou && !modeIndiceSeul) {
      mod.innerHTML =
        '<div class="sti-mic-box">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px">' +
            '<strong style="font-size:1.1rem">🔒 Corrigé temporairement masqué (Séance TP)</strong>' +
            '<button type="button" class="sti-mic-btn" data-fermer="1">✕</button>' +
          '</div>' +
          '<p style="margin:0 0 10px;font-size:0.9rem;line-height:1.45">' +
            echap(cv.motif || "M. Essouyah a temporairement masqué les corrigés de cette matière pendant la séance de Travaux Pratiques afin que chacun construise sa propre solution.") +
          '</p>' +
          '<div style="font-size:0.82rem;font-weight:700;color:#b91c1c;margin-bottom:8px">📌 Matière concernée : ' + echap(libelleMatiere(matiere)) + '</div>' +
          (indOk
            ? ('<div class="sti-mic-step">💡 <strong>Coup de pouce méthodologique autorisé :</strong><br>' + echap(indices.indice1) + '</div>' +
               '<div class="sti-mic-step step2" id="sti-mic-s2" style="display:none">🔑 <strong>Indice 2 (Vigilance Bac) :</strong><br>' + echap(indices.indice2) + '</div>')
            : '') +
          '<div class="sti-mic-actions">' +
            (indOk ? '<button type="button" class="sti-mic-btn" id="sti-mic-btn-s2">🔑 Voir un 2e indice</button>' : '') +
            '<button type="button" class="sti-mic-btn warn" data-fermer="1">✍️ Retourner chercher</button>' +
          '</div>' +
        '</div>';
    } else {
      mod.innerHTML =
        '<div class="sti-mic-box">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px">' +
            '<strong style="font-size:1.08rem">💡 ' + (modeIndiceSeul ? 'Indice méthodologique' : 'Coup de pouce avant d\'ouvrir le corrigé') + '</strong>' +
            '<button type="button" class="sti-mic-btn" data-fermer="1">✕</button>' +
          '</div>' +
          '<div style="font-size:0.83rem;color:var(--muted,#5f5747);margin-bottom:8px">📘 <strong>' + echap(titre) + '</strong> · ' + echap(libelleMatiere(matiere)) + '</div>' +
          (indOk
            ? ('<div class="sti-mic-step">💡 <strong>Indice 1 — Méthode :</strong><br>' + echap(indices.indice1) + '</div>' +
               '<div class="sti-mic-step step2" id="sti-mic-s2" style="display:none">🔑 <strong>Indice 2 — Syntaxe &amp; Pièges du Bac :</strong><br>' + echap(indices.indice2) + '</div>')
            : '<div class="sti-mic-step">🔒 Les indices sont masqués pendant cette séance.</div>') +
          '<div class="sti-mic-actions">' +
            (indOk ? '<button type="button" class="sti-mic-btn" id="sti-mic-btn-s2">🔑 Indice n°2</button>' : '') +
            '<button type="button" class="sti-mic-btn" data-fermer="1">✍️ Je continue à chercher</button>' +
            (!modeIndiceSeul && !verrou && typeof onOuvrirCorrige === "function"
              ? '<button type="button" class="sti-mic-btn prim" id="sti-mic-ouvrir-sol">🔓 J\'ai essayé — Voir le corrigé</button>'
              : '') +
          '</div>' +
        '</div>';
    }

    mod.querySelectorAll("[data-fermer]").forEach(function (b) {
      b.addEventListener("click", function () { mod.classList.remove("open"); });
    });
    var bS2 = mod.querySelector("#sti-mic-btn-s2");
    var divS2 = mod.querySelector("#sti-mic-s2");
    if (bS2 && divS2) {
      bS2.addEventListener("click", function () {
        divS2.style.display = "block";
        bS2.style.display = "none";
      });
    }
    var bSol = mod.querySelector("#sti-mic-ouvrir-sol");
    if (bSol && typeof onOuvrirCorrige === "function") {
      bSol.addEventListener("click", function () {
        var vus = lireJson(CLE_INDICES_SESSION, {}, true);
        vus[cleSerie] = Date.now();
        ecrireJson(CLE_INDICES_SESSION, vus, true);
        mod.classList.remove("open");
        onOuvrirCorrige();
      });
    }
    mod.classList.add("open");
  }

  /* ---------- Surcouche de protection directe sur les pages *-Correction-*.html ---------- */
  function appliquerProtectionPageCorrigeDirecte() {
    if (!estPageCorrigeDirecte(location.pathname)) return;
    var mat = detecterMatiereDepuisUrl(location.pathname);
    var ov = document.getElementById("sti-overlay-corrige-tp-lock");
    if (!estCorrigeVerrouille(mat)) {
      if (ov) ov.remove();
      return;
    }
    if (!ov) {
      var cv = lireConfigVerrouCorriges();
      ov = document.createElement("div");
      ov.id = "sti-overlay-corrige-tp-lock";
      ov.style.cssText = "position:fixed;inset:0;z-index:2147483640;background:rgba(15,23,38,0.96);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:20px;font-family:" + FONT_COMIC + ";";
      ov.innerHTML =
        '<div style="max-width:480px;width:100%;background:#fffdf6;color:#18202c;border:3px solid #18202c;border-radius:22px;padding:26px 24px;text-align:center;box-shadow:7px 7px 0 #e84e1b">' +
          '<div style="font-size:42px;margin-bottom:8px">🔒</div>' +
          '<h2 style="margin:0 0 8px;font-size:1.25rem">Corrigé verrouillé pendant la séance TP</h2>' +
          '<p style="margin:0 0 14px;font-size:0.92rem;line-height:1.5;color:#57534e">' +
            echap(cv.motif || "Votre professeur a temporairement désactivé l'affichage direct des corrigés pour cette matière. Travaillez d'abord sur l'énoncé !") +
          '</p>' +
          '<a href="../series-exercices.html" style="display:inline-flex;align-items:center;gap:6px;padding:9px 18px;border-radius:999px;border:2px solid #18202c;background:#e84e1b;color:#fff;font-weight:700;text-decoration:none;box-shadow:2.5px 2.5px 0 #18202c">← Retourner aux énoncés</a>' +
        '</div>';
      (document.body || document.documentElement).appendChild(ov);
    }
  }

  /* ============================================================================
     1. PORTAIL DES EXERCICES : exercices/series-exercices.html
     ============================================================================ */
  var exoIdCourantModal = "";
  var exoMetaMap = {};

  function calculerExoIdPourCarte(card, secId, index) {
    var btnIa = card.querySelector("[data-ia-serie]");
    if (btnIa) return btnIa.getAttribute("data-ia-serie");
    var btnEn = card.querySelector(".exo-actions button.enonce, .exo-actions a.enonce");
    if (btnEn) {
      var onc = btnEn.getAttribute("onclick") || btnEn.getAttribute("href") || "";
      var m = onc.match(/['"]([^'"]+\.(?:html|pdf))[^'"]*['"]/i);
      if (m && m[1]) {
        return "exo:" + m[1].replace(/^(\.\.\/)+exercices\//, "").replace(/[^a-z0-9\/_\-.]/gi, "").toLowerCase();
      }
    }
    var h3 = card.querySelector("h3");
    var slug = String((h3 && h3.textContent) || ("exo-" + index)).toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 42);
    return "exo:" + secId + ":" + slug;
  }

  function detecterNiveauNormalise(txtNiveau) {
    var t = String(txtNiveau || "").toLowerCase();
    if (t.indexOf("débutant") !== -1 || t.indexOf("debutant") !== -1) return "debutant";
    if (t.indexOf("intermédiaire") !== -1 || t.indexOf("intermediaire") !== -1 || t.indexOf("tous niveaux") !== -1) return "intermediaire";
    return "avance";
  }

  function initialiserPortailSeriesExercices() {
    var secCss = document.getElementById("css3");
    if (!secCss || document.getElementById("sti-exo-dashboard")) return;
    injecterStylesAtelier();

    /* 1. Créer le Tableau de Bord d'Avancement & Filtres au-dessus de #css3 */
    var dash = document.createElement("section");
    dash.id = "sti-exo-dashboard";
    dash.setAttribute("aria-label", "Tableau de bord et filtres des exercices");
    dash.innerHTML =
      '<div class="sti-ed-lock-banner" id="sti-ed-lock-banner" role="status"></div>' +
      '<div class="sti-ed-head">' +
        '<div class="sti-ed-title">' +
          '<img src="../assets/icons/sti-icon-512.png" alt="Logo STI V2.0" />' +
          '<div>' +
            '<h2 id="sti-ed-kpi-titre">📊 Mon Atelier d\'Exercices STI</h2>' +
            '<p id="sti-ed-kpi-sub">Suivez vos séries validées, débloquez les indices progressifs et entraînez-vous sur /20.</p>' +
          '</div>' +
        '</div>' +
        '<div class="sti-ed-cta-group">' +
          '<a class="sti-ed-cta vert" href="atelier-interactif-bac.html">🧪 Atelier Auto-Corrigé (/20)</a>' +
          '<button type="button" class="sti-ed-cta sec" id="sti-ed-btn-random" title="Choisir une série à travailler au hasard">🎲 Série au hasard</button>' +
          (estAdminActif() ? '<a class="sti-ed-cta" href="../admin.html#corriges-tp" title="Ouvrir le contrôle en direct des corrigés TP dans le tableau de bord Professeur">🛡️ Verrou Corrigés TP (Prof)</a>' : '') +
        '</div>' +
      '</div>' +
      '<div class="sti-ed-jauges" id="sti-ed-jauges">' +
        '<button type="button" class="sti-ed-jauge" data-jump="#css3">' +
          '<div class="sti-ed-jauge-top"><span>🎨 HTML5 &amp; CSS3</span><span id="sti-jtxt-css3">0/0</span></div>' +
          '<div class="sti-ed-bar"><i id="sti-jbar-css3" style="width:0%;background:#e84e1b"></i></div>' +
        '</button>' +
        '<button type="button" class="sti-ed-jauge" data-jump="#javascript">' +
          '<div class="sti-ed-jauge-top"><span>⚡ JavaScript</span><span id="sti-jtxt-javascript">0/0</span></div>' +
          '<div class="sti-ed-bar"><i id="sti-jbar-javascript" style="width:0%;background:#c98a00"></i></div>' +
        '</button>' +
        '<button type="button" class="sti-ed-jauge" data-jump="#bdd">' +
          '<div class="sti-ed-jauge-top"><span>🗄️ Base de données</span><span id="sti-jtxt-sql">0/0</span></div>' +
          '<div class="sti-ed-bar"><i id="sti-jbar-sql" style="width:0%;background:#0e7c86"></i></div>' +
        '</button>' +
        '<button type="button" class="sti-ed-jauge sti-4si-only" data-jump="#php">' +
          '<div class="sti-ed-jauge-top"><span>🐘 PHP &amp; MySQLi</span><span id="sti-jtxt-php">0/0</span></div>' +
          '<div class="sti-ed-bar"><i id="sti-jbar-php" style="width:0%;background:#15803d"></i></div>' +
        '</button>' +
      '</div>' +
      '<div class="sti-ed-filtres">' +
        '<input type="search" class="sti-ed-search" id="sti-ed-search" placeholder="🔎 Rechercher une série ou notion (flexbox, string, group by, mysqli, formulaire…)" aria-label="Rechercher un exercice" />' +
        '<select class="sti-ed-sel" id="sti-ed-filtre-niveau" aria-label="Filtrer par niveau">' +
          '<option value="all">🎯 Tous les niveaux</option>' +
          '<option value="debutant">🟢 Débutant</option>' +
          '<option value="intermediaire">🟡 Intermédiaire</option>' +
          '<option value="avance">🔴 Avancé &amp; Type Bac</option>' +
        '</select>' +
        '<select class="sti-ed-sel" id="sti-ed-filtre-statut" aria-label="Filtrer par avancement">' +
          '<option value="all">📋 Tous les états</option>' +
          '<option value="todo">⬜ À faire</option>' +
          '<option value="doing">⏳ En cours</option>' +
          '<option value="done">✅ Terminés</option>' +
          '<option value="star">⭐ À revoir</option>' +
        '</select>' +
      '</div>';

    secCss.parentNode.insertBefore(dash, secCss);

    dash.querySelectorAll("[data-jump]").forEach(function (b) {
      b.addEventListener("click", function () {
        var cible = document.querySelector(b.getAttribute("data-jump"));
        if (cible) cible.scrollIntoView({ behavior: "smooth" });
      });
    });

    /* 2. Équiper toutes les cartes .exo-card des 4 sections */
    var sections = [
      { id: "css3", mat: "css3" },
      { id: "javascript", mat: "javascript" },
      { id: "bdd", mat: "sql" },
      { id: "php", mat: "php" }
    ];

    sections.forEach(function (secInfo) {
      var secEl = document.getElementById(secInfo.id);
      if (!secEl) return;
      var cartes = secEl.querySelectorAll(".exo-card");
      cartes.forEach(function (card, idx) {
        var exoId = calculerExoIdPourCarte(card, secInfo.id, idx);
        var h3 = card.querySelector("h3");
        var pDesc = card.querySelector("p, .exo-desc");
        var nivEl = card.querySelector(".exo-level");
        var titreTxt = ((h3 && h3.textContent) || "Série").replace(/\s+/g, " ").trim();
        var descTxt = ((pDesc && pDesc.textContent) || "").replace(/\s+/g, " ").trim();
        var nivNorm = detecterNiveauNormalise(nivEl ? nivEl.textContent : "");

        card.setAttribute("data-exo-id", exoId);
        card.setAttribute("data-exo-mat", secInfo.mat);
        card.setAttribute("data-exo-niv", nivNorm);
        exoMetaMap[exoId] = { id: exoId, matiere: secInfo.mat, titre: titreTxt, desc: descTxt, card: card };

        /* Barre de statut en haut de la carte */
        var bar = document.createElement("div");
        bar.className = "sti-card-suivi-bar";
        bar.innerHTML =
          '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">' +
            '<button type="button" class="sti-btn-statut" data-role="statut" title="Cliquer pour changer l\'état : À faire → En cours → Terminé">⬜ À faire</button>' +
            '<span class="sti-pill-note20" data-role="note20" style="display:none"></span>' +
          '</div>' +
          '<button type="button" class="sti-btn-etoile" data-role="etoile" title="Marquer cette série « À revoir avant le devoir »">☆ À revoir</button>';
        card.insertBefore(bar, card.firstChild);

        bar.querySelector('[data-role="statut"]').addEventListener("click", function () {
          var suivi = lireJson(CLE_SUIVI, {});
          var cur = (suivi[exoId] && suivi[exoId].statut) || "todo";
          var suiv = cur === "todo" ? "doing" : (cur === "doing" ? "done" : "todo");
          suivi[exoId] = Object.assign({}, suivi[exoId] || {}, { statut: suiv, maj: Date.now() });
          ecrireJson(CLE_SUIVI, suivi);
          rafraichirSuiviPortail();
        });

        bar.querySelector('[data-role="etoile"]').addEventListener("click", function () {
          var suivi = lireJson(CLE_SUIVI, {});
          var anc = suivi[exoId] || { statut: "todo" };
          suivi[exoId] = Object.assign({}, anc, { etoile: !anc.etoile, maj: Date.now() });
          ecrireJson(CLE_SUIVI, suivi);
          rafraichirSuiviPortail();
        });

        /* Quand l'élève ouvre un énoncé : passe automatiquement de 'todo' à 'doing' */
        card.querySelectorAll(".exo-actions .enonce").forEach(function (btnEn) {
          btnEn.addEventListener("click", function () {
            exoIdCourantModal = exoId;
            var suivi = lireJson(CLE_SUIVI, {});
            if (!suivi[exoId] || !suivi[exoId].statut || suivi[exoId].statut === "todo") {
              suivi[exoId] = Object.assign({}, suivi[exoId] || {}, { statut: "doing", maj: Date.now() });
              ecrireJson(CLE_SUIVI, suivi);
              rafraichirSuiviPortail();
            }
          });
        });

        /* Interception des boutons .corrige (Indices progressifs + Verrouillage Admin TP) */
        var actionsDiv = card.querySelector(".exo-actions");
        var aUnCorrigeVerrouillable = false;

        card.querySelectorAll(".exo-actions .corrige").forEach(function (btnCor) {
          var onc = btnCor.getAttribute("onclick") || "";
          var href = btnCor.getAttribute("href") || "";
          var cibleRef = onc || href;
          if (!estLienCorrigeVerrouillable(btnCor, cibleRef)) return;
          aUnCorrigeVerrouillable = true;
          btnCor.setAttribute("data-sti-corrige-protege", "1");

          if (onc) {
            btnCor.removeAttribute("onclick");
            btnCor.addEventListener("click", function (ev) {
              ev.preventDefault();
              ev.stopPropagation();
              exoIdCourantModal = exoId;
              var executerOuverture = function () {
                try { (new Function(onc)).call(btnCor); } catch (eEx) {}
              };
              var vus = lireJson(CLE_INDICES_SESSION, {}, true);
              if (estCorrigeVerrouille(secInfo.mat) || !vus[exoId]) {
                ouvrirModaleIndiceOuVerrou({
                  exoId: exoId,
                  matiere: secInfo.mat,
                  titre: titreTxt,
                  desc: descTxt,
                  onOuvrirCorrige: executerOuverture
                });
              } else {
                executerOuverture();
              }
            });
          } else if (href) {
            btnCor.addEventListener("click", function (ev) {
              var vus = lireJson(CLE_INDICES_SESSION, {}, true);
              if (estCorrigeVerrouille(secInfo.mat) || !vus[exoId]) {
                ev.preventDefault();
                ev.stopPropagation();
                ouvrirModaleIndiceOuVerrou({
                  exoId: exoId,
                  matiere: secInfo.mat,
                  titre: titreTxt,
                  desc: descTxt,
                  onOuvrirCorrige: function () {
                    window.location.href = href;
                  }
                });
              }
            });
          }
        });

        /* Ajouter un bouton 💡 Indice direct sur la carte si elle possède un corrigé */
        if (actionsDiv && aUnCorrigeVerrouillable) {
          actionsDiv.style.flexWrap = "wrap";
          var btnInd = document.createElement("button");
          btnInd.type = "button";
          btnInd.className = "sti-btn-indice-card";
          btnInd.textContent = "💡 Indice";
          btnInd.title = "Obtenir un indice méthodologique sans dévoiler la solution";
          btnInd.addEventListener("click", function () {
            ouvrirModaleIndiceOuVerrou({
              exoId: exoId,
              matiere: secInfo.mat,
              titre: titreTxt,
              desc: descTxt,
              indiceSeul: true
            });
          });
          actionsDiv.appendChild(btnInd);
        }
      });
    });

    /* 3. Enrichir l'en-tête de #pdfModal (💡 Indice + ✅ Terminé) */
    var modalActions = document.querySelector("#pdfModal .modal-header-actions");
    if (modalActions && !document.getElementById("modalIndiceBtnSTI")) {
      var bIndMod = document.createElement("button");
      bIndMod.type = "button";
      bIndMod.className = "modal-expand";
      bIndMod.id = "modalIndiceBtnSTI";
      bIndMod.style.cssText = "width:auto;padding:0 10px;font-size:12px;font-weight:800;background:#fef3c7;color:#78350f;border:1.5px solid #d97706";
      bIndMod.textContent = "💡 Indice";
      bIndMod.addEventListener("click", function () {
        var meta = exoMetaMap[exoIdCourantModal] || {
          exoId: exoIdCourantModal || "modal",
          matiere: detecterMatiereDepuisUrl(window.modalUrl || ""),
          titre: (document.getElementById("modalTitle") && document.getElementById("modalTitle").textContent) || "Série en cours",
          desc: ""
        };
        ouvrirModaleIndiceOuVerrou({
          exoId: meta.id || "modal",
          matiere: meta.matiere,
          titre: meta.titre,
          desc: meta.desc,
          indiceSeul: true
        });
      });

      var bDoneMod = document.createElement("button");
      bDoneMod.type = "button";
      bDoneMod.className = "modal-expand";
      bDoneMod.id = "modalDoneBtnSTI";
      bDoneMod.style.cssText = "width:auto;padding:0 10px;font-size:12px;font-weight:800;background:#dcfce7;color:#166534;border:1.5px solid #15803d";
      bDoneMod.textContent = "✅ Terminé";
      bDoneMod.addEventListener("click", function () {
        if (!exoIdCourantModal) return;
        var suivi = lireJson(CLE_SUIVI, {});
        var etait = suivi[exoIdCourantModal] && suivi[exoIdCourantModal].statut === "done";
        suivi[exoIdCourantModal] = Object.assign({}, suivi[exoIdCourantModal] || {}, {
          statut: etait ? "doing" : "done",
          maj: Date.now()
        });
        ecrireJson(CLE_SUIVI, suivi);
        rafraichirSuiviPortail();
        bDoneMod.textContent = etait ? "✅ Terminé" : "🎉 Validé !";
        setTimeout(function () { bDoneMod.textContent = "✅ Terminé"; }, 1400);
      });

      modalActions.insertBefore(bDoneMod, modalActions.firstChild);
      modalActions.insertBefore(bIndMod, modalActions.firstChild);
    }

    /* 4. Événements de recherche, filtres et série aléatoire */
    var inpSearch = document.getElementById("sti-ed-search");
    var selNiv = document.getElementById("sti-ed-filtre-niveau");
    var selSt = document.getElementById("sti-ed-filtre-statut");
    var btnRnd = document.getElementById("sti-ed-btn-random");

    function appliquerFiltresPortail() {
      var q = String((inpSearch && inpSearch.value) || "").trim().toLowerCase();
      var fNiv = (selNiv && selNiv.value) || "all";
      var fSt = (selSt && selSt.value) || "all";
      var suivi = lireJson(CLE_SUIVI, {});
      var ok4 = est4SIAutorise();

      Object.keys(exoMetaMap).forEach(function (id) {
        var m = exoMetaMap[id];
        var card = m.card;
        if (!card) return;
        if (!ok4 && (m.matiere === "php" || card.classList.contains("sti-4si-only"))) {
          return;
        }
        var stObj = suivi[id] || { statut: "todo", etoile: false };
        var st = stObj.statut || "todo";
        var matchQ = !q || (m.titre.toLowerCase().indexOf(q) !== -1 || m.desc.toLowerCase().indexOf(q) !== -1 || m.matiere.indexOf(q) !== -1);
        var matchNiv = fNiv === "all" || card.getAttribute("data-exo-niv") === fNiv;
        var matchSt =
          fSt === "all" ||
          (fSt === "star" ? Boolean(stObj.etoile) : st === fSt);

        card.style.display = (matchQ && matchNiv && matchSt) ? "" : "none";
      });
    }

    if (inpSearch) inpSearch.addEventListener("input", appliquerFiltresPortail);
    if (selNiv) selNiv.addEventListener("change", appliquerFiltresPortail);
    if (selSt) selSt.addEventListener("change", appliquerFiltresPortail);

    if (btnRnd) {
      btnRnd.addEventListener("click", function () {
        var suivi = lireJson(CLE_SUIVI, {});
        var ok4 = est4SIAutorise();
        var candidats = Object.keys(exoMetaMap).filter(function (id) {
          var m = exoMetaMap[id];
          if (!ok4 && (m.matiere === "php" || m.card.classList.contains("sti-4si-only"))) return false;
          var st = (suivi[id] && suivi[id].statut) || "todo";
          return st !== "done";
        });
        if (!candidats.length) candidats = Object.keys(exoMetaMap);
        if (!candidats.length) return;
        var choix = exoMetaMap[candidats[Math.floor(Math.random() * candidats.length)]];
        if (choix && choix.card) {
          choix.card.scrollIntoView({ behavior: "smooth", block: "center" });
          choix.card.style.outline = "4px solid #e84e1b";
          setTimeout(function () { choix.card.style.outline = ""; }, 2200);
        }
      });
    }

    rafraichirSuiviPortail();
  }

  function rafraichirSuiviPortail() {
    var dash = document.getElementById("sti-exo-dashboard");
    if (!dash) return;
    var suivi = lireJson(CLE_SUIVI, {});
    var ok4 = est4SIAutorise();

    var statsMat = {
      css3: { done: 0, total: 0 },
      javascript: { done: 0, total: 0 },
      sql: { done: 0, total: 0 },
      php: { done: 0, total: 0 }
    };
    var totalDone = 0, totalAll = 0, totalDoing = 0, totalStar = 0;

    Object.keys(exoMetaMap).forEach(function (id) {
      var m = exoMetaMap[id];
      var card = m.card;
      if (!card) return;
      var estReserve4 = (m.matiere === "php" || card.classList.contains("sti-4si-only"));
      var stObj = suivi[id] || { statut: "todo", etoile: false };
      var st = stObj.statut || "todo";

      /* Mise à jour visuelle de la carte */
      card.classList.toggle("sti-exo-done", st === "done");
      var btnSt = card.querySelector('[data-role="statut"]');
      if (btnSt) {
        btnSt.setAttribute("data-st", st);
        btnSt.textContent = st === "done" ? "✅ Terminé" : (st === "doing" ? "⏳ En cours" : "⬜ À faire");
      }
      var btnEt = card.querySelector('[data-role="etoile"]');
      if (btnEt) {
        btnEt.classList.toggle("on", Boolean(stObj.etoile));
        btnEt.textContent = stObj.etoile ? "⭐ À revoir" : "☆ À revoir";
      }
      var pillNote = card.querySelector('[data-role="note20"]');
      if (pillNote) {
        if (stObj.note20 !== undefined && stObj.note20 !== null) {
          pillNote.style.display = "inline-block";
          pillNote.textContent = "🏆 " + stObj.note20 + "/20";
        } else {
          pillNote.style.display = "none";
        }
      }

      /* Marquer visuellement les boutons corrigés si la matière est verrouillée en séance TP */
      var verrouEleve = estCorrigeVerrouille(m.matiere);
      card.querySelectorAll('[data-sti-corrige-protege="1"]').forEach(function (bc) {
        bc.classList.toggle("sti-corrige-verrouille", verrouEleve);
        if (!bc.getAttribute("data-orig-label")) {
          bc.setAttribute("data-orig-label", bc.textContent.trim());
        }
        var orig = bc.getAttribute("data-orig-label");
        if (verrouEleve) {
          bc.textContent = "🔒 " + orig.replace(/^🔒\s*/, "");
        } else {
          bc.textContent = orig;
        }
      });

      if (!ok4 && estReserve4) return;
      if (statsMat[m.matiere]) {
        statsMat[m.matiere].total++;
        if (st === "done") statsMat[m.matiere].done++;
      }
      totalAll++;
      if (st === "done") totalDone++;
      if (st === "doing") totalDoing++;
      if (stObj.etoile) totalStar++;
    });

    ["css3", "javascript", "sql", "php"].forEach(function (k) {
      var s = statsMat[k];
      var pct = s.total > 0 ? Math.round((s.done / s.total) * 100) : 0;
      var jt = document.getElementById("sti-jtxt-" + k);
      var jb = document.getElementById("sti-jbar-" + k);
      if (jt) jt.textContent = s.done + "/" + s.total + " (" + pct + "%)";
      if (jb) jb.style.width = pct + "%";
    });

    var pctGlobal = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0;
    var kpiSub = document.getElementById("sti-ed-kpi-sub");
    if (kpiSub) {
      kpiSub.textContent = "✅ " + totalDone + " / " + totalAll + " séries terminées (" + pctGlobal + " %) · ⏳ " + totalDoing + " en cours · ⭐ " + totalStar + " à revoir";
    }

    /* Bannière d'état Séance TP (élève ou vue Professeur) */
    var ban = document.getElementById("sti-ed-lock-banner");
    if (ban) {
      var cv = lireConfigVerrouCorriges();
      var matsVerrou = [];
      if (cv.actif && cv.matieres) {
        ["css3", "javascript", "sql", "php"].forEach(function (m) {
          if (cv.matieres[m]) matsVerrou.push(libelleMatiere(m));
        });
      }
      if (matsVerrou.length && (estAdminActif() || estCibleParVerrou(cv.cible || "*", obtenirClasseEleve()))) {
        ban.classList.add("visible");
        if (estAdminActif()) {
          ban.innerHTML =
            '<span>🛡️ <strong>Vue Professeur (Séance TP active — cible : ' + echap(cv.cible === "*" ? "Toutes classes" : cv.cible) + ') :</strong> Corrigés masqués pour les élèves sur : ' + echap(matsVerrou.join(" · ")) + ' (votre accès Admin reste libre).</span>' +
            '<a href="../admin.html#corriges-tp" style="color:inherit;font-weight:800;text-decoration:underline">Gérer dans Admin →</a>';
        } else {
          ban.innerHTML =
            '<span>🔒 <strong>Séance TP en cours :</strong> M. Essouyah a temporairement masqué les corrigés pour : ' + echap(matsVerrou.join(" · ")) + '. Utilisez les boutons <strong>💡 Indice</strong> et <strong>🌗 Écran Partagé</strong> !</span>';
        }
      } else {
        ban.classList.remove("visible");
      }
    }
  }

  /* ============================================================================
     2. MODE FEUILLE TP INTERACTIVE SUR LES ÉNONCÉS Tp*.html (4 MATIÈRES)
     ============================================================================ */
  var BAREME_TP_CELLULES = {
    "tp1-js.html": [
      function (v) { return /simple|si\b|condition/i.test(v); },
      function (v) { return /alternat|sinon|compl/i.test(v); },
      function (v) { return /choix|multiple|selon|cas|switch/i.test(v); },
      function (v) { return /pour\b|compteur|d[eé]termin|for\b|boucle/i.test(v); },
      function (v) { return /r[eé]p[eé]ter|jusqu|au moins/i.test(v); },
      function (v) { return /tant\s*que|pr[eé]alable|boucle/i.test(v); },
      function (v) { return /fonction|d[eé]claration|sous[\s\-]?programme/i.test(v); },
      function (v) { return /lecture|entr[eé]e|saisie|acc[eè]s|r[eé]cup/i.test(v); },
      function (v) { return /affichage|sortie|[eé]criture/i.test(v); },
      function (v) { return /conversion|type|transtyp/i.test(v); },
      function (v) { return String(v).trim() === "1"; },
      function (v) { return /^(false|faux)$/i.test(String(v).trim()); },
      function (v) { return /^(true|vrai)$/i.test(String(v).trim()); },
      function (v) { return /^(true|vrai)$/i.test(String(v).trim()); },
      function (v) { return /^(true|vrai)$/i.test(String(v).trim()); },
      function (v) { return /^(true|vrai)$/i.test(String(v).trim()); },
      function (v) { var s = String(v).replace(/\s+/g, "").toLowerCase(); return s === "4" || s.indexOf("y=4") !== -1; },
      function (v) { var s = String(v).replace(/\s+/g, "").toLowerCase(); return s === "7" || s === "x=7"; }
    ],
    "tp2-js.html": [
      function (v) { return /^(on)?click$/i.test(String(v).trim()); },
      function (v) { return /^(on)?mouse(over|enter)$/i.test(String(v).trim()); },
      function (v) { return /^(on)?change$/i.test(String(v).trim()); },
      function (v) { return /^(on)?input$/i.test(String(v).trim()); },
      function (v) { return /^(on)?key(down|press)$/i.test(String(v).trim()); },
      function (v) { return /^(on)?keyup$/i.test(String(v).trim()); },
      function (v) { return /^(on)?focus$/i.test(String(v).trim()); },
      function (v) { return /^(on)?blur$/i.test(String(v).trim()); },
      function (v) { return /^(on)?load$/i.test(String(v).trim()); }
    ]
  };

  function estFeuilleEnonceTP() {
    var p = String(location.pathname || "").toLowerCase();
    if (p.indexOf("/exercices/") === -1) return false;
    if (p.indexOf("series-exercices.html") !== -1 || p.indexOf("atelier-interactif-bac.html") !== -1 || p.indexOf("resume-fonctions-standards.html") !== -1) return false;
    if (estPageCorrigeDirecte(p)) return false;
    if (p.indexOf("js-37-defis") !== -1 || p.indexOf("ordre-php-bac") !== -1 || p.indexOf("debogage-php-bac") !== -1 || p.indexOf("trace-fetch-php") !== -1 || p.indexOf("atelier_sql_3_fenetres") !== -1 || p.indexOf("commentconstruire") !== -1) return false;
    return true;
  }

  function initialiserFeuilleEnonceTP() {
    if (!estFeuilleEnonceTP() || document.getElementById("sti-tp-toolbar")) return;
    injecterStylesAtelier();
    document.body.classList.add("sti-feuille-tp");

    var nomFichier = (location.pathname.split("/").pop() || "tp.html").toLowerCase();
    var cleTpRel = "exo:" + location.pathname.replace(/^.*\/exercices\//i, "").toLowerCase();
    var matiere = detecterMatiereDepuisUrl(location.pathname);
    var titreDoc = (document.title || nomFichier).trim();
    var brouillons = lireJson(CLE_BROUILLONS, {});
    var mesRep = brouillons[cleTpRel] || {};

    /* Intercepter tout lien flottant direct vers un corrigé (ex: Tp1-php.html -> Tp1-Correction-php.html) */
    document.querySelectorAll('a[href*="Correction"], a[href*="correction"]').forEach(function (lienCor) {
      var href = lienCor.getAttribute("href");
      lienCor.addEventListener("click", function (ev) {
        var vus = lireJson(CLE_INDICES_SESSION, {}, true);
        if (estCorrigeVerrouille(matiere) || !vus[cleTpRel]) {
          ev.preventDefault();
          ouvrirModaleIndiceOuVerrou({
            exoId: cleTpRel,
            matiere: matiere,
            titre: titreDoc,
            desc: "",
            onOuvrirCorrige: function () { window.location.href = href; }
          });
        }
      });
    });

    /* 1. Convertir les cellules à pointillés (<td>.......</td>) en vrais champs <input> */
    var inputsCellules = [];
    document.querySelectorAll("td").forEach(function (td) {
      var txt = (td.textContent || "").trim();
      if (/^\.{5,}$/.test(txt) && !td.querySelector("input,textarea")) {
        var idx = inputsCellules.length;
        var cleChamp = "cell_" + idx;
        td.textContent = "";
        var inp = document.createElement("input");
        inp.type = "text";
        inp.className = "sti-tp-input";
        inp.placeholder = "Votre réponse…";
        inp.value = mesRep[cleChamp] || "";
        inp.addEventListener("input", function () {
          var b = lireJson(CLE_BROUILLONS, {});
          if (!b[cleTpRel]) b[cleTpRel] = {};
          b[cleTpRel][cleChamp] = inp.value;
          ecrireJson(CLE_BROUILLONS, b);
          inp.classList.remove("ok", "err");
        });
        td.appendChild(inp);
        inputsCellules.push(inp);
      }
    });

    /* 2. Ajouter des zones de rédaction sous les questions <ol><li> (SQL, PHP, JS) */
    var nbZonesQ = 0;
    document.querySelectorAll("ol > li").forEach(function (li, idxLi) {
      if (li.closest("#stix-nav")) return;
      var cleQ = "q_" + idxLi;
      var wrap = document.createElement("div");
      var valInit = mesRep[cleQ] || "";
      wrap.className = "sti-tp-zone-q" + (valInit ? "" : " vide");
      var ta = document.createElement("textarea");
      ta.className = "sti-tp-textarea";
      ta.rows = 2;
      ta.placeholder = matiere === "sql"
        ? "✍️ Écrivez votre requête SQL ici (sauvegarde automatique)…"
        : (matiere === "php" ? "✍️ Écrivez votre code PHP / réponse ici (sauvegarde automatique)…" : "✍️ Votre réponse / code (sauvegarde automatique)…");
      ta.value = valInit;
      ta.addEventListener("input", function () {
        var b = lireJson(CLE_BROUILLONS, {});
        if (!b[cleTpRel]) b[cleTpRel] = {};
        b[cleTpRel][cleQ] = ta.value;
        ecrireJson(CLE_BROUILLONS, b);
        wrap.classList.toggle("vide", !ta.value.trim());
      });
      wrap.appendChild(ta);
      li.appendChild(wrap);
      nbZonesQ++;
    });

    /* 3. Injecter la barre d'outils Atelier TP en haut de l'énoncé */
    var reglesAuto = BAREME_TP_CELLULES[nomFichier] || null;
    var toolbar = document.createElement("div");
    toolbar.id = "sti-tp-toolbar";
    var suivi = lireJson(CLE_SUIVI, {});
    var estFait = suivi[cleTpRel] && suivi[cleTpRel].statut === "done";

    toolbar.innerHTML =
      '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
        '<strong style="font-size:13px">🧪 Atelier TP Interactif</strong>' +
        '<span id="sti-tp-score-pill" style="font-size:12px;font-weight:700;color:#15803d">' +
          (suivi[cleTpRel] && suivi[cleTpRel].note20 !== undefined ? ('🏆 ' + suivi[cleTpRel].note20 + '/20') : '💾 Sauvegarde auto active') +
        '</span>' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">' +
        (reglesAuto && inputsCellules.length === reglesAuto.length
          ? '<button type="button" class="sti-tpt-btn ok" id="sti-tp-btn-corriger">✅ Vérifier mes réponses (/20)</button>'
          : '') +
        (nbZonesQ > 0
          ? '<button type="button" class="sti-tpt-btn" id="sti-tp-btn-toggle-q">✍️ Zones réponses</button>'
          : '') +
        '<button type="button" class="sti-tpt-btn ind" id="sti-tp-btn-indice">💡 Indice</button>' +
        '<button type="button" class="sti-tpt-btn" id="sti-tp-btn-done">' + (estFait ? '✅ TP Terminé' : '⬜ Marquer terminé') + '</button>' +
        '<button type="button" class="sti-tpt-btn" id="sti-tp-btn-export" title="Télécharger mes réponses en fichier .txt">📤 Exporter (.txt)</button>' +
        '<button type="button" class="sti-tpt-btn" id="sti-tp-btn-print">🖨️ Imprimer</button>' +
      '</div>';

    document.body.insertBefore(toolbar, document.body.firstChild);

    var btnCorriger = document.getElementById("sti-tp-btn-corriger");
    if (btnCorriger && reglesAuto) {
      btnCorriger.addEventListener("click", function () {
        var bonnes = 0;
        inputsCellules.forEach(function (inp, i) {
          var ok = Boolean(reglesAuto[i](inp.value || ""));
          inp.classList.remove("ok", "err");
          inp.classList.add(ok ? "ok" : "err");
          if (ok) bonnes++;
        });
        var note20 = Math.round((bonnes / reglesAuto.length) * 20);
        var pill = document.getElementById("sti-tp-score-pill");
        if (pill) pill.textContent = "🏆 Note : " + note20 + "/20 (" + bonnes + "/" + reglesAuto.length + " justes)";
        var sMaj = lireJson(CLE_SUIVI, {});
        var anc = sMaj[cleTpRel] || {};
        sMaj[cleTpRel] = {
          statut: note20 >= 12 ? "done" : "doing",
          etoile: Boolean(anc.etoile),
          note20: Math.max(Number(anc.note20 || 0), note20),
          maj: Date.now()
        };
        ecrireJson(CLE_SUIVI, sMaj);
        var bDone = document.getElementById("sti-tp-btn-done");
        if (bDone && sMaj[cleTpRel].statut === "done") bDone.textContent = "✅ TP Terminé";
      });
    }

    var btnToggleQ = document.getElementById("sti-tp-btn-toggle-q");
    if (btnToggleQ) {
      btnToggleQ.addEventListener("click", function () {
        document.body.classList.toggle("sti-tp-sans-saisie");
      });
    }

    document.getElementById("sti-tp-btn-indice").addEventListener("click", function () {
      ouvrirModaleIndiceOuVerrou({
        exoId: cleTpRel,
        matiere: matiere,
        titre: titreDoc,
        desc: "",
        indiceSeul: true
      });
    });

    var btnDone = document.getElementById("sti-tp-btn-done");
    btnDone.addEventListener("click", function () {
      var sMaj = lireJson(CLE_SUIVI, {});
      var cur = sMaj[cleTpRel] && sMaj[cleTpRel].statut === "done";
      sMaj[cleTpRel] = Object.assign({}, sMaj[cleTpRel] || {}, { statut: cur ? "doing" : "done", maj: Date.now() });
      ecrireJson(CLE_SUIVI, sMaj);
      btnDone.textContent = cur ? "⬜ Marquer terminé" : "✅ TP Terminé";
    });

    document.getElementById("sti-tp-btn-export").addEventListener("click", function () {
      var lignes = ["=== " + titreDoc + " — Réponses STI V2.0 ===", ""];
      inputsCellules.forEach(function (inp, i) {
        if (inp.value.trim()) lignes.push("Cellule " + (i + 1) + " : " + inp.value.trim());
      });
      document.querySelectorAll(".sti-tp-textarea").forEach(function (ta, i) {
        if (ta.value.trim()) lignes.push("Question " + (i + 1) + " :\n" + ta.value.trim() + "\n");
      });
      var uri = "data:text/plain;charset=utf-8," + encodeURIComponent(lignes.join("\n"));
      var a = document.createElement("a");
      a.href = uri;
      a.download = nomFichier.replace(/\.html?$/i, "") + "-mes-reponses.txt";
      document.body.appendChild(a);
      a.click();
      a.remove();
    });

    document.getElementById("sti-tp-btn-print").addEventListener("click", function () {
      window.print();
    });
  }

  /* ---------- API publique & Démarrage ---------- */
  window.STI_EXO_ATELIER = {
    estCorrigeVerrouille: estCorrigeVerrouille,
    sontIndicesAutorises: sontIndicesAutorises,
    ouvrirModaleIndiceOuVerrou: ouvrirModaleIndiceOuVerrou,
    rafraichirSuiviPortail: rafraichirSuiviPortail
  };

  function demarrer() {
    appliquerProtectionPageCorrigeDirecte();
    initialiserPortailSeriesExercices();
    initialiserFeuilleEnonceTP();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", demarrer);
  } else {
    demarrer();
  }

  window.addEventListener("sti:sec-config-maj", function () {
    appliquerProtectionPageCorrigeDirecte();
    rafraichirSuiviPortail();
  });
  window.addEventListener("storage", function (e) {
    if (!e || !e.key || e.key === "sti-sec-config" || e.key === CLE_SUIVI) {
      appliquerProtectionPageCorrigeDirecte();
      rafraichirSuiviPortail();
    }
  });
})();
