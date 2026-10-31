/*
  v594 — le logo du cours « Systèmes, technologies et Internet ».

  Le professeur a fourni une illustration (loupe sur le Wi-Fi, le cloud, la clé
  et le téléphone) à utiliser comme « emoji » du cours. Elle remplace l'émoji 🖥️
  partout où le cours est présenté : page du cours, carte de l'accueil, cartes
  « en cours » et progression par matière du tableau de bord.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (chemin) => readFileSync(join(root, chemin), 'utf8');
const octets = (chemin) => readFileSync(join(root, chemin));

const LOGO_512 = 'assets/images/systemes-technologies-internet.png';
const LOGO_96 = 'assets/images/systemes-technologies-internet-96.png';

function dimensions(png) {
  /* En-tête PNG : signature, puis IHDR à l'offset 16 (largeur, hauteur). */
  assert.equal(png.subarray(1, 4).toString('latin1'), 'PNG', 'fichier PNG');
  return { largeur: png.readUInt32BE(16), hauteur: png.readUInt32BE(20) };
}

test('v594 : le logo existe en deux tailles carrées', () => {
  const grand = dimensions(octets(LOGO_512));
  const petit = dimensions(octets(LOGO_96));
  assert.deepEqual(grand, { largeur: 512, hauteur: 512 });
  assert.deepEqual(petit, { largeur: 96, hauteur: 96 });
  /* Un logo d'interface reste léger : au-delà de 400 Ko, il ralentirait l'accueil. */
  assert.ok(statSync(join(root, LOGO_512)).size < 400 * 1024, 'logo 512 raisonnable');
  assert.ok(statSync(join(root, LOGO_96)).size < 40 * 1024, 'vignette 96 légère');
});

test('v594 : le logo remplace l’émoji sur les pages qui présentent le cours', () => {
  const accueil = lire('index.html');
  /* La carte « Systèmes, technologies et Internet » de l'accueil. */
  const carte = accueil.slice(accueil.indexOf('data-subject="sti"'));
  const debutCarte = carte.slice(0, carte.indexOf('</article>'));
  assert.ok(debutCarte.includes(LOGO_96), 'la carte de l’accueil affiche le logo');
  assert.ok(!debutCarte.includes('🖥️'), 'plus d’émoji dans la carte');

  const cours = lire('cours/systemes-technologies-internet.html');
  assert.ok(cours.includes(LOGO_96), 'la pastille du cours affiche le logo');
  assert.match(cours, new RegExp('<img src="\\.\\./' + LOGO_96 + '"'), 'chemin relatif correct');
});

test('v594 : le tableau de bord utilise le logo pour la matière STI', () => {
  const app = lire('assets/js/app.js');
  assert.match(app, new RegExp('image: "' + LOGO_96 + '"'), 'la matière STI porte son logo');
  /* Cartes « en cours » et progression par matière : image au lieu de l'émoji. */
  assert.match(app, /matiere\.image[\s\S]{0,120}welcome-course__icon|welcome-course__icon[\s\S]{0,200}matiere\.image/);
  assert.match(app, /m\.image[\s\S]{0,60}<img src=/);
  assert.match(app, /<img src="' \+ pref \+ m\.image \+ '"/);
  /* Les autres matières gardent leur émoji de secours. */
  assert.match(app, /: '<span style="font-size:1\.3rem">' \+ m\.icone/);
});

test('v594 : le logo est servi hors ligne et versionné', () => {
  const sw = lire('sw.js');
  const delta = sw.split('var UPDATE_FILES = [')[1].split('];')[0];
  const complet = sw.split('var OFFLINE_LIST = [')[1].split('];')[0];
  for (const chemin of ['./' + LOGO_512, './' + LOGO_96]) {
    assert.ok(delta.includes('url: "' + chemin + '", revision: "cours-sti-v594"'), 'delta : ' + chemin);
    assert.ok(complet.includes('"' + chemin + '"'), 'cache complet : ' + chemin);
  }
  assert.match(sw, /var VERSION_PUBLIEE = "v594";/);

  const manifeste = JSON.parse(lire('offline-complete-manifest.json'));
  for (const chemin of [LOGO_512, LOGO_96]) {
    assert.ok(manifeste.files.some((f) => f.path === chemin), 'manifeste : ' + chemin);
  }
});
