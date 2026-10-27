/* STI V2.0 — navigation et interactions des cours SQL / PHP.
   Toute persistance applicative passe exclusivement par STIProfil. */
(function (global, document) {
  'use strict';
  global.__stiGuideVocalInit = true;
  var matiere = document.body.dataset.coursMatiere;
  if (matiere !== 'sql' && matiere !== 'php') return;
  var chapitres = matiere === 'sql' ? [
    ['intro', 'Introduction : BD & SQL'], ['ldd', 'LDD : définition des données'],
    ['lmd', 'LMD : manipulation des données'], ['bac', 'L’essentiel pour le Bac']
  ] : [
    ['s1', 'Introduction au langage PHP'], ['s2', 'Types, variables et opérateurs'],
    ['s3', 'Manipulation de variables'], ['s4', 'Chaînes de caractères'],
    ['s5', 'Tableaux'], ['s6', 'Date et heure'], ['s7', 'Superglobales et fonctions diverses'],
    ['s8', 'PHP et MySQLi procédural'], ['s9', 'Exercice de synthèse : élèves'],
    ['s10', 'Exercice de synthèse : recharge VE']
  ];
  var videos = {
    'sql-cours': ['Cours SQL', '../assets/videos/sql-cours-v7.mp4', '../assets/images/sql-initiation-poster.jpg'],
    'sql-initiation': ['Construire une requête SQL', '../exercices/sql/sql-construire-requete-guide-texte.mp4', '../assets/images/sql-construire-requete-guide-texte-poster.jpg'],
    'sql-serie4': ['Série 4 : jointures et GROUP BY', '../assets/videos/sql-serie4.mp4', '../assets/images/sql-serie4-poster.jpg'],
    'sql-serie5': ['Série 5 : dates et GROUP BY', '../assets/videos/sql-serie5.mp4', '../assets/images/sql-serie5-poster.jpg'],
    'php-synthese': ['Synthèse PHP : gestion des élèves', '../assets/videos/php-synthese.mp4', '../assets/images/php-synthese-poster.jpg'],
    'php-cours': ['Cours PHP animé', '../assets/videos/php-cours.mp4', '../assets/images/php-synthese-poster.jpg'],
    'php-guichet': ['Animation du guichet PHP', '../assets/videos/php-guichet-v10.mp4', '../assets/images/php-synthese-poster.jpg']
  };
  var tabs = ['cours', 'exercices', 'annexes', 'videos'], onglet = 'cours', chapitreActif = chapitres[0][0];
  var dernierChapitre = '', scrollTimer = 0, videoHistorique, modal = null, modalOrigine = null, elementsInertes = [];
  var worker = null, attenteWorker = 0, synchroniserTableauClasse = null;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var id = function (s) { return document.getElementById(s); };
  var profil = function () { return global.STIProfil && global.STIProfil.chargerProfil(); };
  var autoriseBac = function () { return document.documentElement.classList.contains('sti-4si-autorise'); };
  var autoriseElement = function (e) { return !!e && (!e.closest('.sti-4si-only') || autoriseBac()); };
  var echapper = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); };
  function visibles(zone) {
    return $$('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,iframe,video[controls],[tabindex]:not([tabindex="-1"])', zone)
      .filter(function (el) { return !el.closest('[hidden],[inert]') && el.getClientRects().length; });
  }

  /* ── Onglets, ancres existantes et sommaire mobile ── */
  function changerUrl(fragment) { if (global.location.hash !== '#' + fragment) global.history.pushState(null, '', '#' + fragment); }
  function ouvrirOnglet(nom, historique) {
    if (tabs.indexOf(nom) < 0) nom = 'cours';
    onglet = nom;
    $$('[data-course-tab]').forEach(function (b) { var active = b.dataset.courseTab === nom; b.setAttribute('aria-selected', String(active)); b.tabIndex = active ? 0 : -1; });
    $$('[data-course-panel]').forEach(function (p) { p.hidden = p.dataset.coursePanel !== nom; });
    if (historique) changerUrl(nom);
    if (nom !== 'cours') fermerSommaire(false);
  }
  function naviguer(fragment, historique, defiler) {
    if (!fragment) { ouvrirOnglet('cours', false); return; }
    if (tabs.indexOf(fragment) !== -1) {
      ouvrirOnglet(fragment, historique);
      if (defiler) global.requestAnimationFrame(function () { id(fragment).scrollIntoView({ block:'start', behavior:'smooth' }); });
      return;
    }
    var cible = id(fragment);
    if (fragment === 'top') { if (historique) changerUrl('top'); global.scrollTo({top:0,behavior:'smooth'}); return; }
    if (!cible || !autoriseElement(cible)) return;
    var panneau = cible.closest('[data-course-panel]');
    if (panneau) ouvrirOnglet(panneau.dataset.coursePanel, false);
    var section = cible.closest('[data-chapter-id]');
    if (section) { chapitreActif = section.dataset.chapterId; enregistrerLecture(); actualiserProfil(); }
    // Les anciennes ancres peuvent pointer à l'intérieur d'un détail fermé.
    var d = cible.closest('details'); if (d) d.open = true;
    fermerSommaire(false);
    if (historique) changerUrl(fragment);
    if (defiler) global.requestAnimationFrame(function () { cible.scrollIntoView({block:'start',behavior:'smooth'}); });
  }
  function route() {
    var f = ''; try { f = decodeURIComponent(global.location.hash.slice(1)); } catch (e) { f = global.location.hash.slice(1); }
    if (!f) ouvrirOnglet('cours', false); else naviguer(f, false, true);
  }
  function fermerSommaire(focus) {
    var aside = id('courseSidebar'), fond = id('courseSidebarBackdrop'), bouton = id('tocMobileOpenBtn');
    var ouvert = aside.classList.contains('is-open');
    aside.classList.remove('is-open'); fond.classList.remove('is-open'); bouton.setAttribute('aria-expanded','false');
    if (global.matchMedia('(max-width: 979px)').matches) { aside.inert = true; aside.setAttribute('aria-hidden','true'); }
    else { aside.inert = false; aside.removeAttribute('aria-hidden'); }
    if (ouvert && focus) bouton.focus();
  }
  function ouvrirSommaire() {
    if (!global.matchMedia('(max-width: 979px)').matches) return;
    ouvrirOnglet('cours', false); var a = id('courseSidebar'); a.inert = false; a.removeAttribute('aria-hidden');
    a.classList.add('is-open'); id('courseSidebarBackdrop').classList.add('is-open');
    id('tocMobileOpenBtn').setAttribute('aria-expanded','true'); id('tocMobileCloseBtn').focus();
  }
  function filtrer() {
    var texte = id('courseSearchInput').value.trim().toLocaleLowerCase('fr');
    chapitres.forEach(function (c) {
      var section = id(c[0]), lien = $('.toc-link[href="#' + c[0] + '"]');
      var montrer = !texte || section.textContent.toLocaleLowerCase('fr').indexOf(texte) !== -1;
      // Ne jamais modifier hidden sur les ressources protégées par acces.js.
      if (autoriseElement(section)) section.classList.toggle('matiere-search-hidden', !montrer);
      if (lien && autoriseElement(lien)) lien.classList.toggle('matiere-search-hidden', !montrer);
    });
  }
  function enregistrerLecture() {
    var p = chapitres.findIndex(function (c) { return c[0] === chapitreActif; });
    if (p < 0 || !global.STIProfil || !autoriseElement(id(chapitreActif))) return;
    global.STIProfil.enregistrerLecture(matiere, chapitreActif, matiere.toUpperCase() + ' — ' + chapitres[p][1], Math.round((p+1)/chapitres.length*100), 'cours/'+matiere+'.html#'+chapitreActif);
    dernierChapitre = chapitreActif;
  }
  function actualiserProfil(synchroniserCases) {
    var p = profil(), etats = p && p.chapitres && p.chapitres[matiere] || {}, faits = p && p.exercicesFaits && p.exercicesFaits[matiere] || [];
    var accessibles = chapitres.filter(function (c) { return autoriseElement(id(c[0])); }), rev = 0;
    chapitres.forEach(function (c) {
      var section = id(c[0]), lien = $('.toc-link[href="#'+c[0]+'"]'), b = $('[data-toggle-revise="'+c[0]+'"]');
      var revise = etats[c[0]] === 'revise'; if (revise && autoriseElement(section)) rev++;
      var etat = revise ? 'revise' : (etats[c[0]] === 'en_cours' ? 'en_cours' : 'a_reviser');
      if (b) { b.setAttribute('aria-pressed',String(revise)); b.textContent = revise ? '✓ Chapitre révisé' : '☐ Marquer comme révisé'; }
      if (lien) { lien.dataset.state = etat; lien.classList.toggle('is-active', chapitreActif===c[0]);
        if (chapitreActif===c[0]) lien.setAttribute('aria-current','location'); else lien.removeAttribute('aria-current');
        var statut = $('.toc-link__status',lien); if (statut) statut.textContent = revise ? '✓ Révisé' : etat === 'en_cours' ? 'En cours' : 'À réviser'; }
    });
    var pct = accessibles.length ? Math.round(rev/accessibles.length*100) : 0;
    id('courseProgressPct').textContent = pct+'%'; id('courseProgressText').textContent = rev+' / '+accessibles.length+' chapitres révisés';
    id('courseRing').style.strokeDashoffset = String(100.53*(1-pct/100));
    var cases = $$('[data-exercise]').filter(autoriseElement), count = 0;
    cases.forEach(function (c) { var fait = faits.indexOf(c.dataset.exercise)!==-1; if (synchroniserCases === true) c.checked = fait; if(fait) count++; });
    id('exoProgressText').textContent = count+' / '+cases.length+' exercices faits'; id('tabExoCount').textContent = count+'/'+cases.length;
    id('exoProgressFill').style.width = (cases.length ? count/cases.length*100 : 0)+'%';
    var vus = p && p.videos && p.videos.vues || [];
    $$('[data-video-state]').forEach(function (el) { var vu = vus.indexOf(el.dataset.videoState)!==-1; el.textContent = vu ? '✓ Vue' : 'À découvrir'; el.classList.toggle('is-viewed',vu); });
  }
  function suiviDefilement() {
    var max = document.documentElement.scrollHeight-global.innerHeight;
    id('readingProgressBar').style.transform = 'scaleX('+(max>0?Math.min(1,global.scrollY/max):0)+')';
    id('back-to-top').classList.toggle('is-visible',global.scrollY>300);
    var candidates = chapitres.filter(function (c) { var s=id(c[0]); return autoriseElement(s) && !s.closest('[hidden]') && !s.classList.contains('matiere-search-hidden') && s.getBoundingClientRect().top<=190; });
    if (candidates.length) chapitreActif = candidates[candidates.length-1][0];
    if (chapitreActif!==dernierChapitre && !scrollTimer) scrollTimer=global.setTimeout(function () { scrollTimer=0; enregistrerLecture(); actualiserProfil(); },500);
  }

  /* ── Fenêtres : fond, Échap, focus, plein écran et poignée de redimensionnement ── */
  function ouvrirModal(nom, origine) {
    var e=id(nom); if (!e) return false;
    if (modal) fermerModal(false);
    modal=e; modalOrigine=origine || document.activeElement;
    e.hidden=false; e.style.display='';
    elementsInertes=[];
    Array.prototype.forEach.call(document.body.children, function (enfant) {
      if (enfant===e || enfant.contains(e)) return;
      elementsInertes.push([enfant,enfant.inert]); enfant.inert=true;
    });
    document.documentElement.classList.add('sti-modal-open'); document.body.classList.add('course-modal-open');
    if (nom==='recapModal' && global.STIProfil) global.STIProfil.enregistrerLaboratoire('php','recap-php');
    if (nom==='animModal' && global.STIProfil) global.STIProfil.enregistrerLaboratoire('php','guichet-php');
    if (nom==='sqlContraintesModal' && global.STIProfil) global.STIProfil.enregistrerLaboratoire('sql','contraintes-sql');
    if (nom==='animModal') {
      var audioPhp=id('phpCourseAudio');if(audioPhp)audioPhp.pause();
      notifierGuichet({type:'STI_OUVRIR_GUICHET',portrait:innerHeight>innerWidth || innerWidth<=768});
      global.setTimeout(function () { if (modal && modal.id==='animModal') notifierGuichet({type:'STI_OUVRIR_GUICHET',portrait:innerHeight>innerWidth || innerWidth<=768}); }, 250);
    }
    var b=$('[id$="Close"], [data-modal-close]',e), box=$('.anim-box, .sql-anim-box, [role="dialog"]',e);
    global.setTimeout(function () { if (modal===e) (b||box||e).focus(); },0);
    return true;
  }
  function fermerModal(rendreFocus) {
    if (!modal) return;
    var e=modal, origine=modalOrigine; modal=null; modalOrigine=null;
    if (e.id==='matiereVideoModal') { var v=id('modalVideo'); if (v) { v.pause(); v.removeAttribute('src'); v.load(); } }
    if (e.id==='animModal') notifierGuichet({type:'STI_STOP_GUICHET'});
    e.hidden=true; e.classList.remove('full');
    var plein=$('[id$="Full"]',e); if (plein) { plein.textContent='⛶ Plein écran'; plein.setAttribute('aria-pressed','false'); }
    elementsInertes.forEach(function (pair) { pair[0].inert=pair[1]; }); elementsInertes=[];
    document.documentElement.classList.remove('sti-modal-open'); document.body.classList.remove('course-modal-open');
    if (rendreFocus!==false && origine && origine.isConnected && !origine.closest('[hidden],[inert]')) origine.focus();
  }
  function focusDansModal(e) {
    if (!modal) return;
    if (e.key==='Escape') { e.preventDefault(); e.stopPropagation(); fermerModal(); return; }
    if (e.key!=='Tab') return;
    var liste=visibles(modal); if (!liste.length) { e.preventDefault(); var box=$('.anim-box, .sql-anim-box, [role="dialog"]',modal); if(box) box.focus(); return; }
    var premier=liste[0], dernier=liste[liste.length-1];
    if (e.shiftKey && (document.activeElement===premier || !modal.contains(document.activeElement))) { e.preventDefault(); dernier.focus(); }
    else if (!e.shiftKey && (document.activeElement===dernier || !modal.contains(document.activeElement))) { e.preventDefault(); premier.focus(); }
  }
  function notifierGuichet(message) {
    var f=id('animFrame');
    if (f && f.contentWindow) { try { f.contentWindow.postMessage(message,global.location.origin); } catch (e) {} }
  }
  function definirPleinEcran(e, plein) {
    if (!e) return; e.classList.toggle('full',plein);
    var b=$('[id$="Full"]',e); if (b) { b.textContent=plein?'⤡ Réduire':'⛶ Plein écran'; b.setAttribute('aria-pressed',String(plein)); }
    if (e.id==='animModal') notifierGuichet({type:'STI_ETAT_PLEIN_ECRAN_GUICHET',full:plein});
  }
  function brancherIframe(f) {
    f.addEventListener('load',function () {
      try {
        var doc=f.contentDocument; if(!doc || doc.__stiModalFocusBound) return; doc.__stiModalFocusBound=true;
        // Les boutons de retour historiques ne doivent pas recharger le cours dans l'iframe.
        doc.addEventListener('click',function (ev) {
          var retour=ev.target && ev.target.closest && ev.target.closest('#btn-retour-cours-php');
          if (retour && modal && modal.contains(f)) { ev.preventDefault(); ev.stopImmediatePropagation(); fermerModal(); }
        },true);
        if (f.id==='animFrame' && modal && modal.id==='animModal') notifierGuichet({type:'STI_OUVRIR_GUICHET',portrait:innerHeight>innerWidth || innerWidth<=768});
        doc.addEventListener('keydown',function (e) {
          if (!modal || !modal.contains(f)) return;
          if (e.key==='Escape') { e.preventDefault(); fermerModal(); return; }
          if (e.key!=='Tab') return;
          var list=visibles(doc), active=doc.activeElement, parentList=visibles(modal), pos=parentList.indexOf(f);
          if (list.length && e.shiftKey && active===list[0]) { e.preventDefault(); (parentList[pos-1]||parentList[parentList.length-1]).focus(); }
          else if (list.length && !e.shiftKey && active===list[list.length-1]) { e.preventDefault(); (parentList[pos+1]||parentList[0]).focus(); }
        },true);
        if (matiere==='sql' && f.id==='sqlContraintesFrame' && f.contentWindow.__applySqlAnimTheme) f.contentWindow.__applySqlAnimTheme(document.documentElement.dataset.theme==='sombre');
      } catch (err) { /* Une page intégrée différente ne doit pas bloquer la fenêtre. */ }
    });
  }
  function brancherRedimensionnement(handle) {
    handle.addEventListener('keydown', function (event) {
      if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) return;
      var box = handle.parentElement; if (box.parentElement.classList.contains('full')) return;
      event.preventDefault(); event.stopPropagation();
      var rect = box.getBoundingClientRect(), pas = event.shiftKey ? 60 : 20;
      var rtl = getComputedStyle(box).direction === 'rtl';
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        var sens = (event.key === 'ArrowRight' ? 1 : -1) * (rtl ? -1 : 1);
        box.style.width = Math.max(Math.min(320,innerWidth*.95),Math.min(innerWidth*.96,rect.width + sens*pas))+'px';
      } else {
        var dy = event.key === 'ArrowDown' ? pas : -pas;
        box.style.height = Math.max(Math.min(300,innerHeight*.8),Math.min(innerHeight*.92,rect.height + dy))+'px';
      }
    });
    handle.addEventListener('pointerdown',function (event) {
      var box=handle.parentElement, overlay=box.parentElement; if (overlay.classList.contains('full')) return;
      event.preventDefault(); var x=event.clientX,y=event.clientY, rect=box.getBoundingClientRect(), rtl=getComputedStyle(box).direction==='rtl';
      handle.setPointerCapture(event.pointerId);
      function move(ev) { var dx=(ev.clientX-x)*(rtl?-1:1),dy=ev.clientY-y; box.style.width=Math.max(320,Math.min(innerWidth*.96,rect.width+dx))+'px'; box.style.height=Math.max(300,Math.min(innerHeight*.92,rect.height+dy))+'px'; }
      function end() { handle.removeEventListener('pointermove',move); handle.removeEventListener('pointerup',end); handle.removeEventListener('pointercancel',end); }
      handle.addEventListener('pointermove',move); handle.addEventListener('pointerup',end); handle.addEventListener('pointercancel',end);
    });
  }
  function ongletSolution(prefixe, nom) {
    ['html','js','php'].forEach(function (n) { var panel=id(prefixe+'Panel-'+n); if(panel) panel.hidden=n!==nom;
      $$('[data-'+(prefixe==='sol'?'sol':'sol2')+']',id(prefixe+'Modal')).forEach(function (b) { var active=b.dataset[prefixe==='sol'?'sol':'sol2']===nom; b.setAttribute('aria-pressed',String(active)); });
    });
    var body=$('.anim-body',id(prefixe+'Modal')); if(body) body.scrollTop=0;
  }

  /* ── Coloration native, numéros de lignes et tableaux défilables ── */
  function colorer(texte) {
    var re=/(<!--[\s\S]*?-->|\/\*[\s\S]*?\*\/|\/\/[^\n]*|--[^\n]*|#[^\n]*|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|<\/?[a-zA-Z][^>]*>|\$[a-zA-Z_][\w]*|\b(?:SELECT|FROM|WHERE|CREATE|TABLE|ALTER|DROP|DATABASE|PRIMARY|FOREIGN|KEY|REFERENCES|JOIN|ON|INSERT|INTO|VALUES|UPDATE|DELETE|GROUP|BY|HAVING|ORDER|AS|NOT|NULL|AND|OR|IN|DISTINCT|LIMIT|echo|print|function|return|if|else|foreach|while|array|true|false|isset|define|include|require|mysqli_connect|mysqli_query|mysqli_fetch_array|mysqli_close)\b|\b\d+(?:\.\d+)?\b)/gi;
    var resultat='',pos=0,m;
    while((m=re.exec(texte))) { resultat+=echapper(texte.slice(pos,m.index)); var token=m[0], cls=/^(?:<!--|\/\*|\/\/|--|#)/.test(token)?'tok-comment':/^['"]/.test(token)?'tok-val':/^</.test(token)?'tok-tag':/^(?:\$|\d)/.test(token)?'tok-attr':'tok-kw'; resultat+='<span class="'+cls+'">'+echapper(token)+'</span>'; pos=m.index+token.length; }
    return resultat+echapper(texte.slice(pos));
  }
  function preparerCode() {
    $$('.legacy-sql pre, .legacy-php pre').forEach(function (pre,i) {
      if(pre.closest('.sql-janim-wrap') || pre.closest('.code-box')) return;
      var code=$('code',pre), texte=code?code.textContent:pre.textContent;
      var box=document.createElement('div'); box.className='code-box';
      var bar=document.createElement('div'); bar.className='code-box__bar';
      var meta=document.createElement('span'); meta.className='code-box__meta'; meta.textContent=matiere.toUpperCase()+' · exemple '+(i+1);
      var copy=document.createElement('button'); copy.type='button'; copy.className='code-box__btn'; copy.textContent='Copier'; copy.setAttribute('aria-label','Copier le code de l’exemple '+(i+1));
      copy.addEventListener('click',function () {
        function fait() { copy.textContent='Copié ✓'; global.setTimeout(function () {copy.textContent='Copier';},1500); }
        function secours() { var t=document.createElement('textarea'); t.value=texte; t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.select();var ok=false;try{ok=document.execCommand('copy');}catch(e){}t.remove();if(ok)fait();else {copy.textContent='Copie impossible';global.setTimeout(function(){copy.textContent='Copier';},1500);} }
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(texte).then(fait,secours); else secours();
      });
      bar.appendChild(meta);bar.appendChild(copy);var scroll=document.createElement('div');scroll.className='matiere-code-scroll';scroll.tabIndex=0;scroll.setAttribute('role','region');scroll.setAttribute('aria-label','Code '+matiere.toUpperCase()+' défilable, exemple '+(i+1));
      var gutter=document.createElement('span');gutter.className='matiere-code-gutter';gutter.setAttribute('aria-hidden','true');gutter.textContent=texte.split('\n').map(function (_,n){return n+1;}).join('\n');
      pre.parentNode.insertBefore(box,pre);box.appendChild(bar);box.appendChild(scroll);scroll.appendChild(gutter);scroll.appendChild(pre);
      if(code) code.innerHTML=colorer(texte); else pre.innerHTML=colorer(texte);
    });
  }
  function preparerTables() {
    $$('.legacy-php .diagram').forEach(function(r){r.tabIndex=0;r.setAttribute('role','region');r.setAttribute('aria-label','Schéma défilable');});
    $$('.legacy-sql table, .legacy-php table').forEach(function (table) {
      if(table.closest('.sql-janim-wrap') || table.parentElement.classList.contains('table-scroll')) return;
      var wrap=document.createElement('div');wrap.className='table-scroll';wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label','Tableau défilable');
      table.parentNode.insertBefore(wrap,table);wrap.appendChild(table);table.querySelectorAll('th').forEach(function (th) { if(!th.hasAttribute('scope'))th.setAttribute('scope','col'); });
    });
  }

  /* ── Vidéos locales : position, reprise et états dans STIProfil ── */
  function enregistrerVideo(v, terminee) {
    if(!v || !v.dataset.videoId || !global.STIProfil || (!terminee && (!isFinite(v.currentTime) || v.currentTime<2))) return;
    global.STIProfil.enregistrerPositionVideo({id:v.dataset.videoId,matiere:matiere,titre:v.dataset.videoTitle||v.dataset.videoId,temps:v.currentTime,duree:isFinite(v.duration)?v.duration:0,terminee:!!terminee,secondaire:v.dataset.videoId!==(matiere==='sql'?'sql-cours':'php-synthese'),url:'cours/'+matiere+'.html#videos'});
    v.__dernierSave=Math.floor(v.currentTime); actualiserProfil();
  }
  function preparerVideo(v) {
    if(!v || v.__matiereReady)return;v.__matiereReady=true;
    v.addEventListener('loadedmetadata',function () { var p=profil(), position=p && p.videos && p.videos.positions && p.videos.positions[v.dataset.videoId];
      if(position>2 && isFinite(v.duration) && position<v.duration-2) { try{v.currentTime=position;}catch(e){} } });
    v.addEventListener('play',function () { $$('video').forEach(function (autre) { if(autre!==v && !autre.paused)autre.pause(); });
      if(global.STISQLVoix && !global.STISQLVoix.audio.paused) global.arreterVoixSqlSTI();var audioPhp=id('phpCourseAudio');if(audioPhp && !audioPhp.paused)audioPhp.pause(); });
    v.addEventListener('timeupdate',function () { if(!v.paused && Math.abs(v.currentTime-(v.__dernierSave||0))>=5)enregistrerVideo(v,false);
      if(v.id==='featuredVideo' && matiere==='php') { var chips=$$('[data-featured-time]'); var actif=null; chips.forEach(function(b){if(Number(b.dataset.featuredTime)<=v.currentTime)actif=b;});chips.forEach(function(b){b.classList.toggle('is-active',b===actif);}); }
      if(v.id==='modalVideo') synchroniserChapitresVideo(v);
    });
    v.addEventListener('pause',function () { if(!v.ended)enregistrerVideo(v,false); });
    v.addEventListener('ended',function () { enregistrerVideo(v,true); });
  }
  function synchroniserChapitresVideo(v) {
    var reperes=(global.STI_REPERES_MATIERES || {})[v.dataset.videoId] || [], index=-1;
    reperes.forEach(function (r,i) { if (v.currentTime>=r.t) index=i; });
    if (v.__chapitreActif===index) return; v.__chapitreActif=index;
    $$('#modalVideoChapters button').forEach(function (b,i) { var actif=i===index;b.classList.toggle('is-active',actif);if(actif)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current'); });
    id('modalVideoChapterStatus').textContent=index>=0 ? 'En cours : '+reperes[index].label : '';
  }
  function construireChapitresVideo(slug,v) {
    var zone=id('modalVideoChapters');zone.replaceChildren();v.__chapitreActif=-2;id('modalVideoChapterStatus').textContent='';
    ((global.STI_REPERES_MATIERES || {})[slug] || []).forEach(function (r) {
      var b=document.createElement('button');b.type='button';b.className='video-chapter-chip';b.textContent=r.short;b.title=r.label;
      b.addEventListener('click',function(){try{v.currentTime=r.t;var p=v.play();if(p&&p.catch)p.catch(function(){});}catch(e){}synchroniserChapitresVideo(v);});zone.appendChild(b);
    });
    synchroniserChapitresVideo(v);
  }
  function ouvrirVideo(slug,titre,position) {
    if(slug==='guichet')slug='php-guichet';
    var vinfo=videos[slug];
    if(!vinfo || (matiere==='sql' && slug.indexOf('sql-')!==0) || (matiere==='php' && slug.indexOf('php-')!==0)) {
      return typeof videoHistorique==='function' ? videoHistorique.apply(global,arguments) : false;
    }
    // La décision reste celle d'acces.js : la classe est appliquée par son verrou.
    if ((slug==='sql-serie4'||slug==='sql-serie5') && !autoriseBac()) return false;
    if(global.arreterVoixSqlSTI)global.arreterVoixSqlSTI();var audioPhp=id('phpCourseAudio');if(audioPhp)audioPhp.pause();
    var fSql=id('sqlContraintesFrame');if(fSql&&fSql.contentWindow)fSql.contentWindow.postMessage({type:'STI_STOP_SQL'},global.location.origin);
    if(modal&&modal.id==='animModal')notifierGuichet({type:'STI_STOP_GUICHET'});
    var v=id('modalVideo');v.dataset.videoId=slug;v.dataset.videoTitle=vinfo[0];v.__dernierSave=0;
    id('matiereVideoTitle').textContent=titre||vinfo[0];v.poster=vinfo[2];v.src=vinfo[1];id('modalVideoDownload').href=vinfo[1];
    construireChapitresVideo(slug,v);v.playbackRate=Number(id('modalVideoRate').value)||1;
    if(!ouvrirModal('matiereVideoModal',document.activeElement))return false;
    if(Number(position)>0) v.addEventListener('loadedmetadata',function auChargement(){v.removeEventListener('loadedmetadata',auChargement);try{v.currentTime=Number(position);}catch(e){}},{once:true});
    var promesse=v.play();if(promesse && promesse.catch)promesse.catch(function(){});return true;
  }

  /* ── SQL : guide, tableau de bord enseignant, explorateur et éditeur ── */
  function preparerOngletsAnimations() {
    $$('.legacy-sql .table-wrap, .legacy-sql .ldd-diagram-scroll').forEach(function(r){r.tabIndex=0;r.setAttribute('role','region');if(!r.hasAttribute('aria-label'))r.setAttribute('aria-label','Tableau animé défilable');});
    $$('.sql-janim-tabs[role=tablist]').forEach(function (groupe) {
      var boutons=$$('button.sql-janim-tab',groupe);
      function maj() { boutons.forEach(function (b) { var actif=b.classList.contains('active');b.setAttribute('role','tab');b.setAttribute('aria-selected',String(actif));b.tabIndex=actif?0:-1; }); }
      maj();boutons.forEach(function(b){new MutationObserver(maj).observe(b,{attributes:true,attributeFilter:['class']});});
      groupe.addEventListener('keydown',function(e) { if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;var i=boutons.indexOf(e.target);if(i<0)return;e.preventDefault();
        var rtl=getComputedStyle(groupe).direction==='rtl';if(e.key==='Home')i=0;else if(e.key==='End')i=boutons.length-1;else i=(i+(e.key==='ArrowRight'?(rtl?-1:1):(rtl?1:-1))+boutons.length)%boutons.length;boutons[i].click();boutons[i].focus();
      });
    });
  }
  function preparerAudioPhp() {
    var audio=id('phpCourseAudio'), select=id('phpAudioChapitres');if(!audio||!select)return;
    var reperes=(global.STI_REPERES_MATIERES||{})['php-cours']||[], dernier=-1;
    reperes.forEach(function(r,i){var option=document.createElement('option');option.value=String(i);option.textContent=r.label;select.appendChild(option);});
    select.addEventListener('change',function(){var index=Number(select.value);if(select.value===''||!reperes[index])return;audio.currentTime=reperes[index].t;var p=audio.play();if(p&&p.catch)p.catch(function(){});});
    audio.addEventListener('play',function(){$$('video').forEach(function(v){if(!v.paused)v.pause();});});
    audio.addEventListener('timeupdate',function(){var index=-1;reperes.forEach(function(r,i){if(audio.currentTime>=r.t)index=i;});if(index===dernier)return;dernier=index;select.value=index<0?'':String(index);id('phpAudioStatus').textContent=index<0?'':'En cours : '+reperes[index].label;});
  }
  function preparerGuideSql() {
    if(!global.STISQLVoix)return;
    var voix=global.STISQLVoix, audio=voix.audio, reperes=voix.reperes, dernier='';
    audio.addEventListener('play',function () { $$('video').forEach(function(v){if(!v.paused)v.pause();}); });
    audio.addEventListener('timeupdate',function () {
      var ids=['intro','intro-cles','ldd','ldd-create','lmd','lmd-select','lmd-jointure','lmd-groupby','lmd-having'], actuel='';
      ids.forEach(function(k){if(reperes[k] && audio.currentTime>=reperes[k][0])actuel=k;});
      if(actuel===dernier)return;dernier=actuel;
      $$('[data-guide-key]').forEach(function(b){var active=b.dataset.guideKey===actuel;b.classList.toggle('is-active',active);if(active)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current');});
      $$('.guide-current').forEach(function(e){e.classList.remove('guide-current');});
      var cible=id(actuel);if(cible && autoriseElement(cible)) { cible.classList.add('guide-current');
        if (id('sqlGuideFollow').checked && onglet==='cours' && !modal && !audio.paused) cible.scrollIntoView({block:'center',behavior:global.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
      }
      var bouton=$('[data-guide-key="'+actuel+'"]');if(bouton)id('sqlGuideStatus').textContent='En cours : '+bouton.textContent;
    });
  }
  function tableauClasse() {
    var cases=$$('.bord-notion');if(!cases.length)return;
    // Index stables : les cases de classe partagent le profil, mais restent distinctes des TP.
    var faits=(profil() && profil().exercicesFaits.sql)||[];
    cases.forEach(function(c,i){c.dataset.bordId='notion-classe-'+(i+1);c.checked=faits.indexOf(c.dataset.bordId)!==-1;});
    function maj() { var groupes={},n=0;cases.forEach(function(c){var g=c.dataset.groupe;if(!groupes[g])groupes[g]=[0,0];groupes[g][1]++;if(c.checked){groupes[g][0]++;n++;}});
      $$('.bord-barre').forEach(function(b){var a=groupes[b.dataset.groupe]||[0,1];b.style.width=Math.round(a[0]/a[1]*100)+'%';});
      $$('.bord-pct').forEach(function(b){var a=groupes[b.dataset.groupe]||[0,1];b.textContent=Math.round(a[0]/a[1]*100)+' %';});
      var pct=Math.round(n/cases.length*100);id('bord-global-barre').style.width=pct+'%';id('bord-global-pct').textContent=pct+' %';id('bord-global-txt').textContent='('+n+' / '+cases.length+' notions)'; }
    synchroniserTableauClasse=function(){var p=profil(),faits=p&&p.exercicesFaits.sql||[];cases.forEach(function(c){c.checked=faits.indexOf(c.dataset.bordId)!==-1;});maj();};
    cases.forEach(function(c){c.addEventListener('change',function(){if(global.STIProfil)global.STIProfil.basculerExerciceFait('sql',c.dataset.bordId,c.checked);maj();});});
    [['bord-tout',true],['bord-reset',false]].forEach(function(pair){var b=id(pair[0]);if(b)b.addEventListener('click',function(){cases.forEach(function(c){if(c.checked!==pair[1]){c.checked=pair[1];if(global.STIProfil)global.STIProfil.basculerExerciceFait('sql',c.dataset.bordId,c.checked);}});maj();});});maj();
  }
  function preparerPackSql() {
    var bouton=id('pack-offline'), info=id('pack-offline-txt');if(!bouton||!info)return;
    // Préparation volontaire : les vidéos et les audios volumineux ne sont pas téléchargés.
    var fichiers=['./sql.html','../documents/enonces/enonce-serie4-a4.html','../documents/enonces/enonce-serie5-a4.html',
      '../exercices/sql/Tp4-correction-bd.html','../exercices/sql/Tp-date-ssr-j-gp-correction-bd.html',
      '../assets/images/sql-serie4-poster.jpg','../assets/images/sql-serie5-poster.jpg',
      '../assets/css/theme.css','../assets/css/cours.css','../assets/css/cours-matieres.css','../assets/css/cours-sql-heritage.css','../assets/css/protection.css',
      '../assets/fonts/inter-var.woff2','../assets/fonts/jetbrains-mono-var.woff2',
      '../assets/js/config.js','../assets/js/supabase-umd.js','../assets/js/acces.js','../assets/js/sync-progressions.js','../assets/js/profil.js','../assets/js/app.js','../assets/js/protection.js',
      '../assets/js/cours-matieres.js','../assets/js/cours-media-reperes.js','../assets/js/cours-sql-animations.js','../assets/js/cours-sql-voix.js','../assets/js/cours-sql-worker.js',
      '../assets/js/sqljs/sql-wasm.js','../assets/js/sqljs/sql-wasm.wasm'];
    bouton.addEventListener('click',function(){
      if(!autoriseBac()){info.textContent='Ressource réservée à la 4ème SI.';return;}
      if(!('caches' in global)||!('serviceWorker' in navigator)){info.textContent='⚠️ Le hors-ligne n’est pas pris en charge par ce navigateur.';return;}
      bouton.disabled=true;info.textContent='⏳ Préparation du pack hors-ligne…';
      navigator.serviceWorker.register('../sw.js',{updateViaCache:'none'}).then(function(){return navigator.serviceWorker.ready;}).then(function(){return caches.keys();}).then(function(noms){
        var valides=noms.filter(function(n){return /^sti-atelier-v\d+$/.test(n);});
        valides.sort(function(a,b){return parseInt(b.slice(b.lastIndexOf('v')+1),10)-parseInt(a.slice(a.lastIndexOf('v')+1),10);});
        if(!valides.length)throw new Error('Cache indisponible');return caches.open(valides[0]);
      }).then(function(cache){return Promise.all(fichiers.map(function(f){return cache.add(new URL(f,location.href).href).then(function(){return true;},function(){return false;});}));
      }).then(function(resultats){var manquants=resultats.filter(function(r){return !r;}).length;
        if(manquants)info.textContent='⚠️ Préparation partielle : '+manquants+' ressource(s) non téléchargée(s). Vérifiez la connexion puis réessayez.';
        else if(!navigator.serviceWorker.controller)info.textContent='✓ Fichiers téléchargés. Rechargez la page en ligne pour activer le hors-ligne.';
        else info.textContent='✅ Hors-ligne prêt : rouvrez ces pages sans connexion.';
      }).catch(function(){info.textContent='⚠️ Impossible de préparer le hors-ligne. Vérifiez la connexion puis réessayez.';}).finally(function(){bouton.disabled=false;});
    });
  }
  function explorerSql() {
    var box=id('hero-stats-explorer');if(!box)return;
    var secs=chapitres.map(function(c){return id(c[0]);}).filter(autoriseElement);
    var cards=secs.flatMap(function(s){return Array.from(s.querySelectorAll(':scope > .card'));}), pres=secs.flatMap(function(s){return Array.from(s.querySelectorAll('pre'));});
    id('stat-parts').textContent=secs.length;id('stat-cards').textContent=cards.length;id('stat-sql').textContent=pres.length;
    cards.forEach(function(c,i){if(!c.id)c.id='sql-fiche-'+(i+1);});pres.forEach(function(p,i){if(!p.id)p.id='sql-requete-'+(i+1);});
    $$('.hero-stats .stat').forEach(function(b){b.addEventListener('click',function(){
      var mode=b.dataset.mode;if(box.dataset.mode===mode){box.dataset.mode='';box.classList.remove('open');box.replaceChildren();return;}
      box.dataset.mode=mode;box.classList.add('open');box.replaceChildren();var h=document.createElement('h3');h.textContent=mode==='parts'?'Parties du cours':mode==='cards'?'Fiches de révision':'Requêtes du cours';box.appendChild(h);
      var wrap=document.createElement('div');wrap.className='hero-exp-grid';box.appendChild(wrap);
      (mode==='parts'?secs:mode==='cards'?cards:pres).forEach(function(el,i){var a=document.createElement('a');a.className='hero-exp-item';a.href='#'+el.id;
        var title=el.querySelector('h2,h3')||el.closest('.card')?.querySelector('h3');a.textContent=(i+1)+'. '+(title?title.textContent.trim():(el.tagName==='PRE'?'Exemple SQL':'Fiche'));wrap.appendChild(a);});
    });});
  }
  function executerSQL() {
    var sortie=id('sqlResult'), texte=id('sqlEditor').value; if(!global.Worker){sortie.textContent='Votre navigateur ne prend pas en charge le moteur SQL local.';return;}
    if(worker)worker.terminate();clearTimeout(attenteWorker);worker=new Worker('../assets/js/cours-sql-worker.js');sortie.textContent='Exécution en cours…';
    attenteWorker=global.setTimeout(function(){if(worker){worker.terminate();worker=null;sortie.textContent='Requête interrompue : délai de 5 secondes dépassé.';}},5000);
    worker.onmessage=function(event){clearTimeout(attenteWorker);worker.terminate();worker=null;var data=event.data||{};sortie.replaceChildren();
      if(data.erreur){sortie.textContent=data.erreur;return;}
      if(!data.resultats || !data.resultats.length){sortie.textContent='Requête exécutée sur la base temporaire. Lignes modifiées : '+(data.modifications||0)+'.';return;}
      data.resultats.forEach(function(r){var wrap=document.createElement('div');wrap.className='table-scroll';wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label','Résultat SQL défilable');
        var table=document.createElement('table'),head=document.createElement('thead'),tr=document.createElement('tr');r.colonnes.forEach(function(col){var th=document.createElement('th');th.scope='col';th.textContent=col;tr.appendChild(th);});head.appendChild(tr);table.appendChild(head);
        var body=document.createElement('tbody');r.lignes.forEach(function(l){var row=document.createElement('tr');l.forEach(function(val){var td=document.createElement('td');td.textContent=val==null?'NULL':String(val);row.appendChild(td);});body.appendChild(row);});table.appendChild(body);wrap.appendChild(table);sortie.appendChild(wrap);
        var note=document.createElement('p');note.textContent=r.lignes.length+' ligne(s) affichée(s)'+(r.tronque?' (limite : 100)':'')+'.';sortie.appendChild(note);});
    };
    worker.onerror=function(){clearTimeout(attenteWorker);if(worker)worker.terminate();worker=null;sortie.textContent='Impossible de charger le moteur SQL local.';};worker.postMessage({sql:texte});
  }
  function scorePHP() {
    if(!global.STIProfil)return; var bonnes=[0,2,1,0,1,2,1,2,1,2],score=0,erreurs=[];
    $$('.synth-question').forEach(function(fs,i){var checked=$('input[type=radio]:checked',fs);if(checked && Number(checked.value)===bonnes[i])score++;else erreurs.push('Question '+(i+1));});
    var p=profil(), historique=(p.quiz||[]).slice();historique.push({matiere:'PHP — Quiz de synthèse',score:score,total:10,date:new Date().toISOString(),erreurs:erreurs});
    global.STIProfil.mettreAJour('quiz',historique);
  }

  function init() {
    preparerCode();preparerTables();$$('.matiere-resize').forEach(brancherRedimensionnement);$$('.legacy-modals iframe').forEach(brancherIframe);
    preparerVideo(id('featuredVideo'));preparerVideo(id('modalVideo'));
    id('modalVideoRate').addEventListener('change',function(){id('modalVideo').playbackRate=Number(this.value)||1;});
    id('modalVideoFull').addEventListener('click',function(){var v=id('modalVideo');if(v.requestFullscreen){var p=v.requestFullscreen();if(p&&p.catch)p.catch(function(){});}else if(v.webkitEnterFullscreen)v.webkitEnterFullscreen();});
    var synth=id('videoSynthese');if(synth){synth.dataset.videoId='php-synthese';synth.dataset.videoTitle='Synthèse PHP';preparerVideo(synth);}
    if(matiere==='sql'){preparerOngletsAnimations();preparerGuideSql();tableauClasse();preparerPackSql();explorerSql();}else preparerAudioPhp();
    videoHistorique=global.ouvrirVideoPasAPasSTI;global.ouvrirVideoPasAPasSTI=ouvrirVideo;
    $$('[data-course-tab]').forEach(function(b){b.addEventListener('click',function(){ouvrirOnglet(b.dataset.courseTab,true);id(b.dataset.courseTab).scrollIntoView({block:'start',behavior:'smooth'});});
      b.addEventListener('keydown',function(e){if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();var arr=$$('[data-course-tab]'),i=arr.indexOf(b),rtl=getComputedStyle(b).direction==='rtl';if(e.key==='Home')i=0;else if(e.key==='End')i=arr.length-1;else i=(i+(e.key==='ArrowRight'?(rtl?-1:1):(rtl?1:-1))+arr.length)%arr.length;arr[i].click();arr[i].focus();});});
    id('tocMobileOpenBtn').addEventListener('click',ouvrirSommaire);id('tocMobileCloseBtn').addEventListener('click',function(){fermerSommaire(true);});id('courseSidebarBackdrop').addEventListener('click',function(){fermerSommaire(true);});
    id('courseSearchInput').addEventListener('input',filtrer);id('back-to-top').addEventListener('click',function(){global.scrollTo({top:0,behavior:'smooth'});});global.addEventListener('resize',function(){fermerSommaire(false);});
    $$('[data-toggle-revise]').forEach(function(b){b.addEventListener('click',function(){var etat=b.getAttribute('aria-pressed')==='true'?'a_reviser':'revise';if(global.STIProfil)global.STIProfil.definirEtatChapitre(matiere,b.dataset.toggleRevise,etat,chapitres.filter(function(c){return autoriseElement(id(c[0]));}).length);actualiserProfil();});});
    $$('[data-exercise]').forEach(function(c){c.addEventListener('change',function(){if(global.STIProfil)global.STIProfil.basculerExerciceFait(matiere,c.dataset.exercise,c.checked);actualiserProfil();});});
    $$('[data-featured-time]').forEach(function(b){b.addEventListener('click',function(){var v=id('featuredVideo');v.currentTime=Number(b.dataset.featuredTime);var p=v.play();if(p&&p.catch)p.catch(function(){});});});
    var quiz=id('btnCorrigerQuiz');if(quiz)quiz.addEventListener('click',scorePHP);
    var run=id('runSql');if(run)run.addEventListener('click',executerSQL);var reset=id('resetSql');if(reset)reset.addEventListener('click',function(){id('sqlEditor').value='SELECT nom, moyenne FROM eleves WHERE moyenne >= 10 ORDER BY moyenne DESC;';id('sqlResult').textContent='Prêt : table eleves (id, nom, moyenne, classe).';});
    document.addEventListener('click',function(e){
      var bouton=e.target.closest('button');
      if(bouton){
        var video=bouton.dataset.videoOpen;if(video){global.ouvrirVideoPasAPasSTI(video);return;}
        var ouverture=bouton.dataset.modalOpen || ({btnSqlContraintes:'sqlContraintesModal',animOpen:'animModal',btnExoS10:'exoModal',btnExoS11:'exo2Modal'})[bouton.id];
        if(bouton.classList.contains('btn-ouvrir-enonce'))ouverture='exoModal';if(bouton.classList.contains('btn-ouvrir-enonce2'))ouverture='exo2Modal';
        if(bouton.classList.contains('sol-open')){ongletSolution('sol',bouton.dataset.sol||'html');ouverture='solModal';}
        if(bouton.classList.contains('sol2-open')){ongletSolution('sol2',bouton.dataset.sol2||'html');ouverture='sol2Modal';}
        if(bouton.classList.contains('sol-tab')){ongletSolution('sol',bouton.dataset.sol);return;}
        if(bouton.classList.contains('sol2-tab')){ongletSolution('sol2',bouton.dataset.sol2);return;}
        if(ouverture){e.preventDefault();ouvrirModal(ouverture,bouton);return;}
        if(bouton.dataset.guideKey && global.STISQLVoix){global.STISQLVoix.jouer(bouton.dataset.guideKey);return;}
        if(modal && (bouton.hasAttribute('data-modal-close') || /(?:Close|RetourCours)$/.test(bouton.id) || bouton.id==='sqlContraintesRetour')){e.preventDefault();fermerModal();return;}
        if(modal && /Full$/.test(bouton.id)){definirPleinEcran(modal,!modal.classList.contains('full'));return;}
      }
      if(modal && e.target===modal){fermerModal();return;}
      var a=e.target.closest('a[href^="#"]'); if(!a || e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
      var fragment=a.getAttribute('href').slice(1);if(!fragment)return;
      if(id(fragment)||tabs.indexOf(fragment)!==-1){e.preventDefault();if(modal)fermerModal(false);naviguer(fragment,true,true);}
    });
    document.addEventListener('keydown',function(e){if(modal){focusDansModal(e);return;}if(e.key==='Escape')fermerSommaire(true);},true);
    global.addEventListener('message',function (event) {
      var frame=id('animFrame');
      // Seule l'animation locale ouverte est autorisée à piloter sa fenêtre.
      if (!modal || modal.id!=='animModal' || !frame || event.source!==frame.contentWindow || event.origin!==global.location.origin || !event.data) return;
      if (event.data.type==='STI_FERMER_MODALE_PHP') fermerModal();
      else if (event.data.type==='STI_BASCULER_PLEIN_ECRAN_GUICHET') definirPleinEcran(modal,!modal.classList.contains('full'));
      else if (event.data.type==='STI_PLEIN_ECRAN_GUICHET') definirPleinEcran(modal,true);
    });
    global.addEventListener('hashchange',route);global.addEventListener('popstate',route);global.addEventListener('scroll',suiviDefilement,{passive:true});
    global.addEventListener('sti:profil-maj',actualiserProfil);global.addEventListener('sti:session-maj',actualiserProfil);
    new MutationObserver(actualiserProfil).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
    global.addEventListener('storage', function (event) { if (event.key === global.STIProfil.CLE_STOCKAGE) { actualiserProfil(true);if(synchroniserTableauClasse)synchroniserTableauClasse(); } });
    fermerSommaire(false);route();actualiserProfil(true);suiviDefilement();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window, document);
