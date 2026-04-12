-- ============================================================================
-- Global Horizon - Supabase SQL Schema
-- Production-Ready with Custom JWT RLS Policies
-- ============================================================================

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert during signup (no auth required yet)
CREATE POLICY "Allow signup - insert new user"
ON public.users FOR INSERT
WITH CHECK (true);

-- Users can only read their own data
-- Our custom JWT has 'user_id' claim that matches the id column
CREATE POLICY "Users can read own data"
ON public.users FOR SELECT
USING (id = (current_setting('request.jwt.claims', true)::jsonb->>'user_id')::uuid);

-- Allow admin to read all users
CREATE POLICY "Admins can read all users"
ON public.users FOR SELECT
USING ((current_setting('request.jwt.claims', true)::jsonb->>'is_admin')::boolean = true);

-- ============================================================================
-- POSTS TABLE
-- ============================================================================
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  caption TEXT,
  location TEXT,
  media_type VARCHAR(20) DEFAULT 'image',
  ai_summary JSONB,
  likes INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on posts table
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Anyone can read all posts (public feed)
CREATE POLICY "Anyone can read posts"
ON public.posts FOR SELECT
USING (true);

-- Users can only insert their own posts
-- Custom JWT has 'user_id' claim
CREATE POLICY "Users can insert own posts"
ON public.posts FOR INSERT
WITH CHECK (user_id = (current_setting('request.jwt.claims', true)::jsonb->>'user_id')::uuid);

-- Users can update their own posts
CREATE POLICY "Users can update own posts"
ON public.posts FOR UPDATE
USING (user_id = (current_setting('request.jwt.claims', true)::jsonb->>'user_id')::uuid)
WITH CHECK (user_id = (current_setting('request.jwt.claims', true)::jsonb->>'user_id')::uuid);

-- Users can delete their own posts
CREATE POLICY "Users can delete own posts"
ON public.posts FOR DELETE
USING (user_id = (current_setting('request.jwt.claims', true)::jsonb->>'user_id')::uuid);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX idx_posts_user_id ON public.posts(user_id);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_posts_media_type ON public.posts(media_type);
CREATE INDEX idx_users_email ON public.users(email);

-- ============================================================================
-- REALTIME SUBSCRIPTIONS
-- ============================================================================
-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;

-- ============================================================================
-- NOTES ON CUSTOM JWT
-- ============================================================================
-- Our RLS policies use: (current_setting('request.jwt.claims', true)::jsonb->>'field_name')
-- 
-- The custom JWT from Flask backend includes:
-- {
--   "user_id": "uuid-here",
--   "email": "user@example.com",
--   "is_admin": false,
--   "iat": 1234567890,
--   "exp": 1234567890
-- }
--
-- Supabase will trust this JWT because:
-- 1. Frontend passes it in Authorization header
-- 2. Supabase client initialized with custom JWT
-- 3. RLS policies decode the JWT payload
--
-- ============================================================================
