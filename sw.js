/* STI by AE — Service Worker hors-ligne (PC Windows & Mobile) — v48 incrémentale
   RÈGLE MOBILE : une mise à jour automatique ne télécharge que les fichiers réellement modifiés.
   Le cache existant est migré localement, sans réseau, et le téléchargement intégral reste
   disponible uniquement après une action volontaire sur le bouton « Hors-ligne ». */

var CACHE = "sti-atelier-v316";
/* À chaque publication, ne placer ici QUE les chemins réellement modifiés.
   Ne jamais y ajouter automatiquement les vidéos, audios, PDF ou archives lourdes. */
var UPDATE_ID = "v422-annonce-restauration-2s";
/* Manifeste cumulatif : une révision déjà appliquée est ignorée localement.
   Une nouvelle révision ou un nouveau chemin est téléchargé automatiquement. */
var UPDATE_FILES = [
  { url: "./assets/js/sync-progressions.js", revision: "annonce22" },
  { url: "./assets/js/config.js", revision: "clic21" },
  { url: "./assets/js/mobile-nav.js", revision: "clic21" },
  { url: "./assets/js/roue-nuage.js", revision: "clic21" },
  { url: "./cours/html5.html", revision: "clic21" },
  { url: "./cours/courshtml5.html", revision: "clic21" },
  { url: "./exercices/series-exercices.html", revision: "clic21" },
  { url: "./index.html", revision: "clic21" },
  { url: "./assets/js/mobile-nav.js", revision: "bnav-vue-v420" },
  { url: "./assets/js/roue-nuage.js", revision: "bnav-vue-v420" },
  { url: "./assets/js/config.js", revision: "bnav-vue-v420" },
  { url: "./index.html", revision: "bnav-vue-v420" },
  { url: "./assets/js/acces.js", revision: "resume-milieu-v419" },
  { url: "./index.html", revision: "resume-milieu-v419" },
  { url: "./assets/js/mobile-nav.js", revision: "bnav-roue-v418" },
  { url: "./assets/js/roue-nuage.js", revision: "bnav-roue-v418" },
  { url: "./assets/js/config.js", revision: "bnav-roue-v418" },
  { url: "./index.html", revision: "bnav-roue-v418" },
  { url: "./assets/js/config.js", revision: "racine-v417" },
  { url: "./assets/js/mobile-nav.js", revision: "racine-v417" },
  { url: "./index.html", revision: "racine-v417" },
  { url: "./assets/js/acces.js", revision: "bnet-haut-v416" },
  { url: "./assets/js/mobile-nav.js", revision: "bnet-haut-v416" },
  { url: "./assets/js/config.js", revision: "bnet-haut-v416" },
  { url: "./index.html", revision: "bnet-haut-v416" },
  { url: "./memo-veille-bac.html", revision: "bnet-haut-v416" },
  { url: "./assets/js/mobile-nav.js", revision: "bnav-admin-out-v414" },
  { url: "./assets/js/config.js", revision: "bnav-admin-out-v414" },
  { url: "./index.html", revision: "bnav-admin-out-v414" },
  { url: "./assets/js/config.js", revision: "bnav-mobile-v413" },
  { url: "./assets/js/mobile-nav.js", revision: "bnav-mobile-v413" },
  { url: "./index.html", revision: "bnav-mobile-v413" },
  { url: "./exercices/javascript/js-37-defis-tt.html", revision: "bnav-mobile-v413" },
  { url: "./exercices/sql/CommentConstruireunerequêteSQL.html", revision: "bnav-admin-out-v415" },
  { url: "./assets/js/admin.js", revision: "news-switch-v406" },
  { url: "./admin.html", revision: "news-switch-v406" },
  { url: "./admin.html", revision: "outil-unique-v399" },
  { url: "./cours/sql-playground.html", revision: "sql-de-poche-v396" },
  { url: "./assets/js/sql-playground.js", revision: "moteur-sql-local-v396" },
  { url: "./memo-veille-bac.html", revision: "supabase-local-v395" },
  { url: "./pieges-bac.html", revision: "supabase-local-v395" },
  { url: "./assets/js/sync-progressions.js", revision: "journal-erreurs-v394" },
  { url: "./assets/js/acces.js", revision: "annexes-recherchees-v393" },
  { url: "./cours/css3.html", revision: "demo-display-3g-v393" },
  { url: "./assets/js/sync-progressions.js", revision: "sync-general-v391" },
  { url: "./glossaire.html", revision: "sync-general-v391" },
  { url: "./nouveautes.html", revision: "sync-general-v391" },
  { url: "./revision-erreurs.html", revision: "sync-general-v391" },
  { url: "./livre-smart.html", revision: "sync-general-v391" },
  { url: "./index.html", revision: "cote-instant-v412" },
  { url: "./assets/js/cote-ticker.js", revision: "cote-instant-v412" },
  { url: "./assets/js/retour-livre-smart.js", revision: "retour-intelligent-v380" },
  { url: "./assets/js/acces.js", revision: "signets-veilleuse-v390" },
  { url: "./assets/css/sombre-universel-v372.css", revision: "sombre-site-v372" },
  { url: "./manifest.webmanifest", revision: "pwa-install-v371" },
  { url: "./glossaire.html", revision: "glossaire-arabe-patch-v373" },
  { url: "./assets/js/graphiques-activite.js", revision: "glossaire-graphiques-v347" },
  { url: "./assets/js/reprendre.js", revision: "reprendre-sombre-v343" },
  { url: "./assets/css/smart-book-fan-v341.css", revision: "smart-books-v341" },
  { url: "./assets/css/smart-book-fan-v340.css", revision: "smart-books-v341" },
  { url: "./assets/images/smart-books/couverture-3si.jpg", revision: "smart-books-v339" },
  { url: "./assets/images/smart-books/couverture-4si.jpg", revision: "smart-books-v339" },
  { url: "./assets/data/smart-book-3si-2026.json", revision: "smart-books-v339" },
  { url: "./cours/php-mysqli.html", revision: "smart-book-v330" },
  { url: "./cours/php.html", revision: "cours-livre-v351" },
  { url: "./cours/sql-bases-ldd-lmd-lcd.html", revision: "cours-livre-v351" },
  { url: "./cours/javascript.html", revision: "cours-livre-v351" },
  { url: "./cours/html5.html", revision: "cours-livre-v351" },
  { url: "./livre-smart.html", revision: "smart-books-v341" },
  { url: "./assets/css/smart-book.css", revision: "smart-books-v341" },
  { url: "./assets/js/smart-book.js", revision: "smart-book-retour-v351" },
  { url: "./assets/data/smart-book-2026.json", revision: "smart-books-v339" },
  { url: "./assets/vendor/jsqr/jsQR.js", revision: "smart-book-v330" },
  { url: "./index.html", revision: "index-v357" },
  { url: "./quiz/tableaux.html", revision: "quiz-tableaux-v358" },
  { url: "./assets/js/quiz-tableaux.js", revision: "quiz-tableaux-v358" },
  { url: "./assets/js/quiz-sync.js", revision: "quiz-sync-v358" },
  { url: "./assets/js/quiz-admin.js", revision: "quiz-admin-v358" },
  { url: "./quiz/html-css.html", revision: "quiz-sync-v358" },
  { url: "./quiz/javascript.html", revision: "quiz-sync-v358" },
  { url: "./quiz/sql.html", revision: "quiz-sync-v358" },
  { url: "./quiz/php.html", revision: "quiz-sync-v358" },
  { url: "./assets/data/quiz-banque.json", revision: "quiz-banque-v357" },
  { url: "./assets/js/config.js", revision: "preconnect-v412" },
  { url: "./portail.html", revision: "portail-turnstile-v321" },
  { url: "./admin.html", revision: "admin-v358" },
  { url: "./assets/js/acces.js", revision: "version-affichee-v350" },
  { url: "./assets/js/admin.js", revision: "admin-version-affichee-v350" },
  { url: "./assets/css/admin-v19.css", revision: "admin-airbus-cockpit-v316-24" },
  { url: "./assets/icons/sti-logo-complet.png", revision: "official-full-logo-v316-20" },
  { url: "./assets/js/portail.js", revision: "portail-turnstile-v321" },
  { url: "./assets/js/modules/password-recovery.js", revision: "password-recovery-module-v307" },
  { url: "./assets/js/protection.js", revision: "video-sql-guide-texte-v329" },
  { url: "./assets/icons/STI_by_AE.ico", revision: "official-square-logo-v316-3" },
  { url: "./assets/js/sante.js", revision: "sante-video-paths-v309-hotfix-1" },
  { url: "./cours/css3.html", revision: "cours-livre-v351" },
  { url: "./cours/sql.html", revision: "cours-livre-v351" },
  { url: "./assets/subtitles/css3-cours-v9-sync-fr.vtt", revision: "css3-vtt-sync-v309" },
  { url: "./assets/images/css3-cours-v9-sync-poster.jpg", revision: "css3-poster-v309" },
  { url: "./assets/js/modules/admin-mfa.js", revision: "mfa-module-v302" },
  { url: "./assets/js/modules/mobile-diagnostics.js", revision: "diagnostics-module-v302" },
  { url: "./assets/js/modules/labo-device-client.js", revision: "labo-portable-local-v315" },
  { url: "./assets/js/modules/admin-labo-devices.js", revision: "labo-confirm-ui-v312" },
  { url: "./assets/js/modules/labo-offline-diagnostics.js", revision: "offline-diagnostics-v315" },
  { url: "./exercices/series-exercices.html", revision: "video-sql-guide-texte-v329" },
  { url: "./exercices/sql/CommentConstruireunerequêteSQL.html", revision: "guide-sql-v328" },
  { url: "./exercices/javascript/js-37-defis-tt.html", revision: "js-37-defis-bimode-v318" },
  { url: "./offline-complete-manifest.json", revision: "smart-books-v341" },
  { url: "./Lancer-Labo3-Hors-Ligne.bat", revision: "portable-launcher-v315" },
  { url: "./Lancer-Labo3-Hors-Ligne.ps1", revision: "portable-powershell-server-v315" }
];
var CACHE_REVISIONS = "sti-update-revisions-v1";
var CACHE_VIDEOS_LABO = "sti-videos-labo-v1";
var CACHE_LRU_META = "sti-runtime-lru-v302";
var MAX_RUNTIME_BYTES = 180 * 1024 * 1024;

function tailleReponseSTI(rep) {
  if (!rep || !rep.headers) return 0;
  var n = parseInt(rep.headers.get("content-length") || "0", 10);
  return isFinite(n) && n > 0 ? n : 0;
}
function cleMetaLRUSTI(url) {
  return new Request(new URL("./__sti_lru__/" + encodeURIComponent(url), self.location.href).toString());
}
async function toucherLRUSTI(req, rep, cacheName, type) {
  try {
    var meta = await caches.open(CACHE_LRU_META);
    var objet = {
      url: typeof req === "string" ? new URL(req, self.location.href).toString() : req.url,
      cache: cacheName,
      type: type || "runtime",
      bytes: tailleReponseSTI(rep),
      at: Date.now()
    };
    await meta.put(cleMetaLRUSTI(objet.url), new Response(JSON.stringify(objet), { headers: { "Content-Type": "application/json" } }));
  } catch (e) {}
}
async function rafraichirLRUExistantSTI(req, rep, cacheName, type) {
  try {
    var url = typeof req === "string" ? new URL(req, self.location.href).toString() : req.url;
    var meta = await caches.open(CACHE_LRU_META);
    if (await meta.match(cleMetaLRUSTI(url))) await toucherLRUSTI(req, rep, cacheName, type);
  } catch (e) {}
}
async function lireEntreesLRUSTI() {
  var meta = await caches.open(CACHE_LRU_META);
  var cles = await meta.keys();
  var lignes = [];
  for (var i = 0; i < cles.length; i++) {
    try {
      var r = await meta.match(cles[i]);
      var j = r ? await r.json() : null;
      if (j && j.url) { j._metaKey = cles[i]; lignes.push(j); }
    } catch (e) {}
  }
  return lignes;
}
async function notifierStockageSTI(extra) {
  var estimation = {};
  try {
    if (self.navigator && self.navigator.storage && self.navigator.storage.estimate) estimation = await self.navigator.storage.estimate();
  } catch (e) {}
  var lignes = [];
  try { lignes = await lireEntreesLRUSTI(); } catch (e) {}
  var runtime = lignes.reduce(function (n, x) { return n + (Number(x.bytes) || 0); }, 0);
  var payload = Object.assign({
    type: "STI_STORAGE_STATUS",
    usage: Number(estimation.usage) || runtime,
    quota: Number(estimation.quota) || 0,
    runtimeBytes: runtime,
    runtimeEntries: lignes.length
  }, extra || {});
  var clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  for (var c of clients) c.postMessage(payload);
}
async function evincerRuntimeLRUSTI(force) {
  var lignes = await lireEntreesLRUSTI();
  var estimation = {};
  try {
    if (self.navigator && self.navigator.storage && self.navigator.storage.estimate) estimation = await self.navigator.storage.estimate();
  } catch (e) {}
  var quota = Number(estimation.quota) || 0;
  var usage = Number(estimation.usage) || 0;
  var runtime = lignes.reduce(function (n, x) { return n + (Number(x.bytes) || 0); }, 0);
  var pression = quota > 0 && usage / quota >= 0.82;
  if (!force && !pression && runtime <= MAX_RUNTIME_BYTES) { notifierStockageSTI(); return; }
  lignes.sort(function (a, b) { return (Number(a.at) || 0) - (Number(b.at) || 0); });
  var cible = force ? 0 : Math.min(MAX_RUNTIME_BYTES * 0.72, pression ? Math.max(0, runtime - (usage - quota * 0.70)) : MAX_RUNTIME_BYTES * 0.72);
  var liberes = 0;
  var nb = 0;
  var meta = await caches.open(CACHE_LRU_META);
  for (var i = 0; i < lignes.length && runtime - liberes > cible; i++) {
    var l = lignes[i];
    try {
      var c = await caches.open(l.cache === CACHE_VIDEOS_LABO ? CACHE_VIDEOS_LABO : CACHE);
      await c.delete(l.url, { ignoreSearch: true });
      await meta.delete(l._metaKey);
      liberes += Number(l.bytes) || 0;
      nb++;
    } catch (e) {}
  }
  await notifierStockageSTI({ evictedEntries: nb, evictedBytes: liberes });
}
async function mettreCacheRuntimeSTI(cache, req, rep, type) {
  try {
    var nomCache = type === "media" ? CACHE_VIDEOS_LABO : CACHE;
    await cache.put(req, rep);
    await toucherLRUSTI(req, rep, nomCache, type);
    await evincerRuntimeLRUSTI(false);
  } catch (e) {}
}
async function signalerCacheEviteSTI(rep) {
  var octets = tailleReponseSTI(rep);
  var clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  for (var c of clients) c.postMessage({ type: "STI_CACHE_HIT", bytes: octets });
}
var SHELL = [
  "./",
  "./index.html",
  "./portail.html",
  "./admin.html",
  "./bac-pratique.html",
  "./pieges-bac.html",
  "./memo-veille-bac.html",
  "./outils-js-bac.html",
  "./exercices/php/Tp1-php.html",
  "./exercices/php/Tp1-Correction-php.html",
  "./exercices/php/Tp4-php.html",
  "./exercices/php/Tp4-Correction-php.html",
  "./exercices/php/Tp5-php.html",
  "./exercices/php/Tp5-Correction-php.html",
  "./exercices/php/trace-fetch-php.html",
  "./exercices/php/ordre-php-bac.html",
  "./exercices/php/debogage-php-bac.html",
  "./carte-visite.html",
  "./README.md",
  "./manifest.webmanifest",
  "./assets/css/atelier.css",
  "./assets/css/atelier-pages.css",
  "./assets/css/protection.css",
  "./assets/css/tailwind.css",
  "./assets/js/config.js",
  "./assets/js/supabase-umd.js",
  "./assets/js/protection.js",
  "./assets/js/acces.js",
  "./assets/js/portail.js",
  "./assets/js/admin.js",
  "./assets/fonts/fonts.css",
  "./assets/fontawesome/css/all.min.css",
  "./assets/icons/STI_by_AE.ico",
  "./assets/icons/sti-icon-192.png",
  "./assets/icons/sti-icon-512.png",
  "./assets/images/sti-course-pause-qr.png",
  "./assets/images/php-guichet-v10-poster.jpg",
  "./assets/images/css3-cours-v9-sync-poster.jpg",
  "./assets/images/css-restaurant-capture-v298.jpg",
  "./assets/subtitles/css3-cours-v9-sync-fr.vtt",
  "./assets/images/guichet-animation-capture-v288.jpg",
  "./cours/html5.html",
  "./cours/css3.html",
  "./cours/fiche-revision-html5.html",
  "./cours/annexe-fleuriste-html5.html",
  "./Positionnement-animee/index.html",
  "./Positionnement-animee/cours.js",
  "./Positionnement-animee/style.css",
  "./cssanimee/index.html",
  "./cssanimee/cours.js",
  "./cssanimee/style.css",
  "./cours/javascript.html",
  "./cours/Recap-JavaScript-STI.html",
  "./cours/php.html",
  "./cours/coursphp.html",
  "./cours/PHP-recap.html",
  "./cours/php-recap.html",
  "./cours/php-mysqli.html",
  "./cours/sql.html",
  "./cours/sql-contraintes.html",
  "./exercices/series-exercices.html",
  "./exercices/resume-fonctions-standards.html",
  "./exercices/sql/Tp1-bd.html",
  "./exercices/sql/Tp1-Correction-bd.html",
  "./exercices/sql/Tp2-bd.html",
  "./exercices/sql/Tp2-Correction-bd.html",
  "./exercices/sql/Tp-GroupBy-bd.html",
  "./exercices/sql/Tp3-Correction-bd.html",
  "./exercices/sql/Tp-BD-Jointure-sous-requetes-Group-By.html",
  "./exercices/sql/Tp4-correction-bd.html",
  "./exercices/sql/Tp-date-ssr-j-gp-bd.html",
  "./exercices/sql/Tp-date-ssr-j-gp-correction-bd.html",
  "./exercices/sql/sql.html",
  "./exercices/sql/sql-correction.html",
  "./exercices/sql/atelier_sql_3_fenetres.html",
  "./exercices/sql/CommentConstruireunerequêteSQL.html",
  "./exercices/javascript/Tp1-js.html",
  "./exercices/javascript/Tp1-Correction-js.html",
  "./exercices/javascript/Tp2-js.html",
  "./exercices/javascript/Tp2-Correction-js.html",
  "./exercices/javascript/Tp3-js.html",
  "./exercices/javascript/Tp3-Correction-js.html",
  "./exercices/javascript/Tp4-js.html",
  "./exercices/javascript/Tp4-Correction-js.html",
  "./exercices/javascript/Tp5-js.html",
  "./exercices/javascript/Tp5-Correction-js.html",
  "./exercices/php/Tp1-php.html",
  "./exercices/php/Tp2-php.html",
  "./exercices/php/Tp2-Correction-php.html",
  "./exercices/php/Tp3-php.html",
  "./exercices/php/Tp3-correction-php.html",
  "./exercices/php/Tp4-php.html",
  "./exercices/php/sondage-parcours-pas-a-pas.html",
  "./exercices/php/statphpanimee.html",
  "./exercices/html-css/box-shadow-text-shadow-css3.html",
  "./exercices/html-css/emploi-temps/emploidutemps.html",
  "./exercices/html-css/TP2/tp2corrposition.html",
  "./exercices/html-css/TP2/style2.css",
  "./quiz/html-css.html",
  "./quiz/javascript.html",
  "./quiz/php.html",
  "./quiz/tableaux.html",
  "./quiz/pp.html",
  "./quiz/sql.html",
  "./projets/sti0/index.html",
  "./projets/sti0/Sondage.html",
  "./projets/sti0/Statistiques.html",
  "./projets/sti0/projetsti0.pdf",
  "./projets/sti0/projetsti0.pdf.html",
  "./projets/sti0/ressources-projet-sti0.zip"
];

var OFFLINE_LIST = [
  "./404.html",
  "./Positionnement-animee/bonus-flex.css",
  "./Positionnement-animee/cours.js",
  "./Positionnement-animee/index.html",
  "./Positionnement-animee/style.css",
  "./Positionnement-animee/uploads/Annexe CSS3 By A.E.pdf",
  "./Positionnement-animee/uploads/Annexe HTML5 By A.E.pdf",
  "./admin.html",
  "./assets/audio/foret.mp3",
  "./assets/audio/guichet-etapes.mp3",
  "./assets/audio/css-positionnement.mp3",
  "./assets/audio/css-animee.mp3",
  "./assets/js/quiz-tableaux.js",
  "./assets/js/quiz-sync.js",
  "./assets/data/quiz-banque.json",
  "./assets/audio/sql-cours.mp3",
  "./assets/css/atelier-pages.css",
  "./assets/css/atelier-php.css",
  "./assets/css/atelier.css",
  "./assets/css/css.css",
  "./assets/css/html.css",
  "./assets/css/js.css",
  "./assets/css/php.css",
  "./assets/css/protection.css",
  "./assets/css/sql.css",
  "./assets/css/tailwind.css",
  "./assets/fontawesome/LICENSE.txt",
  "./assets/fontawesome/css/all.min.css",
  "./assets/fontawesome/webfonts/fa-brands-400.woff2",
  "./assets/fontawesome/webfonts/fa-regular-400.woff2",
  "./assets/fontawesome/webfonts/fa-solid-900.woff2",
  "./assets/fonts/baloo-2-latin-ext.woff2",
  "./assets/fonts/baloo-2-latin.woff2",
  "./assets/fonts/fonts.css",
  "./assets/fonts/jetbrains-mono-latin-ext.woff2",
  "./assets/fonts/jetbrains-mono-latin.woff2",
  "./assets/fonts/manrope-latin-ext.woff2",
  "./assets/fonts/manrope-latin.woff2",
  "./assets/icons/STI_by_AE.ico",
  "./assets/icons/sti-icon-192.png",
  "./assets/icons/sti-icon-512.png",
  "./assets/images/JavaScript_logo.svg",
  "./assets/images/carte-visite-sti-v2.png",
  "./assets/images/lycee_logo.png",
  "./assets/images/qr-code-site.png",
  "./assets/images/qr-stiv2.png",
  "./assets/images/sti-course-pause-qr.png",
  "./assets/images/php-guichet-v10-poster.jpg",
  "./assets/js/acces.js",
  "./assets/js/admin.js",
  "./assets/js/config.js",
  "./assets/js/portail.js",
  "./assets/js/protection.js",
  "./assets/js/supabase-umd.js",
  "./assets/video/flower.webm",
  "./bac-pratique.html",
  "./carte-visite.html",
  "./cours/annexe-fleuriste-html5.html",
  "./cours/courscss3.html",
  "./cours/courshtml5.html",
  "./cours/coursphp.html",
  "./cours/css3.html",
  "./cours/datalist.html",
  "./cours/fiche-revision-html5.html",
  "./cours/html5.html",
  "./cours/javascript.html",
  "./cours/Recap-JavaScript-STI.html",
  "./cours/PHP-recap.html",
  "./cours/php-recap.html",
  "./cours/php-mysqli.html",
  "./cours/php.html",
  "./cours/sql-bases-ldd-lmd-lcd.html",
  "./cours/sql-contraintes.html",
  "./cours/sql.html",
  "./cssanimee/cours.js",
  "./cssanimee/index.html",
  "./cssanimee/style.css",
  "./documents/bd/ecole.sql",
  "./documents/annexes/annexe-css3.pdf",
  "./documents/annexes/annexe-css3.pdf.assets/page-01.jpg",
  "./documents/annexes/annexe-css3.pdf.assets/page-02.jpg",
  "./documents/annexes/annexe-css3.pdf.assets/page-03.jpg",
  "./documents/annexes/annexe-css3.pdf.assets/page-04.jpg",
  "./documents/annexes/annexe-css3.pdf.assets/page-05.jpg",
  "./documents/annexes/annexe-css3.pdf.assets/page-06.jpg",
  "./documents/annexes/annexe-css3.pdf.assets/page-07.jpg",
  "./documents/annexes/annexe-css3.pdf.assets/page-08.jpg",
  "./documents/annexes/annexe-css3.pdf.assets/page-09.jpg",
  "./documents/annexes/annexe-css3.pdf.html",
  "./documents/annexes/annexe-html5.pdf",
  "./documents/annexes/annexe-html5.pdf.assets/page-01.jpg",
  "./documents/annexes/annexe-html5.pdf.assets/page-02.jpg",
  "./documents/annexes/annexe-html5.pdf.assets/page-03.jpg",
  "./documents/annexes/annexe-html5.pdf.assets/page-04.jpg",
  "./documents/annexes/annexe-html5.pdf.assets/page-05.jpg",
  "./documents/annexes/annexe-html5.pdf.assets/page-06.jpg",
  "./documents/annexes/annexe-html5.pdf.html",
  "./documents/annexes/annexe-javascript.pdf",
  "./documents/annexes/annexe-javascript.pdf.assets/page-01.jpg",
  "./documents/annexes/annexe-javascript.pdf.assets/page-02.jpg",
  "./documents/annexes/annexe-javascript.pdf.assets/page-03.jpg",
  "./documents/annexes/annexe-javascript.pdf.assets/page-04.jpg",
  "./documents/annexes/annexe-javascript.pdf.html",
  "./documents/annexes/annexe-php.pdf",
  "./documents/annexes/annexe-php.pdf.assets/page-01.jpg",
  "./documents/annexes/annexe-php.pdf.assets/page-02.jpg",
  "./documents/annexes/annexe-php.pdf.assets/page-03.jpg",
  "./documents/annexes/annexe-php.pdf.assets/page-04.jpg",
  "./documents/annexes/annexe-php.pdf.assets/page-05.jpg",
  "./documents/annexes/annexe-php.pdf.assets/page-06.jpg",
  "./documents/annexes/annexe-php.pdf.assets/page-07.jpg",
  "./documents/annexes/annexe-php.pdf.assets/page-08.jpg",
  "./documents/annexes/annexe-php.pdf.assets/page-09.jpg",
  "./documents/annexes/annexe-php.pdf.assets/page-10.jpg",
  "./documents/annexes/annexe-php.pdf.html",
  "./documents/annexes/annexe-sql.pdf",
  "./documents/annexes/annexe-sql.pdf.assets/page-01.jpg",
  "./documents/annexes/annexe-sql.pdf.assets/page-02.jpg",
  "./documents/annexes/annexe-sql.pdf.assets/page-03.jpg",
  "./documents/annexes/annexe-sql.pdf.assets/page-04.jpg",
  "./documents/annexes/annexe-sql.pdf.assets/page-05.jpg",
  "./documents/annexes/annexe-sql.pdf.assets/page-06.jpg",
  "./documents/annexes/annexe-sql.pdf.assets/page-07.jpg",
  "./documents/annexes/annexe-sql.pdf.html",
  "./documents/complet/complet-3eme-si-bd.pdf",
  "./documents/complet/complet-3eme-si-bd.pdf.assets/page-01.jpg",
  "./documents/complet/complet-3eme-si-bd.pdf.assets/page-02.jpg",
  "./documents/complet/complet-3eme-si-bd.pdf.assets/page-03.jpg",
  "./documents/complet/complet-3eme-si-bd.pdf.assets/page-04.jpg",
  "./documents/complet/complet-3eme-si-bd.pdf.assets/page-05.jpg",
  "./documents/complet/complet-3eme-si-bd.pdf.assets/page-06.jpg",
  "./documents/complet/complet-3eme-si-bd.pdf.assets/page-07.jpg",
  "./documents/complet/complet-3eme-si-bd.pdf.assets/page-08.jpg",
  "./documents/complet/complet-3eme-si-bd.pdf.assets/page-09.jpg",
  "./documents/complet/complet-3eme-si-bd.pdf.assets/page-10.jpg",
  "./documents/complet/complet-3eme-si-bd.pdf.assets/page-11.jpg",
  "./documents/complet/complet-3eme-si-bd.pdf.assets/page-12.jpg",
  "./documents/complet/complet-3eme-si-bd.pdf.assets/page-13.jpg",
  "./documents/complet/complet-3eme-si-bd.pdf.html",
  "./documents/complet/complet-3eme-si.pdf",
  "./documents/complet/complet-3eme-si.pdf.assets/page-01.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-02.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-03.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-04.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-05.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-06.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-07.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-08.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-09.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-10.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-11.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-12.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-13.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-14.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-15.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-16.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-17.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-18.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-19.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-20.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-21.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-22.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-23.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-24.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-25.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-26.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-27.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-28.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-29.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-30.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-31.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-32.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-33.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-34.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-35.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-36.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-37.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-38.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-39.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-40.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-41.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-42.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-43.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-44.jpg",
  "./documents/complet/complet-3eme-si.pdf.assets/page-45.jpg",
  "./documents/complet/complet-3eme-si.pdf.html",
  "./documents/complet/complet-4eme-si-cours.pdf",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-01.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-02.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-03.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-04.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-05.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-06.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-07.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-08.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-09.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-10.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-11.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-12.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-13.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-14.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-15.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-16.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-17.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-18.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-19.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-20.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-21.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-22.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-23.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-24.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-25.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-26.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-27.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-28.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-29.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-30.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-31.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-32.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-33.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-34.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-35.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-36.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-37.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-38.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-39.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-40.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-41.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-42.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-43.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-44.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-45.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-46.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-47.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-48.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-49.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-50.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-51.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-52.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-53.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-54.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-55.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-56.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-57.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-58.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-59.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-60.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-61.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-62.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-63.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-64.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.assets/page-65.jpg",
  "./documents/complet/complet-4eme-si-cours.pdf.html",
  "./documents/complet/complet-4eme-si-resume.pdf",
  "./documents/complet/complet-4eme-si-resume.pdf.assets/page-01.jpg",
  "./documents/complet/complet-4eme-si-resume.pdf.assets/page-02.jpg",
  "./documents/complet/complet-4eme-si-resume.pdf.assets/page-03.jpg",
  "./documents/complet/complet-4eme-si-resume.pdf.assets/page-04.jpg",
  "./documents/complet/complet-4eme-si-resume.pdf.assets/page-05.jpg",
  "./documents/complet/complet-4eme-si-resume.pdf.assets/page-06.jpg",
  "./documents/complet/complet-4eme-si-resume.pdf.assets/page-07.jpg",
  "./documents/complet/complet-4eme-si-resume.pdf.assets/page-08.jpg",
  "./documents/complet/complet-4eme-si-resume.pdf.assets/page-09.jpg",
  "./documents/complet/complet-4eme-si-resume.pdf.assets/page-10.jpg",
  "./documents/complet/complet-4eme-si-resume.pdf.assets/page-11.jpg",
  "./documents/complet/complet-4eme-si-resume.pdf.assets/page-12.jpg",
  "./documents/complet/complet-4eme-si-resume.pdf.assets/page-13.jpg",
  "./documents/complet/complet-4eme-si-resume.pdf.assets/page-14.jpg",
  "./documents/complet/complet-4eme-si-resume.pdf.html",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Enonce.docx",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Enonce.pdf",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Enonce.pdf.assets/page-01-v157.jpg",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Enonce.pdf.assets/page-02-v157.jpg",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Enonce.pdf.assets/page-03-v157.jpg",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Enonce.pdf.assets/page-04-v157.jpg",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Enonce.pdf.assets/page-05-v157.jpg",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Enonce.pdf.assets/page-06-v157.jpg",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Enonce.pdf.assets/page-01.jpg",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Enonce.pdf.assets/page-02.jpg",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Enonce.pdf.assets/page-03.jpg",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Enonce.pdf.assets/page-04.jpg",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Enonce.pdf.assets/page-05.jpg",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Enonce.pdf.assets/page-06.jpg",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Enonce.pdf.html",
  "./exercices/html-css/Explore_Tunisie/images.rar",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Images/ExploreTunisie/images.rar",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Images/ExploreTunisie/images/djerba.jpg",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Images/ExploreTunisie/images/presentation.jpg",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Images/ExploreTunisie/images/sahara.jpg",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Images/ExploreTunisie/images/sidi-bou-said.jpg",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Solution/ExploreTunisie/index.html",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Solution/ExploreTunisie/index-float.html",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Solution/ExploreTunisie/index-position.html",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Solution/ExploreTunisie/style.css",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Solution/ExploreTunisie/style-flex.css",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Solution/ExploreTunisie/style-float.css",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Solution/ExploreTunisie/style-position.css",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Solution/ExploreTunisie/images/djerba.jpg",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Solution/ExploreTunisie/images/presentation.jpg",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Solution/ExploreTunisie/images/sahara.jpg",
  "./exercices/html-css/Explore_Tunisie/Explore_Tunisie_Solution/ExploreTunisie/images/sidi-bou-said.jpg",
  "./exercices/html-css/TP1-css.pdf",
  "./exercices/html-css/TP1-css.pdf.assets/page-01.jpg",
  "./exercices/html-css/TP1-css.pdf.html",
  "./exercices/html-css/TP2-css.pdf",
  "./exercices/html-css/TP2-css.pdf.assets/page-01.jpg",
  "./exercices/html-css/TP2-css.pdf.assets/page-02.jpg",
  "./exercices/html-css/TP2-css.pdf.assets/page-03.jpg",
  "./exercices/html-css/TP2-css.pdf.html",
  "./exercices/html-css/TP2/style2.css",
  "./exercices/html-css/TP2/tp2corrposition.html",
  "./exercices/html-css/TP3-css.pdf",
  "./exercices/html-css/TP3-css.pdf.assets/page-01.jpg",
  "./exercices/html-css/TP3-css.pdf.assets/page-02.jpg",
  "./exercices/html-css/TP3-css.pdf.html",
  "./exercices/html-css/activite-html-css/Act1/page1.html",
  "./exercices/html-css/activite-html-css/Act1/style.css",
  "./exercices/html-css/activite-html-css/Act2/page2.html",
  "./exercices/html-css/activite-html-css/Act2/style2.css",
  "./exercices/html-css/activite1-2-position-animation-css3.pdf",
  "./exercices/html-css/activite1-2-position-animation-css3.pdf.assets/page-01.jpg",
  "./exercices/html-css/activite1-2-position-animation-css3.pdf.assets/page-02.jpg",
  "./exercices/html-css/activite1-2-position-animation-css3.pdf.assets/page-03.jpg",
  "./exercices/html-css/activite1-2-position-animation-css3.pdf.html",
  "./exercices/html-css/box-shadow-text-shadow-css3.html",
  "./exercices/html-css/emploi-temps/emploidutemps.html",
  "./exercices/html-css/formulaire-inscription.pdf",
  "./exercices/html-css/formulaire-inscription.pdf.assets/page-01.jpg",
  "./exercices/html-css/formulaire-inscription.pdf.assets/page-02.jpg",
  "./exercices/html-css/formulaire-inscription.pdf.html",
  "./exercices/javascript/Tp1-Correction-js.html",
  "./exercices/javascript/Tp1-js.html",
  "./exercices/javascript/Tp2-Correction-js.html",
  "./exercices/javascript/Tp2-js.html",
  "./exercices/javascript/Tp3-Correction-js.html",
  "./exercices/javascript/Tp3-js.html",
  "./exercices/javascript/Tp4-Correction-js.html",
  "./exercices/javascript/Tp4-js.html",
  "./exercices/javascript/Tp5-Correction-js.html",
  "./exercices/javascript/Tp5-js.html",
  "./exercices/php/Tp1-php.html",
  "./exercices/php/Tp2-Correction-php.html",
  "./exercices/php/Tp2-php.html",
  "./exercices/php/Tp3-correction-php.html",
  "./exercices/php/Tp3-php.html",
  "./exercices/php/Tp4-php.html",
  "./exercices/php/DC6Sti2025-2026.rar",
  "./exercices/php/sondage-parcours-pas-a-pas.html",
  "./exercices/php/statphpanimee.html",
  "./exercices/php/4STi-dc-6-2025-2026.pdf",
  "./exercices/php/4STi-dc-6-2025-2026.pdf.html",
  "./exercices/php/4STi-dc-6-2025-2026.pdf.assets/page-01.jpg",
  "./exercices/php/4STi-dc-6-2025-2026.pdf.assets/page-02.jpg",
  "./exercices/php/4STi-dc-6-2025-2026.pdf.assets/page-03.jpg",
  "./exercices/php/4STi-dc-6-2025-2026.pdf.assets/page-04.jpg",
  "./exercices/resume-fonctions-standards.html",
  "./exercices/series-exercices.html",
  "./exercices/sql/Tp-BD-Jointure-sous-requetes-Group-By.html",
  "./exercices/sql/Tp-GroupBy-bd.html",
  "./exercices/sql/Tp-date-ssr-j-gp-bd.html",
  "./exercices/sql/Tp-date-ssr-j-gp-correction-bd.html",
  "./exercices/sql/Tp1-Correction-bd.html",
  "./exercices/sql/Tp1-bd.html",
  "./exercices/sql/Tp2-Correction-bd.html",
  "./exercices/sql/Tp2-bd.html",
  "./exercices/sql/Tp3-Correction-bd.html",
  "./exercices/sql/Tp4-correction-bd.html",
  "./exercices/sql/Série 4.2 - GestLocation - énoncé.pdf",
  "./exercices/sql/Série 4.2 - GestLocation - Corrigé.pdf",
  "./exercices/sql/Série 4.2 - GestLocation - Vidéo.mp4",
  "./exercices/sql/Série 4.2 - GestLocation - MySQL.sql",
  "./exercices/sql/atelier_sql_3_fenetres.html",
  "./exercices/sql/CommentConstruireunerequêteSQL.html",
  "./exercices/sql/sql-correction.html",
  "./exercices/sql/sql.html",
  "./index.html",
  "./manifest.webmanifest",
  "./portail.html",
  "./projets/carte-bancaire/cb.html",
  "./projets/carte-bancaire/controle.js",
  "./projets/carte-bancaire/enonce-tp-carte-bancaire.html",
  "./projets/carte-bancaire/media/STI_by_AE.ico",
  "./projets/carte-bancaire/media/cap1.png",
  "./projets/carte-bancaire/media/cap2.png",
  "./projets/carte-bancaire/style.css",
  "./projets/fleurs.zip",
  "./projets/fleurs/Corrections.html",
  "./projets/fleurs/affichage-condidat.php",
  "./projets/fleurs/ajout.php",
  "./projets/fleurs/controle.js",
  "./projets/fleurs/controlecorrection.js",
  "./projets/fleurs/index.html",
  "./projets/fleurs/inscription.html",
  "./projets/fleurs/media/Lyc",
  "./projets/fleurs/media/femme.jpg",
  "./projets/fleurs/media/fleur.png",
  "./projets/fleurs/media/flower.webm",
  "./projets/fleurs/media/formulaire1.png",
  "./projets/fleurs/media/formulaire2.png",
  "./projets/fleurs/media/formulaire3.png",
  "./projets/fleurs/media/homme.png",
  "./projets/fleurs/media/lesTextes.txt",
  "./projets/fleurs/media/logo.png",
  "./projets/fleurs/media/orchidee.jpg",
  "./projets/fleurs/media/pageindex.png",
  "./projets/fleurs/media/pivoine.jpg",
  "./projets/fleurs/media/projet-fleurs-3sti-corrige.docx",
  "./projets/fleurs/media/projet-fleurs-4sti-corrige.docx",
  "./projets/fleurs/media/projet-fleurs-4sti-eleve.docx",
  "./projets/fleurs/media/projet-fleurs-4sti-eleve.pdf",
  "./projets/fleurs/media/projet-fleurs-4sti-eleve.pdf.assets/page-01.jpg",
  "./projets/fleurs/media/projet-fleurs-4sti-eleve.pdf.assets/page-02.jpg",
  "./projets/fleurs/media/projet-fleurs-4sti-eleve.pdf.assets/page-03.jpg",
  "./projets/fleurs/media/projet-fleurs-4sti-eleve.pdf.assets/page-04.jpg",
  "./projets/fleurs/media/projet-fleurs-4sti-eleve.pdf.assets/page-05.jpg",
  "./projets/fleurs/media/projet-fleurs-4sti-eleve.pdf.html",
  "./projets/fleurs/media/projet-fleurs.docx",
  "./projets/fleurs/media/tulipes.jpg",
  "./projets/fleurs/mise-a-jour-condidat.php",
  "./projets/fleurs/stylecorrection.css",
  "./projets/fleurs/styles.css",
  "./projets/formulaire-inscription/cvFleurs.html",
  "./projets/formulaire-inscription/enonce/cvFleurs-énoncé/formulaire inscription.pdf",
  "./projets/formulaire-inscription/enonce/cvFleurs-énoncé/formulaire inscription.pdf.assets/page-01.jpg",
  "./projets/formulaire-inscription/enonce/cvFleurs-énoncé/formulaire inscription.pdf.assets/page-02.jpg",
  "./projets/formulaire-inscription/enonce/cvFleurs-énoncé/formulaire inscription.pdf.html",
  "./projets/formulaire-inscription/enonce/lycee-rafha-niveau.docx",
  "./projets/formulaire-inscription/media/SON.mp3",
  "./projets/formulaire-inscription/media/femme.jpg",
  "./projets/formulaire-inscription/media/fleur.png",
  "./projets/formulaire-inscription/media/flower.webm",
  "./projets/formulaire-inscription/media/homme.png",
  "./projets/formulaire-inscription/media/imageslider1.jpg",
  "./projets/formulaire-inscription/media/imageslider2.jpg",
  "./projets/formulaire-inscription/media/imageslider3.jpg",
  "./projets/formulaire-inscription/media/imageslider4.jpg",
  "./projets/formulaire-inscription/media/logo.png",
  "./projets/formulaire-inscription/media/orchidee.jpg",
  "./projets/formulaire-inscription/media/pageindex.png",
  "./projets/formulaire-inscription/media/pivoine.jpg",
  "./projets/formulaire-inscription/media/tulipes.jpg",
  "./projets/site-tunisie/correction-details/carte-timbre-droite-haut.html",
  "./projets/site-tunisie/enonce.html",
  "./projets/site-tunisie/images/carte-tunisie.png",
  "./projets/site-tunisie/images/centre.jpg",
  "./projets/site-tunisie/images/nord.jpg",
  "./projets/site-tunisie/images/oud-c-arabian.mp3",
  "./projets/site-tunisie/images/portrait.jpg",
  "./projets/site-tunisie/images/sidibou.mp4",
  "./projets/site-tunisie/images/sud.jpg",
  "./projets/site-tunisie/index.html",
  "./projets/site-tunisie/pages/accueil.html",
  "./projets/site-tunisie/pages/centre.html",
  "./projets/site-tunisie/pages/nord.html",
  "./projets/site-tunisie/pages/sud.html",
  "./projets/site-tunisie/ressources-site-tunisie.rar",
  "./projets/site-tunisie/site-tunisie-Correction-animation-html-css.html",
  "./projets/sti0/Sondage.html",
  "./projets/sti0/Statistiques.html",
  "./projets/sti0/index.html",
  "./projets/sti0/projetsti0.pdf",
  "./projets/sti0/projetsti0.pdf.assets/page-01.jpg",
  "./projets/sti0/projetsti0.pdf.assets/page-02.jpg",
  "./projets/sti0/projetsti0.pdf.assets/page-03.jpg",
  "./projets/sti0/projetsti0.pdf.assets/page-04.jpg",
  "./projets/sti0/projetsti0.pdf.html",
  "./projets/sti0/ressources-projet-sti0.zip",
  "./projets/sti0/sondage.html",
  "./projets/sti0/statistiques.html",
  "./quiz/html-css.html",
  "./quiz/javascript.html",
  "./quiz/php.html",
  "./quiz/pp.html",
  "./quiz/sql.html",
  "./assets/audio/sql-cours.mp3",
  "./assets/audio/sql-serie1.mp3",
  "./assets/audio/sql-serie2.mp3",
  "./assets/audio/sql-serie3.mp3",
  "./assets/audio/sql-serie4.mp3",
  "./assets/audio/sql-serie5.mp3",
  "./assets/audio/sql-serie6.mp3",
  "./assets/audio/explore-tunisie-flex.mp3",
  "./assets/audio/explore-tunisie-float.mp3",
  "./assets/audio/html5-cours.mp3",
  "./assets/audio/css3-cours.mp3",
  "./assets/audio/javascript-cours.mp3",
  "./assets/audio/php-cours.mp3",
  "./assets/videos/php-guichet-v10.mp4",
  "./assets/videos/css-positionnement.mp4",
  "./assets/videos/css-animee.mp4",
  "./assets/videos/sql-cours-v7.mp4",
  "./assets/videos/sql-serie1.mp4",
  "./assets/videos/sql-serie2.mp4",
  "./assets/videos/sql-serie3.mp4",
  "./assets/videos/sql-serie4.mp4",
  "./assets/videos/sql-serie5.mp4",
  "./assets/videos/sql-serie6.mp4",
  "./assets/videos/explore-tunisie-flex.mp4",
  "./assets/videos/explore-tunisie-float.mp4",
  "./assets/videos/html5-cours.mp4",
  "./assets/videos/css3-cours-v9-sync.mp4",
  "./assets/videos/css3-cours-v9-sync-mobile-720p.mp4",
  "./assets/subtitles/css3-cours-v9-sync-fr.vtt",
  "./assets/videos/javascript-cours.mp4",
  "./assets/videos/php-cours.mp4",
  "./exercices/sql/sql-construire-requete-guide-texte.mp4",
  "./assets/images/sql-construire-requete-guide-texte-poster.jpg",
  "./assets/subtitles/sql-construire-requete-guide-texte-fr.srt",
  "./documents/sql/Documentation-Construire-Requete-SQL-Guide-Texte.docx",
  "./documents/sql/Documentation-Construire-Requete-SQL-Guide-Texte.pdf",
  "./documents/sql/transcription-construire-requete-sql-guide-texte.md",
  "./robots.txt",
  "./sitemap.xml"
];

var precacheEnCours = false;

async function prechargerSequentiel(forcerMajCode) {
  if (precacheEnCours && !forcerMajCode) return;
  precacheEnCours = true;
  try {
    var cache = await caches.open(CACHE);
    var total = OFFLINE_LIST.length;
    var done = 0;
    var batchSize = 6;
    for (var i = 0; i < total; i += batchSize) {
      var lot = OFFLINE_LIST.slice(i, i + batchSize);
      await Promise.allSettled(lot.map(async function (u) {
        try {
          var estCode = /\.(html|js|css|webmanifest)$/i.test(u) || u === "./";
          var ex = (!forcerMajCode || !estCode) ? await cache.match(u, { ignoreSearch: true }) : null;
          if (!ex) {
            var rep = await fetch(u, (forcerMajCode && estCode) ? { cache: "reload" } : undefined);
            if (rep && rep.ok) await cache.put(u, rep);
          }
        } catch (e) {}
        done++;
      }));
      if (done % 12 === 0 || done >= total) {
        var clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
        for (var c of clients) {
          c.postMessage({ type: "STI_OFFLINE_PROGRESS", done: Math.min(done, total), total: total, cache: CACHE });
        }
      }
    }
    var cdns = [
      "https://cdn.tailwindcss.com",
      "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js",
      "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
    ];
    for (var cu of cdns) {
      try {
        var exCdn = await cache.match(cu);
        if (!exCdn) {
          var repCdn = await fetch(new Request(cu, { mode: "no-cors" }));
          if (repCdn && (repCdn.ok || repCdn.type === "opaque")) {
            await cache.put(cu, repCdn);
          }
        }
      } catch (e) {}
    }
  } catch (e) {}
  precacheEnCours = false;
}

async function actualiserFichiersConcernes() {
  var cache = await caches.open(CACHE);
  var revisions = await caches.open(CACHE_REVISIONS);
  await Promise.allSettled(UPDATE_FILES.map(async function (item) {
    var u = typeof item === "string" ? item : item.url;
    var revision = typeof item === "string" ? UPDATE_ID : item.revision;
    var marker = new Request(new URL("./__sti_revision__/" + encodeURIComponent(u) + "?rev=" + encodeURIComponent(revision), self.location.href));
    try {
      if (await revisions.match(marker)) return;
      /* Amorçage sans réseau pour le petit fichier déjà installé par le delta précédent. */
      if (item.bootstrapBySize && item.bytes) {
        var existant = await cache.match(u, { ignoreSearch: true });
        var taille = existant ? parseInt(existant.headers.get("content-length") || "0", 10) : 0;
        if (taille === item.bytes) {
          await revisions.put(marker, new Response(UPDATE_ID));
          return;
        }
      }
      var rep = await fetch(u, { cache: "reload" });
      if (rep && rep.ok) {
        await cache.put(u, rep.clone());
        await revisions.put(marker, new Response(UPDATE_ID));
      }
    } catch (e) {}
  }));
}

self.addEventListener("install", function (evt) {
  self.skipWaiting();
  /* Mise à jour différentielle : aucun parcours de SHELL ou OFFLINE_LIST ici. */
  evt.waitUntil(actualiserFichiersConcernes());
});

self.addEventListener("activate", function (evt) {
  evt.waitUntil(
    (async function () {
      try {
        var nvCache = await caches.open(CACHE);
        var cVid = await caches.open(CACHE_VIDEOS_LABO);
        var cles = await caches.keys();
        for (var k of cles) {
          if (k === CACHE || k === CACHE_VIDEOS_LABO || k.indexOf("sti-atelier-") !== 0) continue;
          try {
            var ancCache = await caches.open(k);
            var reqs = await ancCache.keys();
            for (var r of reqs) {
              var rPath = "";
              try { rPath = new URL(r.url).pathname; } catch (e) {}
              var cible = (rPath.indexOf("/assets/videos/") !== -1 && /\.mp4$/i.test(rPath)) ? cVid : nvCache;
              var deja = await cible.match(r, { ignoreSearch: true });
              if (!deja) {
                var rep = await ancCache.match(r);
                if (rep) await cible.put(r, rep);
              }
            }
          } catch (eMigration) {}
          /* Suppression seulement après copie locale : zéro re-téléchargement. */
          await caches.delete(k);
        }
        /* La v309 remplace réellement la vidéo CSS3 : supprimer les anciennes copies lourdes sans les re-télécharger. */
        var anciensCss3 = ["/assets/videos/css3-cours-v8.mp4", "/assets/videos/css3-cours-v8-mobile-720p.mp4", "/assets/subtitles/css3-cours-v8-fr.vtt", "/assets/images/css3-cours-v8-poster.jpg"];
        for (var cacheCss3 of [nvCache, cVid]) {
          var reqCss3 = await cacheCss3.keys();
          for (var ancienneReq of reqCss3) {
            var ancienPath = "";
            try { ancienPath = new URL(ancienneReq.url).pathname; } catch (eAncien) {}
            if (anciensCss3.some(function (suffixe) { return ancienPath.slice(-suffixe.length) === suffixe; })) {
              await cacheCss3.delete(ancienneReq, { ignoreSearch: true });
            }
          }
        }
      } catch (e) {}
      await self.clients.claim();
      /* Aucun préchargement global automatique après activation. */
    })()
  );
});

self.addEventListener("message", function (evt) {
  if (!evt.data) return;
  if (evt.data.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }
  if (evt.data.type === "STI_STORAGE_STATUS") {
    evt.waitUntil(notifierStockageSTI());
    return;
  }
  if (evt.data.type === "STI_EVICT_RUNTIME") {
    evt.waitUntil(evincerRuntimeLRUSTI(true));
    return;
  }
  if (evt.data.type === "PRECACHE_ALL_USER") {
    /* Téléchargement complet uniquement après le clic volontaire « Hors-ligne ». */
    evt.waitUntil(prechargerSequentiel(true));
    return;
  }
  if (evt.data.type === "PRECACHE_ALL" || evt.data.type === "SYNC_UPDATE" || evt.data.type === "FORCE_REFRESH_VERSION") {
    /* Les anciens appels automatiques sont volontairement limités au delta de publication. */
    self.skipWaiting();
    evt.waitUntil(actualiserFichiersConcernes());
  }
});

async function chercherDansCache(req, url) {
  var mExact = await caches.match(req);
  if (mExact) { signalerCacheEviteSTI(mExact); rafraichirLRUExistantSTI(req, mExact, CACHE, "runtime"); return mExact; }
  var m = await caches.match(req, { ignoreSearch: true });
  if (m) { signalerCacheEviteSTI(m); rafraichirLRUExistantSTI(req, m, CACHE, "runtime"); return m; }
  if (url.origin === self.location.origin) {
    try {
      var decodedUrl = url.origin + decodeURIComponent(url.pathname);
      var mDec = await caches.match(decodedUrl, { ignoreSearch: true });
      if (mDec) return mDec;
      var encodedUrl = url.origin + encodeURI(decodeURIComponent(url.pathname));
      var mEnc = await caches.match(encodedUrl, { ignoreSearch: true });
      if (mEnc) return mEnc;
    } catch (e) {}
    if (url.pathname.slice(-1) === "/") {
      var mSubIdx = await caches.match(url.origin + url.pathname + "index.html", { ignoreSearch: true });
      if (mSubIdx) return mSubIdx;
    }
    var scopePath = new URL("./", self.location.href).pathname;
    if (url.pathname === scopePath || url.pathname === scopePath + "index.html") {
      var mIdx = await caches.match("./index.html", { ignoreSearch: true });
      if (mIdx) return mIdx;
      var mRoot = await caches.match("./", { ignoreSearch: true });
      if (mRoot) return mRoot;
    }
  }
  return null;
}

self.addEventListener("fetch", function (evt) {
  var req = evt.request;
  if (req.method !== "GET") return;

  var url = new URL(req.url);

  /* Ne jamais mettre sw.js lui-même en cache dans CACHE pour garantir la détection immédiate de chaque nouvelle version */
  if (url.origin === self.location.origin && /\/sw\.js$/i.test(url.pathname)) {
    evt.respondWith(
      fetch(req, { cache: "no-store" }).catch(function () {
        return caches.match(req, { ignoreSearch: true });
      })
    );
    return;
  }

  /* Ressources CDN versionnées : cache d'abord, sans revalidation gourmande à chaque page. */
  if (url.origin !== self.location.origin) {
    if (/cdn\.tailwindcss\.com|cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com/i.test(url.hostname)) {
      evt.respondWith(
        caches.match(req).then(function (m) {
          if (m) return m;
          return fetch(req).then(function (rep) {
            if (rep && (rep.ok || rep.type === "opaque")) {
              var cop = rep.clone();
              evt.waitUntil(caches.open(CACHE).then(function (c) { return mettreCacheRuntimeSTI(c, req, cop, "cdn"); }));
            }
            return rep;
          }).catch(function () { return Response.error(); });
        })
      );
    }
    return;
  }

  /* 1. Pages (navigation, documents HTML, iframes) & Scripts / Styles :
        - Si déjà en cache pour la version courante (CACHE) -> 0 ms depuis le cache (navigation ultra-légère : la plateforme ne se met à jour que s'il y a une nouvelle version de CACHE)
        - Si pas encore en cache -> réseau + mise en cache */
  var estHoteLocalDossier = /^(localhost|127\.0\.0\.1|::1|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(url.hostname || "");
  if (req.mode === "navigate" || /\.(html|css|js|webmanifest)$/i.test(url.pathname) || url.pathname.slice(-1) === "/") {
    evt.respondWith(
      (async function () {
        /* Sur un dossier local servi en localhost/LAN (PC Labo 3 sans Internet), lire directement les fichiers remplacés du dossier */
        if (estHoteLocalDossier) {
          try {
            var repLoc = await fetch(req, { cache: "no-store" });
            if (repLoc && repLoc.ok) {
              var copLoc = repLoc.clone();
              caches.open(CACHE).then(function (c) { c.put(req, copLoc); });
              return repLoc;
            }
          } catch (e) {}
        }
        var enCache = await chercherDansCache(req, url);
        if (enCache) {
          return enCache;
        }
        try {
          var rep = await fetch(req);
          if (rep && rep.ok) {
            var copie = rep.clone();
            var copieNue = rep.clone();
            caches.open(CACHE).then(function (c) {
              c.put(req, copie);
              if (url.search) {
                var urlNue = new URL(req.url);
                urlNue.search = "";
                c.put(urlNue.toString(), copieNue);
              }
              var scopePath = new URL("./", self.location.href).pathname;
              if (url.pathname === scopePath || url.pathname === scopePath + "index.html") {
                c.put("./index.html", rep.clone());
              } else if (url.pathname.slice(-1) === "/") {
                c.put(url.origin + url.pathname + "index.html", rep.clone());
              }
            });
          }
          return rep;
        } catch (e) {
          return (await chercherDansCache(req, url)) || Response.error();
        }
      })()
    );
    return;
  }

  /* 2. Fichiers vidéo/audio (.mp4, .webm, .mp3, .wav) & Mode « Réseau Labo Fluide » (cache persistant CACHE_VIDEOS_LABO + support HTTP Range) */
  if (/\.(mp4|webm|mp3|wav|ogg|m4a)$/i.test(url.pathname) || req.headers.get("range")) {
    evt.respondWith(
      (async function () {
        var rangeHeader = req.headers.get("range");
        var clePropre = new Request(url.origin + url.pathname);
        var cVid = null;
        var enCache = null;
        try {
          cVid = await caches.open(CACHE_VIDEOS_LABO);
          enCache = await cVid.match(clePropre, { ignoreSearch: true });
        } catch (e) {}
        if (!enCache) {
          enCache = await chercherDansCache(clePropre, url);
        }

        if (enCache) {
          signalerCacheEviteSTI(enCache);
          rafraichirLRUExistantSTI(clePropre, enCache, CACHE_VIDEOS_LABO, "media");
          if (rangeHeader) {
            try {
              var buf = await enCache.clone().arrayBuffer();
              var total = buf.byteLength;
              var mRange = /bytes=(\d+)-(\d*)/i.exec(rangeHeader);
              var start = mRange ? parseInt(mRange[1], 10) : 0;
              var end = mRange && mRange[2] ? parseInt(mRange[2], 10) : total - 1;
              if (isNaN(start) || start < 0) start = 0;
              if (isNaN(end) || end >= total) end = total - 1;
              if (start > end) start = 0;
              var chunk = buf.slice(start, end + 1);
              var cType = enCache.headers.get("Content-Type") || (/\.mp4$/i.test(url.pathname) ? "video/mp4" : "application/octet-stream");
              return new Response(chunk, {
                status: 206,
                statusText: "Partial Content",
                headers: {
                  "Content-Type": cType,
                  "Accept-Ranges": "bytes",
                  "Content-Range": "bytes " + start + "-" + end + "/" + total,
                  "Content-Length": String(chunk.byteLength)
                }
              });
            } catch (e) {}
          }
          return enCache;
        }

        /* Une requête Range reste une requête Range : aucun téléchargement MP4 complet parallèle.
           Seule une vraie réponse réseau 200 (ou le bouton Hors-ligne explicite) remplit le cache vidéo. */
        try {
          var rep = await fetch(req);
          if (rep && rep.status === 200) {
            var copie = rep.clone();
            evt.waitUntil((cVid ? Promise.resolve(cVid) : caches.open(CACHE_VIDEOS_LABO)).then(function (c) {
              return mettreCacheRuntimeSTI(c, clePropre, copie, "media");
            }).catch(function () {}));
          }
          return rep;
        } catch (err) {
          return enCache || Response.error();
        }
      })()
    );
    return;
  }

  /* 3. Images, PDF, archives, polices et documents : cache d'abord.
        Un fichier déjà présent n'est plus retéléchargé silencieusement à chaque consultation. */
  evt.respondWith(
    chercherDansCache(req, url).then(function (m) {
      if (m) return m;
      return fetch(req)
        .then(function (rep) {
          if (rep && rep.status === 200) {
            var copie = rep.clone();
            evt.waitUntil(caches.open(CACHE).then(function (c) { return mettreCacheRuntimeSTI(c, req, copie, "asset"); }));
          }
          return rep;
        })
        .catch(function () { return Response.error(); });
    })
  );
});
