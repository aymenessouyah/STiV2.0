import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const path='outils/capsule-sql7/storyboard-v5.json';

test('le storyboard D/E est reproductible et conserve les données du corrigé', () => {
 const before=readFileSync(path,'utf8');
 const p=spawnSync('python3',['outils/capsule-sql7/preparer-v5.py'],{encoding:'utf8'});
 assert.equal(p.status,0,p.stderr); assert.equal(readFileSync(path,'utf8'),before);
 const s=JSON.parse(before); assert.equal(s.tables.VENDEUR.lignes.length,4);assert.equal(s.tables.VENTE.lignes.length,12);
 assert.equal(s.missions.length,5);
 assert.equal(s.missions[0].jointure.resultat.lignes.length,12); assert.equal(s.missions[0].sous_requete,null);
 assert.deepEqual(s.missions[1].jointure.resultat.lignes,[['Sana',1045],['Karim',766],['Lina',620]]);
 assert.deepEqual(s.missions[1].sous_requete.resultat.lignes,[['Sana',1045],['Karim',766],['Lina',620],['Walid',null]]);
 assert.deepEqual(s.missions[2].sous_requete.resultat.lignes,[['Sana'],['Karim']]);
 assert.deepEqual(s.missions[3].jointure.resultat.lignes,[['Karim',3],['Lina',3]]);
 assert.deepEqual(s.missions[4].jointure.resultat.lignes,[['Sana',795],['Lina',590]]);
 assert.deepEqual(s.missions[4].sous_requete.resultat.lignes,[['Sana',795],['Lina',590]]);
});
