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
