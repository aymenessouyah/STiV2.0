-- STI V2.0 — migration additive v445 : Photos de profil des élèves avec validation Administrateur
-- Stockage léger (~6 à 12 Ko WebP/JPEG 144x144 en data URL sécurisée) sur public.profiles,
-- compatible 100 % hors-ligne et synchronisé en temps réel via supabase_realtime.

alter table public.profiles
  add column if not exists photo_url text,
  add column if not exists photo_attente text,
  add column if not exists photo_attente_le timestamptz;

alter table public.profiles
  drop constraint if exists chk_profiles_photo_url_safe;
alter table public.profiles
  add constraint chk_profiles_photo_url_safe check (
    photo_url is null or (
      octet_length(photo_url) <= 65536
      and photo_url ~ '^data:image/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$'
    )
  );

alter table public.profiles
  drop constraint if exists chk_profiles_photo_attente_safe;
alter table public.profiles
  add constraint chk_profiles_photo_attente_safe check (
    photo_attente is null or (
      octet_length(photo_attente) <= 65536
      and photo_attente ~ '^data:image/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$'
    )
  );

-- 1) RPC Élève : proposer ou annuler sa propre photo (placée uniquement dans photo_attente)
create or replace function public.eleve_proposer_photo(p_data_url text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
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

  if octet_length(v_clean) > 65536
     or v_clean !~ '^data:image/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$' then
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

grant execute on function public.eleve_proposer_photo(text) to authenticated;

-- 2) RPC Administrateur : valider, refuser, définir directement ou supprimer la photo d'un élève
create or replace function public.admin_gerer_photo_eleve(
  p_uid uuid,
  p_action text,
  p_data_url text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
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
    if v_clean is null
       or octet_length(v_clean) > 65536
       or v_clean !~ '^data:image/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$' then
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

grant execute on function public.admin_gerer_photo_eleve(uuid, text, text) to authenticated;

notify pgrst, 'reload schema';
