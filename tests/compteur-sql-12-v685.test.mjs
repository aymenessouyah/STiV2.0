import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(p,'utf8');
test('le cours SQL compte 12 exercices : chaque carte a sa case et le compteur suit les cartes',()=>{
 const html=read('cours/sql.html');
 const panneau=html.split('id="exercices"')[1].split('id="annexes"')[0];
 const cartes=[...panneau.matchAll(/<article[^>]*>([\s\S]*?)<\/article>/g)].map(m=>m[1]);
 assert.equal(cartes.length,12);
 for(const carte of cartes) assert.match(carte,/data-exercise="/);
 for(const id of ['zoo','club-sportif','style-bac-2024','web-bd','suivi-livreur']) assert.ok(html.includes(`data-exercise="${id}"`),id);
 const js=read('assets/js/cours-matieres.js');
 assert.match(js,/matiere === 'sql'/);
 assert.match(js,/data-course-panel="exercices"\] article/);
 assert.match(js,/faitsExo\+' \/ '\+totalExo\+' exercices faits'/);
 /* PHP garde le comptage historique par cases. */
 assert.match(js,/var totalExo = cases\.length, faitsExo = count;/);
});
