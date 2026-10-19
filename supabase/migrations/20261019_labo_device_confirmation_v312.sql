-- STI V2.0 v312 corrigée — INSTALLATION COMPLÈTE Labo 3 + confirmation des postes
-- Fichier autonome à coller intégralement dans Supabase SQL Editor.
-- Corrige l'erreur 42P01 lorsque public.labo_devices n'existe pas encore.
--
-- Ordre intégré :
--   1. création des tables, sessions, messages, RPC et politiques Labo 3 (v303) ;
--   2. suppression sécurisée des messages administrateur (v306) ;
--   3. indicateur Confirmé / Non confirmé et action Confirmer (v312).
--
-- Idempotent : ce fichier peut aussi être exécuté sur une installation Labo 3 existante.
-- La confirmation reste un indicateur et ne bloque pas l'accès au poste.

begin;

-- ================================================================
-- ÉTAPE 1 — Socle complet Labo 3
-- ================================================================
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

-- ================================================================
-- ÉTAPE 2 — Administration des messages
-- ================================================================
-- STI V2.0 v306 — suppression AAL2 d’un message ciblé depuis l’historique administrateur
-- À exécuter après 20261018_labo_device_control.sql.
-- Aucun droit direct DELETE n’est accordé sur la table : l’opération passe uniquement par cette RPC protégée.

create or replace function public.admin_labo_device_message_delete(
  p_message_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_device_id uuid;
begin
  if not public.est_admin_mfa() then
    raise exception 'validation MFA AAL2 requise';
  end if;

  delete from public.labo_device_messages
  where id = p_message_id
  returning device_id into v_device_id;

  if v_device_id is null then
    raise exception 'message introuvable';
  end if;

  return jsonb_build_object(
    'ok', true,
    'message_id', p_message_id,
    'device_id', v_device_id
  );
end;
$$;

revoke execute on function public.admin_labo_device_message_delete(uuid) from public, anon;
grant execute on function public.admin_labo_device_message_delete(uuid) to authenticated;

comment on function public.admin_labo_device_message_delete(uuid) is
  'Supprime un message ciblé uniquement pour un administrateur authentifié en AAL2.';

-- ================================================================
-- ÉTAPE 3 — Confirmation administrative des postes
-- ================================================================
-- STI V2.0 v312 — confirmation administrative des postes Labo 3 (indicateur seulement)
-- À exécuter après 20261018_labo_device_control.sql.
-- Les postes existants sont confirmés une seule fois lors de la première exécution.
-- Les nouveaux postes restent utilisables mais apparaissent « Non confirmés » jusqu'au clic administrateur.

do $$
declare
  v_first_install boolean;
begin
  select not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'labo_devices' and column_name = 'confirmed_at'
  ) into v_first_install;

  alter table public.labo_devices
    add column if not exists confirmed_at timestamptz,
    add column if not exists confirmed_by uuid references auth.users(id) on delete set null;

  if v_first_install then
    update public.labo_devices
      set confirmed_at = coalesce(first_seen, now())
      where confirmed_at is null;
  end if;
end $$;

comment on column public.labo_devices.confirmed_at is
  'Date de confirmation administrative ; NULL signifie non confirmé sans bloquer l’accès.';
comment on column public.labo_devices.confirmed_by is
  'Administrateur ayant confirmé le poste ; NULL pour les postes historiques migrés.';

create or replace function public.admin_labo_devices_list() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_result jsonb;
begin
  if not public.est_admin() then raise exception 'administrateur requis'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', d.id,
    'name', d.nom_poste,
    'status', d.statut,
    'confirmed', d.confirmed_at is not null,
    'confirmed_at', d.confirmed_at,
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

  if v_action = 'confirm' then
    update public.labo_devices
      set confirmed_at = coalesce(confirmed_at, now()),
          confirmed_by = coalesce(confirmed_by, auth.uid()),
          updated_at = now()
      where id = p_device_id;
  elsif v_action = 'allow' then
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

commit;
