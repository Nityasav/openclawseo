-- SEOClaw Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plan TEXT DEFAULT 'free', -- 'free' | 'pro' | 'agency'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  role TEXT DEFAULT 'member', -- 'admin' | 'member' | 'viewer'
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sites being tracked
CREATE TABLE IF NOT EXISTS sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  gsc_property_url TEXT,
  ga4_property_id TEXT,
  framer_project_id TEXT,
  is_sandbox BOOLEAN DEFAULT FALSE,
  sandbox_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Keywords
CREATE TABLE IF NOT EXISTS keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  current_position FLOAT,
  previous_position FLOAT,
  search_volume INTEGER,
  difficulty FLOAT,
  opportunity_score FLOAT,
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- GEO / LLM visibility records
CREATE TABLE IF NOT EXISTS geo_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  llm_source TEXT, -- 'chatgpt' | 'perplexity' | 'gemini'
  is_cited BOOLEAN DEFAULT FALSE,
  citation_url TEXT,
  schema_injected BOOLEAN DEFAULT FALSE,
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent runs
CREATE TABLE IF NOT EXISTS agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  run_type TEXT NOT NULL, -- 'seo_audit' | 'geo_check' | 'report' | 'full'
  status TEXT DEFAULT 'pending', -- 'pending' | 'running' | 'complete' | 'failed'
  result_json JSONB,
  error_message TEXT,
  tokens_used INTEGER,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  agent_run_id UUID REFERENCES agent_runs(id) ON DELETE SET NULL,
  title TEXT,
  summary TEXT,
  report_json JSONB,
  delivered_to_slack BOOLEAN DEFAULT FALSE,
  delivered_to_email BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sandbox environments
CREATE TABLE IF NOT EXISTS sandbox_environments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  template TEXT NOT NULL, -- 'site_audit' | 'competitor_analysis' | 'content_strategy'
  status TEXT DEFAULT 'spinning_up', -- 'spinning_up' | 'ready' | 'expired'
  container_id TEXT,
  access_token TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'prospect', -- 'prospect' | 'agency' | 'admin'
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '48 hours'),
  session_recording_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Integration credentials
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'gsc' | 'ga4' | 'slack' | 'framer'
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  config_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, provider)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_org_id ON profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_sites_org_id ON sites(org_id);
CREATE INDEX IF NOT EXISTS idx_keywords_site_id ON keywords(site_id);
CREATE INDEX IF NOT EXISTS idx_keywords_opportunity ON keywords(opportunity_score DESC);
CREATE INDEX IF NOT EXISTS idx_geo_records_site_id ON geo_records(site_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_site_id ON agent_runs(site_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_status ON agent_runs(status);
CREATE INDEX IF NOT EXISTS idx_reports_site_id ON reports(site_id);
CREATE INDEX IF NOT EXISTS idx_integrations_org_provider ON integrations(org_id, provider);
CREATE INDEX IF NOT EXISTS idx_sandbox_access_token ON sandbox_environments(access_token);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE geo_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE sandbox_environments ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's org_id
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper function: get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ORGANIZATIONS
CREATE POLICY "Users can read own org" ON organizations
  FOR SELECT USING (id = get_user_org_id());

CREATE POLICY "Admins can update org" ON organizations
  FOR UPDATE USING (id = get_user_org_id() AND get_user_role() = 'admin');

-- PROFILES
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (id = auth.uid() OR org_id = get_user_org_id());

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Service role can insert profiles" ON profiles
  FOR INSERT WITH CHECK (true);

-- SITES
CREATE POLICY "Org members can read sites" ON sites
  FOR SELECT USING (org_id = get_user_org_id());

CREATE POLICY "Org admins/members can insert sites" ON sites
  FOR INSERT WITH CHECK (org_id = get_user_org_id() AND get_user_role() IN ('admin', 'member'));

CREATE POLICY "Org admins can delete sites" ON sites
  FOR DELETE USING (org_id = get_user_org_id() AND get_user_role() = 'admin');

-- KEYWORDS
CREATE POLICY "Org members can read keywords" ON keywords
  FOR SELECT USING (
    site_id IN (SELECT id FROM sites WHERE org_id = get_user_org_id())
  );

CREATE POLICY "Org members can write keywords" ON keywords
  FOR ALL USING (
    site_id IN (SELECT id FROM sites WHERE org_id = get_user_org_id())
  ) WITH CHECK (
    site_id IN (SELECT id FROM sites WHERE org_id = get_user_org_id())
  );

-- GEO RECORDS
CREATE POLICY "Org members can read geo records" ON geo_records
  FOR SELECT USING (
    site_id IN (SELECT id FROM sites WHERE org_id = get_user_org_id())
  );

CREATE POLICY "Org members can write geo records" ON geo_records
  FOR ALL USING (
    site_id IN (SELECT id FROM sites WHERE org_id = get_user_org_id())
  ) WITH CHECK (
    site_id IN (SELECT id FROM sites WHERE org_id = get_user_org_id())
  );

-- AGENT RUNS
CREATE POLICY "Org members can read agent runs" ON agent_runs
  FOR SELECT USING (
    site_id IN (SELECT id FROM sites WHERE org_id = get_user_org_id())
  );

CREATE POLICY "Viewers cannot write agent runs" ON agent_runs
  FOR INSERT WITH CHECK (
    site_id IN (SELECT id FROM sites WHERE org_id = get_user_org_id())
    AND get_user_role() IN ('admin', 'member')
  );

-- REPORTS
CREATE POLICY "Org members can read reports" ON reports
  FOR SELECT USING (
    site_id IN (SELECT id FROM sites WHERE org_id = get_user_org_id())
  );

CREATE POLICY "Org members can write reports" ON reports
  FOR ALL USING (
    site_id IN (SELECT id FROM sites WHERE org_id = get_user_org_id())
  ) WITH CHECK (
    site_id IN (SELECT id FROM sites WHERE org_id = get_user_org_id())
  );

-- SANDBOX ENVIRONMENTS
-- Public read via access_token (for prospect demos)
CREATE POLICY "Public sandbox read via access token" ON sandbox_environments
  FOR SELECT USING (true); -- access_token check is done in API route

CREATE POLICY "Service can manage sandboxes" ON sandbox_environments
  FOR ALL USING (true) WITH CHECK (true);

-- INTEGRATIONS
CREATE POLICY "Org admins can read integrations" ON integrations
  FOR SELECT USING (org_id = get_user_org_id());

CREATE POLICY "Org admins can write integrations" ON integrations
  FOR ALL USING (org_id = get_user_org_id() AND get_user_role() IN ('admin', 'member'))
  WITH CHECK (org_id = get_user_org_id() AND get_user_role() IN ('admin', 'member'));

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-create profile and org on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Create organization
  INSERT INTO organizations (name)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'My Organization') || '''s Org')
  RETURNING id INTO new_org_id;

  -- Create profile
  INSERT INTO profiles (id, org_id, role, full_name, avatar_url)
  VALUES (
    NEW.id,
    new_org_id,
    'admin',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
