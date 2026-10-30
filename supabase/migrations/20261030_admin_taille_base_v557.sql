-- =====================================================================
-- STI V2.0 — Migration v557 : taille réelle de la base pour l'administrateur.
--
-- Contexte : assets/js/admin.js appelle depuis toujours
-- sb.rpc("admin_taille_base") pour afficher le quota Supabase. La fonction
-- n'existait ni en base ni dans les migrations : l'appel échouait en silence
-- et le badge du tableau de bord n'affichait qu'une ESTIMATION calculée dans
-- le navigateur (profil × 4,6 Ko + accès × 1,25 Ko + 380 Ko de système).
--
-- Cette migration crée la fonction attendue. Elle renvoie la taille réelle
-- occupée par la base Postgres, en octets.
--
-- Portée volontairement limitée :
--   • lecture seule, donc même garde que les autres mesures admin
--     (`est_admin()` comme admin_dbsupbase_niveaux), sans exiger l'AAL2
--     réservé aux actions destructrices ;
--   • `security definer` + `search_path` figé : un élève ne peut pas lire
--     `pg_database_size` en dehors de cette porte ;
--   • execute accordé au seul rôle `authenticated`, la garde faisant le reste.
--
-- Ce que la fonction ne mesure PAS : les fichiers du Storage (photos de
-- profil, sauvegardes). Le quota Supabase de 500 Mo les additionne ; le
-- badge les estime encore à part.
--
-- Idempotente : relançable sans risque.
-- =====================================================================

create or replace function public.admin_taille_base()
returns bigint
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_octets bigint;
begin
  if not public.est_admin() then
    raise exception 'réservé à l''administrateur' using errcode = '42501';
  end if;

  select pg_database_size(current_database()) into v_octets;

  return coalesce(v_octets, 0);
end;
$$;

-- Aucune exécution pour un visiteur non connecté ; la garde interne protège
-- les élèves connectés.
revoke all on function public.admin_taille_base() from public;
revoke all on function public.admin_taille_base() from anon;
grant execute on function public.admin_taille_base() to authenticated;
