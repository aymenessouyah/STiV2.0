/* Projection du profil unique vers les journaux historiques de suivi admin.
   Le profil reste la source de vérité ; les autres marqueurs sont conservés. */
(function (global) {
  'use strict';
  var api = global.STIProfil;
  if (!api || !api.projectionSuivi) return;
  var prefixe = 'profil-v2:', derniereSignature = '';
  var matieres = ['html5', 'css3', 'javascript', 'sql', 'php'];

  function synchroniser(forcer) {
    var etat = api.lireEtatSession();
    // Sur un appareil partagé, attendre que l'ancien compte soit isolé.
    if (etat.compteEnAttente) return;
    var profil = api.chargerProfil(), exercices = profil.exercicesFaits;
    var signature = (etat.id || etat.email || '') + ':' + JSON.stringify([exercices, profil.coursVisites]);
    if (!forcer && signature === derniereSignature) return;
    var ancien = api.projectionSuivi('sti-exos-faits');
    if (!ancien || typeof ancien !== 'object') ancien = {};
    var liste = Array.isArray(ancien), copie = liste ? [] : {};
    if (liste) {
      ancien.forEach(function (id) { if (String(id).indexOf(prefixe) !== 0) copie.push(id); });
    } else {
      Object.keys(ancien).forEach(function (id) { if (id.indexOf(prefixe) !== 0) copie[id] = ancien[id]; });
    }
    matieres.forEach(function (matiere) {
      (exercices[matiere] || []).forEach(function (id) {
        var cle = prefixe + matiere + ':' + String(id);
        if (liste) copie.push(cle); else copie[cle] = true;
      });
    });
    if (JSON.stringify(copie) !== JSON.stringify(ancien)) api.projectionSuivi('sti-exos-faits', copie);

    // Utiliser les mêmes chemins que le journal de couverture : pas de doublon.
    var pages = api.projectionSuivi('sti-pages-vues-v432'), change = false;
    if (!pages || typeof pages !== 'object' || Array.isArray(pages)) pages = {};
    profil.coursVisites.forEach(function (matiere) {
      var chemin = 'cours/' + matiere + '.html';
      if (!pages[chemin]) { pages[chemin] = 1; change = true; }
    });
    if (change) api.projectionSuivi('sti-pages-vues-v432', pages);
    derniereSignature = signature;
  }
  global.addEventListener('sti:profil-maj', function () { synchroniser(false); });
  global.addEventListener('sti:session-maj', function () { synchroniser(false); });
  global.addEventListener('sti-cloud-restored', function () { synchroniser(true); });
  global.addEventListener('DOMContentLoaded', function () { synchroniser(true); });
  if (document.readyState !== 'loading') synchroniser(true);
})(window);
