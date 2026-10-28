/* Stories locales issues de la vidéo CSS3. Aucun profil ni stockage n'est modifié. */
(function () {
  'use strict';

  var extraits = [
    {
      id: 'intro', titre: 'Du HTML au CSS', duree: '16 s', debut: 24.2,
      description: 'Le même contenu prend vie grâce aux styles CSS.',
      transcription: 'Lorsque style.css arrive, le même HTML devient une carte de restaurant claire et attractive. On ajoute couleurs, typographie, espacements, bordures, ombres et bouton. HTML décrit le contenu ; CSS organise sa présentation.'
    },
    {
      id: 'selecteurs', titre: 'Les sélecteurs', duree: '8 s', debut: 77.8,
      description: 'Identifiant ou classe : à qui appliquer le style ?',
      transcription: 'Dièse suivi d’un identifiant vise un élément unique. Le point suivi d’une classe vise tous les éléments de cette classe.'
    },
    {
      id: 'display', titre: 'Inline ou block ?', duree: '12 s', debut: 294.9,
      description: 'Trois façons de placer les éléments dans une page.',
      transcription: 'Display inline conserve l’élément sur la ligne et suit son contenu. Block commence sur une nouvelle ligne et accepte largeur et hauteur. Inline-block reste sur la ligne tout en acceptant les dimensions.'
    },
    {
      id: 'flexbox', titre: 'Découvrir Flexbox', duree: '18 s', debut: 431.2,
      description: 'Organiser et aligner les éléments d’une mise en page.',
      transcription: 'Pour organiser une mise en page, utilisez plutôt Flexbox. Display flex place les enfants sur un axe principal et un axe transversal. Justify-content répartit les éléments sur l’axe principal, align-items les aligne sur l’axe transversal et gap crée un espacement régulier.'
    },
    {
      id: 'transitions', titre: 'Les transitions', duree: '16 s', debut: 618.3,
      description: 'Faire passer progressivement un élément d’un état à un autre.',
      transcription: 'Transition rend progressif le passage entre deux états, par exemple l’état normal et le survol. Sa forme courte indique la propriété, la durée, le rythme et le délai. Ease, linear, ease-in, ease-out et cubic-bezier règlent l’accélération.'
    }
  ];
  var icones = {
    melanger: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 14l4 4-4 4M18 2l4 4-4 4M2 18h2.5c4 0 5.5-12 10-12H22M2 6h2.5c1.8 0 3.2 2.4 4.5 5M14 18h8"/></svg>',
    fermer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg>',
    lecture: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.8v14.4L19 12z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 4h4v16H6zm8 0h4v16h-4z"/></svg>',
    son: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4zM16 9a4 4 0 010 6M19 6a8 8 0 010 12"/></svg>',
    muet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4zM17 9l5 6M22 9l-5 6"/></svg>',
    precedent: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>',
    suivant: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>',
    agrandir: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/></svg>'
  };

  function melanger(tableau, eviterRepetition) {
    var copie = tableau.slice();
    for (var i = copie.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var element = copie[i]; copie[i] = copie[j]; copie[j] = element;
    }
    /* Le bouton de mélange doit produire un changement même si le tirage répète le même ordre. */
    if (eviterRepetition && copie.length > 1 && copie.every(function (x, n) { return x === tableau[n]; })) copie.push(copie.shift());
    return copie;
  }

  function initialiser() {
    var hero = document.querySelector('main .hero');
    if (!hero || typeof HTMLDialogElement === 'undefined' || !HTMLDialogElement.prototype.showModal) return;

    var section = document.createElement('section');
    section.className = 'stories';
    section.id = 'stories';
    section.hidden = true;
    section.setAttribute('aria-labelledby', 'storiesTitle');
    section.innerHTML = '<div class="container">' +
      '<div class="stories__heading"><div><span class="stories__eyebrow">Stories vidéo · CSS3</span>' +
      '<h2 class="stories__title" id="storiesTitle">Une notion en quelques secondes</h2>' +
      '<p class="stories__description">Des extraits du cours, à découvrir dans un ordre surprise.</p></div>' +
      '<button type="button" class="stories__shuffle" aria-label="Mélanger les stories">' + icones.melanger + '<span class="stories__shuffle-label">Mélanger</span></button></div>' +
      '<div class="stories__rail" aria-label="Extraits vidéo CSS3"></div></div>';
    hero.parentNode.insertBefore(section, hero);
    /* En cas de mise à jour hors ligne partielle, ne pas afficher une interface sans sa feuille. */
    if (getComputedStyle(section).getPropertyValue('--stories-css-ready').trim() !== '1') {
      section.remove();
      return;
    }

    var dialogue = document.createElement('dialog');
    dialogue.className = 'story-viewer';
    dialogue.setAttribute('aria-labelledby', 'storyTitle');
    dialogue.setAttribute('aria-describedby', 'storyDescription');
    dialogue.setAttribute('aria-modal', 'true');
    dialogue.innerHTML = '<div class="story-viewer__layout">' +
      '<div class="story-viewer__progress" aria-hidden="true"></div>' +
      '<header class="story-viewer__head"><img class="story-viewer__avatar" src="assets/icons/sti-icon-192.png" alt="">' +
      '<div class="story-viewer__identity"><strong>STI · CSS3</strong><span>Extrait du cours</span></div>' +
      '<div class="story-viewer__tools">' +
      '<button type="button" class="story-viewer__icon" data-action="son" aria-label="Activer le son" title="Activer le son"></button>' +
      '<button type="button" class="story-viewer__icon story-viewer__captions" data-action="sous-titres" aria-label="CC : Activer les sous-titres" aria-pressed="false" title="Activer les sous-titres">CC</button>' +
      '<button type="button" class="story-viewer__icon" data-action="pause" aria-label="Mettre en pause" title="Mettre en pause"></button>' +
      '<button type="button" class="story-viewer__icon" data-action="plein-ecran" aria-label="Agrandir la vidéo" title="Agrandir la vidéo">' + icones.agrandir + '</button>' +
      '<button type="button" class="story-viewer__icon" data-action="fermer" aria-label="Fermer les stories" title="Fermer les stories">' + icones.fermer + '</button>' +
      '</div></header>' +
      '<div class="story-viewer__stage"><video class="story-viewer__video" playsinline webkit-playsinline preload="none" muted controlslist="nodownload" disablepictureinpicture><track kind="captions" srclang="fr" label="Français"></video>' +
      '<button type="button" class="story-viewer__step story-viewer__step--previous" data-action="precedent" aria-label="Story précédente">' + icones.precedent + '</button>' +
      '<button type="button" class="story-viewer__step story-viewer__step--next" data-action="suivant" aria-label="Story suivante">' + icones.suivant + '</button>' +
      '<button type="button" class="story-viewer__play" data-action="reprendre" hidden>Lire l’extrait</button></div>' +
      '<div class="story-viewer__info"><span class="story-viewer__counter"></span><h2 class="story-viewer__title" id="storyTitle"></h2>' +
      '<p class="story-viewer__description" id="storyDescription"></p>' +
      '<p class="story-viewer__status" role="status" aria-live="polite"></p>' +
      '<details class="story-viewer__transcript"><summary>Lire la transcription</summary><p></p></details>' +
      '<button type="button" class="story-viewer__complete" data-action="complet">Voir la vidéo complète <span aria-hidden="true">↗</span></button>' +
      '</div></div>';
    document.body.appendChild(dialogue);

    var rail = section.querySelector('.stories__rail');
    var etapes = dialogue.querySelector('.story-viewer__progress');
    var scene = dialogue.querySelector('.story-viewer__stage');
    var video = dialogue.querySelector('video');
    /* L'interlude QR des lecteurs de cours ne doit pas interrompre un extrait de quelques secondes. */
    video.__stiPauseQRBound = true;
    var titre = dialogue.querySelector('#storyTitle');
    var description = dialogue.querySelector('#storyDescription');
    var compteur = dialogue.querySelector('.story-viewer__counter');
    var statut = dialogue.querySelector('.story-viewer__status');
    var texte = dialogue.querySelector('.story-viewer__transcript p');
    var details = dialogue.querySelector('.story-viewer__transcript');
    var btnSon = dialogue.querySelector('[data-action="son"]');
    var btnSousTitres = dialogue.querySelector('[data-action="sous-titres"]');
    var pisteSousTitres = video.querySelector('track');
    var btnPause = dialogue.querySelector('[data-action="pause"]');
    var btnPleinEcran = dialogue.querySelector('[data-action="plein-ecran"]');
    var btnFermer = dialogue.querySelector('[data-action="fermer"]');
    var btnPrecedent = dialogue.querySelector('[data-action="precedent"]');
    var btnSuivant = dialogue.querySelector('[data-action="suivant"]');
    var btnReprendre = dialogue.querySelector('[data-action="reprendre"]');
    var ordre = melanger(extraits);
    var index = 0, sequence = 0, controleur = null, adresseObjet = '', origineFocus = null;
    var ouvert = false, lectureVoulue = true, enErreur = false, ancienOverflow = '';
    var sousTitresActifs = false, changementMedia = false, toucher = null;
    if (!video.requestFullscreen && !video.webkitEnterFullscreen) btnPleinEcran.hidden = true;

    function afficherCartes() {
      rail.replaceChildren();
      ordre.forEach(function (item, n) {
        var carte = document.createElement('button');
        carte.type = 'button'; carte.className = 'story-card';
        carte.dataset.story = item.id;
        var image = document.createElement('img');
        image.className = 'story-card__image'; image.src = 'assets/images/stories/' + item.id + '.jpg';
        image.alt = ''; image.loading = 'lazy'; image.addEventListener('error', function () { image.hidden = true; });
        carte.appendChild(image);
        var decor = document.createElement('span'); decor.className = 'story-card__shade'; decor.setAttribute('aria-hidden', 'true'); carte.appendChild(decor);
        var haut = document.createElement('span'); haut.className = 'story-card__top';
        haut.innerHTML = '<span class="story-card__avatar"><img src="assets/icons/sti-icon-192.png" alt=""></span><span class="story-card__duration"></span>';
        haut.querySelector('.story-card__duration').textContent = item.duree; carte.appendChild(haut);
        var bas = document.createElement('span'); bas.className = 'story-card__bottom';
        bas.innerHTML = '<span class="story-card__category">CSS3 · Extrait</span><strong class="story-card__name"></strong><span class="story-card__action">Regarder <span aria-hidden="true">→</span></span>';
        bas.querySelector('.story-card__name').textContent = item.titre; carte.appendChild(bas);
        carte.addEventListener('click', function () { ouvrir(n, carte); });
        rail.appendChild(carte);
      });
    }
    function afficherEtapes() {
      etapes.replaceChildren();
      ordre.forEach(function () {
        var piste = document.createElement('span'); piste.className = 'story-viewer__progress-track';
        var remplissage = document.createElement('span'); remplissage.className = 'story-viewer__progress-fill';
        piste.appendChild(remplissage); etapes.appendChild(piste);
      });
      actualiserEtapes();
    }
    function actualiserEtapes() {
      var progression = video.duration && isFinite(video.duration) ? Math.min(1, Math.max(0, video.currentTime / video.duration)) : 0;
      Array.prototype.forEach.call(etapes.children, function (piste, n) {
        piste.firstChild.style.width = (n < index ? 100 : n === index ? progression * 100 : 0) + '%';
      });
    }
    function actualiserCommandes() {
      btnSon.innerHTML = video.muted ? icones.muet : icones.son;
      btnSon.setAttribute('aria-label', video.muted ? 'Activer le son' : 'Couper le son');
      btnSon.title = btnSon.getAttribute('aria-label');
      btnSousTitres.setAttribute('aria-label', sousTitresActifs ? 'CC : Masquer les sous-titres' : 'CC : Activer les sous-titres');
      btnSousTitres.setAttribute('aria-pressed', String(sousTitresActifs));
      btnSousTitres.title = btnSousTitres.getAttribute('aria-label');
      btnPause.innerHTML = lectureVoulue ? icones.pause : icones.lecture;
      btnPause.setAttribute('aria-label', lectureVoulue ? 'Mettre en pause' : 'Reprendre la lecture');
      btnPause.title = btnPause.getAttribute('aria-label');
    }
    function libererMedia() {
      if (controleur) { controleur.abort(); controleur = null; }
      video.pause(); video.removeAttribute('src'); video.load();
      if (adresseObjet) { URL.revokeObjectURL(adresseObjet); adresseObjet = ''; }
    }
    function nettoyer() {
      if (!ouvert) return;
      ouvert = false; sequence++; libererMedia();
      document.body.style.overflow = ancienOverflow;
      document.documentElement.classList.remove('sti-stories-open');
      if (origineFocus && origineFocus.isConnected) origineFocus.focus({ preventScroll: true });
      origineFocus = null;
    }
    function fermer() {
      if (document.fullscreenElement === video && document.exitFullscreen) {
        var sortie = document.exitFullscreen(); if (sortie && sortie.catch) sortie.catch(function () {});
      } else if (video.webkitDisplayingFullscreen && video.webkitExitFullscreen) {
        try { video.webkitExitFullscreen(); } catch (erreur) {}
      }
      if (dialogue.open) dialogue.close();
      nettoyer();
    }
    function lire(numero) {
      if (!ouvert) return;
      var promesse;
      try { promesse = video.play(); } catch (erreur) { promesse = Promise.reject(erreur); }
      if (promesse && typeof promesse.catch === 'function') promesse.catch(function () {
        if (!ouvert || numero !== sequence) return;
        lectureVoulue = false; btnReprendre.textContent = 'Lire l’extrait'; btnReprendre.hidden = false;
        statut.textContent = 'Appuyez sur lecture pour démarrer la vidéo.'; actualiserCommandes();
      });
    }
    async function afficherExtrait(n) {
      if (!ouvert || n < 0 || n >= ordre.length) return;
      index = n; sequence++; changementMedia = true;
      var numero = sequence, item = ordre[index];
      libererMedia();
      lectureVoulue = true; enErreur = false; btnReprendre.hidden = true;
      titre.textContent = item.titre;
      description.textContent = item.description;
      compteur.textContent = 'Story ' + (index + 1) + ' / ' + ordre.length;
      texte.textContent = item.transcription;
      details.open = false;
      scene.style.setProperty('--story-poster', 'url("assets/images/stories/' + item.id + '.jpg")');
      video.poster = 'assets/images/stories/' + item.id + '.jpg';
      pisteSousTitres.src = 'assets/subtitles/stories/' + item.id + '.vtt';
      if (video.textTracks[0]) video.textTracks[0].mode = sousTitresActifs ? 'showing' : 'disabled';
      video.setAttribute('aria-label', 'Extrait vidéo : ' + item.titre);
      btnPrecedent.disabled = index === 0;
      btnSuivant.setAttribute('aria-label', index === ordre.length - 1 ? 'Terminer les stories' : 'Story suivante');
      btnSuivant.title = btnSuivant.getAttribute('aria-label');
      statut.textContent = 'Chargement de la story ' + (index + 1) + ' sur ' + ordre.length + '…';
      actualiserEtapes(); actualiserCommandes();
      controleur = new AbortController();
      try {
        var reponse = await fetch('assets/videos/stories/' + item.id + '.mp4', { signal: controleur.signal });
        if (!reponse.ok) throw new Error('Extrait indisponible');
        var contenu = await reponse.blob();
        if (!ouvert || numero !== sequence) return;
        /* Une URL blob évite au suivi historique de comptabiliser ces extraits comme des vidéos de cours. */
        adresseObjet = URL.createObjectURL(contenu);
        video.src = adresseObjet;
        if (document.hidden) lectureVoulue = false;
        if (lectureVoulue) lire(numero);
        else { statut.textContent = 'Lecture en pause.'; btnReprendre.textContent = 'Lire l’extrait'; btnReprendre.hidden = false; actualiserCommandes(); }
      } catch (erreur) {
        if (!ouvert || numero !== sequence || erreur.name === 'AbortError') return;
        enErreur = true; lectureVoulue = false;
        statut.textContent = 'Extrait indisponible. Vérifiez la connexion puis réessayez.';
        btnReprendre.textContent = 'Réessayer'; btnReprendre.hidden = false; actualiserCommandes();
      }
    }
    function ouvrir(n, carte) {
      if (ouvert) return;
      ouvert = true; origineFocus = carte; ancienOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden'; document.documentElement.classList.add('sti-stories-open');
      video.muted = true; sousTitresActifs = false;
      afficherEtapes();
      /* Le nom accessible doit être renseigné avant l'ouverture du dialogue. */
      titre.textContent = ordre[n].titre; description.textContent = ordre[n].description;
      try { dialogue.showModal(); } catch (erreur) { nettoyer(); return; }
      btnFermer.focus();
      document.querySelectorAll('video, audio').forEach(function (media) { if (media !== video && !media.paused) media.pause(); });
      afficherExtrait(n);
    }
    function suivant() { if (index + 1 < ordre.length) afficherExtrait(index + 1); else fermer(); }
    function precedent() { if (index > 0) afficherExtrait(index - 1); }
    function basculerLecture() {
      if (enErreur) { afficherExtrait(index); return; }
      lectureVoulue = !lectureVoulue;
      if (!lectureVoulue) { video.pause(); btnReprendre.textContent = 'Reprendre'; btnReprendre.hidden = false; statut.textContent = 'Lecture en pause.'; }
      else if (video.getAttribute('src')) { btnReprendre.hidden = true; lire(sequence); }
      else { btnReprendre.hidden = true; statut.textContent = 'Chargement…'; }
      actualiserCommandes();
    }

    section.querySelector('.stories__shuffle').addEventListener('click', function () {
      ordre = melanger(ordre, true); afficherCartes(); rail.scrollLeft = 0;
    });
    btnFermer.addEventListener('click', fermer);
    btnPrecedent.addEventListener('click', precedent);
    btnSuivant.addEventListener('click', suivant);
    btnPause.addEventListener('click', basculerLecture);
    btnReprendre.addEventListener('click', function () {
      if (enErreur) afficherExtrait(index);
      else if (!lectureVoulue) basculerLecture();
    });
    btnSon.addEventListener('click', function () {
      video.muted = !video.muted; actualiserCommandes();
    });
    btnSousTitres.addEventListener('click', function () {
      sousTitresActifs = !sousTitresActifs;
      if (video.textTracks[0]) video.textTracks[0].mode = sousTitresActifs ? 'showing' : 'disabled';
      actualiserCommandes();
    });
    btnPleinEcran.addEventListener('click', function () {
      try {
        /* En plein écran, les commandes natives restent accessibles sur téléphone. */
        video.controls = true;
        if (video.requestFullscreen) {
          var p = video.requestFullscreen();
          if (p && p.catch) p.catch(function () { video.controls = false; statut.textContent = 'L’agrandissement n’est pas disponible sur cet appareil.'; });
        } else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
      } catch (erreur) { video.controls = false; statut.textContent = 'L’agrandissement n’est pas disponible sur cet appareil.'; }
    });
    document.addEventListener('fullscreenchange', function () { if (document.fullscreenElement !== video) video.controls = false; });
    video.addEventListener('webkitendfullscreen', function () { video.controls = false; });
    dialogue.querySelector('[data-action="complet"]').addEventListener('click', function () {
      var debut = ordre[index].debut;
      fermer();
      if (typeof window.ouvrirVideoPasAPasSTI === 'function') window.ouvrirVideoPasAPasSTI('css3-cours', null, debut);
      else window.location.href = 'cours/css3.html#videos';
    });
    video.addEventListener('playing', function () {
      if (!ouvert) return;
      changementMedia = false;
      if (video.controls && document.fullscreenElement === video) { lectureVoulue = true; actualiserCommandes(); }
      btnReprendre.hidden = true; statut.textContent = 'Story ' + (index + 1) + ' sur ' + ordre.length + ' · lecture en cours.';
    });
    video.addEventListener('pause', function () {
      if (ouvert && !changementMedia && video.controls && document.fullscreenElement === video && !video.ended) {
        lectureVoulue = false; btnReprendre.textContent = 'Reprendre'; btnReprendre.hidden = false;
        statut.textContent = 'Lecture en pause.'; actualiserCommandes();
      }
    });
    video.addEventListener('timeupdate', actualiserEtapes);
    video.addEventListener('loadedmetadata', actualiserEtapes);
    video.addEventListener('ended', function () { if (ouvert) suivant(); });
    video.addEventListener('error', function () {
      if (!ouvert || !video.getAttribute('src')) return;
      enErreur = true; lectureVoulue = false; btnReprendre.textContent = 'Réessayer'; btnReprendre.hidden = false;
      statut.textContent = 'La lecture de cet extrait a échoué. Réessayez ou passez à la story suivante.'; actualiserCommandes();
    });
    dialogue.addEventListener('cancel', function (e) { e.preventDefault(); fermer(); });
    dialogue.addEventListener('close', function () { if (!dialogue.open) nettoyer(); });
    dialogue.addEventListener('click', function (e) { if (e.target === dialogue) fermer(); });
    dialogue.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          e.preventDefault(); e.stopPropagation();
          if (document.exitFullscreen) { var sortie = document.exitFullscreen(); if (sortie && sortie.catch) sortie.catch(function () {}); }
          return;
        }
        e.preventDefault(); e.stopPropagation(); fermer(); return;
      }
      if (document.fullscreenElement) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); suivant(); return; }
      if (e.key === 'ArrowLeft') { e.preventDefault(); precedent(); return; }
      if (e.key !== 'Tab') return;
      var cibles = Array.prototype.filter.call(dialogue.querySelectorAll('button:not([disabled]):not([hidden]), summary, a[href]'), function (el) { return el.getClientRects().length; });
      if (!cibles.length) { e.preventDefault(); return; }
      var premier = cibles[0], dernier = cibles[cibles.length - 1];
      if (e.shiftKey && (document.activeElement === premier || !dialogue.contains(document.activeElement))) { e.preventDefault(); dernier.focus(); }
      else if (!e.shiftKey && (document.activeElement === dernier || !dialogue.contains(document.activeElement))) { e.preventDefault(); premier.focus(); }
    });
    scene.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1 || e.target.closest('button')) { toucher = null; return; }
      toucher = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: true });
    scene.addEventListener('touchend', function (e) {
      if (!toucher || !e.changedTouches.length) return;
      var dx = e.changedTouches[0].clientX - toucher.x, dy = e.changedTouches[0].clientY - toucher.y;
      toucher = null;
      if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.25) { if (dx < 0) suivant(); else precedent(); }
    }, { passive: true });
    document.addEventListener('visibilitychange', function () {
      if (ouvert && document.hidden && lectureVoulue) {
        lectureVoulue = false; video.pause(); btnReprendre.textContent = 'Reprendre'; btnReprendre.hidden = false;
        statut.textContent = 'Lecture en pause.'; actualiserCommandes();
      }
    });
    window.addEventListener('pagehide', fermer);
    afficherCartes(); section.hidden = false;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialiser, { once: true });
  else initialiser();
})();
