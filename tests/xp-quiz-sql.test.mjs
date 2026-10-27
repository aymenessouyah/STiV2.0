import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const migration = await readFile(new URL('../supabase/migrations/20261027_xp_quiz_sync_v485.sql', import.meta.url), 'utf8');
const trigger = await readFile(new URL('../supabase/migrations/20261027_media_prog_monotone_v479.sql', import.meta.url), 'utf8');
const a = '8a875a8e-a8bb-447b-a129-90e35cbc65d0';
const b = '9ad8ef17-6d8a-4302-bf45-25b6018c0371';

async function base() {
  const db = new PGlite();
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create schema auth;
    create table auth.users (id uuid primary key);
    insert into auth.users values ('${a}'), ('${b}');
    create function auth.jwt() returns jsonb language sql stable as $$
      select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
    $$;
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(auth.jwt()->>'sub', '')::uuid
    $$;
    grant usage on schema auth to authenticated, anon;
    grant execute on function auth.jwt(), auth.uid() to authenticated, anon;
    create table public.sti_progressions (
      user_id uuid primary key references auth.users(id),
      email text not null, donnees jsonb not null, maj timestamptz not null
    );
    alter table public.sti_progressions enable row level security;
    create policy "creer sa progression" on public.sti_progressions for insert with check (auth.uid() = user_id);
    create policy "lire sa progression" on public.sti_progressions for select using (auth.uid() = user_id);
    create policy "maj sa progression" on public.sti_progressions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
    grant select, insert, update on public.sti_progressions to authenticated;
  `);
  await db.exec(trigger);
  await db.exec(migration);
  return db;
}

async function connexion(db, uid) {
  await db.exec('reset role');
  await db.exec(`select set_config('request.jwt.claims', '{"sub":"${uid}","email":"test@example.invalid"}', false); set role authenticated;`);
}
async function sync(db, cle, valeur) {
  const r = await db.query('select public.sti_synchroniser_xp_quiz($1, $2::jsonb) as valeur', [cle, JSON.stringify(valeur)]);
  return r.rows[0].valeur;
}
async function donnees(db) {
  const r = await db.query('select donnees from public.sti_progressions');
  assert.equal(r.rows.length, 1);
  return r.rows[0].donnees;
}

test('XP atomiques : maxima, autres données préservées et isolation RLS', async () => {
  const db = await base();
  try {
    await connexion(db, a);
    await db.query('insert into public.sti_progressions values (auth.uid(), $1, $2::jsonb, now())', [
      'test@example.invalid', JSON.stringify({
        'sti-profil-abonne': '{"theme":"sombre","notes":["conserver"]}',
        'sti-media-prog-v1': '{"video":{"pct":75}}',
        quizzora_xp_v1: '{"xp":1000,"best":4,"parties":2}',
        sqlQuestV3: JSON.stringify({ xp: 900, level: 3, pseudo: 'Rim', avatar: 'R', profileSet: true, best: { select: 15 }, history: [{ note: 'garder' }] }),
        quizphp_v1_user: JSON.stringify({ xp: 500, best: 4, streak: 2, name: 'Rim', avatar: 'R' })
      })
    ]);
    assert.equal((await sync(db, 'quizzora_xp_v1', { xp: 300, best: 6, parties: 1 })).xp, 1000);
    assert.equal((await sync(db, 'quizzora_xp_v1', { xp: 1250, best: 6, parties: 3 })).xp, 1250);
    assert.equal((await sync(db, 'quizzora_xp_v1', { xp: 1100 })).xp, 1250);
    const sql = await sync(db, 'sqlQuestV3', { xp: 1000, level: 2, pseudo: 'Apprenti SQL', best: { select: 12, join: 18 } });
    assert.equal(sql.xp, 1000); assert.equal(sql.level, 3); assert.equal(sql.pseudo, 'Rim');
    assert.deepEqual(sql.best, { select: 15, join: 18 });
    assert.deepEqual(sql.history, [{ note: 'garder' }]);
    const php = await sync(db, 'quizphp_v1_user', { xp: 400, name: '', avatar: '?' });
    assert.equal(php.xp, 500); assert.equal(php.name, 'Rim'); assert.equal(php.avatar, 'R');
    const rowA = await donnees(db);
    assert.equal(rowA['sti-profil-abonne'], '{"theme":"sombre","notes":["conserver"]}');
    // Le trigger v479 existant normalise les champs média, sans diminuer la lecture.
    assert.equal(JSON.parse(rowA['sti-media-prog-v1']).video.pct, 75);
    assert.equal(typeof rowA.quizzora_xp_v1, 'string');
    assert.equal(JSON.parse(rowA.quizzora_xp_v1).xp, 1250);

    await connexion(db, b);
    assert.deepEqual((await db.query('select user_id from public.sti_progressions')).rows, []);
    assert.equal((await sync(db, 'quizzora_xp_v1', { xp: 250 })).xp, 250);
    assert.equal(JSON.parse((await donnees(db)).quizzora_xp_v1).xp, 250);
    await connexion(db, a);
    assert.equal(JSON.parse((await donnees(db)).quizzora_xp_v1).xp, 1250);

    await assert.rejects(sync(db, 'sti-profil-abonne', { xp: 999 }), /invalide/i);
    await assert.rejects(sync(db, null, { xp: 999 }), /invalide/i);
    await assert.rejects(sync(db, 'quizzora_xp_v1', { xp: -1 }), /invalide/i);
    assert.equal(JSON.parse((await donnees(db)).quizzora_xp_v1).xp, 1250);
    await db.exec('reset role; set role anon');
    await assert.rejects(sync(db, 'quizzora_xp_v1', { xp: 999 }), /permission denied/i);
  } finally { await db.close(); }
});

test('XP : les données historiques illisibles ne sont jamais remplacées', async () => {
  const db = await base();
  try {
    await connexion(db, a);
    await db.query('insert into public.sti_progressions values (auth.uid(), $1, $2::jsonb, now())', [
      'test@example.invalid', JSON.stringify({ quizzora_xp_v1: '{données cassées', cours: 'intact' })
    ]);
    await assert.rejects(sync(db, 'quizzora_xp_v1', { xp: 250 }), /illisible/i);
    assert.equal((await donnees(db)).quizzora_xp_v1, '{données cassées');
    assert.equal((await donnees(db)).cours, 'intact');
    await db.query('update public.sti_progressions set donnees = $1::jsonb where user_id = auth.uid()', [JSON.stringify({ quizzora_xp_v1: '{"xp":"erreur"}', cours: 'intact' })]);
    await assert.rejects(sync(db, 'quizzora_xp_v1', { xp: 250 }), /illisible/i);
    assert.equal(JSON.parse((await donnees(db)).quizzora_xp_v1).xp, 'erreur');
  } finally { await db.close(); }
});
