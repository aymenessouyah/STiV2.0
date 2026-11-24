import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=p=>readFileSync(p,'utf8');
const base='exercices/html-css/mini_projet_club_web';
const attendus={
 [`${base}/Mini_Projet_CSS_Club_Web_3SI.pdf`]:'ae84643d8594f9b5e12b9f05b6387253085939b04419d215b639744eba1eca42',
 [`${base}/mini_projet_club_web.rar`]:'8c5a0cbc86ef5a4eb50caed240bfd77a1d0997d95882b27b3e8495a4b6081d32',
 [`${base}/corrige_mini_projet_club_web.rar`]:'9c441ae8a51e7921c319ba5983002eb14379a89dc764c7f6667f8d2cd71dcce9'};
test('la synthèse HTML5/CSS3 Club Web est valable pour 3e et 4e SI, avec badge doré et titre clignotant',()=>{
 const manifest=JSON.parse(read('offline-complete-manifest.json')),sw=read('sw.js');
 for(const [path,sha] of Object.entries(attendus)){
  const b=readFileSync(path);
  assert.equal(createHash('sha256').update(b).digest('hex'),sha);
  assert.ok(manifest.files.some(f=>f.path===path&&f.bytes===b.length));
  assert.ok(sw.includes(`"./${path}"`));
 }
 assert.equal(readFileSync(`${base}/Mini_Projet_CSS_Club_Web_3SI.pdf`).subarray(0,5).toString(),'%PDF-');
 for(const f of [`${base}/mini_projet_club_web.rar`,`${base}/corrige_mini_projet_club_web.rar`]) assert.equal(readFileSync(f).subarray(0,4).toString(),'Rar!');
 for(const file of ['cours/html5.html','cours/css3.html','exercices/series-exercices.html','index.html']){
  const html=read(file);
  assert.ok(html.includes('Mini_Projet_CSS_Club_Web_3SI.pdf'),file);
  assert.ok(html.includes('mini_projet_club_web.rar'),file);
  assert.ok(html.includes('corrige_mini_projet_club_web.rar'),file);
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

test('la capsule vidéo de correction du Club Web est publiée et livrée hors-ligne',()=>{
 const manifest=JSON.parse(read('offline-complete-manifest.json')),sw=read('sw.js');
 const video='assets/videos/capsule-correction-club-web-v699.mp4';
 const b=readFileSync(video);
 assert.equal(b.subarray(4,8).toString(),'ftyp');
 assert.ok(b.length>5_000_000);
 assert.ok(manifest.files.some(f=>f.path===video&&f.bytes===b.length));
 assert.ok(sw.includes(`"./${video}"`));
 for(const file of ['cours/html5.html','cours/css3.html','exercices/series-exercices.html','index.html'])
  assert.ok(read(file).includes(video),file);
 assert.match(read('cours/html5.html'),/Capsule : correction du Club Web/);
 assert.match(sw,/\{ url: "\.\/cours\/css3\.html", revision: "capsules-badges-v699"/);
});
