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
    var release = await reponse.json();
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
    var texteSommes;
    try { texteSommes = await (await chercher(sommes.browser_download_url, { cache: 'no-store' })).text(); }
    catch (erreur) { return { publie: false, raison: 'empreintes illisibles : ' + erreur.message }; }
    var empreinte = lireSommes(texteSommes)[exe.name];
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

  global.STILabo3Admin = {
    lirePostes: lirePostes,
    signer: signer,
    verifierPublication: verifierPublication,
    lireSommes: lireSommes,
    depotCible: depotCible,
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
      lien.href = resultat.url;
      lien.setAttribute('download', resultat.nom);
      lien.disabled = false;
      lien.classList.remove('btn-outil-desactive');
      lien.textContent = 'Télécharger ' + resultat.nom;
      var quand = resultat.publieLe ? new Date(resultat.publieLe).toLocaleString('fr-FR') : 'date inconnue';
      var poids = resultat.octets ? ' · ' + (resultat.octets / 1048576).toFixed(0) + ' Mo' : '';
      etat.textContent = 'Release « ' + resultat.version + ' » publiée le ' + quand + poids +
        '. SHA-256 à comparer après téléchargement : ' + resultat.sha256;
    } else {
      lien.removeAttribute('href');
      lien.disabled = true;
      lien.classList.add('btn-outil-desactive');
      lien.textContent = 'Téléchargement indisponible';
      etat.textContent = resultat.raison;
    }
    if (bouton) bouton.disabled = false;
    return resultat;
  }

  function initialiser() {
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
        if (!cle.files.length || !releves.files.length) throw new Error('Sélectionnez les relevés et votre clé privée de signature.');
        if (cle.files[0].size > 16384 || Array.from(releves.files).some(function (f) { return f.size > 16384; })) throw new Error('Fichier trop volumineux.');
        var postes = lirePostes(await Promise.all(Array.from(releves.files, function (f) { return f.text(); })));
        var autorisation = await signer(postes, await cle.files[0].text());
        var url = URL.createObjectURL(new Blob([JSON.stringify(autorisation, null, 2)], { type: 'application/json' }));
        var a = document.createElement('a'); a.href = url; a.download = 'autorisation-labo3.json';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
        etat.textContent = 'Autorisation téléchargée pour ' + postes.length + ' poste(s). La protection ne sera active qu’avec le futur installateur et sa clé publique de confiance.';
      } catch (e) { etat.textContent = 'Échec : ' + e.message; }
      finally { cle.value = ''; bouton.disabled = false; }
    });
  }
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialiser);
    else initialiser();
  }
})(typeof window !== 'undefined' ? window : globalThis);
