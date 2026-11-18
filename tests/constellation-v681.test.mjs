import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=p=>readFileSync(p,'utf8');
test('constellation : liens, droits et disponibilité hors ligne',()=>{
 const html=read('constellation.html');for(const href of [...html.matchAll(/href="([^"]+)"/g)].map(x=>x[1])){
  if(href.startsWith('#')) assert.ok(html.includes(`id="${href.slice(1)}"`),href);
  else {const path=href.split('#')[0].split('?')[0];assert.ok(existsSync(path),path);}
 }
 for(const id of ['web-bd','style-bac']) assert.match(html,new RegExp(`<article class="project-card sti-4si-only" id="${id}"`));
 for(const id of ['livraison','carte-bancaire']) assert.match(html,new RegExp(`<article class="project-card" id="${id}"`));
 assert.match(read('index.html'),/id="constellation-matieres"/);assert.match(read('assets/js/mobile-nav.js'),/\["Constellation", "constellation.html"/);
 const manifest=JSON.parse(read('offline-complete-manifest.json'));for(const path of ['constellation.html','assets/css/constellation.css']) assert.ok(manifest.files.some(f=>f.path===path));
});
