-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: 20250819_court_scenario_irac.sql
-- Virtual sud (court), Senariy generator, IRAC/Case solver — real persistence.
--
-- Har bir jadval faqat egasiga tegishli (RLS: auth.uid() = user_id).
-- scenario_templates — umumiy kontent (o'qish hammaga ochiq, yozish yo'q).
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- 1) COURT SESSIONS — Virtual sud sessiyalari
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.court_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  case_details TEXT DEFAULT '',
  user_role TEXT DEFAULT 'SUDYA',
  status TEXT DEFAULT 'active',
  score INTEGER,
  outcome TEXT,
  evaluation JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.court_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS court_sessions_select ON public.court_sessions;
CREATE POLICY court_sessions_select ON public.court_sessions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS court_sessions_insert ON public.court_sessions;
CREATE POLICY court_sessions_insert ON public.court_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS court_sessions_update ON public.court_sessions;
CREATE POLICY court_sessions_update ON public.court_sessions
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS court_sessions_delete ON public.court_sessions;
CREATE POLICY court_sessions_delete ON public.court_sessions
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_court_sessions_user
  ON public.court_sessions(user_id, updated_at DESC);

-- ───────────────────────────────────────────────────────────────────────────
-- 2) COURT MESSAGES — sessiya ichidagi har bir qatnashchi xabari
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.court_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.court_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  speaker TEXT DEFAULT '',
  role TEXT DEFAULT '',
  content TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.court_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS court_messages_select ON public.court_messages;
CREATE POLICY court_messages_select ON public.court_messages
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS court_messages_insert ON public.court_messages;
CREATE POLICY court_messages_insert ON public.court_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_court_messages_session
  ON public.court_messages(session_id, created_at ASC);

-- ───────────────────────────────────────────────────────────────────────────
-- 3) SCENARIOS — foydalanuvchi yaratgan senariylar
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  scenario_type TEXT DEFAULT 'civil',
  difficulty_level TEXT DEFAULT 'intermediate',
  complexity TEXT DEFAULT 'standard',
  description TEXT DEFAULT '',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS scenarios_select ON public.scenarios;
CREATE POLICY scenarios_select ON public.scenarios
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS scenarios_insert ON public.scenarios;
CREATE POLICY scenarios_insert ON public.scenarios
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS scenarios_delete ON public.scenarios;
CREATE POLICY scenarios_delete ON public.scenarios
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_scenarios_user
  ON public.scenarios(user_id, created_at DESC);

-- ───────────────────────────────────────────────────────────────────────────
-- 4) IRAC ANALYSES — Case solver / IRAC tahlil natijalari
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.irac_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_title TEXT NOT NULL DEFAULT '',
  case_category TEXT DEFAULT 'general',
  case_difficulty TEXT DEFAULT 'medium',
  irac_analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_score INTEGER,
  grade TEXT,
  feedback TEXT DEFAULT '',
  suggestions JSONB DEFAULT '[]'::jsonb,
  strengths JSONB DEFAULT '[]'::jsonb,
  weaknesses JSONB DEFAULT '[]'::jsonb,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.irac_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS irac_analyses_select ON public.irac_analyses;
CREATE POLICY irac_analyses_select ON public.irac_analyses
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS irac_analyses_insert ON public.irac_analyses;
CREATE POLICY irac_analyses_insert ON public.irac_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS irac_analyses_delete ON public.irac_analyses;
CREATE POLICY irac_analyses_delete ON public.irac_analyses
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_irac_analyses_user
  ON public.irac_analyses(user_id, created_at DESC);

-- ───────────────────────────────────────────────────────────────────────────
-- 5) SCENARIO TEMPLATES — umumiy shablonlar (o'qish ochiq, yozish yo'q)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.scenario_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  scenario_type TEXT DEFAULT 'civil',
  difficulty_level TEXT DEFAULT 'medium',
  description TEXT DEFAULT '',
  structure JSONB NOT NULL DEFAULT '{}'::jsonb,
  duration_minutes INTEGER DEFAULT 45,
  participants_count INTEGER DEFAULT 3,
  key_elements JSONB DEFAULT '[]'::jsonb,
  learning_objectives JSONB DEFAULT '[]'::jsonb,
  evaluation_criteria JSONB DEFAULT '[]'::jsonb,
  materials_needed JSONB DEFAULT '[]'::jsonb,
  usage_count INTEGER DEFAULT 0,
  rating NUMERIC(3,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.scenario_templates ENABLE ROW LEVEL SECURITY;

-- Shablonlar umumiy kontent — barcha (anon + auth) o'qiy oladi
DROP POLICY IF EXISTS scenario_templates_select ON public.scenario_templates;
CREATE POLICY scenario_templates_select ON public.scenario_templates
  FOR SELECT USING (true);

-- ───────────────────────────────────────────────────────────────────────────
-- SEED: 5 ta asosiy shablon (avvalgi mock kontent → real DB)
-- ───────────────────────────────────────────────────────────────────────────
INSERT INTO public.scenario_templates (name, scenario_type, difficulty_level, description, structure, duration_minutes, participants_count, key_elements, learning_objectives, evaluation_criteria, materials_needed)
VALUES
(
  'Tijorat shartnomasi nizosi',
  'civil',
  'medium',
  'Tijorat shartnomasi buzilishi bo''yicha nizolarni hal qilish uchun senariy shabloni',
  '{"introduction":"Nizoning mohiyati va tarixi","parties":"Tomonlar va ularning huquqiy holati","facts":"Nizoga olib kelgan faktik holatlar","legal_issues":"Asosiy huquqiy masalalar","evidence":"Dalillar va guvohliklar","arguments":"Tomonlar argumentlari","resolution":"Nizoni hal etish yo''llari","conclusion":"Xulosa va tavsiyalar"}'::jsonb,
  45, 4,
  '["Shartnoma shartlari","Majburiyatlar buzilishi","Zararni hisoblash","Qonuniy asoslar"]'::jsonb,
  '["Fuqarolik huquqini o''rganish","Shartnoma huquqini tushunish","Dalillar bilan ishlash","Argumentatsiya ko''nikmalari"]'::jsonb,
  '[{"criterion":"Huquqiy bilimlar","weight":0.3,"description":"Qonun hujjatlarini to''g''ri qo''llash"},{"criterion":"Argumentatsiya","weight":0.25,"description":"Mantiqiy va dalilli argumentlar"},{"criterion":"Dalillar bilan ishlash","weight":0.25,"description":"Dalillarni to''g''ri yig''ish va taqdim etish"},{"criterion":"Strategik tafakkur","weight":0.2,"description":"Optimal yo''nalishni tanlash"}]'::jsonb,
  '["Fuqarolik kodeksi","Shartnoma namunalari","Dalillar to''plami","Ekspert xulosalari namunalari"]'::jsonb
),
(
  'Ish haqi nizosi',
  'labor',
  'easy',
  'Ish haqi to''lanmaganligi bo''yicha nizolarni hal qilish uchun senariy shabloni',
  '{"introduction":"Ish munosabatlari tarixi","employer":"Ish beruvchi haqida ma''lumot","employee":"Ishchi haqida ma''lumot","violations":"Ish haqi buzilishi holatlari","calculations":"Qarz miqdorini hisoblash","legal_basis":"Mehnat kodeksiga asos","resolution":"Nizoni hal etish yo''llari","conclusion":"Xulosa"}'::jsonb,
  30, 3,
  '["Ish haqi to''lanmaganligi","Ish vaqti hisobi","Kompensatsiya miqdori","Mehnat inspektsiyasi"]'::jsonb,
  '["Mehnat huquqini o''rganish","Ish haqi hisoblash","Kompensatsiya turlari","Mehnat nizolarini hal qilish"]'::jsonb,
  '[{"criterion":"Mehnat huquqi bilimlari","weight":0.35,"description":"Mehnat kodeksini qo''llash"},{"criterion":"Hisoblash aniqligi","weight":0.3,"description":"Ish haqi va kompensatsiyani to''g''ri hisoblash"},{"criterion":"Dalillar","weight":0.25,"description":"Ish jadvali va to''lov hujjatlari"},{"criterion":"Yechim takliflari","weight":0.1,"description":"Samimiy va qonuniy yechimlar"}]'::jsonb,
  '["Mehnat kodeksi","Ish jadvali namunalari","Ish haqi hisoblash formulalari","Kompensatsiya jadvallari"]'::jsonb
),
(
  'Oilaviy mulk bo''linishi',
  'family',
  'hard',
  'Ajralish paytida umumiy mulkning bo''linishi bo''yicha murakkab senariy',
  '{"introduction":"Oilaviy holat tarixi","marriage":"Nikoh va oila tarixi","assets":"Umumiy mulk ro''yxati","children":"Farzandlar va vosa huquqi","division":"Mulk bo''linishi tamoyillari","disputes":"Nizoli masalalar","resolution":"Tinchlik yo''li bilan hal etish","litigation":"Sud jarayoni","conclusion":"Xulosa"}'::jsonb,
  60, 4,
  '["Nikohning buzilishi","Umumiy mulk turi","Mulkning qimmati","Vosa huquqi","Aliment majburiyatlari"]'::jsonb,
  '["Oilaviy huquqni chuqur o''rganish","Mulk bo''linishi qoidalari","Vosa huquqi asoslari","Xalqaro oilaviy huquq"]'::jsonb,
  '[{"criterion":"Oilaviy huquq bilimlari","weight":0.3,"description":"Oila kodeksini qo''llash"},{"criterion":"Mulk baholash","weight":0.25,"description":"Mulkning qimmatini to''g''ri baholash"},{"criterion":"Vosa huquqi","weight":0.25,"description":"Farzandlar manfaatini himoya qilish"},{"criterion":"Tuzatish qobiliyati","weight":0.2,"description":"Murakkab vaziyatlarni hal qilish"}]'::jsonb,
  '["Oila kodeksi","Mulk baholash usullari","Vosa huquqi qoidalari","Xalqaro konvensiyalar"]'::jsonb
),
(
  'Jinoyat tergovi',
  'criminal',
  'medium',
  'Jinoyat ishi bo''yicha tergov jarayonini o''rganish uchun senariy',
  '{"introduction":"Jinoyat holati","crime":"Jinoyat tarkibi va turlari","suspect":"Ayblanuvchi haqida","evidence":"Dalillar va guvohlar","investigation":"Tergov harakatlari","legal_procedure":"Protsessual qoidalar","trial":"Sud jarayoni","verdict":"Qaror va jazo","conclusion":"Xulosa"}'::jsonb,
  50, 4,
  '["Jinoyat tarkibi","Dalillar to''plami","Tergov harakatlari","Protsessual qoidalar","Jazo miqdori"]'::jsonb,
  '["Jinoyat huquqini o''rganish","Tergov usullarini tushunish","Protsessual qoidalarni qo''llash","Jazo turlarini bilish"]'::jsonb,
  '[{"criterion":"Jinoyat huquqi bilimlari","weight":0.35,"description":"Jinoyat kodeksini qo''llash"},{"criterion":"Tergov mahorati","weight":0.25,"description":"Dalillarni to''plash va tahlil qilish"},{"criterion":"Protsessual rioya qilish","weight":0.25,"description":"Protsessual qoidalarni bajarish"},{"criterion":"Tahlil chuqurligi","weight":0.15,"description":"Vaziyatni to''liq tahlil qilish"}]'::jsonb,
  '["Jinoyat kodeksi","Jinoyat-protsessual kodeksi","Tergov qoidalari","Dalillar to''plami namunalari"]'::jsonb
),
(
  'Ijaraga olish nizosi',
  'property',
  'easy',
  'Ijaraga olingan mulk bo''yicha nizolarni hal qilish uchun senariy',
  '{"introduction":"Ijaraga olish shartnomasi","property":"Ijaraga olingan mulk xususiyatlari","landlord":"Ijaraga beruvchi","tenant":"Ijaraga oluvchi","contract":"Shartnoma shartlari","violations":"Buzilish holatlari","damages":"Zarar va yo''qotishlar","resolution":"Nizoni hal etish","conclusion":"Xulosa"}'::jsonb,
  35, 3,
  '["Ijaraga olish shartnomasi","Ijara to''lovi","Mulk sifati","Garantiya majburiyatlari","Shartnomani bekor qilish"]'::jsonb,
  '["Ijaraga olish huquqini o''rganish","Shartnoma huquqini qo''llash","Mulk sifatini baholash","Kompensatsiya hisobi"]'::jsonb,
  '[{"criterion":"Ijaraga olish huquqi","weight":0.3,"description":"Ijaraga olish qoidalarini bilish"},{"criterion":"Shartnoma tahlili","weight":0.3,"description":"Shartnoma shartlarini tushunish"},{"criterion":"Hisoblash aniqligi","weight":0.25,"description":"Zarar va kompensatsiyani hisoblash"},{"criterion":"Yechim samaradorligi","weight":0.15,"description":"Amaliy yechimlar taklif etish"}]'::jsonb,
  '["Fuqarolik kodeksi","Ijaraga olish shartnomalari","Mulk baholash usullari","Kompensatsiya hisob formulalari"]'::jsonb
)
ON CONFLICT DO NOTHING;
