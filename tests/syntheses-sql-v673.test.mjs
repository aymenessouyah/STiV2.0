import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=p=>readFileSync(p,'utf8');
const docs=[
 ['synthese-2-zoo','Série de Synthèse 2 SQL · Zoo','ea7c2e6f0cb9ed3c1e9043ff9ef63a9728633a71dbad4ad986e3656e84b2fc4a','0b525d66f3a1b67118301a96a2245ff8bbb8acaa1dd5e2a4909ecf717aabf24f'],
 ['synthese-3-club-sportif','Série de Synthèse 3 SQL · Club sportif','fb23d35920f5d3345b5131af8b9bbab46950dcf82d413cb1f5fb950888d63175','37d4efef5c3d4aa403d04bd2428398df10b5d598b5278fbcbbea739853ce1f4a']
];
test('les deux bulles suivent la série 8 dans les deux vues et gardent les liens énoncé et corrigé',()=>{
 for(const page of ['cours/sql.html','exercices/series-exercices.html']){
  const content=read(page);const huit=content.indexOf('Série 8 Synthèse · Le directeur');
  assert.ok(huit>=0 && content.indexOf(docs[0][1],huit)>huit && content.indexOf(docs[1][1])>content.indexOf(docs[0][1]));
  for(const [folder,title] of docs){
   const index=content.indexOf(title),end=page.startsWith('cours/')?'</article>':'</div>\n          </div>';
   const fragment=content.slice(index,content.indexOf(end,index));
   for(const f of ['enonce','corrige']) assert.ok(fragment.includes(`../exercices/sql/${folder}/${f}.pdf" data-pdf-natif-mobile target="_blank" rel="noopener"`));
   assert.doesNotMatch(fragment,/<video|\.mp4|data-video/);
  }
 }
});
test('PDF originaux et ressources hors ligne sont cohérents',()=>{
 const offline=read('sw.js').split('var OFFLINE_LIST = [')[1].split('];')[0];
 const manifest=JSON.parse(read('offline-complete-manifest.json'));
 for(const [dir,,shaEnonce,shaCorrige] of docs) for(const [file,sha] of [['enonce',shaEnonce],['corrige',shaCorrige]]){
  const path=`exercices/sql/${dir}/${file}.pdf`,b=readFileSync(path), item=manifest.files.find(f=>f.path===path);
  assert.equal(b.subarray(0,5).toString(),'%PDF-');assert.equal(createHash('sha256').update(b).digest('hex'),sha);
  assert.ok(offline.includes(`"./${path}"`));assert.equal(item?.bytes,b.length);
  assert.equal(item?.gitSha,createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex'));
 }
});
