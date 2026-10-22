-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION v365 — Réponses question par question des quiz (STI)
-- À exécuter une seule fois dans Supabase : SQL Editor → New query →
-- coller tout ce fichier → Run.
-- Crée la table sti_quiz_reponses : chaque question répondue par un
-- élève connecté (énoncé, bonne/mauvaise réponse), pour l'analyse
-- « questions les plus ratées » du tableau de bord admin.
-- Le compte laboratoire n'y écrit rien (géré côté site).
-- ═══════════════════════════════════════════════════════════════════

create table if not exists public.sti_quiz_reponses (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  email text,
  quiz text not null,
  module text,
  question_id text not null,
  enonce text,
  correct boolean not null,
  cree_le timestamptz not null default now()
);

create index if not exists sti_quiz_reponses_quiz_q_idx
  on public.sti_quiz_reponses (quiz, question_id);
create index if not exists sti_quiz_reponses_user_idx
  on public.sti_quiz_reponses (user_id, cree_le desc);

alter table public.sti_quiz_reponses enable row level security;

drop policy if exists sti_quiz_reponses_lecture on public.sti_quiz_reponses;
create policy sti_quiz_reponses_lecture on public.sti_quiz_reponses
  for select to authenticated
  using (public.est_admin() or user_id = auth.uid());

drop policy if exists sti_quiz_reponses_ecriture on public.sti_quiz_reponses;
create policy sti_quiz_reponses_ecriture on public.sti_quiz_reponses
  for insert to authenticated
  with check (user_id = auth.uid());

grant select, insert on public.sti_quiz_reponses to authenticated;
