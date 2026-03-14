import { createClient } from "@/lib/supabase/server";
import { generateStructuredJSON } from "@/lib/gemini/generate";
import { PROMPT_LLM_CITATION_CHECK } from "@/lib/gemini/prompts";
import { NextResponse } from "next/server";

interface CitationResult {
  keyword: string;
  is_cited: boolean;
  citation_likelihood: number;
  reasoning: string;
  improvement_tip: string;
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

    // Get site
    const { data: sites } = await supabase
      .from("sites")
      .select("id, domain")
      .eq("org_id", profile.org_id)
      .eq("is_sandbox", false);

    const site = sites?.[0];
    if (!site?.domain) {
      return NextResponse.json({ success: false, error: "No site configured" }, { status: 404 });
    }

    // Get top keywords
    const { data: keywords } = await supabase
      .from("keywords")
      .select("keyword")
      .eq("site_id", site.id)
      .order("opportunity_score", { ascending: false })
      .limit(20);

    if (!keywords?.length) {
      return NextResponse.json({ success: false, error: "No keywords found. Discover keywords first." }, { status: 404 });
    }

    const keywordList = keywords.map((k) => k.keyword);

    // Process in batches of 10
    const allResults: CitationResult[] = [];
    for (let i = 0; i < keywordList.length; i += 10) {
      const batch = keywordList.slice(i, i + 10);
      const results = await generateStructuredJSON<CitationResult[]>(
        PROMPT_LLM_CITATION_CHECK(site.domain, batch)
      );
      allResults.push(...results);
    }

    // Upsert into geo_records
    const now = new Date().toISOString();
    const upsertData = allResults.map((r) => ({
      site_id: site.id,
      query: r.keyword,
      llm_source: "gemini" as const,
      is_cited: r.is_cited,
      citation_url: null,
      schema_injected: false,
      checked_at: now,
    }));

    for (let i = 0; i < upsertData.length; i += 20) {
      const batch = upsertData.slice(i, i + 20);
      await supabase.from("geo_records").insert(batch);
    }

    const citedCount = allResults.filter((r) => r.is_cited).length;

    return NextResponse.json({
      success: true,
      data: allResults,
      summary: {
        total_checked: allResults.length,
        total_cited: citedCount,
        citation_rate: allResults.length > 0 ? Math.round((citedCount / allResults.length) * 100) : 0,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to check citations";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
