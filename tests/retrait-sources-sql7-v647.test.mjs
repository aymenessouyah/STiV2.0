import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=p=>readFileSync(p,'utf8');
const noms=['sous_req1.mp4','sous_req2.mp4','sous_req3.mp4','sous_req4.mp4','GroupBy-Having.mp4'];
test('les cinq sources sont retirées, mais le montage reste disponible',()=>{
 const manifest=JSON.parse(read('offline-complete-manifest.json'));
 for(const nom of noms){const path='assets/videos/'+nom;assert.equal(existsSync(path),false,path);assert.ok(!manifest.files.some(f=>f.path===path),path)}
 assert.ok(existsSync('assets/videos/sql-serie7-groupby-having-sous-requetes-v7.mp4'));
 assert.ok(manifest.files.some(f=>f.path==='assets/videos/sql-serie7-groupby-having-sous-requetes-v7.mp4'));
});
test('les anciennes copies en cache ne sont pas servies même avec Range',async()=>{
 const base='https://example.test/site/';const events={};
 const caches={async match(){return new Response('ancienne vidéo')},async open(){return {async match(){return new Response('ancienne vidéo')},async put(){},async keys(){return []}}},async keys(){return []}};
 const ctx={URL,Request,Response,Headers,caches,Promise,Date,Math,Number,String,Object,Array,RegExp,encodeURIComponent,decodeURIComponent,encodeURI,setTimeout,clearTimeout,self:{location:new URL('sw.js',base),addEventListener(n,f){events[n]=f},clients:{async matchAll(){return []}}},fetch:async()=>{throw Error('hors ligne')}};
 vm.runInNewContext(read('sw.js'),ctx);
 for(const nom of noms){let result;events.fetch({request:new Request(base+'assets/videos/'+nom+'?v=1',{headers:{range:'bytes=0-3'}}),respondWith(p){result=p}});assert.equal((await result).status,410,nom)}
 let result;events.fetch({request:new Request(base+'assets/videos/sql-serie7-groupby-having-sous-requetes-v7.mp4'),respondWith(p){result=p},waitUntil(){}});assert.notEqual((await result).status,410);
});
