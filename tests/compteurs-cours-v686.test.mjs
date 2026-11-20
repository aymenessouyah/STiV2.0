import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(p,'utf8');
test('tous les cours comptent leurs cartes d’exercices, chacune cochable',()=>{
 /* PHP : 9 cartes (séries 1 à 6 + 3 sujets bac) */
 const php=read('cours/php.html'), panneauPhp=php.split('id="exercices"')[1].split('id="videos"')[0];
 const cartesPhp=[...panneauPhp.matchAll(/<article[^>]*>([\s\S]*?)<\/article>/g)].map(m=>m[1]);
 assert.equal(cartesPhp.length,9);
 for(const c of cartesPhp) assert.match(c,/data-exercise="/);
 for(const id of ['style-bac-2024','web-bd','suivi-livreur']) assert.ok(php.includes(`data-exercise="${id}"`),id);
 const matieres=read('assets/js/cours-matieres.js');
 assert.match(matieres,/var cartes = \$\$\('\[data-course-panel="exercices"\] article'\)/);
 assert.doesNotMatch(matieres,/if \(matiere === 'sql'\) \{\s*\/\* Le total compte/);
 /* JavaScript : 27 exercices + 15 cartes de séries, synthèses, sujets, défis et projets */
 const js=read('cours/javascript.html');
 assert.equal((js.match(/data-exo-check="/g)||[]).length,42);
 for(const id of ['exo-js-serie1','exo-js-serie6','exo-js-synthese','exo-js-livraison','exo-js-style-bac','exo-js-web-bd','exo-js-suivi-livreur','exo-js-defis37','exo-js-projet1','exo-js-projet3']) assert.ok(js.includes(`data-exo-check="${id}"`),id);
 assert.match(js,/id="exoProgressText">0 \/ 42 exercices faits/);
 assert.match(read('assets/js/cours-javascript.js'),/sti-4si-autorise/);
 /* HTML5 : 18 cartes cochables ; CSS3 : 13 */
 const html5=read('cours/html5.html');
 assert.equal([...html5.matchAll(/<article[^>]*>/g)].filter(m=>m[0].includes('exo-card-full')&&m[0].includes('data-exo-id=')).length,18);
 for(const id of ['exo-tp-evenements','exo-tp-formulaire-tableau','exo-tp-display-float','exo-emploi-temps','exo-formulaire-inscription']) assert.ok(html5.includes(`data-exo-id="${id}"`),id);
 assert.match(html5,/id="exoGlobalCounter">0 \/ 18 exercices faits/);
 const css3=read('cours/css3.html');
 assert.equal([...css3.matchAll(/<article[^>]*>/g)].filter(m=>m[0].includes('exo-card-full')&&m[0].includes('data-exo-id=')).length,13);
 for(const id of ['exo-tp-evenements','exo-tp-formulaire-tableau','exo-tp-display-float','exo-tp-transitions']) assert.ok(css3.includes(`data-exo-id="${id}"`),id);
 assert.match(css3,/id="exoProgressText">0 \/ 13 exercices faits/);
});
