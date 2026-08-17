-- ═══════════════════════════════════════════════════════════════════════════
-- LEGAL BOOKMARKS — 2025-08-17
--
-- Qonunlar bazasi xatcho'plari — yagona Supabase tizimi (localStorage emas).
-- Har bir foydalanuvchi faqat O'Z xatcho'plarini ko'radi/boshqaradi (RLS).
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.legal_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, document_id)
);

-- Indeks: foydalanuvchi xatcho'plarini tez olish
CREATE INDEX IF NOT EXISTS idx_legal_bookmarks_user ON public.legal_bookmarks (user_id);

ALTER TABLE public.legal_bookmarks ENABLE ROW LEVEL SECURITY;

-- Faqat egasi: o'z xatcho'plarini o'qiy oladi
DROP POLICY IF EXISTS "legal_bookmarks_select_own" ON public.legal_bookmarks;
CREATE POLICY "legal_bookmarks_select_own" ON public.legal_bookmarks
  FOR SELECT USING (auth.uid() = user_id);

-- Faqat egasi: o'ziga xatcho'p qo'sha oladi
DROP POLICY IF EXISTS "legal_bookmarks_insert_own" ON public.legal_bookmarks;
CREATE POLICY "legal_bookmarks_insert_own" ON public.legal_bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Faqat egasi: o'z xatcho'pini o'chira oladi
DROP POLICY IF EXISTS "legal_bookmarks_delete_own" ON public.legal_bookmarks;
CREATE POLICY "legal_bookmarks_delete_own" ON public.legal_bookmarks
  FOR DELETE USING (auth.uid() = user_id);
