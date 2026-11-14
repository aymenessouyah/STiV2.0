import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read = p => readFileSync(p, 'utf8');
const dir = 'exercices/php/serie-6/';
test('documents adaptés et exercices des huit parties conservés', () => {
  for (const file of ['enonce.html', 'corrige.html']) {
    const s = read(dir + file);
    assert.doesNotMatch(s, /\b(?:explode|implode|foreach)\b/i);
    assert.doesNotMatch(s, /pas de classes|jamais new mysqli/i);
    for (let i=1;i<=8;i++) assert.match(s, new RegExp(`Exercice ${i}\\.1`));
    for (const term of ['gettype','settype','str_replace','strcasecmp','current','reset','sizeof','mysqli_select_db','mysqli_insert_id','mktime','checkdate','getdate']) assert.ok(s.includes(term),term);
    assert.match(s,/tunis,sfax,tunis,sousse,sfax,tunis/);
    assert.match(s,/25\/12\/2026/);
  }
});
test('liens de catalogue et fichiers hors ligne cohérents', () => {
  const manifest=JSON.parse(read('offline-complete-manifest.json'));
  const sw=read('sw.js');
  for (const f of ['enonce.html','corrige.html','style.css']) {
    let path=dir+f, bytes=readFileSync(path), item=manifest.files.find(x=>x.path===path);
    assert.ok(sw.includes(`"./${path}"`));
    assert.equal(item?.bytes,bytes.length);
    assert.equal(item?.gitSha,createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex'));

  }
});
