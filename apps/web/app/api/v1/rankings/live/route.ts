import { createClient } from "@/lib/supabase/server";
import { fetchGscData } from "@/lib/integrations/gsc";
import { decrypt } from "@/lib/encryption";
import { NextResponse } from "next/server";

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export async function GET() {
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

    const { data: integration } = await supabase
      .from("integrations")
      .select("access_token, refresh_token")
      .eq("org_id", profile.org_id)
      .eq("provider", "gsc")
      .single();

    if (!integration?.access_token) {
      return NextResponse.json({ success: false, error: "GSC not connected" }, { status: 404 });
    }

    const { data: sites } = await supabase
      .from("sites")
      .select("id, domain, gsc_property_url")
      .eq("org_id", profile.org_id)
      .eq("is_sandbox", false)
      .not("gsc_property_url", "is", null);

    const site = sites?.[0];
    if (!site?.gsc_property_url) {
      return NextResponse.json({ success: false, error: "No GSC property selected" }, { status: 404 });
    }

    const accessToken = decrypt(integration.access_token);
    const refreshToken = integration.refresh_token ? decrypt(integration.refresh_token) : "";

    const now = new Date();
    const currentEnd = new Date(now);
    currentEnd.setDate(currentEnd.getDate() - 3);
    const currentStart = new Date(currentEnd);
    currentStart.setDate(currentStart.getDate() - 7);
    const prevEnd = new Date(currentStart);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - 7);

    const [currentRows, prevRows] = await Promise.all([
      fetchGscData(accessToken, refreshToken, site.gsc_property_url, formatDate(currentStart), formatDate(currentEnd), { dimensions: ["query"], rowLimit: 500 }),
      fetchGscData(accessToken, refreshToken, site.gsc_property_url, formatDate(prevStart), formatDate(prevEnd), { dimensions: ["query"], rowLimit: 500 }),
    ]);

    const prevMap = new Map<string, { clicks: number; impressions: number; ctr: number; position: number }>();
    for (const row of prevRows) {
      const query = row.keys?.[0] ?? "";
      prevMap.set(query, {
        clicks: row.clicks ?? 0,
        impressions: row.impressions ?? 0,
        ctr: row.ctr ?? 0,
        position: row.position ?? 0,
      });
    }

    const rankings = [];
    for (const row of currentRows) {
      const query = row.keys?.[0] ?? "";
      const prev = prevMap.get(query);
      rankings.push({
        query,
        clicks: row.clicks ?? 0,
        impressions: row.impressions ?? 0,
        ctr: row.ctr ?? 0,
        position: row.position ?? 0,
        clicks_delta: (row.clicks ?? 0) - (prev?.clicks ?? 0),
        impressions_delta: (row.impressions ?? 0) - (prev?.impressions ?? 0),
        ctr_delta: (row.ctr ?? 0) - (prev?.ctr ?? 0),
        position_delta: (prev?.position ?? row.position ?? 0) - (row.position ?? 0),
      });
    }

    rankings.sort((a, b) => b.impressions - a.impressions);

    return NextResponse.json({ success: true, data: rankings, site_id: site.id, domain: site.domain });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch live rankings";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
