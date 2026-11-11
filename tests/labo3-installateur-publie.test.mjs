import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const code = readFileSync(new URL('../assets/js/admin-labo3.js', import.meta.url), 'utf8');
const DEPOT = { proprietaire: 'aymenessouyah', nom: 'STiV2.0' };
const BASE = `https://github.com/${DEPOT.proprietaire}/${DEPOT.nom}/releases/download/labo3-windows/`;
const SHA = 'a'.repeat(64);

function charger() {
  const contexte = vm.createContext({ location: { hostname: 'aymenessouyah.github.io', pathname: '/STiV2.0/admin.html' } });
  vm.runInContext(code, contexte);
  return contexte.STILabo3Admin;
}

function release(assets) {
  return { name: 'STI v2.0 version spéciale Labo 3', tag_name: 'labo3-windows', published_at: '2026-11-09T10:00:00Z', assets };
}

function reponseJson(corps, statut = 200) {
  return { ok: statut < 400, status: statut, json: async () => corps };
}

test('dépôt déduit de l’adresse GitHub Pages, tag et noms attendus', () => {
  const api = charger();
  /* Objet créé dans un autre contexte VM : prototype différent, comparaison champ par champ. */
  const depot = api.depotCible();
  assert.equal(depot.proprietaire, DEPOT.proprietaire);
  assert.equal(depot.nom, DEPOT.nom);
  assert.equal(api.TAG_INSTALLATEUR, 'labo3-windows');
});

test('release absente (404) : non publiée, avec la raison affichable', async () => {
  const api = charger();
  const r = await api.verifierPublication({ depot: DEPOT, fetch: async () => reponseJson({ message: 'Not Found' }, 404) });
  assert.equal(r.publie, false);
  assert.match(r.raison, /aucune release/);
});

test('release conforme : lien, empreinte SHA-256 et date', async () => {
  const api = charger();
  const appels = [];
  const r = await api.verifierPublication({
    depot: DEPOT,
    fetch: async (url) => {
      appels.push(url);
      if (url.startsWith('https://api.github.com/')) return reponseJson(release([
        { name: 'STI-Labo3-Installation.exe', size: 158000000, browser_download_url: BASE + 'STI-Labo3-Installation.exe' },
        { name: 'SHA256SUMS.txt', browser_download_url: BASE + 'SHA256SUMS.txt' }
      ]));
      return { ok: true, status: 200, text: async () => `${SHA}  STI-Labo3-Installation.exe\n${'b'.repeat(64)}  autre.txt\n` };
    }
  });
  assert.equal(r.publie, true);
  assert.equal(r.url, BASE + 'STI-Labo3-Installation.exe');
  assert.equal(r.sha256, SHA);
  assert.equal(r.octets, 158000000);
  assert.equal(appels.length, 2, 'API puis SHA256SUMS.txt, rien d’autre');
});

test('somme recopiée dans la notice : une seule requête, fichier de release injoignable', async () => {
  /* Conditions réelles du navigateur : api.github.com envoie les en-têtes CORS,
     release-assets.githubusercontent.com n'en envoie aucun — la lecture du
     fichier échoue en « Failed to fetch ». La notice de release porte donc les
     mêmes lignes que SHA256SUMS.txt, et suffit. */
  const api = charger();
  const appels = [];
  const r = await api.verifierPublication({
    depot: DEPOT,
    fetch: async (url) => {
      appels.push(url);
      if (url.startsWith('https://api.github.com/')) return reponseJson(Object.assign(release([
        { name: 'STI-Labo3-Installation.exe', size: 188965590, browser_download_url: BASE + 'STI-Labo3-Installation.exe' },
        { name: 'SHA256SUMS.txt', browser_download_url: BASE + 'SHA256SUMS.txt' }
      ]), {
        body: 'STI v2.0 version spéciale Labo 3 — installateur SIMPLE\n' +
          'commit : 8fa82e43\n\nEmpreintes SHA-256 des fichiers publiés :\n' +
          `${SHA}  STI-Labo3-Installation.exe\n`
      }));
      throw new TypeError('Failed to fetch');
    }
  });
  assert.equal(r.publie, true);
  assert.equal(r.sha256, SHA);
  assert.equal(r.octets, 188965590);
  assert.equal(appels.length, 1, 'l’API seule : aucun appel vers l’hôte sans CORS');
});

test('refus : exe sans empreinte, sommes absentes, URL hors dépôt, API en erreur', async () => {
  const api = charger();
  const sommeVide = { ok: true, status: 200, text: async () => 'aucune ligne exploitable\n' };
  const cas = [
    ['empreinte absente', [
      { name: 'STI-Labo3-Installation.exe', browser_download_url: BASE + 'STI-Labo3-Installation.exe' },
      { name: 'SHA256SUMS.txt', browser_download_url: BASE + 'SHA256SUMS.txt' }], sommeVide, /aucune empreinte SHA-256/],
    ['SHA256SUMS.txt manquant', [
      { name: 'STI-Labo3-Installation.exe', browser_download_url: BASE + 'STI-Labo3-Installation.exe' }], null, /SHA256SUMS.txt absent/],
    ['aucun exécutable', [
      { name: 'SHA256SUMS.txt', browser_download_url: BASE + 'SHA256SUMS.txt' }], null, /sans exécutable/],
    ['URL de téléchargement étrangère', [
      { name: 'STI-Labo3-Installation.exe', browser_download_url: 'https://exemple.malveillant.test/x.exe' },
      { name: 'SHA256SUMS.txt', browser_download_url: BASE + 'SHA256SUMS.txt' }], sommeVide, /hors du dépôt/]
  ];
  for (const [nom, assets, reponseTexte, motif] of cas) {
    const r = await api.verifierPublication({
      depot: DEPOT,
      fetch: async (url) => url.startsWith('https://api.github.com/')
        ? reponseJson(release(assets))
        : (reponseTexte || sommeVide)
    });
    assert.equal(r.publie, false, nom);
    assert.match(r.raison, motif, nom);
  }
  const erreur = await api.verifierPublication({ depot: DEPOT, fetch: async () => reponseJson({}, 500) });
  assert.equal(erreur.publie, false);
  assert.match(erreur.raison, /HTTP 500/);
  const reseau = await api.verifierPublication({ depot: DEPOT, fetch: async () => { throw new Error('hors ligne'); } });
  assert.match(reseau.raison, /injoignable/);
});

test('empreintes : analyse ligne à ligne, tolérante aux espaces et aux lignes parasites', () => {
  const api = charger();
  const sommes = api.lireSommes(`${SHA}  STI-Labo3-Installation.exe\n` +
    'ligne invalide\n' + `${'c'.repeat(63)}  trop-court.txt\n` + `${'d'.repeat(64)}   autre.exe  \n`);
  assert.equal(sommes['STI-Labo3-Installation.exe'], SHA);
  assert.equal(sommes['autre.exe'], 'd'.repeat(64));
  assert.equal(sommes['trop-court.txt'], undefined);
  assert.deepEqual(Object.keys(api.lireSommes('')), []);
});

test('panneau : le lien reste désactivé tant qu’aucune release n’est vérifiée', () => {
  const html = readFileSync(new URL('../admin.html', import.meta.url), 'utf8');
  /* Garde-fou : cet élément est un <a>, pas un <button> — un bouton ignore
     href et le clic ne mène nulle part (bug réel constaté le 09/11/2026 :
     bouton « activé » mais muet au clic). */
  assert.match(html, /<a class="btn-outil btn-outil-desactive" id="labo3-installateur-lien" aria-disabled="true">/);
  assert.match(html, /id="labo3-installateur-verifier"/);
  assert.match(html, /id="labo3-installateur-etat"[^>]*aria-live="polite"/);
  assert.match(html, /release <code>labo3-windows<\/code>/);
  // Aucun lien de téléchargement codé en dur : l’URL vient de la release vérifiée.
  assert.doesNotMatch(html, /releases\/download\/labo3-windows\//);
});

test('empreinte issue du digest GitHub lorsque la notice est vide et les fichiers bloqués par CORS', async () => {
  const appels = [];
  const r = await charger().verifierPublication({ depot: DEPOT, fetch: async url => {
    appels.push(url);
    if (!url.startsWith('https://api.github.com/')) throw new Error('CORS');
    return reponseJson(release([
      { name: 'STI-Labo3-Installation.exe', digest: `sha256:${SHA}`, browser_download_url: BASE + 'STI-Labo3-Installation.exe' },
      { name: 'SHA256SUMS.txt', browser_download_url: BASE + 'SHA256SUMS.txt' }
    ]));
  }});
  assert.equal(r.publie, true);
  assert.equal(r.sha256, SHA);
  assert.equal(appels.length, 1);
});

test('réponse JSON invalide ou erreur HTTP des empreintes : résultat explicite, sans promesse rejetée', async () => {
  const api = charger();
  const invalide = await api.verifierPublication({ depot: DEPOT, fetch: async () => ({ok: true, status: 200, json: async () => { throw new Error('JSON invalide'); }}) });
  assert.equal(invalide.publie, false);
  assert.match(invalide.raison, /réponse de la release illisible/);
  const http = await api.verifierPublication({ depot: DEPOT, fetch: async url => url.startsWith('https://api.github.com/')
    ? reponseJson(release([
      { name: 'STI-Labo3-Installation.exe', browser_download_url: BASE + 'STI-Labo3-Installation.exe' },
      { name: 'SHA256SUMS.txt', browser_download_url: BASE + 'SHA256SUMS.txt' }
    ])) : { ok: false, status: 503, text: async () => `${SHA}  STI-Labo3-Installation.exe` } });
  assert.equal(http.publie, false);
  assert.match(http.raison, /HTTP 503/);
});
