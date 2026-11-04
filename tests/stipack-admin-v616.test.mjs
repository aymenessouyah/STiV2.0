/*
  v616 — « Nouveau stipack » : fabriquer le paquet d'installation depuis l'admin.

  Deux exigences tenues ici, sans navigateur :

  1. LE PAQUET DÉCRIT TOUJOURS LA DERNIÈRE MISE À JOUR. La liste des fichiers est
     demandée au dernier commit du dépôt (API GitHub, arbre récursif) ; la liste
     figée du manifeste hors ligne n'est qu'un secours, et son garde-fou de
     fraîcheur refuse une liste en retard sur la version publiée du site.

  2. RIEN DE LA PLATEFORME N'EST TOUCHÉ HORS DU STIPACK. Aucun fichier existant
     n'est modifié hormis admin.html (le bloc du bouton et l'hôte d'API autorisé
     par sa CSP) ; sw.js et offline-complete-manifest.json ne portent aucune trace
     de la fonctionnalité, et les nouveaux fichiers restent autonomes.

  Le moteur (assets/js/stipack.js) est éprouvé pour lui-même : en-têtes ZIP, CRC32,
  deflate-raw, répertoire central, empreintes et relecture par l'outil du dépôt.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import zlib from 'node:zlib';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (chemin) => readFileSync(join(root, chemin), 'utf8');

const MOTEUR = lire('assets/js/stipack.js');
const PANNEAU = lire('assets/js/admin-stipack.js');
const ADMIN = lire('admin.html');
const SW = lire('sw.js');
const MANIFESTE_HORS_LIGNE = lire('offline-complete-manifest.json');

/* Le module est une IIFE : on l'exécute dans un laboratoire, sans DOM. */
function chargerMoteur() {
  const fenetre = { crypto: globalThis.crypto, Blob: globalThis.Blob, Response: globalThis.Response };
  if (typeof globalThis.CompressionStream === 'function') fenetre.CompressionStream = globalThis.CompressionStream;
  new Function('window', 'globalThis', MOTEUR)(fenetre, fenetre);
  return fenetre.STIStipack;
}

const S = chargerMoteur();

/* ── lecture d'une archive ZIP, indépendante de celle du module ──────────── */

function lireArchive(tampon) {
  const vue = new DataView(tampon.buffer, tampon.byteOffset, tampon.byteLength);
  let fin = tampon.length - 22;
  while (fin >= 0 && vue.getUint32(fin, true) !== 0x06054b50) fin--;
  assert.ok(fin >= 0, 'enregistrement de fin (EOCD) présent');

  const nombre = vue.getUint16(fin + 10, true);
  let curseur = vue.getUint32(fin + 16, true);
  const entrees = [];
  for (let i = 0; i < nombre; i++) {
    assert.equal(vue.getUint32(curseur, true), 0x02014b50, 'en-tête du répertoire central');
    const methode = vue.getUint16(curseur + 10, true);
    const crc = vue.getUint32(curseur + 16, true);
    const compresse = vue.getUint32(curseur + 20, true);
    const brut = vue.getUint32(curseur + 24, true);
    const longueurNom = vue.getUint16(curseur + 28, true);
    const longueurExtra = vue.getUint16(curseur + 30, true);
    const longueurCommentaire = vue.getUint16(curseur + 32, true);
    const decalage = vue.getUint32(curseur + 42, true);
    const nom = Buffer.from(tampon.subarray(curseur + 46, curseur + 46 + longueurNom)).toString('utf8');
    curseur += 46 + longueurNom + longueurExtra + longueurCommentaire;

    const nomLocal = vue.getUint16(decalage + 26, true);
    const extraLocal = vue.getUint16(decalage + 28, true);
    const debut = decalage + 30 + nomLocal + extraLocal;
    const corps = Buffer.from(tampon.subarray(debut, debut + compresse));
    const donnees = methode === 8 ? zlib.inflateRawSync(corps) : corps;

    assert.equal(donnees.length, brut, `${nom} : taille décompressée annoncée`);
    assert.equal(zlib.crc32(donnees), crc, `${nom} : CRC32 de l'en-tête`);
    entrees.push({ nom, donnees, methode });
  }
  return entrees;
}

/* ── fabrication d'un paquet d'essai ─────────────────────────────────────── */

const FICHIERS = new Map([
  ['index.html', Buffer.from('<html lang="fr">' + 'Atelier du Web. '.repeat(300) + '</html>')],
  ['assets/petit.txt', Buffer.from('abc\n')],
  ['cours/css/media.gif', Buffer.from(Buffer.alloc(2048, 7))],
  ['assets/lourd/video.mp4', Buffer.from(Buffer.alloc(64 * 1024, 1))]
]);

async function fabriquer(options = {}) {
  const fragments = [];
  const resultat = await S.construirePaquet({
    liste: [...FICHIERS.keys()].map((chemin) => ({
      chemin,
      octets: options.taillesInconnues ? undefined : FICHIERS.get(chemin).length
    })),
    recuperer: async (chemin) => FICHIERS.get(chemin),
    ecrire: async (fragment) => { fragments.push(fragment); },
    updateId: 'v616-essai',
    fabriqueLe: '2026-11-02T10:00:00+01:00',
    ...options
  });
  const octets = Buffer.concat(fragments.map((f) => Buffer.from(f)));
  return { resultat, octets, entrees: lireArchive(octets) };
}

test('v616 : le moteur assemble une archive ZIP lisible et complète', async () => {
  const { resultat, entrees } = await fabriquer();
  const noms = entrees.map((e) => e.nom);

  assert.equal(resultat.fichiers, 4);
  for (const chemin of FICHIERS.keys()) {
    assert.ok(noms.includes('plateforme/' + chemin), 'fichier livré : ' + chemin);
  }
  assert.ok(noms.includes('stipack.json'));
  assert.ok(noms.includes('empreintes.txt'));
  assert.ok(noms.includes('LISEZ-MOI.txt'));

  /* Un texte est compressé, un média déjà compressé reste stocké. */
  const index = entrees.find((e) => e.nom === 'plateforme/index.html');
  const video = entrees.find((e) => e.nom === 'plateforme/assets/lourd/video.mp4');
  assert.equal(index.methode, 8, 'le texte est compressé (deflate)');
  assert.equal(video.methode, 0, 'la vidéo est stockée telle quelle');

  for (const [chemin, source] of FICHIERS) {
    const entree = entrees.find((e) => e.nom === 'plateforme/' + chemin);
    assert.ok(entree.donnees.equals(source), 'contenu intact : ' + chemin);
  }
});

test('v616 : le manifeste décrit exactement les fichiers écrits, empreintes à l’appui', async () => {
  const { resultat, entrees } = await fabriquer();
  const manifeste = resultat.manifeste;

  assert.equal(manifeste.format, 'STI-STIPACK/1');
  assert.equal(manifeste.version.updateId, 'v616-essai');
  assert.equal(manifeste.contenu.fichiers, manifeste.fichiers.length);
  assert.equal(
    manifeste.contenu.octetsDecompresses,
    manifeste.fichiers.reduce((total, f) => total + f.octets, 0),
    'le total annoncé est la somme des fichiers'
  );

  const dansArchive = entrees.filter((e) => e.nom.startsWith('plateforme/')).map((e) => e.nom).sort();
  const annonces = manifeste.fichiers.map((f) => f.chemin).sort();
  assert.deepEqual(annonces, dansArchive, 'aucun fichier écrit hors manifeste, aucun annoncé absent');

  for (const f of manifeste.fichiers) {
    const entree = entrees.find((e) => e.nom === f.chemin);
    assert.equal(createHash('sha256').update(entree.donnees).digest('hex'), f.sha256, 'SHA-256 : ' + f.chemin);
  }

  /* empreintes.txt doit être directement utilisable par `sha256sum -c`. */
  const lignes = entrees.find((e) => e.nom === 'empreintes.txt').donnees.toString('utf8').trim().split('\n');
  const parNom = new Map(manifeste.fichiers.map((f) => [f.chemin, f.sha256]));
  parNom.set('stipack.json', createHash('sha256')
    .update(entrees.find((e) => e.nom === 'stipack.json').donnees).digest('hex'));
  for (const ligne of lignes) {
    const [empreinte, chemin] = ligne.split(/\s{2}/);
    assert.ok(parNom.has(chemin), 'chemin inconnu dans empreintes.txt : ' + chemin);
    assert.equal(empreinte, parNom.get(chemin), 'empreinte de ' + chemin);
  }
  assert.equal(lignes.length, manifeste.fichiers.length + 1, 'une ligne par fichier + le manifeste');
});

test('v616 : le seuil allège le paquet et l’écart est consigné', async () => {
  const { resultat, entrees } = await fabriquer({ seuil: 32 * 1024, volume: 'leger' });
  const noms = entrees.map((e) => e.nom);

  assert.equal(resultat.volume, 'leger');
  assert.ok(!noms.includes('plateforme/assets/lourd/video.mp4'), 'le fichier au-delà du seuil est écarté');
  assert.ok(noms.includes('plateforme/index.html'), 'les fichiers sous le seuil sont conservés');
  assert.deepEqual(resultat.exclus, [{ chemin: 'assets/lourd/video.mp4', motif: 'plus de 32 Ko' }]);
  assert.match(entrees.find((e) => e.nom === 'LISEZ-MOI.txt').donnees.toString('utf8'), /Paquet allégé/);
});

test('v616 : un fichier illisible interrompt la fabrication au lieu de produire un paquet troué', async () => {
  await assert.rejects(
    S.construirePaquet({
      liste: [{ chemin: 'absent.html' }],
      recuperer: async () => { throw new Error('HTTP 404'); },
      ecrire: async () => {}
    }),
    /HTTP 404/
  );
});

test('v616 : le paquet produit par le navigateur est relu par l’outil du dépôt', async () => {
  const { octets, resultat } = await fabriquer();
  const dossier = mkdtempSync(join(tmpdir(), 'stipack-'));
  try {
    const fichier = join(dossier, 'essai.stipack');
    writeFileSync(fichier, octets);
    const sortie = execFileSync('node', ['outils/stipack/construire-stipack.mjs', '--verifier', fichier], {
      cwd: root, encoding: 'utf8'
    });
    assert.match(sortie, /0 anomalie/, 'le vérificateur du dépôt ne trouve aucune anomalie');
    assert.match(sortie, new RegExp(resultat.fichiers + ' fichiers annoncés'));
  } finally {
    rmSync(dossier, { recursive: true, force: true });
  }
});

/* ── 1. la dernière mise à jour ─────────────────────────────────────────── */

test('v616 : la fraîcheur de la liste est jugée, jamais supposée', () => {
  const duDepot = S.jugerFraicheur({ source: 'depot', commitCourt: 'abc12345' });
  assert.equal(duDepot.frais, true);
  assert.match(duDepot.motif, /dernier commit du dépôt \(abc12345\)/);

  const secoursARetard = S.jugerFraicheur({
    source: 'manifeste', version: 'v614', versionPubliee: 'v616', date: '2026-11-01T10:00:00Z'
  });
  assert.equal(secoursARetard.frais, false, 'une liste plus ancienne que la version publiée est refusée');
  assert.match(secoursARetard.motif, /en v614 alors que le site publie v616/);

  const secoursAligne = S.jugerFraicheur({
    source: 'manifeste', version: 'v616', versionPubliee: 'v616', date: new Date().toISOString()
  });
  assert.equal(secoursAligne.frais, true);
  assert.match(secoursAligne.motif, /liste de secours/);

  assert.equal(S.ageLisible(new Date(Date.now() - 90 * 60000).toISOString()), 'il y a 2 h');
  assert.equal(S.ageLisible('pas une date'), null);
});

test('v616 : le panneau interroge le dernier commit, le manifeste n’étant qu’un secours', () => {
  assert.match(PANNEAU, /api\.github\.com/, 'la liste vient du dépôt');
  assert.match(PANNEAU, /git\/trees\//, 'arbre récursif du dernier commit');
  assert.match(PANNEAU, /lireListeDuDepot/, 'lecture du dépôt');
  assert.match(PANNEAU, /lireSourceFraiche/, 'choix de la source la plus fraîche');
  assert.match(PANNEAU, /lireManifesteHorsLigne/, 'repli documenté');
  assert.match(PANNEAU, /jugerFraicheur/, 'garde-fou appliqué avant de fabriquer');
  assert.doesNotMatch(PANNEAU, /\bimport\b|\brequire\(/, 'module autonome, sans dépendance');
  assert.match(PANNEAU, /AbortController|abort/, 'la fabrication est annulable');
  /* Le nom porte la date : deux paquets ne s’écrasent pas et la date est lisible. */
  assert.match(PANNEAU, /STI-Labo3-Plateforme-' \+ horodatage\(\)/);
});

test('v616 : le guide Windows du tableau de bord porte le bouton « Nouveau stipack »', () => {
  const section = ADMIN.slice(ADMIN.indexOf('id="aide-windows-v316"'));
  const bloc = section.slice(0, section.indexOf('</section>'));

  assert.match(bloc, /id="bloc-stipack"/, 'le bloc de fabrication est dans la section Windows');
  assert.match(bloc, /<h3>🧱 Nouveau stipack<\/h3>/);
  for (const id of [
    'stipack-volume', 'stipack-seuil', 'stipack-btn-creer', 'stipack-btn-annuler',
    'stipack-btn-telecharger', 'stipack-progression', 'stipack-barre-remplissage',
    'stipack-etat', 'stipack-meta-version', 'stipack-meta-fichiers', 'stipack-meta-poids',
    'stipack-journal', 'stipack-dernier'
  ]) {
    assert.match(bloc, new RegExp('id="' + id + '"'), 'élément présent : ' + id);
  }
  assert.match(bloc, /<option value="complet" selected>/, 'le paquet complet est proposé par défaut');
  assert.match(bloc, /<option value="leger">/, 'le paquet allégé est proposé');

  /* La page doit autoriser l'appel à l'API du dépôt, sinon la liste fraîche est
     systématiquement refusée par la CSP. */
  const csp = (ADMIN.match(/Content-Security-Policy" content="([^"]+)"/) || [])[1] || '';
  assert.match(csp, /connect-src[^;]*https:\/\/api\.github\.com/, 'hôte d’API autorisé par la CSP');

  assert.match(ADMIN, /<script src="assets\/js\/stipack\.js\?v=616" defer><\/script>/);
  assert.match(ADMIN, /<script src="assets\/js\/admin-stipack\.js\?v=616" defer><\/script>/);
  assert.ok(
    ADMIN.indexOf('stipack.js?v=616') < ADMIN.indexOf('admin-stipack.js?v=616'),
    'le moteur est chargé avant le panneau'
  );
});

/* ── 2. rien d'autre que le stipack ──────────────────────────────────────── */

test('v616 : la fonctionnalité ne touche ni le service worker ni le manifeste hors ligne', () => {
  assert.doesNotMatch(SW, /stipack/i, 'sw.js reste intact : aucune révision, aucune entrée de préchargement');
  assert.doesNotMatch(MANIFESTE_HORS_LIGNE, /stipack\.js|admin-stipack/i, 'le manifeste hors ligne reste intact');
  assert.match(SW, /var VERSION_PUBLIEE = "v618";/, 'publication du montage TP6 distincte du StiPack');
  assert.equal(JSON.parse(MANIFESTE_HORS_LIGNE).totalFiles, JSON.parse(MANIFESTE_HORS_LIGNE).files.length);
});

/* ── parcours complet du panneau, dans un navigateur de laboratoire ──────── */

function elementFactice(id) {
  return {
    id,
    hidden: false,
    disabled: false,
    value: '',
    className: '',
    href: '',
    download: '',
    style: {},
    enfants: [],
    /* `children` et `textContent` se comportent comme dans un vrai DOM :
       écrire le texte efface les enfants ajoutés. */
    get children() { return this.enfants; },
    _texte: '',
    get textContent() { return this._texte; },
    set textContent(valeur) { this._texte = valeur; this.enfants = []; },
    ecouteurs: {},
    clique: false,
    appendChild(enfant) { this.enfants.push(enfant); return enfant; },
    removeChild(enfant) { this.enfants = this.enfants.filter((e) => e !== enfant); },
    remove() {},
    click() { this.clique = true; },
    addEventListener(type, fonction) { this.ecouteurs[type] = fonction; }
  };
}

function laboratoire(site, instrumenter) {
  const elements = new Map();
  const articles = [];
  const telechargements = [];
  const stockage = new Map();

  const document = {
    readyState: 'complete',
    body: { appendChild() {} },
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, elementFactice(id));
      return elements.get(id);
    },
    createElement(tag) {
      const e = elementFactice(tag);
      if (tag === 'li') articles.push(e);
      return e;
    },
    addEventListener() {}
  };

  const fenetre = {
    navigator: { platform: 'Win32' },
    location: { hostname: 'aymenessouyah.github.io', pathname: '/STiV2.0/admin.html' },
    document,
    Blob: globalThis.Blob,
    Response: globalThis.Response,
    crypto: globalThis.crypto,
    CompressionStream: globalThis.CompressionStream,
    URL: {
      createObjectURL(blob) { telechargements.push({ blob, url: 'blob:essai' }); return 'blob:essai'; },
      revokeObjectURL() {}
    },
    localStorage: {
      getItem: (c) => (stockage.has(c) ? stockage.get(c) : null),
      setItem: (c, v) => stockage.set(c, v)
    },
    setTimeout,
    AbortController
  };

  const appels = [];
  const baseFetch = async (chemin) => {
    const propre = String(chemin).split('?')[0];
    const donnees = site.get(propre);
    if (!donnees) {
      return {
        ok: false, status: 404,
        arrayBuffer: async () => { throw new Error('404'); },
        text: async () => '',
        json: async () => { throw new Error('404'); }
      };
    }
    return {
      ok: true,
      status: 200,
      arrayBuffer: async () => donnees.buffer.slice(donnees.byteOffset, donnees.byteOffset + donnees.length),
      text: async () => donnees.toString('utf8'),
      json: async () => JSON.parse(donnees.toString('utf8'))
    };
  };

  const fetch = instrumenter ? instrumenter(baseFetch, appels) : baseFetch;

  new Function('window', 'globalThis', MOTEUR)(fenetre, fenetre);
  new Function('window', 'document', 'fetch', 'URL', 'localStorage', 'AbortController', 'setTimeout', PANNEAU)(
    fenetre, document, fetch, fenetre.URL, fenetre.localStorage, AbortController, setTimeout
  );

  return { fenetre, elements, articles, telechargements, stockage, appels };
}

const SHA_DERNIER_COMMIT = 'fedcba9876543210fedcba9876543210fedcba98';

function arbreGithub(chemins) {
  return Buffer.from(JSON.stringify({
    sha: SHA_DERNIER_COMMIT,
    truncated: false,
    tree: chemins.map((p) => ({
      path: p, type: 'blob', size: FICHIERS.has(p) ? FICHIERS.get(p).length : 10, sha: 'blob-' + p
    }))
  }));
}

/* Reprises raccourcies : on éprouve la logique, pas l'attente réelle (10 s). */
function accelerer(labo) {
  const r = labo.fenetre.STIStipackAdmin.reglages;
  r.attentes = [5, 10, 15, 20];
  r.ecartMin = 0;
  return labo;
}

async function attendre(elements, condition) {
  for (let i = 0; i < 300 && !condition(); i++) await new Promise((r) => setTimeout(r, 10));
}

test('v616 : le paquet fabriqué décrit le DERNIER COMMIT, pas la liste figée', async () => {
  const site = new Map();
  /* Liste figée volontairement incomplète et en retard : elle ne doit pas servir. */
  site.set('offline-complete-manifest.json', Buffer.from(JSON.stringify({
    version: 'v600', files: [{ path: 'index.html', bytes: 10 }]
  })));
  site.set('sw.js', Buffer.from('var VERSION_PUBLIEE = "v616";\nvar UPDATE_ID = "v582-journal-connexions";\n'));
  site.set(
    'https://api.github.com/repos/ayemessouyah/STiV2.0/git/trees/main',
    arbreGithub(['index.html', 'assets/petit.txt', 'cours/css/media.gif'])
  );
  site.set(
    'https://api.github.com/repos/aymenessouyah/STiV2.0/git/trees/main',
    arbreGithub(['index.html', 'assets/petit.txt', 'cours/css/media.gif'])
  );
  for (const [chemin, donnees] of FICHIERS) site.set(chemin, donnees);

  const labo = laboratoire(site);
  assert.ok(labo.elements.get('stipack-btn-creer'), 'le bouton écoute le clic');
  labo.elements.get('stipack-btn-creer').ecouteurs.click();

  await attendre(labo.elements, () => labo.articles.some((a) => a.className === 'stipack-ok' || a.className === 'stipack-erreur'));

  assert.ok(
    !labo.articles.some((a) => a.className === 'stipack-erreur'),
    'aucune erreur : ' + labo.articles.filter((a) => a.className === 'stipack-erreur').map((a) => a.textContent).join(' | ')
  );
  assert.equal(labo.telechargements.length, 1, 'le paquet est proposé au téléchargement');
  assert.equal(labo.elements.get('stipack-btn-telecharger').hidden, false);
  assert.match(labo.elements.get('stipack-btn-telecharger').download, /^STI-Labo3-Plateforme-\d{8}-\d{4}\.stipack$/);
  assert.match(
    labo.articles.map((a) => a.textContent).join('\n'),
    /\(fedcba98\)/,
    'le journal cite le commit lu sur le dépôt'
  );

  const octets = Buffer.from(await labo.telechargements[0].blob.arrayBuffer());
  const entrees = lireArchive(octets);
  const manifeste = JSON.parse(entrees.find((e) => e.nom === 'stipack.json').donnees.toString('utf8'));

  assert.equal(manifeste.version.commit, SHA_DERNIER_COMMIT, 'le commit du dernier arbre est inscrit au paquet');
  assert.equal(manifeste.version.commitCourt, 'fedcba98');
  assert.equal(manifeste.version.updateId, 'v582-journal-connexions', 'l’identifiant du delta accompagne le paquet');
  assert.match(manifeste.version.source, /dernier commit du dépôt/);

  /* Les trois fichiers du DERNIER COMMIT, et non l'unique entrée de la liste figée. */
  assert.deepEqual(
    manifeste.fichiers.map((f) => f.chemin).sort(),
    ['plateforme/assets/petit.txt', 'plateforme/cours/css/media.gif', 'plateforme/index.html']
  );

  const dernier = JSON.parse(labo.stockage.get('sti-stipack-dernier'));
  assert.equal(dernier.fichiers, 3);
  assert.match(labo.elements.get('stipack-dernier').textContent, /Dernier paquet fabriqué/);
});

test('v616 : dépôt injoignable et liste de secours en retard → aucun paquet', async () => {
  const site = new Map();
  site.set('offline-complete-manifest.json', Buffer.from(JSON.stringify({
    version: 'v600',
    generatedAt: '2026-10-01T10:00:00Z',
    files: [{ path: 'index.html', bytes: 3 }]
  })));
  site.set('sw.js', Buffer.from('var VERSION_PUBLIEE = "v616";\n'));
  site.set('index.html', Buffer.from('abc'));

  const labo = laboratoire(site);
  labo.elements.get('stipack-btn-creer').ecouteurs.click();

  await attendre(labo.elements, () => labo.articles.some((a) => a.className === 'stipack-erreur'));

  assert.ok(labo.articles.some((a) => a.className === 'stipack-erreur'), 'le refus est signalé');
  assert.ok(
    labo.articles.some((a) => /v600.*publie v616|publie v616/.test(a.textContent)),
    'le motif nomme l’écart de version'
  );
  assert.equal(labo.telechargements.length, 0, 'aucun paquet périmé n’est proposé');
  assert.equal(labo.elements.get('stipack-btn-telecharger').hidden, true);
});

test('v616 : un fichier manquant laisse un message clair et aucun paquet', async () => {
  const site = new Map();
  site.set('sw.js', Buffer.from('var VERSION_PUBLIEE = "v616";\n'));
  site.set(
    'https://api.github.com/repos/aymenessouyah/STiV2.0/git/trees/main',
    arbreGithub(['index.html'])
  );
  site.set('https://api.github.com/repos/ayemessouyah/STiV2.0/git/trees/main', arbreGithub(['index.html']));
  site.set('index.html', Buffer.from('abc'));
  /* Le dernier commit annonce un fichier que le site ne sert pas : le contrôle
     d’intégrité doit interrompre la fabrication. */
  const arbreAvecManquant = Buffer.from(JSON.stringify({
    sha: SHA_DERNIER_COMMIT,
    truncated: false,
    tree: [
      { path: 'index.html', type: 'blob', size: 3 },
      { path: 'disparu.html', type: 'blob', size: 10 }
    ]
  }));
  site.set('https://api.github.com/repos/aymenessouyah/STiV2.0/git/trees/main', arbreAvecManquant);
  site.set('https://api.github.com/repos/ayemessouyah/STiV2.0/git/trees/main', arbreAvecManquant);

  const labo = laboratoire(site);
  labo.elements.get('stipack-btn-creer').ecouteurs.click();

  await attendre(labo.elements, () => labo.articles.some((a) => a.className === 'stipack-erreur'));

  assert.ok(labo.articles.some((a) => a.className === 'stipack-erreur'), 'l’échec est signalé');
  assert.ok(labo.articles.some((a) => /disparu\.html/.test(a.textContent)),
    'le fichier fautif est nommé : ' + labo.articles.map((a) => a.textContent).join(' | '));
  assert.equal(labo.telechargements.length, 0, 'aucun paquet incomplet n’est proposé');
  assert.equal(labo.elements.get('stipack-btn-telecharger').hidden, true);
});

/* ── 3. résistance à l'hébergement (503) et aux fichiers hors installation ── */

/** Laboratoire dont on peut compter les requêtes et faire échouer les premières. */
function laboratoireInstrumente(site, options = {}) {
  return laboratoire(site, (baseFetch, appels) => async (chemin) => {
    const propre = String(chemin).split('?')[0];
    appels.push(propre);
    const echecs = (options.echecs && options.echecs[propre]) || 0;
    const dejaVus = appels.filter((v) => v === propre).length;
    if (dejaVus <= echecs) {
      const statut = options.statut || 503;
      return {
        ok: false, status: statut,
        arrayBuffer: async () => { throw new Error(String(statut)); },
        text: async () => '', json: async () => { throw new Error(String(statut)); }
      };
    }
    return baseFetch(chemin);
  });
}

test('v616 : les tests et l’outillage du dépôt ne sont pas empaquetés', async () => {
  const site = new Map();
  site.set('sw.js', Buffer.from('var VERSION_PUBLIEE = "v616";\n'));
  const chemins = [
    'admin.html',
    'assets/js/stipack.js',
    'cours/css3.html',
    'tests/browser-mobile-nav.spec.mjs',   // c'est ce fichier qui répondait 503
    'tests/stipack-media.test.mjs',
    'outils/stipack/preparer-disque.mjs',
    '.github/workflows/ci.yml',
    '.gitignore',
    'STI-Smart-Book.patch'
  ];
  const arbre = Buffer.from(JSON.stringify({
    sha: SHA_DERNIER_COMMIT,
    truncated: false,
    tree: chemins.map((p) => ({ path: p, type: 'blob', size: 10, sha: 'x' }))
  }));
  for (const p of chemins) site.set(p, Buffer.from('contenu de ' + p));
  site.set('https://api.github.com/repos/aymenessouyah/STiV2.0/git/trees/main', arbre);

  const labo = laboratoire(site);
  labo.elements.get('stipack-btn-creer').ecouteurs.click();
  await attendre(labo.elements, () => labo.articles.some((a) => a.className === 'stipack-ok' || a.className === 'stipack-erreur'));

  assert.ok(!labo.articles.some((a) => a.className === 'stipack-erreur'),
    'aucune erreur : ' + labo.articles.filter((a) => a.className === 'stipack-erreur').map((a) => a.textContent).join(' | '));
  assert.match(labo.articles.map((a) => a.textContent).join('\n'), /6 fichier\(s\) du dépôt écartés/);

  const octets = Buffer.from(await labo.telechargements[0].blob.arrayBuffer());
  const noms = lireArchive(octets).map((e) => e.nom).filter((n) => n.startsWith('plateforme/')).sort();
  assert.deepEqual(noms, ['plateforme/admin.html', 'plateforme/assets/js/stipack.js', 'plateforme/cours/css3.html']);
});

test('v616 : un 503 passager est repris, la fabrication va au bout', async () => {
  const site = new Map();
  site.set('sw.js', Buffer.from('var VERSION_PUBLIEE = "v616";\n'));
  const chemins = ['index.html', 'assets/petit.txt'];
  site.set('https://api.github.com/repos/aymenessouyah/STiV2.0/git/trees/main', arbreGithub(chemins));
  for (const p of chemins) site.set(p, FICHIERS.get(p));

  const labo = accelerer(laboratoireInstrumente(site, { echecs: { 'assets/petit.txt': 2 } }));
  labo.elements.get('stipack-btn-creer').ecouteurs.click();
  await attendre(labo.elements, () => labo.articles.some((a) => a.className === 'stipack-ok' || a.className === 'stipack-erreur'));

  assert.ok(!labo.articles.some((a) => a.className === 'stipack-erreur'),
    'aucune erreur malgré les 503 : ' + labo.articles.map((a) => a.textContent).join(' | '));
  assert.ok(labo.articles.some((a) => /Reprise 1\//.test(a.textContent)), 'les reprises sont annoncées');
  assert.equal(labo.appels.filter((c) => c === 'assets/petit.txt').length, 3, 'deux échecs puis la réussite');
  assert.equal(labo.telechargements.length, 1, 'le paquet est tout de même produit');
});

test('v616 : un fichier durablement indisponible arrête la fabrication, avec le nombre de tentatives', async () => {
  const site = new Map();
  site.set('sw.js', Buffer.from('var VERSION_PUBLIEE = "v616";\n'));
  const chemins = ['index.html', 'assets/petit.txt'];
  site.set('https://api.github.com/repos/aymenessouyah/STiV2.0/git/trees/main', arbreGithub(chemins));
  for (const p of chemins) site.set(p, FICHIERS.get(p));

  const labo = accelerer(laboratoireInstrumente(site, { echecs: { 'assets/petit.txt': 99 } }));
  labo.elements.get('stipack-btn-creer').ecouteurs.click();
  await attendre(labo.elements, () => labo.articles.some((a) => a.className === 'stipack-erreur'));

  const messages = labo.articles.map((a) => a.textContent).join('\n');
  assert.match(messages, /après 5 tentatives/, 'le nombre de tentatives est annoncé');
  assert.equal(labo.appels.filter((c) => c === 'assets/petit.txt').length, 5, 'cinq tentatives, pas une de plus');
  assert.equal(labo.telechargements.length, 0, 'aucun paquet troué');
});

test('v616 : un 404 n’est pas réessayé', async () => {
  const site = new Map();
  site.set('sw.js', Buffer.from('var VERSION_PUBLIEE = "v616";\n'));
  site.set('https://api.github.com/repos/aymenessouyah/STiV2.0/git/trees/main',
    arbreGithub(['index.html', 'assets/absent.txt']));
  site.set('index.html', FICHIERS.get('index.html'));

  const labo = accelerer(laboratoireInstrumente(site, { statut: 404 }));
  labo.elements.get('stipack-btn-creer').ecouteurs.click();
  await attendre(labo.elements, () => labo.articles.some((a) => a.className === 'stipack-erreur'));

  assert.equal(labo.appels.filter((c) => c === 'assets/absent.txt').length, 1, 'un 404 est définitif');
  assert.match(labo.articles.map((a) => a.textContent).join('\n'), /HTTP 404/);
});

test('v616 : les deux fabriques écartent les mêmes fichiers', () => {
  const script = lire('outils/stipack/construire-stipack.mjs');
  for (const prefixe of ['tests/', 'outils/', '.github/']) {
    assert.ok(script.includes(`'${prefixe}'`), 'exclusion en ligne de commande : ' + prefixe);
    assert.ok(PANNEAU.includes(`'${prefixe}'`), 'exclusion dans le panneau : ' + prefixe);
  }
  assert.match(script, /--tout|toutGarder/, 'l’ancien comportement reste accessible');
});
