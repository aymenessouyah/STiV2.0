/* STI v432 (consigne auteur : « la partie qui tourne autour de la roue montre le niveau de
   couverture du site ») — l'ANNEAU orange qui entoure le ⚙️ ne mesure plus la seule
   progression des leçons : il montre la COUVERTURE DU SITE, c'est-à-dire le nombre de pages
   de contenu réellement consultées par le compte, sur la totalité du site (126 pages : cours,
   exercices, quiz, projets, documents, annexes d'entraînement — hors navigation portail/index
   et hors 404).
   - Journal des pages vues : localStorage « sti-pages-vues-v432 » ({slug:1,…}), alimenté à
     chaque visite d'une page de la liste. Comme toute clé « sti- », il est COLLECTÉ par
     sync-progressions.js → la couverture voyage avec l'élève entre ses appareils, sans rien
     ajouter au nuage.
   - Le pourcentage = pages vues ∩ liste / 126 (les entrées d'une ancienne version du site ne
     comptent pas ; plafond 100 %).
   - Peinture : le module ré-écrit le fond conique et l'infobulle de #sti-roue-anneau (via
     property important + observateur du style), donc l'anneau reste à JOUR même quand acces.js
     repeint « Progression » à chaque ouverture du panneau — les deux mesures coexistent :
     le PANNEAU garde sa ligne « 📈 Progression » intacte, seul l'anneau change de sens.
   PAGES est la liste des pages de contenu au jour du build ; quand le site gagne une fiche,
   on la complète ici (une ligne) — un fichier hors liste n'est simplement pas compté. */
(function () {
  "use strict";
  if (window.__STI_ROUE_COUVERTURE) return;
  window.__STI_ROUE_COUVERTURE = true;
  var doc = document;
  if (!/^https?:$/.test(location.protocol)) return;

  var PAGES = [
    "bac-pratique.html", "carte-visite.html", "cours/annexe-fleuriste-html5.html", "cours/courscss3.html",
    "cours/courshtml5.html", "cours/coursphp.html", "cours/css3.html", "cours/datalist.html",
    "cours/fiche-revision-html5.html", "cours/html5.html", "cours/javascript.html", "cours/php-mysqli.html",
    "cours/php-recap.html", "cours/php.html", "cours/recap-javascript-sti.html",
    "cours/sql-bases-ldd-lmd-lcd.html", "cours/sql-contraintes.html", "cours/sql-playground.html", "cours/sql.html",
    "cssanimee/index.html", "documents/annexes/annexe-css3.pdf.html", "documents/annexes/annexe-html5.pdf.html", "documents/annexes/annexe-javascript.pdf.html",
    "documents/annexes/annexe-php.pdf.html", "documents/annexes/annexe-sql.pdf.html", "documents/complet/complet-3eme-si-bd.pdf.html", "documents/complet/complet-3eme-si.pdf.html",
    "documents/complet/complet-4eme-si-cours.pdf.html", "documents/complet/complet-4eme-si-resume.pdf.html", "documents/complet/fiche-memento-synthese.html", "documents/enonces/enonce-serie4-a4.html",
    "documents/enonces/enonce-serie5-a4.html", "exercices/html-css/activite-html-css/act1/page1.html", "exercices/html-css/activite-html-css/act2/page2.html", "exercices/html-css/activite1-2-position-animation-css3.pdf.html",
    "exercices/html-css/box-shadow-text-shadow-css3.html", "exercices/html-css/emploi-temps/emploidutemps.html", "exercices/html-css/explore_tunisie/explore_tunisie_enonce.pdf.html", "exercices/html-css/explore_tunisie/explore_tunisie_solution/exploretunisie/index-float.html",
    "exercices/html-css/explore_tunisie/explore_tunisie_solution/exploretunisie/index-position.html", "exercices/html-css/explore_tunisie/explore_tunisie_solution/exploretunisie/index.html", "exercices/html-css/formulaire-inscription.pdf.html", "exercices/html-css/tp1-css.pdf.html",
    "exercices/html-css/tp2-css.pdf.html", "exercices/html-css/tp2/tp2corrposition.html", "exercices/html-css/tp3-css.pdf.html", "exercices/javascript/js-37-defis-tt.html",
    "exercices/javascript/tp1-correction-js.html", "exercices/javascript/tp1-js.html", "exercices/javascript/tp2-correction-js.html", "exercices/javascript/tp2-js.html",
    "exercices/javascript/tp3-correction-js.html", "exercices/javascript/tp3-js.html", "exercices/javascript/tp4-correction-js.html", "exercices/javascript/tp4-js.html",
    "exercices/javascript/tp5-correction-js.html", "exercices/javascript/tp5-js.html", "exercices/php/4sti-dc-6-2025-2026.pdf.html", "exercices/php/debogage-php-bac.html",
    "exercices/php/ordre-php-bac.html", "exercices/php/sondage-parcours-pas-a-pas.html", "exercices/php/statphpanimee.html", "exercices/php/tp1-correction-php.html",
    "exercices/php/tp1-php.html", "exercices/php/tp2-correction-php.html", "exercices/php/tp2-php.html", "exercices/php/tp3-correction-php.html",
    "exercices/php/tp3-php.html", "exercices/php/tp4-correction-php.html", "exercices/php/tp4-php.html", "exercices/php/tp5-correction-php.html",
    "exercices/php/tp5-php.html", "exercices/php/trace-fetch-php.html", "exercices/resume-fonctions-standards.html", "exercices/series-exercices.html",
    "exercices/sql/atelier_sql_3_fenetres.html", "exercices/sql/commentconstruireunerequêtesql.html", "exercices/sql/sql-correction.html", "exercices/sql/sql.html",
    "exercices/sql/tp-bd-jointure-sous-requetes-group-by.html", "exercices/sql/tp-date-ssr-j-gp-bd.html", "exercices/sql/tp-date-ssr-j-gp-correction-bd.html", "exercices/sql/tp-groupby-bd.html",
    "exercices/sql/tp1-bd.html", "exercices/sql/tp1-correction-bd.html", "exercices/sql/tp2-bd.html", "exercices/sql/tp2-correction-bd.html",
    "exercices/sql/tp3-correction-bd.html", "exercices/sql/tp4-correction-bd.html", "glossaire.html", "livre-smart.html",
    "ma-fiche-revision.html", "memo-veille-bac.html", "nouveautes.html", "outils-js-bac.html", "pieges-bac.html",
    "portail.html", "positionnement-animee/index.html", "projets/carte-bancaire/cb.html", "projets/carte-bancaire/enonce-tp-carte-bancaire.html", "projets/fleurs/corrections.html",
    "projets/fleurs/index.html", "projets/fleurs/inscription.html", "projets/fleurs/media/projet-fleurs-4sti-eleve.pdf.html", "projets/formulaire-inscription/cvfleurs.html",
    "projets/formulaire-inscription/enonce/cvfleurs-énoncé/formulaire inscription.pdf.html", "projets/site-tunisie/correction-details/carte-timbre-droite-haut.html", "projets/site-tunisie/enonce.html", "projets/site-tunisie/index.html",
    "projets/site-tunisie/pages/accueil.html", "projets/site-tunisie/pages/centre.html", "projets/site-tunisie/pages/nord.html", "projets/site-tunisie/pages/sud.html",
    "projets/site-tunisie/site-tunisie-correction-animation-html-css.html", "projets/sti0/index.html", "projets/sti0/projetsti0.pdf.html", "projets/sti0/sondage.html",
    "projets/sti0/statistiques.html", "quiz/html-css.html",
    "quiz/javascript.html", "quiz/php.html", "quiz/sql.html",
    "quiz/tableaux.html", "revision-erreurs.html"
  ];
  /* v434 (gain d'audit A5) : la liste embarquée est d'abord PURGÉE des doublons et
     normalisée en minuscules (le journal est en minuscules : « PHP-recap » y était mort),
     puis le MANIFESTE GÉNÉRÉ AU BUILD (tools/pages-couverture.py →
     assets/pages-couverture.json) la REMPLACE si disponible. Liste embarquée = filet
     hors-ligne ; plus aucun total codé à la main. Drapeau lisible : __STI_COUV_SOURCE. */
  var MAP = {};
  var L = [];
  for (var i0 = 0; i0 < PAGES.length; i0++) {
    var k0 = String(PAGES[i0]).toLowerCase();
    if (!MAP[k0]) { MAP[k0] = 1; L.push(k0); }
  }
  PAGES = L;
  var TOTAL = PAGES.length;
  window.__STI_COUV_SOURCE = "liste embarquée (repli)";
  var CLE = "sti-pages-vues-v432";

  function slugActuel() {
    var p = location.pathname || "";
    try { p = decodeURIComponent(p); } catch (e) {}
    p = p.replace(/^\/+/, "").toLowerCase();
    if (p.indexOf("stiv2.0/") === 0) p = p.slice(8); /* sous-dossier GitHub Pages */
    if (/\/$/.test(p)) p += "index.html";
    return p;
  }
  function lire() { try { return JSON.parse(localStorage.getItem(CLE) || "{}") || {}; } catch (e) { return {}; } }
  var marque = false;
  function marquer() {
    if (marque) return;
    marque = true;
    var s = slugActuel();
    if (!MAP[s]) return;
    var l = lire();
    if (l[s]) return;
    l[s] = 1;
    try { localStorage.setItem(CLE, JSON.stringify(l)); } catch (e) {}
  }
  function couv() {
    var l = lire(), n = 0;
    for (var i = 0; i < TOTAL; i++) if (l[PAGES[i]]) n++;
    return { n: n, pct: Math.min(100, Math.round((n * 100) / TOTAL)) };
  }
  var elMemo = null, bgMemo = "";
  function majAnneau() {
    var a = doc.getElementById("sti-roue-anneau");
    if (!a) { elMemo = null; return; }
    var c = couv();
    var bg = "conic-gradient(#f4511e 0% " + c.pct + "%, rgba(35,32,26,.15) " + c.pct + "% 100%)";
    if (a !== elMemo || a.style.getPropertyValue("background") !== bgMemo) {
      a.style.setProperty("background", bg, "important");
      var tt = "\ud83d\uddfa Couverture du site : " + c.pct + " % \u00b7 " + c.n + " page" + (c.n > 1 ? "s" : "") + " vue" + (c.n > 1 ? "s" : "") + " sur " + TOTAL + " · " + (window.__STI_COUV_SOURCE || "liste embarquée");
      a.setAttribute("title", tt);
      try { bgMemo = a.style.getPropertyValue("background"); elMemo = a; } catch (e) { bgMemo = bg; elMemo = a; }
      if (bgMemo.indexOf("conic-gradient") !== 0) a.style.setProperty("background", bg, "important");
      if (!a._stiCouvObs) {
        /* un seul observateur par nœud : il rend la main au module dès qu'acces.js repeint
           « Progression » dans le style de l'anneau (ouverture du panneau, rafraîchissement). */
        try { new MutationObserver(function () { majAnneau(); }).observe(a, { attributes: true, attributeFilter: ["style"] }); a._stiCouvObs = true; } catch (e2) {}
      }
    }
  }
  /* L'anneau naît après validation de session : veille légère jusqu'à son apparition,
     puis re-peinture immédiate à chaque fois qu'on y touche (acces.js repeint « Progression »
     à chaque ouverture du panneau — notre valeur reprend la main à la milliseconde). */
  /* v434 : chargement du manifeste du build (chemin racine calculé comme dans config.js). */
  if (window.fetch) {
    try {
      var pn = location.pathname || "";
      var mm = pn.match(/^(.*?)\/(?:cours|exercices|projets|documents|annexes|quiz|cssanimee|Positionnement-animee|tests)\//);
      var BASE = mm ? location.origin + mm[1] + "/" : location.origin + pn.slice(0, pn.lastIndexOf("/") + 1);
      window.__STI_COUV_MANIFEST = false;
      fetch(BASE + "assets/pages-couverture.json", { cache: "no-cache" }).then(function (r) {
        return r.ok ? r.json() : null;
      }).then(function (j) {
        if (!j || !j.pages || j.pages.length < 50) return;
        var set = {}, out = [];
        for (var i = 0; i < j.pages.length; i++) {
          var s2 = String(j.pages[i]).toLowerCase();
          if (!set[s2]) { set[s2] = 1; out.push(s2); }
        }
        PAGES = out; MAP = set; TOTAL = out.length;
        window.__STI_COUV_MANIFEST = true;
        window.__STI_COUV_SOURCE = "manifeste du build";
        marquer(); majAnneau();
      }).catch(function () {});
    } catch (eM) {}
  }
  majAnneau(); marquer();
  setInterval(function () { marquer(); majAnneau(); }, 800);
  try { window.addEventListener("storage", majAnneau); } catch (e3) {}
})();
