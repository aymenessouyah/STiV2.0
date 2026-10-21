import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
let read = path => fs.readFileSync(new URL('../'+path, import.meta.url),'utf8');
let data=JSON.parse(read('assets/data/smart-book-2026.json'));
test('69 fiches consécutives, pages 6 à 74',()=>{
 assert.equal(data.pages,74);assert.equal(data.items.length,69);
 data.items.forEach((item,i)=>{assert.equal(item.fiche,i+1);assert.equal(item.page,i+6);});
});
test('chaque destination a un fichier et une ancre existante',()=>{
 data.items.forEach(item=>{let u=new URL(item.url);assert.equal(u.origin,'https://aymenessouyah.github.io');assert.ok(u.pathname.startsWith('/STiV2.0/'));let path=u.pathname.slice('/STiV2.0/'.length);let html=read(path);assert.ok(html.includes('id="'+u.hash.slice(1)+'"')||html.includes("id='"+u.hash.slice(1)+"'"),item.url);});
});
test('bibliothèque QR locale et licence présentes',()=>{assert.ok(read('assets/vendor/jsqr/jsQR.js').includes('jsQR'));assert.ok(read('assets/vendor/jsqr/LICENSE').includes('Copyright'));});
test('pas de dépendance distante sur le scanner',()=>{let html=read('livre-smart.html');assert.ok(!/<script[^>]+src=["']https?:/.test(html));assert.ok(html.includes('object-src \'none\''));});
test('aucun envoi de photo implémenté',()=>{let js=read('assets/js/smart-book.js');assert.ok(!js.includes('FormData'));assert.ok(!js.includes('XMLHttpRequest'));assert.ok(js.includes("fetch('assets/data/smart-book-2026.json')"));assert.ok(js.includes('allowed.get(u.href)'));});
test('liaisons de navigation et manifeste incrémental',()=>{assert.ok(read('index.html').includes('href="livre-smart.html"'));assert.ok(read('sw.js').includes('v330-smart-book-2026'));assert.ok(read('sitemap.xml').includes('./livre-smart.html'));});
test('PDF publié valide et non vide',()=>{let bytes=fs.readFileSync(new URL('../documents/livre/sti-smart-book-2026.pdf',import.meta.url));assert.equal(bytes.subarray(0,5).toString(),'%PDF-');assert.ok(bytes.length>100000);});
