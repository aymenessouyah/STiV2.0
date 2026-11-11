import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const path='outils/capsule-sql7/storyboard-v6.json';
test('le storyboard reprend le corrigé rectifié et exécute ses requêtes',()=>{
 const before=readFileSync(path,'utf8');
 const check=String.raw`import json, sqlite3
s=json.load(open('outils/capsule-sql7/storyboard-v6.json',encoding='utf-8'))
c=sqlite3.connect(':memory:');c.executescript(open('exercices/sql/serie-7/boutique.sql',encoding='utf-8').read())
for mission in s['missions']:
 for k in ('jointure','sous_requete'):
  block=mission.get(k)
  if block: assert [list(x) for x in c.execute(block['sql']).fetchall()]==block['resultat']['lignes']
for item in s['supplements']:
 assert [list(x) for x in c.execute(item['sql']).fetchall()]==item['resultat']['lignes']
 assert [list(x) for x in c.execute(item['interieur']['sql']).fetchall()]==item['interieur']['resultat']['lignes']`;
 const run=spawnSync('python3',['-c',check],{encoding:'utf8'});
 assert.equal(run.status,0,run.stderr);
 const d=JSON.parse(before);assert.equal(d.tables.VENDEUR.lignes.length,4);assert.equal(d.tables.VENTE.lignes.length,12);
 assert.equal(d.missions.length,5);assert.equal(d.missions[0].sous_requete,null);assert.equal(d.missions[1].sous_requete,null);
 assert.deepEqual(d.missions[2].sous_requete.resultat.lignes,[['Sana'],['Karim']]);
 assert.deepEqual(d.missions[3].sous_requete.resultat.lignes,[['Karim'],['Lina']]);
 assert.deepEqual(d.missions[4].jointure.resultat.lignes,[['Sana',795],['Lina',590]]);
 assert.deepEqual(d.missions[4].sous_requete.resultat.lignes,[['Sana'],['Lina']]);
 for(const m of d.missions.filter(m=>m.sous_requete)) {
  assert.match(m.sous_requete.sql,/WHERE\s+id_vendeur\s+IN/i);
  assert.doesNotMatch(m.sous_requete.sql,/FROM\s*\(/i);
 }
 assert.ok(Math.abs(d.supplements[0].interieur.resultat.lignes[0][0]-718/12)<1e-9);
 assert.deepEqual(d.supplements[0].resultat.lignes,[['Jean',60],['Robe',90],['Baskets',100],['Bottines',120],['Parfum',150]]);
 assert.deepEqual(d.supplements[1].resultat.lignes,[['Walid']]);assert.deepEqual(d.supplements[2].resultat.lignes,[['Parfum',150]]);
});
