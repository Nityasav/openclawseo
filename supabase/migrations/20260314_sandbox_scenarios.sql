-- Migration: sandbox scenarios, walkthrough capture, and template library
-- Run this in your Supabase Dashboard → SQL Editor

ALTER TABLE sandbox_environments
  ADD COLUMN IF NOT EXISTS scenario_name TEXT,
  ADD COLUMN IF NOT EXISTS scenario_config JSONB,
  ADD COLUMN IF NOT EXISTS walkthrough_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_template BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_sandbox_is_template
  ON sandbox_environments (is_template, created_at DESC)
  WHERE is_template = true;
