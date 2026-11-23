import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=p=>readFileSync(p,'utf8');
const attendus={
 'exercices/sujets-bac/TP_Biblio_Pratique_2h_Eleve.pdf':'683bf76be1008feccc84b426e6885360c08534aa3184ec829b77d9e1b975ffb0',
 'exercices/sujets-bac/TP_Biblio_Ressources.zip':'94f45af765ffeb1b661a3373cbcf21804a21d1d67494d2bc2b15ad2f9ce7a878'};
test('le TP Bibliothèque porte la catégorie Similaire Bac Pratique, badge orange clignotant',()=>{
 const manifest=JSON.parse(read('offline-complete-manifest.json')),sw=read('sw.js');
 for(const [path,sha] of Object.entries(attendus)){
  const b=readFileSync(path);
  assert.equal(createHash('sha256').update(b).digest('hex'),sha);
  assert.ok(manifest.files.some(f=>f.path===path&&f.bytes===b.length));
  assert.ok(sw.includes(`"./${path}"`));
 }
 assert.equal(readFileSync('exercices/sujets-bac/TP_Biblio_Pratique_2h_Eleve.pdf').subarray(0,5).toString(),'%PDF-');
 assert.equal(readFileSync('exercices/sujets-bac/TP_Biblio_Ressources.zip').subarray(0,2).toString(),'PK');
 for(const file of ['index.html','cours/javascript.html','cours/sql.html','cours/php.html','exercices/series-exercices.html']){
  const html=read(file);
  assert.ok(html.includes('TP_Biblio_Pratique_2h_Eleve.pdf'),file);
  assert.ok(html.includes('TP_Biblio_Ressources.zip'),file);
  assert.ok(html.includes('<span class="badge-bac-pratique">Similaire Bac Pratique</span>'),file);
  assert.match(html,/\.badge-bac-pratique\{[^}]*#f97316|badge-bac-pratique\{[^}]*background:#ffedd5/);
  assert.match(html,/@keyframes bac-pratique-clignote/);
  assert.match(html,/prefers-reduced-motion: reduce\)\{\.badge-bac-pratique\{animation:none\}/);
 }
 for(const file of ['cours/javascript.html','cours/sql.html','cours/php.html']) assert.match(read(file),/data-bac-pratique/);
 const catalogue=read('exercices/series-exercices.html');
 for(const id of ['javascript','bdd','php']){
  const bloc=catalogue.split(`id="${id}"`)[1].split('</section>')[0];
  assert.ok(bloc.includes('TP_Biblio_Pratique_2h_Eleve.pdf'),id);
  assert.ok(bloc.includes('Bibliothèque du lycée'),id);
 }
 /* La nouvelle catégorie reste distincte des sujets bac théoriques. */
 assert.match(read('cours/sql.html'),/data-exercise="tp-biblio"/);
 assert.match(read('cours/php.html'),/data-exercise="tp-biblio"/);
 assert.match(read('cours/javascript.html'),/data-exo-check="exo-js-tp-biblio"/);
});
