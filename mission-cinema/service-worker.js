/* ============================================================================
   MISSION CINÉMA — Service Worker (PWA / offline)
   Met en cache les ressources statiques pour utilisation hors ligne.
   ============================================================================ */

var CACHE_NAME = "stiv2-cinema-v7";
var ASSETS = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/questions.js",
  "./js/video.js",
  "./js/quiz.js",
  "./js/main.js",
  "./assets/images/sti-logo.png",
  "./assets/images/sti-badge.png",
  "./assets/images/schema-bd.jpg",
  "./manifest.json"
];

// Installation : mise en cache des ressources
self.addEventListener("install", function (event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(ASSETS);
    })
  );
});

// Activation : prendre le contrôle immédiatement et nettoyer les anciens caches
self.addEventListener("activate", function (event) {
  event.waitUntil(
    Promise.all([
      caches.keys().then(function (keys) {
        return Promise.all(
          keys.filter(function (k) { return k !== CACHE_NAME; })
              .map(function (k) { return caches.delete(k); })
        );
      }),
      self.clients.claim()
    ])
  );
});

// Interception des requêtes : network-first pour HTML/JS/CSS, cache-first pour le reste
self.addEventListener("fetch", function (event) {
  var url = event.request.url;
  var isCritical = url.indexOf("/index.html") !== -1 ||
                   url.indexOf("/css/style.css") !== -1 ||
                   url.indexOf("/js/") !== -1 ||
                   url.indexOf("./") === 0;

  if (isCritical) {
    // Network-first pour le HTML, CSS, JS
    event.respondWith(
      fetch(event.request).then(function (response) {
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      }).catch(function () {
        return caches.match(event.request);
      })
    );
  } else {
    // Cache-first pour les autres ressources (images, etc.)
    event.respondWith(
      caches.match(event.request).then(function (cached) {
        if (cached) return cached;
        return fetch(event.request);
      })
    );
  }
});
