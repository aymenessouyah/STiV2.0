import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
const lire=p=>readFileSync(p,'utf8');
const ancien='assets/videos/sql-serie7-group-by-having.mp4';
const actuel='assets/videos/sql-serie7-groupby-having-sous-requetes-v6.mp4';
test('catalogue, lecteur et suivi désignent la nouvelle capsule 4e SI',()=>{
 const js=lire('assets/js/app.js'), bloc=js.split('var CATALOGUE_VIDEOS = ')[1].split('\n  ];')[0]+'\n  ]';
 const cat=vm.runInNewContext('('+bloc+')'), entry=cat.find(v=>v.id==='sql-serie7-capsule');
 assert.ok(entry); assert.equal(entry.reserve4si,true); assert.equal(entry.srcPrincipal,actuel); assert.equal(entry.sousTitres,undefined); assert.equal(entry.dureeTexte,'23:16');
 assert.equal(cat.length,28); assert.equal(cat.filter(v=>v.matiere==='sql').length,6);
 assert.match(lire('assets/js/protection.js'),/if \(estCapsuleSql7\) url = prefixeAssetsSTI\(\) \+ "videos\/sql-serie7-groupby-having-sous-requetes-v6.mp4"/);
 assert.doesNotMatch(lire('assets/js/protection.js'),/subtitles\/sql-serie7-having-groupby-sous-requetes-v2-fr.vtt/);
 assert.match(lire('assets/js/lecteur-commun.js'),/slug === 'sql-serie7-capsule'/);
 assert.match(lire('assets/js/admin-vues-videos.js'),/sql-serie7-capsule/);
 assert.match(lire('assets/js/admin.js'),/video:sql-serie7-capsule/);
 const block=lire('assets/js/protection.js').match(/function resoudreCleMediaDepuisUrlSTI\(urlBrute, tagHint\)[\s\S]*?window\.resoudreCleMediaDepuisUrlSTI = resoudreCleMediaDepuisUrlSTI;/);
 const context={window:{}}; vm.runInNewContext(block[0],context);
 assert.equal(context.window.resoudreCleMediaDepuisUrlSTI(actuel,'VIDEO'),'video:sql-serie7-capsule');
 assert.equal(context.window.resoudreCleMediaDepuisUrlSTI(ancien,'VIDEO'),'video:sql-serie7-capsule');
 assert.equal(context.window.resoudreCleMediaDepuisUrlSTI('assets/videos/sql-serie7-having-groupby-sous-requetes-v2.mp4','VIDEO'),'video:sql-serie7-capsule');
 assert.match(lire('cours/sql.html'),/Version provisoire \(23 min 16\)/);
});
test('une ancienne URL vidéo en cache sert la nouvelle vidéo, y compris en Range',async()=>{
 const origin='https://example.test/site/'; const events={}; const store=new Map();
 const caches={async open(){return {async match(req){const key=typeof req==='string'?new URL(req,origin).href:req.url;return store.get(key)?.clone();},async put(){},async keys(){return []},async delete(){}}}, async match(req){const key=typeof req==='string'?new URL(req,origin).href:req.url;return store.get(key)?.clone()},async keys(){return []}};
 const ctx={URL,Request,Response,Headers,caches,Promise,Date,Math,Number,String,Object,Array,RegExp,encodeURIComponent,decodeURIComponent,encodeURI,setTimeout,clearTimeout,
 self:{location:new URL('sw.js',origin),addEventListener(n,f){events[n]=f},clients:{async matchAll(){return []}}},fetch:async()=>{throw Error('hors ligne')}};
 vm.runInNewContext(lire('sw.js'),ctx);
 store.set(origin+ancien,new Response('ANCIEN')); store.set(origin+actuel,new Response('NOUVEAU',{headers:{'Content-Type':'video/mp4'}}));
 for (const url of [ancien,'assets/videos/sql-serie7-having-groupby-sous-requetes-v2.mp4','assets/videos/sql-serie7-groupby-having-sous-requetes-v3.mp4']) {
  const waits=[];let result;
  events.fetch({request:new Request(origin+url,{headers:{range:'bytes=1-3'}}),respondWith(p){result=p},waitUntil(p){waits.push(p)}});
  const rep=await result; assert.equal(rep.status,206); assert.equal(await rep.text(),'OUV'); assert.equal(rep.headers.get('Content-Range'),'bytes 1-3/7'); await Promise.allSettled(waits);
 }
 let subtitle; events.fetch({request:new Request(origin+'assets/subtitles/sql-serie7-having-groupby-sous-requetes-v2-fr.vtt'),respondWith(p){subtitle=p}}); assert.equal((await subtitle).status,410);
});
test('le contrôle de publication refuse un numéro ou une date inchangés',()=>{
 const py = String.raw`import runpy
m=runpy.run_path('outils/publication/version.py')
base='var VERSION_PUBLIEE = "v637";\nvar PUBLIEE_LE = "2026-11-10T12:40:00Z";'
changed='var VERSION_PUBLIEE = "v638";\nvar PUBLIEE_LE = "2026-11-10T15:00:00Z";'
m['verifier'](changed,base)
for cur in (base, changed.replace('v638','v637'),changed.replace('15:00:00','12:40:00')):
 try: m['verifier'](cur,base)
 except ValueError: continue
 raise AssertionError('publication obsolète acceptée')`;
 const p=spawnSync('python3',['-c',py],{encoding:'utf8'});assert.equal(p.status,0,p.stderr);
 assert.match(lire('.github/workflows/publication-version.yml'),/github\.event\.pull_request\.base\.sha/);
});
