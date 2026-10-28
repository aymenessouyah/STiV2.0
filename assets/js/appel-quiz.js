/* Conserver le contexte exact d'une page qui ouvre un quiz, et le restituer au retour.
   Une page peut être atteinte depuis plusieurs endroits (cours, accueil, tableau de
   bord, exercices, révision des erreurs) : chaque appel mémorise sa provenance, son
   onglet et sa position de défilement, sans stockage local (le contexte voyage dans
   l'URL de retour, donc il survit aussi à un rechargement du quiz). */
(function (global, document) {
  'use strict';
  var ici = new URL(global.location.href);
  var source = document.currentScript && document.currentScript.src;
  var racine = source ? new URL('../../', source) : new URL('../', ici);
  var baseQuiz = new URL('quiz/', racine);
  var baseCours = new URL('cours/', racine);
  var PARAM_REPRISE = 'sti_reprise';

  /* Le fragment désigne la partie de la page appelante : onglet de cours déjà
     ouvert (#exercices, #annexes…), ou section d'accueil d'où part le lien. */
  function fragmentAppelant(lien) {
    if (global.location.hash) return global.location.hash;
    if (ici.pathname.indexOf(baseCours.pathname) === 0) return '#cours';
    if (ici.pathname === racine.pathname || ici.pathname === racine.pathname + 'index.html') {
      var section = lien && lien.closest ? lien.closest('section[id]') : null;
      if (section) return '#' + encodeURIComponent(section.id);
    }
    return '';
  }

  /* L'adresse de retour porte la position de lecture, retirée dès l'arrivée. */
  function adresseRetour(lien) {
    var url = new URL(global.location.pathname, ici);
    url.search = global.location.search;
    var y = Math.round(global.scrollY || global.pageYOffset || 0);
    if (y > 0) url.searchParams.set(PARAM_REPRISE, String(y));
    url.hash = fragmentAppelant(lien);
    return url.pathname + url.search + url.hash;
  }

  function preparer(evenement) {
    var a = evenement.target && evenement.target.closest && evenement.target.closest('a[href]');
    if (!a) return;
    var cible;
    try { cible = new URL(a.href, ici); } catch (e) { return; }
    if (cible.origin !== ici.origin || cible.pathname.indexOf(baseQuiz.pathname) !== 0 || !/\.html$/i.test(cible.pathname)) return;
    cible.searchParams.set('retour', adresseRetour(a));
    a.href = cible.href;
  }
  // Un Referer ne contient pas l'ancre ; le clic droit et les onglets l'emportent aussi.
  ['pointerdown', 'click', 'auxclick', 'contextmenu'].forEach(function (type) { document.addEventListener(type, preparer, true); });

  /* Retour depuis un quiz : retrouver la page à l'endroit exact où elle avait été
     laissée. Le repère est retiré de l'adresse avant tout autre traitement. */
  function reprendrePosition() {
    var url = new URL(global.location.href);
    var reprise = url.searchParams.get(PARAM_REPRISE);
    if (reprise === null) return;
    url.searchParams.delete(PARAM_REPRISE);
    try {
      global.history.replaceState(global.history.state, '', url.pathname + url.search + url.hash);
    } catch (e) {}
    var cible = Math.max(0, Math.round(Number(reprise) || 0));
    function placer() {
      var racineDocument = document.documentElement;
      var ancien = racineDocument.style.scrollBehavior;
      racineDocument.style.scrollBehavior = 'auto';
      global.scrollTo(0, cible);
      racineDocument.style.scrollBehavior = ancien;
    }
    /* Le hash choisit l'onglet : replacer la position après cette bascule. */
    global.setTimeout(placer, 60);
    global.setTimeout(placer, 340);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', reprendrePosition, { once: true });
  else reprendrePosition();
  global.addEventListener('pageshow', function (evenement) {
    if (evenement.persisted) reprendrePosition();
  }, { passive: true });

  global.__STI_APPEL_QUIZ = true;
})(window, document);
