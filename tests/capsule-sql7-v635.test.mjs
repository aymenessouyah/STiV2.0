import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
const read = p => readFileSync(p, 'utf8');
const mp4='assets/videos/sql-serie7-groupby-having-sous-requetes-v6.mp4';
test('capsule série 7 provisoire sans sous-titres obsolètes', () => {
 const html=read('cours/sql.html');
 const section=html.split('<section id="videos"')[1].split('<div class="matiere-video-grid">')[0];
 assert.match(section, /Série 7 · Capsule SQL : HAVING, GROUP BY et sous-requêtes/);
 assert.ok(section.includes('../'+mp4)); assert.doesNotMatch(section, /<track/); assert.match(section, /sous-titres indisponibles/);
 assert.match(section, /preload="none"/);
 assert.ok(statSync(mp4).size > 1000000);
});
test('ressources hors ligne exactes, sans préchargement automatique de la vidéo', () => {
 const sw=read('sw.js'); const offline=sw.split('var OFFLINE_LIST = [')[1].split('];')[0];
 const delta=sw.split('var UPDATE_FILES = [')[1].split('];')[0];
 const m=JSON.parse(read('offline-complete-manifest.json'));
 for (const path of [mp4,'cours/sql.html','sw.js']) {
  const data=readFileSync(path); const entry=m.files.find(x => x.path===path);
  assert.equal(entry?.bytes,data.length,path);
  assert.equal(entry?.gitSha,createHash('sha1').update(`blob ${data.length}\0`).update(data).digest('hex'),path);
 }
 assert.ok(offline.includes('./'+mp4));
 assert.ok(!delta.includes(mp4)); assert.equal(m.totalFiles,m.files.length);
 assert.equal(m.totalBytes,m.files.reduce((n,f)=>n+f.bytes,0));
});
