import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

test('la comparaison v4 conserve les requêtes demandées et leurs résultats', () => {
 const code = String.raw`
import ast, sqlite3
s=open('outils/capsule-sql7/render-v3.py', encoding='utf8').read()
t=ast.parse(s); q={}
for n in t.body:
 if isinstance(n, ast.Assign) and len(n.targets)==1 and isinstance(n.targets[0],ast.Name) and n.targets[0].id in ('q1','q2','q3','q4'):
  q[n.targets[0].id]=ast.literal_eval(n.value)
c=sqlite3.connect(':memory:');c.executescript(open('exercices/sql/serie-7/boutique.sql',encoding='utf8').read())
assert c.execute(q['q1']).fetchall()==[(1,1045),(2,766),(3,620)]
assert c.execute(q['q2']).fetchall()==[(1,1045),(2,766)]
assert c.execute(q['q3']).fetchall()==[('Sana',),('Karim',)]
assert c.execute(q['q4']).fetchall()==[('Sana',1045),('Karim',766)]
`;
 const result=spawnSync('python3',['-c',code],{encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);
 const renderer=readFileSync('outils/capsule-sql7/render-v4.py','utf8');
 assert.match(renderer,/DIFFÉRENTS : les colonnes affichées ne sont pas les mêmes/);
 assert.match(renderer,/IDENTIQUES : les vendeurs retenus sont Sana et Karim/);
 assert.match(renderer,/RÉSULTAT : 2 LIGNES/);
});
