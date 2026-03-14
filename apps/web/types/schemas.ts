import { z } from "zod";

// API Response wrapper
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
  });

// Auth
export const SessionSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string().email().optional(),
  }),
  profile: z
    .object({
      id: z.string(),
      org_id: z.string().nullable(),
      role: z.string(),
      full_name: z.string().nullable(),
      avatar_url: z.string().nullable(),
    })
    .optional(),
});

// Agent
export const TriggerAgentSchema = z.object({
  site_id: z.string().uuid(),
  run_type: z.enum(["seo_audit", "geo_check", "report", "full"]),
});

export const AgentRunSchema = z.object({
  id: z.string().uuid(),
  site_id: z.string().uuid(),
  run_type: z.string(),
  status: z.enum(["pending", "running", "complete", "failed"]),
  result_json: z.unknown().nullable(),
  error_message: z.string().nullable(),
  tokens_used: z.number().nullable(),
  started_at: z.string().nullable(),
  completed_at: z.string().nullable(),
  created_at: z.string(),
});

// Sandbox
export const CreateSandboxSchema = z.object({
  template: z.enum(["site_audit", "competitor_analysis", "content_strategy"]),
  role: z.enum(["prospect", "agency", "admin"]).default("prospect"),
  org_id: z.string().uuid().optional(),
});

export const SandboxEnvironmentSchema = z.object({
  id: z.string().uuid(),
  template: z.string(),
  status: z.enum(["spinning_up", "ready", "expired"]),
  access_token: z.string(),
  role: z.string(),
  expires_at: z.string(),
  created_at: z.string(),
});

// Integrations
export const SlackConnectSchema = z.object({
  webhook_url: z.string().url(),
  site_id: z.string().uuid(),
});

export const SlackTestSchema = z.object({
  site_id: z.string().uuid(),
});

export const FramerConfigSchema = z.object({
  api_key: z.string().min(1),
  project_id: z.string().min(1),
  site_id: z.string().uuid(),
});

// Keywords
export const KeywordSchema = z.object({
  id: z.string().uuid(),
  site_id: z.string().uuid(),
  keyword: z.string(),
  current_position: z.number().nullable(),
  previous_position: z.number().nullable(),
  search_volume: z.number().nullable(),
  difficulty: z.number().nullable(),
  opportunity_score: z.number().nullable(),
  last_checked_at: z.string().nullable(),
  created_at: z.string(),
});

// Reports
export const ReportSchema = z.object({
  id: z.string().uuid(),
  site_id: z.string().uuid(),
  agent_run_id: z.string().uuid().nullable(),
  title: z.string().nullable(),
  summary: z.string().nullable(),
  report_json: z.unknown().nullable(),
  delivered_to_slack: z.boolean(),
  delivered_to_email: z.boolean(),
  created_at: z.string(),
});

// GEO
export const GeoRecordSchema = z.object({
  id: z.string().uuid(),
  site_id: z.string().uuid(),
  query: z.string(),
  llm_source: z.string().nullable(),
  is_cited: z.boolean(),
  citation_url: z.string().nullable(),
  schema_injected: z.boolean(),
  checked_at: z.string(),
});

// AI-optimized blogs
export const AiBlogPostSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  site_id: z.string().uuid().nullable(),
  title: z.string(),
  slug: z.string(),
  status: z.enum(["draft", "published"]),
  primary_keyword: z.string().nullable(),
  secondary_keyword: z.string().nullable(),
  prompt: z.string().nullable(),
  word_count: z.number().nullable(),
  read_time_minutes: z.number().nullable(),
  content_html: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  published_at: z.string().nullable(),
});

// Webhook
export const AgentWebhookSchema = z.object({
  run_id: z.string().uuid(),
  status: z.enum(["complete", "failed"]),
  result_json: z.unknown().optional(),
  error_message: z.string().optional(),
  tokens_used: z.number().optional(),
  secret: z.string(),
});

// Site
export const AddSiteSchema = z.object({
  domain: z.string().min(1),
  gsc_property_url: z.string().optional(),
  ga4_property_id: z.string().optional(),
});

export const SendReportToSlackSchema = z.object({
  report_id: z.string().uuid(),
});

export type TriggerAgentInput = z.infer<typeof TriggerAgentSchema>;
export type AgentRun = z.infer<typeof AgentRunSchema>;
export type CreateSandboxInput = z.infer<typeof CreateSandboxSchema>;
export type SandboxEnvironment = z.infer<typeof SandboxEnvironmentSchema>;
export type SlackConnectInput = z.infer<typeof SlackConnectSchema>;
export type Keyword = z.infer<typeof KeywordSchema>;
export type Report = z.infer<typeof ReportSchema>;
export type GeoRecord = z.infer<typeof GeoRecordSchema>;
export type AiBlogPost = z.infer<typeof AiBlogPostSchema>;
