-- STI V2.0 v490 : identité commune pour une partie reprise sur plusieurs appareils.
-- Les anciennes opérations unitaires et l'historique sans identité restent inchangés.

alter table public.sti_quiz_xp_operations
  add column if not exists cumulatif boolean not null default false;

alter table public.sti_quiz_parties
  add column if not exists partie_id uuid;

-- Les NULL historiques restent distincts ; une partie moderne est unique par compte et quiz.
create unique index if not exists sti_quiz_parties_identite_v490
  on public.sti_quiz_parties (user_id, quiz, partie_id);

-- Une même partie peut être finalisée plusieurs fois avec des progrès différents.
-- Son gain cumulé le plus élevé est crédité une seule fois, sous le même verrou
-- de progression que le protocole v487. Les UUID unitaires v487 restent stricts.
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
revoke all on function public.sti_appliquer_gain_partie_quiz(text, jsonb, uuid, bigint) from public, anon;
grant execute on function public.sti_appliquer_gain_partie_quiz(text, jsonb, uuid, bigint) to authenticated;

-- L'historique est également idempotent : une reprise plus avancée enrichit la
-- même ligne au lieu de gonfler le plancher XP ou le nombre de parties.
create or replace function public.sti_enregistrer_partie_quiz(
  p_partie_id uuid, p_quiz text, p_module text, p_score integer,
  p_total integer, p_points integer, p_ordre jsonb
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Authentification requise' using errcode = '42501'; end if;
  if p_partie_id is null or p_quiz is null or p_quiz not in ('html-css','javascript','sql','php','tableaux')
     or p_total is null or p_total < 1 or p_total > 10000 or p_score is null or p_score < 0 or p_score > p_total
     or length(coalesce(p_module, '')) > 200
     or (p_ordre is not null and (jsonb_typeof(p_ordre) is distinct from 'array' or jsonb_array_length(p_ordre) > 200)) then
    raise exception 'Partie invalide' using errcode = '22023';
  end if;
  insert into public.sti_quiz_parties (user_id, email, quiz, module, score, total, points, ordre_questions, partie_id)
    values (v_uid, coalesce(auth.jwt()->>'email', ''), p_quiz, nullif(p_module, ''), p_score, p_total, p_points, p_ordre, p_partie_id)
  on conflict (user_id, quiz, partie_id) do update set
    score = case when excluded.total > sti_quiz_parties.total then excluded.score
                 when excluded.total = sti_quiz_parties.total then greatest(sti_quiz_parties.score, excluded.score)
                 else sti_quiz_parties.score end,
    points = case when excluded.total >= sti_quiz_parties.total then greatest(coalesce(sti_quiz_parties.points, 0), coalesce(excluded.points, 0))
                  else sti_quiz_parties.points end,
    ordre_questions = case when excluded.total > sti_quiz_parties.total then excluded.ordre_questions
                           else sti_quiz_parties.ordre_questions end,
    total = greatest(sti_quiz_parties.total, excluded.total);
  return true;
end;
$$;
revoke all on function public.sti_enregistrer_partie_quiz(uuid, text, text, integer, integer, integer, jsonb) from public, anon;
grant execute on function public.sti_enregistrer_partie_quiz(uuid, text, text, integer, integer, integer, jsonb) to authenticated;
