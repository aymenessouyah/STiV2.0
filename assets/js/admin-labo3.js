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
  global.STILabo3Admin = { lirePostes: lirePostes, signer: signer };
  function initialiser() {
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
