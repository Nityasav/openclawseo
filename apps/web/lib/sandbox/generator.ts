// Synthetic data generator for sandbox environments
// Produces realistic SEO data without requiring real integrations

import type { ScenarioConfig, SandboxIndustry, SandboxDataProfile } from "./scenario";

export type SandboxTemplate = "site_audit" | "competitor_analysis" | "content_strategy";

// ─── Existing interfaces (unchanged) ──────────────────────────────────────────

export interface SyntheticKeyword {
  id: string;
  keyword: string;
  current_position: number;
  previous_position: number;
  search_volume: number;
  difficulty: number;
  opportunity_score: number;
  delta: number;
}

export interface SyntheticGscRow {
  query: string;
  page: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
}

export interface SyntheticGA4Row {
  date: string;
  sessions: number;
  organic_sessions: number;
  bounce_rate: number;
  conversions: number;
}

export interface SyntheticSite {
  domain: string;
  template: SandboxTemplate;
  keywords: SyntheticKeyword[];
  gsc_data: SyntheticGscRow[];
  ga4_data: SyntheticGA4Row[];
  competitors?: SyntheticCompetitor[];
  content_clusters?: ContentCluster[];
}

export interface SyntheticCompetitor {
  domain: string;
  keywords: SyntheticKeyword[];
  keyword_gap: string[];
}

export interface ContentCluster {
  topic: string;
  keywords: string[];
  suggested_title: string;
  target_keyword: string;
  estimated_traffic: number;
  priority: "high" | "medium" | "low";
}

// ─── New v2 interfaces ─────────────────────────────────────────────────────────

export interface TechnicalIssue {
  type: "crawl_error" | "missing_meta" | "duplicate_content" | "broken_link" | "redirect_chain" | "slow_page" | "missing_schema";
  url: string;
  severity: "critical" | "warning" | "info";
  count: number;
  description: string;
}

export interface BacklinkData {
  referring_domain: string;
  anchor_text: string;
  domain_rating: number;
  link_type: "dofollow" | "nofollow";
  first_seen: string;
}

export interface GeoCitation {
  platform: string;
  name_match: boolean;
  address_match: boolean;
  phone_match: boolean;
  nap_score: number;
  profile_url: string;
}

export interface PageSpeedMetrics {
  mobile_score: number;
  desktop_score: number;
  lcp_ms: number;
  fid_ms: number;
  cls_score: number;
  ttfb_ms: number;
}

export interface SchemaIssue {
  page: string;
  schema_type: string;
  issue: string;
  recommended_fix: string;
}

export interface CrawlError {
  url: string;
  error_type: "404" | "500" | "redirect_loop" | "blocked_by_robots" | "timeout";
  discovered_at: string;
  source_page: string;
}

export interface SyntheticSiteV2 extends SyntheticSite {
  seo_health_score: number;
  technical_issues: TechnicalIssue[];
  backlinks: BacklinkData[];
  geo_citations: GeoCitation[];
  page_speed: PageSpeedMetrics;
  crawl_errors: CrawlError[];
  schema_issues: SchemaIssue[];
  industry?: SandboxIndustry;
  data_profile?: SandboxDataProfile;
}

// ─── PRNG (unchanged) ─────────────────────────────────────────────────────────

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function gaussianRandom(rand: () => number, mean: number, std: number): number {
  let u = 0, v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.round(mean + std * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v));
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function daysAgo(rand: () => number, maxDays = 365): string {
  const days = Math.floor(rand() * maxDays);
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

// ─── Keyword templates and topic vocabularies ─────────────────────────────────

const GENERIC_KEYWORD_TEMPLATES = [
  "best {topic} software",
  "{topic} tools for small business",
  "how to improve {topic}",
  "{topic} optimization tips",
  "top {topic} strategies",
  "{topic} best practices 2024",
  "what is {topic}",
  "{topic} guide for beginners",
  "{topic} vs {topic2}",
  "affordable {topic} solutions",
  "{topic} for enterprise",
  "free {topic} tools",
  "{topic} checklist",
  "how does {topic} work",
  "{topic} examples",
  "{topic} mistakes to avoid",
  "improve {topic} fast",
  "{topic} ROI",
];

const INDUSTRY_TOPICS: Record<SandboxIndustry, string[]> = {
  saas: [
    "SaaS onboarding", "product-led growth", "CRM integration", "API documentation",
    "churn reduction", "feature adoption", "B2B SaaS marketing", "product analytics",
    "customer success", "SaaS pricing strategy", "trial conversion", "user activation",
  ],
  ecommerce: [
    "product page optimization", "shopping cart abandonment", "category page SEO",
    "product schema markup", "faceted navigation SEO", "image alt text",
    "e-commerce site speed", "customer reviews schema", "breadcrumb navigation",
    "mobile checkout optimization", "inventory management SEO", "seasonal SEO",
  ],
  local_business: [
    "local SEO strategy", "Google Business Profile", "NAP citation building",
    "review management", "near me search optimization", "local landing pages",
    "map pack ranking", "geo-targeted content", "local link building",
    "service area pages", "local schema markup", "neighborhood SEO",
  ],
  media: [
    "evergreen content strategy", "news SEO optimization", "video schema markup",
    "topical authority building", "internal linking strategy", "article schema",
    "publication freshness signals", "AMP implementation", "editorial calendar SEO",
    "content hub strategy", "journalist outreach", "SERP feature optimization",
  ],
  agency: [
    "white label SEO reporting", "client SEO audit", "technical SEO services",
    "link building campaigns", "competitor gap analysis", "content calendar planning",
    "keyword clustering strategy", "SEO proposal writing", "agency rank tracking",
    "multi-location SEO", "franchise SEO", "SEO client retention",
  ],
};

const GENERIC_TOPICS = [
  "SEO", "content marketing", "email marketing", "social media", "PPC",
  "link building", "technical SEO", "keyword research", "backlink analysis",
  "website audit", "page speed", "mobile optimization", "local SEO",
  "e-commerce SEO", "blog optimization", "meta tags", "schema markup",
];

const DOMAINS: Record<SandboxIndustry | "generic", string[]> = {
  saas: ["growthstack.io", "pipelineiq.co", "dashmetrics.io", "onboardly.co", "retainiq.io"],
  ecommerce: ["shopboost.co", "cartpulse.io", "rankstore.io", "convertshop.co", "storefront-seo.io"],
  local_business: ["localrank.co", "citationpro.io", "mapsboost.co", "nearmetop.io", "localedge.co"],
  media: ["contentpulse.io", "rankpress.co", "evergreenseo.io", "mediaspark.co", "editorialrank.io"],
  agency: ["agencyedge.io", "seocraft.co", "rankagency.io", "clientboost.co", "searchcraft.io"],
  generic: ["growthspark.io", "rankboost.co", "seoedge.com", "digitalrise.io", "marketpulse.co"],
};

// ─── Data profile modifiers ────────────────────────────────────────────────────

const DATA_PROFILE_MODIFIERS: Record<SandboxDataProfile, {
  position_bias: number;
  session_multiplier: number;
  health_score_range: [number, number];
  issue_count_multiplier: number;
  backlink_count_range: [number, number];
  backlink_dr_mean: number;
}> = {
  healthy:          { position_bias: -8,  session_multiplier: 1.8, health_score_range: [72, 91], issue_count_multiplier: 0.2, backlink_count_range: [45, 80], backlink_dr_mean: 52 },
  struggling:       { position_bias: +15, session_multiplier: 0.5, health_score_range: [24, 44], issue_count_multiplier: 2.5, backlink_count_range: [8, 25],  backlink_dr_mean: 22 },
  recovering:       { position_bias: +4,  session_multiplier: 0.9, health_score_range: [48, 65], issue_count_multiplier: 1.2, backlink_count_range: [25, 55], backlink_dr_mean: 38 },
  new_site:         { position_bias: +25, session_multiplier: 0.2, health_score_range: [55, 70], issue_count_multiplier: 0.5, backlink_count_range: [2, 12],  backlink_dr_mean: 18 },
  peak_performance: { position_bias: -15, session_multiplier: 3.2, health_score_range: [88, 97], issue_count_multiplier: 0.05, backlink_count_range: [80, 180], backlink_dr_mean: 68 },
};

const REFERRING_DOMAINS = [
  "techcrunch.com", "producthunt.com", "hackernews.ycombinator.com", "indiehackers.com",
  "moz.com", "ahrefs.com", "semrush.com", "searchengineland.com", "backlinko.com",
  "hubspot.com", "g2.com", "capterra.com", "reddit.com", "linkedin.com",
  "forbes.com", "entrepreneur.com", "inc.com", "businessinsider.com",
  "medium.com", "substack.com", "dev.to", "smashingmagazine.com",
  "css-tricks.com", "sitepoint.com", "webdesignerdepot.com",
];

const GEO_PLATFORMS = [
  "Google Business Profile", "Yelp", "Apple Maps", "Bing Places",
  "Facebook Business", "Foursquare", "TripAdvisor", "Yellow Pages",
  "Angi", "HomeAdvisor", "Better Business Bureau",
];

const TECHNICAL_ISSUE_URLS_TEMPLATES = [
  "/{slug}/",
  "/blog/{slug}/",
  "/products/{slug}/",
  "/services/{slug}/",
  "/category/{slug}/",
];

const SCHEMA_TYPES_BY_INDUSTRY: Record<SandboxIndustry | "generic", string[]> = {
  saas: ["SoftwareApplication", "FAQPage", "HowTo", "Organization"],
  ecommerce: ["Product", "Offer", "BreadcrumbList", "Review", "AggregateRating"],
  local_business: ["LocalBusiness", "GeoCoordinates", "OpeningHoursSpecification", "Review"],
  media: ["Article", "NewsArticle", "BreadcrumbList", "FAQPage", "VideoObject"],
  agency: ["Organization", "Service", "FAQPage", "HowTo"],
  generic: ["WebPage", "FAQPage", "Article", "BreadcrumbList"],
};

// ─── Sub-generators ────────────────────────────────────────────────────────────

function generateTechnicalIssues(
  rand: () => number,
  domain: string,
  multiplier: number
): TechnicalIssue[] {
  if (multiplier < 0.1) return [];
  const baseCount = Math.floor(rand() * 4 + 2);
  const count = Math.round(baseCount * multiplier);
  if (count === 0) return [];

  const issueTypes: Array<TechnicalIssue["type"]> = [
    "crawl_error", "missing_meta", "duplicate_content",
    "broken_link", "redirect_chain", "slow_page", "missing_schema",
  ];
  const severityMap: Record<TechnicalIssue["type"], TechnicalIssue["severity"]> = {
    crawl_error: "critical",
    broken_link: "critical",
    redirect_chain: "warning",
    slow_page: "warning",
    missing_meta: "warning",
    duplicate_content: "warning",
    missing_schema: "info",
  };
  const descMap: Record<TechnicalIssue["type"], string> = {
    crawl_error: "Googlebot can't access these URLs — check robots.txt and server responses",
    missing_meta: "Pages missing title tags or meta descriptions lose click-through rate",
    duplicate_content: "Multiple URLs serving identical content splits ranking signals",
    broken_link: "Internal or external links returning 4xx errors hurt crawl efficiency",
    redirect_chain: "Chains of 3+ redirects dilute PageRank and slow page load",
    slow_page: "Pages exceeding 3s LCP threshold — Core Web Vitals penalty risk",
    missing_schema: "Structured data absent — missing eligibility for rich results",
  };

  const issues: TechnicalIssue[] = [];
  const usedTypes = new Set<string>();

  for (let i = 0; i < Math.min(count, issueTypes.length); i++) {
    let type: TechnicalIssue["type"];
    do { type = issueTypes[Math.floor(rand() * issueTypes.length)]; }
    while (usedTypes.has(type));
    usedTypes.add(type);

    const urlTemplate = TECHNICAL_ISSUE_URLS_TEMPLATES[Math.floor(rand() * TECHNICAL_ISSUE_URLS_TEMPLATES.length)];
    const slug = ["pricing", "features", "about", "contact", "blog-post", "product-page", "category"][Math.floor(rand() * 7)];
    const url = `https://${domain}${urlTemplate.replace("{slug}", slug)}`;

    issues.push({
      type,
      url,
      severity: severityMap[type],
      count: Math.floor(rand() * 18 + 1),
      description: descMap[type],
    });
  }

  return issues.sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });
}

function generateBacklinks(
  rand: () => number,
  profile: SandboxDataProfile,
  domain: string
): BacklinkData[] {
  const mod = DATA_PROFILE_MODIFIERS[profile];
  const count = Math.floor(
    mod.backlink_count_range[0] +
    rand() * (mod.backlink_count_range[1] - mod.backlink_count_range[0])
  );

  const anchorTemplates = [
    domain.replace(".io", "").replace(".co", "").replace(".com", ""),
    "click here", "learn more", "read more", "visit site",
    "SEO tool", "best {industry} software", "{industry} platform",
    "check out", domain,
  ];

  return Array.from({ length: count }, (_, i) => {
    const refDomain = REFERRING_DOMAINS[Math.floor(rand() * REFERRING_DOMAINS.length)];
    const dr = clamp(gaussianRandom(rand, mod.backlink_dr_mean, 18), 1, 100);
    const anchor = anchorTemplates[Math.floor(rand() * anchorTemplates.length)]
      .replace("{industry}", ["SaaS", "marketing", "SEO", "analytics"][Math.floor(rand() * 4)]);

    return {
      referring_domain: refDomain,
      anchor_text: anchor,
      domain_rating: dr,
      link_type: (rand() > 0.25 ? "dofollow" : "nofollow") as "dofollow" | "nofollow",
      first_seen: daysAgo(rand, 730),
    };
  }).sort((a, b) => b.domain_rating - a.domain_rating);
}

function generateGeoCitations(rand: () => number): GeoCitation[] {
  return GEO_PLATFORMS.map((platform) => {
    const nameMatch = rand() > 0.1;
    const addressMatch = rand() > 0.15;
    const phoneMatch = rand() > 0.2;
    const nap_score = Math.round(
      ((nameMatch ? 33 : 0) + (addressMatch ? 33 : 0) + (phoneMatch ? 34 : 0)) *
      (0.85 + rand() * 0.15)
    );
    return {
      platform,
      name_match: nameMatch,
      address_match: addressMatch,
      phone_match: phoneMatch,
      nap_score: clamp(nap_score, 0, 100),
      profile_url: `https://www.${platform.toLowerCase().replace(/\s+/g, "")}.com/biz/example`,
    };
  });
}

function generatePageSpeed(rand: () => number, profile: SandboxDataProfile): PageSpeedMetrics {
  const goodMobile = { mobile: [72, 94], desktop: [85, 98], lcp: [900, 2000], fid: [20, 80], cls: [0.01, 0.08], ttfb: [180, 400] };
  const badMobile  = { mobile: [22, 55], desktop: [45, 72], lcp: [3800, 7500], fid: [180, 450], cls: [0.18, 0.45], ttfb: [800, 2200] };

  const params =
    profile === "healthy" || profile === "peak_performance" ? goodMobile :
    profile === "struggling" ? badMobile :
    { mobile: [50, 75], desktop: [65, 85], lcp: [2200, 4000], fid: [80, 200], cls: [0.08, 0.2], ttfb: [400, 900] };

  const r = (range: number[]) => Math.round(range[0] + rand() * (range[1] - range[0]));

  return {
    mobile_score:  clamp(r(params.mobile), 0, 100),
    desktop_score: clamp(r(params.desktop), 0, 100),
    lcp_ms:  r(params.lcp),
    fid_ms:  r(params.fid),
    cls_score: Math.round((params.cls[0] + rand() * (params.cls[1] - params.cls[0])) * 100) / 100,
    ttfb_ms: r(params.ttfb),
  };
}

function generateCrawlErrors(
  rand: () => number,
  domain: string,
  multiplier: number
): CrawlError[] {
  if (multiplier < 0.3) return [];
  const count = Math.round((rand() * 6 + 2) * multiplier);
  if (count === 0) return [];

  const errorTypes: Array<CrawlError["error_type"]> = ["404", "500", "redirect_loop", "blocked_by_robots", "timeout"];
  const paths = ["/old-page/", "/deleted-product/", "/archive/", "/temp/", "/test-page/", "/draft/", "/expired-offer/"];

  return Array.from({ length: Math.min(count, 10) }, () => {
    const path = paths[Math.floor(rand() * paths.length)];
    const sourcePath = ["/blog/", "/sitemap/", "/", "/products/"][Math.floor(rand() * 4)];
    return {
      url: `https://${domain}${path}`,
      error_type: errorTypes[Math.floor(rand() * errorTypes.length)],
      discovered_at: daysAgo(rand, 60),
      source_page: `https://${domain}${sourcePath}`,
    };
  });
}

function generateSchemaIssues(
  rand: () => number,
  domain: string,
  industry: SandboxIndustry | "generic"
): SchemaIssue[] {
  const schemaTypes = SCHEMA_TYPES_BY_INDUSTRY[industry];
  const issues = [
    { issue: "Missing required 'name' property", fix: "Add name field to the JSON-LD markup" },
    { issue: "datePublished is missing or malformed", fix: "Add ISO 8601 date format: 2024-01-15" },
    { issue: "'author' property not specified", fix: "Add author with name and url fields" },
    { issue: "Price currency not specified", fix: "Add 'priceCurrency' field (e.g. 'USD')" },
    { issue: "reviewCount missing from AggregateRating", fix: "Add reviewCount integer field" },
    { issue: "openingHours format invalid", fix: "Use format: Mo-Fr 09:00-17:00" },
    { issue: "breadcrumb item missing 'position'", fix: "Add integer position field to each BreadcrumbList item" },
  ];

  const count = Math.floor(rand() * 4 + 1);
  const paths = ["/", "/about/", "/pricing/", "/blog/post-1/", "/product/example/"];

  return Array.from({ length: count }, () => {
    const schema = schemaTypes[Math.floor(rand() * schemaTypes.length)];
    const issuePair = issues[Math.floor(rand() * issues.length)];
    const path = paths[Math.floor(rand() * paths.length)];
    return {
      page: `https://${domain}${path}`,
      schema_type: schema,
      issue: issuePair.issue,
      recommended_fix: issuePair.fix,
    };
  });
}

// ─── Keyword generation ────────────────────────────────────────────────────────

function generateKeywords(
  rand: () => number,
  count: number,
  template: SandboxTemplate,
  topics: string[],
  positionBias: number
): SyntheticKeyword[] {
  const keywords: SyntheticKeyword[] = [];
  const templates = GENERIC_KEYWORD_TEMPLATES;

  for (let i = 0; i < count; i++) {
    const topic = topics[Math.floor(rand() * topics.length)];
    const topic2 = topics[Math.floor(rand() * topics.length)];
    const kwTemplate = templates[Math.floor(rand() * templates.length)];
    const keyword = kwTemplate
      .replace("{topic}", topic.toLowerCase())
      .replace("{topic2}", topic2.toLowerCase());

    let position = gaussianRandom(rand, 18 + positionBias, 12);
    position = clamp(position, 1, 100);

    if (i < Math.floor(count * 0.15)) {
      position = clamp(Math.floor(rand() * 5) + 11, 1, 100);
    }

    const isDropped = i < 3;
    const previousPosition = isDropped
      ? Math.max(1, position - Math.floor(rand() * 10 + 5))
      : position + Math.floor((rand() - 0.5) * 6);

    const searchVolume = Math.floor(Math.pow(10, rand() * 3 + 2));
    const difficulty = Math.floor(rand() * 80 + 10);
    const opportunityScore = Math.floor(
      ((100 - position) / 100) * (searchVolume / 100) * (1 - difficulty / 100) * 100
    );

    keywords.push({
      id: `kw_${i}_${Date.now()}`,
      keyword,
      current_position: position,
      previous_position: Math.max(1, previousPosition),
      search_volume: searchVolume,
      difficulty,
      opportunity_score: Math.min(100, opportunityScore),
      delta: previousPosition - position,
    });
  }

  return keywords.sort((a, b) => a.current_position - b.current_position);
}

function generateGscData(rand: () => number, domain: string, keywords: SyntheticKeyword[]): SyntheticGscRow[] {
  return keywords.slice(0, 100).map((kw) => {
    const impressions = Math.floor(kw.search_volume * (rand() * 0.3 + 0.1));
    const ctr = (rand() * 7 + 1) / 100;
    const clicks = Math.floor(impressions * ctr);
    return {
      query: kw.keyword,
      page: `https://${domain}/${kw.keyword.replace(/\s+/g, "-").toLowerCase()}/`,
      impressions,
      clicks,
      ctr: Math.round(ctr * 1000) / 10,
      position: kw.current_position,
    };
  });
}

function generateGA4Data(rand: () => number, sessionMultiplier: number): SyntheticGA4Row[] {
  const rows: SyntheticGA4Row[] = [];
  const totalMonthly = Math.floor((rand() * 45000 + 5000) * sessionMultiplier);

  for (let day = 29; day >= 0; day--) {
    const date = new Date();
    date.setDate(date.getDate() - day);
    const dateStr = date.toISOString().split("T")[0];
    const dailySessions = Math.floor(totalMonthly / 30 * (rand() * 0.6 + 0.7));
    const organicShare = rand() * 0.15 + 0.55;
    rows.push({
      date: dateStr,
      sessions: dailySessions,
      organic_sessions: Math.floor(dailySessions * organicShare),
      bounce_rate: Math.round((rand() * 30 + 40) * 10) / 10,
      conversions: Math.floor(dailySessions * (rand() * 0.02 + 0.02)),
    });
  }
  return rows;
}

// ─── Legacy export (unchanged signature, backward compat) ─────────────────────

export function generateSandboxData(template: SandboxTemplate, seed = 42): SyntheticSite {
  const rand = seededRandom(seed);
  const domain = DOMAINS.generic[Math.floor(rand() * DOMAINS.generic.length)];
  const keywordCount = template === "site_audit" ? 200 : template === "competitor_analysis" ? 150 : 100;
  const keywords = generateKeywords(rand, keywordCount, template, GENERIC_TOPICS, 0);
  const gsc_data = generateGscData(rand, domain, keywords);
  const ga4_data = generateGA4Data(rand, 1);

  const result: SyntheticSite = { domain, template, keywords, gsc_data, ga4_data };

  if (template === "competitor_analysis") {
    result.competitors = [
      {
        domain: DOMAINS.generic[Math.floor(rand() * DOMAINS.generic.length)],
        keywords: generateKeywords(rand, 120, template, GENERIC_TOPICS, 0),
        keyword_gap: generateKeywords(rand, 30, template, GENERIC_TOPICS, 0).map((k) => k.keyword),
      },
      {
        domain: DOMAINS.generic[Math.floor(rand() * DOMAINS.generic.length)],
        keywords: generateKeywords(rand, 100, template, GENERIC_TOPICS, 0),
        keyword_gap: generateKeywords(rand, 25, template, GENERIC_TOPICS, 0).map((k) => k.keyword),
      },
    ];
  }

  if (template === "content_strategy") {
    const clusterTopics = GENERIC_TOPICS.slice(0, 8);
    result.content_clusters = clusterTopics.map((topic) => ({
      topic,
      keywords: Array.from({ length: Math.floor(rand() * 5 + 3) }, () => {
        const t = GENERIC_KEYWORD_TEMPLATES[Math.floor(rand() * GENERIC_KEYWORD_TEMPLATES.length)];
        return t.replace("{topic}", topic.toLowerCase()).replace("{topic2}", "marketing");
      }),
      suggested_title: `The Complete Guide to ${topic} in 2024`,
      target_keyword: `${topic.toLowerCase()} guide`,
      estimated_traffic: Math.floor(rand() * 5000 + 500),
      priority: (["high", "medium", "low"] as const)[Math.floor(rand() * 3)],
    }));
  }

  return result;
}

// ─── New scenario-aware generator ─────────────────────────────────────────────

export function generateScenarioData(
  template: SandboxTemplate,
  seed: number,
  config?: ScenarioConfig
): SyntheticSiteV2 {
  const rand = seededRandom(seed);

  const industry = config?.industry ?? "saas";
  const profile = config?.dataProfile ?? "healthy";
  const mod = DATA_PROFILE_MODIFIERS[profile];

  // Pick domain from industry-specific list
  const industryDomains = DOMAINS[industry] ?? DOMAINS.generic;
  const baseDomain = config?.dataOverrides?.domain ??
    industryDomains[Math.floor(rand() * industryDomains.length)];

  // Pick topics
  const topics = INDUSTRY_TOPICS[industry] ?? GENERIC_TOPICS;

  // Keyword count
  const baseCount = config?.dataOverrides?.keyword_count ??
    (template === "site_audit" ? 200 : template === "competitor_analysis" ? 150 : 100);

  const keywords = generateKeywords(rand, baseCount, template, topics, mod.position_bias);
  const gsc_data = generateGscData(rand, baseDomain, keywords);
  const ga4_data = generateGA4Data(rand, mod.session_multiplier);

  // Competitors
  let competitors: SyntheticCompetitor[] | undefined;
  if (template === "competitor_analysis") {
    competitors = [
      {
        domain: industryDomains[Math.floor(rand() * industryDomains.length)],
        keywords: generateKeywords(rand, 120, template, topics, mod.position_bias + 3),
        keyword_gap: generateKeywords(rand, 30, template, topics, mod.position_bias).map((k) => k.keyword),
      },
      {
        domain: industryDomains[Math.floor(rand() * industryDomains.length)],
        keywords: generateKeywords(rand, 100, template, topics, mod.position_bias + 5),
        keyword_gap: generateKeywords(rand, 25, template, topics, mod.position_bias).map((k) => k.keyword),
      },
    ];
  }

  // Content clusters
  let content_clusters: ContentCluster[] | undefined;
  if (template === "content_strategy") {
    const clusterTopics = topics.slice(0, 8);
    content_clusters = clusterTopics.map((topic) => ({
      topic,
      keywords: Array.from({ length: Math.floor(rand() * 5 + 3) }, () => {
        const t = GENERIC_KEYWORD_TEMPLATES[Math.floor(rand() * GENERIC_KEYWORD_TEMPLATES.length)];
        return t.replace("{topic}", topic.toLowerCase()).replace("{topic2}", topics[Math.floor(rand() * topics.length)].toLowerCase());
      }),
      suggested_title: `The Complete Guide to ${topic} in 2024`,
      target_keyword: `${topic.toLowerCase()} guide`,
      estimated_traffic: Math.floor(rand() * 5000 + 500),
      priority: (["high", "medium", "low"] as const)[Math.floor(rand() * 3)],
    }));
  }

  // Rich data
  const technical_issues = generateTechnicalIssues(rand, baseDomain, mod.issue_count_multiplier);
  const backlinks = generateBacklinks(rand, profile, baseDomain);
  const geo_citations = generateGeoCitations(rand);
  const page_speed = generatePageSpeed(rand, profile);
  const crawl_errors = generateCrawlErrors(rand, baseDomain, mod.issue_count_multiplier);
  const schema_issues = generateSchemaIssues(rand, baseDomain, industry);

  // SEO health score
  const [hMin, hMax] = mod.health_score_range;
  const rawHealth = gaussianRandom(rand, (hMin + hMax) / 2, (hMax - hMin) / 4);
  const seo_health_score = config?.dataOverrides?.seo_health_score ??
    clamp(rawHealth, hMin, hMax);

  return {
    domain: baseDomain,
    template,
    keywords,
    gsc_data,
    ga4_data,
    competitors,
    content_clusters,
    seo_health_score,
    technical_issues,
    backlinks,
    geo_citations,
    page_speed,
    crawl_errors,
    schema_issues,
    industry,
    data_profile: profile,
  };
}
