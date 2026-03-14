import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const site_id = searchParams.get("site_id");
    const offset = (page - 1) * limit;

    const { data: profileData } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single();

    const profile = profileData as { org_id: string | null } | null;

    if (!profile?.org_id) {
      return NextResponse.json({ success: false, error: "No organization" }, { status: 403 });
    }

    // Get site IDs for this org first
    const { data: orgSites } = await supabase
      .from("sites")
      .select("id")
      .eq("org_id", profile.org_id);

    const siteIds = (orgSites ?? []).map((s: { id: string }) => s.id);

    if (siteIds.length === 0) {
      return NextResponse.json({ success: true, data: { runs: [], page, limit } });
    }

    let query = supabase
      .from("agent_runs")
      .select("*")
      .in("site_id", siteIds)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    let finalQuery = query;
    if (site_id) {
      finalQuery = query.eq("site_id", site_id);
    }

    const { data: runs, error } = await finalQuery;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { runs: runs ?? [], page, limit } });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to fetch runs" }, { status: 500 });
  }
}
