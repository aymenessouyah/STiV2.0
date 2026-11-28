/*
  v709 — demande de l’enseignant : dans « Similaire Bac Pratique », on élimine
  la vidéo de 12:01 et on laisse seulement celle de 11:06. La capsule de la
  Synthèse PHP n°2 n’est pas supprimée : elle reste à sa place, au chapitre 10
  du cours PHP (§10.3) et dans la vidéothèque.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = p => readFileSync(p, 'utf8');
const ANCIEN = 'capsule-recharge-php';
const NOUVEAU = 'capsule-recharge-voiture';
const MP4_ANCIEN = 'capsule-correction-recharge-php-v706.mp4';
const MP4_NOUVEAU = 'capsule-synthese-recharge-voiture-v707.mp4';

test('v709 : les cartes Similaire Bac Pratique Recharge ne proposent que 11:06', () => {
  const cours = read('cours/php.html');
  const carteCours = cours.split('<span class="badge-bac-pratique">Similaire Bac Pratique</span><h3>Recharge Véhicule électrique</h3>')[1].split('</article>')[0];
  assert.ok(carteCours.length > 100, 'carte Bac pratique Recharge du cours PHP');
  assert.ok(carteCours.includes(`data-video-open="${ANCIEN}"`));
  assert.ok(carteCours.includes(MP4_ANCIEN));
  assert.match(carteCours, /Capsule TP pratique : les 4 pages PHP \(11:06\)/);
  assert.ok(!carteCours.includes(NOUVEAU), 'cours PHP : aucun slug de la capsule du cours dans la carte Bac pratique');
  assert.ok(!carteCours.includes(MP4_NOUVEAU), 'cours PHP : aucun MP4 12:01 dans la carte Bac pratique');
  assert.ok(!carteCours.includes('12:01'), 'cours PHP : aucune durée 12:01 dans la carte Bac pratique');

  const accueil = read('index.html');
  const details = accueil.split('<summary>Recharge Véhicule électrique — TP pratique 3 h</summary>')[1].split('</details>')[0];
  assert.ok(details.includes(`data-video-open="${ANCIEN}"`));
  assert.ok(!details.includes(NOUVEAU), 'accueil : aucun slug 12:01 dans le bloc Bac pratique');
  assert.ok(!details.includes('12:01'), 'accueil : aucune durée 12:01 dans le bloc Bac pratique');

  const series = read('exercices/series-exercices.html');
  const carteSeries = series.split('<h3>Recharge Véhicule électrique</h3>')
    .slice(1).map(s => s.split('</div></div>')[0])
    .find(c => c.includes(`data-video-open="${ANCIEN}"`));
  assert.ok(carteSeries, 'carte Bac pratique du catalogue des séries');
  assert.ok(!carteSeries.includes(NOUVEAU), 'séries : aucun slug 12:01 dans la carte Bac pratique');
  assert.ok(!carteSeries.includes('12:01'), 'séries : aucune durée 12:01 dans la carte Bac pratique');
});

test('v709 : la capsule 12:01 reste disponible à sa place dans le cours', () => {
  const cours = read('cours/php.html');
  const zone = cours.split('id="s10c"')[1].split('</section>')[0];
  assert.ok(zone.includes(`data-video-open="${NOUVEAU}"`), 'bouton 12:01 du §10.3 conservé');
  assert.ok(zone.includes(MP4_NOUVEAU), 'téléchargement MP4 du §10.3 conservé');
  assert.match(zone, /Durée 12:01 · capsule du cours/);
  assert.ok(cours.includes(`data-video-state="${NOUVEAU}"`), 'carte 12:01 de la vidéothèque PHP conservée');
  assert.ok(cours.includes(`data-video-duree="${NOUVEAU}">12:01</span>`));

  const app = read('assets/js/app.js');
  const bloc = app.split(`id: "${NOUVEAU}"`)[1].split('}')[0];
  assert.match(bloc, /dureeTexte: "12:01"/);
  assert.ok(bloc.includes(MP4_NOUVEAU));

  const sw = read('sw.js');
  assert.match(sw, /var VERSION_PUBLIEE = "v709";/);
  for (const page of ['./cours/php.html', './index.html', './exercices/series-exercices.html'])
    assert.ok(sw.includes(`{ url: "${page}", revision: "bac-pratique-recharge-seule-v709"`), page);
  assert.ok(sw.includes(`"./assets/videos/${MP4_NOUVEAU}"`), 'MP4 12:01 toujours livré hors-ligne');
});
