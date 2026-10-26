-- STI v2.0 — v475 (sti-atelier-v335) : Index B-tree d'accélération de navigation & Temps réel
-- Élimine les Seq Scan (205–1879 ms -> ~1 ms) sur public.acces (LIKE 'COFFRE_TP%', 'FLASH_Q:%',
-- 'COP_NOTE:%', 'MSG_PROF:%', égalités page='CFG_*', historique par élève) et sur public.labo_device_sessions.

CREATE INDEX IF NOT EXISTS idx_acces_page_debut
  ON public.acces USING btree (page, debut DESC);

CREATE INDEX IF NOT EXISTS idx_acces_page_pattern_debut
  ON public.acces USING btree (page text_pattern_ops, debut DESC);

CREATE INDEX IF NOT EXISTS idx_acces_user_debut_desc
  ON public.acces USING btree (user_id, debut DESC);

CREATE INDEX IF NOT EXISTS idx_labo_device_sessions_device_id
  ON public.labo_device_sessions USING btree (device_id);
