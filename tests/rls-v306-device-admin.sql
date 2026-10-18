-- Test v306 sans effet persistant : contrôle de la RPC de suppression des messages ciblés.
begin;

do $$
declare
  v_fn regprocedure := to_regprocedure('public.admin_labo_device_message_delete(uuid)');
  v_def text;
begin
  if v_fn is null then
    raise exception 'ECHEC v306 : fonction admin_labo_device_message_delete(uuid) absente';
  end if;

  v_def := pg_get_functiondef(v_fn);
  if position('est_admin_mfa' in v_def) = 0 then
    raise exception 'ECHEC v306 : protection AAL2 absente';
  end if;
  if position('delete from public.labo_device_messages' in lower(v_def)) = 0 then
    raise exception 'ECHEC v306 : suppression ciblée absente';
  end if;
  if has_function_privilege('anon', v_fn, 'EXECUTE') then
    raise exception 'ECHEC v306 : anon ne doit pas exécuter la fonction';
  end if;
  if not has_function_privilege('authenticated', v_fn, 'EXECUTE') then
    raise exception 'ECHEC v306 : authenticated doit pouvoir appeler la fonction, puis AAL2 décide';
  end if;

  raise notice 'SUCCES v306 : RPC présente, suppression ciblée et protection AAL2 confirmées.';
end $$;

rollback;
