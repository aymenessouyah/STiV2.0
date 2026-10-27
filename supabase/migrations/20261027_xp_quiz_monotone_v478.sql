-- =====================================================================
-- STI V2.0 — Migration v478 : Protection monotone des XP & scores Quiz
-- dans public.sti_progressions (anti-remise à zéro multi-appareils / Labo)
-- Idempotent : peut être relancé sans danger dans Supabase SQL Editor.
-- =====================================================================

create or replace function public.sti_progressions_preserver_xp()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  d_old jsonb := coalesce(OLD.donnees, '{}'::jsonb);
  d_new jsonb := coalesce(NEW.donnees, '{}'::jsonb);
  k text;
  cles_protegees text[] := array[
    'sqlQuestV3',
    'quizphp_v1_user',
    'quizphp_v1_hist',
    'quizphp_v1_board',
    'js_quiz_high_score',
    'js_quiz_total_answered',
    'quizzora_xp_v1',
    'sti-quiz-xp-js-v1',
    'sti-quiz-tableaux-v1',
    'sti-mes-scores',
    'sti-media-prog-v1'
  ];
  j_old jsonb;
  j_new jsonb;
  j_best jsonb;
  m_key text;
  n_old numeric;
  n_new numeric;
begin
  -- 1) Conserver toute clé protégée absente du payload entrant (ex. push depuis un cache vierge)
  foreach k in array cles_protegees loop
    if (d_old ? k) and not (d_new ? k) and d_old -> k is not null then
      d_new := jsonb_set(d_new, array[k], d_old -> k, true);
    end if;
  end loop;

  -- 2) Compteurs entiers simples (Quiz JS) : GREATEST monotone
  foreach k in array array['js_quiz_high_score', 'js_quiz_total_answered'] loop
    if (d_old ? k) and (d_new ? k) then
      begin
        n_old := coalesce(nullif(regexp_replace(coalesce(d_old ->> k, '0'), '[^0-9.-]', '', 'g'), '')::numeric, 0);
        n_new := coalesce(nullif(regexp_replace(coalesce(d_new ->> k, '0'), '[^0-9.-]', '', 'g'), '')::numeric, 0);
        if n_old > n_new then
          d_new := jsonb_set(d_new, array[k], to_jsonb((n_old::bigint)::text), true);
        end if;
      exception when others then
        null;
      end;
    end if;
  end loop;

  -- 3) Quiz SQL (sqlQuestV3 : xp, level, streak, totalAnswered, totalCorrect, bestCombo, best.*)
  if (d_old ? 'sqlQuestV3') and (d_new ? 'sqlQuestV3') then
    begin
      j_old := case when jsonb_typeof(d_old -> 'sqlQuestV3') = 'object' then d_old -> 'sqlQuestV3' else (d_old ->> 'sqlQuestV3')::jsonb end;
      j_new := case when jsonb_typeof(d_new -> 'sqlQuestV3') = 'object' then d_new -> 'sqlQuestV3' else (d_new ->> 'sqlQuestV3')::jsonb end;
      if jsonb_typeof(j_old) = 'object' and jsonb_typeof(j_new) = 'object' then
        j_new := j_new || jsonb_build_object(
          'xp', greatest(coalesce((j_old ->> 'xp')::numeric, 0), coalesce((j_new ->> 'xp')::numeric, 0))::bigint,
          'level', greatest(coalesce((j_old ->> 'level')::numeric, 1), coalesce((j_new ->> 'level')::numeric, 1))::bigint,
          'streak', greatest(coalesce((j_old ->> 'streak')::numeric, 0), coalesce((j_new ->> 'streak')::numeric, 0))::bigint,
          'totalAnswered', greatest(coalesce((j_old ->> 'totalAnswered')::numeric, 0), coalesce((j_new ->> 'totalAnswered')::numeric, 0))::bigint,
          'totalCorrect', greatest(coalesce((j_old ->> 'totalCorrect')::numeric, 0), coalesce((j_new ->> 'totalCorrect')::numeric, 0))::bigint,
          'bestCombo', greatest(coalesce((j_old ->> 'bestCombo')::numeric, 0), coalesce((j_new ->> 'bestCombo')::numeric, 0))::bigint
        );
        if coalesce(j_new ->> 'pseudo', 'Apprenti SQL') = 'Apprenti SQL'
           and coalesce(j_old ->> 'pseudo', 'Apprenti SQL') <> 'Apprenti SQL' then
          j_new := j_new || jsonb_build_object(
            'pseudo', j_old -> 'pseudo',
            'avatar', coalesce(j_old -> 'avatar', j_new -> 'avatar'),
            'profileSet', true
          );
        end if;
        if jsonb_typeof(j_old -> 'best') = 'object' then
          j_best := case when jsonb_typeof(j_new -> 'best') = 'object' then j_new -> 'best' else '{}'::jsonb end;
          for m_key in select jsonb_object_keys(j_old -> 'best') loop
            j_best := jsonb_set(
              j_best,
              array[m_key],
              to_jsonb(greatest(coalesce((j_old -> 'best' ->> m_key)::numeric, 0), coalesce((j_best ->> m_key)::numeric, 0))::bigint),
              true
            );
          end loop;
          j_new := jsonb_set(j_new, array['best'], j_best, true);
        end if;
        d_new := jsonb_set(d_new, array['sqlQuestV3'], to_jsonb(j_new::text), true);
      end if;
    exception when others then
      null;
    end;
  end if;

  -- 4) Quiz PHP (quizphp_v1_user : xp, best, streak, name, avatar)
  if (d_old ? 'quizphp_v1_user') and (d_new ? 'quizphp_v1_user') then
    begin
      j_old := case when jsonb_typeof(d_old -> 'quizphp_v1_user') = 'object' then d_old -> 'quizphp_v1_user' else (d_old ->> 'quizphp_v1_user')::jsonb end;
      j_new := case when jsonb_typeof(d_new -> 'quizphp_v1_user') = 'object' then d_new -> 'quizphp_v1_user' else (d_new ->> 'quizphp_v1_user')::jsonb end;
      if jsonb_typeof(j_old) = 'object' and jsonb_typeof(j_new) = 'object' then
        j_new := j_new || jsonb_build_object(
          'xp', greatest(coalesce((j_old ->> 'xp')::numeric, 0), coalesce((j_new ->> 'xp')::numeric, 0))::bigint,
          'best', greatest(coalesce((j_old ->> 'best')::numeric, 0), coalesce((j_new ->> 'best')::numeric, 0))::bigint,
          'streak', greatest(coalesce((j_old ->> 'streak')::numeric, 0), coalesce((j_new ->> 'streak')::numeric, 0))::bigint
        );
        if coalesce(j_new ->> 'name', '') = '' and coalesce(j_old ->> 'name', '') <> '' then
          j_new := j_new || jsonb_build_object(
            'name', j_old -> 'name',
            'avatar', coalesce(j_old -> 'avatar', j_new -> 'avatar')
          );
        end if;
        d_new := jsonb_set(d_new, array['quizphp_v1_user'], to_jsonb(j_new::text), true);
      end if;
    exception when others then
      null;
    end;
  end if;

  -- 5) Quiz HTML/CSS & JS XP cumulés (quizzora_xp_v1, sti-quiz-xp-js-v1)
  foreach k in array array['quizzora_xp_v1', 'sti-quiz-xp-js-v1'] loop
    if (d_old ? k) and (d_new ? k) then
      begin
        j_old := case when jsonb_typeof(d_old -> k) = 'object' then d_old -> k else (d_old ->> k)::jsonb end;
        j_new := case when jsonb_typeof(d_new -> k) = 'object' then d_new -> k else (d_new ->> k)::jsonb end;
        if jsonb_typeof(j_old) = 'object' and jsonb_typeof(j_new) = 'object' then
          j_new := j_new || jsonb_build_object(
            'xp', greatest(coalesce((j_old ->> 'xp')::numeric, 0), coalesce((j_new ->> 'xp')::numeric, 0))::bigint,
            'best', greatest(coalesce((j_old ->> 'best')::numeric, 0), coalesce((j_new ->> 'best')::numeric, 0))::bigint,
            'parties', greatest(coalesce((j_old ->> 'parties')::numeric, 0), coalesce((j_new ->> 'parties')::numeric, 0))::bigint,
            'bonnes', greatest(coalesce((j_old ->> 'bonnes')::numeric, 0), coalesce((j_new ->> 'bonnes')::numeric, 0))::bigint,
            'total', greatest(coalesce((j_old ->> 'total')::numeric, 0), coalesce((j_new ->> 'total')::numeric, 0))::bigint
          );
          d_new := jsonb_set(d_new, array[k], to_jsonb(j_new::text), true);
        end if;
      exception when others then
        null;
      end;
    end if;
  end loop;

  -- 6) sti-mes-scores : ne jamais laisser "{}" écraser des notes déjà acquises
  if (d_old ? 'sti-mes-scores') and (d_new ? 'sti-mes-scores') then
    begin
      j_old := case when jsonb_typeof(d_old -> 'sti-mes-scores') = 'object' then d_old -> 'sti-mes-scores' else (d_old ->> 'sti-mes-scores')::jsonb end;
      j_new := case when jsonb_typeof(d_new -> 'sti-mes-scores') = 'object' then d_new -> 'sti-mes-scores' else (d_new ->> 'sti-mes-scores')::jsonb end;
      if jsonb_typeof(j_old) = 'object' and jsonb_typeof(j_new) = 'object' then
        j_new := j_old || j_new;
        d_new := jsonb_set(d_new, array['sti-mes-scores'], to_jsonb(j_new::text), true);
      end if;
    exception when others then
      null;
    end;
  end if;

  NEW.donnees := d_new;
  return NEW;
exception when others then
  return NEW;
end;
$$;

drop trigger if exists trg_sti_progressions_monotone_xp on public.sti_progressions;
create trigger trg_sti_progressions_monotone_xp
  before update on public.sti_progressions
  for each row
  execute function public.sti_progressions_preserver_xp();
