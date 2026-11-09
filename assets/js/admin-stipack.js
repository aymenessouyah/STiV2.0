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
  var SEUIL_DEFAUT_MO = 2;

  /* Réglages du téléchargement. Un hébergement gratuit limite le débit : mieux
     vaut avancer à cadence tenue et réessayer que tout arrêter au premier 503. */
  var REGLAGES = {
    concurrence: 3,                                  /* fichiers en parallèle */
    ecartMin: 120,                                   /* ms entre deux départs */
    tentatives: 5,                                   /* reprises par fichier */
    attentes: [400, 1200, 3000, 6000]                /* pause avant chaque reprise */
  };

  /* Tout ce que le dépôt contient ne fait pas partie de l’installation : les tests
     et l’outillage de fabrication ne sont ni utiles sur un poste, ni toujours
     servis par l’hébergement (les .mjs de tests y répondent 503). Les empaqueter
     faisait échouer la fabrication en cours de route. */
  var HORS_INSTALLATION = ['tests/', 'outils/', '.github/', '.vscode/', 'node_modules/'];
  var HORS_INSTALLATION_RACINE = ['.gitignore', '.gitattributes'];

  function estDuSite(chemin) {
    if (!chemin) return false;
    if (HORS_INSTALLATION_RACINE.indexOf(chemin) > -1) return false;
    for (var i = 0; i < HORS_INSTALLATION.length; i++) {
      if (chemin.indexOf(HORS_INSTALLATION[i]) === 0) return false;
    }
    return !/\.patch$/i.test(chemin);
  }

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

  /* Dépôt lu pour connaître la dernière mise à jour. Déduit de l’adresse quand
     le site est publié sur GitHub Pages ; sinon, valeur du fichier de config. */
  function depot() {
    if (window.STIStipack && window.STIStipack.DEPOT) return window.STIStipack.DEPOT;
    var hote = (window.location && window.location.hostname) || '';
    var morceaux = (window.location && window.location.pathname || '/').split('/').filter(Boolean);
    if (/\.github\.io$/i.test(hote) && morceaux.length) {
      return { proprietaire: hote.split('.')[0], nom: morceaux[0], branche: 'main' };
    }
    return { proprietaire: 'aymenessouyah', nom: 'STiV2.0', branche: 'main' };
  }

  /* Liste des fichiers telle qu’elle est AU DERNIER COMMIT du dépôt : c’est elle
     qui garantit que le paquet décrit la dernière mise à jour, et non une liste
     figée qui vieillit entre deux livraisons. */
  async function lireListeDuDepot() {
    var d = depot();
    var url = 'https://api.github.com/repos/' + d.proprietaire + '/' + d.nom +
      '/git/trees/' + encodeURIComponent(d.branche) + '?recursive=1';
    var reponse = await fetch(url, { headers: { Accept: 'application/vnd.github+json' }, cache: 'no-store' });
    if (!reponse.ok) throw new Error('dépôt illisible (HTTP ' + reponse.status + ')');
    var arbre = await reponse.json();
    if (arbre.truncated) throw new Error('arbre du dépôt tronqué par l’API');
    var tout = (arbre.tree || [])
      .filter(function (e) { return e.type === 'blob' && e.path && !/^\.git\//.test(e.path); })
      .map(function (e) { return { chemin: e.path, octets: e.size || 0, empreinte: e.sha || null }; });
    var fichiers = tout
      .filter(function (f) { return estDuSite(f.chemin); })
      .sort(function (a, b) { return a.chemin < b.chemin ? -1 : a.chemin > b.chemin ? 1 : 0; });
    if (!fichiers.length) throw new Error('arbre du dépôt vide');
    return {
      source: 'depot',
      fichiers: fichiers,
      ecartes: tout.length - fichiers.length,
      version: null,
      date: null,
      commit: arbre.sha || null,
      commitCourt: arbre.sha ? String(arbre.sha).slice(0, 8) : null,
      depot: d.proprietaire + '/' + d.nom
    };
  }

  async function lireManifesteHorsLigne() {
    var reponse = await fetch(window.STIStipack.MANIFESTE_HORS_LIGNE + '?stipack=' + Date.now(), { cache: 'no-cache' });
    if (!reponse.ok) throw new Error('liste des fichiers illisible (HTTP ' + reponse.status + ')');
    var manifeste = await reponse.json();
    var fichiers = (manifeste.files || [])
      .map(function (f) { return { chemin: f.path, octets: f.bytes || 0 }; })
      .filter(function (f) { return f.chemin; })
      .sort(function (a, b) { return a.chemin < b.chemin ? -1 : a.chemin > b.chemin ? 1 : 0; });
    return {
      source: 'manifeste',
      fichiers: fichiers,
      version: manifeste.version || null,
      date: manifeste.generatedAt || null,
      commit: null,
      commitCourt: null
    };
  }

  /* Version publiée du site (sw.js), pour juger de la fraîcheur d’une liste. */
  async function lireVersionPubliee() {
    try {
      var reponse = await fetch('sw.js?stipack=' + Date.now(), { cache: 'no-cache' });
      if (!reponse.ok) return null;
      var texte = await reponse.text();
      var trouve = /var\s+VERSION_PUBLIEE\s*=\s*"([^"]+)"/.exec(texte);
      return trouve ? trouve[1] : null;
    } catch (erreur) {
      return null;
    }
  }

  /* Une requête, avec reprises. GitHub Pages répond parfois 503 quand on lui
     demande beaucoup de fichiers d’affilée : on réessaie en espaçant, au lieu
     d’abandonner toute la fabrication sur un incident passager. */
  async function recupererUn(chemin, signal, journalReprise) {
    var derniere = null;
    for (var essai = 0; essai < REGLAGES.tentatives; essai++) {
      if (signal && signal.aborted) throw new Error('Fabrication annulée.');
      if (essai > 0) {
        var attente = REGLAGES.attentes[Math.min(essai - 1, REGLAGES.attentes.length - 1)];
        attente += Math.round(Math.random() * 300);
        journalReprise(chemin, essai, attente, derniere ? derniere.message : '');
        await new Promise(function (r) { setTimeout(r, attente); });
      }
      try {
        var reponse = await fetch(chemin, { signal: signal, cache: 'default' });
        if (reponse.ok) return await reponse.arrayBuffer();
        // 404 : le fichier n’existe pas, inutile d’insister.
        if (reponse.status === 404 || reponse.status === 403) {
          throw Object.assign(
            new Error(chemin + ' : HTTP ' + reponse.status + ' (fichier absent du site)'),
            { definitive: true }
          );
        }
        derniere = new Error('HTTP ' + reponse.status);
      } catch (erreur) {
        if (erreur && (erreur.name === 'AbortError')) throw erreur;
        if (erreur && erreur.definitive) throw erreur;
        derniere = erreur;
      }
    }
    throw new Error(chemin + ' : ' + (derniere && derniere.message ? derniere.message : 'illisible') +
      ' (après ' + REGLAGES.tentatives + ' tentatives)');
  }

  /** Récupère les fichiers dans l’ordre, avec quelques lectures en avance, à cadence tenue. */
  function sourceFichiers(fichiers, signal, journalReprise) {
    var avance = new Map();
    var index = new Map();
    var prochainDepart = 0;

    fichiers.forEach(function (f, i) { index.set(f.chemin, i); });

    function charger(i) {
      if (i >= fichiers.length) return;
      var chemin = fichiers[i].chemin;
      if (avance.has(chemin)) return;
      var promesse = (async function () {
        // Cadence : un départ toutes les REGLAGES.ecartMin au moins.
        var maintenant = Date.now();
        var attente = Math.max(0, prochainDepart - maintenant);
        prochainDepart = Math.max(maintenant, prochainDepart) + REGLAGES.ecartMin;
        if (attente) await new Promise(function (r) { setTimeout(r, attente); });
        return recupererUn(chemin, signal, journalReprise);
      })();
      promesse.catch(function () { /* l’erreur est traitée au tour de son fichier */ });
      avance.set(chemin, promesse);
    }

    for (var i = 0; i < Math.min(REGLAGES.concurrence, fichiers.length); i++) charger(i);

    return async function recuperer(chemin) {
      var position = index.has(chemin) ? index.get(chemin) : 0;
      for (var k = position; k < Math.min(position + REGLAGES.concurrence, fichiers.length); k++) charger(k);
      var promesse = avance.get(chemin);
      try {
        return await promesse;
      } finally {
        avance.delete(chemin);
      }
    };
  }

  /* ------------------------------------------------------------- fraîcheur */

  /* « Le stipack doit toujours faire la dernière mise à jour » : on interroge
     d’abord le dernier commit du dépôt. La liste figée du manifeste n’est qu’un
     secours, et seulement si son garde-fou de fraîcheur le permet. */
  async function lireSourceFraiche() {
    var versionPubliee = await lireVersionPubliee();
    try {
      var duDepot = await lireListeDuDepot();
      duDepot.version = versionPubliee;
      duDepot.jugement = window.STIStipack.jugerFraicheur(duDepot);
      journal('Liste prise sur le dépôt ' + duDepot.depot + ' (' + duDepot.commitCourt + ').');
      return duDepot;
    } catch (erreurDepot) {
      journal('Dépôt injoignable (' + (erreurDepot.message || erreurDepot) + ') : repli sur la liste de secours.', 'erreur');
    }
    var secours = await lireManifesteHorsLigne();
    secours.versionPubliee = versionPubliee;
    secours.jugement = window.STIStipack.jugerFraicheur(secours);
    return secours;
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

      afficherProgression(0, 'Lecture de la dernière mise à jour…');
      var sourced = await lireSourceFraiche();
      var liste = sourced.fichiers;
      var volume = el.volume && el.volume.value === 'leger' ? 'leger' : 'complet';
      var disposition = el.disposition && el.disposition.value === 'racine' ? 'racine' : 'plateforme';
      var seuilMo = el.seuil ? Number(el.seuil.value) || SEUIL_DEFAUT_MO : SEUIL_DEFAUT_MO;
      var seuil = volume === 'leger' ? Math.round(seuilMo * 1024 * 1024) : 0;
      var totalOctets = liste.reduce(function (somme, f) { return somme + (f.octets || 0); }, 0);
      var updateId = await window.STIStipack.lireUpdateId(async function (chemin) {
        var reponse = await fetch(chemin, { cache: 'no-cache' });
        return reponse.ok ? reponse.text() : '';
      });

      journal(
        'Dernière mise à jour : ' + liste.length + ' fichiers, ' + tailleLisible(totalOctets) +
        ' — ' + sourced.jugement.motif + '.'
      );
      journal(
        disposition === 'racine'
          ? 'Disposition : fichiers à la racine de l’archive (attendue par un installeur qui dépose le contenu dans son dossier).'
          : 'Disposition : fichiers sous plateforme/ dans l’archive.'
      );
      if (sourced.ecartes) {
        journal(
          sourced.ecartes + ' fichier(s) du dépôt écartés : tests et outillage ne font pas partie de l’installation.',
          ''
        );
      }
      if (!sourced.jugement.frais) {
        throw new Error(sourced.jugement.motif);
      }

      var recuperer = sourceFichiers(
        liste,
        controleur ? controleur.signal : undefined,
        function (chemin, essai, attente, motif) {
          journal(
            'Reprise ' + essai + '/' + (REGLAGES.tentatives - 1) + ' dans ' + Math.round(attente / 100) / 10 + ' s : ' +
            chemin + (motif ? ' (' + motif + ')' : '')
          );
        }
      );

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
        disposition: disposition,
        updateId: updateId,
        commit: sourced.commit || null,
        dateVersion: sourced.date || null,
        sourceVersion: sourced.source === 'depot'
          ? 'dernier commit du dépôt ' + (sourced.depot || '') + ' — liste lue à la fabrication'
          : 'liste de secours ' + (sourced.version || 'inconnue'),
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
      disposition: $('stipack-disposition'),
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
      metaPoids: $('stipack-meta-poids'),
      metaVersion: $('stipack-meta-version')
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
    lireSourceFraiche().then(function (sourced) {
      var octets = sourced.fichiers.reduce(function (somme, f) { return somme + (f.octets || 0); }, 0);
      if (el.metaFichiers) el.metaFichiers.textContent = sourced.fichiers.length + ' fichiers';
      if (el.metaPoids) el.metaPoids.textContent = tailleLisible(octets);
      if (el.metaVersion) {
        el.metaVersion.textContent = sourced.commitCourt
          ? 'dernière mise à jour ' + sourced.commitCourt
          : 'liste de secours';
      }
      if (el.etat) el.etat.textContent = 'Prêt — ' + sourced.jugement.motif + '.';
    }).catch(function (erreur) {
      if (el.metaFichiers) el.metaFichiers.textContent = 'liste indisponible';
      if (el.etat) el.etat.textContent = 'Liste indisponible : ' + (erreur.message || erreur);
      journal('Liste illisible : ' + (erreur.message || erreur), 'erreur');
    });
  }

  window.STIStipackAdmin = { init: init, fabriquer: fabriquer, reglages: REGLAGES };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
