/* ═══════════════════════════════════════════════════════════════════════════
   STI V2.0 — Navigation et interactions du cours HTML5
   - Le contenu pédagogique et les gabarits « Agrandir » viennent du cours existant.
   - Les seules données écrites passent par l'API STIProfil (clé sti-profil-abonne).
   - Les aperçus de code s'exécutent dans des iframes sandbox sans même origine.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (global, document) {
  "use strict";

  /* Le guide d'origine est remplacé ici par le guide intégré à la nouvelle page.
     Le reste du script de protection existant continue à être chargé sans changement. */
  global.__stiGuideVocalInit = true;

  var MATIERE = "html5";
  var VIDEO_COURS = "html5-cours";
  var VIDEO_DEMO = "html5-demo";
  /* v500 : le TP « événements, liens et arrière-plans » est commun à HTML5 et CSS3. */
  var VIDEO_TP = "tp-evenements-liens";
  /* v502 : second TP pas à pas, formulaire, tableau et autres balises. */
  var VIDEO_TP_FORMULAIRE = "tp-formulaire-tableau-autre";
  /* v510 : capsule « display, float et position ». */
  var VIDEO_TP_DISPLAY = "tp-display-float-position";
  var CHAPITRES = [
    { id: "entete", titre: "Éléments d'en-tête / 1er niveau", temps: 0.00 },
    { id: "structuration", titre: "Structuration d'une page web", temps: 45.09 },
    { id: "conteneurs", titre: "Conteneurs", temps: 69.64 },
    { id: "listes", titre: "Listes", temps: 93.86 },
    { id: "tableaux", titre: "Tableaux", temps: 126.81 },
    { id: "texte-media", titre: "Texte & média", temps: 161.32 },
    { id: "attributs-evenements", titre: "Attributs globaux & événements", temps: 210.04 },
    { id: "target-explication", titre: "L'attribut target", temps: 250.84 },
    { id: "formulaires", titre: "Formulaires & types d'input", temps: 272.46 },
    { id: "iframe", titre: "Intégrer une page : iframe", temps: 339.33 }
  ];
  var ONGLETS = ["cours", "exercices", "annexes", "videos"];
  var ongletActif = "cours";
  var chapitreActif = CHAPITRES[0].id;
  var retourFocusModal = null;
  var elementsInertesModale = [];
  var defilementCours = 0;
  var defilementCoursConnu = false;
  var restaurationEnCours = false;
  var audioLigne = null;
  var miseAJourLecture = 0;
  var candidatLecture = "";
  var dernierChapitreEnregistre = "";
  var fonctionsApercu = [];

  function un(selecteur, racine) { return (racine || document).querySelector(selecteur); }
  function tous(selecteur, racine) { return Array.prototype.slice.call((racine || document).querySelectorAll(selecteur)); }
  function profil() { return global.STIProfil ? global.STIProfil.chargerProfil() : null; }
  function echapper(texte) {
    return String(texte == null ? "" : texte).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function tempsLisible(secondes) {
    var s = Math.max(0, Math.floor(Number(secondes) || 0));
    return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
  }
  function chapitre(id) {
    return CHAPITRES.find(function (c) { return c.id === id; });
  }
  function actualiserUrl(fragment, ajouterHistorique) {
    if (global.location.hash === "#" + fragment) return;
    try {
      global.history[ajouterHistorique ? "pushState" : "replaceState"](null, "", "#" + fragment);
    } catch (e) {}
  }

  /* ── Onglets et liens d'ancrage historiques ── */
  function activerOnglet(nom, ajouterHistorique, restaurerPosition) {
    var cible = ONGLETS.indexOf(nom) >= 0 ? nom : "cours";
    var precedent = ongletActif;
    if (precedent === "cours" && cible !== "cours") {
      defilementCours = global.scrollY;
      defilementCoursConnu = true;
      if (miseAJourLecture) {
        global.clearTimeout(miseAJourLecture);
        miseAJourLecture = 0;
        enregistrerLectureCourante();
      }
      candidatLecture = "";
    }
    ongletActif = cible;
    tous("[data-course-tab]").forEach(function (bouton) {
      var actif = bouton.getAttribute("data-course-tab") === cible;
      bouton.setAttribute("aria-selected", String(actif));
      bouton.tabIndex = actif ? 0 : -1;
    });
    tous("[data-course-panel]").forEach(function (panneau) {
      panneau.hidden = panneau.getAttribute("data-course-panel") !== cible;
    });
    if (ajouterHistorique) actualiserUrl(cible, true);
    if (cible !== "cours") fermerSommaire();
    actualiserProgression();
    /* En revenant d'un autre onglet, conserver le chapitre et la position de lecture. */
    if (cible === "cours" && precedent !== "cours" && defilementCoursConnu && restaurerPosition !== false) {
      restaurationEnCours = true;
      global.requestAnimationFrame(function () {
        var racine = document.documentElement;
        var ancienComportement = racine.style.scrollBehavior;
        racine.style.scrollBehavior = "auto";
        global.scrollTo(0, defilementCours);
        global.requestAnimationFrame(function () {
          racine.style.scrollBehavior = ancienComportement;
          restaurationEnCours = false;
        });
      });
    }
  }

  function allerAuChapitre(id, mettreUrl, deplacer) {
    var c = chapitre(id);
    var section = document.getElementById(id);
    if (!c || !section) return;
    if (miseAJourLecture) { global.clearTimeout(miseAJourLecture); miseAJourLecture = 0; }
    candidatLecture = "";
    chapitreActif = id;
    /* Une recherche ne doit pas empêcher un lien direct vers un chapitre filtré. */
    if (section.hidden) {
      var champ = document.getElementById("courseSearchInput");
      if (champ) { champ.value = ""; champ.dispatchEvent(new Event("input", { bubbles: true })); }
    }
    activerOnglet("cours", false, false);
    fermerSommaire();
    if (mettreUrl) actualiserUrl(id, true);
    /* Une ancre peut rester sous la barre mobile sans déclencher de défilement. */
    enregistrerLectureCourante();
    actualiserProgression();
    if (deplacer !== false) {
      global.requestAnimationFrame(function () {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  function appliquerFragment() {
    var fragment = decodeURIComponent(String(global.location.hash || "").replace(/^#/, ""));
    if (ONGLETS.indexOf(fragment) >= 0) {
      activerOnglet(fragment, false);
    } else if (chapitre(fragment)) {
      allerAuChapitre(fragment, false, true);
    } else if (fragment.indexOf("exo-") === 0 && document.getElementById(fragment)) {
      activerOnglet("exercices", false);
      global.requestAnimationFrame(function () {
        document.getElementById(fragment).scrollIntoView({ block: "start" });
      });
    }
  }

  function initialiserOnglets() {
    var p = profil();
    if (p && p.derniereLecture && p.derniereLecture.matiere === MATIERE && chapitre(p.derniereLecture.chapitreId)) {
      chapitreActif = p.derniereLecture.chapitreId;
    }
    document.addEventListener("click", function (ev) {
      var tab = ev.target.closest("[data-course-tab]");
      if (tab) {
        ev.preventDefault();
        activerOnglet(tab.getAttribute("data-course-tab"), true);
        return;
      }
      var lienChapitre = ev.target.closest('a[href^="#"]');
      if (lienChapitre) {
        var id = lienChapitre.getAttribute("href").slice(1);
        if (chapitre(id)) {
          ev.preventDefault();
          allerAuChapitre(id, true, true);
          return;
        }
      }
      var exercice = ev.target.closest("[data-goto-exo]");
      if (exercice) {
        ev.preventDefault();
        activerOnglet("exercices", true);
        var cible = document.getElementById(exercice.getAttribute("data-goto-exo"));
        if (cible) global.requestAnimationFrame(function () { cible.scrollIntoView({ behavior: "smooth", block: "start" }); });
      }
    });

    /* Flèches, Début et Fin permettent de parcourir la liste d'onglets au clavier. */
    var liste = un('[role="tablist"][aria-label="Sections HTML5"]');
    if (liste) liste.addEventListener("keydown", function (ev) {
      var boutons = tous('[role="tab"]', liste);
      var index = boutons.indexOf(document.activeElement);
      if (index < 0) return;
      var suivant = index;
      var sens = document.documentElement.dir === "rtl" ? -1 : 1;
      if (ev.key === "ArrowRight") suivant = (index + sens + boutons.length) % boutons.length;
      else if (ev.key === "ArrowLeft") suivant = (index - sens + boutons.length) % boutons.length;
      else if (ev.key === "Home") suivant = 0;
      else if (ev.key === "End") suivant = boutons.length - 1;
      else return;
      ev.preventDefault();
      activerOnglet(boutons[suivant].getAttribute("data-course-tab"), true);
      boutons[suivant].focus();
    });
    global.addEventListener("hashchange", appliquerFragment);
    appliquerFragment();
  }

  /* ── Sommaire, progression et dernière lecture ── */
  function fermerSommaire(rendreFocus) {
    var aside = document.getElementById("courseSidebar");
    var fond = document.getElementById("courseSidebarBackdrop");
    var bouton = document.getElementById("tocMobileOpenBtn");
    if (!aside || !fond) return;
    var etaitOuvert = aside.classList.contains("is-open");
    aside.classList.remove("is-open");
    fond.classList.remove("is-open");
    if (bouton) bouton.setAttribute("aria-expanded", "false");
    if (global.matchMedia("(max-width: 979px)").matches) {
      aside.setAttribute("aria-hidden", "true");
      aside.inert = true;
    } else {
      aside.removeAttribute("aria-hidden");
      aside.inert = false;
    }
    if (rendreFocus && etaitOuvert && bouton) bouton.focus();
  }

  function ouvrirSommaire() {
    var aside = document.getElementById("courseSidebar");
    var fond = document.getElementById("courseSidebarBackdrop");
    var bouton = document.getElementById("tocMobileOpenBtn");
    if (!aside || !fond || !global.matchMedia("(max-width: 979px)").matches) return;
    if (ongletActif !== "cours") activerOnglet("cours", true, false);
    aside.inert = false;
    aside.removeAttribute("aria-hidden");
    aside.classList.add("is-open");
    fond.classList.add("is-open");
    if (bouton) bouton.setAttribute("aria-expanded", "true");
    var fermer = document.getElementById("tocMobileCloseBtn");
    if (fermer) fermer.focus();
  }

  function actualiserProgression() {
    var p = profil();
    var etats = p && p.chapitres ? p.chapitres[MATIERE] || {} : {};
    var consultes = 0, revises = 0;
    CHAPITRES.forEach(function (c) {
      var revise = etats[c.id] === "revise";
      if (revise) revises++;
      if (revise || etats[c.id] === "en_cours") consultes++;
      var etat = revise ? "revise" : (etats[c.id] === "en_cours" || chapitreActif === c.id ? "en_cours" : "a_reviser");
      var lien = un('.toc-link[href="#' + c.id + '"]');
      if (lien) {
        lien.dataset.state = etat;
        lien.classList.toggle("is-active", chapitreActif === c.id);
        if (chapitreActif === c.id) lien.setAttribute("aria-current", "location");
        else lien.removeAttribute("aria-current");
        var statut = un(".toc-link__status", lien);
        if (statut) statut.textContent = revise ? "✓ Révisé" : (etat === "en_cours" ? "En cours" : "À réviser");
      }
      var section = document.getElementById(c.id);
      if (section) section.classList.toggle("is-revised", revise);
      var bouton = un('[data-toggle-revise="' + c.id + '"]');
      if (bouton) {
        bouton.setAttribute("aria-pressed", String(revise));
        bouton.textContent = revise ? "✓ Chapitre révisé" : "☐ Marquer comme révisé";
      }
    });
    var pct = Math.round(consultes / CHAPITRES.length * 100);
    var cercle = document.getElementById("courseRingFill");
    if (cercle) {
      var longueur = 2 * Math.PI * 26;
      cercle.style.strokeDasharray = String(longueur);
      cercle.style.strokeDashoffset = String(longueur * (1 - pct / 100));
    }
    var pourcentage = document.getElementById("courseRingPct");
    if (pourcentage) pourcentage.textContent = pct + "%";
    var compteur = document.getElementById("courseRingCount");
    if (compteur) compteur.textContent = consultes + " / " + CHAPITRES.length + " chapitres consultés";
    var compteurRevisions = document.getElementById("courseRevisedCount");
    if (compteurRevisions) compteurRevisions.textContent = revises + " / " + CHAPITRES.length + " chapitres révisés";
    var compteurMobile = document.getElementById("tocMobileCount");
    if (compteurMobile) {
      compteurMobile.textContent = consultes + "/" + CHAPITRES.length;
      compteurMobile.setAttribute("aria-label", consultes + " sur " + CHAPITRES.length + " chapitres consultés");
    }

    var index = CHAPITRES.findIndex(function (c) { return c.id === chapitreActif; });
    if (index < 0) index = 0;
    [["prevChapterBtn", index - 1], ["nextChapterBtn", index + 1]].forEach(function (paire) {
      var bouton = document.getElementById(paire[0]);
      if (!bouton) return;
      var voisin = CHAPITRES[paire[1]];
      bouton.hidden = !voisin;
      if (!voisin) return;
      bouton.href = "#" + voisin.id;
      var texte = un(".chapter-nav-btn__label", bouton);
      if (texte) texte.textContent = (paire[0] === "prevChapterBtn" ? "← " : "") + (paire[1] + 1) + ". " + voisin.titre + (paire[0] === "nextChapterBtn" ? " →" : "");
    });
  }

  function enregistrerLectureCourante() {
    if (!global.STIProfil || ongletActif !== "cours") return;
    var section = document.getElementById(chapitreActif);
    var c = chapitre(chapitreActif);
    if (!section || !c || section.hidden) return;
    var index = CHAPITRES.indexOf(c);
    var rect = section.getBoundingClientRect();
    /* Pourcentage indicatif dans le chapitre actif, puis dans le cours complet. */
    var part = Math.min(1, Math.max(0, (150 - rect.top) / Math.max(1, rect.height)));
    var pct = Math.round((index + part) / CHAPITRES.length * 100);
    global.STIProfil.enregistrerLecture(MATIERE, c.id, "HTML5 — " + (index + 1) + ". " + c.titre, pct, "cours/html5.html#" + c.id);
    dernierChapitreEnregistre = c.id;
  }

  function initialiserSommaire() {
    var boutonOuvrir = document.getElementById("tocMobileOpenBtn");
    var boutonFermer = document.getElementById("tocMobileCloseBtn");
    var fond = document.getElementById("courseSidebarBackdrop");
    if (boutonOuvrir) boutonOuvrir.addEventListener("click", ouvrirSommaire);
    if (boutonFermer) boutonFermer.addEventListener("click", function () { fermerSommaire(true); });
    if (fond) fond.addEventListener("click", function () { fermerSommaire(true); });
    global.addEventListener("resize", function () { fermerSommaire(false); });
    document.addEventListener("keydown", function (ev) {
      var aside = document.getElementById("courseSidebar");
      if (!aside || !aside.classList.contains("is-open")) return;
      if (ev.key === "Escape") { fermerSommaire(true); return; }
      if (ev.key === "Tab") {
        var liste = focusables(aside);
        if (!liste.length) return;
        if (ev.shiftKey && document.activeElement === liste[0]) { ev.preventDefault(); liste[liste.length - 1].focus(); }
        else if (!ev.shiftKey && document.activeElement === liste[liste.length - 1]) { ev.preventDefault(); liste[0].focus(); }
      }
    });
    fermerSommaire(false);

    document.addEventListener("click", function (ev) {
      var bouton = ev.target.closest("[data-toggle-revise]");
      if (!bouton || !global.STIProfil) return;
      var id = bouton.getAttribute("data-toggle-revise");
      var p = profil();
      var courant = p && p.chapitres && p.chapitres.html5[id];
      p = global.STIProfil.definirEtatChapitre(MATIERE, id, courant === "revise" ? "en_cours" : "revise", 0);
      /* Ne compter que les identifiants encore présents dans ce cours. */
      var termine = CHAPITRES.every(function (c) { return p.chapitres[MATIERE][c.id] === "revise"; });
      if (p.progression[MATIERE] !== termine) global.STIProfil.mettreAJour("progression." + MATIERE, termine);
    });

    var champ = document.getElementById("courseSearchInput");
    if (champ) champ.addEventListener("input", function () {
      var terme = champ.value.trim().toLocaleLowerCase("fr");
      CHAPITRES.forEach(function (c) {
        var section = document.getElementById(c.id);
        if (section) section.hidden = Boolean(terme && section.textContent.toLocaleLowerCase("fr").indexOf(terme) < 0);
      });
    });
    function rechercherDansCours() {
      if (typeof global.ouvrirRechercheGlobaleSTI === "function") return;
      activerOnglet("cours", true);
      ouvrirSommaire();
      if (champ) champ.focus();
    }
    var declencheur = un("[data-course-search-trigger]");
    if (declencheur) declencheur.addEventListener("click", rechercherDansCours);
    document.addEventListener("keydown", function (ev) {
      if ((ev.ctrlKey || ev.metaKey) && String(ev.key).toLowerCase() === "k" && typeof global.ouvrirRechercheGlobaleSTI !== "function") {
        ev.preventDefault();
        rechercherDansCours();
      }
    });

    var boutonHaut = document.getElementById("backToTop");
    if (boutonHaut) boutonHaut.addEventListener("click", function () {
      closeModal();
      global.scrollTo({ top: 0, behavior: "smooth" });
    });
    var raf = 0;
    function suivreDefilement() {
      if (raf) return;
      raf = global.requestAnimationFrame(function () {
        raf = 0;
        if (boutonHaut) boutonHaut.classList.toggle("is-visible", global.scrollY > 420);
        if (ongletActif !== "cours" || restaurationEnCours) return;
        /* Tenir compte de la barre fixe et du temps passé dans le chapitre :
           un passage rapide ne doit pas être confondu avec une lecture. */
        var repere = Math.min(global.innerHeight - 1, Math.max(220, global.innerHeight * 0.42));
        var candidate = null;
        CHAPITRES.forEach(function (c) {
          var sec = document.getElementById(c.id);
          if (!sec || sec.hidden) return;
          var r = sec.getBoundingClientRect();
          if (r.top <= repere && r.bottom > repere) candidate = c.id;
        });
        if (candidate !== candidatLecture) {
          if (miseAJourLecture) global.clearTimeout(miseAJourLecture);
          miseAJourLecture = 0;
          candidatLecture = candidate;
        }
        if (!candidate) return;
        if (candidate !== chapitreActif) {
          chapitreActif = candidate;
          actualiserProgression();
        }
        if (candidate !== dernierChapitreEnregistre && !miseAJourLecture) {
          miseAJourLecture = global.setTimeout(function () {
            miseAJourLecture = 0;
            if (candidatLecture === candidate) enregistrerLectureCourante();
          }, 600);
        }
      });
    }
    global.addEventListener("scroll", suivreDefilement, { passive: true });
    actualiserProgression();
    suivreDefilement();
  }

  /* ── Commutateurs Code / Aperçu des cinq démonstrations de référence ── */
  global.switchTab = function (nom, mode) {
    var code = document.getElementById(nom + "-code");
    var apercu = document.getElementById(nom + "-preview");
    if (!code || !apercu) return;
    code.hidden = mode !== "code";
    apercu.hidden = mode !== "preview";
    ["code", "preview"].forEach(function (type) {
      var bouton = document.getElementById(nom + "-btn-" + type);
      if (bouton) bouton.setAttribute("aria-selected", String(type === mode));
    });
  };
  global.loadFrameDemo = function (page) {
    var cadre = document.getElementById("iframe-demo-cadre");
    if (!cadre) return;
    var contenu = page === "page2"
      ? "<h2>Page 2</h2><p>Le même cadre affiche maintenant la page 2, sans recharger la page principale.</p>"
      : "<h2>Page 1</h2><p>Vous êtes sur la page 1, affichée dans le cadre nommé « cadre ».</p>";
    cadre.srcdoc = documentSandbox(contenu);
  };

  function initialiserCommutateurs() {
    ["list-demo", "table-demo", "media-demo", "form-demo", "iframe-demo"].forEach(function (id) {
      var bCode = document.getElementById(id + "-btn-code");
      var bApercu = document.getElementById(id + "-btn-preview");
      if (bCode) { bCode.setAttribute("role", "tab"); bCode.setAttribute("aria-selected", "true"); }
      if (bApercu) { bApercu.setAttribute("role", "tab"); bApercu.setAttribute("aria-selected", "false"); }
      if (bCode && bCode.parentElement) {
        bCode.parentElement.setAttribute("role", "tablist");
        bCode.parentElement.setAttribute("aria-label", "Code et aperçu de l'exemple");
      }
    });
  }

  /* ── Code affiché avec numéros de ligne et coloration, sans modifier la source copiée ── */
  function colorer(ligne) {
    if (/^\s*<!--/.test(ligne)) return '<span class="tok-comment">' + echapper(ligne) + '</span>';
    var resultat = "";
    var position = 0;
    var reg = /<\/?[A-Za-z][^<>]*?>/g;
    var m;
    while ((m = reg.exec(ligne))) {
      resultat += echapper(ligne.slice(position, m.index));
      var balise = m[0].match(/^(<\/?)([\w:-]+)([\s\S]*?)(\/?>)$/);
      if (!balise) { resultat += echapper(m[0]); position = reg.lastIndex; continue; }
      var attrs = balise[3];
      var details = "";
      var attrPosition = 0;
      var attrReg = /([\w:-]+)(\s*=\s*)("[^"]*"|'[^']*')/g;
      var a;
      while ((a = attrReg.exec(attrs))) {
        details += echapper(attrs.slice(attrPosition, a.index)) + '<span class="tok-attr">' + echapper(a[1]) + '</span>' + echapper(a[2]) + '<span class="tok-val">' + echapper(a[3]) + '</span>';
        attrPosition = attrReg.lastIndex;
      }
      details += echapper(attrs.slice(attrPosition));
      resultat += echapper(balise[1]) + '<span class="tok-tag">' + echapper(balise[2]) + '</span>' + details + echapper(balise[4]);
      position = reg.lastIndex;
    }
    return resultat + echapper(ligne.slice(position));
  }

  function preparerCode(racine) {
    /* Un tableau plus large que l'écran peut être parcouru aux flèches. */
    tous(".table-scroll", racine).forEach(function (zone) {
      zone.tabIndex = 0;
      zone.setAttribute("role", "region");
      zone.setAttribute("aria-label", "Tableau défilable horizontalement");
    });
    tous("pre[data-raw-code]", racine).forEach(function (pre) {
      if (pre.dataset.codePrepare === "1") return;
      var source = pre.textContent.replace(/^\n+|\s+$/g, "");
      pre.__stiSource = source;
      pre.dataset.codePrepare = "1";
      /* Les blocs horizontaux restent accessibles au défilement clavier. */
      pre.tabIndex = 0;
      pre.setAttribute("aria-label", "Exemple de code, défilement horizontal possible");
      pre.innerHTML = '<code class="code-lines">' + source.split("\n").map(function (ligne, index) {
        return '<span class="code-line"><span class="code-ln" aria-hidden="true">' + (index + 1) + '</span><span class="code-lc">' + (colorer(ligne) || " ") + '</span></span>';
      }).join("") + '</code>';
    });
  }

  function copierTexte(texte) {
    if (global.navigator.clipboard && global.navigator.clipboard.writeText) return global.navigator.clipboard.writeText(texte);
    return new Promise(function (resolve, reject) {
      var champ = document.createElement("textarea");
      champ.value = texte;
      champ.setAttribute("readonly", "");
      champ.style.position = "fixed";
      champ.style.opacity = "0";
      document.body.appendChild(champ);
      champ.select();
      try { if (document.execCommand("copy")) resolve(); else reject(new Error("Copie indisponible")); }
      catch (e) { reject(e); }
      champ.remove();
    });
  }

  function valeursTheme() {
    var css = global.getComputedStyle(document.documentElement);
    return {
      fond: css.getPropertyValue("--surface-solid").trim() || "Canvas",
      fondAlt: css.getPropertyValue("--bg-alt").trim() || "Canvas",
      texte: css.getPropertyValue("--text").trim() || "CanvasText",
      attenue: css.getPropertyValue("--text-muted").trim() || "GrayText",
      bord: css.getPropertyValue("--border-strong").trim() || "GrayText",
      accent: css.getPropertyValue("--accent-html").trim() || "CanvasText"
    };
  }

  /* La feuille de l'iframe réutilise les variables du design system, jamais
     allow-same-origin : le code saisi ne peut pas accéder au document parent. */
  function documentSandbox(code) {
    var c = valeursTheme();
    var direction = document.documentElement.getAttribute("dir") === "rtl" ? "rtl" : "ltr";
    return "<!doctype html><html lang='fr' dir='" + direction + "'><head><meta charset='UTF-8'>" +
      "<style>body{font:14px/1.55 system-ui,sans-serif;margin:16px;background:" + c.fond + ";color:" + c.texte + "}" +
      "table{border-collapse:collapse;width:100%}th,td{border:1px solid " + c.bord + ";padding:7px;text-align:start}thead,tfoot{background:" + c.fondAlt + "}" +
      "input,textarea,select,button{font:inherit;color:" + c.texte + ";background:" + c.fondAlt + ";border:1px solid " + c.bord + ";border-radius:6px;padding:5px;margin:3px}" +
      "fieldset,figure{border:1px solid " + c.bord + ";border-radius:8px;padding:10px}figure{margin:8px 0}figcaption{color:" + c.attenue + "}img,video,iframe{max-width:100%}" +
      "</style></head><body>" + code + "</body></html>";
  }

  function codeMediaVersRessourcesLocales(code, selecteur) {
    if (selecteur.indexOf("media-demo") < 0) return code;
    /* Dans la référence, les noms génériques sont illustrés par ces médias locaux. */
    return code.replace(/(["'])fleurs\.jpg\1/g, '$1../projets/fleurs/media/orchidee.jpg$1')
      .replace(/(["'])presentation\.mp4\1/g, '$1../assets/video/flower.webm$1')
      .replace(/(["'])ambiance\.mp3\1/g, '$1../assets/audio/foret.mp3$1');
  }

  function initialiserApercus() {
    preparerCode(document);
    /* Les exemples cachés ne doivent pas tous charger leurs images et médias à
       l'ouverture : chaque iframe est initialisée à proximité de l'écran. */
    var observateur = global.IntersectionObserver ? new global.IntersectionObserver(function (entrees) {
      entrees.forEach(function (entree) {
        if (entree.isIntersecting && entree.target.__stiRendreApercu) entree.target.__stiRendreApercu();
      });
    }, { rootMargin: "150px" }) : null;
    tous(".live-playground").forEach(function (bloc) {
      var editeur = un("textarea", bloc);
      var cadre = un("iframe", bloc);
      var selecteur = bloc.getAttribute("data-playground-source");
      var sourcePre = selecteur ? un(selecteur) : null;
      if (!editeur || !cadre || !sourcePre) return;
      var sourceInitiale = sourcePre.__stiSource || sourcePre.textContent;
      editeur.value = sourceInitiale;
      var minuterie = 0;
      var dejaRendu = false;
      function rendre() {
        cadre.srcdoc = documentSandbox(codeMediaVersRessourcesLocales(editeur.value, selecteur));
        dejaRendu = true;
      }
      bloc.__stiRendreApercu = function () { if (!dejaRendu) rendre(); };
      fonctionsApercu.push(function () { if (dejaRendu) rendre(); });
      editeur.addEventListener("input", function () {
        global.clearTimeout(minuterie);
        minuterie = global.setTimeout(rendre, 160);
      });
      var reset = un("[data-reset-playground]", bloc);
      if (reset) reset.addEventListener("click", function () { editeur.value = sourceInitiale; rendre(); });
      if (observateur) observateur.observe(bloc);
      else {
        var volet = bloc.closest("details");
        if (volet) volet.addEventListener("toggle", function () { if (volet.open && !dejaRendu) rendre(); });
        else if (bloc.getClientRects().length) rendre();
      }
    });

    document.addEventListener("click", function (ev) {
      var copier = ev.target.closest("[data-copy-code]");
      if (copier) {
        var boite = copier.closest(".code-box");
        var pre = boite && un("pre", boite);
        if (!pre) return;
        var ancien = copier.textContent;
        copierTexte(pre.__stiSource || pre.textContent).then(function () {
          copier.textContent = "✓ Copié";
          global.setTimeout(function () { copier.textContent = ancien; }, 1400);
        }).catch(function () { copier.textContent = "Copie indisponible"; });
        return;
      }
      var voir = ev.target.closest("[data-preview-code]");
      if (!voir) return;
      var parent = voir.closest(".code-box");
      var resultat = parent && un(".code-box__result", parent);
      var preSource = parent && un("pre", parent);
      var cadreResultat = resultat && un("iframe", resultat);
      if (!resultat || !preSource || !cadreResultat) return;
      var ouvrir = resultat.hidden;
      resultat.hidden = !ouvrir;
      voir.textContent = ouvrir ? "🙈 Masquer le résultat" : "▶ Voir le résultat";
      voir.setAttribute("aria-expanded", String(ouvrir));
      if (ouvrir) cadreResultat.srcdoc = documentSandbox(preSource.__stiSource || preSource.textContent);
    });

    /* Un changement de thème réactualise les rendus sans effacer le code saisi. */
    if (global.MutationObserver) new MutationObserver(function () {
      fonctionsApercu.forEach(function (fn) { fn(); });
      actualiserPosters();
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "dir"] });
  }

  /* ── Modale unique : gabarits d'origine, focus, redimensionnement et plein écran ── */
  function focusables(conteneur) {
    return tous('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,iframe,video[controls],audio[controls],[contenteditable="true"],[tabindex]:not([tabindex="-1"])', conteneur).filter(function (el) {
      return !el.closest("[hidden]") && el.getClientRects().length > 0;
    });
  }
  function maximiser(oui) {
    var fond = document.getElementById("modal-overlay");
    var bouton = document.getElementById("modal-maximize-button");
    if (!fond || !bouton) return;
    fond.classList.toggle("modal-maximized", oui);
    bouton.setAttribute("aria-pressed", String(oui));
    var texte = oui ? "Restaurer la taille" : "Agrandir sur toute la page";
    bouton.setAttribute("aria-label", texte);
    bouton.title = texte;
    var icone = document.getElementById("modal-maximize-icon");
    var etiquette = un(".modal-size-label", bouton);
    if (icone) icone.textContent = oui ? "⤡" : "⤢";
    if (etiquette) etiquette.textContent = oui ? "Restaurer" : "Agrandir";
  }
  function openModal(id, declencheur) {
    var template = document.getElementById(id);
    var fond = document.getElementById("modal-overlay");
    var fenetre = document.getElementById("modal-window");
    var corps = document.getElementById("modal-body");
    if (!template || !template.content || !fond || !fenetre || !corps) return;
    retourFocusModal = declencheur || document.activeElement;
    fenetre.style.width = "";
    fenetre.style.height = "";
    maximiser(false);
    document.getElementById("modal-title").textContent = template.dataset.title || "Détails du cours";
    corps.replaceChildren(template.content.cloneNode(true));
    preparerCode(corps);
    fond.hidden = false;
    document.body.classList.add("course-modal-open");
    /* Retirer temporairement l'arrière-plan de l'ordre de tabulation et des
       technologies d'assistance, sans changer un état inert préexistant. */
    elementsInertesModale = [];
    Array.prototype.forEach.call(document.body.children, function (el) {
      if (el === fond || el.tagName === "SCRIPT" || el.tagName === "TEMPLATE" || el.inert) return;
      el.inert = true;
      elementsInertesModale.push(el);
    });
    var video = un("video", corps);
    if (video) {
      video.poster = creerPoster(id === "tpl-video-demo" ? "Démonstration vidéo" : "Cours HTML5");
      var source = id === "tpl-video-demo" ? document.getElementById("demoMultimediaVideo") : videoActive();
      var position = source ? source.currentTime : 0;
      if (source && !source.paused) source.pause();
      if (position > 0) video.addEventListener("loadedmetadata", function () {
        try { video.currentTime = Math.min(position, video.duration || position); } catch (e) {}
      }, { once: true });
      suivreVideo(video, id === "tpl-video-demo" ? VIDEO_DEMO : VIDEO_COURS);
    }
    var liste = focusables(fenetre);
    (liste[0] || fenetre).focus();
  }
  function closeModal() {
    var fond = document.getElementById("modal-overlay");
    var corps = document.getElementById("modal-body");
    if (!fond || fond.hidden) return;
    var video = corps && un("video", corps);
    if (video) {
      if (!video.paused) video.pause();
      var destination = video.hasAttribute("data-sync-cours-video") ? videoActive() : document.getElementById("demoMultimediaVideo");
      if (destination && Number.isFinite(video.currentTime)) {
        try { destination.currentTime = video.currentTime; } catch (e) {}
      }
    }
    fond.hidden = true;
    document.body.classList.remove("course-modal-open");
    elementsInertesModale.forEach(function (el) { el.inert = false; });
    elementsInertesModale = [];
    maximiser(false);
    if (corps) corps.replaceChildren();
    if (retourFocusModal && retourFocusModal.isConnected && typeof retourFocusModal.focus === "function") retourFocusModal.focus();
    retourFocusModal = null;
  }
  global.openModal = openModal;
  global.closeModal = closeModal;
  global.toggleModalSize = function () {
    var fond = document.getElementById("modal-overlay");
    if (fond) maximiser(!fond.classList.contains("modal-maximized"));
  };
  global.returnToCourse = function () {
    closeModal();
    if (ongletActif !== "cours") allerAuChapitre(chapitreActif, false, true);
  };

  function initialiserModale() {
    var fond = document.getElementById("modal-overlay");
    var fenetre = document.getElementById("modal-window");
    var poignee = document.getElementById("modalResizeHandle");
    if (!fond || !fenetre) return;
    document.addEventListener("click", function (ev) {
      var ouvrir = ev.target.closest("[data-open-modal]");
      if (ouvrir) { ev.preventDefault(); openModal(ouvrir.getAttribute("data-open-modal"), ouvrir); return; }
      if (ev.target.closest("[data-modal-close]")) closeModal();
      else if (ev.target.closest("[data-modal-return]")) global.returnToCourse();
      else if (ev.target.closest("[data-modal-maximize]")) global.toggleModalSize();
      else if (ev.target === fond) closeModal();
    });
    document.addEventListener("keydown", function (ev) {
      if (fond.hidden) return;
      if (ev.key === "Escape") { ev.preventDefault(); closeModal(); return; }
      if (ev.key !== "Tab") return;
      var liste = focusables(fenetre);
      if (!liste.length) { ev.preventDefault(); fenetre.focus(); return; }
      var premier = liste[0], dernier = liste[liste.length - 1];
      if (ev.shiftKey && (document.activeElement === premier || !fenetre.contains(document.activeElement))) { ev.preventDefault(); dernier.focus(); }
      else if (!ev.shiftKey && (document.activeElement === dernier || !fenetre.contains(document.activeElement))) { ev.preventDefault(); premier.focus(); }
    });
    if (!poignee) return;
    function fixerTaille(largeur, hauteur) {
      fenetre.style.width = Math.round(Math.max(320, Math.min(global.innerWidth * 0.96, largeur))) + "px";
      fenetre.style.height = Math.round(Math.max(280, Math.min(global.innerHeight * 0.94, hauteur))) + "px";
    }
    poignee.addEventListener("pointerdown", function (ev) {
      if (fond.classList.contains("modal-maximized") || global.matchMedia("(max-width: 700px)").matches) return;
      ev.preventDefault();
      var r = fenetre.getBoundingClientRect();
      var debutX = ev.clientX, debutY = ev.clientY;
      var rtl = document.documentElement.dir === "rtl";
      function mouvement(e) { fixerTaille(r.width + (rtl ? debutX - e.clientX : e.clientX - debutX) * 2, r.height + (e.clientY - debutY) * 2); }
      function fin() { global.removeEventListener("pointermove", mouvement); global.removeEventListener("pointerup", fin); }
      global.addEventListener("pointermove", mouvement);
      global.addEventListener("pointerup", fin);
    });
    poignee.addEventListener("keydown", function (ev) {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].indexOf(ev.key) < 0) return;
      ev.preventDefault();
      var r = fenetre.getBoundingClientRect();
      fixerTaille(r.width + (ev.key === "ArrowRight" ? 25 : ev.key === "ArrowLeft" ? -25 : 0), r.height + (ev.key === "ArrowDown" ? 25 : ev.key === "ArrowUp" ? -25 : 0));
    });
  }

  /* Les attributs title d'origine sont préservés après survol et au clavier. */
  function initialiserInfoBulles() {
    var bulle = document.createElement("div");
    bulle.id = "stiCustomTooltip";
    bulle.className = "sti-tooltip";
    bulle.setAttribute("role", "tooltip");
    bulle.hidden = true;
    document.body.appendChild(bulle);
    var active = null;
    var descriptionPrecedente = null;
    function masquer() {
      if (active && active.hasAttribute("data-original-title")) {
        if (!active.hasAttribute("title")) active.setAttribute("title", active.getAttribute("data-original-title"));
        active.removeAttribute("data-original-title");
        if (descriptionPrecedente) active.setAttribute("aria-describedby", descriptionPrecedente);
        else active.removeAttribute("aria-describedby");
      }
      active = null;
      descriptionPrecedente = null;
      bulle.classList.remove("is-visible");
      bulle.hidden = true;
    }
    function afficher(el) {
      if (!el || el === active) return;
      masquer();
      var texte = el.getAttribute("title");
      if (!texte) return;
      active = el;
      descriptionPrecedente = el.getAttribute("aria-describedby");
      el.setAttribute("data-original-title", texte);
      el.setAttribute("aria-describedby", descriptionPrecedente ? descriptionPrecedente + " " + bulle.id : bulle.id);
      el.removeAttribute("title");
      bulle.textContent = texte;
      bulle.hidden = false;
      bulle.classList.add("is-visible");
      var r = el.getBoundingClientRect(), b = bulle.getBoundingClientRect();
      var top = r.top - b.height - 8;
      if (top < 8) top = r.bottom + 8;
      bulle.style.top = Math.round(top) + "px";
      bulle.style.left = Math.round(Math.max(8, Math.min(global.innerWidth - b.width - 8, r.left + (r.width - b.width) / 2))) + "px";
    }
    document.addEventListener("pointerover", function (ev) { afficher(ev.target.closest("[title]")); });
    document.addEventListener("pointerout", function (ev) { if (active && !active.contains(ev.relatedTarget)) masquer(); });
    document.addEventListener("focusin", function (ev) { afficher(ev.target.closest("[title]")); });
    document.addEventListener("focusout", masquer);
    global.addEventListener("scroll", masquer, { passive: true });
  }

  /* ── Audio : repères de chapitres existants et ligne courante indicative ── */
  function initialiserGuideVocal() {
    var audio = document.getElementById("voiceGuideAudio");
    var suivi = document.getElementById("voiceAutoFollow");
    var etiquette = document.getElementById("voiceActiveLabel");
    var lancer = document.getElementById("heroListenBtn");
    if (!audio) return;
    var p = profil();
    audio.playbackRate = p && p.vitesseAudio || 1;
    function majVitesses(v) {
      tous("[data-voice-rate]").forEach(function (b) { b.setAttribute("aria-pressed", String(Number(b.dataset.voiceRate) === v)); });
    }
    majVitesses(audio.playbackRate);
    document.addEventListener("click", function (ev) {
      var bouton = ev.target.closest("[data-voice-rate]");
      if (!bouton) return;
      var vitesse = Number(bouton.dataset.voiceRate);
      audio.playbackRate = vitesse;
      majVitesses(vitesse);
      if (global.STIProfil) global.STIProfil.mettreAJour("vitesseAudio", vitesse);
    });
    if (lancer) lancer.addEventListener("click", function () {
      activerOnglet("cours", true);
      document.getElementById("voiceGuideCard").scrollIntoView({ behavior: "smooth", block: "center" });
      var promesse = audio.play(); if (promesse && promesse.catch) promesse.catch(function () {});
    });
    function nettoyer() { if (audioLigne) audioLigne.classList.remove("is-reading-line"); audioLigne = null; }
    audio.addEventListener("play", function () {
      tous('video[data-tracked="html5-cours"]').forEach(function (v) { if (!v.paused) v.pause(); });
    });
    audio.addEventListener("timeupdate", function () {
      var t = audio.currentTime || 0;
      var index = 0;
      CHAPITRES.forEach(function (c, i) { if (t >= c.temps) index = i; });
      var c = CHAPITRES[index];
      var section = document.getElementById(c.id);
      if (!section) return;
      var fin = CHAPITRES[index + 1] ? CHAPITRES[index + 1].temps : (Number.isFinite(audio.duration) ? audio.duration : c.temps + 30);
      var fraction = Math.max(0, Math.min(0.999, (t - c.temps) / Math.max(1, fin - c.temps)));
      var lignes = tous("tbody tr, :scope > p, :scope > div > p", section).filter(function (el) { return !el.closest("[hidden]"); });
      if (!lignes.length) lignes = [un("h2", section) || section];
      var ligne = lignes[Math.min(lignes.length - 1, Math.floor(fraction * lignes.length))];
      if (ligne !== audioLigne) {
        nettoyer();
        ligne.classList.add("is-reading-line");
        audioLigne = ligne;
        if (etiquette) etiquette.textContent = "🔊 " + (index + 1) + ". " + c.titre + " · repérage indicatif";
        if (suivi && suivi.checked && ongletActif === "cours") ligne.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
    audio.addEventListener("pause", nettoyer);
    audio.addEventListener("ended", nettoyer);
  }

  /* ── Vidéos : poster local SVG, passage par chapitre et reprise dans le profil ── */
  function creerPoster(titre) {
    var c = valeursTheme();
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 540">' +
      '<rect width="960" height="540" fill="' + echapper(c.fond) + '"/>' +
      '<circle cx="800" cy="45" r="220" fill="' + echapper(c.accent) + '" opacity=".12"/>' +
      '<rect x="50" y="50" width="860" height="440" rx="24" fill="' + echapper(c.fondAlt) + '" stroke="' + echapper(c.bord) + '"/>' +
      '<text x="85" y="115" font-family="sans-serif" font-size="18" font-weight="700" letter-spacing="3" fill="' + echapper(c.accent) + '">STI V2.0 · HTML5</text>' +
      '<text x="85" y="180" font-family="sans-serif" font-size="38" font-weight="800" fill="' + echapper(c.texte) + '">' + echapper(titre) + '</text>' +
      '<text x="85" y="225" font-family="sans-serif" font-size="21" fill="' + echapper(c.attenue) + '">Structure · tableaux · formulaires · médias</text>' +
      '<rect x="85" y="265" width="520" height="165" rx="14" fill="' + echapper(c.fond) + '"/>' +
      '<text x="112" y="310" font-family="monospace" font-size="20" fill="' + echapper(c.accent) + '">&lt;!DOCTYPE html&gt;</text>' +
      '<text x="112" y="348" font-family="monospace" font-size="20" fill="' + echapper(c.texte) + '">&lt;form&gt; ... &lt;/form&gt;</text>' +
      '<text x="112" y="386" font-family="monospace" font-size="20" fill="' + echapper(c.attenue) + '">&lt;iframe&gt; ... &lt;/iframe&gt;</text>' +
      '<circle cx="755" cy="335" r="58" fill="' + echapper(c.accent) + '"/>' +
      '<path d="M741 307 L741 363 L790 335 Z" fill="' + echapper(c.fond) + '"/></svg>';
    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
  }
  function actualiserPosters() {
    ["heroCourseVideo", "tabCourseVideo", "demoMultimediaVideo"].forEach(function (id) {
      var v = document.getElementById(id);
      if (v) v.poster = creerPoster(id === "demoMultimediaVideo" ? "Démonstration vidéo" : "Vidéo du cours HTML5");
    });
  }
  function positionVideo(id) {
    var p = profil();
    if (!p || !p.videos) return 0;
    var position = p.videos.positions && Number(p.videos.positions[id]);
    if (position > 0) return position;
    return p.videos.derniere && p.videos.derniere.id === id ? Number(p.videos.derniere.temps) || 0 : 0;
  }
  function actualiserVideos() {
    var pos = positionVideo(VIDEO_COURS);
    var p = profil();
    var vue = !!(p && p.videos && p.videos.vues.indexOf(VIDEO_COURS) >= 0);
    tous("[data-resume-video]").forEach(function (b) {
      b.hidden = pos < 3;
      b.textContent = "⏯ Reprendre la vidéo (" + tempsLisible(pos) + ")";
    });
    tous("[data-video-seen-badge]").forEach(function (b) { b.textContent = vue ? "✓ Vidéo vue" : "🎥 HTML5"; });
  }
  function videoActive() {
    return document.getElementById(ongletActif === "videos" ? "tabCourseVideo" : "heroCourseVideo");
  }
  function suivreVideo(video, identifiant) {
    if (!video || video.dataset.tracked) return;
    video.dataset.tracked = identifiant;
    var dernier = 0;
    function sauver(terminee) {
      if (!global.STIProfil || (!terminee && video.currentTime < 3)) return;
      global.STIProfil.enregistrerPositionVideo({
        id: identifiant,
        matiere: MATIERE,
        titre: video.dataset.videoTitle || (identifiant === VIDEO_COURS ? "Cours HTML5 complet (.mp4)" : "Démonstration vidéo de la boutique"),
        temps: video.currentTime,
        duree: Number.isFinite(video.duration) ? video.duration : 0,
        url: "cours/html5.html#videos",
        terminee: terminee,
        secondaire: identifiant !== VIDEO_COURS
      });
    }
    video.addEventListener("play", function () {
      tous('video[data-tracked="' + identifiant + '"]').forEach(function (autre) { if (autre !== video && !autre.paused) autre.pause(); });
      var audio = document.getElementById("voiceGuideAudio");
      if (identifiant === VIDEO_COURS && audio && !audio.paused) audio.pause();
    });
    video.addEventListener("timeupdate", function () {
      var now = Date.now();
      if (now - dernier >= 4000 && video.currentTime >= 3) { dernier = now; sauver(false); }
    });
    video.addEventListener("pause", function () { if (!video.ended) sauver(false); });
    video.addEventListener("ended", function () { sauver(true); });
  }
  function lancerVideo(secondes) {
    var video = videoActive();
    if (!video) return;
    video.scrollIntoView({ behavior: "smooth", block: "center" });
    function lancer() {
      try { video.currentTime = Math.min(Number(secondes) || 0, Number.isFinite(video.duration) ? video.duration : Infinity); } catch (e) {}
      var promesse = video.play(); if (promesse && promesse.catch) promesse.catch(function () {});
    }
    if (video.readyState >= 1) lancer();
    else video.addEventListener("loadedmetadata", lancer, { once: true });
  }
  function initialiserVideos() {
    actualiserPosters();
    suivreVideo(document.getElementById("heroCourseVideo"), VIDEO_COURS);
    suivreVideo(document.getElementById("tabCourseVideo"), VIDEO_COURS);
    suivreVideo(document.getElementById("tpEvenementsVideo"), VIDEO_TP);
    suivreVideo(document.getElementById("tpFormulaireVideo"), VIDEO_TP_FORMULAIRE);
    suivreVideo(document.getElementById("tpDisplayVideo"), VIDEO_TP_DISPLAY);
    var demo = document.getElementById("demoMultimediaVideo");
    suivreVideo(demo, VIDEO_DEMO);
    if (demo) demo.addEventListener("loadedmetadata", function () {
      var pos = positionVideo(VIDEO_DEMO);
      if (pos > 0 && pos < demo.duration) { try { demo.currentTime = pos; } catch (e) {} }
    }, { once: true });
    tous("[data-video-chapters-bar]").forEach(function (barre) {
      CHAPITRES.forEach(function (c, i) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "video-chapter-chip";
        b.dataset.seekVideo = c.temps;
        b.textContent = tempsLisible(c.temps) + " · " + (i + 1) + ". " + c.titre;
        barre.appendChild(b);
      });
    });
    document.addEventListener("click", function (ev) {
      var passage = ev.target.closest("[data-seek-video]");
      if (passage) { lancerVideo(Number(passage.dataset.seekVideo)); return; }
      if (ev.target.closest("[data-resume-video]")) { lancerVideo(positionVideo(VIDEO_COURS)); return; }
      var pleinEcran = ev.target.closest("[data-fullscreen-video]");
      if (pleinEcran) {
        var cible = document.getElementById(pleinEcran.dataset.fullscreenVideo);
        if (cible && cible.requestFullscreen) { var promesse = cible.requestFullscreen(); if (promesse && promesse.catch) promesse.catch(function () {}); }
      }
      var ancien = ev.target.closest("[data-legacy-video]");
      if (ancien && typeof global.ouvrirVideoPasAPasSTI === "function") global.ouvrirVideoPasAPasSTI(ancien.dataset.legacyVideo);
    });
    actualiserVideos();
  }

  /* ── Exercices, documents et retour depuis une annexe ── */
  function actualiserExercices() {
    var p = profil();
    var faits = p && p.exercicesFaits ? p.exercicesFaits.html5 || [] : [];
    var cartes = tous(".exo-card-full[data-exo-id]");
    var nb = 0;
    cartes.forEach(function (carte) {
      var fait = faits.indexOf(carte.dataset.exoId) >= 0;
      if (fait) nb++;
      carte.classList.toggle("is-done", fait);
      var caseFait = un("[data-exo-check]", carte);
      if (caseFait) caseFait.checked = fait;
    });
    var compteur = document.getElementById("exoGlobalCounter");
    var mini = document.getElementById("tabExoCount");
    var barre = document.getElementById("exoProgressBar");
    if (compteur) compteur.textContent = nb + " / " + cartes.length + " exercices faits";
    if (mini) mini.textContent = nb + "/" + cartes.length;
    if (barre) barre.style.width = (cartes.length ? Math.round(nb / cartes.length * 100) : 0) + "%";
  }
  /* Les énoncés et corrigés restent sur cette page : le document d'origine
     est chargé à la demande dans un cadre, avec un lien d'ouverture séparée. */
  function afficherDocumentExercice(lien) {
    var carte = lien && lien.closest(".exo-card-full");
    if (!carte) return false;
    var url;
    try { url = new URL(lien.href, global.location.href); } catch (e) { return false; }
    if (url.origin !== global.location.origin || !/^https?:$/.test(url.protocol)) return false;
    var details = lien.closest(".exo-solution");
    var conteneur = details || carte;
    var apercu = un(":scope > .exo-doc-preview", conteneur);
    if (!apercu) {
      apercu = document.createElement("div");
      apercu.className = "exo-doc-preview";
      var barre = document.createElement("div");
      barre.className = "exo-doc-preview__head";
      var titre = document.createElement("strong");
      titre.className = "exo-doc-preview__title";
      var ouvrir = document.createElement("a");
      ouvrir.className = "source-link";
      ouvrir.target = "_blank";
      ouvrir.rel = "noopener";
      ouvrir.textContent = "Ouvrir à part ↗";
      ouvrir.setAttribute("data-external-doc", "");
      var fermer = document.createElement("button");
      fermer.type = "button";
      fermer.className = "source-btn";
      fermer.textContent = "✕ Fermer l’aperçu";
      fermer.addEventListener("click", function () {
        var cadre = un("iframe", apercu);
        if (cadre) cadre.removeAttribute("src");
        apercu.hidden = true;
        if (apercu.__lienActif) apercu.__lienActif.focus();
      });
      barre.append(titre, ouvrir, fermer);
      var cadre = document.createElement("iframe");
      cadre.className = "exo-doc-preview__frame";
      cadre.loading = "lazy";
      apercu.append(barre, cadre);
      if (details) details.appendChild(apercu);
      else {
        var actions = lien.closest(".source-actions");
        if (actions) actions.insertAdjacentElement("afterend", apercu);
        else conteneur.appendChild(apercu);
      }
    }
    var texte = lien.textContent.trim().replace(/\s*↗\s*$/, "");
    apercu.__lienActif = lien;
    un(".exo-doc-preview__title", apercu).textContent = texte;
    un("a", apercu).href = url.href;
    var cadreDoc = un("iframe", apercu);
    cadreDoc.title = "Aperçu : " + texte;
    cadreDoc.src = url.href;
    apercu.hidden = false;
    return true;
  }

  function initialiserExercices() {
    document.addEventListener("toggle", function (ev) {
      var volet = ev.target;
      if (!volet.matches("details.exo-solution") || !volet.open) return;
      var premierCorrige = un("a[data-external-doc]", volet);
      if (premierCorrige && !un(":scope > .exo-doc-preview", volet)) afficherDocumentExercice(premierCorrige);
    }, true);
    document.addEventListener("change", function (ev) {
      var caseFait = ev.target.closest("[data-exo-check]");
      if (caseFait && global.STIProfil) global.STIProfil.basculerExerciceFait(MATIERE, caseFait.dataset.exoCheck, caseFait.checked);
    });
    document.addEventListener("click", function (ev) {
      var lienExercice = ev.target.closest(".exo-card-full a[data-external-doc]");
      if (lienExercice && !lienExercice.closest(".exo-doc-preview") && !ev.ctrlKey && !ev.metaKey && !ev.shiftKey && !ev.altKey) {
        if (afficherDocumentExercice(lienExercice)) ev.preventDefault();
        return;
      }
      var apercu = ev.target.closest("[data-preview-doc]");
      if (!apercu) return;
      var zone = document.getElementById("annexePreview");
      var cadre = document.getElementById("annexePreviewFrame");
      var titre = document.getElementById("annexePreviewTitle");
      if (!zone || !cadre) return;
      zone.hidden = false;
      cadre.src = apercu.dataset.previewDoc;
      if (titre) titre.textContent = "📄 " + (apercu.dataset.previewTitle || "Aperçu du document");
      zone.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    var aOuvert = false;
    document.addEventListener("click", function (ev) { if (!ev.defaultPrevented && ev.target.closest("[data-external-doc]")) aOuvert = true; });
    var retour = document.getElementById("backToCourse");
    global.addEventListener("focus", function () { if (aOuvert && retour) retour.hidden = false; });
    if (retour) retour.addEventListener("click", function (ev) { ev.preventDefault(); retour.hidden = true; aOuvert = false; allerAuChapitre(chapitreActif, false, true); });
    actualiserExercices();
  }

  function demarrer() {
    if (!document.body || !document.body.classList.contains("course-page--html5")) return;
    initialiserOnglets();
    initialiserSommaire();
    initialiserCommutateurs();
    initialiserApercus();
    initialiserModale();
    initialiserInfoBulles();
    initialiserGuideVocal();
    initialiserVideos();
    initialiserExercices();
    function actualiserDonneesProfil() {
      actualiserProgression();
      actualiserVideos();
      actualiserExercices();
    }
    global.addEventListener("sti:profil-maj", actualiserDonneesProfil);
    /* Le synchroniseur historique restaure parfois le profil dans cet onglet. */
    global.addEventListener("sti-cloud-restored", actualiserDonneesProfil);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", demarrer);
  else demarrer();
})(window, document);
