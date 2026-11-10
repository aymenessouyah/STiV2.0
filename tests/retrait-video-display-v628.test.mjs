import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const read = p => readFileSync(p, 'utf8');
test('la démo Display est retirée sans retirer le TP distinct', () => {
  const html = read('cours/css3.html'), app = read('assets/js/app.js'), js = read('assets/js/cours-css3.js');
  assert.doesNotMatch(html, /displayanim\.mp4|data-play-display|data-playlist="display"/);
  assert.doesNotMatch(app, /id: "css3-display"/);
  assert.equal(existsSync('assets/videos/displayanim.mp4'), false);
  assert.match(html, /data-playlist="cours" aria-pressed="true"/);
  assert.match(js, /selectionPlaylist\('cours'\)/);
  assert.match(html, /data-playlist="tpDisplay"/);
  assert.ok(existsSync('assets/videos/tp-display-float-position.mp4'));
});
test('les pages et le catalogue sont actualisés, sans fichier manquant hors ligne', () => {
  const sw = read('sw.js'), manifest = JSON.parse(read('offline-complete-manifest.json'));
  for (const path of ['index.html', 'cours/css3.html', 'assets/js/app.js', 'assets/js/cours-css3.js', 'offline-complete-manifest.json']) {
    assert.match(sw, new RegExp(`url: "\\./${path.replaceAll('.', '\\.')}", revision: "${["cours/css3.html", "offline-complete-manifest.json"].includes(path) ? "retrait-explore-float-v629" : "retrait-display-v628"}"`));
  }
  assert.ok(!sw.includes('./assets/videos/displayanim.mp4'));
  assert.ok(!manifest.files.some(f => f.path === 'assets/videos/displayanim.mp4'));
  assert.equal(manifest.totalBytes, manifest.files.reduce((sum, f) => sum + f.bytes, 0));
});
