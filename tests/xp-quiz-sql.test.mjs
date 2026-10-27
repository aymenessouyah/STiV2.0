import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const migration = await readFile(new URL('../supabase/migrations/20261027_xp_quiz_sync_v485.sql', import.meta.url), 'utf8');
const trigger = await readFile(new URL('../supabase/migrations/20261027_media_prog_monotone_v479.sql', import.meta.url), 'utf8');
const operations = await readFile(new URL('../supabase/migrations/20261027_xp_quiz_operations_v487.sql', import.meta.url), 'utf8');
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

async function appliquer(db, cle, valeur, evenements) {
  const r = await db.query('select public.sti_appliquer_gains_xp_quiz($1, $2::jsonb, $3::jsonb) as resultat', [cle, JSON.stringify(valeur), JSON.stringify(evenements)]);
  return r.rows[0].resultat;
}
const operation = (n, gain) => ({ id: `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`, gain });

test('XP : deux gains hors ligne se cumulent une seule fois, malgré les renvois et les anciens POST', async () => {
  const db = await base();
  try {
    await db.exec(operations); await connexion(db, a);
    await db.query('insert into public.sti_progressions values (auth.uid(), $1, $2::jsonb, now())', [
      'test@example.invalid', JSON.stringify({ quizzora_xp_v1: '{"xp":1000,"best":3}', 'sti-profil-abonne': '{"notes":["garder"]}' })
    ]);
    // Un ancien POST général arrive avant la première RPC : son XP provisoire n'initialise pas la base.
    await db.query('update public.sti_progressions set donnees = $1::jsonb where user_id = auth.uid()', [JSON.stringify({
      quizzora_xp_v1: JSON.stringify({ xp: 1250, best: 4, _sti_xp_attente: 250 }), 'sti-profil-abonne': '{"notes":["garder"]}'
    })]);
    assert.equal(JSON.parse((await donnees(db)).quizzora_xp_v1).xp, 1000);
    let r = await appliquer(db, 'quizzora_xp_v1', { xp: 1000, best: 4 }, [operation(1, 250)]);
    assert.equal(r.valeur.xp, 1250); assert.deepEqual(r.confirmes, [operation(1, 250).id]);
    r = await appliquer(db, 'quizzora_xp_v1', { xp: 1000, best: 5 }, [operation(2, 400)]);
    assert.equal(r.valeur.xp, 1650); assert.equal(r.valeur.best, 5);
    // Une réponse perdue entraîne un nouveau POST identique : aucune double attribution.
    r = await appliquer(db, 'quizzora_xp_v1', { xp: 1000 }, [operation(1, 250), operation(2, 400)]);
    assert.equal(r.valeur.xp, 1650);
    await assert.rejects(appliquer(db, 'quizzora_xp_v1', { xp: 1000 }, [operation(1, 251)]), /déjà utilisé/);
    // Un POST du nouveau protocole ne peut ni diminuer ni gonfler le total géré.
    await db.query('update public.sti_progressions set donnees = $1::jsonb where user_id = auth.uid()', [JSON.stringify({
      quizzora_xp_v1: '{"xp":9999,"best":6}', 'sti-profil-abonne': '{"notes":["garder"]}',
      'sti-xp-protocole-v487': JSON.stringify({ uid: a, version: 2, attentes: {} })
    })]);
    const row = await donnees(db);
    assert.equal(JSON.parse(row.quizzora_xp_v1).xp, 1650);
    assert.equal(JSON.parse(row.quizzora_xp_v1).best, 6);
    assert.equal(row['sti-profil-abonne'], '{"notes":["garder"]}');
    assert.equal(row['sti-xp-protocole-v487'], undefined);
    // Une ancienne version peut encore transmettre un nouveau maximum.
    await db.query('update public.sti_progressions set donnees = $1::jsonb where user_id = auth.uid()', [JSON.stringify({ quizzora_xp_v1: '{"xp":1750}', 'sti-profil-abonne': '{"notes":["garder"]}' })]);
    assert.equal(JSON.parse((await donnees(db)).quizzora_xp_v1).xp, 1750);
    assert.equal((await appliquer(db, 'quizzora_xp_v1', { xp: 1750 }, [operation(3, 50)])).valeur.xp, 1800);
    await assert.rejects(db.query('select * from public.sti_quiz_xp_operations'), /permission denied/i);

    await connexion(db, b);
    assert.equal((await appliquer(db, 'quizzora_xp_v1', { xp: 0 }, [operation(1, 75)])).valeur.xp, 75);
    await connexion(db, a);
    assert.equal(JSON.parse((await donnees(db)).quizzora_xp_v1).xp, 1800);
    await db.exec('reset role; set role anon');
    await assert.rejects(appliquer(db, 'quizzora_xp_v1', { xp: 0 }, [operation(3, 100)]), /permission denied/i);
  } finally { await db.close(); }
});

test('XP : insertion avec opérations locales, quatre quiz, données invalides et transaction atomique', async () => {
  const db = await base();
  try {
    await db.exec(operations); await connexion(db, a);
    await db.query('insert into public.sti_progressions values (auth.uid(), $1, $2::jsonb, now())', [
      'test@example.invalid', JSON.stringify({ 'sti-quiz-xp-js-v1': JSON.stringify({ xp: 450, _sti_xp_attente: 150 }), sqlQuestV3: '{"xp":90,"pseudo":"Rim"}', quizphp_v1_user: '{"xp":20,"name":"Rim"}' })
    ]);
    assert.equal(JSON.parse((await donnees(db))['sti-quiz-xp-js-v1']).xp, 300);
    for (const [cle, baseXp, gain, n] of [['sti-quiz-xp-js-v1', 300, 150, 10], ['sqlQuestV3', 90, 20, 11], ['quizphp_v1_user', 20, 30, 12]]) {
      const r = await appliquer(db, cle, { xp: baseXp }, [operation(n, gain)]);
      assert.equal(r.valeur.xp, baseXp + gain, cle);
    }
    // Un lot invalide ne doit enregistrer aucun des gains précédents du lot.
    await assert.rejects(appliquer(db, 'sqlQuestV3', { xp: 90 }, [operation(13, 50), operation(14, -1)]), /invalide/i);
    assert.equal(JSON.parse((await donnees(db)).sqlQuestV3).xp, 110);
    assert.equal((await appliquer(db, 'sqlQuestV3', { xp: 90 }, [operation(13, 50)])).valeur.xp, 160);
    await assert.rejects(appliquer(db, 'sti-profil-abonne', { xp: 0 }, [operation(15, 1)]), /invalide/i);
    await db.query('update public.sti_progressions set donnees = $1::jsonb where user_id = auth.uid()', [JSON.stringify({ quizzora_xp_v1: '{illisible', cours: 'intact' })]);
    await assert.rejects(appliquer(db, 'quizzora_xp_v1', { xp: 10 }, [operation(16, 10)]), /illisible/i);
    assert.equal((await donnees(db)).quizzora_xp_v1, '{illisible');
  } finally { await db.close(); }
});

test('XP : un upsert historique filtre les gains provisoires avant et après activation', async () => {
  const db = await base();
  try {
    await db.exec(operations); await connexion(db, a);
    await db.query('insert into public.sti_progressions values (auth.uid(), $1, $2::jsonb, now())', [
      'test@example.invalid', JSON.stringify({ quizzora_xp_v1: '{"xp":1000}' })
    ]);
    const post = async value => db.query(`insert into public.sti_progressions (user_id, email, donnees, maj)
      values (auth.uid(), 'test@example.invalid', $1::jsonb, now())
      on conflict (user_id) do update set donnees = excluded.donnees, maj = excluded.maj`, [JSON.stringify({ quizzora_xp_v1: JSON.stringify(value) })]);
    await post({ xp: 1250, _sti_xp_attente: 250 });
    assert.equal(JSON.parse((await donnees(db)).quizzora_xp_v1).xp, 1000);
    assert.equal((await appliquer(db, 'quizzora_xp_v1', { xp: 1000 }, [operation(31, 250)])).valeur.xp, 1250);
    await post({ xp: 1500, _sti_xp_attente: 250 });
    assert.equal(JSON.parse((await donnees(db)).quizzora_xp_v1).xp, 1250);
    assert.equal((await appliquer(db, 'quizzora_xp_v1', { xp: 1250 }, [operation(32, 250)])).valeur.xp, 1500);
  } finally { await db.close(); }
});

test('XP : le marqueur général protège les gains si la fusion historique enlève le marqueur du quiz', async () => {
  const db = await base();
  try {
    await db.exec(operations); await connexion(db, a);
    await db.query('insert into public.sti_progressions values (auth.uid(), $1, $2::jsonb, now())', [
      'test@example.invalid', JSON.stringify({ quizzora_xp_v1: '{"xp":1000}' })
    ]);
    const payload = {
      quizzora_xp_v1: '{"xp":1250}',
      'sti-xp-protocole-v487': JSON.stringify({ uid: a, version: 2, attentes: { quizzora_xp_v1: 250 } })
    };
    await db.query(`insert into public.sti_progressions (user_id,email,donnees,maj)
      values (auth.uid(), 'test@example.invalid', $1::jsonb, now())
      on conflict (user_id) do update set donnees = excluded.donnees, maj = excluded.maj`, [JSON.stringify(payload)]);
    const stocke = await donnees(db);
    assert.equal(JSON.parse(stocke.quizzora_xp_v1).xp, 1000);
    assert.equal(stocke['sti-xp-protocole-v487'], undefined);
    assert.equal((await appliquer(db, 'quizzora_xp_v1', { xp: 1000 }, [operation(40, 250)])).valeur.xp, 1250);
  } finally { await db.close(); }
});
