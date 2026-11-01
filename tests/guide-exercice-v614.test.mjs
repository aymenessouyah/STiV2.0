/* v614 — « GUIDE EXERCICE »
   ───────────────────────────────────────────────────────────────────────────
   Demande du professeur : « créer une partie du tableau de bord nommée guide
   exercice : l'admin peut choisir d'afficher ou non les corrections ainsi les
   vidéos de chaque exercice. »

   Ces tests exécutent réellement le module élève (assets/js/guide-exercice.js)
   sur de faux documents, et vérifient le contrat avec l'administration :
     • défaut = tout visible (on ne cache jamais un corrigé par accident) ;
     • une exception par exercice l'emporte sur le défaut ;
     • corrections et vidéos se commandent séparément ;
     • un réglage absent ou un réseau muet n'efface rien ;
     • le cache de 10 minutes évite une requête par page ;
     • les 72 pages d'exercices chargent bien le module ;
     • l'admin écrit le réglage au bon endroit (app_config_public / guide_exercice).
*/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import vm from 'node:vm';

const racine = resolve(new URL('..', import.meta.url).pathname);
const lire = (chemin) => readFileSync(join(racine, chemin), 'utf8');
const module = lire('assets/js/guide-exercice.js');
const admin = lire('assets/js/admin.js');
const adminHtml = lire('admin.html');
const sw = lire('sw.js');

/* Faux document minimal : suffisamment fidèle pour querySelectorAll, hidden,
   style et getElementById (le module n'utilise que cela). */
function fauxDocument(elements, chemin) {
  const noeuds = [];
  const doc = {
    readyState: 'complete',
    body: { children: [], appendChild(n) { this.children.push(n); noeuds.push(n); } },
    documentElement: {},
    getElementById: () => null,
    createElement: (tag) => {
      const el = {
        tagName: tag.toUpperCase(), style: {}, children: [], attributes: {},
        setAttribute(k, v) { this.attributes[k] = String(v); },
        getAttribute(k) { return this.attributes[k] ?? null; },
        appendChild(c) { this.children.push(c); },
        textContent: '',
        addEventListener() {}
      };
      noeuds.push(el);
      return el;
    },
    querySelectorAll(sel) {
      /* Sous-ensemble de sélecteurs utilisé par le module. */
      /* Le module utilise des sélecteurs CSS avec le drapeau « i » :
         [id*='correction' i] — on l'accepte ici, comme les navigateurs. */
      const m = /^\[([a-z-]+)([*^$]?=['"]?([^\]'"]*)['"]?)?(?:\s+i)?\]$/i.exec(sel);
      if (!m) return [];
      return elements.filter((el) => {
        if (el.tagName && m[1].toLowerCase() === 'video') return el.tagName === 'VIDEO';
        const cle = m[1];
        if (!m[2]) return el.attributes && cle in el.attributes;
        const valeur = String(el.attributes[cle] || '').toLowerCase();
        const attendu = String(m[3] || '').toLowerCase();
        if (m[2].startsWith('*')) return valeur.indexOf(attendu) !== -1;
        if (m[2].startsWith('^')) return valeur.startsWith(attendu);
        if (m[2].startsWith('$')) return valeur.endsWith(attendu);
        return valeur === attendu;
      });
    }
  };
  return doc;
}

function element(attrs = {}) {
  const el = {
    tagName: (attrs.tagName || 'DIV').toUpperCase(),
    attributes: Object.fromEntries(Object.entries(attrs).filter(([k]) => k !== 'tagName')),
    style: {}, offsetParent: {},
    setAttribute(k, v) { this.attributes[k] = String(v); },
    getAttribute(k) { return this.attributes[k] ?? null; },
    contains(autre) { return this._enfants ? this._enfants.includes(autre) : false; }
  };
  return el;
}

function chargerModule({ elements = [], chemin = '/exercices/sql/atelier.html', config = null, fetchKo = false, cache = null } = {}) {
  const stockage = new Map();
  if (cache) stockage.set('sti-guide-exercice-v1', JSON.stringify(cache));
  const doc = fauxDocument(elements);
  const appels = [];
  const contexte = {
    document: doc,
    location: { pathname: chemin },
    localStorage: {
      getItem: (k) => (stockage.has(k) ? stockage.get(k) : null),
      setItem: (k, v) => stockage.set(k, String(v)),
      removeItem: (k) => stockage.delete(k)
    },
    STI_AUTH: { URL: 'https://exemple.supabase.co', CLE: 'sb_publishable_test' },
    fetch: (url) => {
      appels.push(url);
      if (fetchKo) return Promise.reject(new Error('réseau muet'));
      return Promise.resolve({ ok: true, json: () => Promise.resolve([{ value: config }]) });
    },
    console
  };
  contexte.window = contexte;
  vm.createContext(contexte);
  vm.runInContext(module, contexte);
  return { api: contexte.STIGuideExercice, doc, appels, contexte,
           texte: () => doc.body.children.map((c) => c.textContent).join(' ') };
}

/* Laisse se résoudre les promesses du module. */
const laisser = () => new Promise((r) => setTimeout(r, 5));

test('v614 — par défaut, rien n’est masqué (on ne cache jamais un corrigé par accident)', () => {
  const api = chargerModule().api;
  assert.equal(api.normaliser(null).corrections, true);
  assert.equal(api.normaliser(null).videos, true);
  assert.equal(api.normaliser({}).corrections, true);
  assert.equal(api.normaliser('n’importe quoi').videos, true);
});

test('v614 — corrections et vidéos se commandent séparément', () => {
  const api = chargerModule().api;
  const uneCorrection = element({ id: 'correction-exercice-1' });
  const uneVideo = element({ tagName: 'VIDEO' });
  const reg = { corrections: false, videos: true };

  const doc = fauxDocument([uneCorrection, uneVideo]);
  const contexte = { document: doc, location: { pathname: '/exercices/sql/x.html' } };
  contexte.window = contexte;
  vm.createContext(contexte);
  vm.runInContext(module, contexte);
  contexte.STIGuideExercice.appliquer(reg);

  assert.equal(uneCorrection.attributes.hidden, 'hidden', 'la correction est masquée');
  assert.equal(uneCorrection.style.display, 'none');
  assert.equal(uneVideo.attributes.hidden, undefined, 'la vidéo reste visible');
});

test('v614 — une exception par exercice l’emporte sur le défaut', () => {
  const api = chargerModule().api;
  const base = { corrections: false, videos: false,
                 parExercice: { 'exercices/sql/atelier-3.html': { corrections: true } } };

  const atelier3 = api.configEffectif('exercices/sql/atelier-3.html', base);
  assert.deepEqual({ ...atelier3 }, { corrections: true, videos: false, exception: true });

  const autre = api.configEffectif('exercices/sql/atelier-1.html', base);
  assert.deepEqual({ ...autre }, { corrections: false, videos: false, exception: false });

  /* Tolérance sur la forme du chemin (avec ou sans « ./ »). */
  const variante = api.configEffectif('./exercices/sql/atelier-3.html', base);
  assert.equal(variante.corrections, true);
});

test('v614 — le réglage se lit dans la base et reste 10 minutes en cache', async () => {
  const config = { corrections: false, videos: true, parExercice: {}, maj: '2026-11-01T20:00:00Z' };
  const premier = chargerModule({ config });
  await laisser();
  assert.equal(premier.appels.length, 1, 'une requête au premier chargement');
  assert.match(premier.appels[0], /app_config_public\?select=value&id=eq\.guide_exercice/,
    'le réglage est public, sans compte');

  /* Deuxième page : le cache suffit, aucune requête. */
  const cache = JSON.parse(premier.contexte.localStorage.getItem('sti-guide-exercice-v1'));
  const second = chargerModule({ cache, config: { corrections: true } });
  await laisser();
  assert.equal(second.appels.length, 0, 'pas de requête dans les 10 minutes');
  assert.equal(second.api.configEffectif('exercices/php/x.html').corrections, false,
    'le cache porte bien le réglage');
});

test('v614 — un réseau muet ne cache rien : la page reste complète', async () => {
  const correction = element({ class: 'bloc-correction' });
  const video = element({ tagName: 'VIDEO' });
  const { api, texte } = chargerModule({ elements: [correction, video], fetchKo: true });
  await laisser();
  assert.equal(correction.attributes.hidden, undefined, 'aucun masquage sans réglage sûr');
  assert.equal(video.attributes.hidden, undefined);
  assert.equal(texte().indexOf('masquées par le professeur'), -1, 'aucun bandeau inutile');
});

test('v614 — quand une correction est masquée, l’élève est prévenu', () => {
  const correction = element({ id: 'corrige-exercice' });
  const doc = fauxDocument([correction]);
  const contexte = { document: doc, location: { pathname: '/exercices/html-css/tp1.html' } };
  contexte.window = contexte;
  vm.createContext(contexte);
  vm.runInContext(module, contexte);
  contexte.STIGuideExercice.appliquer({ corrections: false, videos: true });

  const bandeau = doc.body.children.find((c) => c.id === 'sti-guide-bandeau');
  assert.ok(bandeau, 'un bandeau discret explique le masquage');
  assert.match(bandeau.textContent, /corrections/);
  assert.doesNotMatch(bandeau.textContent, /vidéos/, 'on ne parle que de ce qui est masqué');
});

test('v614 — les 72 pages d’exercices chargent le module', () => {
  const pages = [];
  (function parcourir(dir) {
    for (const nom of readdirSync(dir)) {
      const chemin = join(dir, nom);
      if (statSync(chemin).isDirectory()) parcourir(chemin);
      else if (nom.endsWith('.html')) pages.push(chemin);
    }
  })(join(racine, 'exercices'));
  assert.equal(pages.length, 72, 'le catalogue couvre les 72 pages');
  const sans = pages.filter((p) => !readFileSync(p, 'utf8').includes('guide-exercice.js?v=614'));
  assert.deepEqual(sans, [], 'chaque page d’exercice charge le module');
});

test('v614 — le catalogue décrit les exercices, sans invention', () => {
  const j = JSON.parse(lire('assets/guide-exercice-catalogue.json'));
  assert.equal(j.pages.length, 72);
  const correction = j.pages.filter((p) => p.correction).length;
  const video = j.pages.filter((p) => p.video).length;
  assert.ok(correction >= 60, 'les corrections sont bien repérées (' + correction + ')');
  assert.ok(video >= 30, 'les vidéos sont bien repérées (' + video + ')');
  assert.ok(j.pages.every((p) => p.chemin.startsWith('exercices/') && p.titre), 'chemin et titre pour chacun');
  /* Aucun doublon de chemin. */
  assert.equal(new Set(j.pages.map((p) => p.chemin)).size, j.pages.length);
});

test('v614 — le tableau de bord a sa partie « Guide exercice »', () => {
  assert.match(adminHtml, /data-sec-cible="bloc-sec-guide-exercice">📘 Guide exercice</);
  assert.match(adminHtml, /<section class="carte-section-admin sec-repliee" id="bloc-sec-guide-exercice"/);
  assert.match(adminHtml, /<h2 style="margin:0" id="titre-sec-guide-exercice">📘 Guide exercice/);
  assert.match(adminHtml, /id="guide-defaut-corrections"/);
  assert.match(adminHtml, /id="guide-defaut-videos"/);
  assert.match(adminHtml, /id="guide-liste"/);
  assert.match(adminHtml, /id="guide-enregistrer"/);
  assert.match(adminHtml, /id="guide-tout-afficher"/);
  assert.match(adminHtml, /id="guide-tout-masquer"/);
  /* La section est pilotée par les onglets et appartient au groupe Scolarité. */
  assert.match(adminHtml, /var toutes = \[[^\]]*"bloc-sec-guide-exercice"/);
  assert.match(adminHtml, /"grp-scolarite": \["bloc-sec-quiz", "bloc-sec-guide-exercice", "bloc-sec-messages"\]/);
  assert.match(adminHtml, /if \(secId === "bloc-sec-guide-exercice" && typeof window\.__stiMonterGuideExercice === "function"\)/);
});

test('v614 — l’administration écrit le réglage là où les élèves le lisent', () => {
  assert.match(admin, /var GUIDE_ID_CONFIG = "guide_exercice";/);
  assert.match(admin, /sb\.from\("app_config_public"\)\.select\("value,updated_at"\)\.eq\("id", GUIDE_ID_CONFIG\)/);
  assert.match(admin, /sb\.from\("app_config_public"\)\.upsert\(\{\s*id: GUIDE_ID_CONFIG,\s*value: c,\s*updated_at: c\.maj\s*\}\)/);
  /* La règle « exception sinon défaut » est la même des deux côtés. */
  assert.match(admin, /function guideEffectifPour\(chemin\)/);
  assert.match(module, /function configEffectif\(chemin, base\)/);
  /* Une exception identique au défaut est retirée, pour ne pas accumuler de bruit. */
  assert.match(admin, /if \(ex\.corrections === r\.corrections && ex\.videos === r\.videos\) delete r\.parExercice\[p\.chemin\];/);
});

test('v614 — publication : version, cache-busters, révisions et hors-ligne', () => {
  assert.match(sw, /var VERSION_PUBLIEE = "v614";/);
  assert.match(sw, /v614-guide-exercice-20261101/);
  assert.match(adminHtml, /assets\/js\/admin\.js\?v=614-perf/);
  assert.ok(sw.includes('{ url: "./assets/js/guide-exercice.js", revision: "guide-exercice-v614" }'));
  assert.ok(sw.includes('{ url: "./admin.html", revision: "guide-exercice-v614" }'));
  assert.ok(sw.includes('{ url: "./assets/js/admin.js", revision: "guide-exercice-v614" }'));
  assert.ok(sw.includes('"./assets/js/guide-exercice.js"'), 'le module est livré hors ligne');
  assert.ok(sw.includes('"./assets/guide-exercice-catalogue.json"'), 'le catalogue aussi');
  assert.match(sw, /var CACHE = "sti-atelier-v386"/);
  assert.match(sw, /var UPDATE_ID = "v582-journal-connexions"/);
});
