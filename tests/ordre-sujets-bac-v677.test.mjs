import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(p,'utf8');
const sujets=['Style Bac STI 2024','Web et bases de données','Suivi du livreur'];
test('les deux sujets suivent immédiatement les dernières synthèses de chaque matière',()=>{
 for(const [id,title] of [['javascript','Série de Synthèse JavaScript'],['bdd','Série de Synthèse 3 SQL'],['php','Série 6 de Synthèse PHP']]) {
  const bloc=read('exercices/series-exercices.html').split(`id="${id}"`)[1].split('</section>')[0];
  const cards=[...bloc.matchAll(/<h3(?:\s[^>]*)?>(.*?)<\/h3>/g)].map(m=>m[1]);
  const i=cards.findIndex(t=>t.includes(title));assert.ok(i>=0,id);const j=id==='javascript'?i+2:i+1;assert.deepEqual(cards.slice(j,j+sujets.length),sujets,id);
 }
 for(const [subject,title] of [['javascript','Série de Synthèse JavaScript'],['sql','Série de Synthèse 3 SQL'],['php','Série 6 de Synthèse PHP']]) {
  const text=read(`cours/${subject}.html`);const i=text.indexOf(title);assert.ok(i>=0);const debut=subject==='javascript'?text.indexOf('Synthèse JavaScript · Livraison fast-food',i):i;const fin=text.indexOf('</article>',debut);
  const suite=text.slice(fin+10);assert.match(suite,/^<article[^>]*data-sujet-bac/);
  const titles=[...suite.matchAll(/<article[^>]*data-sujet-bac[^>]*>[\s\S]*?<h3>(.*?)<\/h3>/g)].map(m=>m[1]);assert.deepEqual(titles,sujets,subject);
 }
});
