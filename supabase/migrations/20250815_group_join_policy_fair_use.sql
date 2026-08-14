-- ═══════════════════════════════════════════════════════════════════════════
-- 20250815_group_join_policy_fair_use.sql
--
-- 1. Guruhga qo'shilish rejimlari (3 tur):
--    - Ommaviy        : is_private=false, join_approval=false → darhol qo'shiladi
--    - Ommaviy+tasdiq : is_private=false, join_approval=true  → ko'rinadi, lekin
--                        yaratuvchi/moderator tasdig'i bilan qo'shiladi
--    - Maxfiy         : is_private=true  → faqat a'zolar ko'radi, taklif kodi/so'rov
--
-- 2. Pro tarif uchun "adolatli ishlatish" (fair use) chegaralari:
--    site_settings.fair_use_limits JSONB — Pro (cheksiz) funksiyalar uchun
--    oylik yuqori chegara. UI'da "cheksiz" ko'rinadi, backend esa suiste'moldan
--    himoya qiladi.
--
-- Idempotent: qayta run qilinsa ham xavfsiz.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Guruhga qo'shilish rejimi ─────────────────────────────────────────
ALTER TABLE public.community_groups
ADD COLUMN IF NOT EXISTS join_approval BOOLEAN NOT NULL DEFAULT FALSE;

-- ── 2. Pro fair-use chegaralari ──────────────────────────────────────────
ALTER TABLE public.site_settings
ADD COLUMN IF NOT EXISTS fair_use_limits JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Standart fair-use qiymatlari (agar bo'sh bo'lsa)
UPDATE public.site_settings
SET fair_use_limits = '{
  "ai_chat": 2000,
  "irac": 500,
  "document_generate": 300,
  "document_analysis": 300,
  "virtual_court": 100,
  "decision_tree": 300,
  "speech_stt": 500,
  "scenario": 200
}'::jsonb
WHERE id = 'global' AND (fair_use_limits = '{}'::jsonb OR fair_use_limits IS NULL);
