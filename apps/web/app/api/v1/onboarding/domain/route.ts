import { createClient } from "@/lib/supabase/server";
import { ensureUserProfile } from "@/lib/supabase/ensure-profile";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { domain } = await request.json();

    if (!domain || typeof domain !== "string") {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 });
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

    const orgId = profile?.org_id ?? await ensureUserProfile(user);
    if (!orgId) {
      return NextResponse.json({ error: "Failed to create organization" }, { status: 500 });
    }

    // Check if site already exists for this org+domain
    const { data: existing } = await supabase
      .from("sites")
      .select("id")
      .eq("org_id", orgId)
      .eq("domain", domain)
      .maybeSingle();

    if (existing?.id) {
      return NextResponse.json({ siteId: existing.id, domain });
    }

    // Insert new site
    const { data: site, error } = await supabase
      .from("sites")
      .insert({ org_id: orgId, domain, is_sandbox: false })
      .select("id")
      .single();

    if (error || !site) {
      console.error("sites insert error:", error);
      return NextResponse.json({ error: error?.message ?? "Failed to save domain" }, { status: 500 });
    }

    return NextResponse.json({ siteId: site.id, domain });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("onboarding/domain error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
