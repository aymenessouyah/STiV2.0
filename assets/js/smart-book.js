/* STI Smart Book 2026 — décodage local. Aucun téléversement d'image. */
(function () {
  'use strict';
  let $ = function (id) { return document.getElementById(id); };
  let base = new URL('./', location.href);
  let publicBase = new URL('https://aymenessouyah.github.io/STiV2.0/');
  let items = [], allowed = new Map(), ready = false;
  let stream = null, scanning = false, timer = null, generation = 0;
  let detector = null, imageBusy = false;
  let canvas = document.createElement('canvas');
  let context = canvas.getContext('2d', { willReadFrequently: true });
  function message(text, error) {
    $('global-status').textContent = text;
    $('global-status').classList.toggle('error', Boolean(error));
  }
  function localURL(absolute) {
    let u = new URL(absolute);
    if (u.protocol !== 'https:' || u.origin !== publicBase.origin
        || !u.pathname.startsWith(publicBase.pathname) || u.search) {
      throw new Error('Ce code ne correspond pas au manuel STI.');
    }
    let relative = u.pathname.slice(publicBase.pathname.length);
    return new URL(relative + u.hash, base).href;
  }
  function result(item, meta) {
    stopCamera();
    $('result-title').textContent = item.titre;
    $('result-meta').textContent = meta;
    $('result-link').href = localURL(item.url);
    $('result').hidden = false;
    message('Fiche retrouvée. Vérifiez son titre puis ouvrez le cours.');
  }
  function decoded(text) {
    // Ne jamais ouvrir un QR arbitraire, même sur le même domaine.
    let u;
    try { u = new URL(text); } catch (_) { return false; }
    let item = allowed.get(u.href);
    if (!item) return false;
    result(item, item.page ? 'PAGE ' + item.page + ' · FICHE ' + item.fiche : (item.pages ? 'SECTION COMMUNE · PAGES ' + item.pages.join(', ') : 'PLATEFORME STI v2.0'));
    $('scan-status').textContent = 'QR reconnu : ' + item.titre;
    $('result').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return true;
  }
  function findPage() {
    if (!ready) return;
    let raw = $('page-number').value.trim();
    let page = Number(raw);
    if (!raw || !Number.isInteger(page) || page < 1 || page > 74) {
      message('Saisissez un numéro entier de 1 à 74.', true);
      $('result').hidden = true;
      return;
    }
    if (page <= 5) {
      result({ titre: page === 1 ? 'Couverture du manuel' : 'Sommaire et mode d’emploi', url: publicBase.href + 'index.html#cours' }, 'PAGE ' + page + ' · ACCUEIL DES COURS');
    } else {
      let item = items.find(function (entry) { return entry.page === page; });
      if (item) result(item, 'PAGE ' + item.page + ' · FICHE ' + item.fiche);
    }
  }
  function normalize(text) { return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
  function renderCatalog() {
    let term = normalize($('search').value.trim());
    let filtered = items.filter(function (item) {
      return normalize(item.titre + ' ' + item.page + ' ' + item.fiche).includes(term);
    });
    $('catalog-list').replaceChildren();
    let fragment = document.createDocumentFragment();
    filtered.forEach(function (item) {
      let a = document.createElement('a'); a.className = 'catalog-item'; a.href = localURL(item.url);
      let badge = document.createElement('span'); badge.className = 'page-badge'; badge.textContent = 'p. ' + item.page;
      let title = document.createElement('span'); title.textContent = item.titre;
      let sub = document.createElement('small'); sub.textContent = 'FICHE ' + String(item.fiche).padStart(2, '0'); title.append(sub);
      let arrow = document.createElement('span'); arrow.className = 'arrow'; arrow.textContent = '↗'; arrow.setAttribute('aria-hidden', 'true');
      a.append(badge, title, arrow); fragment.append(a);
    });
    $('catalog-list').append(fragment);
    $('count').textContent = filtered.length + ' fiche(s) sur ' + items.length;
  }
  function stopCamera() {
    generation++; scanning = false;
    clearTimeout(timer);
    if (stream) stream.getTracks().forEach(function (track) { track.stop(); });
    stream = null;
    $('camera').srcObject = null;
    $('camera').hidden = true;
    $('camera-placeholder').hidden = false;
    $('stop-camera').hidden = true;
    $('start-camera').disabled = !ready || imageBusy;
    $('start-camera').textContent = 'Activer la caméra';
  }
  async function readQR(source) {
    if (detector) {
      try {
        let codes = await detector.detect(source);
        if (codes.length) return codes[0].rawValue;
      } catch (_) { /* jsQR assure le repli. */ }
    }
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
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        let code = await readQR(canvas);
        if (session !== generation) return;
        if (code && decoded(code)) return;
        if (code) $('scan-status').textContent = 'QR non reconnu. Visez le code du manuel STI en bas de page.';
      }
    } catch (_) { $('scan-status').textContent = 'Rapprochez le QR, sans couper ses bords.'; }
    if (scanning && session === generation) timer = setTimeout(function () { cameraTick(session); }, 240);
  }
  async function startCamera() {
    if (!ready || imageBusy) return;
    if (!window.isSecureContext || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      $('scan-status').textContent = 'La caméra exige HTTPS et un navigateur compatible. Choisissez une photo ou saisissez une page.';
      return;
    }
    stopCamera(); $('result').hidden = true; let session = generation;
    $('start-camera').disabled = true; $('start-camera').textContent = 'Autorisation…';
    $('stop-camera').hidden = false;
    try {
      let media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } }, audio: false });
      if (session !== generation) { media.getTracks().forEach(function (track) { track.stop(); }); return; }
      stream = media; $('camera').srcObject = media;
      $('camera').hidden = false; $('camera-placeholder').hidden = true;
      await $('camera').play();
      if (session !== generation) return;
      scanning = true;
      $('scan-status').textContent = 'Visez le QR contrasté, en gardant ses quatre bords dans l’image.';
      cameraTick(session);
    } catch (error) {
      if (session !== generation) return;
      stopCamera();
      $('scan-status').textContent = error.name === 'NotAllowedError'
        ? 'Autorisation refusée. Vous pouvez choisir une photo ou utiliser le numéro de page.'
        : 'Caméra indisponible. Fermez les autres applications caméra ou choisissez une photo.';
    }
  }
  async function photoChanged(event) {
    let file = event.target.files[0];
    if (!file || imageBusy || !ready) return;
    stopCamera(); $('result').hidden = true;
    if (!file.type.startsWith('image/') || file.size > 18 * 1024 * 1024) {
      $('scan-status').textContent = 'Choisissez une image de moins de 18 Mo (JPG ou PNG conseillé).'; event.target.value = ''; return;
    }
    imageBusy = true; $('photo').disabled = true; $('start-camera').disabled = true;
    $('scan-status').textContent = 'Recherche du QR dans la photo, sur votre appareil…';
    let blob = URL.createObjectURL(file);
    try {
      let image = new Image(); image.src = blob; await image.decode();
      // Le QR de lecture est en bas à droite : priorité à cette zone,
      // puis à l'image entière pour les photos recadrées ou tournées.
      let regions = [[0.5, 0.65, 0.5, 0.35], [0, 0, 1, 1]];
      for (let region of regions) {
        for (let max of [2000, 1200]) {
          let x = image.naturalWidth * region[0], y = image.naturalHeight * region[1];
          let w = image.naturalWidth * region[2], h = image.naturalHeight * region[3];
          let scale = Math.min(1, max / Math.max(w, h));
          canvas.width = Math.max(1, Math.round(w * scale)); canvas.height = Math.max(1, Math.round(h * scale));
          context.drawImage(image, x, y, w, h, 0, 0, canvas.width, canvas.height);
          let code = await readQR(canvas);
          if (code && decoded(code)) return;
          await new Promise(function (resolve) { setTimeout(resolve, 0); });
        }
      }
      $('scan-status').textContent = 'Aucun QR STI lisible. Recadrez le code en bas de page, améliorez la lumière ou saisissez le numéro de page.';
    } catch (_) {
      $('scan-status').textContent = 'Image non lisible dans ce navigateur. Essayez un JPG/PNG ou saisissez le numéro de page.';
    } finally {
      URL.revokeObjectURL(blob); imageBusy = false; $('photo').disabled = false;
      $('start-camera').disabled = false; event.target.value = '';
    }
  }
  $('page-form').addEventListener('submit', function (event) { event.preventDefault(); findPage(); });
  $('search').addEventListener('input', renderCatalog);
  $('start-camera').addEventListener('click', startCamera);
  $('stop-camera').addEventListener('click', function () { stopCamera(); $('scan-status').textContent = 'Caméra arrêtée.'; });
  $('photo').addEventListener('change', photoChanged);
  window.addEventListener('pagehide', stopCamera);
  document.addEventListener('visibilitychange', function () { if (document.hidden) stopCamera(); });
  async function init() {
    try {
      let response = await fetch('assets/data/smart-book-2026.json');
      if (!response.ok) throw new Error('Index indisponible');
      let data = await response.json();
      if (data.pages !== 74 || !Array.isArray(data.items) || data.items.length !== 69) throw new Error('Index incompatible');
      items = data.items;
      items.forEach(function (item) { localURL(item.url); allowed.set(new URL(item.url).href, item); });
      // Plusieurs fiches pointent vers la même section : le QR identifie la
      // section en ligne, pas toujours une fiche unique. Afficher le titre de
      // la section sans inventer une page dans ce cas.
      items.forEach(function (item) {
        let peers = items.filter(function (other) { return other.url === item.url; });
        if (peers.length > 1) allowed.set(item.url, { titre: item.section || ('Section du cours : ' + peers[0].titre), url: item.url, pages: peers.map(function (entry) { return entry.page; }) });
      });
      [publicBase.href, publicBase.href + 'index.html#cours', publicBase.href + 'index.html#modules'].forEach(function (url) {
        allowed.set(url, { titre: url.endsWith('#modules') ? 'Quiz de la plateforme STI' : 'Les cours de la plateforme STI', url: url });
      });
      if ('BarcodeDetector' in window) {
        try {
          let formats = await window.BarcodeDetector.getSupportedFormats();
          if (formats.includes('qr_code')) detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        } catch (_) { detector = null; }
      }
      ready = true;
      ['photo', 'start-camera', 'find-page', 'search'].forEach(function (id) { $(id).disabled = false; });
      renderCatalog();
      message('Manuel 2026 prêt : scan privé, photo ou recherche par page.');
      let page = new URLSearchParams(location.search).get('page');
      if (page !== null) { $('page-number').value = page; findPage(); }
    } catch (_) { message('Impossible de charger l’index du manuel. Actualisez la page avec Internet. Le PDF reste téléchargeable.', true); }
  }
  init();
})();
