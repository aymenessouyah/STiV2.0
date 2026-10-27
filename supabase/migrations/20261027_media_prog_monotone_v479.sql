-- =====================================================================
-- STI V2.0 — Migration v479 : Fusion monotone sous-clé par sous-clé de
-- sti-media-prog-v1 (vidéos .mp4 & audios .mp3) dans public.sti_progressions
-- + réconciliation depuis public.acces (page = 'PROG_MEDIA').
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
  e_old jsonb;
  e_new jsonb;
  v_max_pct bigint;
  v_done boolean;
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

  -- 7) v479 — sti-media-prog-v1 : fusion monotone sous-clé par sous-clé (video:* / audio:*)
  --    Empêche toute perte de compteur vidéo/audio (ex. ancien client supprimant une sous-clé au clic sur ✕)
  if (d_old ? 'sti-media-prog-v1') and (d_new ? 'sti-media-prog-v1') then
    begin
      j_old := case when jsonb_typeof(d_old -> 'sti-media-prog-v1') = 'object' then d_old -> 'sti-media-prog-v1' else (d_old ->> 'sti-media-prog-v1')::jsonb end;
      j_new := case when jsonb_typeof(d_new -> 'sti-media-prog-v1') = 'object' then d_new -> 'sti-media-prog-v1' else (d_new ->> 'sti-media-prog-v1')::jsonb end;
      if jsonb_typeof(j_old) = 'object' and jsonb_typeof(j_new) = 'object' then
        for m_key in select jsonb_object_keys(j_old) loop
          e_old := j_old -> m_key;
          if not (j_new ? m_key) then
            -- Sous-clé omise par un ancien client (ex. masquage de bannière) : on conserve maxPct/done avec sec=0
            if jsonb_typeof(e_old) = 'object' then
              j_new := jsonb_set(j_new, array[m_key], e_old || jsonb_build_object('sec', 0, 'repriseMasquee', true), true);
            else
              j_new := jsonb_set(j_new, array[m_key], e_old, true);
            end if;
          elsif jsonb_typeof(e_old) = 'object' and jsonb_typeof(j_new -> m_key) = 'object' then
            e_new := j_new -> m_key;
            v_max_pct := greatest(
              coalesce((e_old ->> 'maxPct')::numeric, 0),
              coalesce((e_old ->> 'pct')::numeric, 0),
              coalesce((e_new ->> 'maxPct')::numeric, 0),
              coalesce((e_new ->> 'pct')::numeric, 0),
              case when coalesce((e_old ->> 'sec')::numeric, 0) >= 2 or coalesce((e_new ->> 'sec')::numeric, 0) >= 2 then 1 else 0 end
            )::bigint;
            v_done := coalesce((e_old ->> 'done')::boolean, false)
                      or coalesce((e_new ->> 'done')::boolean, false)
                      or v_max_pct >= 88;
            if v_done then
              v_max_pct := 100;
            end if;
            e_new := e_new || jsonb_build_object(
              'maxPct', v_max_pct,
              'pct', case when v_done then 100 else greatest(coalesce((e_new ->> 'pct')::numeric, 0)::bigint, case when v_max_pct > 0 then 1 else 0 end) end,
              'dur', greatest(coalesce((e_old ->> 'dur')::numeric, 0), coalesce((e_new ->> 'dur')::numeric, 0))::bigint,
              'done', v_done,
              'ts', greatest(coalesce((e_old ->> 'ts')::numeric, 0), coalesce((e_new ->> 'ts')::numeric, 0))::bigint
            );
            if v_done then
              e_new := e_new || jsonb_build_object('sec', 0);
            end if;
            j_new := jsonb_set(j_new, array[m_key], e_new, true);
          end if;
        end loop;
        d_new := jsonb_set(d_new, array['sti-media-prog-v1'], to_jsonb(j_new::text), true);
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
