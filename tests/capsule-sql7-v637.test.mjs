import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const read=p=>readFileSync(p,'utf8');
test('la nouvelle capsule est liée depuis les exercices et les vidéos de série 7',()=>{
 const html=read('cours/sql.html');
 const ex=html.split('<section id="exercices"')[1].split('<section id="annexes"')[0];
 assert.match(ex, /href="#capsule-sql-serie7"/);
 assert.match(html,/sql-serie7-having-groupby-sous-requetes-v2\.mp4/);
 assert.doesNotMatch(html,/sql-serie7-group-by-having\.mp4/);
 const s=read('outils/capsule-sql7/render-v2.py');
 for (const phrase of ['RÉSULTATS IDENTIQUES','RÉSULTATS DIFFÉRENTS','PIÈGE 1','PIÈGE 2','PIÈGE 3','HAVING COUNT(*) = 0','sales_frame','Sous-requête IN','Sous-requête FROM']) assert.ok(s.includes(phrase),phrase);
});
test('les requêtes affichées correspondent aux résultats annoncés',()=>{
 const py=String.raw`
import ast, sqlite3
s=open('outils/capsule-sql7/render-v2.py',encoding='utf-8').read()
tree=ast.parse(s); x={}
for node in tree.body:
 if isinstance(node,ast.Assign) and len(node.targets)==1 and isinstance(node.targets[0],ast.Name):
  try: x[node.targets[0].id]=eval(compile(ast.Expression(node.value),'<expression>','eval'),{'__builtins__':{}},x)
  except Exception: pass
c=sqlite3.connect(':memory:'); c.executescript('CREATE TABLE VENDEUR(id_vendeur INTEGER, nom TEXT); CREATE TABLE VENTE(id INTEGER, article TEXT, categorie TEXT, quantite INTEGER, prix_unitaire INTEGER, id_vendeur INTEGER);')
c.executemany('INSERT INTO VENDEUR VALUES (?,?)',[(1,'Sana'),(2,'Karim'),(3,'Lina'),(4,'Walid')]);c.executemany('INSERT INTO VENTE VALUES (?,?,?,?,?,?)',x['sale'])
def r(k): return c.execute(x[k]).fetchall()
assert r('q1') == [('Sana',1045),('Karim',766),('Lina',620)]
assert r('q4') == [('Sana',795)]
assert r('inner') == [(1,),(2,)]
assert r('qin') == [('Sana',),('Karim',)]
assert r('temp') == [(1,1045),(2,766),(3,620)]
assert r('qfrom') == [('Sana',1045),('Karim',766)]
assert r('ql1') == [('Sana',1045),('Karim',766),('Lina',620)]
assert r('qr1') == [('Sana',1045),('Karim',766),('Lina',620),('Walid',None)]
assert r('ql2') == r('qr2') == [('Sana',1045),('Karim',766)]
assert r('ql3') == [] and r('qr3') == [('Walid',)]
assert r('qavgfull') == [(1,1045)]
assert abs(2431/3-810.333333333)<.0001
assert r('qbad3') == [('Sana',2431),('Karim',2431),('Lina',2431),('Walid',2431)]
try: r('qbad1'); raise AssertionError('SUM dans WHERE doit échouer')
except sqlite3.OperationalError: pass
`;
 const p=spawnSync('python3',['-c',py],{encoding:'utf8'}); assert.equal(p.status,0,p.stderr);
});
