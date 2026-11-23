import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=p=>readFileSync(p,'utf8');
const base='exercices/html-css/mini_projet_club_web';
const attendus={
 [`${base}/Mini_Projet_CSS_Club_Web_3SI.pdf`]:'8245121bbb5bc271ea6ac74b8eb2c2943423f2f121b48cae4a35129d00a4708f',
 [`${base}/mini_projet_club_web.rar`]:'f2945555fcc2aef879d401941d9fd71944ff03c00a79ae75606aff2587f7c880',
 [`${base}/corrige_club_web.rar`]:'485fe1125c150ab4e091f7bce2a4e2f07c7fa6cc3a47a3be48e5ebc9bb956119'};
test('la synthèse HTML5/CSS3 Club Web est valable pour 3e et 4e SI, avec badge doré et titre clignotant',()=>{
 const manifest=JSON.parse(read('offline-complete-manifest.json')),sw=read('sw.js');
 for(const [path,sha] of Object.entries(attendus)){
  const b=readFileSync(path);
  assert.equal(createHash('sha256').update(b).digest('hex'),sha);
  assert.ok(manifest.files.some(f=>f.path===path&&f.bytes===b.length));
  assert.ok(sw.includes(`"./${path}"`));
 }
 assert.equal(readFileSync(`${base}/Mini_Projet_CSS_Club_Web_3SI.pdf`).subarray(0,5).toString(),'%PDF-');
 for(const f of [`${base}/mini_projet_club_web.rar`,`${base}/corrige_club_web.rar`]) assert.equal(readFileSync(f).subarray(0,4).toString(),'Rar!');
 for(const file of ['cours/html5.html','cours/css3.html','exercices/series-exercices.html','index.html']){
  const html=read(file);
  assert.ok(html.includes('Mini_Projet_CSS_Club_Web_3SI.pdf'),file);
  assert.ok(html.includes('mini_projet_club_web.rar'),file);
  assert.ok(html.includes('corrige_club_web.rar'),file);
 }
 for(const file of ['cours/html5.html','cours/css3.html']){
  const html=read(file);
  const carte=html.split('<article class="exo-card-full" id="exo-club-web"')[1].split('</article>')[0];
  assert.ok(carte.includes('badge-synthese-gold'));
  assert.ok(carte.includes('titre-synthese'));
  assert.ok(!carte.includes('sti-4si-only'), 'valable pour les deux niveaux');
  assert.match(html,/\.titre-synthese \{ animation: synthese-clignote 2s/);
  assert.match(html,/@keyframes synthese-clignote/);
  assert.match(html,/@media \(prefers-reduced-motion: reduce\), print \{ \.titre-synthese \{ animation: none; \} \}/);
 }
 const section=read('exercices/series-exercices.html').split('id="css3"')[1].split('</section>')[0];
 assert.ok(section.includes('Club Web animé'));
 assert.ok(section.includes('badge-synthese-gold'));
});
