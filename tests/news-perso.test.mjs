import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

/* v496 — « News de ma classe » : l'ancienne barre de news (« La Cote ») est retirée
   de l'accueil et remplacée par une ligne personnalisée placée juste après
   « Bonjour, prénom ». L'admin choisit la classe puis saisit texte 1, texte 2, …
   Couleur : bleu en 3e SI, vert en 4e SI ; fond et défilement identiques à l'ancien
   bandeau (animation cote-defile). */

const racine = resolve(new URL('..', import.meta.url).pathname);
const lire = chemin => readFileSync(resolve(racine, chemin), 'utf8');

/* ---------- mini-DOM suffisant pour exécuter assets/js/news-perso.js ---------- */
function noeud(nom) {
  const n = {
    nodeType: 1, nodeName: nom, children: [], attrs: {}, style: {}, dataset: {}, hidden: false, textContent: "",
    get firstChild() { return this.children[0] || null; },
    get childNodes() { return this.children.slice(); },
    appendChild(enfant) {
      if (enfant && enfant.__fragment) { enfant.children.slice().forEach(c => n.appendChild(c)); enfant.children.length = 0; return enfant; }
      n.children.push(enfant); enfant.parentNode = n; return enfant;
    },
    removeChild(enfant) { const i = n.children.indexOf(enfant); if (i >= 0) n.children.splice(i, 1); return enfant; },
    setAttribute(k, v) { n.attrs[k] = String(v); },
    removeAttribute(k) { delete n.attrs[k]; },
    getAttribute(k) { return k in n.attrs ? n.attrs[k] : null; },
    addEventListener() {},
    closest() { return null; },
    /* largeur simulée : 900 px de contenu → deux moitiés pour un défilement continu */
    get scrollWidth() { return 900; }
  };
  return n;
}
function domVierge(options) {
  const o = options || {};
  const doc = noeud('#document');
  doc.hidden = false;
  doc.readyState = "complete";
  doc.documentElement = noeud('html');
  doc.documentElement.classList = { contains: c => (o.classesHtml || []).includes(c) };
  doc.addEventListener = () => {};
  doc.createElement = tag => noeud(String(tag).toLowerCase());
  doc.createDocumentFragment = () => { const f = noeud('#fragment'); f.__fragment = true; return f; };
  const barre = noeud('div');
  barre.hidden = true;
  const etiq = noeud('span');
  const piste = noeud('div');
  doc.getElementById = id => ({ bandeauNewsPerso: barre, newsPersoEtiquette: etiq, newsPersoPiste: piste }[id] || null);
  return { doc, barre, etiq, piste };
}
async function executer(options) {
  const d = domVierge(options);
  const memoire = { session: {}, local: {} };
  const appels = [];
  const valeurs = options && options.valeur;
  const ctx = {
    document: d.doc,
    window: null,
    sessionStorage: {
      getItem: k => (k in memoire.session ? memoire.session[k] : null),
      setItem: (k, v) => { memoire.session[k] = String(v); },
      removeItem: k => { delete memoire.session[k]; }
    },
    localStorage: {
      getItem: k => (k in memoire.local ? memoire.local[k] : null),
      setItem: (k, v) => { memoire.local[k] = String(v); },
      removeItem: k => { delete memoire.local[k]; }
    },
    requestAnimationFrame: f => f(),
    matchMedia: () => ({ matches: false }),
    fetch: (url, opts) => {
      appels.push({ url, opts });
      if (options && options.reseauKo) return Promise.reject(new Error("réseau"));
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(valeurs === undefined ? [] : [{ value: valeurs }])
      });
    },
    setTimeout: (f) => { /* pas d'abandon dans les tests */ return 1; },
    clearTimeout: () => {},
    AbortController: function () { this.signal = {}; this.abort = () => {}; },
    console
  };
  ctx.window = ctx;
  ctx.window.STI_AUTH = { URL: "https://exemple.supabase.co", CLE: "cle-test" };
  if (options && options.classe) {
    memoire.local["sti-session-cache"] = JSON.stringify({ classe: options.classe });
  }
  if (options && options.session) {
    memoire.local["sti-session-cache"] = JSON.stringify(options.session);
    memoire.session["sti-session-cache"] = JSON.stringify(options.session);
  }
  vm.createContext(ctx);
  new vm.Script(lire('assets/js/news-perso.js'), { filename: 'news-perso.js' }).runInContext(ctx);
  /* Laisse la promesse de lecture publique se résoudre (fetch factice). */
  await new Promise(r => setImmediate(r));
  await new Promise(r => setImmediate(r));
  return { ...d, ctx, appels, memoire };
}
const textes = piste => piste.children.map(c => c.textContent);

test('v496 : l’accueil n’a plus de barre « La Cote » et porte les news de la classe', () => {
  const html = lire('index.html');
  assert.doesNotMatch(html, /id="cote-sti"/, 'la Cote est retirée de l’accueil');
  assert.doesNotMatch(html, /cote-ticker\.js/, 'son moteur n’est plus chargé');
  assert.match(html, /id="bandeauNewsPerso"/);
  assert.match(html, /id="newsPersoPiste"/);
  assert.match(html, /id="newsPersoEtiquette"/);
  assert.match(html, /assets\/js\/news-perso\.js\?v=498/);

  /* Emplacement : la ligne juste après « Bonjour, prénom ». */
  const salut = html.indexOf('id="welcomeTitle"');
  const bandeau = html.indexOf('id="bandeauNewsPerso"');
  const sousTitre = html.indexOf('class="welcome-return__subtitle"');
  assert.ok(salut > 0 && bandeau > salut, 'le bandeau suit immédiatement le salut');
  assert.ok(sousTitre > bandeau, 'le bandeau occupe la ligne après le salut');
  assert.ok(html.slice(salut, bandeau).includes("</h2>"), 'le bandeau est hors du titre');

  /* Même fond et même animation que l’ancien bandeau, couleurs par classe. */
  const css = lire('assets/css/theme.css');
  const bloc = css.slice(css.indexOf('#bandeauNewsPerso {'), css.indexOf('/* Identités vectorielles locales des cinq matières. */'));
  assert.match(bloc, /background: linear-gradient\(180deg, var\(--cote-fond-haut\), var\(--cote-fond-bas\)\)/);
  assert.match(bloc, /animation: cote-defile linear infinite/);
  assert.match(bloc, /animation: cote-bip /);
  assert.match(bloc, /--news-perso-texte: #7dd3fc/, 'bleu par défaut, donc pour la 3e SI');
  const bloc4 = bloc.slice(bloc.indexOf('#bandeauNewsPerso[data-classe="4si"]'));
  assert.match(bloc4, /--news-perso-texte: #6ee7b7/, 'vert pour la 4e SI');
});

test('v496 : le bandeau défile avec les textes de la classe de l’élève', async () => {
  const valeur = { actif: true, classes: { "3si": ["Contrôle HTML5 mardi", "Rapport de stage à rendre"], "4si": ["TP PHP jeudi"] } };

  const troisieme = await executer({ valeur });
  assert.equal(troisieme.barre.dataset.classe, "3si");
  assert.equal(troisieme.barre.hidden, false);
  assert.equal(troisieme.etiq.textContent, "3e SI");
  const items3 = textes(troisieme.piste);
  assert.ok(items3.length > 0);
  assert.ok(items3.every(t => t.startsWith("📣 ")));
  assert.ok(items3.some(t => t.includes("Contrôle HTML5 mardi")));
  assert.ok(items3.some(t => t.includes("Rapport de stage à rendre")));
  assert.ok(!items3.some(t => t.includes("TP PHP jeudi")), 'la 4e SI ne voit pas les textes des 3e');
  /* Défilement continu : la piste est dupliquée (moitié masquée aux lecteurs d’écran). */
  assert.ok(troisieme.piste.children.length > 2, 'piste dupliquée pour un défilement sans trou');
  assert.ok(troisieme.piste.children.some(c => c.attrs["aria-hidden"] === "true"));
  assert.ok(/^\d+s$/.test(troisieme.piste.style.animationDuration || ""), 'durée de défilement calculée');

  /* Élève 4e SI dont la session n'expose pas la classe : repli sur le privilège. */
  const quatrieme = await executer({ valeur, classesHtml: ["sti-4si-autorise"] });
  assert.equal(quatrieme.barre.dataset.classe, "4si");
  assert.equal(quatrieme.etiq.textContent, "4e SI");
  const items4 = textes(quatrieme.piste);
  assert.ok(items4.some(t => t.includes("TP PHP jeudi")));
  assert.ok(!items4.some(t => t.includes("Contrôle HTML5 mardi")));

  /* La classe peut aussi venir de la session quand la classe HTML n’est pas encore posée. */
  const parSession = await executer({ valeur, classe: "4SI 2" });
  assert.equal(parSession.barre.dataset.classe, "4si");
  const parSession3 = await executer({ valeur, classe: "3SI1" });
  assert.equal(parSession3.barre.dataset.classe, "3si");

  /* v497 — le privilège `sti-4si-autorise` (profs, admin, labo, GOLD) ne doit plus
     imposer les news des 4e SI, ni mélanger les deux classes. */
  const prof3 = await executer({ valeur, classe: "3SI1", classesHtml: ["sti-4si-autorise"] });
  assert.equal(prof3.barre.dataset.classe, "3si", "un prof de 3e SI voit les news des 3e SI");
  const itemsProf3 = textes(prof3.piste);
  assert.ok(itemsProf3.some(t => t.includes("Contrôle HTML5 mardi")));
  assert.ok(!itemsProf3.some(t => t.includes("TP PHP jeudi")), "aucune news des 4e SI pour un prof de 3e");

  const prof4 = await executer({ valeur, classe: "4SI 2", classesHtml: ["sti-4si-autorise"] });
  assert.equal(prof4.barre.dataset.classe, "4si");
  assert.deepEqual([...new Set(textes(prof4.piste))], ["📣 TP PHP jeudi"]);

  for (const sessionProf of [{ classe: "PROF" }, { classe: "", isAdmin: true }, { classe: "GOLD", isGold: true }, { classe: "elevelabo3" }]) {
    const enseignant = await executer({ valeur, classesHtml: ["sti-4si-autorise"], session: sessionProf });
    assert.equal(enseignant.barre.hidden, true, "compte enseignant sans classe : bandeau masqué " + JSON.stringify(sessionProf));
    assert.equal(enseignant.barre.dataset.classe, "admin");
    assert.equal(enseignant.piste.children.length, 0, "aucun texte de classe rendu pour un compte enseignant");
  }
});

test('v496 : bandeau masqué sans texte pour la classe, désactivé ou hors ligne', async () => {
  const vide = await executer({ valeur: { actif: true, classes: { "3si": [], "4si": ["Seulement les 4e"] } } });
  assert.equal(vide.barre.hidden, true, 'aucun texte pour la 3e SI → pas de bandeau');
  assert.equal(vide.piste.children.length, 0);

  const inactif = await executer({ valeur: { actif: false, classes: { "3si": ["Texte masqué"], "4si": [] } } });
  assert.equal(inactif.barre.hidden, true, 'l’interrupteur admin masque le bandeau');

  const horsLigne = await executer({ reseauKo: true, valeur: { actif: true, classes: { "3si": ["Ignoré"], "4si": [] } } });
  assert.equal(horsLigne.barre.hidden, true, 'sans réponse du serveur, rien n’est inventé');

  /* Reprise de l’ancien format { liste: [{t, c}] } : les textes restent visibles. */
  const heritage = await executer({ valeur: { actif: true, liste: [{ t: "Ancienne news", c: "#fbbf24" }] } });
  assert.equal(heritage.barre.hidden, false);
  assert.ok(textes(heritage.piste).some(t => t.includes("Ancienne news")));
  const heritage4 = await executer({ valeur: { actif: true, liste: [{ t: "Ancienne news", c: "#fbbf24" }] }, classesHtml: ["sti-4si-autorise"] });
  assert.ok(textes(heritage4.piste).some(t => t.includes("Ancienne news")), 'ancienne liste visible par les deux classes');
});

test('v496 : le tableau de bord admin choisit la classe et saisit texte 1, texte 2…', () => {
  const html = lire('admin.html');
  assert.match(html, /id="news-classe-3si"[^>]*data-classe="3si"[^>]*aria-selected="true"/);
  assert.match(html, /id="news-classe-4si"[^>]*data-classe="4si"[^>]*aria-selected="false"/);
  assert.match(html, /id="news-liste"/);
  assert.match(html, /id="news-texte"/);
  assert.match(html, /id="news-ajouter"/);
  assert.match(html, /id="news-actif"/);
  assert.match(html, /id="news-enregistrer"/);
  assert.match(html, /id="news-apercu"/, "un aperçu montre ce que reçoit la classe choisie");
  assert.match(html, /texte 1<\/strong>, <strong>texte 2/);
  assert.doesNotMatch(html, /id="news-couleur"/, 'la couleur vient de la classe, plus d’un sélecteur par message');
  assert.match(html, /News de la classe/);

  const js = lire('assets/js/admin.js');
  const bloc = js.slice(js.indexOf('/* ====================== v496 : news personnalisées par classe (accueil)'));
  assert.match(bloc, /var CLASSES = \["3si", "4si"\];/);
  assert.match(bloc, /id: "ticker_news"/, 'même ligne publique que l’ancienne régie');
  assert.match(bloc, /classes: \{ "3si": listePropre\(etat\.classes\["3si"\]\), "4si": listePropre\(etat\.classes\["4si"\]\) \}/);
  assert.match(bloc, /"class": "news-num"|news-num/, 'les lignes portent « Texte 1, Texte 2… »');
  assert.match(bloc, /classes\["3si"\] = listePropre\(o\.liste\)/, 'reprise de l’ancien format côté admin');
  assert.doesNotMatch(bloc, /hexOk|input\[type=color\]/, 'plus de couleur par message');

  /* Le bandeau du site est bien invalidé par le service worker. */
  const sw = lire('sw.js');
  assert.match(sw, /var CACHE = "sti-atelier-v386"/);
  assert.match(sw, /var UPDATE_ID = "v575-livre-accueil-20261031"/);
  assert.match(sw, /url: "\.\/assets\/js\/news-perso\.js", revision: "ruban-vert-v517"/);
  assert.match(sw, /url: "\.\/assets\/css\/theme\.css", revision: "classe-nav-v536"/);
  assert.match(sw, /url: "\.\/admin\.html", revision: "photo-secours-v562"/);
  assert.match(sw, /url: "\.\/assets\/js\/admin\.js", revision: "photo-secours-v562"/);
  const shell = sw.split('var SHELL = [')[1].split('];')[0];
  assert.ok(shell.includes('"./assets/js/news-perso.js"'), 'le moteur du bandeau est dans le shell hors-ligne');
  assert.ok(!shell.includes('"./assets/js/cote-ticker.js"'), 'l’ancien moteur ne fait plus partie du shell');
  const manifeste = JSON.parse(lire('offline-complete-manifest.json'));
  const entree = manifeste.files.find(f => f.path === 'assets/js/news-perso.js');
  assert.ok(entree, 'le moteur du bandeau est dans le cache complet');
  assert.equal(entree.bytes, Buffer.byteLength(lire('assets/js/news-perso.js')));
});

test('v517 : la 4e SI passe bien au vert, quel que soit le libellé de la classe', async () => {
  /* Les libellés réels de la base sont « 4eme SI1 », « 4eme SI2 »… L'ancienne
     lecture ne reconnaissait que « 4SI » / « 4e SI » : le ruban de « Bonjour »
     restait alors orangé (« autre ») au lieu du vert de la 4e SI. */
  for (const classe of ['4eme SI1', '4eme SI2', '4e SI', '4ème SI', '4ème année SI1', '4SI', 'Quatrième SI']) {
    const page = await executer({ classe });
    assert.equal(page.ctx.STINewsPerso.niveauRuban(), '4si', classe);
  }
  for (const classe of ['3eme SI1', '3eme SI2', '3e SI', '3ème année SI2', '3SI']) {
    const page = await executer({ classe });
    assert.equal(page.ctx.STINewsPerso.niveauRuban(), '3si', classe);
  }
  /* Le privilège 4e SI posé par acces.js sert de repli quand le libellé est illisible. */
  const sansLibelle = await executer({ session: { classe: '' }, classesHtml: ['sti-4si-autorise'] });
  assert.equal(sansLibelle.ctx.STINewsPerso.niveauRuban(), '4si');
  /* Les profs, l'admin et les comptes GOLD restent en or, jamais en vert. */
  for (const classe of ['Prof', 'Admin', 'GOLD', 'elevelabo3']) {
    const page = await executer({ classe, classesHtml: ['sti-4si-autorise'] });
    assert.equal(page.ctx.STINewsPerso.niveauRuban(), 'admin', classe);
  }
  /* Le vert du ruban est celui de la 4e SI dans le thème. */
  const css = lire('assets/css/theme.css');
  const bloc = css.slice(css.indexOf('.welcome-return__title[data-ruban="4si"]'), css.indexOf('/* Admin, professeurs, labo'));
  assert.match(bloc, /--ruban-lettre: #6ee7b7;/, 'tiret vert pour la 4e SI');
});
