-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: 20261121_virtual_court_enterprise_rebuild.sql
-- JURISTIV: Enterprise-Grade Virtual Courtroom & Multiplayer State Architecture
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Upgrade court_multiplayer_rooms with authoritative lifecycle & audit columns
ALTER TABLE public.court_multiplayer_rooms
  ADD COLUMN IF NOT EXISTS creator_id TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '2 hours'),
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{
    "allow_guests": true,
    "require_approval": false,
    "ai_assistant_enabled": true,
    "strict_procedural_rules": true
  }'::jsonb;

-- Ensure status values include enterprise lifecycle
-- 'waiting', 'ready', 'in_progress', 'paused', 'completed', 'cancelled', 'expired', 'abandoned'
DO $$
BEGIN
  -- Update legacy status if needed
  UPDATE public.court_multiplayer_rooms
  SET status = 'expired'
  WHERE status = 'waiting' AND created_at < (NOW() - INTERVAL '3 hours');
  
  UPDATE public.court_multiplayer_rooms
  SET status = 'abandoned'
  WHERE status = 'in_progress' AND updated_at < (NOW() - INTERVAL '5 hours');
END $$;

-- 2. DEDICATED SPEAKING QUEUE TABLE
CREATE TABLE IF NOT EXISTS public.court_speaking_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.court_multiplayer_rooms(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  role TEXT NOT NULL,
  request_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'finished'
  queue_position INTEGER NOT NULL DEFAULT 1,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ
);

-- 3. DEDICATED PROCEDURAL OBJECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.court_objections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.court_multiplayer_rooms(id) ON DELETE CASCADE,
  session_id TEXT,
  stage_id TEXT NOT NULL,
  raised_by_id TEXT NOT NULL,
  raised_by_name TEXT NOT NULL,
  raised_by_role TEXT NOT NULL,
  target_role TEXT,
  objection_type TEXT NOT NULL, -- 'asossiz_vaj', 'tartib_buzilishi', 'chalg‘itish', 'noqonuniy_dalil', 'aloqasiz'
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sustained', 'overruled'
  judge_decision_reason TEXT,
  resolved_by_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- 4. DEDICATED LIVE TRANSCRIPTS TABLE
CREATE TABLE IF NOT EXISTS public.court_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.court_multiplayer_rooms(id) ON DELETE CASCADE,
  session_id TEXT,
  stage_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  speaker_name TEXT NOT NULL,
  speaker_role TEXT NOT NULL,
  content TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'uz',
  source TEXT NOT NULL DEFAULT 'voice_stt', -- 'voice_stt', 'manual_text', 'system'
  timestamp_offset_ms INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. VERDICTS AND JUDICIAL RULINGS
CREATE TABLE IF NOT EXISTS public.court_verdicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.court_multiplayer_rooms(id) ON DELETE CASCADE,
  session_id TEXT,
  judge_id TEXT NOT NULL,
  judge_name TEXT NOT NULL,
  verdict_decision TEXT NOT NULL, -- 'aybdor', 'aybsiz', 'qanoatlantirildi', 'rad_etildi', 'qisman'
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  legal_reasoning TEXT NOT NULL,
  penalty_or_remedy TEXT NOT NULL,
  scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. PARTICIPANT EVALUATIONS & AI SCORING
CREATE TABLE IF NOT EXISTS public.court_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.court_multiplayer_rooms(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  role TEXT NOT NULL,
  legal_reasoning_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
  procedural_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
  argument_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
  evidence_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
  communication_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
  overall_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
  procedural_grade TEXT NOT NULL DEFAULT 'Qoniqarli',
  feedback TEXT NOT NULL DEFAULT '',
  mistakes JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_articles JSONB NOT NULL DEFAULT '[]'::jsonb,
  xp_awarded INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- 7. AUDIT LOGS FOR IRREVERSIBLE PROCEDURAL ACTIONS
CREATE TABLE IF NOT EXISTS public.court_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.court_multiplayer_rooms(id) ON DELETE CASCADE,
  actor_id TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  previous_state JSONB,
  new_state JSONB,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. COMPREHENSIVE PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_court_rooms_active_lookup
  ON public.court_multiplayer_rooms(status, is_public, last_activity_at DESC);

CREATE INDEX IF NOT EXISTS idx_court_rooms_cleanup
  ON public.court_multiplayer_rooms(status, created_at, last_activity_at);

CREATE INDEX IF NOT EXISTS idx_speaking_queue_room
  ON public.court_speaking_queue(room_id, request_status, queue_position ASC);

CREATE INDEX IF NOT EXISTS idx_court_objections_room
  ON public.court_objections(room_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_court_transcripts_room
  ON public.court_transcripts(room_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_court_evaluations_room_user
  ON public.court_evaluations(room_id, user_id);

CREATE INDEX IF NOT EXISTS idx_court_audit_room
  ON public.court_audit_logs(room_id, created_at DESC);

-- 9. AUTHORITATIVE CLEANUP FUNCTION (IDEMPOTENT WORKER)
CREATE OR REPLACE FUNCTION public.cleanup_expired_court_rooms()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_expired_count INTEGER := 0;
  v_abandoned_count INTEGER := 0;
BEGIN
  -- Mark stale waiting rooms as EXPIRED (e.g. older than 45 minutes with no start)
  UPDATE public.court_multiplayer_rooms
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'waiting'
    AND created_at < (NOW() - INTERVAL '45 minutes')
    AND (
      last_activity_at IS NULL 
      OR last_activity_at < (NOW() - INTERVAL '30 minutes')
    );
  GET DIAGNOSTICS v_expired_count = ROW_COUNT;

  -- Mark abandoned in_progress rooms (no heartbeat/activity for > 90 minutes)
  UPDATE public.court_multiplayer_rooms
  SET status = 'abandoned', updated_at = NOW()
  WHERE status = 'in_progress'
    AND updated_at < (NOW() - INTERVAL '90 minutes')
    AND (
      last_activity_at IS NULL 
      OR last_activity_at < (NOW() - INTERVAL '60 minutes')
    );
  GET DIAGNOSTICS v_abandoned_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'expired_rooms', v_expired_count,
    'abandoned_rooms', v_abandoned_count,
    'timestamp', NOW()
  );
END;
$$;

-- 10. ROW LEVEL SECURITY (RLS) FOR NEW TABLES
ALTER TABLE public.court_speaking_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.court_objections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.court_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.court_verdicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.court_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.court_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sq_read_all ON public.court_speaking_queue;
CREATE POLICY sq_read_all ON public.court_speaking_queue FOR SELECT USING (true);

DROP POLICY IF EXISTS obj_read_all ON public.court_objections;
CREATE POLICY obj_read_all ON public.court_objections FOR SELECT USING (true);

DROP POLICY IF EXISTS tr_read_all ON public.court_transcripts;
CREATE POLICY tr_read_all ON public.court_transcripts FOR SELECT USING (true);

DROP POLICY IF EXISTS ver_read_all ON public.court_verdicts;
CREATE POLICY ver_read_all ON public.court_verdicts FOR SELECT USING (true);

DROP POLICY IF EXISTS eval_read_all ON public.court_evaluations;
CREATE POLICY eval_read_all ON public.court_evaluations FOR SELECT USING (true);

DROP POLICY IF EXISTS audit_read_all ON public.court_audit_logs;
CREATE POLICY audit_read_all ON public.court_audit_logs FOR SELECT USING (true);
