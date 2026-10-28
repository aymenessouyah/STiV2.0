import { test, expect } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

const racine = resolve(new URL('..', import.meta.url).pathname);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json' };

/* Serveur local instrumenté : les octets ici sont les corps servis sans
   compression, pas une mesure prédictive du trafic GitHub Pages. */
async function servir(hote = '127.0.0.1') {
  const sourceSw = await readFile(resolve(racine, 'sw.js'), 'utf8');
  const version = Number(sourceSw.match(/var CACHE = "sti-atelier-v(\d+)"/)[1]);
  const nouveauSw = sourceSw
    .replace(`var CACHE = "sti-atelier-v${version}"`, `var CACHE = "sti-atelier-v${version + 1}"`)
    .replace(/(url: "\.\/assets\/js\/app\.js", revision: ")[^"]+/, '$1essai-reconnexion-suivante');
  let nouvelleVersion = false, panneApplication = false;
  const journal = [];
  const server = createServer(async (req, res) => {
    try {
      const u = new URL(req.url, 'http://test.invalid');
      let body;
      if (u.pathname === '/fixture.html') {
        body = Buffer.from(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Essai réseau</title>
          <script src="/assets/js/config.js"></script></head><body>
          <script>window.__swPret = navigator.serviceWorker.register('/sw.js', {updateViaCache:'none'}).then(function () { return navigator.serviceWorker.ready; });</script>
          </body></html>`);
      } else if (u.pathname === '/sw.js') {
        body = Buffer.from(nouvelleVersion ? nouveauSw : sourceSw);
      } else {
        const chemin = resolve(racine, '.' + decodeURIComponent(u.pathname));
        if (!chemin.startsWith(racine + sep) || !(await stat(chemin)).isFile()) throw new Error('404');
        body = await readFile(chemin);
      }
      const statut = u.pathname === '/assets/js/app.js' && panneApplication ? 503 : 200;
      if (statut === 503) body = Buffer.from('panne temporaire');
      journal.push({ chemin: u.pathname, recherche: u.search, statut, octets: body.length });
      res.writeHead(statut, { 'Content-Type': types[extname(u.pathname)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'Content-Length': body.length });
      res.end(body);
    } catch (e) { res.writeHead(404).end('Introuvable'); }
  });
  await new Promise(resolve => server.listen(0, hote, resolve));
  return { base: `http://${hote}:${server.address().port}`, journal, version,
    deployer() { nouvelleVersion = true; }, definirPanne(valeur) { panneApplication = valeur; },
    fermer() { return new Promise(resolve => server.close(resolve)); } };
}

test('retour Internet : vérification légère, delta ciblé et conservation des médias', async ({ browser }) => {
  const serveur = await servir(), ctx = await browser.newContext();
  try {
    const page = await ctx.newPage();
    let chargements = 0; page.on('domcontentloaded', () => { chargements++; });
    await page.goto(serveur.base + '/fixture.html');
    await page.evaluate(() => window.__swPret);
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    // Attendre le chargeur historique de la barre et ses petits modules différés.
    await expect.poll(() => page.evaluate(() => Boolean(window.__STI_ROUE_NUAGE))).toBe(true);
    await page.evaluate(async v => {
      const cache = await caches.open('sti-atelier-v' + v);
      await cache.put('/assets/js/app.js', new Response('ancienne application'));
      await cache.put('/assets/js/inchange.js', new Response('inchangé'));
      await (await caches.open('sti-videos-labo-v1')).put('/assets/videos/exemple.mp4', new Response('vidéo locale'));
    }, serveur.version);
    await page.waitForTimeout(800);
    const avant = serveur.journal.length, pagesAvant = chargements;
    await ctx.setOffline(true);
    await expect.poll(() => page.evaluate(() => navigator.onLine)).toBe(false);
    await ctx.setOffline(false);
    await expect.poll(() => page.evaluate(() => navigator.onLine)).toBe(true);
    await expect.poll(() => serveur.journal.slice(avant).filter(r => r.chemin === '/sw.js').length, { timeout: 8000 }).toBeGreaterThan(0);
    await page.waitForTimeout(800);
    const sansChangement = serveur.journal.slice(avant);
    expect(sansChangement.every(r => r.chemin === '/sw.js')).toBe(true);
    expect(chargements).toBe(pagesAvant);

    // Un seul fichier change dans la prochaine version simulée.
    serveur.deployer();
    const avantMaj = serveur.journal.length;
    await ctx.setOffline(true);
    await expect.poll(() => page.evaluate(() => navigator.onLine)).toBe(false);
    await ctx.setOffline(false);
    await expect.poll(() => page.evaluate(async v => Boolean(await (await caches.open('sti-atelier-v' + (v + 1))).match('/assets/js/app.js')), serveur.version), { timeout: 15000 }).toBe(true);
    await expect.poll(() => page.evaluate(async v => !(await caches.keys()).includes('sti-atelier-v' + v), serveur.version), { timeout: 15000 }).toBe(true);
    await page.waitForTimeout(800);
    const delta = serveur.journal.slice(avantMaj);
    expect(delta.filter(r => r.chemin === '/assets/js/app.js')).toHaveLength(1);
    expect(delta.every(r => ['/sw.js', '/assets/js/app.js'].includes(r.chemin))).toBe(true);
    expect(await page.evaluate(async v => ({
      inchange: await (await (await caches.open('sti-atelier-v' + (v + 1))).match('/assets/js/inchange.js')).text(),
      video: await (await (await caches.open('sti-videos-labo-v1')).match('/assets/videos/exemple.mp4')).text()
    }), serveur.version)).toEqual({ inchange: 'inchangé', video: 'vidéo locale' });
    expect(chargements).toBe(pagesAvant);
    console.log('Reconnexion sans changement :', JSON.stringify(sansChangement));
    console.log('Reconnexion avec un fichier modifié :', JSON.stringify(delta));
  } finally { await ctx.close(); await serveur.fermer(); }
});

test('une panne du fichier modifié conserve la copie hors ligne puis la retente à la connexion suivante', async ({ browser }) => {
  const serveur = await servir(), ctx = await browser.newContext();
  try {
    const page = await ctx.newPage();
    await page.goto(serveur.base + '/fixture.html');
    await page.evaluate(() => window.__swPret);
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    await expect.poll(() => page.evaluate(() => Boolean(window.__STI_ROUE_NUAGE))).toBe(true);
    await page.evaluate(async v => {
      await (await caches.open('sti-atelier-v' + v)).put('/assets/js/app.js?v=ancien', new Response('application hors ligne'));
      await (await caches.open('sti-videos-labo-v1')).put('/assets/videos/exemple.mp4', new Response('vidéo locale'));
    }, serveur.version);
    serveur.deployer(); serveur.definirPanne(true);
    await ctx.setOffline(true);
    await expect.poll(() => page.evaluate(() => navigator.onLine)).toBe(false);
    await ctx.setOffline(false);
    await expect.poll(() => serveur.journal.filter(r => r.chemin === '/assets/js/app.js' && r.statut === 503).length, { timeout: 15000 }).toBe(1);
    await expect.poll(() => page.evaluate(async v => !(await caches.keys()).includes('sti-atelier-v' + v), serveur.version), { timeout: 15000 }).toBe(true);
    expect(await page.evaluate(async v => (await (await (await caches.open('sti-atelier-v' + (v + 1))).match('/assets/js/app.js', { ignoreSearch: true })).text()), serveur.version)).toBe('application hors ligne');
    const marque = await page.evaluate(async () => {
      const rev = await caches.open('sti-update-revisions-v1');
      return Boolean(await rev.match('/__sti_revision__/' + encodeURIComponent('./assets/js/app.js') + '?rev=essai-reconnexion-suivante'));
    });
    expect(marque).toBe(false);
    serveur.definirPanne(false);
    const avant = serveur.journal.length;
    await ctx.setOffline(true);
    await expect.poll(() => page.evaluate(() => navigator.onLine)).toBe(false);
    await ctx.setOffline(false);
    await expect.poll(() => serveur.journal.slice(avant).filter(r => r.chemin === '/assets/js/app.js' && r.statut === 200).length, { timeout: 15000 }).toBe(1);
    await expect.poll(() => page.evaluate(async v => (await (await (await caches.open('sti-atelier-v' + (v + 1))).match('/assets/js/app.js', { ignoreSearch: true }))?.text()), serveur.version)).toContain('rendreAccueilPersonnalise');
    expect(await page.evaluate(async () => (await (await (await caches.open('sti-videos-labo-v1')).match('/assets/videos/exemple.mp4')).text()))).toBe('vidéo locale');
    expect(serveur.journal.slice(avant).every(r => ['/sw.js', '/assets/js/app.js'].includes(r.chemin))).toBe(true);
    console.log('Après panne, reprise du seul fichier modifié :', JSON.stringify(serveur.journal.slice(avant)));
  } finally { await ctx.close(); await serveur.fermer(); }
});

/* La page réelle charge aussi acces.js, dont le comportement historique peut
   différer de la page de test minimale ci-dessus. Une installation préexistante
   n'a pas nécessairement conservé le marqueur de rechargement. */
test('accueil réel : une nouvelle version à la reconnexion ne doit pas recharger la page', async ({ browser }) => {
  const serveur = await servir('127.0.0.2'), ctx = await browser.newContext();
  try {
    await ctx.route('https://**', route => route.abort());
    const preparation = await ctx.newPage();
    await preparation.goto(serveur.base + '/fixture.html');
    await preparation.evaluate(() => window.__swPret);
    await expect.poll(() => preparation.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    await preparation.evaluate(v => {
      localStorage.setItem('sti-version-installee', String(v));
      localStorage.setItem('sti-precache-ver', String(v));
      localStorage.removeItem('sti-sw-reload-ver');
    }, serveur.version);
    await preparation.close();

    const page = await ctx.newPage();
    await page.addInitScript(() => {
      try {
        const s = { nativeAuthenticated: true, statut: 'actif', email: 'eleve-test@example.invalid', role: 'eleve', classe: '4SI 1' };
        window.__STI_NATIVE_AUTHENTICATED_V316 = true;
        sessionStorage.setItem('sti-native-session-v316', '1');
        sessionStorage.setItem('sti-session-cache', JSON.stringify(s));
        localStorage.setItem('sti-session-cache', JSON.stringify(s));
      } catch (e) {}
    });
    let chargements = 0, changements = 0;
    page.on('domcontentloaded', () => { chargements++; });
    await page.exposeBinding('__noterChangementControle', () => { changements++; });
    await page.goto(serveur.base + '/index.html', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => navigator.serviceWorker.addEventListener('controllerchange', () => window.__noterChangementControle()));
    await expect(page.locator('#videosGrid')).toBeVisible();
    await expect.poll(() => page.evaluate(() => Boolean(window.__STI_ROUE_NUAGE))).toBe(true);
    await page.waitForTimeout(1200);
    expect(await page.evaluate(() => ({
      session: sessionStorage.getItem('sti-sw-reload-ver'), local: localStorage.getItem('sti-sw-reload-ver')
    }))).toEqual({ session: null, local: null });
    const pagesAvant = chargements, requetesAvant = serveur.journal.length;
    serveur.deployer();
    await ctx.setOffline(true);
    await expect.poll(() => page.evaluate(() => navigator.onLine)).toBe(false);
    await ctx.setOffline(false);
    await expect.poll(() => page.evaluate(async v => (await caches.keys()).includes('sti-atelier-v' + (v + 1)), serveur.version), { timeout: 15000 }).toBe(true);
    await expect.poll(() => changements, { timeout: 30000 }).toBeGreaterThan(0);
    await page.waitForTimeout(1500);
    const nouvellesRequetes = serveur.journal.slice(requetesAvant);
    console.log('Accueil réel : changements de contrôle et chargements avant/après reconnexion =', changements, pagesAvant, chargements);
    console.log('Accueil réel : requêtes et octets non compressés après reconnexion =', JSON.stringify(nouvellesRequetes));
    expect(chargements).toBe(pagesAvant);
  } finally { await ctx.close(); await serveur.fermer(); }
});

test('premier déploiement : un ancien onglet non compatible diffère l’activation sans rechargement', async ({ browser }) => {
  const serveur = await servir('127.0.0.2'), ctx = await browser.newContext();
  try {
    await ctx.route('https://**', route => route.abort());
    const preparation = await ctx.newPage(); await preparation.goto(serveur.base + '/fixture.html');
    await preparation.evaluate(() => window.__swPret);
    await expect.poll(() => preparation.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    await preparation.evaluate(v => {
      localStorage.setItem('sti-version-installee', String(v));
      localStorage.setItem('sti-precache-ver', String(v));
      localStorage.removeItem('sti-sw-reload-ver');
    }, serveur.version);
    await preparation.close();
    const ancien = await ctx.newPage();
    await ancien.addInitScript(() => {
      // Reproduit un client d'avant la poignée de main, même si les fichiers servis sont récents.
      const abonnement = navigator.serviceWorker.addEventListener.bind(navigator.serviceWorker);
      navigator.serviceWorker.addEventListener = function (type, ...args) {
        if (type !== 'message') return abonnement(type, ...args);
      };
    });
    let chargementsAncien = 0, controlesAncien = 0;
    ancien.on('domcontentloaded', () => { chargementsAncien++; });
    await ancien.exposeBinding('__noterAncien', () => { controlesAncien++; });
    await ancien.goto(serveur.base + '/index.html', { waitUntil: 'domcontentloaded' });
    await ancien.evaluate(() => navigator.serviceWorker.addEventListener('controllerchange', () => window.__noterAncien()));
    await expect.poll(() => ancien.evaluate(() => Boolean(window.__STI_ROUE_NUAGE))).toBe(true);
    const moderne = await ctx.newPage();
    let chargementsModerne = 0, controlesModerne = 0;
    moderne.on('domcontentloaded', () => { chargementsModerne++; });
    await moderne.exposeBinding('__noterModerne', () => { controlesModerne++; });
    await moderne.goto(serveur.base + '/index.html', { waitUntil: 'domcontentloaded' });
    await moderne.evaluate(() => navigator.serviceWorker.addEventListener('controllerchange', () => window.__noterModerne()));
    await expect.poll(() => moderne.evaluate(() => Boolean(window.__STI_ROUE_NUAGE))).toBe(true);
    const avantAncien = chargementsAncien, avantModerne = chargementsModerne;
    serveur.deployer();
    await ctx.setOffline(true); await expect.poll(() => moderne.evaluate(() => navigator.onLine)).toBe(false);
    await ctx.setOffline(false); await expect.poll(() => moderne.evaluate(() => navigator.onLine)).toBe(true);
    await expect.poll(() => moderne.evaluate(async () => Boolean((await navigator.serviceWorker.getRegistration()).waiting)), { timeout: 15000 }).toBe(true);
    await moderne.waitForTimeout(2500);
    expect(controlesAncien).toBe(0); expect(controlesModerne).toBe(0);
    expect(chargementsAncien).toBe(avantAncien); expect(chargementsModerne).toBe(avantModerne);
    await ancien.close();
    // Une reconnexion ultérieure réessaie l'activation maintenant que tous les onglets répondent.
    await ctx.setOffline(true); await expect.poll(() => moderne.evaluate(() => navigator.onLine)).toBe(false);
    await ctx.setOffline(false); await expect.poll(() => moderne.evaluate(() => navigator.onLine)).toBe(true);
    await expect.poll(() => controlesModerne, { timeout: 15000 }).toBe(1);
    await moderne.waitForTimeout(800);
    expect(chargementsModerne).toBe(avantModerne);
  } finally { await ctx.close(); await serveur.fermer(); }
});

test('si le stockage du marqueur est bloqué, la mise à jour attend puis se réactive après réparation', async ({ browser }) => {
  const serveur = await servir(), ctx = await browser.newContext();
  try {
    const page = await ctx.newPage();
    let chargements = 0; page.on('domcontentloaded', () => { chargements++; });
    await page.goto(serveur.base + '/fixture.html'); await page.evaluate(() => window.__swPret);
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    await expect.poll(() => page.evaluate(() => Boolean(window.__STI_ROUE_NUAGE))).toBe(true);
    await page.evaluate(() => {
      window.__setItemOriginal = Storage.prototype.setItem;
      Storage.prototype.setItem = function (cle, valeur) {
        if (cle === 'sti-sw-reload-ver') throw new Error('stockage bloqué');
        return window.__setItemOriginal.call(this, cle, valeur);
      };
    });
    const avant = chargements; serveur.deployer();
    await ctx.setOffline(true); await expect.poll(() => page.evaluate(() => navigator.onLine)).toBe(false);
    await ctx.setOffline(false); await expect.poll(() => page.evaluate(() => navigator.onLine)).toBe(true);
    await expect.poll(() => page.evaluate(async () => Boolean((await navigator.serviceWorker.getRegistration()).waiting)), { timeout: 15000 }).toBe(true);
    expect(chargements).toBe(avant);
    await page.evaluate(() => { Storage.prototype.setItem = window.__setItemOriginal; });
    await ctx.setOffline(true); await expect.poll(() => page.evaluate(() => navigator.onLine)).toBe(false);
    await ctx.setOffline(false); await expect.poll(() => page.evaluate(() => navigator.onLine)).toBe(true);
    await expect.poll(() => page.evaluate(async () => !(await navigator.serviceWorker.getRegistration()).waiting), { timeout: 15000 }).toBe(true);
    expect(chargements).toBe(avant);
  } finally { await ctx.close(); await serveur.fermer(); }
});

test('poste laboratoire : une vérification de version au focus ne recharge pas automatiquement', async ({ browser }) => {
  const serveur = await servir('127.0.0.2'), ctx = await browser.newContext();
  try {
    await ctx.route('https://**', route => route.abort());
    const preparation = await ctx.newPage(); await preparation.goto(serveur.base + '/fixture.html');
    await preparation.evaluate(() => window.__swPret);
    await expect.poll(() => preparation.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    await preparation.evaluate(v => {
      localStorage.setItem('sti-version-installee', String(v));
      localStorage.setItem('sti-precache-ver', String(v));
      localStorage.removeItem('sti-sw-reload-ver');
    }, serveur.version);
    await preparation.close();
    const page = await ctx.newPage();
    await page.addInitScript(() => {
      const s = { nativeAuthenticated: true, statut: 'actif', email: 'elevelabo3@example.invalid', role: 'eleve', classe: 'elevelabo3' };
      window.__STI_NATIVE_AUTHENTICATED_V316 = true;
      sessionStorage.setItem('sti-native-session-v316', '1');
      sessionStorage.setItem('sti-session-cache', JSON.stringify(s));
      localStorage.setItem('sti-session-cache', JSON.stringify(s));
      localStorage.setItem('sti-labo3-permanent', '1');
    });
    let chargements = 0; page.on('domcontentloaded', () => { chargements++; });
    await page.goto(serveur.base + '/index.html', { waitUntil: 'domcontentloaded' });
    await expect.poll(() => page.evaluate(() => Boolean(window.__STI_ROUE_NUAGE))).toBe(true);
    await page.waitForTimeout(1200);
    const avant = chargements; serveur.deployer();
    const requetes = serveur.journal.length;
    await page.evaluate(() => dispatchEvent(new Event('focus')));
    await expect.poll(() => serveur.journal.slice(requetes).some(r => r.chemin === '/sw.js')).toBe(true);
    await page.waitForTimeout(3000);
    expect(chargements).toBe(avant);
  } finally { await ctx.close(); await serveur.fermer(); }
});

test('première installation sur un appareil vierge : accueil utilisable sans préchargement intégral', async ({ browser }) => {
  const serveur = await servir('127.0.0.2'), ctx = await browser.newContext();
  try {
    await ctx.route('https://**', route => route.abort());
    const page = await ctx.newPage();
    await page.addInitScript(() => {
      const s = { nativeAuthenticated: true, statut: 'actif', email: 'nouvel-eleve@example.invalid', role: 'eleve', classe: '4SI 1' };
      window.__STI_NATIVE_AUTHENTICATED_V316 = true;
      sessionStorage.setItem('sti-native-session-v316', '1');
      sessionStorage.setItem('sti-session-cache', JSON.stringify(s));
      localStorage.setItem('sti-session-cache', JSON.stringify(s));
    });
    let chargements = 0; page.on('domcontentloaded', () => { chargements++; });
    await page.goto(serveur.base + '/index.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#videosGrid')).toBeVisible();
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)), { timeout: 15000 }).toBe(true);
    await page.waitForTimeout(7000); // laisser passer les anciens messages de préchargement automatique
    const avant = chargements;
    await page.waitForTimeout(1200);
    expect(chargements).toBe(avant);
    expect(chargements).toBeLessThanOrEqual(3);
    const chemins = serveur.journal.map(r => r.chemin);
    expect(chemins).not.toContain('/offline-complete-manifest.json');
    // La page d'accueil historique demande déjà l'aperçu vidéo CSS3 ;
    // il ne s'agit pas d'un préchargement intégral du catalogue par le worker.
    expect(chemins.filter(c => /\.(mp4|mp3|pdf|zip)$/i.test(c)))
      .toEqual(['/assets/videos/css3-cours-v9-sync.mp4']);
    expect(chemins.length).toBeLessThan(150);
    console.log('Installation vierge : chargements, requêtes, octets =', chargements, chemins.length,
      serveur.journal.reduce((n, r) => n + r.octets, 0));
    // La première navigation a précédé l'installation du worker. Une visite
    // contrôlée ultérieure doit bien stocker l'accueil pour le hors-ligne.
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('#videosGrid')).toBeVisible();
    await expect.poll(() => page.evaluate(async v => {
      const c = await caches.open('sti-atelier-v' + v);
      return Boolean(await c.match('/index.html', { ignoreSearch: true }));
    }, serveur.version)).toBe(true);
    await ctx.setOffline(true);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('#videosGrid')).toBeVisible();
  } finally { await ctx.close(); await serveur.fermer(); }
});

test('commande de version du tableau admin : le vrai bouton force une activation volontaire', async ({ browser }) => {
  const serveur = await servir('127.0.0.2'), ctx = await browser.newContext();
  try {
    await ctx.route('https://**', route => route.abort());
    const preparation = await ctx.newPage();
    await preparation.goto(serveur.base + '/fixture.html');
    await preparation.evaluate(() => window.__swPret);
    await expect.poll(() => preparation.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    await preparation.close();
    const page = await ctx.newPage();
    const messages = [];
    await page.exposeBinding('__noterMessageSWAdmin', (_, type) => messages.push(type));
    await page.addInitScript(() => {
      // Identité et réponses fictives : aucune requête vers les comptes réels.
      localStorage.setItem('sti-admin-gold', '1');
      function requete() {
        const q = {};
        for (const nom of ['select', 'eq', 'neq', 'order', 'limit', 'update', 'delete', 'upsert', 'insert', 'in', 'gte', 'lte', 'range']) q[nom] = () => q;
        q.maybeSingle = q.single = () => Promise.resolve({ data: null, error: null });
        q.then = (oui, non) => Promise.resolve({ data: [], error: null, count: 0 }).then(oui, non);
        return q;
      }
      const canal = { on() { return this; }, subscribe() { return this; }, send() { return Promise.resolve('ok'); } };
      window.__STI_SB_CLIENT = {
        auth: { getSession: () => Promise.resolve({ data: { session: { user: { id: 'admin-test', email: window.STI_AUTH.ADMIN } } } }),
          getUser: () => Promise.resolve({ data: { user: { id: 'admin-test', email: window.STI_AUTH.ADMIN } } }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }) },
        from: () => requete(), rpc: () => Promise.resolve({ data: null, error: null }), channel: () => canal,
        removeChannel: () => Promise.resolve()
      };
      const envoyer = ServiceWorker.prototype.postMessage;
      ServiceWorker.prototype.postMessage = function (message, ...args) {
        if (message && message.type) window.__noterMessageSWAdmin(message.type);
        return envoyer.call(this, message, ...args);
      };
    });
    await page.goto(serveur.base + '/admin.html', { waitUntil: 'domcontentloaded' });
    const badge = page.locator('#badge-version-admin');
    await expect(badge).toBeVisible();
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    serveur.deployer();
    await page.evaluate(async () => (await navigator.serviceWorker.getRegistration()).update());
    await expect.poll(() => page.evaluate(async () => Boolean((await navigator.serviceWorker.getRegistration()).waiting)), { timeout: 15000 }).toBe(true);
    await badge.click();
    await expect.poll(() => messages.includes('FORCE_REFRESH_VERSION'), { timeout: 15000 }).toBe(true);
    await expect.poll(() => page.evaluate(async v => (await caches.keys()).includes('sti-atelier-v' + (v + 1)), serveur.version), { timeout: 15000 }).toBe(true);
    await expect.poll(async () => {
      try { return await page.evaluate(async () => !(await navigator.serviceWorker.getRegistration()).waiting); }
      catch (e) { return false; } // Le tableau admin peut se recharger sur commande explicite.
    }, { timeout: 15000 }).toBe(true);
  } finally { await ctx.close(); await serveur.fermer(); }
});
