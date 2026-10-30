/* v563 — la convention d'écriture d'un schéma relationnel est désormais
   enseignée explicitement (priorité 3 de la comparaison avec l'aide
   pédagogique officielle de septembre 2026).
   ─────────────────────────────────────────────────────────────────────────
   Ce que demande l'aide officielle, page 6 :

     « Adopter, pour la représentation textuelle et graphique d'une BDR, la
       convention suivante : clé primaire soulignée, clé étrangère suivie du
       symbole #. Utiliser la notation suivante pour présenter une relation :
       un à un présentée par 1 : 1, un à plusieurs présentée par 1 : ∞,
       plusieurs à plusieurs présentée par ∞ : ∞. »

   La plateforme utilisait déjà 1 — 1, 1 — N et N — N dans le cours SQL, mais
   n'énonçait nulle part la règle du soulignement, du #, ni la notation
   officielle. Ces tests figent l'ajout :

     1. le cours SQL contient un encadré #intro-notation complet ;
     2. la page « Bases de données » (LDD/LMD/LCD) le résume et renvoie vers lui ;
     3. les deux livres connectés (3e et 4e SI) pointent sur cet encadré ;
     4. toutes les ancres citées par les deux livres existent réellement ;
     5. la pagination et le nombre de fiches des livres sont inchangés.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (chemin) => readFileSync(join(root, chemin), 'utf8');

const COURS_SQL = 'cours/sql.html';
const COURS_BASES = 'cours/sql-bases-ldd-lmd-lcd.html';
const ANCRE = 'intro-notation';

/* Extrait le contenu de l'encadré, pour ne pas confondre avec le reste du cours. */
function encadre(html) {
  const debut = html.indexOf('id="' + ANCRE + '"');
  assert.ok(debut >= 0, 'encadré #' + ANCRE + ' absent');
  const fin = html.indexOf('<footer class="chapter-footer">', debut);
  assert.ok(fin > debut, 'encadré #' + ANCRE + ' non refermé');
  return html.slice(debut, fin);
}

test('le cours SQL énonce les deux règles d’écriture du programme', () => {
  const html = lire(COURS_SQL);
  const bloc = encadre(html);

  /* Clé primaire soulignée : la balise <u> est le seul moyen sémantique de
     porter un soulignement dans un schéma textuel. */
  assert.match(bloc, /Clé primaire<\/strong><\/td>\s*<td><strong>soulignée<\/strong>/);
  /* Clé étrangère suivie du symbole # */
  assert.match(bloc, /Clé étrangère<\/strong><\/td>\s*<td>suivie du symbole <strong>#<\/strong>/);

  /* Les exemples de schéma appliquent réellement la convention. */
  const exemples = [...bloc.matchAll(/<pre[^>]*>([\s\S]*?)<\/pre>/g)].map((m) => m[1]);
  assert.ok(exemples.length >= 3, 'trois exemples attendus (schéma, dessin, SQL)');
  const schema = exemples[0];
  assert.match(schema, /Client \(<u>NCIN_Cli<\/u>/, 'clé primaire soulignée dans l’exemple');
  assert.match(schema, /immat_Vehicule#/, 'clé étrangère suivie de # dans l’exemple');
  assert.match(schema, /Location \(<u>NCIN_Cli<\/u>#, <u>immat_Vehicule<\/u>#/,
    'clé à la fois primaire et étrangère : soulignée ET suivie de #');
});

test('le cours SQL donne les trois notations officielles de cardinalité', () => {
  const bloc = encadre(lire(COURS_SQL));

  for (const notation of ['1 : 1', '1 : ∞', '∞ : ∞']) {
    assert.ok(bloc.includes(notation), 'notation officielle absente : ' + notation);
  }
  /* Les écritures historiques de la plateforme restent citées comme synonymes. */
  assert.ok(bloc.includes('1 : N'), 'équivalence 1 : N attendue');
  assert.ok(bloc.includes('N : N'), 'équivalence N : N attendue');

  /* Où placer la clé étrangère : la règle qui fait perdre des points. */
  assert.match(bloc, /dans la table du côté <b>∞<\/b>/);
  assert.match(bloc, /table d'association<\/b>, clé primaire composée/);

  /* La position des cardinalités sur un dessin est expliquée. */
  assert.match(bloc, /près de la table qu'il\s+décrit/);
  assert.match(bloc, /1 ── ∞/);

  /* Traduction schéma → SQL, sans laquelle la convention resterait abstraite. */
  assert.match(bloc, /PRIMARY KEY \(NCIN_Cli, immat_Vehicule, date_loc\)/);
  assert.match(bloc, /FOREIGN KEY \(NCIN_Cli\)\s+REFERENCES Client\(NCIN_Cli\)/);
});

test('les erreurs classiques sont listées et les liens d’entraînement restent locaux', () => {
  const bloc = encadre(lire(COURS_SQL));

  assert.match(bloc, /Oublier de <strong>souligner<\/strong> la clé primaire/);
  assert.match(bloc, /Mettre <code>#<\/code> sur une clé qui n'est <em>pas<\/em>/);
  assert.match(bloc, /du mauvais côté/);

  const liens = [...bloc.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(liens.length >= 2, 'liens d’entraînement attendus');
  for (const lien of liens) {
    assert.ok(lien.startsWith('../') && !/^https?:/i.test(lien), 'lien local attendu : ' + lien);
  }
});

test('la page Bases de données résume la convention et renvoie au cours SQL', () => {
  const html = lire(COURS_BASES);

  assert.match(html, /<section id="schema-relationnel">/);
  assert.match(html, /<a href="#schema-relationnel">Schéma &amp; notation<\/a>/, 'sommaire à jour');
  assert.match(html, /href="sql\.html#intro-notation"/, 'renvoi vers l’encadré détaillé');

  const debut = html.indexOf('<section id="schema-relationnel">');
  const fin = html.indexOf('<section id="create-table">', debut);
  assert.ok(debut >= 0 && fin > debut);
  const section = html.slice(debut, fin);

  for (const attendu of ['<u>num_emp</u>', 'num_service#', '1 : 1', '1 : ∞', '∞ : ∞']) {
    assert.ok(section.includes(attendu), 'attendu dans la section : ' + attendu);
  }
  /* La clé étrangère simple ne doit PAS être soulignée : seule la clé primaire
     l'est. Une erreur ici apprendrait la mauvaise convention. */
  assert.ok(!/<u>num_service<\/u>#/.test(section), 'num_service est une clé étrangère simple');
});

test('les deux livres connectés renvoient vers l’encadré de notation', () => {
  const livres = [
    ['assets/data/smart-book-3si-2026.json', 36],
    ['assets/data/smart-book-2026.json', 33]
  ];
  for (const [fichier, numero] of livres) {
    const data = JSON.parse(lire(fichier));
    const fiche = data.items.find((item) => item.fiche === numero);
    assert.ok(fiche, fichier + ' : fiche ' + numero + ' absente');
    assert.match(fiche.titre, /notation du schéma \(1:1 · 1:N · N:N\)/, fichier);
    assert.ok(fiche.url.endsWith('/cours/sql.html#' + ANCRE), fichier + ' : ' + fiche.url);
    assert.match(fiche.titre, /relationnelles/, 'le titre garde son sujet d’origine');
  }
});

test('chaque destination des deux livres existe, ancre comprise', () => {
  for (const fichier of ['assets/data/smart-book-3si-2026.json', 'assets/data/smart-book-2026.json']) {
    const data = JSON.parse(lire(fichier));
    for (const item of data.items) {
      const url = new URL(item.url);
      assert.equal(url.origin, 'https://aymenessouyah.github.io', item.url);
      const chemin = url.pathname.slice('/STiV2.0/'.length);
      const html = lire(chemin);
      const ancre = url.hash.slice(1);
      assert.ok(html.includes('id="' + ancre + '"') || html.includes("id='" + ancre + "'"),
        fichier + ' → ' + item.url);
    }
  }
});

test('les livres gardent leur pagination et leur nombre de fiches', () => {
  /* Même contrôle que le lecteur (assets/js/smart-book.js) : les pages
     indexées se suivent de la première page utile à la dernière, et les fiches
     numérotées avancent de un en un.

     v573 : le manuel 3ème SI passe à l'édition 2026 — 81 pages, 9 pages de
     cours (p. 5 à 13, partie « Systèmes, technologies et Internet »), 53 fiches
     (p. 14 à 66) puis 15 pages de tableaux (p. 67 à 81). */
  for (const [fichier, pages, entrees, fiches, numerotees] of [
    ['assets/data/smart-book-3si-2026.json', 81, 77, 53, 53],
    ['assets/data/smart-book-2026.json', 100, 95, 95, 77]
  ]) {
    const data = JSON.parse(lire(fichier));
    assert.equal(data.pages, pages, fichier);
    assert.equal(data.fiches, fiches, fichier);
    assert.equal(data.items.length, entrees, fichier);
    if (data.entries !== undefined) assert.equal(data.entries, entrees, fichier);
    const premiere = pages - entrees + 1;
    let numero = 0;
    data.items.forEach((item, i) => {
      assert.equal(item.page, premiere + i, fichier + ' : page ' + (premiere + i));
      assert.ok(['cours', 'fiche', 'recap'].includes(item.kind || 'fiche'), fichier + ' : genre');
      if (!item.kind) item.kind = 'fiche';  /* l'ancien index 4ème SI ne porte pas de genre : fiches */
      if (item.kind === 'fiche') {
        numero += 1;
        assert.equal(item.fiche, numero, fichier + ' : fiche ' + numero);
      }
    });
    assert.equal(numero, numerotees, fichier + ' : toutes les fiches sont numérotées');
  }
});
