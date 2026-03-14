import { createClient } from "@/lib/supabase/server";
import { fetchGA4Data } from "@/lib/integrations/ga4";
import { decrypt } from "@/lib/encryption";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const site_id = searchParams.get("site_id");
    const startDate = searchParams.get("start_date") ?? "30daysAgo";
    const endDate = searchParams.get("end_date") ?? "today";

    if (!site_id) return NextResponse.json({ success: false, error: "site_id required" }, { status: 400 });

    const { data: profile } = await supabase.from("profiles").select("org_id").eq("id", user.id).single();
    if (!profile?.org_id) return NextResponse.json({ success: false, error: "No org" }, { status: 403 });

    const { data: integration } = await supabase
      .from("integrations")
      .select("*")
      .eq("org_id", profile.org_id)
      .eq("provider", "ga4")
      .single();

    if (!integration?.access_token) {
      return NextResponse.json({ success: false, error: "GA4 not connected" }, { status: 404 });
    }

    const { data: site } = await supabase
      .from("sites")
      .select("ga4_property_id")
      .eq("id", site_id)
      .single();

    if (!site?.ga4_property_id) {
      return NextResponse.json({ success: false, error: "No GA4 property ID" }, { status: 404 });
    }

    const accessToken = decrypt(integration.access_token);
    const refreshToken = integration.refresh_token ? decrypt(integration.refresh_token) : "";
    const rows = await fetchGA4Data(accessToken, refreshToken, site.ga4_property_id, startDate, endDate);

    return NextResponse.json({ success: true, data: rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch GA4 data";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
