-- STI v303 — test transactionnel du contrôle des machines elevelabo3
-- À exécuter APRÈS 20261018_labo_device_control.sql. Aucun enregistrement n’est conservé.

begin;

create or replace function pg_temp.sti_assert(ok boolean, libelle text) returns void
language plpgsql as $$
begin
  if not coalesce(ok, false) then raise exception 'ECHEC v303 : %', libelle; end if;
end $$;

do $$
declare
  v_uid uuid;
  v_device uuid := gen_random_uuid();
  v_session uuid := gen_random_uuid();
  v_result jsonb;
begin
  select id into v_uid from auth.users where lower(email)='elevelabo3@exemple.tn' limit 1;
  if v_uid is null then raise exception 'ECHEC v303 : compte elevelabo3@exemple.tn introuvable'; end if;

  perform pg_temp.sti_assert(to_regclass('public.labo_devices') is not null, 'table labo_devices absente');
  perform pg_temp.sti_assert(to_regclass('public.labo_device_sessions') is not null, 'table labo_device_sessions absente');
  perform pg_temp.sti_assert(to_regclass('public.labo_device_messages') is not null, 'table labo_device_messages absente');
  perform pg_temp.sti_assert(
    exists(select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_labo_device_gate' and permissive='RESTRICTIVE'),
    'politique restrictive profiles absente'
  );
  perform pg_temp.sti_assert(
    exists(select 1 from pg_policies where schemaname='public' and tablename='acces' and policyname='acces_labo_device_gate' and permissive='RESTRICTIVE'),
    'politique restrictive acces absente'
  );

  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub',v_uid,'email','elevelabo3@exemple.tn','role','authenticated','aal','aal1','session_id',v_session
  )::text, true);
  perform pg_temp.sti_assert(public.est_compte_labo3_restreint(), 'compte spécial non reconnu');
  perform pg_temp.sti_assert(not public.labo_device_access_allowed(), 'session inconnue autorisée à tort');

  v_result := public.labo_device_open_session(v_device, repeat('S', 48), '{"os":"Test","browser":"SQL","label":"Poste test v303"}'::jsonb);
  perform pg_temp.sti_assert(coalesce((v_result->>'ok')::boolean,false), 'nouveau poste non accepté automatiquement');
  perform pg_temp.sti_assert(public.labo_device_access_allowed(), 'session du poste autorisé refusée');

  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub','00000000-0000-4000-8000-000000000001','email','aymenessouyah@gmail.com','role','authenticated','aal','aal2','session_id',gen_random_uuid()
  )::text, true);
  v_result := public.admin_labo_device_action('block', v_device, null);
  perform pg_temp.sti_assert(coalesce((v_result->>'ok')::boolean,false), 'blocage AAL2 refusé');

  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub',v_uid,'email','elevelabo3@exemple.tn','role','authenticated','aal','aal1','session_id',v_session
  )::text, true);
  perform pg_temp.sti_assert(not public.labo_device_access_allowed(), 'poste bloqué encore autorisé');

  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub','00000000-0000-4000-8000-000000000001','email','aymenessouyah@gmail.com','role','authenticated','aal','aal1','session_id',gen_random_uuid()
  )::text, true);
  begin
    perform public.admin_labo_device_action('allow', v_device, null);
    raise exception 'ECHEC v303 : action sensible acceptée à AAL1';
  exception when others then
    if sqlerrm like 'ECHEC v303%' then raise; end if;
  end;
end $$;

select 'OK — contrôle machines v303, RLS, blocage et AAL2 validés' as resultat;
rollback;
