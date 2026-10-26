-- STI v466 : DBSupbase — Niveau exact de chaque table public par rapport au plafond PostgREST de 1 000 lignes
-- Fonction RPC réservée exclusivement à l'administrateur (public.est_admin()).

CREATE OR REPLACE FUNCTION public.admin_dbsupbase_niveaux()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  r record;
  v_rows bigint;
  v_tables jsonb := '[]'::jsonb;
  v_public_bytes bigint := 0;
BEGIN
  IF NOT public.est_admin() THEN
    RAISE EXCEPTION 'administrateur requis';
  END IF;

  FOR r IN
    SELECT c.oid, c.relname, pg_total_relation_size(c.oid)::bigint AS octets
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
    ORDER BY c.relname
  LOOP
    EXECUTE format('SELECT count(*)::bigint FROM public.%I', r.relname) INTO v_rows;
    v_public_bytes := v_public_bytes + COALESCE(r.octets, 0);
    v_tables := v_tables || jsonb_build_array(
      jsonb_build_object(
        'nom', r.relname,
        'lignes', COALESCE(v_rows, 0),
        'octets', COALESCE(r.octets, 0)
      )
    );
  END LOOP;

  RETURN jsonb_build_object(
    'seuil_lignes', 1000,
    'mesure_at', now(),
    'public_bytes', v_public_bytes,
    'db_bytes', pg_database_size(current_database())::bigint,
    'tables', v_tables
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_dbsupbase_niveaux() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_dbsupbase_niveaux() TO authenticated;
