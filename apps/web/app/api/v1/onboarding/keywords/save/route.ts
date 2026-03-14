import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface KeywordInput {
  keyword: string;
  search_volume_estimate: number;
  difficulty_estimate: number;
  opportunity_score: number;
}

export async function PATCH(request: NextRequest) {
  try {
    const { siteId, keywords } = await request.json() as {
      siteId: string;
      keywords: KeywordInput[];
    };

    if (!siteId || !Array.isArray(keywords)) {
      return NextResponse.json({ error: "siteId and keywords are required" }, { status: 400 });
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Insert keywords one by one, skipping duplicates
    let saved = 0;
    for (const k of keywords) {
      const { error } = await supabase
        .from("keywords")
        .insert({
          site_id: siteId,
          keyword: k.keyword,
          search_volume: k.search_volume_estimate ?? null,
          difficulty: k.difficulty_estimate ?? null,
          opportunity_score: k.opportunity_score ?? null,
          source: "discovery",
        });
      if (!error) saved++;
    }

    return NextResponse.json({ saved });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
