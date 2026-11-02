/* ============================================================================
   MISSION CINÉMA — Service Worker (PWA / offline)
   Met en cache les ressources statiques pour utilisation hors ligne.
   ============================================================================ */

var CACHE_NAME = "stiv2-cinema-v1";
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
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(ASSETS);
    })
  );
});

// Activation : nettoyage des anciens caches
self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE_NAME; })
            .map(function (k) { return caches.delete(k); })
      );
    })
  );
});

// Interception des requêtes : cache-first
self.addEventListener("fetch", function (event) {
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) return cached;
      return fetch(event.request).then(function (response) {
        if (response && response.status === 200 && response.type === "basic") {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      });
    })
  );
});
