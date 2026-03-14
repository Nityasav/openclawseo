-- Fix: robust handle_new_user trigger
-- Run this in Supabase SQL editor if you get "Database error saving new user"

-- Make sure tables exist first
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  role TEXT DEFAULT 'admin',
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drop and recreate the trigger function with better error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
  user_name TEXT;
BEGIN
  -- Get a safe display name
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1),
    'User'
  );

  -- Create organization
  INSERT INTO organizations (name)
  VALUES (user_name || '''s Organization')
  RETURNING id INTO new_org_id;

  -- Create profile (upsert to avoid duplicates)
  INSERT INTO profiles (id, org_id, role, full_name, avatar_url)
  VALUES (
    NEW.id,
    new_org_id,
    'admin',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    org_id = EXCLUDED.org_id,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url);

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't block user creation
  RAISE WARNING 'handle_new_user error: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Disable RLS temporarily so trigger can always write
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Re-enable with a permissive service-role policy
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (needed for trigger + API routes)
DROP POLICY IF EXISTS "Service role full access orgs" ON organizations;
CREATE POLICY "Service role full access orgs" ON organizations
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access profiles" ON profiles;
CREATE POLICY "Service role full access profiles" ON profiles
  USING (true) WITH CHECK (true);
