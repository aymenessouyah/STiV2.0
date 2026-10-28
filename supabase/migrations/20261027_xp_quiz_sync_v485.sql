-- =====================================================================
-- STI V2.0 — v485 : sauvegarde atomique des acquis XP des quiz.
-- Les autres données de sti_progressions ne sont ni remplacées ni supprimées.
-- Les règles RLS restent applicables (SECURITY INVOKER et auth.uid()).
-- =====================================================================

create or replace function public.sti_synchroniser_xp_quiz(p_cle text, p_valeur jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_donnees jsonb;
  v_brut jsonb;
  v_ancien jsonb := '{}'::jsonb;
  v_patch jsonb := '{}'::jsonb;
  v_resultat jsonb;
  v_champs text[];
  v_numeriques text[];
  v_champ text;
  v_a numeric;
  v_b numeric;
  v_best jsonb;
  v_best_ancien jsonb;
  v_best_patch jsonb;
begin
  if v_uid is null then
    raise exception 'Authentification requise' using errcode = '42501';
  end if;
  if p_cle is null or p_cle not in ('quizzora_xp_v1', 'sti-quiz-xp-js-v1', 'sqlQuestV3', 'quizphp_v1_user')
     or jsonb_typeof(p_valeur) is distinct from 'object'
     or coalesce(p_valeur->>'xp', '') !~ '^[0-9]{1,12}$' then
    raise exception 'Compteur XP invalide' using errcode = '22023';
  end if;

  if p_cle = 'sqlQuestV3' then
    v_numeriques := array['xp','level','streak','totalAnswered','totalCorrect','bestCombo','playgroundCount'];
    v_champs := v_numeriques || array['best','pseudo','avatar','profileSet'];
  elsif p_cle = 'quizphp_v1_user' then
    v_numeriques := array['xp','best','streak'];
    v_champs := v_numeriques || array['name','avatar'];
  else
    v_numeriques := array['xp','best','parties','bonnes','total'];
    v_champs := v_numeriques;
  end if;
  foreach v_champ in array v_champs loop
    if p_valeur ? v_champ then
      v_patch := jsonb_set(v_patch, array[v_champ], p_valeur->v_champ, true);
    end if;
  end loop;

  -- Créer au besoin la ligne du compte, puis verrouiller uniquement cette ligne.
  insert into public.sti_progressions (user_id, email, donnees, maj)
    values (v_uid, coalesce(auth.jwt()->>'email', ''), '{}'::jsonb, now())
    on conflict (user_id) do nothing;
  select donnees into v_donnees from public.sti_progressions where user_id = v_uid for update;
  if not found then
    raise exception 'Progression inaccessible' using errcode = '42501';
  end if;
  v_donnees := coalesce(v_donnees, '{}'::jsonb);
  v_brut := v_donnees->p_cle;
  if jsonb_typeof(v_brut) = 'object' then
    v_ancien := v_brut;
  elsif jsonb_typeof(v_brut) = 'string' then
    begin
      v_ancien := (v_donnees->>p_cle)::jsonb;
    exception when invalid_text_representation then
      raise exception 'Ancien compteur XP illisible' using errcode = '22023';
    end;
    if jsonb_typeof(v_ancien) is distinct from 'object' then
      raise exception 'Ancien compteur XP illisible' using errcode = '22023';
    end if;
  elsif v_brut is not null and v_brut <> 'null'::jsonb then
    raise exception 'Ancien compteur XP illisible' using errcode = '22023';
  end if;

  v_resultat := v_ancien || v_patch;
  foreach v_champ in array v_numeriques loop
    if v_ancien ? v_champ or v_patch ? v_champ then
      if (v_ancien->>v_champ is not null and v_ancien->>v_champ !~ '^[0-9]{1,12}$')
         or (v_patch->>v_champ is not null and v_patch->>v_champ !~ '^[0-9]{1,12}$') then
        raise exception 'Ancien compteur XP illisible' using errcode = '22023';
      end if;
      v_a := case when coalesce(v_ancien->>v_champ, '') ~ '^[0-9]{1,12}$' then (v_ancien->>v_champ)::numeric else 0 end;
      v_b := case when coalesce(v_patch->>v_champ, '') ~ '^[0-9]{1,12}$' then (v_patch->>v_champ)::numeric else 0 end;
      v_resultat := jsonb_set(v_resultat, array[v_champ], to_jsonb(greatest(v_a, v_b)), true);
    end if;
  end loop;

  if p_cle = 'sqlQuestV3' then
    v_best_ancien := case when jsonb_typeof(v_ancien->'best') = 'object' then v_ancien->'best' else '{}'::jsonb end;
    v_best_patch := case when jsonb_typeof(v_patch->'best') = 'object' then v_patch->'best' else '{}'::jsonb end;
    v_best := v_best_ancien || v_best_patch;
    for v_champ in select jsonb_object_keys(v_best) loop
      if (v_best_ancien->>v_champ is not null and v_best_ancien->>v_champ !~ '^[0-9]{1,12}$')
         or (v_best_patch->>v_champ is not null and v_best_patch->>v_champ !~ '^[0-9]{1,12}$') then
        raise exception 'Ancien record SQL illisible' using errcode = '22023';
      end if;
      v_a := case when coalesce(v_best_ancien->>v_champ, '') ~ '^[0-9]{1,12}$' then (v_best_ancien->>v_champ)::numeric else 0 end;
      v_b := case when coalesce(v_best_patch->>v_champ, '') ~ '^[0-9]{1,12}$' then (v_best_patch->>v_champ)::numeric else 0 end;
      v_best := jsonb_set(v_best, array[v_champ], to_jsonb(greatest(v_a, v_b)), true);
    end loop;
    v_resultat := jsonb_set(v_resultat, '{best}', v_best, true);
    if coalesce(v_patch->>'pseudo', 'Apprenti SQL') = 'Apprenti SQL'
       and coalesce(v_ancien->>'pseudo', 'Apprenti SQL') <> 'Apprenti SQL' then
      v_resultat := v_resultat || jsonb_build_object('pseudo', v_ancien->'pseudo', 'avatar', v_ancien->'avatar', 'profileSet', true);
    end if;
  elsif p_cle = 'quizphp_v1_user' and coalesce(v_patch->>'name', '') = '' and coalesce(v_ancien->>'name', '') <> '' then
    v_resultat := v_resultat || jsonb_build_object('name', v_ancien->'name', 'avatar', v_ancien->'avatar');
  end if;

  if v_resultat is distinct from v_ancien then
    update public.sti_progressions
      set donnees = jsonb_set(v_donnees, array[p_cle], to_jsonb(v_resultat::text), true), maj = now()
      where user_id = v_uid
      returning donnees->p_cle into v_brut;
    if jsonb_typeof(v_brut) = 'string' then v_resultat := (v_brut #>> '{}')::jsonb;
    elsif jsonb_typeof(v_brut) = 'object' then v_resultat := v_brut;
    end if;
  end if;
  return v_resultat;
end;
$$;

revoke all on function public.sti_synchroniser_xp_quiz(text, jsonb) from public, anon;
grant execute on function public.sti_synchroniser_xp_quiz(text, jsonb) to authenticated;
notify pgrst, 'reload schema';
