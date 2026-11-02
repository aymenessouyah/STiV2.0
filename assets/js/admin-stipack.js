/* ============================================================================
 * admin-stipack.js — bouton « 🧱 Nouveau stipack » du tableau de bord admin
 * ----------------------------------------------------------------------------
 * L’administrateur fabrique ici, dans son navigateur, le paquet d’installation
 * STI-Labo3-Plateforme.stipack à partir des fichiers du site, puis le
 * télécharge pour le conserver et le rejouer en cas de besoin (réinstallation
 * hors ligne, poste du Labo 3, remise en service).
 *
 *   sources  : offline-complete-manifest.json (liste du paquet hors ligne)
 *   moteur   : assets/js/stipack.js (ZIP + SHA-256, aucune dépendance)
 *   sortie   : STI-Labo3-Plateforme-AAAA-MM-JJ.stipack
 *
 * Rien n’est envoyé sur le réseau en écriture : la fabrication est locale.
 * ========================================================================== */
(function () {
  'use strict';

  var CLE_DERNIER = 'sti-stipack-dernier';
  var CONCURRENCE = 4;          /* fichiers récupérés en parallèle */
  var SEUIL_DEFAUT_MO = 2;

  var el = {};
  var etat = { enCours: false, annulation: null, dernierBlob: null, dernierNom: null, dernierUrl: null };

  function $(id) { return document.getElementById(id); }

  function tailleLisible(octets) {
    if (window.STIStipack) return window.STIStipack.tailleLisible(octets);
    var unites = ['o', 'Ko', 'Mo', 'Go'];
    var i = 0;
    var v = octets || 0;
    while (v >= 1024 && i < unites.length - 1) { v /= 1024; i++; }
    return (v >= 100 || i === 0 ? Math.round(v) : v.toFixed(1).replace('.', ',')) + ' ' + unites[i];
  }

  function dateCourte(iso) {
    try {
      return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
    } catch (erreur) {
      return iso;
    }
  }

  function horodatage(len) {
    var d = new Date();
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return String(d.getFullYear()) + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes());
  }

  /* ------------------------------------------------------------- journal */

  function journal(texte, type) {
    if (!el.journal || !el.journalWrap) return;
    el.journalWrap.hidden = false;
    var li = document.createElement('li');
    li.textContent = texte;
    if (type === 'erreur') li.className = 'stipack-erreur';
    if (type === 'ok') li.className = 'stipack-ok';
    el.journal.appendChild(li);
    while (el.journal.children.length > 200) el.journal.removeChild(el.journal.firstChild);
  }

  function viderJournal() {
    if (el.journal) el.journal.textContent = '';
    if (el.journalWrap) el.journalWrap.hidden = true;
  }

  /* ------------------------------------------------------------- affichage */

  function afficherProgression(ratio, texte, detail) {
    if (el.progression) el.progression.hidden = false;
    if (el.barre) el.barre.style.width = Math.max(1, Math.min(100, Math.round(ratio * 100))) + '%';
    if (el.etat) el.etat.textContent = texte;
    if (el.detail) el.detail.textContent = detail || '';
  }

  function terminerProgression() {
    if (el.barre) el.barre.style.width = '100%';
  }

  function memoriserDernier(infos) {
    try { localStorage.setItem(CLE_DERNIER, JSON.stringify(infos)); } catch (erreur) { /* stockage plein ou refusé */ }
  }

  function afficherDernier() {
    if (!el.dernier) return;
    var brut = null;
    try { brut = localStorage.getItem(CLE_DERNIER); } catch (erreur) { brut = null; }
    if (!brut) return;
    var infos;
    try { infos = JSON.parse(brut); } catch (erreur) { return; }
    el.dernier.hidden = false;
    el.dernier.textContent =
      'Dernier paquet fabriqué : ' + (infos.nom || 'stipack') + ' · ' + infos.fichiers + ' fichiers · ' +
      tailleLisible(infos.octets) + ' · ' + dateCourte(infos.quand) + ' (poste ' + (infos.poste || 'ce navigateur') + ').';
  }

  /* ------------------------------------------------------------- lecture */

  async function lireManifesteHorsLigne() {
    var reponse = await fetch(window.STIStipack.MANIFESTE_HORS_LIGNE + '?stipack=' + Date.now(), { cache: 'no-cache' });
    if (!reponse.ok) throw new Error('liste des fichiers illisible (HTTP ' + reponse.status + ')');
    var manifeste = await reponse.json();
    var fichiers = (manifeste.files || [])
      .map(function (f) { return { chemin: f.path, octets: f.bytes || 0 }; })
      .filter(function (f) { return f.chemin; });
    return { version: manifeste.version || null, fichiers: fichiers, genereLe: manifeste.generatedAt || null };
  }

  /** Récupère les fichiers dans l’ordre, avec quelques lectures en avance. */
  function sourceFichiers(fichiers, signal) {
    var avance = new Map();

    function charger(index) {
      if (index >= fichiers.length) return;
      var chemin = fichiers[index].chemin;
      if (avance.has(chemin)) return;
      var promesse = fetch(chemin, { signal: signal, cache: 'default' }).then(function (reponse) {
        if (!reponse.ok) throw new Error('HTTP ' + reponse.status);
        return reponse.arrayBuffer();
      });
      promesse.catch(function () { /* l’erreur est traitée au tour de son fichier */ });
      avance.set(chemin, promesse);
    }

    for (var i = 0; i < Math.min(CONCURRENCE, fichiers.length); i++) charger(i);

    return async function recuperer(chemin) {
      var index = fichiers.findIndex(function (f) { return f.chemin === chemin; });
      for (var k = index; k < Math.min(index + CONCURRENCE, fichiers.length); k++) charger(k);
      var promesse = avance.get(chemin);
      try {
        return await promesse;
      } catch (erreur) {
        throw new Error(chemin + ' : ' + (erreur && erreur.message ? erreur.message : 'illisible'));
      } finally {
        avance.delete(chemin);
      }
    };
  }

  /* ------------------------------------------------------------- fabrication */

  async function fabriquer() {
    if (etat.enCours) return;
    if (!window.STIStipack) {
      journal('Moteur de fabrication absent (assets/js/stipack.js non chargé).', 'erreur');
      return;
    }

    etat.enCours = true;
    viderJournal();
    if (el.creer) { el.creer.disabled = true; el.creer.textContent = '⏳ Fabrication…'; }
    if (el.annuler) el.annuler.hidden = false;
    if (el.telecharger) el.telecharger.hidden = true;
    etat.dernierBlob = null;

    var controleur = typeof AbortController === 'function' ? new AbortController() : null;
    etat.annulation = controleur;
    var ecritureEnCours = null;

    try {
      /* Le sélecteur de fichier doit s’ouvrir pendant le clic : l’autorisation
         du navigateur (activation utilisateur) expire après quelques secondes,
         donc avant toute lecture réseau. Un refus ou une annulation bascule sur
         l’assemblage en mémoire. */
      var nom = 'STI-Labo3-Plateforme-' + horodatage() + '.stipack';
      var ecriture = null;
      var memoire = null;
      try {
        ecriture = await window.STIStipack.ecrivainFichier(nom);
      } catch (erreurSelection) {
        ecriture = null;
      }

      afficherProgression(0, 'Lecture de la liste des fichiers…');
      var horsLigne = await lireManifesteHorsLigne();
      var volume = el.volume && el.volume.value === 'leger' ? 'leger' : 'complet';
      var seuilMo = el.seuil ? Number(el.seuil.value) || SEUIL_DEFAUT_MO : SEUIL_DEFAUT_MO;
      var seuil = volume === 'leger' ? Math.round(seuilMo * 1024 * 1024) : 0;
      var liste = horsLigne.fichiers;
      var totalOctets = liste.reduce(function (somme, f) { return somme + (f.octets || 0); }, 0);
      var updateId = await window.STIStipack.lireUpdateId(async function (chemin) {
        var reponse = await fetch(chemin, { cache: 'no-cache' });
        return reponse.ok ? reponse.text() : '';
      });

      journal('Liste : ' + liste.length + ' fichiers, ' + tailleLisible(totalOctets) + ' (version ' + (updateId || horsLigne.version || 'inconnue') + ').');

      var recuperer = sourceFichiers(liste, controleur ? controleur.signal : undefined);

      ecritureEnCours = ecriture;
      if (!ecriture) {
        memoire = window.STIStipack.ecrivainMemoire();
        ecriture = { ecrire: memoire.ecrire };
        journal('Assemblage en mémoire : le téléchargement démarrera à la fin.');
        if (totalOctets > 600 * 1024 * 1024) {
          journal(
            'Paquet volumineux : ce navigateur garde tout en mémoire. Pour un paquet de cette taille, ' +
            'préférer Chrome ou Edge (écriture directe du fichier), ou choisir « Allégé ».',
            'erreur'
          );
        }
      } else {
        journal('Enregistrement direct dans le fichier choisi par le navigateur.');
      }

      var resultat = await window.STIStipack.construirePaquet({
        liste: liste,
        recuperer: async function (chemin) {
          try {
            return await recuperer(chemin);
          } catch (erreur) {
            /* Le journal nomme le fichier ; construirePaquet interrompt alors la
               fabrication plutôt que de produire un paquet troué. */
            journal('Fichier illisible : ' + (erreur.message || chemin), 'erreur');
            throw erreur;
          }
        },
        ecrire: ecriture.ecrire,
        seuil: seuil,
        volume: volume,
        updateId: updateId,
        nom: nom,
        signal: controleur ? controleur.signal : null,
        onProgres: function (p) {
          var fait = p.fait;
          var ratio = p.total ? fait / p.total : 0;
          afficherProgression(
            ratio,
            'Fabrication : ' + fait + ' / ' + p.total + ' fichiers',
            p.chemin + ' · ' + tailleLisible(p.octets)
          );
        }
      });

      if (ecriture.terminer) await ecriture.terminer();
      terminerProgression();

      var infos = {
        nom: nom,
        fichiers: resultat.fichiers,
        octets: resultat.octets,
        exclus: resultat.exclus.length,
        quand: new Date().toISOString(),
        poste: (window.navigator && window.navigator.platform) || '',
        version: updateId
      };
      memoriserDernier(infos);
      afficherDernier();

      if (memoire) {
        window.STIStipack.liberer(etat.dernierUrl);
        etat.dernierBlob = memoire.bloc();
        etat.dernierNom = nom;
        etat.dernierUrl = window.STIStipack.telecharger(etat.dernierBlob, nom);
        if (el.telecharger) {
          el.telecharger.href = etat.dernierUrl;
          el.telecharger.download = nom;
          el.telecharger.hidden = false;
        }
        afficherProgression(1, '✅ Paquet créé : ' + nom, tailleLisible(etat.dernierBlob.size) + ' · téléchargement lancé');
        journal('Paquet prêt : ' + nom + ' (' + tailleLisible(etat.dernierBlob.size) + ', ' + resultat.fichiers + ' fichiers).', 'ok');
      } else {
        afficherProgression(1, '✅ Paquet enregistré : ' + nom, tailleLisible(resultat.octets) + ' · ' + resultat.fichiers + ' fichiers');
        journal('Paquet enregistré par le navigateur : ' + nom + '.', 'ok');
      }

      if (resultat.exclus.length) {
        journal(resultat.exclus.length + ' fichier(s) écartés par le seuil de ' + seuilMo + ' Mo (paquet allégé).');
      }
    } catch (erreur) {
      if (ecritureEnCours && ecritureEnCours.annuler) {
        try { await ecritureEnCours.annuler(); } catch (erreurAbandon) { /* déjà fermé */ }
      }
      var annule = erreur && (erreur.name === 'AbortError' || /annulée/i.test(erreur.message || ''));
      afficherProgression(0, annule ? 'Fabrication annulée.' : '❌ Fabrication interrompue', erreur.message || '');
      journal(annule ? 'Fabrication annulée par l’administrateur.' : 'Échec : ' + (erreur.message || erreur), 'erreur');
    } finally {
      etat.enCours = false;
      etat.annulation = null;
      if (el.creer) { el.creer.disabled = false; el.creer.textContent = '🧱 Créer le paquet'; }
      if (el.annuler) el.annuler.hidden = true;
    }
  }

  function annuler() {
    if (etat.annulation && etat.annulation.abort) etat.annulation.abort();
    journal('Annulation demandée…');
  }

  /* ------------------------------------------------------------- init */

  function init() {
    el = {
      bloc: $('bloc-stipack'),
      volume: $('stipack-volume'),
      seuil: $('stipack-seuil'),
      seuilWrap: $('stipack-seuil-wrap'),
      creer: $('stipack-btn-creer'),
      annuler: $('stipack-btn-annuler'),
      telecharger: $('stipack-btn-telecharger'),
      progression: $('stipack-progression'),
      barre: $('stipack-barre-remplissage'),
      etat: $('stipack-etat'),
      detail: $('stipack-detail'),
      dernier: $('stipack-dernier'),
      journal: $('stipack-journal'),
      journalWrap: $('stipack-journal-wrap'),
      metaFichiers: $('stipack-meta-fichiers'),
      metaPoids: $('stipack-meta-poids')
    };
    if (!el.bloc) return;

    if (!window.STIStipack) {
      journal('Moteur de fabrication absent : assets/js/stipack.js n’a pas été chargé.', 'erreur');
    }
    if (el.creer) el.creer.addEventListener('click', fabriquer);
    if (el.annuler) el.annuler.addEventListener('click', annuler);
    if (el.volume) {
      el.volume.addEventListener('change', function () {
        if (el.seuilWrap) el.seuilWrap.hidden = el.volume.value !== 'leger';
      });
    }

    afficherDernier();

    /* Renseigne les deux pastilles (nombre de fichiers, poids) sans bloquer la page. */
    lireManifesteHorsLigne().then(function (horsLigne) {
      var octets = horsLigne.fichiers.reduce(function (somme, f) { return somme + (f.octets || 0); }, 0);
      if (el.metaFichiers) el.metaFichiers.textContent = horsLigne.fichiers.length + ' fichiers';
      if (el.metaPoids) el.metaPoids.textContent = tailleLisible(octets);
    }).catch(function (erreur) {
      if (el.metaFichiers) el.metaFichiers.textContent = 'liste hors ligne indisponible';
      journal('Liste hors ligne illisible : ' + (erreur.message || erreur), 'erreur');
    });
  }

  window.STIStipackAdmin = { init: init, fabriquer: fabriquer };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
