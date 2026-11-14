import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=p=>readFileSync(p,'utf8');
const dir='exercices/php/serie-6/';
const docs=['enonce-serie6-php-v2.pdf','corrige-serie6-php-v2.pdf'];
test('série 6 PHP dans sa propre boîte de séries, distincte du devoir',()=>{
 const cours=read('cours/php.html');
 const series=cours.split('<div class="matiere-series-grid">')[1].split('<section class="matiere-panel" aria-labelledby="php-autres-exercices">')[0];
 const article=series.match(/<article class="matiere-panel"><h3>Série 6 · PHP procédural<\/h3>[\s\S]*?<\/article>/)?.[0];
 assert.ok(article); assert.match(article,/data-exercise="serie6"/);
 const exos=read('exercices/series-exercices.html');
 const carte=exos.match(/<div class="exo-card">\s*<div class="exo-level">PHP procédural · 4ᵉ SI<\/div>[\s\S]*?<\/div>\s*<\/div>/)?.[0];
 assert.ok(carte);
 for(const f of docs){assert.ok(article.includes('../'+dir+f)); assert.ok(carte.includes('php/serie-6/'+f));}
 assert.match(cours,/Énoncé du devoir de contrôle n°6/);
});
test('les deux PDF sont présents dans le paquet hors ligne',()=>{
 const sw=read('sw.js'); const offline=sw.split('var OFFLINE_LIST = [')[1].split('];')[0];
 const manifest=JSON.parse(read('offline-complete-manifest.json'));
 for(const f of docs){const path=dir+f,b=readFileSync(path),item=manifest.files.find(x=>x.path===path);
  assert.equal(b.subarray(0,5).toString(),'%PDF-'); assert.ok(offline.includes(`"./${path}"`));
  assert.equal(item?.bytes,b.length); assert.equal(item?.gitSha,createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex'));
 }
});
