import { createClient } from "@/lib/supabase/server";
import { listGscSites } from "@/lib/integrations/gsc";
import { decrypt } from "@/lib/encryption";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
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
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }

    const { data: integration } = await supabase
      .from("integrations")
      .select("access_token, refresh_token")
      .eq("org_id", profile.org_id)
      .eq("provider", "gsc")
      .single();

    if (!integration?.access_token || !integration?.refresh_token) {
      return NextResponse.json({ error: "GSC not connected" }, { status: 400 });
    }

    const accessToken = decrypt(integration.access_token);
    const refreshToken = decrypt(integration.refresh_token);
    const sites = await listGscSites(accessToken, refreshToken);

    return NextResponse.json({ sites });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch GSC sites";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }

    const body = await request.json();
    const siteUrl = body.site_url;
    if (!siteUrl) {
      return NextResponse.json({ error: "site_url is required" }, { status: 400 });
    }

    // Extract domain from site URL (e.g., "sc-domain:example.com" or "https://example.com/")
    const domain = siteUrl.startsWith("sc-domain:")
      ? siteUrl.replace("sc-domain:", "")
      : new URL(siteUrl).hostname;

    // Upsert site with GSC property URL
    const { error } = await supabase.from("sites").upsert(
      {
        org_id: profile.org_id,
        domain,
        gsc_property_url: siteUrl,
        is_sandbox: false,
      },
      { onConflict: "org_id,domain" }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, domain, gsc_property_url: siteUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save site";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
