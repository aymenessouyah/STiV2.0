import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const lire = p => readFileSync(join(root, p), 'utf8');

test('syntaxe JavaScript v302', () => {
  for (const f of ['assets/js/acces.js','assets/js/admin.js','assets/js/portail.js','assets/js/protection.js','assets/js/modules/admin-mfa.js','assets/js/modules/mobile-diagnostics.js','sw.js']) {
    execFileSync(process.execPath, ['--check', join(root, f)], { stdio: 'pipe' });
  }
});

test('aucun transport ntfy ni jeton applicatif actif', () => {
  const code = ['assets/js/acces.js','assets/js/admin.js','assets/js/portail.js'].map(lire).join('\n');
  assert.doesNotMatch(code, /ntfy\.sh/i);
  assert.doesNotMatch(code, /sessionToken\s*:/);
  assert.doesNotMatch(code, /setItem\(["']sti-session-token/);
  assert.match(code, /removeItem\(["']sti-session-token/);
});

test('outbox idempotente IndexedDB et migration compatible', () => {
  const code = lire('assets/js/acces.js');
  assert.match(code, /indexedDB\.open\(DB_FILE_OFFLINE/);
  assert.match(code, /crypto\.randomUUID/);
  assert.match(code, /onConflict: ["']user_id,client_event_id/);
  assert.match(code, /ignoreDuplicates: true/);
  assert.match(code, /envoyerFileHorsLigneIdb\(user\)/);
});

test('delta profils et pagination serveur', () => {
  const code = lire('assets/js/admin.js');
  assert.match(code, /gt\(["']updated_at["'], dernierProfilUpdatedAtAdmin\)/);
  assert.match(code, /TAILLE_PAGE_ACCES_ADMIN = 100/);
  assert.match(code, /lt\(["']id["'], minId\)/);
  assert.match(code, /visibilityState !== ["']hidden["']/);
  assert.match(code, /DELAI_ACTUALISATION_ADMIN_MS = 20000/);
});

test('migration RLS, Realtime et AAL2', () => {
  const sql = lire('supabase/migrations/20261018_mobile_security.sql');
  assert.match(sql, /profiles[\s\S]*updated_at/);
  assert.match(sql, /client_event_id/);
  assert.match(sql, /unique index if not exists uq_acces_user_client_event/);
  assert.match(sql, /est_admin_mfa/);
  assert.match(sql, /auth\.jwt\(\) ->> 'aal'/);
  assert.match(sql, /alter publication supabase_realtime add table public\.profiles/);
  assert.match(sql, /alter publication supabase_realtime add table public\.acces/);
  assert.match(sql, /admin_sync_badges/);
  assert.match(sql, /sha256\(convert_to\(upper\(e->>'code'\), 'UTF8'\)\)/);
  assert.match(sql, /sha256\(convert_to\(upper\(trim\(coalesce\(code_saisi, ''\)\)\), 'UTF8'\)\)/);
  assert.doesNotMatch(sql, /(?<![a-z])digest\s*\(/i);
});

test('HLS CSS3 cohérent, trois renditions et plages d’octets', () => {
  const master = lire('assets/streams/css3-v302/master.m3u8');
  for (const r of ['854x480','1280x720','1920x1080']) assert.match(master, new RegExp(r));
  for (const q of ['480','720','1080']) {
    const playlist = lire(`assets/streams/css3-v302/css3-${q}p.m3u8`);
    assert.match(playlist, /#EXT-X-BYTERANGE/);
    assert.match(playlist, new RegExp(`css3-${q}p\\.m4s`));
    assert.ok(statSync(join(root, `assets/streams/css3-v302/css3-${q}p.m4s`)).size > 1_000_000);
  }
  const protection = lire('assets/js/protection.js');
  assert.match(protection, /var VIDEO_CSS3_INFO\s*=\s*\{/);
  assert.match(protection, /css3-cours-v9-sync\.mp4\?v=309/);
  assert.match(protection, /mobileFile:\s*"css3-cours-v9-sync-mobile-720p\.mp4\?v=309"/);
  assert.match(protection, /subtitlesFile:\s*"subtitles\/css3-cours-v9-sync-fr\.vtt\?v=309"/);
  assert.match(protection, /hlsFile:\s*""/);
  assert.match(protection, /vendor\/hls\.min\.js/);
});

test('variantes modernes présentes avec secours JPG et choix à la demande', () => {
  const bases = ['css-restaurant-capture-v298','css3-cours-v8-poster','php-guichet-v10-poster','sql-initiation-poster','sql-serie4-poster','sql-serie5-poster'];
  for (const b of bases) {
    for (const ext of ['jpg','webp','avif']) assert.ok(statSync(join(root, `assets/images/${b}.${ext}`)).isFile());
  }
  const code = lire('assets/js/protection.js');
  assert.match(code, /AFFICHES_OPTIMISEES_STI/);
  assert.match(code, /\.avif\?v=302/);
  assert.match(code, /\.webp\?v=302/);
});

test('service worker différentiel, quota et éviction LRU sûre', () => {
  const sw = lire('sw.js');
  const manifeste = sw.slice(sw.indexOf('var UPDATE_FILES'), sw.indexOf('var CACHE_REVISIONS'));
  assert.doesNotMatch(manifeste, /\.(mp4|m4s|mp3)/i);
  assert.match(sw, /PRECACHE_ALL_USER/);
  assert.match(sw, /evincerRuntimeLRUSTI/);
  assert.match(sw, /quota \* 0\.70/);
  assert.match(sw, /STI_CACHE_HIT/);
  assert.match(sw, /Une requête Range reste une requête Range/);
});

test('modules lourds chargés dynamiquement', () => {
  assert.match(lire('assets/js/admin.js'), /import\(urlModule\)/);
  assert.match(lire('assets/js/protection.js'), /import\(urlModule\)/);
  assert.ok(readdirSync(join(root, 'assets/js/modules')).includes('admin-mfa.js'));
  assert.ok(readdirSync(join(root, 'assets/js/modules')).includes('mobile-diagnostics.js'));
});
