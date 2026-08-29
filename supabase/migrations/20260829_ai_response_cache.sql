-- MIGRATION: ai_response_cache — AI javoblarini 24 soat keshlab xarajatlarni tejash
CREATE TABLE IF NOT EXISTS public.ai_response_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_hash TEXT UNIQUE NOT NULL,
  prompt TEXT NOT NULL,
  system_prompt TEXT,
  response TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for prompt_hash lookups
CREATE INDEX IF NOT EXISTS idx_ai_response_cache_hash ON public.ai_response_cache(prompt_hash);

-- Enable RLS (Row Level Security)
ALTER TABLE public.ai_response_cache ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert/select (since API routes run on server side)
DROP POLICY IF EXISTS cache_all ON public.ai_response_cache;
CREATE POLICY cache_all ON public.ai_response_cache FOR ALL USING (true) WITH CHECK (true);
