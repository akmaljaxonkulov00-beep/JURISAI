-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: 20261026_multiplayer_virtual_court.sql
-- JURISTIV: Multiplayer Virtual Courtroom System
-- O'zbekiston protsessual qonunchiligi asosidagi ko'p foydalanuvchili sud
-- ═══════════════════════════════════════════════════════════════════════════

-- 1) MULTIPLAYER XONALARI (court_multiplayer_rooms)
CREATE TABLE IF NOT EXISTS public.court_multiplayer_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(16) UNIQUE NOT NULL,
  title TEXT NOT NULL,
  case_category TEXT NOT NULL DEFAULT 'criminal', -- 'criminal', 'civil', 'labor', 'administrative', 'economic'
  court_type TEXT NOT NULL DEFAULT 'Jinoyat ishlari bo‘yicha sud',
  scenario_id TEXT,
  scenario_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  host_id TEXT NOT NULL,
  host_name TEXT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT true,
  ai_enabled BOOLEAN NOT NULL DEFAULT false,
  voice_enabled BOOLEAN NOT NULL DEFAULT true,
  max_participants INTEGER NOT NULL DEFAULT 8,
  status TEXT NOT NULL DEFAULT 'waiting', -- 'waiting', 'in_progress', 'completed', 'cancelled'
  current_stage_id TEXT NOT NULL DEFAULT 'open_hearing',
  current_stage_order INTEGER NOT NULL DEFAULT 1,
  current_speaker_id TEXT,
  current_speaker_role TEXT,
  speaking_queue JSONB NOT NULL DEFAULT '[]'::jsonb,
  pending_objection JSONB DEFAULT NULL,
  verdict_data JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2) ISHTIROKCHILAR (court_multiplayer_participants)
CREATE TABLE IF NOT EXISTS public.court_multiplayer_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.court_multiplayer_rooms(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  avatar_url TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'KUZATUVCHI',
  is_host BOOLEAN NOT NULL DEFAULT false,
  is_ai BOOLEAN NOT NULL DEFAULT false,
  is_ready BOOLEAN NOT NULL DEFAULT false,
  can_speak BOOLEAN NOT NULL DEFAULT false,
  connection_status TEXT NOT NULL DEFAULT 'online', -- 'online', 'idle', 'disconnected'
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- 3) SUD PROTOKOLI VA CHAT XABARLARI (court_multiplayer_messages)
CREATE TABLE IF NOT EXISTS public.court_multiplayer_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.court_multiplayer_rooms(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'KUZATUVCHI',
  message_type TEXT NOT NULL DEFAULT 'speech', -- 'speech', 'procedural', 'objection', 'ruling', 'system', 'verdict'
  content TEXT NOT NULL,
  stage_id TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4) SUD DALILLARI (court_multiplayer_evidence)
CREATE TABLE IF NOT EXISTS public.court_multiplayer_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.court_multiplayer_rooms(id) ON DELETE CASCADE,
  submitted_by_id TEXT NOT NULL,
  submitted_by_name TEXT NOT NULL,
  submitted_by_role TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'document',
  description TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  file_url TEXT DEFAULT '',
  reference_number TEXT DEFAULT '',
  visibility TEXT NOT NULL DEFAULT 'public', -- 'public', 'prosecution_only', 'defense_only', 'court_only'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'admitted', 'rejected'
  judge_decision_reason TEXT DEFAULT '',
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5) VOQEALAR JURNALI (court_multiplayer_events)
CREATE TABLE IF NOT EXISTS public.court_multiplayer_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.court_multiplayer_rooms(id) ON DELETE CASCADE,
  stage_id TEXT NOT NULL DEFAULT '',
  event_type TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  details TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_multiplayer_rooms_code ON public.court_multiplayer_rooms(code);
CREATE INDEX IF NOT EXISTS idx_multiplayer_rooms_status ON public.court_multiplayer_rooms(status, is_public);
CREATE INDEX IF NOT EXISTS idx_multiplayer_participants_room ON public.court_multiplayer_participants(room_id, user_id);
CREATE INDEX IF NOT EXISTS idx_multiplayer_messages_room_time ON public.court_multiplayer_messages(room_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_multiplayer_evidence_room ON public.court_multiplayer_evidence(room_id, status);
CREATE INDEX IF NOT EXISTS idx_multiplayer_events_room ON public.court_multiplayer_events(room_id, created_at ASC);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.court_multiplayer_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.court_multiplayer_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.court_multiplayer_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.court_multiplayer_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.court_multiplayer_events ENABLE ROW LEVEL SECURITY;

-- POLICIES
DROP POLICY IF EXISTS mp_rooms_read ON public.court_multiplayer_rooms;
CREATE POLICY mp_rooms_read ON public.court_multiplayer_rooms
  FOR SELECT USING (true);

DROP POLICY IF EXISTS mp_participants_read ON public.court_multiplayer_participants;
CREATE POLICY mp_participants_read ON public.court_multiplayer_participants
  FOR SELECT USING (true);

DROP POLICY IF EXISTS mp_messages_read ON public.court_multiplayer_messages;
CREATE POLICY mp_messages_read ON public.court_multiplayer_messages
  FOR SELECT USING (true);

DROP POLICY IF EXISTS mp_evidence_read ON public.court_multiplayer_evidence;
CREATE POLICY mp_evidence_read ON public.court_multiplayer_evidence
  FOR SELECT USING (true);

DROP POLICY IF EXISTS mp_events_read ON public.court_multiplayer_events;
CREATE POLICY mp_events_read ON public.court_multiplayer_events
  FOR SELECT USING (true);

-- Service role bypasses all RLS by default
