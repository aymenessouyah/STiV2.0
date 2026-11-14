import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read = p => readFileSync(p,'utf8');
const dir = 'exercices/javascript/serie-synthese/';
const files = ['enonce-synthese-javascript.pdf','corrige-synthese-javascript.pdf'];
test('la synthèse suit les séries JavaScript dans les deux catalogues', () => {
  const cours=read('cours/javascript.html'), exos=read('exercices/series-exercices.html');
  for(const content of [cours,exos]) {
    const js=content.indexOf('Série 6 — TP Train'), synth=content.indexOf('Série de Synthèse JavaScript',js), defis=content.indexOf('Les 37 Défis',synth);
    assert.ok(js>=0 && synth>js && defis>synth);
    for(const name of files) assert.ok(content.includes('javascript/serie-synthese/'+name));
  }
  assert.match(read('cours/php.html'),/<h3>Série 6 de Synthèse PHP<\/h3>/);
  assert.match(exos,/<h3>Série 6 de Synthèse PHP<\/h3>/);
});
test('PDF disponibles sur mobile et hors ligne avec empreintes correctes', () => {
 const cours=read('cours/javascript.html'), exos=read('exercices/series-exercices.html');
 const sw=read('sw.js').split('var OFFLINE_LIST = [')[1].split('];')[0];
 const m=JSON.parse(read('offline-complete-manifest.json'));
 for(const f of files){
  const path=dir+f,b=readFileSync(path),item=m.files.find(x=>x.path===path);
  assert.equal(b.subarray(0,5).toString(),'%PDF-'); assert.ok(sw.includes(`"./${path}"`));
  assert.equal(item?.bytes,b.length);assert.equal(item?.gitSha,createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex'));
  for(const content of [cours,exos]) assert.match(content,new RegExp(f.replaceAll('.','\\.')+'" data-pdf-natif-mobile target="_blank" rel="noopener"'));
 }
});
