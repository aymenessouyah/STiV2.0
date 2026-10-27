/* ============================================================================
   STI V2.0 — PAGES MATIÈRE (assets/js/cours.js)
   ----------------------------------------------------------------------------
   Framework natif (aucun framework externe) chargé APRÈS, dans cet ordre :
     config.js · supabase-umd.js · acces.js · sync-progressions.js ·
     profil.js · app.js · cours-config.js · cours.js

   Il construit par-dessus le HTML historique (qui reste INTÉGRAL) :
     fil d'Ariane, vidéo en vedette, anneau « X / N chapitres révisés »,
     5 onglets à ancres, sommaire sticky à états, boutons de révision,
     exercices avec éditeur + aperçu + corrigés, annexes, playlist vidéo,
     fenêtres redimensionnables, Guide-Ligne, laboratoires et infobulles.

   RÈGLE ABSOLUE : aucune écriture directe dans localStorage. Toutes les
   actions de l'élève passent par window.STIProfil (assets/js/profil.js).
   Aucune clé / URL Supabase : la racine vient de window.STI_AUTH.RACINE.
   Aucune image externe. Code commenté en français.
   ========================================================================== */
(function () {
  'use strict';

  /* -------------------------------------------------------------------------
     0. DONNÉES & UTILITAIRES
     ---------------------------------------------------------------------- */
  var P = window.STIProfil;
  var TOUT = window.STI_COURS || {};
  var MATIERE = document.documentElement.getAttribute('data-sti-matiere');
  var C = TOUT[MATIERE];
  if (!P || !C || !document.documentElement.hasAttribute('data-sti-cours-v2')) return;

  var CHAPITRES = C.chapitres || [];
  var EXERCICES = C.exercices || [];
  var REDUIT = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function el(html) { var d = document.createElement('div'); d.innerHTML = String(html).trim(); return d.firstElementChild; }
  function normalize(s) {
    return String(s == null ? '' : s).toLowerCase().normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').replace(/’/g, "'").replace(/[^a-z0-9]+/g, ' ').trim();
  }
  /* Racine du site : fournie par config.js (jamais recalculée ici). */
  function racine() {
    return (window.STI_AUTH && window.STI_AUTH.RACINE) ? window.STI_AUTH.RACINE : '../';
  }
  /* Les chemins de configuration sont relatifs à la racine. Le préfixe « ../ »
     des pages historiques est simplement retiré : il désigne la même racine. */
  function u(chemin) {
    var p = String(chemin || '');
    if (/^(https?:|data:|#|mailto:|\/)/i.test(p)) return p;
    p = p.replace(/^(\.\.\/)+/, '');
    return racine() + p;
  }
  function toast(msg) {
    var t = $('#stiCoursToast');
    if (!t) {
      t = el('<div id="stiCoursToast" role="status" aria-live="polite"></div>');
      t.style.cssText = 'position:fixed;bottom:26px;left:50%;transform:translateX(-50%) translateY(20px);' +
        'z-index:240;background:var(--surface);color:var(--text);border:1px solid var(--sti-accent);' +
        'border-radius:999px;padding:.7rem 1.3rem;box-shadow:var(--shadow-lg);font-size:.85rem;' +
        'opacity:0;transition:.3s;pointer-events:none';
      document.body.appendChild(t);
    }
    t.textContent = msg; t.style.opacity = '1'; t.style.transform = 'translateX(-50%)';
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.style.opacity = '0'; t.style.transform = 'translateX(-50%) translateY(20px)'; }, 2600);
  }
  function copier(texte) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texte).then(function () { toast('✅ Copié dans le presse-papiers'); },
        function () { copierRepli(texte); });
    } else copierRepli(texte);
  }
  function copierRepli(texte) {
    var z = document.createElement('textarea');
    z.value = texte; z.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(z); z.select();
    try { document.execCommand('copy'); toast('✅ Copié'); } catch (e) { toast('Copie impossible'); }
    document.body.removeChild(z);
  }
  function badge(txt, classe) {
    return '<span class="badge ' + (classe || C.badge || '') + '">' + esc(txt) + '</span>';
  }
  function borne(v, min, max) { return Math.max(min, Math.min(max, v)); }

  /* -------------------------------------------------------------------------
     1. COQUILLE : on enveloppe le HTML historique SANS en supprimer une ligne
     ---------------------------------------------------------------------- */
  var RACINES_MODALES = (C.modales || []).map(function (m) { return String(m.root || '').replace(/^#/, '').split(/[ >]/)[0]; });

  function estInjecte(n) {
    if (!n || n.nodeType !== 1) return false;
    var tag = n.tagName;
    if (/^(SCRIPT|STYLE|LINK|NOSCRIPT|TEMPLATE|IFRAME)$/.test(tag)) return true;
    if (n.id === 'contact' || n.id === 'stiCoursV2' || n.id === 'stiFenetre' || n.id === 'stiCoursToast') return true;
    if (n.id === 'stix-nav') return true;                 /* nav flottante d'origine */
    if (n.id && n.id.indexOf('sti-') === 0) return true; /* éléments injectés par app.js / acces.js */
    if (n.getAttribute && n.getAttribute('role') === 'dialog') return true;
    if (RACINES_MODALES.indexOf(n.id) !== -1) return true;
    if (n.classList) {
      for (var i = 0; i < n.classList.length; i++) if (n.classList[i].indexOf('sti-') === 0) return true;
      if (n.matches('.site-header,.site-footer,.modal,.side-panel,.side-panel__backdrop,' +
        '.mobile-menu,.scroll-progress,.to-top,.modal-overlay')) return true;
    }
    return false;
  }

  function videoHTML(v, idSuffixe) {
    if (!v) return '';
    var id = 'stiVideo-' + idSuffixe;
    var src = v.src ? u(v.src) : '';
    var poster = v.poster ? ' poster="' + esc(u(v.poster)) + '"' : '';
    return '<video id="' + esc(id) + '" controls playsinline preload="metadata"' + poster +
      ' aria-label="' + esc(v.titre || 'Vidéo du cours') + '">' +
      (src ? '<source src="' + esc(src) + '" type="video/mp4">' : '') +
      'Votre navigateur ne lit pas cette vidéo. <a href="' + esc(src) + '">Télécharger la vidéo</a>.' +
      '</video>';
  }

  function coquilleHTML() {
    var fil = (C.fil || ['Accueil', 'Cours', C.nom]).map(function (x, i, a) {
      if (i === a.length - 1) return '<span class="sti-fil__ici" aria-current="page">' + esc(x) + '</span>';
      var href = i === 0 ? u('index.html') : u('index.html#matieres');
      return '<a href="' + esc(href) + '">' + esc(x) + '</a><span class="sti-fil__sep" aria-hidden="true">›</span>';
    }).join('');
    var v = C.videoUne || {};
    return '' +
      '<nav class="sti-fil" aria-label="Fil d’Ariane">' + fil + '</nav>' +
      '<section class="sti-cours__hero">' +
        '<div class="sti-cours__hero-texte">' +
          '<h1 class="sti-cours__titre"><span class="sti-cours__emoji" aria-hidden="true">' + C.emoji + '</span>' + esc(C.titre) + '</h1>' +
          '<p class="sti-cours__intro">' + esc(C.intro) + '</p>' +
          '<div class="sti-cours__meta">' + badge(C.emoji + ' ' + C.nom) +
            badge(C.classe || '3ème & 4ème SI', 'badge--gold') +
            badge(CHAPITRES.length + ' chapitres') + badge(EXERCICES.length + ' exercices') + '</div>' +
          '<div class="sti-cours__bilan">' +
            '<div class="ring" id="stiAnneau" style="--pct:0"><span class="ring__label" id="stiAnneauTexte">0<small>révisés</small></span></div>' +
            '<div class="sti-cours__bilan-txt"><strong id="stiProgressionTxt">0 / ' + CHAPITRES.length + ' chapitres révisés</strong>' +
              '<span>Ta progression est enregistrée dans ton profil abonné.</span>' +
              '<div class="progress"><div class="progress__fill" id="stiProgressionBarre" style="--bar:var(--sti-accent)"></div></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="sti-cours__hero-media">' +
          '<div class="sti-video-une"><span class="sti-video-une__pastille">VIDÉO DU COURS</span>' +
            '<div class="sti-video-une__cadre">' + videoHTML(v, 'une') + '</div>' +
            '<div class="sti-video-une__legende"><h2>🎬 ' + esc(v.titre || 'Vidéo du cours') +
              ' <span class="badge">' + esc(v.duree || '.mp4') + '</span></h2>' +
              '<p>' + esc(v.desc || '') + '</p>' +
              '<div class="sti-video-une__actions">' +
                '<button type="button" class="sti-bouton sti-bouton--plein" data-sti-action="lire-une">▶ Lire la vidéo</button>' +
                '<button type="button" class="sti-bouton" data-sti-action="reprendre-une">⏱ Reprendre la vidéo</button>' +
                '<button type="button" class="sti-bouton sti-bouton--ghost" data-sti-action="agrandir-une">🔍 Agrandir</button>' +
              '</div></div>' +
          '</div>' +
        '</div>' +
      '</section>' +
      '<div class="sti-onglets" id="stiCourseTabs" role="tablist" aria-label="Sections de la matière">' +
        '<button type="button" class="sti-onglet" id="stiTabCours" role="tab" aria-selected="true" aria-controls="stiPanelCours" data-sti-onglet="cours">📖 Cours</button>' +
        '<button type="button" class="sti-onglet" id="stiTabExercices" role="tab" aria-selected="false" aria-controls="stiPanelExercices" data-sti-onglet="exercices">📝 Exercices</button>' +
        '<button type="button" class="sti-onglet" id="stiTabAnnexes" role="tab" aria-selected="false" aria-controls="stiPanelAnnexes" data-sti-onglet="annexes">📎 Annexes</button>' +
        '<button type="button" class="sti-onglet" id="stiTabVideos" role="tab" aria-selected="false" aria-controls="stiPanelVideos" data-sti-onglet="videos">🎥 Vidéos</button>' +
        '<a class="sti-onglet sti-onglet--quiz" href="' + esc(u(C.quiz.url)) + '">🎯 ' + esc(C.quiz.label) + '</a>' +
      '</div>' +
      '<div class="sti-layout" id="stiLayout">' +
        '<aside class="sti-sommaire" id="stiSommaire" aria-label="Sommaire des chapitres">' +
          '<div class="sti-sommaire__tete"><h2>📚 Sommaire</h2>' +
            '<button type="button" class="sti-bouton sti-bouton--petit" id="stiSommaireFermer" aria-label="Fermer le sommaire">✕</button></div>' +
          '<nav class="sti-sommaire__liste" id="stiSommaireListe"></nav>' +
          '<div class="sti-sommaire__pied">État des chapitres' +
            '<div class="sti-sommaire__legende">' +
              '<span><i style="background:var(--surface-3)"></i>À réviser</span>' +
              '<span><i style="background:var(--js)"></i>En cours</span>' +
              '<span><i style="background:var(--sql)"></i>Révisé</span>' +
            '</div></div>' +
        '</aside>' +
        '<div class="sti-contenu" id="stiContenu">' +
          '<section class="sti-panneau sti-panneau--cours" id="stiPanelCours" role="tabpanel" aria-labelledby="stiTabCours"></section>' +
          '<section class="sti-panneau" id="stiPanelExercices" role="tabpanel" aria-labelledby="stiTabExercices" hidden></section>' +
          '<section class="sti-panneau" id="stiPanelAnnexes" role="tabpanel" aria-labelledby="stiTabAnnexes" hidden></section>' +
          '<section class="sti-panneau" id="stiPanelVideos" role="tabpanel" aria-labelledby="stiTabVideos" hidden></section>' +
        '</div>' +
      '</div>';
  }

  function construireCoquille() {
    if ($('#stiCoursV2')) return;
    document.documentElement.style.setProperty('--sti-accent', 'var(' + C.accent + ')');
    document.body.classList.add('sti-cours-page');

    var racineEl = el('<div class="container sti-cours" id="stiCoursV2" data-accent="' + esc(MATIERE) + '"></div>');
    racineEl.innerHTML = coquilleHTML();
    var footer = $('.site-footer');
    if (footer) document.body.insertBefore(racineEl, footer);
    else document.body.appendChild(racineEl);

    /* Déplacement du contenu historique : on ne touche pas aux scripts déjà
       exécutés, aux <template>, ni aux fenêtres modales / éléments injectés. */
    var panel = $('#stiPanelCours', racineEl);
    var aDeplacer = [];
    Array.prototype.slice.call(document.body.children).forEach(function (n) {
      if (n === racineEl) return;
      if (!estInjecte(n)) aDeplacer.push(n);
    });
    aDeplacer.forEach(function (n) { panel.appendChild(n); });

    /* Bouton flottant « Haut de page » + tiroir du sommaire sur mobile. */
    var haut = el('<button type="button" class="sti-haut" id="stiHaut" aria-label="↑ Haut de page" title="Haut de page">↑</button>');
    document.body.appendChild(haut);
    var tiroir = el('<button type="button" class="sti-sommaire__toggle" id="stiSommaireToggle" aria-expanded="false" aria-controls="stiSommaire">☰ Sommaire</button>');
    /* Placé juste sous le fil d'Ariane : visible dès le premier écran sur
       mobile, puis « sticky » sous l'en-tête quand on fait défiler le cours. */
    var fil = $('.sti-fil', racineEl);
    if (fil && fil.nextSibling) racineEl.insertBefore(tiroir, fil.nextSibling);
    else racineEl.insertBefore(tiroir, racineEl.firstChild);
    var rideau = el('<div class="sti-sommaire__rideau" id="stiSommaireRideau" hidden></div>');
    document.body.appendChild(rideau);

    haut.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: REDUIT ? 'auto' : 'smooth' }); });
    window.addEventListener('scroll', function () { haut.classList.toggle('is-visible', (window.pageYOffset || 0) > 520); }, { passive: true });
    function ouvrirSommaire(oui) {
      var s = $('#stiSommaire'), r = $('#stiSommaireRideau'), b = $('#stiSommaireToggle');
      if (!s) return;
      s.classList.toggle('is-ouvert', oui);
      if (r) r.hidden = !oui;
      if (b) b.setAttribute('aria-expanded', String(oui));
    }
    tiroir.addEventListener('click', function () { ouvrirSommaire(!$('#stiSommaire').classList.contains('is-ouvert')); });
    rideau.addEventListener('click', function () { ouvrirSommaire(false); });
    $('#stiSommaireFermer').addEventListener('click', function () { ouvrirSommaire(false); });
  }

  /* -------------------------------------------------------------------------
     2. CHAPITRES : on repère les titres réels et on ajoute les actions
     ---------------------------------------------------------------------- */
  var ANCRES = {};   // id de chapitre -> ancre DOM

  function trouverTitre(ch, index, candidats) {
    var i, h;
    if (ch.ancre) {
      h = document.getElementById(ch.ancre);
      if (h && $('#stiPanelCours').contains(h)) return h;
    }
    var cible = normalize(ch.match || ch.titre);
    for (i = 0; i < candidats.length; i++) {
      if (normalize(candidats[i].textContent).indexOf(cible) !== -1) return candidats[i];
    }
    /* Repli : premiers mots du titre réel (avant le numéro de chapitre). */
    var mots = cible.split(' ').slice(0, 3).join(' ');
    for (i = 0; i < candidats.length; i++) {
      if (mots && normalize(candidats[i].textContent).indexOf(mots) !== -1) return candidats[i];
    }
    return candidats[Math.min(index, candidats.length - 1)] || null;
  }

  function preparerChapitres() {
    var panel = $('#stiPanelCours');
    var candidats = $$('h2,h3,h4', panel).filter(function (h) {
      return h.textContent.trim().length > 2 && h.textContent.trim().length < 140;
    });
    CHAPITRES.forEach(function (ch, i) {
      var h = trouverTitre(ch, i, candidats);
      if (!h) { ANCRES[ch.id] = ''; return; }
      if (!h.id) h.id = 'sti-ch-' + ch.id;
      ANCRES[ch.id] = h.id;
      h.classList.add('sti-chapitre-titre');
      if (h.querySelector('.sti-chapitre-barre')) return;
      var barre = el('<div class="sti-chapitre-barre" data-sti-chapitre="' + esc(ch.id) + '">' +
        '<span class="sti-chapitre__num">CHAP. ' + (i + 1) + '</span>' +
        '<button type="button" class="sti-bouton sti-bouton--petit" data-sti-reviser="' + esc(ch.id) + '">✅ Marquer comme révisé</button>' +
        '<a class="sti-bouton sti-bouton--petit" href="#exercices&ch=' + esc(ch.id) + '" data-sti-exercer="' + esc(ch.id) + '">📝 S’exercer sur ce chapitre</a>' +
        '<button type="button" class="sti-bouton sti-bouton--petit sti-bouton--ghost" data-sti-video-chapitre="' + esc(ch.id) + '">🎥 Voir l’explication en vidéo</button>' +
        '</div>');
      if (h.nextSibling) h.parentNode.insertBefore(barre, h.nextSibling);
      else h.parentNode.appendChild(barre);

      var mini = el('<div class="sti-video-mini" data-sti-mini="' + esc(ch.id) + '">' +
        '<span class="sti-video-mini__icone" aria-hidden="true">🎥</span>' +
        '<span><strong>Voir l’explication en vidéo</strong> — ' + esc(ch.titre) + '</span>' +
        '<button type="button" class="sti-bouton sti-bouton--pilule" data-sti-video-chapitre="' + esc(ch.id) + '">▶ Visionner</button></div>');
      barre.parentNode.insertBefore(mini, barre.nextSibling);
    });

    /* Navigation « chapitre précédent / suivant » en bas du cours. */
    var nav = el('<nav class="sti-nav-chapitres" id="stiNavChapitres" aria-label="Navigation entre chapitres">' +
      '<button type="button" class="sti-bouton" data-sti-voisin="-1">← Chapitre précédent</button>' +
      '<button type="button" class="sti-bouton" data-sti-voisin="1">Chapitre suivant →</button></nav>');
    panel.appendChild(nav);
  }

  /* -------------------------------------------------------------------------
     3. PROGRESSION (anneau + états du sommaire) — via profil.js uniquement
     ---------------------------------------------------------------------- */
  var CHAPITRE_ACTIF = 0;

  function peindreProgression() {
    var faits = CHAPITRES.filter(function (ch) { return P.estChapitreFait(MATIERE, ch.id); }).length;
    var total = Math.max(1, CHAPITRES.length);
    var pct = Math.round(faits / total * 100);
    var anneau = $('#stiAnneau');
    if (anneau) {
      anneau.style.setProperty('--pct', pct);
      anneau.style.setProperty('--ring-color', 'var(' + C.accent + ')');
    }
    var txt = $('#stiAnneauTexte'); if (txt) txt.innerHTML = faits + '<small>révisés</small>';
    var legende = $('#stiProgressionTxt'); if (legende) legende.textContent = faits + ' / ' + CHAPITRES.length + ' chapitres révisés';
    var barre = $('#stiProgressionBarre'); if (barre) barre.style.width = pct + '%';

    $$('#stiSommaireListe .sti-sommaire__lien').forEach(function (a) {
      var id = a.getAttribute('data-sti-chapitre');
      var etat = P.estChapitreFait(MATIERE, id) ? 'revise' :
        (CHAPITRES[CHAPITRE_ACTIF] && CHAPITRES[CHAPITRE_ACTIF].id === id ? 'encours' : 'areviser');
      a.setAttribute('data-etat', etat);
      a.setAttribute('aria-label', a.textContent.trim() + ' — ' +
        (etat === 'revise' ? 'révisé' : etat === 'encours' ? 'en cours' : 'à réviser'));
      a.classList.toggle('is-actif', CHAPITRES[CHAPITRE_ACTIF] && CHAPITRES[CHAPITRE_ACTIF].id === id);
    });
    $$('[data-sti-reviser]').forEach(function (b) {
      var fait = P.estChapitreFait(MATIERE, b.getAttribute('data-sti-reviser'));
      b.textContent = fait ? '✅ Chapitre révisé' : '⬜ Marquer comme révisé';
      b.setAttribute('aria-pressed', String(fait));
      b.classList.toggle('is-actif', fait);
    });
  }

  function rendreSommaire() {
    var liste = $('#stiSommaireListe');
    var extra = '';
    if (C.recapitulatif) {
      extra = '<a class="sti-sommaire__lien" href="' + esc(u(C.fenetres[0].source)) + '" data-sti-fenetre="' + esc(C.fenetres[0].id) + '">' +
        '<span class="sti-sommaire__num">★</span><span>🪄 Récapitulatif interactif</span></a>';
    }
    liste.innerHTML = CHAPITRES.map(function (ch, i) {
      return '<a class="sti-sommaire__lien" href="#cours&ch=' + esc(ch.id) + '" data-sti-chapitre="' + esc(ch.id) + '" data-index="' + i + '">' +
        '<span class="sti-sommaire__num">' + (i + 1) + '</span><span>' + esc(ch.titre) + '</span>' +
        '<span class="sti-sommaire__etat" aria-hidden="true"></span></a>';
    }).join('') + extra;
    peindreProgression();
  }

  function allerChapitre(id, defiler) {
    var i = -1;
    CHAPITRES.forEach(function (ch, k) { if (ch.id === id) i = k; });
    if (i < 0) return;
    CHAPITRE_ACTIF = i;
    var ch = CHAPITRES[i];
    P.enregistrerLecture(MATIERE, ch.titre, Math.round((i + 1) / CHAPITRES.length * 100),
      'cours/' + MATIERE + '.html#cours&ch=' + ch.id);
    peindreProgression();
    if (defiler) {
      var h = ANCRES[ch.id] ? document.getElementById(ANCRES[ch.id]) : null;
      if (h) h.scrollIntoView({ behavior: REDUIT ? 'auto' : 'smooth', block: 'start' });
    }
  }

  /* -------------------------------------------------------------------------
     4. ONGLETS À ANCRES (#cours, #exercices, #annexes, #videos)
     ---------------------------------------------------------------------- */
  var ONGLETS = ['cours', 'exercices', 'annexes', 'videos'];
  var ONGLET_ACTIF = 'cours';

  function lireHash() {
    var h = String(location.hash || '').replace(/^#/, '');
    var parts = h.split('&');
    var onglet = parts[0];
    var ch = '';
    parts.slice(1).forEach(function (p) { if (p.indexOf('ch=') === 0) ch = p.slice(3); });
    return { onglet: ONGLETS.indexOf(onglet) !== -1 ? onglet : 'cours', ch: ch };
  }
  function ecrireHash(onglet, ch, remplacer) {
    var h = '#' + onglet + (ch ? '&ch=' + ch : '');
    try {
      if (remplacer) history.replaceState(null, '', h);
      else history.pushState(null, '', h);
    } catch (e) { location.hash = h; }
  }
  function activerOnglet(nom, options) {
    var o = options || {};
    if (ONGLETS.indexOf(nom) === -1) nom = 'cours';
    ONGLET_ACTIF = nom;
    ONGLETS.forEach(function (n) {
      var b = $('#stiTab' + n.charAt(0).toUpperCase() + n.slice(1));
      var p = $('#stiPanel' + n.charAt(0).toUpperCase() + n.slice(1));
      var ok = n === nom;
      if (b) { b.setAttribute('aria-selected', String(ok)); b.tabIndex = ok ? 0 : -1; }
      if (p) p.hidden = !ok;
    });
    if (o.hash !== false) ecrireHash(nom, o.ch || '', !!o.remplacer);
    if (o.ch) allerChapitre(o.ch, nom === 'cours' && o.defiler !== false);
    /* Le sommaire reste visible sur l'onglet cours ; ailleurs il propose tout de
       même la liste des chapitres pour « S'exercer sur ce chapitre ». */
    var sommaire = $('#stiSommaire');
    if (sommaire) sommaire.style.display = nom === 'cours' ? '' : '';
    if (!o.silencieux && window.scrollY > 200) window.scrollTo({ top: 0, behavior: REDUIT ? 'auto' : 'smooth' });
  }

  /* -------------------------------------------------------------------------
     5. ÉDITEUR DE CODE + APERÇU EN DIRECT (iframe sandbox isolée)
     ---------------------------------------------------------------------- */
  var IFRAMES = [];

  function srcdoc(langage, code) {
    var entete = '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<style>html,body{margin:0;padding:1rem;font-family:system-ui,sans-serif;' +
      'color:#16223a;background:#fff;line-height:1.6}' +
      'table{border-collapse:collapse;margin:.6rem 0}td,th{border:1px solid #ccd6e6;padding:.35rem .6rem}' +
      '.ma-boite,.mon-element,div.demo{background:#e8f1ff;border:1px solid #7ba7e8;' +
      'border-radius:12px;padding:1rem;margin:.6rem 0}</style></head><body>';
    var pied = '</body></html>';
    if (langage === 'css') {
      return entete + '<style>' + code + '</style>' +
        '<div class="ma-boite">Rendu CSS en direct</div>' +
        '<div class="mon-element">Élément transformé</div>' +
        '<h2>Titre d’exemple</h2><p>Paragraphe d’exemple pour visualiser vos règles.</p>' + pied;
    }
    if (langage === 'js') {
      var pont = '<scr' + 'ipt>(function(){var envoyer=function(t,x){' +
        'parent.postMessage({stiConsole:1,type:t,texte:x},"*")};' +
        '["log","warn","error","info"].forEach(function(m){var o=console[m];' +
        'console[m]=function(){var a=[].slice.call(arguments).map(function(v){' +
        'try{return typeof v==="object"?JSON.stringify(v):String(v)}catch(e){return String(v)}}).join(" ");' +
        'envoyer(m,a);o.apply(console,arguments)}});' +
        'window.onerror=function(msg){envoyer("error",String(msg))};})();</scr' + 'ipt>';
      return entete + pont + '<p style="color:#6b7c96;font-size:.8rem">Console JavaScript ci-dessous →</p>' +
        '<scr' + 'ipt>' + code + '</scr' + 'ipt>' + pied;
    }
    /* HTML, PHP (code affiché, jamais exécuté côté serveur) et repli générique */
    return entete + code + pied;
  }

  function executerApercu(bloc) {
    var ta = $('textarea', bloc), frame = $('iframe', bloc), sortie = $('.sti-apercu__sortie', bloc);
    if (!ta || !frame) return;
    var langage = bloc.getAttribute('data-sti-apercu') || 'html';
    if (sortie) sortie.textContent = '';
    frame.setAttribute('srcdoc', srcdoc(langage, ta.value));
    if (langage === 'sql' && sortie) {
      sortie.textContent = simulerSQL(ta.value);
    }
  }

  /* Simulateur léger : résultat indicatif sur la base d'exemple du cours SQL.
     Le corrigé complet reste le document lié à l'exercice. */
  function simulerSQL(requete) {
    var q = String(requete || '').trim();
    if (!q) return 'Saisissez une requête SELECT pour voir un résultat simulé.';
    var lignes = [
      ['1', 'Ben Ali', 'Sami', '17', '4SI2'],
      ['2', 'Trabelsi', 'Sara', '16', '4SI1'],
      ['3', 'Ayadi', 'Nour', '18', '4SI2'],
      ['4', 'Gharbi', 'Yassine', '15', '4SI1']
    ];
    var texte = q.replace(/\s+/g, ' ');
    if (/^\s*(CREATE|INSERT|UPDATE|DELETE|DROP|ALTER)\b/i.test(q)) {
      return 'Requête de définition/manipulation acceptée (simulation). Aucune base n’est modifiée dans cette fenêtre d’essai.';
    }
    if (!/SELECT/i.test(texte)) return 'Résultat simulé : requête non reconnue. Utilisez SELECT … FROM …';
    var filtre = /WHERE\s+(\w+)\s*=\s*'?(\w+)'?/i.exec(texte);
    if (filtre) {
      var col = { '1': 'Id', '2': 'Nom', '3': 'Prenom', '4': 'Age', '5': 'Classe' };
      var idx = { 'id': 0, 'nom': 1, 'prenom': 2, 'age': 3, 'classe': 4 }[filtre[1].toLowerCase()];
      if (idx !== undefined) lignes = lignes.filter(function (l) { return l[idx].toLowerCase() === filtre[2].toLowerCase(); });
      else col = null;
      if (!col) return 'Colonne inconnue dans la simulation.';
    }
    var entete = '| Id | Nom     | Prenom   | Age | Classe |\n';
    return 'Résultat simulé (4 lignes d’exemple — voir le corrigé pour la base complète) :\n' +
      entete + lignes.map(function (l) { return '| ' + l.join(' | ') + ' |'; }).join('\n');
  }

  function brancherApercus(racine) {
    $$('.sti-apercu', racine).forEach(function (bloc) {
      var exec = $('[data-sti-executer]', bloc);
      if (exec) exec.addEventListener('click', function () { executerApercu(bloc); });
      var reset = $('[data-sti-reset]', bloc);
      if (reset) reset.addEventListener('click', function () {
        var ta = $('textarea', bloc); if (ta) ta.value = ta.getAttribute('data-initial') || '';
        executerApercu(bloc);
      });
      var copierBtn = $('[data-sti-copier-code]', bloc);
      if (copierBtn) copierBtn.addEventListener('click', function () {
        var ta = $('textarea', bloc); if (ta) copier(ta.value);
      });
      var ta = $('textarea', bloc), frame = $('iframe', bloc);
      if (ta && frame) {
        IFRAMES.push(frame);
        if (ta.hasAttribute('data-auto')) executerApercu(bloc);
      }
    });
  }

  /* Console JavaScript : les messages viennent de l'iframe sandbox. */
  window.addEventListener('message', function (e) {
    if (!e.data || !e.data.stiConsole) return;
    var frame = IFRAMES.filter(function (f) { try { return f.contentWindow === e.source; } catch (x) { return false; } })[0];
    if (!frame) return;
    var bloc = frame.closest ? frame.closest('.sti-apercu') : null;
    if (!bloc) return;
    var sortie = $('.sti-apercu__sortie', bloc);
    if (!sortie) return;
    var prefixe = e.data.type === 'error' ? '❌ ' : e.data.type === 'warn' ? '⚠️ ' : '› ';
    sortie.textContent += prefixe + e.data.texte + '\n';
  });

  function apercuHTML(langage, code, titre, auto) {
    var initial = String(code || '');
    return '<div class="sti-apercu" data-sti-apercu="' + esc(langage) + '">' +
      '<div class="sti-apercu__barre"><strong>🧪 ' + esc(titre) + '</strong>' +
        '<span class="badge">' + esc(langage.toUpperCase()) + '</span>' +
        '<button type="button" class="sti-bouton sti-bouton--petit" data-sti-executer>▶ Exécuter</button>' +
        '<button type="button" class="sti-bouton sti-bouton--petit sti-bouton--ghost" data-sti-copier-code>📋 Copier</button>' +
        '<button type="button" class="sti-bouton sti-bouton--petit sti-bouton--ghost" data-sti-reset>♻️ Réinitialiser</button>' +
      '</div>' +
      '<div class="sti-apercu__grille"><div class="sti-apercu__editeur">' +
        '<textarea spellcheck="false" aria-label="Éditeur de code" data-initial="' + esc(initial) + '"' +
        (auto ? ' data-auto="1"' : '') + '>' + esc(initial) + '</textarea></div>' +
        '<div class="sti-apercu__rendu"><iframe title="Aperçu en direct isolé" ' +
        'sandbox="allow-scripts" loading="lazy"></iframe></div></div>' +
      '<pre class="sti-apercu__sortie" aria-live="polite"></pre></div>';
  }

  var CODE_INITIAL = {
    html: '<h2>Mon premier exercice</h2>\n<p>Écrivez votre code HTML ici, puis cliquez sur « Exécuter ».</p>',
    css: '.ma-boite {\n  color: #0b4f9c;\n  border-radius: 16px;\n}',
    js: "// Votre code JavaScript\nconsole.log('Bonjour depuis STI V2.0 !');",
    sql: 'SELECT Nom, Prenom, Age FROM ELEVES WHERE Age >= 16;',
    php: '<p>Le PHP est exécuté côté serveur : ce bac à sable affiche le HTML saisi.</p>'
  };

  /* -------------------------------------------------------------------------
     6. ONGLET EXERCICES — séries groupées par chapitre
     ---------------------------------------------------------------------- */
  function corrigeHTML(ex) {
    if (ex.fenetre) {
      return '<p>La correction complète est dans la fenêtre de détails du cours.</p>' +
        '<button type="button" class="sti-bouton sti-bouton--petit" data-sti-fenetre-native="' + esc(ex.fenetre) + '">🔍 Ouvrir la fenêtre de solution</button>';
    }
    var url = u(ex.corrige || ex.lien);
    return '<p>Le corrigé détaillé se trouve dans le document d’origine :</p>' +
      '<a class="sti-bouton sti-bouton--petit" href="' + esc(url) + '" target="_blank" rel="noopener">📖 Ouvrir le corrigé →</a>';
  }

  function rendreExercices() {
    var panel = $('#stiPanelExercices');
    var groupes = {};
    EXERCICES.forEach(function (ex) { (groupes[ex.chapitre] = groupes[ex.chapitre] || []).push(ex); });
    var corps = '';
    CHAPITRES.forEach(function (ch, i) {
      var liste = groupes[ch.id];
      if (!liste || !liste.length) return;
      corps += '<section class="sti-groupe-exo" id="stiGroupe-' + esc(ch.id) + '">' +
        '<h3 class="sti-groupe-exo__titre"><span>' + (i + 1) + '.</span> ' + esc(ch.titre) +
        ' <a class="sti-bouton sti-bouton--pilule" href="#cours&ch=' + esc(ch.id) + '">📖 Revoir le cours</a></h3>';
      liste.forEach(function (ex) {
        var fait = P.estExerciceFait(MATIERE, ex.id);
        var langage = ex.langage || 'html';
        corps += '<article class="sti-exo' + (fait ? ' is-fait' : '') + '" id="stiExo-' + esc(ex.id) + '" data-sti-exo="' + esc(ex.id) + '">' +
          '<div class="sti-exo__tete"><span class="sti-exo__diff">' + esc(ex.difficulte || 'À faire') + '</span>' +
            '<h4>' + esc(ex.titre) + '</h4>' +
            (ex.fenetre ? '<button type="button" class="sti-bouton sti-bouton--petit" data-sti-fenetre-native="' + esc(ex.fenetre) + '">🔍 Ouvrir l’exercice</button>' : '') +
          '</div><div class="sti-exo__corps">' +
            '<p class="sti-exo__enonce">📄 Énoncé d’origine : <a href="' + esc(u(ex.lien)) + '" target="_blank" rel="noopener">' + esc(ex.titre) + ' →</a></p>';
        if (ex.telechargements) {
          corps += '<div class="sti-exo__liens">' + ex.telechargements.map(function (t) {
            return '<a class="sti-bouton sti-bouton--petit" href="' + esc(u(t.url)) + '" download>⬇ ' + esc(t.titre) + '</a>';
          }).join('') + '</div>';
        }
        corps += apercuHTML(langage, CODE_INITIAL[langage] || CODE_INITIAL.html, 'Bac à sable — ' + ch.titre) +
          '<button type="button" class="sti-bouton sti-bouton--petit" data-sti-corrige="' + esc(ex.id) + '" aria-expanded="false">👁 Voir le corrigé</button>' +
          '<div class="sti-exo__corrige" id="stiCorrige-' + esc(ex.id) + '" hidden>' + corrigeHTML(ex) + '</div>' +
          '</div><div class="sti-exo__pied">' +
            '<label class="sti-exo__case"><input type="checkbox" data-sti-exo-fait="' + esc(ex.id) + '"' + (fait ? ' checked' : '') + '> ✅ Exercice fait</label>' +
            '<span class="sti-muet" style="font-size:.72rem">Progression enregistrée dans le profil abonné</span>' +
          '</div></article>';
      });
      corps += '</section>';
    });
    panel.innerHTML = '<div class="sti-entete"><h2>📝 Exercices & corrigés — ' + esc(C.nom) + '</h2>' +
      '<span class="sti-compteur" id="stiCompteurExos">0 / ' + EXERCICES.length + ' exercices faits</span></div>' +
      '<div class="sti-bandeau"><span>💡</span><span>Les énoncés et corrigés sont ceux de la page de référence. Le bac à sable permet de tester librement du code sans modifier le cours.</span></div>' +
      (corps || '<div class="empty">Aucun exercice répertorié pour cette matière.</div>');
    brancherApercus(panel);
    peindreCompteurExos();
  }

  function peindreCompteurExos() {
    var n = EXERCICES.filter(function (ex) { return P.estExerciceFait(MATIERE, ex.id); }).length;
    var c = $('#stiCompteurExos'); if (c) c.textContent = n + ' / ' + EXERCICES.length + ' exercices faits';
  }

  /* -------------------------------------------------------------------------
     7. ONGLET ANNEXES
     ---------------------------------------------------------------------- */
  function rendreAnnexes() {
    var panel = $('#stiPanelAnnexes');
    panel.innerHTML = '<div class="sti-entete"><h2>📎 Annexes & fiches — ' + esc(C.nom) + '</h2>' +
      '<span class="sti-compteur">' + (C.annexes || []).length + ' documents</span></div>' +
      '<div class="sti-bandeau"><span>📚</span><span>Tous les supports distribués avec le cours : annexes PDF, fiches de révision, mémentos et livre interactif.</span></div>' +
      '<div class="sti-annexes">' + (C.annexes || []).map(function (a) {
        var url = u(a.url);
        var telech = a.telecharger !== false && /\.(pdf|zip|sql|mp4|mp3)$/i.test(a.url);
        return '<article class="sti-annexe"><div class="sti-annexe__apercu" aria-hidden="true">' +
          '<span>' + esc(a.icone || '📄') + '</span><span class="sti-annexe__type">' + esc(a.type || 'PDF') + '</span></div>' +
          '<div class="sti-annexe__corps"><h3>' + esc(a.titre) + '</h3>' +
          '<div class="sti-annexe__actions">' +
            '<a class="sti-bouton sti-bouton--petit sti-bouton--plein" href="' + esc(url) + '" target="_blank" rel="noopener">🔗 Ouvrir</a>' +
            (telech ? '<a class="sti-bouton sti-bouton--petit" href="' + esc(url) + '" download>⬇ Télécharger</a>' : '') +
            '<button type="button" class="sti-bouton sti-bouton--petit sti-bouton--ghost" data-sti-fenetre-doc="' + esc(url) + '" data-sti-titre-doc="' + esc(a.titre) + '">🔍 Aperçu</button>' +
          '</div></div></article>';
      }).join('') + '</div>';
  }

  /* -------------------------------------------------------------------------
     8. ONGLET VIDÉOS — playlist, chapitres, leçons animées, Bac
     ---------------------------------------------------------------------- */
  var VIDEO_COURANTE = null;

  function videoParId(id) {
    var liste = C.videos || [];
    for (var i = 0; i < liste.length; i++) if (liste[i].id === id) return liste[i];
    return liste[0] || C.videoUne;
  }

  function rendreVideos() {
    var panel = $('#stiPanelVideos');
    var liste = C.videos || [];
    var bac = C.videosBac || [];
    var html = '<div class="sti-entete"><h2>🎥 Vidéos & leçons animées — ' + esc(C.nom) + '</h2>' +
      '<span class="sti-compteur">' + liste.length + ' éléments</span></div>' +
      '<div class="sti-videos"><div>' +
        '<div class="sti-lecteur"><div class="sti-lecteur__cadre" id="stiLecteurCadre">' +
          videoHTML(liste[0] || C.videoUne, 'playlist') + '</div>' +
          '<div class="sti-lecteur__corps"><h3 id="stiLecteurTitre">' + esc((liste[0] || C.videoUne).titre) + '</h3>' +
          '<p id="stiLecteurDesc">' + esc((liste[0] || C.videoUne).desc || '') + '</p>' +
          '<div class="sti-lecteur__actions">' +
            '<button type="button" class="sti-bouton sti-bouton--plein" id="stiReprendreVideo">⏱ Reprendre la vidéo</button>' +
            '<button type="button" class="sti-bouton" id="stiAgrandirVideo">🔍 Agrandir</button>' +
            '<button type="button" class="sti-bouton sti-bouton--ghost" id="stiMarquerVue">✅ Marquer comme vue</button>' +
            '<a class="sti-bouton sti-bouton--ghost" id="stiTelechargerVideo" href="#" download>⬇ Télécharger</a>' +
          '</div></div></div>' +
        '<div class="sti-chapitres-video" id="stiChapitresVideo"></div>' +
      '</div>' +
      '<div class="sti-playlist" role="list" aria-label="Liste de lecture">' + liste.map(function (v, i) {
        return '<button type="button" class="sti-playlist__item' + (i === 0 ? ' is-actif' : '') + '" role="listitem" data-sti-lire="' + esc(v.id) + '">' +
          '<span class="sti-playlist__mini">' + (v.poster ? '<img src="' + esc(u(v.poster)) + '" alt="" loading="lazy">' : (v.type === 'audio' ? '🎵' : '▶️')) + '</span>' +
          '<span class="sti-playlist__txt"><strong>' + esc(v.titre) + '</strong><small>' + esc(v.duree || '') + '</small></span></button>';
      }).join('') + '</div></div>';

    if (bac.length) {
      html += '<h3 style="margin-top:2rem">🎓 L’essentiel pour le Bac : les deux vidéos de révision</h3>' +
        '<div class="sti-bac">' + bac.map(function (id) {
          var v = videoParId(id);
          return '<button type="button" class="sti-bac__carte" data-sti-lire="' + esc(id) + '">' +
            '<span class="sti-bac__poster">' + (v.poster ? '<img src="' + esc(u(v.poster)) + '" alt="" loading="lazy">' : '▶️') + '</span>' +
            '<span class="sti-bac__corps"><strong>' + esc(v.titre) + '</strong><small>' + esc(v.duree) + '</small></span></button>';
        }).join('') + '</div>';
    }
    if (C.lecons && C.lecons.length) {
      html += '<h3 style="margin-top:2rem">🎬 ' + esc(C.nom) + ' pas à pas</h3><div class="sti-lecons">' +
        C.lecons.map(function (l) {
          return '<a class="sti-lecon" href="' + esc(u(l.url)) + '" target="_blank" rel="noopener">' +
            '<span class="sti-lecon__icone" aria-hidden="true">' + esc(l.icone) + '</span>' +
            '<span><strong>' + esc(l.titre) + '</strong><small>' + esc(l.sous) + '</small></span>' +
            '<span class="sti-lecon__fleche" aria-hidden="true">→</span></a>';
        }).join('') + '</div>';
    }
    if (C.miniQuiz) {
      html += '<div class="sti-mini-quiz"><h3>🧠 Mini-quiz de 10 questions</h3>' +
        '<p style="font-size:var(--fs-sm);color:var(--text-muted)">Le quiz de contrôle de la page de référence vérifie les types de retour après la vidéo. Il est conservé dans l’onglet Cours, juste sous la vidéo de synthèse.</p>' +
        '<button type="button" class="sti-bouton" id="stiAllerQuiz">🧠 Aller au mini-quiz →</button></div>';
    }
    panel.innerHTML = html;
    brancherVideos();
  }

  function brancherVideos() {
    var panel = $('#stiPanelVideos');
    $$('[data-sti-lire]', panel).forEach(function (b) {
      b.addEventListener('click', function () { choisirVideo(b.getAttribute('data-sti-lire')); });
    });
    var reprendre = $('#stiReprendreVideo');
    if (reprendre) reprendre.addEventListener('click', function () { reprendreVideo($('#stiLecteurCadre video')); });
    var agrandir = $('#stiAgrandirVideo');
    if (agrandir) agrandir.addEventListener('click', function () { agrandirVideo(VIDEO_COURANTE || (C.videos || [])[0]); });
    var vue = $('#stiMarquerVue');
    if (vue) vue.addEventListener('click', function () {
      var v = VIDEO_COURANTE || (C.videos || [])[0]; if (!v) return;
      var video = $('#stiLecteurCadre video');
      P.marquerVideoVue(v.id, video ? video.currentTime : 0);
      toast('✅ Vidéo marquée comme vue');
    });
    var aller = $('#stiAllerQuiz');
    if (aller) aller.addEventListener('click', function () {
      activerOnglet('cours', { hash: true });
      var q = document.getElementById('quizSynthese');
      if (q) setTimeout(function () { q.scrollIntoView({ behavior: REDUIT ? 'auto' : 'smooth', block: 'center' }); }, 200);
    });
    choisirVideo(((C.videos || [])[0] || {}).id, true);
    /* Chapitres cliquables de la vidéo PHP (boutons .chapitre-btn du cours). */
    if (C.chapitresVideo) {
      var boutons = $$(C.chapitresVideo, $('#stiPanelCours'));
      var zone = $('#stiChapitresVideo');
      if (zone && boutons.length) {
        zone.innerHTML = '<span class="sti-chapitres-video__titre">Chapitres de la vidéo</span>' +
          boutons.map(function (b, i) {
            return '<button type="button" class="sti-chapitre-btn" data-sti-temps="' + esc(b.getAttribute('data-t')) + '" data-index="' + i + '">' +
              esc(b.textContent.trim()) + '</button>';
          }).join('');
        $$('[data-sti-temps]', zone).forEach(function (b) {
          b.addEventListener('click', function () {
            var video = $('#stiLecteurCadre video');
            var t = parseFloat(b.getAttribute('data-sti-temps')) || 0;
            if (video) { try { video.currentTime = t; video.play(); } catch (e) {} }
            $$('[data-sti-temps]', zone).forEach(function (x) { x.classList.remove('is-actif'); });
            b.classList.add('is-actif');
          });
        });
      }
    }
  }

  function choisirVideo(id, silencieux) {
    var v = videoParId(id); if (!v) return;
    VIDEO_COURANTE = v;
    var cadre = $('#stiLecteurCadre'); if (!cadre) return;
    var ancien = $('video', cadre);
    if (ancien) ancien.pause && ancien.pause();
    var src = v.src ? u(v.src) : '';
    var poster = v.poster ? u(v.poster) : '';
    if (ancien) {
      if (src) { ancien.src = src; ancien.load(); }
      if (poster) ancien.poster = poster;
    } else {
      cadre.innerHTML = videoHTML(v, 'playlist');
    }
    var titre = $('#stiLecteurTitre'); if (titre) titre.textContent = v.titre;
    var desc = $('#stiLecteurDesc'); if (desc) desc.textContent = v.desc || '';
    var dl = $('#stiTelechargerVideo');
    if (dl) { dl.href = v.telecharger ? u(v.telecharger) : src; dl.hidden = !src && !v.telecharger; }
    $$('#stiPanelVideos .sti-playlist__item').forEach(function (b) {
      b.classList.toggle('is-actif', b.getAttribute('data-sti-lire') === id);
    });
    var video = $('video', cadre);
    if (video) {
      video.addEventListener('timeupdate', function () {
        if (video.currentTime > 0 && Math.floor(video.currentTime) % 8 === 0) {
          P.enregistrerPositionVideo(v.id, video.currentTime, video.duration || 0);
        }
      });
      video.addEventListener('pause', function () { P.enregistrerPositionVideo(v.id, video.currentTime, video.duration || 0); });
      video.addEventListener('ended', function () { P.marquerVideoVue(v.id, video.duration || 0); toast('🎉 Vidéo terminée'); });
    }
    if (!silencieux && src) { var lecture = video && video.play(); if (lecture && lecture.catch) lecture.catch(function () {}); }
  }

  function reprendreVideo(video) {
    var v = VIDEO_COURANTE || C.videoUne;
    var pos = P.positionVideo(v.id);
    if (!video) { toast('Lecteur indisponible'); return; }
    var t = pos ? pos.temps : ((P.chargerProfil().videos.derniere || {}).id === v.id ? P.chargerProfil().videos.derniere.temps : 0);
    if (!t) { toast('▶ Lecture depuis le début'); }
    else toast('⏱ Reprise à ' + formatTemps(t));
    var appliquer = function () { try { video.currentTime = t; } catch (e) {} var l = video.play(); if (l && l.catch) l.catch(function () {}); };
    if (video.readyState >= 1) appliquer(); else video.addEventListener('loadedmetadata', appliquer, { once: true });
  }
  function formatTemps(s) {
    s = Math.max(0, Math.round(Number(s) || 0));
    return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
  }

  function agrandirVideo(v) {
    if (!v) return;
    ouvrirFenetre('sti-video-' + v.id, {
      titre: v.titre || 'Vidéo du cours',
      html: '<div style="display:grid;gap:.75rem">' + videoHTML(v, 'fenetre') +
        '<p style="font-size:var(--fs-sm);color:var(--text-muted)">' + esc(v.desc || '') + '</p></div>'
    });
    var fenetreVideo = $('#stiFenetreCorps video');
    if (fenetreVideo) {
      var pos = P.positionVideo(v.id);
      if (pos && pos.temps) fenetreVideo.addEventListener('loadedmetadata', function () {
        try { fenetreVideo.currentTime = pos.temps; } catch (e) {}
      }, { once: true });
      fenetreVideo.addEventListener('timeupdate', function () {
        P.enregistrerPositionVideo(v.id, fenetreVideo.currentTime, fenetreVideo.duration || 0);
      });
    }
  }

  /* -------------------------------------------------------------------------
     9. FENÊTRES MODALES UNIFIÉES — templates, focus piégé, redimensionnement
     ---------------------------------------------------------------------- */
  var FENETRE = null, DERNIER_DECLENCHEUR = null, MODALE_ACTIVE = null;
  var MODALES_NATIVES = [];

  function creerFenetre() {
    if ($('#stiFenetre')) return;
    FENETRE = el('<div class="sti-fenetre" id="stiFenetre" role="dialog" aria-modal="true" ' +
      'aria-labelledby="stiFenetreTitre" hidden>' +
      '<div class="sti-fenetre__fond" data-sti-fermer="1"></div>' +
      '<div class="sti-fenetre__boite" id="stiFenetreBoite">' +
        '<div class="sti-fenetre__barre"><h2 class="sti-fenetre__titre" id="stiFenetreTitre">Détails</h2>' +
          '<div class="sti-fenetre__actions">' +
            '<button type="button" class="sti-bouton" data-sti-fenetre-action="retour" title="Fermer et revenir au cours">🏠 Fermer et revenir au cours</button>' +
            '<button type="button" class="sti-bouton" data-sti-fenetre-action="plein" aria-pressed="false" title="Agrandir sur toute la page">⤢ Agrandir sur toute la page</button>' +
            '<button type="button" class="sti-bouton sti-bouton--ghost" data-sti-fenetre-action="fermer" aria-label="Fermer" title="Fermer">✕</button>' +
          '</div></div>' +
        '<div class="sti-fenetre__corps" id="stiFenetreCorps" tabindex="-1"></div>' +
        '<div class="sti-fenetre__poignee" id="stiFenetrePoignee" role="separator" ' +
          'aria-label="↘ Faites glisser pour agrandir" title="↘ Faites glisser pour agrandir">glisser</div>' +
      '</div></div>');
    document.body.appendChild(FENETRE);

    FENETRE.addEventListener('click', function (e) {
      if (e.target.hasAttribute && e.target.hasAttribute('data-sti-fermer')) { fermerFenetre(); return; }
      var b = e.target.closest && e.target.closest('[data-sti-fenetre-action]');
      if (!b) return;
      var a = b.getAttribute('data-sti-fenetre-action');
      if (a === 'fermer' || a === 'retour') {
        fermerFenetre();
        if (a === 'retour') { activerOnglet('cours', { hash: true }); window.scrollTo({ top: 0, behavior: REDUIT ? 'auto' : 'smooth' }); }
      } else if (a === 'plein') {
        var boite = $('#stiFenetreBoite');
        var plein = boite.classList.toggle('is-plein');
        b.setAttribute('aria-pressed', String(plein));
        b.textContent = plein ? '⤡ Restaurer la taille' : '⤢ Agrandir sur toute la page';
      }
    });
    brancherPoignee($('#stiFenetrePoignee'), $('#stiFenetreBoite'));
  }

  /* Poignée de redimensionnement commune aux fenêtres unifiées et historiques. */
  function brancherPoignee(poignee, boite) {
    if (!poignee || !boite || !window.PointerEvent) return;
    poignee.addEventListener('pointerdown', function (e) {
      e.preventDefault(); e.stopPropagation();
      var r = boite.getBoundingClientRect(), x0 = e.clientX, y0 = e.clientY, w0 = r.width, h0 = r.height;
      poignee.setPointerCapture(e.pointerId);
      function bougeer(ev) {
        boite.style.width = Math.max(300, w0 + ev.clientX - x0) + 'px';
        boite.style.height = Math.max(220, h0 + ev.clientY - y0) + 'px';
      }
      function fin() {
        poignee.removeEventListener('pointermove', bougeer);
        poignee.removeEventListener('pointerup', fin);
      }
      poignee.addEventListener('pointermove', bougeer);
      poignee.addEventListener('pointerup', fin);
    });
  }

  function fenetreConfig(id) {
    var liste = C.fenetres || [];
    for (var i = 0; i < liste.length; i++) if (liste[i].id === id) return liste[i];
    return null;
  }

  function ouvrirFenetre(id, options) {
    creerFenetre();
    var o = options || {};
    var conf = fenetreConfig(id) || {};
    var corps = $('#stiFenetreCorps');
    var titre = $('#stiFenetreTitre');
    DERNIER_DECLENCHEUR = o.declencher || (document.activeElement && document.activeElement.nodeType === 1 ? document.activeElement : null);
    corps.innerHTML = '';
    titre.textContent = o.titre || conf.titre || 'Détails du cours';

    var type = o.type || conf.type || 'html';
    if (type === 'template') {
      var tpl = document.getElementById(o.source || conf.source || id);
      if (tpl && tpl.tagName === 'TEMPLATE') {
        titre.textContent = tpl.getAttribute('data-title') || titre.textContent;
        corps.appendChild(tpl.content.cloneNode(true));
      } else if (o.html) corps.innerHTML = o.html;
      else corps.innerHTML = '<div class="empty">Contenu de cette fenêtre indisponible.</div>';
    } else if (type === 'iframe') {
      var src = u(o.source || conf.source);
      var f = document.createElement('iframe');
      f.setAttribute('src', src); f.setAttribute('loading', 'lazy');
      f.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups');
      f.setAttribute('title', titre.textContent);
      corps.appendChild(f);
    } else {
      corps.innerHTML = o.html || '<div class="empty">Aucun détail supplémentaire.</div>';
    }
    /* Les <template> générés à la volée restent la source de contenu. */
    var gabarit = document.getElementById('sti-tpl-' + id);
    if (gabarit && !o.html && !conf.source && !o.source) {
      corps.innerHTML = ''; corps.appendChild(gabarit.content.cloneNode(true));
    }
    var boite = $('#stiFenetreBoite');
    boite.classList.remove('is-plein');
    var pleinBtn = $('[data-sti-fenetre-action="plein"]', FENETRE);
    if (pleinBtn) { pleinBtn.textContent = '⤢ Agrandir sur toute la page'; pleinBtn.setAttribute('aria-pressed', 'false'); }
    FENETRE.hidden = false;
    P.enregistrerFenetre(MATIERE, id);
    setTimeout(function () { var c = $('button', FENETRE); if (c) c.focus(); else corps.focus(); }, 30);
  }

  function fermerFenetre() {
    if (!FENETRE || FENETRE.hidden) return;
    var vid = $('video', $('#stiFenetreCorps')); if (vid) { try { vid.pause(); } catch (e) {} }
    FENETRE.hidden = true;
    $('#stiFenetreCorps').innerHTML = '';
    if (DERNIER_DECLENCHEUR && document.contains(DERNIER_DECLENCHEUR)) DERNIER_DECLENCHEUR.focus();
    DERNIER_DECLENCHEUR = null;
  }

  /* Génère un <template> par nouvelle fenêtre (contenu réutilisable, une seule
     fenêtre dans le DOM) — même philosophie que les 23 fenêtres CSS3. */
  function creerTemplates() {
    (C.fenetres || []).forEach(function (f) {
      if (f.type !== 'html' && !f.html) return;
      var id = 'sti-tpl-' + f.id;
      if (document.getElementById(id)) return;
      var t = document.createElement('template');
      t.id = id; t.setAttribute('data-title', f.titre);
      t.innerHTML = f.html || '';
      document.body.appendChild(t);
    });
  }

  /* -------------------------------------------------------------------------
     10. AMÉLIORATION DES FENÊTRES HISTORIQUES (contenu conservé tel quel)
     ---------------------------------------------------------------------- */
  function trouver(selecteur, root) {
    if (!selecteur) return null;
    var n = null;
    try { n = document.querySelector(selecteur); } catch (e) {}
    if (!n && root && root.querySelector) { try { n = root.querySelector(selecteur); } catch (e2) {} }
    return n;
  }

  function ameliorerModalesNatives() {
    (C.modales || []).forEach(function (m) {
      var root = document.querySelector(m.root);
      if (!root || root.__stiAmeliore) return;
      var box = trouver(m.box, root) || root.firstElementChild;
      if (!box) return;
      root.__stiAmeliore = true;
      root.classList.add('sti-fenetre-native');
      box.classList.add('sti-native-boite');
      var barre = trouver(m.barre, root) || box.firstElementChild;
      if (barre) barre.classList.add('sti-native-barre');
      var corps = trouver(m.corps, root);
      if (corps) corps.classList.add('sti-native-corps');
      if (!root.getAttribute('role')) root.setAttribute('role', 'dialog');
      root.setAttribute('aria-modal', 'true');
      var titre = trouver(m.titre, root);
      if (titre) {
        if (!titre.id) titre.id = 'sti-native-titre-' + MODALES_NATIVES.length;
        root.setAttribute('aria-labelledby', titre.id);
      } else root.setAttribute('aria-label', 'Fenêtre de détails du cours');

      var poignee = el('<div class="sti-native-poignee" title="↘ Faites glisser pour agrandir" ' +
        'aria-label="↘ Faites glisser pour agrandir">glisser</div>');
      box.appendChild(poignee);
      brancherPoignee(poignee, box);

      /* Bouton « Plein écran » : on complète ceux de la page d'origine. */
      var max = $('#modal-maximize-button', root) || $('#win-max', root) ||
        $('[id*="Full"]', root) || $('[data-sti-plein]', root);
      if (!max) {
        max = el('<button type="button" class="sti-bouton sti-bouton--petit" aria-pressed="false">⤢ Plein écran</button>');
        if (barre) barre.appendChild(max);
      }
      max.addEventListener('click', function (e) {
        e.stopPropagation();
        var plein = root.classList.toggle('is-plein');
        max.setAttribute('aria-pressed', String(plein));
        if (max.id !== 'win-max') max.textContent = plein ? '⤡ Réduire' : '⤢ Plein écran';
      });

      /* Fond cliqué = fermeture ; la page d'origine garde ses propres boutons. */
      root.addEventListener('click', function (e) {
        if (e.target === root) fermerModaleNative(m);
      });
      MODALES_NATIVES.push({ conf: m, root: root, box: box });
    });
  }

  function fermerModaleNative(m) {
    var root = m.root || m;
    var fermer = $('#modal-overlay button[onclick*="closeModal"]', root) ||
      $('#win-close', root) || $('[data-modal-close]', root) || $('button[aria-label*="Fermer"]', root);
    if (fermer) fermer.click();
    else { root.hidden = true; root.classList.remove('open', 'flex', 'is-plein'); root.style.display = 'none'; }
    if (MODALE_ACTIVE) { var d = MODALE_ACTIVE.declencheur; MODALE_ACTIVE = null; if (d && document.contains(d)) d.focus(); }
  }

  function surveillerModales() {
    if (FENETRE && !FENETRE.hidden) return;
    var visible = null;
    MODALES_NATIVES.forEach(function (m) {
      if (visible) return;
      var r = m.root;
      var ok = !r.hidden && !r.classList.contains('hidden') && getComputedStyle(r).display !== 'none';
      if (ok) visible = m;
    });
    if (visible && !MODALE_ACTIVE) {
      MODALE_ACTIVE = { root: visible.root, box: visible.box, declencheur: document.activeElement, conf: visible.conf };
      var f = $$('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])', visible.box)
        .filter(function (x) { return !x.disabled && x.offsetParent !== null; })[0];
      if (f) f.focus();
    } else if (!visible && MODALE_ACTIVE) {
      var d = MODALE_ACTIVE.declencheur; MODALE_ACTIVE = null;
      if (d && document.contains(d)) d.focus();
    }
  }

  /* Piège de focus + Échap, valable pour la fenêtre unifiée ET les natives. */
  function gererClavier(e) {
    var conteneur = null, fermer = null;
    if (FENETRE && !FENETRE.hidden) { conteneur = $('#stiFenetreBoite'); fermer = fermerFenetre; }
    else if (MODALE_ACTIVE) { conteneur = MODALE_ACTIVE.box; fermer = function () { fermerModaleNative(MODALE_ACTIVE.root); }; }
    if (!conteneur) return;
    /* On laisse l'événement remonter : les fermetures d'origine (qui restaurent
       body.overflow, l'état « max »…) doivent elles aussi s'exécuter. */
    if (e.key === 'Escape') { fermer(); return; }
    if (e.key !== 'Tab') return;
    var focusables = $$('button, a[href], input, select, textarea, iframe, [tabindex]:not([tabindex="-1"])', conteneur)
      .filter(function (x) { return !x.disabled && x.offsetParent !== null; });
    if (!focusables.length) return;
    var premier = focusables[0], dernier = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === premier) { e.preventDefault(); dernier.focus(); }
    else if (!e.shiftKey && document.activeElement === dernier) { e.preventDefault(); premier.focus(); }
  }

  /* -------------------------------------------------------------------------
     11. FONCTIONS GLOBALES ATTENDUES PAR LES BOUTONS HISTORIQUES
     ---------------------------------------------------------------------- */
  function exposerFonctionsGlobales() {
    /* openModal('tpl-target') — HTML5 : même nom, même signature, contenu du
       <template> d'origine, mais fenêtre du nouveau design system. */
    var ancienOpenModal = window.openModal;
    window.openModal = function (id, options) {
      if (document.getElementById(id)) return ouvrirFenetre(id, { titre: 'Détails du cours', type: 'template', source: id, declencher: (options || {}).declencher });
      if (typeof ancienOpenModal === 'function') return ancienOpenModal.apply(this, arguments);
    };
    window.__stiOpenModalOriginal = ancienOpenModal;

    /* openWindow('win-box-shadow') — CSS3 : on déclenche la vraie fenêtre
       historique (qui charge le bon <template> et ses démos), puis on l'améliore. */
    window.openWindow = function (id, declencheur) {
      var bouton = document.querySelector('[data-win="' + id + '"]');
      if (bouton) {
        bouton.click();
        setTimeout(surveillerModales, 80);
        return;
      }
      ouvrirFenetre(id, { titre: id.replace(/^win-/, '').replace(/-/g, ' '), type: 'template', source: id, declencher: declencheur });
    };

    exposerFonctionVideo();
    /* protection.js et acces.js s'installent parfois sur DOMContentLoaded :
       on revérifie après tout le monde, sans jamais écraser le verrou 4ème SI. */
    setTimeout(exposerFonctionVideo, 0);
    window.addEventListener('load', function () { setTimeout(exposerFonctionVideo, 0); });
  }

  /* ouvrirVideoPasAPasSTI(id, titre, startSec) — SQL / JavaScript / PHP.
     MÊME NOM et MÊME SIGNATURE que la fonction des scripts historiques. Quand
     protection.js/acces.js l'ont déjà définie, on l'enveloppe : leurs contrôles
     d'accès (notamment le verrou 4ème SI) restent donc toujours exécutés. */
  function exposerFonctionVideo() {
    var ancienne = window.ouvrirVideoPasAPasSTI;
    if (ancienne && ancienne.__stiCoursV2) return;   /* déjà enveloppée */
    var enveloppe = function (identifiant, titre, depart) {
      if (typeof ancienne === 'function') {
        var r = ancienne.apply(this, arguments);
        setTimeout(surveillerModales, 60);
        return r;
      }
      /* Repli (aperçu hors ligne / script protégé absent) : notre lecteur. */
      var v = videoParId(identifiant) || C.videoUne;
      agrandirVideo(v);
      var titreEl = $('#stiFenetreTitre'); if (titreEl) titreEl.textContent = titre || v.titre;
      if (depart) {
        var vid = $('#stiFenetreCorps video');
        if (vid) vid.addEventListener('loadedmetadata', function () {
          try { vid.currentTime = Number(depart) || 0; } catch (e) {}
        }, { once: true });
      }
      return true;
    };
    enveloppe.__stiCoursV2 = true;
    window.ouvrirVideoPasAPasSTI = enveloppe;
  }

  /* -------------------------------------------------------------------------
     12. HABILLAGE DU COURS HISTORIQUE (sans en retirer une seule ligne)
     ---------------------------------------------------------------------- */
  function nomFichier(code) {
    if (/&lt;!DOCTYPE|<html|<!DOCTYPE|<html/i.test(code)) return 'index.html';
    if (/<\?php|mysqli_/i.test(code)) return 'script.php';
    if (/\b(SELECT|INSERT|CREATE|UPDATE|DELETE|FROM|WHERE)\b/i.test(code)) return 'requete.sql';
    if (/^\s*[.#]?[\w-]+\s*\{/m.test(code) && /:/.test(code)) return 'style.css';
    if (/\b(function|console\.|let |const |var )/.test(code)) return 'script.js';
    return 'exemple.' + (MATIERE === 'sql' ? 'sql' : MATIERE === 'php' ? 'php' : MATIERE === 'css3' ? 'css' : MATIERE === 'javascript' ? 'js' : 'html');
  }

  function colorier(pre) {
    var cible = pre.querySelector('code') || pre;
    if (cible.children.length) return;                  /* déjà colorié par la page */
    var brut = cible.textContent;
    if (!brut || brut.length > 9000) return;
    var e = esc(brut);
    /* Une seule passe : les <span> insérés ne sont jamais retraités. */
    var re = /(&lt;!--[\s\S]*?--&gt;|\/\*[\s\S]*?\*\/|\/\/[^\n]*|--[^\n]*|#[^\n]*)|(&quot;[^&\n]*?&quot;|&#39;[^&\n]*?&#39;|"[^"\n]*"|'[^'\n]*')|(&lt;\/?[A-Za-z][^&\n]*?&gt;)|\b(SELECT|FROM|WHERE|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|DATABASE|ALTER|DROP|JOIN|INNER|LEFT|RIGHT|ON|GROUP|BY|HAVING|ORDER|LIMIT|AND|OR|NOT|NULL|AS|DISTINCT|COUNT|SUM|AVG|MIN|MAX)\b|\b(var|let|const|function|return|if|else|for|while|switch|case|break|echo|foreach|array|class|public|private)\b|\b(\d+(?:\.\d+)?)\b/gi;
    e = e.replace(re, function (m, com, chaine, balise, sql, motcle, nombre) {
      if (com) return '<span class="t-com">' + com + '</span>';
      if (chaine) return '<span class="t-str">' + chaine + '</span>';
      if (balise) return '<span class="t-tag">' + balise + '</span>';
      if (sql) return '<span class="t-sql">' + sql + '</span>';
      if (motcle) return '<span class="t-key">' + motcle + '</span>';
      if (nombre) return '<span class="t-nb">' + nombre + '</span>';
      return m;
    });
    cible.innerHTML = e;                                /* textContent reste identique */
  }

  function habillerCode(pre, i) {
    if (pre.closest('.sti-code, .sti-apercu, .sti-guide, .sti-lab')) return;
    if (pre.closest('button, textarea, iframe')) return;
    var sourceTexte = (pre.querySelector('code') || pre).textContent || '';
    var texte = sourceTexte;
    if (texte.trim().length < 12 || texte.length > 12000) return;
    /* Les boutons « COPIER » déjà injectés par le cours SQL restent en place :
       on ne les retire pas, on ajoute simplement notre barre autour du <pre>. */
    if (pre.querySelector('iframe, video, audio, textarea, table')) return;
    colorier(pre);
    var nom = pre.getAttribute('data-fichier') || pre.getAttribute('data-file') || nomFichier(texte);
    var langage = /\.css$/.test(nom) ? 'css' : /\.js$/.test(nom) ? 'js' : /\.sql$/.test(nom) ? 'sql' : /\.php$/.test(nom) ? 'php' : 'html';
    var boite = document.createElement('div');
    boite.className = 'sti-code';
    var barre = el('<div class="sti-code__barre"><span class="sti-code__points" aria-hidden="true"><i></i><i></i><i></i></span>' +
      '<span class="sti-code__nom">' + esc(nom) + '</span><div class="sti-code__actions">' +
      '<button type="button" class="sti-bouton sti-bouton--petit" data-sti-copier-code>📋 Copier</button>' +
      '<button type="button" class="sti-bouton sti-bouton--petit sti-bouton--ghost" data-sti-resultat>▶ Voir le résultat</button>' +
      '</div></div>');
    var zone = document.createElement('div');
    zone.className = 'sti-code__zone';
    var gouttiere = document.createElement('div');
    gouttiere.className = 'sti-code__gouttiere';
    gouttiere.setAttribute('aria-hidden', 'true');
    var n = texte.replace(/\n$/, '').split('\n').length;
    var numeros = []; for (var k = 1; k <= n; k++) numeros.push(k);
    gouttiere.textContent = numeros.join('\n');
    pre.parentNode.insertBefore(boite, pre);
    boite.appendChild(barre); boite.appendChild(zone);
    zone.appendChild(gouttiere); zone.appendChild(pre);
    $('[data-sti-copier-code]', barre).addEventListener('click', function () { copier(texte); });
    $('[data-sti-resultat]', barre).addEventListener('click', function () {
      var css = langage === 'css' ? '<style>' + texte + '</style>' : '';
      var html = langage === 'sql' || langage === 'php'
        ? '<pre style="white-space:pre-wrap;font-family:monospace">' + esc(texte) + '</pre>'
        : (langage === 'js' ? '<p>Code JavaScript (à tester dans le bac à sable de l’onglet Exercices).</p><pre>' + esc(texte) + '</pre>' : texte);
      ouvrirFenetre('sti-resultat-' + i, {
        titre: '▶ Résultat — ' + nom,
        html: css + '<div style="padding:1rem">' + html + '</div>' +
          (langage === 'html' ? '<iframe sandbox="allow-scripts" loading="lazy" style="width:100%;min-height:220px;border:0;background:var(--surface)" srcdoc="' + esc(srcdoc('html', texte)) + '"></iframe>' : '')
      });
    });
  }

  var BOITES = [
    ['retenir', /à retenir/i, '💡'], ['definition', /définition/i, '📘'],
    ['exemple', /exemple/i, '🧪'], ['attention', /attention|piège|erreur/i, '⚠️'],
    ['astuce', /astuce|conseil/i, '✨'], ['syntaxe', /syntaxe/i, '🧩'],
    ['resultat', /résultat|affichage/i, '▶️'], ['atoi', /à toi de jouer|exercice/i, '🎯']
  ];

  function harmoniserBoites(panel) {
    var candidats = $$('div,section,aside,blockquote,p', panel).filter(function (n) {
      if (n.closest('.sti-apercu, .sti-code, .sti-boite, .sti-guide, .sti-lab, .sti-boxmodel')) return false;
      var t = (n.textContent || '').trim();
      return t.length > 8 && t.length < 1500 && BOITES.some(function (b) { return b[1].test(t.slice(0, 70)); });
    });
    candidats.forEach(function (n) {
      if (n.parentElement && n.parentElement.closest('.sti-boite')) return;
      var t = (n.textContent || '').trim();
      var type = BOITES.filter(function (b) { return b[1].test(t.slice(0, 70)); })[0];
      if (!type) return;
      n.classList.add('sti-boite', 'sti-boite--' + type[0]);
      n.setAttribute('data-sti-boite-icone', type[2]);
      if (n.tagName !== 'P') {
        var plier = el('<button type="button" class="sti-boite__plier" aria-expanded="true" ' +
          'data-sti-plier aria-label="Replier cette boîte">▾ Replier</button>');
        n.insertBefore(plier, n.firstChild);
      }
    });
  }

  function personnaliserInfobulles(panel) {
    $$('[title]', panel).forEach(function (n) {
      if (n.tagName === 'IFRAME' || n.tagName === 'IMG') return;
      var t = (n.getAttribute('title') || '').trim();
      if (!t || t.length > 180) return;
      n.setAttribute('data-sti-tooltip', t);
      if (!n.getAttribute('aria-label')) n.setAttribute('aria-label', t);
      n.removeAttribute('title');
    });
  }

  function boutonsAgrandirVideo(panel) {
    $$('video', panel).forEach(function (v, i) {
      if (v.parentNode && v.parentNode.querySelector('[data-sti-agrandir-video]')) return;
      var id = 'sti-video-legace-' + i;
      var src = (v.querySelector('source') || {}).src || v.src || '';
      var bouton = el('<button type="button" class="sti-bouton sti-bouton--petit" data-sti-agrandir-video="' + id + '">🔍 Agrandir</button>');
      if (v.nextSibling) v.parentNode.insertBefore(bouton, v.nextSibling);
      else v.parentNode.appendChild(bouton);
      bouton.addEventListener('click', function () {
        ouvrirFenetre(id, {
          titre: '🔍 Vidéo du chapitre — ' + C.nom,
          html: '<video controls playsinline preload="metadata" style="width:100%;background:#000;border-radius:var(--r-md)" src="' + esc(src) + '"></video>' +
            '<p style="font-size:var(--fs-sm);color:var(--text-muted)">Élément multimédia conservé du cours d’origine.</p>'
        });
      });
    });
  }

  function habillerContenu() {
    var panel = $('#stiPanelCours');
    $$('pre', panel).forEach(habillerCode);
    harmoniserBoites(panel);
    boutonsAgrandirVideo(panel);
    personnaliserInfobulles(panel);
    /* Les boutons « Agrandir » / « Détails » d'origine gardent leur action. */
    $$('button, a', panel).forEach(function (b) {
      var t = (b.textContent || '').trim();
      if (!/Agrandir|Détails/i.test(t) || t.length > 80) return;
      b.classList.add('sti-pilule-aggrandir');
      if (/Agrandir\s*:/i.test(t)) b.classList.add('sti-pilule-aggrandir--large');
    });
  }

  /* -------------------------------------------------------------------------
     12 bis. LÉGENDE DES ENCADRÉS + COMPARATIFS « À ÉVITER / BON RÉFLEXE »
     ---------------------------------------------------------------------- */
  var LEGENDE = [
    ['retenir', '💡', 'À retenir', 'La règle à mémoriser pour le contrôle.'],
    ['definition', '📘', 'Définition', 'Le vocabulaire technique exact.'],
    ['exemple', '🧪', 'Exemple', 'Un cas concret accompagné de son code.'],
    ['attention', '⚠️', 'Attention / Piège', 'Une erreur fréquente à ne pas commettre.'],
    ['astuce', '✨', 'Astuce', 'Un raccourci ou une bonne habitude.'],
    ['syntaxe', '🧩', 'Syntaxe', 'La forme canonique de l’instruction.'],
    ['resultat', '▶️', 'Résultat', 'Ce que le navigateur affiche ou renvoie.'],
    ['atoi', '🎯', 'À toi de jouer', 'Un petit défi à réaliser sans corrigé immédiat.']
  ];

  function rendreBoitesPedagogiques() {
    var panel = $('#stiPanelCours');
    var legend = '<section class="sti-legende" aria-label="Légende des encadrés du cours">' +
      '<h3>🎨 Légende des encadrés</h3>' +
      '<p style="font-size:var(--fs-sm);color:var(--text-muted);margin:0 0 .8rem">' +
      'Les encadrés du cours d’origine sont unifiés : une couleur et une icône par type, repliables, lisibles dans les trois modes.</p>' +
      '<div class="sti-legende__grille">' + LEGENDE.map(function (l) {
        return '<div class="sti-boite sti-boite--' + l[0] + '">' +
          '<div class="sti-boite__tete"><span class="sti-boite__icone" aria-hidden="true">' + l[1] + '</span>' +
          '<span>' + esc(l[2]) + '</span>' +
          '<button type="button" class="sti-boite__plier" data-sti-plier aria-expanded="true" aria-label="Replier">▾</button></div>' +
          '<div class="sti-boite__corps">' + esc(l[3]) + '</div></div>';
      }).join('') + '</div></section>';
    var comparatifs = '';
    if (C.comparatifs && C.comparatifs.length) {
      comparatifs = '<section class="sti-comparatifs" aria-label="À éviter et bons réflexes">' +
        '<h3>⚖️ À éviter / Bon réflexe</h3>' +
        C.comparatifs.map(function (c) {
          return '<div class="sti-comparatif">' +
            '<div class="sti-comparatif__col sti-comparatif__ko"><p class="sti-comparatif__titre">❌ À éviter</p><pre>' + esc(c.ko) + '</pre></div>' +
            '<div class="sti-comparatif__col sti-comparatif__ok"><p class="sti-comparatif__titre">✅ Bon réflexe</p><pre>' + esc(c.ok) + '</pre></div>' +
            '</div>';
        }).join('') + '</section>';
    }
    var bloc = el('<div id="stiBoitesPedagogiques">' + legend + comparatifs + '</div>');
    panel.insertBefore(bloc, panel.firstChild);
  }

  /* -------------------------------------------------------------------------
     13. GUIDE-LIGNE — écoute vocale synchronisée (HTML5 & SQL)
     ---------------------------------------------------------------------- */
  function rendreGuideLigne() {
    if (!C.guideLigne) return;
    var panel = $('#stiPanelCours');
    var g = el('<section class="sti-guide" aria-label="Guide-Ligne : écoute vocale synchronisée">' +
      '<div class="sti-guide__tete">🎧 <span>' + esc(C.guideLigne.titre) + '</span>' +
        '<span class="sti-guide__etat" id="stiGuideEtat">Prêt</span></div>' +
      '<audio id="stiGuideAudio" controls preload="metadata" src="' + esc(u(C.guideLigne.audio)) + '"></audio>' +
      '<div class="sti-guide__lignes" id="stiGuideLignes">' + CHAPITRES.map(function (ch, i) {
        return '<div class="sti-guide__ligne" data-sti-ligne="' + i + '">' + (i + 1) + '. ' + esc(ch.titre) + '</div>';
      }).join('') + '</div></section>');
    panel.insertBefore(g, panel.firstChild);
    var audio = $('#stiGuideAudio'), lignes = $$('[data-sti-ligne]', g), etat = $('#stiGuideEtat');
    var duree = 0;
    audio.addEventListener('loadedmetadata', function () { duree = audio.duration || 0; });
    audio.addEventListener('timeupdate', function () {
      if (!duree) return;
      var idx = borne(Math.floor(audio.currentTime / duree * CHAPITRES.length), 0, CHAPITRES.length - 1);
      lignes.forEach(function (l, i) { l.classList.toggle('is-lue', i === idx); });
      if (etat) etat.textContent = 'Chapitre ' + (idx + 1) + ' / ' + CHAPITRES.length + ' · ' + formatTemps(audio.currentTime);
      if (Math.floor(audio.currentTime) % 6 === 0) P.enregistrerPositionAudio(C.guideLigne.audio, audio.currentTime);
    });
    audio.addEventListener('pause', function () { P.enregistrerPositionAudio(C.guideLigne.audio, audio.currentTime); });
    lignes.forEach(function (l, i) {
      l.addEventListener('click', function () {
        if (!duree) { audio.addEventListener('loadedmetadata', function () { duree = audio.duration; }, { once: true }); }
        var t = duree ? (i / CHAPITRES.length) * duree : 0;
        try { audio.currentTime = t; audio.play(); } catch (e) {}
        allerChapitre(CHAPITRES[i].id, true);
      });
    });
    var sauve = P.positionAudio(C.guideLigne.audio);
    if (sauve) audio.addEventListener('loadedmetadata', function () { try { audio.currentTime = sauve; } catch (e) {} }, { once: true });
  }

  /* -------------------------------------------------------------------------
     14. LABORATOIRES À CURSEURS + MODÈLE DE BOÎTE (CSS3)
     ---------------------------------------------------------------------- */
  function rendreLaboratoires() {
    if (!C.laboratoires || !C.laboratoires.length) return;
    var panel = $('#stiPanelCours');
    var zone = el('<div id="stiLaboratoires"></div>');
    panel.insertBefore(zone, panel.firstChild);
    C.laboratoires.forEach(function (lab, index) {
      var sauve = P.laboratoire(MATIERE, lab.id) || {};
      var champs = lab.champs.map(function (ch) {
        var v = sauve[ch.cle] !== undefined ? sauve[ch.cle] : ch.valeur;
        return '<div class="sti-lab__champ" data-champ="' + esc(ch.cle) + '">' +
          '<label for="lab-' + index + '-' + esc(ch.cle) + '"><span>' + esc(ch.label) + '</span>' +
          '<output data-sortie="' + esc(ch.cle) + '">' + esc(String(v)) + esc(ch.unite) + '</output></label>' +
          '<input type="range" id="lab-' + index + '-' + esc(ch.cle) + '" data-cle="' + esc(ch.cle) + '" ' +
          'min="' + ch.min + '" max="' + ch.max + '" step="' + (ch.pas || 1) + '" value="' + esc(String(v)) + '" ' +
          'data-unite="' + esc(ch.unite) + '"></div>';
      }).join('');
      var bloc = el('<section class="sti-lab" data-sti-lab="' + esc(lab.id) + '">' +
        '<div class="sti-lab__tete">🧪 ' + esc(lab.titre) + '</div>' +
        '<div class="sti-lab__grille"><div class="sti-lab__commandes">' + champs + '</div>' +
        '<div class="sti-lab__rendu"><div class="sti-lab__cible" data-cible>Rendu en direct</div></div></div>' +
        '<pre class="sti-lab__code" data-code></pre>' +
        '<div class="sti-lab__pied">' +
          '<button type="button" class="sti-bouton sti-bouton--petit" data-sti-lab-copier>📋 Copier le CSS</button>' +
          '<button type="button" class="sti-bouton sti-bouton--petit sti-bouton--ghost" data-sti-lab-reset>♻️ Réinitialiser</button>' +
        '</div></section>');
      zone.appendChild(bloc);
      function valeurs() {
        var v = {};
        $$('input[type="range"]', bloc).forEach(function (r) { v[r.getAttribute('data-cle')] = r.value; });
        return v;
      }
      function peindre() {
        var v = valeurs(), code = lab.modele;
        Object.keys(v).forEach(function (k) { code = code.split('{' + k + '}').join(v[k]); });
        $$('[data-sortie]', bloc).forEach(function (o) {
          var r = $('[data-cle="' + o.getAttribute('data-sortie') + '"]', bloc);
          o.textContent = (r ? r.value : '') + (r ? r.getAttribute('data-unite') : '');
        });
        var cible = $('[data-cible]', bloc);
        if (lab.id === 'box-shadow') cible.style.boxShadow = v.x + 'px ' + v.y + 'px ' + v.b + 'px rgba(0,0,0,.4)';
        else { cible.style.transform = 'rotate(' + v.r + 'deg) scale(' + v.s + ')'; cible.style.opacity = v.o; }
        $('[data-code]', bloc).textContent = code;
        P.enregistrerLaboratoire(MATIERE, lab.id, v);
      }
      $$('input[type="range"]', bloc).forEach(function (r) { r.addEventListener('input', peindre); });
      $('[data-sti-lab-copier]', bloc).addEventListener('click', function () { copier($('[data-code]', bloc).textContent); });
      $('[data-sti-lab-reset]', bloc).addEventListener('click', function () {
        $$('input[type="range"]', bloc).forEach(function (r) {
          var ch = lab.champs.filter(function (c) { return c.cle === r.getAttribute('data-cle'); })[0];
          if (ch) r.value = ch.valeur;
        });
        peindre();
      });
      peindre();
    });
  }

  function rendreBoxModel() {
    if (!C.boxModel) return;
    var panel = $('#stiPanelCours');
    var couches = [
      ['margin', 'MARGIN — marge extérieure', 'margin · margin-top · margin-inline-start'],
      ['border', 'BORDER — bordure', 'border · border-width · border-color · border-style'],
      ['padding', 'PADDING — marge intérieure', 'padding · padding-block · padding-inline'],
      ['content', 'CONTENU — zone intérieure', 'width · height · content']
    ];
    var html = '<section class="sti-boxmodel" aria-label="Modèle de boîte interactif">' +
      '<div class="sti-boxmodel__margin" data-sti-tooltip="margin : espace EXTÉRIEUR entre la boîte et ses voisines.">' +
      '<div class="sti-boxmodel__couche">margin</div>' +
      '<div class="sti-boxmodel__border" data-sti-tooltip="border : trait qui entoure le padding et le contenu.">' +
      '<div class="sti-boxmodel__couche">border</div>' +
      '<div class="sti-boxmodel__padding" data-sti-tooltip="padding : espace INTÉRIEUR entre la bordure et le contenu.">' +
      '<div class="sti-boxmodel__couche">padding</div>' +
      '<div class="sti-boxmodel__content" data-sti-tooltip="CONTENU — zone intérieure : width, height, texte et images.">' +
      'CONTENU</div></div></div></div>' +
      '<div class="sti-boxmodel__legende">' + couches.map(function (c) {
        return '<span data-sti-tooltip="' + esc(c[2]) + '"><strong>' + esc(c[1].split(' — ')[0]) + '</strong> — ' + esc(c[1].split(' — ')[1]) + '</span>';
      }).join('') + '</div></section>';
    var b = el('<div><h3>📦 Modèle de boîte — composition et fond</h3>' +
      '<p style="font-size:var(--fs-sm);color:var(--text-muted)">Survolez chaque couche pour voir son nom et ses propriétés CSS. La démonstration d’origine est conservée plus bas dans le cours.</p>' +
      html + '</div>');
    panel.insertBefore(b, panel.firstChild);
  }

  /* -------------------------------------------------------------------------
     15. MINI-QUIZ PHP (conservé,score enregistré via profil.js)
     ---------------------------------------------------------------------- */
  function brancherMiniQuiz() {
    if (!C.miniQuiz) return;
    var q = document.getElementById('quizSynthese');
    var btn = document.getElementById('btnCorrigerQuiz');
    var score = document.getElementById('scoreQuiz');
    if (q) q.classList.add('sti-mini-quiz');
    if (btn && score) btn.addEventListener('click', function () {
      setTimeout(function () {
        var m = /Score\s*:\s*(\d+)\s*\/\s*(\d+)/i.exec(score.textContent || '');
        if (m) {
          P.enregistrerMiniQuiz(MATIERE, C.miniQuiz.id, Number(m[1]), Number(m[2]));
          toast('🧠 Score enregistré : ' + m[1] + ' / ' + m[2]);
        }
      }, 60);
    });
  }

  /* -------------------------------------------------------------------------
     16. ÉVÉNEMENTS (délégation) + NAVIGATION PAR ANCRES
     ---------------------------------------------------------------------- */
  function brancherEvenements() {
    $$('[data-sti-onglet]').forEach(function (b) {
      b.addEventListener('click', function () { activerOnglet(b.getAttribute('data-sti-onglet'), {}); });
      b.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        var i = ONGLETS.indexOf(ONGLET_ACTIF) + (e.key === 'ArrowRight' ? 1 : -1);
        i = (i + ONGLETS.length) % ONGLETS.length;
        activerOnglet(ONGLETS[i], {});
        var n = $('#stiTab' + ONGLETS[i].charAt(0).toUpperCase() + ONGLETS[i].slice(1)); if (n) n.focus();
      });
    });

    document.addEventListener('click', function (e) {
      var t = e.target, b;
      function proche(sel) { return t.closest ? t.closest(sel) : null; }

      if ((b = proche('[data-sti-reviser]'))) {
        var id = b.getAttribute('data-sti-reviser');
        var fait = !P.estChapitreFait(MATIERE, id);
        P.marquerChapitre(MATIERE, id, fait, CHAPITRES.length);
        peindreProgression();
        toast(fait ? '✅ Chapitre marqué comme révisé' : '↩️ Chapitre remis à réviser');
        return;
      }
      if ((b = proche('[data-sti-chapitre][href]'))) {
        e.preventDefault();
        var cid = b.getAttribute('data-sti-chapitre');
        activerOnglet('cours', { ch: cid, hash: true, defiler: true });
        if (window.innerWidth <= 820) {
          var s = $('#stiSommaire'); if (s) s.classList.remove('is-ouvert');
          var r = $('#stiSommaireRideau'); if (r) r.hidden = true;
        }
        return;
      }
      if ((b = proche('[data-sti-exercer]'))) {
        e.preventDefault();
        var ch = b.getAttribute('data-sti-exercer');
        activerOnglet('exercices', { ch: ch, hash: true });
        setTimeout(function () {
          var g = document.getElementById('stiGroupe-' + ch);
          if (g) g.scrollIntoView({ behavior: REDUIT ? 'auto' : 'smooth', block: 'start' });
        }, 120);
        return;
      }
      if ((b = proche('[data-sti-video-chapitre]'))) {
        e.preventDefault();
        var v = (C.videos || [])[0] || C.videoUne;
        activerOnglet('videos', { hash: true });
        setTimeout(function () { choisirVideo(v.id); agrandirVideo(v); }, 150);
        return;
      }
      if ((b = proche('[data-sti-voisin]'))) {
        var delta = Number(b.getAttribute('data-sti-voisin')) || 1;
        var suivant = borne(CHAPITRE_ACTIF + delta, 0, CHAPITRES.length - 1);
        activerOnglet('cours', { ch: CHAPITRES[suivant].id, hash: true, defiler: true });
        return;
      }
      if ((b = proche('[data-sti-corrige]'))) {
        var zone = document.getElementById('stiCorrige-' + b.getAttribute('data-sti-corrige'));
        if (zone) {
          var ouvert = zone.hidden;
          zone.hidden = !ouvert;
          b.setAttribute('aria-expanded', String(ouvert));
          b.textContent = ouvert ? '🙈 Masquer le corrigé' : '👁 Voir le corrigé';
        }
        return;
      }
      if ((b = proche('[data-sti-exo-fait]'))) {
        var exId = b.getAttribute('data-sti-exo-fait');
        P.marquerExercice(MATIERE, exId, b.checked);
        var art = b.closest('.sti-exo'); if (art) art.classList.toggle('is-fait', b.checked);
        peindreCompteurExos();
        return;
      }
      if ((b = proche('[data-sti-plier]'))) {
        var boite = b.closest('.sti-boite'); if (!boite) return;
        var plie = boite.classList.toggle('is-plie');
        b.setAttribute('aria-expanded', String(!plie));
        b.textContent = plie ? '▸ Déplier' : '▾ Replier';
        return;
      }
      if ((b = proche('[data-sti-fenetre]'))) {
        e.preventDefault(); ouvrirFenetre(b.getAttribute('data-sti-fenetre'), { declencher: b }); return;
      }
      if ((b = proche('[data-sti-fenetre-native]'))) {
        e.preventDefault();
        var nat = document.getElementById(b.getAttribute('data-sti-fenetre-native'));
        if (nat) {
          nat.hidden = false; nat.style.display = '';
          nat.classList.add('open', 'flex'); nat.classList.remove('hidden');
          setTimeout(surveillerModales, 60);
        } else ouvrirFenetre('sti-' + b.getAttribute('data-sti-fenetre-native'), { html: '<div class="empty">Cette fenêtre est disponible dans le cours complet.</div>' });
        return;
      }
      if ((b = proche('[data-sti-fenetre-doc]'))) {
        e.preventDefault();
        var url = b.getAttribute('data-sti-fenetre-doc');
        ouvrirFenetre('sti-doc-' + Math.random().toString(36).slice(2, 7), {
          titre: b.getAttribute('data-sti-titre-doc') || 'Aperçu du document',
          type: 'iframe', source: url
        });
        return;
      }
      if ((b = proche('[data-sti-action]'))) {
        var action = b.getAttribute('data-sti-action');
        var hero = $('#stiVideo-une');
        if (action === 'lire-une' && hero) { var l = hero.play(); if (l && l.catch) l.catch(function () {}); }
        if (action === 'reprendre-une') reprendreVideo(hero);
        if (action === 'agrandir-une') agrandirVideo(C.videoUne);
        return;
      }
      /* Détection des ouvertures de fenêtres historiques après tout clic. */
      setTimeout(surveillerModales, 100);
    }, true);

    document.addEventListener('keydown', gererClavier, true);
    window.addEventListener('hashchange', function () {
      var h = lireHash();
      if (h.onglet !== ONGLET_ACTIF) activerOnglet(h.onglet, { hash: false, ch: h.ch, defiler: true, silencieux: true });
      else if (h.ch) allerChapitre(h.ch, true);
    });
    window.addEventListener('popstate', function () {
      var h = lireHash();
      activerOnglet(h.onglet, { hash: false, ch: h.ch, defiler: false, silencieux: true });
    });
    window.addEventListener('sti:profil', function () { peindreProgression(); peindreCompteurExos(); });
  }

  /* -------------------------------------------------------------------------
     17. DÉMARRAGE
     ---------------------------------------------------------------------- */
  function demarrer() {
    if ($('#stiCoursV2')) return;
    try {
      creerTemplates();
      construireCoquille();
      preparerChapitres();
      rendreSommaire();
      habillerContenu();
      rendreBoxModel();
      rendreLaboratoires();
      rendreGuideLigne();
      rendreBoitesPedagogiques();
      rendreExercices();
      rendreAnnexes();
      rendreVideos();
      creerFenetre();
      ameliorerModalesNatives();
      exposerFonctionsGlobales();
      brancherEvenements();
      brancherMiniQuiz();

      var h = lireHash();
      activerOnglet(h.onglet, { hash: false, ch: h.ch, defiler: false, silencieux: true, remplacer: true });
      if (h.ch) allerChapitre(h.ch, false);
      peindreProgression();

      /* Reprise de lecture : dernière vidéo regardée de cette matière. */
      var derniere = P.chargerProfil().videos.derniere;
      if (derniere && derniere.temps > 0) {
        var v = videoParId(derniere.id);
        if (v && v.id === derniere.id) {
          var info = el('<div class="sti-bandeau" style="margin-top:.75rem"><span>⏱</span><span>Reprise disponible : <strong>' +
            esc(v.titre) + '</strong> à ' + formatTemps(derniere.temps) +
            ' <button type="button" class="sti-bouton sti-bouton--pilule" data-sti-reprise-auto="' + esc(v.id) + '">▶ Reprendre</button></span></div>');
          var media = $('.sti-cours__hero-media'); if (media) media.appendChild(info);
          info.addEventListener('click', function (ev) {
            if (!ev.target.hasAttribute('data-sti-reprise-auto')) return;
            activerOnglet('videos', { hash: true });
            setTimeout(function () { choisirVideo(v.id); reprendreVideo($('#stiLecteurCadre video')); }, 150);
          });
        }
      }
    } catch (err) {
      /* Sécurité : si une amélioration échoue, le cours d'origine reste lisible. */
      if (window.console && console.warn) console.warn('STI cours v2 :', err);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer);
  else demarrer();
})();
