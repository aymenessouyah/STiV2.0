/* STI V2.0 — Profil abonné unique, session et statut GOLD existants. */

/** Profil : préférences, cours, lecture, exercices, quiz, vidéos, notes et nouveautés. */
(function (global) {
  "use strict";

  var CLE_PROFIL = "sti-profil-abonne";
  /* La passerelle ne modifie pas les thèmes des quiz historiques. */
  var profilPourQuiz = Boolean(typeof document !== "undefined" && document.currentScript && document.currentScript.hasAttribute("data-sti-quiz-seul"));
  var sourceProfil = typeof document !== "undefined" && document.currentScript ? document.currentScript.src : "";
  var THEMES_VALIDES = { sombre: true, clair: true, intermediaire: true };
  var LANGUES_VALIDES = { fr: true, en: true, ar: true };
  var TAILLES_VALIDES = { petite: true, normale: true, grande: true };
  var ETATS_CHAPITRE_VALIDES = { a_reviser: true, en_cours: true, revise: true };
  /* v593 : « Systèmes, technologies et Internet » est un vrai cours de la
     plateforme (3ème SI) : il doit compter comme les cinq autres, sinon il
     n'apparaît ni dans « en cours » ni dans la progression par matière. */
  var MATIERES_CLES = ["html5", "css3", "javascript", "sql", "php", "sti"];

  /* v611 — Flamme de régularité. On garde au plus un an de jours travaillés
     (366 dates « aaaa-mm-jj »), ce qui suffit pour la série en cours et le
     record, sans faire grossir le profil. */
  var MAX_JOURS_REGULARITE = 366;
  var CLE_JOURS_HISTORIQUES = "sti-jours-travail";
  var TROU_REGULARITE = 86400000;

  /* Les anciennes pages restent une source de visites, sans modifier leur journal. */
  var PAGES_COURS_HISTORIQUES = {
    html5: ["cours/html5.html", "cours/courshtml5.html"],
    css3: ["cours/css3.html", "cours/courscss3.html"],
    javascript: ["cours/javascript.html"],
    sql: ["cours/sql.html", "cours/sql-bases-ldd-lmd-lcd.html"],
    sti: ["cours/systemes-technologies-internet.html"],
    php: ["cours/php.html", "cours/coursphp.html", "cours/php-mysqli.html"]
  };

  /* Cache mémoire courant pour éviter tout accès superflu */
  var memoireProfil = null;
  var profilPresentDansStockage = false;
  var etatSessionCourant = {
    connecte: false,
    id: "",
    estGold: false,
    email: "",
    prenomSession: "",
    nomSession: "",
    classe: "",
    lycee: "",
    initiales: ""
  };

  function creerProfilParDefaut() {
    var themeDefaut = "sombre";
    try {
      if (
        global.matchMedia &&
        global.matchMedia("(prefers-color-scheme: light)").matches
      ) {
        themeDefaut = "clair";
      }
    } catch (e) {}

    return {
      prenom: "",
      theme: themeDefaut,
      langue: "fr",
      tailleTexte: "normale",
      vitesseAudio: 1,
      coursVisites: [],
      derniereLecture: {
        matiere: "",
        chapitre: "",
        chapitreId: "",
        pourcent: 0,
        url: ""
      },
      progression: {
        html5: false,
        css3: false,
        javascript: false,
        sql: false,
        php: false,
        sti: false
      },
      chapitres: {
        html5: {},
        css3: {},
        javascript: {},
        sql: {},
        php: {},
        sti: {}
      },
      exercicesFaits: {
        html5: [],
        css3: [],
        javascript: [],
        sql: [],
        php: [],
        sti: []
      },
      laboratoires: {
        html5: [],
        css3: [],
        javascript: [],
        sql: [],
        php: [],
        sti: []
      },
      /* v611 — jours travaillés (aaaa-mm-jj) pour la flamme de régularité. */
      joursTravail: [],
      quiz: [],
      videos: {
        vues: [],
        positions: {},
        derniere: null
      },
      notes: [],
      nouveautesLues: [],
      invitationInstallationVue: false
    };
  }

  function normaliserCarteChapitres(brutMat) {
    var out = {};
    if (!brutMat || typeof brutMat !== "object" || Array.isArray(brutMat)) return out;
    Object.keys(brutMat).forEach(function (idChap) {
      if (!/^[a-z0-9-]+$/i.test(idChap)) return;
      var val = String(brutMat[idChap] || "");
      if (ETATS_CHAPITRE_VALIDES[val]) {
        out[idChap] = val;
      } else if (brutMat[idChap] === true) {
        out[idChap] = "revise";
      }
    });
    return out;
  }

  /* v611 — dates « aaaa-mm-jj » valides, dédoublonnées, triées, un an maximum. */
  function normaliserJoursTravail(brut) {
    if (!Array.isArray(brut)) return [];
    var vus = {}, propres = [];
    brut.forEach(function (jour) {
      var texte = String(jour || "").trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(texte)) return;
      var d = new Date(texte + "T12:00:00Z");
      if (isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== texte) return;
      if (vus[texte]) return;
      vus[texte] = true;
      propres.push(texte);
    });
    propres.sort();
    return propres.slice(-MAX_JOURS_REGULARITE);
  }

  /* v611 — heure de Tunisie (GMT+1, sans heure d'été) : la journée d'un élève
     commence à minuit chez lui, pas à minuit UTC. */
  function jourDeTunis(date) {
    var base = date instanceof Date && !isNaN(date.getTime()) ? date : new Date();
    var tunis = new Date(base.getTime() + 3600000);
    return { jour: tunis.toISOString().slice(0, 10), millis: base.getTime() };
  }

  /* v611 — invariante : « aaaa-mm-jj » + 12 h UTC → millisecondes, sans bug de fuseau. */
  function millisDuJour(jour) {
    return Date.parse(String(jour) + "T12:00:00Z");
  }

  /* v611 — compte des jours d'affilée. Une série continue tant qu'il n'y a pas
     deux jours vides de suite : si l'élève travaille aujourd'hui, la série
     inclut hier ; s'il ne travaille qu'après minuit, la veille compte encore
     (on ne casse pas une flamme parce qu'on a révisé tard). */
  function calculerSerieJours(jours, dateReference) {
    var liste = normaliserJoursTravail(jours);
    var presents = {};
    liste.forEach(function (j) { presents[j] = true; });
    var today = jourDeTunis(dateReference);
    var veille = jourDeTunis(new Date(today.millis - TROU_REGULARITE));
    /* La série se compte jusqu'à aujourd'hui, ou jusqu'à hier tant que la
       journée n'est pas finie : un élève qui a travaillé hier garde sa flamme
       jusqu'à minuit. Au-delà d'hier, la flamme est éteinte (le record reste). */
    var depart = presents[today.jour] ? today.jour : (presents[veille.jour] ? veille.jour : "");

    var serie = 0;
    if (depart) {
      var curseur = millisDuJour(depart);
      while (presents[new Date(curseur).toISOString().slice(0, 10)] && serie <= MAX_JOURS_REGULARITE) {
        serie += 1;
        curseur -= TROU_REGULARITE;
      }
    }

    /* Record : la plus longue suite jamais enregistrée. */
    var record = 0, suite = 0, precedent = null;
    liste.forEach(function (j) {
      var m = millisDuJour(j);
      if (precedent !== null && m - precedent === TROU_REGULARITE) suite += 1;
      else suite = 1;
      if (suite > record) record = suite;
      precedent = m;
    });

    return {
      serie: serie,
      record: record,
      aujourdhui: Boolean(presents[today.jour]),
      totalJours: liste.length,
      dernierJour: liste.length ? liste[liste.length - 1] : ""
    };
  }

  function normaliserProfil(brut) {
    var def = creerProfilParDefaut();
    var src = brut && typeof brut === "object" ? brut : {};

    var dl = src.derniereLecture && typeof src.derniereLecture === "object"
      ? src.derniereLecture
      : {};
    var prog = src.progression && typeof src.progression === "object"
      ? src.progression
      : {};
    var chaps = src.chapitres && typeof src.chapitres === "object"
      ? src.chapitres
      : {};
    var exos = src.exercicesFaits && typeof src.exercicesFaits === "object"
      ? src.exercicesFaits
      : {};
    var vids = src.videos && typeof src.videos === "object"
      ? src.videos
      : {};
    var labs = src.laboratoires && typeof src.laboratoires === "object"
      ? src.laboratoires
      : {};

    var chapitresPropres = {};
    var exosPropres = {};
    var laboratoiresPropres = {};
    MATIERES_CLES.forEach(function (m) {
      chapitresPropres[m] = normaliserCarteChapitres(chaps[m]);
      exosPropres[m] = Array.isArray(exos[m])
        ? Array.from(new Set(exos[m].map(String).filter(Boolean)))
        : [];
      laboratoiresPropres[m] = Array.isArray(labs[m])
        ? Array.from(new Set(labs[m].map(String).filter(function (id) { return /^[a-z0-9-]+$/i.test(id); })))
        : [];
    });

    var positionsPropres = {};
    if (vids.positions && typeof vids.positions === "object" && !Array.isArray(vids.positions)) {
      Object.keys(vids.positions).forEach(function (idV) {
        var sec = Math.max(0, Math.floor(Number(vids.positions[idV]) || 0));
        if (sec > 0) positionsPropres[idV] = sec;
      });
    }

    var vit = Number(src.vitesseAudio);
    var vitesseValide = (vit === 0.85 || vit === 1 || vit === 1.15) ? vit : 1;

    return {
      prenom: typeof src.prenom === "string" ? src.prenom.trim().slice(0, 48) : def.prenom,
      theme: THEMES_VALIDES[src.theme] ? src.theme : def.theme,
      langue: LANGUES_VALIDES[src.langue] ? src.langue : def.langue,
      tailleTexte: TAILLES_VALIDES[src.tailleTexte] ? src.tailleTexte : def.tailleTexte,
      vitesseAudio: vitesseValide,
      coursVisites: Array.isArray(src.coursVisites)
        ? Array.from(new Set(src.coursVisites.filter(function (m) { return MATIERES_CLES.indexOf(m) !== -1; })))
        : [],
      derniereLecture: {
        matiere: typeof dl.matiere === "string" ? dl.matiere : "",
        chapitre: typeof dl.chapitre === "string" ? dl.chapitre : "",
        chapitreId: typeof dl.chapitreId === "string" ? dl.chapitreId : "",
        pourcent: Math.max(0, Math.min(100, Math.round(Number(dl.pourcent) || 0))),
        url: typeof dl.url === "string" ? dl.url : ""
      },
      progression: {
        html5: Boolean(prog.html5),
        css3: Boolean(prog.css3),
        javascript: Boolean(prog.javascript),
        sql: Boolean(prog.sql),
        php: Boolean(prog.php),
        sti: Boolean(prog.sti)
      },
      chapitres: chapitresPropres,
      exercicesFaits: exosPropres,
      laboratoires: laboratoiresPropres,
      joursTravail: normaliserJoursTravail(src.joursTravail),
      quiz: Array.isArray(src.quiz)
        ? src.quiz.filter(function (q) { return q && typeof q === "object"; }).map(function (q) {
            return {
              matiere: String(q.matiere || "Quiz STI"),
              score: Number(q.score) || 0,
              total: Math.max(1, Number(q.total) || 20),
              date: String(q.date || ""),
              erreurs: Array.isArray(q.erreurs) ? q.erreurs.map(String) : []
            };
          })
        : [],
      videos: {
        vues: Array.isArray(vids.vues)
          ? Array.from(new Set(vids.vues.map(String).filter(Boolean)))
          : [],
        positions: positionsPropres,
        derniere: vids.derniere && typeof vids.derniere === "object"
          ? {
              id: String(vids.derniere.id || ""),
              matiere: String(vids.derniere.matiere || ""),
              titre: String(vids.derniere.titre || ""),
              temps: Math.max(0, Math.floor(Number(vids.derniere.temps) || 0)),
              duree: Math.max(0, Math.floor(Number(vids.derniere.duree) || 0)),
              url: String(vids.derniere.url || "")
            }
          : null
      },
      notes: Array.isArray(src.notes)
        ? src.notes.filter(function (n) { return n && typeof n === "object"; }).map(function (n) {
            return {
              atelier: String(n.atelier || "Atelier STI"),
              note: Math.max(0, Math.min(20, Number(n.note) || 0)),
              date: String(n.date || "")
            };
          })
        : [],
      nouveautesLues: Array.isArray(src.nouveautesLues)
        ? Array.from(new Set(src.nouveautesLues.map(String).filter(Boolean)))
        : [],
      invitationInstallationVue: src.invitationInstallationVue === true
    };
  }

  /* Le thème intermédiaire utilise le rendu sombre historique. */
  function synchroniserThemesHistoriques(theme) {
    try {
      var stockage = global.localStorage;
      if (!stockage || !THEMES_VALIDES[theme]) return;
      var ancien = theme === "clair" ? "light" : "dark";
      [["sti-theme", ancien], ["theme", ancien], ["sti-roue-theme", theme]].forEach(function (paire) {
        if (stockage.getItem(paire[0]) !== paire[1]) stockage.setItem(paire[0], paire[1]);
      });
    } catch (e) { /* Le mode reste disponible même si le stockage est bloqué. */ }
  }

  function reprendreThemeHistorique(profil) {
    try {
      var stockage = global.localStorage;
      if (!stockage) return profil;
      var aProfil = !!stockage.getItem(CLE_PROFIL);
      var historique = stockage.getItem("sti-theme") || stockage.getItem("theme");
      var roue = stockage.getItem("sti-roue-theme");
      if (!aProfil && THEMES_VALIDES[roue]) profil.theme = roue;
      else if (historique === "light" && profil.theme !== "clair") profil.theme = "clair";
      else if (historique === "dark" && profil.theme === "clair") profil.theme = "sombre";
    } catch (e) {}
    return profil;
  }

  /* Préférences appliquées avant affichage pour éviter le flash. */
  function appliquerPreferencesDOM(profil, avecTransition) {
    try {
      var docEl = document.documentElement;
      if (!docEl || !profil) return;

      if (avecTransition) {
        docEl.classList.add("sti-theme-anim");
        setTimeout(function () {
          docEl.classList.remove("sti-theme-anim");
        }, 320);
      }

      // Les anciennes pages attendent encore dark/light dans data-theme ;
      // un attribut séparé transmet les trois modes à leur habillage commun.
      if (typeof docEl.hasAttribute === "function" && docEl.hasAttribute("data-sti-heritage")) {
        docEl.setAttribute("data-sti-theme", profil.theme);
        docEl.setAttribute("data-theme", profil.theme === "clair" ? "light" : "dark");
      } else {
        docEl.setAttribute("data-theme", profil.theme);
      }
      docEl.setAttribute("data-taille-texte", profil.tailleTexte);
      docEl.setAttribute("lang", profil.langue);
      docEl.setAttribute("dir", profil.langue === "ar" ? "rtl" : "ltr");
      /* La page HTML5 attend ces préférences avant son premier affichage. */
      docEl.classList.remove("sti-theme-wait");

      /* Compatibilité visuelle avec les fenêtres modales existantes d'acces.js */
      var estSombre = profil.theme !== "clair";
      docEl.classList.toggle("dark", estSombre);
      docEl.classList.toggle("dark-mode", estSombre);
      var roue = document.getElementById("sti-roue-wrap");
      if (roue) roue.classList.toggle("sti-theme-sombre", estSombre);
      var boutonTheme = document.getElementById("sti-pan-theme");
      if (boutonTheme) boutonTheme.textContent = estSombre ? "☀️" : "🌙";
      synchroniserThemesHistoriques(profil.theme);
    } catch (e) {}
  }

  function notifierChangement(nomEvenement, donnees) {
    try {
      if (typeof CustomEvent === "function" && global.dispatchEvent) {
        global.dispatchEvent(new CustomEvent(nomEvenement, { detail: donnees }));
      }
    } catch (e) {}
  }

  function chargerProfil() {
    try {
      var texte = global.localStorage ? global.localStorage.getItem(CLE_PROFIL) : null;
      if (texte) {
        try { memoireProfil = normaliserProfil(JSON.parse(texte)); }
        catch (eJson) { memoireProfil = creerProfilParDefaut(); }
        profilPresentDansStockage = true;
        return JSON.parse(JSON.stringify(memoireProfil));
      }
      /* Changer de compte invalide le profil en mémoire. */
      if (global.localStorage && profilPresentDansStockage) {
        memoireProfil = null;
        profilPresentDansStockage = false;
      }
    } catch (e) {}

    if (!memoireProfil) {
      memoireProfil = creerProfilParDefaut();
    }
    return JSON.parse(JSON.stringify(memoireProfil));
  }

  function invitationInstallationDejaVue() {
    if (chargerProfil().invitationInstallationVue) return true;
    try {
      var stockage = global.localStorage;
      return Boolean(stockage && (
        stockage.getItem("sti-pwa-bulle-vue") === "1" ||
        stockage.getItem("sti-install-fab") === "off"
      ));
    } catch (e) {
      return false;
    }
  }

  function sauvegarderProfil(profil, avecTransition) {
    var propre = normaliserProfil(profil);
    memoireProfil = propre;
    try {
      if (global.localStorage) {
        global.localStorage.setItem(CLE_PROFIL, JSON.stringify(propre));
        profilPresentDansStockage = true;
      }
    } catch (e) {
      /* Le repli mémoire continue de fonctionner si le stockage est refusé. */
      profilPresentDansStockage = false;
    }
    appliquerPreferencesDOM(propre, Boolean(avecTransition));
    notifierChangement("sti:profil-maj", JSON.parse(JSON.stringify(propre)));
    return JSON.parse(JSON.stringify(propre));
  }

  function mettreAJour(chemin, valeur) {
    var courant = chargerProfil();
    var cleChaine = String(chemin || "").trim();
    if (!cleChaine) return courant;

    var segments = cleChaine.split(".");
    var curseur = courant;
    for (var i = 0; i < segments.length - 1; i++) {
      var seg = segments[i];
      if (!curseur[seg] || typeof curseur[seg] !== "object" || Array.isArray(curseur[seg])) {
        curseur[seg] = {};
      }
      curseur = curseur[seg];
    }
    var derniereCle = segments[segments.length - 1];
    curseur[derniereCle] = valeur;

    var animTheme = cleChaine === "theme";
    return sauvegarderProfil(courant, animTheme);
  }

  /* Les visites identiques ne provoquent pas de réécriture. */
  function enregistrerVisiteCours(matiere) {
    var p = chargerProfil();
    if (MATIERES_CLES.indexOf(matiere) === -1 || p.coursVisites[0] === matiere) return p;
    p.coursVisites = [matiere].concat(p.coursVisites.filter(function (m) { return m !== matiere; }));
    return sauvegarderProfil(p, false);
  }

  /* Fusionner les visites sans modifier les autres données du profil. */
  function fusionnerCoursVisites(visitesLocales) {
    var p = chargerProfil();
    if (!Array.isArray(visitesLocales)) return p;
    var manquantes = Array.from(new Set(visitesLocales.filter(function (m) {
      return MATIERES_CLES.indexOf(m) !== -1 && p.coursVisites.indexOf(m) === -1;
    })));
    if (!manquantes.length) return p;
    p.coursVisites = p.coursVisites.concat(manquantes);
    return sauvegarderProfil(p, false);
  }

  /* Lire les visites historiques sans compter les exercices seuls. */
  function listerCoursVisites() {
    var p = chargerProfil();
    var visites = p.coursVisites.slice();
    function ajouter(matiere) {
      if (MATIERES_CLES.indexOf(matiere) !== -1 && visites.indexOf(matiere) === -1) visites.push(matiere);
    }
    if (p.derniereLecture && p.derniereLecture.chapitreId) ajouter(p.derniereLecture.matiere);
    MATIERES_CLES.forEach(function (m) {
      var etats = p.chapitres[m] || {};
      if (Object.keys(etats).some(function (id) { return etats[id] === "en_cours" || etats[id] === "revise"; })) ajouter(m);
    });
    try {
      var pages = JSON.parse(global.localStorage.getItem("sti-pages-vues-v432") || "{}");
      if (pages && typeof pages === "object" && !Array.isArray(pages)) {
        MATIERES_CLES.forEach(function (m) {
          if (PAGES_COURS_HISTORIQUES[m].some(function (slug) {
            var valeur = pages[slug];
            return valeur === true || ((typeof valeur === "number" || typeof valeur === "string") && Number(valeur) > 0);
          })) ajouter(m);
        });
      }
    } catch (e) {}
    return visites;
  }

  /* Une révision de chapitre met à jour la progression globale. */
  function definirEtatChapitre(matiere, idChapitre, etat, totalChapitres) {
    var p = chargerProfil();
    if (!MATIERES_CLES.includes(matiere) || !/^[a-z0-9-]+$/i.test(idChapitre || "")) return p;
    if (!p.chapitres[matiere]) p.chapitres[matiere] = {};

    var etatAvant = p.chapitres[matiere][idChapitre];
    var etatValide = ETATS_CHAPITRE_VALIDES[etat] ? etat : "a_reviser";
    if (etatValide === "a_reviser") {
      delete p.chapitres[matiere][idChapitre];
    } else {
      p.chapitres[matiere][idChapitre] = etatValide;
    }

    /* Recalculer les révisions seulement si elles changent. */
    if (totalChapitres > 0 && (etatValide === "revise" || etatAvant === "revise")) {
      var nbRevises = Object.keys(p.chapitres[matiere]).filter(function (k) {
        return p.chapitres[matiere][k] === "revise";
      }).length;
      p.progression[matiere] = nbRevises >= totalChapitres;
    }
    return sauvegarderProfil(p, false);
  }

  /* Une lecture ne retire pas le marquage déjà révisé. */
  function enregistrerLecture(matiere, idChapitre, titre, pourcent, url) {
    var p = chargerProfil();
    if (!MATIERES_CLES.includes(matiere) || !/^[a-z0-9-]+$/i.test(idChapitre || "")) return p;
    if (p.chapitres[matiere][idChapitre] !== "revise") {
      p.chapitres[matiere][idChapitre] = "en_cours";
    }
    p.derniereLecture = {
      matiere: matiere,
      chapitre: String(titre || ""),
      chapitreId: idChapitre,
      pourcent: Math.max(0, Math.min(100, Math.round(Number(pourcent) || 0))),
      url: String(url || "")
    };
    p.joursTravail = joursAvecAujourdhui(p.joursTravail);
    return sauvegarderProfil(p, false);
  }

  function basculerExerciceFait(matiere, idExercice, fait) {
    var p = chargerProfil();
    if (!MATIERES_CLES.includes(matiere) || !idExercice) return p;
    var liste = Array.isArray(p.exercicesFaits[matiere]) ? p.exercicesFaits[matiere].slice() : [];
    var idx = liste.indexOf(idExercice);
    var doitEtreFait = typeof fait === "boolean" ? fait : idx === -1;

    if (doitEtreFait && idx === -1) {
      liste.push(idExercice);
    } else if (!doitEtreFait && idx !== -1) {
      liste.splice(idx, 1);
    }
    p.exercicesFaits[matiere] = liste;
    if (doitEtreFait && liste.indexOf(idExercice) !== -1) p.joursTravail = joursAvecAujourdhui(p.joursTravail);
    return sauvegarderProfil(p, false);
  }

  /* Ne pas multiplier les écritures pendant les manipulations du laboratoire. */
  function enregistrerLaboratoire(matiere, idLaboratoire) {
    var p = chargerProfil();
    if (!MATIERES_CLES.includes(matiere) || !/^[a-z0-9-]+$/i.test(idLaboratoire || "")) return p;
    var liste = p.laboratoires[matiere];
    if (liste.indexOf(idLaboratoire) !== -1) return p;
    liste.push(idLaboratoire);
    p.joursTravail = joursAvecAujourdhui(p.joursTravail);
    return sauvegarderProfil(p, false);
  }

  function enregistrerPositionVideo(info) {
    if (!info || !info.id) return chargerProfil();
    var p = chargerProfil();
    var idV = String(info.id);
    var temps = Math.max(0, Math.floor(Number(info.temps) || 0));
    var duree = Math.max(0, Math.floor(Number(info.duree) || 0));

    if (!p.videos.positions) p.videos.positions = {};
    if (temps > 2 && (!info.terminee)) {
      p.videos.positions[idV] = temps;
    } else if (info.terminee) {
      delete p.videos.positions[idV];
    }

    if (info.terminee && p.videos.vues.indexOf(idV) === -1) {
      p.videos.vues.push(idV);
      p.joursTravail = joursAvecAujourdhui(p.joursTravail);
    }

    /* L’illustration ne remplace pas la reprise principale. */
    if (!info.secondaire) {
      p.videos.derniere = {
        id: idV,
        matiere: String(info.matiere || ""),
        titre: String(info.titre || ""),
        temps: info.terminee ? 0 : temps,
        duree: duree,
        url: String(info.url || "")
      };
    }
    return sauvegarderProfil(p, false);
  }

  /* v611 — pointer la journée dès qu'un travail réel est enregistré.
     `date` n'est là que pour les tests : l'appel normal ne la passe pas. */
  function joursAvecAujourdhui(jours) {
    var liste = normaliserJoursTravail(jours);
    var jour = jourDeTunis().jour;
    if (liste.indexOf(jour) === -1) liste.push(jour);
    return normaliserJoursTravail(liste);
  }

  function enregistrerJourTravail(date) {
    var p = chargerProfil();
    var jour = jourDeTunis(date).jour;
    var jours = normaliserJoursTravail(p.joursTravail);
    if (jours.indexOf(jour) !== -1) return p;
    jours.push(jour);
    p.joursTravail = normaliserJoursTravail(jours);
    return sauvegarderProfil(p, false);
  }

  function lireRegularite(date) {
    var p = chargerProfil();
    return calculerSerieJours(p.joursTravail, date);
  }

  /* v611 — reprise de l'historique de régularité des journaux déjà en place
     (pages vues, exercices, quiz, vidéos) : l'élève qui travaille depuis des
     semaines ne doit pas voir une flamme à « 1 jour » le jour de la mise à jour.
     On ne devine rien : seules les dates réellement écrites sont reprises. */
  function joursDepuisJournauxHistoriques() {
    var dates = {}, aJoute = false;
    function ajouter(valeur) {
      var texte = String(valeur || "").trim();
      if (!texte) return;
      var m = texte.match(/^(\d{4}-\d{2}-\d{2})/);
      if (m) { if (!dates[m[1]]) aJoute = true; dates[m[1]] = true; return; }
      var ms = Number(texte);
      if (isFinite(ms) && ms > 1000000000000) {
        var j = jourDeTunis(new Date(ms)).jour;
        if (!dates[j]) aJoute = true;
        dates[j] = true;
      }
    }
    try {
      var stockage = global.localStorage;
      if (!stockage) return [];
      var pages = null;
      try { pages = JSON.parse(stockage.getItem("sti-pages-vues-v432") || "null"); } catch (e) {}
      if (pages && typeof pages === "object") {
        Object.keys(pages).forEach(function (cle) { ajouter(pages[cle]); });
      }
    } catch (e) {}
    var profil = chargerProfil();
    (profil.quiz || []).forEach(function (q) { ajouter(q && q.date); });
    (profil.notes || []).forEach(function (n) { ajouter(n && n.date); });
    return Object.keys(dates).sort();
  }

  function reparerRegularite() {
    var p = chargerProfil();
    var actuels = normaliserJoursTravail(p.joursTravail);
    var ajoutes = joursDepuisJournauxHistoriques();
    if (!ajoutes.length) return actuels;
    p.joursTravail = normaliserJoursTravail(actuels.concat(ajoutes));
    sauvegarderProfil(p, false);
    return p.joursTravail;
  }

  function reinitialiser() {
    try {
      if (global.localStorage) {
        global.localStorage.removeItem(CLE_PROFIL);
      }
    } catch (e) {}
    memoireProfil = creerProfilParDefaut();
    profilPresentDansStockage = false;
    appliquerPreferencesDOM(memoireProfil, true);
    notifierChangement("sti:profil-reset", null);
    notifierChangement("sti:profil-maj", JSON.parse(JSON.stringify(memoireProfil)));
    return JSON.parse(JSON.stringify(memoireProfil));
  }

  function calculerInitiales(prenom, nom, email) {
    var p = String(prenom || "").trim();
    var n = String(nom || "").trim();
    if (p && n) {
      return (p.charAt(0) + n.charAt(0)).toUpperCase();
    }
    if (p) {
      var morceaux = p.split(/\s+/).filter(Boolean);
      if (morceaux.length >= 2) {
        return (morceaux[0].charAt(0) + morceaux[1].charAt(0)).toUpperCase();
      }
      return p.slice(0, 2).toUpperCase();
    }
    var em = String(email || "").trim();
    if (em) {
      return em.slice(0, 2).toUpperCase();
    }
    return "AB";
  }

  /* v602 : la photo validée du compte (bucket « photos-profils » ou image
     locale), telle que l'a mémorisée acces.js dans le cache de session.
     app.js ne touche jamais au stockage : il demande la photo ici, ce qui garde
     une seule porte d'entrée vers les données du compte. */
  function photoCompte() {
    try {
      var cacheAcces = JSON.parse((global.localStorage && global.localStorage.getItem("sti-session-cache")) || "null");
      var url = String((cacheAcces && (cacheAcces.photo_url || cacheAcces.photo_attente)) || "").trim();
      return /^(https:\/\/|data:image\/)/i.test(url) ? url : "";
    } catch (e) {
      return "";
    }
  }

  /* Session et GOLD : lecture seule des scripts d’accès existants. */
  function lireEtatSession() {
    var profil = chargerProfil();
    var cacheAcces = null;

    /* Lecture seule du cache de session maintenu par acces.js pour le mode hors-ligne */
    try {
      if (global.localStorage) {
        cacheAcces = JSON.parse(global.localStorage.getItem("sti-session-cache") || "null");
      }
    } catch (e) {}

    /* Un cache d'accès d'un ancien compte ne doit pas fournir le nom du nouveau. */
    if (etatSessionCourant.connecte && cacheAcces) {
      var identitesConnues = etatSessionCourant.id && cacheAcces.id;
      var autreCompte = identitesConnues
        ? etatSessionCourant.id !== cacheAcces.id
        : Boolean(etatSessionCourant.email && cacheAcces.email && String(etatSessionCourant.email).toLowerCase() !== String(cacheAcces.email).toLowerCase());
      if (autreCompte) cacheAcces = null;
    }

    /* Attendre l’isolation avant d’exposer les données du compte. */
    var uidActuel = etatSessionCourant.id || (cacheAcces && cacheAcces.id) || "";
    var compteEnAttente = false;
    try {
      var uidStocke = global.localStorage && global.localStorage.getItem("sti-sync-uid");
      compteEnAttente = Boolean(uidActuel && uidStocke && uidActuel !== uidStocke);
    } catch (eUid) {}

    var docEl = document.documentElement;
    var bodyEl = document.body;
    var estGoldActif = Boolean(
      global.__STI_GOLD === true ||
      (docEl && docEl.classList.contains("sti-gold")) ||
      (bodyEl && bodyEl.classList.contains("sti-gold")) ||
      (cacheAcces && cacheAcces.gold === true)
    );

    var connecteCache = Boolean(cacheAcces && cacheAcces.statut === "actif");
    var prenomCompte = (cacheAcces && cacheAcces.prenom) ||
      etatSessionCourant.prenomSession ||
      (!compteEnAttente && profil.prenom) || "";
    var prenom = (!compteEnAttente && profil.prenom) || prenomCompte;
    var nom = (cacheAcces && cacheAcces.nom) || etatSessionCourant.nomSession || "";
    var email = (cacheAcces && cacheAcces.email) || etatSessionCourant.email || "";

    if (!prenom && email) {
      prenom = email.split("@")[0].replace(/[._-]+/g, " ");
      prenom = prenom.charAt(0).toUpperCase() + prenom.slice(1);
    }

    var connecte = Boolean(etatSessionCourant.connecte || connecteCache);

    return {
      connecte: connecte,
      compteEnAttente: compteEnAttente,
      id: uidActuel,
      estGold: estGoldActif,
      prenom: prenom || "Abonné",
      prenomCompte: String(prenomCompte || "Abonné").trim().slice(0, 48) || "Abonné",
      nom: nom,
      email: email,
      classe: (cacheAcces && cacheAcces.classe) || etatSessionCourant.classe || "",
      lycee: (cacheAcces && cacheAcces.lycee) || etatSessionCourant.lycee || "Lycée Raféha",
      initiales: calculerInitiales(prenom, nom, email),
      urlPortail: ((global.STI_AUTH && global.STI_AUTH.RACINE) || "./") + "portail.html"
    };
  }

  function memoriserSession(sess) {
    var utilisateur = sess && sess.user;
    var meta = (utilisateur && utilisateur.user_metadata) || {};
    etatSessionCourant.connecte = Boolean(utilisateur);
    etatSessionCourant.id = (utilisateur && utilisateur.id) || "";
    etatSessionCourant.email = (utilisateur && utilisateur.email) || "";
    etatSessionCourant.prenomSession = meta.prenom || meta.first_name || "";
    etatSessionCourant.nomSession = meta.nom || meta.last_name || "";
    etatSessionCourant.classe = meta.classe || "";
    etatSessionCourant.lycee = meta.lycee || "";
  }

  function synchroniserLectureSessionSupabase() {
    try {
      var client = global.__STI_SB_CLIENT;
      if (!client || !client.auth || typeof client.auth.getSession !== "function") {
        return;
      }
      client.auth.getSession().then(function (rep) {
        var sess = rep && rep.data ? rep.data.session : null;
        memoriserSession(sess);
        if (sess && sess.user) {
          var p = chargerProfil();
          if (!lireEtatSession().compteEnAttente && !p.prenom && etatSessionCourant.prenomSession) {
            mettreAJour("prenom", etatSessionCourant.prenomSession);
          }
        }
        notifierChangement("sti:session-maj", lireEtatSession());
      }).catch(function () {});

      if (!synchroniserLectureSessionSupabase._ecouteurActif && typeof client.auth.onAuthStateChange === "function") {
        synchroniserLectureSessionSupabase._ecouteurActif = true;
        client.auth.onAuthStateChange(function (_ev, sess) {
          memoriserSession(sess);
          notifierChangement("sti:session-maj", lireEtatSession());
        });
      }
    } catch (e) {}
  }

  if (!profilPourQuiz) {
  /* ── Amorçage immédiat dès le chargement du script (zéro flash de thème) ── */
  var profilInitial = chargerProfil();
  var themeAvantReprise = profilInitial.theme;
  profilInitial = reprendreThemeHistorique(profilInitial);
  if (profilInitial.theme !== themeAvantReprise) sauvegarderProfil(profilInitial, false);
  else appliquerPreferencesDOM(profilInitial, false);

  /* Ré-écoute des mises à jour cloud effectuées par sync-progressions.js ou un autre onglet */
  if (typeof global.addEventListener === "function") {
    global.addEventListener("storage", function (ev) {
      if (!ev || !ev.key || ev.key === CLE_PROFIL || ev.key === "sti-session-cache" || ev.key === "sti-gold") {
        memoireProfil = null;
        var pMaj = chargerProfil();
        appliquerPreferencesDOM(pMaj, false);
        notifierChangement("sti:profil-maj", pMaj);
        notifierChangement("sti:session-maj", lireEtatSession());
        return;
      }
      var cle = ev.key, valeur = ev.newValue;
      if ((cle === "sti-theme" || cle === "theme" || cle === "sti-sql-theme") && (valeur === "dark" || valeur === "light")) {
        // acces.js applique aussi cette notification en dark/light. Rétablir
        // ensuite les trois modes V2 et reprendre un choix venu d'une ancienne page.
        setTimeout(function () {
          var profil = chargerProfil();
          var choisi = valeur === "light" ? "clair" : (profil.theme === "intermediaire" ? "intermediaire" : "sombre");
          if (profil.theme !== choisi) mettreAJour("theme", choisi);
          else appliquerPreferencesDOM(profil, false);
        }, 0);
      } else if (cle === "sti-roue-theme" && THEMES_VALIDES[valeur]) {
        setTimeout(function () {
          try { if (global.localStorage.getItem(cle) !== valeur) return; } catch (e) { return; }
          var profil = chargerProfil();
          // Une page à deux thèmes réécrit « intermédiaire » en « sombre »
          // à son démarrage : ce n'est pas un choix explicite de l'utilisateur.
          if (profil.theme === "intermediaire" && valeur === "sombre") {
            synchroniserThemesHistoriques(profil.theme);
          } else if (profil.theme !== valeur) {
            mettreAJour("theme", valeur);
          }
        }, 0);
      }
    });

    global.addEventListener("DOMContentLoaded", function () {
      // Le bouton historique de la roue continue de piloter le profil V2.
      document.addEventListener("click", function (ev) {
        if (!ev.target || !ev.target.closest || !ev.target.closest("#sti-pan-theme")) return;
        setTimeout(function () {
          var nouveau = document.documentElement.classList.contains("dark-mode") ? "sombre" : "clair";
          if (chargerProfil().theme !== nouveau) mettreAJour("theme", nouveau);
        }, 0);
      }, true); // acces.js arrête la propagation : observer le clic en phase de capture.
      synchroniserLectureSessionSupabase();
      setTimeout(synchroniserLectureSessionSupabase, 600);

      // Le panneau reconstruit conserve un champ de date nommé.
      function nommerDateRoue() {
        var champ = document.getElementById("sti-plan-date");
        if (champ && !champ.hasAttribute("aria-label")) champ.setAttribute("aria-label", "Date de l’épreuve du bac");
      }
      nommerDateRoue();
      if (typeof MutationObserver === "function" && document.body) {
        var obsRoue = new MutationObserver(function (mutations) {
          if (mutations.some(function (mutation) {
            return Array.prototype.some.call(mutation.addedNodes, function (n) {
              return n.nodeType === 1 && (n.id === "sti-plan-date" || (n.querySelector && n.querySelector("#sti-plan-date")));
            });
          })) nommerDateRoue();
          /* Relire le cache d'accès après modification du panneau. */
          if (mutations.some(function (mutation) {
            var cible = mutation.target && (mutation.target.nodeType === 1 ? mutation.target : mutation.target.parentElement);
            return (cible && cible.closest && cible.closest("#sti-pan-login")) ||
              Array.prototype.some.call(mutation.addedNodes, function (n) {
                return n.nodeType === 1 && (n.id === "sti-pan-login" || (n.querySelector && n.querySelector("#sti-pan-login")));
              });
          })) notifierChangement("sti:session-maj", lireEtatSession());
        });
        obsRoue.observe(document.body, { childList: true, subtree: true });
      }
      if (typeof MutationObserver === "function" && document.documentElement) {
        var obs = new MutationObserver(function () {
          notifierChangement("sti:session-maj", lireEtatSession());
        });
        obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
      }
    });
  }

  }

  /* Préparer le verrou historique avant activation du SW. */
  function preparerActivationServiceWorker(version) {
    var numero = String(version || "");
    if (!/^\d{1,6}$/.test(numero)) return false;
    try {
      global.sessionStorage.setItem("sti-sw-reload-ver", numero);
      global.localStorage.setItem("sti-sw-reload-ver", numero);
      global.localStorage.setItem("sti-version-installee", numero);
      return true;
    } catch (e) { return false; }
  }
  function preparerVerificationServiceWorker(version) {
    var numero = String(version || "");
    if (!/^\d{1,6}$/.test(numero)) return false;
    try {
      if (Number(numero) <= Number(global.localStorage.getItem("sti-version-installee") || 0)) return false;
      return preparerActivationServiceWorker(numero);
    } catch (e) { return false; }
  }

  /* Passerelle réservée aux compteurs historiques du compte isolé. */
  var CLES_XP_QUIZ = ["quizzora_xp_v1", "sti-quiz-xp-js-v1", "sqlQuestV3", "quizphp_v1_user"];
  function compteQuizIsole(uid) {
    try { return Boolean(uid && global.localStorage.getItem("sti-sync-uid") === String(uid)); }
    catch (e) { return false; }
  }
  function lireAcquisQuiz(cle, uid) {
    if (CLES_XP_QUIZ.indexOf(cle) < 0 || !compteQuizIsole(uid)) return null;
    try {
      var brut = global.localStorage.getItem(cle);
      if (brut === null) return {};
      var valeur = JSON.parse(brut);
      return valeur && typeof valeur === "object" && !Array.isArray(valeur) ? valeur : null;
    } catch (e) { return null; }
  }
  /* v520 : un compteur XP ne recule jamais. Avant chaque écriture, les champs
     cumulés (xp, records, parties…) sont relevés au maximum déjà stocké : une
     réponse cloud retardataire ou une correction de doublon ne peut plus faire
     descendre le total affiché sur l'appareil. */
  var CHAMPS_XP_MONOTONES = {
    "quizzora_xp_v1": ["xp", "best", "parties", "bonnes", "total"],
    "sti-quiz-xp-js-v1": ["xp", "best", "parties", "bonnes", "total"],
    "sqlQuestV3": ["xp", "level", "totalAnswered", "totalCorrect", "bestCombo", "playgroundCount"],
    "quizphp_v1_user": ["xp", "best"]
  };
  function releverAcquisQuiz(cle, valeur) {
    var champs = CHAMPS_XP_MONOTONES[cle];
    if (!champs) return valeur;
    var avant = null;
    try { avant = JSON.parse(global.localStorage.getItem(cle) || "null"); } catch (e) { avant = null; }
    if (!avant || typeof avant !== "object" || Array.isArray(avant)) return valeur;
    var sortie = Object.assign({}, valeur), change = false;
    champs.forEach(function (champ) {
      if (avant[champ] === undefined && sortie[champ] === undefined) return;
      var a = Number(avant[champ]) || 0;
      var b = Number(sortie[champ]) || 0;
      if (a > b) { sortie[champ] = a; change = true; }
    });
    return change ? sortie : valeur;
  }
  function ecrireAcquisQuiz(cle, uid, valeur, notifier) {
    if (!lireAcquisQuiz(cle, uid) || !valeur || typeof valeur !== "object" || Array.isArray(valeur)) return false;
    valeur = releverAcquisQuiz(cle, valeur);
    try {
      var texte = JSON.stringify(valeur);
      if (texte === global.localStorage.getItem(cle)) return true;
      global.localStorage.setItem(cle, texte);
      if (notifier !== false) notifierChangement("sti-cloud-restored", { quiz: cle });
      return true;
    } catch (e) { return false; }
  }

  /* Une clé par opération et par compte évite les collisions d’onglets. */
  var PREFIXE_XP = "quiz-xp-operation-v1:";
  function prefixeOperations(uid) { return PREFIXE_XP + encodeURIComponent(String(uid)) + ":"; }
  function operationValide(o) {
    return o && CLES_XP_QUIZ.indexOf(o.cle) >= 0 &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(o.id) &&
      Number.isSafeInteger(o.gain) && o.gain > 0 && o.gain <= 1000000000 &&
      Number.isSafeInteger(o.base) && o.base >= 0 &&
      (!o.cumulatif || (Number.isSafeInteger(o.attente) && o.attente >= 0 && o.attente <= o.gain));
  }
  function listerOperationsQuiz(uid, cle) {
    if (!compteQuizIsole(uid)) return [];
    var liste = [], prefixe = prefixeOperations(uid);
    try {
      for (var i = 0; i < global.localStorage.length; i++) {
        var k = global.localStorage.key(i) || "";
        if (k.indexOf(prefixe) !== 0) continue;
        var o = JSON.parse(global.localStorage.getItem(k));
        if (!operationValide(o) || k !== prefixe + o.id) return null;
        if (!cle || o.cle === cle) liste.push(o);
      }
    } catch (e) { return null; }
    return liste;
  }
  function ajouterOperationQuiz(uid, operation) {
    if (!compteQuizIsole(uid) || !operationValide(operation)) return false;
    try {
      var cle = prefixeOperations(uid) + operation.id;
      var precedent = JSON.parse(global.localStorage.getItem(cle) || "null");
      if (precedent) {
        if (!operationValide(precedent) || precedent.cle !== operation.cle || !precedent.cumulatif || !operation.cumulatif) return false;
        operation = Object.assign({}, operation, {
          gain: Math.max(precedent.gain, operation.gain),
          attente: Math.min(Math.max(precedent.gain, operation.gain), precedent.attente + operation.attente),
          base: Math.max(precedent.base, operation.base)
        });
      }
      global.localStorage.setItem(cle, JSON.stringify(operation));
      return true;
    } catch (e) { return false; }
  }
  function confirmerOperationsQuiz(uid, ids, envoyees) {
    if (!compteQuizIsole(uid)) return;
    try {
      (ids || []).forEach(function (id) {
        var cle = prefixeOperations(uid) + id;
        var courant = JSON.parse(global.localStorage.getItem(cle) || "null");
        var envoye = (envoyees || []).find(function (o) { return o.id === id; });
        /* Une progression plus récente a pu arriver pendant le POST. */
        if (courant && courant.cumulatif && envoye && courant.gain > envoye.gain) {
          courant.attente = Math.max(0, courant.attente - (Number(envoye.attente) || 0));
          global.localStorage.setItem(cle, JSON.stringify(courant));
        } else {
          global.localStorage.removeItem(cle);
        }
      });
    } catch (e) {}
  }
  /* Le marqueur de partie survit à l'acquittement et reste isolé par compte. */
  var PREFIXE_PARTIE_XP = "quiz-xp-partie-v1:";
  function clePartieQuiz(uid, id) { return PREFIXE_PARTIE_XP + encodeURIComponent(String(uid)) + ":" + id; }
  function lireGainPartieQuiz(uid, cle, id) {
    if (!compteQuizIsole(uid) || !/^[0-9a-f-]{36}$/i.test(String(id || ""))) return null;
    try {
      var o = JSON.parse(global.localStorage.getItem(clePartieQuiz(uid, id)) || "null");
      if (!o) return { cle: cle, gain: 0, bonnes: 0, total: 0, connue: false };
      if (o.cle !== cle || !Number.isSafeInteger(o.gain) || o.gain < 0) return null;
      return o;
    } catch (e) { return null; }
  }
  function memoriserGainPartieQuiz(uid, id, valeur) {
    if (!compteQuizIsole(uid) || !valeur || !/^[0-9a-f-]{36}$/i.test(String(id || ""))) return false;
    try { global.localStorage.setItem(clePartieQuiz(uid, id), JSON.stringify(valeur)); return true; }
    catch (e) { return false; }
  }
  function ecrireProtocoleQuiz(uid, attentes) {
    if (!compteQuizIsole(uid)) return false;
    try { global.localStorage.setItem("sti-xp-protocole-v487", JSON.stringify({ uid: String(uid), version: 2, attentes: attentes })); return true; }
    catch (e) { return false; }
  }
  var chargementQuiz = false;
  function relancerOperationsQuiz() {
    var uid;
    try { uid = global.localStorage.getItem("sti-sync-uid"); } catch (e) { return; }
    if (!uid || global.STIQuizSync || chargementQuiz || !sourceProfil) return;
    var operations = listerOperationsQuiz(uid);
    if (!operations || !operations.length) return;
    chargementQuiz = true;
    var script = document.createElement("script");
    script.src = new URL("quiz-sync.js", sourceProfil).href;
    script.onload = script.onerror = function () { chargementQuiz = false; if (!global.STIQuizSync) script.remove(); };
    document.head.appendChild(script);
  }
  if (!profilPourQuiz && typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", relancerOperationsQuiz);
    else relancerOperationsQuiz();
    global.addEventListener("online", relancerOperationsQuiz);
    global.addEventListener("sti-cloud-restored", relancerOperationsQuiz);
    if (typeof global.setInterval === "function") global.setInterval(relancerOperationsQuiz, 10000);
  }

  /* Exposition de l'API publique unique */
  global.STIProfil = {
    CLE_STOCKAGE: CLE_PROFIL,
    chargerProfil: chargerProfil,
    normaliserProfil: normaliserProfil,
    invitationInstallationDejaVue: invitationInstallationDejaVue,
    sauvegarderProfil: sauvegarderProfil,
    mettreAJour: mettreAJour,
    enregistrerVisiteCours: enregistrerVisiteCours,
    fusionnerCoursVisites: fusionnerCoursVisites,
    listerCoursVisites: listerCoursVisites,
    definirEtatChapitre: definirEtatChapitre,
    enregistrerLecture: enregistrerLecture,
    basculerExerciceFait: basculerExerciceFait,
    enregistrerLaboratoire: enregistrerLaboratoire,
    enregistrerPositionVideo: enregistrerPositionVideo,
    /* v611 — flamme de régularité. */
    enregistrerJourTravail: enregistrerJourTravail,
    lireRegularite: lireRegularite,
    calculerSerieJours: calculerSerieJours,
    reparerRegularite: reparerRegularite,
    reinitialiser: reinitialiser,
    appliquerPreferencesDOM: appliquerPreferencesDOM,
    lireEtatSession: lireEtatSession,
    photoCompte: photoCompte,
    /* Les deux journaux historiques ne remplacent pas le profil unique. */
    projectionSuivi: function (cle, valeur) {
      if (["sti-exos-faits", "sti-pages-vues-v432", "sti-media-prog-v1"].indexOf(cle) < 0) return {};
      try {
        var stockage = global.localStorage;
        if (arguments.length > 1) stockage.setItem(cle, JSON.stringify(valeur));
        return JSON.parse(stockage.getItem(cle) || "{}");
      } catch (e) { return {}; }
    },
    /* Accès brut aux journaux autorisés par le synchroniseur historique. */
    projectionSynchronisation: function (filtre, cle, valeur) {
      try {
        var stockage = global.localStorage;
        if (arguments.length === 1) {
          var donnees = {};
          for (var i = 0; i < stockage.length; i++) {
            var k = stockage.key(i); if (filtre(k)) donnees[k] = stockage.getItem(k);
          }
          return donnees;
        }
        if (!filtre(cle)) return null;
        if (arguments.length > 2) {
          if (valeur == null) stockage.removeItem(cle); else stockage.setItem(cle, String(valeur));
        }
        return stockage.getItem(cle);
      } catch (e) { return arguments.length === 1 ? {} : null; }
    },
    preparerActivationServiceWorker: preparerActivationServiceWorker,
    preparerVerificationServiceWorker: preparerVerificationServiceWorker,
    compteQuizIsole: compteQuizIsole,
    lireAcquisQuiz: lireAcquisQuiz,
    releverAcquisQuiz: releverAcquisQuiz,
    ecrireAcquisQuiz: ecrireAcquisQuiz,
    lireGainPartieQuiz: lireGainPartieQuiz,
    memoriserGainPartieQuiz: memoriserGainPartieQuiz,
    listerOperationsQuiz: listerOperationsQuiz,
    ajouterOperationQuiz: ajouterOperationQuiz,
    confirmerOperationsQuiz: confirmerOperationsQuiz,
    ecrireProtocoleQuiz: ecrireProtocoleQuiz
  };
  /* Les pages déjà équipées du profil reçoivent ces modules sans réécrire les quiz lourds. */
  if (sourceProfil && document.head && document.querySelector && document.createElement) {
    global.addEventListener("online", function () { global.__STI_RECONNEXION_ATTENDUE = true; });
    ["suivi-profil.js", "reconnexion-profil.js", "appel-quiz.js"].forEach(function (nom) {
      if (document.querySelector('script[src$="/' + nom + '"]')) return;
      var script = document.createElement("script");
      script.src = new URL(nom, sourceProfil).href; script.async = false;
      document.head.appendChild(script);
    });
  }
})(window);
