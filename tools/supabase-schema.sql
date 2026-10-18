-- ═══════════════════════════════════════════════════════════════
-- STI V2.0 — Base complète, remise à zéro propre
-- Un seul script qui annule tout le passé et reconstruit tout :
--   e-mail OU téléphone, nom/prénom, lycée/classe, RLS, fonctions admin
-- ═══════════════════════════════════════════════════════════════

-- 0) Nettoyage complet du passé
drop trigger if exists trg_nouveau_profil on auth.users;
drop function if exists public.nouveau_profil() cascade;
drop function if exists public.admin_set_password(uuid, text) cascade;
drop function if exists public.admin_supprimer_abonne(uuid) cascade;
drop function if exists public.est_admin() cascade;
drop table if exists public.acces;
drop table if exists public.profiles;
drop type if exists public.statut_abonne;

-- 1) Qui est admin ? (détection par e-mail, côté base, infalsifiable)
create function public.est_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((auth.jwt() ->> 'email') = 'aymenessouyah@gmail.com', false);
$$;

-- 2) Tables
create type public.statut_abonne as enum ('en_attente','actif','suspendu','exclu');

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text unique,
  phone text unique,
  nom text,
  prenom text,
  lycee text,
  classe text,
  statut public.statut_abonne not null default 'en_attente',
  cree_le timestamptz not null default now(),
  constraint au_moins_un_contact check (email is not null or phone is not null)
);

create table public.acces (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users on delete cascade,
  debut timestamptz not null default now(),
  fin timestamptz,
  duree_sec integer,
  lieu text,
  page text
);

-- 3) Chaque inscription (e-mail OU téléphone) crée automatiquement son profil
--    Sécurité : interdiction d'injecter '|GOLD' ou la classe 'elevelabo3' à l'inscription
create function public.nouveau_profil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, phone, nom, prenom, lycee, classe)
  values (
    new.id,
    new.email,
    nullif(new.phone, ''),
    new.raw_user_meta_data->>'nom',
    new.raw_user_meta_data->>'prenom',
    regexp_replace(coalesce(new.raw_user_meta_data->>'lycee', ''), '\s*\|\s*GOLD', '', 'gi'),
    regexp_replace(coalesce(new.raw_user_meta_data->>'classe', ''), 'eleve\s*labo\s*3', '3SI1', 'gi')
  )
  on conflict (id) do update
    set email = excluded.email, phone = excluded.phone;
  return new;
end $$;

create trigger trg_nouveau_profil after insert on auth.users
for each row execute function public.nouveau_profil();

-- Trigger anti-auto-promotion : seul l'administrateur peut modifier statut, classe ou lycee (|GOLD)
drop trigger if exists trg_verrou_profil_securite on public.profiles;
drop function if exists public.verrou_profil_securite() cascade;
create function public.verrou_profil_securite() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if current_user not in ('postgres', 'supabase_admin', 'supabase_auth_admin') and not public.est_admin() then
    new.statut := old.statut;
    new.classe := old.classe;
    new.lycee  := old.lycee;
  end if;
  return new;
end $$;
create trigger trg_verrou_profil_securite before update on public.profiles
for each row execute function public.verrou_profil_securite();

-- 4) Récupération des comptes existants (auth.users déjà créés)
insert into public.profiles (id, email, phone, nom, prenom, lycee, classe, statut)
select u.id,
       u.email,
       nullif(u.phone, ''),
       u.raw_user_meta_data->>'nom',
       u.raw_user_meta_data->>'prenom',
       u.raw_user_meta_data->>'lycee',
       u.raw_user_meta_data->>'classe',
       case when u.email = 'aymenessouyah@gmail.com'
            then 'actif'::public.statut_abonne
            else 'en_attente'::public.statut_abonne end
from auth.users u
on conflict (id) do nothing;

-- 5) Sécurité (RLS) : chacun voit son profil ; l'admin voit et modifie tout
alter table public.profiles enable row level security;
alter table public.acces enable row level security;

create policy prof_sel on public.profiles for select to authenticated
  using (id = auth.uid() or public.est_admin());

create policy prof_upd_admin on public.profiles for update to authenticated
  using (public.est_admin()) with check (public.est_admin());

create policy acces_ins_self on public.acces for insert to authenticated
  with check (
    user_id = auth.uid()
    and (
      public.est_admin()
      or coalesce(page, '') !~ '^(CFG_ECOLES|SEC_CONFIG|FLASH_Q:|CTRL_|SUPPR_ACCES)'
    )
  );

create policy acces_sel on public.acces for select to authenticated
  using (user_id = auth.uid() or public.est_admin());

create policy acces_upd_self on public.acces for update to authenticated
  using (user_id = auth.uid() or public.est_admin());

create policy acces_del_admin on public.acces for delete to authenticated
  using (public.est_admin());

-- 6) Nouveau mot de passe défini par l'admin (l'ancien reste invisible)
create function public.admin_set_password(uid uuid, newpass text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.est_admin() then
    raise exception 'action reservee a l''administrateur';
  end if;
  perform auth.admin_update_user(uid, jsonb_build_object('password', newpass));
end $$;
revoke execute on function public.admin_set_password(uuid, text) from public, anon;
grant execute on function public.admin_set_password(uuid, text) to authenticated;

-- 7) Suppression définitive d'un abonné (bouton 🗑️ — robuste : 2 méthodes)
create function public.admin_supprimer_abonne(uid uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.est_admin() then
    raise exception 'action reservee a l''administrateur';
  end if;
  if uid = (select id from auth.users where email = 'aymenessouyah@gmail.com') then
    raise exception 'impossible de supprimer l''administrateur';
  end if;
  delete from public.acces where user_id = uid;
  delete from public.profiles where id = uid;
  begin
    perform auth.admin_delete_user(uid);          -- méthode récente si disponible
  exception when undefined_function then
    delete from auth.users where id = uid;        -- sinon suppression directe (cascade)
  end;
end $$;
revoke execute on function public.admin_supprimer_abonne(uuid) from public, anon;
grant execute on function public.admin_supprimer_abonne(uuid) to authenticated;

-- 8) Taille utilisée dans Supabase (pour afficher le % et la quantité restante sur 500 Mo)
drop function if exists public.admin_taille_base() cascade;
create function public.admin_taille_base() returns bigint
language plpgsql security definer set search_path = public as $$
begin
  if not public.est_admin() then
    raise exception 'action reservee a l''administrateur';
  end if;
  return (
    coalesce(pg_total_relation_size('public.profiles'), 0) +
    coalesce(pg_total_relation_size('public.acces'), 0) +
    coalesce(pg_total_relation_size('auth.users'), 0)
  );
end $$;
revoke execute on function public.admin_taille_base() from public, anon;
grant execute on function public.admin_taille_base() to authenticated;


-- ═══ Extensions additives v302 (delta profils, idempotence, configuration privée) ═══
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
        encode(sha256(convert_to(upper(e->>'code'), 'UTF8')), 'hex'),
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
    and code_hash = encode(sha256(convert_to(upper(trim(coalesce(code_saisi, ''))), 'UTF8')), 'hex')
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


-- ═══ Extensions additives v303 (contrôle des machines elevelabo3) ═══
-- STI V2.0 v303 — contrôle par machine du compte partagé elevelabo3
-- À appliquer APRÈS 20261018_mobile_security.sql.
-- Les nouvelles machines sont autorisées automatiquement, selon le choix administrateur.
-- L’administrateur peut ensuite bloquer, réautoriser ou supprimer chaque machine.
-- Aucun secret de machine n’est stocké en clair dans PostgreSQL.

create table if not exists public.labo_devices (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  secret_hash text not null,
  nom_poste text not null default 'Poste Labo 3',
  statut text not null default 'allowed' check (statut in ('allowed', 'blocked')),
  device_info jsonb not null default '{}'::jsonb,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  blocked_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, id)
);

create table if not exists public.labo_device_sessions (
  session_id uuid primary key,
  device_id uuid not null references public.labo_devices(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  opened_at timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  expires_at timestamptz not null
);

create table if not exists public.labo_device_messages (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.labo_devices(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists idx_labo_devices_user_last_seen
  on public.labo_devices(user_id, last_seen desc);
create index if not exists idx_labo_device_sessions_expiry
  on public.labo_device_sessions(user_id, expires_at);
create index if not exists idx_labo_device_messages_device_created
  on public.labo_device_messages(device_id, created_at desc);

alter table public.labo_devices enable row level security;
alter table public.labo_device_sessions enable row level security;
alter table public.labo_device_messages enable row level security;

-- Le compte spécial est identifié uniquement par le JWT Supabase signé.
create or replace function public.est_compte_labo3_restreint() returns boolean
language sql stable security definer set search_path = public as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = 'elevelabo3@exemple.tn';
$$;

-- Autorisation évaluée côté base à chaque requête profiles/acces.
-- Une valeur placée dans localStorage ou un identifiant de poste copié ne suffit pas.
create or replace function public.labo_device_access_allowed() returns boolean
language sql stable security definer set search_path = public as $$
  select case
    when not public.est_compte_labo3_restreint() then true
    else exists (
      select 1
      from public.labo_device_sessions s
      join public.labo_devices d on d.id = s.device_id
      where s.session_id = nullif(auth.jwt() ->> 'session_id', '')::uuid
        and s.user_id = auth.uid()
        and d.user_id = auth.uid()
        and d.statut = 'allowed'
        and s.expires_at > now()
    )
  end;
$$;

create or replace function public.labo_current_device_id() returns uuid
language sql stable security definer set search_path = public as $$
  select s.device_id
  from public.labo_device_sessions s
  join public.labo_devices d on d.id = s.device_id
  where s.session_id = nullif(auth.jwt() ->> 'session_id', '')::uuid
    and s.user_id = auth.uid()
    and d.user_id = auth.uid()
    and d.statut = 'allowed'
    and s.expires_at > now()
  limit 1;
$$;

revoke execute on function public.est_compte_labo3_restreint() from public, anon;
revoke execute on function public.labo_device_access_allowed() from public, anon;
revoke execute on function public.labo_current_device_id() from public, anon;
grant execute on function public.est_compte_labo3_restreint() to authenticated;
grant execute on function public.labo_device_access_allowed() to authenticated;
grant execute on function public.labo_current_device_id() to authenticated;

-- Politiques restrictives : elles s’ajoutent aux politiques existantes sans élargir leurs droits.
drop policy if exists profiles_labo_device_gate on public.profiles;
create policy profiles_labo_device_gate on public.profiles
as restrictive for all to authenticated
using (public.labo_device_access_allowed())
with check (public.labo_device_access_allowed());

drop policy if exists acces_labo_device_gate on public.acces;
create policy acces_labo_device_gate on public.acces
as restrictive for all to authenticated
using (public.labo_device_access_allowed())
with check (public.labo_device_access_allowed());

-- Ouverture/renouvellement d’une session machine.
-- Le secret aléatoire arrive par HTTPS et seul son SHA-256 est conservé.
create or replace function public.labo_device_open_session(
  p_device_id uuid,
  p_device_secret text,
  p_device_info jsonb default '{}'::jsonb
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_session uuid;
  v_hash text;
  v_device public.labo_devices%rowtype;
  v_nom text;
begin
  if v_uid is null or not public.est_compte_labo3_restreint() then
    raise exception 'compte labo authentifié requis';
  end if;
  if p_device_id is null or char_length(coalesce(p_device_secret, '')) < 32
     or char_length(p_device_secret) > 180 then
    raise exception 'identité machine invalide';
  end if;
  if pg_column_size(coalesce(p_device_info, '{}'::jsonb)) > 4096 then
    raise exception 'description machine trop volumineuse';
  end if;

  v_session := nullif(auth.jwt() ->> 'session_id', '')::uuid;
  if v_session is null then raise exception 'session Supabase invalide'; end if;
  v_hash := encode(sha256(convert_to(p_device_secret, 'UTF8')), 'hex');
  v_nom := left(coalesce(nullif(trim(p_device_info ->> 'label'), ''), 'Poste Labo 3'), 80);

  insert into public.labo_devices(id, user_id, secret_hash, nom_poste, statut, device_info)
  values (p_device_id, v_uid, v_hash, v_nom, 'allowed', coalesce(p_device_info, '{}'::jsonb))
  on conflict (id) do nothing;

  select * into v_device from public.labo_devices where id = p_device_id;
  if not found or v_device.user_id <> v_uid or v_device.secret_hash <> v_hash then
    return jsonb_build_object('ok', false, 'code', 'identity_mismatch');
  end if;
  if v_device.statut <> 'allowed' then
    delete from public.labo_device_sessions where session_id = v_session;
    return jsonb_build_object('ok', false, 'code', 'blocked', 'device_id', p_device_id);
  end if;

  insert into public.labo_device_sessions(session_id, device_id, user_id, opened_at, last_seen, expires_at)
  values (v_session, p_device_id, v_uid, now(), now(), now() + interval '3 minutes')
  on conflict (session_id) do update
    set device_id = excluded.device_id,
        user_id = excluded.user_id,
        last_seen = now(),
        expires_at = now() + interval '3 minutes';

  update public.labo_devices
    set last_seen = now(),
        device_info = coalesce(p_device_info, device_info),
        updated_at = now()
    where id = p_device_id;

  return jsonb_build_object(
    'ok', true,
    'code', 'allowed',
    'device_id', p_device_id,
    'name', v_device.nom_poste,
    'expires_at', now() + interval '3 minutes',
    'new_device', v_device.first_seen > now() - interval '20 seconds'
  );
end $$;
revoke execute on function public.labo_device_open_session(uuid, text, jsonb) from public, anon;
grant execute on function public.labo_device_open_session(uuid, text, jsonb) to authenticated;

create or replace function public.labo_device_close_session() returns void
language sql security definer set search_path = public as $$
  delete from public.labo_device_sessions
  where session_id = nullif(auth.jwt() ->> 'session_id', '')::uuid
    and user_id = auth.uid();
$$;
revoke execute on function public.labo_device_close_session() from public, anon;
grant execute on function public.labo_device_close_session() to authenticated;

-- Lecture et accusé de réception des messages du poste associé à la session courante.
drop policy if exists labo_messages_current_device on public.labo_device_messages;
create policy labo_messages_current_device on public.labo_device_messages
for select to authenticated
using (
  public.est_admin()
  or labo_device_messages.device_id = public.labo_current_device_id()
);

grant select on public.labo_device_messages to authenticated;

create or replace function public.labo_device_mark_message(p_message_id uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare v_count integer := 0;
begin
  update public.labo_device_messages m
    set read_at = coalesce(m.read_at, now())
  where m.id = p_message_id
    and m.device_id = public.labo_current_device_id();
  get diagnostics v_count = row_count;
  return v_count > 0;
end $$;
revoke execute on function public.labo_device_mark_message(uuid) from public, anon;
grant execute on function public.labo_device_mark_message(uuid) to authenticated;

-- Liste privée pour la mini-section du tableau administrateur existant.
create or replace function public.admin_labo_devices_list() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_result jsonb;
begin
  if not public.est_admin() then raise exception 'administrateur requis'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', d.id,
    'name', d.nom_poste,
    'status', d.statut,
    'info', d.device_info,
    'first_seen', d.first_seen,
    'last_seen', d.last_seen,
    'blocked_at', d.blocked_at,
    'online', exists(select 1 from public.labo_device_sessions s where s.device_id=d.id and s.expires_at>now()),
    'unread', (select count(*) from public.labo_device_messages m where m.device_id=d.id and m.read_at is null),
    'last_message_at', (select max(m.created_at) from public.labo_device_messages m where m.device_id=d.id)
  ) order by d.last_seen desc), '[]'::jsonb)
  into v_result
  from public.labo_devices d
  join auth.users u on u.id = d.user_id
  where lower(coalesce(u.email, '')) = 'elevelabo3@exemple.tn';
  return v_result;
end $$;
revoke execute on function public.admin_labo_devices_list() from public, anon;
grant execute on function public.admin_labo_devices_list() to authenticated;

-- Actions AAL2 : autoriser, bloquer, supprimer, renommer ou envoyer un message ciblé.
create or replace function public.admin_labo_device_action(
  p_action text,
  p_device_id uuid,
  p_value text default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_action text := lower(trim(coalesce(p_action, '')));
begin
  if not public.est_admin_mfa() then raise exception 'validation MFA AAL2 requise'; end if;
  if not exists(select 1 from public.labo_devices where id=p_device_id) then
    raise exception 'poste introuvable';
  end if;

  if v_action = 'allow' then
    update public.labo_devices set statut='allowed', blocked_at=null, updated_at=now() where id=p_device_id;
  elsif v_action = 'block' then
    update public.labo_devices set statut='blocked', blocked_at=now(), updated_at=now() where id=p_device_id;
    delete from public.labo_device_sessions where device_id=p_device_id;
  elsif v_action = 'delete' then
    delete from public.labo_devices where id=p_device_id;
  elsif v_action = 'rename' then
    if char_length(trim(coalesce(p_value,''))) not between 1 and 80 then raise exception 'nom de poste invalide'; end if;
    update public.labo_devices set nom_poste=trim(p_value), updated_at=now() where id=p_device_id;
  elsif v_action = 'message' then
    if char_length(trim(coalesce(p_value,''))) not between 1 and 500 then raise exception 'message invalide'; end if;
    insert into public.labo_device_messages(device_id, body, created_by)
    values (p_device_id, trim(p_value), auth.uid());
  else
    raise exception 'action inconnue';
  end if;

  return jsonb_build_object('ok', true, 'action', v_action, 'device_id', p_device_id);
end $$;
revoke execute on function public.admin_labo_device_action(text, uuid, text) from public, anon;
grant execute on function public.admin_labo_device_action(text, uuid, text) to authenticated;

-- Realtime accélère les nouveaux messages; le client conserve aussi un contrôle périodique.
alter table public.labo_device_messages replica identity full;
do $$ begin
  alter publication supabase_realtime add table public.labo_device_messages;
exception when duplicate_object then null;
end $$;

-- Nettoyage léger des sessions expirées lors de chaque nouvelle ouverture.
create or replace function public.labo_cleanup_expired_device_sessions() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from public.labo_device_sessions where expires_at < now() - interval '10 minutes';
  return new;
end $$;
drop trigger if exists trg_labo_cleanup_sessions on public.labo_device_sessions;
create trigger trg_labo_cleanup_sessions
after insert or update on public.labo_device_sessions
for each statement execute function public.labo_cleanup_expired_device_sessions();

-- v306 : suppression d’un message ciblé depuis l’historique administrateur, protégée par AAL2.
create or replace function public.admin_labo_device_message_delete(
  p_message_id uuid
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_device_id uuid;
begin
  if not public.est_admin_mfa() then raise exception 'validation MFA AAL2 requise'; end if;
  delete from public.labo_device_messages
  where id = p_message_id
  returning device_id into v_device_id;
  if v_device_id is null then raise exception 'message introuvable'; end if;
  return jsonb_build_object('ok', true, 'message_id', p_message_id, 'device_id', v_device_id);
end $$;
revoke execute on function public.admin_labo_device_message_delete(uuid) from public, anon;
grant execute on function public.admin_labo_device_message_delete(uuid) to authenticated;
