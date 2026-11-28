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
  [PDF]: '75b49bdb71256b504a8f27c5c519571d260cdbf209fd7e61a14cd062a04a47bf',
  [RES]: '6ba0be037abd2f3f273c3866fd6f9b356e32b311cf5eb54f41068199c7874e97',
  [COR]: '81d9f224e3c16603fea9e00ee3f10ef735064b1cffc3241e0196df116a5d385c',
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
  for (const nom of ['ressources/recharge.sql', 'ressources/style.css', 'ressources/logo.png'])
    assert.ok(res.includes(nom), nom);
  /* Le corrigé est UNE seule archive : le site complet + la partie SQL. */
  const cor = readFileSync(COR).toString('latin1');
  for (const nom of ['corrige/partie2_corrige.sql', 'corrige/site/index.html', 'corrige/site/connexion.php',
                     'corrige/site/ajout.php', 'corrige/site/liste.php', 'corrige/site/detail.php',
                     'corrige/site/style.css', 'corrige/site/logo.png'])
    assert.ok(cor.includes(nom), nom);
});

test('le sujet Recharge VE déposé par l’enseignant est présent en clair dans le dépôt', () => {
  for (const f of ['index.html', 'connexion.php', 'ajout.php', 'liste.php', 'detail.php', 'style.css', 'logo.png'])
    assert.ok(existsSync(`${BASE}/corrige/site/${f}`), f);
  for (const f of ['recharge.sql', 'style.css', 'logo.png'])
    assert.ok(existsSync(`${BASE}/ressources/${f}`), f);
  for (const f of ['enonce/Enonce_Recharge_VE.docx', 'corrige/Corrige_Recharge_VE.pdf',
                   'corrige/Corrige_Recharge_VE.docx', 'LISEZMOI.txt'])
    assert.ok(existsSync(`${BASE}/${f}`), f);
  const sql = read(`${BASE}/corrige/partie2_corrige.sql`);
  assert.match(sql, /USE recharge;/);
  assert.match(sql, /CREATE TABLE recharge \(/);
  assert.match(sql, /PRIMARY KEY AUTO_INCREMENT/);
  const fournies = read(`${BASE}/ressources/recharge.sql`);
  assert.match(fournies, /CREATE DATABASE recharge/);
  assert.match(fournies, /CREATE TABLE borne \(/);
  const cnx = read(`${BASE}/corrige/site/connexion.php`);
  assert.match(cnx, /"recharge"/);
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
  assert.ok(boite.includes('Recharge Véhicule électrique — TP pratique 3 h'));
  const bulle = accueil.split('id="sujets-bac-similaires"')[1].split('</article>')[0];
  assert.ok(!bulle.includes('recharge_bac_pratique'), 'le TP pratique reste hors de la bulle des sujets théoriques');
  /* Cases de suivi propres au nouveau sujet. */
  assert.match(read('cours/sql.html'), /data-exercise="tp-recharge-ve"/);
  assert.match(read('cours/php.html'), /data-exercise="tp-recharge-ve"/);
  assert.match(read('cours/javascript.html'), /data-exo-check="exo-js-tp-recharge-ve"/);
  /* Les pages non touchées depuis gardent la révision v705 ; celles que la
     capsule v706 modifie repartent avec sa révision. */
  const sw = read('sw.js');
  for (const page of ['./cours/sql.html', './cours/javascript.html'])
    assert.ok(sw.includes(`{ url: "${page}", revision: "recharge-ve-v705"`), page);
  for (const page of ['./exercices/series-exercices.html'])
    assert.ok(sw.includes(`{ url: "${page}", revision: "capsule-recharge-v706"`), page);
  for (const page of ['./index.html', './cours/php.html'])
    assert.ok(sw.includes(`{ url: "${page}", revision: "capsule-recharge-voiture-v707"`), page);
  assert.match(sw, /var VERSION_PUBLIEE = "v707";/);
});
