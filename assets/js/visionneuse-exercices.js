/* Fenêtre commune pour les énoncés, corrigés et projets locaux.
   La navigation, les scripts et les verrous des documents restent ceux d'origine. */
(function (global, document) {
  'use strict';
  var fond, boite, cadre, titre, retour, etats, ancienOverflow, ancienModal, dernierDeclencheur;
  var documents = new WeakSet(), cadres = new WeakSet(), sequenceEnfant = 0;

  function pdfNonLisible() {
    return navigator.pdfViewerEnabled === false || (typeof navigator.pdfViewerEnabled === 'undefined' &&
      /Safari/.test(navigator.userAgent) && !/(Chrome|Chromium|Edg|OPR|Firefox|CriOS|FxiOS|EdgiOS)/.test(navigator.userAgent));
  }

  /* Certaines ressources ouvrent elles-mêmes un PDF ou un aperçu. Un second
     dialogue garde le document appelant vivant, avec son état et son focus. */
  function ouvrirEnfant(url, libelle, origine) {
    var destination;
    try { destination = new URL(url, origine.ownerDocument.baseURI); } catch (e) { return null; }
    if (destination.origin !== global.location.origin || !/^(https?:|blob:)$/.test(destination.protocol)) return null;
    var couche = document.createElement('div'), identifiant = 'sti-exo-enfant-titre-' + (++sequenceEnfant);
    couche.className = 'sti-exo-fond sti-exo-enfant';
    couche.innerHTML = '<section class="sti-exo-fenetre" role="dialog" aria-modal="true" tabindex="-1">' +
      '<header class="sti-exo-entete"><div><h2></h2><p>Retour au document appelant</p></div>' +
      '<div class="sti-exo-actions"><button type="button" data-enfant-plein aria-pressed="false">⛶ Agrandir</button>' +
      '<button type="button" data-enfant-retour>← Retour</button><button type="button" data-enfant-fermer aria-label="Fermer">✕</button></div></header>' +
      '<p class="sti-exo-avertissement" hidden>Ce navigateur ne peut pas afficher ce PDF ici. <a download>Télécharger le document</a>.</p>' +
      '<iframe class="sti-exo-cadre" title="Document pédagogique" loading="lazy" allow="fullscreen; autoplay; clipboard-write" allowfullscreen></iframe>' +
      '<button type="button" class="sti-exo-poignee" aria-label="Redimensionner avec les flèches ou la souris">↘ Redimensionner</button></section>';
    var fenetre = couche.querySelector('.sti-exo-fenetre'), cadreEnfant = couche.querySelector('iframe');
    var titreEnfant = couche.querySelector('h2'), poignee = couche.querySelector('.sti-exo-poignee');
    titreEnfant.id = identifiant; titreEnfant.textContent = libelle || 'Document pédagogique';
    fenetre.setAttribute('aria-labelledby', identifiant); cadreEnfant.title = titreEnfant.textContent;
    var avertissement = couche.querySelector('.sti-exo-avertissement');
    avertissement.hidden = !(/\.pdf$/i.test(destination.pathname) && pdfNonLisible());
    avertissement.querySelector('a').href = destination.href;
    var anciens = Array.prototype.map.call(document.body.children, function (e) { return [e, e.inert]; });
    anciens.forEach(function (e) { e[0].inert = true; });
    var overflow = document.body.style.overflow, modalDejaOuverte = document.documentElement.classList.contains('sti-modal-open');
    document.body.style.overflow = 'hidden'; document.documentElement.classList.add('sti-modal-open');
    document.body.appendChild(couche);
    var ouverte = true, poigneeFenetre = { closed: false, close: fermerEnfant };
    function fermerEnfant() {
      if (!ouverte) return; ouverte = false; poigneeFenetre.closed = true;
      cadreEnfant.src = 'about:blank'; couche.remove();
      anciens.forEach(function (e) { e[0].inert = e[1]; }); document.body.style.overflow = overflow;
      if (!modalDejaOuverte) document.documentElement.classList.remove('sti-modal-open');
      if (origine && origine.isConnected) origine.focus({preventScroll:true});
    }
    cadreEnfant.addEventListener('load', function () { try { attacherDocument(cadreEnfant.contentDocument, fermerEnfant); } catch (e) {} });
    couche.addEventListener('click', function (e) {
      if (e.target === couche || e.target.closest('[data-enfant-retour],[data-enfant-fermer]')) fermerEnfant();
      else if (e.target.closest('[data-enfant-plein]')) {
        var plein = couche.classList.toggle('est-plein'), bouton = couche.querySelector('[data-enfant-plein]');
        bouton.setAttribute('aria-pressed', String(plein)); bouton.textContent = plein ? '⤡ Réduire' : '⛶ Agrandir';
      }
    });
    couche.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); fermerEnfant(); return; }
      if (e.key !== 'Tab') return;
      var liste = accessibles(fenetre), premier = liste[0], dernier = liste[liste.length - 1];
      if (!liste.length) { e.preventDefault(); fenetre.focus(); }
      else if (e.shiftKey && document.activeElement === premier) { e.preventDefault(); dernier.focus(); }
      else if (!e.shiftKey && document.activeElement === dernier) { e.preventDefault(); premier.focus(); }
    });
    var depart = null;
    function fixer(w, h) {
      fenetre.style.width = Math.max(Math.min(320, innerWidth - 24), Math.min(innerWidth - 24, w)) + 'px';
      fenetre.style.height = Math.max(Math.min(280, innerHeight - 24), Math.min(innerHeight - 24, h)) + 'px';
    }
    poignee.addEventListener('pointerdown', function (e) {
      if (couche.classList.contains('est-plein')) return;
      var r = fenetre.getBoundingClientRect(); depart = {x:e.clientX,y:e.clientY,w:r.width,h:r.height};
      poignee.setPointerCapture(e.pointerId); e.preventDefault();
    });
    poignee.addEventListener('pointermove', function (e) { if (depart) fixer(depart.w + e.clientX - depart.x, depart.h + e.clientY - depart.y); });
    poignee.addEventListener('pointerup', function () { depart = null; });
    poignee.addEventListener('pointercancel', function () { depart = null; });
    poignee.addEventListener('keydown', function (e) {
      if (couche.classList.contains('est-plein') || !/^Arrow/.test(e.key)) return;
      var r = fenetre.getBoundingClientRect(), pas = e.shiftKey ? 60 : 24;
      fixer(r.width + (e.key === 'ArrowRight' ? pas : e.key === 'ArrowLeft' ? -pas : 0),
        r.height + (e.key === 'ArrowDown' ? pas : e.key === 'ArrowUp' ? -pas : 0)); e.preventDefault();
    });
    cadreEnfant.src = destination.href; couche.querySelector('[data-enfant-fermer]').focus();
    return poigneeFenetre;
  }

  function accessibles(racine) {
    return Array.prototype.filter.call(racine.querySelectorAll('a[href],button:not([disabled]),iframe,[tabindex]:not([tabindex="-1"])'), function (e) {
      return !e.closest('[hidden],[inert]') && e.getClientRects().length;
    });
  }
  function creer() {
    if (fond) return;
    fond = document.createElement('div');
    fond.className = 'sti-exo-fond'; fond.hidden = true;
    fond.innerHTML = '<section class="sti-exo-fenetre" role="dialog" aria-modal="true" aria-labelledby="sti-exo-titre" tabindex="-1">' +
      '<header class="sti-exo-entete"><div><h2 id="sti-exo-titre">Exercice</h2><p>Énoncé, corrigé ou projet d’origine</p></div>' +
      '<div class="sti-exo-actions"><button type="button" data-exo-recharger>↻ Recharger</button>' +
      '<button type="button" data-exo-plein aria-pressed="false">⛶ Agrandir</button>' +
      '<button type="button" data-exo-retour>← Retour</button><button type="button" data-exo-fermer aria-label="Fermer">✕</button></div></header>' +
      '<p class="sti-exo-avertissement" hidden>Ce navigateur ne peut pas afficher ce PDF ici. <a download>Télécharger le document</a>.</p>' +
      '<iframe class="sti-exo-cadre" title="Document pédagogique" loading="lazy" allow="fullscreen; autoplay; clipboard-write" allowfullscreen src="about:blank"></iframe>' +
      '<button type="button" class="sti-exo-poignee" aria-label="Redimensionner avec les flèches ou la souris">↘ Redimensionner</button></section>';
    document.body.appendChild(fond);
    boite = fond.querySelector('.sti-exo-fenetre'); cadre = fond.querySelector('iframe'); titre = fond.querySelector('#sti-exo-titre');
    cadre.addEventListener('load', function () { try { attacherDocument(cadre.contentDocument, fermer); } catch (e) {} });
    fond.addEventListener('click', function (e) {
      if (e.target === fond || e.target.closest('[data-exo-retour],[data-exo-fermer]')) fermer();
      else if (e.target.closest('[data-exo-plein]')) basculerPlein();
      else if (e.target.closest('[data-exo-recharger]')) { try { cadre.contentWindow.location.reload(); } catch (err) { cadre.src = cadre.src; } }
    });
    fond.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); fermer(); return; }
      if (e.key !== 'Tab') return;
      var liste = accessibles(boite), premier = liste[0], dernier = liste[liste.length - 1];
      if (!liste.length) { e.preventDefault(); boite.focus(); }
      else if (e.shiftKey && document.activeElement === premier) { e.preventDefault(); dernier.focus(); }
      else if (!e.shiftKey && document.activeElement === dernier) { e.preventDefault(); premier.focus(); }
    });
    var poignee = fond.querySelector('.sti-exo-poignee'), depart = null;
    function fixer(w, h) {
      boite.style.width = Math.max(Math.min(320, innerWidth - 24), Math.min(innerWidth - 24, w)) + 'px';
      boite.style.height = Math.max(Math.min(280, innerHeight - 24), Math.min(innerHeight - 24, h)) + 'px';
    }
    poignee.addEventListener('pointerdown', function (e) {
      if (fond.classList.contains('est-plein')) return;
      var r = boite.getBoundingClientRect(); depart = {x:e.clientX,y:e.clientY,w:r.width,h:r.height};
      poignee.setPointerCapture(e.pointerId); e.preventDefault();
    });
    poignee.addEventListener('pointermove', function (e) { if (depart) fixer(depart.w + e.clientX - depart.x, depart.h + e.clientY - depart.y); });
    poignee.addEventListener('pointerup', function () { depart = null; });
    poignee.addEventListener('pointercancel', function () { depart = null; });
    poignee.addEventListener('keydown', function (e) {
      if (fond.classList.contains('est-plein') || !/^Arrow/.test(e.key)) return;
      var r = boite.getBoundingClientRect(), pas = e.shiftKey ? 60 : 24;
      fixer(r.width + (e.key === 'ArrowRight' ? pas : e.key === 'ArrowLeft' ? -pas : 0),
        r.height + (e.key === 'ArrowDown' ? pas : e.key === 'ArrowUp' ? -pas : 0)); e.preventDefault();
    });
  }
  function basculerPlein() {
    var plein = fond.classList.toggle('est-plein'), b = fond.querySelector('[data-exo-plein]');
    b.setAttribute('aria-pressed', String(plein)); b.textContent = plein ? '⤡ Réduire' : '⛶ Agrandir';
  }
  function ouvrir(url, libelle, origine) {
    var destination;
    try { destination = new URL(url, global.location.href); } catch (e) { return false; }
    if (destination.origin !== global.location.origin || !/^https?:$/.test(destination.protocol)) return false;
    creer(); if (!fond.hidden) fermer(false);
    retour = origine || document.activeElement; dernierDeclencheur = retour;
    titre.textContent = libelle || 'Exercice'; cadre.title = libelle || 'Exercice';
    boite.style.width = ''; boite.style.height = ''; fond.classList.remove('est-plein');
    fond.querySelector('[data-exo-plein]').setAttribute('aria-pressed','false');
    fond.querySelector('[data-exo-plein]').textContent = '⛶ Agrandir';
    var avertissement = fond.querySelector('.sti-exo-avertissement');
    avertissement.hidden = !(/\.pdf$/i.test(destination.pathname) && pdfNonLisible());
    avertissement.querySelector('a').href = destination.href;
    etats = Array.prototype.map.call(document.body.children, function (e) { return [e, e.inert]; });
    etats.forEach(function (e) { if (e[0] !== fond) e[0].inert = true; });
    ancienOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
    ancienModal = document.documentElement.classList.contains('sti-modal-open'); document.documentElement.classList.add('sti-modal-open');
    fond.hidden = false; cadre.src = destination.href;
    fond.querySelector('[data-exo-fermer]').focus(); return true;
  }
  function fermer(rendreFocus) {
    if (!fond || fond.hidden) return;
    fond.hidden = true; cadre.src = 'about:blank';
    etats.forEach(function (e) { e[0].inert = e[1]; }); document.body.style.overflow = ancienOverflow;
    if (!ancienModal) document.documentElement.classList.remove('sti-modal-open');
    if (rendreFocus !== false && retour && retour.isConnected && !retour.closest('[hidden],[inert]')) retour.focus({preventScroll:true});
    retour = null;
  }
  function estRetourVersAppelant(element, doc) {
    if (!element) return false;
    var id = element.id || '';
    if (/^btn-retour-cours/i.test(id)) return true;
    if (!element.matches('a[href]')) return false;
    var cible; try { cible = new URL(element.href, doc.baseURI); } catch (e) { return false; }
    if (cible.origin !== global.location.origin) return false;
    // Les retours internes d'un projet (carte, pages, menus) restent dans l'iframe.
    var sortie = /\/exercices\/series-exercices\.html$/i.test(cible.pathname) ||
      /\/cours\/(?:html5|css3|javascript|sql|php|courshtml5|courscss3|coursphp)\.html$/i.test(cible.pathname) ||
      cible.pathname === global.location.pathname;
    return sortie && /retour|revenir|exercices|cours/i.test((element.textContent || '') + ' ' + (element.title || '') + ' ' + (element.getAttribute('aria-label') || ''));
  }
  function attacherDocument(doc, fermerCourant) {
    if (!doc || !doc.body || documents.has(doc)) return;
    documents.add(doc);
    function clicDocument(e) {
      var el = e.target && e.target.closest && e.target.closest('a[href],button');
      if (!el || e.defaultPrevented || (e.button !== 0 && e.button !== 1)) return;
      if (e.button === 0 && estRetourVersAppelant(el, doc)) {
        e.preventDefault(); e.stopImmediatePropagation(); fermerCourant(); return;
      }
      if (el.matches('a[href]') && el.target === '_blank' && !el.hasAttribute('download')) {
        if (ouvrirEnfant(el.href, el.textContent.trim(), el)) { e.preventDefault(); e.stopImmediatePropagation(); }
        return;
      }
      /* Le corrigé TP2 produit lui-même son aperçu dans un Blob. On exécute
         sa fonction inchangée, en remplaçant seulement l'ouverture de fenêtre
         pendant cet appel synchrone. */
      if (e.button === 0 && el.getAttribute('onclick') === 'ouvrirApercu()' && doc.defaultView && typeof doc.defaultView.ouvrirApercu === 'function') {
        e.preventDefault(); e.stopImmediatePropagation();
        var vue = doc.defaultView, ouvrirOriginal = vue.open;
        vue.open = function (url) { return ouvrirEnfant(url, 'Grand aperçu de l’étape', el) || ouvrirOriginal.apply(vue, arguments); };
        try { vue.ouvrirApercu(); } finally { vue.open = ouvrirOriginal; }
      }
    }
    doc.addEventListener('click', clicDocument, true);
    doc.addEventListener('auxclick', clicDocument, true);
    doc.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || e.defaultPrevented || doc.querySelector('dialog[open],.panneau.ouvert,[role="dialog"][aria-modal="true"]:not([hidden])')) return;
      e.preventDefault(); e.stopPropagation(); fermerCourant();
    }, true);
    function enfant(frame) {
      if (cadres.has(frame)) return; cadres.add(frame);
      function brancher() { try { attacherDocument(frame.contentDocument, fermerCourant); } catch (e) {} }
      frame.addEventListener('load', brancher); brancher();
    }
    Array.prototype.forEach.call(doc.querySelectorAll('iframe'), enfant);
    if (typeof MutationObserver === 'function') {
      new MutationObserver(function (ms) { ms.forEach(function (m) { Array.prototype.forEach.call(m.addedNodes, function (n) {
        if (n.nodeType !== 1) return; if (n.matches('iframe')) enfant(n); Array.prototype.forEach.call(n.querySelectorAll('iframe'), enfant);
      }); }); }).observe(doc.body, {subtree:true, childList:true});
    }
  }
  function intercepterLiens(e) {
    var a = e.target && e.target.closest && e.target.closest('a[href]');
    if (!a || e.defaultPrevented || (e.button !== 0 && e.button !== 1) || a.hasAttribute('download')) return;
    if (a.closest('[hidden],[inert]') || (a.closest('.sti-4si-only') && !document.documentElement.classList.contains('sti-4si-autorise'))) return;
    var url; try { url = new URL(a.href, document.baseURI); } catch (err) { return; }
    if (url.origin !== global.location.origin) return;
    var ressourceExercice = /\/(?:exercices|projets)\//i.test(url.pathname) || /\/documents\/(?:enonces|complet)\//i.test(url.pathname);
    var dansExercices = !!a.closest('[data-course-panel="exercices"]');
    var exercice = ressourceExercice && (dansExercices || a.target === '_blank');
    if (dansExercices && /\/assets\/videos\//i.test(url.pathname) && a.target === '_blank') exercice = true;
    if (!exercice || a.id === 'jsResourceExternal' || a.hasAttribute('data-open-js-resource')) return;
    if (ouvrir(url.href, a.getAttribute('data-preview-title') || a.textContent.trim(), a)) { e.preventDefault(); e.stopImmediatePropagation(); }
  }
  function adapterSeriesHistoriques() {
    var modal = document.getElementById('pdfModal'), frame = document.getElementById('pdfFrame');
    if (!modal || !frame || typeof global.openPdfModal !== 'function' || typeof global.closePdfModal !== 'function') return;
    var ouvrirAncien = global.openPdfModal, fermerAncien = global.closePdfModal, origine = null, etatsSeries = null, modalSeriesDejaOuverte = false;
    document.addEventListener('click', function (e) {
      var bouton = e.target && e.target.closest && e.target.closest('[onclick*="openPdfModal("]');
      if (bouton) dernierDeclencheur = bouton;
    }, true);
    global.openPdfModal = function (url, libelle) {
      origine = dernierDeclencheur || document.activeElement; dernierDeclencheur = null;
      // Pas de nouvel onglet sur mobile si le moteur PDF est absent.
      if (/\.pdf(?:$|[?#])/i.test(String(url)) && pdfNonLisible()) return ouvrir(url, libelle, origine);
      var resultat = ouvrirAncien.apply(this, arguments);
      if (modal.classList.contains('open') && !etatsSeries) {
        etatsSeries = Array.prototype.map.call(document.body.children, function (e) { return [e, e.inert]; });
        etatsSeries.forEach(function (e) { if (e[0] !== modal) e[0].inert = true; });
        modalSeriesDejaOuverte = document.documentElement.classList.contains('sti-modal-open');
        document.documentElement.classList.add('sti-modal-open');
        var fermeture = modal.querySelector('.modal-close'); if (fermeture) fermeture.focus();
      }
      return resultat;
    };
    global.closePdfModal = function () {
      var etaitOuvert = modal.classList.contains('open'), resultat = fermerAncien.apply(this, arguments);
      if (etatsSeries) {
        etatsSeries.forEach(function (e) { e[0].inert = e[1]; }); etatsSeries = null;
        if (!modalSeriesDejaOuverte) document.documentElement.classList.remove('sti-modal-open');
      }
      if (etaitOuvert && origine && origine.isConnected) origine.focus({preventScroll:true});
      origine = null; return resultat;
    };
    modal.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab' || !modal.classList.contains('open')) return;
      var liste = accessibles(modal), premier = liste[0], dernier = liste[liste.length - 1];
      if (!liste.length) { e.preventDefault(); modal.querySelector('.modal-box').focus(); }
      else if (e.shiftKey && document.activeElement === premier) { e.preventDefault(); dernier.focus(); }
      else if (!e.shiftKey && document.activeElement === dernier) { e.preventDefault(); premier.focus(); }
    });
    frame.addEventListener('load', function () { try { attacherDocument(frame.contentDocument, function () { global.closePdfModal(); }); } catch (e) {} });
    var ancienBouton = document.getElementById('modalOpenTabBtn');
    if (ancienBouton) {
      ancienBouton.textContent = '←'; ancienBouton.title = 'Retour à l’appelant'; ancienBouton.setAttribute('aria-label', 'Retour à l’appelant');
      ancienBouton.addEventListener('click', function (e) { e.preventDefault(); e.stopImmediatePropagation(); global.closePdfModal(); }, true);
    }
    var partage = document.getElementById('modalSplitCodeBtn');
    if (partage) {
      partage.setAttribute('aria-label', 'Écran Partagé + Code : énoncé à gauche et éditeur à droite');
      partage.addEventListener('click', function (e) {
        if (typeof global.ouvrirEcranPartageEnonceCodeSTI !== 'function') return;
        e.preventDefault(); e.stopImmediatePropagation();
        // closePdfModal efface modalUrl : la conserver avant de passer au partage.
        var url = global.modalUrl; global.closePdfModal(); global.ouvrirEcranPartageEnonceCodeSTI(url);
      }, true);
    }
  }
  function suivreApercu(frame) {
    if (!frame.matches('iframe.exo-doc-preview__frame, iframe#jsResourceFrame') || cadres.has(frame)) return;
    cadres.add(frame);
    function fermerApercu() {
      var zone = frame.closest('.exo-doc-preview');
      var bouton = zone ? zone.querySelector('[data-close-preview], button') : document.getElementById('jsResourceClose');
      if (bouton) bouton.click();
    }
    function brancher() { try { attacherDocument(frame.contentDocument, fermerApercu); } catch (e) {} }
    frame.addEventListener('load', brancher); brancher();
  }
  function initialiser() {
    document.addEventListener('click', intercepterLiens, true); document.addEventListener('auxclick', intercepterLiens, true);
    adapterSeriesHistoriques();
    Array.prototype.forEach.call(document.querySelectorAll('iframe.exo-doc-preview__frame, iframe#jsResourceFrame'), suivreApercu);
    if (typeof MutationObserver === 'function') new MutationObserver(function (mutations) {
      mutations.forEach(function (m) { Array.prototype.forEach.call(m.addedNodes, function (n) {
        if (n.nodeType !== 1) return; if (n.matches('iframe')) suivreApercu(n);
        Array.prototype.forEach.call(n.querySelectorAll('iframe.exo-doc-preview__frame, iframe#jsResourceFrame'), suivreApercu);
      }); });
    }).observe(document.body, {subtree:true, childList:true});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialiser); else initialiser();
  global.STIVisionneuseExercices = { ouvrir: ouvrir, fermer: fermer };
})(window, document);
