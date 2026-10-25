-- =====================================================================
-- STI V2.0 — Migration v460 : Sauvegarde Supabase du score et de l'ordre
-- exact des questions (parties en cours + historique complet des parties)
-- Idempotent : peut être relancé sans danger dans Supabase SQL Editor.
-- =====================================================================

-- 1) Enrichissement de sti_quiz_parties : points obtenus + ordre exact des questions tirées
alter table public.sti_quiz_parties
  add column if not exists points integer,
  add column if not exists ordre_questions jsonb;

-- 2) Table sti_quiz_sessions : sauvegarde cloud temps réel d'une session de quiz en cours
--    (score courant, points, position courante, ordre exact des questions et des choix A/B/C/D)
create table if not exists public.sti_quiz_sessions (
  user_id         uuid not null references auth.users(id) on delete cascade,
  email           text,
  quiz            text not null check (quiz in ('html-css', 'javascript', 'sql', 'php', 'tableaux', 'examen-blanc')),
  module          text not null default '*',
  mode            text,
  statut          text not null default 'en_cours' check (statut in ('en_cours', 'terminee')),
  score           integer not null default 0 check (score >= 0),
  points          integer not null default 0,
  total           integer not null default 1 check (total > 0),
  index_courant   integer not null default 0 check (index_courant >= 0),
  ordre_questions jsonb not null default '[]'::jsonb,
  etat_meta       jsonb not null default '{}'::jsonb,
  maj             timestamptz not null default now(),
  primary key (user_id, quiz)
);

create index if not exists sti_quiz_sessions_maj_idx
  on public.sti_quiz_sessions (maj desc);

alter table public.sti_quiz_sessions enable row level security;

drop policy if exists sti_quiz_sessions_lecture on public.sti_quiz_sessions;
create policy sti_quiz_sessions_lecture on public.sti_quiz_sessions
  for select to authenticated
  using (public.est_admin() or user_id = auth.uid());

drop policy if exists sti_quiz_sessions_ecriture on public.sti_quiz_sessions;
create policy sti_quiz_sessions_ecriture on public.sti_quiz_sessions
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists sti_quiz_sessions_maj on public.sti_quiz_sessions;
create policy sti_quiz_sessions_maj on public.sti_quiz_sessions
  for update to authenticated
  using (public.est_admin() or user_id = auth.uid())
  with check (public.est_admin() or user_id = auth.uid());

drop policy if exists sti_quiz_sessions_suppression on public.sti_quiz_sessions;
create policy sti_quiz_sessions_suppression on public.sti_quiz_sessions
  for delete to authenticated
  using (public.est_admin() or user_id = auth.uid());

grant select, insert, update, delete on public.sti_quiz_sessions to authenticated;
