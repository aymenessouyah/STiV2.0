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
