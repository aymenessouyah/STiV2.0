-- =====================================================================
-- STI V2.0 — Migration v520 : le compteur XP ne recule jamais.
--
-- Scénario visé : un élève atteint 5 000 XP sur son téléphone connecté, puis
-- joue hors ligne sur son PC jusqu'à 6 000 XP. À la reconnexion, le PC ne doit
-- pas retomber à 5 000 : le cloud garde 6 000 et les deux appareils affichent
-- 6 000.
--
-- Trois protections, toutes idempotentes (relançables sans risque) :
--   1. le trigger du registre aligne la base sur tout total plus élevé observé ;
--   2. les deux fonctions de gains relèvent la base avant d'ajouter un gain,
--      pour qu'une nouvelle partie ne soit jamais perdue après un gain hors ligne ;
--   3. rien n'autorise jamais une baisse : les GREATEST existants (v478) restent.
--
-- À exécuter dans Supabase → SQL Editor, après les migrations v478 à v490.
-- =====================================================================

create or replace function public.sti_quiz_xp_proteger_registre()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_cle text;
  v_nouveau jsonb;
  v_ancien jsonb;
  v_attente bigint;
  v_xp bigint;
  v_observe bigint;
  v_xp_ancien bigint;
  v_total bigint;
  v_managed boolean;
  v_protocole jsonb;
  v_moderne boolean;
begin
  v_protocole := public.sti_quiz_xp_objet(coalesce(NEW.donnees, '{}'::jsonb)->'sti-xp-protocole-v487');
  v_moderne := coalesce(v_protocole->>'uid' = NEW.user_id::text and v_protocole->>'version' = '2', false);
  foreach v_cle in array array['quizzora_xp_v1', 'sti-quiz-xp-js-v1', 'sqlQuestV3', 'quizphp_v1_user'] loop
    if not (coalesce(NEW.donnees, '{}'::jsonb) ? v_cle) then continue; end if;
    select base + cumul into v_total from public.sti_quiz_xp_compteurs
      where user_id = NEW.user_id and cle = v_cle;
    v_managed := found;
    v_nouveau := public.sti_quiz_xp_objet(NEW.donnees->v_cle);
    v_ancien := case when TG_OP = 'UPDATE' then public.sti_quiz_xp_objet(OLD.donnees->v_cle) else '{}'::jsonb end;
    if v_nouveau is null or v_ancien is null
       or coalesce(v_nouveau->>'xp', '0') !~ '^[0-9]{1,12}$'
       or coalesce(v_ancien->>'xp', '0') !~ '^[0-9]{1,12}$' then
      -- Ne jamais remplacer par le registre un compteur historique illisible.
      if v_managed and TG_OP = 'UPDATE' and OLD.donnees ? v_cle then
        NEW.donnees := jsonb_set(NEW.donnees, array[v_cle], OLD.donnees->v_cle, true);
      end if;
      continue;
    end if;
    v_xp := coalesce((v_nouveau->>'xp')::bigint, 0);
    v_xp_ancien := coalesce((v_ancien->>'xp')::bigint, 0);
    v_attente := case when coalesce(v_nouveau->>'_sti_xp_attente', '') ~ '^[0-9]{1,12}$'
      then (v_nouveau->>'_sti_xp_attente')::bigint else 0 end;
    if v_moderne and coalesce(v_protocole->'attentes'->>v_cle, '') ~ '^[0-9]{1,12}$' then
      v_attente := greatest(v_attente, (v_protocole->'attentes'->>v_cle)::bigint);
    end if;
    -- v520 : total réellement acquis d'après cette écriture (gains en attente exclus).
    v_observe := greatest(v_xp_ancien, v_xp - v_attente, 0);
    if v_managed then
      if TG_OP = 'INSERT' and not v_moderne and v_attente = 0 then
        -- Pour un upsert ancien, attendre le UPDATE qui détient le verrou de ligne.
        continue;
      end if;
      -- Le compteur ne recule jamais : si l'appareil arrive avec un total plus
      -- élevé (partie jouée hors ligne), la base du registre s'aligne au lieu de
      -- l'écraser. Les gains en attente restent crédités par les fonctions RPC.
      if v_observe > v_total then
        update public.sti_quiz_xp_compteurs set base = base + (v_observe - v_total)
          where user_id = NEW.user_id and cle = v_cle returning base + cumul into v_total;
      end if;
      v_xp := greatest(v_xp_ancien, v_total);
    else
      v_xp := v_observe;
    end if;
    if v_managed or v_attente > 0 or v_nouveau ? '_sti_xp_attente' then
      v_nouveau := jsonb_set(v_nouveau - '_sti_xp_attente', '{xp}', to_jsonb(v_xp), true);
      NEW.donnees := jsonb_set(NEW.donnees, array[v_cle], to_jsonb(v_nouveau::text), true);
    end if;
  end loop;
  NEW.donnees := coalesce(NEW.donnees, '{}'::jsonb) - 'sti-xp-protocole-v487';
  return NEW;
end;
$$;

create or replace function public.sti_appliquer_gains_xp_quiz(p_cle text, p_valeur jsonb, p_operations jsonb)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_uid uuid := auth.uid();
  v_donnees jsonb;
  v_ancien jsonb;
  v_local bigint;
  v_observe bigint;
  v_base bigint;
  v_cumul bigint;
  v_total bigint;
  v_gain bigint;
  v_nouveaux bigint := 0;
  v_id uuid;
  v_operation jsonb;
  v_existante public.sti_quiz_xp_operations%rowtype;
  v_resultat jsonb;
  v_confirmes jsonb := '[]'::jsonb;
begin
  if v_uid is null then raise exception 'Authentification requise' using errcode = '42501'; end if;
  if p_cle is null or p_cle not in ('quizzora_xp_v1', 'sti-quiz-xp-js-v1', 'sqlQuestV3', 'quizphp_v1_user')
     or jsonb_typeof(p_valeur) is distinct from 'object'
     or coalesce(p_valeur->>'xp', '') !~ '^[0-9]{1,12}$'
     or jsonb_typeof(p_operations) is distinct from 'array'
     or jsonb_array_length(p_operations) > 100 then
    raise exception 'Opérations XP invalides' using errcode = '22023';
  end if;
  v_local := (p_valeur->>'xp')::bigint;

  insert into public.sti_progressions (user_id, email, donnees, maj)
    values (v_uid, coalesce(auth.jwt()->>'email', ''), '{}'::jsonb, now())
    on conflict (user_id) do nothing;
  select donnees into v_donnees from public.sti_progressions where user_id = v_uid for update;
  if not found then raise exception 'Progression inaccessible' using errcode = '42501'; end if;
  v_ancien := public.sti_quiz_xp_objet(coalesce(v_donnees, '{}'::jsonb)->p_cle);
  if v_ancien is null or coalesce(v_ancien->>'xp', '0') !~ '^[0-9]{1,12}$' then
    raise exception 'Ancien compteur XP illisible' using errcode = '22023';
  end if;

  -- La base ne contient pas les opérations locales en attente (retirées par
  -- le client). Une fois initialisée, elle ne dépend plus des totaux locaux.
  insert into public.sti_quiz_xp_compteurs (user_id, cle, base, cumul)
    values (v_uid, p_cle, greatest(coalesce((v_ancien->>'xp')::bigint, 0), v_local), 0)
    on conflict (user_id, cle) do nothing;
  select base, cumul into v_base, v_cumul from public.sti_quiz_xp_compteurs
    where user_id = v_uid and cle = p_cle for update;

  -- v520 : la ligne (ou le client) peut déjà porter un total plus élevé, gagné
  -- hors ligne sur un autre appareil. On relève la base du registre AVANT
  -- d'ajouter les nouveaux gains, sinon ces gains seraient perdus (le total
  -- calculé resterait sous la valeur déjà enregistrée).
  v_observe := greatest(coalesce((v_ancien ->> 'xp')::bigint, 0), v_local);
  if v_observe > v_base + v_cumul then
    update public.sti_quiz_xp_compteurs set base = v_observe - v_cumul
      where user_id = v_uid and cle = p_cle;
    v_base := v_observe - v_cumul;
  end if;

  for v_operation in select value from jsonb_array_elements(p_operations) loop
    if jsonb_typeof(v_operation) is distinct from 'object'
       or coalesce(v_operation->>'id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
       or coalesce(v_operation->>'gain', '') !~ '^[0-9]{1,10}$' then
      raise exception 'Opération XP invalide' using errcode = '22023';
    end if;
    v_id := (v_operation->>'id')::uuid;
    v_gain := (v_operation->>'gain')::bigint;
    if v_gain <= 0 or v_gain > 1000000000 then
      raise exception 'Gain XP invalide' using errcode = '22023';
    end if;
    insert into public.sti_quiz_xp_operations (user_id, operation_id, cle, gain)
      values (v_uid, v_id, p_cle, v_gain) on conflict (user_id, operation_id) do nothing;
    if found then
      v_nouveaux := v_nouveaux + v_gain;
    else
      select * into v_existante from public.sti_quiz_xp_operations
        where user_id = v_uid and operation_id = v_id;
      if v_existante.cle <> p_cle or v_existante.gain <> v_gain then
        raise exception 'Identifiant XP déjà utilisé pour un autre gain' using errcode = '22023';
      end if;
    end if;
    v_confirmes := v_confirmes || to_jsonb(v_id::text);
  end loop;

  v_total := v_base + v_cumul + v_nouveaux;
  if v_total > 999999999999 then raise exception 'Compteur XP trop grand' using errcode = '22023'; end if;
  update public.sti_quiz_xp_compteurs set cumul = cumul + v_nouveaux
    where user_id = v_uid and cle = p_cle;
  v_resultat := public.sti_synchroniser_xp_quiz(p_cle, jsonb_set(p_valeur, '{xp}', to_jsonb(v_total), true));
  return jsonb_build_object('valeur', v_resultat, 'confirmes', v_confirmes);
end;
$$;

create or replace function public.sti_appliquer_gain_partie_quiz(
  p_cle text, p_valeur jsonb, p_partie_id uuid, p_gain bigint
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_uid uuid := auth.uid();
  v_donnees jsonb;
  v_ancien jsonb;
  v_local bigint;
  v_observe bigint;
  v_base bigint;
  v_cumul bigint;
  v_total bigint;
  v_applique bigint := 0;
  v_confirme bigint;
  v_existant public.sti_quiz_xp_operations%rowtype;
  v_resultat jsonb;
begin
  if v_uid is null then raise exception 'Authentification requise' using errcode = '42501'; end if;
  if p_cle is null or p_cle not in ('quizzora_xp_v1', 'sti-quiz-xp-js-v1', 'sqlQuestV3', 'quizphp_v1_user')
     or jsonb_typeof(p_valeur) is distinct from 'object'
     or coalesce(p_valeur->>'xp', '') !~ '^[0-9]{1,12}$'
     or p_partie_id is null or p_gain is null or p_gain <= 0 or p_gain > 1000000000 then
    raise exception 'Gain de partie invalide' using errcode = '22023';
  end if;
  v_local := (p_valeur->>'xp')::bigint;

  insert into public.sti_progressions (user_id, email, donnees, maj)
    values (v_uid, coalesce(auth.jwt()->>'email', ''), '{}'::jsonb, now())
    on conflict (user_id) do nothing;
  select donnees into v_donnees from public.sti_progressions where user_id = v_uid for update;
  if not found then raise exception 'Progression inaccessible' using errcode = '42501'; end if;
  v_ancien := public.sti_quiz_xp_objet(coalesce(v_donnees, '{}'::jsonb)->p_cle);
  if v_ancien is null or coalesce(v_ancien->>'xp', '0') !~ '^[0-9]{1,12}$' then
    raise exception 'Ancien compteur XP illisible' using errcode = '22023';
  end if;
  insert into public.sti_quiz_xp_compteurs (user_id, cle, base, cumul)
    values (v_uid, p_cle, greatest(coalesce((v_ancien->>'xp')::bigint, 0), v_local), 0)
    on conflict (user_id, cle) do nothing;
  select base, cumul into v_base, v_cumul from public.sti_quiz_xp_compteurs
    where user_id = v_uid and cle = p_cle for update;

  -- v520 : la ligne (ou le client) peut déjà porter un total plus élevé, gagné
  -- hors ligne sur un autre appareil. On relève la base du registre AVANT
  -- d'ajouter les nouveaux gains, sinon ces gains seraient perdus (le total
  -- calculé resterait sous la valeur déjà enregistrée).
  v_observe := greatest(coalesce((v_ancien ->> 'xp')::bigint, 0), v_local);
  if v_observe > v_base + v_cumul then
    update public.sti_quiz_xp_compteurs set base = v_observe - v_cumul
      where user_id = v_uid and cle = p_cle;
    v_base := v_observe - v_cumul;
  end if;

  insert into public.sti_quiz_xp_operations (user_id, operation_id, cle, gain, cumulatif)
    values (v_uid, p_partie_id, p_cle, p_gain, true)
    on conflict (user_id, operation_id) do nothing;
  if found then
    v_applique := p_gain;
    v_confirme := p_gain;
  else
    select * into v_existant from public.sti_quiz_xp_operations
      where user_id = v_uid and operation_id = p_partie_id for update;
    if v_existant.cle <> p_cle or not v_existant.cumulatif then
      raise exception 'Identifiant XP déjà utilisé pour une autre opération' using errcode = '22023';
    end if;
    v_confirme := greatest(v_existant.gain, p_gain);
    v_applique := v_confirme - v_existant.gain;
    if v_applique > 0 then
      update public.sti_quiz_xp_operations set gain = v_confirme
        where user_id = v_uid and operation_id = p_partie_id;
    end if;
  end if;
  v_total := v_base + v_cumul + v_applique;
  if v_total > 999999999999 then raise exception 'Compteur XP trop grand' using errcode = '22023'; end if;
  update public.sti_quiz_xp_compteurs set cumul = cumul + v_applique
    where user_id = v_uid and cle = p_cle;
  v_resultat := public.sti_synchroniser_xp_quiz(p_cle, jsonb_set(p_valeur, '{xp}', to_jsonb(v_total), true));
  return jsonb_build_object('valeur', v_resultat, 'confirmes', jsonb_build_array(p_partie_id::text),
                            'applique', v_applique, 'gain_confirme', v_confirme);
end;
$$;
