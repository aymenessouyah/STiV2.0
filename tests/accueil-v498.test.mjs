/* v498 — accueil : drapeau tunisien, fond vidéo du bloc « Bonjour », ruban
   d'identité sur les initiales et boîtes « en cours » sur une seule ligne. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const racine = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (p) => readFileSync(resolve(racine, p), 'utf8');
const index = lire('index.html');
const css = lire('assets/css/theme.css');
const app = lire('assets/js/app.js');
const news = lire('assets/js/news-perso.js');
const sw = lire('sw.js');

test('v498 : drapeau tunisien à gauche du logo, à la même hauteur que lui', () => {
  /* Le drapeau est placé AVANT la marque STI dans le lien de marque. */
  const marque = index.indexOf('class="brand-logo"');
  const drapeau = index.indexOf('class="brand-logo__drapeau"');
  const pastille = index.indexOf('class="brand-logo__mark"');
  assert.ok(marque > 0, 'le lien de marque existe');
  assert.ok(drapeau > marque, 'le drapeau appartient au logo');
  assert.ok(pastille > drapeau, 'le drapeau précède la marque STI, donc il est à sa gauche');
  assert.match(index, /src="assets\/images\/drapeau-tunisie\.svg"/);
  assert.match(index, /alt="Drapeau tunisien"/);

  const fichier = resolve(racine, 'assets/images/drapeau-tunisie.svg');
  assert.ok(existsSync(fichier), 'le SVG du drapeau est versionné');
  const svg = readFileSync(fichier, 'utf8');
  assert.match(svg, /<rect width="900" height="600" fill="#e70013"\/>/, 'champ rouge du drapeau');
  assert.match(svg, /<circle cx="450" cy="300" r="180" fill="#ffffff"\/>/, 'disque blanc central');
  assert.match(svg, /<mask id="drapeau-lune">/, 'croissant rouge découpé par un masque');
  assert.match(svg, /<path fill="#e70013" d="M505/, 'étoile rouge à cinq branches');

  /* v503 : le drapeau et le logo font exactement la même taille (40 px). */
  const bloc = css.slice(css.indexOf('.brand-logo__drapeau {'), css.indexOf('.brand-logo__text {'));
  assert.match(bloc, /width: 40px;/);
  assert.match(bloc, /height: 40px/);
  assert.match(bloc, /object-fit: cover/);
  /* v503 : sur mobile, les deux restent sur une même ligne et à taille égale. */
  const mobile = css.slice(css.indexOf('@media (max-width: 540px)'), css.indexOf('@media (min-width: 1060px) and (max-width: 1200px)'));
  assert.match(mobile, /\.brand-logo__drapeau,\s*body\.sti-v2 \.site-header \.brand-logo__mark \{\s*width: 30px;\s*height: 30px;/,
    'sur mobile le drapeau et le logo gardent la même taille');
  assert.doesNotMatch(mobile, /\.brand-logo__drapeau \{\s*position: absolute;/,
    'le drapeau n’est plus une pastille : il reste sur la ligne du logo');

  /* Les autres pages qui portent le logo reçoivent aussi le drapeau. */
  for (const page of ['dashboard.html', 'cours/html5.html', 'cours/css3.html', 'cours/javascript.html', 'cours/sql.html', 'cours/php.html']) {
    const html = lire(page);
    assert.match(html, /brand-logo__drapeau/, page);
    assert.ok(html.indexOf('brand-logo__drapeau') < html.indexOf('brand-logo__mark'), page + ' : drapeau à gauche');
  }
});

test('v498/v509 : le drapeau STI animé couvre tout le bloc « Bonjour » sans le déformer', () => {
  const section = index.indexOf('id="welcomeReturn"');
  const fond = index.indexOf('id="welcomeFondVideo"');
  const titre = index.indexOf('id="welcomeTitle"');
  assert.ok(section > 0 && fond > section && titre > fond, 'la vidéo est le fond de la section, avant le texte');
  assert.match(index, /<source src="assets\/video\/drapeau-sti-vent\.mp4" type="video\/mp4" \/>/);
  assert.match(index, /autoplay muted loop playsinline preload="metadata"/);

  const video = resolve(racine, 'assets/video/drapeau-sti-vent.mp4');
  assert.ok(existsSync(video), 'la vidéo de fond est présente');
  const taille = statSync(video).size;
  assert.ok(taille > 10_000 && taille < 6_000_000, 'vidéo de fond acceptable pour le web (' + taille + ' octets)');
  const entete = readFileSync(video).subarray(0, 32).toString('latin1');
  assert.match(entete, /ftyp/, 'conteneur MP4 valide');

  const bloc = css.slice(css.indexOf('.welcome-return__fond {'), css.indexOf('.welcome-return__title {'));
  assert.match(bloc, /position: absolute;\s*inset: 0;/, 'le fond recouvre toute la boîte');
  assert.match(bloc, /object-fit: cover/, 'la vidéo s’étend sur toute la boîte sans déformation');
  assert.match(bloc, /object-position: center center/, 'le bandeau garde le drapeau et l’affiche du lycée visibles');
  assert.match(bloc, /\.welcome-return__fond::after \{[^}]*linear-gradient\(90deg, var\(--bg-alt\) 0%/, 'voile dense derrière le texte');
  assert.match(bloc, /\.welcome-return__fond::after \{[^}]*linear-gradient\(180deg/, 'voile dégradé vers le bas pour laisser voir le lycée');
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{\s*\.welcome-return__fond-video \{ display: none; \}/,
    'aucune vidéo animée si l’utilisateur réduit les animations');

  /* v499 : la vidéo est marquée décorative et n'est jamais prise pour un cours. */
  assert.match(index, /id="welcomeFondVideo"[^>]*data-video-decor="1"/);
  const protection = lire('assets/js/protection.js');
  assert.match(protection, /function estVideoDecorativeSTI\(video\)/);
  assert.match(protection, /if \(estVideoDecorativeSTI\(video\)\) return;/, 'la pause pédagogique ignore la vidéo de fond');
  assert.match(protection, /closest\("\.welcome-return__fond"\)/, 'le fond de l’accueil est reconnu même sans attribut');

  /* v499 : la boucle est garantie même si le navigateur met la vidéo en pause. */
  assert.match(app, /video\.__stiBoucleFond = true;/);
  assert.match(app, /addEventListener\("pause", function \(\) \{/);

  /* Le fond ne tourne que lorsque la section est visible. */
  assert.match(app, /function piloterVideoAccueil\(actif\)/);
  assert.match(app, /section\.hidden = false;\s*piloterVideoAccueil\(true\);/);
  assert.match(app, /section\.hidden = true;\s*piloterVideoAccueil\(false\);/);
});

test('v498/v499 : ruban à plat, bleu 3e SI, vert 4e SI, or pour l’admin et les profs, orangé pour les autres', () => {
  /* Le « B » de Bonjour et le prénom sont chacun dans un bloc ruban. */
  assert.equal((index.match(/class="ruban-mot"/g) || []).length, 2, 'un ruban pour Bonjour, un pour le prénom');
  assert.equal((index.match(/class="ruban-initiale__logo"/g) || []).length, 0, 'v507 : plus de logo sur les lettres');
  assert.match(index, /<span class="ruban-initiale" aria-hidden="true"><\/span><span class="ruban-lettre">B<\/span>onjour</,
    'le ruban précède le B de « Bonjour », qui porte sa propre couleur');
  assert.match(index, /<\/span><span id="welcomePrenom">/, 'le second ruban précède la première lettre du prénom');
  assert.match(index, /<h2 class="welcome-return__title" id="welcomeTitle" data-ruban="3si">/);

  /* Le prénom reste un nœud de texte : aucune balise injectée par le profil. */
  const avantPrenom = index.slice(index.indexOf('id="welcomePrenom"') - 120, index.indexOf('id="welcomePrenom"'));
  assert.doesNotMatch(avantPrenom, /<span id="welcomePrenom"[^>]*>/);

  const couleurs = css.slice(css.indexOf('.welcome-return__title[data-ruban="4si"]'), css.indexOf('.ruban-initiale {'));
  assert.match(couleurs, /data-ruban="4si"[\s\S]*?--ruban-lettre: #6ee7b7;/, 'vert 4e SI');
  assert.match(couleurs, /data-ruban="admin"[\s\S]*?--ruban-lettre: #fbbf24;/, 'or pour admin / GOLD / profs');
  assert.match(couleurs, /data-ruban="autre"[\s\S]*?--ruban-lettre: #fb923c;/, 'orangé pour les autres comptes');
  const defaut = css.slice(css.indexOf('.welcome-return__title {'), css.indexOf('.welcome-return__title[data-ruban="4si"]'));
  assert.match(defaut, /--ruban-lettre: #7dd3fc;/, 'bleu 3e SI par défaut');
  /* v514 : les initiales ne sont plus colorées, elles sont soulignées. */
  assert.doesNotMatch(css, /\.ruban-lettre \{ color: var\(--ruban-lettre\); \}/, 'plus de lettre colorée');
  const accent = css.slice(css.indexOf('.ruban-lettre,'), css.indexOf('.ruban-mot #welcomePrenom { display: inline-block; }'));
  assert.match(accent, /color: inherit;/, 'la lettre garde la couleur du titre');
  assert.match(accent, /text-decoration-line: underline;/, 'un trait passe sous la lettre');
  assert.match(accent, /text-decoration-color: var\(--ruban-lettre\);/, 'trait de la couleur de la classe');
  assert.match(accent, /text-underline-offset: 0\.16em;/, 'trait détaché de la lettre');
  assert.match(accent, /text-decoration-skip-ink: none;/, 'trait continu sous le B');

  /* v499/v514 : plus de bande derrière la lettre, donc plus de « pas » ni de biseau. */
  const bande = css.slice(css.indexOf('.ruban-initiale {'), css.indexOf('.ruban-lettre,'));
  assert.match(bande, /display: none;/, 'la bande colorée est retirée');
  assert.doesNotMatch(bande, /rotate\(/, 'aucune inclinaison');
  assert.doesNotMatch(bande, /clip-path/, 'aucune découpe en biseau');

  /* Le niveau est posé par le moteur de news, sur la classe réelle de la session. */
  assert.match(news, /function appliquerRuban\(\)/);
  assert.match(news, /titre\.setAttribute\("data-ruban", niveauRuban\(\)\)/);
  /* Un compte enseignant garde le ruban argent même s'il porte une classe. */
  assert.match(news, /function niveauRuban\(\) \{\s*if \(estCompteEnseignant\(\)\) return "admin";/);
  assert.match(news, /appliquerRuban: appliquerRuban/);
  assert.match(news, /function demarrer\(fort\) \{\s*appliquerRuban\(\);/);
  assert.match(app, /STINewsPerso\.appliquerRuban\(\)/, 'le ruban suit l’arrivée du prénom');
  assert.match(news, /if \(n === "admin"\) return "Enseignant";/);
  /* v499 : orangé pour tout compte qui n'est ni 3e/4e SI ni enseignant. */
  /* v517 : classe illisible → repli sur le privilège 4e SI, puis « autre ». */
  assert.match(news, /var n = niveauDepuisClasse\(classeCourante\(\)\);\s*if \(n\) return n;/);
  assert.match(news, /classList\.contains\("sti-4si-autorise"\)\) return "4si";/);
  assert.match(news, /return "autre";/);
});

test('v498 : les boîtes « en cours » tiennent sur une seule ligne compacte', () => {
  const bloc = css.slice(css.indexOf('.welcome-return__courses {'), css.indexOf('.welcome-course:hover'));
  assert.match(bloc, /display: flex;/);
  assert.match(bloc, /flex-wrap: nowrap;/, 'une seule ligne');
  assert.match(bloc, /overflow-x: auto;/, 'défilement horizontal au lieu d’un retour à la ligne');
  assert.match(bloc, /min-width: 210px;/, 'cible tactile et lisibilité conservées');
  assert.match(bloc, /max-width: 340px;/);
  assert.match(bloc, /flex-direction: row;/, 'boîtes horizontales donc plus basses');

  /* Cartes compactes : icône réduite, plus de grande couverture de 100 px. */
  const cover = css.slice(css.indexOf('.welcome-course__cover {'), css.indexOf('.welcome-course__body'));
  assert.match(cover, /width: 56px;/);
  assert.match(cover, /min-height: 58px;/);
  assert.doesNotMatch(cover, /min-height: 100px/);
  assert.doesNotMatch(css, /\.welcome-course__state \{\s*position: absolute;/);

  /* Le balisage généré place l'état dans la ligne, pas en surimpression. */
  assert.match(app, /class="welcome-course__state">'\s*\+\s*\(c\.revises \? c\.revises \+ " \/ " \+ c\.total \+ " révisés" : "Consulté"\)/);
  assert.doesNotMatch(app, /<span class="welcome-course__cover"><span class="welcome-course__state">/);
});

test('v498 : service worker et manifeste hors ligne connaissent le drapeau et la vidéo', () => {
  assert.match(sw, /var CACHE = "sti-atelier-v380"/);
  assert.match(sw, /var UPDATE_ID = "v547-boucles-php-20261030"/);
  assert.match(sw, /url: "\.\/index\.html", revision: "defis37-lecteur-v528"/);
  assert.match(sw, /url: "\.\/assets\/css\/theme\.css", revision: "classe-nav-v536"/);
  assert.match(sw, /url: "\.\/assets\/js\/app\.js", revision: "boucles-v547"/);
  assert.match(sw, /url: "\.\/assets\/js\/news-perso\.js", revision: "ruban-vert-v517"/);
  assert.match(sw, /url: "\.\/assets\/images\/drapeau-tunisie\.svg", revision: "accueil-lycee-v503"/);
  const shell = sw.split('var SHELL = [')[1].split('];')[0];
  assert.ok(shell.includes('"./assets/images/drapeau-tunisie.svg"'), 'le drapeau est pré-caché');
  const offline = sw.split('var OFFLINE_LIST = [')[1].split('];')[0];
  assert.ok(offline.includes('"./assets/video/drapeau-sti-vent.mp4"'), 'la vidéo officielle rejoint le paquet hors-ligne complet');
  const delta = sw.split('var UPDATE_FILES = [')[1].split('];')[0];
  assert.ok(!delta.includes('drapeau-sti-vent.mp4'), 'les vidéos restent hors du delta léger');

  const manifeste = JSON.parse(lire('offline-complete-manifest.json'));
  for (const chemin of ['assets/images/drapeau-tunisie.svg', 'assets/video/drapeau-sti-vent.mp4']) {
    const entree = manifeste.files.find((f) => f.path === chemin);
    assert.ok(entree, chemin + ' est dans le manifeste');
    const data = readFileSync(resolve(racine, chemin));
    assert.equal(entree.bytes, data.length, chemin);
    assert.equal(entree.gitSha, createHash('sha1').update(`blob ${data.length}\0`).update(data).digest('hex'), chemin);
  }
  assert.equal(manifeste.version, 'v547-sti-atelier-v380');
});
