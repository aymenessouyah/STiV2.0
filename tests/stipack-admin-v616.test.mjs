/*
  v616 — « Nouveau stipack » : fabriquer le paquet d'installation depuis l'admin.

  Le paquet .stipack était produit à la main, hors du dépôt : rien ne garantissait
  qu'il suive la dernière mise à jour, et il fallait un poste de développement pour
  le refabriquer. Le tableau de bord (section « Application Windows v316 — guide et
  assistance ») porte désormais le bouton : l'administrateur assemble le paquet à
  partir des fichiers du site et le télécharge.

  Ce test verrouille trois choses, sans navigateur :
    1. le moteur (assets/js/stipack.js) produit une archive ZIP réellement lisible
       — en-têtes, CRC32, compression deflate-raw, répertoire central, EOCD ;
    2. le manifeste du paquet décrit exactement les fichiers écrits, avec leur
       SHA-256, et empreintes.txt le confirme (contrôle « sha256sum -c ») ;
    3. le panneau admin, le service worker et le manifeste hors ligne sont branchés.
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
const MANIFESTE_HORS_LIGNE = JSON.parse(lire('offline-complete-manifest.json'));

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
    /* Le panneau lit les tailles dans le manifeste hors ligne : on fait de même,
       sauf quand le test veut justement éprouver l’absence de taille connue. */
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

  /* Le contenu relu est identique à la source, octet pour octet. */
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
  assert.equal(manifeste.fabriqueLe, '2026-11-02T10:00:00+01:00');
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
  assert.equal(resultat.manifeste.exclus.length, 1);
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

/* ── branchement dans l'admin ────────────────────────────────────────────── */

test('v616 : le guide Windows du tableau de bord porte le bouton « Nouveau stipack »', () => {
  const section = ADMIN.slice(ADMIN.indexOf('id="aide-windows-v316"'));
  const bloc = section.slice(0, section.indexOf('</section>'));

  assert.match(bloc, /id="bloc-stipack"/, 'le bloc de fabrication est dans la section Windows');
  assert.match(bloc, /<h3>🧱 Nouveau stipack<\/h3>/);
  for (const id of [
    'stipack-volume', 'stipack-seuil', 'stipack-btn-creer', 'stipack-btn-annuler',
    'stipack-btn-telecharger', 'stipack-progression', 'stipack-barre-remplissage',
    'stipack-etat', 'stipack-meta-fichiers', 'stipack-meta-poids', 'stipack-journal', 'stipack-dernier'
  ]) {
    assert.match(bloc, new RegExp('id="' + id + '"'), 'élément présent : ' + id);
  }
  assert.match(bloc, /<option value="complet" selected>/, 'le paquet complet est proposé par défaut');
  assert.match(bloc, /<option value="leger">/, 'le paquet allégé est proposé');

  /* Les deux modules sont chargés, le moteur avant le panneau. */
  assert.match(ADMIN, /<script src="assets\/js\/stipack\.js\?v=616" defer><\/script>/);
  assert.match(ADMIN, /<script src="assets\/js\/admin-stipack\.js\?v=616" defer><\/script>/);
  assert.ok(
    ADMIN.indexOf('stipack.js?v=616') < ADMIN.indexOf('admin-stipack.js?v=616'),
    'le moteur est chargé avant le panneau'
  );
});

test('v616 : le panneau fabrique depuis la liste hors ligne et propose le téléchargement', () => {
  assert.match(PANNEAU, /MANIFESTE_HORS_LIGNE/);
  assert.match(PANNEAU, /construirePaquet\(/);
  assert.match(PANNEAU, /telecharger\(/, 'le paquet est proposé au téléchargement');
  assert.match(PANNEAU, /ecrivainFichier\(/, 'écriture directe quand le navigateur le permet');
  assert.match(PANNEAU, /ecrivainMemoire\(/, 'repli en mémoire sinon');
  assert.match(PANNEAU, /localStorage/, 'le dernier paquet fabriqué est mémorisé');
  assert.match(PANNEAU, /AbortController|abort/, 'la fabrication est annulable');
  assert.doesNotMatch(PANNEAU, /\bimport\b|\brequire\(/, 'module autonome, sans dépendance');
});

test('v616 : service worker et manifeste hors ligne connaissent les nouveaux fichiers', () => {
  for (const fichier of ['assets/js/stipack.js', 'assets/js/admin-stipack.js']) {
    assert.ok(
      MANIFESTE_HORS_LIGNE.files.some((f) => f.path === fichier),
      'paquet hors ligne : ' + fichier
    );
  }
  /* Ce sont des fichiers NEUFS : rien de périmé à remplacer dans le cache, donc
     pas d’entrée dans le delta (borne de 280), comme capsules-vedettes.css en v556.
     Ils sont mis en cache à la première visite de l’admin par la branche
     « Scripts / Styles » du service worker. */
  const delta = SW.slice(SW.indexOf('var UPDATE_FILES'), SW.indexOf('];', SW.indexOf('var UPDATE_FILES')));
  assert.ok(
    (delta.match(/\{ url:/g) || []).length <= 280,
    'le delta reste sous la borne de 280 entrées'
  );
  assert.ok(SW.includes('{ url: "./admin.html", revision: "stipack-admin-v616" }'), 'la page admin est réactualisée');
  assert.ok(SW.includes('{ url: "./offline-complete-manifest.json", revision: "stipack-admin-v616" }'), 'le manifeste est réactualisé');
  assert.match(SW, /var VERSION_PUBLIEE = "v616";/, 'la publication avance');
  assert.match(SW, /Historique lots : v616-stipack-admin-20261102,/);
  assert.match(SW, /var CACHE = "sti-atelier-v386"/, 'le nom de cache ne bouge pas');
  assert.match(SW, /var UPDATE_ID = "v582-journal-connexions"/, 'l’identifiant de delta ne bouge pas');

  /* Cohérence générale du manifeste après l'ajout. */
  assert.equal(MANIFESTE_HORS_LIGNE.totalFiles, MANIFESTE_HORS_LIGNE.files.length);
  assert.equal(
    MANIFESTE_HORS_LIGNE.totalBytes,
    MANIFESTE_HORS_LIGNE.files.reduce((total, f) => total + f.bytes, 0)
  );
  for (const fichier of ['assets/js/stipack.js', 'assets/js/admin-stipack.js', 'admin.html']) {
    const entree = MANIFESTE_HORS_LIGNE.files.find((f) => f.path === fichier);
    const donnees = readFileSync(join(root, fichier));
    assert.equal(entree.bytes, donnees.length, 'taille à jour : ' + fichier);
    assert.equal(
      entree.gitSha,
      createHash('sha1').update(`blob ${donnees.length}\0`).update(donnees).digest('hex'),
      'empreinte à jour : ' + fichier
    );
  }
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

function laboratoire(site) {
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

  const fetch = async (chemin) => {
    const propre = String(chemin).split('?')[0];
    const donnees = site.get(propre);
    if (!donnees) return { ok: false, status: 404, arrayBuffer: async () => { throw new Error('404'); }, text: async () => '', json: async () => { throw new Error('404'); } };
    return {
      ok: true,
      status: 200,
      arrayBuffer: async () => donnees.buffer.slice(donnees.byteOffset, donnees.byteOffset + donnees.length),
      text: async () => donnees.toString('utf8'),
      json: async () => JSON.parse(donnees.toString('utf8'))
    };
  };

  new Function('window', 'globalThis', MOTEUR)(fenetre, fenetre);
  new Function('window', 'document', 'fetch', 'URL', 'localStorage', 'AbortController', 'setTimeout', PANNEAU)(
    fenetre, document, fetch, fenetre.URL, fenetre.localStorage, AbortController, setTimeout
  );

  return { fenetre, elements, articles, telechargements, stockage };
}

test('v616 : un clic sur « Créer le paquet » fabrique l’archive et la propose au téléchargement', async () => {
  const site = new Map();
  site.set('offline-complete-manifest.json', Buffer.from(JSON.stringify({
    version: 'v616-essai',
    generatedAt: '2026-11-02T10:00:00Z',
    files: [
      { path: 'index.html', bytes: FICHIERS.get('index.html').length },
      { path: 'assets/petit.txt', bytes: FICHIERS.get('assets/petit.txt').length },
      { path: 'cours/css/media.gif', bytes: FICHIERS.get('cours/css/media.gif').length }
    ]
  })));
  site.set('sw.js', Buffer.from('var UPDATE_ID = "v616-parcours";\n'));
  site.set('index.html', FICHIERS.get('index.html'));
  site.set('assets/petit.txt', FICHIERS.get('assets/petit.txt'));
  site.set('cours/css/media.gif', FICHIERS.get('cours/css/media.gif'));

  const labo = laboratoire(site);
  const creer = labo.elements.get('stipack-btn-creer');
  const telecharger = labo.elements.get('stipack-btn-telecharger');

  assert.ok(creer && typeof creer.ecouteurs.click === 'function', 'le bouton écoute le clic');

  creer.ecouteurs.click();

  /* La fabrication est asynchrone : on attend le journal de réussite. */
  for (let i = 0; i < 200 && !labo.articles.some((a) => a.className === 'stipack-ok'); i++) {
    await new Promise((r) => setTimeout(r, 10));
  }

  assert.ok(labo.articles.some((a) => a.className === 'stipack-ok'), 'fabrication terminée sans erreur');
  assert.ok(
    !labo.articles.some((a) => a.className === 'stipack-erreur'),
    'aucune erreur : ' + labo.articles.filter((a) => a.className === 'stipack-erreur').map((a) => a.textContent).join(' | ')
  );

  assert.equal(labo.telechargements.length, 1, 'le paquet est proposé au téléchargement');
  assert.equal(telecharger.hidden, false, 'le bouton de téléchargement devient visible');
  assert.match(telecharger.download, /^STI-Labo3-Plateforme-\d{8}-\d{4}\.stipack$/);

  /* L’archive téléchargée est bien un paquet complet et vérifiable. */
  const octets = Buffer.from(await labo.telechargements[0].blob.arrayBuffer());
  const entrees = lireArchive(octets);
  const manifeste = JSON.parse(entrees.find((e) => e.nom === 'stipack.json').donnees.toString('utf8'));
  assert.equal(manifeste.fichiers.length, 3);
  assert.equal(manifeste.version.updateId, 'v616-parcours', 'la version du site est inscrite au paquet');

  const dernier = JSON.parse(labo.stockage.get('sti-stipack-dernier'));
  assert.equal(dernier.fichiers, 3);
  assert.match(labo.elements.get('stipack-dernier').textContent, /Dernier paquet fabriqué/);
});

test('v616 : un fichier manquant laisse un message clair et aucun paquet', async () => {
  const site = new Map();
  site.set('offline-complete-manifest.json', Buffer.from(JSON.stringify({
    version: 'v616-essai',
    files: [{ path: 'index.html', bytes: 10 }, { path: 'disparu.html', bytes: 10 }]
  })));
  site.set('sw.js', Buffer.from('var UPDATE_ID = "v616";\n'));
  site.set('index.html', Buffer.from('abc'));

  const labo = laboratoire(site);
  labo.elements.get('stipack-btn-creer').ecouteurs.click();

  for (let i = 0; i < 200 && !labo.articles.some((a) => a.className === 'stipack-erreur'); i++) {
    await new Promise((r) => setTimeout(r, 10));
  }

  assert.ok(labo.articles.some((a) => a.className === 'stipack-erreur'), 'l’échec est signalé');
  assert.ok(
    labo.articles.some((a) => /disparu\.html/.test(a.textContent)),
    'le fichier fautif est nommé'
  );
  assert.equal(labo.telechargements.length, 0, 'aucun paquet incomplet n’est proposé');
  assert.equal(labo.elements.get('stipack-btn-telecharger').hidden, true);
});
