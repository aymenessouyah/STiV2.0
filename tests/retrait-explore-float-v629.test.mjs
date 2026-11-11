import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
const read = p => readFileSync(p, 'utf8');
const base = 'exercices/html-css/Explore_Tunisie/Explore_Tunisie_Solution/ExploreTunisie';
const pages = ['cours/css3.html', 'cours/html5.html', 'exercices/series-exercices.html', ...['index.html', 'index-float.html', 'index-position.html'].map(n => `${base}/${n}`)];
test('vidéo Float supprimée sans supprimer les corrigés et la vidéo Flex', () => {
  assert.equal(existsSync('assets/videos/explore-tunisie-float.mp4'), false);
  assert.equal(existsSync('assets/videos/explore-tunisie-flex.mp4'), true);
  for (const path of pages) {
    const html = read(path);
    assert.doesNotMatch(html, /explore-tunisie-float\.mp4|data-legacy-video="explore-tunisie-float"|btn-vid-exp-float|ouvrirVideoPasAPasSTI\('explore-tunisie-float'/, path);
    assert.match(html, /explore-tunisie-flex/, path);
  }
  assert.match(read(`${base}/index-float.html`), /btn-mode-float/);
});
test('v629 actualise les pages et retire le fichier du hors ligne', () => {
  const sw = read('sw.js'), manifest = JSON.parse(read('offline-complete-manifest.json'));
  assert.match(sw, /VERSION_PUBLIEE = "v630"/);
  for (const path of pages) {
    assert.ok(sw.includes(`url: "./${path}", revision: "retrait-explore-float-v629"`), path);
    const bytes = readFileSync(path);
    const hash = createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
    assert.equal(manifest.files.find(x => x.path === path)?.gitSha, hash, path);
  }
  assert.ok(!sw.includes('./assets/videos/explore-tunisie-float.mp4'));
  assert.ok(!manifest.files.some(x => x.path === 'assets/videos/explore-tunisie-float.mp4'));
  assert.equal(manifest.totalFiles, manifest.files.length);
  assert.equal(manifest.totalBytes, manifest.files.reduce((sum, x) => sum + x.bytes, 0));
});
