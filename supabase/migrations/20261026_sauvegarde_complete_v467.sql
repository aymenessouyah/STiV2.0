-- STI v467 : Sauvegarde complète 15 tables — RPC d'export sécurisé des tables annexes (sans secrets cryptographiques)
-- Fonction RPC réservée exclusivement à l'administrateur (public.est_admin()).

CREATE OR REPLACE FUNCTION public.admin_sauvegarde_tables_annexes()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_labo_devices jsonb := '[]'::jsonb;
  v_labo_sessions jsonb := '[]'::jsonb;
  v_badges_labo jsonb := '[]'::jsonb;
  v_push_subs jsonb := '[]'::jsonb;
BEGIN
  IF NOT public.est_admin() THEN
    RAISE EXCEPTION 'administrateur requis';
  END IF;

  SELECT COALESCE(
    jsonb_agg(to_jsonb(d) - 'secret_hash' ORDER BY d.id ASC),
    '[]'::jsonb
  ) INTO v_labo_devices
  FROM public.labo_devices d;

  SELECT COALESCE(
    jsonb_agg(to_jsonb(s) ORDER BY s.session_id ASC),
    '[]'::jsonb
  ) INTO v_labo_sessions
  FROM public.labo_device_sessions s;

  SELECT COALESCE(
    jsonb_agg(to_jsonb(b) ORDER BY b.code_hash ASC),
    '[]'::jsonb
  ) INTO v_badges_labo
  FROM public.badges_labo b;

  SELECT COALESCE(
    jsonb_agg((to_jsonb(p) - 'p256dh') - 'auth' ORDER BY p.id ASC),
    '[]'::jsonb
  ) INTO v_push_subs
  FROM public.push_subscriptions p;

  RETURN jsonb_build_object(
    'labo_devices', v_labo_devices,
    'labo_device_sessions', v_labo_sessions,
    'badges_labo', v_badges_labo,
    'push_subscriptions', v_push_subs
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_sauvegarde_tables_annexes() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_sauvegarde_tables_annexes() TO authenticated;
