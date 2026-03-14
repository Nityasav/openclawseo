import { createClient } from "@/lib/supabase/server";
import { generateStructuredJSON } from "@/lib/gemini/generate";
import { PROMPT_KEYWORD_DISCOVERY } from "@/lib/gemini/prompts";
import { NextRequest, NextResponse } from "next/server";

interface KeywordResult {
  keyword: string;
  search_volume_estimate: number;
  difficulty_estimate: number;
  opportunity_score: number;
  reasoning: string;
  recommended_page: string;
}

async function fetchPageContent(domain: string): Promise<string> {
  try {
    const url = `https://${domain}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SEOBot/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
    const html = await res.text();
    // Strip HTML tags, collapse whitespace, take first 3000 chars
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 3000);
  } catch {
    return `Website: ${domain}`;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { siteId, domain } = await request.json();

    if (!siteId || !domain) {
      return NextResponse.json({ error: "siteId and domain are required" }, { status: 400 });
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch homepage content for context
    const websiteContent = await fetchPageContent(domain);

    const prompt = PROMPT_KEYWORD_DISCOVERY(
      domain,
      "Not yet available — no GA4 connected",
      "organic search",
      websiteContent
    );

    const keywords = await generateStructuredJSON<KeywordResult[]>(prompt);

    // Return without saving — user selects which ones in the UI, saved via /save
    return NextResponse.json({ keywords: keywords.slice(0, 50) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
