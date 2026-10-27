/* ═══════════════════════════════════════════════════════════════════════════
   STI V2.0 — Couche unique de gestion du profil abonné (assets/js/profil.js)
   Règle d'architecture :
   - UN SEUL objet `profilAbonne` sérialisé en JSON dans localStorage sous la
     clé « sti-profil-abonne » (préfixe « sti- » obligatoire pour que
     assets/js/sync-progressions.js le synchronise automatiquement vers la
     table cloud « sti_progressions »).
   - Ce module est la SEULE couche du front autorisée à appeler localStorage.
   - Il lit uniquement en lecture seule l'état de session et le statut GOLD
     déjà gérés par config.js, supabase-umd.js et acces.js (via window.STI_AUTH,
     window.__STI_SB_CLIENT et window.__STI_GOLD), sans jamais les recalculer.
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Structure complète de l'objet `profilAbonne` stocké sous « sti-profil-abonne » :
 * {
 *   prenom: "",                                      // Prénom de l'élève abonné
 *   theme: "sombre",                                 // "sombre" | "clair" | "intermediaire"
 *   langue: "fr",                                    // "fr" | "en" | "ar"
 *   tailleTexte: "normale",                          // "petite" | "normale" | "grande"
 *   vitesseAudio: 1,                                 // 0.85 | 1 | 1.15 (Guide-Ligne vocal)
 *   derniereLecture: {                               // Reprise de lecture
 *     matiere: "",                                   // "html5" | "css3" | "javascript" | "sql" | "php"
 *     chapitre: "",                                  // Titre du chapitre ou de la section
 *     chapitreId: "",                                // Ancre du chapitre actif (ex. "formulaires")
 *     pourcent: 0,                                   // Avancement de lecture (0 à 100)
 *     url: ""                                        // Chemin relatif (ex. "cours/html5.html#formulaires")
 *   },
 *   progression: {                                   // Cours marqués comme révisés (« X / 5 révisés »)
 *     html5: false,
 *     css3: false,
 *     javascript: false,
 *     sql: false,
 *     php: false
 *   },
 *   chapitres: {                                     // État par chapitre : "a_reviser" | "en_cours" | "revise"
 *     html5: {},
 *     css3: {},
 *     javascript: {},
 *     sql: {},
 *     php: {}
 *   },
 *   exercicesFaits: {                                // Liste des exercices cochés « Exercice fait » par matière
 *     html5: [],
 *     css3: [],
 *     javascript: [],
 *     sql: [],
 *     php: []
 *   },
 *   laboratoires: { css3: [], javascript: [] },      // Récapitulatifs et laboratoires déjà utilisés
 *   quiz: [],                                        // Historique des scores aux quiz
 *   videos: {                                        // Suivi des vidéos explicatives (.mp4)
 *     vues: [],                                      // Liste des identifiants de vidéos terminées
 *     positions: {},                                 // Position de reprise en secondes par id vidéo
 *     derniere: null                                 // { id, matiere, titre, temps, duree, url }
 *   },
 *   notes: [],                                       // Notes /20 envoyées au professeur (Ateliers Bac)
 *   nouveautesLues: []                               // Versions marquées comme lues (ex. ["v477"])
 * }
 */
(function (global) {
  "use strict";

  var CLE_PROFIL = "sti-profil-abonne";
  var THEMES_VALIDES = { sombre: true, clair: true, intermediaire: true };
  var LANGUES_VALIDES = { fr: true, en: true, ar: true };
  var TAILLES_VALIDES = { petite: true, normale: true, grande: true };
  var ETATS_CHAPITRE_VALIDES = { a_reviser: true, en_cours: true, revise: true };
  var MATIERES_CLES = ["html5", "css3", "javascript", "sql", "php"];

  /* Cache mémoire courant pour éviter tout accès superflu */
  var memoireProfil = null;
  var etatSessionCourant = {
    connecte: false,
    estGold: false,
    email: "",
    prenomSession: "",
    nomSession: "",
    classe: "",
    lycee: "",
    initiales: ""
  };

  /**
   * Construit un objet `profilAbonne` neuf avec toutes les valeurs par défaut.
   */
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
        php: false
      },
      chapitres: {
        html5: {},
        css3: {},
        javascript: {},
        sql: {},
        php: {}
      },
      exercicesFaits: {
        html5: [],
        css3: [],
        javascript: [],
        sql: [],
        php: []
      },
      laboratoires: {
        html5: [],
        css3: [],
        javascript: [],
        sql: [],
        php: []
      },
      quiz: [],
      videos: {
        vues: [],
        positions: {},
        derniere: null
      },
      notes: [],
      nouveautesLues: []
    };
  }

  /**
   * Normalise la carte des chapitres d'une matière.
   */
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

  /**
   * Garantit l'intégrité de chaque champ d'un profil chargé depuis le stockage.
   */
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
        php: Boolean(prog.php)
      },
      chapitres: chapitresPropres,
      exercicesFaits: exosPropres,
      laboratoires: laboratoiresPropres,
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
        : []
    };
  }

  /**
   * Applique immédiatement les préférences d'affichage sur la balise <html>.
   * Appelé dès le <head> pour éviter tout clignotement (zéro flash).
   */
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

      docEl.setAttribute("data-theme", profil.theme);
      docEl.setAttribute("data-taille-texte", profil.tailleTexte);
      docEl.setAttribute("lang", profil.langue);
      docEl.setAttribute("dir", profil.langue === "ar" ? "rtl" : "ltr");
      /* La page HTML5 attend ces préférences avant son premier affichage. */
      docEl.classList.remove("sti-theme-wait");

      /* Compatibilité visuelle avec les fenêtres modales existantes d'acces.js */
      var estSombre = profil.theme !== "clair";
      docEl.classList.toggle("dark", estSombre);
      docEl.classList.toggle("dark-mode", estSombre);
    } catch (e) {}
  }

  /**
   * Notifie l'application d'une mise à jour du profil ou de l'état de session.
   */
  function notifierChangement(nomEvenement, donnees) {
    try {
      if (typeof CustomEvent === "function" && global.dispatchEvent) {
        global.dispatchEvent(new CustomEvent(nomEvenement, { detail: donnees }));
      }
    } catch (e) {}
  }

  /**
   * Charge le profil abonné depuis localStorage["sti-profil-abonne"].
   */
  function chargerProfil() {
    try {
      var texte = global.localStorage ? global.localStorage.getItem(CLE_PROFIL) : null;
      if (texte) {
        memoireProfil = normaliserProfil(JSON.parse(texte));
        return JSON.parse(JSON.stringify(memoireProfil));
      }
    } catch (e) {}

    if (!memoireProfil) {
      memoireProfil = creerProfilParDefaut();
    }
    return JSON.parse(JSON.stringify(memoireProfil));
  }

  /**
   * Sauvegarde l'objet complet `profilAbonne` dans localStorage["sti-profil-abonne"].
   */
  function sauvegarderProfil(profil, avecTransition) {
    var propre = normaliserProfil(profil);
    memoireProfil = propre;
    try {
      if (global.localStorage) {
        global.localStorage.setItem(CLE_PROFIL, JSON.stringify(propre));
      }
    } catch (e) {}
    appliquerPreferencesDOM(propre, Boolean(avecTransition));
    notifierChangement("sti:profil-maj", JSON.parse(JSON.stringify(propre)));
    return JSON.parse(JSON.stringify(propre));
  }

  /**
   * Met à jour une propriété ciblée par chemin pointé (ex. "progression.html5" ou "theme").
   */
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

  /**
   * Met à jour l'état d'un chapitre ("a_reviser" | "en_cours" | "revise")
   * et synchronise automatiquement la progression globale de la matière.
   */
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

    /* Ne pas effacer un ancien marquage global simplement parce qu'un chapitre
       a été ouvert : recalculer uniquement lors d'un changement de révision. */
    if (totalChapitres > 0 && (etatValide === "revise" || etatAvant === "revise")) {
      var nbRevises = Object.keys(p.chapitres[matiere]).filter(function (k) {
        return p.chapitres[matiere][k] === "revise";
      }).length;
      p.progression[matiere] = nbRevises >= totalChapitres;
    }
    return sauvegarderProfil(p, false);
  }

  /**
   * Enregistre en une seule écriture le chapitre consulté et la reprise de lecture.
   * Un chapitre déjà révisé conserve son état et la progression globale existante.
   */
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
    return sauvegarderProfil(p, false);
  }

  /**
   * Coche ou décoche un exercice dans exercicesFaits[matiere].
   */
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
    return sauvegarderProfil(p, false);
  }

  /**
   * Mémorise l'utilisation d'un laboratoire sans créer une autre clé locale.
   * Les manipulations suivantes restent interactives sans écritures répétées.
   */
  function enregistrerLaboratoire(matiere, idLaboratoire) {
    var p = chargerProfil();
    if (!MATIERES_CLES.includes(matiere) || !/^[a-z0-9-]+$/i.test(idLaboratoire || "")) return p;
    var liste = p.laboratoires[matiere];
    if (liste.indexOf(idLaboratoire) !== -1) return p;
    liste.push(idLaboratoire);
    return sauvegarderProfil(p, false);
  }

  /**
   * Enregistre la position de lecture d'une vidéo et son état « vue ».
   */
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
    }

    /* Une courte vidéo illustrative peut être suivie sans remplacer la reprise
       de la vidéo principale affichée dans le tableau de bord. */
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

  /**
   * Réinitialise le profil abonné aux valeurs par défaut et purge la clé locale.
   */
  function reinitialiser() {
    try {
      if (global.localStorage) {
        global.localStorage.removeItem(CLE_PROFIL);
      }
    } catch (e) {}
    memoireProfil = creerProfilParDefaut();
    appliquerPreferencesDOM(memoireProfil, true);
    notifierChangement("sti:profil-maj", JSON.parse(JSON.stringify(memoireProfil)));
    return JSON.parse(JSON.stringify(memoireProfil));
  }

  /**
   * Calcule 1 ou 2 initiales propres à partir d'un prénom / nom / e-mail.
   */
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

  /**
   * Lecture seule de l'état de session Supabase et du statut Compte GOLD
   * déjà établis par acces.js et supabase-umd.js (aucun recalcul d'autorisation).
   */
  function lireEtatSession() {
    var profil = chargerProfil();
    var cacheAcces = null;

    /* Lecture seule du cache de session maintenu par acces.js pour le mode hors-ligne */
    try {
      if (global.localStorage) {
        cacheAcces = JSON.parse(global.localStorage.getItem("sti-session-cache") || "null");
      }
    } catch (e) {}

    var docEl = document.documentElement;
    var bodyEl = document.body;
    var estGoldActif = Boolean(
      global.__STI_GOLD === true ||
      (docEl && docEl.classList.contains("sti-gold")) ||
      (bodyEl && bodyEl.classList.contains("sti-gold")) ||
      (cacheAcces && cacheAcces.gold === true)
    );

    var connecteCache = Boolean(cacheAcces && cacheAcces.statut === "actif");
    var prenom = profil.prenom ||
      (cacheAcces && cacheAcces.prenom) ||
      etatSessionCourant.prenomSession ||
      "";
    var nom = (cacheAcces && cacheAcces.nom) || etatSessionCourant.nomSession || "";
    var email = (cacheAcces && cacheAcces.email) || etatSessionCourant.email || "";

    if (!prenom && email) {
      prenom = email.split("@")[0].replace(/[._-]+/g, " ");
      prenom = prenom.charAt(0).toUpperCase() + prenom.slice(1);
    }

    var connecte = Boolean(etatSessionCourant.connecte || connecteCache);

    return {
      connecte: connecte,
      estGold: estGoldActif,
      prenom: prenom || "Abonné",
      nom: nom,
      email: email,
      classe: (cacheAcces && cacheAcces.classe) || etatSessionCourant.classe || "",
      lycee: (cacheAcces && cacheAcces.lycee) || etatSessionCourant.lycee || "Lycée Raféha",
      initiales: calculerInitiales(prenom, nom, email),
      urlPortail: ((global.STI_AUTH && global.STI_AUTH.RACINE) || "./") + "portail.html"
    };
  }

  /**
   * Interroge la session active auprès du client Supabase déjà instancié par acces.js.
   */
  function synchroniserLectureSessionSupabase() {
    try {
      var client = global.__STI_SB_CLIENT;
      if (!client || !client.auth || typeof client.auth.getSession !== "function") {
        return;
      }
      client.auth.getSession().then(function (rep) {
        var sess = rep && rep.data ? rep.data.session : null;
        if (sess && sess.user) {
          var meta = sess.user.user_metadata || {};
          etatSessionCourant.connecte = true;
          etatSessionCourant.email = sess.user.email || "";
          etatSessionCourant.prenomSession = meta.prenom || meta.first_name || "";
          etatSessionCourant.nomSession = meta.nom || meta.last_name || "";
          etatSessionCourant.classe = meta.classe || "";
          etatSessionCourant.lycee = meta.lycee || "";

          var p = chargerProfil();
          if (!p.prenom && etatSessionCourant.prenomSession) {
            mettreAJour("prenom", etatSessionCourant.prenomSession);
          }
        } else {
          etatSessionCourant.connecte = false;
        }
        notifierChangement("sti:session-maj", lireEtatSession());
      }).catch(function () {});

      if (!synchroniserLectureSessionSupabase._ecouteurActif && typeof client.auth.onAuthStateChange === "function") {
        synchroniserLectureSessionSupabase._ecouteurActif = true;
        client.auth.onAuthStateChange(function (_ev, sess) {
          etatSessionCourant.connecte = Boolean(sess && sess.user);
          etatSessionCourant.email = (sess && sess.user && sess.user.email) || "";
          notifierChangement("sti:session-maj", lireEtatSession());
        });
      }
    } catch (e) {}
  }

  /* ── Amorçage immédiat dès le chargement du script (zéro flash de thème) ── */
  var profilInitial = chargerProfil();
  appliquerPreferencesDOM(profilInitial, false);

  /* Ré-écoute des mises à jour cloud effectuées par sync-progressions.js ou un autre onglet */
  if (typeof global.addEventListener === "function") {
    global.addEventListener("storage", function (ev) {
      if (!ev || !ev.key || ev.key === CLE_PROFIL || ev.key === "sti-session-cache" || ev.key === "sti-gold") {
        memoireProfil = null;
        var pMaj = chargerProfil();
        appliquerPreferencesDOM(pMaj, false);
        notifierChangement("sti:profil-maj", pMaj);
        notifierChangement("sti:session-maj", lireEtatSession());
      }
    });

    global.addEventListener("DOMContentLoaded", function () {
      synchroniserLectureSessionSupabase();
      setTimeout(synchroniserLectureSessionSupabase, 600);

      if (typeof MutationObserver === "function" && document.documentElement) {
        var obs = new MutationObserver(function () {
          notifierChangement("sti:session-maj", lireEtatSession());
        });
        obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
      }
    });
  }

  /* Exposition de l'API publique unique */
  global.STIProfil = {
    CLE_STOCKAGE: CLE_PROFIL,
    chargerProfil: chargerProfil,
    sauvegarderProfil: sauvegarderProfil,
    mettreAJour: mettreAJour,
    definirEtatChapitre: definirEtatChapitre,
    enregistrerLecture: enregistrerLecture,
    basculerExerciceFait: basculerExerciceFait,
    enregistrerLaboratoire: enregistrerLaboratoire,
    enregistrerPositionVideo: enregistrerPositionVideo,
    reinitialiser: reinitialiser,
    appliquerPreferencesDOM: appliquerPreferencesDOM,
    lireEtatSession: lireEtatSession
  };
})(window);
