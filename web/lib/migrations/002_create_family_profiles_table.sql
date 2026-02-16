-- Family profiles table - links Supabase auth users to family data
CREATE TABLE IF NOT EXISTS public.family_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  family_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.family_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own family_profile" ON public.family_profiles;
DROP POLICY IF EXISTS "Users can create own family_profile" ON public.family_profiles;
DROP POLICY IF EXISTS "Users can update own family_profile" ON public.family_profiles;

-- Policy: Users can only read their own family profile
CREATE POLICY "Users can view own family_profile"
  ON public.family_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own family profile
CREATE POLICY "Users can create own family_profile"
  ON public.family_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own family profile
CREATE POLICY "Users can update own family_profile"
  ON public.family_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_family_profiles_user_id ON public.family_profiles(user_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.family_profiles TO authenticated;
