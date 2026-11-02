/* ============================================================================
 * stipack.js — fabrication du paquet « .stipack » depuis le tableau de bord
 * ----------------------------------------------------------------------------
 * Le bouton « 🧱 Nouveau stipack » de l’admin (section « Application Windows
 * v316 — guide et assistance ») appelle ce module : il relit la liste du
 * paquet hors ligne (offline-complete-manifest.json), récupère chaque fichier
 * tel qu’il est servi par le site, puis assemble une archive ZIP nommée
 * STI-Labo3-Plateforme.stipack que l’administrateur télécharge et conserve
 * pour réinstaller la plateforme si besoin.
 *
 * Structure produite — identique à celle de outils/stipack/construire-stipack.mjs :
 *   plateforme/…            tous les fichiers du site
 *   stipack.json            manifeste (version, date, fichier + SHA-256)
 *   empreintes.txt          mêmes empreintes, pour `sha256sum -c`
 *   LISEZ-MOI.txt           notice lisible à l’ouverture
 *
 * Points de conception :
 *   - aucune dépendance : CRC32 et en-têtes ZIP sont écrits ici, la
 *     compression utilise CompressionStream('deflate-raw') quand il existe ;
 *   - écriture au fil de l’eau : on ne garde jamais tout le paquet en mémoire
 *     si le navigateur sait écrire dans un fichier (File System Access API),
 *     sinon on assemble un Blob final ;
 *   - le manifeste est écrit en dernier : ses empreintes ne sont connues
 *     qu’après lecture des fichiers, et le ZIP n’impose aucun ordre ;
 *   - tout est annulable (AbortSignal) et signale sa progression.
 * ========================================================================== */
(function (global) {
  'use strict';

  var FORMAT = 'STI-STIPACK/1';
  var NOM_PAR_DEFAUT = 'STI-Labo3-Plateforme.stipack';
  var MANIFESTE_HORS_LIGNE = 'offline-complete-manifest.json';
  var PLATEFORME = 'STI by AE — L’Atelier du Web';

  /* Extensions déjà compressées : les stocker évite un aller-retour inutile
     dans CompressionStream (et le résultat serait plus gros). */
  var DEJA_COMPRIME = /\.(?:mp4|m4s|webm|mov|mkv|avi|mp3|ogg|opus|m4a|aac|wav|flac|zip|gz|7z|rar|png|jpe?g|webp|gif|avif|ico|woff2?|ttf|otf|eot|wasm|pdf|psd|apk|exe|dll)$/i;

  /* ------------------------------------------------------------- primitives */

  var TABLE_CRC = (function () {
    var table = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
    return table;
  })();

  function crc32(octets) {
    var c = 0xffffffff;
    for (var i = 0; i < octets.length; i++) c = TABLE_CRC[(c ^ octets[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  function hex(tampon) {
    var s = '';
    for (var i = 0; i < tampon.length; i++) s += (tampon[i] < 16 ? '0' : '') + tampon[i].toString(16);
    return s;
  }

  /* Empreinte SHA-256 d’un fichier. Renvoie null si le contexte n’est pas
     sécurisé (http://), cas où crypto.subtle est absent. */
  async function sha256Hex(octets) {
    if (!global.crypto || !global.crypto.subtle || !global.crypto.subtle.digest) return null;
    try {
      var empreinte = await global.crypto.subtle.digest('SHA-256', octets);
      return hex(new Uint8Array(empreinte));
    } catch (erreur) {
      return null;
    }
  }

  /* Compression deflate brute (celle qu’attend le format ZIP). */
  async function deflater(octets) {
    if (typeof global.CompressionStream !== 'function' || typeof global.Blob !== 'function') return null;
    try {
      var flux = new global.Blob([octets]).stream().pipeThrough(new global.CompressionStream('deflate-raw'));
      var tampon = await new global.Response(flux).arrayBuffer();
      return new Uint8Array(tampon);
    } catch (erreur) {
      return null;
    }
  }

  /* Date au format MS-DOS attendu par les en-têtes ZIP. */
  function dateDos(date) {
    var d = date instanceof Date ? date : new Date();
    return {
      heure: ((d.getHours() & 31) << 11) | ((d.getMinutes() & 63) << 5) | ((d.getSeconds() / 2) & 31),
      jour: (((d.getFullYear() - 1980) & 127) << 9) | (((d.getMonth() + 1) & 15) << 5) | (d.getDate() & 31)
    };
  }

  function enOctets(valeur) {
    if (valeur instanceof Uint8Array) return valeur;
    if (valeur instanceof ArrayBuffer) return new Uint8Array(valeur);
    return new TextEncoder().encode(String(valeur));
  }

  function tailleLisible(octets) {
    var unites = ['o', 'Ko', 'Mo', 'Go'];
    var i = 0;
    var v = octets;
    while (v >= 1024 && i < unites.length - 1) { v /= 1024; i++; }
    return (v >= 100 || i === 0 ? Math.round(v) : v.toFixed(1).replace('.', ',')) + ' ' + unites[i];
  }

  /* ------------------------------------------------------------- ZIP (écriture) */

  /**
   * Ouvre une archive ZIP en écriture au fil de l’eau.
   * `ecrire(fragment)` reçoit les octets à la suite ; `terminer()` écrit le
   * répertoire central puis l’enregistrement de fin. Une seule archive par
   * instance : les entrées s’ajoutent avec `ajouter()`, dans n’importe quel
   * ordre, avant l’appel final à `terminer()`.
   */
  function ouvrirZip(ecrire, options) {
    options = options || {};
    var date = dateDos(options.date);
    var central = [];
    var position = 0;
    var termine = false;

    return {
      /** entree = { chemin, donnees, compresser } */
      ajouter: async function (entree) {
        if (termine) throw new Error('Archive déjà terminée.');
        var donnees = enOctets(entree.donnees);
        var nom = enOctets(entree.chemin);
        var crc = crc32(donnees);
        var corps = donnees;
        var methode = 0;

        if (entree.compresser !== false && donnees.length > 128) {
          var compresse = await deflater(donnees);
          if (compresse && compresse.length < donnees.length) {
            corps = compresse;
            methode = 8;
          }
        }

        if (donnees.length > 0xffffffff) {
          throw new Error('Fichier trop volumineux pour le format ZIP : ' + entree.chemin);
        }

        var local = new Uint8Array(30 + nom.length);
        var vue = new DataView(local.buffer);
        vue.setUint32(0, 0x04034b50, true);
        vue.setUint16(4, 20, true);        // version nécessaire
        vue.setUint16(6, 0x0800, true);    // noms en UTF-8
        vue.setUint16(8, methode, true);
        vue.setUint16(10, date.heure, true);
        vue.setUint16(12, date.jour, true);
        vue.setUint32(14, crc, true);
        vue.setUint32(18, corps.length, true);
        vue.setUint32(22, donnees.length, true);
        vue.setUint16(26, nom.length, true);
        vue.setUint16(28, 0, true);
        local.set(nom, 30);

        central.push({
          nom: nom, methode: methode, crc: crc, compresse: corps.length,
          brut: donnees.length, decalage: position
        });

        await ecrire(local);
        await ecrire(corps);
        position += local.length + corps.length;
      },

      terminer: async function () {
        if (termine) return { octets: position, nombre: central.length };
        termine = true;
        var debutCentral = position;

        for (var j = 0; j < central.length; j++) {
          var e = central[j];
          var entete = new Uint8Array(46 + e.nom.length);
          var v = new DataView(entete.buffer);
          v.setUint32(0, 0x02014b50, true);
          v.setUint16(4, 20, true);
          v.setUint16(6, 20, true);
          v.setUint16(8, 0x0800, true);
          v.setUint16(10, e.methode, true);
          v.setUint16(12, date.heure, true);
          v.setUint16(14, date.jour, true);
          v.setUint32(16, e.crc, true);
          v.setUint32(20, e.compresse, true);
          v.setUint32(24, e.brut, true);
          v.setUint16(28, e.nom.length, true);
          v.setUint16(30, 0, true);          // extra
          v.setUint16(32, 0, true);          // commentaire
          v.setUint16(34, 0, true);          // disque
          v.setUint16(36, 0, true);          // attributs internes
          v.setUint32(38, 0, true);          // attributs externes
          v.setUint32(42, e.decalage, true);
          entete.set(e.nom, 46);
          await ecrire(entete);
          position += entete.length;
        }

        var fin = new Uint8Array(22);
        var vf = new DataView(fin.buffer);
        vf.setUint32(0, 0x06054b50, true);
        vf.setUint16(8, central.length, true);
        vf.setUint16(10, central.length, true);
        vf.setUint32(12, position - debutCentral, true);
        vf.setUint32(16, debutCentral, true);
        await ecrire(fin);
        position += fin.length;

        return { octets: position, nombre: central.length };
      }
    };
  }

  /** Raccourci : toutes les entrées en une fois. */
  async function ecrireZip(entrees, ecrire, options) {
    var zip = ouvrirZip(ecrire, options);
    for (var i = 0; i < entrees.length; i++) await zip.ajouter(entrees[i]);
    return zip.terminer();
  }

  /* ------------------------------------------------------------ fabrication */

  function texteNotice(infos) {
    return [
      'STI by AE — L’Atelier du Web',
      'Paquet d’installation ' + infos.nom,
      '',
      'Version   : ' + (infos.updateId || 'inconnue'),
      'Fabriqué  : ' + infos.fabriqueLe,
      'Volume    : ' + infos.volume + (infos.seuil ? ' (fichiers jusqu’à ' + tailleLisible(infos.seuil) + ')' : ''),
      'Fichiers  : ' + infos.fichiers,
      '',
      'Contenu de l’archive :',
      '  plateforme/      tous les fichiers du site, à déposer tels quels',
      '  stipack.json     manifeste : version, date et empreinte SHA-256 de chaque fichier',
      '  empreintes.txt   mêmes empreintes, contrôlables par « sha256sum -c empreintes.txt »',
      '',
      'Installation : lancer STI-Labo3-Windows.exe, sélectionner ce fichier,',
      'puis saisir le mot de passe initial demandé.',
      '',
      infos.exclus.length
        ? '⚠ Paquet allégé : ' + infos.exclus.length + ' fichier(s) ne sont pas inclus (médias volumineux).\n' +
          '  La liste exacte figure dans stipack.json > « exclus ».\n'
        : ''
    ].join('\n');
  }

  /**
   * Fabrique le paquet.
   * options = {
   *   liste      : [{ chemin, octets? }]   fichiers du site à empaqueter
   *   recuperer  : async (chemin) => Uint8Array | ArrayBuffer
   *   ecrire     : async (Uint8Array) => void        écriture des fragments
   *   seuil      : nombre d’octets au-delà duquel un fichier est écarté (0/absent = tout garder)
   *   volume     : 'complet' | 'leger'
   *   updateId   : identifiant de version (sw.js), facultatif
   *   fabriqueLe : date ISO, facultatif
   *   onProgres  : ({ fait, total, chemin, octets }) => void
   *   signal     : AbortSignal, facultatif
   * }
   * Renvoie { fichiers, exclus, octets, nom }.
   */
  async function construirePaquet(options) {
    options = options || {};
    var liste = options.liste || [];
    var recuperer = options.recuperer;
    var ecrire = options.ecrire;
    var seuil = options.seuil || 0;
    var signal = options.signal || null;
    var onProgres = typeof options.onProgres === 'function' ? options.onProgres : function () {};
    var fabriqueLe = options.fabriqueLe || new Date().toISOString();
    var nom = options.nom || NOM_PAR_DEFAUT;
    var volume = options.volume || (seuil ? 'leger' : 'complet');

    if (typeof recuperer !== 'function') throw new Error('recuperer() est requis');
    if (typeof ecrire !== 'function') throw new Error('ecrire() est requis');

    var exclus = [];
    var retenus = [];
    for (var i = 0; i < liste.length; i++) {
      var item = liste[i];
      if (!item || !item.chemin) continue;
      if (seuil && item.octets && item.octets > seuil) {
        exclus.push({ chemin: item.chemin, motif: 'plus de ' + tailleLisible(seuil).replace(',0 ', ' ') });
        continue;
      }
      retenus.push(item);
    }

    var zip = ouvrirZip(ecrire, { date: new Date(fabriqueLe) });
    var central = [];
    var total = retenus.length;
    var octetsDecompresses = 0;
    var avancement = 0;

    for (var k = 0; k < retenus.length; k++) {
      if (signal && signal.aborted) throw new Error('Fabrication annulée.');
      var chemin = retenus[k].chemin;
      var brut = enOctets(await recuperer(chemin));
      octetsDecompresses += brut.length;
      central.push({
        chemin: 'plateforme/' + chemin,
        octets: brut.length,
        sha256: await sha256Hex(brut)
      });
      await zip.ajouter({
        chemin: 'plateforme/' + chemin,
        donnees: brut,
        compresser: !DEJA_COMPRIME.test(chemin)
      });
      avancement += brut.length;
      onProgres({ fait: k + 1, total: total, chemin: chemin, octets: avancement });
    }

    var manifeste = {
      format: FORMAT,
      nom: nom,
      plateforme: PLATEFORME,
      version: {
        updateId: options.updateId || null,
        commit: null,
        commitCourt: null,
        date: fabriqueLe,
        source: 'site en ligne au moment de la fabrication'
      },
      fabriqueLe: fabriqueLe,
      volume: volume,
      seuilOctetsParFichier: seuil || null,
      contenu: {
        dossier: 'plateforme/',
        fichiers: central.length,
        octetsDecompresses: octetsDecompresses
      },
      acces: {
        motDePasseInitial: null,
        note: 'Mot de passe demandé à l’installation, non fixé par le paquet.'
      },
      exclus: exclus,
      fichiers: central
    };

    var texteManifeste = new TextEncoder().encode(JSON.stringify(manifeste, null, 2) + '\n');
    var empreintesTexte = central.map(function (f) {
      return (f.sha256 || 'empreinte-indisponible') + '  ' + f.chemin;
    }).join('\n') + '\n' + (await sha256Hex(texteManifeste) || 'empreinte-indisponible') + '  stipack.json\n';

    var complement = [
      { chemin: 'stipack.json', donnees: texteManifeste, compresser: true },
      { chemin: 'empreintes.txt', donnees: new TextEncoder().encode(empreintesTexte), compresser: true },
      {
        chemin: 'LISEZ-MOI.txt',
        donnees: new TextEncoder().encode(texteNotice({
          nom: nom, updateId: options.updateId, fabriqueLe: fabriqueLe, volume: volume,
          seuil: seuil, fichiers: central.length, exclus: exclus
        })),
        compresser: true
      }
    ];

    for (var c = 0; c < complement.length; c++) await zip.ajouter(complement[c]);
    var fin = await zip.terminer();

    return {
      nom: nom,
      volume: volume,
      seuil: seuil || null,
      fichiers: central.length,
      exclus: exclus,
      octetsDecompresses: octetsDecompresses,
      octets: avancement + fin.octets,
      manifeste: manifeste
    };
  }

  /* ------------------------------------------------------------ écrivains */

  /* Écrivain en mémoire : accumule les fragments puis rend un Blob. */
  function ecrivainMemoire() {
    var fragments = [];
    var octets = 0;
    return {
      ecrire: async function (fragment) {
        fragments.push(fragment);
        octets += fragment.length;
      },
      octets: function () { return octets; },
      bloc: function () { return new global.Blob(fragments, { type: 'application/zip' }); }
    };
  }

  /* Écrivain vers un fichier choisi par l’utilisateur (File System Access API) :
     le paquet n’est jamais entièrement en mémoire. */
  async function ecrivainFichier(nomSuggere) {
    if (typeof global.showSaveFilePicker !== 'function') return null;
    var poignee = await global.showSaveFilePicker({
      suggestedName: nomSuggere || NOM_PAR_DEFAUT,
      types: [{ description: 'Paquet STI (.stipack)', accept: { 'application/zip': ['.stipack'] } }]
    });
    var flux = await poignee.createWritable();
    return {
      ecrire: function (fragment) { return flux.write(fragment); },
      terminer: function () { return flux.close(); },
      annuler: function () { return flux.abort ? flux.abort() : flux.close(); }
    };
  }

  /* Déclenche le téléchargement et renvoie l’URL du Blob. Elle n’est pas
     révoquée ici : l’admin garde le lien pour retélécharger le même paquet.
     C’est l’appelant qui libère l’URL précédente quand il la remplace. */
  function telecharger(blob, nom) {
    var url = global.URL.createObjectURL(blob);
    var lien = global.document.createElement('a');
    lien.href = url;
    lien.download = nom || NOM_PAR_DEFAUT;
    lien.rel = 'noopener';
    global.document.body.appendChild(lien);
    lien.click();
    lien.remove();
    return url;
  }

  function liberer(url) {
    if (!url) return;
    try { global.URL.revokeObjectURL(url); } catch (erreur) { /* déjà libérée */ }
  }

  /* ------------------------------------------------------------- version */

  /* Identifiant de version lu dans sw.js, pour que le paquet sache de quelle
     révision du site il provient. */
  async function lireUpdateId(recupererTexte) {
    try {
      var texte = await recupererTexte('sw.js');
      var trouve = /var\s+UPDATE_ID\s*=\s*"([^"]+)"/.exec(texte);
      return trouve ? trouve[1] : null;
    } catch (erreur) {
      return null;
    }
  }

  global.STIStipack = {
    FORMAT: FORMAT,
    NOM_PAR_DEFAUT: NOM_PAR_DEFAUT,
    MANIFESTE_HORS_LIGNE: MANIFESTE_HORS_LIGNE,
    crc32: crc32,
    sha256Hex: sha256Hex,
    tailleLisible: tailleLisible,
    ouvrirZip: ouvrirZip,
    ecrireZip: ecrireZip,
    construirePaquet: construirePaquet,
    ecrivainMemoire: ecrivainMemoire,
    ecrivainFichier: ecrivainFichier,
    telecharger: telecharger,
    liberer: liberer,
    lireUpdateId: lireUpdateId
  };
})(typeof window !== 'undefined' ? window : globalThis);
