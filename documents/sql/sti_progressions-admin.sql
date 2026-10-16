-- ════════════════════════════════════════════════════════════════════
-- STI By AE — Analytique enseignant (point 2) : lecture admin globale
-- À exécuter UNE FOIS dans Supabase (SQL Editor), APRÈS sti_progressions.sql.
-- Autorise uniquement le compte admin à LIRE toutes les progressions
-- (les élèves continuent de ne voir que la leur).
-- ════════════════════════════════════════════════════════════════════
drop policy if exists "admin lit tout" on public.sti_progressions;
create policy "admin lit tout" on public.sti_progressions
  for select using ( (auth.jwt() ->> 'email') = 'aymenessouyah@gmail.com' );
