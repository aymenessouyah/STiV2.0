-- =====================================================================
-- STI V2.0 — Migration v561 : les règles photo acceptent enfin le bucket.
--
-- Problème constaté le 30 octobre 2026, sur la base réelle :
--   la v559 a déplacé les photos de profil vers le bucket privé
--   `photos-profils` (URL signée dans `profiles.photo_url`), mais les
--   contraintes posées en v445 n'ont pas suivi. Elles n'autorisaient QUE
--   l'ancienne data URL base64 :
--
--     chk_profiles_photo_url_safe :
--       photo_url ~ '^data:image/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$'
--
--   Conséquence : chaque écriture d'une URL signée était rejetée par la
--   base (violation de contrainte), la RPC `admin_gerer_photo_eleve`
--   échouait, et le site retombait silencieusement sur le base64 — côté
--   élève (repli d'`acces.js`) comme côté administrateur (la photo est
--   laissée intacte). Les fichiers étaient bien déposés dans le bucket,
--   mais aucun profil ne pointait vers eux. La fonctionnalité v559 était
--   donc inopérante de bout en bout, sans aucune erreur visible.
--
-- Cette migration remplace les deux contraintes par une règle qui accepte
-- les DEUX formats, pour ne jamais casser une photo déjà enregistrée :
--   a) l'ancienne data URL base64 (JPEG/PNG/WebP, ≤ 64 Ko) ;
--   b) une URL signée du bucket privé photos-profils, dont l'hôte est bien
--      celui du projet Supabase et le chemin `/object/sign/` (jamais
--      `/object/public/` : le bucket reste privé).
--
-- La borne de 64 Ko est conservée telle quelle, et les schémas actifs
-- (data:text/html, data:image/svg+xml, javascript:…) restent refusés.
--
-- Le motif ci-dessous est volontairement identique à celui de
-- `public.sti_photo_url_valide()` (v559) et aux expressions
-- RE_PHOTO_BUCKET_* de acces.js, admin.js et roue-initiales.js : ce que la
-- base accepte doit s'afficher, et ce que le site affiche doit être
-- acceptable par la base. Le test tests/photos-contraintes-v561.test.mjs
-- compare les quatre.
--
-- Idempotente : relançable sans risque.
-- =====================================================================

alter table public.profiles drop constraint if exists chk_profiles_photo_url_safe;
alter table public.profiles add constraint chk_profiles_photo_url_safe check (
  photo_url is null or (
    octet_length(photo_url) <= 65536 and (
      photo_url ~ '^data:image/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$'
      or photo_url ~* '^https://[a-z0-9]+\.supabase\.co/storage/v1/object/sign/photos-profils/[^?\s]+[?]token=[A-Za-z0-9._%-]+$'
    )
  )
);

alter table public.profiles drop constraint if exists chk_profiles_photo_attente_safe;
alter table public.profiles add constraint chk_profiles_photo_attente_safe check (
  photo_attente is null or (
    octet_length(photo_attente) <= 65536 and (
      photo_attente ~ '^data:image/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$'
      or photo_attente ~* '^https://[a-z0-9]+\.supabase\.co/storage/v1/object/sign/photos-profils/[^?\s]+[?]token=[A-Za-z0-9._%-]+$'
    )
  )
);

-- Vérification immédiate : les deux contraintes doivent exister avec le
-- motif du bucket, et plus aucune photo ne doit être bloquée.
--
--   select conname, pg_get_constraintdef(oid)
--     from pg_constraint
--    where conrelid = 'public.profiles'::regclass
--      and conname like 'chk_profiles_photo%';
--
--   select count(*) from public.profiles where photo_url like 'data:image/%';

-- ── Alignement du validateur de la RPC ──────────────────────────────
-- `sti_photo_url_valide()` (v559) utilisait `[^?]+` : il tolérait un espace
-- dans le chemin, alors que les contraintes ci-dessus et les validateurs
-- d'affichage du site (`[^?\s]+`) le refusent. On aligne la RPC sur la règle
-- la plus stricte : ce que la base enregistre doit s'afficher, et ce qui
-- s'affiche doit être enregistrable — une seule règle, pas trois.
create or replace function public.sti_photo_url_valide(p_url text, p_uid uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_clean text := btrim(coalesce(p_url, ''));
  v_chemin text;
begin
  if v_clean = '' or p_uid is null then
    return false;
  end if;

  -- (a) data URL historique
  if v_clean ~ '^data:image/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$' then
    return octet_length(v_clean) <= 65536;
  end if;

  -- (b) URL signée du bucket, forme :
  --     https://<ref>.supabase.co/storage/v1/object/sign/photos-profils/<uid>/<fichier>?token=…
  if v_clean !~* '^https://[a-z0-9]+\.supabase\.co/storage/v1/object/sign/photos-profils/[^?\s]+[?]token=[A-Za-z0-9._%-]+$' then
    return false;
  end if;

  v_chemin := substring(v_clean from '/sign/photos-profils/([^?]+)');
  if v_chemin is null
     or v_chemin !~ ('^' || p_uid::text || '/[A-Za-z0-9_-]{1,80}\.(webp|jpg|jpeg|png)$') then
    return false;
  end if;

  -- Le fichier doit exister pour de vrai dans le bucket.
  return exists (
    select 1 from storage.objects o
     where o.bucket_id = 'photos-profils' and o.name = v_chemin
  );
end;
$$;

revoke all on function public.sti_photo_url_valide(text, uuid) from public;
revoke all on function public.sti_photo_url_valide(text, uuid) from anon;
grant execute on function public.sti_photo_url_valide(text, uuid) to authenticated;
