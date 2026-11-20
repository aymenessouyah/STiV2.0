import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=p=>readFileSync(p,'utf8');
const attendus={
 'exercices/sujets-bac/suivi-livreur-enonce.pdf':'904d3b224f4687718cdef19ba4561850a6ccb9ce68a5f46e6b8bf3ef94805336',
 'exercices/sujets-bac/suivi-livreur-corrige.pdf':'396e197696fcba5b1430071410aad36ab6b312f1d94c27cad9a022883d0d43c0'};
test('le sujet Suivi du livreur garde les PDF fournis, sa place après les synthèses et le hors ligne',()=>{
 const manifest=JSON.parse(read('offline-complete-manifest.json')),sw=read('sw.js');
 for(const [path,sha] of Object.entries(attendus)){
  const b=readFileSync(path);assert.equal(b.subarray(0,5).toString(),'%PDF-');
  assert.equal(createHash('sha256').update(b).digest('hex'),sha);
  assert.ok(manifest.files.some(f=>f.path===path&&f.bytes===b.length));
  assert.ok(sw.includes(`"./${path}"`));
 }
 for(const file of ['index.html','cours/javascript.html','cours/sql.html','cours/php.html','exercices/series-exercices.html']){
  const html=read(file);assert.ok(html.includes('suivi-livreur-enonce.pdf'),file);assert.ok(html.includes('suivi-livreur-corrige.pdf'),file);
  assert.ok(html.indexOf('Web et bases de données')<html.indexOf('Suivi du livreur'),file);
 }
 for(const file of ['cours/javascript.html','cours/sql.html','cours/php.html']) assert.match(read(file),/<article[^>]*data-sujet-bac[^>]*>(?:(?!<article)[\s\S])*?<h3>Suivi du livreur<\/h3>/);
 const catalogue=read('exercices/series-exercices.html');
 for(const id of ['javascript','bdd','php']){
  const bloc=catalogue.split(`id="${id}"`)[1].split('</section>')[0];
  assert.ok(bloc.includes('suivi-livreur-enonce.pdf'),id);
 }
 assert.match(read('index.html'),/Trois sujets d’entraînement complets/);
});
