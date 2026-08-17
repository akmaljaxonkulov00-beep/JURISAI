-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: 20250820_allow_super_admin_role.sql
--
-- Muammo: registered_users_role_check constraint (20250729 da yaratilgan)
-- faqat ('USER', 'ADMIN', 'admin', 'user', 'lawyer') qiymatlarini qabul qiladi.
-- Kod esa SUPER_ADMIN rolini ishlatadi (admin/users route: ALLOWED_ROLES).
--
-- Yechim: constraint'ni yangilab SUPER_ADMIN ni qo'shish va adminni
-- SUPER_ADMIN qilish. Jonli bazada faqat USER/ADMIN (katta harf) bor — xavfsiz.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1) Eski constraint'ni o'chirish
ALTER TABLE public.registered_users DROP CONSTRAINT IF EXISTS registered_users_role_check;

-- 2) Yangi constraint — SUPER_ADMIN qo'shilgan
ALTER TABLE public.registered_users
  ADD CONSTRAINT registered_users_role_check
  CHECK (role IN ('USER', 'ADMIN', 'SUPER_ADMIN'));

-- 3) Adminni SUPER_ADMIN qilish (email kerak bo'lsa o'zgartiring)
UPDATE public.registered_users
SET role = 'SUPER_ADMIN'
WHERE email = 'akmaljaxonkulov00@gmail.com';

-- 4) Tekshirish
SELECT email, role FROM public.registered_users ORDER BY created_at;
