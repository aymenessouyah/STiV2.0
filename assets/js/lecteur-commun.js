/* Adaptation du lecteur STI historique : accès, reprise et clavier communs.
   Les vidéos et leurs chapitres restent ceux du lecteur de protection.js. */
(function (global, document) {
  'use strict';
  var historique, overlay, player, origine, origineVideo, inertes = [], modalDejaOuverte = false;
  var dernierSauvetage = 0;
  var meta = {
    'html5-cours': ['html5','Cours HTML5'],
    'css3-cours': ['css3','Cours CSS3'],
    'css3-display': ['css3','Display : la démo animée'],
    'css-positionnement': ['css3','CSS pas à pas — Positionnement'],
    'css-animee': ['css3','CSS pas à pas — Décoration'],
    'javascript-cours': ['javascript','Récapitulatif JavaScript'],
    'validation-nom-prenom-js': ['javascript','Validation du champ Nom & Prénom'],
    'tp-train-serie6': ['javascript','TP Train — correction détaillée (Série 6)'],
    'sql-cours': ['sql','Cours SQL'],
    'sql-initiation': ['sql','Construire une requête SQL'],
    'sql-serie4': ['sql','Série 4 SQL'],
    'sql-serie5': ['sql','Série 5 SQL'],
    'php-cours': ['php','Cours PHP'],
    'php-synthese': ['php','Synthèse PHP : gestion des élèves'],
    'php-guichet': ['php','Animation du guichet PHP']
  };
  function slugPour(valeur) {
    var s = String(valeur || '').toLowerCase();
    if (s === 'guichet') return 'php-guichet';
    if (s.indexOf('displayanim') !== -1) return 'css3-display';
    if (s.indexOf('php-synthese') !== -1) return 'php-synthese';
    var cles = Object.keys(meta).concat(['sql-serie1','sql-serie2','sql-serie3','sql-serie6','explore-tunisie-flex','explore-tunisie-float']);
    for (var i = 0; i < cles.length; i++) if (s === cles[i] || s.indexOf(cles[i]) !== -1) return cles[i];
    return s;
  }
  function autorise(slug) {
    return !(/^php-/.test(slug) || /^sql-serie[45]$/.test(slug)) ||
      document.documentElement.classList.contains('sti-4si-autorise');
  }
  function sauvegarder(terminee) {
    if (!overlay || !player || !global.STIProfil) return;
    var slug = overlay.getAttribute('data-slug') || '', info = meta[slug];
    var temps = Number(player.currentTime) || 0;
    if (!info || (!terminee && temps < 3)) return;
    global.STIProfil.enregistrerPositionVideo({
      id: slug, matiere: info[0], titre: info[1], temps: temps,
      duree: Number.isFinite(player.duration) ? player.duration : 0,
      url: 'cours/' + info[0] + '.html#videos', terminee: !!terminee
    });
  }
  function elementsFocus() {
    return Array.prototype.filter.call(overlay.querySelectorAll('button:not([disabled]),select:not([disabled]),a[href],video[controls],[tabindex]:not([tabindex="-1"])'), function (e) {
      return !e.closest('[hidden],[inert]') && e.getClientRects().length;
    });
  }
  function liberer() {
    if (!inertes.length) return;
    inertes.forEach(function (e) { e[0].inert = e[1]; }); inertes = [];
    if (!modalDejaOuverte) document.documentElement.classList.remove('sti-modal-open');
    var cible = origine;
    // Si la carte a été reconstruite après avoir marqué la vidéo comme vue,
    // retrouver le même bouton plutôt que perdre le focus au retour.
    if ((!cible || !cible.isConnected) && origineVideo) {
      var zone = document.getElementById(origineVideo.zone) || document;
      cible = Array.prototype.find.call(zone.querySelectorAll('[data-play-video]'), function (e) {
        return e.getAttribute('data-play-video') === origineVideo.slug && e.classList.contains('video-card__thumb') === origineVideo.miniature;
      });
    }
    if (cible && cible.isConnected && !cible.closest('[hidden],[inert]')) cible.focus({ preventScroll: true });
    origine = null; origineVideo = null;
  }
  function activerLecteur(declencheur) {
    var nouveau = document.getElementById('sti-video-modal-overlay');
    if (!nouveau || nouveau.hidden || nouveau.style.display === 'none') return;
    overlay = nouveau; player = document.getElementById('sti-video-modal-player');
    var carte = document.getElementById('sti-video-modal-card');
    if (carte) { carte.setAttribute('aria-labelledby','sti-video-modal-title'); carte.tabIndex = -1; }
    if (player) player.setAttribute('aria-label','Vidéo du cours');
    if (!inertes.length) {
      origine = declencheur;
      if (origine && origine.hasAttribute && origine.hasAttribute('data-play-video')) {
        var zone = origine.closest('#videosGrid,#dashVideosList');
        origineVideo = { zone: zone && zone.id, slug: origine.getAttribute('data-play-video'), miniature: origine.classList.contains('video-card__thumb') };
      } else origineVideo = null;
      modalDejaOuverte = document.documentElement.classList.contains('sti-modal-open');
      Array.prototype.forEach.call(document.body.children, function (e) {
        if (e === overlay || e.contains(overlay)) return;
        inertes.push([e, e.inert]); e.inert = true;
      });
      document.documentElement.classList.add('sti-modal-open');
    }
    if (!overlay.__stiCommun) {
      overlay.__stiCommun = true;
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay || e.target.closest('#sti-video-modal-close')) sauvegarder(false);
      }, true);
      overlay.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          // Ne pas fermer aussi le récapitulatif ou la ressource sous-jacente.
          e.preventDefault(); e.stopPropagation(); sauvegarder(false);
          var boutonFermer = document.getElementById('sti-video-modal-close');
          if (boutonFermer) boutonFermer.click();
          return;
        }
        if (e.key !== 'Tab') return;
        var f = elementsFocus(), premier = f[0], dernier = f[f.length - 1];
        if (!f.length) { e.preventDefault(); if (carte) carte.focus(); }
        else if (e.shiftKey && (document.activeElement === premier || !overlay.contains(document.activeElement))) { e.preventDefault(); dernier.focus(); }
        else if (!e.shiftKey && (document.activeElement === dernier || !overlay.contains(document.activeElement))) { e.preventDefault(); premier.focus(); }
      });
      if (player) {
        player.addEventListener('timeupdate', function () { if (Date.now() - dernierSauvetage > 3500) { dernierSauvetage = Date.now(); sauvegarder(false); } });
        player.addEventListener('pause', function () { sauvegarder(false); });
        player.addEventListener('ended', function () { sauvegarder(true); });
      }
      new MutationObserver(function () { if (overlay.hidden || overlay.style.display === 'none') liberer(); })
        .observe(overlay, { attributes: true, attributeFilter: ['hidden','style'] });
    }
    // La position du profil reste accessible même lorsque le lecteur est
    // ouvert depuis le récapitulatif ou une autre page imbriquée.
    var actions = overlay.querySelector('.sti-video-pas-a-pas-actions');
    var reprise = overlay.querySelector('[data-reprise-profil]');
    if (actions && !reprise) {
      reprise = document.createElement('button'); reprise.type = 'button';
      reprise.setAttribute('data-reprise-profil', '');
      reprise.addEventListener('click', function () {
        var secondes = Number(reprise.dataset.temps) || 0;
        if (player) {
          try { player.currentTime = secondes; var lecture = player.play(); if (lecture && lecture.catch) lecture.catch(function () {}); } catch (e) {}
        }
        reprise.hidden = true;
        var fermer = document.getElementById('sti-video-modal-close');
        if (fermer) fermer.focus({ preventScroll: true });
      });
      actions.insertBefore(reprise, document.getElementById('sti-video-modal-fs'));
    }
    if (reprise) {
      var secondes = position(overlay.getAttribute('data-slug') || '');
      reprise.dataset.temps = String(secondes); reprise.hidden = secondes <= 2;
      reprise.textContent = '⏯ Reprendre à ' + Math.floor(secondes / 60) + ':' + String(Math.floor(secondes % 60)).padStart(2, '0');
    }
    var fermer = document.getElementById('sti-video-modal-close');
    if (fermer) fermer.focus({ preventScroll: true });
  }
  function ouvrir(slug, titre, debut) {
    var id = slugPour(slug);
    if (!autorise(id)) return false;
    var precedent = document.activeElement;
    // Ne jamais superposer la voix de la piste PHP et celle de la vidéo.
    var audioPhp = document.getElementById('phpCourseAudio');
    if (audioPhp && !audioPhp.paused) audioPhp.pause();
    if (overlay && !overlay.hidden) sauvegarder(false);
    var resultat = historique.apply(global, arguments);
    activerLecteur(precedent);
    return resultat;
  }
  function slugVideo(v) {
    if (!v) return '';
    if (v.dataset.videoId) return slugPour(v.dataset.videoId);
    if (v.id === 'heroFeaturedVideo') return 'css3-cours';
    if (v.id === 'videoSynthese') return 'php-synthese';
    if (v.hasAttribute('data-js-video')) return 'javascript-cours';
    if (v.hasAttribute('data-css-video')) return v.id === 'playlistLessonVideo' ? '' : 'css3-display';
    if ((v.id === 'heroCourseVideo' || v.id === 'tabCourseVideo') && document.body.classList.contains('course-page--html5')) return 'html5-cours';
    return '';
  }
  function position(slug) {
    var p = global.STIProfil && global.STIProfil.chargerProfil();
    return p && p.videos && p.videos.positions ? Number(p.videos.positions[slug]) || 0 : 0;
  }
  function lancer(slug, temps, plein) {
    if (!slug || typeof global.ouvrirVideoPasAPasSTI !== 'function') return;
    global.ouvrirVideoPasAPasSTI(slug, null, Number(temps) || 0);
    if (plein) { var b = document.getElementById('sti-video-modal-fs'); if (b && overlay && !overlay.hidden) b.click(); }
  }
  function initialiser() {
    historique = global.ouvrirVideoPasAPasSTI;
    if (typeof historique !== 'function') return;
    global.ouvrirVideoPasAPasSTI = ouvrir;
    /* Chaque aperçu garde son fichier d'origine et dispose d'une entrée claire
       vers le lecteur complet ; l'exemple HTML5 <video> reste pédagogique. */
    document.querySelectorAll('video').forEach(function (v) {
      if (v.id === 'heroFeaturedVideo' || v.id === 'modalJsVideo' || v.id === 'modalVideo' ||
          (!slugVideo(v) && v.id !== 'playlistLessonVideo')) return;
      var b = document.createElement('button'); b.type = 'button'; b.className = 'source-btn sti-lecteur-complet';
      b.textContent = '▶ Ouvrir le lecteur complet';
      b.addEventListener('click', function () { lancer(slugVideo(v), 0, false); });
      var parent = v.parentElement;
      if (parent && parent.classList.contains('featured-video-card__stage')) parent.insertAdjacentElement('afterend', b);
      else v.insertAdjacentElement('afterend', b);
    });
    document.addEventListener('click', function (e) {
      var t = e.target, bouton, v, slug, temps = 0, plein = false;
      if (!t || !t.closest) return;
      if (t.tagName === 'VIDEO' && (slug = slugVideo(t))) { v = t; temps = t.currentTime || 0; }
      else if ((bouton = t.closest('[data-seek-video]')) && document.body.classList.contains('course-page--html5')) { slug = 'html5-cours'; temps = bouton.dataset.seekVideo; }
      else if ((bouton = t.closest('[data-featured-time]')) && document.body.classList.contains('course-page--php')) { v = document.getElementById('featuredVideo'); slug = slugVideo(v); temps = bouton.dataset.featuredTime; }
      else if ((bouton = t.closest('#s9c-video .chapitre-btn[data-t]'))) { slug = 'php-synthese'; temps = bouton.dataset.t; }
      else if ((bouton = t.closest('#btnPleinEcranSynthese'))) { slug = 'php-synthese'; plein = true; }
      else if ((bouton = t.closest('[data-fullscreen-video]'))) { v = document.getElementById(bouton.dataset.fullscreenVideo); slug = slugVideo(v); plein = true; }
      else if ((bouton = t.closest('[data-resume-video]'))) { var carte = bouton.closest('.featured-video-card,.js-video-modal__body'); v = carte && carte.querySelector('video'); slug = slugVideo(v); temps = position(slug); }
      else if ((bouton = t.closest('[data-play-display]'))) { slug = 'css3-display'; }
      if (!slug) return;
      e.preventDefault(); e.stopImmediatePropagation(); lancer(slug, temps, plein);
    }, true);
    document.addEventListener('keydown', function (e) {
      // Le bouton de reprise peut disparaître : Échap doit néanmoins ne
      // fermer que le lecteur situé au-dessus de la modale appelante.
      if (e.key === 'Escape' && overlay && !overlay.hidden && overlay.style.display !== 'none') {
        e.preventDefault(); e.stopImmediatePropagation(); sauvegarder(false);
        var fermer = document.getElementById('sti-video-modal-close');
        if (fermer) fermer.click();
        return;
      }
      if (e.key === 'Tab' && overlay && !overlay.hidden && overlay.style.display !== 'none' && !overlay.contains(document.activeElement)) {
        var cibles = elementsFocus();
        if (cibles.length) { e.preventDefault(); (e.shiftKey ? cibles[cibles.length-1] : cibles[0]).focus(); }
        return;
      }
      if ((e.key !== ' ' && e.key !== 'Enter') || !e.target || e.target.tagName !== 'VIDEO') return;
      var slug = slugVideo(e.target); if (!slug) return;
      e.preventDefault(); e.stopImmediatePropagation(); lancer(slug, e.target.currentTime || 0, false);
    }, true);
    document.addEventListener('play', function (e) {
      var v = e.target, slug = v && v.tagName === 'VIDEO' ? slugVideo(v) : '';
      if (!slug || v.id === 'sti-video-modal-player') return;
      var temps = v.currentTime || 0; v.pause(); lancer(slug, temps, false);
    }, true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialiser, { once: true });
  else initialiser();
})(window, document);
