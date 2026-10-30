-- =====================================================================
-- STI V2.0 — Migration v559 : les photos de profil quittent la base.
--
-- Problème de départ : chaque photo de profil était stockée en base64 dans
-- profiles.photo_url / photo_attente (jusqu'à 65 536 octets par élève). Le
-- base64 gonfle le volume d'environ un tiers, alourdit chaque lecture de
-- profil et grossit la base, qu'on ne peut pas nettoyer partiellement.
--
-- Cette migration prépare un bucket dédié. Elle ne déplace AUCUNE photo
-- existante : les data URLs déjà enregistrées restent valides (les deux RPC
-- acceptent toujours l'ancien format), et une moulinette côté administration
-- (migration-photos-bucket.html) bascule les anciennes photos quand on le
-- souhaite, sans fenêtre de casse.
--
-- Choix de sécurité :
--   • bucket PRIVÉ : aucun fichier n'est lisible sans URL signée ;
--   • chaque élève n'écrit que dans son propre dossier <uid>/ ;
--   • la lecture est limitée au propriétaire et à l'administrateur ;
--   • les chemins sont aléatoires (32 caractères), donc non devinables ;
--   • l'URL stockée dans profiles est une URL SIGNÉE à 10 ans : affichage
--     synchrone partout, sans appel réseau supplémentaire, et renouvelable
--     d'un clic depuis la moulinette si on veut révoquer les anciennes.
--
-- Idempotente : relançable sans risque.
-- =====================================================================

-- ── 1. Le bucket ────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos-profils', 'photos-profils', false, 2097152,
        array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ── 2. Règles d'accès aux fichiers ──────────────────────────────────
drop policy if exists photos_profils_lecture on storage.objects;
create policy photos_profils_lecture on storage.objects
  for select to authenticated
  using (
    bucket_id = 'photos-profils'
    and (public.est_admin() or (storage.foldername(name))[1] = auth.uid()::text)
  );

drop policy if exists photos_profils_depot on storage.objects;
create policy photos_profils_depot on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'photos-profils'
    and (public.est_admin() or (storage.foldername(name))[1] = auth.uid()::text)
  );

drop policy if exists photos_profils_maj on storage.objects;
create policy photos_profils_maj on storage.objects
  for update to authenticated
  using (
    bucket_id = 'photos-profils'
    and (public.est_admin() or (storage.foldername(name))[1] = auth.uid()::text)
  )
  with check (
    bucket_id = 'photos-profils'
    and (public.est_admin() or (storage.foldername(name))[1] = auth.uid()::text)
  );

drop policy if exists photos_profils_suppression on storage.objects;
create policy photos_profils_suppression on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'photos-profils'
    and (public.est_admin() or (storage.foldername(name))[1] = auth.uid()::text)
  );

-- ── 3. Reconnaissance d'une URL de photo valide ─────────────────────
-- Accepte deux formes, pour ne jamais casser une photo déjà enregistrée :
--   a) l'ancienne data URL base64 (JPEG/PNG/WebP, ≤ 64 Ko) ;
--   b) une URL signée du bucket photos-profils, dont le dossier est bien
--      celui de l'élève concerné.
-- Dans le cas (b), l'objet doit réellement exister dans storage.objects :
-- une URL inventée ne peut pas être enregistrée.
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
  if v_clean !~* '^https://[a-z0-9]+\.supabase\.co/storage/v1/object/sign/photos-profils/[^?]+[?]token=[A-Za-z0-9._%-]+$' then
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

-- ── 4. Dépôt d'une photo par l'élève ────────────────────────────────
-- Même signature qu'avant : les anciens clients continuent de fonctionner
-- avec une data URL ; les nouveaux envoient l'URL signée du bucket.
create or replace function public.eleve_proposer_photo(p_data_url text default null)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_uid uuid := auth.uid();
  v_clean text := nullif(btrim(coalesce(p_data_url, '')), '');
begin
  if v_uid is null then
    raise exception 'authentification requise';
  end if;

  if v_clean is null then
    update public.profiles
       set photo_attente = null,
           photo_attente_le = null
     where id = v_uid;
    return jsonb_build_object('ok', true, 'etat', 'annulee');
  end if;

  if not public.sti_photo_url_valide(v_clean, v_uid) then
    raise exception 'format ou taille d''image invalide (JPEG/PNG/WebP <= 48 Ko)';
  end if;

  update public.profiles
     set photo_attente = v_clean,
         photo_attente_le = now()
   where id = v_uid;

  if not found then
    raise exception 'profil introuvable';
  end if;

  return jsonb_build_object('ok', true, 'etat', 'en_attente');
end;
$$;

-- ── 5. Gestion d'une photo par l'administrateur ─────────────────────
create or replace function public.admin_gerer_photo_eleve(
  p_uid uuid,
  p_action text,
  p_data_url text default null
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_act text := lower(btrim(coalesce(p_action, '')));
  v_clean text := nullif(btrim(coalesce(p_data_url, '')), '');
  v_res record;
begin
  if not public.est_admin() then
    raise exception 'acces reserve a l''administrateur';
  end if;
  if p_uid is null then
    raise exception 'identifiant eleve manquant';
  end if;

  if v_act = 'valider' then
    update public.profiles
       set photo_url = coalesce(v_clean, photo_attente, photo_url),
           photo_attente = null,
           photo_attente_le = null
     where id = p_uid
     returning id, photo_url, photo_attente into v_res;
  elsif v_act = 'refuser' then
    update public.profiles
       set photo_attente = null,
           photo_attente_le = null
     where id = p_uid
     returning id, photo_url, photo_attente into v_res;
  elsif v_act = 'definir' then
    if not public.sti_photo_url_valide(v_clean, p_uid) then
      raise exception 'format ou taille d''image invalide';
    end if;
    update public.profiles
       set photo_url = v_clean,
           photo_attente = null,
           photo_attente_le = null
     where id = p_uid
     returning id, photo_url, photo_attente into v_res;
  elsif v_act = 'supprimer' then
    update public.profiles
       set photo_url = null,
           photo_attente = null,
           photo_attente_le = null
     where id = p_uid
     returning id, photo_url, photo_attente into v_res;
  else
    raise exception 'action inconnue : %', v_act;
  end if;

  if v_res.id is null then
    raise exception 'profil introuvable';
  end if;

  return jsonb_build_object(
    'ok', true,
    'id', v_res.id,
    'photo_url', v_res.photo_url,
    'photo_attente', v_res.photo_attente
  );
end;
$$;
