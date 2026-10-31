/* v574 — Le cours « Systèmes, technologies et Internet » (3e SI) est visible par tous,
   Admin, prof, classe elevelabo3 et comptes GOLD compris, et le glossaire gagne sa partie
   « Systèmes & Internet » alignée sur les pages 5 à 13 du manuel. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (chemin) => readFileSync(join(root, chemin), 'utf8');

const COURS = 'cours/systemes-technologies-internet.html';
const acces = lire('assets/js/acces.js');
const glossaire = lire('glossaire.html');
const index = lire('index.html');
const sw = lire('sw.js');
const cours = lire(COURS);

/* Extrait une fonction du fichier livré par équilibrage des accolades. */
function extraire(source, entete) {
  const debut = source.indexOf(entete);
  assert.ok(debut >= 0, 'introuvable : ' + entete);
  let i = source.indexOf('{', debut);
  let profondeur = 0;
  for (let j = i; j < source.length; j += 1) {
    if (source[j] === '{') profondeur += 1;
    else if (source[j] === '}') {
      profondeur -= 1;
      if (profondeur === 0) return source.slice(debut, j + 1);
    }
  }
  throw new Error('fonction non terminée : ' + entete);
}

const contexte = vm.createContext({ String });
vm.runInContext(
  'var COURS_STI_OUVERTS = ' + acces.match(/var COURS_STI_OUVERTS = (\[[^\]]*\]);/)[1] + ';\n' +
  extraire(acces, 'function coursStiOuvert(') + '\n' +
  extraire(acces, 'function nomEspaceReserve4SI(') + '\n' +
  'this.ouvert = coursStiOuvert; this.reserve = nomEspaceReserve4SI;',
  contexte
);

test('v574 : le cours des systèmes, technologies et Internet n’est jamais réservé', () => {
  for (const chemin of [
    COURS,
    './' + COURS,
    '/' + COURS,
    COURS.replace(/\//g, '\\'),
    'https://aymenessouyah.github.io/STiV2.0/' + COURS + '#ch2-parametres',
    COURS.toUpperCase()
  ]) {
    assert.equal(contexte.ouvert(chemin), true, chemin);
    assert.equal(contexte.reserve(chemin), null, chemin);
  }

  /* Les gardes historiques restent intactes : PHP et l’atelier Bac sont toujours réservés. */
  assert.match(contexte.reserve('cours/php.html'), /Cours PHP/);
  assert.match(contexte.reserve('bac-pratique.html'), /Atelier Bac/);
  assert.equal(contexte.ouvert('cours/php.html'), false);
});

test('v574 : les quatre profils autorisés entrent dans le cours comme tout le monde', () => {
  /* Admin, prof, elevelabo3 et GOLD sont reconnus par les règles d’accès du site… */
  assert.match(acces, /function estClasseProfLabo\(classe, email\)[\s\S]{0,400}c === "elevelabo3"/);
  assert.match(acces, /function estClasseEnseignantProf\(classe\)[\s\S]{0,400}c === "prof"/);
  assert.match(acces, /function estAutorise4SI\(classe, estAdmin\)[\s\S]{0,300}sti-admin-gold/);
  assert.match(acces, /function estAutorise4SI\(classe, estAdmin\)[\s\S]{0,900}GOLD/);

  /* …et aucune de ces règles ne s’applique au nouveau cours. */
  assert.equal(contexte.reserve(COURS), null);

  /* La carte de l’accueil est publique : ni « sti-4si-only », ni verrou de classe. */
  const carte = index.slice(index.indexOf('<!-- 0. Systèmes, technologies et Internet'), index.indexOf('<!-- 1. HTML5 -->'));
  assert.ok(carte.length > 0, 'carte absente de l’accueil');
  assert.match(carte, /data-subject="sti"/);
  assert.match(carte, /data-filter-item="sti"/);
  assert.doesNotMatch(carte, /sti-4si-only/);
  assert.match(index, /<button type="button" class="filter-chip" data-filter="sti">Systèmes &amp; réseaux<\/button>/);

  /* La page du cours ne porte aucun marqueur de verrou. */
  assert.doesNotMatch(cours, /sti-4si-only|sti-lock-4si/);
  assert.match(cours, /data-course-unified="sti"/);
});

test('v574 : la recherche Ctrl+K trouve le nouveau cours depuis n’importe quelle page', () => {
  const entrees = [...acces.matchAll(/\{ tech: "all", badge: "🖥️ Cours 3e SI", title: "([^"]*)", sub: "[^"]*", url: "cours\/systemes-technologies-internet\.html#([^"]*)"/g)];
  assert.ok(entrees.length >= 15, 'entrées du cours : ' + entrees.length);

  for (const [, titre, ancre] of entrees) {
    assert.ok(titre.length > 3, titre);
    assert.match(cours, new RegExp('id="' + ancre + '"'), 'ancre absente : #' + ancre);
  }

  /* L’index du livre est celui du manuel 2026 : 77 pages utiles, de la page 5 à la page 81. */
  const pages = [...acces.matchAll(/badge: "📖 Livre 3SI", title: "[^"]*", sub: "[^"]*· p\. (\d+)/g)].map((m) => Number(m[1]));
  assert.equal(pages.length, 77);
  assert.equal(Math.min(...pages), 5);
  assert.equal(Math.max(...pages), 81);
  assert.ok(!acces.includes('livre 3si" },\n    { tech: "all", badge: "📖 Livre 3SI", title: "Structure d’un document HTML5", sub: "Fiche n° 1 · p. 5'));
});

test('v574 : le glossaire a sa partie Systèmes & Internet, fidèle aux pages 5 à 13', () => {
  assert.match(glossaire, /<button type="button" class="filtre" data-m="sti">🖥️ Systèmes &amp; Internet<\/button>/);
  assert.match(glossaire, /var NOMS_MODULES = \{ sti:"Systèmes & Internet"/);
  assert.match(glossaire, /\.module\.sti \{ background:#6d28d9 \}/);

  const lignes = [...glossaire.matchAll(/^  \{ m:"sti", fr:("(?:[^"\\]|\\.)*"), ar:("(?:[^"\\]|\\.)*"), en:("(?:[^"\\]|\\.)*"), d:("(?:[^"\\]|\\.)*"), src:("(?:[^"\\]|\\.)*"), srcTxt:("(?:[^"\\]|\\.)*") \},$/gm)];
  assert.ok(lignes.length >= 35, 'termes : ' + lignes.length);

  const ancres = new Set([...cours.matchAll(/id="([^"]+)"/g)].map((m) => m[1]));
  const attendus = ['Système d’exploitation', 'Machine virtuelle', 'LAN', 'MAN', 'WAN', 'Adresse IP', 'Masque réseau',
    'Serveur DNS', 'Adresse MAC', 'MQTT', 'Pare-feu (firewall)', 'Internet des objets (IoT)', 'Capteur', 'Plateforme IoT'];

  const vus = new Set();
  for (const [, fr, ar, en, d, src, srcTxt] of lignes) {
    const terme = JSON.parse(fr);
    const source = JSON.parse(src);
    vus.add(terme);
    assert.ok(JSON.parse(en).length > 1, 'EN vide : ' + terme);
    assert.ok(JSON.parse(ar).length > 1, 'AR vide : ' + terme);
    assert.ok(JSON.parse(d).length > 20, 'définition trop courte : ' + terme);
    assert.ok(JSON.parse(srcTxt).length > 3, 'libellé de source vide : ' + terme);
    assert.ok(source.startsWith(COURS + '#'), 'source hors cours : ' + source);
    assert.ok(ancres.has(source.split('#')[1]), 'ancre absente : ' + source);
  }
  for (const terme of attendus) assert.ok(vus.has(terme), 'terme manquant : ' + terme);
});

test('v574 : les nouveaux termes sont aussi cherchables en Ctrl+K', () => {
  const entrees = [...acces.matchAll(/\{ tech: "all", badge: "📔 Glossaire · Systèmes & Internet", title: "([^"]*)", sub: "[^"]*", url: "glossaire\.html#mot=([^"]*)"/g)];
  assert.equal(entrees.length, [...glossaire.matchAll(/^  \{ m:"sti"/gm)].length);
  for (const [, terme, mot] of entrees) {
    assert.equal(decodeURIComponent(mot), terme);
  }
});

test('v574 : les versions hors-ligne suivent la mise à jour', () => {
  assert.match(sw, /url: "\.\/assets\/js\/acces\.js", revision: "sti-glossaire-v574"/);
  assert.match(sw, /url: "\.\/glossaire\.html", revision: "glossaire-sti-v577"/);
  assert.match(sw, /url: "\.\/cours\/systemes-technologies-internet\.html", revision: "sti-3si-v577"/);
  /* v577 : les révisions du glossaire et du cours STI suivent le lot de la vidéo. */
  assert.match(lire('tests/main-integration.test.mjs'), /assert\.equal\(revisions\.get\('\.\/assets\/js\/acces\.js'\), 'sti-glossaire-v574'\);/);
});
