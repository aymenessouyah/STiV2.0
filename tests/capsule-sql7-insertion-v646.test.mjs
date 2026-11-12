import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const read=p=>readFileSync(p,'utf8');
test('repères v8 : quatre séquences et partie 8 décalée',()=>{
 const js=read('assets/js/protection.js');
 const code=js.match(/STI_CHAPITRES_MEDIA\["sql-serie7-capsule"\] = \[[\s\S]*?\];/)[0];
 const ctx={STI_CHAPITRES_MEDIA:{}};vm.runInNewContext(code,ctx);
 const ch=ctx.STI_CHAPITRES_MEDIA['sql-serie7-capsule'];
 assert.equal(ch.length,16);
 assert.deepEqual(Array.from(ch.slice(7,12),x=>x.t),[812.5,925.24,1105.41,1419.24,1662.87]);
 assert.deepEqual(Array.from(ch.slice(7,11),x=>x.short),['Sous-requêtes · extrait 1','Sous-requêtes · extrait 2','Sous-requêtes · extrait 3','Sous-requêtes · extrait 4']);
 assert.equal(ch[0].short, "Partie 1 : Introduction");
 assert.equal(ch[0].label, "0:00 · Partie 1 : Introduction");
 assert.equal(ch[11].short, "Partie 8 : Group by vs sous_requête");
 assert.equal(ch[11].label, "27:42 · Partie 8 : Group by vs sous_requête");
 for(let i=1;i<ch.length;i++)assert.ok(ch[i].t>ch[i-1].t);
});
test('le montage est publié sans téléchargement automatique et reste reconstructible',()=>{
 const path='assets/videos/sql-serie7-groupby-having-sous-requetes-v9.mp4';
 const sw=read('sw.js');assert.ok(sw.split('var OFFLINE_LIST = [')[1].split('];')[0].includes(path));
 assert.ok(!sw.split('var UPDATE_FILES = [')[1].split('];')[0].includes(path));
 const script=read('outils/capsule-sql7/inserer-sous-requetes-v7.sh');
 for(let i=1;i<=4;i++)assert.ok(script.includes(`sous_req${i}.mp4`));
 assert.match(script,/trim=end=814/);assert.match(script,/trim=start=814/);
});
test('la présentation aux élèves reste pédagogique et signale les limites',()=>{
 const page=read('cours/sql.html');
 assert.ok(page.includes('Découvrez GROUP BY, HAVING et les sous-requêtes à travers des exemples et les exercices de la série 7.'));
 assert.ok(page.includes('certaines coupures audio restent à vérifier ; sous-titres indisponibles.'));
 assert.ok(!page.includes('quatre séquences insérées à 13 min 34'));
});
