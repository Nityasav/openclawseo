import { createClient } from "@/lib/supabase/server";
import { listGscSites } from "@/lib/integrations/gsc";
import { decrypt } from "@/lib/encryption";
import { ensureUserProfile } from "@/lib/supabase/ensure-profile";
import { NextResponse } from "next/server";

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

    const orgId = profile?.org_id ?? await ensureUserProfile(user);
    if (!orgId) {
      return NextResponse.json({ success: false, error: "No organization found — please sign out and sign in again" }, { status: 403 });
    }

    const { data: integration } = await supabase
      .from("integrations")
      .select("access_token, refresh_token")
      .eq("org_id", orgId)
      .eq("provider", "gsc")
      .single();

    if (!integration?.access_token) {
      return NextResponse.json({ success: false, error: "GSC not connected" }, { status: 404 });
    }

    const accessToken = decrypt(integration.access_token);
    const refreshToken = integration.refresh_token ? decrypt(integration.refresh_token) : "";

    const sites = await listGscSites(accessToken, refreshToken);

    return NextResponse.json({
      success: true,
      data: sites.map((s) => ({
        siteUrl: s.siteUrl,
        permissionLevel: s.permissionLevel,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch GSC properties";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
