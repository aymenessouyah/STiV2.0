/*
  v708 — signalement « c’est encore 11:06 » : la capture montrait l’ancienne
  capsule du TP pratique (base recharge, v706), ouverte depuis la carte
  « Recharge Véhicule électrique » de l’onglet Exercices. Les deux capsules
  portent désormais leur contexte et leur durée dans chaque libellé, et la
  carte de l’ancien TP donne aussi l’accès direct à la capsule du cours.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = p => readFileSync(p, 'utf8');
const ANCIEN = 'capsule-recharge-php';
const NOUVEAU = 'capsule-recharge-voiture';
const MP4_ANCIEN = 'capsule-correction-recharge-php-v706.mp4';
const MP4_NOUVEAU = 'capsule-synthese-recharge-voiture-v707.mp4';
const REVISION = 'distinction-recharge-v708';

function extraireFonction(source, nom) {
  const debut = source.indexOf('function ' + nom + '(');
  assert.ok(debut > 0, `fonction ${nom} introuvable`);
  const ouverture = source.indexOf('{', debut);
  let profondeur = 0;
  for (let i = ouverture; i < source.length; i++) {
    if (source[i] === '{') profondeur++;
    else if (source[i] === '}') {
      profondeur--;
      if (profondeur === 0) return source.slice(debut, i + 1);
    }
  }
  throw new Error(`accolades non équilibrées pour ${nom}`);
}

test('v708 : la carte du TP pratique distingue les deux capsules et leurs durées', () => {
  const cours = read('cours/php.html');
  const carte = cours.split('<h3>Recharge Véhicule électrique</h3>')[1].split('</article>')[0];
  assert.match(carte, new RegExp(`data-video-open="${ANCIEN}"[^>]*>🎥 Capsule TP pratique : les 4 pages PHP \\(11:06\\)`));
  assert.match(carte, new RegExp(`data-video-open="${NOUVEAU}"[^>]*>🎥 Capsule du cours : Synthèse PHP n°2 \\(12:01\\)`));
  assert.ok(carte.includes(MP4_ANCIEN), 'le lien du TP garde le MP4 v706');
  assert.ok(carte.includes(MP4_NOUVEAU), 'le lien du cours pointe le MP4 v707');

  const zone = cours.split('id="s10c"')[1].split('</section>')[0];
  assert.match(zone, /Durée 12:01 · capsule du cours/);
  assert.match(zone, /base <code>station<\/code>/);
  assert.match(zone, /TP pratique/);
  assert.match(zone, /base <code>recharge<\/code>, durée 11:06/);

  assert.match(cours, /<h2>Recharge Véhicule électrique — les quatre pages PHP \(TP pratique\)<\/h2>/);
  assert.match(cours, /<h2>Recharge voiture électrique — Synthèse PHP n°2 \(cours\)<\/h2>/);
});

test('v708 : les autres accès au sujet Bac pratique affichent aussi le bon choix', () => {
  const accueil = read('index.html');
  const details = accueil.split('<summary>Recharge Véhicule électrique — TP pratique 3 h</summary>')[1].split('</details>')[0];
  assert.match(details, /Capsule TP pratique : les 4 pages PHP \(11:06\)/);
  assert.match(details, /Capsule du cours : Synthèse PHP n°2 \(12:01\)/);
  assert.ok(details.includes(`data-video-open="${NOUVEAU}"`));

  const series = read('exercices/series-exercices.html');
  const cartes = series.split('<h3>Recharge Véhicule électrique</h3>')
    .slice(1).map(s => s.split('</div></div>')[0]);
  const cartePhp = cartes.find(c => c.includes(`data-video-open="${ANCIEN}"`));
  assert.ok(cartePhp, 'carte PHP du catalogue des séries');
  assert.match(cartePhp, /Capsule TP pratique : les 4 pages PHP \(11:06\)/);
  assert.match(cartePhp, /Capsule du cours : Synthèse PHP n°2 \(12:01\)/);
  assert.ok(cartePhp.includes(`data-video-open="${NOUVEAU}"`));
});

test('v708 : le catalogue et le lecteur ne peuvent plus confondre les deux slugs', () => {
  const app = read('assets/js/app.js');
  const blocAncien = app.split(`id: "${ANCIEN}"`)[1].split('}')[0];
  const blocNouveau = app.split(`id: "${NOUVEAU}"`)[1].split('}')[0];
  assert.match(blocAncien, /\(TP pratique\)/);
  assert.match(blocAncien, /dureeTexte: "11:06"/);
  assert.ok(blocAncien.includes(MP4_ANCIEN));
  assert.match(blocNouveau, /Synthèse PHP n°2 \(cours\)/);
  assert.match(blocNouveau, /dureeTexte: "12:01"/);
  assert.ok(blocNouveau.includes(MP4_NOUVEAU));

  const lecteur = read('assets/js/lecteur-commun.js');
  assert.match(lecteur, new RegExp(`'${ANCIEN}': \\['php','[^']*\\(TP pratique\\)'\\]`));
  assert.match(lecteur, new RegExp(`'${NOUVEAU}': \\['php','[^']*Synthèse PHP n°2 \\(cours\\)'\\]`));

  /* slugPour parcourt les clés dans l’ordre de déclaration : vérifier sur la
     vraie fonction qu’un slug ne peut pas être happé par l’autre. */
  const cles = [...lecteur.matchAll(/^    '([^']+)': \[/gm)].map(m => m[1]);
  const meta = Object.fromEntries(cles.map(c => [c, ['php', c]]));
  const slugPour = new Function('meta', extraireFonction(lecteur, 'slugPour') + '; return slugPour;')(meta);
  assert.equal(slugPour(ANCIEN), ANCIEN);
  assert.equal(slugPour(NOUVEAU), NOUVEAU);
  assert.equal(slugPour(MP4_NOUVEAU), MP4_NOUVEAU,
    'le nom de fichier reste transmis au lecteur historique, qui le reconnaît par sa garde v707');

  const protection = read('assets/js/protection.js');
  assert.match(protection, /if \(estRechargePhp\) url = prefixeAssetsSTI\(\) \+ "videos\/capsule-correction-recharge-php-v706\.mp4";/);
  assert.match(protection, /if \(estRechargeVoiture\) url = prefixeAssetsSTI\(\) \+ "videos\/capsule-synthese-recharge-voiture-v707\.mp4";/);
  assert.match(protection, /if \(estRechargePhp\) titre = titreOpt \|\| "🎥 Recharge Véhicule électrique — les quatre pages PHP du corrigé \(TP pratique\)";/);
  assert.match(protection, /if \(estRechargeVoiture\) titre = titreOpt \|\| "🎥 Recharge voiture électrique — Synthèse PHP n°2 \(cours\)";/);
});

test('v708 : les fichiers clarifiés repartent chez les appareils installés', () => {
  const sw = read('sw.js');
  assert.match(sw, /var VERSION_PUBLIEE = "v708";/);
  for (const page of ['./cours/php.html', './index.html', './exercices/series-exercices.html',
                      './assets/js/app.js', './assets/js/lecteur-commun.js'])
    assert.ok(sw.includes(`{ url: "${page}", revision: "${REVISION}"`), page);
  /* Le lecteur historique et les MP4 ne changent pas dans ce lot. */
  assert.ok(sw.includes('{ url: "./assets/js/protection.js", revision: "capsule-recharge-voiture-v707"'));
  assert.ok(sw.includes(`"./assets/videos/${MP4_ANCIEN}"`));
  assert.ok(sw.includes(`"./assets/videos/${MP4_NOUVEAU}"`));
});
