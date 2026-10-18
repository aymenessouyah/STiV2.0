import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const read = p => readFileSync(join(root, p), 'utf8');

test('syntaxe des scripts v303', () => {
  for (const f of [
    'assets/js/acces.js',
    'assets/js/admin.js',
    'assets/js/portail.js',
    'assets/js/modules/labo-device-client.js',
    'assets/js/modules/admin-labo-devices.js',
    'sw.js'
  ]) execFileSync(process.execPath, ['--check', join(root, f)], { stdio: 'pipe' });
});

test('anciens contournements elevelabo3 neutralisés', () => {
  const portail = read('assets/js/portail.js');
  const acces = read('assets/js/acces.js');
  assert.doesNotMatch(portail, /id:\s*["']labo3-local["']/);
  assert.doesNotMatch(acces, /id:\s*["']labo3-local["']/);
  assert.match(portail, /anciens codes universels[^\n]+définitivement refusés/i);
  assert.match(portail, /Compte elevelabo3 verrouillé[^\n]+Internet/i);
  assert.match(acces, /aucune identité elevelabo3 ne peut être créée localement/i);
  assert.match(acces, /Hors-ligne désactivé/);
});

test('identité machine persistante et session serveur', () => {
  const client = read('assets/js/modules/labo-device-client.js');
  assert.match(client, /indexedDB\.open\(DB_NAME/);
  assert.match(client, /crypto\.getRandomValues/);
  assert.match(client, /crypto\.randomUUID/);
  assert.match(client, /labo_device_open_session/);
  assert.match(client, /setInterval\(heartbeat, 45000\)/);
  assert.match(client, /window\.addEventListener\(["']offline["']/);
  assert.match(client, /labo_device_mark_message/);
  assert.match(client, /postgres_changes/);
  assert.match(client, /https:\/\/ipapi\.co\/json\//);
  assert.match(client, /location:\s*readApproxLocation\(\)/);
});

test('mini-tableau intégré et actions AAL2', () => {
  const admin = read('assets/js/admin.js');
  const module = read('assets/js/modules/admin-labo-devices.js');
  assert.match(admin, /modules\/admin-labo-devices\.js\?v=303/);
  assert.match(admin, /requireMfa: exigerMfaAdmin/);
  assert.match(module, /admin_labo_devices_list/);
  assert.match(module, /admin_labo_device_action/);
  for (const action of ['allow', 'block', 'delete', 'rename', 'message']) {
    assert.match(module, new RegExp(`["']${action}["']`));
  }
  assert.match(module, /setInterval\([^]*20000\)/);
});

test('migration v303 : RLS restrictive, session_id et secrets hachés', () => {
  const sql = read('supabase/migrations/20261018_labo_device_control.sql');
  for (const table of ['labo_devices', 'labo_device_sessions', 'labo_device_messages']) {
    assert.match(sql, new RegExp(`create table if not exists public\\.${table}`));
  }
  assert.match(sql, /profiles_labo_device_gate[\s\S]+as restrictive/);
  assert.match(sql, /acces_labo_device_gate[\s\S]+as restrictive/);
  assert.match(sql, /auth\.jwt\(\) ->> 'session_id'/);
  assert.match(sql, /sha256\(convert_to\(p_device_secret, 'UTF8'\)\)/);
  assert.match(sql, /if not public\.est_admin_mfa\(\)/);
  assert.match(sql, /now\(\) \+ interval '3 minutes'/);
  assert.doesNotMatch(sql, /p_device_secret\s+text[^]*insert into public\.labo_devices[^]*p_device_secret,/i);
});

test('service worker v303+ reste différentiel et léger', () => {
  const sw = read('sw.js');
  assert.match(sw, /sti-atelier-v\d+/);
  assert.match(sw, /v\d+-(?:labo-devices|visible-labo-controls|device-location-offline)-1/);
  assert.match(sw, /labo-device-client\.js/);
  assert.match(sw, /admin-labo-devices\.js/);
  const manifest = sw.slice(sw.indexOf('var UPDATE_FILES'), sw.indexOf('var CACHE_REVISIONS'));
  assert.doesNotMatch(manifest, /\.(mp4|m4s|mp3|pdf|zip)/i);
});

test('contrôles sécurisés visibles depuis le bandeau Labo 3', () => {
  const admin = read('assets/js/admin.js');
  assert.match(admin, /id='btn-gerer-labo3-securise'/);
  assert.match(admin, /Gérer : Renommer · Autoriser\/Bloquer · Supprimer/);
  assert.match(admin, /chargerModuleLaboDevicesAdminV303\(\)[\s\S]*api\.open\(\)/);
});

test('localisation approximative et postes hors ligne restent visibles', () => {
  const module = read('assets/js/modules/admin-labo-devices.js');
  assert.match(module, /Localisation approximative/);
  assert.match(module, /⚪ Hors ligne/);
  assert.match(module, /const offline = devices\.filter/);
  assert.match(module, /Tous les postes enregistrés restent affichés, même hors ligne/);
});
