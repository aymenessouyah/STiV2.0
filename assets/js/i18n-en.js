/* STI V2.0 — Switcher FR / EN (En-tête & Portail uniquement) + Traduction anglaise complète pour /en/ */
(function () {
  "use strict";
  if (typeof window === "undefined" || typeof document === "undefined") return;

  var cfg = window.STI_AUTH || {};
  var pathname = location.pathname || "";
  var estEn = Boolean(cfg.EST_EN || /\/en(\/|$)/i.test(pathname) || (document.documentElement && document.documentElement.lang === "en"));

  function calculerUrlAutreLangue() {
    var racine = cfg.RACINE || (location.origin + "/");
    var origin = location.origin || "";
    var basePath = racine.indexOf(origin) === 0 ? racine.substring(origin.length) : "/";
    if (basePath.slice(-1) !== "/") basePath += "/";

    var rel = pathname.indexOf(basePath) === 0 ? pathname.substring(basePath.length) : pathname.replace(/^\/+/, "");
    if (estEn) {
      rel = rel.replace(/^en\/?/i, "");
      if (!rel || rel.slice(-1) === "/") rel += "index.html";
      return origin + basePath + rel + (location.search || "") + (location.hash || "");
    } else {
      if (!rel || rel.slice(-1) === "/") rel += "index.html";
      return origin + basePath + "en/" + rel + (location.search || "") + (location.hash || "");
    }
  }

  function creerBoutonLangue(styleSpecifique) {
    var a = document.createElement("a");
    a.id = "sti-lang-switch-btn";
    a.className = "sti-no-print";
    a.href = calculerUrlAutreLangue();
    a.innerHTML = estEn ? "🇫🇷 <span>FR</span>" : "🇬🇧 <span>EN</span>";
    a.title = estEn ? "Passer à la version française (FR)" : "Switch to English version (EN)";
    a.setAttribute("aria-label", a.title);
    a.style.cssText =
      "display:inline-flex;align-items:center;gap:5px;padding:6px 12px;border-radius:999px;" +
      "border:2px solid #23201a;background:linear-gradient(120deg,#fff3b0,#ffd54f);color:#23201a;" +
      "font:800 12px/1 system-ui,-apple-system,'Segoe UI',sans-serif;text-decoration:none;" +
      "box-shadow:2px 2px 0 #23201a;cursor:pointer;white-space:nowrap;flex-shrink:0;transition:transform .15s ease;" +
      (styleSpecifique || "");
    a.addEventListener("click", function () {
      try {
        if (sessionStorage.getItem("sti-bio-session-ok") === "1") {
          var now = String(Date.now());
          localStorage.setItem("sti-bio-nav-ts", now);
          localStorage.setItem("sti-bio-click-nav-ts", now);
        }
      } catch (e) {}
    });
    return a;
  }

  function insererBoutonLangueEnTete() {
    if (window !== window.top) return;
    if (document.getElementById("sti-lang-switch-btn")) return;

    /* 1. Portail de connexion (portail.html) */
    var cartePortail = document.querySelector("main.carte .entete");
    if (cartePortail) {
      var btnP = creerBoutonLangue("position:absolute;top:14px;right:14px;z-index:10;");
      cartePortail.appendChild(btnP);
      return;
    }

    /* 2. Accueil (index.html) & Séries d'exercices (series-exercices.html) : .topbar-inner > nav */
    var topbarNav = document.querySelector(".topbar-inner > nav, .topbar-inner .bar-nav");
    if (topbarNav) {
      var btnT = creerBoutonLangue("margin-left:6px;");
      var themeBtn = topbarNav.querySelector("#themeToggle, .theme-toggle");
      if (themeBtn && themeBtn.parentNode === topbarNav) {
        topbarNav.insertBefore(btnT, themeBtn);
      } else {
        topbarNav.appendChild(btnT);
      }
      return;
    }

    /* 3. Tableau de bord Admin (admin.html) : .hero-admin .outils-rapides */
    var adminOutils = document.querySelector(".hero-admin .outils-rapides");
    if (adminOutils) {
      adminOutils.insertBefore(creerBoutonLangue(), adminOutils.firstChild);
      return;
    }

    /* 4. Bac Pratique (bac-pratique.html) : .entete */
    var bacEntete = document.querySelector("body > .entete");
    if (bacEntete) {
      var wrapD = document.createElement("div");
      wrapD.style.cssText = "display:flex;align-items:center;gap:8px;flex-wrap:wrap;";
      var lienRet = bacEntete.querySelector("a.retour");
      wrapD.appendChild(creerBoutonLangue());
      if (lienRet) wrapD.appendChild(lienRet);
      bacEntete.appendChild(wrapD);
      return;
    }

    /* 5. Quiz (quiz/*.html) : header .nav-right */
    var quizNavRight = document.querySelector("header .nav-right");
    if (quizNavRight) {
      quizNavRight.insertBefore(creerBoutonLangue(), quizNavRight.firstChild);
      return;
    }

    /* 6. Pages de cours (cours/*.html) : header */
    var coursHeaderRight = document.querySelector("header .flex.items-center.space-x-2.sm\\:space-x-4.flex-shrink-0, header .outils, header .header-actions");
    if (coursHeaderRight) {
      coursHeaderRight.insertBefore(creerBoutonLangue(), coursHeaderRight.firstChild);
      return;
    }
    var anyHeader = document.querySelector("header");
    if (anyHeader) {
      var innerH = anyHeader.querySelector(".max-w-7xl > .flex, .wrap, .head-in") || anyHeader;
      innerH.appendChild(creerBoutonLangue("margin-left:8px;"));
    }
  }

  /* ── Dictionnaire FR -> EN pour la version anglaise (/en/) ── */
  var DICT_EXACT = {
    /* Navigation & Accueil */
    "Cours": "Courses",
    "📚 Cours": "📚 Courses",
    "Exercices": "Exercises",
    "📝 Exercices": "📝 Exercises",
    "🏋️ Exercices": "🏋️ Exercises",
    "Quiz": "Quizzes",
    "🎯 Quiz": "🎯 Quizzes",
    "Conseils": "Tips",
    "💡 Conseils": "💡 Tips",
    "Bac Pratique": "Practical Bac",
    "🧪 Bac Pratique": "🧪 Practical Bac",
    "Accès direct aux cours": "Direct access to courses",
    "⤓ Installer": "⤓ Install",
    "Installer STI by AE": "Install STI by AE",
    "Ouvrir le cours": "Open course",
    "Ouvrir le cours →": "Open course →",
    "Ouvrir les séries": "Open exercise sets",
    "Ouvrir les séries →": "Open exercise sets →",
    "Lancer le quiz": "Start quiz",
    "Lancer le quiz →": "Start quiz →",
    "Retour": "Back",
    "🏠 Retour": "🏠 Back",
    "◀ Retour": "◀ Back",
    "← Accueil": "← Home",
    "← Exercices": "← Exercises",
    "Annexe PDF": "PDF Appendix",
    "⤓ PDF d'origine": "⤓ Original PDF",
    "🖨️ Imprimer": "🖨️ Print",
    "Énoncé": "Instructions",
    "Ressources": "Resources",
    "Aperçu + Corrigé": "Preview + Solution",
    "Corrigé": "Solution",
    "Débutant": "Beginner",
    "Intermédiaire": "Intermediate",
    "Avancé": "Advanced",
    "Réglages": "Settings",
    "Thèmes": "Topics",
    "Comment ça marche": "How it works",

    /* Portail (portail.html) */
    "Systèmes et Technologies de l'Informatique": "Computer Science & Information Technologies (STI)",
    "Espace réservé aux abonnés — connectez-vous pour continuer.": "Subscriber area — please sign in to continue.",
    "🔐 Connexion": "🔐 Sign In",
    "📝 Inscription": "📝 Sign Up",
    "🔑 Oublié": "🔑 Forgot",
    "E-mail ou n° WhatsApp": "Email or WhatsApp number",
    "Mot de passe": "Password",
    "Captcha — recopiez le code": "Captcha — type the code above",
    "🔐 Se connecter": "🔐 Sign In",
    "🪪 Au labo ? Connexion rapide par Code Badge (6 caractères)": "🪪 In the lab? Quick login with Badge Code (6 characters)",
    "🔑 Code Badge Labo (remis par M. Essouyah) :": "🔑 Lab Badge Code (provided by Mr. Essouyah):",
    "⚡ Entrer": "⚡ Enter",
    "📧 Par e-mail": "📧 By Email",
    "📱 Par téléphone": "📱 By Phone",
    "Nom *": "Last Name *",
    "Prénom *": "First Name *",
    "Numéro WhatsApp": "WhatsApp Number",
    "Adresse e-mail": "Email Address",
    "Lycée": "High School",
    "Classe": "Class",
    "— Choisir votre lycée —": "— Select your high school —",
    "— Choisir votre classe —": "— Select your class —",
    "Mot de passe (6 caractères min.)": "Password (min. 6 characters)",
    "Confirmer le mot de passe": "Confirm password",
    "📝 Créer mon compte": "📝 Create my account",
    "📩 Envoyer le lien de réinitialisation": "📩 Send password reset link",

    /* Roue Mon Compte & Outils élève */
    "Mon Compte STI": "My STI Account",
    "💬 Messenger STI": "💬 STI Messenger",
    "📤 Rendre mon TP": "📤 Submit my Lab Work",
    "🙋 Lever la main": "🙋 Raise Hand",
    "🎓 Mon Bulletin PDF": "🎓 My PDF Report Card",
    "📸 SOS Capture / Envoyer mon code au prof": "📸 SOS Screenshot / Send my code to teacher",
    "🧰 Laboratoires & Outils STI ▾": "🧰 STI Labs & Study Tools ▾",
    "🧰 Laboratoires & Outils STI ▴": "🧰 STI Labs & Study Tools ▴",
    "✅ Prêt hors-ligne": "✅ Offline ready",
    "📲 Hors-ligne": "📲 Offline mode",
    "📴 Hors-ligne": "📴 Offline",
    "🚪 Déconnexion": "🚪 Sign Out",
    "🏆 Envoyer mon score au prof": "🏆 Send my score to teacher",
    "🌗 Écran Partagé + Code": "🌗 Split Screen + Code",

    /* Reconnaissance biométrique */
    "Reconnaissance à l'ouverture": "Biometric Check on Launch",
    "👆 Déverrouiller l'application": "👆 Unlock Application",
    "🛠️ Accéder au Tableau de bord Admin": "🛠️ Open Admin Dashboard",
    "🔑 Ouvrir la page Portail de connexion": "🔑 Open Sign-In Portal",
    "🔓 Déverrouiller avec l'empreinte / code": "🔓 Unlock with Fingerprint / Passcode",
    "🛠️ Accéder directement au Tableau de bord": "🛠️ Go directly to Admin Dashboard",

    /* Tableau de bord Admin */
    "Tableau de bord STI V2.0": "STI V2.0 Admin Dashboard",
    "🏠 Accueil au site": "🏠 Back to Website",
    "🔄 Actualiser": "🔄 Refresh",
    "🚪 Quitter": "🚪 Sign Out"
  };

  var REMPLACEMENTS_PARTIELS = [
    ["Systèmes et Technologies de l'Informatique", "Computer Science & Information Technologies"],
    ["Espace réservé aux abonnés — connectez-vous pour continuer.", "Subscriber area — please sign in to continue."],
    ["Structure & Balises sémantiques", "Structure & Semantic Tags"],
    ["Layout & Menu de navigation", "Layout & Navigation Menu"],
    ["Page d'accueil interactive", "Interactive Home Page"],
    ["Flexbox et mise en page - Animations et transitions", "Flexbox & Page Layout — Animations and Transitions"],
    ["Mise en forme, mise en page et animations", "Styling, Page Layout and Animations"],
    ["Consultation de l'énoncé", "Exercise Instructions"],
    ["Tous droits réservés", "All rights reserved"],
    ["Conforme à l'Annexe", "Compliant with the Official STI Appendix"],
    ["Cours HTML5 complet", "Complete HTML5 Course"],
    ["Cours CSS3 complet", "Complete CSS3 Course"],
    ["Cours JavaScript complet", "Complete JavaScript Course"],
    ["Cours PHP complet", "Complete PHP Course"],
    ["Cours SQL complet", "Complete SQL Course"],
    ["Séries d'exercices", "Exercise Sets"],
    ["En attente de validation", "Pending approval"],
    ["Abonnés actifs", "Active subscribers"],
    ["Dernières connexions", "Recent logins"],
    ["En ligne", "Online"],
    ["Hors ligne", "Offline"]
  ];

  var ATTR_EXACT = {
    "vous@exemple.tn ou +216 20 123 456": "you@example.tn or +216 20 123 456",
    "Code ci-dessus": "Type code above",
    "Votre nom": "Your last name",
    "Votre prénom": "Your first name",
    "Rechercher une balise ou un type...": "Search a tag or input type...",
    "Rechercher dans le cours...": "Search in course...",
    "Fermer et revenir aux exercices": "Close and return to exercises"
  };

  function estDansCodeOuScript(noeud) {
    var p = noeud && noeud.parentElement;
    while (p) {
      var tag = p.tagName;
      if (tag === "CODE" || tag === "PRE" || tag === "SCRIPT" || tag === "STYLE" || tag === "TEXTAREA") {
        return true;
      }
      p = p.parentElement;
    }
    return false;
  }

  function traduireTexteNoeud(noeud) {
    if (!noeud || noeud.nodeType !== 3) return;
    if (estDansCodeOuScript(noeud)) return;
    var val = noeud.nodeValue;
    if (!val) return;
    var tr = val.trim();
    if (!tr) return;

    if (DICT_EXACT[tr]) {
      noeud.nodeValue = val.replace(tr, DICT_EXACT[tr]);
      return;
    }
    var modifie = val;
    for (var i = 0; i < REMPLACEMENTS_PARTIELS.length; i++) {
      var fr = REMPLACEMENTS_PARTIELS[i][0];
      var en = REMPLACEMENTS_PARTIELS[i][1];
      if (modifie.indexOf(fr) !== -1) {
        modifie = modifie.split(fr).join(en);
      }
    }
    if (modifie !== val) {
      noeud.nodeValue = modifie;
    }
  }

  function traduireArbreDOM(racine) {
    if (!estEn || !racine) return;
    var walker = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT, null, false);
    var n;
    while ((n = walker.nextNode())) {
      traduireTexteNoeud(n);
    }
    if (racine.querySelectorAll) {
      var els = racine.querySelectorAll("[placeholder],[title],[aria-label]");
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        var ph = el.getAttribute("placeholder");
        if (ph && ATTR_EXACT[ph]) el.setAttribute("placeholder", ATTR_EXACT[ph]);
        var ti = el.getAttribute("title");
        if (ti && ATTR_EXACT[ti]) el.setAttribute("title", ATTR_EXACT[ti]);
      }
    }
  }

  function initI18n() {
    insererBoutonLangueEnTete();
    if (estEn) {
      document.documentElement.lang = "en";
      traduireArbreDOM(document.body || document.documentElement);
      if (typeof MutationObserver !== "undefined" && document.body) {
        var obs = new MutationObserver(function (mutations) {
          for (var i = 0; i < mutations.length; i++) {
            var m = mutations[i];
            if (m.addedNodes) {
              for (var j = 0; j < m.addedNodes.length; j++) {
                var nd = m.addedNodes[j];
                if (nd.nodeType === 1) traduireArbreDOM(nd);
                else if (nd.nodeType === 3) traduireTexteNoeud(nd);
              }
            }
          }
        });
        obs.observe(document.body, { childList: true, subtree: true });
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initI18n);
  } else {
    initI18n();
  }
  window.addEventListener("load", insererBoutonLangueEnTete);
})();
