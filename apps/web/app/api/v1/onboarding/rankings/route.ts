import { createClient } from "@/lib/supabase/server";
import { fetchGscData } from "@/lib/integrations/gsc";
import { decrypt } from "@/lib/encryption";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");

    if (!siteId) {
      return NextResponse.json({ error: "siteId is required" }, { status: 400 });
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single();

    if (!profile?.org_id) {
      return NextResponse.json({ hasGsc: false, rankings: [] });
    }

    const [{ data: integration }, { data: site }] = await Promise.all([
      supabase
        .from("integrations")
        .select("access_token, refresh_token")
        .eq("org_id", profile.org_id)
        .eq("provider", "gsc")
        .single(),
      supabase
        .from("sites")
        .select("gsc_property_url")
        .eq("id", siteId)
        .single(),
    ]);

    if (!integration?.access_token || !site?.gsc_property_url) {
      return NextResponse.json({ hasGsc: false, rankings: [] });
    }

    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() - 3); // GSC 3-day lag
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 28);

    const fmt = (d: Date) => d.toISOString().split("T")[0];

    const accessToken = decrypt(integration.access_token);
    const refreshToken = integration.refresh_token ? decrypt(integration.refresh_token) : "";

    const rows = await fetchGscData(
      accessToken,
      refreshToken,
      site.gsc_property_url,
      fmt(startDate),
      fmt(endDate),
      { dimensions: ["query"], rowLimit: 10 }
    );

    const rankings = rows.map((row) => ({
      query: row.keys?.[0] ?? "",
      position: Math.round((row.position ?? 0) * 10) / 10,
      clicks: row.clicks ?? 0,
      impressions: row.impressions ?? 0,
      ctr: row.ctr ?? 0,
    }));

    return NextResponse.json({ hasGsc: true, rankings });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
