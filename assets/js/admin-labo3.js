/* Préparation locale des autorisations : aucune clé ni empreinte envoyée au réseau. */
(function (global) {
  'use strict';
  function lirePostes(textes) {
    var postes = textes.map(function (texte) {
      var p = JSON.parse(texte.replace(/^\uFEFF/, ''));
      if (p.format !== 'STI-LABO3-POSTE/1' || !/^[a-f0-9]{64}$/.test(p.empreinte)) throw new Error('Relevé de poste invalide.');
      return p.empreinte;
    });
    if (!postes.length || postes.length > 20 || new Set(postes).size !== postes.length) {
      throw new Error('Choisissez entre 1 et 20 relevés de postes distincts.');
    }
    return postes.sort();
  }
  function base64(octets) {
    return global.btoa(Array.from(octets, function (n) { return String.fromCharCode(n); }).join(''));
  }
  async function signer(postes, pem) {
    if (!global.crypto || !global.crypto.subtle) throw new Error('Navigateur avec Web Crypto requis (HTTPS).');
    if (!/^-----BEGIN PRIVATE KEY-----[\s\S]*-----END PRIVATE KEY-----\s*$/.test(pem.trim())) {
      throw new Error('Clé privée PKCS#8 PEM requise ; ne sélectionnez pas un fichier de mot de passe.');
    }
    var brut = global.atob(pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, ''));
    var octets = Uint8Array.from(brut, function (c) { return c.charCodeAt(0); });
    var cle = await global.crypto.subtle.importKey('pkcs8', octets, { name: 'Ed25519' }, false, ['sign']);
    var contenu = { format: 'STI-LABO3-AUTORISATION/1', laboratoire: 'Labo3', postes: lirePostes(postes.map(function (p) {
      return JSON.stringify({ format: 'STI-LABO3-POSTE/1', empreinte: p });
    })) };
    var donnees = new TextEncoder().encode(JSON.stringify(contenu));
    var signature = await global.crypto.subtle.sign('Ed25519', cle, donnees);
    return { algorithme: 'Ed25519', donnees: base64(donnees), signature: base64(new Uint8Array(signature)) };
  }
  /* ---------------------------------------------------- installateur publié

     Le binaire n'est pas dans le dépôt : il est compilé avec la clé publique de
     l'administrateur, puis publié dans la release `labo3-windows`. Ce contrôle
     ne fait confiance qu'à une URL de release GitHub du dépôt et qu'au fichier
     SHA256SUMS.txt qui l'accompagne — jamais à un lien recopié ailleurs. */
  var TAG_INSTALLATEUR = 'labo3-windows';
  var NOM_EXE = 'STI-Labo3-Installation.exe';
  var NOM_SOMMES = 'SHA256SUMS.txt';

  function depotCible() {
    if (global.STIStipack && global.STIStipack.DEPOT) return global.STIStipack.DEPOT;
    var hote = (global.location && global.location.hostname) || '';
    var morceaux = ((global.location && global.location.pathname) || '/').split('/').filter(Boolean);
    if (/\.github\.io$/i.test(hote) && morceaux.length) return { proprietaire: hote.split('.')[0], nom: morceaux[0] };
    return { proprietaire: 'aymenessouyah', nom: 'STiV2.0' };
  }

  function urlDeReleaseAttendue(depot, url) {
    var attendue = 'https://github.com/' + depot.proprietaire + '/' + depot.nom + '/releases/download/';
    return typeof url === 'string' && url.indexOf(attendue) === 0 && url.indexOf('\n') === -1;
  }

  function lireSommes(texte) {
    var parNom = {};
    String(texte || '').split('\n').forEach(function (ligne) {
      var m = ligne.match(/^([0-9a-f]{64})\s+(.+?)\s*$/);
      if (m) parNom[m[2]] = m[1];
    });
    return parNom;
  }

  async function verifierPublication(options) {
    options = options || {};
    var chercher = options.fetch || global.fetch;
    var depot = options.depot || depotCible();
    if (typeof chercher !== 'function') return { publie: false, raison: 'fetch indisponible dans ce navigateur.' };
    var api = 'https://api.github.com/repos/' + depot.proprietaire + '/' + depot.nom +
      '/releases/tags/' + encodeURIComponent(options.tag || TAG_INSTALLATEUR);
    var reponse;
    try {
      reponse = await chercher(api, { headers: { Accept: 'application/vnd.github+json' }, cache: 'no-store' });
    } catch (erreur) { return { publie: false, raison: 'dépôt injoignable : ' + erreur.message }; }
    if (reponse.status === 404) return { publie: false, raison: 'aucune release « ' + (options.tag || TAG_INSTALLATEUR) + ' » : l’installateur n’a pas encore été compilé avec votre clé publique.' };
    if (!reponse.ok) return { publie: false, raison: 'release illisible (HTTP ' + reponse.status + ')' };
    var release;
    try { release = await reponse.json(); }
    catch (erreur) { return { publie: false, raison: 'réponse de la release illisible : ' + erreur.message }; }
    var actifs = (release && release.assets) || [];
    var exe = actifs.filter(function (a) { return a && a.name === NOM_EXE; })[0] ||
      actifs.filter(function (a) { return a && /\.exe$/i.test(a.name || ''); })[0];
    var sommes = actifs.filter(function (a) { return a && a.name === NOM_SOMMES; })[0];
    if (!exe) return { publie: false, raison: 'release présente mais sans exécutable ' + NOM_EXE + '.' };
    if (!urlDeReleaseAttendue(depot, exe.browser_download_url)) {
      return { publie: false, raison: 'adresse de téléchargement hors du dépôt : refus.' };
    }
    if (!sommes || !urlDeReleaseAttendue(depot, sommes.browser_download_url)) {
      return { publie: false, raison: 'SHA256SUMS.txt absent de la release : empreinte invérifiable.' };
    }
    /* L'hôte de téléchargement des releases (release-assets.githubusercontent.com)
       n'envoie pas d'en-tête CORS : un navigateur ne peut pas y lire le fichier
       SHA256SUMS.txt — c'est l'échec « Failed to fetch » vu en conditions réelles.
       L'empreinte est donc lue d'abord dans la notice de la release, où le job de
       publication la recopie ligne par ligne ; la lecture du fichier ne reste
       qu'un repli, pour les notices antérieures à ce réglage. */
    var empreinte = lireSommes(release.body)[exe.name];
    /* GitHub fournit également le digest de chaque fichier dans l'API CORS.
       Il évite de dépendre de l'hôte de téléchargement si la notice est vide. */
    if (!/^[0-9a-f]{64}$/.test(empreinte || '') && /^sha256:[0-9a-f]{64}$/i.test(exe.digest || '')) {
      empreinte = exe.digest.slice(7).toLowerCase();
    }
    if (!/^[0-9a-f]{64}$/.test(empreinte || '')) {
      var texteSommes;
      try {
        var reponseSommes = await chercher(sommes.browser_download_url, { cache: 'no-store' });
        if (!reponseSommes.ok) throw new Error('HTTP ' + reponseSommes.status);
        texteSommes = await reponseSommes.text();
      }
      catch (erreur) { return { publie: false, raison: 'empreintes illisibles : ' + erreur.message + ' (notice de release sans somme).' }; }
      empreinte = lireSommes(texteSommes)[exe.name];
    }
    if (!/^[0-9a-f]{64}$/.test(empreinte || '')) {
      return { publie: false, raison: 'aucune empreinte SHA-256 pour ' + exe.name + ' dans ' + NOM_SOMMES + '.' };
    }
    return {
      publie: true,
      nom: exe.name,
      url: exe.browser_download_url,
      sha256: empreinte,
      version: release.name || release.tag_name || '',
      publieLe: release.published_at || null,
      octets: exe.size || null
    };
  }

  /* ---------------------------------------------------- clés de signature

     La paire Ed25519 est fabriquée dans le navigateur. La clé privée n'est ni
     stockée par la page, ni envoyée au réseau : elle est proposée immédiatement
     en téléchargement, à conserver hors du dépôt et du support USB. La clé
     publique est celle que le workflow « Windows Labo3 » grave dans
     l'installateur ; l'empreinte affichée ici est exactement celle que le
     workflow imprime, ce qui permet de reconnaître l'artefact
     « STI-v2.0-Labo3-cle-<12 premiers caractères> » sans deviner. */

  /* L'installateur n'accepte que ce DER : SPKI Ed25519, 44 octets. Vérifié ici
     pour qu'une clé inutilisable ne puisse pas être proposée à la compilation. */
  var PREFIXE_SPKI_ED25519 = '302a300506032b6570032100';

  function hexa(octets) {
    return Array.from(octets, function (n) { return (n < 16 ? '0' : '') + n.toString(16); }).join('');
  }

  function pemDepuis(der, etiquette) {
    var lignes = base64(der).match(/.{1,64}/g) || [];
    return '-----BEGIN ' + etiquette + '-----\n' + lignes.join('\n') + '\n-----END ' + etiquette + '-----\n';
  }

  async function genererCles(options) {
    options = options || {};
    var crypto = options.crypto || global.crypto;
    var subtle = crypto && crypto.subtle;
    if (!subtle || !subtle.generateKey) throw new Error('Navigateur avec Web Crypto requis (HTTPS).');
    var paire = await subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
    var spki = new Uint8Array(await subtle.exportKey('spki', paire.publicKey));
    var pkcs8 = new Uint8Array(await subtle.exportKey('pkcs8', paire.privateKey));
    if (spki.length !== 44 || hexa(spki).indexOf(PREFIXE_SPKI_ED25519) !== 0) {
      throw new Error('Clé publique inattendue : l’installateur exige un DER SPKI Ed25519 de 44 octets.');
    }
    var publiquePem = pemDepuis(spki, 'PUBLIC KEY');
    var octetsPem = new TextEncoder().encode(publiquePem);
    var empreinte = hexa(new Uint8Array(await subtle.digest('SHA-256', octetsPem)));
    return {
      publiquePem: publiquePem,
      priveePem: pemDepuis(pkcs8, 'PRIVATE KEY'),
      /* Le champ de saisie d'un workflow est une seule ligne : les retours à la
         ligne y arrivent comme les deux caractères `\n`, que
         outils/windows-labo3/cle-depuis-saisie.mjs reconstruit à l'identique. */
      saisieWorkflow: publiquePem.replace(/\n+$/, '').replace(/\n/g, '\\n'),
      empreinte: empreinte,
      artefact: 'STI-v2.0-Labo3-cle-' + empreinte.slice(0, 12)
    };
  }

  function urlWorkflow(depot) {
    var cible = depot || depotCible();
    return 'https://github.com/' + cible.proprietaire + '/' + cible.nom + '/actions/workflows/windows-labo3.yml';
  }

  global.STILabo3Admin = {
    lirePostes: lirePostes,
    signer: signer,
    verifierPublication: verifierPublication,
    lireSommes: lireSommes,
    depotCible: depotCible,
    genererCles: genererCles,
    pemDepuis: pemDepuis,
    urlWorkflow: urlWorkflow,
    PREFIXE_SPKI_ED25519: PREFIXE_SPKI_ED25519,
    TAG_INSTALLATEUR: TAG_INSTALLATEUR
  };
  /* Affiche l'état de l'installateur publié : lien réel si la release existe et
     que son empreinte est lisible, sinon bouton désactivé et raison affichée. */
  async function rafraichirInstallateur() {
    var lien = document.getElementById('labo3-installateur-lien');
    var etat = document.getElementById('labo3-installateur-etat');
    var bouton = document.getElementById('labo3-installateur-verifier');
    if (!lien || !etat) return;
    if (bouton) bouton.disabled = true;
    etat.textContent = 'Vérification de la release « ' + TAG_INSTALLATEUR + ' »…';
    var resultat = await verifierPublication({});
    if (resultat.publie) {
      /* Cet élément DOIT rester un <a> : sur un <button>, l'affectation de
         href est inerte et le clic ne mène nulle part — bug vu en conditions
         réelles le 09/11/2026, bouton « activé » mais muet au clic. */
      lien.href = resultat.url;
      lien.setAttribute('download', resultat.nom);
      lien.removeAttribute('aria-disabled');
      lien.classList.remove('btn-outil-desactive');
      lien.textContent = 'Télécharger ' + resultat.nom;
      var quand = resultat.publieLe ? new Date(resultat.publieLe).toLocaleString('fr-FR') : 'date inconnue';
      var poids = resultat.octets ? ' · ' + (resultat.octets / 1048576).toFixed(0) + ' Mo' : '';
      etat.textContent = 'Release « ' + resultat.version + ' » publiée le ' + quand + poids +
        '. SHA-256 à comparer après téléchargement : ' + resultat.sha256;
    } else {
      lien.removeAttribute('href');
      lien.setAttribute('aria-disabled', 'true');
      lien.classList.add('btn-outil-desactive');
      lien.textContent = 'Téléchargement indisponible';
      etat.textContent = resultat.raison;
    }
    if (bouton) bouton.disabled = false;
    return resultat;
  }

  /* Clés créées pendant la session : mémoire de la page uniquement. Aucun
     stockage du navigateur n'est touché, aucun cookie n'est écrit, et rien n'est
     envoyé au réseau ; fermer l'onglet les fait disparaître. */
  var clesCourantes = null;

  function telechargerTexte(nom, texte, type) {
    var url = URL.createObjectURL(new Blob([texte], { type: type }));
    var a = document.createElement('a'); a.href = url; a.download = nom;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
  }

  function afficher(id, texte) {
    var element = document.getElementById(id);
    if (element) element.textContent = texte;
    return element;
  }

  function devoiler(id) {
    var element = document.getElementById(id);
    if (element) element.hidden = false;
    return element;
  }

  /* Panneau des clés : création de la paire, téléchargement de la clé privée,
     copie de la clé publique au format exact du champ de workflow. */
  function initialiserCles() {
    var lien = document.getElementById('labo3-workflow-lien');
    if (lien) lien.href = urlWorkflow();
    var bouton = document.getElementById('labo3-cles-generer');
    if (!bouton) return;
    var copier = document.getElementById('labo3-cle-copier');
    var champSaisie = document.getElementById('labo3-cle-saisie');

    bouton.addEventListener('click', async function () {
      bouton.disabled = true;
      try {
        clesCourantes = await genererCles({});
        /* La clé privée quitte la page par un téléchargement immédiat : c'est la
           seule copie, l'administrateur en est responsable. */
        telechargerTexte('cle-privee-labo3.pem', clesCourantes.priveePem, 'application/x-pem-file');
        var pem = devoiler('labo3-cle-publique-wrap');
        if (pem) pem.value = clesCourantes.publiquePem;
        if (champSaisie) champSaisie.value = clesCourantes.saisieWorkflow;
        devoiler('labo3-cle-saisie-wrap');
        if (copier) copier.hidden = false;
        afficher('labo3-cle-empreinte',
          'SHA-256 de la clé publique : ' + clesCourantes.empreinte +
          ' — artefact attendu : ' + clesCourantes.artefact);
        devoiler('labo3-cle-empreinte-wrap');
        afficher('labo3-cles-etat',
          'Paire Ed25519 créée. La clé privée vient d’être téléchargée : conservez-la hors du dépôt et du support USB. ' +
          'Elle n’est ni stockée par cette page ni envoyée au réseau. Vous pouvez signer tout de suite sans la resélectionner.');
      } catch (e) {
        clesCourantes = null;
        afficher('labo3-cles-etat', 'Échec : ' + e.message);
      } finally { bouton.disabled = false; }
    });

    if (copier) copier.addEventListener('click', async function () {
      if (!clesCourantes) { afficher('labo3-cles-etat', 'Créez d’abord la paire de clés.'); return; }
      try {
        await global.navigator.clipboard.writeText(clesCourantes.saisieWorkflow);
        afficher('labo3-cles-etat',
          'Clé publique copiée au format du champ « cle_publique » : une seule ligne, fins de ligne \\n. Collez-la telle quelle.');
      } catch (e) {
        if (champSaisie) { champSaisie.focus(); champSaisie.select(); }
        afficher('labo3-cles-etat',
          'Copie automatique refusée par le navigateur : le texte est sélectionné, copiez-le avec Ctrl+C.');
      }
    });
  }

  function initialiser() {
    initialiserCles();
    var verifier = document.getElementById('labo3-installateur-verifier');
    if (verifier) verifier.addEventListener('click', function () { rafraichirInstallateur(); });
    rafraichirInstallateur();
    var bouton = document.getElementById('labo3-signer');
    if (!bouton) return;
    bouton.addEventListener('click', async function () {
      var etat = document.getElementById('labo3-etat');
      var cle = document.getElementById('labo3-cle');
      var releves = document.getElementById('labo3-postes');
      bouton.disabled = true;
      try {
        if (!releves.files.length) throw new Error('Sélectionnez les relevés des postes (1 à 20 JSON).');
        if (Array.from(releves.files).some(function (f) { return f.size > 16384; })) throw new Error('Fichier trop volumineux.');
        /* La clé créée dans cette page est encore en mémoire : inutile de la
           resélectionner. Sinon, le fichier choisi est exigé. */
        var pem;
        if (cle.files.length) {
          if (cle.files[0].size > 16384) throw new Error('Fichier trop volumineux.');
          pem = await cle.files[0].text();
        } else if (clesCourantes) {
          pem = clesCourantes.priveePem;
        } else {
          throw new Error('Sélectionnez votre clé privée, ou créez la paire de clés ci-dessus.');
        }
        var postes = lirePostes(await Promise.all(Array.from(releves.files, function (f) { return f.text(); })));
        var autorisation = await signer(postes, pem);
        telechargerTexte('autorisation-labo3.json', JSON.stringify(autorisation, null, 2), 'application/json');
        etat.textContent = 'Autorisation téléchargée pour ' + postes.length + ' poste(s). Elle ne sera acceptée que par un installateur compilé avec la clé publique correspondante.';
      } catch (e) { etat.textContent = 'Échec : ' + e.message; }
      finally { cle.value = ''; bouton.disabled = false; }
    });
  }
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialiser);
    else initialiser();
  }
})(typeof window !== 'undefined' ? window : globalThis);
