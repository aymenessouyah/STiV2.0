import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
const text = p => readFileSync(p, 'utf8');
const video='assets/videos/sql-tp6-mission-cinema.mp4';
const poster='assets/images/je-fais-tout-sql-poster.jpg';
test('la capsule originale est restaurée sans rétablir le site Mission cinéma', () => {
  const b=readFileSync(video);
  assert.equal(createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex'), 'b1b280cf594fb5a4596e21a3c7e8f31f3af21825');
  assert.ok(existsSync(poster)); assert.equal(existsSync('mission-cinema'),false);
  const app=text('assets/js/app.js'); assert.match(app, /id: "sql-tp6-mission-cinema"/);
  assert.ok(app.includes(`srcPrincipal: "${video}"`)); assert.match(app,/Je fais tout le SQL/);
  const player=text('assets/js/protection.js'); assert.match(player,/if \(estMissionCinema\) url = prefixeAssetsSTI\(\) \+ "videos\/sql-tp6-mission-cinema.mp4"/);
  assert.match(text('assets/js/admin-vues-videos.js'), /sql-tp6-mission-cinema/);
  assert.match(text('assets/js/admin.js'), /video:sql-tp6-mission-cinema/);
});
test('la capsule est accessible dans le TP6 et les vidéos SQL, en conservant la capsule série 7', () => {
  const course=text('cours/sql.html');
  const ex=course.split('<section id="exercices"')[1].split('<section id="annexes"')[0];
  const videos=course.split('<section id="videos"')[1];
  assert.match(ex, /data-video-open="sql-tp6-mission-cinema"/);
  assert.match(videos, /data-video-open="sql-tp6-mission-cinema"/);
  assert.match(videos, /id="capsule-sql-serie7"/);
  assert.match(videos, /matiere-video-card sti-4si-only/);
});
test('le paquet hors ligne inclut la capsule sans la précharger dans le delta', () => {
  const sw=text('sw.js'), offline=sw.split('var OFFLINE_LIST = [')[1].split('];')[0], delta=sw.split('var UPDATE_FILES = [')[1].split('];')[0];
  const m=JSON.parse(text('offline-complete-manifest.json'));
  for (const p of [video,poster,'cours/sql.html','sw.js','assets/js/app.js','assets/js/protection.js']) {
    const b=readFileSync(p), e=m.files.find(x=>x.path===p);
    assert.equal(e?.bytes,b.length,p); assert.equal(e?.gitSha,createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex'),p);
  }
  assert.ok(offline.includes('./'+video)); assert.ok(offline.includes('./'+poster));
  assert.ok(!delta.includes(video)); assert.equal(m.totalFiles,m.files.length);
  assert.equal(m.totalBytes,m.files.reduce((a,x)=>a+x.bytes,0));
});
