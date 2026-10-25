-- =====================================================================
-- STI V2.0 — Migration v456 : Consolidation complète des Quiz (Lots A, B, C)
-- Idempotent : peut être relancé sans danger dans Supabase SQL Editor.
--
-- 1) sti_quiz_vus : politique DELETE (user_id = auth.uid() ou est_admin())
--    pour que « ↺ Réinitialiser un module épuisé » persiste entre appareils
--    et rechargements.
-- 2) sti_quiz_parties & sti_quiz_reponses : politiques DELETE réservées
--    strictement à l'administrateur (public.est_admin()) pour purger les
--    parties d'essai ou préparer une nouvelle année scolaire.
-- 3) sti_quiz_reponses : index chronologique cree_le DESC + contrainte
--    CHECK alignée sur les 5 quiz officiels.
-- =====================================================================

drop policy if exists sti_quiz_vus_suppression on public.sti_quiz_vus;
create policy sti_quiz_vus_suppression on public.sti_quiz_vus
  for delete to authenticated
  using (public.est_admin() or user_id = auth.uid());

grant delete on public.sti_quiz_vus to authenticated;

drop policy if exists sti_quiz_parties_suppression_admin on public.sti_quiz_parties;
create policy sti_quiz_parties_suppression_admin on public.sti_quiz_parties
  for delete to authenticated
  using (public.est_admin());

grant delete on public.sti_quiz_parties to authenticated;

drop policy if exists sti_quiz_reponses_suppression_admin on public.sti_quiz_reponses;
create policy sti_quiz_reponses_suppression_admin on public.sti_quiz_reponses
  for delete to authenticated
  using (public.est_admin());

grant delete on public.sti_quiz_reponses to authenticated;

create index if not exists sti_quiz_reponses_date_idx
  on public.sti_quiz_reponses (cree_le desc);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'sti_quiz_reponses_quiz_check'
      and conrelid = 'public.sti_quiz_reponses'::regclass
  ) then
    alter table public.sti_quiz_reponses
      add constraint sti_quiz_reponses_quiz_check
      check (quiz in ('html-css', 'javascript', 'sql', 'php', 'tableaux'));
  end if;
end $$;
