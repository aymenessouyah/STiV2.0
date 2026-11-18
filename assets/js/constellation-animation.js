/* Anime uniquement les cartes visibles ; les liens et la liste fonctionnent sans JS. */
(function () {
  'use strict';
  var cartes = Array.prototype.slice.call(document.querySelectorAll('.star-map'));
  var controls = document.getElementById('animation-controls');
  var pause = document.getElementById('animation-pause');
  var rejouer = document.getElementById('animation-rejouer');
  if (!cartes.length || !controls || !pause || !rejouer) return;
  var reduire = window.matchMedia('(prefers-reduced-motion: reduce)');
  var enPause = false, observer = null;
  var ns = 'http://www.w3.org/2000/svg';

  cartes.forEach(function (carte) {
    carte.querySelectorAll('path.line').forEach(function (ligne) {
      var point = document.createElementNS(ns, 'circle');
      point.setAttribute('class', 'traceur-matiere');
      point.setAttribute('r', '2.8');
      point.setAttribute('aria-hidden', 'true');
      var mouvement = document.createElementNS(ns, 'animateMotion');
      mouvement.setAttribute('path', ligne.getAttribute('d'));
      mouvement.setAttribute('dur', '7s');
      mouvement.setAttribute('repeatCount', 'indefinite');
      mouvement.setAttribute('begin', 'indefinite');
      point.appendChild(mouvement);
      /* Le point suit les mêmes règles d'accès que sa ligne. */
      ligne.parentNode.insertBefore(point, ligne.nextSibling);
    });
  });
  function lancer(carte) {
    if (reduire.matches || carte.classList.contains('is-playing')) return;
    carte.classList.add('is-playing');
    carte.querySelectorAll('animateMotion').forEach(function (a) { if (a.beginElement) a.beginElement(); });
    if (enPause) {
      carte.classList.add('is-paused');
      if (carte.pauseAnimations) carte.pauseAnimations();
    }
  }
  function initialiser() {
    if (observer) observer.disconnect();
    cartes.forEach(function (carte) {
      if (carte.unpauseAnimations) carte.unpauseAnimations();
      carte.querySelectorAll('animateMotion').forEach(function (a) { if (a.endElement) a.endElement(); });
      carte.classList.remove('is-playing', 'is-paused');
    });
    enPause = false;
    pause.setAttribute('aria-pressed', 'false');
    pause.textContent = 'Ⅱ Mettre en pause';
    controls.hidden = reduire.matches;
    if (reduire.matches) return;
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { if (entry.isIntersecting) lancer(entry.target); });
      }, { threshold: 0.15 });
      cartes.forEach(function (carte) { observer.observe(carte); });
    } else cartes.forEach(lancer);
  }
  pause.addEventListener('click', function () {
    enPause = !enPause;
    pause.setAttribute('aria-pressed', String(enPause));
    pause.textContent = enPause ? '▶ Reprendre' : 'Ⅱ Mettre en pause';
    cartes.forEach(function (carte) {
      carte.classList.toggle('is-paused', enPause);
      if (enPause && carte.pauseAnimations) carte.pauseAnimations();
      else if (!enPause && carte.unpauseAnimations) carte.unpauseAnimations();
    });
  });
  rejouer.addEventListener('click', initialiser);
  if (reduire.addEventListener) reduire.addEventListener('change', initialiser);
  else if (reduire.addListener) reduire.addListener(initialiser);
  initialiser();
})();
