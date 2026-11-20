import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = p => readFileSync(p,'utf8');
const slugs=['style-bac-2024','web-bd','suivi-livreur'];
test('les deux sujets et leurs corrigés sont présents dans chaque rubrique et hors ligne',()=>{
  const sw=read('sw.js'),manifest=JSON.parse(read('offline-complete-manifest.json'));
  for(const slug of slugs) for(const kind of ['enonce','corrige']) {
    const path=`exercices/sujets-bac/${slug}-${kind}.pdf`;
    assert.equal(readFileSync(path).subarray(0,5).toString(),'%PDF-');
    assert.ok(manifest.files.some(f=>f.path===path));
    assert.ok(sw.includes(`"./${path}"`));
    for(const file of ['index.html','cours/javascript.html','cours/sql.html','cours/php.html','exercices/series-exercices.html']) assert.ok(read(file).includes(`${slug}-${kind}.pdf`),file);
  }
  const index=read('index.html');assert.match(index,/id="sujets-bac-similaires"/);assert.match(index,/Sujets bac et sujets similaires/);
  assert.match(index,/Bac © ~ Similaire Bac®/);
  for (const section of ['javascript','bdd','php']) {
    const bloc=read('exercices/series-exercices.html').split(`id="${section}"`)[1].split('</section>')[0];
    for(const slug of slugs) assert.ok(bloc.includes(slug),section+' '+slug);
  }
});
