/*
  v597 — la galerie des projets.

  Le dossier `projets/` contient cinq réalisations pédagogiques (carte bancaire,
  fleurs du lycée, formulaire CAP, Tunisie Explorer, bureau de statistiques)
  mais aucune page ne les présentait : elles n'étaient atteignables qu'en
  connaissant l'URL exacte. v597 leur donne une vitrine, utile aux portes
  ouvertes du lycée.

  Ce test verrouille trois choses :
    1. la page existe et utilise la coquille commune (en-tête, menu mobile,
       scripts, fil d'Ariane) — donc elle se comporte comme le reste du site ;
    2. chaque projet est réellement ouvrable : tous les liens internes de la
       page pointent vers un fichier présent dans le dépôt ;
    3. la vitrine est branchée partout où elle doit l'être : accueil, service
       worker, sitemap, manifeste des cache-busters.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (chemin) => readFileSync(join(root, chemin), 'utf8');
const existe = (chemin) => existsSync(join(root, chemin));

const PAGE = 'projets/index.html';
const FEUILLE = 'assets/css/projets-galerie.css';

/* Les cinq projets, avec la fiche qu'ils doivent ouvrir et leur technologie. */
const PROJETS = [
  { ancre: 'carte-bancaire', titre: 'Carte bancaire animée', fiche: 'projets/carte-bancaire/cb.html', techno: ['html5', 'css3', 'javascript'] },
  { ancre: 'fleurs', titre: 'Les fleurs du Lycée Rafèha', fiche: 'projets/fleurs/index.html', techno: ['php'] },
  { ancre: 'formulaire', titre: 'Formulaire d’inscription — CAP Fleuriste', fiche: 'projets/formulaire-inscription/cvFleurs.html', techno: ['html5'] },
  { ancre: 'tunisie', titre: 'Tunisie Explorer', fiche: 'projets/site-tunisie/index.html', techno: ['css3'] },
  { ancre: 'sti0', titre: 'Projet STI 0 — Bureau de statistiques', fiche: 'projets/sti0/index.html', techno: ['javascript'] },
];

test('v597 : la page de la galerie est une vraie page du site, pas une page isolée', () => {
  assert.ok(existe(PAGE), 'projets/index.html existe');
  const html = lire(PAGE);

  /* Coquille commune : on doit retrouver exactement les mêmes repères que
     dans les pages de cours (évitement, en-tête, menu mobile, pied de page). */
  assert.match(html, /<html lang="fr"/);
  assert.match(html, /<meta name="viewport"/);
  assert.match(html, /class="skip-link" href="#contenu-principal"/);
  assert.match(html, /id="contenu-principal"/, 'la cible du lien d’évitement existe');
  assert.match(html, /id="readingProgressBar"/);
  assert.match(html, /class="site-header"/);
  assert.match(html, /id="stiBurgerBtn"/);
  assert.match(html, /aria-controls="stiMobileNav"/);
  assert.match(html, /id="stiMobileNav"/);
  assert.match(html, /class="site-footer"/);
  assert.match(html, /id="back-to-top"/);

  /* Les scripts partagés : thème, profil, protection, application. */
  for (const script of ['assets/js/app.js', 'assets/js/profil.js', 'assets/js/protection.js', 'assets/js/acces.js']) {
    assert.ok(html.includes(script), script + ' est chargé');
  }
  /* La feuille de la galerie est la seule feuille propre à la page. */
  assert.match(html, /assets\/css\/projets-galerie\.css\?v=597/);
  assert.ok(existe(FEUILLE));

  /* Titre unique et description : la page est indexable comme les autres. */
  assert.equal((html.match(/<h1\b/g) || []).length, 1, 'un seul titre de niveau 1');
  assert.match(html, /<meta name="description" content="[^"]{80,}"/);
  assert.match(html, /<link rel="canonical"|<meta name="robots"/);
});

test('v597 : les cinq projets sont présentés, chacun avec un aperçu et une fiche à ouvrir', () => {
  const html = lire(PAGE);

  for (const projet of PROJETS) {
    const debut = html.indexOf('id="' + projet.ancre + '"');
    assert.notEqual(debut, -1, projet.ancre + ' : la carte existe');
    const fin = html.indexOf('</article>', debut);
    const carte = html.slice(debut, fin);

    assert.ok(carte.includes(projet.titre), projet.ancre + ' : titre « ' + projet.titre + ' »');
    assert.match(carte, /<h3 class="projet__titre">/, projet.ancre + ' : titre de niveau 3');

    /* L'aperçu : un dessin vectoriel décrit, jamais une image muette. */
    assert.match(carte, /<svg viewBox="0 0 320 180" role="img" aria-label="[^"]{20,}"/, projet.ancre + ' : aperçu décrit');

    /* Emplacement de la signature : présent, mais muet tant qu'aucun prénom
       n'est renseigné (les fichiers d'origine ne portent aucun nom d'auteur). */
    assert.match(carte, /class="projet__auteur" hidden>[\s\S]*?data-auteur/, projet.ancre + ' : emplacement de la signature');

    /* Un résumé lisible et la liste de ce que le projet fait apprendre. */
    assert.match(carte, /class="projet__resume">[^<]{40,}/, projet.ancre + ' : résumé');
    assert.match(carte, /<ul class="projet__appris">[\s\S]*?<li>[\s\S]*?<\/ul>/, projet.ancre + ' : acquis listés');

    /* Le projet est ouvrable, et sa fiche existe vraiment sur le disque. */
    assert.ok(carte.includes('href="' + projet.fiche.replace('projets/', '') + '"'), projet.ancre + ' : lien vers sa page');
    assert.ok(existe(projet.fiche), projet.fiche + ' existe');

    /* Les filtres du haut s'appuient sur data-tech : chaque carte doit le porter. */
    const technos = (carte.match(/data-tech="([^"]+)"/) || [])[1];
    assert.ok(technos, projet.ancre + ' : technologies déclarées');
    for (const t of projet.techno) {
      assert.ok(technos.split(/\s+/).includes(t), projet.ancre + ' : ' + t + ' annoncé dans data-tech');
    }
  }

  /* Aucune carte masquée au départ : sans JavaScript, les cinq restent visibles. */
  assert.equal((html.match(/class="projet projet--[^"]*"[^>]*\bhidden\b/g) || []).length, 0);
});

test('v597 : tous les liens internes de la galerie mènent quelque part', () => {
  const html = lire(PAGE);
  const liens = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(liens.length > 20, 'la page a des liens');

  const manquants = [];
  for (const lien of liens) {
    if (/^(https?:|mailto:|data:|#|javascript:)/.test(lien)) continue;
    const chemin = decodeURIComponent(lien.split('#')[0].split('?')[0]);
    if (!chemin) continue;
    const cible = resolve(join(root, 'projets'), chemin);
    if (!existsSync(cible)) manquants.push(lien);
  }
  assert.deepEqual(manquants, [], 'aucun lien mort dans la galerie');
});

test('v597 : le filtre par technologie est utilisable au clavier et sans JavaScript', () => {
  const html = lire(PAGE);
  const feuille = lire(FEUILLE);

  /* Les boutons annoncent leur état, et le groupe porte un nom. */
  assert.match(html, /role="group" aria-label="Filtrer les projets par technologie"/);
  assert.equal((html.match(/class="galerie-filtre"/g) || []).length, 5, 'cinq filtres : tous + quatre technologies');
  assert.match(html, /data-filtre="tous" aria-pressed="true"/);
  assert.equal((html.match(/class="galerie-filtre" data-filtre="[a-z0-9]+" aria-pressed="false"/g) || []).length, 4);

  /* Le résultat du filtrage est annoncé aux lecteurs d'écran. */
  assert.match(html, /setAttribute\("role", "status"\)/);
  assert.match(html, /setAttribute\("aria-live", "polite"\)/);
  assert.match(html, /annonce\.textContent = visibles/);

  /* La CSP autorise le petit script de la page (comme partout sur le site). */
  assert.match(html, /Content-Security-Policy" content="[^"]*script-src 'self' 'unsafe-inline'/);

  /* L'état sélectionné se voit autrement qu'à la couleur seule. */
  assert.match(feuille, /\.galerie-filtre\[aria-pressed="true"\]/);
  /* `.projet` est un conteneur flex : sans cette règle, l'attribut hidden
     serait écrasé par `display: flex` et le filtre ne masquerait rien. */
  assert.match(feuille, /\.projet\[hidden\]\s*\{\s*display:\s*none/);
  /* Mouvement réduit respecté, comme le reste du site. */
  assert.match(feuille, /@media \(prefers-reduced-motion: reduce\)/);
});

test('v597 : la vitrine est branchée sur l’accueil, le service worker et le sitemap', () => {
  /* 1. Accueil : entrée dans le menu (bureau et mobile) + carte dans les ateliers. */
  const accueil = lire('index.html');
  assert.ok(accueil.includes('<a class="site-nav__link" href="projets/index.html">Projets</a>'), 'lien du menu principal');
  assert.match(accueil, /href="projets\/index\.html">🏛️ Galerie des projets</, 'lien du menu mobile');
  assert.match(accueil, /<h3>Galerie des projets d'élèves<\/h3>/, 'carte dans les outils');

  /* 2. Service worker : la page est connue du hors-ligne et le delta reste borné. */
  const sw = lire('sw.js');
  assert.match(sw, /var VERSION_PUBLIEE = "v6\d\d"/);
  assert.ok(sw.includes('{ url: "./projets/index.html", revision: "galerie-projets-v597"'));
  assert.ok(sw.includes('{ url: "./assets/css/projets-galerie.css", revision: "galerie-projets-v597"'));

  const delta = sw.split('var UPDATE_FILES = [')[1].split('];')[0];
  const nbDelta = delta.split('{ url:').length - 1;
  assert.ok(nbDelta <= 278, `delta trop long : ${nbDelta}`);

  for (const liste of ['SHELL', 'OFFLINE_LIST']) {
    const bloc = sw.split('var ' + liste + ' = [')[1].split('];')[0];
    assert.ok(bloc.includes('"./projets/index.html"'), liste + ' : la page est mise en cache');
    assert.ok(bloc.includes('"./assets/css/projets-galerie.css"'), liste + ' : sa feuille aussi');
  }

  /* 3. Sitemap et manifeste des cache-busters. */
  assert.match(lire('sitemap.xml'), /<loc>\.\/projets\/index\.html<\/loc>/);
  const busters = JSON.parse(lire('tests/fixtures/cache-busters.json'));
  assert.deepEqual(busters.actifs['assets/css/projets-galerie.css'], ['597']);
});
