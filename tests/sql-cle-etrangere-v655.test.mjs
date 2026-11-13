import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('la note SQL précise la compatibilité de type de la clé étrangère', () => {
  const html = readFileSync('cours/sql.html', 'utf8');
  const note = [...html.matchAll(/<div class="analogy-note">[\s\S]*?<\/div>/g)]
    .map(match => match[0]).find(value => value.includes('qui est cette ligne'));
  assert.ok(note);
  const texte = note.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
  assert.ok(texte.includes('La clé étrangère doit avoir un type de données compatible avec la clé référencée dans la table mère. En pratique, on utilise généralement exactement le même type et les mêmes attributs.'));
  assert.ok(!texte.includes('Une clé étrangère a toujours le même type'));
});

test('la page corrigée est actualisée dans le service worker et son manifeste', () => {
  const sw = readFileSync('sw.js', 'utf8');
  assert.ok(sw.includes('url: "./cours/sql.html", revision: "serie8-sql-v656"'));
  const manifest = JSON.parse(readFileSync('offline-complete-manifest.json', 'utf8'));
  assert.ok(manifest.files.some(f => f.path === 'cours/sql.html'));
});
