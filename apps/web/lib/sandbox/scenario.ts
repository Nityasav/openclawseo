// Scenario system for sandbox environments
// Controls industry vocabulary, data profiles, feature flags, and preset library

export type SandboxIndustry =
  | "saas"
  | "ecommerce"
  | "local_business"
  | "media"
  | "agency";

export type SandboxDataProfile =
  | "healthy"
  | "struggling"
  | "recovering"
  | "new_site"
  | "peak_performance";

export interface SandboxFeatureFlags {
  show_seo_health_score: boolean;
  show_technical_issues: boolean;
  show_backlinks: boolean;
  show_geo_citations: boolean;
  show_page_speed: boolean;
  show_crawl_errors: boolean;
  show_schema_issues: boolean;
  show_competitor_gap: boolean;
  show_content_clusters: boolean;
}

export interface SandboxDataOverrides {
  domain?: string;
  keyword_count?: number;
  monthly_sessions?: number;
  seo_health_score?: number;
}

export interface ScenarioConfig {
  industry: SandboxIndustry;
  dataProfile: SandboxDataProfile;
  featureFlags: SandboxFeatureFlags;
  dataOverrides?: SandboxDataOverrides;
}

export interface WalkthroughStep {
  id: string;
  title: string;
  description: string;
  url_hash: string;
  scroll_y: number;
  captured_at: string;
}

export interface EnrichedSandboxRow {
  id: string;
  org_id: string | null;
  template: string;
  status: "spinning_up" | "ready" | "expired";
  access_token: string;
  role: string;
  expires_at: string;
  session_recording_url: string | null;
  created_at: string;
  scenario_name: string | null;
  scenario_config: ScenarioConfig | null;
  walkthrough_steps: WalkthroughStep[];
  is_template: boolean;
}

// ─── Default feature flags per data profile ───────────────────────────────────

export const DEFAULT_FLAGS_BY_PROFILE: Record<SandboxDataProfile, SandboxFeatureFlags> = {
  healthy: {
    show_seo_health_score: true,
    show_technical_issues: false,
    show_backlinks: true,
    show_geo_citations: true,
    show_page_speed: true,
    show_crawl_errors: false,
    show_schema_issues: false,
    show_competitor_gap: true,
    show_content_clusters: true,
  },
  struggling: {
    show_seo_health_score: true,
    show_technical_issues: true,
    show_backlinks: true,
    show_geo_citations: false,
    show_page_speed: true,
    show_crawl_errors: true,
    show_schema_issues: true,
    show_competitor_gap: true,
    show_content_clusters: false,
  },
  recovering: {
    show_seo_health_score: true,
    show_technical_issues: true,
    show_backlinks: true,
    show_geo_citations: true,
    show_page_speed: true,
    show_crawl_errors: true,
    show_schema_issues: false,
    show_competitor_gap: true,
    show_content_clusters: true,
  },
  new_site: {
    show_seo_health_score: true,
    show_technical_issues: false,
    show_backlinks: false,
    show_geo_citations: false,
    show_page_speed: true,
    show_crawl_errors: false,
    show_schema_issues: true,
    show_competitor_gap: true,
    show_content_clusters: true,
  },
  peak_performance: {
    show_seo_health_score: true,
    show_technical_issues: false,
    show_backlinks: true,
    show_geo_citations: true,
    show_page_speed: true,
    show_crawl_errors: false,
    show_schema_issues: false,
    show_competitor_gap: true,
    show_content_clusters: true,
  },
};

// ─── Runtime type guard ────────────────────────────────────────────────────────

export function isScenarioConfig(v: unknown): v is ScenarioConfig {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.industry === "string" &&
    typeof o.dataProfile === "string" &&
    typeof o.featureFlags === "object"
  );
}

// ─── Built-in scenario presets ─────────────────────────────────────────────────

export const SCENARIO_PRESETS: Array<{
  id: string;
  label: string;
  description: string;
  industry_label: string;
  profile_label: string;
  config: ScenarioConfig;
  template: "site_audit" | "competitor_analysis" | "content_strategy";
  role: "prospect" | "agency" | "admin";
}> = [
  {
    id: "saas-healthy",
    label: "SaaS — Healthy Growth",
    description: "Mid-stage SaaS with strong organic presence, solid backlinks, and clean technical profile. Great for showing off full feature set to prospects.",
    industry_label: "SaaS",
    profile_label: "Healthy",
    template: "site_audit",
    role: "prospect",
    config: {
      industry: "saas",
      dataProfile: "healthy",
      featureFlags: DEFAULT_FLAGS_BY_PROFILE.healthy,
    },
  },
  {
    id: "ecom-struggling",
    label: "E-commerce — Technical Debt",
    description: "Online store with crawl errors, slow Core Web Vitals, missing product schema, and dropping rankings. Shows the full diagnostic value.",
    industry_label: "E-commerce",
    profile_label: "Struggling",
    template: "site_audit",
    role: "prospect",
    config: {
      industry: "ecommerce",
      dataProfile: "struggling",
      featureFlags: DEFAULT_FLAGS_BY_PROFILE.struggling,
    },
  },
  {
    id: "local-recovering",
    label: "Local Business — Recovering",
    description: "Service business rebuilding after a Google core update. NAP citations improving, rankings climbing back. Perfect for agency pitches.",
    industry_label: "Local Business",
    profile_label: "Recovering",
    template: "competitor_analysis",
    role: "agency",
    config: {
      industry: "local_business",
      dataProfile: "recovering",
      featureFlags: DEFAULT_FLAGS_BY_PROFILE.recovering,
    },
  },
  {
    id: "media-peak",
    label: "Media Site — Peak Performance",
    description: "News and content site dominating organic search. LLM citations firing, backlink profile strong, all green across the board.",
    industry_label: "Media",
    profile_label: "Peak",
    template: "content_strategy",
    role: "prospect",
    config: {
      industry: "media",
      dataProfile: "peak_performance",
      featureFlags: DEFAULT_FLAGS_BY_PROFILE.peak_performance,
    },
  },
  {
    id: "agency-new-site",
    label: "Agency Client — New Site Launch",
    description: "Brand new domain: no backlinks, schema gaps, low traffic but high keyword opportunity. Shows a blank-slate growth story.",
    industry_label: "Agency",
    profile_label: "New Site",
    template: "content_strategy",
    role: "agency",
    config: {
      industry: "agency",
      dataProfile: "new_site",
      featureFlags: DEFAULT_FLAGS_BY_PROFILE.new_site,
    },
  },
];

// ─── Profile/industry badge colors ────────────────────────────────────────────

export const PROFILE_COLORS: Record<SandboxDataProfile, string> = {
  healthy:          "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  struggling:       "bg-red-500/10 text-red-400 border-red-500/20",
  recovering:       "bg-amber-500/10 text-amber-400 border-amber-500/20",
  new_site:         "bg-blue-500/10 text-blue-400 border-blue-500/20",
  peak_performance: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

export const INDUSTRY_COLORS: Record<SandboxIndustry, string> = {
  saas:           "bg-sky-500/10 text-sky-400 border-sky-500/20",
  ecommerce:      "bg-orange-500/10 text-orange-400 border-orange-500/20",
  local_business: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  media:          "bg-pink-500/10 text-pink-400 border-pink-500/20",
  agency:         "bg-violet-500/10 text-violet-400 border-violet-500/20",
};
