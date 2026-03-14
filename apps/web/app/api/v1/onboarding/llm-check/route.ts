import { createClient } from "@/lib/supabase/server";
import { generateStructuredJSON } from "@/lib/gemini/generate";
import { PROMPT_LLM_CITATION_CHECK } from "@/lib/gemini/prompts";
import { NextRequest, NextResponse } from "next/server";

interface LLMResult {
  keyword: string;
  is_cited: boolean;
  citation_likelihood: number;
  reasoning: string;
  improvement_tip: string;
}

export async function POST(request: NextRequest) {
  try {
    const { siteId, domain, keywords } = await request.json() as {
      siteId: string;
      domain: string;
      keywords: string[];
    };

    if (!siteId || !domain || !Array.isArray(keywords)) {
      return NextResponse.json({ error: "siteId, domain, and keywords are required" }, { status: 400 });
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const kws = keywords.slice(0, 15);
    const prompt = PROMPT_LLM_CITATION_CHECK(domain, kws);
    const results = await generateStructuredJSON<LLMResult[]>(prompt);

    // Save to geo_records
    const rows = results.map((r) => ({
      site_id: siteId,
      query: r.keyword,
      llm_source: "gemini",
      is_cited: r.is_cited,
      citation_url: null,
      schema_injected: false,
      checked_at: new Date().toISOString(),
    }));

    await supabase
      .from("geo_records")
      .upsert(rows, { onConflict: "site_id,query,llm_source" });

    return NextResponse.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Check failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
