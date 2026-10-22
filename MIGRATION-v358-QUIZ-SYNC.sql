-- =====================================================================
-- STI V2.0 — Migration v358 : synchronisation centrale des quiz
-- À exécuter une seule fois dans Supabase (SQL Editor), en tant que
-- propriétaire du projet. Idempotent : peut être relancé sans danger.
--
-- Crée deux tables :
--   sti_quiz_parties : CHAQUE partie jouée (rejouable à l'infini) —
--                      quiz, module, score, total, pourcentage, date.
--                      Permet dernier score / meilleur score / nombre
--                      de parties / tableau détaillé côté admin.
--   sti_quiz_vus     : questions déjà répondues du « Quiz des tableaux »
--                      (tirage sans jamais répéter, synchronisé entre
--                      appareils).
-- Sécurité (RLS) : un élève ne voit et n'écrit que SES lignes ;
-- l'administrateur (public.est_admin()) lit tout.
-- =====================================================================

-- ---------- Table des parties jouées ----------
create table if not exists public.sti_quiz_parties (
  id        bigint generated always as identity primary key,
  user_id   uuid not null references auth.users(id) on delete cascade,
  email     text,
  quiz      text not null check (quiz in ('html-css', 'javascript', 'sql', 'php', 'tableaux')),
  module    text,
  score     integer not null check (score >= 0),
  total     integer not null check (total > 0),
  pct       numeric generated always as (round(score * 100.0 / total, 1)) stored,
  cree_le   timestamptz not null default now(),
  check (score <= total)
);

create index if not exists sti_quiz_parties_user_idx
  on public.sti_quiz_parties (user_id, quiz, cree_le desc);
create index if not exists sti_quiz_parties_date_idx
  on public.sti_quiz_parties (cree_le desc);

alter table public.sti_quiz_parties enable row level security;

drop policy if exists sti_quiz_parties_lecture on public.sti_quiz_parties;
create policy sti_quiz_parties_lecture on public.sti_quiz_parties
  for select to authenticated
  using (public.est_admin() or user_id = auth.uid());

drop policy if exists sti_quiz_parties_ecriture on public.sti_quiz_parties;
create policy sti_quiz_parties_ecriture on public.sti_quiz_parties
  for insert to authenticated
  with check (user_id = auth.uid());

grant select, insert on public.sti_quiz_parties to authenticated;

-- ---------- Table des questions déjà vues (Quiz des tableaux) ----------
create table if not exists public.sti_quiz_vus (
  user_id     uuid not null references auth.users(id) on delete cascade,
  module      text not null,
  question_id text not null,
  vu_le       timestamptz not null default now(),
  primary key (user_id, module, question_id)
);

alter table public.sti_quiz_vus enable row level security;

drop policy if exists sti_quiz_vus_lecture on public.sti_quiz_vus;
create policy sti_quiz_vus_lecture on public.sti_quiz_vus
  for select to authenticated
  using (public.est_admin() or user_id = auth.uid());

drop policy if exists sti_quiz_vus_ecriture on public.sti_quiz_vus;
create policy sti_quiz_vus_ecriture on public.sti_quiz_vus
  for insert to authenticated
  with check (user_id = auth.uid());

grant select, insert on public.sti_quiz_vus to authenticated;

-- ---------- Contrôle rapide (doit renvoyer les deux tables) ----------
-- select table_name from information_schema.tables
-- where table_schema = 'public'
--   and table_name in ('sti_quiz_parties', 'sti_quiz_vus');
