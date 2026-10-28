/* Retour des quiz vers leur page d'appel, sans stockage ni redirection externe. */
(function (global, document) {
  'use strict';
  var ici = new URL(global.location.href);
  var source = document.currentScript && document.currentScript.src;
  var racine = source ? new URL('../../', source) : new URL('../', ici);
  var baseQuiz = new URL('quiz/', racine);
  var baseCours = new URL('cours/', racine);
  if (ici.pathname.indexOf(baseQuiz.pathname) !== 0) return;

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

  var destination = pageLocale(ici.searchParams.get('retour'));
  if (!destination && !ici.searchParams.has('retour')) destination = pageLocale(document.referrer);
  if (destination && !ici.searchParams.has('retour')) {
    /* Un rechargement ou la redirection pp.html garde la destination validée. */
    ici.searchParams.set('retour', destination.pathname + destination.search + destination.hash);
    global.history.replaceState(global.history.state, '', ici.href);
  }
  var retour = destination ? destination.href : new URL('index.html#quiz', racine).href;
  var accueil = destination && (destination.pathname === racine.pathname || destination.pathname === racine.pathname + 'index.html');
  var libelle = !destination || (accueil && destination.hash === '#quiz') ? 'Retour aux quiz' :
    destination.pathname.indexOf(baseCours.pathname) === 0 ? 'Retour au cours' : 'Retour à la page précédente';

  function mettreAJour() {
    Array.prototype.forEach.call(document.querySelectorAll('a[href]'), function (a) {
      if (!/^\.\.\/index\.html#(?:modules|quiz)$/.test(a.getAttribute('href') || '') || !/retour|revenir/i.test(a.textContent || '')) return;
      a.href = retour;
      a.title = libelle; a.setAttribute('aria-label', libelle);
      var marcheur = document.createTreeWalker(a, NodeFilter.SHOW_TEXT), noeud;
      while ((noeud = marcheur.nextNode())) {
        if (/retour|revenir/i.test(noeud.nodeValue)) {
          noeud.nodeValue = noeud.nodeValue.replace(/(?:◀|←)?\s*(?:retour|revenir)[^\n]*/i, '← ' + libelle);
          break;
        }
      }
    });
  }
  /* Les bilans peuvent créer leur lien après le chargement. */
  document.addEventListener('click', function (event) {
    var a = event.target && event.target.closest && event.target.closest('a[href]');
    if (a && /^\.\.\/index\.html#(?:modules|quiz)$/.test(a.getAttribute('href') || '')) mettreAJour();
  }, true);
  function demarrer() {
    mettreAJour();
    // Le retour historique HTML-CSS est masqué sur téléphone : reprendre son style.
    var contenu = document.querySelector('main .hero .reveal');
    if (/\/quiz\/html-css\.html$/i.test(ici.pathname) && contenu && !document.getElementById('sti-quiz-retour-mobile')) {
      var style = document.createElement('style');
      style.textContent = '.sti-quiz-retour-mobile{display:flex;width:max-content;max-width:100%;margin-bottom:1rem}@media(min-width:700px){.sti-quiz-retour-mobile{display:none}}';
      document.head.appendChild(style);
      var lien = document.createElement('a');
      lien.id = 'sti-quiz-retour-mobile'; lien.className = 'btn-glass sti-quiz-retour-mobile';
      lien.href = retour; lien.textContent = '← ' + libelle; lien.setAttribute('aria-label', libelle);
      contenu.insertBefore(lien, contenu.firstChild);
    }
    if (!document.body || !global.MutationObserver) return;
    new MutationObserver(function (mutations) {
      if (mutations.some(function (mutation) {
        return Array.prototype.some.call(mutation.addedNodes, function (noeud) {
          return noeud.nodeType === 1 && (noeud.matches('a[href]') || noeud.querySelector('a[href]'));
        });
      })) mettreAJour();
    }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer, { once: true });
  else demarrer();
})(window, document);
