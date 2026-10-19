-- Test v314 sans effet persistant : installation complète Labo 3 et confirmation.
begin;

do $$
declare
  v_open regprocedure := to_regprocedure('public.labo_device_open_session(uuid,text,jsonb)');
  v_list regprocedure := to_regprocedure('public.admin_labo_devices_list()');
  v_action regprocedure := to_regprocedure('public.admin_labo_device_action(text,uuid,text)');
begin
  if to_regclass('public.labo_devices') is null then raise exception 'ECHEC v314 : table labo_devices absente'; end if;
  if to_regclass('public.labo_device_sessions') is null then raise exception 'ECHEC v314 : table labo_device_sessions absente'; end if;
  if to_regclass('public.labo_device_messages') is null then raise exception 'ECHEC v314 : table labo_device_messages absente'; end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='labo_devices' and column_name='confirmed_at') then raise exception 'ECHEC v314 : confirmed_at absente'; end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='labo_devices' and column_name='confirmed_by') then raise exception 'ECHEC v314 : confirmed_by absente'; end if;
  if v_open is null or v_list is null or v_action is null then raise exception 'ECHEC v314 : RPC Labo 3 absente'; end if;
  if position("v_action = 'confirm'" in lower(pg_get_functiondef(v_action))) = 0 then raise exception 'ECHEC v314 : action confirm absente'; end if;
  if has_function_privilege('anon', v_action, 'EXECUTE') then raise exception 'ECHEC v314 : anon ne doit pas confirmer'; end if;
  raise notice 'SUCCES v314 : installation complète Labo 3 et confirmation disponibles.';
end $$;

rollback;
