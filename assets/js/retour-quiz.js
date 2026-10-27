/* Retour des quiz vers leur page d'appel, sans stockage ni redirection externe. */
(function (global, document) {
  'use strict';
  var ici = new URL(global.location.href);
  var baseQuiz = new URL('../quiz/', ici);
  var baseCours = new URL('../cours/', ici);
  var dansQuiz = ici.pathname.indexOf(baseQuiz.pathname) === 0;

  function coursSecurise(valeur) {
    if (!valeur) return null;
    try {
      var url = new URL(valeur, ici);
      if (url.origin !== ici.origin || url.username || url.password ||
          url.pathname.indexOf(baseCours.pathname) !== 0 || !/\.html$/i.test(url.pathname)) return null;
      return url;
    } catch (e) { return null; }
  }

  if (!dansQuiz) {
    /* Conserver l'onglet ou le chapitre exact d'où part le lien, y compris
       pour un clic auxiliaire et une ouverture dans un autre onglet. */
    if (ici.pathname.indexOf(baseCours.pathname) !== 0) return;
    function preparer(event) {
      var a = event.target && event.target.closest && event.target.closest('a[href]');
      if (!a) return;
      var cible;
      try { cible = new URL(a.href, ici); } catch (e) { return; }
      if (cible.origin !== ici.origin || cible.pathname.indexOf(baseQuiz.pathname) !== 0 || !/\.html$/i.test(cible.pathname)) return;
      cible.searchParams.set('retour', global.location.pathname + global.location.search + (global.location.hash || '#cours'));
      a.href = cible.href;
    }
    ['pointerdown', 'click', 'auxclick', 'contextmenu'].forEach(function (type) { document.addEventListener(type, preparer, true); });
    return;
  }

  var destination = coursSecurise(ici.searchParams.get('retour'));
  if (!destination && !ici.searchParams.has('retour')) destination = coursSecurise(document.referrer);
  if (destination && !ici.searchParams.has('retour')) {
    /* Un rechargement ou la redirection pp.html garde la destination validée. */
    ici.searchParams.set('retour', destination.pathname + destination.search + destination.hash);
    global.history.replaceState(global.history.state, '', ici.href);
  }
  var retour = destination ? destination.href : new URL('../index.html#quiz', ici).href;
  var libelle = destination ? 'Retour au cours' : 'Retour aux quiz';
  function mettreAJour() {
    Array.prototype.forEach.call(document.querySelectorAll('a[href]'), function (a) {
      var brut = a.getAttribute('href') || '';
      if (!/^\.\.\/index\.html#(?:modules|quiz)$/.test(brut)) return;
      var texte = a.textContent || '';
      // Un lien explicitement nommé « Page d'accueil » reste un lien d'accueil.
      if (!/retour|revenir/i.test(texte)) return;
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
  // Certains bilans de quiz créent leur lien retour après le chargement.
  document.addEventListener('click', function (event) {
    var a = event.target && event.target.closest && event.target.closest('a[href]');
    if (a && /^\.\.\/index\.html#(?:modules|quiz)$/.test(a.getAttribute('href') || '')) mettreAJour();
  }, true);
  function ajouterRetourMobile() {
    // Sur le quiz HTML-CSS, le retour de la barre historique est masqué sur
    // téléphone. Réutiliser son style dans l'accueil du quiz, sans toucher aux
    // boutons qui mènent explicitement aux deux cours.
    if (!/\/quiz\/html-css\.html$/i.test(ici.pathname) || document.getElementById('sti-quiz-retour-mobile')) return;
    var contenu = document.querySelector('main .hero .reveal');
    if (!contenu) return;
    var style = document.createElement('style');
    style.textContent = '.sti-quiz-retour-mobile{display:flex;width:max-content;max-width:100%;margin-bottom:1rem}@media(min-width:700px){.sti-quiz-retour-mobile{display:none}}';
    document.head.appendChild(style);
    var lien = document.createElement('a');
    lien.id = 'sti-quiz-retour-mobile';
    lien.className = 'btn-glass sti-quiz-retour-mobile';
    lien.href = retour;
    lien.textContent = '← ' + libelle;
    lien.setAttribute('aria-label', libelle);
    contenu.insertBefore(lien, contenu.firstChild);
  }
  function demarrer() {
    mettreAJour();
    ajouterRetourMobile();
    // Préparer aussi les liens créés après le chargement (bilan, menus),
    // y compris pour une ouverture par clic droit ou dans un nouvel onglet.
    if (!document.body || !global.MutationObserver) return;
    new MutationObserver(function (mutations) {
      var lienAjoute = mutations.some(function (mutation) {
        return Array.prototype.some.call(mutation.addedNodes, function (noeud) {
          return noeud.nodeType === 1 && (noeud.matches('a[href]') || noeud.querySelector('a[href]'));
        });
      });
      if (lienAjoute) mettreAJour();
    }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer, { once: true });
  else demarrer();
})(window, document);
