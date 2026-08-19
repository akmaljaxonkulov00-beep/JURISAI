-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: IRAC Kazuslar jadvali
-- Admin tomonidan qo'shilgan haqiqiy huquqiy kazuslar
-- ═══════════════════════════════════════════════════════════════════════════

-- Agar irac_cases VIEW bo'lsa, uni o'chirib JADVAL sifatida qayta yaratamiz
DROP VIEW IF EXISTS public.irac_cases CASCADE;

CREATE TABLE IF NOT EXISTS public.irac_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  law_references TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.irac_cases ENABLE ROW LEVEL SECURITY;

-- Ommaviy o'qish (foydalanuvchilar kazuslarni ko'rish uchun)
DROP POLICY IF EXISTS irac_cases_select_public ON public.irac_cases;
CREATE POLICY irac_cases_select_public ON public.irac_cases
  FOR SELECT USING (is_active = true OR public.is_admin());

-- Faqat admin yozishi/o'zgartirishi/o'chirishi mumkin
DROP POLICY IF EXISTS irac_cases_admin_all ON public.irac_cases;
CREATE POLICY irac_cases_admin_all ON public.irac_cases
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_irac_cases_category ON public.irac_cases(category);
CREATE INDEX IF NOT EXISTS idx_irac_cases_active ON public.irac_cases(is_active);

-- ═══════════════════════════════════════════════════════════════════════════
-- Boshlang'ich kazuslar (admin tomonidan boshqariladi, keyin o'chirilishi mumkin)
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO public.irac_cases (title, description, category, difficulty, law_references) VALUES
(
  'O''g''irlik ishi',
  '2024-yil 15-mart kuni soat 20:30 da, Toshkent shahri, Chilonzor tumani, "Mega Market" supermarketidan A.A. Karimov 10 million so''m naqd pulni o''g''irlab ketdi. U 2 kundan keyin qo''lga olindi va aybini tan oldi. Sudlanuvchining oldida jinoyat ishi ochildi.',
  'jinoyat',
  'easy',
  ARRAY['JK 169-modda', 'JK 47-modda']
),
(
  'Shartnoma buzilishi',
  '2024-yil 1-fevral kuni "BuildPro" qurilish kompaniyasi va "O''zbekiston Invest" o''rtasida qurilish shartnomasi tuzildi. Shartnoma bo''yicha "BuildPro" 6 oy ichida 5 qavatli uy qurishi kerak edi. 8 oy o''tganiga qaramay, qurilish hali yakunlanmagan. "O''zbekiston Invest" 50 million so''m zarar talab qilmoqda.',
  'fuqarolik',
  'medium',
  ARRAY['FK 345-modda', 'FK 395-modda', 'FK 396-modda']
),
(
  'Mehnat nizosi',
  'A.N. Karimov "TechSoft" kompaniyasida 3 yil ishlagan. 2024-yil 10-avgust kuni ish beruvchi uni ogohlantirmasdan ishdan bo''shatdi. Karimov mehnat shartnomasi buzilganini da''vo qilmoqda va kompensatsiya talab qilmoqda.',
  'mehnat',
  'medium',
  ARRAY['MK 100-modda', 'MK 161-modda', 'MK 168-modda']
),
(
  'Ajrashish va mulk taqsimoti',
  'B.A. Rashidov va N.A. Rashidova 2018-yildan beri turmush qurgan. Ularning 2 nafar farzandi bor. Rashidov 2024-yil iyul oyida ajralish uchun ariza berdi. Mulk taqsimoti va bolalar tarbiyasi masalasi sud ko''rib chiqmoqda.',
  'oila',
  'hard',
  ARRAY['OK 39-modda', 'OK 41-modda', 'OK 55-modda', 'OK 76-modda']
),
(
  'Firibgarlik ishi',
  '2024-yil aprel oyida B.T. Omonov "Invest Group" firibgarlik guruhiga 100 million so''m pul o''tkazdi. Guruh a''zolari pulni qaytarmay, yo''qolib ketdi. Omonov firibgarlik jinoyatida ayblanmoqda.',
  'jinoyat',
  'hard',
  ARRAY['JK 168-modda', 'JK 28-modda']
),
(
  'Meros nizosi',
  'V.B. Toshmatov vafot etgan. Uning 3 nafar farzandi merosni bo''lishda kelisha olmadi. Toshmatovning Toshkent shahridagi 3 xonali kvartirasi va 2 ta avtomobili bor. Farzandlardan biri boshqa shaharda yashaydi.',
  'fuqarolik',
  'medium',
  ARRAY['OK 1187-modda', 'OK 1192-modda', 'FK 1195-modda']
),
(
  'Ma''muriy huquqbuzarlik',
  'A.V. Petrov "Toshkent Transport" avtobusida chipta olmasdan yurdi. unga 10 baravar jarima qo''llanildi (100 000 so''m). Petrov jarimaning ortiqcha ekanligini da''vo qilmoqda.',
  'mamuriy',
  'easy',
  ARRAY['MJtK 145-modda', 'MJtK 146-modda']
),
(
  'Intellektual mulk huquqi',
  '"Digital Solutions" kompaniyasi o''zining dasturiy ta''minotini litsenziyasiz ishlatgan "StartUp Plus" kompaniyasiga qarshi da''vo arizasi bilan murojaat qildi. Zarar miqdori 200 million so''m deb baholandi.',
  'tijorat',
  'hard',
  ARRAY['FK 1082-modda', 'FK 1083-modda', 'FK 1084-modda']
)
ON CONFLICT DO NOTHING;
