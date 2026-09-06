-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: 20260905_virtual_court_production.sql
-- JURISTIV: Virtual Sud Simulyatori (Production Schema)
-- ═══════════════════════════════════════════════════════════════════════════

-- 1) COURT SCENARIOS JADVALI (Ishlar bazasi)
CREATE TABLE IF NOT EXISTS public.court_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'criminal', -- 'criminal', 'civil', 'administrative', 'labor', 'family', 'economic'
  procedure_type TEXT NOT NULL DEFAULT 'trial', -- 'trial', 'negotiation', 'investigation'
  difficulty TEXT NOT NULL DEFAULT 'medium', -- 'easy', 'medium', 'hard'
  facts TEXT NOT NULL DEFAULT '',
  legal_basis JSONB NOT NULL DEFAULT '[]'::jsonb,
  participants JSONB NOT NULL DEFAULT '[]'::jsonb,
  stages JSONB NOT NULL DEFAULT '[]'::jsonb,
  evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
  expected_outcome TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.court_scenarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS court_scenarios_select ON public.court_scenarios;
CREATE POLICY court_scenarios_select ON public.court_scenarios
  FOR SELECT USING (active = true OR auth.role() = 'service_role');

DROP POLICY IF EXISTS court_scenarios_admin_all ON public.court_scenarios;
CREATE POLICY court_scenarios_admin_all ON public.court_scenarios
  FOR ALL USING (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM public.registered_users
      WHERE registered_users.id = auth.uid()
      AND UPPER(registered_users.role) IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

CREATE INDEX IF NOT EXISTS idx_court_scenarios_filter
  ON public.court_scenarios(category, procedure_type, difficulty, active);

-- 2) COURT SESSIONS INDEXLAR VA XAVFSIZLIK
CREATE INDEX IF NOT EXISTS idx_court_sessions_user_status
  ON public.court_sessions(user_id, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_court_messages_session_time
  ON public.court_messages(session_id, created_at ASC);
