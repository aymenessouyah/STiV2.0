/* Retour des quiz vers leur page d'appel, sans stockage externe ni redirection hors
   du site. Un quiz peut être ouvert depuis plusieurs endroits (cours, accueil,
   tableau de bord, exercices, révision des erreurs) : le bouton de retour reprend
   la provenance exacte, son libellé et sa position de lecture. */
(function (global, document) {
  'use strict';
  var ici = new URL(global.location.href);
  var source = document.currentScript && document.currentScript.src;
  var racine = source ? new URL('../../', source) : new URL('../', ici);
  var baseQuiz = new URL('quiz/', racine);
  var baseCours = new URL('cours/', racine);
  if (ici.pathname.indexOf(baseQuiz.pathname) !== 0) return;

  /* Valider une destination : même origine, sous la racine du site, jamais un autre
     quiz (sauf la redirection historique pp.html) pour éviter toute boucle. */
  function pageLocale(valeur) {
    if (!valeur) return null;
    try {
      var cheminBrut = String(valeur).split(/[?#]/)[0];
      // Refuser les traversées et séparateurs encodés avant normalisation de l'URL.
      if (/[\\\u0000-\u001f]/.test(cheminBrut) || /%(?:2f|5c|00)/i.test(cheminBrut) ||
          /(?:^|\/)(?:\.|%2e){1,2}(?:\/|$)/i.test(cheminBrut)) return null;
      var url = new URL(valeur, ici);
      if (url.origin !== ici.origin || url.username || url.password ||
          url.pathname.indexOf(racine.pathname) !== 0 ||
          (url.pathname.indexOf(baseQuiz.pathname) === 0 && (url.pathname === ici.pathname || /\/pp\.html$/i.test(url.pathname))) ||
          !(url.pathname === racine.pathname || /\.html$/i.test(url.pathname))) return null;
      return url;
    } catch (e) { return null; }
  }

  /* Le paramètre explicite prime : il porte la page appelante, son onglet et sa
     position de lecture (appel-quiz.js l'a préparé au moment du clic). À défaut,
     le référent identifie la provenance ; sinon on revient au sommaire des quiz.
     Un paramètre présent mais invalide n'est jamais remplacé par le référent. */
  var destination = ici.searchParams.has('retour')
    ? pageLocale(ici.searchParams.get('retour'))
    : pageLocale(document.referrer);

  if (destination && !ici.searchParams.has('retour')) {
    /* Un rechargement ou la redirection pp.html garde la destination validée. */
    ici.searchParams.set('retour', destination.pathname + destination.search + destination.hash);
    global.history.replaceState(global.history.state, '', ici.href);
  }

  var retour = destination ? destination.href : new URL('index.html#quiz', racine).href;

  /* Libellé explicite : chaque point d'entrée annonce où le bouton ramène. */
  function libelleDe(cible) {
    if (!cible) return 'Retour aux quiz';
    var chemin = cible.pathname;
    if (chemin === racine.pathname || /\/index\.html$/i.test(chemin)) return 'Retour aux quiz';
    if (chemin.indexOf(baseCours.pathname) === 0) return 'Retour au cours';
    /* Une série d'exercices est une rubrique ; une page de TP profonde reste
       désignée par « page précédente », comme avant. */
    if (/series-exercices\.html$/i.test(chemin)) return 'Retour aux exercices';
    if (/\/dashboard\.html$/i.test(chemin)) return 'Retour au tableau de bord';
    if (/revision-erreurs\.html$/i.test(chemin)) return 'Retour à mes erreurs';
    if (/livre-smart\.html$/i.test(chemin)) return 'Retour à mon livre';
    if (/ma-fiche-revision\.html$/i.test(chemin)) return 'Retour à ma fiche';
    if (/portail\.html$/i.test(chemin)) return 'Retour au portail';
    return 'Retour à la page précédente';
  }
  var libelle = libelleDe(destination);

  /* Le bouton de retour est celui de la page de quiz : il reprend la provenance.
     La navigation globale (barre mobile, menu croisé) et le lien « Page d'accueil
     du site » gardent leur destination d'origine. */
  function estLienDeRetour(a) {
    if (a.hasAttribute('data-sti-lien-fixe')) return false;
    if (a.closest && a.closest('#sti-bnav, #sti-bnav-sheet, #sti-bnav-voile, #stix-nav')) return false;
    var cible;
    try { cible = new URL(a.getAttribute('href') || '', ici); } catch (e) { return false; }
    if (!cible || cible.origin !== ici.origin) return false;
    if (!(cible.pathname === racine.pathname + 'index.html' || cible.pathname === racine.pathname)) return false;
    if (cible.hash && cible.hash !== '#modules' && cible.hash !== '#quiz') return false;
    return /retour|revenir/i.test(a.textContent || '') || a.hasAttribute('data-sti-retour-quiz');
  }

  function habiller(a) {
    a.href = retour;
    a.title = libelle;
    a.setAttribute('aria-label', libelle);
    a.setAttribute('data-sti-retour-quiz', '');
    var marcheur = document.createTreeWalker(a, NodeFilter.SHOW_TEXT), noeud;
    var textes = [], icone = false;
    while ((noeud = marcheur.nextNode())) {
      var valeur = noeud.nodeValue || '';
      if (/^[\s]*(?:◀|←|⟵|«)[\s]*$/.test(valeur)) icone = true;
      else if (/retour|revenir/i.test(valeur)) textes.push(noeud);
    }
    if (!textes.length) return;
    /* Ne pas doubler une flèche déjà présente dans la puce de l'élément. */
    var remplacement = (icone ? '' : '← ') + libelle;
    var principal = textes[textes.length - 1];
    principal.nodeValue = String(principal.nodeValue).replace(/(?:◀|←|⟵|«)?\s*(?:retour|revenir)[^\n]*/i, remplacement);
  }

  function mettreAJour() {
    var liens = document.querySelectorAll('a[href]');
    Array.prototype.forEach.call(liens, function (a) {
      if (estLienDeRetour(a)) habiller(a);
    });
  }

  /* Bouton de retour propre au téléphone : les en-têtes de quiz masquent souvent
     leur bouton sous 700 px. Il est ajouté à toutes les pages de quiz. */
  function conteneurMobile() {
    var candidats = [
      'main .hero .reveal',
      '.hero-grid > div',
      'main',
      '#contenu'
    ];
    for (var i = 0; i < candidats.length; i++) {
      var el = document.querySelector(candidats[i]);
      if (el) return el;
    }
    return document.body;
  }
  function ajouterBoutonMobile() {
    if (document.getElementById('sti-quiz-retour-mobile')) return;
    var conteneur = conteneurMobile();
    if (!conteneur) return;
    if (!document.getElementById('sti-quiz-retour-mobile-css')) {
      var style = document.createElement('style');
      style.id = 'sti-quiz-retour-mobile-css';
      style.textContent = '.sti-quiz-retour-mobile{display:inline-flex;align-items:center;gap:6px;' +
        'width:max-content;max-width:100%;margin:0 0 1rem;padding:10px 16px;border-radius:999px;' +
        'font:800 13px/1.2 system-ui,-apple-system,"Segoe UI",sans-serif;text-decoration:none;' +
        'background:var(--surface,#fffcf3);color:var(--ink,#0f1726);border:1.5px solid var(--border,#e7d9bd);' +
        'box-shadow:0 4px 12px rgba(15,23,38,.12)}' +
        '.sti-quiz-retour-mobile:hover{border-color:var(--accent,#f4511e)}' +
        '@media(min-width:700px){.sti-quiz-retour-mobile{display:none}}' +
        '@media print{.sti-quiz-retour-mobile{display:none!important}}';
      document.head.appendChild(style);
    }
    var lien = document.createElement('a');
    lien.id = 'sti-quiz-retour-mobile';
    lien.className = 'sti-quiz-retour-mobile';
    lien.setAttribute('data-sti-retour-quiz', '');
    lien.href = retour;
    lien.title = libelle;
    lien.textContent = '← ' + libelle;
    lien.setAttribute('aria-label', libelle);
    conteneur.insertBefore(lien, conteneur.firstChild);
  }

  function demarrer() {
    mettreAJour();
    ajouterBoutonMobile();
    if (!document.body || !global.MutationObserver) return;
    /* Les bilans et les listes créent leurs liens après le chargement. Le
       regroupement par image limite le coût pendant une partie de quiz. */
    var attente = 0;
    function mettreAJourBientot() {
      if (attente) return;
      attente = global.requestAnimationFrame(function () { attente = 0; mettreAJour(); });
    }
    new MutationObserver(function (mutations) {
      if (mutations.some(function (mutation) {
        return Array.prototype.some.call(mutation.addedNodes, function (noeud) {
          return noeud.nodeType === 1 && (noeud.matches('a[href]') || noeud.querySelector('a[href]'));
        });
      })) mettreAJourBientot();
    }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer, { once: true });
  else demarrer();
})(window, document);
