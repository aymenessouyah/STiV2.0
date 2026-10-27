import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import pg from 'pg';

const url = process.env.STI_TEST_POSTGRES_URL;
const fichiers = [
  '../supabase/migrations/20261027_media_prog_monotone_v479.sql',
  '../supabase/migrations/20261027_xp_quiz_sync_v485.sql',
  '../supabase/migrations/20261027_xp_quiz_operations_v487.sql'
];

/* Ce scénario exige une base jetable locale : jamais une base de production. */
test('PostgreSQL : gains concurrents, nouveaux essais et upserts historiques', { skip: !url, timeout: 90_000 }, async () => {
  const adresse = new URL(url);
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(adresse.hostname), 'PostgreSQL doit être local');
  assert.equal(adresse.pathname, '/sti_xp_tests', 'utiliser exclusivement la base de test jetable');
  const pool = new pg.Pool({ connectionString: url, max: 30 });
  const admin = await pool.connect();
  const uid = randomUUID(), autre = randomUUID(), cle = 'quizzora_xp_v1';
  try {
    await admin.query(`
      drop schema if exists auth cascade;
      drop schema if exists public cascade;
      create schema public;
      create schema auth;
      do $$ begin create role anon nologin; exception when duplicate_object then null; end $$;
      do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
      grant usage on schema public, auth to authenticated, anon;
      create table auth.users (id uuid primary key);
      create function auth.jwt() returns jsonb language sql stable as $$
        select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
      $$;
      create function auth.uid() returns uuid language sql stable as $$ select nullif(auth.jwt()->>'sub', '')::uuid $$;
      grant execute on function auth.jwt(), auth.uid() to authenticated, anon;
      create table public.sti_progressions (user_id uuid primary key references auth.users(id), email text not null, donnees jsonb not null, maj timestamptz not null);
      alter table public.sti_progressions enable row level security;
      create policy creer on public.sti_progressions for insert with check (auth.uid() = user_id);
      create policy lire on public.sti_progressions for select using (auth.uid() = user_id);
      create policy modifier on public.sti_progressions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
      grant select, insert, update on public.sti_progressions to authenticated;
    `);
    for (const fichier of fichiers) await admin.query(await readFile(new URL(fichier, import.meta.url), 'utf8'));
    await admin.query('insert into auth.users values ($1), ($2)', [uid, autre]);
    const initial = { [cle]: JSON.stringify({ xp: 1000 }), 'sti-profil-abonne': '{"notes":["préserver"]}' };
    await admin.query('insert into public.sti_progressions values ($1, $2, $3::jsonb, now())', [uid, 'test@example.invalid', JSON.stringify(initial)]);

    async function transaction(id, callback) {
      const client = await pool.connect();
      try {
        await client.query('begin');
        await client.query('set local statement_timeout = 15000');
        await client.query('set local role authenticated');
        await client.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: id, email: 'test@example.invalid' })]);
        const resultat = await callback(client);
        await client.query('commit');
        return resultat;
      } catch (e) {
        await client.query('rollback');
        throw e;
      } finally { client.release(); }
    }
    const ops = Array.from({ length: 30 }, (_, i) => ({ id: randomUUID(), gain: i + 1 }));
    const valeur = JSON.stringify({ xp: 1000 });
    const appeler = op => transaction(uid, client => client.query(
      'select public.sti_appliquer_gains_xp_quiz($1, $2::jsonb, $3::jsonb) as valeur',
      [cle, valeur, JSON.stringify([op])]
    ));
    const ancienPost = op => transaction(uid, client => {
      const donnees = {
        [cle]: JSON.stringify({ xp: 1000 + op.gain, _sti_xp_attente: op.gain }),
        'sti-profil-abonne': initial['sti-profil-abonne'],
        'sti-xp-protocole-v487': JSON.stringify({ uid, version: 2, attentes: { [cle]: op.gain } })
      };
      return client.query(`insert into public.sti_progressions (user_id, email, donnees, maj)
        values (auth.uid(), 'test@example.invalid', $1::jsonb, now())
        on conflict (user_id) do update set donnees = excluded.donnees, maj = excluded.maj`, [JSON.stringify(donnees)]);
    });
    // Trois tentatives simultanées pour chaque opération, et des upserts concurrents.
    const travail = ops.flatMap(op => [appeler(op), appeler(op), appeler(op), ancienPost(op)]);
    await Promise.all(travail);
    const resultat = await admin.query('select donnees from public.sti_progressions where user_id = $1', [uid]);
    const donnees = resultat.rows[0].donnees;
    assert.equal(JSON.parse(donnees[cle]).xp, 1000 + ops.reduce((n, o) => n + o.gain, 0));
    assert.equal(donnees['sti-profil-abonne'], initial['sti-profil-abonne']);
    assert.equal(donnees['sti-xp-protocole-v487'], undefined);
    const journal = await admin.query('select count(*)::int as n, sum(gain)::int as gains from public.sti_quiz_xp_operations where user_id = $1', [uid]);
    assert.deepEqual(journal.rows[0], { n: 30, gains: 465 });

    // Un ancien client v485 peut encore améliorer son maximum sans perdre les gains enregistrés.
    await transaction(uid, client => client.query(
      'select public.sti_synchroniser_xp_quiz($1, $2::jsonb)', [cle, JSON.stringify({ xp: 5000 })]
    ));
    await appeler({ id: randomUUID(), gain: 10 });
    const apresAncien = await admin.query('select donnees from public.sti_progressions where user_id = $1', [uid]);
    assert.equal(JSON.parse(apresAncien.rows[0].donnees[cle]).xp, 5010);

    const autreCompte = await transaction(autre, client => client.query(
      'select public.sti_appliquer_gains_xp_quiz($1, $2::jsonb, $3::jsonb) as valeur',
      [cle, JSON.stringify({ xp: 0 }), JSON.stringify([{ id: ops[0].id, gain: 9 }])]
    ));
    assert.equal(autreCompte.rows[0].valeur.valeur.xp, 9);
    const invisible = await transaction(autre, client => client.query('select user_id from public.sti_progressions where user_id = $1', [uid]));
    assert.equal(invisible.rowCount, 0);
    await assert.rejects(transaction(uid, client => client.query('select * from public.sti_quiz_xp_operations')), /permission denied/i);
  } finally {
    admin.release();
    await pool.end();
  }
});
