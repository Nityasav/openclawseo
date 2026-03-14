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

    const rows = keywords.map((k) => ({
      site_id: siteId,
      keyword: k.keyword,
      search_volume: k.search_volume_estimate ?? null,
      difficulty: k.difficulty_estimate ?? null,
      opportunity_score: k.opportunity_score ?? null,
      source: "discovery",
    }));

    const { error } = await supabase
      .from("keywords")
      .upsert(rows, { onConflict: "site_id,keyword" });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ saved: rows.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
