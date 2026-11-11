import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import vm from 'node:vm';
const read=p=>readFileSync(p,'utf8');
test('les vidéos 1 à 3 et leurs commandes disparaissent, sans supprimer les corrigés',()=>{
 const sw=read('sw.js'), offline=sw.split('var OFFLINE_LIST = [')[1].split('];')[0];
 const m=JSON.parse(read('offline-complete-manifest.json'));
 for (let i=1;i<=3;i++){
  const path=`assets/videos/sql-serie${i}.mp4`;
  assert.equal(existsSync(path),false);assert.ok(!offline.includes(path));assert.ok(!m.files.some(x=>x.path===path));
  assert.ok(!read('assets/js/sante.js').includes(path));
  assert.doesNotMatch(read('exercices/series-exercices.html'),new RegExp(`ouvrirVideoPasAPasSTI\\('sql-serie${i}'`));
  const page=read(`exercices/sql/Tp${i}-Correction-bd.html`);assert.doesNotMatch(page,/onclick="ouvrirVideoCorrigeeSerie\(\)"/);assert.match(page,/Corrigé Série/);
 }
 assert.ok(existsSync('assets/videos/sql-serie4.mp4'));
});
test('les anciennes vidéos sont bloquées même si présentes en cache, y compris avec Range',async()=>{
 const base='https://example.test/site/';const events={};
 const caches={async match(){return new Response('ancienne vidéo')},async open(){return {async match(){return new Response('ancienne vidéo')},async put(){},async keys(){return []}}},async keys(){return []}};
 const ctx={URL,Request,Response,Headers,caches,Promise,Date,Math,Number,String,Object,Array,RegExp,encodeURIComponent,decodeURIComponent,encodeURI,setTimeout,clearTimeout,self:{location:new URL('sw.js',base),addEventListener(n,f){events[n]=f},clients:{async matchAll(){return []}}},fetch:async()=>{throw Error('hors ligne')}};
 vm.runInNewContext(read('sw.js'),ctx);
 for(let i=1;i<=3;i++){
  let result;events.fetch({request:new Request(base+`assets/videos/sql-serie${i}.mp4?v=235`,{headers:{range:'bytes=0-3'}}),respondWith(p){result=p}});
  assert.equal((await result).status,410);
 }
 let result;events.fetch({request:new Request(base+'assets/videos/sql-serie4.mp4'),respondWith(p){result=p},waitUntil(){}});assert.notEqual((await result).status,410);
});
