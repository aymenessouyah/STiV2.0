-- ═══════════════ STI v394 — Journal d'erreurs (sti_diagnostics) ═══════════════
-- À exécuter UNE SEULE FOIS dans l'éditeur SQL de Supabase.
-- Chaque élève connecté signale ses erreurs JS vers cette table ;
-- seul le professeur (aymenessouyah@gmail.com) peut les lire et les marquer lues.

create table if not exists public.sti_diagnostics (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  page       text not null,
  genre      text not null default 'js',
  message    text not null,
  detail     text,
  agent      text,
  resolution text,
  en_ligne   boolean,
  vu         boolean not null default false,
  cree_le    timestamptz not null default now()
);

create index if not exists sti_diagnostics_cree_le_idx on public.sti_diagnostics (cree_le desc);
create index if not exists sti_diagnostics_vu_idx on public.sti_diagnostics (vu);

alter table public.sti_diagnostics enable row level security;

-- Un élève connecté peut insérer ses propres lignes (user_id vient de auth.uid()).
drop policy if exists "eleve signale ses erreurs" on public.sti_diagnostics;
create policy "eleve signale ses erreurs" on public.sti_diagnostics
  for insert to authenticated with check ( user_id = auth.uid() );

-- Le professeur lit tout et peut marquer « vu » ; personne d'autre.
drop policy if exists "admin lit les erreurs" on public.sti_diagnostics;
create policy "admin lit les erreurs" on public.sti_diagnostics
  for select to authenticated using ( (auth.jwt() ->> 'email') = 'aymenessouyah@gmail.com' );

drop policy if exists "admin marque les erreurs" on public.sti_diagnostics;
create policy "admin marque les erreurs" on public.sti_diagnostics
  for update to authenticated
  using ( (auth.jwt() ->> 'email') = 'aymenessouyah@gmail.com' )
  with check ( (auth.jwt() ->> 'email') = 'aymenessouyah@gmail.com' );

-- Pas de policy delete : le journal se conserve ; pour vider à la main :
-- delete from public.sti_diagnostics where vu = true and cree_le < now() - interval '60 days';
