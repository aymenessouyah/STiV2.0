-- ═══════════════ STI v397 — Observations privées de l'enseignant (sti_observations) ═══════════════
-- À exécuter UNE SEULE FOIS dans l'éditeur SQL de Supabase.
-- Carnet du professeur : notes libres horodatées sur la fiche de chaque élève.
-- Personne d'autre que vous ne peut lire ou écrire cette table (aucune policy élève).

create table if not exists public.sti_observations (
  id      bigint generated always as identity primary key,
  eleve   uuid not null references auth.users (id) on delete cascade,
  texte   text not null check (char_length(texte) between 1 and 500),
  cree_le timestamptz not null default now()
);

create index if not exists sti_observations_eleve_idx on public.sti_observations (eleve, cree_le desc);

alter table public.sti_observations enable row level security;

drop policy if exists "admin ecrit observations" on public.sti_observations;
create policy "admin ecrit observations" on public.sti_observations
  for insert to authenticated with check ( (auth.jwt() ->> 'email') = 'aymenessouyah@gmail.com' );

drop policy if exists "admin lit observations" on public.sti_observations;
create policy "admin lit observations" on public.sti_observations
  for select to authenticated using ( (auth.jwt() ->> 'email') = 'aymenessouyah@gmail.com' );

drop policy if exists "admin efface observations" on public.sti_observations;
create policy "admin efface observations" on public.sti_observations
  for delete to authenticated using ( (auth.jwt() ->> 'email') = 'aymenessouyah@gmail.com' );

-- Pas de policy UPDATE par choix : une observation ne s'édite pas, elle s'efface ou se complète.
