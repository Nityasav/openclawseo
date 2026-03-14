// Synthetic data generator for sandbox environments
// Produces realistic SEO data without requiring real integrations

export type SandboxTemplate = "site_audit" | "competitor_analysis" | "content_strategy";

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

// Seeded pseudo-random number generator for deterministic sandbox data
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// Gaussian distribution approximation
function gaussianRandom(rand: () => number, mean: number, std: number): number {
  let u = 0, v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.round(mean + std * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v));
}

const KEYWORD_TEMPLATES = [
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
];

const TOPICS = [
  "SEO", "content marketing", "email marketing", "social media", "PPC",
  "link building", "technical SEO", "keyword research", "backlink analysis",
  "website audit", "page speed", "mobile optimization", "local SEO",
  "e-commerce SEO", "blog optimization", "meta tags", "schema markup",
];

const DOMAINS = [
  "growthspark.io", "rankboost.co", "seoedge.com", "digitalrise.io",
  "marketpulse.co", "searchpro.io", "rankmetrics.com", "seoflow.io",
];

function generateKeywords(rand: () => number, count: number, template: SandboxTemplate): SyntheticKeyword[] {
  const keywords: SyntheticKeyword[] = [];

  for (let i = 0; i < count; i++) {
    const topic = TOPICS[Math.floor(rand() * TOPICS.length)];
    const topic2 = TOPICS[Math.floor(rand() * TOPICS.length)];
    const kw_template = KEYWORD_TEMPLATES[Math.floor(rand() * KEYWORD_TEMPLATES.length)];
    const keyword = kw_template
      .replace("{topic}", topic.toLowerCase())
      .replace("{topic2}", topic2.toLowerCase());

    // Gaussian distribution centered at 18, std 12 (like a real mid-size site)
    let position = gaussianRandom(rand, 18, 12);
    position = Math.max(1, Math.min(100, position));

    // Deliberately place some at 11-15 (quick wins)
    if (i < Math.floor(count * 0.15)) {
      position = Math.floor(rand() * 5) + 11; // 11-15
    }

    // Deliberately place some with critical drops
    const isDropped = i < 3;
    const previousPosition = isDropped
      ? Math.max(1, position - Math.floor(rand() * 10 + 5))
      : position + Math.floor((rand() - 0.5) * 6);

    const searchVolume = Math.floor(Math.pow(10, rand() * 3 + 2)); // 100-10000
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
    const ctr = (rand() * 7 + 1) / 100; // 1-8%
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

function generateGA4Data(rand: () => number): SyntheticGA4Row[] {
  const rows: SyntheticGA4Row[] = [];
  const totalMonthly = Math.floor(rand() * 45000 + 5000); // 5k-50k

  for (let day = 29; day >= 0; day--) {
    const date = new Date();
    date.setDate(date.getDate() - day);
    const dateStr = date.toISOString().split("T")[0];

    const dailySessions = Math.floor(totalMonthly / 30 * (rand() * 0.6 + 0.7));
    const organicShare = rand() * 0.15 + 0.55; // 55-70%

    rows.push({
      date: dateStr,
      sessions: dailySessions,
      organic_sessions: Math.floor(dailySessions * organicShare),
      bounce_rate: Math.round((rand() * 30 + 40) * 10) / 10, // 40-70%
      conversions: Math.floor(dailySessions * (rand() * 0.02 + 0.02)), // 2-4%
    });
  }

  return rows;
}

export function generateSandboxData(template: SandboxTemplate, seed = 42): SyntheticSite {
  const rand = seededRandom(seed);
  const domain = DOMAINS[Math.floor(rand() * DOMAINS.length)];

  const keywordCount = template === "site_audit" ? 200 : template === "competitor_analysis" ? 150 : 100;
  const keywords = generateKeywords(rand, keywordCount, template);
  const gsc_data = generateGscData(rand, domain, keywords);
  const ga4_data = generateGA4Data(rand);

  const result: SyntheticSite = {
    domain,
    template,
    keywords,
    gsc_data,
    ga4_data,
  };

  if (template === "competitor_analysis") {
    result.competitors = [
      {
        domain: DOMAINS[Math.floor(rand() * DOMAINS.length)],
        keywords: generateKeywords(rand, 120, template),
        keyword_gap: generateKeywords(rand, 30, template).map((k) => k.keyword),
      },
      {
        domain: DOMAINS[Math.floor(rand() * DOMAINS.length)],
        keywords: generateKeywords(rand, 100, template),
        keyword_gap: generateKeywords(rand, 25, template).map((k) => k.keyword),
      },
    ];
  }

  if (template === "content_strategy") {
    const clusterTopics = TOPICS.slice(0, 8);
    result.content_clusters = clusterTopics.map((topic) => ({
      topic,
      keywords: Array.from({ length: Math.floor(rand() * 5 + 3) }, () => {
        const t = KEYWORD_TEMPLATES[Math.floor(rand() * KEYWORD_TEMPLATES.length)];
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
