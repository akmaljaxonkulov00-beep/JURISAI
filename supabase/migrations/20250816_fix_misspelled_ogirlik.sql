-- ═══════════════════════════════════════════════════════════════════════════
-- 20250816_fix_misspelled_ogirlik.sql
--
-- Muammo: Bazada "o'g'rilik" / "o'g'rilash" kabi tizimli imlo xatosi bor —
-- ikkinchi apostrofdan keyingi 'i' harfi tushib qolgan (to'g'risi:
-- "o'g'irlik" / "o'g'irlash", masalan JK 169-modda "O'g'rilik" bo'lib
-- qolgan).
--
-- Bu migratsiya faqat o'g'ir- o'zagidan yasalgan so'zlarni tuzatadi.
-- "o'g'ri" (o'g'ri, o'g'riga, o'g'rilarni) so'zi TO'G'RI yozilgani uchun
-- unga TEGILMAYDI — naqsh faqat 'ri' + (lik|lash|lagan|lab|ladi|lan|lovchi|ladilar)
-- ketma-ketligini qamrab oladi.
--
-- Idempotent: qayta run qilinsa ham xavfsiz (to'g'ri yozilgan so'zga tegmaydi).
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE public.articles
SET
  title = regexp_replace(
    title,
    '([oO])([''‘’ʻ])([gG])([''‘’ʻ])ri(lik|lash|lagan|lab|ladi|lan|lovchi|ladilar)',
    '\1\2\3\4ir\5',
    'gi'
  ),
  content = regexp_replace(
    content,
    '([oO])([''‘’ʻ])([gG])([''‘’ʻ])ri(lik|lash|lagan|lab|ladi|lan|lovchi|ladilar)',
    '\1\2\3\4ir\5',
    'gi'
  )
WHERE title ~ '([oO])[''‘’ʻ][gG][''‘’ʻ]ri'
   OR content ~ '([oO])[''‘’ʻ][gG][''‘’ʻ]ri';

-- Tekshiruv (0 qaytarishi kerak — qolgan noto'g'ri yozuv yo'q):
-- SELECT count(*) FROM public.articles
-- WHERE title ~ '([oO])[''‘’ʻ][gG][''‘’ʻ]ri' OR content ~ '([oO])[''‘’ʻ][gG][''‘’ʻ]ri';
