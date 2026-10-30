-- =====================================================================
-- STI V2.0 — Migration v558 : taille réelle du Storage pour l'administrateur.
--
-- Contexte : le badge de quota de admin.html compare l'occupation au forfait
-- Supabase de 500 Mo, qui additionne la base Postgres ET les fichiers du
-- Storage. Depuis la v557 la base est mesurée exactement
-- (admin_taille_base), mais les fichiers ne l'étaient pas du tout : ils
-- entraient dans aucune des deux mesures.
--
-- Cette migration ajoute la seconde moitié de la mesure.
--
-- Choix techniques :
--   • somme de (metadata->>'size') sur storage.objects, la taille déclarée
--     par Storage lui-même — pas la taille des lignes de métadonnées, qui
--     reste dans la base et est déjà comptée par admin_taille_base() ;
--   • cast défensif : un objet dont la taille n'est pas un entier positif
--     compte pour 0 au lieu de faire échouer toute la somme ;
--   • si le schéma `storage` n'existe pas (projet sans Storage), la fonction
--     renvoie 0 au lieu de lever une erreur ;
--   • même garde que admin_taille_base() : `est_admin()`, mesure en lecture
--     seule, `execute` retiré à public/anon.
--
-- Idempotente : relançable sans risque.
-- =====================================================================

create or replace function public.admin_taille_stockage()
returns bigint
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_octets bigint := 0;
begin
  if not public.est_admin() then
    raise exception 'réservé à l''administrateur' using errcode = '42501';
  end if;

  -- Projet sans Storage : rien à mesurer, pas une erreur.
  if to_regclass('storage.objects') is null then
    return 0;
  end if;

  select coalesce(sum(
           case
             when (o.metadata->>'size') ~ '^[0-9]{1,18}$' then (o.metadata->>'size')::bigint
             else 0
           end), 0)
    into v_octets
    from storage.objects o;

  return coalesce(v_octets, 0);
end;
$$;

revoke all on function public.admin_taille_stockage() from public;
revoke all on function public.admin_taille_stockage() from anon;
grant execute on function public.admin_taille_stockage() to authenticated;
