import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import vm from 'node:vm';
const root='exercices/sql/serie-7/';
const read=p=>readFileSync(p,'utf8');
test('les PDF publics sont exactement les références rectifiées',()=>{
 for (const [file,ref] of [['Fiche_SQL_Boutique_Jointure_SousRequetes.pdf','Fiche_SQL_Boutique.pdf'],['Corrigé_SQL_Boutique_Jointure_SousRequetes.pdf','Corrige_SQL_Boutique.pdf']]) {
  assert.deepEqual(readFileSync(root+file),readFileSync('outils/capsule-sql7/references-v6/'+ref));
  assert.deepEqual(readFileSync(root+file),readFileSync(root+file+'.pdf'));
 }
});
test('énoncé, corrigé et script reprennent les requêtes de la fiche',()=>{
 const d=JSON.parse(read('outils/capsule-sql7/storyboard-v6.json'));
 const sql=read(root+'boutique.sql'); const html=read(root+'corrige.html'); const enonce=read(root+'enonce.html');
 for(const q of [...d.missions.slice(2).map(m=>m.sous_requete.sql),...d.supplements.map(s=>s.sql)]){
  assert.ok(sql.includes(q)); assert.ok(html.includes(q.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')));
 }
 assert.match(enonce,/sous-requêtes non corrélées dans WHERE/);assert.match(enonce,/prix unitaire moyen/);
 assert.doesNotMatch(enonce,/dans le SELECT|dans le FROM/);
 const p=spawnSync('python3',['-c',`import sqlite3\nc=sqlite3.connect(':memory:')\nc.executescript(open('${root}boutique.sql').read())\nassert c.execute('SELECT COUNT(*) FROM VENTE').fetchone()[0]==12`],{encoding:'utf8'});assert.equal(p.status,0,p.stderr);
});
test('les PDF canoniques ignorent les anciennes copies en cache',async()=>{
 const origin='https://example.test/site/'; const events={}; const store=new Map();
 const caches={async open(){return {async match(req){return store.get(typeof req==='string'?new URL(req,origin).href:req.url)?.clone()},async put(){},async keys(){return []},async delete(){}}},async match(req){return store.get(typeof req==='string'?new URL(req,origin).href:req.url)?.clone()},async keys(){return []}};
 const ctx={URL,Request,Response,Headers,caches,Promise,Date,Math,Number,String,Object,Array,RegExp,encodeURIComponent,decodeURIComponent,encodeURI,setTimeout,clearTimeout,self:{location:new URL('sw.js',origin),addEventListener(n,f){events[n]=f},clients:{async matchAll(){return []}}},fetch:async()=>{throw Error('hors ligne')}};
 vm.runInNewContext(read('sw.js'),ctx);
 for(const name of ['Fiche_SQL_Boutique_Jointure_SousRequetes.pdf','Corrigé_SQL_Boutique_Jointure_SousRequetes.pdf']){
  const old=new URL(root+name,origin).href, updated=new URL(root+name+'.pdf',origin).href;
  store.set(old,new Response('ancienne'));store.set(updated,new Response('rectifiée'));
  let result;const waits=[];events.fetch({request:new Request(old),respondWith(p){result=p},waitUntil(p){waits.push(p)}});
  assert.equal(await (await result).text(),'rectifiée');await Promise.allSettled(waits);
 }
});
