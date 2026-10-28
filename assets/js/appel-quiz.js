/* Conserver le contexte exact d'une page qui ouvre un quiz. */
(function (global, document) {
  'use strict';
  var ici = new URL(global.location.href);
  var racine = new URL('../../', document.currentScript.src);
  var baseQuiz = new URL('quiz/', racine), baseCours = new URL('cours/', racine);
  function preparer(event) {
    var a = event.target && event.target.closest && event.target.closest('a[href]');
    if (!a) return;
    var cible;
    try { cible = new URL(a.href, ici); } catch (e) { return; }
    if (cible.origin !== ici.origin || cible.pathname.indexOf(baseQuiz.pathname) !== 0 || !/\.html$/i.test(cible.pathname)) return;
    var fragment = global.location.hash;
    if (!fragment && ici.pathname.indexOf(baseCours.pathname) === 0) fragment = '#cours';
    if (!fragment && (ici.pathname === racine.pathname || ici.pathname === racine.pathname + 'index.html')) {
      var section = a.closest('section[id]');
      if (section) fragment = '#' + encodeURIComponent(section.id);
    }
    cible.searchParams.set('retour', global.location.pathname + global.location.search + fragment);
    a.href = cible.href;
  }
  // Un Referer ne contient pas l'ancre ; le clic droit et les onglets l'emportent aussi.
  ['pointerdown', 'click', 'auxclick', 'contextmenu'].forEach(function (type) { document.addEventListener(type, preparer, true); });
  global.__STI_APPEL_QUIZ = true;
})(window, document);
