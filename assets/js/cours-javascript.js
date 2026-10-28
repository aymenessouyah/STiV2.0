/* STI V2.0 — Cours JavaScript : navigation, profil, fenêtres et exécution isolée.
   Tous les enregistrements produits ici passent exclusivement par STIProfil. */
(function (global, document) {
  'use strict';
  /* Évite l'ajout d'un second guide vocal flottant ; la barre média historique reste disponible. */
  global.__stiGuideVocalInit = true;

  var MATIERE = 'javascript', VIDEO_ID = 'javascript-cours';
  var CHAPITRES = [
    ['sec1', 'Qu’est-ce que JavaScript ?'], ['sec2', 'Où placer le code'],
    ['sec3', 'Variables : portée et déclaration'], ['sec4', 'Opérateurs'],
    ['sec5', 'Entrées / sorties'], ['sec6', 'Comparatifs'],
    ['sec7', 'Fonctions globales'], ['sec8', 'Math'],
    ['sec9', 'Chaînes de caractères'], ['sec10', 'Tableaux'], ['sec11', 'Objet Date'],
    ['sec12', 'Structures conditionnelles'], ['sec13', 'Boucles'],
    ['sec14', 'Fonctions'], ['sec15', 'Manipulation du DOM']
  ];
  var ONGLETS = ['cours', 'exercices', 'annexes', 'videos'];
  var chapitreActif = 'sec1', ongletActif = 'cours', dernierChapitre = '', candidatLecture = '';
  var scrollCours = 0, scrollConnu = false, restauration = false, minuterieLecture = 0;
  var dialogues = [], historiqueVideo = null, compteurExecution = 0, modalExterneDejaOuverte = false;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var id = function (s) { return document.getElementById(s); };
  var profil = function () { return global.STIProfil ? global.STIProfil.chargerProfil() : null; };
  var echapper = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var visibles = function (zone) { return $$('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,iframe,video[controls],[tabindex]:not([tabindex="-1"])', zone).filter(function (el) { return !el.closest('[hidden],[inert]') && el.getClientRects().length; }); };
  var chapitre = function (nom) { return CHAPITRES.find(function (c) { return c[0] === nom; }); };

  /* ── Onglets, liens historiques et sommaire mobile ── */
  function changerUrl(fragment) {
    if (global.location.hash !== '#' + fragment) global.history.pushState(null, '', '#' + fragment);
  }
  function ouvrirOnglet(nom, historique, garderPosition) {
    var cible = ONGLETS.indexOf(nom) >= 0 ? nom : 'cours', precedent = ongletActif;
    if (precedent === 'cours' && cible !== 'cours') {
      scrollCours = global.scrollY; scrollConnu = true;
      if (minuterieLecture) { global.clearTimeout(minuterieLecture); minuterieLecture = 0; enregistrerLecture(); }
      candidatLecture = '';
    }
    ongletActif = cible;
    $$('[data-course-tab]').forEach(function (b) {
      var actif = b.dataset.courseTab === cible; b.setAttribute('aria-selected', String(actif)); b.tabIndex = actif ? 0 : -1;
    });
    $$('[data-course-panel]').forEach(function (p) {
      p.hidden = p.dataset.coursePanel !== cible;
      if (p.hidden) $$('video[data-js-video]', p).forEach(function (v) { if (!v.paused) v.pause(); });
    });
    if (historique) changerUrl(cible);
    if (cible !== 'cours') {
      fermerSommaire(false);
      if (cible !== precedent) global.requestAnimationFrame(function () { id(cible).scrollIntoView({ behavior: 'instant', block: 'start' }); });
    }
    if (cible === 'cours' && precedent !== 'cours' && scrollConnu && garderPosition !== false) {
      restauration = true;
      global.requestAnimationFrame(function () { global.scrollTo({ top: scrollCours, behavior: 'instant' }); global.requestAnimationFrame(function () { restauration = false; }); });
    }
  }
  function allerChapitre(nom, historique, cible) {
    var c = chapitre(nom), section = id(nom); if (!c || !section) return;
    if (minuterieLecture) { global.clearTimeout(minuterieLecture); minuterieLecture = 0; }
    candidatLecture = '';
    if (section.hidden) { id('courseSearchInput').value = ''; filtrerCours(); }
    chapitreActif = nom; ouvrirOnglet('cours', false, false); fermerSommaire(false);
    if (historique) changerUrl(cible && cible.id ? cible.id : nom);
    enregistrerLecture();
    actualiserProgression();
    global.requestAnimationFrame(function () { (cible || section).scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  }
  function ouvrirFonction(cible) {
    var panel = cible && cible.closest('.fn-panel');
    if (!panel) return;
    var groupe = panel.closest('.fn-group'), bouton = groupe && $('[aria-controls="' + panel.id + '"]', groupe);
    if (bouton && bouton.getAttribute('aria-expanded') !== 'true') basculerFonction(bouton);
  }
  function appliquerFragment() {
    var fragment; try { fragment = decodeURIComponent(global.location.hash.slice(1)); } catch (e) { fragment = global.location.hash.slice(1); }
    if (fragment === 'sec16') { ouvrirOnglet('exercices', false); return; }
    if (ONGLETS.indexOf(fragment) >= 0) { ouvrirOnglet(fragment, false); return; }
    if (fragment === 'top') { ouvrirOnglet('cours', false, false); global.scrollTo({ top: 0, behavior: 'instant' }); return; }
    var el = fragment && id(fragment), section = el && el.closest('[data-chapter-id]');
    if (section) { ouvrirFonction(el); allerChapitre(section.dataset.chapterId, false, el); return; }
    if (el && el.closest('#exercices')) {
      ouvrirOnglet('exercices', false); global.requestAnimationFrame(function () { el.scrollIntoView({ behavior: 'instant', block: 'start' }); });
    }
  }
  function filtrerCours() {
    var texte = id('courseSearchInput').value.trim().toLocaleLowerCase('fr');
    CHAPITRES.forEach(function (c) {
      var section = id(c[0]), lien = $('.toc-link[href="#' + c[0] + '"]');
      var montrer = !texte || section.textContent.toLocaleLowerCase('fr').indexOf(texte) !== -1;
      section.hidden = !montrer; if (lien) lien.hidden = !montrer;
    });
  }
  function fermerSommaire(rendreFocus) {
    var aside = id('courseSidebar'), fond = id('courseSidebarBackdrop'), bouton = id('tocMobileOpenBtn');
    var etaitOuvert = aside.classList.contains('is-open');
    aside.classList.remove('is-open'); fond.classList.remove('is-open'); bouton.setAttribute('aria-expanded', 'false');
    if (global.matchMedia('(max-width: 979px)').matches) { aside.inert = true; aside.setAttribute('aria-hidden', 'true'); }
    else { aside.inert = false; aside.removeAttribute('aria-hidden'); }
    if (etaitOuvert && rendreFocus) bouton.focus();
  }
  function ouvrirSommaire() {
    if (!global.matchMedia('(max-width: 979px)').matches) return;
    if (ongletActif !== 'cours') ouvrirOnglet('cours', true, false);
    var aside = id('courseSidebar'); aside.inert = false; aside.removeAttribute('aria-hidden'); aside.classList.add('is-open');
    id('courseSidebarBackdrop').classList.add('is-open'); id('tocMobileOpenBtn').setAttribute('aria-expanded', 'true'); id('tocMobileCloseBtn').focus();
  }
  function actualiserProgression() {
    var p = profil(), etats = p && p.chapitres ? p.chapitres.javascript || {} : {}, consultes = 0, revises = 0;
    CHAPITRES.forEach(function (c) {
      var revise = etats[c[0]] === 'revise'; if (revise) revises++;
      if (revise || etats[c[0]] === 'en_cours') consultes++;
      var etat = revise ? 'revise' : (etats[c[0]] === 'en_cours' || chapitreActif === c[0] ? 'en_cours' : 'a_reviser');
      var lien = $('.toc-link[href="#' + c[0] + '"]'), bouton = $('[data-toggle-revise="' + c[0] + '"]');
      if (lien) {
        lien.dataset.state = etat; lien.classList.toggle('is-active', chapitreActif === c[0]);
        if (chapitreActif === c[0]) lien.setAttribute('aria-current', 'location'); else lien.removeAttribute('aria-current');
        $('.toc-link__status', lien).textContent = revise ? '✓ Révisé' : etat === 'en_cours' ? 'En cours' : 'À réviser';
      }
      id(c[0]).classList.toggle('is-revised', revise);
      if (bouton) { bouton.setAttribute('aria-pressed', String(revise)); bouton.textContent = revise ? '✓ Chapitre révisé' : '☐ Marquer comme révisé'; }
    });
    var pct = Math.round(consultes / CHAPITRES.length * 100), longueur = 2 * Math.PI * 26;
    id('courseRingFill').style.strokeDasharray = String(longueur); id('courseRingFill').style.strokeDashoffset = String(longueur * (1 - pct / 100));
    id('courseRingPct').textContent = pct + '%';
    id('courseRingCount').textContent = consultes + ' / ' + CHAPITRES.length + ' chapitres consultés';
    var compteurRevisions = id('courseRevisedCount');
    if (compteurRevisions) compteurRevisions.textContent = revises + ' / ' + CHAPITRES.length + ' chapitres révisés';
    id('tocMobileCount').textContent = consultes + '/' + CHAPITRES.length;
    id('tocMobileCount').setAttribute('aria-label', consultes + ' sur ' + CHAPITRES.length + ' chapitres consultés');
    var index = CHAPITRES.findIndex(function (c) { return c[0] === chapitreActif; });
    [['prevChapterBtn', index - 1], ['nextChapterBtn', index + 1]].forEach(function (pair) {
      var b = id(pair[0]), voisin = CHAPITRES[pair[1]]; b.hidden = !voisin;
      if (voisin) { b.href = '#' + voisin[0]; $('.chapter-nav-btn__label', b).textContent = (pair[0] === 'prevChapterBtn' ? '← ' : '') + (pair[1] + 1) + '. ' + voisin[1] + (pair[0] === 'nextChapterBtn' ? ' →' : ''); }
    });
  }
  function enregistrerLecture() {
    var c = chapitre(chapitreActif), section = id(chapitreActif);
    if (!global.STIProfil || !c || ongletActif !== 'cours' || section.hidden) return;
    var index = CHAPITRES.indexOf(c), r = section.getBoundingClientRect();
    var part = Math.max(0, Math.min(1, (155 - r.top) / Math.max(1, r.height)));
    global.STIProfil.enregistrerLecture(MATIERE, c[0], 'JavaScript — ' + (index + 1) + '. ' + c[1], Math.round((index + part) / CHAPITRES.length * 100), 'cours/javascript.html#' + c[0]);
    dernierChapitre = c[0];
  }
  function mettreAJourLecture() {
    var haut = global.scrollY || 0, max = document.documentElement.scrollHeight - global.innerHeight;
    id('readingProgressBar').style.transform = 'scaleX(' + (max > 0 ? Math.min(1, haut / max) : 0) + ')';
    id('back-to-top').classList.toggle('is-visible', haut > 300);
    if (ongletActif !== 'cours' || restauration) return;
    var repere = Math.min(global.innerHeight - 1, Math.max(220, global.innerHeight * 0.42)), courant = null;
    CHAPITRES.forEach(function (c) {
      var el = id(c[0]); if (el.hidden) return;
      var rect = el.getBoundingClientRect(); if (rect.top <= repere && rect.bottom > repere) courant = c[0];
    });
    if (courant !== candidatLecture) {
      if (minuterieLecture) global.clearTimeout(minuterieLecture);
      minuterieLecture = 0; candidatLecture = courant;
    }
    if (!courant) return;
    if (courant !== chapitreActif) { chapitreActif = courant; actualiserProgression(); }
    if (courant !== dernierChapitre && !minuterieLecture) minuterieLecture = global.setTimeout(function () { minuterieLecture = 0; if (candidatLecture === courant) enregistrerLecture(); }, 500);
  }
  function actualiserExercices() {
    var p = profil(), faits = p && p.exercicesFaits ? p.exercicesFaits.javascript || [] : [];
    var total = $$('[data-exo-check]').length, nombre = 0;
    $$('[data-exo-check]').forEach(function (c) {
      c.checked = faits.indexOf(c.dataset.exoCheck) !== -1; if (c.checked) nombre++;
      var article = c.closest('[data-exercise]'); if (article) article.classList.toggle('is-done', c.checked);
    });
    id('exoProgressText').textContent = nombre + ' / ' + total + ' exercices faits';
    id('tabExoCount').textContent = nombre + '/' + total; id('tocExoCount').textContent = nombre + '/' + total;
    id('exoProgressFill').style.width = (total ? nombre / total * 100 : 0) + '%';
  }
  function basculerFonction(bouton) {
    var groupe = bouton.closest('.fn-group'), ouvert = bouton.getAttribute('aria-expanded') === 'true';
    $$('.fnbtn', groupe).forEach(function (b) {
      var actif = b === bouton && !ouvert, panel = id(b.getAttribute('aria-controls'));
      b.setAttribute('aria-expanded', String(actif)); if (panel) panel.hidden = !actif;
    });
  }

  /* ── Code d'origine : coloration simple native, numéros de ligne et copie ── */
  function colorer(texte, html) {
    var regex = html ? /(<\/?[a-zA-Z][^>]*>|<!--[\s\S]*?-->)/g : /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`|\b(?:let|const|var|function|return|if|else|switch|case|default|break|continue|for|while|do|of|new|true|false|null|undefined)\b|\b\d+(?:\.\d+)?\b)/g;
    var resultat = '', position = 0, m;
    while ((m = regex.exec(texte))) {
      resultat += echapper(texte.slice(position, m.index));
      var token = m[0], classe = html ? 'tok-tag' : (/^\/[/\*]/.test(token) ? 'tok-comment' : /^['"`]/.test(token) ? 'tok-val' : /^\d/.test(token) ? 'tok-attr' : 'tok-kw');
      resultat += '<span class="' + classe + '">' + echapper(token) + '</span>'; position = m.index + token.length;
    }
    return resultat + echapper(texte.slice(position));
  }
  function preparerCode() {
    var date = id('date-demo');
    if (date) { var d = new Date(); date.textContent = 'let d = new Date();\nd.toString(); // ' + d.toString(); }
    $$('.js-source pre:not([data-run-output]), .js-exercise__solution pre').forEach(function (pre) {
      var texte = pre.textContent.replace(/^\n+/, '').replace(/\s+$/, ''), html = /^\s*</.test(texte);
      var bloc = document.createElement('div'), barre = document.createElement('div'), meta = document.createElement('span'), btn = document.createElement('button');
      bloc.className = 'code-box'; barre.className = 'code-box__bar'; meta.className = 'code-box__meta';
      meta.textContent = (html ? 'index.html · HTML' : 'script.js · JavaScript') + '  ·  🧩 Syntaxe';
      btn.type = 'button'; btn.className = 'code-box__btn'; btn.setAttribute('data-copy-code', ''); btn.textContent = 'Copier';
      barre.appendChild(meta); barre.appendChild(btn); pre.parentNode.insertBefore(bloc, pre); bloc.appendChild(barre); bloc.appendChild(pre);
      pre.__codeSource = texte; pre.tabIndex = 0; pre.setAttribute('aria-label', 'Extrait de code défilable');
      var code = document.createElement('code'); code.className = 'code-lines';
      code.innerHTML = texte.split('\n').map(function (ligne, i) { return '<span class="code-line"><span class="code-ln" aria-hidden="true">' + (i + 1) + '</span><span class="code-lc">' + (colorer(ligne, html) || ' ') + '</span></span>'; }).join('');
      pre.textContent = ''; pre.appendChild(code);
    });
  }
  function copierCode(bouton) {
    var pre = $('pre', bouton.closest('.code-box')), texte = pre && pre.__codeSource || '';
    function confirme() { bouton.textContent = '✓ Copié'; global.setTimeout(function () { bouton.textContent = 'Copier'; }, 1800); }
    function secours() { var t = document.createElement('textarea'); t.value = texte; t.setAttribute('aria-hidden', 'true'); t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select(); try { if (!document.execCommand('copy')) throw new Error('Copie indisponible'); confirme(); } catch (e) { bouton.textContent = 'Copie impossible'; } t.remove(); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(texte).then(confirme).catch(secours); else secours();
  }

  /* ── Éditeur : le code est transmis à une iframe à origine opaque.
     Aucune donnée du profil n'est accessible à cette iframe. ── */
  function environnementIsole() {
    window.addEventListener('message', function (ev) {
      if (ev.source !== parent || !ev.data || ev.data.type !== 'STI_EXECUTER_JS') return;
      var req = ev.data, lignes = Array.isArray(req.reponses) ? req.reponses.slice() : [], compteur = 0;
      function texte(v) {
        try { if (typeof v === 'string') return v; if (v instanceof Error) return v.name + ': ' + v.message; var j = JSON.stringify(v); return j === undefined ? String(v) : j; } catch (e) { return String(v); }
      }
      function envoyer(type, args) {
        if (++compteur > 250) return;
        parent.postMessage({ type: 'STI_SORTIE_JS', jeton: req.jeton, genre: type, texte: Array.prototype.map.call(args, texte).join(' ').slice(0, 4000) }, '*');
      }
      ['log', 'info', 'warn', 'error', 'debug'].forEach(function (k) { console[k] = function () { envoyer(k, arguments); }; });
      window.alert = function (v) { envoyer('alert', [v]); };
      window.prompt = function (question, defaut) { var valeur = lignes.length ? lignes.shift() : (defaut === undefined ? null : String(defaut)); envoyer('prompt', [question, '→', valeur === null ? '(annulé)' : valeur]); return valeur; };
      window.confirm = function (question) { var valeur = lignes.length ? lignes.shift() : ''; var reponse = /^(oui|o|true|1|yes)$/i.test(String(valeur)); envoyer('confirm', [question, '→', reponse]); return reponse; };
      window.addEventListener('error', function (e) { envoyer('error', [e.message]); });
      window.addEventListener('unhandledrejection', function (e) { envoyer('error', [e.reason]); });
      document.body.innerHTML = String(req.html || '');
      /* Un script créé dans la seule iframe sandbox exécute le code sans eval
         ni modification de la politique de sécurité de la page parente. */
      try { var script = document.createElement('script'); script.textContent = String(req.code || ''); document.body.appendChild(script); envoyer('fin', []); }
      catch (erreur) { envoyer('error', [erreur]); }
    }, { once: true });
  }
  var DOCUMENT_ISOLE = '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; connect-src \'none\'; img-src \'none\'; frame-src \'none\'; form-action \'none\'; object-src \'none\'; base-uri \'none\'"><style>body{font:14px/1.5 system-ui,sans-serif;margin:12px;color-scheme:light dark}</style><script>(' + environnementIsole.toString() + ')();<\/script></head><body></body></html>';
  function executer(zone) {
    var code = $('[data-run-code]', zone).value, html = $('[data-run-html]', zone).value;
    var reponses = $('[data-run-answers]', zone).value.split(/\r?\n/), sortie = $('[data-run-output]', zone), frame = $('[data-run-frame]', zone);
    if (reponses.length === 1 && reponses[0] === '') reponses = [];
    var jeton = 'js-' + Date.now() + '-' + (++compteurExecution); frame.__jeton = jeton;
    sortie.textContent = ''; frame.hidden = false;
    frame.onload = function () { if (frame.__jeton === jeton && frame.contentWindow) frame.contentWindow.postMessage({ type: 'STI_EXECUTER_JS', jeton: jeton, code: code, html: html, reponses: reponses }, '*'); };
    frame.srcdoc = DOCUMENT_ISOLE;
    if (global.STIProfil) global.STIProfil.enregistrerLaboratoire(MATIERE, 'editeur-javascript');
  }
  function reinitialiser(zone) {
    $('[data-run-code]', zone).value = $('[data-run-code]', zone).defaultValue;
    $('[data-run-answers]', zone).value = ''; $('[data-run-html]', zone).value = '';
    $('[data-run-output]', zone).textContent = 'Prêt à exécuter.';
    var frame = $('[data-run-frame]', zone); frame.__jeton = ''; frame.onload = null; frame.removeAttribute('srcdoc'); frame.hidden = true;
  }
  function recevoirConsole(ev) {
    var message = ev.data; if (!message || message.type !== 'STI_SORTIE_JS' || ev.origin !== 'null') return;
    var frame = $$('[data-run-frame]').find(function (f) { return f.contentWindow === ev.source && f.__jeton === message.jeton; });
    if (!frame) return;
    var sortie = $('[data-run-output]', frame.closest('[data-playground]'));
    if (message.genre === 'fin') { if (!sortie.textContent) sortie.textContent = 'Exécution terminée.'; return; }
    var prefixe = message.genre === 'error' ? 'Erreur : ' : message.genre === 'warn' ? 'Attention : ' : message.genre === 'resultat' ? '→ ' : message.genre === 'prompt' ? 'Saisie : ' : message.genre === 'alert' ? 'Alerte : ' : '';
    sortie.textContent += (sortie.textContent ? '\n' : '') + prefixe + String(message.texte || '').slice(0, 4000);
    sortie.scrollTop = sortie.scrollHeight;
  }

  /* ── Boîtes de dialogue empilables : focus, arrière-plan inerte et Échap ── */
  function ouvrirDialogue(overlay, focus, origine) {
    if (dialogues.some(function (d) { return d.overlay === overlay; })) return;
    if (!dialogues.length) {
      modalExterneDejaOuverte = document.documentElement.classList.contains('sti-modal-open');
      document.documentElement.classList.add('sti-modal-open');
    }
    var etats = Array.prototype.map.call(document.body.children, function (el) { return { el: el, inert: el.inert }; });
    var entree = { overlay: overlay, retour: origine || document.activeElement, inert: etats, overflow: document.body.style.overflow };
    etats.forEach(function (e) { e.el.inert = e.el !== overlay; });
    overlay.hidden = false; document.body.style.overflow = 'hidden'; dialogues.push(entree);
    global.requestAnimationFrame(function () { if (focus) focus.focus(); });
  }
  function fermerDialogue(overlay) {
    var entree = dialogues[dialogues.length - 1]; if (!entree || entree.overlay !== overlay) return;
    dialogues.pop(); overlay.hidden = true; entree.inert.forEach(function (e) { e.el.inert = e.inert; });
    document.body.style.overflow = entree.overflow;
    if (!dialogues.length && !modalExterneDejaOuverte) document.documentElement.classList.remove('sti-modal-open');
    if (entree.retour && entree.retour.isConnected && typeof entree.retour.focus === 'function') entree.retour.focus();
  }
  function ouvrirRecap() {
    if (global.STIProfil) global.STIProfil.enregistrerLaboratoire(MATIERE, 'recap-javascript');
    var overlay = id('jsRecapModal');
    var mobile = global.matchMedia('(max-width: 700px)').matches;
    overlay.classList.toggle('modal-maximized', mobile); id('jsRecapFull').setAttribute('aria-pressed', String(mobile)); id('jsRecapFull').textContent = mobile ? '⤡ Réduire' : '⛶ Plein écran';
    ouvrirDialogue(overlay, id('jsRecapClose'));
  }
  function fermerRecap() { fermerDialogue(id('jsRecapModal')); }
  function basculerTaille() {
    var overlay = id('jsRecapModal'), plein = overlay.classList.toggle('modal-maximized');
    id('jsRecapFull').setAttribute('aria-pressed', String(plein)); id('jsRecapFull').textContent = plein ? '⤡ Réduire' : '⛶ Plein écran';
  }
  function redimensionner(box, largeur, hauteur) {
    box.style.width = Math.max(Math.min(360, global.innerWidth - 24), Math.min(global.innerWidth - 24, largeur)) + 'px';
    box.style.height = Math.max(Math.min(280, global.innerHeight - 24), Math.min(global.innerHeight - 24, hauteur)) + 'px';
  }
  function initialiserPoignee(overlay, box, handle) {
    var depart = null;
    handle.addEventListener('pointerdown', function (ev) {
      if (overlay.classList.contains('modal-maximized')) return;
      var rect = box.getBoundingClientRect(); depart = { x: ev.clientX, y: ev.clientY, w: rect.width, h: rect.height };
      handle.setPointerCapture(ev.pointerId); ev.preventDefault();
    });
    handle.addEventListener('pointermove', function (ev) { if (depart) redimensionner(box, depart.w + ev.clientX - depart.x, depart.h + ev.clientY - depart.y); });
    handle.addEventListener('pointerup', function () { depart = null; }); handle.addEventListener('pointercancel', function () { depart = null; });
    handle.addEventListener('keydown', function (ev) {
      if (overlay.classList.contains('modal-maximized') || !/^Arrow/.test(ev.key)) return;
      var r = box.getBoundingClientRect(), d = ev.shiftKey ? 64 : 24;
      redimensionner(box, r.width + (ev.key === 'ArrowRight' ? d : ev.key === 'ArrowLeft' ? -d : 0), r.height + (ev.key === 'ArrowDown' ? d : ev.key === 'ArrowUp' ? -d : 0)); ev.preventDefault();
    });
  }
  /* ── Séries, défis et projets : afficher les pages existantes dans le cours.
     Les liens restent de vrais href utilisables si JavaScript est indisponible. ── */
  var sequenceRessource = 0, minuterieRessource = 0, documentsRessource = new WeakSet();
  function gererNavigationRessource(frame) {
    try { attacherDocumentRessource(frame.contentDocument); } catch (e) { /* Autre origine. */ }
  }
  function attacherDocumentRessource(doc) {
    if (!doc || !doc.body || documentsRessource.has(doc)) return;
    documentsRessource.add(doc);
    try {
      /* Ne pas superposer la navigation et les pastilles globales à la visionneuse. */
      doc.documentElement.classList.add('sti-resource-embedded');
      var style = doc.createElement('style');
      style.textContent = 'html.sti-resource-embedded #sti-bnav,html.sti-resource-embedded #sti-bnav-skel,html.sti-resource-embedded #sti-bnav-sheet,html.sti-resource-embedded #sti-bnav-voile,html.sti-resource-embedded #sti-sync-pastille{display:none!important}';
      (doc.head || doc.documentElement).appendChild(style);
      doc.addEventListener('click', function (ev) {
        var cible = ev.target && ev.target.closest ? ev.target.closest('a[href]') : null;
        if (!cible || ev.defaultPrevented || ev.button !== 0 || ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.altKey) return;
        var url = new URL(cible.href, doc.baseURI);
        if (url.origin !== global.location.origin) return;
        var retourSeries = /\/exercices\/series-exercices\.html$/i.test(url.pathname) && url.hash === '#javascript';
        var retourCours = /\/cours\/javascript\.html$/i.test(url.pathname);
        var quiz = /\/quiz\/javascript\.html$/i.test(url.pathname);
        if (!retourSeries && !retourCours && !quiz) return;
        ev.preventDefault(); fermerRessource();
        if (quiz) { global.location.assign(url.href); return; }
        // Fermer sans changer d'onglet, de fragment ni de défilement :
        // le focus revient à l'élément qui a ouvert exactement cette ressource.
      }, true);
      doc.addEventListener('keydown', function (ev) {
        if (ev.key !== 'Escape' || ev.defaultPrevented || doc.querySelector('dialog[open], .panneau.ouvert, [role="dialog"][aria-modal="true"]:not([hidden])')) return;
        ev.preventDefault(); fermerRessource();
      }, true);
      /* Certains projets contiennent eux-mêmes une iframe, rechargée par leur menu. */
      $$('iframe', doc).forEach(function (enfant) {
        function attacherEnfant() { try { attacherDocumentRessource(enfant.contentDocument); } catch (e) {} }
        enfant.addEventListener('load', attacherEnfant); attacherEnfant();
      });
    } catch (e) { /* Un document d'une autre origine garde sa navigation propre. */ }
  }
  function chargerRessource(url) {
    var frame = id('jsResourceFrame'), status = id('jsResourceStatus'), seq = ++sequenceRessource, documentAbsent = false;
    global.clearTimeout(minuterieRessource); status.hidden = false; status.textContent = 'Chargement de la ressource…';
    frame.onload = function () {
      if (seq !== sequenceRessource || id('jsResourceModal').hidden) return;
      try { if (frame.contentWindow.location.href === 'about:blank') return; } catch (e) {}
      global.clearTimeout(minuterieRessource); if (!documentAbsent) status.hidden = true; gererNavigationRessource(frame);
    };
    frame.src = url;
    minuterieRessource = global.setTimeout(function () {
      if (seq === sequenceRessource && !id('jsResourceModal').hidden) {
        status.hidden = false; status.textContent = 'Le chargement prend du temps. Réessayez ou revenez à la ressource.';
      }
    }, 12000);
    /* HEAD ne télécharge pas le contenu et permet de signaler un document absent. */
    if (global.fetch && /^https?:/i.test(url)) global.fetch(url, { method: 'HEAD', credentials: 'same-origin' }).then(function (reponse) {
      if (seq === sequenceRessource && !id('jsResourceModal').hidden && (reponse.status === 404 || reponse.status === 410)) {
        documentAbsent = true; global.clearTimeout(minuterieRessource); status.hidden = false; status.textContent = 'Document introuvable. Revenez à la liste ou réessayez.';
      }
    }).catch(function () { /* Le document reste accessible par son lien direct. */ });
  }
  function ouvrirRessource(lien) {
    var url; try { url = new URL(lien.href, global.location.href); } catch (e) { return false; }
    if (url.origin !== global.location.origin || !/^(https?:|file:)$/.test(url.protocol)) return false;
    var carte = lien.closest('.js-series-card'), titre = carte && $('h3', carte);
    var libelle = (lien.dataset.resourceType || 'Ressource') + ' — ' + (titre ? titre.textContent.replace(/\s+/g, ' ').trim() : 'JavaScript');
    var overlay = id('jsResourceModal'), mobile = global.matchMedia('(max-width: 700px)').matches;
    id('jsResourceTitle').textContent = libelle; id('jsResourceFrame').title = libelle; id('jsResourceExternal').href = url.href;
    id('jsResourceSplit').hidden = typeof global.ouvrirEcranPartageEnonceCodeSTI !== 'function';
    var notice = id('jsResourceNotice'), projetFleurs = /\/projets\/fleurs\/index\.html$/i.test(url.pathname);
    var projetFormulaire = /\/projets\/formulaire-inscription\/cvFleurs\.html$/i.test(url.pathname);
    var projetCarte = /\/projets\/carte-bancaire\/cb\.html$/i.test(url.pathname);
    notice.hidden = !projetFleurs && !projetFormulaire && !projetCarte;
    notice.textContent = projetFleurs ? 'L’aperçu JavaScript est interactif. Les pages PHP du projet sont des fichiers à compléter et nécessitent un serveur PHP.' :
      projetFormulaire ? 'Ce formulaire est une démonstration interactive : aucun envoi réel n’est effectué.' :
      projetCarte ? 'Démonstration : utilisez des données fictives. Aucun paiement ni envoi réel n’est effectué.' : '';
    overlay.classList.toggle('modal-maximized', mobile); id('jsResourceFull').setAttribute('aria-pressed', String(mobile)); id('jsResourceFull').textContent = mobile ? '⤡ Réduire' : '⛶ Plein écran';
    ouvrirDialogue(overlay, id('jsResourceClose'), lien); chargerRessource(url.href); return true;
  }
  function fermerRessource() {
    var overlay = id('jsResourceModal'), haut = dialogues[dialogues.length - 1];
    if (!haut || haut.overlay !== overlay) return;
    sequenceRessource++; global.clearTimeout(minuterieRessource);
    var frame = id('jsResourceFrame'); frame.onload = null; frame.src = 'about:blank';
    fermerDialogue(overlay);
  }
  function basculerTailleRessource() {
    var plein = id('jsResourceModal').classList.toggle('modal-maximized'), bouton = id('jsResourceFull');
    bouton.setAttribute('aria-pressed', String(plein)); bouton.textContent = plein ? '⤡ Réduire' : '⛶ Plein écran';
  }
  function rechargerRessource() {
    var url = id('jsResourceExternal').href;
    try { var courante = new URL(id('jsResourceFrame').contentWindow.location.href); if (courante.origin === global.location.origin && courante.protocol !== 'about:') url = courante.href; } catch (e) {}
    chargerRessource(url);
  }
  function gererClavier(ev) {
    if (dialogues.length) {
      var d = dialogues[dialogues.length - 1];
      if (ev.key === 'Escape') {
        ev.preventDefault();
        if (d.overlay.id === 'jsVideoModal') fermerVideo();
        else if (d.overlay.id === 'jsResourceModal') fermerRessource();
        else fermerRecap();
        return;
      }
      if (ev.key === 'Tab') {
        var f = visibles(d.overlay), premier = f[0], dernier = f[f.length - 1];
        if (!f.length) { ev.preventDefault(); return; }
        if (ev.shiftKey && (document.activeElement === premier || !d.overlay.contains(document.activeElement))) { ev.preventDefault(); dernier.focus(); }
        else if (!ev.shiftKey && (document.activeElement === dernier || !d.overlay.contains(document.activeElement))) { ev.preventDefault(); premier.focus(); }
      }
      return;
    }
    if (ev.key === 'Escape' && id('courseSidebar').classList.contains('is-open')) fermerSommaire(true);
    var tab = ev.target.closest && ev.target.closest('[role="tab"][data-course-tab]');
    if (tab && (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight' || ev.key === 'Home' || ev.key === 'End')) {
      var tabs = $$('[role="tab"][data-course-tab]'), n = tabs.indexOf(tab), direction = document.documentElement.dir === 'rtl' ? -1 : 1;
      n = ev.key === 'Home' ? 0 : ev.key === 'End' ? tabs.length - 1 : (n + (ev.key === 'ArrowRight' ? direction : -direction) + tabs.length) % tabs.length;
      tabs[n].focus(); ouvrirOnglet(tabs[n].dataset.courseTab, true); ev.preventDefault();
    }
  }

  /* ── Vidéo : lecteurs synchronisés par l'identifiant du catalogue existant ── */
  function positionVideo() { var p = profil(); return p && p.videos && p.videos.positions ? Number(p.videos.positions[VIDEO_ID]) || 0 : 0; }
  function actualiserVideos() {
    var p = profil(), pos = positionVideo(), vue = !!(p && p.videos && p.videos.vues.indexOf(VIDEO_ID) >= 0);
    $$('[data-resume-video]').forEach(function (b) { b.hidden = pos <= 2; b.textContent = '⏯ Reprendre la vidéo à ' + Math.floor(pos / 60) + ':' + String(Math.floor(pos % 60)).padStart(2, '0'); });
    $$('[data-video-badge]').forEach(function (b) { b.textContent = vue ? '✓ Vidéo vue' : '🎥 JavaScript'; });
  }
  function enregistrerVideo(video, terminee) {
    if (!global.STIProfil) return;
    global.STIProfil.enregistrerPositionVideo({ id: VIDEO_ID, matiere: MATIERE, titre: 'Récapitulatif JavaScript', temps: video.currentTime || 0, duree: Number.isFinite(video.duration) ? video.duration : 0, url: 'cours/javascript.html#videos', terminee: !!terminee });
  }
  function pleinEcran(video) { if (video && video.requestFullscreen) { var p = video.requestFullscreen(); if (p && p.catch) p.catch(function () {}); } }
  function reprendre(video, temps) {
    if (!video) return;
    var pos = Number(temps) || 0;
    try { video.currentTime = pos; } catch (e) { video.addEventListener('loadedmetadata', function () { try { video.currentTime = pos; } catch (ignore) {} }, { once: true }); }
    var p = video.play(); if (p && p.catch) p.catch(function () {});
  }
  function ouvrirVideo(identifiant, titre, debut) {
    // Préserver la signature historique sans remplacer le lecteur d'origine.
    if (typeof global.ouvrirVideoPasAPasSTI === 'function') return global.ouvrirVideoPasAPasSTI(identifiant || VIDEO_ID, titre, debut);
  }
  function fermerVideo() { var v = id('modalJsVideo'); if (!v.paused) v.pause(); fermerDialogue(id('jsVideoModal')); }
  function initialiserVideos() {
    var videos = $$('video[data-js-video]');
    videos.forEach(function (v) {
      v.addEventListener('play', function () {
        videos.forEach(function (autre) { if (autre !== v && !autre.paused) autre.pause(); });
        if (typeof global.arreterVoixCoursSTI === 'function') global.arreterVoixCoursSTI();
      });
      v.addEventListener('timeupdate', function () { if (Date.now() - (v.__dernierEnregistrement || 0) > 4000 && v.currentTime > 2) { v.__dernierEnregistrement = Date.now(); enregistrerVideo(v, false); } });
      v.addEventListener('pause', function () { if (v.currentTime > 2 && !v.ended) enregistrerVideo(v, false); });
      v.addEventListener('ended', function () { enregistrerVideo(v, true); });
    });
    // Le lecteur historique commun conserve sa signature et toutes ses commandes.
    actualiserVideos();
  }

  function initialiser() {
    /* La barre audio/vidéo fournie par le script de protection est conservée. */
    var barre = id('sti-cours-media-bar'); if (barre && id('jsMediaBarMount')) id('jsMediaBarMount').appendChild(barre);
    preparerCode();
    initialiserPoignee(id('jsRecapModal'), id('jsRecapBox'), id('jsRecapResize'));
    initialiserPoignee(id('jsResourceModal'), id('jsResourceBox'), id('jsResourceResize'));
    initialiserVideos(); fermerSommaire(false); actualiserProgression(); actualiserExercices();
    ouvrirOnglet('cours', false, false); appliquerFragment();
    document.addEventListener('click', function (ev) {
      var t = ev.target, tab = t.closest('[data-course-tab]');
      if (tab) { ouvrirOnglet(tab.dataset.courseTab, true); return; }
      var revise = t.closest('[data-toggle-revise]');
      if (revise && global.STIProfil) {
        var nom = revise.dataset.toggleRevise, p = profil(), etat = p.chapitres.javascript[nom] === 'revise' ? 'en_cours' : 'revise';
        p = global.STIProfil.definirEtatChapitre(MATIERE, nom, etat, 0);
        var termine = CHAPITRES.every(function (c) { return p.chapitres[MATIERE][c[0]] === 'revise'; });
        if (p.progression[MATIERE] !== termine) global.STIProfil.mettreAJour('progression.' + MATIERE, termine);
        return;
      }
      var fn = t.closest('.fnbtn'); if (fn) { basculerFonction(fn); return; }
      var copy = t.closest('[data-copy-code]'); if (copy) { copierCode(copy); return; }
      var run = t.closest('[data-run]'); if (run) { executer(run.closest('[data-playground]')); return; }
      var reset = t.closest('[data-reset-run]'); if (reset) { reinitialiser(reset.closest('[data-playground]')); return; }
      var ressource = t.closest('[data-open-js-resource]');
      if (ressource && !ev.defaultPrevented && ev.button === 0 && ouvrirRessource(ressource)) { ev.preventDefault(); return; }
      var recap = t.closest('[data-open-recap]'); if (recap) { ouvrirRecap(); return; }
      var resume = t.closest('[data-resume-video]'); if (resume) { var carte = resume.closest('.featured-video-card, .js-video-modal__body'); reprendre(carte && $('video[data-js-video]', carte), positionVideo()); return; }
      var full = t.closest('[data-fullscreen-video]'); if (full) { pleinEcran(id(full.dataset.fullscreenVideo)); return; }
      var preview = t.closest('[data-preview-doc]'); if (preview) { id('annexePreviewFrame').src = preview.dataset.previewDoc; id('annexePreview').hidden = false; id('annexePreview').scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
      if (t.closest('#closeAnnexePreview')) { id('annexePreview').hidden = true; id('annexePreviewFrame').removeAttribute('src'); return; }
      var exercice = t.closest('[data-goto-exo]');
      if (exercice) { ev.preventDefault(); var cible = id(exercice.dataset.gotoExo); ouvrirOnglet('exercices', false); changerUrl(exercice.dataset.gotoExo); global.requestAnimationFrame(function () { if (cible) cible.scrollIntoView({ behavior: 'smooth', block: 'start' }); }); return; }
      var lien = t.closest('a[href^="#"]'); if (!lien) return;
      var fragment = lien.getAttribute('href').slice(1), section = id(fragment), parent = section && section.closest('[data-chapter-id]');
      if (parent) { ev.preventDefault(); ouvrirFonction(section); allerChapitre(parent.dataset.chapterId, true, section); }
      else if (fragment === 'exercices') { ev.preventDefault(); ouvrirOnglet('exercices', true); }
    });
    // Même un clic milieu reste dans la bulle pour les exercices locaux.
    document.addEventListener('auxclick', function (ev) {
      if (ev.button !== 1) return;
      var retour = ev.target && ev.target.closest && ev.target.closest('#jsResourceExternal');
      if (retour) { ev.preventDefault(); fermerRessource(); return; }
      var lien = ev.target && ev.target.closest && ev.target.closest('[data-open-js-resource]');
      if (lien && ouvrirRessource(lien)) ev.preventDefault();
    });
    document.addEventListener('change', function (ev) { var c = ev.target.closest('[data-exo-check]'); if (c && global.STIProfil) global.STIProfil.basculerExerciceFait(MATIERE, c.dataset.exoCheck, c.checked); });
    document.addEventListener('toggle', function (ev) { var det = ev.target; if (det.matches && det.matches('.js-exercise__details')) { var label = $('.js-exercise__reveal', det); if (label) label.textContent = det.open ? 'Masquer le corrigé ▴' : 'Voir le corrigé ▾'; } }, true);
    id('tocMobileOpenBtn').addEventListener('click', ouvrirSommaire); id('tocMobileCloseBtn').addEventListener('click', function () { fermerSommaire(true); }); id('courseSidebarBackdrop').addEventListener('click', function () { fermerSommaire(true); });
    id('courseSearchInput').addEventListener('input', filtrerCours); id('back-to-top').addEventListener('click', function () { global.scrollTo({ top: 0, behavior: 'smooth' }); });
    id('jsRecapClose').addEventListener('click', fermerRecap); id('jsRecapRetourCours').addEventListener('click', fermerRecap); id('jsRecapFull').addEventListener('click', basculerTaille);
    id('jsResourceClose').addEventListener('click', fermerRessource); id('jsResourceExternal').addEventListener('click', function (ev) { ev.preventDefault(); fermerRessource(); }); id('jsResourceFull').addEventListener('click', basculerTailleRessource); id('jsResourceReload').addEventListener('click', rechargerRessource);
    id('jsResourceSplit').addEventListener('click', function () { var url = id('jsResourceExternal').href; fermerRessource(); if (typeof global.ouvrirEcranPartageEnonceCodeSTI === 'function') global.ouvrirEcranPartageEnonceCodeSTI(url); });
    id('jsVideoClose').addEventListener('click', fermerVideo); id('jsVideoFullscreen').addEventListener('click', function () { pleinEcran(id('modalJsVideo')); });
    id('jsRecapModal').addEventListener('click', function (ev) { if (ev.target === this) fermerRecap(); }); id('jsResourceModal').addEventListener('click', function (ev) { if (ev.target === this) fermerRessource(); }); id('jsVideoModal').addEventListener('click', function (ev) { if (ev.target === this) fermerVideo(); });
    document.addEventListener('keydown', gererClavier); global.addEventListener('message', recevoirConsole);
    global.addEventListener('message', function (ev) { if (ev.origin === global.location.origin && ev.source === id('jsRecapFrame').contentWindow && ev.data && ev.data.type === 'STI_FERMER_MODALE_JS_RECAP') fermerRecap(); });
    function actualiserDonneesProfil() { actualiserProgression(); actualiserExercices(); actualiserVideos(); }
    global.addEventListener('sti:profil-maj', actualiserDonneesProfil);
    global.addEventListener('sti-cloud-restored', actualiserDonneesProfil);
    global.addEventListener('hashchange', appliquerFragment); global.addEventListener('resize', function () { if (!global.matchMedia('(max-width: 979px)').matches) fermerSommaire(false); mettreAJourLecture(); });
    var attente = false; global.addEventListener('scroll', function () { if (!attente) { attente = true; global.requestAnimationFrame(function () { mettreAJourLecture(); attente = false; }); } }, { passive: true });
    mettreAJourLecture();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialiser); else initialiser();
})(window, document);
