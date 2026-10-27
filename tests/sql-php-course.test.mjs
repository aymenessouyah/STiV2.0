import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const racine=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const lire=p=>readFileSync(resolve(racine,p),'utf8');
const fichiers=['assets/css/cours-matieres.css','assets/css/cours-sql-heritage.css','assets/css/cours-php-heritage.css',
  'assets/js/cours-matieres.js','assets/js/cours-media-reperes.js','assets/js/cours-sql-animations.js',
  'assets/js/cours-sql-voix.js','assets/js/cours-sql-worker.js'];

test('SQL et PHP : scripts de session dans le bon ordre et verrou 4SI conservé',()=>{
  for(const matiere of ['sql','php']){
    const html=lire(`cours/${matiere}.html`);let precedent=-1;
    for(const src of ['config.js','supabase-umd.js','acces.js','sync-progressions.js','profil.js','app.js']){
      const i=html.indexOf(`assets/js/${src}`);assert.ok(i>precedent,`${matiere} : ordre de ${src}`);precedent=i;
    }
    assert.match(html,new RegExp(`data-cours-matiere="${matiere}"`));assert.match(html,/data-course-unified=/);
    for(const id of ['cours','exercices','annexes','videos'])assert.match(html,new RegExp(`id="${id}"`));
    assert.equal((html.match(new RegExp(`href="\\.\\./quiz/${matiere}\\.html"`,'g'))||[]).length,2);
    assert.doesNotMatch(html,/<body[^>]*data-matiere=/i);
    assert.match(html,/Content-Security-Policy/);
  }
  assert.match(lire('cours/sql.html'),/id="bac"[^>]*sti-4si-only|class="[^"]*sti-4si-only[^"]*"[^>]*id="bac"/);
});

test('exemples historiques : 28 blocs SQL et 40 blocs PHP conservés dans le même ordre',()=>{
  for(const [matiere,n,empreinte] of [['sql',28,'66802e757c45d37855f5288c33cb25bc9a793dd75b5a7c7838ade7eb5d8e48a4'],
    ['php',40,'024614c3a05e762dd79dac2b45ed279d52f7ba4c8fa4a4e867eb6a1e72dad6f3']]){
    const html=lire(`cours/${matiere}.html`),blocs=[...html.matchAll(/<pre\b[^>]*>([\s\S]*?)<\/pre>/gi)].map(m=>m[1]);
    assert.equal(blocs.length,n);assert.equal(createHash('sha256').update(blocs.join('\0')).digest('hex'),empreinte);
  }
});

test('les liens et médias locaux présents dans les deux pages existent',()=>{
  for(const matiere of ['sql','php']){
    const html=lire(`cours/${matiere}.html`).replace(/<(pre|code)\b[^>]*>[\s\S]*?<\/\1>/gi,'').replace(/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/gi,'');
    for(const m of html.matchAll(/(?:href|src)="([^"]+)"/g)){
      const chemin=m[1];if(!chemin||chemin.startsWith('#')||/^(?:https?:|data:|blob:|mailto:|javascript:)/i.test(chemin))continue;
      const fichier=decodeURIComponent(chemin.split(/[?#]/)[0]);if(fichier)assert.ok(existsSync(resolve(racine,'cours',fichier)),`${matiere} : ${chemin}`);
    }
  }
});

test('SQL : guide audio, vidéos, séries, atelier et contrôleurs originaux',()=>{
  const html=lire('cours/sql.html'),js=lire('assets/js/cours-matieres.js'),voix=lire('assets/js/cours-sql-voix.js');
  for(const id of ['intro','ldd','lmd','bac','sqlContraintesModal','sqlEditor','sqlGuideFollow'])assert.ok(html.includes(`id="${id}"`),id);
  for(const nom of ['sql-cours','sql-initiation','sql-serie4','sql-serie5'])assert.ok(html.includes(`data-video-open="${nom}"`),nom);
  assert.match(voix,/\.\.\/assets\/audio\/sql-cours\.mp3/);assert.match(js,/ouvrirVideoPasAPasSTI/);
  assert.match(js,/délai de 5 secondes dépassé/);assert.match(lire('assets/js/cours-sql-worker.js'),/initSqlJs/);
});

test('PHP : dix chapitres, deux animations, deux solutions et quiz originaux procéduraux',()=>{
  const html=lire('cours/php.html');for(let i=1;i<=10;i++)assert.ok(html.includes(`id="s${i}"`),`s${i}`);
  for(const id of ['animModal','recapModal','exoModal','solModal','exo2Modal','sol2Modal','videoSynthese','phpCourseAudio','scoreQuiz'])assert.ok(html.includes(`id="${id}"`),id);
  for(const f of ['php-mysqli.html?embed=1','PHP-recap.html?embed=1','../assets/videos/php-synthese.mp4'])assert.ok(html.includes(f),f);
  assert.match(html,/mysqli_connect/);assert.match(html,/mysqli_query/);assert.doesNotMatch(html,/\bnew\s+mysqli\b|\bPDO\b/i);
  assert.equal((html.match(/class="synth-question"/g)||[]).length,10);
});

test('chapitrages vidéo originaux et persistance exclusivement via STIProfil',()=>{
  const context={window:{}};vm.runInNewContext(lire('assets/js/cours-media-reperes.js'),context);
  for(const [id,n] of [['sql-cours',11],['sql-initiation',10],['sql-serie4',18],['sql-serie5',23],['php-synthese',17]])assert.equal(context.window.STI_REPERES_MATIERES[id].length,n);
  for(const chemin of fichiers.filter(x=>x.endsWith('.js'))){const source=lire(chemin);assert.doesNotMatch(source,/\blocalStorage\b|\bsessionStorage\b|supabase\.co/);}
  assert.match(lire('assets/js/cours-matieres.js'),/STIProfil/);
});

test('service worker et installation complète contiennent les ressources et leurs empreintes',()=>{
  const sw=lire('sw.js'),m=JSON.parse(lire('offline-complete-manifest.json'));assert.equal(m.totalFiles,m.files.length);
  for(const chemin of [...fichiers,'cours/sql.html','cours/php.html','assets/js/sqljs/sql-wasm.js','assets/js/sqljs/sql-wasm.wasm']){
    assert.ok(sw.includes(`./${chemin}`),`service worker : ${chemin}`);
    const e=m.files.find(x=>x.path===chemin);assert.ok(e,`manifeste : ${chemin}`);
    const data=readFileSync(resolve(racine,chemin)),sha=createHash('sha1').update(`blob ${data.length}\0`).update(data).digest('hex');
    assert.equal(e.bytes,data.length);assert.equal(e.gitSha,sha,chemin);
  }
});
