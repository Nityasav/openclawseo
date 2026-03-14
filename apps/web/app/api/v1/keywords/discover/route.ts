import { createClient } from "@/lib/supabase/server";
import { fetchGA4Data } from "@/lib/integrations/ga4";
import { decrypt } from "@/lib/encryption";
import { generateStructuredJSON } from "@/lib/gemini/generate";
import { PROMPT_KEYWORD_DISCOVERY } from "@/lib/gemini/prompts";
import { NextResponse } from "next/server";

interface DiscoveredKeyword {
  keyword: string;
  search_volume_estimate: number;
  difficulty_estimate: number;
  opportunity_score: number;
  reasoning: string;
  recommended_page: string;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single();

    if (!profile?.org_id) {
      return NextResponse.json({ success: false, error: "No org" }, { status: 403 });
    }

    // Get GA4 integration
    const { data: integration } = await supabase
      .from("integrations")
      .select("access_token, refresh_token")
      .eq("org_id", profile.org_id)
      .eq("provider", "ga4")
      .single();

    // Get site
    const { data: sites } = await supabase
      .from("sites")
      .select("id, domain, ga4_property_id")
      .eq("org_id", profile.org_id)
      .eq("is_sandbox", false);

    const site = sites?.[0];
    if (!site?.domain) {
      return NextResponse.json({ success: false, error: "No site configured. Select a property in Settings." }, { status: 404 });
    }

    // Fetch GA4 data if available
    let ga4TopPages = "No GA4 data available";
    let trafficSources = "No GA4 data available";

    if (integration?.access_token && site.ga4_property_id) {
      try {
        const accessToken = decrypt(integration.access_token);
        const refreshToken = integration.refresh_token ? decrypt(integration.refresh_token) : "";

        const now = new Date();
        const endDate = now.toISOString().split("T")[0];
        const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

        const rows = await fetchGA4Data(accessToken, refreshToken, site.ga4_property_id, startDate, endDate);

        // Aggregate top pages by sessions
        const pageMap = new Map<string, number>();
        const sourceMap = new Map<string, number>();

        for (const row of rows) {
          const pagePath = row.dimensionValues?.[1]?.value ?? "";
          const source = row.dimensionValues?.[2]?.value ?? "";
          const sessions = parseInt(row.metricValues?.[0]?.value ?? "0", 10);

          pageMap.set(pagePath, (pageMap.get(pagePath) ?? 0) + sessions);
          sourceMap.set(source, (sourceMap.get(source) ?? 0) + sessions);
        }

        const topPages = [...pageMap.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 20);
        const topSources = [...sourceMap.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10);

        ga4TopPages = topPages.map(([path, sessions]) => `${path} — ${sessions} sessions`).join("\n");
        trafficSources = topSources.map(([source, sessions]) => `${source} — ${sessions} sessions`).join("\n");
      } catch {
        // GA4 fetch failed, continue with website scraping only
      }
    }

    // Scrape the website for content
    let websiteContent = "";
    const pagesToScrape = [`https://${site.domain}`];

    for (const url of pagesToScrape) {
      try {
        const response = await fetch(url, {
          headers: { "User-Agent": "OpenClawSEO Bot/1.0" },
          signal: AbortSignal.timeout(10000),
        });
        if (response.ok) {
          const html = await response.text();
          const text = stripHtml(html).slice(0, 4000);
          websiteContent += `\n--- ${url} ---\n${text}\n`;
        }
      } catch {
        // Skip if fetch fails
      }
    }

    if (!websiteContent && ga4TopPages === "No GA4 data available") {
      return NextResponse.json({ success: false, error: "Could not fetch GA4 data or website content. Ensure GA4 is connected or website is accessible." }, { status: 400 });
    }

    if (!websiteContent) {
      websiteContent = `Website at ${site.domain} — content could not be scraped. Use GA4 data and domain name to infer industry.`;
    }

    // Call Gemini for keyword discovery
    const keywords = await generateStructuredJSON<DiscoveredKeyword[]>(
      PROMPT_KEYWORD_DISCOVERY(site.domain, ga4TopPages, trafficSources, websiteContent)
    );

    // Upsert into keywords table
    const upsertData = keywords.map((kw) => ({
      site_id: site.id,
      keyword: kw.keyword,
      search_volume: kw.search_volume_estimate,
      difficulty: kw.difficulty_estimate,
      opportunity_score: kw.opportunity_score,
      source: "gemini_discovery",
      last_checked_at: new Date().toISOString(),
    }));

    // Upsert in batches
    for (let i = 0; i < upsertData.length; i += 20) {
      const batch = upsertData.slice(i, i + 20);
      await supabase
        .from("keywords")
        .upsert(batch, { onConflict: "site_id,keyword" });
    }

    return NextResponse.json({
      success: true,
      data: keywords,
      count: keywords.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to discover keywords";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
