/* STI by AE — v519 : tirage aléatoire garanti des quiz.
   v555 : plafond de 20 % de bonnes réponses en position A (planReponses).
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
     • STIQuizAlea.planReponses(t, o)   → positions équilibrées (A ≤ 20 %)
     • STIQuizAlea.placerReponse(o, i, c) → bonne réponse placée à la position c
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

  /* ── v555 · plafond de bonnes réponses en position A ────────────────
     Un mélange uniforme place la bonne réponse en A une fois sur quatre
     (25 %). La consigne pédagogique est plus stricte : sur une partie, la
     bonne réponse ne doit JAMAIS être en A plus de 20 % du temps.

     planReponses() construit donc le plan des positions à l'avance :
       • budget A = floor(n × maxA)  (2 positions A pour 10 questions) ;
       • quelles questions reçoivent ce budget : tirage cryptographique ;
       • les autres se répartissent B / C / D à parts égales, dans un ordre
         lui aussi tiré au hasard ;
       • aucune suite de trois positions identiques (règle historique),
         correction qui ne peut que RETIRER des A, jamais en ajouter.

     Le plan est ensuite appliqué par placerReponse(), qui échange la bonne
     réponse avec la proposition déjà présente à la position visée. La
     proposition est donc aussi aléatoire qu'avant, seule sa position est
     pilotée. */

  function indexCorrectDe(listeOptions, indexCorrect) {
    var brut = Array.isArray(listeOptions) ? listeOptions : [];
    if (typeof indexCorrect === "number" && indexCorrect >= 0 && indexCorrect < brut.length) return indexCorrect;
    for (var i = 0; i < brut.length; i++) {
      var o = brut[i];
      if (o && typeof o === "object" && o.ok === true) return i;
    }
    return -1;
  }

  function placerReponse(listeOptions, indexCorrect, cible) {
    var brut = Array.isArray(listeOptions) ? listeOptions.slice() : [];
    var index = indexCorrectDe(brut, indexCorrect);
    var c = Math.floor(Number(cible));
    if (index < 0 || !isFinite(c) || c < 0 || c >= brut.length || c === index) {
      return { options: brut, index: index };
    }
    var garde = brut[index];
    brut[index] = brut[c];
    brut[c] = garde;
    return { options: brut, index: c };
  }

  function planReponses(tailles, options) {
    var maxA = options && options.maxA !== undefined ? Number(options.maxA) : 0.2;
    if (!isFinite(maxA) || maxA < 0) maxA = 0.2;
    if (maxA > 1) maxA = 1;
    var liste = Array.isArray(tailles) ? tailles : [];
    var n = liste.length;
    var plan = new Array(n);
    var flexibles = [];
    var budget = Math.floor(n * maxA + 1e-9);
    var i, t;
    for (i = 0; i < n; i++) {
      t = Math.floor(Number(liste[i]) || 0);
      if (t < 2) { plan[i] = 0; budget -= 1; continue; }
      flexibles.push(i);
    }
    if (budget < 0) budget = 0;
    if (!flexibles.length) return plan;

    /* 1. Les questions qui reçoivent la bonne réponse en A. */
    var ordreA = melanger(flexibles);
    var placesA = Math.min(budget, ordreA.length);
    for (i = 0; i < placesA; i++) plan[ordreA[i]] = 0;

    /* 2. Les autres : B, C, D à parts égales, dans un ordre tiré au hasard.
          La rotation de départ est elle aussi aléatoire, pour qu'aucune lettre
          ne soit systématiquement la « petite part ». */
    var reste = ordreA.slice(placesA);
    if (reste.length) {
      var baseTiers = [1, 2, 3];
      var decalage = entier(3);
      var sac = [];
      for (i = 0; i < reste.length; i++) sac.push(baseTiers[(decalage + i) % 3]);
      sac = melanger(sac);
      for (i = 0; i < reste.length; i++) {
        var idx = reste[i];
        var maxi = Math.max(1, Math.floor(Number(liste[idx]) || 0) - 1);
        plan[idx] = 1 + ((sac[i] - 1) % maxi);
      }
    }

    /* 3. Jamais trois positions identiques de suite : on déplace la troisième,
          et uniquement vers une autre position — jamais vers A. */
    for (i = 2; i < n; i++) {
      if (plan[i] !== plan[i - 1] || plan[i] !== plan[i - 2]) continue;
      var dernier = Math.max(1, Math.floor(Number(liste[i]) || 0) - 1);
      for (var essai = 1; essai <= dernier; essai++) {
        var candidat = 1 + ((plan[i] + essai - 1) % dernier);
        if (candidat !== plan[i]) { plan[i] = candidat; break; }
      }
    }
    return plan;
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
    placerReponse: placerReponse,
    planReponses: planReponses,
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
