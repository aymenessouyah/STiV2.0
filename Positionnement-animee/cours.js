/* ============================================================
   cours.js — le « lecteur » du cours
   ------------------------------------------------------------
   Fichier volontairement séparé : ni les balises ni les propriétés
   utilisées ici ne concernent l'annexe. index.html et style.css
   restent 100 % conformes (seuls <script src> et les attributs
   d'événements onclick / onkeydown de l'annexe HTML5 sont utilisés).
   ============================================================ */

var etape = 0;
var temps = 0;
var introPosActive = false;
var auto = false;
var minuteur = null;
var zone = null;
var sens = 1;
var animation = null;
var enPause = false;
var theme = 'sombre';
var format = 'bureau';
var LARGEUR_MOBILE = 780;

/* ---------- définition des temps de chaque étape ---------- */
var COURS = [
  { id: 'flux', titre: 'Le flux normal', temps: [
    { nh: 2, nc: 5, hh: [], hc: [2, 3] },
    { nh: 3, nc: 5, hh: [2], hc: [] },
    { nh: 5, nc: 5, hh: [3, 4], hc: [] },
    { nh: 7, nc: 5, hh: [5, 6], hc: [] }
  ] },
  { id: 'block', titre: 'display: block', temps: [
    { nh: 5, nc: 9, hh: [], hc: [4, 5, 6, 7] },
    { nh: 5, nc: 13, hh: [], hc: [11] },
    { nh: 5, nc: 18, hh: [], hc: [15, 16] }
  ] },
  { id: 'inline', titre: 'display: inline', temps: [
    { nh: 7, nc: 5, hh: [], hc: [1] },
    { nh: 7, nc: 10, hh: [], hc: [7, 8] },
    { nh: 7, nc: 14, hh: [], hc: [12] },
    { nh: 7, nc: 18, hh: [], hc: [16] }
  ] },
  { id: 'ib', titre: 'display: inline-block', temps: [
    { nh: 6, nc: 7, hh: [], hc: [1, 2, 3] },
    { nh: 6, nc: 7, hh: [1, 2, 3], hc: [] },
    { nh: 6, nc: 11, hh: [], hc: [9] }
  ] },
  { id: 'stat', titre: 'position: static (le défaut)', temps: [
    { nh: 3, nc: 1, hh: [1], hc: [] },
    { nh: 3, nc: 5, hh: [], hc: [1, 2, 3] }
  ] },
  { id: 'rel', titre: 'position: relative', temps: [
    { nh: 3, nc: 3, hh: [], hc: [1] },
    { nh: 3, nc: 8, hh: [], hc: [5, 6] },
    { nh: 3, nc: 14, hh: [], hc: [10, 11, 12] }
  ] },
  { id: 'abs', titre: 'position: absolute', temps: [
    { nh: 5, nc: 4, hh: [], hc: [0, 1] },
    { nh: 5, nc: 9, hh: [], hc: [4, 5, 6, 7] },
    { nh: 5, nc: 13, hh: [], hc: [11] }
  ] },
  { id: 'fixe', titre: 'position: fixed', temps: [
    { nh: 5, nc: 1, hh: [2], hc: [] },
    { nh: 5, nc: 5, hh: [], hc: [1, 2, 3] }
  ] },
  { id: 'sticky', titre: 'position: sticky', temps: [
    { nh: 7, nc: 4, hh: [], hc: [0, 1, 2] },
    { nh: 7, nc: 8, hh: [], hc: [5, 6] }
  ] },
  { id: 'float', titre: 'la propriété float', temps: [
    { nh: 5, nc: 1, hh: [1], hc: [] },
    { nh: 5, nc: 4, hh: [], hc: [1, 2] },
    { nh: 5, nc: 7, hh: [], hc: [6] }
  ] },
  { id: 'recap', titre: 'Récapitulatif et quiz', temps: [
    { nh: 9, nc: 0, hh: [0, 1, 2, 4, 6, 7], hc: [] },
    { nh: 9, nc: 5, hh: [], hc: [0, 1, 2, 3, 4] }
  ] },
  { id: 'flexbox', titre: 'BONUS — display: flex (hors annexe)', temps: [
    { nh: 6, nc: 3, hh: [], hc: [1] },
    { nh: 6, nc: 6, hh: [], hc: [4] },
    { nh: 6, nc: 9, hh: [], hc: [7] },
    { nh: 6, nc: 12, hh: [], hc: [10, 11] },
    { nh: 6, nc: 18, hh: [], hc: [14, 17] },
    { nh: 6, nc: 21, hh: [], hc: [20] },
    { nh: 6, nc: 24, hh: [], hc: [23] }
  ] }
];

/* ---------- déplacement ---------- */
function allerIntroPosition() {
  arreterAuto();
  etape = 4;
  temps = 0;
  introPosActive = true;
  afficher();
  jouerVoixPosCourante(false);
}

function aller(n) {
  arreterAuto();
  etape = n;
  temps = 0;
  introPosActive = false;
  afficher();
  jouerVoixPosCourante(false);
}

function allerTemps(n) {
  arreterAuto();
  introPosActive = false;
  temps = n;
  afficher();
  jouerVoixPosCourante(false);
}

function suivant(depuisAuto) {
  if (!depuisAuto && auto) { arreterAuto(); }
  if (introPosActive) {
    introPosActive = false;
    etape = 4;
    temps = 0;
    afficher();
    jouerVoixPosCourante(!!depuisAuto);
    return true;
  }
  var t = COURS[etape].temps.length;
  if (temps < t - 1) { temps = temps + 1; }
  else if (etape === 3) {
    etape = 4;
    temps = 0;
    introPosActive = true;
  }
  else if (etape < COURS.length - 1) { etape = etape + 1; temps = 0; }
  else { arreterAuto(); arreterVoixPos(); return false; }
  afficher();
  jouerVoixPosCourante(!!depuisAuto);
  return true;
}

function precedent() {
  if (auto) { arreterAuto(); }
  if (introPosActive) {
    introPosActive = false;
    etape = 3;
    temps = COURS[3].temps.length - 1;
    afficher();
    jouerVoixPosCourante(false);
    return true;
  }
  if (etape === 4 && temps === 0) {
    introPosActive = true;
    temps = 0;
    afficher();
    jouerVoixPosCourante(false);
    return true;
  }
  if (temps > 0) { temps = temps - 1; }
  else if (etape > 0) { etape = etape - 1; temps = COURS[etape].temps.length - 1; }
  else { return false; }
  afficher();
  jouerVoixPosCourante(false);
  return true;
}

function rejouer() {
  if (auto) { arreterAuto(); }
  temps = 0;
  afficher();
  jouerVoixPosCourante(false);
}

function clavier(e) {
  if (e.key === 'ArrowRight') { suivant(); arreterAuto(); }
  else if (e.key === 'ArrowLeft') { precedent(); arreterAuto(); }
  else if (e.key === ' ') { lectureAuto(); }
  else if (e.key === 'Home') { aller(0); }
  else if (e.key === 'End') { aller(COURS.length - 1); }
}

/* ---------- affichage ---------- */
function afficher() {
  var i, j, t, el, tous, lignes, total, fait, pastilles;

  t = COURS[etape].temps[temps];

  /* une seule scène et une seule paire de fichiers visibles */
  for (i = 0; i < COURS.length; i++) {
    document.getElementById('scene-' + i).hidden = (introPosActive || i !== etape);
    document.getElementById('code-html-' + i).hidden = (introPosActive || i !== etape);
    document.getElementById('code-css-' + i).hidden = (introPosActive || i !== etape);
  }
  var blocIntroPos = document.getElementById('sti-intro-etape4-position');
  if (blocIntroPos) {
    blocIntroPos.hidden = !introPosActive;
  }
  var codeHtmlIntro = document.getElementById('code-html-4-0');
  var codeCssIntro = document.getElementById('code-css-4-0');
  if (codeHtmlIntro) { codeHtmlIntro.hidden = !introPosActive; }
  if (codeCssIntro) { codeCssIntro.hidden = !introPosActive; }

  /* une seule note visible */
  for (j = 0; j < COURS[etape].temps.length; j++) {
    document.getElementById('note-' + etape + '-' + j).hidden = (introPosActive || j !== temps);
  }

  habiller();

  /* le code : lignes écrites et lignes mises en évidence */
  if (introPosActive) {
    ecrireCode('code-html-4-0', 3, [1, 2]);
    ecrireCode('code-css-4-0', 6, [0]);
  } else {
    ecrireCode('code-html-' + etape, t.nh, t.hh);
    ecrireCode('code-css-' + etape, t.nc, t.hc);
  }

  /* pastilles + compteur + jauge */
  pastilles = '';
  if (introPosActive) {
    pastilles = '<input type="button" class="point actif ' + theme + ' ' + format + '" value="" onclick="allerIntroPosition()" />';
  } else {
    for (j = 0; j < COURS[etape].temps.length; j++) {
      pastilles = pastilles + '<input type="button" class="point ' +
        (j === temps ? 'actif' : (j < temps ? 'fait' : '')) +
        ' ' + theme + ' ' + format +
        '" value="" onclick="allerTemps(' + j + ')" />';
    }
  }
  document.getElementById('pastilles').innerHTML = pastilles;

  for (i = 0; i < COURS.length; i++) {
    document.getElementById('chip-' + i).className =
      'chip' + (!introPosActive && i === etape ? ' actif' : '') + ' ' + theme + ' ' + format;
  }
  var chipIntro = document.getElementById('chip-4-0');
  if (chipIntro) {
    chipIntro.className = 'chip' + (introPosActive ? ' actif' : '') + ' ' + theme + ' ' + format;
  }

  if (introPosActive) {
    document.getElementById('compteur').innerHTML = 'étape 4.0 · Position · temps 1/1';
  } else {
    document.getElementById('compteur').innerHTML =
      'étape ' + (etape + 1) + '/' + COURS.length +
      ' · temps ' + (temps + 1) + '/' + COURS[etape].temps.length;
  }

  total = 0; fait = 0;
  for (i = 0; i < COURS.length; i++) {
    total = total + COURS[i].temps.length;
    if (i < etape) { fait = fait + COURS[i].temps.length; }
  }
  fait = fait + temps + 1;
  document.getElementById('jauge').style.width = Math.round(fait / total * 100) + '%';

  demarrerDefilement();
}

function ecrireCode(idTable, nombre, actifs) {
  var lignes = document.getElementById(idTable).getElementsByTagName('tr');
  var i, j, actif, cls, cellule;
  for (i = 0; i < lignes.length; i++) {
    actif = false;
    for (j = 0; j < actifs.length; j++) { if (actifs[j] === i) { actif = true; } }
    if (i >= nombre) { cls = 'ln'; }
    else if (actif) { cls = 'ln ecrit actif'; }
    else { cls = 'ln ecrit'; }
    lignes[i].className = cls + ' ' + theme + ' ' + format;
    cellule = lignes[i].getElementsByTagName('td')[0];
    cellule.className = 'numero' + (actif ? ' numero-actif' : '') + ' ' + theme + ' ' + format;
  }
}

/* ---------- habillage : thème (sombre / clair) + format (bureau / mobile)
   L'annexe CSS3 ne contient ni @media ni variables : on pose donc une
   classe sur chaque élément, comme pour les temps de l'étape.        ------ */
function estElementExterne(el) {
  if (!el || typeof el.className !== 'string') return true;
  if (el.namespaceURI && el.namespaceURI.indexOf('svg') !== -1) return true;
  var cur = el;
  while (cur && cur !== document.body) {
    var id = cur.id || '';
    if (
      id === 'rotate-overlay' ||
      id === 'retour-cours' ||
      id.indexOf('sti-') === 0 ||
      id.indexOf('stix-') === 0
    ) {
      return true;
    }
    cur = cur.parentNode;
  }
  return false;
}

function baseDe(el) {
  if (!el || typeof el.className !== 'string') return '';
  if (el._base === undefined) {
    el._base = el.className
      .replace(/\sb\d+/g, '')
      .replace(/\b(sombre|clair|bureau|mobile|actif|ecrit|numero-actif|fait|ouverte)\b/g, '')
      .replace(/\s+/g, ' ')
      .replace(/^\s+|\s+$/g, '');
  }
  return el._base;
}

function habiller() {
  var tous = document.body.getElementsByTagName('*');
  var demo = document.getElementById('demo-' + etape);
  var i, el, cls, etaitOuverte;
  var gold = document.body.classList && document.body.classList.contains('sti-gold');
  document.body.className = theme + ' ' + format + (gold ? ' sti-gold' : '');
  for (i = 0; i < tous.length; i++) {
    el = tous[i];
    if (estElementExterne(el)) continue;
    etaitOuverte = el.classList && el.classList.contains('ouverte');
    cls = baseDe(el);
    if (demo && (el === demo || demo.contains(el))) { cls = cls + ' b' + temps; }
    if (etaitOuverte) { cls = cls + ' ouverte'; }
    el.className = cls + ' ' + theme + ' ' + format;
  }
  /* boutons de thème : celui qui est actif garde la couleur */
  document.getElementById('bouton-sombre').className =
    'btn ' + (theme === 'sombre' ? 'btn-violet ' : '') + theme + ' ' + format;
  document.getElementById('bouton-clair').className =
    'btn ' + (theme === 'clair' ? 'btn-violet ' : '') + theme + ' ' + format;
  var btnVoix = document.getElementById('sti-btn-voix-pos');
  if (btnVoix) {
    btnVoix.className = 'btn ' + (voixPosActive ? 'btn-violet ' : '') + theme + ' ' + format;
  }
  var btnVid = document.getElementById('sti-btn-video-pos');
  if (btnVid) {
    btnVid.className = 'btn ' + theme + ' ' + format;
  }
}

function choisirTheme(nom) {
  theme = nom;
  try { window.localStorage.setItem('fond-du-cours', theme); } catch (e) { }
  habiller();
  /* le code doit être réécrit : ses lignes portent aussi le thème */
  if (introPosActive) {
    ecrireCode('code-html-4-0', 3, [1, 2]);
    ecrireCode('code-css-4-0', 6, [0]);
  } else {
    ecrireCode('code-html-' + etape, COURS[etape].temps[temps].nh, COURS[etape].temps[temps].hh);
    ecrireCode('code-css-' + etape, COURS[etape].temps[temps].nc, COURS[etape].temps[temps].hc);
  }
}

function calculerFormat() {
  var large = window.innerWidth || document.documentElement.clientWidth;
  return large < LARGEUR_MOBILE ? 'mobile' : 'bureau';
}

function appliquerFormat() {
  /* sur mobile la liste des étapes est repliée pour libérer de la hauteur */
  var liste = document.getElementById('liste-etapes');
  if (liste) { liste.open = (format === 'bureau'); }
}

window.addEventListener('resize', function () {
  var f = calculerFormat();
  if (f !== format) { format = f; appliquerFormat(); habiller(); }
});

/* ---------- défilement automatique des démos fixed et sticky ---------- */
function demarrerDefilement() {
  var scene, zones;
  arreterDefilement();
  scene = document.getElementById('scene-' + etape);
  zones = scene.getElementsByClassName('defilant');
  if (zones.length === 0) { return; }
  zone = zones[0];
  zone.scrollTop = 0;
  sens = 1;
  var dernier = 0;
  function pas(maintenant) {
    var dt, max, y;
    if (!zone) { return; }
    dt = (maintenant - dernier) / 1000;
    if (dt > 0.05) { dt = 0.05; }
    dernier = maintenant;
    max = zone.scrollHeight - zone.clientHeight;
    if (!enPause && max > 4) {
      y = zone.scrollTop + sens * 80 * dt;
      if (y >= max) { y = max; sens = -1; }
      else if (y <= 0) { y = 0; sens = 1; }
      zone.scrollTop = y;
    }
    animation = requestAnimationFrame(pas);
  }
  animation = requestAnimationFrame(pas);
}

function arreterDefilement() {
  if (animation) { cancelAnimationFrame(animation); }
  animation = null;
  zone = null;
}

function basculerPause() {
  enPause = !enPause;
}

/* ---------- voix masculine synchronisée (comme le guichet) ---------- */
var POS_VOIX_CUES = {"0-0": [0.0, 13.55], "0-1": [13.7, 19.8], "0-2": [19.95, 26.95], "0-3": [27.1, 34.32], "1-0": [34.47, 43.97], "1-1": [44.12, 52.82], "1-2": [52.97, 61.29], "2-0": [61.44, 70.64], "2-1": [70.79, 78.74], "2-2": [78.89, 87.04], "2-3": [87.19, 92.56], "3-0": [92.71, 102.56], "3-1": [102.71, 110.91], "3-2": [111.06, 119.85], "4.0": [120.0, 150.7], "4-0": [150.85, 160.4], "4-1": [160.55, 168.2], "5-0": [168.35, 178.1], "5-1": [178.25, 187.15], "5-2": [187.3, 193.63], "6-0": [193.78, 202.53], "6-1": [202.68, 212.88], "6-2": [213.03, 224.12], "7-0": [224.27, 232.67], "7-1": [232.82, 241.72], "8-0": [241.87, 248.37], "8-1": [248.52, 259.55], "9-0": [259.7, 268.35], "9-1": [268.5, 277.25], "9-2": [277.4, 283.85], "10-0": [284.0, 293.5], "10-1": [293.65, 302.48], "11-0": [302.63, 308.53], "11-1": [308.68, 313.68], "11-2": [313.83, 321.63], "11-3": [321.78, 329.48], "11-4": [329.63, 336.78], "11-5": [336.93, 342.08], "11-6": [342.23, 349.21]};
var voixPosActive = true;
var posVoixTimer = null;
var posAutoTimer = null;
var posSegFin = 0;
var posAudio = document.createElement('audio');
posAudio.preload = 'auto';
posAudio.src = '../assets/audio/css-positionnement.mp3?v=224';
posAudio.style.display = 'none';
if (document.body) { document.body.appendChild(posAudio); }

function arreterVoixPos() {
  if (posVoixTimer) { clearTimeout(posVoixTimer); posVoixTimer = null; }
  if (posAutoTimer) { clearTimeout(posAutoTimer); posAutoTimer = null; }
  posSegFin = 0;
  try { posAudio.pause(); } catch (e) {}
}

function finSegmentVoixPos(enAuto) {
  if (posVoixTimer) { clearTimeout(posVoixTimer); posVoixTimer = null; }
  posSegFin = 0;
  try { posAudio.pause(); } catch (e) {}
  if (enAuto && auto) {
    posAutoTimer = setTimeout(function () {
      if (!auto) return;
      suivant(true);
    }, 700);
  }
}

posAudio.addEventListener('timeupdate', function () {
  if (posAudio.paused) return;
  if (posSegFin > 0 && posAudio.currentTime >= posSegFin - 0.04) {
    finSegmentVoixPos(auto);
  }
});

function jouerVoixPosCourante(enAuto) {
  arreterVoixPos();
  if (!voixPosActive) {
    if (enAuto && auto) {
      programmer();
    }
    return;
  }
  var cle = introPosActive ? '4.0' : (etape + '-' + temps);
  var seg = POS_VOIX_CUES[cle];
  if (!seg) {
    if (enAuto && auto) programmer();
    return;
  }
  var t0 = seg[0], t1 = seg[1];
  posSegFin = t1;
  function lancer() {
    try {
      posAudio.muted = false;
      posAudio.volume = 1.0;
      posAudio.playbackRate = (typeof window.lireVitesseVoixSTI === 'function') ? window.lireVitesseVoixSTI() : 0.95;
      posAudio.currentTime = t0;
      var p = posAudio.play();
      if (p && p.catch) {
        p.catch(function () {
          if (enAuto && auto) programmer();
        });
      }
    } catch (e) {}
  }
  if (posAudio.readyState >= 1) {
    lancer();
  } else {
    var onMeta = function () {
      posAudio.removeEventListener('loadedmetadata', onMeta);
      lancer();
    };
    posAudio.addEventListener('loadedmetadata', onMeta);
    try { posAudio.load(); } catch (e) {}
  }
}

function basculerVoixPos() {
  voixPosActive = !voixPosActive;
  var btn = document.getElementById('sti-btn-voix-pos');
  if (btn) {
    btn.value = voixPosActive ? '🔊 Voix : ON' : '🔇 Voix : OFF';
    btn.className = 'btn ' + (voixPosActive ? 'btn-violet ' : '') + theme + ' ' + format;
  }
  if (voixPosActive) {
    jouerVoixPosCourante(auto);
  } else {
    arreterVoixPos();
    if (auto) programmer();
  }
}

function ouvrirVideoPositionnement() {
  arreterAuto();
  arreterVoixPos();
  if (typeof window.ouvrirVideoPasAPasSTI === 'function') {
    window.ouvrirVideoPasAPasSTI('css-positionnement');
  }
}

/* ---------- lecture automatique ---------- */
function duree() {
  var id = COURS[etape].id;
  if (id === 'fixe' || id === 'sticky') { return 7000; }
  return 3800;
}

function programmer() {
  clearTimeout(minuteur);
  minuteur = setTimeout(function () {
    if (!auto) { return; }
    if (!suivant(true)) { arreterAuto(); }
  }, duree());
}

function lectureAuto() {
  if (auto) { arreterAuto(); arreterVoixPos(); return; }
  auto = true;
  document.getElementById('bouton-auto').value = '❚❚ Pause';
  jouerVoixPosCourante(true);
}

function arreterAuto() {
  auto = false;
  clearTimeout(minuteur);
  if (posAutoTimer) { clearTimeout(posAutoTimer); posAutoTimer = null; }
  document.getElementById('bouton-auto').value = '▶ Lecture auto';
}

/* ---------- quiz ---------- */
function repondre(idQuestion, bonne, bouton) {
  var q = document.getElementById(idQuestion);
  var boutons = q.getElementsByTagName('input');
  var i, fb, texte;
  for (i = 0; i < boutons.length; i++) { boutons[i].className = 'proposition'; }
  bouton.className = 'proposition ' + (bonne ? 'bon' : 'mauvais');
  fb = document.getElementById(idQuestion + '-fb');
  texte = document.getElementById(idQuestion + (bonne ? '-ok' : '-ko')).innerHTML;
  fb.className = 'feedback ' + (bonne ? 'bon' : 'mauvais');
  fb.innerHTML = (bonne ? '✔ ' : '✖ ') + texte;
}

/* ---------- démarrage ---------- */
try {
  if (window.localStorage.getItem('fond-du-cours') === 'clair') { theme = 'clair'; }
} catch (e) { }
format = calculerFormat();
appliquerFormat();
afficher();
