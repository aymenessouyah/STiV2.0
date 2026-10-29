/* STI by AE — v519 : tirage aléatoire garanti des quiz.
   ─────────────────────────────────────────────────────────────────────────
   Objectif : les questions ET la place de la bonne réponse sont tirées au
   hasard à CHAQUE ouverture d'un quiz, à CHAQUE reconnexion internet, à
   chaque retour sur l'onglet et à chaque nouvelle partie — jamais deux
   fois le même tirage « figé ».

   Le moteur de chaque quiz garde la main sur sa banque de questions ; ce
   module fournit seulement :
     • STIQuizAlea.entier(n)            → entier sûr dans [0, n[
     • STIQuizAlea.melanger(liste)      → copie mélangée (Fisher-Yates crypto)
     • STIQuizAlea.melangerReponses(o)  → options mélangées + index de la bonne
     • STIQuizAlea.nouveauTirage(motif) → compte un tirage neuf, prévient la page
     • STIQuizAlea.surNouveauTirage(fn) → abonnement au tirage neuf
     • STIQuizAlea.compteur()           → nombre de tirages de cet onglet
     • STIQuizAlea.sel()                → sel aléatoire du tirage courant

   Aucune dépendance, aucun réseau, aucun stockage durable : le compteur vit
   en mémoire et en sessionStorage (perdu à la fermeture de l'onglet, ce qui
   est voulu : une nouvelle visite repart d'un tirage neuf). */
(function (global) {
  "use strict";
  if (!global || !global.document) return;
  if (global.STIQuizAlea) return;

  var CLE_SESSION = "sti-quiz-tirage-v519";
  var abonnes = [];
  var compteur = 0;
  var sel = 0;
  var dernierMotif = "";
  var dernierTs = 0;
  var cacheApres = 0;

  function entier(n) {
    var max = Math.floor(Number(n) || 0);
    if (max <= 1) return 0;
    try {
      if (global.crypto && typeof global.crypto.getRandomValues === "function") {
        /* Rejet pour éviter le biais du modulo sur les grandes valeurs. */
        var limite = Math.floor(4294967296 / max) * max;
        var buf = new Uint32Array(1);
        for (var essai = 0; essai < 8; essai++) {
          global.crypto.getRandomValues(buf);
          if (buf[0] < limite) return buf[0] % max;
        }
        return buf[0] % max;
      }
    } catch (e) {}
    return Math.floor(Math.random() * max);
  }

  function melanger(liste) {
    var a = Array.isArray(liste) ? liste.slice() : [];
    for (var i = a.length - 1; i > 0; i--) {
      var j = entier(i + 1);
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  /* Mélange les propositions en gardant la bonne réponse identifiable.
     Accepte un tableau de textes + l'index de la bonne, ou un tableau
     d'objets { text, ok }. Renvoie toujours { options, index }. */
  function melangerReponses(options, indexCorrect) {
    var brut = Array.isArray(options) ? options : [];
    var index = -1;
    for (var i = 0; i < brut.length; i++) {
      var o = brut[i];
      if (o && typeof o === "object" && "ok" in o) {
        if (o.ok) index = i;
      } else if (i === indexCorrect) {
        index = i;
      }
    }
    var ordre = melanger(brut.map(function (_, k) { return k; }));
    return {
      options: ordre.map(function (k) { return brut[k]; }),
      index: ordre.indexOf(index)
    };
  }

  function enregistrerSession() {
    try {
      global.sessionStorage.setItem(CLE_SESSION, JSON.stringify({ n: compteur, sel: sel, motif: dernierMotif, ts: dernierTs }));
    } catch (e) {}
  }

  function relireSession() {
    try {
      var brut = JSON.parse(global.sessionStorage.getItem(CLE_SESSION) || "null");
      if (brut && typeof brut === "object" && Number.isFinite(Number(brut.n))) {
        compteur = Math.max(compteur, Number(brut.n) || 0);
      }
    } catch (e) {}
  }

  function nouveauTirage(motif) {
    compteur += 1;
    dernierMotif = String(motif || "tirage");
    dernierTs = Date.now();
    /* Le sel change à chaque tirage : même banque, ordre différent. */
    sel = entier(2147483647) + 1;
    enregistrerSession();
    var evt = null;
    try {
      evt = new global.CustomEvent("sti:nouveau-tirage", { detail: { motif: dernierMotif, n: compteur, sel: sel } });
    } catch (e) {}
    /* Les abonnés d'abord : ils peuvent relire le compteur immédiatement. */
    abonnes.slice().forEach(function (fn) {
      try { fn({ motif: dernierMotif, n: compteur, sel: sel }); } catch (e) {}
    });
    if (evt) {
      try { global.dispatchEvent(evt); } catch (e) {}
      try { global.document.dispatchEvent(evt); } catch (e) {}
    }
    return compteur;
  }

  function surNouveauTirage(fn) {
    if (typeof fn !== "function") return function () {};
    abonnes.push(fn);
    return function () {
      var i = abonnes.indexOf(fn);
      if (i !== -1) abonnes.splice(i, 1);
    };
  }

  function compteurActuel() { return compteur; }
  function selActuel() { return sel; }
  function dernierMotifActuel() { return dernierMotif; }

  /* ---------- Déclencheurs automatiques ---------- */
  function brancher() {
    relireSession();
    /* 1. Chaque ouverture de la page de quiz. */
    nouveauTirage("ouverture");

    /* 2. Chaque reconnexion internet. */
    global.addEventListener("online", function () { nouveauTirage("reconnexion"); });

    /* 3. Retour sur l'onglet après plus de 20 s, ou retour depuis le cache
          de navigation (bfcache) : l'ancienne partie ne doit pas resservir. */
    global.addEventListener("pageshow", function (ev) {
      if (ev && ev.persisted) nouveauTirage("retour-cache");
    });
    if (global.document.addEventListener) {
      global.document.addEventListener("visibilitychange", function () {
        if (global.document.hidden) {
          cacheApres = Date.now();
          return;
        }
        if (cacheApres && Date.now() - cacheApres > 20000) nouveauTirage("retour-onglet");
        cacheApres = 0;
      });
    }
  }

  global.STIQuizAlea = {
    entier: entier,
    melanger: melanger,
    melangerReponses: melangerReponses,
    nouveauTirage: nouveauTirage,
    surNouveauTirage: surNouveauTirage,
    compteur: compteurActuel,
    sel: selActuel,
    motif: dernierMotifActuel,
    CLE_SESSION: CLE_SESSION
  };

  if (global.document.readyState === "loading") {
    global.document.addEventListener("DOMContentLoaded", brancher);
  } else {
    brancher();
  }
})(typeof window !== "undefined" ? window : null);
