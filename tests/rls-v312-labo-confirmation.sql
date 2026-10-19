-- Test v312 sans effet persistant : colonnes et RPC de confirmation Labo 3.
begin;

do $$
declare
  v_list regprocedure := to_regprocedure('public.admin_labo_devices_list()');
  v_action regprocedure := to_regprocedure('public.admin_labo_device_action(text,uuid,text)');
  v_def text;
begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='labo_devices' and column_name='confirmed_at') then
    raise exception 'ECHEC v312 : colonne confirmed_at absente';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='labo_devices' and column_name='confirmed_by') then
    raise exception 'ECHEC v312 : colonne confirmed_by absente';
  end if;
  if v_list is null or v_action is null then raise exception 'ECHEC v312 : RPC absente'; end if;
  v_def := lower(pg_get_functiondef(v_list));
  if position('confirmed_at is not null' in v_def) = 0 then raise exception 'ECHEC v312 : état confirmed absent de la liste'; end if;
  v_def := lower(pg_get_functiondef(v_action));
  if position("v_action = 'confirm'" in v_def) = 0 then raise exception 'ECHEC v312 : action confirm absente'; end if;
  if position('est_admin_mfa' in v_def) = 0 then raise exception 'ECHEC v312 : protection AAL2 absente'; end if;
  if has_function_privilege('anon', v_action, 'EXECUTE') then raise exception 'ECHEC v312 : anon ne doit pas confirmer'; end if;
  raise notice 'SUCCES v312 : confirmation Labo 3 disponible, visible et protégée par MFA.';
end $$;

rollback;
