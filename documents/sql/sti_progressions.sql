-- ════════════════════════════════════════════════════════════════════
-- STI By AE — Table de sauvegarde cloud des progressions (point 10)
-- À exécuter UNE FOIS dans Supabase : Dashboard → SQL Editor → Run.
-- Chaque élève connecté y dépose ses progressions (tableau de bord,
-- quiz…) et les retrouve sur tous ses appareils.
-- ════════════════════════════════════════════════════════════════════
create table if not exists public.sti_progressions (
  user_id   uuid primary key references auth.users (id) on delete cascade,
  email     text,
  donnees   jsonb not null default '{}'::jsonb,
  maj       timestamptz not null default now()
);

alter table public.sti_progressions enable row level security;

-- Chacun ne lit et n'écrit que SA ligne (auth.uid()).
drop policy if exists "lire sa progression" on public.sti_progressions;
create policy "lire sa progression" on public.sti_progressions
  for select using (auth.uid() = user_id);

drop policy if exists "creer sa progression" on public.sti_progressions;
create policy "creer sa progression" on public.sti_progressions
  for insert with check (auth.uid() = user_id);

drop policy if exists "maj sa progression" on public.sti_progressions;
create policy "maj sa progression" on public.sti_progressions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Protection serveur monotone des XP & records de quiz (v478 : voir
-- supabase/migrations/20261027_xp_quiz_monotone_v478.sql — trigger BEFORE UPDATE
-- trg_sti_progressions_monotone_xp -> public.sti_progressions_preserver_xp()).

