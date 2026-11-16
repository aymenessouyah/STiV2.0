import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=p=>readFileSync(p,'utf8');
test('la bulle sous outils Bac regroupe les synthèses et des liens locaux valides',()=>{
 const page=read('index.html');const section=page.split('<section class="section" id="outils-bac"')[1].split('</section>')[0];
 const card=section.match(/<article class="tool-card" id="series-synthese"[\s\S]*?<\/article>/)?.[0];assert.ok(card);
 assert.match(card,/<h3>Des séries Synthèse<\/h3>/);
 for(const text of ['HTML &amp; CSS','JavaScript','SQL / BD','PHP','Dar Zitouna','Zoo','Club sportif','Gestion des élèves','Recharge de voiture électrique']) assert.ok(card.includes(text),text);
 for(const match of card.matchAll(/href="([^"]+)"/g)){
  const [file,fragment]=match[1].split('#');const path=file.split('?')[0];assert.ok(existsSync(path),path);
  if(fragment) assert.ok(read(path).includes(`id="${fragment}"`),match[1]);
 }
 assert.match(card,/<details class="sti-4si-only">\s*<summary>SQL/);
 assert.match(card,/<details class="sti-4si-only">\s*<summary>PHP/);
 assert.match(read('sw.js'),/url: "\.\/index\.html", revision: "sujets-bac-v676"/);
});
