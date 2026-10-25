/* ═══════════════════════════════════════════════════════════════════════════
   v449 : 🦴 RAYONS X HTML / CSS (Box-Model, Sémantique, Flexbox & Formulaires)
        + 🖍️ SURLIGNEUR FLUO SUR LES COURS (Jaune / Vert / Rose + Fiche Révision)
   Module universel STI V2.0 — 100 % hors-ligne, compatible mode clair/sombre & CSP stricte.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  if (window.__STI_RAYONSX_SURLIGNEUR_ACTIF) return;
  window.__STI_RAYONSX_SURLIGNEUR_ACTIF = true;

  var doc = document;
  var CLE_FLUO = "sti-surlignages-v1";
  var CLE_SYNC_MAJ = "sti-sync-maj";
  var MAX_FLUO_ITEMS = 250;

  var COULEURS_FLUO = {
    jaune: { code: "jaune", ico: "🟡", lbl: "Important", bgLight: "rgba(253, 224, 71, 0.42)", bgDark: "rgba(250, 204, 21, 0.24)", bord: "#eab308", badgeBg: "#fef08a", badgeFg: "#713f12" },
    vert:  { code: "vert",  ico: "🟢", lbl: "Syntaxe / Déf.", bgLight: "rgba(134, 239, 172, 0.40)", bgDark: "rgba(74, 222, 128, 0.22)", bord: "#16a34a", badgeBg: "#dcfce7", badgeFg: "#14532d" },
    rose:  { code: "rose",  ico: "🩷", lbl: "Piège Bac", bgLight: "rgba(249, 168, 212, 0.40)", bgDark: "rgba(244, 114, 182, 0.24)", bord: "#db2777", badgeBg: "#fce7f3", badgeFg: "#831843" }
  };

  function racineSiteSTI() {
    if (window.STI_AUTH && typeof window.STI_AUTH.RACINE === "string") return window.STI_AUTH.RACINE;
    try {
      var scripts = doc.getElementsByTagName("script");
      for (var i = 0; i < scripts.length; i++) {
        var s = scripts[i].getAttribute("src") || "";
        var idx = s.indexOf("assets/js/rayonsx-surligneur.js");
        if (idx !== -1) return s.slice(0, idx);
        var idx2 = s.indexOf("assets/js/mobile-nav.js");
        if (idx2 !== -1) return s.slice(0, idx2);
      }
    } catch (e) {}
    return "";
  }

  function pageSlugCourante() {
    var p = String(location.pathname || "").replace(/\\/g, "/");
    var m = p.match(/\/((?:cours|exercices|quiz|projets|cssanimee|Positionnement-animee)\/.+)$/i);
    if (m && m[1]) return m[1];
    var nom = p.split("/").pop() || "index.html";
    if (!/\.html?$/i.test(nom)) nom = "index.html";
    return nom;
  }

  function devinerMatierePage(slug) {
    var s = String(slug || "").toLowerCase();
    if (s.indexOf("html") !== -1 || s.indexOf("datalist") !== -1 || s.indexOf("fleur") !== -1) return "HTML5";
    if (s.indexOf("css") !== -1 || s.indexOf("positionnement") !== -1) return "CSS3";
    if (s.indexOf("javascript") !== -1 || s.indexOf("outils-js") !== -1) return "JavaScript";
    if (s.indexOf("php") !== -1) return "PHP & MySQLi";
    if (s.indexOf("sql") !== -1) return "SQL";
    if (s.indexOf("bac") !== -1 || s.indexOf("pieges") !== -1 || s.indexOf("memo") !== -1) return " Spécial Bac";
    return "Cours STI";
  }

  function titreProprePage() {
    var t = String(doc.title || "").replace(/\s*[—·|\-]\s*STI.*$/i, "").trim();
    return t || pageSlugCourante();
  }

  function estElementInterfaceSTI(el) {
    if (!el || el.nodeType !== 1) return true;
    if (el.closest && (
      el.closest("[id^='sti-']") ||
      el.closest(".sti-no-print") ||
      el.closest("nav") && el.closest("#sti-bnav")
    )) return true;
    var id = String(el.id || "");
    if (id.indexOf("sti-") === 0) return true;
    return false;
  }

  function injecterStylesGlobaux() {
    if (doc.getElementById("sti-xray-fluo-styles")) return;
    var st = doc.createElement("style");
    st.id = "sti-xray-fluo-styles";
    st.textContent =
      /* --- Surligneur Fluo --- */
      ".sti-fluo-bloc{position:relative;border-radius:8px;transition:background-color .18s ease,box-shadow .18s ease;box-decoration-break:clone;-webkit-box-decoration-break:clone}" +
      ".sti-fluo-bloc[data-fluo-col='jaune']{background-color:rgba(253,224,71,.40)!important;box-shadow:inset 4px 0 0 #eab308!important;padding-left:10px!important}" +
      ".sti-fluo-bloc[data-fluo-col='vert']{background-color:rgba(134,239,172,.38)!important;box-shadow:inset 4px 0 0 #16a34a!important;padding-left:10px!important}" +
      ".sti-fluo-bloc[data-fluo-col='rose']{background-color:rgba(249,168,212,.38)!important;box-shadow:inset 4px 0 0 #db2777!important;padding-left:10px!important}" +
      "html.dark .sti-fluo-bloc[data-fluo-col='jaune'],html[data-theme='dark'] .sti-fluo-bloc[data-fluo-col='jaune']{background-color:rgba(250,204,21,.22)!important}" +
      "html.dark .sti-fluo-bloc[data-fluo-col='vert'],html[data-theme='dark'] .sti-fluo-bloc[data-fluo-col='vert']{background-color:rgba(74,222,128,.20)!important}" +
      "html.dark .sti-fluo-bloc[data-fluo-col='rose'],html[data-theme='dark'] .sti-fluo-bloc[data-fluo-col='rose']{background-color:rgba(244,114,182,.22)!important}" +
      "body.sti-fluo-mode-actif .sti-fluo-cible-survol{outline:2px dashed #f4511e!important;outline-offset:3px!important;cursor:pointer!important;border-radius:6px}" +
      "@keyframes stiFluoPulse{0%,100%{transform:scale(1)}40%{transform:scale(1.015);box-shadow:0 0 0 5px rgba(244,81,30,.45),inset 4px 0 0 #f4511e}}" +
      ".sti-fluo-focus-flash{animation:stiFluoPulse 1.1s ease 2}" +
      ".sti-fluo-note-chip{display:inline-flex;align-items:center;gap:4px;margin-left:6px;padding:1px 7px;border-radius:999px;background:#1e293b;color:#fde047;font:800 10.5px/1.3 'Comic Sans MS','Segoe UI',system-ui,sans-serif;vertical-align:middle}" +

      /* --- Rayons X HTML / CSS --- */
      "body.sti-xray-actif[data-xray-filter='all'] header:not([id^='sti-'])," +
      "body.sti-xray-actif[data-xray-filter='all'] nav:not([id^='sti-'])," +
      "body.sti-xray-actif[data-xray-filter='all'] main:not([id^='sti-'])," +
      "body.sti-xray-actif[data-xray-filter='all'] section:not([id^='sti-'])," +
      "body.sti-xray-actif[data-xray-filter='all'] article:not([id^='sti-'])," +
      "body.sti-xray-actif[data-xray-filter='all'] aside:not([id^='sti-'])," +
      "body.sti-xray-actif[data-xray-filter='all'] footer:not([id^='sti-'])," +
      "body.sti-xray-actif[data-xray-filter='sem'] header:not([id^='sti-'])," +
      "body.sti-xray-actif[data-xray-filter='sem'] nav:not([id^='sti-'])," +
      "body.sti-xray-actif[data-xray-filter='sem'] main:not([id^='sti-'])," +
      "body.sti-xray-actif[data-xray-filter='sem'] section:not([id^='sti-'])," +
      "body.sti-xray-actif[data-xray-filter='sem'] article:not([id^='sti-'])," +
      "body.sti-xray-actif[data-xray-filter='sem'] aside:not([id^='sti-'])," +
      "body.sti-xray-actif[data-xray-filter='sem'] footer:not([id^='sti-']){outline:2px solid #f97316!important;outline-offset:-1px!important}" +

      "body.sti-xray-actif[data-xray-filter='all'] [data-sti-xray-layout='flex']," +
      "body.sti-xray-actif[data-xray-filter='layout'] [data-sti-xray-layout='flex']{outline:2px dashed #a855f7!important;outline-offset:-2px!important;background-image:repeating-linear-gradient(135deg,rgba(168,85,247,.06) 0,rgba(168,85,247,.06) 6px,transparent 6px,transparent 12px)!important}" +
      "body.sti-xray-actif[data-xray-filter='all'] [data-sti-xray-layout='grid']," +
      "body.sti-xray-actif[data-xray-filter='layout'] [data-sti-xray-layout='grid']{outline:2px dashed #06b6d4!important;outline-offset:-2px!important;background-image:repeating-linear-gradient(45deg,rgba(6,182,212,.06) 0,rgba(6,182,212,.06) 6px,transparent 6px,transparent 12px)!important}" +

      "body.sti-xray-actif[data-xray-filter='all'] form:not([id^='sti-'])," +
      "body.sti-xray-actif[data-xray-filter='all'] table:not([id^='sti-'])," +
      "body.sti-xray-actif[data-xray-filter='form'] form:not([id^='sti-'])," +
      "body.sti-xray-actif[data-xray-filter='form'] fieldset:not([id^='sti-'])," +
      "body.sti-xray-actif[data-xray-filter='form'] input:not([id^='sti-'])," +
      "body.sti-xray-actif[data-xray-filter='form'] select:not([id^='sti-'])," +
      "body.sti-xray-actif[data-xray-filter='form'] textarea:not([id^='sti-'])," +
      "body.sti-xray-actif[data-xray-filter='form'] button:not([id^='sti-'])," +
      "body.sti-xray-actif[data-xray-filter='form'] table:not([id^='sti-'])," +
      "body.sti-xray-actif[data-xray-filter='form'] th:not([id^='sti-'])," +
      "body.sti-xray-actif[data-xray-filter='form'] td:not([id^='sti-']){outline:2px solid #10b981!important;outline-offset:-1px!important}" +

      ".sti-xray-tag-pill{position:fixed;z-index:2147483640;pointer-events:none;padding:1px 6px;border-radius:5px;font:900 10px/1.3 ui-monospace,SFMono-Regular,Consolas,monospace;color:#fff;box-shadow:0 2px 6px rgba(0,0,0,.3);white-space:nowrap}" +
      "@media print{#sti-xray-hud,#sti-xray-layer,#sti-fluo-hud,#sti-fluo-drawer-ov{display:none!important}}";
    (doc.head || doc.documentElement).appendChild(st);
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     PARTIE 1 : 🖍️ SURLIGNEUR FLUO SUR LES COURS + STOCKAGE LOCAL/CLOUD
     ═══════════════════════════════════════════════════════════════════════════ */
  function lireTousSurlignages() {
    try {
      var arr = JSON.parse(localStorage.getItem(CLE_FLUO) || "[]");
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function ecrireTousSurlignages(liste) {
    var propre = (Array.isArray(liste) ? liste : []).slice(0, MAX_FLUO_ITEMS);
    try {
      localStorage.setItem(CLE_FLUO, JSON.stringify(propre));
      localStorage.setItem(CLE_SYNC_MAJ, String(Date.now()));
    } catch (e) {}
    majCompteursFluoUI(propre.length);
    try {
      window.dispatchEvent(new CustomEvent("sti-surlignages-maj", { detail: { total: propre.length } }));
    } catch (e2) {}
  }

  function texteNormaliseBloc(el) {
    if (!el) return "";
    var clone = el.cloneNode(true);
    var chips = clone.querySelectorAll ? clone.querySelectorAll(".sti-fluo-note-chip") : [];
    for (var i = 0; i < chips.length; i++) {
      if (chips[i].parentNode) chips[i].parentNode.removeChild(chips[i]);
    }
    return String(clone.textContent || "").replace(/\s+/g, " ").trim();
  }

  function cleStableBloc(el) {
    if (!el || el.nodeType !== 1) return "";
    var tag = String(el.tagName || "DIV").toLowerCase();
    var id = el.id ? ("#" + el.id) : "";
    var txt = texteNormaliseBloc(el);
    var deb = txt.slice(0, 72).toLowerCase();
    var idxMemeTag = 0;
    try {
      var tous = doc.getElementsByTagName(tag);
      for (var i = 0; i < tous.length; i++) {
        if (tous[i] === el) { idxMemeTag = i; break; }
      }
    } catch (e) {}
    return tag + id + "@" + idxMemeTag + ":" + deb;
  }

  function trouverBlocPourItem(item) {
    if (!item || !item.blockKey) return null;
    var m = String(item.blockKey).match(/^([a-z0-9]+)(#[A-Za-z0-9_\-]+)?@(\d+):([\s\S]*)$/);
    var tag = m ? m[1] : "";
    var idPart = m && m[2] ? m[2].slice(1) : "";
    var idxHint = m ? parseInt(m[3], 10) : -1;
    var debAttendu = m ? m[4] : "";

    if (idPart) {
      var byId = doc.getElementById(idPart);
      if (byId && !estElementInterfaceSTI(byId)) return byId;
    }
    var candidats = tag ? doc.getElementsByTagName(tag) : doc.querySelectorAll("p,li,blockquote,td,th,pre,h2,h3,h4");
    if (idxHint >= 0 && idxHint < candidats.length) {
      var exact = candidats[idxHint];
      if (exact && !estElementInterfaceSTI(exact)) {
        var tEx = texteNormaliseBloc(exact).slice(0, 72).toLowerCase();
        if (!debAttendu || tEx === debAttendu || tEx.indexOf(debAttendu.slice(0, 32)) === 0) return exact;
      }
    }
    var extrait = String(item.texte || "").slice(0, 48).toLowerCase();
    for (var i = 0; i < candidats.length; i++) {
      var c = candidats[i];
      if (estElementInterfaceSTI(c)) continue;
      var tc = texteNormaliseBloc(c).toLowerCase();
      if ((debAttendu && tc.slice(0, 72) === debAttendu) || (extrait && tc.indexOf(extrait) !== -1)) {
        return c;
      }
    }
    return null;
  }

  function appliquerVisuelFluoSurBloc(el, item) {
    if (!el || !item) return;
    el.classList.add("sti-fluo-bloc");
    el.setAttribute("data-fluo-col", item.couleur || "jaune");
    el.setAttribute("data-fluo-id", item.id);
    var oldChip = el.querySelector(".sti-fluo-note-chip");
    if (oldChip && oldChip.parentNode) oldChip.parentNode.removeChild(oldChip);
    if (item.note) {
      var chip = doc.createElement("span");
      chip.className = "sti-fluo-note-chip sti-no-print";
      chip.textContent = "📌 " + item.note;
      el.appendChild(chip);
    }
  }

  function retirerVisuelFluoSurBloc(el) {
    if (!el) return;
    el.classList.remove("sti-fluo-bloc", "sti-fluo-cible-survol", "sti-fluo-focus-flash");
    el.removeAttribute("data-fluo-col");
    el.removeAttribute("data-fluo-id");
    var oldChip = el.querySelector ? el.querySelector(".sti-fluo-note-chip") : null;
    if (oldChip && oldChip.parentNode) oldChip.parentNode.removeChild(oldChip);
  }

  function restaurerSurlignagesPageCourante() {
    injecterStylesGlobaux();
    var slug = pageSlugCourante().toLowerCase();
    if (slug === "admin.html" || slug === "portail.html") return;
    var liste = lireTousSurlignages();
    var deCettePage = liste.filter(function (it) {
      return it && String(it.page || "").toLowerCase() === slug;
    });
    deCettePage.forEach(function (it) {
      var el = trouverBlocPourItem(it);
      if (el) appliquerVisuelFluoSurBloc(el, it);
    });

    /* Si l'élève vient de ma-fiche-revision.html avec ?fluo=ID, défiler vers le passage */
    try {
      var q = new URLSearchParams(location.search || "");
      var focusId = q.get("fluo");
      if (focusId) {
        var cible = doc.querySelector("[data-fluo-id='" + focusId.replace(/[^A-Za-z0-9_\-]/g, "") + "']");
        if (cible) {
          setTimeout(function () {
            try { cible.scrollIntoView({ behavior: "smooth", block: "center" }); } catch (e) {}
            cible.classList.add("sti-fluo-focus-flash");
          }, 260);
        }
      }
    } catch (e2) {}
  }

  /* Mode interactif Surligneur Fluo */
  var fluoActif = false;
  var fluoOutilCourant = "jaune"; /* jaune | vert | rose | gomme | note */
  var fluoHudEl = null;
  var fluoSurvolEl = null;
  var fluoDrawerOv = null;

  function trouverBlocCoursSurlignable(target) {
    if (!target || target.nodeType !== 1 || estElementInterfaceSTI(target)) return null;
    if (target.closest && target.closest("a[href], button, input, select, textarea, nav, .barre")) {
      /* Autoriser quand même un bloc déjà surligné si on utilise la gomme ou la note */
      var deja = target.closest(".sti-fluo-bloc");
      if (deja && (fluoOutilCourant === "gomme" || fluoOutilCourant === "note")) return deja;
      return null;
    }
    var sel = ".sti-fluo-bloc, .phrase-retenir-cadre, blockquote, li, p, pre, td, th, dt, dd, h2, h3, h4";
    var bloc = target.closest ? target.closest(sel) : null;
    if (!bloc || estElementInterfaceSTI(bloc)) return null;
    var txt = texteNormaliseBloc(bloc);
    if (txt.length < 4 || txt.length > 1800) return null;
    return bloc;
  }

  function majCompteursFluoUI(nb) {
    var total = typeof nb === "number" ? nb : lireTousSurlignages().length;
    var btnCnt = doc.getElementById("sti-fluo-hud-count");
    if (btnCnt) btnCnt.textContent = "📑 Mes passages (" + total + ")";
    var btnPc = doc.getElementById("sti-btn-pc-fluo");
    if (btnPc) {
      btnPc.style.background = fluoActif ? "#fde047" : "#fffdf7";
      btnPc.style.color = "#23201a";
      btnPc.innerHTML = "🖍️ <span>Fluo" + (total > 0 ? " (" + total + ")" : "") + "</span>";
    }
    var btnRoue = doc.getElementById("sti-btn-roue-fluo");
    if (btnRoue) {
      btnRoue.textContent = "🖍️ Surligneur" + (total > 0 ? " (" + total + ")" : "");
    }
  }

  function surlignerSelectionActiveSiPresente(couleur) {
    if (!COULEURS_FLUO[couleur]) return false;
    try {
      var sel = window.getSelection ? window.getSelection() : null;
      if (!sel || sel.isCollapsed) return false;
      var txtSel = String(sel.toString() || "").replace(/\s+/g, " ").trim();
      if (txtSel.length < 4) return false;
      var anchor = sel.anchorNode && (sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement);
      var bloc = anchor ? trouverBlocCoursSurlignable(anchor) : null;
      if (!bloc) return false;
      enregistrerOuMajSurlignageBloc(bloc, couleur, txtSel.slice(0, 420));
      try { sel.removeAllRanges(); } catch (e) {}
      return true;
    } catch (e2) {
      return false;
    }
  }

  function enregistrerOuMajSurlignageBloc(bloc, couleur, extraitForce) {
    if (!bloc || !COULEURS_FLUO[couleur]) return;
    var slug = pageSlugCourante();
    var bKey = cleStableBloc(bloc);
    var liste = lireTousSurlignages();
    var existIdx = -1;
    var idExistant = bloc.getAttribute("data-fluo-id") || "";
    for (var i = 0; i < liste.length; i++) {
      if ((idExistant && liste[i].id === idExistant) ||
          (String(liste[i].page).toLowerCase() === slug.toLowerCase() && liste[i].blockKey === bKey)) {
        existIdx = i;
        break;
      }
    }
    var texteComplet = extraitForce || texteNormaliseBloc(bloc).slice(0, 420);
    var item;
    if (existIdx >= 0) {
      item = liste[existIdx];
      item.couleur = couleur;
      item.texte = texteComplet;
      item.ts = Date.now();
    } else {
      item = {
        id: "fl-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6),
        page: slug,
        titrePage: titreProprePage(),
        matiere: devinerMatierePage(slug),
        couleur: couleur,
        texte: texteComplet,
        note: "",
        blockKey: bKey,
        ts: Date.now()
      };
      liste.unshift(item);
    }
    appliquerVisuelFluoSurBloc(bloc, item);
    ecrireTousSurlignages(liste);
  }

  function supprimerSurlignageParIdOuBloc(idCible, blocOpt) {
    var liste = lireTousSurlignages();
    var slug = pageSlugCourante().toLowerCase();
    var bKey = blocOpt ? cleStableBloc(blocOpt) : "";
    var reste = liste.filter(function (it) {
      if (!it) return false;
      if (idCible && it.id === idCible) return false;
      if (bKey && String(it.page || "").toLowerCase() === slug && it.blockKey === bKey) return false;
      return true;
    });
    if (blocOpt) retirerVisuelFluoSurBloc(blocOpt);
    if (idCible) {
      var elDom = doc.querySelector("[data-fluo-id='" + idCible.replace(/[^A-Za-z0-9_\-]/g, "") + "']");
      if (elDom) retirerVisuelFluoSurBloc(elDom);
    }
    ecrireTousSurlignages(reste);
  }

  function annoterSurlignageBloc(bloc) {
    if (!bloc) return;
    var idEx = bloc.getAttribute("data-fluo-id");
    if (!idEx) {
      enregistrerOuMajSurlignageBloc(bloc, "jaune");
      idEx = bloc.getAttribute("data-fluo-id");
    }
    var liste = lireTousSurlignages();
    var it = null;
    for (var i = 0; i < liste.length; i++) {
      if (liste[i] && liste[i].id === idEx) { it = liste[i]; break; }
    }
    if (!it) return;
    var saisie = window.prompt("📌 Ajouter une note personnelle à ce passage surligné (ex. « Définition Bac », « À retenir ») :", it.note || "");
    if (saisie === null) return;
    it.note = String(saisie).trim().slice(0, 120);
    it.ts = Date.now();
    appliquerVisuelFluoSurBloc(bloc, it);
    ecrireTousSurlignages(liste);
  }

  function construireHudFluo() {
    if (fluoHudEl) return fluoHudEl;
    injecterStylesGlobaux();
    var hud = doc.createElement("div");
    hud.id = "sti-fluo-hud";
    hud.className = "sti-no-print";
    hud.style.cssText =
      "position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:2147483644;display:none;" +
      "align-items:center;gap:6px;flex-wrap:wrap;justify-content:center;max-width:96vw;" +
      "padding:7px 11px;border-radius:999px;background:rgba(15,23,42,.95);color:#f8fafc;" +
      "border:2px solid #eab308;box-shadow:0 16px 38px rgba(0,0,0,.42);" +
      "font:800 12px/1.2 'Comic Sans MS','Comic Neue',system-ui,sans-serif;";

    var lbl = doc.createElement("span");
    lbl.textContent = "🖍️ Surligneur :";
    lbl.style.cssText = "padding:0 4px;color:#fde047;font-weight:900;";
    hud.appendChild(lbl);

    var boutonsOutils = {};
    function creerBtnOutil(code, texte, bgActif, fgActif) {
      var b = doc.createElement("button");
      b.type = "button";
      b.textContent = texte;
      b.setAttribute("data-fluo-tool", code);
      b.style.cssText =
        "border:1.5px solid rgba(255,255,255,.22);border-radius:999px;padding:5px 10px;" +
        "font:900 11.5px/1 inherit;cursor:pointer;transition:transform .12s ease;";
      b.addEventListener("click", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        if (COULEURS_FLUO[code] && surlignerSelectionActiveSiPresente(code)) {
          fluoOutilCourant = code;
          majEtatBoutonsOutils();
          return;
        }
        fluoOutilCourant = code;
        majEtatBoutonsOutils();
      });
      boutonsOutils[code] = { el: b, bg: bgActif, fg: fgActif };
      hud.appendChild(b);
    }

    creerBtnOutil("jaune", "🟡 Important", "#fde047", "#422006");
    creerBtnOutil("vert", "🟢 Syntaxe", "#86efac", "#052e16");
    creerBtnOutil("rose", "🩷 Piège Bac", "#f9a8d4", "#500724");
    creerBtnOutil("note", "📌 Note", "#38bdf8", "#082f49");
    creerBtnOutil("gomme", "🧽 Gomme", "#f87171", "#450a0a");

    function majEtatBoutonsOutils() {
      Object.keys(boutonsOutils).forEach(function (k) {
        var o = boutonsOutils[k];
        var on = fluoOutilCourant === k;
        o.el.style.background = on ? o.bg : "rgba(255,255,255,.10)";
        o.el.style.color = on ? o.fg : "#f8fafc";
        o.el.style.borderColor = on ? "#ffffff" : "rgba(255,255,255,.22)";
        o.el.style.transform = on ? "scale(1.05)" : "scale(1)";
      });
    }
    hud._majOutils = majEtatBoutonsOutils;
    majEtatBoutonsOutils();

    var btnList = doc.createElement("button");
    btnList.type = "button";
    btnList.id = "sti-fluo-hud-count";
    btnList.textContent = "📑 Mes passages (" + lireTousSurlignages().length + ")";
    btnList.style.cssText =
      "border:1.5px solid #38bdf8;background:rgba(56,189,248,.18);color:#e0f2fe;" +
      "border-radius:999px;padding:5px 11px;font:900 11.5px/1 inherit;cursor:pointer;";
    btnList.addEventListener("click", function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      ouvrirMesPassagesSurlignesSTI();
    });
    hud.appendChild(btnList);

    var btnClose = doc.createElement("button");
    btnClose.type = "button";
    btnClose.textContent = "✕";
    btnClose.title = "Fermer la barre de surlignage (vos passages restent colorés)";
    btnClose.style.cssText =
      "border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.1);color:#fff;" +
      "border-radius:999px;padding:5px 9px;font:900 11.5px/1 inherit;cursor:pointer;";
    btnClose.addEventListener("click", function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      basculerSurligneurSTI(false);
    });
    hud.appendChild(btnClose);

    (doc.body || doc.documentElement).appendChild(hud);
    fluoHudEl = hud;
    return hud;
  }

  function onFluoMouseOver(ev) {
    if (!fluoActif) return;
    var bloc = trouverBlocCoursSurlignable(ev.target);
    if (fluoSurvolEl && fluoSurvolEl !== bloc) {
      fluoSurvolEl.classList.remove("sti-fluo-cible-survol");
    }
    fluoSurvolEl = bloc;
    if (bloc) bloc.classList.add("sti-fluo-cible-survol");
  }

  function onFluoClickDoc(ev) {
    if (!fluoActif) return;
    if (estElementInterfaceSTI(ev.target)) return;
    /* Si l'utilisateur vient de sélectionner une portion de texte à la souris */
    var sel = window.getSelection ? window.getSelection() : null;
    if (sel && !sel.isCollapsed && String(sel.toString() || "").trim().length >= 4 && COULEURS_FLUO[fluoOutilCourant]) {
      ev.preventDefault();
      ev.stopPropagation();
      surlignerSelectionActiveSiPresente(fluoOutilCourant);
      return;
    }
    var bloc = trouverBlocCoursSurlignable(ev.target);
    if (!bloc) return;
    ev.preventDefault();
    ev.stopPropagation();
    if (fluoOutilCourant === "gomme") {
      supprimerSurlignageParIdOuBloc(bloc.getAttribute("data-fluo-id") || "", bloc);
    } else if (fluoOutilCourant === "note") {
      annoterSurlignageBloc(bloc);
    } else if (COULEURS_FLUO[fluoOutilCourant]) {
      var colActuelle = bloc.getAttribute("data-fluo-col");
      if (colActuelle === fluoOutilCourant && bloc.classList.contains("sti-fluo-bloc")) {
        /* Second clic identique = retirer (pratique sur tactile) */
        supprimerSurlignageParIdOuBloc(bloc.getAttribute("data-fluo-id") || "", bloc);
      } else {
        enregistrerOuMajSurlignageBloc(bloc, fluoOutilCourant);
      }
    }
  }

  function basculerSurligneurSTI(forcerEtat) {
    var nv = typeof forcerEtat === "boolean" ? forcerEtat : !fluoActif;
    if (nv && xrayActif) basculerRayonsXSTI(false);
    fluoActif = nv;
    var hud = construireHudFluo();
    if (fluoActif) {
      hud.style.display = "inline-flex";
      if (doc.body) doc.body.classList.add("sti-fluo-mode-actif");
      doc.addEventListener("mouseover", onFluoMouseOver, true);
      doc.addEventListener("click", onFluoClickDoc, true);
    } else {
      hud.style.display = "none";
      if (doc.body) doc.body.classList.remove("sti-fluo-mode-actif");
      if (fluoSurvolEl) {
        fluoSurvolEl.classList.remove("sti-fluo-cible-survol");
        fluoSurvolEl = null;
      }
      doc.removeEventListener("mouseover", onFluoMouseOver, true);
      doc.removeEventListener("click", onFluoClickDoc, true);
    }
    majCompteursFluoUI();
    return fluoActif;
  }

  function ouvrirMesPassagesSurlignesSTI() {
    injecterStylesGlobaux();
    var R = racineSiteSTI();
    if (!fluoDrawerOv) {
      fluoDrawerOv = doc.createElement("div");
      fluoDrawerOv.id = "sti-fluo-drawer-ov";
      fluoDrawerOv.className = "sti-no-print";
      fluoDrawerOv.style.cssText =
        "position:fixed;inset:0;z-index:2147483646;background:rgba(15,23,42,.78);backdrop-filter:blur(7px);" +
        "display:none;align-items:center;justify-content:center;padding:14px;" +
        "font-family:'Comic Sans MS','Comic Neue',system-ui,sans-serif;";
      fluoDrawerOv.addEventListener("click", function (ev) {
        if (ev.target === fluoDrawerOv) fluoDrawerOv.style.display = "none";
      });
      (doc.body || doc.documentElement).appendChild(fluoDrawerOv);
    }

    var filtreCol = "*";
    function rendreTiroir() {
      var tous = lireTousSurlignages();
      var liste = filtreCol === "*" ? tous : tous.filter(function (x) { return x && x.couleur === filtreCol; });
      fluoDrawerOv.innerHTML = "";

      var box = doc.createElement("div");
      box.style.cssText =
        "width:min(680px,96vw);max-height:88vh;display:flex;flex-direction:column;background:#fffdf7;color:#23201a;" +
        "border:2.5px solid #23201a;border-radius:22px;box-shadow:0 26px 64px rgba(0,0,0,.48);overflow:hidden;";

      var head = doc.createElement("div");
      head.style.cssText =
        "display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;" +
        "padding:14px 18px;background:#101728;color:#fffdf7;";
      var hTitle = doc.createElement("div");
      hTitle.innerHTML = "<strong style='font-size:15.5px'>🖍️ Mes passages surlignés (" + tous.length + ")</strong>" +
        "<div style='font-size:11px;color:#cbd5e1;font-weight:700'>Retrouvez tous vos fluos par couleur et imprimez-les dans Ma Fiche de Révision</div>";
      var headBtns = doc.createElement("div");
      headBtns.style.cssText = "display:flex;align-items:center;gap:7px;flex-wrap:wrap;";

      var lienFiche = doc.createElement("a");
      lienFiche.href = R + "ma-fiche-revision.html#sec-surlignages";
      lienFiche.textContent = "🖨️ Ma Fiche de Révision";
      lienFiche.style.cssText =
        "padding:6px 12px;border-radius:999px;background:#f4511e;color:#fff;text-decoration:none;font-size:11.5px;font-weight:900;";
      headBtns.appendChild(lienFiche);

      var bClose = doc.createElement("button");
      bClose.type = "button";
      bClose.textContent = "✕";
      bClose.style.cssText =
        "border:1px solid rgba(255,255,255,.28);background:rgba(255,255,255,.1);color:#fff;border-radius:9px;padding:4px 9px;font-weight:900;cursor:pointer;";
      bClose.addEventListener("click", function () { fluoDrawerOv.style.display = "none"; });
      headBtns.appendChild(bClose);

      head.appendChild(hTitle);
      head.appendChild(headBtns);
      box.appendChild(head);

      var barF = doc.createElement("div");
      barF.style.cssText = "display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:10px 18px;background:#f7f2e7;border-bottom:1.5px solid #e2d5be;";
      [
        { c: "*", lbl: "✨ Tous (" + tous.length + ")" },
        { c: "jaune", lbl: "🟡 Important" },
        { c: "vert", lbl: "🟢 Syntaxe / Déf." },
        { c: "rose", lbl: "🩷 Piège Bac" }
      ].forEach(function (f) {
        var bf = doc.createElement("button");
        bf.type = "button";
        bf.textContent = f.lbl;
        var act = filtreCol === f.c;
        bf.style.cssText =
          "padding:5px 11px;border-radius:999px;border:1.5px solid #23201a;font:800 11.5px/1 inherit;cursor:pointer;" +
          "background:" + (act ? "#23201a" : "#fff") + ";color:" + (act ? "#fde047" : "#23201a") + ";";
        bf.addEventListener("click", function () { filtreCol = f.c; rendreTiroir(); });
        barF.appendChild(bf);
      });
      box.appendChild(barF);

      var body = doc.createElement("div");
      body.style.cssText = "padding:14px 18px;overflow-y:auto;display:flex;flex-direction:column;gap:10px;";

      if (!liste.length) {
        var vide = doc.createElement("div");
        vide.style.cssText = "padding:26px 14px;text-align:center;color:#7a6f5d;font-size:13px;font-weight:700;";
        vide.textContent = "Aucun passage surligné dans cette catégorie. Activez 🖍️ Surligneur puis cliquez sur un paragraphe ou une règle d'un cours !";
        body.appendChild(vide);
      } else {
        liste.forEach(function (it) {
          var metaCol = COULEURS_FLUO[it.couleur] || COULEURS_FLUO.jaune;
          var card = doc.createElement("div");
          card.style.cssText =
            "padding:10px 12px;border-radius:14px;background:#fff;border:1.5px solid #e2d5be;" +
            "border-left:6px solid " + metaCol.bord + ";display:flex;flex-direction:column;gap:5px;";

          var topRow = doc.createElement("div");
          topRow.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;";
          var tagSpan = doc.createElement("span");
          tagSpan.style.cssText =
            "padding:2px 9px;border-radius:999px;background:" + metaCol.badgeBg + ";color:" + metaCol.badgeFg + ";font-size:10.5px;font-weight:900;";
          tagSpan.textContent = metaCol.ico + " " + metaCol.lbl + " · " + (it.matiere || "Cours") + " (" + (it.titrePage || it.page) + ")";

          var acts = doc.createElement("div");
          acts.style.cssText = "display:inline-flex;align-items:center;gap:6px;";
          var goA = doc.createElement("a");
          goA.href = R + it.page + "?fluo=" + encodeURIComponent(it.id);
          goA.textContent = "↗ Ouvrir le cours";
          goA.style.cssText = "font-size:11px;font-weight:900;color:#0284c7;text-decoration:none;";
          var delB = doc.createElement("button");
          delB.type = "button";
          delB.textContent = "🗑️";
          delB.title = "Retirer ce surlignage";
          delB.style.cssText = "border:1px solid #fecaca;background:#fef2f2;border-radius:7px;padding:2px 6px;font-size:11px;cursor:pointer;";
          delB.addEventListener("click", function () {
            supprimerSurlignageParIdOuBloc(it.id, null);
            rendreTiroir();
          });
          acts.appendChild(goA);
          acts.appendChild(delB);
          topRow.appendChild(tagSpan);
          topRow.appendChild(acts);
          card.appendChild(topRow);

          var txtDiv = doc.createElement("div");
          txtDiv.style.cssText = "font-size:12.5px;line-height:1.45;color:#23201a;font-weight:700;";
          txtDiv.textContent = "« " + (it.texte || "") + " »";
          card.appendChild(txtDiv);

          if (it.note) {
            var nDiv = doc.createElement("div");
            nDiv.style.cssText = "font-size:11.5px;color:#92400e;font-weight:800;";
            nDiv.textContent = "📌 Note : " + it.note;
            card.appendChild(nDiv);
          }
          body.appendChild(card);
        });
      }

      box.appendChild(body);
      fluoDrawerOv.appendChild(box);
    }

    rendreTiroir();
    fluoDrawerOv.style.display = "flex";
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     PARTIE 2 : 🦴 RAYONS X HTML / CSS (Box-Model, Sémantique, Flex/Grid, Forms)
     ═══════════════════════════════════════════════════════════════════════════ */
  var xrayActif = false;
  var xrayFiltre = "all"; /* all | sem | layout | form */
  var xrayFige = false;
  var xrayCible = null;
  var xrayHudEl = null;
  var xrayLayerEl = null;
  var xrayBmMargin = null;
  var xrayBmPadding = null;
  var xrayBmContent = null;
  var xrayCardEl = null;
  var xrayPills = [];

  function marquerConteneursFlexGrid() {
    var tous = doc.body ? doc.body.getElementsByTagName("*") : [];
    var maxScan = Math.min(tous.length, 1600);
    for (var i = 0; i < maxScan; i++) {
      var el = tous[i];
      if (estElementInterfaceSTI(el)) continue;
      var dp = "";
      try { dp = window.getComputedStyle(el).display || ""; } catch (e) {}
      if (dp === "flex" || dp === "inline-flex") {
        el.setAttribute("data-sti-xray-layout", "flex");
      } else if (dp === "grid" || dp === "inline-grid") {
        el.setAttribute("data-sti-xray-layout", "grid");
      } else if (el.hasAttribute("data-sti-xray-layout")) {
        el.removeAttribute("data-sti-xray-layout");
      }
    }
  }

  function effacerBadgesEtiquettesXray() {
    for (var i = 0; i < xrayPills.length; i++) {
      if (xrayPills[i] && xrayPills[i].parentNode) xrayPills[i].parentNode.removeChild(xrayPills[i]);
    }
    xrayPills = [];
  }

  function peindreBadgesEtiquettesXray() {
    effacerBadgesEtiquettesXray();
    if (!xrayActif || !xrayLayerEl) return;
    var selecteur = "";
    if (xrayFiltre === "sem") selecteur = "header,nav,main,section,article,aside,footer";
    else if (xrayFiltre === "layout") selecteur = "[data-sti-xray-layout]";
    else if (xrayFiltre === "form") selecteur = "form,fieldset,table,input[id],input[name],select[id],select[name],textarea[id],textarea[name]";
    else selecteur = "header,nav,main,section,article,aside,footer,[data-sti-xray-layout],form,table";

    var nodes = doc.querySelectorAll(selecteur);
    var vh = window.innerHeight || 800;
    var vw = window.innerWidth || 1024;
    var nb = 0;
    for (var i = 0; i < nodes.length && nb < 42; i++) {
      var el = nodes[i];
      if (estElementInterfaceSTI(el)) continue;
      var r = el.getBoundingClientRect();
      if (r.width < 28 || r.height < 18 || r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) continue;

      var tag = el.tagName.toLowerCase();
      var lay = el.getAttribute("data-sti-xray-layout");
      var bg = "#ea580c";
      var txt = "<" + tag + ">";
      if (lay === "flex") { bg = "#9333ea"; txt = "<" + tag + "> · flex"; }
      else if (lay === "grid") { bg = "#0891b2"; txt = "<" + tag + "> · grid"; }
      else if (tag === "form" || tag === "input" || tag === "select" || tag === "textarea" || tag === "table" || tag === "fieldset") {
        bg = "#059669";
        var idN = el.id ? ("#" + el.id) : (el.getAttribute("name") ? ("[name=" + el.getAttribute("name") + "]") : "");
        txt = "<" + tag + idN + ">";
      }

      var pill = doc.createElement("span");
      pill.className = "sti-xray-tag-pill";
      pill.style.background = bg;
      pill.style.left = Math.max(4, Math.min(vw - 130, Math.round(r.left + 3))) + "px";
      pill.style.top = Math.max(4, Math.round(r.top + 3)) + "px";
      pill.textContent = txt;
      xrayLayerEl.appendChild(pill);
      xrayPills.push(pill);
      nb++;
    }
  }

  function pxNum(v) {
    var n = parseFloat(v || "0");
    return isFinite(n) ? Math.round(n) : 0;
  }

  function inspecterElementXray(el) {
    if (!el || el.nodeType !== 1 || estElementInterfaceSTI(el) || el === doc.documentElement || el === doc.body) return;
    xrayCible = el;
    var r = el.getBoundingClientRect();
    var cs = window.getComputedStyle(el);
    var mt = pxNum(cs.marginTop), mr = pxNum(cs.marginRight), mb = pxNum(cs.marginBottom), ml = pxNum(cs.marginLeft);
    var pt = pxNum(cs.paddingTop), pr = pxNum(cs.paddingRight), pb = pxNum(cs.paddingBottom), pl = pxNum(cs.paddingLeft);
    var bt = pxNum(cs.borderTopWidth), br = pxNum(cs.borderRightWidth), bb = pxNum(cs.borderBottomWidth), bl = pxNum(cs.borderLeftWidth);

    /* 1) Margin box (ambre) */
    xrayBmMargin.style.display = "block";
    xrayBmMargin.style.left = (r.left - ml) + "px";
    xrayBmMargin.style.top = (r.top - mt) + "px";
    xrayBmMargin.style.width = Math.max(0, r.width + ml + mr) + "px";
    xrayBmMargin.style.height = Math.max(0, r.height + mt + mb) + "px";

    /* 2) Padding box (émeraude) */
    xrayBmPadding.style.display = "block";
    xrayBmPadding.style.left = (r.left + bl) + "px";
    xrayBmPadding.style.top = (r.top + bt) + "px";
    xrayBmPadding.style.width = Math.max(0, r.width - bl - br) + "px";
    xrayBmPadding.style.height = Math.max(0, r.height - bt - bb) + "px";

    /* 3) Content box (bleu vif) */
    xrayBmContent.style.display = "block";
    xrayBmContent.style.left = (r.left + bl + pl) + "px";
    xrayBmContent.style.top = (r.top + bt + pt) + "px";
    xrayBmContent.style.width = Math.max(0, r.width - bl - br - pl - pr) + "px";
    xrayBmContent.style.height = Math.max(0, r.height - bt - bb - pt - pb) + "px";

    /* 4) Fiche pédagogique détaillée */
    var tag = el.tagName.toLowerCase();
    var idStr = el.id ? ("#" + el.id) : "";
    var clsList = String(el.className || "").trim().split(/\s+/).filter(function (c) {
      return c && c.indexOf("sti-") !== 0;
    }).slice(0, 2);
    var clsStr = clsList.length ? ("." + clsList.join(".")) : "";
    var dp = cs.display || "block";
    var pos = cs.position || "static";

    var lignes = [];
    lignes.push("<div style='font:900 13px/1.25 ui-monospace,Consolas,monospace;color:#fde047;word-break:break-all'>&lt;" + tag + idStr + clsStr + "&gt;" + (xrayFige ? " 📌" : "") + "</div>");
    lignes.push("<div style='display:flex;gap:8px;flex-wrap:wrap;margin-top:4px;font-size:11px'>" +
      "<span style='background:#1e3a8a;color:#bfdbfe;padding:2px 7px;border-radius:6px;font-weight:900'>📐 " + Math.round(r.width) + " × " + Math.round(r.height) + " px</span>" +
      "<span style='background:#312e81;color:#e0e7ff;padding:2px 7px;border-radius:6px;font-weight:900'>display: " + dp + "</span>" +
      (pos !== "static" ? ("<span style='background:#7c2d12;color:#fed7aa;padding:2px 7px;border-radius:6px;font-weight:900'>position: " + pos + "</span>") : "") +
    "</div>");
    lignes.push("<div style='margin-top:6px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;font-size:10.5px;text-align:center'>" +
      "<div style='background:rgba(249,115,22,.22);border:1px solid #f97316;border-radius:7px;padding:3px'><b style='color:#fdba74'>margin</b><br>" + mt + " " + mr + " " + mb + " " + ml + "</div>" +
      "<div style='background:rgba(16,185,129,.22);border:1px solid #10b981;border-radius:7px;padding:3px'><b style='color:#6ee7b7'>padding</b><br>" + pt + " " + pr + " " + pb + " " + pl + "</div>" +
      "<div style='background:rgba(59,130,246,.24);border:1px solid #3b82f6;border-radius:7px;padding:3px'><b style='color:#93c5fd'>border</b><br>" + bt + "px</div>" +
    "</div>");

    if (dp === "flex" || dp === "inline-flex") {
      lignes.push("<div style='margin-top:5px;padding:4px 7px;border-radius:7px;background:rgba(168,85,247,.2);border:1px solid #a855f7;font-size:10.5px;color:#f3e8ff'>" +
        "<b>Flexbox :</b> direction: <code>" + cs.flexDirection + "</code> · justify: <code>" + cs.justifyContent + "</code> · align: <code>" + cs.alignItems + "</code>" + (cs.gap && cs.gap !== "normal" ? (" · gap: <code>" + cs.gap + "</code>") : "") +
      "</div>");
    } else if (dp === "grid" || dp === "inline-grid") {
      lignes.push("<div style='margin-top:5px;padding:4px 7px;border-radius:7px;background:rgba(6,182,212,.2);border:1px solid #06b6d4;font-size:10.5px;color:#cffafe'>" +
        "<b>CSS Grid :</b> gap: <code>" + (cs.gap || "0px") + "</code>" +
      "</div>");
    }

    if (tag === "input" || tag === "select" || tag === "textarea" || tag === "form") {
      var tp = el.getAttribute("type") || tag;
      var nm = el.getAttribute("name") || "—";
      var rq = el.hasAttribute("required") ? " · required ✅" : "";
      lignes.push("<div style='margin-top:5px;padding:4px 7px;border-radius:7px;background:rgba(16,185,129,.18);border:1px solid #10b981;font-size:10.5px;color:#d1fae5'>" +
        "<b>Formulaire :</b> type=<code>" + tp + "</code> · name=<code>" + nm + "</code>" + rq +
      "</div>");
    }

    xrayCardEl.innerHTML = lignes.join("");
    xrayCardEl.style.display = "block";

    var vw = window.innerWidth || 1024;
    var vh = window.innerHeight || 768;
    var cw = 304;
    var ch = xrayCardEl.offsetHeight || 138;
    var left = r.left;
    if (left + cw + 12 > vw) left = vw - cw - 12;
    if (left < 12) left = 12;
    var top = r.bottom + 14;
    if (top + ch + 14 > vh) top = r.top - ch - 14;
    if (top < 58) top = Math.min(vh - ch - 12, 62);
    xrayCardEl.style.left = Math.round(left) + "px";
    xrayCardEl.style.top = Math.round(top) + "px";
  }

  function construireDomXray() {
    if (xrayHudEl) return;
    injecterStylesGlobaux();

    var layer = doc.createElement("div");
    layer.id = "sti-xray-layer";
    layer.className = "sti-no-print";
    layer.style.cssText = "position:fixed;inset:0;z-index:2147483641;pointer-events:none;display:none;";

    xrayBmMargin = doc.createElement("div");
    xrayBmMargin.style.cssText = "position:fixed;display:none;background:rgba(249,115,22,.22);border:1.5px dashed #f97316;pointer-events:none;transition:all .06s linear;";
    xrayBmPadding = doc.createElement("div");
    xrayBmPadding.style.cssText = "position:fixed;display:none;background:rgba(16,185,129,.22);border:1.5px solid #10b981;pointer-events:none;transition:all .06s linear;";
    xrayBmContent = doc.createElement("div");
    xrayBmContent.style.cssText = "position:fixed;display:none;background:rgba(59,130,246,.28);border:1.5px solid #60a5fa;pointer-events:none;transition:all .06s linear;";

    xrayCardEl = doc.createElement("div");
    xrayCardEl.id = "sti-xray-inspector";
    xrayCardEl.style.cssText =
      "position:fixed;left:14px;bottom:14px;width:304px;max-width:92vw;display:none;padding:10px 12px;" +
      "border-radius:16px;background:rgba(15,23,42,.96);color:#f8fafc;border:2px solid #38bdf8;" +
      "box-shadow:0 20px 48px rgba(0,0,0,.5);font:700 11.5px/1.35 'Comic Sans MS','Segoe UI',system-ui,sans-serif;pointer-events:none;";

    layer.appendChild(xrayBmMargin);
    layer.appendChild(xrayBmPadding);
    layer.appendChild(xrayBmContent);
    layer.appendChild(xrayCardEl);
    (doc.body || doc.documentElement).appendChild(layer);
    xrayLayerEl = layer;

    var hud = doc.createElement("div");
    hud.id = "sti-xray-hud";
    hud.className = "sti-no-print";
    hud.style.cssText =
      "position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:2147483644;display:none;" +
      "align-items:center;gap:6px;flex-wrap:wrap;justify-content:center;max-width:96vw;" +
      "padding:7px 11px;border-radius:999px;background:rgba(15,23,42,.95);color:#f8fafc;" +
      "border:2px solid #38bdf8;box-shadow:0 16px 38px rgba(0,0,0,.45);" +
      "font:800 12px/1.2 'Comic Sans MS','Comic Neue',system-ui,sans-serif;";

    var title = doc.createElement("span");
    title.textContent = "🦴 Rayons X :";
    title.style.cssText = "padding:0 4px;color:#38bdf8;font-weight:900;";
    hud.appendChild(title);

    var btnsFiltres = {};
    [
      { k: "all", lbl: "🌐 Tout" },
      { k: "sem", lbl: "🏗️ Sémantique" },
      { k: "layout", lbl: "📐 Flex & Grid" },
      { k: "form", lbl: "📋 Form & Table" }
    ].forEach(function (f) {
      var b = doc.createElement("button");
      b.type = "button";
      b.textContent = f.lbl;
      b.setAttribute("data-xray-mode", f.k);
      b.style.cssText = "border:1.5px solid rgba(255,255,255,.22);border-radius:999px;padding:5px 10px;font:900 11.5px/1 inherit;cursor:pointer;";
      b.addEventListener("click", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        xrayFiltre = f.k;
        if (doc.body) doc.body.setAttribute("data-xray-filter", xrayFiltre);
        majBtnsXray();
        marquerConteneursFlexGrid();
        peindreBadgesEtiquettesXray();
      });
      btnsFiltres[f.k] = b;
      hud.appendChild(b);
    });

    var btnFreeze = doc.createElement("button");
    btnFreeze.type = "button";
    btnFreeze.textContent = "📌 Figer (Shift+Clic)";
    btnFreeze.style.cssText = "border:1.5px solid rgba(255,255,255,.25);border-radius:999px;padding:5px 10px;font:800 11px/1 inherit;cursor:pointer;";
    btnFreeze.addEventListener("click", function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      xrayFige = !xrayFige;
      majBtnsXray();
    });
    hud.appendChild(btnFreeze);

    var leg = doc.createElement("span");
    leg.innerHTML = "<span style='color:#fdba74'>■</span>margin <span style='color:#6ee7b7'>■</span>padding <span style='color:#93c5fd'>■</span>content";
    leg.style.cssText = "font-size:10.5px;padding:0 4px;color:#cbd5e1;";
    hud.appendChild(leg);

    var bExit = doc.createElement("button");
    bExit.type = "button";
    bExit.textContent = "✕";
    bExit.title = "Désactiver Rayons X (Échap)";
    bExit.style.cssText = "border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.1);color:#fff;border-radius:999px;padding:5px 9px;font:900 11.5px/1 inherit;cursor:pointer;";
    bExit.addEventListener("click", function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      basculerRayonsXSTI(false);
    });
    hud.appendChild(bExit);

    function majBtnsXray() {
      Object.keys(btnsFiltres).forEach(function (k) {
        var on = xrayFiltre === k;
        btnsFiltres[k].style.background = on ? "#38bdf8" : "rgba(255,255,255,.10)";
        btnsFiltres[k].style.color = on ? "#082f49" : "#f8fafc";
        btnsFiltres[k].style.borderColor = on ? "#ffffff" : "rgba(255,255,255,.22)";
      });
      btnFreeze.style.background = xrayFige ? "#f59e0b" : "rgba(255,255,255,.10)";
      btnFreeze.style.color = xrayFige ? "#451a03" : "#f8fafc";
      btnFreeze.textContent = xrayFige ? "📌 Figé (cliquer pr libérer)" : "📌 Figer (Shift+Clic)";
    }
    hud._majBtns = majBtnsXray;
    majBtnsXray();

    (doc.body || doc.documentElement).appendChild(hud);
    xrayHudEl = hud;
  }

  function onXrayPointerMove(ev) {
    if (!xrayActif || xrayFige) return;
    var t = ev.target;
    if (!t || estElementInterfaceSTI(t)) return;
    inspecterElementXray(t);
  }

  function onXrayClick(ev) {
    if (!xrayActif || estElementInterfaceSTI(ev.target)) return;
    if (ev.shiftKey) {
      ev.preventDefault();
      ev.stopPropagation();
      xrayFige = !xrayFige;
      if (xrayFige) inspecterElementXray(ev.target);
      if (xrayHudEl && xrayHudEl._majBtns) xrayHudEl._majBtns();
    }
  }

  function onXrayScrollResize() {
    if (!xrayActif) return;
    peindreBadgesEtiquettesXray();
    if (xrayCible) inspecterElementXray(xrayCible);
  }

  function majBoutonsExternesXray() {
    var btnPc = doc.getElementById("sti-btn-pc-xray");
    if (btnPc) {
      btnPc.style.background = xrayActif ? "#38bdf8" : "#fffdf7";
      btnPc.style.color = xrayActif ? "#082f49" : "#23201a";
    }
  }

  function basculerRayonsXSTI(forcerEtat) {
    var nv = typeof forcerEtat === "boolean" ? forcerEtat : !xrayActif;
    if (nv && fluoActif) basculerSurligneurSTI(false);
    xrayActif = nv;
    construireDomXray();
    if (xrayActif) {
      xrayFige = false;
      if (doc.body) {
        doc.body.classList.add("sti-xray-actif");
        doc.body.setAttribute("data-xray-filter", xrayFiltre);
      }
      marquerConteneursFlexGrid();
      xrayLayerEl.style.display = "block";
      xrayHudEl.style.display = "inline-flex";
      if (xrayHudEl._majBtns) xrayHudEl._majBtns();
      peindreBadgesEtiquettesXray();
      doc.addEventListener("mouseover", onXrayPointerMove, true);
      doc.addEventListener("touchstart", onXrayPointerMove, { passive: true, capture: true });
      doc.addEventListener("click", onXrayClick, true);
      window.addEventListener("scroll", onXrayScrollResize, true);
      window.addEventListener("resize", onXrayScrollResize);
    } else {
      if (doc.body) {
        doc.body.classList.remove("sti-xray-actif");
        doc.body.removeAttribute("data-xray-filter");
      }
      effacerBadgesEtiquettesXray();
      if (xrayLayerEl) xrayLayerEl.style.display = "none";
      if (xrayHudEl) xrayHudEl.style.display = "none";
      xrayCible = null;
      doc.removeEventListener("mouseover", onXrayPointerMove, true);
      doc.removeEventListener("touchstart", onXrayPointerMove, true);
      doc.removeEventListener("click", onXrayClick, true);
      window.removeEventListener("scroll", onXrayScrollResize, true);
      window.removeEventListener("resize", onXrayScrollResize);
    }
    majBoutonsExternesXray();
    return xrayActif;
  }

  /* Raccourcis clavier universels : Alt+X = Rayons X | Alt+H = Surligneur Fluo | Échap = Fermer */
  doc.addEventListener("keydown", function (ev) {
    if (ev.altKey && !ev.ctrlKey && !ev.metaKey) {
      var k = String(ev.key || "").toLowerCase();
      if (k === "x") {
        ev.preventDefault();
        basculerRayonsXSTI();
      } else if (k === "h") {
        ev.preventDefault();
        basculerSurligneurSTI();
      }
    } else if (ev.key === "Escape") {
      if (fluoDrawerOv && fluoDrawerOv.style.display === "flex") {
        fluoDrawerOv.style.display = "none";
      } else if (xrayActif) {
        basculerRayonsXSTI(false);
      } else if (fluoActif) {
        basculerSurligneurSTI(false);
      }
    }
  });

  /* Exposition API publique STI V2.0 */
  window.basculerRayonsXSTI = basculerRayonsXSTI;
  window.basculerSurligneurSTI = basculerSurligneurSTI;
  window.ouvrirMesPassagesSurlignesSTI = ouvrirMesPassagesSurlignesSTI;
  window.STI_SURLIGNEUR = {
    CLE: CLE_FLUO,
    COULEURS: COULEURS_FLUO,
    lireTous: lireTousSurlignages,
    supprimer: function (id) { supprimerSurlignageParIdOuBloc(id, null); },
    restaurerPage: restaurerSurlignagesPageCourante
  };

  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", restaurerSurlignagesPageCourante);
  } else {
    restaurerSurlignagesPageCourante();
  }
})();
