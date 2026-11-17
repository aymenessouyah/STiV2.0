import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=p=>readFileSync(p,'utf8');
test('la synthèse Livraison figure dans les trois vues et les ressources correspondent aux originaux',()=>{
 for(const file of ['index.html','cours/javascript.html','exercices/series-exercices.html']) {
  const html=read(file);assert.ok(html.includes('livraison_fastfood_énoncé.pdf'),file);assert.ok(html.includes('ressources-livraison.zip'),file);
 }
 for(const file of ['cours/javascript.html','exercices/series-exercices.html']){
  const html=read(file);const card=html.slice(html.indexOf('id="synthese-livraison"'));assert.match(card,/badge-synthese-gold/);assert.match(card,/titre-synthese/);
 }
 execFileSync('python3',['-c',`from pathlib import Path
from zipfile import ZipFile
p=Path('exercices/javascript/livraison')
expected=['livraison_fastfood.html','styles.css','script.js']+sorted(str(x.relative_to(p)) for x in (p/'ressources').rglob('*') if x.is_file())
with ZipFile(p/'ressources-livraison.zip') as z:
 assert set(z.namelist())==set(expected)
 for name in expected: assert z.read(name)==(p/name).read_bytes(), name
`]);
 const manifest=JSON.parse(read('offline-complete-manifest.json'));for(const name of ['livraison_fastfood_énoncé.pdf','ressources-livraison.zip'])assert.ok(manifest.files.some(f=>f.path.endsWith('livraison/'+name)));
});
