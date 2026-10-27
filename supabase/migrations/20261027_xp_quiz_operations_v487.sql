-- =====================================================================
-- STI V2.0 — v487 : gains XP additionnés une seule fois entre appareils.
-- La première utilisation conserve le total historique, puis chaque opération
-- identifiée est ajoutée sous verrou. Les anciens autres champs restent gérés
-- par la fonction et le trigger monotones existants.
-- =====================================================================

create table if not exists public.sti_quiz_xp_compteurs (
  user_id uuid not null references auth.users(id) on delete cascade,
  cle text not null check (cle in ('quizzora_xp_v1', 'sti-quiz-xp-js-v1', 'sqlQuestV3', 'quizphp_v1_user')),
  base bigint not null check (base >= 0),
  cumul bigint not null default 0 check (cumul >= 0),
  primary key (user_id, cle)
);

create table if not exists public.sti_quiz_xp_operations (
  user_id uuid not null references auth.users(id) on delete cascade,
  operation_id uuid not null,
  cle text not null check (cle in ('quizzora_xp_v1', 'sti-quiz-xp-js-v1', 'sqlQuestV3', 'quizphp_v1_user')),
  gain bigint not null check (gain > 0 and gain <= 1000000000),
  cree_le timestamptz not null default now(),
  primary key (user_id, operation_id)
);

alter table public.sti_quiz_xp_compteurs enable row level security;
alter table public.sti_quiz_xp_operations enable row level security;
revoke all on public.sti_quiz_xp_compteurs, public.sti_quiz_xp_operations from public, anon, authenticated;

-- Une clé historique est soit un objet, soit sa représentation JSON en texte.
create or replace function public.sti_quiz_xp_objet(p_brut jsonb)
returns jsonb
language plpgsql
immutable
set search_path = pg_catalog
as $$
declare
  v_objet jsonb;
begin
  if p_brut is null or p_brut = 'null'::jsonb then return '{}'::jsonb; end if;
  if jsonb_typeof(p_brut) = 'object' then return p_brut; end if;
  if jsonb_typeof(p_brut) = 'string' then
    begin
      v_objet := (p_brut #>> '{}')::jsonb;
      if jsonb_typeof(v_objet) = 'object' then return v_objet; end if;
    exception when invalid_text_representation then null;
    end;
  end if;
  return null;
end;
$$;

-- Le synchroniseur général historique peut envoyer une copie contenant des
-- gains encore en attente. Avant l'activation du registre, on retire ce seul
-- montant provisoire ; ensuite le registre est la source de vérité pour XP.
-- Ce trigger s'exécute après le trigger monotone v479, sans le remplacer.
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
    if v_managed then
      if TG_OP = 'INSERT' and not v_moderne and v_attente = 0 then
        -- Pour un upsert ancien, attendre le UPDATE qui détient le verrou de ligne.
        continue;
      end if;
      if TG_OP = 'UPDATE' and not v_moderne and v_attente = 0 and v_xp > greatest(v_xp_ancien, v_total) then
        -- Compatibilité des anciennes versions : conserver leur nouveau maximum.
        -- Les gains concurrents de ces versions ne possèdent pas d'identifiant.
        update public.sti_quiz_xp_compteurs set base = base + (v_xp - greatest(v_xp_ancien, v_total))
          where user_id = NEW.user_id and cle = v_cle returning base + cumul into v_total;
      end if;
      v_xp := greatest(v_xp_ancien, v_total);
    elsif v_attente > 0 then
      v_xp := greatest(v_xp_ancien, v_xp - v_attente, 0);
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

drop trigger if exists trg_sti_progressions_z_xp_registre on public.sti_progressions;
create trigger trg_sti_progressions_z_xp_registre
  before insert or update on public.sti_progressions
  for each row execute function public.sti_quiz_xp_proteger_registre();

-- Une opération déjà reçue est confirmée sans être créditée une seconde fois.
-- SECURITY DEFINER est limité à auth.uid(), aux quatre compteurs et aux seuls
-- champs admis par la fonction v485 ; aucun accès direct aux tables n'est donné.
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

revoke all on function public.sti_quiz_xp_objet(jsonb) from public, anon, authenticated;
revoke all on function public.sti_quiz_xp_proteger_registre() from public, anon, authenticated;
revoke all on function public.sti_appliquer_gains_xp_quiz(text, jsonb, jsonb) from public, anon;
grant execute on function public.sti_appliquer_gains_xp_quiz(text, jsonb, jsonb) to authenticated;
notify pgrst, 'reload schema';
