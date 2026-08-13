-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Lenta realtime + Maslahat so'rovlari boshqaruvi
-- 1) community_posts / community_comments realtime publikatsiyasiga qo'shiladi
--    (feed barcha qurilmalarda real vaqtda sinxron bo'ladi)
-- 2) community_consultations: admin javobi, ekspertga ulash, holat tarixi
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Feed realtime ──────────────────────────────────────────────────────
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.community_comments;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 2. Maslahat so'rovlari boshqaruvi ────────────────────────────────────
ALTER TABLE public.community_consultations
  ADD COLUMN IF NOT EXISTS admin_reply TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS reply_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS assigned_expert_id TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS status_history JSONB DEFAULT '[]'::jsonb;
