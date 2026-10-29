/* STI by AE — v520 : le compteur XP ne recule jamais.
   ─────────────────────────────────────────────────────────────────────────
   Un élève peut gagner des XP sur son téléphone (5 000), puis jouer hors
   ligne sur son PC (6 000). En revenant en ligne, aucun des deux appareils
   ne doit retomber à 5 000 : les deux doivent afficher 6 000.

   Ce module garde en mémoire, sur l'appareil, le plus haut total déjà vu
   pour chaque compteur XP. Seuls les champs cumulés sont suivis : une série
   en cours (« streak ») ou un compteur de session peut, lui, redescendre.
   Toute écriture plus faible — venant d'un moteur de quiz, d'une ancienne
   version du site ou d'une réponse cloud retardataire — est immédiatement
   relevée au maximum connu, puis signalée pour être renvoyée au cloud
   (voir sync-progressions.js).

   Il ne touche qu'aux quatre compteurs XP, ne modifie jamais un total plus
   élevé, et oublie son plancher dès qu'un compteur est supprimé (changement
   de compte, réinitialisation), ce qui préserve l'isolation entre élèves. */
(function (global) {
  "use strict";
  if (!global || !global.localStorage || global.STIXPPlancher) return;

  var CLE_PLANCHER = "sti-xp-plancher-v520";
  var CHAMPS = {
    "quizzora_xp_v1": ["xp", "best", "parties", "bonnes", "total"],
    "sti-quiz-xp-js-v1": ["xp", "best", "parties", "bonnes", "total"],
    "sqlQuestV3": ["xp", "level", "totalAnswered", "totalCorrect", "bestCombo", "playgroundCount"],
    "quizphp_v1_user": ["xp", "best"]
  };
  var CLES = Object.keys(CHAMPS);
  var proto = null, setItemNatif = null, removeItemNatif = null, clearNatif = null;
  try {
    proto = Object.getPrototypeOf(global.localStorage);
    setItemNatif = proto && proto.setItem;
    removeItemNatif = proto && proto.removeItem;
    clearNatif = proto && proto.clear;
  } catch (eProto) { proto = null; }
  /* Navigateur sans Storage accessible : on ne casse rien, on ne protège juste pas. */
  if (!proto || typeof setItemNatif !== "function") return;
  var derniereAnnonce = {};
  var minuteur = 0;
  var actif = true;

  function nombre(v) {
    var n = Number(v);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  }
  function lireBrut(cle) {
    try { return global.localStorage.getItem(cle); } catch (e) { return null; }
  }
  function ecrireBrut(cle, valeur) {
    try { setItemNatif.call(global.localStorage, cle, valeur); return true; } catch (e) { return false; }
  }
  function objet(brut) {
    if (brut == null) return null;
    if (typeof brut === "object") return brut;
    try {
      var v = JSON.parse(String(brut));
      return v && typeof v === "object" && !Array.isArray(v) ? v : null;
    } catch (e) { return null; }
  }
  function lirePlanchers() {
    var o = objet(lireBrut(CLE_PLANCHER));
    return o || {};
  }
  function ecrirePlanchers(o) {
    try { setItemNatif.call(global.localStorage, CLE_PLANCHER, JSON.stringify(o)); } catch (e) {}
  }

  /* Relève une valeur au plancher connu et mémorise tout nouveau maximum. */
  function relever(cle, valeur, silencieux) {
    var champs = CHAMPS[cle];
    if (!champs) return valeur;
    var courant = objet(valeur);
    if (!courant) return valeur;
    var planchers = lirePlanchers();
    var plancher = planchers[cle] && typeof planchers[cle] === "object" ? planchers[cle] : {};
    var sortie = {}, change = false, plancherChange = false, avantXp = nombre(courant.xp);
    Object.keys(courant).forEach(function (k) { sortie[k] = courant[k]; });
    champs.forEach(function (c) {
      if (courant[c] === undefined && plancher[c] === undefined) return;
      var v = nombre(courant[c]);
      var max = Math.max(v, nombre(plancher[c]));
      if (max > v) { sortie[c] = max; change = true; }
      if (max > nombre(plancher[c])) { plancher[c] = max; plancherChange = true; }
    });
    if (plancherChange) {
      planchers[cle] = plancher;
      ecrirePlanchers(planchers);
    }
    if (!change) return valeur;
    /* Le total ne recule pas : on prévient la page et le synchroniseur. */
    if (!silencieux) annoncer(cle, avantXp, nombre(sortie.xp));
    return JSON.stringify(sortie);
  }

  function annoncer(cle, avant, apres) {
    var maintenant = Date.now();
    if (derniereAnnonce[cle] && maintenant - derniereAnnonce[cle] < 1200) return;
    derniereAnnonce[cle] = maintenant;
    var detail = { cle: cle, quiz: cle, avant: avant, apres: apres, source: "plancher" };
    try { global.dispatchEvent(new global.CustomEvent("sti-xp-releve", { detail: detail })); } catch (e) {}
    try { global.document.dispatchEvent(new global.CustomEvent("sti-xp-releve", { detail: detail })); } catch (e) {}
    try { global.dispatchEvent(new global.CustomEvent("sti-xp-plancher-releve", { detail: detail })); } catch (e) {}
  }

  /* Relit les quatre compteurs et remonte ceux qui seraient descendus. */
  function verifier(silencieux) {
    if (!actif) return 0;
    var releves = 0;
    CLES.forEach(function (cle) {
      var brut = lireBrut(cle);
      if (brut == null) return;
      var apres = relever(cle, brut, silencieux);
      if (apres !== brut && ecrireBrut(cle, apres)) releves += 1;
    });
    return releves;
  }

  /* Toute écriture directe passe par ici : aucune baisse n'est possible. */
  proto.setItem = function (cle, valeur) {
    var nom = String(cle);
    if (Object.prototype.hasOwnProperty.call(CHAMPS, nom)) {
      if (valeur == null) return setItemNatif.call(this, cle, valeur);
      try { valeur = relever(nom, String(valeur)); } catch (e) {}
    }
    return setItemNatif.call(this, cle, valeur);
  };
  /* Supprimer un compteur efface son plancher (changement de compte, remise à zéro). */
  proto.removeItem = function (cle) {
    var nom = String(cle);
    if (Object.prototype.hasOwnProperty.call(CHAMPS, nom)) {
      var planchers = lirePlanchers();
      if (Object.prototype.hasOwnProperty.call(planchers, nom)) {
        delete planchers[nom];
        ecrirePlanchers(planchers);
      }
    }
    return removeItemNatif.call(this, cle);
  };
  proto.clear = function () {
    try { removeItemNatif.call(this, CLE_PLANCHER); } catch (e) {}
    return clearNatif.call(this);
  };

  function demarrer() {
    verifier(true);
    if (minuteur) return;
    if (typeof global.setInterval === "function") {
      minuteur = global.setInterval(function () {
        if (global.document && global.document.hidden) return;
        verifier(false);
      }, 2000);
    }
  }

  ["focus", "pageshow", "online", "sti-cloud-restored"].forEach(function (evt) {
    global.addEventListener(evt, function () { verifier(false); });
  });
  global.addEventListener("storage", function (evt) {
    if (evt && evt.key && CHAMPS[evt.key]) verifier(false);
  });
  if (global.document && global.document.addEventListener) {
    global.document.addEventListener("visibilitychange", function () {
      if (!global.document.hidden) verifier(false);
    });
  }
  if (global.document && global.document.readyState === "loading") {
    global.document.addEventListener("DOMContentLoaded", demarrer);
  } else {
    demarrer();
  }

  global.STIXPPlancher = {
    CLE: CLE_PLANCHER,
    cles: CLES.slice(),
    verifier: function () { return verifier(false); },
    relever: relever,
    maximum: function (cle) {
      var p = lirePlanchers()[cle];
      return p && typeof p === "object" ? Object.assign({}, p) : {};
    },
    oublier: function (cle) {
      var p = lirePlanchers();
      if (cle) delete p[cle]; else p = {};
      ecrirePlanchers(p);
    },
    suspendre: function () { actif = false; },
    reprendre: function () { actif = true; verifier(false); }
  };
})(typeof window !== "undefined" ? window : null);
