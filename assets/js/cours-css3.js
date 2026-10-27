/* STI V2.0 — Navigation, laboratoires et aperçus de la fiche CSS3.
   Les données de l'élève passent exclusivement par STIProfil ; les gabarits
   et les exemples proviennent de la fiche et des séries existantes. */
(function (global, document) {
  "use strict";
  var MATIERE = "css3", VIDEO_ID = "css3-display";
  var CHAPITRES = [
    ["selecteurs", "Sélecteurs et priorités"], ["typographie", "Polices, alignement et ombres"],
    ["arriere-plan", "Couleur de fond et arrière-plans"], ["boite-display", "Modèle de boîte et display"],
    ["marges-debordement", "Marges, padding et débordement"], ["positionnement", "Positionnement, float et flex"],
    ["tableaux-listes", "Bordures, tableaux, listes et puces"], ["filtres", "Filtres"],
    ["animations", "Transformations, transitions et animations"], ["pas-a-pas", "CSS pas à pas"]
  ];
  var ONGLETS = ["cours", "exercices", "annexes", "videos"];
  var chapitreActif = CHAPITRES[0][0], ongletActif = "cours";
  var scrollCours = 0, scrollConnu = false, restauration = false, retourModal = null, inertes = [];
  var dernierChapitre = "", minuterieLecture = 0;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var id = function (s) { return document.getElementById(s); };
  var profil = function () { return global.STIProfil ? global.STIProfil.chargerProfil() : null; };
  var echapper = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); };
  var focusables = function (zone) { return $$('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,iframe,video[controls],[tabindex]:not([tabindex="-1"])', zone).filter(function (el) { return !el.closest('[hidden]') && el.getClientRects().length; }); };

  /* Onglets accessibles et ancrages historiques de la fiche. */
  function changerUrl(fragment) { if (global.location.hash !== "#" + fragment) global.history.pushState(null, "", "#" + fragment); }
  function ouvrirOnglet(nom, historique, garderPosition) {
    var cible = ONGLETS.indexOf(nom) >= 0 ? nom : "cours", ancien = ongletActif;
    if (ancien === "cours" && cible !== "cours") {
      scrollCours = global.scrollY; scrollConnu = true;
      /* Ne pas perdre la lecture en attente si l'élève change aussitôt d'onglet. */
      if (minuterieLecture) { global.clearTimeout(minuterieLecture); minuterieLecture = 0; enregistrerLecture(); }
    }
    ongletActif = cible;
    $$('[data-course-tab]').forEach(function (b) { var actif = b.dataset.courseTab === cible; b.setAttribute('aria-selected', String(actif)); b.tabIndex = actif ? 0 : -1; });
    $$('[data-course-panel]').forEach(function (p) {
      p.hidden = p.dataset.coursePanel !== cible;
      /* Ne pas laisser jouer une vidéo dans un onglet devenu invisible. */
      if (p.hidden) $$('video[data-css-video]',p).forEach(function (v) { if (!v.paused) v.pause(); });
    });
    if (historique) changerUrl(cible);
    if (cible !== 'cours') {
      fermerSommaire();
      /* Un onglet court doit s'ouvrir à son début, même après une longue lecture. */
      if (ancien !== cible) global.requestAnimationFrame(function () { id(cible).scrollIntoView({behavior:'instant',block:'start'}); });
    }
    if (cible === 'cours' && ancien !== 'cours' && scrollConnu && garderPosition !== false) {
      restauration = true;
      global.requestAnimationFrame(function () { global.scrollTo({top: scrollCours, behavior:'instant'}); global.requestAnimationFrame(function () { restauration = false; }); });
    }
  }
  function chercherChapitre(identifiant) { return CHAPITRES.find(function (c) { return c[0] === identifiant; }); }
  function allerChapitre(identifiant, historique, element) {
    var c = chercherChapitre(identifiant), section = id(identifiant);
    if (!c || !section) return;
    if (section.hidden) { id('courseSearchInput').value = ''; filtrerCours(); }
    chapitreActif = identifiant;
    ouvrirOnglet('cours', false, false); fermerSommaire();
    if (historique) changerUrl(element && element.id ? element.id : identifiant);
    actualiserProgression();
    global.requestAnimationFrame(function () { (element || section).scrollIntoView({behavior:'smooth', block:'start'}); });
    enregistrerLecture();
  }
  function appliquerFragment() {
    var fragment;
    try { fragment = decodeURIComponent(global.location.hash.slice(1)); } catch (e) { fragment = global.location.hash.slice(1); }
    if (ONGLETS.indexOf(fragment) >= 0) { ouvrirOnglet(fragment, false); return; }
    var el = fragment && id(fragment), section = el && el.closest('[data-chapter-id]');
    if (section) { if (fragment === 'css-pas-a-pas') ouvrirPasAPas(true); allerChapitre(section.dataset.chapterId, false, el); return; }
    if (el && (el.closest('#exercices') || fragment === 'editeur-css')) { ouvrirOnglet('exercices', false); global.requestAnimationFrame(function () { el.scrollIntoView({block:'start'}); }); }
  }
  function filtrerCours() {
    var texte = id('courseSearchInput').value.trim().toLocaleLowerCase('fr');
    CHAPITRES.forEach(function (c) {
      var section = id(c[0]), lien = $('.toc-link[href="#' + c[0] + '"]');
      var afficher = !texte || section.textContent.toLocaleLowerCase('fr').indexOf(texte) >= 0;
      section.hidden = !afficher; if (lien) lien.hidden = !afficher;
    });
  }
  function fermerSommaire(rendreFocus) {
    var aside = id('courseSidebar'), fond = id('courseSidebarBackdrop'), bouton = id('tocMobileOpenBtn');
    var ouvert = aside.classList.contains('is-open');
    aside.classList.remove('is-open'); fond.classList.remove('is-open'); bouton.setAttribute('aria-expanded','false');
    if (global.matchMedia('(max-width: 979px)').matches) { aside.inert = true; aside.setAttribute('aria-hidden','true'); }
    else { aside.inert = false; aside.removeAttribute('aria-hidden'); }
    if (ouvert && rendreFocus) bouton.focus();
  }
  function ouvrirSommaire() {
    if (!global.matchMedia('(max-width: 979px)').matches) return;
    if (ongletActif !== 'cours') ouvrirOnglet('cours', true, false);
    var aside = id('courseSidebar'); aside.inert = false; aside.removeAttribute('aria-hidden'); aside.classList.add('is-open');
    id('courseSidebarBackdrop').classList.add('is-open'); id('tocMobileOpenBtn').setAttribute('aria-expanded','true'); id('tocMobileCloseBtn').focus();
  }
  function actualiserProgression() {
    var p = profil(), etats = p && p.chapitres ? p.chapitres.css3 || {} : {}, nombre = 0;
    CHAPITRES.forEach(function (c) {
      var revise = etats[c[0]] === 'revise'; if (revise) nombre++;
      var etat = revise ? 'revise' : (etats[c[0]] === 'en_cours' || chapitreActif === c[0] ? 'en_cours' : 'a_reviser');
      var lien = $('.toc-link[href="#' + c[0] + '"]'), bouton = $('[data-toggle-revise="' + c[0] + '"]');
      if (lien) { lien.dataset.state = etat; lien.classList.toggle('is-active', chapitreActif === c[0]);
        if (chapitreActif === c[0]) lien.setAttribute('aria-current','location'); else lien.removeAttribute('aria-current');
        $('.toc-link__status', lien).textContent = revise ? '✓ Révisé' : etat === 'en_cours' ? 'En cours' : 'À réviser'; }
      id(c[0]).classList.toggle('is-revised', revise);
      if (bouton) { bouton.setAttribute('aria-pressed',String(revise)); bouton.textContent = revise ? '✓ Chapitre révisé' : '☐ Marquer comme révisé'; }
    });
    var pct = Math.round(nombre / CHAPITRES.length * 100), cercle = id('courseRingFill'), longueur = 2 * Math.PI * 26;
    cercle.style.strokeDasharray = String(longueur); cercle.style.strokeDashoffset = String(longueur * (1 - pct/100));
    id('courseRingPct').textContent = pct + '%'; id('courseRingCount').textContent = nombre + ' / ' + CHAPITRES.length + ' chapitres révisés'; id('tocMobileCount').textContent = nombre + '/' + CHAPITRES.length;
    var index = CHAPITRES.findIndex(function (c) { return c[0] === chapitreActif; });
    [['prevChapterBtn',index-1],['nextChapterBtn',index+1]].forEach(function (pair) {
      var b = id(pair[0]), voisin = CHAPITRES[pair[1]]; b.hidden = !voisin;
      if (voisin) { b.href = '#' + voisin[0]; $('.chapter-nav-btn__label',b).textContent = (pair[0] === 'prevChapterBtn' ? '← ' : '') + (pair[1]+1) + '. ' + voisin[1] + (pair[0] === 'nextChapterBtn' ? ' →' : ''); }
    });
  }
  function enregistrerLecture() {
    var c = chercherChapitre(chapitreActif), section = id(chapitreActif);
    if (!global.STIProfil || !c || ongletActif !== 'cours' || section.hidden) return;
    var index = CHAPITRES.indexOf(c), r = section.getBoundingClientRect(), part = Math.max(0,Math.min(1,(155-r.top)/Math.max(1,r.height)));
    global.STIProfil.enregistrerLecture(MATIERE, c[0], 'CSS3 — ' + (index+1) + '. ' + c[1], Math.round((index+part)/CHAPITRES.length*100), 'cours/css3.html#'+c[0]);
    dernierChapitre = c[0];
  }
  function demarrerNavigation() {
    var p = profil(); if (p && p.derniereLecture && p.derniereLecture.matiere === MATIERE && chercherChapitre(p.derniereLecture.chapitreId)) chapitreActif = p.derniereLecture.chapitreId;
    id('tocMobileOpenBtn').addEventListener('click',ouvrirSommaire); id('tocMobileCloseBtn').addEventListener('click',function(){fermerSommaire(true);}); id('courseSidebarBackdrop').addEventListener('click',function(){fermerSommaire(true);});
    var etaitMobile=global.matchMedia('(max-width: 979px)').matches;
    global.addEventListener('resize',function(){
      /* Le clavier virtuel change la hauteur : ne pas refermer le sommaire
         tant que l'on reste dans le même mode de disposition. */
      var mobile=global.matchMedia('(max-width: 979px)').matches;
      if(mobile!==etaitMobile){etaitMobile=mobile;fermerSommaire(false);}
    }); fermerSommaire(false);
    id('courseSearchInput').addEventListener('input',filtrerCours);
    document.addEventListener('click',function(ev){
      var tab = ev.target.closest('[data-course-tab]'); if (tab) { ev.preventDefault(); ouvrirOnglet(tab.dataset.courseTab,true); return; }
      var exo = ev.target.closest('[data-goto-exo]'); if (exo) { ev.preventDefault(); ouvrirOnglet('exercices',true); var carte=id(exo.dataset.gotoExo); if(carte) global.requestAnimationFrame(function(){carte.scrollIntoView({behavior:'smooth',block:'start'});}); return; }
      var ed = ev.target.closest('[data-goto-editor]'); if (ed) { ev.preventDefault(); id('editeur-css').scrollIntoView({behavior:'smooth',block:'start'}); return; }
      var lien = ev.target.closest('a[href^="#"]'); if (lien) { var nom = lien.getAttribute('href').slice(1), cible=id(nom), sec=cible&&cible.closest('[data-chapter-id]'); if(sec){ev.preventDefault(); allerChapitre(sec.dataset.chapterId,true,cible);} }
      var b = ev.target.closest('[data-toggle-revise]'); if(b && global.STIProfil){ var p=profil(), etat=p.chapitres.css3[b.dataset.toggleRevise]; global.STIProfil.definirEtatChapitre(MATIERE,b.dataset.toggleRevise,etat==='revise'?'en_cours':'revise',CHAPITRES.length); }
    });
    $('[role="tablist"][aria-label="Sections CSS3"]').addEventListener('keydown',function(ev){
      var b=$$('[role="tab"]',this), n=b.indexOf(document.activeElement); if(n<0)return; var sens=document.documentElement.dir==='rtl'?-1:1;
      if(ev.key==='ArrowRight')n=(n+sens+b.length)%b.length;else if(ev.key==='ArrowLeft')n=(n-sens+b.length)%b.length;else if(ev.key==='Home')n=0;else if(ev.key==='End')n=b.length-1;else return;
      ev.preventDefault(); ouvrirOnglet(b[n].dataset.courseTab,true); b[n].focus();
    });
    document.addEventListener('keydown',function(ev){var aside=id('courseSidebar'); if(!aside.classList.contains('is-open'))return; if(ev.key==='Escape'){fermerSommaire(true);return;} if(ev.key==='Tab'){var f=focusables(aside);if(!f.length)return;var first=f[0],last=f[f.length-1];if(ev.shiftKey&&(document.activeElement===first||!aside.contains(document.activeElement))){ev.preventDefault();last.focus();}else if(!ev.shiftKey&&document.activeElement===last){ev.preventDefault();first.focus();}}});
    global.addEventListener('hashchange',appliquerFragment); global.addEventListener('popstate',appliquerFragment); appliquerFragment(); actualiserProgression();
    id('backToTop').addEventListener('click',function(){global.scrollTo({top:0,behavior:'smooth'});});
    var raf=0; global.addEventListener('scroll',function(){if(raf)return;raf=global.requestAnimationFrame(function(){raf=0; id('backToTop').classList.toggle('is-visible',global.scrollY>420); if(ongletActif!=='cours'||restauration)return;
      var candidat=null; CHAPITRES.forEach(function(c){var s=id(c[0]);if(s.hidden)return;var r=s.getBoundingClientRect();if(r.top<=155&&r.bottom>155)candidat=c[0];});
      if(!candidat)return; if(candidat!==chapitreActif){chapitreActif=candidat;actualiserProgression();} if(candidat!==dernierChapitre){global.clearTimeout(minuterieLecture);minuterieLecture=global.setTimeout(function(){minuterieLecture=0;enregistrerLecture();},500);}
    });},{passive:true});
    var chercher=$('[data-course-search-trigger]'); if(chercher) chercher.addEventListener('click',function(){if(typeof global.ouvrirRechercheGlobaleSTI==='function')return;ouvrirOnglet('cours',true);ouvrirSommaire();id('courseSearchInput').focus();});
  }

  /* Animation de la définition d'origine, avec une copie complète pour les
     technologies d'assistance et une version instantanée si le mouvement est réduit. */
  function animerDefinition() {
    var racine=id('css-definition-typing');
    if(!racine || (global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches))return;
    var lecture=racine.cloneNode(true); lecture.removeAttribute('id'); lecture.className='sr-only';
    racine.parentNode.insertBefore(lecture,racine); racine.setAttribute('aria-hidden','true');
    var marcheur=document.createTreeWalker(racine,NodeFilter.SHOW_TEXT), noeuds=[], noeud;
    while((noeud=marcheur.nextNode()))if(noeud.nodeValue.trim())noeuds.push(noeud);
    noeuds.forEach(function(n){var fragment=document.createDocumentFragment();Array.from(n.nodeValue).forEach(function(caractere){var lettre=document.createElement('span');lettre.className='typewriter-char';lettre.textContent=caractere;fragment.appendChild(lettre);});n.parentNode.replaceChild(fragment,n);});
    var lettres=$$('.typewriter-char',racine), index=0, curseur=document.createElement('span');curseur.className='typewriter-caret';curseur.setAttribute('aria-hidden','true');curseur.textContent='▍';
    function suite(){if(index>=lettres.length){curseur.remove();return;}var lettre=lettres[index++];lettre.classList.add('is-visible');lettre.appendChild(curseur);global.setTimeout(suite,12);}
    suite();
  }

  /* Code CSS de référence, coloration, copie et cadre isolé sans privilèges. */
  function texteCode(noeud) {
    if (noeud.tagName === 'PRE') return noeud.textContent.replace(/^\s*\n|\s+$/g,'');
    var copie=noeud.cloneNode(true), marcheur=document.createTreeWalker(copie,NodeFilter.SHOW_TEXT), texte;
    /* Dans les DIV d'origine, seuls les <br> créent une nouvelle ligne : les
       retours à la ligne du fichier HTML sont de simples espaces de mise en page. */
    while ((texte=marcheur.nextNode())) texte.nodeValue=texte.nodeValue.replace(/\s+/g,' ');
    $$('br',copie).forEach(function(br){br.replaceWith(document.createTextNode('\n'));});
    return copie.textContent.split('\n').map(function(l){return l.replace(/ +/g,' ').trim();}).filter(function(l){return l.length;}).join('\n');
  }
  function colorerCSS(texte) {
    var reg=/(\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|([\w-]+(?=\s*:))|([.#][\w-]+)/g, sortie='', precedent=0, m;
    while((m=reg.exec(texte))){sortie+=echapper(texte.slice(precedent,m.index));var classe=m[1]?'comment':m[2]?'value':m[3]?'property':'selector';sortie+='<span class="css-token-'+classe+'">'+echapper(m[0])+'</span>';precedent=reg.lastIndex;}
    return sortie+echapper(texte.slice(precedent));
  }
  function copier(texte, bouton) {
    var ancien=bouton.textContent;
    function retour(ok){bouton.textContent=ok?'✓ Copié':'Copie indisponible';global.setTimeout(function(){bouton.textContent=ancien;},1600);}
    if(global.navigator.clipboard&&global.navigator.clipboard.writeText){global.navigator.clipboard.writeText(texte).then(function(){retour(true);},function(){retour(false);});return;}
    var ta=document.createElement('textarea');ta.value=texte;ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();var ok=false;try{ok=document.execCommand('copy');}catch(e){}ta.remove();retour(ok);
  }
  function apercuDocument(css, html) {
    /* La CSP et l'absence de allow-scripts/allow-same-origin empêchent le code
       saisi d'accéder au parent, au réseau ou aux données de l'abonné. */
    var propre=String(css).replace(/<\/style/gi,'\\3C /style');
    return '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; img-src data: blob:; form-action \'none\'; base-uri \'none\'"><style>'+propre+'</style></head><body>'+html+'</body></html>';
  }
  function preparerCode(racine) {
    $$('.codebox:not(.out), pre.filter-detail-code',racine).forEach(function(bloc){
      if(bloc.dataset.prepare==='1')return;bloc.dataset.prepare='1';var source=texteCode(bloc); bloc.__sourceCSS=source;
      var shell=document.createElement('div');shell.className='css-code-shell';bloc.parentNode.insertBefore(shell,bloc);
      var bar=document.createElement('div');bar.className='css-code-shell__head';bar.innerHTML='<strong>🧩 style.css</strong><button type="button" class="code-box__btn" data-code-copy>Copier</button><button type="button" class="code-box__btn" data-code-result aria-expanded="false">▶ Voir le résultat</button>';
      var body=document.createElement('div');body.className='css-code-shell__body';var nums=document.createElement('pre');nums.className='css-code-shell__numbers';nums.setAttribute('aria-hidden','true');nums.textContent=source.split('\n').map(function(_,i){return i+1;}).join('\n');
      bloc.innerHTML=colorerCSS(source);bloc.tabIndex=0;bloc.setAttribute('aria-label','Exemple de code CSS, défilement horizontal possible');body.append(nums,bloc);
      var result=document.createElement('div');result.className='css-code-result';result.hidden=true;var frame=document.createElement('iframe');frame.title='Résultat du code CSS de référence';frame.setAttribute('sandbox','');frame.loading='lazy';result.appendChild(frame);shell.append(bar,body,result);
    });
    $$('.table-wrap,.filter-detail-table-wrap',racine).forEach(function(zone){zone.tabIndex=0;zone.setAttribute('role','region');zone.setAttribute('aria-label','Tableau défilable horizontalement');});
  }
  function initialiserCode() {
    preparerCode(document);
    var textarea=id('cssEditor'), initial=textarea.value, cadre=id('cssEditorPreview'), sourceHtml=id('cssEditorHtml').innerHTML, timer=0;
    function rendre(){cadre.srcdoc=apercuDocument(textarea.value,sourceHtml);}
    textarea.addEventListener('input',function(){global.clearTimeout(timer);timer=global.setTimeout(rendre,150);});
    document.addEventListener('click',function(ev){
      var b=ev.target.closest('[data-code-copy]');if(b){var bloc=$('.codebox, .filter-detail-code',b.closest('.css-code-shell'));if(bloc)copier(bloc.__sourceCSS,b);return;}
      b=ev.target.closest('[data-code-result]');if(b){var boite=b.closest('.css-code-shell'),res=$('.css-code-result',boite),code=$('.codebox,.filter-detail-code',boite);res.hidden=!res.hidden;b.setAttribute('aria-expanded',String(!res.hidden));b.textContent=res.hidden?'▶ Voir le résultat':'🙈 Masquer le résultat';
        if(!res.hidden){var css=code.__sourceCSS;if(css.indexOf('{')<0)css='.demo-target { '+css+' }';var structure='<div class="demo-target box active boite carte barre shd"><p>Carte d’information</p><span class="badge">Exemple</span></div>'+sourceHtml;$('iframe',res).srcdoc=apercuDocument(css,structure);}return;}
      b=ev.target.closest('[data-copy-editor]');if(b){copier(textarea.value,b);return;} if(ev.target.closest('[data-reset-editor]')){textarea.value=initial;rendre();}
    });
    /* Un seul cadre léger : préparer immédiatement le srcdoc pour qu'il ne
       reste jamais vide lorsque l'on ouvre l'onglet depuis un long chapitre. */
    rendre();
  }

  /* Une fenêtre unique clone exactement l'un des vingt-trois templates. */
  function maximiser(oui){var fond=id('modal-overlay'),b=id('modal-maximize-button');fond.classList.toggle('modal-maximized',!!oui);b.setAttribute('aria-pressed',String(!!oui));var label=oui?'Réduire la fenêtre':'Agrandir la fenêtre';b.setAttribute('aria-label',label);b.title=label;id('modal-maximize-icon').textContent=oui?'⤡':'⤢';$('.modal-size-label',b).textContent=oui?'Réduire':'Agrandir';}
  function openWindow(nom,declencheur){
    var tpl=id(nom),fond=id('modal-overlay'),fen=id('modal-window'),corps=id('modal-body');if(!tpl||!tpl.content||!/^win-/.test(nom))return;
    retourModal=declencheur||document.activeElement;fen.style.width='';fen.style.height='';id('modal-title').textContent=tpl.dataset.title||'Détails du cours';corps.replaceChildren(tpl.content.cloneNode(true));corps.scrollTop=0;
    preparerCode(corps); preparerDemos(corps,nom); fond.hidden=false; maximiser(global.matchMedia('(max-width: 700px)').matches);document.body.classList.add('course-modal-open');
    inertes=[];Array.prototype.forEach.call(document.body.children,function(el){if(el===fond||el.tagName==='SCRIPT'||el.tagName==='TEMPLATE'||el.inert)return;el.inert=true;inertes.push(el);});
    var liste=focusables(fen);(liste[0]||fen).focus();
  }
  function fermerWindow(){var fond=id('modal-overlay');if(fond.hidden)return;fond.hidden=true;document.body.classList.remove('course-modal-open');inertes.forEach(function(el){el.inert=false;});inertes=[];maximiser(false);id('modal-body').replaceChildren();if(retourModal&&retourModal.isConnected)retourModal.focus();retourModal=null;}
  global.openWindow=openWindow;
  function initialiserModale(){
    var fond=id('modal-overlay'),fen=id('modal-window'),handle=id('modalResizeHandle');
    document.addEventListener('click',function(ev){var b=ev.target.closest('[data-win]');if(b){ev.preventDefault();openWindow(b.dataset.win,b);return;}if(ev.target===fond||ev.target.closest('[data-modal-close],[data-modal-return]')){fermerWindow();return;}if(ev.target.closest('[data-modal-maximize]'))maximiser(!fond.classList.contains('modal-maximized'));});
    document.addEventListener('keydown',function(ev){if(fond.hidden)return;if(ev.key==='Escape'){ev.preventDefault();fermerWindow();return;}if(ev.key!=='Tab')return;var f=focusables(fen);if(!f.length){ev.preventDefault();fen.focus();return;}if(ev.shiftKey&&(document.activeElement===f[0]||!fen.contains(document.activeElement))){ev.preventDefault();f[f.length-1].focus();}else if(!ev.shiftKey&&(document.activeElement===f[f.length-1]||!fen.contains(document.activeElement))){ev.preventDefault();f[0].focus();}});
    function taille(w,h){fen.style.width=Math.round(Math.max(320,Math.min(global.innerWidth*.96,w)))+'px';fen.style.height=Math.round(Math.max(280,Math.min(global.innerHeight*.94,h)))+'px';}
    handle.addEventListener('pointerdown',function(ev){if(fond.classList.contains('modal-maximized')||global.matchMedia('(max-width: 700px)').matches)return;ev.preventDefault();var r=fen.getBoundingClientRect(),x=ev.clientX,y=ev.clientY,rtl=document.documentElement.dir==='rtl';function move(e){taille(r.width+(rtl?x-e.clientX:e.clientX-x)*2,r.height+(e.clientY-y)*2);}function fin(){global.removeEventListener('pointermove',move);global.removeEventListener('pointerup',fin);}global.addEventListener('pointermove',move);global.addEventListener('pointerup',fin);});
    handle.addEventListener('keydown',function(ev){if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].indexOf(ev.key)<0)return;ev.preventDefault();var r=fen.getBoundingClientRect();taille(r.width+(ev.key==='ArrowRight'?25:ev.key==='ArrowLeft'?-25:0),r.height+(ev.key==='ArrowDown'?25:ev.key==='ArrowUp'?-25:0));});
  }

  /* Les démos d'origine conservent leurs valeurs et actualisent leur CSS. */
  function noterLaboratoire(nom){if(global.STIProfil&&global.STIProfil.enregistrerLaboratoire)global.STIProfil.enregistrerLaboratoire(MATIERE,nom);}
  function hexRgba(hex,alpha){var n=parseInt(hex.slice(1),16),a=(Number(alpha)/100).toFixed(2).replace(/0+$/,'').replace(/\.$/,'');return 'rgba('+((n>>16)&255)+', '+((n>>8)&255)+', '+(n&255)+', '+a+')';}
  function miseAJourOmbre(lab){
    function get(k){return $('[data-k="'+k+'"]',lab);}var texte=lab.classList.contains('tslab'),part=[];
    if(!texte&&get('inset').checked)part.push('inset');part.push(get('x').value+'px',get('y').value+'px',get('blur').value+'px');if(!texte)part.push(get('spread').value+'px');part.push(hexRgba(get('color').value,get('alpha').value));
    var css=part.join(' ');if(texte) $('.tbox',lab).style.textShadow=css;else $('.slab-box',lab).style.boxShadow=css;$('.out',lab).textContent=(texte?'text-shadow: ':'box-shadow: ')+css+';';
    ['x','y','blur','spread','alpha'].forEach(function(k){var ctrl=get(k);if(!ctrl)return;var out=$('output',ctrl.parentNode);if(out)out.textContent=ctrl.value+(k==='alpha'?' %':' px');});
  }
  function miseAJourLive(lab){var kind=lab.dataset.kind,tgt=$('.tgt',lab),out=$('.out',lab),v=function(k){var x=$('[data-k="'+k+'"]',lab);return x?x.value:'0';},css;
    if(kind==='opacity'){css=String(Number(v('v'))/100);tgt.style.opacity=css;out.textContent='opacity: '+css+';';}
    else if(kind==='translate'){css='translate('+v('x')+'px, '+v('y')+'px)';tgt.style.transform=css;out.textContent='transform: '+css+';';}
    else if(kind){css=kind+'('+v('v')+(kind==='scale'?'':'deg')+')';tgt.style.transform=css;out.textContent='transform: '+css+';';}
    $$('input[type="range"]',lab).forEach(function(el){var output=el.parentNode.querySelector('output[data-live-value]');if(output)output.textContent=el.value;});
  }
  function miseAJourDemo(zone){var choisi=$('input:checked',zone),out=$('.out',zone);if(!choisi||!out)return;var valeur=choisi.value,kind=zone.dataset.demo,cible;
    if(kind==='overflow'){cible=$('.ov-box',zone);cible.style.overflow=valeur;out.textContent='overflow: '+valeur+';';}
    else if(kind==='bgrepeat'){cible=$('.tile-demo',zone);cible.style.backgroundRepeat=valeur;out.textContent='background-repeat: '+valeur+';';}
    else if(kind==='bgsize'){cible=$('.tile-demo',zone);cible.style.backgroundSize=valeur;out.textContent='background-size: '+valeur+';';}
    else if(kind==='bgclip'){cible=$('.clip-demo',zone);if(['border-box','padding-box','content-box'].indexOf(valeur)<0)return;cible.style.backgroundClip=valeur;out.textContent='background-clip: '+valeur+';';}
    else if(kind==='float'){cible=$('.float-photo',zone);if(['left','right','none'].indexOf(valeur)<0)return;cible.style.float=valeur;cible.style.margin=valeur==='right'?'0 0 8px 14px':valeur==='left'?'0 14px 8px 0':'0 0 8px';out.textContent='float: '+valeur+';'+(valeur==='none'?'':'\nmargin: '+cible.style.margin+';');}
  }
  function preparerDemos(racine,nom){
    $$('.ctl',racine).forEach(function(ligne,i){var label=$('label',ligne),input=$('input',ligne);if(label&&input){var ident='ctl-'+nom+'-'+i;input.id=ident;label.htmlFor=ident;}});
    $$('.slab',racine).forEach(function(lab){var btn=$('.copy-btn',lab),actions=document.createElement('div');actions.className='lab-actions';if(btn)actions.appendChild(btn);var reset=document.createElement('button');reset.type='button';reset.className='lab-reset';reset.textContent='Réinitialiser';actions.appendChild(reset);lab.appendChild(actions);miseAJourOmbre(lab);});
    $$('.sdemo .sw,.sdemo .tx',racine).forEach(function(el){var css=el.dataset.css;if(!css)return;var texte=el.classList.contains('tx');el.style[texte?'textShadow':'boxShadow']=css;var cap=$('small',el.parentNode);if(cap)cap.textContent=(texte?'text-shadow: ':'box-shadow: ')+css+';';});
    $$('.live2',racine).forEach(function(lab){$$('input[type="range"]',lab).forEach(function(el,i){var label=el.parentNode;if(!el.getAttribute('aria-label'))el.setAttribute('aria-label',(lab.dataset.kind||'Valeur')+' '+(el.dataset.k||i));var output=document.createElement('output');output.dataset.liveValue='';output.textContent=el.value;label.appendChild(output);});miseAJourLive(lab);});
    $$('[data-demo]',racine).forEach(function(zone){miseAJourDemo(zone);if(zone.dataset.demo==='float'){var actions=document.createElement('div');actions.className='lab-actions';actions.innerHTML='<button type="button" class="demo-copy">Copier le CSS</button><button type="button" class="lab-reset">Réinitialiser</button>';zone.appendChild(actions);}});
    $$('table:not(.tbl-demo)',racine).forEach(function(table){if(table.parentNode.classList.contains('detail-scroll'))return;var wrap=document.createElement('div');wrap.className='detail-scroll';wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label','Tableau défilable horizontalement');table.parentNode.insertBefore(wrap,table);wrap.appendChild(table);});
  }
  function initialiserDemos(){
    var body=id('modal-body');
    function changer(ev){var lab=ev.target.closest('.slab');if(lab){miseAJourOmbre(lab);noterLaboratoire(lab.classList.contains('tslab')?'text-shadow':'box-shadow');return;}var live=ev.target.closest('.live2');if(live){miseAJourLive(live);noterLaboratoire(live.dataset.kind||'demo');return;}var zone=ev.target.closest('[data-demo]');if(zone){miseAJourDemo(zone);if(zone.dataset.demo==='float')noterLaboratoire('float');}}
    body.addEventListener('input',changer);body.addEventListener('change',changer);
    body.addEventListener('click',function(ev){var b=ev.target.closest('.copy-btn,.demo-copy');if(b){var parent=b.closest('.slab,[data-demo]'),out=parent&&$('.out',parent);if(out)copier(out.textContent,b);return;}
      var reset=ev.target.closest('.lab-reset');if(!reset)return;var parent=reset.closest('.slab,[data-demo]');if(!parent)return;$$('input',parent).forEach(function(input){if(input.type==='checkbox'||input.type==='radio')input.checked=input.defaultChecked;else input.value=input.defaultValue;});if(parent.classList.contains('slab')){miseAJourOmbre(parent);noterLaboratoire(parent.classList.contains('tslab')?'text-shadow':'box-shadow');}else{miseAJourDemo(parent);noterLaboratoire('float');}
    });
    var infos={margin:'margin : marges extérieures ; on voit le fond du parent.',border:'border : bordure de la boîte ; le fond passe dessous par défaut.',padding:'padding : espace intérieur rempli par le fond.',content:'Contenu : zone intérieure, dimensions width et height.'};
    function afficher(ev){var b=ev.target.closest('[data-box-layer]');if(b)id('boxLayerInfo').textContent=infos[b.dataset.boxLayer];}
    document.addEventListener('mouseover',afficher);document.addEventListener('focusin',afficher);document.addEventListener('click',afficher);
    document.addEventListener('click',function(ev){
      var bouton=ev.target.closest('[data-banner-toggle]'); if(!bouton)return;
      var rappel=bouton.previousElementSibling, pause=bouton.getAttribute('aria-pressed')!=='true';
      if(rappel)rappel.classList.toggle('is-paused',pause);
      bouton.setAttribute('aria-pressed',String(pause));
      bouton.textContent=pause?'▶ Reprendre le défilement':'⏸ Mettre en pause le défilement';
    });
    id('pas-a-pas-toggle').addEventListener('click',function(){ouvrirPasAPas(this.getAttribute('aria-expanded')!=='true');});
  }
  function ouvrirPasAPas(ouvert){
    id('pas-a-pas-toggle').setAttribute('aria-expanded',String(ouvert));
    id('css-pas-a-pas').classList.toggle('open',ouvert);
    if(!ouvert) $$('video[data-css-video]',id('css-pas-a-pas')).forEach(function(video){if(!video.paused)video.pause();});
  }

  /* Suivi des exercices et aperçus des ressources locales. */
  function actualiserExercices(){var p=profil(),faits=p&&p.exercicesFaits?p.exercicesFaits.css3||[]:[],cartes=$$('.exo-card-full[data-exo-id]'),nombre=0;
    cartes.forEach(function(c){var fait=faits.indexOf(c.dataset.exoId)>=0;if(fait)nombre++;c.classList.toggle('is-done',fait);$('[data-exo-check]',c).checked=fait;});var pct=cartes.length?Math.round(nombre/cartes.length*100):0;id('exoProgressText').textContent=nombre+' / '+cartes.length+' exercices faits';id('tabExoCount').textContent=nombre+'/'+cartes.length;id('exoProgressPercent').textContent=pct+'%';id('exoProgressFill').style.width=pct+'%';
  }
  function apercuExercice(declencheur,url,estVideo){var carte=declencheur.closest('.exo-card-full');if(!carte)return;var parent=declencheur.closest('.exo-solution')||carte,zone=$(':scope > .exo-doc-preview',parent);if(!zone){zone=document.createElement('div');zone.className='exo-doc-preview';zone.innerHTML='<div class="exo-doc-preview__head"><strong class="exo-doc-preview__title"></strong><a class="source-link" target="_blank" rel="noopener">Ouvrir à part ↗</a><button type="button" class="source-btn" data-close-preview>✕ Fermer l’aperçu</button></div><div class="exo-doc-preview__content"></div>';parent.appendChild(zone);}zone.hidden=false;zone.__declencheur=declencheur;$('.exo-doc-preview__title',zone).textContent=declencheur.dataset.previewTitle||declencheur.textContent.trim();$('a',zone).href=url;var contenu=$('.exo-doc-preview__content',zone);contenu.replaceChildren();var media=document.createElement(estVideo?'video':'iframe');media.className='exo-doc-preview__frame';if(estVideo){media.controls=true;media.playsInline=true;media.preload='metadata';}else{media.title='Aperçu du document';media.loading='lazy';}media.src=url;contenu.appendChild(media);}
  function initialiserExercices(){document.addEventListener('change',function(ev){var c=ev.target.closest('[data-exo-check]');if(c&&global.STIProfil)global.STIProfil.basculerExerciceFait(MATIERE,c.dataset.exoCheck,c.checked);});
    document.addEventListener('click',function(ev){var lien=ev.target.closest('.exo-card-full a[data-external-doc]');if(lien&&!ev.ctrlKey&&!ev.metaKey&&!ev.shiftKey&&!ev.altKey){ev.preventDefault();apercuExercice(lien,lien.href,false);return;}var v=ev.target.closest('[data-exo-video]');if(v){
        /* Conserver le lecteur historique (chapitres, vitesse, plein écran)
           lorsqu'il est disponible ; le lecteur natif reste le repli local. */
        var ancien=v.dataset.exoVideo.match(/explore-tunisie-(?:flex|float)/);
        if(ancien&&typeof global.ouvrirVideoPasAPasSTI==='function')global.ouvrirVideoPasAPasSTI(ancien[0],v.dataset.previewTitle);
        else apercuExercice(v,v.dataset.exoVideo,true);
        return;
      }var f=ev.target.closest('[data-close-preview]');if(f){var zone=f.closest('.exo-doc-preview');$('.exo-doc-preview__content',zone).replaceChildren();zone.hidden=true;if(zone.__declencheur)zone.__declencheur.focus();return;}var b=ev.target.closest('[data-preview-doc]');if(b){var z=id('annexePreview');id('annexePreviewTitle').textContent='📄 '+b.dataset.previewTitle;id('annexePreviewFrame').src=b.dataset.previewDoc;z.hidden=false;z.scrollIntoView({behavior:'smooth',block:'start'});}});
    id('closeAnnexePreview').addEventListener('click',function(){id('annexePreview').hidden=true;id('annexePreviewFrame').removeAttribute('src');});actualiserExercices();
  }

  /* Chaque vidéo conserve sa position, y compris lorsqu'elle est affichée
     à la fois dans le chapitre et dans la liste de lecture. */
  function identifiantVideo(video){return video && video.dataset.videoId || VIDEO_ID;}
  function positionVideo(identifiant){var p=profil();return p&&p.videos&&p.videos.positions?Number(p.videos.positions[identifiant || VIDEO_ID])||0:0;}
  function actualiserVideos(){
    var p=profil(),vue=!!(p&&p.videos&&p.videos.vues.indexOf(VIDEO_ID)>=0);
    $$('[data-resume-video]').forEach(function(b){
      var carte=b.closest('.featured-video-card'),video=carte&&$('video[data-css-video]',carte);
      var position=positionVideo(identifiantVideo(video));
      b.hidden=position<=2;
      b.textContent='⏯ Reprendre la vidéo à '+Math.floor(position/60)+':'+String(Math.floor(position%60)).padStart(2,'0');
    });
    $$('[data-video-seen-badge]').forEach(function(b){b.textContent=vue?'✓ Vidéo vue':'🎥 CSS3';});
  }
  function enregistrerVideo(video,terminee){
    if(!global.STIProfil)return;
    global.STIProfil.enregistrerPositionVideo({id:identifiantVideo(video),matiere:MATIERE,titre:video.dataset.videoTitle||'Display : la démo animée',temps:video.currentTime||0,duree:Number.isFinite(video.duration)?video.duration:0,url:'cours/css3.html#videos',terminee:!!terminee});
  }
  var lecons={
    cours:{titre:'Cours CSS3',description:'Sélecteurs, Flexbox et transitions — vidéo du cours',videoId:'css3-cours',video:'../assets/videos/css3-cours-v9-sync.mp4',videoTitle:'Cours CSS3'},
    positionnement:{titre:'Positionnement animé',description:'display · position · float — pas à pas',url:'../Positionnement-animee/index.html',videoId:'css-positionnement',video:'../assets/videos/css-positionnement.mp4',videoTitle:'CSS pas à pas — Positionnement animé'},
    cssanimee:{titre:'CSS animée',description:'arrière-plans · liens · ombres · bordures · tableaux · listes',url:'../cssanimee/index.html',videoId:'css-animee',video:'../assets/videos/css-animee.mp4',videoTitle:'CSS pas à pas — Décoration animée'},
    background:{titre:'Détails background — TP Site Tunisie',description:'image de fond · voile · carte badge — mémo interactif corrigé',url:'../projets/site-tunisie/correction-details/carte-timbre-droite-haut.html'}
  };
  function preparerChangementVideo(lecteur){
    /* L'événement pause est asynchrone : enregistrer avant de changer l'identifiant
       ou la source évite de perdre les dernières secondes ou de les attribuer à une autre vidéo. */
    if(lecteur.dataset.videoId&&lecteur.currentTime>2&&!lecteur.ended)enregistrerVideo(lecteur,false);
    if(!lecteur.paused)lecteur.pause();
    lecteur.__dernierEnregistrement=0;
  }
  function selectionPlaylist(nom){
    var display=nom==='display',lecon=lecons[nom],lecteur=id('playlistLessonVideo'),videoDisplay=id('tabCourseVideo');
    if(!display&&!lecon)return;
    $$('[data-playlist]').forEach(function(b){var actif=b.dataset.playlist===nom;b.classList.toggle('is-active',actif);b.setAttribute('aria-pressed',String(actif));});
    id('playlistDisplay').hidden=!display;id('playlistLesson').hidden=display;
    if(display){if(!lecteur.paused)lecteur.pause();return;}
    if(!videoDisplay.paused)videoDisplay.pause();
    id('playlistLessonTitle').textContent=lecon.titre;id('playlistLessonDescription').textContent=lecon.description;id('playlistLessonLink').hidden=!lecon.url;if(lecon.url)id('playlistLessonLink').href=lecon.url;
    id('playlistLessonVideoCard').hidden=!lecon.video;
    if(lecon.video && lecteur.dataset.videoId!==lecon.videoId){
      preparerChangementVideo(lecteur);
      lecteur.dataset.videoId=lecon.videoId;lecteur.dataset.videoTitle=lecon.videoTitle;
      lecteur.setAttribute('aria-label','Vidéo CSS pas à pas : '+lecon.titre);
      lecteur.src=lecon.video;id('playlistLessonDownload').href=lecon.video;lecteur.load();
    } else if(!lecon.video){
      preparerChangementVideo(lecteur);
      lecteur.removeAttribute('src');delete lecteur.dataset.videoId;delete lecteur.dataset.videoTitle;lecteur.load();
    }
    actualiserVideos();
  }
  function initialiserVideos(){
    var videos=$$('video[data-css-video]');
    videos.forEach(function(v){
      v.addEventListener('play',function(){videos.forEach(function(other){if(other!==v&&!other.paused)other.pause();});});
      v.addEventListener('timeupdate',function(){if(Date.now()-(v.__dernierEnregistrement||0)>4000&&v.currentTime>2){v.__dernierEnregistrement=Date.now();enregistrerVideo(v,false);}});
      v.addEventListener('pause',function(){if(v.currentTime>2&&!v.ended)enregistrerVideo(v,false);});
      v.addEventListener('ended',function(){enregistrerVideo(v,true);});
    });
    document.addEventListener('click',function(ev){
      var item=ev.target.closest('[data-playlist]');if(item){selectionPlaylist(item.dataset.playlist);return;}
      var plein=ev.target.closest('[data-fullscreen-video]');if(plein){var v=id(plein.dataset.fullscreenVideo);if(v&&v.requestFullscreen){var p=v.requestFullscreen();if(p&&p.catch)p.catch(function(){});}return;}
      var resume=ev.target.closest('[data-resume-video]');if(resume){var carte=resume.closest('.featured-video-card'),video=carte&&$('video[data-css-video]',carte);if(!video)return;var pos=positionVideo(identifiantVideo(video));try{video.currentTime=pos;}catch(e){video.addEventListener('loadedmetadata',function(){try{video.currentTime=pos;}catch(erreur){}},{once:true});}var play=video.play();if(play&&play.catch)play.catch(function(){});return;}
      if(ev.target.closest('[data-play-display]')){var video=id('heroCourseVideo');video.scrollIntoView({behavior:'smooth',block:'center'});var play=video.play();if(play&&play.catch)play.catch(function(){});}
    });
    actualiserVideos();
  }
  function demarrer(){if(!document.body.classList.contains('course-page--css3'))return;
    /* Le cadre de démonstration sticky doit aussi défiler au clavier. */
    $$('.css-source .demo[style*="overflow"]').forEach(function(zone){zone.tabIndex=0;zone.setAttribute('aria-label','Démonstration défilable du positionnement');});
    demarrerNavigation();animerDefinition();initialiserCode();initialiserModale();initialiserDemos();initialiserExercices();initialiserVideos();global.addEventListener('sti:profil-maj',function(){actualiserProgression();actualiserExercices();actualiserVideos();});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',demarrer);else demarrer();
})(window,document);
