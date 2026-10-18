-- STI v302 — tests automatisés RLS/MFA
-- À exécuter dans l’éditeur SQL Supabase APRÈS 20261018_mobile_security.sql.
-- Tout est inclus dans une transaction annulée à la fin : aucune donnée n’est conservée.

begin;

create or replace function pg_temp.sti_assert(ok boolean, libelle text) returns void
language plpgsql as $$
begin
  if not coalesce(ok, false) then
    raise exception 'ECHEC RLS v302 : %', libelle;
  end if;
end $$;

-- Tables et index indispensables.
select pg_temp.sti_assert(
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='updated_at'),
  'profiles.updated_at absent'
);
select pg_temp.sti_assert(
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='acces' and column_name='client_event_id'),
  'acces.client_event_id absent'
);
select pg_temp.sti_assert(
  exists(select 1 from pg_indexes where schemaname='public' and tablename='acces' and indexname='uq_acces_user_client_event' and indexdef ilike '%unique%'),
  'index idempotent acces absent'
);

-- Les lectures globales restent réservées à est_admin(), les écritures sensibles exigent est_admin_mfa().
select pg_temp.sti_assert(
  exists(select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='prof_sel' and qual ilike '%est_admin%'),
  'lecture globale des profils non protégée par est_admin'
);
select pg_temp.sti_assert(
  exists(select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='prof_upd_admin' and coalesce(qual,'') ilike '%est_admin_mfa%'),
  'modification des profils non protégée par AAL2'
);
select pg_temp.sti_assert(
  exists(select 1 from pg_policies where schemaname='public' and tablename='acces' and policyname='acces_ins_self' and coalesce(with_check,'') ilike '%auth.uid%'),
  'insertion acces non limitée au propriétaire'
);
select pg_temp.sti_assert(
  exists(select 1 from pg_policies where schemaname='public' and tablename='acces' and policyname='acces_del_admin' and coalesce(qual,'') ilike '%est_admin_mfa%'),
  'suppression acces non protégée par AAL2'
);
select pg_temp.sti_assert(
  exists(select 1 from pg_policies where schemaname='public' and tablename='app_config_public' and policyname='app_config_public_read'),
  'lecture de configuration publique absente'
);
select pg_temp.sti_assert(
  exists(select 1 from pg_policies where schemaname='public' and tablename='app_config_public' and policyname='app_config_public_admin_write' and coalesce(qual,'') ilike '%est_admin_mfa%'),
  'écriture de configuration non protégée par AAL2'
);
select pg_temp.sti_assert(
  exists(select 1 from pg_policies where schemaname='public' and tablename='badges_labo' and policyname='badges_labo_admin_all' and coalesce(qual,'') ilike '%est_admin_mfa%'),
  'codes Badge non protégés par AAL2'
);

-- Vérification comportementale du claim Supabase aal.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000001","email":"aymenessouyah@gmail.com","role":"authenticated","aal":"aal1"}', true);
select pg_temp.sti_assert(public.est_admin(), 'administrateur AAL1 non reconnu');
select pg_temp.sti_assert(not public.est_admin_mfa(), 'AAL1 accepté à tort pour une opération sensible');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000001","email":"aymenessouyah@gmail.com","role":"authenticated","aal":"aal2"}', true);
select pg_temp.sti_assert(public.est_admin_mfa(), 'administrateur AAL2 refusé');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000002","email":"candidat@example.tn","role":"authenticated","aal":"aal2"}', true);
select pg_temp.sti_assert(not public.est_admin(), 'un candidat est reconnu administrateur');
select pg_temp.sti_assert(not public.est_admin_mfa(), 'un candidat AAL2 obtient les droits administrateur');

-- Realtime doit publier les deux tables différentielles.
select pg_temp.sti_assert(
  exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='profiles'),
  'profiles absent de supabase_realtime'
);
select pg_temp.sti_assert(
  exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='acces'),
  'acces absent de supabase_realtime'
);

select 'OK — politiques RLS v302, idempotence, Realtime et MFA/AAL2 validés' as resultat;
rollback;
