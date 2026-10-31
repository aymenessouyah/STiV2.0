-- =====================================================================
-- STI V2.0 — v590 : la sauvegarde quotidienne couvre enfin les 18 tables.
--
-- Constat (v589 → v590) : la fonction d'export des tables annexes, créée en
-- v467, ne rendait que 4 tables. Depuis, trois tables ont été ajoutées à la
-- base sans jamais entrer dans la sauvegarde :
--
--   1. `sti_quiz_xp_compteurs` et `sti_quiz_xp_operations` (v487) : le journal
--      et les compteurs des XP. Ces deux tables sont fermées au navigateur
--      (`revoke all … from anon, authenticated`), donc illisibles par le
--      script d'export côté client : sans cette fonction, les niveaux et les
--      gains des élèves n'étaient sauvegardés nulle part.
--   2. `acces_sauvegardes` (v582) : les copies du journal de connexions.
--      Seules les MÉTADONNÉES sont exportées (motif, mois, nombre de lignes,
--      date) : la colonne `lignes` contient des copies entières du journal et
--      ferait exploser la taille de l'archive. Les copies elles-mêmes restent
--      restaurables par la RPC dédiée `admin_reimporter_sauvegarde_acces(id)`.
--
-- Sécurité inchangée : la fonction reste réservée à l'administrateur
-- (`public.est_admin()`), en `security definer`, et ne rend aucun secret
-- (ni `secret_hash`, ni clés push, ni contenu du journal).
--
-- Idempotente : relançable sans risque.
-- =====================================================================

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
  v_xp_compteurs jsonb := '[]'::jsonb;
  v_xp_operations jsonb := '[]'::jsonb;
  v_acces_copies jsonb := '[]'::jsonb;
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

  -- v590 : compteurs XP (une ligne par élève et par compteur).
  SELECT COALESCE(
    jsonb_agg(to_jsonb(c) ORDER BY c.user_id ASC, c.cle ASC),
    '[]'::jsonb
  ) INTO v_xp_compteurs
  FROM public.sti_quiz_xp_compteurs c;

  -- v590 : journal des gains XP, base de l'idempotence entre appareils.
  SELECT COALESCE(
    jsonb_agg(to_jsonb(o) ORDER BY o.user_id ASC, o.cree_le ASC, o.operation_id ASC),
    '[]'::jsonb
  ) INTO v_xp_operations
  FROM public.sti_quiz_xp_operations o;

  -- v590 : copies du journal de connexions — métadonnées seulement.
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', a.id,
        'motif', a.motif,
        'mois', a.mois,
        'nb_lignes', a.nb_lignes,
        'cree_le', a.cree_le
      ) ORDER BY a.id ASC
    ),
    '[]'::jsonb
  ) INTO v_acces_copies
  FROM public.acces_sauvegardes a;

  RETURN jsonb_build_object(
    'labo_devices', v_labo_devices,
    'labo_device_sessions', v_labo_sessions,
    'badges_labo', v_badges_labo,
    'push_subscriptions', v_push_subs,
    'sti_quiz_xp_compteurs', v_xp_compteurs,
    'sti_quiz_xp_operations', v_xp_operations,
    'acces_sauvegardes', v_acces_copies
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_sauvegarde_tables_annexes() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_sauvegarde_tables_annexes() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_sauvegarde_tables_annexes() TO service_role;

COMMENT ON FUNCTION public.admin_sauvegarde_tables_annexes() IS
  'v590 : export JSON des 7 tables annexes (labo, badges, push, XP et copies du journal) pour la sauvegarde quotidienne. Réservé à est_admin().';
