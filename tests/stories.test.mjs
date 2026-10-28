import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const read = p => readFileSync(resolve(root, p), 'utf8');
const ids = ['intro', 'selecteurs', 'display', 'flexbox', 'transitions'];
const sw = read('sw.js'), js = read('assets/js/stories.js'), css = read('assets/css/stories.css');
const complet = sw.split('var OFFLINE_LIST = [')[1].split('];')[0];
const delta = sw.split('var UPDATE_FILES = [')[1].split('];')[0];
const shell = sw.split('var SHELL = [')[1].split('];')[0];
const manifeste = JSON.parse(read('offline-complete-manifest.json'));

test('stories indépendantes du profil, sans ressource externe ni couleur hors design system', () => {
  const accueil = read('index.html');
  assert.match(accueil, /assets\/css\/stories\.css\?v=494/);
  assert.match(accueil, /assets\/js\/stories\.js\?v=494/);
  assert.doesNotMatch(js, /\b(?:localStorage|sessionStorage|supabase)\b/i);
  assert.doesNotMatch(js + css, /https?:\/\//i);
  assert.doesNotMatch(css, /#[\da-f]{3,8}\b|\brgba?\(|\bhsla?\(/i);
  assert.match(js, /URL\.createObjectURL/);
  assert.match(js, /__stiPauseQRBound\s*=\s*true/);
  assert.match(js, /ouvrirVideoPasAPasSTI\('css3-cours'/);
});

test('extraits et transcriptions inclus dans le hors-ligne complet, jamais dans le delta automatique', () => {
  for (const type of ['assets/css/stories.css','assets/js/stories.js']) {
    assert.ok(shell.includes('"./' + type + '"'), type + ' dans SHELL');
    assert.ok(complet.includes('"./' + type + '"'), type + ' hors ligne');
    assert.ok(delta.includes('"./' + type + '"'), type + ' dans les mises à jour légères');
  }
  let tailleVideos = 0;
  for (const id of ids) {
    for (const [dossier, ext] of [['videos','mp4'],['images','jpg'],['subtitles','vtt']]) {
      const chemin = `assets/${dossier}/stories/${id}.${ext}`;
      assert.ok(complet.includes('"./' + chemin + '"'), chemin + ' hors ligne');
      assert.ok(manifeste.files.some(f => f.path === chemin), chemin + ' dans le manifeste');
      assert.ok(!delta.includes('"./' + chemin + '"'), chemin + ' exclu du delta');
      assert.ok(!shell.includes('"./' + chemin + '"'), chemin + ' exclu du noyau');
      if (ext === 'mp4') {
        const mp4 = readFileSync(resolve(root, chemin)); tailleVideos += mp4.length;
        assert.ok(mp4.indexOf('moov') > 0 && mp4.indexOf('moov') < mp4.indexOf('mdat'), chemin + ' lisible progressivement');
      }
      if (ext === 'vtt') {
        const vtt = read(chemin);
        assert.match(vtt, /^WEBVTT/); assert.match(vtt, /\d\d:\d\d:\d\d\.\d{3} --> \d\d:\d\d:\d\d\.\d{3}/);
      }
    }
  }
  assert.ok(tailleVideos < 2.2 * 1024 * 1024, 'les cinq extraits restent de petite taille');
  assert.ok(ids.every(id => statSync(resolve(root, `assets/images/stories/${id}.jpg`)).size < 30_000));
});
