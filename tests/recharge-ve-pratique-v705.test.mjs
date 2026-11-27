import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read = p => readFileSync(p, 'utf8');

const BASE = 'exercices/sujets-bac/recharge_bac_pratique';
const PDF = `${BASE}/enonce/Enonce_Recharge_VE.pdf`;
const RES = `${BASE}/Recharge_VE_Ressources.zip`;
const COR = `${BASE}/corrige/Recharge_VE_Corrige.zip`;
const attendus = {
  [PDF]: '0c2ce4fa89120e8e87ed0e9fc5ed18b9a34806f99bfba431d991739d138d19b3',
  [RES]: '88515ea866559d5b181b9d6f71a28cdc81c8cb7920a06c2a85f0ca87fbc8d37c',
  [COR]: 'a618f548fa0b1244588e5a08f0a575e66907dbd3c76ee66f05392662f0e7f6c8',
};

test('le sujet Recharge VE est livré : énoncé PDF, ressources ZIP et corrigé ZIP unique', () => {
  const manifest = JSON.parse(read('offline-complete-manifest.json')), sw = read('sw.js');
  for (const [path, sha] of Object.entries(attendus)) {
    const b = readFileSync(path);
    assert.equal(createHash('sha256').update(b).digest('hex'), sha, path);
    assert.ok(manifest.files.some(f => f.path === path && f.bytes === b.length), path);
    assert.ok(sw.includes(`"./${path}"`), path);
    assert.ok(sw.includes(`{ url: "./${path}", revision: "recharge-ve-v705"`), path);
  }
  assert.equal(readFileSync(PDF).subarray(0, 5).toString(), '%PDF-');
  for (const zip of [RES, COR]) assert.equal(readFileSync(zip).subarray(0, 2).toString(), 'PK', zip);
  /* L'archive des ressources contient le kit de départ de l'élève. */
  const res = readFileSync(RES).toString('latin1');
  for (const nom of ['ressources/logo.svg', 'ressources/style.css', 'ressources/LISEZ-MOI.txt'])
    assert.ok(res.includes(nom), nom);
  /* Le corrigé est UNE seule archive : le site complet + la partie SQL. */
  const cor = readFileSync(COR).toString('latin1');
  for (const nom of ['corrige/partie2_corrige.sql', 'corrige/site/index.html', 'corrige/site/inscription.html',
                     'corrige/site/validation.js', 'corrige/site/ajouter.php', 'corrige/site/liste.php',
                     'corrige/site/modifier.php', 'corrige/site/statistiques.php', 'corrige/site/style.css',
                     'corrige/site/logo.svg'])
    assert.ok(cor.includes(nom), nom);
});

test('le corrigé du sujet Recharge VE est présent en clair dans le dépôt', () => {
  for (const f of ['index.html', 'inscription.html', 'validation.js', 'ajouter.php', 'liste.php',
                   'modifier.php', 'statistiques.php', 'style.css', 'logo.svg', 'LISEZ-MOI.txt'])
    assert.ok(existsSync(`${BASE}/corrige/site/${f}`), f);
  for (const f of ['logo.svg', 'style.css', 'LISEZ-MOI.txt'])
    assert.ok(existsSync(`${BASE}/ressources/${f}`), f);
  const sql = read(`${BASE}/corrige/partie2_corrige.sql`);
  assert.match(sql, /CREATE DATABASE IF NOT EXISTS station;/);
  assert.match(sql, /CREATE TABLE recharges \(/);
  assert.match(sql, /Id VARCHAR\(10\) PRIMARY KEY/);
  const stats = read(`${BASE}/corrige/site/statistiques.php`);
  assert.match(stats, /0\.300/);
  assert.match(stats, /0\.950/);
});

test('le sujet Recharge VE porte la catégorie Similaire Bac Pratique sur toutes les pages', () => {
  for (const file of ['index.html', 'cours/javascript.html', 'cours/sql.html', 'cours/php.html', 'exercices/series-exercices.html']) {
    const html = read(file);
    /* Le catalogue, déjà dans exercices/, vise sujets-bac/… ; les autres pages visent le chemin complet. */
    assert.ok(html.includes('Enonce_Recharge_VE.pdf'), file);
    assert.ok(html.includes('Recharge_VE_Ressources.zip'), file);
    assert.ok(html.includes('Recharge_VE_Corrige.zip'), file);
    if (file !== 'exercices/series-exercices.html') assert.ok(html.includes(PDF), file);
    assert.ok(html.includes('<span class="badge-bac-pratique">Similaire Bac Pratique</span>'), file);
    assert.match(html, /\.badge-bac-pratique\{[^}]*#f97316|badge-bac-pratique\{[^}]*background:#ffedd5/, file);
  }
  /* Une carte par section (javascript, bdd, php) dans le catalogue des séries. */
  const catalogue = read('exercices/series-exercices.html');
  assert.equal(catalogue.split('<h3>Recharge Véhicule électrique</h3>').length - 1, 3);
  for (const id of ['javascript', 'bdd', 'php']) {
    const bloc = catalogue.split(`id="${id}"`)[1].split('</section>')[0];
    assert.ok(bloc.includes('sujets-bac/recharge_bac_pratique/enonce/Enonce_Recharge_VE.pdf'), id);
    assert.ok(bloc.includes('Recharge Véhicule électrique'), id);
  }
  /* Le sujet a son entrée dans la boîte « Similaire Bac Pratique » de l'accueil. */
  const accueil = read('index.html');
  const boite = accueil.split('id="similaire-bac-pratique"')[1].split('</article>')[0];
  assert.ok(boite.includes(PDF));
  assert.ok(boite.includes('Recharge Véhicule électrique'));
  const bulle = accueil.split('id="sujets-bac-similaires"')[1].split('</article>')[0];
  assert.ok(!bulle.includes('recharge_bac_pratique'), 'le TP pratique reste hors de la bulle des sujets théoriques');
  /* Cases de suivi propres au nouveau sujet. */
  assert.match(read('cours/sql.html'), /data-exercise="tp-recharge-ve"/);
  assert.match(read('cours/php.html'), /data-exercise="tp-recharge-ve"/);
  assert.match(read('cours/javascript.html'), /data-exo-check="exo-js-tp-recharge-ve"/);
  /* Les cinq pages modifiées repartent avec la révision de la publication. */
  const sw = read('sw.js');
  for (const page of ['./index.html', './cours/sql.html', './cours/php.html', './cours/javascript.html', './exercices/series-exercices.html'])
    assert.ok(sw.includes(`{ url: "${page}", revision: "recharge-ve-v705"`), page);
  assert.match(sw, /var VERSION_PUBLIEE = "v705";/);
});
