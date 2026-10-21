/* STI V2.0 BY A'e — deux manuels, traitement des images uniquement local. */
(function () {
  'use strict';
  let $ = function (id) { return document.getElementById(id); };
  let base = new URL('./', location.href);
  let publicBase = new URL('https://aymenessouyah.github.io/STiV2.0/');
  let books = {
    '4si-2026': { title: '4ème SI — 2026', level: '4ème SI', data: 'assets/data/smart-book-2026.json', pdf: 'documents/livre/sti-smart-book-2026.pdf', pages: 74, fiches: 69, boundary: 'Manuel de 4ème SI : SQL et PHP inclus.' },
    '3si-2026': { title: '3ème SI — 2026', level: '3ème SI', data: 'assets/data/smart-book-3si-2026.json', pdf: 'documents/livre/sti-smart-book-3si-2026.pdf', pages: 54, fiches: 50, boundary: 'Sans PHP. SQL limité à SELECT sur une table, avec filtres et tri ; sans jointure, sous-requête ni agrégat.' }
  };
  let bookId = '4si-2026', items = [], cache = {}, ready = false;
  let stream = null, scanning = false, timer = null, generation = 0, loadGeneration = 0;
  let detector = null, imageBusy = false;
  let canvas = document.createElement('canvas');
  let context = canvas.getContext('2d', { willReadFrequently: true });

  /* --- Filtrage des manuels selon le profil connecté (cache de session STI) ---
     Élève 3SI → manuel 3ème SI ; élève 4SI → manuel 4ème SI ;
     admin, prof et comptes GOLD → les deux manuels.
     Visiteur non identifié : aucun filtrage (comportement inchangé). */
  let manuelsAutorises = (function () {
    try {
      let brut = null;
      try { brut = localStorage.getItem('sti-session-cache'); } catch (e) {}
      if (!brut) { try { brut = sessionStorage.getItem('sti-session-cache'); } catch (e) {} }
      if (!brut) { try { brut = localStorage.getItem('sti-labo3-permanent'); } catch (e) {} }
      let c = brut ? JSON.parse(brut) : null;
      let drapeauGold = false;
      try { drapeauGold = localStorage.getItem('sti-admin-gold') === '1' || localStorage.getItem('sti-gold') === '1'; } catch (e) {}
      if (!c && !drapeauGold) return null;
      let classe = String((c && c.classe) || '').trim().toUpperCase().replace(/[\s._\-]+/g, '');
      let lycee = String((c && c.lycee) || '');
      let estAdmin = Boolean(c && c.isAdmin) || drapeauGold;
      /* elevelabo3 : reconnu par sa classe OU par son e-mail (comme acces.js) */
      let classeMin = classe.toLowerCase();
      try { classeMin = classeMin.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch (e) {}
      let email = String((c && c.email) || '').trim().toLowerCase();
      let estLabo3 = classeMin === 'elevelabo3' || /^elevelabo3(?:@|$)/i.test(email);
      let estProf = estLabo3 || classeMin === 'prof' || classeMin === 'professeur' || classeMin === 'enseignant' || classeMin === 'enseignante';
      let identite = [c && c.nom, c && c.prenom, c && c.email].join(' ').toLowerCase();
      try { identite = identite.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch (e) {}
      let estGoldPlateforme = identite.indexOf('issaoui') !== -1 && identite.indexOf('amel') !== -1;
      let estGold = Boolean(c && (c.isGold || c.gold === true)) || /\bGOLD\b/i.test(lycee) || classe.indexOf('GOLD') !== -1 || estGoldPlateforme;
      if (estAdmin || estProf || estGold) return Object.keys(books);
      if (/^4(E|EME)?SI/.test(classe)) return ['4si-2026'];
      if (/^3(E|EME)?SI/.test(classe)) return ['3si-2026'];
      return null;
    } catch (e) { return null; }
  })();
  function manuelPermis(id) { return !manuelsAutorises || manuelsAutorises.includes(id); }
  function filtrerSelectManuels() {
    if (!manuelsAutorises || manuelsAutorises.length >= Object.keys(books).length) return;
    Array.from($('book-select').options).forEach(function (o) { if (!manuelsAutorises.includes(o.value)) o.remove(); });
  }
  function message(text, error) {
    $('global-status').textContent = text;
    $('global-status').classList.toggle('error', Boolean(error));
  }
  function localURL(absolute) {
    let u = new URL(absolute);
    if (u.protocol !== 'https:' || u.origin !== publicBase.origin || u.username || u.password
        || !u.pathname.startsWith(publicBase.pathname) || u.search) {
      throw new Error('Destination non autorisée.');
    }
    return new URL(u.pathname.slice(publicBase.pathname.length) + u.hash, base).href;
  }
  async function getIndex(id) {
    if (!Object.hasOwn(books, id)) throw new Error('Manuel inconnu.');
    if (cache[id]) return cache[id];
    let response = await fetch(books[id].data);
    if (!response.ok) throw new Error('Index indisponible.');
    let data = await response.json(), book = books[id];
    if (data.pages !== book.pages || !Array.isArray(data.items) || data.items.length !== book.fiches) throw new Error('Index incompatible.');
    let first = book.pages - book.fiches + 1;
    data.items.forEach(function (item, index) {
      if (item.fiche !== index + 1 || item.page !== first + index) throw new Error('Pagination invalide.');
      localURL(item.url);
    });
    cache[id] = data;
    return data;
  }
  function setControls(enabled) {
    ['photo', 'start-camera', 'find-page', 'search'].forEach(function (id) { $(id).disabled = !enabled || imageBusy; });
    $('book-select').disabled = !enabled || imageBusy;
  }
  function stopCamera() {
    generation++; scanning = false; clearTimeout(timer);
    if (stream) stream.getTracks().forEach(function (track) { track.stop(); });
    stream = null; $('camera').srcObject = null; $('camera').hidden = true;
    $('camera-placeholder').hidden = false; $('stop-camera').hidden = true;
    $('start-camera').disabled = !ready || imageBusy;
    $('start-camera').textContent = 'Activer la caméra';
  }
  function normalize(text) { return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
  function renderCatalog() {
    let term = normalize($('search').value.trim());
    let filtered = items.filter(function (item) { return normalize(item.titre + ' ' + item.page + ' ' + item.fiche).includes(term); });
    $('catalog-list').replaceChildren(); let fragment = document.createDocumentFragment();
    filtered.forEach(function (item) {
      let a = document.createElement('a'); a.className = 'catalog-item'; a.href = localURL(item.url);
      let badge = document.createElement('span'); badge.className = 'page-badge'; badge.textContent = 'p. ' + item.page;
      let title = document.createElement('span'); title.textContent = item.titre;
      let sub = document.createElement('small'); sub.textContent = books[bookId].level + ' · FICHE ' + String(item.fiche).padStart(2, '0'); title.append(sub);
      let arrow = document.createElement('span'); arrow.className = 'arrow'; arrow.textContent = '↗'; arrow.setAttribute('aria-hidden', 'true');
      a.append(badge, title, arrow); fragment.append(a);
    });
    $('catalog-list').append(fragment); $('count').textContent = filtered.length + ' fiche(s) sur ' + items.length + ' · ' + books[bookId].level;
  }
  async function loadBook(id) {
    if (!Object.hasOwn(books, id)) throw new Error('Édition inconnue.');
    if (!manuelPermis(id)) {
      message('Ce manuel est réservé aux élèves de ' + books[id].level + '.', true);
      if (manuelsAutorises && bookId !== manuelsAutorises[0]) return loadBook(manuelsAutorises[0]);
      return false;
    }
    let request = ++loadGeneration;
    ready = false; stopCamera(); setControls(false);
    $('result').hidden = true; $('scan-status').textContent = '';
    message('Chargement du manuel ' + books[id].title + '…');
    try {
      let data = await getIndex(id);
      if (request !== loadGeneration) return false;
      bookId = id; items = data.items; let book = books[id];
      $('book-select').value = id; $('page-number').max = String(book.pages); $('page-number').value = '';
      $('search').value = ''; $('book-level').textContent = 'LE MANUEL CONNECTÉ · ' + book.level;
      $('book-edition').textContent = book.title; $('book-size').textContent = book.pages + ' pages · ' + book.fiches + ' fiches';
      $('book-boundary').textContent = book.boundary;
      $('download-book').href = book.pdf;
      $('cover-subjects').textContent = id === '3si-2026' ? 'HTML5 · CSS3 · JavaScript · SQL simple' : 'HTML5 · CSS3 · JavaScript · SQL · PHP';
      ready = true; setControls(true); renderCatalog();
      message(book.title + ' prêt : QR, photo ou recherche par page.');
      let u = new URL(location.href); u.searchParams.set('livre', id); u.searchParams.delete('page');
      history.replaceState(null, '', u.pathname + u.search + u.hash);
      return true;
    } catch (error) {
      if (request !== loadGeneration) return false;
      $('book-select').disabled = false;
      message('Impossible de charger ce manuel. Actualisez avec Internet ou choisissez l’autre édition.', true);
      return false;
    }
  }
  function showResult(item, meta) {
    stopCamera(); $('result-title').textContent = item.titre;
    $('result-meta').textContent = books[bookId].level + ' · ' + meta;
    $('result-link').href = localURL(item.url); $('result').hidden = false;
    message('Fiche retrouvée. Vérifiez son titre puis ouvrez le cours.');
  }
  function pageResult(page) {
    if (!ready || !Number.isInteger(page) || page < 1 || page > books[bookId].pages) {
      message('Saisissez un numéro entier de 1 à ' + books[bookId].pages + ' pour ce manuel.', true); $('result').hidden = true; return false;
    }
    let item = items.find(function (entry) { return entry.page === page; });
    if (item) showResult(item, 'PAGE ' + item.page + ' · FICHE ' + item.fiche);
    else showResult({ titre: page === 1 ? 'Couverture du manuel' : 'Sommaire et mode d’emploi', url: publicBase.href + 'index.html#cours' }, 'PAGE ' + page + ' · ACCUEIL DES COURS');
    return true;
  }
  async function decoded(text) {
    let u; try { u = new URL(text); } catch (_) { return false; }
    if (u.protocol !== 'https:' || u.origin !== publicBase.origin || u.username || u.password) return false;
    if (u.pathname === publicBase.pathname + 'livre-smart.html') {
      if ([...u.searchParams.keys()].some(function (key) { return !['livre', 'page'].includes(key); })) return false;
      let id = u.searchParams.get('livre');
      if (!Object.hasOwn(books, id)) return false;
      if (!manuelPermis(id)) {
        stopCamera();
        $('scan-status').textContent = 'Ce QR appartient au manuel ' + books[id].level + ', réservé à ce niveau.';
        return true;
      }
      let raw = u.searchParams.get('page');
      if (raw !== null && (!/^\d+$/.test(raw) || Number(raw) < 1 || Number(raw) > books[id].pages)) return false;
      stopCamera();
      if (id !== bookId && !await loadBook(id)) return false;
      if (raw !== null) {
        if (!pageResult(Number(raw))) return false;
        $('scan-status').textContent = 'QR reconnu : ' + books[id].level + ', page ' + Number(raw) + '.';
      } else {
        $('result').hidden = true;
        message('Manuel ' + books[id].title + ' sélectionné. Choisissez une page ou une fiche.');
        $('scan-status').textContent = 'QR reconnu : couverture du manuel ' + books[id].level + '.';
      }
      return true;
    }
    // Les QR directs déjà imprimés du manuel 4SI restent compatibles.
    if (!manuelPermis('4si-2026')) {
      stopCamera();
      $('scan-status').textContent = 'Ce QR appartient au manuel 4ème SI, réservé à ce niveau.';
      return true;
    }
    if (u.search) return false;
    let data = await getIndex('4si-2026');
    let peers = data.items.filter(function (item) { return item.url === u.href; });
    let generic = [publicBase.href, publicBase.href + 'index.html#cours', publicBase.href + 'index.html#modules'].includes(u.href);
    if (!peers.length && !generic) return false;
    stopCamera(); if (bookId !== '4si-2026' && !await loadBook('4si-2026')) return false;
    if (generic) showResult({ titre: u.hash === '#modules' ? 'Quiz de la plateforme STI' : 'Les cours de la plateforme STI', url: u.href }, 'PLATEFORME STI');
    else if (peers.length === 1) showResult(peers[0], 'PAGE ' + peers[0].page + ' · FICHE ' + peers[0].fiche);
    else showResult({ titre: peers[0].section || ('Section du cours : ' + peers[0].titre), url: u.href }, 'SECTION COMMUNE · PAGES ' + peers.map(function (item) { return item.page; }).join(', '));
    $('scan-status').textContent = 'QR reconnu : ' + $('result-title').textContent;
    return true;
  }
  async function readQR(source) {
    if (detector) { try { let codes = await detector.detect(source); if (codes.length) return codes[0].rawValue; } catch (_) {} }
    if (typeof window.jsQR !== 'function' || !context) return null;
    let pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    let code = window.jsQR(pixels.data, pixels.width, pixels.height, { inversionAttempts: 'attemptBoth' });
    return code ? code.data : null;
  }
  async function cameraTick(session) {
    if (!scanning || session !== generation) return;
    try {
      let video = $('camera');
      if (video.readyState >= 2 && video.videoWidth) {
        let ratio = Math.min(1, 1000 / Math.max(video.videoWidth, video.videoHeight));
        canvas.width = Math.round(video.videoWidth * ratio); canvas.height = Math.round(video.videoHeight * ratio);
        context.drawImage(video, 0, 0, canvas.width, canvas.height); let code = await readQR(canvas);
        if (session !== generation) return;
        if (code && await decoded(code)) return;
        if (code) $('scan-status').textContent = 'QR non reconnu. Visez le code contrasté du manuel STI.';
      }
    } catch (_) { $('scan-status').textContent = 'Rapprochez le QR, sans couper ses bords.'; }
    if (scanning && session === generation) timer = setTimeout(function () { cameraTick(session); }, 240);
  }
  async function startCamera() {
    if (!ready || imageBusy) return;
    if (!window.isSecureContext || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      $('scan-status').textContent = 'La caméra exige HTTPS. Choisissez une photo ou saisissez une page.'; return;
    }
    stopCamera(); $('result').hidden = true; let session = generation;
    $('start-camera').disabled = true; $('start-camera').textContent = 'Autorisation…'; $('stop-camera').hidden = false;
    try {
      let media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } }, audio: false });
      if (session !== generation) { media.getTracks().forEach(function (track) { track.stop(); }); return; }
      stream = media; $('camera').srcObject = media; $('camera').hidden = false; $('camera-placeholder').hidden = true;
      await $('camera').play(); if (session !== generation) return;
      scanning = true; $('scan-status').textContent = 'Visez le QR contrasté, sans couper les bords.'; cameraTick(session);
    } catch (error) {
      if (session !== generation) return;
      stopCamera(); $('scan-status').textContent = error.name === 'NotAllowedError' ? 'Autorisation refusée. Choisissez une photo ou un numéro de page.' : 'Caméra indisponible. Choisissez une photo ou un numéro de page.';
    }
  }
  async function photoChanged(event) {
    let file = event.target.files[0]; if (!file || imageBusy || !ready) return;
    stopCamera(); $('result').hidden = true;
    if (!file.type.startsWith('image/') || file.size > 18 * 1024 * 1024) { $('scan-status').textContent = 'Choisissez une image de moins de 18 Mo.'; event.target.value = ''; return; }
    imageBusy = true; setControls(false); $('scan-status').textContent = 'Recherche du QR dans la photo, sur votre appareil…';
    let blob = URL.createObjectURL(file);
    try {
      let image = new Image(); image.src = blob; await image.decode();
      for (let region of [[0.5, 0.65, 0.5, 0.35], [0, 0, 1, 1]]) {
        for (let max of [2000, 1200]) {
          let x = image.naturalWidth * region[0], y = image.naturalHeight * region[1];
          let w = image.naturalWidth * region[2], h = image.naturalHeight * region[3];
          let scale = Math.min(1, max / Math.max(w, h));
          canvas.width = Math.max(1, Math.round(w * scale)); canvas.height = Math.max(1, Math.round(h * scale));
          context.drawImage(image, x, y, w, h, 0, 0, canvas.width, canvas.height);
          let code = await readQR(canvas); if (code && await decoded(code)) return;
          await new Promise(function (resolve) { setTimeout(resolve, 0); });
        }
      }
      $('scan-status').textContent = 'Aucun QR STI lisible. Recadrez le code ou choisissez le bon manuel et son numéro de page.';
    } catch (_) { $('scan-status').textContent = 'Image non lisible. Essayez un JPG/PNG ou saisissez le numéro de page.'; }
    finally { URL.revokeObjectURL(blob); imageBusy = false; setControls(ready); event.target.value = ''; }
  }
  $('book-select').addEventListener('change', function () { loadBook($('book-select').value); });
  $('page-form').addEventListener('submit', function (event) { event.preventDefault(); if (ready) pageResult(Number($('page-number').value)); });
  $('search').addEventListener('input', renderCatalog);
  $('start-camera').addEventListener('click', startCamera);
  $('stop-camera').addEventListener('click', function () { stopCamera(); $('scan-status').textContent = 'Caméra arrêtée.'; });
  $('photo').addEventListener('change', photoChanged);
  window.addEventListener('pagehide', stopCamera);
  document.addEventListener('visibilitychange', function () { if (document.hidden) stopCamera(); });
  async function init() {
    if ('BarcodeDetector' in window) { try { let formats = await window.BarcodeDetector.getSupportedFormats(); if (formats.includes('qr_code')) detector = new window.BarcodeDetector({ formats: ['qr_code'] }); } catch (_) {} }
    let query = new URLSearchParams(location.search), id = query.get('livre') || '4si-2026', raw = query.get('page');
    if (!Object.hasOwn(books, id)) id = '4si-2026';
    filtrerSelectManuels();
    if (!manuelPermis(id)) id = manuelsAutorises[0];
    if (await loadBook(id) && raw !== null) { $('page-number').value = raw; pageResult(Number(raw)); }
  }
  init();
})();
