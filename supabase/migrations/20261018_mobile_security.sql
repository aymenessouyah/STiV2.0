-- STI V2.0 — migration additive v302
-- À exécuter une seule fois dans l’éditeur SQL Supabase.
-- Aucun mot de passe, OTP, JWT ou secret n’est stocké dans ces tables.

create extension if not exists pgcrypto;

-- Niveau renforcé : identité administrateur + jeton Supabase validé par TOTP (AAL2)
create or replace function public.est_admin_mfa() returns boolean
language sql stable security definer set search_path = public as $$
  select public.est_admin()
     and coalesce(auth.jwt() ->> 'aal', '') = 'aal2';
$$;

-- Les consultations globales restent possibles pour l’admin authentifié à AAL1.
-- Toute modification de profil et toute suppression d’activité exigent AAL2.
drop policy if exists prof_upd_admin on public.profiles;
create policy prof_upd_admin on public.profiles for update to authenticated
  using (public.est_admin_mfa()) with check (public.est_admin_mfa());

drop policy if exists acces_del_admin on public.acces;
create policy acces_del_admin on public.acces for delete to authenticated
  using (public.est_admin_mfa());

drop policy if exists acces_upd_self on public.acces;
create policy acces_upd_self on public.acces for update to authenticated
  using (user_id = auth.uid() or public.est_admin_mfa())
  with check (user_id = auth.uid() or public.est_admin_mfa());

drop policy if exists acces_ins_self on public.acces;
create policy acces_ins_self on public.acces for insert to authenticated
  with check (
    user_id = auth.uid()
    and (
      coalesce(page, '') !~ '^(CFG_ECOLES|SEC_CONFIG|FLASH_Q:|CTRL_|SUPPR_ACCES|COPIE_NOTE:|ADMIN_)'
      or public.est_admin_mfa()
    )
  );

-- Réécriture additive des deux RPC les plus sensibles avec contrôle AAL2 côté base.
create or replace function public.admin_set_password(uid uuid, newpass text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.est_admin_mfa() then
    raise exception 'validation MFA AAL2 requise';
  end if;
  perform auth.admin_update_user(uid, jsonb_build_object('password', newpass));
end $$;

create or replace function public.admin_supprimer_abonne(uid uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.est_admin_mfa() then
    raise exception 'validation MFA AAL2 requise';
  end if;
  if uid = (select id from auth.users where email = 'aymenessouyah@gmail.com') then
    raise exception 'impossible de supprimer l''administrateur';
  end if;
  delete from public.acces where user_id = uid;
  delete from public.profiles where id = uid;
  begin
    perform auth.admin_delete_user(uid);
  exception when undefined_function then
    delete from auth.users where id = uid;
  end;
end $$;


-- 1) Curseur différentiel réel pour les profils
alter table public.profiles
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.sti_set_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.sti_set_updated_at();

create index if not exists idx_profiles_updated_at
  on public.profiles(updated_at, id);

alter table public.profiles replica identity full;
do $$ begin
  alter publication supabase_realtime add table public.profiles;
exception when duplicate_object then null;
end $$;

-- 2) Reprise hors ligne idempotente : un événement client ne peut être inséré qu’une fois
alter table public.acces
  add column if not exists client_event_id text;

create unique index if not exists uq_acces_user_client_event
  on public.acces(user_id, client_event_id);
create index if not exists idx_acces_user_id_desc
  on public.acces(user_id, id desc);
create index if not exists idx_acces_debut_desc
  on public.acces(debut desc);

alter table public.acces replica identity full;
do $$ begin
  alter publication supabase_realtime add table public.acces;
exception when duplicate_object then null;
end $$;

-- 3) Configuration publique, sans codes Badge ni données personnelles
create table if not exists public.app_config_public (
  id text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.app_config_public enable row level security;

drop policy if exists app_config_public_read on public.app_config_public;
create policy app_config_public_read on public.app_config_public
for select to anon, authenticated using (true);

drop policy if exists app_config_public_admin_write on public.app_config_public;
create policy app_config_public_admin_write on public.app_config_public
for all to authenticated
using (public.est_admin_mfa()) with check (public.est_admin_mfa());

-- 4) Codes Badge : jamais exposés par SELECT ; validation uniquement par RPC
create table if not exists public.badges_labo (
  code_hash text primary key,
  profil_public jsonb not null,
  actif boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.badges_labo enable row level security;

drop policy if exists badges_labo_admin_all on public.badges_labo;
create policy badges_labo_admin_all on public.badges_labo
for all to authenticated
using (public.est_admin_mfa()) with check (public.est_admin_mfa());

create or replace function public.admin_sync_badges(entrees jsonb) returns integer
language plpgsql security definer set search_path = public as $$
declare
  e jsonb;
  n integer := 0;
begin
  if not public.est_admin_mfa() then
    raise exception 'validation MFA AAL2 requise';
  end if;
  delete from public.badges_labo;
  for e in select * from jsonb_array_elements(coalesce(entrees, '[]'::jsonb)) loop
    if coalesce(e->>'code', '') ~ '^[A-Z0-9]{5,12}$' then
      insert into public.badges_labo(code_hash, profil_public, actif, updated_at)
      values (
        encode(digest(upper(e->>'code'), 'sha256'), 'hex'),
        jsonb_strip_nulls(jsonb_build_object(
          'id', e->'profil'->>'id',
          'nom', e->'profil'->>'nom',
          'prenom', e->'profil'->>'prenom',
          'classe', e->'profil'->>'classe',
          'lycee', e->'profil'->>'lycee',
          'gold', coalesce((e->'profil'->>'gold')::boolean, false)
        )),
        true,
        now()
      )
      on conflict (code_hash) do update
        set profil_public = excluded.profil_public, actif = true, updated_at = now();
      n := n + 1;
    end if;
  end loop;
  return n;
end $$;
revoke execute on function public.admin_sync_badges(jsonb) from public, anon;
grant execute on function public.admin_sync_badges(jsonb) to authenticated;

create or replace function public.valider_badge_labo(code_saisi text) returns jsonb
language sql stable security definer set search_path = public as $$
  select profil_public
  from public.badges_labo
  where actif = true
    and code_hash = encode(digest(upper(trim(coalesce(code_saisi, ''))), 'sha256'), 'hex')
  limit 1;
$$;
revoke execute on function public.valider_badge_labo(text) from public;
grant execute on function public.valider_badge_labo(text) to anon, authenticated;

-- 5) Abonnements Push optionnels. Les clés VAPID restent uniquement dans les secrets Edge Function.
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;

drop policy if exists push_self_manage on public.push_subscriptions;
create policy push_self_manage on public.push_subscriptions
for all to authenticated
using (user_id = auth.uid() or public.est_admin_mfa())
with check (user_id = auth.uid() or public.est_admin_mfa());

-- Vérifications rapides après migration
-- select column_name from information_schema.columns where table_schema='public' and table_name='profiles';
-- select indexname from pg_indexes where schemaname='public' and tablename in ('profiles','acces');
