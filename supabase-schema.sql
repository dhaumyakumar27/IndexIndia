-- ==============================================================================
-- IndexIndia: Supabase SQL Schema for Cross-Device Annotations & AI Doubt History
-- Run this in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Create table for user annotations (highlights, drawings, sticky notes, stickers)
CREATE TABLE IF NOT EXISTS public.user_annotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    page_path TEXT NOT NULL,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, page_path)
);

-- Index for ultra-fast lookup by user and page
CREATE INDEX IF NOT EXISTS idx_user_annotations_user_page 
ON public.user_annotations (user_id, page_path);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_annotations ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see, insert, update, and delete their own annotations
CREATE POLICY "Users can select own annotations" 
ON public.user_annotations FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own annotations" 
ON public.user_annotations FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own annotations" 
ON public.user_annotations FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own annotations" 
ON public.user_annotations FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);


-- 2. Create table for user AI Doubt Solver history
CREATE TABLE IF NOT EXISTS public.user_ai_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    record_id TEXT NOT NULL,
    question TEXT NOT NULL,
    answer_html TEXT NOT NULL,
    exact_timestamp TEXT,
    timestamp BIGINT NOT NULL,
    page_path TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, record_id)
);

-- Index for lookup and ordering by timestamp
CREATE INDEX IF NOT EXISTS idx_user_ai_history_user_ts 
ON public.user_ai_history (user_id, timestamp DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_ai_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see, insert, and delete their own AI history
CREATE POLICY "Users can select own ai history" 
ON public.user_ai_history FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai history" 
ON public.user_ai_history FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ai history" 
ON public.user_ai_history FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own ai history" 
ON public.user_ai_history FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);


-- 3. Create table for user memberships & paid passes (Razorpay, One-time & Subscriptions)
CREATE TABLE IF NOT EXISTS public.user_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_type TEXT NOT NULL,              -- 'lifetime', 'monthly', 'annual'
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'expired', 'cancelled'
    amount_paid NUMERIC NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'INR',
    payment_gateway TEXT NOT NULL DEFAULT 'razorpay',
    payment_id TEXT,
    order_id TEXT,
    valid_until TIMESTAMPTZ,              -- NULL for lifetime; timestamp for monthly/annual
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_memberships_user 
ON public.user_memberships (user_id);

ALTER TABLE public.user_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own membership" 
ON public.user_memberships FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own membership" 
ON public.user_memberships FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own membership" 
ON public.user_memberships FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);


