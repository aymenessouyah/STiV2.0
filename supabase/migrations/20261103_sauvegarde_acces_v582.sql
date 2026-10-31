-- =====================================================================
-- STI V2.0 — Migration v582 : le journal des connexions ne s'efface plus
-- sans trace.
--
-- Contexte (constaté sur la base réelle le 31/10/2026) :
--   • la table `acces` ne contient plus rien avant le 25/10/2026 19 h 35,
--     alors que `profiles` (depuis le 07/10) et `sti_progressions`
--     (12 lignes modifiées avant le 25/10, la plus ancienne du 17/10)
--     ont gardé leur historique ;
--   • Postgres comptait 7 447 insertions et 4 582 suppressions pour
--     2 831 lignes vivantes : environ 4 600 lignes ont donc bien été
--     supprimées, pas perdues par une migration (aucune migration ne
--     supprime de ligne dans `acces`) ;
--   • le seul geste qui efface en masse ce journal est le bouton
--     « Effacer par mois… » du tableau de bord (ou « Alléger » de
--     DBSupbase), qui supprime tout un mois, ou tous les mois.
--
-- Conséquence pour les élèves : 48 profils sur 73 affichent 0 connexion,
-- dont 13 qui ont pourtant une progression enregistrée (ils ont utilisé
-- la plateforme). Rien ne permettait de restaurer ces lignes.
--
-- Cette migration apporte une ceinture et des bretelles, entièrement
-- côté serveur (le navigateur n'est qu'un appelant) :
--   1. `acces_sauvegardes` : copie du journal avant toute suppression ;
--   2. `admin_sauvegarder_acces(motif, mois)` : enregistre la copie ;
--   3. `admin_lister_sauvegardes_acces()` : liste les copies disponibles ;
--   4. `admin_reimporter_acces(lignes)` : réinsère des lignes exportées
--      (instantané local du tableau de bord) sans jamais créer de doublon ;
--   5. `admin_reimporter_sauvegarde_acces(id)` : restaure une copie
--      enregistrée par le point 2.
--
-- Toutes les portes exigent `est_admin_mfa()` (administrateur + AAL2) :
-- un compte élève ne peut ni copier, ni lister, ni réinsérer.
-- Aucune politique RLS n'est créée sur `acces_sauvegardes` : la table
-- n'est lisible que par les fonctions `security definer` ci-dessous.
--
-- Idempotente : relançable sans risque.
-- =====================================================================

create table if not exists public.acces_sauvegardes (
  id bigserial primary key,
  cree_le timestamptz not null default now(),
  motif text not null default 'purge',
  mois text not null default '*',
  nb_lignes integer not null default 0,
  lignes jsonb not null
);

alter table public.acces_sauvegardes enable row level security;

comment on table public.acces_sauvegardes is
  'STI v582 — copies du journal acces prises avant une suppression, lisibles et restaurables uniquement par les RPC admin (est_admin_mfa).';

-- ---------------------------------------------------------------------
-- Réinsertion commune : accepte les lignes telles qu'exportées par le
-- tableau de bord (id, user_id, debut, fin, duree_sec, lieu, page) ou
-- telles que copiées par la sauvegarde serveur.
--
-- Idempotence à deux niveaux :
--   • même utilisateur + même horodatage + même page = ligne déjà connue ;
--   • `client_event_id` synthétique « reimp:<md5> » + index unique
--     `uq_acces_user_client_event`, donc un second import ne crée rien.
-- ---------------------------------------------------------------------
create or replace function public._sti_reinserer_acces(p_lignes jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_ligne jsonb;
  v_uid uuid;
  v_debut timestamptz;
  v_fin timestamptz;
  v_sec integer;
  v_lieu text;
  v_page text;
  v_cle text;
  v_inseres integer := 0;
  v_ignores integer := 0;
begin
  if p_lignes is null or jsonb_typeof(p_lignes) <> 'array' then
    raise exception 'liste de lignes attendue (tableau JSON)' using errcode = '22023';
  end if;

  for v_ligne in select value from jsonb_array_elements(p_lignes) loop
    v_uid := nullif(v_ligne->>'user_id', '')::uuid;
    v_debut := nullif(v_ligne->>'debut', '')::timestamptz;
    v_page := nullif(v_ligne->>'page', '');

    if v_uid is null or v_debut is null or v_page is null then
      v_ignores := v_ignores + 1;
      continue;
    end if;

    /* L'élève doit encore exister : `acces_user_id_fkey` pointerait dans le vide. */
    if not exists (select 1 from public.profiles p where p.id = v_uid) then
      v_ignores := v_ignores + 1;
      continue;
    end if;

    /* Ligne déjà présente à l'identique (autre appareil, autre import) ? */
    if exists (
      select 1 from public.acces a
       where a.user_id = v_uid
         and a.debut = v_debut
         and coalesce(a.page, '') = v_page
    ) then
      v_ignores := v_ignores + 1;
      continue;
    end if;

    v_fin := nullif(v_ligne->>'fin', '')::timestamptz;
    v_sec := nullif(v_ligne->>'duree_sec', '')::integer;
    v_lieu := nullif(v_ligne->>'lieu', '');
    v_cle := 'reimp:' || md5(v_uid::text || '|' || v_debut::text || '|' || v_page);

    insert into public.acces (user_id, debut, fin, duree_sec, lieu, page, client_event_id)
    values (v_uid, v_debut, v_fin, coalesce(v_sec, 0), v_lieu, v_page, v_cle)
    on conflict (user_id, client_event_id) do nothing;

    if found then
      v_inseres := v_inseres + 1;
    else
      v_ignores := v_ignores + 1;
    end if;
  end loop;

  return jsonb_build_object('inseres', v_inseres, 'ignores', v_ignores);
end;
$$;

revoke all on function public._sti_reinserer_acces(jsonb) from public;

-- ---------------------------------------------------------------------
-- 2. Copie du journal avant suppression.
--    Le mois est élargi d'un jour de chaque côté : une sauvegarde qui
--    contient une ligne de trop est inoffensive, une ligne manquante ne
--    se rattrape pas.
-- ---------------------------------------------------------------------
create or replace function public.admin_sauvegarder_acces(
  p_motif text default 'purge',
  p_mois text default '*'
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_lignes jsonb;
  v_nb integer;
  v_id bigint;
  v_tous boolean;
  v_debut_mois timestamptz;
  v_fin_mois timestamptz;
begin
  if not public.est_admin_mfa() then
    raise exception 'administrateur avec double authentification requis' using errcode = '42501';
  end if;

  v_tous := p_mois is null or p_mois = '*' or p_mois = '';
  if not v_tous then
    v_debut_mois := (to_date(p_mois || '-01', 'YYYY-MM-DD')::timestamp at time zone 'UTC') - interval '1 day';
    v_fin_mois := (to_date(p_mois || '-01', 'YYYY-MM-DD')::timestamp at time zone 'UTC') + interval '1 month' + interval '1 day';
  end if;

  select coalesce(jsonb_agg(to_jsonb(a) - 'id' - 'client_event_id' order by a.id), '[]'::jsonb)
    into v_lignes
    from public.acces a
   where a.page not in ('CFG_ECOLES', 'SEC_CONFIG', 'SUPPR_ACCES', 'TABLEAU_BLANC', 'PROG_MEDIA')
     and a.page not like 'QUIZ:%'
     and a.page not like 'MSG\_%'
     and a.page not like 'CTRL\_%'
     and a.page not like 'FLASH\_%'
     and a.page not like 'KAHOOT\_%'
     and a.page not like 'COPIE\_%'
     and a.page not like 'COFFRE\_%'
     and a.page not like 'SEC\_%'
     and a.page not like 'MAIN\_LEVEE:%'
     and (v_tous or (a.debut >= v_debut_mois and a.debut < v_fin_mois));

  v_nb := jsonb_array_length(v_lignes);
  if v_nb = 0 then
    return jsonb_build_object('id', null, 'nb_lignes', 0);
  end if;

  insert into public.acces_sauvegardes (motif, mois, nb_lignes, lignes)
  values (coalesce(nullif(p_motif, ''), 'purge'), coalesce(nullif(p_mois, ''), '*'), v_nb, v_lignes)
  returning id into v_id;

  /* On ne garde que les dix copies les plus récentes : le quota Supabase
     est de 500 Mo et le journal pèse quelques mégaoctets par copie. */
  delete from public.acces_sauvegardes
   where id not in (select s.id from public.acces_sauvegardes s order by s.id desc limit 10);

  return jsonb_build_object('id', v_id, 'nb_lignes', v_nb);
end;
$$;

revoke all on function public.admin_sauvegarder_acces(text, text) from public;
grant execute on function public.admin_sauvegarder_acces(text, text) to authenticated;

-- ---------------------------------------------------------------------
-- 3. Liste des copies (sans le contenu, pour ne pas charger la page).
-- ---------------------------------------------------------------------
create or replace function public.admin_lister_sauvegardes_acces()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_catalog
as $$
declare
  v_liste jsonb;
begin
  if not public.est_admin_mfa() then
    raise exception 'administrateur avec double authentification requis' using errcode = '42501';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
           'id', s.id,
           'cree_le', s.cree_le,
           'motif', s.motif,
           'mois', s.mois,
           'nb_lignes', s.nb_lignes) order by s.id desc), '[]'::jsonb)
    into v_liste
    from public.acces_sauvegardes s;

  return v_liste;
end;
$$;

revoke all on function public.admin_lister_sauvegardes_acces() from public;
grant execute on function public.admin_lister_sauvegardes_acces() to authenticated;

-- ---------------------------------------------------------------------
-- 4. Réimport d'un export (instantané local du navigateur).
-- ---------------------------------------------------------------------
create or replace function public.admin_reimporter_acces(p_lignes jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  if not public.est_admin_mfa() then
    raise exception 'administrateur avec double authentification requis' using errcode = '42501';
  end if;

  if p_lignes is null or jsonb_typeof(p_lignes) <> 'array' then
    raise exception 'liste de lignes attendue (tableau JSON)' using errcode = '22023';
  end if;

  if jsonb_array_length(p_lignes) > 20000 then
    raise exception 'trop de lignes en une fois (20 000 maximum)' using errcode = '22023';
  end if;

  return public._sti_reinserer_acces(p_lignes);
end;
$$;

revoke all on function public.admin_reimporter_acces(jsonb) from public;
grant execute on function public.admin_reimporter_acces(jsonb) to authenticated;

-- ---------------------------------------------------------------------
-- 5. Restauration d'une copie serveur.
-- ---------------------------------------------------------------------
create or replace function public.admin_reimporter_sauvegarde_acces(p_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_lignes jsonb;
begin
  if not public.est_admin_mfa() then
    raise exception 'administrateur avec double authentification requis' using errcode = '42501';
  end if;

  select s.lignes into v_lignes from public.acces_sauvegardes s where s.id = p_id;
  if v_lignes is null then
    raise exception 'sauvegarde % introuvable', p_id using errcode = 'P0002';
  end if;

  return public._sti_reinserer_acces(v_lignes);
end;
$$;

revoke all on function public.admin_reimporter_sauvegarde_acces(bigint) from public;
grant execute on function public.admin_reimporter_sauvegarde_acces(bigint) to authenticated;

-- ---------------------------------------------------------------------
-- Contrôle final : les quatre portes publiques existent.
-- ---------------------------------------------------------------------
do $$
declare
  v_nb integer;
begin
  select count(*) into v_nb
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.proname in (
       'admin_sauvegarder_acces',
       'admin_lister_sauvegardes_acces',
       'admin_reimporter_acces',
       'admin_reimporter_sauvegarde_acces'
     );
  if v_nb < 4 then
    raise exception 'migration v582 incomplète : % fonction(s) sur 4', v_nb;
  end if;
end;
$$;
